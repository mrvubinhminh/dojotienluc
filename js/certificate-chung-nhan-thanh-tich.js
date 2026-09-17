// ============================================================
// CERTIFICATE – CHỨNG NHẬN THÀNH TÍCH
// ============================================================
let _certStudents = [];      // list of students for batch
let _certIndex    = 0;       // current index in batch
let _certSettings = {};      // school, title, reason, signer, date

/* ---- Decorative helpers for jsPDF ---- */
function _certDashedRect(doc, x, y, w, h, dash=3, gap=2, lw=0.4) {
    doc.setLineWidth(lw);
    const perimeter = 2*(w+h);
    let pos = 0, on = true;
    // Top
    let cx=x; while(cx<x+w){ const seg=on?dash:gap; const end=Math.min(cx+seg,x+w); if(on) doc.line(cx,y,end,y); cx=end; on=!on; }
    cx=x+w; let cy=y; while(cy<y+h){ const seg=on?dash:gap; const end=Math.min(cy+seg,y+h); if(on) doc.line(cx,cy,cx,end); cy=end; on=!on; }
    // Bottom
    cx=x+w; on=true; while(cx>x){ const seg=on?dash:gap; const end=Math.max(cx-seg,x); if(on) doc.line(cx,y+h,end,y+h); cx=end; on=!on; }
    cy=y+h; on=true; while(cy>y){ const seg=on?dash:gap; const end=Math.max(cy-seg,y); if(on) doc.line(x,cy,x,end); cy=end; on=!on; }
}

function _certCornerFlourish(doc, x, y, size, flip=[1,1]) {
    doc.setDrawColor('#b8860b');
    doc.setLineWidth(0.6);
    const [fx,fy]=flip;
    // L-shape corner
    doc.line(x, y, x+fx*size*0.55, y);
    doc.line(x, y, x, y+fy*size*0.55);
    // Small diamond
    const ds=2.5;
    doc.setFillColor('#d4af37');
    doc.circle(x+fx*ds*0.5, y+fy*ds*0.5, 1.2, 'F');
}

function _certStar(doc, cx, cy, r, color='#ffd700') {
    doc.setFillColor(color);
    const pts=[];
    for(let i=0;i<5;i++){
        const ang1=(i*72-90)*Math.PI/180, ang2=(i*72-90+36)*Math.PI/180;
        pts.push([cx+r*Math.cos(ang1), cy+r*Math.sin(ang1)]);
        pts.push([cx+r*0.45*Math.cos(ang2), cy+r*0.45*Math.sin(ang2)]);
    }
    doc.setLineWidth(0); doc.setDrawColor(color);
    // Draw using lines (jsPDF lines approach)
    for(let i=0;i<pts.length;i++){
        const n=(i+1)%pts.length;
        if(i===0) doc.lines([[pts[1][0]-pts[0][0],pts[1][1]-pts[0][1]]],pts[0][0],pts[0][1],[1,1],'F');
    }
    // Simpler: use circle with overlay
    doc.setFillColor(color);
    doc.circle(cx, cy, r*0.55, 'F');
}

