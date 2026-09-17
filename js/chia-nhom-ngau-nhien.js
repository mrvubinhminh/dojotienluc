// ============================================================
// CHIA NHÓM NGẪU NHIÊN
// ============================================================
const GROUP_COLORS = [
    { bg:'#7c3aed', light:'#ede9fe', text:'#5b21b6', name:'Nhóm' },  // violet
    { bg:'#2563eb', light:'#dbeafe', text:'#1e40af', name:'Nhóm' },  // blue
    { bg:'#059669', light:'#d1fae5', text:'#065f46', name:'Nhóm' },  // green
    { bg:'#dc2626', light:'#fee2e2', text:'#991b1b', name:'Nhóm' },  // red
    { bg:'#d97706', light:'#fef3c7', text:'#92400e', name:'Nhóm' },  // amber
    { bg:'#db2777', light:'#fce7f3', text:'#9d174d', name:'Nhóm' },  // pink
    { bg:'#0891b2', light:'#cffafe', text:'#164e63', name:'Nhóm' },  // cyan
    { bg:'#65a30d', light:'#ecfccb', text:'#3f6212', name:'Nhóm' },  // lime
];

let _groupMode    = 'byGroup';  // 'byGroup' | 'bySize'
let _groupNum     = 4;
let _groupResult  = [];         // [ [student, ...], ... ]
let _groupProjector = false;

function openGroupDivider() {
    const cls = classes.find(c=>c.id===currentClassId);
    const cnt = students.filter(s=>s.classId===currentClassId).length;
    document.getElementById('groupDividerSubtitle').innerText = `${cls?.name||''} · ${cnt} học sinh`;
    _groupMode = 'byGroup';
    _groupNum  = Math.min(4, Math.floor(cnt/2)||2);
    _updateGroupUI();
    document.getElementById('groupDividerBackdrop').classList.remove('hidden');
    setTimeout(()=>document.getElementById('groupDividerModal').classList.remove('translate-y-full'), 10);
}

function closeGroupDivider() {
    document.getElementById('groupDividerModal').classList.add('translate-y-full');
    setTimeout(()=>document.getElementById('groupDividerBackdrop').classList.add('hidden'), 300);
}

function setGroupMode(mode) {
    _groupMode = mode;
    document.getElementById('groupModeByGroup').className = `flex-1 py-2.5 rounded-xl font-bold text-sm transition ${mode==='byGroup'?'bg-violet-600 text-white shadow':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`;
    document.getElementById('groupModeBySize').className  = `flex-1 py-2.5 rounded-xl font-bold text-sm transition ${mode==='bySize' ?'bg-violet-600 text-white shadow':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`;
    document.getElementById('groupInputLabel').innerText = mode==='byGroup' ? 'Số nhóm' : 'Số học sinh / nhóm';
    _updateGroupUI();
}

function adjustGroupNum(delta) {
    const cnt = students.filter(s=>s.classId===currentClassId).length;
    const min = 2, max = _groupMode==='byGroup' ? Math.floor(cnt/2)||2 : Math.floor(cnt/2)||2;
    _groupNum = Math.max(min, Math.min(max, _groupNum + delta));
    _updateGroupUI();
}

function _updateGroupUI() {
    const cnt = students.filter(s=>s.classId===currentClassId).length;
    document.getElementById('groupNumDisplay').innerText = _groupNum;
    let preview = '';
    if (_groupMode === 'byGroup') {
        const perGroup = Math.ceil(cnt / _groupNum);
        preview = `→ ${_groupNum} nhóm · mỗi nhóm ~${perGroup} học sinh`;
    } else {
        const numGroups = Math.ceil(cnt / _groupNum);
        preview = `→ ${numGroups} nhóm · mỗi nhóm ~${_groupNum} học sinh`;
    }
    document.getElementById('groupPreviewText').innerText = preview;
}

function _shuffle(arr) {
    const a = [...arr];
    for (let i=a.length-1; i>0; i--) {
        const j = Math.floor(Math.random()*(i+1));
        [a[i],a[j]] = [a[j],a[i]];
    }
    return a;
}

function startGroupDivide() {
    const all = students.filter(s=>s.classId===currentClassId);
    if (!all.length) { showToast('Lớp chưa có học sinh!', false); return; }
    closeGroupDivider();
    _doGroupDivide(all);
    setTimeout(()=>{
        const overlay = document.getElementById('groupResultOverlay');
        overlay.classList.remove('hidden');
        // Mặc định vào chế độ trình chiếu
        _groupProjector = true;
        overlay.classList.add('projector-mode');
        document.getElementById('btnGroupProjector').innerHTML = '<i class="fas fa-compress"></i> Thu nhỏ';
        if (overlay.requestFullscreen) overlay.requestFullscreen().catch(()=>{});
        _renderGroupResult();
    }, 320);
}

