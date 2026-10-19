// ============================================================
// ĐẤU GIÁ TRI THỨC
// ------------------------------------------------------------
// Mỗi nhóm có một quỹ điểm. Thầy cô nêu câu hỏi rồi mở đấu giá: nhóm nào
// tự tin thì trả giá cao để giành quyền trả lời. Đồng hồ đếm ngược, cứ có
// người trả giá là đồng hồ lại được nới ra — "ai hơn nữa không?".
//
// Búa gõ xuống, nhóm giá cao nhất trả lời:
//   đúng  -> ĐƯỢC THÊM đúng số điểm đã đặt (gấp đôi số đặt cược)
//   sai   -> MẤT TRẮNG số đã đặt, câu hỏi chuyển cho nhóm trả giá cao thứ nhì
//
// Không hề có may rủi, chỉ có gan và sự tự tin. Cuối trận, phần quỹ kiếm
// thêm được so với lúc đầu mới là điểm cộng vào sổ.
// ============================================================

const DG_QUY_DAU  = [10, 15, 20];
const DG_GIAY     = [15, 20, 30];
const DG_NOI      = 6;        // có người trả giá thì đồng hồ nới lại ít nhất ngần này giây
const DG_BUOC     = [1, 5];   // các mức tăng giá

let _dgQuyDau   = 10;
let _dgGiay     = 20;
let _dgDoi      = [];    // [{ id, ten, ids, quy, gia, mau }]
let _dgTrangThai = 'CHO';  // CHO | DAUGIA | TRALOI | XONG
let _dgConLai   = 0;
let _dgDongHo   = null;
let _dgNguoiTL  = null;  // chỉ số đội đang được trả lời
let _dgDaTL     = [];    // những đội đã trả lời hụt ở câu này
let _dgCau      = 1;
let _dgNhatKy   = null;
let _dgAmThanh  = true;
let _dgNhac     = null;
let _dgChoCham  = false;
let _dgAudio    = null;
let _dgTheoNhom = true;
const DG_MAU = ['#f87171', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#f472b6',
                '#22d3ee', '#fb923c', '#4ade80', '#e879f9'];

function _dgGiam() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ── Âm thanh (dùng chung nhạc với Đĩa Bay Gọi Tên) ───────────────────────────
function _dgDsNhac() {
    return (typeof UF_NHAC !== 'undefined' && Array.isArray(UF_NHAC)) ? UF_NHAC : [];
}
function _dgBatNhac() {
    _dgDungNhac();
    if (!_dgAmThanh) return;
    const ds = _dgDsNhac();
    if (!ds.length) return;
    try {
        const a = new Audio(ds[Math.floor(Math.random() * ds.length)]);
        a.loop = true; a.volume = 0.3; a.preload = 'auto';
        a.addEventListener('error', () => { _dgNhac = null; });
        _dgNhac = a;
        _dgThuPhat();
    } catch (e) { _dgNhac = null; }
}
function _dgThuPhat() {
    if (!_dgNhac || !_dgAmThanh) return;
    const hua = _dgNhac.play();
    if (hua && hua.catch) hua.catch(() => {
        if (_dgChoCham) return;
        _dgChoCham = true;
        const lan1 = () => {
            _dgChoCham = false;
            document.getElementById('dgGame')?.removeEventListener('pointerdown', lan1);
            if (_dgDangMo() && _dgAmThanh) _dgNhac?.play().catch(() => {});
        };
        document.getElementById('dgGame')?.addEventListener('pointerdown', lan1);
    });
}
function _dgDungNhac() {
    if (!_dgNhac) return;
    try { _dgNhac.pause(); _dgNhac.currentTime = 0; } catch (e) {}
    _dgNhac = null;
}
function _dgAmNho(nho) { if (_dgNhac) _dgNhac.volume = nho ? 0.1 : 0.3; }

function _dgTieng(kieu) {
    if (!_dgAmThanh) return;
    try {
        if (!_dgAudio) _dgAudio = new (window.AudioContext || window.webkitAudioContext)();
        const ac = _dgAudio;
        if (ac.state === 'suspended') ac.resume();
        const t0 = ac.currentTime;
        const don = (loai, f1, f2, to, dai) => {
            const o = ac.createOscillator(), g = ac.createGain();
            o.connect(g); g.connect(ac.destination);
            o.type = loai;
            o.frequency.setValueAtTime(f1, t0);
            if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dai);
            g.gain.setValueAtTime(to, t0); g.gain.linearRampToValueAtTime(0, t0 + dai);
            o.start(t0); o.stop(t0 + dai + .01);
        };
        if (kieu === 'gia')       don('square', 760, 1150, .05, .1);     // có người trả giá
        else if (kieu === 'tich') don('sine', 1000, null, .04, .06);     // tiếng tích tắc
        else if (kieu === 'bua') {                                        // búa gõ
            don('square', 200, 60, .12, .3);
            setTimeout(() => { try { don('square', 170, 50, .09, .25); } catch (e) {} }, 110);
        }
        else if (kieu === 'dung') {
            [660, 880, 1320].forEach((f, i) => {
                const o = ac.createOscillator(), g = ac.createGain();
                o.connect(g); g.connect(ac.destination);
                o.type = 'triangle'; o.frequency.value = f;
                const s = t0 + i * .1;
                g.gain.setValueAtTime(0, s);
                g.gain.linearRampToValueAtTime(.12, s + .03);
                g.gain.exponentialRampToValueAtTime(.001, s + .5);
                o.start(s); o.stop(s + .55);
            });
        }
        else if (kieu === 'sai')  don('sawtooth', 320, 80, .08, .45);
    } catch (e) {}
}

