// ============================================================
// STUDENTS
// ============================================================
function renderStudents() {
    const cls=classes.find(c=>c.id===currentClassId);
    if(!cls) {
        document.getElementById('headerClassName').innerHTML=`Chưa chọn lớp <i class="fas fa-caret-down text-sm"></i>`;
        document.getElementById('studentGrid').innerHTML='<div class="col-span-full text-center py-10 text-gray-400">Bạn chưa có lớp nào. Hãy tạo lớp mới!</div>';
        document.getElementById('studentCount').innerText='0';
        document.getElementById('totalClassPoints').innerText='Tổng điểm: 0';
        return;
    }
    document.getElementById('headerClassName').innerHTML=`${cls.name} <i class="fas fa-caret-down text-sm"></i>`;
    const grid=document.getElementById('studentGrid');
    let total=0;
    // Chỉ xoá ô tìm và các lựa chọn khi ĐỔI LỚP. Vẽ lại do tự đồng bộ (mỗi 30 giây, sau mỗi lần chấm)
    // phải giữ nguyên những gì giáo viên đang gõ/chọn.
    const classChanged = _renderedClassId !== currentClassId;
    _renderedClassId = currentClassId;
    if (classChanged) clearStudentSelections();
    else _dropMissingSelections();
    const cards=[];
    students.filter(s=>s.classId===currentClassId).forEach((student,i)=>{
        total+=student.points;
        const pColor=student.points>0?'bg-dojo-green text-white shadow-green-200':(student.points<0?'bg-dojo-red text-white shadow-red-200':'bg-gray-200 text-gray-700');
        const stt=student.stt||(i+1);
        const ms=getMilestone(student.points);
        cards.push(`
            <div id="student-card-${student.id}" data-name="${student.name.toLowerCase()}" data-stt="${stt}" data-id="${student.id}" class="student-card bg-white rounded-xl shadow-sm border border-gray-100 p-1.5 flex flex-col items-center cursor-pointer relative transition-all duration-300" onclick="handleCardClick(${student.id})">
                <!-- Checkbox overlay -->
                <div id="check-${student.id}" class="card-checkbox hidden absolute inset-0 rounded-xl bg-dojo-blue bg-opacity-15 flex items-end justify-center pb-1 pointer-events-none z-10">
                    <div class="w-5 h-5 bg-dojo-blue rounded-full flex items-center justify-center shadow-md"><i class="fas fa-check text-white text-[9px]"></i></div>
                </div>
                <div class="absolute top-1 left-1 bg-gray-100 text-gray-500 text-[9px] font-bold px-1 py-0.5 rounded leading-none">#${stt}</div>
                <div class="absolute top-1 right-1 ${pColor} w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold leading-none" id="badge-${student.id}">${student.points}</div>
                <img src="${student.avatar}" class="w-11 h-11 bg-blue-50 rounded-full mb-1 p-0.5 object-contain mt-3">
                <h3 class="text-[11px] font-bold text-gray-700 text-center truncate w-full px-0.5 leading-snug">${student.name}</h3>
                <div class="h-4 flex items-center">${ms?`<span class="text-sm leading-none" title="${ms.label}">${ms.icon}</span>`:''}</div>
            </div>`);
    });
    grid.innerHTML=cards.join('');   // một lần ghi DOM thay vì 40-50 lần
    _restoreSelectionsOnCards();
    document.getElementById('totalClassPoints').innerText=`Tổng điểm: ${total}`;
    document.getElementById('studentCount').innerText=students.filter(s=>s.classId===currentClassId).length;
}

// ---- Giữ lựa chọn khi vẽ lại ----
let _renderedClassId = undefined;

