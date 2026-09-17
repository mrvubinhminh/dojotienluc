// ============================================================
// EDIT / DELETE STUDENT
// ============================================================
function openEditStudentModal(id) {
    if(!id) return;
    const s=students.find(st=>st.id===id); if(!s) return;
    closePointsModal();
    setTimeout(()=>{
        document.getElementById('editStudentId').value=id;
        document.getElementById('editStudentName').value=s.name;
        document.getElementById('editStudentRealName').value=s.realName||'';
        document.getElementById('editStudentDob').value=s.dob||'';
        document.getElementById('editStudentStt').value=s.stt||'';
        document.getElementById('editStudentBackdrop').classList.remove('hidden');
        document.getElementById('editStudentModal').classList.remove('hidden');
        document.getElementById('editStudentName').focus();
    },320);
}
function closeEditStudentModal() { document.getElementById('editStudentBackdrop').classList.add('hidden'); document.getElementById('editStudentModal').classList.add('hidden'); }
function saveEditStudent() {
    const id=parseInt(document.getElementById('editStudentId').value);
    const newName=document.getElementById('editStudentName').value.trim();
    const newRealName=document.getElementById('editStudentRealName').value.trim();
    const newDob=document.getElementById('editStudentDob').value.trim();
    const newStt=parseInt(document.getElementById('editStudentStt').value)||0;
    if(!newName) return;
    const s=students.find(st=>st.id===id);
    if(s){
        const old=s.name;
        s.name=newName; s.realName=newRealName||newName; s.dob=newDob; if(newStt>0) s.stt=newStt;
        if(old!==newName) s.avatar=avatarBaseUrl+newName.normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/\s/g,"");
        saveData();
        if(currentView==='classroom')renderStudents(); else renderReport();
        showToast(`Đã cập nhật: ${newName}`);
    }
    closeEditStudentModal();
}
function deleteStudentFromModal() {
    if(!selectedStudentId) return;
    const s=students.find(st=>st.id===selectedStudentId); if(!s) return;
    closePointsModal();
    setTimeout(()=>{
        if(confirm(`Xóa học sinh "${s.name}"?`)){
            students=students.filter(st=>st.id!==selectedStudentId);
            saveData();
            if(currentView==='classroom')renderStudents(); else renderReport();
            showToast(`Đã xóa ${s.name}`,false);
        }
    },320);
}
function deleteStudentConfirm() {
    const id=parseInt(document.getElementById('editStudentId').value);
    const s=students.find(st=>st.id===id); if(!s) return;
    if(confirm(`Xóa học sinh "${s.name}"?`)){
        students=students.filter(st=>st.id!==id);
        saveData(); closeEditStudentModal();
        if(currentView==='classroom')renderStudents(); else renderReport();
        showToast(`Đã xóa ${s.name}`,false);
    }
}

