// ============================================================
// AI LÀ TRIỆU PHÚ
// ------------------------------------------------------------
// Một học sinh lên ghế nóng, leo thang 10 mốc điểm. Thầy cô ra câu hỏi,
// bấm Đúng thì em ấy leo một bậc, bấm Sai thì rơi về mốc an toàn gần nhất.
// Em ấy được quyền DỪNG CUỘC CHƠI bất cứ lúc nào để giữ nguyên số điểm —
// và cả lớp sẽ gào lên "đi tiếp đi!".
//
// Ba quyền trợ giúp: 50/50, hỏi ý kiến cả lớp (đếm tay giơ, hiện biểu đồ
// cột ngay trên màn hình), gọi một bạn bất kỳ trong lớp.
//
// Câu hỏi do thầy cô ra, app lo phần sân khấu: thang điểm, mốc an toàn,
// hồi hộp và cộng điểm.
// ============================================================

const TP_THANG = [1, 2, 3, 4, 5, 7, 9, 12, 15, 20];
const TP_AN_TOAN = [2, 6];          // chỉ số bậc an toàn (bậc 3 và bậc 7)
const TP_PA = ['A', 'B', 'C', 'D'];

let _tpHS      = null;   // { id, ten, stt, anh }
let _tpBac     = 0;      // số bậc đã leo qua (0 = chưa leo bậc nào)
let _tpTrangThai = 'CHO';   // CHO | CHOI | XONG
let _tpTroGiup = { nam: false, lop: false, ban: false };
let _tpPhieu   = [0, 0, 0, 0];
let _tpNhatKy  = null;
let _tpAmThanh = true;
let _tpNhac    = null;
let _tpChoCham = false;
let _tpAudio   = null;
let _tpKetQua  = null;   // điểm chốt được ở ván này

function _tpGiam() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
function _tpChuDau(t) { return (t || '?').trim().split(/\s+/).pop().charAt(0).toUpperCase(); }
function _tpMocAnToan() {                       // giá trị rơi về khi trả lời sai
    let v = 0;
    TP_AN_TOAN.forEach(k => { if (_tpBac > k) v = TP_THANG[k]; });
    return v;
}

// ── Âm thanh (dùng chung nhạc với Đĩa Bay Gọi Tên) ───────────────────────────
function _tpDsNhac() {
    return (typeof UF_NHAC !== 'undefined' && Array.isArray(UF_NHAC)) ? UF_NHAC : [];
}
function _tpBatNhac() {
    _tpDungNhac();
    if (!_tpAmThanh) return;
    const ds = _tpDsNhac();
    if (!ds.length) return;
    try {
        const a = new Audio(ds[Math.floor(Math.random() * ds.length)]);
        a.loop = true; a.volume = 0.3; a.preload = 'auto';
        a.addEventListener('error', () => { _tpNhac = null; });
        _tpNhac = a;
        _tpThuPhat();
    } catch (e) { _tpNhac = null; }
}
function _tpThuPhat() {
    if (!_tpNhac || !_tpAmThanh) return;
    const hua = _tpNhac.play();
    if (hua && hua.catch) hua.catch(() => {
        if (_tpChoCham) return;
        _tpChoCham = true;
        const lan1 = () => {
            _tpChoCham = false;
            document.getElementById('tpGame')?.removeEventListener('pointerdown', lan1);
            if (_tpDangMo() && _tpAmThanh) _tpNhac?.play().catch(() => {});
        };
        document.getElementById('tpGame')?.addEventListener('pointerdown', lan1);
    });
}
function _tpDungNhac() {
    if (!_tpNhac) return;
    try { _tpNhac.pause(); _tpNhac.currentTime = 0; } catch (e) {}
    _tpNhac = null;
}
function _tpAmNho(nho) { if (_tpNhac) _tpNhac.volume = nho ? 0.1 : 0.3; }

