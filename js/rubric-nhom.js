// ============================================================
// RUBRIC CHẤM ĐIỂM THEO NHÓM
// ------------------------------------------------------------
// Dùng sau khi đã chia nhóm và phân công nhiệm vụ: giáo viên chọn một
// loại rubric, CHIẾU CHỮ TO cho cả lớp đọc và hiểu mình sẽ bị chấm theo
// tiêu chí nào, rồi chấm từng nhóm theo 4 mức. Mức trung bình của nhóm
// quy thành 1-4 điểm cộng cho mọi thành viên.
//
// Cả giao diện lẫn dữ liệu đều nằm trong file này và tự chèn vào trang
// lúc chạy, nên sửa index.html không thể xoá nhầm tính năng này.
// ============================================================

const RUBRIC_MUC = [
    { muc: 1, ten: 'Cần cố gắng', mau: '#ef4444' },
    { muc: 2, ten: 'Đạt',          mau: '#f59e0b' },
    { muc: 3, ten: 'Khá',          mau: '#3b82f6' },
    { muc: 4, ten: 'Tốt',          mau: '#10b981' }
];

const RUBRIC_LIB = [
    {
        id: 'gqvd',
        emoji: '🧩',
        ten: 'Giải quyết vấn đề Toán học',
        nhom: 'Toán',
        mota: 'Bám năng lực Toán học của Chương trình 2018. Hợp khi nhóm cùng giải một bài toán khó.',
        tieuChi: [
            { ten: 'Hiểu đề và tóm tắt', muc: [
                'Chưa nêu được đề cho gì, hỏi gì',
                'Nêu được dữ kiện nhưng còn thiếu',
                'Tóm tắt đủ dữ kiện và yêu cầu',
                'Tóm tắt gọn, chỉ ra được mấu chốt của bài' ] },
            { ten: 'Hướng giải và lập luận', muc: [
                'Chưa tìm được hướng giải',
                'Có hướng giải nhưng lập luận rời rạc',
                'Lập luận liền mạch, có căn cứ',
                'Lập luận chặt chẽ, nêu được vì sao chọn hướng đó' ] },
            { ten: 'Tính toán và trình bày', muc: [
                'Sai nhiều phép tính, trình bày lộn xộn',
                'Còn vài sai sót nhỏ',
                'Tính đúng, trình bày rõ ràng',
                'Tính đúng, trình bày đẹp, kí hiệu chuẩn' ] },
            { ten: 'Kiểm tra lại kết quả', muc: [
                'Không kiểm tra lại',
                'Có kiểm tra nhưng qua loa',
                'Thử lại kết quả, đối chiếu điều kiện',
                'Thử lại và bàn thêm cách giải khác' ] }
        ]
    },
    {
        id: 'mohinhhoa',
        emoji: '🌍',
        ten: 'Mô hình hoá Toán thực tế',
        nhom: 'Toán',
        mota: 'Dành cho bài toán gắn tình huống thực tế: lãi suất, tối ưu, đo đạc, thống kê.',
        tieuChi: [
            { ten: 'Chuyển thực tế thành bài toán', muc: [
                'Chưa tách được dữ kiện toán học',
                'Chọn được vài dữ kiện, còn thiếu',
                'Đặt ẩn và điều kiện hợp lí',
                'Mô hình gọn, nêu rõ giả thiết đã lược bỏ' ] },
            { ten: 'Chọn công cụ toán học', muc: [
                'Chọn sai công cụ',
                'Chọn được nhưng dùng chưa đúng',
                'Dùng đúng công thức, đúng dạng',
                'Chọn cách ngắn gọn nhất, giải thích được lí do' ] },
            { ten: 'Giải và đọc kết quả', muc: [
                'Ra số nhưng không hiểu nghĩa',
                'Giải được, giải thích còn mơ hồ',
                'Giải đúng và nêu đúng ý nghĩa thực tế',
                'Nêu ý nghĩa kèm đơn vị, làm tròn hợp lí' ] },
            { ten: 'Đánh giá tính hợp lí', muc: [
                'Không xét kết quả có hợp lí không',
                'Có nhận xét nhưng chung chung',
                'Đối chiếu kết quả với thực tế',
                'Chỉ ra hạn chế của mô hình, đề xuất cải tiến' ] }
        ]
    },
    {
        id: 'poster',
        emoji: '🎨',
        ten: 'Sản phẩm dự án · Poster Toán',
        nhom: 'Toán',
        mota: 'Chấm sản phẩm nhóm làm theo dự án: poster, sơ đồ tư duy, mô hình, video.',
        tieuChi: [
            { ten: 'Nội dung Toán học', muc: [
                'Nhiều chỗ sai kiến thức',
                'Đúng nhưng còn sơ sài',
                'Đúng, đủ ý chính của chủ đề',
                'Đúng, đủ và có mở rộng thú vị' ] },
            { ten: 'Sáng tạo', muc: [
                'Sao chép nguyên mẫu có sẵn',
                'Có thay đổi nhỏ',
                'Có ý tưởng riêng rõ rệt',
                'Ý tưởng mới lạ, gây ấn tượng' ] },
            { ten: 'Bố cục và thẩm mỹ', muc: [
                'Khó đọc, lộn xộn',
                'Đọc được nhưng chưa cân đối',
                'Bố cục rõ, màu sắc hài hoà',
                'Trình bày đẹp, chuyên nghiệp' ] },
            { ten: 'Đóng góp của cả nhóm', muc: [
                'Chỉ 1-2 bạn làm',
                'Một nửa nhóm tham gia',
                'Hầu hết thành viên có phần việc',
                'Mọi thành viên đều có dấu ấn rõ' ] }
        ]
    },
    {
        id: 'thuyettrinh',
        emoji: '🎤',
        ten: 'Thuyết trình · Báo cáo nhóm',
        nhom: 'Tích cực',
        mota: 'Khi các nhóm lên bảng báo cáo kết quả thảo luận.',
        tieuChi: [
            { ten: 'Nội dung báo cáo', muc: [
                'Lạc đề hoặc quá sơ sài',
                'Đúng trọng tâm nhưng thiếu ý',
                'Đủ ý, đúng trọng tâm',
                'Đủ ý, có dẫn chứng và ví dụ riêng' ] },
            { ten: 'Cách nói và tác phong', muc: [
                'Đọc nguyên văn, nói nhỏ',
                'Còn phụ thuộc giấy',
                'Nói tự tin, nhìn xuống lớp',
                'Cuốn hút, biết nhấn ý, có tương tác' ] },
            { ten: 'Phương tiện minh hoạ', muc: [
                'Không có minh hoạ',
                'Có nhưng ít liên quan',
                'Hình, bảng, sơ đồ hỗ trợ tốt',
                'Minh hoạ sáng tạo, làm rõ hẳn ý' ] },
            { ten: 'Trả lời phản biện', muc: [
                'Không trả lời được',
                'Trả lời được câu dễ',
                'Trả lời đúng phần lớn câu hỏi',
                'Trả lời thuyết phục, bảo vệ được quan điểm' ] }
        ]
    },
    {
        id: 'hoptac',
        emoji: '🤝',
        ten: 'Hợp tác trong nhóm',
        nhom: 'Tích cực',
        mota: 'Chấm quá trình làm việc nhóm, không chấm sản phẩm. Hợp cho tiết thảo luận.',
        tieuChi: [
            { ten: 'Nhận và chia việc', muc: [
                'Không ai nhận việc rõ ràng',
                'Chia việc nhưng chưa đều',
                'Mỗi bạn có nhiệm vụ cụ thể',
                'Chia việc hợp năng lực từng bạn' ] },
            { ten: 'Đóng góp ý kiến', muc: [
                'Ngồi im, chờ bạn làm',
                'Thỉnh thoảng góp ý',
                'Chủ động nêu ý kiến',
                'Nêu ý kiến hay, gợi mở cho bạn' ] },
            { ten: 'Lắng nghe và tôn trọng', muc: [
                'Cắt lời, tranh cãi gay gắt',
                'Có nghe nhưng chưa phản hồi',
                'Nghe và phản hồi lịch sự',
                'Biết tổng hợp ý kiến trái chiều' ] },
            { ten: 'Giữ đúng thời gian', muc: [
                'Không xong nhiệm vụ',
                'Xong nhưng trễ nhiều',
                'Xong đúng hạn',
                'Xong sớm, còn hỗ trợ nhóm bạn' ] }
        ]
    },
    {
        id: 'phanbien',
        emoji: '💬',
        ten: 'Tư duy phản biện · Tranh biện',
        nhom: 'Tích cực',
        mota: 'Dùng khi tổ chức tranh biện, phản biện chéo giữa các nhóm.',
        tieuChi: [
            { ten: 'Đặt câu hỏi', muc: [
                'Không đặt được câu hỏi',
                'Hỏi lại điều đã rõ',
                'Hỏi đúng chỗ chưa chắc chắn',
                'Hỏi sắc, chạm đúng điểm yếu lập luận' ] },
            { ten: 'Lập luận có căn cứ', muc: [
                'Nói theo cảm tính',
                'Có lí lẽ nhưng thiếu dẫn chứng',
                'Lí lẽ kèm dẫn chứng cụ thể',
                'Lí lẽ chặt, dẫn chứng thuyết phục' ] },
            { ten: 'Phản biện nhóm bạn', muc: [
                'Công kích cá nhân',
                'Phản biện chung chung',
                'Phản biện đúng nội dung',
                'Phản biện đúng và đề xuất phương án tốt hơn' ] },
            { ten: 'Tiếp thu cái đúng', muc: [
                'Bảo thủ đến cùng',
                'Miễn cưỡng thừa nhận',
                'Nhận ra và sửa lại quan điểm',
                'Chủ động công nhận và phát triển ý của bạn' ] }
        ]
    }
];

