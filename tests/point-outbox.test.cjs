// Gỡ tắc hàng đợi điểm: giao dịch bị máy chủ từ chối, giao dịch còn kẹt ở máy chủ cũ.
const test = require('node:test'), assert = require('node:assert/strict'), vm = require('node:vm'), fs = require('node:fs'), crypto = require('node:crypto');
const read = p => fs.readFileSync(require('node:path').join(__dirname, '..', p), 'utf8');
const plain = v => JSON.parse(JSON.stringify(v));
class Storage {
    constructor() { this.map = new Map(); }
    get length() { return this.map.size; } key(i) { return [...this.map.keys()][i] ?? null; }
    getItem(k) { return this.map.get(k) ?? null; } setItem(k, v) { this.map.set(k, String(v)); } removeItem(k) { this.map.delete(k); }
}
class Sheet {
    constructor() { this.rows = []; }
    appendRow(row) { this.rows.push([...row]); } getLastRow() { return this.rows.length; } getMaxColumns() { return 26; } insertColumnsAfter() {}
    getRange(r, c) { return { setValue: v => { this.rows[r-1] ??= []; this.rows[r-1][c-1] = v; }, getValue: () => this.rows[r-1]?.[c-1] ?? '',
        setValues: vs => vs.forEach((row, i) => { this.rows[r-1+i] ??= []; row.forEach((v, j) => this.rows[r-1+i][c-1+j] = v); }) }; }
    getDataRange() { const w = Math.max(1, ...this.rows.map(r => r.length)); return { getValues: () => this.rows.map(r => Array.from({ length: w }, (_, i) => r[i] ?? '')) }; }
}
function server() {
    const sheets = new Map(); const ss = { getSheetByName: n => sheets.get(n), insertSheet: n => { const s = new Sheet(); sheets.set(n, s); return s; } };
    let legacy = { classes: [{ id: 3, name: '11B3' }], students: [
        { id: 6, classId: 3, name: 'Ngọc Anh', points: 5, positivePoints: 5, negativePoints: 0 },
        { id: 7, classId: 3, name: 'Vân Anh', points: 1, positivePoints: 1, negativePoints: 0 }], history: [], periods: [] };
    const ctx = vm.createContext({ JSON, Number, Math, Object, Array, String, isFinite,
        SpreadsheetApp: { getActiveSpreadsheet: () => ss, flush() {} }, LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
        respond: x => x, readLegacyData: () => structuredClone(legacy), writeAllData: d => { legacy = structuredClone(d); } });
    vm.runInContext(read('dojo-sync-v2.gs'), ctx);
    return { call: (action, data) => plain(ctx.doPost({ postData: { contents: JSON.stringify({ action, data }) } })) };
}
const URL_NEW = 'https://script.google.com/macros/s/NEW/exec', URL_OLD = 'https://script.google.com/macros/s/OLD/exec';
function device(srv, url = URL_NEW) {
    const storage = new Storage();
    const ctx = vm.createContext({ crypto, localStorage: storage, console, structuredClone, setTimeout, clearTimeout,
        syncSettings: { url }, currentView: 'classroom', currentClassId: 3, avatarBaseUrl: 'https://avatar/',
        showToast() {}, renderStudents() {}, renderClasses() {}, document: { getElementById: () => null } });
    vm.runInContext(`var classes=[], students=[], history=[], periods=[], gradeRecords=[], subjectGrades=[], meetingNotes=[];
        function saveData(){ capturePointChanges(); }`, ctx);
    for (const f of ['js/point-transactions.js', 'js/auto-sync-tu-ong-ay-len-va-keo-ve-google-sheets.js', 'js/point-outbox-tools.js'])
        vm.runInContext(read(f), ctx, { filename: f });
    vm.runInContext('initializePointJournal()', ctx);
    ctx.rawSyncRequest = async (action, data) => srv.call(action, plain(data));
    const run = code => vm.runInContext(code, ctx);
    run(`_applyPulledData(${JSON.stringify(srv.call('syncPoints', { protocol: 2, batches: [] }).data)})`);
    return { ctx, storage, run };
}
const award = (d, id, n) => d.run(`(s=>{s.points+=${n};s.positivePoints+=${n};saveData()})(students.find(s=>s.id===${id}))`);