// ── Kiểu dáng ────────────────────────────────────────────────────────────────
function _dgDungKieu() {
    if (document.getElementById('dgKieu')) return;
    const st = document.createElement('style');
    st.id = 'dgKieu';
    st.textContent = `
.dg{
  --dg-nen:#1c1917; --dg-nen-2:#292524; --dg-go:#44403c;
  --dg-chu:#fff; --dg-mo:rgba(255,255,255,.6);
  --dg-vang:#fbbf24; --dg-vang-2:#f59e0b; --dg-xanh:#22c55e; --dg-do:#ef4444;
  --dg-mat:rgba(255,255,255,.08); --dg-vien:rgba(251,191,36,.3);
  --dg-r:14px; --dg-r-to:22px; --dg-2:8px; --dg-3:14px; --dg-cham:44px;
  color:var(--dg-chu); font-family:"Be Vietnam Pro",system-ui,sans-serif;
  background:radial-gradient(ellipse at 50% 0%,var(--dg-nen-2),var(--dg-nen) 72%);
  user-select:none;
}
.dg:not(.hidden){display:flex;flex-direction:column}
.dg .hidden{display:none !important}
.dg button:focus-visible{outline:3px solid var(--dg-vang);outline-offset:3px;border-radius:var(--dg-r)}

.dg-bar{display:flex;align-items:center;justify-content:space-between;gap:var(--dg-2);
  padding:var(--dg-2) var(--dg-3);flex-shrink:0}
.dg-bar .giua{flex:1;min-width:0;text-align:center;font-weight:800;color:var(--dg-mo);
  font-size:clamp(.8rem,1.5vw,1.05rem)}
.dg-ghost{display:inline-flex;align-items:center;justify-content:center;gap:6px;
  min-height:var(--dg-cham);min-width:var(--dg-cham);padding:0 var(--dg-3);border-radius:999px;
  background:var(--dg-mat);color:var(--dg-chu);font-weight:800;font-size:.9rem}
.dg-ghost:hover{background:rgba(255,255,255,.18)}
.dg-hide-sm{display:none}
@media(min-width:760px){.dg-hide-sm{display:inline}}

/* bục đấu giá */
.dg-buc{flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:2px;
  padding:var(--dg-2) var(--dg-3)}
.dg-nhan{font-weight:900;letter-spacing:.14em;color:var(--dg-vang);
  font-size:clamp(.7rem,1.3vw,1rem)}
.dg-gia{font-weight:900;line-height:1;color:#fff;text-shadow:0 0 30px rgba(251,191,36,.75);
  font-size:clamp(3rem,13vw,9rem)}
.dg-gia.len{animation:dgLen .3s cubic-bezier(.2,1.6,.4,1)}
@keyframes dgLen{0%{transform:scale(1)}45%{transform:scale(1.22)}100%{transform:scale(1)}}
.dg-chu-gia{font-weight:900;font-size:clamp(1rem,2.6vw,1.9rem);min-height:1.2em}
.dg-dong-ho{display:flex;align-items:center;gap:10px;margin-top:4px}
.dg-dong-ho .so{font-weight:900;font-size:clamp(1.2rem,3vw,2.2rem);min-width:2.2em;text-align:center}
.dg-dong-ho .thanh{width:min(52vw,420px);height:12px;border-radius:999px;
  background:rgba(255,255,255,.12);overflow:hidden}
.dg-dong-ho .thanh i{display:block;height:100%;border-radius:999px;
  background:linear-gradient(90deg,var(--dg-xanh),var(--dg-vang));transition:width .25s linear}
.dg-dong-ho.gap .so{color:var(--dg-do);animation:dgGap .5s ease-in-out infinite}
.dg-dong-ho.gap .thanh i{background:linear-gradient(90deg,#f97316,var(--dg-do))}
@keyframes dgGap{0%,100%{transform:scale(1)}50%{transform:scale(1.18)}}

/* bảng các nhóm */
.dg-bang{flex:1;min-height:0;overflow-y:auto;display:grid;gap:var(--dg-2);
  padding:var(--dg-2) var(--dg-3);align-content:center;
  grid-template-columns:repeat(auto-fit,minmax(190px,1fr))}
.dg-the{display:flex;flex-direction:column;gap:3px;padding:8px 10px;border-radius:var(--dg-r);
  background:var(--dg-mat);border:2px solid rgba(255,255,255,.12);transition:border-color .2s,background .2s}
.dg-the.dan{border-color:var(--dg-vang);background:rgba(251,191,36,.16);
  box-shadow:0 0 22px rgba(251,191,36,.25)}
.dg-the.thang{border-color:var(--dg-xanh);background:rgba(34,197,94,.18)}
.dg-the.het{opacity:.5}
.dg-the .dau{display:flex;align-items:baseline;justify-content:space-between;gap:6px}
.dg-the .ten{font-weight:900;font-size:clamp(.85rem,1.5vw,1.1rem);white-space:nowrap;
  overflow:hidden;text-overflow:ellipsis}
.dg-the .quy{font-weight:900;color:var(--dg-vang);font-size:clamp(.85rem,1.5vw,1.1rem);white-space:nowrap}
.dg-the .lai{font-weight:700;font-size:.72rem;color:var(--dg-mo)}
.dg-the .lai.duong{color:#4ade80}
.dg-the .lai.am{color:#fca5a5}
.dg-the .dat{display:flex;align-items:center;gap:6px;margin-top:2px}
.dg-the .dat .gia{font-weight:900;font-size:clamp(1rem,2vw,1.5rem);min-width:2.4em;text-align:center}
.dg-the .dat button{flex:1;min-height:var(--dg-cham);border-radius:999px;font-weight:900;
  font-size:.85rem;background:linear-gradient(180deg,#fcd34d,#f59e0b);color:#2b1a00}
.dg-the .dat button:hover:not(:disabled){filter:brightness(1.12)}
.dg-the .dat button:disabled{background:rgba(255,255,255,.1);color:var(--dg-mo);cursor:not-allowed}

.dg-act{flex-shrink:0;display:flex;justify-content:center;gap:var(--dg-3);flex-wrap:wrap;
  padding:var(--dg-2) var(--dg-3) var(--dg-3)}
.dg-nut{display:inline-flex;align-items:center;justify-content:center;gap:var(--dg-2);
  min-height:var(--dg-cham);padding:10px clamp(18px,3.5vw,40px);border-radius:var(--dg-r-to);
  font-weight:900;font-size:clamp(.95rem,1.8vw,1.3rem);transition:transform .15s}
.dg-nut:active{transform:translateY(4px)}
.dg-mo{background:linear-gradient(180deg,#fcd34d,#f59e0b);color:#2b1a00;box-shadow:0 6px 0 #b45309}
.dg-bua{background:linear-gradient(180deg,#a8a29e,#57534e);color:#fff;box-shadow:0 6px 0 #292524}
.dg-dung{background:linear-gradient(180deg,#4ade80,#16a34a);color:#06281a;box-shadow:0 6px 0 #14532d}
.dg-sai{background:linear-gradient(180deg,#f87171,#dc2626);color:#fff;box-shadow:0 6px 0 #7f1d1d}
.dg-phu{background:var(--dg-mat);border:1px solid rgba(255,255,255,.18);color:var(--dg-chu);
  font-size:clamp(.85rem,1.4vw,1.05rem)}
.dg-nut:disabled{background:var(--dg-mat);color:var(--dg-mo);box-shadow:none;cursor:not-allowed}
@media(max-width:640px){
  .dg-bang{grid-template-columns:repeat(2,minmax(0,1fr));padding:6px 8px}
  .dg-the{padding:6px 8px}
  .dg-the .dat button{font-size:.75rem;min-height:40px}
  .dg-nut{padding:9px 14px;font-size:.9rem}
  .dg-bar{padding:5px 8px}
  .dg-buc{padding:4px 8px}
}
@media(prefers-reduced-motion:reduce){
  .dg-gia,.dg-dong-ho.gap .so{animation:none !important}
}`;
    document.head.appendChild(st);
}

