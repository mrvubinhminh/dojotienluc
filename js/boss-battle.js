// ============================================================
// GAME MENU & BOSS BATTLE
// ============================================================

function openGameMenu() {
    document.getElementById('gameMenuModal').classList.remove('hidden');
    document.getElementById('gameMenuModal').classList.add('flex');
}

function closeGameMenu() {
    document.getElementById('gameMenuModal').classList.add('hidden');
    document.getElementById('gameMenuModal').classList.remove('flex');
}

// --- BOSS BATTLE LOGIC ---
let bossMaxHp = 100;
let bossCurrentHp = 100;
let bossDuration = 600; // 10 mins default
let bossRemainingTime = 600;
let bossInterval = null;

let uncalledBossStudents = [];
let currentBossStudent = null;

function openBossBattle() {
    if(!currentClassId) return showToast('Vui lòng chọn lớp trước', false);
    const clsStudents = students.filter(s=>s.classId===currentClassId);
    if(clsStudents.length === 0) return showToast('Lớp không có học sinh', false);
    
    document.getElementById('bossBattleModal').classList.remove('hidden');
    document.getElementById('bossBattleModal').classList.add('flex');
    
    document.getElementById('bossSetupScreen').classList.remove('hidden');
    document.getElementById('bossPlayScreen').classList.add('hidden');
    document.getElementById('bossPlayScreen').classList.remove('flex');
    document.getElementById('bossResultScreen').classList.add('hidden');
    document.getElementById('bossResultScreen').classList.remove('flex');
    
    // Reset UI selections
    setBossHp(100);
    setBossTime(600);
}

function closeBossBattle() {
    document.getElementById('bossBattleModal').classList.add('hidden');
    document.getElementById('bossBattleModal').classList.remove('flex');
    if(bossInterval) clearInterval(bossInterval);
}

function setBossHp(hp) {
    bossMaxHp = hp;
    bossCurrentHp = hp;
    document.querySelectorAll('.boss-hp-btn').forEach(btn => {
        if(btn.innerText === hp.toString()) {
            btn.className = 'boss-hp-btn flex-1 py-1.5 rounded-lg bg-indigo-100 text-indigo-700 font-bold border-2 border-indigo-500 text-sm';
        } else {
            btn.className = 'boss-hp-btn flex-1 py-1.5 rounded-lg bg-gray-100 text-gray-600 font-bold border-2 border-transparent hover:bg-gray-200 text-sm';
        }
    });
}

function setBossTime(seconds) {
    bossDuration = seconds;
    document.querySelectorAll('.boss-time-btn').forEach(btn => {
        let textMatch = (seconds === 600) ? '10' : (seconds === 900) ? '15' : '20';
        if(btn.innerText.includes(textMatch)) {
            btn.className = 'boss-time-btn flex-1 py-1.5 rounded-lg bg-indigo-100 text-indigo-700 font-bold border-2 border-indigo-500 text-sm';
        } else {
            btn.className = 'boss-time-btn flex-1 py-1.5 rounded-lg bg-gray-100 text-gray-600 font-bold border-2 border-transparent hover:bg-gray-200 text-sm';
        }
    });
}

function startBossBattle() {
    bossRemainingTime = bossDuration;
    uncalledBossStudents = [];
    currentBossStudent = null;
    
    // Reset Boss Image state
    const bossImg = document.getElementById('bossImage');
    bossImg.classList.remove('boss-defeat');
    
    updateBossUI();
    clearBossStudent(); // Set waiting state
    
    document.getElementById('bossSetupScreen').classList.add('hidden');
    document.getElementById('bossPlayScreen').classList.remove('hidden');
    document.getElementById('bossPlayScreen').classList.add('flex');
    
    bossInterval = setInterval(() => {
        bossRemainingTime--;
        updateBossUI();
        if(bossRemainingTime <= 0) {
            bossLose();
        }
    }, 1000);
}

function updateBossUI() {
    // Timer
    const m = Math.floor(bossRemainingTime / 60);
    const s = bossRemainingTime % 60;
    document.getElementById('bossTimer').innerText = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    
    // HP Bar
    const hpPercent = Math.max(0, (bossCurrentHp / bossMaxHp) * 100);
    document.getElementById('bossHpBarFill').style.width = `${hpPercent}%`;
    document.getElementById('bossHpText').innerText = `${bossCurrentHp} / ${bossMaxHp} HP`;
}

function clearBossStudent() {
    currentBossStudent = null;
    
    // Reset UI to wait state
    document.getElementById('bossCurrentStudentName').innerText = 'Sẵn sàng...';
    document.getElementById('bossCurrentStudentAvatar').innerHTML = `<i class="fas fa-question text-5xl text-gray-300"></i>`;
    document.getElementById('bossCurrentStudentName').classList.remove('boss-student-reveal');
    document.getElementById('bossCurrentStudentAvatar').classList.remove('boss-student-reveal');
    
    // Show pick button, hide actions
    document.getElementById('bossPickBtn').classList.remove('hidden');
    document.getElementById('bossPickBtn').classList.add('flex');
    document.getElementById('bossActionBtns').classList.add('hidden');
    document.getElementById('bossActionBtns').classList.remove('flex');
}

