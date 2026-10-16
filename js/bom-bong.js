// ============================================================
// BƠM BÓNG — ĐÚNG LIÊN TIẾP MỚI ĂN ĐIỂM
// ------------------------------------------------------------
// Các nhóm chơi SONG SONG. Mỗi vòng thầy cô ra một câu hỏi, rồi bấm vào
// nhóm nào trả lời đúng để chốt vòng đó cho nhóm ấy.
//
//   Đúng liên tiếp 3 vòng  -> qua mức 2, nhóm giữ được  1 điểm
//   3 vòng nữa             -> qua mức 3, giữ thêm       2 điểm
//   3 vòng nữa             -> qua mức 4, giữ thêm       3 điểm
//   3 vòng nữa             -> hoàn thành, giữ thêm      5 điểm   (tổng 11)
//
// Sai một vòng là bóng xẹp: về mức 1 và MẤT SẠCH điểm đang giữ.
// Điểm chỉ thật sự vào sổ khi thầy cô bấm "Kết thúc & cộng điểm".
//
// Giao diện tự dựng trong file này, không phụ thuộc file khác.
// ============================================================

const BB_MOC_DIEM = [1, 2, 3, 5];   // điểm giữ thêm khi qua từng mức
const BB_CAN_DUNG = 3;              // số vòng đúng liên tiếp để qua một mức

let _bbDoi      = [];     // [{ id, ten, phu, ids, muc, dung, giu, xong, chamVong, hieu }]
let _bbVong     = 1;
let _bbTheoNhom = true;
let _bbNhatKy   = null;   // lần cộng điểm gần nhất, để hoàn tác
let _bbVeTimer  = null;
let _bbT        = 0;
let _bbTheHep   = false;  // thẻ hẹp (điện thoại) thì dùng nhãn gọn

function _bbGiam() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
function _bbTongMoc() { return BB_MOC_DIEM.reduce((a, b) => a + b, 0); }
function _bbTongVong() { return BB_MOC_DIEM.length * BB_CAN_DUNG; }

