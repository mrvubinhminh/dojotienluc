// learning-wheel.js
let lwQuestions = [];
let lwStudents = [];
let lwN = 0;
let lwCurrentSpin = 0;
let lwWheelAngle = 0;
let lwSpinning = false;
let lwSelectedQ = '';
let lwSelectedS = null;

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
    
    lwStudents = [...(window.students ? window.students.filter(s => s.classId === currentClassId) : [])];
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
    
    drawLwWheel();
    updateLwUI();
}

function closeLearningWheelGame() {
    document.getElementById('lwGameModal').classList.add('hidden');
    document.getElementById('lwGameModal').classList.remove('flex');
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
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();
        
        ctx.save();
        ctx.rotate(i * sliceAngle + sliceAngle / 2);
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillStyle = highlightIndex === i ? "#000" : "#fff";
        ctx.font = "bold 16px sans-serif";
        // prevent text overflowing out of radius
        let name = lwStudents[i].name;
        if(name.length > 15) name = name.substring(0, 15) + '...';
        ctx.fillText(name, radius - 15, 0);
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
    
    lwSpinning = true;
    document.getElementById('lwSpinBtn').disabled = true;
    
    const sIdx = Math.floor(Math.random() * lwStudents.length);
    const qIdx = Math.floor(Math.random() * lwQuestions.length);
    
    lwSelectedS = lwStudents[sIdx];
    lwSelectedQ = lwQuestions[qIdx];
    
    const sliceAngle = (2 * Math.PI) / lwStudents.length;
    // Top is at -PI/2
    const targetAngle = (3 * Math.PI / 2) - (sIdx * sliceAngle + sliceAngle / 2);
    
    // Add multiple spins
    const totalSpin = targetAngle + (Math.PI * 2 * 5); // 5 extra rotations
    
    let currentSpin = 0;
    const duration = 4000; // 4 seconds spin
    const start = performance.now();
    
    function easeOutCubic(x) {
        return 1 - Math.pow(1 - x, 3);
    }
    
    function animate(time) {
        let fraction = (time - start) / duration;
        if (fraction > 1) fraction = 1;
        
        lwWheelAngle = totalSpin * easeOutCubic(fraction);
        drawLwWheel();
        
        if (fraction < 1) {
            requestAnimationFrame(animate);
        } else {
            // Done
            lwWheelAngle = targetAngle; // normalize
            drawLwWheel(sIdx);
            
            setTimeout(() => {
                document.getElementById('lwResultStudent').textContent = lwSelectedS.name;
                document.getElementById('lwResultQuestion').textContent = lwSelectedQ;
                document.getElementById('lwResultModal').classList.remove('hidden');
                document.getElementById('lwResultModal').classList.add('flex');
                
                // Remove from pool
                lwStudents.splice(sIdx, 1);
                lwQuestions.splice(qIdx, 1);
                lwCurrentSpin++;
                
                lwSpinning = false;
                document.getElementById('lwSpinBtn').disabled = false;
                updateLwUI();
                drawLwWheel(); // redraw without the selected student
            }, 800);
        }
    }
    
    requestAnimationFrame(animate);
}

function closeLwResult() {
    document.getElementById('lwResultModal').classList.add('hidden');
    document.getElementById('lwResultModal').classList.remove('flex');
    if (lwCurrentSpin >= lwN || lwStudents.length === 0 || lwQuestions.length === 0) {
        setTimeout(() => {
            showToast('Đã hoàn thành tất cả các lượt quay!');
            closeLearningWheelGame();
        }, 500);
    }
}

function updateLwUI() {
    document.getElementById('lwStatus').textContent = `Lượt: ${lwCurrentSpin} / ${lwN} | HS còn: ${lwStudents.length} | CH còn: ${lwQuestions.length}`;
}
