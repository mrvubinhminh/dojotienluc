// ============================================================
// ĐĨA BAY GỌI TÊN — mỗi học sinh là một con bò trên đồng
// ------------------------------------------------------------
// Cả lớp hiện thành đàn bò đang gặm cỏ, mỗi con mang ảnh, số thứ tự và tên
// của một bạn. Bấm "Quét tìm bò", đĩa bay lượn một vòng rọi đèn qua từng con
// rồi hút một bạn lên — đó là bạn được gọi lên bảng.
//
// Bạn đã được gọi sẽ rời đồng và nằm ở mục "ĐÃ LÊN BẢNG", nên lượt sau chỉ
// gọi những bạn chưa lên, cả lớp ai cũng tới lượt. Bấm vào tên trong mục đó
// để thả bạn ấy về đồng.
//
// Giao diện tự dựng trong file này, không phụ thuộc file khác.
// ============================================================

const UF_TOC_DO = [1, 1.5, 2];

let _ufBo       = [];      // [{ id, ten, stt, anh, x, y, dx, dy, nghi, lat, el, ... }]
let _ufDaGoi    = [];      // [{ id, ten, stt, anh }]
let _ufTocDo    = 1;
let _ufHienTen  = true;
let _ufAmThanh  = true;
let _ufTrangThai = 'CHO';  // CHO | QUET | HUT | HIEN
let _ufRaf      = null;
let _ufT        = 0;
let _ufUfo      = { x: 0.5, y: 0.22, muc: 0.5 };
let _ufMoi      = null;    // con bò đang bị nhắm
let _ufHenGio   = [];
let _ufAudio    = null;

function _ufGiam() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
function _ufHen(fn, ms) { const t = setTimeout(fn, ms / _ufTocDo); _ufHenGio.push(t); return t; }
function _ufHuyHen() { _ufHenGio.forEach(clearTimeout); _ufHenGio = []; }

// ── Âm thanh tự tổng hợp, không tải file ngoài ───────────────────────────────
function _ufTieng(kieu) {
    if (!_ufAmThanh) return;
    try {
        if (!_ufAudio) _ufAudio = new (window.AudioContext || window.webkitAudioContext)();
        const ac = _ufAudio;
        if (ac.state === 'suspended') ac.resume();
        const t0 = ac.currentTime;
        const o = ac.createOscillator(), g = ac.createGain();
        o.connect(g); g.connect(ac.destination);
        if (kieu === 'quet') {                 // tiếng rà quét lên xuống
            o.type = 'sine';
            o.frequency.setValueAtTime(320, t0);
            o.frequency.linearRampToValueAtTime(740, t0 + .5);
            o.frequency.linearRampToValueAtTime(320, t0 + 1);
            g.gain.setValueAtTime(.05, t0);
            g.gain.linearRampToValueAtTime(0, t0 + 1);
            o.start(t0); o.stop(t0 + 1);
        } else if (kieu === 'hut') {           // tiếng hút bò lên
            o.type = 'sawtooth';
            o.frequency.setValueAtTime(180, t0);
            o.frequency.exponentialRampToValueAtTime(1200, t0 + 1.1);
            g.gain.setValueAtTime(.09, t0);
            g.gain.linearRampToValueAtTime(0, t0 + 1.2);
            o.start(t0); o.stop(t0 + 1.2);
        } else if (kieu === 'hien') {          // hợp âm reo vui khi lộ tên
            [523, 659, 784, 1047].forEach((f, i) => {
                const oo = ac.createOscillator(), gg = ac.createGain();
                oo.connect(gg); gg.connect(ac.destination);
                oo.type = 'triangle';
                oo.frequency.value = f;
                const s = t0 + i * .09;
                gg.gain.setValueAtTime(0, s);
                gg.gain.linearRampToValueAtTime(.12, s + .03);
                gg.gain.exponentialRampToValueAtTime(.001, s + .55);
                oo.start(s); oo.stop(s + .6);
            });
            o.disconnect(); g.disconnect();
        } else if (kieu === 'tha') {           // tiếng thả bò về đồng
            o.type = 'sine';
            o.frequency.setValueAtTime(700, t0);
            o.frequency.exponentialRampToValueAtTime(260, t0 + .35);
            g.gain.setValueAtTime(.07, t0);
            g.gain.linearRampToValueAtTime(0, t0 + .4);
            o.start(t0); o.stop(t0 + .4);
        }
    } catch (e) { /* trình duyệt chặn âm thanh thì thôi */ }
}

