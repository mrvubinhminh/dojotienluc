// ============================================================
// BƠM BÓNG — LIỀU ĂN NHIỀU
// ------------------------------------------------------------
// Trả lời đúng thì bóng phồng thêm một nấc, hũ điểm cộng dồn. Sau mỗi nấc
// nhóm phải chọn: CHỐT để ăn chắc, hay BƠM TIẾP để nhân lên. Bóng có
// ngưỡng nổ ngẫu nhiên không ai biết — nổ là mất trắng.
//
// Hai cách thua: trả lời sai, hoặc tham quá mà bóng nổ.
// Một cách thắng: biết dừng đúng lúc.
//
// Cả giao diện lẫn hiệu ứng nằm gọn trong file này.
// ============================================================

// Thang điểm mặc định (số tam giác): càng bơm càng ăn đậm
const BB_THANG_MAU = [1, 3, 6, 10, 15, 21, 28, 36];
const BB_NGUONG_SOM_MAU = 4;     // sớm nhất là nấc này bóng mới có thể nổ
const BB_GIAY_QUYET_MAU = 8;     // số giây để quyết chốt hay bơm tiếp

let _bbThang      = [...BB_THANG_MAU];
let _bbNguongSom  = BB_NGUONG_SOM_MAU;
let _bbGiayQuyet  = BB_GIAY_QUYET_MAU;
let _bbTheoNhom   = true;
let _bbDoiThu     = [];       // [{ id, ten, ids:[studentId], chon }]
let _bbLuot       = 0;        // chỉ số đội đang tới lượt
let _bbNac        = 0;        // bóng đang ở nấc mấy
let _bbHu         = 0;        // điểm đang treo trong hũ
let _bbNguongNo   = 99;       // nấc mà bóng sẽ nổ, giấu kín
let _bbTrangThai  = 'CHO';    // CHO | HOI | QUYET | XONG
let _bbDiem       = {};       // { doiId: tổng điểm đã chốt }
let _bbNhatKy     = [];       // [{ doiId, ten, diem, ids, lichSuIds }]
let _bbDemNguoc   = null;
let _bbConLai     = 0;
let _bbVeTimer    = null;
let _bbT          = 0;        // đồng hồ cho hiệu ứng rung
let _bbManh       = [];       // mảnh bóng khi nổ
let _bbChop       = 0;        // độ chớp sáng lúc nổ
let _bbDaNo       = false;    // lượt này đã nổ chưa, để thẻ hũ nói đúng

