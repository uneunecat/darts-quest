console.log("★ main.js is loaded! (v1.4 Full Source)");

// --- HELPER FUNCTIONS ---
function calculateRating(ppr) {
    if (ppr < 30) return 1;
    if (ppr < 40) return 2;
    if (ppr < 45) return 3;
    if (ppr < 50) return 4;
    if (ppr < 55) return 5;
    if (ppr < 60) return 6;
    if (ppr < 65) return 7;
    if (ppr < 70) return 8;
    if (ppr < 75) return 9;
    if (ppr < 80) return 10;
    if (ppr < 85) return 11;
    if (ppr < 90) return 12;
    if (ppr < 95) return 13;
    if (ppr < 100) return 14;
    if (ppr < 110) return 15;
    if (ppr < 120) return 16;
    if (ppr < 130) return 17;
    return 18;
}

function calculateStageRank(stg, turns) {
    if (stg === 5) {
        if (turns <= 15) return ["SSS", 1000];
        if (turns <= 20) return ["S", 600];
        if (turns <= 35) return ["A", 300];
        if (turns <= 50) return ["B", 100];
        return ["C", 50];
    } else if (stg === 4) {
        if (turns <= 20) return ["SSS", 1000];
        if (turns <= 28) return ["S", 600];
        if (turns <= 40) return ["A", 300];
        if (turns <= 50) return ["B", 100];
        return ["C", 50];
    } else {
        if (turns <= 12) return ["SSS", 1000];
        if (turns <= 16) return ["S", 600];
        if (turns <= 22) return ["A", 300];
        if (turns <= 30) return ["B", 100];
        return ["C", 50];
    }
}

