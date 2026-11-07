// ============================================================
// AUTO-SYNC: tự động đẩy lên và kéo về Google Sheets
// ============================================================
let _autoSyncTimer             = null;
let _autoSyncCountdownInterval = null;
let _autoPullInterval          = null;
let _lastLocalChangeTime       = 0;

function scheduleAutoSync() {
    if (!syncSettings.url) return;
    _lastLocalChangeTime = Date.now();
    clearTimeout(_autoSyncTimer);
    _showAutoSyncBadge('upload', 'Điểm đang chờ đồng bộ...');
    _autoSyncTimer = setTimeout(async () => {
        _showAutoSyncBadge('spinner', 'Đang lưu điểm...');
        try {
            await flushPointTransactions();
            syncSettings.lastSync = new Date().toISOString();
            saveData();
            if (pendingPointBatches().length) scheduleAutoSync();
            else _showAutoSyncBadge('check', 'Đã lưu điểm ☁️', 2500);
        } catch(e) {
            _showAutoSyncBadge('upload', 'Chưa đồng bộ: ' + e.message);
            // Durable outbox survives reload; retry even when the last push failed.
            _autoSyncTimer = setTimeout(scheduleAutoSync, 20000);
        }
    }, 1500);
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
    capturePointChanges();
    const pending = pendingPointBatches();
    const localStudents = students;
    if (d.classes) classes=d.classes;
    if (d.students) {
        students=d.students.map(s => {
            const local=localStudents.find(l=>String(l.id)===String(s.id));
            return {...s,avatar:local?.avatar?.startsWith('data:image') ? local.avatar : (s.avatar || avatarBaseUrl+s.name)};
        });
        // A student added offline with pending points must not disappear on import.
        for (const batch of pending) for (const c of batch.changes) {
            const local=localStudents.find(s=>String(s.id)===String(c.studentId));
            if(local && !students.some(s=>String(s.id)===String(local.id))) students.push({...local,points:c.opening.points,positivePoints:c.opening.positivePoints,negativePoints:c.opening.negativePoints});
        }
    }
    if (d.periods) periods=d.periods;
    if (d.gradeRecords) gradeRecords=d.gradeRecords;
    if (d.subjectGrades) subjectGrades=d.subjectGrades;
    if (d.meetingNotes) meetingNotes=d.meetingNotes;
    localStorage.setItem(pointRevisionKey(),JSON.stringify(d.revision));
    syncSettings.lastSync=new Date().toISOString();
    applyPointSnapshot(d);
}

async function _silentPull() {
    if (!syncSettings.url) return;
    try {
        // A single shared flight handles polling, retries and point updates.
        await flushPointTransactions();
        if (pendingPointBatches().length) scheduleAutoSync();
    } catch(e) {
        _showAutoSyncBadge('upload', 'Chưa đồng bộ: ' + e.message);
    }
}

function startAutoPull() {
    if (_autoPullInterval) return;
    _autoPullInterval=setInterval(_silentPull,30000);
    if (pendingPointBatches().length) scheduleAutoSync();
}
