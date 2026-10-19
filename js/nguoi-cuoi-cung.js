// ============================================================
// NGƯỜI CUỐI CÙNG MAY MẮN
// ------------------------------------------------------------
// Cả lớp hiện kín một bảng tròn tên. Mỗi vòng loại ngẫu nhiên một nửa, càng
// về cuối loại càng chậm và loại từng người một, tới khi chỉ còn MỘT bạn —
// đó là người được gọi.
//
// Dùng chung hai bài nhạc hồi hộp với trò Đĩa Bay Gọi Tên.
// Giao diện tự dựng trong file này, không phụ thuộc file khác.
// ============================================================

const NC_AM_LUONG = 0.3;
const NC_AM_NHO   = 0.1;
const NC_IT       = 4;        // còn từ ngần này trở xuống thì loại từng người một

let _ncHS       = [];   // [{ id, ten, stt, anh, el, ra }]
let _ncTrangThai = 'CHO';   // CHO | CHAY | XONG
let _ncAmThanh  = true;
let _ncNhac     = null;
let _ncChoCham  = false;
let _ncHen      = [];
let _ncAudio    = null;
let _ncNhip     = null;

function _ncGiam() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
function _ncDatHen(fn, ms) { const t = setTimeout(fn, ms); _ncHen.push(t); return t; }
function _ncHuyHen() { _ncHen.forEach(clearTimeout); _ncHen = []; if (_ncNhip) { clearInterval(_ncNhip); _ncNhip = null; } }

// ── Âm thanh ─────────────────────────────────────────────────────────────────
// Danh sách nhạc dùng chung với trò Đĩa Bay Gọi Tên, không chép lại đường dẫn
function _ncDsNhac() {
    return (typeof UF_NHAC !== 'undefined' && Array.isArray(UF_NHAC)) ? UF_NHAC : [];
}

function _ncBatNhac() {
    _ncDungNhac();
    if (!_ncAmThanh) return;
    const ds = _ncDsNhac();
    if (!ds.length) return;
    try {
        const a = new Audio(ds[Math.floor(Math.random() * ds.length)]);
        a.loop = true; a.volume = NC_AM_LUONG; a.preload = 'auto';
        a.addEventListener('error', () => { _ncNhac = null; });
        _ncNhac = a;
        _ncThuPhat();
    } catch (e) { _ncNhac = null; }
}
function _ncThuPhat() {
    if (!_ncNhac || !_ncAmThanh) return;
    const hua = _ncNhac.play();
    if (hua && hua.catch) hua.catch(() => {
        if (_ncChoCham) return;
        _ncChoCham = true;
        const lan1 = () => {
            _ncChoCham = false;
            document.getElementById('ncGame')?.removeEventListener('pointerdown', lan1);
            if (_ncDangMo() && _ncAmThanh) _ncNhac?.play().catch(() => {});
        };
        document.getElementById('ncGame')?.addEventListener('pointerdown', lan1);
    });
}
function _ncDungNhac() {
    if (!_ncNhac) return;
    try { _ncNhac.pause(); _ncNhac.currentTime = 0; } catch (e) {}
    _ncNhac = null;
}
function _ncAmNho(nho) { if (_ncNhac) _ncNhac.volume = nho ? NC_AM_NHO : NC_AM_LUONG; }

