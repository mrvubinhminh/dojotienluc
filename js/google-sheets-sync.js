// ============================================================
// GOOGLE SHEETS SYNC
// ============================================================
const APPS_SCRIPT_CODE = `// V2 extension. The complete deployable script is generated in apps-script-v2.gs.
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
  const safe = s => String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num = v => { const n = Number(v); return isFinite(n) ? n : 0; };
  const gradeColor = v => v>=8?'#16a34a':v<5?'#dc2626':'#555';
  const gradeBadge = v => v>=8?' ⭐':v<5?' ⚠️':'';
  const dt = new Date(data.generatedAt||Date.now()).toLocaleDateString('vi-VN');

  let body = '';
  if (data.type === 'student') {
    const s = data.student;
    const pts = s.points||0;
    const msIcon = pts>=50?'👑':pts>=30?'🏆':pts>=15?'🥈':pts>=5?'⭐':'';
    const ptsColor = pts>0?'#16a34a':pts<0?'#dc2626':'#555';
    body = \`
<div class="header">
  \${/^https?:\\/\\//i.test(String(s.avatar||''))?'<img class="avatar" src="'+safe(s.avatar)+'">':''}
  <h1>\${safe(s.name)}</h1>
  <p>Lớp \${safe(data.className)} &nbsp;|&nbsp; STT: \${safe(s.stt)}</p>
  \${msIcon?'<p class="ms">'+msIcon+'</p>':''}
</div>
<div class="card">
  <h2>🏆 Điểm thi đua</h2>
  <div class="row"><span>Điểm cộng</span><span class="badge g">+\${s.positivePoints||0}</span></div>
  <div class="row"><span>Điểm trừ</span><span class="badge r">-\${s.negativePoints||0}</span></div>
  <div class="row"><b>Tổng điểm</b><b style="font-size:26px;color:\${ptsColor}">\${pts}</b></div>
  \${data.rank&&data.rank.total?'<div class="row"><span>Thứ hạng trong lớp</span><b style="font-size:20px;color:#4f46e5">'+num(data.rank.position)+'/'+num(data.rank.total)+'</b></div>'+(data.rank.nextRank?'<div class="row"><span>Cần thêm để bắt kịp hạng '+num(data.rank.nextRank)+'</span><b>'+num(data.rank.gapToNext)+' điểm</b></div>':'')+'<div class="row"><span>Trung bình lớp</span><span>'+num(data.rank.average)+'</span></div>':''}
</div>
\${data.grades&&data.grades.length?'<div class="card"><h2>📚 Kết quả học tập</h2>'+data.grades.map(g=>'<p class="period">'+safe(g.periodName)+'</p><table>'+Object.entries(g.grades).map(([sub,val])=>'<tr><td>'+safe(sub)+'</td><td style="font-weight:700;color:'+gradeColor(val)+'">'+val+gradeBadge(val)+'</td></tr>').join('')+'</table>').join('')+'</div>':''}
\${data.history&&data.history.length?'<div class="card"><h2>📋 Lịch sử gần đây</h2>'+data.history.slice(0,10).map(h=>'<div class="row"><span>'+safe(h.skillName)+'</span><span class="badge '+(h.points>0?'g':'r')+'">'+(h.points>0?'+':'')+h.points+'</span></div>').join('')+'</div>':''}
\`;
  } else if (data.type === 'class') {
    body = \`
<div class="header"><h1>🏅 Bảng xếp hạng</h1><p>Lớp \${safe(data.className)}</p></div>
<div class="card">
<table style="width:100%">
<tr style="background:#f0f4f8"><th>#</th><th style="text-align:left">Họ và tên</th><th>Điểm</th></tr>
\${(data.students||[]).map((s,i)=>'<tr><td style="text-align:center;color:#888">'+(num(s.rank)||(i+1))+'</td><td><b>'+safe(s.name)+'</b></td><td style="text-align:center;font-weight:800;color:'+(num(s.points)>0?'#16a34a':num(s.points)<0?'#dc2626':'#555')+'">'+num(s.points)+'</td></tr>').join('')}
</table></div>\`;
  }

  return \`<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;padding:16px;background:#f1f5f9;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1e293b}.header{background:linear-gradient(135deg,#1e40af,#7c3aed);color:#fff;border-radius:18px;padding:20px;text-align:center;margin:0 auto 14px;max-width:520px}.header h1{margin:6px 0 4px;font-size:22px}.header p{margin:0;opacity:.85;font-size:14px}.avatar{width:80px;height:80px;border-radius:50%;background:#dbeafe;object-fit:contain}.ms{font-size:28px}.card{background:#fff;border-radius:16px;padding:14px 16px;margin:0 auto 12px;max-width:520px;box-shadow:0 1px 6px rgba(0,0,0,.06)}.card h2{font-size:15px;margin:0 0 8px;color:#475569}.row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid #f1f5f9;font-size:14px}.row:last-child{border:none}.badge{font-weight:800;padding:2px 8px;border-radius:999px}.badge.g{color:#16a34a;background:#f0fdf4}.badge.r{color:#dc2626;background:#fef2f2}table{width:100%;border-collapse:collapse;font-size:14px}td,th{padding:7px 6px;border-bottom:1px solid #f1f5f9}.period{font-weight:700;color:#94a3b8;font-size:12px;margin:8px 0 2px}footer{text-align:center;font-size:12px;color:#94a3b8;margin-top:8px}</style>
</head><body>\${body}
<footer>📅 \${dt} &nbsp;|&nbsp; 🔒 Chỉ xem – Không thể chỉnh sửa</footer>
</body></html>\`;
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
    ['id','classId','stt','name','dob','points','positivePoints','negativePoints','avatar','hocTot','studentCode','baseName','nameSuffix'],
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
}`;

