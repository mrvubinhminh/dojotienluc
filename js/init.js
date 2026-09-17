// ============================================================
// INIT
// ============================================================
window.addEventListener('DOMContentLoaded', ()=>{
    // Live icon preview in skill modal
    document.getElementById('skillModalIcon').addEventListener('input', function(){
        document.getElementById('skillIconPreview').innerHTML=`<i class="fas ${this.value.trim()||'fa-star'} text-xl text-gray-500"></i>`;
    });
});

// ── PHÍM TẮT TOÀN CỤC ────────────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
    // Bỏ qua khi đang gõ vào input/textarea
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;

    const key = e.key.toUpperCase();

    // G → Gọi ngẫu nhiên toàn cục
    if (key === 'G') {
        e.preventDefault();
        const overlay = document.getElementById('groupResultOverlay');
        const groupOpen = overlay && !overlay.classList.contains('hidden');
        if (groupOpen && _groupResult.length) {
            // Đang ở màn hình nhóm → gọi từ tất cả nhóm
            _randomCallPool = null;
            _doRandomCall(null);
        } else {
            // Gọi ngẫu nhiên từ toàn bộ học sinh lớp hiện tại
            _randomCallGlobal();
        }
        return;
    }

    // Escape → đóng modal gọi ngẫu nhiên (nếu đang mở)
    if (e.key === 'Escape') {
        const rcModal = document.getElementById('randomCallModal');
        if (rcModal && !rcModal.classList.contains('hidden')) {
            closeRandomCall();
        }
    }
});

window.onload = () => {
    loadData();
    if (checkViewerMode()) return; // Viewer mode – skip app init
    // Migrate: ensure special bonus skills always present (for users with saved skills)
    [
        { id:'p_s3', name:'Thưởng đặc biệt',   points:3, icon:'fa-gift',  color:'bg-pink-100 text-pink-600 border-pink-200' },
        { id:'p_s5', name:'Xuất sắc đặc biệt', points:5, icon:'fa-crown', color:'bg-amber-100 text-amber-600 border-amber-200' },
    ].forEach(sk => {
        if (!skills.positive.find(s=>s.id===sk.id)) skills.positive.push(sk);
    });
    renderClasses();
    renderStudents();
    renderSkills();
    _updateProjectorBtn();
    _updateClassNotesBtn();
    startAutoPull();
};