// ── Dựng khung ───────────────────────────────────────────────────────────────
function _dgDungKhung() {
    if (document.getElementById('dgRoot')) return;
    _dgDungKieu();
    const r = document.createElement('div');
    r.id = 'dgRoot';
    r.innerHTML = `
      <div id="dgSetup" class="fixed inset-0 z-[127] hidden items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
        <div class="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
          <div class="px-6 py-4 border-b flex items-center justify-between flex-shrink-0">
            <div>
              <h2 class="text-2xl font-black text-gray-800">⚖️ Đấu Giá Tri Thức</h2>
              <p class="text-gray-500 text-sm mt-0.5">Đặt điểm để giành quyền trả lời — đúng gấp đôi, sai mất trắng</p>
            </div>
            <button onclick="closeDgSetup()" aria-label="Đóng" class="text-gray-400 hover:text-gray-700 text-2xl" style="min-width:44px;min-height:44px">&times;</button>
          </div>
          <div class="flex-1 overflow-y-auto p-5 space-y-5">
            <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-900 font-semibold leading-relaxed">
              Thầy cô nêu câu hỏi rồi mở đấu giá. Nhóm nào tự tin thì trả giá cao để giành quyền trả lời.<br>
              Cứ có người trả giá là đồng hồ lại được nới ra — "ai hơn nữa không?".<br>
              Búa gõ xuống, nhóm giá cao nhất trả lời: <b>đúng được thêm đúng số đã đặt</b>,
              <b>sai mất trắng</b> và câu hỏi chuyển cho nhóm trả giá cao thứ nhì.<br>
              Cuối trận, phần quỹ <b>kiếm thêm được</b> so với lúc đầu mới là điểm cộng vào sổ.
            </div>
            <div>
              <h3 class="font-black text-gray-800 mb-2">Quỹ điểm ban đầu của mỗi nhóm</h3>
              <div id="dgChonQuy" class="flex gap-2 flex-wrap"></div>
            </div>
            <div>
              <h3 class="font-black text-gray-800 mb-2">Thời gian đấu giá mỗi câu</h3>
              <div id="dgChonGiay" class="flex gap-2 flex-wrap"></div>
            </div>
            <div>
              <h3 class="font-black text-gray-800 mb-2">Ai chơi</h3>
              <div id="dgChonKieu" class="flex gap-2 mb-3 flex-wrap"></div>
              <div id="dgDanhSach" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1"></div>
            </div>
          </div>
          <div class="px-6 py-4 border-t flex items-center justify-between flex-shrink-0 bg-gray-50">
            <span id="dgTomTat" class="text-gray-600 font-bold text-sm"></span>
            <button onclick="batDauDauGia()" id="dgNutBD"
                    class="bg-amber-600 hover:bg-amber-500 text-white font-black px-7 py-3 rounded-2xl disabled:bg-gray-300" style="min-height:44px">
              <i class="fas fa-play mr-1" aria-hidden="true"></i> Bắt đầu
            </button>
          </div>
        </div>
      </div>

      <div id="dgGame" class="dg fixed inset-0 z-[129] hidden" role="dialog" aria-label="Đấu giá tri thức">
        <header class="dg-bar">
          <button onclick="dongDauGia()" class="dg-ghost" aria-label="Thoát">
            <i class="fas fa-arrow-left" aria-hidden="true"></i><span class="dg-hide-sm">Thoát</span>
          </button>
          <div class="giua" id="dgLoi" aria-live="polite">Nêu câu hỏi rồi mở đấu giá</div>
          <div style="display:flex;gap:8px">
            <button onclick="dgHoanTac()" id="dgNutHoanTac" class="dg-ghost hidden" aria-label="Hoàn tác cộng điểm">
              <i class="fas fa-rotate-left" aria-hidden="true"></i></button>
            <button onclick="dgDoiAm()" id="dgNutAm" class="dg-ghost" aria-label="Bật tắt âm thanh">🔊</button>
            <button onclick="dgDoiFull()" class="dg-ghost" aria-label="Toàn màn hình, phím F">
              <i class="fas fa-expand-arrows-alt" aria-hidden="true"></i></button>
          </div>
        </header>

        <div class="dg-buc">
          <span class="dg-nhan" id="dgNhan">GIÁ CAO NHẤT</span>
          <span class="dg-gia" id="dgGiaCao">0</span>
          <span class="dg-chu-gia" id="dgChuGia">chưa ai trả giá</span>
          <div class="dg-dong-ho" id="dgDongHo">
            <span class="so" id="dgGiay">--</span>
            <span class="thanh"><i id="dgThanh" style="width:100%"></i></span>
          </div>
        </div>

        <div class="dg-bang" id="dgBang"></div>

        <div class="dg-act" id="dgAct"></div>
      </div>`;
    document.body.appendChild(r);
    document.addEventListener('keydown', _dgPhim);
}