async function quickSync() {
    const btn   = document.getElementById('btnQuickSync');
    const icon  = document.getElementById('quickSyncIcon');
    const label = document.getElementById('quickSyncLabel');
    if (btn.disabled) return;
    btn.disabled = true;
    icon.className  = 'fas fa-spinner fa-spin text-base';
    label.innerText = 'Đang lưu...';
    try {
        const result = await syncRequest('push', { classes, students, history, periods, gradeRecords, subjectGrades, meetingNotes });
        if (result.status === 'ok') {
            syncSettings.lastSync = new Date().toISOString();
            saveData();
            icon.className  = 'fas fa-check text-base';
            label.innerText = 'Đã lưu!';
            showToast('Đồng bộ lên Google Sheets thành công! ☁️');
            setTimeout(() => {
                icon.className  = 'fas fa-cloud-upload-alt text-base';
                label.innerText = 'Lưu';
                btn.disabled = false;
            }, 2500);
        } else {
            throw new Error(result.message || 'Lỗi không xác định');
        }
    } catch(e) {
        icon.className  = 'fas fa-exclamation-circle text-base';
        label.innerText = 'Lỗi';
        showToast('Đồng bộ thất bại: ' + e.message, false);
        setTimeout(() => {
            icon.className  = 'fas fa-cloud-upload-alt text-base';
            label.innerText = 'Lưu';
            btn.disabled = false;
        }, 3000);
    }
}

function setSyncScriptCode() {
    const el = document.getElementById('syncScriptCode');
    if (el) el.textContent = APPS_SCRIPT_CODE;
}

// Extract Script ID from saved URL
function _syncUrlToId(url) {
    if (!url) return '';
    const m = url.match(/\/macros\/s\/([^/]+)\/exec/);
    return m ? m[1] : url; // fallback: show raw if format unknown
}
// Build full URL from Script ID ('' = chưa cài đồng bộ)
function _syncIdToUrl(id) {
    const trimmed = id.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('https://')) return trimmed; // already full URL
    return `https://script.google.com/macros/s/${trimmed}/exec`;
}

