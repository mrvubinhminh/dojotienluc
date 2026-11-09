// ============================================================
// GIAO DỊCH CHỜ: xem, gửi lại từng cái, chuyển máy chủ, bỏ giao dịch hỏng
// ============================================================
// Hàng đợi điểm gửi nguyên khối; một giao dịch bị máy chủ từ chối (vd. học sinh đã xoá) hoặc thuộc
// một máy chủ cũ không còn dùng sẽ làm tắc mọi lần đồng bộ. Mục này cho giáo viên gỡ tắc mà không mất dấu vết.
const OUTBOX_ROOT = 'dojo_point_outbox_v2:';
let _outboxErrors = {};     // operationId -> lý do máy chủ từ chối
let _outboxBusy = false;

function outboxPrefixFor(url) { return OUTBOX_ROOT + encodeURIComponent(url || 'offline') + ':'; }

// Mọi hàng đợi trên máy, nhóm theo nơi gửi (máy chủ hiện tại, máy chủ cũ, chưa cài đồng bộ).
function listOutboxTargets() {
    const groups = new Map();
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith(OUTBOX_ROOT)) continue;
        const rest = key.slice(OUTBOX_ROOT.length), cut = rest.lastIndexOf(':');
        if (cut < 0) continue;
        const target = decodeURIComponent(rest.slice(0, cut));
        let batch; try { batch = JSON.parse(localStorage.getItem(key)); } catch { continue; }
        if (!groups.has(target)) groups.set(target, []);
        groups.get(target).push(batch);
    }
    for (const list of groups.values()) list.sort((a, b) => a.createdAt - b.createdAt);
    return groups;
}