function _doGroupDivide(all) {
    const shuffled = _shuffle(all);
    const cnt = shuffled.length;
    let numGroups;
    if (_groupMode === 'byGroup') {
        numGroups = Math.min(_groupNum, cnt);
    } else {
        numGroups = Math.ceil(cnt / _groupNum);
    }
    _groupResult = Array.from({length: numGroups}, ()=>[]);
    shuffled.forEach((s, i) => _groupResult[i % numGroups].push(s));
    // If equalSize checked, try to balance
    const equalSize = document.getElementById('groupEqualSize')?.checked;
    if (equalSize) {
        // Already round-robin = balanced
    }
    _renderGroupResult();
}

function reshuffleGroups() {
    const all = students.filter(s=>s.classId===currentClassId);
    // Small animation flash
    const list = document.getElementById('groupResultList');
    list.style.opacity = '0';
    list.style.transition = 'opacity 0.15s';
    setTimeout(()=>{
        _doGroupDivide(all);
        list.style.opacity = '1';
    }, 150);
}

function _renderGroupResult() {
    const showAvatar = document.getElementById('groupShowAvatar')?.checked ?? true;
    const list = document.getElementById('groupResultList');
    const numGroups = _groupResult.length;

    document.getElementById('groupResultTitle').innerText =
        `${numGroups} nhóm · ${students.filter(s=>s.classId===currentClassId).length} học sinh`;

    list.className = 'flex-1 overflow-y-auto p-4 no-scrollbar grid gap-4';
    // Responsive columns
    if (numGroups <= 2)      list.style.gridTemplateColumns = 'repeat(2,1fr)';
    else if (numGroups <= 4) list.style.gridTemplateColumns = 'repeat(2,1fr)';
    else if (numGroups <= 6) list.style.gridTemplateColumns = 'repeat(3,1fr)';
    else                     list.style.gridTemplateColumns = 'repeat(auto-fit,minmax(160px,1fr))';

    list.innerHTML = _groupResult.map((members, gi) => {
        const col = GROUP_COLORS[gi % GROUP_COLORS.length];
        const delay = gi * 80;
        const memberHTML = members.map((s, mi) => `
            <div class="flex items-center gap-2 py-1.5 ${mi < members.length-1 ? 'border-b border-white border-opacity-20' : ''}">
                <!-- STT: prominent display -->
                <div class="stt-pop flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center font-black shadow-lg"
                     style="background:rgba(255,255,255,0.22);animation-delay:${delay + mi*60}ms">
                    <span class="group-member-stt text-white" style="font-size:2rem;line-height:1;letter-spacing:-1px">${s.stt||'?'}</span>
                </div>
                <div class="flex-1 overflow-hidden">
                    ${showAvatar?`<img src="${s.avatar}" class="w-6 h-6 rounded-full object-contain bg-white bg-opacity-20 mb-0.5 inline-block mr-1">`:''}
                    <span class="group-member-name text-white font-bold leading-tight block truncate" style="font-size:0.85rem">${s.name}</span>
                </div>
            </div>`).join('');

        return `
            <div class="rounded-2xl overflow-hidden group-card-anim shadow-xl" style="animation-delay:${delay}ms;background:${col.bg}">
                <!-- Group header -->
                <div class="flex items-center justify-between px-3 pt-3 pb-2" style="background:rgba(0,0,0,0.2)">
                    <span class="group-card-header text-white font-black" style="font-size:1.1rem">Nhóm ${gi+1}</span>
                    <div class="flex items-center gap-2">
                        <span class="text-white text-opacity-60 text-xs font-bold">${members.length} HS</span>
                        <button onclick="_randomCallFromGroup(${gi})" class="group-award-btn text-[10px] font-black bg-pink-500 text-white px-2 py-0.5 rounded-lg hover:bg-pink-400 active:scale-95 transition flex items-center gap-0.5 shadow">
                            <i class="fas fa-dice text-[8px]"></i> Gọi
                        </button>
                        <button onclick="_awardGroup(${gi})" class="group-award-btn text-[10px] font-black bg-yellow-400 text-gray-900 px-2 py-0.5 rounded-lg hover:bg-yellow-300 active:scale-95 transition flex items-center gap-0.5 shadow">
                            <i class="fas fa-star text-[8px]"></i> Điểm
                        </button>
                    </div>
                </div>
                <!-- Members -->
                <div class="px-3 pb-3 flex flex-col gap-0">
                    ${memberHTML}
                </div>
            </div>`;
    }).join('');
}

