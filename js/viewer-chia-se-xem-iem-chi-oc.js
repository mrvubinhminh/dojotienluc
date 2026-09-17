// ============================================================
// VIEWER – CHIA SẺ XEM ĐIỂM CHỈ ĐỌC
// ============================================================
let _currentShareUrl  = '';
let _currentViewData  = null;

// ----- Encode / Decode -----
function encodeViewData(data) {
    return btoa(encodeURIComponent(JSON.stringify(data)));
}
function decodeViewData(encoded) {
    return JSON.parse(decodeURIComponent(atob(encoded)));
}

// ----- Build data payloads -----
function buildStudentViewData(studentId) {
    const s   = students.find(st=>st.id===studentId); if(!s) return null;
    const cls = classes.find(c=>c.id===s.classId);
    const sg  = gradeRecords.filter(r=>r.classId===s.classId).map(rec=>{
        const g = rec.studentGrades.find(sg=>sg.studentId===studentId||sg.name===s.name);
        return g ? {periodName:rec.periodName, grades:g.grades} : null;
    }).filter(Boolean);
    const hist = history.filter(h=>h.studentId===studentId&&h.classId===s.classId)
        .sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp)).slice(0,12);
    const notes = communicationLog
        .filter(n=>n.studentId===studentId && n.classId===s.classId)
        .sort((a,b)=>b.createdAt.localeCompare(a.createdAt))
        .slice(0,8)
        .map(n=>({type:n.type, content:n.content, date:n.date||n.createdAt.slice(0,10)}));
    return {
        type:'student', className:cls?.name||'', generatedAt:new Date().toISOString(),
        student:{name:s.name,stt:s.stt,dob:s.dob,points:s.points,positivePoints:s.positivePoints,negativePoints:s.negativePoints,avatar:s.avatar},
        grades:sg, history:hist, notes
    };
}

function buildClassViewData() {
    const cls = classes.find(c=>c.id===currentClassId); if(!cls) return null;
    const classStudents = students.filter(s=>s.classId===currentClassId)
        .sort((a,b)=>b.points-a.points)
        .map(s=>{
            const ms = getMilestone(s.points||0);
            const st = computeStreaks(s.id, currentClassId);
            const earned = getEarnedStreakBadges(st.maxDay, st.maxWeek);
            return {
                name: s.name, stt: s.stt, avatar: s.avatar||'',
                points: s.points, positivePoints: s.positivePoints, negativePoints: s.negativePoints,
                milestone: ms ? {icon:ms.icon, label:ms.label} : null,
                streakBadges: earned.map(b=>({icon:b.icon, name:b.name, desc:b.desc, grad:b.grad, shadow:b.shadow})),
                curDay: st.curDay, curWeek: st.curWeek
            };
        });
    return { type:'class', className:cls.name, generatedAt:new Date().toISOString(), students:classStudents };
}

// ----- Generate shareable URL -----
function buildShareUrl(data) {
    const encoded = encodeViewData(data);
    // Prefer GAS URL (accessible anywhere), fallback to local hash
    const base = syncSettings.url || DEFAULT_SYNC_URL;
    return `${base}?view=${encoded}`;
}

// ----- Open share modal -----
function shareStudentView(studentId) {
    if(!studentId) return;
    const data = buildStudentViewData(studentId); if(!data) return;
    _currentViewData  = data;
    _currentShareUrl  = buildShareUrl(data);
    const student = students.find(s=>s.id===studentId);
    openShareLinkModal(`Chia sẻ điểm: ${student?.name||''}`, _currentShareUrl);
    closePointsModal();
}

function shareClassView() {
    const data = buildClassViewData(); if(!data) return;
    _currentViewData = data;
    _currentShareUrl = buildShareUrl(data);
    const cls = classes.find(c=>c.id===currentClassId);
    openShareLinkModal(`Bảng xếp hạng: ${cls?.name||''}`, _currentShareUrl);
}