function getRankColor(r) {
    if (r === "SSS") return "#00ffff";
    if (r === "S") return "#ffd700";
    if (r === "A") return "#ff5555";
    return "#fff";
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

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

// --- ★ CARD DATA (Ver 2.2 Balance) ★ ---
const CARD_DB = [
    { id: 101, name: "死者蘇生", rarity: "UR", type: "MAGIC", cost: 8, desc: "HPを完全回復する" },
    { id: 201, name: "サンダー・ボルト", rarity: "SR", type: "MAGIC", cost: 6, desc: "敵に100ダメージ + スタン(1回休み)" },
    { id: 202, name: "強欲な壺", rarity: "SR", type: "MAGIC", cost: 0, desc: "MPを5回復する" },
    { id: 301, name: "光の護封剣", rarity: "R", type: "MAGIC", cost: 5, desc: "3ターンの間、受けるダメージを半減" },
    { id: 302, name: "落とし穴", rarity: "R", type: "TRAP", cost: 3, desc: "敵のチャージを解除しスタンさせる" },
    { id: 303, name: "聖なるバリア", rarity: "R", type: "TRAP", cost: 4, desc: "1ターン攻撃無効化 + 敵に50反撃" },
    { id: 401, name: "火の粉", rarity: "N", type: "MAGIC", cost: 1, desc: "敵に20ダメージ" },
    { id: 402, name: "治療の神", rarity: "N", type: "MAGIC", cost: 4, desc: "HPを50回復する" },
    { id: 403, name: "はさみ撃ち", rarity: "N", type: "TRAP", cost: 2, desc: "敵に80ダメージ、自分に20ダメージ" },
    { id: 404, name: "昼夜の大火事", rarity: "N", type: "MAGIC", cost: 3, desc: "敵に80ダメージ" },
    { id: 405, name: "突進", rarity: "N", type: "MAGIC", cost: 2, desc: "次の一投のダメージが2倍になる" }
];

const PACK_DATA = [
    { id: "vol1", name: "Vol.1 - Legend", price: 1000, desc: "伝説の始まり。基本魔法カード収録。", unlockStage: 1, img: "assets/packs/vol1.png" }
];

// --- GLOBAL VARIABLES ---
let player = { 
    hp: 100, 
    maxHp: 100, 
    mp: 3, 
    maxMp: 10,
    items: { potion: 0, ether: 0, seed: 0 }, 
    state: { power: false, shield: false, weakLock: false, nextShotMult: 1.0 },
    deck: [],
    hand: [],
    discard: [],
    deckLocked: false
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

// --- DOM ELEMENTS (Fully Defined) ---
const elContainer=document.getElementById("game-container"); const elTitle=document.getElementById("title-screen"); const elGame=document.getElementById("game-screen");
const elChapter=document.getElementById("chapter-screen"); const elChapTitle=document.getElementById("chapter-title"); const elChapSub=document.getElementById("chapter-sub");
const elStage=document.getElementById("stage-display"); const elFloor=document.getElementById("floor-display"); const elTurn=document.getElementById("turn-display");
const elBossLabel=document.getElementById("boss-label"); const elEnemyImg=document.getElementById("enemy-img"); const elEnemyName=document.getElementById("enemy-name");
const elWeak=document.getElementById("weak-display");

// HP & Status Elements
const elEnemyHP=document.getElementById("enemy-hp"); 
const elEnemyHPValue=document.getElementById("enemy-hp-value");
const elEnemyHPBar=document.getElementById("enemy-hp-bar");
const elPlayerHP=document.getElementById("player-hp"); 
const elPlayerHPBar=document.getElementById("player-hp-bar");
const elPlayerMP=document.getElementById("player-mp"); 
const elPlayerMPBar=document.getElementById("player-mp-bar");

// Badges
const elEnemyBuff=document.getElementById("enemy-buff-badge"); 
const elEnemyGuard=document.getElementById("enemy-guard-badge"); 
const elEnemyDrop=document.getElementById("enemy-drop-badge");
const elPlayerBuff=document.getElementById("player-buff-badge"); 
const elPlayerGuard=document.getElementById("player-guard-badge");

const elAvg=document.getElementById("avg-display"); const elRt=document.getElementById("rt-display"); const elLog=document.getElementById("battle-log");
const elEnemyPanel=document.getElementById("enemy-panel"); const elPlayerPanel=document.getElementById("player-panel"); const elOverlay=document.getElementById("flash-overlay");
const btnD1=document.getElementById("btn-d1"); const btnD2=document.getElementById("btn-d2"); const btnD3=document.getElementById("btn-d3");

const btnPotion=document.getElementById("btn-potion"); const btnEther=document.getElementById("btn-ether"); const btnSeed=document.getElementById("btn-seed");
const elModal=document.getElementById("game-modal"); const elModalBox=document.getElementById("modal-box-inner"); const elModalTitle=document.getElementById("modal-title"); const elModalText=document.getElementById("modal-text"); const elModalBtn=document.getElementById("modal-btn"); const elModalBtns=document.getElementById("modal-buttons");
const elCutin=document.getElementById("skill-cutin"); const elCutinText=document.getElementById("cutin-text-val");
const elCurtain=document.getElementById("black-curtain"); const elChestImg=document.getElementById("chest-img");
const slots = [document.getElementById("slot-1"), document.getElementById("slot-2"), document.getElementById("slot-3")];

// Audio
const audioElements = [document.getElementById("bgm-title"), document.getElementById("bgm-battle"), document.getElementById("bgm-boss"), document.getElementById("bgm-extra"), document.getElementById("bgm-win"), document.getElementById("bgm-lose")];
let currentBgmId = "";

// --- CORE FUNCTIONS ---
function resizeGame() {
    const scaler = document.getElementById('game-scaler');
    if(!scaler) return;
    const winW = window.innerWidth; const winH = window.innerHeight;
    const baseW = 900; const baseH = 620;
    const scale = Math.min(winW / baseW, winH / baseH) * 0.95;
    scaler.style.transform = `scale(${scale})`;
    scaler.style.marginTop = `${(winH - baseH * scale) / 2}px`;
    scaler.style.marginLeft = `${(winW - baseW * scale) / 2}px`;
}
window.addEventListener('resize', resizeGame); window.addEventListener('load', resizeGame); setTimeout(resizeGame, 100);

// --- LOCAL SAVE SYSTEM ---
let allSaveData = { "slot1": null, "slot2": null, "slot3": null, "lastPlayed": 1 };
const SAVE_KEY = "darts_quest_save";

function loadGameData() {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) { try { allSaveData = JSON.parse(saved); } catch(e) { console.error("Save Load Error", e); } }
    if(!allSaveData.slot1) allSaveData.slot1 = null;
    if(!allSaveData.slot2) allSaveData.slot2 = null;
    if(!allSaveData.slot3) allSaveData.slot3 = null;
}
loadGameData();

function saveToDrive() { 
    allSaveData[currentSlot] = savedData; 
    localStorage.setItem(SAVE_KEY, JSON.stringify(allSaveData));
}

// --- AUDIO SYSTEM ---
function stopAllBGM() { audioElements.forEach(a => { if(a) { a.pause(); a.currentTime=0; } }); currentBgmId = ""; }
function playBGM(id) { 
    if(currentBgmId === id) return; 
    stopAllBGM(); 
    currentBgmId = id; 
    const audio = document.getElementById(id); 
    if(audio) { audio.volume=0.3; audio.play().catch(e=>{}); } 
}
function playSE(id) { const audio = document.getElementById(id); if(audio) { audio.currentTime = 0; audio.volume = 0.5; audio.play().catch(e=>{}); } }

// --- TITLE & SLOT SCREEN ---
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
            let badge = ""; if(data.clearedExtra) badge = "<br><span style='color:#f0f;font-weight:bold;'>★ EXTRA CLEARED</span>";
            infoEl.innerHTML = `<div>${stg}</div><div style='color:#ffdd00;'>Avg: ${data.highScore.avg.toFixed(1)} (Rt ${calculateRating(data.highScore.avg)})</div><div style='color:#aaa;font-size:12px;'>DP: ${data.dp}${badge}</div>`;
        }
    }
}
// Start here
initSlotScreen();

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

