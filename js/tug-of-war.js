// ============================================================
// TUG OF WAR GAME LOGIC
// ============================================================

let tugDuration = 300; // Default 5 mins
let tugRemainingTime = 300;
let tugInterval = null;
let tugFlagPosition = 50; // 0 (Blue wins) to 100 (Red wins)

let teamBlue = [];
let teamRed = [];
let uncalledTugStudents = [];
let currentTugStudent = null;

function openTugOfWar() {
    if(!currentClassId) return showToast('Vui lòng chọn lớp trước', false);
    const clsStudents = students.filter(s=>s.classId===currentClassId);
    if(clsStudents.length < 2) return showToast('Lớp phải có ít nhất 2 học sinh', false);
    
    document.getElementById('tugOfWarModal').classList.remove('hidden');
    document.getElementById('tugOfWarModal').classList.add('flex');
    
    document.getElementById('tugSetupScreen').classList.remove('hidden');
    document.getElementById('tugSetupScreen').classList.add('flex');
    document.getElementById('tugPlayScreen').classList.add('hidden');
    document.getElementById('tugPlayScreen').classList.remove('flex');
    document.getElementById('tugResultScreen').classList.add('hidden');
    document.getElementById('tugResultScreen').classList.remove('flex');
    
    document.getElementById('tugTimeInput').value = 10;
}

function closeTugOfWar() {
    document.getElementById('tugOfWarModal').classList.add('hidden');
    document.getElementById('tugOfWarModal').classList.remove('flex');
    if(tugInterval) clearInterval(tugInterval);
}


function startTugOfWar() {
    const clsStudents = students.filter(s=>s.classId===currentClassId);
    
    // Shuffle and divide
    const shuffled = [...clsStudents].sort(() => Math.random() - 0.5);
    const mid = Math.ceil(shuffled.length / 2);
    teamBlue = shuffled.slice(0, mid);
    teamRed = shuffled.slice(mid);
    
    // Add team property for easy checking
    teamBlue.forEach(s => s.tugTeam = 'blue');
    teamRed.forEach(s => s.tugTeam = 'red');
    
    // Parse Time
    let inputMins = parseInt(document.getElementById('tugTimeInput').value) || 10;
    if(inputMins < 10) inputMins = 10;
    document.getElementById('tugTimeInput').value = inputMins;
    tugDuration = inputMins * 60;
    
    uncalledTugStudents = [];
    currentTugStudent = null;
    tugRemainingTime = tugDuration;
    tugFlagPosition = 50; // Center
    
    updateTugUI();
    clearTugStudent();
    
    // Render Team Lists
    const renderList = (team) => team.map((s, i) => `<div class="truncate bg-black bg-opacity-30 px-4 py-3 rounded shadow-md border border-white border-opacity-10">${s.name}</div>`).join('');
    document.getElementById('tugBlueList').innerHTML = renderList(teamBlue);
    document.getElementById('tugRedList').innerHTML = renderList(teamRed);
    
    document.getElementById('tugSetupScreen').classList.add('hidden');
    document.getElementById('tugSetupScreen').classList.remove('flex');
    document.getElementById('tugPlayScreen').classList.remove('hidden');
    document.getElementById('tugPlayScreen').classList.add('flex');
    
    // Initial flag pos
    document.getElementById('tugFlag').style.left = `${tugFlagPosition}%`;
    
    tugInterval = setInterval(() => {
        tugRemainingTime--;
        updateTugUI();
        if(tugRemainingTime <= 0) {
            checkTugWin(true); // time's up
        }
    }, 1000);
}

function updateTugUI() {
    const m = Math.floor(tugRemainingTime / 60);
    const s = tugRemainingTime % 60;
    document.getElementById('tugTimer').innerText = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}

function clearTugStudent() {
    currentTugStudent = null;
    
    document.getElementById('tugStudentName').innerText = 'Sẵn sàng...';
    
    
    const wrapper = document.getElementById('tugStudentAvatarWrapper');
    wrapper.innerHTML = `<i class="fas fa-user-secret text-7xl text-gray-500"></i>`;
    wrapper.className = 'w-40 h-40 rounded-full mb-4 overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.2)] border-8 border-gray-500 flex items-center justify-center transition-all bg-gray-800';
    
    document.getElementById('tugPickBtn').classList.remove('hidden');
    document.getElementById('tugPickBtn').classList.add('flex');
    document.getElementById('tugActionBtns').classList.add('hidden');
    document.getElementById('tugActionBtns').classList.remove('flex');
}

