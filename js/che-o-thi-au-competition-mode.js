// ============================================================
// CHẾ ĐỘ THI ĐẤU (COMPETITION MODE)
// ============================================================
// _compState: { round, groupScores, roundAnswers, roundFinalized, history[],
//               starUsed[], starNextRound[] }
let _compState = null;

function openCompetition() {
    if (!_groupResult || !_groupResult.length) {
        showToast('Chia nhóm trước rồi hãy thi đấu!', false); return;
    }
    _compState = {
        round:          1,
        groupScores:    _groupResult.map(() => 0),
        roundAnswers:   _groupResult.map(() => null), // null | true | false
        roundFinalized: false,
        history:        [],  // [{ round, answers, gains, scores_after, starUsed[] }]
        starUsed:       _groupResult.map(() => false), // each team has 1 star total
        starNextRound:  _groupResult.map(() => false), // star activated for THIS round?
    };
    document.getElementById('compResultPanel').classList.add('hidden');
    document.getElementById('competitionOverlay').classList.remove('hidden');
    _renderComp();
}

function closeCompetition() {
    document.getElementById('competitionOverlay').classList.add('hidden');
}

function _renderComp() {
    const { round, groupScores, roundAnswers, roundFinalized, starNextRound } = _compState;
    const ng = _groupResult.length;

    // Round label + dots
    document.getElementById('compRoundLabel').textContent = `Vòng ${round}`;
    document.getElementById('btnFinalizeRound').textContent = round;
    const dotsEl = document.getElementById('compRoundDots');
    const start = Math.max(1, round - 9);
    dotsEl.innerHTML = Array.from({length: round - start + 1}, (_, i) => {
        const r2 = start + i;
        const done = r2 < round;
        return `<span class="inline-block w-2 h-2 rounded-full" style="background:${done?'#86efac':r2===round?'#fbbf24':'rgba(255,255,255,0.2)'}"></span>`;
    }).join('');

    // Score bar — show ⭐ halo when star active
    document.getElementById('compScoreBar').innerHTML = _groupResult.map((_, gi) => {
        const col  = GROUP_COLORS[gi % GROUP_COLORS.length];
        const star = starNextRound[gi];
        return `<div class="flex flex-col items-center gap-0.5 min-w-[54px]">
            <div class="relative w-11 h-11 rounded-xl flex items-center justify-center font-black text-white text-base shadow"
                style="background:${col.bg};${star?'outline:2px solid #fbbf24;outline-offset:2px':''}">
                N${gi+1}
                ${star ? '<span class="absolute -top-2 -right-2 text-base leading-none">⭐</span>' : ''}
            </div>
            <span class="text-white font-black text-sm">${groupScores[gi]}</span>
            <span class="text-white text-opacity-40 text-[9px] font-semibold leading-none">điểm</span>
        </div>`;
    }).join('');

    // Group grid
    const grid = document.getElementById('compGroupGrid');
    grid.style.gridTemplateColumns =
        ng <= 2 ? 'repeat(2,1fr)' :
        ng <= 4 ? 'repeat(2,1fr)' :
        ng <= 6 ? 'repeat(3,1fr)' : 'repeat(auto-fit,minmax(140px,1fr))';

    grid.innerHTML = _groupResult.map((members, gi) => {
        const col  = GROUP_COLORS[gi % GROUP_COLORS.length];
        const ans  = roundAnswers[gi];
        const star = starNextRound[gi];
        const borderStyle  = ans === true  ? 'border:3px solid #4ade80'
                           : ans === false ? 'border:3px solid #f87171'
                           : star          ? 'border:3px solid #fbbf24'
                           : 'border:3px solid transparent';
        const overlayColor = ans === true  ? 'rgba(74,222,128,0.15)'
                           : ans === false ? 'rgba(248,113,113,0.15)' : '';
        const badge = ans === true ? '✅' : ans === false ? '❌' : star ? '⭐' : '';

        return `<div class="rounded-2xl overflow-hidden transition-all duration-200 select-none"
            style="background:${col.bg};${borderStyle};${overlayColor?`box-shadow:inset 0 0 0 999px ${overlayColor}`:''}">
            <div class="flex items-center justify-between px-3 pt-2.5 pb-1" style="background:rgba(0,0,0,0.2)">
                <span class="text-white font-black text-base">Nhóm ${gi+1}</span>
                ${star ? '<span class="text-yellow-300 text-xs font-black">⭐ Ngôi sao</span>' : `<span class="text-white text-opacity-50 text-xs font-bold">${members.length} HS</span>`}
            </div>
            <div class="flex flex-col items-center py-3 gap-1">
                <span class="text-4xl min-h-[2.5rem] leading-none">${badge}</span>
                <span class="text-white font-black text-2xl">${groupScores[gi]}</span>
                ${star ? '<span class="text-yellow-300 text-[10px] font-black">Đúng +3 · Sai −3</span>'
                       : '<span class="text-white text-opacity-40 text-[10px] font-semibold">điểm</span>'}
            </div>
            ${!roundFinalized ? `
            <div class="flex gap-2 px-2 pb-3">
                <button onclick="setGroupAnswer(${gi},true)"
                    class="flex-1 py-2.5 rounded-xl font-black text-sm transition active:scale-90
                    ${ans===true?'bg-green-400 text-white shadow-lg':'bg-white bg-opacity-20 text-white'}">
                    ✓ Đúng
                </button>
                <button onclick="setGroupAnswer(${gi},false)"
                    class="flex-1 py-2.5 rounded-xl font-black text-sm transition active:scale-90
                    ${ans===false?'bg-red-400 text-white shadow-lg':'bg-white bg-opacity-20 text-white'}">
                    ✗ Sai
                </button>
            </div>` : '<div class="h-2"></div>'}
        </div>`;
    }).join('');

    // Finalize button
    const canFinalize = roundAnswers.some(a => a !== null) && !roundFinalized;
    const btnF = document.getElementById('btnCompFinalize');
    btnF.disabled = !canFinalize;
    btnF.style.opacity = canFinalize ? '1' : '0.35';
}

