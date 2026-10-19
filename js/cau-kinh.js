// ============================================================
// CẦU KÍNH MAY MẮN
// ------------------------------------------------------------
// Một cây cầu kính bắc qua vực. Mỗi nhịp có HAI tấm kính: một tấm chịu được
// lực, một tấm vỡ tan. Nhóm trả lời đúng câu hỏi được quyền bước — chọn tấm
// bên trái hay bên phải.
//
// Bước trúng tấm lành: tiến một nhịp, +1 điểm cho công dò đường.
// Bước trúng tấm vỡ: kính vỡ loảng xoảng, rơi xuống vực, quay về vạch xuất
// phát nhưng GIỮ nguyên số điểm đã kiếm.
//
// Tấm kính đã thử thì lộ cho cả lớp thấy, nhóm sau đi qua vùng đã biết là
// đi tự động — nên ai đi trước chịu rủi ro, ai đi sau hưởng lợi.
// Sang tới bờ bên kia được thêm 5 điểm.
//
// Điểm chỉ vào sổ khi bấm "Kết thúc & cộng điểm", có hoàn tác.
// ============================================================

const CK_SO_NHIP   = [6, 8, 10];
const CK_DIEM_DO   = 1;     // điểm khi dò trúng một tấm kính chưa ai thử
const CK_DIEM_SANG = 5;     // điểm thưởng khi sang tới bờ bên kia
const CK_MAU = ['#f87171', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#f472b6',
                '#22d3ee', '#fb923c', '#4ade80', '#e879f9'];

let _ckNhip   = 8;
let _ckKinh   = [];    // [{ lanh: 0|1, lo: false }]  lanh = tấm nào chịu lực
let _ckDoi    = [];    // [{ id, ten, ids, viTri, diem, sang, mau, el }]
let _ckDangDi = null;  // chỉ số đội đang được bước
let _ckTrangThai = 'CHO';   // CHO | DI | ROI | XONG
let _ckNhatKy = null;
let _ckAmThanh = true;
let _ckNhac   = null;
let _ckChoCham = false;
let _ckAudio  = null;
let _ckHen    = [];
let _ckTheoNhom = true;

function _ckGiam() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
function _ckDatHen(fn, ms) { const t = setTimeout(fn, ms); _ckHen.push(t); return t; }
function _ckHuyHen() { _ckHen.forEach(clearTimeout); _ckHen = []; }

// ── Âm thanh (dùng chung nhạc với Đĩa Bay Gọi Tên) ───────────────────────────
function _ckDsNhac() {
    return (typeof UF_NHAC !== 'undefined' && Array.isArray(UF_NHAC)) ? UF_NHAC : [];
}
function _ckBatNhac() {
    _ckDungNhac();
    if (!_ckAmThanh) return;
    const ds = _ckDsNhac();
    if (!ds.length) return;
    try {
        const a = new Audio(ds[Math.floor(Math.random() * ds.length)]);
        a.loop = true; a.volume = 0.3; a.preload = 'auto';
        a.addEventListener('error', () => { _ckNhac = null; });
        _ckNhac = a;
        _ckThuPhat();
    } catch (e) { _ckNhac = null; }
}
function _ckThuPhat() {
    if (!_ckNhac || !_ckAmThanh) return;
    const hua = _ckNhac.play();
    if (hua && hua.catch) hua.catch(() => {
        if (_ckChoCham) return;
        _ckChoCham = true;
        const lan1 = () => {
            _ckChoCham = false;
            document.getElementById('ckGame')?.removeEventListener('pointerdown', lan1);
            if (_ckDangMo() && _ckAmThanh) _ckNhac?.play().catch(() => {});
        };
        document.getElementById('ckGame')?.addEventListener('pointerdown', lan1);
    });
}
function _ckDungNhac() {
    if (!_ckNhac) return;
    try { _ckNhac.pause(); _ckNhac.currentTime = 0; } catch (e) {}
    _ckNhac = null;
}
function _ckAmNho(nho) { if (_ckNhac) _ckNhac.volume = nho ? 0.1 : 0.3; }

