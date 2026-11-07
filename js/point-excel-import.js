// ============================================================
// CẬP NHẬT ĐIỂM CỘNG / ĐIỂM TRỪ TỪ FILE EXCEL ĐÃ XUẤT
// Đọc trang "Hien_tai" của file "Xuất Excel" (STT | Họ và tên | Điểm cộng (+) |
// Điểm trừ (-) | ...). Ghép theo TÊN học sinh (file xếp theo hạng nên STT không
// phải STT của lớp). Chỉ ghi phần chênh lệch qua sổ giao dịch điểm: điểm thiết
// bị khác cộng cùng lúc vẫn được giữ.
// ============================================================

function _pxNorm(v) { return String(v ?? '').normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim(); }
function _pxLoose(v) { return _pxNorm(v).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd'); }
function _pxNum(v) {
    if (typeof v === 'number') return v;
    const s = String(v ?? '').trim().replace(',', '.');
    return s === '' ? 0 : (/^-?\d+(\.\d+)?$/.test(s) ? Number(s) : NaN);
}

const _PX_HEAD = {
    name: /^(họ (và )?tên|họ (và )?tên (học sinh|hs)|tên học sinh)$/,
    pos:  /^điểm cộng/,
    neg:  /^điểm trừ/
};

// rows: mảng 2 chiều. Trả về {className, rows:[{rowNo,name,positive,negative}], warnings} hoặc null.
function parsePointSheetRows(rows) {
    let h = null;
    for (let r = 0; r < Math.min(rows.length, 30) && !h; r++) {
        const cells = (rows[r] || []).map(_pxNorm);
        const col = k => cells.findIndex(c => _PX_HEAD[k].test(c));
        if (col('name') >= 0 && col('pos') >= 0 && col('neg') >= 0) h = { row: r, name: col('name'), pos: col('pos'), neg: col('neg') };
    }
    if (!h) return null;
    let className = '';
    for (let r = 0; r < h.row && !className; r++) for (const c of rows[r] || []) {
        const m = String(c ?? '').match(/LỚP\s+(.+?)\s+-\s+/i);
        if (m) { className = m[1].trim(); break; }
    }
    const out = [], warnings = [];
    for (let r = h.row + 1; r < rows.length; r++) {
        const row = rows[r] || [];
        const name = String(row[h.name] ?? '').normalize('NFC').replace(/\s+/g, ' ').trim();
        if (!name) continue;
        const positive = _pxNum(row[h.pos]), negative = _pxNum(row[h.neg]);
        if (!Number.isFinite(positive) || !Number.isFinite(negative) || positive < 0 || negative < 0) {
            warnings.push(`Dòng ${r + 1}: "${name}" có điểm không hợp lệ, bỏ qua.`);
            continue;
        }
        out.push({ rowNo: r + 1, name, positive, negative });
    }
    return { className, rows: out, warnings };
}

// Ưu tiên trang "Hien_tai" (các trang khác là kỳ đã lưu).
function parsePointWorkbook(wb) {
    const names = [...wb.SheetNames].sort((a, b) => (b === 'Hien_tai') - (a === 'Hien_tai'));
    for (const n of names) {
        const parsed = parsePointSheetRows(XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: '' }));
        if (parsed && parsed.rows.length) return { ...parsed, sheetName: n };
    }
    return null;
}

