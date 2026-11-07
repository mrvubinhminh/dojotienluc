// ============================================================
// NHẬP LỚP TỪ DANH SÁCH EXCEL
// Tự dò dòng tiêu đề "Họ và tên"/"Họ tên", cột STT, Ngày sinh, Mã định danh.
// Hỗ trợ: danh sách đơn giản (STT | Họ và tên | Ngày sinh), bảng điểm Sở
// (tiêu đề ở dòng 6, có "Lớp: 10A4", "Môn học: Toán - GV: ..."), file tách
// cột "Họ đệm" | "Tên", file không có ngày sinh (VD: STT | HỌ TÊN | SBD).
// ============================================================

function _cliNorm(v) {
    return String(v ?? '').normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim();
}
function _cliClean(v) {
    return String(v ?? '').normalize('NFC').replace(/\s+/g, ' ').trim();
}
const _CLI_HEAD = {
    name:  /^(họ (và )?tên|họ (và )?tên (học sinh|hs)|tên học sinh)$/,
    last:  /^(họ|họ (và )?(tên )?đệm|họ lót)$/,
    first: /^tên$/,
    stt:   /^(stt|số tt|tt|số thứ tự)$/,
    dob:   /^(ngày sinh|ngày tháng năm sinh|ngày, tháng, năm sinh|ns)$/,
    code:  /(mã định danh|mã học sinh|mã hs|mã số học sinh)/
};

function _cliFindHeader(rows) {
    const limit = Math.min(rows.length, 30);
    for (let r = 0; r < limit; r++) {
        const cells = (rows[r] || []).map(_cliNorm);
        const col = key => cells.findIndex(c => _CLI_HEAD[key].test(c));
        let name = col('name'), last = -1, first = -1;
        if (name < 0) {
            last = col('last'); first = col('first');
            if (last < 0 || first < 0) continue;
        }
        return { row: r, name, last, first, stt: col('stt'), dob: col('dob'), code: col('code') };
    }
    return null;
}

