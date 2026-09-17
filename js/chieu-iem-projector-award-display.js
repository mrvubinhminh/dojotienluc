// ============================================================
// CHIẾU ĐIỂM (PROJECTOR AWARD DISPLAY)
// ============================================================
let _projectorModeOn = localStorage.getItem('dojo_projMode') === '1';
let _projAutoClose   = null;
let _projBarAnim     = null;

function toggleProjectorMode() {
    _projectorModeOn = !_projectorModeOn;
    localStorage.setItem('dojo_projMode', _projectorModeOn ? '1' : '0');
    _updateProjectorBtn();
    showToast(_projectorModeOn ? '📡 Bật chế độ chiếu điểm lên bảng' : 'Tắt chế độ chiếu');
}

function _updateProjectorBtn() {
    const btn = document.getElementById('btnProjectorMode');
    if (!btn) return;
    btn.className = _projectorModeOn
        ? 'text-xs font-bold px-2.5 py-1.5 rounded-full transition shadow-sm flex items-center bg-cyan-500 text-white border border-cyan-600'
        : 'text-cyan-600 text-xs font-bold bg-cyan-50 px-2.5 py-1.5 rounded-full hover:bg-cyan-100 transition border border-cyan-100 shadow-sm flex items-center';
    btn.innerHTML = _projectorModeOn
        ? '<i class="fas fa-broadcast-tower mr-1 animate-pulse"></i>Chiếu BẬT'
        : '<i class="fas fa-broadcast-tower mr-1"></i>Chiếu';
}

function _showProjectorAward(s, skillName, points) {
    if (!_projectorModeOn || !s) return;
    const cls = classes.find(c=>c.id===currentClassId);
    const overlay = document.getElementById('projectorAwardOverlay');

    // Populate
    const skillColor = points > 0 ? '#4ade80' : '#f87171';
    const skillBg    = points > 0 ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)';
    const skillBorder= points > 0 ? 'rgba(74,222,128,0.4)'  : 'rgba(248,113,113,0.4)';
    document.getElementById('projClassLabel').innerText   = cls?.name ? `📍 ${cls.name}` : '';
    document.getElementById('projStudentAvatar').src       = s.avatar || '';
    document.getElementById('projStudentName').innerText   = s.name;
    const skillEl = document.getElementById('projSkillName');
    skillEl.innerText      = skillName;
    skillEl.style.color    = skillColor;
    const wrapEl = document.getElementById('projSkillWrap');
    wrapEl.style.background   = skillBg;
    wrapEl.style.borderColor  = skillBorder;
    document.getElementById('projTotalPoints').innerText   = `Tổng điểm: ${s.points} ⭐`;

    const pEl = document.getElementById('projPointsNum');
    pEl.innerText    = (points > 0 ? '+' : '') + points;
    pEl.style.color  = points > 0 ? '#4ade80' : '#f87171';
    pEl.style.textShadow = points > 0
        ? '0 0 60px rgba(74,222,128,0.5), 0 8px 40px rgba(0,0,0,0.5)'
        : '0 0 60px rgba(248,113,113,0.5), 0 8px 40px rgba(0,0,0,0.5)';

    // Re-trigger CSS animations via class toggle
    overlay.classList.remove('show-proj');
    overlay.classList.remove('hidden');
    void overlay.offsetWidth;  // force reflow
    overlay.classList.add('show-proj');

    // Progress bar animation
    const bar = document.getElementById('projProgressBar');
    bar.style.transition = 'none';
    bar.style.width = '100%';
    void bar.offsetWidth;
    const DURATION = 2800;
    bar.style.transition = `width ${DURATION}ms linear`;
    bar.style.width = '0%';

    if (_projAutoClose) clearTimeout(_projAutoClose);
    _projAutoClose = setTimeout(_closeProjectorAward, DURATION);
}

function _closeProjectorAward() {
    const overlay = document.getElementById('projectorAwardOverlay');
    overlay.classList.add('hidden');
    overlay.classList.remove('show-proj');
    if (_projAutoClose) { clearTimeout(_projAutoClose); _projAutoClose = null; }
}

