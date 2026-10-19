// ============================================================
// GỌI TÊN VUI — 9 trò gọi tên ngẫu nhiên dùng chung một bộ máy
// ------------------------------------------------------------
// Ý tưởng tham khảo từ bộ "Gọi Tên Vui" (10 trò) thầy Lực gửi, dựng lại
// trong dojo_app để dùng thẳng danh sách lớp: ảnh đại diện, số thứ tự, tên,
// và nối được vào bảng điểm.
//
// Cách chơi chung: bấm Bắt đầu, nhân vật đi lùng trong 10–30 giây, vài lần
// "chộp hụt rồi nhả ra" cho hồi hộp, người được gọi thật chỉ lộ ở khoảng
// 2 giây cuối. Bật "Lật kèo" thì tưởng đã bắt được ai đó rồi phút chót mới
// lộ ra người khác.
//
// Hai kiểu máy:
//   săn — nhân vật đi lùng từng bạn rồi chộp (7 trò)
//   đua — cả lớp cùng đua, ai về đích trước thì được gọi (2 trò)
//
// Trò "Đĩa Bay Gọi Tên" (UFO) đã có riêng nên không làm lại ở đây.
// ============================================================

const GT_THU_THACH = [
    'Trả lời một câu hỏi của thầy cô',
    'Được +1 điểm nếu trả lời đúng',
    'Được chọn một bạn trả lời thay',
    'Đọc to một câu cho cả lớp nghe',
    'Đặt một câu với từ vừa học',
    'Đố lại cả lớp một câu',
    'Trả lời 2 câu liên tiếp',
    'Lên bảng trình bày một bước giải',
    'Nêu một điều em nhớ nhất bài hôm nay',
    'Chọn một bạn cùng lên bảng'
];

const GT_TRO = [
  { id:'ga', ten:'Trộm Trứng', bieu:'🐔', mo:'Gà mẹ rượt bắt kẻ trộm trứng', kieu:'san',
    san:'🐔', do:'🥚', nen:'nen-dong',
    moDau:'Cục tác! Ai dám trộm trứng của ta?!',
    hut:['Bắt được rồi nhé!','Ối! Tuột mất rồi!','Chạy thoát rồi!','Hụt rồi!','Đứng lại!','Trả trứng đây!'],
    bat:'Lần này bắt được thật rồi!', ket:'Gà mẹ bắt được' },

  { id:'cauca', ten:'Câu Cá', bieu:'🎣', mo:'Cá nào cắn câu thì bị gọi', kieu:'san',
    san:'🎣', do:'🐟', nen:'nen-ho',
    moDau:'Thả câu nào… cá nào sẽ cắn câu đây?',
    hut:['Có cá cắn câu!','Ối, tuột mất rồi!','Cá trốn thoát!','Hụt rồi!','Kéo lên nào!'],
    bat:'Dính rồi! Kéo lên!', ket:'Câu được bạn' },

  { id:'bongbay', ten:'Bóng Bay', bieu:'🎈', mo:'Quả bóng nào nổ thì bị gọi', kieu:'san',
    san:'📌', do:'🎈', nen:'nen-hoi',
    moDau:'Kim đâm bóng đây… quả nào sẽ nổ?',
    hut:['Ơ, không nổ!','Bóng dai quá!','Mổ hụt rồi!','Chưa trúng!','Trượt!'],
    bat:'Bụp! Nổ rồi!', ket:'Quả bóng nổ là của' },

  { id:'khunglong', ten:'Khủng Long', bieu:'🦖', mo:'Khủng long ngửi xem bánh ai ngon', kieu:'san',
    san:'🦖', do:'🍰', nen:'nen-rung',
    moDau:'Rồooo! Ta đói quá! Bánh của ai ngon đây?',
    hut:['Hít hít…','Ừm… không thích!','Bánh này chưa ngon!','Để xem bạn khác…','Eo, bánh này mặn quá!','Phì phì! Trả lại!'],
    bat:'Măm măm! Ngon quá!', ket:'Khủng long ăn bánh của' },

  { id:'denpin', ten:'Đèn Pin', bieu:'🔦', mo:'Tắt đèn, rọi đèn pin đi tìm', kieu:'san',
    san:'🔦', do:'', nen:'nen-toi', toi:true,
    moDau:'Tắt đèn! Đèn pin đi tìm nào…',
    hut:['À… không phải!','Nhầm rồi, đi tiếp!','Trốn kỹ ghê!','Không có ai ở đây…'],
    bat:'Tìm thấy rồi!', ket:'Đèn pin tìm thấy' },

  { id:'hopqua', ten:'Hộp Quà', bieu:'🎁', mo:'Mở hộp quà, nhận một thử thách', kieu:'san',
    san:'👆', do:'🎁', nen:'nen-hoi', thuThach:true,
    moDau:'Xáo trộn hộp quà nào!',
    hut:['Hộp này à…?','Á không! Không phải hộp này!','Khoan đã… tìm tiếp!','Hộp này rỗng!'],
    bat:'Chính là hộp này!', ket:'Hộp quà của' },

  { id:'thedo', ten:'Thẻ Đỏ', bieu:'🟥', mo:'Trọng tài rút thẻ gọi tên', kieu:'san',
    san:'🧑‍⚖️', do:'⚽', nen:'nen-san-bong',
    moDau:'Các cầu thủ và trọng tài đang chạy!',
    hut:['Hừmmm…','Thẻ vàng! Cẩn thận nhé!','Cảnh cáo lần này!','Đá tiếp nào!','Tuýt tuýt! Phạm lỗi!'],
    bat:'THẺ ĐỎ!', ket:'Trọng tài rút thẻ đỏ cho' },

  { id:'duaxe', ten:'Đường Đua', bieu:'🏁', mo:'Ai về đích trước thì được gọi', kieu:'dua',
    san:'🏃', dich:'🏁', nen:'nen-duong-dua',
    moDau:'Vào vị trí… sẵn sàng… xuất phát!',
    sukien:[{t:'Tăng tốc!',v:2.2},{t:'Trượt vỏ chuối!',v:0},{t:'Ngủ gật…',v:0},
            {t:'Chạy lùi!',v:-0.8},{t:'Siêu tốc!',v:3},{t:'Uống nước…',v:0.3}],
    ket:'Về đích đầu tiên là' },

  { id:'tenlua', ten:'Tên Lửa', bieu:'🚀', mo:'Ai lên Mặt Trăng trước thì được gọi', kieu:'dua',
    san:'🚀', dich:'🌕', nen:'nen-vu-tru',
    moDau:'Đếm ngược phóng tên lửa… 3… 2… 1…',
    sukien:[{t:'Turbo!',v:2.6},{t:'Hết xăng!',v:-0.4},{t:'Thiên thạch!',v:0.1},
            {t:'Tăng tốc!',v:2},{t:'Gió sao chổi!',v:1.6},{t:'Lạc đường…',v:0.2}],
    ket:'Lên Mặt Trăng đầu tiên là' }
];

