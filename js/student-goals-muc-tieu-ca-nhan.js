// ============================================================
// STUDENT GOALS – MỤC TIÊU CÁ NHÂN
// ============================================================
const GOAL_TYPES = {
    points:         { label:'Điểm thi đua', icon:'fa-star',         color:'text-amber-600',  bg:'bg-amber-50',  border:'border-amber-200',  ring:'ring-amber-400',  hint:'Đạt tổng điểm thi đua ≥ X' },
    positive:       { label:'Điểm cộng',    icon:'fa-plus-circle',  color:'text-green-600',  bg:'bg-green-50',  border:'border-green-200',  ring:'ring-green-400',  hint:'Tích lũy điểm cộng ≥ X' },
    negative_limit: { label:'Giảm điểm trừ',icon:'fa-shield-alt',   color:'text-blue-600',   bg:'bg-blue-50',   border:'border-blue-200',   ring:'ring-blue-400',   hint:'Giữ điểm trừ ≤ X (thấp hơn = tốt hơn)' },
    custom:         { label:'Tùy chỉnh',    icon:'fa-flag',         color:'text-purple-600', bg:'bg-purple-50', border:'border-purple-200', ring:'ring-purple-400', hint:'Mục tiêu tự đặt, cập nhật thủ công' },
};

let _editingGoalId = null;
let _goalStudentId = null;
let _selectedGoalType = 'points';

function getGoalProgress(goal) {
    const s = students.find(st=>st.id===goal.studentId);
    if (!s) return { current:0, target:goal.targetValue, pct:0 };
    let current = 0;
    if (goal.type === 'points')         current = s.points;
    else if (goal.type === 'positive')  current = s.positivePoints;
    else if (goal.type === 'negative_limit') current = s.negativePoints;
    else current = goal.currentValue || 0;
    const target = goal.targetValue;
    let pct;
    if (goal.type === 'negative_limit') {
        pct = target > 0 ? Math.min(100, Math.max(0, Math.round(((target - current) / target) * 100))) : (current===0?100:0);
    } else {
        pct = target > 0 ? Math.min(100, Math.max(0, Math.round((current / target) * 100))) : 0;
    }
    return { current, target, pct };
}

function isGoalAchieved(goal) {
    const s = students.find(st=>st.id===goal.studentId);
    if (!s) return false;
    if (goal.type === 'points') return s.points >= goal.targetValue;
    if (goal.type === 'positive') return s.positivePoints >= goal.targetValue;
    if (goal.type === 'negative_limit') return s.negativePoints <= goal.targetValue;
    return (goal.currentValue || 0) >= goal.targetValue;
}

function checkGoalAchievements(studentId) {
    const active = studentGoals.filter(g => g.studentId===studentId && g.status==='active');
    let anyAchieved = false;
    active.forEach(g => {
        if (isGoalAchieved(g)) {
            g.status = 'achieved';
            anyAchieved = true;
            const s = students.find(st=>st.id===studentId);
            showToast(`🎯 ${s?.name||'Học sinh'} đạt mục tiêu: "${g.title}"!`, true);
            confetti({ particleCount:80, spread:75, origin:{y:0.6} });
            // Award bonus points if set
            if (g.bonusPoints && g.bonusPoints > 0 && s) {
                setTimeout(() => {
                    if (confirm(`🎉 ${s.name} đạt mục tiêu "${g.title}"!\n\nThưởng ${g.bonusPoints} điểm thi đua?`)) {
                        const old = s.points;
                        s.points += g.bonusPoints;
                        s.positivePoints += g.bonusPoints;
                        history.push({id:Date.now(),classId:s.classId,studentId:s.id,studentName:s.name,skillName:`🎯 Thưởng mục tiêu: ${g.title}`,points:g.bonusPoints,timestamp:new Date().toISOString()});
                        checkMilestone(s, old);
                        saveData();
                        if(currentView==='classroom') renderStudents(); else if(currentView==='report') renderReport();
                    }
                }, 800);
            }
        }
    });
    if (anyAchieved) saveData();
    // Also check expired
    studentGoals.filter(g=>g.studentId===studentId && g.status==='active' && g.deadline && new Date(g.deadline)<new Date())
        .forEach(g=>{ g.status='expired'; });
    if (anyAchieved) saveData();
}