function _bbGiamChuyenDong() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ── Bảng màu và kiểu dáng, khai báo một chỗ ──────────────────────────────────
function _bbDungKieu() {
    if (document.getElementById('bbKieu')) return;
    const st = document.createElement('style');
    st.id = 'bbKieu';
    st.textContent = `
.bb{
  --bb-nen:#0b1220; --bb-nen-2:#172554; --bb-nen-3:#1e1b4b;
  --bb-chu:#fff; --bb-mo:rgba(255,255,255,.62);
  --bb-vang:#fbbf24; --bb-xanh:#22c55e; --bb-do:#ef4444;
  --bb-mat:rgba(255,255,255,.09); --bb-vien:rgba(255,255,255,.16);
  --bb-r:18px; --bb-r-to:26px; --bb-1:4px; --bb-2:8px; --bb-3:14px; --bb-4:22px;
  --bb-cham:44px;
  background:linear-gradient(160deg,var(--bb-nen),var(--bb-nen-2) 55%,var(--bb-nen-3));
  color:var(--bb-chu); font-family:"Be Vietnam Pro",system-ui,sans-serif;
}
.bb button:focus-visible{outline:3px solid var(--bb-vang);outline-offset:3px;border-radius:var(--bb-r)}
.bb-bar{display:flex;align-items:center;justify-content:space-between;gap:var(--bb-2);
  padding:var(--bb-2) var(--bb-3);flex-shrink:0}
.bb-bar p{margin:0;flex:1;min-width:0;text-align:center;color:var(--bb-mo);font-weight:700;
  font-size:.95rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bb-hide-sm{display:none}
@media(min-width:720px){.bb-hide-sm{display:inline}}
.bb-ghost{display:inline-flex;align-items:center;justify-content:center;gap:var(--bb-2);
  min-height:var(--bb-cham);min-width:var(--bb-cham);   /* ẩn chữ thì chỉ còn icon, vẫn phải đủ 44px */
  padding:0 var(--bb-3);border-radius:var(--bb-r);background:var(--bb-mat);color:var(--bb-chu);
  font-weight:700;font-size:.9rem;transition:background .18s ease-out}
.bb-ghost:hover{background:var(--bb-vien)}
.bb-main{flex:1;min-height:0;display:grid;grid-template-columns:1fr;justify-items:center;
  align-content:center;gap:var(--bb-2);padding:var(--bb-1) var(--bb-3);overflow-y:auto}
@media(min-width:900px){
  .bb-main{grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);
    grid-template-rows:minmax(0,1fr);align-items:stretch;overflow:hidden}
  .bb-main .bb-hu{justify-self:end;align-self:center;max-width:290px;padding:var(--bb-4) var(--bb-3)}
  .bb-main .bb-bang{justify-self:start;align-self:center;max-width:290px}
}
.bb-hu{padding:var(--bb-3) var(--bb-3);border-radius:var(--bb-r-to);background:var(--bb-mat);
  border:1px solid var(--bb-vien);text-align:center;width:100%;max-width:420px}
.bb-hu .nhan{font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:var(--bb-mo);font-weight:800}
.bb-hu .so{font-weight:900;font-size:clamp(2rem,6vw,4.6rem);line-height:1;color:var(--bb-vang)}
.bb-hu .nac{font-weight:800;color:var(--bb-mo);margin-top:var(--bb-1)}
/* Màn hẹp: KHÔNG đặt min-height:0, nếu đặt thì hàng chứa bóng co lại nhỏ hơn
   quả bóng và bóng tràn ra đè lên bảng điểm với thẻ hũ hai bên. */
.bb-canvas{position:relative;line-height:0;display:flex;align-items:center;justify-content:center}
.bb-canvas canvas{max-width:min(70vw,24vh);height:auto;display:block}
@media(min-width:900px){
  .bb-canvas{height:100%;min-height:0}
  .bb-canvas canvas{max-width:min(86vw,58vh);max-height:100%;width:auto;height:auto}
}
.bb-bang{width:100%;max-width:420px;display:flex;flex-direction:row;gap:var(--bb-1);
  overflow-x:auto;overflow-y:hidden;padding-bottom:2px}
.bb-bang .nhan{display:none}
.bb-bang .dong{flex:0 0 auto;gap:var(--bb-1);padding:var(--bb-1) var(--bb-2)}
.bb-bang .ten{max-width:92px;font-size:.82rem}
.bb-bang .trong{white-space:nowrap}
@media(min-width:900px){
  .bb-bang{flex-direction:column;max-height:52vh;overflow-y:auto;overflow-x:hidden}
  .bb-bang .nhan{display:block}
  .bb-bang .dong{flex:0 0 auto;gap:var(--bb-2);padding:var(--bb-2) var(--bb-3)}
  .bb-bang .ten{max-width:none;font-size:1rem}
}
.bb-bang .nhan{font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;color:var(--bb-mo);font-weight:800;margin:0 0 var(--bb-1)}
.bb-bang .dong{display:flex;align-items:center;gap:var(--bb-2);padding:var(--bb-2) var(--bb-3);
  border-radius:var(--bb-r);background:var(--bb-mat)}
.bb-bang .dong.luot{background:rgba(251,191,36,.22);border:1px solid var(--bb-vang)}
.bb-bang .ten{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700}
.bb-bang .diem{color:var(--bb-vang);font-weight:900}
.bb-bang .trong{color:var(--bb-mo);font-size:.85rem;font-style:italic;padding:var(--bb-2) var(--bb-3)}
.bb-act{flex-shrink:0;display:flex;justify-content:center;gap:var(--bb-3);flex-wrap:wrap;padding:var(--bb-2) var(--bb-3)}
.bb-nut{display:inline-flex;align-items:center;justify-content:center;gap:var(--bb-2);
  min-height:var(--bb-cham);padding:var(--bb-3) clamp(22px,5vw,46px);border-radius:var(--bb-r-to);
  font-weight:900;font-size:clamp(1rem,2.2vw,1.5rem);transition:transform .15s ease-out,box-shadow .15s ease-out}
.bb-nut:active{transform:translateY(5px)}
.bb-dung{background:linear-gradient(180deg,#34d399,#16a34a);color:#04231a;box-shadow:0 7px 0 #15803d}
.bb-sai{background:linear-gradient(180deg,#f87171,#dc2626);color:#2b0505;box-shadow:0 7px 0 #991b1b}
.bb-chot{background:linear-gradient(180deg,#fcd34d,#f59e0b);color:#2b1a00;box-shadow:0 7px 0 #b45309}
.bb-bom{background:linear-gradient(180deg,#a78bfa,#7c3aed);color:#fff;box-shadow:0 7px 0 #5b21b6}
.bb-nut:disabled{background:var(--bb-mat);color:var(--bb-mo);box-shadow:none;cursor:not-allowed}
.bb-dai{flex-shrink:0;text-align:center;padding:var(--bb-1) var(--bb-3) var(--bb-3)}
#bbLoi{font-weight:900;line-height:1.05;font-size:clamp(1.3rem,5.4vw,4rem);min-height:1.1em}
#bbLoi .nho{display:block;font-size:.34em;opacity:.65;font-weight:800;line-height:1.3}
#bbDem{font-weight:900;color:var(--bb-vang);font-size:clamp(1.1rem,2.6vw,1.9rem);min-height:1.2em}
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
        <div class="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
          <div class="px-6 py-4 border-b flex items-center justify-between flex-shrink-0">
            <div>
              <h2 class="text-2xl font-black text-gray-800">🎈 Bơm Bóng — Liều Ăn Nhiều</h2>
              <p class="text-gray-500 text-sm mt-0.5">Đúng thì bơm, bơm thì ăn đậm — nhưng tham quá là nổ</p>
            </div>
            <button onclick="closeBbSetup()" aria-label="Đóng" class="text-gray-400 hover:text-gray-700 text-2xl" style="min-width:44px;min-height:44px">&times;</button>
          </div>
          <div class="flex-1 overflow-y-auto p-5 space-y-5">
            <div>
              <h3 class="font-black text-gray-800 mb-2">Ai chơi</h3>
              <div id="bbChonKieu" class="flex gap-2 mb-3"></div>
              <div id="bbDanhSach" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-52 overflow-y-auto p-1"></div>
            </div>
            <div>
              <h3 class="font-black text-gray-800 mb-2">Thang điểm từng nấc</h3>
              <div id="bbThangO" class="flex flex-wrap gap-2"></div>
              <p class="text-gray-500 text-xs mt-2">Nấc 1 là điểm ăn được nếu chốt ngay sau câu đầu tiên. Sửa trực tiếp các ô.</p>
            </div>
            <div class="grid sm:grid-cols-2 gap-4">
              <label class="block">
                <span class="font-black text-gray-800 text-sm">Bóng có thể nổ từ nấc</span>
                <input id="bbNguongO" type="number" min="2" max="8" value="4"
                  class="mt-1 w-full border-2 border-gray-200 rounded-xl px-3 py-2 font-black text-center text-gray-800">
                <span class="text-gray-500 text-xs">Trước nấc này bơm vẫn an toàn tuyệt đối</span>
              </label>
              <label class="block">
                <span class="font-black text-gray-800 text-sm">Giây để quyết chốt hay bơm</span>
                <input id="bbGiayO" type="number" min="0" max="30" value="8"
                  class="mt-1 w-full border-2 border-gray-200 rounded-xl px-3 py-2 font-black text-center text-gray-800">
                <span class="text-gray-500 text-xs">Hết giờ thì tự chốt. Để 0 nếu không muốn tính giờ</span>
              </label>
            </div>
          </div>
          <div class="px-6 py-4 border-t flex items-center justify-between flex-shrink-0 bg-gray-50">
            <span id="bbTomTat" class="text-gray-600 font-bold text-sm"></span>
            <button onclick="batDauBomBong()" class="bg-indigo-500 hover:bg-indigo-400 text-white font-black px-7 py-3 rounded-2xl" style="min-height:44px">
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
            <button onclick="bbHoanTac()" id="bbNutHoanTac" class="bb-ghost hidden" aria-label="Hoàn tác lượt vừa rồi">
              <i class="fas fa-rotate-left" aria-hidden="true"></i><span class="bb-hide-sm">Hoàn tác</span>
            </button>
            <button onclick="bbDoiFull()" class="bb-ghost" aria-label="Bật tắt toàn màn hình, phím F">
              <i class="fas fa-expand-arrows-alt" aria-hidden="true"></i><span class="bb-hide-sm">Toàn màn hình (F)</span>
            </button>
          </div>
        </header>

        <main class="bb-main">
          <div id="bbBang" class="bb-bang" aria-label="Bảng điểm"></div>
          <div class="bb-canvas">
            <canvas id="bbCanvas" width="620" height="760" role="img" aria-label="Quả bóng đang bơm"></canvas>
          </div>
          <div id="bbHu" class="bb-hu"></div>
        </main>

        <div id="bbAct" class="bb-act"></div>

        <footer class="bb-dai">
          <div id="bbLoi" aria-live="polite"></div>
          <div id="bbDem"></div>
        </footer>
      </div>`;
    document.body.appendChild(root);
    document.addEventListener('keydown', _bbPhim);
}