function _tpTieng(kieu) {
    if (!_tpAmThanh) return;
    try {
        if (!_tpAudio) _tpAudio = new (window.AudioContext || window.webkitAudioContext)();
        const ac = _tpAudio;
        if (ac.state === 'suspended') ac.resume();
        const t0 = ac.currentTime;
        const don = (loai, f1, f2, to, dai, tre) => {
            const o = ac.createOscillator(), g = ac.createGain();
            o.connect(g); g.connect(ac.destination);
            const s = t0 + (tre || 0);
            o.type = loai;
            o.frequency.setValueAtTime(f1, s);
            if (f2) o.frequency.exponentialRampToValueAtTime(f2, s + dai);
            g.gain.setValueAtTime(to, s); g.gain.linearRampToValueAtTime(0, s + dai);
            o.start(s); o.stop(s + dai + .01);
        };
        if (kieu === 'dung') [523, 659, 784, 1047].forEach((f, i) => don('triangle', f, null, .1, .3, i * .09));
        else if (kieu === 'sai') { don('sawtooth', 300, 70, .09, .6); don('sawtooth', 220, 55, .07, .7, .12); }
        else if (kieu === 'tro') don('sine', 880, 1320, .06, .18);
        else if (kieu === 'dung-choi') [784, 988, 1175].forEach((f, i) => don('triangle', f, null, .1, .35, i * .1));
        else if (kieu === 'vodich') [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => don('triangle', f, null, .12, .5, i * .1));
    } catch (e) {}
}

