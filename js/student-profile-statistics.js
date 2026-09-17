// ============================================================
// STUDENT PROFILE / STATISTICS
// ============================================================
function openStudentProfile(id) {
    if (!id) return;
    const s = students.find(st=>st.id===id);
    if (!s) return;
    closePointsModal();
    setTimeout(() => {
        renderStudentProfile(s);
        document.getElementById('profileModal').classList.remove('hidden');
    }, 320);
}

function closeStudentProfile() {
    document.getElementById('profileModal').classList.add('hidden');
}

function renderStudentProfile(s) {
    // Header
    document.getElementById('profileAvatar').src = s.avatar;
    document.getElementById('profileName').innerText = s.name;
    document.getElementById('profileMeta').innerText = `STT: ${s.stt||'-'} | Ngày sinh: ${s.dob||'Chưa có'}`;
    document.getElementById('profilePosVal').innerText = s.positivePoints;
    document.getElementById('profileNegVal').innerText = s.negativePoints;
    document.getElementById('profileTotal').innerText = s.points;

    // Milestone badge
    const ms = getMilestone(s.points);
    const badge = document.getElementById('profileBadge');
    if (ms) { badge.innerText = ms.icon; badge.title = ms.label; badge.classList.remove('hidden'); }
    else badge.classList.add('hidden');

    // Nhận xét đầy đủ
    document.getElementById('profileComment').innerText = generateComment(s);

    // Thống kê kỹ năng từ history
    const studentHistory = history.filter(h => h.studentId===s.id && h.classId===currentClassId);
    const breakdown = document.getElementById('profileSkillBreakdown');
    const emptyMsg  = document.getElementById('profileSkillEmpty');
    breakdown.innerHTML = '';

    if (!studentHistory.length) {
        emptyMsg.classList.remove('hidden');
    } else {
        emptyMsg.classList.add('hidden');
        // Gom nhóm theo skillName
        const map = {};
        studentHistory.forEach(h => {
            if (!map[h.skillName]) map[h.skillName] = { count:0, total:0, isPos: h.points>0 };
            map[h.skillName].count++;
            map[h.skillName].total += h.points;
        });
        // Sắp xếp: tích cực trước, sau đó theo tần suất
        const entries = Object.entries(map).sort((a,b) => {
            if (a[1].isPos !== b[1].isPos) return a[1].isPos ? -1 : 1;
            return b[1].count - a[1].count;
        });
        // Max count for bar width
        const maxCount = Math.max(...entries.map(([,v])=>v.count));
        entries.forEach(([name,{count,total,isPos}]) => {
            const pct = Math.round((count/maxCount)*100);
            const color = isPos ? 'bg-green-400' : 'bg-red-400';
            const textColor = isPos ? 'text-green-700' : 'text-red-700';
            const bg = isPos ? 'bg-green-50' : 'bg-red-50';
            breakdown.insertAdjacentHTML('beforeend', `
                <div class="${bg} rounded-xl p-2.5">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-xs font-bold text-gray-700">${name}</span>
                        <div class="flex items-center gap-2">
                            <span class="text-[11px] text-gray-500">${count} lần</span>
                            <span class="text-xs font-black ${textColor}">${total>0?'+':''}${total}</span>
                        </div>
                    </div>
                    <div class="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div class="${color} h-full rounded-full transition-all" style="width:${pct}%"></div>
                    </div>
                </div>`);
        });
    }

    // Sổ liên lạc của học sinh này
    const noteList  = document.getElementById('profileNoteList');
    const noteEmpty = document.getElementById('profileNoteEmpty');
    noteList.innerHTML = '';
    const studentNotes = communicationLog
        .filter(n=>n.classId===s.classId && n.studentId===s.id)
        .sort((a,b)=>b.createdAt.localeCompare(a.createdAt))
        .slice(0,10);
    if (!studentNotes.length) {
        noteEmpty.classList.remove('hidden');
    } else {
        noteEmpty.classList.add('hidden');
        studentNotes.forEach(note=>{
            const nt = NOTE_TYPES[note.type]||NOTE_TYPES.notice;
            noteList.insertAdjacentHTML('beforeend',`
                <div class="flex items-start gap-2 p-2 rounded-xl ${nt.bg} border ${nt.border}">
                    <i class="fas ${nt.icon} ${nt.text} mt-0.5 text-sm flex-shrink-0"></i>
                    <div class="flex-1 overflow-hidden">
                        <p class="text-xs font-bold ${nt.text}">${nt.label} · ${note.date||note.createdAt.slice(0,10)}</p>
                        <p class="text-xs text-gray-700 mt-0.5 leading-snug">${note.content}</p>
                    </div>
                </div>`);
        });
    }
    document.getElementById('btnProfileAddNote').onclick = () => addNoteFromProfile(s.id);
    document.getElementById('btnProfileCert').onclick = () => openCertificateModal(s.id);

    // Mục tiêu cá nhân
    renderProfileGoals(s);

    // Lịch sử gần đây (20 sự kiện gần nhất)
    const histList = document.getElementById('profileHistoryList');
    const histEmpty = document.getElementById('profileHistoryEmpty');
    const histCount = document.getElementById('profileHistoryCount');
    histList.innerHTML = '';

    if (!studentHistory.length) {
        histEmpty.classList.remove('hidden');
        histCount.innerText = '';
    } else {
        histEmpty.classList.add('hidden');
        const sorted = [...studentHistory].sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));
        histCount.innerText = `${sorted.length} sự kiện`;
        sorted.slice(0, 20).forEach(h => {
            const isPos = h.points > 0;
            const dt = new Date(h.timestamp);
            const timeStr = dt.toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});
            const dateStr = dt.toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit'});
            histList.insertAdjacentHTML('beforeend', `
                <div class="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5 border border-gray-100">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isPos?'bg-green-100':'bg-red-100'}">
                        <i class="fas ${isPos?'fa-plus text-green-600':'fa-minus text-red-600'} text-xs"></i>
                    </div>
                    <div class="flex-1 overflow-hidden">
                        <p class="text-xs font-bold text-gray-700 truncate">${h.skillName}</p>
                        <p class="text-[10px] text-gray-400">${dateStr} · ${timeStr}</p>
                    </div>
                    <span class="text-sm font-black flex-shrink-0 ${isPos?'text-green-600':'text-red-600'}">${isPos?'+':''}${h.points}</span>
                </div>`);
        });
    }
}

