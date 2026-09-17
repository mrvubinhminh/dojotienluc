// ============================================================
// HỌC BẠ
// ============================================================
let _hoaBaHK = 'HK1';

function _hbAvgForStudent(nameOrId, hk) {
    // Get all subjectGrades for this class+semester, find this student's DTB, compute avg
    const recs = subjectGrades.filter(sg=>sg.classId===currentClassId&&sg.semester===hk&&sg.rows&&sg.rows.length>0);
    const dtbs = [];
    recs.forEach(rec=>{
        const row = rec.rows.find(r=>r.studentId===nameOrId||r.name===nameOrId);
        if (row&&row.dtb!==undefined&&row.dtb!=='') dtbs.push(parseFloat(row.dtb));
    });
    return dtbs.length ? Math.round(dtbs.reduce((a,b)=>a+b,0)/dtbs.length*10)/10 : null;
}

function _hbSubjectDetail(nameOrId, hk) {
    const recs = subjectGrades.filter(sg=>sg.classId===currentClassId&&sg.semester===hk&&sg.rows&&sg.rows.length>0);
    const below=[], above=[], all=[];
    recs.forEach(rec=>{
        const row=rec.rows.find(r=>r.studentId===nameOrId||r.name===nameOrId);
        if(!row||row.dtb===undefined||row.dtb==='') return;
        const v=parseFloat(row.dtb);
        all.push({sub:rec.subject,v});
        if(v<5) below.push(rec.subject);
        else if(v>=8) above.push(rec.subject);
    });
    return {below,above,all};
}

function _hbAutoComment(nameOrId, hk) {
    let avg;
    if(hk==='CN') {
        const a1=_hbAvgForStudent(nameOrId,'HK1'), a2=_hbAvgForStudent(nameOrId,'HK2');
        avg = (a1!==null&&a2!==null) ? Math.round((a1+a2)/2*10)/10 : (a1!==null?a1:a2);
    } else { avg=_hbAvgForStudent(nameOrId,hk); }
    if(avg===null) return '';
    const hocLuc = avg>=8?'Giỏi':avg>=6.5?'Khá':avg>=5?'Trung bình':'Yếu';
    let note = `Học lực: ${hocLuc} (ĐTB: ${avg}).`;
    if(hk!=='CN'){
        const {below,above}=_hbSubjectDetail(nameOrId,hk);
        if(above.length) note += ` Xuất sắc: ${above.join(', ')}.`;
        if(below.length) note += ` Cần cố gắng: ${below.join(', ')}.`;
    } else {
        // CN: combine both semesters
        const d1=_hbSubjectDetail(nameOrId,'HK1'), d2=_hbSubjectDetail(nameOrId,'HK2');
        const allBelow=[...new Set([...d1.below,...d2.below])];
        const allAbove=[...new Set([...d1.above,...d2.above])];
        if(allAbove.length) note += ` Xuất sắc: ${allAbove.join(', ')}.`;
        if(allBelow.length) note += ` Cần cố gắng: ${allBelow.join(', ')}.`;
    }
    if(avg>=8) note += ' Tiếp tục phát huy.';
    else if(avg<5) note += ' Cần nỗ lực hơn trong thời gian tới.';
    return note;
}

function _hbGetOrCreate(studentId, name, stt) {
    let rec = hoaBa.find(r=>r.classId===currentClassId&&r.studentId===studentId);
    if(!rec){
        rec={id:Date.now()+Math.random(),classId:currentClassId,studentId,name,stt,hk1Note:'',hk2Note:'',cnNote:'',updatedAt:new Date().toISOString()};
        hoaBa.push(rec);
    }
    return rec;
}

function _hbNoteKey(hk){ return hk==='HK1'?'hk1Note':hk==='HK2'?'hk2Note':'cnNote'; }

function openHoaBa() {
    const cls=classes.find(c=>c.id===currentClassId); if(!cls) return;
    document.getElementById('hoaBaSubtitle').textContent=`Lớp ${cls.name}`;
    _hoaBaHK='HK1';
    document.getElementById('hoaBaPanel').classList.remove('translate-y-full');
    renderHoaBaList();
}

function closeHoaBa() {
    document.getElementById('hoaBaPanel').classList.add('translate-y-full');
}

function hoaBaSetHK(hk) {
    _hoaBaHK=hk;
    ['HK1','HK2','CN'].forEach(h=>{
        const btn=document.getElementById(`hoaBaTab${h}`);
        if(!btn) return;
        btn.className=h===hk
            ?'px-4 py-1.5 font-bold rounded-full text-sm bg-teal-700 text-white shadow'
            :'px-4 py-1.5 font-bold rounded-full text-sm bg-white text-teal-700 border border-teal-200 hover:bg-teal-50 transition';
    });
    renderHoaBaList();
}

