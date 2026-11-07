// V2 extension. The complete deployable script is generated in apps-script-v2.gs.
function withDojoLock(callback) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try { return callback(); }
  finally { SpreadsheetApp.flush(); lock.releaseLock(); }
}
function dojoRevision() {
  var ss=SpreadsheetApp.getActiveSpreadsheet(), sh=ss.getSheetByName('_DojoRevision');
  if (!sh) { sh=ss.insertSheet('_DojoRevision'); sh.getRange(1,1).setValue(0); }
  return Number(sh.getRange(1,1).getValue()) || 0;
}
function dojoSetRevision(n) {
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('_DojoRevision').getRange(1,1).setValue(n);
}
function dojoLedger() {
  var ss=SpreadsheetApp.getActiveSpreadsheet(), sh=ss.getSheetByName('_PointLedgerV2');
  if (!sh) { sh=ss.insertSheet('_PointLedgerV2'); sh.appendRow(['operationId','json']); }
  var rows=sh.getDataRange().getValues().slice(1).filter(function(r){return r[0];});
  var entries=rows.map(function(r){return JSON.parse(r.slice(1).join(''));});
  var opened={};
  entries.forEach(function(e){if(e.kind==='opening') opened[String(e.student.id)]=true;});
  // Opening balances preserve existing totals; legacy history is not used to recompute them.
  var missing=readLegacyData().students.filter(function(s){return !opened[String(s.id)];});
  if (missing.length) {
    var additions=missing.map(function(s){return {operationId:'opening:'+s.id,kind:'opening',student:s};});
    dojoAppend(sh,additions); entries=entries.concat(additions);
  }
  return {sheet:sh,entries:entries};
}
function dojoAppend(sh, entries) {
  if (!entries.length) return;
  var rows=entries.map(function(e){
    var json=JSON.stringify(e), cells=[e.operationId];
    for(var i=0;i<json.length;i+=40000) cells.push(json.slice(i,i+40000));
    return cells;
  });
  var width=Math.max.apply(null,rows.map(function(r){return r.length;}));
  if (sh.getMaxColumns()<width) sh.insertColumnsAfter(sh.getMaxColumns(),width-sh.getMaxColumns());
  rows.forEach(function(r){while(r.length<width) r.push('');});
  sh.getRange(sh.getLastRow()+1,1,rows.length,width).setValues(rows);
  SpreadsheetApp.flush();
}
function dojoSnapshot(ledger) {
  var d=readLegacyData(), totals={}, records={}, deleted={};
  ledger.entries.forEach(function(e){if(e.kind==='deleted') deleted[String(e.studentId)]=true;});
  (d.history||[]).forEach(function(h){records[String(h.id)]=h;});
  ledger.entries.forEach(function(e){
    if(e.kind==='opening') {
      var s=e.student;
      if(!deleted[String(s.id)] && !d.students.some(function(x){return String(x.id)===String(s.id);})) d.students.push(s);
    }
  });
  // Ledger order matters: an opening appended after an old reset must not be zeroed by it.
  ledger.entries.forEach(function(e){
    if(e.kind==='opening') {
      var o=e.student, ok=String(o.id);
      if(!totals[ok]) totals[ok]={points:Number(o.points)||0,positivePoints:Number(o.positivePoints)||0,negativePoints:Number(o.negativePoints)||0};
      return;
    }
    if(e.kind) return;
    if(e.type==='classReset') {
      d.students.filter(function(s){return String(s.classId)===String(e.classId);}).forEach(function(s){
        var t=totals[String(s.id)];
        if(!t) return;
        var id=e.operationId+':'+s.id;
        records[id]={id:id,classId:s.classId,studentId:s.id,studentName:s.name,skillName:e.reason||'Reset điểm lớp về 0',points:-t.points,type:'reset',timestamp:e.timestamp};
        t.points=0;t.positivePoints=0;t.negativePoints=0;
      });
      return;
    }
    e.changes.forEach(function(c,i){
      var key=String(c.studentId);
      if (!totals[key]) totals[key]={points:Number(c.opening.points)||0,positivePoints:Number(c.opening.positivePoints)||0,negativePoints:Number(c.opening.negativePoints)||0};
      var t=totals[key]; t.points+=c.delta; t.positivePoints+=c.positiveDelta; t.negativePoints+=c.negativeDelta;
      var hs=c.history&&c.history.length ? c.history : [{id:e.operationId+':'+i,classId:c.classId,studentId:c.studentId,studentName:c.studentName,skillName:'Điều chỉnh / hoàn tác điểm',points:c.delta,timestamp:e.timestamp}];
      hs.forEach(function(h){records[String(h.id)]=h;});
      if(!deleted[key] && !d.students.some(function(s){return String(s.id)===key;})) {
        d.students.push(Object.assign({},c.opening,{id:c.studentId,classId:c.classId,name:c.studentName}));
      }
    });
  });
  d.students=d.students.map(function(s){return Object.assign({},s,totals[String(s.id)]||{});});
  d.history=Object.keys(records).map(function(k){return records[k];});
  d.appliedOperationIds=ledger.entries.filter(function(e){return !e.kind;}).map(function(e){return e.operationId;});
  d.revision=dojoRevision();
  return d;
}
// Keep visible Students columns consistent with the authoritative ledger.
function dojoWritePointProjection(data) {
  var sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Students');
  if(!sh || sh.getLastRow()<2) return;
  var rows=sh.getDataRange().getValues(), headers=rows[0], idCol=headers.indexOf('id'), byId={};
  if(idCol<0) return;
  data.students.forEach(function(s){byId[String(s.id)]=s;});
  ['points','positivePoints','negativePoints'].forEach(function(key){
    var col=headers.indexOf(key);
    if(col<0) return;
    var values=rows.slice(1).map(function(row){var s=byId[String(row[idCol])];return [s?s[key]:row[col]];});
    sh.getRange(2,col+1,values.length,1).setValues(values);
  });
  SpreadsheetApp.flush();
}
function dojoValidateBatch(b) {
  if (!b || typeof b.operationId!=='string' || !/^[a-zA-Z0-9-]{10,100}$/.test(b.operationId) || !Array.isArray(b.changes) || (!b.changes.length && b.type!=='classReset')) throw new Error('Giao dịch không hợp lệ');
  if(b.type && b.type!=='classReset') throw new Error('Loại giao dịch không hợp lệ');
  if(b.type==='classReset' && (b.classId===undefined || b.classId===null || String(b.classId)==='')) throw new Error('Thiếu lớp cần reset');
  if(b.type==='classReset' && b.changes.length) throw new Error('Lệnh reset không được kèm thay đổi điểm');
  b.changes.forEach(function(c){
    if (!c.opening || c.studentId===undefined || String(c.opening.id)!==String(c.studentId)) throw new Error('Thiếu học sinh');
    [c.delta,c.positiveDelta,c.negativeDelta,c.opening.points,c.opening.positivePoints,c.opening.negativePoints].forEach(function(n){if(typeof n!=='number'||!isFinite(n)) throw new Error('Điểm không hợp lệ');});
    if(Math.abs(c.delta-(c.positiveDelta-c.negativeDelta))>0.0000001) throw new Error('Tổng điểm không khớp điểm cộng/trừ');
  });
}
function doPost(e) {
  try {
    var p=JSON.parse(e.postData.contents);
    if (!p.data || p.data.protocol!==2) return respond({status:'error',protocol:2,message:'Ứng dụng cũ đã bị chặn để tránh ghi đè. Hãy tải lại ứng dụng V2.'});
    return withDojoLock(function(){
      var ledger=dojoLedger(), d=p.data;
      if(p.action==='syncPoints') {
        if(!Array.isArray(d.batches)) throw new Error('Thiếu danh sách giao dịch');
        var known={}; ledger.entries.forEach(function(b){known[b.operationId]=JSON.stringify(b);});
        var fresh=[], opened={}, deleted={};
        ledger.entries.forEach(function(e){if(e.kind==='opening') opened[String(e.student.id)]=true; if(e.kind==='deleted') deleted[String(e.studentId)]=true;});
        d.batches.forEach(function(b){
          dojoValidateBatch(b);
          b.changes.forEach(function(c){if(deleted[String(c.studentId)]) throw new Error('Học sinh đã bị xóa. Giao dịch chưa gửi vẫn được giữ trên thiết bị.');});
          if(known[b.operationId]) {
            if(known[b.operationId]!==JSON.stringify(b)) throw new Error('Mã giao dịch bị trùng với nội dung khác');
          } else {
            b.changes.forEach(function(c){
              if(!opened[String(c.studentId)]) {fresh.push({kind:'opening',operationId:'opening:'+c.studentId,student:c.opening});opened[String(c.studentId)]=true;}
            });
            known[b.operationId]=JSON.stringify(b);fresh.push(b);
          }
        });
        dojoAppend(ledger.sheet,fresh); ledger.entries=ledger.entries.concat(fresh);
        var snapshot=dojoSnapshot(ledger);
        if(fresh.length) dojoWritePointProjection(snapshot);
        return respond({status:'ok',protocol:2,data:snapshot});
      }
      if(p.action==='push') {
        var current=dojoSnapshot(ledger), rev=dojoRevision();
        if(d.baseRevision!==rev && !(d.baseRevision===null && !current.students.length && !current.classes.length)) return respond({status:'conflict',protocol:2,message:'Thông tin lớp đã thay đổi hoặc chưa tải bản V2. Điểm đã được lưu riêng. Hãy tải dữ liệu mới về trước khi sửa/lưu thông tin lớp.'});
        var snapshot=d.snapshot;
        if(!snapshot || !Array.isArray(snapshot.students)) throw new Error('Thiếu dữ liệu');
        // Scores and history from a client snapshot never overwrite authoritative point data.
        snapshot.students=snapshot.students.map(function(s){
          var authoritative=current.students.find(function(x){return String(x.id)===String(s.id);});
          return Object.assign({},s,{points:authoritative?authoritative.points:0,positivePoints:authoritative?authoritative.positivePoints:0,negativePoints:authoritative?authoritative.negativePoints:0});
        });
        snapshot.history=current.history;
        // Invalidate other snapshots before a potentially interrupted multi-sheet metadata write.
        dojoSetRevision(rev+1); SpreadsheetApp.flush();
        var removed=current.students.filter(function(s){return !snapshot.students.some(function(x){return String(x.id)===String(s.id);});});
        dojoAppend(ledger.sheet,removed.map(function(s){return {kind:'deleted',operationId:'delete:'+(rev+1)+':'+s.id,studentId:s.id};}));
        writeAllData(snapshot);
        return respond({status:'ok',protocol:2,revision:rev+1,message:'Đã lưu thông tin lớp và giao dịch điểm.'});
      }
      return respond({status:'error',protocol:2,message:'Unknown action'});
    });
  } catch(err) {return respond({status:'error',protocol:2,message:String(err)});}
}
function dojoPull() {
  try {return withDojoLock(function(){return respond({status:'ok',protocol:2,data:dojoSnapshot(dojoLedger())});});}
  catch(err){return respond({status:'error',protocol:2,message:String(err)});}
}

