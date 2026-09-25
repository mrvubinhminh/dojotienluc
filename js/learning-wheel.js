// learning-wheel.js
let lwQuestions = [];
let lwStudents = [];
let lwN = 0;
let lwCurrentSpin = 0;
let lwWheelAngle = 0;
let lwSpinning = false;
let lwSelectedQ = '';
let lwSelectedS = null;

// The requested audio file
const lwAudio = new Audio('https://files.catbox.moe/jp6q4j.mp3');
lwAudio.preload = 'auto';

const lwColors = ["#f87171", "#fb923c", "#fbbf24", "#34d399", "#38bdf8", "#818cf8", "#a78bfa", "#f472b6"];

function openLearningWheel() {
    document.getElementById('lwSetupModal').classList.remove('hidden');
    document.getElementById('lwSetupModal').classList.add('flex');
}

function closeLearningWheelSetup() {
    document.getElementById('lwSetupModal').classList.add('hidden');
    document.getElementById('lwSetupModal').classList.remove('flex');
}

function startLearningWheel() {
    const qText = document.getElementById('lwQuestionInput').value;
    lwQuestions = qText.split('\n').map(q => q.trim()).filter(q => q);
    lwN = parseInt(document.getElementById('lwSpinCount').value) || 0;
    
    if (lwQuestions.length === 0) {
        showToast('Vui lòng nhập ít nhất 1 câu hỏi!');
        return;
    }
    
    lwStudents = students.filter(s => s.classId === currentClassId);
    if (lwStudents.length === 0) {
        showToast('Lớp chưa có học sinh nào!');
        return;
    }
    
    if (lwN <= 0 || lwN > lwQuestions.length || lwN > lwStudents.length) {
        showToast('Số lượt quay không hợp lệ (phải <= số HS và số câu hỏi)');
        return;
    }
    
    lwCurrentSpin = 0;
    lwWheelAngle = 0;
    closeLearningWheelSetup();
    
    document.getElementById('lwGameModal').classList.remove('hidden');
    document.getElementById('lwGameModal').classList.add('flex');
    document.getElementById('lwGameModal').classList.add('md:flex-row'); // For split layout
    
    resetLwRightPanel();
    drawLwWheel();
    updateLwUI();
}

function closeLearningWheelGame() {
    lwAudio.pause();
    lwAudio.currentTime = 0;
    document.getElementById('lwGameModal').classList.add('hidden');
    document.getElementById('lwGameModal').classList.remove('flex');
    document.getElementById('lwGameModal').classList.remove('md:flex-row');
}

function resetLwRightPanel() {
    document.getElementById('lwLiveName').classList.remove('hidden');
    document.getElementById('lwLiveName').textContent = "SẴN SÀNG";
    document.getElementById('lwLiveName').className = "text-5xl md:text-8xl font-black text-gray-200 uppercase tracking-tight break-words w-full px-4 transition-colors duration-200";
    document.getElementById('lwResultView').classList.add('hidden');
    document.getElementById('lwResultView').classList.remove('flex');
}

function drawLwWheel(highlightIndex = -1) {
    const canvas = document.getElementById('lwWheelCanvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = cx;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (lwStudents.length === 0) return;
    
    const sliceAngle = (2 * Math.PI) / lwStudents.length;
    
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(lwWheelAngle);
    
    for (let i = 0; i < lwStudents.length; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, i * sliceAngle, (i + 1) * sliceAngle);
        ctx.closePath();
        ctx.fillStyle = lwColors[i % lwColors.length];
        if (highlightIndex === i) {
            ctx.fillStyle = "#ffffff";
        }
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();
        
        ctx.save();
        ctx.rotate(i * sliceAngle + sliceAngle / 2);
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillStyle = highlightIndex === i ? "#000" : "#fff";
        ctx.font = "bold 24px sans-serif";
        // prevent text overflowing out of radius
        let name = lwStudents[i].name;
        if(name.length > 20) name = name.substring(0, 20) + '...';
        ctx.fillText(name, radius - 20, 0);
        ctx.restore();
    }
    ctx.restore();
}

