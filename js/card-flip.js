// ============================================================
// CARD FLIP GAME LOGIC (2 MODES)
// ============================================================

let cardDeck = [];
let currentCardStudent = null;
let uncalledCardStudents = [];
let cardsFlipped = 0; // In this mode, we only allow 1 flip per student turn.

const goodDeckBase = [
    { type: 'point', value: 3, text: '+3' },
    { type: 'point', value: 1, text: '+1' },
    { type: 'point', value: 1, text: '+1' },
    { type: 'point', value: 1, text: '+1' },
    { type: 'point', value: 1, text: '+1' },
    { type: 'point', value: 1, text: '+1' },
    { type: 'gift', value: 0, text: 'Tràng Pháo Tay' },
    { type: 'gift', value: 0, text: 'Tràng Pháo Tay' },
    { type: 'gift', value: 0, text: '1 Bài Hát Cuối Giờ' },
    { type: 'gift', value: 0, text: '1 Bài Hát Cuối Giờ' },
    { type: 'gift', value: 0, text: 'Miễn Trả Bài 1 Lần' },
    { type: 'gift', value: 0, text: 'Miễn Trả Bài 1 Lần' }
];

const badDeckBase = [
    { type: 'point', value: -3, text: '-3' },
    { type: 'point', value: -1, text: '-1' },
    { type: 'point', value: -1, text: '-1' },
    { type: 'point', value: -1, text: '-1' },
    { type: 'point', value: -1, text: '-1' },
    { type: 'point', value: -1, text: '-1' },
    { type: 'penalty', value: 0, text: 'Hát 1 bài' },
    { type: 'penalty', value: 0, text: 'Hát 1 bài' },
    { type: 'penalty', value: 0, text: 'Khen 3 bạn' },
    { type: 'penalty', value: 0, text: 'Khen 3 bạn' },
    { type: 'penalty', value: 0, text: 'Làm mặt xấu 5s' },
    { type: 'penalty', value: 0, text: 'Làm mặt xấu 5s' }
];

function openCardFlip() {
    if(!currentClassId) return showToast('Vui lòng chọn lớp trước', false);
    const clsStudents = students.filter(s=>s.classId===currentClassId);
    if(clsStudents.length === 0) return showToast('Lớp không có học sinh', false);
    
    document.getElementById('cardFlipModal').classList.remove('hidden');
    document.getElementById('cardFlipModal').classList.add('flex');
    
    resetCardFlip();
}

function closeCardFlip() {
    document.getElementById('cardFlipModal').classList.add('hidden');
    document.getElementById('cardFlipModal').classList.remove('flex');
}

function resetCardFlip() {
    uncalledCardStudents = [];
    clearCardStudent();
    document.getElementById('cardsGrid').innerHTML = `
        <div class="col-span-4 row-span-3 flex items-center justify-center">
            <p class="text-white text-opacity-50 font-bold text-2xl uppercase tracking-widest text-center">Hãy Gọi Ngẫu Nhiên và Chấm Điểm<br>để hiện thẻ bài</p>
        </div>
    `;
}

function clearCardStudent() {
    currentCardStudent = null;
    cardsFlipped = 0; // reset flip count for the next student
    
    document.getElementById('cardStudentName').innerText = 'Sẵn sàng...';
    document.getElementById('cardStudentAvatar').innerHTML = `<i class="fas fa-user-secret text-6xl text-gray-300"></i>`;
    document.getElementById('cardStudentName').classList.remove('boss-student-reveal');
    document.getElementById('cardStudentAvatar').classList.remove('boss-student-reveal');
    
    document.getElementById('cardPickBtn').classList.remove('hidden');
    document.getElementById('cardPickBtn').classList.add('flex');
    document.getElementById('cardActionBtns').classList.add('hidden');
    document.getElementById('cardActionBtns').classList.remove('flex');
}

function pickNextCardStudent() {
    const clsStudents = students.filter(s=>s.classId===currentClassId);
    if(clsStudents.length === 0) return;

    if(uncalledCardStudents.length === 0) {
        uncalledCardStudents = [...clsStudents];
    }
    
    const randomIndex = Math.floor(Math.random() * uncalledCardStudents.length);
    currentCardStudent = uncalledCardStudents[randomIndex];
    uncalledCardStudents.splice(randomIndex, 1);
    
    document.getElementById('cardPickBtn').classList.add('hidden');
    document.getElementById('cardPickBtn').classList.remove('flex');
    
    // Hide action buttons briefly during animation, then show
    document.getElementById('cardActionBtns').classList.add('hidden');
    document.getElementById('cardActionBtns').classList.remove('flex');
    
    // Clear grid
    document.getElementById('cardsGrid').innerHTML = `
        <div class="col-span-4 row-span-3 flex items-center justify-center">
            <p class="text-white text-opacity-50 font-bold text-xl uppercase tracking-widest text-center animate-pulse">Đang chờ giáo viên chấm điểm...</p>
        </div>
    `;
    
    const nameEl = document.getElementById('cardStudentName');
    const avatarEl = document.getElementById('cardStudentAvatar');
    
    nameEl.classList.remove('boss-student-reveal');
    avatarEl.classList.remove('boss-student-reveal');
    
    void nameEl.offsetWidth; 
    
    nameEl.innerText = currentCardStudent.name;
    avatarEl.innerHTML = `<img src="${avatarBaseUrl}${currentCardStudent.id}" class="w-full h-full object-cover">`;
    
    nameEl.classList.add('boss-student-reveal');
    avatarEl.classList.add('boss-student-reveal');
    
    setTimeout(() => {
        document.getElementById('cardActionBtns').classList.remove('hidden');
        document.getElementById('cardActionBtns').classList.add('flex');
    }, 400);
}