// ── Kiểu dáng ────────────────────────────────────────────────────────────────
function _ufDungKieu() {
    if (document.getElementById('ufKieu')) return;
    const st = document.createElement('style');
    st.id = 'ufKieu';
    st.textContent = `
.uf{
  --uf-troi-1:#0b1033; --uf-troi-2:#1e1b4b; --uf-troi-3:#312e81;
  --uf-co-1:#2f9e44; --uf-co-2:#1e7a33;
  --uf-chu:#fff; --uf-mo:rgba(255,255,255,.65);
  --uf-vang:#fbbf24; --uf-mat:rgba(255,255,255,.1); --uf-vien:rgba(255,255,255,.18);
  --uf-r:14px; --uf-r-to:22px; --uf-1:4px; --uf-2:8px; --uf-3:14px; --uf-cham:44px;
  color:var(--uf-chu); font-family:"Be Vietnam Pro",system-ui,sans-serif;
  overflow:hidden; user-select:none;
}
.uf .hidden{display:none !important}
.uf button:focus-visible{outline:3px solid var(--uf-vang);outline-offset:3px;border-radius:var(--uf-r)}

/* ── nền: trời đêm, trăng, sao, đồng cỏ, hàng rào ── */
/* z-index:1 để các con bò xếp lớp bên trong cảnh, không trồi lên che thẻ công bố */
.uf-canh{position:absolute;inset:0;z-index:1;isolation:isolate}
.uf-troi{position:absolute;left:0;right:0;top:0;height:56%;
  background:linear-gradient(180deg,var(--uf-troi-1),var(--uf-troi-2) 60%,var(--uf-troi-3))}
.uf-sao{position:absolute;border-radius:50%;background:#fff;opacity:.85}
.uf-trang{position:absolute;right:7%;top:16%;width:clamp(56px,7vw,110px);aspect-ratio:1;border-radius:50%;
  background:radial-gradient(circle at 36% 34%,#fffbe8,#fde68a 62%,#facc15);
  box-shadow:0 0 60px rgba(253,230,138,.45)}
.uf-trang i{position:absolute;border-radius:50%;background:rgba(0,0,0,.07)}
.uf-dong{position:absolute;left:0;right:0;bottom:0;height:46%;
  background:linear-gradient(180deg,var(--uf-co-1),var(--uf-co-2))}
.uf-dong::before{content:"";position:absolute;left:0;right:0;top:0;height:30%;
  background:linear-gradient(180deg,rgba(255,255,255,.12),transparent)}
.uf-rao{position:absolute;left:0;right:0;bottom:46%;height:clamp(22px,3.4vh,40px)}

/* ── đĩa bay ── */
.uf-dia{position:absolute;left:0;top:0;width:clamp(120px,15vw,250px);
  transform-origin:50% 50%;will-change:transform;z-index:3}
.uf-dia svg{display:block;width:100%;height:auto;filter:drop-shadow(0 8px 18px rgba(0,0,0,.5))}
.uf-den{position:absolute;left:50%;top:76%;transform-origin:50% 0;z-index:2;
  width:clamp(90px,11vw,180px);pointer-events:none;will-change:transform,opacity}
.uf-den i{display:block;width:100%;height:100%;
  background:linear-gradient(180deg,rgba(253,230,138,.55),rgba(190,242,100,.1) 70%,transparent);
  clip-path:polygon(38% 0,62% 0,100% 100%,0 100%)}

/* ── con bò ── */
.uf-bo{position:absolute;left:0;top:0;width:var(--uf-bo-w,150px);
  transform-origin:50% 100%;will-change:transform;transition:opacity .3s}
.uf-bo.sang .uf-than{filter:drop-shadow(0 0 16px rgba(253,230,138,.95)) brightness(1.18)}
.uf-bo.chon{z-index:4}
.uf-than{position:relative;width:100%}
.uf-bo.trai .uf-than svg{transform:scaleX(-1)}
.uf-bo.trai .uf-mat{left:-2%}
.uf-than svg{display:block;width:100%;height:auto;filter:drop-shadow(0 6px 8px rgba(0,0,0,.35))}
.uf-mat{position:absolute;left:62%;top:3%;width:40%;aspect-ratio:1;border-radius:50%;
  object-fit:cover;background:#e5e7eb;border:3px solid var(--uf-vang);box-shadow:0 2px 6px rgba(0,0,0,.4)}
.uf-chuDau{display:flex;align-items:center;justify-content:center;background:#c7d2fe;color:#312e81;
  font-weight:900;font-size:clamp(11px,1.4vw,22px)}
.uf-ten{position:absolute;left:50%;top:100%;transform:translateX(-50%);margin-top:2px;
  background:#fff;color:#111827;font-weight:800;border-radius:999px;padding:2px 10px;
  font-size:clamp(11px,1.05vw,17px);white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.35)}
.uf-ten b{color:#7c3aed;margin-right:3px}
.uf-an-ten .uf-ten{display:none}

/* ── thanh trên và dưới ── */
.uf-tren{position:absolute;left:0;right:0;top:0;z-index:6;display:flex;gap:var(--uf-2);
  align-items:flex-start;justify-content:space-between;padding:var(--uf-2) var(--uf-3);flex-wrap:wrap}
.uf-hop{background:rgba(10,14,40,.62);backdrop-filter:blur(6px);border:1px solid var(--uf-vien);
  border-radius:var(--uf-r-to);padding:var(--uf-2) var(--uf-3);max-width:min(58vw,560px)}
.uf-lop{display:flex;align-items:center;gap:var(--uf-2);flex-wrap:wrap}
.uf-the-lop{background:var(--uf-vang);color:#2b1a00;font-weight:900;border-radius:999px;
  padding:3px 12px;font-size:.95rem}
.uf-dem{font-weight:700;color:var(--uf-mo);font-size:.9rem}
.uf-ds{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;max-height:19vh;overflow-y:auto}
.uf-ds .nhan{width:100%;font-size:.7rem;font-weight:900;letter-spacing:.06em;color:var(--uf-mo)}
.uf-chip{display:inline-flex;align-items:center;gap:6px;background:var(--uf-mat);
  border:1px solid var(--uf-vien);border-radius:999px;padding:3px 10px 3px 3px;
  font-weight:800;font-size:.85rem;min-height:32px}
.uf-chip:hover{background:rgba(251,191,36,.25);border-color:var(--uf-vang)}
.uf-chip img{width:26px;height:26px;border-radius:50%;object-fit:cover;background:#e5e7eb}
.uf-dieu{display:flex;gap:var(--uf-2);flex-wrap:wrap;justify-content:flex-end}
.uf-nut-nho{background:rgba(10,14,40,.62);backdrop-filter:blur(6px);border:1px solid var(--uf-vien);
  border-radius:999px;padding:0 var(--uf-3);min-height:var(--uf-cham);min-width:var(--uf-cham);
  color:var(--uf-chu);font-weight:800;font-size:.9rem}
.uf-nut-nho:hover{background:rgba(251,191,36,.22)}
.uf-tieu{position:absolute;left:50%;top:var(--uf-2);transform:translateX(-50%);z-index:5;
  font-weight:900;color:var(--uf-vang);text-align:center;pointer-events:none;
  font-size:clamp(1rem,2.4vw,2rem);text-shadow:0 3px 10px rgba(0,0,0,.6);max-width:40vw}
.uf-duoi{position:absolute;left:0;right:0;bottom:0;z-index:6;display:flex;gap:var(--uf-3);
  justify-content:center;align-items:center;padding:var(--uf-3);flex-wrap:wrap;
  background:linear-gradient(0deg,rgba(5,20,8,.75),transparent)}
.uf-nut{display:inline-flex;align-items:center;justify-content:center;gap:var(--uf-2);
  min-height:var(--uf-cham);padding:var(--uf-3) clamp(20px,4vw,44px);border-radius:var(--uf-r-to);
  font-weight:900;font-size:clamp(1rem,2vw,1.4rem);transition:transform .15s ease-out}
.uf-nut:active{transform:translateY(4px)}
.uf-quet{background:linear-gradient(180deg,#a3e635,#65a30d);color:#17270a;box-shadow:0 7px 0 #3f6212}
.uf-nut:disabled{background:var(--uf-mat);color:var(--uf-mo);box-shadow:none;cursor:not-allowed}
.uf-phu{background:rgba(10,14,40,.62);border:1px solid var(--uf-vien);color:var(--uf-chu);
  box-shadow:none;font-size:clamp(.9rem,1.5vw,1.1rem)}

/* ── thẻ công bố ── */
.uf-ket{position:absolute;inset:0;z-index:8;display:flex;align-items:center;justify-content:center;
  background:rgba(5,8,26,.72);backdrop-filter:blur(5px);padding:var(--uf-3)}
.uf-the{background:linear-gradient(180deg,#fffbeb,#fde68a);color:#1f2937;border-radius:28px;
  padding:clamp(16px,3vw,34px);text-align:center;box-shadow:0 24px 60px rgba(0,0,0,.6);
  max-width:min(92vw,560px);animation:ufHienThe .45s cubic-bezier(.2,1.4,.5,1)}
@keyframes ufHienThe{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}
.uf-the img,.uf-the .uf-thay{width:clamp(96px,16vw,180px);aspect-ratio:1;border-radius:50%;
  object-fit:cover;background:#fff;border:6px solid #f59e0b;box-shadow:0 8px 20px rgba(0,0,0,.3)}
.uf-the .uf-thay{display:inline-flex;align-items:center;justify-content:center;color:#7c3aed;
  font-weight:900;font-size:clamp(44px,7vw,84px);background:#ede9fe}
.uf-the .stt{display:inline-block;margin-top:10px;background:#7c3aed;color:#fff;font-weight:900;
  border-radius:999px;padding:3px 16px;font-size:clamp(.9rem,1.6vw,1.2rem)}
.uf-the .ho{font-weight:900;line-height:1.1;margin:6px 0 2px;
  font-size:clamp(1.8rem,6vw,4.2rem)}
.uf-the .loi{font-weight:700;color:#92400e;font-size:clamp(.9rem,1.6vw,1.15rem)}
.uf-the .hang{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:16px}
.uf-the button{min-height:var(--uf-cham);padding:0 18px;border-radius:var(--uf-r-to);font-weight:900;
  font-size:clamp(.9rem,1.5vw,1.1rem)}
.uf-ok{background:#16a34a;color:#fff}
.uf-diem{background:#7c3aed;color:#fff}
.uf-lai{background:rgba(0,0,0,.1);color:#374151}
@media(max-width:640px){
  .uf-nut-nho .dai,.uf-nut .dai{display:none}
  .uf-nut-nho{padding:0 10px;font-size:.85rem}
  .uf-hop{max-width:62vw;padding:6px 10px}
  .uf-tieu{display:none}
  .uf-duoi{padding:8px;gap:8px}
  .uf-nut{padding:10px 16px;font-size:1rem}
}
@media(prefers-reduced-motion:reduce){
  .uf-the{animation:none}
}`;
    document.head.appendChild(st);
}

