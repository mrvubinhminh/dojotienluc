// Nhiều máy dùng chung một key đồng bộ: thông tin lớp (metadata) phải theo kịp máy chủ
// mà không ghi đè phần đang sửa dở trên máy.
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
    let legacy = { classes: [{ id: 3, name: '11B3' }], students: [{ id: 6, classId: 3, name: 'Ngọc Anh', points: 5, positivePoints: 5, negativePoints: 0 }], history: [], periods: [] };
    const ctx = vm.createContext({ JSON, Number, Math, Object, Array, String, isFinite,
        SpreadsheetApp: { getActiveSpreadsheet: () => ss, flush() {} }, LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
        respond: x => x, readLegacyData: () => structuredClone(legacy), writeAllData: d => { legacy = structuredClone(d); } });
    vm.runInContext(read('dojo-sync-v2.gs'), ctx);
    return { call: (action, data) => plain(ctx.doPost({ postData: { contents: JSON.stringify({ action, data }) } })) };
}
function device(srv, initial) {
    const storage = new Storage();
    const ctx = vm.createContext({ crypto, localStorage: storage, console, structuredClone, setTimeout, clearTimeout,
        syncSettings: { url: 'https://script.google.com/macros/s/KEY/exec' }, currentView: 'classroom', currentClassId: 1,
        avatarBaseUrl: 'https://avatar/', showToast() {}, renderStudents() {}, renderClasses() {},
        document: { getElementById: () => null } });
    vm.runInContext(`var classes=${JSON.stringify(initial.classes)}, students=${JSON.stringify(initial.students)}, history=[],
        periods=[], gradeRecords=[], subjectGrades=[], meetingNotes=[];
        function saveData(){ capturePointChanges(); }`, ctx);
    vm.runInContext(read('js/point-transactions.js'), ctx);
    vm.runInContext(read('js/auto-sync-tu-ong-ay-len-va-keo-ve-google-sheets.js'), ctx);
    vm.runInContext('initializePointJournal()', ctx);
    ctx.rawSyncRequest = async (action, data) => srv.call(action, plain(data));
    const run = code => vm.runInContext(code, ctx);
    return { ctx, run, sync: () => ctx.flushPointTransactions(),
        save: async () => { await ctx.flushPointTransactions();
            const r = srv.call('push', { protocol: 2, baseRevision: JSON.parse(storage.getItem(run('pointRevisionKey()')) || 'null'),
                snapshot: plain(run('({classes,students,history,periods,gradeRecords,subjectGrades,meetingNotes})')) });
            if (r.status === 'ok') { storage.setItem(run('pointRevisionKey()'), JSON.stringify(r.revision)); run('markMetadataSynced()'); }
            return r; } };
}
const DEMO = { classes: [{ id: 1, name: '5A Superstars' }], students: [{ id: 1, classId: 1, name: 'Bảo Trâm', points: 5, positivePoints: 5, negativePoints: 0 }] };

test('máy mới chưa tải về: tự đồng bộ không tự thay lớp trên máy mà báo cần Tải về', async () => {
    const srv = server(), b = device(srv, DEMO);
    await b.sync();
    assert.deepEqual(plain(b.run('classes.map(c=>c.name)')), ['5A Superstars']);
    assert.equal(b.run('_metadataBehind'), true);
    // Tải về: nhận đủ lớp của máy chủ, không còn học sinh mồ côi
    b.run('_applyPulledData(' + JSON.stringify(srv.call('syncPoints', { protocol: 2, batches: [] }).data) + ')');
    assert.deepEqual(plain(b.run('classes.map(c=>c.name)')), ['11B3']);
    assert.equal(b.run('students.filter(s=>!classes.some(c=>c.id===s.classId)).length'), 0);
    assert.equal(b.run('currentClassId'), 3);
    assert.equal(b.run('isMetadataDirty()'), false);
    assert.equal(b.run('_metadataBehind'), false);
});

test('máy A thêm học sinh và bấm Lưu: máy B không sửa gì thì tự nhận ở lần đồng bộ sau, điểm giữ đúng', async () => {
    const srv = server(), a = device(srv, DEMO), b = device(srv, DEMO);
    const first = srv.call('syncPoints', { protocol: 2, batches: [] }).data;
    a.run('_applyPulledData(' + JSON.stringify(first) + ')'); b.run('_applyPulledData(' + JSON.stringify(first) + ')');
    a.run(`students.push({id:7,classId:3,name:'Vân Anh',points:0,positivePoints:0,negativePoints:0}); classes[0].name='11B3 (chiều)'; saveData()`);
    assert.equal((await a.save()).status, 'ok');
    // B chấm điểm cho em cũ trong lúc đó
    b.run(`students[0].points+=2; students[0].positivePoints+=2; saveData()`);
    await b.sync();
    assert.deepEqual(plain(b.run('classes.map(c=>c.name)')), ['11B3 (chiều)']);
    assert.deepEqual(plain(b.run('students.map(s=>[s.name,s.points]).sort()')), [['Ngọc Anh', 7], ['Vân Anh', 0]]);
    assert.equal(b.run('isMetadataDirty()'), false);
    // B lưu được ngay vì đã có bản mới nhất, không bị báo xung đột
    assert.equal((await b.save()).status, 'ok');
});

test('máy B đang sửa dở thông tin lớp: không bị ghi đè, chỉ báo có bản mới', async () => {
    const srv = server(), a = device(srv, DEMO), b = device(srv, DEMO);
    const first = srv.call('syncPoints', { protocol: 2, batches: [] }).data;
    a.run('_applyPulledData(' + JSON.stringify(first) + ')'); b.run('_applyPulledData(' + JSON.stringify(first) + ')');
    a.run(`classes[0].name='Tên từ A'`); assert.equal((await a.save()).status, 'ok');
    b.run(`students[0].name='Ngọc Anh (sửa trên B)'`);
    await b.sync();
    assert.equal(b.run('students[0].name'), 'Ngọc Anh (sửa trên B)');
    assert.equal(b.run('classes[0].name'), '11B3');
    assert.equal(b.run('_metadataBehind'), true);
    assert.equal((await b.save()).status, 'conflict', 'máy chủ vẫn chặn ghi đè bản cũ');
});

test('đồng bộ định kỳ không có gì mới không làm máy bị coi là đang sửa', async () => {
    const srv = server(), b = device(srv, DEMO);
    b.run('_applyPulledData(' + JSON.stringify(srv.call('syncPoints', { protocol: 2, batches: [] }).data) + ')');
    for (let i = 0; i < 3; i++) await b.sync();
    assert.equal(b.run('isMetadataDirty()'), false);
    assert.equal(b.run('_metadataBehind'), false);
});