function updateTitleScore() {
    let stg = `STAGE ${savedData.highScore.stage}`; if (savedData.highScore.stage === 5) stg = "EXTRA";
    document.getElementById("hs-reach").innerText = `${stg} - ${savedData.highScore.floor}F`;
    document.getElementById("hs-avg").innerText = savedData.highScore.avg.toFixed(1);
    document.getElementById("hs-rt").innerText = "Rt " + calculateRating(savedData.highScore.avg);
    document.getElementById("dp-display").innerText = "DP: " + savedData.dp;
    updateStageButton(1, "btn-st1"); updateStageButton(2, "btn-st2"); updateStageButton(3, "btn-st3");
    updateStageButton(4, "btn-stage4"); updateStageButton(5, "btn-extra");
    const canPlayStage4 = savedData.unlockedStage4 || (savedData.bestRanks && savedData.bestRanks[3]) || savedData.clearedExtra;
    if (canPlayStage4) document.getElementById("btn-stage4").style.display = "flex"; else document.getElementById("btn-stage4").style.display = "none";
    if (savedData.clearedExtra) document.getElementById("btn-extra").style.display = "flex"; else document.getElementById("btn-extra").style.display = "none";
}

function updateStageButton(stgNum, btnId) {
    const btn = document.getElementById(btnId);
    const rank = savedData.bestRanks[stgNum];
    const oldBadge = btn.querySelector(".rank-badge-s"); if(oldBadge) oldBadge.remove();
    btn.className = "stage-btn btn-default";
    if(btnId==="btn-stage4") btn.classList.add("stage4-btn"); if(btnId==="btn-extra") btn.classList.add("extra-btn");
    if(rank) {
        btn.classList.remove("btn-default", "stage4-btn", "extra-btn");
        if(rank === "SSS") btn.classList.add("btn-prism"); else if(rank === "S") btn.classList.add("btn-gold"); else if(rank === "A") btn.classList.add("btn-silver"); else btn.classList.add("btn-copper");
    }
}