function _dgDangMo() {
    const g = document.getElementById('dgGame');
    return g && !g.classList.contains('hidden');
}
function _dgPhim(e) {
    if (!_dgDangMo()) return;
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
    if (e.key === 'f' || e.key === 'F') { e.preventDefault(); dgDoiFull(); }
    else if (e.key === 'Escape') dongDauGia();
    else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (_dgTrangThai === 'CHO') dgMoDauGia();
        else if (_dgTrangThai === 'DAUGIA') dgChotBua();
    }
}
function dgDoiFull() {
    const el = document.getElementById('dgGame');
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    else el?.requestFullscreen?.().catch(() => {});
}
function dgDoiAm() {
    _dgAmThanh = !_dgAmThanh;
    const b = document.getElementById('dgNutAm');
    if (b) b.textContent = _dgAmThanh ? '🔊' : '🔇';
    if (!_dgAmThanh) { try { _dgNhac?.pause(); } catch (e) {} }
    else if (_dgNhac) _dgThuPhat();
    else _dgBatNhac();
}

// ── Màn chuẩn bị ─────────────────────────────────────────────────────────────
function openDauGia() {
    if (!currentClassId) {
        if (typeof showToast === 'function') showToast('Hãy chọn lớp trước', 'error');
        return;
    }
    if (!students.some(s => s.classId === currentClassId)) {
        if (typeof showToast === 'function') showToast('Lớp này chưa có học sinh', 'error');
        return;
    }
    _dgDungKhung();
    _dgVeChon('dgChonQuy', DG_QUY_DAU, _dgQuyDau, 'dgDatQuy', n => `${n} điểm`);
    _dgVeChon('dgChonGiay', DG_GIAY, _dgGiay, 'dgDatGiay', n => `${n} giây`);
    _dgVeChonKieu();
    _dgVeDanhSach();
    const e = document.getElementById('dgSetup');
    e.classList.remove('hidden'); e.classList.add('flex');
}
function closeDgSetup() {
    const e = document.getElementById('dgSetup');
    e.classList.add('hidden'); e.classList.remove('flex');
}
function _dgVeChon(oid, ds, dangChon, ham, nhan) {
    const o = document.getElementById(oid);
    if (!o) return;
    o.innerHTML = ds.map(n => `
      <button onclick="${ham}(${n})"
        class="px-5 py-2 rounded-xl font-bold text-sm ${dangChon === n ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
        style="min-height:44px">${nhan(n)}</button>`).join('');
}
function dgDatQuy(n) { _dgQuyDau = n; _dgVeChon('dgChonQuy', DG_QUY_DAU, n, 'dgDatQuy', x => `${x} điểm`); _dgTomTat(); }
function dgDatGiay(n) { _dgGiay = n; _dgVeChon('dgChonGiay', DG_GIAY, n, 'dgDatGiay', x => `${x} giây`); }