// ── Kiểu dáng ────────────────────────────────────────────────────────────────
function _tpDungKieu() {
    if (document.getElementById('tpKieu')) return;
    const st = document.createElement('style');
    st.id = 'tpKieu';
    st.textContent = `
.tp{
  --tp-nen:#020617; --tp-nen-2:#0b1a4a; --tp-nen-3:#1e1b4b;
  --tp-chu:#fff; --tp-mo:rgba(255,255,255,.6);
  --tp-vang:#fbbf24; --tp-cam:#f97316; --tp-xanh:#22c55e; --tp-do:#ef4444;
  --tp-mat:rgba(255,255,255,.08); --tp-vien:rgba(255,255,255,.16);
  --tp-r:12px; --tp-r-to:20px; --tp-2:8px; --tp-3:14px; --tp-cham:44px;
  color:var(--tp-chu); font-family:"Be Vietnam Pro",system-ui,sans-serif;
  background:radial-gradient(ellipse at 50% 10%,var(--tp-nen-2),var(--tp-nen) 70%);
  user-select:none;
}
.tp:not(.hidden){display:flex;flex-direction:column}
.tp .hidden{display:none !important}
.tp button:focus-visible{outline:3px solid var(--tp-vang);outline-offset:3px;border-radius:var(--tp-r)}

.tp-bar{display:flex;align-items:center;justify-content:space-between;gap:var(--tp-2);
  padding:var(--tp-2) var(--tp-3);flex-shrink:0}
.tp-bar .giua{flex:1;min-width:0;text-align:center;font-weight:800;
  font-size:clamp(.85rem,1.6vw,1.2rem)}
.tp-ghost{display:inline-flex;align-items:center;justify-content:center;gap:6px;
  min-height:var(--tp-cham);min-width:var(--tp-cham);padding:0 var(--tp-3);border-radius:999px;
  background:var(--tp-mat);color:var(--tp-chu);font-weight:800;font-size:.9rem}
.tp-ghost:hover{background:var(--tp-vien)}
.tp-hide-sm{display:none}
@media(min-width:760px){.tp-hide-sm{display:inline}}

.tp-than{flex:1;min-height:0;display:flex;gap:var(--tp-3);padding:0 var(--tp-3);overflow:hidden}

/* thang điểm */
.tp-thang{flex-shrink:0;width:clamp(150px,20vw,260px);display:flex;flex-direction:column-reverse;
  gap:3px;justify-content:center}
.tp-bac{display:flex;align-items:center;gap:8px;padding:4px 10px;border-radius:999px;
  background:var(--tp-mat);font-weight:800;font-size:clamp(.72rem,1.2vw,1rem);
  transition:background .3s,transform .3s,color .3s}
.tp-bac .so{color:var(--tp-mo);min-width:1.6em}
.tp-bac .gt{margin-left:auto;font-weight:900}
.tp-bac.qua{background:rgba(34,197,94,.22);color:#bbf7d0}
.tp-bac.at{border:1px dashed rgba(251,191,36,.6)}
.tp-bac.at .so::after{content:" ★";color:var(--tp-vang)}
.tp-bac.nay{background:linear-gradient(90deg,var(--tp-vang),var(--tp-cam));color:#2b1a00;
  transform:scale(1.06);box-shadow:0 0 26px rgba(251,191,36,.5)}

/* sân khấu */
.tp-san{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;
  justify-content:center;gap:var(--tp-2);text-align:center}
.tp-anh{width:clamp(70px,11vw,140px);aspect-ratio:1;border-radius:50%;object-fit:cover;
  background:#fff;border:5px solid var(--tp-vang);box-shadow:0 10px 30px rgba(0,0,0,.6)}
.tp-anh.thay{display:inline-flex;align-items:center;justify-content:center;background:#e0e7ff;
  color:#3730a3;font-weight:900;font-size:clamp(30px,5vw,60px)}
.tp-ten{font-weight:900;line-height:1.05;font-size:clamp(1.4rem,4vw,3.2rem)}
.tp-stt{font-weight:800;color:var(--tp-mo);font-size:clamp(.8rem,1.4vw,1.05rem)}
.tp-dang{font-weight:900;color:var(--tp-vang);font-size:clamp(1.1rem,2.6vw,2rem)}
.tp-nho{color:var(--tp-mo);font-weight:700;font-size:clamp(.75rem,1.3vw,1rem)}

.tp-tro{display:flex;gap:var(--tp-2);justify-content:center;flex-wrap:wrap;margin-top:4px}
.tp-tro button{min-height:var(--tp-cham);padding:0 var(--tp-3);border-radius:999px;
  background:var(--tp-mat);border:2px solid var(--tp-vien);color:#fff;font-weight:800;
  font-size:clamp(.78rem,1.3vw,1rem)}
.tp-tro button:hover:not(:disabled){border-color:var(--tp-vang);background:rgba(251,191,36,.18)}
.tp-tro button:disabled{opacity:.35;cursor:not-allowed;text-decoration:line-through}

/* biểu đồ hỏi ý kiến lớp */
.tp-bieu{display:flex;align-items:flex-end;justify-content:center;gap:clamp(8px,2vw,26px);margin-top:6px}
.tp-cot{display:flex;flex-direction:column;align-items:center;gap:4px;width:clamp(42px,7vw,86px)}
/* khung có chiều cao rõ ràng để cột tính được phần trăm, không thì cột bị dẹt */
.tp-cot .o-thanh{display:flex;align-items:flex-end;width:100%;height:clamp(60px,12vh,150px)}
.tp-cot .thanh{width:100%;background:linear-gradient(180deg,#60a5fa,#2563eb);border-radius:8px 8px 0 0;
  transition:height .3s ease-out;min-height:4px}
.tp-cot .pa{font-weight:900;font-size:clamp(.8rem,1.5vw,1.1rem)}
.tp-cot .sl{font-weight:900;color:var(--tp-vang);font-size:clamp(.75rem,1.3vw,1rem)}
.tp-cot button{min-height:36px;width:100%;border-radius:8px;background:var(--tp-mat);
  color:#fff;font-weight:900;font-size:.9rem;margin-top:2px}
.tp-cot button:hover{background:var(--tp-vien)}

.tp-act{flex-shrink:0;display:flex;justify-content:center;gap:var(--tp-3);flex-wrap:wrap;
  padding:var(--tp-2) var(--tp-3) var(--tp-3)}
.tp-nut{display:inline-flex;align-items:center;justify-content:center;gap:var(--tp-2);
  min-height:var(--tp-cham);padding:10px clamp(18px,3.5vw,40px);border-radius:var(--tp-r-to);
  font-weight:900;font-size:clamp(.95rem,1.8vw,1.3rem);transition:transform .15s}
.tp-nut:active{transform:translateY(4px)}
.tp-dung{background:linear-gradient(180deg,#4ade80,#16a34a);color:#06281a;box-shadow:0 6px 0 #14532d}
.tp-sai{background:linear-gradient(180deg,#f87171,#dc2626);color:#fff;box-shadow:0 6px 0 #7f1d1d}
.tp-ngung{background:linear-gradient(180deg,#fcd34d,#f59e0b);color:#2b1a00;box-shadow:0 6px 0 #b45309}
.tp-phu{background:var(--tp-mat);border:1px solid var(--tp-vien);color:var(--tp-chu);
  font-size:clamp(.85rem,1.4vw,1.05rem)}
.tp-nut:disabled{background:var(--tp-mat);color:var(--tp-mo);box-shadow:none;cursor:not-allowed}

.tp-ket{position:absolute;inset:0;z-index:9;display:flex;align-items:center;justify-content:center;
  background:rgba(2,6,23,.8);backdrop-filter:blur(5px);padding:var(--tp-3)}
.tp-the{background:linear-gradient(180deg,#fffbeb,#fcd34d);color:#1f2937;border-radius:28px;
  padding:clamp(16px,3vw,34px);text-align:center;max-width:min(92vw,560px);
  box-shadow:0 24px 60px rgba(0,0,0,.6);animation:tpHien .45s cubic-bezier(.2,1.4,.5,1)}
@keyframes tpHien{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}
.tp-the h3{font-weight:900;font-size:clamp(1.5rem,4.5vw,3rem);line-height:1.05}
.tp-the .diem{font-weight:900;color:#b45309;font-size:clamp(2.2rem,7vw,4.5rem);line-height:1}
.tp-the p{font-weight:700;color:#92400e;font-size:clamp(.85rem,1.6vw,1.1rem)}
.tp-the .hang{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:14px}
.tp-the button{min-height:var(--tp-cham);padding:0 20px;border-radius:var(--tp-r-to);
  font-weight:900;font-size:clamp(.9rem,1.5vw,1.1rem)}
.tp-nhan{background:#16a34a;color:#fff}
.tp-moi{background:#4f46e5;color:#fff}
.tp-huy{background:rgba(0,0,0,.1);color:#374151}

@media(max-width:760px){
  .tp-than{flex-direction:column;gap:6px;padding:0 8px;overflow-y:auto}
  .tp-thang{width:100%;flex-direction:row;flex-wrap:wrap;justify-content:center;gap:4px}
  .tp-bac{padding:2px 8px;font-size:.7rem}
  .tp-bac .so{min-width:0}
  .tp-bac .gt{margin-left:4px}
  .tp-nut{padding:9px 14px;font-size:.9rem}
}
@media(prefers-reduced-motion:reduce){ .tp-the,.tp-bac{animation:none !important} }`;
    document.head.appendChild(st);
}

