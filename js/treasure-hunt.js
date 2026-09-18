// ============================================================
// TREASURE HUNT
// ============================================================

const TREASURE_SCENARIOS = [
    {
        id: 'jungle', name: 'Rừng Nhiệt Đới', emoji: '🌴',
        desc: 'Vượt rừng tìm kho báu huyền thoại!',
        color: '#15803d',
        specials: [
            { frac: 0.12, type: 'forward', step: 3, icon: '🦜', label: 'Vẹt dẫn đường! Tiến 3 ô' },
            { frac: 0.22, type: 'bonus',   pts:  2, icon: '💎', label: 'Đá quý! +2 điểm' },
            { frac: 0.35, type: 'back',    step: 2, icon: '🐍', label: 'Rắn cản đường! Lùi 2 ô' },
            { frac: 0.50, type: 'forward', step: 4, icon: '🌺', label: 'Hoa chỉ lối! Tiến 4 ô' },
            { frac: 0.63, type: 'back',    step: 3, icon: '🪲', label: 'Bọ tấn công! Lùi 3 ô' },
            { frac: 0.78, type: 'bonus',   pts:  3, icon: '🏺', label: 'Bình cổ! +3 điểm' },
            { frac: 0.88, type: 'goto',    sq:   1, icon: '🌀', label: 'Xoáy nước! Mất lượt (Đứng yên tại chỗ)' },
        ]
    },
    {
        id: 'space', name: 'Vũ Trụ', emoji: '🚀',
        desc: 'Khám phá thiên hà tìm kho báu vũ trụ!',
        color: '#1e3a8a',
        specials: [
            { frac: 0.10, type: 'forward', step: 4, icon: '⭐', label: 'Ngôi sao chỉ đường! Tiến 4 ô' },
            { frac: 0.25, type: 'back',    step: 3, icon: '☄️', label: 'Thiên thạch! Lùi 3 ô' },
            { frac: 0.40, type: 'bonus',   pts:  2, icon: '🪐', label: 'Hành tinh! +2 điểm' },
            { frac: 0.55, type: 'forward', step: 3, icon: '🌌', label: 'Lỗ đen dương! Tiến 3 ô' },
            { frac: 0.65, type: 'back',    step: 4, icon: '🌑', label: 'Hố đen! Lùi 4 ô' },
            { frac: 0.80, type: 'bonus',   pts:  3, icon: '👾', label: 'Alien thân thiện! +3 điểm' },
            { frac: 0.90, type: 'goto',    sq:   1, icon: '🌀', label: 'Cổng dịch chuyển! Mất lượt (Đứng yên tại chỗ)' },
        ]
    },
    {
        id: 'castle', name: 'Lâu Đài Ma Thuật', emoji: '🏰',
        desc: 'Giải mã phép thuật để đến kho báu!',
        color: '#6b21a8',
        specials: [
            { frac: 0.15, type: 'forward', step: 3, icon: '🧙', label: 'Phù thủy giúp sức! Tiến 3 ô' },
            { frac: 0.28, type: 'bonus',   pts:  2, icon: '💍', label: 'Nhẫn ma thuật! +2 điểm' },
            { frac: 0.42, type: 'back',    step: 3, icon: '👻', label: 'Bóng ma! Lùi 3 ô' },
            { frac: 0.55, type: 'forward', step: 5, icon: '🪄', label: 'Đũa thần! Tiến 5 ô' },
            { frac: 0.68, type: 'back',    step: 2, icon: '🐉', label: 'Rồng lửa! Lùi 2 ô' },
            { frac: 0.82, type: 'bonus',   pts:  4, icon: '👑', label: 'Vương miện! +4 điểm' },
        ]
    },
    {
        id: 'ocean', name: 'Đại Dương Bí Ẩn', emoji: '🌊',
        desc: 'Lặn sâu tìm kho báu dưới đáy biển!',
        color: '#0e7490',
        specials: [
            { frac: 0.13, type: 'forward', step: 3, icon: '🐬', label: 'Cá heo dẫn đường! Tiến 3 ô' },
            { frac: 0.26, type: 'back',    step: 2, icon: '🦈', label: 'Cá mập! Lùi 2 ô' },
            { frac: 0.40, type: 'bonus',   pts:  2, icon: '🦞', label: 'Tôm hùm vàng! +2 điểm' },
            { frac: 0.53, type: 'forward', step: 4, icon: '🐙', label: 'Bạch tuộc ném! Tiến 4 ô' },
            { frac: 0.67, type: 'back',    step: 3, icon: '🌊', label: 'Sóng lớn! Lùi 3 ô' },
            { frac: 0.80, type: 'bonus',   pts:  3, icon: '🐚', label: 'Ốc thần! +3 điểm' },
            { frac: 0.91, type: 'goto',    sq:   1, icon: '🌀', label: 'Xoáy hải lưu! Mất lượt (Đứng yên tại chỗ)' },
        ]
    },
    {
        id: 'ice', name: 'Băng Sơn Huyền Thoại', emoji: '🏔️',
        desc: 'Vượt núi băng giá để chinh phục kho báu!',
        color: '#1d4ed8',
        specials: [
            { frac: 0.14, type: 'forward', step: 3, icon: '🦅', label: 'Đại bàng cõng! Tiến 3 ô' },
            { frac: 0.30, type: 'back',    step: 4, icon: '🌨️', label: 'Bão tuyết! Lùi 4 ô' },
            { frac: 0.44, type: 'bonus',   pts:  2, icon: '❄️', label: 'Tinh thể băng! +2 điểm' },
            { frac: 0.58, type: 'forward', step: 3, icon: '🏔️', label: 'Con đường tắt! Tiến 3 ô' },
            { frac: 0.72, type: 'back',    step: 2, icon: '🧊', label: 'Trượt băng! Lùi 2 ô' },
            { frac: 0.86, type: 'bonus',   pts:  3, icon: '🌟', label: 'Sao băng! +3 điểm' },
        ]
    },
    {
        id: 'dragon', name: 'Hang Rồng', emoji: '🐲',
        desc: 'Thâm nhập hang rồng cướp lấy kho báu!',
        color: '#991b1b',
        specials: [
            { frac: 0.11, type: 'forward', step: 2, icon: '🗡️', label: 'Kiếm thần! Tiến 2 ô' },
            { frac: 0.24, type: 'bonus',   pts:  3, icon: '💰', label: 'Túi vàng! +3 điểm' },
            { frac: 0.37, type: 'back',    step: 4, icon: '🐲', label: 'Rồng phun lửa! Lùi 4 ô' },
            { frac: 0.52, type: 'forward', step: 4, icon: '🦁', label: 'Sư tử trợ giúp! Tiến 4 ô' },
            { frac: 0.66, type: 'back',    step: 3, icon: '💀', label: 'Bẫy hầm mộ! Lùi 3 ô' },
            { frac: 0.79, type: 'bonus',   pts:  4, icon: '🔮', label: 'Bình tiên! +4 điểm' },
            { frac: 0.90, type: 'goto',    sq:   1, icon: '🌀', label: 'Bẫy dịch chuyển! Mất lượt (Đứng yên tại chỗ)' },
        ]
    }
,
{
        id: 'pirate', name: 'Đảo Hải Tặc', emoji: '🏴‍☠️',
        desc: 'Vượt qua hải tặc, đạn pháo để cướp kho báu râu đen!',
        color: '#b45309',
        specials: [
            { frac: 0.12, type: 'forward', step: 3, icon: '🦜', label: 'Vẹt chỉ điểm! Tiến 3 ô' },
            { frac: 0.28, type: 'bonus',   pts:  2, icon: '🪙', label: 'Đồng tiền vàng! +2 điểm' },
            { frac: 0.39, type: 'back',    step: 2, icon: '💣', label: 'Đạn pháo nổ! Lùi 2 ô' },
            { frac: 0.55, type: 'forward', step: 4, icon: '⛵', label: 'Thuận buồm! Tiến 4 ô' },
            { frac: 0.68, type: 'back',    step: 3, icon: '⚓', label: 'Rơi mỏ neo! Lùi 3 ô' },
            { frac: 0.81, type: 'bonus',   pts:  3, icon: '🗡️', label: 'Kiếm xịn! +3 điểm' },
            { frac: 0.92, type: 'goto',    sq:   1, icon: '🌀', label: 'Bão lốc xoáy! Mất lượt (Đứng yên tại chỗ)' },
        ]
    },
    {
        id: 'desert', name: 'Sa Mạc Tử Thần', emoji: '🏜️',
        desc: 'Sống sót trong cái nóng thiêu đốt để tìm ốc đảo vàng!',
        color: '#b45309',
        specials: [
            { frac: 0.15, type: 'forward', step: 3, icon: '🐪', label: 'Lạc đà giúp sức! Tiến 3 ô' },
            { frac: 0.25, type: 'back',    step: 2, icon: '🦂', label: 'Bò cạp độc! Lùi 2 ô' },
            { frac: 0.42, type: 'bonus',   pts:  2, icon: '🏺', label: 'Bình cổ! +2 điểm' },
            { frac: 0.52, type: 'forward', step: 4, icon: '🌴', label: 'Ốc đảo ma thuật! Tiến 4 ô' },
            { frac: 0.65, type: 'back',    step: 3, icon: '🌪️', label: 'Bão cát mù mịt! Lùi 3 ô' },
            { frac: 0.78, type: 'bonus',   pts:  3, icon: '💎', label: 'Kim cương thô! +3 điểm' },
            { frac: 0.90, type: 'goto',    sq:   1, icon: '🕳️', label: 'Cát lún! Mất lượt (Đứng yên tại chỗ)' },
        ]
    },
    {
        id: 'dino', name: 'Kỷ Jura', emoji: '🦖',
        desc: 'Chạy trốn khủng long, săn tìm trứng vàng cổ đại!',
        color: '#4d7c0f',
        specials: [
            { frac: 0.11, type: 'forward', step: 4, icon: '🦅', label: 'Cưỡi dực long! Tiến 4 ô' },
            { frac: 0.28, type: 'back',    step: 3, icon: '🌋', label: 'Núi lửa phun! Lùi 3 ô' },
            { frac: 0.45, type: 'bonus',   pts:  2, icon: '🦴', label: 'Hóa thạch quý! +2 điểm' },
            { frac: 0.58, type: 'forward', step: 3, icon: '🦕', label: 'Khủng long cổ dài! Tiến 3 ô' },
            { frac: 0.69, type: 'back',    step: 2, icon: '🦖', label: 'T-Rex rượt! Lùi 2 ô' },
            { frac: 0.83, type: 'bonus',   pts:  4, icon: '🥚', label: 'Trứng khủng long! +4 điểm' },
            { frac: 0.91, type: 'goto',    sq:   1, icon: '🌀', label: 'Vực sâu! Mất lượt (Đứng yên tại chỗ)' },
        ]
    }
];

