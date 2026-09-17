// ============================================================
// STATE
// ============================================================
let classes  = [{ id:1, name:'5A Superstars' }, { id:2, name:'Lớp Tiếng Anh Căn Bản' }];
let currentClassId = 1;
let students = [
    { id:1, classId:1, stt:1, name:'Bảo Trâm',  dob:'15/05/2013', points:5,  positivePoints:5, negativePoints:0, avatar:avatarBaseUrl+'Tram'  },
    { id:2, classId:1, stt:2, name:'Minh Quân', dob:'20/08/2013', points:2,  positivePoints:3, negativePoints:1, avatar:avatarBaseUrl+'Quan'  },
    { id:3, classId:1, stt:3, name:'Tuấn Tú',   dob:'',           points:-1, positivePoints:1, negativePoints:2, avatar:avatarBaseUrl+'Tuan'  },
    { id:4, classId:2, stt:1, name:'David',      dob:'01/01/2014', points:8,  positivePoints:8, negativePoints:0, avatar:avatarBaseUrl+'David' },
];
let skills       = JSON.parse(JSON.stringify(DEFAULT_SKILLS));
let history      = [];  // { id, classId, studentId, studentName, skillName, points, timestamp }
let periods      = [];  // { id, classId, name, endDate, students:[] }
let gradeRecords       = [];  // { id, classId, periodName, createdAt, studentGrades:[{studentId,name,stt,grades:{}}] }
let communicationLog   = [];  // { id, classId, studentId|null, studentName, studentAvatar, type, content, date, createdAt }
let studentGoals       = [];  // { id, classId, studentId, title, type, targetValue, currentValue, bonusPoints, deadline, status, createdAt }
let classNotes         = [];  // { id, classId, content, deadline, done, doneAt, createdAt }
let meetingNotes       = [];  // { id, date, title, tag, important, archived, archivedAt, createdAt, items:[{id,text,done}] }
let subjectGrades      = [];  // { id, classId, subject, semester, txCount, updatedAt, rows:[{studentId,name,stt,tx:[],gk,ck,dtb}] }
let hoaBa              = [];  // { id, classId, studentId, name, stt, hk1Note:'', hk2Note:'', cnNote:'', updatedAt }
let currentGradePeriodId = null;
let _gradesHKMode = null;        // null = period mode, 'HK1'/'HK2' = sync from subjectGrades
let _gradesSubjectFilter = null; // null = tất cả môn, 'Toán'/'Văn'/... = sổ điểm riêng môn đó
let _editingNoteId = null;
let currentPeriodId  = null;
const DEFAULT_SYNC_URL = 'https://script.google.com/macros/s/AKfycbzo4f6_Nm9UFWAg-TrMN32iz77rABLKzeijSrD69Lym3plVYap3LtecV9zn5JpwQcHgIQ/exec';
let syncSettings     = { url: DEFAULT_SYNC_URL, lastSync:null };
let selectedStudentId = null;
let isAwardAll = false;
let currentView = 'classroom';
let shuffleInterval, randomSelectedId;