// ── Dựng khung ───────────────────────────────────────────────────────────────
function _tpDungKhung() {
    if (document.getElementById('tpRoot')) return;
    _tpDungKieu();
    const r = document.createElement('div');
    r.id = 'tpRoot';
    r.innerHTML = `
      <div id="tpSetup" class="fixed inset-0 z-[127] hidden items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
        <div class="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
          <div class="px-6 py-4 border-b flex items-center justify-between flex-shrink-0">
            <div>
              <h2 class="text-2xl font-black text-gray-800">📞 Ai Là Triệu Phú</h2>
              <p class="text-gray-500 text-sm mt-0.5">Một bạn lên ghế nóng, leo thang 10 mốc điểm</p>
            </div>
            <button onclick="closeTpSetup()" aria-label="Đóng" class="text-gray-400 hover:text-gray-700 text-2xl" style="min-width:44px;min-height:44px">&times;</button>
          </div>
          <div class="flex-1 overflow-y-auto p-5 space-y-4">
            <div class="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-sm text-indigo-900 font-semibold leading-relaxed">
              Thang điểm: ${TP_THANG.join(' → ')} điểm cộng.<br>
              Hai mốc an toàn ở bậc ${TP_AN_TOAN.map(k => k + 1).join(' và ')} — trả lời sai thì rơi về mốc an toàn gần nhất đã qua.<br>
              Ba quyền trợ giúp: 50/50, hỏi ý kiến cả lớp, gọi một bạn.<br>
              Thí sinh được <b>dừng cuộc chơi</b> bất cứ lúc nào để giữ nguyên điểm.
            </div>
            <div>
              <div class="flex items-center justify-between mb-2">
                <h3 class="font-black text-gray-800">Chọn thí sinh lên ghế nóng</h3>
                <button onclick="tpChonBuaBai()" class="px-4 py-2 rounded-xl font-bold text-sm bg-indigo-100 text-indigo-700 hover:bg-indigo-200" style="min-height:44px">🎲 Chọn ngẫu nhiên</button>
              </div>
              <div id="tpDanhSach" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto p-1"></div>
            </div>
          </div>
          <div class="px-6 py-4 border-t flex items-center justify-between flex-shrink-0 bg-gray-50">
            <span id="tpTomTat" class="text-gray-600 font-bold text-sm">Chưa chọn thí sinh</span>
            <button onclick="batDauTrieuPhu()" id="tpNutBD" disabled
                    class="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-7 py-3 rounded-2xl disabled:bg-gray-300" style="min-height:44px">
              <i class="fas fa-play mr-1" aria-hidden="true"></i> Vào ghế nóng
            </button>
          </div>
        </div>
      </div>

      <div id="tpGame" class="tp fixed inset-0 z-[129] hidden" role="dialog" aria-label="Ai là triệu phú">
        <header class="tp-bar">
          <button onclick="dongTrieuPhu()" class="tp-ghost" aria-label="Thoát">
            <i class="fas fa-arrow-left" aria-hidden="true"></i><span class="tp-hide-sm">Thoát</span>
          </button>
          <div class="giua" id="tpLoi" aria-live="polite"></div>
          <div style="display:flex;gap:8px">
            <button onclick="tpHoanTac()" id="tpNutHoanTac" class="tp-ghost hidden" aria-label="Hoàn tác cộng điểm">
              <i class="fas fa-rotate-left" aria-hidden="true"></i></button>
            <button onclick="tpDoiAm()" id="tpNutAm" class="tp-ghost" aria-label="Bật tắt âm thanh">🔊</button>
            <button onclick="tpDoiFull()" class="tp-ghost" aria-label="Toàn màn hình, phím F">
              <i class="fas fa-expand-arrows-alt" aria-hidden="true"></i></button>
          </div>
        </header>

        <div class="tp-than">
          <div class="tp-thang" id="tpThang"></div>
          <div class="tp-san" id="tpSan"></div>
        </div>
        <div class="tp-act" id="tpAct"></div>
        <div class="tp-ket hidden" id="tpKet"></div>
      </div>`;
    document.body.appendChild(r);
    document.addEventListener('keydown', _tpPhim);
}

