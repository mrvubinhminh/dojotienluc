// ============================================================
// TOAST
// ============================================================
function showToast(msg, isPos=true, duration=3000) {
    const t=document.getElementById('toast'), i=t.querySelector('i');
    document.getElementById('toastMessage').innerText=msg;
    i.className=isPos?'fas fa-check-circle text-dojo-green text-xl':'fas fa-exclamation-circle text-red-400 text-xl';
    t.classList.remove('opacity-0'); t.classList.add('opacity-100','translate-y-4');
    if(window.toastTimer) clearTimeout(window.toastTimer);
    window.toastTimer=setTimeout(()=>{t.classList.remove('opacity-100','translate-y-4');t.classList.add('opacity-0');},duration);
}

function showMilestoneToast(name, m) {
    const t=document.getElementById('toast'), i=t.querySelector('i');
    document.getElementById('toastMessage').innerText=`${m.icon} ${name} đạt mốc: ${m.label}!`;
    i.className='fas fa-trophy text-yellow-400 text-xl';
    t.classList.remove('opacity-0'); t.classList.add('opacity-100','translate-y-4');
    if(window.toastTimer) clearTimeout(window.toastTimer);
    window.toastTimer=setTimeout(()=>{t.classList.remove('opacity-100','translate-y-4');t.classList.add('opacity-0');},4500);
}