function _bbPhim(e) {
    const g = document.getElementById('bbGame');
    if (!g || g.classList.contains('hidden')) return;
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
    if (e.key === 'f' || e.key === 'F') { e.preventDefault(); bbDoiFull(); }
    else if (e.key === 'Escape') closeBbGame();
    else if (_bbTrangThai === 'HOI') {
        if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); bbTraLoi(true); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); bbTraLoi(false); }
    } else if (_bbTrangThai === 'QUYET') {
        if (e.key === ' ') { e.preventDefault(); bbBomTiep(); }
        else if (e.key === 'Enter') { e.preventDefault(); bbChot(); }
    }
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

// ── Màn cài đặt ──────────────────────────────────────────────────────────────
function openBomBong() {
    const hs = (typeof students !== 'undefined' ? students : []).filter(s => s.classId === currentClassId);
    if (!hs.length) { if (typeof showToast === 'function') showToast('Lớp chưa có học sinh!', false); return; }
    _bbDungKhung();
    _bbThang = [...BB_THANG_MAU];
    _bbNguongSom = BB_NGUONG_SOM_MAU;
    _bbGiayQuyet = BB_GIAY_QUYET_MAU;
    _bbTheoNhom = (typeof _groupResult !== 'undefined' && _groupResult.length > 0);
    _bbNapDoi();
    _bbVeChonKieu(); _bbVeThang(); _bbVeDanhSach();
    document.getElementById('bbNguongO').value = _bbNguongSom;
    document.getElementById('bbGiayO').value = _bbGiayQuyet;
    _bbHien('bbSetup', true);
}
function closeBbSetup() { _bbHien('bbSetup', false); }