function _ncTieng(kieu) {
    if (!_ncAmThanh) return;
    try {
        if (!_ncAudio) _ncAudio = new (window.AudioContext || window.webkitAudioContext)();
        const ac = _ncAudio;
        if (ac.state === 'suspended') ac.resume();
        const t0 = ac.currentTime;
        if (kieu === 'hop') {                     // nhịp trống dồn mỗi lần rà
            const o = ac.createOscillator(), g = ac.createGain();
            o.connect(g); g.connect(ac.destination);
            o.type = 'square'; o.frequency.value = 180;
            g.gain.setValueAtTime(.05, t0); g.gain.exponentialRampToValueAtTime(.001, t0 + .09);
            o.start(t0); o.stop(t0 + .1);
        } else if (kieu === 'loai') {             // tiếng rơi khi một người bị loại
            const o = ac.createOscillator(), g = ac.createGain();
            o.connect(g); g.connect(ac.destination);
            o.type = 'sine';
            o.frequency.setValueAtTime(560, t0);
            o.frequency.exponentialRampToValueAtTime(130, t0 + .22);
            g.gain.setValueAtTime(.06, t0); g.gain.linearRampToValueAtTime(0, t0 + .25);
            o.start(t0); o.stop(t0 + .26);
        } else if (kieu === 'thang') {            // hợp âm reo mừng người cuối cùng
            [523, 659, 784, 1047, 1319].forEach((f, i) => {
                const oo = ac.createOscillator(), gg = ac.createGain();
                oo.connect(gg); gg.connect(ac.destination);
                oo.type = 'triangle'; oo.frequency.value = f;
                const s = t0 + i * .1;
                gg.gain.setValueAtTime(0, s);
                gg.gain.linearRampToValueAtTime(.13, s + .03);
                gg.gain.exponentialRampToValueAtTime(.001, s + .7);
                oo.start(s); oo.stop(s + .75);
            });
        }
    } catch (e) { /* chặn âm thanh thì thôi */ }
}