const TH_TYPE_STYLE = {
    forward: { bg: '#15803d', border: '#4ade80', text: '↑', glow: '0 0 10px rgba(74,222,128,0.5)' },
    back:    { bg: '#991b1b', border: '#f87171', text: '↓', glow: '0 0 10px rgba(248,113,113,0.5)' },
    bonus:   { bg: '#854d0e', border: '#fbbf24', text: '★', glow: '0 0 10px rgba(251,191,36,0.5)' },
    goto:    { bg: '#312e81', border: '#a78bfa', text: '⤾', glow: '0 0 10px rgba(167,139,250,0.5)' },
};

let _thState = null;
let _thPickedScen = 0;
let _thPickedGrid = 5;

function openTreasureSetup() {
    _thPickedGrid = 5;
    _thPickedScen = 0;
    _thRenderSetup();
    const modal = document.getElementById('thSetupModal');
    const bg    = document.getElementById('thSetupBg');
    modal.classList.remove('hidden');
    bg.classList.remove('hidden');
    requestAnimationFrame(() => { modal.style.transform = 'translateY(0)'; });
}

function closeTreasureSetup() {
    const modal = document.getElementById('thSetupModal');
    modal.style.transform = 'translateY(100%)';
    setTimeout(() => {
        modal.classList.add('hidden');
        document.getElementById('thSetupBg').classList.add('hidden');
    }, 310);
}