// chữ cái đầu của tên gọi, dùng khi học sinh chưa có ảnh đại diện
function _ufChuDau(ten) {
    return (ten || '?').trim().split(/\s+/).pop().charAt(0).toUpperCase();
}

// ── Hình vẽ ──────────────────────────────────────────────────────────────────
function _ufHinhBo() {
    return `<svg viewBox="0 0 150 112" aria-hidden="true">
      <path d="M24 56 C8 52 10 30 22 28" fill="none" stroke="#111827" stroke-width="5" stroke-linecap="round"/>
      <circle cx="22" cy="27" r="5" fill="#111827"/>
      <g fill="#fff" stroke="#111827" stroke-width="4" stroke-linejoin="round">
        <rect x="34" y="74" width="13" height="30" rx="6"/>
        <rect x="55" y="76" width="13" height="30" rx="6"/>
        <rect x="80" y="76" width="13" height="30" rx="6"/>
        <rect x="101" y="74" width="13" height="30" rx="6"/>
      </g>
      <g fill="#111827">
        <rect x="34" y="96" width="13" height="9" rx="4"/>
        <rect x="55" y="98" width="13" height="9" rx="4"/>
        <rect x="80" y="98" width="13" height="9" rx="4"/>
        <rect x="101" y="96" width="13" height="9" rx="4"/>
      </g>
      <ellipse cx="74" cy="56" rx="50" ry="30" fill="#fff" stroke="#111827" stroke-width="4"/>
      <ellipse cx="56" cy="46" rx="13" ry="10" fill="#111827"/>
      <ellipse cx="92" cy="64" rx="11" ry="8" fill="#111827"/>
      <ellipse cx="46" cy="68" rx="7" ry="5" fill="#111827"/>
      <ellipse cx="74" cy="83" rx="13" ry="6" fill="#f9a8d4" stroke="#111827" stroke-width="2.5"/>
      <ellipse cx="104" cy="34" rx="9" ry="7" fill="#f9a8d4" stroke="#111827" stroke-width="3"/>
      <ellipse cx="140" cy="34" rx="9" ry="7" fill="#f9a8d4" stroke="#111827" stroke-width="3"/>
      <path d="M112 16 q-3 -10 4 -13" fill="none" stroke="#d9f99d" stroke-width="5" stroke-linecap="round"/>
      <path d="M132 16 q3 -10 -4 -13" fill="none" stroke="#d9f99d" stroke-width="5" stroke-linecap="round"/>
    </svg>`;
}

