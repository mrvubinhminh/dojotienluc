// ============================================================
// SETTINGS / SKILLS MANAGER
// ============================================================
function renderSettings() {
    // Milestones
    document.getElementById('milestoneList').innerHTML=MILESTONES.map(m=>`
        <div class="flex items-center gap-2 p-2 rounded-xl ${m.bg} border ${m.border}">
            <span class="text-2xl">${m.icon}</span>
            <div><p class="font-bold text-gray-700 text-sm">${m.label}</p><p class="text-xs text-gray-500">${m.threshold} điểm</p></div>
        </div>`).join('');

    // Positive skills list
    document.getElementById('positiveSkillsList').innerHTML=skills.positive.map(s=>`
        <div class="flex items-center gap-3 p-2 bg-gray-50 rounded-xl border border-gray-100">
            <div class="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm flex-shrink-0"><i class="fas ${s.icon} text-yellow-500"></i></div>
            <div class="flex-1">
                <p class="font-bold text-gray-800 text-sm">${s.name}</p>
                <p class="text-xs text-green-600 font-bold">+${s.points} điểm</p>
            </div>
            <button onclick="openEditSkillModal('positive','${s.id}')" class="w-8 h-8 bg-blue-50 rounded-full text-dojo-blue flex items-center justify-center hover:bg-blue-100 transition"><i class="fas fa-edit text-xs"></i></button>
            <button onclick="deleteSkill('positive','${s.id}')" class="w-8 h-8 bg-red-50 rounded-full text-red-500 flex items-center justify-center hover:bg-red-100 transition"><i class="fas fa-trash text-xs"></i></button>
        </div>`).join('');

    // Negative skills list
    document.getElementById('negativeSkillsList').innerHTML=skills.negative.map(s=>`
        <div class="flex items-center gap-3 p-2 bg-gray-50 rounded-xl border border-gray-100">
            <div class="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm flex-shrink-0"><i class="fas ${s.icon} text-red-500"></i></div>
            <div class="flex-1">
                <p class="font-bold text-gray-800 text-sm">${s.name}</p>
                <p class="text-xs text-red-600 font-bold">${s.points} điểm</p>
            </div>
            <button onclick="openEditSkillModal('negative','${s.id}')" class="w-8 h-8 bg-blue-50 rounded-full text-dojo-blue flex items-center justify-center hover:bg-blue-100 transition"><i class="fas fa-edit text-xs"></i></button>
            <button onclick="deleteSkill('negative','${s.id}')" class="w-8 h-8 bg-red-50 rounded-full text-red-500 flex items-center justify-center hover:bg-red-100 transition"><i class="fas fa-trash text-xs"></i></button>
        </div>`).join('');
}

function openAddSkillModal(type) {
    document.getElementById('skillModalTitle').innerText='Thêm kỹ năng';
    document.getElementById('skillModalType').value=type;
    document.getElementById('skillModalId').value='';
    document.getElementById('skillModalName').value='';
    document.getElementById('skillModalPoints').value=type==='positive'?1:-1;
    document.getElementById('skillModalIcon').value='fa-star';
    document.getElementById('skillIconPreview').innerHTML='<i class="fas fa-star text-xl text-gray-500"></i>';
    document.getElementById('skillModalBackdrop').classList.remove('hidden');
    document.getElementById('skillModal').classList.remove('hidden');
    document.getElementById('skillModalName').focus();
}

function openEditSkillModal(type, id) {
    const list=type==='positive'?skills.positive:skills.negative;
    const skill=list.find(s=>s.id===id); if(!skill) return;
    document.getElementById('skillModalTitle').innerText='Sửa kỹ năng';
    document.getElementById('skillModalType').value=type;
    document.getElementById('skillModalId').value=id;
    document.getElementById('skillModalName').value=skill.name;
    document.getElementById('skillModalPoints').value=skill.points;
    document.getElementById('skillModalIcon').value=skill.icon;
    document.getElementById('skillIconPreview').innerHTML=`<i class="fas ${skill.icon} text-xl text-gray-500"></i>`;
    document.getElementById('skillModalBackdrop').classList.remove('hidden');
    document.getElementById('skillModal').classList.remove('hidden');
    document.getElementById('skillModalName').focus();
}

function closeSkillModal() { document.getElementById('skillModalBackdrop').classList.add('hidden'); document.getElementById('skillModal').classList.add('hidden'); }

function saveSkill() {
    const type=document.getElementById('skillModalType').value;
    const id=document.getElementById('skillModalId').value;
    const name=document.getElementById('skillModalName').value.trim(); if(!name) return;
    const points=parseInt(document.getElementById('skillModalPoints').value)||0;
    const icon=document.getElementById('skillModalIcon').value.trim()||'fa-star';
    const color=type==='positive'?'bg-yellow-100 text-yellow-600 border-yellow-200':'bg-red-100 text-red-600 border-red-200';
    const list=type==='positive'?skills.positive:skills.negative;
    if(id) {
        const skill=list.find(s=>s.id===id);
        if(skill){skill.name=name;skill.points=points;skill.icon=icon;}
    } else {
        list.push({id:(type==='positive'?'p':'n')+Date.now(),name,points,icon,color});
    }
    saveData(); renderSkills(); renderSettings(); closeSkillModal();
    showToast('Đã lưu kỹ năng!');
}

function deleteSkill(type, id) {
    const list=type==='positive'?skills.positive:skills.negative;
    const skill=list.find(s=>s.id===id); if(!skill) return;
    if(confirm(`Xóa kỹ năng "${skill.name}"?`)){
        if(type==='positive') skills.positive=skills.positive.filter(s=>s.id!==id);
        else skills.negative=skills.negative.filter(s=>s.id!==id);
        saveData(); renderSkills(); renderSettings();
        showToast(`Đã xóa kỹ năng ${skill.name}`,false);
    }
}

function resetSkillsToDefault() {
    if(confirm('Khôi phục toàn bộ kỹ năng về mặc định? Các tùy chỉnh sẽ bị mất.')){
        skills=JSON.parse(JSON.stringify(DEFAULT_SKILLS));
        saveData(); renderSkills(); renderSettings();
        showToast('Đã khôi phục kỹ năng mặc định!');
    }
}

