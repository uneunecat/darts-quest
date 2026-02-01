console.log("★ main.js is loaded! (v1.4.3 Fixed)");

// --- HELPER FUNCTIONS ---
function calculateRating(ppr) { if(ppr < 30) return 1; if(ppr < 40) return 2; if(ppr < 45) return 3; if(ppr < 50) return 4; if(ppr < 55) return 5; if(ppr < 60) return 6; if(ppr < 65) return 7; if(ppr < 70) return 8; if(ppr < 75) return 9; if(ppr < 80) return 10; if(ppr < 85) return 11; if(ppr < 90) return 12; if(ppr < 95) return 13; if(ppr < 100) return 14; if(ppr < 110) return 15; if(ppr < 120) return 16; if(ppr < 130) return 17; return 18; }

function calculateStageRank(stg, turns) {
    if (stg === 5) { if (turns <= 15) return ["SSS", 1000]; if (turns <= 20) return ["S", 600]; if (turns <= 35) return ["A", 300]; if (turns <= 50) return ["B", 100]; return ["C", 50]; }
    else if (stg === 4) { if (turns <= 20) return ["SSS", 1000]; if (turns <= 28) return ["S", 600]; if (turns <= 40) return ["A", 300]; if (turns <= 50) return ["B", 100]; return ["C", 50]; }
    else { if (turns <= 12) return ["SSS", 1000]; if (turns <= 16) return ["S", 600]; if (turns <= 22) return ["A", 300]; if (turns <= 30) return ["B", 100]; return ["C", 50]; }
}

function getRankColor(r) { if(r==="SSS") return "#00ffff"; if(r==="S") return "#ffd700"; if(r==="A") return "#ff5555"; return "#fff"; }

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; } return array;
}

// --- ★ GAME DATA CONFIG ★ ---
const GAME_DATA = {
    enemies: {
        1: [ { name: "プチモス", img: "assets/1-1.png", weak: 20 }, { name: "ラーバモス", img: "assets/1-2.png", weak: 19 }, { name: "進化の繭", img: "assets/1-3.png", weak: 18 }, { name: "グレート・モス", img: "assets/1-4.png", weak: 17 }, { name: "究極完全態・グレート・モス", img: "assets/1-5.png", weak: 20 } ],
        2: [ { name: "トラコドン", img: "assets/2-1.png", weak: 19 }, { name: "ワイルド・ラプター", img: "assets/2-2.png", weak: 18 }, { name: "屍を貪る竜", img: "assets/2-3.png", weak: 17 }, { name: "二頭を持つキング・レックス", img: "assets/2-4.png", weak: 20 }, { name: "剣竜", img: "assets/2-5.png", weak: 19 } ],
        3: [ { name: "デュナミス・ヴァルキリア", img: "assets/3-1.png", weak: 20 }, { name: "ハーピィ・レディ", img: "assets/3-2.png", weak: 19 }, { name: "ハーピィ・レディ・SB", img: "assets/3-3.png", weak: 18 }, { name: "ハーピィ・レディ三姉妹", img: "assets/3-4.png", weak: 17 }, { name: "ハーピィズペット竜", img: "assets/3-5.png", weak: 20 } ],
        4: [ { name: "ダーク・ラビット", img: "assets/4-1.png", weak: 20 }, { name: "デビル・ボックス", img: "assets/4-2.png", weak: 19 }, { name: "トゥーン・デーモン", img: "assets/4-3.png", weak: 18 }, { name: "ブルーアイズ・トゥーン・ドラゴン", img: "assets/4-4.png", weak: 17 }, { name: "サクリファイス", img: "assets/4-5.png", weak: 20 }, { name: "サウザンド・アイズ・サクリファイス", img: "assets/4-6.png", weak: 20 } ],
        5: [ { name: "真紅眼の黒竜", img: "assets/extra.png", weak: 20 } ]
    },
    bg: { 1: "assets/bg_stage1.png", 2: "assets/bg_stage2.png", 3: "assets/bg_stage3.png", 4_1: "assets/bg_stage4_1.png", 4_2: "assets/bg_stage4_2.png", 5: "assets/bg_extra.png" }
};

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

const PACK_DATA = [ { id: "vol1", name: "Vol.1 - Legend", price: 1000, desc: "伝説の始まり。基本魔法カード収録。", unlockStage: 1, img: "assets/packs/vol1.png" } ];

// --- GLOBAL VARIABLES ---
let player = { hp: 100, maxHp: 100, mp: 3, maxMp: 10, items: { potion: 0, ether: 0, seed: 0 }, state: { power: false, shield: false, weakLock: false, nextShotMult: 1.0 }, deck: [], hand: [], discard: [], deckLocked: false };
let enemy = { hp: 100, maxHp: 100, data: null, name: "", state: { charge: false, guard: false, guardType: null, guardTurn: 0, atkBuff: 0, isStunned: false } };
let stage=1; floor=1; totalScore=0; totalDarts=0; currentDarts=3;
let displayPlayerHP=100; displayEnemyHP=100;
let isProcessing=false; extraBossTurnCount=0; currentTurn=1;
let dropGuaranteed = false; weakHitCount = 0; let restrictInput = false;
let turnInputs = []; let currentInput = ""; let isJustFinish = false; let waitingForChest = false;
let cheatBuffer = ""; 
let stageStartTurn = 0; let totalGameTurns = 0; let clearedStagesLog = [];

// --- DOM ELEMENTS (★ここを修正しました) ---
const elContainer=document.getElementById("game-container"); const elTitle=document.getElementById("title-screen"); const elGame=document.getElementById("game-screen");
const elChapter=document.getElementById("chapter-screen"); const elChapTitle=document.getElementById("chapter-title"); const elChapSub=document.getElementById("chapter-sub");
const elStage=document.getElementById("stage-display"); const elFloor=document.getElementById("floor-display"); const elTurn=document.getElementById("turn-display");
const elBossLabel=document.getElementById("boss-label"); const elEnemyImg=document.getElementById("enemy-img"); const elEnemyName=document.getElementById("enemy-name");
const elWeak=document.getElementById("weak-display");

