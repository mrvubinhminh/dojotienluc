// ============================================================
// REPORT & PERIODS
// ============================================================
function renderReport() {
    const list=document.getElementById('reportList'); list.innerHTML='';
    renderPeriodTabs();
    renderStreakHallOfFame();
    let displayStudents;
    const title=document.getElementById('reportTitle');
    const actions=document.getElementById('reportActions');

    if(currentPeriodId===null) {
        displayStudents=students.filter(s=>s.classId===currentClassId);
        title.innerText='Bảng Xếp Hạng'; actions.classList.remove('hidden');
    } else {
        const period=periods.find(p=>p.id===currentPeriodId);
        if(!period){list.innerHTML='<div class="text-center py-10 text-gray-400">Không tìm thấy kỳ học.</div>';return;}
        displayStudents=period.students; title.innerText=`Kỳ: ${period.name}`; actions.classList.add('hidden');
    }

    if(!displayStudents.length){list.innerHTML='<div class="text-center py-10 text-gray-400 font-semibold bg-white rounded-xl border border-gray-100">Lớp chưa có học sinh nào.</div>';return;}

    const sortBy=document.getElementById('sortOrder').value;
    const sorted=[...displayStudents].sort((a,b)=>sortBy==='points'?b.points-a.points:a.name.localeCompare(b.name));

    // ---- Modern Leaderboard Table ----
    const RANK_CFG = [
        { icon:'👑', rowBg:'linear-gradient(90deg,#fffbeb 0%,#fef9c3 60%,#ffffff 100%)', border:'#f59e0b', scoreBg:'linear-gradient(135deg,#f59e0b,#fbbf24)', label:'Quán quân' },
        { icon:'🥈', rowBg:'linear-gradient(90deg,#f8fafc 0%,#f1f5f9 60%,#ffffff 100%)', border:'#94a3b8', scoreBg:'linear-gradient(135deg,#64748b,#94a3b8)', label:'Á quân'   },
        { icon:'🥉', rowBg:'linear-gradient(90deg,#fff7ed 0%,#ffedd5 60%,#ffffff 100%)', border:'#f97316', scoreBg:'linear-gradient(135deg,#ea580c,#f97316)', label:'Hạng ba'  },
    ];

    let tableHtml = `<div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-dojo-blue to-violet-600 text-white">
        <i class="fas fa-trophy text-yellow-300 text-sm"></i>
        <span class="font-black text-sm tracking-wide">BẢNG XẾP HẠNG</span>
        <span class="ml-auto text-[11px] opacity-75 font-semibold">${sorted.length} học sinh</span>
      </div>
      <div class="divide-y divide-gray-50">`;

    sorted.forEach((student,i)=>{
        const rc = i<3 && sortBy==='points' && student.points>0 ? RANK_CFG[i] : null;
        const ms = getMilestone(student.points);
        const st = computeStreaks(student.id,currentClassId);
        const earned = getEarnedStreakBadges(st.maxDay,st.maxWeek);
        const topBadge = earned.length ? earned[earned.length-1] : null;

        // Rank cell
        let rankCell;
        if(rc) rankCell=`<div class="w-9 flex flex-col items-center gap-0.5 flex-shrink-0"><span class="text-2xl leading-none">${rc.icon}</span><span class="text-[9px] font-black" style="color:${rc.border}">${rc.label}</span></div>`;
        else rankCell=`<div class="w-9 flex items-center justify-center flex-shrink-0"><span class="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[11px] font-black text-gray-500">${i+1}</span></div>`;

        // Score cell
        const pts = student.points;
        let scoreBg,scoreText;
        if(rc){ scoreBg=rc.scoreBg; scoreText='text-white'; }
        else if(pts>0){ scoreBg='linear-gradient(135deg,#22c55e,#16a34a)'; scoreText='text-white'; }
        else if(pts<0){ scoreBg='linear-gradient(135deg,#ef4444,#b91c1c)'; scoreText='text-white'; }
        else { scoreBg='#f3f4f6'; scoreText='text-gray-500'; }

        // Badges row
        const msBadge = ms ? `<span class="text-base" title="${ms.label}">${ms.icon}</span>` : '';
        const streakIcons = earned.map(b=>`<span class="text-sm" title="${b.name}: ${b.desc}">${b.icon}</span>`).join('');
        const activeBadge = st.curDay>0
            ? `<span class="text-[9px] font-black text-orange-500 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-full">🔥${st.curDay}ngày</span>`
            : (st.curWeek>=2 ? `<span class="text-[9px] font-black text-blue-500 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">📅${st.curWeek}tuần</span>` : '');
        const badgesHtml = (msBadge||streakIcons||activeBadge)
            ? `<div class="flex items-center gap-0.5 flex-wrap mt-0.5">${msBadge}${streakIcons}${activeBadge}</div>` : '';

        // Row bg & border
        const rowStyle = rc
            ? `background:${rc.rowBg};border-left:4px solid ${rc.border}`
            : topBadge
                ? `background:#ffffff;border-left:4px solid ${topBadge.shadow.replace('0.5)','0.8)')}`
                : `background:#ffffff;border-left:4px solid #e5e7eb`;

        // Avatar ring
        const avatarRing = rc ? `border-2` : `border`;
        const avatarRingColor = rc ? `style="border-color:${rc.border}"` : ``;

        // Podium glow
        const glowEl = rc && i===0 ? `<div class="absolute inset-0 rounded-full opacity-20 animate-ping" style="background:${rc.border}"></div>` : '';

        tableHtml += `
        <div class="flex items-center gap-2.5 px-3 py-2.5 active:brightness-95 transition-all cursor-pointer" style="${rowStyle}" onclick="openStudentProfile('${student.id}')">
          ${rankCell}
          <div class="relative flex-shrink-0">
            ${glowEl}
            <div class="w-10 h-10 rounded-full bg-blue-50 overflow-hidden ${avatarRing} border-blue-100" ${avatarRingColor}>
              <img src="${student.avatar}" class="w-full h-full object-contain">
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-black text-gray-800 text-sm truncate leading-tight">${student.name}</div>
            ${badgesHtml}
            <div class="flex gap-1.5 mt-1 items-center">
              <span class="inline-flex items-center gap-0.5 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full"><i class="fas fa-plus text-[8px]"></i>${student.positivePoints}</span>
              <span class="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full"><i class="fas fa-minus text-[8px]"></i>${student.negativePoints}</span>
              <span class="text-[10px] text-gray-400 italic truncate">${generateComment(student).slice(0,40)}${generateComment(student).length>40?'…':''}</span>
            </div>
          </div>
          <div class="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center font-black text-base ${scoreText} shadow-md" style="background:${scoreBg}">
            ${pts>0?'+':''}${pts}
          </div>
        </div>`;
    });

    tableHtml += `</div></div>`;
    list.innerHTML = tableHtml;
}