function _bbNapDoi() {
    const hs = (typeof students !== 'undefined' ? students : []).filter(s => s.classId === currentClassId);
    if (_bbTheoNhom && typeof _groupResult !== 'undefined' && _groupResult.length) {
        _bbDoiThu = _groupResult.map((mems, i) => ({
            id: 'n' + (i + 1), ten: `Nhóm ${i + 1}`,
            ids: mems.map(m => m.id), chon: true,
            phu: mems.length + ' em'
        }));
    } else {
        _bbDoiThu = hs.map((s, i) => ({
            id: 's' + s.id, ten: s.name, ids: [s.id], chon: true, phu: 'Số ' + (s.stt || (i + 1))
        }));
    }
}

function _bbVeChonKieu() {
    const coNhom = (typeof _groupResult !== 'undefined' && _groupResult.length > 0);
    const nut = (nhan, bat, goi, tat) => `
      <button ${tat ? 'disabled' : ''} onclick="${goi}" style="min-height:44px"
        class="px-4 rounded-xl font-bold ${bat ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500'} ${tat ? 'opacity-40 cursor-not-allowed' : ''}">${nhan}</button>`;
    document.getElementById('bbChonKieu').innerHTML =
        nut('Theo nhóm', _bbTheoNhom, "bbDoiKieu(true)", !coNhom) +
        nut('Cá nhân', !_bbTheoNhom, "bbDoiKieu(false)", false) +
        (coNhom ? '' : '<span class="self-center text-gray-400 text-xs ml-2">Chia nhóm trước nếu muốn chơi theo nhóm</span>');
}
function bbDoiKieu(theoNhom) { _bbTheoNhom = theoNhom; _bbNapDoi(); _bbVeChonKieu(); _bbVeDanhSach(); }

function _bbVeDanhSach() {
    document.getElementById('bbDanhSach').innerHTML = _bbDoiThu.map((d, i) => `
      <button onclick="bbDoiChon(${i})" style="min-height:44px"
        class="rounded-xl px-2 py-2 text-left transition ${d.chon ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-400'}">
        <div class="font-black text-sm leading-tight truncate">${d.ten}</div>
        <div class="text-[11px] ${d.chon ? 'text-white text-opacity-80' : 'text-gray-400'}">${d.phu}</div>
      </button>`).join('');
    _bbTomTat();
}
function bbDoiChon(i) { _bbDoiThu[i].chon = !_bbDoiThu[i].chon; _bbVeDanhSach(); }

function _bbVeThang() {
    document.getElementById('bbThangO').innerHTML = _bbThang.map((d, i) => `
      <label class="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-2 py-1.5">
        <span class="text-gray-500 text-xs font-bold">N${i + 1}</span>
        <input type="number" min="1" max="200" value="${d}" onchange="bbSuaThang(${i},this.value)"
          class="w-14 text-center font-black text-indigo-600 bg-white border border-gray-200 rounded-lg py-1">
      </label>`).join('');
}
function bbSuaThang(i, gt) {
    _bbThang[i] = Math.min(200, Math.max(1, parseInt(gt, 10) || 1));
    _bbVeThang(); _bbTomTat();
}
function _bbTomTat() {
    const n = _bbDoiThu.filter(d => d.chon).length;
    document.getElementById('bbTomTat').innerText =
        `${n} ${_bbTheoNhom ? 'nhóm' : 'em'} chơi · tối đa ${_bbThang[_bbThang.length - 1]} điểm một lượt`;
}