function _ufHinhDia() {
    return `<svg viewBox="0 0 260 150" aria-hidden="true">
      <ellipse cx="130" cy="96" rx="34" ry="12" fill="#fde68a" opacity=".9"/>
      <path d="M58 76 q72 -34 144 0 q-22 26 -72 26 q-50 0 -72 -26z" fill="#cbd5e1"/>
      <ellipse cx="130" cy="76" rx="72" ry="22" fill="#e2e8f0" stroke="#94a3b8" stroke-width="3"/>
      <path d="M86 60 q44 -42 88 0 q-44 16 -88 0z" fill="#93c5fd" opacity=".95"/>
      <ellipse cx="130" cy="58" rx="44" ry="26" fill="#bfdbfe" opacity=".55"/>
      <ellipse cx="130" cy="60" rx="17" ry="13" fill="#4ade80"/>
      <circle cx="123" cy="58" r="3.4" fill="#064e3b"/><circle cx="137" cy="58" r="3.4" fill="#064e3b"/>
      <path d="M122 67 q8 6 16 0" fill="none" stroke="#064e3b" stroke-width="2.6" stroke-linecap="round"/>
      <g class="uf-bong">
        <circle cx="74"  cy="80" r="7" fill="#f9a8d4"/>
        <circle cx="102" cy="86" r="7" fill="#fde68a"/>
        <circle cx="130" cy="88" r="7" fill="#a7f3d0"/>
        <circle cx="158" cy="86" r="7" fill="#fde68a"/>
        <circle cx="186" cy="80" r="7" fill="#f9a8d4"/>
      </g>
    </svg>`;
}

function _ufHinhRao() {
    return `<svg viewBox="0 0 1200 48" preserveAspectRatio="none" aria-hidden="true">
      <rect x="0" y="12" width="1200" height="8" fill="#a16207"/>
      <rect x="0" y="30" width="1200" height="8" fill="#a16207"/>
      ${Array.from({ length: 25 }, (_, i) =>
        `<rect x="${i * 50 + 6}" y="2" width="11" height="44" rx="3" fill="#ca8a04"/>`).join('')}
    </svg>`;
}

// ── Dựng khung ───────────────────────────────────────────────────────────────
function _ufDungKhung() {
    if (document.getElementById('ufGame')) return;
    _ufDungKieu();
    const d = document.createElement('div');
    d.id = 'ufGame';
    d.className = 'uf fixed inset-0 z-[129] hidden';
    d.setAttribute('role', 'dialog');
    d.setAttribute('aria-label', 'Đĩa bay gọi tên');
    d.innerHTML = `
      <div class="uf-canh" id="ufCanh">
        <div class="uf-troi" id="ufTroi">
          <div class="uf-trang"><i style="left:28%;top:30%;width:22%;height:22%"></i>
            <i style="left:56%;top:52%;width:16%;height:16%"></i>
            <i style="left:34%;top:64%;width:12%;height:12%"></i></div>
        </div>
        <div class="uf-rao">${_ufHinhRao()}</div>
        <div class="uf-dong"></div>
        <div class="uf-den" id="ufDen"><i></i></div>
        <div class="uf-dia" id="ufDia">${_ufHinhDia()}</div>
      </div>

      <h2 class="uf-tieu" id="ufTieu">Đĩa bay đang lượn tìm bò…</h2>

      <div class="uf-tren">
        <div class="uf-hop">
          <div class="uf-lop">
            <span class="uf-the-lop" id="ufTenLop">Lớp</span>
            <span class="uf-dem" id="ufDemBo"></span>
          </div>
          <div class="uf-ds" id="ufDaGoi"></div>
        </div>
        <div class="uf-dieu">
          <button class="uf-nut-nho" onclick="ufDoiTocDo()" id="ufNutTocDo"
                  aria-label="Đổi tốc độ"><span class="dai">Tốc độ </span>×1</button>
          <button class="uf-nut-nho" onclick="ufDoiTen()" id="ufNutTen"
                  aria-label="Bật tắt tên trên lưng bò">Tên<span class="dai">: hiện</span></button>
          <button class="uf-nut-nho" onclick="ufDoiAm()" id="ufNutAm"
                  aria-label="Bật tắt âm thanh">🔊<span class="dai"> bật</span></button>
          <button class="uf-nut-nho" onclick="ufDoiFull()" aria-label="Toàn màn hình, phím F">
            <i class="fas fa-expand-arrows-alt" aria-hidden="true"></i></button>
          <button class="uf-nut-nho" onclick="dongUfoGoiTen()">Về chuồng</button>
        </div>
      </div>

      <div class="uf-duoi">
        <button class="uf-nut uf-quet" id="ufNutQuet" onclick="ufQuet()">🛸 QUÉT TÌM BÒ</button>
        <button class="uf-nut uf-phu" id="ufNutThaHet" onclick="ufThaHet()"
                aria-label="Thả hết bò ra đồng, gọi lại từ đầu">🐄 Thả hết<span class="dai"> bò ra đồng</span></button>
      </div>

      <div class="uf-ket hidden" id="ufKet"></div>`;
    document.body.appendChild(d);
    document.addEventListener('keydown', _ufPhim);
    window.addEventListener('resize', () => { if (_ufDangMo()) { _ufRaiSao(); _ufCoBo(); } });
}

