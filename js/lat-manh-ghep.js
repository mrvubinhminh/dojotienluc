// ============================================================
// LẬT MẢNH GHÉP — ĐOÁN HÌNH BÍ MẬT
// ------------------------------------------------------------
// Thầy cô chọn một tấm ảnh (chân dung nhà toán học, hình bài học, đáp số...).
// Ảnh bị che bởi các mảnh ghép đánh số. Nhóm trả lời đúng câu hỏi thì được
// mở một mảnh, ảnh lộ dần ra.
//
// Điểm hay: nhóm nào cũng được quyền CHỐT ĐOÁN bất cứ lúc nào. Ảnh càng kín
// mà đoán trúng thì điểm càng cao, mở càng nhiều mảnh thì phần thưởng càng
// teo lại — nên cả lớp phải cân nhắc "có dám đoán bây giờ không".
//
// Điểm chỉ vào sổ khi bấm "Kết thúc & cộng điểm", có hoàn tác.
// Giao diện tự dựng trong file này, không phụ thuộc file khác.
// ============================================================

const LM_SO_MANH   = [12, 16, 20, 24];
const LM_MO_MANH   = 1;        // điểm cho nhóm mở được một mảnh
const LM_PHAT_SAI  = 2;        // đoán sai thì trừ ngần này điểm trong trò
const LM_KHOA_SAI  = 2;        // đoán sai thì chờ mở thêm ngần này mảnh mới được đoán lại
// đoán trúng: còn che càng nhiều thì càng được nhiều
const LM_THUONG = [
    { che: 0.70, diem: 5 },
    { che: 0.40, diem: 3 },
    { che: 0.00, diem: 1 }
];

let _lmAnh      = null;     // { url, w, h }
let _lmDapAn    = '';
let _lmCot = 4, _lmHang = 3;
let _lmManh     = [];       // [{ mo:false, el }]
let _lmDoi      = [];       // [{ id, ten, phu, ids, diem, khoa, el }]
let _lmTrangThai = 'CHO';   // CHO | CHOI | XONG
let _lmNhatKy   = null;
let _lmAmThanh  = true;
let _lmNhac     = null;
let _lmChoCham  = false;
let _lmAudio    = null;
let _lmDoiMo    = null;     // nhóm vừa được chọn để mở mảnh

function _lmGiam() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
function _lmChuDau(t) { return (t || '?').trim().split(/\s+/).pop().charAt(0).toUpperCase(); }

// ── Âm thanh (dùng chung nhạc với Đĩa Bay Gọi Tên) ───────────────────────────
function _lmDsNhac() {
    return (typeof UF_NHAC !== 'undefined' && Array.isArray(UF_NHAC)) ? UF_NHAC : [];
}
function _lmBatNhac() {
    _lmDungNhac();
    if (!_lmAmThanh) return;
    const ds = _lmDsNhac();
    if (!ds.length) return;
    try {
        const a = new Audio(ds[Math.floor(Math.random() * ds.length)]);
        a.loop = true; a.volume = 0.3; a.preload = 'auto';
        a.addEventListener('error', () => { _lmNhac = null; });
        _lmNhac = a;
        _lmThuPhat();
    } catch (e) { _lmNhac = null; }
}
function _lmThuPhat() {
    if (!_lmNhac || !_lmAmThanh) return;
    const hua = _lmNhac.play();
    if (hua && hua.catch) hua.catch(() => {
        if (_lmChoCham) return;
        _lmChoCham = true;
        const lan1 = () => {
            _lmChoCham = false;
            document.getElementById('lmGame')?.removeEventListener('pointerdown', lan1);
            if (_lmDangMo() && _lmAmThanh) _lmNhac?.play().catch(() => {});
        };
        document.getElementById('lmGame')?.addEventListener('pointerdown', lan1);
    });
}
function _lmDungNhac() {
    if (!_lmNhac) return;
    try { _lmNhac.pause(); _lmNhac.currentTime = 0; } catch (e) {}
    _lmNhac = null;
}
function _lmAmNho(nho) { if (_lmNhac) _lmNhac.volume = nho ? 0.1 : 0.3; }

function _lmTieng(kieu) {
    if (!_lmAmThanh) return;
    try {
        if (!_lmAudio) _lmAudio = new (window.AudioContext || window.webkitAudioContext)();
        const ac = _lmAudio;
        if (ac.state === 'suspended') ac.resume();
        const t0 = ac.currentTime;
        if (kieu === 'mo') {                       // mảnh ghép bật ra
            const o = ac.createOscillator(), g = ac.createGain();
            o.connect(g); g.connect(ac.destination);
            o.type = 'triangle';
            o.frequency.setValueAtTime(420, t0);
            o.frequency.exponentialRampToValueAtTime(880, t0 + .14);
            g.gain.setValueAtTime(.07, t0); g.gain.linearRampToValueAtTime(0, t0 + .2);
            o.start(t0); o.stop(t0 + .21);
        } else if (kieu === 'sai') {
            const o = ac.createOscillator(), g = ac.createGain();
            o.connect(g); g.connect(ac.destination);
            o.type = 'sawtooth';
            o.frequency.setValueAtTime(300, t0);
            o.frequency.exponentialRampToValueAtTime(90, t0 + .35);
            g.gain.setValueAtTime(.07, t0); g.gain.linearRampToValueAtTime(0, t0 + .4);
            o.start(t0); o.stop(t0 + .41);
        } else if (kieu === 'trung') {
            [523, 659, 784, 1047, 1319].forEach((f, i) => {
                const oo = ac.createOscillator(), gg = ac.createGain();
                oo.connect(gg); gg.connect(ac.destination);
                oo.type = 'triangle'; oo.frequency.value = f;
                const s = t0 + i * .09;
                gg.gain.setValueAtTime(0, s);
                gg.gain.linearRampToValueAtTime(.13, s + .03);
                gg.gain.exponentialRampToValueAtTime(.001, s + .65);
                oo.start(s); oo.stop(s + .7);
            });
        }
    } catch (e) {}
}

