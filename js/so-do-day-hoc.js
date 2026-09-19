// ============================================================
// SƠ ĐỒ DẠY HỌC TÍCH CỰC (ACTIVE LEARNING SEATING)
// ============================================================

let _alSeatingGood = new Set();
let _alSeatingMap = {};
let currentLayout = 'cluster'; // cluster, ushape, station, herringbone
let _alDeskMap = []; // Maps layout desk position to physical student pair

function openActiveSeatingConfig(layout) {
    if (!currentClassId) { showToast('Chọn lớp trước!', false); return; }
    currentLayout = layout;
    
    // Đóng menu chọn loại sơ đồ nếu đang mở
    const menu = document.getElementById('seatingTypeMenu');
    if (menu) menu.classList.add('hidden');
    
    const cls = classes.find(c=>c.id===currentClassId);
    const cnt = students.filter(s=>s.classId===currentClassId).length;
    
    const layoutNames = {
        'cluster': 'Nhóm 4 (Cluster)',
        'ushape': 'Chữ U kép (Double U-Shape)',
        'station': 'Mô hình Trạm (Stations)',
        'herringbone': 'Xương cá (Herringbone)'
    };
    
    document.getElementById('alSeatingConfigSubtitle').innerText = `${cls?.name||''} · ${cnt} học sinh · ${layoutNames[layout]}`;
    _renderAlSeatingStudentList();
    _updateAlSeatingGoodCount();
    
    document.getElementById('alSeatingConfigBackdrop').classList.remove('hidden');
    setTimeout(()=>document.getElementById('alSeatingConfigModal').classList.remove('translate-y-full'), 10);
}

function closeActiveSeatingConfig() {
    document.getElementById('alSeatingConfigModal').classList.add('translate-y-full');
    setTimeout(()=>document.getElementById('alSeatingConfigBackdrop').classList.add('hidden'), 300);
}

function toggleSeatingTypeMenu() {
    const menu = document.getElementById('seatingTypeMenu');
    if (menu) {
        menu.classList.toggle('hidden');
    }
}