// --- BATTLE SYSTEM ---
function initGameSession(startStage, continueMode=false) {
    if (!continueMode) {
        player.hp = 100; player.maxHp = 100; player.mp = 3; player.items = { potion: 0, ether: 0, seed: 0 };
        totalGameTurns = 0; totalScore = 0; totalDarts = 0; clearedStagesLog = [];
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

// ★修正: v1.3で機能していなかった「ヴァルキリアの先制」をここで実装
function checkOpeningSkill() {
    if (stage === 3 && floor === 1) { 
        showSkillCutin("光の護封剣", "wind");
        setTimeout(() => {
            enemy.state.guardType = 'player_cut'; // プレイヤーからの攻撃を軽減
            enemy.state.guardTurn = 3;
            addLog(">> [先制] 光の護封剣！(3T被ダメ半減)", "log-enemy"); 
            updateInfo();
        }, 1200);
    }
}

function setupStage(sel) {
    stage=sel; floor=1; isProcessing=false; extraBossTurnCount=0; currentTurn=1; stageStartTurn = totalGameTurns; 
    elAvg.innerText="0.0"; elRt.innerText="(Rt -)"; elLog.innerHTML=""; elGame.style.display="block";
    spawnEnemy(); 
    player.state={power:false,shield:false,weakLock:false,nextShotMult:1.0}; 
    player.mp = 3; 
    player.deckLocked = false; 
    if (!savedData.deck || savedData.deck.length < 12) {
        player.deckLocked = true; player.deck = []; player.hand = []; player.discard = [];
        addLog("⚠ デッキ不完全: カード機能封鎖", "log-system");
    } else {
        player.deck = shuffleArray([...savedData.deck]); player.hand = []; player.discard = [];
        for(let i=0; i<3; i++) drawCard();
    }
    addLog(`STAGE ${stage} START!`, "system"); resizeGame();
}

function spawnEnemy() {
    enemy.state={charge:false,guard:false,guardType:null,guardTurn:0,atkBuff:0,isStunned:false}; player.state={power:false,shield:false,weakLock:false,nextShotMult:1.0};
    currentTurn=1; turnInputs=[]; currentInput=""; restrictInput=false; updateScoreDisplay(); isJustFinish = false; waitingForChest = false; dropGuaranteed = false; weakHitCount=0;
    elContainer.className="container"; elEnemyPanel.className="left-panel"; elBossLabel.style.display="none"; elEnemyImg.style.display = "block"; elChestImg.style.display = "none";

    let bgKey = stage; if (stage === 4) bgKey = floor >= 5 ? "4_2" : "4_1";
    if (GAME_DATA.bg[bgKey]) elContainer.style.backgroundImage = `url('${GAME_DATA.bg[bgKey]}')`; else elContainer.style.backgroundImage = "none";

    let isBoss;
    // ★Update: Enemy HP Scaling (Ver 2.2)
    if (stage === 5) {
        enemy.data = GAME_DATA.enemies[5][0]; isBoss=true; extraBossTurnCount=0; playBGM("bgm-extra"); elContainer.classList.add("extra-mode"); elEnemyPanel.classList.add("extra-border"); elBossLabel.innerText="☠️EXTRA BOSS"; elBossLabel.style.display="inline"; elStage.innerText="EXTRA STAGE"; 
        enemy.maxHp=3000;
    } else if (stage === 4) {
        enemy.data = GAME_DATA.enemies[4][floor-1];
        if (floor === 5) { isBoss = true; playBGM("bgm-boss"); elContainer.classList.add("boss-mode"); elBossLabel.innerText="⚠️BOSS"; elBossLabel.style.display="inline"; enemy.maxHp = 1000; }
        else if (floor === 6) { isBoss = true; playBGM("bgm-extra"); elContainer.classList.add("extra-mode"); elBossLabel.innerText="☠️FINAL BOSS"; elBossLabel.style.display="inline"; enemy.maxHp = 1500; }
        else { playBGM("bgm-battle"); isBoss = false; enemy.maxHp = 250 + (floor * 50); }
    } else {
        isBoss=(floor===5); 
        let list = GAME_DATA.enemies[stage]; enemy.data = list[(floor-1)%list.length]; 
        let baseHp = 100 + ((stage-1)*100); if(isBoss) baseHp += 200; 
        enemy.maxHp = baseHp + (floor * 20);
        if(isBoss) { playBGM("bgm-boss"); elContainer.classList.add("boss-mode"); elEnemyPanel.classList.add("boss-border"); elBossLabel.innerText="⚠️BOSS"; elBossLabel.style.display="inline"; } 
        else { playBGM("bgm-battle"); }
    }
    enemy.name=enemy.data.name; elEnemyImg.src=enemy.data.img; enemy.hp=enemy.maxHp; displayEnemyHP=enemy.hp; updateInfo();
    if(stage===5) addLog(`>>> 伝説の黒竜、${enemy.name} が現れた！！！`, "log-skill"); else addLog(`=== STAGE ${stage} - ${floor}F ===`, "system");
    isProcessing=false;
}

// --- INFO & VISUALS ---
function updateInfo() {
    if (!enemy.data) return;

    if(stage===5) { elStage.innerText="EXTRA"; elFloor.innerText="FINAL"; }
    else if(stage===4) { elStage.innerText="STAGE 4"; elFloor.innerText=`${floor}F`; }
    else { elStage.innerText=`STAGE ${stage}`; elFloor.innerText=`${floor}F`; }
    elTurn.innerText=`TURN ${currentTurn}`;

    const elName = document.getElementById("enemy-name"); elName.innerText = enemy.name;
    elName.style.fontSize = "18px"; if (enemy.name.length > 12) elName.style.fontSize = "12px";

    if(elEnemyHPValue) {
        elEnemyHPValue.innerText = enemy.hp; elEnemyHPValue.className = "hp-big-text";
        if(enemy.hp <= 60) { elEnemyHPValue.classList.add("hp-danger"); } else if(enemy.hp <= 180) { elEnemyHPValue.classList.add("hp-warning"); }
    }

    let weakText = ""; 
    if(player.state.weakLock) { weakText = "<span style='color:#f0f; animation:blink 0.5s infinite;'>★ WEAK LOCK ACTIVE ★</span>"; }
    else if(weakHitCount > 0) { weakText = "<span style='color:#ffa500;'>DROP CHANCE UP!</span>"; }
    else { weakText = "WEAK: " + enemy.data.weak + "+"; }
    elWeak.innerHTML = weakText;

    if(elEnemyHPBar) elEnemyHPBar.style.width=Math.max(0,(enemy.hp/enemy.maxHp)*100)+"%"; 
    if(elPlayerHPBar) elPlayerHPBar.style.width=Math.max(0,(player.hp/player.maxHp)*100)+"%";
    
    document.getElementById("player-hp").innerText = player.hp; 
    document.getElementById("player-max-hp").innerText = player.maxHp;

    const mpContainer = document.getElementById("player-mp-bar");
    if(mpContainer) {
        mpContainer.innerHTML = ""; mpContainer.style.width = "100%"; 
        for(let i=0; i < player.maxMp; i++) {
            const dot = document.createElement("div"); dot.className = "mp-dot";
            if (i < player.mp) dot.classList.add("active"); mpContainer.appendChild(dot);
        }
    }
    document.querySelector("#player-mp").innerText = player.mp;
    document.querySelector("#player-max-mp").innerText = player.maxMp;

    updateVisuals();
    
    const handArea = document.getElementById("hand-area");
    if(handArea) {
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
                    let cost = card.cost; 
                    const div = document.createElement("div");
                    div.className = "hand-card";
                    if (player.mp < cost) div.classList.add("disabled");
                    const imgPath = `assets/cards/${card.id}.png`;
                    div.innerHTML = `<div class="hand-cost">${cost}</div><div class="card-art" style="height:100%; border:none;"><img src="${imgPath}" onerror="this.style.display='none'"></div><div style="position:absolute; bottom:0; width:100%; font-size:8px; text-align:center; background:rgba(0,0,0,0.7); color:#fff;">${card.name}</div>`;
                    div.onclick = () => playHandCard(index);
                    handArea.appendChild(div);
                });
            }
        }
    }

    let ppr = 0; if(totalDarts>0) ppr = ((totalScore/totalDarts)*3); elAvg.innerText=ppr.toFixed(1); elRt.innerText=`(Rt ${calculateRating(ppr)})`;
    btnPotion.innerHTML = `💊 薬草 x${player.items.potion}<span class="tooltip">HPを50回復 (使い切り)</span>`; btnPotion.className = player.items.potion > 0 ? "item-btn has-item" : "item-btn disabled";
    btnEther.innerHTML = `⚗️ マナ x${player.items.ether}<span class="tooltip">MPを3回復 (使い切り)</span>`; btnEther.className = player.items.ether > 0 ? "item-btn has-item" : "item-btn disabled";
    btnSeed.innerHTML = `🌱 種 x${player.items.seed}<span class="tooltip">最大HP+10上昇 (使い切り)</span>`; btnSeed.className = player.items.seed > 0 ? "item-btn has-item" : "item-btn disabled";
}

