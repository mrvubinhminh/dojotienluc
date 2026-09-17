// ============================================================
// PHIẾU NHẬN XÉT TUẦN TỰ ĐỘNG
// ============================================================
let _weeklyPeriodType = 'week0';
let _weeklyStart = null, _weeklyEnd = null;
let _currentReportData = null;  // report data for open student detail

// ----- Period helpers -----
function getWeekRange(offset = 0) {
    const now = new Date();
    const day = now.getDay();
    const mon = new Date(now);
    mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
    mon.setHours(0,0,0,0);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23,59,59,999);
    return { start: mon, end: sun };
}
function getMonthRange(offset = 0) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const end   = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, 23, 59, 59);
    return { start, end };
}
function dateToStr(d) { return d.toISOString().slice(0,10); }
function periodLabel(start, end) {
    return `${start.toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit'})} – ${end.toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'})}`;
}

function setWeeklyPeriod(type) {
    _weeklyPeriodType = type;
    // Style buttons
    ['week0','week-1','month0','custom'].forEach(id=>{
        const btn = document.getElementById('wp-'+id);
        if (!btn) return;
        btn.className = `flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition ${id===type ? 'bg-white text-amber-600 shadow' : 'bg-white bg-opacity-20 text-white'}`;
    });
    const customRange = document.getElementById('wpCustomRange');
    if (type === 'custom') { customRange.classList.remove('hidden'); return; }
    customRange.classList.add('hidden');

    if (type === 'week0')  { const r=getWeekRange(0);  _weeklyStart=r.start; _weeklyEnd=r.end; }
    if (type === 'week-1') { const r=getWeekRange(-1); _weeklyStart=r.start; _weeklyEnd=r.end; }
    if (type === 'month0') { const r=getMonthRange(0); _weeklyStart=r.start; _weeklyEnd=r.end; }
    renderWeeklyReports();
}

// ----- Open / Close -----
function openWeeklyReports() {
    const cls = classes.find(c=>c.id===currentClassId);
    document.getElementById('weeklyReportSubtitle').innerText = cls?.name||'';
    document.getElementById('weeklyReportOverlay').classList.remove('hidden');
    // Init default period
    setWeeklyPeriod('week0');
}
function closeWeeklyReports() { document.getElementById('weeklyReportOverlay').classList.add('hidden'); }

// ----- Generate report for one student -----
function generateStudentReport(s, startDate, endDate) {
    const startStr = dateToStr(startDate), endStr = dateToStr(endDate);
    // Points this period
    const ph = history.filter(h=>h.studentId===s.id && h.classId===s.classId &&
        new Date(h.timestamp)>=startDate && new Date(h.timestamp)<=endDate);
    const periodPos = ph.filter(h=>h.points>0).reduce((sum,h)=>sum+h.points,0);
    const periodNeg = ph.filter(h=>h.points<0).reduce((sum,h)=>sum+Math.abs(h.points),0);
    const periodNet = periodPos - periodNeg;
    // Group positive/negative behaviors this period
    const behaviors = {};
    ph.forEach(h=>{ behaviors[h.skillName]=(behaviors[h.skillName]||0)+1; });
    // Notes this period
    const periodNotes = communicationLog.filter(n=>
        (n.studentId===s.id||(n.studentId===null&&n.classId===s.classId)) &&
        n.date >= startStr && n.date <= endStr
    );
    // Latest grade period
    const latestGradePeriod = gradeRecords.filter(r=>r.classId===s.classId)
        .sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))[0];
    const sGrades = latestGradePeriod?.studentGrades.find(sg=>sg.studentId===s.id||sg.name===s.name);
    // Assessment
    const assessment = calcWeeklyAssessment(periodNet, periodNotes);
    // Auto comment
    const autoComment = generateWeeklyAutoComment(s, periodNet, periodPos, periodNeg, periodNotes, sGrades?.grades);
    return { student:s, periodPos, periodNeg, periodNet, behaviors, totalPoints:s.points, milestone:getMilestone(s.points), notes:periodNotes, grades:sGrades?.grades, gradesPeriodName:latestGradePeriod?.periodName, assessment, autoComment };
}

