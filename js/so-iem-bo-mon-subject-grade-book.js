// ============================================================
// SỔ ĐIỂM BỘ MÔN – SUBJECT GRADE BOOK
// ============================================================
function _sgCurrentSubject() { return document.getElementById('sgSubject')?.value || 'Toán'; }
function _sgCurrentSemester() { return document.getElementById('sgSemester')?.value || 'HK1'; }
function _sgRec() {
    const sub = _sgCurrentSubject(), sem = _sgCurrentSemester();
    return subjectGrades.find(r => r.classId === currentClassId && r.subject === sub && r.semester === sem) || null;
}
function _sgEnsure() {
    const sub = _sgCurrentSubject(), sem = _sgCurrentSemester();
    let rec = subjectGrades.find(r => r.classId === currentClassId && r.subject === sub && r.semester === sem);
    if (!rec) {
        rec = { id: Date.now(), classId: currentClassId, subject: sub, semester: sem, txCount: 2, updatedAt: new Date().toISOString(), rows: [] };
        subjectGrades.push(rec);
    }
    return rec;
}
function _sgCalcDTB(tx, txCount, gk, ck) {
    let num = 0, den = 0, total_possible = txCount + 5;
    for (let i = 0; i < txCount; i++) {
        const v = (tx && tx[i] !== undefined && tx[i] !== '') ? parseFloat(tx[i]) : null;
        if (v !== null && !isNaN(v)) { num += v; den += 1; }
    }
    const gkV = (gk !== undefined && gk !== '') ? parseFloat(gk) : null;
    if (gkV !== null && !isNaN(gkV)) { num += gkV * 2; den += 2; }
    const ckV = (ck !== undefined && ck !== '') ? parseFloat(ck) : null;
    if (ckV !== null && !isNaN(ckV)) { num += ckV * 3; den += 3; }
    if (den === 0) return { val: '', partial: false };
    const val = Math.round(num / den * 10) / 10;
    const partial = den < total_possible;
    return { val, partial };
}
// Helper: get numeric DTB value (for comparisons)
function _sgDTBVal(row) {
    const r = row.dtb;
    if (!r || r === '') return null;
    return typeof r === 'object' ? r.val : r;
}
function _sgDTBColor(v) {
    if (v >= 8) return '#16a34a';
    if (v >= 6.5) return '#2563eb';
    if (v >= 5) return '#d97706';
    return '#dc2626';
}
function _sgDTBDisplay(dtb) {
    // dtb can be {val, partial} or '' or a plain number (legacy)
    if (dtb === '' || dtb === undefined || dtb === null) return { text: '—', color: '#9ca3af', title: '' };
    const val   = (typeof dtb === 'object') ? dtb.val   : dtb;
    const part  = (typeof dtb === 'object') ? dtb.partial : false;
    if (val === '' || val === undefined) return { text: '—', color: '#9ca3af', title: '' };
    const color = _sgDTBColor(val);
    const text  = part ? `${val}*` : `${val}`;
    const title = part ? 'ĐTB tạm (chưa đủ cột điểm)' : 'ĐTB chính thức';
    return { text, color, title };
}

let _sgCurrentFilter = 'all';

function openSubjectGrades() {
    if (!currentClassId) { showToast('Chọn lớp trước!', false); return; }
    const cls = classes.find(c=>c.id===currentClassId);
    // Giữ nguyên dropdown môn/HK đang chọn (mặc định Toán/HK1 từ HTML)
    const rec = _sgEnsure();
    document.getElementById('sgSubtitle').textContent = `${rec.subject} – ${rec.semester} – ${cls?.name||''}`;
    _sgCurrentFilter = 'all';
    _sgApplyFilterChip('all');
    _sgSyncStudents(rec);
    _sgRenderTable(rec);
    document.getElementById('subjectGradesBackdrop').classList.remove('hidden');
    const modal = document.getElementById('subjectGradesModal');
    requestAnimationFrame(()=>{ modal.style.transform='translateY(0)'; });
}
function closeSubjectGrades() {
    document.getElementById('subjectGradesModal').style.transform='translateY(100%)';
    setTimeout(()=>{ document.getElementById('subjectGradesBackdrop').classList.add('hidden'); }, 280);
}

function _sgSyncStudents(rec) {
    const cls_students = students.filter(s=>s.classId===currentClassId).sort((a,b)=>(a.stt||0)-(b.stt||0));
    cls_students.forEach(s => {
        if (!rec.rows.find(r=>r.studentId===s.id)) {
            rec.rows.push({ studentId: s.id, name: s.name, stt: s.stt||0, tx: [], gk: '', ck: '', dtb: '' });
        }
    });
    // Remove rows for deleted students
    rec.rows = rec.rows.filter(r => cls_students.find(s=>s.id===r.studentId));
    // Update names/stt
    rec.rows.forEach(r => {
        const s = cls_students.find(st=>st.id===r.studentId);
        if (s) { r.name=s.name; r.stt=s.stt||0; }
    });
    rec.rows.sort((a,b)=>(a.stt||999)-(b.stt||999));
}