let _gtTro      = null;    // trò đang chơi
let _gtHS       = [];      // [{ id, ten, stt, anh, el, ra, x, v, sk }]
let _gtDaGoi    = [];
let _gtGiay     = 20;
let _gtLatKeo   = false;
let _gtNghiLuot = true;    // bạn đã gọi thì nghỉ lượt sau
let _gtTronCho   = true;   // trộn vị trí mỗi lượt
let _gtAmThanh  = true;
let _gtTrangThai = 'CHO';  // CHO | CHAY | XONG
let _gtMoi      = null;    // người được gọi thật
let _gtRaf      = null;
let _gtHen      = [];
let _gtT0       = 0;
let _gtNhac     = null;
let _gtChoCham  = false;
let _gtAudio    = null;
let _gtNhatKy   = null;

function _gtGiam() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
function _gtHenGio(fn, ms) { const t = setTimeout(fn, ms); _gtHen.push(t); return t; }
function _gtHuyHen() { _gtHen.forEach(clearTimeout); _gtHen = []; }
function _gtChuDau(t) { return (t || '?').trim().split(/\s+/).pop().charAt(0).toUpperCase(); }
function _gtBocNgauNhien(a) { return a[Math.floor(Math.random() * a.length)]; }

// ── Âm thanh (dùng chung nhạc với Đĩa Bay Gọi Tên) ───────────────────────────
function _gtDsNhac() {
    return (typeof UF_NHAC !== 'undefined' && Array.isArray(UF_NHAC)) ? UF_NHAC : [];
}
function _gtBatNhac() {
    _gtDungNhac();
    if (!_gtAmThanh) return;
    const ds = _gtDsNhac();
    if (!ds.length) return;
    try {
        const a = new Audio(_gtBocNgauNhien(ds));
        a.loop = true; a.volume = 0.3; a.preload = 'auto';
        a.addEventListener('error', () => { _gtNhac = null; });
        _gtNhac = a;
        _gtThuPhat();
    } catch (e) { _gtNhac = null; }
}
function _gtThuPhat() {
    if (!_gtNhac || !_gtAmThanh) return;
    const hua = _gtNhac.play();
    if (hua && hua.catch) hua.catch(() => {
        if (_gtChoCham) return;
        _gtChoCham = true;
        const lan1 = () => {
            _gtChoCham = false;
            document.getElementById('gtGame')?.removeEventListener('pointerdown', lan1);
            if (_gtDangMo() && _gtAmThanh) _gtNhac?.play().catch(() => {});
        };
        document.getElementById('gtGame')?.addEventListener('pointerdown', lan1);
    });
}
function _gtDungNhac() {
    if (!_gtNhac) return;
    try { _gtNhac.pause(); _gtNhac.currentTime = 0; } catch (e) {}
    _gtNhac = null;
}
function _gtAmNho(nho) { if (_gtNhac) _gtNhac.volume = nho ? 0.1 : 0.3; }

function _gtTieng(kieu) {
    if (!_gtAmThanh) return;
    try {
        if (!_gtAudio) _gtAudio = new (window.AudioContext || window.webkitAudioContext)();
        const ac = _gtAudio;
        if (ac.state === 'suspended') ac.resume();
        const t0 = ac.currentTime;
        const don = (l, f1, f2, to, dai, tre) => {
            const o = ac.createOscillator(), g = ac.createGain();
            o.connect(g); g.connect(ac.destination);
            const s = t0 + (tre || 0);
            o.type = l; o.frequency.setValueAtTime(f1, s);
            if (f2) o.frequency.exponentialRampToValueAtTime(f2, s + dai);
            g.gain.setValueAtTime(to, s); g.gain.linearRampToValueAtTime(0, s + dai);
            o.start(s); o.stop(s + dai + .01);
        };
        if (kieu === 'di')        don('sine', 620, 880, .04, .09);
        else if (kieu === 'hut')  don('sawtooth', 420, 180, .06, .25);
        else if (kieu === 'tich') don('square', 1050, null, .035, .05);
        else if (kieu === 'bat')  [660, 880, 1320, 1760].forEach((f, i) => don('triangle', f, null, .12, .4, i * .1));
    } catch (e) {}
}

