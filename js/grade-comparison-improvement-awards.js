// ============================================================
// GRADE COMPARISON & IMPROVEMENT AWARDS
// ============================================================

function openGradeComparison() {
    const classPeriods = gradeRecords.filter(r=>r.classId===currentClassId);
    if (classPeriods.length < 2) { showToast('Cần ít nhất 2 đợt để so sánh!', false); return; }
    const cls = classes.find(c=>c.id===currentClassId);
    document.getElementById('gradeCompareSubtitle').innerText = `Lớp: ${cls?.name||''}`;

    // Populate selectors
    const selA = document.getElementById('comparePeriodA');
    const selB = document.getElementById('comparePeriodB');
    [selA, selB].forEach((sel, idx) => {
        sel.innerHTML = '';
        classPeriods.forEach((r, i) => {
            const opt = document.createElement('option');
            opt.value = r.id; opt.innerText = r.periodName;
            if (idx === 0 && i === classPeriods.length-2) opt.selected = true;
            if (idx === 1 && i === classPeriods.length-1) opt.selected = true;
            sel.appendChild(opt);
        });
    });
    document.getElementById('gradeCompareModal').classList.remove('hidden');
    renderComparison();
}

function closeGradeComparison() {
    document.getElementById('gradeCompareModal').classList.add('hidden');
}

