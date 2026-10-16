// ============================================================
// VÒNG QUAY MAY MẮN — QUAY SỐ PHẦN THƯỞNG
// ------------------------------------------------------------
// Cuối tiết hoặc cuối tuần, quay số thứ tự học sinh để nhận quà.
// Quay theo thứ tự TỪ GIẢI THẤP LÊN GIẢI CAO, ai trúng rồi thì bị loại
// khỏi vòng quay nên mỗi em chỉ trúng một giải. Điểm cộng vào thẳng app
// và được đồng bộ như mọi thao tác cho điểm khác.
//
// Cơ chế quay và nhạc lấy giống Vòng Quay Học Tập cho quen tay.
// Giao diện tự dựng bằng JS trong chính file này.
// ============================================================

const VQ_MAU = ['#f87171', '#fb923c', '#fbbf24', '#34d399', '#38bdf8', '#818cf8', '#a78bfa', '#f472b6'];

// Giải mặc định — thầy cô sửa được tên, điểm và số lượng
const VQ_GIAI_MAU = [
    { ten: 'Giải Ba',      diem: 1, soLuong: 1, icon: '🥉' },
    { ten: 'Giải Nhì',     diem: 2, soLuong: 1, icon: '🥈' },
    { ten: 'Giải Nhất',    diem: 3, soLuong: 1, icon: '🥇' },
    { ten: 'Giải Đặc Biệt', diem: 5, soLuong: 1, icon: '🏆' }
];

// 30 câu tục ngữ, thành ngữ về sự cố gắng trong học tập — chiếu sau mỗi
// lượt trao thưởng để em chưa trúng cũng được một lời khích lệ
const VQ_THANH_NGU = [
    'Có công mài sắt, có ngày nên kim.',
    'Học, học nữa, học mãi.',
    'Đi một ngày đàng, học một sàng khôn.',
    'Không thầy đố mày làm nên.',
    'Học thầy không tày học bạn.',
    'Muốn biết phải hỏi, muốn giỏi phải học.',
    'Dốt đến đâu học lâu cũng biết.',
    'Ăn vóc học hay.',
    'Luyện mãi thành tài, miệt mài tất giỏi.',
    'Dao có mài mới sắc, người có học mới nên.',
    'Siêng làm thì có, siêng học thì hay.',
    'Kiến tha lâu cũng đầy tổ.',
    'Nước chảy đá mòn.',
    'Có chí thì nên.',
    'Thua keo này ta bày keo khác.',
    'Thất bại là mẹ thành công.',
    'Chớ thấy sóng cả mà ngã tay chèo.',
    'Lửa thử vàng, gian nan thử sức.',
    'Có cứng mới đứng đầu gió.',
    'Cần cù bù thông minh.',
    'Một kho vàng không bằng một nang chữ.',
    'Học ăn, học nói, học gói, học mở.',
    'Tiên học lễ, hậu học văn.',
    'Ngọc không mài không sáng, người không học không nên.',
    'Góp gió thành bão.',
    'Khổ luyện thành tài.',
    'Chậm mà chắc, chắc mà bền.',
    'Bền chí ắt nên.',
    'Đi lâu rồi cũng tới, học mãi rồi cũng hay.',
    'Tay làm hàm nhai, chăm học thì nên người.'
];
let _vqThanhNguCu = -1;

const vqNhac = new Audio('https://files.catbox.moe/jp6q4j.mp3');
vqNhac.preload = 'auto';

let _vqGiai     = [];      // bảng giải đang dùng
let _vqHangCho  = [];      // hàng đợi từng lượt quay, đã xếp từ thấp lên cao
let _vqLuot     = 0;       // lượt đang quay
let _vqDuThi    = [];      // học sinh còn trong vòng quay
let _vqTrung     = [];     // [{ stt, name, giai, diem }]
let _vqGoc      = 0;
let _vqDangQuay = false;
let _vqDuoiKim  = -1;
let _vqIdLichSu = null;    // id dòng lịch sử vừa ghi, để hoàn tác bỏ đúng dòng
let _vqPha      = 0;       // pha của vệt sáng chạy quanh vòng    // id dòng lịch sử vừa ghi, để hoàn tác bỏ đúng dòng      // nan đang nằm dưới kim, để biết lúc nào kim nảy

