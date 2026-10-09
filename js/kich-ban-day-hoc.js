// ============================================================
// 10 KỊCH BẢN DẠY HỌC TÍCH CỰC
// ------------------------------------------------------------
// Chiếu CHỮ TO toàn màn hình cách tổ chức thảo luận nhóm, để học sinh
// đọc là biết phải làm gì, làm theo thứ tự nào, mỗi bước mấy phút.
// Có chế độ chiếu từng bước kèm đồng hồ đếm ngược, và tải ảnh đen trắng
// khổ ngang về in phát cho các nhóm.
//
// Toàn bộ giao diện tự dựng bằng JS trong chính file này nên sửa
// index.html không thể xoá nhầm tính năng.
// ============================================================

const KICH_BAN = [
  {
    id: 'khantraiban', emoji: '🧺', ten: 'Khăn trải bàn',
    mucTieu: 'Ai cũng phải nghĩ và viết ra ý của mình trước khi nghe bạn — không ai ngồi im ăn theo.',
    quyMo: 'Nhóm 4 em · mỗi nhóm 1 tờ A2 hoặc A3',
    hopVoi: 'Câu hỏi mở, bài có nhiều cách giải, liệt kê tính chất.',
    buoc: [
      { phut: 1, chu: 'Chia tờ giấy thành 4 ô xung quanh và 1 ô lớn ở giữa. Mỗi bạn ngồi về phía một ô.' },
      { phut: 3, chu: 'IM LẶNG tuyệt đối. Mỗi bạn tự viết ý của riêng mình vào ô của mình, không nhìn bài bạn, không bàn bạc.' },
      { phut: 5, chu: 'Lần lượt từng bạn đọc to ý của mình cho cả nhóm nghe. Các bạn khác chỉ nghe, chưa tranh luận.' },
      { phut: 4, chu: 'Cả nhóm bàn bạc, chọn những ý đúng và hay nhất, viết vào ô giữa. Ý nào cả nhóm đồng ý mới được ghi.' },
      { phut: 2, chu: 'Dán tờ giấy lên bảng. Một bạn đại diện trình bày ô giữa.' }
    ],
    meo: 'Giữ nghiêm 3 phút im lặng ở bước 2 — đây là chỗ quyết định, bỏ qua là hỏng cả kĩ thuật.'
  },
  {
    id: 'laubangchuyen', emoji: '🍲', ten: 'Lẩu băng chuyền',
    mucTieu: 'Mỗi nhóm được đọc và góp ý vào bài của tất cả các nhóm khác, học từ cách làm của bạn.',
    quyMo: '4–6 nhóm · mỗi nhóm 1 tờ giấy lớn và 1 bút màu riêng',
    hopVoi: 'Luyện tập nhiều bài cùng dạng, chữa lỗi sai, mỗi nhóm một bài khác nhau.',
    buoc: [
      { phut: 1, chu: 'Mỗi nhóm nhận một tờ giấy ghi sẵn một bài khác nhau, và một màu bút riêng của nhóm.' },
      { phut: 4, chu: 'Giải bài của nhóm mình vào tờ giấy đó bằng màu bút của nhóm.' },
      { phut: 1, chu: 'Hết giờ, chuyền tờ giấy sang nhóm bên phải. Nhận tờ của nhóm bên trái.' },
      { phut: 3, chu: 'Đọc bài nhóm bạn. KHÔNG xoá gì cả. Thấy sai thì khoanh lại, thấy thiếu thì viết bổ sung bằng màu bút của nhóm mình.' },
      { phut: 1, chu: 'Lại chuyền sang phải. Lặp lại cho đến khi tờ giấy quay về đúng nhóm chủ.' },
      { phut: 5, chu: 'Nhóm chủ đọc tất cả góp ý trên tờ của mình, chốt lời giải đúng và báo cáo trước lớp.' }
    ],
    meo: 'Mỗi nhóm một màu bút khác nhau thì nhìn tờ giấy là biết ngay ý nào của ai, chấm điểm đóng góp rất nhanh.'
  },
  {
    id: 'manhghep', emoji: '🧩', ten: 'Mảnh ghép',
    mucTieu: 'Mỗi em trở thành chuyên gia một phần rồi có trách nhiệm dạy lại cho nhóm — không ai được phép không hiểu.',
    quyMo: 'Nhóm 4 em · bài chia được thành 4 phần ngang nhau',
    hopVoi: 'Bài dài nhiều mục, nhiều trường hợp, nhiều dạng công thức.',
    buoc: [
      { phut: 1, chu: 'Vòng 1 — Mỗi bạn trong nhóm nhận một phần khác nhau: bạn số 1 phần A, số 2 phần B, số 3 phần C, số 4 phần D.' },
      { phut: 6, chu: 'Các bạn cùng số từ các nhóm ngồi lại thành NHÓM CHUYÊN GIA, cùng nghiên cứu thật kỹ phần của mình.' },
      { phut: 2, chu: 'Mỗi chuyên gia tự ghi ra giấy cách giảng lại phần của mình sao cho bạn chưa học cũng hiểu.' },
      { phut: 1, chu: 'Vòng 2 — Tất cả về lại nhóm cũ. Lúc này mỗi nhóm có đủ 4 chuyên gia của 4 phần.' },
      { phut: 8, chu: 'Lần lượt từng chuyên gia giảng phần của mình cho nhóm. Các bạn khác được hỏi lại tới khi hiểu.' },
      { phut: 4, chu: 'Cả nhóm cùng làm một bài tổng hợp cần dùng cả 4 phần.' }
    ],
    meo: 'Khi kiểm tra, gọi ngẫu nhiên một bạn trình bày phần KHÔNG phải của bạn ấy — đó là cách duy nhất biết vòng 2 có thật sự diễn ra.'
  },
  {
    id: 'suynghicapdoi', emoji: '💭', ten: 'Suy nghĩ – Cặp đôi – Chia sẻ',
    mucTieu: 'Em nhút nhát cũng có cơ hội nói, vì nói với một bạn dễ hơn nói trước lớp.',
    quyMo: 'Cả lớp · ngồi theo cặp, không cần chia nhóm',
    hopVoi: 'Mở đầu bài, câu hỏi nhanh giữa giờ, chốt kiến thức cuối tiết.',
    buoc: [
      { phut: 2, chu: 'SUY NGHĨ — Một mình. Tự nghĩ và ghi câu trả lời ra nháp. Chưa nói với ai.' },
      { phut: 3, chu: 'CẶP ĐÔI — Quay sang bạn bên cạnh. Mỗi bạn nói 1 phút, bạn kia chỉ nghe. Rồi đổi vai.' },
      { phut: 2, chu: 'Hai bạn thống nhất một câu trả lời chung, ghi lại.' },
      { phut: 5, chu: 'CHIA SẺ — Thầy cô gọi vài cặp trình bày. Nói "chúng em nghĩ là…" chứ không phải "em nghĩ là…".' }
    ],
    meo: 'Kĩ thuật nhanh nhất, không cần chuẩn bị gì, dùng xen giữa bài giảng khi thấy lớp bắt đầu mất tập trung.'
  },
  {
    id: 'phongtranh', emoji: '🖼️', ten: 'Phòng tranh',
    mucTieu: 'Các nhóm xem được sản phẩm của nhau và học cách nhận xét có căn cứ.',
    quyMo: '4–8 nhóm · giấy lớn dán tường, giấy nhớ nhiều màu',
    hopVoi: 'Sau khi các nhóm đã làm xong sản phẩm: sơ đồ tư duy, poster, lời giải.',
    buoc: [
      { phut: 2, chu: 'Mỗi nhóm dán sản phẩm của mình lên một vị trí trên tường. Cử 1 bạn ở lại làm người thuyết minh.' },
      { phut: 8, chu: 'Các bạn còn lại đi vòng quanh lớp xem sản phẩm của tất cả các nhóm khác.' },
      { phut: 0, chu: 'Ở mỗi sản phẩm: dán 1 giấy nhớ XANH ghi một điều hay, 1 giấy nhớ VÀNG ghi một câu hỏi hoặc chỗ chưa rõ.' },
      { phut: 3, chu: 'Về lại nhóm. Người thuyết minh báo cáo lại những gì khách đã hỏi.' },
      { phut: 4, chu: 'Nhóm đọc hết giấy nhớ, sửa lại sản phẩm của mình cho tốt hơn.' }
    ],
    meo: 'Bắt buộc mỗi bạn phải dán đủ số giấy nhớ, nếu không nhiều em chỉ đi dạo cho hết giờ.'
  },
  {
    id: 'beca', emoji: '🐟', ten: 'Bể cá',
    mucTieu: 'Cả lớp học cách thảo luận bằng việc quan sát một nhóm thảo luận mẫu.',
    quyMo: 'Vòng trong 5–6 em · vòng ngoài là cả lớp',
    hopVoi: 'Vấn đề có nhiều ý kiến trái chiều, bài toán nhiều hướng giải.',
    buoc: [
      { phut: 1, chu: 'Xếp 5–6 ghế thành vòng tròn giữa lớp. Nhóm thảo luận ngồi vòng trong, cả lớp ngồi vòng ngoài.' },
      { phut: 8, chu: 'Vòng trong thảo luận bình thường. Vòng ngoài TUYỆT ĐỐI im lặng, chỉ quan sát và ghi chép.' },
      { phut: 0, chu: 'Vòng ngoài ghi: ý nào hay, ai lập luận chặt, chỗ nào nhóm bỏ sót.' },
      { phut: 2, chu: 'Để trống một ghế trong vòng trong. Bạn nào ở vòng ngoài muốn góp ý thì ra ngồi ghế đó, nói xong quay về.' },
      { phut: 5, chu: 'Kết thúc, vòng ngoài nhận xét về CÁCH thảo luận của vòng trong, không nhận xét về người.' }
    ],
    meo: 'Chiếc ghế trống là linh hồn của kĩ thuật này — nó biến người xem thành người chơi bất cứ lúc nào.'
  },
  {
    id: 'danhsochiase', emoji: '🔢', ten: 'Đánh số cùng chia sẻ',
    mucTieu: 'Cả nhóm phải lo cho mọi thành viên cùng hiểu, vì không ai biết trước ai sẽ bị gọi.',
    quyMo: 'Nhóm 4 em · mỗi em một số từ 1 đến 4',
    hopVoi: 'Kiểm tra mức độ hiểu bài của cả lớp sau một hoạt động nhóm.',
    buoc: [
      { phut: 1, chu: 'Mỗi bạn trong nhóm nhận một số: 1, 2, 3, 4. Nhớ kỹ số của mình.' },
      { phut: 6, chu: 'Cả nhóm cùng làm nhiệm vụ. Nhiệm vụ của nhóm là làm cho CẢ BỐN BẠN đều trình bày được.' },
      { phut: 1, chu: 'Hết giờ, thầy cô gọi một con số bất kỳ, ví dụ "số 3".' },
      { phut: 4, chu: 'Tất cả các bạn mang số 3 ở mọi nhóm đứng lên trả lời. Điểm của bạn ấy là điểm của cả nhóm.' }
    ],
    meo: 'Chỉ công bố số sau khi hết giờ thảo luận. Biết trước là cả nhóm chỉ lo cho một bạn.'
  },
  {
    id: 'obi', emoji: '⚙️', ten: 'Ổ bi — vòng trong vòng ngoài',
    mucTieu: 'Mỗi em được nói đi nói lại nhiều lần với nhiều bạn khác nhau, nói càng về sau càng trôi chảy.',
    quyMo: 'Cả lớp · hai vòng tròn đồng tâm, quay mặt vào nhau',
    hopVoi: 'Học thuộc công thức, luyện nói định nghĩa, hỏi đáp nhanh.',
    buoc: [
      { phut: 2, chu: 'Nửa lớp đứng thành vòng tròn trong, nửa còn lại thành vòng ngoài, mỗi bạn đối diện một bạn.' },
      { phut: 2, chu: 'Bạn vòng trong hỏi, bạn vòng ngoài trả lời. Hết 1 phút thì đổi vai.' },
      { phut: 1, chu: 'Thầy cô ra hiệu, VÒNG NGOÀI bước sang phải 2 bước để gặp bạn mới.' },
      { phut: 0, chu: 'Lặp lại 4–5 lượt với 4–5 bạn khác nhau.' },
      { phut: 3, chu: 'Về chỗ, viết lại câu trả lời hoàn chỉnh nhất mà mình nghe được trong các lượt.' }
    ],
    meo: 'Chỉ cho một vòng di chuyển, vòng kia đứng yên — cho cả hai cùng đi là lớp sẽ loạn ngay.'
  },
  {
    id: 'tiepsuc', emoji: '🏃', ten: 'Tiếp sức',
    mucTieu: 'Tạo không khí sôi nổi, mỗi em chỉ làm một bước nên ai cũng phải theo dõi bài của bạn.',
    quyMo: '3–4 nhóm · mỗi nhóm một phần bảng và một viên phấn',
    hopVoi: 'Bài giải nhiều bước, rút gọn biểu thức, giải phương trình dài.',
    buoc: [
      { phut: 1, chu: 'Mỗi nhóm xếp thành một hàng dọc, đứng cách bảng vài bước. Bạn đầu hàng cầm phấn.' },
      { phut: 0, chu: 'Bạn thứ nhất chạy lên làm ĐÚNG MỘT BƯỚC của bài, rồi chạy về đưa phấn cho bạn kế tiếp.' },
      { phut: 0, chu: 'Bạn kế tiếp đọc bước của bạn trước. Nếu thấy sai thì được sửa, sửa đúng tính là một bước.' },
      { phut: 6, chu: 'Cứ thế cho tới khi bài xong. Không ai được làm hai bước liền nhau.' },
      { phut: 4, chu: 'Cả lớp cùng soi lại bài của từng nhóm, tìm bước sai đầu tiên nếu có.' }
    ],
    meo: 'Chấm theo "bước đúng đầu tiên bị sai" chứ không chỉ chấm kết quả — như vậy nhóm sai từ sớm vẫn được ghi nhận phần làm đúng.'
  },
  {
    id: 'tramhoctap', emoji: '🗺️', ten: 'Trạm học tập',
    mucTieu: 'Mỗi trạm một kiểu nhiệm vụ khác nhau, học sinh được vận động và đổi không khí liên tục.',
    quyMo: '4–5 trạm đặt quanh lớp · nhóm 4–6 em di chuyển theo vòng',
    hopVoi: 'Tiết ôn tập chương, luyện tập tổng hợp nhiều dạng.',
    buoc: [
      { phut: 2, chu: 'Thầy cô giới thiệu các trạm. Mỗi trạm có một phiếu nhiệm vụ riêng và một kiểu hoạt động riêng.' },
      { phut: 1, chu: 'Mỗi nhóm bắt đầu ở một trạm khác nhau, mang theo phiếu ghi kết quả của nhóm mình.' },
      { phut: 6, chu: 'Làm nhiệm vụ tại trạm. Ghi kết quả vào phiếu của nhóm, để nguyên đồ dùng cho nhóm sau.' },
      { phut: 1, chu: 'Nghe hiệu lệnh, cả nhóm chuyển sang trạm kế tiếp theo chiều kim đồng hồ.' },
      { phut: 0, chu: 'Lặp lại cho tới khi nhóm đi hết các trạm.' },
      { phut: 5, chu: 'Về chỗ, đối chiếu phiếu với đáp án, thống kê nhóm làm tốt nhất ở trạm nào.' }
    ],
    meo: 'Đặt ở mỗi trạm một phong bì đáp án dán kín, chỉ mở khi hết giờ — tránh nhóm đi sau chép của nhóm đi trước.'
  }
];