function selectGoalType(type) {
    _selectedGoalType = type;
    document.querySelectorAll('.goal-type-btn').forEach(btn => {
        btn.classList.remove('border-amber-400','border-green-400','border-blue-400','border-purple-400','shadow-md');
        if (btn.dataset.type === type) {
            const gt = GOAL_TYPES[type];
            const borderClass = gt.ring.replace('ring','border');
            btn.classList.add(borderClass, 'shadow-md');
        }
    });
    const gt = GOAL_TYPES[type] || GOAL_TYPES.custom;
    document.getElementById('goalTargetHint').innerText = gt.hint;
    const cs = document.getElementById('goalCustomSection');
    if (type === 'custom') cs.classList.remove('hidden');
    else cs.classList.add('hidden');
    // Auto-fill title placeholder
    const titleInput = document.getElementById('goalTitleInput');
    if (!titleInput.value) {
        const defaults = { points:'Đạt điểm thi đua cao', positive:'Tích lũy điểm cộng', negative_limit:'Hạn chế điểm trừ', custom:'Mục tiêu mới' };
        titleInput.placeholder = defaults[type] || 'Nhập tên mục tiêu';
    }
}

function openAddGoalModal(studentId, goalId=null) {
    _goalStudentId = studentId;
    _editingGoalId = goalId;
    const s = students.find(st=>st.id===studentId);
    document.getElementById('addGoalStudentName').innerText = s?.name||'';

    if (goalId) {
        const g = studentGoals.find(g=>g.id===goalId);
        if (!g) return;
        document.getElementById('addGoalTitle').innerText = 'Sửa mục tiêu';
        document.getElementById('saveGoalLabel').innerText = 'Cập nhật';
        document.getElementById('goalTitleInput').value = g.title;
        document.getElementById('goalTargetInput').value = g.targetValue;
        document.getElementById('goalDeadlineInput').value = g.deadline||'';
        document.getElementById('goalCurrentInput').value = g.currentValue||0;
        document.getElementById('goalBonusPoints').value = g.bonusPoints||0;
        selectGoalType(g.type);
    } else {
        document.getElementById('addGoalTitle').innerText = 'Thêm mục tiêu';
        document.getElementById('saveGoalLabel').innerText = 'Lưu mục tiêu';
        document.getElementById('goalTitleInput').value = '';
        document.getElementById('goalTargetInput').value = '';
        document.getElementById('goalDeadlineInput').value = '';
        document.getElementById('goalCurrentInput').value = '0';
        document.getElementById('goalBonusPoints').value = '0';
        selectGoalType('points');
    }

    document.getElementById('addGoalBackdrop').classList.remove('hidden');
    setTimeout(()=>document.getElementById('addGoalModal').classList.remove('translate-y-full'), 10);
}

function closeAddGoalModal() {
    document.getElementById('addGoalModal').classList.add('translate-y-full');
    setTimeout(()=>document.getElementById('addGoalBackdrop').classList.add('hidden'), 300);
}

function saveGoal() {
    const title = document.getElementById('goalTitleInput').value.trim() || document.getElementById('goalTitleInput').placeholder;
    const target = parseFloat(document.getElementById('goalTargetInput').value);
    const deadline = document.getElementById('goalDeadlineInput').value || null;
    const bonusPoints = parseInt(document.getElementById('goalBonusPoints').value)||0;

    if (!title) { showToast('Nhập tên mục tiêu!', false); return; }
    if (isNaN(target) || target < 0) { showToast('Nhập giá trị mục tiêu hợp lệ!', false); return; }

    const s = students.find(st=>st.id===_goalStudentId);
    if (!s) return;

    if (_editingGoalId) {
        const g = studentGoals.find(g=>g.id===_editingGoalId);
        if (g) {
            g.title = title; g.type = _selectedGoalType; g.targetValue = target;
            g.deadline = deadline; g.bonusPoints = bonusPoints;
            if (_selectedGoalType==='custom') g.currentValue = parseFloat(document.getElementById('goalCurrentInput').value)||0;
            if (g.status !== 'achieved') g.status = isGoalAchieved(g) ? 'achieved' : (g.deadline && new Date(g.deadline)<new Date() ? 'expired' : 'active');
        }
        showToast('Đã cập nhật mục tiêu!', true);
    } else {
        const newGoal = {
            id: 'g' + Date.now(),
            classId: s.classId,
            studentId: s.id,
            title, type: _selectedGoalType,
            targetValue: target,
            currentValue: _selectedGoalType==='custom' ? (parseFloat(document.getElementById('goalCurrentInput').value)||0) : 0,
            bonusPoints,
            deadline,
            status: 'active',
            createdAt: new Date().toISOString(),
        };
        if (isGoalAchieved(newGoal)) newGoal.status = 'achieved';
        studentGoals.push(newGoal);
        showToast('Đã thêm mục tiêu! 🎯', true);
    }

    saveData();
    closeAddGoalModal();
    setTimeout(()=>{
        renderProfileGoals(s);
        if (document.getElementById('goalsOverlay').classList.contains('hidden')===false) renderGoalsOverview();
    }, 350);
}