function _ckTieng(kieu) {
    if (!_ckAmThanh) return;
    try {
        if (!_ckAudio) _ckAudio = new (window.AudioContext || window.webkitAudioContext)();
        const ac = _ckAudio;
        if (ac.state === 'suspended') ac.resume();
        const t0 = ac.currentTime;
        if (kieu === 'buoc') {                 // đặt chân lên kính
            const o = ac.createOscillator(), g = ac.createGain();
            o.connect(g); g.connect(ac.destination);
            o.type = 'sine'; o.frequency.setValueAtTime(900, t0);
            o.frequency.exponentialRampToValueAtTime(1400, t0 + .1);
            g.gain.setValueAtTime(.05, t0); g.gain.linearRampToValueAtTime(0, t0 + .14);
            o.start(t0); o.stop(t0 + .15);
        } else if (kieu === 'vo') {            // kính vỡ: nhiều tiếng lanh canh
            for (let i = 0; i < 9; i++) {
                const o = ac.createOscillator(), g = ac.createGain();
                o.connect(g); g.connect(ac.destination);
                o.type = 'triangle';
                o.frequency.value = 1200 + Math.random() * 2600;
                const s = t0 + i * .035;
                g.gain.setValueAtTime(.06, s);
                g.gain.exponentialRampToValueAtTime(.001, s + .22);
                o.start(s); o.stop(s + .24);
            }
            const o2 = ac.createOscillator(), g2 = ac.createGain();  // tiếng rơi
            o2.connect(g2); g2.connect(ac.destination);
            o2.type = 'sawtooth';
            o2.frequency.setValueAtTime(420, t0 + .15);
            o2.frequency.exponentialRampToValueAtTime(60, t0 + 1.1);
            g2.gain.setValueAtTime(.07, t0 + .15);
            g2.gain.linearRampToValueAtTime(0, t0 + 1.2);
            o2.start(t0 + .15); o2.stop(t0 + 1.2);
        } else if (kieu === 'sang') {
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
function _ckDungKieu() {
    if (document.getElementById('ckKieu')) return;
    const st = document.createElement('style');
    st.id = 'ckKieu';
    st.textContent = `
.ck{
  --ck-troi:#020617; --ck-vuc:#0b1220; --ck-xa:#1e293b;
  --ck-chu:#fff; --ck-mo:rgba(255,255,255,.6);
  --ck-kinh:rgba(125,211,252,.33); --ck-vien-kinh:rgba(186,230,253,.75);
  --ck-lanh:#22c55e; --ck-vo:#ef4444; --ck-vang:#fbbf24;
  --ck-mat:rgba(255,255,255,.1); --ck-vien:rgba(255,255,255,.18);
  --ck-r:14px; --ck-r-to:22px; --ck-2:8px; --ck-3:14px; --ck-cham:44px;
  color:var(--ck-chu); font-family:"Be Vietnam Pro",system-ui,sans-serif;
  background:linear-gradient(180deg,var(--ck-troi),var(--ck-xa) 55%,var(--ck-vuc));
  user-select:none;
}
.ck:not(.hidden){display:flex;flex-direction:column}
.ck .hidden{display:none !important}
.ck button:focus-visible{outline:3px solid var(--ck-vang);outline-offset:3px;border-radius:var(--ck-r)}

.ck-bar{display:flex;align-items:center;justify-content:space-between;gap:var(--ck-2);
  padding:var(--ck-2) var(--ck-3);flex-shrink:0;z-index:5}
.ck-bar .giua{flex:1;min-width:0;text-align:center;font-weight:900;
  font-size:clamp(.95rem,2vw,1.5rem);text-shadow:0 2px 8px rgba(0,0,0,.7)}
.ck-ghost{display:inline-flex;align-items:center;justify-content:center;gap:6px;
  min-height:var(--ck-cham);min-width:var(--ck-cham);padding:0 var(--ck-3);border-radius:999px;
  background:var(--ck-mat);color:var(--ck-chu);font-weight:800;font-size:.9rem}
.ck-ghost:hover{background:var(--ck-vien)}
.ck-hide-sm{display:none}
@media(min-width:760px){.ck-hide-sm{display:inline}}

/* sân cầu */
.ck-san{flex:1;min-height:0;position:relative;overflow:hidden}
.ck-bo{position:absolute;left:0;right:0;display:flex;align-items:center;justify-content:flex-start;
  padding-left:clamp(12px,3vw,48px);
  font-weight:900;color:rgba(255,255,255,.75);font-size:clamp(.7rem,1.3vw,1rem);
  letter-spacing:.1em;background:linear-gradient(180deg,#334155,#1e293b);
  border-top:2px solid rgba(255,255,255,.18)}
.ck-bo.dau{bottom:0;height:9%}
.ck-bo.cuoi{top:0;height:8%;background:linear-gradient(180deg,#166534,#14532d)}

.ck-o{position:absolute;border-radius:6px;background:var(--ck-kinh);
  border:2px solid var(--ck-vien-kinh);box-shadow:0 0 18px rgba(125,211,252,.25) inset;
  transition:background .3s,border-color .3s,opacity .5s,transform .5s;cursor:default}
.ck-o.chon{cursor:pointer;animation:ckMoi 1.1s ease-in-out infinite}
.ck-o.chon:hover{background:rgba(251,191,36,.5);border-color:var(--ck-vang)}
@keyframes ckMoi{0%,100%{box-shadow:0 0 0 0 rgba(251,191,36,.6) inset,0 0 10px rgba(251,191,36,.3)}
  50%{box-shadow:0 0 0 5px rgba(251,191,36,.75) inset,0 0 26px rgba(251,191,36,.6)}}
.ck-o.lanh{background:rgba(34,197,94,.42);border-color:#4ade80;box-shadow:none}
.ck-o.vo{opacity:0;transform:scale(.4) rotate(18deg);pointer-events:none}
.ck-o .so{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
  font-weight:900;color:rgba(255,255,255,.5);font-size:clamp(9px,1.1vw,15px)}

/* người chơi */
.ck-nguoi{position:absolute;border-radius:50%;display:flex;align-items:center;justify-content:center;
  font-weight:900;color:#0b1220;border:2px solid rgba(255,255,255,.85);
  box-shadow:0 4px 12px rgba(0,0,0,.6);z-index:3;
  transition:left .45s cubic-bezier(.4,1.2,.5,1),top .45s cubic-bezier(.4,1.2,.5,1),
             width .45s,height .45s,font-size .45s}
.ck-nguoi.roi{transition:top 1s cubic-bezier(.5,0,.9,.6),opacity 1s,transform 1s;
  opacity:0;transform:rotate(540deg) scale(.5);z-index:4}
.ck-nguoi.dang{box-shadow:0 0 0 5px rgba(251,191,36,.6),0 6px 16px rgba(0,0,0,.6);z-index:6}
.ck-manh{position:absolute;width:7px;height:7px;background:rgba(186,230,253,.95);
  border-radius:1px;pointer-events:none;z-index:4}

/* bảng đội */
.ck-bang{flex-shrink:0;display:flex;gap:var(--ck-2);justify-content:center;flex-wrap:wrap;
  padding:var(--ck-2) var(--ck-3)}
.ck-the{display:flex;flex-direction:column;align-items:center;gap:2px;min-width:92px;
  padding:6px 10px;border-radius:var(--ck-r);background:var(--ck-mat);
  border:2px solid var(--ck-vien)}
.ck-the.dang{border-color:var(--ck-vang);background:rgba(251,191,36,.2)}
.ck-the.sang{border-color:var(--ck-lanh);background:rgba(34,197,94,.2)}
.ck-the .ten{font-weight:900;font-size:clamp(.78rem,1.3vw,1rem);white-space:nowrap;
  max-width:26vw;overflow:hidden;text-overflow:ellipsis}
.ck-the .vt{font-weight:700;color:var(--ck-mo);font-size:.72rem}
.ck-the .diem{font-weight:900;color:var(--ck-vang);font-size:clamp(.95rem,1.7vw,1.3rem)}
.ck-the button{min-height:var(--ck-cham);padding:0 12px;border-radius:999px;font-weight:800;
  font-size:.8rem;background:rgba(255,255,255,.16);color:#fff;margin-top:2px}
.ck-the button:hover:not(:disabled){background:var(--ck-vang);color:#2b1a00}
.ck-the button:disabled{opacity:.45;cursor:not-allowed}

.ck-act{flex-shrink:0;display:flex;justify-content:center;gap:var(--ck-3);flex-wrap:wrap;
  padding:0 var(--ck-3) var(--ck-3)}
.ck-nut{display:inline-flex;align-items:center;justify-content:center;gap:var(--ck-2);
  min-height:var(--ck-cham);padding:10px clamp(18px,3.5vw,38px);border-radius:var(--ck-r-to);
  font-weight:900;font-size:clamp(.95rem,1.7vw,1.2rem);transition:transform .15s}
.ck-nut:active{transform:translateY(4px)}
.ck-trai{background:linear-gradient(180deg,#60a5fa,#2563eb);color:#fff;box-shadow:0 6px 0 #1e40af}
.ck-phai{background:linear-gradient(180deg,#f472b6,#db2777);color:#fff;box-shadow:0 6px 0 #9d174d}
.ck-cong{background:linear-gradient(180deg,#fcd34d,#f59e0b);color:#2b1a00;box-shadow:0 6px 0 #b45309}
.ck-phu{background:var(--ck-mat);border:1px solid var(--ck-vien);color:var(--ck-chu)}
.ck-nut:disabled{background:var(--ck-mat);color:var(--ck-mo);box-shadow:none;cursor:not-allowed}
@media(max-width:640px){
  .ck-bar{padding:4px 8px}
  .ck-bar .giua{font-size:.78rem;line-height:1.15;max-height:2.3em;overflow:hidden}
  .ck-nut{padding:7px 12px;font-size:.9rem;box-shadow:0 4px 0 rgba(0,0,0,.35)}
  .ck-act{padding:0 8px 8px;gap:8px}
  .ck-bang{padding:4px 8px;gap:6px}
  /* thẻ đội nằm ngang một dòng cho đỡ chiếm chỗ */
  .ck-the{flex-direction:row;align-items:center;gap:6px;min-width:0;padding:3px 8px;border-width:1px}
  .ck-the .ten{font-size:.75rem;max-width:22vw}
  .ck-the .vt{font-size:.65rem}
  .ck-the .diem{font-size:.85rem}
  .ck-the button{margin-top:0;padding:0 8px;font-size:.7rem;min-height:36px}
  .ck-bo{font-size:.62rem}
}
@media(prefers-reduced-motion:reduce){
  .ck-o,.ck-nguoi{animation:none !important;transition-duration:.01ms !important}
}`;
    document.head.appendChild(st);
}

// ── Dựng khung ───────────────────────────────────────────────────────────────
function _ckDungKhung() {
    if (document.getElementById('ckRoot')) return;
    _ckDungKieu();
    const r = document.createElement('div');
    r.id = 'ckRoot';
    r.innerHTML = `
      <div id="ckSetup" class="fixed inset-0 z-[127] hidden items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
        <div class="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
          <div class="px-6 py-4 border-b flex items-center justify-between flex-shrink-0">
            <div>
              <h2 class="text-2xl font-black text-gray-800">🌉 Cầu Kính May Mắn</h2>
              <p class="text-gray-500 text-sm mt-0.5">Mỗi nhịp hai tấm kính — một tấm lành, một tấm vỡ</p>
            </div>
            <button onclick="closeCkSetup()" aria-label="Đóng" class="text-gray-400 hover:text-gray-700 text-2xl" style="min-width:44px;min-height:44px">&times;</button>
          </div>
          <div class="flex-1 overflow-y-auto p-5 space-y-5">
            <div class="bg-sky-50 border border-sky-200 rounded-2xl p-4 text-sm text-sky-800 font-semibold leading-relaxed">
              Nhóm trả lời đúng được bước một nhịp: chọn tấm bên trái hay bên phải.<br>
              Bước trúng tấm lành thì tiến lên, <b>+${CK_DIEM_DO} điểm công dò đường</b>.<br>
              Bước trúng tấm vỡ thì rơi xuống vực, <b>quay về vạch xuất phát nhưng giữ nguyên điểm</b>.<br>
              Tấm đã thử sẽ lộ cho cả lớp, nhóm sau đi qua vùng đã biết là đi tự động.<br>
              Sang tới bờ bên kia được thêm <b>${CK_DIEM_SANG} điểm</b>.
            </div>
            <div>
              <h3 class="font-black text-gray-800 mb-2">Số nhịp cầu</h3>
              <div id="ckChonNhip" class="flex gap-2 flex-wrap"></div>
            </div>
            <div>
              <h3 class="font-black text-gray-800 mb-2">Ai chơi</h3>
              <div id="ckChonKieu" class="flex gap-2 mb-3 flex-wrap"></div>
              <div id="ckDanhSach" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1"></div>
            </div>
          </div>
          <div class="px-6 py-4 border-t flex items-center justify-between flex-shrink-0 bg-gray-50">
            <span id="ckTomTat" class="text-gray-600 font-bold text-sm"></span>
            <button onclick="batDauCauKinh()" id="ckNutBD"
                    class="bg-sky-600 hover:bg-sky-500 text-white font-black px-7 py-3 rounded-2xl disabled:bg-gray-300" style="min-height:44px">
              <i class="fas fa-play mr-1" aria-hidden="true"></i> Bắt đầu
            </button>
          </div>
        </div>
      </div>

      <div id="ckGame" class="ck fixed inset-0 z-[129] hidden" role="dialog" aria-label="Cầu kính may mắn">
        <header class="ck-bar">
          <button onclick="dongCauKinh()" class="ck-ghost" aria-label="Thoát">
            <i class="fas fa-arrow-left" aria-hidden="true"></i><span class="ck-hide-sm">Thoát</span>
          </button>
          <div class="giua" id="ckLoi" aria-live="polite">Nhóm nào trả lời đúng sẽ được bước</div>
          <div style="display:flex;gap:8px">
            <button onclick="ckHoanTac()" id="ckNutHoanTac" class="ck-ghost hidden" aria-label="Hoàn tác cộng điểm">
              <i class="fas fa-rotate-left" aria-hidden="true"></i></button>
            <button onclick="ckDoiAm()" id="ckNutAm" class="ck-ghost" aria-label="Bật tắt âm thanh">🔊</button>
            <button onclick="ckDoiFull()" class="ck-ghost" aria-label="Toàn màn hình, phím F">
              <i class="fas fa-expand-arrows-alt" aria-hidden="true"></i></button>
          </div>
        </header>

        <div class="ck-san" id="ckSan">
          <div class="ck-bo cuoi">BỜ BÊN KIA · +${CK_DIEM_SANG} ĐIỂM</div>
          <div class="ck-bo dau">VẠCH XUẤT PHÁT</div>
        </div>

        <div class="ck-act" id="ckChonBuoc">
          <button class="ck-nut ck-trai" onclick="ckBuoc(0)" id="ckNutTrai">⬅️ TẤM TRÁI</button>
          <button class="ck-nut ck-phai" onclick="ckBuoc(1)" id="ckNutPhai">TẤM PHẢI ➡️</button>
        </div>

        <div class="ck-bang" id="ckBang"></div>
        <div class="ck-act">
          <button class="ck-nut ck-phu" onclick="ckChoiLai()">🔄 Cầu mới</button>
          <button class="ck-nut ck-cong" onclick="ckCongDiem()" id="ckNutCong">💰 Kết thúc &amp; cộng điểm</button>
        </div>
      </div>`;
    document.body.appendChild(r);
    document.addEventListener('keydown', _ckPhim);
    window.addEventListener('resize', () => { if (_ckDangMo()) _ckVeCau(); });
}

function _ckDangMo() {
    const g = document.getElementById('ckGame');
    return g && !g.classList.contains('hidden');
}
function _ckPhim(e) {
    if (!_ckDangMo()) return;
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
    if (e.key === 'f' || e.key === 'F') { e.preventDefault(); ckDoiFull(); }
    else if (e.key === 'Escape') dongCauKinh();
    else if (e.key === 'ArrowLeft') { e.preventDefault(); ckBuoc(0); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); ckBuoc(1); }
}
function ckDoiFull() {
    const el = document.getElementById('ckGame');
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    else el?.requestFullscreen?.().catch(() => {});
}
function ckDoiAm() {
    _ckAmThanh = !_ckAmThanh;
    const b = document.getElementById('ckNutAm');
    if (b) b.textContent = _ckAmThanh ? '🔊' : '🔇';
    if (!_ckAmThanh) { try { _ckNhac?.pause(); } catch (e) {} }
    else if (_ckNhac) _ckThuPhat();
    else _ckBatNhac();
}

// ── Màn chuẩn bị ─────────────────────────────────────────────────────────────
function openCauKinh() {
    if (!currentClassId) {
        if (typeof showToast === 'function') showToast('Hãy chọn lớp trước', 'error');
        return;
    }
    if (!students.some(s => s.classId === currentClassId)) {
        if (typeof showToast === 'function') showToast('Lớp này chưa có học sinh', 'error');
        return;
    }
    _ckDungKhung();
    _ckVeChonNhip();
    _ckVeChonKieu();
    _ckVeDanhSach();
    const e = document.getElementById('ckSetup');
    e.classList.remove('hidden'); e.classList.add('flex');
}
function closeCkSetup() {
    const e = document.getElementById('ckSetup');
    e.classList.add('hidden'); e.classList.remove('flex');
}
function _ckVeChonNhip() {
    const o = document.getElementById('ckChonNhip');
    if (!o) return;
    o.innerHTML = CK_SO_NHIP.map(n => `
      <button onclick="ckDatNhip(${n})"
        class="px-5 py-2 rounded-xl font-bold text-sm ${_ckNhip === n ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
        style="min-height:44px">${n} nhịp</button>`).join('');
}
function ckDatNhip(n) { _ckNhip = n; _ckVeChonNhip(); _ckTomTat(); }

function _ckCoNhom() {
    return typeof _groupResult !== 'undefined' && Array.isArray(_groupResult)
        && _groupResult.length > 0 && _groupResult.some(g => g && g.length);
}
function _ckVeChonKieu() {
    const o = document.getElementById('ckChonKieu');
    if (!o) return;
    const coNhom = _ckCoNhom();
    if (!coNhom) _ckTheoNhom = false;
    const nut = (nhom, nhan, bat) => `
      <button onclick="ckDoiKieu(${nhom})" ${bat ? '' : 'disabled'}
        class="px-4 py-2 rounded-xl font-bold text-sm ${_ckTheoNhom === nhom
            ? 'bg-sky-600 text-white'
            : bat ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gray-50 text-gray-300 cursor-not-allowed'}"
        style="min-height:44px">${nhan}</button>`;
    o.innerHTML = nut(true, '👥 Theo nhóm', coNhom) + nut(false, '🙋 Từng học sinh', true)
        + (coNhom ? '' : '<span class="text-xs text-gray-400 self-center ml-1">Hãy dùng "Chia nhóm ngẫu nhiên" trước</span>');
}
function ckDoiKieu(n) { _ckTheoNhom = !!n; _ckVeChonKieu(); _ckVeDanhSach(); }

function _ckNguon() {
    const ds = students.filter(s => s.classId === currentClassId)
                       .sort((a, b) => (a.stt || 999) - (b.stt || 999));
    if (_ckTheoNhom && _ckCoNhom()) {
        return _groupResult.map((mems, gi) => ({
            id: 'g' + gi, ten: 'Nhóm ' + (gi + 1),
            ids: mems.map(m => m.id).filter(id => ds.some(s => s.id === id)),
            phu: mems.length + ' bạn'
        })).filter(d => d.ids.length);
    }
    return ds.map(s => ({ id: 's' + s.id, ten: s.name, ids: [s.id], phu: 'STT ' + (s.stt ?? '-') }));
}
function _ckVeDanhSach() {
    const o = document.getElementById('ckDanhSach');
    if (!o) return;
    const nguon = _ckNguon();
    if (!_ckDoi.length || _ckDoi[0]._kieu !== _ckTheoNhom) {
        _ckDoi = nguon.map(d => ({ ...d, _kieu: _ckTheoNhom, chon: true }));
    }
    o.innerHTML = _ckDoi.map((d, i) => `
      <button onclick="ckChonDoi(${i})"
        class="rounded-xl border-2 p-2 text-left ${d.chon ? 'border-sky-500 bg-sky-50' : 'border-gray-200 bg-white opacity-60'}"
        style="min-height:44px">
        <p class="font-bold text-sm text-gray-800 truncate">${d.chon ? '✅ ' : ''}${d.ten}</p>
        <p class="text-[11px] text-gray-500">${d.phu}</p>
      </button>`).join('');
    _ckTomTat();
}
function ckChonDoi(i) { if (_ckDoi[i]) { _ckDoi[i].chon = !_ckDoi[i].chon; _ckVeDanhSach(); } }
function _ckTomTat() {
    const n = _ckDoi.filter(d => d.chon).length;
    const t = document.getElementById('ckTomTat');
    if (t) t.textContent = `${n} ${_ckTheoNhom ? 'nhóm' : 'bạn'} · cầu ${_ckNhip} nhịp · tối đa +${_ckNhip * CK_DIEM_DO + CK_DIEM_SANG} điểm`;
    const b = document.getElementById('ckNutBD');
    if (b) b.disabled = n < 1;
}

// ── Vào trận ─────────────────────────────────────────────────────────────────
function batDauCauKinh() {
    const chon = _ckDoi.filter(d => d.chon);
    if (!chon.length) {
        if (typeof showToast === 'function') showToast('Chọn ít nhất 1 đội chơi', 'error');
        return;
    }
    _ckDoi = chon.map((d, i) => ({ id: d.id, ten: d.ten, ids: [...d.ids],
                                   viTri: 0, diem: 0, sang: false,
                                   mau: CK_MAU[i % CK_MAU.length] }));
    _ckTaoKinh();
    _ckNhatKy = null;
    _ckDangDi = null;
    _ckTrangThai = 'CHO';
    closeCkSetup();
    document.getElementById('ckGame').classList.remove('hidden');
    _ckVeCau();
    _ckVeBang();
    _ckLoi('Ra câu hỏi — bấm vào nhóm trả lời đúng để nhóm đó được bước');
    requestAnimationFrame(() => requestAnimationFrame(_ckVeCau));
    _ckBatNhac();
}
function dongCauKinh() {
    _ckHuyHen();
    _ckDungNhac();
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    document.getElementById('ckGame')?.classList.add('hidden');
}
function _ckLoi(t) { const e = document.getElementById('ckLoi'); if (e) e.textContent = t; }

function _ckTaoKinh() {
    _ckKinh = Array.from({ length: _ckNhip }, () => ({
        lanh: Math.random() < 0.5 ? 0 : 1, lo: false
    }));
}

// ── Vẽ cầu ───────────────────────────────────────────────────────────────────
// Nhìn từ phía sau người chơi: đi từ dưới lên trên, nhịp càng xa càng nhỏ.
function _ckHinhHoc() {
    const san = document.getElementById('ckSan');
    const W = san.clientWidth, H = san.clientHeight;
    const yDau = H * 0.90, yCuoi = H * 0.10;      // trong khoảng hai bờ
    const n = _ckNhip;
    const o = [];
    for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n;                   // 0 gần, 1 xa
        const co = 1 - 0.45 * t;                   // xa thì nhỏ lại
        const cao = ((yDau - yCuoi) / n) * (1 - 0.3 * t);
        const y = yDau - (yDau - yCuoi) * ((i + 0.5) / n);
        // màn hình hẹp thì cầu phải to hơn theo tỉ lệ, không thì tấm kính bé quá
        const goc = W < 760 ? 0.30 : 0.15;
        const rong = W * goc * co;
        const khe  = W * 0.022 * co;
        o.push({ y, rong, cao: Math.min(cao * 0.82, rong * 0.95), khe,
                 xTrai: W / 2 - khe / 2 - rong, xPhai: W / 2 + khe / 2 });
    }
    return { W, H, yDau, o };
}

function _ckVeCau() {
    const san = document.getElementById('ckSan');
    if (!san || !_ckKinh.length) return;
    const hh = _ckHinhHoc();
    san.querySelectorAll('.ck-o').forEach(e => e.remove());
    _ckKinh.forEach((k, i) => {
        const g = hh.o[i];
        [0, 1].forEach(ben => {
            const el = document.createElement('div');
            el.className = 'ck-o';
            el.id = `ckO${i}_${ben}`;
            el.style.left   = (ben === 0 ? g.xTrai : g.xPhai) + 'px';
            el.style.top    = (g.y - g.cao / 2) + 'px';
            el.style.width  = g.rong + 'px';
            el.style.height = g.cao + 'px';
            el.innerHTML = `<span class="so">${i + 1}</span>`;
            if (k.lo) el.classList.add(k.lanh === ben ? 'lanh' : 'vo');
            el.onclick = () => ckBuoc(ben);
            san.appendChild(el);
        });
    });
    _ckVeNguoi();
    _ckMoiChon();
}

function _ckViTriNguoi(d, i, hhCho) {
    const hh = hhCho || _ckHinhHoc();
    const n = _ckDoi.length;
    const lech = (i - (n - 1) / 2) * Math.min(26, hh.W * 0.03);
    const caoBo = hh.o.length ? hh.o[0].cao : 30;
    if (d.sang)  return { x: hh.W / 2 + lech, y: hh.H * 0.042, co: .5, cao: caoBo };
    if (!d.viTri) return { x: hh.W / 2 + lech, y: hh.H * 0.953, co: 1, cao: caoBo };
    const g = hh.o[Math.min(d.viTri - 1, hh.o.length - 1)];
    const k = _ckKinh[Math.min(d.viTri - 1, _ckKinh.length - 1)];
    const x = (k.lanh === 0 ? g.xTrai : g.xPhai) + g.rong / 2 + lech * (g.rong / hh.o[0].rong) * 0.5;
    return { x, y: g.y, co: g.rong / hh.o[0].rong, cao: g.cao };
}

function _ckVeNguoi() {
    const san = document.getElementById('ckSan');
    if (!san) return;
    const hh = _ckHinhHoc();
    _ckDoi.forEach((d, i) => {
        let el = document.getElementById('ckNg' + i);
        if (!el) {
            el = document.createElement('div');
            el.id = 'ckNg' + i;
            el.className = 'ck-nguoi';
            el.style.background = d.mau;
            el.textContent = d.ten.replace(/^Nhóm\s*/i, 'N').slice(0, 3);
            el.title = d.ten;
            san.appendChild(el);
        }
        const v = _ckViTriNguoi(d, i, hh);
        // không để người chơi to hơn tấm kính đang đứng, màn hình nhỏ càng phải chặt
        const cd = Math.max(16, Math.min(44 * v.co, v.cao * 1.15));
        el.style.width = cd + 'px';
        el.style.height = cd + 'px';
        el.style.fontSize = Math.max(9, cd * 0.38) + 'px';
        // giữ người chơi nằm trọn trong sân, màn hình thấp thì bờ rất sát mép
        const W = san.clientWidth, H = san.clientHeight;
        el.style.left = Math.min(W - cd, Math.max(0, v.x - cd / 2)) + 'px';
        el.style.top  = Math.min(H - cd, Math.max(0, v.y - cd / 2)) + 'px';
        el.classList.toggle('dang', _ckDangDi === i);
    });
}

function _ckMoiChon() {
    const dang = _ckDangDi !== null && _ckTrangThai === 'DI' ? _ckDoi[_ckDangDi] : null;
    document.querySelectorAll('.ck-o').forEach(e => e.classList.remove('chon'));
    const co = !!dang && !dang.sang && dang.viTri < _ckNhip && !_ckKinh[dang.viTri].lo;
    if (co) {
        document.getElementById(`ckO${dang.viTri}_0`)?.classList.add('chon');
        document.getElementById(`ckO${dang.viTri}_1`)?.classList.add('chon');
    }
    const ch = document.getElementById('ckChonBuoc');
    if (ch) ch.style.visibility = co ? 'visible' : 'hidden';
}

function _ckVeBang() {
    const o = document.getElementById('ckBang');
    if (!o) return;
    o.innerHTML = _ckDoi.map((d, i) => `
      <div class="ck-the ${_ckDangDi === i ? 'dang' : ''} ${d.sang ? 'sang' : ''}">
        <span class="ten" style="color:${d.mau}">${d.ten}</span>
        <span class="vt">${d.sang ? '🏆 đã sang bờ' : `nhịp ${d.viTri}/${_ckNhip}`}</span>
        <span class="diem">${d.diem} đ</span>
        <button onclick="ckChonDi(${i})" ${d.sang || _ckTrangThai === 'ROI' ? 'disabled' : ''}
                aria-label="${d.ten} trả lời đúng, được bước">✅ Được bước</button>
      </div>`).join('');
    const nc = document.getElementById('ckNutCong');
    if (nc) nc.disabled = !_ckDoi.some(d => d.diem > 0);
}

// ── Lượt đi ──────────────────────────────────────────────────────────────────
function ckChonDi(i) {
    const d = _ckDoi[i];
    if (!d || d.sang || _ckTrangThai === 'ROI') return;
    _ckDangDi = i;
    _ckTrangThai = 'DI';
    // đi tự động qua những nhịp cả lớp đã biết là lành
    let tien = 0;
    while (d.viTri < _ckNhip && _ckKinh[d.viTri].lo) { d.viTri++; tien++; }
    _ckVeNguoi(); _ckMoiChon(); _ckVeBang();
    if (d.viTri >= _ckNhip) { _ckDatHen(() => _ckSangBo(d, i), 600); return; }
    _ckLoi(tien
        ? `${d.ten} đi qua ${tien} nhịp đã biết — giờ chọn tấm kính ở nhịp ${d.viTri + 1}`
        : `${d.ten} chọn tấm kính ở nhịp ${d.viTri + 1}: trái hay phải?`);
    if (tien) _ckTieng('buoc');
}

function ckBuoc(ben) {
    if (_ckTrangThai !== 'DI' || _ckDangDi === null) return;
    const i = _ckDangDi, d = _ckDoi[i];
    if (!d || d.sang || d.viTri >= _ckNhip) return;
    const k = _ckKinh[d.viTri];
    if (k.lo) return;
    const nhip = d.viTri;
    k.lo = true;
    document.querySelectorAll('.ck-o').forEach(e => e.classList.remove('chon'));
    document.getElementById('ckChonBuoc').style.visibility = 'hidden';
    const oTrai = document.getElementById(`ckO${nhip}_0`);
    const oPhai = document.getElementById(`ckO${nhip}_1`);
    (k.lanh === 0 ? oTrai : oPhai)?.classList.add('lanh');
    (k.lanh === 0 ? oPhai : oTrai)?.classList.add('vo');

    if (ben === k.lanh) {                       // bước trúng tấm lành
        d.viTri++;
        d.diem += CK_DIEM_DO;
        _ckTieng('buoc');
        _ckVeNguoi(); _ckVeBang();
        if (d.viTri >= _ckNhip) { _ckDatHen(() => _ckSangBo(d, i), 650); return; }
        _ckTrangThai = 'CHO';
        _ckDangDi = null;
        _ckVeNguoi(); _ckMoiChon(); _ckVeBang();
        _ckLoi(`✅ ${d.ten} đứng vững ở nhịp ${d.viTri}, +${CK_DIEM_DO} điểm — mời nhóm tiếp theo`);
    } else {                                    // kính vỡ
        _ckTrangThai = 'ROI';
        _ckTieng('vo');
        _ckManhVo(ben === 0 ? oTrai : oPhai);
        const el = document.getElementById('ckNg' + i);
        const san = document.getElementById('ckSan');
        if (el) {
            el.classList.add('roi');
            el.style.top = (san.clientHeight + 80) + 'px';
        }
        _ckVeBang();
        _ckLoi(`💥 Tấm kính vỡ! ${d.ten} rơi xuống vực, quay về vạch xuất phát`);
        _ckDatHen(() => {
            d.viTri = 0;
            if (el) { el.classList.remove('roi'); }
            _ckTrangThai = 'CHO';
            _ckDangDi = null;
            _ckVeNguoi(); _ckMoiChon(); _ckVeBang();
            _ckLoi(`${d.ten} đã về vạch xuất phát, vẫn giữ ${d.diem} điểm — mời nhóm tiếp theo`);
        }, _ckGiam() ? 400 : 1500);
    }
}

function _ckManhVo(o) {
    if (!o || _ckGiam()) return;
    const san = document.getElementById('ckSan');
    const r = o.getBoundingClientRect(), rs = san.getBoundingClientRect();
    for (let i = 0; i < 16; i++) {
        const m = document.createElement('i');
        m.className = 'ck-manh';
        m.style.left = (r.left - rs.left + Math.random() * r.width) + 'px';
        m.style.top  = (r.top - rs.top + Math.random() * r.height) + 'px';
        san.appendChild(m);
        const dx = (Math.random() - .5) * 180, dy = 180 + Math.random() * 260;
        m.animate([{ transform: 'translate(0,0) rotate(0)', opacity: 1 },
                   { transform: `translate(${dx}px,${dy}px) rotate(${Math.random() * 720 - 360}deg)`, opacity: 0 }],
                  { duration: 900 + Math.random() * 500, easing: 'cubic-bezier(.4,0,.8,.6)' })
         .onfinish = () => m.remove();
    }
}

function _ckSangBo(d, i) {
    d.sang = true;
    d.diem += CK_DIEM_SANG;
    _ckTrangThai = 'CHO';
    _ckDangDi = null;
    _ckTieng('sang');
    _ckVeNguoi(); _ckMoiChon(); _ckVeBang();
    if (typeof confetti === 'function' && !_ckGiam()) {
        confetti({ particleCount: 150, spread: 110, origin: { y: .35 },
                   colors: ['#22c55e', '#fbbf24', '#60a5fa', '#fff'] });
    }
    _ckLoi(`🏆 ${d.ten} đã sang tới bờ bên kia, +${CK_DIEM_SANG} điểm!`);
    if (_ckDoi.every(x => x.sang)) {
        _ckTrangThai = 'XONG';
        _ckLoi('🎉 Cả lớp đã sang bờ — bấm "Cầu mới" để chơi tiếp');
    }
}

function ckChoiLai() {
    _ckHuyHen();
    _ckTaoKinh();
    _ckDoi.forEach(d => { d.viTri = 0; d.sang = false; });
    _ckDangDi = null;
    _ckTrangThai = 'CHO';
    document.getElementById('ckSan')?.querySelectorAll('.ck-nguoi').forEach(e => e.remove());
    _ckVeCau(); _ckVeBang();
    _ckLoi('Cầu mới đã dựng xong — các tấm kính đã xáo lại');
}

// ── Cộng điểm ────────────────────────────────────────────────────────────────
function ckCongDiem() {
    const an = _ckDoi.filter(d => d.diem > 0);
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
                           skillName: 'Cầu Kính May Mắn', points: d.diem, timestamp: now });
            if (typeof checkMilestone === 'function') checkMilestone(s, cu);
            if (typeof checkGoalAchievements === 'function') setTimeout(() => checkGoalAchievements(s.id), 100);
        });
    });
    _ckLuu();
    _ckNhatKy = ghi;
    document.getElementById('ckNutHoanTac')?.classList.remove('hidden');
    _ckDoi.forEach(d => { d.diem = 0; });
    _ckVeBang();
    _ckLoi(`💰 Đã cộng điểm cho ${an.length} đội — ${tom}`);
    if (typeof showToast === 'function') showToast('Đã cộng điểm và đồng bộ', 'success');
}
function ckHoanTac() {
    if (!_ckNhatKy || !_ckNhatKy.length) return;
    _ckNhatKy.forEach(g => {
        const s = students.find(x => x.id === g.studentId);
        if (s) { s.points -= g.diem; s.positivePoints -= g.diem; }
        const k = history.findIndex(h => h.id === g.lichSuId);
        if (k > -1) history.splice(k, 1);
    });
    _ckNhatKy = null;
    document.getElementById('ckNutHoanTac')?.classList.add('hidden');
    _ckLuu();
    _ckLoi('↩️ Đã hoàn tác lần cộng điểm vừa rồi');
    if (typeof showToast === 'function') showToast('Đã hoàn tác', 'success');
}
function _ckLuu() {
    if (typeof saveData === 'function') saveData();
    if (typeof scheduleAutoSync === 'function') scheduleAutoSync();
    if (typeof renderStudents === 'function' && typeof currentView !== 'undefined' && currentView === 'classroom') renderStudents();
    else if (typeof renderReport === 'function') renderReport();
}