function openSyncModal() {
    setSyncScriptCode();
    const savedId = _syncUrlToId(syncSettings.url);
    document.getElementById('syncUrl').value = savedId;
    _syncUpdatePreview(savedId);
    document.getElementById('syncLastTime').innerText = syncSettings.lastSync
        ? `Lần cuối: ${new Date(syncSettings.lastSync).toLocaleString('vi-VN')}`
        : 'Chưa đồng bộ lần nào';
    document.getElementById('syncModal').classList.remove('hidden');
    setSyncStatus('', '');
    if (typeof renderPointOutboxPanel === 'function') renderPointOutboxPanel();
    // Listen for input to show preview
    const inp = document.getElementById('syncUrl');
    inp.oninput = () => _syncUpdatePreview(inp.value);
}
function _syncUpdatePreview(idVal) {
    const preview = document.getElementById('syncUrlPreview');
    const warning = document.getElementById('syncIdWarning');
    if (!preview) return;
    const trimmed = idVal.trim();
    const url = _syncIdToUrl(trimmed);
    if (trimmed) {
        preview.textContent = '→ ' + url;
        preview.classList.remove('hidden');
        // Validate: Deployment ID starts with AKfyc and is long
        const looksWrong = !trimmed.startsWith('https://') && (!trimmed.startsWith('AKfyc') || trimmed.length < 50);
        if (warning) warning.classList.toggle('hidden', !looksWrong);
    } else {
        preview.textContent = '→ Không đồng bộ (chỉ lưu trên máy này)';
        preview.classList.remove('hidden');
        if (warning) warning.classList.add('hidden');
    }
}

function closeSyncModal() {
    document.getElementById('syncModal').classList.add('hidden');
}

let _syncGuideUnlocked = false;
function toggleSyncGuide() {
    const icon = document.getElementById('syncGuideIcon');
    if (_syncGuideUnlocked) {
        const guide = document.getElementById('syncGuide');
        const hidden = guide.classList.toggle('hidden');
        icon.style.transform = hidden ? '' : 'rotate(180deg)';
        return;
    }
    // Show password gate
    const gate = document.getElementById('syncGuidePwGate');
    const isHidden = gate.classList.toggle('hidden');
    icon.style.transform = isHidden ? '' : 'rotate(180deg)';
    if (!isHidden) {
        document.getElementById('syncGuidePw').value='';
        document.getElementById('syncGuidePwErr').classList.add('hidden');
        setTimeout(()=>document.getElementById('syncGuidePw').focus(), 100);
    }
}
function checkSyncGuidePassword() {
    const pw = document.getElementById('syncGuidePw').value;
    if (pw.trim().toLowerCase() === 'thanh hoa') {
        _syncGuideUnlocked = true;
        document.getElementById('syncGuidePwGate').classList.add('hidden');
        document.getElementById('syncGuide').classList.remove('hidden');
        document.getElementById('syncGuideIcon').style.transform = 'rotate(180deg)';
        setSyncScriptCode();
        document.getElementById('syncGuidePwErr').classList.add('hidden');
    } else {
        document.getElementById('syncGuidePwErr').classList.remove('hidden');
        document.getElementById('syncGuidePw').select();
    }
}

function copySyncScript() {
    navigator.clipboard?.writeText(APPS_SCRIPT_CODE).then(()=>showToast('Đã sao chép code Apps Script!')).catch(()=>{
        const ta=document.createElement('textarea'); ta.value=APPS_SCRIPT_CODE;
        document.body.appendChild(ta); ta.select(); document.execCommand('copy');
        document.body.removeChild(ta); showToast('Đã sao chép!');
    });
}

let _scriptExpanded = false;
function toggleScriptExpand() {
    _scriptExpanded = !_scriptExpanded;
    const pre  = document.getElementById('syncScriptCode');
    const btn  = document.getElementById('scriptExpandBtn');
    const fade = document.getElementById('scriptFade');
    if (_scriptExpanded) {
        pre.style.maxHeight  = 'none';
        pre.style.overflowY  = 'visible';
        btn.innerHTML = '<i class="fas fa-compress-alt text-[9px]"></i> Thu gọn';
        fade.classList.add('hidden');
    } else {
        pre.style.maxHeight  = '320px';
        pre.style.overflowY  = 'auto';
        btn.innerHTML = '<i class="fas fa-expand-alt text-[9px]"></i> Mở rộng';
        fade.classList.remove('hidden');
    }
}