// ── Kiểu dáng ────────────────────────────────────────────────────────────────
function _lmDungKieu() {
    if (document.getElementById('lmKieu')) return;
    const st = document.createElement('style');
    st.id = 'lmKieu';
    st.textContent = `
.lm{
  --lm-nen:#0f172a; --lm-nen-2:#1e293b;
  --lm-chu:#fff; --lm-mo:rgba(255,255,255,.62);
  --lm-vang:#fbbf24; --lm-xanh:#22c55e; --lm-do:#ef4444; --lm-tim:#8b5cf6;
  --lm-mat:rgba(255,255,255,.1); --lm-vien:rgba(255,255,255,.18);
  --lm-r:14px; --lm-r-to:22px; --lm-2:8px; --lm-3:14px; --lm-cham:44px;
  color:var(--lm-chu); font-family:"Be Vietnam Pro",system-ui,sans-serif;
  background:linear-gradient(160deg,var(--lm-nen),var(--lm-nen-2));
  user-select:none;
}
.lm:not(.hidden){display:flex;flex-direction:column}
.lm .hidden{display:none !important}
.lm button:focus-visible{outline:3px solid var(--lm-vang);outline-offset:3px;border-radius:var(--lm-r)}

.lm-bar{display:flex;align-items:center;justify-content:space-between;gap:var(--lm-2);
  padding:var(--lm-2) var(--lm-3);flex-shrink:0}
.lm-bar .giua{flex:1;min-width:0;text-align:center}
.lm-ghost{display:inline-flex;align-items:center;justify-content:center;gap:6px;
  min-height:var(--lm-cham);min-width:var(--lm-cham);padding:0 var(--lm-3);border-radius:999px;
  background:var(--lm-mat);color:var(--lm-chu);font-weight:800;font-size:.9rem}
.lm-ghost:hover{background:var(--lm-vien)}
.lm-ghost:disabled{opacity:.45;cursor:not-allowed}
.lm-hide-sm{display:none}
@media(min-width:760px){.lm-hide-sm{display:inline}}
.lm-thuong{display:inline-block;background:linear-gradient(180deg,#fcd34d,#f59e0b);color:#2b1a00;
  font-weight:900;border-radius:999px;padding:4px 16px;font-size:clamp(.85rem,1.6vw,1.2rem);
  box-shadow:0 4px 14px rgba(245,158,11,.45)}
.lm-conche{display:block;color:var(--lm-mo);font-weight:700;font-size:.8rem;margin-top:2px}

/* khung ảnh + lớp mảnh ghép phủ lên */
.lm-san{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;
  padding:0 var(--lm-3)}
.lm-khung{position:relative;border-radius:var(--lm-r-to);overflow:hidden;
  box-shadow:0 18px 50px rgba(0,0,0,.6);background:#0b1220}
.lm-khung img{display:block;width:100%;height:100%;object-fit:cover}
.lm-o{position:absolute;display:flex;align-items:center;justify-content:center;
  background:linear-gradient(145deg,#6d28d9,#4c1d95);color:#fff;font-weight:900;
  border:2px solid rgba(255,255,255,.25);
  font-size:clamp(14px,2.6vw,38px);cursor:pointer;
  transition:transform .45s cubic-bezier(.3,1.3,.5,1),opacity .45s ease-out}
.lm-o:hover{background:linear-gradient(145deg,#7c3aed,#5b21b6);border-color:var(--lm-vang)}
.lm-o.mo{transform:rotateY(90deg) scale(.6);opacity:0;pointer-events:none}
.lm-o.cho{animation:lmCho 1s ease-in-out infinite}
@keyframes lmCho{0%,100%{box-shadow:inset 0 0 0 0 rgba(251,191,36,0)}
  50%{box-shadow:inset 0 0 0 5px rgba(251,191,36,.85)}}

/* bảng các nhóm */
.lm-bang{flex-shrink:0;display:flex;gap:var(--lm-2);justify-content:center;flex-wrap:wrap;
  padding:var(--lm-2) var(--lm-3)}
.lm-the{display:flex;flex-direction:column;align-items:center;gap:2px;min-width:96px;
  padding:6px 10px;border-radius:var(--lm-r);background:var(--lm-mat);
  border:2px solid var(--lm-vien);transition:border-color .2s,background .2s}
.lm-the.chon{border-color:var(--lm-vang);background:rgba(251,191,36,.2)}
.lm-the.khoa{opacity:.5}
.lm-the .ten{font-weight:900;font-size:clamp(.8rem,1.4vw,1.05rem);white-space:nowrap;
  max-width:28vw;overflow:hidden;text-overflow:ellipsis}
.lm-the .diem{font-weight:900;color:var(--lm-vang);font-size:clamp(1rem,1.9vw,1.4rem)}
.lm-the .hang{display:flex;gap:4px;margin-top:2px}
.lm-the .hang button{min-height:var(--lm-cham);padding:0 12px;border-radius:999px;font-weight:800;
  font-size:.82rem;background:rgba(255,255,255,.14);color:#fff}
.lm-the .hang button.doan{background:var(--lm-tim)}
.lm-the .hang button.doan:disabled{background:rgba(255,255,255,.1);color:var(--lm-mo);cursor:not-allowed}
.lm-the .hang button:hover:not(:disabled){filter:brightness(1.2)}

.lm-act{flex-shrink:0;display:flex;justify-content:center;gap:var(--lm-3);flex-wrap:wrap;
  padding:0 var(--lm-3) var(--lm-3)}
.lm-nut{display:inline-flex;align-items:center;justify-content:center;gap:var(--lm-2);
  min-height:var(--lm-cham);padding:10px clamp(18px,3.5vw,38px);border-radius:var(--lm-r-to);
  font-weight:900;font-size:clamp(.95rem,1.7vw,1.2rem);transition:transform .15s}
.lm-nut:active{transform:translateY(4px)}
.lm-cong{background:linear-gradient(180deg,#fcd34d,#f59e0b);color:#2b1a00;box-shadow:0 6px 0 #b45309}
.lm-phu{background:var(--lm-mat);border:1px solid var(--lm-vien);color:var(--lm-chu)}
.lm-nut:disabled{background:var(--lm-mat);color:var(--lm-mo);box-shadow:none;cursor:not-allowed}
#lmLoi{flex-shrink:0;text-align:center;font-weight:900;line-height:1.15;min-height:1.2em;
  font-size:clamp(.95rem,2.2vw,1.6rem);padding:0 var(--lm-3) 6px}
#lmLoi .nho{display:block;font-size:.58em;opacity:.7;font-weight:700}

/* hỏi đúng sai khi một nhóm chốt đoán */
.lm-hoi{position:absolute;inset:0;z-index:9;display:flex;align-items:center;justify-content:center;
  background:rgba(5,8,26,.78);backdrop-filter:blur(5px);padding:var(--lm-3)}
.lm-hop{background:#fff;color:#1f2937;border-radius:26px;padding:clamp(16px,3vw,32px);
  text-align:center;max-width:min(92vw,560px);box-shadow:0 24px 60px rgba(0,0,0,.6);
  animation:lmHien .35s cubic-bezier(.2,1.4,.5,1)}
@keyframes lmHien{from{transform:scale(.7);opacity:0}to{transform:scale(1);opacity:1}}
.lm-hop h3{font-weight:900;font-size:clamp(1.3rem,3.4vw,2.2rem);margin-bottom:4px}
.lm-hop p{color:#6b7280;font-weight:700;font-size:clamp(.85rem,1.6vw,1.05rem)}
.lm-hop .cuoc{display:inline-block;margin:10px 0;background:#fef3c7;color:#92400e;font-weight:900;
  border-radius:999px;padding:6px 18px;font-size:clamp(1rem,2.2vw,1.4rem)}
.lm-hop .hang{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:10px}
.lm-hop button{min-height:var(--lm-cham);padding:0 22px;border-radius:var(--lm-r-to);
  font-weight:900;font-size:clamp(.95rem,1.7vw,1.15rem)}
.lm-dung{background:#16a34a;color:#fff}
.lm-sai{background:#dc2626;color:#fff}
.lm-huy{background:#e5e7eb;color:#374151}

@media(max-width:640px){
  .lm-the{min-width:76px;padding:4px 7px}
  .lm-nut{padding:9px 14px;font-size:.95rem}
  .lm-bar{padding:6px 8px}
  .lm-san{padding:0 8px}
}
@media(prefers-reduced-motion:reduce){
  .lm-o,.lm-hop{animation:none !important;transition-duration:.01ms !important}
}`;
    document.head.appendChild(st);
}

