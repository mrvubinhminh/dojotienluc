// ============================================================
// SỔ HỌP – MEETING NOTES
// ============================================================
const MN_TAGS = ['Cơ quan','Tổ chuyên môn','Lớp 10','Lớp 11','Lớp 12','Khác'];
const MN_TAG_COLOR = {
    'Cơ quan':'bg-blue-100 text-blue-700','Tổ chuyên môn':'bg-purple-100 text-purple-700',
    'Lớp 10':'bg-cyan-100 text-cyan-700','Lớp 11':'bg-green-100 text-green-700',
    'Lớp 12':'bg-red-100 text-red-700','Khác':'bg-gray-100 text-gray-600'
};
let _mnCurrentTag = 'all';
let _mnShowArchive = false;
let _mnEditId = null;
let _mnImportant = false;

function renderMeetingView() {
    const filtered = meetingNotes.filter(n=>{
        if (n.archived !== _mnShowArchive) return false;
        if (_mnCurrentTag !== 'all' && n.tag !== _mnCurrentTag) return false;
        return true;
    });
    // Sort: important first, then by date desc
    filtered.sort((a,b)=>{
        if (a.important && !b.important) return -1;
        if (!a.important && b.important) return 1;
        return (b.date||'').localeCompare(a.date||'');
    });

    const active = meetingNotes.filter(n=>!n.archived);
    const important = active.filter(n=>n.important).length;
    document.getElementById('meetingViewSub').textContent =
        `${active.length} ghi chú · ${important} quan trọng · ${meetingNotes.filter(n=>n.archived).length} lưu trữ`;

    // Badge
    const badge = document.getElementById('meetingBadge');
    const urgent = active.filter(n=>n.important && n.items && n.items.some(i=>!i.done));
    if (urgent.length > 0) { badge.textContent=urgent.length; badge.classList.remove('hidden'); }
    else badge.classList.add('hidden');

    const list = document.getElementById('meetingList');
    const empty = document.getElementById('meetingEmpty');
    if (!filtered.length) { list.innerHTML=''; empty.classList.remove('hidden'); return; }
    empty.classList.add('hidden');

    list.innerHTML = filtered.map(note => {
        const items = note.items || [];
        const doneCount = items.filter(i=>i.done).length;
        const totalCount = items.length;
        const progress = totalCount > 0 ? Math.round(doneCount/totalCount*100) : 0;
        const allDone = totalCount > 0 && doneCount === totalCount;
        const tagColor = MN_TAG_COLOR[note.tag] || 'bg-gray-100 text-gray-600';
        const dateStr = note.date ? new Date(note.date+'T00:00:00').toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'}) : '';

        return `<div class="bg-white rounded-2xl shadow-sm border ${note.important?'border-yellow-300':'border-gray-100'} p-4 ${allDone?'opacity-70':''}">
            <div class="flex items-start justify-between gap-2 mb-2">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1 flex-wrap">
                        ${note.important?'<i class="fas fa-star text-yellow-400 text-sm flex-shrink-0"></i>':''}
                        <span class="text-xs font-bold px-2 py-0.5 rounded-full ${tagColor}">${note.tag}</span>
                        ${dateStr?`<span class="text-xs text-gray-400">${dateStr}</span>`:''}
                    </div>
                    <h3 class="font-black text-gray-800 text-sm leading-snug">${note.title||'(Không có tiêu đề)'}</h3>
                </div>
                <div class="flex items-center gap-1 flex-shrink-0">
                    <button onclick="openMeetingEdit('${note.id}')" class="w-8 h-8 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-amber-100 hover:text-amber-600 transition"><i class="fas fa-edit text-xs"></i></button>
                    <button onclick="mnArchiveToggle('${note.id}')" class="w-8 h-8 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-blue-100 hover:text-blue-600 transition" title="${note.archived?'Khôi phục':'Lưu trữ'}"><i class="fas fa-${note.archived?'inbox':'archive'} text-xs"></i></button>
                    <button onclick="mnDelete('${note.id}')" class="w-8 h-8 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition"><i class="fas fa-trash text-xs"></i></button>
                </div>
            </div>
            ${totalCount > 0 ? `
            <div class="mb-2">
                <div class="flex justify-between text-xs text-gray-400 mb-1"><span>Tiến độ</span><span class="${allDone?'text-green-600 font-bold':''}">${doneCount}/${totalCount} ${allDone?'✅ Hoàn thành':''}</span></div>
                <div class="w-full bg-gray-100 rounded-full h-1.5">
                    <div class="h-1.5 rounded-full transition-all ${allDone?'bg-green-500':'bg-amber-400'}" style="width:${progress}%"></div>
                </div>
            </div>
            <div class="space-y-1.5">
                ${items.map(item=>`
                <div class="flex items-start gap-2">
                    <input type="checkbox" ${item.done?'checked':''} onchange="mnToggleItem('${note.id}','${item.id}',this.checked)"
                        class="mt-0.5 w-4 h-4 rounded border-gray-300 accent-amber-500 flex-shrink-0 cursor-pointer">
                    <span class="text-xs text-gray-700 ${item.done?'line-through text-gray-400':''} leading-relaxed">${item.text}</span>
                </div>`).join('')}
            </div>` : '<p class="text-xs text-gray-400 italic">Không có công việc cụ thể</p>'}
        </div>`;
    }).join('');
}