// ── Bảng màu và kiểu dáng ────────────────────────────────────────────────────
function _bbDungKieu() {
    if (document.getElementById('bbKieu')) return;
    const st = document.createElement('style');
    st.id = 'bbKieu';
    st.textContent = `
.bb{
  --bb-nen:#0b1220; --bb-nen-2:#172554; --bb-nen-3:#1e1b4b;
  --bb-chu:#fff; --bb-mo:rgba(255,255,255,.6);
  --bb-vang:#fbbf24; --bb-xanh:#22c55e; --bb-do:#ef4444;
  --bb-mat:rgba(255,255,255,.09); --bb-vien:rgba(255,255,255,.16);
  --bb-r:16px; --bb-r-to:24px; --bb-1:4px; --bb-2:8px; --bb-3:14px; --bb-4:22px;
  --bb-cham:44px;
  background:linear-gradient(160deg,var(--bb-nen),var(--bb-nen-2) 55%,var(--bb-nen-3));
  color:var(--bb-chu); font-family:"Be Vietnam Pro",system-ui,sans-serif;
}
.bb button:focus-visible{outline:3px solid var(--bb-vang);outline-offset:3px;border-radius:var(--bb-r)}
.bb-bar{display:flex;align-items:center;justify-content:space-between;gap:var(--bb-2);
  padding:var(--bb-2) var(--bb-3);flex-shrink:0}
.bb-bar p{margin:0;flex:1;min-width:0;text-align:center;color:var(--bb-mo);font-weight:700;
  font-size:.95rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bb-ghost{display:inline-flex;align-items:center;justify-content:center;gap:var(--bb-2);
  min-height:var(--bb-cham);min-width:var(--bb-cham);padding:0 var(--bb-3);border-radius:var(--bb-r);
  background:var(--bb-mat);color:var(--bb-chu);font-weight:700;font-size:.9rem;transition:background .18s ease-out}
.bb-ghost:hover{background:var(--bb-vien)}
.bb-hide-sm{display:none}
.bb-chi-sm{display:inline}
@media(min-width:760px){.bb-chi-sm{display:none}}
/* Tailwind nạp qua CDN nên thứ tự không chắc: ép .hidden thắng trong phạm vi .bb */
.bb .hidden{display:none !important}
@media(min-width:760px){.bb-hide-sm{display:inline}}

.bb-luoi{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;display:grid;gap:var(--bb-3);
  padding:var(--bb-2) var(--bb-3);align-content:center;justify-content:center;
  grid-template-columns:repeat(1,minmax(0,1fr))}

/* Mỗi nhóm một thẻ: bấm vào thẻ là chốt vòng đó cho nhóm */
.bb-the{position:relative;display:flex;flex-direction:column;align-items:center;gap:var(--bb-1);
  padding:var(--bb-3) var(--bb-2) var(--bb-2);border-radius:var(--bb-r-to);
  background:var(--bb-mat);border:2px solid var(--bb-vien);cursor:pointer;
  transition:transform .15s ease-out,border-color .15s ease-out,background .15s ease-out}
.bb-the:hover{border-color:var(--bb-vang)}
.bb-the:active{transform:scale(.98)}
.bb-the.dung{border-color:var(--bb-xanh);background:rgba(34,197,94,.18)}
.bb-the.sai{border-color:var(--bb-do);background:rgba(239,68,68,.18)}
.bb-the.xong{border-color:var(--bb-vang);background:rgba(251,191,36,.18)}
.bb-the canvas{display:block;width:100%;max-width:var(--bb-canvas,150px);height:auto;margin:0 auto}
.bb-the .ten{font-weight:900;font-size:clamp(.95rem,1.9vw,2rem);text-align:center;
  max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bb-the .muc{font-weight:800;font-size:clamp(.75rem,1vw,1.15rem);color:var(--bb-mo);text-align:center;
  white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis}
.bb-the .cham{display:flex;gap:6px;margin-top:2px}
.bb-the .cham i{width:clamp(12px,1.1vw,20px);height:clamp(12px,1.1vw,20px);border-radius:50%;background:var(--bb-vien);display:block}
.bb-the .cham i.on{background:var(--bb-xanh)}
.bb-the .giu{font-weight:900;color:var(--bb-vang);font-size:clamp(1rem,2.4vw,1.8rem);text-align:center;
  white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis}
.bb-the .sainut{position:absolute;top:4px;right:4px;width:44px;height:44px;border-radius:14px;
  background:rgba(239,68,68,.75);color:#fff;font-weight:900;display:flex;align-items:center;justify-content:center}
.bb-the .sainut:hover{background:var(--bb-do)}
/* đã chấm rồi thì giấu nút sai cho khỏi đè lên nhãn và khỏi bấm nhầm */
.bb-the.dung .sainut,.bb-the.sai .sainut,.bb-the.xong .sainut{display:none}
.bb-the .khoa{position:absolute;inset:0;border-radius:var(--bb-r-to);background:rgba(0,0,0,.22);
  display:none;align-items:flex-start;justify-content:center;padding-top:10px;
  font-weight:900;font-size:.8rem;pointer-events:none}
.bb-the .khoa span{background:rgba(0,0,0,.72);border-radius:999px;padding:4px 14px;font-size:clamp(.75rem,.9vw,1.05rem)}
.bb-the .khoa.hien{display:flex}

.bb-act{flex-shrink:0;display:flex;justify-content:center;gap:var(--bb-3);flex-wrap:wrap;padding:var(--bb-2) var(--bb-3)}
.bb-nut{display:inline-flex;align-items:center;justify-content:center;gap:var(--bb-2);
  min-height:var(--bb-cham);padding:var(--bb-3) clamp(22px,5vw,46px);border-radius:var(--bb-r-to);
  font-weight:900;font-size:clamp(1rem,2.2vw,1.45rem);transition:transform .15s ease-out}
.bb-nut:active{transform:translateY(5px)}
.bb-tiep{background:linear-gradient(180deg,#a78bfa,#7c3aed);color:#fff;box-shadow:0 7px 0 #5b21b6}
.bb-cong{background:linear-gradient(180deg,#fcd34d,#f59e0b);color:#2b1a00;box-shadow:0 7px 0 #b45309}
.bb-nut:disabled{background:var(--bb-mat);color:var(--bb-mo);box-shadow:none;cursor:not-allowed}
.bb-dai{flex-shrink:0;text-align:center;padding:0 var(--bb-3) var(--bb-3)}
#bbLoi{font-weight:900;line-height:1.1;font-size:clamp(1.1rem,3.2vw,2.2rem);min-height:1.2em}
#bbLoi .nho{display:block;font-size:.5em;opacity:.65;font-weight:700}
@media(max-width:560px){
  .bb-nut{padding:10px 14px;font-size:1rem;border-radius:16px;box-shadow:0 5px 0 rgba(0,0,0,.35)}
  .bb-act{gap:10px;padding:6px 10px}
  .bb-dai{padding:0 10px 8px}
  #bbLoi{font-size:clamp(1rem,4.2vw,1.3rem)}
  .bb-bar{padding:6px 10px}
}
@media(prefers-reduced-motion:reduce){
  .bb *,.bb *::before,.bb *::after{animation-duration:.01ms !important;transition-duration:.01ms !important}
}`;
    document.head.appendChild(st);
}