// ============================================
// DÁN VÀO APPS SCRIPT – LƯU – TRIỂN KHAI WEB APP
// (Ai cũng có thể truy cập – không cần đăng nhập)
// ============================================

function doGet(e) {
  if (e.parameter.action === 'ping') return respond({ status:'ok', message:'Kết nối thành công!' });
  if (e.parameter.action === 'pull') return dojoPull();

  // ── Google Classroom: danh sách lớp đang dạy ──
  if (e.parameter.action === 'listClasses') {
    try {
      const res = Classroom.Courses.list({ teacherId: 'me', courseStates: ['ACTIVE'], pageSize: 30 });
      const courses = (res.courses || []).map(c => ({
        id: c.id, name: c.name, section: c.section || '', room: c.room || ''
      }));
      return respond({ status:'ok', data: courses });
    } catch(err) {
      return respond({ status:'error', message: 'Cần bật Google Classroom API trong Dịch vụ: ' + err.message });
    }
  }

  // ── Google Classroom: danh sách học sinh theo lớp ──
  if (e.parameter.action === 'importClass') {
    const courseId = e.parameter.courseId;
    if (!courseId) return respond({ status:'error', message:'Thiếu courseId' });
    try {
      const res = Classroom.Courses.Students.list(courseId, { pageSize: 200 });
      const students = (res.students || []).map(s => ({
        name: s.profile.name.fullName,
        email: s.profile.emailAddress || ''
      }));
      return respond({ status:'ok', data: students });
    } catch(err) {
      return respond({ status:'error', message: err.message });
    }
  }
  // Viewer mode for students/parents
  if (e.parameter.view) {
    try {
      const json = Utilities.newBlob(Utilities.base64Decode(e.parameter.view)).getDataAsString('UTF-8');
      const data = JSON.parse(decodeURIComponent(json));
      const html = HtmlService.createHtmlOutput(buildViewHtml(data))
        .setTitle('Xem điểm – ' + (data.className||'Lớp học'))
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      return html;
    } catch(err) {
      return HtmlService.createHtmlOutput('<p style="font-family:sans-serif;padding:20px;color:#c00">Link không hợp lệ hoặc đã hết hạn.<br>' + err + '</p>').setTitle('Lỗi');
    }
  }
  return respond({ status:'ok', message:'Ứng dụng Quản lý lớp học đang hoạt động!' });
}