/* ---- Build one certificate page in jsPDF doc ---- */
function _buildCertPage(doc, s, settings, pageW, pageH) {
    const mg=12, cW=pageW-mg*2, cH=pageH-mg*2;

    // ---- Background gradient simulation (ivory) ----
    doc.setFillColor('#fffef5');
    doc.rect(0, 0, pageW, pageH, 'F');

    // ---- Outer ornamental border (triple) ----
    doc.setDrawColor('#b8860b'); doc.setLineWidth(1.8);
    doc.rect(mg, mg, cW, cH);
    doc.setDrawColor('#d4af37'); doc.setLineWidth(0.7);
    doc.rect(mg+3.5, mg+3.5, cW-7, cH-7);
    doc.setDrawColor('#b8860b'); doc.setLineWidth(0.3);
    _certDashedRect(doc, mg+6, mg+6, cW-12, cH-12, 2, 1.5, 0.3);

    // ---- Corner flourishes ----
    _certCornerFlourish(doc, mg+1,   mg+1,   12, [1,1]);
    _certCornerFlourish(doc, pageW-mg-1, mg+1,   12, [-1,1]);
    _certCornerFlourish(doc, mg+1,   pageH-mg-1, 12, [1,-1]);
    _certCornerFlourish(doc, pageW-mg-1, pageH-mg-1, 12, [-1,-1]);

    // ---- Header band ----
    doc.setFillColor('#8b6914');
    doc.rect(mg+6, mg+6, cW-12, 18, 'F');
    doc.setFillColor('#d4af37');
    doc.rect(mg+6, mg+6, cW-12, 1.2, 'F');
    doc.rect(mg+6, mg+22.8, cW-12, 1.2, 'F');

    // ---- School name ----
    const school = settings.school || 'TRƯỜNG THPT NGUYỄN DU';
    doc.setFont('helvetica','bold');
    doc.setFontSize(9);
    doc.setTextColor('#ffd700');
    doc.text(school.toUpperCase(), pageW/2, mg+16.5, {align:'center'});

    // ---- Title ----
    const titleY = mg + 38;
    doc.setFont('helvetica','bold');
    doc.setFontSize(20);
    doc.setTextColor('#7a5100');
    const titleText = settings.title || 'CHỨNG NHẬN THÀNH TÍCH XUẤT SẮC';
    doc.text(titleText, pageW/2, titleY, {align:'center'});

    // Underline
    const tw = doc.getTextWidth(titleText);
    doc.setDrawColor('#d4af37'); doc.setLineWidth(0.8);
    doc.line(pageW/2-tw/2, titleY+2, pageW/2+tw/2, titleY+2);
    doc.line(pageW/2-tw/2+3, titleY+4, pageW/2+tw/2-3, titleY+4);

    // ---- Stars row ----
    const starY = titleY + 10;
    const starColors = ['#ffd700','#ffba00','#ffd700','#ffba00','#ffd700'];
    [-14,-7,0,7,14].forEach((off,i)=>{
        doc.setFillColor(starColors[i]);
        doc.circle(pageW/2+off, starY, 1.8, 'F');
    });

    // ---- Subtitle ----
    doc.setFont('helvetica','italic');
    doc.setFontSize(10);
    doc.setTextColor('#5a4000');
    doc.text('Trân trọng trao tặng cho', pageW/2, starY+10, {align:'center'});

    // ---- Student Name ----
    doc.setFont('helvetica','bold');
    doc.setFontSize(28);
    doc.setTextColor('#4a2800');
    doc.text(s.name, pageW/2, starY+26, {align:'center'});

    // Name underline (gold wave simulation)
    const nw = doc.getTextWidth(s.name);
    doc.setDrawColor('#d4af37'); doc.setLineWidth(1.5);
    doc.line(pageW/2-nw/2-5, starY+29, pageW/2+nw/2+5, starY+29);

    // ---- Class & Stats row ----
    const statsY = starY + 40;
    const cls = classes.find(c=>c.id===s.classId);
    const ms  = getMilestone(s.points);

    doc.setFillColor('#fdf3c0');
    doc.roundedRect(mg+20, statsY-5, cW-40, 18, 3, 3, 'F');
    doc.setDrawColor('#d4af37'); doc.setLineWidth(0.5);
    doc.roundedRect(mg+20, statsY-5, cW-40, 18, 3, 3, 'S');

    doc.setFont('helvetica','bold');
    doc.setFontSize(9);
    doc.setTextColor('#6b4c00');
    const statsLine = [
        `Lớp: ${cls?.name||''}`,
        `Điểm thi đua: ${s.points}`,
        `Điểm cộng: ${s.positivePoints}`,
        ms ? `Danh hiệu: ${ms.icon} ${ms.label}` : '',
    ].filter(Boolean).join('    •    ');
    doc.text(statsLine, pageW/2, statsY+5.5, {align:'center'});

    // ---- Reason / Achievement ----
    const reasonY = statsY + 24;
    doc.setFont('helvetica','italic');
    doc.setFontSize(10);
    doc.setTextColor('#444');
    const reason = settings.reason || `Đã hoàn thành xuất sắc chương trình học, đạt ${s.points} điểm thi đua và nhận được nhiều khen ngợi từ giáo viên.`;
    const reasonLines = doc.splitTextToSize(reason, cW-50);
    doc.text(reasonLines, pageW/2, reasonY, {align:'center'});

    // ---- Divider ----
    const divY = reasonY + reasonLines.length*5 + 6;
    doc.setDrawColor('#d4af37'); doc.setLineWidth(0.4);
    doc.line(mg+25, divY, pageW/2-15, divY);
    doc.setFillColor('#d4af37'); doc.circle(pageW/2, divY, 1.5, 'F');
    doc.line(pageW/2+15, divY, pageW-mg-25, divY);

    // ---- Goals achieved ----
    const achieved = studentGoals.filter(g=>g.studentId===s.id && g.status==='achieved');
    if (achieved.length) {
        const gY = divY + 8;
        doc.setFont('helvetica','bold');
        doc.setFontSize(8);
        doc.setTextColor('#7a5100');
        doc.text('Mục tiêu đã đạt:', mg+20, gY);
        achieved.slice(0,4).forEach((g,i)=>{
            doc.setFont('helvetica','normal');
            doc.setFontSize(8);
            doc.setTextColor('#333');
            doc.text(`✓ ${g.title}`, mg+20, gY+5+i*5);
        });
    }

    // ---- Signature block ----
    const sigY = pageH - mg - 28;
    const dateStr = settings.date ? new Date(settings.date).toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'}) : new Date().toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'});
    const signer  = settings.signer || 'GIÁO VIÊN CHỦ NHIỆM';

    // Left: Date
    doc.setFont('helvetica','italic');
    doc.setFontSize(9);
    doc.setTextColor('#555');
    const city = settings.school ? '' : '';
    const cls2 = classes.find(c=>c.id===s.classId);
    doc.text(`Ngày ${dateStr}`, mg+25, sigY, {align:'center'});

    // Right: Signer title
    doc.setFont('helvetica','bold');
    doc.setFontSize(9);
    doc.setTextColor('#4a2800');
    doc.text(signer.toUpperCase(), pageW-mg-30, sigY, {align:'center'});
    doc.setFont('helvetica','italic');
    doc.setFontSize(8);
    doc.setTextColor('#888');
    doc.text('(Ký và ghi rõ họ tên)', pageW-mg-30, sigY+5, {align:'center'});
    // Signature line
    doc.setDrawColor('#aaa'); doc.setLineWidth(0.4);
    doc.line(pageW-mg-55, sigY+14, pageW-mg-8, sigY+14);
    // Teacher name below signature line
    if (settings.teacherName) {
        doc.setFont('helvetica','bold');
        doc.setFontSize(9);
        doc.setTextColor('#4a2800');
        doc.text(settings.teacherName, pageW-mg-30, sigY+20, {align:'center'});
    }

    // ---- Footer stamp-like circle ----
    doc.setDrawColor('#c8a000'); doc.setLineWidth(0.5);
    doc.circle(pageW/2, sigY+5, 14, 'S');
    doc.circle(pageW/2, sigY+5, 11, 'S');
    doc.setFont('helvetica','bold');
    doc.setFontSize(6);
    doc.setTextColor('#8b6914');
    doc.text('DẤU', pageW/2, sigY+7, {align:'center'});

    // ---- Watermark stars ----
    doc.setTextColor('#d4af3720');
    doc.setFontSize(60);
    doc.setFont('helvetica','bold');
    doc.text('★', pageW/2, pageH/2+15, {align:'center'});
}

