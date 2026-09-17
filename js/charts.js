// ============================================================
// CHARTS
// ============================================================
let mainChartInstance = null;
let currentChartType  = 'trend';
let chartVisible      = false;

const CHART_COLORS = ['#33a3dc','#8bc34a','#ffc107','#f44336','#9c27b0','#ff9800','#00bcd4','#e91e63'];

function toggleCharts() {
    chartVisible = !chartVisible;
    const section = document.getElementById('chartSection');
    const btn     = document.getElementById('btnToggleChart');
    section.classList.toggle('hidden', !chartVisible);
    btn.className = chartVisible
        ? 'w-9 h-9 rounded-xl bg-dojo-blue text-white flex items-center justify-center transition shadow'
        : 'w-9 h-9 rounded-xl bg-blue-50 text-dojo-blue flex items-center justify-center hover:bg-blue-100 transition';
    if (chartVisible) renderCharts(currentChartType);
}

function showChartType(type) {
    currentChartType = type;
    document.getElementById('btnTrend').className      = type === 'trend'
        ? 'flex-1 py-2 text-sm font-bold rounded-xl bg-dojo-blue text-white shadow transition'
        : 'flex-1 py-2 text-sm font-bold rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition';
    document.getElementById('btnComparison').className = type === 'comparison'
        ? 'flex-1 py-2 text-sm font-bold rounded-xl bg-dojo-blue text-white shadow transition'
        : 'flex-1 py-2 text-sm font-bold rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition';
    renderCharts(type);
}

function renderCharts(type) {
    if (type === 'trend') renderTrendChart();
    else renderComparisonChart();
}

function renderTrendChart() {
    document.getElementById('chartLabel').innerText = 'Điểm tích lũy theo ngày (lớp hiện tại)';
    const classHistory = history.filter(h => h.classId === currentClassId);
    const canvas = document.getElementById('mainChart');
    const empty  = document.getElementById('chartEmpty');

    if (classHistory.length < 2) {
        canvas.style.display = 'none';
        empty.textContent = 'Cần ít nhất 2 lần chấm điểm để hiển thị xu hướng.';
        empty.classList.remove('hidden');
        if (mainChartInstance) { mainChartInstance.destroy(); mainChartInstance = null; }
        return;
    }
    canvas.style.display = 'block';
    empty.classList.add('hidden');

    // Group by date → cumulative sum
    const sorted = [...classHistory].sort((a,b) => new Date(a.timestamp)-new Date(b.timestamp));
    const grouped = {};
    sorted.forEach(h => {
        const d = new Date(h.timestamp).toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit'});
        grouped[d] = (grouped[d]||0) + h.points;
    });

    const labels  = Object.keys(grouped);
    const daily   = Object.values(grouped);
    const cumData = daily.map((v,i,a) => a.slice(0,i+1).reduce((s,x)=>s+x,0));

    if (mainChartInstance) mainChartInstance.destroy();
    mainChartInstance = new Chart(canvas, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Điểm tích lũy',
                data: cumData,
                borderColor: '#33a3dc',
                backgroundColor: 'rgba(51,163,220,0.12)',
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: '#33a3dc',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
            }, {
                label: 'Điểm trong ngày',
                data: daily,
                borderColor: '#8bc34a',
                backgroundColor: 'transparent',
                borderDash: [5,4],
                tension: 0.3,
                pointRadius: 3,
                pointBackgroundColor: '#8bc34a',
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { position:'bottom', labels:{ boxWidth:12, font:{size:11}, padding:12 } }
            },
            scales: {
                y: { beginAtZero:false, grid:{ color:'rgba(0,0,0,0.05)' }, ticks:{ font:{size:11} } },
                x: { grid:{ display:false }, ticks:{ font:{size:11} } }
            }
        }
    });
}

function renderComparisonChart() {
    document.getElementById('chartLabel').innerText = 'So sánh điểm học sinh qua các kỳ (top 6)';
    const classPeriods = periods.filter(p => p.classId === currentClassId)
                                .sort((a,b) => new Date(a.endDate)-new Date(b.endDate));
    const canvas = document.getElementById('mainChart');
    const empty  = document.getElementById('chartEmpty');

    if (!classPeriods.length) {
        canvas.style.display = 'none';
        empty.textContent = 'Chưa có kỳ học nào để so sánh. Hãy "Kết thúc kỳ" ít nhất 1 lần.';
        empty.classList.remove('hidden');
        if (mainChartInstance) { mainChartInstance.destroy(); mainChartInstance = null; }
        return;
    }
    canvas.style.display = 'block';
    empty.classList.add('hidden');

    // Combine last 4 periods + "Hiện tại"
    const recentPeriods = classPeriods.slice(-4);
    const periodLabels  = [...recentPeriods.map(p=>p.name), 'Hiện tại'];

    // Collect all student names
    const allNames = [...new Set([
        ...recentPeriods.flatMap(p => p.students.map(s=>s.name)),
        ...students.filter(s=>s.classId===currentClassId).map(s=>s.name)
    ])];

    // Rank students by sum across all periods → pick top 6
    const currentStudents = students.filter(s=>s.classId===currentClassId);
    const ranked = allNames.map(name => {
        const total = recentPeriods.reduce((sum,p) => {
            const s=p.students.find(st=>st.name===name); return sum+(s?s.points:0);
        }, 0) + (currentStudents.find(s=>s.name===name)?.points||0);
        return { name, total };
    }).sort((a,b)=>b.total-a.total).slice(0,6);

    const datasets = ranked.map(({name},i) => ({
        label: name,
        data: periodLabels.map((_, pi) => {
            if (pi < recentPeriods.length) {
                const s = recentPeriods[pi].students.find(st=>st.name===name);
                return s ? s.points : 0;
            }
            const s = currentStudents.find(st=>st.name===name);
            return s ? s.points : 0;
        }),
        backgroundColor: CHART_COLORS[i%CHART_COLORS.length]+'99',
        borderColor:     CHART_COLORS[i%CHART_COLORS.length],
        borderWidth: 2,
        borderRadius: 6,
    }));

    if (mainChartInstance) mainChartInstance.destroy();
    mainChartInstance = new Chart(canvas, {
        type: 'bar',
        data: { labels: periodLabels, datasets },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { position:'bottom', labels:{ boxWidth:12, font:{size:11}, padding:10 } }
            },
            scales: {
                y: { beginAtZero:true, grid:{ color:'rgba(0,0,0,0.05)' }, ticks:{ font:{size:11} } },
                x: { grid:{ display:false }, ticks:{ font:{size:11} } }
            }
        }
    });
}