function _cliPad(n) { return String(n).padStart(2, '0'); }
function _cliDate(v) {
    if (v === undefined || v === null || v === '') return '';
    if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v)) {
        // SheetJS có thể trả về mốc lệch vài giây quanh nửa đêm; +12h để luôn đúng ngày.
        const d = new Date(v.getTime() + 12 * 3600e3);
        return `${_cliPad(d.getDate())}/${_cliPad(d.getMonth() + 1)}/${d.getFullYear()}`;
    }
    if (typeof v === 'number' && v > 1000 && v < 80000) {
        // Số sê-ri ngày của Excel (mốc 1899-12-30).
        const d = new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 86400e3);
        return `${_cliPad(d.getUTCDate())}/${_cliPad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
    }
    const s = _cliClean(v);
    const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
    return m ? `${_cliPad(m[1])}/${_cliPad(m[2])}/${m[3]}` : s;
}

// rows: mảng 2 chiều (sheet_to_json header:1). Trả về {className, teacherName,
// subjectName, students:[{stt,name,dob,studentCode}], warnings:[]}; null nếu
// không nhận ra dòng tiêu đề.
function parseClassListRows(rows) {
    const h = _cliFindHeader(rows);
    if (!h) return null;
    const info = { className: '', teacherName: '', subjectName: '' };
    for (let r = 0; r < h.row; r++) for (const cell of rows[r] || []) {
        const s = _cliClean(cell);
        let m;
        if (!info.className && (m = s.match(/^lớp\s*[:：]\s*(.+)$/i))) info.className = m[1].trim();
        if ((m = s.match(/^môn( học)?\s*[:：]\s*(.+?)(\s*-\s*GV\s*[:：]\s*(.*))?$/i))) {
            info.subjectName = m[2].trim();
            if (m[4]) info.teacherName = m[4].trim();
        }
    }
    const students = [], warnings = [], seen = new Map();
    for (let r = h.row + 1; r < rows.length; r++) {
        const row = rows[r] || [];
        const name = h.name >= 0 ? _cliClean(row[h.name])
            : _cliClean(`${_cliClean(row[h.last])} ${_cliClean(row[h.first])}`);
        if (!name) continue;
        const sttRaw = h.stt >= 0 ? _cliClean(row[h.stt]) : '';
        // Có cột STT thì chỉ nhận dòng có STT là số: bỏ dòng phụ đề, ký tên cuối bảng.
        if (h.stt >= 0 && !/^\d+$/.test(sttRaw)) continue;
        if (h.stt < 0 && (/\d/.test(name) || name.includes(':'))) continue;
        const student = {
            stt: sttRaw ? parseInt(sttRaw, 10) : students.length + 1,
            name,
            dob: h.dob >= 0 ? _cliDate(row[h.dob]) : '',
            studentCode: h.code >= 0 ? _cliClean(row[h.code]) : ''
        };
        const key = _cliNorm(name) + '|' + student.dob;
        if (seen.has(key)) warnings.push(`Dòng ${r + 1}: "${name}" trùng với dòng ${seen.get(key)}.`);
        else seen.set(key, r + 1);
        students.push(student);
    }
    if (h.dob < 0) warnings.push('File không có cột Ngày sinh, học sinh sẽ để trống ngày sinh.');
    return { ...info, students, warnings };
}

// Chọn trang tính đầu tiên có dòng tiêu đề (bỏ qua trang "HuongDan"...).
function parseClassListWorkbook(wb, fileName) {
    for (const sheetName of wb.SheetNames) {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, raw: true, defval: '' });
        const parsed = parseClassListRows(rows);
        if (parsed && parsed.students.length) {
            if (!parsed.className) parsed.className = String(fileName || '').replace(/\.[^.]+$/, '').trim();
            return parsed;
        }
    }
    return null;
}

// Học sinh đã có trong lớp: trùng mã định danh, hoặc trùng tên và ngày sinh
// (thiếu ngày sinh ở một bên thì so theo tên).
function isSameImportedStudent(existing, s) {
    if (existing.studentCode && s.studentCode) return String(existing.studentCode) === String(s.studentCode);
    if (_cliNorm(existing.name) !== _cliNorm(s.name)) return false;
    return !existing.dob || !s.dob || _cliDate(existing.dob) === s.dob;
}

// ---------------- Giao diện ----------------
let _cliParsed = null;

function openClassListImport() {
    let input = document.getElementById('classListFileInput');
    if (!input) {
        input = document.createElement('input');
        input.type = 'file'; input.id = 'classListFileInput'; input.accept = '.xlsx,.xls,.csv'; input.className = 'hidden';
        input.onchange = handleClassListFile;
        document.body.appendChild(input);
    }
    input.value = '';
    input.click();
}

function handleClassListFile(e) {
    const f = e.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
        try {
            const wb = XLSX.read(new Uint8Array(ev.target.result), { type: 'array', cellDates: true });
            const parsed = parseClassListWorkbook(wb, f.name);
            if (!parsed) {
                alert('Không tìm thấy danh sách học sinh.\n\nFile cần có một dòng tiêu đề chứa cột "Họ và tên" (hoặc "Họ tên"). Có thể kèm cột "STT", "Ngày sinh", "Mã định danh".');
                return;
            }
            _cliParsed = parsed;
            _renderClassListModal();
        } catch (err) {
            console.error(err);
            alert('Không đọc được file Excel: ' + err.message);
        }
    };
    reader.readAsArrayBuffer(f);
}

function _cliEsc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function _renderClassListModal() {
    closeClassListImport();
    const p = _cliParsed;
    const cur = classes.find(c => c.id === currentClassId);
    const hasDob = p.students.some(s => s.dob), hasCode = p.students.some(s => s.studentCode);
    const rowsHtml = p.students.map(s => `<tr class="border-b border-gray-50">
        <td class="py-1 pr-2 text-center text-gray-400">${s.stt}</td>
        <td class="py-1 pr-2 font-semibold text-gray-800">${_cliEsc(s.name)}</td>
        ${hasDob ? `<td class="py-1 pr-2 text-gray-500 whitespace-nowrap">${_cliEsc(s.dob)}</td>` : ''}
        ${hasCode ? `<td class="py-1 text-gray-400 text-xs">${_cliEsc(s.studentCode)}</td>` : ''}</tr>`).join('');
    const html = `