// ── Bảng màu, khoảng cách: khai báo một chỗ, không viết cứng trong từng ô ──
function _vqDungKieu() {
    if (document.getElementById('vqKieu')) return;
    const st = document.createElement('style');
    st.id = 'vqKieu';
    st.textContent = `
.vq{
  --vq-nen:#0f172a; --vq-nen-2:#1e1b4b; --vq-nen-3:#312e81;
  --vq-chu:#ffffff; --vq-chu-mo:rgba(255,255,255,.62);
  --vq-vang:#fbbf24; --vq-vang-dam:#f59e0b; --vq-do-nhat:#fca5a5;
  --vq-mat:rgba(255,255,255,.09); --vq-vien:rgba(255,255,255,.16);
  --vq-r:18px; --vq-r-to:26px;
  --vq-1:4px; --vq-2:8px; --vq-3:14px; --vq-4:22px;
  --vq-cham:44px;                 /* vùng chạm tối thiểu */
  background:linear-gradient(160deg,var(--vq-nen),var(--vq-nen-2) 58%,var(--vq-nen-3));
  color:var(--vq-chu); font-family:"Be Vietnam Pro",system-ui,sans-serif;
}
.vq button:focus-visible{outline:3px solid var(--vq-vang);outline-offset:3px;border-radius:var(--vq-r)}

.vq-bar{display:flex;align-items:center;justify-content:space-between;gap:var(--vq-2);
  padding:var(--vq-2) var(--vq-3);flex-shrink:0}
.vq-bar-end{display:flex;align-items:center;gap:var(--vq-2)}
.vq-progress{margin:0;color:var(--vq-chu-mo);font-weight:700;font-size:.95rem;text-align:center;flex:1;min-width:0}
.vq-ghost{display:inline-flex;align-items:center;gap:var(--vq-2);min-height:var(--vq-cham);
  padding:0 var(--vq-3);border-radius:var(--vq-r);background:var(--vq-mat);
  color:var(--vq-chu);font-weight:700;font-size:.9rem;transition:background .18s ease-out}
.vq-ghost:hover{background:var(--vq-vien)}
.vq-ghost:active{transform:scale(.97)}

.vq-prize{padding:var(--vq-2) var(--vq-4);border-radius:999px;background:var(--vq-mat);
  border:1px solid var(--vq-vien);display:flex;align-items:center;gap:var(--vq-3);max-width:94vw}
@media(min-width:900px){
  .vq-prize{flex-direction:column;gap:var(--vq-1);text-align:center;border-radius:var(--vq-r-to);
    padding:var(--vq-4) var(--vq-3);justify-self:end;align-self:center;max-width:300px}
  .vq-prize .ico{font-size:clamp(2.4rem,4.4vw,3.6rem)}
}
.vq-prize .ico{font-size:clamp(1.6rem,3.4vw,2.4rem);line-height:1}
.vq-prize .ten{font-weight:900;font-size:clamp(1.1rem,2.8vw,2rem);line-height:1.1}
.vq-prize .diem{font-weight:900;color:var(--vq-vang);font-size:clamp(.95rem,2vw,1.4rem)}
.vq-prize .nhan{font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:var(--vq-chu-mo);font-weight:800}

/* Ba cột: ô trống - vòng quay - bảng trúng. Nhờ ô trống bên trái mà vòng
   quay nằm đúng trục giữa trang, thẳng hàng với nút QUAY và dải chữ dưới. */
/* Màn hẹp: xếp dọc và CHO CUỘN, không để các khối đè lên nhau */
.vq-main{flex:1;min-height:0;display:grid;grid-template-columns:1fr;justify-items:center;
  align-content:center;gap:var(--vq-3);padding:0 var(--vq-3);overflow-y:auto}
@media(min-width:900px){
  .vq-main{grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);
           grid-template-rows:minmax(0,1fr);align-items:stretch;overflow:hidden}
  .vq-main .vq-rail{justify-self:start;align-self:center;max-width:300px}
}
/* Vòng quay lớn nhất có thể trong chỗ CÒN TRỐNG, chứ không ấn định một con
   số vh — ấn định thì máy 768px cao sẽ bị vòng đè lên ô giải và nút QUAY. */
.vq-wheel{position:relative;line-height:0;display:flex;align-items:center;justify-content:center;min-height:0}
.vq-wheel canvas{max-width:min(80vw,34vh);height:auto;display:block}
@media(min-width:900px){
  .vq-wheel{height:100%}
  .vq-wheel canvas{max-width:min(88vw,60vh);max-height:100%;width:auto;height:auto}
}
.vq-kim{position:absolute;left:50%;top:-4px;transform:translateX(-50%);z-index:2;
  transform-origin:50% 10%;filter:drop-shadow(0 3px 6px rgba(0,0,0,.6))}
.vq-kim-tam{width:0;height:0;border-left:18px solid transparent;border-right:18px solid transparent;
  border-top:34px solid var(--vq-vang)}

.vq-rail{width:100%;max-width:420px;max-height:16vh;overflow-y:auto;display:flex;flex-direction:column;gap:var(--vq-1)}
@media(min-width:900px){.vq-rail{max-height:52vh}}
.vq-rail .nhan{font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;
  color:var(--vq-chu-mo);font-weight:800;margin:0 0 var(--vq-1)}
.vq-rail .dong{display:flex;align-items:center;gap:var(--vq-2);padding:var(--vq-2) var(--vq-3);
  border-radius:var(--vq-r);background:var(--vq-mat)}
.vq-rail .stt{min-width:34px;height:28px;border-radius:9px;background:var(--vq-vang);
  color:#0f172a;font-weight:900;display:flex;align-items:center;justify-content:center}
.vq-rail .ten{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700}
.vq-rail .giai{color:var(--vq-chu-mo);font-size:.8rem;font-weight:700}
.vq-rail .diem{color:var(--vq-vang);font-weight:900}
.vq-rail .trong{color:var(--vq-chu-mo);font-size:.85rem;font-style:italic;padding:var(--vq-2) var(--vq-3)}

.vq-action{flex-shrink:0;display:flex;justify-content:center;padding:var(--vq-2) var(--vq-3)}
.vq-primary{display:inline-flex;align-items:center;justify-content:center;gap:var(--vq-3);
  min-height:var(--vq-cham);padding:var(--vq-3) clamp(28px,8vw,72px);border-radius:var(--vq-r-to);
  background:linear-gradient(180deg,var(--vq-vang),var(--vq-vang-dam));color:#1f1300;
  font-weight:900;font-size:clamp(1.1rem,2.4vw,1.6rem);letter-spacing:.04em;
  box-shadow:0 8px 0 #b45309;transition:transform .15s ease-out,box-shadow .15s ease-out}
.vq-primary:hover:not(:disabled){filter:brightness(1.06)}
.vq-primary:active:not(:disabled){transform:translateY(6px);box-shadow:0 2px 0 #b45309}
.vq-primary:disabled{background:var(--vq-mat);color:var(--vq-chu-mo);box-shadow:none;cursor:not-allowed}
.vq-kbd{font-size:.68rem;font-weight:800;opacity:.6;border:1px solid currentColor;border-radius:6px;padding:1px 6px}
.vq-primary:disabled .vq-kbd{display:none}

.vq-band{flex-shrink:0;text-align:center;padding:var(--vq-1) var(--vq-3) var(--vq-3)}
#vqTenSong{font-weight:900;line-height:1;font-size:clamp(2.2rem,7.8vw,6rem);
  transition:color .12s linear,transform .12s ease-out;min-height:1.1em}
#vqTenSong .so{display:block;font-size:.34em;opacity:.6;line-height:1.2;font-weight:800}
#vqTenSong.trung{color:#0f172a;background:linear-gradient(135deg,var(--vq-vang),var(--vq-vang-dam));
  border-radius:var(--vq-r-to);padding:var(--vq-2) var(--vq-4);display:inline-block}
#vqThanhNgu{margin:var(--vq-2) 0 0;font-style:italic;font-weight:700;color:#fde68a;
  font-size:clamp(1rem,2.2vw,1.7rem)}
.vq-hide-sm{display:none}
@media(min-width:720px){.vq-hide-sm{display:inline}}

@media(prefers-reduced-motion:reduce){
  .vq *,.vq *::before,.vq *::after{animation-duration:.01ms !important;animation-iteration-count:1 !important;
    transition-duration:.01ms !important}
}`;
    document.head.appendChild(st);
}