// ── Trạng thái ───────────────────────────────────────────────────────────────
let _kbDangDung = null;
let _kbBuoc     = 0;       // bước đang chiếu ở chế độ từng bước
let _kbScale    = 1;
let _kbConLai   = 0;       // giây còn lại của đồng hồ
let _kbTimer    = null;

// ── Dựng khung giao diện ─────────────────────────────────────────────────────
function _kbDungKhung() {
    if (document.getElementById('kbRoot')) return;
    const root = document.createElement('div');
    root.id = 'kbRoot';
    root.innerHTML = `
      <div id="kbMenu" class="fixed inset-0 z-[120] hidden items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
        <div class="bg-white rounded-3xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
          <div class="px-6 py-4 border-b flex items-center justify-between flex-shrink-0">
            <div>
              <h2 class="text-2xl font-black text-gray-800"><i class="fas fa-chalkboard-user text-indigo-600 mr-2"></i>Kịch bản dạy học tích cực</h2>
              <p class="text-gray-500 text-sm mt-0.5">Chọn một cách tổ chức thảo luận rồi chiếu lên cho cả lớp làm theo</p>
            </div>
            <button onclick="closeKbMenu()" class="text-gray-400 hover:text-gray-700 text-2xl w-10 h-10">&times;</button>
          </div>
          <div id="kbMenuList" class="flex-1 overflow-y-auto p-5 grid md:grid-cols-2 gap-4"></div>
        </div>
      </div>

      <div id="kbShow" class="fixed inset-0 z-[121] hidden flex-col" style="background:#0f172a">
        <div class="flex items-center justify-between gap-2 px-4 py-3 flex-shrink-0" style="background:rgba(0,0,0,.35)">
          <button onclick="closeKbShow()" class="text-white text-opacity-70 hover:text-opacity-100 font-bold text-sm whitespace-nowrap">
            <i class="fas fa-arrow-left mr-1"></i> Đổi kịch bản
          </button>
          <h2 id="kbShowTitle" class="text-white font-black text-base md:text-2xl text-center truncate flex-1 px-2"></h2>
          <div class="flex gap-2 flex-shrink-0">
            <button onclick="_kbCoChu(-1)" class="w-9 h-9 rounded-lg bg-white bg-opacity-15 text-white font-black">A-</button>
            <button onclick="_kbCoChu(1)" class="w-9 h-9 rounded-lg bg-white bg-opacity-15 text-white font-black">A+</button>
            <button onclick="taiAnhKichBan()" title="Tải ảnh đen trắng khổ ngang để in phát cho các nhóm"
              class="bg-white bg-opacity-15 hover:bg-opacity-25 text-white font-bold px-3 py-2 rounded-xl whitespace-nowrap">
              <i class="fas fa-download mr-1"></i> Tải ảnh in
            </button>
            <button onclick="chieuTungBuoc()" class="bg-indigo-500 hover:bg-indigo-400 text-white font-black px-4 py-2 rounded-xl whitespace-nowrap">
              <i class="fas fa-play mr-1"></i> Chiếu từng bước
            </button>
          </div>
        </div>
        <div id="kbShowBody" class="flex-1 overflow-y-auto p-4 md:p-8"></div>
      </div>

      <div id="kbStep" class="fixed inset-0 z-[122] hidden flex-col" style="background:#0f172a">
        <div class="flex items-center justify-between gap-2 px-4 py-3 flex-shrink-0" style="background:rgba(0,0,0,.35)">
          <button onclick="closeKbStep()" class="text-white text-opacity-70 hover:text-opacity-100 font-bold text-sm whitespace-nowrap">
            <i class="fas fa-arrow-left mr-1"></i> Xem toàn bộ
          </button>
          <h2 id="kbStepTitle" class="text-white font-black text-base md:text-xl truncate flex-1 text-center px-2"></h2>
          <button onclick="closeKbAll()" class="text-white text-opacity-70 hover:text-opacity-100 font-bold text-sm whitespace-nowrap">
            Đóng <i class="fas fa-times ml-1"></i>
          </button>
        </div>
        <div id="kbStepBody" class="flex-1 min-h-0 flex flex-col items-center justify-center p-5 md:p-10 text-center"></div>
        <div class="flex items-center justify-between gap-3 px-4 py-4 flex-shrink-0" style="background:rgba(0,0,0,.35)">
          <button onclick="_kbDoiBuoc(-1)" id="kbPrev" class="bg-white bg-opacity-15 hover:bg-opacity-25 text-white font-black px-5 md:px-8 py-3 md:py-4 rounded-2xl text-base md:text-xl">
            <i class="fas fa-chevron-left mr-1"></i> Bước trước
          </button>
          <div id="kbDots" class="flex gap-2 overflow-x-auto"></div>
          <button onclick="_kbDoiBuoc(1)" id="kbNext" class="bg-white bg-opacity-15 hover:bg-opacity-25 text-white font-black px-5 md:px-8 py-3 md:py-4 rounded-2xl text-base md:text-xl">
            Bước sau <i class="fas fa-chevron-right ml-1"></i>
          </button>
        </div>
      </div>`;
    document.body.appendChild(root);
    document.addEventListener('keydown', _kbPhim);
}