function renderPeriodTabs() {
    const container=document.getElementById('periodTabs'); container.innerHTML='';
    const cp=periods.filter(p=>p.classId===currentClassId).sort((a,b)=>new Date(b.endDate)-new Date(a.endDate));
    cp.forEach(p=>{
        const btn=document.createElement('button');
        const isActive=currentPeriodId===p.id;
        btn.className=`flex-shrink-0 px-4 py-2 font-bold rounded-full text-sm transition ${isActive?'bg-dojo-blue text-white shadow':'bg-white text-gray-600 border border-gray-200 hover:border-dojo-blue'}`;
        btn.innerText=p.name; btn.onclick=()=>selectPeriod(p.id);
        container.appendChild(btn);
    });
    document.getElementById('btnCurrentPeriod').className=`flex-shrink-0 px-4 py-2 font-bold rounded-full text-sm transition ${currentPeriodId===null?'bg-dojo-blue text-white shadow':'bg-white text-gray-600 border border-gray-200 hover:border-dojo-blue'}`;
}

function selectPeriod(id) { currentPeriodId=id; renderReport(); }

function endPeriod() {
    const cls=classes.find(c=>c.id===currentClassId); if(!cls) return;
    const cs=students.filter(s=>s.classId===currentClassId);
    if(!cs.length) return alert('Lớp chưa có học sinh!');
    const defaultName=`Tuần ${new Date().toLocaleDateString('vi-VN')}`;
    const name=prompt(`Đặt tên kỳ học (VD: Tuần 1, Tháng 10/2025):`,defaultName);
    if(!name) return;
    periods.push({id:Date.now(),classId:currentClassId,name:name.trim(),endDate:new Date().toISOString(),students:cs.map(s=>({...s}))});
    students.forEach(s=>{if(s.classId===currentClassId){s.points=0;s.positivePoints=0;s.negativePoints=0;}});
    saveData();
    document.getElementById('totalClassPoints').innerText='Tổng điểm: 0';
    showToast(`Đã lưu kỳ "${name.trim()}" và reset điểm!`);
    currentPeriodId=null; renderReport();
}

// Công thức tính điểm thi đua xuất Excel
function calcExcelScore(s) {
    return Math.round((s.positivePoints * 0.2 - s.negativePoints * 0.5) * 100) / 100;
}

