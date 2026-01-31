console.log("★ main.js is loaded! (v1.3)");

// --- ★ GAME DATA CONFIG ★ ---
const GAME_DATA = {
    enemies: {
        1: [{ name: "プチモス", img: "assets/1-1.png", weak: 20 }, { name: "ラーバモス", img: "assets/1-2.png", weak: 19 }, { name: "進化の繭", img: "assets/1-3.png", weak: 18 }, { name: "グレート・モス", img: "assets/1-4.png", weak: 17 }, { name: "究極完全態・グレート・モス", img: "assets/1-5.png", weak: 20 }],
        2: [{ name: "トラコドン", img: "assets/2-1.png", weak: 19 }, { name: "ワイルド・ラプター", img: "assets/2-2.png", weak: 18 }, { name: "屍を貪る竜", img: "assets/2-3.png", weak: 17 }, { name: "二頭を持つキング・レックス", img: "assets/2-4.png", weak: 20 }, { name: "剣竜", img: "assets/2-5.png", weak: 19 }],
        3: [{ name: "デュナミス・ヴァルキリア", img: "assets/3-1.png", weak: 20 }, { name: "ハーピィ・レディ", img: "assets/3-2.png", weak: 19 }, { name: "ハーピィ・レディ・SB", img: "assets/3-3.png", weak: 18 }, { name: "ハーピィ・レディ三姉妹", img: "assets/3-4.png", weak: 17 }, { name: "ハーピィズペット竜", img: "assets/3-5.png", weak: 20 }],
        4: [{ name: "ダーク・ラビット", img: "assets/4-1.png", weak: 20 }, { name: "デビル・ボックス", img: "assets/4-2.png", weak: 19 }, { name: "トゥーン・デーモン", img: "assets/4-3.png", weak: 18 }, { name: "ブルーアイズ・トゥーン・ドラゴン", img: "assets/4-4.png", weak: 17 }, { name: "サクリファイス", img: "assets/4-5.png", weak: 20 }, { name: "サウザンド・アイズ・サクリファイス", img: "assets/4-6.png", weak: 20 }],
        5: [{ name: "真紅眼の黒竜", img: "assets/extra.png", weak: 20 }]
    },
    bg: {
        1: "assets/bg_stage1.png",
        2: "assets/bg_stage2.png",
        3: "assets/bg_stage3.png",
        4_1: "assets/bg_stage4_1.png",
        4_2: "assets/bg_stage4_2.png",
        5: "assets/bg_extra.png"
    }
};

// ★Phase 4: Player Object Update
let player = { 
    hp: 100, 
    maxHp: 100, 
    mp: 3, 
    maxMp: 10,
    items: { potion: 0, ether: 0, seed: 0 }, 
    state: { power: false, shield: false, weakLock: false },
    deck: [],
    hand: [],
    discard: [],
    deckLocked: false // ★New: デッキ不備時のフラグ
};

let enemy = { hp: 100, maxHp: 100, data: null, name: "", state: { charge: false, guard: false, guardType: null, guardTurn: 0, atkBuff: 0, isStunned: false } };
let stage=1; floor=1; totalScore=0; totalDarts=0; currentDarts=3;
let displayPlayerHP=100; displayEnemyHP=100;
let isProcessing=false; extraBossTurnCount=0; currentTurn=1;
let dropGuaranteed = false; weakHitCount = 0; let restrictInput = false;
let turnInputs = []; let currentInput = ""; let isJustFinish = false; let waitingForChest = false;
let cheatBuffer = ""; 

let stageStartTurn = 0;
let totalGameTurns = 0;
let clearedStagesLog = [];

// --- Core Functions ---
function resizeGame() {
    const scaler = document.getElementById('game-scaler');
    const winW = window.innerWidth; const winH = window.innerHeight;
    const baseW = 900; const baseH = 620;
    const scale = Math.min(winW / baseW, winH / baseH) * 0.95;
    scaler.style.transform = `scale(${scale})`;
}
window.addEventListener('resize', resizeGame); window.addEventListener('load', resizeGame); setTimeout(resizeGame, 100);

// --- LOCAL SAVE SYSTEM ---
let allSaveData = { "slot1": null, "slot2": null, "slot3": null, "lastPlayed": 1 };
const SAVE_KEY = "darts_quest_save";

function loadGameData() {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
        try {
            allSaveData = JSON.parse(saved);
        } catch(e) { console.error("Save Load Error", e); }
    }
    // Initialize empty slots
    if(!allSaveData.slot1) allSaveData.slot1 = null;
    if(!allSaveData.slot2) allSaveData.slot2 = null;
    if(!allSaveData.slot3) allSaveData.slot3 = null;
}
loadGameData();

let currentSlot = "slot1";
let savedData = { highScore: { stage: 1, floor: 1, avg: 0.0 }, history: [], clearedExtra: false, dp: 0, bestRanks: { 1: null, 2: null, 3: null, 4: null, 5: null }, unlockedStage4: false, deck: [], cards: {} };

const audioElements = [document.getElementById("bgm-title"), document.getElementById("bgm-battle"), document.getElementById("bgm-boss"), document.getElementById("bgm-extra"), document.getElementById("bgm-win"), document.getElementById("bgm-lose")];
let currentBgmId = "";

function initSlotScreen() {
    for(let i=1; i<=3; i++) {
        const key = "slot"+i; const data = allSaveData[key];
        const infoEl = document.getElementById("info-"+i);
        if(!data) { infoEl.innerHTML = "<div class='slot-empty'>NO DATA<br>- Start New Game -</div>"; }
        else {
            if(data.dp === undefined) data.dp = 0;
            if(data.bestRanks === undefined) data.bestRanks = { 1: null, 2: null, 3: null, 4: null, 5: null };
            if(data.unlockedStage4 === undefined) data.unlockedStage4 = false; 
            if(data.deck === undefined) data.deck = [];
            if(data.cards === undefined) data.cards = {};

            let stg = `STAGE ${data.highScore.stage} - ${data.highScore.floor}F`;
            if(data.highScore.stage === 5) stg = "EXTRA STAGE";
            else if(data.highScore.stage === 4) stg = "STAGE 4 - " + data.highScore.floor + "F";

            let badge = ""; if(data.clearedExtra) badge = "<br><span style='color:#f0f;font-weight:bold;'>★ EXTRA CLEARED</span>";
            infoEl.innerHTML = `<div>${stg}</div><div style='color:#ffdd00;'>Avg: ${data.highScore.avg.toFixed(1)} (Rt ${calculateRating(data.highScore.avg)})</div><div style='color:#aaa;font-size:12px;'>DP: ${data.dp}${badge}</div>`;
        }
    }
}
function selectSlot(n) {
    currentSlot = "slot"+n; const key = currentSlot;
    if(!allSaveData[key]) { allSaveData[key] = { highScore: { stage: 1, floor: 1, avg: 0.0 }, history: [], clearedExtra: false, dp: 0, bestRanks: { 1: null, 2: null, 3: null, 4: null, 5: null }, unlockedStage4: false, deck: [], cards: {} }; }
    
    savedData = allSaveData[key];
    if(savedData.dp === undefined) savedData.dp = 0;
    if(savedData.bestRanks === undefined) savedData.bestRanks = { 1: null, 2: null, 3: null, 4: null, 5: null };
    if(savedData.unlockedStage4 === undefined) savedData.unlockedStage4 = false;
    if(savedData.deck === undefined) savedData.deck = [];
    if(savedData.cards === undefined) savedData.cards = {};

    allSaveData.lastPlayed = n;
    updateTitleScore(); playSE("se-tap");
    document.getElementById("slot-screen").style.display = "none"; document.getElementById("title-screen").style.display = "flex";
    playBGM("bgm-title");
}
function backToSlots() { stopAllBGM(); document.getElementById("title-screen").style.display = "none"; document.getElementById("slot-screen").style.display = "flex"; initSlotScreen(); }
function saveToDrive() { 
    allSaveData[currentSlot] = savedData; 
    localStorage.setItem(SAVE_KEY, JSON.stringify(allSaveData));
}