function _kbPhim(e) {
    const s = document.getElementById('kbStep');
    if (!s || s.classList.contains('hidden')) return;
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); _kbDoiBuoc(1); }
    else if (e.key === 'ArrowLeft') _kbDoiBuoc(-1);
    else if (e.key === 'Escape') closeKbStep();
}

function _kbHien(id, hien) {
    const e = document.getElementById(id);
    if (!e) return;
    if (hien) { e.classList.remove('hidden'); e.classList.add('flex'); }
    else      { e.classList.add('hidden');    e.classList.remove('flex'); }
}

// ── Menu 10 kịch bản ─────────────────────────────────────────────────────────
function openKichBanMenu() {
    _kbDungKhung();
    document.getElementById('kbMenuList').innerHTML = KICH_BAN.map(k => `
        <button onclick="chonKichBan('${k.id}')"
          class="text-left border-2 border-gray-200 hover:border-indigo-500 rounded-2xl p-4 transition active:scale-[.98] bg-white">
          <div class="flex items-start gap-3">
            <span class="text-3xl flex-shrink-0">${k.emoji}</span>
            <div class="min-w-0">
              <h3 class="font-black text-gray-800 text-lg leading-tight">${k.ten}</h3>
              <p class="text-gray-500 text-sm mt-1 leading-snug">${k.mucTieu}</p>
              <p class="text-indigo-600 text-xs font-bold mt-2">${k.quyMo} · ${k.buoc.length} bước · khoảng ${_kbTongPhut(k)} phút</p>
            </div>
          </div>
        </button>`).join('');
    _kbHien('kbMenu', true);
}
function closeKbMenu() { _kbHien('kbMenu', false); }
function _kbTongPhut(k) { return k.buoc.reduce((s, b) => s + (b.phut || 0), 0); }