function closeGroupResult() {
    _groupProjector = false;
    document.getElementById('groupResultOverlay').classList.remove('projector-mode');
    document.getElementById('groupResultOverlay').classList.add('hidden');
    document.getElementById('btnGroupProjector').innerHTML = '<i class="fas fa-expand"></i> Chiếu';
}

// Cho điểm một nhóm cụ thể
function _awardGroup(gi) {
    const members = _groupResult[gi];
    if (!members || !members.length) return;
    const ids = members.map(s => s.id);
    openGroupModal(ids, `Nhóm ${gi + 1} · ${members.length} học sinh`);
}

// ── RANDOM CALL ──────────────────────────────────────────────────────────────
let _randomCallTarget = null; // { student, groupIndex }
let _randomCallSpinTimer = null;
let _randomCallPool = null;   // null = all groups, or array of students from 1 group

// Gọi ngẫu nhiên toàn lớp (không cần có nhóm)
function _randomCallGlobal() {
    const pool = students.filter(s => s.classId === currentClassId);
    if (!pool.length) { showToast('Lớp chưa có học sinh!', false); return; }
    _randomCallPool = pool;
    _doRandomCall(null);
}

function _randomCallFromGroup(gi) {
    const members = _groupResult[gi];
    if (!members || !members.length) return;
    _randomCallPool = members;
    _doRandomCall(gi);
}

function _randomCall() {
    _randomCallPool = null;
    _doRandomCall(null);
}

function _randomCallAgain() {
    // Reuse same pool (group or all)
    const gi = _randomCallPool
        ? _groupResult.findIndex(g => g === _randomCallPool || (g.length && _randomCallPool.length && g[0]?.id === _randomCallPool[0]?.id))
        : null;
    _doRandomCall(gi >= 0 ? gi : null);
}

function _doRandomCall(fixedGi) {
    const pool = _randomCallPool || _groupResult.flat();
    const allStudents = pool;
    if (!allStudents.length) { showToast('Chưa có nhóm nào!', false); return; }

    // Reset UI
    document.getElementById('randomCallBackdrop').classList.remove('hidden');
    document.getElementById('randomCallModal').classList.remove('hidden');
    document.getElementById('randomCallActions').classList.add('hidden');
    document.getElementById('randomCallSpinBtn').classList.add('hidden');
    document.getElementById('randomCallFeedback').classList.add('hidden');
    document.getElementById('randomCallAvatar').classList.add('hidden');
    document.getElementById('randomCallName').classList.add('hidden');
    document.getElementById('randomCallStt').classList.add('hidden');
    document.getElementById('randomCallReel').classList.remove('hidden');
    document.getElementById('randomCallGroupLabel').innerText = fixedGi !== null
        ? `Nhóm ${fixedGi + 1} · ${allStudents.length} học sinh`
        : `${_groupResult.length} nhóm · ${allStudents.length} học sinh`;

    // Spin animation
    clearInterval(_randomCallSpinTimer);
    let tick = 0;
    _randomCallSpinTimer = setInterval(() => {
        const rnd = allStudents[Math.floor(Math.random() * allStudents.length)];
        document.getElementById('randomCallReel').innerText = rnd.name;
        tick++;
    }, 80);

    // Stop after ~2s, reveal chosen student
    setTimeout(() => {
        clearInterval(_randomCallSpinTimer);
        // Pick final student
        const chosen = allStudents[Math.floor(Math.random() * allStudents.length)];
        const gi = _groupResult.findIndex(g => g.some(s => s.id === chosen.id));
        _randomCallTarget = { student: chosen, groupIndex: gi };
        const col = gi >= 0 ? GROUP_COLORS[gi % GROUP_COLORS.length] : null;

        // Update header color to group color
        if (col) document.getElementById('randomCallHeader').style.background = col.bg;

        // Show student
        document.getElementById('randomCallReel').classList.add('hidden');
        document.getElementById('randomCallAvatarImg').src = chosen.avatar || '';
        document.getElementById('randomCallAvatar').classList.remove('hidden');
        document.getElementById('randomCallName').innerText = chosen.name;
        document.getElementById('randomCallName').classList.remove('hidden');
        document.getElementById('randomCallStt').innerText =
            `STT ${chosen.stt || '?'}${gi >= 0 ? ' · Nhóm ' + (gi + 1) : ''}`;
        document.getElementById('randomCallStt').classList.remove('hidden');
        document.getElementById('randomCallGroupLabel').innerText =
            gi >= 0 ? `Nhóm ${gi + 1} · ${_groupResult[gi].length} thành viên` : '';
        document.getElementById('randomCallActions').classList.remove('hidden');
        document.getElementById('randomCallSpinBtn').classList.remove('hidden');
    }, 2000);
}

