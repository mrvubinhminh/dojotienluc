// ============================================================
// MILESTONES
// ============================================================
function getMilestone(points) {
    let result=null;
    for(const m of MILESTONES) { if(points >= m.threshold) result=m; }
    return result;
}

function checkMilestone(student, oldPoints) {
    for(const m of MILESTONES) {
        if(oldPoints < m.threshold && student.points >= m.threshold) {
            setTimeout(()=>{
                confetti({ particleCount:200, spread:120, origin:{y:0.6}, zIndex:10000, colors:['#ffc107','#ff9800','#f44336','#4caf50','#2196f3'] });
                showMilestoneToast(student.name, m);
                document.getElementById('soundTaDa').play().catch(()=>{});
            }, 400);
            break;
        }
    }
}