function buildViewHtml(data) {
  const safe = s => String(s||'').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const gradeColor = v => v>=8?'#16a34a':v<5?'#dc2626':'#555';
  const gradeBadge = v => v>=8?' ⭐':v<5?' ⚠️':'';
  const dt = new Date(data.generatedAt||Date.now()).toLocaleDateString('vi-VN');

  let body = '';
  if (data.type === 'student') {
    const s = data.student;
    const pts = s.points||0;
    const msIcon = pts>=50?'👑':pts>=30?'🏆':pts>=15?'🥈':pts>=5?'⭐':'';
    const ptsColor = pts>0?'#16a34a':pts<0?'#dc2626':'#555';
    body = `
<div class="header">
  <img class="avatar" src="${safe(s.avatar)}" onerror="this.src='data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 80 80\"><circle cx=\"40\" cy=\"40\" r=\"40\" fill=\"%23dbeafe\"/><text x=\"50%\" y=\"55%\" dominant-baseline=\"middle\" text-anchor=\"middle\" font-size=\"32\" fill=\"%2333a3dc\">${safe(s.name||'').charAt(0)}</text></svg>'">
  <h1>${safe(s.name)}</h1>
  <p>Lớp ${safe(data.className)} &nbsp;|&nbsp; STT: ${safe(s.stt)}</p>
  ${msIcon?'<p class="ms">'+msIcon+'</p>':''}
</div>
<div class="card">
  <h2>🏆 Điểm thi đua</h2>
  <div class="row"><span>Điểm cộng</span><span class="badge g">+${s.positivePoints||0}</span></div>
  <div class="row"><span>Điểm trừ</span><span class="badge r">-${s.negativePoints||0}</span></div>
  <div class="row"><b>Tổng điểm</b><b style="font-size:26px;color:${ptsColor}">${pts}</b></div>
</div>
${data.grades&&data.grades.length?'<div class="card"><h2>📚 Kết quả học tập</h2>'+data.grades.map(g=>'<p class="period">'+safe(g.periodName)+'</p><table>'+Object.entries(g.grades).map(([sub,val])=>'<tr><td>'+safe(sub)+'</td><td style="font-weight:700;color:'+gradeColor(val)+'">'+val+gradeBadge(val)+'</td></tr>').join('')+'</table>').join('')+'</div>':''}
${data.history&&data.history.length?'<div class="card"><h2>📋 Lịch sử gần đây</h2>'+data.history.slice(0,10).map(h=>'<div class="row"><span>'+safe(h.skillName)+'</span><span class="badge '+(h.points>0?'g':'r')+'">'+(h.points>0?'+':'')+h.points+'</span></div>').join('')+'</div>':''}
`;
  } else if (data.type === 'class') {
    body = `
<div class="header"><h1>🏅 Bảng xếp hạng</h1><p>Lớp ${safe(data.className)}</p></div>
<div class="card">
<table style="width:100%">
<tr style="background:#f0f4f8"><th>#</th><th style="text-align:left">Họ và tên</th><th>Điểm</th></tr>
${(data.students||[]).map((s,i)=>'<tr><td style="text-align:center;color:#888">'+(i+1)+'</td><td><b>'+safe(s.name)+'</b></td><td style="text-align:center;font-weight:800;color:'+(s.points>0?'#16a34a':s.points<0?'#dc2626':'#555')+'">'+s.points+'</td></tr>').join('')}
</table></div>`;
  }

  return `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
</head><body>${body}
<footer>📅 ${dt} &nbsp;|&nbsp; 🔒 Chỉ xem – Không thể chỉnh sửa</footer>
</body></html>`;
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function writeAllData(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // --- Lớp học ---
  writeSheet(ss, 'Classes', ['id','name'], data.classes||[]);

  // --- Học sinh ---
  writeSheet(ss, 'Students',
    ['id','classId','stt','name','dob','points','positivePoints','negativePoints','avatar','hocTot'],
    data.students||[]);

  // --- Lịch sử cho điểm ---
  writeSheet(ss, 'History',
    ['id','classId','studentId','studentName','skillName','points','timestamp','type'],
    data.history||[]);

  // --- Đợt đánh giá ---
  writeSheet(ss, 'Periods',
    ['id','classId','name','endDate'],
    (data.periods||[]).map(p=>({...p, students:undefined})));

  // --- Điểm số THPT (tất cả môn) ---
  const allSubjects = ['Toán','Ngữ văn','Tiếng Anh','Vật lí','Hóa học','Sinh học',
                       'Lịch sử','Địa lí','GDCD','Tin học','Công nghệ','Thể dục','GDQPAN'];
  const grCols = ['periodId','periodName','classId','createdAt','studentId','studentName','stt',...allSubjects];
  const grRows = [];
  (data.gradeRecords||[]).forEach(rec => {
    (rec.studentGrades||[]).forEach(sg => {
      const row = { periodId:rec.id, periodName:rec.periodName, classId:rec.classId,
                    createdAt:rec.createdAt, studentId:sg.studentId||'', studentName:sg.name, stt:sg.stt||'' };
      allSubjects.forEach(sub => { row[sub] = sg.grades&&sg.grades[sub]!==undefined ? sg.grades[sub] : ''; });
      grRows.push(row);
    });
  });
  writeSheet(ss, 'GradeRecords', grCols, grRows);

  // --- Sổ điểm bộ môn ---
  const sgCols = ['recId','classId','subject','semester','txCount','updatedAt',
                  'studentId','studentName','stt',
                  'tx1','tx2','tx3','tx4','tx5','tx6','gk','ck','dtb'];
  const sgRows = [];
  (data.subjectGrades||[]).forEach(rec => {
    (rec.rows||[]).forEach(r => {
      const tx = r.tx||[];
      const dtbVal = r.dtb && typeof r.dtb==='object' ? r.dtb.val : (r.dtb||'');
      sgRows.push({
        recId: rec.id, classId: rec.classId, subject: rec.subject,
        semester: rec.semester, txCount: rec.txCount||2, updatedAt: rec.updatedAt||'',
        studentId: r.studentId||'', studentName: r.name||'', stt: r.stt||0,
        tx1:tx[0]!==undefined?tx[0]:'', tx2:tx[1]!==undefined?tx[1]:'',
        tx3:tx[2]!==undefined?tx[2]:'', tx4:tx[3]!==undefined?tx[3]:'',
        tx5:tx[4]!==undefined?tx[4]:'', tx6:tx[5]!==undefined?tx[5]:'',
        gk: r.gk!==undefined&&r.gk!==''?r.gk:'',
        ck: r.ck!==undefined&&r.ck!==''?r.ck:'',
        dtb: dtbVal
      });
    });
  });
  writeSheet(ss, 'SubjectGrades', sgCols, sgRows);

  // --- Sổ họp & Ghi chú ---
  const mnCols = ['id','date','title','tag','important','archived','archivedAt','createdAt','items'];
  const mnRows = (data.meetingNotes||[]).map(n => ({
    ...n, important: n.important?'TRUE':'FALSE', archived: n.archived?'TRUE':'FALSE',
    items: JSON.stringify(n.items||[])
  }));
  writeSheet(ss, 'MeetingNotes', mnCols, mnRows);
}

function writeSheet(ss, name, cols, rows) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  sheet.clearContents();
  sheet.appendRow(cols);
  if (rows.length) {
    const data = rows.map(r => cols.map(c => r[c]!==undefined&&r[c]!==null ? r[c] : ''));
    sheet.getRange(2,1,data.length,cols.length).setValues(data);
  }
  // Auto-resize columns
  try { sheet.autoResizeColumns(1, cols.length); } catch(e) {}
}

