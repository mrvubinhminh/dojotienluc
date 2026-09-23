// ============================================================
// STUDENTS
// ============================================================
function renderStudents() {
    const cls=classes.find(c=>c.id===currentClassId);
    if(!cls) {
        document.getElementById('headerClassName').innerHTML=`Chưa chọn lớp <i class="fas fa-caret-down text-sm"></i>`;
        document.getElementById('studentGrid').innerHTML='<div class="col-span-full text-center py-10 text-gray-400">Bạn chưa có lớp nào. Hãy tạo lớp mới!</div>';
        document.getElementById('studentCount').innerText='0';
        document.getElementById('totalClassPoints').innerText='Tổng điểm: 0';
        return;
    }
    document.getElementById('headerClassName').innerHTML=`${cls.name} <i class="fas fa-caret-down text-sm"></i>`;
    const grid=document.getElementById('studentGrid');
    grid.innerHTML='';
    let total=0;
    const si=document.getElementById('searchInput'); if(si) si.value='';
    // Reset STT panel khi đổi lớp hoặc re-render
    if(sttPanelOpen) { sttSelected.clear(); renderSttChips(); updateSttAwardBtn(); }
    students.filter(s=>s.classId===currentClassId).forEach((student,i)=>{
        total+=student.points;
        const pColor=student.points>0?'bg-dojo-green text-white shadow-green-200':(student.points<0?'bg-dojo-red text-white shadow-red-200':'bg-gray-200 text-gray-700');
        const stt=student.stt||(i+1);
        const ms=getMilestone(student.points);
        grid.insertAdjacentHTML('beforeend',`
            <div id="student-card-${student.id}" data-name="${student.name.toLowerCase()}" data-stt="${stt}" data-id="${student.id}" class="student-card bg-white rounded-xl shadow-sm border border-gray-100 p-1.5 flex flex-col items-center cursor-pointer relative transition-all duration-300" onclick="handleCardClick(${student.id})">
                <!-- Checkbox overlay -->
                <div id="check-${student.id}" class="card-checkbox hidden absolute inset-0 rounded-xl bg-dojo-blue bg-opacity-15 flex items-end justify-center pb-1 pointer-events-none z-10">
                    <div class="w-5 h-5 bg-dojo-blue rounded-full flex items-center justify-center shadow-md"><i class="fas fa-check text-white text-[9px]"></i></div>
                </div>
                <div class="absolute top-1 left-1 bg-gray-100 text-gray-500 text-[9px] font-bold px-1 py-0.5 rounded leading-none">#${stt}</div>
                <div class="absolute top-1 right-1 ${pColor} w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold leading-none" id="badge-${student.id}">${student.points}</div>
                <img src="${student.avatar}" class="w-11 h-11 bg-blue-50 rounded-full mb-1 p-0.5 object-contain mt-3">
                <h3 class="text-[11px] font-bold text-gray-700 text-center truncate w-full px-0.5 leading-snug">${student.name}</h3>
                <div class="h-4 flex items-center">${ms?`<span class="text-sm leading-none" title="${ms.label}">${ms.icon}</span>`:''}</div>
            </div>`);
    });
    document.getElementById('totalClassPoints').innerText=`Tổng điểm: ${total}`;
    document.getElementById('studentCount').innerText=students.filter(s=>s.classId===currentClassId).length;
}

// ---- Multi-select state ----
let groupSelectMode = false;
let groupSelected   = new Set();
let _isGroupAward   = false;
let _groupTargetIds = [];

function filterStudents(e) {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    const raw = searchInput.value.trim();
    const terms = raw.split(',').map(t=>t.trim().toLowerCase()).filter(t=>t.length>0);

    const visibleIds = [];
    document.querySelectorAll('.student-card').forEach(card=>{
        const match = !raw || terms.some(t => card.dataset.stt===t || card.dataset.name.includes(t));
        card.style.display = match ? 'flex' : 'none';
        if (match) visibleIds.push(parseInt(card.dataset.id));
    });

    const bar = document.getElementById('multiSelectBar');
    if (bar) {
        if (terms.length >= 2 && visibleIds.length >= 2) {
            bar.classList.remove('hidden');
            document.getElementById('multiSelectInfo').innerText = `${visibleIds.length} học sinh được chọn`;
        } else {
            bar.classList.add('hidden');
            exitGroupSelectMode();
        }
    }
    
    // Nếu ấn Enter và chỉ có 1 học sinh thỏa mãn thì mở bảng điểm luôn
    if (e && e.key === 'Enter' && visibleIds.length === 1) {
        if (typeof openPointsModal === 'function') {
            openPointsModal(visibleIds[0]);
            searchInput.value = '';
            filterStudents(); // reset
            searchInput.blur();
        }
    }
}

function handleCardClick(id) {
    if (groupSelectMode) toggleSelectStudent(id);
    else openPointsModal(id);
}