// ── Kiểu dáng ────────────────────────────────────────────────────────────────
function _gtDungKieu() {
    if (document.getElementById('gtKieu')) return;
    const st = document.createElement('style');
    st.id = 'gtKieu';
    st.textContent = `
.gt{
  --gt-chu:#fff; --gt-mo:rgba(255,255,255,.65);
  --gt-vang:#fbbf24; --gt-mat:rgba(255,255,255,.12); --gt-vien:rgba(255,255,255,.2);
  --gt-r:14px; --gt-r-to:22px; --gt-2:8px; --gt-3:14px; --gt-cham:44px;
  color:var(--gt-chu); font-family:"Be Vietnam Pro",system-ui,sans-serif;
  background:#0f172a; user-select:none;
}
.gt:not(.hidden){display:flex;flex-direction:column}
.gt .hidden{display:none !important}
.gt button:focus-visible{outline:3px solid var(--gt-vang);outline-offset:3px;border-radius:var(--gt-r)}

.gt-bar{display:flex;align-items:center;justify-content:space-between;gap:var(--gt-2);
  padding:var(--gt-2) var(--gt-3);flex-shrink:0;z-index:6}
.gt-bar .giua{flex:1;min-width:0;text-align:center}
.gt-ghost{display:inline-flex;align-items:center;justify-content:center;gap:6px;
  min-height:var(--gt-cham);min-width:var(--gt-cham);padding:0 var(--gt-3);border-radius:999px;
  background:var(--gt-mat);color:var(--gt-chu);font-weight:800;font-size:.9rem}
.gt-ghost:hover{background:var(--gt-vien)}
.gt-hide-sm{display:none}
@media(min-width:760px){.gt-hide-sm{display:inline}}
.gt-dem{display:inline-flex;align-items:center;gap:8px;background:rgba(0,0,0,.42);
  border-radius:999px;padding:4px 16px;font-weight:900;font-size:clamp(.9rem,2vw,1.5rem)}
.gt-dem.gap{color:#fca5a5;animation:gtGap .5s ease-in-out infinite}
@keyframes gtGap{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}

/* sân chơi */
.gt-san{flex:1;min-height:0;position:relative;overflow:hidden}
.nen-dong{background:linear-gradient(180deg,#7dd3fc 0%,#bae6fd 42%,#86efac 42%,#4ade80 100%)}
.nen-ho{background:linear-gradient(180deg,#fcd34d 0%,#fde68a 30%,#38bdf8 30%,#0369a1 100%)}
.nen-hoi{background:linear-gradient(180deg,#c4b5fd,#8b5cf6 60%,#6d28d9)}
.nen-rung{background:linear-gradient(180deg,#86efac 0%,#bbf7d0 40%,#65a30d 40%,#3f6212 100%)}
.nen-toi{background:radial-gradient(ellipse at 50% 40%,#1e293b,#020617 75%)}
.nen-san-bong{background:linear-gradient(180deg,#93c5fd 0%,#bfdbfe 34%,#22c55e 34%,#15803d 100%)}
.nen-duong-dua{background:
  repeating-linear-gradient(180deg,rgba(255,255,255,.14) 0 2px,transparent 2px 52px),
  linear-gradient(180deg,#475569,#1e293b)}
.nen-vu-tru{background:radial-gradient(ellipse at 50% 100%,#312e81,#020617 70%)}

/* người chơi */
.gt-ng{position:absolute;display:flex;flex-direction:column;align-items:center;gap:2px;
  width:var(--gt-ng,96px);transition:transform .5s cubic-bezier(.3,1.2,.5,1),opacity .4s;
  will-change:transform}
.gt-ng .do{font-size:calc(var(--gt-ng,96px)*.32);line-height:1;filter:drop-shadow(0 2px 3px rgba(0,0,0,.4))}
.gt-ng .mat{width:calc(var(--gt-ng,96px)*.62);aspect-ratio:1;border-radius:50%;object-fit:cover;
  background:#e5e7eb;border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,.45)}
.gt-ng .mat.thay{display:flex;align-items:center;justify-content:center;background:#c7d2fe;
  color:#312e81;font-weight:900;font-size:calc(var(--gt-ng,96px)*.26)}
.gt-ng .ten{background:#fff;color:#111827;font-weight:800;border-radius:999px;padding:1px 8px;
  font-size:calc(var(--gt-ng,96px)*.145);white-space:nowrap;max-width:100%;overflow:hidden;
  text-overflow:ellipsis;box-shadow:0 2px 6px rgba(0,0,0,.35)}
.gt-ng .ten b{color:#7c3aed;margin-right:3px}
/* khi đua thì xếp ngang theo làn, tên có chỗ hiện đủ */
.gt-ng.ngang{flex-direction:row;align-items:center;gap:5px;width:auto !important;white-space:nowrap}
.gt-ng.ngang .mat{width:var(--gt-ng,44px);flex-shrink:0}
.gt-ng.ngang .do{font-size:calc(var(--gt-ng,44px)*.8)}
.gt-ng.ngang .ten{font-size:clamp(10px,1.2vw,15px);max-width:none}
.gt-ng.soi{z-index:4}
.gt-ng.soi .mat{box-shadow:0 0 0 6px rgba(251,191,36,.6),0 6px 18px rgba(0,0,0,.5)}
.gt-ng.rung{animation:gtRung .3s ease-in-out 2}
@keyframes gtRung{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
.gt-ng.trung{z-index:5}
.gt-ng.trung .mat{box-shadow:0 0 0 9px rgba(251,191,36,.85),0 10px 30px rgba(0,0,0,.6);
  animation:gtTrung .8s ease-in-out infinite}
@keyframes gtTrung{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
.gt-ng.an{opacity:.18}
/* trò Đèn Pin: tối hết, chỉ ai bị rọi mới hiện */
.gt-san.toi .gt-ng{opacity:.1}
.gt-san.toi .gt-ng.soi,.gt-san.toi .gt-ng.trung{opacity:1}

/* nhân vật đi lùng */
.gt-san-vat{position:absolute;z-index:5;font-size:var(--gt-san,70px);line-height:1;
  transition:transform .55s cubic-bezier(.35,1.15,.5,1);will-change:transform;
  filter:drop-shadow(0 6px 10px rgba(0,0,0,.55))}
.gt-san-vat.chop{animation:gtChop .4s ease-out}
@keyframes gtChop{0%{transform:var(--tf) scale(1)}40%{transform:var(--tf) scale(1.35) rotate(-12deg)}
  100%{transform:var(--tf) scale(1)}}
.gt-den{position:absolute;z-index:3;pointer-events:none;border-radius:50%;
  background:radial-gradient(circle,rgba(253,230,138,.55),rgba(253,230,138,0) 70%);
  transition:transform .55s cubic-bezier(.35,1.15,.5,1)}

/* bong bóng thoại */
.gt-thoai{position:absolute;z-index:7;background:#fff;color:#111827;font-weight:900;
  border-radius:16px;padding:6px 14px;font-size:clamp(.8rem,1.7vw,1.25rem);white-space:nowrap;
  box-shadow:0 6px 18px rgba(0,0,0,.45);transform:translate(-50%,-100%);
  animation:gtThoai .35s cubic-bezier(.2,1.5,.4,1)}
.gt-thoai::after{content:"";position:absolute;left:50%;top:100%;transform:translateX(-50%);
  border:9px solid transparent;border-top-color:#fff}
@keyframes gtThoai{from{transform:translate(-50%,-100%) scale(.5);opacity:0}
  to{transform:translate(-50%,-100%) scale(1);opacity:1}}

/* đường đua */
.gt-lan{position:absolute;left:0;right:0;display:flex;align-items:center}
.gt-lan .vach{position:absolute;right:2%;top:0;bottom:0;width:3px;background:rgba(255,255,255,.5)}
.gt-dich{position:absolute;right:1%;z-index:2;font-size:var(--gt-san,70px);line-height:1}
.gt-vach-dich{position:absolute;top:0;bottom:0;width:10px;z-index:1;
  background:repeating-linear-gradient(180deg,#fff 0 14px,#111827 14px 28px);opacity:.85}

.gt-act{flex-shrink:0;display:flex;justify-content:center;gap:var(--gt-3);flex-wrap:wrap;
  padding:var(--gt-2) var(--gt-3) var(--gt-3);z-index:6}
.gt-nut{display:inline-flex;align-items:center;justify-content:center;gap:var(--gt-2);
  min-height:var(--gt-cham);padding:10px clamp(18px,3.5vw,40px);border-radius:var(--gt-r-to);
  font-weight:900;font-size:clamp(.95rem,1.8vw,1.3rem);transition:transform .15s}
.gt-nut:active{transform:translateY(4px)}
.gt-bd{background:linear-gradient(180deg,#4ade80,#16a34a);color:#06281a;box-shadow:0 6px 0 #14532d}
.gt-phu{background:var(--gt-mat);border:1px solid var(--gt-vien);color:var(--gt-chu);
  font-size:clamp(.85rem,1.4vw,1.05rem)}
.gt-nut:disabled{background:var(--gt-mat);color:var(--gt-mo);box-shadow:none;cursor:not-allowed}

/* thẻ công bố */
.gt-ket{position:absolute;inset:0;z-index:9;display:flex;align-items:center;justify-content:center;
  background:rgba(2,6,23,.78);backdrop-filter:blur(5px);padding:var(--gt-3)}
.gt-the{background:linear-gradient(180deg,#fffbeb,#fcd34d);color:#1f2937;border-radius:28px;
  padding:clamp(16px,3vw,34px);text-align:center;max-width:min(92vw,560px);
  box-shadow:0 24px 60px rgba(0,0,0,.6);animation:gtHien .45s cubic-bezier(.2,1.4,.5,1)}
@keyframes gtHien{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}
.gt-the img,.gt-the .thay{width:clamp(96px,16vw,180px);aspect-ratio:1;border-radius:50%;
  object-fit:cover;background:#fff;border:6px solid #f59e0b;box-shadow:0 8px 20px rgba(0,0,0,.3)}
.gt-the .thay{display:inline-flex;align-items:center;justify-content:center;color:#b45309;
  font-weight:900;font-size:clamp(44px,7vw,84px);background:#ffedd5}
.gt-the .nhan{font-weight:800;color:#92400e;font-size:clamp(.85rem,1.6vw,1.15rem);margin-top:8px}
.gt-the .ho{font-weight:900;line-height:1.05;margin:2px 0;font-size:clamp(1.6rem,5.5vw,3.8rem)}
.gt-the .stt{display:inline-block;background:#b45309;color:#fff;font-weight:900;border-radius:999px;
  padding:3px 16px;font-size:clamp(.8rem,1.5vw,1.1rem)}
.gt-the .tt{margin-top:10px;background:#fff;border-radius:16px;padding:8px 14px;font-weight:800;
  color:#7c3aed;font-size:clamp(.85rem,1.7vw,1.2rem)}
.gt-the .hang{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:14px}
.gt-the button{min-height:var(--gt-cham);padding:0 18px;border-radius:var(--gt-r-to);
  font-weight:900;font-size:clamp(.9rem,1.5vw,1.1rem)}
.gt-ok{background:#16a34a;color:#fff}
.gt-diem{background:#7c3aed;color:#fff}
.gt-lai{background:rgba(0,0,0,.1);color:#374151}
@media(max-width:640px){
  .gt-nut{padding:9px 14px;font-size:.9rem}
  .gt-bar{padding:5px 8px}
}
@media(prefers-reduced-motion:reduce){
  .gt-ng,.gt-san-vat,.gt-den,.gt-the,.gt-thoai{animation:none !important;transition-duration:.01ms !important}
}`;
    document.head.appendChild(st);
}

