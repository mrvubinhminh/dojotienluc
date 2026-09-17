// ============================================================
// SỔ LIÊN LẠC ĐIỆN TỬ
// ============================================================
const NOTE_TYPES = {
    praise:   { label:'Khen ngợi',    icon:'fa-star',               bg:'bg-green-100',  text:'text-green-700',  border:'border-green-300',  hex:'#16a34a' },
    concern:  { label:'Cần cố gắng',  icon:'fa-exclamation-triangle',bg:'bg-orange-100', text:'text-orange-700', border:'border-orange-300', hex:'#c2410c' },
    notice:   { label:'Thông báo',    icon:'fa-bullhorn',            bg:'bg-blue-100',   text:'text-blue-700',   border:'border-blue-300',   hex:'#1d4ed8' },
    reminder: { label:'Dặn dò',       icon:'fa-clock',               bg:'bg-purple-100', text:'text-purple-700', border:'border-purple-300', hex:'#7e22ce' },
};

const NOTE_TEMPLATES = {
    praise:   ['Phát biểu tích cực, đóng góp xây dựng bài.','Hoàn thành bài tập đầy đủ, chất lượng tốt.','Tinh thần giúp đỡ bạn bè đáng khen.','Có tiến bộ rõ rệt so với tuần trước.'],
    concern:  ['Cần chú ý hơn khi làm bài tập về nhà.','Hay nói chuyện riêng trong giờ học, cần nhắc nhở.','Điểm kiểm tra còn thấp, cần ôn tập thêm.','Thái độ học tập cần cải thiện.'],
    notice:   ['Thứ 2 tuần tới có kiểm tra 15 phút môn Toán.','Nhà trường tổ chức họp phụ huynh vào thứ 6.','Tuần tới nghỉ lễ, lớp học online.','Nộp học phí trước ngày 15 tháng này.'],
    reminder: ['Nhắc mang đủ dụng cụ học tập.','Mặc đồng phục đúng quy định vào thứ 2.','Ký xác nhận bài kiểm tra phụ huynh.','Nộp đơn đăng ký tham quan học tập.'],
};

let _selectedNoteStudentId = null;
let _selectedNoteType      = 'praise';

// ----- Open / Close -----
function openCommunicationLog(prefillStudentId = null) {
    const cls = classes.find(c=>c.id===currentClassId);
    document.getElementById('commLogSubtitle').innerText = cls?.name || '';
    // Populate student filter
    const sel = document.getElementById('commFilterStudent');
    sel.innerHTML = '<option value="">Tất cả học sinh</option><option value="class">📢 Cả lớp</option>';
    students.filter(s=>s.classId===currentClassId).sort((a,b)=>a.stt-b.stt).forEach(s=>{
        const opt=document.createElement('option'); opt.value=s.id; opt.innerText=`#${s.stt} ${s.name}`; sel.appendChild(opt);
    });
    if (prefillStudentId) sel.value = prefillStudentId;
    document.getElementById('commFilterType').value  = '';
    document.getElementById('commFilterDate').value  = '';
    document.getElementById('commLogOverlay').classList.remove('hidden');
    renderCommunicationLog();
}

function closeCommunicationLog() {
    document.getElementById('commLogOverlay').classList.add('hidden');
}