// Xoá ô tìm, chọn riêng, chọn STT (khi đổi lớp hoặc sau khi đã chấm điểm xong cho nhóm).
function clearStudentSelections() {
    const si=document.getElementById('searchInput'); if(si) si.value='';
    document.getElementById('multiSelectBar')?.classList.add('hidden');
    if (typeof sttSelected !== 'undefined') { sttSelected.clear(); if (sttPanelOpen) renderSttChips(); updateSttAwardBtn(); }
    exitGroupSelectMode();
}
// Học sinh bị xoá/chuyển lớp trong lúc đang chọn thì bỏ khỏi danh sách chọn.
function _dropMissingSelections() {
    const inClass = new Set(students.filter(s=>s.classId===currentClassId).map(s=>s.id));
    for (const id of [...groupSelected]) if (!inClass.has(id)) groupSelected.delete(id);
    if (typeof sttSelected !== 'undefined') for (const id of [...sttSelected]) if (!inClass.has(id)) sttSelected.delete(id);
}
// Sau khi vẽ lại thẻ học sinh: áp lại bộ lọc đang gõ, dấu tích "Chọn riêng" và viền chọn STT.
function _restoreSelectionsOnCards() {
    const si=document.getElementById('searchInput');
    if (si && si.value.trim()) _applyCardFilter(si.value);
    if (groupSelectMode) {
        document.querySelectorAll('.student-card').forEach(card=>{
            if (card.style.display !== 'none') card.querySelector('.card-checkbox')?.classList.remove('hidden');
        });
        groupSelected.forEach(id=>{
            document.getElementById(`check-${id}`)?.classList.remove('hidden');
            document.getElementById(`student-card-${id}`)?.classList.add('ring-2','ring-dojo-blue','scale-[0.97]');
        });
        updateGroupFloatBtn();
    }
    if (typeof sttSelected !== 'undefined') {
        sttSelected.forEach(id=>document.getElementById(`student-card-${id}`)?.classList.add('ring-2','ring-purple-500'));
        if (sttPanelOpen) renderSttChips();
        updateSttAwardBtn();
    }
}

// "1,3,5" · "1-10" · "2-6, Trâm" — số là STT (có khoảng), chữ là tên.
function parseStudentQuery(raw) {
    const stts = new Set(), names = [];
    for (const part of String(raw||'').split(/[,;]+/).map(t=>t.trim().toLowerCase()).filter(Boolean)) {
        const range = part.match(/^(\d+)\s*[-–]\s*(\d+)$/);
        if (range) {
            let a=+range[1], b=+range[2]; if (a>b) [a,b]=[b,a];
            for (let n=a; n<=b && n-a<500; n++) stts.add(String(n));
        } else if (/^\d+$/.test(part)) stts.add(String(+part));
        else names.push(part);
    }
    return {stts, names, count: stts.size + names.length};
}
function _applyCardFilter(raw) {
    const q = parseStudentQuery(raw), visibleIds = [];
    document.querySelectorAll('.student-card').forEach(card=>{
        const match = !q.count || q.stts.has(card.dataset.stt) || q.names.some(t=>card.dataset.name.includes(t));
        card.style.display = match ? 'flex' : 'none';
        if (match) visibleIds.push(parseInt(card.dataset.id));
    });
    return {q, visibleIds};
}

// ---- Multi-select state ----
let groupSelectMode = false;
let groupSelected   = new Set();
let _isGroupAward   = false;
let _groupTargetIds = [];

function filterStudents(e) {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    const {q, visibleIds} = _applyCardFilter(searchInput.value);

    const bar = document.getElementById('multiSelectBar');
    if (bar) {
        if ((q.count >= 2 || q.stts.size >= 2) && visibleIds.length >= 2) {
            bar.classList.remove('hidden');
            document.getElementById('multiSelectInfo').innerText = `${visibleIds.length} học sinh được chọn`;
        } else {
            bar.classList.add('hidden');
            exitGroupSelectMode();
        }
    }
    
    // Nếu ấn Enter và chỉ có 1 học sinh thỏa mãn thì mở bảng điểm luôn
    if (e && e.key === 'Enter' && visibleIds.length === 1) {
        if (typeof openPointsModal === 'function') {
            openPointsModal(visibleIds[0]);
            searchInput.value = '';
            filterStudents(); // bỏ lọc
            searchInput.blur();
        }
    }
}

function handleCardClick(id) {
    if (groupSelectMode) toggleSelectStudent(id);
    else openPointsModal(id);
}

function toggleGroupSelectMode() {
    groupSelectMode = !groupSelectMode;
    const btn = document.getElementById('btnGroupMode');
    if (groupSelectMode) {
        btn.innerHTML = '<i class="fas fa-times mr-1"></i>Hủy chọn';
        btn.className = 'text-xs bg-red-50 text-red-600 font-bold px-3 py-1.5 rounded-full border border-red-200 whitespace-nowrap';
        // Hiện checkbox trên tất cả card đang visible
        document.querySelectorAll('.student-card').forEach(card=>{
            if (card.style.display !== 'none') {
                card.querySelector('.card-checkbox')?.classList.remove('hidden');
            }
        });
    } else {
        exitGroupSelectMode();
    }
}