function _buildExcelSheet(cls, exportStudents, sheetTitle) {
    const sortBy=(document.getElementById('sortOrder')||{value:'points'}).value||'points';
    const sorted=[...exportStudents].sort((a,b)=>sortBy==='points'
        ? calcExcelScore(b)-calcExcelScore(a)
        : a.name.localeCompare(b.name));
    const wsData=[
        [`BẢNG TỔNG KẾT ĐIỂM THI ĐUA - LỚP ${cls.name.toUpperCase()} - ${sheetTitle.toUpperCase()}`,"","","","",""],
        [`Ngày xuất báo cáo: ${new Date().toLocaleDateString('vi-VN')}`,"","","","",""],
        [`Công thức: Điểm thi đua = Điểm cộng × 0,2  −  Điểm trừ × 0,5`,"","","","","",""],
        ["","","","","","",""],
        ['STT','Họ và tên','Điểm cộng (+)','Điểm trừ (-)','Điểm thi đua','Xếp hạng','Nhận xét']
    ];
    sorted.forEach((s,i)=>{
        const score=calcExcelScore(s);
        let rank=i+1;
        if(sortBy==='points'){if(i===0&&score>0)rank='1 (Vương miện vàng)';else if(i===1&&score>0)rank='2 (Huy chương bạc)';else if(i===2&&score>0)rank='3 (Huy chương đồng)';}
        const comment=generateComment(s).replace(/[\u{1F300}-\u{1FFFF}]/gu,'').trim();
        wsData.push([i+1,s.name,s.positivePoints,s.negativePoints,score,rank,comment]);
    });
    const ws=XLSX.utils.aoa_to_sheet(wsData);
    ws['A1'].s={font:{bold:true,color:{rgb:"FFFFFF"},sz:14,name:"Arial"},fill:{fgColor:{rgb:"33A3DC"}},alignment:{horizontal:"center",vertical:"center"}};
    ws['A2'].s={font:{italic:true,color:{rgb:"555555"},sz:11,name:"Arial"},alignment:{horizontal:"center",vertical:"center"}};
    ws['A3'].s={font:{italic:true,bold:true,color:{rgb:"E65100"},sz:11,name:"Arial"},fill:{fgColor:{rgb:"FFF3E0"}},alignment:{horizontal:"center",vertical:"center"}};
    ['A','B','C','D','E','F','G'].forEach(col=>{const cr=col+'5';if(ws[cr])ws[cr].s={font:{bold:true,color:{rgb:"FFFFFF"},name:"Arial"},fill:{fgColor:{rgb:"8BC34A"}},alignment:{horizontal:"center",vertical:"center"},border:{top:{style:'thin',color:{rgb:"AAAAAA"}},bottom:{style:'medium',color:{rgb:"666666"}},left:{style:'thin',color:{rgb:"AAAAAA"}},right:{style:'thin',color:{rgb:"AAAAAA"}}}};});
    for(let r=5;r<wsData.length;r++){['A','B','C','D','E','F'].forEach((col,ci)=>{const cr=col+(r+1);if(!ws[cr])return;let cs2={font:{name:"Arial",sz:11},border:{top:{style:'thin',color:{rgb:"DDDDDD"}},bottom:{style:'thin',color:{rgb:"DDDDDD"}},left:{style:'thin',color:{rgb:"DDDDDD"}},right:{style:'thin',color:{rgb:"DDDDDD"}}},alignment:{vertical:"center"}};if(r%2===0)cs2.fill={fgColor:{rgb:"F9F9F9"}};if(ci!==1)cs2.alignment.horizontal="center";if(ci===4){cs2.font.bold=true;const v=ws[cr].v;if(typeof v==='number'){if(v>0)cs2.font.color={rgb:"2E7D32"};else if(v<0)cs2.font.color={rgb:"C62828"};}}if(ci===2&&ws[cr].v>0){cs2.font.color={rgb:"2E7D32"};cs2.font.bold=true;}if(ci===3&&ws[cr].v>0){cs2.font.color={rgb:"C62828"};cs2.font.bold=true;}if(ci===5&&typeof ws[cr].v==='string'){if(ws[cr].v.includes('Vương miện')){cs2.font.color={rgb:"E65100"};cs2.font.bold=true;}else if(ws[cr].v.includes('Huy chương'))cs2.font.bold=true;}ws[cr].s=cs2;});}
    for(let r=5;r<wsData.length;r++){const cr='G'+(r+1);if(!ws[cr])continue;ws[cr].s={font:{name:"Arial",sz:10,italic:true,color:{rgb:"555577"}},alignment:{vertical:"center",wrapText:true},border:{top:{style:'thin',color:{rgb:"DDDDDD"}},bottom:{style:'thin',color:{rgb:"DDDDDD"}},left:{style:'thin',color:{rgb:"DDDDDD"}},right:{style:'thin',color:{rgb:"DDDDDD"}}}};if(r%2===0)ws[cr].s.fill={fgColor:{rgb:"F9F9F9"}};}
    ws['!cols']=[{wch:8},{wch:25},{wch:15},{wch:15},{wch:14},{wch:22},{wch:40}];
    ws['!merges']=[{s:{r:0,c:0},e:{r:0,c:6}},{s:{r:1,c:0},e:{r:1,c:6}},{s:{r:2,c:0},e:{r:2,c:6}}];
    return ws;
}

