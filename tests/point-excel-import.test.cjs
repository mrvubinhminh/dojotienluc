const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const plain=v=>JSON.parse(JSON.stringify(v));
class Storage{constructor(){this.map=new Map()}get length(){return this.map.size}key(i){return [...this.map.keys()][i]??null}getItem(k){return this.map.get(k)??null}setItem(k,v){this.map.set(k,String(v))}removeItem(k){this.map.delete(k)}}
function client(list){
 const ctx=vm.createContext({crypto,localStorage:new Storage(),console,syncSettings:{url:'test'},history:[],currentView:'x',
  students:list.map(s=>({classId:1,positivePoints:0,negativePoints:0,...s,points:s.points??((s.positivePoints||0)-(s.negativePoints||0))})),
  saveData(){vm.runInContext('capturePointChanges()',ctx)}});
 vm.runInContext(read('js/point-transactions.js'),ctx);vm.runInContext(read('js/point-excel-import.js'),ctx);vm.runInContext('initializePointJournal()',ctx);return ctx;
}
const EXPORT=[['BẢNG TỔNG KẾT ĐIỂM THI ĐUA - LỚP 10A4 - ĐIỂM HIỆN TẠI'],['Ngày xuất báo cáo: 7/11/2026'],['Công thức: ...'],[],
 ['STT','Họ và tên','Điểm cộng (+)','Điểm trừ (-)','Điểm thi đua','Xếp hạng','Nhận xét'],
 [1,'Lê Phạm Anh Thư',22,1,3.9,'1 (Vương miện vàng)','Em ...'],[2,'Lê Thành Đạt',18,0,3.6,'2'],[3,'Trần Đức Long','19','1','3,3','3'],[4,'Người Lạ',5,0,1,'4']];

test('parses exported sheet: class name, ranks ignored, string numbers accepted',()=>{
 const ctx=client([]);const p=plain(ctx.parsePointSheetRows(EXPORT));
 assert.equal(p.className,'10A4');
 assert.deepEqual(p.rows.map(r=>[r.name,r.positive,r.negative]),[['Lê Phạm Anh Thư',22,1],['Lê Thành Đạt',18,0],['Trần Đức Long',19,1],['Người Lạ',5,0]]);
 assert.equal(ctx.parsePointSheetRows([['STT','Họ và tên','Ngày sinh']]),null);
});
test('matches by name regardless of order; unknown, ambiguous and loose matches reported',()=>{
 const ctx=client([{id:1,stt:1,name:'Trần Đức Long',positivePoints:2},{id:2,stt:2,name:'Lê Thanh Đạt'},{id:3,stt:3,name:'Lê Phạm Anh Thư',positivePoints:22,negativePoints:1},{id:4,stt:4,name:'Bé Na'}]);
 const plan=plain(ctx.planPointImport(ctx.students,ctx.parsePointSheetRows(EXPORT)));
 assert.deepEqual(plan.changed.map(i=>[i.studentId,i.newPos,i.newNeg,i.match]),[[2,18,0,'loose'],[1,19,1,'exact']]);
 assert.equal(plan.items.length-plan.changed.length,1);              // Anh Thư đã khớp
 assert.deepEqual(plan.unmatched.map(r=>r.name),['Người Lạ']);
 assert.deepEqual(plan.missing.map(s=>s.id),[4]);
 const dup=client([{id:1,name:'Lê Thành Đạt'},{id:2,name:'Lê Thành Đạt'}]);
 assert.equal(dup.planPointImport(dup.students,dup.parsePointSheetRows(EXPORT)).ambiguous.length,1);
});
test('import becomes one durable delta transaction; server ends at file values',()=>{
 const ctx=client([{id:1,name:'Trần Đức Long',positivePoints:2,negativePoints:3},{id:2,name:'Lê Thành Đạt',positivePoints:18}]);
 const n=ctx.applyPointImportPlan(ctx.planPointImport(ctx.students,ctx.parsePointSheetRows(EXPORT)),'Cập nhật từ Excel');ctx.saveData();
 assert.equal(n,1);const s=ctx.students[0];assert.deepEqual([s.positivePoints,s.negativePoints,s.points],[19,1,18]);
 const batches=plain(ctx.pendingPointBatches());assert.equal(batches.length,1);
 const c=batches[0].changes[0];assert.deepEqual([c.delta,c.positiveDelta,c.negativeDelta],[19,17,-2]);
 assert.equal(c.history[0].type,'adjust');
});
class Sheet{constructor(){this.rows=[]}appendRow(r){this.rows.push([...r])}getLastRow(){return this.rows.length}getMaxColumns(){return 26}insertColumnsAfter(){}
 getRange(r,c){return{setValue:v=>{(this.rows[r-1]??=[])[c-1]=v},getValue:()=>this.rows[r-1]?.[c-1]??'',setValues:vs=>vs.forEach((row,i)=>{this.rows[r-1+i]??=[];row.forEach((v,j)=>this.rows[r-1+i][c-1+j]=v)})}}
 getDataRange(){const w=Math.max(1,...this.rows.map(r=>r.length));return{getValues:()=>this.rows.map(r=>Array.from({length:w},(_,i)=>r[i]??''))}}}
