// ============================================================
// POINTS MODAL
// ============================================================
function renderSkills() {
    const renderTab=(list,elId)=>{
        document.getElementById(elId).innerHTML=list.map(s=>`
            <button class="flex flex-col items-center p-2 rounded-xl border-2 ${s.color} hover:opacity-80 transition active:scale-95" onclick="addPoints('${s.id}',${s.points},'${s.name}')">
                <div class="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-1 shadow-sm"><i class="fas ${s.icon} text-lg"></i></div>
                <span class="text-[11px] font-bold leading-tight flex h-8 items-center text-center">${s.name}</span>
                <span class="mt-0.5 bg-white px-2 py-0.5 rounded-full text-[10px] font-black shadow-sm">${s.points>0?'+':''}${s.points}</span>
            </button>`).join('');
    };
    renderTab(skills.positive,'positiveSkills');
    renderTab(skills.negative,'negativeSkills');
    renderPresetGrid();
}

function renderPresetGrid() {
    const grid = document.getElementById('presetCardGrid');
    const badge = document.getElementById('currentPresetBadge');
    if (!grid) return;
    const cls = classes.find(c=>c.id===currentClassId);
    const activePreset = cls?.skillPreset || 'custom';

    // Update class label in header
    const lbl = document.getElementById('settingsClassLabel');
    if (lbl && cls) lbl.innerText = cls.name;

    // Update badge
    const ap = SKILL_PRESETS[activePreset];
    if (badge && ap) {
        badge.innerText = ap.label;
        badge.className = `text-[10px] font-bold px-2.5 py-1 rounded-full ${ap.bg} ${ap.color}`;
    }

    grid.innerHTML = Object.entries(SKILL_PRESETS).map(([key,ps])=>{
        const isActive = key === activePreset;
        return `
            <div class="flex items-center gap-3 p-3 rounded-xl border-2 transition cursor-pointer ${isActive ? ps.bg+' '+ps.border : 'bg-gray-50 border-transparent hover:border-gray-200'}" onclick="applySkillPreset('${key}')">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isActive?ps.bg:'bg-white'} border ${isActive?ps.border:'border-gray-200'}">
                    <i class="fas ${ps.icon} ${isActive?ps.color:'text-gray-400'} text-base"></i>
                </div>
                <div class="flex-1 overflow-hidden">
                    <p class="font-bold text-sm ${isActive?ps.color:'text-gray-700'}">${ps.label} ${isActive?'<span class="text-[10px] font-bold bg-white bg-opacity-60 px-1.5 py-0.5 rounded-full">Đang dùng</span>':''}</p>
                    <p class="text-[11px] text-gray-400 mt-0.5 truncate">${ps.description}</p>
                    ${key!=='custom'?`<p class="text-[10px] text-gray-400">${SKILL_PRESETS[key].positive.length} tích cực · ${SKILL_PRESETS[key].negative.length} vi phạm</p>`:''}
                </div>
                ${!isActive?`<button class="text-xs font-bold px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-dojo-blue hover:border-dojo-blue transition flex-shrink-0">Áp dụng</button>`:'<div class="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0"><i class="fas fa-check text-white text-[10px]"></i></div>'}
            </div>`;
    }).join('');
}

function applySkillPreset(presetKey) {
    const ps = SKILL_PRESETS[presetKey];
    if (!ps) return;
    const cls = classes.find(c=>c.id===currentClassId);
    if (!cls) return;

    let msg;
    if (presetKey === 'custom') {
        msg = `Đặt lại về bộ kỹ năng mặc định cho "${cls.name}"?`;
    } else {
        msg = `Áp dụng bộ kỹ năng "${ps.label}" (${ps.positive.length} tích cực, ${ps.negative.length} vi phạm) cho lớp "${cls.name}"?\n\nKỹ năng hiện tại sẽ được thay thế.`;
    }

    if (!confirm(msg)) return;

    cls.skillPreset = presetKey;
    if (presetKey === 'custom') {
        skills = JSON.parse(JSON.stringify(DEFAULT_SKILLS));
    } else {
        skills = JSON.parse(JSON.stringify({ positive: ps.positive, negative: ps.negative }));
    }
    saveData();
    renderSkills();
    showToast(`Đã áp dụng: ${ps.label} 🎯`, true);
}