function describeOutboxBatch(b) {
    const time = new Date(b.timestamp || b.createdAt).toLocaleString('vi-VN', {hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit'});
    if (b.type === 'classReset') {
        const cls = classes.find(c => String(c.id) === String(b.classId));
        return {time, text: `Reset điểm lớp ${cls ? cls.name : '#' + b.classId}`};
    }
    const parts = (b.changes || []).map(c => `${c.studentName || '#' + c.studentId} ${c.delta > 0 ? '+' : ''}${c.delta}`);
    const text = parts.length > 3 ? parts.slice(0, 3).join(', ') + ` và ${parts.length - 3} em khác` : parts.join(', ');
    return {time, text: text || 'Không có thay đổi'};
}

function _outboxTargetLabel(target) {
    if (target === 'offline') return 'Chấm lúc chưa cài đồng bộ';
    const m = target.match(/\/macros\/s\/([^/]+)\/exec/);
    return 'Máy chủ cũ ' + (m ? m[1].slice(0, 10) + '…' + m[1].slice(-6) : target.slice(0, 40));
}

// File dự phòng trước khi bỏ: có thể gửi cho người hỗ trợ hoặc đối chiếu lại sau.
function downloadOutboxFile(batches, reason) {
    const blob = new Blob([JSON.stringify({app:'LopHocTichCuc', kind:'pointOutbox', reason, savedAt:new Date().toISOString(), batches}, null, 1)], {type:'application/json'});
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = `GiaoDichDiem_DuPhong_${Date.now()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function removeOutboxBatches(target, ids) {
    const prefix = outboxPrefixFor(target === 'offline' ? '' : target);
    for (const id of ids) { localStorage.removeItem(prefix + id); delete _outboxErrors[id]; }
}

function moveOutboxBatches(fromTarget, batches) {
    const from = outboxPrefixFor(fromTarget === 'offline' ? '' : fromTarget);
    for (const b of batches) {
        localStorage.setItem(pointPrefix() + b.operationId, JSON.stringify(b));
        localStorage.removeItem(from + b.operationId);
    }
}

// Gửi từng giao dịch một theo thứ tự: giao dịch tốt được máy chủ nhận, giao dịch hỏng được đánh dấu kèm lý do.
async function retryOutboxOneByOne() {
    if (!syncSettings.url) throw new Error('Chưa cài Deployment ID.');
    if (_pointSyncFlight) { try { await _pointSyncFlight; } catch (e) {} }
    capturePointChanges();
    _outboxErrors = {};
    let sent = 0;
    for (const b of pendingPointBatches()) {
        const {recovery, ...batch} = b;
        let res;
        try { res = await rawSyncRequest('syncPoints', {protocol: POINT_PROTOCOL, batches: [batch]}); }
        catch (e) { throw new Error('Không kết nối được máy chủ: ' + e.message); }
        if (res.protocol !== POINT_PROTOCOL) throw new Error(res.message || 'Máy chủ chưa chạy Apps Script V2.');
        if (res.status === 'ok' && res.data) {
            capturePointChanges();
            if (typeof syncSnapshotFromServer === 'function') syncSnapshotFromServer(res.data); else applyPointSnapshot(res.data);
            sent++;
        } else {
            _outboxErrors[b.operationId] = res.message || 'Máy chủ từ chối';
        }
    }
    return {sent, failed: Object.keys(_outboxErrors).length};
}

// Sau khi bỏ giao dịch: lấy lại điểm đúng từ máy chủ để điểm trên màn hình không còn phần đã bỏ.
async function _refreshAfterDiscard() {
    if (!syncSettings.url) { refreshPointViews(); return; }
    try { await flushPointTransactions(); } catch (e) { console.warn(e); }
    refreshPointViews();
}

// ----- Giao diện trong hộp thoại Đồng bộ -----
function renderPointOutboxPanel() {
    const box = document.getElementById('pointOutboxPanel');
    if (!box) return;
    const groups = listOutboxTargets();
    const current = syncSettings.url || 'offline';
    const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const total = [...groups.values()].reduce((n, l) => n + l.length, 0);
    if (!total) { box.classList.add('hidden'); box.innerHTML = ''; return; }
    box.classList.remove('hidden');
    let html = `<h3 class="font-bold text-gray-700 mb-1 flex items-center gap-2"><i class="fas fa-inbox text-amber-500"></i> Giao dịch điểm đang chờ <span class="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">${total}</span></h3>
        <p class="text-[11px] text-gray-400 mb-3">Điểm đã chấm nhưng máy chủ chưa nhận. Nếu cứ báo lỗi, bấm "Gửi lại & tìm lỗi" để gửi từng cái và tìm cái bị từ chối.</p>`;
    for (const [target, list] of groups) {
        const isCurrent = target === current;
        const failedIds = list.filter(b => _outboxErrors[b.operationId]).map(b => b.operationId);
        const t = esc(target);
        html += `<div class="border ${isCurrent ? 'border-gray-200' : 'border-amber-200 bg-amber-50'} rounded-xl p-3 mb-2">
            <p class="text-xs font-bold ${isCurrent ? 'text-gray-600' : 'text-amber-700'} mb-2">${isCurrent ? (syncSettings.url ? 'Máy chủ đang dùng' : 'Trên máy này (chưa cài đồng bộ)') : esc(_outboxTargetLabel(target))} · ${list.length} giao dịch</p>
            <div class="max-h-40 overflow-y-auto mb-2">${list.map(b => { const d = describeOutboxBatch(b), err = _outboxErrors[b.operationId];
                return `<div class="flex gap-2 py-1 border-b border-gray-100 last:border-none text-[11px]">
                    <span class="text-gray-400 flex-shrink-0">${esc(d.time)}</span>
                    <span class="flex-1 ${err ? 'text-red-600 font-bold' : 'text-gray-700'}">${esc(d.text)}${err ? `<br><span class="font-normal">⛔ ${esc(err)}</span>` : ''}</span></div>`; }).join('')}</div>
            <div class="flex flex-wrap gap-2">
            ${isCurrent && syncSettings.url ? `<button onclick="outboxRetry()" class="flex-1 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg"><i class="fas fa-rotate mr-1"></i>Gửi lại & tìm lỗi</button>` : ''}
            ${isCurrent && failedIds.length ? `<button onclick="outboxDiscard('${t}', true)" class="flex-1 py-2 bg-red-50 text-red-700 border border-red-200 text-xs font-bold rounded-lg"><i class="fas fa-trash mr-1"></i>Bỏ ${failedIds.length} giao dịch lỗi</button>` : ''}
            ${!isCurrent && syncSettings.url ? `<button onclick="outboxMove('${t}')" class="flex-1 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg"><i class="fas fa-right-left mr-1"></i>Chuyển sang máy chủ đang dùng</button>` : ''}
            ${!isCurrent ? `<button onclick="outboxDiscard('${t}', false)" class="flex-1 py-2 bg-white text-red-700 border border-red-200 text-xs font-bold rounded-lg"><i class="fas fa-trash mr-1"></i>Bỏ</button>` : ''}
            </div></div>`;
    }
    box.innerHTML = html;
}

async function outboxRetry() {
    if (_outboxBusy) return;
    _outboxBusy = true;
    setSyncStatus('loading', 'Đang gửi từng giao dịch...');
    try {
        const r = await retryOutboxOneByOne();
        if (r.failed) setSyncStatus('error', `Đã gửi ${r.sent} giao dịch. ${r.failed} giao dịch bị máy chủ từ chối (tô đỏ bên dưới) — có thể bỏ chúng.`);
        else { setSyncStatus('ok', `✅ Đã gửi hết ${r.sent} giao dịch.`); showToast('Đã đồng bộ điểm ☁️'); }
    } catch (e) { setSyncStatus('error', e.message); }
    _outboxBusy = false;
    renderPointOutboxPanel();
}

async function outboxDiscard(target, onlyFailed) {
    const list = listOutboxTargets().get(target) || [];
    const batches = onlyFailed ? list.filter(b => _outboxErrors[b.operationId]) : list;
    if (!batches.length) return;
    const preview = batches.slice(0, 5).map(b => '• ' + describeOutboxBatch(b).text).join('\n');
    if (!confirm(`Bỏ ${batches.length} giao dịch điểm này?\n${preview}${batches.length > 5 ? '\n…' : ''}\n\nĐiểm của các giao dịch này sẽ KHÔNG được cộng/trừ trên máy chủ. Một file dự phòng sẽ được tải về trước.`)) return;
    downloadOutboxFile(batches, onlyFailed ? 'Máy chủ từ chối' : 'Bỏ hàng đợi của ' + target);
    removeOutboxBatches(target, batches.map(b => b.operationId));
    setSyncStatus('ok', `Đã bỏ ${batches.length} giao dịch (đã tải file dự phòng).`);
    await _refreshAfterDiscard();
    renderPointOutboxPanel();
}

async function outboxMove(target) {
    const list = listOutboxTargets().get(target) || [];
    if (!list.length || !syncSettings.url) return;
    if (!confirm(`Chuyển ${list.length} giao dịch sang máy chủ đang dùng? Điểm trong các giao dịch này sẽ được cộng/trừ vào điểm trên máy chủ đang dùng.`)) return;
    moveOutboxBatches(target, list);
    renderPointOutboxPanel();
    await outboxRetry();
}