function toggleSelectStudent(id) {
    const card  = document.getElementById(`student-card-${id}`);
    const check = document.getElementById(`check-${id}`);
    if (groupSelected.has(id)) {
        groupSelected.delete(id);
        check?.classList.add('hidden');
        card?.classList.remove('ring-2','ring-dojo-blue','scale-[0.97]');
    } else {
        groupSelected.add(id);
        check?.classList.remove('hidden');
        card?.classList.add('ring-2','ring-dojo-blue','scale-[0.97]');
    }
    updateGroupFloatBtn();
}

function updateGroupFloatBtn() {
    const btn = document.getElementById('floatingGroupBtn');
    if (groupSelectMode && groupSelected.size > 0) {
        btn.classList.remove('hidden');
        document.getElementById('floatingGroupCount').innerText = `Cho điểm (${groupSelected.size} học sinh)`;
    } else {
        btn.classList.add('hidden');
    }
}

function exitGroupSelectMode() {
    groupSelectMode = false;
    groupSelected.clear();
    document.getElementById('floatingGroupBtn')?.classList.add('hidden');
    const btn = document.getElementById('btnGroupMode');
    if (btn) {
        btn.innerHTML = '<i class="fas fa-check-square mr-1"></i>Chọn riêng';
        btn.className = 'text-xs bg-white text-dojo-blue font-bold px-3 py-1.5 rounded-full border border-dojo-blue whitespace-nowrap';
    }
    document.querySelectorAll('.card-checkbox').forEach(cb=>cb.classList.add('hidden'));
    document.querySelectorAll('.student-card').forEach(card=>card.classList.remove('ring-2','ring-dojo-blue','scale-[0.97]'));
}

function awardAllFiltered() {
    // Lấy tất cả card đang visible
    const ids = [];
    document.querySelectorAll('.student-card').forEach(card=>{
        if (card.style.display !== 'none') ids.push(parseInt(card.dataset.id));
    });
    if (!ids.length) return;
    openGroupModal(ids, `${ids.length} học sinh đã lọc`);
}

function openGroupPointsModal() {
    const ids = [...groupSelected];
    if (!ids.length) return;
    openGroupModal(ids, `${ids.length} học sinh đã chọn`);
}

function openGroupModal(ids, label) {
    _isGroupAward   = true;
    _groupTargetIds = ids;
    isAwardAll      = false;
    selectedStudentId = null;

    document.getElementById('modalStudentName').innerText = label;
    document.getElementById('modalStudentInfo').style.display = 'none';
    document.getElementById('modalStudentPoints').innerText = ids.length + ' học sinh';
    document.getElementById('modalAvatar').style.display = 'none';
    document.getElementById('btnEditStudent').classList.add('hidden');
    document.getElementById('btnShareStudent').classList.add('hidden');
    document.getElementById('btnStudentProfile').classList.add('hidden');
    document.getElementById('btnCertStudent').classList.add('hidden');
    document.getElementById('btnDeleteStudent').classList.add('hidden');
    document.getElementById('backdrop').classList.remove('hidden');
    document.getElementById('pointsModal').classList.remove('translate-y-full');
    switchTab('positive');
}

function openAddStudentModal() { document.getElementById('addStudentBackdrop').classList.remove('hidden'); document.getElementById('addStudentModal').classList.remove('hidden'); document.getElementById('newStudentName').focus(); }
function closeAddStudentModal() { document.getElementById('addStudentBackdrop').classList.add('hidden'); document.getElementById('addStudentModal').classList.add('hidden'); document.getElementById('newStudentName').value=''; }
function addStudent() {
    if(!currentClassId) return alert('Tạo lớp trước!');
    const n=document.getElementById('newStudentName').value.trim(); if(!n) return;
    const cs=students.filter(s=>s.classId===currentClassId);
    const id=students.length?Math.max(...students.map(s=>s.id))+1:1;
    const seed=n.normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/\s/g,"");
    students.push({id,classId:currentClassId,stt:cs.length+1,name:n,dob:'',points:0,positivePoints:0,negativePoints:0,avatar:avatarBaseUrl+seed});
    saveData(); renderStudents(); closeAddStudentModal(); showToast(`Đã thêm ${n}!`);
}