function _tpDangMo() {
    const g = document.getElementById('tpGame');
    return g && !g.classList.contains('hidden');
}
function _tpPhim(e) {
    if (!_tpDangMo()) return;
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
    if (e.key === 'f' || e.key === 'F') { e.preventDefault(); tpDoiFull(); }
    else if (e.key === 'Escape') dongTrieuPhu();
}
function tpDoiFull() {
    const el = document.getElementById('tpGame');
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    else el?.requestFullscreen?.().catch(() => {});
}
function tpDoiAm() {
    _tpAmThanh = !_tpAmThanh;
    const b = document.getElementById('tpNutAm');
    if (b) b.textContent = _tpAmThanh ? '🔊' : '🔇';
    if (!_tpAmThanh) { try { _tpNhac?.pause(); } catch (e) {} }
    else if (_tpNhac) _tpThuPhat();
    else _tpBatNhac();
}

// ── Chọn thí sinh ────────────────────────────────────────────────────────────
function openAiLaTrieuPhu() {
    if (!currentClassId) {
        if (typeof showToast === 'function') showToast('Hãy chọn lớp trước', 'error');
        return;
    }
    if (!students.some(s => s.classId === currentClassId)) {
        if (typeof showToast === 'function') showToast('Lớp này chưa có học sinh', 'error');
        return;
    }
    _tpDungKhung();
    _tpHS = null;
    _tpVeDanhSach();
    const e = document.getElementById('tpSetup');
    e.classList.remove('hidden'); e.classList.add('flex');
}
function closeTpSetup() {
    const e = document.getElementById('tpSetup');
    e.classList.add('hidden'); e.classList.remove('flex');
}
function _tpLopHS() {
    return students.filter(s => s.classId === currentClassId)
                   .sort((a, b) => (a.stt || 999) - (b.stt || 999));
}
function _tpVeDanhSach() {
    const o = document.getElementById('tpDanhSach');
    if (!o) return;
    o.innerHTML = _tpLopHS().map(s => `
      <button onclick="tpChonHS(${s.id})"
        class="rounded-xl border-2 p-2 text-left ${_tpHS && _tpHS.id === s.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:border-indigo-300'}"
        style="min-height:44px">
        <p class="font-bold text-sm text-gray-800 truncate">${_tpHS && _tpHS.id === s.id ? '🎤 ' : ''}${s.name}</p>
        <p class="text-[11px] text-gray-500">STT ${s.stt ?? '-'}</p>
      </button>`).join('');
    const t = document.getElementById('tpTomTat');
    if (t) t.textContent = _tpHS ? `Thí sinh: ${_tpHS.ten}` : 'Chưa chọn thí sinh';
    const b = document.getElementById('tpNutBD');
    if (b) b.disabled = !_tpHS;
}
function tpChonHS(id) {
    const s = students.find(x => x.id === id);
    if (!s) return;
    _tpHS = { id: s.id, ten: s.name, stt: s.stt, anh: s.avatar || '' };
    _tpVeDanhSach();
}
function tpChonBuaBai() {
    const ds = _tpLopHS();
    if (!ds.length) return;
    tpChonHS(ds[Math.floor(Math.random() * ds.length)].id);
}