// ── Chiếu toàn bộ kịch bản ───────────────────────────────────────────────────
function _kbCoChu(d) {
    _kbScale = Math.min(1.8, Math.max(0.7, +(_kbScale + d * 0.1).toFixed(2)));
    const b = document.getElementById('kbShowBody');
    if (b) b.style.fontSize = (_kbScale * 100) + '%';
}

function chonKichBan(id) {
    const k = KICH_BAN.find(x => x.id === id);
    if (!k) return;
    _kbDangDung = k; _kbBuoc = 0;
    _kbDungKhung();
    closeKbMenu();
    _kbVeToanBo();
    _kbHien('kbShow', true);
}

function _kbVeToanBo() {
    const k = _kbDangDung;
    if (!k || !document.getElementById('kbShowTitle')) return;
    document.getElementById('kbShowTitle').innerText = `${k.emoji} ${k.ten}`;
    document.getElementById('kbShowBody').innerHTML = `
      <div class="max-w-6xl mx-auto">
        <div class="grid md:grid-cols-3 gap-3 mb-6">
          <div class="bg-white bg-opacity-10 rounded-2xl p-4">
            <div class="text-indigo-300 font-black text-xs uppercase tracking-wider mb-1">Để làm gì</div>
            <div class="text-white font-bold text-base md:text-xl leading-snug">${k.mucTieu}</div>
          </div>
          <div class="bg-white bg-opacity-10 rounded-2xl p-4">
            <div class="text-indigo-300 font-black text-xs uppercase tracking-wider mb-1">Quy mô</div>
            <div class="text-white font-bold text-base md:text-xl leading-snug">${k.quyMo}</div>
          </div>
          <div class="bg-white bg-opacity-10 rounded-2xl p-4">
            <div class="text-indigo-300 font-black text-xs uppercase tracking-wider mb-1">Hợp với</div>
            <div class="text-white font-bold text-base md:text-xl leading-snug">${k.hopVoi}</div>
          </div>
        </div>
        ${k.buoc.map((b, i) => `
          <div class="flex gap-4 items-start mb-4">
            <div class="flex-shrink-0 rounded-2xl bg-indigo-500 text-white font-black flex items-center justify-center"
                 style="width:3.2em;height:3.2em;font-size:1.3em">${i + 1}</div>
            <div class="flex-1 bg-white bg-opacity-5 rounded-2xl p-4">
              <div class="text-white font-bold text-xl md:text-3xl leading-snug">${b.chu}</div>
              ${b.phut ? `<div class="text-amber-300 font-black text-base md:text-xl mt-2"><i class="far fa-clock mr-1"></i>${b.phut} phút</div>` : ''}
            </div>
          </div>`).join('')}
        <div class="bg-amber-500 bg-opacity-20 border-2 border-amber-500 rounded-2xl p-4 mt-6">
          <div class="text-amber-300 font-black text-sm uppercase tracking-wider mb-1">💡 Mẹo cho thầy cô</div>
          <div class="text-white font-bold text-base md:text-2xl leading-snug">${k.meo}</div>
        </div>
      </div>`;
    document.getElementById('kbShowBody').style.fontSize = (_kbScale * 100) + '%';
}
function closeKbShow() { _kbHien('kbShow', false); openKichBanMenu(); }

