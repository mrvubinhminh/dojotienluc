// ============================================================
// TRÌNH CHIẾU BÀI LÀM CỦA NHÓM  +  BÚT ĐÁNH DẤU
// ------------------------------------------------------------
// Thầy cô chụp bài làm của các nhóm, tải lên một lúc nhiều ảnh, gán ảnh
// cho từng nhóm rồi chiếu TOÀN MÀN HÌNH khung 16:9 để cả lớp cùng nhìn.
// Có bộ bút nhiều màu, bút dạ quang, tẩy, hoàn tác để chữa bài ngay trên ảnh.
//
// Nét vẽ lưu theo toạ độ tương đối của khung nên đổi máy chiếu, xoay màn
// hình hay bật/tắt toàn màn hình đều không bị lệch.
//
// Giao diện tự dựng bằng JS trong chính file này.
// ============================================================

const BN_MAU = [
    { ten: 'Đỏ',    ma: '#ef4444' },
    { ten: 'Vàng',  ma: '#facc15' },
    { ten: 'Lục',   ma: '#22c55e' },
    { ten: 'Lam',   ma: '#3b82f6' },
    { ten: 'Trắng', ma: '#ffffff' },
    { ten: 'Đen',   ma: '#111111' }
];
const BN_CO = [
    { ten: 'Mảnh', px: 4 },
    { ten: 'Vừa',  px: 9 },
    { ten: 'Đậm',  px: 18 }
];

let _bnAnh    = [];      // [{ id, url, ten, nhom, xoay }]
let _bnNet    = {};      // { anhId: [ {kieu,mau,co,diem:[{x,y}]} ] }
let _bnHienTai = 0;      // chỉ số ảnh đang chiếu
let _bnLocNhom = null;   // null = xem tất cả, số = chỉ xem nhóm đó
let _bnKieu   = 'but';   // 'but' | 'daquang' | 'tay'
let _bnMau    = BN_MAU[0].ma;
let _bnCo     = BN_CO[1].px;
let _bnVe     = false;
let _bnLup     = false;    // đang bật kính lúp?
let _bnLupTuDong = true;   // để máy tự chọn độ phóng vừa đủ
let _bnLupZoom = 3;        // độ phóng đang dùng
const BN_LUP_D = 300;      // đường kính kính lúp, px CSS
let _bnNetTam = null;
let _bnAnThanh = false;

// ── Toàn màn hình thật ───────────────────────────────────────────────────────
function _bnLaFull() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
function bnBatFull(el) {
    const e = el || document.documentElement;
    const f = e.requestFullscreen || e.webkitRequestFullscreen;
    if (f) { try { const p = f.call(e); if (p && p.catch) p.catch(() => {}); } catch { /* trình duyệt chặn */ } }
}
function bnTatFull() {
    const f = document.exitFullscreen || document.webkitExitFullscreen;
    if (f && _bnLaFull()) { try { const p = f.call(document); if (p && p.catch) p.catch(() => {}); } catch { /* bỏ qua */ } }
}
// Nút toàn màn hình dùng chung cho màn chia nhóm
function bnDoiFullNhom() {
    const o = document.getElementById('groupResultOverlay');
    if (_bnLaFull()) bnTatFull(); else bnBatFull(o || document.documentElement);
    setTimeout(_bnCapNhatNutFull, 200);
}
function _bnCapNhatNutFull() {
    const n = document.getElementById('btnFullNhom');
    if (!n) return;
    n.innerHTML = _bnLaFull()
        ? '<i class="fas fa-compress"></i> Thoát full'
        : '<i class="fas fa-expand-arrows-alt"></i> Toàn màn hình';
}

