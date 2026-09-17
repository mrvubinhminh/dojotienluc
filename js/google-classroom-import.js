// ============================================================
// GOOGLE CLASSROOM IMPORT
// ============================================================
let _classroomCourses = [];
let _classroomSelectedCourse = null;
let _classroomStudents = [];

function openClassroomImport() {
    toggleSidebar();
    if (syncSettings.url === DEFAULT_SYNC_URL || !syncSettings.url) {
        showToast('Cần cài đặt Deployment ID riêng trước khi dùng tính năng này!', false, 4000);
        switchView('settings');
        return;
    }
    document.getElementById('classroomImportBackdrop').classList.remove('hidden');
    document.getElementById('classroomImportModal').classList.remove('hidden');
    _classroomShowLoading();
    _classroomFetchCourses();
}

function closeClassroomImport() {
    document.getElementById('classroomImportBackdrop').classList.add('hidden');
    document.getElementById('classroomImportModal').classList.add('hidden');
    _classroomCourses = [];
    _classroomSelectedCourse = null;
    _classroomStudents = [];
}

function _classroomShowLoading(msg='Đang tải danh sách lớp...') {
    document.getElementById('classroomLoading').classList.remove('hidden');
    document.getElementById('classroomLoading').querySelector('p').textContent = msg;
    document.getElementById('classroomError').classList.add('hidden');
    document.getElementById('classroomCourseList').classList.add('hidden');
    document.getElementById('classroomStudentPreview').classList.add('hidden');
    document.getElementById('classroomImportFooter').classList.add('hidden');
}

function _classroomShowError(msg, hint='') {
    document.getElementById('classroomLoading').classList.add('hidden');
    document.getElementById('classroomError').classList.remove('hidden');
    document.getElementById('classroomErrorMsg').textContent = msg;
    const hintEl = document.getElementById('classroomErrorHint');
    if (hint) { hintEl.innerHTML = hint; hintEl.classList.remove('hidden'); }
    else hintEl.classList.add('hidden');
    document.getElementById('classroomCourseList').classList.add('hidden');
    document.getElementById('classroomStudentPreview').classList.add('hidden');
    document.getElementById('classroomImportFooter').classList.add('hidden');
}

async function _classroomFetchCourses() {
    try {
        const url = syncSettings.url + '?action=listClasses';
        const res = await fetch(url, { redirect: 'follow' });
        const text = await res.text();
        if (!text || text.trim() === '') {
            _classroomShowError(
                'Script không trả về dữ liệu.',
                '⚠️ Cần bật <b>Classroom API</b> trong Apps Script: mở editor → bên trái chọn <b>Dịch vụ (+)</b> → tìm <b>Google Classroom API</b> → Thêm.'
            );
            return;
        }
        const result = JSON.parse(text);
        if (result.status !== 'ok') {
            _classroomShowError(
                '❌ ' + (result.message || 'Lỗi không xác định'),
                result.message && result.message.includes('Classroom') ?
                    '⚠️ Cần bật <b>Google Classroom API</b>: trong Apps Script Editor → <b>Dịch vụ (+)</b> → tìm <b>Google Classroom API v1</b> → Thêm → Lưu & triển khai lại.' : ''
            );
            return;
        }
        _classroomCourses = result.data || [];
        _renderClassroomCourses();
    } catch(e) {
        _classroomShowError('Không kết nối được: ' + e.message);
    }
}