// ── Dựng khung ───────────────────────────────────────────────────────────────
function _bbDungKhung() {
    if (document.getElementById('bbRoot')) return;
    _bbDungKieu();
    const root = document.createElement('div');
    root.id = 'bbRoot';
    root.innerHTML = `
      <div id="bbSetup" class="fixed inset-0 z-[127] hidden items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
        <div class="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
          <div class="px-6 py-4 border-b flex items-center justify-between flex-shrink-0">
            <div>
              <h2 class="text-2xl font-black text-gray-800">🎈 Bơm Bóng</h2>
              <p class="text-gray-500 text-sm mt-0.5">Đúng liên tiếp 3 vòng mới qua một mức — sai một vòng là mất sạch</p>
            </div>
            <button onclick="closeBbSetup()" aria-label="Đóng" class="text-gray-400 hover:text-gray-700 text-2xl" style="min-width:44px;min-height:44px">&times;</button>
          </div>
          <div class="flex-1 overflow-y-auto p-5 space-y-5">
            <div class="bg-violet-50 border border-violet-200 rounded-2xl p-4">
              <p class="font-black text-violet-800 text-sm mb-2">Luật chơi</p>
              <div id="bbLuat" class="grid grid-cols-2 sm:grid-cols-4 gap-2"></div>
              <p class="text-violet-700 text-xs mt-2 font-semibold">Sai một vòng là về mức 1 và mất hết điểm đang giữ.</p>
            </div>
            <div>
              <h3 class="font-black text-gray-800 mb-2">Ai chơi</h3>
              <div id="bbChonKieu" class="flex gap-2 mb-3 flex-wrap"></div>
              <div id="bbDanhSach" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-56 overflow-y-auto p-1"></div>
            </div>
          </div>
          <div class="px-6 py-4 border-t flex items-center justify-between flex-shrink-0 bg-gray-50">
            <span id="bbTomTat" class="text-gray-600 font-bold text-sm"></span>
            <button onclick="batDauBomBong()" class="bg-violet-600 hover:bg-violet-500 text-white font-black px-7 py-3 rounded-2xl" style="min-height:44px">
              <i class="fas fa-play mr-1" aria-hidden="true"></i> Bắt đầu
            </button>
          </div>
        </div>
      </div>

      <div id="bbGame" class="bb fixed inset-0 z-[128] hidden flex-col" role="dialog" aria-label="Trò chơi Bơm Bóng">
        <header class="bb-bar">
          <button onclick="closeBbGame()" class="bb-ghost" aria-label="Thoát trò chơi">
            <i class="fas fa-arrow-left" aria-hidden="true"></i><span class="bb-hide-sm">Thoát</span>
          </button>
          <p id="bbTienDo" aria-live="polite"></p>
          <div style="display:flex;gap:8px">
            <button onclick="bbHoanTac()" id="bbNutHoanTac" class="bb-ghost hidden" aria-label="Hoàn tác lần cộng điểm vừa rồi">
              <i class="fas fa-rotate-left" aria-hidden="true"></i><span class="bb-hide-sm">Hoàn tác</span>
            </button>
            <button onclick="bbDoiFull()" class="bb-ghost" aria-label="Bật tắt toàn màn hình, phím F">
              <i class="fas fa-expand-arrows-alt" aria-hidden="true"></i><span class="bb-hide-sm">Toàn màn hình (F)</span>
            </button>
          </div>
        </header>

        <div id="bbLuoi" class="bb-luoi"></div>

        <div class="bb-act">
          <button onclick="bbVongTiep()" class="bb-nut bb-tiep"
                  aria-label="Sang vòng tiếp theo, phím cách"
            ><span class="bb-hide-sm">➡️ VÒNG TIẾP THEO</span><span class="bb-chi-sm">➡️ TIẾP THEO</span></button>
          <button onclick="bbCongDiem()" id="bbNutCong" class="bb-nut bb-cong"
                  aria-label="Kết thúc và cộng điểm đang giữ vào sổ"
            ><span class="bb-hide-sm">💰 Kết thúc &amp; cộng điểm</span><span class="bb-chi-sm">💰 Cộng điểm</span></button>
        </div>
        <footer class="bb-dai"><div id="bbLoi" aria-live="polite"></div></footer>
      </div>`;
    document.body.appendChild(root);
    document.addEventListener('keydown', _bbPhim);
    const xep = () => { if (!document.getElementById('bbGame')?.classList.contains('hidden')) _bbXepLuoi(); };
    window.addEventListener('resize', xep);
    document.addEventListener('fullscreenchange', () => setTimeout(xep, 120));
}

function _bbPhim(e) {
    const g = document.getElementById('bbGame');
    if (!g || g.classList.contains('hidden')) return;
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
    if (e.key === 'f' || e.key === 'F') { e.preventDefault(); bbDoiFull(); }
    else if (e.key === 'Escape') closeBbGame();
    else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); bbVongTiep(); }
}
function _bbHien(id, hien) {
    const e = document.getElementById(id);
    if (!e) return;
    if (hien) { e.classList.remove('hidden'); e.classList.add('flex'); }
    else { e.classList.add('hidden'); e.classList.remove('flex'); }
}
function bbDoiFull() {
    const el = document.getElementById('bbGame');
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    else el?.requestFullscreen?.().catch(() => {});
}