function exportToExcel() {
    const cls=classes.find(c=>c.id===currentClassId); if(!cls) return alert('Không tìm thấy lớp!');
    const classPeriods=periods.filter(p=>p.classId===currentClassId).sort((a,b)=>new Date(b.endDate)-new Date(a.endDate));
    if(!classPeriods.length) {
        // Không có đợt → xuất thẳng điểm hiện tại
        const exportStudents=students.filter(s=>s.classId===currentClassId);
        if(!exportStudents.length) return alert('Không có dữ liệu để xuất!');
        const wb=XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb,_buildExcelSheet(cls,exportStudents,'Điểm hiện tại'),'Hien_tai');
        XLSX.writeFile(wb,`Bao_Cao_${cls.name.replace(/\s+/g,'_')}_${new Date().toISOString().slice(0,10)}.xlsx`);
        showToast('Đã tải xuống file Excel!');
        return;
    }
    // Có đợt → hiện modal chọn
    const listEl=document.getElementById('exportPeriodList');
    listEl.innerHTML='';
    // Option: điểm hiện tại
    listEl.insertAdjacentHTML('beforeend',`
        <label class="flex items-center gap-3 p-3 bg-blue-50 rounded-xl cursor-pointer hover:bg-blue-100 transition">
            <input type="checkbox" class="export-period-chk w-4 h-4 accent-blue-500" value="__current__">
            <div><p class="font-bold text-blue-700 text-sm">Điểm hiện tại</p><p class="text-xs text-blue-400">Điểm thi đua đang chạy</p></div>
        </label>`);
    classPeriods.forEach(p=>{
        const date=new Date(p.endDate).toLocaleDateString('vi-VN');
        listEl.insertAdjacentHTML('beforeend',`
            <label class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition border border-gray-100">
                <input type="checkbox" class="export-period-chk w-4 h-4 accent-green-600" value="${p.id}">
                <div><p class="font-bold text-gray-700 text-sm">${p.name}</p><p class="text-xs text-gray-400">Lưu ngày ${date} · ${p.students.length} HS</p></div>
            </label>`);
    });
    // Mặc định chọn hết
    listEl.querySelectorAll('.export-period-chk').forEach(cb=>cb.checked=true);
    document.getElementById('exportPeriodBackdrop').classList.remove('hidden');
    document.getElementById('exportPeriodBackdrop').classList.add('flex');
}

function closeExportPeriodModal() {
    document.getElementById('exportPeriodBackdrop').classList.add('hidden');
    document.getElementById('exportPeriodBackdrop').classList.remove('flex');
}

function doExportWithPeriods() {
    const cls=classes.find(c=>c.id===currentClassId); if(!cls) return;
    const checked=[...document.querySelectorAll('.export-period-chk:checked')].map(cb=>cb.value);
    if(!checked.length){showToast('Vui lòng chọn ít nhất một đợt!',false);return;}
    const wb=XLSX.utils.book_new();
    let sheetCount=0;
    checked.forEach(val=>{
        if(val==='__current__'){
            const exportStudents=students.filter(s=>s.classId===currentClassId);
            if(exportStudents.length){XLSX.utils.book_append_sheet(wb,_buildExcelSheet(cls,exportStudents,'Điểm hiện tại'),'Hien_tai');sheetCount++;}
        } else {
            const period=periods.find(p=>p.id===Number(val)||p.id===val);
            if(period&&period.students.length){
                const label=period.name.replace(/\s+/g,'_').substring(0,28);
                XLSX.utils.book_append_sheet(wb,_buildExcelSheet(cls,period.students,period.name),label);
                sheetCount++;
            }
        }
    });
    if(!sheetCount){showToast('Không có dữ liệu để xuất!',false);return;}
    closeExportPeriodModal();
    XLSX.writeFile(wb,`Bao_Cao_${cls.name.replace(/\s+/g,'_')}_${new Date().toISOString().slice(0,10)}.xlsx`);
    showToast(`Đã xuất ${sheetCount} sheet Excel!`);
}

