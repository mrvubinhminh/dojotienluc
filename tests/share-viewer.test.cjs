const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'js', 'viewer-chia-se-xem-iem-chi-oc.js'), 'utf8');

function load({ protocol = 'https:', syncUrl = '' } = {}) {
    const ctx = {
        TextEncoder, TextDecoder, btoa, atob, Uint8Array, console,
        location: { protocol, origin: 'https://dojo.example', pathname: '/', href: 'file:///x/index.html' },
        syncSettings: { url: syncUrl },
        classes: [{ id: 1, name: '10A4' }, { id: 2, name: '11B3' }],
        students: [
            { id: 11, classId: 1, stt: 1, name: 'Lê An', points: 7, positivePoints: 8, negativePoints: 1, avatar: 'data:image/png;base64,AAAA' },
            { id: 12, classId: 1, stt: 2, name: 'Trần Bình', points: 7, positivePoints: 7, negativePoints: 0, avatar: 'https://api.example/a.svg' },
            { id: 13, classId: 1, stt: 3, name: 'Ngô Chi', points: 4, positivePoints: 4, negativePoints: 0 },
            { id: 14, classId: 1, stt: 4, name: 'Đỗ Dũng', points: -1, positivePoints: 0, negativePoints: 1 },
            { id: 21, classId: 2, stt: 1, name: 'Khác lớp', points: 99, positivePoints: 99, negativePoints: 0 },
        ],
        gradeRecords: [], history: [], communicationLog: [],
        currentClassId: 1,
        NOTE_TYPES: { notice: { bg: '', border: '', icon: '', text: '', label: '' } },
        getMilestone: () => null,
        computeStreaks: () => ({ maxDay: 0, maxWeek: 0, curDay: 0, curWeek: 0 }),
        getEarnedStreakBadges: () => [],
        generateComment: () => 'Tốt',
    };
    vm.createContext(ctx);
    vm.runInContext(SRC, ctx);
    return ctx;
}

test('xếp hạng đồng hạng và chỉ tính trong lớp của học sinh', () => {
    const c = load();
    const r = c.computeClassRanking(1).map(x => [x.s.name, x.rank]);
    assert.deepStrictEqual(r, [['Lê An', 1], ['Trần Bình', 1], ['Ngô Chi', 3], ['Đỗ Dũng', 4]]);
});

test('link của từng em có thứ hạng, khoảng cách lên hạng và top lớp', () => {
    const c = load();
    const d = c.buildStudentViewData(13);
    assert.strictEqual(d.rank.position, 3);
    assert.strictEqual(d.rank.total, 4);
    assert.strictEqual(d.rank.nextRank, 1);
    assert.strictEqual(d.rank.gapToNext, 3);
    assert.strictEqual(d.rank.average, 4.3);
    assert.deepStrictEqual(Array.from(d.rank.top, t => t.name), ['Lê An', 'Trần Bình', 'Ngô Chi']);
    const top = c.buildStudentViewData(11).rank;
    assert.strictEqual(top.position, 1);
    assert.strictEqual(top.tied, 2);
    assert.strictEqual(top.nextRank, null);
    assert.ok(top.top.find(t => t.name === 'Lê An').me);
    assert.strictEqual(d.student.dob, undefined, 'không đưa ngày sinh vào link');
});

test('ảnh base64 không được đưa vào link; link gọn giải mã đúng tiếng Việt', () => {
    const c = load();
    const d = c.buildStudentViewData(11);
    assert.strictEqual(d.student.avatar, '');
    const url = c.buildShareUrl(d);
    assert.ok(url.startsWith('https://dojo.example/#view=u.'));
    const back = c.decodeViewData(url.split('#view=')[1]);
    assert.strictEqual(back.student.name, 'Lê An');
    assert.strictEqual(back.rank.position, 1);
    assert.ok(url.length < c.encodeViewData(d).length, 'link mới ngắn hơn link cũ');
});

test('link cũ (định dạng Apps Script) vẫn mở được', () => {
    const c = load();
    const old = c.encodeViewData({ type: 'class', className: 'Lớp cũ', students: [] });
    assert.strictEqual(c.decodeViewData(old).className, 'Lớp cũ');
});

test('mở từ file trên máy thì dùng trang xem của Apps Script', () => {
    const c = load({ protocol: 'file:', syncUrl: 'https://script.google.com/macros/s/X/exec' });
    const url = c.buildShareUrl({ type: 'class', students: [] });
    assert.ok(url.startsWith('https://script.google.com/macros/s/X/exec?view='));
});

test('dữ liệu trong link bị chèn mã HTML được hiển thị như chữ', () => {
    const c = load();
    const evil = '<img src=x onerror=alert(1)>';
    const html = c.buildStudentViewHTML({
        type: 'student', className: evil, generatedAt: new Date().toISOString(),
        student: { name: evil, stt: evil, points: 1, avatar: 'javascript:alert(1)' },
        rank: { position: 1, total: 2, top: [{ rank: 1, name: evil, points: 1 }] },
        history: [{ skillName: evil, points: 1, timestamp: new Date().toISOString() }],
    });
    assert.ok(!html.includes('<img src=x'));
    assert.ok(!html.includes('javascript:'));
    const cls = c.buildClassViewHTML({
        type: 'class', className: evil, generatedAt: new Date().toISOString(),
        students: [{ name: evil, points: 3, avatar: '" onerror="alert(1)', streakBadges: [{ icon: evil, shadow: 'red;}</style><script>' }] }],
    });
    assert.ok(!cls.includes('<img src=x'));
    assert.ok(!cls.includes('<script>'));
    assert.ok(!cls.includes('onerror="alert'));
});

test('bảng xếp hạng lớp hiển thị đồng hạng, kể cả link cũ chưa có trường rank', () => {
    const c = load();
    const html = c.buildClassViewHTML({
        type: 'class', className: '10A4', generatedAt: new Date().toISOString(),
        students: [{ name: 'A', points: 0 }, { name: 'B', points: 0 }, { name: 'C', points: -2 }],
    });
    const ranks = [...html.matchAll(/color:#6b7280">(\d+)<\/span>/g)].map(m => m[1]);
    assert.deepStrictEqual(ranks, ['1', '1', '3']);
    assert.ok(html.includes('_svFilter'));
});