// ── Kiểu dáng ────────────────────────────────────────────────────────────────
function _ncDungKieu() {
    if (document.getElementById('ncKieu')) return;
    const st = document.createElement('style');
    st.id = 'ncKieu';
    st.textContent = `
.nc{
  --nc-nen:#1a0505; --nc-nen-2:#2d0a0a;
  --nc-bang-1:#7f1d1d; --nc-bang-2:#450a0a;
  --nc-chu:#fff; --nc-mo:rgba(255,255,255,.62);
  --nc-cam:#f97316; --nc-vang:#fbbf24;
  --nc-mat:rgba(255,255,255,.1); --nc-vien:rgba(255,255,255,.18);
  --nc-r:14px; --nc-r-to:24px; --nc-2:8px; --nc-3:14px; --nc-cham:44px;
  color:var(--nc-chu); font-family:"Be Vietnam Pro",system-ui,sans-serif;
  background:radial-gradient(ellipse at 50% 0%,var(--nc-nen-2),var(--nc-nen) 70%);
  user-select:none;
}
/* Tailwind nạp qua CDN nên thứ tự không chắc: chỉ bày khi KHÔNG có .hidden,
   nếu đặt thẳng display:flex lên .nc thì bấm thoát sẽ không ẩn được */
.nc:not(.hidden){display:flex;flex-direction:column}
.nc .hidden{display:none !important}
.nc button:focus-visible{outline:3px solid var(--nc-vang);outline-offset:3px;border-radius:var(--nc-r)}

.nc-bar{display:flex;align-items:center;justify-content:space-between;gap:var(--nc-2);
  padding:var(--nc-2) var(--nc-3);flex-shrink:0}
.nc-ghost{display:inline-flex;align-items:center;justify-content:center;gap:6px;
  min-height:var(--nc-cham);min-width:var(--nc-cham);padding:0 var(--nc-3);border-radius:999px;
  background:var(--nc-mat);color:var(--nc-chu);font-weight:800;font-size:.9rem}
.nc-ghost:hover{background:var(--nc-vien)}
.nc-hide-sm{display:none}
@media(min-width:760px){.nc-hide-sm{display:inline}}

.nc-tieu{flex-shrink:0;text-align:center;font-weight:900;color:var(--nc-chu);
  font-size:clamp(1.1rem,2.6vw,2.1rem);padding:0 var(--nc-3)}
.nc-con{flex-shrink:0;display:flex;justify-content:center;padding:var(--nc-2) 0}
.nc-con span{background:linear-gradient(180deg,#fb923c,#ea580c);color:#2b1000;font-weight:900;
  border-radius:999px;padding:5px 20px;font-size:clamp(.9rem,1.7vw,1.3rem);
  box-shadow:0 4px 14px rgba(234,88,12,.5)}

/* bảng tên: hình chữ nhật bo góc, các tên lợp kín */
.nc-bang{flex:1;min-height:0;margin:0 var(--nc-3) var(--nc-2);border-radius:var(--nc-r-to);
  background:radial-gradient(ellipse at 50% 0%,var(--nc-bang-1),var(--nc-bang-2) 75%);
  border:1px solid rgba(255,255,255,.12);box-shadow:0 0 60px rgba(249,115,22,.25) inset;
  display:grid;gap:var(--nc-khe,10px);align-content:space-evenly;justify-content:space-evenly;
  padding:var(--nc-3);overflow:hidden}

.nc-o{position:relative;width:var(--nc-o,80px);height:var(--nc-o,80px);border-radius:50%;
  display:flex;align-items:center;justify-content:center;text-align:center;
  background:#fff;color:#1f2937;font-weight:800;line-height:1.08;
  font-size:var(--nc-chu-co,12px);padding:6px;overflow:hidden;
  box-shadow:0 3px 10px rgba(0,0,0,.35);
  transition:transform .25s ease-out,opacity .45s ease-out,background .45s,color .45s,filter .45s}
.nc-o span{display:block;max-width:100%;word-break:break-word}
.nc-o.ra{background:rgba(255,255,255,.1);color:rgba(255,255,255,.45);
  box-shadow:none;transform:scale(.88);filter:saturate(.3)}
.nc-o.ngam{animation:ncNgam .32s ease-out}
@keyframes ncNgam{
  0%{transform:scale(1) rotate(0)}
  25%{transform:scale(1.06) rotate(-6deg)}
  55%{transform:scale(1.06) rotate(6deg)}
  100%{transform:scale(.88) rotate(0)}
}
.nc-o.soi{background:var(--nc-vang);color:#2b1000;transform:scale(1.12);
  box-shadow:0 0 0 6px rgba(251,191,36,.35),0 6px 18px rgba(0,0,0,.45);z-index:2}
.nc-o.con{animation:ncTho 1.1s ease-in-out infinite}
@keyframes ncTho{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
.nc-o.vua{background:linear-gradient(180deg,#fde68a,#f59e0b);color:#2b1000;
  box-shadow:0 0 0 10px rgba(251,191,36,.3),0 10px 30px rgba(0,0,0,.5);
  animation:ncVua 1s ease-in-out infinite}
@keyframes ncVua{0%,100%{transform:scale(1.1)}50%{transform:scale(1.22)}}

.nc-act{flex-shrink:0;display:flex;justify-content:center;gap:var(--nc-3);flex-wrap:wrap;
  padding:var(--nc-2) var(--nc-3) var(--nc-3)}
.nc-nut{display:inline-flex;align-items:center;justify-content:center;gap:var(--nc-2);
  min-height:var(--nc-cham);padding:var(--nc-3) clamp(20px,4vw,44px);border-radius:var(--nc-r-to);
  font-weight:900;font-size:clamp(1rem,2vw,1.4rem);transition:transform .15s ease-out}
.nc-nut:active{transform:translateY(4px)}
.nc-bd{background:linear-gradient(180deg,#fb923c,#ea580c);color:#2b1000;box-shadow:0 7px 0 #9a3412}
.nc-phu{background:var(--nc-mat);border:1px solid var(--nc-vien);color:var(--nc-chu);
  font-size:clamp(.9rem,1.5vw,1.1rem)}
.nc-nut:disabled{background:var(--nc-mat);color:var(--nc-mo);box-shadow:none;cursor:not-allowed}

/* thẻ công bố */
.nc-ket{position:absolute;inset:0;z-index:9;display:flex;align-items:center;justify-content:center;
  background:rgba(10,2,2,.76);backdrop-filter:blur(5px);padding:var(--nc-3)}
.nc-the{background:linear-gradient(180deg,#fffbeb,#fcd34d);color:#1f2937;border-radius:28px;
  padding:clamp(16px,3vw,34px);text-align:center;box-shadow:0 24px 60px rgba(0,0,0,.6);
  max-width:min(92vw,560px);animation:ncHien .45s cubic-bezier(.2,1.4,.5,1)}
@keyframes ncHien{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}
.nc-the img,.nc-the .thay{width:clamp(96px,16vw,180px);aspect-ratio:1;border-radius:50%;
  object-fit:cover;background:#fff;border:6px solid #ea580c;box-shadow:0 8px 20px rgba(0,0,0,.3)}
.nc-the .thay{display:inline-flex;align-items:center;justify-content:center;color:#c2410c;
  font-weight:900;font-size:clamp(44px,7vw,84px);background:#ffedd5}
.nc-the .stt{display:inline-block;margin-top:10px;background:#c2410c;color:#fff;font-weight:900;
  border-radius:999px;padding:3px 16px;font-size:clamp(.9rem,1.6vw,1.2rem)}
.nc-the .ho{font-weight:900;line-height:1.1;margin:6px 0 2px;font-size:clamp(1.8rem,6vw,4.2rem)}
.nc-the .loi{font-weight:700;color:#9a3412;font-size:clamp(.9rem,1.6vw,1.15rem)}
.nc-the .hang{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:16px}
.nc-the button{min-height:var(--nc-cham);padding:0 18px;border-radius:var(--nc-r-to);font-weight:900;
  font-size:clamp(.9rem,1.5vw,1.1rem)}
.nc-ok{background:#ea580c;color:#fff}
.nc-diem{background:#7c3aed;color:#fff}
.nc-lai{background:rgba(0,0,0,.1);color:#374151}
@media(max-width:640px){
  .nc-nut{padding:10px 16px;font-size:1rem}
  .nc-bar{padding:6px 10px}
  .nc-bang{margin:0 8px 6px;padding:8px}
}
@media(prefers-reduced-motion:reduce){
  .nc-o,.nc-the{animation:none !important;transition-duration:.01ms !important}
}`;
    document.head.appendChild(st);
}