function renderComparison() {
    const idA = parseInt(document.getElementById('comparePeriodA').value);
    const idB = parseInt(document.getElementById('comparePeriodB').value);
    const recA = gradeRecords.find(r=>r.id===idA);
    const recB = gradeRecords.find(r=>r.id===idB);
    const table  = document.getElementById('compareTable');
    const empty  = document.getElementById('compareEmpty');
    const chips  = document.getElementById('compareSummaryChips');
    chips.innerHTML = ''; table.innerHTML = '';

    if (!recA || !recB || idA === idB) {
        table.closest('div').classList.add('hidden');
        empty.classList.remove('hidden'); return;
    }
    table.closest('div').classList.remove('hidden');
    empty.classList.add('hidden');

    // All student names across both periods
    const allNames = [...new Set([...recA.studentGrades.map(s=>s.name), ...recB.studentGrades.map(s=>s.name)])];
    const usedSubjects = THPT_SUBJECTS.filter(sub =>
        recA.studentGrades.some(sg=>sg.grades[sub]!==undefined) ||
        recB.studentGrades.some(sg=>sg.grades[sub]!==undefined)
    );

    // Compute per-student comparison data
    const rows = allNames.map(name => {
        const sgA = recA.studentGrades.find(s=>s.name===name);
        const sgB = recB.studentGrades.find(s=>s.name===name);
        const stt = sgB?.stt || sgA?.stt || 0;
        const avgA = sgA ? avg(usedSubjects.map(sub=>sgA.grades[sub]).filter(v=>v!==undefined)) : null;
        const avgB = sgB ? avg(usedSubjects.map(sub=>sgB.grades[sub]).filter(v=>v!==undefined)) : null;
        const delta = (avgA!==null && avgB!==null) ? Math.round((avgB-avgA)*10)/10 : null;
        const improved = usedSubjects.filter(sub => sgA?.grades[sub]!==undefined && sgB?.grades[sub]!==undefined && sgB.grades[sub]-sgA.grades[sub]>=0.5);
        const declined = usedSubjects.filter(sub => sgA?.grades[sub]!==undefined && sgB?.grades[sub]!==undefined && sgA.grades[sub]-sgB.grades[sub]>=0.5);
        // Auto comment
        let comment = '';
        if (delta === null) comment = '—';
        else if (delta >= 1.5) comment = `🚀 Tiến bộ vượt bậc (${improved.slice(0,3).join(', ')})`;
        else if (delta >= 0.5) comment = `📈 Có tiến bộ${improved.length?` (${improved.slice(0,2).join(', ')})`:''} `;
        else if (delta <= -1.0) comment = `📉 Cần cố gắng hơn${declined.length?` (${declined.slice(0,2).join(', ')})`:''} `;
        else if (delta < 0)  comment = `🔄 Hơi giảm, cần chú ý`;
        else comment = `✅ Ổn định`;

        // Suggest award
        let awardPts = 0;
        if (delta !== null && delta >= 1.5) awardPts = 5;
        else if (delta !== null && delta >= 0.5) awardPts = 3;

        return { name, stt, avgA, avgB, delta, comment, awardPts, improved, declined };
    }).sort((a,b)=>(a.stt||999)-(b.stt||999));

    // Summary chips
    const improvedCount = rows.filter(r=>r.delta!==null && r.delta>=0.5).length;
    const declinedCount = rows.filter(r=>r.delta!==null && r.delta<=-0.5).length;
    const stableCount   = rows.filter(r=>r.delta!==null && Math.abs(r.delta)<0.5).length;
    [
        { label:`📈 Tiến bộ: ${improvedCount}`, bg:'bg-green-100 text-green-700' },
        { label:`✅ Ổn định: ${stableCount}`,    bg:'bg-blue-100 text-blue-700' },
        { label:`📉 Giảm: ${declinedCount}`,     bg:'bg-red-100 text-red-700' },
    ].forEach(({label,bg})=>{
        const chip = document.createElement('span');
        chip.className = `flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full ${bg}`;
        chip.innerText = label;
        chips.appendChild(chip);
    });

    // Table header
    table.innerHTML = `<thead><tr>
        <th class="sticky left-0 bg-gray-700 text-white px-3 py-2 text-left z-10">#</th>
        <th class="sticky left-8 bg-gray-700 text-white px-3 py-2 text-left z-10 whitespace-nowrap min-w-[110px]">Họ và tên</th>
        <th class="bg-gray-600 text-white px-3 py-2 text-center whitespace-nowrap">TB ${recA.periodName}</th>
        <th class="bg-gray-600 text-white px-3 py-2 text-center whitespace-nowrap">TB ${recB.periodName}</th>
        <th class="bg-purple-700 text-white px-3 py-2 text-center">Thay đổi</th>
        <th class="bg-gray-600 text-white px-3 py-2 text-center whitespace-nowrap min-w-[160px]">Nhận xét chung</th>
        <th class="bg-amber-600 text-white px-3 py-2 text-center whitespace-nowrap">Thưởng thi đua</th>
    </tr></thead><tbody>
    ${rows.map((r,i)=>{
        const rowBg = i%2===0?'#fff':'#f9fafb';
        const deltaColor = r.delta===null?'text-gray-400':r.delta>0?'text-green-700 font-black':'text-red-600 font-bold';
        const deltaStr = r.delta===null?'—':(r.delta>0?`+${r.delta} ↑`:r.delta<0?`${r.delta} ↓`:`0 →`);
        const avgAStr  = r.avgA!==null?r.avgA:'—';
        const avgBStr  = r.avgB!==null?r.avgB:'—';
        const avgBColor= r.avgB===null?'':r.avgB>=8?'color:#166534':r.avgB<5?'color:#b91c1c':'';
        let awardBtns = '—';
        if (r.awardPts > 0) {
            const pts = r.awardPts;
            const other = pts === 3 ? 5 : 3;
            awardBtns = `
                <button onclick="awardImprovementPoints('${r.name}',${pts},'${recA.periodName}→${recB.periodName}')"
                    class="text-[10px] font-black bg-amber-400 hover:bg-amber-500 text-white px-2 py-1 rounded-full shadow mr-1 transition">+${pts}⭐</button>
                <button onclick="awardImprovementPoints('${r.name}',${other},'${recA.periodName}→${recB.periodName}')"
                    class="text-[10px] font-black bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded-full transition">+${other}</button>`;
        }
        return `<tr style="background:${rowBg}">
            <td class="sticky left-0 px-3 py-2 text-gray-500 text-center z-10 border-b border-gray-100" style="background:${rowBg}">${r.stt||i+1}</td>
            <td class="sticky left-8 px-3 py-2 font-bold text-gray-800 z-10 border-b border-gray-100 whitespace-nowrap" style="background:${rowBg}">${r.name}</td>
            <td class="px-3 py-2 text-center text-gray-600 border-b border-gray-100">${avgAStr}</td>
            <td class="px-3 py-2 text-center font-bold border-b border-gray-100" style="${avgBColor}">${avgBStr}</td>
            <td class="px-3 py-2 text-center border-b border-gray-100 ${deltaColor}">${deltaStr}</td>
            <td class="px-3 py-2 text-xs text-gray-600 border-b border-gray-100 whitespace-nowrap">${r.comment}</td>
            <td class="px-3 py-2 text-center border-b border-gray-100 whitespace-nowrap">${awardBtns}</td>
        </tr>`;
    }).join('')}
    </tbody>`;
}

function avg(nums) {
    if (!nums.length) return null;
    return Math.round(nums.reduce((a,b)=>a+b,0)/nums.length*10)/10;
}

function awardImprovementPoints(studentName, pts, periodLabel) {
    // Find student in current class
    const s = students.find(st=>st.classId===currentClassId && st.name===studentName);
    if (!s) { showToast(`Không tìm thấy ${studentName} trong lớp hiện tại`, false); return; }
    const old = s.points;
    s.points        += pts;
    s.positivePoints += pts;
    const skillName = `Tiến bộ học tập (${periodLabel})`;
    history.push({ id:Date.now()+Math.random(), classId:currentClassId, studentId:s.id, studentName:s.name, skillName, points:pts, timestamp:new Date().toISOString() });
    checkMilestone(s, old);
    saveData();
    showToast(`${s.name} +${pts} điểm thi đua (tiến bộ học tập) 🎉`);
    // Refresh comparison to disable button
    renderComparison();
}