function _thPickGrid(n) {
    _thPickedGrid = n;
    [5,6,7,8].forEach(x => {
        const btn = document.getElementById('thGrid'+x);
        if (!btn) return;
        if (x === n) {
            btn.style.cssText = 'background:linear-gradient(135deg,#f59e0b,#d97706);color:#1f2937;box-shadow:0 0 14px rgba(245,158,11,0.4)';
        } else {
            btn.style.cssText = 'background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.7)';
        }
    });
    _thUpdateSpecialPreview();
}

function _thPickScen(idx) {
    _thPickedScen = idx;
    _thRenderSetup();
}

function _thRenderSetup() {
    // Grid buttons
    [5,6,7,8].forEach(x => {
        const btn = document.getElementById('thGrid'+x);
        if (!btn) return;
        btn.style.cssText = x === _thPickedGrid
            ? 'background:linear-gradient(135deg,#f59e0b,#d97706);color:#1f2937;box-shadow:0 0 14px rgba(245,158,11,0.4)'
            : 'background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.7)';
    });
    // Scenario cards
    const scen = TREASURE_SCENARIOS;
    document.getElementById('thScenList').innerHTML = scen.map((s, i) => `
        <button onclick="_thPickScen(${i})" class="p-3 rounded-2xl text-left transition active:scale-95"
            style="${i === _thPickedScen
                ? `background:${s.color};border:2px solid rgba(255,255,255,0.35);box-shadow:0 0 18px ${s.color}88`
                : 'background:rgba(255,255,255,0.07);border:2px solid rgba(255,255,255,0.08)'}">
            <p class="text-xl mb-0.5">${s.emoji}</p>
            <p class="text-white font-black text-xs leading-tight">${s.name}</p>
            <p class="text-white/40 text-[10px] mt-0.5 leading-snug">${s.desc}</p>
        </button>`).join('');
    _thUpdateSpecialPreview();
}

function _thUpdateSpecialPreview() {
    const s = TREASURE_SCENARIOS[_thPickedScen];
    const total = _thPickedGrid * _thPickedGrid;
    const specials = _thBuildSpecials(s, total);
    const preview = document.getElementById('thSpecialPreview');
    if (!preview) return;
    const typeLabel = { forward: 'Tiến', back: 'Lùi', bonus: 'Điểm', goto: 'Đứng yên' };
    preview.innerHTML = specials.map(sp => {
        const st = TH_TYPE_STYLE[sp.type];
        return `<span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-white"
            style="background:${st.bg};border:1px solid ${st.border}40">
            ${sp.icon} Ô ${sp.sq} · ${typeLabel[sp.type]}${sp.step ? ' '+sp.step : (sp.pts ? ' +'+sp.pts : ' 1')}
        </span>`;
    }).join('');
}

function _thBuildSpecials(scenario, total) {
    return scenario.specials.map(sp => {
        const sq = Math.max(2, Math.min(total - 1, Math.round(sp.frac * total)));
        // Bonus squares → mystery gift box (teacher decides reward verbally)
        const giftOverride = sp.type === 'bonus'
            ? { icon: '🎁', label: '🎁 Hộp quà bí mật! Giáo viên quyết định phần thưởng' }
            : {};
        return { ...sp, ...giftOverride, sq };
    });
}


function showTreasureRules() {
    if (!_groupResult || !_groupResult.length) {
        alert('Cần tạo nhóm trước!'); return;
    }
    
    // Hide Setup Modal

    const rulesScreen = document.getElementById('thRulesScreen');
    if (rulesScreen) {
        rulesScreen.classList.add('hidden');
        rulesScreen.classList.remove('flex');
    }
    closeTreasureSetup();

    
    // Update Rules Screen content
    const scen = TREASURE_SCENARIOS[_thPickedScen];
    const rulesEmoji = document.getElementById('thRulesEmoji');
    const rulesTitle = document.getElementById('thRulesTitle');
    const rulesDesc = document.getElementById('thRulesDesc');
    
    if (rulesEmoji) rulesEmoji.textContent = scen.emoji;
    if (rulesTitle) {
        rulesTitle.textContent = `Luật Chơi: ${scen.name}`;
        rulesTitle.style.color = scen.color;
        rulesTitle.style.textShadow = `0 0 20px ${scen.color}`;
    }
    if (rulesDesc) rulesDesc.textContent = scen.desc;
    
    // Show Rules Screen
    const rulesScreen = document.getElementById('thRulesScreen');
    if (rulesScreen) {
        rulesScreen.classList.remove('hidden');
        rulesScreen.classList.add('flex', 'z-[999]'); // Ensure it's on top
    }
}