// ── Dựng khung ───────────────────────────────────────────────────────────────
function _ncDungKhung() {
    if (document.getElementById('ncGame')) return;
    _ncDungKieu();
    const d = document.createElement('div');
    d.id = 'ncGame';
    d.className = 'nc fixed inset-0 z-[129] hidden';
    d.setAttribute('role', 'dialog');
    d.setAttribute('aria-label', 'Người cuối cùng may mắn');
    d.innerHTML = `
      <header class="nc-bar">
        <button onclick="dongNguoiCuoiCung()" class="nc-ghost" aria-label="Thoát">
          <i class="fas fa-arrow-left" aria-hidden="true"></i><span class="nc-hide-sm">Thoát</span>
        </button>
        <div style="display:flex;gap:8px">
          <button class="nc-ghost" onclick="ncDoiAm()" id="ncNutAm" aria-label="Bật tắt âm thanh">🔊<span class="nc-hide-sm"> bật</span></button>
          <button class="nc-ghost" onclick="ncDoiFull()" aria-label="Toàn màn hình, phím F">
            <i class="fas fa-expand-arrows-alt" aria-hidden="true"></i></button>
        </div>
      </header>

      <h2 class="nc-tieu" id="ncTieu">🔥 Người cuối cùng may mắn</h2>
      <div class="nc-con"><span id="ncCon">Còn lại 0 người</span></div>
      <div class="nc-bang" id="ncBang" aria-live="polite"></div>

      <div class="nc-act">
        <button class="nc-nut nc-bd" id="ncNutBD" onclick="ncBatDau()">🔥 BẮT ĐẦU LOẠI</button>
        <button class="nc-nut nc-phu" id="ncNutLai" onclick="ncChoiLai()">🔄 Chơi lại</button>
      </div>
      <div class="nc-ket hidden" id="ncKet"></div>`;
    document.body.appendChild(d);
    document.addEventListener('keydown', _ncPhim);
    window.addEventListener('resize', () => { if (_ncDangMo()) _ncXepBang(); });
}