function toggleGroupSelectMode() {
    groupSelectMode = !groupSelectMode;
    const btn = document.getElementById('btnGroupMode');
    if (groupSelectMode) {
        btn.innerHTML = '<i class="fas fa-times mr-1"></i>Hủy chọn';
        btn.className = 'text-xs bg-red-50 text-red-600 font-bold px-3 py-1.5 rounded-full border border-red-200 whitespace-nowrap';
        // Hiện checkbox trên tất cả card đang visible
        document.querySelectorAll('.student-card').forEach(card=>{
            if (card.style.display !== 'none') {
                card.querySelector('.card-checkbox')?.classList.remove('hidden');
            }
        });
    } else {
        exitGroupSelectMode();
    }
}

function toggleSelectStudent(id) {
    const card  = document.getElementById(`student-card-${id}`);
    const check = document.getElementById(`check-${id}`);
    if (groupSelected.has(id)) {
        groupSelected.delete(id);
        check?.classList.add('hidden');
        card?.classList.remove('ring-2','ring-dojo-blue','scale-[0.97]');
    } else {
        groupSelected.add(id);
        check?.classList.remove('hidden');
        card?.classList.add('ring-2','ring-dojo-blue','scale-[0.97]');
    }
    updateGroupFloatBtn();
}

function updateGroupFloatBtn() {
    const btn = document.getElementById('floatingGroupBtn');
    if (groupSelectMode && groupSelected.size > 0) {
        btn.classList.remove('hidden');
        document.getElementById('floatingGroupCount').innerText = `Cho điểm (${groupSelected.size} học sinh)`;
    } else {
        btn.classList.add('hidden');
    }
}

function exitGroupSelectMode() {
    groupSelectMode = false;
    groupSelected.clear();
    document.getElementById('floatingGroupBtn')?.classList.add('hidden');
    const btn = document.getElementById('btnGroupMode');
    if (btn) {
        btn.innerHTML = '<i class="fas fa-check-square mr-1"></i>Chọn riêng';
        btn.className = 'text-xs bg-white text-dojo-blue font-bold px-3 py-1.5 rounded-full border border-dojo-blue whitespace-nowrap';
    }
    document.querySelectorAll('.card-checkbox').forEach(cb=>cb.classList.add('hidden'));
    document.querySelectorAll('.student-card').forEach(card=>card.classList.remove('ring-2','ring-dojo-blue','scale-[0.97]'));
}

function awardAllFiltered() {
    // Lấy tất cả card đang visible
    const ids = [];
    document.querySelectorAll('.student-card').forEach(card=>{
        if (card.style.display !== 'none') ids.push(parseInt(card.dataset.id));
    });
    if (!ids.length) return;
    openGroupModal(ids, `${ids.length} học sinh đã lọc`);
}

function openGroupPointsModal() {
    const ids = [...groupSelected];
    if (!ids.length) return;
    openGroupModal(ids, `${ids.length} học sinh đã chọn`);
}

function openGroupModal(ids, label) {
    _isGroupAward   = true;
    _groupTargetIds = ids;
    isAwardAll      = false;
    selectedStudentId = null;

    document.getElementById('modalStudentName').innerText = label;
    document.getElementById('modalStudentInfo').style.display = 'none';
    document.getElementById('modalStudentPoints').innerText = ids.length + ' học sinh';
    document.getElementById('modalAvatar').style.display = 'none';
    document.getElementById('btnEditStudent').classList.add('hidden');
    document.getElementById('btnShareStudent').classList.add('hidden');
    document.getElementById('btnStudentProfile').classList.add('hidden');
    document.getElementById('btnCertStudent').classList.add('hidden');
    document.getElementById('btnDeleteStudent').classList.add('hidden');
    document.getElementById('backdrop').classList.remove('hidden');
    document.getElementById('pointsModal').classList.remove('translate-y-full');
    switchTab('positive');
}

function openAddStudentModal() { document.getElementById('addStudentBackdrop').classList.remove('hidden'); document.getElementById('addStudentModal').classList.remove('hidden'); document.getElementById('newStudentName').focus(); }
function closeAddStudentModal() { document.getElementById('addStudentBackdrop').classList.add('hidden'); document.getElementById('addStudentModal').classList.add('hidden'); document.getElementById('newStudentName').value=''; }
function addStudent() {
    if(!currentClassId) return alert('Tạo lớp trước!');
    const n=document.getElementById('newStudentName').value.trim(); if(!n) return;
    const cs=students.filter(s=>s.classId===currentClassId);
    const id=students.length?Math.max(...students.map(s=>s.id))+1:1;
    const seed=n.normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/\s/g,"");
    students.push({id,classId:currentClassId,stt:cs.length+1,name:n,dob:'',points:0,positivePoints:0,negativePoints:0,avatar:avatarBaseUrl+seed});
    saveData(); renderStudents(); closeAddStudentModal(); showToast(`Đã thêm ${n}!`);
}