// ── Vào ghế nóng ─────────────────────────────────────────────────────────────
function batDauTrieuPhu() {
    if (!_tpHS) return;
    _tpBac = 0;
    _tpTrangThai = 'CHOI';
    _tpTroGiup = { nam: false, lop: false, ban: false };
    _tpPhieu = [0, 0, 0, 0];
    _tpKetQua = null;
    closeTpSetup();
    document.getElementById('tpGame').classList.remove('hidden');
    document.getElementById('tpKet').classList.add('hidden');
    _tpCapNhat();
    _tpLoi(`${_tpHS.ten} đã vào ghế nóng — câu hỏi cho bậc 1 (${TP_THANG[0]} điểm)`);
    _tpBatNhac();
}
function dongTrieuPhu() {
    _tpDungNhac();
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    document.getElementById('tpGame')?.classList.add('hidden');
    document.getElementById('tpKet')?.classList.add('hidden');
}
function _tpLoi(t) { const e = document.getElementById('tpLoi'); if (e) e.textContent = t; }

// ── Vẽ màn hình ──────────────────────────────────────────────────────────────
function _tpCapNhat() { _tpVeThang(); _tpVeSan(); _tpVeNut(); }

function _tpVeThang() {
    const o = document.getElementById('tpThang');
    if (!o) return;
    o.innerHTML = TP_THANG.map((v, k) => `
      <div class="tp-bac ${k < _tpBac ? 'qua' : ''} ${k === _tpBac && _tpTrangThai === 'CHOI' ? 'nay' : ''} ${TP_AN_TOAN.includes(k) ? 'at' : ''}">
        <span class="so">${k + 1}</span><span class="gt">${v} đ</span>
      </div>`).join('');
}