// ── Trạng thái ───────────────────────────────────────────────────────────────
let _rubricDangDung = null;          // rubric đang áp dụng
let _rubricDiem     = {};            // { groupIndex: { criterionIndex: 1..4 } }
let _rubricNhomXem  = 0;             // nhóm đang chấm

// ── Dựng sẵn khung giao diện (chỉ làm một lần) ───────────────────────────────
function _rubricDungKhung() {
    if (document.getElementById('rubricRoot')) return;
    const root = document.createElement('div');
    root.id = 'rubricRoot';
    root.innerHTML = `
      <div id="rubricMenu" class="fixed inset-0 z-[120] hidden items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
        <div class="bg-white rounded-3xl w-full max-w-3xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
          <div class="px-6 py-4 border-b flex items-center justify-between flex-shrink-0">
            <div>
              <h2 class="text-2xl font-black text-gray-800"><i class="fas fa-clipboard-check text-teal-600 mr-2"></i>Rubric chấm nhóm</h2>
              <p class="text-gray-500 text-sm mt-0.5">Chọn một loại rubric để chiếu cho cả lớp đọc trước khi làm</p>
            </div>
            <button onclick="closeRubricMenu()" class="text-gray-400 hover:text-gray-700 text-2xl w-10 h-10">&times;</button>
          </div>
          <div id="rubricMenuList" class="flex-1 overflow-y-auto p-5 grid md:grid-cols-2 gap-4"></div>
        </div>
      </div>

      <div id="rubricShow" class="fixed inset-0 z-[121] hidden flex-col" style="background:#0f172a">
        <div class="flex items-center justify-between px-5 py-3 flex-shrink-0" style="background:rgba(0,0,0,.35)">
          <button onclick="closeRubricShow()" class="text-white text-opacity-70 hover:text-opacity-100 font-bold text-sm">
            <i class="fas fa-arrow-left mr-1"></i> Đổi rubric
          </button>
          <h2 id="rubricShowTitle" class="text-white font-black text-lg md:text-2xl text-center truncate px-3"></h2>
          <div class="flex gap-2 flex-shrink-0">
            <button onclick="_rubricCoChu(-1)" class="w-9 h-9 rounded-lg bg-white bg-opacity-15 text-white font-black">A-</button>
            <button onclick="_rubricCoChu(1)" class="w-9 h-9 rounded-lg bg-white bg-opacity-15 text-white font-black">A+</button>
            <button onclick="openRubricScore()" class="bg-teal-500 hover:bg-teal-400 text-white font-black px-4 py-2 rounded-xl whitespace-nowrap">
              <i class="fas fa-star mr-1"></i> Bắt đầu chấm
            </button>
          </div>
        </div>
        <div id="rubricShowBody" class="flex-1 overflow-y-auto p-4 md:p-8"></div>
      </div>

      <div id="rubricScore" class="fixed inset-0 z-[122] hidden flex-col" style="background:#0f172a">
        <div class="flex items-center justify-between px-5 py-3 flex-shrink-0" style="background:rgba(0,0,0,.35)">
          <button onclick="closeRubricScore()" class="text-white text-opacity-70 hover:text-opacity-100 font-bold text-sm">
            <i class="fas fa-arrow-left mr-1"></i> Xem lại rubric
          </button>
          <h2 id="rubricScoreTitle" class="text-white font-black text-base md:text-xl truncate px-3"></h2>
          <button onclick="closeRubricAll()" class="text-white text-opacity-70 hover:text-opacity-100 font-bold text-sm">
            Đóng <i class="fas fa-times ml-1"></i>
          </button>
        </div>
        <div class="flex-1 min-h-0 flex flex-col md:flex-row">
          <div id="rubricGroupTabs" class="flex md:flex-col gap-2 p-3 overflow-auto flex-shrink-0 md:w-56" style="background:rgba(0,0,0,.2)"></div>
          <div id="rubricScoreBody" class="flex-1 overflow-y-auto p-4 md:p-6"></div>
        </div>
      </div>`;
    document.body.appendChild(root);
}

