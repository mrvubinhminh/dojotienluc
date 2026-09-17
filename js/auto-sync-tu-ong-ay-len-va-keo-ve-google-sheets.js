// ============================================================
// AUTO-SYNC: tự động đẩy lên và kéo về Google Sheets
// ============================================================
let _autoSyncTimer             = null;
let _autoSyncCountdownInterval = null;
let _autoPullInterval          = null;
let _lastLocalChangeTime       = 0;

function scheduleAutoSync() {
    if (!syncSettings.url || syncSettings.url === DEFAULT_SYNC_URL) return;
    _lastLocalChangeTime = Date.now();
    clearTimeout(_autoSyncTimer);
    clearInterval(_autoSyncCountdownInterval);

    let remaining = 10;
    _showAutoSyncBadge('upload', `Đồng bộ trong ${remaining}s...`);
    _autoSyncCountdownInterval = setInterval(() => {
        remaining--;
        if (remaining > 0) _showAutoSyncBadge('upload', `Đồng bộ trong ${remaining}s...`);
        else clearInterval(_autoSyncCountdownInterval);
    }, 1000);

    _autoSyncTimer = setTimeout(async () => {
        clearInterval(_autoSyncCountdownInterval);
        _showAutoSyncBadge('spinner', 'Đang đồng bộ...');
        try {
            const result = await syncRequest('push', { classes, students, history, periods, gradeRecords, subjectGrades });
            if (result.status === 'ok') {
                syncSettings.lastSync   = new Date().toISOString();
                syncSettings.lastPushTime = Date.now();
                saveData();
                _showAutoSyncBadge('check', 'Đã lưu ☁️', 2500);
            } else {
                _hideAutoSyncBadge();
            }
        } catch(e) {
            console.warn('Auto-sync push failed:', e.message);
            _hideAutoSyncBadge();
        }
    }, 10000);
}

function _showAutoSyncBadge(type, text, autohideMs) {
    const badge = document.getElementById('autoSyncBadge');
    const icon  = document.getElementById('autoSyncIcon');
    const label = document.getElementById('autoSyncText');
    if (!badge) return;
    const icons = {
        upload:   '<i class="fas fa-cloud-upload-alt text-blue-400"></i>',
        spinner:  '<i class="fas fa-spinner fa-spin text-blue-500"></i>',
        check:    '<i class="fas fa-check-circle text-green-500"></i>',
        download: '<i class="fas fa-cloud-download-alt text-emerald-500"></i>',
    };
    icon.innerHTML    = icons[type] || icons.upload;
    label.textContent = text;
    badge.classList.remove('hidden');
    if (autohideMs) setTimeout(_hideAutoSyncBadge, autohideMs);
}

function _hideAutoSyncBadge() {
    document.getElementById('autoSyncBadge')?.classList.add('hidden');
}

function _applyPulledData(d) {
    if (d.classes)      classes       = d.classes;
    if (d.students)     students      = d.students.map(s => ({
        ...s,
        avatar: s.avatar || (avatarBaseUrl + (s.name||'student').normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/\s/g,""))
    }));
    if (d.history)      history       = d.history;
    if (d.periods)      periods       = d.periods;
    if (d.gradeRecords) gradeRecords  = d.gradeRecords;
    if (d.subjectGrades) subjectGrades = d.subjectGrades;
    syncSettings.lastSync = new Date().toISOString();
    saveData();
    renderClasses();
    if (currentView === 'classroom')  renderStudents();
    else if (currentView === 'report') renderReport();
}

async function _silentPull() {
    if (!syncSettings.url || syncSettings.url === DEFAULT_SYNC_URL) return;
    if (Date.now() - _lastLocalChangeTime < 20000) return; // local change pending — skip
    try {
        const result = await syncRequest('pull');
        if (result.status !== 'ok' || !result.data) return;
        const remoteHistory = result.data.history || [];
        const localIds      = new Set(history.map(h => String(h.id)));
        const hasNew        = remoteHistory.some(h => !localIds.has(String(h.id)));
        if (!hasNew) return;
        _applyPulledData(result.data);
        _showAutoSyncBadge('download', 'Cập nhật từ thiết bị khác 🔄', 3000);
    } catch(e) { /* silent — do not disrupt user */ }
}

function startAutoPull() {
    if (_autoPullInterval) return;
    _autoPullInterval = setInterval(_silentPull, 30000); // poll every 30s
}

