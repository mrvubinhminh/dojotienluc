
// ============================================================
// BATCH CROP AVATAR (Cắt ảnh từ tập thể)
// ============================================================

let bcImage = null;
let bcCanvas = null;
let bcCtx = null;

let bcImgX = 0;
let bcImgY = 0;
let bcImgScale = 1;

let isDragging = false;
let startDragX = 0;
let startDragY = 0;

const CROP_RADIUS = 100; // Bán kính vòng tròn cắt (đường kính 200px)

function openBatchCropModal() {
    if (!currentClassId) {
        showToast("Vui lòng chọn hoặc tạo lớp học trước!", false);
        return;
    }
    
    document.getElementById('batchCropBackdrop').classList.remove('hidden');
    document.getElementById('batchCropModal').classList.remove('hidden');
    
    // Reset state
    document.getElementById('bcUploadSection').classList.remove('hidden');
    document.getElementById('bcCropperSection').classList.add('hidden');
    document.getElementById('bcFileInput').value = '';
    document.getElementById('bcSuccessLog').innerHTML = '';
    bcImage = null;
    
    // Load student list into dropdown
    _populateBcStudentSelect();
}

function closeBatchCropModal() {
    document.getElementById('batchCropBackdrop').classList.add('hidden');
    document.getElementById('batchCropModal').classList.add('hidden');
}

function _populateBcStudentSelect() {
    const select = document.getElementById('bcStudentSelect');
    const cls = students.filter(s => s.classId === currentClassId).sort((a,b) => (a.stt||999) - (b.stt||999));
    
    if (cls.length === 0) {
        select.innerHTML = '<option value="">Lớp chưa có học sinh</option>';
        return;
    }
    
    let html = '';
    cls.forEach(s => {
        // Có thể highlight những em chưa có avatar thật (avatar chứa dojo-dicebear)
        const hasRealAvatar = s.avatar && s.avatar.startsWith('data:image');
        const icon = hasRealAvatar ? '✅ ' : '❌ ';
        html += `<option value="${s.id}">${icon} [${s.stt||'-'}] ${s.name}</option>`;
    });
    select.innerHTML = html;
}

function bcHandleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            bcImage = img;
            _initCropper();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function _initCropper() {
    document.getElementById('bcUploadSection').classList.add('hidden');
    document.getElementById('bcCropperSection').classList.remove('hidden');
    document.getElementById('bcCropperSection').classList.add('flex');
    
    bcCanvas = document.getElementById('bcCanvas');
    bcCtx = bcCanvas.getContext('2d');
    
    // Set canvas size to match container
    const container = document.getElementById('bcCanvasContainer');
    bcCanvas.width = container.clientWidth;
    bcCanvas.height = container.clientHeight;
    
    // Initial scale so image fits width
    bcImgScale = bcCanvas.width / bcImage.width;
    document.getElementById('bcZoomSlider').value = bcImgScale;
    
    // Center image
    bcImgX = (bcCanvas.width - (bcImage.width * bcImgScale)) / 2;
    bcImgY = (bcCanvas.height - (bcImage.height * bcImgScale)) / 2;
    
    _attachCanvasEvents();
    bcDraw();
}

function _attachCanvasEvents() {
    // Xoá event listeners cũ nếu có
    bcCanvas.onmousedown = null;
    bcCanvas.onmousemove = null;
    bcCanvas.onmouseup = null;
    bcCanvas.onmouseleave = null;
    bcCanvas.ontouchstart = null;
    bcCanvas.ontouchmove = null;
    bcCanvas.ontouchend = null;
    
    // Mouse Events
    bcCanvas.onmousedown = (e) => { isDragging = true; startDragX = e.clientX; startDragY = e.clientY; };
    bcCanvas.onmousemove = (e) => {
        if (!isDragging) return;
        bcImgX += e.clientX - startDragX;
        bcImgY += e.clientY - startDragY;
        startDragX = e.clientX; startDragY = e.clientY;
        bcDraw();
    };
    bcCanvas.onmouseup = () => { isDragging = false; };
    bcCanvas.onmouseleave = () => { isDragging = false; };
    
    // Touch Events
    bcCanvas.ontouchstart = (e) => {
        if(e.touches.length === 1) {
            isDragging = true; 
            startDragX = e.touches[0].clientX; 
            startDragY = e.touches[0].clientY; 
        }
    };
    bcCanvas.ontouchmove = (e) => {
        if (!isDragging || e.touches.length !== 1) return;
        e.preventDefault(); // Ngăn cuộn trang
        bcImgX += e.touches[0].clientX - startDragX;
        bcImgY += e.touches[0].clientY - startDragY;
        startDragX = e.touches[0].clientX; 
        startDragY = e.touches[0].clientY;
        bcDraw();
    };
    bcCanvas.ontouchend = () => { isDragging = false; };
}

// Window resize update canvas size
window.addEventListener('resize', () => {
    if (bcImage && bcCanvas && document.getElementById('batchCropModal').classList.contains('hidden') === false) {
        const container = document.getElementById('bcCanvasContainer');
        bcCanvas.width = container.clientWidth;
        bcCanvas.height = container.clientHeight;
        bcDraw();
    }
});