function _dgCoNhom() {
    return typeof _groupResult !== 'undefined' && Array.isArray(_groupResult)
        && _groupResult.length > 0 && _groupResult.some(g => g && g.length);
}
function _dgVeChonKieu() {
    const o = document.getElementById('dgChonKieu');
    if (!o) return;
    const coNhom = _dgCoNhom();
    if (!coNhom) _dgTheoNhom = false;
    const nut = (nhom, nhan, bat) => `
      <button onclick="dgDoiKieu(${nhom})" ${bat ? '' : 'disabled'}
        class="px-4 py-2 rounded-xl font-bold text-sm ${_dgTheoNhom === nhom
            ? 'bg-amber-600 text-white'
            : bat ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gray-50 text-gray-300 cursor-not-allowed'}"
        style="min-height:44px">${nhan}</button>`;
    o.innerHTML = nut(true, '👥 Theo nhóm', coNhom) + nut(false, '🙋 Từng học sinh', true)
        + (coNhom ? '' : '<span class="text-xs text-gray-400 self-center ml-1">Hãy dùng "Chia nhóm ngẫu nhiên" trước</span>');
}
function dgDoiKieu(n) { _dgTheoNhom = !!n; _dgVeChonKieu(); _dgVeDanhSach(); }
function _dgNguon() {
    const ds = students.filter(s => s.classId === currentClassId)
                       .sort((a, b) => (a.stt || 999) - (b.stt || 999));
    if (_dgTheoNhom && _dgCoNhom()) {
        return _groupResult.map((mems, gi) => ({
            id: 'g' + gi, ten: 'Nhóm ' + (gi + 1),
            ids: mems.map(m => m.id).filter(id => ds.some(s => s.id === id)),
            phu: mems.length + ' bạn'
        })).filter(d => d.ids.length);
    }
    return ds.map(s => ({ id: 's' + s.id, ten: s.name, ids: [s.id], phu: 'STT ' + (s.stt ?? '-') }));
}
function _dgVeDanhSach() {
    const o = document.getElementById('dgDanhSach');
    if (!o) return;
    const nguon = _dgNguon();
    if (!_dgDoi.length || _dgDoi[0]._kieu !== _dgTheoNhom) {
        _dgDoi = nguon.map(d => ({ ...d, _kieu: _dgTheoNhom, chon: true }));
    }
    o.innerHTML = _dgDoi.map((d, i) => `
      <button onclick="dgChonDoi(${i})"
        class="rounded-xl border-2 p-2 text-left ${d.chon ? 'border-amber-500 bg-amber-50' : 'border-gray-200 bg-white opacity-60'}"
        style="min-height:44px">
        <p class="font-bold text-sm text-gray-800 truncate">${d.chon ? '✅ ' : ''}${d.ten}</p>
        <p class="text-[11px] text-gray-500">${d.phu}</p>
      </button>`).join('');
    _dgTomTat();
}
function dgChonDoi(i) { if (_dgDoi[i]) { _dgDoi[i].chon = !_dgDoi[i].chon; _dgVeDanhSach(); } }
function _dgTomTat() {
    const n = _dgDoi.filter(d => d.chon).length;
    const t = document.getElementById('dgTomTat');
    if (t) t.textContent = `${n} ${_dgTheoNhom ? 'nhóm' : 'bạn'} · mỗi bên ${_dgQuyDau} điểm vốn`;
    const b = document.getElementById('dgNutBD');
    if (b) b.disabled = n < 2;
}

