// ============================================================
// HISTORY
// ============================================================
function renderHistory() {
    const container=document.getElementById('historyList'); container.innerHTML='';
    const q=(document.getElementById('historySearch').value||'').toLowerCase().trim();
    const ch=history.filter(h=>h.classId===currentClassId&&(q===''||h.studentName.toLowerCase().includes(q)));

    if(!ch.length){container.innerHTML='<div class="text-center py-10 text-gray-400 font-semibold bg-white rounded-xl border border-gray-100">Chưa có lịch sử chấm điểm.</div>';return;}

    const sorted=[...ch].sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));
    const groups={};
    sorted.forEach(h=>{
        const key=new Date(h.timestamp).toLocaleDateString('vi-VN',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'});
        if(!groups[key]) groups[key]=[];
        groups[key].push(h);
    });

    Object.entries(groups).forEach(([date,items])=>{
        container.insertAdjacentHTML('beforeend',`<div class="text-xs font-bold text-gray-400 uppercase tracking-wide mt-3 mb-1 px-1">${date}</div>`);
        items.forEach(h=>{
            const isPos=h.points>0;
            const time=new Date(h.timestamp).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});
            const st=students.find(s=>s.id===h.studentId);
            const avatar=st?st.avatar:avatarBaseUrl+h.studentName.replace(/\s/g,'');
            container.insertAdjacentHTML('beforeend',`
                <div class="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex items-center gap-3">
                    <img src="${avatar}" class="w-10 h-10 rounded-full bg-blue-50 p-0.5 flex-shrink-0 object-contain">
                    <div class="flex-1 overflow-hidden">
                        <p class="font-bold text-gray-800 text-sm truncate">${h.studentName}</p>
                        <p class="text-xs text-gray-500">${h.skillName} · ${time}</p>
                    </div>
                    <div class="font-black text-base flex-shrink-0 ${isPos?'text-dojo-green':'text-dojo-red'}">${isPos?'+':''}${h.points}</div>
                </div>`);
        });
    });
}

function clearHistory() {
    if(confirm('Xóa toàn bộ lịch sử chấm điểm của lớp này?')){
        history=history.filter(h=>h.classId!==currentClassId);
        saveData(); renderHistory(); showToast('Đã xóa lịch sử',false);
    }
}