// ── Màn hình chuẩn bị ────────────────────────────────────────────────────────
function openBomBong() {
    if (!currentClassId) {
        if (typeof showToast === 'function') showToast('Hãy chọn lớp trước', 'error');
        return;
    }
    const ds = (typeof getActiveStudents === 'function')
        ? getActiveStudents()
        : students.filter(s => s.classId === currentClassId);
    if (!ds.length) {
        if (typeof showToast === 'function') showToast('Lớp này chưa có học sinh', 'error');
        return;
    }
    _bbDungKhung();
    _bbTheoNhom = true;
    _bbVeLuat();
    _bbVeChonKieu();
    _bbVeDanhSach();
    _bbHien('bbSetup', true);
}
function closeBbSetup() { _bbHien('bbSetup', false); }

function _bbVeLuat() {
    const o = document.getElementById('bbLuat');
    if (!o) return;
    o.innerHTML = BB_MOC_DIEM.map((d, i) => `
      <div class="bg-white rounded-xl border border-violet-200 px-2 py-2 text-center">
        <p class="text-[11px] font-bold text-violet-500">MỨC ${i + 1}</p>
        <p class="text-xs font-bold text-gray-500">${BB_CAN_DUNG} vòng đúng</p>
        <p class="font-black text-violet-700 text-lg leading-tight">+${d} đ</p>
      </div>`).join('');
}

function _bbVeChonKieu() {
    const o = document.getElementById('bbChonKieu');
    if (!o) return;
    const coNhom = _bbCoNhom();
    if (!coNhom) _bbTheoNhom = false;
    const nut = (nhom, nhan, bat) => `
      <button onclick="bbDoiKieu(${nhom})" ${bat ? '' : 'disabled'}
        class="px-4 py-2 rounded-xl font-bold text-sm ${_bbTheoNhom === nhom
            ? 'bg-violet-600 text-white'
            : bat ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gray-50 text-gray-300 cursor-not-allowed'}"
        style="min-height:44px">${nhan}</button>`;
    o.innerHTML = nut(true, '👥 Theo nhóm', coNhom)
        + nut(false, '🙋 Từng học sinh', true)
        + (coNhom ? '' : '<span class="text-xs text-gray-400 self-center ml-1">Hãy dùng "Chia nhóm ngẫu nhiên" trước để chơi theo nhóm</span>');
}
function bbDoiKieu(nhom) { _bbTheoNhom = !!nhom; _bbVeChonKieu(); _bbVeDanhSach(); }

// Nhóm lấy từ chức năng "Chia nhóm ngẫu nhiên" (_groupResult), app không có biến groups
function _bbCoNhom() {
    return typeof _groupResult !== 'undefined' && Array.isArray(_groupResult)
        && _groupResult.length > 0 && _groupResult.some(g => g && g.length);
}

function _bbDanhSachNguon() {
    const ds = (typeof getActiveStudents === 'function')
        ? getActiveStudents()
        : students.filter(s => s.classId === currentClassId);
    if (_bbTheoNhom && _bbCoNhom()) {
        return _groupResult.map((mems, gi) => ({
            id: 'g' + gi,
            ten: 'Nhóm ' + (gi + 1),
            ids: mems.map(m => m.id).filter(id => ds.some(s => s.id === id)),
            phu: mems.length + ' bạn'
        })).filter(d => d.ids.length);
    }
    return ds.map(s => ({ id: 's' + s.id, ten: s.name, ids: [s.id], phu: 'STT ' + (s.stt ?? '-') }));
}

function _bbVeDanhSach() {
    const o = document.getElementById('bbDanhSach');
    if (!o) return;
    const nguon = _bbDanhSachNguon();
    if (!_bbDoi.length || _bbDoi[0]._kieu !== _bbTheoNhom) {
        _bbDoi = nguon.map(d => ({ ...d, _kieu: _bbTheoNhom, chon: true }));
    }
    o.innerHTML = _bbDoi.map((d, i) => `
      <button onclick="bbChonDoi(${i})"
        class="rounded-xl border-2 p-2 text-left ${d.chon
            ? 'border-violet-500 bg-violet-50' : 'border-gray-200 bg-white opacity-60'}"
        style="min-height:44px">
        <p class="font-bold text-sm text-gray-800 truncate">${d.chon ? '✅ ' : ''}${d.ten}</p>
        <p class="text-[11px] text-gray-500">${d.phu}</p>
      </button>`).join('');
    const n = _bbDoi.filter(d => d.chon).length;
    const tt = document.getElementById('bbTomTat');
    if (tt) tt.textContent = `${n} ${_bbTheoNhom ? 'nhóm' : 'bạn'} tham gia · tối đa +${_bbTongMoc()} điểm`;
}
function bbChonDoi(i) { if (_bbDoi[i]) { _bbDoi[i].chon = !_bbDoi[i].chon; _bbVeDanhSach(); } }

