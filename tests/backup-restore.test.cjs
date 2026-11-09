// Sao lưu / phục hồi file JSON, khi không đồng bộ và khi đang đồng bộ với máy chủ V2.
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
    let legacy = { classes: [{ id: 3, name: '11B3' }], students: [{ id: 6, classId: 3, name: 'Ngọc Anh', points: 7, positivePoints: 8, negativePoints: 1 }], history: [], periods: [] };
    const ctx = vm.createContext({ JSON, Number, Math, Object, Array, String, isFinite,
        SpreadsheetApp: { getActiveSpreadsheet: () => ss, flush() {} }, LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
        respond: x => x, readLegacyData: () => structuredClone(legacy), writeAllData: d => { legacy = structuredClone(d); } });
    vm.runInContext(read('dojo-sync-v2.gs'), ctx);
    return { call: (action, data) => plain(ctx.doPost({ postData: { contents: JSON.stringify({ action, data }) } })) };
}
// Phần tử giao diện giả: các hàm vẽ lại màn hình chạy được nhưng không làm gì.
function fakeEl() {
    return new Proxy({}, { get: (t, k) => k in t ? t[k] : (k === 'classList' ? { add() {}, remove() {}, toggle() {}, contains: () => false }
        : k === 'style' || k === 'dataset' ? {} : typeof k === 'string' && /^[a-z]+[A-Z]|^(append|remove|click|focus|scroll|insert|replace)/.test(k) ? () => fakeEl() : ''),
        set: (t, k, v) => (t[k] = v, true) });
}
function app({ url = '', srv } = {}) {
    const storage = new Storage();
    const ctx = vm.createContext({ crypto, localStorage: storage, console, structuredClone, setTimeout, clearTimeout,
        syncSettings: { url }, currentView: 'classroom', currentClassId: 1, avatarBaseUrl: 'https://avatar/',
        showToast() {}, renderStudents() {}, renderClasses() {}, document: { getElementById: () => fakeEl(), querySelector: () => fakeEl(), querySelectorAll: () => [], createElement: () => fakeEl() } });
    vm.runInContext(`var classes=[{id:1,name:'5A'}], students=[{id:1,classId:1,name:'Trâm',points:5,positivePoints:5,negativePoints:0}],
        skills={positive:[],negative:[]}, history=[], periods=[], gradeRecords=[], communicationLog=[], studentGoals=[],
        classNotes=[], subjectGrades=[], meetingNotes=[], hoaBa=[];`, ctx);
    for (const f of ['js/local-storage.js', 'js/point-transactions.js', 'js/auto-sync-tu-ong-ay-len-va-keo-ve-google-sheets.js', 'js/google-sheets-sync.js', 'js/students.js'])
        vm.runInContext(read(f), ctx, { filename: f });
    // Vẽ lại màn hình không thuộc phạm vi kiểm thử này.
    ctx.renderStudents = ctx.renderClasses = () => {};
    vm.runInContext('initializePointJournal()', ctx);
    if (srv) ctx.rawSyncRequest = async (action, data) => srv.call(action, plain(data));
    return { ctx, storage, run: code => vm.runInContext(code, ctx) };
}

test('file sao lưu chứa đủ các sổ và mở lại được; file cũ (mảng ở gốc) vẫn đọc được; file lạ bị từ chối', () => {
    const a = app();
    a.storage.setItem('cert_school', 'THPT A');
    a.run(`history.push({id:'h1',studentId:1,points:2}); subjectGrades.push({id:'g'}); hoaBa.push({id:'hb'})`);
    const backup = plain(a.run('buildBackupData()'));
    assert.equal(backup.format, 2);
    for (const f of ['classes', 'students', 'skills', 'history', 'periods', 'gradeRecords', 'communicationLog', 'studentGoals', 'classNotes', 'subjectGrades', 'meetingNotes', 'hoaBa'])
        assert.ok(f in backup.data, 'thiếu ' + f);
    assert.equal(backup.extras.cert_school, 'THPT A');
    assert.equal(backup.data.syncSettings, undefined, 'không đưa key đồng bộ vào file');
    const parsed = plain(a.run(`parseBackupFile(${JSON.stringify(JSON.stringify(backup))})`));
    assert.equal(parsed.data.hoaBa.length, 1);
    const old = plain(a.run(`parseBackupFile(${JSON.stringify(JSON.stringify({ classes: [{ id: 9 }], students: [{ id: 1, classId: 9, points: '4' }] }))})`));
    assert.equal(old.data.students[0].points, 4);
    assert.throws(() => a.run(`parseBackupFile('{"foo":1}')`), /danh sách lớp/);
    assert.throws(() => a.run(`parseBackupFile('không phải json')`), /JSON/);
});