// ── Mở menu chọn rubric ──────────────────────────────────────────────────────
function openRubricMenu() {
    if (typeof _groupResult === 'undefined' || !_groupResult.length) {
        showToast('Hãy chia nhóm trước đã nhé!', false);
        return;
    }
    _rubricDungKhung();
    const nhomTen = { 'Toán': 'bg-indigo-100 text-indigo-700', 'Tích cực': 'bg-emerald-100 text-emerald-700' };
    document.getElementById('rubricMenuList').innerHTML = RUBRIC_LIB.map(r => `
        <button onclick="chonRubric('${r.id}')"
            class="text-left border-2 border-gray-200 hover:border-teal-500 rounded-2xl p-4 transition active:scale-[.98] bg-white">
          <div class="flex items-start gap-3">
            <span class="text-3xl flex-shrink-0">${r.emoji}</span>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="font-black text-gray-800 text-lg leading-tight">${r.ten}</h3>
                <span class="text-[11px] font-black px-2 py-0.5 rounded-full ${nhomTen[r.nhom]}">${r.nhom}</span>
              </div>
              <p class="text-gray-500 text-sm mt-1 leading-snug">${r.mota}</p>
              <p class="text-teal-600 text-xs font-bold mt-2">${r.tieuChi.length} tiêu chí · 4 mức · tối đa +4 điểm cộng</p>
            </div>
          </div>
        </button>`).join('');
    const m = document.getElementById('rubricMenu');
    m.classList.remove('hidden'); m.classList.add('flex');
}
function closeRubricMenu() {
    const m = document.getElementById('rubricMenu');
    m.classList.add('hidden'); m.classList.remove('flex');
}