function _renderAlSeatingStudentList() {
    const list = document.getElementById('alSeatingStudentList');
    const clsStudents = students.filter(s=>s.classId===currentClassId).sort((a,b)=>a.stt-b.stt);
    list.innerHTML = clsStudents.map(s => {
        const good = _alSeatingGood.has(s.id);
        return `
        <div class="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
            <button onclick="toggleAlSeatingGood(${s.id})" id="alSeatingGoodBtn_${s.id}"
                class="w-9 h-9 rounded-xl flex items-center justify-center font-black text-base transition active:scale-90 flex-shrink-0 ${good?'bg-indigo-400 text-white shadow':'bg-gray-100 text-gray-300 hover:bg-gray-200'}">
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

function toggleAlSeatingGood(studentId) {
    if (_alSeatingGood.has(studentId)) _alSeatingGood.delete(studentId);
    else _alSeatingGood.add(studentId);
    const btn = document.getElementById(`alSeatingGoodBtn_${studentId}`);
    if (btn) {
        const good = _alSeatingGood.has(studentId);
        btn.className = `w-9 h-9 rounded-xl flex items-center justify-center font-black text-base transition active:scale-90 flex-shrink-0 ${good?'bg-indigo-400 text-white shadow':'bg-gray-100 text-gray-300 hover:bg-gray-200'}`;
    }
    _updateAlSeatingGoodCount();
}

function _updateAlSeatingGoodCount() {
    document.getElementById('alSeatingGoodCount').innerText = `⭐ ${_alSeatingGood.size} HS Khá/Giỏi`;
}

function _buildActiveSeating() {
    const clsStudents = students.filter(s=>s.classId===currentClassId);
    const good   = _shuffle(clsStudents.filter(s=>_alSeatingGood.has(s.id)));
    const others = _shuffle(clsStudents.filter(s=>!_alSeatingGood.has(s.id)));
    
    // Phương pháp rải đều (Mainstreaming): Xếp 1 HS Giỏi kèm 1-2 HS Yếu/Bình thường vào các nhóm
    let combined = [];
    let gIdx = 0, oIdx = 0;
    
    // Trộn ngẫu nhiên nhưng đảm bảo phân bố đều
    while (gIdx < good.length || oIdx < others.length) {
        if (oIdx < others.length) combined.push(others[oIdx++]);
        if (gIdx < good.length) combined.push(good[gIdx++]);
        if (oIdx < others.length) combined.push(others[oIdx++]);
        if (oIdx < others.length) combined.push(others[oIdx++]);
    }
    
    combined = combined.slice(0, 48);
    _alSeatingMap = {};
    combined.forEach((s, i) => { _alSeatingMap[i] = s.id; });
}

function generateActiveSeating() {
    _buildActiveSeating();
    closeActiveSeatingConfig();
    setTimeout(() => {
        const layoutNames = {
            'cluster': 'Nhóm 4 (Cluster)',
            'ushape': 'Chữ U kép (Double U)',
            'station': 'Mô hình Trạm (Stations)',
            'herringbone': 'Xương cá (Herringbone)'
        };
        const cls = classes.find(c=>c.id===currentClassId);
        document.getElementById('alSeatingResultTitle').innerText = `Sơ đồ ${layoutNames[currentLayout]}`;
        document.getElementById('alSeatingResultSub').innerText = `Lớp ${cls?.name||''} · Cố gắng bố trí Học sinh Giỏi (⭐) rải đều các nhóm`;
        document.getElementById('alSeatingResultOverlay').classList.remove('hidden');
        _renderActiveSeatingChart();
    }, 320);
}

function reshuffleActiveSeating() {
    _buildActiveSeating();
    _renderActiveSeatingChart();
    showToast('Đã xáo trộn lại vị trí!');
}

function closeActiveSeatingResult() {
    document.getElementById('alSeatingResultOverlay').classList.add('hidden');
}


function awardActiveSeatingGroup(groupLabel, ...deskIndexes) {
    let ids = [];
    deskIndexes.forEach(dIdx => {
        const s1 = _alSeatingMap[dIdx * 2];
        const s2 = _alSeatingMap[dIdx * 2 + 1];
        if (s1) ids.push(s1);
        if (s2) ids.push(s2);
    });
    if (ids.length === 0) {
        showToast('Nhóm không có học sinh nào!', false);
        return;
    }
    closeActiveSeatingResult();
    setTimeout(() => {
        openGroupModal(ids, groupLabel);
    }, 300);
}

function _seatHtml(seatIndex, stMap, showNumber = false) {
    const sid = _alSeatingMap[seatIndex];
    const st = sid ? stMap[sid] : null;
    const good = sid && _alSeatingGood.has(sid);
    
    return `
    <div class="flex flex-col items-center justify-center p-2 sm:p-3 ${good?'bg-indigo-50 border-indigo-200':'bg-white border-gray-200'} ${!st?'bg-gray-50 border-dashed':''} border rounded-lg shadow-sm h-full w-full relative transition">
        ${good?'<div class="absolute -top-2 -right-2 text-indigo-500 text-xs sm:text-sm bg-white rounded-full p-0.5 shadow-sm">⭐</div>':''}
        ${showNumber ? `<div class="absolute top-0.5 left-1 text-[10px] text-gray-400 font-bold">${seatIndex+1}</div>` : ''}
        <div class="text-xl sm:text-2xl font-bold ${st?'text-gray-800':'text-gray-300'} leading-tight text-center truncate w-full" title="${st?.name||''}">
            ${st ? st.name.split(' ').pop() : '—'}
        </div>
        ${st?`<div class="text-xs sm:text-sm text-gray-500 truncate w-full text-center mt-0.5">${st.name.split(' ').slice(0,-1).join(' ')||''}</div>`:''}
    </div>`;
}

function _deskHtml(deskIndex, stMap, showPointBtn = false) {
    // A desk has 2 seats (left and right)
    const s1 = deskIndex * 2;
    const s2 = deskIndex * 2 + 1;
    return `
    <div class="relative flex gap-1 bg-gray-100 p-2 sm:p-3 rounded-xl border border-gray-300 shadow-sm w-full h-full min-h-[90px]">
        ${showPointBtn ? `<button onclick="awardActiveSeatingGroup('Bàn ${deskIndex + 1}', ${deskIndex})" class="absolute -top-2 -right-2 bg-indigo-500 hover:bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow z-10 transition">Cộng</button>` : ''}
        ${_seatHtml(s1, stMap)}
        ${_seatHtml(s2, stMap)}
    </div>`;
}

function _renderActiveSeatingChart() {
    const grid = document.getElementById('alSeatingChartGrid');
    const stMap = {};
    students.filter(s=>s.classId===currentClassId).forEach(s=>{ stMap[s.id]=s; });
    
    let html = '';
    
    // --- 1. NHÓM 4 (CLUSTER) ---
    // 12 nhóm (mỗi nhóm 2 bàn đối diện nhau). Xếp thành grid 3 cột x 4 hàng.
    if (currentLayout === 'cluster') {
        html += `<div class="grid grid-cols-4 gap-6 max-w-[95vw] mx-auto">`;
        for (let group = 0; group < 12; group++) {
            const desk1 = group * 2;
            const desk2 = group * 2 + 1;
            html += `
            <div class="flex flex-col items-center gap-1 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                
                <div class="w-full flex justify-between items-center px-1 mb-1">
                    <div class="text-xs font-bold text-gray-400">Nhóm ${group + 1}</div>
                    <button onclick="awardActiveSeatingGroup('Nhóm ${group + 1}', ${desk1}, ${desk2})" class="text-[10px] bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold px-2 py-0.5 rounded-full transition">Cộng điểm</button>
                </div>

                <div class="w-full">${_deskHtml(desk1, stMap)}</div>
                <div class="w-full rotate-180">${_deskHtml(desk2, stMap)}</div>
            </div>`;
        }
        html += `</div>`;
    }
    
    // --- 2. TRẠM (STATIONS) ---
    // 6 trạm (mỗi trạm 4 bàn ghép thành hình vuông/chữ nhật lớn). Grid 2 cột x 3 hàng.
    else if (currentLayout === 'station') {
        html += `<div class="grid grid-cols-3 gap-8 max-w-[95vw] mx-auto">`;
        for (let station = 0; station < 6; station++) {
            const d1 = station*4, d2 = station*4+1, d3 = station*4+2, d4 = station*4+3;
            html += `
            <div class="bg-indigo-50 bg-opacity-30 p-4 rounded-3xl border border-indigo-100 relative shadow-sm">
                
                <div class="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
                    <div class="bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">Trạm ${station + 1}</div>
                    <button onclick="awardActiveSeatingGroup('Trạm ${station + 1}', ${d1}, ${d2}, ${d3}, ${d4})" class="bg-amber-400 hover:bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm transition">Cộng điểm</button>
                </div>

                <div class="grid grid-cols-2 gap-2 mt-2">
                    ${_deskHtml(d1, stMap)}
                    ${_deskHtml(d2, stMap)}
                    ${_deskHtml(d3, stMap)}
                    ${_deskHtml(d4, stMap)}
                </div>
            </div>`;
        }
        html += `</div>`;
    }
    
    // --- 3. XƯƠNG CÁ (HERRINGBONE) ---
    // Lối đi ở giữa. Hai bên xếp nghiêng. 12 bàn bên trái, 12 bàn bên phải.
    else if (currentLayout === 'herringbone') {
        html += `<div class="flex justify-center gap-12 max-w-[95vw] mx-auto pb-4 pt-2">`;
        
        // Cột trái (2 dãy, 6 hàng)
        html += `<div class="grid grid-cols-2 gap-x-12 gap-y-4 w-[500px]">`;
        for (let i = 0; i < 12; i++) {
            html += `<div style="transform: rotate(20deg); transform-origin: right center;" class="hover:scale-105 transition">${_deskHtml(i, stMap, true)}</div>`;
        }
        html += `</div>`;
        
        // Đường giữa
        html += `<div class="w-16 border-x-2 border-dashed border-gray-200 flex flex-col justify-center items-center opacity-50"><i class="fas fa-arrow-up text-gray-300 text-3xl mb-4"></i><div style="writing-mode: vertical-rl; text-orientation: mixed;" class="text-gray-400 font-bold tracking-widest uppercase">Lối đi chính</div></div>`;
        
        // Cột phải (2 dãy, 6 hàng)
        html += `<div class="grid grid-cols-2 gap-x-12 gap-y-4 w-[500px]">`;
        for (let i = 12; i < 24; i++) {
            html += `<div style="transform: rotate(-20deg); transform-origin: left center;" class="hover:scale-105 transition">${_deskHtml(i, stMap, true)}</div>`;
        }
        html += `</div>`;
        
        html += `</div>`;
    }
    
    // --- 4. CHỮ U KÉP (DOUBLE U-SHAPE) ---
    // U Ngoài (Outer): Trái 4, Phải 4, Dưới 6 = 14 bàn
    // U Trong (Inner): Trái 3, Phải 3, Dưới 4 = 10 bàn
    else if (currentLayout === 'ushape') {
        html += `
        <div class="relative w-full max-w-[95vw] mx-auto min-h-[70vh] flex flex-col items-center pt-8">
            <div class="bg-gray-800 text-white px-12 py-2 rounded-b-xl font-black tracking-widest shadow-lg absolute top-0 z-10">BỤC GIẢNG</div>
            
            <div class="flex-1 w-full flex justify-between px-4 mt-8 relative">
                
                <!-- OUTER U LEFT (4 desks) -->
                <div class="flex flex-col justify-between gap-4 w-72 h-[60vh]">
                    ${_deskHtml(0, stMap, true)} ${_deskHtml(1, stMap, true)} ${_deskHtml(2, stMap, true)} ${_deskHtml(3, stMap, true)}
                </div>
                
                <!-- INNER U LEFT (3 desks) -->
                <div class="flex flex-col justify-center gap-6 w-72 h-[60vh] absolute left-[22%]">
                    ${_deskHtml(14, stMap, true)} ${_deskHtml(15, stMap, true)} ${_deskHtml(16, stMap, true)}
                </div>
                
                <!-- INNER U RIGHT (3 desks) -->
                <div class="flex flex-col justify-center gap-6 w-72 h-[60vh] absolute right-[22%]">
                    ${_deskHtml(17, stMap, true)} ${_deskHtml(18, stMap, true)} ${_deskHtml(19, stMap, true)}
                </div>
                
                <!-- OUTER U RIGHT (4 desks) -->
                <div class="flex flex-col justify-between gap-4 w-72 h-[60vh]">
                    ${_deskHtml(4, stMap, true)} ${_deskHtml(5, stMap, true)} ${_deskHtml(6, stMap, true)} ${_deskHtml(7, stMap, true)}
                </div>
                
            </div>
            
            <!-- BOTTOM BAR -->
            <div class="w-full flex flex-col items-center gap-8 mt-12 pb-8">
                <!-- INNER U BOTTOM (4 desks) -->
                <div class="flex justify-center gap-8 w-full px-32">
                    <div class="w-72">${_deskHtml(20, stMap, true)}</div>
                    <div class="w-72">${_deskHtml(21, stMap, true)}</div>
                    <div class="w-72">${_deskHtml(22, stMap, true)}</div>
                    <div class="w-72">${_deskHtml(23, stMap, true)}</div>
                </div>
                
                <!-- OUTER U BOTTOM (6 desks) -->
                <div class="flex justify-between gap-4 w-full px-8">
                    <div class="w-72">${_deskHtml(8, stMap, true)}</div>
                    <div class="w-72">${_deskHtml(9, stMap, true)}</div>
                    <div class="w-72">${_deskHtml(10, stMap, true)}</div>
                    <div class="w-72">${_deskHtml(11, stMap, true)}</div>
                    <div class="w-72">${_deskHtml(12, stMap, true)}</div>
                    <div class="w-72">${_deskHtml(13, stMap, true)}</div>
                </div>
            </div>
            
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
                <i class="fas fa-users text-[15rem] text-indigo-500"></i>
            </div>
        </div>`;
    }
    
    grid.innerHTML = html;
}

// Hàm bổ trợ trộn mảng