<div id="classListBackdrop" class="fixed inset-0 bg-black bg-opacity-50 z-[60]" onclick="closeClassListImport()"></div>
<div id="classListModal" class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-lg bg-white rounded-2xl z-[61] shadow-2xl flex flex-col" style="max-height:90vh">
  <div class="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
    <h3 class="font-bold text-lg text-gray-800"><i class="fas fa-file-excel text-green-600 mr-2"></i>Nhập lớp từ Excel</h3>
    <button onclick="closeClassListImport()" class="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"><i class="fas fa-times text-sm"></i></button>
  </div>
  <div class="px-5 py-3 flex flex-col gap-3 overflow-y-auto">
    <div class="flex flex-col gap-2 text-sm">
      <label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cliMode" value="new" checked onchange="_cliToggleMode()" class="accent-blue-500"> <b>Tạo lớp mới</b></label>
      ${cur ? `<label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="cliMode" value="append" onchange="_cliToggleMode()" class="accent-blue-500"> Thêm vào lớp đang chọn: <b>${_cliEsc(cur.name)}</b> <span class="text-xs text-gray-400">(bỏ qua học sinh đã có)</span></label>` : ''}
    </div>
    <div id="cliNewFields" class="flex flex-col gap-2">
      <input id="cliClassName" value="${_cliEsc(p.className)}" placeholder="Tên lớp" class="w-full border-2 border-gray-200 p-2.5 rounded-xl focus:outline-none focus:border-dojo-blue font-bold">
      <div class="flex gap-2">
        <input id="cliTeacher" value="${_cliEsc(p.teacherName)}" placeholder="Tên giáo viên" class="flex-1 min-w-0 border-2 border-gray-200 p-2 rounded-xl text-sm focus:outline-none focus:border-dojo-blue">
        <input id="cliSubject" value="${_cliEsc(p.subjectName)}" placeholder="Môn học" class="flex-1 min-w-0 border-2 border-gray-200 p-2 rounded-xl text-sm focus:outline-none focus:border-dojo-blue">
      </div>
      <select id="cliPreset" class="w-full border-2 border-gray-200 p-2 rounded-xl text-sm">
        <option value="homeroom" ${p.subjectName ? '' : 'selected'}>Bộ kỹ năng: Lớp chủ nhiệm</option>
        <option value="subject" ${p.subjectName ? 'selected' : ''}>Bộ kỹ năng: Giáo viên bộ môn</option>
        <option value="custom">Bộ kỹ năng: Tùy chỉnh (mặc định)</option>
      </select>
    </div>
    ${p.warnings.length ? `<div class="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl p-2.5">${p.warnings.slice(0, 6).map(_cliEsc).join('<br>')}${p.warnings.length > 6 ? `<br>… và ${p.warnings.length - 6} cảnh báo khác` : ''}</div>` : ''}
    <p class="text-xs font-bold text-gray-500">Xem trước: ${p.students.length} học sinh</p>
    <div class="border border-gray-100 rounded-xl overflow-y-auto" style="max-height:40vh">
      <table class="w-full text-sm"><thead class="bg-gray-50 text-xs text-gray-500 sticky top-0"><tr>
        <th class="py-1.5">STT</th><th class="py-1.5 text-left">Họ và tên</th>${hasDob ? '<th class="py-1.5 text-left">Ngày sinh</th>' : ''}${hasCode ? '<th class="py-1.5 text-left">Mã định danh</th>' : ''}
      </tr></thead><tbody>${rowsHtml}</tbody></table>
    </div>
  </div>
  <div class="flex gap-3 px-5 pb-5 pt-3 border-t border-gray-100">
    <button onclick="closeClassListImport()" class="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl">Hủy</button>
    <button onclick="confirmClassListImport()" class="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700">Nhập ${p.students.length} học sinh</button>
  </div>