function _tpVeSan() {
    const o = document.getElementById('tpSan');
    if (!o) return;
    const dangCo = _tpBac > 0 ? TP_THANG[_tpBac - 1] : 0;
    const at = _tpMocAnToan();
    o.innerHTML = `
      ${_tpHS.anh
        ? `<img class="tp-anh" alt="" src="${_tpHS.anh}" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'tp-anh thay',textContent:'${_tpChuDau(_tpHS.ten)}'}))">`
        : `<span class="tp-anh thay">${_tpChuDau(_tpHS.ten)}</span>`}
      <span class="tp-ten">${_tpHS.ten}</span>
      <span class="tp-stt">STT ${_tpHS.stt ?? '?'}</span>
      <span class="tp-dang">${_tpTrangThai === 'CHOI'
          ? `Đang giữ ${dangCo} điểm · câu hỏi bậc ${Math.min(_tpBac + 1, TP_THANG.length)} ăn ${TP_THANG[Math.min(_tpBac, TP_THANG.length - 1)]} điểm`
          : `Chốt ${_tpKetQua ?? 0} điểm`}</span>
      <span class="tp-nho">${_tpTrangThai === 'CHOI'
          ? (at > 0 ? `Mốc an toàn đang giữ: ${at} điểm` : 'Chưa qua mốc an toàn nào — sai là về 0')
          : ''}</span>
      <div class="tp-tro">
        <button onclick="tpTroGiup('nam')" ${_tpTroGiup.nam || _tpTrangThai !== 'CHOI' ? 'disabled' : ''}>50 : 50</button>
        <button onclick="tpTroGiup('lop')" ${_tpTroGiup.lop || _tpTrangThai !== 'CHOI' ? 'disabled' : ''}>👫 Hỏi ý kiến lớp</button>
        <button onclick="tpTroGiup('ban')" ${_tpTroGiup.ban || _tpTrangThai !== 'CHOI' ? 'disabled' : ''}>📞 Gọi một bạn</button>
      </div>
      <div id="tpTroO"></div>`;
}

function _tpVeNut() {
    const o = document.getElementById('tpAct');
    if (!o) return;
    if (_tpTrangThai !== 'CHOI') {
        o.innerHTML = `<button class="tp-nut tp-ngung" onclick="tpThiSinhMoi()">🎤 Thí sinh mới</button>`;
        return;
    }
    const giu = _tpBac > 0 ? TP_THANG[_tpBac - 1] : 0;
    o.innerHTML = `
      <button class="tp-nut tp-dung" onclick="tpTraLoi(true)">✅ TRẢ LỜI ĐÚNG</button>
      <button class="tp-nut tp-sai" onclick="tpTraLoi(false)">❌ TRẢ LỜI SAI</button>
      <button class="tp-nut tp-ngung" onclick="tpDungCuocChoi()" ${giu > 0 ? '' : 'disabled'}>🛑 Dừng cuộc chơi${giu > 0 ? ` (giữ ${giu} đ)` : ''}</button>`;
}

// ── Trả lời ──────────────────────────────────────────────────────────────────
function tpTraLoi(dung) {
    if (_tpTrangThai !== 'CHOI') return;
    if (dung) {
        _tpBac++;
        _tpTieng(TP_AN_TOAN.includes(_tpBac - 1) ? 'vodich' : 'dung');
        if (typeof confetti === 'function' && !_tpGiam() && TP_AN_TOAN.includes(_tpBac - 1)) {
            confetti({ particleCount: 110, spread: 90, origin: { y: .5 },
                       colors: ['#fbbf24', '#f97316', '#fff'] });
        }
        if (_tpBac >= TP_THANG.length) { _tpKetThuc(TP_THANG[TP_THANG.length - 1], 'vodich'); return; }
        _tpCapNhat();
        _tpLoi(`✅ Chính xác! ${_tpHS.ten} lên bậc ${_tpBac + 1}`
            + (TP_AN_TOAN.includes(_tpBac - 1) ? ' — đã chạm MỐC AN TOÀN!' : ''));
        return;
    }
    _tpTieng('sai');
    _tpKetThuc(_tpMocAnToan(), 'sai');
}

function tpDungCuocChoi() {
    if (_tpTrangThai !== 'CHOI' || _tpBac === 0) return;
    _tpTieng('dung-choi');
    _tpKetThuc(TP_THANG[_tpBac - 1], 'dung');
}

function _tpKetThuc(diem, kieu) {
    _tpTrangThai = 'XONG';
    _tpKetQua = diem;
    _tpAmNho(true);
    _tpCapNhat();
    const tieu = kieu === 'vodich' ? '🏆 CHINH PHỤC ĐỈNH CAO!'
               : kieu === 'dung'   ? '🛑 Dừng cuộc chơi'
               : '❌ Rất tiếc, chưa đúng';
    const loi = kieu === 'vodich' ? `${_tpHS.ten} đã vượt cả ${TP_THANG.length} bậc!`
              : kieu === 'dung'   ? `${_tpHS.ten} dừng lại và giữ trọn số điểm`
              : (diem > 0 ? `Rơi về mốc an toàn — vẫn giữ được ${diem} điểm`
                          : 'Chưa qua mốc an toàn nào nên chưa có điểm');
    if (kieu !== 'sai' && typeof confetti === 'function' && !_tpGiam()) {
        confetti({ particleCount: 180, spread: 120, origin: { y: .5 },
                   colors: ['#fbbf24', '#f97316', '#fff', '#4ade80'] });
    }
    const ket = document.getElementById('tpKet');
    ket.innerHTML = `
      <div class="tp-the" role="alert">
        <h3>${tieu}</h3>
        <p>${_tpHS.ten}</p>
        <div class="diem">${diem} điểm</div>
        <p>${loi}</p>
        <div class="hang">
          <button class="tp-nhan" onclick="tpNhanDiem()" ${diem > 0 ? '' : 'disabled'}>💰 Cộng ${diem} điểm vào sổ</button>
          <button class="tp-moi" onclick="tpThiSinhMoi()">🎤 Thí sinh mới</button>
          <button class="tp-huy" onclick="tpDongThe()">👀 Xem lại thang</button>
        </div>
      </div>`;
    ket.classList.remove('hidden');
    _tpLoi(`${tieu} — ${_tpHS.ten} chốt ${diem} điểm`);
}
function tpDongThe() {
    document.getElementById('tpKet')?.classList.add('hidden');
    _tpAmNho(false);
}
function tpThiSinhMoi() {
    document.getElementById('tpKet')?.classList.add('hidden');
    _tpAmNho(false);
    _tpTrangThai = 'CHO';
    document.getElementById('tpGame').classList.add('hidden');
    openAiLaTrieuPhu();
}

// ── Trợ giúp ─────────────────────────────────────────────────────────────────
function tpTroGiup(loai) {
    if (_tpTrangThai !== 'CHOI' || _tpTroGiup[loai]) return;
    _tpTroGiup[loai] = true;
    _tpTieng('tro');
    const o = document.getElementById('tpTroO');
    if (loai === 'nam') {
        _tpVeSan();
        document.getElementById('tpTroO').innerHTML =
            `<p class="tp-dang">50 : 50 — thầy cô bỏ bớt 2 phương án sai</p>`;
        _tpLoi('Đã dùng 50:50 — chỉ còn hai phương án');
    } else if (loai === 'ban') {
        const ds = _tpLopHS().filter(s => s.id !== _tpHS.id);
        _tpVeSan();
        const b = ds.length ? ds[Math.floor(Math.random() * ds.length)] : null;
        document.getElementById('tpTroO').innerHTML = b
            ? `<p class="tp-dang">📞 Gọi cho: ${b.name} <span class="tp-nho">(STT ${b.stt ?? '?'})</span></p>`
            : `<p class="tp-nho">Lớp không còn bạn nào khác</p>`;
        _tpLoi(b ? `Gọi điện cho ${b.name}` : 'Không còn bạn nào để gọi');
    } else {
        _tpPhieu = [0, 0, 0, 0];
        _tpVeSan();
        _tpVeBieuDo();
        _tpLoi('Cả lớp giơ tay — thầy cô bấm để đếm phiếu từng phương án');
    }
}

function _tpVeBieuDo() {
    const o = document.getElementById('tpTroO');
    if (!o) return;
    const max = Math.max(1, ..._tpPhieu);
    o.innerHTML = `<div class="tp-bieu">` + TP_PA.map((pa, i) => `
      <div class="tp-cot">
        <span class="sl">${_tpPhieu[i]}</span>
        <span class="o-thanh"><i class="thanh" style="height:${Math.round(_tpPhieu[i] / max * 100)}%"></i></span>
        <span class="pa">${pa}</span>
        <button onclick="tpThemPhieu(${i})" aria-label="Thêm một phiếu cho phương án ${pa}">+1</button>
      </div>`).join('') + `</div>`;
}
function tpThemPhieu(i) {
    if (_tpPhieu[i] === undefined) return;
    _tpPhieu[i]++;
    _tpVeBieuDo();
}

// ── Cộng điểm cho thí sinh ───────────────────────────────────────────────────
function tpNhanDiem() {
    if (!_tpHS || !_tpKetQua || _tpKetQua <= 0) return;
    const s = students.find(x => x.id === _tpHS.id);
    if (!s) return;
    const diem = _tpKetQua;
    const cu = s.points;
    s.points += diem; s.positivePoints += diem;
    const id = Date.now() + Math.random();
    history.push({ id, classId: currentClassId, studentId: s.id, studentName: s.name,
                   skillName: `Ai Là Triệu Phú — bậc ${_tpBac}`, points: diem,
                   timestamp: new Date().toISOString() });
    if (typeof checkMilestone === 'function') checkMilestone(s, cu);
    if (typeof checkGoalAchievements === 'function') setTimeout(() => checkGoalAchievements(s.id), 100);
    _tpNhatKy = [{ lichSuId: id, studentId: s.id, diem }];
    _tpLuu();
    document.getElementById('tpNutHoanTac')?.classList.remove('hidden');
    _tpKetQua = 0;
    tpDongThe();
    _tpCapNhat();
    _tpLoi(`💰 Đã cộng ${diem} điểm cho ${s.name}`);
    if (typeof showToast === 'function') showToast(`Đã cộng ${diem} điểm cho ${s.name}`, 'success');
}
function tpHoanTac() {
    if (!_tpNhatKy || !_tpNhatKy.length) return;
    _tpNhatKy.forEach(g => {
        const s = students.find(x => x.id === g.studentId);
        if (s) { s.points -= g.diem; s.positivePoints -= g.diem; }
        const k = history.findIndex(h => h.id === g.lichSuId);
        if (k > -1) history.splice(k, 1);
    });
    _tpNhatKy = null;
    document.getElementById('tpNutHoanTac')?.classList.add('hidden');
    _tpLuu();
    _tpLoi('↩️ Đã hoàn tác lần cộng điểm vừa rồi');
    if (typeof showToast === 'function') showToast('Đã hoàn tác', 'success');
}
function _tpLuu() {
    if (typeof saveData === 'function') saveData();
    if (typeof scheduleAutoSync === 'function') scheduleAutoSync();
    if (typeof renderStudents === 'function' && typeof currentView !== 'undefined' && currentView === 'classroom') renderStudents();
    else if (typeof renderReport === 'function') renderReport();
}