function _ufDangMo() {
    const g = document.getElementById('ufGame');
    return g && !g.classList.contains('hidden');
}
function _ufPhim(e) {
    if (!_ufDangMo()) return;
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
    if (e.key === 'f' || e.key === 'F') { e.preventDefault(); ufDoiFull(); }
    else if (e.key === 'Escape') dongUfoGoiTen();
    else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); ufQuet(); }
}
function ufDoiFull() {
    const el = document.getElementById('ufGame');
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    else el?.requestFullscreen?.().catch(() => {});
}

// ── Sao trên trời ────────────────────────────────────────────────────────────
function _ufRaiSao() {
    const troi = document.getElementById('ufTroi');
    if (!troi) return;
    troi.querySelectorAll('.uf-sao').forEach(e => e.remove());
    const n = Math.round(Math.min(150, Math.max(50, window.innerWidth / 11)));
    const f = document.createDocumentFragment();
    for (let i = 0; i < n; i++) {
        const s = document.createElement('span');
        s.className = 'uf-sao';
        const r = 1 + Math.random() * 2.2;
        s.style.cssText = `left:${(Math.random() * 100).toFixed(2)}%;top:${(Math.random() * 94).toFixed(2)}%;`
            + `width:${r.toFixed(1)}px;height:${r.toFixed(1)}px;opacity:${(.35 + Math.random() * .6).toFixed(2)}`;
        f.appendChild(s);
    }
    troi.appendChild(f);
}

// ── Mở trò chơi ──────────────────────────────────────────────────────────────
function openUfoGoiTen() {
    if (!currentClassId) {
        if (typeof showToast === 'function') showToast('Hãy chọn lớp trước', 'error');
        return;
    }
    const ds = students.filter(s => s.classId === currentClassId)
                       .sort((a, b) => (a.stt || 999) - (b.stt || 999));
    if (!ds.length) {
        if (typeof showToast === 'function') showToast('Lớp này chưa có học sinh', 'error');
        return;
    }
    _ufDungKhung();
    _ufDaGoi = [];
    _ufTrangThai = 'CHO';
    _ufMoi = null;
    const lop = (classes || []).find(c => c.id === currentClassId);
    const tl = document.getElementById('ufTenLop');
    if (tl) tl.textContent = lop ? lop.name : 'Lớp';

    const g = document.getElementById('ufGame');
    g.classList.remove('hidden');
    _ufRaiSao();
    _ufTaoBo(ds);
    _ufVeDaGoi();
    _ufLoi('Đĩa bay đang lượn tìm bò…');
    _ufChay();
}

function dongUfoGoiTen() {
    _ufHuyHen();
    _ufDungChay();
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    document.getElementById('ufGame')?.classList.add('hidden');
    document.getElementById('ufKet')?.classList.add('hidden');
}

function _ufLoi(t) { const e = document.getElementById('ufTieu'); if (e) e.textContent = t; }

// ── Đàn bò ───────────────────────────────────────────────────────────────────
function _ufTaoBo(ds) {
    const canh = document.getElementById('ufCanh');
    canh.querySelectorAll('.uf-bo').forEach(e => e.remove());
    _ufBo = ds.map((s, i) => {
        const el = document.createElement('div');
        el.className = 'uf-bo';
        const chuDau = _ufChuDau(s.name);
        el.innerHTML = `<div class="uf-than">${_ufHinhBo()}
            <span class="uf-mat uf-chuDau">${chuDau}</span>
            ${s.avatar ? `<img class="uf-mat" alt="" src="${s.avatar}"
                 onerror="this.remove()">` : ''}</div>
          <span class="uf-ten"><b>${s.stt ?? '?'}</b>${s.name}</span>`;
        canh.appendChild(el);
        // rải đều ra đồng rồi cho lệch ngẫu nhiên một chút cho tự nhiên
        const cot = Math.ceil(Math.sqrt(ds.length * 1.9));
        const hang = Math.ceil(ds.length / cot);
        const c = i % cot, h = Math.floor(i / cot);
        // mỗi con có một ô riêng và chỉ đi quanh quẩn trong ô đó, nhờ vậy cả đàn
        // trải đều khắp đồng thay vì dồn hết vào giữa
        const hx = (c + .5) / cot, hy = (h + .5) / hang;
        return {
            id: s.id, ten: s.name, stt: s.stt, anh: s.avatar || '', el,
            than: el.querySelector('.uf-than'),
            hx, hy, bkx: .42 / cot, bky: .42 / hang,
            x: hx, y: hy,
            nghi: Math.random() * 240, lat: Math.random() < .5 ? -1 : 1,
            mx: hx, my: hy, len: 0
        };
    });
    _ufBo.forEach(b => _ufDiemMoi(b));
    _ufCoBo();
    _ufDemLai();
}