function handleExcelUpload(e, isSyncUpdate = false) {
    if(!currentClassId){alert('Chọn lớp trước!');e.target.value='';return;}
    const f=e.target.files[0]; if(!f) return;
    const r=new FileReader();
    r.onload=function(ev){
        try{
            const wb=XLSX.read(new Uint8Array(ev.target.result),{type:'array'});
            const rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1});
            let c=0, updated=0;
            
            // Lấy danh sách học sinh hiện tại của lớp
            let currentStudents = students.filter(s => s.classId === currentClassId);
            let keepIds = new Set();
            
            for(let i=1;i<rows.length;i++){
                const row=rows[i]; if(!row||!row.length) continue;
                let stt,name,dob;
                if(row.length===1||(row[0]&&!row[1]&&typeof row[0]==='string')){name=row[0];stt=currentStudents.length+1;dob='';}
                else{stt=parseInt(row[0]);name=row[1];dob=row[2]?row[2].toString():'';}
                
                if(name&&typeof name==='string'&&name.trim()){
                    name = name.trim();
                    if(isSyncUpdate && stt) {
                        // Tìm học sinh có cùng STT
                        let existing = currentStudents.find(s => parseInt(s.stt) === parseInt(stt));
                        if (existing) {
                            const oldName = existing.name;
                            existing.name = name;
                            existing.realName = name;
                            if (dob) existing.dob = dob.trim();
                            
                            // Nếu tên đổi mà ảnh cũ là ảnh Dicebear mặc định thì đổi seed
                            if (oldName !== name && existing.avatar && !existing.avatar.startsWith('data:image')) {
                                const seed = name.normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/\s/g,"");
                                existing.avatar = avatarBaseUrl + seed;
                            }
                            keepIds.add(existing.id);
                            updated++;
                            c++;
                            continue;
                        }
                    }
                    
                    // Nếu không phải sync đè, hoặc không tìm thấy STT, thêm mới
                    const id=students.length?Math.max(...students.map(s=>s.id))+1:1;
                    const seed=name.normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/\s/g,"");
                    const newStudent = {id,classId:currentClassId,stt:stt||(currentStudents.length+1),name:name,realName:name,dob:dob?dob.trim():'',points:0,positivePoints:0,negativePoints:0,avatar:avatarBaseUrl+seed};
                    students.push(newStudent);
                    currentStudents.push(newStudent); // Cập nhật local ref
                    if(isSyncUpdate) keepIds.add(id);
                    c++;
                }
            }
            
            if (isSyncUpdate) {
                // Xoá những em không có trong danh sách đè
                students = students.filter(s => s.classId !== currentClassId || keepIds.has(s.id));
            }
            
            const sb=document.getElementById('sidebar');
            if(sb.classList.contains('sidebar-open'))toggleSidebar();
            saveData();
            if(currentView==='classroom')renderStudents(); else renderReport();
            showToast(isSyncUpdate ? `Đã đồng bộ đè: Cập nhật ${updated} và thêm mới ${c - updated} học sinh!` : `Đã nhập thêm ${c} học sinh!`);
        }catch(err){console.error(err);alert("Lỗi file Excel. Form: Cột A(STT), Cột B(Họ Tên), Cột C(Ngày sinh)");}
    };
    r.readAsArrayBuffer(f);
    e.target.value='';
}



// ============================================================
// JSON BACKUP / RESTORE
// ============================================================
function exportJsonData() {
    const data = {
        classes: classes,
        students: students,
        groups: groups,
        seatingMaps: seatingMaps,
        records: records,
        classSettings: classSettings,
        syncSettings: syncSettings
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "LopHocTichCuc_Backup_" + new Date().getTime() + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function importJsonData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!confirm("CẢNH BÁO: Việc phục hồi sẽ XÓA TOÀN BỘ dữ liệu hiện tại trên máy này và thay bằng dữ liệu từ file. Bạn có chắc chắn muốn tiếp tục?")) {
        event.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.classes && Array.isArray(data.classes)) {
                localStorage.setItem('dojo_classes', JSON.stringify(data.classes || []));
                localStorage.setItem('dojo_students', JSON.stringify(data.students || []));
                localStorage.setItem('dojo_groups', JSON.stringify(data.groups || []));
                localStorage.setItem('dojo_seating', JSON.stringify(data.seatingMaps || []));
                localStorage.setItem('dojo_records', JSON.stringify(data.records || []));
                localStorage.setItem('dojo_classSettings', JSON.stringify(data.classSettings || {}));
                localStorage.setItem('dojo_syncSettings', JSON.stringify(data.syncSettings || {}));
                
                showToast("Phục hồi dữ liệu thành công! Đang tải lại...");
                setTimeout(() => window.location.reload(), 1500);
            } else {
                alert("File không hợp lệ hoặc bị lỗi định dạng!");
            }
        } catch (err) {
            console.error(err);
            alert("Lỗi khi đọc file JSON!");
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}