// ── Vào trận ─────────────────────────────────────────────────────────────────
function batDauDauGia() {
    const chon = _dgDoi.filter(d => d.chon);
    if (chon.length < 2) {
        if (typeof showToast === 'function') showToast('Cần ít nhất 2 đội để đấu giá', 'error');
        return;
    }
    _dgDoi = chon.map((d, i) => ({ id: d.id, ten: d.ten, ids: [...d.ids],
                                   quy: _dgQuyDau, gia: 0, mau: DG_MAU[i % DG_MAU.length] }));
    _dgCau = 1;
    _dgNhatKy = null;
    _dgVeCauMoi();
    closeDgSetup();
    document.getElementById('dgGame').classList.remove('hidden');
    _dgBatNhac();
}
function dongDauGia() {
    _dgDungDongHo();
    _dgDungNhac();
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    document.getElementById('dgGame')?.classList.add('hidden');
}
function _dgLoi(t) { const e = document.getElementById('dgLoi'); if (e) e.textContent = t; }

function _dgVeCauMoi() {
    _dgDungDongHo();
    _dgTrangThai = 'CHO';
    _dgNguoiTL = null;
    _dgDaTL = [];
    _dgConLai = 0;
    _dgDoi.forEach(d => { d.gia = 0; });
    _dgCapNhat();
    _dgLoi(`Câu ${_dgCau} — nêu câu hỏi rồi bấm "Mở đấu giá"`);
}

// ── Đấu giá ──────────────────────────────────────────────────────────────────
function dgMoDauGia() {
    if (_dgTrangThai !== 'CHO') return;
    if (!_dgDoi.some(d => d.quy > 0)) {
        if (typeof showToast === 'function') showToast('Không đội nào còn điểm để đặt', 'error');
        return;
    }
    _dgTrangThai = 'DAUGIA';
    _dgConLai = _dgGiay;
    _dgCapNhat();
    _dgLoi('Đấu giá đang mở — bấm +1 hoặc +5 ở nhóm trả giá');
    _dgChayDongHo();
}

function _dgChayDongHo() {
    _dgDungDongHo();
    _dgDongHo = setInterval(() => {
        _dgConLai--;
        if (_dgConLai <= 5 && _dgConLai > 0) _dgTieng('tich');
        _dgVeDongHo();
        if (_dgConLai <= 0) dgChotBua();
    }, 1000);
    _dgVeDongHo();
}
function _dgDungDongHo() {
    if (_dgDongHo) { clearInterval(_dgDongHo); _dgDongHo = null; }
}
function _dgVeDongHo() {
    const s = document.getElementById('dgGiay');
    const t = document.getElementById('dgThanh');
    const dh = document.getElementById('dgDongHo');
    if (!s || !t || !dh) return;
    if (_dgTrangThai !== 'DAUGIA') {
        s.textContent = '--'; t.style.width = '0%'; dh.classList.remove('gap');
        return;
    }
    s.textContent = Math.max(0, _dgConLai) + 's';
    t.style.width = Math.max(0, Math.min(100, _dgConLai / _dgGiay * 100)) + '%';
    dh.classList.toggle('gap', _dgConLai <= 5);
}

function dgTraGia(i, buoc) {
    if (_dgTrangThai !== 'DAUGIA') return;
    const d = _dgDoi[i];
    if (!d) return;
    const cao = _dgGiaCaoNhat();
    const moi = Math.max(d.gia + buoc, cao.gia + 1 > d.gia + buoc ? d.gia + buoc : d.gia + buoc);
    if (moi > d.quy) {
        _dgLoi(`${d.ten} chỉ còn ${d.quy} điểm, không đặt thêm được`);
        return;
    }
    d.gia = moi;
    _dgTieng('gia');
    // có người trả giá thì nới đồng hồ ra, "ai hơn nữa không?"
    if (_dgConLai < DG_NOI) { _dgConLai = DG_NOI; _dgChayDongHo(); }
    const g = document.getElementById('dgGiaCao');
    if (g && !_dgGiam()) { g.classList.remove('len'); void g.offsetWidth; g.classList.add('len'); }
    _dgCapNhat();
    _dgLoi(`${d.ten} trả giá ${d.gia} điểm — ai hơn nữa không?`);
}