// ★不足していた要素を追加
const elEnemyHP=document.getElementById("enemy-hp"); 
const elEnemyHPValue=document.getElementById("enemy-hp-value");
const elEnemyHPBar=document.getElementById("enemy-hp-bar");

const elPlayerHP=document.getElementById("player-hp"); 
const elPlayerHPBar=document.getElementById("player-hp-bar");

const elAvg=document.getElementById("avg-display"); const elRt=document.getElementById("rt-display"); const elLog=document.getElementById("battle-log");
const elEnemyPanel=document.getElementById("enemy-panel"); const elPlayerPanel=document.getElementById("player-panel"); const elOverlay=document.getElementById("flash-overlay");
const btnD1=document.getElementById("btn-d1"); const btnD2=document.getElementById("btn-d2"); const btnD3=document.getElementById("btn-d3");
const btnPotion=document.getElementById("btn-potion"); const btnEther=document.getElementById("btn-ether"); const btnSeed=document.getElementById("btn-seed");
const elModal=document.getElementById("game-modal"); const elModalBox=document.getElementById("modal-box-inner"); const elModalTitle=document.getElementById("modal-title"); const elModalText=document.getElementById("modal-text"); const elModalBtn=document.getElementById("modal-btn"); const elModalBtns=document.getElementById("modal-buttons");
const elCutin=document.getElementById("skill-cutin"); const elCutinText=document.getElementById("cutin-text-val");
const elCurtain=document.getElementById("black-curtain"); const elChestImg=document.getElementById("chest-img");
const slots = [document.getElementById("slot-1"), document.getElementById("slot-2"), document.getElementById("slot-3")];
const audioElements = [document.getElementById("bgm-title"), document.getElementById("bgm-battle"), document.getElementById("bgm-boss"), document.getElementById("bgm-extra"), document.getElementById("bgm-win"), document.getElementById("bgm-lose")];
let currentBgmId = "";

// --- INITIALIZATION ---
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

// --- AUDIO FUNCTIONS ---
function stopAllBGM() { audioElements.forEach(a => { if(a) { a.pause(); a.currentTime=0; } }); currentBgmId = ""; }
function playBGM(id) { 
    if(currentBgmId === id) return; 
    stopAllBGM(); 
    currentBgmId = id; 
    const audio = document.getElementById(id); 
    if(audio) { audio.volume=0.3; audio.play().catch(e=>{}); } 
}
function playSE(id) { const audio = document.getElementById(id); if(audio) { audio.currentTime = 0; audio.volume = 0.5; audio.play().catch(e=>{}); } }

// --- SAVE SYSTEM ---
let allSaveData = { "slot1": null, "slot2": null, "slot3": null, "lastPlayed": 1 };
const SAVE_KEY = "darts_quest_save";

function loadGameData() {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) { try { allSaveData = JSON.parse(saved); } catch(e) { console.error(e); } }
    if(!allSaveData.slot1) allSaveData.slot1 = null;
    if(!allSaveData.slot2) allSaveData.slot2 = null;
    if(!allSaveData.slot3) allSaveData.slot3 = null;
}
loadGameData();

function saveToDrive() { 
    allSaveData[currentSlot] = savedData; 
    localStorage.setItem(SAVE_KEY, JSON.stringify(allSaveData));
}

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
            else if(data.highScore.stage === 4) stg = "STAGE 4 - " + data.highScore.floor + "F";

            let badge = ""; if(data.clearedExtra) badge = "<br><span style='color:#f0f;font-weight:bold;'>★ EXTRA CLEARED</span>";
            infoEl.innerHTML = `<div>${stg}</div><div style='color:#ffdd00;'>Avg: ${data.highScore.avg.toFixed(1)} (Rt ${calculateRating(data.highScore.avg)})</div><div style='color:#aaa;font-size:12px;'>DP: ${data.dp}${badge}</div>`;
        }
    }
}
initSlotScreen(); 