function updateVisuals() {
    if(elPlayerBuff) {
        elPlayerBuff.style.display = (player.state.power || player.state.nextShotMult > 1.0) ? "block" : "none";
        if(player.state.nextShotMult > 1.0) elPlayerBuff.innerText = "NEXT x2"; else elPlayerBuff.innerText = "ATK x1.5";
    }
    if(elPlayerGuard) elPlayerGuard.style.display = player.state.shield ? "block" : "none";
    if(elEnemyBuff) elEnemyBuff.style.display = enemy.state.charge ? "block" : "none";
    if(elEnemyGuard) elEnemyGuard.style.display = (enemy.state.guard || enemy.state.guardType) ? "block" : "none";
    if(elEnemyDrop) elEnemyDrop.style.display = (player.state.weakLock || dropGuaranteed) ? "block" : "none";
    if (stage !== 5 && elEnemyPanel) {
        elEnemyPanel.classList.remove("mode-charge", "mode-guard");
        if (enemy.state.charge) elEnemyPanel.classList.add("mode-charge");
        if (enemy.state.guard || enemy.state.guardType) elEnemyPanel.classList.add("mode-guard");
    }
}

function updateScoreDisplay() {
    slots.forEach((s, i) => { s.className = "score-slot"; if (restrictInput && i > 0) { s.classList.add("locked"); s.innerText = "X"; return; } if (i < turnInputs.length) { s.innerText = turnInputs[i]; s.classList.add("filled"); } else if (i === turnInputs.length) { s.innerText = currentInput; s.classList.add("active"); } else { s.innerText = ""; } });
    const currentThrow = turnInputs.length + 1;
    btnD1.className = currentThrow === 1 ? "darts-btn active" : "darts-btn"; btnD2.className = currentThrow === 2 ? "darts-btn active" : "darts-btn"; btnD3.className = currentThrow === 3 ? "darts-btn active" : "darts-btn";
    if(restrictInput) { btnD2.className="darts-btn disabled"; btnD3.className="darts-btn disabled"; }
}

function handleEnter() {
    if(isProcessing) return;
    if (currentInput !== "") {
        const val = parseInt(currentInput);
        if (!isNaN(val)) { 
            if (val < 0 || val > 60) { alert("単発の最大値は 60 (T20) です"); currentInput=""; updateScoreDisplay(); return; } 
            playSE("se-tap"); turnInputs.push(val); currentInput = ""; if (restrictInput || turnInputs.length === 3) executeAttack(); else updateScoreDisplay(); 
        }
    } else { if (turnInputs.length > 0) executeAttack(); }
}

// --- BATTLE LOGIC (Original Enemy Patterns Preserved) ---
function calculatePlayerDamage(score, p, e) {
    let dmg = score;
    if (p.state.nextShotMult > 1.0) { dmg = Math.floor(dmg * p.state.nextShotMult); p.state.nextShotMult = 1.0; addLog(`>> 突進効果！ダメージ倍増`, "log-skill"); }
    if (stage === 4 && floor === 4 && currentTurn % 3 === 0) { dmg = Math.max(0, dmg - 50); }
    if (e.state.guardType === 'player_cut') { dmg = Math.floor(dmg * 0.5); addLog("護封剣で半減！", "system"); }
    if (p.state.power) { dmg = Math.floor(dmg * 1.5); p.state.power = false; }
    if (e.state.guard) { dmg = Math.floor(dmg / 2); e.state.guard = false; addLog("敵の防御で半減！", "system"); }
    return dmg;
}