function setGroupAnswer(gi, correct) {
    if (_compState.roundFinalized) return;
    _compState.roundAnswers[gi] = _compState.roundAnswers[gi] === correct ? null : correct;
    _renderComp();
}

// ---- Ngôi sao hy vọng ----
function toggleStar(gi) {
    if (_compState.starUsed[gi]) return;
    _compState.starNextRound[gi] = !_compState.starNextRound[gi];
    _renderStarSection();
}

function _renderStarSection() {
    const { starUsed, starNextRound } = _compState;
    const el = document.getElementById('compStarSection');
    if (!el) return;
    const anyAvailable = starUsed.some(u => !u);
    if (!anyAvailable) { el.innerHTML = '<p class="text-white text-opacity-30 text-xs text-center py-2">Tất cả đội đã dùng ngôi sao</p>'; return; }

    el.innerHTML = `
        <div class="mt-3 pt-3" style="border-top:1px solid rgba(255,255,255,0.12)">
            <p class="text-yellow-300 text-xs font-black uppercase tracking-wider text-center">⭐ Ngôi sao hy vọng — vòng tiếp</p>
            <p class="text-white text-opacity-40 text-[10px] text-center mt-0.5 mb-2.5">Đúng +3 · Sai −3 &nbsp;|&nbsp; Mỗi đội dùng 1 lần</p>
            <div class="flex gap-2 flex-wrap justify-center">
                ${_groupResult.map((_, gi) => {
                    const used   = starUsed[gi];
                    const active = starNextRound[gi];
                    if (used) return `<span class="px-3 py-2 rounded-xl text-xs font-bold text-white" style="background:rgba(255,255,255,0.08);opacity:0.35">N${gi+1} ✓ Đã dùng</span>`;
                    return `<button onclick="toggleStar(${gi})"
                        class="px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-90"
                        style="${active
                            ? 'background:#fbbf24;color:#1f2937;box-shadow:0 0 16px rgba(251,191,36,0.55)'
                            : 'background:rgba(255,255,255,0.13);color:white'}">
                        ${active ? '⭐' : '☆'} Nhóm ${gi+1}
                    </button>`;
                }).join('')}
            </div>
        </div>`;
}