function handleExcelUpload(e, isSyncUpdate = false) {
    if(!currentClassId){alert('Chọn lớp trước!');e.target.value='';return;}
    const f=e.target.files[0]; if(!f) return;
    const r=new FileReader();
    r.onload=function(ev){
        try{
            const wb=XLSX.read(new Uint8Array(ev.target.result),{type:'array',cellDates:true});
            let rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1});
            // Nhận cả bảng điểm Sở (tiêu đề ở dòng 6, cột B là mã định danh): quy về STT | Họ tên | Ngày sinh.
            const parsed=typeof parseClassListWorkbook==='function'?parseClassListWorkbook(wb,f.name):null;
            if(parsed) rows=[['STT','Họ và tên','Ngày sinh'],...parsed.students.map(s=>[s.stt,s.name,s.dob])];
            let c=0, updated=0;
            
            // Lấy danh sách học sinh hiện tại của lớp
            let currentStudents = students.filter(s => s.classId === currentClassId);
            let keepIds = new Set();
            
            for(let i=1;i<rows.length;i++){
                const row=rows[i]; if(!row||!row.length) continue;
                let stt,name,dob;
                if(row.length===1||(row[0]&&!row[1]&&typeof row[0]==='string')){name=row[0];stt=currentStudents.length+1;dob='';}
                else{stt=parseInt(row[0]);name=row[1];dob=row[2]?row[2].toString():'';}
                
                if(name&&typeof name==='string'&&name.trim()){
                    name = name.trim();
                    if(isSyncUpdate && stt) {
                        // Tìm học sinh có cùng STT
                        let existing = currentStudents.find(s => parseInt(s.stt) === parseInt(stt));
                        if (existing) {
                            const oldName = existing.name;
                            existing.name = name;
                            existing.realName = name;
                            if (dob) existing.dob = dob.trim();
                            
                            // Nếu tên đổi mà ảnh cũ là ảnh Dicebear mặc định thì đổi seed
                            if (oldName !== name && existing.avatar && !existing.avatar.startsWith('data:image')) {
                                const seed = name.normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/\s/g,"");
                                existing.avatar = avatarBaseUrl + seed;
                            }
                            keepIds.add(existing.id);
                            updated++;
                            c++;
                            continue;
                        }
                    }
                    
                    // Nếu không phải sync đè, hoặc không tìm thấy STT, thêm mới
                    const id=students.length?Math.max(...students.map(s=>s.id))+1:1;
                    const seed=name.normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/\s/g,"");
                    const newStudent = {id,classId:currentClassId,stt:stt||(currentStudents.length+1),name:name,realName:name,dob:dob?dob.trim():'',points:0,positivePoints:0,negativePoints:0,avatar:avatarBaseUrl+seed};
                    students.push(newStudent);
                    currentStudents.push(newStudent); // Cập nhật local ref
                    if(isSyncUpdate) keepIds.add(id);
                    c++;
                }
            }
            
            if (isSyncUpdate) {
                // Xoá những em không có trong danh sách đè
                students = students.filter(s => s.classId !== currentClassId || keepIds.has(s.id));
            }
            
            const sb=document.getElementById('sidebar');
            if(sb.classList.contains('sidebar-open'))toggleSidebar();
            saveData();
            if(currentView==='classroom')renderStudents(); else renderReport();
            showToast(isSyncUpdate ? `Đã đồng bộ đè: Cập nhật ${updated} và thêm mới ${c - updated} học sinh!` : `Đã nhập thêm ${c} học sinh!`);
        }catch(err){console.error(err);alert("Lỗi file Excel. Form: Cột A(STT), Cột B(Họ Tên), Cột C(Ngày sinh)");}
    };
    r.readAsArrayBuffer(f);
    e.target.value='';
}



// ============================================================
// JSON BACKUP / RESTORE
// ============================================================
// Mọi dữ liệu app lưu trong saveData(). Địa chỉ đồng bộ và hàng đợi điểm thuộc riêng từng máy nên không nằm trong file.
const BACKUP_FIELDS = ['classes','students','skills','history','periods','gradeRecords','communicationLog',
    'studentGoals','classNotes','subjectGrades','meetingNotes','hoaBa'];