// ── Dựng khung ───────────────────────────────────────────────────────────────
function _lmDungKhung() {
    if (document.getElementById('lmRoot')) return;
    _lmDungKieu();
    const r = document.createElement('div');
    r.id = 'lmRoot';
    r.innerHTML = `
      <div id="lmSetup" class="fixed inset-0 z-[127] hidden items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
        <div class="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
          <div class="px-6 py-4 border-b flex items-center justify-between flex-shrink-0">
            <div>
              <h2 class="text-2xl font-black text-gray-800">🧩 Lật Mảnh Ghép</h2>
              <p class="text-gray-500 text-sm mt-0.5">Đoán hình bí mật — ảnh càng kín, đoán trúng càng nhiều điểm</p>
            </div>
            <button onclick="closeLmSetup()" aria-label="Đóng" class="text-gray-400 hover:text-gray-700 text-2xl" style="min-width:44px;min-height:44px">&times;</button>
          </div>
          <div class="flex-1 overflow-y-auto p-5 space-y-5">
            <div>
              <h3 class="font-black text-gray-800 mb-2">1. Chọn ảnh bí mật</h3>
              <label class="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-violet-300 bg-violet-50 rounded-2xl p-5 cursor-pointer hover:border-violet-500 hover:bg-violet-100 transition">
                <input type="file" accept="image/*" class="hidden" onchange="lmChonAnh(event)">
                <span class="text-3xl">🖼️</span>
                <span class="font-bold text-violet-700 text-sm">Bấm để chọn ảnh từ máy</span>
                <span class="text-[11px] text-violet-500">Chân dung nhà toán học, hình bài học, đáp số…</span>
              </label>
              <div id="lmXemTruoc" class="mt-3 hidden">
                <img id="lmAnhXem" alt="Ảnh đã chọn" class="w-full max-h-48 object-contain rounded-xl border bg-gray-50">
                <p id="lmAnhTin" class="text-xs text-gray-500 mt-1 text-center"></p>
              </div>
            </div>
            <div>
              <h3 class="font-black text-gray-800 mb-2">2. Đáp án <span class="font-normal text-gray-400 text-sm">(hiện ra khi kết thúc)</span></h3>
              <input id="lmDapAn" type="text" placeholder="VD: Nhà toán học Lê Văn Thiêm"
                     class="w-full border-2 border-gray-200 px-3 py-3 rounded-xl focus:outline-none focus:border-violet-500">
            </div>
            <div>
              <h3 class="font-black text-gray-800 mb-2">3. Số mảnh ghép</h3>
              <div id="lmChonManh" class="flex gap-2 flex-wrap"></div>
            </div>
            <div>
              <h3 class="font-black text-gray-800 mb-2">4. Ai chơi</h3>
              <div id="lmChonKieu" class="flex gap-2 mb-3 flex-wrap"></div>
              <div id="lmDanhSach" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1"></div>
            </div>
          </div>
          <div class="px-6 py-4 border-t flex items-center justify-between flex-shrink-0 bg-gray-50">
            <span id="lmTomTat" class="text-gray-600 font-bold text-sm"></span>
            <button onclick="batDauLatManhGhep()" id="lmNutBD"
                    class="bg-violet-600 hover:bg-violet-500 text-white font-black px-7 py-3 rounded-2xl disabled:bg-gray-300" style="min-height:44px">
              <i class="fas fa-play mr-1" aria-hidden="true"></i> Bắt đầu
            </button>
          </div>
        </div>
      </div>

      <div id="lmGame" class="lm fixed inset-0 z-[129] hidden" role="dialog" aria-label="Lật mảnh ghép">
        <header class="lm-bar">
          <button onclick="dongLatManhGhep()" class="lm-ghost" aria-label="Thoát">
            <i class="fas fa-arrow-left" aria-hidden="true"></i><span class="lm-hide-sm">Thoát</span>
          </button>
          <div class="giua">
            <span class="lm-thuong" id="lmThuong">Đoán trúng lúc này: +5 điểm</span>
            <span class="lm-conche" id="lmConChe"></span>
          </div>
          <div style="display:flex;gap:8px">
            <button onclick="lmHoanTac()" id="lmNutHoanTac" class="lm-ghost hidden" aria-label="Hoàn tác cộng điểm">
              <i class="fas fa-rotate-left" aria-hidden="true"></i></button>
            <button onclick="lmDoiAm()" id="lmNutAm" class="lm-ghost" aria-label="Bật tắt âm thanh">🔊</button>
            <button onclick="lmDoiFull()" class="lm-ghost" aria-label="Toàn màn hình, phím F">
              <i class="fas fa-expand-arrows-alt" aria-hidden="true"></i></button>
          </div>
        </header>

        <div class="lm-san"><div class="lm-khung" id="lmKhung"></div></div>
        <div id="lmLoi" aria-live="polite"></div>
        <div class="lm-bang" id="lmBang"></div>
        <div class="lm-act">
          <button class="lm-nut lm-phu" onclick="lmMoHet()" id="lmNutMoHet">👁️ Mở hết ảnh</button>
          <button class="lm-nut lm-cong" onclick="lmCongDiem()" id="lmNutCong">💰 Kết thúc &amp; cộng điểm</button>
        </div>
        <div class="lm-hoi hidden" id="lmHoi"></div>
      </div>`;
    document.body.appendChild(r);
    document.addEventListener('keydown', _lmPhim);
    window.addEventListener('resize', () => { if (_lmDangMo()) _lmXepAnh(); });
    // bảng điểm và dòng nhắc có thể xuống dòng làm chỗ trống đổi, phải tính lại khung ảnh
    if (window.ResizeObserver) {
        new ResizeObserver(() => { if (_lmDangMo()) _lmXepAnh(); })
            .observe(document.querySelector('.lm-san'));
    }
}