// ── Dựng khung ───────────────────────────────────────────────────────────────
function _bnDungKhung() {
    if (document.getElementById('bnRoot')) return;
    const root = document.createElement('div');
    root.id = 'bnRoot';
    root.innerHTML = `
      <input type="file" id="bnFile" accept="image/*" multiple style="display:none">
      <div id="bnShow" class="fixed inset-0 z-[130] hidden flex-col" style="background:#000">
        <div id="bnThanh" class="flex items-center justify-between gap-2 px-3 py-2 flex-shrink-0 flex-wrap" style="background:#0f172a">
          <div class="flex items-center gap-2 flex-wrap">
            <button onclick="closeBaiNhom()" class="text-white text-opacity-70 hover:text-opacity-100 font-bold text-sm px-2">
              <i class="fas fa-arrow-left mr-1"></i> Đóng
            </button>
            <button onclick="bnChonAnh()" class="bg-indigo-500 hover:bg-indigo-400 text-white font-bold px-3 py-2 rounded-xl text-sm whitespace-nowrap">
              <i class="fas fa-images mr-1"></i> Thêm ảnh
            </button>
            <div id="bnTabs" class="flex gap-1.5 flex-wrap"></div>
          </div>
          <div class="flex items-center gap-1.5 flex-wrap">
            <div id="bnMauBox" class="flex gap-1"></div>
            <div id="bnCoBox" class="flex gap-1"></div>
            <button onclick="bnDoiKieu('daquang')" id="bnBtnDaQuang" title="Bút dạ quang" class="w-9 h-9 rounded-lg bg-white bg-opacity-15 text-white"><i class="fas fa-highlighter"></i></button>
            <button onclick="bnDoiKieu('tay')" id="bnBtnTay" title="Tẩy" class="w-9 h-9 rounded-lg bg-white bg-opacity-15 text-white"><i class="fas fa-eraser"></i></button>
            <button onclick="bnHoanTac()" title="Hoàn tác" class="w-9 h-9 rounded-lg bg-white bg-opacity-15 text-white"><i class="fas fa-rotate-left"></i></button>
            <button onclick="bnXoaNet()" title="Xoá hết nét vẽ" class="w-9 h-9 rounded-lg bg-white bg-opacity-15 text-white"><i class="fas fa-broom"></i></button>
            <span class="w-px h-7 bg-white bg-opacity-20 mx-0.5"></span>
            <button onclick="bnBatLup()" id="bnBtnLup" title="Kính lúp — rê chuột để soi rõ chỗ bất kỳ" class="w-9 h-9 rounded-lg bg-white bg-opacity-15 text-white"><i class="fas fa-magnifying-glass-plus"></i></button>
            <button onclick="bnXoay()" title="Xoay ảnh" class="w-9 h-9 rounded-lg bg-white bg-opacity-15 text-white"><i class="fas fa-rotate"></i></button>
            <button onclick="bnTaiAnhDaChua()" title="Tải ảnh đã chữa của bài này về máy" class="w-9 h-9 rounded-lg bg-emerald-500 bg-opacity-80 text-white"><i class="fas fa-download"></i></button>
            <button onclick="bnTaiTatCa()" title="Tải tất cả ảnh đang xem về máy" class="w-9 h-9 rounded-lg bg-emerald-500 bg-opacity-50 text-white"><i class="fas fa-file-zipper"></i></button>
            <button onclick="bnXoaAnh()" title="Bỏ ảnh này" class="w-9 h-9 rounded-lg bg-red-500 bg-opacity-70 text-white"><i class="fas fa-trash"></i></button>
            <button onclick="bnAnThanh()" title="Ẩn thanh công cụ cho sạch màn hình" class="w-9 h-9 rounded-lg bg-white bg-opacity-15 text-white"><i class="fas fa-eye-slash"></i></button>
            <button onclick="bnDoiFull()" id="bnBtnFull" title="Toàn màn hình" class="w-9 h-9 rounded-lg bg-white bg-opacity-15 text-white"><i class="fas fa-expand-arrows-alt"></i></button>
          </div>
        </div>

        <div class="flex-1 min-h-0 flex items-center justify-center p-1">
          <div id="bnKhung" class="relative" style="background:#000;max-width:100%;max-height:100%">
            <img id="bnImg" alt="Bài làm của nhóm" style="display:block;width:100%;height:100%;object-fit:contain">
            <canvas id="bnCanvas" class="absolute inset-0" style="touch-action:none;cursor:crosshair"></canvas>
            <canvas id="bnLupCv" class="absolute hidden pointer-events-none"
                    style="border-radius:50%;box-shadow:0 0 0 5px rgba(255,255,255,.9),0 12px 40px rgba(0,0,0,.6);background:#000"></canvas>
            <div id="bnLupNhan" class="absolute hidden pointer-events-none px-3 py-1 rounded-lg font-black text-white"
                 style="background:rgba(0,0,0,.7);font-size:14px"></div>
            <div id="bnNhan" class="absolute left-3 top-3 px-4 py-1.5 rounded-xl font-black text-white pointer-events-none"
                 style="background:rgba(0,0,0,.55);font-size:clamp(1rem,2.2vw,2rem)"></div>
            <button onclick="bnHienThanh()" id="bnBtnHien" class="hidden absolute right-3 top-3 w-11 h-11 rounded-xl bg-black bg-opacity-50 text-white"><i class="fas fa-eye"></i></button>
          </div>
        </div>

        <div id="bnDuoi" class="flex items-center justify-between gap-3 px-3 py-2 flex-shrink-0" style="background:#0f172a">
          <button onclick="bnDoiAnh(-1)" class="bg-white bg-opacity-15 hover:bg-opacity-25 text-white font-black px-4 py-2.5 rounded-xl">
            <i class="fas fa-chevron-left"></i>
          </button>
          <div id="bnThumbs" class="flex-1 flex gap-2 overflow-x-auto py-1"></div>
          <button onclick="bnDoiAnh(1)" class="bg-white bg-opacity-15 hover:bg-opacity-25 text-white font-black px-4 py-2.5 rounded-xl">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>`;
    document.body.appendChild(root);

    document.getElementById('bnFile').addEventListener('change', e => {
        _bnNhanFile(e.target.files);
        e.target.value = '';
    });
    const cv = document.getElementById('bnCanvas');
    cv.addEventListener('pointerdown', _bnBatDau);
    cv.addEventListener('pointermove', _bnDiChuyen);
    cv.addEventListener('pointerleave', _bnAnLup);
    cv.addEventListener('wheel', _bnLanChuot, { passive: false });
    window.addEventListener('pointerup', _bnKetThuc);
    window.addEventListener('resize', _bnDatKhung);
    document.addEventListener('fullscreenchange', () => { _bnCapNhatNutFull(); _bnDatKhung(); });
    document.addEventListener('keydown', _bnPhim);
    _bnVeHopMau();
}