// ── Chiếu từng bước, kèm đồng hồ ─────────────────────────────────────────────
function chieuTungBuoc() {
    if (!_kbDangDung) return;
    _kbBuoc = 0;
    _kbHien('kbShow', false);
    _kbHien('kbStep', true);
    document.getElementById('kbStepTitle').innerText = `${_kbDangDung.emoji} ${_kbDangDung.ten}`;
    _kbVeBuoc();
}
function closeKbStep() { _kbDungDongHo(); _kbHien('kbStep', false); _kbHien('kbShow', true); }
function closeKbAll() { _kbDungDongHo(); ['kbMenu', 'kbShow', 'kbStep'].forEach(id => _kbHien(id, false)); }

function _kbDoiBuoc(d) {
    const k = _kbDangDung; if (!k) return;
    const moi = _kbBuoc + d;
    if (moi < 0 || moi >= k.buoc.length) return;
    _kbDungDongHo();
    _kbBuoc = moi;
    _kbVeBuoc();
}

function _kbVeBuoc() {
    const k = _kbDangDung; if (!k) return;
    const b = k.buoc[_kbBuoc];
    const body = document.getElementById('kbStepBody');
    if (!body) return;

    body.innerHTML = `
      <div class="text-indigo-300 font-black uppercase tracking-[0.2em] text-base md:text-2xl mb-3">
        Bước ${_kbBuoc + 1} / ${k.buoc.length}
      </div>
      <div class="text-white font-black leading-tight max-w-6xl" style="font-size:clamp(1.6rem,4.2vw,4rem)">${b.chu}</div>
      ${b.phut ? `
        <div class="mt-8 flex flex-col items-center gap-3">
          <div id="kbDongHo" class="font-black tabular-nums" style="font-size:clamp(3rem,10vw,8rem);color:#fbbf24">${_kbMmss(b.phut * 60)}</div>
          <div class="flex gap-3">
            <button id="kbBtnTimer" onclick="_kbBatTat()" class="bg-amber-500 hover:bg-amber-400 text-slate-900 font-black px-6 py-3 rounded-2xl text-lg">
              <i class="fas fa-play mr-1"></i> Bắt đầu ${b.phut} phút
            </button>
            <button onclick="_kbDatLai()" class="bg-white bg-opacity-15 hover:bg-opacity-25 text-white font-bold px-5 py-3 rounded-2xl text-lg">Đặt lại</button>
          </div>
        </div>` : `<div class="mt-8 text-white text-opacity-50 font-bold text-lg md:text-2xl">Bước này làm liền, không tính giờ</div>`}`;

    _kbConLai = (b.phut || 0) * 60;

    document.getElementById('kbDots').innerHTML = k.buoc.map((_, i) =>
        `<button onclick="_kbNhayBuoc(${i})" title="Bước ${i + 1}"
           class="w-4 h-4 rounded-full flex-shrink-0 transition ${i === _kbBuoc ? 'bg-indigo-400' : 'bg-white bg-opacity-25 hover:bg-opacity-50'}"></button>`).join('');
    document.getElementById('kbPrev').style.visibility = _kbBuoc === 0 ? 'hidden' : 'visible';
    document.getElementById('kbNext').style.visibility = _kbBuoc === k.buoc.length - 1 ? 'hidden' : 'visible';
}
function _kbNhayBuoc(i) { _kbDungDongHo(); _kbBuoc = i; _kbVeBuoc(); }