function _lmDangMo() {
    const g = document.getElementById('lmGame');
    return g && !g.classList.contains('hidden');
}
function _lmPhim(e) {
    if (!_lmDangMo()) return;
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
    if (e.key === 'f' || e.key === 'F') { e.preventDefault(); lmDoiFull(); }
    else if (e.key === 'Escape') {
        if (!document.getElementById('lmHoi').classList.contains('hidden')) lmDongHoi();
        else dongLatManhGhep();
    }
}
function lmDoiFull() {
    const el = document.getElementById('lmGame');
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    else el?.requestFullscreen?.().catch(() => {});
}
function lmDoiAm() {
    _lmAmThanh = !_lmAmThanh;
    const b = document.getElementById('lmNutAm');
    if (b) b.textContent = _lmAmThanh ? '🔊' : '🔇';
    if (!_lmAmThanh) { try { _lmNhac?.pause(); } catch (e) {} }
    else if (_lmNhac) _lmThuPhat();
    else _lmBatNhac();
}

// ── Màn chuẩn bị ─────────────────────────────────────────────────────────────
function openLatManhGhep() {
    if (!currentClassId) {
        if (typeof showToast === 'function') showToast('Hãy chọn lớp trước', 'error');
        return;
    }
    const ds = students.filter(s => s.classId === currentClassId);
    if (!ds.length) {
        if (typeof showToast === 'function') showToast('Lớp này chưa có học sinh', 'error');
        return;
    }
    _lmDungKhung();
    _lmVeChonManh();
    _lmVeChonKieu();
    _lmVeDanhSach();
    _lmCapNhatBD();
    document.getElementById('lmSetup').classList.remove('hidden');
    document.getElementById('lmSetup').classList.add('flex');
}
function closeLmSetup() {
    const e = document.getElementById('lmSetup');
    e.classList.add('hidden'); e.classList.remove('flex');
}