function _sgRowPassesFilter(row, filter) {
    const dtb = _sgDTBVal(row);
    if (filter === 'all') return true;
    if (filter === 'no_dtb') return dtb === null;
    if (dtb === null) return false;
    if (filter === 'gioi') return dtb >= 8;
    if (filter === 'kha') return dtb >= 6.5 && dtb < 8;
    if (filter === 'tb') return dtb >= 5 && dtb < 6.5;
    if (filter === 'yeu') return dtb < 5;
    return true;
}
function _sgApplyFilterChip(filter) {
    document.querySelectorAll('.sg-chip').forEach(c=>{
        const isActive = c.dataset.filter === filter;
        c.classList.toggle('ring-2', isActive);
        c.classList.toggle('ring-violet-500', isActive);
        c.classList.toggle('ring-offset-1', isActive);
    });
}

function _sgRenderTable(rec) {
    const txCount = rec.txCount || 1;
    const thead = document.getElementById('sgThead');
    const tbody = document.getElementById('sgTbody');
    document.getElementById('sgRemoveTXBtn').disabled = txCount <= 1;
    document.getElementById('sgRemoveTXBtn').classList.toggle('opacity-40', txCount <= 1);

    // Header
    let thHtml = `<tr class="bg-violet-600 text-white text-center sticky top-0 z-10">
        <th class="px-2 py-2 font-bold w-8">STT</th>
        <th class="px-3 py-2 font-bold text-left min-w-[140px]">Họ và tên</th>`;
    for (let i=1; i<=txCount; i++) {
        thHtml += `<th class="px-2 py-2 font-bold w-16 bg-violet-700">TX${i}<br><span class="text-[9px] opacity-70 font-normal">hs 1</span></th>`;
    }
    thHtml += `<th class="px-2 py-2 font-bold w-16 bg-violet-500">GK<br><span class="text-[9px] opacity-70 font-normal">hs 2</span></th>`;
    thHtml += `<th class="px-2 py-2 font-bold w-16 bg-orange-500">CK<br><span class="text-[9px] opacity-70 font-normal">hs 3</span></th>`;
    thHtml += `<th class="px-2 py-2 font-bold w-16 bg-emerald-600">ĐTB</th>`;
    thHtml += `<th class="px-2 py-2 font-bold w-12 bg-rose-500">Nhắn</th></tr>`;
    thead.innerHTML = thHtml;

    // Body — filter rows
    let visibleCount = 0;
    let html = '';
    rec.rows.forEach((row, ri) => {
        const passes = _sgRowPassesFilter(row, _sgCurrentFilter);
        const rowStyle = passes ? '' : 'display:none';
        if (passes) visibleCount++;
        const { text: dtbText, color: dtbColor, title: dtbTitle } = _sgDTBDisplay(row.dtb);
        html += `<tr class="${ri%2===0?'bg-white':'bg-violet-50'} hover:bg-violet-100 transition" style="${rowStyle}">
            <td class="px-2 py-1.5 text-center text-gray-500 font-bold">${row.stt||ri+1}</td>
            <td class="px-3 py-1.5 font-semibold text-gray-800">${row.name}</td>`;
        for (let i=0; i<txCount; i++) {
            const val = (row.tx && row.tx[i] !== undefined && row.tx[i] !== '') ? row.tx[i] : '';
            html += `<td class="px-1 py-1 text-center">
                <input type="number" min="0" max="10" step="0.1" value="${val}"
                    class="w-14 text-center text-xs font-bold border border-violet-200 rounded-lg py-1 outline-none focus:border-violet-500 bg-white"
                    oninput="sgUpdateCell(${ri},'tx',${i},this.value)"
                    onblur="sgUpdateCell(${ri},'tx',${i},this.value)"></td>`;
        }
        html += `<td class="px-1 py-1 text-center">
            <input type="number" min="0" max="10" step="0.1" value="${row.gk!==undefined&&row.gk!==''?row.gk:''}"
                class="w-14 text-center text-xs font-bold border border-violet-300 rounded-lg py-1 outline-none focus:border-violet-500 bg-violet-50"
                oninput="sgUpdateCell(${ri},'gk',0,this.value)"
                onblur="sgUpdateCell(${ri},'gk',0,this.value)"></td>`;
        html += `<td class="px-1 py-1 text-center">
            <input type="number" min="0" max="10" step="0.1" value="${row.ck!==undefined&&row.ck!==''?row.ck:''}"
                class="w-14 text-center text-xs font-bold border border-orange-200 rounded-lg py-1 outline-none focus:border-orange-400 bg-orange-50"
                oninput="sgUpdateCell(${ri},'ck',0,this.value)"
                onblur="sgUpdateCell(${ri},'ck',0,this.value)"></td>`;
        html += `<td class="px-2 py-1.5 text-center font-black text-sm" id="sgDTB_${ri}" style="color:${dtbColor}" title="${dtbTitle}">${dtbText}</td>`;
        html += `<td class="px-1 py-1 text-center">
            <button onclick="sgShowStudentMsg(${ri})" class="text-xs bg-rose-100 text-rose-600 font-bold px-2 py-1 rounded-lg hover:bg-rose-200 transition"><i class="fas fa-comment-alt"></i></button></td>`;
        html += '</tr>';
    });
    tbody.innerHTML = html;
    document.getElementById('sgFilterCount').textContent = visibleCount;
}