// ── Vào cuộc ─────────────────────────────────────────────────────────────────
function batDauBomBong() {
    const ds = _bbDoiThu.filter(d => d.chon);
    if (!ds.length) { if (typeof showToast === 'function') showToast('Hãy chọn ít nhất một bên chơi!', false); return; }
    _bbNguongSom = Math.min(_bbThang.length, Math.max(2, parseInt(document.getElementById('bbNguongO').value, 10) || 4));
    _bbGiayQuyet = Math.min(30, Math.max(0, parseInt(document.getElementById('bbGiayO').value, 10) || 0));
    _bbDoiThu = ds.map(d => ({ ...d }));
    _bbDiem = {}; _bbDoiThu.forEach(d => _bbDiem[d.id] = 0);
    _bbNhatKy = [];
    _bbLuot = 0;
    closeBbSetup();
    _bbHien('bbGame', true);
    _bbVaoLuot();
    _bbChayVe();
}

function closeBbGame() {
    _bbDungDem();
    if (_bbVeTimer) { cancelAnimationFrame(_bbVeTimer); _bbVeTimer = null; }
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    _bbHien('bbGame', false);
}

function _bbDoiHienTai() { return _bbDoiThu[_bbLuot % _bbDoiThu.length]; }

function _bbVaoLuot() {
    _bbNac = 0; _bbHu = 0; _bbManh = []; _bbChop = 0; _bbDaNo = false;
    // Ngưỡng nổ bốc ngẫu nhiên mỗi lượt, không ai biết trước
    _bbNguongNo = _bbNguongSom + Math.floor(Math.random() * (_bbThang.length - _bbNguongSom + 1));
    _bbTrangThai = 'HOI';
    _bbCapNhat();
    const d = _bbDoiHienTai();
    _bbLoi(`Lượt của ${d.ten}`, 'Thầy cô ra câu hỏi, rồi bấm Đúng hoặc Sai');
}

function _bbLoi(to, nho) {
    const el = document.getElementById('bbLoi');
    if (el) el.innerHTML = (nho ? `<span class="nho">${nho}</span>` : '') + (to || '');
}

function _bbCapNhat() {
    const d = _bbDoiHienTai();
    document.getElementById('bbTienDo').innerText =
        `Lượt ${_bbLuot + 1} · ${d ? d.ten : ''} · nổ sớm nhất từ nấc ${_bbNguongSom}`;

    document.getElementById('bbHu').innerHTML = `
      <div class="nhan">Hũ đang treo</div>
      <div class="so">${_bbHu}</div>
      <div class="nac">${_bbDaNo
          ? '💥 Nổ ở nấc ' + _bbNac
          : `Nấc ${_bbNac}/${_bbThang.length}` + (_bbNac >= _bbNguongSom - 1 && _bbNac > 0 ? ' · coi chừng nổ' : '')}</div>`;

    const xep = [..._bbDoiThu].sort((a, b) => (_bbDiem[b.id] || 0) - (_bbDiem[a.id] || 0));
    document.getElementById('bbBang').innerHTML = `<p class="nhan">Bảng điểm</p>` +
        (xep.every(x => !_bbDiem[x.id])
            ? `<p class="trong">Chưa ai chốt được điểm nào</p>`
            : '') +
        xep.map(x => `
          <div class="dong ${d && x.id === d.id ? 'luot' : ''}">
            <span class="ten">${x.ten}</span>
            <span class="diem">${_bbDiem[x.id] || 0}</span>
          </div>`).join('');

    document.getElementById('bbNutHoanTac').classList.toggle('hidden', _bbNhatKy.length === 0);
    _bbVeNut();
}

function _bbVeNut() {
    const act = document.getElementById('bbAct');
    if (!act) return;
    if (_bbTrangThai === 'HOI') {
        act.innerHTML = `
          <button onclick="bbTraLoi(true)" class="bb-nut bb-dung">✅ ĐÚNG — BƠM</button>
          <button onclick="bbTraLoi(false)" class="bb-nut bb-sai">❌ SAI</button>`;
    } else if (_bbTrangThai === 'QUYET') {
        act.innerHTML = `
          <button onclick="bbChot()" class="bb-nut bb-chot">💰 CHỐT +${_bbHu}</button>
          <button onclick="bbBomTiep()" class="bb-nut bb-bom">🎈 BƠM TIẾP</button>`;
    } else if (_bbTrangThai === 'XONG') {
        act.innerHTML = `<button onclick="closeBbGame()" class="bb-nut bb-chot">Kết thúc</button>`;
    } else {
        act.innerHTML = `<button onclick="_bbSangLuot()" class="bb-nut bb-chot">➡️ Lượt tiếp theo</button>`;
    }
}