function openPointsModal(id) {
    isAwardAll=false; selectedStudentId=id;
    const s=students.find(st=>st.id===id); if(!s) return;
    document.getElementById('modalStudentName').innerText=s.name;
    document.getElementById('modalStudentPoints').innerText=s.points;
    document.getElementById('modalStudentInfo').innerText=`STT: ${s.stt||'-'} | NS: ${s.dob||'Chưa có'}`;
    document.getElementById('modalStudentInfo').style.display='block';
    document.getElementById('modalAvatar').src=s.avatar;
    document.getElementById('modalAvatar').style.display='block';
    document.getElementById('btnShareStudent').classList.remove('hidden');
    document.getElementById('btnStudentProfile').classList.remove('hidden');
    document.getElementById('btnCertStudent').classList.remove('hidden');
    const mc=document.getElementById('modalComment');
    mc.innerText=generateComment(s); mc.classList.remove('hidden');
    document.getElementById('btnEditStudent').classList.remove('hidden');
    document.getElementById('btnDeleteStudent').classList.remove('hidden');
    document.getElementById('backdrop').classList.remove('hidden');
    document.getElementById('pointsModal').classList.remove('translate-y-full');
    switchTab('positive');
}

function awardAll() {
    openExcludeModal();
}

// ---- Exclude modal (bỏ học sinh khi cho điểm cả lớp) ----
let _excludeChecked = new Set();

function openExcludeModal() {
    const cls = students.filter(s => s.classId === currentClassId)
        .sort((a,b) => (a.stt||999) - (b.stt||999));
    _excludeChecked = new Set(cls.map(s => s.id));
    document.getElementById('excludeSearch').value = '';
    document.getElementById('excludeSttInput').value = '';
    _renderExcludeList(cls);
    _updateExcludeCount();
    document.getElementById('excludeBackdrop').classList.remove('hidden');
    const modal = document.getElementById('excludeModal');
    modal.classList.remove('hidden');
    requestAnimationFrame(() => modal.classList.remove('translate-y-full'));
}

function closeExcludeModal() {
    const modal = document.getElementById('excludeModal');
    modal.classList.add('translate-y-full');
    setTimeout(() => {
        modal.classList.add('hidden');
        document.getElementById('excludeBackdrop').classList.add('hidden');
    }, 310);
}

function _renderExcludeList(listOverride) {
    const search = (document.getElementById('excludeSearch').value || '').toLowerCase().trim();
    const cls = listOverride || students.filter(s => s.classId === currentClassId)
        .sort((a,b) => (a.stt||999) - (b.stt||999));
    const filtered = search
        ? cls.filter(s => (s.name||'').toLowerCase().includes(search) || String(s.stt||'').includes(search))
        : cls;
    document.getElementById('excludeList').innerHTML = filtered.map(s => {
        const checked = _excludeChecked.has(s.id);
        return `<label class="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition ${checked ? 'hover:bg-blue-50' : 'opacity-40 hover:bg-gray-50'}">
            <input type="checkbox" class="w-5 h-5 rounded accent-dojo-blue cursor-pointer"
                data-id="${s.id}" ${checked ? 'checked' : ''}
                onchange="toggleExcludeStudent(${s.id}, this.checked)">
            <span class="text-xs font-bold text-gray-400 w-6 text-right shrink-0">${s.stt||'-'}</span>
            <span class="font-medium text-gray-800 flex-1">${s.name}</span>
            ${s.avatar ? `<img src="${s.avatar}" class="w-7 h-7 rounded-full object-cover">` : `<span class="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-400 shrink-0"><i class="fas fa-user"></i></span>`}
        </label>`;
    }).join('');
}

function filterExcludeList() {
    _renderExcludeList();
    _updateExcludeCount();
}

function toggleExcludeStudent(id, checked) {
    if (checked) _excludeChecked.add(id);
    else _excludeChecked.delete(id);
    _updateExcludeCount();
    const lbl = document.querySelector(`input[data-id="${id}"]`)?.closest('label');
    if (lbl) {
        lbl.classList.toggle('opacity-40', !checked);
        lbl.classList.toggle('hover:bg-blue-50', checked);
        lbl.classList.toggle('hover:bg-gray-50', !checked);
    }
}

function _updateExcludeCount() {
    const total = students.filter(s => s.classId === currentClassId).length;
    document.getElementById('excludeCountLabel').textContent =
        `Đang chọn ${_excludeChecked.size} / ${total} học sinh`;
}

function excludeSelectAll(checked) {
    const cls = students.filter(s => s.classId === currentClassId);
    if (checked) cls.forEach(s => _excludeChecked.add(s.id));
    else _excludeChecked.clear();
    document.getElementById('excludeSttInput').value = '';
    _renderExcludeList();
    _updateExcludeCount();
}