function sgUpdateCell(ri, field, col, value) {
    const rec = _sgRec(); if (!rec) return;
    const row = rec.rows[ri]; if (!row) return;
    const v = value === '' ? '' : parseFloat(value);
    if (field === 'tx') {
        if (!row.tx) row.tx = [];
        while (row.tx.length <= col) row.tx.push('');
        row.tx[col] = v;
    } else if (field === 'gk') {
        row.gk = v;
    } else if (field === 'ck') {
        row.ck = v;
    }
    // Recalc DTB from whatever scores are available
    row.dtb = _sgCalcDTB(row.tx||[], rec.txCount, row.gk, row.ck);
    // Update DTB cell without full re-render
    const dtbCell = document.getElementById(`sgDTB_${ri}`);
    if (dtbCell) {
        const { text, color, title } = _sgDTBDisplay(row.dtb);
        dtbCell.textContent = text;
        dtbCell.style.color = color;
        dtbCell.title = title;
    }
    rec.updatedAt = new Date().toISOString();
    saveData();
}

function sgSave() {
    // Môn/HK đổi → load/tạo record mới cho combo này, sync học sinh, re-render
    const rec = _sgEnsure();
    _sgSyncStudents(rec);
    const cls = classes.find(c=>c.id===currentClassId);
    document.getElementById('sgSubtitle').textContent = `${rec.subject} – ${rec.semester} – ${cls?.name||''}`;
    rec.updatedAt = new Date().toISOString();
    saveData();
    _sgRenderTable(rec);
    // Reset quick-entry panel
    _sgQECol = null;
    document.getElementById('sgQEList').innerHTML = '<div class="flex items-center justify-center h-32 text-gray-400 text-sm"><i class="fas fa-arrow-up mr-2"></i>Chọn cột ở trên</div>';
    document.getElementById('sgQEFilledCount').textContent = '0';
    document.getElementById('sgQETotal').textContent = rec.rows.length;
    document.getElementById('sgQEProgress').style.width = '0%';
    _sgRenderQEColBtns(rec);
}

function sgAddTX() {
    const rec = _sgEnsure();
    rec.txCount = (rec.txCount || 1) + 1;
    rec.updatedAt = new Date().toISOString();
    saveData(); _sgRenderTable(rec);
}
function sgRemoveTX() {
    const rec = _sgEnsure();
    if (rec.txCount <= 1) return;
    rec.txCount--;
    // Remove last TX value from all rows
    rec.rows.forEach(r => { if (r.tx && r.tx.length > rec.txCount) r.tx = r.tx.slice(0, rec.txCount); });
    // Recalc DTBs
    rec.rows.forEach(r => {
        r.dtb = _sgCalcDTB(r.tx||[], rec.txCount, r.gk, r.ck);
    });
    rec.updatedAt = new Date().toISOString();
    saveData(); _sgRenderTable(rec);
}