test('một giao dịch bị từ chối không còn chặn các giao dịch khác; bỏ nó thì đồng bộ lại bình thường', async () => {
    const srv = server(), a = device(srv), b = device(srv);
    // B chấm điểm cho Vân Anh khi mất mạng; trong lúc đó A xoá Vân Anh khỏi lớp và lưu.
    award(b, 7, 2);
    a.run(`students=students.filter(s=>s.id!==7)`);
    const pushed = srv.call('push', { protocol: 2, baseRevision: 0, snapshot: plain(a.run('({classes,students,history,periods})')) });
    assert.equal(pushed.status, 'ok');
    award(b, 6, 3);                                        // giao dịch hợp lệ chấm sau
    await assert.rejects(b.ctx.flushPointTransactions(), /đã bị xóa/);   // gửi nguyên khối: tắc cả hai
    assert.equal(b.run('pendingPointBatches().length'), 2);

    const r = plain(await b.run('retryOutboxOneByOne()'));
    assert.deepEqual(r, { sent: 1, failed: 1 });
    assert.equal(srv.call('syncPoints', { protocol: 2, batches: [] }).data.students.find(s => s.id === 6).points, 8, 'giao dịch tốt đã tới máy chủ');
    const bad = plain(b.run('pendingPointBatches()'));
    assert.equal(bad.length, 1);
    assert.match(b.run(`_outboxErrors[${JSON.stringify(bad[0].operationId)}]`), /đã bị xóa/);
    assert.match(b.run(`describeOutboxBatch(pendingPointBatches()[0]).text`), /Vân Anh \+2/);

    b.run(`removeOutboxBatches(syncSettings.url, ${JSON.stringify([bad[0].operationId])})`);
    await b.ctx.flushPointTransactions();                  // không còn lỗi
    assert.equal(b.run('pendingPointBatches().length'), 0);
});

test('giao dịch kẹt ở máy chủ cũ hiện trong danh sách và chuyển được sang máy chủ đang dùng', async () => {
    const srv = server(), d = device(srv);
    // Giao dịch được tạo khi máy còn trỏ vào máy chủ cũ (không còn hoạt động).
    d.run(`syncSettings.url=${JSON.stringify(URL_OLD)}`); award(d, 6, 4); d.run(`syncSettings.url=${JSON.stringify(URL_NEW)}`);
    assert.equal(d.run('pendingPointBatches().length'), 0, 'không thuộc máy chủ đang dùng');
    const groups = d.run('[...listOutboxTargets()].map(([t,l])=>[t,l.length])');
    assert.deepEqual(plain(groups), [[URL_OLD, 1]]);
    assert.match(d.run(`_outboxTargetLabel(${JSON.stringify(URL_OLD)})`), /Máy chủ cũ/);
    d.run(`moveOutboxBatches(${JSON.stringify(URL_OLD)}, listOutboxTargets().get(${JSON.stringify(URL_OLD)}))`);
    assert.equal(d.run('pendingPointBatches().length'), 1);
    assert.equal(d.run('listOutboxTargets().size'), 1);
    await d.ctx.flushPointTransactions();
    assert.equal(srv.call('syncPoints', { protocol: 2, batches: [] }).data.students.find(s => s.id === 6).points, 9);
});

test('bỏ giao dịch của máy chủ cũ không đụng tới hàng đợi của máy chủ đang dùng', () => {
    const srv = server(), d = device(srv);
    d.run(`syncSettings.url=${JSON.stringify(URL_OLD)}`); award(d, 6, 4); d.run(`syncSettings.url=${JSON.stringify(URL_NEW)}`);
    award(d, 7, 1);
    const old = plain(d.run(`listOutboxTargets().get(${JSON.stringify(URL_OLD)})`));
    d.run(`removeOutboxBatches(${JSON.stringify(URL_OLD)}, ${JSON.stringify(old.map(b => b.operationId))})`);
    assert.deepEqual(plain(d.run('[...listOutboxTargets().keys()]')), [URL_NEW]);
    assert.equal(d.run('pendingPointBatches().length'), 1);
});