function setCardMode(isCorrect) {
    if(!currentCardStudent) return;
    
    const baseDeck = isCorrect ? goodDeckBase : badDeckBase;
    cardDeck = [...baseDeck].sort(() => Math.random() - 0.5);
    
    // Hide evaluation buttons to prevent double clicking
    document.getElementById('cardActionBtns').classList.add('hidden');
    document.getElementById('cardActionBtns').classList.remove('flex');
    
    renderCards(isCorrect);
}

function renderCards(isCorrect) {
    const grid = document.getElementById('cardsGrid');
    const cardColor = isCorrect ? 'emerald' : 'rose';
    
    grid.innerHTML = cardDeck.map((card, index) => {
        let colorClass = '';
        let bgClass = 'bg-white';
        let displayHtml = '';
        
        if (card.type === 'point') {
            if (card.value > 0) {
                colorClass = card.value === 3 ? 'text-yellow-500' : 'text-green-500';
                bgClass = card.value === 3 ? 'bg-yellow-50' : 'bg-green-50';
            } else {
                colorClass = card.value === -3 ? 'text-purple-600' : 'text-red-500';
                bgClass = card.value === -3 ? 'bg-purple-50' : 'bg-red-50';
            }
            displayHtml = `
                <span class="text-4xl sm:text-6xl font-black ${colorClass} drop-shadow-sm mb-1">${card.text}</span>
                <span class="text-gray-500 font-bold text-sm sm:text-base uppercase tracking-widest">Điểm</span>
            `;
        } else {
            // Gift or Penalty
            colorClass = card.type === 'gift' ? 'text-pink-500' : 'text-slate-600';
            bgClass = card.type === 'gift' ? 'bg-pink-50' : 'bg-slate-100';
            let icon = card.type === 'gift' ? '<i class="fas fa-gift mb-2 text-3xl"></i>' : '<i class="fas fa-exclamation-triangle mb-2 text-3xl"></i>';
            displayHtml = `
                ${icon}
                <span class="text-sm sm:text-base md:text-lg font-black ${colorClass} drop-shadow-sm text-center leading-tight px-2">${card.text}</span>
            `;
        }

        return `
            <div id="card-${index}" class="flip-card perspective-1000 w-full h-full cursor-pointer card-entry" style="animation-delay: ${index * 0.05}s" onclick="handleCardClick(${index})">
                <div class="flip-card-inner relative w-full h-full transform-style-3d">
                    <!-- MẶT TRƯỚC (ÚP) -->
                    <div class="absolute inset-0 backface-hidden bg-gradient-to-br from-${cardColor}-500 to-${cardColor}-700 rounded-2xl border-[6px] border-${cardColor}-300 shadow-xl flex items-center justify-center relative overflow-hidden">
                        <div class="absolute inset-0 opacity-20" style="background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, #ffffff 10px, #ffffff 20px);"></div>
                        <i class="fas fa-question text-5xl sm:text-7xl text-white opacity-80 drop-shadow-md relative z-10"></i>
                    </div>
                    <!-- MẶT SAU (LẬT) -->
                    <div class="absolute inset-0 backface-hidden rotate-y-180 ${bgClass} rounded-2xl border-[6px] shadow-2xl flex flex-col items-center justify-center" style="border-color: currentColor; color: inherit;">
                        ${displayHtml}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function handleCardClick(index) {
    if(!currentCardStudent || cardsFlipped >= 1) return; // Only 1 flip per turn
    
    const cardEl = document.getElementById(`card-${index}`);
    if(cardEl.classList.contains('flipped')) return;
    
    cardEl.classList.add('flipped');
    cardEl.classList.remove('cursor-pointer');
    cardsFlipped++;
    
    const card = cardDeck[index];
    
    if(card.type === 'point' && card.value !== 0) {
        _isGroupAward = false;
        addPoints(currentCardStudent.id, card.value, 'Lật Thẻ Bí Ẩn');
    }
    
    // Switch back to waiting state automatically after a delay
    setTimeout(() => {
        resetCardFlip();
    }, 2500); // 2.5 seconds to read the reward
}