function _bnPhim(e) {
    const s = document.getElementById('bnShow');
    if (!s || s.classList.contains('hidden')) return;
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); bnDoiAnh(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); bnDoiAnh(-1); }
    else if (e.key === 'Escape') { if (_bnAnThanh) bnHienThanh(); else closeBaiNhom(); }
    else if (e.key === 'z' || e.key === 'Z') bnHoanTac();
}

function _bnVeHopMau() {
    document.getElementById('bnMauBox').innerHTML = BN_MAU.map(m => `
        <button onclick="bnDoiMau('${m.ma}')" title="${m.ten}" data-mau="${m.ma}"
          class="bn-mau w-8 h-8 rounded-lg border-2" style="background:${m.ma};border-color:${m.ma === _bnMau ? '#fff' : 'transparent'}"></button>`).join('');
    document.getElementById('bnCoBox').innerHTML = BN_CO.map(c => `
        <button onclick="bnDoiCo(${c.px})" title="Nét ${c.ten}" data-co="${c.px}"
          class="bn-co w-9 h-9 rounded-lg bg-white bg-opacity-15 flex items-center justify-center ${c.px === _bnCo ? 'ring-2 ring-white' : ''}">
          <span style="display:block;background:#fff;border-radius:999px;width:${Math.min(22, c.px + 4)}px;height:${Math.min(14, Math.max(3, c.px / 1.6))}px"></span>
        </button>`).join('');
}

// ── Mở / đóng ────────────────────────────────────────────────────────────────
function openBaiNhom() {
    _bnDungKhung();
    _bnHien(true);
    if (_bnAnh.length === 0) bnChonAnh();
    else { _bnVeTabs(); _bnVeThumbs(); _bnChieu(); }
}
function _bnHien(hien) {
    const e = document.getElementById('bnShow');
    if (!e) return;
    if (hien) { e.classList.remove('hidden'); e.classList.add('flex'); }
    else { e.classList.add('hidden'); e.classList.remove('flex'); }
}
function closeBaiNhom() { bnTatFull(); _bnHien(false); }
function bnChonAnh() { document.getElementById('bnFile')?.click(); }

function bnDoiFull() {
    const el = document.getElementById('bnShow');
    if (_bnLaFull()) bnTatFull(); else bnBatFull(el);
    setTimeout(() => { _bnCapNhatNutFull(); _bnDatKhung(); }, 200);
}
function bnAnThanh() {
    _bnAnThanh = true;
    document.getElementById('bnThanh').style.display = 'none';
    document.getElementById('bnDuoi').style.display = 'none';
    document.getElementById('bnBtnHien').classList.remove('hidden');
    setTimeout(_bnDatKhung, 50);
}
function bnHienThanh() {
    _bnAnThanh = false;
    document.getElementById('bnThanh').style.display = '';
    document.getElementById('bnDuoi').style.display = '';
    document.getElementById('bnBtnHien').classList.add('hidden');
    setTimeout(_bnDatKhung, 50);
}