async function saveSyncUrl() {
    const idVal = document.getElementById('syncUrl').value.trim();
    const url = _syncIdToUrl(idVal);
    const changing = url !== syncSettings.url;
    // Còn giao dịch chưa gửi được lên máy chủ cũ (thường do máy chủ cũ không còn dùng): không chặn nữa,
    // cho chọn mang theo sang máy chủ mới hoặc để lại (xem/bỏ ở mục "Giao dịch điểm đang chờ").
    // Giao dịch lúc chưa cài đồng bộ (offline) thuộc dữ liệu riêng của máy này.
    let carried = [];
    const oldTarget = syncSettings.url;
    if (changing && syncSettings.url) {
        const pending = pendingPointBatches();
        if (pending.length) {
            const preview = pending.slice(0, 5).map(b => '• ' + describeOutboxBatch(b).text).join('\n');
            if (confirm(`Còn ${pending.length} giao dịch điểm chưa gửi được lên máy chủ cũ:\n${preview}${pending.length > 5 ? '\n…' : ''}\n\nOK = MANG THEO sang máy chủ mới (điểm này sẽ được cộng/trừ ở đó).\nHủy = để lại; có thể xem hoặc bỏ ở mục "Giao dịch điểm đang chờ".`)) carried = pending;
        }
    }
    const offlineBatches = changing && !syncSettings.url ? pendingPointBatches() : [];
    syncSettings.url = url;
    saveData();
    _syncUpdatePreview(idVal);
    if (!idVal) {
        setSyncStatus('ok','Đã tắt đồng bộ. Dữ liệu chỉ lưu trên máy này.');
        showToast('Đã tắt đồng bộ');
        return;
    }
    setSyncStatus('ok','Đã lưu Script ID!');
    showToast('Đã lưu Script ID của bạn!');
    if (changing) await _connectNewSyncTarget(offlineBatches, carried, oldTarget);
    if (typeof renderPointOutboxPanel === 'function') renderPointOutboxPanel();
}

// Máy vừa nhập key: máy chủ đã có dữ liệu thì tải toàn bộ lớp về (máy thứ hai, thứ ba...);
// máy chủ còn trống thì đưa dữ liệu của máy này lên làm bản đầu tiên.
async function _connectNewSyncTarget(offlineBatches, carried=[], oldTarget='') {
    // Giao dịch mang theo chỉ được đưa vào hàng đợi mới SAU khi đã nhận/lưu dữ liệu lớp của máy chủ mới.
    const moveCarried = () => { if (carried.length) { moveOutboxBatches(oldTarget, carried); scheduleAutoSync(); } };
    setSyncStatus('loading','Đang kiểm tra dữ liệu trên máy chủ...');
    try {
        const res = await rawSyncRequest('syncPoints', {protocol:POINT_PROTOCOL, batches:[]});
        if (res.protocol !== POINT_PROTOCOL || res.status !== 'ok' || !res.data) throw new Error(res.message || 'Cần triển khai Apps Script V2.');
        const d = res.data;
        const nClasses = (d.classes||[]).length, nStudents = (d.students||[]).length;
        if (nClasses || nStudents) {
            if (!confirm(`Máy chủ đã có ${nClasses} lớp, ${nStudents} học sinh.\n\nTải về máy này? Danh sách lớp đang có trên máy sẽ được thay bằng dữ liệu trên máy chủ.`)) {
                moveCarried();
                setSyncStatus('error','Chưa tải dữ liệu về. Bấm "Tải về" trước khi chấm điểm hoặc bấm Lưu trên máy này.');
                return;
            }
            capturePointChanges();
            _applyPulledData(d);
            moveCarried();
            renderClasses();
            setSyncStatus('ok',`✅ Đã tải ${nClasses} lớp, ${nStudents} học sinh về máy này.`);
            showToast('Đã tải dữ liệu lớp về máy này! 🎉');
            return;
        }
        // Máy chủ trống: lưu thông tin lớp trước, rồi mới gửi điểm đã chấm lúc chưa cài đồng bộ.
        await pushToGSheet();
        const offlinePrefix = 'dojo_point_outbox_v2:' + encodeURIComponent('offline') + ':';
        for (const b of offlineBatches) {
            localStorage.setItem(pointPrefix() + b.operationId, JSON.stringify(b));
            localStorage.removeItem(offlinePrefix + b.operationId);
        }
        if (offlineBatches.length) scheduleAutoSync();
        moveCarried();
    } catch(e) {
        moveCarried();   // giáo viên đã chọn mang theo: gửi khi kết nối được
        setSyncStatus('error', 'Không kết nối được: ' + e.message);
    }
}