function stopAllBGM() { audioElements.forEach(a => { a.pause(); a.currentTime=0; }); currentBgmId = ""; }
function playBGM(id) { 
    if(currentBgmId === id) return; 
    stopAllBGM(); 
    currentBgmId = id; 
    const audio = document.getElementById(id); 
    if(audio) { 
        audio.volume=0.3; 
        audio.play().catch(e=>{ console.log("Audio Play Blocked", e); }); 
    } 
}
function playSE(id) { const audio = document.getElementById(id); if(audio) { audio.currentTime = 0; audio.volume = 0.5; audio.play().catch(e=>{}); } }
function calculateRating(ppr) { if(ppr < 30) return 1; if(ppr < 40) return 2; if(ppr < 45) return 3; if(ppr < 50) return 4; if(ppr < 55) return 5; if(ppr < 60) return 6; if(ppr < 65) return 7; if(ppr < 70) return 8; if(ppr < 75) return 9; if(ppr < 80) return 10; if(ppr < 85) return 11; if(ppr < 90) return 12; if(ppr < 95) return 13; if(ppr < 100) return 14; if(ppr < 110) return 15; if(ppr < 120) return 16; if(ppr < 130) return 17; return 18; }

function updateTitleScore() {
    let stg = `STAGE ${savedData.highScore.stage}`; if (savedData.highScore.stage === 5) stg = "EXTRA";
    document.getElementById("hs-reach").innerText = `${stg} - ${savedData.highScore.floor}F`;
    document.getElementById("hs-avg").innerText = savedData.highScore.avg.toFixed(1);
    document.getElementById("hs-rt").innerText = "Rt " + calculateRating(savedData.highScore.avg);
    document.getElementById("dp-display").innerText = "DP: " + savedData.dp;

    updateStageButton(1, "btn-st1");
    updateStageButton(2, "btn-st2");
    updateStageButton(3, "btn-st3");
    updateStageButton(4, "btn-stage4");
    updateStageButton(5, "btn-extra");

    const isStage3Cleared = (savedData.bestRanks && savedData.bestRanks[3]);
    const canPlayStage4 = savedData.unlockedStage4 || isStage3Cleared || savedData.clearedExtra;
    
    if (canPlayStage4) document.getElementById("btn-stage4").style.display = "flex";
    else document.getElementById("btn-stage4").style.display = "none";

    if (savedData.clearedExtra) document.getElementById("btn-extra").style.display = "flex"; else document.getElementById("btn-extra").style.display = "none";
}

function updateStageButton(stgNum, btnId) {
    const btn = document.getElementById(btnId);
    const rank = savedData.bestRanks[stgNum];

    const oldBadge = btn.querySelector(".rank-badge-s");
    if(oldBadge) oldBadge.remove();

    btn.className = "stage-btn btn-default";
    if(btnId==="btn-stage4") btn.classList.add("stage4-btn");
    if(btnId==="btn-extra") btn.classList.add("extra-btn");

    if(rank) {
        btn.classList.remove("btn-default", "stage4-btn", "extra-btn");
        if(rank === "SSS") btn.classList.add("btn-prism");
        else if(rank === "S") btn.classList.add("btn-gold");
        else if(rank === "A") btn.classList.add("btn-silver");
        else btn.classList.add("btn-copper");
    }
}

function getRankColor(r) {
    if(r==="SSS") return "#00ffff"; if(r==="S") return "#ffd700"; if(r==="A") return "#ff5555"; return "#fff";
}

// --- DP & Rank Logic ---
function calculateStageRank(stg, turns) {
    if (stg === 5) { // Extra
        if (turns <= 15) return ["SSS", 1000]; if (turns <= 20) return ["S", 600];
        if (turns <= 35) return ["A", 300]; if (turns <= 50) return ["B", 100]; return ["C", 50];
    } else if (stg === 4) { // Stage 4
        if (turns <= 20) return ["SSS", 1000]; if (turns <= 28) return ["S", 600];
        if (turns <= 40) return ["A", 300]; if (turns <= 50) return ["B", 100]; return ["C", 50];
    } else { // Stage 1-3
        if (turns <= 12) return ["SSS", 1000]; if (turns <= 16) return ["S", 600];
        if (turns <= 22) return ["A", 300]; if (turns <= 30) return ["B", 100]; return ["C", 50];
    }
}

function finishSession(resultType, ppr) {
    let totalDP = Math.floor(totalScore * 0.2);
    let bonusDP = 0;
    clearedStagesLog.forEach(log => { bonusDP += log.dp; });
    totalDP += bonusDP;

    savedData.dp += totalDP;

    const curVal = stage * 100 + floor; const bestVal = savedData.highScore.stage * 100 + savedData.highScore.floor;
    let isNewRecord = false; if (curVal > bestVal) { savedData.highScore.stage = stage; savedData.highScore.floor = floor; isNewRecord = true; }
    if (ppr > savedData.highScore.avg) { savedData.highScore.avg = ppr; isNewRecord = true; }

    if (resultType === "EXTRA-WIN") savedData.clearedExtra = true;

    const now = new Date(); const dateStr = `${now.getMonth()+1}/${now.getDate()} ${now.getHours()}:${("0"+now.getMinutes()).slice(-2)}`;
    let stgName = (stage === 5) ? "EXTRA" : "S" + stage + "-" + floor + "F";

    let resultText = resultType;
    if (clearedStagesLog.length > 0) {
        const last = clearedStagesLog[clearedStagesLog.length-1];
        if (resultType === "RETURN") {
            resultText = `CLEAR(${last.rank})`;
            stgName = (last.stage===5) ? "EXTRA" : "STAGE " + last.stage;
        }
    }

    savedData.history.unshift({
        date: dateStr,
        stage: stage, floor: floor,
        stgName: stgName,
        result: resultText,
        dp: totalDP,
        ppr: ppr,
        rt: calculateRating(ppr)
    });
    if(savedData.history.length > 50) savedData.history.pop();

    updateTitleScore(); saveToDrive();
    return { isNewRecord: isNewRecord, gainedDP: totalDP };
}