function openShareLinkModal(title, url) {
    document.getElementById('shareLinkTitle').innerText = title;
    document.getElementById('shareLinkUrl').innerText   = url;
    document.getElementById('shareLinkNote').innerText  =
        '💡 Link này mở trang xem điểm trực tiếp trong trình duyệt. ' +
        'Phụ huynh/học sinh chỉ có thể XEM, không thể chỉnh sửa.';
    document.getElementById('shareLinkBackdrop').classList.remove('hidden');
    document.getElementById('shareLinkModal').classList.remove('translate-y-full');
}

function closeShareLinkModal() {
    document.getElementById('shareLinkModal').classList.add('translate-y-full');
    setTimeout(()=>document.getElementById('shareLinkBackdrop').classList.add('hidden'),300);
}

function copyShareLink() {
    navigator.clipboard?.writeText(_currentShareUrl).catch(()=>{});
    showToast('Đã sao chép link xem điểm! 🔗');
    closeShareLinkModal();
}

function previewShareLink() {
    if(!_currentViewData) return;
    closeShareLinkModal();
    setTimeout(()=>openViewer(_currentViewData, _currentShareUrl), 300);
}

// ----- Local viewer overlay -----
function openViewer(data, shareUrl) {
    document.getElementById('btnCopyViewerLink').dataset.url = shareUrl||'';
    renderViewerContent(data);
    document.getElementById('viewerOverlay').classList.remove('hidden');
    document.getElementById('viewerOverlay').scrollTop = 0;
}

function closeViewer() {
    document.getElementById('viewerOverlay').classList.add('hidden');
}

function copyViewerLink() {
    const url = document.getElementById('btnCopyViewerLink').dataset.url || _currentShareUrl;
    if(!url) return;
    navigator.clipboard?.writeText(url).catch(()=>{});
    showToast('Đã sao chép link! 🔗');
}

function renderViewerContent(data) {
    const el = document.getElementById('viewerContent');
    if (data.type === 'student') el.innerHTML = buildStudentViewHTML(data);
    else if (data.type === 'class') el.innerHTML = buildClassViewHTML(data);
}