function finalizeRound() {
    if (_compState.roundFinalized) return;
    const { round, groupScores, roundAnswers, starNextRound } = _compState;
    _compState.roundFinalized = true;

    // Score with star multiplier: correct → +1 or +3; wrong + star → −3
    const gains = roundAnswers.map((ans, gi) => {
        const star = starNextRound[gi];
        if (ans === true)  return star ? 3 : 1;
        if (ans === false) return star ? -3 : 0;
        return 0;
    });
    gains.forEach((g, gi) => { groupScores[gi] += g; });

    // Mark stars as used if activated
    starNextRound.forEach((active, gi) => {
        if (active && roundAnswers[gi] !== null) _compState.starUsed[gi] = true;
    });

    _compState.history.push({
        round, answers: [...roundAnswers], gains: [...gains],
        scores_after: [...groupScores], starUsed: [..._compState.starUsed]
    });

    // Reset starNextRound for next round
    _compState.starNextRound = _groupResult.map(() => false);

    // Build result panel
    document.getElementById('compResultRoundNum').textContent = round;
    const ranked = _groupResult.map((m, gi) => ({gi, ans:roundAnswers[gi], gain:gains[gi], score:groupScores[gi]}))
        .sort((a,b) => b.score - a.score || a.gi - b.gi);

    const MEDALS = ['🥇','🥈','🥉'];
    let lastScore = null, rankDisplay = 0;
    document.getElementById('compResultList').innerHTML = ranked.map((r, i) => {
        if (r.score !== lastScore) { rankDisplay = i + 1; lastScore = r.score; }
        const medal    = MEDALS[rankDisplay-1] || `#${rankDisplay}`;
        const ansLabel = r.ans === true ? '✅ Đúng' : r.ans === false ? '❌ Sai' : '— Chưa chọn';
        const ansColor = r.ans === true ? '#4ade80' : r.ans === false ? '#f87171' : '#9ca3af';
        const gainStr  = r.gain > 0 ? `+${r.gain}` : `${r.gain}`;
        const gainColor= r.gain > 0 ? '#86efac' : r.gain < 0 ? '#fca5a5' : '#6b7280';
        const wasStar  = r.gain === 3 || r.gain === -3;
        return `<div class="flex items-center gap-3 p-3 rounded-2xl" style="background:rgba(255,255,255,0.07)">
            <span class="text-2xl w-9 text-center shrink-0">${medal}</span>
            <div class="flex-1 overflow-hidden">
                <p class="text-white font-black truncate">Nhóm ${r.gi+1}${wasStar?' <span style="font-size:0.8em">⭐</span>':''}</p>
                <p class="text-xs font-bold" style="color:${ansColor}">${ansLabel}</p>
            </div>
            <div class="text-right shrink-0">
                <p class="text-sm font-black" style="color:${gainColor}">${gainStr}</p>
                <p class="text-white font-black text-lg">${r.score}</p>
            </div>
        </div>`;
    }).join('');

    // Star selection for next round
    _renderStarSection();
    document.getElementById('compResultPanel').classList.remove('hidden');
}

function nextRound() {
    _compState.round++;
    _compState.roundAnswers = _groupResult.map(() => null);
    _compState.roundFinalized = false;
    document.getElementById('compResultPanel').classList.add('hidden');
    _renderComp();
}

function endCompetition() {
    document.getElementById('competitionOverlay').classList.add('hidden');
    _showCompRanking();
}

