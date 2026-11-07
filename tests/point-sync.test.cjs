const test=require('node:test'), assert=require('node:assert/strict'), vm=require('node:vm'), fs=require('node:fs'), crypto=require('node:crypto');
const read=p=>fs.readFileSync(require('node:path').join(__dirname,'..',p),'utf8');
class Storage {
 constructor(){this.map=new Map()}
 get length(){return this.map.size} key(i){return [...this.map.keys()][i]??null}
 getItem(k){return this.map.get(k)??null} setItem(k,v){this.map.set(k,String(v))} removeItem(k){this.map.delete(k)}
}
function client(storage=new Storage()) {
 const ctx=vm.createContext({crypto,localStorage:storage,console,structuredClone,setTimeout,clearTimeout,
 syncSettings:{url:'test'},students:[{id:1,classId:1,name:'An',points:10,positivePoints:10,negativePoints:0}],history:[],currentView:'classroom',
 saveData(){vm.runInContext('capturePointChanges()',ctx)},renderStudents(){}});
 vm.runInContext(read('js/point-transactions.js'),ctx);vm.runInContext('initializePointJournal()',ctx);return ctx;
}
function add(c,n){vm.runInContext(`students[0].points+=${n};students[0].positivePoints+=${n};capturePointChanges()`,c)}
function plain(v){return JSON.parse(JSON.stringify(v))}
class Sheet {
 constructor(){this.rows=[]}
 appendRow(row){this.rows.push([...row])} getLastRow(){return this.rows.length} getMaxColumns(){return 26} insertColumnsAfter(){}
 getRange(r,c,h=1,w=1){return {setValue:v=>this.getRange(r,c).setValues([[v]]),getValue:()=>this.rows[r-1]?.[c-1]??'',setValues:vs=>{vs.forEach((row,i)=>{this.rows[r-1+i]??=[];row.forEach((v,j)=>this.rows[r-1+i][c-1+j]=v)})}}}
 getDataRange(){const w=Math.max(1,...this.rows.map(r=>r.length));return {getValues:()=>this.rows.map(r=>Array.from({length:w},(_,i)=>r[i]??''))}}
}
function server() {
 const sheets=new Map();const ss={getSheetByName:n=>sheets.get(n),insertSheet:n=>{const s=new Sheet();sheets.set(n,s);return s}};
 let legacy={classes:[{id:1,name:'A'}],students:[{id:1,classId:1,name:'An',points:10,positivePoints:10,negativePoints:0}],history:[],periods:[]};
 const ctx=vm.createContext({JSON,Number,Math,Object,Array,String,isFinite,SpreadsheetApp:{getActiveSpreadsheet:()=>ss,flush(){}},LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},respond:x=>x,readLegacyData:()=>structuredClone(legacy),writeAllData:d=>{legacy=structuredClone(d)}});
 vm.runInContext(read('dojo-sync-v2.gs'),ctx);
 return {call:(action,data)=>plain(ctx.doPost({postData:{contents:JSON.stringify({action,data})}})),pull:()=>plain(ctx.dojoPull()),sheets};
}
test('two tabs retain independent durable transactions; server adds both and deduplicates retries',()=>{
 const storage=new Storage(), a=client(storage), b=client(storage), s=server();add(a,2);add(b,3);
 const batches=plain(a.pendingPointBatches()).map(({recovery,...b})=>b);assert.equal(batches.length,2);
 const first=s.call('syncPoints',{protocol:2,batches});assert.equal(first.data.students[0].points,15);
 assert.equal(s.call('syncPoints',{protocol:2,batches}).data.students[0].points,15);
 a.applyPointSnapshot(first.data);assert.equal(a.students[0].points,15);assert.equal(a.pendingPointBatches().length,0);
});
test('edits made during network request survive response and flush exactly once',async()=>{
 const c=client(), s=server();let resolve; c.rawSyncRequest=(action,data)=>new Promise(r=>{resolve=()=>r(s.call(action,plain(data)))});
 add(c,2);const flight=c.flushPointTransactions();add(c,3);resolve();await flight;
 assert.equal(c.students[0].points,15);assert.equal(c.pendingPointBatches().length,1);
 c.rawSyncRequest=async(a,d)=>s.call(a,plain(d));await c.flushPointTransactions();assert.equal(c.students[0].points,15);assert.equal(c.pendingPointBatches().length,0);
});
test('network failure and reload retain outbox; old server cannot acknowledge/delete it',async()=>{
 const storage=new Storage(), c=client(storage);add(c,2);c.rawSyncRequest=async()=>{throw Error('offline')};await assert.rejects(c.flushPointTransactions());
 const reload=client(storage);assert.equal(reload.pendingPointBatches().length,1);reload.rawSyncRequest=async()=>({status:'ok'});await assert.rejects(reload.flushPointTransactions());assert.equal(reload.pendingPointBatches().length,1);
});
test('undo and period reset are compensating transactions; history remains an audit trail',()=>{
 const c=client(),s=server();add(c,2);add(c,-2);vm.runInContext('students[0].points=0;students[0].positivePoints=0;capturePointChanges()',c);
 const batches=plain(c.pendingPointBatches()).map(({recovery,...b})=>b);
 const r=s.call('syncPoints',{protocol:2,batches});assert.equal(r.status,'ok');assert.equal(r.data.students[0].points,0);assert.equal(r.data.history.length,3);
});
test('legacy snapshots rejected; stale metadata cannot overwrite scores',()=>{
 const s=server();assert.equal(s.call('push',{students:[]}).status,'error');
 const c=client();add(c,2);s.call('syncPoints',{protocol:2,batches:plain(c.pendingPointBatches()).map(({recovery,...b})=>b)});
 const snapshot={classes:[{id:1,name:'A'}],students:[{id:1,name:'An',points:1,positivePoints:1,negativePoints:0}],history:[]};
 assert.equal(s.call('push',{protocol:2,baseRevision:null,snapshot}).status,'conflict');
 assert.equal(s.call('push',{protocol:2,baseRevision:0,snapshot}).status,'ok');assert.equal(s.pull().data.students[0].points,12);
 assert.equal(s.call('push',{protocol:2,baseRevision:0,snapshot}).status,'conflict');
});
test('new student added during a fetch does not receive pending points twice',()=>{
 const c=client();vm.runInContext("students.push({id:2,classId:1,name:'B',points:3,positivePoints:3,negativePoints:0});capturePointChanges()",c);
 c.applyPointSnapshot({students:[{id:1,points:10,positivePoints:10,negativePoints:0}],history:[],appliedOperationIds:[]});assert.equal(c.students[1].points,3);
});
test('duplicate operation id with different content rejected',()=>{
 const c=client(),s=server();add(c,2);const batches=plain(c.pendingPointBatches()).map(({recovery,...b})=>b);s.call('syncPoints',{protocol:2,batches});batches[0].changes[0].delta=9;batches[0].changes[0].positiveDelta=9;
 assert.equal(s.call('syncPoints',{protocol:2,batches}).status,'error');assert.equal(s.pull().data.students[0].points,12);
});
test('new student opening balance is created once across metadata saves and repeated pulls',()=>{
 const c=client(),s=server();vm.runInContext("students.push({id:2,classId:1,name:'B',points:3,positivePoints:3,negativePoints:0});capturePointChanges()",c);
 const batches=plain(c.pendingPointBatches()).map(({recovery,...b})=>b);
 let r=s.call('syncPoints',{protocol:2,batches});assert.equal(r.data.students.find(s=>s.id===2).points,3);
 assert.equal(s.call('push',{protocol:2,baseRevision:0,snapshot:r.data}).status,'ok');
 for(let i=0;i<3;i++) assert.equal(s.pull().data.students.find(s=>s.id===2).points,3);
});
test('deleted student is not resurrected by historical point transactions',()=>{
 const c=client(),s=server();add(c,2);const batches=plain(c.pendingPointBatches()).map(({recovery,...b})=>b);const r=s.call('syncPoints',{protocol:2,batches});
 assert.equal(s.call('push',{protocol:2,baseRevision:0,snapshot:{...r.data,students:[]}}).status,'ok');assert.equal(s.pull().data.students.length,0);
});
test('storage quota failure never advances the captured baseline or silently drops points',()=>{
 const c=client(),original=c.localStorage.setItem.bind(c.localStorage);c.localStorage.setItem=()=>{throw Error('quota')};
 assert.throws(()=>add(c,2));c.localStorage.setItem=original;c.capturePointChanges();assert.equal(c.pendingPointBatches()[0].changes[0].delta,2);
});
test('stale edit form preserves concurrently updated points when saving only the student name',()=>{
 const elements={editStudentId:{value:'1'},editStudentName:{value:'New name'},editStudentRealName:{value:''},editStudentDob:{value:''},editStudentStt:{value:'1'},editStudentPositivePoints:{value:'10',dataset:{original:'10'}},editStudentNegativePoints:{value:'0',dataset:{original:'0'}}};
 const c=client();c.document={getElementById:id=>elements[id]};c.pendingAvatarBase64=null;c.showToast=()=>{};c.closeEditStudentModal=()=>{};c.avatarBaseUrl='avatar/';
 vm.runInContext(read('js/edit-delete-student.js'),c);c.closeEditStudentModal=()=>{};c.students[0].avatar='data:image/test';add(c,2);c.saveEditStudent();assert.equal(c.students[0].points,12);assert.equal(c.students[0].name,'New name');
});
test('copyable Apps Script contains the same V2 extension and keeps string history IDs',()=>{
 const c=vm.createContext({});vm.runInContext(read('js/google-sheets-sync.js'),c);const script=vm.runInContext('APPS_SCRIPT_CODE',c);new vm.Script(script);
 assert.ok(script.startsWith(read('dojo-sync-v2.gs')));assert.ok(script.includes("id:String(h.id||'')"));
});
test('outbox supports large batches without exceeding the Sheets cell size',()=>{
 const c=client(),s=server();add(c,2);const batches=plain(c.pendingPointBatches()).map(({recovery,...b})=>b);
 batches[0].changes[0].history=[{id:'long',studentId:1,points:2,skillName:'x'.repeat(90000)}];
 const r=s.call('syncPoints',{protocol:2,batches});assert.equal(r.status,'ok');assert.equal(s.pull().data.students[0].points,12);
 assert.ok(s.sheets.get('_PointLedgerV2').rows.every(row=>row.every(cell=>String(cell).length<=40000)));
});
test('restored local snapshot and outstanding outbox do not double-apply points on server acknowledgement',async()=>{
 const storage=new Storage(),a=client(storage),s=server();add(a,2);
 storage.setItem('dojo_point_saved_at',String(Date.now()+100));
 const b=client(storage);b.students[0].points=12;b.students[0].positivePoints=12;b.resetPointBaseline();
 b.rawSyncRequest=async(action,data)=>s.call(action,plain(data));await b.flushPointTransactions();assert.equal(b.students[0].points,12);assert.equal(b.pendingPointBatches().length,0);
});
test('class reset zeros authoritative server totals even when another device added unseen points',()=>{
 const a=client(),b=client(),s=server();add(b,7);
 s.call('syncPoints',{protocol:2,batches:plain(b.pendingPointBatches())});
 a.queueClassPointReset(1);
 const reset=plain(a.pendingPointBatches());
 const r=s.call('syncPoints',{protocol:2,batches:reset});assert.equal(r.status,'ok');
 assert.deepEqual([r.data.students[0].points,r.data.students[0].positivePoints,r.data.students[0].negativePoints],[0,0,0]);
 assert.equal(r.data.history.find(h=>h.skillName==='Reset điểm lớp về 0').points,-17);
 // A repeated reset request must not erase points awarded afterwards.
 const c=client();add(c,3);s.call('syncPoints',{protocol:2,batches:plain(c.pendingPointBatches())});
 assert.equal(s.call('syncPoints',{protocol:2,batches:reset}).data.students[0].points,3);
});
test('offline award, reset and subsequent award replay in order without changing another class',()=>{
 const c=client(),s=server();vm.runInContext("students.push({id:2,classId:2,name:'B',points:0,positivePoints:0,negativePoints:0});resetPointBaseline();students[1].points=5;students[1].positivePoints=5;capturePointChanges()",c);
 add(c,2);c.queueClassPointReset(1);add(c,3);
 c.applyPointSnapshot(s.pull().data);assert.equal(c.students[0].points,3);assert.equal(c.students[1].points,5);
 const r=s.call('syncPoints',{protocol:2,batches:plain(c.pendingPointBatches())});assert.equal(r.status,'ok');
 assert.equal(r.data.students.find(s=>s.id===1).points,3);assert.equal(r.data.students.find(s=>s.id===2).points,5);
});
test('reset outbox survives reload and applies once after connection returns',async()=>{
 const storage=new Storage(),c=client(storage),s=server();c.queueClassPointReset(1);
 const restored=client(storage);assert.equal(restored.students[0].points,0);assert.equal(restored.pendingPointBatches()[0].type,'classReset');
 restored.rawSyncRequest=async(a,d)=>s.call(a,plain(d));await restored.flushPointTransactions();assert.equal(restored.students[0].points,0);assert.equal(restored.pendingPointBatches().length,0);
});
test('reset does not change local scores if the durable outbox cannot be saved',()=>{
 const c=client();c.localStorage.setItem=()=>{throw Error('quota')};assert.throws(()=>c.queueClassPointReset(1));assert.equal(c.students[0].points,10);
});
test('reset clears positive and negative counters even when the net score is already zero',()=>{
 const c=client(),s=server();vm.runInContext('students[0].points=0;students[0].positivePoints=10;students[0].negativePoints=10;capturePointChanges()',c);
 c.queueClassPointReset(1);const r=s.call('syncPoints',{protocol:2,batches:plain(c.pendingPointBatches())});assert.equal(r.status,'ok');assert.equal(r.data.students[0].positivePoints,0);assert.equal(r.data.students[0].negativePoints,0);
});
test('reset projects zero counters into Students sheet without changing student information',()=>{
 const c=client(),s=server(),sheet=new Sheet();
 sheet.appendRow(['id','name','points','positivePoints','negativePoints']);sheet.appendRow([1,'An',10,10,0]);s.sheets.set('Students',sheet);
 c.queueClassPointReset(1);const r=s.call('syncPoints',{protocol:2,batches:plain(c.pendingPointBatches())});assert.equal(r.status,'ok');assert.deepEqual(sheet.rows[1],[1,'An',0,0,0]);
});