// ── Nhận ảnh ─────────────────────────────────────────────────────────────────
function _bnNhanFile(files) {
    const ds = Array.from(files || []).filter(f => /^image\//.test(f.type));
    if (!ds.length) return;
    const soNhom = (typeof _groupResult !== 'undefined' && _groupResult.length) ? _groupResult.length : 0;
    const batDau = _bnAnh.length;

    ds.forEach((f, i) => {
        _bnAnh.push({
            id: 'a' + Date.now() + '_' + i + '_' + Math.random().toString(36).slice(2, 7),
            url: URL.createObjectURL(f),
            ten: f.name,
            // Rải lần lượt cho các nhóm theo thứ tự tải lên, thầy cô đổi lại được
            nhom: soNhom ? ((batDau + i) % soNhom) + 1 : 0,
            xoay: 0
        });
    });

    _bnDungKhung();
    _bnHien(true);
    _bnHienTai = batDau;            // nhảy tới ảnh đầu tiên vừa thêm
    _bnLocNhom = null;
    _bnVeTabs(); _bnVeThumbs(); _bnChieu();
    // Tải ảnh lên là vào thẳng toàn màn hình, không phải bấm thêm nút nào
    bnBatFull(document.getElementById('bnShow'));
    setTimeout(() => { _bnCapNhatNutFull(); _bnDatKhung(); }, 250);
    if (typeof showToast === 'function') showToast(`Đã thêm ${ds.length} ảnh bài làm`, true);
}

// ── Danh sách ảnh đang xem (có lọc theo nhóm) ────────────────────────────────
function _bnDanhSach() {
    return _bnLocNhom === null ? _bnAnh : _bnAnh.filter(a => a.nhom === _bnLocNhom);
}
function _bnAnhHienTai() { return _bnAnh[_bnHienTai] || null; }

function _bnVeTabs() {
    const box = document.getElementById('bnTabs');
    if (!box) return;
    const soNhom = (typeof _groupResult !== 'undefined' && _groupResult.length) ? _groupResult.length : 0;
    const nut = (nhan, gt, chon) => `
        <button onclick="bnLocNhom(${gt})" class="px-3 py-1.5 rounded-lg font-bold text-sm whitespace-nowrap ${chon ? 'bg-white text-slate-900' : 'bg-white bg-opacity-15 text-white'}">${nhan}</button>`;
    let h = nut(`Tất cả (${_bnAnh.length})`, 'null', _bnLocNhom === null);
    for (let i = 1; i <= soNhom; i++) {
        const n = _bnAnh.filter(a => a.nhom === i).length;
        h += nut(`Nhóm ${i}${n ? ' · ' + n : ''}`, i, _bnLocNhom === i);
    }
    box.innerHTML = h;
}
function bnLocNhom(gt) {
    _bnLocNhom = (gt === 'null' || gt === null) ? null : Number(gt);
    const ds = _bnDanhSach();
    if (ds.length) _bnHienTai = _bnAnh.indexOf(ds[0]);
    _bnVeTabs(); _bnVeThumbs(); _bnChieu();
}

function _bnVeThumbs() {
    const box = document.getElementById('bnThumbs');
    if (!box) return;
    const ds = _bnDanhSach();
    if (!ds.length) { box.innerHTML = '<span class="text-white text-opacity-40 font-bold text-sm px-2">Chưa có ảnh nào — bấm "Thêm ảnh"</span>'; return; }
    box.innerHTML = ds.map(a => {
        const i = _bnAnh.indexOf(a);
        const chon = i === _bnHienTai;
        return `
          <button onclick="bnToiAnh(${i})" class="relative flex-shrink-0 rounded-lg overflow-hidden ${chon ? 'ring-4 ring-indigo-400' : 'opacity-60 hover:opacity-100'}" style="width:92px;height:56px;background:#1e293b">
            <img src="${a.url}" style="width:100%;height:100%;object-fit:cover">
            ${a.nhom ? `<span class="absolute left-0 bottom-0 px-1.5 text-[10px] font-black text-white" style="background:rgba(0,0,0,.6)">N${a.nhom}</span>` : ''}
            ${(_bnNet[a.id] || []).length ? '<span class="absolute right-0 top-0 px-1 text-[10px] font-black text-amber-300" style="background:rgba(0,0,0,.6)">✎</span>' : ''}
          </button>`;
    }).join('');
}

function bnToiAnh(i) { _bnHienTai = i; _bnVeThumbs(); _bnChieu(); }
function bnDoiAnh(d) {
    const ds = _bnDanhSach();
    if (!ds.length) return;
    let vt = ds.indexOf(_bnAnhHienTai());
    if (vt < 0) vt = 0;
    vt = (vt + d + ds.length) % ds.length;
    _bnHienTai = _bnAnh.indexOf(ds[vt]);
    _bnVeThumbs(); _bnChieu();
}

// ── Chiếu một ảnh ────────────────────────────────────────────────────────────
function _bnChieu() {
    const a = _bnAnhHienTai();
    const img = document.getElementById('bnImg');
    const nhan = document.getElementById('bnNhan');
    if (!img) return;
    if (!a) { img.removeAttribute('src'); if (nhan) nhan.innerText = ''; _bnVeLaiNet(); return; }
    // Chỉ nạp lại khi đổi sang ảnh khác: gán lại cùng một src sẽ bắn onload
    // lần nữa và làm ẩn kính lúp đang soi dở.
    if (img.getAttribute('src') !== a.url) img.src = a.url;
    img.style.transform = _bnBienHinh(a);
    if (nhan) nhan.innerText = a.nhom ? `Nhóm ${a.nhom}` : (a.ten || '');
    img.onload = () => {
        _bnDatKhung();
        if (_bnLupTuDong) _bnLupZoom = _bnZoomVuaDu();
    };
    _bnAnLup();
    _bnDatKhung();
}

// Khung luôn giữ đúng tỉ lệ 16:9 và lớn nhất có thể trong chỗ còn trống
function _bnDatKhung() {
    const khung = document.getElementById('bnKhung');
    if (!khung) return;
    const cha = khung.parentElement;
    if (!cha) return;
    const W = cha.clientWidth - 8, H = cha.clientHeight - 8;
    if (W <= 0 || H <= 0) return;
    let w = W, h = Math.round(W * 9 / 16);
    if (h > H) { h = H; w = Math.round(H * 16 / 9); }
    khung.style.width = w + 'px';
    khung.style.height = h + 'px';

    const cv = document.getElementById('bnCanvas');
    if (cv) {
        const dpr = window.devicePixelRatio || 1;
        cv.width = Math.round(w * dpr);
        cv.height = Math.round(h * dpr);
        cv.style.width = w + 'px';
        cv.style.height = h + 'px';
        _bnVeLaiNet();
    }
    const a = _bnAnhHienTai();
    const img = document.getElementById('bnImg');
    if (a && img) img.style.transform = _bnBienHinh(a);
    if (_bnLup && _bnLupTuDong) _bnLupZoom = _bnZoomVuaDu();
    _bnAnLup();
}

// ── Bút đánh dấu ─────────────────────────────────────────────────────────────
function bnDoiMau(ma) {
    _bnMau = ma;
    if (_bnKieu === 'tay') _bnKieu = 'but';
    _bnVeHopMau(); _bnCapNhatNutKieu();
}
function bnDoiCo(px) { _bnCo = px; _bnVeHopMau(); }
function bnDoiKieu(k) {
    _bnKieu = (_bnKieu === k) ? 'but' : k;
    _bnCapNhatNutKieu();
}
function _bnCapNhatNutKieu() {
    const d = document.getElementById('bnBtnDaQuang'), t = document.getElementById('bnBtnTay');
    if (d) d.className = `w-9 h-9 rounded-lg text-white ${_bnKieu === 'daquang' ? 'bg-amber-500' : 'bg-white bg-opacity-15'}`;
    if (t) t.className = `w-9 h-9 rounded-lg text-white ${_bnKieu === 'tay' ? 'bg-rose-500' : 'bg-white bg-opacity-15'}`;
}

function _bnToaDo(e) {
    const cv = document.getElementById('bnCanvas');
    const r = cv.getBoundingClientRect();
    // Lưu theo tỉ lệ 0..1 để không lệch khi đổi kích thước màn hình
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
}
function _bnBatDau(e) {
    if (!_bnAnhHienTai()) return;
    if (_bnLup) { const r = e.currentTarget.getBoundingClientRect(); _bnVeLup(e.clientX - r.left, e.clientY - r.top); return; }
    _bnVe = true;
    // Một số trình duyệt ném lỗi nếu con trỏ không còn hợp lệ — bắt lấy cho chắc
    try { document.getElementById('bnCanvas').setPointerCapture?.(e.pointerId); } catch { /* không bắt được con trỏ cũng vẽ được */ }
    _bnNetTam = { kieu: _bnKieu, mau: _bnMau, co: _bnCo, diem: [_bnToaDo(e)] };
}
function _bnDiChuyen(e) {
    if (_bnLup) {
        const r = e.currentTarget.getBoundingClientRect();
        _bnVeLup(e.clientX - r.left, e.clientY - r.top);
        return;
    }
    if (!_bnVe || !_bnNetTam) return;
    _bnNetTam.diem.push(_bnToaDo(e));
    _bnVeLaiNet();
    e.preventDefault();
}
function _bnKetThuc() {
    if (!_bnVe) return;
    _bnVe = false;
    const a = _bnAnhHienTai();
    if (a && _bnNetTam && _bnNetTam.diem.length) {
        (_bnNet[a.id] ||= []).push(_bnNetTam);
        _bnVeThumbs();
    }
    _bnNetTam = null;
    _bnVeLaiNet();
}
function bnHoanTac() {
    const a = _bnAnhHienTai(); if (!a) return;
    const ds = _bnNet[a.id];
    if (ds && ds.length) { ds.pop(); _bnVeLaiNet(); _bnVeThumbs(); }
}
function bnXoaNet() {
    const a = _bnAnhHienTai(); if (!a) return;
    _bnNet[a.id] = []; _bnVeLaiNet(); _bnVeThumbs();
}
function bnXoay() {
    const a = _bnAnhHienTai(); if (!a) return;
    a.xoay = (a.xoay + 90) % 360;
    document.getElementById('bnImg').style.transform = _bnBienHinh(a);
    _bnAnLup();
}
function bnXoaAnh() {
    const a = _bnAnhHienTai(); if (!a) return;
    if (!window.confirm('Bỏ ảnh này khỏi buổi chiếu?')) return;
    try { URL.revokeObjectURL(a.url); } catch { /* bỏ qua */ }
    delete _bnNet[a.id];
    _bnAnh.splice(_bnHienTai, 1);
    if (_bnHienTai >= _bnAnh.length) _bnHienTai = Math.max(0, _bnAnh.length - 1);
    _bnVeTabs(); _bnVeThumbs(); _bnChieu();
}

function _bnVeLaiNet() {
    const cv = document.getElementById('bnCanvas');
    if (!cv) return;
    const g = cv.getContext('2d');
    g.clearRect(0, 0, cv.width, cv.height);
    const a = _bnAnhHienTai();
    if (!a) return;
    const ds = (_bnNet[a.id] || []).concat(_bnNetTam ? [_bnNetTam] : []);
    const dpr = window.devicePixelRatio || 1;
    g.lineCap = 'round'; g.lineJoin = 'round';

    for (const n of ds) {
        if (n.diem.length < 1) continue;
        g.beginPath();
        n.diem.forEach((p, i) => {
            const x = p.x * cv.width, y = p.y * cv.height;
            if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
        });
        if (n.kieu === 'tay') {
            g.globalCompositeOperation = 'destination-out';
            g.lineWidth = n.co * 4 * dpr;
            g.strokeStyle = 'rgba(0,0,0,1)';
            g.globalAlpha = 1;
        } else if (n.kieu === 'daquang') {
            g.globalCompositeOperation = 'source-over';
            g.lineWidth = n.co * 3.2 * dpr;
            g.strokeStyle = n.mau;
            g.globalAlpha = 0.38;
        } else {
            g.globalCompositeOperation = 'source-over';
            g.lineWidth = n.co * dpr;
            g.strokeStyle = n.mau;
            g.globalAlpha = 1;
        }
        // Chấm một điểm cũng phải thấy được
        if (n.diem.length === 1) {
            const p = n.diem[0];
            g.lineTo(p.x * cv.width + 0.1, p.y * cv.height + 0.1);
        }
        g.stroke();
    }
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
}

// ============================================================
// KÍNH LÚP — soi rõ một vùng bất kỳ của ảnh
// ------------------------------------------------------------
// "Vừa đủ" nghĩa là phóng tới đúng lúc nhìn thấy ảnh ở độ phân giải
// GỐC của file (1 điểm ảnh ảnh = 1 điểm ảnh màn hình). Phóng hơn nữa chỉ
// được ảnh to mà mờ, không thêm chi tiết nào. Vì vậy độ phóng tự tính là
//      zoom = (bề rộng gốc của ảnh) / (bề rộng ảnh đang hiển thị)
// rồi kẹp trong khoảng 2–6 lần: ảnh chụp điện thoại thường cho 3–5 lần,
// ảnh độ phân giải thấp vẫn được phóng tối thiểu 2 lần cho dễ đọc.
// ============================================================

// Ảnh xoay 90° hay 270° thì phải thu nhỏ lại mới nằm lọt trong khung 16:9
function _bnBienHinh(a) {
    const khung = document.getElementById('bnKhung');
    if (!khung || !a) return 'none';
    const W = khung.clientWidth, H = khung.clientHeight;
    const s = (a.xoay % 180 === 0 || !W || !H) ? 1 : Math.min(W / H, H / W);
    return `rotate(${a.xoay}deg) scale(${s})`;
}

// Số liệu hình học của ảnh đang chiếu: cỡ khung, hệ số thu nhỏ của
// object-fit:contain, góc xoay và hệ số scale do xoay.
function _bnHinhHoc() {
    const khung = document.getElementById('bnKhung');
    const img = document.getElementById('bnImg');
    const a = _bnAnhHienTai();
    if (!khung || !img || !a || !img.naturalWidth) return null;
    const W = khung.clientWidth, H = khung.clientHeight;
    const nw = img.naturalWidth, nh = img.naturalHeight;
    const k = Math.min(W / nw, H / nh);              // contain: ảnh bị thu nhỏ bấy nhiêu lần
    const s = (a.xoay % 180 === 0) ? 1 : Math.min(W / H, H / W);
    return { W, H, nw, nh, k, s, goc: a.xoay, rongHienThi: nw * k * s };
}

// Độ phóng vừa đủ để nhìn ảnh ở đúng độ phân giải gốc
function _bnZoomVuaDu() {
    const h = _bnHinhHoc();
    if (!h) return 3;
    const can = 1 / (h.k * h.s);                    // phóng bấy nhiêu là về đúng cỡ gốc
    return Math.round(Math.min(6, Math.max(2, can)) * 10) / 10;
}

// Đổi một điểm trên khung (px CSS) thành toạ độ điểm ảnh của file gốc
function _bnKhungSangAnh(x, y, h) {
    const cx = h.W / 2, cy = h.H / 2;
    // Gỡ ngược phép biến hình CSS: rotate(góc) scale(s)
    const rad = -h.goc * Math.PI / 180;
    const dx = (x - cx) / h.s, dy = (y - cy) / h.s;
    const ix = cx + dx * Math.cos(rad) - dy * Math.sin(rad);
    const iy = cy + dx * Math.sin(rad) + dy * Math.cos(rad);
    // Gỡ ngược object-fit: contain
    const dw = h.nw * h.k, dh = h.nh * h.k;
    return { x: (ix - (h.W - dw) / 2) / h.k, y: (iy - (h.H - dh) / 2) / h.k };
}

function bnBatLup() {
    _bnLup = !_bnLup;
    if (_bnLup && _bnLupTuDong) _bnLupZoom = _bnZoomVuaDu();
    const n = document.getElementById('bnBtnLup');
    if (n) n.className = `w-9 h-9 rounded-lg text-white ${_bnLup ? 'bg-sky-500' : 'bg-white bg-opacity-15'}`;
    const cv = document.getElementById('bnCanvas');
    if (cv) cv.style.cursor = _bnLup ? 'zoom-in' : 'crosshair';
    if (!_bnLup) _bnAnLup();
    else if (typeof showToast === 'function') showToast(`Kính lúp ${_bnLupZoom}× — rê chuột lên ảnh, lăn chuột để chỉnh`, true);
}

function _bnAnLup() {
    document.getElementById('bnLupCv')?.classList.add('hidden');
    document.getElementById('bnLupNhan')?.classList.add('hidden');
}

function _bnVeLup(x, y) {
    const cv = document.getElementById('bnLupCv');
    const nhan = document.getElementById('bnLupNhan');
    const img = document.getElementById('bnImg');
    const h = _bnHinhHoc();
    if (!cv || !h || !img) { _bnAnLup(); return; }

    const D = Math.min(BN_LUP_D, Math.round(Math.min(h.W, h.H) * 0.55));
    const dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(D * dpr); cv.height = Math.round(D * dpr);
    cv.style.width = D + 'px'; cv.style.height = D + 'px';
    // Đặt kính lúp lệch lên trên con trỏ cho khỏi che chỗ đang soi
    let lx = x - D / 2, ly = y - D - 24;
    if (ly < 4) ly = y + 24;
    lx = Math.max(4, Math.min(h.W - D - 4, lx));
    ly = Math.max(4, Math.min(h.H - D - 4, ly));
    cv.style.left = lx + 'px'; cv.style.top = ly + 'px';
    cv.classList.remove('hidden');

    const g = cv.getContext('2d');
    g.save();
    g.scale(dpr, dpr);
    g.clearRect(0, 0, D, D);

    // 1) Vùng ảnh gốc tương ứng, vẽ phóng to
    const tam = _bnKhungSangAnh(x, y, h);
    const canh = (D / _bnLupZoom) / (h.k * h.s);      // bề rộng vùng lấy, tính bằng điểm ảnh gốc
    g.save();
    g.translate(D / 2, D / 2);
    g.rotate(h.goc * Math.PI / 180);
    try {
        g.drawImage(img, tam.x - canh / 2, tam.y - canh / 2, canh, canh, -D / 2, -D / 2, D, D);
    } catch { /* ảnh chưa tải xong */ }
    g.restore();

    // 2) Nét bút cũng phải phóng theo, nếu không soi vào chỗ đã chữa lại không thấy gì
    const a = _bnAnhHienTai();
    const nets = (_bnNet[a?.id] || []).concat(_bnNetTam ? [_bnNetTam] : []);
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (const n of nets) {
        if (!n.diem.length) continue;
        g.beginPath();
        n.diem.forEach((p, i) => {
            const px = (p.x * h.W - x) * _bnLupZoom + D / 2;
            const py = (p.y * h.H - y) * _bnLupZoom + D / 2;
            if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
        });
        if (n.kieu === 'tay') { g.globalCompositeOperation = 'destination-out'; g.lineWidth = n.co * 4 * _bnLupZoom; g.globalAlpha = 1; }
        else if (n.kieu === 'daquang') { g.globalCompositeOperation = 'source-over'; g.lineWidth = n.co * 3.2 * _bnLupZoom; g.strokeStyle = n.mau; g.globalAlpha = 0.38; }
        else { g.globalCompositeOperation = 'source-over'; g.lineWidth = n.co * _bnLupZoom; g.strokeStyle = n.mau; g.globalAlpha = 1; }
        if (n.diem.length === 1) g.lineTo((n.diem[0].x * h.W - x) * _bnLupZoom + D / 2 + 0.1, (n.diem[0].y * h.H - y) * _bnLupZoom + D / 2 + 0.1);
        g.stroke();
    }
    g.restore();

    if (nhan) {
        nhan.innerText = `${_bnLupZoom}×${_bnLupTuDong ? ' (tự chọn)' : ''}`;
        nhan.style.left = lx + 'px';
        nhan.style.top = (ly + D + 6) + 'px';
        nhan.classList.remove('hidden');
    }
}

// Lăn chuột để chỉnh tay độ phóng
function _bnLanChuot(e) {
    if (!_bnLup) return;
    e.preventDefault();
    _bnLupTuDong = false;
    _bnLupZoom = Math.round(Math.min(8, Math.max(1.5, _bnLupZoom + (e.deltaY < 0 ? 0.5 : -0.5))) * 10) / 10;
    const r = document.getElementById('bnCanvas').getBoundingClientRect();
    _bnVeLup(e.clientX - r.left, e.clientY - r.top);
}

// ============================================================
// TẢI ẢNH ĐÃ CHỮA VỀ MÁY
// ------------------------------------------------------------
// Gộp ảnh gốc với nét bút thành một file PNG để lưu làm minh chứng.
// Ảnh xuất ra ở ĐỘ PHÂN GIẢI GỐC của file chụp, đã xoay đúng chiều, và
// chỉ lấy đúng vùng bài làm (bỏ hai dải đen của khung 16:9).
//
// Nét tẩy được vẽ trên một lớp riêng rồi mới chồng lên ảnh, nên tẩy chỉ
// xoá nét bút chứ không khoét thủng bài làm của học sinh.
// ============================================================

// Đổi một điểm của khung thành toạ độ trên ảnh đã xoay
function _bnDiemXuat(p, h) {
    const t = _bnKhungSangAnh(p.x * h.W, p.y * h.H, h);
    switch (((h.goc % 360) + 360) % 360) {
        case 90:  return { x: h.nh - t.y, y: t.x };
        case 180: return { x: h.nw - t.x, y: h.nh - t.y };
        case 270: return { x: t.y, y: h.nw - t.x };
        default:  return { x: t.x, y: t.y };
    }
}

function _bnVeNetLen(g, nets, h, heSo) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (const n of nets) {
        if (!n.diem || !n.diem.length) continue;
        const ds = n.diem.map(p => _bnDiemXuat(p, h));
        g.beginPath();
        ds.forEach((p, i) => { if (i === 0) g.moveTo(p.x, p.y); else g.lineTo(p.x, p.y); });
        if (ds.length === 1) g.lineTo(ds[0].x + 0.1, ds[0].y + 0.1);
        if (n.kieu === 'tay') {
            g.globalCompositeOperation = 'destination-out';
            g.lineWidth = n.co * 4 * heSo; g.globalAlpha = 1; g.strokeStyle = '#000';
        } else if (n.kieu === 'daquang') {
            g.globalCompositeOperation = 'source-over';
            g.lineWidth = n.co * 3.2 * heSo; g.globalAlpha = 0.38; g.strokeStyle = n.mau;
        } else {
            g.globalCompositeOperation = 'source-over';
            g.lineWidth = n.co * heSo; g.globalAlpha = 1; g.strokeStyle = n.mau;
        }
        g.stroke();
    }
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
}