// ── Chiếu rubric chữ to cho cả lớp ───────────────────────────────────────────
let _rubricScale = 1;
function _rubricCoChu(d) {
    _rubricScale = Math.min(1.6, Math.max(0.7, +(_rubricScale + d * 0.1).toFixed(2)));
    const b = document.getElementById('rubricShowBody');
    if (b) b.style.fontSize = (_rubricScale * 100) + '%';
}

function chonRubric(id) {
    const r = RUBRIC_LIB.find(x => x.id === id);
    if (!r) return;
    _rubricDangDung = r;
    _rubricDiem = {};
    _rubricNhomXem = 0;
    closeRubricMenu();
    _rubricVeBangChieu();
    const s = document.getElementById('rubricShow');
    s.classList.remove('hidden'); s.classList.add('flex');
}

function _rubricVeBangChieu() {
    const r = _rubricDangDung;
    document.getElementById('rubricShowTitle').innerText = `${r.emoji} ${r.ten}`;
    const head = RUBRIC_MUC.map(m =>
        `<th class="p-3 text-white font-black rounded-t-xl" style="background:${m.mau}">
           <div class="text-3xl leading-none">${m.muc}</div>
           <div class="text-sm opacity-90 mt-1">${m.ten}</div>
         </th>`).join('');
    const rows = r.tieuChi.map((tc, i) => `
        <tr>
          <td class="p-3 align-middle">
            <div class="text-white font-black text-xl md:text-2xl leading-tight">${i + 1}. ${tc.ten}</div>
          </td>
          ${tc.muc.map((t, j) => `
            <td class="p-3 align-top">
              <div class="rounded-xl p-3 h-full text-white font-semibold text-base md:text-lg leading-snug"
                   style="background:${RUBRIC_MUC[j].mau}22;border:2px solid ${RUBRIC_MUC[j].mau}66">${t}</div>
            </td>`).join('')}
        </tr>`).join('');

    document.getElementById('rubricShowBody').innerHTML = `
      <p class="text-center text-teal-300 font-bold text-lg md:text-2xl mb-4">${r.mota}</p>
      <div class="overflow-x-auto">
        <table class="w-full border-separate" style="border-spacing:8px">
          <thead><tr><th class="p-3 text-white text-opacity-70 font-black text-lg md:text-xl text-left">Tiêu chí</th>${head}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="mt-6 bg-white bg-opacity-10 rounded-2xl p-4 md:p-6 text-center">
        <p class="text-white font-black text-xl md:text-3xl">Mức trung bình của nhóm quy thành điểm cộng</p>
        <div class="flex flex-wrap justify-center gap-3 mt-4">
          ${RUBRIC_MUC.map(m => `
            <div class="rounded-2xl px-5 py-3" style="background:${m.mau}">
              <div class="text-white font-black text-2xl md:text-4xl">+${m.muc}</div>
              <div class="text-white text-opacity-90 font-bold text-sm md:text-base">${m.ten}</div>
            </div>`).join('')}
        </div>
      </div>`;
    document.getElementById('rubricShowBody').style.fontSize = (_rubricScale * 100) + '%';
}

