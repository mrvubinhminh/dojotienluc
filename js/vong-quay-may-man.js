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
let _vqDuoiKim  = -1;      // nan đang nằm dưới kim, để biết lúc nào kim nảy

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
            <button onclick="closeVqSetup()" class="text-gray-400 hover:text-gray-700 text-2xl w-10 h-10">&times;</button>
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

      <div id="vqGame" class="fixed inset-0 z-[126] hidden flex-col" style="background:linear-gradient(160deg,#0f172a,#1e1b4b 60%,#312e81)">
        <div class="flex items-center justify-between px-5 py-3 flex-shrink-0">
          <button onclick="closeVqGame()" class="text-white text-opacity-70 hover:text-opacity-100 font-bold text-sm">
            <i class="fas fa-arrow-left mr-1"></i> Thoát
          </button>
          <div id="vqTienDo" class="text-white text-opacity-80 font-bold text-sm"></div>
          <button onclick="vqDoiFull()" class="text-white text-opacity-70 hover:text-opacity-100 font-bold text-sm">
            <i class="fas fa-expand-arrows-alt mr-1"></i> Toàn màn hình (F)
          </button>
        </div>

        <div class="flex-1 min-h-0 flex flex-col">
        <div class="flex-1 min-h-0 flex flex-col md:flex-row items-center justify-center gap-6 px-5">
          <div class="flex-shrink-0 flex flex-col items-center">
            <div class="relative" id="vqKhungVong">
              <div id="vqKim" class="absolute left-1/2 -translate-x-1/2 -top-1 z-10"
                   style="filter:drop-shadow(0 3px 6px rgba(0,0,0,.6));transform-origin:50% 10%">
                <div style="width:0;height:0;border-left:18px solid transparent;border-right:18px solid transparent;border-top:34px solid #fbbf24"></div>
              </div>
              <canvas id="vqCanvas" width="520" height="520" style="max-width:min(80vw,46vh);height:auto"></canvas>
            </div>
          </div>

          <div class="flex-1 min-w-0 min-h-0 max-w-xl w-full h-full flex flex-col items-center gap-3">
            <div id="vqGiaiHienTai" class="w-full flex-shrink-0 rounded-3xl px-6 py-4 text-center" style="background:rgba(255,255,255,.1)"></div>
            <div id="vqKetQua" class="w-full flex-shrink-0"></div>
            <button onclick="quayThuong()" id="vqNutQuay"
              class="w-full flex-shrink-0 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-slate-900 py-5 rounded-3xl font-black text-2xl shadow-[0_10px_0_rgba(146,64,14,1)] active:translate-y-2 active:shadow-none transition-all">
              🎲 QUAY
            </button>
            <div id="vqDaTrung" class="w-full flex-1 min-h-0 overflow-y-auto space-y-1.5 pb-1"></div>
          </div>
        </div>

        <!-- Dải dưới cùng rộng hết màn hình: đang quay thì chạy tên, quay xong
             thì nhường chỗ cho một câu khích lệ -->
        <div class="flex-shrink-0 px-4 pb-4 pt-1 text-center">
          <div id="vqTenSong" class="font-black text-white leading-none"
               style="font-size:clamp(3.3rem,7.8vw,6rem);transition:color .12s linear"></div>
          <div id="vqThanhNgu" class="font-bold italic text-amber-200 text-opacity-90"
               style="font-size:clamp(1rem,2.2vw,1.9rem)"></div>
        </div>
        </div>
      </div>`;
    document.body.appendChild(root);
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
        <button onclick="vqXoaGiai(${i})" class="w-9 h-9 rounded-lg text-red-500 hover:bg-red-50"><i class="fas fa-trash"></i></button>
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
    const con = _vqHangCho.length - _vqLuot;
    document.getElementById('vqTienDo').innerText =
        `Lượt ${Math.min(_vqLuot + 1, _vqHangCho.length)}/${_vqHangCho.length} · còn ${_vqDuThi.length} học sinh`;

    const g = _vqHangCho[_vqLuot];
    const box = document.getElementById('vqGiaiHienTai');
    if (g) {
        box.innerHTML = `
          <div class="text-white text-opacity-60 font-bold uppercase tracking-widest text-xs">Đang quay cho</div>
          <div class="text-5xl mt-1">${g.icon}</div>
          <div class="text-white font-black mt-1" style="font-size:clamp(1.4rem,3vw,2.4rem)">${g.ten}</div>
          <div class="text-amber-300 font-black text-xl mt-0.5">+${g.diem} điểm cộng</div>`;
    } else {
        box.innerHTML = `<div class="text-white font-black" style="font-size:clamp(1.3rem,3vw,2rem)">🎉 Đã trao hết ${_vqTrung.length} giải!</div>`;
        document.getElementById('vqNutQuay').classList.add('hidden');
    }

    document.getElementById('vqDaTrung').innerHTML = _vqTrung.length ? `
        <div class="text-white text-opacity-50 font-bold text-xs uppercase tracking-widest mb-1">Đã trúng thưởng</div>` +
        [..._vqTrung].reverse().map(t => `
          <div class="flex items-center gap-2 bg-white bg-opacity-10 rounded-xl px-3 py-2">
            <span class="text-xl">${t.icon}</span>
            <span class="w-10 h-7 rounded-lg bg-amber-400 text-slate-900 font-black flex items-center justify-center">${t.stt}</span>
            <span class="flex-1 min-w-0 truncate text-white font-bold">${t.name}</span>
            <span class="text-white text-opacity-70 text-sm font-bold">${t.giai}</span>
            <span class="text-amber-300 font-black">+${t.diem}</span>
          </div>`).join('') : '';
    void con;
}

function _vqVeVong(sang = -1) {
    const cv = document.getElementById('vqCanvas');
    if (!cv) return;
    const g = cv.getContext('2d');
    const cx = cv.width / 2, cy = cv.height / 2, r = cx - 6;
    g.clearRect(0, 0, cv.width, cv.height);
    if (!_vqDuThi.length) return;

    const goc = (2 * Math.PI) / _vqDuThi.length;
    g.save(); g.translate(cx, cy); g.rotate(_vqGoc);
    for (let i = 0; i < _vqDuThi.length; i++) {
        g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, r, i * goc, (i + 1) * goc); g.closePath();
        g.fillStyle = sang === i ? '#ffffff' : VQ_MAU[i % VQ_MAU.length];
        g.fill();
        g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,.85)'; g.stroke();

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
        const coSo = _vqDuThi.length > 28 ? 16 : (_vqDuThi.length > 16 ? 22 : 28);
        g.font = `900 ${coSo}px sans-serif`;
        g.fillText(String(_vqDuThi[i].stt), huong * (r - 16), 0);
        if (_vqDuThi.length <= 20) {
            g.font = `600 ${Math.round(coSo * 0.52)}px sans-serif`;
            let ten = _vqDuThi[i].name;
            if (ten.length > 14) ten = ten.slice(0, 14) + '…';
            g.fillText(ten, huong * (r - 16 - coSo * 1.6), 0);
        }
        g.restore();
    }
    g.restore();

    g.beginPath(); g.arc(cx, cy, 26, 0, Math.PI * 2);
    g.fillStyle = '#fbbf24'; g.fill();
    g.lineWidth = 4; g.strokeStyle = '#fff'; g.stroke();
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
    document.getElementById('vqKetQua').innerHTML = '';
    const tn = document.getElementById('vqThanhNgu');
    if (tn) tn.style.visibility = 'hidden';

    try { vqNhac.currentTime = 0; vqNhac.play().catch(() => {}); } catch { /* trình duyệt chặn */ }
    let thoiGian = 6000;
    if (!isNaN(vqNhac.duration) && vqNhac.duration > 0 && vqNhac.duration !== Infinity) thoiGian = vqNhac.duration * 1000;

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
        _vqVeVong();

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
    if (!kim) return;
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
    el.innerHTML = `<span style="display:block;font-size:.34em;opacity:.6;line-height:1.1">Số ${hs.stt}</span>
                    <span style="display:block">${hs.name}</span>`;
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

function _vqPhaoGiay(to) {
    if (typeof confetti !== 'function') return;
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
            history.push({ id: Date.now() + Math.random(), classId: currentClassId, studentId: s.id,
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

    _vqTrung.push({ stt: nguoi.stt, name: nguoi.name, giai: giai.ten, diem: giai.diem, icon: giai.icon });
    // Trúng rồi thì ra khỏi vòng quay, mỗi em chỉ một giải
    _vqDuThi.splice(idx, 1);
    _vqLuot++;

    document.getElementById('vqKetQua').innerHTML = `
      <div class="rounded-3xl px-6 py-5 text-center animate-bounce-in" style="background:linear-gradient(135deg,#fbbf24,#f59e0b)">
        <div class="text-slate-900 text-opacity-70 font-black uppercase tracking-widest text-xs">${giai.icon} ${giai.ten}</div>
        <div class="font-black text-slate-900 mt-1" style="font-size:clamp(2.6rem,7vw,5rem);line-height:1">Số ${nguoi.stt}</div>
        <div class="font-black text-slate-900" style="font-size:clamp(1.1rem,2.6vw,2rem)">${nguoi.name}</div>
        <div class="text-slate-900 font-black text-xl mt-1">+${giai.diem} điểm cộng</div>
      </div>`;
    if (typeof showToast === 'function') showToast(`${nguoi.name} trúng ${giai.ten} (+${giai.diem} điểm)`, true);

    const ten = document.getElementById('vqTenSong');
    if (ten) { ten.innerHTML = ''; ten.style.transform = 'scale(1)'; ten.style.color = '#ffffff'; }
    const tn2 = document.getElementById('vqThanhNgu');
    if (tn2) tn2.style.visibility = 'visible';
    _vqChieuThanhNgu();
    _vqDuoiKim = -1;
    _vqGoc = 0;
    _vqCapNhat();
    _vqVeVong();
}