function selectSlot(n) {
    currentSlot = "slot"+n; const key = currentSlot;
    if(!allSaveData[key]) { allSaveData[key] = { highScore: { stage: 1, floor: 1, avg: 0.0 }, history: [], clearedExtra: false, dp: 0, bestRanks: { 1: null, 2: null, 3: null, 4: null, 5: null }, unlockedStage4: false, deck: [], cards: {} }; }
    savedData = allSaveData[key];
    if(savedData.dp === undefined) savedData.dp = 0;
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

// --- BATTLE SYSTEM ---
function initGameSession(startStage, continueMode=false) {
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

function checkOpeningSkill() { }

function setupStage(sel) {
    stage=sel; floor=1; isProcessing=false; extraBossTurnCount=0; currentTurn=1;
    stageStartTurn = totalGameTurns; 
    elAvg.innerText="0.0"; elRt.innerText="(Rt -)"; elLog.innerHTML=""; elGame.style.display="block";
    spawnEnemy(); 
    player.state={power:false,shield:false,weakLock:false, nextShotMult:1.0}; 
    player.mp = 3; 
    player.deckLocked = false; 
    if (!savedData.deck || savedData.deck.length < 12) {
        player.deckLocked = true; player.deck = []; player.hand = []; player.discard = [];
        addLog("⚠ デッキ不完全: カード機能封鎖", "log-system");
    } else {
        player.deck = shuffleArray([...savedData.deck]); 
        player.hand = []; player.discard = [];
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
    if (stage === 5) {
        enemy.data = GAME_DATA.enemies[5][0]; isBoss=true; extraBossTurnCount=0; playBGM("bgm-extra"); elContainer.classList.add("extra-mode"); elEnemyPanel.classList.add("extra-border"); elBossLabel.innerText="☠️EXTRA BOSS"; elBossLabel.style.display="inline"; elStage.innerText="EXTRA STAGE"; enemy.maxHp=3000;
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
    let cost = card.cost;
    if (player.mp < cost) { addLog("MPが足りません！", "log-system"); playSE("se-warning"); return; }
    playSE("se-buff"); player.mp -= cost;
    applyCardEffect(card);
    player.hand.splice(index, 1); player.discard.push(cardId); drawCard();
    updateInfo();
}

function applyCardEffect(card) {
    let msg = `Card: [${card.name}] `;
    if (card.id === 101) { player.hp = player.maxHp; msg += "HP完全回復！"; playSE("se-heal"); }
    else if (card.id === 201) { const dmg = 100; enemy.hp = Math.max(0, enemy.hp - dmg); enemy.state.isStunned = true; msg += `100ダメ & スタン！`; playSE("se-boom"); triggerEffect(document.getElementById("enemy-panel"), dmg, false); }
    else if (card.id === 202) { player.mp = Math.min(player.mp + 5, player.maxMp); msg += "MP+5 チャージ！"; }
    else if (card.id === 301) { enemy.state.guardType = 'player_cut'; enemy.state.guardTurn = 3; msg += "3ターン被ダメ半減！"; }
    else if (card.id === 302) { if (enemy.state.charge) { enemy.state.charge = false; enemy.state.isStunned = true; msg += "チャージ解除 & スタン！"; playSE("se-boom"); } else { msg += "(不発…敵はチャージしていない)"; } }
    else if (card.id === 303) { player.state.shield = true; const dmg = 50; enemy.hp = Math.max(0, enemy.hp - dmg); msg += `完全防御 & 50反撃！`; triggerEffect(document.getElementById("enemy-panel"), dmg, false); }
    else if (card.id === 401) { const dmg = 20; enemy.hp = Math.max(0, enemy.hp - dmg); msg += `20ダメージ`; triggerEffect(document.getElementById("enemy-panel"), dmg, false); }
    else if (card.id === 402) { player.hp = Math.min(player.hp + 50, player.maxHp); msg += "HP50回復"; playSE("se-heal"); }
    else if (card.id === 403) { const dmg = 80; const selfDmg = 20; enemy.hp = Math.max(0, enemy.hp - dmg); player.hp = Math.max(0, player.hp - selfDmg); msg += `敵80ダメ / 自20ダメ`; triggerEffect(document.getElementById("enemy-panel"), dmg, false); triggerEffect(document.getElementById("player-panel"), selfDmg, true); }
    else if (card.id === 404) { const dmg = 80; enemy.hp = Math.max(0, enemy.hp - dmg); msg += `80ダメージ！`; playSE("se-attack"); triggerEffect(document.getElementById("enemy-panel"), dmg, false); }
    else if (card.id === 405) { player.state.nextShotMult = 2.0; msg += "次の一投ダメージ2倍！"; }
    addLog(msg, "log-skill"); animateValue(document.getElementById("enemy-hp"), displayEnemyHP, enemy.hp, 500); displayEnemyHP=enemy.hp; animateValue(document.getElementById("player-hp"), displayPlayerHP, player.hp, 500); displayPlayerHP=player.hp;
    if (enemy.hp <= 0) setTimeout(winBattle, 800);
}

function updateInfo() {
    if (!enemy.data) return;
    if(stage===5) { elStage.innerText="EXTRA"; elFloor.innerText="FINAL"; }
    else if(stage===4) { elStage.innerText="STAGE 4"; elFloor.innerText=`${floor}F`; }
    else { elStage.innerText=`STAGE ${stage}`; elFloor.innerText=`${floor}F`; }
    elTurn.innerText=`TURN ${currentTurn}`;
    const elName = document.getElementById("enemy-name"); elName.innerText = enemy.name;
    elName.style.fontSize = (enemy.name.length > 12) ? "12px" : (enemy.name.length > 9 ? "15px" : "18px");
    
    // ★修正箇所: enemy-hp-value を正しく取得・使用
    if(elEnemyHPValue) {
        elEnemyHPValue.innerText = enemy.hp;
        elEnemyHPValue.className = "hp-big-text";
        if(enemy.hp <= 60) { elEnemyHPValue.classList.add("hp-danger"); } else if(enemy.hp <= 180) { elEnemyHPValue.classList.add("hp-warning"); }
    }

    let weakText = ""; let weakTargetStr = "(Target: " + enemy.data.weak + "+)";
    if(player.state.weakLock) { weakText = "<span style='color:#f0f; animation:blink 0.5s infinite;'>★ WEAK LOCK ACTIVE ★</span>"; }
    else if(weakHitCount > 0) { let color = weakHitCount >= 3 ? "#ff0000" : (weakHitCount >= 2 ? "#ffa500" : "#ffff00"); let msg = weakHitCount >= 3 ? "ULTRA CHANCE!!!" : (weakHitCount >= 2 ? "SUPER CHANCE!!" : "DROP CHANCE UP!"); weakText = `<span style='color:${color}; text-shadow:0 0 5px ${color};'>✨ ${msg}</span> <span style='font-size:14px; color:#ccc; margin-left:5px;'>${weakTargetStr}</span>`; }
    else { weakText = "WEAK: " + enemy.data.weak + "+"; }
    elWeak.innerHTML = weakText;
    
    // ★修正箇所: elEnemyHPBar / elPlayerHPBar を正しく使用
    if(elEnemyHPBar) elEnemyHPBar.style.width=Math.max(0,(enemy.hp/enemy.maxHp)*100)+"%"; 
    if(elPlayerHPBar) elPlayerHPBar.style.width=Math.max(0,(player.hp/player.maxHp)*100)+"%";
    
    document.getElementById("player-hp").innerText = player.hp; document.getElementById("player-max-hp").innerText = player.maxHp;
    const mpContainer = document.getElementById("player-mp-bar"); mpContainer.innerHTML = ""; mpContainer.style.width = "100%"; 
    for(let i=0; i < player.maxMp; i++) { const dot = document.createElement("div"); dot.className = "mp-dot"; if (i < player.mp) dot.classList.add("active"); mpContainer.appendChild(dot); }
    document.querySelector("#player-mp").innerText = player.mp; document.querySelector("#player-max-mp").innerText = player.maxMp;
    updateVisuals(); renderHand();
    let ppr = totalDarts>0 ? ((totalScore/totalDarts)*3).toFixed(1) : 0; elAvg.innerText=ppr; elRt.innerText=`(Rt ${calculateRating(ppr)})`;
    btnPotion.innerHTML = `💊 薬草 x${player.items.potion}<span class="tooltip">HPを50回復 (使い切り)</span>`; btnPotion.className = player.items.potion > 0 ? "item-btn has-item" : "item-btn disabled";
    btnEther.innerHTML = `⚗️ マナ x${player.items.ether}<span class="tooltip">MPを3回復 (使い切り)</span>`; btnEther.className = player.items.ether > 0 ? "item-btn has-item" : "item-btn disabled";
    btnSeed.innerHTML = `🌱 種 x${player.items.seed}<span class="tooltip">最大HP+10上昇 (使い切り)</span>`; btnSeed.className = player.items.seed > 0 ? "item-btn has-item" : "item-btn disabled";
}

function updateVisuals() {
    if(elPlayerBuff) { elPlayerBuff.style.display = (player.state.power || player.state.nextShotMult > 1.0) ? "block" : "none"; if(player.state.nextShotMult > 1.0) elPlayerBuff.innerText = "NEXT x2"; else elPlayerBuff.innerText = "ATK x1.5"; }
    if(elPlayerGuard) elPlayerGuard.style.display = player.state.shield ? "block" : "none";
    if(elEnemyBuff) elEnemyBuff.style.display = enemy.state.charge ? "block" : "none";
    if(elEnemyGuard) elEnemyGuard.style.display = (enemy.state.guard || enemy.state.guardType) ? "block" : "none";
    if (player.state.weakLock || dropGuaranteed) { if(elEnemyDrop) elEnemyDrop.style.display = "block"; if(elEnemyPanel) elEnemyPanel.classList.add("drop-chance"); }
    else { if(elEnemyDrop) elEnemyDrop.style.display = "none"; if(elEnemyPanel) elEnemyPanel.classList.remove("drop-chance"); }
    if (stage !== 5 && elEnemyPanel) { elEnemyPanel.classList.remove("mode-charge", "mode-guard"); if (enemy.state.charge) elEnemyPanel.classList.add("mode-charge"); if (enemy.state.guard || enemy.state.guardType) elEnemyPanel.classList.add("mode-guard"); }
}

function showSkillCutin(name, type) { playSE("se-warning"); elCutinText.innerText = name; elCutin.className = ""; if(type==="fire") elCutin.classList.add("cutin-fire"); if(type==="ice") elCutin.classList.add("cutin-ice"); if(type==="earth") elCutin.classList.add("cutin-earth"); if(type==="wind") elCutin.classList.add("cutin-wind"); elCutin.style.display = "flex"; elContainer.classList.add("shake-heavy"); setTimeout(()=>{ elCutin.style.display="none"; elContainer.classList.remove("shake-heavy"); }, 1500); }

function enemyTurn() {
    if(enemy.state.isStunned) { addLog(`>> ${enemy.name} は怯んで動けない！`, "log-system"); enemy.state.isStunned = false; endEnemyTurn(); return; }
    if (stage === 4) {
        if (floor === 5) { if (currentTurn % 4 === 0) { showSkillCutin("イーター", "earth"); setTimeout(() => { destroyHandCard(1); addLog(">> [イーター] 手札を1枚食べられた！", "log-enemy"); doEnemyAttack(1.0, {isDrain: true}); }, 1200); return; } }
        if (floor === 6) { if (currentTurn % 3 === 0) { showSkillCutin("千眼の呪縛", "wind"); setTimeout(() => { destroyHandCard(2); player.mp = Math.max(0, player.mp - 2); addLog(">> [呪縛] 手札2枚破壊 & MP-2", "log-enemy"); doEnemyAttack(1.2); }, 1200); return; } }
    }
    if (stage === 5) {
        extraBossTurnCount++;
        if (extraBossTurnCount % 3 === 0) { showSkillCutin("黒 炎 弾", "fire"); setTimeout(() => { let dmg = 80; if (enemy.hp < enemy.maxHp * 0.5) dmg = 120; addLog(`>> [黒炎弾] 全体焼却 (${dmg}ダメ)`, "log-enemy"); doEnemyAttack(0, {fixedDmg: dmg, isBossUlt: true}); }, 1200); return; }
        let mult = 1.0; if (enemy.hp < enemy.maxHp * 0.5) mult = 1.5; doEnemyAttack(mult); return;
    }
    if(stage <= 3 && Math.random() < 0.2) { enemy.state.charge = true; addLog(`>> ${enemy.name} は力を溜めている…`, "log-enemy"); updateInfo(); endEnemyTurn(); return; }
    if(enemy.state.charge) { enemy.state.charge = false; showSkillCutin("強攻撃", "fire"); setTimeout(() => doEnemyAttack(2.5), 1000); return; }
    doEnemyAttack(1.0);
}

function destroyHandCard(count) {
    if (player.deckLocked) return;
    for (let i = 0; i < count; i++) { if (player.hand.length > 0) { const idx = Math.floor(Math.random() * player.hand.length); const lostCard = player.hand.splice(idx, 1)[0]; player.discard.push(lostCard); } }
    updateInfo();
}

function doEnemyAttack(mult, options = {}) {
    const { ignoreShield = false, isDrain = false, isBossUlt = false, fixedDmg = 0, callback = null } = options;
    let finalMult = mult; if (enemy.state.guardType === 'player_cut') finalMult *= 0.5; 
    if (!ignoreShield && player.state.shield) { addLog(`${enemy.name} の攻撃！ → 完全防御！`, "log-skill"); player.state.shield=false; triggerEffect(document.getElementById("player-panel"),0,true); document.getElementById("flash-overlay").className="flash-blue"; setTimeout(()=>document.getElementById("flash-overlay").className="",300); updateInfo(); if(callback) callback(); else endEnemyTurn(); return; }
    let dmg = 0; if (fixedDmg > 0) dmg = fixedDmg; else { const base = 10 + (stage * 5) + (floor * 2); dmg = Math.floor((base + Math.random()*5) * finalMult); }
    if (enemy.state.guardType === 'player_cut') { enemy.state.guardTurn--; if (enemy.state.guardTurn <= 0) enemy.state.guardType = null; }
    finishAttack(dmg, isDrain, callback);
}

function finishAttack(dmg, isDrain, callback) {
    player.hp = Math.max(0, player.hp-dmg); addLog(`${enemy.name} の攻撃！ ${dmg} ダメージ`, "enemy");
    if(isDrain) { const heal = Math.floor(dmg * 0.5); if(heal > 0) { enemy.hp = Math.min(enemy.hp + heal, enemy.maxHp); addLog(`>> 敵が HP${heal} 吸収した！`, "log-enemy"); animateValue(document.getElementById("enemy-hp"), displayEnemyHP, enemy.hp, 500); displayEnemyHP=enemy.hp; } }
    triggerEffect(document.getElementById("player-panel"), dmg, true); animateValue(document.getElementById("player-hp"), displayPlayerHP, player.hp, 500); displayPlayerHP=player.hp; updateInfo();
    if(player.hp<=0) setTimeout(loseBattle,1000); else { if(callback) callback(); else endEnemyTurn(); }
}

function endEnemyTurn() { currentTurn++; player.mp = Math.min(player.mp + 3, player.maxMp); updateInfo(); isProcessing=false; }

function winBattle() {
    addLog(`${enemy.name} を倒した`, "system");
    if (isJustFinish) { player.maxHp += 10; const oldHP = player.hp; player.hp = Math.min(player.hp + 10, player.maxHp); playSE("se-heal"); addLog(`★JUST FINISH! MaxHP+10 & HP+10`, "heal"); animateValue(elPlayerHP, oldHP, player.hp, 500); updateInfo(); setTimeout(() => { showDialog("JUST FINISH BONUS!!", `見事！ピッタリで倒した！<br>最大HPが ${player.maxHp} にアップ！<br>HPも10回復した。`, "clear", [{text:"OK", action:checkDrop}]); }, 800); } else { setTimeout(checkDrop, 800); }
}
function checkDrop() {
    if(stage === 5 || (stage === 4 && floor === 6)) { nextStep(); return; }
    const isBoss = (floor === 5); let dropRate = isBoss ? 1.0 : 0.3; if (dropGuaranteed) dropRate = 1.0;
    if(Math.random() < dropRate) { waitingForChest = true; elEnemyImg.style.display = "none"; elChestImg.style.display = "block"; elChestImg.classList.add("chest-shine"); playSE("se-chest"); addLog("宝箱を見つけた！", "log-item"); } else { nextStep(); }
}
function openChest() {
    if(!waitingForChest) return; waitingForChest = false; playSE("se-item");
    let seedRate = 0.15; if (weakHitCount >= 3) seedRate = 1.0; else if (weakHitCount >= 2) seedRate = 0.50;
    const rand = Math.random(); let itemName = ""; let itemEffect = "";
    if (rand < seedRate) { itemName = "★命の種"; itemEffect = "MaxHP +10"; player.items.seed++; } else if (Math.random() < 0.6) { itemName = "薬草"; itemEffect = "HP 50 回復"; player.items.potion++; } else { itemName = "魔法の聖水"; itemEffect = "MP 3 回復"; player.items.ether++; }
    updateInfo(); addLog(`宝箱: ${itemName} (${itemEffect}) を手に入れた`, "log-item");
    showDialog("TREASURE!", `<span style="font-size:24px;color:#00ff00;">${itemName}</span> を手に入れた！<br>${itemEffect}<br>(アイテムボタンで使用可能)`, "item", [{text:"OK", action:nextStep}]);
}

function nextStep() {
    floor++; const ppr = totalDarts>0 ? ((totalScore/totalDarts)*3).toFixed(1) : 0;
    if((floor > 5 && stage !== 4) || (stage === 4 && floor > 6)) {
        const stageTurns = totalGameTurns - stageStartTurn;
        const [rank, dpBonus] = calculateStageRank(stage, stageTurns);
        const scoreDP = Math.floor(totalScore * 0.2); 
        let pendingBonusDP = dpBonus; clearedStagesLog.forEach(log => { pendingBonusDP += log.dp; });
        let potentialTotalDP = scoreDP + pendingBonusDP;
        clearedStagesLog.push({ stage: stage, rank: rank, dp: dpBonus });
        const currentBest = savedData.bestRanks[stage]; const ranksOrder = ["SSS", "S", "A", "B", "C"];
        if (!currentBest || ranksOrder.indexOf(rank) < ranksOrder.indexOf(currentBest)) { savedData.bestRanks[stage] = rank; }
        playBGM("bgm-win");

        if(stage === 5) {
            const res = finishSession("EXTRA-WIN", parseFloat(ppr));
            showDialog("★ TRUE ENDING ★", `<span style="font-size:30px;color:#f0f;">THE LEGEND!!</span><br>最強の黒竜を倒した！<br><br>RANK: <span style="font-size:24px;color:${getRankColor(rank)};">${rank}</span><br>PPR: ${ppr}<br><br><span style="color:#ffd700; font-size:24px; font-weight:bold;">GET DP: +${res.gainedDP}</span>`, "clear", [{text:"TITLE", action:returnToTitle}]);
            return;
        }
        if(stage === 4) {
            const res = finishSession("WIN", parseFloat(ppr));
            showDialog("STAGE 4 CLEAR!", `<span style="font-size:28px;color:#e0b0ff;">NIGHTMARE CONQUERED!</span><br>RANK: <span style="font-size:24px;color:${getRankColor(rank)};">${rank}</span><br><br><span style="color:#ffd700; font-size:24px; font-weight:bold;">GET DP: +${res.gainedDP}</span>`, "clear", [{text:"TITLE", action:returnToTitle}]);
            return;
        }
        let msg = `STAGE ${stage} COMPLETED!<br>RANK: <span style="font-size:24px;color:${getRankColor(rank)};">${rank}</span><br><br>現在の獲得予定DP: <span style="color:#ffd700; font-weight:bold;">${potentialTotalDP} DP</span>`;
        const btnNext = { text: "⛺ 次へ進む (繰越)", action: () => { player.hp = Math.min(player.hp + 30, player.maxHp); initGameSession(stage + 1, true); } };
        const btnExtra = { text: "⚠️ EXTRA STAGE", action: () => { player.hp = Math.min(player.hp + 30, player.maxHp); initGameSession(5, true); } };
        const btnReturn = { text: "🏠 帰還する (確定)", action: () => { const res = finishSession("RETURN", parseFloat(ppr)); showDialog("MISSION COMPLETE", `帰還しました。<br><br><span style="color:#ffd700; font-size:24px; font-weight:bold;">GET DP: +${res.gainedDP}</span>`, "clear", [{text:"TITLE", action:returnToTitle}]); } };
        let buttons = (stage === 3 && parseFloat(ppr) >= 70.0) ? [btnExtra, btnReturn] : [btnNext, btnReturn];
        if (stage === 3 && parseFloat(ppr) < 70.0) { msg += "<br><br>全てのエリアを踏破した！"; buttons = [{ text: "🏠 ALL CLEAR", action: () => { const res = finishSession("WIN", parseFloat(ppr)); showDialog("ALL CLEAR!", `おめでとうございます！<br><br><span style="color:#ffd700; font-size:24px; font-weight:bold;">GET DP: +${res.gainedDP}</span>`, "clear", [{text:"TITLE", action:returnToTitle}]); } }]; }
        showDialog("STAGE CLEAR", msg, "clear", buttons);
    } else {
        spawnEnemy();
    }
}

function loseBattle() {
    const ppr = totalDarts>0 ? ((totalScore/totalDarts)*3).toFixed(1) : 0;
    const res = finishSession("LOSE", parseFloat(ppr));
    playBGM("bgm-lose");
    let reached = (stage===5) ? "EXTRA" : (stage===4 ? `STAGE 4-${floor}F` : `STAGE ${stage}-${floor}F`);
    showDialog("GAME OVER", `到達: ${reached}<br>PPR: ${ppr} <span class='rt-badge'>Rt ${calculateRating(ppr)}</span><br><br><span style="color:#ffd700; font-size:20px;">GET DP: +${res.gainedDP}</span>`, "warning", [{text:"TITLE", action:returnToTitle}]);
}

function returnToTitle() { playBGM("bgm-title"); elContainer.classList.remove("boss-mode","extra-mode"); elGame.style.display="none"; elTitle.style.display="flex"; updateTitleScore(); }

function useItem(type) {
    if(isProcessing || waitingForChest) return;
    if(type === 'potion' && player.items.potion > 0) { player.items.potion--; playSE("se-heal"); const old=player.hp; player.hp=Math.min(player.hp+50, player.maxHp); addLog(`アイテム: 薬草使用`, "log-item"); animateValue(elPlayerHP, old, player.hp, 500); updateInfo(); }
    else if(type === 'ether' && player.items.ether > 0) { player.items.ether--; playSE("se-heal"); player.mp=Math.min(player.mp+3, player.maxMp); addLog(`アイテム: 聖水使用 (MP+3)`, "log-item"); updateInfo(); }
    else if(type === 'seed' && player.items.seed > 0) { player.items.seed--; playSE("se-buff"); player.maxHp+=10; const old=player.hp; player.hp=Math.min(player.hp+10, player.maxHp); addLog(`アイテム: 命の種使用`, "log-item"); animateValue(elPlayerHP, old, player.hp, 500); updateInfo(); }
}

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
    let cost = card.cost;
    if (player.mp < cost) { addLog("MPが足りません！", "log-system"); playSE("se-warning"); return; }
    playSE("se-buff"); player.mp -= cost;
    applyCardEffect(card);
    player.hand.splice(index, 1); player.discard.push(cardId); drawCard();
    updateInfo();
}

// --- SHOP & COLLECTION ---
function openCardShop() {
    playSE("se-tap"); const list = document.getElementById("pack-list"); list.innerHTML = "";
    document.getElementById("shop-dp-display").innerText = savedData.dp;
    PACK_DATA.forEach(pack => {
        const isUnlocked = (savedData.bestRanks && savedData.bestRanks[pack.unlockStage]);
        if (!isUnlocked) return; 
        const canBuy = savedData.dp >= pack.price;
        const imgHTML = `<img src="${pack.img}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"><div style="display:none; width:100%; height:100%; align-items:center; justify-content:center; font-size:50px; background:#333; color:#555;">📦</div>`;
        const div = document.createElement("div"); div.className = "pack-item";
        div.innerHTML = `<div class="pack-img-container">${imgHTML}</div><div class="pack-name">${pack.name}</div><div class="pack-desc">${pack.desc}</div><button class="pack-buy-btn" ${canBuy ? "" : "disabled"} onclick="buyPack('${pack.id}')">${canBuy ? `BUY (${pack.price} DP)` : "LACK DP"}</button>`;
        list.appendChild(div);
    });
    if (list.innerHTML === "") { list.innerHTML = "<div style='color:#666; width:100%; text-align:center;'>STAGE 1 CLEAR REQUIRED</div>"; }
    document.getElementById("card-shop-modal").style.display = "flex";
}

function buyPack(packId) {
    const pack = PACK_DATA.find(p => p.id === packId); if (!pack || savedData.dp < pack.price) return;
    savedData.dp -= pack.price; document.getElementById("shop-dp-display").innerText = savedData.dp; playSE("se-item");
    const results = []; for(let i=0; i<3; i++) {
        const card = drawShopCard(packId); 
        const isNew = !savedData.cards[card.id];
        if (!savedData.cards[card.id]) savedData.cards[card.id] = 0; savedData.cards[card.id]++;
        results.push({ card: card, isNew: isNew });
    }
    saveToDrive(); showPackResult(results);
}

function showPackResult(results) {
    const container = document.getElementById("pack-results"); container.innerHTML = "";
    results.forEach((res, index) => {
        const c = res.card; const cardEl = createCardElement(c, false, 1);
        cardEl.classList.add("result-card-anim"); cardEl.style.animationDelay = `${index * 0.3}s`;
        if (res.isNew) { const badge = document.createElement("div"); badge.className = "new-badge-overlay"; badge.innerText = "NEW!"; cardEl.appendChild(badge); }
        container.appendChild(cardEl);
    });
    const hasHighRare = results.some(r => r.card.rarity === "SR" || r.card.rarity === "UR");
    if (hasHighRare) setTimeout(() => playSE("se-win"), 300); else playSE("se-buff");
    document.getElementById("pack-result-modal").style.display = "flex";
}

function closePackResult() { playSE("se-tap"); document.getElementById("pack-result-modal").style.display = "none"; updateTitleScore(); }
function closeCardShop() { playSE("se-tap"); document.getElementById("card-shop-modal").style.display = "none"; updateTitleScore(); }

function openCollection() { playSE("se-tap"); renderDeckEditor(); document.getElementById("collection-modal").style.display = "flex"; }
function closeCollection() { playSE("se-tap"); document.getElementById("collection-modal").style.display = "none"; }

function renderDeckEditor() {
    if (!savedData.deck) savedData.deck = [];
    const deckGrid = document.getElementById("deck-grid"); deckGrid.innerHTML = "";
    for (let i = 0; i < 12; i++) {
        const cardId = savedData.deck[i]; 
        if (cardId) { const card = CARD_DB.find(c => c.id === cardId); deckGrid.appendChild(createCardElement(card, true)); }
        else { const div = document.createElement("div"); div.className = "deck-slot-empty"; div.innerText = "EMPTY"; deckGrid.appendChild(div); }
    }
    const deckCount = savedData.deck.length; const countEl = document.getElementById("deck-count"); countEl.innerText = deckCount;
    if (deckCount < 12) { countEl.style.color = "#ff5555"; countEl.innerText += " (あと" + (12 - deckCount) + "枚)"; } else { countEl.style.color = "#00ff00"; countEl.innerText += " (OK!)"; }

    const listGrid = document.getElementById("card-grid"); listGrid.innerHTML = "";
    if (!savedData.cards) savedData.cards = {}; let ownedCount = 0;
    CARD_DB.forEach(card => {
        const count = savedData.cards[card.id] || 0; if (count > 0) ownedCount++;
        const inDeckCount = savedData.deck.filter(id => id === card.id).length;
        const remaining = count - inDeckCount; 
        listGrid.appendChild(createCardElement(card, false, remaining));
    });
    document.getElementById("collection-rate").innerText = `${Math.floor((ownedCount / CARD_DB.length) * 100)}%`;
}

function createCardElement(card, isDeckItem, remainingCount = 1) {
    const div = document.createElement("div"); const notOwnedClass = (!isDeckItem && remainingCount <= 0) ? "card-not-owned" : "";
    div.className = `collection-card rarity-${card.rarity} ${notOwnedClass}`;
    const imgPath = `assets/cards/${card.id}.png`; const fallbackIcon = card.type === "MAGIC" ? "🪄" : "⛓️";
    div.innerHTML = `<div class="card-count-badge">x${isDeckItem ? 1 : remainingCount}</div><div class="card-art"><img src="${imgPath}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"><div class="card-placeholder" style="display:none;">${fallbackIcon}</div></div><div class="card-info"><div class="card-name">${card.name}</div><div class="card-type">[${card.type}]</div></div>`;
    div.onclick = function() { if (isDeckItem) removeFromDeck(card.id); else addToDeck(card.id); };
    return div;
}

function addToDeck(cardId) {
    if (savedData.deck.length >= 12) { alert("デッキは12枚までです！"); return; }
    const ownedCount = savedData.cards[cardId] || 0; const currentInDeck = savedData.deck.filter(id => id === cardId).length;
    if (currentInDeck >= ownedCount) { alert("これ以上持っていません！"); return; }
    if (currentInDeck >= 3) { alert(`「${getCardName(cardId)}」は3枚までです。`); return; }
    playSE("se-tap"); savedData.deck.push(cardId); saveToDrive(); renderDeckEditor(); 
}

function removeFromDeck(cardId) {
    playSE("se-tap"); const index = savedData.deck.indexOf(cardId);
    if (index > -1) { savedData.deck.splice(index, 1); } saveToDrive(); renderDeckEditor();
}

function getCardName(id) { const c = CARD_DB.find(card => card.id === id); return c ? c.name : "カード"; }

// --- UTILS ---
function addLog(t, type="") { const d=document.createElement("div"); d.innerHTML=t; if(type) d.className="log-"+type; elLog.prepend(d); }
function showDialog(title, text, type="normal", buttons=[{text:"OK", action:null}]) {
    elModalTitle.innerText = title; elModalText.innerHTML = text; elModalBox.className = "modal-box"; elModalTitle.style.color = "#f9a826";
    if (type === "clear") { elModalBox.classList.add("modal-clear"); elModalTitle.style.color = "#fff"; } else if (type === "warning") { elModalBox.classList.add("modal-warning"); elModalTitle.style.color = "#ff0000"; } else if (type === "item") { elModalBox.classList.add("modal-item"); elModalTitle.style.color = "#00ff00"; }
    elModalBtns.innerHTML = ""; buttons.forEach(b => {
        const btn = document.createElement("button"); btn.className = "modal-btn"; btn.innerText = b.text;
        btn.onclick = function() { playSE("se-tap"); elModal.style.display = "none"; if(b.action) b.action(); };
        elModalBtns.appendChild(btn);
    });
    elModal.style.display = "flex";
}
function triggerEffect(el, dmg, isP, isWeak=false) {
    el.classList.remove("shake-small", "shake-medium", "shake-heavy", "shake-ultimate"); void el.offsetWidth;
    if(dmg >= 100) { el.classList.add("shake-ultimate"); playSE("se-boom"); elOverlay.className = "flash-gold"; setTimeout(()=>elOverlay.className="", 800); }
    else if(dmg >= 50) { el.classList.add("shake-heavy"); playSE("se-boom"); elOverlay.className = isP ? "flash-red" : "flash-white"; setTimeout(()=>elOverlay.className="", 300); }
    else { el.classList.add(dmg>=20 ? "shake-medium" : "shake-small"); playSE("se-hit"); }
    const pop = document.createElement("div"); pop.innerText=dmg; if(dmg >= 100) pop.className="damage-popup dmg-ultimate"; else if(dmg >= 50) pop.className="damage-popup dmg-heavy"; else if(dmg >= 20) pop.className="damage-popup dmg-medium"; else pop.className="damage-popup dmg-small";
    pop.style.left="50%"; pop.style.top="50%"; el.appendChild(pop); setTimeout(()=>pop.remove(),1500);
}
function animateValue(obj, s, e, d) { if(obj) obj.innerHTML = e; }
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

function tapKey(key) {
    if (elGame.style.display === "none" || isProcessing) return;
    if(key === 'ENT') handleEnter();
    else if (key === 'BS') { if (currentInput.length > 0) currentInput = currentInput.slice(0, -1); else if (turnInputs.length > 0) currentInput = "" + turnInputs.pop(); playSE("se-tap"); updateScoreDisplay(); }
    else { if (currentInput.length < 3) { playSE("se-tap"); currentInput += key; updateScoreDisplay(); } }
}

function updateScoreDisplay() {
    slots.forEach((s, i) => { s.className = "score-slot"; if (restrictInput && i > 0) { s.classList.add("locked"); s.innerText = "X"; return; } if (i < turnInputs.length) { s.innerText = turnInputs[i]; s.classList.add("filled"); } else if (i === turnInputs.length) { s.innerText = currentInput; s.classList.add("active"); } else { s.innerText = ""; } });
    const currentThrow = turnInputs.length + 1;
    btnD1.className = currentThrow === 1 ? "darts-btn active" : "darts-btn"; btnD2.className = currentThrow === 2 ? "darts-btn active" : "darts-btn"; btnD3.className = currentThrow === 3 ? "darts-btn active" : "darts-btn";
    if(restrictInput) { btnD2.className="darts-btn disabled"; btnD3.className="darts-btn disabled"; }
}

function handleEnter() {
    if(isProcessing) return;
    if (currentInput !== "") { const val = parseInt(currentInput); if (!isNaN(val)) { if (val < 0 || val > 60) { alert("単発の最大値は 60 (T20) です"); currentInput=""; updateScoreDisplay(); return; } playSE("se-tap"); turnInputs.push(val); currentInput = ""; if (restrictInput || turnInputs.length === 3) executeAttack(); else updateScoreDisplay(); } } else { if (turnInputs.length > 0) executeAttack(); }
}

function executeAttack() {
    isProcessing = true; let totalScoreInTurn = 0; let weakHitInThisTurn = 0;
    turnInputs.forEach(s => { totalScoreInTurn += s; if (player.state.weakLock || (s >= 51 && enemy.data.weak && (s % enemy.data.weak === 0))) weakHitInThisTurn++; });
    if (stage === 4 && floor === 6 && currentTurn % 2 === 0 && totalScoreInTurn < 80) { playSE("se-warning"); addLog(">> 結界に阻まれた！(80点未満無効)", "log-enemy"); totalScoreInTurn = 0; }
    playSE("se-attack"); totalGameTurns++; totalScore += totalScoreInTurn; totalDarts += turnInputs.length; 
    let dmg = calculatePlayerDamage(totalScoreInTurn, player, enemy);
    let remaining = enemy.hp - dmg; if (remaining === 0) isJustFinish = true; enemy.hp = Math.max(0, remaining);
    if (weakHitInThisTurn > 0) { dropGuaranteed = true; weakHitCount += weakHitInThisTurn; addLog(`★ WEAK HIT x${weakHitInThisTurn}!!`, "log-weak"); if(!player.state.weakLock) { if(document.getElementById("se-weak")) playSE("se-weak"); elOverlay.className = "flash-purple"; setTimeout(()=>elOverlay.className="", 600); } }
    if(player.state.weakLock) { player.state.weakLock = false; addLog("Weak Lock 効果終了", "log-system"); }
    addLog(`攻撃！ ${dmg} ダメージ (${turnInputs.join('+')})`); triggerEffect(elEnemyPanel, dmg, false);
    animateValue(elEnemyHP, displayEnemyHP, enemy.hp, 500); displayEnemyHP=enemy.hp; updateInfo();
    if (restrictInput) { restrictInput = false; addLog("束縛が解けた！", "log-system"); }
    if (enemy.state.guardType === 'cut') { enemy.state.guardTurn--; if(enemy.state.guardTurn<=0) { enemy.state.guardType=null; addLog("光の護封剣が消滅した", "log-system"); } }
    turnInputs = []; currentInput = ""; updateScoreDisplay();
    if(enemy.hp<=0) setTimeout(winBattle, 1000); else setTimeout(enemyTurn, 1000);
}

function calculatePlayerDamage(score, p, e) {
    let dmg = score;
    if (p.state.nextShotMult > 1.0) { dmg = Math.floor(dmg * p.state.nextShotMult); p.state.nextShotMult = 1.0; addLog(`>> 突進効果！ダメージ倍増 (${dmg})`, "log-skill"); }
    if (stage === 4 && floor === 4 && currentTurn % 3 === 0) { dmg = Math.max(0, dmg - 50); }
    if (e.state.guardType === 'player_cut') { dmg = Math.floor(dmg * 0.5); addLog("護封剣で50%軽減！", "system"); }
    if (p.state.power) { dmg = Math.floor(dmg * 1.5); p.state.power = false; }
    if (e.state.guard) { dmg = Math.floor(dmg / 2); e.state.guard = false; addLog("敵の防御で半減！", "system"); }
    return dmg;
}

// --- DEBUG ---
let cheatCodeInput = ""; let cheatTimeout;
document.addEventListener("keydown", function(e) {
    const titleScreen = document.getElementById("title-screen"); if (!titleScreen || titleScreen.style.display === "none") return;
    if (e.key === "1") { cheatCodeInput += "1"; clearTimeout(cheatTimeout); cheatTimeout = setTimeout(() => { cheatCodeInput = ""; }, 2000); if (cheatCodeInput.includes("1111")) { cheatCodeInput = ""; savedData.dp += 2000; saveToDrive(); playSE("se-buff"); updateTitleScore(); alert(`[DEBUG MODE]\nDP +2000\nCurrent DP: ${savedData.dp}`); } } else { cheatCodeInput = ""; }
});