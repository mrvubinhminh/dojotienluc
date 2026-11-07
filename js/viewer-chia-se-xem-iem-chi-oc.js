// ============================================================
// VIEWER – CHIA SẺ XEM ĐIỂM CHỈ ĐỌC
// ============================================================
let _currentShareUrl  = '';
let _currentViewData  = null;

// ----- Encode / Decode -----
// Bản cũ (Apps Script ?view=): base64(encodeURIComponent(JSON)).
function encodeViewData(data) {
    return btoa(encodeURIComponent(JSON.stringify(data)));
}
// Bản gọn cho link #view= của ứng dụng: "u." + base64url(UTF-8 JSON), ngắn hơn ~2 lần với tiếng Việt.
function encodeViewDataCompact(data) {
    const bytes = new TextEncoder().encode(JSON.stringify(data));
    let bin = '';
    for (let i=0; i<bytes.length; i+=0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i+0x8000));
    return 'u.' + btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function decodeViewData(encoded) {
    encoded = decodeURIComponent(encoded);
    if (encoded.startsWith('u.')) {
        const b64 = encoded.slice(2).replace(/-/g,'+').replace(/_/g,'/');
        const bin = atob(b64 + '==='.slice((b64.length+3)%4));
        return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, c=>c.charCodeAt(0))));
    }
    return JSON.parse(decodeURIComponent(atob(encoded)));
}

// Dữ liệu trong link do người khác tạo được: luôn escape trước khi đưa vào HTML.
function _vEsc(v) {
    return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function _vNum(v) { const n = Number(v); return Number.isFinite(n) ? n : 0; }
// Chỉ nhận ảnh http(s); ảnh base64 làm link quá dài nên không đưa vào link.
function _vAvatar(v) { return /^https?:\/\//i.test(String(v||'')) ? String(v) : ''; }
function _vAvatarTag(src, style, name) {
    const a = _vAvatar(src);
    const initial = _vEsc(String(name||'?').trim().split(/\s+/).pop().charAt(0).toUpperCase());
    return a
        ? `<img src="${_vEsc(a)}" style="${style}" onerror="this.style.visibility='hidden'">`
        : `<div style="${style};display:flex;align-items:center;justify-content:center;font-weight:900;color:#2563eb">${initial}</div>`;
}

// Xếp hạng có đồng hạng: cùng điểm cùng hạng (1, 2, 2, 4...).
function computeClassRanking(classId) {
    const list = students.filter(s=>String(s.classId)===String(classId))
        .map(s=>({s, points:_vNum(s.points)}))
        .sort((a,b)=>b.points-a.points || (_vNum(a.s.stt)-_vNum(b.s.stt)));
    let rank = 0, prev = null;
    list.forEach((x,i)=>{ if (x.points!==prev) { rank=i+1; prev=x.points; } x.rank=rank; });
    return list;
}

// ----- Build data payloads -----
function buildStudentViewData(studentId) {
    const s   = students.find(st=>st.id===studentId); if(!s) return null;
    const cls = classes.find(c=>c.id===s.classId);
    const sg  = gradeRecords.filter(r=>r.classId===s.classId).map(rec=>{
        const g = rec.studentGrades.find(sg=>sg.studentId===studentId||sg.name===s.name);
        return g ? {periodName:rec.periodName, grades:g.grades} : null;
    }).filter(Boolean);
    const hist = history.filter(h=>!h.type&&h.studentId===studentId&&h.classId===s.classId)
        .sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp)).slice(0,12);
    const notes = communicationLog
        .filter(n=>n.studentId===studentId && n.classId===s.classId)
        .sort((a,b)=>b.createdAt.localeCompare(a.createdAt))
        .slice(0,8)
        .map(n=>({type:n.type, content:n.content, date:n.date||n.createdAt.slice(0,10)}));
    const ranking = computeClassRanking(s.classId);
    const me = ranking.find(x=>x.s.id===studentId);
    const higher = ranking.filter(x=>x.points>me.points);
    const nextUp = higher.length ? higher[higher.length-1] : null;
    const avg = ranking.length ? ranking.reduce((t,x)=>t+x.points,0)/ranking.length : 0;
    return {
        type:'student', className:cls?.name||'', generatedAt:new Date().toISOString(),
        student:{name:s.name,stt:s.stt,points:s.points,positivePoints:s.positivePoints,negativePoints:s.negativePoints,avatar:_vAvatar(s.avatar)},
        rank:{
            position: me.rank, total: ranking.length,
            tied: ranking.filter(x=>x.points===me.points).length,
            average: Math.round(avg*10)/10,
            nextRank: nextUp ? nextUp.rank : null,
            gapToNext: nextUp ? nextUp.points - me.points : 0,
            top: ranking.filter(x=>x.rank<=3 && x.points>0).slice(0,5)
                .map(x=>({rank:x.rank, name:x.s.name, points:x.points, me:x.s.id===studentId}))
        },
        grades:sg, history:hist, notes
    };
}

