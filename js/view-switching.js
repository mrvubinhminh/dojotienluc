// ============================================================
// VIEW SWITCHING
// ============================================================
function switchView(view) {
    currentView=view;
    ['classroom','report','grades','history','settings','meeting'].forEach(v=>{
        const el=document.getElementById(v+'View'); if(el) el.classList.toggle('hidden', v!==view);
        const nav=document.getElementById('nav-'+v);
        if(nav) nav.className=`flex flex-col items-center gap-0.5 p-1 w-[16%] transition-colors relative ${v===view?'text-dojo-blue':'text-gray-400 hover:text-gray-600'}`;
    });
    document.getElementById('headerAddBtn').classList.toggle('hidden', view!=='classroom');
    if(view !== 'report' && mainChartInstance) { mainChartInstance.destroy(); mainChartInstance=null; }
    if(view !== 'report') { chartVisible=false; document.getElementById('chartSection').classList.add('hidden'); document.getElementById('btnToggleChart') && (document.getElementById('btnToggleChart').className='w-9 h-9 rounded-xl bg-blue-50 text-dojo-blue flex items-center justify-center hover:bg-blue-100 transition'); }

    if(view==='classroom') renderStudents();
    else if(view==='report') { currentPeriodId=null; renderReport(); }
    else if(view==='grades') renderGradeView();
    else if(view==='history') renderHistory();
    else if(view==='settings') renderSettings();
    else if(view==='meeting') renderMeetingView();
}