// ── Dựng khung ───────────────────────────────────────────────────────────────
function _vqDungKhung() {
    if (document.getElementById('vqRoot')) return;
    const root = document.createElement('div');
    root.id = 'vqRoot';
    root.innerHTML = `
      <div id="vqSetup" class="fixed inset-0 z-[125] hidden items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
        <div class="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
          <div class="px-6 py-4 border-b flex items-center justify-between flex-shrink-0">
            <div>
              <h2 class="text-2xl font-black text-gray-800">🎁 Vòng Quay May Mắn</h2>
              <p class="text-gray-500 text-sm mt-0.5">Quay số thứ tự học sinh để nhận quà, từ giải thấp lên giải cao</p>
            </div>
            <button onclick="closeVqSetup()" aria-label="Đóng" class="text-gray-400 hover:text-gray-700 text-2xl" style="min-width:44px;min-height:44px">&times;</button>
          </div>
          <div class="flex-1 overflow-y-auto p-5 space-y-5">
            <div>
              <div class="flex items-center justify-between mb-2">
                <h3 class="font-black text-gray-800">Cơ cấu giải thưởng</h3>
                <button onclick="vqThemGiai()" class="text-sm font-bold text-teal-600 hover:text-teal-700">+ Thêm giải</button>
              </div>
              <div id="vqBangGiai" class="space-y-2"></div>
              <p class="text-gray-500 text-xs mt-2">Sửa trực tiếp tên giải, số điểm cộng và số lượng. Quay lần lượt từ giải ít điểm nhất.</p>
            </div>
            <div>
              <div class="flex items-center justify-between mb-2">
                <h3 class="font-black text-gray-800">Học sinh dự quay</h3>
                <div class="flex gap-2">
                  <button onclick="vqChonHet(true)" class="text-sm font-bold text-teal-600">Chọn hết</button>
                  <button onclick="vqChonHet(false)" class="text-sm font-bold text-gray-500">Bỏ hết</button>
                </div>
              </div>
              <div id="vqDanhSach" class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-56 overflow-y-auto p-1"></div>
            </div>
          </div>
          <div class="px-6 py-4 border-t flex items-center justify-between flex-shrink-0 bg-gray-50">
            <span id="vqTomTat" class="text-gray-600 font-bold text-sm"></span>
            <button onclick="batDauQuayThuong()" class="bg-teal-500 hover:bg-teal-400 text-white font-black px-7 py-3 rounded-2xl">
              <i class="fas fa-play mr-1"></i> Bắt đầu quay
            </button>
          </div>
        </div>
      </div>

      <div id="vqGame" class="vq fixed inset-0 z-[126] hidden flex-col" role="dialog" aria-label="Vòng quay may mắn">

        <header class="vq-bar">
          <button onclick="closeVqGame()" class="vq-ghost" aria-label="Thoát vòng quay">
            <i class="fas fa-arrow-left" aria-hidden="true"></i><span class="vq-hide-sm">Thoát</span>
          </button>
          <p id="vqTienDo" class="vq-progress" aria-live="polite"></p>
          <div class="vq-bar-end">
            <button onclick="vqHoanTac()" id="vqNutHoanTac" class="vq-ghost hidden" aria-label="Hoàn tác lượt quay vừa rồi">
              <i class="fas fa-rotate-left" aria-hidden="true"></i><span class="vq-hide-sm">Hoàn tác</span>
            </button>
            <button onclick="vqDoiFull()" class="vq-ghost" aria-label="Bật tắt toàn màn hình, phím F">
              <i class="fas fa-expand-arrows-alt" aria-hidden="true"></i><span class="vq-hide-sm">Toàn màn hình (F)</span>
            </button>
          </div>
        </header>

        <main class="vq-main">
          <!-- Giải đang quay nằm ở cột trái vốn bỏ trống, nhờ vậy vòng quay
               được trọn chiều cao còn lại. Luôn đứng yên một chỗ. -->
          <div id="vqGiaiHienTai" class="vq-prize" aria-live="polite"></div>
          <div class="vq-wheel">
            <div id="vqKim" class="vq-kim" aria-hidden="true">
              <div class="vq-kim-tam"></div>
            </div>
            <canvas id="vqCanvas" width="760" height="760" role="img" aria-label="Vòng quay số thứ tự học sinh"></canvas>
          </div>
          <aside id="vqDaTrung" class="vq-rail" aria-label="Danh sách đã trúng thưởng"></aside>
        </main>

        <div class="vq-action">
          <button onclick="quayThuong()" id="vqNutQuay" class="vq-primary">🎲 QUAY<span class="vq-kbd">Space</span></button>
        </div>

        <!-- Một ô duy nhất ở dưới: đang quay thì chạy tên, quay xong thì hiện
             người trúng, lúc rảnh thì chiếu câu khích lệ. Không ô nào nhảy chỗ. -->
        <footer class="vq-band">
          <div id="vqTenSong" aria-live="polite"></div>
          <p id="vqThanhNgu"></p>
        </footer>
      </div>`;

    document.body.appendChild(root);
    _vqDungKieu();
    document.addEventListener('keydown', _vqPhim);
}