function bcDraw() {
    if (!bcImage || !bcCtx) return;
    
    // Lấy giá trị zoom từ slider
    const newScale = parseFloat(document.getElementById('bcZoomSlider').value);
    
    // Zoom in/out to the center of the canvas
    if (newScale !== bcImgScale) {
        const centerX = bcCanvas.width / 2;
        const centerY = bcCanvas.height / 2;
        
        // Tính toạ độ ảnh tương đối với tâm trước khi zoom
        const relX = (centerX - bcImgX) / bcImgScale;
        const relY = (centerY - bcImgY) / bcImgScale;
        
        bcImgScale = newScale;
        
        // Cập nhật lại toạ độ ảnh để giữ nguyên vị trí tâm
        bcImgX = centerX - (relX * bcImgScale);
        bcImgY = centerY - (relY * bcImgScale);
    }
    
    bcCtx.clearRect(0, 0, bcCanvas.width, bcCanvas.height);
    
    // Vẽ ảnh nền
    bcCtx.globalCompositeOperation = 'source-over';
    bcCtx.drawImage(bcImage, bcImgX, bcImgY, bcImage.width * bcImgScale, bcImage.height * bcImgScale);
    
    // Vẽ overlay mờ đen toàn màn hình
    bcCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    bcCtx.fillRect(0, 0, bcCanvas.width, bcCanvas.height);
    
    // Khoét lỗ tròn trong suốt ở giữa
    bcCtx.globalCompositeOperation = 'destination-out';
    bcCtx.beginPath();
    bcCtx.arc(bcCanvas.width / 2, bcCanvas.height / 2, CROP_RADIUS, 0, Math.PI * 2);
    bcCtx.fill();
    
    // Vẽ viền tròn màu trắng
    bcCtx.globalCompositeOperation = 'source-over';
    bcCtx.beginPath();
    bcCtx.arc(bcCanvas.width / 2, bcCanvas.height / 2, CROP_RADIUS, 0, Math.PI * 2);
    bcCtx.strokeStyle = 'white';
    bcCtx.lineWidth = 3;
    bcCtx.setLineDash([5, 5]);
    bcCtx.stroke();
    bcCtx.setLineDash([]); // Reset line dash
}

function bcCropAndSave() {
    if (!bcImage) return;
    
    const studentId = parseInt(document.getElementById('bcStudentSelect').value);
    if (!studentId || isNaN(studentId)) {
        showToast("Vui lòng chọn học sinh!", false);
        return;
    }
    
    // Tạo canvas tạm để crop kích thước chuẩn 200x200
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = CROP_RADIUS * 2;
    tempCanvas.height = CROP_RADIUS * 2;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Tính toán vùng cần cắt trên ảnh gốc
    // Toạ độ góc trên cùng bên trái của lỗ tròn trên canvas
    const holeX_onCanvas = bcCanvas.width / 2 - CROP_RADIUS;
    const holeY_onCanvas = bcCanvas.height / 2 - CROP_RADIUS;
    
    // Map ngược lại toạ độ ảnh gốc
    const srcX = (holeX_onCanvas - bcImgX) / bcImgScale;
    const srcY = (holeY_onCanvas - bcImgY) / bcImgScale;
    const srcWidth = (CROP_RADIUS * 2) / bcImgScale;
    const srcHeight = (CROP_RADIUS * 2) / bcImgScale;
    
    // Vẽ phần ảnh gốc vào canvas tạm
    tempCtx.drawImage(bcImage, srcX, srcY, srcWidth, srcHeight, 0, 0, tempCanvas.width, tempCanvas.height);
    
    // Lấy Base64 (Nén JPEG 0.8)
    const base64Avatar = tempCanvas.toDataURL('image/jpeg', 0.8);
    
    // Cập nhật cho học sinh
    const s = students.find(st => st.id === studentId);
    if (s) {
        s.avatar = base64Avatar;
        saveData();
        if(currentView === 'classroom') renderStudents();
        
        // Log thành công
        const logHtml = `<div class="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded-lg mt-1 animate-fade-in"><img src="${base64Avatar}" class="w-8 h-8 rounded-full border border-green-200"><span>Đã lưu thành công ảnh cho <b>${s.name}</b></span></div>`;
        const logContainer = document.getElementById('bcSuccessLog');
        logContainer.innerHTML = logHtml + logContainer.innerHTML; // Prepend
        
        showToast(`Đã cắt ảnh cho ${s.name} !`);
        
        // Tự động nhảy sang học sinh tiếp theo trong danh sách nếu có
        const select = document.getElementById('bcStudentSelect');
        const selectedIndex = select.selectedIndex;
        if (selectedIndex < select.options.length - 1) {
            select.selectedIndex = selectedIndex + 1;
        }
        
        // Refresh lại cái dropdown (đổi dấu x đỏ thành dấu check xanh)
        // Lưu lại vị trí đang chọn
        const currentId = select.value;
        _populateBcStudentSelect();
        select.value = currentId;
    }
}