function resetSaveData() { if(confirm("【警告】現在のスロットのデータを完全に消去しますか？")) { allSaveData[currentSlot] = null; selectSlot(currentSlot.replace("slot","")); saveToDrive(); } }
function exportSave() { navigator.clipboard.writeText(JSON.stringify(savedData)).then(()=>alert("現在のスロットのデータをコピーしました")); }
function importSave() { const json = prompt("セーブデータ(JSON)を貼り付けてください"); if(json) { try { const d = JSON.parse(json); if(d.highScore && d.history) { savedData = d; updateTitleScore(); saveToDrive(); alert("読み込み完了"); } } catch(e) { alert("データ形式エラー"); } } }

function showHistory() {
    const list = document.getElementById("history-list"); list.innerHTML = "";
    if(!savedData.history || savedData.history.length === 0) { list.innerHTML = "<div style='padding:20px; text-align:center;'>NO HISTORY</div>"; }
    else {
        savedData.history.forEach(h => {
            let resClass = "res-lose";
            let resStr = h.result || "LOSE";
            if (resStr.includes("WIN") || resStr.includes("CLEAR")) resClass = "res-win";
            if (resStr.includes("EXTRA")) resClass = "res-extra";

            let stgName = h.stgName ? h.stgName : (h.stage === 5 ? "EXTRA" : "S" + h.stage + "-" + h.floor + "F");
            let dpText = (h.dp !== undefined) ? `+${h.dp} DP` : "";
            let pprVal = h.ppr !== undefined ? h.ppr : (h.avg !== undefined ? h.avg : 0);

            list.innerHTML += `<div class='h-row'><div>${h.date}</div><div>${stgName}</div><div class='${resClass}'>${resStr}</div><div>${dpText}<br>Avg ${pprVal.toFixed(1)}</div></div>`;
        });
    }
    playSE("se-tap"); document.getElementById("history-modal").style.display = "flex";
}
function closeHistory() { playSE("se-tap"); document.getElementById("history-modal").style.display = "none"; }

// Constants & DOM
const elContainer=document.getElementById("game-container"); const elTitle=document.getElementById("title-screen"); const elGame=document.getElementById("game-screen");
const elChapter=document.getElementById("chapter-screen"); const elChapTitle=document.getElementById("chapter-title"); const elChapSub=document.getElementById("chapter-sub");
const elStage=document.getElementById("stage-display"); const elFloor=document.getElementById("floor-display"); const elTurn=document.getElementById("turn-display");
const elBossLabel=document.getElementById("boss-label"); const elEnemyImg=document.getElementById("enemy-img"); const elEnemyName=document.getElementById("enemy-name");
const elWeak=document.getElementById("weak-display");
const elEnemyHP=document.getElementById("enemy-hp"); const elEnemyMaxHP=document.getElementById("enemy-max-hp"); const elEnemyHPBar=document.getElementById("enemy-hp-bar");
const elEnemyHPValue=document.getElementById("enemy-hp-value");
const elPlayerHP=document.getElementById("player-hp"); const elPlayerMaxHP=document.getElementById("player-max-hp"); const elPlayerHPBar=document.getElementById("player-hp-bar"); const elPlayerMP=document.getElementById("player-mp"); const elPlayerMPBar=document.getElementById("player-mp-bar");

const elAvg=document.getElementById("avg-display"); const elRt=document.getElementById("rt-display"); const elLog=document.getElementById("battle-log");
const elEnemyPanel=document.getElementById("enemy-panel"); const elPlayerPanel=document.getElementById("player-panel"); const elOverlay=document.getElementById("flash-overlay");
const btnD1=document.getElementById("btn-d1"); const btnD2=document.getElementById("btn-d2"); const btnD3=document.getElementById("btn-d3");

const btnPotion=document.getElementById("btn-potion"); const btnEther=document.getElementById("btn-ether"); const btnSeed=document.getElementById("btn-seed");
const elModal=document.getElementById("game-modal"); const elModalBox=document.getElementById("modal-box-inner"); const elModalTitle=document.getElementById("modal-title"); const elModalText=document.getElementById("modal-text"); const elModalBtn=document.getElementById("modal-btn"); const elModalBtns=document.getElementById("modal-buttons");
const elEnemyBuff=document.getElementById("enemy-buff-badge"); const elEnemyGuard=document.getElementById("enemy-guard-badge"); const elEnemyDrop=document.getElementById("enemy-drop-badge");
const elPlayerBuff=document.getElementById("player-buff-badge"); const elPlayerGuard=document.getElementById("player-guard-badge");
const elCutin=document.getElementById("skill-cutin"); const elCutinText=document.getElementById("cutin-text-val");
const elCurtain=document.getElementById("black-curtain"); const elChestImg=document.getElementById("chest-img");
const slots = [document.getElementById("slot-1"), document.getElementById("slot-2"), document.getElementById("slot-3")];

initSlotScreen();

function updateScoreDisplay() {
    slots.forEach((s, i) => { s.className = "score-slot"; if (restrictInput && i > 0) { s.classList.add("locked"); s.innerText = "X"; return; } if (i < turnInputs.length) { s.innerText = turnInputs[i]; s.classList.add("filled"); } else if (i === turnInputs.length) { s.innerText = currentInput; s.classList.add("active"); } else { s.innerText = ""; } });
    const currentThrow = turnInputs.length + 1;
    btnD1.className = currentThrow === 1 ? "darts-btn active" : "darts-btn"; btnD2.className = currentThrow === 2 ? "darts-btn active" : "darts-btn"; btnD3.className = currentThrow === 3 ? "darts-btn active" : "darts-btn";
    if(restrictInput) { btnD2.className="darts-btn disabled"; btnD3.className="darts-btn disabled"; }
}

window.addEventListener("keydown", function(e) {
    if (elTitle.style.display !== "none") {
        if (e.key === "0" || e.key === "6" || e.key === "7") { cheatBuffer += e.key; } else { cheatBuffer = ""; }
        if (cheatBuffer.endsWith("0607")) {
            playSE("se-item"); 
            savedData.unlockedStage4 = true; 
            updateTitleScore(); 
            saveToDrive();
            cheatBuffer = "";
        }
    }

    if (elModal.style.display === "flex" && e.key === "Enter") {
        if (elModalBtns.children.length === 1) { e.preventDefault(); elModalBtns.children[0].click(); }
        return;
    }

    if (waitingForChest) { if (e.key === 'Enter') { e.preventDefault(); openChest(); } return; }
    if (elGame.style.display !== "none" && !isProcessing) {
        if (e.key >= '0' && e.key <= '9') { if (currentInput.length < 3) { playSE("se-tap"); currentInput += e.key; updateScoreDisplay(); } }
        if (e.key === 'Backspace') { if (currentInput.length > 0) { currentInput = currentInput.slice(0, -1); } else if (turnInputs.length > 0) { currentInput = "" + turnInputs.pop(); } updateScoreDisplay(); }
        if (e.key === 'Enter') handleEnter();
    }
});