function startTreasureHunt() {
    if (!_groupResult || !_groupResult.length) {
        alert('Cần tạo nhóm trước!'); return;
    }
    const grid = _thPickedGrid;
    const total = grid * grid;
    const scen = TREASURE_SCENARIOS[_thPickedScen];
    const specials = _thBuildSpecials(scen, total);

    const customRule = (document.getElementById('thCustomRuleInput') || {}).value || '';

    _thState = {
        grid,
        total,
        scen,
        specials,
        customRule,
        positions:   _groupResult.map(() => 0),
        diceResults: _groupResult.map(() => null),
        bonusPts:    _groupResult.map(() => 0),
        correct:     _groupResult.map(() => false),
        rolling:     false,
        rolled:      false,
        round:       1,
        winner:      null,
        popupQueue:  [],
        roundBonus:  _groupResult.map(() => 0),
    };


    const rulesScreen = document.getElementById('thRulesScreen');
    if (rulesScreen) {
        rulesScreen.classList.add('hidden');
        rulesScreen.classList.remove('flex');
    }
    closeTreasureSetup();

    setTimeout(() => {
        document.getElementById('thTitle').textContent = `${scen.emoji} ${scen.name} · ${grid}×${grid}`;
        document.getElementById('thOverlay').classList.remove('hidden');
        document.getElementById('thOverlay').style.background = '#080808';
        _thRender();
    }, 350);
}

function closeTreasureHunt() {
    document.getElementById('thOverlay').classList.add('hidden');
    _thState = null;
}

function endTreasureHunt() {
    thShowFinalRanking();
}

function _thRender() {
    _thRenderBoard();
    _thRenderLegend();
    _thRenderGroupBar();
    _thRenderActions();
}

function _thRenderLegend() {
    if (!_thState) return;
    const panel = document.getElementById('thLegendPanel');
    if (!panel) return;
    const { scen, specials, customRule } = _thState;

    const TC = {
        forward: { color: '#4ade80', sym: '↑', label: 'Tiến ô' },
        back:    { color: '#f87171', sym: '↓', label: 'Lùi ô' },
        bonus:   { color: '#fbbf24', sym: '🎁', label: 'Hộp quà bí mật' },
        goto:    { color: '#a78bfa', sym: '⤾', label: 'Đứng yên' },
    };

    // Type summary rows — large text
    const types = [...new Set(specials.map(s => s.type))];
    const typeRows = types.map(t => {
        const tc = TC[t];
        return `<div style="display:flex;align-items:center;gap:8px;padding:7px 8px;border-radius:10px;background:${tc.color}18;border-left:3px solid ${tc.color}">
            <span style="color:${tc.color};font-size:24px;font-weight:900;line-height:1;flex-shrink:0">${tc.sym}</span>
            <span style="color:rgba(255,255,255,0.8);font-size:16px;font-weight:800;line-height:1.2">${tc.label}</span>
        </div>`;
    }).join('');

    // Divider + section title
    const divider = `<div style="border-top:1px solid rgba(255,255,255,0.1);margin:2px 0">
        <p style="color:rgba(255,255,255,0.35);font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.8px;padding:5px 2px 0">${scen.emoji} Ô đặc biệt</p>
    </div>`;

    // Each special square — large
    const squareRows = specials.map(sp => {
        const tc = TC[sp.type];
        const detail = sp.type === 'forward' ? `+${sp.step} ô`
                     : sp.type === 'back'    ? `-${sp.step} ô`
                     : sp.type === 'bonus'   ? `GV quy định`
                     : `Mất lượt`;
        return `<div style="display:flex;align-items:center;gap:8px;padding:7px 8px;border-radius:10px;background:rgba(255,255,255,0.05);border-left:3px solid ${tc.color}90">
            <span style="font-size:26px;line-height:1;flex-shrink:0">${sp.icon}</span>
            <div>
                <p style="color:rgba(255,255,255,0.5);font-size:13px;font-weight:800;line-height:1">Ô ${sp.sq}</p>
                <p style="color:${tc.color};font-size:17px;font-weight:900;line-height:1.2">${detail}</p>
            </div>
        </div>`;
    }).join('');

    // Custom rule block
    const customBlock = customRule.trim() ? `
        <div style="border-top:1px solid rgba(255,255,255,0.1);margin:2px 0">
            <p style="color:rgba(255,255,255,0.35);font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.8px;padding:5px 2px 0">📝 Luật thêm</p>
        </div>
        <div style="padding:8px;border-radius:10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12)">
            <p style="color:rgba(255,255,255,0.85);font-size:15px;font-weight:700;line-height:1.5;white-space:pre-wrap">${customRule.trim()}</p>
        </div>` : '';

    panel.innerHTML = typeRows + divider + squareRows + customBlock;
}