// ── Dựng khung ───────────────────────────────────────────────────────────────
function _gtDungKhung() {
    if (document.getElementById('gtRoot')) return;
    _gtDungKieu();
    const r = document.createElement('div');
    r.id = 'gtRoot';
    r.innerHTML = `
      <div id="gtSetup" class="fixed inset-0 z-[127] hidden items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
        <div class="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
          <div class="px-6 py-4 border-b flex items-center justify-between flex-shrink-0">
            <div>
              <h2 class="text-2xl font-black text-gray-800">🎉 Gọi Tên Vui</h2>
              <p class="text-gray-500 text-sm mt-0.5">9 kiểu gọi tên ngẫu nhiên — chọn một kiểu để bắt đầu</p>
            </div>
            <button onclick="closeGtSetup()" aria-label="Đóng" class="text-gray-400 hover:text-gray-700 text-2xl" style="min-width:44px;min-height:44px">&times;</button>
          </div>
          <div class="flex-1 overflow-y-auto p-5 space-y-5">
            <div id="gtChonTro" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2"></div>
            <div class="bg-gray-50 border rounded-2xl p-4 space-y-3">
              <div>
                <label class="font-black text-gray-800 text-sm">Thời gian mỗi lượt:
                  <span id="gtGiayOut" class="text-indigo-600">20 giây</span></label>
                <input id="gtGiayRange" type="range" min="10" max="30" step="1" value="20"
                       class="w-full mt-1" aria-label="Thời gian mỗi lượt"
                       oninput="gtDatGiay(this.value)">
                <p class="text-[11px] text-gray-500">Trong lúc chờ sẽ có vài lần "chộp hụt rồi nhả ra". Người được gọi thật chỉ lộ ở khoảng 2 giây cuối.</p>
              </div>
              <label class="flex items-center gap-2 font-bold text-sm text-gray-700" style="min-height:44px">
                <input type="checkbox" id="gtLatKeo" class="w-5 h-5 accent-indigo-600" onchange="_gtLatKeo=this.checked">
                🔄 Lật kèo — tưởng bắt được bạn này, phút chót lộ ra bạn khác
              </label>
              <label class="flex items-center gap-2 font-bold text-sm text-gray-700" style="min-height:44px">
                <input type="checkbox" id="gtNghiLuot" class="w-5 h-5 accent-indigo-600" checked onchange="_gtNghiLuot=this.checked">
                🙅 Bạn đã được gọi thì nghỉ lượt sau
              </label>
              <label class="flex items-center gap-2 font-bold text-sm text-gray-700" style="min-height:44px">
                <input type="checkbox" id="gtTronCho" class="w-5 h-5 accent-indigo-600" checked onchange="_gtTronCho=this.checked">
                🔀 Trộn vị trí mỗi lượt
              </label>
            </div>
            <p id="gtTomTat" class="text-gray-600 font-bold text-sm"></p>
          </div>
        </div>
      </div>

      <div id="gtGame" class="gt fixed inset-0 z-[129] hidden" role="dialog" aria-label="Gọi tên vui">
        <header class="gt-bar">
          <button onclick="dongGoiTenVui()" class="gt-ghost" aria-label="Thoát">
            <i class="fas fa-arrow-left" aria-hidden="true"></i><span class="gt-hide-sm">Thoát</span>
          </button>
          <div class="giua"><span class="gt-dem" id="gtDem">0s</span></div>
          <div style="display:flex;gap:8px">
            <button onclick="gtHoanTac()" id="gtNutHoanTac" class="gt-ghost hidden" aria-label="Hoàn tác cộng điểm">
              <i class="fas fa-rotate-left" aria-hidden="true"></i></button>
            <button onclick="gtDoiAm()" id="gtNutAm" class="gt-ghost" aria-label="Bật tắt âm thanh">🔊</button>
            <button onclick="gtDoiFull()" class="gt-ghost" aria-label="Toàn màn hình, phím F">
              <i class="fas fa-expand-arrows-alt" aria-hidden="true"></i></button>
            <button onclick="gtVeChonTro()" class="gt-ghost" aria-label="Đổi trò khác">🎲<span class="gt-hide-sm"> Đổi trò</span></button>
          </div>
        </header>
        <div class="gt-san" id="gtSan"></div>
        <div class="gt-act" id="gtAct"></div>
        <div class="gt-ket hidden" id="gtKet"></div>
      </div>`;
    document.body.appendChild(r);
    document.addEventListener('keydown', _gtPhim);
    window.addEventListener('resize', () => { if (_gtDangMo() && _gtTrangThai !== 'CHAY') _gtXepNguoi(); });
}