function setSyncStatus(type, msg) {
    const badge = document.getElementById('syncStatusBadge');
    if (!msg) { badge.classList.add('hidden'); return; }
    badge.classList.remove('hidden');
    badge.className = `flex items-center gap-2 p-3 rounded-xl text-sm font-bold ${
        type==='ok' ? 'bg-green-50 text-green-700 border border-green-200' :
        type==='error' ? 'bg-red-50 text-red-700 border border-red-200' :
        'bg-blue-50 text-blue-700 border border-blue-200'
    }`;
    badge.innerHTML = `<i class="fas ${type==='ok'?'fa-check-circle':type==='error'?'fa-exclamation-circle':'fa-spinner fa-spin'}"></i> ${msg}`;
    if (type !== 'loading' && typeof renderPointOutboxPanel === 'function') renderPointOutboxPanel();
}

function setSyncBtnLoading(btnId, loading, originalHTML) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    if (loading) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Đang xử lý...';
    } else {
        btn.disabled = false;
        btn.innerHTML = originalHTML;
    }
}

// Manual metadata saves also flush points, but stale metadata is rejected by the server.
async function syncRequest(action, data=null) {
    if (action === 'push') {
        await flushPointTransactions();
        const baseRevision = JSON.parse(localStorage.getItem(pointRevisionKey()) || 'null');
        const result = await rawSyncRequest('push', {protocol:2, baseRevision, snapshot:data});
        if (result.protocol!==2) throw new Error('Cần triển khai Apps Script V2.');
        if (result.status==='ok') {
            localStorage.setItem(pointRevisionKey(), JSON.stringify(result.revision));
            if (typeof markMetadataSynced === 'function') markMetadataSynced();
        }
        return result;
    }
    const result = action === 'pull' ? await flushPointTransactions() : await rawSyncRequest(action, data);
    if (result.protocol!==2) throw new Error('Cần triển khai Apps Script V2 trước khi đồng bộ.');
    return result;
}

async function rawSyncRequest(action, data=null) {
    const url = syncSettings.url;
    if (!url) throw new Error('Chưa cài URL. Vui lòng nhập Deployment ID.');
    // Pull dùng GET (không có body, không bị mất dữ liệu qua redirect)
    if (action === 'pull') {
        const res = await fetch(url + '?action=pull', { redirect: 'follow' });
        const text = await res.text();
        if (!text || text.trim() === '') throw new Error('Script trả về rỗng — kiểm tra Authorization trong Apps Script Editor.');
        try { return JSON.parse(text); } catch { throw new Error('Phản hồi không hợp lệ: ' + text.substring(0,100)); }
    }
    // Push dùng POST với text/plain để tránh CORS preflight
    const body = JSON.stringify({ action, data });
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body,
        redirect: 'follow'
    });
    const text = await res.text();
    if (!text || text.trim() === '') throw new Error('Script trả về rỗng — kiểm tra Authorization trong Apps Script Editor.');
    try { return JSON.parse(text); } catch { throw new Error('Phản hồi không hợp lệ: ' + text.substring(0,100)); }
}