function calcWeeklyAssessment(periodNet, notes) {
    const praises   = notes.filter(n=>n.type==='praise').length;
    const concerns  = notes.filter(n=>n.type==='concern').length;
    if (periodNet >= 5 && concerns === 0) return { label:'Xuất sắc',   color:'text-yellow-600', bg:'bg-yellow-50',  border:'border-yellow-200', icon:'👑' };
    if (periodNet >= 3 || (praises >= 2 && concerns <= 1))
                                          return { label:'Tốt',        color:'text-green-700',  bg:'bg-green-50',   border:'border-green-200',  icon:'⭐' };
    if (periodNet >= 1 || praises >= 1)   return { label:'Khá',        color:'text-blue-700',   bg:'bg-blue-50',    border:'border-blue-200',   icon:'👍' };
    if (periodNet >= -1 && concerns <= 2) return { label:'Trung bình', color:'text-orange-700', bg:'bg-orange-50',  border:'border-orange-200', icon:'📘' };
    return                                       { label:'Cần cố gắng',color:'text-red-700',    bg:'bg-red-50',     border:'border-red-200',    icon:'💪' };
}

function generateWeeklyAutoComment(s, net, pos, neg, notes, grades) {
    const praises  = notes.filter(n=>n.type==='praise');
    const concerns = notes.filter(n=>n.type==='concern');
    let parts = [];
    if (net > 0)       parts.push(`Đạt +${net} điểm thi đua trong kỳ`);
    else if (net < 0)  parts.push(`Điểm thi đua kỳ này là ${net}, cần cố gắng hơn`);
    else               parts.push('Điểm thi đua kỳ này ổn định');
    if (praises.length) parts.push(`được khen ngợi ${praises.length} lần`);
    if (concerns.length) parts.push(`có ${concerns.length} điểm cần cải thiện`);
    if (grades) {
        const nums = Object.values(grades).filter(v=>typeof v==='number');
        if (nums.length) {
            const a = Math.round(nums.reduce((s,v)=>s+v,0)/nums.length*10)/10;
            if (a >= 8)   parts.push(`kết quả học tập xuất sắc (TB: ${a})`);
            else if (a >= 6.5) parts.push(`kết quả học tập khá tốt (TB: ${a})`);
            else          parts.push(`cần chú ý hơn đến học tập (TB: ${a})`);
        }
    }
    return parts.join(', ') + '. ' + generateComment({positivePoints:s.positivePoints,negativePoints:s.negativePoints,id:s.id,name:s.name});
}

// ----- Render list of all student reports -----
function renderWeeklyReports() {
    // Handle custom date range
    if (_weeklyPeriodType === 'custom') {
        const f = document.getElementById('wpDateFrom').value;
        const t = document.getElementById('wpDateTo').value;
        if (!f || !t) return;
        _weeklyStart = new Date(f+'T00:00:00');
        _weeklyEnd   = new Date(t+'T23:59:59');
    }
    if (!_weeklyStart || !_weeklyEnd) return;

    const container = document.getElementById('weeklyReportList');
    container.innerHTML = '';
    const classStudents = students.filter(s=>s.classId===currentClassId).sort((a,b)=>(a.stt||0)-(b.stt||0));

    if (!classStudents.length) {
        container.innerHTML = '<p class="text-center text-gray-400 py-10">Lớp chưa có học sinh.</p>';
        return;
    }

    // Period label
    const label = periodLabel(_weeklyStart, _weeklyEnd);
    document.getElementById('weeklyReportSubtitle').innerText = `${classes.find(c=>c.id===currentClassId)?.name||''} · ${label}`;

    classStudents.forEach(s=>{
        const r = generateStudentReport(s, _weeklyStart, _weeklyEnd);
        const as = r.assessment;
        const netColor = r.periodNet>0?'text-green-600':r.periodNet<0?'text-red-600':'text-gray-500';
        const card = document.createElement('div');
        card.className = 'bg-white rounded-2xl shadow-sm border border-gray-100 p-3 mb-3 flex items-center gap-3 active:scale-[0.98] transition-transform';
        card.innerHTML = `
            <img src="${s.avatar}" class="w-12 h-12 rounded-full bg-blue-50 p-0.5 object-contain flex-shrink-0">
            <div class="flex-1 overflow-hidden">
                <div class="flex items-center gap-2">
                    <span class="font-bold text-gray-800 text-sm">${s.name}</span>
                    <span class="text-xs font-bold px-2 py-0.5 rounded-full ${as.bg} ${as.color} border ${as.border}">${as.icon} ${as.label}</span>
                </div>
                <div class="flex gap-3 mt-1 text-xs text-gray-500">
                    <span class="font-bold ${netColor}">${r.periodNet>0?'+':''}${r.periodNet} kỳ</span>
                    <span>📊 Tổng: ${s.points}</span>
                    ${r.notes.length?`<span>💬 ${r.notes.length} nhận xét</span>`:''}
                </div>
                <p class="text-[11px] text-gray-400 mt-0.5 truncate">${r.autoComment.slice(0,80)}…</p>
            </div>
            <button onclick="openStudentReport(${s.id})" class="w-8 h-8 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center hover:bg-amber-100 transition flex-shrink-0"><i class="fas fa-eye text-xs"></i></button>`;
        container.appendChild(card);
    });
}