function readLegacyData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const classes  = readSheet(ss,'Classes');
  const students = readSheet(ss,'Students').map(s=>({
    ...s, id:+s.id, classId:+s.classId, stt:+s.stt,
    points:+s.points, positivePoints:+s.positivePoints, negativePoints:+s.negativePoints
  }));
  const history  = readSheet(ss,'History').map(h=>({
    ...h, id:String(h.id||''), classId:+h.classId, studentId:+h.studentId, points:+h.points
  }));
  const periods  = readSheet(ss,'Periods').map(p=>({...p, id:+p.id, classId:+p.classId, students:[]}));

  // GradeRecords
  const allSubjects=['Toán','Ngữ văn','Tiếng Anh','Vật lí','Hóa học','Sinh học',
                     'Lịch sử','Địa lí','GDCD','Tin học','Công nghệ','Thể dục','GDQPAN'];
  const gradeRows = readSheet(ss,'GradeRecords');
  const recMap = {};
  gradeRows.forEach(r => {
    if (!recMap[r.periodId]) recMap[r.periodId]={id:+r.periodId,classId:+r.classId,periodName:r.periodName,createdAt:r.createdAt,studentGrades:[]};
    const grades={};
    allSubjects.forEach(sub=>{ if(r[sub]!==''&&r[sub]!==undefined) grades[sub]=+r[sub]; });
    recMap[r.periodId].studentGrades.push({studentId:r.studentId?+r.studentId:null,name:r.studentName,stt:+r.stt||0,grades});
  });
  const gradeRecords = Object.values(recMap);

  // SubjectGrades
  const sgRows = readSheet(ss,'SubjectGrades');
  const sgMap = {};
  sgRows.forEach(r => {
    const key = r.recId+'_'+r.classId;
    if (!sgMap[key]) sgMap[key]={ id:r.recId, classId:r.classId, subject:r.subject,
      semester:r.semester, txCount:+r.txCount||2, updatedAt:r.updatedAt, rows:[] };
    const tx=[];
    ['tx1','tx2','tx3','tx4','tx5','tx6'].forEach((k,i)=>{ if(r[k]!==''&&r[k]!==undefined) tx[i]=+r[k]; });
    sgMap[key].rows.push({
      studentId:r.studentId||null, name:r.studentName, stt:+r.stt||0, tx,
      gk:r.gk!==''&&r.gk!==undefined?+r.gk:'',
      ck:r.ck!==''&&r.ck!==undefined?+r.ck:'',
      dtb:r.dtb!==''&&r.dtb!==undefined?+r.dtb:''
    });
  });
  const subjectGrades = Object.values(sgMap);

  // MeetingNotes
  const mnRows = readSheet(ss,'MeetingNotes');
  const meetingNotes = mnRows.map(r => ({
    ...r,
    important: r.important==='TRUE'||r.important===true,
    archived:  r.archived==='TRUE'||r.archived===true,
    items: (() => { try { return JSON.parse(r.items||'[]'); } catch(e){ return []; } })()
  }));

  return { classes, students, history, periods, gradeRecords, subjectGrades, meetingNotes };
}

function readSheet(ss, name) {
  const sheet=ss.getSheetByName(name); if(!sheet) return [];
  const data=sheet.getDataRange().getValues(); if(data.length<2) return [];
  const headers=data[0];
  return data.slice(1).filter(r=>r.some(c=>c!=='')).map(row=>{
    const obj={}; headers.forEach((h,i)=>{ if(h) obj[h]=row[i]===''?'':row[i]; }); return obj;
  });
}