function _kbMmss(gi) {
    gi = Math.max(0, gi);
    return String(Math.floor(gi / 60)).padStart(2, '0') + ':' + String(gi % 60).padStart(2, '0');
}
function _kbDungDongHo() { if (_kbTimer) { clearInterval(_kbTimer); _kbTimer = null; } }
function _kbDatLai() {
    _kbDungDongHo();
    const b = _kbDangDung?.buoc[_kbBuoc];
    _kbConLai = (b?.phut || 0) * 60;
    const d = document.getElementById('kbDongHo'); if (d) { d.innerText = _kbMmss(_kbConLai); d.style.color = '#fbbf24'; }
    const n = document.getElementById('kbBtnTimer'); if (n) n.innerHTML = `<i class="fas fa-play mr-1"></i> Bắt đầu ${b?.phut || 0} phút`;
}
function _kbBatTat() {
    const nut = document.getElementById('kbBtnTimer');
    if (_kbTimer) {
        _kbDungDongHo();
        if (nut) nut.innerHTML = '<i class="fas fa-play mr-1"></i> Chạy tiếp';
        return;
    }
    if (nut) nut.innerHTML = '<i class="fas fa-pause mr-1"></i> Tạm dừng';
    _kbTimer = setInterval(() => {
        _kbConLai--;
        const d = document.getElementById('kbDongHo');
        if (!d) { _kbDungDongHo(); return; }
        d.innerText = _kbMmss(_kbConLai);
        if (_kbConLai <= 10) d.style.color = '#f87171';
        if (_kbConLai <= 0) {
            _kbDungDongHo();
            d.innerText = 'HẾT GIỜ';
            if (typeof showToast === 'function') showToast(`Hết giờ bước ${_kbBuoc + 1}!`, true);
            document.getElementById('soundPositive')?.play().catch(() => {});
            if (nut) nut.innerHTML = '<i class="fas fa-redo mr-1"></i> Chạy lại';
        }
    }, 1000);
}