// Dựng ảnh đã chữa của MỘT ảnh, trả về canvas
function _bnDungAnhDaChua(a) {
    const img = document.getElementById('bnImg');
    const h = _bnHinhHoc();
    if (!h || !img) return null;

    const xoay = ((a.xoay % 360) + 360) % 360;
    const W = (xoay % 180 === 0) ? h.nw : h.nh;
    const H = (xoay % 180 === 0) ? h.nh : h.nw;

    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H);
    g.save();
    g.translate(W / 2, H / 2);
    g.rotate(xoay * Math.PI / 180);
    g.drawImage(img, -h.nw / 2, -h.nh / 2, h.nw, h.nh);
    g.restore();

    // Nét bút vẽ ra lớp riêng để nét tẩy không khoét vào ảnh gốc
    const nets = _bnNet[a.id] || [];
    if (nets.length) {
        const lop = document.createElement('canvas');
        lop.width = W; lop.height = H;
        // Một px trên khung bằng bấy nhiêu px trên ảnh gốc
        _bnVeNetLen(lop.getContext('2d'), nets, h, 1 / (h.k * h.s));
        g.drawImage(lop, 0, 0);
    }
    return cv;
}

function _bnTenFile(a) {
    const bo = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '');
    const d = new Date();
    const goc = bo((a.ten || 'bailam').replace(/\.[a-z0-9]+$/i, '')).slice(0, 40) || 'bailam';
    return `${a.nhom ? 'Nhom' + a.nhom + '_' : ''}${goc}_${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}.png`;
}