function _dgGiaCaoNhat(bo) {
    let cao = { gia: 0, i: -1 };
    _dgDoi.forEach((d, i) => {
        if (bo && bo.includes(i)) return;
        if (d.gia > cao.gia) cao = { gia: d.gia, i };
    });
    return cao;
}

function dgChotBua() {
    if (_dgTrangThai !== 'DAUGIA') return;
    _dgDungDongHo();
    const cao = _dgGiaCaoNhat();
    _dgTieng('bua');
    if (cao.i < 0) {
        _dgTrangThai = 'XONG';
        _dgCapNhat();
        _dgLoi('Không nhóm nào trả giá — chuyển câu khác');
        return;
    }
    _dgTrangThai = 'TRALOI';
    _dgNguoiTL = cao.i;
    _dgAmNho(true);
    _dgCapNhat();
    _dgLoi(`🔨 Búa gõ! ${_dgDoi[cao.i].ten} giành quyền trả lời với ${cao.gia} điểm`);
}

// ── Kết quả trả lời ──────────────────────────────────────────────────────────
function dgKetQua(dung) {
    if (_dgTrangThai !== 'TRALOI' || _dgNguoiTL === null) return;
    const i = _dgNguoiTL, d = _dgDoi[i];
    const cuoc = d.gia;
    if (dung) {
        d.quy += cuoc;
        _dgTieng('dung');
        _dgTrangThai = 'XONG';
        _dgNguoiTL = null;
        _dgAmNho(false);
        _dgCapNhat();
        _dgLoi(`✅ ${d.ten} trả lời đúng, được thêm ${cuoc} điểm — quỹ còn ${d.quy}`);
        if (typeof confetti === 'function' && !_dgGiam()) {
            confetti({ particleCount: 110, spread: 90, origin: { y: .4 },
                       colors: ['#fbbf24', '#22c55e', '#fff'] });
        }
        return;
    }
    d.quy = Math.max(0, d.quy - cuoc);
    d.gia = 0;
    _dgDaTL.push(i);
    _dgTieng('sai');
    const ke = _dgGiaCaoNhat(_dgDaTL);
    if (ke.i >= 0) {
        _dgNguoiTL = ke.i;
        _dgCapNhat();
        _dgLoi(`❌ ${d.ten} sai, mất ${cuoc} điểm — chuyển cho ${_dgDoi[ke.i].ten} với ${ke.gia} điểm`);
    } else {
        _dgTrangThai = 'XONG';
        _dgNguoiTL = null;
        _dgAmNho(false);
        _dgCapNhat();
        _dgLoi(`❌ ${d.ten} sai, mất ${cuoc} điểm — không còn nhóm nào trả giá`);
    }
}

function dgCauTiep() {
    _dgCau++;
    _dgVeCauMoi();
}

// ── Vẽ lại màn hình ──────────────────────────────────────────────────────────
function _dgCapNhat() {
    const cao = _dgGiaCaoNhat();
    const gc = document.getElementById('dgGiaCao');
    const cg = document.getElementById('dgChuGia');
    const nh = document.getElementById('dgNhan');
    if (nh) nh.textContent = _dgTrangThai === 'TRALOI' ? 'ĐANG TRẢ LỜI' : 'GIÁ CAO NHẤT';
    if (_dgTrangThai === 'TRALOI' && _dgNguoiTL !== null) {
        const d = _dgDoi[_dgNguoiTL];
        if (gc) gc.textContent = d.gia;
        if (cg) { cg.textContent = d.ten; cg.style.color = d.mau; }
    } else {
        if (gc) gc.textContent = cao.gia;
        if (cg) {
            cg.textContent = cao.i >= 0 ? _dgDoi[cao.i].ten : 'chưa ai trả giá';
            cg.style.color = cao.i >= 0 ? _dgDoi[cao.i].mau : 'rgba(255,255,255,.5)';
        }
    }
    _dgVeDongHo();
    _dgVeBang(cao);
    _dgVeNut();
}

function _dgVeBang(cao) {
    const o = document.getElementById('dgBang');
    if (!o) return;
    const dangDG = _dgTrangThai === 'DAUGIA';
    o.innerHTML = _dgDoi.map((d, i) => {
        const lai = d.quy - _dgQuyDau;
        const thang = _dgTrangThai === 'TRALOI' && _dgNguoiTL === i;
        return `
      <div class="dg-the ${cao.i === i && cao.gia > 0 && dangDG ? 'dan' : ''} ${thang ? 'thang' : ''} ${d.quy <= 0 ? 'het' : ''}">
        <div class="dau">
          <span class="ten" style="color:${d.mau}">${d.ten}</span>
          <span class="quy">${d.quy} đ</span>
        </div>
        <span class="lai ${lai > 0 ? 'duong' : lai < 0 ? 'am' : ''}">${
            lai > 0 ? 'lãi +' + lai : lai < 0 ? 'lỗ ' + lai : 'hoà vốn'}</span>
        <div class="dat">
          <span class="gia">${d.gia}</span>
          ${DG_BUOC.map(b => `<button onclick="dgTraGia(${i},${b})"
              ${!dangDG || d.gia + b > d.quy ? 'disabled' : ''}
              aria-label="${d.ten} trả thêm ${b} điểm">+${b}</button>`).join('')}
        </div>
      </div>`;
    }).join('');
}