const BACKUP_EXTRA_KEYS = ['dojo_custom_typing','dojo_projMode','cert_school','cert_signer','cert_reason','cert_teacherName'];

function buildBackupData() {
    const data = {classes, students, skills, history, periods, gradeRecords, communicationLog,
        studentGoals, classNotes, subjectGrades, meetingNotes, hoaBa};
    const extras = {};
    for (const k of BACKUP_EXTRA_KEYS) { const v = localStorage.getItem(k); if (v !== null) extras[k] = v; }
    return {app:'LopHocTichCuc', format:2, exportedAt:new Date().toISOString(), data, extras};
}

function exportJsonData() {
    try {
        capturePointChanges();
        const backup = buildBackupData();
        const blob = new Blob([JSON.stringify(backup)], {type:'application/json'});
        const url = URL.createObjectURL(blob);
        const pad = n => String(n).padStart(2,'0'), d = new Date();
        const a = document.createElement('a');
        a.href = url;
        a.download = `LopHocTichCuc_SaoLuu_${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}.json`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        showToast(`Đã tải file sao lưu: ${classes.length} lớp, ${students.length} học sinh 💾`);
    } catch (e) {
        console.error(e);
        showToast('Không tạo được file sao lưu: ' + e.message, false);
    }
}

// Nhận cả file mới (format 2) và file cũ (các mảng nằm ngay ở gốc). Trả về {data, extras} đã chuẩn hoá hoặc ném lỗi dễ hiểu.
function parseBackupFile(text) {
    let raw;
    try { raw = JSON.parse(text); } catch { throw new Error('File không phải JSON hợp lệ.'); }
    if (!raw || typeof raw !== 'object') throw new Error('File sao lưu trống.');
    const src = raw.format >= 2 && raw.data ? raw.data : raw;
    if (!Array.isArray(src.classes) || !Array.isArray(src.students)) throw new Error('File không có danh sách lớp và học sinh của ứng dụng này.');
    const data = {};
    for (const f of BACKUP_FIELDS) {
        if (f === 'skills') { if (src.skills && typeof src.skills === 'object') data.skills = src.skills; continue; }
        if (src[f] !== undefined && !Array.isArray(src[f])) throw new Error(`Mục "${f}" trong file bị hỏng.`);
        if (Array.isArray(src[f])) data[f] = src[f];
    }
    data.students = data.students.map(s => ({...s,
        points: Number(s.points) || 0, positivePoints: Number(s.positivePoints) || 0, negativePoints: Number(s.negativePoints) || 0}));
    const extras = {};
    if (raw.extras && typeof raw.extras === 'object') {
        for (const k of BACKUP_EXTRA_KEYS) if (typeof raw.extras[k] === 'string') extras[k] = raw.extras[k];
    }
    return {data, extras, exportedAt: raw.exportedAt || null};
}

function _assignBackupGlobals(data, {keepHistory=false}={}) {
    if (data.classes) classes = data.classes;
    if (data.students) students = data.students;
    if (data.skills) skills = data.skills;
    if (!keepHistory && data.history) history = data.history;
    if (data.periods) periods = data.periods;
    if (data.gradeRecords) gradeRecords = data.gradeRecords;
    if (data.communicationLog) communicationLog = data.communicationLog;
    if (data.studentGoals) studentGoals = data.studentGoals;
    if (data.classNotes) classNotes = data.classNotes;
    if (data.subjectGrades) subjectGrades = data.subjectGrades;
    if (data.meetingNotes) meetingNotes = data.meetingNotes;
    if (data.hoaBa) hoaBa = data.hoaBa;
    currentClassId = classes.length ? classes[0].id : null;
}

// Không đồng bộ: thay toàn bộ dữ liệu trên máy, xoá hàng đợi điểm cũ để không bị cộng lại.
function restoreBackupLocal(backup) {
    _assignBackupGlobals(backup.data);
    for (const k of pendingPointBatches().map(b => pointPrefix() + b.operationId)) localStorage.removeItem(k);
    resetPointBaseline();
    saveData();
    for (const [k, v] of Object.entries(backup.extras)) localStorage.setItem(k, v);
}