function _thRenderBoard() {
    if (!_thState) return;
    const { grid, total, positions, specials, winner } = _thState;
    const board = document.getElementById('thBoard');
    board.style.gridTemplateColumns = `repeat(${grid}, 1fr)`;

    // Build snake-pattern: row 0 = left→right, row 1 = right→left, etc.
    // Square numbering: bottom row first (row grid-1 = sq 1..grid, row 0 = last row)
    // sq = (grid - 1 - row)*grid + col_in_row + 1
    // For snake: even rows (from bottom) go left→right, odd go right→left
    const cells = [];
    for (let row = 0; row < grid; row++) {
        const fromBottom = grid - 1 - row;
        for (let col = 0; col < grid; col++) {
            const colInRow = (fromBottom % 2 === 0) ? col : (grid - 1 - col);
            const sq = fromBottom * grid + colInRow + 1;
            cells.push({ row, col, sq });
        }
    }

    const specialMap = {};
    specials.forEach(sp => { specialMap[sp.sq] = sp; });

    // Compute max cell size from actual wrapper size (fills screen)
    const wrap = document.getElementById('thBoardWrap');
    const availH = (wrap.clientHeight || window.innerHeight * 0.55) - 8;
    const availW = (wrap.clientWidth  || window.innerWidth) - 8;
    const SIZE = Math.max(32, Math.floor(Math.min(availH, availW) / grid) - 2);

    const numFS   = Math.max(9,  Math.round(SIZE * 0.28));   // square number
    const iconFS  = Math.max(12, Math.round(SIZE * 0.38));   // emoji icon
    const dotSize = Math.max(8,  Math.round(SIZE * 0.18));   // group token dot
    const radius  = Math.round(SIZE * 0.18);

    board.innerHTML = cells.map(({ sq }) => {
        const sp = specialMap[sq];
        const groupsHere = positions.reduce((acc, pos, gi) => {
            if (pos === sq) acc.push(gi);
            return acc;
        }, []);
        const isStart = sq === 1;
        const isEnd   = sq === total;

        // 80% transparent cells (opacity 0.2 on fill)
        let bgStyle;
        if (isEnd) {
            bgStyle = 'background:rgba(251,191,36,0.18);border:2px solid #fbbf24;box-shadow:0 0 14px rgba(251,191,36,0.5)';
        } else if (isStart) {
            bgStyle = 'background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.25)';
        } else if (sp) {
            const st = TH_TYPE_STYLE[sp.type];
            bgStyle = `background:${st.bg}30;border:1.5px solid ${st.border}90;box-shadow:${st.glow}`;
        } else {
            bgStyle = 'background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12)';
        }

        const tokens = groupsHere.map(gi => {
            const c = GROUP_COLORS[gi % GROUP_COLORS.length];
            return `<span style="display:inline-block;width:${dotSize}px;height:${dotSize}px;border-radius:50%;background:${c};border:2px solid white;margin:1px;box-shadow:0 0 6px ${c}cc"></span>`;
        }).join('');

        const label = isEnd ? '🏆' : (sp ? sp.icon : '');
        // Square number: always visible, large
        const numColor = sp ? 'rgba(255,255,255,0.95)' : (isEnd ? '#fbbf24' : 'rgba(255,255,255,0.75)');
        const numEl = `<span style="font-size:${numFS}px;color:${numColor};font-weight:900;line-height:1;letter-spacing:-0.5px">${sq}</span>`;
        const iconEl = label ? `<span style="font-size:${iconFS}px;line-height:1;margin-top:1px">${label}</span>` : '';

        return `<div style="${bgStyle};width:${SIZE}px;height:${SIZE}px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:${radius}px;cursor:default;position:relative;overflow:hidden;gap:1px">
            ${numEl}${iconEl}
            <div style="display:flex;flex-wrap:wrap;justify-content:center;max-width:100%;margin-top:1px">${tokens}</div>
        </div>`;
    }).join('');
}

function _thRenderGroupBar() {
    if (!_thState) return;
    const { positions, total, bonusPts, diceResults, correct } = _thState;
    const bar = document.getElementById('thGroupBar');
    if (!bar) return;

    // Header
    const header = `<p style="color:rgba(255,255,255,0.35);font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:1px;padding:2px 4px 4px;border-bottom:1px solid rgba(255,255,255,0.08)">🏁 Vị trí</p>`;

    const rows = _groupResult.map((members, gi) => {
        const col       = GROUP_COLORS[gi % GROUP_COLORS.length];
        const pos       = positions[gi];
        const dice      = diceResults[gi];
        const bonus     = bonusPts[gi];
        const isCorrect = correct[gi];

        // Progress-based position color
        const pct = total > 0 ? (pos / total) * 100 : 0;
        let posColor, posExtra;
        if (pct >= 75) {
            posColor = '#4ade80';
            posExtra = 'animation:thBlink 0.8s ease-in-out infinite';
        } else if (pct >= 25) {
            posColor = '#fbbf24';
            posExtra = '';
        } else {
            posColor = col;
            posExtra = '';
        }

        // Dice mini badge
        const diceStr = (dice !== null && isCorrect)
            ? `<span style="display:inline-block;min-width:22px;height:22px;border-radius:5px;background:${col};text-align:center;font-size:14px;font-weight:900;color:white;line-height:22px;margin-top:2px">${dice}</span>`
            : '';
        const bonusStr = bonus
            ? `<span style="color:#fbbf24;font-size:10px;font-weight:900">+${bonus}đ</span>`
            : '';

        return `<div style="display:flex;align-items:center;justify-content:space-between;padding:7px 6px;border-radius:10px;background:rgba(255,255,255,0.06);border-left:4px solid ${col}">
            <div>
                <p style="color:white;font-weight:900;font-size:16px;line-height:1">N${gi+1}</p>
                <div style="display:flex;gap:4px;align-items:center;margin-top:2px">${diceStr}${bonusStr}</div>
            </div>
            <p style="color:${posColor};font-weight:900;font-size:30px;line-height:1;letter-spacing:-1px;${posExtra}">${pos}</p>
        </div>`;
    }).join('');

    bar.innerHTML = header + rows;
}