function _dgVeNut() {
    const o = document.getElementById('dgAct');
    if (!o) return;
    const coDiem = _dgDoi.some(d => d.quy - _dgQuyDau > 0);
    const cong = `<button class="dg-nut dg-phu" onclick="dgCongDiem()" ${coDiem ? '' : 'disabled'}>💰 Kết thúc &amp; cộng điểm</button>`;
    if (_dgTrangThai === 'CHO') {
        o.innerHTML = `<button class="dg-nut dg-mo" onclick="dgMoDauGia()">🔔 MỞ ĐẤU GIÁ</button>` + cong;
    } else if (_dgTrangThai === 'DAUGIA') {
        o.innerHTML = `<button class="dg-nut dg-bua" onclick="dgChotBua()">🔨 CHỐT BÚA NGAY</button>`;
    } else if (_dgTrangThai === 'TRALOI') {
        o.innerHTML = `<button class="dg-nut dg-dung" onclick="dgKetQua(true)">✅ TRẢ LỜI ĐÚNG</button>
                       <button class="dg-nut dg-sai" onclick="dgKetQua(false)">❌ TRẢ LỜI SAI</button>`;
    } else {
        o.innerHTML = `<button class="dg-nut dg-mo" onclick="dgCauTiep()">➡️ CÂU TIẾP THEO</button>` + cong;
    }
}

// ── Cộng điểm ────────────────────────────────────────────────────────────────
function dgCongDiem() {
    const an = _dgDoi.map(d => ({ d, lai: d.quy - _dgQuyDau })).filter(x => x.lai > 0);
    if (!an.length) {
        if (typeof showToast === 'function') showToast('Chưa đội nào kiếm thêm được điểm', 'error');
        return;
    }
    const tom = an.map(x => `${x.d.ten}: +${x.lai}`).join(', ');
    if (!confirm(`Cộng phần kiếm thêm cho ${an.length} đội?\n\n${tom}`)) return;
    const ghi = []; const now = new Date().toISOString();
    an.forEach(({ d, lai }) => {
        d.ids.forEach(sid => {
            const s = students.find(x => x.id === sid);
            if (!s) return;
            const cu = s.points;
            s.points += lai; s.positivePoints += lai;
            const id = Date.now() + Math.random();
            ghi.push({ lichSuId: id, studentId: s.id, diem: lai });
            history.push({ id, classId: currentClassId, studentId: s.id, studentName: s.name,
                           skillName: 'Đấu Giá Tri Thức', points: lai, timestamp: now });
            if (typeof checkMilestone === 'function') checkMilestone(s, cu);
            if (typeof checkGoalAchievements === 'function') setTimeout(() => checkGoalAchievements(s.id), 100);
        });
    });
    _dgLuu();
    _dgNhatKy = ghi;
    document.getElementById('dgNutHoanTac')?.classList.remove('hidden');
    _dgDoi.forEach(d => { d.quy = _dgQuyDau; d.gia = 0; });
    _dgVeCauMoi();
    _dgLoi(`💰 Đã cộng điểm — ${tom}`);
    if (typeof showToast === 'function') showToast('Đã cộng điểm và đồng bộ', 'success');
}
function dgHoanTac() {
    if (!_dgNhatKy || !_dgNhatKy.length) return;
    _dgNhatKy.forEach(g => {
        const s = students.find(x => x.id === g.studentId);
        if (s) { s.points -= g.diem; s.positivePoints -= g.diem; }
        const k = history.findIndex(h => h.id === g.lichSuId);
        if (k > -1) history.splice(k, 1);
    });
    _dgNhatKy = null;
    document.getElementById('dgNutHoanTac')?.classList.add('hidden');
    _dgLuu();
    _dgLoi('↩️ Đã hoàn tác lần cộng điểm vừa rồi');
    if (typeof showToast === 'function') showToast('Đã hoàn tác', 'success');
}
function _dgLuu() {
    if (typeof saveData === 'function') saveData();
    if (typeof scheduleAutoSync === 'function') scheduleAutoSync();
    if (typeof renderStudents === 'function' && typeof currentView !== 'undefined' && currentView === 'classroom') renderStudents();
    else if (typeof renderReport === 'function') renderReport();
}