// Đang đồng bộ: điểm thuộc sổ giao dịch trên máy chủ. Đưa điểm về đúng file bằng giao dịch điều chỉnh
// (ghi chênh lệch), rồi lưu thông tin lớp lên máy chủ. Lịch sử máy chủ được giữ làm dấu vết.
async function restoreBackupSynced(backup) {
    // Lấy điểm mới nhất trước khi tính chênh lệch. Lỗi ở đây: chưa có gì thay đổi trên máy.
    try { await flushPointTransactions(); } catch (e) { e.beforeRestore = true; throw e; }
    const now = new Date().toISOString(), label = 'Phục hồi từ file sao lưu';
    const before = new Map(students.map(s => [String(s.id), s]));
    _assignBackupGlobals(backup.data, {keepHistory:true});
    for (const s of students) {
        const old = before.get(String(s.id)) || {points:0, positivePoints:0, negativePoints:0};
        const dPoints = s.points - (Number(old.points) || 0);
        const dPos = s.positivePoints - (Number(old.positivePoints) || 0), dNeg = s.negativePoints - (Number(old.negativePoints) || 0);
        if (dPoints || dPos || dNeg) history.push({id:'restore-' + crypto.randomUUID(), classId:s.classId, studentId:s.id,
            studentName:s.name, skillName:label, points:dPoints, type:'adjust', timestamp:now});
    }
    saveData();   // tạo giao dịch chênh lệch trong hàng đợi (bền vững ngay cả khi mất mạng)
    for (const [k, v] of Object.entries(backup.extras)) localStorage.setItem(k, v);
    return syncRequest('push', {classes, students, history, periods, gradeRecords, subjectGrades, meetingNotes});
}

function importJsonData(event) {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onerror = () => showToast('Không đọc được file.', false);
    reader.onload = async (e) => {
        let backup;
        try { backup = parseBackupFile(e.target.result); }
        catch (err) { alert('Không phục hồi được: ' + err.message); return; }
        const d = backup.data;
        const when = backup.exportedAt ? ` (sao lưu lúc ${new Date(backup.exportedAt).toLocaleString('vi-VN')})` : '';
        const summary = `File có ${d.classes.length} lớp, ${d.students.length} học sinh, ${(d.history||[]).length} dòng lịch sử${when}.`;
        if (!syncSettings.url) {
            if (!confirm(`${summary}\n\nPHỤC HỒI sẽ XOÁ TOÀN BỘ dữ liệu hiện tại trên máy này và thay bằng dữ liệu trong file. Tiếp tục?`)) return;
            try { restoreBackupLocal(backup); }
            catch (err) { console.error(err); alert('Phục hồi thất bại, dữ liệu trên máy chưa bị thay đổi hết: ' + err.message); return; }
            showToast('Phục hồi dữ liệu thành công! Đang tải lại...');
            setTimeout(() => window.location.reload(), 800);
            return;
        }
        if (!confirm(`${summary}\n\nMáy này đang ĐỒNG BỘ với Google Sheets. Phục hồi sẽ:\n• Thay danh sách lớp, học sinh và các sổ trên máy chủ bằng dữ liệu trong file\n• Đưa điểm của từng em về đúng như file (ghi giao dịch điều chỉnh, các máy khác cũng nhận)\n\nTiếp tục?`)) return;
        showToast('Đang phục hồi và gửi lên máy chủ...');
        try {
            const result = await restoreBackupSynced(backup);
            if (result.status !== 'ok') throw new Error(result.message || 'Máy chủ từ chối');
            showToast('Phục hồi thành công và đã lưu lên máy chủ! Đang tải lại...');
            setTimeout(() => window.location.reload(), 1200);
        } catch (err) {
            console.error(err);
            if (err.beforeRestore) { alert('Chưa phục hồi gì: không kết nối được máy chủ (' + err.message + '). Kiểm tra mạng rồi thử lại.'); return; }
            alert('Đã phục hồi trên máy này và giữ điểm trong hàng đợi, nhưng chưa lưu được thông tin lớp lên máy chủ: '
                + err.message + '\n\nKiểm tra mạng rồi bấm "Lưu". Nếu báo xung đột, phục hồi lại file này sau khi bấm "Tải về".');
            if (typeof refreshPointViews === 'function') refreshPointViews();
        }
    };
    reader.readAsText(file);
}