function _gtDangMo() {
    const g = document.getElementById('gtGame');
    return g && !g.classList.contains('hidden');
}
function _gtPhim(e) {
    if (!_gtDangMo()) return;
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
    if (e.key === 'f' || e.key === 'F') { e.preventDefault(); gtDoiFull(); }
    else if (e.key === 'Escape') dongGoiTenVui();
    else if ((e.key === ' ' || e.key === 'Enter') && _gtTrangThai === 'CHO') { e.preventDefault(); gtBatDau(); }
}
function gtDoiFull() {
    const el = document.getElementById('gtGame');
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    else el?.requestFullscreen?.().catch(() => {});
}
function gtDoiAm() {
    _gtAmThanh = !_gtAmThanh;
    const b = document.getElementById('gtNutAm');
    if (b) b.textContent = _gtAmThanh ? '🔊' : '🔇';
    if (!_gtAmThanh) { try { _gtNhac?.pause(); } catch (e) {} }
    else if (_gtNhac) _gtThuPhat();
    else _gtBatNhac();
}
function gtDatGiay(v) {
    _gtGiay = Math.max(10, Math.min(30, parseInt(v, 10) || 20));
    const o = document.getElementById('gtGiayOut');
    if (o) o.textContent = _gtGiay + ' giây';
}

// ── Màn chọn trò ─────────────────────────────────────────────────────────────
function openGoiTenVui() {
    if (!currentClassId) {
        if (typeof showToast === 'function') showToast('Hãy chọn lớp trước', 'error');
        return;
    }
    const ds = students.filter(s => s.classId === currentClassId);
    if (ds.length < 2) {
        if (typeof showToast === 'function') showToast('Cần ít nhất 2 học sinh', 'error');
        return;
    }
    _gtDungKhung();
    _gtVeChonTro();
    const tt = document.getElementById('gtTomTat');
    if (tt) tt.textContent = `Lớp đang có ${ds.length} bạn · đã gọi ${_gtDaGoi.length} bạn`;
    const e = document.getElementById('gtSetup');
    e.classList.remove('hidden'); e.classList.add('flex');
}
function closeGtSetup() {
    const e = document.getElementById('gtSetup');
    e.classList.add('hidden'); e.classList.remove('flex');
}
function gtVeChonTro() {
    document.getElementById('gtGame')?.classList.add('hidden');
    _gtDungNhac(); _gtHuyHen(); _gtDungVe();
    openGoiTenVui();
}
function _gtVeChonTro() {
    const o = document.getElementById('gtChonTro');
    if (!o) return;
    o.innerHTML = GT_TRO.map((t, i) => `
      <button onclick="gtChonTro(${i})" title="${t.mo}"
        class="flex flex-col items-center gap-1 p-3 rounded-2xl border-2 border-gray-200 bg-white hover:border-indigo-400 hover:bg-indigo-50 transition active:scale-95"
        style="min-height:44px">
        <span style="font-size:30px;line-height:1">${t.bieu}</span>
        <span class="font-black text-gray-800 text-[13px] text-center leading-tight">${t.ten}</span>
        <span class="text-[10px] text-gray-500 text-center leading-tight">${t.mo}</span>
      </button>`).join('');
}

function gtChonTro(i) {
    _gtTro = GT_TRO[i];
    if (!_gtTro) return;
    closeGtSetup();
    document.getElementById('gtGame').classList.remove('hidden');
    document.getElementById('gtKet').classList.add('hidden');
    _gtTaoNguoi();
    _gtTrangThai = 'CHO';
    _gtVeNut();
    _gtDemHien(_gtGiay);
    _gtThoai(_gtTro.moDau, null, 2200);
    _gtBatNhac();
}

function dongGoiTenVui() {
    _gtHuyHen(); _gtDungVe(); _gtDungNhac();
    _gtTrangThai = 'CHO';
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    document.getElementById('gtGame')?.classList.add('hidden');
    document.getElementById('gtKet')?.classList.add('hidden');
}

// ── Người chơi ───────────────────────────────────────────────────────────────
function _gtNguonHS() {
    let ds = students.filter(s => s.classId === currentClassId)
                     .sort((a, b) => (a.stt || 999) - (b.stt || 999));
    if (_gtNghiLuot && _gtDaGoi.length) {
        const con = ds.filter(s => !_gtDaGoi.includes(s.id));
        if (con.length >= 1) ds = con;      // hết người thì cho cả lớp vào lại
    }
    return ds;
}