function deleteGoal(goalId) {
    const g = studentGoals.find(g=>g.id===goalId);
    if (!g) return;
    if (!confirm(`Xóa mục tiêu "${g.title}"?`)) return;
    studentGoals = studentGoals.filter(g=>g.id!==goalId);
    saveData();
    const s = students.find(st=>st.id===g.studentId);
    if (s && !document.getElementById('profileModal').classList.contains('hidden')) renderProfileGoals(s);
    if (!document.getElementById('goalsOverlay').classList.contains('hidden')) renderGoalsOverview();
    showToast('Đã xóa mục tiêu');
}

function updateCustomGoalProgress(goalId) {
    const goal = studentGoals.find(g=>g.id===goalId);
    if (!goal) return;
    const newVal = prompt(`Cập nhật tiến độ "${goal.title}"\nHiện tại: ${goal.currentValue||0} / ${goal.targetValue}`, goal.currentValue||0);
    if (newVal===null) return;
    const n = parseFloat(newVal);
    if (isNaN(n)) return;
    goal.currentValue = Math.max(0, n);
    if (goal.status==='active' && isGoalAchieved(goal)) {
        goal.status = 'achieved';
        const s = students.find(st=>st.id===goal.studentId);
        showToast(`🎯 Đạt mục tiêu: "${goal.title}"!`, true);
        confetti({particleCount:80, spread:75, origin:{y:0.6}});
        if (goal.bonusPoints>0 && s) {
            setTimeout(()=>{
                if(confirm(`🎉 Thưởng ${goal.bonusPoints} điểm?`)){
                    const old=s.points; s.points+=goal.bonusPoints; s.positivePoints+=goal.bonusPoints;
                    history.push({id:Date.now(),classId:s.classId,studentId:s.id,studentName:s.name,skillName:`🎯 Thưởng: ${goal.title}`,points:goal.bonusPoints,timestamp:new Date().toISOString()});
                    checkMilestone(s,old); saveData();
                    if(currentView==='classroom') renderStudents();
                }
            },800);
        }
    }
    saveData();
    const s = students.find(st=>st.id===goal.studentId);
    if (s && !document.getElementById('profileModal').classList.contains('hidden')) renderProfileGoals(s);
    if (!document.getElementById('goalsOverlay').classList.contains('hidden')) renderGoalsOverview();
}