function lmChonAnh(ev) {
    const f = ev.target.files && ev.target.files[0];
    if (!f) return;
    const doc = new FileReader();
    doc.onload = () => {
        const img = new Image();
        img.onload = () => {
            _lmAnh = { url: doc.result, w: img.naturalWidth, h: img.naturalHeight };
            document.getElementById('lmAnhXem').src = doc.result;
            document.getElementById('lmXemTruoc').classList.remove('hidden');
            document.getElementById('lmAnhTin').textContent =
                `${img.naturalWidth} × ${img.naturalHeight} · ${Math.round(f.size / 1024)} KB`;
            _lmVeChonManh();
            _lmCapNhatBD();
        };
        img.onerror = () => {
            if (typeof showToast === 'function') showToast('Không đọc được ảnh này', 'error');
        };
        img.src = doc.result;
    };
    doc.onerror = () => {
        if (typeof showToast === 'function') showToast('Không đọc được tệp', 'error');
    };
    doc.readAsDataURL(f);
}

// chia số mảnh thành hàng × cột hợp với khổ ảnh nhất
function _lmChiaO(n, tyLe) {
    let tot = null;
    for (let c = 1; c <= n; c++) {
        if (n % c) continue;
        const h = n / c;
        const lech = Math.abs((c / h) - tyLe);
        if (!tot || lech < tot.lech) tot = { cot: c, hang: h, lech };
    }
    return tot || { cot: n, hang: 1 };
}

function _lmVeChonManh() {
    const o = document.getElementById('lmChonManh');
    if (!o) return;
    const tyLe = _lmAnh ? _lmAnh.w / _lmAnh.h : 4 / 3;
    o.innerHTML = LM_SO_MANH.map(n => {
        const k = _lmChiaO(n, tyLe);
        const chon = _lmCot * _lmHang === n;
        return `<button onclick="lmDatManh(${n})"
          class="px-4 py-2 rounded-xl font-bold text-sm ${chon ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
          style="min-height:44px">${n} mảnh<span class="block text-[10px] font-normal opacity-70">${k.cot}×${k.hang}</span></button>`;
    }).join('');
}
function lmDatManh(n) {
    const k = _lmChiaO(n, _lmAnh ? _lmAnh.w / _lmAnh.h : 4 / 3);
    _lmCot = k.cot; _lmHang = k.hang;
    _lmVeChonManh();
}

let _lmTheoNhom = true;
function _lmCoNhom() {
    return typeof _groupResult !== 'undefined' && Array.isArray(_groupResult)
        && _groupResult.length > 0 && _groupResult.some(g => g && g.length);
}
function _lmVeChonKieu() {
    const o = document.getElementById('lmChonKieu');
    if (!o) return;
    const coNhom = _lmCoNhom();
    if (!coNhom) _lmTheoNhom = false;
    const nut = (nhom, nhan, bat) => `
      <button onclick="lmDoiKieu(${nhom})" ${bat ? '' : 'disabled'}
        class="px-4 py-2 rounded-xl font-bold text-sm ${_lmTheoNhom === nhom
            ? 'bg-violet-600 text-white'
            : bat ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gray-50 text-gray-300 cursor-not-allowed'}"
        style="min-height:44px">${nhan}</button>`;
    o.innerHTML = nut(true, '👥 Theo nhóm', coNhom) + nut(false, '🙋 Từng học sinh', true)
        + (coNhom ? '' : '<span class="text-xs text-gray-400 self-center ml-1">Hãy dùng "Chia nhóm ngẫu nhiên" trước</span>');
}
function lmDoiKieu(n) { _lmTheoNhom = !!n; _lmVeChonKieu(); _lmVeDanhSach(); }

function _lmNguon() {
    const ds = students.filter(s => s.classId === currentClassId)
                       .sort((a, b) => (a.stt || 999) - (b.stt || 999));
    if (_lmTheoNhom && _lmCoNhom()) {
        return _groupResult.map((mems, gi) => ({
            id: 'g' + gi, ten: 'Nhóm ' + (gi + 1),
            ids: mems.map(m => m.id).filter(id => ds.some(s => s.id === id)),
            phu: mems.length + ' bạn'
        })).filter(d => d.ids.length);
    }
    return ds.map(s => ({ id: 's' + s.id, ten: s.name, ids: [s.id], phu: 'STT ' + (s.stt ?? '-') }));
}