// ----- Individual student report detail -----
function openStudentReport(studentId) {
    if (!_weeklyStart || !_weeklyEnd) return;
    const s = students.find(st=>st.id===studentId); if(!s) return;
    _currentReportData = generateStudentReport(s, _weeklyStart, _weeklyEnd);
    document.getElementById('studentReportName').innerText        = s.name;
    document.getElementById('studentReportPeriodLabel').innerText = periodLabel(_weeklyStart, _weeklyEnd);
    renderStudentReportDetail(_currentReportData);
    document.getElementById('studentReportBackdrop').classList.remove('hidden');
    document.getElementById('studentReportModal').classList.remove('translate-y-full');
}
function closeStudentReport() {
    document.getElementById('studentReportModal').classList.add('translate-y-full');
    setTimeout(()=>document.getElementById('studentReportBackdrop').classList.add('hidden'),300);
}

function renderStudentReportDetail(r) {
    const s = r.student;
    const as = r.assessment;
    const ms = r.milestone;
    const pColor = r.periodNet>0?'text-green-600':r.periodNet<0?'text-red-600':'text-gray-500';

    let html = `
    <!-- Tổng quan -->
    <div class="${as.bg} border ${as.border} rounded-2xl p-4 mb-4 flex items-center gap-4">
        <img src="${s.avatar}" class="w-16 h-16 rounded-full bg-white p-0.5 object-contain flex-shrink-0 shadow">
        <div>
            <div class="flex items-center gap-2 flex-wrap">
                <span class="font-black text-gray-800 text-lg">${as.icon} ${as.label}</span>
                ${ms?`<span class="text-xl">${ms.icon}</span>`:''}
            </div>
            <p class="text-xs text-gray-500 mt-0.5">${s.stt?`STT: ${s.stt} · `:''} Lớp ${classes.find(c=>c.id===s.classId)?.name||''}</p>
        </div>
    </div>

    <!-- Điểm thi đua kỳ này -->
    <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3">
        <h3 class="font-bold text-gray-600 text-sm mb-3 flex items-center gap-2"><i class="fas fa-trophy text-yellow-400"></i> Điểm thi đua kỳ này</h3>
        <div class="grid grid-cols-3 gap-3 text-center">
            <div class="bg-green-50 rounded-xl p-2"><p class="text-xl font-black text-green-600">+${r.periodPos}</p><p class="text-[10px] text-gray-500">Điểm cộng</p></div>
            <div class="bg-red-50 rounded-xl p-2"><p class="text-xl font-black text-red-500">-${r.periodNeg}</p><p class="text-[10px] text-gray-500">Điểm trừ</p></div>
            <div class="bg-gray-50 rounded-xl p-2"><p class="text-xl font-black ${pColor}">${r.periodNet>0?'+':''}${r.periodNet}</p><p class="text-[10px] text-gray-500">Kỳ này</p></div>
        </div>
        <div class="mt-3 pt-3 border-t border-gray-50 flex justify-between items-center">
            <span class="text-xs text-gray-500">Tổng tích lũy</span>
            <span class="font-black text-lg ${s.points>0?'text-green-600':s.points<0?'text-red-600':'text-gray-500'}">${s.points} điểm ${ms?ms.icon:''}</span>
        </div>
    </div>`;

    // Hành vi nổi bật
    if (Object.keys(r.behaviors).length) {
        const top = Object.entries(r.behaviors).sort((a,b)=>b[1]-a[1]).slice(0,4);
        html += `<div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3">
            <h3 class="font-bold text-gray-600 text-sm mb-3 flex items-center gap-2"><i class="fas fa-list-check text-blue-400"></i> Hành vi nổi bật</h3>
            <div class="flex flex-wrap gap-2">
                ${top.map(([name,cnt])=>`<span class="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-semibold">${name} <span class="font-black text-gray-800">×${cnt}</span></span>`).join('')}
            </div>
        </div>`;
    }

    // Nhận xét giáo viên kỳ này
    if (r.notes.length) {
        html += `<div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3">
            <h3 class="font-bold text-gray-600 text-sm mb-3 flex items-center gap-2"><i class="fas fa-book text-emerald-500"></i> Nhận xét giáo viên</h3>
            ${r.notes.map(n=>{
                const nt=NOTE_TYPES[n.type]||NOTE_TYPES.notice;
                return `<div class="flex gap-2 mb-2 p-2.5 rounded-xl ${nt.bg} border ${nt.border}">
                    <i class="fas ${nt.icon} ${nt.text} mt-0.5 text-sm flex-shrink-0"></i>
                    <div><p class="text-[11px] font-bold ${nt.text}">${nt.label}${n.studentId===null?' (Cả lớp)':''} · ${n.date}</p>
                    <p class="text-xs text-gray-700 mt-0.5 leading-snug">${n.content}</p></div>
                </div>`;}).join('')}
        </div>`;
    }

    // Điểm các môn (nếu có)
    if (r.grades && Object.keys(r.grades).length) {
        const subjects = Object.entries(r.grades);
        html += `<div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3">
            <h3 class="font-bold text-gray-600 text-sm mb-3 flex items-center gap-2"><i class="fas fa-graduation-cap text-purple-400"></i> Điểm học tập ${r.gradesPeriodName?`(${r.gradesPeriodName})`:''}</h3>
            <div class="grid grid-cols-2 gap-2">
                ${subjects.map(([sub,val])=>`<div class="flex justify-between items-center p-2 rounded-xl ${val>=8?'bg-green-50':val<5?'bg-red-50':'bg-gray-50'}">
                    <span class="text-xs text-gray-600">${sub}</span>
                    <span class="text-sm font-black ${val>=8?'text-green-700':val<5?'text-red-600':'text-gray-700'}">${val}${val>=8?' ⭐':val<5?' ⚠️':''}</span>
                </div>`).join('')}
            </div>
        </div>`;
    }

    // Đánh giá chung
    html += `<div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
        <h3 class="font-bold text-gray-600 text-sm mb-2 flex items-center gap-2"><i class="fas fa-comment-dots text-dojo-blue"></i> Đánh giá tổng quan</h3>
        <p class="text-sm text-gray-700 italic leading-relaxed">"${r.autoComment}"</p>
    </div>

    <!-- Ký nhận (để in) -->
    <div class="grid grid-cols-2 gap-4 mt-2 mb-6">
        <div class="text-center border-t-2 border-gray-200 pt-2"><p class="text-xs text-gray-400">Giáo viên chủ nhiệm</p><div class="h-8"></div></div>
        <div class="text-center border-t-2 border-gray-200 pt-2"><p class="text-xs text-gray-400">Phụ huynh ký xác nhận</p><div class="h-8"></div></div>
    </div>`;

    document.getElementById('studentReportContent').innerHTML = html;
}

