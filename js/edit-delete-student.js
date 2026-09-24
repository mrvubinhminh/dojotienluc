// ============================================================
// EDIT / DELETE STUDENT
// ============================================================

let pendingAvatarBase64 = null;

function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Nén ảnh bằng Canvas
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 200;
            const MAX_HEIGHT = 200;
            let width = img.width;
            let height = img.height;
            
            // Tính toán tỷ lệ thu nhỏ
            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Xuất ra Base64 (chất lượng 0.7 để tiết kiệm dung lượng LocalStorage)
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            pendingAvatarBase64 = dataUrl;
            document.getElementById('editStudentAvatarPreview').src = dataUrl;
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function openEditStudentModal(id) {
    if(!id) return;
    const s=students.find(st=>st.id===id); if(!s) return;
    closePointsModal();

    setTimeout(()=>{
        pendingAvatarBase64 = null;
        document.getElementById('editStudentAvatarPreview').src = s.avatar || (avatarBaseUrl + s.name);
        document.getElementById('editStudentId').value=id;
        document.getElementById('editStudentName').value=s.name;
        document.getElementById('editStudentRealName').value=s.realName||'';
        document.getElementById('editStudentDob').value=s.dob||'';
        document.getElementById('editStudentStt').value=s.stt||'';
        document.getElementById('editStudentPositivePoints').value=s.positivePoints||0;
        document.getElementById('editStudentNegativePoints').value=s.negativePoints||0;
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
    const newPos=parseInt(document.getElementById('editStudentPositivePoints').value)||0;
    const newNeg=parseInt(document.getElementById('editStudentNegativePoints').value)||0;
    if(!newName) return;
    const s=students.find(st=>st.id===id);
    if(s){
        const old=s.name;
        s.name=newName; s.realName=newRealName||newName; s.dob=newDob; if(newStt>0) s.stt=newStt;
        s.positivePoints = newPos;
        s.negativePoints = Math.abs(newNeg);
        s.points = s.positivePoints - s.negativePoints;
        if(pendingAvatarBase64) {
            s.avatar = pendingAvatarBase64;
        } else if(old!==newName && !s.avatar.startsWith('data:image')) {
            s.avatar=avatarBaseUrl+newName.normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/\s/g,"");
        }
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