function _lmVeDanhSach() {
    const o = document.getElementById('lmDanhSach');
    if (!o) return;
    const nguon = _lmNguon();
    if (!_lmDoi.length || _lmDoi[0]._kieu !== _lmTheoNhom) {
        _lmDoi = nguon.map(d => ({ ...d, _kieu: _lmTheoNhom, chon: true }));
    }
    o.innerHTML = _lmDoi.map((d, i) => `
      <button onclick="lmChonDoi(${i})"
        class="rounded-xl border-2 p-2 text-left ${d.chon ? 'border-violet-500 bg-violet-50' : 'border-gray-200 bg-white opacity-60'}"
        style="min-height:44px">
        <p class="font-bold text-sm text-gray-800 truncate">${d.chon ? '✅ ' : ''}${d.ten}</p>
        <p class="text-[11px] text-gray-500">${d.phu}</p>
      </button>`).join('');
    _lmCapNhatBD();
}
function lmChonDoi(i) { if (_lmDoi[i]) { _lmDoi[i].chon = !_lmDoi[i].chon; _lmVeDanhSach(); } }

function _lmCapNhatBD() {
    const n = _lmDoi.filter(d => d.chon).length;
    const tt = document.getElementById('lmTomTat');
    if (tt) tt.textContent = _lmAnh
        ? `${n} ${_lmTheoNhom ? 'nhóm' : 'bạn'} · ${_lmCot * _lmHang} mảnh ghép`
        : 'Hãy chọn một tấm ảnh bí mật';
    const b = document.getElementById('lmNutBD');
    if (b) b.disabled = !_lmAnh || n < 1;
}

// ── Vào trận ─────────────────────────────────────────────────────────────────
function batDauLatManhGhep() {
    if (!_lmAnh) {
        if (typeof showToast === 'function') showToast('Hãy chọn ảnh bí mật trước', 'error');
        return;
    }
    const chon = _lmDoi.filter(d => d.chon);
    if (!chon.length) {
        if (typeof showToast === 'function') showToast('Chọn ít nhất 1 đội chơi', 'error');
        return;
    }
    _lmDapAn = (document.getElementById('lmDapAn')?.value || '').trim();
    _lmDoi = chon.map(d => ({ id: d.id, ten: d.ten, phu: d.phu, ids: [...d.ids],
                              diem: 0, khoa: 0 }));
    _lmNhatKy = null;
    _lmDoiMo = null;
    _lmTrangThai = 'CHOI';
    closeLmSetup();
    document.getElementById('lmGame').classList.remove('hidden');
    _lmTaoManh();
    _lmVeBang();
    _lmCapNhat();
    _lmLoi('Ra câu hỏi — nhóm trả lời đúng được mở một mảnh'
        + '<span class="nho">Bấm vào nhóm rồi bấm vào mảnh muốn mở</span>');
    requestAnimationFrame(() => requestAnimationFrame(_lmXepAnh));
    _lmBatNhac();
}

function dongLatManhGhep() {
    _lmDungNhac();
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    document.getElementById('lmGame')?.classList.add('hidden');
    document.getElementById('lmHoi')?.classList.add('hidden');
}
function _lmLoi(h) { const e = document.getElementById('lmLoi'); if (e) e.innerHTML = h; }

// ── Ảnh và các mảnh ghép ─────────────────────────────────────────────────────
function _lmTaoManh() {
    const k = document.getElementById('lmKhung');
    k.innerHTML = `<img id="lmAnhChinh" alt="Ảnh bí mật" src="${_lmAnh.url}">`;
    _lmManh = [];
    for (let h = 0; h < _lmHang; h++) {
        for (let c = 0; c < _lmCot; c++) {
            const i = h * _lmCot + c;
            const el = document.createElement('button');
            el.className = 'lm-o';
            el.textContent = String(i + 1);
            el.setAttribute('aria-label', `Mở mảnh số ${i + 1}`);
            el.style.left   = (c * 100 / _lmCot) + '%';
            el.style.top    = (h * 100 / _lmHang) + '%';
            // chờm thêm 1px cho chắc: làm tròn điểm ảnh có thể để hở kẽ và lộ ảnh
            el.style.width  = `calc(${100 / _lmCot}% + 1px)`;
            el.style.height = `calc(${100 / _lmHang}% + 1px)`;
            el.onclick = () => lmMoManh(i);
            k.appendChild(el);
            _lmManh.push({ mo: false, el });
        }
    }
    _lmXepAnh();
}

// đặt khung ảnh vừa khít chỗ trống, giữ đúng tỉ lệ để mảnh ghép phủ chính xác
function _lmXepAnh() {
    const san = document.querySelector('.lm-san');
    const k = document.getElementById('lmKhung');
    if (!san || !k || !_lmAnh) return;
    const cs = getComputedStyle(san);
    const W = san.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const H = san.clientHeight;
    if (W <= 0 || H <= 0) return;
    const ty = Math.min(W / _lmAnh.w, H / _lmAnh.h);
    const rong = Math.floor(_lmAnh.w * ty), cao = Math.floor(_lmAnh.h * ty);
    // chỉ đổi khi lệch hẳn, tránh tự kích hoạt lại chính mình qua ResizeObserver
    if (Math.abs(k.offsetWidth - rong) < 2 && Math.abs(k.offsetHeight - cao) < 2) return;
    k.style.width  = rong + 'px';
    k.style.height = cao + 'px';
}