// ----- Actions -----
function buildParentMessageText(r) {
    const s  = r.student;
    const cls = classes.find(c=>c.id===s.classId);
    const as = r.assessment;
    const label = periodLabel(_weeklyStart, _weeklyEnd);
    let msg  = `Kính gửi Phụ huynh em ${s.name}\n`;
    msg += `Lớp: ${cls?.name||''} · ${label}\n`;
    msg += '─'.repeat(30)+'\n';
    msg += `📊 ĐIỂM THI ĐUA: ${r.periodNet>0?'+':''}${r.periodNet} (Cộng +${r.periodPos}, Trừ -${r.periodNeg})\n`;
    msg += `🏆 Tổng tích lũy: ${s.points} điểm ${r.milestone?r.milestone.icon:''}\n`;
    msg += `✅ Xếp loại kỳ này: ${as.icon} ${as.label}\n`;
    if (r.notes.length) {
        msg += '─'.repeat(30)+'\n💬 NHẬN XÉT GIÁO VIÊN:\n';
        r.notes.forEach(n=>{ const nt=NOTE_TYPES[n.type]||NOTE_TYPES.notice; msg+=`${nt.icon||'•'} [${nt.label}] ${n.content}\n`; });
    }
    if (r.grades && Object.keys(r.grades).length) {
        msg += '─'.repeat(30)+'\n📚 ĐIỂM HỌC TẬP:\n';
        Object.entries(r.grades).forEach(([sub,val])=>{ msg+=`• ${sub}: ${val}${val>=8?' ⭐':val<5?' ⚠️':''}\n`; });
    }
    msg += '─'.repeat(30)+'\n';
    msg += `"${r.autoComment}"\n\nTrân trọng,\nGiáo viên chủ nhiệm`;
    return msg;
}