function closeRubricShow() {
    const s = document.getElementById('rubricShow');
    s.classList.add('hidden'); s.classList.remove('flex');
    openRubricMenu();
}

// ── Chấm điểm từng nhóm ──────────────────────────────────────────────────────
function openRubricScore() {
    document.getElementById('rubricShow').classList.add('hidden');
    document.getElementById('rubricShow').classList.remove('flex');
    const s = document.getElementById('rubricScore');
    s.classList.remove('hidden'); s.classList.add('flex');
    document.getElementById('rubricScoreTitle').innerText = `${_rubricDangDung.emoji} ${_rubricDangDung.ten}`;
    _rubricVeManCham();
}

// Tổng kết điểm của một nhóm
function _rubricTongKet(gi) {
    const r = _rubricDangDung;
    const d = _rubricDiem[gi] || {};
    const daCham = r.tieuChi.filter((_, i) => d[i]).length;
    const tong = r.tieuChi.reduce((s, _, i) => s + (d[i] || 0), 0);
    const tb = daCham ? tong / daCham : 0;
    // Mức trung bình (1-4) làm tròn chính là số điểm cộng nhóm nhận được
    const diemCong = daCham ? Math.min(4, Math.max(1, Math.round(tb))) : 0;
    return { daCham, tongTieuChi: r.tieuChi.length, tong, toiDa: r.tieuChi.length * 4, tb, diemCong, dayDu: daCham === r.tieuChi.length };
}