function sgExportExcel() {
    const rec = _sgRec(); if (!rec || !rec.rows.length) { showToast('Chưa có dữ liệu!', false); return; }
    const cls = classes.find(c=>c.id===currentClassId);
    const txCount = rec.txCount || 1;

    // Build header
    const txHeaders = Array.from({length:txCount},(_,i)=>`TX${i+1} (hs1)`);
    const header = ['STT','Họ và tên',...txHeaders,'GK (hs2)','CK (hs3)','ĐTB'];
    const wsData = [
        [`BẢNG ĐIỂM ${rec.subject.toUpperCase()} - LỚP ${cls?.name.toUpperCase()||''} - ${rec.semester}`, ...Array(header.length-1).fill('')],
        [`Xuất ngày: ${new Date().toLocaleDateString('vi-VN')}`, ...Array(header.length-1).fill('')],
        header
    ];
    rec.rows.forEach(r => {
        const txVals = Array.from({length:txCount},(_,i)=>r.tx&&r.tx[i]!==undefined&&r.tx[i]!==''?r.tx[i]:'');
        const dtbV = _sgDTBVal(r);
        wsData.push([r.stt||'', r.name, ...txVals, r.gk!==''?r.gk:'', r.ck!==''?r.ck:'', dtbV!==null?dtbV:'']);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    // Styling
    const ncols = header.length;
    ws['!merges'] = [{s:{r:0,c:0},e:{r:0,c:ncols-1}},{s:{r:1,c:0},e:{r:1,c:ncols-1}}];
    ws['!cols'] = [{wch:6},{wch:26},...Array(txCount).fill({wch:12}),{wch:12},{wch:12},{wch:12}];

    const headerRowIdx = 2;
    for (let ci=0; ci<ncols; ci++) {
        const addr = XLSX.utils.encode_cell({r:headerRowIdx,c:ci});
        if (ws[addr]) ws[addr].s={font:{bold:true,color:{rgb:"FFFFFF"}},fill:{fgColor:{rgb:"7C3AED"}},alignment:{horizontal:'center'}};
    }
    // Color DTB column
    for (let ri=3; ri<wsData.length; ri++) {
        const dtbAddr = XLSX.utils.encode_cell({r:ri,c:ncols-1});
        if (ws[dtbAddr]&&ws[dtbAddr].v!=='') {
            const v = parseFloat(ws[dtbAddr].v);
            const rgb = v>=8?'16A34A':v>=6.5?'2563EB':v>=5?'D97706':'DC2626';
            ws[dtbAddr].s = {font:{bold:true,color:{rgb}},alignment:{horizontal:'center'}};
        }
    }
    // Partial indicator in DTB header
    const dtbHdrAddr = XLSX.utils.encode_cell({r:2,c:ncols-1});
    if (ws[dtbHdrAddr]) ws[dtbHdrAddr].v = 'ĐTB (* = tạm)';
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bảng điểm');
    XLSX.writeFile(wb, `Diem_${rec.subject}_${cls?.name||'lop'}_${rec.semester}.xlsx`);
    showToast('Đã xuất Excel!');
}

// ---- Google Sheets sync from Sổ điểm modal ----
async function sgSyncGSheet() {
    if (!syncSettings.url) {
        showToast('Chưa cài URL Google Sheets. Vào Cài đặt → Đồng bộ để cài.', false);
        return;
    }
    const btn   = document.getElementById('btnSgSync');
    const icon  = document.getElementById('sgSyncIcon');
    const label = document.getElementById('sgSyncLabel');
    if (btn.disabled) return;
    btn.disabled = true;
    icon.className = 'fas fa-spinner fa-spin text-sm';
    label.textContent = 'Đang lưu...';
    try {
        const result = await syncRequest('push', { classes, students, history, periods, gradeRecords, subjectGrades });
        if (result.status === 'ok') {
            syncSettings.lastSync = new Date().toISOString();
            saveData();
            icon.className = 'fas fa-check text-sm';
            label.textContent = 'Đã lưu!';
            showToast('Đồng bộ sổ điểm lên Google Sheets thành công! ☁️');
            setTimeout(()=>{ icon.className='fas fa-cloud-upload-alt text-sm'; label.textContent='GSheet'; btn.disabled=false; }, 2500);
        } else {
            throw new Error(result.message||'Lỗi không xác định');
        }
    } catch(e) {
        icon.className = 'fas fa-exclamation-circle text-sm';
        label.textContent = 'Lỗi!';
        showToast('Đồng bộ thất bại: ' + e.message, false);
        setTimeout(()=>{ icon.className='fas fa-cloud-upload-alt text-sm'; label.textContent='GSheet'; btn.disabled=false; }, 3000);
    }
}

// ---- Quick Column Entry ----
let _sgQECol = null;  // { field: 'tx'|'gk'|'ck', idx: 0 }
let _sgQEFocusedRi = 0;  // index of currently focused student row

function openSgQuickEntry() {
    const rec = _sgEnsure(); if (!rec.rows.length) { showToast('Chưa có học sinh!', false); return; }
    const cls = classes.find(c=>c.id===currentClassId);
    document.getElementById('sgQESubtitle').textContent = `${rec.subject} – ${rec.semester} – ${cls?.name||''}`;
    _sgQECol = null;
    _sgRenderQEColBtns(rec);
    document.getElementById('sgQEList').innerHTML = '<div class="flex items-center justify-center h-32 text-gray-400 text-sm"><i class="fas fa-arrow-up mr-2"></i>Chọn cột ở trên</div>';
    document.getElementById('sgQEFilledCount').textContent = '0';
    document.getElementById('sgQETotal').textContent = rec.rows.length;
    document.getElementById('sgQEProgress').style.width = '0%';

    const bd = document.getElementById('sgQuickBackdrop');
    const panel = document.getElementById('sgQuickPanel');
    bd.classList.remove('hidden'); panel.classList.remove('hidden');
    requestAnimationFrame(()=>{ panel.style.transform='translateX(0)'; });
}
function closeSgQuickEntry() {
    const panel = document.getElementById('sgQuickPanel');
    panel.style.transform='translateX(100%)';
    setTimeout(()=>{
        panel.classList.add('hidden');
        document.getElementById('sgQuickBackdrop').classList.add('hidden');
    }, 300);
    // Sync back to main table
    const rec = _sgRec(); if (rec) _sgRenderTable(rec);
}

function _sgRenderQEColBtns(rec) {
    const txCount = rec.txCount || 1;
    const container = document.getElementById('sgQEColBtns');
    let html = '';
    for (let i=0; i<txCount; i++) {
        html += `<button onclick="sgQESelectCol('tx',${i})" id="sgQEBtn_tx_${i}"
            class="qe-col-btn text-xs font-bold px-3 py-1.5 rounded-lg border border-violet-200 bg-white text-violet-700 hover:bg-violet-50 transition">
            TX${i+1}</button>`;
    }
    html += `<button onclick="sgQESelectCol('gk',0)" id="sgQEBtn_gk_0"
        class="qe-col-btn text-xs font-bold px-3 py-1.5 rounded-lg border border-violet-200 bg-white text-violet-600 hover:bg-violet-50 transition">
        GK (hs2)</button>`;
    html += `<button onclick="sgQESelectCol('ck',0)" id="sgQEBtn_ck_0"
        class="qe-col-btn text-xs font-bold px-3 py-1.5 rounded-lg border border-orange-200 bg-white text-orange-600 hover:bg-orange-50 transition">
        CK (hs3)</button>`;
    container.innerHTML = html;
}

function sgQESelectCol(field, idx) {
    _sgQECol = { field, idx };
    // Highlight active button
    document.querySelectorAll('.qe-col-btn').forEach(b=>{
        b.classList.remove('ring-2','ring-fuchsia-500','bg-fuchsia-50','text-fuchsia-700','ring-offset-1');
    });
    const btn = document.getElementById(`sgQEBtn_${field}_${idx}`);
    if (btn) btn.classList.add('ring-2','ring-fuchsia-500','bg-fuchsia-50','text-fuchsia-700','ring-offset-1');

    const rec = _sgRec(); if (!rec) return;
    const colLabel = field==='gk'?'GK (Giữa kỳ – hệ số 2)':field==='ck'?'CK (Cuối kỳ – hệ số 3)':`TX${idx+1} (Thường xuyên)`;
    _sgRenderQEList(rec, field, idx, colLabel);
}

function _sgRenderQEList(rec, field, idx, colLabel) {
    const list = document.getElementById('sgQEList');
    let html = `<div class="px-4 py-2 bg-fuchsia-50 border-b sticky top-0 z-10">
        <span class="text-xs font-black text-fuchsia-700">Đang nhập: ${colLabel}</span>
    </div>`;
    rec.rows.forEach((row, ri) => {
        let curVal = '';
        if (field==='tx') curVal = (row.tx&&row.tx[idx]!==undefined&&row.tx[idx]!=='') ? row.tx[idx] : '';
        else if (field==='gk') curVal = (row.gk!==undefined&&row.gk!=='') ? row.gk : '';
        else if (field==='ck') curVal = (row.ck!==undefined&&row.ck!=='') ? row.ck : '';
        const hasVal = curVal !== '';
        html += `<div class="flex items-center gap-3 px-4 py-2.5 border-b hover:bg-fuchsia-50 transition ${hasVal?'bg-green-50':''}">
            <span class="text-xs text-gray-400 font-bold w-6 text-right flex-shrink-0">${row.stt||ri+1}</span>
            <span class="text-sm font-semibold text-gray-800 flex-1 truncate">${row.name}</span>
            <div class="flex items-center gap-2 flex-shrink-0">
                <input type="number" id="sgQE_${ri}" min="0" max="10" step="0.1"
                    value="${curVal}" placeholder="—"
                    class="w-20 text-center text-base font-black border-2 ${hasVal?'border-green-400 bg-green-50':'border-gray-200 bg-white'} rounded-xl py-1.5 outline-none focus:border-fuchsia-500 focus:bg-fuchsia-50 transition"
                    oninput="sgQEUpdateCell(${ri},'${field}',${idx},this)"
                    onkeydown="sgQEHandleKey(event,${ri},${rec.rows.length})"
                    onfocus="_sgQEFocusedRi=${ri}">
                ${hasVal?'<i class="fas fa-check-circle text-green-500 text-base"></i>':'<i class="fas fa-circle text-gray-200 text-base"></i>'}
            </div>
        </div>`;
    });
    list.innerHTML = html;
    _sgUpdateQEProgress(rec, field, idx);
    // Auto-focus first empty input
    const firstEmpty = rec.rows.findIndex(r=>{
        if (field==='tx') return !r.tx||r.tx[idx]===undefined||r.tx[idx]==='';
        if (field==='gk') return r.gk===undefined||r.gk==='';
        if (field==='ck') return r.ck===undefined||r.ck==='';
    });
    const focusIdx = firstEmpty >= 0 ? firstEmpty : 0;
    setTimeout(()=>{ const inp=document.getElementById(`sgQE_${focusIdx}`); if(inp) inp.focus(); }, 80);
}

function sgQEHandleKey(e, ri, total) {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault();
        const next = document.getElementById(`sgQE_${ri+1}`);
        if (next) { next.focus(); next.select(); }
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = document.getElementById(`sgQE_${ri-1}`);
        if (prev) { prev.focus(); prev.select(); }
    }
}

function sgQEUpdateCell(ri, field, idx, input) {
    const rec = _sgRec(); if (!rec) return;
    const row = rec.rows[ri]; if (!row) return;
    const v = input.value === '' ? '' : parseFloat(input.value);
    if (field==='tx') {
        if (!row.tx) row.tx=[];
        while (row.tx.length<=idx) row.tx.push('');
        row.tx[idx]=v;
    } else if (field==='gk') { row.gk=v; }
    else if (field==='ck') { row.ck=v; }
    // Recalc DTB
    row.dtb = _sgCalcDTB(row.tx||[], rec.txCount||1, row.gk, row.ck);
    // Visual feedback on this input
    const hasVal = input.value !== '';
    input.classList.toggle('border-green-400', hasVal);
    input.classList.toggle('bg-green-50', hasVal);
    input.classList.toggle('border-gray-200', !hasVal);
    input.classList.toggle('bg-white', !hasVal);
    // Update check icon
    const iconEl = input.parentElement.nextElementSibling;
    if (iconEl && iconEl.tagName==='I') {
        iconEl.className = hasVal ? 'fas fa-check-circle text-green-500 text-base' : 'fas fa-circle text-gray-200 text-base';
    }
    rec.updatedAt = new Date().toISOString();
    saveData();
    _sgUpdateQEProgress(rec, field, idx);
}

function sgQESetGrade(val) {
    if (!_sgQECol) return;
    const { field, idx } = _sgQECol;
    const ri = _sgQEFocusedRi;
    const input = document.getElementById(`sgQE_${ri}`);
    if (!input) return;
    input.value = val === '' ? '' : val;
    // Trigger update
    sgQEUpdateCell(ri, field, idx, input);
    // Move to next row
    const next = document.getElementById(`sgQE_${ri+1}`);
    if (next) { next.focus(); next.select(); }
}

function _sgUpdateQEProgress(rec, field, idx) {
    const total = rec.rows.length;
    const filled = rec.rows.filter(r=>{
        if (field==='tx') return r.tx&&r.tx[idx]!==undefined&&r.tx[idx]!=='';
        if (field==='gk') return r.gk!==undefined&&r.gk!=='';
        if (field==='ck') return r.ck!==undefined&&r.ck!=='';
    }).length;
    document.getElementById('sgQEFilledCount').textContent = filled;
    document.getElementById('sgQETotal').textContent = total;
    document.getElementById('sgQEProgress').style.width = total > 0 ? `${Math.round(filled/total*100)}%` : '0%';
}

// ---- Filter ----
function sgSetFilter(filter) {
    _sgCurrentFilter = filter;
    _sgApplyFilterChip(filter);
    const rec = _sgRec(); if (!rec) return;
    // Show/hide rows without full re-render
    let count = 0;
    rec.rows.forEach((row, ri) => {
        const passes = _sgRowPassesFilter(row, filter);
        const tr = document.querySelector(`#sgTbody tr:nth-child(${ri+1})`);
        if (tr) tr.style.display = passes ? '' : 'none';
        if (passes) count++;
    });
    document.getElementById('sgFilterCount').textContent = count;
}

// ---- Download template ----
function sgDownloadTemplate() {
    const rec = _sgEnsure();
    const cls = classes.find(c=>c.id===currentClassId);
    const txCount = rec.txCount || 1;
    const cls_students = students.filter(s=>s.classId===currentClassId).sort((a,b)=>(a.stt||0)-(b.stt||0));
    const txHeaders = Array.from({length:txCount},(_,i)=>`TX${i+1}`);
    const header = ['STT','Họ và tên',...txHeaders,'GK (hệ số 2)','CK (hệ số 3)'];
    const wsData = [
        [`MẪU ĐIỂM ${rec.subject.toUpperCase()} - LỚP ${cls?.name||''} - ${rec.semester}`, ...Array(header.length-1).fill('')],
        [`⚠ Chú ý: Điểm từ 0–10, tối đa 1 chữ số thập phân. Không sửa cột STT và Họ tên.`, ...Array(header.length-1).fill('')],
        header
    ];
    cls_students.forEach(s => {
        wsData.push([s.stt||'', s.name, ...Array(txCount+2).fill('')]);
    });
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!merges'] = [{s:{r:0,c:0},e:{r:0,c:header.length-1}},{s:{r:1,c:0},e:{r:1,c:header.length-1}}];
    ws['!cols'] = [{wch:6},{wch:28},...Array(txCount+2).fill({wch:14})];
    // Style header row
    for (let ci=0; ci<header.length; ci++) {
        const addr = XLSX.utils.encode_cell({r:2,c:ci});
        if (ws[addr]) ws[addr].s={font:{bold:true,color:{rgb:"FFFFFF"}},fill:{fgColor:{rgb:"7C3AED"}},alignment:{horizontal:'center'}};
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mẫu điểm');
    XLSX.writeFile(wb, `Mau_diem_${rec.subject}_${cls?.name||'lop'}_${rec.semester}.xlsx`);
    showToast('Đã tải file mẫu!');
}

// ---- Import from Excel ----
function sgHandleImport(e) {
    const rec = _sgEnsure();
    const f = e.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const wb = XLSX.read(ev.target.result, {type:'binary'});
            const ws = wb.Sheets[wb.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(ws, {header:1, defval:''});
            // Find header row (contains TX1)
            let headerRow = -1;
            for (let i=0; i<data.length; i++) {
                if (data[i].some(c=>String(c).includes('TX1')||String(c).includes('Họ'))) { headerRow=i; break; }
            }
            if (headerRow<0) { alert('Không tìm thấy hàng tiêu đề (TX1 / Họ và tên)!'); return; }
            const headers = data[headerRow].map(h=>String(h).trim());
            const nameIdx = headers.findIndex(h=>h.includes('Họ')||h.includes('tên'));
            const sttIdx  = headers.findIndex(h=>h.toLowerCase()==='stt');
            const txCount = rec.txCount || 1;
            const gkIdx   = headers.findIndex(h=>String(h).toUpperCase().includes('GK'));
            const ckIdx   = headers.findIndex(h=>String(h).toUpperCase().includes('CK'));
            let imported = 0;
            for (let ri=headerRow+1; ri<data.length; ri++) {
                const row = data[ri];
                if (!row[nameIdx]) continue;
                const name = String(row[nameIdx]).trim();
                const sgRow = rec.rows.find(r=>r.name===name || (sttIdx>=0 && r.stt==row[sttIdx]));
                if (!sgRow) continue;
                for (let ti=0; ti<txCount; ti++) {
                    const txI = headers.findIndex((h,idx)=>idx>1&&String(h).replace(/\s/g,'').toUpperCase()===`TX${ti+1}`);
                    if (txI>=0 && row[txI]!=='') {
                        if (!sgRow.tx) sgRow.tx=[];
                        sgRow.tx[ti] = parseFloat(row[txI]);
                    }
                }
                if (gkIdx>=0 && row[gkIdx]!=='') sgRow.gk = parseFloat(row[gkIdx]);
                if (ckIdx>=0 && row[ckIdx]!=='') sgRow.ck = parseFloat(row[ckIdx]);
                // Recalc DTB
                sgRow.dtb = _sgCalcDTB(sgRow.tx||[], txCount, sgRow.gk, sgRow.ck);
                imported++;
            }
            rec.updatedAt = new Date().toISOString();
            saveData(); _sgRenderTable(rec);
            showToast(`Đã nhập điểm ${imported} học sinh!`);
        } catch(err) { console.error(err); alert('Lỗi đọc file. Vui lòng dùng đúng file mẫu đã tải.'); }
        e.target.value='';
    };
    reader.readAsBinaryString(f);
}

// ---- Build message for one student ----
function _sgBuildMsg(row, rec, template) {
    const cls = classes.find(c=>c.id===currentClassId);
    const today = new Date().toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'});
    const dtb = _sgDTBVal(row);
    const isPartial = dtb !== null && typeof row.dtb === 'object' && row.dtb.partial;
    const xepLoai = dtb === null ? '(chưa đủ điểm)' : isPartial ? `${dtb >= 8?'Giỏi':dtb>=6.5?'Khá':dtb>=5?'Trung bình':'Yếu'} (tạm)` : dtb>=8?'Giỏi':dtb>=6.5?'Khá':dtb>=5?'Trung bình':'Yếu';
    const txCount = rec.txCount || 1;
    const txLines = Array.from({length:txCount},(_,i)=>{
        const v = row.tx&&row.tx[i]!==undefined&&row.tx[i]!=='' ? row.tx[i] : '—';
        return `TX${i+1}: ${v}`;
    }).join(' | ');
    const gkLine = row.gk!==''&&row.gk!==undefined ? row.gk : '—';
    const ckLine = row.ck!==''&&row.ck!==undefined ? row.ck : '—';
    const dtbLine = dtb !== null ? `${dtb} (${xepLoai})` : '—';

    if (template === 'warning') {
        let msg = `⚠️ THÔNG BÁO KẾT QUẢ HỌC TẬP\n`;
        msg += `Kính gửi Phụ huynh em ${row.name}\n`;
        msg += `Lớp: ${cls?.name||''} | Môn: ${rec.subject} | ${rec.semester}\n\n`;
        msg += `📉 Điểm trung bình môn: ${dtbLine}\n`;
        msg += `${txLines} | GK: ${gkLine} | CK: ${ckLine}\n\n`;
        if (dtb !== null && dtb < 5) {
            msg += `❗ Em đang ở mức DƯỚI TRUNG BÌNH. Đề nghị PH phối hợp với GV để có kế hoạch hỗ trợ em học tập tốt hơn.\n`;
        } else if (dtb !== null && dtb < 6.5) {
            msg += `📌 Em đang ở mức Trung Bình. PH cần nhắc nhở em ôn tập đều đặn hơn.\n`;
        }
        msg += `\nGiáo viên ${rec.subject} - Lớp ${cls?.name||''}\n${today}`;
        return msg;
    }
    if (template === 'friendly') {
        let msg = `👋 Chào PH em ${row.name} (${cls?.name||''}) - ${today}\n`;
        msg += `📚 Môn ${rec.subject} – ${rec.semester}\n\n`;
        msg += `🏆 ĐTB: ${dtbLine}\n`;
        msg += `📝 ${txLines}\n`;
        msg += `📋 GK: ${gkLine} | CK: ${ckLine}\n`;
        if (dtb !== null) {
            if (dtb >= 8) msg += `\n🌟 Tuyệt vời! Em học rất tốt môn này. Tiếp tục phát huy nhé!`;
            else if (dtb >= 6.5) msg += `\n💪 Em học khá tốt! Cố gắng thêm một chút để lên Giỏi nhé!`;
            else if (dtb >= 5) msg += `\n📌 Em cần cố gắng thêm để cải thiện điểm số.`;
            else msg += `\n⚠️ Em cần được hỗ trợ nhiều hơn. PH hãy liên hệ GV để bàn kế hoạch.`;
        }
        msg += `\n\n🙏 Trân trọng – GV ${rec.subject}`;
        return msg;
    }
    // formal (default)
    let msg = `Kính gửi Quý Phụ huynh em ${row.name}\n`;
    msg += `Lớp: ${cls?.name||''} | Môn: ${rec.subject} | ${rec.semester} | Ngày: ${today}\n\n`;
    msg += `📊 ĐIỂM SỐ:\n`;
    msg += `  ${txLines}\n`;
    msg += `  GK (hệ số 2): ${gkLine}\n`;
    msg += `  CK (hệ số 3): ${ckLine}\n`;
    msg += `  ĐTB: ${dtbLine}\n`;
    if (dtb !== null) {
        msg += `\n📌 Nhận xét: `;
        if (dtb >= 8) msg += 'Em đạt loại Giỏi, tiếp tục phát huy!';
        else if (dtb >= 6.5) msg += 'Em đạt loại Khá, cần nỗ lực thêm.';
        else if (dtb >= 5) msg += 'Em đạt loại Trung Bình, cần ôn tập đều hơn.';
        else msg += 'Em đang ở mức Yếu, cần có kế hoạch hỗ trợ kịp thời.';
    }
    msg += `\n\nTrân trọng,\nGiáo viên môn ${rec.subject} – Lớp ${cls?.name||''}`;
    return msg;
}

// ---- Show message for 1 student ----
function sgShowStudentMsg(ri) {
    const rec = _sgRec(); if (!rec) return;
    const row = rec.rows[ri]; if (!row) return;
    const template = document.getElementById('sgMsgTemplate').value;
    const msg = _sgBuildMsg(row, rec, template);
    document.getElementById('sgMsgTitle').textContent = `Tin nhắn: ${row.name}`;
    document.getElementById('sgMsgSubtitle').textContent = `Môn ${rec.subject} – ${rec.semester}`;
    document.getElementById('sgMsgList').innerHTML = `
        <div class="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <div class="flex justify-between items-start mb-2">
                <span class="font-bold text-gray-700 text-sm">${row.name}</span>
                <button onclick="navigator.clipboard.writeText(document.getElementById('sgMsgText_0').value);showToast('Đã sao chép!')" class="text-xs bg-violet-100 text-violet-700 font-bold px-2.5 py-1 rounded-lg hover:bg-violet-200 transition"><i class="fas fa-copy mr-1"></i>Copy</button>
            </div>
            <textarea id="sgMsgText_0" class="w-full text-xs leading-relaxed text-gray-700 bg-white border border-gray-200 rounded-lg p-3 resize-y outline-none" rows="14">${msg}</textarea>
        </div>`;
    _openSgMsgModal();
}

// ---- Batch messages for filtered students ----
let _sgMsgRows = [];
function sgBatchMsg() {
    const rec = _sgRec(); if (!rec || !rec.rows.length) { showToast('Chưa có dữ liệu!', false); return; }
    const template = document.getElementById('sgMsgTemplate').value;
    _sgMsgRows = rec.rows.filter(r => _sgRowPassesFilter(r, _sgCurrentFilter));
    if (!_sgMsgRows.length) { showToast('Không có học sinh nào phù hợp!', false); return; }
    const cls = classes.find(c=>c.id===currentClassId);
    const filterLabel = {all:'Tất cả',gioi:'Giỏi (≥8)',kha:'Khá (6.5–7.9)',tb:'TB (5–6.4)',yeu:'Yếu (<5)',no_dtb:'Chưa có ĐTB'}[_sgCurrentFilter]||'';
    document.getElementById('sgMsgTitle').textContent = `Tin nhắn hàng loạt – ${_sgMsgRows.length} HS`;
    document.getElementById('sgMsgSubtitle').textContent = `${rec.subject} – ${rec.semester} – ${filterLabel}`;

    let html = '';
    _sgMsgRows.forEach((row, i) => {
        const msg = _sgBuildMsg(row, rec, template);
        html += `<div class="bg-gray-50 rounded-xl border border-gray-200 p-3">
            <div class="flex justify-between items-center mb-1.5">
                <span class="font-bold text-gray-700 text-sm">${row.stt||i+1}. ${row.name}</span>
                <button onclick="navigator.clipboard.writeText(document.getElementById('sgMsgText_${i}').value);showToast('Đã sao chép!')" class="text-xs bg-violet-100 text-violet-700 font-bold px-2.5 py-1 rounded-lg hover:bg-violet-200 transition"><i class="fas fa-copy mr-1"></i>Copy</button>
            </div>
            <textarea id="sgMsgText_${i}" class="w-full text-xs leading-relaxed text-gray-700 bg-white border border-gray-200 rounded-lg p-2.5 resize-y outline-none" rows="10">${msg}</textarea>
        </div>`;
    });
    document.getElementById('sgMsgList').innerHTML = html;
    _openSgMsgModal();
}

function _openSgMsgModal() {
    const bd = document.getElementById('sgMsgBackdrop');
    const m  = document.getElementById('sgMsgModal');
    bd.classList.remove('hidden'); m.classList.remove('hidden');
    requestAnimationFrame(()=>{ m.style.transform='scale(1)'; m.style.opacity='1'; });
}
function closeSgMsg() {
    const m = document.getElementById('sgMsgModal');
    m.style.transform='scale(0.95)'; m.style.opacity='0';
    setTimeout(()=>{
        m.classList.add('hidden');
        document.getElementById('sgMsgBackdrop').classList.add('hidden');
    }, 200);
}
function sgCopyAllMsg() {
    const texts = [];
    document.querySelectorAll('#sgMsgList textarea').forEach(t=>texts.push(t.value));
    navigator.clipboard.writeText(texts.join('\n\n' + '─'.repeat(40) + '\n\n'));
    showToast(`Đã sao chép ${texts.length} tin nhắn!`);
}
function sgExportMsgExcel() {
    const rec = _sgRec(); if (!rec) return;
    const cls = classes.find(c=>c.id===currentClassId);
    const template = document.getElementById('sgMsgTemplate').value;
    const rows = _sgMsgRows.length ? _sgMsgRows : rec.rows.filter(r=>_sgRowPassesFilter(r,_sgCurrentFilter));
    if (!rows.length) { showToast('Không có dữ liệu!', false); return; }
    const wsData = [['STT','Họ và tên','ĐTB','Tin nhắn phụ huynh']];
    rows.forEach(r => {
        const v = _sgDTBVal(r);
        wsData.push([r.stt||'', r.name, v!==null?v:'—', _sgBuildMsg(r, rec, template)]);
    });
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{wch:6},{wch:26},{wch:8},{wch:80}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tin nhắn');
    XLSX.writeFile(wb, `TinNhan_${rec.subject}_${cls?.name||'lop'}_${rec.semester}.xlsx`);
    showToast('Đã xuất Excel tin nhắn!');
}