function _ncDangMo() {
    const g = document.getElementById('ncGame');
    return g && !g.classList.contains('hidden');
}
function _ncPhim(e) {
    if (!_ncDangMo()) return;
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
    if (e.key === 'f' || e.key === 'F') { e.preventDefault(); ncDoiFull(); }
    else if (e.key === 'Escape') dongNguoiCuoiCung();
    else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); ncBatDau(); }
}
function ncDoiFull() {
    const el = document.getElementById('ncGame');
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    else el?.requestFullscreen?.().catch(() => {});
}
function ncDoiAm() {
    _ncAmThanh = !_ncAmThanh;
    const b = document.getElementById('ncNutAm');
    if (b) b.innerHTML = `${_ncAmThanh ? '🔊' : '🔇'}<span class="nc-hide-sm"> ${_ncAmThanh ? 'bật' : 'tắt'}</span>`;
    if (!_ncAmThanh) { try { _ncNhac?.pause(); } catch (e) {} }
    else if (_ncNhac) _ncThuPhat();
    else _ncBatNhac();
}
function _ncChuDau(ten) {
    return (ten || '?').trim().split(/\s+/).pop().charAt(0).toUpperCase();
}

// ── Mở / đóng ────────────────────────────────────────────────────────────────
function openNguoiCuoiCung() {
    if (!currentClassId) {
        if (typeof showToast === 'function') showToast('Hãy chọn lớp trước', 'error');
        return;
    }
    const ds = students.filter(s => s.classId === currentClassId)
                       .sort((a, b) => (a.stt || 999) - (b.stt || 999));
    if (ds.length < 2) {
        if (typeof showToast === 'function') showToast('Cần ít nhất 2 học sinh', 'error');
        return;
    }
    _ncDungKhung();
    document.getElementById('ncGame').classList.remove('hidden');
    document.getElementById('ncKet').classList.add('hidden');
    _ncTaoBang(ds);
    _ncBatNhac();
}

function dongNguoiCuoiCung() {
    _ncHuyHen();
    _ncDungNhac();
    _ncTrangThai = 'CHO';
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    document.getElementById('ncGame')?.classList.add('hidden');
    document.getElementById('ncKet')?.classList.add('hidden');
}

// ── Bảng tên lợp kín ─────────────────────────────────────────────────────────
function _ncTaoBang(ds) {
    const bang = document.getElementById('ncBang');
    bang.innerHTML = '';
    _ncHS = ds.map(s => {
        const el = document.createElement('div');
        el.className = 'nc-o';
        el.innerHTML = `<span>${s.name}</span>`;
        el.title = `STT ${s.stt ?? '?'} · ${s.name}`;
        bang.appendChild(el);
        return { id: s.id, ten: s.name, stt: s.stt, anh: s.avatar || '', el, ra: false };
    });
    _ncTrangThai = 'CHO';
    _ncXepBang();
    _ncDemLai();
    _ncLoi('🔥 Người cuối cùng may mắn');
    _ncNutKhoa(false);
}