// ── Diễn biến một lượt ───────────────────────────────────────────────────────
function bbTraLoi(dung) {
    if (_bbTrangThai !== 'HOI') return;
    if (!dung) {
        document.getElementById('soundNegative')?.play().catch(() => {});
        _bbTrangThai = 'CHO';
        _bbLoi('Sai rồi — mất hũ!', `${_bbDoiHienTai().ten} về tay trắng lượt này`);
        _bbCapNhat();
        return;
    }
    document.getElementById('soundPositive')?.play().catch(() => {});
    _bbNac++;
    _bbHu = _bbThang[Math.min(_bbNac, _bbThang.length) - 1];

    if (_bbNac >= _bbNguongNo) { _bbNo(); return; }

    if (_bbNac >= _bbThang.length) {        // bơm hết nấc mà bóng chưa nổ
        _bbTrangThai = 'QUYET';
        _bbCapNhat();
        _bbLoi('Kịch nấc rồi!', 'Không bơm thêm được nữa — chốt thôi');
        document.getElementById('bbAct').innerHTML =
            `<button onclick="bbChot()" class="bb-nut bb-chot">💰 CHỐT +${_bbHu}</button>`;
        _bbDungDem();
        return;
    }

    _bbTrangThai = 'QUYET';
    _bbCapNhat();
    const conAnToan = _bbNac < _bbNguongSom - 1;
    _bbLoi(`Đang treo ${_bbHu} điểm`,
        conAnToan ? 'Bơm tiếp vẫn còn an toàn' : 'Bơm nữa là có thể nổ — chốt hay liều?');
    _bbBatDem();
}

function _bbBatDem() {
    _bbDungDem();
    const el = document.getElementById('bbDem');
    if (!_bbGiayQuyet) { if (el) el.innerText = ''; return; }
    _bbConLai = _bbGiayQuyet;
    if (el) el.innerText = `Còn ${_bbConLai}s để quyết — hết giờ sẽ tự chốt`;
    _bbDemNguoc = setInterval(() => {
        _bbConLai--;
        if (el) el.innerText = _bbConLai > 0 ? `Còn ${_bbConLai}s để quyết — hết giờ sẽ tự chốt` : '';
        if (_bbConLai <= 0) { _bbDungDem(); if (_bbTrangThai === 'QUYET') bbChot(true); }
    }, 1000);
}
function _bbDungDem() {
    if (_bbDemNguoc) { clearInterval(_bbDemNguoc); _bbDemNguoc = null; }
    const el = document.getElementById('bbDem');
    if (el) el.innerText = '';
}

function bbBomTiep() {
    if (_bbTrangThai !== 'QUYET') return;
    _bbDungDem();
    _bbTrangThai = 'HOI';
    _bbCapNhat();
    _bbLoi('Bơm tiếp!', 'Trả lời đúng câu nữa thì bóng phồng thêm');
}

function bbChot(tuDong) {
    if (_bbTrangThai !== 'QUYET') return;
    _bbDungDem();
    const d = _bbDoiHienTai();
    const diem = _bbHu;
    const ids = _bbCongDiem(d, diem, `Bơm Bóng — chốt ở nấc ${_bbNac}`);
    _bbDiem[d.id] = (_bbDiem[d.id] || 0) + diem;
    _bbNhatKy.push({ doiId: d.id, ten: d.ten, diem, ids: d.ids, lichSuIds: ids });

    document.getElementById('soundPositive')?.play().catch(() => {});
    if (typeof confetti === 'function' && !_bbGiamChuyenDong()) {
        confetti({ particleCount: 110, spread: 85, origin: { y: .6 }, zIndex: 20000,
                   colors: ['#fbbf24', '#f59e0b', '#22c55e', '#3b82f6'] });
    }
    _bbTrangThai = 'CHO';
    _bbCapNhat();
    _bbLoi(`+${diem} điểm cho ${d.ten}`, tuDong ? 'Hết giờ nên tự chốt giúp' : 'Biết dừng đúng lúc!');
    if (typeof showToast === 'function') showToast(`${d.ten} chốt được ${diem} điểm`, true);
}

function _bbNo() {
    _bbDungDem();
    _bbDaNo = true;
    _bbTrangThai = 'CHO';
    document.getElementById('soundNegative')?.play().catch(() => {});
    if (!_bbGiamChuyenDong()) {
        _bbChop = 1;
        _bbManh = [];
        for (let i = 0; i < 46; i++) {
            const a = Math.random() * Math.PI * 2, v = 6 + Math.random() * 13;
            _bbManh.push({ x: 0, y: 0, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 4,
                           r: 6 + Math.random() * 14, xoay: Math.random() * 6, song: 1 });
        }
    }
    const d = _bbDoiHienTai();
    _bbLoi('💥 NỔ MẤT RỒI!', `${d.ten} mất trắng ${_bbHu} điểm vì bơm quá nấc ${_bbNguongNo}`);
    _bbHu = 0;
    _bbCapNhat();
    if (typeof showToast === 'function') showToast(`${d.ten} nổ bóng — mất trắng!`, false);
}

