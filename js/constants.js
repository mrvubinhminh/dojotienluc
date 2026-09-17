// ============================================================
// CONSTANTS
// ============================================================
const avatarBaseUrl = 'https://api.dicebear.com/7.x/bottts/svg?seed=';

const MILESTONES = [
    { threshold: 5,  icon: '⭐', label: 'Ngôi sao',  bg: 'bg-yellow-50', border: 'border-yellow-200' },
    { threshold: 15, icon: '🥈', label: 'Bạc',       bg: 'bg-gray-50',   border: 'border-gray-200'   },
    { threshold: 30, icon: '🏆', label: 'Vàng',      bg: 'bg-amber-50',  border: 'border-amber-200'  },
    { threshold: 50, icon: '👑', label: 'Vô địch',   bg: 'bg-purple-50', border: 'border-purple-200' },
];

// Huy hiệu chuỗi điểm cộng (streak badges)
// type:'day' = n ngày liên tiếp có điểm cộng | type:'week' = n tuần liên tiếp
const STREAK_BADGES = [
    { type:'day',  min:3,  icon:'🔥', name:'Bùng Cháy',      desc:'3 ngày liên tiếp',   grad:'linear-gradient(135deg,#f97316,#ef4444)', shadow:'rgba(249,115,22,0.5)' },
    { type:'day',  min:5,  icon:'⚡', name:'Tia Sét',         desc:'5 ngày liên tiếp',   grad:'linear-gradient(135deg,#eab308,#f59e0b)', shadow:'rgba(234,179,8,0.5)'  },
    { type:'day',  min:7,  icon:'🌟', name:'Tuần Hoàn Hảo',  desc:'7 ngày liên tiếp',   grad:'linear-gradient(135deg,#6366f1,#8b5cf6)', shadow:'rgba(99,102,241,0.5)' },
    { type:'day',  min:14, icon:'💫', name:'Thiên Tài',       desc:'14 ngày liên tiếp',  grad:'linear-gradient(135deg,#8b5cf6,#ec4899)', shadow:'rgba(139,92,246,0.5)' },
    { type:'day',  min:30, icon:'🏆', name:'Huyền Thoại',    desc:'30 ngày liên tiếp',  grad:'linear-gradient(135deg,#f59e0b,#fbbf24)', shadow:'rgba(245,158,11,0.6)' },
    { type:'week', min:2,  icon:'🎯', name:'Kép Đôi',         desc:'2 tuần liên tiếp',   grad:'linear-gradient(135deg,#06b6d4,#3b82f6)', shadow:'rgba(6,182,212,0.5)'  },
    { type:'week', min:3,  icon:'🏅', name:'Bộ Ba Vàng',     desc:'3 tuần liên tiếp',   grad:'linear-gradient(135deg,#f59e0b,#ef4444)', shadow:'rgba(245,158,11,0.5)' },
    { type:'week', min:4,  icon:'🌈', name:'Tháng Vàng',     desc:'4 tuần liên tiếp',   grad:'linear-gradient(135deg,#10b981,#06b6d4)', shadow:'rgba(16,185,129,0.5)' },
    { type:'week', min:6,  icon:'💎', name:'Kim Cương',       desc:'6 tuần liên tiếp',   grad:'linear-gradient(135deg,#0ea5e9,#6366f1)', shadow:'rgba(14,165,233,0.5)' },
    { type:'week', min:8,  icon:'👑', name:'Hoàng Đế',        desc:'8+ tuần liên tiếp',  grad:'linear-gradient(135deg,#a855f7,#ec4899)', shadow:'rgba(168,85,247,0.6)' },
];

function _getISOWeekKey(date) {
    const d = new Date(date); d.setHours(12,0,0,0);
    const day = d.getDay()||7;
    d.setDate(d.getDate()+4-day);
    const ys = new Date(d.getFullYear(),0,1);
    const wn = Math.ceil((((d-ys)/86400000)+1)/7);
    return `${d.getFullYear()}-${String(wn).padStart(2,'0')}`;
}