function _vqPhim(e) {
    const g = document.getElementById('vqGame');
    if (!g || g.classList.contains('hidden')) return;
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); quayThuong(); }
    else if (e.key === 'Escape') closeVqGame();
}

function _vqHien(id, hien) {
    const e = document.getElementById(id);
    if (!e) return;
    if (hien) { e.classList.remove('hidden'); e.classList.add('flex'); }
    else { e.classList.add('hidden'); e.classList.remove('flex'); }
}

function vqDoiFull() {
    const el = document.getElementById('vqGame');
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    else el?.requestFullscreen?.().catch(() => {});
}

// ── Màn cài đặt ──────────────────────────────────────────────────────────────
function openVongQuayMayMan() {
    const hs = (typeof students !== 'undefined' ? students : []).filter(s => s.classId === currentClassId);
    if (!hs.length) { if (typeof showToast === 'function') showToast('Lớp chưa có học sinh!', false); return; }
    _vqDungKhung();
    _vqGiai = JSON.parse(JSON.stringify(VQ_GIAI_MAU));
    _vqDuThi = hs.map((s, i) => ({ id: s.id, name: s.name, stt: s.stt || (i + 1), chon: true }));
    _vqTrung = [];
    _vqVeBangGiai();
    _vqVeDanhSach();
    _vqHien('vqSetup', true);
}
function closeVqSetup() { _vqHien('vqSetup', false); }