// ============================================================
// TẢI KỊCH BẢN RA ẢNH ĐEN TRẮNG, KHỔ NGANG
// In phát cho từng nhóm để học sinh vừa làm vừa dò theo các bước.
// ============================================================
const KB_ANH_W = 2339, KB_ANH_H = 1654;   // A4 nằm ngang, 200 DPI

function _kbNgatDong(doRong, chu, maxW) {
    const tu = String(chu).split(/\s+/).filter(Boolean);
    const dong = []; let cur = '';
    for (const t of tu) {
        const thu = cur ? cur + ' ' + t : t;
        if (doRong(thu) <= maxW || !cur) cur = thu;
        else { dong.push(cur); cur = t; }
    }
    if (cur) dong.push(cur);
    return dong;
}

// Tính bố cục danh sách bước cho một cỡ chữ (tách riêng để co chữ cho vừa trang)
function _kbTinhBoCuc(doRong, k, ty, caoCho, rong) {
    const coSo   = Math.round(30 * ty);
    const caoDong = Math.round(coSo * 1.4);
    const dem    = Math.round(16 * ty);
    const oSo    = Math.round(62 * ty);          // ô số thứ tự
    const rongChu = rong - oSo - dem * 3;

    const coPhut = Math.round(coSo * 0.62);          // cỡ chữ dòng thời gian
    const hang = k.buoc.map(b => {
        const dong = _kbNgatDong(c => doRong(c, coSo, true), b.chu, rongChu);
        // Thời gian ghi ngay dưới ô số, nên cột trái cũng phải đủ cao cho nó
        const caoTrai = oSo + (b.phut ? coPhut + 10 : 0);
        const caoPhai = dong.length * caoDong;
        const cao = Math.max(caoTrai, caoPhai) + dem * 1.4;
        return { dong, cao, phut: b.phut };
    });
    const tong = hang.reduce((s, h) => s + h.cao + Math.round(10 * ty), 0);
    return { coSo, caoDong, dem, oSo, coPhut, hang, tong, vua: tong <= caoCho };
}