function _rubricVeManCham() {
    const r = _rubricDangDung;

    document.getElementById('rubricGroupTabs').innerHTML = _groupResult.map((mems, gi) => {
        const k = _rubricTongKet(gi);
        const col = GROUP_COLORS[gi % GROUP_COLORS.length];
        const active = gi === _rubricNhomXem;
        return `
          <button onclick="_rubricChonNhom(${gi})"
            class="flex-shrink-0 text-left rounded-xl px-3 py-2 transition ${active ? 'ring-4 ring-white' : 'opacity-70 hover:opacity-100'}"
            style="background:${col.bg};min-width:150px">
            <div class="text-white font-black">Nhóm ${gi + 1}</div>
            <div class="text-white text-opacity-80 text-xs font-bold">${mems.length} HS · ${k.daCham}/${k.tongTieuChi} tiêu chí</div>
            <div class="text-white font-black text-lg">${k.diemCong ? '+' + k.diemCong + ' điểm' : '—'}</div>
          </button>`;
    }).join('');

    const gi = _rubricNhomXem;
    const mems = _groupResult[gi] || [];
    const d = _rubricDiem[gi] || {};
    const k = _rubricTongKet(gi);
    const col = GROUP_COLORS[gi % GROUP_COLORS.length];

    const rows = r.tieuChi.map((tc, i) => `
        <div class="bg-white bg-opacity-5 rounded-2xl p-3 md:p-4 mb-3">
          <div class="text-white font-black text-lg md:text-2xl mb-2">${i + 1}. ${tc.ten}</div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
            ${tc.muc.map((t, j) => {
              const m = RUBRIC_MUC[j], chon = d[i] === m.muc;
              return `<button onclick="_rubricChamMuc(${i},${m.muc})"
                  class="text-left rounded-xl p-2.5 transition active:scale-95 ${chon ? 'ring-4 ring-white' : 'opacity-60 hover:opacity-100'}"
                  style="background:${m.mau}${chon ? '' : '33'};border:2px solid ${m.mau}">
                  <div class="font-black text-white text-base md:text-lg">${m.muc} · ${m.ten}</div>
                  <div class="text-white ${chon ? 'text-opacity-95' : 'text-opacity-80'} text-xs md:text-sm leading-snug mt-0.5">${t}</div>
                </button>`;
            }).join('')}
          </div>
        </div>`).join('');

    document.getElementById('rubricScoreBody').innerHTML = `
      <div class="flex items-center gap-3 mb-4 flex-wrap">
        <div class="rounded-2xl px-4 py-2" style="background:${col.bg}">
          <span class="text-white font-black text-xl md:text-3xl">Nhóm ${gi + 1}</span>
        </div>
        <div class="text-white text-opacity-70 font-bold text-sm">${mems.map(s => s.name).join(' · ')}</div>
      </div>
      ${rows}
      <div class="sticky bottom-0 mt-4 rounded-2xl p-4 md:p-5 flex flex-wrap items-center gap-4 justify-between" style="background:#111827;border:2px solid #334155">
        <div class="flex items-center gap-5 flex-wrap">
          <div>
            <div class="text-gray-400 text-xs font-bold uppercase">Đã chấm</div>
            <div class="text-white font-black text-2xl">${k.daCham}/${k.tongTieuChi}</div>
          </div>
          <div>
            <div class="text-gray-400 text-xs font-bold uppercase">Tổng mức</div>
            <div class="text-white font-black text-2xl">${k.tong}/${k.toiDa}</div>
          </div>
          <div>
            <div class="text-gray-400 text-xs font-bold uppercase">Mức trung bình</div>
            <div class="text-white font-black text-2xl">${k.daCham ? k.tb.toFixed(2) : '—'}</div>
          </div>
          <div>
            <div class="text-gray-400 text-xs font-bold uppercase">Nhóm nhận</div>
            <div class="font-black text-3xl" style="color:${k.diemCong ? RUBRIC_MUC[k.diemCong - 1].mau : '#64748b'}">
              ${k.diemCong ? '+' + k.diemCong + ' điểm cộng' : 'chưa đủ'}
            </div>
          </div>
        </div>
        <div class="flex gap-2">
          <button onclick="_rubricXoaNhom(${gi})" class="bg-slate-700 hover:bg-slate-600 text-gray-200 font-bold px-4 py-3 rounded-xl">Xoá chấm</button>
          <button onclick="chotDiemRubric(${gi})" ${k.dayDu ? '' : 'disabled'}
            class="font-black px-6 py-3 rounded-xl transition ${k.dayDu ? 'bg-emerald-500 hover:bg-emerald-400 text-white' : 'bg-slate-800 text-gray-500 cursor-not-allowed'}">
            <i class="fas fa-check mr-1"></i> Chốt +${k.diemCong || 0} cho ${mems.length} HS
          </button>
        </div>
      </div>`;
}