// Chọn số cột và cỡ vòng tròn để cả lớp lợp kín bảng mà vẫn to nhất có thể
function _ncXepBang() {
    const bang = document.getElementById('ncBang');
    if (!bang || !_ncHS.length) return;
    const n = _ncHS.length;
    const cs = getComputedStyle(bang);
    const W = bang.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const H = bang.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    if (W <= 0 || H <= 0) return;
    let tot = { cot: n, d: 0, khe: 10 };
    for (let cot = 1; cot <= n; cot++) {
        const hang = Math.ceil(n / cot);
        const khe = Math.max(5, Math.min(12, 520 / Math.max(cot, hang)));
        const d = Math.min((W - khe * (cot - 1)) / cot, (H - khe * (hang - 1)) / hang);
        if (d > tot.d) tot = { cot, d, khe };
    }
    const d = Math.max(34, Math.floor(tot.d));
    bang.style.gridTemplateColumns = `repeat(${tot.cot},${d}px)`;
    bang.style.setProperty('--nc-o', d + 'px');
    bang.style.setProperty('--nc-khe', Math.round(tot.khe) + 'px');
    // chữ co theo vòng tròn, tên dài thì nhỏ thêm chút cho khỏi tràn
    const daiNhat = _ncHS.reduce((m, s) => Math.max(m, s.ten.length), 0);
    const co = Math.max(8, Math.min(d * 0.185, d * 3.1 / Math.max(8, daiNhat)));
    bang.style.setProperty('--nc-chu-co', co.toFixed(1) + 'px');
}

function _ncConLai() { return _ncHS.filter(s => !s.ra); }
function _ncDemLai() {
    const e = document.getElementById('ncCon');
    if (e) e.textContent = `Còn lại ${_ncConLai().length} người`;
}
function _ncLoi(t) { const e = document.getElementById('ncTieu'); if (e) e.textContent = t; }
function _ncNutKhoa(khoa) {
    const b = document.getElementById('ncNutBD');
    if (b) { b.disabled = khoa; b.textContent = khoa ? '⏳ Đang loại…' : '🔥 BẮT ĐẦU LOẠI'; }
    const l = document.getElementById('ncNutLai');
    if (l) l.disabled = khoa;
}

// ── Loại dần ─────────────────────────────────────────────────────────────────
function ncBatDau() {
    if (_ncTrangThai === 'CHAY') return;
    if (_ncConLai().length < 2) { ncChoiLai(); return; }
    _ncTrangThai = 'CHAY';
    _ncNutKhoa(true);
    _ncHS.forEach(s => s.el.classList.remove('con'));
    _ncVongTiep();
}

function _ncVongTiep() {
    const con = _ncConLai();
    if (con.length <= 1) { _ncCongBo(con[0]); return; }

    // còn đông thì loại một nửa, còn ít thì loại từng người cho hồi hộp
    const loai = con.length > NC_IT ? Math.floor(con.length / 2) : 1;
    const tron = con.slice();
    for (let i = tron.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tron[i], tron[j]] = [tron[j], tron[i]];
    }
    const biLoai = tron.slice(0, loai);

    _ncLoi(con.length - loai === 1
        ? 'Ai sẽ là người cuối cùng…'
        : `Đang loại ${loai} người…`);

    // càng ít người còn lại thì rà càng lâu, càng hồi hộp
    const nhanh = _ncGiam();
    const raLau = nhanh ? 180 : (con.length <= NC_IT ? 1500 : 900);
    _ncRaSoi(con, raLau, () => {
        biLoai.forEach((s, i) => _ncDatHen(() => {
            s.ra = true;
            s.el.classList.remove('soi');
            s.el.classList.add('ngam');
            _ncDatHen(() => s.el.classList.add('ra'), 300);
            _ncTieng('loai');
            _ncDemLai();
        }, i * (nhanh ? 30 : Math.min(160, 900 / Math.max(1, loai)))));

        const xong = (loai - 1) * (nhanh ? 30 : Math.min(160, 900 / Math.max(1, loai))) + 520;
        _ncDatHen(() => {
            const sau = _ncConLai();
            if (sau.length <= 1) { _ncCongBo(sau[0]); return; }
            sau.forEach(s => s.el.classList.add('con'));
            _ncLoi(`Còn ${sau.length} người — chuẩn bị vòng sau`);
            _ncDatHen(() => {
                sau.forEach(s => s.el.classList.remove('con'));
                _ncVongTiep();
            }, nhanh ? 200 : (sau.length <= NC_IT ? 1200 : 800));
        }, xong);
    });
}