function _gtTaoNguoi() {
    const san = document.getElementById('gtSan');
    san.className = 'gt-san ' + (_gtTro.nen || '') + (_gtTro.toi ? ' toi' : '');
    san.innerHTML = '';
    let ds = _gtNguonHS();
    if (_gtTronCho) ds = ds.slice().sort(() => Math.random() - 0.5);
    _gtHS = ds.map(s => {
        const el = document.createElement('div');
        el.className = 'gt-ng';
        const anh = s.avatar
            ? `<img class="mat" alt="" src="${s.avatar}" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'mat thay',textContent:'${_gtChuDau(s.name)}'}))">`
            : `<span class="mat thay">${_gtChuDau(s.name)}</span>`;
        const phuKien = _gtTro.kieu === 'dua' ? _gtTro.san : (_gtTro.do || '');
        el.className = 'gt-ng' + (_gtTro.kieu === 'dua' ? ' ngang' : '');
        el.innerHTML = (phuKien ? `<span class="do">${phuKien}</span>` : '')
            + anh + `<span class="ten"><b>${s.stt ?? '?'}</b>${s.name}</span>`;
        san.appendChild(el);
        return { id: s.id, ten: s.name, stt: s.stt, anh: s.avatar || '', el, x: 0, v: 1, sk: null };
    });
    // nhân vật đi lùng / vạch đích
    if (_gtTro.kieu === 'san') {
        const v = document.createElement('div');
        v.className = 'gt-san-vat'; v.id = 'gtSanVat'; v.textContent = _gtTro.san;
        san.appendChild(v);
        if (_gtTro.toi) {
            const d = document.createElement('div');
            d.className = 'gt-den'; d.id = 'gtDen';
            san.appendChild(d);
        }
    } else {
        const v = document.createElement('div');
        v.className = 'gt-vach-dich'; v.id = 'gtVachDich';
        san.appendChild(v);
        const d = document.createElement('div');
        d.className = 'gt-dich'; d.id = 'gtDich'; d.textContent = _gtTro.dich;
        san.appendChild(d);
    }
    _gtXepNguoi();
}

// xếp chỗ: trò săn thì rải thành lưới, trò đua thì mỗi người một làn
function _gtXepNguoi() {
    const san = document.getElementById('gtSan');
    if (!san || !_gtHS.length) return;
    const W = san.clientWidth, H = san.clientHeight;
    if (W <= 0 || H <= 0) return;
    const n = _gtHS.length;

    if (_gtTro.kieu === 'dua') {
        const cao = Math.max(46, Math.min(96, (H - 10) / n));
        const cv = Math.round(Math.min(cao * .68, 58));          // cỡ ảnh đại diện
        san.style.setProperty('--gt-ng', cv + 'px');
        san.style.setProperty('--gt-san', Math.round(Math.min(cao * .9, 64)) + 'px');
        _gtHS.forEach((p, i) => {
            p.lanY = 6 + (i + .5) * cao;
            p.x0 = W * 0.02; p.x1 = W * 0.80;
            p.el.style.left = '0px';
            p.el.style.top = (p.lanY - cv * .62) + 'px';
            _gtDatX(p, p.x || 0);
        });
        const xDich = (_gtHS[0] ? _gtHS[0].x1 : W * 0.8) + 34;
        const vd = document.getElementById('gtVachDich');
        if (vd) vd.style.left = xDich + 'px';
        const d = document.getElementById('gtDich');      // lá cờ đặt ngay trên vạch đích
        if (d) { d.style.right = 'auto'; d.style.left = (xDich + 14) + 'px';
                 d.style.top = (H / 2 - 34) + 'px'; }
        return;
    }

    const cot = Math.ceil(Math.sqrt(n * (W / Math.max(1, H)) * 1.15));
    const hang = Math.ceil(n / cot);
    const oW = W / cot, oH = (H - 20) / hang;
    const co = Math.max(52, Math.min(130, Math.min(oW * .86, oH * .78)));
    san.style.setProperty('--gt-ng', Math.round(co) + 'px');
    san.style.setProperty('--gt-san', Math.round(Math.min(co * .9, 92)) + 'px');
    _gtHS.forEach((p, i) => {
        const c = i % cot, h = Math.floor(i / cot);
        p.cx = (c + .5) * oW;
        p.cy = 14 + (h + .5) * oH;
        p.el.style.left = (p.cx - co / 2) + 'px';
        p.el.style.top  = (p.cy - co * .62) + 'px';
        p.el.style.width = Math.round(co) + 'px';
    });
}
function _gtDatX(p, x) {
    p.x = x;
    p.el.style.transform = `translateX(${(p.x0 + (p.x1 - p.x0) * Math.max(0, Math.min(1, x)))}px)`;
}

// ── Bắt đầu một lượt ─────────────────────────────────────────────────────────
function gtBatDau() {
    if (_gtTrangThai === 'CHAY' || !_gtHS.length) return;
    if (_gtTronCho || _gtNghiLuot) _gtTaoNguoi();   // xếp lại chỗ cho lượt mới
    _gtTrangThai = 'CHAY';
    _gtVeNut();
    document.getElementById('gtKet')?.classList.add('hidden');
    _gtHS.forEach(p => p.el.classList.remove('soi', 'trung', 'rung', 'an'));

    // người được gọi thật, và người bị "lật kèo" nếu có
    _gtMoi = _gtBocNgauNhien(_gtHS);
    if (_gtTro.kieu === 'dua') _gtRutGonLan();      // lớp đông thì chỉ vài bạn vào đường đua
    const mo = _gtHS.filter(p => p !== _gtMoi);
    const giaMoi = (_gtLatKeo && mo.length) ? _gtBocNgauNhien(mo) : null;

    _gtT0 = Date.now();
    _gtDemNguoc();
    if (_gtTro.kieu === 'san') _gtChaySan(giaMoi);
    else _gtChayDua(giaMoi);
}