function handleEnter() {
    if(isProcessing) return;
    if (currentInput !== "") {
        const val = parseInt(currentInput);
        if (!isNaN(val)) { 
            if (val < 0 || val > 60) { 
                alert("単発の最大値は 60 (T20) です"); 
                currentInput=""; 
                updateScoreDisplay(); 
                return; 
            } 
            playSE("se-tap"); turnInputs.push(val); currentInput = ""; if (restrictInput || turnInputs.length === 3) executeAttack(); else updateScoreDisplay(); 
        }
    } else { if (turnInputs.length > 0) executeAttack(); }
}

function calculatePlayerDamage(score, p, e) {
    let dmg = score;
    if (stage === 4 && floor === 4 && currentTurn % 3 === 0) { dmg = Math.max(0, dmg - 50); }
    if (e.state.guardType === 'cut') { dmg = Math.floor(dmg * 0.8); addLog("護封剣で20%軽減！", "system"); }
    if (p.state.power) { dmg = Math.floor(dmg * 1.5); p.state.power = false; }
    if (e.state.guard) { dmg = Math.floor(dmg / 2); e.state.guard = false; addLog("敵の防御で半減！", "system"); }
    return dmg;
}

function executeAttack() {
    isProcessing = true; let totalScoreInTurn = 0; let weakHitInThisTurn = 0;
    turnInputs.forEach(s => { totalScoreInTurn += s; if (player.state.weakLock || (s >= 51 && enemy.data.weak && (s % enemy.data.weak === 0))) weakHitInThisTurn++; });

    if (stage === 4 && floor === 6 && currentTurn % 2 === 0 && totalScoreInTurn < 80) {
        playSE("se-warning"); addLog(">> 結界に阻まれた！(80点未満無効)", "log-enemy"); totalScoreInTurn = 0;
    }

    playSE("se-attack"); totalGameTurns++;
    totalScore += totalScoreInTurn; totalDarts += turnInputs.length; 
    
    // ★Phase 4: Remove SP gain from darts
    // player.sp = Math.min(player.sp + totalScoreInTurn, 300);

    let dmg = calculatePlayerDamage(totalScoreInTurn, player, enemy);
    let remaining = enemy.hp - dmg; if (remaining === 0) isJustFinish = true; enemy.hp = Math.max(0, remaining);

    if (weakHitInThisTurn > 0) {
        dropGuaranteed = true; weakHitCount += weakHitInThisTurn; addLog(`★ WEAK HIT x${weakHitInThisTurn}!!`, "log-weak");
        if(!player.state.weakLock) { if(document.getElementById("se-weak")) playSE("se-weak"); elOverlay.className = "flash-purple"; setTimeout(()=>elOverlay.className="", 600); }
    }
    if(player.state.weakLock) { player.state.weakLock = false; addLog("Weak Lock 効果終了", "log-system"); }

    addLog(`攻撃！ ${dmg} ダメージ (${turnInputs.join('+')})`);
    triggerEffect(elEnemyPanel, dmg, false);
    animateValue(elEnemyHP, displayEnemyHP, enemy.hp, 500); displayEnemyHP=enemy.hp; updateInfo();
    if (restrictInput) { restrictInput = false; addLog("束縛が解けた！", "log-system"); }
    if (enemy.state.guardType === 'cut') { enemy.state.guardTurn--; if(enemy.state.guardTurn<=0) { enemy.state.guardType=null; addLog("光の護封剣が消滅した", "log-system"); } }
    turnInputs = []; currentInput = ""; updateScoreDisplay();
    if(enemy.hp<=0) setTimeout(winBattle, 1000); else setTimeout(enemyTurn, 1000);
}

function useItem(type) {
    if(isProcessing || waitingForChest) return;
    if(type === 'potion' && player.items.potion > 0) { player.items.potion--; playSE("se-heal"); const old=player.hp; player.hp=Math.min(player.hp+50, player.maxHp); addLog(`アイテム: 薬草使用`, "log-item"); animateValue(elPlayerHP, old, player.hp, 500); updateInfo(); }
    else if(type === 'ether' && player.items.ether > 0) { player.items.ether--; playSE("se-heal"); player.mp=Math.min(player.mp+3, player.maxMp); addLog(`アイテム: 聖水使用 (MP+3)`, "log-item"); updateInfo(); }
    else if(type === 'seed' && player.items.seed > 0) { player.items.seed--; playSE("se-buff"); player.maxHp+=10; const old=player.hp; player.hp=Math.min(player.hp+10, player.maxHp); addLog(`アイテム: 命の種使用`, "log-item"); animateValue(elPlayerHP, old, player.hp, 500); updateInfo(); }
}

function showDialog(title, text, type="normal", buttons=[{text:"OK", action:null}]) {
    elModalTitle.innerText = title; elModalText.innerHTML = text; elModalBox.className = "modal-box"; elModalTitle.style.color = "#f9a826";
    if (type === "clear") { elModalBox.classList.add("modal-clear"); elModalTitle.style.color = "#fff"; } else if (type === "warning") { elModalBox.classList.add("modal-warning"); elModalTitle.style.color = "#ff0000"; } else if (type === "item") { elModalBox.classList.add("modal-item"); elModalTitle.style.color = "#00ff00"; }

    elModalBtns.innerHTML = "";
    buttons.forEach(b => {
        const btn = document.createElement("button"); btn.className = "modal-btn"; btn.innerText = b.text;
        btn.onclick = function() { playSE("se-tap"); elModal.style.display = "none"; if(b.action) b.action(); };
        elModalBtns.appendChild(btn);
    });
    elModal.style.display = "flex";
}

// --- ★ Logic Fix: Allow Deckless Play (Ver 1.3) ★ ---
function initGameSession(startStage, continueMode=false) {
    // ★修正: デッキ不足でも出撃可能にするため、エラーチェックを削除
    
    if (!continueMode) {
        player.hp = 100; player.maxHp = 100; player.mp = 3; player.items = { potion: 0, ether: 0, seed: 0 };
        totalGameTurns = 0; totalScore = 0; totalDarts = 0;
        clearedStagesLog = [];
    }
    startTransition(startStage);
}

function startTransition(sel) {
    let t="STAGE "+sel; let s=""; let warning=false;
    if(sel===1) { t="旅立ちの森"; s="Forest of Beginnings"; }
    if(sel===2) { t="荒れ狂う荒野"; s="Raging Wasteland"; }
    if(sel===3) { t="誘惑の迷宮"; s="Labyrinth of Temptation"; }
    if(sel===4) { t="幻想の狂宴"; s="Toon Nightmare"; warning=true; }
    if(sel===5) { t="燃えたぎる火口"; s="Burning Crater"; warning=true; }

    elChapTitle.innerText = t; elChapSub.innerText = s;
    if(warning) { playSE("se-warning"); elChapter.classList.add("chapter-extra"); } else { playSE("se-tap"); elChapter.classList.remove("chapter-extra"); }
    elCurtain.classList.add("fade-in");
    setTimeout(() => { elTitle.style.display="none"; elChapter.style.display="flex"; elChapter.style.opacity=1; setupStage(sel); setTimeout(() => { elChapter.style.opacity=0; setTimeout(()=>{ elChapter.style.display="none"; elCurtain.classList.remove("fade-in"); checkOpeningSkill(); }, 1000); }, warning ? 4000 : 2500); }, 1000);
}