function _vqVeBangGiai() {
    const box = document.getElementById('vqBangGiai');
    if (!box) return;
    box.innerHTML = _vqGiai.map((g, i) => `
      <div class="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-2">
        <input value="${g.icon}" onchange="vqSuaGiai(${i},'icon',this.value)" class="w-11 text-center text-xl bg-white border border-gray-200 rounded-lg py-1.5">
        <input value="${g.ten}" onchange="vqSuaGiai(${i},'ten',this.value)" class="flex-1 min-w-0 font-bold text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
        <div class="flex items-center gap-1">
          <input type="number" min="1" max="50" value="${g.diem}" onchange="vqSuaGiai(${i},'diem',this.value)" class="w-16 text-center font-black text-teal-600 bg-white border border-gray-200 rounded-lg py-1.5">
          <span class="text-gray-500 text-sm font-bold">điểm</span>
        </div>
        <div class="flex items-center gap-1">
          <input type="number" min="1" max="20" value="${g.soLuong}" onchange="vqSuaGiai(${i},'soLuong',this.value)" class="w-14 text-center font-black text-gray-700 bg-white border border-gray-200 rounded-lg py-1.5">
          <span class="text-gray-500 text-sm font-bold">giải</span>
        </div>
        <button onclick="vqXoaGiai(${i})" aria-label="Xoá ${'$'}{g.ten}" title="Xoá giải này" class="rounded-lg text-red-500 hover:bg-red-50" style="min-width:44px;min-height:44px"><i class="fas fa-trash" aria-hidden="true"></i></button>
      </div>`).join('');
    _vqTomTat();
}
function vqSuaGiai(i, truong, gt) {
    if (!_vqGiai[i]) return;
    if (truong === 'diem') _vqGiai[i].diem = Math.min(50, Math.max(1, parseInt(gt, 10) || 1));
    else if (truong === 'soLuong') _vqGiai[i].soLuong = Math.min(20, Math.max(1, parseInt(gt, 10) || 1));
    else _vqGiai[i][truong] = String(gt).slice(0, 30) || '—';
    _vqVeBangGiai();
}
function vqThemGiai() { _vqGiai.push({ ten: 'Giải Khuyến Khích', diem: 1, soLuong: 1, icon: '🎁' }); _vqVeBangGiai(); }
function vqXoaGiai(i) { if (_vqGiai.length > 1) { _vqGiai.splice(i, 1); _vqVeBangGiai(); } }

function _vqVeDanhSach() {
    const box = document.getElementById('vqDanhSach');
    if (!box) return;
    box.innerHTML = _vqDuThi.map((s, i) => `
      <button onclick="vqDoiChon(${i})" title="${s.name}"
        class="rounded-xl py-1.5 px-1 transition ${s.chon ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-400'}">
        <div class="font-black text-lg leading-none">${s.stt}</div>
        <div class="text-[10px] leading-tight truncate ${s.chon ? 'text-white text-opacity-80' : 'text-gray-400'}">${s.name}</div>
      </button>`).join('');
    _vqTomTat();
}
function vqDoiChon(i) { _vqDuThi[i].chon = !_vqDuThi[i].chon; _vqVeDanhSach(); }
function vqChonHet(c) { _vqDuThi.forEach(s => s.chon = c); _vqVeDanhSach(); }

function _vqSoGiai() { return _vqGiai.reduce((t, g) => t + g.soLuong, 0); }
function _vqTomTat() {
    const el = document.getElementById('vqTomTat');
    if (!el) return;
    const n = _vqDuThi.filter(s => s.chon).length;
    const g = _vqSoGiai();
    el.innerHTML = `${n} học sinh dự quay · ${g} giải`
        + (g > n ? ' <span class="text-red-500">— nhiều giải hơn số học sinh!</span>' : '');
}

// ── Vào cuộc quay ────────────────────────────────────────────────────────────
function batDauQuayThuong() {
    const ds = _vqDuThi.filter(s => s.chon);
    if (!ds.length) { if (typeof showToast === 'function') showToast('Hãy chọn ít nhất một học sinh!', false); return; }
    if (_vqSoGiai() > ds.length) { if (typeof showToast === 'function') showToast('Số giải nhiều hơn số học sinh dự quay!', false); return; }

    // Hàng đợi: xếp từ giải ít điểm nhất lên nhiều điểm nhất
    _vqHangCho = [];
    [..._vqGiai].sort((a, b) => a.diem - b.diem)
        .forEach(g => { for (let i = 0; i < g.soLuong; i++) _vqHangCho.push({ ...g }); });

    _vqLuot = 0;
    _vqTrung = [];
    _vqDuThi = ds.map(s => ({ ...s }));
    _vqGoc = 0;
    closeVqSetup();
    _vqHien('vqGame', true);
    _vqChieuThanhNgu();
    _vqCapNhat();
    _vqVeVong();
}
function closeVqGame() {
    try { vqNhac.pause(); } catch { /* bỏ qua */ }
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    _vqHien('vqGame', false);
}