// đèn rà nhảy ngẫu nhiên qua những người còn lại, dồn nhịp trống
function _ncRaSoi(con, thoiGian, xong) {
    if (_ncNhip) { clearInterval(_ncNhip); _ncNhip = null; }
    const batDau = Date.now();
    let truoc = null;
    const buoc = () => {
        if (truoc) truoc.el.classList.remove('soi');
        const s = con[Math.floor(Math.random() * con.length)];
        s.el.classList.add('soi');
        truoc = s;
        _ncTieng('hop');
        if (Date.now() - batDau >= thoiGian) {
            clearInterval(_ncNhip); _ncNhip = null;
            _ncDatHen(() => { if (truoc) truoc.el.classList.remove('soi'); xong(); }, 90);
        }
    };
    buoc();
    _ncNhip = setInterval(buoc, _ncGiam() ? 90 : 110);
}

// ── Công bố ──────────────────────────────────────────────────────────────────
function _ncCongBo(s) {
    _ncHuyHen();
    _ncTrangThai = 'XONG';
    _ncNutKhoa(false);
    _ncDemLai();
    if (!s) { _ncLoi('Không còn ai, hãy chơi lại'); return; }
    s.el.classList.remove('soi', 'con', 'ngam');
    s.el.classList.add('vua');
    _ncLoi('🏆 Người cuối cùng may mắn!');
    _ncAmNho(true);
    _ncTieng('thang');
    if (typeof confetti === 'function' && !_ncGiam()) {
        confetti({ particleCount: 160, spread: 110, origin: { y: .5 },
                   colors: ['#fbbf24', '#f97316', '#fde68a', '#fff'] });
    }
    const ket = document.getElementById('ncKet');
    ket.innerHTML = `
      <div class="nc-the" role="alert">
        ${s.anh
          ? `<img alt="" src="${s.anh}" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'thay',textContent:'${_ncChuDau(s.ten)}'}))">`
          : `<span class="thay">${_ncChuDau(s.ten)}</span>`}
        <div class="stt">STT ${s.stt ?? '?'}</div>
        <p class="ho">${s.ten}</p>
        <p class="loi">là người cuối cùng còn lại · mời em lên bảng</p>
        <div class="hang">
          <button class="nc-ok" onclick="ncChoiLai()">🔄 Chơi lại từ đầu</button>
          <button class="nc-diem" onclick="ncChoDiem(${s.id})">⭐ Cho điểm</button>
          <button class="nc-lai" onclick="ncDongThe()">👀 Xem lại bảng</button>
        </div>
      </div>`;
    ket.classList.remove('hidden');
}

function ncDongThe() {
    document.getElementById('ncKet')?.classList.add('hidden');
    _ncAmNho(false);
}

function ncChoiLai() {
    _ncHuyHen();
    _ncAmNho(false);
    document.getElementById('ncKet')?.classList.add('hidden');
    _ncHS.forEach(s => {
        s.ra = false;
        s.el.classList.remove('ra', 'soi', 'con', 'vua', 'ngam');
    });
    _ncTrangThai = 'CHO';
    _ncNutKhoa(false);
    _ncDemLai();
    _ncLoi('🔥 Người cuối cùng may mắn');
}

function ncChoDiem(id) {
    _ncHuyHen();
    _ncDungNhac();
    document.getElementById('ncKet')?.classList.add('hidden');
    document.getElementById('ncGame')?.classList.add('hidden');
    if (typeof openPointsModal === 'function') {
        openPointsModal(id);
        if (typeof showToast === 'function') showToast('Cho điểm xong hãy mở lại trò chơi', 'success');
    }
}
