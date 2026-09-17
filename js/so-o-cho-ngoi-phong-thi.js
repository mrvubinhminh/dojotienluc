// ============================================================
// SƠ ĐỒ CHỖ NGỒI PHÒNG THI
// ============================================================
// Layout: 4 dãy × 6 bàn × 2 chỗ = 48 chỗ
// Đánh số theo CỘT: Dãy1=1-12, Dãy2=13-24, Dãy3=25-36, Dãy4=37-48
// Xếp chỗ theo HÀNG từ trên xuống: hàng 1 (bàn 1, tất cả dãy), hàng 2, ...
// → "Học tốt" ngồi trên cùng (hàng 1, 2...)

let _seatingGood     = new Set();  // studentId
let _seatingStartNum = 1;
let _seatingMap      = {};         // seatDisplayNum → studentId

// Convert physical slot index (0–47) to display seat number
// Physical order: row by row (front→back), within each row: dãy1L,dãy1R,dãy2L,dãy2R,...
function _physToSeat(i) {
    const row  = Math.floor(i / 8);       // 0–5 (bàn 1–6)
    const col  = Math.floor((i % 8) / 2); // 0–3 (dãy 1–4)
    const side = (i % 8) % 2;             // 0=trái, 1=phải
    return col * 12 + row * 2 + side + _seatingStartNum;
}

// ── Open config modal ──────────────────────────────────────
function openSeatingConfig() {
    if (!currentClassId) { showToast('Chọn lớp trước!', false); return; }
    const cls = classes.find(c=>c.id===currentClassId);
    const cnt = students.filter(s=>s.classId===currentClassId).length;
    document.getElementById('seatingConfigSubtitle').innerText = `${cls?.name||''} · ${cnt} học sinh`;
    document.getElementById('seatingStartNum').value = _seatingStartNum;
    _renderSeatingStudentList();
    _updateSeatingGoodCount();
    document.getElementById('seatingConfigBackdrop').classList.remove('hidden');
    setTimeout(()=>document.getElementById('seatingConfigModal').classList.remove('translate-y-full'), 10);
}

function closeSeatingConfig() {
    document.getElementById('seatingConfigModal').classList.add('translate-y-full');
    setTimeout(()=>document.getElementById('seatingConfigBackdrop').classList.add('hidden'), 300);
}

function _renderSeatingStudentList() {
    const list = document.getElementById('seatingStudentList');
    const clsStudents = students.filter(s=>s.classId===currentClassId).sort((a,b)=>a.stt-b.stt);
    list.innerHTML = clsStudents.map(s => {
        const good = _seatingGood.has(s.id);
        return `
        <div class="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
            <button onclick="toggleSeatingGood(${s.id})" id="seatingGoodBtn_${s.id}"
                class="w-9 h-9 rounded-xl flex items-center justify-center font-black text-base transition active:scale-90 flex-shrink-0 ${good?'bg-amber-400 text-white shadow':'bg-gray-100 text-gray-300 hover:bg-gray-200'}">
                ⭐
            </button>
            <img src="${s.avatar}" class="w-9 h-9 rounded-full object-contain bg-blue-50 p-0.5 flex-shrink-0">
            <div class="flex-1 overflow-hidden">
                <span class="text-xs font-black text-gray-400">#${s.stt}</span>
                <span class="font-bold text-gray-800 ml-1">${s.name}</span>
            </div>
            <span class="text-xs font-bold px-2 py-0.5 rounded-full ${s.points>=0?'bg-green-50 text-green-600':'bg-red-50 text-red-500'}">${s.points||0}đ</span>
        </div>`;
    }).join('') || '<p class="text-gray-400 text-sm text-center py-8">Lớp chưa có học sinh</p>';
}

function toggleSeatingGood(studentId) {
    if (_seatingGood.has(studentId)) _seatingGood.delete(studentId);
    else _seatingGood.add(studentId);
    const btn = document.getElementById(`seatingGoodBtn_${studentId}`);
    if (btn) {
        const good = _seatingGood.has(studentId);
        btn.className = `w-9 h-9 rounded-xl flex items-center justify-center font-black text-base transition active:scale-90 flex-shrink-0 ${good?'bg-amber-400 text-white shadow':'bg-gray-100 text-gray-300 hover:bg-gray-200'}`;
    }
    _updateSeatingGoodCount();
}