// cỡ con bò nhỏ dần khi lớp đông để không chồng lên nhau
function _ufCoBo() {
    const canh = document.getElementById('ufCanh');
    if (!canh) return;
    const n = Math.max(1, _ufBo.length);
    const w = canh.clientWidth || window.innerWidth;
    const co = Math.max(68, Math.min(190, (w * 0.72) / Math.sqrt(n * 1.9)));
    canh.style.setProperty('--uf-bo-w', Math.round(co) + 'px');
}

function _ufDiemMoi(b) {
    b.mx = Math.min(.96, Math.max(.04, b.hx + (Math.random() * 2 - 1) * b.bkx));
    b.my = Math.min(.95, Math.max(.05, b.hy + (Math.random() * 2 - 1) * b.bky));
    b.nghi = 40 + Math.random() * 200;
}

function _ufViTri(b) {
    const canh = document.getElementById('ufCanh');
    if (!canh || !b.el) return;
    const W = canh.clientWidth, H = canh.clientHeight;
    const duoi = document.querySelector('.uf-duoi');
    const dayTren = H * 0.58;                            // mép trên vùng cỏ
    const dayDuoi = H - (duoi ? duoi.offsetHeight : 0) - 8;   // dừng ngay trên thanh nút
    const py = dayTren + b.y * (dayDuoi - dayTren);
    const sau = 0.62 + 0.52 * b.y;                       // xa thì nhỏ, gần thì to
    // chừa đủ lề để thân bò lẫn nhãn tên không thò ra ngoài mép màn hình
    const le = (b.el.offsetWidth || 120) * sau * 0.62;
    const px = Math.min(W - le, Math.max(le, b.x * W));
    b.el.style.transform = `translate(${px}px,${py}px) translate(-50%,-100%) `
        + `scale(${(sau * (b.len || 1)).toFixed(3)},${sau.toFixed(3)})`;
    // chỉ lật hình vẽ; lật cả thẻ thì nhãn tên và ảnh đại diện cũng bị lật ngược
    b.el.classList.toggle('trai', b.lat === -1);
    b.el.style.zIndex = String(10 + Math.round(b.y * 50));
}

function _ufBuoc(dt) {
    _ufBo.forEach(b => {
        if (b.đangHut) return;
        b.nghi -= dt;
        if (b.nghi > 0) return;                          // đang đứng gặm cỏ
        const ddx = b.mx - b.x, ddy = b.my - b.y;
        const kc = Math.hypot(ddx, ddy);
        if (kc < .012) { _ufDiemMoi(b); return; }
        const v = 0.00022 * dt * _ufTocDo;
        b.x += (ddx / kc) * v;
        b.y += (ddy / kc) * v * .6;
        b.x = Math.min(.96, Math.max(.04, b.x));
        b.y = Math.min(.95, Math.max(.05, b.y));
        if (Math.abs(ddx) > .01) b.lat = ddx > 0 ? 1 : -1;
        b.len = 1 + Math.sin(_ufT / 9) * .012;           // nhún nhẹ khi đi
        _ufViTri(b);
    });
}

// ── Đĩa bay ──────────────────────────────────────────────────────────────────
// độ cao đĩa bay: luôn nằm dưới thanh nút trên và trên vùng cỏ
function _ufYDia(co) {
    const canh = document.getElementById('ufCanh');
    const dia = document.getElementById('ufDia');
    const tren = document.querySelector('.uf-tren');
    const H = (canh && canh.clientHeight) || 1;
    const min = ((tren ? tren.offsetHeight : 0) + (dia ? dia.offsetHeight : 60) * .55 + 8) / H;
    return Math.min(.44, Math.max(min, co));
}

function _ufDatDia() {
    const canh = document.getElementById('ufCanh');
    const dia = document.getElementById('ufDia');
    const den = document.getElementById('ufDen');
    if (!canh || !dia) return;
    const W = canh.clientWidth, H = canh.clientHeight;
    const px = _ufUfo.x * W, py = _ufUfo.y * H;
    dia.style.transform = `translate(${px}px,${py}px) translate(-50%,-50%) `
        + `rotate(${(Math.sin(_ufT / 40) * 4).toFixed(2)}deg)`;
    if (den) {
        const dw = den.offsetWidth || 120;
        den.style.left = px + 'px';
        den.style.top = (py + dia.offsetHeight * .3) + 'px';
        den.style.width = dw + 'px';
        const cao = Math.max(40, H - py - dia.offsetHeight * .3);
        den.firstElementChild.style.height = cao + 'px';
        den.style.transform = `translateX(-50%) rotate(${_ufUfo.nghiengDen || 0}deg)`;
    }
}