function executeAttack() {
    isProcessing = true; let totalScoreInTurn = 0; let weakHitInThisTurn = 0;
    turnInputs.forEach(s => { totalScoreInTurn += s; if (player.state.weakLock || (s >= 51 && enemy.data.weak && (s % enemy.data.weak === 0))) weakHitInThisTurn++; });

    if (stage === 4 && floor === 6 && currentTurn % 2 === 0 && totalScoreInTurn < 80) { playSE("se-warning"); addLog(">> 結界に阻まれた！(80点未満無効)", "log-enemy"); totalScoreInTurn = 0; }
    
    playSE("se-attack"); totalGameTurns++; totalScore += totalScoreInTurn; totalDarts += turnInputs.length; 
    let dmg = calculatePlayerDamage(totalScoreInTurn, player, enemy);
    let remaining = enemy.hp - dmg; if (remaining === 0) isJustFinish = true; enemy.hp = Math.max(0, remaining);

    if (weakHitInThisTurn > 0) { dropGuaranteed = true; weakHitCount += weakHitInThisTurn; addLog(`★ WEAK HIT x${weakHitInThisTurn}!!`, "log-weak"); if(!player.state.weakLock) { playSE("se-weak"); elOverlay.className = "flash-purple"; setTimeout(()=>elOverlay.className="", 600); } }
    if(player.state.weakLock) { player.state.weakLock = false; addLog("Weak Lock 効果終了", "log-system"); }

    addLog(`攻撃！ ${dmg} ダメージ (${turnInputs.join('+')})`); triggerEffect(elEnemyPanel, dmg, false);
    animateValue(elEnemyHP, displayEnemyHP, enemy.hp, 500); displayEnemyHP=enemy.hp; updateInfo();
    if (restrictInput) { restrictInput = false; addLog("束縛が解けた！", "log-system"); }
    if (enemy.state.guardType === 'player_cut') { enemy.state.guardTurn--; if(enemy.state.guardTurn<=0) { enemy.state.guardType=null; addLog("光の護封剣が消滅した", "log-system"); } }
    
    turnInputs = []; currentInput = ""; updateScoreDisplay();
    if(enemy.hp<=0) setTimeout(winBattle, 1000); else setTimeout(enemyTurn, 1000);
}