function _renderClassroomCourses() {
    document.getElementById('classroomLoading').classList.add('hidden');
    document.getElementById('classroomError').classList.add('hidden');
    document.getElementById('classroomStudentPreview').classList.add('hidden');
    document.getElementById('classroomImportFooter').classList.add('hidden');
    document.getElementById('classroomImportSubtitle').textContent = 'Chọn lớp để nhập học sinh';
    const list = document.getElementById('classroomCourseList');
    list.classList.remove('hidden');
    if (_classroomCourses.length === 0) {
        list.innerHTML = '<div class="text-center py-8 text-gray-400"><i class="fas fa-school text-3xl mb-2 block"></i><p class="text-sm">Không tìm thấy lớp nào trên Google Classroom.<br>Bạn phải là giáo viên của lớp đó.</p></div>';
        return;
    }
    list.innerHTML = _classroomCourses.map(c => `
        <button onclick="selectClassroomCourse('${c.id}','${c.name.replace(/'/g,"\\'")}','${(c.section||'').replace(/'/g,"\\'")}' )"
            class="w-full text-left flex items-center gap-3 p-3 rounded-xl border-2 border-transparent bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50 transition active:scale-95">
            <div class="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <i class="fas fa-chalkboard text-indigo-500 text-sm"></i>
            </div>
            <div class="flex-1 min-w-0">
                <p class="font-bold text-gray-800 text-sm truncate">${c.name}</p>
                ${c.section ? `<p class="text-xs text-gray-400 truncate">${c.section}</p>` : ''}
            </div>
            <i class="fas fa-chevron-right text-gray-300 flex-shrink-0"></i>
        </button>
    `).join('');
}

async function selectClassroomCourse(courseId, courseName, section) {
    _classroomSelectedCourse = { id: courseId, name: courseName, section };
    _classroomShowLoading('Đang tải danh sách học sinh...');
    try {
        const url = syncSettings.url + `?action=importClass&courseId=${encodeURIComponent(courseId)}`;
        const res = await fetch(url, { redirect: 'follow' });
        const text = await res.text();
        if (!text || text.trim() === '') { _classroomShowError('Script trả về rỗng — kiểm tra Authorization.'); return; }
        const result = JSON.parse(text);
        if (result.status !== 'ok') { _classroomShowError('❌ ' + (result.message||'Lỗi không xác định')); return; }
        _classroomStudents = result.data || [];
        _renderClassroomStudentPreview(courseName, section);
    } catch(e) {
        _classroomShowError('Lỗi: ' + e.message);
    }
}

function _renderClassroomStudentPreview(courseName, section) {
    document.getElementById('classroomLoading').classList.add('hidden');
    document.getElementById('classroomError').classList.add('hidden');
    document.getElementById('classroomCourseList').classList.add('hidden');
    document.getElementById('classroomImportSubtitle').textContent = courseName + (section ? ' · ' + section : '');
    const preview = document.getElementById('classroomStudentPreview');
    preview.classList.remove('hidden');
    document.getElementById('classroomImportFooter').classList.remove('hidden');
    // Pre-fill class name
    document.getElementById('classroomClassName').value = courseName + (section ? ' - ' + section : '');
    document.getElementById('classroomStudentCount').textContent = _classroomStudents.length;
    const listEl = document.getElementById('classroomStudentList');
    if (_classroomStudents.length === 0) {
        listEl.innerHTML = '<p class="text-center text-gray-400 text-xs py-4">Không có học sinh nào trong lớp.</p>';
    } else {
        listEl.innerHTML = _classroomStudents.map((s, i) => `
            <div class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white transition">
                <span class="text-xs text-gray-400 w-5 text-right flex-shrink-0">${i+1}</span>
                <span class="text-sm font-semibold text-gray-700 truncate">${s.name}</span>
                ${s.email ? `<span class="text-[10px] text-gray-400 truncate ml-auto">${s.email}</span>` : ''}
            </div>
        `).join('');
    }
}

function _classroomBackToCourses() {
    _classroomSelectedCourse = null;
    _classroomStudents = [];
    _renderClassroomCourses();
}

function confirmClassroomImport() {
    const className = document.getElementById('classroomClassName').value.trim();
    if (!className) { document.getElementById('classroomClassName').focus(); showToast('Nhập tên lớp!', false); return; }
    if (_classroomStudents.length === 0) { showToast('Không có học sinh để nhập!', false); return; }
    // Create class
    const newClassId = classes.length ? Math.max(...classes.map(c=>c.id))+1 : 1;
    classes.push({ id: newClassId, name: className });
    // Create students
    const avatarBase = 'https://api.dicebear.com/7.x/thumbs/svg?seed=';
    _classroomStudents.forEach((s, i) => {
        const newId = students.length ? Math.max(...students.map(st=>st.id))+1 : 1;
        const avatarSeed = s.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s/g,'');
        students.push({
            id: newId, classId: newClassId, stt: i+1, name: s.name, dob: '', email: s.email||'',
            points: 0, positivePoints: 0, negativePoints: 0,
            avatar: avatarBase + avatarSeed
        });
    });
    currentClassId = newClassId;
    saveData();
    renderClasses();
    renderStudents();
    closeClassroomImport();
    if (typeof toggleSidebar === 'function') toggleSidebar();
    showToast(`✅ Đã nhập lớp "${className}" với ${_classroomStudents.length} học sinh!`, true, 4000);
}