function spinLearningWheel() {
    if (lwSpinning) return;
    if (lwCurrentSpin >= lwN) {
        showToast('Đã hết lượt quay!');
        return;
    }
    if (lwQuestions.length === 0 || lwStudents.length === 0) {
        showToast('Hết câu hỏi hoặc học sinh!');
        return;
    }
    
    resetLwRightPanel();
    document.getElementById('lwLiveName').classList.add('text-teal-500');
    document.getElementById('lwLiveName').classList.remove('text-gray-200');

    lwSpinning = true;
    document.getElementById('lwSpinBtn').disabled = true;
    
    // Play Audio
    lwAudio.currentTime = 0;
    lwAudio.play().catch(e => console.log("Audio play blocked by browser:", e));
    
    // Fallback duration 6s, or actual audio duration if loaded
    let duration = 6000;
    if (!isNaN(lwAudio.duration) && lwAudio.duration > 0 && lwAudio.duration !== Infinity) {
        duration = lwAudio.duration * 1000;
    }

    const sIdx = Math.floor(Math.random() * lwStudents.length);
    const qIdx = Math.floor(Math.random() * lwQuestions.length);
    
    lwSelectedS = lwStudents[sIdx];
    lwSelectedQ = lwQuestions[qIdx];
    
    const sliceAngle = (2 * Math.PI) / lwStudents.length;
    // Top pointer is at -PI/2 relative to standard unit circle
    const targetAngle = (3 * Math.PI / 2) - (sIdx * sliceAngle + sliceAngle / 2);
    
    // Extra rotations based on duration (approx 1.5 spins per second)
    const extraSpins = Math.floor(duration / 1000) * 1.5;
    const totalSpin = targetAngle + (Math.PI * 2 * extraSpins);
    
    const start = performance.now();
    
    // Extremely smooth ease out to stop perfectly at the end of the song
    function easeOutQuart(x) {
        return 1 - Math.pow(1 - x, 4);
    }
    
    function animate(time) {
        let fraction = (time - start) / duration;
        if (fraction > 1) fraction = 1;
        
        lwWheelAngle = totalSpin * easeOutQuart(fraction);
        drawLwWheel();
        
        // Update Live Name Display based on what is currently under the pointer
        // The pointer is at -PI/2.
        let normalizedTopAngle = (-Math.PI / 2 - lwWheelAngle) % (2 * Math.PI);
        if (normalizedTopAngle < 0) normalizedTopAngle += 2 * Math.PI;
        
        let currentHoverIdx = Math.floor(normalizedTopAngle / sliceAngle) % lwStudents.length;
        if (lwStudents[currentHoverIdx]) {
            document.getElementById('lwLiveName').textContent = lwStudents[currentHoverIdx].name;
        }
        
        if (fraction < 1) {
            requestAnimationFrame(animate);
        } else {
            // Done
            lwWheelAngle = targetAngle; // normalize exactly
            drawLwWheel(sIdx);
            
            // Show result
            document.getElementById('lwLiveName').classList.add('hidden');
            document.getElementById('lwResultStudent').textContent = lwSelectedS.name;
            document.getElementById('lwResultQuestion').textContent = lwSelectedQ;
            document.getElementById('lwResultView').classList.remove('hidden');
            document.getElementById('lwResultView').classList.add('flex');
            
            // Remove from pool for next spins
            lwStudents.splice(sIdx, 1);
            lwQuestions.splice(qIdx, 1);
            lwCurrentSpin++;
            
            lwSpinning = false;
            document.getElementById('lwSpinBtn').disabled = false;
            updateLwUI();
            
            if (lwCurrentSpin >= lwN || lwStudents.length === 0 || lwQuestions.length === 0) {
                setTimeout(() => {
                    showToast('Đã hoàn thành tất cả các lượt quay!');
                }, 1000);
            }
        }
    }
    
    requestAnimationFrame(animate);
}

function closeLwResult() {
    // We don't have a separate modal anymore, so this is unused or we can just reset right panel
    resetLwRightPanel();
}

function updateLwUI() {
    document.getElementById('lwStatus').textContent = `Lượt: ${lwCurrentSpin} / ${lwN} | HS còn: ${lwStudents.length} | CH còn: ${lwQuestions.length}`;
}