// ── Vào trận ─────────────────────────────────────────────────────────────────
function batDauBomBong() {
    const chon = _bbDoi.filter(d => d.chon);
    if (chon.length < 1) {
        if (typeof showToast === 'function') showToast('Chọn ít nhất 1 đội chơi', 'error');
        return;
    }
    _bbDoi = chon.map(d => ({
        id: d.id, ten: d.ten, phu: d.phu, ids: [...d.ids],
        muc: 1, dung: 0, giu: 0, xong: false, chamVong: null, truoc: null, hieu: 0
    }));
    _bbVong = 1;
    _bbNhatKy = null;
    closeBbSetup();
    _bbHien('bbGame', true);
    _bbVeThe();
    _bbCapNhat();
    requestAnimationFrame(_bbXepLuoi);
    bbLoi(`Vòng 1 — ra câu hỏi rồi bấm vào nhóm trả lời đúng<span class="nho">Đúng liên tiếp ${BB_CAN_DUNG} vòng là qua mức</span>`);
    _bbChay();
}
function closeBbGame() {
    _bbDungChay();
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    _bbHien('bbGame', false);
}
function bbLoi(html) { const e = document.getElementById('bbLoi'); if (e) e.innerHTML = html; }

// ── Thẻ từng đội ─────────────────────────────────────────────────────────────
function _bbVeThe() {
    const o = document.getElementById('bbLuoi');
    if (!o) return;
    o.innerHTML = _bbDoi.map((d, i) => `
      <div class="bb-the" id="bbThe${i}" role="button" tabindex="0"
           onclick="bbDung(${i})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();bbDung(${i})}"
           aria-label="${d.ten}: bấm để chốt trả lời đúng vòng này, bấm lại để bỏ">
        <button class="sainut" onclick="event.stopPropagation();bbSai(${i})"
                aria-label="${d.ten} trả lời sai, về mức 1">✗</button>
        <canvas id="bbC${i}" width="300" height="340"></canvas>
        <span class="ten">${d.ten}</span>
        <span class="muc" id="bbMuc${i}"></span>
        <span class="cham" id="bbCham${i}" aria-hidden="true"></span>
        <span class="giu" id="bbGiu${i}"></span>
        <div class="khoa" id="bbKhoa${i}"></div>
      </div>`).join('');
    _bbXepLuoi();
}

// Chọn số cột và cỡ bóng sao cho mọi đội nằm gọn trong màn hình và to nhất có thể.
// Nếu không cách nào gọn (điện thoại, nhiều đội) thì để lưới cuộn dọc với thẻ đủ lớn.
function _bbXepLuoi() {
    const o = document.getElementById('bbLuoi');
    if (!o || !_bbDoi.length) return;
    const n = _bbDoi.length;
    const W = o.clientWidth - 28, H = o.clientHeight - 16;   // trừ đệm hai bên
    if (W <= 0 || H <= 0) return;
    const KHE = 14, TY = 340 / 300;         // khe giữa các thẻ, tỉ lệ cao/rộng của canvas
    // Đo thật phần chữ dưới bóng (tên, mức, chấm, điểm, đệm) thay vì đoán
    const the0 = o.querySelector('.bb-the'), cv0 = the0 && the0.querySelector('canvas');
    const CHU = (the0 && cv0 && the0.offsetHeight > cv0.offsetHeight)
        ? the0.offsetHeight - cv0.offsetHeight : 148;
    let tot = null;
    for (let cot = 1; cot <= n; cot++) {
        const hang = Math.ceil(n / cot);
        const theRong = (W - KHE * (cot - 1)) / cot - 10;
        const theCao  = (H - KHE * (hang - 1)) / hang;
        if (theRong < 140) continue;                 // thẻ hẹp quá thì chữ không đọc được
        const cw = Math.min(theRong, (theCao - CHU) / TY);
        if (cw < 78) continue;                       // bóng nhỏ quá, bỏ cách xếp này
        // Khi bóng xấp xỉ nhau thì chọn cách xếp cho thẻ rộng hơn, chữ dễ đọc hơn
        const diem = cw + Math.min(theRong, 360) * 0.12;
        if (!tot || diem > tot.diem) tot = { cot, cw, diem };
    }
    if (!tot) {                                      // đành cho cuộn dọc
        const cot = Math.max(1, Math.floor(W / 150));
        const theRong = (W - KHE * (cot - 1)) / cot - 10;
        tot = { cot, cw: Math.min(theRong, 160), diem: 0 };
    }
    o.style.gridTemplateColumns = `repeat(${tot.cot},minmax(0,1fr))`;
    const px = Math.floor(Math.min(tot.cw, 480));
    o.style.setProperty('--bb-canvas', px + 'px');
    const hepCu = _bbTheHep;
    _bbTheHep = px < 300;   // thẻ chưa đủ rộng cho nhãn dài thì dùng nhãn gọn
    if (hepCu !== _bbTheHep) _bbCapNhat();      // đổi sang nhãn gọn cho thẻ hẹp
}