function renderHoaBaList() {
    const hk=_hoaBaHK;
    const clsStudents=students.filter(s=>s.classId===currentClassId).sort((a,b)=>(a.stt||999)-(b.stt||999));
    const list=document.getElementById('hoaBaList');
    if(!clsStudents.length){list.innerHTML='<div class="text-center py-10 text-gray-400">Lớp chưa có học sinh.</div>';return;}

    // Stats
    let filled=0;
    const key=_hbNoteKey(hk);
    clsStudents.forEach(s=>{ const r=hoaBa.find(b=>b.classId===currentClassId&&b.studentId===s.id); if(r&&r[key]) filled++; });
    document.getElementById('hoaBaHKStats').textContent=`Đã nhận xét: ${filled}/${clsStudents.length}`;

    list.innerHTML = clsStudents.map((s,i)=>{
        const rec=hoaBa.find(b=>b.classId===currentClassId&&b.studentId===s.id);
        const note=(rec&&rec[key])||'';
        let avg;
        if(hk==='CN'){
            const a1=_hbAvgForStudent(s.id,'HK1'),a2=_hbAvgForStudent(s.id,'HK2');
            avg=(a1!==null&&a2!==null)?Math.round((a1+a2)/2*10)/10:(a1!==null?a1:a2);
        } else { avg=_hbAvgForStudent(s.id,hk); }
        const avgLabel=avg!==null?`<span class="font-black ${avg>=8?'text-green-600':avg>=5?'text-amber-600':'text-red-500'}">${avg}</span>`:'<span class="text-gray-300">—</span>';
        const rowBg=i%2===0?'bg-white':'bg-gray-50';
        return `<div class="${rowBg} border-b border-gray-100 px-4 py-3">
            <div class="flex items-center gap-2 mb-2">
                <span class="text-xs text-gray-400 font-bold w-6 text-right">${s.stt||i+1}</span>
                <span class="font-bold text-gray-800 text-sm flex-1">${s.name}</span>
                <span class="text-xs font-bold text-gray-500">ĐTB: ${avgLabel}</span>
                <button onclick="hoaBaAutoOne('${s.id}')" class="text-xs bg-teal-50 text-teal-600 border border-teal-200 px-2 py-1 rounded-lg hover:bg-teal-100 transition font-bold"><i class="fas fa-magic mr-1"></i>Tự động</button>
            </div>
            <textarea id="hbNote_${s.id}" rows="2"
                class="w-full text-sm border-2 border-gray-100 rounded-xl px-3 py-2 focus:outline-none focus:border-teal-400 resize-none bg-white transition"
                placeholder="Nhập nhận xét ${hk==='CN'?'cả năm':hk}..."
                onchange="hoaBaSaveNote('${s.id}','${s.name}',${s.stt||i+1})">${note}</textarea>
        </div>`;
    }).join('');
}

function hoaBaAutoOne(studentId) {
    const s=students.find(st=>st.id==studentId||st.id===studentId); if(!s) return;
    const comment=_hbAutoComment(s.id,_hoaBaHK);
    const ta=document.getElementById(`hbNote_${s.id}`);
    if(ta){ ta.value=comment; hoaBaSaveNote(s.id,s.name,s.stt); }
}

function hoaBaAutoAll() {
    const clsStudents=students.filter(s=>s.classId===currentClassId);
    clsStudents.forEach(s=>{ hoaBaAutoOne(s.id); });
    showToast(`Đã tự động nhận xét ${clsStudents.length} học sinh!`);
}

function hoaBaSaveNote(studentId, name, stt) {
    const ta=document.getElementById(`hbNote_${studentId}`); if(!ta) return;
    const rec=_hbGetOrCreate(studentId,name,stt);
    rec[_hbNoteKey(_hoaBaHK)]=ta.value.trim();
    rec.updatedAt=new Date().toISOString();
    saveData();
    // Update stats
    const clsStudents=students.filter(s=>s.classId===currentClassId);
    const key=_hbNoteKey(_hoaBaHK);
    const filled=clsStudents.filter(s=>{ const r=hoaBa.find(b=>b.classId===currentClassId&&b.studentId===s.id); return r&&r[key]; }).length;
    document.getElementById('hoaBaHKStats').textContent=`Đã nhận xét: ${filled}/${clsStudents.length}`;
}