test('phục hồi khi không đồng bộ: thay toàn bộ dữ liệu, bỏ hàng đợi điểm cũ, không cộng điểm lại khi tải lại trang', () => {
    const a = app();
    a.run(`students[0].points+=3; students[0].positivePoints+=3; saveData()`);   // giao dịch chờ trên máy
    assert.equal(a.run('pendingPointBatches().length'), 1);
    const backup = { format: 2, data: { classes: [{ id: 3, name: '11B3' }], students: [{ id: 6, classId: 3, name: 'Ngọc Anh', points: 7, positivePoints: 8, negativePoints: 1 }],
        history: [{ id: 'x', studentId: 6, points: 7 }], meetingNotes: [{ id: 'm' }] }, extras: { cert_signer: 'Thầy Lực' } };
    a.run(`restoreBackupLocal(parseBackupFile(${JSON.stringify(JSON.stringify(backup))}))`);
    assert.equal(a.run('pendingPointBatches().length'), 0);
    assert.equal(a.storage.getItem('cert_signer'), 'Thầy Lực');
    // Tải lại trang: dữ liệu đọc từ bộ nhớ đúng như file
    const reload = app(); reload.storage.map = a.storage.map;
    reload.run('loadData()');
    assert.deepEqual(plain(reload.run('students.map(s=>[s.name,s.points,s.positivePoints,s.negativePoints])')), [['Ngọc Anh', 7, 8, 1]]);
    assert.deepEqual(plain(reload.run('classes.map(c=>c.name)')), ['11B3']);
    assert.equal(reload.run('meetingNotes.length'), 1);
    assert.equal(reload.run('currentClassId'), 3);
});

test('phục hồi khi đang đồng bộ: điểm trên máy chủ về đúng file bằng giao dịch điều chỉnh, thông tin lớp được lưu', async () => {
    const srv = server(), a = app({ url: 'https://script.google.com/macros/s/K/exec', srv });
    a.run(`_applyPulledData(${JSON.stringify(srv.call('syncPoints', { protocol: 2, batches: [] }).data)})`);
    a.run(`students[0].points+=5; students[0].positivePoints+=5; saveData()`);   // điểm sau khi sao lưu: 12
    await a.ctx.flushPointTransactions();
    const backup = { format: 2, data: { classes: [{ id: 3, name: '11B3 (phục hồi)' }],
        students: [{ id: 6, classId: 3, name: 'Ngọc Anh', points: 7, positivePoints: 8, negativePoints: 1 },
                   { id: 50, classId: 3, name: 'Em mới', points: 4, positivePoints: 4, negativePoints: 0 }] } };
    const result = await a.run(`restoreBackupSynced(parseBackupFile(${JSON.stringify(JSON.stringify(backup))}))`);
    assert.equal(result.status, 'ok');
    const pulled = srv.call('syncPoints', { protocol: 2, batches: [] }).data;
    assert.deepEqual(pulled.classes.map(c => c.name), ['11B3 (phục hồi)']);
    assert.deepEqual(pulled.students.map(s => [s.name, s.points, s.positivePoints, s.negativePoints]).sort(),
        [['Em mới', 4, 4, 0], ['Ngọc Anh', 7, 8, 1]]);
    const adj = pulled.history.filter(h => h.type === 'adjust');
    assert.deepEqual(adj.map(h => [h.studentName, h.points]).sort(), [['Em mới', 4], ['Ngọc Anh', -5]]);
    assert.equal(a.run('pendingPointBatches().length'), 0);
});

test('phục hồi khi đang đồng bộ mà mất mạng: báo chưa phục hồi, dữ liệu trên máy giữ nguyên', async () => {
    const a = app({ url: 'https://script.google.com/macros/s/K/exec' });
    a.ctx.rawSyncRequest = async () => { throw new Error('offline'); };
    const backup = { classes: [{ id: 9, name: 'X' }], students: [] };
    await assert.rejects(a.run(`restoreBackupSynced(parseBackupFile(${JSON.stringify(JSON.stringify(backup))}))`), e => e.beforeRestore === true);
    assert.deepEqual(plain(a.run('classes.map(c=>c.name)')), ['5A']);
});
