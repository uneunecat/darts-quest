console.log("★ main.js is loaded! (v1.4 Balance Update)");

// --- ★ GAME DATA CONFIG ★ ---
const GAME_DATA = {
    enemies: {
        1: [
            { name: "プチモス", img: "assets/1-1.png", weak: 20 },
            { name: "ラーバモス", img: "assets/1-2.png", weak: 19 },
            { name: "進化の繭", img: "assets/1-3.png", weak: 18 },
            { name: "グレート・モス", img: "assets/1-4.png", weak: 17 },
            { name: "究極完全態・グレート・モス", img: "assets/1-5.png", weak: 20 }
        ],
        2: [
            { name: "トラコドン", img: "assets/2-1.png", weak: 19 },
            { name: "ワイルド・ラプター", img: "assets/2-2.png", weak: 18 },
            { name: "屍を貪る竜", img: "assets/2-3.png", weak: 17 },
            { name: "二頭を持つキング・レックス", img: "assets/2-4.png", weak: 20 },
            { name: "剣竜", img: "assets/2-5.png", weak: 19 }
        ],
        3: [
            { name: "デュナミス・ヴァルキリア", img: "assets/3-1.png", weak: 20 },
            { name: "ハーピィ・レディ", img: "assets/3-2.png", weak: 19 },
            { name: "ハーピィ・レディ・SB", img: "assets/3-3.png", weak: 18 },
            { name: "ハーピィ・レディ三姉妹", img: "assets/3-4.png", weak: 17 },
            { name: "ハーピィズペット竜", img: "assets/3-5.png", weak: 20 }
        ],
        4: [
            { name: "ダーク・ラビット", img: "assets/4-1.png", weak: 20 },
            { name: "デビル・ボックス", img: "assets/4-2.png", weak: 19 },
            { name: "トゥーン・デーモン", img: "assets/4-3.png", weak: 18 },
            { name: "ブルーアイズ・トゥーン・ドラゴン", img: "assets/4-4.png", weak: 17 },
            { name: "サクリファイス", img: "assets/4-5.png", weak: 20 },
            { name: "サウザンド・アイズ・サクリファイス", img: "assets/4-6.png", weak: 20 }
        ],
        5: [
            { name: "真紅眼の黒竜", img: "assets/extra.png", weak: 20 }
        ]
    },
    bg: {
        1: "assets/bg_stage1.png", 2: "assets/bg_stage2.png", 3: "assets/bg_stage3.png",
        4_1: "assets/bg_stage4_1.png", 4_2: "assets/bg_stage4_2.png", 5: "assets/bg_extra.png"
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

const PACK_DATA = [ { id: "vol1", name: "Vol.1 - Legend", price: 1000, desc: "伝説の始まり。基本魔法カード収録。", unlockStage: 1, img: "assets/packs/vol1.png" } ];

// --- GLOBAL VARIABLES ---
let player = { 
    hp: 100, maxHp: 100, mp: 3, maxMp: 10,
    items: { potion: 0, ether: 0, seed: 0 }, 
    state: { power: false, shield: false, weakLock: false, nextShotMult: 1.0 }, // nextShotMult: 突進用
    deck: [], hand: [], discard: [], deckLocked: false
};
let enemy = { hp: 100, maxHp: 100, data: null, name: "", state: { charge: false, guard: false, guardType: null, guardTurn: 0, atkBuff: 0, isStunned: false } };
let stage=1; floor=1; totalScore=0; totalDarts=0; currentDarts=3;
let displayPlayerHP=100; displayEnemyHP=100;
let isProcessing=false; extraBossTurnCount=0; currentTurn=1;
let dropGuaranteed = false; weakHitCount = 0; let restrictInput = false;
let turnInputs = []; let currentInput = ""; let isJustFinish = false; let waitingForChest = false;
let cheatBuffer = ""; 
let stageStartTurn = 0; let totalGameTurns = 0; let clearedStagesLog = [];

// --- DOM ELEMENTS ---
const elContainer=document.getElementById("game-container"); const elTitle=document.getElementById("title-screen"); const elGame=document.getElementById("game-screen");
const elChapter=document.getElementById("chapter-screen"); const elChapTitle=document.getElementById("chapter-title"); const elChapSub=document.getElementById("chapter-sub");
const elStage=document.getElementById("stage-display"); const elFloor=document.getElementById("floor-display"); const elTurn=document.getElementById("turn-display");
const elBossLabel=document.getElementById("boss-label"); const elEnemyImg=document.getElementById("enemy-img"); const elEnemyName=document.getElementById("enemy-name");
const elWeak=document.getElementById("weak-display");
const elEnemyHP=document.getElementById("enemy-hp"); const elPlayerHP=document.getElementById("player-hp"); 
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
    const winW = window.innerWidth; const winH = window.innerHeight;
    const baseW = 900; const baseH = 620;
    const scale = Math.min(winW / baseW, winH / baseH) * 0.95;
    scaler.style.transform = `scale(${scale})`;
}
window.addEventListener('resize', resizeGame); window.addEventListener('load', resizeGame); setTimeout(resizeGame, 100);

// --- AUDIO FUNCTIONS ---
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

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function spawnEnemy() {
    enemy.state={charge:false,guard:false,guardType:null,guardTurn:0,atkBuff:0,isStunned:false}; player.state={power:false,shield:false,weakLock:false,nextShotMult:1.0};
    currentTurn=1; turnInputs=[]; currentInput=""; restrictInput=false; updateScoreDisplay(); isJustFinish = false; waitingForChest = false; dropGuaranteed = false; weakHitCount=0;
    elContainer.className="container"; elEnemyPanel.className="left-panel"; elBossLabel.style.display="none"; elEnemyImg.style.display = "block"; elChestImg.style.display = "none";

    let bgKey = stage; if (stage === 4) bgKey = floor >= 5 ? "4_2" : "4_1";
    if (GAME_DATA.bg[bgKey]) elContainer.style.backgroundImage = `url('${GAME_DATA.bg[bgKey]}')`; else elContainer.style.backgroundImage = "none";

    // --- ★ Enemy Stats Scaling (Ver 2.2) ---
    let isBoss;
    if (stage === 5) {
        enemy.data = GAME_DATA.enemies[5][0]; isBoss=true; extraBossTurnCount=0; 
        playBGM("bgm-extra"); elContainer.classList.add("extra-mode"); elEnemyPanel.classList.add("extra-border"); 
        elBossLabel.innerText="☠️EXTRA BOSS"; elBossLabel.style.display="inline"; elStage.innerText="EXTRA STAGE"; 
        enemy.maxHp=3000; // Black Dragon HP
    } else if (stage === 4) {
        enemy.data = GAME_DATA.enemies[4][floor-1];
        if (floor === 5) { // Sacrifice
            isBoss = true; playBGM("bgm-boss"); elContainer.classList.add("boss-mode"); 
            elBossLabel.innerText="⚠️BOSS"; elBossLabel.style.display="inline"; 
            enemy.maxHp = 1000;
        } else if (floor === 6) { // Thousand Eyes
            isBoss = true; playBGM("bgm-extra"); elContainer.classList.add("extra-mode"); 
            elBossLabel.innerText="☠️FINAL BOSS"; elBossLabel.style.display="inline"; 
            enemy.maxHp = 1500;
        } else { 
            playBGM("bgm-battle"); isBoss = false;
            enemy.maxHp = 250 + (floor * 50); // Mobs: 300~450
        }
    } else {
        // Stage 1-3 Mobs & Bosses
        isBoss=(floor===5); 
        let list = GAME_DATA.enemies[stage]; enemy.data = list[(floor-1)%list.length]; 
        
        // New scaling: (Base + StageScaling + FloorScaling)
        let baseHp = 100 + ((stage-1)*100); 
        if(isBoss) baseHp += 200; // Boss Bonus
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

// --- ★ New Logic: Card Effects (Ver 2.2) ---
function applyCardEffect(card) {
    let msg = `Card: [${card.name}] `;
    
    if (card.id === 101) { // 死者蘇生
        player.hp = player.maxHp;
        msg += "HP完全回復！";
        playSE("se-heal");
    } else if (card.id === 201) { // サンダーボルト
        const dmg = 100;
        enemy.hp = Math.max(0, enemy.hp - dmg);
        enemy.state.isStunned = true; // スタン追加
        msg += `100ダメ & スタン！`;
        playSE("se-boom");
        triggerEffect(document.getElementById("enemy-panel"), dmg, false);
    } else if (card.id === 202) { // 強欲な壺
        player.mp = Math.min(player.mp + 5, player.maxMp);
        msg += "MP+5 チャージ！";
    } else if (card.id === 301) { // 光の護封剣
        enemy.state.guardType = 'player_cut'; 
        enemy.state.guardTurn = 3;
        msg += "3ターン被ダメ半減！";
    } else if (card.id === 302) { // 落とし穴
        if (enemy.state.charge) {
            enemy.state.charge = false;
            enemy.state.isStunned = true;
            msg += "チャージ解除 & スタン！";
            playSE("se-boom");
        } else {
            msg += "(不発…敵はチャージしていない)";
        }
    } else if (card.id === 303) { // 聖なるバリア
        player.state.shield = true;
        const dmg = 50;
        enemy.hp = Math.max(0, enemy.hp - dmg);
        msg += `完全防御 & 50反撃！`;
        triggerEffect(document.getElementById("enemy-panel"), dmg, false);
    } else if (card.id === 401) { // 火の粉
        const dmg = 20;
        enemy.hp = Math.max(0, enemy.hp - dmg);
        msg += `20ダメージ`;
        triggerEffect(document.getElementById("enemy-panel"), dmg, false);
    } else if (card.id === 402) { // 治療の神
        player.hp = Math.min(player.hp + 50, player.maxHp);
        msg += "HP50回復";
        playSE("se-heal");
    } else if (card.id === 403) { // はさみ撃ち
        const dmg = 80;
        const selfDmg = 20;
        enemy.hp = Math.max(0, enemy.hp - dmg);
        player.hp = Math.max(0, player.hp - selfDmg);
        msg += `敵80ダメ / 自20ダメ`;
        triggerEffect(document.getElementById("enemy-panel"), dmg, false);
        triggerEffect(document.getElementById("player-panel"), selfDmg, true);
    } else if (card.id === 404) { // 大火事
        const dmg = 80;
        enemy.hp = Math.max(0, enemy.hp - dmg);
        msg += `80ダメージ！`;
        playSE("se-attack");
        triggerEffect(document.getElementById("enemy-panel"), dmg, false);
    } else if (card.id === 405) { // 突進
        player.state.nextShotMult = 2.0;
        msg += "次の一投ダメージ2倍！";
    }
    
    addLog(msg, "log-skill");
    animateValue(document.getElementById("enemy-hp"), displayEnemyHP, enemy.hp, 500); displayEnemyHP=enemy.hp;
    animateValue(document.getElementById("player-hp"), displayPlayerHP, player.hp, 500); displayPlayerHP=player.hp;

    if (enemy.hp <= 0) setTimeout(winBattle, 800);
}

// --- ★ Fix: MP Dots & Deck Lock UI ---
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

    // MP Dot Rendering
    const mpContainer = document.getElementById("player-mp-bar");
    mpContainer.innerHTML = ""; // Clear existing dots
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
    
    // Render Hand with Lock Check
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
                let cost = card.cost; // data.jsから取得

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

function updateVisuals() {
    const elPlayerBuff = document.getElementById("player-buff-badge");
    const elPlayerGuard = document.getElementById("player-guard-badge");
    const elEnemyBuff = document.getElementById("enemy-buff-badge");
    const elEnemyGuard = document.getElementById("enemy-guard-badge");
    const elEnemyDrop = document.getElementById("enemy-drop-badge");
    const elEnemyPanel = document.getElementById("enemy-panel");

    if(elPlayerBuff) {
        elPlayerBuff.style.display = (player.state.power || player.state.nextShotMult > 1.0) ? "block" : "none";
        if(player.state.nextShotMult > 1.0) elPlayerBuff.innerText = "NEXT x2"; else elPlayerBuff.innerText = "ATK x1.5";
    }
    if(elPlayerGuard) elPlayerGuard.style.display = player.state.shield ? "block" : "none";
    if(elEnemyBuff) elEnemyBuff.style.display = enemy.state.charge ? "block" : "none";
    if(elEnemyGuard) elEnemyGuard.style.display = (enemy.state.guard || enemy.state.guardType) ? "block" : "none";
    
    if (player.state.weakLock || dropGuaranteed) {
        if(elEnemyDrop) elEnemyDrop.style.display = "block";
        if(elEnemyPanel) elEnemyPanel.classList.add("drop-chance");
    } else {
        if(elEnemyDrop) elEnemyDrop.style.display = "none";
        if(elEnemyPanel) elEnemyPanel.classList.remove("drop-chance");
    }
    
    if (stage !== 5 && elEnemyPanel) {
        elEnemyPanel.classList.remove("mode-charge", "mode-guard");
        if (enemy.state.charge) elEnemyPanel.classList.add("mode-charge");
        if (enemy.state.guard || enemy.state.guardType) elEnemyPanel.classList.add("mode-guard");
    }
}

function showSkillCutin(name, type) { playSE("se-warning"); elCutinText.innerText = name; elCutin.className = ""; if(type==="fire") elCutin.classList.add("cutin-fire"); if(type==="ice") elCutin.classList.add("cutin-ice"); if(type==="earth") elCutin.classList.add("cutin-earth"); if(type==="wind") elCutin.classList.add("cutin-wind"); elCutin.style.display = "flex"; elContainer.classList.add("shake-heavy"); setTimeout(()=>{ elCutin.style.display="none"; elContainer.classList.remove("shake-heavy"); }, 1500); }

// --- ★ New Enemy AI & Boss Gimmicks (Ver 2.2) ---
function enemyTurn() {
    if(enemy.state.isStunned) { addLog(`>> ${enemy.name} は怯んで動けない！`, "log-system"); enemy.state.isStunned = false; endEnemyTurn(); return; }

    // Stage 4: サクリファイス系 (手札破壊)
    if (stage === 4) {
        if (floor === 5) { // サクリファイス
            if (currentTurn % 4 === 0) {
                showSkillCutin("イーター", "earth");
                setTimeout(() => {
                    destroyHandCard(1); // 1枚破壊
                    addLog(">> [イーター] 手札を1枚食べられた！", "log-enemy");
                    doEnemyAttack(1.0, {isDrain: true});
                }, 1200);
                return;
            }
        }
        if (floor === 6) { // サウザンド・アイズ
            if (currentTurn % 3 === 0) {
                showSkillCutin("千眼の呪縛", "wind");
                setTimeout(() => {
                    destroyHandCard(2); // 2枚破壊
                    player.mp = Math.max(0, player.mp - 2);
                    addLog(">> [呪縛] 手札2枚破壊 & MP-2", "log-enemy");
                    doEnemyAttack(1.2);
                }, 1200);
                return;
            }
        }
    }

    // Stage 5: 真紅眼の黒竜
    if (stage === 5) {
        extraBossTurnCount++;
        if (extraBossTurnCount % 3 === 0) {
            showSkillCutin("黒 炎 弾", "fire");
            setTimeout(() => {
                let dmg = 80;
                if (enemy.hp < enemy.maxHp * 0.5) dmg = 120; // 憤激
                addLog(`>> [黒炎弾] 全体焼却 (${dmg}ダメ)`, "log-enemy");
                doEnemyAttack(0, {fixedDmg: dmg, isBossUlt: true});
            }, 1200);
            return;
        }
        // 通常攻撃 (HP半分以下で強化)
        let mult = 1.0;
        if (enemy.hp < enemy.maxHp * 0.5) mult = 1.5;
        doEnemyAttack(mult);
        return;
    }

    // --- Standard AI ---
    // ランダムチャージ攻撃
    if(stage <= 3 && Math.random() < 0.2) {
        enemy.state.charge = true;
        addLog(`>> ${enemy.name} は力を溜めている…`, "log-enemy");
        updateInfo();
        endEnemyTurn();
        return;
    }
    if(enemy.state.charge) {
        enemy.state.charge = false;
        showSkillCutin("強攻撃", "fire");
        setTimeout(() => doEnemyAttack(2.5), 1000);
        return;
    }

    doEnemyAttack(1.0);
}

// Helper: 手札破壊
function destroyHandCard(count) {
    if (player.deckLocked) return;
    for (let i = 0; i < count; i++) {
        if (player.hand.length > 0) {
            const idx = Math.floor(Math.random() * player.hand.length);
            const lostCard = player.hand.splice(idx, 1)[0];
            player.discard.push(lostCard);
        }
    }
    updateInfo();
}

function doEnemyAttack(mult, options = {}) {
    const { ignoreShield = false, isDrain = false, isBossUlt = false, fixedDmg = 0, callback = null } = options;
    
    // ガード判定 (光の護封剣)
    let finalMult = mult;
    if (enemy.state.guardType === 'player_cut') {
        finalMult *= 0.5; // 半減
    }

    // シールド判定
    if (!ignoreShield && player.state.shield) { 
        addLog(`${enemy.name} の攻撃！ → 完全防御！`, "log-skill"); 
        player.state.shield=false; 
        triggerEffect(document.getElementById("player-panel"),0,true); 
        document.getElementById("flash-overlay").className="flash-blue"; 
        setTimeout(()=>document.getElementById("flash-overlay").className="",300); 
        updateInfo(); 
        if(callback) callback(); else endEnemyTurn(); 
        return; 
    }

    let dmg = 0;
    if (fixedDmg > 0) dmg = fixedDmg;
    else {
        // ステージ進行度に応じた基礎ダメージ計算
        const base = 10 + (stage * 5) + (floor * 2); 
        dmg = Math.floor((base + Math.random()*5) * finalMult);
    }
    
    if (enemy.state.guardType === 'player_cut') {
        enemy.state.guardTurn--;
        if (enemy.state.guardTurn <= 0) enemy.state.guardType = null;
    }

    finishAttack(dmg, isDrain, callback);
}

function finishAttack(dmg, isDrain, callback) {
    player.hp = Math.max(0, player.hp-dmg); 
    addLog(`${enemy.name} の攻撃！ ${dmg} ダメージ`, "enemy");
    if(isDrain) { 
        const heal = Math.floor(dmg * 0.5); 
        if(heal > 0) { 
            enemy.hp = Math.min(enemy.hp + heal, enemy.maxHp); 
            addLog(`>> 敵が HP${heal} 吸収した！`, "log-enemy"); 
            animateValue(document.getElementById("enemy-hp"), displayEnemyHP, enemy.hp, 500); 
            displayEnemyHP=enemy.hp; 
        } 
    }
    triggerEffect(document.getElementById("player-panel"), dmg, true); 
    animateValue(document.getElementById("player-hp"), displayPlayerHP, player.hp, 500); 
    displayPlayerHP=player.hp; 
    updateInfo();
    
    if(player.hp<=0) setTimeout(loseBattle,1000); 
    else { if(callback) callback(); else endEnemyTurn(); }
}

function endEnemyTurn() { 
    currentTurn++; 
    player.mp = Math.min(player.mp + 3, player.maxMp); 
    updateInfo(); 
    isProcessing=false; 
}

function winBattle() {
    addLog(`${enemy.name} を倒した`, "system");
    if (isJustFinish) { player.maxHp += 10; const oldHP = player.hp; player.hp = Math.min(player.hp + 10, player.maxHp); playSE("se-heal"); addLog(`★JUST FINISH! MaxHP+10 & HP+10`, "heal"); animateValue(elPlayerHP, oldHP, player.hp, 500); updateInfo(); setTimeout(() => { showDialog("JUST FINISH BONUS!!", `見事！ピッタリで倒した！<br>最大HPが ${player.maxHp} にアップ！<br>HPも10回復した。`, "clear", [{text:"OK", action:checkDrop}]); }, 800); } else { setTimeout(checkDrop, 800); }
}
function checkDrop() {
    if(stage === 5) { nextStep(); return; }
    if(stage === 4 && floor === 6) { nextStep(); return; }
    const isBoss = (floor === 5 || (stage===4 && floor===6)); let dropRate = isBoss ? 1.0 : 0.3; if (dropGuaranteed) dropRate = 1.0;
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

        let pendingBonusDP = dpBonus;
        clearedStagesLog.forEach(log => { pendingBonusDP += log.dp; });
        let potentialTotalDP = scoreDP + pendingBonusDP;

        clearedStagesLog.push({ stage: stage, rank: rank, dp: dpBonus });

        const currentBest = savedData.bestRanks[stage];
        const ranksOrder = ["SSS", "S", "A", "B", "C"];
        if (!currentBest || ranksOrder.indexOf(rank) < ranksOrder.indexOf(currentBest)) {
            savedData.bestRanks[stage] = rank;
        }

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

        let title = "STAGE CLEAR";
        let msg = `STAGE ${stage} COMPLETED!<br>RANK: <span style="font-size:24px;color:${getRankColor(rank)};">${rank}</span><br><br>現在の獲得予定DP: <span style="color:#ffd700; font-weight:bold;">${potentialTotalDP} DP</span>`;

        const btnNext = { text: "⛺ 次へ進む (繰越)", action: () => {
            player.hp = Math.min(player.hp + 30, player.maxHp);
            initGameSession(stage + 1, true);
        } };

        const btnExtra = { text: "⚠️ EXTRA STAGE", action: () => {
            player.hp = Math.min(player.hp + 30, player.maxHp);
            initGameSession(5, true);
        } };

        const btnReturn = { text: "🏠 帰還する (確定)", action: () => {
            const res = finishSession("RETURN", parseFloat(ppr));
            showDialog("MISSION COMPLETE", `帰還しました。<br><br><span style="color:#ffd700; font-size:24px; font-weight:bold;">GET DP: +${res.gainedDP}</span>`, "clear", [{text:"TITLE", action:returnToTitle}]);
        } };

        let buttons = [];
        if (stage === 3) {
            if (parseFloat(ppr) >= 70.0) {
                msg += "<br><br><span style='color:#ff0000;'>強力な反応を感知...挑戦しますか？</span>";
                buttons = [btnExtra, btnReturn];
            } else {
                msg += "<br><br>全てのエリアを踏破した！";
                buttons = [{ text: "🏠 ALL CLEAR", action: () => {
                    const res = finishSession("WIN", parseFloat(ppr));
                    showDialog("ALL CLEAR!", `おめでとうございます！<br><br><span style="color:#ffd700; font-size:24px; font-weight:bold;">GET DP: +${res.gainedDP}</span>`, "clear", [{text:"TITLE", action:returnToTitle}]);
                } }];
            }
        } else {
            buttons = [btnNext, btnReturn];
        }

        showDialog(title, msg, "clear", buttons);

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

function triggerEffect(el, dmg, isP, isWeak=false) {
    el.classList.remove("shake-small", "shake-medium", "shake-heavy", "shake-ultimate"); void el.offsetWidth;
    if(dmg >= 150) { el.classList.add("shake-ultimate"); playSE("se-boom"); elOverlay.className = "flash-gold"; setTimeout(()=>elOverlay.className="", 800); }
    else if(dmg >= 60) { el.classList.add("shake-heavy"); playSE("se-boom"); elOverlay.className = isP ? "flash-red" : "flash-white"; setTimeout(()=>elOverlay.className="", 300); }
    else { el.classList.add(dmg>=30 ? "shake-medium" : "shake-small"); playSE("se-hit"); }
    const pop = document.createElement("div"); pop.innerText=dmg; if(dmg >= 150) pop.className="damage-popup dmg-ultimate"; else if(dmg >= 60) pop.className="damage-popup dmg-heavy"; else if(dmg >= 30) pop.className="damage-popup dmg-medium"; else pop.className="damage-popup dmg-small";
    pop.style.left="50%"; pop.style.top="50%"; el.appendChild(pop); setTimeout(()=>pop.remove(),1500);
}
function animateValue(obj, s, e, d) { if(obj) obj.innerHTML = e; }
function addLog(t, type="") { const d=document.createElement("div"); d.innerHTML=t; if(type) d.className="log-"+type; elLog.prepend(d); }

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
    { id: 101, name: "死者蘇生", rarity: "UR", type: "MAGIC", cost: 8, desc: "HPを完全回復する" },
    
    // SR (8%)
    { id: 201, name: "サンダー・ボルト", rarity: "SR", type: "MAGIC", cost: 6, desc: "敵に100ダメージ + スタン(1回休み)" },
    { id: 202, name: "強欲な壺", rarity: "SR", type: "MAGIC", cost: 0, desc: "MPを5回復する" },

    // R (30%)
    { id: 301, name: "光の護封剣", rarity: "R", type: "MAGIC", cost: 5, desc: "3ターンの間、受けるダメージを半減" },
    { id: 302, name: "落とし穴", rarity: "R", type: "TRAP", cost: 3, desc: "敵のチャージを解除しスタンさせる" },
    { id: 303, name: "聖なるバリア", rarity: "R", type: "TRAP", cost: 4, desc: "1ターン攻撃無効化 + 敵に50反撃" },

    // N (60%)
    { id: 401, name: "火の粉", rarity: "N", type: "MAGIC", cost: 1, desc: "敵に20ダメージ" },
    { id: 402, name: "治療の神", rarity: "N", type: "MAGIC", cost: 4, desc: "HPを50回復する" },
    { id: 403, name: "はさみ撃ち", rarity: "N", type: "TRAP", cost: 2, desc: "敵に80ダメージ、自分に20ダメージ" },
    { id: 404, name: "昼夜の大火事", rarity: "N", type: "MAGIC", cost: 3, desc: "敵に80ダメージ" },
    { id: 405, name: "突進", rarity: "N", type: "MAGIC", cost: 2, desc: "次の一投のダメージが2倍になる" }
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