function buildGoalCardHTML(goal) {
    const gt = GOAL_TYPES[goal.type]||GOAL_TYPES.custom;
    const prog = getGoalProgress(goal);
    const isAchieved = goal.status==='achieved';
    const isExpired = !isAchieved && goal.deadline && new Date(goal.deadline)<new Date();
    const statusLabel = isAchieved ? '✅ Đã đạt' : isExpired ? '⌛ Hết hạn' : '🎯 Đang thực hiện';
    const statusColor = isAchieved ? 'text-green-600' : isExpired ? 'text-red-500' : 'text-gray-500';
    const barColor   = isAchieved ? 'bg-green-400' : isExpired ? 'bg-red-300' : goal.type==='negative_limit'?'bg-blue-400':'bg-rose-400';
    const cardBg     = isAchieved ? 'bg-green-50 border-green-200' : isExpired ? 'bg-red-50 border-red-100' : `${gt.bg} ${gt.border}`;
    const currentLabel = goal.type==='negative_limit'
        ? `Điểm trừ: ${prog.current} (mục tiêu ≤ ${goal.targetValue})`
        : `${prog.current} / ${goal.targetValue}`;
    const deadlineStr = goal.deadline ? `<span class="${isExpired?'text-red-500':'text-gray-400'}"><i class="fas fa-calendar-alt mr-0.5"></i>Hạn: ${new Date(goal.deadline).toLocaleDateString('vi-VN')}</span>` : '';

    return `
        <div class="rounded-xl p-3 border-2 ${cardBg}">
            <div class="flex items-start justify-between gap-2 mb-2">
                <div class="flex-1 overflow-hidden">
                    <div class="flex items-center gap-1.5 mb-0.5">
                        <i class="fas ${gt.icon} ${gt.color} text-xs flex-shrink-0"></i>
                        <span class="text-sm font-bold text-gray-800 leading-snug">${goal.title}</span>
                        ${goal.bonusPoints>0?`<span class="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">+${goal.bonusPoints}🎁</span>`:''}
                    </div>
                    <p class="text-[10px] text-gray-500">${gt.label} · ${currentLabel}</p>
                    ${deadlineStr?`<p class="text-[10px] mt-0.5">${deadlineStr}</p>`:''}
                </div>
                <div class="flex items-center gap-1 flex-shrink-0 ml-1">
                    ${goal.type==='custom'&&!isAchieved?`<button onclick="updateCustomGoalProgress('${goal.id}')" class="w-6 h-6 bg-white rounded-full flex items-center justify-center border border-gray-200 text-gray-500 hover:text-purple-600 shadow-sm" title="Cập nhật tiến độ"><i class="fas fa-edit text-[9px]"></i></button>`:''}
                    <button onclick="openAddGoalModal(${goal.studentId},'${goal.id}')" class="w-6 h-6 bg-white rounded-full flex items-center justify-center border border-gray-200 text-gray-500 hover:text-dojo-blue shadow-sm" title="Sửa"><i class="fas fa-pen text-[9px]"></i></button>
                    <button onclick="deleteGoal('${goal.id}')" class="w-6 h-6 bg-white rounded-full flex items-center justify-center border border-gray-200 text-gray-500 hover:text-red-500 shadow-sm" title="Xóa"><i class="fas fa-trash text-[9px]"></i></button>
                </div>
            </div>
            <!-- Progress bar -->
            <div class="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mb-1">
                <div class="${barColor} h-full rounded-full transition-all duration-700" style="width:${prog.pct}%"></div>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-[10px] font-bold ${statusColor}">${statusLabel}</span>
                <span class="text-[10px] text-gray-400 font-semibold">${prog.pct}%</span>
            </div>
        </div>`;
}

function renderProfileGoals(s) {
    const goalList  = document.getElementById('profileGoalList');
    const goalEmpty = document.getElementById('profileGoalEmpty');
    if (!goalList) return;
    goalList.innerHTML = '';

    const sGoals = studentGoals.filter(g=>g.studentId===s.id && g.classId===s.classId)
        .sort((a,b)=> {
            const order = {active:0, achieved:1, expired:2};
            return (order[a.status]||0)-(order[b.status]||0);
        });

    if (!sGoals.length) {
        goalEmpty.classList.remove('hidden');
    } else {
        goalEmpty.classList.add('hidden');
        sGoals.forEach(g => goalList.insertAdjacentHTML('beforeend', buildGoalCardHTML(g)));
    }
    document.getElementById('btnProfileAddGoal').onclick = ()=>openAddGoalModal(s.id);
}