// Ghép từng dòng file với học sinh trong lớp: trùng tên chính xác; nếu không có
// thì trùng tên bỏ dấu và chỉ có đúng một em (đánh dấu "gần đúng" để thầy kiểm tra).
function planPointImport(classStudents, parsed) {
    const items = [], unmatched = [], ambiguous = [], used = new Set(), warnings = [...parsed.warnings];
    const fileNames = new Map();
    for (const row of parsed.rows) {
        const key = _pxNorm(row.name);
        if (fileNames.has(key)) { warnings.push(`Dòng ${row.rowNo}: "${row.name}" xuất hiện 2 lần trong file, bỏ qua dòng này.`); continue; }
        fileNames.set(key, row.rowNo);
        let cands = classStudents.filter(s => _pxNorm(s.name) === key), match = 'exact';
        if (!cands.length) { cands = classStudents.filter(s => _pxLoose(s.name) === _pxLoose(row.name)); match = 'loose'; }
        if (!cands.length) { unmatched.push(row); continue; }
        if (cands.length > 1) { ambiguous.push(row); continue; }
        const s = cands[0];
        if (used.has(s.id)) { ambiguous.push(row); continue; }
        used.add(s.id);
        const oldPos = Number(s.positivePoints) || 0, oldNeg = Number(s.negativePoints) || 0;
        items.push({ studentId: s.id, name: s.name, fileName: row.name, match,
            oldPos, oldNeg, newPos: row.positive, newNeg: row.negative,
            dPos: row.positive - oldPos, dNeg: row.negative - oldNeg });
    }
    const missing = classStudents.filter(s => !used.has(s.id));
    return { items, changed: items.filter(i => i.dPos || i.dNeg), unmatched, ambiguous, missing, warnings };
}

// Ghi điểm mới vào học sinh và lịch sử; saveData() sẽ biến chênh lệch thành một giao dịch.
function applyPointImportPlan(plan, sourceLabel) {
    const now = new Date().toISOString();
    let count = 0;
    for (const it of plan.changed) {
        const s = students.find(x => String(x.id) === String(it.studentId)); if (!s) continue;
        // Tính lại theo điểm hiện tại để không mất điểm vừa cộng trong lúc xem trước.
        const dPos = it.newPos - (Number(s.positivePoints) || 0), dNeg = it.newNeg - (Number(s.negativePoints) || 0);
        if (!dPos && !dNeg) continue;
        s.positivePoints = it.newPos; s.negativePoints = it.newNeg;
        s.points = (Number(s.points) || 0) + dPos - dNeg;
        history.push({ id: 'xl-' + crypto.randomUUID(), type: 'adjust', classId: s.classId, studentId: s.id, studentName: s.name,
            skillName: `${sourceLabel}: cộng ${it.oldPos}→${it.newPos}, trừ ${it.oldNeg}→${it.newNeg}`,
            points: dPos - dNeg, timestamp: now });
        count++;
    }
    return count;
}

// ---------------- Giao diện ----------------
let _pxParsed = null, _pxFileName = '';

function openPointExcelImport() {
    if (!currentClassId) { alert('Chọn lớp trước!'); return; }
    let input = document.getElementById('pointExcelInput');
    if (!input) {
        input = document.createElement('input');
        input.type = 'file'; input.id = 'pointExcelInput'; input.accept = '.xlsx,.xls,.csv'; input.className = 'hidden';
        input.onchange = handlePointExcelFile;
        document.body.appendChild(input);
    }
    input.value = ''; input.click();
}

function handlePointExcelFile(e) {
    const f = e.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = async ev => {
        try {
            const wb = XLSX.read(new Uint8Array(ev.target.result), { type: 'array' });
            const parsed = parsePointWorkbook(wb);
            if (!parsed) { alert('Không nhận ra file điểm.\n\nCần dòng tiêu đề có các cột "Họ và tên", "Điểm cộng (+)", "Điểm trừ (-)" như file do nút Xuất Excel tạo ra.'); return; }
            _pxParsed = parsed; _pxFileName = f.name;
            // Lấy điểm mới nhất của máy chủ trước khi so sánh.
            let stale = '';
            if (syncSettings?.url && typeof flushPointTransactions === 'function') {
                showToast('Đang lấy điểm mới nhất từ máy chủ...');
                try { await flushPointTransactions(); }
                catch (err) { stale = 'Chưa lấy được điểm mới nhất từ máy chủ (' + err.message + '). Đang so với điểm trên máy này; phần chênh lệch vẫn được gửi lên khi có mạng.'; }
            }
            _renderPointImportModal(stale);
        } catch (err) { console.error(err); alert('Không đọc được file Excel: ' + err.message); }
    };
    reader.readAsArrayBuffer(f);
}

function _pxEsc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

