// ============================================================
// LOCAL STORAGE
// ============================================================
function saveData() {
    try {
        localStorage.setItem('dojo_classes',  JSON.stringify(classes));
        localStorage.setItem('dojo_students', JSON.stringify(students));
        localStorage.setItem('dojo_skills',   JSON.stringify(skills));
        localStorage.setItem('dojo_history',       JSON.stringify(history));
        localStorage.setItem('dojo_periods',       JSON.stringify(periods));
        localStorage.setItem('dojo_gradeRecords',    JSON.stringify(gradeRecords));
        localStorage.setItem('dojo_commLog',         JSON.stringify(communicationLog));
        localStorage.setItem('dojo_goals',           JSON.stringify(studentGoals));
        localStorage.setItem('dojo_classNotes',      JSON.stringify(classNotes));
        localStorage.setItem('dojo_subjectGrades',   JSON.stringify(subjectGrades));
        localStorage.setItem('dojo_meetingNotes',    JSON.stringify(meetingNotes));
        localStorage.setItem('dojo_hoaBa',           JSON.stringify(hoaBa));
        localStorage.setItem('dojo_sync',            JSON.stringify(syncSettings));
    } catch(e) { console.warn('Lưu thất bại:', e); }
}

function loadData() {
    try {
        const c=localStorage.getItem('dojo_classes');
        const s=localStorage.getItem('dojo_students');
        const sk=localStorage.getItem('dojo_skills');
        const h=localStorage.getItem('dojo_history');
        const p=localStorage.getItem('dojo_periods');
        if(c)  classes  = JSON.parse(c);
        if(s)  students = JSON.parse(s);
        if(sk) skills   = JSON.parse(sk);
        if(h)  history      = JSON.parse(h);
        if(p)  periods      = JSON.parse(p);
        const gr=localStorage.getItem('dojo_gradeRecords');
        if(gr) gradeRecords = JSON.parse(gr);
        const cl=localStorage.getItem('dojo_commLog');
        if(cl) communicationLog = JSON.parse(cl);
        const gl=localStorage.getItem('dojo_goals');
        if(gl) studentGoals = JSON.parse(gl);
        const cn=localStorage.getItem('dojo_classNotes');
        if(cn) classNotes = JSON.parse(cn);
        const sg2=localStorage.getItem('dojo_subjectGrades');
        if(sg2) subjectGrades = JSON.parse(sg2);
        const mn=localStorage.getItem('dojo_meetingNotes');
        if(mn) meetingNotes = JSON.parse(mn);
        const hb=localStorage.getItem('dojo_hoaBa');
        if(hb) hoaBa = JSON.parse(hb);
        const sy=localStorage.getItem('dojo_sync');
        if(sy) { syncSettings = JSON.parse(sy); if(!syncSettings.url) syncSettings.url = DEFAULT_SYNC_URL; }
        if(classes.length > 0) currentClassId = classes[0].id;
    } catch(e) { console.warn('Tải thất bại:', e); }
}