function _bbCapNhat() {
    const td = document.getElementById('bbTienDo');
    if (td) {
        const xong = _bbDoi.filter(d => d.xong).length;
        td.textContent = `Vòng ${_bbVong} · mỗi mức ${BB_CAN_DUNG} vòng đúng liên tiếp`
            + (xong ? ` · ${xong} đội đã hoàn thành` : '');
    }
    _bbDoi.forEach((d, D) => {
        const the = document.getElementById('bbThe' + D);
        if (the) {
            the.classList.toggle('dung', d.chamVong === 'dung');
            the.classList.toggle('sai', d.chamVong === 'sai');
            the.classList.toggle('xong', d.xong);
        }
        const m = document.getElementById('bbMuc' + D);
        if (m) m.textContent = d.xong
            ? '🏆 HOÀN THÀNH'
            : _bbTheHep
                ? `Mức ${d.muc} · +${BB_MOC_DIEM[d.muc - 1]}đ`
                : `Mức ${d.muc} · qua mức được +${BB_MOC_DIEM[d.muc - 1]}đ`;
        const c = document.getElementById('bbCham' + D);
        if (c) c.innerHTML = d.xong ? '' : Array.from({ length: BB_CAN_DUNG },
            (_, k) => `<i class="${k < d.dung ? 'on' : ''}"></i>`).join('');
        const g = document.getElementById('bbGiu' + D);
        if (g) g.textContent = d.giu > 0
            ? (_bbTheHep ? `giữ ${d.giu} điểm` : `đang giữ ${d.giu} điểm`)
            : 'chưa có điểm';
        const k = document.getElementById('bbKhoa' + D);
        if (k) {
            k.classList.toggle('hien', !!d.chamVong);
            k.innerHTML = d.chamVong
                ? `<span>${d.chamVong === 'dung' ? '✔ ĐÚNG' : '✘ SAI'} · bấm để bỏ</span>` : '';
        }
    });
    const nc = document.getElementById('bbNutCong');
    if (nc) nc.disabled = !_bbDoi.some(d => d.giu > 0);
}

// ── Chốt vòng cho một đội ────────────────────────────────────────────────────
function _bbLuuTruoc(d) {
    d.truoc = { muc: d.muc, dung: d.dung, giu: d.giu, xong: d.xong };
}

// Bấm lại vào thẻ đã chấm để bỏ chấm — chữa những cú bấm nhầm giữa giờ
function bbBoCham(i) {
    const d = _bbDoi[i];
    if (!d || !d.chamVong || !d.truoc) return;
    d.muc = d.truoc.muc; d.dung = d.truoc.dung; d.giu = d.truoc.giu; d.xong = d.truoc.xong;
    d.chamVong = null; d.truoc = null; d.hieu = 0;
    _bbCapNhat();
    bbLoi(`↩️ Đã bỏ chấm vòng này cho ${d.ten}<span class="nho">Bấm lại vào thẻ để chấm đúng, bấm ✗ nếu sai</span>`);
}

function bbDung(i) {
    const d = _bbDoi[i];
    if (!d) return;
    if (d.chamVong) { bbBoCham(i); return; }   // bỏ chấm được cả khi cú vừa rồi là cú hoàn thành
    if (d.xong) return;
    _bbLuuTruoc(d);
    d.chamVong = 'dung';
    d.dung++;
    d.hieu = 1;                       // hiệu ứng bơm phồng
    if (d.dung >= BB_CAN_DUNG) {       // qua mức
        const them = BB_MOC_DIEM[d.muc - 1];
        d.giu += them;
        d.dung = 0;
        d.hieu = 2;                    // hiệu ứng ăn điểm
        if (d.muc >= BB_MOC_DIEM.length) {
            d.xong = true;
            bbLoi(`🏆 ${d.ten} HOÀN THÀNH — giữ ${d.giu} điểm!<span class="nho">Vượt cả 4 mức</span>`);
        } else {
            d.muc++;
            bbLoi(`🎉 ${d.ten} qua mức ${d.muc} — thêm ${them} điểm, đang giữ ${d.giu}<span class="nho">Mức ${d.muc}: ${BB_CAN_DUNG} vòng đúng nữa được +${BB_MOC_DIEM[d.muc - 1]}đ</span>`);
        }
        if (typeof confetti === 'function' && !_bbGiam()) {
            confetti({ particleCount: 70, spread: 80, origin: { y: .6 },
                       colors: ['#fbbf24', '#22c55e', '#a78bfa'] });
        }
        if (typeof soundSuccess === 'function') soundSuccess();
    } else {
        bbLoi(`${d.ten}: đúng ${d.dung}/${BB_CAN_DUNG} vòng<span class="nho">còn ${BB_CAN_DUNG - d.dung} vòng nữa là +${BB_MOC_DIEM[d.muc - 1]}đ</span>`);
        if (typeof soundPositive === 'function') soundPositive();
    }
    _bbCapNhat();
}