</div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}

function _cliToggleMode() {
    const mode = document.querySelector('input[name="cliMode"]:checked')?.value;
    document.getElementById('cliNewFields').classList.toggle('hidden', mode !== 'new');
}

function closeClassListImport() {
    document.getElementById('classListBackdrop')?.remove();
    document.getElementById('classListModal')?.remove();
}

function confirmClassListImport() {
    const p = _cliParsed; if (!p) return;
    const mode = document.querySelector('input[name="cliMode"]:checked')?.value || 'new';
    let classId, className, skipped = 0;
    if (mode === 'new') {
        className = document.getElementById('cliClassName').value.trim();
        if (!className) { document.getElementById('cliClassName').focus(); showToast('Nhập tên lớp!', false); return; }
        if (classes.some(c => _cliNorm(c.name) === _cliNorm(className)) &&
            !confirm(`Đã có lớp tên "${className}". Vẫn tạo thêm một lớp mới trùng tên?`)) return;
        const preset = document.getElementById('cliPreset').value;
        classId = classes.length ? Math.max(...classes.map(c => c.id)) + 1 : 1;
        classes.push({ id: classId, name: className, skillPreset: preset,
            teacherName: document.getElementById('cliTeacher').value.trim(),
            subjectName: document.getElementById('cliSubject').value.trim() });
        // selectClass() tự nạp bộ kỹ năng có sẵn; "Tùy chỉnh" dùng bộ mặc định như addClass().
        if (preset === 'custom' && typeof DEFAULT_SKILLS !== 'undefined') skills = JSON.parse(JSON.stringify(DEFAULT_SKILLS));
    } else {
        classId = currentClassId;
        className = classes.find(c => c.id === classId)?.name || '';
    }
    const members = students.filter(s => s.classId === classId);
    let nextId = students.length ? Math.max(...students.map(s => Number(s.id) || 0)) + 1 : 1;
    let nextStt = members.reduce((m, s) => Math.max(m, parseInt(s.stt) || 0), 0) + 1;
    let added = 0;
    for (const s of p.students) {
        if (mode === 'append' && members.some(m => isSameImportedStudent(m, s))) { skipped++; continue; }
        const seed = s.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s/g, '');
        const st = mode === 'new' ? s.stt : nextStt++;
        const student = { id: nextId++, classId, stt: st, name: s.name, realName: s.name, dob: s.dob,
            points: 0, positivePoints: 0, negativePoints: 0, avatar: avatarBaseUrl + seed };
        if (s.studentCode) student.studentCode = s.studentCode;
        students.push(student); members.push(student); added++;
    }
    try { saveData(); }
    catch (e) { return; } // saveData đã báo lỗi; dữ liệu vẫn còn trong phiên làm việc
    closeClassListImport();
    _cliParsed = null;
    if (mode === 'new') {
        // selectClass() đóng/mở thanh bên; đảm bảo nó đang mở để lần gọi này đóng lại.
        const sb = document.getElementById('sidebar');
        if (sb && sb.classList.contains('sidebar-closed')) toggleSidebar();
        selectClass(classId);
    } else {
        const sb = document.getElementById('sidebar');
        if (sb && sb.classList.contains('sidebar-open')) toggleSidebar();
        if (currentView === 'classroom') renderStudents(); else if (currentView === 'report') renderReport();
    }
    const syncHint = syncSettings?.url ? ' Nhớ bấm Lưu/Đẩy lên để đưa lớp lên Google Sheets.' : '';
    showToast(`Lớp ${className}: đã thêm ${added} học sinh${skipped ? `, bỏ qua ${skipped} em đã có` : ''}.${syncHint}`, true, 5000);
}