// ★IMPORTANT: Enemy Logic Preserved & Updated
function enemyTurn() {
    if(enemy.state.isStunned) { addLog(`>> ${enemy.name} は麻痺して動けない！`, "log-system"); enemy.state.isStunned = false; endEnemyTurn(); return; }

    // --- Boss Gimmicks (v1.4 Added) ---
    if (stage === 4) {
        if (floor === 5 && currentTurn % 4 === 0) { showSkillCutin("イーター", "earth"); setTimeout(() => { destroyHandCard(1); addLog(">> [イーター] 手札を1枚食べられた！", "log-enemy"); doEnemyAttack(1.0, {isDrain: true}); }, 1200); return; }
        if (floor === 6 && currentTurn % 3 === 0) { showSkillCutin("千眼の呪縛", "wind"); setTimeout(() => { destroyHandCard(2); player.mp = Math.max(0, player.mp - 2); addLog(">> [呪縛] 手札2枚破壊 & MP-2", "log-enemy"); doEnemyAttack(1.2); }, 1200); return; }
    }
    if (stage === 5) {
        extraBossTurnCount++;
        if (extraBossTurnCount % 5 === 0) { showSkillCutin("黒 炎 弾", "fire"); setTimeout(() => { let dmg=80; if(enemy.hp<enemy.maxHp*0.5) dmg=120; addLog(`>> [黒炎弾] 全体焼却 (${dmg}ダメ)`, "log-enemy"); doEnemyAttack(0, {fixedDmg: dmg, isBossUlt: true}); }, 1200); return; }
        let mult = 1.0; if(enemy.hp<enemy.maxHp*0.5) mult=1.5; doEnemyAttack(mult); return;
    }

    // --- Original v1.3 Logic Preserved ---
    if(stage===4 && floor===3 && Math.random()<0.4) { showSkillCutin("呪いの視線", "earth"); setTimeout(() => { player.mp = Math.max(0, player.mp - 2); addLog(">> [呪い] MP2減少", "log-enemy"); doEnemyAttack(1.0); }, 1200); return; }
    if(stage===3) {
        if(floor===2 && Math.random()<0.3) { showSkillCutin("誘惑の風", "wind"); setTimeout(() => { if(player.mp>0) { player.mp=Math.max(0,player.mp-1); enemy.hp=Math.min(enemy.hp+20,enemy.maxHp); addLog(">> [誘惑の風] MP吸収", "log-enemy"); } doEnemyAttack(1.0); }, 1200); return; }
        if(floor===5) { enemy.state.atkBuff += 0.1; addLog(`>> [主人の加護] 攻撃力UP (x${(1.0+enemy.state.atkBuff).toFixed(1)})`, "log-enemy"); if(currentTurn % 4 === 0) { showSkillCutin("愛の鞭", "fire"); setTimeout(() => { player.mp = 0; addLog(">> [愛の鞭] MP消滅", "log-enemy"); doEnemyAttack(2.0 * (1.0+enemy.state.atkBuff)); }, 1200); return; } doEnemyAttack(1.0 * (1.0+enemy.state.atkBuff)); return; }
    }
    if(stage===1 && floor===4 && player.mp>0 && Math.random()<0.3) { showSkillCutin("猛毒の鱗粉", "earth"); setTimeout(() => { player.mp = Math.max(0, player.mp - 1); addLog(">> [猛毒の鱗粉] MP1減少", "log-enemy"); doEnemyAttack(1.0); }, 1200); return; }
    
    if (stage === 4 && floor === 1 && Math.random() < 0.3) { showSkillCutin("トゥーン・ラッシュ", "wind"); setTimeout(() => { addLog(">> [速攻] 2回攻撃！", "log-enemy"); doEnemyAttack(0.7, {callback: () => { setTimeout(() => doEnemyAttack(0.7), 800); } }); }, 1200); return; }
    if (stage === 4 && floor === 2 && currentTurn === 5) { showSkillCutin("死のびっくり箱", "fire"); setTimeout(() => { addLog(">> [死の箱] 999ダメージ！", "log-enemy"); doEnemyAttack(0, {fixedDmg: 999, ignoreShield: true}); }, 1200); return; }
    if (stage === 4 && floor === 4 && currentTurn % 3 === 0) { showSkillCutin("トゥーン・スキン", "earth"); setTimeout(() => { addLog(">> [硬質化] 被ダメ-50", "log-enemy"); updateInfo(); endEnemyTurn(); }, 1200); return; }
    if (stage === 4 && floor === 5 && currentTurn % 3 === 0) { showSkillCutin("幻想の儀式", "wind"); setTimeout(() => { addLog(">> [儀式] HP吸収", "log-enemy"); doEnemyAttack(1.2, {isDrain: true}); }, 1200); return; }
    if (stage === 4 && floor === 6 && currentTurn % 2 === 0) { showSkillCutin("千眼の邪教神", "wind"); setTimeout(() => { addLog(">> [結界] 80点未満無効化！", "log-enemy"); doEnemyAttack(1.2); }, 1200); return; }
    
    if(stage===3) {
        if(floor===1 && enemy.state.guardTurn > 0) { addLog(`>> 光の護封剣 (残り${enemy.state.guardTurn}T)`, "log-enemy"); doEnemyAttack(1.0); return; }
        if(floor===3 && Math.random()<0.3) { showSkillCutin("サイバー・ボンテージ", "wind"); setTimeout(() => { restrictInput = true; addLog(">> [拘束] 次ターン1投制限！", "log-enemy"); doEnemyAttack(1.0); }, 1200); return; }
        if(floor===4 && Math.random()<0.3) { showSkillCutin("トライアングル・エクスタシー", "wind"); setTimeout(() => { addLog(">> [3姉妹] 3回攻撃！", "log-enemy"); doEnemyAttack(0.6, {callback: () => { setTimeout(() => doEnemyAttack(0.6, {callback: () => { setTimeout(() => doEnemyAttack(0.6), 600); } }), 600); } }); }, 1200); return; }
    }
    if(stage===2) {
        if(floor===2 && Math.random()<0.3) { showSkillCutin("俊足の連撃", "fire"); setTimeout(() => { addLog(">> [連撃] 2回攻撃！", "log-enemy"); doEnemyAttack(0.7, {callback: () => { setTimeout(() => doEnemyAttack(0.7), 800); } }); }, 1200); return; }
        if(floor===3 && Math.random()<0.3) { showSkillCutin("死肉の渇望", "fire"); setTimeout(() => { addLog(">> [渇望] HP吸収", "log-enemy"); doEnemyAttack(1.0, {isDrain: true}); }, 1200); return; }
        if(floor===4 && enemy.hp <= enemy.maxHp * 0.5 && Math.random()<0.5) { showSkillCutin("狂暴化", "fire"); setTimeout(() => { addLog(">> [狂暴化] 攻撃1.5倍", "log-enemy"); doEnemyAttack(1.5); }, 1200); return; }
        if(floor===5 && Math.random() < 0.3) { showSkillCutin("恐竜剣・兜割り", "earth"); setTimeout(() => { addLog(">> [BOSS] 兜割り！シールド無効", "log-enemy"); doEnemyAttack(1.8, {ignoreShield: true}); }, 1200); return; }
    }
    if(stage===1) {
        if(floor===3) { if(Math.random() < 0.2) { showSkillCutin("自己再生", "heal"); setTimeout(() => { enemy.hp = Math.min(enemy.hp + 20, enemy.maxHp); playSE("se-heal"); addLog(">> [自己再生] HP20回復", "log-heal"); animateValue(elEnemyHP,displayEnemyHP,enemy.hp,500); displayEnemyHP=enemy.hp; updateInfo(); endEnemyTurn(); }, 1200); return; } if(Math.random() < 0.4) { showSkillCutin("鉄壁の守り", "earth"); setTimeout(() => { enemy.state.guard = true; addLog(">> [鉄壁の守り] ダメージ半減", "log-enemy"); updateInfo(); endEnemyTurn(); }, 1200); return; } }
        if(floor===5) { if(enemy.state.charge) { enemy.state.charge = false; showSkillCutin("森の破壊衝動", "earth"); setTimeout(() => { doEnemyAttack(3.0); }, 1200); return; } if(Math.random() < 0.3) { enemy.state.charge = true; addLog(`>> 力を溜めている…`, "log-enemy"); updateInfo(); endEnemyTurn(); return; } }
    }
    doEnemyAttack(1.0);
}

function destroyHandCard(count) {
    if (player.deckLocked) return;
    for (let i = 0; i < count; i++) { if (player.hand.length > 0) { const idx = Math.floor(Math.random() * player.hand.length); const lostCard = player.hand.splice(idx, 1)[0]; player.discard.push(lostCard); } }
    updateInfo();
}