function bbSai(i) {
    const d = _bbDoi[i];
    if (!d || d.chamVong || d.xong) return;
    _bbLuuTruoc(d);
    d.chamVong = 'sai';
    const mat = d.giu;
    d.muc = 1; d.dung = 0; d.giu = 0;
    d.hieu = -1;                       // hiệu ứng bóng xẹp
    if (typeof soundNegative === 'function') soundNegative();
    bbLoi(mat > 0
        ? `💥 ${d.ten} sai — bóng xẹp, mất ${mat} điểm, về mức 1<span class="nho">Bắt đầu lại từ mức 1</span>`
        : `💥 ${d.ten} sai — về mức 1<span class="nho">Chưa có điểm nào để mất</span>`);
    _bbCapNhat();
}

function bbVongTiep() {
    const chuaCham = _bbDoi.filter(d => !d.chamVong && !d.xong).length;
    _bbVong++;
    _bbDoi.forEach(d => { d.chamVong = null; d.truoc = null; });
    _bbCapNhat();
    bbLoi(`Vòng ${_bbVong} — ra câu hỏi rồi bấm vào đội trả lời đúng`
        + (chuaCham ? `<span class="nho">Vòng trước có ${chuaCham} đội chưa chấm, được giữ nguyên</span>`
                    : `<span class="nho">Bấm ✗ ở góc thẻ nếu đội đó trả lời sai</span>`));
}

// ── Vẽ bóng cho từng đội ─────────────────────────────────────────────────────
// Bóng phồng theo tiến độ: (mức-1)*3 + số vòng đúng, trên tổng 12 vòng.
function _bbMauBong(p) {                 // p: 0 -> 1 theo độ phồng
    const mau = [[96, 165, 250], [52, 211, 153], [251, 191, 36], [248, 113, 113]];
    const x = Math.max(0, Math.min(.999, p)) * (mau.length - 1);
    const i = Math.floor(x), t = x - i;
    const a = mau[i], b = mau[Math.min(i + 1, mau.length - 1)];
    return a.map((v, k) => Math.round(v + (b[k] - v) * t));
}

function _bbVeMotBong(cv, d) {
    const ctx = cv.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = cv.clientWidth || 150, H = Math.round(W * 340 / 300);
    if (cv.width !== Math.round(W * dpr)) {
        cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    }
    cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const vong = (d.muc - 1) * BB_CAN_DUNG + d.dung;
    const p = d.xong ? 1 : vong / _bbTongVong();
    const nhip = _bbGiam() ? 0 : Math.sin(_bbT / (d.xong ? 10 : 18 - p * 10)) * (1 + p * 3);
    const no = d.hieu === -1;

    const cx = W / 2;
    const rx = (W * .20 + W * .20 * p) * (no ? .45 : 1) + nhip * .35;
    const ry = rx * 1.18;
    const cy = H * .40;
    const [r, g, b] = _bbMauBong(p);

    // dây
    ctx.strokeStyle = 'rgba(255,255,255,.4)';
    ctx.lineWidth = Math.max(1.4, W * .012);
    ctx.beginPath();
    ctx.moveTo(cx, cy + ry);
    for (let y = 0; y <= H * .30; y += 6) {
        ctx.lineTo(cx + Math.sin(y / 15 + _bbT / 22) * (W * .035), cy + ry + y);
    }
    ctx.stroke();

    // thân bóng
    const grad = ctx.createRadialGradient(cx - rx * .34, cy - ry * .36, rx * .1, cx, cy, ry * 1.06);
    grad.addColorStop(0, `rgba(255,255,255,.92)`);
    grad.addColorStop(.32, `rgb(${r},${g},${b})`);
    grad.addColorStop(1, `rgb(${Math.round(r * .55)},${Math.round(g * .55)},${Math.round(b * .55)})`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    // thắt nút
    ctx.fillStyle = `rgb(${Math.round(r * .65)},${Math.round(g * .65)},${Math.round(b * .65)})`;
    ctx.beginPath();
    ctx.moveTo(cx - rx * .13, cy + ry);
    ctx.lineTo(cx + rx * .13, cy + ry);
    ctx.lineTo(cx, cy + ry + rx * .2);
    ctx.closePath();
    ctx.fill();

    // số vòng đúng liên tiếp in trong bóng
    ctx.fillStyle = 'rgba(0,0,0,.6)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${Math.round(rx * .9)}px "Be Vietnam Pro",system-ui,sans-serif`;
    ctx.fillText(d.xong ? '🏆' : String(vong), cx, cy);

    // vầng sáng khi vừa qua mức
    if (d.hieu === 2) {
        const sang = ctx.createRadialGradient(cx, cy, rx * .5, cx, cy, rx * 2.4);
        sang.addColorStop(0, 'rgba(251,191,36,.55)');
        sang.addColorStop(1, 'rgba(251,191,36,0)');
        ctx.fillStyle = sang;
        ctx.beginPath();
        ctx.arc(cx, cy, rx * 2.4, 0, Math.PI * 2);
        ctx.fill();
    }
    // mảnh vỡ khi xẹp
    if (no) {
        ctx.strokeStyle = 'rgba(239,68,68,.8)';
        ctx.lineWidth = Math.max(1.6, W * .014);
        for (let k = 0; k < 10; k++) {
            const a = (k / 10) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(a) * rx * 1.3, cy + Math.sin(a) * rx * 1.3);
            ctx.lineTo(cx + Math.cos(a) * rx * 2.0, cy + Math.sin(a) * rx * 2.0);
            ctx.stroke();
        }
    }
}