function _thRenderActions() {
    if (!_thState) return;
    const { correct, rolling, rolled, round } = _thState;

    // Round badge + label
    const badge = document.getElementById('thRoundBadge');
    const label = document.getElementById('thRoundLabel');
    if (badge) badge.textContent = `Vòng ${round}`;
    if (label) label.textContent = rolled ? '— Chốt để sang vòng tiếp:' : '— Chọn nhóm trả lời đúng:';

    // Toggle sections
    const rollSec = document.getElementById('thRollSection');
    const finSec  = document.getElementById('thFinalizeSection');
    const finBtn  = document.getElementById('thFinalizeBtn');
    if (rolled) {
        if (rollSec) rollSec.classList.add('hidden');
        if (finSec)  finSec.classList.remove('hidden');
        if (finBtn)  finBtn.textContent = `✅ Chốt vòng ${round} — Sang vòng ${round + 1}`;
    } else {
        if (rollSec) rollSec.classList.remove('hidden');
        if (finSec)  finSec.classList.add('hidden');
    }

    // Correct toggle buttons (disabled while rolling or after rolled)
    document.getElementById('thCorrectBtns').innerHTML = _groupResult.map((members, gi) => {
        const col = GROUP_COLORS[gi % GROUP_COLORS.length];
        const isOn = correct[gi];
        const disabled = rolling || rolled;
        return `<button onclick="thToggleCorrect(${gi})"
            class="flex items-center gap-1.5 px-3 py-2 rounded-xl font-black text-xs active:scale-90 transition"
            style="${isOn
                ? `background:${col};color:white;box-shadow:0 0 12px ${col}88;border:1.5px solid white;opacity:${disabled?0.7:1}`
                : `background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.5);border:1.5px solid rgba(255,255,255,0.15);opacity:${disabled?0.45:1}`}">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${isOn?'white':col}"></span>
            N${gi+1} ${isOn ? '✓' : ''}
        </button>`;
    }).join('');

    // Roll button state
    const rollBtn = document.getElementById('thRollBtn');
    if (rollBtn) {
        const anyCorrect = correct.some(Boolean);
        rollBtn.disabled = rolling || !anyCorrect || rolled;
        rollBtn.style.opacity = (rolling || !anyCorrect || rolled) ? '0.45' : '1';
        rollBtn.style.cursor  = (rolling || !anyCorrect || rolled) ? 'not-allowed' : 'pointer';
    }
}

function thToggleCorrect(gi) {
    if (!_thState || _thState.rolling) return;
    _thState.correct[gi] = !_thState.correct[gi];
    _thState.diceResults[gi] = null;
    _thRenderActions();
}

function thRollDice() {
    if (!_thState || _thState.rolling) return;
    const anyCorrect = _thState.correct.some(Boolean);
    if (!anyCorrect) return;

    _thState.rolling = true;
    _thRenderActions();

    const correctIdxs = _thState.correct.map((c, gi) => c ? gi : -1).filter(x => x >= 0);

    // Show dice overlay immediately in rolling mode
    _thShowDiceOverlay(true);

    let ticks = 0;
    const interval = setInterval(() => {
        correctIdxs.forEach(gi => {
            _thState.diceResults[gi] = Math.ceil(Math.random() * 6);
        });
        _thRenderDiceList();
        _thRenderGroupBar();
        ticks++;
        if (ticks >= 14) {
            clearInterval(interval);
            correctIdxs.forEach(gi => {
                _thState.diceResults[gi] = Math.ceil(Math.random() * 6);
            });
            _thRenderDiceList();
            _thRenderGroupBar();
            setTimeout(() => _thMoveGroups(correctIdxs), 400);
        }
    }, 100);
}

function _thShowDiceOverlay(rolling) {
    const overlay = document.getElementById('thDiceOverlay');
    const title   = document.getElementById('thDiceTitle');
    const status  = document.getElementById('thDiceStatus');
    const footer  = document.getElementById('thDiceFooter');
    if (!overlay) return;
    if (title) title.textContent = `Vòng ${_thState.round} — Xúc sắc`;
    if (status) status.textContent = rolling ? '🎲 Đang tung...' : '✓ Xong';
    if (footer) footer.classList.add('hidden');
    overlay.classList.remove('hidden');
    _thRenderDiceList();
}

// Dice pip layout: positions as [x,y] percent within a 100x100 box
const _TH_PIPS = {
    1: [[50,50]],
    2: [[25,25],[75,75]],
    3: [[25,25],[50,50],[75,75]],
    4: [[25,25],[75,25],[25,75],[75,75]],
    5: [[25,25],[75,25],[50,50],[25,75],[75,75]],
    6: [[25,22],[75,22],[25,50],[75,50],[25,78],[75,78]],
};