function openAddClassModal() { toggleSidebar(); document.getElementById('addClassBackdrop').classList.remove('hidden'); document.getElementById('addClassModal').classList.remove('hidden'); document.getElementById('newClassName').focus(); }
function closeAddClassModal() { document.getElementById('addClassBackdrop').classList.add('hidden'); document.getElementById('addClassModal').classList.add('hidden'); document.getElementById('newClassName').value=''; }
function addClass() {
    const name=document.getElementById('newClassName').value.trim(); if(!name) return;
    const newId=classes.length?Math.max(...classes.map(c=>c.id))+1:1;
    const presetRadio=document.querySelector('input[name="newClassPreset"]:checked');
    const preset=presetRadio?presetRadio.value:'homeroom';
    const teacherName=document.getElementById('newTeacherName').value.trim();
    const subjectName=document.getElementById('newSubjectName').value.trim();
    classes.push({id:newId,name,skillPreset:preset,teacherName,subjectName});
    // Apply preset skills immediately
    if(preset!=='custom'){
        const ps=SKILL_PRESETS[preset];
        if(ps) skills=JSON.parse(JSON.stringify({positive:ps.positive,negative:ps.negative}));
    } else {
        skills=JSON.parse(JSON.stringify(DEFAULT_SKILLS));
    }
    saveData(); closeAddClassModal(); selectClass(newId); showToast(`Đã tạo lớp: ${name} (${SKILL_PRESETS[preset]?.label||preset})`);
}

function openEditClassModal(id) { const cls=classes.find(c=>c.id===id); if(!cls) return; document.getElementById('editClassId').value=id; document.getElementById('editClassName').value=cls.name; document.getElementById('editTeacherName').value=cls.teacherName||''; document.getElementById('editSubjectName').value=cls.subjectName||''; document.getElementById('editClassBackdrop').classList.remove('hidden'); document.getElementById('editClassModal').classList.remove('hidden'); document.getElementById('editClassName').focus(); }
function closeEditClassModal() { document.getElementById('editClassBackdrop').classList.add('hidden'); document.getElementById('editClassModal').classList.add('hidden'); }
function saveEditClass() {
    const id=parseInt(document.getElementById('editClassId').value);
    const newName=document.getElementById('editClassName').value.trim(); if(!newName) return;
    const newTeacher=document.getElementById('editTeacherName').value.trim();
    const newSubject=document.getElementById('editSubjectName').value.trim();
    const cls=classes.find(c=>c.id===id);
    if(cls) { cls.name=newName; cls.teacherName=newTeacher; cls.subjectName=newSubject; saveData(); renderClasses(); if(currentClassId===id){if(currentView==='classroom')renderStudents();else renderReport();} showToast(`Đã cập nhật: ${newName}`); }
    closeEditClassModal();
}

function deleteClass(id) {
    const cls=classes.find(c=>c.id===id); if(!cls) return;
    if(confirm(`Xoá lớp "${cls.name}" và toàn bộ học sinh?`)) {
        classes=classes.filter(c=>c.id!==id);
        students=students.filter(s=>s.classId!==id);
        history=history.filter(h=>h.classId!==id);
        periods=periods.filter(p=>p.classId!==id);
        if(currentClassId===id) currentClassId=classes.length?classes[0].id:null;
        saveData(); renderClasses();
        if(currentView==='classroom')renderStudents(); else renderReport();
        showToast(`Đã xoá lớp ${cls.name}`,false);
    }
}