function _updateSeatingGoodCount() {
    document.getElementById('seatingGoodCount').innerText = `⭐ ${_seatingGood.size} học tốt`;
}

// ── Generate seating ────────────────────────────────────────
function _buildSeating() {
    _seatingStartNum = Math.max(1, parseInt(document.getElementById('seatingStartNum')?.value)||1);
    const clsStudents = students.filter(s=>s.classId===currentClassId);
    const good   = clsStudents.filter(s=>_seatingGood.has(s.id)).sort((a,b)=>a.stt-b.stt);
    const others = _shuffle(clsStudents.filter(s=>!_seatingGood.has(s.id)));
    const combined = [...good, ...others].slice(0, 48);
    _seatingMap = {};
    combined.forEach((s, i) => { _seatingMap[_physToSeat(i)] = s.id; });
}

function generateSeating() {
    _buildSeating();
    closeSeatingConfig();
    setTimeout(() => {
        const cls = classes.find(c=>c.id===currentClassId);
        const cnt = students.filter(s=>s.classId===currentClassId).length;
        document.getElementById('seatingResultTitle').innerText = `Phòng thi – ${cls?.name||''}`;
        document.getElementById('seatingResultSub').innerText = `${cnt} học sinh · SBD ${_seatingStartNum}–${_seatingStartNum+47} · ⭐${_seatingGood.size} học tốt đầu phòng`;
        document.getElementById('seatingResultOverlay').classList.remove('hidden');
        _renderSeatingChart();
    }, 320);
}

function reshuffleSeating() {
    _buildSeating();
    _renderSeatingChart();
    showToast('Đã xáo lại sơ đồ!');
}

function closeSeatingResult() {
    document.getElementById('seatingResultOverlay').classList.add('hidden');
}

// ── Render chart ───────────────────────────────────────────
function _renderSeatingChart() {
    const grid = document.getElementById('seatingChartGrid');
    const stMap = {};
    students.filter(s=>s.classId===currentClassId).forEach(s=>{ stMap[s.id]=s; });

    // Column header row
    let html = `<div class="grid gap-2 mb-2" style="grid-template-columns:repeat(4,minmax(148px,1fr))">`;
    [1,2,3,4].forEach(d=>{
        html += `<div class="text-center text-white text-xs font-black py-1.5 tracking-widest opacity-70">DÃY ${d}</div>`;
    });
    html += '</div>';

    // 6 rows of desks
    html += `<div class="grid gap-2" style="grid-template-columns:repeat(4,minmax(148px,1fr))">`;
    for (let row=0; row<6; row++) {
        for (let col=0; col<4; col++) {
            const lSeat = col*12 + row*2 + _seatingStartNum;
            const rSeat = col*12 + row*2 + 1 + _seatingStartNum;
            const lSid  = _seatingMap[lSeat];
            const rSid  = _seatingMap[rSeat];
            const lSt   = lSid ? stMap[lSid] : null;
            const rSt   = rSid ? stMap[rSid] : null;
            const lGood = lSid && _seatingGood.has(lSid);
            const rGood = rSid && _seatingGood.has(rSid);

            const _sbd = (seat, st) => `${String(seat).padStart(2,'0')}${st?'-'+String(st.stt||'?').padStart(2,'0'):''}`;
            const seatBox = (seat, st, good) => `
                <div class="flex-1 flex flex-col items-center justify-center py-2 px-1 ${good?'seat-good':'bg-white'} ${!st?'seat-empty':''} rounded-xl transition" style="min-width:68px">
                    <div class="text-[10px] font-black ${good?'text-amber-700':'text-gray-400'} leading-none mb-0.5 tracking-tight">${_sbd(seat,st)}</div>
                    ${good?'<div class="text-amber-500 text-[10px] leading-none">⭐</div>':''}
                    <div class="text-[11px] font-bold ${st?'text-gray-800':'text-gray-300'} leading-tight text-center truncate w-full px-1 mt-0.5" title="${st?.name||''}">
                        ${st ? st.name.split(' ').pop() : '—'}
                    </div>
                    ${st?`<div class="text-[9px] text-gray-400 font-semibold leading-none mt-0.5 truncate w-full text-center px-1">${st.name.split(' ').slice(0,-1).join(' ')||''}</div>`:''}
                </div>`;

            html += `
            <div class="bg-white bg-opacity-10 rounded-2xl overflow-hidden border border-white border-opacity-10 shadow flex flex-col">
                <div class="flex gap-1 p-1.5">
                    ${seatBox(lSeat, lSt, lGood)}
                    <div class="w-px bg-white bg-opacity-20 self-stretch mx-0.5"></div>
                    ${seatBox(rSeat, rSt, rGood)}
                </div>
                <div class="text-center text-[9px] font-bold text-white text-opacity-30 pb-1 leading-none">Bàn ${row+1}</div>
            </div>`;
        }
    }
    html += '</div>';
    grid.innerHTML = html;
}

