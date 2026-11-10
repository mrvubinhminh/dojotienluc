// ============================================================
// STT PANEL
// ============================================================
let sttSelected = new Set();
let sttPanelOpen = false;

function toggleSttPanel() {
    sttPanelOpen = !sttPanelOpen;
    const panel = document.getElementById('sttPanel');
    const btn   = document.getElementById('btnSttPanel');
    panel.classList.toggle('hidden', !sttPanelOpen);
    btn.className = sttPanelOpen
        ? 'text-white text-xs font-bold bg-purple-600 px-3 py-1.5 rounded-full transition shadow-sm flex items-center'
        : 'text-purple-600 text-xs font-bold bg-purple-50 px-3 py-1.5 rounded-full hover:bg-purple-100 transition border border-purple-100 shadow-sm flex items-center';
    btn.innerHTML = sttPanelOpen
        ? '<i class="fas fa-times mr-1"></i>Đóng'
        : '<i class="fas fa-hashtag mr-1"></i>Theo STT';
    if (sttPanelOpen) renderSttChips();
    else {
        sttSelected.forEach(id=>document.getElementById(`student-card-${id}`)?.classList.remove('ring-2','ring-purple-500'));
        sttSelected.clear(); updateSttAwardBtn();
    }
}

function renderSttChips() {
    const container = document.getElementById('sttChips');
    if (!container) return;
    container.innerHTML = '';
    const classStudents = students.filter(s=>s.classId===currentClassId)
                                  .sort((a,b)=>(a.stt||0)-(b.stt||0));
    if (!classStudents.length) {
        container.innerHTML = '<p class="text-xs text-gray-400 italic">Lớp chưa có học sinh.</p>';
        return;
    }
    classStudents.forEach(s => {
        const stt = s.stt || 0;
        const sel = sttSelected.has(s.id);
        const chip = document.createElement('button');
        chip.id = `stt-chip-${s.id}`;
        chip.className = _sttChipClass(sel);
        chip.title = s.name;
        chip.innerText = stt;
        chip.onclick = () => toggleSttChip(s.id);
        container.appendChild(chip);
    });
}

// Bấm số để chọn/bỏ chọn nhiều em, rồi bấm "Cho/trừ điểm (N học sinh)". Chỉ đổi đúng ô vừa bấm,
// không vẽ lại cả danh sách.
function toggleSttChip(id) {
    const on = !sttSelected.has(id);
    if (on) sttSelected.add(id); else sttSelected.delete(id);
    const chip = document.getElementById(`stt-chip-${id}`);
    if (chip) chip.className = _sttChipClass(on);
    document.getElementById(`student-card-${id}`)?.classList.toggle('ring-2', on);
    document.getElementById(`student-card-${id}`)?.classList.toggle('ring-purple-500', on);
    updateSttAwardBtn();
}
function _sttChipClass(sel) {
    return `w-10 h-10 rounded-full text-sm font-black flex items-center justify-center transition-colors shadow-sm ${
        sel ? 'bg-purple-600 text-white ring-2 ring-purple-300' : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-400'}`;
}

function selectAllStt() {
    students.filter(s=>s.classId===currentClassId).forEach(s=>{
        sttSelected.add(s.id);
        const card=document.getElementById(`student-card-${s.id}`);
        if(card) card.classList.add('ring-2','ring-purple-500');
    });
    renderSttChips();
    updateSttAwardBtn();
}

function clearSttSelection() {
    sttSelected.forEach(id => {
        const card = document.getElementById(`student-card-${id}`);
        if (card) card.classList.remove('ring-2','ring-purple-500');
    });
    sttSelected.clear();
    renderSttChips();
    updateSttAwardBtn();
}

function updateSttAwardBtn() {
    const btn = document.getElementById('btnAwardByStt');
    if (!btn) return;
    if (sttSelected.size > 0) {
        btn.classList.remove('hidden');
        btn.classList.add('flex');
        document.getElementById('sttAwardLabel').innerText = `Cho/trừ điểm (${sttSelected.size} học sinh)`;
    } else {
        btn.classList.add('hidden');
        btn.classList.remove('flex');
    }
}

function awardByStt() {
    const ids = [...sttSelected];
    if (!ids.length) return;
    const names = ids.map(id => {
        const s = students.find(st=>st.id===id);
        return s ? `#${s.stt} ${s.name}` : '';
    }).filter(Boolean);
    openGroupModal(ids, `${ids.length} học sinh (${names.slice(0,3).join(', ')}${ids.length>3?'…':''})`);
}

