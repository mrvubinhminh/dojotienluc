// ============================================================
// RANDOM SELECTION
// ============================================================
function startRandomSelection() {
    const cs=students.filter(s=>s.classId===currentClassId);
    if(cs.length===0) return alert('Lớp chưa có học sinh!');
    if(cs.length===1) return alert('Cần ít nhất 2 học sinh!');
    const bd=document.getElementById('randomBackdrop'),modal=document.getElementById('randomModal'),actions=document.getElementById('randomActions');
    actions.classList.replace('flex','hidden');
    document.getElementById('randomStatus').innerText="Đang quay số...";
    document.getElementById('randomAvatarContainer').className='w-32 h-32 mx-auto bg-blue-50 rounded-full border-4 border-dojo-blue shadow-inner flex items-center justify-center p-2 mb-4 overflow-hidden transition-transform duration-300';
    document.getElementById('randomName').className='text-2xl font-black text-gray-800 mb-6 min-h-[2rem]';
    bd.classList.remove('hidden'); bd.classList.add('flex');
    setTimeout(()=>modal.classList.remove('scale-95'),10);
    let counter=0;
    const tick=document.getElementById('soundTick');
    shuffleInterval=setInterval(()=>{
        const r=cs[Math.floor(Math.random()*cs.length)];
        document.getElementById('randomAvatar').src=r.avatar;
        document.getElementById('randomName').innerText=r.name;
        tick.currentTime=0; tick.play().catch(()=>{});
        if(++counter>=20){clearInterval(shuffleInterval);finishRandomSelection(cs);}
    },100);
}
function finishRandomSelection(cs) {
    const winner=cs[Math.floor(Math.random()*cs.length)];
    randomSelectedId=winner.id;
    document.getElementById('randomAvatar').src=winner.avatar;
    document.getElementById('randomStatus').innerText="Học sinh được gọi là!";
    const ne=document.getElementById('randomName');
    ne.innerText=winner.name;
    ne.className='text-5xl sm:text-6xl font-black text-dojo-blue mb-6 min-h-[4rem] animate-pop-in text-glow leading-tight break-words';
    confetti({particleCount:150,spread:100,origin:{y:0.5},zIndex:10000,colors:['#33a3dc','#8bc34a','#f44336','#ffc107']});
    document.getElementById('soundTaDa').play().catch(()=>{});
    const ac=document.getElementById('randomAvatarContainer');
    ac.classList.replace('border-dojo-blue','border-dojo-green'); ac.classList.add('scale-110');
    const actions=document.getElementById('randomActions');
    actions.classList.replace('hidden','flex');
    const card=document.getElementById(`student-card-${winner.id}`);
    if(card){card.scrollIntoView({behavior:'smooth',block:'center'});card.classList.add('ring-4','ring-dojo-green','scale-105');setTimeout(()=>card.classList.remove('ring-4','ring-dojo-green','scale-105'),3000);}
    document.getElementById('btnAwardRandom').onclick=()=>{closeRandomModal();setTimeout(()=>openPointsModal(randomSelectedId),300);};
}
function closeRandomModal() {
    clearInterval(shuffleInterval);
    document.getElementById('randomModal').classList.add('scale-95');
    setTimeout(()=>{const b=document.getElementById('randomBackdrop');b.classList.add('hidden');b.classList.remove('flex');},300);
}