function applyExcludeStt() {
    const raw = document.getElementById('excludeSttInput').value;
    const excludeStts = new Set(
        raw.split(/[,\s]+/).map(x => parseInt(x.trim())).filter(x => !isNaN(x))
    );
    const cls = students.filter(s => s.classId === currentClassId);
    cls.forEach(s => {
        if (excludeStts.has(s.stt)) _excludeChecked.delete(s.id);
        else _excludeChecked.add(s.id);
    });
    _renderExcludeList();
    _updateExcludeCount();
}

function confirmExcludeAndAward() {
    const ids = [..._excludeChecked];
    if (!ids.length) { showToast('Chưa chọn học sinh nào!', false); return; }
    const total = students.filter(s => s.classId === currentClassId).length;
    const label = ids.length === total ? 'Cả lớp' : `${ids.length} / ${total} học sinh`;
    closeExcludeModal();
    setTimeout(() => openGroupModal(ids, label), 320);
}

function closePointsModal() {
    document.getElementById('pointsModal').classList.add('translate-y-full');
    setTimeout(()=>document.getElementById('backdrop').classList.add('hidden'),300);
}

function switchTab(tab) {
    const pT=document.getElementById('tabPositive'),nT=document.getElementById('tabNegative');
    const pG=document.getElementById('positiveSkills'),nG=document.getElementById('negativeSkills');
    if(tab==='positive'){
        pT.className='flex-1 py-2 font-bold text-dojo-green border-b-2 border-dojo-green';
        nT.className='flex-1 py-2 font-bold text-gray-400 border-b-2 border-transparent';
        pG.classList.remove('hidden'); nG.classList.add('hidden');
    } else {
        nT.className='flex-1 py-2 font-bold text-dojo-red border-b-2 border-dojo-red';
        pT.className='flex-1 py-2 font-bold text-gray-400 border-b-2 border-transparent';
        nG.classList.remove('hidden'); pG.classList.add('hidden');
    }
}

function addPoints(skillId, points, skillName) {
    const isPos=points>0;
    document.getElementById(isPos?'soundPositive':'soundNegative').play().catch(()=>{});
    const now=new Date().toISOString();

    if(_isGroupAward && _groupTargetIds.length) {
        // Chấm điểm cho nhóm học sinh đã lọc/chọn
        _groupTargetIds.forEach(id=>{
            const s=students.find(st=>st.id===id); if(!s) return;
            const old=s.points;
            s.points+=points;
            if(isPos) s.positivePoints+=points; else s.negativePoints+=Math.abs(points);
            history.push({id:Date.now()+Math.random(),classId:currentClassId,studentId:s.id,studentName:s.name,skillName,points,timestamp:now});
            checkMilestone(s,old);
            setTimeout(()=>checkGoalAchievements(s.id), 100);
        });
        showToast(`${_groupTargetIds.length} học sinh ${isPos?'+':''}${points} (${skillName})`,isPos);
        _isGroupAward=false; _groupTargetIds=[];
        exitGroupSelectMode();
    } else if(isAwardAll) {
        students.filter(s=>s.classId===currentClassId).forEach(s=>{
            const old=s.points;
            s.points+=points;
            if(isPos) s.positivePoints+=points; else s.negativePoints+=Math.abs(points);
            history.push({id:Date.now()+Math.random(),classId:currentClassId,studentId:s.id,studentName:s.name,skillName,points,timestamp:now});
            checkMilestone(s,old);
            setTimeout(()=>checkGoalAchievements(s.id), 100);
        });
        showToast(`Cả lớp ${isPos?'+':''}${points} (${skillName})`,isPos);
    } else {
        const s=students.find(st=>st.id===selectedStudentId);
        if(s){
            const old=s.points;
            s.points+=points;
            if(isPos) s.positivePoints+=points; else s.negativePoints+=Math.abs(points);
            history.push({id:Date.now(),classId:currentClassId,studentId:s.id,studentName:s.name,skillName,points,timestamp:now});
            checkMilestone(s,old);
            setTimeout(()=>checkGoalAchievements(s.id), 100);
            showToast(`${s.name} ${isPos?'+':''}${points} (${skillName})`,isPos);
            setTimeout(()=>{const b=document.getElementById(`badge-${s.id}`);if(b){b.style.transform='scale(1.5)';setTimeout(()=>b.style.transform='scale(1)',200);}},50);
            // Projector display
            setTimeout(()=>_showProjectorAward(s, skillName, points), 80);
        }
    }
    saveData();
    scheduleAutoSync();
    if(currentView==='classroom') renderStudents(); else renderReport();
    closePointsModal();
}