/* ---- Public API ---- */
function openCertificateModal(studentId) {
    const s = students.find(st=>st.id===studentId);
    if (!s) return;
    _certStudents = [s];
    _certIndex = 0;
    _certSettings = _loadCertSettings();
    _showCertPreview();
}

function _loadCertSettings() {
    const d = new Date().toISOString().slice(0,10);
    return {
        school: localStorage.getItem('cert_school')||'',
        title:  'CHỨNG NHẬN THÀNH TÍCH XUẤT SẮC',
        reason: localStorage.getItem('cert_reason')||'',
        signer: localStorage.getItem('cert_signer')||'Giáo viên chủ nhiệm',
        date:   d,
    };
}

function _showCertPreview() {
    const overlay = document.getElementById('certOverlay');
    overlay.classList.remove('hidden');
    const navBar = document.getElementById('certNavBar');
    if (_certStudents.length > 1) {
        navBar.classList.remove('hidden');
        _updateCertNav();
    } else {
        navBar.classList.add('hidden');
    }
    _renderCertPaper(_certStudents[_certIndex]);
}

function _renderCertPaper(s) {
    const paper = document.getElementById('certPaper');
    const cls   = classes.find(c=>c.id===s.classId);
    const ms    = getMilestone(s.points);
    const achieved = studentGoals.filter(g=>g.studentId===s.id && g.status==='achieved');
    const settings = _certSettings;
    const dateStr = settings.date ? new Date(settings.date).toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'}) : new Date().toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'});

    paper.innerHTML = `
        <div class="absolute inset-0" style="background:#fffef5;font-family:'Roboto',sans-serif;">
            <!-- Outer border -->
            <div class="absolute inset-0 border-4 border-amber-700 rounded-sm pointer-events-none"></div>
            <div class="absolute inset-2 border border-amber-500 rounded-sm pointer-events-none" style="border-style:dashed"></div>
            <!-- Header band -->
            <div class="absolute top-3 left-3 right-3" style="height:40px;background:linear-gradient(135deg,#7a5200,#c8960c,#7a5200);">
                <p class="text-center font-black text-amber-200 text-xs tracking-widest" style="line-height:40px">${(settings.school||'TRƯỜNG THPT').toUpperCase()}</p>
            </div>
            <!-- Stars deco -->
            <div class="absolute left-0 right-0 text-center" style="top:50px;font-size:14px;color:#d4af37;letter-spacing:8px">★ ★ ★ ★ ★</div>
            <!-- Title -->
            <div class="absolute left-0 right-0 text-center" style="top:72px;">
                <p class="font-black text-amber-900 tracking-widest" style="font-size:clamp(10px,3vw,18px)">${settings.title||'CHỨNG NHẬN THÀNH TÍCH XUẤT SẮC'}</p>
                <div style="width:60%;height:2px;background:linear-gradient(90deg,transparent,#d4af37,transparent);margin:3px auto"></div>
            </div>
            <!-- Subtitle -->
            <div class="absolute left-0 right-0 text-center italic text-amber-800" style="top:105px;font-size:clamp(8px,2vw,11px)">Trân trọng trao tặng cho</div>
            <!-- Student name -->
            <div class="absolute left-0 right-0 text-center" style="top:118px;">
                <p class="font-black text-amber-950" style="font-size:clamp(14px,4.5vw,28px)">${s.name}</p>
                <div style="width:55%;height:2px;background:linear-gradient(90deg,transparent,#c8960c,transparent);margin:2px auto 0"></div>
            </div>
            <!-- Stats chip -->
            <div class="absolute left-0 right-0 flex justify-center" style="top:165px">
                <div class="flex gap-2 px-4 py-2 rounded-full text-amber-800 text-[10px] font-bold" style="background:#fdf3c0;border:1px solid #d4af37">
                    <span>📚 Lớp: ${cls?.name||'—'}</span>
                    <span>·</span>
                    <span>⭐ Điểm: ${s.points}</span>
                    <span>·</span>
                    <span>➕ Cộng: ${s.positivePoints}</span>
                    ${ms?`<span>·</span><span>${ms.icon} ${ms.label}</span>`:''}
                </div>
            </div>
            <!-- Reason -->
            <div class="absolute left-0 right-0 text-center italic text-gray-600 px-8" style="top:193px;font-size:clamp(7px,1.8vw,10px)">
                ${settings.reason||`Đã hoàn thành xuất sắc chương trình học, đạt ${s.points} điểm thi đua và nhận được nhiều khen ngợi từ giáo viên.`}
            </div>
            <!-- Achieved goals -->
            ${achieved.length?`<div class="absolute left-0 right-0 flex justify-center gap-2 flex-wrap px-6" style="top:213px">${achieved.slice(0,4).map(g=>`<span class="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold border border-green-200">✓ ${g.title}</span>`).join('')}</div>`:''}
            <!-- Divider -->
            <div class="absolute left-0 right-0 flex items-center justify-center gap-2" style="top:232px">
                <div style="width:28%;height:1px;background:linear-gradient(90deg,transparent,#d4af37)"></div>
                <span style="color:#d4af37;font-size:12px">✦</span>
                <div style="width:28%;height:1px;background:linear-gradient(90deg,#d4af37,transparent)"></div>
            </div>
            <!-- Signature area -->
            <div class="absolute left-0 right-0 flex justify-between px-8" style="bottom:28px">
                <div class="text-center">
                    <p class="text-gray-500 italic" style="font-size:9px">Ngày ${dateStr}</p>
                    <div style="width:100px;height:1px;background:#ccc;margin:24px auto 0"></div>
                </div>
                <div class="text-center">
                    <p class="font-black text-amber-800 uppercase tracking-wide" style="font-size:8px">${settings.signer||'Giáo viên chủ nhiệm'}</p>
                    <p class="text-gray-400 italic" style="font-size:7px">(Ký và ghi rõ họ tên)</p>
                    <div style="width:100px;height:1px;background:#ccc;margin:16px auto 0"></div>
                </div>
            </div>
            <!-- Stamp circle -->
            <div class="absolute rounded-full flex items-center justify-center" style="bottom:20px;left:50%;transform:translateX(-50%);width:52px;height:52px;border:2px solid #c8a000;background:rgba(212,175,55,0.07)">
                <p style="font-size:8px;color:#8b6914;font-weight:700">DẤU</p>
            </div>
            <!-- Watermark -->
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none" style="font-size:clamp(60px,18vw,120px);color:rgba(212,175,55,0.06);font-weight:900;user-select:none">★</div>
        </div>`;
}