function buildStudentViewHTML(data) {
    const s = data.student;
    const ms = getMilestone(s.points||0);
    const ptsColor = (s.points||0)>0?'text-green-700':(s.points||0)<0?'text-red-600':'text-gray-600';
    const comment = generateComment({positivePoints:s.positivePoints||0,negativePoints:s.negativePoints||0,id:0,name:s.name});
    return `
    <div class="bg-gradient-to-br from-dojo-blue to-blue-700 text-white rounded-2xl p-5 text-center mb-4 shadow-lg">
        <img src="${s.avatar||''}" class="w-20 h-20 rounded-full border-3 border-white border-opacity-50 mx-auto mb-3 bg-blue-200 object-contain p-1" onerror="this.style.display='none'">
        <h2 class="text-2xl font-black">${s.name}</h2>
        <p class="text-sm opacity-80 mt-1">Lớp ${data.className} &nbsp;·&nbsp; STT: ${s.stt||'—'}</p>
        ${ms?`<p class="text-3xl mt-2">${ms.icon} <span class="text-sm align-middle">${ms.label}</span></p>`:''}
    </div>
    <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3">
        <h3 class="font-bold text-gray-600 text-sm mb-3 flex items-center gap-2"><i class="fas fa-trophy text-yellow-400"></i> Điểm thi đua</h3>
        <div class="flex justify-around">
            <div class="text-center"><p class="text-2xl font-black text-green-600">+${s.positivePoints||0}</p><p class="text-xs text-gray-400">Điểm cộng</p></div>
            <div class="text-center"><p class="text-2xl font-black text-red-500">-${s.negativePoints||0}</p><p class="text-xs text-gray-400">Điểm trừ</p></div>
            <div class="text-center"><p class="text-3xl font-black ${ptsColor}">${s.points||0}</p><p class="text-xs text-gray-400">Tổng điểm</p></div>
        </div>
    </div>
    <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3">
        <h3 class="font-bold text-gray-600 text-sm mb-2 flex items-center gap-2"><i class="fas fa-comment-dots text-blue-400"></i> Nhận xét</h3>
        <p class="text-sm text-gray-600 italic leading-relaxed">${comment}</p>
    </div>
    ${data.grades&&data.grades.length?`<div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3">
        <h3 class="font-bold text-gray-600 text-sm mb-3 flex items-center gap-2"><i class="fas fa-graduation-cap text-purple-400"></i> Kết quả học tập</h3>
        ${data.grades.map(g=>`<p class="text-xs font-bold text-gray-400 uppercase mb-2">${g.periodName}</p>
        ${Object.entries(g.grades).map(([sub,val])=>`<div class="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-none">
            <span class="text-sm text-gray-700">${sub}</span>
            <span class="text-sm font-bold ${val>=8?'text-green-700':val<5?'text-red-600':'text-gray-700'}">${val}${val>=8?' ⭐':val<5?' ⚠️':''}</span>
        </div>`).join('')}`).join('<hr class="my-3 border-gray-100">')}
    </div>`:''}
    ${data.notes&&data.notes.length?`<div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3">
        <h3 class="font-bold text-gray-600 text-sm mb-3 flex items-center gap-2"><i class="fas fa-book text-emerald-500"></i> Nhận xét từ giáo viên</h3>
        ${data.notes.map(n=>{
            const nt=NOTE_TYPES[n.type]||NOTE_TYPES.notice;
            return `<div class="flex gap-2 p-2.5 rounded-xl mb-2 ${nt.bg} border ${nt.border}">
                <i class="fas ${nt.icon} ${nt.text} mt-0.5 text-sm flex-shrink-0"></i>
                <div><p class="text-xs font-bold ${nt.text}">${nt.label} · ${n.date}</p><p class="text-xs text-gray-700 mt-0.5 leading-snug">${n.content}</p></div>
            </div>`;}).join('')}
    </div>`:''}
    ${data.history&&data.history.length?`<div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3">
        <h3 class="font-bold text-gray-600 text-sm mb-3 flex items-center gap-2"><i class="fas fa-history text-orange-400"></i> Lịch sử gần đây</h3>
        ${data.history.slice(0,10).map(h=>`<div class="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-none">
            <div><p class="text-xs font-bold text-gray-700">${h.skillName}</p>
            <p class="text-[10px] text-gray-400">${new Date(h.timestamp).toLocaleDateString('vi-VN')}</p></div>
            <span class="text-sm font-black ${h.points>0?'text-green-600':'text-red-600'}">${h.points>0?'+':''}${h.points}</span>
        </div>`).join('')}
    </div>`:''}
    <p class="text-[11px] text-gray-400 text-center mt-2">📅 Dữ liệu tính đến ${new Date(data.generatedAt).toLocaleDateString('vi-VN')} &nbsp;·&nbsp; 🔒 Chỉ xem</p>`;
}