function _renderPointImportModal(stale) {
    closePointImport();
    const cls = classes.find(c => c.id === currentClassId);
    const plan = planPointImport(students.filter(s => s.classId === currentClassId), _pxParsed);
    const wrongClass = _pxParsed.className && cls && _pxNorm(_pxParsed.className) !== _pxNorm(cls.name);
    const arrow = (a, b, color) => a === b ? `<span class="text-gray-400">${a}</span>` : `<span class="text-gray-400">${a}</span> → <b class="${color}">${b}</b>`;
    const rows = plan.changed.map(i => `<tr class="border-b border-gray-50">
        <td class="py-1 pr-2 font-semibold text-gray-800">${_pxEsc(i.name)}${i.match === 'loose' ? `<div class="text-[10px] text-amber-600 font-normal">khớp gần đúng với "${_pxEsc(i.fileName)}"</div>` : ''}</td>
        <td class="py-1 pr-2 text-center whitespace-nowrap">${arrow(i.oldPos, i.newPos, 'text-green-600')}</td>
        <td class="py-1 text-center whitespace-nowrap">${arrow(i.oldNeg, i.newNeg, 'text-red-600')}</td></tr>`).join('');
    const notes = [];
    if (stale) notes.push(stale);
    if (wrongClass) notes.push(`File là của lớp "${_pxParsed.className}", nhưng lớp đang chọn là "${cls.name}".`);
    if (plan.unmatched.length) notes.push(`Không tìm thấy trong lớp (${plan.unmatched.length}): ${plan.unmatched.map(r => r.name).join(', ')}.`);
    if (plan.ambiguous.length) notes.push(`Trùng tên, không biết em nào nên bỏ qua (${plan.ambiguous.length}): ${plan.ambiguous.map(r => r.name).join(', ')}.`);
    if (plan.missing.length) notes.push(`${plan.missing.length} học sinh của lớp không có trong file: giữ nguyên điểm.`);
    notes.push(...plan.warnings);
    const unchanged = plan.items.length - plan.changed.length;
    const html = `
<div id="pointImportBackdrop" class="fixed inset-0 bg-black bg-opacity-50 z-[60]" onclick="closePointImport()"></div>
<div id="pointImportModal" class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-lg bg-white rounded-2xl z-[61] shadow-2xl flex flex-col" style="max-height:90vh">
  <div class="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
    <h3 class="font-bold text-lg text-gray-800"><i class="fas fa-file-import text-green-600 mr-2"></i>Cập nhật điểm từ Excel</h3>
    <button onclick="closePointImport()" class="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"><i class="fas fa-times text-sm"></i></button>
  </div>
  <div class="px-5 py-3 flex flex-col gap-3 overflow-y-auto">
    <p class="text-sm text-gray-600">Lớp <b>${_pxEsc(cls?.name)}</b> · ${_pxEsc(_pxFileName)} (trang ${_pxEsc(_pxParsed.sheetName)})<br>
      Điểm cộng và điểm trừ của từng em được đặt bằng số trong file, ghép theo <b>họ tên</b>. Tổng điểm thay đổi đúng bằng phần chênh lệch.</p>
    <div class="flex gap-2 text-center text-xs font-bold">
      <div class="flex-1 bg-green-50 text-green-700 rounded-xl py-2"><div class="text-xl">${plan.changed.length}</div>sẽ cập nhật</div>
      <div class="flex-1 bg-gray-50 text-gray-500 rounded-xl py-2"><div class="text-xl">${unchanged}</div>không đổi</div>
      <div class="flex-1 ${plan.unmatched.length + plan.ambiguous.length ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-500'} rounded-xl py-2"><div class="text-xl">${plan.unmatched.length + plan.ambiguous.length}</div>bỏ qua</div>
    </div>
    ${notes.length ? `<div class="${wrongClass ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-800'} border text-xs rounded-xl p-2.5">${notes.map(_pxEsc).join('<br>')}</div>` : ''}
    ${plan.changed.length ? `<div class="border border-gray-100 rounded-xl overflow-y-auto" style="max-height:40vh">
      <table class="w-full text-sm"><thead class="bg-gray-50 text-xs text-gray-500 sticky top-0"><tr>
        <th class="py-1.5 text-left pl-1">Họ và tên</th><th class="py-1.5">Điểm cộng</th><th class="py-1.5">Điểm trừ</th></tr></thead>
      <tbody>${rows}</tbody></table></div>` : '<p class="text-sm text-gray-500 text-center py-4">Điểm trong file đã khớp với điểm hiện tại. Không có gì cần cập nhật.</p>'}
  </div>
  <div class="flex gap-3 px-5 pb-5 pt-3 border-t border-gray-100">
    <button onclick="closePointImport()" class="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl">Hủy</button>
    ${plan.changed.length ? `<button onclick="confirmPointImport(${wrongClass ? 'true' : 'false'})" class="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700">Cập nhật ${plan.changed.length} học sinh</button>` : ''}
  </div>
</div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}

function closePointImport() {
    document.getElementById('pointImportBackdrop')?.remove();
    document.getElementById('pointImportModal')?.remove();
}

function confirmPointImport(wrongClass) {
    if (!_pxParsed) return;
    const cls = classes.find(c => c.id === currentClassId);
    if (wrongClass && !confirm(`File là của lớp "${_pxParsed.className}". Vẫn cập nhật điểm cho lớp "${cls?.name}"?`)) return;
    // Lập lại kế hoạch ngay lúc bấm để dùng điểm mới nhất.
    const plan = planPointImport(students.filter(s => s.classId === currentClassId), _pxParsed);
    const count = applyPointImportPlan(plan, 'Cập nhật từ Excel');
    try { saveData(); } catch (e) { return; } // saveData đã báo lỗi
    closePointImport(); _pxParsed = null;
    if (typeof refreshPointViews === 'function') refreshPointViews();
    showToast(`Đã cập nhật điểm ${count} học sinh lớp ${cls?.name || ''}${syncSettings?.url ? ', đang đồng bộ...' : ''}.`, true, 4000);
}

// ---------------- File mẫu + menu "Điểm Excel" ----------------
// Mẫu dùng đúng tiêu đề cột của file Xuất Excel nên cả hai loại file đều nhập lại được.
// Xếp theo STT của lớp; chỉ cột Điểm cộng / Điểm trừ được dùng khi cập nhật.
function buildPointTemplateRows(cls, classStudents) {
    const sorted = [...classStudents].sort((a, b) => (parseInt(a.stt) || 0) - (parseInt(b.stt) || 0) || String(a.name).localeCompare(b.name));
    return [
        [`BẢNG TỔNG KẾT ĐIỂM THI ĐUA - LỚP ${String(cls.name).toUpperCase()} - MẪU CẬP NHẬT ĐIỂM`],
        [`Ngày tải mẫu: ${new Date().toLocaleDateString('vi-VN')}`],
        ['Chỉ sửa 2 cột tô vàng: Điểm cộng (+) và Điểm trừ (-). Không đổi họ tên. Lưu file rồi bấm "Điểm Excel" → "Tải lên file đã sửa".'],
        [],
        ['STT', 'Họ và tên', 'Điểm cộng (+)', 'Điểm trừ (-)', 'Tổng điểm hiện tại (không sửa)', 'Ngày sinh'],
        ...sorted.map(s => [parseInt(s.stt) || '', s.name, Number(s.positivePoints) || 0, Number(s.negativePoints) || 0, Number(s.points) || 0, s.dob || ''])
    ];
}

function downloadPointTemplate() {
    const cls = classes.find(c => c.id === currentClassId);
    if (!cls) { alert('Chọn lớp trước!'); return; }
    const cs = students.filter(s => s.classId === currentClassId);
    if (!cs.length) { showToast('Lớp chưa có học sinh!', false); return; }
    const rows = buildPointTemplateRows(cls, cs);
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const border = { top: { style: 'thin', color: { rgb: 'CCCCCC' } }, bottom: { style: 'thin', color: { rgb: 'CCCCCC' } }, left: { style: 'thin', color: { rgb: 'CCCCCC' } }, right: { style: 'thin', color: { rgb: 'CCCCCC' } } };
    ws['A1'].s = { font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 14, name: 'Arial' }, fill: { fgColor: { rgb: '33A3DC' } }, alignment: { horizontal: 'center' } };
    ws['A2'].s = { font: { italic: true, color: { rgb: '555555' }, name: 'Arial' }, alignment: { horizontal: 'center' } };
    ws['A3'].s = { font: { bold: true, color: { rgb: 'E65100' }, name: 'Arial' }, fill: { fgColor: { rgb: 'FFF3E0' } }, alignment: { horizontal: 'center', wrapText: true } };
    'ABCDEF'.split('').forEach(c => { ws[c + '5'].s = { font: { bold: true, color: { rgb: 'FFFFFF' }, name: 'Arial' }, fill: { fgColor: { rgb: c === 'C' || c === 'D' ? 'F9A825' : '8BC34A' } }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, border }; });
    for (let r = 6; r <= rows.length; r++) 'ABCDEF'.split('').forEach(c => {
        const cell = ws[c + r]; if (!cell) return;
        const edit = c === 'C' || c === 'D';
        cell.s = { font: { name: 'Arial', sz: 11, bold: edit, color: edit ? { rgb: c === 'C' ? '2E7D32' : 'C62828' } : (c === 'E' ? { rgb: '888888' } : undefined) },
            fill: edit ? { fgColor: { rgb: 'FFF9C4' } } : undefined, alignment: { horizontal: c === 'B' ? 'left' : 'center', vertical: 'center' }, border };
    });
    ws['!cols'] = [{ wch: 6 }, { wch: 28 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 13 }];
    ws['!rows'] = [{ hpt: 24 }, {}, { hpt: 32 }, {}, { hpt: 34 }];
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }, { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Hien_tai');
    XLSX.writeFile(wb, `Mau_Cap_Nhat_Diem_${cls.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('Đã tải file mẫu. Sửa điểm cộng/trừ rồi tải lên lại.');
}

function openPointExcelMenu() {
    const cls = classes.find(c => c.id === currentClassId);
    if (!cls) { alert('Chọn lớp trước!'); return; }
    closePointExcelMenu();
    document.body.insertAdjacentHTML('beforeend', `
<div id="pointMenuBackdrop" class="fixed inset-0 bg-black bg-opacity-50 z-[60]" onclick="closePointExcelMenu()"></div>
<div id="pointMenuModal" class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-sm bg-white rounded-2xl z-[61] shadow-2xl p-5">
  <div class="flex items-center justify-between mb-1">
    <h3 class="font-bold text-lg text-gray-800"><i class="fas fa-file-excel text-green-600 mr-2"></i>Điểm Excel · ${_pxEsc(cls.name)}</h3>
    <button onclick="closePointExcelMenu()" class="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"><i class="fas fa-times text-sm"></i></button>
  </div>
  <p class="text-xs text-gray-500 mb-4">Cập nhật điểm cộng / điểm trừ cho cả lớp bằng Excel. Học sinh được ghép theo họ tên.</p>
  <button onclick="closePointExcelMenu();downloadPointTemplate()" class="w-full flex items-center gap-3 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-100 text-left mb-2">
    <span class="w-8 h-8 rounded-full bg-blue-600 text-white font-black flex items-center justify-center flex-shrink-0">1</span>
    <span><b class="text-blue-800 text-sm">Tải file mẫu</b><br><span class="text-[11px] text-blue-600">Điểm hiện tại của lớp, xếp theo STT. Sửa 2 cột tô vàng.</span></span>
    <i class="fas fa-download text-blue-500 ml-auto"></i>
  </button>
  <button onclick="closePointExcelMenu();openPointExcelImport()" class="w-full flex items-center gap-3 p-3 rounded-xl bg-green-50 hover:bg-green-100 border border-green-100 text-left">
    <span class="w-8 h-8 rounded-full bg-green-600 text-white font-black flex items-center justify-center flex-shrink-0">2</span>
    <span><b class="text-green-800 text-sm">Tải lên file đã sửa</b><br><span class="text-[11px] text-green-600">Xem trước điểm cũ → mới rồi mới cập nhật. Nhận cả file "Xuất Excel".</span></span>
    <i class="fas fa-upload text-green-500 ml-auto"></i>
  </button>
</div>`);
}
function closePointExcelMenu() {
    document.getElementById('pointMenuBackdrop')?.remove();
    document.getElementById('pointMenuModal')?.remove();
}
