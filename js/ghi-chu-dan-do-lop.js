// ============================================================
// GHI CHÚ & DẶN DÒ LỚP
// ============================================================
function openClassNotes() {
    if (!currentClassId) { showToast('Chọn lớp trước!', false); return; }
    const cls = classes.find(c=>c.id===currentClassId);
    document.getElementById('classNotesSubtitle').innerText = cls?.name || '';
    document.getElementById('noteItemContent').value = '';
    document.getElementById('noteItemDeadline').value = '';
    renderClassNotes();
    document.getElementById('classNotesBackdrop').classList.remove('hidden');
    setTimeout(()=>{
        document.getElementById('classNotesModal').classList.remove('translate-y-full');
        document.getElementById('noteItemContent').focus();
    }, 10);
    _updateClassNotesBtn();
}

function closeClassNotes() {
    document.getElementById('classNotesModal').classList.add('translate-y-full');
    setTimeout(()=>document.getElementById('classNotesBackdrop').classList.add('hidden'), 300);
}

function addClassNoteItem() {
    const content = document.getElementById('noteItemContent').value.trim();
    if (!content) { document.getElementById('noteItemContent').focus(); return; }
    const deadline = document.getElementById('noteItemDeadline').value || null;
    classNotes.push({
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        classId: currentClassId,
        content,
        deadline,
        done: false,
        doneAt: null,
        createdAt: new Date().toISOString()
    });
    document.getElementById('noteItemContent').value = '';
    document.getElementById('noteItemDeadline').value = '';
    document.getElementById('noteItemContent').focus();
    saveData();
    renderClassNotes();
    _updateClassNotesBtn();
}

function toggleClassNoteItem(id) {
    const note = classNotes.find(n=>n.id===id);
    if (!note) return;
    note.done = !note.done;
    note.doneAt = note.done ? new Date().toISOString() : null;
    saveData();
    renderClassNotes();
    _updateClassNotesBtn();
    if (note.done) showToast('✅ Đã lưu vào mục hoàn thành!');
}

function deleteClassNoteItem(id) {
    classNotes = classNotes.filter(n=>n.id!==id);
    saveData();
    renderClassNotes();
    _updateClassNotesBtn();
}

function _updateClassNotesBtn() {
    const btn = document.getElementById('btnClassNotes');
    if (!btn || !currentClassId) return;
    const active = classNotes.filter(n=>n.classId===currentClassId && !n.done);
    // Show badge if there are pending items
    const today = new Date(); today.setHours(0,0,0,0);
    const overdue = active.filter(n=>n.deadline && new Date(n.deadline+'T00:00:00')<today).length;
    if (overdue > 0) {
        btn.innerHTML = `<i class="fas fa-clipboard-list mr-1"></i>Dặn dò <span class="ml-0.5 bg-red-500 text-white rounded-full text-[9px] font-black px-1.5 py-0.5">${overdue}</span>`;
        btn.className = 'text-red-600 text-xs font-bold bg-red-50 px-2.5 py-1.5 rounded-full hover:bg-red-100 transition border border-red-200 shadow-sm flex items-center';
    } else if (active.length > 0) {
        btn.innerHTML = `<i class="fas fa-clipboard-list mr-1"></i>Dặn dò <span class="ml-0.5 bg-teal-500 text-white rounded-full text-[9px] font-black px-1.5 py-0.5">${active.length}</span>`;
        btn.className = 'text-teal-600 text-xs font-bold bg-teal-50 px-2.5 py-1.5 rounded-full hover:bg-teal-100 transition border border-teal-100 shadow-sm flex items-center';
    } else {
        btn.innerHTML = '<i class="fas fa-clipboard-list mr-1"></i>Dặn dò';
        btn.className = 'text-teal-600 text-xs font-bold bg-teal-50 px-2.5 py-1.5 rounded-full hover:bg-teal-100 transition border border-teal-100 shadow-sm flex items-center';
    }
}