function _vqCapNhat() {
    document.getElementById('vqTienDo').innerText =
        `Lượt ${Math.min(_vqLuot + 1, _vqHangCho.length)}/${_vqHangCho.length} · còn ${_vqDuThi.length} học sinh`;

    const g = _vqHangCho[_vqLuot];
    const box = document.getElementById('vqGiaiHienTai');
    const nut = document.getElementById('vqNutQuay');
    if (g) {
        box.innerHTML = `
          <span class="ico">${g.icon}</span>
          <span><span class="nhan">Đang quay cho</span><br><span class="ten">${g.ten}</span></span>
          <span class="diem">+${g.diem} điểm</span>`;
        nut.disabled = false;
        nut.innerHTML = '🎲 QUAY<span class="vq-kbd">Space</span>';
    } else {
        box.innerHTML = `<span class="ico">🎉</span><span class="ten">Đã trao hết ${_vqTrung.length} giải</span>`;
        nut.disabled = true;
        nut.innerHTML = 'Xong rồi!';
    }

    // Trạng thái rỗng cũng phải nói cho thầy cô biết đang chờ gì
    document.getElementById('vqDaTrung').innerHTML = _vqTrung.length
        ? `<p class="nhan">Đã trúng thưởng</p>` + [..._vqTrung].reverse().map(t => `
            <div class="dong">
              <span aria-hidden="true">${t.icon}</span>
              <span class="stt">${t.stt}</span>
              <span class="ten">${t.name}</span>
              <span class="giai vq-hide-sm">${t.giai}</span>
              <span class="diem">+${t.diem}</span>
            </div>`).join('')
        : `<p class="nhan">Đã trúng thưởng</p><p class="trong">Chưa có ai — bấm QUAY để bắt đầu</p>`;

    document.getElementById('vqNutHoanTac').classList.toggle('hidden', _vqTrung.length === 0);
}

// Hoàn tác lượt vừa quay: trả điểm, xoá dòng lịch sử, cho em đó về lại vòng quay
function vqHoanTac() {
    const t = _vqTrung.at(-1);
    if (!t) return;
    if (!window.confirm(`Hoàn tác lượt vừa rồi?\n\n${t.name} sẽ bị trừ lại ${t.diem} điểm và quay về danh sách dự quay.`)) return;

    const s = (typeof students !== 'undefined' ? students : []).find(x => x.id === t.id);
    if (s) {
        s.points -= t.diem;
        s.positivePoints = Math.max(0, s.positivePoints - t.diem);
    }
    if (typeof history !== 'undefined' && t.lichSuId != null) {
        const k = history.findIndex(h => h.id === t.lichSuId);
        if (k >= 0) history.splice(k, 1);
    }
    if (typeof saveData === 'function') saveData();
    if (typeof scheduleAutoSync === 'function') scheduleAutoSync();
    if (typeof renderStudents === 'function' && typeof currentView !== 'undefined' && currentView === 'classroom') renderStudents();

    _vqDuThi.push({ id: t.id, name: t.name, stt: t.stt, chon: true });
    _vqDuThi.sort((a, b) => a.stt - b.stt);
    _vqTrung.pop();
    _vqLuot = Math.max(0, _vqLuot - 1);

    const ten = document.getElementById('vqTenSong');
    if (ten) { ten.innerHTML = ''; ten.className = ''; }
    _vqCapNhat(); _vqVeVong();
    if (typeof showToast === 'function') showToast(`Đã hoàn tác: ${t.name} −${t.diem} điểm`, false);
}

function _vqVeVong(sang = -1, pha = null) {
    const cv = document.getElementById('vqCanvas');
    if (!cv) return;
    const g = cv.getContext('2d');
    const ty = cv.width / 520;                 // vòng vẽ to hơn thì chữ, nét dày theo
    const vienNgoai = 14 * ty;                 // chừa chỗ cho quầng sáng
    const cx = cv.width / 2, cy = cv.height / 2, r = cx - vienNgoai;
    g.clearRect(0, 0, cv.width, cv.height);
    if (!_vqDuThi.length) return;

    const n = _vqDuThi.length;
    const goc = (2 * Math.PI) / n;
    const dangQuay = pha !== null;

    // Quầng sáng ngoài đập theo nhịp, cho vòng quay nổi hẳn trên nền tối
    if (dangQuay) {
        const nhip = 0.5 + 0.5 * Math.sin(pha * 2);
        g.save();
        g.globalCompositeOperation = 'lighter';     // cộng sáng cho ra vẻ phát quang
        g.beginPath(); g.arc(cx, cy, r + vienNgoai * 0.5, 0, Math.PI * 2);
        g.lineWidth = vienNgoai * (0.45 + 0.55 * nhip);
        g.strokeStyle = `rgba(251,191,36,${0.30 + 0.45 * nhip})`;
        g.stroke();
        g.restore();
    }

    g.save(); g.translate(cx, cy); g.rotate(_vqGoc);
    for (let i = 0; i < n; i++) {
        g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, r, i * goc, (i + 1) * goc); g.closePath();
        g.fillStyle = sang === i ? '#ffffff' : VQ_MAU[i % VQ_MAU.length];
        g.fill();

        // Vệt sáng chạy vòng quanh: mỗi nan sáng lên lệch pha nhau nên trông
        // như đèn chạy đuổi. Hai vòng sóng quanh bánh xe cho có nhịp.
        if (dangQuay && sang !== i) {
            const song = 0.5 + 0.5 * Math.sin(pha - i * goc * 2);
            const manh = Math.pow(song, 2.8);   // chỉ đỉnh sóng mới sáng, nan
            g.fillStyle = `rgba(255,255,255,${0.32 * manh})`;   // khác vẫn giữ màu riêng
            g.fill();
        }

        g.lineWidth = 3 * ty; g.strokeStyle = 'rgba(255,255,255,.85)'; g.stroke();

        g.save();
        g.rotate(i * goc + goc / 2);
        // Nan ở nửa trái thì chữ sẽ lộn ngược — lật lại 180° cho đọc xuôi.
        // Số thứ tự là thứ cả lớp phải đọc được nên không thể để ngược.
        const giua = _vqGoc + i * goc + goc / 2;
        const lat = Math.cos(giua) < 0;
        if (lat) { g.rotate(Math.PI); g.textAlign = 'left'; } else { g.textAlign = 'right'; }
        g.textBaseline = 'middle';
        g.fillStyle = sang === i ? '#0f172a' : '#ffffff';
        const huong = lat ? -1 : 1;
        const coSo = Math.round((n > 28 ? 16 : (n > 16 ? 22 : 28)) * ty);
        const le = 16 * ty;
        g.font = `900 ${coSo}px sans-serif`;
        g.fillText(String(_vqDuThi[i].stt), huong * (r - le), 0);
        if (n <= 20) {
            g.font = `600 ${Math.round(coSo * 0.52)}px sans-serif`;
            let ten = _vqDuThi[i].name;
            if (ten.length > 14) ten = ten.slice(0, 14) + '…';
            g.fillText(ten, huong * (r - le - coSo * 1.6), 0);
        }
        g.restore();
    }
    g.restore();

    const banKinhTruc = 26 * ty * (dangQuay ? 1 + 0.12 * Math.sin(pha * 2) : 1);
    g.beginPath(); g.arc(cx, cy, banKinhTruc, 0, Math.PI * 2);
    g.fillStyle = '#fbbf24'; g.fill();
    g.lineWidth = 4 * ty; g.strokeStyle = '#fff'; g.stroke();
}