function _bbSangLuot() {
    _bbLuot++;
    if (_bbLuot >= _bbDoiThu.length * 99) return;
    _bbVaoLuot();
}

// ── Cộng điểm thật và hoàn tác ───────────────────────────────────────────────
function _bbCongDiem(doi, diem, tenKyNang) {
    const ids = [];
    const now = new Date().toISOString();
    doi.ids.forEach(sid => {
        const s = (typeof students !== 'undefined' ? students : []).find(x => x.id === sid);
        if (!s) return;
        const cu = s.points;
        s.points += diem;
        s.positivePoints += diem;
        if (typeof history !== 'undefined') {
            const id = Date.now() + Math.random();
            ids.push(id);
            history.push({ id, classId: currentClassId, studentId: s.id, studentName: s.name,
                           skillName: tenKyNang, points: diem, timestamp: now });
        }
        if (typeof checkMilestone === 'function') checkMilestone(s, cu);
        if (typeof checkGoalAchievements === 'function') setTimeout(() => checkGoalAchievements(s.id), 100);
    });
    if (typeof saveData === 'function') saveData();
    if (typeof scheduleAutoSync === 'function') scheduleAutoSync();
    if (typeof renderStudents === 'function' && typeof currentView !== 'undefined' && currentView === 'classroom') renderStudents();
    else if (typeof renderReport === 'function') renderReport();
    return ids;
}

function bbHoanTac() {
    const g = _bbNhatKy.at(-1);
    if (!g) return;
    if (!window.confirm(`Hoàn tác lượt vừa rồi?\n\n${g.ten} sẽ bị trừ lại ${g.diem} điểm.`)) return;
    g.ids.forEach(sid => {
        const s = (typeof students !== 'undefined' ? students : []).find(x => x.id === sid);
        if (!s) return;
        s.points -= g.diem;
        s.positivePoints = Math.max(0, s.positivePoints - g.diem);
    });
    if (typeof history !== 'undefined') {
        g.lichSuIds.forEach(id => {
            const k = history.findIndex(h => h.id === id);
            if (k >= 0) history.splice(k, 1);
        });
    }
    _bbDiem[g.doiId] = Math.max(0, (_bbDiem[g.doiId] || 0) - g.diem);
    _bbNhatKy.pop();
    if (typeof saveData === 'function') saveData();
    if (typeof scheduleAutoSync === 'function') scheduleAutoSync();
    if (typeof renderStudents === 'function' && typeof currentView !== 'undefined' && currentView === 'classroom') renderStudents();
    _bbCapNhat();
    _bbLoi('Đã hoàn tác', `${g.ten} bị trừ lại ${g.diem} điểm`);
    if (typeof showToast === 'function') showToast(`Đã hoàn tác: ${g.ten} −${g.diem} điểm`, false);
}

// ============================================================
// HÌNH ẢNH QUẢ BÓNG
// ------------------------------------------------------------
// Bóng phồng theo nấc, run rẩy mạnh dần khi tới gần ngưỡng nổ, màu chuyển
// vàng → cam → đỏ. Nổ thì chớp trắng và mảnh bóng văng ra.
// ============================================================

// Màu bóng theo mức nguy hiểm 0..1
function _bbMauBong(nguy) {
    const mau = [
        [250, 204, 21],   // vàng
        [249, 115, 22],   // cam
        [239, 68, 68]     // đỏ
    ];
    const t = Math.min(1, Math.max(0, nguy)) * (mau.length - 1);
    const i = Math.min(mau.length - 2, Math.floor(t)), f = t - i;
    const c = mau[i].map((v, k) => Math.round(v + (mau[i + 1][k] - v) * f));
    return c;
}