function renderClassNotes() {
    const items  = classNotes.filter(n=>n.classId===currentClassId);
    const today  = new Date(); today.setHours(0,0,0,0);

    const active = items.filter(n=>!n.done).sort((a,b)=>{
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline.localeCompare(b.deadline);
    });
    const done = items.filter(n=>n.done).sort((a,b)=>(b.doneAt||'').localeCompare(a.doneAt||''));

    const deadlineBadge = (dl) => {
        if (!dl) return '';
        const d = new Date(dl+'T00:00:00');
        const diff = Math.round((d-today)/86400000);
        let cls, label;
        if (diff < 0)        { cls='bg-red-100 text-red-600 border-red-200';       label=`Quá hạn ${Math.abs(diff)} ngày`; }
        else if (diff === 0) { cls='bg-orange-100 text-orange-600 border-orange-200'; label='⏰ Hôm nay!'; }
        else if (diff <= 2)  { cls='bg-yellow-100 text-yellow-700 border-yellow-200'; label=`Còn ${diff} ngày`; }
        else if (diff <= 7)  { cls='bg-blue-50 text-blue-600 border-blue-200';       label=`Còn ${diff} ngày`; }
        else                 { cls='bg-gray-100 text-gray-500 border-gray-200';       label=d.toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit'}); }
        return `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full border ${cls} whitespace-nowrap">📅 ${label}</span>`;
    };

    const container = document.getElementById('classNotesList');
    let html = '';

    if (!active.length && !done.length) {
        container.innerHTML = `<div class="text-center py-14 text-gray-400">
            <i class="fas fa-clipboard-check text-5xl opacity-15 mb-4 block"></i>
            <p class="font-bold text-gray-500">Chưa có dặn dò nào</p>
            <p class="text-sm mt-1">Nhập nội dung và bấm <b>Thêm</b> phía trên</p>
        </div>`;
        return;
    }

    // Active items
    if (active.length) {
        html += `<div class="mb-1"><p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">📌 Cần làm (${active.length})</p>`;
        html += active.map(n => `
        <div class="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0 group">
            <button onclick="toggleClassNoteItem('${n.id}')"
                class="w-6 h-6 rounded-lg border-2 border-gray-300 flex-shrink-0 mt-0.5 flex items-center justify-center hover:border-teal-500 hover:bg-teal-50 transition active:scale-90">
            </button>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-bold text-gray-800 leading-snug">${n.content}</p>
                <div class="flex items-center gap-2 mt-1.5 flex-wrap">${deadlineBadge(n.deadline)}</div>
            </div>
            <button onclick="deleteClassNoteItem('${n.id}')"
                class="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 transition flex-shrink-0 active:scale-90">
                <i class="fas fa-trash text-[10px]"></i>
            </button>
        </div>`).join('');
        html += '</div>';
    }

    // Archive section
    if (done.length) {
        html += `
        <div class="mt-4 mb-2">
            <button id="archiveToggleBtn" onclick="_toggleArchive()" class="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-600 mb-2 transition w-full text-left">
                <i id="archiveChevron" class="fas fa-chevron-right text-[10px] transition-transform"></i>
                <span>🗂️ Lưu trữ — đã hoàn thành (${done.length})</span>
            </button>
            <div id="archiveList" class="hidden">
                ${done.map(n=>`
                <div class="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0 group opacity-55 hover:opacity-80 transition">
                    <button onclick="toggleClassNoteItem('${n.id}')"
                        class="w-6 h-6 rounded-lg bg-teal-400 border-2 border-teal-400 flex-shrink-0 mt-0.5 flex items-center justify-center flex-shrink-0 active:scale-90">
                        <i class="fas fa-check text-white text-[9px]"></i>
                    </button>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-semibold text-gray-500 line-through leading-snug">${n.content}</p>
                        <p class="text-[10px] text-gray-400 mt-0.5">✅ ${n.doneAt?new Date(n.doneAt).toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'}):''}</p>
                    </div>
                    <button onclick="deleteClassNoteItem('${n.id}')"
                        class="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 transition flex-shrink-0 active:scale-90">
                        <i class="fas fa-trash text-[10px]"></i>
                    </button>
                </div>`).join('')}
            </div>
        </div>`;
    }

    container.innerHTML = html;
}

function _toggleArchive() {
    const list    = document.getElementById('archiveList');
    const chevron = document.getElementById('archiveChevron');
    if (!list) return;
    const open = !list.classList.contains('hidden');
    list.classList.toggle('hidden', open);
    if (chevron) {
        chevron.style.transform = open ? '' : 'rotate(90deg)';
    }
}