// ── Quay ─────────────────────────────────────────────────────────────────────
function quayThuong() {
    if (_vqDangQuay) return;
    const giai = _vqHangCho[_vqLuot];
    if (!giai) return;
    if (!_vqDuThi.length) { if (typeof showToast === 'function') showToast('Hết học sinh để quay!', false); return; }

    _vqDangQuay = true;
    const nut = document.getElementById('vqNutQuay');
    nut.disabled = true; nut.innerText = 'ĐANG QUAY…';
    const tenCu = document.getElementById('vqTenSong');
    if (tenCu) { tenCu.className = ''; tenCu.innerHTML = ''; }
    const tn = document.getElementById('vqThanhNgu');
    if (tn) tn.style.visibility = 'hidden';

    try { vqNhac.currentTime = 0; vqNhac.play().catch(() => {}); } catch { /* trình duyệt chặn */ }
    let thoiGian = 6000;
    if (!isNaN(vqNhac.duration) && vqNhac.duration > 0 && vqNhac.duration !== Infinity) thoiGian = vqNhac.duration * 1000;
    // Máy cài giảm chuyển động thì quay nhanh gọn, khỏi chóng mặt
    if (_vqGiamChuyenDong()) thoiGian = Math.min(thoiGian, 1200);

    const idx = Math.floor(Math.random() * _vqDuThi.length);
    const gocMoi = (2 * Math.PI) / _vqDuThi.length;
    const dich = (3 * Math.PI / 2) - (idx * gocMoi + gocMoi / 2);
    const tong = dich + Math.PI * 2 * Math.floor(thoiGian / 1000) * 1.5;
    const batDau = performance.now();
    const giamDan = x => 1 - Math.pow(1 - x, 4);

    _vqDuoiKim = -1;
    function chay(t) {
        let f = (t - batDau) / thoiGian;
        if (f > 1) f = 1;
        _vqGoc = tong * giamDan(f);
        // Nhịp sáng chậm dần đúng theo đà của vòng quay, nên mắt thấy ăn khớp
        _vqPha += _vqGiamChuyenDong() ? 0 : (0.13 + 0.42 * (1 - f));
        _vqVeVong(-1, _vqGiamChuyenDong() ? null : _vqPha);

        // Ai đang nằm dưới kim thì hiện tên ngay — quay càng chậm, tên đổi càng
        // chậm, chính chỗ đó làm cả lớp nín thở
        let a = (-Math.PI / 2 - _vqGoc) % (2 * Math.PI);
        if (a < 0) a += 2 * Math.PI;
        const duoi = Math.floor(a / gocMoi) % _vqDuThi.length;
        if (duoi !== _vqDuoiKim) { _vqDuoiKim = duoi; _vqNayKim(); }
        _vqTenChay(_vqDuThi[duoi], f);

        if (f < 1) requestAnimationFrame(chay);
        else { _vqGoc = dich; _vqVeVong(idx); _vqTraoThuong(idx, giai); }
    }
    requestAnimationFrame(chay);
}

