// ============================================================
// TIME BOMB GAME
// ============================================================
let bombDuration = 60;
let bombRemaining = 0;
let bombInterval = null;
let currentBombHolder = null;
let safeStudentsList = []; 

function openTimeBomb() {
    if(!currentClassId) return showToast('Vui lòng chọn lớp trước', false);
    const clsStudents = students.filter(s=>s.classId===currentClassId);
    if(clsStudents.length < 2) return showToast('Lớp cần ít nhất 2 học sinh', false);
    
    document.getElementById('bombGameModal').classList.remove('hidden');
    document.getElementById('bombGameModal').classList.add('flex');
    document.getElementById('bombSetupScreen').classList.remove('hidden');
    document.getElementById('bombPlayScreen').classList.add('hidden');
    document.getElementById('bombPlayScreen').classList.remove('flex');
    document.getElementById('bombResultScreen').classList.add('hidden');
    document.getElementById('bombResultScreen').classList.remove('flex');
    
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.className = 'time-btn flex-1 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold border-2 border-transparent hover:bg-gray-200 transition';
    });
    document.querySelectorAll('.time-btn')[1].className = 'time-btn flex-1 py-2 rounded-xl bg-red-50 text-red-600 font-bold border-2 border-red-500 transition';
    bombDuration = 60;
}

function setTimeBomb(seconds) {
    bombDuration = seconds;
    document.querySelectorAll('.time-btn').forEach(btn => {
        if(btn.innerText.includes(seconds)) {
            btn.className = 'time-btn flex-1 py-2 rounded-xl bg-red-50 text-red-600 font-bold border-2 border-red-500 transition';
        } else {
            btn.className = 'time-btn flex-1 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold border-2 border-transparent hover:bg-gray-200 transition';
        }
    });
}

function closeTimeBomb() {
    document.getElementById('bombGameModal').classList.add('hidden');
    document.getElementById('bombGameModal').classList.remove('flex');
    if(bombInterval) clearInterval(bombInterval);
    document.getElementById('soundBombTick').pause();
}

function startTimeBomb() {
    const clsStudents = students.filter(s=>s.classId===currentClassId);
    safeStudentsList = [];
    bombRemaining = bombDuration;
    
    const randIdx = Math.floor(Math.random() * clsStudents.length);
    currentBombHolder = clsStudents[randIdx];
    
    updateBombUI();
    
    document.getElementById('bombSetupScreen').classList.add('hidden');
    document.getElementById('bombPlayScreen').classList.remove('hidden');
    document.getElementById('bombPlayScreen').classList.add('flex');
    
    document.getElementById('soundBombTick').currentTime = 0;
    document.getElementById('soundBombTick').play().catch(()=>{});
    
    bombInterval = setInterval(() => {
        bombRemaining--;
        updateBombUI();
        
        if(bombRemaining <= 0) {
            bombExplode();
        }
    }, 1000);
}

function updateBombUI() {
    const m = Math.floor(bombRemaining / 60);
    const s = bombRemaining % 60;
    document.getElementById('bombTimer').innerText = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    
    document.getElementById('bombStudentName').innerText = currentBombHolder.name;
    document.getElementById('bombStudentAvatar').innerHTML = `<img src="${avatarBaseUrl}${currentBombHolder.id}" class="w-full h-full object-cover">`;
    
    const iconContainer = document.getElementById('bombIconContainer');
    const flashBg = document.getElementById('bombFlashBg');
    const spark = document.getElementById('bombSpark');
    
    iconContainer.className = 'relative mb-12'; 
    flashBg.className = 'absolute inset-0 hidden';
    
    if(bombRemaining <= 15 && bombRemaining > 5) {
        iconContainer.classList.add('bomb-shake-fast');
        flashBg.className = 'absolute inset-0 bomb-bg-flash pointer-events-none z-0 block';
        flashBg.classList.remove('hidden');
        spark.classList.remove('hidden');
    } else if (bombRemaining <= 5 && bombRemaining > 0) {
        iconContainer.classList.add('bomb-shake-extreme');
        flashBg.className = 'absolute inset-0 bomb-bg-flash-fast pointer-events-none z-0 block';
        flashBg.classList.remove('hidden');
        spark.classList.remove('hidden');
    } else {
        spark.classList.add('hidden');
    }
}

function bombIncorrect() {
    const playScreen = document.getElementById('bombPlayScreen');
    playScreen.classList.add('bomb-shake-fast');
    setTimeout(() => playScreen.classList.remove('bomb-shake-fast'), 300);
}

function bombPass() {
    if(bombRemaining <= 0) return;
    document.getElementById('soundBombPass').currentTime = 0;
    document.getElementById('soundBombPass').play().catch(()=>{});
    
    if(!safeStudentsList.includes(currentBombHolder.id)) {
        safeStudentsList.push(currentBombHolder.id);
    }
    
    const clsStudents = students.filter(s=>s.classId===currentClassId);
    let available = clsStudents.filter(s => !safeStudentsList.includes(s.id) && s.id !== currentBombHolder.id);
    if(available.length === 0) available = clsStudents.filter(s => s.id !== currentBombHolder.id); 
    
    const randIdx = Math.floor(Math.random() * available.length);
    currentBombHolder = available[randIdx];
    updateBombUI();
}

function bombExplode() {
    clearInterval(bombInterval);
    document.getElementById('soundBombTick').pause();
    
    document.getElementById('soundBombExplode').currentTime = 0;
    document.getElementById('soundBombExplode').play().catch(()=>{});
    
    const flashBg = document.getElementById('bombFlashBg');
    flashBg.className = 'absolute inset-0 bomb-bg-flash-explode pointer-events-none z-0 block';
    document.getElementById('bombIconContainer').className = 'relative mb-12 bomb-shake-extreme';
    
    setTimeout(() => {
        document.getElementById('bombPlayScreen').classList.add('hidden');
        document.getElementById('bombPlayScreen').classList.remove('flex');
        
        document.getElementById('bombResultScreen').classList.remove('hidden');
        document.getElementById('bombResultScreen').classList.add('flex');
        
        document.getElementById('bombLoserName').innerText = currentBombHolder.name;
        
        const winnersList = document.getElementById('bombWinnersList');
        if(safeStudentsList.length > 0) {
            winnersList.innerHTML = safeStudentsList.map(id => {
                const s = students.find(st=>st.id===id);
                return `<span class="bg-green-100 text-green-700 font-bold px-2 py-1 rounded-full text-xs">${s.name}</span>`;
            }).join('');
        } else {
            winnersList.innerHTML = '<span class="text-gray-400 italic text-xs">Chưa có ai sống sót</span>';
        }
        
        // 1. Phạt người bị nổ bom
        selectedStudentId = currentBombHolder.id;
        addPoints('custom', -1, 'Bị nổ bom hẹn giờ');
        
        // 2. Thưởng người đã qua màn
        if(safeStudentsList.length > 0) {
            _isGroupAward = true;
            _groupTargetIds = safeStudentsList;
            addPoints('custom', 1, 'Ném bom thành công');
        }
        
    }, 1000);
}

function forceStopBomb() {
    clearInterval(bombInterval);
    closeTimeBomb();
}