// ── Export Excel ────────────────────────────────────────────
function exportSeatingExcel() {
    const cls = classes.find(c=>c.id===currentClassId);
    const stMap = {};
    students.filter(s=>s.classId===currentClassId).forEach(s=>{ stMap[s.id]=s; });

    // Header row: 4 pairs of [SBD, Họ tên] = 8 columns
    const headers = [
        'DÃY 1 – SBD', 'DÃY 1 – Họ tên', 'DÃY 2 – SBD', 'DÃY 2 – Họ tên',
        'DÃY 3 – SBD', 'DÃY 3 – Họ tên', 'DÃY 4 – SBD', 'DÃY 4 – Họ tên'
    ];
    const wsData = [headers];

    for (let row=0; row<6; row++) {
        // Each row: 2 seats per column = 8 values (seat+name for each of 4 cols × left seat)
        // We'll put left-seat row and right-seat row in the same Excel row for compactness
        // Actually: one desk = 2 lines in Excel
        const rowLeft  = []; // left seats of this bàn
        const rowRight = []; // right seats

        for (let col=0; col<4; col++) {
            const lSeat = col*12 + row*2 + _seatingStartNum;
            const rSeat = lSeat + 1;
            const lSt   = stMap[_seatingMap[lSeat]];
            const rSt   = stMap[_seatingMap[rSeat]];
            const lLabel = `${String(lSeat).padStart(2,'0')}${lSt?'-'+String(lSt.stt||'?').padStart(2,'0'):''}`;
            const rLabel = `${String(rSeat).padStart(2,'0')}${rSt?'-'+String(rSt.stt||'?').padStart(2,'0'):''}`;
            rowLeft.push(lLabel, lSt?.name||'');
            rowRight.push(rLabel, rSt?.name||'');
        }
        wsData.push([`Bàn ${row+1}`, ...Array(7).fill('')]);
        wsData.push(rowLeft);
        wsData.push(rowRight);
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = Array(8).fill({wch:18});
    const hStyle = {font:{bold:true,color:{rgb:'FFFFFF'}},fill:{fgColor:{rgb:'3730a3'}},alignment:{horizontal:'center'}};
    ['A','B','C','D','E','F','G','H'].forEach((c,i)=>{
        const ref=c+'1'; if(!ws[ref])ws[ref]={v:headers[i],t:'s'}; ws[ref].s=hStyle;
    });

    // Color good students in yellow
    for (let r=1; r<wsData.length; r++) {
        for (let c=0; c<8; c+=2) {
            const cellVal = wsData[r][c];
            // cellVal is now "SBD-STT" string, extract seat number from start
            const seatNum = typeof cellVal === 'string' ? parseInt(cellVal.split('-')[0]) : cellVal;
            if (!isNaN(seatNum) && seatNum > 0) {
                const sid = _seatingMap[seatNum];
                if (sid && _seatingGood.has(sid)) {
                    const ref = String.fromCharCode(65+c)+String(r+1);
                    const ref2= String.fromCharCode(65+c+1)+String(r+1);
                    const yStyle = {fill:{fgColor:{rgb:'FEF3C7'}},font:{bold:true}};
                    if(ws[ref])  ws[ref].s  = yStyle;
                    if(ws[ref2]) ws[ref2].s = yStyle;
                }
            }
        }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'So_do_cho_ngoi');
    XLSX.writeFile(wb, `SoDo_PhongThi_${cls?.name?.replace(/\s+/g,'_')||'Lop'}_${new Date().toLocaleDateString('vi-VN').replace(/\//g,'-')}.xlsx`);
    showToast('Đã xuất sơ đồ Excel!');
}

// ── Print ─────────────────────────────────────────────────
function printSeating() {
    const cls = classes.find(c=>c.id===currentClassId);
    const stMap = {};
    students.filter(s=>s.classId===currentClassId).forEach(s=>{ stMap[s.id]=s; });

    const deskRows = [];
    for (let row=0; row<6; row++) {
        const cols = [];
        for (let col=0; col<4; col++) {
            const lSeat = col*12 + row*2 + _seatingStartNum;
            const rSeat = lSeat + 1;
            const lSt = stMap[_seatingMap[lSeat]];
            const rSt = stMap[_seatingMap[rSeat]];
            const lGood = _seatingMap[lSeat] && _seatingGood.has(_seatingMap[lSeat]);
            const rGood = _seatingMap[rSeat] && _seatingGood.has(_seatingMap[rSeat]);
            cols.push(`
            <td style="border:1px solid #ccc;padding:4px 2px;min-width:100px">
                <div style="display:flex;gap:4px">
                    <div style="flex:1;text-align:center;background:${lGood?'#fef3c7':'#f9fafb'};border-radius:6px;padding:4px 2px;font-size:11px">
                        <b style="font-size:12px;color:#374151">${String(lSeat).padStart(2,'0')}${lSt?'-'+String(lSt.stt||'?').padStart(2,'0'):''}</b>${lGood?' ⭐':''}<br>
                        <span style="font-size:10px;color:#4b5563">${lSt?lSt.name:'—'}</span>
                    </div>
                    <div style="flex:1;text-align:center;background:${rGood?'#fef3c7':'#f9fafb'};border-radius:6px;padding:4px 2px;font-size:11px">
                        <b style="font-size:12px;color:#374151">${String(rSeat).padStart(2,'0')}${rSt?'-'+String(rSt.stt||'?').padStart(2,'0'):''}</b>${rGood?' ⭐':''}<br>
                        <span style="font-size:10px;color:#4b5563">${rSt?rSt.name:'—'}</span>
                    </div>
                </div>
                <div style="text-align:center;font-size:9px;color:#9ca3af;margin-top:2px">Bàn ${row+1}</div>
            </td>`);
        }
        deskRows.push(`<tr>${cols.join('')}</tr>`);
    }

    const html = `
    <div style="font-family:sans-serif;font-size:12px;padding:8px">
        <h2 style="text-align:center;font-size:16px;margin:0 0 4px">SƠ ĐỒ PHÒNG THI – ${cls?.name||''}</h2>
        <p style="text-align:center;font-size:11px;color:#6b7280;margin:0 0 8px">SBD ${_seatingStartNum}–${_seatingStartNum+47} · In ngày ${new Date().toLocaleDateString('vi-VN')}</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:8px">
            <thead>
                <tr style="background:#312e81;color:white">
                    <td colspan="4" style="text-align:center;padding:8px;font-weight:bold;font-size:13px;border-radius:4px">🏛️ BAN GIÁM THỊ / GIÁO VIÊN COI THI</td>
                </tr>
                <tr style="background:#e0e7ff">
                    ${[1,2,3,4].map(d=>`<th style="text-align:center;padding:6px;border:1px solid #c7d2fe;font-size:12px">DÃY ${d}</th>`).join('')}
                </tr>
            </thead>
            <tbody>${deskRows.join('')}</tbody>
            <tfoot>
                <tr>
                    <td colspan="4" style="text-align:center;padding:6px;border:1px dashed #d1d5db;color:#9ca3af;font-size:11px">🚪 CỬA RA VÀO</td>
                </tr>
            </tfoot>
        </table>
        <p style="font-size:9px;color:#9ca3af;text-align:center">⭐ = Học sinh học tốt được xếp đầu phòng</p>
    </div>`;

    const printArea = document.getElementById('seatingPrintArea');
    printArea.innerHTML = html;
    window.print();
    setTimeout(()=>{ printArea.innerHTML=''; }, 2000);
}