function server(legacyStudents){const sheets=new Map(),ss={getSheetByName:n=>sheets.get(n),insertSheet:n=>{const s=new Sheet();sheets.set(n,s);return s}};
 const legacy={classes:[{id:1,name:'10A4'}],students:legacyStudents,history:[],periods:[]};
 const ctx=vm.createContext({JSON,Number,Math,Object,Array,String,isFinite,SpreadsheetApp:{getActiveSpreadsheet:()=>ss,flush(){}},LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},respond:x=>x,readLegacyData:()=>structuredClone(legacy),writeAllData(){}});
 vm.runInContext(read('dojo-sync-v2.gs'),ctx);return (action,data)=>plain(ctx.doPost({postData:{contents:JSON.stringify({action,data})}}));}
test('points another device added before sync are kept on top of the file values',()=>{
 const start={id:1,classId:1,name:'Trần Đức Long',points:10,positivePoints:10,negativePoints:0};
 const call=server([start]);
 const b=client([start]);vm.runInContext('students[0].positivePoints+=3;students[0].points+=3;capturePointChanges()',b);
 call('syncPoints',{protocol:2,batches:plain(b.pendingPointBatches())});           // máy B: +3, máy A chưa thấy
 const a=client([start]);
 a.applyPointImportPlan(a.planPointImport(a.students,a.parsePointSheetRows(EXPORT)),'Cập nhật từ Excel');a.saveData();
 const r=call('syncPoints',{protocol:2,batches:plain(a.pendingPointBatches())});assert.equal(r.status,'ok');
 const s=r.data.students[0];assert.deepEqual([s.positivePoints,s.negativePoints,s.points],[22,1,21]);
 assert.equal(r.data.history.find(h=>h.type==='adjust').skillName,'Cập nhật từ Excel: cộng 10→19, trừ 0→1');
 // Gửi lại cùng giao dịch không cộng lần hai.
 assert.equal(call('syncPoints',{protocol:2,batches:plain(a.pendingPointBatches())}).data.students[0].points,21);
});
test('recomputes against current scores when confirming after a late award',()=>{
 const ctx=client([{id:1,name:'Trần Đức Long',positivePoints:10}]);
 const plan=ctx.planPointImport(ctx.students,ctx.parsePointSheetRows(EXPORT));
 vm.runInContext('students[0].positivePoints+=5;students[0].points+=5;capturePointChanges()',ctx); // cộng trong lúc xem trước
 ctx.applyPointImportPlan(plan,'Cập nhật từ Excel');ctx.saveData();
 assert.deepEqual([ctx.students[0].positivePoints,ctx.students[0].negativePoints],[19,1]);
});
test('downloaded template round-trips: unchanged file changes nothing, edited cells update only those students',()=>{
 const ctx=client([{id:1,stt:2,name:'Lê An',positivePoints:5,negativePoints:1},{id:2,stt:1,name:'Vy A',positivePoints:3},{id:3,stt:3,name:'Vy B'}]);
 const rows=plain(ctx.buildPointTemplateRows({name:'10A4'},ctx.students));
 assert.deepEqual(rows.slice(5).map(r=>r.slice(0,5)),[[1,'Vy A',3,0,3],[2,'Lê An',5,1,4],[3,'Vy B',0,0,0]]);
 assert.equal(ctx.parsePointSheetRows(rows).className,'10A4');
 assert.equal(ctx.planPointImport(ctx.students,ctx.parsePointSheetRows(rows)).changed.length,0);
 rows[7][2]=4; rows[6][4]=999;                    // sửa điểm cộng Vy B; cột tổng điểm bị bỏ qua
 const plan=plain(ctx.planPointImport(ctx.students,ctx.parsePointSheetRows(rows)));
 assert.deepEqual(plan.changed.map(i=>[i.studentId,i.newPos,i.newNeg]),[[3,4,0]]);
});