// Mỗi bạn một làn thì lớp 40 em sẽ chật và chữ bé xíu. Nên khi đông, bốc ra
// một số bạn vừa đủ chỗ — luôn có mặt người được gọi, nên vẫn hoàn toàn ngẫu nhiên.
function _gtRutGonLan() {
    const san = document.getElementById('gtSan');
    if (!san) return;
    const toiDa = Math.max(4, Math.min(16, Math.floor((san.clientHeight - 12) / 52)));
    if (_gtHS.length <= toiDa) { _gtRutGon = 0; return; }
    const khac = _gtHS.filter(p => p !== _gtMoi).sort(() => Math.random() - 0.5);
    const giu = [_gtMoi, ...khac.slice(0, toiDa - 1)];
    _gtHS.filter(p => !giu.includes(p)).forEach(p => p.el.remove());
    _gtRutGon = _gtHS.length;
    _gtHS = giu.sort(() => Math.random() - 0.5);
    _gtXepNguoi();
    _gtThoai(`Lớp đông quá — bốc ${giu.length} bạn vào đường đua!`, null, 2400);
}
let _gtRutGon = 0;

function _gtDemNguoc() {
    _gtDungVe();
    const buoc = () => {
        const con = Math.max(0, _gtGiay - (Date.now() - _gtT0) / 1000);
        _gtDemHien(con);
        if (_gtTrangThai === 'CHAY') _gtRaf = requestAnimationFrame(buoc);
    };
    _gtRaf = requestAnimationFrame(buoc);
}
function _gtDemHien(con) {
    const e = document.getElementById('gtDem');
    if (!e) return;
    e.textContent = Math.ceil(con) + 's';
    e.classList.toggle('gap', con <= 5 && _gtTrangThai === 'CHAY');
}
function _gtDungVe() { if (_gtRaf) cancelAnimationFrame(_gtRaf); _gtRaf = null; }

// ── Kiểu SĂN: đi lùng từng bạn, chộp hụt vài lần rồi bắt thật ───────────────
function _gtChaySan(giaMoi) {
    const D = _gtGiay * 1000;
    const batThat = D - 1800;                     // lộ người thật ở ~2 giây cuối
    const latKeoTai = giaMoi ? D - 5200 : null;   // lật kèo thì bắt hụt sớm hơn
    const het = latKeoTai || batThat;
    const moiLuot = Math.max(900, Math.min(1700, het / 6));

    let t = 400, lan = 0;
    const khac = _gtHS.filter(p => p !== _gtMoi && p !== giaMoi);
    while (t < het - moiLuot * 0.9) {
        const ai = khac.length ? khac[lan % khac.length] : _gtBocNgauNhien(_gtHS);
        const gio = t;
        _gtHenGio(() => _gtGhe(ai, _gtBocNgauNhien(_gtTro.hut), false), gio);
        t += moiLuot; lan++;
    }
    if (giaMoi) {
        _gtHenGio(() => _gtGhe(giaMoi, _gtTro.bat, true), latKeoTai);
        _gtHenGio(() => _gtThoai('Ơ… khoan đã!', giaMoi, 1400), latKeoTai + 1500);
        _gtHenGio(() => { giaMoi.el.classList.remove('trung', 'soi'); }, latKeoTai + 2400);
        _gtHenGio(() => _gtGhe(_gtMoi, 'Không phải bạn này! Người thật sự là…', true), latKeoTai + 2600);
    } else {
        _gtHenGio(() => _gtGhe(_gtMoi, _gtTro.bat, true), batThat);
    }
    _gtHenGio(() => _gtCongBo(_gtMoi), D);
}

// đưa nhân vật tới một bạn rồi chộp
function _gtGhe(p, loi, that) {
    if (!p || _gtTrangThai !== 'CHAY') return;
    const v = document.getElementById('gtSanVat');
    const den = document.getElementById('gtDen');
    const san = document.getElementById('gtSan');
    _gtHS.forEach(x => x.el.classList.remove('soi'));
    p.el.classList.add('soi');
    const co = parseFloat(getComputedStyle(san).getPropertyValue('--gt-san')) || 70;
    if (v) {
        // đứng chếch sang bên cạnh bạn đó, không đè lên ảnh đại diện
        const san0 = document.getElementById('gtSan');
        const lech = (p.cx > san0.clientWidth / 2) ? -co * 1.15 : co * .25;
        const tf = `translate(${Math.round(p.cx + lech)}px,${Math.round(p.cy - co * .85)}px)`;
        v.style.setProperty('--tf', tf);
        v.style.transform = tf;
        v.classList.remove('chop'); void v.offsetWidth; v.classList.add('chop');
    }
    if (den) {
        const r = co * 2.6;
        den.style.width = r + 'px'; den.style.height = r + 'px';
        den.style.transform = `translate(${Math.round(p.cx - r / 2)}px,${Math.round(p.cy - r / 2)}px)`;
    }
    _gtTieng(that ? 'bat' : 'di');
    _gtThoai(loi, p, that ? 2400 : 1200);
    if (that) { p.el.classList.add('trung'); }
    else { p.el.classList.add('rung'); _gtHenGio(() => p.el.classList.remove('rung'), 700); }
}

// ── Kiểu ĐUA: cả lớp cùng chạy, người được gọi về đích trước ────────────────
function _gtChayDua(giaMoi) {
    const D = _gtGiay * 1000;
    _gtHS.forEach(p => { p.x = 0; p.v = 0.55 + Math.random() * 0.5; p.sk = null; _gtDatX(p, 0); });
    let truoc = performance.now();
    const batDau = truoc;

    const buoc = (now) => {
        if (_gtTrangThai !== 'CHAY') return;
        const dt = Math.min(50, now - truoc) / 1000; truoc = now;
        const tron = (now - batDau) / D;                 // 0 → 1
        _gtHS.forEach(p => {
            // thỉnh thoảng gặp sự kiện vui
            const dangNoi = document.querySelectorAll('.gt-thoai').length;
            if (!p.sk && tron < 0.86 && dangNoi < 3 && Math.random() < dt * 0.3) {
                const sk = _gtBocNgauNhien(_gtTro.sukien);
                p.sk = { v: sk.v, het: now + 900 };
                _gtThoai(sk.t, p, 900);
            }
            if (p.sk && now > p.sk.het) p.sk = null;
            const v = p.sk ? p.sk.v : p.v;
            // ai cũng bị ghìm dưới mức về đích cho tới giây chót
            const tran = p === _gtMoi ? 1 : 0.9;
            const dich = Math.min(tran, tron * (p === _gtMoi ? 1.02 : 0.9));
            p.x = Math.max(0, Math.min(tran, p.x + v * dt * 0.08 + (dich - p.x) * dt * 1.4));
            _gtDatX(p, p.x);
        });
        if (now - batDau >= D) { _gtDatX(_gtMoi, 1); _gtCongBo(_gtMoi); return; }
        _gtRaf2 = requestAnimationFrame(buoc);
    };
    _gtRaf2 = requestAnimationFrame(buoc);

    if (giaMoi) {
        _gtHenGio(() => { giaMoi.el.classList.add('trung'); _gtThoai(_gtTro.ket + '…?', giaMoi, 1500); }, D - 5200);
        _gtHenGio(() => { giaMoi.el.classList.remove('trung'); _gtThoai('Ơ… khoan đã!', giaMoi, 1400); }, D - 3600);
    }
    _gtHenGio(() => { _gtMoi.el.classList.add('trung'); _gtTieng('bat'); }, D - 900);
}
let _gtRaf2 = null;