function _rubricChonNhom(gi) { _rubricNhomXem = gi; _rubricVeManCham(); }
function _rubricChamMuc(i, muc) {
    const gi = _rubricNhomXem;
    if (!_rubricDiem[gi]) _rubricDiem[gi] = {};
    // Bấm lại đúng mức đang chọn thì bỏ chọn
    if (_rubricDiem[gi][i] === muc) delete _rubricDiem[gi][i];
    else _rubricDiem[gi][i] = muc;
    _rubricVeManCham();
}
function _rubricXoaNhom(gi) { delete _rubricDiem[gi]; _rubricVeManCham(); }

// Cộng điểm thật cho mọi thành viên của nhóm
function chotDiemRubric(gi) {
    const k = _rubricTongKet(gi);
    if (!k.dayDu) { showToast('Hãy chấm đủ các tiêu chí đã nhé!', false); return; }
    const mems = _groupResult[gi] || [];
    if (!mems.length) return;

    const tenKyNang = `Rubric ${_rubricDangDung.ten} (mức ${k.tb.toFixed(1)})`;
    const now = new Date().toISOString();
    document.getElementById('soundPositive')?.play().catch(() => {});

    mems.forEach(m => {
        const s = students.find(st => st.id === m.id);
        if (!s) return;
        const cu = s.points;
        s.points += k.diemCong;
        s.positivePoints += k.diemCong;
        history.push({ id: Date.now() + Math.random(), classId: currentClassId, studentId: s.id,
                       studentName: s.name, skillName: tenKyNang, points: k.diemCong, timestamp: now });
        checkMilestone(s, cu);
        setTimeout(() => checkGoalAchievements(s.id), 100);
    });

    saveData();
    if (typeof scheduleAutoSync === 'function') scheduleAutoSync();
    if (currentView === 'classroom') renderStudents(); else renderReport();

    showToast(`Nhóm ${gi + 1}: ${mems.length} học sinh +${k.diemCong} điểm`, true);
    _rubricDaChot = _rubricDaChot || {};
    _rubricDaChot[gi] = k.diemCong;

    // Tự sang nhóm kế tiếp chưa chấm xong cho đỡ phải bấm
    const kt = _groupResult.findIndex((_, i) => !_rubricTongKet(i).dayDu);
    if (kt >= 0) _rubricNhomXem = kt;
    _rubricVeManCham();
}
let _rubricDaChot = {};

function closeRubricScore() {
    document.getElementById('rubricScore').classList.add('hidden');
    document.getElementById('rubricScore').classList.remove('flex');
    const s = document.getElementById('rubricShow');
    s.classList.remove('hidden'); s.classList.add('flex');
}
function closeRubricAll() {
    ['rubricMenu', 'rubricShow', 'rubricScore'].forEach(id => {
        const e = document.getElementById(id);
        if (e) { e.classList.add('hidden'); e.classList.remove('flex'); }
    });
}