function checkOpeningSkill() {
    // This function can be used for stage-specific intros
}

// --- ★ Fix: Battle Setup with Deck Lock (Ver 1.3) ★ ---
function setupStage(sel) {
    stage=sel; floor=1; isProcessing=false; extraBossTurnCount=0; currentTurn=1;
    stageStartTurn = totalGameTurns; 

    elAvg.innerText="0.0"; elRt.innerText="(Rt -)"; elLog.innerHTML=""; elGame.style.display="block";
    
    spawnEnemy(); 

    player.state={power:false,shield:false,weakLock:false}; 
    player.mp = 3; 

    // ★修正: デッキ枚数チェック & ロック判定
    player.deckLocked = false; 
    
    if (!savedData.deck || savedData.deck.length < 12) {
        player.deckLocked = true; // ロックフラグON
        player.deck = [];
        player.hand = [];
        player.discard = [];
        addLog("⚠ デッキ不完全: カード機能封鎖", "log-system");
    } else {
        player.deck = shuffleArray([...savedData.deck]); 
        player.hand = [];
        player.discard = [];
        for(let i=0; i<3; i++) {
            drawCard();
        }
    }

    addLog(`STAGE ${stage} START!`, "system"); 
    resizeGame();
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function spawnEnemy() {
    enemy.state={charge:false,guard:false,guardType:null,guardTurn:0,atkBuff:0,isStunned:false}; player.state={power:false,shield:false,weakLock:false};
    currentTurn=1; turnInputs=[]; currentInput=""; restrictInput=false; updateScoreDisplay(); isJustFinish = false; waitingForChest = false; dropGuaranteed = false; weakHitCount=0;
    elContainer.className="container"; elEnemyPanel.className="left-panel"; elBossLabel.style.display="none"; elEnemyImg.style.display = "block"; elChestImg.style.display = "none";

    let bgKey = stage; if (stage === 4) bgKey = floor >= 5 ? "4_2" : "4_1";
    if (GAME_DATA.bg[bgKey]) elContainer.style.backgroundImage = `url('${GAME_DATA.bg[bgKey]}')`; else elContainer.style.backgroundImage = "none";

    let isBoss;
    if (stage === 5) {
        enemy.data = GAME_DATA.enemies[5][0]; isBoss=true; extraBossTurnCount=0; playBGM("bgm-extra"); elContainer.classList.add("extra-mode"); elEnemyPanel.classList.add("extra-border"); elBossLabel.innerText="☠️EXTRA BOSS"; elBossLabel.style.display="inline"; elStage.innerText="EXTRA STAGE"; enemy.maxHp=1200;
    }
    else if (stage === 4) {
        enemy.data = GAME_DATA.enemies[4][floor-1];
        isBoss = (floor >= 5); const base = 250; const bonus = (floor-1)*50; enemy.maxHp = base + bonus;
        if (floor === 5) { playBGM("bgm-boss"); elContainer.classList.add("boss-mode"); elBossLabel.innerText="⚠️BOSS"; elBossLabel.style.display="inline"; }
        else if (floor === 6) { playBGM("bgm-extra"); elContainer.classList.add("extra-mode"); elBossLabel.innerText="☠️FINAL BOSS"; elBossLabel.style.display="inline"; enemy.maxHp = 800; }
        else { playBGM("bgm-battle"); }
    }
    else {
        isBoss=(floor===5); if(isBoss) { playBGM("bgm-boss"); elContainer.classList.add("boss-mode"); elEnemyPanel.classList.add("boss-border"); elBossLabel.innerText="⚠️BOSS"; elBossLabel.style.display="inline"; } else { playBGM("bgm-battle"); }
        let list = GAME_DATA.enemies[stage]; enemy.data = list[(floor-1)%list.length]; const base=100+((stage-1)*50); const bonus=(floor-1)*30; enemy.maxHp=base+bonus+(isBoss?50:0);
    }
    enemy.name=enemy.data.name; elEnemyImg.src=enemy.data.img; enemy.hp=enemy.maxHp; displayEnemyHP=enemy.hp; updateInfo();
    if(stage===5) addLog(`>>> 伝説の黒竜、${enemy.name} が現れた！！！`, "log-skill"); else addLog(`=== STAGE ${stage} - ${floor}F ===`, "system");
    isProcessing=false;
}

// --- ★ Card Battle Functions ★ ---
function drawCard() {
    if (player.deck.length === 0) return;
    const cardId = player.deck.pop();
    player.hand.push(cardId);
    updateInfo();
}

function playHandCard(index) {
    if(isProcessing || waitingForChest) return;
    const cardId = player.hand[index];
    const card = CARD_DB.find(c => c.id === cardId);
    
    // Cost logic
    let cost = 1;
    if (card.rarity === "UR") cost = 3;
    else if (card.rarity === "SR") cost = 2;

    if (player.mp < cost) {
        addLog("MPが足りません！", "log-system");
        playSE("se-warning");
        return;
    }

    playSE("se-buff");
    player.mp -= cost;
    
    // Apply Effect
    applyCardEffect(card);

    // Discard & Draw
    player.hand.splice(index, 1);
    player.discard.push(cardId);
    drawCard();

    updateInfo();
}

function applyCardEffect(card) {
    let msg = `Card: [${card.name}] `;
    
    // Simple logic based on ID or Name
    if (card.id === 101) { // 死者蘇生
        player.hp = player.maxHp;
        msg += "HP完全回復！";
        playSE("se-heal");
    } else if (card.id === 201) { // サンダーボルト
        const dmg = 50;
        enemy.hp = Math.max(0, enemy.hp - dmg);
        msg += `敵に${dmg}ダメージ！`;
        playSE("se-boom");
        triggerEffect(elEnemyPanel, dmg, false);
    } else if (card.id === 202) { // 強欲な壺
        player.mp = Math.min(player.mp + 5, player.maxMp); // チャージ効果
        msg += "MPチャージ！";
    } else if (card.id === 301) { // 光の護封剣
        enemy.state.guardType='cut'; 
        enemy.state.guardTurn=3;
        msg += "3ターン防御！";
    } else if (card.id === 402) { // 治療の神
        player.hp = Math.min(player.hp + 50, player.maxHp);
        msg += "HP50回復";
        playSE("se-heal");
    } else if (card.id === 401 || card.id === 404) { // 火の粉, 大火事
        const dmg = (card.id===404) ? 80 : 50;
        enemy.hp = Math.max(0, enemy.hp - dmg);
        msg += `敵に${dmg}ダメージ！`;
        playSE("se-attack");
        triggerEffect(elEnemyPanel, dmg, false);
    } else if (card.id === 405) { // 突進
        player.state.power = true;
        msg += "攻撃力UP！";
    } else {
        msg += "(発動)";
    }
    
    addLog(msg, "log-skill");
    animateValue(elEnemyHP, displayEnemyHP, enemy.hp, 500); displayEnemyHP=enemy.hp;
    animateValue(elPlayerHP, displayPlayerHP, player.hp, 500); displayPlayerHP=player.hp;

    if (enemy.hp <= 0) setTimeout(winBattle, 800);
}

// --- ★ Fix: MP Dots & Deck Lock UI (Ver 1.3) ★ ---
function updateInfo() {
    if (!enemy.data) return;

    if(stage===5) { elStage.innerText="EXTRA"; elFloor.innerText="FINAL"; }
    else if(stage===4) { elStage.innerText="STAGE 4"; elFloor.innerText=`${floor}F`; }
    else { elStage.innerText=`STAGE ${stage}`; elFloor.innerText=`${floor}F`; }
    elTurn.innerText=`TURN ${currentTurn}`;

    const elName = document.getElementById("enemy-name"); elName.innerText = enemy.name;
    elName.style.fontSize = "18px"; elName.style.letterSpacing = "0px";
    if (enemy.name.length > 12) { elName.style.fontSize = "12px"; elName.style.letterSpacing = "-1px"; } else if (enemy.name.length > 9) { elName.style.fontSize = "15px"; }

    elEnemyHPValue.innerText = enemy.hp; elEnemyHPValue.className = "hp-big-text";
    if(enemy.hp <= 60) { elEnemyHPValue.classList.add("hp-danger"); } else if(enemy.hp <= 180) { elEnemyHPValue.classList.add("hp-warning"); }

    let weakText = ""; let weakTargetStr = "(Target: " + enemy.data.weak + "+)";
    if(player.state.weakLock) { weakText = "<span style='color:#f0f; animation:blink 0.5s infinite;'>★ WEAK LOCK ACTIVE ★</span>"; }
    else if(weakHitCount > 0) { let color = weakHitCount >= 3 ? "#ff0000" : (weakHitCount >= 2 ? "#ffa500" : "#ffff00"); let msg = weakHitCount >= 3 ? "ULTRA CHANCE!!!" : (weakHitCount >= 2 ? "SUPER CHANCE!!" : "DROP CHANCE UP!"); weakText = `<span style='color:${color}; text-shadow:0 0 5px ${color};'>✨ ${msg}</span> <span style='font-size:14px; color:#ccc; margin-left:5px;'>${weakTargetStr}</span>`; }
    else { weakText = "WEAK: " + enemy.data.weak + "+"; }
    elWeak.innerHTML = weakText;
    elEnemyHPBar.style.width=Math.max(0,(enemy.hp/enemy.maxHp)*100)+"%"; 
    
    // Player HP
    elPlayerHPBar.style.width=Math.max(0,(player.hp/player.maxHp)*100)+"%";
    document.getElementById("player-hp").innerText = player.hp; 
    document.getElementById("player-max-hp").innerText = player.maxHp;

    // ★修正: MP Dot Rendering
    const mpContainer = document.getElementById("player-mp-bar");
    mpContainer.innerHTML = ""; // Clear existing dots
    // Reset any width override from previous versions
    mpContainer.style.width = "100%"; 
    
    for(let i=0; i < player.maxMp; i++) {
        const dot = document.createElement("div");
        dot.className = "mp-dot";
        if (i < player.mp) {
            dot.classList.add("active"); // Light up dots based on current MP
        }
        mpContainer.appendChild(dot);
    }
    
    document.querySelector("#player-mp").innerText = player.mp;
    document.querySelector("#player-max-mp").innerText = player.maxMp;

    updateVisuals();
    
    // ★修正: Render Hand with Lock Check
    const handArea = document.getElementById("hand-area");
    handArea.innerHTML = "";
    
    if (player.deckLocked) {
        document.getElementById("battle-deck-count").innerText = "-";
        handArea.innerHTML = `<div class="hand-locked-msg">⚠️ NO DECK (DARTS ONLY)</div>`;
    } else {
        document.getElementById("battle-deck-count").innerText = player.deck.length;
        if (player.hand.length === 0) {
             handArea.innerHTML = `<div class="hand-card-empty">NO CARD</div>`;
        } else {
            player.hand.forEach((cardId, index) => {
                const card = CARD_DB.find(c => c.id === cardId);
                let cost = 1;
                if (card.rarity === "UR") cost = 3; else if (card.rarity === "SR") cost = 2;

                const div = document.createElement("div");
                div.className = "hand-card";
                if (player.mp < cost) div.classList.add("disabled");

                const imgPath = `assets/cards/${card.id}.png`;
                div.innerHTML = `
                    <div class="hand-cost">${cost}</div>
                    <div class="card-art" style="height:100%; border:none;">
                        <img src="${imgPath}" onerror="this.style.display='none'">
                    </div>
                    <div style="position:absolute; bottom:0; width:100%; font-size:8px; text-align:center; background:rgba(0,0,0,0.7); color:#fff;">${card.name}</div>
                `;
                div.onclick = () => playHandCard(index);
                handArea.appendChild(div);
            });
        }
    }

    let ppr = 0; if(totalDarts>0) ppr = ((totalScore/totalDarts)*3); elAvg.innerText=ppr.toFixed(1); elRt.innerText=`(Rt ${calculateRating(ppr)})`;
    btnPotion.innerHTML = `💊 薬草 x${player.items.potion}<span class="tooltip">HPを50回復 (使い切り)</span>`; btnPotion.className = player.items.potion > 0 ? "item-btn has-item" : "item-btn disabled";
    btnEther.innerHTML = `⚗️ マナ x${player.items.ether}<span class="tooltip">MPを3回復 (使い切り)</span>`; btnEther.className = player.items.ether > 0 ? "item-btn has-item" : "item-btn disabled";
    btnSeed.innerHTML = `🌱 種 x${player.items.seed}<span class="tooltip">最大HP+10上昇 (使い切り)</span>`; btnSeed.className = player.items.seed > 0 ? "item-btn has-item" : "item-btn disabled";
}

// --- ★ Smartphone Touch Handling ★ ---
function tapKey(key) {
    if (elGame.style.display === "none" || isProcessing) return;

    // 効果音
    if(key === 'ENT') {
        // エンターキー相当の処理
        handleEnter();
    } else if (key === 'BS') {
        // Backspace処理
        if (currentInput.length > 0) {
            currentInput = currentInput.slice(0, -1);
        } else if (turnInputs.length > 0) {
            currentInput = "" + turnInputs.pop();
        }
        playSE("se-tap");
        updateScoreDisplay();
    } else {
        // 数字キー処理
        if (currentInput.length < 3) {
            playSE("se-tap");
            currentInput += key;
            updateScoreDisplay();
        }
    }
}

// --- ★ CARD & SHOP SYSTEM (Ver 2.1) ★ ---

// 1. マスターカードデータ (Master Data)
const CARD_DB = [
    // UR (2%)
    { id: 101, name: "死者蘇生", rarity: "UR", type: "MAGIC", desc: "HPを完全回復する" },
    
    // SR (8%)
    { id: 201, name: "サンダー・ボルト", rarity: "SR", type: "MAGIC", desc: "敵全体に大ダメージ" },
    { id: 202, name: "強欲な壺", rarity: "SR", type: "MAGIC", desc: "SPを最大までチャージ" },

    // R (30%)
    { id: 301, name: "光の護封剣", rarity: "R", type: "MAGIC", desc: "3ターンの間ダメージ無効" },
    { id: 302, name: "落とし穴", rarity: "R", type: "TRAP", desc: "敵のチャージを無効化" },
    { id: 303, name: "聖なるバリア", rarity: "R", type: "TRAP", desc: "敵の攻撃を反射" },

    // N (60%)
    { id: 401, name: "火の粉", rarity: "N", type: "MAGIC", desc: "敵に50ダメージ" },
    { id: 402, name: "治療の神", rarity: "N", type: "MAGIC", desc: "HPを50回復" },
    { id: 403, name: "はさみ撃ち", rarity: "N", type: "TRAP", desc: "次の攻撃ダメージ1.2倍" },
    { id: 404, name: "昼夜の大火事", rarity: "N", type: "MAGIC", desc: "敵に80ダメージ" },
    { id: 405, name: "突進", rarity: "N", type: "MAGIC", desc: "攻撃力アップ" }
];

// パック定義
const PACK_DATA = [
    { 
        id: "vol1", 
        name: "Vol.1 - Legend", 
        price: 1000, 
        desc: "伝説の始まり。基本魔法カード収録。", 
        unlockStage: 1,
        img: "assets/packs/vol1.png" // ★画像パス追加
    }
];

// 2. ショップ機能 (Shop Logic)
function openCardShop() {
    playSE("se-tap");
    const list = document.getElementById("pack-list");
    list.innerHTML = "";
    document.getElementById("shop-dp-display").innerText = savedData.dp;

    if (!savedData.cards) savedData.cards = {};

    PACK_DATA.forEach(pack => {
        // ステージ解放チェック
        const isUnlocked = (savedData.bestRanks && savedData.bestRanks[pack.unlockStage]);
        // const isUnlocked = true; // デバッグ用

        if (!isUnlocked) return; 

        const canBuy = savedData.dp >= pack.price;
        
        // パック画像がない場合のダミー画像（絵文字）
        const imgHTML = `<img src="${pack.img}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                         <div style="display:none; width:100%; height:100%; align-items:center; justify-content:center; font-size:50px; background:#333; color:#555;">📦</div>`;

        const div = document.createElement("div");
        div.className = "pack-item";
        div.innerHTML = `
            <div class="pack-img-container">${imgHTML}</div>
            <div class="pack-name">${pack.name}</div>
            <div class="pack-desc">${pack.desc}</div>
            <button class="pack-buy-btn" ${canBuy ? "" : "disabled"} onclick="buyPack('${pack.id}')">
                ${canBuy ? `BUY (${pack.price} DP)` : "LACK DP"}
            </button>
        `;
        list.appendChild(div);
    });

    if (list.innerHTML === "") {
        list.innerHTML = "<div style='color:#666; width:100%; text-align:center;'>STAGE 1 CLEAR REQUIRED</div>";
    }

    document.getElementById("card-shop-modal").style.display = "flex";
}

function buyPack(packId) {
    const pack = PACK_DATA.find(p => p.id === packId);
    if (!pack || savedData.dp < pack.price) return;

    // DP消費
    savedData.dp -= pack.price;
    document.getElementById("shop-dp-display").innerText = savedData.dp;
    playSE("se-item"); // 仮の音

    // 3枚抽選
    const results = [];
    for(let i=0; i<3; i++) {
        const card = drawShopCard(packId); // ★修正ポイント: drawCard -> drawShopCard
        
        // 初入手チェック
        const isNew = !savedData.cards[card.id];
        
        // 所持数加算
        if (!savedData.cards[card.id]) savedData.cards[card.id] = 0;
        savedData.cards[card.id]++;
        
        results.push({ card: card, isNew: isNew });
    }
    
    saveToDrive();
    showPackResult(results);
}

// ★修正ポイント: 関数名を drawShopCard に変更
function drawShopCard(packId) {
    // 簡易ウェイト抽選 (N:60, R:30, SR:8, UR:2)
    const rand = Math.random() * 100;
    let targetRarity = "N";
    if (rand < 2) targetRarity = "UR";
    else if (rand < 10) targetRarity = "SR";
    else if (rand < 40) targetRarity = "R";

    // 該当レアリティの中からランダムに1枚選ぶ
    const pool = CARD_DB.filter(c => c.rarity === targetRarity);
    if (pool.length === 0) return CARD_DB[0]; // エラー回避
    return pool[Math.floor(Math.random() * pool.length)];
}

function showPackResult(results) {
    const container = document.getElementById("pack-results");
    container.innerHTML = "";
    
    // 結果表示演出
    results.forEach((res, index) => {
        const c = res.card;
        
        // 以前作った createCardElement 関数を再利用してカードの見た目を作る
        // 第2引数(isDeck)=false, 第3引数(remain)=1 (所持してるように見せるため)
        const cardEl = createCardElement(c, false, 1);
        
        // アニメーション用クラスを追加
        cardEl.classList.add("result-card-anim");
        cardEl.style.animationDelay = `${index * 0.3}s`; // 0.3秒ずつずらして登場
        
        // NEWバッジの追加
        if (res.isNew) {
            const badge = document.createElement("div");
            badge.className = "new-badge-overlay";
            badge.innerText = "NEW!";
            cardEl.appendChild(badge);
        }

        container.appendChild(cardEl);
    });

    // レア度判定で音を変える
    const hasHighRare = results.some(r => r.card.rarity === "SR" || r.card.rarity === "UR");
    if (hasHighRare) {
        setTimeout(() => playSE("se-win"), 300); // 少し遅らせてファンファーレ
    } else {
        playSE("se-buff");
    }

    document.getElementById("pack-result-modal").style.display = "flex";
}

function closePackResult() {
    playSE("se-tap");
    document.getElementById("pack-result-modal").style.display = "none";
    updateTitleScore(); // DP表示更新
}

function closeCardShop() {
    playSE("se-tap");
    document.getElementById("card-shop-modal").style.display = "none";
    updateTitleScore();
}

// 3. コレクション・デッキ編集機能
// --- ★ DECK EDIT SYSTEM (Ver 3.0) ★ ---

// デッキ保存用の初期化
if (!savedData.deck) savedData.deck = [];

function openCollection() {
    playSE("se-tap");
    renderDeckEditor();
    document.getElementById("collection-modal").style.display = "flex";
}

function closeCollection() {
    playSE("se-tap");
    document.getElementById("collection-modal").style.display = "none";
}

// デッキ編集画面の描画（12枚対応）
function renderDeckEditor() {
    // データ初期化（安全装置）
    if (!savedData.deck) savedData.deck = [];

    // 1. デッキエリアの描画
    const deckGrid = document.getElementById("deck-grid");
    deckGrid.innerHTML = "";
    
    // デッキ枠を12個に拡張
    const DECK_MAX = 12;

    for (let i = 0; i < DECK_MAX; i++) {
        const cardId = savedData.deck[i]; 
        
        if (cardId) {
            const card = CARD_DB.find(c => c.id === cardId);
            const el = createCardElement(card, true); // true = デッキ用
            deckGrid.appendChild(el);
        } else {
            const div = document.createElement("div");
            div.className = "deck-slot-empty";
            div.innerText = "EMPTY";
            deckGrid.appendChild(div);
        }
    }
    
    // 枚数カウント表示（文字色で警告）
    const deckCount = savedData.deck.length;
    const countEl = document.getElementById("deck-count");
    countEl.innerText = deckCount;
    
    // 12枚未満なら赤字、12枚なら緑字にする演出
    if (deckCount < 12) {
        countEl.style.color = "#ff5555"; // 赤
        countEl.innerText += " (あと" + (12 - deckCount) + "枚)";
    } else {
        countEl.style.color = "#00ff00"; // 緑
        countEl.innerText += " (OK!)";
    }

    // 2. カードリストエリアの描画
    const listGrid = document.getElementById("card-grid");
    listGrid.innerHTML = "";
    
    if (!savedData.cards) savedData.cards = {};
    let ownedCount = 0;

    CARD_DB.forEach(card => {
        const count = savedData.cards[card.id] || 0;
        if (count > 0) ownedCount++;
        
        // デッキに入っているこのカードの枚数を数える
        const inDeckCount = savedData.deck.filter(id => id === card.id).length;
        
        // リストに残る枚数 = 所持数 - デッキに入れた数
        // ★ルール変更: カードは持っている数だけ入れられる（最大3枚制限はaddToDeckでやる）
        const remaining = count - inDeckCount; 

        const el = createCardElement(card, false, remaining);
        listGrid.appendChild(el);
    });

    const rate = Math.floor((ownedCount / CARD_DB.length) * 100);
    document.getElementById("collection-rate").innerText = `${rate}%`;
}

// カードのHTML要素を作る関数（共通化）
function createCardElement(card, isDeckItem, remainingCount = 1) {
    const div = document.createElement("div");
    // 所持数0ならグレーアウト (デッキ内の場合は常に表示)
    const notOwnedClass = (!isDeckItem && remainingCount <= 0) ? "card-not-owned" : "";
    div.className = `collection-card rarity-${card.rarity} ${notOwnedClass}`;
    
    // 画像パス: assets/cards/101.png
    // エラー時は絵文字を表示するトリックを使用
    const imgPath = `assets/cards/${card.id}.png`;
    
    // カードタイプごとの絵文字（画像がない時の予備）
    const fallbackIcon = card.type === "MAGIC" ? "🪄" : "⛓️";

    div.innerHTML = `
        <div class="card-count-badge">x${isDeckItem ? 1 : remainingCount}</div>
        <div class="card-art">
            <img src="${imgPath}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
            <div class="card-placeholder" style="display:none;">${fallbackIcon}</div>
        </div>
        <div class="card-info">
            <div class="card-name">${card.name}</div>
            <div class="card-type">[${card.type}]</div>
        </div>
    `;

    // クリック時の動作
    div.onclick = function() {
        if (isDeckItem) {
            removeFromDeck(card.id);
        } else {
            addToDeck(card.id);
        }
    };

    return div;
}

// デッキに追加する処理（ルール追加）
function addToDeck(cardId) {
    const DECK_MAX = 12;
    const SAME_CARD_LIMIT = 3;

    // 1. 枚数制限チェック (最大12枚)
    if (savedData.deck.length >= DECK_MAX) {
        alert("デッキは12枚までです！");
        return;
    }

    // 2. 所持数チェック
    const ownedCount = savedData.cards[cardId] || 0;
    const currentInDeck = savedData.deck.filter(id => id === cardId).length;

    if (currentInDeck >= ownedCount) {
        alert("これ以上持っていません！"); // パックを開けて当ててね
        return;
    }

    // 3. 同名カード制限チェック (最大3枚)
    if (currentInDeck >= SAME_CARD_LIMIT) {
        alert(`「${getCardName(cardId)}」はデッキに3枚までしか入れられません。`);
        return;
    }
    
    playSE("se-tap");
    savedData.deck.push(cardId);
    saveToDrive();
    renderDeckEditor(); 
}

// カード名を取得するヘルパー関数
function getCardName(id) {
    const c = CARD_DB.find(card => card.id === id);
    return c ? c.name : "カード";
}

function removeFromDeck(cardId) {
    playSE("se-tap");
    // デッキから該当IDを1つだけ削除
    const index = savedData.deck.indexOf(cardId);
    if (index > -1) {
        savedData.deck.splice(index, 1);
    }
    saveToDrive();
    renderDeckEditor();
}

// --- ★ DEBUG TOOLS (Step 1) ★ ---

let cheatCodeInput = "";
let cheatTimeout;

// キー入力を監視
document.addEventListener("keydown", function(e) {
    // タイトル画面が表示されている時のみ有効
    const titleScreen = document.getElementById("title-screen");
    if (!titleScreen || titleScreen.style.display === "none") return;

    // "1" キーが押されたら記録
    if (e.key === "1") {
        cheatCodeInput += "1";
        
        // タイムアウト・リセット（2秒間入力がなければリセット）
        clearTimeout(cheatTimeout);
        cheatTimeout = setTimeout(() => { cheatCodeInput = ""; }, 2000);

        // "1111" が完成したら発動
        if (cheatCodeInput.includes("1111")) {
            cheatCodeInput = ""; // リセット
            activateCheat();
        }
    } else {
        cheatCodeInput = ""; // 違うキーを押したらリセット
    }
});

function activateCheat() {
    savedData.dp += 2000;
    saveToDrive();
    
    // 演出（音を鳴らしてDP表示を更新）
    playSE("se-buff"); // 音は何でもOKですが、わかりやすくbuff音で
    updateTitleDisplay(); // タイトル画面のDP表示を更新
    
    // 簡易的な通知
    alert(`[DEBUG MODE]\nDP +2000\nCurrent DP: ${savedData.dp}`);
}

// タイトル画面のDP表示を更新する関数（既存のものがあればそれを使ってください）
function updateTitleDisplay() {
    // もしタイトル画面にDP表示要素があれば更新
    const dpDisplay = document.querySelector(".dp-display");
    if (dpDisplay) {
        dpDisplay.innerText = `DP: ${savedData.dp}`;
    }
}