function exportHoaBaExcel() {
    const cls=classes.find(c=>c.id===currentClassId); if(!cls) return;
    const clsStudents=students.filter(s=>s.classId===currentClassId).sort((a,b)=>(a.stt||999)-(b.stt||999));
    if(!clsStudents.length){showToast('Lớp chưa có học sinh!',false);return;}

    const wsData=[
        [`HỌC BẠ - LỚP ${cls.name.toUpperCase()} - NĂM HỌC ${new Date().getFullYear()-1}-${new Date().getFullYear()}`,'','','','','','',''],
        [`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`,'','','','','','',''],
        [],
        ['STT','Họ và tên','ĐTB HK1','Nhận xét HK1','ĐTB HK2','Nhận xét HK2','ĐTB Cả năm','Nhận xét Cả năm']
    ];
    clsStudents.forEach((s,i)=>{
        const rec=hoaBa.find(b=>b.classId===currentClassId&&b.studentId===s.id);
        const a1=_hbAvgForStudent(s.id,'HK1'), a2=_hbAvgForStudent(s.id,'HK2');
        const aCN=(a1!==null&&a2!==null)?Math.round((a1+a2)/2*10)/10:(a1!==null?a1:a2);
        wsData.push([
            s.stt||i+1, s.name,
            a1!==null?a1:'', rec?rec.hk1Note:'',
            a2!==null?a2:'', rec?rec.hk2Note:'',
            aCN!==null?aCN:'', rec?rec.cnNote:''
        ]);
    });

    const ws=XLSX.utils.aoa_to_sheet(wsData);
    // Header style
    ws['A1'].s={font:{bold:true,color:{rgb:'FFFFFF'},sz:13},fill:{fgColor:{rgb:'0D9488'}},alignment:{horizontal:'center'}};
    ws['A2'].s={font:{italic:true,sz:11,color:{rgb:'555555'}},alignment:{horizontal:'center'}};
    // Column headers (row 4)
    ['A','B','C','D','E','F','G','H'].forEach((col,ci)=>{
        const cr=col+'4'; if(!ws[cr]) return;
        const colors=['1e293b','1e293b','166534','166534','c62828','c62828','6d28d9','6d28d9'];
        const bgs   =['334155','334155','dcfce7','dcfce7','fee2e2','fee2e2','ede9fe','ede9fe'];
        ws[cr].s={font:{bold:true,color:{rgb:colors[ci]},name:'Arial'},fill:{fgColor:{rgb:bgs[ci]}},alignment:{horizontal:'center',vertical:'center'},border:{bottom:{style:'medium',color:{rgb:'666666'}}}};
    });
    // Data rows
    for(let r=4;r<wsData.length;r++){
        ['A','B','C','D','E','F','G','H'].forEach((col,ci)=>{
            const cr=col+(r+1); if(!ws[cr]) return;
            let cs={font:{name:'Arial',sz:11},border:{top:{style:'thin',color:{rgb:'DDDDDD'}},bottom:{style:'thin',color:{rgb:'DDDDDD'}},left:{style:'thin',color:{rgb:'DDDDDD'}},right:{style:'thin',color:{rgb:'DDDDDD'}}},alignment:{vertical:'center'}};
            if(r%2===0) cs.fill={fgColor:{rgb:'F8FFFE'}};
            if(ci===0||ci===2||ci===4||ci===6) cs.alignment.horizontal='center';
            if((ci===2||ci===4||ci===6)&&typeof ws[cr].v==='number'){
                const v=ws[cr].v;
                cs.font.bold=true;
                cs.font.color={rgb:v>=8?'166534':v<5?'B91C1C':'92400E'};
            }
            if(ci===1) cs.font.bold=true;
            if(ci===3||ci===5||ci===7){cs.font.sz=10;cs.font.italic=true;cs.alignment.wrapText=true;}
            ws[cr].s=cs;
        });
    }
    ws['!cols']=[{wch:6},{wch:22},{wch:9},{wch:45},{wch:9},{wch:45},{wch:12},{wch:50}];
    ws['!merges']=[{s:{r:0,c:0},e:{r:0,c:7}},{s:{r:1,c:0},e:{r:1,c:7}}];
    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,ws,'Hoc_Ba');
    XLSX.writeFile(wb,`HocBa_${cls.name.replace(/\s+/g,'_')}_${new Date().getFullYear()}.xlsx`);
    showToast('Đã xuất Học bạ Excel!');
}

function addManualPoints(val) {
    const label = val > 0 ? `Thủ công (+${val})` : `Thủ công (${val})`;
    addPoints('__manual__', val, label);
}
function applyManualPoints() {
    const input = document.getElementById('manualPointsInput');
    const val = parseInt(input.value);
    if(isNaN(val) || val === 0) { showToast('Vui lòng nhập số điểm hợp lệ!', false); return; }
    input.value = '';
    addManualPoints(val);
}

