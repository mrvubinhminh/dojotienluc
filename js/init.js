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

    // Ignore if typing game is active
    const typingModal = document.getElementById('typingPlayModal');
    if (typingModal && !typingModal.classList.contains('hidden')) return;

    const key = e.key.toUpperCase();


    // Xử lý gõ số (STT) để mở nhanh thông tin học sinh
    if (/^[0-9]$/.test(e.key)) {
        window._sttBuffer = (window._sttBuffer || '') + e.key;
        
        // Tạo một Toast nhỏ để người dùng thấy mình đang gõ số nào
        const bLabel = document.getElementById('sttTypingIndicator');
        if (!bLabel) {
            const div = document.createElement('div');
            div.id = 'sttTypingIndicator';
            div.className = 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/70 text-white font-black text-6xl px-10 py-6 rounded-3xl shadow-2xl z-[9999] pointer-events-none transition-all';
            div.innerText = window._sttBuffer;
            document.body.appendChild(div);
        } else {
            bLabel.innerText = window._sttBuffer;
            bLabel.style.opacity = '1';
        }

        clearTimeout(window._sttBufferTimeout);
        window._sttBufferTimeout = setTimeout(() => {
            const stt = parseInt(window._sttBuffer);
            window._sttBuffer = '';
            const indicator = document.getElementById('sttTypingIndicator');
            if (indicator) {
                indicator.style.opacity = '0';
                setTimeout(() => indicator.remove(), 300);
            }
            if (stt) {
                const s = students.find(st => st.classId === currentClassId && st.stt === stt);
                if (s) {
                    if (typeof openPointsModal === 'function') openPointsModal(s.id);
                } else {
                    if (typeof showToast === 'function') showToast('Không tìm thấy học sinh có STT ' + stt, false);
                }
            }
        }, 700);
        return;
    }

    if (e.key === 'Enter' && window._sttBuffer) {
        e.preventDefault();
        clearTimeout(window._sttBufferTimeout);
        const stt = parseInt(window._sttBuffer);
        window._sttBuffer = '';
        const indicator = document.getElementById('sttTypingIndicator');
        if (indicator) {
            indicator.style.opacity = '0';
            setTimeout(() => indicator.remove(), 300);
        }
        if (stt) {
            const s = students.find(st => st.classId === currentClassId && st.stt === stt);
            if (s) {
                if (typeof openPointsModal === 'function') openPointsModal(s.id);
            } else {
                if (typeof showToast === 'function') showToast('Không tìm thấy học sinh có STT ' + stt, false);
            }
        }
        return;
    }

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