function _bbVeBong() {
    const cv = document.getElementById('bbCanvas');
    if (!cv) return;
    const g = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    g.clearRect(0, 0, W, H);

    const giam = _bbGiamChuyenDong();
    // Mức nguy hiểm: trước ngưỡng an toàn là 0, sau đó tăng dần tới kịch nấc
    const nguy = _bbNac < _bbNguongSom - 1 ? 0
        : Math.min(1, (_bbNac - (_bbNguongSom - 1)) / Math.max(1, _bbThang.length - (_bbNguongSom - 1)));

    const cx = W / 2;
    let cy = H * 0.42;
    const R0 = W * 0.13;
    const R = R0 + (W * 0.30 - R0) * (_bbNac / Math.max(1, _bbThang.length));

    // Rung: càng nguy hiểm càng lắc mạnh
    let lx = 0, ly = 0;
    if (!giam && _bbTrangThai !== 'XONG') {
        const bien = nguy * W * 0.012;
        lx = Math.sin(_bbT * 0.33) * bien + Math.sin(_bbT * 0.71) * bien * 0.5;
        ly = Math.cos(_bbT * 0.41) * bien * 0.7;
    }

    // Mảnh bóng bay ra sau khi nổ
    if (_bbManh.length) {
        _bbManh.forEach(m => {
            m.x += m.vx; m.y += m.vy; m.vy += 0.55; m.xoay += 0.15; m.song -= 0.016;
        });
        _bbManh = _bbManh.filter(m => m.song > 0);
        const c = _bbMauBong(1);
        _bbManh.forEach(m => {
            g.save();
            g.translate(cx + m.x, cy + m.y);
            g.rotate(m.xoay);
            g.globalAlpha = Math.max(0, m.song);
            g.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
            g.beginPath();
            g.moveTo(0, -m.r); g.lineTo(m.r * 0.8, m.r * 0.6); g.lineTo(-m.r * 0.9, m.r * 0.5);
            g.closePath(); g.fill();
            g.restore();
        });
        g.globalAlpha = 1;
    } else {        // lúc nào cũng có quả bóng trên màn, nấc 0 thì nó xẹp lép
        const c = _bbMauBong(nguy);
        const bx = cx + lx, by = cy + ly;
        const ry = R * 1.16;

        // Dây bóng
        g.beginPath();
        g.moveTo(bx, by + ry);
        for (let i = 1; i <= 16; i++) {
            const t = i / 16;
            g.lineTo(bx + Math.sin(t * 5 + _bbT * 0.06) * R * 0.18, by + ry + t * H * 0.22);
        }
        g.lineWidth = Math.max(2, W * 0.005);
        g.strokeStyle = 'rgba(255,255,255,.55)';
        g.stroke();

        // Thân bóng
        g.save();
        g.translate(bx, by);
        g.beginPath();
        g.ellipse(0, 0, R, ry, 0, 0, Math.PI * 2);
        const grad = g.createRadialGradient(-R * 0.35, -ry * 0.4, R * 0.1, 0, 0, R * 1.25);
        grad.addColorStop(0, `rgb(${Math.min(255, c[0] + 55)},${Math.min(255, c[1] + 55)},${Math.min(255, c[2] + 55)})`);
        grad.addColorStop(0.55, `rgb(${c[0]},${c[1]},${c[2]})`);
        grad.addColorStop(1, `rgb(${Math.round(c[0] * 0.62)},${Math.round(c[1] * 0.62)},${Math.round(c[2] * 0.62)})`);
        g.fillStyle = grad;
        g.fill();

        // Vệt sáng bóng loáng
        g.beginPath();
        g.ellipse(-R * 0.34, -ry * 0.38, R * 0.22, ry * 0.15, -0.5, 0, Math.PI * 2);
        g.fillStyle = 'rgba(255,255,255,.55)';
        g.fill();

        // Nút thắt
        g.beginPath();
        g.moveTo(-R * 0.14, ry * 0.97); g.lineTo(R * 0.14, ry * 0.97); g.lineTo(0, ry * 1.17);
        g.closePath();
        g.fillStyle = `rgb(${Math.round(c[0] * 0.75)},${Math.round(c[1] * 0.75)},${Math.round(c[2] * 0.75)})`;
        g.fill();

        // Số nấc in giữa bóng cho cả lớp thấy đang ở đâu
        g.fillStyle = 'rgba(0,0,0,.30)';
        g.font = `900 ${Math.round(R * 0.86)}px "Be Vietnam Pro",sans-serif`;
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(String(_bbNac), 0, 0);
        g.restore();
    }

    // Chớp sáng lúc nổ — toả tròn từ tâm, không tô kín khung canvas
    // (tô kín sẽ lộ nguyên hình chữ nhật của canvas thành một ô xám)
    if (_bbChop > 0) {
        const bk = W * 0.62;
        const toa = g.createRadialGradient(cx, cy, 0, cx, cy, bk);
        toa.addColorStop(0, `rgba(255,255,255,${_bbChop})`);
        toa.addColorStop(0.45, `rgba(255,240,200,${_bbChop * 0.5})`);
        toa.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = toa;
        g.beginPath(); g.arc(cx, cy, bk, 0, Math.PI * 2); g.fill();
        _bbChop = Math.max(0, _bbChop - 0.06);
    }
}

function _bbChayVe() {
    const chay = () => {
        _bbT += 1;
        _bbVeBong();
        _bbVeTimer = requestAnimationFrame(chay);
    };
    if (_bbVeTimer) cancelAnimationFrame(_bbVeTimer);
    _bbVeTimer = requestAnimationFrame(chay);
}