function _randomCallResult(correct) {
    if (!_randomCallTarget) return;
    const { student, groupIndex } = _randomCallTarget;
    const feedback = document.getElementById('randomCallFeedback');
    const members = groupIndex >= 0 ? _groupResult[groupIndex] : [student];
    const ids = members.map(s => s.id);

    if (correct) {
        feedback.className = 'mt-3 py-3 px-4 rounded-2xl text-base font-black text-center bg-green-100 text-green-700';
        feedback.innerText = `✅ Đúng! Cả nhóm ${groupIndex + 1} được điểm cộng!`;
        feedback.classList.remove('hidden');
        document.getElementById('randomCallActions').classList.add('hidden');
        openGroupModal(ids, `Nhóm ${groupIndex + 1} · Trả lời ĐÚNG`);
    } else {
        feedback.className = 'mt-3 py-3 px-4 rounded-2xl text-base font-black text-center bg-red-100 text-red-700';
        feedback.innerText = `❌ Sai! Cả nhóm ${groupIndex + 1} bị trừ điểm!`;
        feedback.classList.remove('hidden');
        document.getElementById('randomCallActions').classList.add('hidden');
        // Open group modal with negative skill context
        openGroupModal(ids, `Nhóm ${groupIndex + 1} · Trả lời SAI`);
    }
}

function closeRandomCall() {
    clearInterval(_randomCallSpinTimer);
    document.getElementById('randomCallBackdrop').classList.add('hidden');
    document.getElementById('randomCallModal').classList.add('hidden');
    _randomCallTarget = null;
}

// ── EXPORT CLASS LIST ────────────────────────────────────────────────────────
function exportClassList() {
    const cls = classes.find(c => c.id === currentClassId);
    if (!cls) return alert('Không tìm thấy lớp!');
    const list = students
        .filter(s => s.classId === currentClassId)
        .sort((a, b) => (a.stt || 999) - (b.stt || 999));
    if (!list.length) return alert('Lớp chưa có học sinh!');

    const wsData = [
        [`DANH SÁCH LỚP ${cls.name.toUpperCase()}`, '', '', ''],
        [`Xuất ngày: ${new Date().toLocaleDateString('vi-VN')}`, '', '', ''],
        ['', '', '', ''],
        ['STT', 'Nickname', 'Họ và tên thật', 'Ngày sinh'],
    ];
    list.forEach((s, i) => {
        wsData.push([
            s.stt || (i + 1),
            s.name,
            s.realName || s.name,
            s.dob || '',
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    // Styles
    ws['A1'].s = { font: { bold: true, sz: 14, color: { rgb: 'FFFFFF' }, name: 'Arial' }, fill: { fgColor: { rgb: '0EA5E9' } }, alignment: { horizontal: 'center' } };
    ws['A2'].s = { font: { italic: true, sz: 10, color: { rgb: '555555' }, name: 'Arial' }, alignment: { horizontal: 'center' } };
    ['A', 'B', 'C', 'D'].forEach(col => {
        const cr = col + '4';
        if (ws[cr]) ws[cr].s = { font: { bold: true, color: { rgb: 'FFFFFF' }, name: 'Arial' }, fill: { fgColor: { rgb: '1B2A4A' } }, alignment: { horizontal: 'center' } };
    });
    for (let r = 4; r < wsData.length; r++) {
        ['A', 'B', 'C', 'D'].forEach((col, ci) => {
            const cr = col + (r + 1);
            if (!ws[cr]) return;
            ws[cr].s = {
                font: { name: 'Arial', sz: 11 },
                border: { top: { style: 'thin', color: { rgb: 'DDDDDD' } }, bottom: { style: 'thin', color: { rgb: 'DDDDDD' } }, left: { style: 'thin', color: { rgb: 'DDDDDD' } }, right: { style: 'thin', color: { rgb: 'DDDDDD' } } },
                alignment: { vertical: 'center', horizontal: ci === 0 ? 'center' : 'left' },
                fill: r % 2 === 0 ? { fgColor: { rgb: 'F0F9FF' } } : { fgColor: { rgb: 'FFFFFF' } },
            };
        });
    }
    ws['!cols'] = [{ wch: 8 }, { wch: 22 }, { wch: 28 }, { wch: 14 }];
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh_sach');
    XLSX.writeFile(wb, `DanhSach_${cls.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('Đã tải danh sách lớp Excel!');
}

// Cho điểm toàn bộ các nhóm (cả lớp)
function _awardAllGroups() {
    const all = _groupResult.flat();
    if (!all.length) return;
    const ids = all.map(s => s.id);
    openGroupModal(ids, `Tất cả ${_groupResult.length} nhóm · ${ids.length} học sinh`);
}