function taiAnhKichBan() {
    const k = _kbDangDung;
    if (!k) { if (typeof showToast === 'function') showToast('Hãy chọn một kịch bản trước đã nhé!', false); return; }

    const cv = document.createElement('canvas');
    cv.width = KB_ANH_W; cv.height = KB_ANH_H;
    const g = cv.getContext('2d');
    const font = (co, dam) => `${dam ? '700' : '400'} ${co}px "Be Vietnam Pro", "Segoe UI", Arial, sans-serif`;
    const doRong = (chu, co, dam) => { g.font = font(co, dam); return g.measureText(chu).width; };

    const le = 70, rong = KB_ANH_W - le * 2;
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, cv.width, cv.height);
    g.fillStyle = '#000000'; g.textBaseline = 'alphabetic'; g.textAlign = 'left';

    // Tiêu đề
    let y = le + 52;
    g.font = font(52, true);
    g.fillText(k.ten.toUpperCase(), le, y);
    y += 40;
    g.font = font(26, false); g.fillStyle = '#333333';
    for (const d of _kbNgatDong(c => doRong(c, 26, false), k.mucTieu, rong)) { g.fillText(d, le, y); y += 34; }
    y += 6;
    g.font = font(24, true); g.fillStyle = '#000000';
    g.fillText(`${k.quyMo}   ·   ${k.buoc.length} bước   ·   khoảng ${_kbTongPhut(k)} phút`, le, y);
    y += 22;
    g.strokeStyle = '#000000'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(le, y); g.lineTo(le + rong, y); g.stroke();
    y += 26;

    // Chừa chỗ cho khung mẹo ở chân trang
    const caoMeo = 150;
    const caoCho = KB_ANH_H - y - caoMeo - 40;

    // Tìm cỡ chữ lớn nhất mà vẫn vừa một trang
    let ty = 0.5, bc = _kbTinhBoCuc(doRong, k, ty, caoCho, rong);
    for (let t = 2.4; t >= 0.5; t = +(t - 0.04).toFixed(2)) {
        const thu = _kbTinhBoCuc(doRong, k, t, caoCho, rong);
        if (thu.vua) { ty = t; bc = thu; break; }
    }
    const { coSo, caoDong, dem, oSo, coPhut, hang } = bc;

    // Các bước
    hang.forEach((h, i) => {
        // Ô số thứ tự: nền đen chữ trắng
        g.fillStyle = '#000000';
        g.fillRect(le, y, oSo, oSo);
        g.fillStyle = '#ffffff'; g.textAlign = 'center';
        g.font = font(Math.round(oSo * 0.55), true);
        g.fillText(String(i + 1), le + oSo / 2, y + oSo * 0.7);
        g.textAlign = 'left';

        // Thời gian ghi ngay dưới ô số, không thể lẫn sang bước kế tiếp
        if (h.phut) {
            g.fillStyle = '#000000'; g.textAlign = 'center';
            g.font = font(coPhut, true);
            g.fillText(`${h.phut} phút`, le + oSo / 2, y + oSo + coPhut);
            g.textAlign = 'left';
        }

        // Nội dung bước
        g.fillStyle = '#000000'; g.font = font(coSo, true);
        h.dong.forEach((d, j) => g.fillText(d, le + oSo + dem * 2, y + caoDong * (j + 0.8)));
        g.strokeStyle = '#000000'; g.lineWidth = 2;
        g.strokeRect(le + rong - 44, y + 6, 36, 36);     // ô vuông để nhóm tick khi làm xong

        y += h.cao + Math.round(10 * ty);
    });

    // Mẹo ở chân trang
    y = KB_ANH_H - le - caoMeo + 20;
    g.strokeStyle = '#000000'; g.lineWidth = 3;
    g.strokeRect(le, y, rong, caoMeo - 30);
    g.fillStyle = '#000000'; g.font = font(24, true);
    g.fillText('LƯU Ý QUAN TRỌNG', le + 24, y + 38);
    g.font = font(27, false);
    let yy = y + 76;
    for (const d of _kbNgatDong(c => doRong(c, 27, false), k.meo, rong - 48)) { g.fillText(d, le + 24, yy); yy += 36; }

    const bo = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
                     .replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '');
    const dt = new Date();
    const ten = `KichBan_${bo(k.ten)}_${dt.getDate()}-${dt.getMonth() + 1}-${dt.getFullYear()}.png`;

    cv.toBlob(blob => {
        if (!blob) { if (typeof showToast === 'function') showToast('Chưa tạo được ảnh, thử lại nhé!', false); return; }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = ten;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        if (typeof showToast === 'function') showToast('Đã tải ảnh kịch bản về máy — in ra phát cho các nhóm', true);
    }, 'image/png');
}