function _ufChay() {
    _ufDungChay();
    let truoc = performance.now();
    const buoc = (now) => {
        const dt = Math.min(60, now - truoc); truoc = now;
        _ufT++;
        if (_ufTrangThai === 'CHO' || _ufTrangThai === 'QUET') _ufBuoc(dt);
        if (_ufTrangThai === 'CHO') {                    // lượn qua lượn lại tìm bò
            _ufUfo.x = .5 + Math.sin(_ufT / 230) * .34;
            _ufUfo.y = _ufYDia(.20 + Math.sin(_ufT / 90) * .022);
            _ufUfo.nghiengDen = Math.sin(_ufT / 230 + 1.5) * 9;
        }
        _ufDatDia();
        _ufNhapNhay();
        _ufRaf = requestAnimationFrame(buoc);
    };
    _ufRaf = requestAnimationFrame(buoc);
}
function _ufDungChay() { if (_ufRaf) cancelAnimationFrame(_ufRaf); _ufRaf = null; }

function _ufNhapNhay() {
    if (_ufGiam() || _ufT % 6) return;
    const bong = document.querySelectorAll('#ufDia .uf-bong circle');
    bong.forEach((c, i) => {
        c.setAttribute('opacity', ((Math.sin(_ufT / 9 + i * 1.2) + 1) / 2 * .7 + .3).toFixed(2));
    });
}

// ── Quét tìm và hút bò ───────────────────────────────────────────────────────
function ufQuet() {
    if (_ufTrangThai !== 'CHO') return;
    const conLai = _ufBo.filter(b => !b.đaGoi);
    if (!conLai.length) {
        if (typeof showToast === 'function') showToast('Cả lớp đã lên bảng rồi!', 'success');
        _ufLoi('Cả lớp đã lên bảng — thả bò ra đồng để gọi vòng mới');
        return;
    }
    _ufTrangThai = 'QUET';
    _ufNutKhoa(true);
    _ufTieng('quet');
    const moi = conLai[Math.floor(Math.random() * conLai.length)];
    _ufMoi = moi;

    const nhanh = _ufGiam();
    const soLuot = nhanh ? 0 : Math.min(7, conLai.length);
    const thu = [];
    for (let i = 0; i < soLuot; i++) thu.push(conLai[Math.floor(Math.random() * conLai.length)]);
    thu.push(moi);                                        // con cuối cùng là con bị chọn

    _ufLoi('Đèn đang rà qua từng con bò…');
    const moiLuot = nhanh ? 120 : 330;
    thu.forEach((b, i) => {
        _ufHen(() => {
            _ufBo.forEach(x => x.el.classList.remove('sang'));
            b.el.classList.add('sang');
            _ufRoiDen(b, i === thu.length - 1);
        }, i * moiLuot);
    });
    _ufHen(() => _ufHut(moi), thu.length * moiLuot + 260);
}

// đưa đĩa bay tới trên đầu một con bò
function _ufRoiDen(b, cuoi) {
    _ufUfo.x = Math.min(.9, Math.max(.1, b.x));
    _ufUfo.y = _ufYDia(.17);
    _ufUfo.nghiengDen = 0;
    const den = document.getElementById('ufDen');
    if (den) den.style.opacity = cuoi ? '1' : '.75';
}

function _ufHut(b) {
    _ufTrangThai = 'HUT';
    b.đangHut = true;
    b.el.classList.add('chon');
    _ufTieng('hut');
    _ufLoi('Bắt được rồi!');

    const canh = document.getElementById('ufCanh');
    const H = canh.clientHeight;
    const batDau = performance.now();
    const thoiGian = (_ufGiam() ? 500 : 1150) / _ufTocDo;
    const yDau = b.y;

    const bay = (now) => {
        const p = Math.min(1, (now - batDau) / thoiGian);
        // bay lên phía đĩa, vừa bay vừa xoay và nhỏ dần
        b.y = yDau - (yDau + 0.65) * p;
        b.x += (_ufUfo.x - b.x) * 0.06;
        b.el.style.opacity = String(1 - p * p);
        const W = canh.clientWidth;
        b.el.style.transform = `translate(${b.x * W}px,${(H * .56) + b.y * (H * .425)}px) `
            + `translate(-50%,-100%) rotate(${(p * 420).toFixed(1)}deg) scale(${(1 - p * .8).toFixed(3)})`;
        if (p < 1) requestAnimationFrame(bay);
        else {
            b.el.style.display = 'none';
            b.đaGoi = true; b.đangHut = false;
            _ufCongBo(b);
        }
    };
    requestAnimationFrame(bay);
}

