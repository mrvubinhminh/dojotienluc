// All score writers (including legacy games/undo/reset) enter this journal at saveData().
// One localStorage key per batch: two tabs cannot overwrite each other's outbox.
let _pointBaseline = null;
let _pointHistoryBaseline = new Set();
let _pointGeneration = 0;
let _pointSyncFlight = null;
let _pointLastCreated = 0;
function nextPointTime() {
    _pointLastCreated=Math.max(Date.now(),_pointLastCreated+1,...pendingPointBatches().map(b=>b.createdAt+1));
    return _pointLastCreated;
}
const POINT_PROTOCOL = 2;
function pointTarget() { return encodeURIComponent(syncSettings.url || 'offline'); }
function pointPrefix() { return 'dojo_point_outbox_v2:' + pointTarget() + ':'; }
function pointCounters(s) {
    const values = ['points','positivePoints','negativePoints'].map(k => Number(s[k] ?? 0));
    if (!values.every(Number.isFinite)) throw new Error('Điểm không hợp lệ: ' + s.name);
    return values;
}
function pointOpening(s) {
    const opening={};
    for(const k of ['id','classId','name','stt','dob','points','positivePoints','negativePoints']) opening[k]=s[k] ?? (['points','positivePoints','negativePoints'].includes(k)?0:'');
    for(const k of ['points','positivePoints','negativePoints']) opening[k]=Number(opening[k]);
    return opening;
}
function resetPointBaseline() {
    _pointBaseline = new Map(students.map(s => [String(s.id), {...s}]));
    _pointHistoryBaseline = new Set(history.map(h => String(h.id)));
}
function initializePointJournal() {
    // Replay only batches newer than the last completed local snapshot.
    // Recovery stores changed counters, not another copy of all avatars/history per click.
    const savedAt = Number(localStorage.getItem('dojo_point_saved_at') || 0);
    const recovery = pendingPointBatches().filter(b=>b.createdAt>savedAt).sort((a,b)=>a.createdAt-b.createdAt);
    for (const batch of recovery) {
      if(batch.type==='classReset') {
          students.filter(s=>String(s.classId)===String(batch.classId)).forEach(s=>{s.points=0;s.positivePoints=0;s.negativePoints=0;});
      }
      for (const c of batch.changes) {
        let student=students.find(s=>String(s.id)===String(c.studentId));
        if(!student) {student={...c.opening};students.push(student);}
        student.points=Number(c.opening.points)+c.delta;
        student.positivePoints=Number(c.opening.positivePoints)+c.positiveDelta;
        student.negativePoints=Number(c.opening.negativePoints)+c.negativeDelta;
        for(const h of c.history || []) if(!history.some(x=>String(x.id)===String(h.id))) history.push(h);
    }
    }
    for (const student of students) {
        const values=pointCounters(student);
        ['points','positivePoints','negativePoints'].forEach((key,i)=>student[key]=values[i]);
    }
    resetPointBaseline();
}
function pendingPointBatches() {
    const prefix = pointPrefix(), batches = [];
    for (let i=0; i<localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(prefix)) {
            const batch = JSON.parse(localStorage.getItem(key));
            batches.push(batch);
        }
    }
    return batches.sort((a,b)=>a.createdAt-b.createdAt || a.operationId.localeCompare(b.operationId));
}
function capturePointChanges() {
    if (!_pointBaseline) { resetPointBaseline(); return; }
    const changes = [];
    const addedHistory = history.filter(h => !_pointHistoryBaseline.has(String(h.id)));
    for (const s of students) {
        const before = _pointBaseline.get(String(s.id));
        const old = before ? pointCounters(before) : [0,0,0];
        const now = pointCounters(s);
        const delta = now.map((n,i) => n-old[i]);
        if (delta.some(n => n !== 0)) changes.push({
            studentId:s.id, classId:s.classId, studentName:s.name,
            delta:delta[0], positiveDelta:delta[1], negativeDelta:delta[2],
            opening:pointOpening(before || {...s,points:0,positivePoints:0,negativePoints:0}),
            history:addedHistory.filter(h => String(h.studentId)===String(s.id))
        });
    }
    if (changes.length) {
        const batch = {operationId:crypto.randomUUID(),createdAt:nextPointTime(),timestamp:new Date().toISOString(),changes};
        // Persist first. Never mark this batch saved if storage is full.
        localStorage.setItem(pointPrefix()+batch.operationId, JSON.stringify(batch));
        _pointGeneration++;
        if (typeof scheduleAutoSync === 'function') scheduleAutoSync();
    }
    resetPointBaseline();
}
// Reset is an explicit ordered command, not a subtraction based on stale local totals.
function queueClassPointReset(classId, reason='Reset điểm lớp về 0') {
    capturePointChanges();
    const batch={operationId:crypto.randomUUID(),type:'classReset',classId,reason,
        createdAt:nextPointTime(),timestamp:new Date().toISOString(),changes:[]};
    localStorage.setItem(pointPrefix()+batch.operationId,JSON.stringify(batch));
    for(const s of students.filter(s=>String(s.classId)===String(classId))) {
        history.push({id:batch.operationId+':'+s.id,classId:s.classId,studentId:s.id,studentName:s.name,
            skillName:reason,points:-s.points,timestamp:batch.timestamp});
        s.points=0;s.positivePoints=0;s.negativePoints=0;
    }
    _pointGeneration++;
    resetPointBaseline();
    saveData();
    if(typeof scheduleAutoSync==='function') scheduleAutoSync();
    refreshPointViews();
    return batch;
}
function pointRevisionKey() { return 'dojo_metadata_revision_v2:' + pointTarget(); }
function applyPointSnapshot(data) {
    // Filter acknowledgements from the response, even if a different tab already removed their keys.
    const acknowledged = new Set(data.appliedOperationIds || []);
    const pending = pendingPointBatches().filter(b => !acknowledged.has(b.operationId));
    const remote = new Map((data.students || []).map(s => [String(s.id),s]));
    students = students.map(local => {
        const s = remote.get(String(local.id));
        if (s) return {...local, points:s.points,positivePoints:s.positivePoints,negativePoints:s.negativePoints};
        const first = pending.flatMap(b=>b.changes).find(c=>String(c.studentId)===String(local.id));
        return first ? {...local,...Object.fromEntries(['points','positivePoints','negativePoints'].map(k=>[k,Number(first.opening[k])||0]))} : local;
    });
    // Keep remote-only students visible; metadata sync can subsequently update the rest.
    for (const s of remote.values()) if (!students.some(l=>String(l.id)===String(s.id))) students.push(s);
    const merged = new Map((data.history || []).map(h=>[String(h.id),h]));
    for (const batch of pending) {
      if(batch.type==='classReset') {
          for(const s of students.filter(s=>String(s.classId)===String(batch.classId))) {
              merged.set(batch.operationId+':'+s.id,{id:batch.operationId+':'+s.id,classId:s.classId,studentId:s.id,studentName:s.name,skillName:batch.reason,points:-s.points,timestamp:batch.timestamp});
              s.points=0;s.positivePoints=0;s.negativePoints=0;
          }
      }
      for (const c of batch.changes) {
        const s = students.find(s=>String(s.id)===String(c.studentId));
        if (s) { s.points+=c.delta; s.positivePoints+=c.positiveDelta; s.negativePoints+=c.negativeDelta; }
        for (const h of c.history || []) merged.set(String(h.id), h);
    }
    }
    history = [...merged.values()];
    resetPointBaseline();
    saveData();
    for (const id of acknowledged) localStorage.removeItem(pointPrefix()+id);
    refreshPointViews();
}
function refreshPointViews() {
    if (typeof renderClasses==='function') renderClasses();
    if (currentView==='classroom') renderStudents();
    else if (currentView==='report') renderReport();
}
async function flushPointTransactions() {
    if (_pointSyncFlight) return _pointSyncFlight;
    _pointSyncFlight = (async () => {
        capturePointChanges();
        const batches = pendingPointBatches().map(({recovery,...batch})=>batch);
        const result = await rawSyncRequest('syncPoints', {protocol:POINT_PROTOCOL,batches});
        if (result.protocol !== POINT_PROTOCOL || result.status!=='ok' || !result.data) {
            throw new Error(result.message || 'Cần cập nhật và triển khai Apps Script V2 trước khi đồng bộ.');
        }
        // Capture edits made while fetch was awaiting the response before rebasing.
        capturePointChanges();
        applyPointSnapshot(result.data);
        return result;
    })();
    try { return await _pointSyncFlight; } finally { _pointSyncFlight=null; }
}
