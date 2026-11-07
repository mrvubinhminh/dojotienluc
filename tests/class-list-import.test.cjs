const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const ctx=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/class-list-import.js'),'utf8'),ctx);
const parse=rows=>JSON.parse(JSON.stringify(ctx.parseClassListRows(rows)));

test('simple list: STT | Họ và tên | Ngày sinh, wrapped names are joined',()=>{
 const r=parse([['STT','Họ và tên','Ngày sinh'],['1','Dương Khánh Băng','27/04/2011'],['6','Nguyễn Ngọc Thùy\nDương','11/03/2011'],[16,'Trần Lâm Phú Khang','20/06/2010']]);
 assert.deepEqual(r.students.map(s=>[s.stt,s.name,s.dob]),[[1,'Dương Khánh Băng','27/04/2011'],[6,'Nguyễn Ngọc Thùy Dương','11/03/2011'],[16,'Trần Lâm Phú Khang','20/06/2010']]);
 assert.equal(r.warnings.length,0);
});
test('Sở bảng điểm: header on row 6, class/subject/teacher from title, code column kept as text',()=>{
 const rows=[[],['Sở Giáo dục và Đào tạo Hồ Chí Minh','','','BẢNG ĐIỂM HỌC KỲ'],['Trường: THPT Nguyễn Hữu Cảnh','','','Năm học: 2026-2027 - Học kỳ: 1'],
  ['Lớp: 10A4','','','Môn học: Toán - GV: Vũ Tiến Lực'],[],['STT','Mã định danh Bộ GD&ĐT','Họ và tên','Ngày sinh','ĐĐGtx'],[],['','','','',1,2,3],
  ['1','7969461383','Dương Khánh Băng','27/04/2011'],['43','0151069506','Lê Thị Ánh Tuyết','30/09/2011']];
 const r=parse(rows);
 assert.equal(r.className,'10A4');assert.equal(r.subjectName,'Toán');assert.equal(r.teacherName,'Vũ Tiến Lực');
 assert.deepEqual(r.students.map(s=>[s.name,s.dob,s.studentCode]),[['Dương Khánh Băng','27/04/2011','7969461383'],['Lê Thị Ánh Tuyết','30/09/2011','0151069506']]);
});
test('list without date of birth: SBD column is not mistaken for a date',()=>{
 const r=parse([['STT','HỌ TÊN','SBD'],['1','Phạm Phạm Gia An','260201'],['2','Lương Hoài An','260202'],[],[]]);
 assert.deepEqual(r.students.map(s=>[s.name,s.dob]),[['Phạm Phạm Gia An',''],['Lương Hoài An','']]);
 assert.ok(r.warnings.some(w=>w.includes('Ngày sinh')));
});
test('real Excel dates (Date object, serial number, d-m-yyyy) become dd/mm/yyyy',()=>{
 const r=parse([['STT','Họ và tên','Ngày sinh'],[1,'A',new Date(2011,3,27)],[2,'B',40660],[3,'C','1-7-2011']]);
 assert.deepEqual(r.students.map(s=>s.dob),['27/04/2011','27/04/2011','01/07/2011']);
});
test('separate "Họ đệm" | "Tên" columns are combined; footer and signature rows skipped',()=>{
 const r=parse([['STT','Họ đệm','Tên','Ngày sinh'],[1,'Nguyễn Văn','An','01/01/2011'],['','Giáo viên chủ nhiệm','',''],['Tổng: 1','','','']]);
 assert.deepEqual(r.students.map(s=>s.name),['Nguyễn Văn An']);
});
test('duplicates inside the file are reported; unknown layout returns null',()=>{
 const r=parse([['STT','Họ và tên','Ngày sinh'],[1,'Lê An','01/01/2011'],[2,'Lê  An','01/01/2011']]);
 assert.equal(r.warnings.length,1);assert.equal(ctx.parseClassListRows([['a','b'],['1','x']]),null);
});
test('existing student matching: code first, then name + date of birth',()=>{
 assert.ok(ctx.isSameImportedStudent({name:'Lê An',dob:'01/01/2011'},{name:'lê  an',dob:'01/01/2011',studentCode:''}));
 assert.ok(!ctx.isSameImportedStudent({name:'Lê An',dob:'01/01/2011'},{name:'Lê An',dob:'02/01/2011',studentCode:''}));
 assert.ok(!ctx.isSameImportedStudent({name:'Lê An',studentCode:'1'},{name:'Lê An',studentCode:'2'}));
});