function buildClassViewHTML(data) {
    const SV_RANK = [
        { icon:'👑', rowBg:'linear-gradient(90deg,#fffbeb,#fef9c3 60%,#fff)',  border:'#f59e0b', scoreBg:'linear-gradient(135deg,#f59e0b,#fbbf24)', label:'Quán quân' },
        { icon:'🥈', rowBg:'linear-gradient(90deg,#f8fafc,#f1f5f9 60%,#fff)',  border:'#94a3b8', scoreBg:'linear-gradient(135deg,#64748b,#94a3b8)', label:'Á quân'   },
        { icon:'🥉', rowBg:'linear-gradient(90deg,#fff7ed,#ffedd5 60%,#fff)',  border:'#f97316', scoreBg:'linear-gradient(135deg,#ea580c,#f97316)', label:'Hạng ba'  },
    ];
    const students = data.students||[];
    const total = students.length;
    // Header
    let html = `
    
    <div style="background:linear-gradient(135deg,#1e40af 0%,#7c3aed 100%);border-radius:20px;padding:20px;text-align:center;margin-bottom:16px;box-shadow:0 8px 32px rgba(30,64,175,.35)">
      <div style="font-size:2.5rem;margin-bottom:4px">🏆</div>
      <div style="font-size:1.25rem;font-weight:900;color:#fff;letter-spacing:.5px">BẢNG XẾP HẠNG</div>
      <div style="font-size:.85rem;color:rgba(255,255,255,.75);margin-top:4px">Lớp ${data.className} &nbsp;·&nbsp; ${total} học sinh</div>
      <div style="font-size:.7rem;color:rgba(255,255,255,.5);margin-top:6px">📅 ${new Date(data.generatedAt).toLocaleDateString('vi-VN')} &nbsp;·&nbsp; 🔒 Chỉ xem</div>
    </div>`;

    // Podium top-3
    const top3 = students.slice(0,Math.min(3,total)).filter(s=>s.points>0);
    if(top3.length>=2) {
        const podiumOrder = top3.length===3 ? [top3[1],top3[0],top3[2]] : (top3.length===2?[top3[1],top3[0]]:[top3[0]]);
        const heights = top3.length===3?['80px','110px','60px']:(top3.length===2?['80px','110px']:['110px']);
        html += `<div style="display:flex;align-items:flex-end;justify-content:center;gap:8px;margin-bottom:16px;padding:0 8px">`;
        podiumOrder.forEach((s,pi)=>{
            const origIdx = top3.indexOf(s);
            const rc = SV_RANK[origIdx];
            const h = heights[pi];
            const pts = s.points||0;
            html+=`<div style="flex:1;text-align:center">
              <div style="font-size:1.8rem;margin-bottom:2px">${rc.icon}</div>
              <img src="${s.avatar}" style="width:52px;height:52px;border-radius:50%;border:3px solid ${rc.border};object-fit:contain;background:#eff6ff;margin:0 auto 4px;display:block" onerror="this.style.display='none'">
              <div style="font-size:.75rem;font-weight:900;color:#1e293b;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.name}</div>
              ${s.milestone?`<div style="font-size:.9rem">${s.milestone.icon}</div>`:''}
              <div style="height:${h};background:${rc.scoreBg};border-radius:10px 10px 4px 4px;display:flex;align-items:center;justify-content:center;flex-direction:column;box-shadow:0 4px 12px ${rc.border}66;margin-top:4px">
                <span style="font-size:1.3rem;font-weight:900;color:#fff">${pts>0?'+':''}${pts}</span>
              </div>
            </div>`;
        });
        html+=`</div>`;
    }

    // Full leaderboard
    html += `<div style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #f1f5f9;box-shadow:0 2px 12px rgba(0,0,0,.06);margin-bottom:12px">
      <div style="background:linear-gradient(90deg,#1d4ed8,#7c3aed);padding:10px 16px;display:flex;align-items:center;gap:8px">
        <span style="font-size:.8rem;font-weight:900;color:rgba(255,255,255,.8);letter-spacing:.08em">XẾP HẠNG ĐẦY ĐỦ</span>
        <span style="margin-left:auto;font-size:.7rem;color:rgba(255,255,255,.55)">${total} học sinh</span>
      </div>`;

    students.forEach((s,i)=>{
        const rc = i<3 && s.points>0 ? SV_RANK[i] : null;
        const pts = s.points||0;
        let scoreBg, scoreColor='#fff';
        if(rc){scoreBg=rc.scoreBg;}
        else if(pts>0){scoreBg='linear-gradient(135deg,#22c55e,#16a34a)';}
        else if(pts<0){scoreBg='linear-gradient(135deg,#ef4444,#b91c1c)';}
        else{scoreBg='#f3f4f6';scoreColor='#6b7280';}
        const borderLeft = rc?rc.border:(s.streakBadges&&s.streakBadges.length?s.streakBadges[s.streakBadges.length-1].shadow.replace('0.5)','0.9)'):((i%2===0)?'#e5e7eb':'#f3f4f6'));
        const rowBg = rc?rc.rowBg:(i%2===0?'#fff':'#fafafa');
        const animDelay = Math.min(i*40,400)+'ms';
        const streakIcons = (s.streakBadges||[]).map(b=>`<span title="${b.name}: ${b.desc}" style="font-size:.85rem">${b.icon}</span>`).join('');
        const msIcon = s.milestone?`<span style="font-size:.85rem" title="${s.milestone.label}">${s.milestone.icon}</span>`:'';
        const activePill = s.curDay>0
            ? `<span style="font-size:.6rem;font-weight:700;color:#ea580c;background:#fff7ed;border:1px solid #fed7aa;padding:1px 6px;border-radius:999px">🔥${s.curDay}ngày</span>`
            : (s.curWeek>=2?`<span style="font-size:.6rem;font-weight:700;color:#2563eb;background:#eff6ff;border:1px solid #bfdbfe;padding:1px 6px;border-radius:999px">📅${s.curWeek}tuần</span>`:'');
        let rankCell;
        if(rc) rankCell=`<div style="width:40px;text-align:center;flex-shrink:0"><div style="font-size:1.4rem;line-height:1">${rc.icon}</div><div style="font-size:.55rem;font-weight:900;color:${rc.border}">${rc.label}</div></div>`;
        else rankCell=`<div style="width:40px;text-align:center;flex-shrink:0"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:#f1f5f9;font-size:.7rem;font-weight:900;color:#6b7280">${i+1}</span></div>`;
        html+=`<div class="sv-row" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid #f8fafc;background:${rowBg};border-left:4px solid ${borderLeft};animation-delay:${animDelay}">
          ${rankCell}
          <img src="${s.avatar}" style="width:38px;height:38px;border-radius:50%;background:#eff6ff;border:2px solid ${rc?rc.border:'#e0e7ff'};object-fit:contain;flex-shrink:0" onerror="this.style.display='none'">
          <div style="flex:1;min-width:0">
            <div style="font-size:.85rem;font-weight:900;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.name}</div>
            <div style="display:flex;gap:4px;align-items:center;flex-wrap:wrap;margin-top:2px">${msIcon}${streakIcons}${activePill}</div>
            <div style="display:flex;gap:6px;margin-top:3px">
              <span style="font-size:.65rem;font-weight:700;color:#16a34a;background:#f0fdf4;border:1px solid #bbf7d0;padding:1px 6px;border-radius:999px">+${s.positivePoints||0}</span>
              <span style="font-size:.65rem;font-weight:700;color:#dc2626;background:#fef2f2;border:1px solid #fecaca;padding:1px 6px;border-radius:999px">-${s.negativePoints||0}</span>
            </div>
          </div>
          <div style="width:44px;height:44px;border-radius:12px;background:${scoreBg};display:flex;align-items:center;justify-content:center;font-size:1rem;font-weight:900;color:${scoreColor};flex-shrink:0;box-shadow:0 2px 8px ${borderLeft}66">${pts>0?'+':''}${pts}</div>
        </div>`;
    });
    html+=`</div>`;
    html+=`<p style="font-size:.65rem;color:#94a3b8;text-align:center;margin-top:4px;padding-bottom:8px">Dữ liệu tính đến ${new Date(data.generatedAt).toLocaleDateString('vi-VN')} &nbsp;·&nbsp; 🔒 Chỉ xem, không thể chỉnh sửa</p>`;
    return html;
}

// ----- Auto-detect viewer mode from URL hash -----
function checkViewerMode() {
    const hash = window.location.hash;
    if (!hash.startsWith('#view=')) return false;
    try {
        const data = decodeViewData(hash.replace('#view=',''));
        // Enter viewer mode: hide app, show overlay
        document.querySelector('header').style.display='none';
        document.querySelector('nav').style.display='none';
        ['classroomView','reportView','gradesView','historyView','settingsView','meetingView'].forEach(id=>{
            const el=document.getElementById(id); if(el) el.style.display='none';
        });
        // Open viewer with no copy link (read-only URL mode)
        _currentViewData = data;
        renderViewerContent(data);
        document.getElementById('viewerOverlay').classList.remove('hidden');
        document.getElementById('btnCopyViewerLink').style.display='none';
        document.querySelector('#viewerOverlay .sticky button:first-child').innerText='';
        document.querySelector('#viewerOverlay .sticky button:first-child').innerHTML='<i class="fas fa-home mr-1"></i> Trang chủ';
        return true;
    } catch(e) { return false; }
}

