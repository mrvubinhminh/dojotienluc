// ============================================================
// GOOGLE SHEETS SYNC
// ============================================================
const APPS_SCRIPT_CODE = `// ============================================
// DÁN VÀO APPS SCRIPT – LƯU – TRIỂN KHAI WEB APP
// (Ai cũng có thể truy cập – không cần đăng nhập)
// ============================================

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    if (payload.action === 'push') {
      writeAllData(payload.data);
      return respond({ status:'ok', message:'Đồng bộ thành công!', time: new Date().toISOString() });
    }
    if (payload.action === 'pull') {
      return respond({ status:'ok', data: readAllData() });
    }
    if (payload.action === 'ping') {
      return respond({ status:'ok', message:'Kết nối thành công!' });
    }
    return respond({ status:'error', message:'Unknown action' });
  } catch(err) {
    return respond({ status:'error', message: err.toString() });
  }
}

function doGet(e) {
  if (e.parameter.action === 'ping') return respond({ status:'ok', message:'Kết nối thành công!' });
  if (e.parameter.action === 'pull') return respond({ status:'ok', data: readAllData() });

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
    body = \`
<div class="header">
  <img class="avatar" src="\${safe(s.avatar)}" onerror="this.src='data:image/svg+xml,<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 80 80\\"><circle cx=\\"40\\" cy=\\"40\\" r=\\"40\\" fill=\\"%23dbeafe\\"/><text x=\\"50%\\" y=\\"55%\\" dominant-baseline=\\"middle\\" text-anchor=\\"middle\\" font-size=\\"32\\" fill=\\"%2333a3dc\\">\${safe(s.name||'').charAt(0)}</text></svg>'">
  <h1>\${safe(s.name)}</h1>
  <p>Lớp \${safe(data.className)} &nbsp;|&nbsp; STT: \${safe(s.stt)}</p>
  \${msIcon?'<p class="ms">'+msIcon+'</p>':''}
</div>
<div class="card">
  <h2>🏆 Điểm thi đua</h2>
  <div class="row"><span>Điểm cộng</span><span class="badge g">+\${s.positivePoints||0}</span></div>
  <div class="row"><span>Điểm trừ</span><span class="badge r">-\${s.negativePoints||0}</span></div>
  <div class="row"><b>Tổng điểm</b><b style="font-size:26px;color:\${ptsColor}">\${pts}</b></div>
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
\${(data.students||[]).map((s,i)=>'<tr><td style="text-align:center;color:#888">'+(i+1)+'</td><td><b>'+safe(s.name)+'</b></td><td style="text-align:center;font-weight:800;color:'+(s.points>0?'#16a34a':s.points<0?'#dc2626':'#555')+'">'+s.points+'</td></tr>').join('')}
</table></div>\`;
  }

  return \`<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
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
    ['id','classId','stt','name','dob','points','positivePoints','negativePoints','avatar','hocTot'],
    data.students||[]);

  // --- Lịch sử cho điểm ---
  writeSheet(ss, 'History',
    ['id','classId','studentId','studentName','skillName','points','timestamp'],
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

function readAllData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const classes  = readSheet(ss,'Classes');
  const students = readSheet(ss,'Students').map(s=>({
    ...s, id:+s.id, classId:+s.classId, stt:+s.stt,
    points:+s.points, positivePoints:+s.positivePoints, negativePoints:+s.negativePoints
  }));
  const history  = readSheet(ss,'History').map(h=>({
    ...h, id:+(h.id||0), classId:+h.classId, studentId:+h.studentId, points:+h.points
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
        const result = await syncRequest('push', { classes, students, history, periods, gradeRecords, subjectGrades });
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

// Extract Script ID from saved URL (or return '' if it's the default shared URL)
function _syncUrlToId(url) {
    if (!url || url === DEFAULT_SYNC_URL) return '';
    const m = url.match(/\/macros\/s\/([^/]+)\/exec/);
    return m ? m[1] : url; // fallback: show raw if format unknown
}
// Build full URL from Script ID (or return DEFAULT_SYNC_URL if empty)
function _syncIdToUrl(id) {
    const trimmed = id.trim();
    if (!trimmed) return DEFAULT_SYNC_URL;
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
        preview.textContent = '→ Dùng link đồng bộ chung mặc định';
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

function saveSyncUrl() {
    const idVal = document.getElementById('syncUrl').value.trim();
    const url = _syncIdToUrl(idVal);
    syncSettings.url = url;
    saveData();
    if (!idVal) {
        setSyncStatus('ok','Đã đặt về link đồng bộ chung mặc định!');
        showToast('Dùng link đồng bộ chung mặc định!');
    } else {
        setSyncStatus('ok','Đã lưu Script ID!');
        showToast('Đã lưu Script ID của bạn!');
    }
    _syncUpdatePreview(idVal);
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

async function syncRequest(action, data=null) {
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
        const result = await syncRequest('push', { classes, students, history, periods, gradeRecords, subjectGrades });
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
    if (!confirm('Tải về sẽ ghi đè toàn bộ dữ liệu local. Bạn có chắc không?')) return;
    const orig = document.getElementById('btnPull').innerHTML;
    setSyncBtnLoading('btnPull', true, orig);
    setSyncStatus('loading','Đang tải dữ liệu về...');
    try {
        const result = await syncRequest('pull');
        if (result.status === 'ok' && result.data) {
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

