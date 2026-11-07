// V2 extension. The complete deployable script is generated in apps-script-v2.gs.
function withDojoLock(callback) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try { return callback(); }
  finally { SpreadsheetApp.flush(); lock.releaseLock(); }
}
function dojoRevision() {
  var ss=SpreadsheetApp.getActiveSpreadsheet(), sh=ss.getSheetByName('_DojoRevision');
  if (!sh) { sh=ss.insertSheet('_DojoRevision'); sh.getRange(1,1).setValue(0); }
  return Number(sh.getRange(1,1).getValue()) || 0;
}
function dojoSetRevision(n) {
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('_DojoRevision').getRange(1,1).setValue(n);
}
function dojoLedger() {
  var ss=SpreadsheetApp.getActiveSpreadsheet(), sh=ss.getSheetByName('_PointLedgerV2');
  if (!sh) { sh=ss.insertSheet('_PointLedgerV2'); sh.appendRow(['operationId','json']); }
  var rows=sh.getDataRange().getValues().slice(1).filter(function(r){return r[0];});
  var entries=rows.map(function(r){return JSON.parse(r.slice(1).join(''));});
  var opened={};
  entries.forEach(function(e){if(e.kind==='opening') opened[String(e.student.id)]=true;});
  // Opening balances preserve existing totals; legacy history is not used to recompute them.
  var missing=readLegacyData().students.filter(function(s){return !opened[String(s.id)];});
  if (missing.length) {
    var additions=missing.map(function(s){return {operationId:'opening:'+s.id,kind:'opening',student:s};});
    dojoAppend(sh,additions); entries=entries.concat(additions);
  }
  return {sheet:sh,entries:entries};
}
function dojoAppend(sh, entries) {
  if (!entries.length) return;
  var rows=entries.map(function(e){
    var json=JSON.stringify(e), cells=[e.operationId];
    for(var i=0;i<json.length;i+=40000) cells.push(json.slice(i,i+40000));
    return cells;
  });
  var width=Math.max.apply(null,rows.map(function(r){return r.length;}));
  if (sh.getMaxColumns()<width) sh.insertColumnsAfter(sh.getMaxColumns(),width-sh.getMaxColumns());
  rows.forEach(function(r){while(r.length<width) r.push('');});
  sh.getRange(sh.getLastRow()+1,1,rows.length,width).setValues(rows);
  SpreadsheetApp.flush();
}
function dojoSnapshot(ledger) {
  var d=readLegacyData(), totals={}, records={}, deleted={};
  ledger.entries.forEach(function(e){if(e.kind==='deleted') deleted[String(e.studentId)]=true;});
  (d.history||[]).forEach(function(h){records[String(h.id)]=h;});
  ledger.entries.forEach(function(e){
    if(e.kind==='opening') {
      var s=e.student;
      if(!deleted[String(s.id)] && !d.students.some(function(x){return String(x.id)===String(s.id);})) d.students.push(s);
      totals[String(s.id)]={points:Number(s.points)||0,positivePoints:Number(s.positivePoints)||0,negativePoints:Number(s.negativePoints)||0};
    }
  });
  ledger.entries.forEach(function(e){
    if(e.kind) return;
    if(e.type==='classReset') {
      d.students.filter(function(s){return String(s.classId)===String(e.classId);}).forEach(function(s){
        var t=totals[String(s.id)];
        if(!t) return;
        var id=e.operationId+':'+s.id;
        records[id]={id:id,classId:s.classId,studentId:s.id,studentName:s.name,skillName:e.reason||'Reset điểm lớp về 0',points:-t.points,timestamp:e.timestamp};
        t.points=0;t.positivePoints=0;t.negativePoints=0;
      });
      return;
    }
    e.changes.forEach(function(c,i){
      var key=String(c.studentId);
      if (!totals[key]) totals[key]={points:Number(c.opening.points)||0,positivePoints:Number(c.opening.positivePoints)||0,negativePoints:Number(c.opening.negativePoints)||0};
      var t=totals[key]; t.points+=c.delta; t.positivePoints+=c.positiveDelta; t.negativePoints+=c.negativeDelta;
      var hs=c.history&&c.history.length ? c.history : [{id:e.operationId+':'+i,classId:c.classId,studentId:c.studentId,studentName:c.studentName,skillName:'Điều chỉnh / hoàn tác điểm',points:c.delta,timestamp:e.timestamp}];
      hs.forEach(function(h){records[String(h.id)]=h;});
      if(!deleted[key] && !d.students.some(function(s){return String(s.id)===key;})) {
        d.students.push(Object.assign({},c.opening,{id:c.studentId,classId:c.classId,name:c.studentName}));
      }
    });
  });
  d.students=d.students.map(function(s){return Object.assign({},s,totals[String(s.id)]||{});});
  d.history=Object.keys(records).map(function(k){return records[k];});
  d.appliedOperationIds=ledger.entries.filter(function(e){return !e.kind;}).map(function(e){return e.operationId;});
  d.revision=dojoRevision();
  return d;
}
// Keep visible Students columns consistent with the authoritative ledger.
function dojoWritePointProjection(data) {
  var sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Students');
  if(!sh || sh.getLastRow()<2) return;
  var rows=sh.getDataRange().getValues(), headers=rows[0], idCol=headers.indexOf('id'), byId={};
  if(idCol<0) return;
  data.students.forEach(function(s){byId[String(s.id)]=s;});
  ['points','positivePoints','negativePoints'].forEach(function(key){
    var col=headers.indexOf(key);
    if(col<0) return;
    var values=rows.slice(1).map(function(row){var s=byId[String(row[idCol])];return [s?s[key]:row[col]];});
    sh.getRange(2,col+1,values.length,1).setValues(values);
  });
  SpreadsheetApp.flush();
}
function dojoValidateBatch(b) {
  if (!b || typeof b.operationId!=='string' || !/^[a-zA-Z0-9-]{10,100}$/.test(b.operationId) || !Array.isArray(b.changes) || (!b.changes.length && b.type!=='classReset')) throw new Error('Giao dịch không hợp lệ');
  if(b.type && b.type!=='classReset') throw new Error('Loại giao dịch không hợp lệ');
  if(b.type==='classReset' && (b.classId===undefined || b.classId===null || String(b.classId)==='')) throw new Error('Thiếu lớp cần reset');
  b.changes.forEach(function(c){
    if (!c.opening || c.studentId===undefined || String(c.opening.id)!==String(c.studentId)) throw new Error('Thiếu học sinh');
    [c.delta,c.positiveDelta,c.negativeDelta,c.opening.points,c.opening.positivePoints,c.opening.negativePoints].forEach(function(n){if(typeof n!=='number'||!isFinite(n)) throw new Error('Điểm không hợp lệ');});
    if(Math.abs(c.delta-(c.positiveDelta-c.negativeDelta))>0.0000001) throw new Error('Tổng điểm không khớp điểm cộng/trừ');
  });
}
function doPost(e) {
  try {
    var p=JSON.parse(e.postData.contents);
    if (!p.data || p.data.protocol!==2) return respond({status:'error',protocol:2,message:'Ứng dụng cũ đã bị chặn để tránh ghi đè. Hãy tải lại ứng dụng V2.'});
    return withDojoLock(function(){
      var ledger=dojoLedger(), d=p.data;
      if(p.action==='syncPoints') {
        if(!Array.isArray(d.batches)) throw new Error('Thiếu danh sách giao dịch');
        var known={}; ledger.entries.forEach(function(b){known[b.operationId]=JSON.stringify(b);});
        var fresh=[], opened={}, deleted={};
        ledger.entries.forEach(function(e){if(e.kind==='opening') opened[String(e.student.id)]=true; if(e.kind==='deleted') deleted[String(e.studentId)]=true;});
        d.batches.forEach(function(b){
          dojoValidateBatch(b);
          b.changes.forEach(function(c){if(deleted[String(c.studentId)]) throw new Error('Học sinh đã bị xóa. Giao dịch chưa gửi vẫn được giữ trên thiết bị.');});
          if(known[b.operationId]) {
            if(known[b.operationId]!==JSON.stringify(b)) throw new Error('Mã giao dịch bị trùng với nội dung khác');
          } else {
            b.changes.forEach(function(c){
              if(!opened[String(c.studentId)]) {fresh.push({kind:'opening',operationId:'opening:'+c.studentId,student:c.opening});opened[String(c.studentId)]=true;}
            });
            known[b.operationId]=JSON.stringify(b);fresh.push(b);
          }
        });
        dojoAppend(ledger.sheet,fresh); ledger.entries=ledger.entries.concat(fresh);
        var snapshot=dojoSnapshot(ledger);
        dojoWritePointProjection(snapshot);
        return respond({status:'ok',protocol:2,data:snapshot});
      }
      if(p.action==='push') {
        var current=dojoSnapshot(ledger), rev=dojoRevision();
        if(d.baseRevision!==rev && !(d.baseRevision===null && !current.students.length && !current.classes.length)) return respond({status:'conflict',protocol:2,message:'Thông tin lớp đã thay đổi hoặc chưa tải bản V2. Điểm đã được lưu riêng. Hãy tải dữ liệu mới về trước khi sửa/lưu thông tin lớp.'});
        var snapshot=d.snapshot;
        if(!snapshot || !Array.isArray(snapshot.students)) throw new Error('Thiếu dữ liệu');
        // Scores and history from a client snapshot never overwrite authoritative point data.
        snapshot.students=snapshot.students.map(function(s){
          var authoritative=current.students.find(function(x){return String(x.id)===String(s.id);});
          return Object.assign({},s,{points:authoritative?authoritative.points:0,positivePoints:authoritative?authoritative.positivePoints:0,negativePoints:authoritative?authoritative.negativePoints:0});
        });
        snapshot.history=current.history;
        // Invalidate other snapshots before a potentially interrupted multi-sheet metadata write.
        dojoSetRevision(rev+1); SpreadsheetApp.flush();
        var removed=current.students.filter(function(s){return !snapshot.students.some(function(x){return String(x.id)===String(s.id);});});
        dojoAppend(ledger.sheet,removed.map(function(s){return {kind:'deleted',operationId:'delete:'+(rev+1)+':'+s.id,studentId:s.id};}));
        writeAllData(snapshot);
        return respond({status:'ok',protocol:2,revision:rev+1,message:'Đã lưu thông tin lớp và giao dịch điểm.'});
      }
      return respond({status:'error',protocol:2,message:'Unknown action'});
    });
  } catch(err) {return respond({status:'error',protocol:2,message:String(err)});}
}
function dojoPull() {
  try {return withDojoLock(function(){return respond({status:'ok',protocol:2,data:dojoSnapshot(dojoLedger())});});}
  catch(err){return respond({status:'error',protocol:2,message:String(err)});}
}
