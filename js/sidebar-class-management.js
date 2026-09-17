// ============================================================
// SIDEBAR / CLASS MANAGEMENT
// ============================================================
function toggleSidebar() {
    const sb=document.getElementById('sidebar'), bd=document.getElementById('sidebarBackdrop');
    if(sb.classList.contains('sidebar-closed')) {
        sb.classList.replace('sidebar-closed','sidebar-open');
        bd.classList.remove('hidden');
        renderClasses();
    } else {
        sb.classList.replace('sidebar-open','sidebar-closed');
        bd.classList.add('hidden');
    }
}

function renderClasses() {
    const container=document.getElementById('classListContainer');
    container.innerHTML='';
    classes.forEach(cls=>{
        const isSel=cls.id===currentClassId;
        const cnt=students.filter(s=>s.classId===cls.id).length;
        const div=document.createElement('div');
        div.className=`p-3 rounded-xl border-2 flex justify-between items-center transition ${isSel?'bg-blue-50 border-dojo-blue':'bg-white border-gray-100 hover:border-gray-300'}`;
        const pr=SKILL_PRESETS[cls.skillPreset||'custom'];
        div.innerHTML=`
            <div class="flex-1 cursor-pointer" onclick="selectClass(${cls.id})">
                <h4 class="font-bold ${isSel?'text-dojo-blue':'text-gray-800'}">${cls.name}</h4>
                <p class="text-xs text-gray-500 flex items-center gap-1.5">${cnt} học sinh <span class="px-1.5 py-0.5 rounded-full text-[9px] font-bold ${pr?pr.bg:''} ${pr?pr.color:''}"><i class="fas ${pr?pr.icon:'fa-sliders-h'} mr-0.5"></i>${pr?pr.label:'Tùy chỉnh'}</span></p>
            </div>
            <div class="flex items-center gap-1">
                <button onclick="openEditClassModal(${cls.id})" class="p-2 text-gray-400 hover:text-blue-500"><i class="fas fa-edit"></i></button>
                <button onclick="deleteClass(${cls.id})" class="p-2 text-gray-400 hover:text-red-500"><i class="fas fa-trash"></i></button>
                ${isSel?'<i class="fas fa-check-circle text-dojo-blue text-xl ml-1"></i>':'<div class="w-6 ml-1"></div>'}
            </div>`;
        container.appendChild(div);
    });
}

function selectClass(id) {
    currentClassId=id; currentPeriodId=null; currentGradePeriodId=null; _gradesHKMode=null; _gradesSubjectFilter=null; toggleSidebar();
    // Auto-load skill preset for this class
    const cls = classes.find(c=>c.id===id);
    if (cls && cls.skillPreset && cls.skillPreset !== 'custom') {
        const preset = SKILL_PRESETS[cls.skillPreset];
        if (preset) {
            skills = JSON.parse(JSON.stringify({ positive: preset.positive, negative: preset.negative }));
            saveData();
        }
    }
    if(currentView==='classroom') renderStudents();
    else if(currentView==='report') renderReport();
    else if(currentView==='history') renderHistory();
    else if(currentView==='settings') renderSkills();
    _updateClassNotesBtn();
    _updateMeetingBadge();
}