function _lmConChe() {
    const con = _lmManh.filter(m => !m.mo).length;
    return _lmManh.length ? con / _lmManh.length : 0;
}
function _lmThuongHienTai() {
    const che = _lmConChe();
    for (const m of LM_THUONG) if (che >= m.che) return m.diem;
    return 1;
}

function _lmCapNhat() {
    const che = _lmConChe();
    const t = document.getElementById('lmThuong');
    if (t) t.textContent = _lmTrangThai === 'XONG'
        ? 'Đã lộ ảnh' : `Đoán trúng lúc này: +${_lmThuongHienTai()} điểm`;
    const c = document.getElementById('lmConChe');
    if (c) c.textContent = `Còn che ${Math.round(che * 100)}% · đã mở `
        + `${_lmManh.filter(m => m.mo).length}/${_lmManh.length} mảnh`;
    const mh = document.getElementById('lmNutMoHet');
    if (mh) mh.disabled = _lmTrangThai === 'XONG' || che === 0;
    const nc = document.getElementById('lmNutCong');
    if (nc) nc.disabled = !_lmDoi.some(d => d.diem > 0);
    _lmVeBang();
}

function _lmVeBang() {
    const o = document.getElementById('lmBang');
    if (!o) return;
    o.innerHTML = _lmDoi.map((d, i) => `
      <div class="lm-the ${_lmDoiMo === i ? 'chon' : ''} ${d.khoa > 0 ? 'khoa' : ''}" id="lmThe${i}">
        <span class="ten">${d.ten}</span>
        <span class="diem">${d.diem || 0} đ</span>
        <span class="hang">
          <button onclick="lmChonMo(${i})" ${_lmTrangThai !== 'CHOI' ? 'disabled' : ''}
                  aria-label="${d.ten} trả lời đúng, được mở mảnh">✅ Mở</button>
          <button class="doan" onclick="lmChotDoan(${i})"
                  ${_lmTrangThai !== 'CHOI' || d.khoa > 0 ? 'disabled' : ''}
                  aria-label="${d.ten} chốt đoán hình">${d.khoa > 0 ? '⏳ ' + d.khoa : '💡 Đoán'}</button>
        </span>
      </div>`).join('');
}

// ── Mở mảnh ──────────────────────────────────────────────────────────────────
function lmChonMo(i) {
    if (_lmTrangThai !== 'CHOI' || !_lmDoi[i]) return;
    _lmDoiMo = (_lmDoiMo === i) ? null : i;
    _lmManh.forEach(m => { if (!m.mo) m.el.classList.toggle('cho', _lmDoiMo !== null); });
    _lmVeBang();
    _lmLoi(_lmDoiMo === null
        ? 'Ra câu hỏi — nhóm trả lời đúng được mở một mảnh<span class="nho">Bấm vào nhóm rồi bấm vào mảnh muốn mở</span>'
        : `${_lmDoi[i].ten} được mở mảnh — bấm vào mảnh muốn lật<span class="nho">Bấm lại vào nhóm để bỏ chọn</span>`);
}

function lmMoManh(i) {
    if (_lmTrangThai !== 'CHOI') return;
    const m = _lmManh[i];
    if (!m || m.mo) return;
    if (_lmDoiMo === null) {
        _lmLoi('Hãy bấm vào nhóm trả lời đúng trước<span class="nho">rồi mới bấm vào mảnh để lật</span>');
        return;
    }
    const d = _lmDoi[_lmDoiMo];
    m.mo = true;
    m.el.classList.add('mo');
    m.el.classList.remove('cho');
    d.diem += LM_MO_MANH;
    _lmTieng('mo');
    // mở thêm mảnh thì các nhóm đang bị khoá cũng gần được đoán lại
    _lmDoi.forEach(x => { if (x.khoa > 0) x.khoa--; });
    _lmDoiMo = null;
    _lmManh.forEach(x => x.el.classList.remove('cho'));
    _lmCapNhat();
    const con = _lmConChe();
    _lmLoi(`${d.ten} mở mảnh số ${i + 1}, +${LM_MO_MANH} điểm`
        + `<span class="nho">${con === 0 ? 'Ảnh đã lộ hết — hãy chốt đoán' : `Đoán trúng lúc này được +${_lmThuongHienTai()} điểm`}</span>`);
}

function lmMoHet() {
    if (_lmTrangThai === 'XONG') return;
    _lmManh.forEach((m, i) => {
        if (m.mo) return;
        setTimeout(() => { m.mo = true; m.el.classList.add('mo'); m.el.classList.remove('cho');
                           _lmTieng('mo'); _lmCapNhat(); }, i * 60);
    });
    setTimeout(() => {
        _lmTrangThai = 'XONG';
        _lmCapNhat();
        _lmLoi(_lmDapAn ? `Đáp án: ${_lmDapAn}` : 'Đã mở hết ảnh');
    }, _lmManh.length * 60 + 250);
}