// ---- Goals Overview (full class) ----
function openGoalsOverview() {
    const overlay = document.getElementById('goalsOverlay');
    overlay.classList.remove('hidden');
    // Populate student filter
    const sel = document.getElementById('goalOverviewFilter');
    sel.innerHTML = '<option value="">Tất cả học sinh</option>';
    students.filter(s=>s.classId===currentClassId)
        .sort((a,b)=>a.stt-b.stt)
        .forEach(s=>{ sel.insertAdjacentHTML('beforeend',`<option value="${s.id}">${s.stt}. ${s.name}</option>`); });
    document.getElementById('goalStatusFilter').value='';
    document.getElementById('goalTypeFilter').value='';
    document.getElementById('goalOverviewFilter').value='';
    const cls = classes.find(c=>c.id===currentClassId);
    document.getElementById('goalsOverlaySubtitle').innerText = cls?.name||'';
    renderGoalsOverview();
}

function closeGoalsOverlay() {
    document.getElementById('goalsOverlay').classList.add('hidden');
}

function openAddGoalFromOverview() {
    const sid = parseInt(document.getElementById('goalOverviewFilter').value);
    if (!sid) { showToast('Chọn học sinh trước!', false); return; }
    openAddGoalModal(sid);
}

function renderGoalsOverview() {
    const filterStudent = parseInt(document.getElementById('goalOverviewFilter').value)||0;
    const filterStatus  = document.getElementById('goalStatusFilter').value;
    const filterType    = document.getElementById('goalTypeFilter').value;

    let all = studentGoals.filter(g=>g.classId===currentClassId);
    if (filterStudent) all = all.filter(g=>g.studentId===filterStudent);
    if (filterStatus)  all = all.filter(g=>g.status===filterStatus);
    if (filterType)    all = all.filter(g=>g.type===filterType);

    const active   = studentGoals.filter(g=>g.classId===currentClassId && g.status==='active').length;
    const achieved = studentGoals.filter(g=>g.classId===currentClassId && g.status==='achieved').length;
    const expired  = studentGoals.filter(g=>g.classId===currentClassId && g.status==='expired').length;
    document.getElementById('goalStatActive').innerText   = active;
    document.getElementById('goalStatAchieved').innerText = achieved;
    document.getElementById('goalStatExpired').innerText  = expired;

    // Show FAB only if a student is selected
    const fab = document.getElementById('goalsOverviewFab');
    if (filterStudent) fab.classList.remove('hidden'); else fab.classList.add('hidden');

    const container = document.getElementById('goalsOverviewList');
    container.innerHTML='';

    if (!all.length) {
        container.innerHTML=`<div class="text-center py-16 text-gray-400"><i class="fas fa-bullseye text-5xl mb-4 opacity-20"></i><p class="font-bold text-lg">Chưa có mục tiêu nào</p><p class="text-sm mt-1">Bấm vào học sinh để thêm mục tiêu!</p></div>`;
        return;
    }

    // Group by student
    const byStudent = {};
    all.forEach(g=>{
        if(!byStudent[g.studentId]) byStudent[g.studentId]=[];
        byStudent[g.studentId].push(g);
    });

    Object.entries(byStudent).forEach(([sid,goals])=>{
        const s=students.find(st=>st.id===parseInt(sid));
        if(!s) return;
        // sort goals within student: active first
        const sorted=goals.sort((a,b)=>{const o={active:0,achieved:1,expired:2};return(o[a.status]||0)-(o[b.status]||0);});
        container.insertAdjacentHTML('beforeend',`
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
                <div class="flex items-center gap-3 p-3 border-b border-gray-100 bg-gray-50">
                    <img src="${s.avatar}" class="w-10 h-10 rounded-full bg-blue-50 object-contain flex-shrink-0">
                    <div class="flex-1 overflow-hidden">
                        <p class="font-bold text-sm text-gray-800">${s.name}</p>
                        <p class="text-[10px] text-gray-400">STT: ${s.stt||'-'} · ${goals.length} mục tiêu · 🌟${s.points} điểm</p>
                    </div>
                    <button onclick="openAddGoalModal(${s.id})" class="text-xs bg-rose-50 text-rose-600 font-bold px-2.5 py-1.5 rounded-full border border-rose-100 hover:bg-rose-100 transition flex items-center gap-1"><i class="fas fa-plus text-[10px]"></i>Thêm</button>
                </div>
                <div class="p-3 flex flex-col gap-2">
                    ${sorted.map(g=>buildGoalCardHTML(g)).join('')}
                </div>
            </div>`);
    });
}

