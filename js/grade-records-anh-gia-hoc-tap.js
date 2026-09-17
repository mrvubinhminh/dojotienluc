// ============================================================
// GRADE RECORDS – ĐÁNH GIÁ HỌC TẬP
// ============================================================
const THPT_SUBJECTS = [
    'Toán','Ngữ văn','Tiếng Anh','Vật lí','Hóa học','Sinh học',
    'Lịch sử','Địa lí','GDCD','Tin học','Công nghệ','Thể dục','GDQPAN'
];

// ---- Helpers ----
function gradeColor(v) {
    if (v === null || v === undefined || v === '') return '';
    const n = parseFloat(v);
    if (isNaN(n)) return '';
    if (n < 5)  return '#fee2e2'; // red-100
    if (n >= 8) return '#dcfce7'; // green-100
    return '#fef9c3';             // yellow-100
}
function gradeText(v) {
    if (v === null || v === undefined || v === '') return '—';
    const n = parseFloat(v);
    if (isNaN(n)) return '—';
    if (n < 5)  return `${n} ⚠️`;
    if (n >= 8) return `${n} ⭐`;
    return String(n);
}

// ---- Period management ----
function openNewGradePeriodModal() {
    document.getElementById('newGradePeriodBackdrop').classList.remove('hidden');
    document.getElementById('newGradePeriodModal').classList.remove('hidden');
    document.getElementById('newGradePeriodName').focus();
}
function closeNewGradePeriodModal() {
    document.getElementById('newGradePeriodBackdrop').classList.add('hidden');
    document.getElementById('newGradePeriodModal').classList.add('hidden');
    document.getElementById('newGradePeriodName').value = '';
}
function createGradePeriod() {
    const name = document.getElementById('newGradePeriodName').value.trim();
    if (!name) return;
    const id = Date.now();
    gradeRecords.push({ id, classId: currentClassId, periodName: name, createdAt: new Date().toISOString(), studentGrades: [] });
    currentGradePeriodId = id;
    saveData(); closeNewGradePeriodModal(); renderGradeView();
    showToast(`Đã tạo đợt: ${name}`);
}
function deleteCurrentGradePeriod() {
    const rec = gradeRecords.find(r=>r.id===currentGradePeriodId); if(!rec) return;
    if (!confirm(`Xóa đợt "${rec.periodName}"?`)) return;
    gradeRecords = gradeRecords.filter(r=>r.id!==currentGradePeriodId);
    const remaining = gradeRecords.filter(r=>r.classId===currentClassId);
    currentGradePeriodId = remaining.length ? remaining[remaining.length-1].id : null;
    saveData(); renderGradeView(); showToast('Đã xóa đợt',false);
}