// ── Công bố tên ──────────────────────────────────────────────────────────────
function _ufCongBo(b) {
    _ufTrangThai = 'HIEN';
    _ufTieng('hien');
    _ufDaGoi.push({ id: b.id, ten: b.ten, stt: b.stt, anh: b.anh });
    _ufVeDaGoi();
    _ufDemLai();
    if (typeof confetti === 'function' && !_ufGiam()) {
        confetti({ particleCount: 110, spread: 95, origin: { y: .45 },
                   colors: ['#fbbf24', '#a3e635', '#93c5fd', '#f9a8d4'] });
    }
    const conLai = _ufBo.filter(x => !x.đaGoi).length;
    const ket = document.getElementById('ufKet');
    ket.innerHTML = `
      <div class="uf-the" role="alert">
        ${b.anh
          ? `<img alt="" src="${b.anh}" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'uf-thay',textContent:'${_ufChuDau(b.ten)}'}))">`
          : `<span class="uf-thay">${_ufChuDau(b.ten)}</span>`}
        <div class="stt">STT ${b.stt ?? '?'}</div>
        <p class="ho">${b.ten}</p>
        <p class="loi">mời em lên bảng · còn ${conLai} bạn trên đồng</p>
        <div class="hang">
          <button class="uf-ok" onclick="ufTiepTuc()">🎯 Gọi bạn tiếp theo</button>
          <button class="uf-diem" onclick="ufChoDiem(${b.id})">⭐ Cho điểm</button>
          <button class="uf-lai" onclick="ufThaMot(${b.id})">↩️ Thả về đồng</button>
        </div>
      </div>`;
    ket.classList.remove('hidden');
    _ufLoi('Đĩa bay đang lượn tìm bò…');
}

function ufTiepTuc() {
    document.getElementById('ufKet')?.classList.add('hidden');
    _ufTrangThai = 'CHO';
    _ufMoi = null;
    _ufNutKhoa(false);
    _ufBo.forEach(x => x.el.classList.remove('sang', 'chon'));
    const den = document.getElementById('ufDen');
    if (den) den.style.opacity = '1';
}

function ufChoDiem(id) {
    ufTiepTuc();
    if (typeof openPointsModal === 'function') {
        // bảng điểm nằm dưới lớp phủ nên tạm ẩn sân cỏ, xong bấm lại là vào tiếp
        document.getElementById('ufGame')?.classList.add('hidden');
        _ufDungChay();
        openPointsModal(id);
        if (typeof showToast === 'function') showToast('Cho điểm xong hãy mở lại Đĩa bay gọi tên', 'success');
    }
}

// ── Thả bò về đồng ───────────────────────────────────────────────────────────
function ufThaMot(id) {
    const b = _ufBo.find(x => x.id === id);
    if (!b) return;
    b.đaGoi = false;
    b.el.style.display = '';
    b.el.style.opacity = '1';
    b.el.classList.remove('sang', 'chon');
    b.y = .3 + Math.random() * .6;
    b.x = .1 + Math.random() * .8;
    _ufDiemMoi(b);
    _ufViTri(b);
    _ufDaGoi = _ufDaGoi.filter(x => x.id !== id);
    _ufVeDaGoi();
    _ufDemLai();
    _ufTieng('tha');
    ufTiepTuc();
}

function ufThaHet() {
    if (!_ufDaGoi.length) {
        if (typeof showToast === 'function') showToast('Chưa bạn nào lên bảng', 'error');
        return;
    }
    _ufBo.forEach(b => {
        b.đaGoi = false;
        b.el.style.display = '';
        b.el.style.opacity = '1';
        b.el.classList.remove('sang', 'chon');
        _ufDiemMoi(b);
        _ufViTri(b);
    });
    _ufDaGoi = [];
    _ufVeDaGoi();
    _ufDemLai();
    _ufTieng('tha');
    ufTiepTuc();
    _ufLoi('Cả đàn đã về đồng — gọi lại từ đầu');
}

// ── Bảng phụ và nút điều khiển ───────────────────────────────────────────────
function _ufVeDaGoi() {
    const o = document.getElementById('ufDaGoi');
    if (!o) return;
    if (!_ufDaGoi.length) { o.innerHTML = ''; return; }
    o.innerHTML = `<span class="nhan">ĐÃ LÊN BẢNG</span>` + _ufDaGoi.map(s => `
      <button class="uf-chip" onclick="ufThaMot(${s.id})"
              aria-label="Thả ${s.ten} về đồng" title="Bấm để thả về đồng">
        <img alt="" src="${s.anh || ''}" onerror="this.style.visibility='hidden'">
        <span>${s.stt ?? '?'} · ${s.ten}</span>
      </button>`).join('');
}

function _ufDemLai() {
    const e = document.getElementById('ufDemBo');
    if (e) {
        const n = _ufBo.filter(b => !b.đaGoi).length;
        e.textContent = `${n} con bò trên đồng · ${_ufDaGoi.length} bạn đã lên bảng`;
    }
    const th = document.getElementById('ufNutThaHet');
    if (th) th.disabled = _ufDaGoi.length === 0;
}

function _ufNutKhoa(khoa) {
    const q = document.getElementById('ufNutQuet');
    if (q) {
        q.disabled = khoa;
        q.textContent = khoa ? '🔦 Đang quét…' : '🛸 QUÉT TÌM BÒ';
    }
}

function ufDoiTocDo() {
    const i = UF_TOC_DO.indexOf(_ufTocDo);
    _ufTocDo = UF_TOC_DO[(i + 1) % UF_TOC_DO.length];
    const b = document.getElementById('ufNutTocDo');
    if (b) b.innerHTML = `<span class="dai">Tốc độ </span>×${_ufTocDo}`;
}
function ufDoiTen() {
    _ufHienTen = !_ufHienTen;
    document.getElementById('ufCanh')?.classList.toggle('uf-an-ten', !_ufHienTen);
    const b = document.getElementById('ufNutTen');
    if (b) b.innerHTML = `Tên<span class="dai">: ${_ufHienTen ? 'hiện' : 'ẩn'}</span>`;
    if (b) b.setAttribute('aria-label', _ufHienTen ? 'Đang hiện tên, bấm để ẩn' : 'Đang ẩn tên, bấm để hiện');
}
function ufDoiAm() {
    _ufAmThanh = !_ufAmThanh;
    const b = document.getElementById('ufNutAm');
    if (b) b.innerHTML = `${_ufAmThanh ? '🔊' : '🔇'}<span class="dai"> ${_ufAmThanh ? 'bật' : 'tắt'}</span>`;
}