function _updateCertNav() {
    const s = _certStudents[_certIndex];
    document.getElementById('certNavLabel').innerText = `${_certIndex+1} / ${_certStudents.length}  –  ${s.name}`;
    document.getElementById('btnCertPrev').disabled = _certIndex===0;
    document.getElementById('btnCertNext').disabled = _certIndex===_certStudents.length-1;
}

function certPrev() { if(_certIndex>0){ _certIndex--; _renderCertPaper(_certStudents[_certIndex]); _updateCertNav(); } }
function certNext() { if(_certIndex<_certStudents.length-1){ _certIndex++; _renderCertPaper(_certStudents[_certIndex]); _updateCertNav(); } }

function closeCertificate() {
    document.getElementById('certOverlay').classList.add('hidden');
}

function printCertificate() {
    const el = document.getElementById('certPaper');
    const orig = document.getElementById('certPrintOverlay');
    // Create print container
    const printDiv = document.createElement('div');
    printDiv.id='certPrintOverlay';
    printDiv.style.cssText='position:fixed;inset:0;background:white;z-index:99999;display:flex;align-items:center;justify-content:center;';
    printDiv.innerHTML = `<div style="width:100%;max-width:800px;aspect-ratio:1.414/1">${el.outerHTML}</div>`;
    document.body.appendChild(printDiv);
    window.print();
    document.body.removeChild(printDiv);
}