function pickNextBossStudent() {
    const clsStudents = students.filter(s=>s.classId===currentClassId);
    if(clsStudents.length === 0) return;

    // Refill if empty
    if(uncalledBossStudents.length === 0) {
        uncalledBossStudents = [...clsStudents];
    }
    
    // Pick random
    const randomIndex = Math.floor(Math.random() * uncalledBossStudents.length);
    currentBossStudent = uncalledBossStudents[randomIndex];
    uncalledBossStudents.splice(randomIndex, 1);
    
    // Hide pick button, show actions
    document.getElementById('bossPickBtn').classList.add('hidden');
    document.getElementById('bossPickBtn').classList.remove('flex');
    document.getElementById('bossActionBtns').classList.remove('hidden');
    document.getElementById('bossActionBtns').classList.add('flex');
    
    // Setup UI with animation
    const nameEl = document.getElementById('bossCurrentStudentName');
    const avatarEl = document.getElementById('bossCurrentStudentAvatar');
    
    nameEl.classList.remove('boss-student-reveal');
    avatarEl.classList.remove('boss-student-reveal');
    
    // trigger reflow
    void nameEl.offsetWidth; 
    
    nameEl.innerText = currentBossStudent.name;
    avatarEl.innerHTML = `<img src="${avatarBaseUrl}${currentBossStudent.id}" class="w-full h-full object-cover">`;
    
    nameEl.classList.add('boss-student-reveal');
    avatarEl.classList.add('boss-student-reveal');
}

function bossCorrectAnswer() {
    if(bossCurrentHp <= 0 || bossRemainingTime <= 0 || !currentBossStudent) return;
    
    // Damage
    bossCurrentHp -= 10;
    if(bossCurrentHp < 0) bossCurrentHp = 0;
    
    // UI Effects
    document.getElementById('soundBossHit').currentTime = 0;
    document.getElementById('soundBossHit').play().catch(()=>{});
    
    const bossImgContainer = document.getElementById('bossImageContainer');
    bossImgContainer.classList.remove('boss-hit');
    void bossImgContainer.offsetWidth; // trigger reflow
    bossImgContainer.classList.add('boss-hit');
    
    const slash = document.getElementById('bossSlashEffect');
    slash.classList.remove('hidden');
    slash.classList.remove('slash-anim');
    void slash.offsetWidth;
    slash.classList.add('slash-anim');
    setTimeout(() => { slash.classList.add('hidden'); }, 300); // hide after animation
    
    updateBossUI();
    
    // Check win
    if(bossCurrentHp <= 0) {
        bossWin();
    } else {
        clearBossStudent(); // Switch to wait state
    }
}

function bossWrongAnswer() {
    if(bossCurrentHp <= 0 || bossRemainingTime <= 0 || !currentBossStudent) return;
    // Just move to wait state
    clearBossStudent();
}

function bossWin() {
    clearInterval(bossInterval);
    
    document.getElementById('bossImage').classList.add('boss-defeat');
    
    setTimeout(() => {
        document.getElementById('soundBossWin').currentTime = 0;
        document.getElementById('soundBossWin').play().catch(()=>{});
        
        document.getElementById('bossPlayScreen').classList.add('hidden');
        document.getElementById('bossPlayScreen').classList.remove('flex');
        
        document.getElementById('bossResultScreen').classList.remove('hidden');
        document.getElementById('bossResultScreen').classList.add('flex');
        
        document.getElementById('bossResultIcon').className = 'fas fa-trophy text-6xl drop-shadow-lg text-yellow-400';
        document.getElementById('bossResultTitle').innerText = 'CHIẾN THẮNG!';
        document.getElementById('bossResultTitle').className = 'text-4xl font-black mb-2 uppercase tracking-wider text-green-600';
        document.getElementById('bossResultMessage').innerText = 'Trùm đã bị tiêu diệt. Cả lớp được +2 điểm!';
        
        // Award Points to entire class!
        const clsStudents = students.filter(s=>s.classId===currentClassId);
        _isGroupAward = true;
        _groupTargetIds = clsStudents.map(s => s.id);
        addPoints('custom', 2, 'Tiêu diệt Boss');
        
    }, 1500); // wait for defeat anim
}

function bossLose() {
    clearInterval(bossInterval);
    
    document.getElementById('soundBossLose').currentTime = 0;
    document.getElementById('soundBossLose').play().catch(()=>{});
    
    document.getElementById('bossPlayScreen').classList.add('hidden');
    document.getElementById('bossPlayScreen').classList.remove('flex');
    
    document.getElementById('bossResultScreen').classList.remove('hidden');
    document.getElementById('bossResultScreen').classList.add('flex');
    
    document.getElementById('bossResultIcon').className = 'fas fa-skull text-6xl drop-shadow-lg text-gray-800';
    document.getElementById('bossResultTitle').innerText = 'THẤT BẠI';
    document.getElementById('bossResultTitle').className = 'text-4xl font-black mb-2 uppercase tracking-wider text-red-600';
    document.getElementById('bossResultMessage').innerText = 'Thời gian đã hết! Trùm vẫn sống sót.';
}

function forceStopBoss() {
    clearInterval(bossInterval);
    closeBossBattle();
}