function computeStreaks(studentId, classId) {
    const sh = history.filter(h=>h.studentId===studentId&&h.classId===classId&&h.points>0);
    if (!sh.length) return { maxDay:0, maxWeek:0, curDay:0, curWeek:0 };
    // Unique sorted day strings
    const daySet = new Set(sh.map(h=>{const d=new Date(h.timestamp);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}));
    const days = [...daySet].sort();
    const dayDates = days.map(s=>new Date(s));
    // Max consecutive days
    let maxDay=1, run=1;
    for(let i=1;i<dayDates.length;i++){
        const diff=Math.round((dayDates[i]-dayDates[i-1])/86400000);
        if(diff===1){run++;if(run>maxDay)maxDay=run;}else run=1;
    }
    // Current streak (active if last entry ≤1 day ago)
    let curDay=0;
    if(dayDates.length){
        const today=new Date();today.setHours(0,0,0,0);
        const last=new Date(dayDates[dayDates.length-1]);last.setHours(0,0,0,0);
        if(Math.round((today-last)/86400000)<=1){
            let cr=1;
            for(let i=dayDates.length-2;i>=0;i--){
                if(Math.round((dayDates[i+1]-dayDates[i])/86400000)===1)cr++;else break;
            }
            curDay=cr;
        }
    }
    // Week streaks
    const weekSet=new Set(sh.map(h=>_getISOWeekKey(new Date(h.timestamp))));
    const weeks=[...weekSet].sort();
    let maxWeek=weeks.length?1:0, wrun=1;
    for(let i=1;i<weeks.length;i++){
        const [y1,w1]=weeks[i-1].split('-').map(Number),[y2,w2]=weeks[i].split('-').map(Number);
        const consec=(y1===y2&&w2===w1+1)||(y2===y1+1&&w2===1&&w1>=52);
        if(consec){wrun++;if(wrun>maxWeek)maxWeek=wrun;}else wrun=1;
    }
    // Current week streak
    let curWeek=0;
    if(weeks.length){
        const thisWk=_getISOWeekKey(new Date()),lastWk=weeks[weeks.length-1];
        const [y1,w1]=lastWk.split('-').map(Number),[y2,w2]=thisWk.split('-').map(Number);
        const recent=lastWk===thisWk||(y1===y2&&w2===w1+1)||(y2===y1+1&&w2===1&&w1>=52);
        if(recent)curWeek=wrun;
    }
    return {maxDay,maxWeek,curDay,curWeek};
}

function getEarnedStreakBadges(maxDay, maxWeek) {
    return STREAK_BADGES.filter(b=>(b.type==='day'?maxDay:maxWeek)>=b.min);
}
function getTopStreakBadge(maxDay, maxWeek) {
    const earned=getEarnedStreakBadges(maxDay,maxWeek);
    return earned.length?earned[earned.length-1]:null;
}

function renderStreakHallOfFame() {
    const el=document.getElementById('streakHallOfFame'); if(!el)return;
    if(currentPeriodId!==null){el.innerHTML='';return;}
    const clsStudents=students.filter(s=>s.classId===currentClassId);
    const heroes=[];
    clsStudents.forEach(s=>{
        const st=computeStreaks(s.id,currentClassId);
        const badge=getTopStreakBadge(st.maxDay,st.maxWeek);
        if(badge) heroes.push({s,st,badge,earned:getEarnedStreakBadges(st.maxDay,st.maxWeek)});
    });
    if(!heroes.length){el.innerHTML='';return;}
    // Sort best badge first
    heroes.sort((a,b)=>STREAK_BADGES.indexOf(b.badge)-STREAK_BADGES.indexOf(a.badge));
    let html=`<div>
    <div class="flex items-center gap-2 mb-2 px-1">
      <span class="text-xl">🏅</span>
      <h3 class="font-black text-gray-800 text-sm tracking-wide">DANH HIỆU CHUỖI ĐIỂM CỘNG</h3>
      <span class="text-xs text-gray-400 font-semibold">${heroes.length} học sinh</span>
    </div>
    <div class="flex gap-3 overflow-x-auto no-scrollbar pb-2">`;
    heroes.forEach(({s,st,badge,earned},idx)=>{
        const delay=idx*80;
        const isActive=st.curDay>=badge.min||(badge.type==='week'&&st.curWeek>=badge.min);
        const allIcons=earned.map(b=>`<span title="${b.name}: ${b.desc}">${b.icon}</span>`).join('');
        const streakInfo=st.curDay>0?`🔥 ${st.curDay} ngày`:(st.curWeek>0?`📅 ${st.curWeek} tuần`:'');
        html+=`<div class="flex-shrink-0 w-[130px] rounded-2xl p-3 text-white cursor-pointer streak-badge-pop ${isActive?'streak-card':''}" style="background:${badge.grad};box-shadow:0 6px 20px ${badge.shadow};animation-delay:${delay}ms" onclick="openStudentProfile('${s.id}')">
          <div class="relative"><div class="text-4xl text-center leading-none mb-1 streak-shimmer rounded-lg py-1">${badge.icon}</div></div>
          <div class="text-[11px] font-black text-center truncate leading-tight">${s.name}</div>
          <div class="text-[10px] font-bold text-center mt-0.5 opacity-90">${badge.name}</div>
          <div class="text-[9px] text-center opacity-75 mt-0.5">${badge.desc}</div>
          ${streakInfo?`<div class="text-[9px] font-bold text-center mt-1 bg-white bg-opacity-25 rounded-full px-1 py-0.5">${streakInfo}</div>`:''}
          <div class="flex justify-center gap-0.5 mt-1.5 text-sm flex-wrap">${allIcons}</div>
        </div>`;
    });
    html+='</div></div>';
    el.innerHTML=html;
}