async function downloadCertPDF() {
    if (!window.jspdf)      { showToast('Đang tải thư viện PDF...', false); return; }
    if (!window.html2canvas) { showToast('Đang tải html2canvas...', false); return; }
    const { jsPDF } = window.jspdf;

    const btn = document.querySelector('#certOverlay button[onclick="downloadCertPDF()"]');
    if (btn) { btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin mr-1"></i>Đang tạo...'; }
    showToast('Đang tạo PDF, vui lòng chờ...', true);

    const paper      = document.getElementById('certPaper');
    const savedIndex = _certIndex;  // restore after batch

    try {
        const doc = new jsPDF({ orientation:'landscape', unit:'mm', format:'a4' });

        for (let i=0; i<_certStudents.length; i++) {
            // Render this student's cert into the visible paper element
            _renderCertPaper(_certStudents[i]);
            // Brief delay so Roboto glyphs are fully painted
            await new Promise(r => setTimeout(r, 120));

            const canvas = await html2canvas(paper, {
                scale: 2.5,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#fffef5',
                logging: false,
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.96);
            if (i > 0) doc.addPage();
            doc.addImage(imgData, 'JPEG', 0, 0, 297, 210);
        }

        // Restore display to original student
        _certIndex = savedIndex;
        _renderCertPaper(_certStudents[savedIndex]);

        const cls = classes.find(c=>c.id===currentClassId);
        const fname = _certStudents.length===1
            ? `chung_nhan_${_certStudents[0].name.replace(/\s+/g,'_')}.pdf`
            : `chung_nhan_${cls?.name?.replace(/\s+/g,'_')||'lop'}_${_certStudents.length}hs.pdf`;
        doc.save(fname);
        showToast(`✅ Đã tải ${_certStudents.length>1?_certStudents.length+' chứng nhận!':fname}`);
    } catch(e) {
        console.error(e);
        showToast('Lỗi tạo PDF: ' + e.message, false);
        _certIndex = savedIndex;
        _renderCertPaper(_certStudents[savedIndex]);
    }

    if (btn) { btn.disabled=false; btn.innerHTML='<i class="fas fa-download mr-1"></i>Tải PDF'; }
}

/* ---- Batch certificate modal ---- */
let _batchCertFilter = 'all';
let _batchCertChecked = new Set();

function openBatchCertModal() {
    const modal=document.getElementById('batchCertModal');
    const backdrop=document.getElementById('batchCertBackdrop');
    // Default date
    document.getElementById('certDate').value = new Date().toISOString().slice(0,10);
    document.getElementById('certSchoolName').value = localStorage.getItem('cert_school')||'';
    document.getElementById('certReason').value = localStorage.getItem('cert_reason')||'';
    // Auto-fill chức danh + tên GV từ thông tin lớp
    const _certCls = classes.find(c=>c.id===currentClassId);
    const _isSubject = _certCls?.skillPreset === 'subject';
    const _signerDefault = _isSubject
        ? `Giáo viên bộ môn${_certCls?.subjectName ? ' ' + _certCls.subjectName : ''}`
        : 'Giáo viên chủ nhiệm';
    document.getElementById('certSigner').value = localStorage.getItem('cert_signer') || _signerDefault;
    document.getElementById('certTeacherName').value = localStorage.getItem('cert_teacherName') || (_certCls?.teacherName||'');
    _batchCertFilter='all';
    _populateCertStudentList();
    selectCertFilter('all');
    backdrop.classList.remove('hidden');
    setTimeout(()=>modal.classList.remove('translate-y-full'),10);
}

function closeBatchCertModal() {
    document.getElementById('batchCertModal').classList.add('translate-y-full');
    setTimeout(()=>document.getElementById('batchCertBackdrop').classList.add('hidden'),300);
}

function _populateCertStudentList() {
    const all=students.filter(s=>s.classId===currentClassId).sort((a,b)=>a.stt-b.stt);
    let filtered=all;
    if(_batchCertFilter==='milestone') filtered=all.filter(s=>!!getMilestone(s.points));
    else if(_batchCertFilter==='top10') filtered=[...all].sort((a,b)=>b.points-a.points).slice(0,10);
    else if(_batchCertFilter==='positive') filtered=all.filter(s=>s.points>0);

    // Default check all filtered
    _batchCertChecked = new Set(filtered.map(s=>s.id));

    const container=document.getElementById('certStudentList');
    container.innerHTML='';
    all.forEach(s=>{
        const inFilter=filtered.some(f=>f.id===s.id);
        const ms=getMilestone(s.points);
        const checked=_batchCertChecked.has(s.id);
        container.insertAdjacentHTML('beforeend',`
            <label class="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition ${checked?'bg-amber-50 border border-amber-200':'bg-gray-50 border border-gray-100'}" id="certRow-${s.id}">
                <input type="checkbox" class="cert-check w-4 h-4 accent-amber-500 rounded" data-id="${s.id}" ${checked?'checked':''} onchange="toggleCertCheck(${s.id})">
                <img src="${s.avatar}" class="w-8 h-8 rounded-full bg-blue-50 object-contain flex-shrink-0">
                <div class="flex-1 overflow-hidden">
                    <p class="text-sm font-bold text-gray-800 truncate">${s.stt}. ${s.name}</p>
                    <p class="text-[10px] text-gray-400">${s.points} điểm ${ms?ms.icon:''}</p>
                </div>
            </label>`);
    });
    _updateCertSelectedCount();
}

function toggleCertCheck(id) {
    const row=document.getElementById(`certRow-${id}`);
    if(_batchCertChecked.has(id)){
        _batchCertChecked.delete(id);
        row.classList.remove('bg-amber-50','border-amber-200'); row.classList.add('bg-gray-50','border-gray-100');
    } else {
        _batchCertChecked.add(id);
        row.classList.add('bg-amber-50','border-amber-200'); row.classList.remove('bg-gray-50','border-gray-100');
    }
    _updateCertSelectedCount();
}

function certSelectAll(val) {
    document.querySelectorAll('.cert-check').forEach(cb=>{
        const id=parseInt(cb.dataset.id);
        cb.checked=val;
        const row=document.getElementById(`certRow-${id}`);
        if(val){ _batchCertChecked.add(id); row.classList.add('bg-amber-50','border-amber-200'); row.classList.remove('bg-gray-50','border-gray-100'); }
        else   { _batchCertChecked.delete(id); row.classList.remove('bg-amber-50','border-amber-200'); row.classList.add('bg-gray-50','border-gray-100'); }
    });
    _updateCertSelectedCount();
}

function _updateCertSelectedCount() {
    document.getElementById('certSelectedCount').innerText = `(${_batchCertChecked.size})`;
}

function selectCertFilter(filter) {
    _batchCertFilter=filter;
    document.querySelectorAll('.cert-filter-btn').forEach(btn=>{
        btn.classList.remove('border-amber-400','bg-amber-50','text-amber-700');
        btn.classList.add('border-transparent','bg-gray-100','text-gray-600');
    });
    const active=document.getElementById(`certFilter${filter.charAt(0).toUpperCase()+filter.slice(1)}`);
    if(active){ active.classList.add('border-amber-400','bg-amber-50','text-amber-700'); active.classList.remove('border-transparent','bg-gray-100','text-gray-600'); }
    _populateCertStudentList();
}

function previewBatchCerts() {
    if(!_batchCertChecked.size){ showToast('Chọn ít nhất 1 học sinh!', false); return; }
    // Save settings
    localStorage.setItem('cert_school', document.getElementById('certSchoolName').value);
    localStorage.setItem('cert_reason', document.getElementById('certReason').value);
    localStorage.setItem('cert_signer', document.getElementById('certSigner').value);
    localStorage.setItem('cert_teacherName', document.getElementById('certTeacherName').value);

    _certSettings = {
        school:       document.getElementById('certSchoolName').value,
        title:        document.getElementById('certTitle').value,
        reason:       document.getElementById('certReason').value,
        signer:       document.getElementById('certSigner').value,
        teacherName:  document.getElementById('certTeacherName').value,
        date:         document.getElementById('certDate').value,
    };
    _certStudents = students.filter(s=>_batchCertChecked.has(s.id)).sort((a,b)=>a.stt-b.stt);
    _certIndex=0;
    closeBatchCertModal();
    setTimeout(()=>_showCertPreview(), 350);
}