// ── Bong bóng thoại ──────────────────────────────────────────────────────────
function _gtThoai(loi, p, song) {
    const san = document.getElementById('gtSan');
    if (!san || !loi) return;
    const e = document.createElement('div');
    e.className = 'gt-thoai';
    e.textContent = loi;
    san.appendChild(e);
    const W = san.clientWidth, H = san.clientHeight;
    let x = W / 2, y = H * 0.22;
    if (p) {
        if (_gtTro.kieu === 'dua') {
            x = (p.x0 + (p.x1 - p.x0) * p.x) + 40;
            y = p.lanY - 8;
        } else { x = p.cx; y = p.cy - 40; }
    }
    e.style.left = Math.max(70, Math.min(W - 70, x)) + 'px';
    e.style.top  = Math.max(40, y) + 'px';
    _gtHenGio(() => e.remove(), song || 1200);
}

// ── Công bố ──────────────────────────────────────────────────────────────────
function _gtCongBo(p) {
    _gtHuyHen();
    _gtDungVe();
    if (_gtRaf2) { cancelAnimationFrame(_gtRaf2); _gtRaf2 = null; }
    _gtTrangThai = 'XONG';
    _gtDemHien(0);
    if (!p) return;
    _gtHS.forEach(x => { if (x !== p) x.el.classList.add('an'); });
    p.el.classList.remove('soi'); p.el.classList.add('trung');
    if (!_gtDaGoi.includes(p.id)) _gtDaGoi.push(p.id);
    _gtAmNho(true);
    _gtTieng('bat');
    if (typeof confetti === 'function' && !_gtGiam()) {
        confetti({ particleCount: 150, spread: 110, origin: { y: .5 },
                   colors: ['#fbbf24', '#f97316', '#4ade80', '#fff'] });
    }
    const tt = _gtTro.thuThach ? _gtBocNgauNhien(GT_THU_THACH) : '';
    const ket = document.getElementById('gtKet');
    ket.innerHTML = `
      <div class="gt-the" role="alert">
        ${p.anh
          ? `<img alt="" src="${p.anh}" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'thay',textContent:'${_gtChuDau(p.ten)}'}))">`
          : `<span class="thay">${_gtChuDau(p.ten)}</span>`}
        <p class="nhan">${_gtTro.bieu} ${_gtTro.ket}</p>
        <p class="ho">${p.ten}</p>
        <span class="stt">STT ${p.stt ?? '?'}</span>
        ${tt ? `<p class="tt">🎁 Thử thách: ${tt}</p>` : ''}
        <div class="hang">
          <button class="gt-ok" onclick="gtLuotMoi()">🎯 Gọi bạn tiếp theo</button>
          <button class="gt-diem" onclick="gtChoDiem(${p.id})">⭐ Cho điểm</button>
          <button class="gt-lai" onclick="gtVeChonTro()">🎲 Đổi trò</button>
        </div>
      </div>`;
    ket.classList.remove('hidden');
    _gtVeNut();
}

function gtLuotMoi() {
    document.getElementById('gtKet')?.classList.add('hidden');
    _gtAmNho(false);
    _gtTrangThai = 'CHO';
    const con = _gtNguonHS();
    if (_gtNghiLuot && con.length <= 1 && _gtDaGoi.length >= 1) {
        _gtThoai('Mọi bạn đều đã được gọi — bấm "Làm lại từ đầu"', null, 2600);
    }
    _gtTaoNguoi();
    _gtVeNut();
    _gtDemHien(_gtGiay);
}

function gtLamLai() {
    _gtDaGoi = [];
    gtLuotMoi();
    _gtThoai('Đã xoá danh sách đã gọi — cả lớp vào lại!', null, 2200);
}

function gtChoDiem(id) {
    _gtHuyHen(); _gtDungVe(); _gtDungNhac();
    document.getElementById('gtKet')?.classList.add('hidden');
    document.getElementById('gtGame')?.classList.add('hidden');
    if (typeof openPointsModal === 'function') {
        openPointsModal(id);
        if (typeof showToast === 'function') showToast('Cho điểm xong hãy mở lại Gọi Tên Vui', 'success');
    }
}

function _gtVeNut() {
    const o = document.getElementById('gtAct');
    if (!o) return;
    const daGoi = _gtDaGoi.length;
    if (_gtTrangThai === 'CHAY') {
        o.innerHTML = `<button class="gt-nut gt-phu" onclick="gtBoQua()">⏭️ Bỏ qua, công bố luôn</button>`;
        return;
    }
    o.innerHTML = `
      <button class="gt-nut gt-bd" onclick="gtBatDau()">${_gtTro.bieu} BẮT ĐẦU</button>
      <button class="gt-nut gt-phu" onclick="gtLamLai()" ${daGoi ? '' : 'disabled'}>🔄 Làm lại từ đầu${daGoi ? ` (${daGoi} bạn đã gọi)` : ''}</button>`;
}
function gtBoQua() {
    if (_gtTrangThai !== 'CHAY') return;
    _gtHuyHen();
    _gtCongBo(_gtMoi);
}

function gtHoanTac() {
    if (!_gtNhatKy || !_gtNhatKy.length) return;
    _gtNhatKy.forEach(g => {
        const s = students.find(x => x.id === g.studentId);
        if (s) { s.points -= g.diem; s.positivePoints -= g.diem; }
        const k = history.findIndex(h => h.id === g.lichSuId);
        if (k > -1) history.splice(k, 1);
    });
    _gtNhatKy = null;
    document.getElementById('gtNutHoanTac')?.classList.add('hidden');
    if (typeof saveData === 'function') saveData();
    if (typeof scheduleAutoSync === 'function') scheduleAutoSync();
    if (typeof showToast === 'function') showToast('Đã hoàn tác', 'success');
}