function _bnTaiCanvas(cv, ten) {
    return new Promise(res => {
        cv.toBlob(blob => {
            if (!blob) { res(false); return; }
            const url = URL.createObjectURL(blob);
            const el = document.createElement('a');
            el.href = url; el.download = ten;
            document.body.appendChild(el); el.click(); el.remove();
            setTimeout(() => URL.revokeObjectURL(url), 3000);
            res(true);
        }, 'image/png');
    });
}

// Tải ảnh đang chiếu
async function bnTaiAnhDaChua() {
    const a = _bnAnhHienTai();
    if (!a) { if (typeof showToast === 'function') showToast('Chưa có ảnh nào để tải!', false); return; }
    const cv = _bnDungAnhDaChua(a);
    if (!cv) { if (typeof showToast === 'function') showToast('Ảnh chưa tải xong, thử lại nhé!', false); return; }
    const ok = await _bnTaiCanvas(cv, _bnTenFile(a));
    if (typeof showToast === 'function') {
        showToast(ok ? `Đã lưu ${cv.width}×${cv.height} về máy` : 'Chưa tạo được ảnh, thử lại nhé!', ok);
    }
}

// Tải tất cả ảnh đang xem (theo tab nhóm đang chọn)
async function bnTaiTatCa() {
    const ds = _bnDanhSach();
    if (!ds.length) { if (typeof showToast === 'function') showToast('Chưa có ảnh nào để tải!', false); return; }
    const nho = _bnHienTai;
    let xong = 0;
    for (const a of ds) {
        _bnHienTai = _bnAnh.indexOf(a);
        _bnChieu();
        // Chờ ảnh vào đúng khung rồi mới dựng, nếu không số đo hình học còn của ảnh cũ
        await new Promise(r => setTimeout(r, 160));
        const cv = _bnDungAnhDaChua(a);
        if (cv && await _bnTaiCanvas(cv, _bnTenFile(a))) xong++;
        await new Promise(r => setTimeout(r, 320));   // trình duyệt cần nhịp giữa các lần tải
    }
    _bnHienTai = nho; _bnChieu(); _bnVeThumbs();
    if (typeof showToast === 'function') showToast(`Đã lưu ${xong}/${ds.length} ảnh đã chữa về máy`, xong > 0);
}