// ----- Render list -----
function renderCommunicationLog() {
    const filterStudent = document.getElementById('commFilterStudent').value;
    const filterType    = document.getElementById('commFilterType').value;
    const filterDate    = document.getElementById('commFilterDate').value;

    let notes = communicationLog.filter(n=>n.classId===currentClassId);
    if (filterStudent === 'class') notes = notes.filter(n=>n.studentId===null);
    else if (filterStudent)        notes = notes.filter(n=>String(n.studentId)===filterStudent);
    if (filterType)                notes = notes.filter(n=>n.type===filterType);
    if (filterDate)                notes = notes.filter(n=>n.date===filterDate);

    // Update stats
    const allClass = communicationLog.filter(n=>n.classId===currentClassId);
    document.getElementById('cntPraise').innerText   = allClass.filter(n=>n.type==='praise').length;
    document.getElementById('cntConcern').innerText  = allClass.filter(n=>n.type==='concern').length;
    document.getElementById('cntNotice').innerText   = allClass.filter(n=>n.type==='notice').length;
    document.getElementById('cntReminder').innerText = allClass.filter(n=>n.type==='reminder').length;

    const container = document.getElementById('commLogList');
    if (!notes.length) {
        container.innerHTML = `<div class="text-center py-16 text-gray-400"><i class="fas fa-book-open text-5xl opacity-20 mb-4 block"></i><p class="font-semibold">Chưa có nhận xét nào</p><p class="text-sm mt-1">Bấm + để thêm nhận xét đầu tiên</p></div>`;
        return;
    }

    // Sort newest first, group by date
    const sorted = [...notes].sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
    const groups = {};
    sorted.forEach(n=>{
        const d = n.date || n.createdAt.slice(0,10);
        const label = formatDateLabel(d);
        if (!groups[label]) groups[label]=[];
        groups[label].push(n);
    });

    container.innerHTML = '';
    Object.entries(groups).forEach(([label,items])=>{
        const dayDiv = document.createElement('div');
        dayDiv.innerHTML = `<p class="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 mt-3 px-1">${label}</p>`;
        items.forEach(note=>{
            const nt = NOTE_TYPES[note.type]||NOTE_TYPES.notice;
            const card = document.createElement('div');
            card.className = 'bg-white rounded-2xl p-3 shadow-sm border border-gray-100 mb-2 flex gap-3';
            card.innerHTML = `
                <div class="flex-shrink-0 mt-0.5">
                    ${note.studentId
                        ? `<img src="${note.studentAvatar||''}" class="w-10 h-10 rounded-full bg-blue-50 p-0.5 object-contain">`
                        : `<div class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center"><i class="fas fa-users text-emerald-600 text-sm"></i></div>`}
                </div>
                <div class="flex-1 overflow-hidden">
                    <div class="flex items-center gap-2 mb-1 flex-wrap">
                        <span class="font-bold text-gray-800 text-sm">${note.studentName}</span>
                        <span class="text-[11px] font-bold px-2 py-0.5 rounded-full ${nt.bg} ${nt.text}">
                            <i class="fas ${nt.icon} mr-1"></i>${nt.label}
                        </span>
                    </div>
                    <p class="text-sm text-gray-600 leading-snug">${note.content}</p>
                    <p class="text-[10px] text-gray-400 mt-1">${new Date(note.createdAt).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}</p>
                </div>
                <div class="flex flex-col gap-1 flex-shrink-0">
                    <button onclick="openEditNote('${note.id}')" class="w-7 h-7 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition"><i class="fas fa-edit text-xs"></i></button>
                    <button onclick="deleteNote('${note.id}')" class="w-7 h-7 rounded-full bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 transition"><i class="fas fa-trash text-xs"></i></button>
                </div>`;
            dayDiv.appendChild(card);
        });
        container.appendChild(dayDiv);
    });
}

// ── Comm Log: show/hide "Tin nhắn" button ────────────────────
function _toggleCommMsgBtn() {
    const val = document.getElementById('commFilterStudent').value;
    const btn = document.getElementById('btnCommMsg');
    // show only when a specific student (not empty, not 'class') is selected
    const show = val && val !== 'class';
    btn.classList.toggle('hidden', !show);
}

// ── Export comm log → Excel ─────────────────────────────────
function exportCommLogExcel() {
    const cls = classes.find(c=>c.id===currentClassId);
    const clsStudents = students.filter(s=>s.classId===currentClassId).sort((a,b)=>a.stt-b.stt);
    if (!clsStudents.length) { showToast('Lớp chưa có học sinh!', false); return; }

    const wsData = [
        ['STT','Họ và tên','Tổng điểm','Điểm cộng','Điểm trừ','Khen ngợi gần nhất (7 ngày)','Vi phạm gần nhất (7 ngày)','Nhận xét trong sổ','Tin nhắn phụ huynh']
    ];
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate()-7); cutoff.setHours(0,0,0,0);

    clsStudents.forEach(s => {
        const sHist = history.filter(h=>h.classId===currentClassId && h.studentId===s.id);
        const recent = sHist.filter(h=>new Date(h.timestamp)>=cutoff);
        const posRecent = recent.filter(h=>h.points>0).map(h=>`${h.skillName}(+${h.points})`).join('; ');
        const negRecent = recent.filter(h=>h.points<0).map(h=>`${h.skillName}(${h.points})`).join('; ');
        const totalPlus  = sHist.filter(h=>h.points>0).reduce((a,h)=>a+h.points,0);
        const totalMinus = sHist.filter(h=>h.points<0).reduce((a,h)=>a+h.points,0);
        const commNotes = communicationLog.filter(n=>n.classId===currentClassId && n.studentId===s.id)
            .sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,5)
            .map(n=>`[${NOTE_TYPES[n.type]?.label||n.type}] ${n.content}`).join(' | ');
        const msg = _buildParentMsg(s, 7, 'formal');
        wsData.push([s.stt||'', s.name, s.points||0, totalPlus, totalMinus, posRecent||'–', negRecent||'–', commNotes||'–', msg]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{wch:5},{wch:22},{wch:10},{wch:10},{wch:10},{wch:35},{wch:35},{wch:40},{wch:80}];
    // Style header row
    const hStyle = {font:{bold:true,color:{rgb:'FFFFFF'}},fill:{fgColor:{rgb:'059669'}},alignment:{horizontal:'center',wrapText:true}};
    ['A1','B1','C1','D1','E1','F1','G1','H1','I1'].forEach(ref=>{
        if(!ws[ref]) ws[ref]={v:wsData[0][['A','B','C','D','E','F','G','H','I'].indexOf(ref[0])],t:'s'};
        ws[ref].s=hStyle;
    });
    ws['!rows'] = [{hpt:20}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'So_Lien_Lac');
    XLSX.writeFile(wb, `SoLienLac_${cls?.name?.replace(/\s+/g,'_')||'Lop'}_${new Date().toLocaleDateString('vi-VN').replace(/\//g,'-')}.xlsx`);
    showToast('Đã xuất sổ liên lạc!');
}

// ── Student message builder ──────────────────────────────────
let _msgStudentId  = null;
let _msgTemplate   = 'formal';

function _openStudentMessage() {
    const sid = document.getElementById('commFilterStudent').value;
    if (!sid || sid === 'class') return;
    _msgStudentId = parseInt(sid);
    _msgTemplate  = 'formal';
    const s = students.find(st=>st.id===_msgStudentId); if (!s) return;
    const cls = classes.find(c=>c.id===currentClassId);

    document.getElementById('msgStudentAvatar').src = s.avatar || '';
    document.getElementById('msgStudentName').innerText  = s.name;
    document.getElementById('msgStudentClass').innerText = `Lớp ${cls?.name||''} · STT: ${s.stt||'?'}`;
    document.getElementById('msgDaysRange').value = '7';

    _setMsgTemplate('formal');  // sets button styles and builds message
    document.getElementById('studentMsgBackdrop').classList.remove('hidden');
    setTimeout(()=>document.getElementById('studentMsgModal').classList.remove('translate-y-full'), 10);
}

function closeStudentMessage() {
    document.getElementById('studentMsgModal').classList.add('translate-y-full');
    setTimeout(()=>document.getElementById('studentMsgBackdrop').classList.add('hidden'), 300);
}

function _setMsgTemplate(tpl) {
    _msgTemplate = tpl;
    ['formal','friendly','brief'].forEach(t=>{
        const btn = document.getElementById('tpl'+t.charAt(0).toUpperCase()+t.slice(1));
        if (btn) btn.className = `flex-1 py-2 text-xs font-bold rounded-xl transition ${t===tpl?'bg-blue-600 text-white shadow':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`;
    });
    _rebuildMsg();
}

function _rebuildMsg() {
    const days = parseInt(document.getElementById('msgDaysRange').value);
    const msg  = _buildParentMsg(students.find(s=>s.id===_msgStudentId), days, _msgTemplate);
    document.getElementById('msgPreviewText').value = msg;
}

function _buildParentMsg(s, days, template) {
    if (!s) return '';
    const cls   = classes.find(c=>c.id===currentClassId);
    const today = new Date().toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'});
    const cutoff = days > 0 ? new Date(Date.now() - days*86400000) : new Date(0);

    const sHist    = history.filter(h=>h.classId===currentClassId && h.studentId===s.id && new Date(h.timestamp)>=cutoff);
    const posItems = sHist.filter(h=>h.points>0);
    const negItems = sHist.filter(h=>h.points<0);
    const notes    = communicationLog.filter(n=>n.classId===currentClassId && n.studentId===s.id)
        .sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,5);

    // Aggregate: { skillName → { count, points } } sorted by frequency
    const skillDetail = (arr) => {
        const map = {};
        arr.forEach(h=>{
            if (!map[h.skillName]) map[h.skillName] = { count:0, pts:h.points };
            map[h.skillName].count++;
        });
        return Object.entries(map).sort((a,b)=>b[1].count-a[1].count).map(([name,{count,pts}])=>{
            const total = pts * count;
            const sign  = pts > 0 ? '+' : '';
            return count > 1
                ? `${name}: ${sign}${pts}đ × ${count} lần = ${sign}${total}đ`
                : `${name}: ${sign}${pts}đ`;
        });
    };

    const noteTypeIcon = { praise:'⭐', concern:'⚠️', notice:'📢', reminder:'⏰' };
    const rangeLabel   = days > 0 ? `${days} ngày gần nhất` : 'toàn bộ';

    if (template === 'formal') {
        let msg = `Kính gửi Quý Phụ huynh em ${s.name}\n`;
        msg += `Lớp: ${cls?.name||''} | Ngày: ${today}\n\n`;
        msg += `📊 Điểm thi đua hiện tại: ${s.points||0} điểm\n`;
        msg += `(Thống kê ${rangeLabel})\n`;
        if (posItems.length) {
            msg += `\n✅ KHEN THƯỞNG:\n`;
            skillDetail(posItems).forEach(sk=>{ msg += `  • ${sk}\n`; });
        }
        if (negItems.length) {
            msg += `\n⚠️ VI PHẠM / CẦN NHẮC NHỞ:\n`;
            skillDetail(negItems).forEach(sk=>{ msg += `  • ${sk}\n`; });
        }
        if (notes.length) {
            msg += `\n📝 NHẬN XÉT CỦA GIÁO VIÊN:\n`;
            notes.forEach(n=>{ msg += `  ${noteTypeIcon[n.type]||'📌'} ${n.content}\n`; });
        }
        msg += `\nTrân trọng,\nGiáo viên lớp ${cls?.name||''}`;
        return msg;
    }

    if (template === 'friendly') {
        let msg = `👋 Chào PH em ${s.name} - Lớp ${cls?.name||''}\n`;
        msg += `📅 ${today} | Thống kê ${rangeLabel}\n\n`;
        msg += `🏆 Điểm thi đua: ${s.points||0} điểm\n`;
        if (posItems.length) {
            msg += `\n🌟 Khen thưởng:\n`;
            skillDetail(posItems).forEach(sk=>{ msg += `  ✅ ${sk}\n`; });
        }
        if (negItems.length) {
            msg += `\n💪 Vi phạm / cần cố gắng:\n`;
            skillDetail(negItems).forEach(sk=>{ msg += `  🔸 ${sk}\n`; });
        }
        if (notes.length) {
            msg += `\n💬 Nhận xét:\n`;
            notes.forEach(n=>{ msg += `  ${noteTypeIcon[n.type]||'📌'} ${n.content}\n`; });
        }
        msg += `\n🙏 Cảm ơn PH đã phối hợp cùng nhà trường!`;
        return msg;
    }

    // brief
    const posNames = skillDetail(posItems).slice(0,3).join('; ') || '–';
    const negNames = skillDetail(negItems).slice(0,3).join('; ') || '–';
    let msg = `[${today}] ${s.name} - ${cls?.name||''} | Điểm: ${s.points||0}\n`;
    if (posItems.length) msg += `✅ Khen: ${posNames}\n`;
    if (negItems.length) msg += `⚠️ Vi phạm: ${negNames}\n`;
    if (notes.length) msg += `📝 ${notes[0].content}`;
    return msg.trim();
}

function _copyStudentMessage() {
    const txt = document.getElementById('msgPreviewText').value;
    navigator.clipboard.writeText(txt).then(()=>{
        showToast('Đã sao chép tin nhắn! 📋');
    }).catch(()=>{
        // Fallback
        const ta = document.getElementById('msgPreviewText');
        ta.select(); document.execCommand('copy');
        showToast('Đã sao chép! 📋');
    });
}

function _shareStudentMessage() {
    const txt = document.getElementById('msgPreviewText').value;
    if (navigator.share) {
        navigator.share({ text: txt }).catch(()=>{});
    } else {
        _copyStudentMessage();
    }
}

function formatDateLabel(dateStr) {
    const d = new Date(dateStr+'T00:00:00');
    const today = new Date(); today.setHours(0,0,0,0);
    const diff  = Math.round((today - d) / 86400000);
    if (diff === 0) return 'Hôm nay';
    if (diff === 1) return 'Hôm qua';
    if (diff <= 7)  return `${diff} ngày trước`;
    return d.toLocaleDateString('vi-VN',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'});
}

// ----- Add / Edit Note -----
function openAddNoteModal(prefillStudentId = null) {
    _editingNoteId        = null;
    _selectedNoteStudentId = prefillStudentId;
    _selectedNoteType     = 'praise';
    document.getElementById('addNoteTitle').innerText    = 'Thêm nhận xét';
    document.getElementById('saveNoteLabel').innerText   = 'Lưu nhận xét';
    document.getElementById('noteContent').value         = '';
    document.getElementById('noteDate').value            = new Date().toISOString().slice(0,10);
    document.getElementById('noteStudentSearch').value   = '';
    buildNoteStudentList(prefillStudentId);
    selectNoteType('praise');
    renderNoteTemplates('praise');
    document.getElementById('addNoteBackdrop').classList.remove('hidden');
    document.getElementById('addNoteModal').classList.remove('translate-y-full');
}

function openEditNote(noteId) {
    const note = communicationLog.find(n=>n.id===noteId); if(!note) return;
    _editingNoteId         = noteId;
    _selectedNoteStudentId = note.studentId;
    _selectedNoteType      = note.type;
    document.getElementById('addNoteTitle').innerText   = 'Sửa nhận xét';
    document.getElementById('saveNoteLabel').innerText  = 'Cập nhật';
    document.getElementById('noteContent').value        = note.content;
    document.getElementById('noteDate').value           = note.date || note.createdAt.slice(0,10);
    document.getElementById('noteStudentSearch').value  = '';
    buildNoteStudentList(note.studentId);
    selectNoteType(note.type);
    renderNoteTemplates(note.type);
    document.getElementById('addNoteBackdrop').classList.remove('hidden');
    document.getElementById('addNoteModal').classList.remove('translate-y-full');
}

function closeAddNoteModal() {
    document.getElementById('addNoteModal').classList.add('translate-y-full');
    setTimeout(()=>document.getElementById('addNoteBackdrop').classList.add('hidden'),300);
}

function buildNoteStudentList(selectedId = null) {
    const container = document.getElementById('noteStudentList');
    container.innerHTML = '';
    // "Cả lớp" option
    const allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.id   = 'ns-null';
    allBtn.className = `px-3 py-1.5 rounded-full text-xs font-bold border transition ${selectedId===null ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-emerald-400'}`;
    allBtn.innerText = '📢 Cả lớp';
    allBtn.onclick = () => selectNoteStudent(null);
    container.appendChild(allBtn);
    // Individual students
    students.filter(s=>s.classId===currentClassId).sort((a,b)=>(a.stt||0)-(b.stt||0)).forEach(s=>{
        const btn = document.createElement('button');
        btn.type = 'button'; btn.id = `ns-${s.id}`;
        btn.className = `px-3 py-1.5 rounded-full text-xs font-bold border transition ${selectedId===s.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-emerald-400'}`;
        btn.innerText = `#${s.stt} ${s.name}`;
        btn.onclick = () => selectNoteStudent(s.id);
        container.appendChild(btn);
    });
}

function filterNoteStudents() {
    const q = document.getElementById('noteStudentSearch').value.toLowerCase().trim();
    document.querySelectorAll('#noteStudentList button').forEach(btn=>{
        btn.style.display = (!q || btn.innerText.toLowerCase().includes(q)) ? '' : 'none';
    });
}

function selectNoteStudent(id) {
    _selectedNoteStudentId = id;
    document.querySelectorAll('#noteStudentList button').forEach(btn=>{
        const active = (id===null && btn.id==='ns-null') || (id!==null && btn.id===`ns-${id}`);
        btn.className = `px-3 py-1.5 rounded-full text-xs font-bold border transition ${active ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-emerald-400'}`;
    });
}

function selectNoteType(type) {
    _selectedNoteType = type;
    document.querySelectorAll('.note-type-btn').forEach(btn=>{
        const isActive = btn.id === `noteType-${type}`;
        const nt = NOTE_TYPES[btn.id.replace('noteType-','')];
        btn.className = `note-type-btn py-2 rounded-xl border-2 flex flex-col items-center gap-1 text-xs font-bold transition ${nt?.bg||''} ${nt?.text||''} ${isActive ? 'border-current scale-105 shadow-md' : 'border-transparent'}`;
    });
    renderNoteTemplates(type);
}

function renderNoteTemplates(type) {
    const container = document.getElementById('noteTemplates');
    const templates = NOTE_TEMPLATES[type]||[];
    container.innerHTML = templates.map(t=>
        `<button type="button" onclick="applyTemplate('${t.replace(/'/g,"\\'")}')" class="flex-shrink-0 text-[11px] bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full hover:bg-gray-200 transition whitespace-nowrap">${t.length>30?t.slice(0,30)+'…':t}</button>`
    ).join('');
}

function applyTemplate(text) {
    document.getElementById('noteContent').value = text;
}

function saveNote() {
    const content = document.getElementById('noteContent').value.trim();
    if (!content) { showToast('Vui lòng nhập nội dung nhận xét!', false); return; }
    const date  = document.getElementById('noteDate').value || new Date().toISOString().slice(0,10);
    const now   = new Date().toISOString();
    let studentName='Cả lớp', studentAvatar='';
    if (_selectedNoteStudentId !== null) {
        const s = students.find(st=>st.id===_selectedNoteStudentId);
        if (s) { studentName=s.name; studentAvatar=s.avatar; }
    }
    if (_editingNoteId) {
        const note = communicationLog.find(n=>n.id===_editingNoteId);
        if (note) { note.content=content; note.type=_selectedNoteType; note.date=date; note.studentId=_selectedNoteStudentId; note.studentName=studentName; note.studentAvatar=studentAvatar; }
        showToast('Đã cập nhật nhận xét!');
    } else {
        communicationLog.push({ id:'n'+Date.now(), classId:currentClassId, studentId:_selectedNoteStudentId, studentName, studentAvatar, type:_selectedNoteType, content, date, createdAt:now });
        showToast(`Đã lưu nhận xét cho ${studentName}!`);
    }
    saveData();
    closeAddNoteModal();
    renderCommunicationLog();
}

function deleteNote(noteId) {
    const note = communicationLog.find(n=>n.id===noteId); if(!note) return;
    if (!confirm(`Xóa nhận xét này?`)) return;
    communicationLog = communicationLog.filter(n=>n.id!==noteId);
    saveData(); renderCommunicationLog();
    showToast('Đã xóa nhận xét', false);
}

// Shortcut: open note modal from student profile
function addNoteFromProfile(studentId) {
    closeStudentProfile();
    setTimeout(()=>{ openCommunicationLog(studentId); setTimeout(()=>openAddNoteModal(studentId), 200); }, 300);
}