function _thDiceSvg(n, col, size) {
    const pips = _TH_PIPS[n] || _TH_PIPS[1];
    const r = size * 0.095;  // pip radius
    const dots = pips.map(([x,y]) =>
        `<circle cx="${x/100*size}" cy="${y/100*size}" r="${r}" fill="white" opacity="0.95"/>`
    ).join('');
    // Rounded square background in group color with glow
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="${size}" height="${size}" rx="${size*0.18}" ry="${size*0.18}"
            fill="${col}" filter="url(#glow${n})"/>
        <defs>
            <filter id="glow${n}" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="${size*0.08}" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
        </defs>
        <!-- Inner shadow for depth -->
        <rect x="2" y="2" width="${size-4}" height="${size-4}" rx="${size*0.16}" ry="${size*0.16}"
            fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="1.5"/>
        ${dots}
    </svg>`;
}

function _thRenderDiceList() {
    if (!_thState) return;
    const { correct, diceResults, positions, total } = _thState;
    const list = document.getElementById('thDiceList');
    if (!list) return;

    const correctGroups = _groupResult.map((members, gi) => ({ members, gi })).filter(({gi}) => correct[gi]);
    if (!correctGroups.length) { list.innerHTML = ''; return; }

    const n = correctGroups.length;
    // Max 4 columns; fewer columns = bigger dice
    const cols = n === 1 ? 1 : n <= 4 ? 2 : n <= 9 ? 3 : 4;
    const diceSize = cols === 1 ? 120 : cols === 2 ? 96 : cols === 3 ? 78 : 62;
    const namePx   = cols === 1 ? 38  : cols === 2 ? 30  : cols === 3 ? 22  : 17;
    const scorePx  = cols === 1 ? 24  : cols === 2 ? 20  : cols === 3 ? 16  : 13;
    const dotPx    = cols === 1 ? 16  : cols === 2 ? 12  : cols === 3 ? 10  : 8;
    const padPx    = cols === 1 ? 18  : cols === 2 ? 14  : cols === 3 ? 10  : 8;

    list.style.display = 'grid';
    list.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    list.style.gap = cols <= 2 ? '12px' : '8px';
    list.style.padding = '4px 2px 8px';
    list.style.alignContent = 'start';

    list.innerHTML = correctGroups.map(({ members, gi }) => {
        const col     = GROUP_COLORS[gi % GROUP_COLORS.length];
        const dice    = diceResults[gi];
        const pos     = positions[gi];
        const newPos  = Math.min(pos, total);
        const diceVal = dice !== null ? dice : null;
        const svgStr  = diceVal ? _thDiceSvg(diceVal, col, diceSize) : '';
        const spinner = `<div style="width:${diceSize}px;height:${diceSize}px;border-radius:${Math.round(diceSize*0.18)}px;background:${col}22;border:2px dashed ${col}66;display:flex;align-items:center;justify-content:center">
            <span style="font-size:${Math.round(diceSize*0.38)}px;line-height:1;opacity:0.4">🎲</span></div>`;

        const scoreBlock = diceVal ? `
            <div style="width:100%;border-radius:10px;padding:${cols<=2?8:5}px 6px;background:${col}22;border:1.5px solid ${col}55;text-align:center">
                <p style="color:${col};font-size:${scorePx}px;font-weight:900;line-height:1.1">+${diceVal} ô</p>
                <p style="color:white;font-size:${Math.round(scorePx*1.3)}px;font-weight:900;line-height:1.2;letter-spacing:-0.5px">→ Ô <span style="color:${col}">${newPos}</span></p>
            </div>` : '';

        return `<div style="display:flex;flex-direction:column;align-items:center;gap:${cols<=2?8:6}px;padding:${padPx}px ${Math.round(padPx*0.7)}px;border-radius:${cols<=2?20:14}px;background:rgba(255,255,255,0.07);border:2px solid ${col}55;text-align:center">
            <div style="display:flex;align-items:center;gap:${cols<=2?7:5}px">
                <span style="display:inline-block;width:${dotPx}px;height:${dotPx}px;border-radius:50%;background:${col};border:2px solid white;box-shadow:0 0 ${dotPx}px ${col}cc;flex-shrink:0"></span>
                <span style="color:white;font-weight:900;font-size:${namePx}px;line-height:1">Nhóm ${gi+1}</span>
            </div>
            ${diceVal ? svgStr : spinner}
            ${scoreBlock}
        </div>`;
    }).join('');
}

function _thShowDiceResult() {
    const footer = document.getElementById('thDiceFooter');
    const status = document.getElementById('thDiceStatus');
    const btn    = document.getElementById('thDiceChot');
    if (status) status.textContent = '✓ Di chuyển xong';
    if (footer) footer.classList.remove('hidden');
    if (btn)    btn.textContent = `✅ Chốt vòng ${_thState.round} — Sang vòng ${_thState.round + 1}`;
    _thRenderDiceList();
}

function thCloseDiceOverlay() {
    document.getElementById('thDiceOverlay').classList.add('hidden');
    thNextRound();
}

function _thMoveGroups(idxs) {
    if (!_thState) return;
    const { positions, total, specials, diceResults, bonusPts } = _thState;
    const popups = [];

    idxs.forEach(gi => {
        const roll = diceResults[gi];
        let newPos = Math.min(positions[gi] + roll, total);
        positions[gi] = newPos;

        if (newPos >= total) {
            // Winner!
            _thState.winner = gi;
        } else {
            const sp = specials.find(s => s.sq === newPos);
            if (sp) popups.push({ gi, sp });
        }
    });

    _thRender();

    if (_thState.winner !== null) {
        setTimeout(() => _thShowWinner(_thState.winner), 500);
        return;
    }

    // Show popups in sequence
    _thState.popupQueue = [...popups];
    _thState.rolling = false;
    _thProcessPopupQueue();
}

function _thProcessPopupQueue() {
    if (!_thState || !_thState.popupQueue.length) {
        // All popups shown — show dice result overlay with Chốt button
        _thState.rolling = false;
        _thState.rolled  = true;
        _thShowDiceResult();  // shows overlay with final dice + Chốt button
        _thRenderActions();
        return;
    }
    const { gi, sp } = _thState.popupQueue.shift();
    _thTriggerSpecial(gi, sp);
}

function thNextRound() {
    if (!_thState) return;
    _thState.round++;
    _thState.rolled      = false;
    _thState.rolling     = false;
    _thState.correct     = _groupResult.map(() => false);
    _thState.diceResults = _groupResult.map(() => null);
    _thState.roundBonus  = _groupResult.map(() => 0);
    // Hide overlays for clean board view
    const diceOv = document.getElementById('thDiceOverlay');
    if (diceOv) diceOv.classList.add('hidden');
    _thRender();
}

function _thTriggerSpecial(gi, sp) {
    const { positions, total, bonusPts } = _thState;
    const col = GROUP_COLORS[gi % GROUP_COLORS.length];
    let moved = false;

    if (sp.type === 'forward') {
        positions[gi] = Math.min(positions[gi] + sp.step, total);
        moved = true;
    } else if (sp.type === 'back') {
        positions[gi] = Math.max(positions[gi] - sp.step, 1);
        moved = true;
    } else if (sp.type === 'bonus') {
        // Mystery gift box — teacher decides reward verbally, no auto pts
    } else if (sp.type === 'goto') {
        // Stand still, no point deduction
        positions[gi] = sp.sq; 
        moved = false; // Just show popup, no real movement needed
    }

    // Show popup
    document.getElementById('thPopupIcon').textContent   = sp.icon;
    document.getElementById('thPopupGroup').textContent  = `Nhóm ${gi+1}`;
    document.getElementById('thPopupGroup').style.color  = col;
    document.getElementById('thPopupLabel').textContent  = sp.label;
    document.getElementById('thSpecialPopup').classList.remove('hidden');

    _thRender();

    // Check winner after special move
    if (positions[gi] >= total && _thState.winner === null) {
        _thState.winner = gi;
    }
}

function thClosePopup() {
    document.getElementById('thSpecialPopup').classList.add('hidden');
    if (_thState && _thState.winner !== null) {
        setTimeout(() => _thShowWinner(_thState.winner), 300);
        return;
    }
    _thProcessPopupQueue();
}

function _thShowWinner(gi) {
    const members = _groupResult[gi];
    const col = GROUP_COLORS[gi % GROUP_COLORS.length];
    const memberNames = members.slice(0, 6).map(s => s.name).join(', ') + (members.length > 6 ? '...' : '');
    const bonus = _thState.bonusPts[gi];

    document.getElementById('thWinnerLabel').textContent   = `Nhóm ${gi + 1} 🎉`;
    document.getElementById('thWinnerLabel').style.color   = col;
    document.getElementById('thWinnerMembers').textContent = memberNames;
    document.getElementById('thBonusPtsInfo').textContent  = bonus ? `Điểm bonus thu thập: +${bonus}` : '';

    const awardBtn = document.getElementById('thAwardWinnerBtn');
    awardBtn.onclick = () => {
        document.getElementById('thWinnerScreen').classList.add('hidden');
        _thAwardGroup(gi);
    };

    document.getElementById('thWinnerScreen').classList.remove('hidden');
}

function thShowFinalRanking() {
    if (!_thState) return;
    const { positions, total, bonusPts } = _thState;
    document.getElementById('thWinnerScreen').classList.add('hidden');

    const ranked = _groupResult.map((members, gi) => ({gi, members, pos: positions[gi], bonus: bonusPts[gi]}))
        .sort((a, b) => b.pos - a.pos || b.bonus - a.bonus || a.gi - b.gi);

    const MEDALS = ['🥇','🥈','🥉'];
    let lastPos = null, rankDisplay = 0;

    document.getElementById('thFinalList').innerHTML = ranked.map((r, i) => {
        if (r.pos !== lastPos) { rankDisplay = i + 1; lastPos = r.pos; }
        const col = GROUP_COLORS[r.gi % GROUP_COLORS.length];
        const medal = MEDALS[rankDisplay - 1] || `#${rankDisplay}`;
        const memberSnippet = r.members.slice(0,4).map(s=>s.name).join(', ') + (r.members.length>4?'…':'');
        const pct = Math.round((r.pos / total) * 100);
        return `<div class="flex items-center gap-3 p-3.5 rounded-2xl" style="background:rgba(255,255,255,0.07)">
            <span class="text-3xl w-10 text-center shrink-0">${medal}</span>
            <div style="width:12px;height:12px;border-radius:50%;background:${col};border:2px solid white;box-shadow:0 0 8px ${col}88;shrink:0"></div>
            <div class="flex-1 overflow-hidden">
                <p class="text-white font-black">Nhóm ${r.gi+1}</p>
                <p class="text-white/40 text-xs truncate">${memberSnippet}</p>
            </div>
            <div class="text-right shrink-0">
                <p class="text-white font-black">Ô ${r.pos}/${total}</p>
                <p class="text-amber-300 text-xs font-bold">${pct}%${r.bonus ? ' · +'+r.bonus+'đ' : ''}</p>
            </div>
        </div>`;
    }).join('');

    document.getElementById('thFinalAwardBtns').innerHTML = ranked.map((r, i) => {
        const medal = MEDALS[i] || '';
        const rankColors = [
            'background:#fbbf24;color:#1f2937',
            'background:#9ca3af;color:#111',
            'background:#d97706;color:#fff',
            'background:rgba(255,255,255,0.15);color:#fff',
        ];
        return `<button onclick="_thAwardGroup(${r.gi})"
            class="flex-1 py-2.5 rounded-xl font-black text-sm active:scale-95 transition shadow"
            style="min-width:70px;${rankColors[i]||rankColors[3]}">
            ${medal} N${r.gi+1}
        </button>`;
    }).join('');

    document.getElementById('thFinalRanking').classList.remove('hidden');
}

function _thAwardGroup(gi) {
    const members = _groupResult[gi];
    if (!members || !members.length) return;
    document.getElementById('thOverlay').classList.add('hidden');
    document.getElementById('thFinalRanking').classList.add('hidden');
    document.getElementById('thWinnerScreen').classList.add('hidden');
    setTimeout(() => openGroupModal(members.map(s=>s.id), `Nhóm ${gi+1} · ${members.length} học sinh`), 200);
}

function thAwardAll() {
    const all = _groupResult.flat();
    document.getElementById('thOverlay').classList.add('hidden');
    document.getElementById('thFinalRanking').classList.add('hidden');
    setTimeout(() => openGroupModal(all.map(s=>s.id), `Tất cả ${_groupResult.length} nhóm · ${all.length} học sinh`), 200);
}