// ---- Download template ----
function downloadGradeTemplate() {
    const cls = classes.find(c=>c.id===currentClassId); if(!cls) return;
    const rec = gradeRecords.find(r=>r.id===currentGradePeriodId);
    const periodName = rec ? rec.periodName : 'Mẫu điểm';
    const classStudents = students.filter(s=>s.classId===currentClassId).sort((a,b)=>(a.stt||0)-(b.stt||0));

    const header = ['STT','Họ và tên', ...THPT_SUBJECTS];
    const wsData = [
        [`BẢNG ĐIỂM - LỚP ${cls.name.toUpperCase()} - ${periodName.toUpperCase()}`, ...Array(header.length-1).fill('')],
        [`Hướng dẫn: Điền điểm số (0-10) vào các ô tương ứng. Để trống nếu không có môn.`, ...Array(header.length-1).fill('')],
        [],
        header
    ];
    classStudents.forEach(s => {
        wsData.push([s.stt||'', s.name, ...Array(THPT_SUBJECTS.length).fill('')]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    // Style title
    ws['A1'].s = {font:{bold:true,color:{rgb:"FFFFFF"},sz:13,name:"Arial"},fill:{fgColor:{rgb:"33A3DC"}},alignment:{horizontal:"center"}};
    ws['A2'].s = {font:{italic:true,color:{rgb:"555555"},sz:10,name:"Arial"},fill:{fgColor:{rgb:"FFF3E0"}}};
    // Style header row (row 4)
    header.forEach((_,ci)=>{
        const cr=String.fromCharCode(65+ci)+'4';
        if(ws[cr]) ws[cr].s={font:{bold:true,color:{rgb:"FFFFFF"},name:"Arial"},fill:{fgColor:{rgb:"8BC34A"}},alignment:{horizontal:"center"},border:{bottom:{style:'medium',color:{rgb:"666666"}}}};
    });
    ws['!cols'] = [{wch:6},{wch:25},...Array(THPT_SUBJECTS.length).fill({wch:12})];
    ws['!merges'] = [{s:{r:0,c:0},e:{r:0,c:header.length-1}},{s:{r:1,c:0},e:{r:1,c:header.length-1}}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bang_diem');
    XLSX.writeFile(wb, `Mau_diem_${cls.name.replace(/\s+/g,'_')}_${periodName.replace(/\s+/g,'_')}.xlsx`);
    showToast('Đã tải file mẫu!');
}

// ---- Upload grades ----
function handleGradeUpload(e) {
    const rec = gradeRecords.find(r=>r.id===currentGradePeriodId);
    if (!rec) { alert('Chọn đợt đánh giá trước!'); e.target.value=''; return; }
    const f = e.target.files[0]; if(!f) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
        try {
            const wb = XLSX.read(new Uint8Array(ev.target.result), {type:'array'});
            const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header:1, defval:''});
            // Find header row (has STT + Họ và tên)
            let headerRow = -1, headerData = [];
            for (let i=0; i<rows.length; i++) {
                const r = rows[i].map(c=>String(c||'').trim());
                if (r.includes('Họ và tên') || r.includes('Họ tên')) { headerRow=i; headerData=r; break; }
            }
            if (headerRow < 0) { alert('Không tìm thấy dòng tiêu đề "Họ và tên". Vui lòng dùng file mẫu.'); e.target.value=''; return; }

            // Find subject column indices
            const subjectCols = {};
            THPT_SUBJECTS.forEach(sub => {
                const idx = headerData.findIndex(h=>h.includes(sub)||sub.includes(h.replace(/[()]/g,'')));
                if (idx >= 0) subjectCols[sub] = idx;
            });
            const nameCol = headerData.findIndex(h=>h.includes('tên')||h.includes('Tên'));
            const sttCol  = headerData.findIndex(h=>h==='STT'||h==='stt');

            const newGrades = [];
            for (let i=headerRow+1; i<rows.length; i++) {
                const row = rows[i]; if (!row || !row.length) continue;
                const name = String(row[nameCol]||'').trim(); if(!name) continue;
                const stt  = parseInt(row[sttCol])||0;
                // Match student by name or STT
                const student = students.find(s=>s.classId===currentClassId&&(s.name===name||(stt&&s.stt===stt)));
                const gradesObj = {};
                Object.entries(subjectCols).forEach(([sub,ci])=>{
                    const v = row[ci];
                    if (v!==''&&v!==null&&v!==undefined) {
                        const n = parseFloat(String(v).replace(',','.'));
                        if (!isNaN(n) && n>=0 && n<=10) gradesObj[sub] = Math.round(n*10)/10;
                    }
                });
                newGrades.push({ studentId: student?.id||null, name, stt, grades: gradesObj });
            }
            rec.studentGrades = newGrades;
            saveData(); renderGradeView();
            showToast(`Đã nhập điểm ${newGrades.length} học sinh!`);
        } catch(err) { console.error(err); alert('Lỗi đọc file. Vui lòng dùng file mẫu.'); }
    };
    reader.readAsArrayBuffer(f);
    e.target.value = '';
}

// ---- Render grade view ----
function renderGradeView() {
    const classPeriods = gradeRecords.filter(r=>r.classId===currentClassId);
    const hk1Recs = subjectGrades.filter(sg=>sg.classId===currentClassId&&sg.semester==='HK1'&&sg.rows&&sg.rows.length>0);
    const hk2Recs = subjectGrades.filter(sg=>sg.classId===currentClassId&&sg.semester==='HK2'&&sg.rows&&sg.rows.length>0);
    const hasHK1 = hk1Recs.length > 0;
    const hasHK2 = hk2Recs.length > 0;
    const hasAnyData = hasHK1 || hasHK2 || classPeriods.length;

    const tabsEl = document.getElementById('gradePeriodTabs');
    tabsEl.innerHTML = '';

    if (!hasAnyData) {
        tabsEl.innerHTML = '<p class="text-sm text-gray-400 italic py-2">Nhập điểm trong <b>Sổ điểm bộ môn</b> hoặc bấm "Đợt mới".</p>';
        document.getElementById('gradesEmpty').classList.remove('hidden');
        document.getElementById('gradesControls').classList.add('hidden');
        document.getElementById('gradesTableWrap').classList.add('hidden');
        currentGradePeriodId = null; _gradesHKMode = null;
        return;
    }

    // Auto-select default tab on first open
    if (_gradesHKMode === null && currentGradePeriodId === null) {
        if (hasHK1) _gradesHKMode = 'HK1';
        else if (hasHK2) _gradesHKMode = 'HK2';
        else if (classPeriods.length) currentGradePeriodId = classPeriods[classPeriods.length-1].id;
    }
    // Correct invalid HK selection
    if (_gradesHKMode === 'HK1' && !hasHK1) _gradesHKMode = hasHK2 ? 'HK2' : null;
    if (_gradesHKMode === 'HK2' && !hasHK2) _gradesHKMode = null;
    if (_gradesHKMode === 'CN' && !(hasHK1 && hasHK2)) _gradesHKMode = hasHK1 ? 'HK1' : hasHK2 ? 'HK2' : null;

    // HK tabs (from subjectGrades)
    ['HK1','HK2'].forEach(hk => {
        const hasData = hk === 'HK1' ? hasHK1 : hasHK2;
        if (!hasData) return;
        const isActive = _gradesHKMode === hk;
        const btn = document.createElement('button');
        btn.className = `flex-shrink-0 px-4 py-2 font-bold rounded-full text-sm transition ${isActive?'bg-violet-600 text-white shadow':'bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100'}`;
        btn.innerHTML = `<i class="fas fa-sync-alt mr-1 text-xs"></i>${hk}`;
        btn.onclick = () => { _gradesHKMode=hk; _gradesSubjectFilter=null; currentGradePeriodId=null; renderGradeView(); };
        tabsEl.appendChild(btn);
    });
    // Cả năm tab (khi có cả HK1 lẫn HK2)
    if (hasHK1 && hasHK2) {
        const isActiveCN = _gradesHKMode === 'CN';
        const btnCN = document.createElement('button');
        btnCN.className = `flex-shrink-0 px-4 py-2 font-bold rounded-full text-sm transition ${isActiveCN?'bg-amber-600 text-white shadow':'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'}`;
        btnCN.innerHTML = `<i class="fas fa-star mr-1 text-xs"></i>Cả năm`;
        btnCN.onclick = () => { _gradesHKMode='CN'; _gradesSubjectFilter=null; currentGradePeriodId=null; renderGradeView(); };
        tabsEl.appendChild(btnCN);
    }

    // Separator + period tabs (from gradeRecords)
    if (classPeriods.length) {
        if (hasHK1 || hasHK2) {
            const sep = document.createElement('span');
            sep.className = 'flex-shrink-0 self-center text-gray-300 px-1 font-bold';
            sep.textContent = '|';
            tabsEl.appendChild(sep);
        }
        classPeriods.forEach(r => {
            const isActive = _gradesHKMode === null && currentGradePeriodId === r.id;
            const btn = document.createElement('button');
            btn.className = `flex-shrink-0 px-4 py-2 font-bold rounded-full text-sm transition ${isActive?'bg-dojo-blue text-white shadow':'bg-white text-gray-600 border border-gray-200 hover:border-dojo-blue'}`;
            btn.innerText = r.periodName;
            btn.onclick = () => { _gradesHKMode=null; currentGradePeriodId=r.id; renderGradeView(); };
            tabsEl.appendChild(btn);
        });
    }

    // Ensure valid period selected in period mode
    if (_gradesHKMode === null && (!currentGradePeriodId || !classPeriods.find(r=>r.id===currentGradePeriodId))) {
        currentGradePeriodId = classPeriods.length ? classPeriods[classPeriods.length-1].id : null;
    }

    // Subject tabs (chỉ khi HK mode)
    const subTabsEl = document.getElementById('gradeSubjectTabs');
    subTabsEl.innerHTML = '';
    if (_gradesHKMode) {
        // For CN: subjects that appear in both HK1 and HK2; for HK1/HK2: subjects in that semester
        let hkSubRecs;
        if (_gradesHKMode === 'CN') {
            const sub1 = new Set(subjectGrades.filter(sg=>sg.classId===currentClassId&&sg.semester==='HK1'&&sg.rows&&sg.rows.length>0).map(sg=>sg.subject));
            const sub2 = new Set(subjectGrades.filter(sg=>sg.classId===currentClassId&&sg.semester==='HK2'&&sg.rows&&sg.rows.length>0).map(sg=>sg.subject));
            const commonSubs = [...sub1].filter(s=>sub2.has(s));
            hkSubRecs = commonSubs.map(s=>subjectGrades.find(sg=>sg.classId===currentClassId&&sg.semester==='HK1'&&sg.subject===s)).filter(Boolean);
        } else {
            hkSubRecs = subjectGrades.filter(sg=>sg.classId===currentClassId&&sg.semester===_gradesHKMode&&sg.rows&&sg.rows.length>0);
        }
        if (hkSubRecs.length > 0) {
            subTabsEl.classList.remove('hidden');
            // Tab "Tổng hợp"
            const allBtn = document.createElement('button');
            allBtn.className = `flex-shrink-0 px-3 py-1 font-bold rounded-full text-xs transition ${_gradesSubjectFilter===null?'bg-gray-700 text-white shadow':'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'}`;
            allBtn.textContent = 'Tổng hợp';
            allBtn.onclick = () => { _gradesSubjectFilter=null; renderGradeView(); };
            subTabsEl.appendChild(allBtn);
            hkSubRecs.forEach(rec => {
                const isActive = _gradesSubjectFilter === rec.subject;
                const btn = document.createElement('button');
                btn.className = `flex-shrink-0 px-3 py-1 font-bold rounded-full text-xs transition ${isActive?'bg-indigo-600 text-white shadow':'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'}`;
                btn.innerHTML = `<i class="fas fa-table mr-1 text-[10px]"></i>${rec.subject}`;
                btn.onclick = () => { _gradesSubjectFilter=rec.subject; renderGradeView(); };
                subTabsEl.appendChild(btn);
            });
        } else {
            subTabsEl.classList.add('hidden');
        }
    } else {
        subTabsEl.classList.add('hidden');
        _gradesSubjectFilter = null;
    }

    // Show/hide controls depending on mode
    const ctrlEl = document.getElementById('gradesControls');
    ctrlEl.classList.remove('hidden');
    const importBtns = ctrlEl.querySelector('.grade-import-btns');
    const hkInfo = document.getElementById('gradeHKInfo');
    const btnCompare = document.getElementById('btnGradeCompare');
    const btnDelete = document.getElementById('btnGradeDelete');
    const isHKMode = _gradesHKMode !== null;
    if (importBtns) importBtns.classList.toggle('hidden', isHKMode);
    if (hkInfo) { hkInfo.classList.toggle('hidden', !isHKMode); hkInfo.classList.toggle('flex', isHKMode); }
    if (btnCompare) btnCompare.classList.toggle('hidden', isHKMode);
    if (btnDelete) btnDelete.classList.toggle('hidden', isHKMode);

    document.getElementById('gradesEmpty').classList.add('hidden');

    if (isHKMode) {
        if (_gradesHKMode === 'CN') {
            if (_gradesSubjectFilter) renderGradeTableCN(_gradesSubjectFilter);
            else renderGradeTableFromSG_CN();
        } else {
            if (_gradesSubjectFilter) renderGradeTableSubject(_gradesHKMode, _gradesSubjectFilter);
            else renderGradeTableFromSG(_gradesHKMode);
        }
    } else {
        renderGradeTable();
    }
}

function renderGradeTableSubject(hk, subject) {
    // Hiện sổ điểm đầy đủ (TX/GK/CK/ĐTB) cho một môn cụ thể
    const rec = subjectGrades.find(sg=>sg.classId===currentClassId&&sg.semester===hk&&sg.subject===subject);
    const wrap = document.getElementById('gradesTableWrap');
    const table = document.getElementById('gradesTable');
    if (!rec || !rec.rows || !rec.rows.length) {
        wrap.classList.add('hidden');
        const empty = document.getElementById('gradesEmpty');
        empty.classList.remove('hidden');
        empty.innerHTML = `<i class="fas fa-table text-5xl mb-4 opacity-30"></i><p class="font-semibold">Chưa có điểm ${subject} – ${hk}</p><p class="text-sm mt-1">Mở <b>Sổ điểm bộ môn</b> → chọn <b>${subject}</b> + <b>${hk}</b> để nhập</p>`;
        return;
    }
    document.getElementById('gradesEmpty').classList.add('hidden');
    wrap.classList.remove('hidden');
    const txCount = rec.txCount || 1;
    const txHeaders = Array.from({length:txCount},(_,i)=>`TX${i+1}`);
    const safeHK = hk.replace(/'/g,"\\'"), safeSub = subject.replace(/'/g,"\\'");
    let html = `<thead><tr>
        <th class="sticky left-0 bg-indigo-700 text-white px-3 py-2 text-left font-bold z-10">#</th>
        <th class="sticky left-8 bg-indigo-700 text-white px-3 py-2 text-left font-bold z-10 min-w-[120px] whitespace-nowrap">Họ và tên</th>
        ${txHeaders.map(h=>`<th class="bg-indigo-600 text-white px-3 py-2 text-center font-bold whitespace-nowrap text-xs">${h}<br><span class="opacity-70 text-[10px]">hs1</span></th>`).join('')}
        <th class="bg-violet-700 text-white px-3 py-2 text-center font-bold whitespace-nowrap text-xs">GK<br><span class="opacity-70 text-[10px]">hs2</span></th>
        <th class="bg-orange-600 text-white px-3 py-2 text-center font-bold whitespace-nowrap text-xs">CK<br><span class="opacity-70 text-[10px]">hs3</span></th>
        <th class="bg-emerald-700 text-white px-3 py-2 text-center font-bold whitespace-nowrap">ĐTB</th>
        <th class="bg-teal-700 text-white px-3 py-2 text-left font-bold whitespace-nowrap min-w-[180px]">
            Nhận xét
            <button onclick="sgAutoNhanXet('${safeHK}','${safeSub}')" class="ml-1 px-1.5 py-0.5 bg-white bg-opacity-20 rounded text-[10px] font-semibold hover:bg-opacity-30 transition">✨ Tự động</button>
        </th>
    </tr></thead><tbody>`;
    const sorted = [...rec.rows].sort((a,b)=>(a.stt||999)-(b.stt||999));
    sorted.forEach((row,i)=>{
        const dtbV = typeof row.dtb==='object'?row.dtb?.val:row.dtb;
        const dtbDisplay = dtbV!==undefined&&dtbV!==''?dtbV:'—';
        const dtbColor = dtbV!==undefined&&dtbV!==''?(dtbV>=8?'text-green-700':dtbV<5?'text-red-600':'text-yellow-700'):'text-gray-300';
        const partial = typeof row.dtb==='object'&&row.dtb?.partial;
        const rowBg = i%2===0?'#ffffff':'#eef2ff';
        const sid = row.studentId||'';
        const sname = (row.name||'').replace(/'/g,"\\'");
        const nx = (row.nhanXet||'').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        html += `<tr style="background:${rowBg}">
            <td class="sticky left-0 px-3 py-2 text-gray-500 font-bold z-10 border-b border-gray-100 text-center" style="background:${rowBg}">${row.stt||i+1}</td>
            <td class="sticky left-8 px-3 py-2 font-bold text-gray-800 z-10 border-b border-gray-100 whitespace-nowrap" style="background:${rowBg}">${row.name}</td>
            ${Array.from({length:txCount},(_,ti)=>{
                const v=row.tx&&row.tx[ti]!==undefined&&row.tx[ti]!==''?row.tx[ti]:'';
                return `<td class="px-3 py-2 text-center border-b border-gray-100 font-semibold ${v!==''?(v<5?'text-red-500':v>=8?'text-green-600':'text-gray-700'):'text-gray-300'}">${v!==''?v:'—'}</td>`;
            }).join('')}
            <td class="px-3 py-2 text-center border-b border-gray-100 font-semibold ${row.gk!==''&&row.gk!==undefined?(row.gk<5?'text-red-500':row.gk>=8?'text-green-600':'text-gray-700'):'text-gray-300'}">${row.gk!==''&&row.gk!==undefined?row.gk:'—'}</td>
            <td class="px-3 py-2 text-center border-b border-gray-100 font-semibold ${row.ck!==''&&row.ck!==undefined?(row.ck<5?'text-red-500':row.ck>=8?'text-green-600':'text-gray-700'):'text-gray-300'}">${row.ck!==''&&row.ck!==undefined?row.ck:'—'}</td>
            <td class="px-3 py-2 text-center border-b border-gray-100 font-black ${dtbColor}">${dtbDisplay}${partial?'<span class="text-[9px] text-gray-400 ml-0.5">*</span>':''}</td>
            <td class="px-2 py-1 border-b border-gray-100"><textarea rows="2" class="w-full text-xs border border-gray-200 rounded-lg px-2 py-1 resize-none focus:outline-none focus:border-teal-400" placeholder="Nhận xét..." onchange="sgSaveNhanXet('${safeHK}','${safeSub}','${sid}','${sname}',this.value)">${nx}</textarea></td>
        </tr>`;
    });
    html += '</tbody>';
    table.innerHTML = html;
}

function renderGradeTableFromSG(hk) {
    const hkRecs = subjectGrades.filter(sg=>sg.classId===currentClassId&&sg.semester===hk&&sg.rows&&sg.rows.length>0);
    const wrap = document.getElementById('gradesTableWrap');
    const table = document.getElementById('gradesTable');
    if (!hkRecs.length) {
        wrap.classList.add('hidden');
        const empty = document.getElementById('gradesEmpty');
        empty.classList.remove('hidden');
        empty.innerHTML = `<i class="fas fa-book-open text-5xl mb-4 opacity-30"></i><p class="font-semibold">Chưa có điểm ${hk}</p><p class="text-sm mt-1">Vào <b>Sổ điểm bộ môn</b> → chọn môn + ${hk} → nhập điểm TX/GK/CK</p>`;
        return;
    }
    document.getElementById('gradesEmpty').classList.add('hidden');
    wrap.classList.remove('hidden');
    const subjects = hkRecs.map(r=>r.subject);
    // Build student→grades map
    const clsStudents = students.filter(s=>s.classId===currentClassId).sort((a,b)=>(a.stt||999)-(b.stt||999));
    const rowMap = {};
    clsStudents.forEach(s=>{ rowMap[s.id] = { stt:s.stt, name:s.name, grades:{} }; });
    hkRecs.forEach(rec=>{
        rec.rows.forEach(row=>{
            const entry = row.studentId&&rowMap[row.studentId] ? rowMap[row.studentId]
                : Object.values(rowMap).find(e=>e.name===row.name);
            if (!entry) return;
            if (row.dtb!==undefined&&row.dtb!=='') entry.grades[rec.subject]=row.dtb;
        });
    });
    const rows = Object.values(rowMap).sort((a,b)=>(a.stt||999)-(b.stt||999));
    let html = `<thead><tr>
        <th class="sticky left-0 bg-violet-700 text-white px-3 py-2 text-left font-bold z-10">#</th>
        <th class="sticky left-8 bg-violet-700 text-white px-3 py-2 text-left font-bold z-10 min-w-[120px] whitespace-nowrap">Họ và tên</th>
        ${subjects.map(s=>`<th class="bg-violet-700 text-white px-3 py-2 text-center font-bold whitespace-nowrap">${s}</th>`).join('')}
        <th class="bg-violet-600 text-white px-3 py-2 text-center font-bold whitespace-nowrap">TB</th>
    </tr></thead><tbody>`;
    rows.forEach((row,i)=>{
        const nums=subjects.map(sub=>row.grades[sub]).filter(v=>v!==undefined&&v!=='').map(v=>parseFloat(v));
        const avg=nums.length?Math.round(nums.reduce((a,b)=>a+b,0)/nums.length*10)/10:null;
        const rowBg=i%2===0?'#ffffff':'#f5f3ff';
        html+=`<tr style="background:${rowBg}">
            <td class="sticky left-0 px-3 py-2 text-gray-500 font-bold z-10 border-b border-gray-100 text-center" style="background:${rowBg}">${row.stt||i+1}</td>
            <td class="sticky left-8 px-3 py-2 font-bold text-gray-800 z-10 border-b border-gray-100 whitespace-nowrap" style="background:${rowBg}">${row.name}</td>
            ${subjects.map(sub=>{const v=row.grades[sub];return`<td class="px-3 py-2 text-center font-bold border-b border-gray-100 whitespace-nowrap" style="background:${gradeColor(v)}">${gradeText(v)}</td>`;}).join('')}
            <td class="px-3 py-2 text-center font-bold border-b border-gray-100 ${avg===null?'text-gray-400':avg>=8?'text-green-700':avg<5?'text-red-600':'text-yellow-700'}">${avg!==null?avg:'—'}</td>
        </tr>`;
    });
    html+='</tbody>';
    table.innerHTML=html;
}

// ---- Cả năm: tổng hợp tất cả môn ----
function renderGradeTableFromSG_CN() {
    const wrap = document.getElementById('gradesTableWrap');
    const table = document.getElementById('gradesTable');
    const hk1Recs = subjectGrades.filter(sg=>sg.classId===currentClassId&&sg.semester==='HK1'&&sg.rows&&sg.rows.length>0);
    const hk2Recs = subjectGrades.filter(sg=>sg.classId===currentClassId&&sg.semester==='HK2'&&sg.rows&&sg.rows.length>0);
    const sub1Set = new Set(hk1Recs.map(sg=>sg.subject));
    const sub2Set = new Set(hk2Recs.map(sg=>sg.subject));
    const subjects = [...sub1Set].filter(s=>sub2Set.has(s));
    if (!subjects.length) {
        wrap.classList.add('hidden');
        const empty = document.getElementById('gradesEmpty');
        empty.classList.remove('hidden');
        empty.innerHTML = `<i class="fas fa-star text-5xl mb-4 opacity-30"></i><p class="font-semibold">Chưa đủ dữ liệu cả năm</p><p class="text-sm mt-1">Cần nhập điểm cho cả HK1 và HK2 trong <b>Sổ điểm bộ môn</b></p>`;
        return;
    }
    document.getElementById('gradesEmpty').classList.add('hidden');
    wrap.classList.remove('hidden');
    const clsStudents = students.filter(s=>s.classId===currentClassId).sort((a,b)=>(a.stt||999)-(b.stt||999));
    const rowMap = {};
    clsStudents.forEach(s=>{ rowMap[s.id]={ stt:s.stt, name:s.name, hk1:{}, hk2:{} }; });
    const fillMap = (recs, key) => recs.forEach(rec=>rec.rows.forEach(row=>{
        const entry=row.studentId&&rowMap[row.studentId]?rowMap[row.studentId]:Object.values(rowMap).find(e=>e.name===row.name);
        if (!entry) return;
        const v = typeof row.dtb==='object'?row.dtb?.val:row.dtb;
        if (v!==undefined&&v!=='') entry[key][rec.subject]=v;
    }));
    fillMap(hk1Recs,'hk1'); fillMap(hk2Recs,'hk2');
    const rows = Object.values(rowMap).sort((a,b)=>(a.stt||999)-(b.stt||999));
    let html = `<thead><tr>
        <th class="sticky left-0 bg-amber-700 text-white px-3 py-2 text-left font-bold z-10">#</th>
        <th class="sticky left-8 bg-amber-700 text-white px-3 py-2 text-left font-bold z-10 min-w-[120px] whitespace-nowrap">Họ và tên</th>
        ${subjects.map(s=>`<th class="bg-amber-600 text-white px-3 py-2 text-center font-bold whitespace-nowrap text-xs" colspan="3">${s}</th>`).join('')}
        <th class="bg-amber-800 text-white px-3 py-2 text-center font-bold whitespace-nowrap">TB CN</th>
    </tr><tr>
        <th class="bg-amber-700 text-white px-2 py-1"></th><th class="bg-amber-700 text-white px-2 py-1"></th>
        ${subjects.map(()=>`<th class="bg-amber-500 text-white px-2 py-1 text-[10px] text-center font-bold">HK1</th><th class="bg-amber-500 text-white px-2 py-1 text-[10px] text-center font-bold">HK2</th><th class="bg-amber-600 text-white px-2 py-1 text-[10px] text-center font-bold">CN</th>`).join('')}
        <th class="bg-amber-800 text-white px-2 py-1"></th>
    </tr></thead><tbody>`;
    rows.forEach((row,i)=>{
        const rowBg=i%2===0?'#ffffff':'#fffbeb';
        let cnNums=[];
        const subCells = subjects.map(sub=>{
            const v1=row.hk1[sub], v2=row.hk2[sub];
            const v1n=v1!==undefined?parseFloat(v1):null, v2n=v2!==undefined?parseFloat(v2):null;
            let cn=null;
            if (v1n!==null&&v2n!==null) { cn=Math.round((v1n+v2n)/2*10)/10; cnNums.push(cn); }
            else if (v1n!==null) { cnNums.push(v1n); }
            else if (v2n!==null) { cnNums.push(v2n); }
            const tc=(v)=>v!==null?(v>=8?'text-green-700':v<5?'text-red-600':'text-yellow-700'):'text-gray-300';
            return `<td class="px-2 py-2 text-center border-b border-gray-100 font-semibold text-xs ${tc(v1n)}">${v1n!==null?v1n:'—'}</td><td class="px-2 py-2 text-center border-b border-gray-100 font-semibold text-xs ${tc(v2n)}">${v2n!==null?v2n:'—'}</td><td class="px-2 py-2 text-center border-b border-gray-100 font-bold text-xs ${tc(cn)}">${cn!==null?cn:'—'}</td>`;
        }).join('');
        const avg=cnNums.length?Math.round(cnNums.reduce((a,b)=>a+b,0)/cnNums.length*10)/10:null;
        html+=`<tr style="background:${rowBg}">
            <td class="sticky left-0 px-3 py-2 text-gray-500 font-bold z-10 border-b border-gray-100 text-center" style="background:${rowBg}">${row.stt||i+1}</td>
            <td class="sticky left-8 px-3 py-2 font-bold text-gray-800 z-10 border-b border-gray-100 whitespace-nowrap" style="background:${rowBg}">${row.name}</td>
            ${subCells}
            <td class="px-3 py-2 text-center border-b border-gray-100 font-black ${avg===null?'text-gray-300':avg>=8?'text-green-700':avg<5?'text-red-600':'text-yellow-700'}">${avg!==null?avg:'—'}</td>
        </tr>`;
    });
    html+='</tbody>';
    table.innerHTML=html;
}

// ---- Cả năm: chi tiết 1 môn ----
function renderGradeTableCN(subject) {
    const wrap = document.getElementById('gradesTableWrap');
    const table = document.getElementById('gradesTable');
    const rec1 = subjectGrades.find(sg=>sg.classId===currentClassId&&sg.semester==='HK1'&&sg.subject===subject);
    const rec2 = subjectGrades.find(sg=>sg.classId===currentClassId&&sg.semester==='HK2'&&sg.subject===subject);
    if (!rec1 && !rec2) {
        wrap.classList.add('hidden');
        const empty = document.getElementById('gradesEmpty');
        empty.classList.remove('hidden');
        empty.innerHTML = `<i class="fas fa-book-open text-5xl mb-4 opacity-30"></i><p class="font-semibold">Chưa có điểm ${subject} cả năm</p>`;
        return;
    }
    document.getElementById('gradesEmpty').classList.add('hidden');
    wrap.classList.remove('hidden');
    const rows1 = rec1?.rows || [], rows2 = rec2?.rows || [];
    const clsStudents = students.filter(s=>s.classId===currentClassId).sort((a,b)=>(a.stt||999)-(b.stt||999));
    const safeSub = subject.replace(/'/g,"\\'");
    const buildMap = (rows) => {
        const m={};
        rows.forEach(r=>{ const key=r.studentId||r.name; m[key]=r; });
        return m;
    };
    const map1=buildMap(rows1), map2=buildMap(rows2);
    const getDTB = (row) => { if(!row) return null; const v=typeof row.dtb==='object'?row.dtb?.val:row.dtb; return (v!==undefined&&v!=='')?parseFloat(v):null; };
    const tc = (v) => v!==null?(v>=8?'text-green-700':v<5?'text-red-600':'text-yellow-700'):'text-gray-300';

    let html = `<thead><tr>
        <th class="sticky left-0 bg-amber-700 text-white px-3 py-2 text-left font-bold z-10">#</th>
        <th class="sticky left-8 bg-amber-700 text-white px-3 py-2 text-left font-bold z-10 min-w-[120px] whitespace-nowrap">Họ và tên</th>
        <th class="bg-violet-600 text-white px-3 py-2 text-center font-bold">ĐTB HK1</th>
        <th class="bg-teal-600 text-white px-3 py-2 text-center font-bold min-w-[170px]">
            NX HK1 <button onclick="sgAutoNhanXet('HK1','${safeSub}')" class="ml-1 px-1 py-0.5 bg-white bg-opacity-20 rounded text-[10px] hover:bg-opacity-30">✨</button>
        </th>
        <th class="bg-violet-700 text-white px-3 py-2 text-center font-bold">ĐTB HK2</th>
        <th class="bg-teal-700 text-white px-3 py-2 text-center font-bold min-w-[170px]">
            NX HK2 <button onclick="sgAutoNhanXet('HK2','${safeSub}')" class="ml-1 px-1 py-0.5 bg-white bg-opacity-20 rounded text-[10px] hover:bg-opacity-30">✨</button>
        </th>
        <th class="bg-amber-600 text-white px-3 py-2 text-center font-bold">TB Cả năm</th>
        <th class="bg-amber-800 text-white px-3 py-2 text-center font-bold min-w-[170px]">
            NX Cả năm <button onclick="sgAutoNhanXetCN('${safeSub}')" class="ml-1 px-1 py-0.5 bg-white bg-opacity-20 rounded text-[10px] hover:bg-opacity-30">✨</button>
        </th>
    </tr></thead><tbody>`;

    clsStudents.forEach((stu,i)=>{
        const r1=map1[stu.id]||map1[stu.name], r2=map2[stu.id]||map2[stu.name];
        const d1=getDTB(r1), d2=getDTB(r2);
        const cn=(d1!==null&&d2!==null)?Math.round((d1+d2)/2*10)/10:(d1!==null?d1:d2);
        const nx1=(r1?.nhanXet||'').replace(/</g,'&lt;');
        const nx2=(r2?.nhanXet||'').replace(/</g,'&lt;');
        const nxCN=(r1?.nhanXetCN||'').replace(/</g,'&lt;');
        const sid=stu.id||'', sname=stu.name.replace(/'/g,"\\'");
        const rowBg=i%2===0?'#ffffff':'#fffbeb';
        html+=`<tr style="background:${rowBg}">
            <td class="sticky left-0 px-3 py-2 text-gray-500 font-bold z-10 border-b border-gray-100 text-center" style="background:${rowBg}">${stu.stt||i+1}</td>
            <td class="sticky left-8 px-3 py-2 font-bold text-gray-800 z-10 border-b border-gray-100 whitespace-nowrap" style="background:${rowBg}">${stu.name}</td>
            <td class="px-3 py-2 text-center border-b border-gray-100 font-black ${tc(d1)}">${d1!==null?d1:'—'}</td>
            <td class="px-2 py-1 border-b border-gray-100"><textarea rows="2" class="w-full text-xs border border-gray-200 rounded-lg px-2 py-1 resize-none focus:outline-none focus:border-violet-400" placeholder="Nhận xét HK1..." onchange="sgSaveNhanXet('HK1','${safeSub}','${sid}','${sname}',this.value)">${nx1}</textarea></td>
            <td class="px-3 py-2 text-center border-b border-gray-100 font-black ${tc(d2)}">${d2!==null?d2:'—'}</td>
            <td class="px-2 py-1 border-b border-gray-100"><textarea rows="2" class="w-full text-xs border border-gray-200 rounded-lg px-2 py-1 resize-none focus:outline-none focus:border-violet-400" placeholder="Nhận xét HK2..." onchange="sgSaveNhanXet('HK2','${safeSub}','${sid}','${sname}',this.value)">${nx2}</textarea></td>
            <td class="px-3 py-2 text-center border-b border-gray-100 font-black ${tc(cn)}">${cn!==null?cn:'—'}</td>
            <td class="px-2 py-1 border-b border-gray-100"><textarea rows="2" class="w-full text-xs border border-gray-200 rounded-lg px-2 py-1 resize-none focus:outline-none focus:border-amber-400" placeholder="Nhận xét cả năm..." onchange="sgSaveNhanXetCN('${safeSub}','${sid}','${sname}',this.value)">${nxCN}</textarea></td>
        </tr>`;
    });
    html+='</tbody>';
    table.innerHTML=html;
}

// ---- Export HK summary from subjectGrades ----
function _exportGradeSummaryHK(hk) {
    const cls = classes.find(c=>c.id===currentClassId);
    const hkLabel = hk === 'CN' ? 'Cả năm' : hk;
    const wb = XLSX.utils.book_new();

    if (hk === 'CN') {
        // Cả năm: one sheet with all subjects HK1+HK2+CN avg
        const hk1Recs = subjectGrades.filter(sg=>sg.classId===currentClassId&&sg.semester==='HK1'&&sg.rows&&sg.rows.length>0);
        const hk2Recs = subjectGrades.filter(sg=>sg.classId===currentClassId&&sg.semester==='HK2'&&sg.rows&&sg.rows.length>0);
        const sub1 = new Set(hk1Recs.map(r=>r.subject)), sub2 = new Set(hk2Recs.map(r=>r.subject));
        const subjects = [...sub1].filter(s=>sub2.has(s));
        if (!subjects.length) { showToast('Chưa đủ dữ liệu cả năm!', false); return; }
        const clsStu = students.filter(s=>s.classId===currentClassId).sort((a,b)=>(a.stt||999)-(b.stt||999));
        const rowMap = {};
        clsStu.forEach(s=>{ rowMap[s.id]={ stt:s.stt, name:s.name, hk1:{}, hk2:{}, nx:{} }; });
        hk1Recs.forEach(rec=>rec.rows.forEach(row=>{
            const e=row.studentId&&rowMap[row.studentId]?rowMap[row.studentId]:Object.values(rowMap).find(x=>x.name===row.name);
            if(!e)return; const v=typeof row.dtb==='object'?row.dtb?.val:row.dtb;
            if(v!==undefined&&v!==''){e.hk1[rec.subject]=parseFloat(v);} if(row.nhanXetCN) e.nx[rec.subject]=row.nhanXetCN;
        }));
        hk2Recs.forEach(rec=>rec.rows.forEach(row=>{
            const e=row.studentId&&rowMap[row.studentId]?rowMap[row.studentId]:Object.values(rowMap).find(x=>x.name===row.name);
            if(!e)return; const v=typeof row.dtb==='object'?row.dtb?.val:row.dtb;
            if(v!==undefined&&v!=='')e.hk2[rec.subject]=parseFloat(v);
        }));
        const subHdrCols = subjects.flatMap(s=>[`TB HK1 ${s}`,`TB HK2 ${s}`,`TB CN ${s}`]);
        const header = ['STT','Họ và tên',...subHdrCols,'TB Cả năm',...subjects.map(s=>`NX ${s}`)];
        const wsData = [
            [`BẢNG ĐIỂM CẢ NĂM - LỚP ${cls?.name?.toUpperCase()||''}`,...Array(header.length-1).fill('')],
            [`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`,...Array(header.length-1).fill('')],[],header
        ];
        Object.values(rowMap).sort((a,b)=>(a.stt||999)-(b.stt||999)).forEach((row,i)=>{
            const cnArr=subjects.map(s=>{
                const v1=row.hk1[s]??null, v2=row.hk2[s]??null;
                return(v1!==null&&v2!==null)?Math.round((v1+v2)/2*10)/10:(v1??v2);
            });
            const allCN=cnArr.filter(v=>v!==null).map(v=>parseFloat(v));
            const tbCN=allCN.length?Math.round(allCN.reduce((a,b)=>a+b,0)/allCN.length*10)/10:'';
            const subData=subjects.flatMap((s,si)=>[row.hk1[s]??'',row.hk2[s]??'',cnArr[si]??'']);
            const nxData=subjects.map(s=>row.nx[s]||'');
            wsData.push([row.stt||i+1, row.name, ...subData, tbCN, ...nxData]);
        });
        const ws=XLSX.utils.aoa_to_sheet(wsData);
        ws['!merges']=[{s:{r:0,c:0},e:{r:0,c:header.length-1}},{s:{r:1,c:0},e:{r:1,c:header.length-1}}];
        ws['!cols']=[{wch:6},{wch:25},...subHdrCols.map(()=>({wch:11})),{wch:11},...subjects.map(()=>({wch:40}))];
        XLSX.utils.book_append_sheet(wb, ws, 'Ca_nam');
        XLSX.writeFile(wb, `BangDiem_CaNam_${cls?.name?.replace(/\s+/g,'_')||'Lop'}.xlsx`);
        showToast('Đã xuất báo cáo cả năm!'); return;
    }

    // HK1 or HK2: one sheet per subject with TX/GK/CK/ĐTB/NX
    const hkRecs = subjectGrades.filter(sg=>sg.classId===currentClassId&&sg.semester===hk&&sg.rows&&sg.rows.length>0);
    if (!hkRecs.length) { showToast('Chưa có điểm '+hk+'!', false); return; }
    hkRecs.forEach(rec=>{
        const txCount = rec.txCount||1;
        const txHdrs = Array.from({length:txCount},(_,i)=>`TX${i+1}`);
        const header = ['STT','Họ và tên',...txHdrs,'GK','CK','ĐTB','Nhận xét'];
        const wsData=[
            [`BẢNG ĐIỂM ${rec.subject.toUpperCase()} - ${hk} - LỚP ${cls?.name?.toUpperCase()||''}`,...Array(header.length-1).fill('')],
            [`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`,...Array(header.length-1).fill('')],[],header
        ];
        const sorted=[...rec.rows].sort((a,b)=>(a.stt||999)-(b.stt||999));
        sorted.forEach((row,i)=>{
            const txVals=Array.from({length:txCount},(_,ti)=>row.tx&&row.tx[ti]!==undefined&&row.tx[ti]!==''?row.tx[ti]:'');
            const dtbV=_sgDTBVal(row); const nx=row.nhanXet||_autoCommentRow(row,rec.subject,hk);
            wsData.push([row.stt||i+1, row.name, ...txVals, row.gk!==''?row.gk:'', row.ck!==''?row.ck:'', dtbV!==null?dtbV:'', nx]);
        });
        const ws=XLSX.utils.aoa_to_sheet(wsData);
        ws['!merges']=[{s:{r:0,c:0},e:{r:0,c:header.length-1}},{s:{r:1,c:0},e:{r:1,c:header.length-1}}];
        ws['!cols']=[{wch:6},{wch:25},...Array(txCount).fill({wch:10}),{wch:10},{wch:10},{wch:10},{wch:50}];
        // Style header row
        for(let ci=0;ci<header.length;ci++){const a=XLSX.utils.encode_cell({r:3,c:ci});if(ws[a])ws[a].s={font:{bold:true,color:{rgb:'FFFFFF'}},fill:{fgColor:{rgb:'4F46E5'}},alignment:{horizontal:'center'}};}
        // Color DTB
        for(let ri=4;ri<wsData.length;ri++){const a=XLSX.utils.encode_cell({r:ri,c:2+txCount+2});if(!ws[a]||ws[a].v==='')continue;const v=parseFloat(ws[a].v);const rgb=v>=8?'16A34A':v>=6.5?'2563EB':v>=5?'D97706':'DC2626';ws[a].s={font:{bold:true,color:{rgb}},alignment:{horizontal:'center'}};}
        const shName = rec.subject.replace(/[^\w]/g,'_').slice(0,28)+'_'+hk;
        XLSX.utils.book_append_sheet(wb, ws, shName.slice(0,31));
    });
    XLSX.writeFile(wb, `BangDiem_${hk}_${cls?.name?.replace(/\s+/g,'_')||'Lop'}.xlsx`);
    showToast('Đã xuất báo cáo '+hk+'!');
}

// ---- Nhận xét: lưu & tự động ----
function sgSaveNhanXet(hk, subject, studentId, name, text) {
    const rec = subjectGrades.find(sg=>sg.classId===currentClassId&&sg.semester===hk&&sg.subject===subject);
    if (!rec) return;
    const row = rec.rows.find(r=>(studentId&&r.studentId===studentId)||r.name===name);
    if (!row) return;
    row.nhanXet = text;
    saveData();
}
function sgSaveNhanXetCN(subject, studentId, name, text) {
    const rec = subjectGrades.find(sg=>sg.classId===currentClassId&&sg.semester==='HK1'&&sg.subject===subject);
    if (!rec) return;
    const row = rec.rows.find(r=>(studentId&&r.studentId===studentId)||r.name===name);
    if (!row) return;
    row.nhanXetCN = text;
    saveData();
}
// Simple avg-only comment (used for CN)
function _autoComment(avg, subject, hk) {
    if (avg===null) return '';
    if (avg >= 9) return `Học sinh đạt loại Xuất sắc môn ${subject}${hk?' '+hk:''}, nắm vững kiến thức, kỹ năng tốt.`;
    if (avg >= 8) return `Học sinh đạt loại Giỏi môn ${subject}${hk?' '+hk:''}, có tiến bộ rõ rệt.`;
    if (avg >= 6.5) return `Học sinh đạt loại Khá môn ${subject}${hk?' '+hk:''}, cần phát huy thêm.`;
    if (avg >= 5) return `Học sinh đạt loại Trung bình môn ${subject}${hk?' '+hk:''}, cần cố gắng hơn.`;
    return `Học sinh chưa đạt yêu cầu môn ${subject}${hk?' '+hk:''}, cần tích cực ôn tập.`;
}
// Row-based comment that compares TX/GK/CK columns
function _autoCommentRow(row, subject, hk) {
    const dtbV = typeof row.dtb==='object'?row.dtb?.val:row.dtb;
    const avg = (dtbV!==undefined&&dtbV!=='')?parseFloat(dtbV):null;
    if (avg===null) return '';
    const txArr = (row.tx||[]).filter(v=>v!==''&&v!==undefined).map(v=>parseFloat(v));
    const txAvg = txArr.length ? txArr.reduce((a,b)=>a+b,0)/txArr.length : null;
    const gk = row.gk!==undefined&&row.gk!==''?parseFloat(row.gk):null;
    const ck = row.ck!==undefined&&row.ck!==''?parseFloat(row.ck):null;
    // Rating
    let rating;
    if (avg>=9) rating='đạt loại Xuất sắc';
    else if (avg>=8) rating='đạt loại Giỏi';
    else if (avg>=6.5) rating='đạt loại Khá';
    else if (avg>=5) rating='đạt loại Trung bình';
    else rating='chưa đạt yêu cầu';
    let parts = [`Học sinh ${rating} môn ${subject} ${hk} (ĐTB: ${avg})`];
    // Compare TX vs CK
    if (txAvg!==null && ck!==null) {
        const diff = ck - txAvg;
        if (diff >= 1.5) parts.push('có tiến bộ rõ nét trong kiểm tra cuối kỳ');
        else if (diff <= -1.5) parts.push('cần duy trì phong độ ổn định đến cuối kỳ');
        else if (Math.abs(diff) <= 0.5 && avg>=6.5) parts.push('điểm số ổn định đều qua các cột');
    }
    // Compare TX vs GK
    if (txAvg!==null && gk!==null) {
        if (gk - txAvg >= 1.5) parts.push('điểm GK vượt trội so với thường xuyên, cần duy trì');
        else if (txAvg - gk >= 1.5) parts.push('điểm GK chưa phản ánh đúng năng lực TX, cần ôn tập định kỳ');
    }
    // Weak spots
    const weak=[];
    if (gk!==null&&gk<5) weak.push(`GK (${gk})`);
    if (ck!==null&&ck<5) weak.push(`CK (${ck})`);
    if (txArr.some(v=>v<5)) weak.push(`TX`);
    if (weak.length) parts.push(`còn yếu ở ${weak.join(', ')}, cần ôn luyện thêm`);
    // Closing
    if (avg<5) parts.push('cần tích cực học tập để cải thiện kết quả');
    else if (avg>=8&&!weak.length) parts.push('cần phát huy và duy trì kết quả');
    return parts.join('; ')+'.';
}
function sgAutoNhanXet(hk, subject) {
    const rec = subjectGrades.find(sg=>sg.classId===currentClassId&&sg.semester===hk&&sg.subject===subject);
    if (!rec||!rec.rows) return;
    rec.rows.forEach(row=>{
        row.nhanXet = _autoCommentRow(row, subject, hk);
    });
    saveData();
    if (_gradesHKMode==='CN'&&_gradesSubjectFilter===subject) renderGradeTableCN(subject);
    else renderGradeTableSubject(hk, subject);
    showToast('Đã tự động nhận xét!');
}
function sgAutoNhanXetCN(subject) {
    const rec1 = subjectGrades.find(sg=>sg.classId===currentClassId&&sg.semester==='HK1'&&sg.subject===subject);
    const rec2 = subjectGrades.find(sg=>sg.classId===currentClassId&&sg.semester==='HK2'&&sg.subject===subject);
    if (!rec1) return;
    const map2={};
    (rec2?.rows||[]).forEach(r=>{ map2[r.studentId||r.name]=r; });
    rec1.rows.forEach(row=>{
        const d1=(()=>{const v=typeof row.dtb==='object'?row.dtb?.val:row.dtb; return(v!==undefined&&v!=='')?parseFloat(v):null;})();
        const r2=map2[row.studentId||row.name];
        const d2=(()=>{if(!r2)return null; const v=typeof r2.dtb==='object'?r2.dtb?.val:r2.dtb; return(v!==undefined&&v!=='')?parseFloat(v):null;})();
        const cn=(d1!==null&&d2!==null)?Math.round((d1+d2)/2*10)/10:(d1!==null?d1:d2);
        row.nhanXetCN = _autoComment(cn, subject, '');
    });
    saveData();
    renderGradeTableCN(subject);
    showToast('Đã tự động nhận xét cả năm!');
}

function renderGradeTable() {
    const rec = gradeRecords.find(r=>r.id===currentGradePeriodId);
    const wrap = document.getElementById('gradesTableWrap');
    const table = document.getElementById('gradesTable');
    if (!rec || !rec.studentGrades.length) {
        wrap.classList.add('hidden');
        document.getElementById('gradesEmpty').classList.remove('hidden');
        document.getElementById('gradesEmpty').innerHTML = `<i class="fas fa-file-upload text-5xl mb-4 opacity-30"></i><p class="font-semibold">Chưa có dữ liệu điểm</p><p class="text-sm mt-1">Bấm "Nhập điểm" để upload file Excel đã điền</p>`;
        return;
    }
    document.getElementById('gradesEmpty').classList.add('hidden');
    wrap.classList.remove('hidden');

    // Determine which subjects have data
    const usedSubjects = THPT_SUBJECTS.filter(sub => rec.studentGrades.some(sg=>sg.grades[sub]!==undefined));

    let html = `<thead><tr>
        <th class="sticky left-0 bg-gray-700 text-white px-3 py-2 text-left font-bold z-10 whitespace-nowrap">#</th>
        <th class="sticky left-8 bg-gray-700 text-white px-3 py-2 text-left font-bold z-10 whitespace-nowrap min-w-[120px]">Họ và tên</th>
        ${usedSubjects.map(s=>`<th class="bg-gray-700 text-white px-3 py-2 text-center font-bold whitespace-nowrap">${s}</th>`).join('')}
        <th class="bg-gray-600 text-white px-3 py-2 text-center font-bold whitespace-nowrap">TB</th>
        <th class="bg-gray-600 text-white px-3 py-2 text-center font-bold whitespace-nowrap">Nhận xét</th>
    </tr></thead><tbody>`;

    const sorted = [...rec.studentGrades].sort((a,b)=>(a.stt||999)-(b.stt||999));
    sorted.forEach((sg,i) => {
        const vals = usedSubjects.map(sub=>sg.grades[sub]);
        const nums = vals.filter(v=>v!==undefined).map(v=>parseFloat(v));
        const avg  = nums.length ? Math.round(nums.reduce((a,b)=>a+b,0)/nums.length*10)/10 : null;
        const below5 = usedSubjects.filter(sub=>sg.grades[sub]!==undefined && sg.grades[sub]<5);
        const above8 = usedSubjects.filter(sub=>sg.grades[sub]!==undefined && sg.grades[sub]>=8);
        let comment = '';
        if (below5.length) comment += `⚠️ Cần cố gắng: ${below5.join(', ')}. `;
        if (above8.length) comment += `⭐ Xuất sắc: ${above8.join(', ')}.`;
        if (!comment) comment = avg >= 8 ? '✨ Học lực tốt' : avg >= 5 ? '👍 Đạt yêu cầu' : '💪 Cần nỗ lực hơn';
        const rowBg = i%2===0?'#ffffff':'#f9fafb';
        html += `<tr style="background:${rowBg}">
            <td class="sticky left-0 px-3 py-2 text-gray-500 font-bold z-10 border-b border-gray-100 text-center" style="background:${rowBg}">${sg.stt||i+1}</td>
            <td class="sticky left-8 px-3 py-2 font-bold text-gray-800 z-10 border-b border-gray-100 whitespace-nowrap" style="background:${rowBg}">
                ${sg.name}
                <button onclick="showParentMessage(${JSON.stringify(sg.name).replace(/"/g,"'")})" class="ml-1 text-dojo-blue hover:text-blue-700" title="Tin nhắn PH"><i class="fas fa-paper-plane text-xs"></i></button>
            </td>
            ${usedSubjects.map(sub=>{
                const v=sg.grades[sub];
                const bg=gradeColor(v);
                return `<td class="px-3 py-2 text-center font-bold border-b border-gray-100 whitespace-nowrap" style="background:${bg}">${gradeText(v)}</td>`;
            }).join('')}
            <td class="px-3 py-2 text-center font-bold border-b border-gray-100 ${avg===null?'text-gray-400':avg>=8?'text-green-700':avg<5?'text-red-600':'text-yellow-700'}">${avg!==null?avg:'—'}</td>
            <td class="px-3 py-2 text-xs text-gray-600 border-b border-gray-100 whitespace-nowrap min-w-[160px]">${comment}</td>
        </tr>`;
    });
    html += '</tbody>';
    table.innerHTML = html;
}

// ---- Parent message ----
function showParentMessage(studentName) {
    const rec = gradeRecords.find(r=>r.id===currentGradePeriodId); if(!rec) return;
    const sg  = rec.studentGrades.find(s=>s.name===studentName); if(!sg) return;
    const cls = classes.find(c=>c.id===currentClassId);
    const usedSubjects = THPT_SUBJECTS.filter(sub=>sg.grades[sub]!==undefined);

    const below5 = usedSubjects.filter(sub=>sg.grades[sub]<5);
    const above8  = usedSubjects.filter(sub=>sg.grades[sub]>=8);
    const nums    = usedSubjects.map(sub=>sg.grades[sub]);
    const avg     = nums.length ? Math.round(nums.reduce((a,b)=>a+b,0)/nums.length*10)/10 : null;
    const dateStr = new Date(rec.createdAt).toLocaleDateString('vi-VN');

    let lines = [];
    lines.push(`Kính gửi Phụ huynh em ${sg.name}`);
    lines.push(`Lớp: ${cls?.name||''} | Đợt đánh giá: ${rec.periodName}`);
    lines.push('─'.repeat(35));
    lines.push('📚 KẾT QUẢ HỌC TẬP:');
    usedSubjects.forEach(sub => {
        const v = sg.grades[sub];
        let flag = v >= 8 ? ' ⭐' : v < 5 ? ' ⚠️' : '';
        lines.push(`  • ${sub}: ${v}${flag}`);
    });
    lines.push('─'.repeat(35));
    if (avg !== null) lines.push(`📊 Điểm trung bình: ${avg}`);
    if (above8.length)  lines.push(`⭐ Xuất sắc: ${above8.join(', ')}`);
    if (below5.length)  lines.push(`⚠️ Cần cố gắng: ${below5.join(', ')}`);
    lines.push('─'.repeat(35));
    if (!below5.length && avg >= 8) lines.push('🎉 Em có kết quả học tập rất tốt! Kính đề nghị gia đình tiếp tục động viên em phát huy.');
    else if (below5.length)          lines.push('💙 Kính đề nghị gia đình quan tâm, phối hợp cùng nhà trường để em cố gắng hơn ở các môn còn yếu.');
    else                              lines.push('👍 Em có kết quả học tập đạt yêu cầu. Kính đề nghị gia đình tiếp tục động viên em.');
    lines.push('');
    lines.push('Trân trọng,');
    lines.push('Giáo viên chủ nhiệm');

    document.getElementById('parentMsgTitle').innerText = `Tin nhắn phụ huynh: ${sg.name}`;
    document.getElementById('parentMsgText').value = lines.join('\n');
    document.getElementById('parentMsgBackdrop').classList.remove('hidden');
    document.getElementById('parentMsgModal').classList.remove('translate-y-full');
}
function closeParentMsg() {
    document.getElementById('parentMsgModal').classList.add('translate-y-full');
    setTimeout(()=>document.getElementById('parentMsgBackdrop').classList.add('hidden'),300);
}
function copyParentMsg() {
    const txt = document.getElementById('parentMsgText').value;
    navigator.clipboard?.writeText(txt).then(()=>showToast('Đã sao chép tin nhắn!')).catch(()=>{
        document.getElementById('parentMsgText').select();
        document.execCommand('copy');
        showToast('Đã sao chép tin nhắn!');
    });
}

// ---- Export grade summary Excel ----
function exportGradeSummary() {
    // HK mode: export subjectGrades summary
    if (_gradesHKMode && _gradesHKMode !== null) {
        _exportGradeSummaryHK(_gradesHKMode); return;
    }
    const rec = gradeRecords.find(r=>r.id===currentGradePeriodId); if(!rec) return;
    if (!rec.studentGrades.length) return alert('Chưa có dữ liệu điểm!');
    const cls = classes.find(c=>c.id===currentClassId);
    const usedSubjects = THPT_SUBJECTS.filter(sub=>rec.studentGrades.some(sg=>sg.grades[sub]!==undefined));
    const header = ['STT','Họ và tên',...usedSubjects,'Trung bình','Nhận xét'];
    const wsData = [
        [`BẢNG ĐIỂM - LỚP ${cls?.name?.toUpperCase()||''} - ${rec.periodName.toUpperCase()}`,...Array(header.length-1).fill('')],
        [`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`,...Array(header.length-1).fill('')],
        [],
        header
    ];
    const sorted = [...rec.studentGrades].sort((a,b)=>(a.stt||999)-(b.stt||999));
    sorted.forEach((sg,i)=>{
        const nums = usedSubjects.map(sub=>sg.grades[sub]).filter(v=>v!==undefined);
        const avg  = nums.length ? Math.round(nums.reduce((a,b)=>a+b,0)/nums.length*10)/10 : '';
        const below5 = usedSubjects.filter(sub=>sg.grades[sub]!==undefined&&sg.grades[sub]<5);
        const above8  = usedSubjects.filter(sub=>sg.grades[sub]!==undefined&&sg.grades[sub]>=8);
        let comment = '';
        if (below5.length) comment += `Cần cố gắng: ${below5.join(', ')}. `;
        if (above8.length)  comment += `Xuất sắc: ${above8.join(', ')}.`;
        if (!comment) comment = avg>=8?'Học lực tốt':avg>=5?'Đạt yêu cầu':'Cần nỗ lực hơn';
        wsData.push([sg.stt||i+1, sg.name, ...usedSubjects.map(sub=>sg.grades[sub]??''), avg, comment]);
    });
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['A1'].s={font:{bold:true,color:{rgb:"FFFFFF"},sz:13},fill:{fgColor:{rgb:"33A3DC"}},alignment:{horizontal:"center"}};
    const cols = header.map((_,i)=>String.fromCharCode(65+i));
    cols.forEach(c=>{const cr=c+'4';if(ws[cr])ws[cr].s={font:{bold:true,color:{rgb:"FFFFFF"}},fill:{fgColor:{rgb:"5b21b6"}},alignment:{horizontal:"center"}};});
    // Color grade cells
    for(let r=4;r<wsData.length;r++){
        usedSubjects.forEach((_,si)=>{
            const cr=String.fromCharCode(65+2+si)+(r+1);
            if(!ws[cr])return;
            const v=ws[cr].v;
            if(typeof v==='number'){
                if(v<5)ws[cr].s={fill:{fgColor:{rgb:"FEE2E2"}},font:{bold:true,color:{rgb:"B91C1C"}}};
                else if(v>=8)ws[cr].s={fill:{fgColor:{rgb:"DCFCE7"}},font:{bold:true,color:{rgb:"166534"}}};
            }
        });
    }
    ws['!cols']=[{wch:6},{wch:25},...Array(usedSubjects.length).fill({wch:10}),{wch:10},{wch:45}];
    ws['!merges']=[{s:{r:0,c:0},e:{r:0,c:header.length-1}},{s:{r:1,c:0},e:{r:1,c:header.length-1}}];
    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,ws,'Bang_diem');
    XLSX.writeFile(wb,`BangDiem_${cls?.name?.replace(/\s+/g,'_')||'Lop'}_${rec.periodName.replace(/\s+/g,'_')}.xlsx`);
    showToast('Đã xuất báo cáo điểm!');
}

function exportAllParentMessages() {
    const rec = gradeRecords.find(r=>r.id===currentGradePeriodId); if(!rec||!rec.studentGrades.length) return;
    const cls = classes.find(c=>c.id===currentClassId);
    const usedSubjects = THPT_SUBJECTS.filter(sub=>rec.studentGrades.some(sg=>sg.grades[sub]!==undefined));
    const wsData = [['STT','Họ và tên','Nội dung tin nhắn phụ huynh']];
    rec.studentGrades.sort((a,b)=>(a.stt||999)-(b.stt||999)).forEach((sg,i)=>{
        const below5 = usedSubjects.filter(sub=>sg.grades[sub]!==undefined&&sg.grades[sub]<5);
        const above8  = usedSubjects.filter(sub=>sg.grades[sub]!==undefined&&sg.grades[sub]>=8);
        const nums    = usedSubjects.map(sub=>sg.grades[sub]).filter(v=>v!==undefined);
        const avg     = nums.length?Math.round(nums.reduce((a,b)=>a+b,0)/nums.length*10)/10:null;
        let msg = `Kính gửi PH em ${sg.name} - Lớp ${cls?.name||''} - ${rec.periodName}\n`;
        usedSubjects.forEach(sub=>{if(sg.grades[sub]!==undefined)msg+=`${sub}: ${sg.grades[sub]}${sg.grades[sub]>=8?' ⭐':sg.grades[sub]<5?' ⚠️':''} | `;});
        if(avg!==null)msg+=`\nTB: ${avg}`;
        if(above8.length)msg+=` | Xuất sắc: ${above8.join(', ')}`;
        if(below5.length)msg+=` | Cần cố gắng: ${below5.join(', ')}`;
        wsData.push([sg.stt||i+1, sg.name, msg]);
    });
    const ws=XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols']=[{wch:6},{wch:25},{wch:80}];
    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,ws,'Tin_nhan_PH');
    XLSX.writeFile(wb,`TinNhanPH_${cls?.name?.replace(/\s+/g,'_')||'Lop'}_${rec.periodName.replace(/\s+/g,'_')}.xlsx`);
    showToast('Đã xuất tất cả tin nhắn phụ huynh!');
    closeParentMsg();
}