// ── Chốt đoán ────────────────────────────────────────────────────────────────
function lmChotDoan(i) {
    const d = _lmDoi[i];
    if (_lmTrangThai !== 'CHOI' || !d || d.khoa > 0) return;
    const an = _lmThuongHienTai();
    const hoi = document.getElementById('lmHoi');
    hoi.innerHTML = `
      <div class="lm-hop" role="dialog" aria-label="Chốt đoán">
        <h3>${d.ten} chốt đoán!</h3>
        <p>Cả lớp nghe đáp án của nhóm, thầy cô bấm kết quả</p>
        <span class="cuoc">Trúng: +${an} điểm · Trật: −${LM_PHAT_SAI} điểm</span>
        <div class="hang">
          <button class="lm-dung" onclick="lmKetQuaDoan(${i},true)">✅ Trúng rồi</button>
          <button class="lm-sai" onclick="lmKetQuaDoan(${i},false)">❌ Chưa đúng</button>
          <button class="lm-huy" onclick="lmDongHoi()">Huỷ</button>
        </div>
      </div>`;
    hoi.classList.remove('hidden');
    _lmAmNho(true);
}
function lmDongHoi() {
    document.getElementById('lmHoi')?.classList.add('hidden');
    _lmAmNho(false);
}

function lmKetQuaDoan(i, trung) {
    const d = _lmDoi[i];
    lmDongHoi();
    if (!d) return;
    if (!trung) {
        d.diem = Math.max(0, d.diem - LM_PHAT_SAI);
        d.khoa = LM_KHOA_SAI;
        _lmTieng('sai');
        _lmCapNhat();
        _lmLoi(`❌ ${d.ten} đoán chưa đúng — mất ${LM_PHAT_SAI} điểm`
            + `<span class="nho">Phải chờ mở thêm ${LM_KHOA_SAI} mảnh mới được đoán lại</span>`);
        return;
    }
    const an = _lmThuongHienTai();
    d.diem += an;
    _lmTrangThai = 'XONG';
    _lmTieng('trung');
    _lmManh.forEach((m, k) => {
        if (m.mo) return;
        setTimeout(() => { m.mo = true; m.el.classList.add('mo'); }, k * 45);
    });
    if (typeof confetti === 'function' && !_lmGiam()) {
        confetti({ particleCount: 170, spread: 115, origin: { y: .5 },
                   colors: ['#fbbf24', '#8b5cf6', '#22c55e', '#fff'] });
    }
    setTimeout(() => {
        _lmCapNhat();
        _lmLoi(`🎉 ${d.ten} đoán trúng, +${an} điểm!`
            + `<span class="nho">${_lmDapAn ? 'Đáp án: ' + _lmDapAn : 'Ảnh đã lộ hết'}</span>`);
    }, _lmManh.length * 45 + 200);
}

// ── Cộng điểm vào sổ ─────────────────────────────────────────────────────────
function lmCongDiem() {
    const an = _lmDoi.filter(d => d.diem > 0);
    if (!an.length) {
        if (typeof showToast === 'function') showToast('Chưa đội nào có điểm', 'error');
        return;
    }
    const tom = an.map(d => `${d.ten}: +${d.diem}`).join(', ');
    if (!confirm(`Cộng điểm cho ${an.length} đội?\n\n${tom}`)) return;
    const ghi = []; const now = new Date().toISOString();
    an.forEach(d => {
        d.ids.forEach(sid => {
            const s = students.find(x => x.id === sid);
            if (!s) return;
            const cu = s.points;
            s.points += d.diem; s.positivePoints += d.diem;
            const id = Date.now() + Math.random();
            ghi.push({ lichSuId: id, studentId: s.id, diem: d.diem });
            history.push({ id, classId: currentClassId, studentId: s.id, studentName: s.name,
                           skillName: 'Lật Mảnh Ghép — đoán hình', points: d.diem, timestamp: now });
            if (typeof checkMilestone === 'function') checkMilestone(s, cu);
            if (typeof checkGoalAchievements === 'function') setTimeout(() => checkGoalAchievements(s.id), 100);
        });
    });
    _lmLuu();
    _lmNhatKy = ghi;
    document.getElementById('lmNutHoanTac')?.classList.remove('hidden');
    _lmDoi.forEach(d => { d.diem = 0; });
    _lmCapNhat();
    _lmLoi(`💰 Đã cộng điểm cho ${an.length} đội<span class="nho">${tom}</span>`);
    if (typeof showToast === 'function') showToast('Đã cộng điểm và đồng bộ', 'success');
}

function lmHoanTac() {
    if (!_lmNhatKy || !_lmNhatKy.length) return;
    _lmNhatKy.forEach(g => {
        const s = students.find(x => x.id === g.studentId);
        if (s) { s.points -= g.diem; s.positivePoints -= g.diem; }
        const k = history.findIndex(h => h.id === g.lichSuId);
        if (k > -1) history.splice(k, 1);
    });
    _lmNhatKy = null;
    document.getElementById('lmNutHoanTac')?.classList.add('hidden');
    _lmLuu();
    _lmLoi('↩️ Đã hoàn tác lần cộng điểm vừa rồi');
    if (typeof showToast === 'function') showToast('Đã hoàn tác', 'success');
}

function _lmLuu() {
    if (typeof saveData === 'function') saveData();
    if (typeof scheduleAutoSync === 'function') scheduleAutoSync();
    if (typeof renderStudents === 'function' && typeof currentView !== 'undefined' && currentView === 'classroom') renderStudents();
    else if (typeof renderReport === 'function') renderReport();
}