// --- CARD EFFECTS (v1.4) ---
function applyCardEffect(card) {
    let msg = `Card: [${card.name}] `;
    if (card.id === 101) { player.hp = player.maxHp; msg += "HP完全回復！"; playSE("se-heal"); }
    else if (card.id === 201) { const dmg = 100; enemy.hp = Math.max(0, enemy.hp - dmg); enemy.state.isStunned = true; msg += `100ダメ & スタン！`; playSE("se-boom"); triggerEffect(elEnemyPanel, dmg, false); }
    else if (card.id === 202) { player.mp = Math.min(player.mp + 5, player.maxMp); msg += "MP+5 チャージ！"; }
    else if (card.id === 301) { enemy.state.guardType='player_cut'; enemy.state.guardTurn=3; msg += "3ターン被ダメ半減！"; }
    else if (card.id === 302) { if (enemy.state.charge) { enemy.state.charge = false; enemy.state.isStunned = true; msg += "チャージ解除 & スタン！"; playSE("se-boom"); } else { msg += "(不発)"; } }
    else if (card.id === 303) { player.state.shield = true; const dmg = 50; enemy.hp = Math.max(0, enemy.hp - dmg); msg += `完全防御 & 50反撃！`; triggerEffect(elEnemyPanel, dmg, false); }
    else if (card.id === 401) { const dmg = 20; enemy.hp = Math.max(0, enemy.hp - dmg); msg += `20ダメージ`; triggerEffect(elEnemyPanel, dmg, false); }
    else if (card.id === 402) { player.hp = Math.min(player.hp + 50, player.maxHp); msg += "HP50回復"; playSE("se-heal"); }
    else if (card.id === 403) { const dmg = 80; const selfDmg = 20; enemy.hp = Math.max(0, enemy.hp - dmg); player.hp = Math.max(0, player.hp - selfDmg); msg += `敵80ダメ / 自20ダメ`; triggerEffect(elEnemyPanel, dmg, false); triggerEffect(elPlayerPanel, selfDmg, true); }
    else if (card.id === 404) { const dmg = 80; enemy.hp = Math.max(0, enemy.hp - dmg); msg += `80ダメージ！`; playSE("se-attack"); triggerEffect(elEnemyPanel, dmg, false); }
    else if (card.id === 405) { player.state.nextShotMult = 2.0; msg += "次の一投ダメージ2倍！"; }
    addLog(msg, "log-skill");
    animateValue(elEnemyHP, displayEnemyHP, enemy.hp, 500); displayEnemyHP=enemy.hp;
    animateValue(elPlayerHP, displayPlayerHP, player.hp, 500); displayPlayerHP=player.hp;
    if (enemy.hp <= 0) setTimeout(winBattle, 800);
}

// --- UTIL ---
function tapKey(key) {
    if (elGame.style.display === "none" || isProcessing) return;
    if(key === 'ENT') handleEnter();
    else if (key === 'BS') { if (currentInput.length > 0) currentInput = currentInput.slice(0, -1); else if (turnInputs.length > 0) currentInput = "" + turnInputs.pop(); playSE("se-tap"); updateScoreDisplay(); }
    else { if (currentInput.length < 3) { playSE("se-tap"); currentInput += key; updateScoreDisplay(); } }
}

function showHistory() {
    const list = document.getElementById("history-list"); list.innerHTML = "";
    if(!savedData.history || savedData.history.length === 0) { list.innerHTML = "<div style='padding:20px; text-align:center;'>NO HISTORY</div>"; }
    else {
        savedData.history.forEach(h => {
            let resClass = "res-lose"; let resStr = h.result || "LOSE";
            if (resStr.includes("WIN") || resStr.includes("CLEAR")) resClass = "res-win";
            if (resStr.includes("EXTRA")) resClass = "res-extra";
            let stgName = h.stgName ? h.stgName : (h.stage === 5 ? "EXTRA" : "S" + h.stage + "-" + h.floor + "F");
            let dpText = (h.dp !== undefined) ? `+${h.dp} DP` : ""; let pprVal = h.ppr !== undefined ? h.ppr : (h.avg !== undefined ? h.avg : 0);
            list.innerHTML += `<div class='h-row'><div>${h.date}</div><div>${stgName}</div><div class='${resClass}'>${resStr}</div><div>${dpText}<br>Avg ${pprVal.toFixed(1)}</div></div>`;
        });
    }
    playSE("se-tap"); document.getElementById("history-modal").style.display = "flex";
}
// ★Missing Function Fixed
function closeHistory() { playSE("se-tap"); document.getElementById("history-modal").style.display = "none"; }

// --- DEBUG ---
let cheatCodeInput = ""; let cheatTimeout;
document.addEventListener("keydown", function(e) {
    const titleScreen = document.getElementById("title-screen"); if (!titleScreen || titleScreen.style.display === "none") return;
    if (e.key === "1") { cheatCodeInput += "1"; clearTimeout(cheatTimeout); cheatTimeout = setTimeout(() => { cheatCodeInput = ""; }, 2000); if (cheatCodeInput.includes("1111")) { cheatCodeInput = ""; savedData.dp += 2000; saveToDrive(); playSE("se-buff"); updateTitleScore(); alert(`[DEBUG MODE]\nDP +2000\nCurrent DP: ${savedData.dp}`); } } else { cheatCodeInput = ""; }
});