function mnSetTag(tag) {
    _mnCurrentTag = tag;
    document.querySelectorAll('.mn-tag-btn').forEach(b=>{
        const isActive = b.id === `mnTag_${tag}`;
        b.className = `mn-tag-btn flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full transition ${isActive?'bg-amber-500 text-white ring-2 ring-amber-400 ring-offset-1':'bg-gray-100 text-gray-600 hover:bg-amber-100'}`;
    });
    renderMeetingView();
}
function mnToggleArchive() {
    _mnShowArchive = !_mnShowArchive;
    const btn = document.getElementById('mnArchiveBtn');
    btn.className = `mn-tag-btn flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full transition ${_mnShowArchive?'bg-gray-600 text-white ring-2 ring-gray-400 ring-offset-1':'bg-gray-100 text-gray-500 hover:bg-gray-200'}`;
    if (_mnShowArchive) { _mnCurrentTag='all'; document.querySelectorAll('.mn-tag-btn:not(#mnArchiveBtn)').forEach(b=>{ b.className='mn-tag-btn flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full transition bg-gray-100 text-gray-600 hover:bg-amber-100'; }); }
    renderMeetingView();
}

function openMeetingEdit(id) {
    _mnEditId = id;
    _mnImportant = false;
    const note = id ? meetingNotes.find(n=>n.id===id) : null;
    document.getElementById('mnEditTitle').textContent = note ? '✏️ Sửa ghi chú' : '📓 Ghi chú mới';
    document.getElementById('mnDate').value = note?.date || new Date().toISOString().slice(0,10);
    document.getElementById('mnTag').value = note?.tag || 'Cơ quan';
    document.getElementById('mnTitle').value = note?.title || '';
    _mnImportant = note?.important || false;
    _mnUpdateImportantBtn();
    document.getElementById('mnDeleteBtn').classList.toggle('hidden', !note);
    _mnRenderItems(note?.items || []);
    document.getElementById('mnEditBackdrop').classList.remove('hidden');
    const m = document.getElementById('mnEditModal');
    requestAnimationFrame(()=>{ m.style.transform='translateY(0)'; });
    setTimeout(()=>{ document.getElementById('mnTitle').focus(); }, 350);
}
function closeMeetingEdit() {
    document.getElementById('mnEditModal').style.transform='translateY(100%)';
    setTimeout(()=>{ document.getElementById('mnEditBackdrop').classList.add('hidden'); }, 280);
}

function _mnUpdateImportantBtn() {
    const btn = document.getElementById('mnImportantBtn');
    btn.className = `w-10 h-10 rounded-xl border-2 flex items-center justify-center transition flex-shrink-0 ${_mnImportant?'border-yellow-400 text-yellow-400 bg-yellow-50':'border-gray-200 text-gray-300 hover:border-yellow-400 hover:text-yellow-400'}`;
}
function mnToggleImportant() {
    _mnImportant = !_mnImportant;
    _mnUpdateImportantBtn();
}