function buildClassViewData() {
    const cls = classes.find(c=>c.id===currentClassId); if(!cls) return null;
    const classStudents = computeClassRanking(currentClassId)
        .map(({s, rank})=>{
            const ms = getMilestone(s.points||0);
            const st = computeStreaks(s.id, currentClassId);
            const earned = getEarnedStreakBadges(st.maxDay, st.maxWeek);
            return {
                rank, name: s.name, stt: s.stt, avatar: _vAvatar(s.avatar),
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
    // Trang ứng dụng đang chạy trên web (Vercel): link #view= mở thẳng giao diện đầy đủ, có thứ hạng.
    if (/^https?:$/.test(location.protocol)) return `${location.origin}${location.pathname}#view=${encodeViewDataCompact(data)}`;
    // Mở từ file trên máy: link file:// không gửi được cho phụ huynh, dùng trang xem của Apps Script.
    if (syncSettings.url) return `${syncSettings.url}?view=${encodeViewData(data)}`;
    return `${location.href.split('#')[0]}#view=${encodeViewDataCompact(data)}`;
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

function _vRankCard(r, pts) {
    if (!r || !r.total) return '';
    const pos = _vNum(r.position), total = _vNum(r.total);
    // Thanh vị trí: hạng 1 = 100%, hạng cuối = gần 0.
    const pct = total>1 ? Math.round((total-pos)/(total-1)*100) : 100;
    const medal = pts>0 && pos<=3 ? ['👑','🥈','🥉'][pos-1] : '🎯';
    const tiedTxt = _vNum(r.tied)>1 ? ` <span style="font-size:.7rem;font-weight:700;color:#64748b">(đồng hạng ${_vNum(r.tied)} bạn)</span>` : '';
    const gapTxt = r.nextRank
        ? `Cần thêm <b style="color:#2563eb">${_vNum(r.gapToNext)} điểm</b> để bắt kịp hạng ${_vNum(r.nextRank)}.`
        : (pts>0 ? 'Em đang dẫn đầu lớp. Cố gắng giữ vững nhé!' : 'Hãy tích cực để có điểm cộng nhé!');
    const top = (r.top||[]).map(t=>`<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:10px;${t.me?'background:#eff6ff;border:1px solid #bfdbfe':''}">
            <span style="width:22px;text-align:center">${['👑','🥈','🥉'][_vNum(t.rank)-1]||_vNum(t.rank)}</span>
            <span style="flex:1;font-size:.8rem;font-weight:${t.me?900:600};color:#1e293b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${_vEsc(t.name)}${t.me?' (em)':''}</span>
            <span style="font-size:.8rem;font-weight:900;color:#16a34a">+${_vNum(t.points)}</span></div>`).join('');
    return `
    <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3">
        <h3 class="font-bold text-gray-600 text-sm mb-3 flex items-center gap-2"><i class="fas fa-ranking-star text-indigo-500"></i> Thứ hạng trong lớp</h3>
        <div style="display:flex;align-items:center;gap:14px">
            <div style="font-size:2.4rem;line-height:1">${medal}</div>
            <div style="flex:1">
                <div style="font-size:1.6rem;font-weight:900;color:#1e293b;line-height:1.1">Hạng ${pos}<span style="font-size:1rem;color:#94a3b8">/${total}</span>${tiedTxt}</div>
                <div style="height:8px;background:#f1f5f9;border-radius:999px;margin-top:8px;overflow:hidden"><div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#6366f1,#22c55e);border-radius:999px"></div></div>
            </div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:.75rem;color:#64748b;margin-top:10px">
            <span>Điểm của em: <b style="color:#1e293b">${pts}</b></span><span>Trung bình lớp: <b style="color:#1e293b">${_vNum(r.average)}</b></span>
        </div>
        <p style="font-size:.8rem;color:#475569;margin-top:8px">${gapTxt}</p>
        ${top?`<div style="margin-top:10px;border-top:1px dashed #e2e8f0;padding-top:8px"><p style="font-size:.7rem;font-weight:800;color:#94a3b8;letter-spacing:.05em;margin-bottom:4px">TOP LỚP</p>${top}</div>`:''}
    </div>`;
}

function buildStudentViewHTML(data) {
    const s = data.student||{};
    const pts = _vNum(s.points);
    const ms = getMilestone(pts);
    const ptsColor = pts>0?'text-green-700':pts<0?'text-red-600':'text-gray-600';
    const comment = generateComment({positivePoints:_vNum(s.positivePoints),negativePoints:_vNum(s.negativePoints),id:0,name:s.name});
    const gradeCls = v => v>=8?'text-green-700':v<5?'text-red-600':'text-gray-700';
    return `
    <div class="bg-gradient-to-br from-dojo-blue to-blue-700 text-white rounded-2xl p-5 text-center mb-4 shadow-lg">
        ${_vAvatarTag(s.avatar,'width:80px;height:80px;border-radius:50%;border:3px solid rgba(255,255,255,.5);margin:0 auto 12px;background:#bfdbfe;object-fit:contain;padding:4px;font-size:2rem',s.name)}
        <h2 class="text-2xl font-black text-white">${_vEsc(s.name)}</h2>
        <p class="text-sm opacity-80 mt-1">Lớp ${_vEsc(data.className)} &nbsp;·&nbsp; STT: ${_vEsc(s.stt||'—')}</p>
        ${ms?`<p class="text-3xl mt-2">${ms.icon} <span class="text-sm align-middle">${ms.label}</span></p>`:''}
    </div>
    <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3">
        <h3 class="font-bold text-gray-600 text-sm mb-3 flex items-center gap-2"><i class="fas fa-trophy text-yellow-400"></i> Điểm thi đua</h3>
        <div class="flex justify-around">
            <div class="text-center"><p class="text-2xl font-black text-green-600">+${_vNum(s.positivePoints)}</p><p class="text-xs text-gray-400">Điểm cộng</p></div>
            <div class="text-center"><p class="text-2xl font-black text-red-500">-${_vNum(s.negativePoints)}</p><p class="text-xs text-gray-400">Điểm trừ</p></div>
            <div class="text-center"><p class="text-3xl font-black ${ptsColor}">${pts}</p><p class="text-xs text-gray-400">Tổng điểm</p></div>
        </div>
    </div>
    ${_vRankCard(data.rank, pts)}
    <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3">
        <h3 class="font-bold text-gray-600 text-sm mb-2 flex items-center gap-2"><i class="fas fa-comment-dots text-blue-400"></i> Nhận xét</h3>
        <p class="text-sm text-gray-600 italic leading-relaxed">${_vEsc(comment)}</p>
    </div>
    ${data.grades&&data.grades.length?`<div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3">
        <h3 class="font-bold text-gray-600 text-sm mb-3 flex items-center gap-2"><i class="fas fa-graduation-cap text-purple-400"></i> Kết quả học tập</h3>
        ${data.grades.map(g=>`<p class="text-xs font-bold text-gray-400 uppercase mb-2">${_vEsc(g.periodName)}</p>
        ${Object.entries(g.grades||{}).map(([sub,val])=>`<div class="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-none">
            <span class="text-sm text-gray-700">${_vEsc(sub)}</span>
            <span class="text-sm font-bold ${gradeCls(_vNum(val))}">${_vEsc(val)}${_vNum(val)>=8?' ⭐':_vNum(val)<5?' ⚠️':''}</span>
        </div>`).join('')}`).join('<hr class="my-3 border-gray-100">')}
    </div>`:''}
    ${data.notes&&data.notes.length?`<div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3">
        <h3 class="font-bold text-gray-600 text-sm mb-3 flex items-center gap-2"><i class="fas fa-book text-emerald-500"></i> Nhận xét từ giáo viên</h3>
        ${data.notes.map(n=>{
            const nt=NOTE_TYPES[n.type]||NOTE_TYPES.notice;
            return `<div class="flex gap-2 p-2.5 rounded-xl mb-2 ${nt.bg} border ${nt.border}">
                <i class="fas ${nt.icon} ${nt.text} mt-0.5 text-sm flex-shrink-0"></i>
                <div><p class="text-xs font-bold ${nt.text}">${nt.label} · ${_vEsc(n.date)}</p><p class="text-xs text-gray-700 mt-0.5 leading-snug">${_vEsc(n.content)}</p></div>
            </div>`;}).join('')}
    </div>`:''}
    ${data.history&&data.history.length?`<div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3">
        <h3 class="font-bold text-gray-600 text-sm mb-3 flex items-center gap-2"><i class="fas fa-history text-orange-400"></i> Lịch sử gần đây</h3>
        ${data.history.slice(0,10).map(h=>{const p=_vNum(h.points);return `<div class="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-none">
            <div><p class="text-xs font-bold text-gray-700">${_vEsc(h.skillName)}</p>
            <p class="text-[10px] text-gray-400">${new Date(h.timestamp).toLocaleDateString('vi-VN')}</p></div>
            <span class="text-sm font-black ${p>0?'text-green-600':'text-red-600'}">${p>0?'+':''}${p}</span>
        </div>`;}).join('')}
    </div>`:''}
    <p class="text-[11px] text-gray-400 text-center mt-2">📅 Dữ liệu tính đến ${new Date(data.generatedAt).toLocaleDateString('vi-VN')} &nbsp;·&nbsp; 🔒 Chỉ xem</p>`;
}

// Ô tìm tên trên bảng xếp hạng lớp: chỉ lọc các dòng trên trang, không gửi đi đâu.
function _svNorm(v) { return String(v||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().trim(); }
function _svFilter(q) {
    const k = _svNorm(q);
    let shown = 0;
    document.querySelectorAll('#viewerContent .sv-row').forEach(row=>{
        const hit = !k || row.dataset.name.includes(k);
        row.style.display = hit ? 'flex' : 'none';
        row.style.outline = k && hit ? '2px solid #6366f1' : '';
        if (hit) shown++;
    });
    const empty = document.getElementById('svEmpty');
    if (empty) empty.style.display = shown ? 'none' : '';
}

function buildClassViewHTML(data) {
    const SV_RANK = [
        { icon:'👑', rowBg:'linear-gradient(90deg,#fffbeb,#fef9c3 60%,#fff)',  border:'#f59e0b', scoreBg:'linear-gradient(135deg,#f59e0b,#fbbf24)', label:'Quán quân' },
        { icon:'🥈', rowBg:'linear-gradient(90deg,#f8fafc,#f1f5f9 60%,#fff)',  border:'#94a3b8', scoreBg:'linear-gradient(135deg,#64748b,#94a3b8)', label:'Á quân'   },
        { icon:'🥉', rowBg:'linear-gradient(90deg,#fff7ed,#ffedd5 60%,#fff)',  border:'#f97316', scoreBg:'linear-gradient(135deg,#ea580c,#f97316)', label:'Hạng ba'  },
    ];
    // Link cũ chưa có trường rank: tính lại đồng hạng từ thứ tự điểm.
    let prev = null, rk = 0;
    const list = (data.students||[]).map((s,i)=>{
        const pts = _vNum(s.points);
        if (pts!==prev) { rk=i+1; prev=pts; }
        return {...s, points:pts, rank:_vNum(s.rank)||rk};
    });
    const total = list.length;
    const rankStyle = s => s.points>0 && s.rank<=3 ? SV_RANK[s.rank-1] : null;
    let html = `
    <div style="background:linear-gradient(135deg,#1e40af 0%,#7c3aed 100%);border-radius:20px;padding:20px;text-align:center;margin-bottom:16px;box-shadow:0 8px 32px rgba(30,64,175,.35)">
      <div style="font-size:2.5rem;margin-bottom:4px">🏆</div>
      <div style="font-size:1.25rem;font-weight:900;color:#fff;letter-spacing:.5px">BẢNG XẾP HẠNG</div>
      <div style="font-size:.85rem;color:rgba(255,255,255,.75);margin-top:4px">Lớp ${_vEsc(data.className)} &nbsp;·&nbsp; ${total} học sinh</div>
      <div style="font-size:.7rem;color:rgba(255,255,255,.5);margin-top:6px">📅 ${new Date(data.generatedAt).toLocaleDateString('vi-VN')} &nbsp;·&nbsp; 🔒 Chỉ xem</div>
    </div>`;

    const top3 = list.slice(0,Math.min(3,total)).filter(s=>s.points>0);
    if (top3.length>=2) {
        const podiumOrder = top3.length===3 ? [top3[1],top3[0],top3[2]] : [top3[1],top3[0]];
        const heights = top3.length===3?['80px','110px','60px']:['80px','110px'];
        html += `<div style="display:flex;align-items:flex-end;justify-content:center;gap:8px;margin-bottom:16px;padding:0 8px">`;
        podiumOrder.forEach((s,pi)=>{
            const rc = rankStyle(s) || SV_RANK[2];
            html+=`<div style="flex:1;min-width:0;text-align:center">
              <div style="font-size:1.8rem;margin-bottom:2px">${rc.icon}</div>
              ${_vAvatarTag(s.avatar,`width:52px;height:52px;border-radius:50%;border:3px solid ${rc.border};object-fit:contain;background:#eff6ff;margin:0 auto 4px`,s.name)}
              <div style="font-size:.75rem;font-weight:900;color:#1e293b;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_vEsc(s.name)}</div>
              ${s.milestone?`<div style="font-size:.9rem">${_vEsc(s.milestone.icon)}</div>`:''}
              <div style="height:${heights[pi]};background:${rc.scoreBg};border-radius:10px 10px 4px 4px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px ${rc.border}66;margin-top:4px">
                <span style="font-size:1.3rem;font-weight:900;color:#fff">+${s.points}</span>
              </div>
            </div>`;
        });
        html+=`</div>`;
    }

    html += `<div style="position:relative;margin-bottom:12px">
        <i class="fas fa-search" style="position:absolute;left:14px;top:50%;transform:translateY(-50%);color:#94a3b8;font-size:.85rem"></i>
        <input type="search" oninput="_svFilter(this.value)" placeholder="Nhập tên để tìm thứ hạng của em…" style="width:100%;padding:11px 12px 11px 38px;border:1px solid #e2e8f0;border-radius:12px;font-size:.9rem;background:#fff;outline:none">
      </div>
      <div style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #f1f5f9;box-shadow:0 2px 12px rgba(0,0,0,.06);margin-bottom:12px">
      <div style="background:linear-gradient(90deg,#1d4ed8,#7c3aed);padding:10px 16px;display:flex;align-items:center;gap:8px">
        <span style="font-size:.8rem;font-weight:900;color:rgba(255,255,255,.8);letter-spacing:.08em">XẾP HẠNG ĐẦY ĐỦ</span>
        <span style="margin-left:auto;font-size:.7rem;color:rgba(255,255,255,.55)">${total} học sinh</span>
      </div>`;

    list.forEach((s,i)=>{
        const rc = rankStyle(s);
        const pts = s.points;
        let scoreBg, scoreColor='#fff';
        if(rc) scoreBg=rc.scoreBg;
        else if(pts>0) scoreBg='linear-gradient(135deg,#22c55e,#16a34a)';
        else if(pts<0) scoreBg='linear-gradient(135deg,#ef4444,#b91c1c)';
        else { scoreBg='#f3f4f6'; scoreColor='#6b7280'; }
        const badges = Array.isArray(s.streakBadges) ? s.streakBadges : [];
        const lastShadow = badges.length ? String(badges[badges.length-1].shadow||'') : '';
        const borderLeft = rc ? rc.border : (/^rgba?\([\d.,\s]+\)$/.test(lastShadow) ? lastShadow.replace('0.5)','0.9)') : (i%2===0?'#e5e7eb':'#f3f4f6'));
        const rowBg = rc ? rc.rowBg : (i%2===0?'#fff':'#fafafa');
        const streakIcons = badges.map(b=>`<span title="${_vEsc(b.name)}: ${_vEsc(b.desc)}" style="font-size:.85rem">${_vEsc(b.icon)}</span>`).join('');
        const msIcon = s.milestone?`<span style="font-size:.85rem" title="${_vEsc(s.milestone.label)}">${_vEsc(s.milestone.icon)}</span>`:'';
        const curDay=_vNum(s.curDay), curWeek=_vNum(s.curWeek);
        const activePill = curDay>0
            ? `<span style="font-size:.6rem;font-weight:700;color:#ea580c;background:#fff7ed;border:1px solid #fed7aa;padding:1px 6px;border-radius:999px">🔥${curDay} ngày</span>`
            : (curWeek>=2?`<span style="font-size:.6rem;font-weight:700;color:#2563eb;background:#eff6ff;border:1px solid #bfdbfe;padding:1px 6px;border-radius:999px">📅${curWeek} tuần</span>`:'');
        const rankCell = rc
            ? `<div style="width:40px;text-align:center;flex-shrink:0"><div style="font-size:1.4rem;line-height:1">${rc.icon}</div><div style="font-size:.55rem;font-weight:900;color:${rc.border}">${rc.label}</div></div>`
            : `<div style="width:40px;text-align:center;flex-shrink:0"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:#f1f5f9;font-size:.7rem;font-weight:900;color:#6b7280">${s.rank}</span></div>`;
        html+=`<div class="sv-row" data-name="${_vEsc(_svNorm(s.name))}" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid #f8fafc;background:${rowBg};border-left:4px solid ${borderLeft};animation-delay:${Math.min(i*40,400)}ms">
          ${rankCell}
          ${_vAvatarTag(s.avatar,`width:38px;height:38px;border-radius:50%;background:#eff6ff;border:2px solid ${rc?rc.border:'#e0e7ff'};object-fit:contain;flex-shrink:0`,s.name)}
          <div style="flex:1;min-width:0">
            <div style="font-size:.85rem;font-weight:900;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_vEsc(s.name)}</div>
            <div style="display:flex;gap:4px;align-items:center;flex-wrap:wrap;margin-top:2px">${msIcon}${streakIcons}${activePill}</div>
            <div style="display:flex;gap:6px;margin-top:3px">
              <span style="font-size:.65rem;font-weight:700;color:#16a34a;background:#f0fdf4;border:1px solid #bbf7d0;padding:1px 6px;border-radius:999px">+${_vNum(s.positivePoints)}</span>
              <span style="font-size:.65rem;font-weight:700;color:#dc2626;background:#fef2f2;border:1px solid #fecaca;padding:1px 6px;border-radius:999px">-${_vNum(s.negativePoints)}</span>
            </div>
          </div>
          <div style="width:44px;height:44px;border-radius:12px;background:${scoreBg};display:flex;align-items:center;justify-content:center;font-size:1rem;font-weight:900;color:${scoreColor};flex-shrink:0">${pts>0?'+':''}${pts}</div>
        </div>`;
    });
    html+=`<p id="svEmpty" style="display:none;padding:16px;text-align:center;font-size:.8rem;color:#94a3b8">Không tìm thấy tên này trong lớp.</p></div>`;
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