function pickNextTugStudent() {
    if(uncalledTugStudents.length === 0) {
        uncalledTugStudents = [...teamBlue, ...teamRed].sort(() => Math.random() - 0.5);
    }
    
    const randomIndex = Math.floor(Math.random() * uncalledTugStudents.length);
    currentTugStudent = uncalledTugStudents[randomIndex];
    uncalledTugStudents.splice(randomIndex, 1);
    
    document.getElementById('tugPickBtn').classList.add('hidden');
    document.getElementById('tugPickBtn').classList.remove('flex');
    document.getElementById('tugActionBtns').classList.remove('hidden');
    document.getElementById('tugActionBtns').classList.add('flex');
    
    const nameEl = document.getElementById('tugStudentName');
    
    const wrapper = document.getElementById('tugStudentAvatarWrapper');
    
    nameEl.innerText = currentTugStudent.name;
    wrapper.innerHTML = `<img src="${avatarBaseUrl}${currentTugStudent.id}" class="w-full h-full object-cover">`;
    
    const teamEl = document.getElementById('tugStudentTeam');
    
    if(currentTugStudent.tugTeam === 'blue') {
        if(teamEl) {
            teamEl.innerText = 'Bên Xanh';
            teamEl.className = 'text-2xl font-black mb-6 uppercase tracking-widest h-8 drop-shadow-md text-blue-400';
        }
        
        
        wrapper.className = 'w-40 h-40 rounded-full mb-4 overflow-hidden shadow-[0_0_40px_rgba(59,130,246,0.6)] border-8 border-blue-400 flex items-center justify-center transition-all bg-blue-900 boss-student-reveal';
    } else {
        if(teamEl) {
            teamEl.innerText = 'Bên Đỏ';
            teamEl.className = 'text-2xl font-black mb-6 uppercase tracking-widest h-8 drop-shadow-md text-red-400';
        }
        
        
        wrapper.className = 'w-40 h-40 rounded-full mb-4 overflow-hidden shadow-[0_0_40px_rgba(239,68,68,0.6)] border-8 border-red-400 flex items-center justify-center transition-all bg-red-900 boss-student-reveal';
    }
    
    // Re-trigger animation
    nameEl.classList.remove('boss-student-reveal');
    void nameEl.offsetWidth;
    nameEl.classList.add('boss-student-reveal');
}

function tugAnswer(isCorrect) {
    if(!currentTugStudent || tugRemainingTime <= 0) return;
    
    const team = currentTugStudent.tugTeam; // 'blue' or 'red'
    
    if(isCorrect) {
        // Correct -> move towards their team by 10%
        if(team === 'blue') {
            tugFlagPosition -= 10;
        } else {
            tugFlagPosition += 10;
        }
    } else {
        // Wrong -> move away from their team by 5%
        if(team === 'blue') {
            tugFlagPosition += 5;
        } else {
            tugFlagPosition -= 5;
        }
    }
    
    // Clamp
    if(tugFlagPosition < 0) tugFlagPosition = 0;
    if(tugFlagPosition > 100) tugFlagPosition = 100;
    
    // Update UI
    const flag = document.getElementById('tugFlag');
    flag.style.left = `${tugFlagPosition}%`;
    
    // Shake effect
    flag.classList.remove('animate-bounce');
    void flag.offsetWidth;
    flag.classList.add('animate-bounce');
    setTimeout(()=>flag.classList.remove('animate-bounce'), 1000);
    
    checkTugWin(false);
    
    if(tugRemainingTime > 0 && tugFlagPosition > 0 && tugFlagPosition < 100) {
        clearTugStudent();
    }
}

function checkTugWin(isTimeUp) {
    if(tugFlagPosition <= 0) {
        tugEndGame('blue');
    } else if(tugFlagPosition >= 100) {
        tugEndGame('red');
    } else if (isTimeUp) {
        // Determine winner by position
        if(tugFlagPosition < 50) {
            tugEndGame('blue');
        } else if (tugFlagPosition > 50) {
            tugEndGame('red');
        } else {
            tugEndGame('draw');
        }
    }
}

function tugEndGame(winner) {
    clearInterval(tugInterval);
    
    document.getElementById('tugPlayScreen').classList.add('hidden');
    document.getElementById('tugPlayScreen').classList.remove('flex');
    
    const resScreen = document.getElementById('tugResultScreen');
    resScreen.classList.remove('hidden');
    resScreen.classList.add('flex');
    
    const title = document.getElementById('tugResultTitle');
    const msg = document.getElementById('tugResultMessage');
    
    if(winner === 'blue') {
        title.innerText = 'ĐỘI XANH CHIẾN THẮNG!';
        title.className = 'text-6xl font-black mb-4 uppercase tracking-wider text-center text-blue-400 text-glow';
        msg.innerText = 'Dây đã kéo về phe Xanh. Cả đội Xanh được cộng +2 điểm!';
        awardTugPoints(teamBlue, 2);
    } else if (winner === 'red') {
        title.innerText = 'ĐỘI ĐỎ CHIẾN THẮNG!';
        title.className = 'text-6xl font-black mb-4 uppercase tracking-wider text-center text-red-400 text-glow';
        msg.innerText = 'Dây đã kéo về phe Đỏ. Cả đội Đỏ được cộng +2 điểm!';
        awardTugPoints(teamRed, 2);
    } else {
        title.innerText = 'HÒA NHAU!';
        title.className = 'text-6xl font-black mb-4 uppercase tracking-wider text-center text-gray-400 text-glow';
        msg.innerText = 'Cờ vẫn nằm ngay chính giữa. Cả 2 đội rất ngang tài ngang sức!';
    }
}

function awardTugPoints(teamArr, points) {
    if(teamArr.length === 0) return;
    _isGroupAward = true;
    _groupTargetIds = teamArr.map(s => s.id);
    addPoints('custom', points, 'Chiến thắng Kéo Co');
}

function forceStopTug() {
    checkTugWin(true);
}