// Kim nảy một cái mỗi lần vượt qua một nan, nghe như kim gõ vào chốt
function _vqNayKim() {
    const kim = document.getElementById('vqKim');
    if (!kim || _vqGiamChuyenDong()) return;
    kim.style.transition = 'none';
    kim.style.transform = 'translateX(-50%) rotate(-15deg)';
    requestAnimationFrame(() => {
        kim.style.transition = 'transform .1s cubic-bezier(.2,1.6,.4,1)';
        kim.style.transform = 'translateX(-50%) rotate(0deg)';
    });
}

// Tên chạy dưới vòng quay: càng về cuối chữ càng to, càng nóng màu
function _vqTenChay(hs, f) {
    const el = document.getElementById('vqTenSong');
    if (!el || !hs) return;
    const gan = Math.max(0, (f - 0.78) / 0.22);          // 0 → 1 trong chặng cuối
    const phong = 1 + 0.22 * gan;
    el.style.transform = `scale(${phong.toFixed(3)})`;
    el.style.color = gan > 0.72 ? '#fca5a5' : (gan > 0.3 ? '#fcd34d' : '#ffffff');
    el.className = '';
    el.innerHTML = `<span class="so">Số ${hs.stt}</span>${hs.name}`;
}

// Lấy một câu khác câu vừa chiếu, để không lặp lại ngay
function _vqChieuThanhNgu() {
    const el = document.getElementById('vqThanhNgu');
    if (!el) return;
    let i = Math.floor(Math.random() * VQ_THANH_NGU.length);
    if (VQ_THANH_NGU.length > 1 && i === _vqThanhNguCu) i = (i + 1) % VQ_THANH_NGU.length;
    _vqThanhNguCu = i;
    el.innerText = '“' + VQ_THANH_NGU[i] + '”';
}

function _vqGiamChuyenDong() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function _vqPhaoGiay(to) {
    if (typeof confetti !== 'function' || _vqGiamChuyenDong()) return;
    const mau = ['#fbbf24', '#f59e0b', '#ef4444', '#22c55e', '#3b82f6', '#a855f7'];
    confetti({ particleCount: to ? 220 : 130, spread: to ? 130 : 95, origin: { y: 0.55 }, zIndex: 20000, colors: mau });
    if (to) {
        setTimeout(() => confetti({ particleCount: 120, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, zIndex: 20000, colors: mau }), 180);
        setTimeout(() => confetti({ particleCount: 120, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, zIndex: 20000, colors: mau }), 320);
    }
}

function _vqTraoThuong(idx, giai) {
    const nguoi = _vqDuThi[idx];
    _vqDangQuay = false;
    const nut = document.getElementById('vqNutQuay');
    nut.disabled = false; nut.innerHTML = '🎲 QUAY';

    // Cộng điểm thật vào app
    const s = (typeof students !== 'undefined' ? students : []).find(x => x.id === nguoi.id);
    if (s) {
        const cu = s.points;
        s.points += giai.diem;
        s.positivePoints += giai.diem;
        if (typeof history !== 'undefined') {
            _vqIdLichSu = Date.now() + Math.random();
            history.push({ id: _vqIdLichSu, classId: currentClassId, studentId: s.id,
                           studentName: s.name, skillName: `Vòng quay may mắn — ${giai.ten}`,
                           points: giai.diem, timestamp: new Date().toISOString() });
        }
        if (typeof checkMilestone === 'function') checkMilestone(s, cu);
        if (typeof checkGoalAchievements === 'function') setTimeout(() => checkGoalAchievements(s.id), 100);
        if (typeof saveData === 'function') saveData();
        if (typeof scheduleAutoSync === 'function') scheduleAutoSync();
        if (typeof renderStudents === 'function' && typeof currentView !== 'undefined' && currentView === 'classroom') renderStudents();
        else if (typeof renderReport === 'function') renderReport();
    }
    document.getElementById('soundPositive')?.play().catch(() => {});
    // Giải to nhất trong cơ cấu thì ăn mừng hoành tráng hơn
    _vqPhaoGiay(giai.diem >= Math.max(..._vqGiai.map(g => g.diem)));

    _vqTrung.push({ id: nguoi.id, stt: nguoi.stt, name: nguoi.name, giai: giai.ten,
                    diem: giai.diem, icon: giai.icon, lichSuId: _vqIdLichSu });
    // Trúng rồi thì ra khỏi vòng quay, mỗi em chỉ một giải
    _vqDuThi.splice(idx, 1);
    _vqLuot++;

    const ten = document.getElementById('vqTenSong');
    if (ten) {
        ten.className = 'trung';
        ten.innerHTML = `<span class="so">${giai.icon} ${giai.ten} · Số ${nguoi.stt} · +${giai.diem} điểm</span>${nguoi.name}`;
        ten.style.transform = 'scale(1)';
        ten.style.color = '';
    }
    if (typeof showToast === 'function') showToast(`${nguoi.name} trúng ${giai.ten} (+${giai.diem} điểm)`, true);

    const tn2 = document.getElementById('vqThanhNgu');
    if (tn2) tn2.style.visibility = 'visible';
    _vqChieuThanhNgu();
    _vqDuoiKim = -1;
    _vqGoc = 0;
    _vqCapNhat();
    _vqVeVong();
}