let _mnItems = [];
function _mnRenderItems(items) {
    _mnItems = items.map(i=>({...i}));
    const container = document.getElementById('mnItemList');
    container.innerHTML = _mnItems.map((item,i)=>`
        <div class="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
            <i class="fas fa-grip-lines text-gray-300 text-xs flex-shrink-0"></i>
            <input type="text" value="${item.text}" placeholder="Nội dung công việc..."
                class="flex-1 text-xs font-semibold bg-transparent outline-none text-gray-700"
                oninput="_mnItems[${i}].text=this.value">
            <button onclick="_mnRemoveItem(${i})" class="text-gray-300 hover:text-red-400 transition flex-shrink-0"><i class="fas fa-times"></i></button>
        </div>`).join('');
}
function mnAddItem() {
    _mnItems.push({ id: 'item_'+Date.now(), text:'', done:false });
    _mnRenderItems(_mnItems);
    // Focus last input
    setTimeout(()=>{
        const inputs = document.querySelectorAll('#mnItemList input[type=text]');
        if (inputs.length) inputs[inputs.length-1].focus();
    }, 50);
}
function _mnRemoveItem(idx) {
    _mnItems.splice(idx,1);
    _mnRenderItems(_mnItems);
}

function saveMeetingNote() {
    const title = document.getElementById('mnTitle').value.trim();
    const date  = document.getElementById('mnDate').value;
    const tag   = document.getElementById('mnTag').value;
    // Sync text from inputs (in case oninput didn't fire for last char)
    document.querySelectorAll('#mnItemList input[type=text]').forEach((inp,i)=>{ if(_mnItems[i]) _mnItems[i].text=inp.value; });
    const items = _mnItems.filter(i=>i.text.trim());

    if (_mnEditId) {
        const note = meetingNotes.find(n=>n.id===_mnEditId);
        if (note) { note.title=title; note.date=date; note.tag=tag; note.important=_mnImportant; note.items=items; note.updatedAt=new Date().toISOString(); }
    } else {
        meetingNotes.push({ id:'mn_'+Date.now(), date, title, tag, important:_mnImportant, archived:false, archivedAt:null, createdAt:new Date().toISOString(), items });
    }
    saveData(); closeMeetingEdit(); renderMeetingView();
    showToast(_mnEditId ? 'Đã cập nhật ghi chú!' : 'Đã thêm ghi chú mới!');
}

function deleteMeetingNote() {
    if (!_mnEditId || !confirm('Xóa ghi chú này?')) return;
    meetingNotes = meetingNotes.filter(n=>n.id!==_mnEditId);
    saveData(); closeMeetingEdit(); renderMeetingView();
    showToast('Đã xóa ghi chú', false);
}

function mnArchiveToggle(id) {
    const note = meetingNotes.find(n=>n.id===id); if(!note) return;
    note.archived = !note.archived;
    note.archivedAt = note.archived ? new Date().toISOString() : null;
    saveData(); renderMeetingView();
    showToast(note.archived ? '🗄️ Đã lưu trữ' : '📤 Đã khôi phục');
}

function mnDelete(id) {
    if (!confirm('Xóa ghi chú này vĩnh viễn?')) return;
    meetingNotes = meetingNotes.filter(n=>n.id!==id);
    saveData(); renderMeetingView();
    showToast('Đã xóa', false);
}

function mnToggleItem(noteId, itemId, checked) {
    const note = meetingNotes.find(n=>n.id===noteId); if(!note) return;
    const item = note.items && note.items.find(i=>i.id===itemId); if(!item) return;
    item.done = checked;
    // If all done, prompt archive
    const allDone = note.items.every(i=>i.done);
    saveData(); renderMeetingView();
    if (allDone && note.items.length > 0) {
        setTimeout(()=>{
            if (confirm(`✅ "${note.title||'Ghi chú'}" đã hoàn thành tất cả!\nChuyển vào lưu trữ?`)) {
                note.archived=true; note.archivedAt=new Date().toISOString();
                saveData(); renderMeetingView(); showToast('🗄️ Đã lưu trữ ghi chú hoàn thành!');
            }
        }, 300);
    }
}

// Update meeting badge on init
function _updateMeetingBadge() {
    const badge = document.getElementById('meetingBadge');
    if (!badge) return;
    const urgent = meetingNotes.filter(n=>!n.archived && n.important && n.items && n.items.some(i=>!i.done));
    if (urgent.length > 0) { badge.textContent=urgent.length; badge.classList.remove('hidden'); }
    else badge.classList.add('hidden');
}