function copyStudentParentMsg() {
    if (!_currentReportData) return;
    const msg = buildParentMessageText(_currentReportData);
    navigator.clipboard?.writeText(msg).catch(()=>{});
    showToast('Đã sao chép tin nhắn phụ huynh! 📋');
}

function shareWeeklyReport() {
    if (!_currentReportData) return;
    const r  = _currentReportData;
    const s  = r.student;
    const data = buildStudentViewData(s.id);
    if (!data) return;
    const url  = buildShareUrl(data);
    _currentShareUrl = url;
    openShareLinkModal(`Phiếu tuần: ${s.name}`, url);
}

function copyAllParentMessages() {
    if (!_weeklyStart || !_weeklyEnd) return;
    const cls = classes.find(c=>c.id===currentClassId);
    const classStudents = students.filter(s=>s.classId===currentClassId).sort((a,b)=>(a.stt||0)-(b.stt||0));
    const allMessages = classStudents.map(s=>{
        const r = generateStudentReport(s, _weeklyStart, _weeklyEnd);
        return `===== ${s.name} =====\n${buildParentMessageText(r)}`;
    }).join('\n\n');
    navigator.clipboard?.writeText(allMessages).catch(()=>{});
    showToast(`Đã sao chép ${classStudents.length} tin nhắn phụ huynh!`);
}

function exportAllWeeklyReports() {
    if (!_weeklyStart || !_weeklyEnd) return;
    const cls = classes.find(c=>c.id===currentClassId); if(!cls) return;
    const classStudents = students.filter(s=>s.classId===currentClassId).sort((a,b)=>(a.stt||0)-(b.stt||0));
    const label = periodLabel(_weeklyStart, _weeklyEnd);
    const wsData = [
        [`PHIẾU NHẬN XÉT TUẦN - LỚP ${cls.name.toUpperCase()} - ${label}`,'','','','',''],
        ['STT','Họ và tên','Điểm kỳ (Net)','Tổng điểm','Xếp loại','Nhận xét tự động']
    ];
    classStudents.forEach((s,i)=>{
        const r = generateStudentReport(s, _weeklyStart, _weeklyEnd);
        wsData.push([s.stt||i+1, s.name, (r.periodNet>0?'+':'')+r.periodNet, s.points, r.assessment.label, r.autoComment]);
    });
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['A1'].s={font:{bold:true,color:{rgb:"FFFFFF"},sz:13},fill:{fgColor:{rgb:"D97706"}},alignment:{horizontal:"center"}};
    ws['!cols']=[{wch:6},{wch:25},{wch:12},{wch:12},{wch:14},{wch:60}];
    ws['!merges']=[{s:{r:0,c:0},e:{r:0,c:5}}];
    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,ws,'Phieu_Nhan_Xet');
    XLSX.writeFile(wb,`PhieuNhanXet_${cls.name.replace(/\s+/g,'_')}_${dateToStr(_weeklyStart)}.xlsx`);
    showToast('Đã xuất phiếu nhận xét toàn lớp!');
}