function _bbChay() {
    _bbDungChay();
    const buoc = () => {
        _bbT++;
        _bbDoi.forEach((d, i) => {
            const cv = document.getElementById('bbC' + i);
            if (cv) _bbVeMotBong(cv, d);
        });
        _bbVeTimer = requestAnimationFrame(buoc);
    };
    _bbVeTimer = requestAnimationFrame(buoc);
}
function _bbDungChay() {
    if (_bbVeTimer) cancelAnimationFrame(_bbVeTimer);
    _bbVeTimer = null;
}

// ── Cộng điểm vào sổ ─────────────────────────────────────────────────────────
function bbCongDiem() {
    const an = _bbDoi.filter(d => d.giu > 0);
    if (!an.length) {
        if (typeof showToast === 'function') showToast('Chưa đội nào giữ được điểm', 'error');
        return;
    }
    const tom = an.map(d => `${d.ten}: +${d.giu}`).join(', ');
    if (!confirm(`Cộng điểm cho ${an.length} đội?\n\n${tom}`)) return;

    const ghi = [];
    const now = new Date().toISOString();
    an.forEach(d => {
        d.ids.forEach(sid => {
            const s = students.find(x => x.id === sid);
            if (!s) return;
            const cu = s.points;
            s.points += d.giu;
            s.positivePoints += d.giu;
            const id = Date.now() + Math.random();
            ghi.push({ lichSuId: id, studentId: s.id, diem: d.giu });
            history.push({
                id, classId: currentClassId, studentId: s.id, studentName: s.name,
                skillName: `Bơm Bóng — vượt ${d.muc - (d.xong ? 0 : 1)} mức`,
                points: d.giu, timestamp: now
            });
            if (typeof checkMilestone === 'function') checkMilestone(s, cu);
            if (typeof checkGoalAchievements === 'function') setTimeout(() => checkGoalAchievements(s.id), 100);
        });
    });
    _bbLuu();
    _bbNhatKy = ghi;
    document.getElementById('bbNutHoanTac')?.classList.remove('hidden');
    an.forEach(d => { d.giu = 0; d.muc = 1; d.dung = 0; d.xong = false; d.chamVong = null; d.truoc = null; });
    _bbCapNhat();
    bbLoi(`💰 Đã cộng điểm cho ${an.length} đội<span class="nho">${tom}</span>`);
    if (typeof confetti === 'function' && !_bbGiam()) {
        confetti({ particleCount: 150, spread: 110, origin: { y: .6 } });
    }
    if (typeof showToast === 'function') showToast('Đã cộng điểm và đồng bộ', 'success');
}

function bbHoanTac() {
    if (!_bbNhatKy || !_bbNhatKy.length) return;
    _bbNhatKy.forEach(g => {
        const s = students.find(x => x.id === g.studentId);
        if (s) { s.points -= g.diem; s.positivePoints -= g.diem; }
        const k = history.findIndex(h => h.id === g.lichSuId);
        if (k > -1) history.splice(k, 1);
    });
    _bbNhatKy = null;
    document.getElementById('bbNutHoanTac')?.classList.add('hidden');
    _bbLuu();
    bbLoi('↩️ Đã hoàn tác lần cộng điểm vừa rồi');
    if (typeof showToast === 'function') showToast('Đã hoàn tác', 'success');
}

function _bbLuu() {
    if (typeof saveData === 'function') saveData();
    if (typeof scheduleAutoSync === 'function') scheduleAutoSync();
    if (typeof renderStudents === 'function' && typeof currentView !== 'undefined' && currentView === 'classroom') renderStudents();
    else if (typeof renderReport === 'function') renderReport();
}