function _showCompRanking() {
    const { groupScores, history } = _compState;
    const totalRounds = history.length;

    // Stats summary
    document.getElementById('compStatsText').textContent =
        `${totalRounds} vòng đấu · ${_groupResult.length} nhóm`;

    // Build ranked list
    const ranked = _groupResult.map((members, gi) => ({gi, members, score:groupScores[gi]}))
        .sort((a,b) => b.score - a.score || a.gi - b.gi);

    const MEDALS = ['🥇','🥈','🥉'];
    const RANK_BGSCORE = ['#fbbf24','#9ca3af','#d97706'];
    let lastScore = null, rankDisplay = 0;

    document.getElementById('compRankingList').innerHTML = ranked.map((r, i) => {
        if (r.score !== lastScore) { rankDisplay = i + 1; lastScore = r.score; }
        const col = GROUP_COLORS[r.gi % GROUP_COLORS.length];
        const medal = MEDALS[rankDisplay-1] || `<span class="text-white text-opacity-60 font-black text-xl">#${rankDisplay}</span>`;
        const memberSnippet = r.members.slice(0,4).map(s=>s.name).join(', ') + (r.members.length>4?'...':'');
        // Per-round stats for this group
        const correctCount = history.filter(h => h.answers[r.gi] === true).length;
        const wrongCount   = history.filter(h => h.answers[r.gi] === false).length;
        const starUsedThis = _compState.starUsed[r.gi]; // used their star?
        const starRound    = history.find(h => Math.abs(h.gains[r.gi]) === 3);
        const starResult   = starRound ? (starRound.gains[r.gi] === 3 ? '⭐ +3' : '⭐ −3') : '';
        return `<div class="flex items-center gap-3 p-3.5 rounded-2xl" style="background:rgba(255,255,255,0.07);${rankDisplay<=3?`border:1px solid ${RANK_BGSCORE[rankDisplay-1]}40`:``}">
            <span class="text-3xl w-10 text-center shrink-0">${medal}</span>
            <div class="flex-1 overflow-hidden">
                <p class="text-white font-black">Nhóm ${r.gi+1}</p>
                <p class="text-white text-opacity-40 text-xs truncate">${memberSnippet}</p>
                <div class="flex gap-2 mt-1 flex-wrap">
                    <span class="text-green-400 text-[10px] font-bold">✓ ${correctCount}</span>
                    <span class="text-red-400 text-[10px] font-bold">✗ ${wrongCount}</span>
                    ${starResult ? `<span class="text-yellow-300 text-[10px] font-bold">${starResult}</span>` : ''}
                    ${!starUsedThis ? '<span class="text-white text-opacity-30 text-[10px] font-bold">⭐ chưa dùng</span>' : ''}
                </div>
            </div>
            <div class="text-right shrink-0">
                <p class="text-white font-black text-2xl">${r.score}</p>
                <p class="text-white text-opacity-40 text-[10px]">điểm</p>
            </div>
        </div>`;
    }).join('');

    // Award buttons per group
    document.getElementById('compAwardButtons').innerHTML = ranked.map((r, i) => {
        if (r.score !== ranked[i>0?i-1:0].score && i>0) rankDisplay = i + 1;
        const medal = MEDALS[i] || '';
        const rankColors = [
            'background:#fbbf24;color:#1f2937',
            'background:#9ca3af;color:#111',
            'background:#d97706;color:#fff',
            'background:rgba(255,255,255,0.15);color:#fff',
        ];
        return `<button onclick="_awardCompGroup(${r.gi})"
            class="flex-1 py-2.5 rounded-xl font-black text-sm active:scale-95 transition shadow"
            style="min-width:70px;${rankColors[i]||rankColors[3]}">
            ${medal} N${r.gi+1}
        </button>`;
    }).join('');

    document.getElementById('compRankingOverlay').classList.remove('hidden');
}

function closeCompRanking() {
    document.getElementById('compRankingOverlay').classList.add('hidden');
    document.getElementById('competitionOverlay').classList.add('hidden');
}

function _awardCompGroup(gi) {
    const members = _groupResult[gi];
    if (!members || !members.length) return;
    openGroupModal(members.map(s=>s.id), `Nhóm ${gi+1} · ${members.length} học sinh`);
}

function _awardAllCompGroups() {
    const all = _groupResult.flat();
    openGroupModal(all.map(s=>s.id), `Tất cả ${_groupResult.length} nhóm · ${all.length} học sinh`);
}

function toggleGroupProjector() {
    _groupProjector = !_groupProjector;
    const overlay = document.getElementById('groupResultOverlay');
    const btn = document.getElementById('btnGroupProjector');
    if (_groupProjector) {
        overlay.classList.add('projector-mode');
        btn.innerHTML = '<i class="fas fa-compress"></i> Thu nhỏ';
        // Request fullscreen
        if (overlay.requestFullscreen) overlay.requestFullscreen().catch(()=>{});
    } else {
        overlay.classList.remove('projector-mode');
        btn.innerHTML = '<i class="fas fa-expand"></i> Chiếu';
        if (document.exitFullscreen) document.exitFullscreen().catch(()=>{});
    }
    _renderGroupResult();
}

