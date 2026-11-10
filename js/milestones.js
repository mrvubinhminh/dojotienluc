// ============================================================
// MILESTONES
// ============================================================
function getMilestone(points) {
    let result=null;
    for(const m of MILESTONES) { if(points >= m.threshold) result=m; }
    return result;
}

// Chấm cho nhiều em cùng lúc có thể làm nhiều em cùng đạt mốc: gom lại thành MỘT lần pháo giấy,
// một tiếng chuông, một thông báo — tránh 20-40 lần pháo giấy chồng nhau làm máy đứng hình.
let _milestoneQueue = [], _milestoneTimer = null;
function checkMilestone(student, oldPoints) {
    for(const m of MILESTONES) {
        if(oldPoints < m.threshold && student.points >= m.threshold) {
            _milestoneQueue.push({name: student.name, m});
            if (!_milestoneTimer) _milestoneTimer = setTimeout(_celebrateMilestones, 400);
            break;
        }
    }
}
function _celebrateMilestones() {
    const list = _milestoneQueue; _milestoneQueue = []; _milestoneTimer = null;
    if (!list.length) return;
    confetti({ particleCount:200, spread:120, origin:{y:0.6}, zIndex:10000, colors:['#ffc107','#ff9800','#f44336','#4caf50','#2196f3'] });
    document.getElementById('soundTaDa')?.play().catch(()=>{});
    if (list.length === 1) { showMilestoneToast(list[0].name, list[0].m); return; }
    const top = list.reduce((a, b) => b.m.threshold > a.m.threshold ? b : a).m;
    const names = list.slice(0, 3).map(x => x.name).join(', ') + (list.length > 3 ? ` và ${list.length - 3} bạn khác` : '');
    showMilestoneToast(names, top);
}