async function testSyncConnection() {
    const idVal = document.getElementById('syncUrl').value.trim();
    const tempUrl = idVal ? _syncIdToUrl(idVal) : syncSettings.url;
    if (!tempUrl) { setSyncStatus('error','Nhập Deployment ID trước!'); return; }
    setSyncStatus('loading','Đang kiểm tra kết nối...');
    try {
        // Dùng GET để tránh CORS redirect issue của GAS
        const res = await fetch(tempUrl + '?action=ping', { redirect: 'follow' });
        if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
                setSyncStatus('error', '⛔ Lỗi quyền truy cập ('+res.status+'). Kiểm tra: "Ai có quyền" phải là "Tất cả mọi người" (không phải có tài khoản Google).');
            } else {
                setSyncStatus('error', 'Lỗi HTTP ' + res.status + '. Script có thể chưa được triển khai.');
            }
            return;
        }
        const text = await res.text();
        if (!text || text.trim() === '') {
            setSyncStatus('error', '⚠️ Script trả về rỗng. Có thể chưa cấp quyền (Authorization). Hãy mở Apps Script Editor → chạy thử hàm doGet() một lần.');
            return;
        }
        let result;
        try { result = JSON.parse(text); } catch {
            setSyncStatus('error', 'Phản hồi không hợp lệ: ' + text.substring(0,80));
            return;
        }
        if (result.status === 'ok') setSyncStatus('ok','✅ Kết nối thành công! ' + (result.message||''));
        else setSyncStatus('error', 'Lỗi từ script: ' + (result.message||'unknown'));
    } catch(e) {
        setSyncStatus('error', 'Không kết nối được: ' + e.message + ' — Kiểm tra lại Deployment ID và quyền truy cập.');
    }
}

async function pushToGSheet() {
    if (!syncSettings.url) { setSyncStatus('error','Chưa lưu URL!'); return; }
    const orig = document.getElementById('btnPush').innerHTML;
    setSyncBtnLoading('btnPush', true, orig);
    setSyncStatus('loading','Đang đẩy dữ liệu lên...');
    try {
        const result = await syncRequest('push', { classes, students, history, periods, gradeRecords, subjectGrades, meetingNotes });
        if (result.status === 'ok') {
            syncSettings.lastSync = new Date().toISOString();
            saveData();
            document.getElementById('syncLastTime').innerText = `Lần cuối: ${new Date(syncSettings.lastSync).toLocaleString('vi-VN')}`;
            setSyncStatus('ok','✅ ' + (result.message||'Đẩy lên thành công!'));
            showToast('Đồng bộ lên Google Sheets thành công! 🎉');
        } else {
            setSyncStatus('error', 'Lỗi: ' + (result.message||''));
        }
    } catch(e) {
        setSyncStatus('error', e.message);
    }
    setSyncBtnLoading('btnPush', false, orig);
}

async function pullFromGSheet() {
    if (!syncSettings.url) { setSyncStatus('error','Chưa lưu URL!'); return; }
    if (!confirm('Tải thông tin lớp mới nhất về? Giao dịch điểm chưa gửi sẽ được giữ lại.')) return;
    capturePointChanges();
    const generation = _pointGeneration;
    const orig = document.getElementById('btnPull').innerHTML;
    setSyncBtnLoading('btnPull', true, orig);
    setSyncStatus('loading','Đang tải dữ liệu về...');
    try {
        const result = await syncRequest('pull');
        if (result.status === 'ok' && result.data) {
            if (generation !== _pointGeneration) throw new Error('Bạn vừa sửa điểm trong lúc tải. Vui lòng tải lại.');
            _applyPulledData(result.data);
            if (classes.length) currentClassId = classes[0].id;
            document.getElementById('syncLastTime').innerText = `Lần cuối: ${new Date(syncSettings.lastSync).toLocaleString('vi-VN')}`;
            setSyncStatus('ok','✅ Tải về thành công! Dữ liệu đã được cập nhật.');
            showToast('Tải về từ Google Sheets thành công! 🎉');
        } else {
            setSyncStatus('error','Lỗi: ' + (result.message||'Không có dữ liệu'));
        }
    } catch(e) {
        setSyncStatus('error', e.message);
    }
    setSyncBtnLoading('btnPull', false, orig);
}

