console.log("★ main.js is loaded! (v2.3.1 UI Polish)");

// --- ★ GAME DATA CONFIG ★ ---
const GAME_DATA = {
    enemies: {
        1: [
            { name: "プチモス", img: "assets/1-1.png", weak: 20 },
            { name: "ラーバモス", img: "assets/1-2.png", weak: 19 },
            { name: "進化の繭", img: "assets/1-3.png", weak: 18, hp: 260 },
            { name: "グレート・モス", img: "assets/1-4.png", weak: 17, hp: 290 },
            { name: "究極完全態・グレート・モス", img: "assets/1-5.png", weak: 20, hp: 420 }
        ],
        2: [
            { name: "トラコドン", img: "assets/2-1.png", weak: 19 },
            { name: "ワイルド・ラプター", img: "assets/2-2.png", weak: 18, hp: 280 },
            { name: "屍を貪る竜", img: "assets/2-3.png", weak: 17, hp: 310 },
            { name: "二頭を持つキング・レックス", img: "assets/2-4.png", weak: 20, hp: 340 },
            { name: "剣竜", img: "assets/2-5.png", weak: 19, hp: 540 }
        ],
        3: [
            { name: "デュナミス・ヴァルキリア", img: "assets/3-1.png", weak: 20, hp: 300 },
            { name: "ハーピィ・レディ", img: "assets/3-2.png", weak: 19, hp: 330 },
            { name: "ハーピィ・レディ・SB", img: "assets/3-3.png", weak: 18, hp: 360 },
            { name: "ハーピィ・レディ三姉妹", img: "assets/3-4.png", weak: 17, hp: 390 },
            { name: "ハーピィズペット竜", img: "assets/3-5.png", weak: 20, hp: 550 }
        ],
        4: [
            { name: "ダーク・ラビット", img: "assets/4-1.png", weak: 20, hp: 380 },
            { name: "デビル・ボックス", img: "assets/4-2.png", weak: 19, hp: 420 },
            { name: "トゥーン・デーモン", img: "assets/4-3.png", weak: 18, hp: 460 },
            { name: "ブルーアイズ・トゥーン・ドラゴン", img: "assets/4-4.png", weak: 17, hp: 500 },
            { name: "サクリファイス", img: "assets/4-5.png", weak: 20, hp: 550 },
            { name: "サウザンド・アイズ・サクリファイス", img: "assets/4-6.png", weak: 20, hp: 800 }
        ],
        5: [
            { name: "真紅眼の黒竜", img: "assets/extra.png", weak: 20, hp: 1500 }
        ],
        6: [
            { name: "ワームドレイク", img: "assets/5-1.png", weak: 19, hp: 400 },
            { name: "ヒューマノイド・スライム", img: "assets/5-2.png", weak: 18, hp: 450 },
            { name: "リバイバルスライム", img: "assets/5-3.png", weak: 20, hp: 300 },
            { name: "ヒューマノイド・ドレイク", img: "assets/5-4.png", weak: 17, hp: 600 },
            { name: "オシリスの天空竜", img: "assets/5-5.png", weak: 20, hp: 2000 }
        ]
    },
    bg: {
        1: "assets/bg_stage1.png",
        2: "assets/bg_stage2.png",
        3: "assets/bg_stage3.png",
        4_1: "assets/bg_stage4_1.png",
        4_2: "assets/bg_stage4_2.png",
        5: "assets/bg_extra.png",
        6: "assets/bg_stage5_1.png"
    }
};

const CARD_DB = [
    // Vol.1
    { id: 101, name: "死者蘇生", rarity: "UR", type: "MAGIC", cost: 8, desc: "HPを最大値まで完全回復" },
    { id: 201, name: "サンダー・ボルト", rarity: "SR", type: "MAGIC", cost: 6, desc: "敵に100ダメージ＋スタン(1T行動不能)" },
    { id: 202, name: "強欲な壺", rarity: "SR", type: "MAGIC", cost: 0, desc: "MPを5回復する(上限10)" },
    { id: 301, name: "光の護封剣", rarity: "R", type: "MAGIC", cost: 5, desc: "3ターンの間、受けるダメージを半減" },
    { id: 302, name: "落とし穴", rarity: "R", type: "TRAP", cost: 3, desc: "敵のチャージ状態を強制解除" },
    { id: 303, name: "聖なるバリア", rarity: "R", type: "TRAP", cost: 4, desc: "次の敵の攻撃を無効化し、50ダメージ与える" },
    { id: 401, name: "火の粉", rarity: "N", type: "MAGIC", cost: 1, desc: "敵に20ダメージ" },
    { id: 402, name: "治療の神", rarity: "N", type: "MAGIC", cost: 4, desc: "HPを50回復" },
    { id: 403, name: "はさみ撃ち", rarity: "N", type: "TRAP", cost: 2, desc: "自分も20ダメージ受け、敵に80ダメージ" },
    { id: 404, name: "昼夜の大火事", rarity: "N", type: "MAGIC", cost: 3, desc: "敵に80ダメージ" },
    { id: 405, name: "突進", rarity: "N", type: "MAGIC", cost: 2, desc: "攻撃力2倍(次の1投のみ)" },

    // Vol.2
    // ★ v2.3.1 Balance Change: Cost 4 -> 1
    { id: 501, name: "天使の施し", rarity: "UR", type: "MAGIC", cost: 1, desc: "手札を1枚選んで捨て、カードを2枚引く。" },
    { id: 601, name: "ブラック・ホール", rarity: "SR", type: "MAGIC", cost: 7, desc: "敵に150ダメージ。ただし自分の手札を全て捨てる。" },
    { id: 602, name: "魔法の筒", rarity: "SR", type: "TRAP", cost: 4, desc: "敵の攻撃を無効化し、そのダメージをそのまま敵に与える。" },
    { id: 701, name: "巨大化", rarity: "R", type: "MAGIC", cost: 3, desc: "HP半分以下なら3倍、半分以上なら0.5倍" },
    { id: 702, name: "地割れ", rarity: "R", type: "MAGIC", cost: 3, desc: "敵に40ダメージを与え、防御状態を解除する。" },
    { id: 703, name: "六芒星の呪縛", rarity: "R", type: "TRAP", cost: 3, desc: "敵の攻撃力を半減させ、さらにスタンさせる。" },
    { id: 801, name: "守備封じ", rarity: "N", type: "MAGIC", cost: 1, desc: "敵の防御状態を解除する。" },
    { id: 802, name: "火あぶりの刑", rarity: "N", type: "MAGIC", cost: 2, desc: "敵に40ダメージ。" },
    { id: 803, name: "援軍", rarity: "N", type: "MAGIC", cost: 2, desc: "HPを30回復し、攻撃力を+20する(次の1投)。" },
    { id: 804, name: "闇の仮面", rarity: "N", type: "MAGIC", cost: 4, desc: "捨て札からランダムに魔法カードを1枚手札に加える。" },
    { id: 805, name: "最終戦争", rarity: "N", type: "MAGIC", cost: 5, desc: "敵に150ダメージ、自分に50ダメージ。" }
];

const PACK_DATA = [
    { 
        id: "vol1", 
        name: "Vol.1 - Legend", 
        price: 1000, 
        desc: "伝説の始まり。基本魔法カード収録。", 
        unlockStage: 1,
        img: "assets/packs/vol1.png"
    },
    { 
        id: "vol2", 
        name: "Vol.2 - Awakening", 
        price: 1500, 
        desc: "テクニカルな戦略カードが登場。", 
        unlockStage: 3, 
        img: "assets/packs/vol2.png" 
    }
];

// --- Player State ---
let player = { 
    hp: 100, maxHp: 100, mp: 3, maxMp: 10,
    items: { potion: 0, ether: 0, seed: 0 }, 
    state: { power: false, shield: false, weakLock: false, barrier: false, guardTurn: 0, magicCylinder: false, hexSeal: false, huge: 0, atkBonus: 0, itemLock: false },
    deck: [], hand: [], discard: [], deckLocked: false
};

// --- Enemy State ---
let enemy = { 
    hp: 100, maxHp: 100, data: null, name: "", 
    state: { charge: false, guard: false, guardType: null, guardTurn: 0, atkBuff: 0, isStunned: false } 
};

// --- Global Variables ---
let stage=1; floor=1; totalScore=0; totalDarts=0;
let displayPlayerHP=100; displayEnemyHP=100;
let isProcessing=false; extraBossTurnCount=0; currentTurn=1;
let dropGuaranteed = false; weakHitCount = 0; let restrictInput = false;
let turnInputs = []; let currentInput = ""; let isJustFinish = false; let waitingForChest = false;
let cheatBuffer = ""; 
let stageStartTurn = 0;
let totalGameTurns = 0;
let clearedStagesLog = [];
let currentBgmId = "";

const DECK_SIZE = 20; 
const HAND_SIZE = 5;
const INITIAL_HAND = 3;

// --- Save System ---
const SAVE_KEY = "darts_quest_save";
let allSaveData = { "slot1": null, "slot2": null, "slot3": null, "lastPlayed": 1 };
let currentSlot = "slot1";
let savedData = { highScore: { stage: 1, floor: 1, avg: 0.0 }, history: [], clearedExtra: false, dp: 0, bestRanks: {}, unlockedStage4: false, deck: [], cards: {} };

// --- DOM Elements ---
const el = (id) => document.getElementById(id);

// --- Helper Functions ---
function calculateRating(ppr) { 
    if(ppr < 30) return 1; if(ppr < 40) return 2; if(ppr < 45) return 3; if(ppr < 50) return 4; 
    if(ppr < 55) return 5; if(ppr < 60) return 6; if(ppr < 65) return 7; if(ppr < 70) return 8; 
    if(ppr < 75) return 9; if(ppr < 80) return 10; if(ppr < 85) return 11; if(ppr < 90) return 12; 
    if(ppr < 95) return 13; if(ppr < 100) return 14; if(ppr < 110) return 15; if(ppr < 120) return 16; 
    if(ppr < 130) return 17; return 18; 
}

// --- Initialization ---
window.addEventListener('resize', resizeGame);
window.addEventListener('load', () => {
    resizeGame();
    loadGameData();
    initSlotScreen();
});

function resizeGame() {
    const scaler = el('game-scaler');
    const winW = window.innerWidth; const winH = window.innerHeight;
    const baseW = 900; const baseH = 620;
    const scale = Math.min(winW / baseW, winH / baseH) * 0.95;
    if(scaler) scaler.style.transform = `scale(${scale})`;
}

function loadGameData() {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) { try { allSaveData = JSON.parse(saved); } catch(e) { console.error(e); } }
    if(!allSaveData.slot1) allSaveData.slot1 = null;
    if(!allSaveData.slot2) allSaveData.slot2 = null;
    if(!allSaveData.slot3) allSaveData.slot3 = null;
}

function saveToDrive() { 
    allSaveData[currentSlot] = savedData; 
    localStorage.setItem(SAVE_KEY, JSON.stringify(allSaveData));
}

// --- Slot & Title Logic ---
function initSlotScreen() {
    for(let i=1; i<=3; i++) {
        const key = "slot"+i; const data = allSaveData[key];
        const infoEl = el("info-"+i);
        if(!data) { infoEl.innerHTML = "<div class='slot-empty'>NO DATA<br>- Start New Game -</div>"; }
        else {
            let stgName = `STAGE ${data.highScore.stage}`;
            if(data.highScore.stage === 5) stgName = "EXTRA";
            if(data.highScore.stage === 6) stgName = "STAGE 5";
            
            let stg = `${stgName} - ${data.highScore.floor}F`;
            let badge = data.clearedExtra ? "<br><span style='color:#f0f;font-weight:bold;'>★ EXTRA CLEARED</span>" : "";
            infoEl.innerHTML = `<div>${stg}</div><div style='color:#ffdd00;'>Avg: ${data.highScore.avg.toFixed(1)} (Rt ${calculateRating(data.highScore.avg)})</div><div style='color:#aaa;font-size:12px;'>DP: ${data.dp || 0}${badge}</div>`;
        }
    }
}

function selectSlot(n) {
    currentSlot = "slot"+n;
    if(!allSaveData[currentSlot]) { 
        allSaveData[currentSlot] = { highScore: { stage: 1, floor: 1, avg: 0.0 }, history: [], clearedExtra: false, dp: 0, bestRanks: {}, unlockedStage4: false, deck: [], cards: {} }; 
    }
    savedData = allSaveData[currentSlot];
    if(!savedData.deck) savedData.deck = [];
    if(!savedData.cards) savedData.cards = {};
    
    allSaveData.lastPlayed = n;
    updateTitleScore();
    playSE("se-tap");
    playBGM("bgm-title");
    el("slot-screen").style.display = "none";
    el("title-screen").style.display = "flex";
}

function backToSlots() {
    stopAllBGM();
    el("title-screen").style.display = "none";
    el("slot-screen").style.display = "flex";
    initSlotScreen();
}

function updateTitleScore() {
    let stg = `STAGE ${savedData.highScore.stage}`;
    if(savedData.highScore.stage === 5) stg = "EXTRA";
    if(savedData.highScore.stage === 6) stg = "STAGE 5";

    el("hs-reach").innerText = `${stg} - ${savedData.highScore.floor}F`;
    el("hs-avg").innerText = savedData.highScore.avg.toFixed(1);
    el("hs-rt").innerText = "Rt " + calculateRating(savedData.highScore.avg);
    el("dp-display").innerText = "DP: " + (savedData.dp || 0);

    updateStageButton(1, "btn-st1");
    updateStageButton(2, "btn-st2");
    updateStageButton(3, "btn-st3");
    
    const canPlayStage4 = savedData.unlockedStage4 || (savedData.bestRanks && savedData.bestRanks[3]) || savedData.clearedExtra;
    el("btn-stage4").style.display = canPlayStage4 ? "flex" : "none";
    updateStageButton(4, "btn-stage4");

    const canPlayStage5 = (savedData.bestRanks && savedData.bestRanks[4]);
    el("btn-stage5").style.display = canPlayStage5 ? "flex" : "none";
    updateStageButton(6, "btn-stage5"); 

    el("btn-extra").style.display = savedData.clearedExtra ? "flex" : "none";
    updateStageButton(5, "btn-extra");
}

function updateStageButton(stgNum, btnId) {
    const btn = el(btnId);
    if(!btn) return;
    const rank = savedData.bestRanks ? savedData.bestRanks[stgNum] : null;
    
    btn.className = "stage-btn btn-default";
    if(stgNum===4) btn.classList.add("stage4-btn");
    if(stgNum===5) btn.classList.add("extra-btn");
    if(stgNum===6) btn.classList.add("stage5-btn"); 

    if(rank) {
        btn.classList.remove("btn-default", "stage4-btn", "stage5-btn", "extra-btn");
        if(rank === "SSS") btn.classList.add("btn-prism");
        else if(rank === "S") btn.classList.add("btn-gold");
        else if(rank === "A") btn.classList.add("btn-silver");
        else btn.classList.add("btn-copper");
    }
}

// --- Game Logic: Start & Setup ---
function initGameSession(startStage, continueMode=false) {
    if (!continueMode) {
        player.hp = 100; player.maxHp = 100; player.mp = 3; 
        player.items = { potion: 0, ether: 0, seed: 0 };
        totalGameTurns = 0; totalScore = 0; totalDarts = 0;
        clearedStagesLog = [];
    }
    startTransition(startStage, continueMode);
}

function startTransition(sel, continueMode) {
    let t="STAGE "+sel; let s=""; let warning=false;
    if(sel===1) { t="旅立ちの森"; s="Forest of Beginnings"; }
    if(sel===2) { t="荒れ狂う荒野"; s="Raging Wasteland"; }
    if(sel===3) { t="誘惑の迷宮"; s="Labyrinth of Temptation"; }
    if(sel===4) { t="幻想の狂宴"; s="Toon Nightmare"; warning=true; }
    if(sel===5) { t="燃えたぎる火口"; s="Burning Crater"; warning=true; } 
    if(sel===6) { t="神の試練"; s="God's Testing Ground"; warning=true; } 

    el("chapter-title").innerText = t; 
    el("chapter-sub").innerText = s;
    const ch = el("chapter-screen");
    
    if(warning) { playSE("se-warning"); ch.classList.add("chapter-extra"); } 
    else { playSE("se-tap"); ch.classList.remove("chapter-extra"); }
    
    el("black-curtain").classList.add("fade-in");
    
    setTimeout(() => {
        el("title-screen").style.display="none";
        ch.style.display="flex"; ch.style.opacity=1;
        
        setupStage(sel, continueMode);
        
        setTimeout(() => {
            ch.style.opacity=0;
            setTimeout(()=>{
                ch.style.display="none";
                el("black-curtain").classList.remove("fade-in");
                checkOpeningSkill(); 
            }, 1000);
        }, warning ? 4000 : 2500);
    }, 1000);
}

function setupStage(sel, continueMode) {
    stage=sel; floor=1; isProcessing=false; extraBossTurnCount=0; currentTurn=1;
    stageStartTurn = totalGameTurns; 

    el("avg-display").innerText="0.0"; 
    el("rt-display").innerText="(Rt -)"; 
    el("battle-log").innerHTML=""; 
    el("game-screen").style.display="block";
    
    player.state={power:false,shield:false,weakLock:false,barrier:false,guardTurn:0, magicCylinder:false, hexSeal:false, huge:0, atkBonus:0, itemLock:false}; 
    
    if (!continueMode) {
        player.mp = 3; 
        player.deckLocked = false; 
        if (!savedData.deck || savedData.deck.length < DECK_SIZE) {
            player.deckLocked = true;
            player.deck = []; player.hand = []; player.discard = [];
            addLog(`⚠ デッキ不完全(${DECK_SIZE}枚未満): カード機能封鎖`, "log-system");
        } else {
            player.deck = shuffleArray([...savedData.deck]); 
            player.hand = []; player.discard = [];
            for(let i=0; i<INITIAL_HAND; i++) drawCard(true); 
        }
    } else {
        addLog(">> 前ステージの状態を引き継ぎました", "log-system");
    }

    spawnEnemy();
    let logStageName = "STAGE " + stage;
    if(stage === 5) logStageName = "EXTRA";
    if(stage === 6) logStageName = "STAGE 5";
    addLog(`${logStageName} START!`, "system"); 
    resizeGame();
}

function spawnEnemy() {
    try {
        enemy.state={charge:false,guard:false,guardType:null,guardTurn:0,atkBuff:0,isStunned:false}; 
        player.state.power=false; player.state.shield=false; player.state.weakLock=false; player.state.barrier=false; 
        player.state.guardTurn = 0; player.state.magicCylinder = false; player.state.hexSeal = false; player.state.huge = 0; player.state.atkBonus = 0;
        
        currentTurn=1; turnInputs=[]; currentInput=""; restrictInput=false; 
        updateScoreDisplay(); isJustFinish = false; waitingForChest = false; dropGuaranteed = false; weakHitCount=0;
        
        el("flash-overlay").className = ""; 
        el("game-container").classList.remove("shake-heavy", "shake-medium", "shake-small");

        el("game-container").className="container"; 
        el("enemy-panel").className="left-panel"; 
        el("boss-label").style.display="none"; 
        el("enemy-img").style.display = "block"; 
        el("chest-img").style.display = "none";

        let bgKey = stage; 
        if (stage === 4) bgKey = floor >= 5 ? "4_2" : "4_1";
        if (stage === 6) bgKey = 6; 
        if (GAME_DATA.bg[bgKey]) el("game-container").style.backgroundImage = `url('${GAME_DATA.bg[bgKey]}')`;

        let isBoss = false;
        
        if (stage === 5) { // Extra
            enemy.data = GAME_DATA.enemies[5][0]; isBoss=true; 
            playBGM("bgm-extra"); 
            el("game-container").classList.add("extra-mode"); 
            el("enemy-panel").classList.add("extra-border"); 
            el("boss-label").innerText="☠️EXTRA BOSS"; el("boss-label").style.display="inline"; 
            enemy.maxHp=1500; 
        } else if (stage === 6) { // Stage 5 (God)
            let list = GAME_DATA.enemies[6];
            enemy.data = list[(floor-1)%list.length]; 
            if(floor === 5) {
                isBoss=true; playBGM("bgm-extra");
                el("game-container").classList.add("extra-mode");
                el("boss-label").innerText="☠️GOD降臨"; el("boss-label").style.display="inline";
                enemy.maxHp=2000;
            } else {
                playBGM("bgm-boss"); 
                el("game-container").classList.remove("boss-mode", "extra-mode"); 
                el("boss-label").style.display="none";
                enemy.maxHp = enemy.data.hp || 500; 
            }
        } else {
            let list = GAME_DATA.enemies[stage];
            enemy.data = list[(floor-1)%list.length]; 
            
            if(stage===4 && floor===6) {
                isBoss=true; playBGM("bgm-extra");
                el("game-container").classList.add("extra-mode"); 
                el("boss-label").innerText="☠️FINAL BOSS"; el("boss-label").style.display="inline";
                enemy.maxHp = 800; 
            } else if(floor===5 || (stage===4 && floor===5)) {
                isBoss=true; playBGM("bgm-boss");
                el("game-container").classList.add("boss-mode"); 
                el("enemy-panel").classList.add("boss-border");
                el("boss-label").innerText="⚠️BOSS"; el("boss-label").style.display="inline";
                const base=100+((stage-1)*50); const bonus=(floor-1)*30; enemy.maxHp=base+bonus+50;
            } else {
                playBGM("bgm-battle");
                const base=100+((stage-1)*50); const bonus=(floor-1)*30; enemy.maxHp=base+bonus;
            }
        }

        if(enemy.data.hp) enemy.maxHp = enemy.data.hp;

        enemy.name=enemy.data.name; 
        el("enemy-img").src=enemy.data.img; 
        enemy.hp=enemy.maxHp; 
        displayEnemyHP=enemy.hp; 
        updateInfo();
        
        if(stage===6 && floor===5) addLog(`>>> 天空より雷鳴と共に ${enemy.name} が現れた！`, "log-skill"); 
        else if (stage===6) addLog(`=== STAGE 5 - ${floor}F ===`, "system");
        else addLog(`=== STAGE ${stage} - ${floor}F ===`, "system");

        isProcessing = false;
        
    } catch(e) {
        console.error("Spawn Error:", e);
        isProcessing = false;
    }
}

function checkOpeningSkill() {
    if(stage === 3 && floor === 1) {
        setTimeout(() => {
            showSkillCutin("護封剣の加護", "gold");
            setTimeout(() => {
                enemy.state.guardType = 'cut'; 
                enemy.state.guardTurn = 3;
                addLog(">> 先制行動: 敵が光の護封剣(3T)を展開！", "log-enemy");
                updateInfo();
            }, 1200);
        }, 500);
    }
}

// --- Battle Action Logic ---
function handleEnter() {
    if(isProcessing) return;
    if (currentInput !== "") {
        const val = parseInt(currentInput);
        if (!isNaN(val)) { 
            if (val < 0 || val > 60) { alert("単発の最大値は 60 (T20) です"); currentInput=""; updateScoreDisplay(); return; } 
            playSE("se-tap"); turnInputs.push(val); currentInput = ""; 
            if (restrictInput || turnInputs.length === 3) executeAttack(); else updateScoreDisplay(); 
        }
    } else { if (turnInputs.length > 0) executeAttack(); }
}

function executeAttack() {
    isProcessing = true; let totalScoreInTurn = 0; let weakHitInThisTurn = 0;
    
    let calculatedTotalDmg = 0;
    
    turnInputs.forEach((s, index) => {
        let singleDmg = s;
        
        if (stage === 6 && floor === 5) {
            if (singleDmg <= 20) {
                singleDmg = 0;
            }
        }

        if (player.state.atkBonus > 0) {
            singleDmg += player.state.atkBonus;
            player.state.atkBonus = 0;
        }

        if (player.state.power) {
            singleDmg = Math.floor(singleDmg * 2.0);
            player.state.power = false;
        }
        
        if (player.state.huge !== 0) {
            if (player.state.huge === 1) singleDmg = Math.floor(singleDmg * 3.0);
            else singleDmg = Math.floor(singleDmg * 0.5);
            player.state.huge = 0;
        }
        
        calculatedTotalDmg += singleDmg;
        
        if (player.state.weakLock || (s >= 51 && enemy.data.weak && (s % enemy.data.weak === 0))) weakHitInThisTurn++;
    });
    
    if (stage === 6 && floor === 5 && calculatedTotalDmg === 0 && turnInputs.reduce((a,b)=>a+b,0) > 0) {
         playSE("se-warning"); addLog(">> 召雷弾！ 弱い攻撃(20以下)は無効化された！", "log-enemy");
    }

    let totalScoreInTurnRaw = 0;
    turnInputs.forEach(s => totalScoreInTurnRaw += s);

    if (stage === 4 && floor === 6 && currentTurn % 2 === 0 && totalScoreInTurnRaw < 80) {
        playSE("se-warning"); addLog(">> 結界に阻まれた！(80点未満無効)", "log-enemy"); calculatedTotalDmg = 0;
    }

    playSE("se-attack"); totalGameTurns++;
    totalScore += totalScoreInTurnRaw; totalDarts += turnInputs.length; 

    let finalDmg = calculatedTotalDmg;
    if (stage === 4 && floor === 4 && currentTurn % 3 === 0) { finalDmg = Math.max(0, finalDmg - 50); }
    if (enemy.state.guardType === 'cut') { finalDmg = Math.floor(finalDmg * 0.8); addLog("護封剣で軽減(20%)！", "system"); }
    if (enemy.state.guardType === 'half') { finalDmg = Math.floor(finalDmg * 0.5); addLog("護封剣で半減(50%)！", "system"); }
    if (enemy.state.guard) { finalDmg = Math.floor(finalDmg / 2); enemy.state.guard = false; addLog("敵の防御で半減！", "system"); }

    let remaining = enemy.hp - finalDmg; if (remaining === 0) isJustFinish = true; enemy.hp = Math.max(0, remaining);

    if (weakHitInThisTurn > 0) {
        dropGuaranteed = true; weakHitCount += weakHitInThisTurn; 
        addLog(`★ WEAK HIT x${weakHitInThisTurn}!!`, "log-weak");
        if(!player.state.weakLock) { 
            if(el("se-weak")) playSE("se-weak"); 
            el("flash-overlay").className = "flash-purple"; 
            setTimeout(()=>el("flash-overlay").className="", 600); 
        }
    }
    if(player.state.weakLock) { player.state.weakLock = false; addLog("Weak Lock 効果終了", "log-system"); }

    addLog(`攻撃！ ${finalDmg} ダメージ (${turnInputs.join('+')})`);
    triggerEffect(el("enemy-panel"), finalDmg, false);
    animateValue(el("enemy-hp-value"), displayEnemyHP, enemy.hp, 500); displayEnemyHP=enemy.hp; 
    
    if (player.state.itemLock) {
        player.state.itemLock = false;
        addLog("封印が解除された", "log-system");
    }
    updateInfo();
    
    if (restrictInput) { restrictInput = false; addLog("束縛が解けた！", "log-system"); }
    if (enemy.state.guardType) { 
        enemy.state.guardTurn--; 
        if(enemy.state.guardTurn<=0) { enemy.state.guardType=null; addLog("敵の護封剣が消滅した", "log-system"); } 
    }
    
    turnInputs = []; currentInput = ""; updateScoreDisplay();
    if(enemy.hp<=0) setTimeout(winBattle, 1000); else setTimeout(enemyTurn, 1000);
}

// --- ★ CARD LOGIC (v2.0 Overhaul) ★ ---
function drawCard(isSilent = false) {
    if (player.deck.length === 0) return;
    if (player.hand.length >= HAND_SIZE) return;
    
    const cardId = player.deck.pop();
    player.hand.push(cardId);
    
    if (!isSilent) triggerFloatText("DRAW!", el("hand-area")); 
    
    updateInfo();
}

function playHandCard(index) {
    if(isProcessing || waitingForChest) return;
    
    if (player.state.itemLock) {
        addLog(">> 封印されていて使えない！", "log-system");
        playSE("se-warning");
        return;
    }

    const cardId = player.hand[index];
    const card = CARD_DB.find(c => c.id === cardId);
    let cost = (card.cost !== undefined) ? card.cost : 99;

    if (player.mp < cost) {
        addLog(`MPが足りません！(必要: ${cost})`, "log-system");
        playSE("se-warning");
        return;
    }
    
    // ★ v2.3.1: Hide tooltip when played
    hideTooltip();

    if (card.id === 501) {
        if (player.hand.length <= 1) { 
             addLog("捨てる手札がありません！", "log-system");
             return;
        }
        openDiscardSelector(index, cost);
        return;
    }

    player.mp -= cost;
    playSE("se-buff");
    applyCardEffect(card);

    player.hand.splice(index, 1);
    player.discard.push(cardId);
    
    updateInfo();
}

// Special Selector for Discarding
let pendingCardIndex = -1;
let pendingCardCost = 0;

function openDiscardSelector(cardIndex, cost) {
    pendingCardIndex = cardIndex;
    pendingCardCost = cost;
    
    const discardCandidates = [];
    player.hand.forEach((cid, idx) => {
        if (idx !== cardIndex) {
            const c = CARD_DB.find(cd => cd.id === cid);
            discardCandidates.push({ id: cid, name: c.name, originalIndex: idx });
        }
    });
    
    const modal = el("card-selector-modal");
    const grid = el("cs-grid");
    grid.innerHTML = "";
    
    discardCandidates.forEach(item => {
        const div = document.createElement("div");
        div.className = "collection-card";
        div.style.width = "60px"; div.style.height = "90px";
        div.innerHTML = `<div class="card-art"><img src="assets/cards/${item.id}.png"></div>`;
        div.onclick = () => executeDiscardAndEffect(item.originalIndex);
        grid.appendChild(div);
    });
    
    modal.style.display = "flex";
}

function closeCardSelector() {
    el("card-selector-modal").style.display = "none";
    pendingCardIndex = -1;
}

function executeDiscardAndEffect(discardIndex) {
    if(pendingCardIndex === -1) return;
    
    player.mp -= pendingCardCost;
    
    const discardId = player.hand[discardIndex];
    
    const firstRm = Math.max(pendingCardIndex, discardIndex);
    const secondRm = Math.min(pendingCardIndex, discardIndex);
    
    player.hand.splice(firstRm, 1);
    player.hand.splice(secondRm, 1);
    
    player.discard.push(501); 
    player.discard.push(discardId); 
    
    playSE("se-heal");
    addLog("手札を捨て、2枚ドロー！", "log-skill");
    drawCard();
    drawCard();
    
    closeCardSelector();
    updateInfo();
}

// ★ v2.3.1: Show Card Detail Logic
function showCardDetail(card) {
    const detailEl = el("deck-card-detail");
    if(!detailEl) return;
    detailEl.innerHTML = `<span class="detail-name">${card.name}</span>${card.desc}`;
}

function applyCardEffect(card) {
    let msg = `Card: [${card.name}] `;
    switch(card.id) {
        // Vol.1
        case 101: player.hp = player.maxHp; msg += "HP完全回復！"; playSE("se-heal"); break;
        case 201: const dmg201 = 100; enemy.hp = Math.max(0, enemy.hp - dmg201); enemy.state.isStunned = true; msg += `100ダメージ＆スタン！`; playSE("se-boom"); triggerEffect(el("enemy-panel"), dmg201, false); break;
        case 202: player.mp = Math.min(player.mp + 5, player.maxMp); msg += "MPチャージ(+5)！"; break;
        case 301: player.state.guardTurn = 3; msg += "3ターン防御(被ダメ半減)！"; break;
        case 302: if (enemy.state.charge) { enemy.state.charge = false; enemy.state.isStunned = true; msg += "チャージ解除＆スタン！"; playSE("se-hit"); } else { msg += "不発(敵はチャージしていない)"; } break;
        case 303: player.state.barrier = true; msg += "バリア展開(次攻撃無効＆反撃)！"; break;
        case 401: const dmg401 = 20; enemy.hp = Math.max(0, enemy.hp - dmg401); msg += "20ダメージ！"; playSE("se-attack"); triggerEffect(el("enemy-panel"), dmg401, false); break;
        case 402: player.hp = Math.min(player.hp + 50, player.maxHp); msg += "HP50回復"; playSE("se-heal"); break;
        case 403: player.hp = Math.max(1, player.hp - 20); const dmg403 = 80; enemy.hp = Math.max(0, enemy.hp - dmg403); msg += "自傷20＆敵に80ダメージ！"; playSE("se-attack"); triggerEffect(el("player-panel"), 20, true); triggerEffect(el("enemy-panel"), dmg403, false); break;
        case 404: const dmg404 = 80; enemy.hp = Math.max(0, enemy.hp - dmg404); msg += "80ダメージ！"; playSE("se-attack"); triggerEffect(el("enemy-panel"), dmg404, false); break;
        case 405: player.state.power = true; msg += "攻撃力2倍(このターン)！"; break;

        // Vol.2
        case 501: break; 
        case 601: 
            const dmg601 = 150; enemy.hp = Math.max(0, enemy.hp - dmg601);
            while(player.hand.length > 0) player.discard.push(player.hand.pop());
            msg += "全手札を犠牲に150ダメージ！"; playSE("se-boom"); triggerEffect(el("enemy-panel"), dmg601, false);
            break;
        case 602: player.state.magicCylinder = true; msg += "魔法の筒をセット(反射待機)！"; break;
        case 701: 
            if (player.hp <= (player.maxHp * 0.5)) player.state.huge = 1; else player.state.huge = 2;
            msg += (player.state.huge===1) ? "HP劣勢…逆転の3倍パワー！" : "HP優勢…油断の0.5倍パワー…";
            break;
        case 702: 
            const dmg702 = 40; enemy.hp = Math.max(0, enemy.hp - dmg702);
            if(enemy.state.guard) { enemy.state.guard = false; msg += "40ダメ＆敵の防御を破壊！"; } else msg += "40ダメージ！";
            triggerEffect(el("enemy-panel"), dmg702, false); break;
        case 703: player.state.hexSeal = true; enemy.state.isStunned = true; msg += "六芒星の呪縛！(弱体化＆スタン)"; break;
        case 801: if(enemy.state.guard) { enemy.state.guard = false; msg += "敵の防御を解除した！"; } else msg += "敵は防御していなかった"; break;
        case 802: const dmg802 = 40; enemy.hp = Math.max(0, enemy.hp - dmg802); msg += "40ダメージ！"; triggerEffect(el("enemy-panel"), dmg802, false); break;
        case 803: player.hp = Math.min(player.hp + 30, player.maxHp); player.state.atkBonus = 20; msg += "HP30回復＆次撃+20！"; playSE("se-heal"); break;
        case 804: 
            if (player.discard.length === 0) { msg += "墓地にカードがない…"; break; }
            const magics = player.discard.filter(did => { const c = CARD_DB.find(cd => cd.id === did); return c.type === "MAGIC"; });
            if (magics.length === 0) { msg += "墓地に魔法がない…"; break; }
            const salvId = magics[Math.floor(Math.random() * magics.length)];
            const dIndex = player.discard.indexOf(salvId); player.discard.splice(dIndex, 1); player.hand.push(salvId);
            msg += `墓地から「${CARD_DB.find(c=>c.id===salvId).name}」を回収！`; break;
        case 805: 
            player.hp = Math.max(1, player.hp - 50); const dmg805 = 150; enemy.hp = Math.max(0, enemy.hp - dmg805);
            msg += "自傷50＆敵に150ダメージ！"; triggerEffect(el("player-panel"), 50, true); triggerEffect(el("enemy-panel"), dmg805, false); break;
        default: msg += "(発動)"; break;
    }
    
    addLog(msg, "log-skill");
    animateValue(el("enemy-hp-value"), displayEnemyHP, enemy.hp, 500); displayEnemyHP=enemy.hp;
    animateValue(el("player-hp"), displayPlayerHP, player.hp, 500); displayPlayerHP=player.hp;

    if (enemy.hp <= 0) setTimeout(winBattle, 800);
}

// --- Enemy AI ---
function enemyTurn() {
    if(enemy.state.isStunned) { 
        addLog(`>> ${enemy.name} はスタン中で動けない！`, "log-system"); 
        enemy.state.isStunned = false; endEnemyTurn(); return; 
    }

    if (player.state.hexSeal) { addLog(">> 呪縛により攻撃力が半減している！", "log-skill"); }

    if (stage === 6) {
        if (floor === 3) {
            if (Math.random() < 0.3) {
                enemy.hp = enemy.maxHp; 
                showSkillCutin("再 生", "heal");
                setTimeout(() => {
                    addLog(">> [再生] HPが全回復した！", "log-heal");
                    animateValue(el("enemy-hp-value"), displayEnemyHP, enemy.hp, 500); displayEnemyHP=enemy.hp;
                    updateInfo(); endEnemyTurn();
                }, 1200);
                return;
            }
        }
        if (floor === 4) {
            if (!player.state.itemLock && Math.random() < 0.3) {
                showSkillCutin("スライムの粘着", "earth");
                setTimeout(() => {
                    player.state.itemLock = true;
                    addLog(">> [粘着] 次ターン、カードとアイテムが使えない！", "log-enemy");
                    doEnemyAttack(1.0);
                }, 1200);
                return;
            }
        }
        if (floor === 5) {
            extraBossTurnCount++;
            if (extraBossTurnCount % 5 === 0) {
                showSkillCutin("サンダー・フォース", "fire");
                setTimeout(() => {
                    addLog(">> [神の怒り] 必殺の超雷撃！！", "log-enemy");
                    doEnemyAttack(1.0, { isBossUlt: true, fixedDmg: 80 }); 
                }, 1200);
                return;
            }
            if (Math.random() < 0.4) {
                enemy.state.atkBuff += 0.1;
                addLog(`>> [手札増強] 神の攻撃力が上がっていく… (x${(1.0+enemy.state.atkBuff).toFixed(1)})`, "log-enemy");
            }
            doEnemyAttack(1.2 * (1.0 + enemy.state.atkBuff)); 
            return;
        }
    }

    // Existing AI
    if (stage === 4 && floor === 3 && Math.random() < 0.4) { 
        showSkillCutin("呪いの視線", "earth"); setTimeout(() => { player.mp = Math.max(0, player.mp - 2); addLog(">> [呪い] MP2減少", "log-enemy"); doEnemyAttack(1.0); }, 1200); return; 
    }
    if (stage === 5) { 
        extraBossTurnCount++; 
        if(extraBossTurnCount % 5 === 0) { 
            showSkillCutin("黒 炎 弾", "fire"); setTimeout(() => { player.mp = Math.max(0, player.mp - 5); addLog(">> [黒炎弾] MP5消滅 & 大ダメージ", "log-enemy"); doEnemyAttack(1.0, {isBossUlt:true, fixedDmg: 50}); }, 1200); return; 
        } 
        doEnemyAttack(1.3); return;
    }
    
    // ... (Other stages) ...
    if(stage === 3) {
        if(floor===2 && Math.random()<0.3) { 
            showSkillCutin("誘惑の風", "wind"); setTimeout(() => { if(player.mp>0) { player.mp=Math.max(0,player.mp-1); enemy.hp=Math.min(enemy.hp+20,enemy.maxHp); addLog(">> [誘惑の風] MP吸収", "log-enemy"); } doEnemyAttack(1.0); }, 1200); return; 
        }
        if(floor===5) { 
            enemy.state.atkBuff += 0.1; addLog(`>> [主人の加護] 攻撃力UP (現在x${(1.0+enemy.state.atkBuff).toFixed(1)})`, "log-enemy"); 
            if(currentTurn % 4 === 0) { 
                showSkillCutin("愛の鞭・ブレス", "fire"); setTimeout(() => { player.mp = 0; addLog(">> [愛の鞭] MP消滅＆大ダメージ", "log-enemy"); doEnemyAttack(2.0 * (1.0+enemy.state.atkBuff)); }, 1200); return; 
            } 
            doEnemyAttack(1.0 * (1.0+enemy.state.atkBuff)); return; 
        }
    }
    if(stage===1) {
        if(floor===3) { if(Math.random() < 0.2) { showSkillCutin("自己再生", "heal"); setTimeout(() => { enemy.hp = Math.min(enemy.hp + 20, enemy.maxHp); playSE("se-heal"); addLog(">> [自己再生] HP20回復", "log-heal"); animateValue(el("enemy-hp-value"),displayEnemyHP,enemy.hp,500); displayEnemyHP=enemy.hp; updateInfo(); endEnemyTurn(); }, 1200); return; } if(Math.random() < 0.4) { showSkillCutin("鉄壁の守り", "earth"); setTimeout(() => { enemy.state.guard = true; addLog(">> [鉄壁の守り] ダメージ半減", "log-enemy"); updateInfo(); endEnemyTurn(); }, 1200); return; } }
        if(floor===5) { if(enemy.state.charge) { enemy.state.charge = false; showSkillCutin("森の破壊衝動", "earth"); setTimeout(() => { doEnemyAttack(3.0); }, 1200); return; } if(Math.random() < 0.3) { enemy.state.charge = true; addLog(`>> 力を溜めている…`, "log-enemy"); updateInfo(); endEnemyTurn(); return; } }
    }
    
    if (stage === 4 && floor === 1 && Math.random() < 0.3) { 
        showSkillCutin("トゥーン・ラッシュ", "wind"); setTimeout(() => { addLog(">> [速攻] 2回攻撃！", "log-enemy"); doEnemyAttack(0.7, {callback: () => { setTimeout(() => doEnemyAttack(0.7), 800); } }); }, 1200); return; 
    }
    if (stage === 4 && floor === 2 && currentTurn === 5) { 
        showSkillCutin("死のびっくり箱", "fire"); setTimeout(() => { addLog(">> [死の箱] 999ダメージ！", "log-enemy"); doEnemyAttack(0, {fixedDmg: 999, ignoreShield: true}); }, 1200); return; 
    }
    if (stage === 4 && floor === 4 && currentTurn % 3 === 0) { 
        showSkillCutin("トゥーン・スキン", "earth"); setTimeout(() => { addLog(">> [硬質化] 被ダメ-50", "log-enemy"); updateInfo(); endEnemyTurn(); }, 1200); return; 
    }
    if (stage === 4 && floor === 5 && currentTurn % 3 === 0) { 
        showSkillCutin("幻想の儀式", "wind"); setTimeout(() => { addLog(">> [儀式] HP吸収", "log-enemy"); doEnemyAttack(1.2, {isDrain: true}); }, 1200); return; 
    }
    if (stage === 4 && floor === 6 && currentTurn % 2 === 0) { 
        showSkillCutin("千眼の邪教神", "wind"); setTimeout(() => { addLog(">> [結界] 80点未満無効化！", "log-enemy"); doEnemyAttack(1.2); }, 1200); return; 
    }
    
    if(stage===3) {
        if(floor===1 && enemy.state.guardTurn > 0) { addLog(`>> 光の護封剣 (残り${enemy.state.guardTurn}T)`, "log-enemy"); doEnemyAttack(1.0); return; }
        if(floor===3 && Math.random()<0.3) { showSkillCutin("サイバー・ボンテージ", "wind"); setTimeout(() => { restrictInput = true; addLog(">> [拘束] 次ターン1投制限！", "log-enemy"); doEnemyAttack(1.0); }, 1200); return; }
        if(floor===4 && Math.random()<0.3) { showSkillCutin("トライアングル・エクスタシー", "wind"); setTimeout(() => { addLog(">> [3姉妹の連携] 3回攻撃！", "log-enemy"); doEnemyAttack(0.6, {callback: () => { setTimeout(() => doEnemyAttack(0.6, {callback: () => { setTimeout(() => doEnemyAttack(0.6), 600); } }), 600); } }); }, 1200); return; }
    }
    if(stage===2) {
        if(floor===2 && Math.random()<0.3) { showSkillCutin("俊足の連撃", "fire"); setTimeout(() => { addLog(">> [俊足の連撃] 2回攻撃！", "log-enemy"); doEnemyAttack(0.7, {callback: () => { setTimeout(() => doEnemyAttack(0.7), 800); } }); }, 1200); return; }
        if(floor===3 && Math.random()<0.3) { showSkillCutin("死肉の渇望", "fire"); setTimeout(() => { addLog(">> [死肉の渇望] 与ダメ吸収", "log-enemy"); doEnemyAttack(1.0, {isDrain: true}); }, 1200); return; }
        if(floor===4 && enemy.hp <= enemy.maxHp * 0.5 && Math.random()<0.5) { showSkillCutin("狂暴化", "fire"); setTimeout(() => { addLog(">> [狂暴化] 攻撃1.5倍", "log-enemy"); doEnemyAttack(1.5); }, 1200); return; }
        if(floor===5 && Math.random() < 0.3) { showSkillCutin("恐竜剣・兜割り", "earth"); setTimeout(() => { addLog(">> [BOSS] 兜割り！シールド無効", "log-enemy"); doEnemyAttack(1.8, {ignoreShield: true}); }, 1200); return; }
    }
    if(stage===1) {
        if(floor===3) { if(Math.random() < 0.2) { showSkillCutin("自己再生", "heal"); setTimeout(() => { enemy.hp = Math.min(enemy.hp + 20, enemy.maxHp); playSE("se-heal"); addLog(">> [自己再生] HP20回復", "log-heal"); animateValue(el("enemy-hp-value"),displayEnemyHP,enemy.hp,500); displayEnemyHP=enemy.hp; updateInfo(); endEnemyTurn(); }, 1200); return; } if(Math.random() < 0.4) { showSkillCutin("鉄壁の守り", "earth"); setTimeout(() => { enemy.state.guard = true; addLog(">> [鉄壁の守り] ダメージ半減", "log-enemy"); updateInfo(); endEnemyTurn(); }, 1200); return; } }
        if(floor===5) { if(enemy.state.charge) { enemy.state.charge = false; showSkillCutin("森の破壊衝動", "earth"); setTimeout(() => { doEnemyAttack(3.0); }, 1200); return; } if(Math.random() < 0.3) { enemy.state.charge = true; addLog(`>> 力を溜めている…`, "log-enemy"); updateInfo(); endEnemyTurn(); return; } }
    }
    
    doEnemyAttack(1.0);
}

function doEnemyAttack(mult, options = {}) {
    const { ignoreShield = false, isDrain = false, isBossUlt = false, fixedDmg = 0, callback = null } = options;
    
    if (player.state.hexSeal) { mult *= 0.5; }

    if (player.state.magicCylinder) {
        player.state.magicCylinder = false;
        const base = 2+floor+(stage-1)*3; 
        const wouldBeDmg = Math.floor((base + Math.floor(Math.random()*6)) * mult);
        
        addLog("★魔法の筒発動！攻撃を反射！", "log-skill");
        playSE("se-boom");
        el("flash-overlay").className="flash-gold"; setTimeout(()=>el("flash-overlay").className="",300);
        
        enemy.hp = Math.max(0, enemy.hp - wouldBeDmg);
        triggerEffect(el("enemy-panel"), wouldBeDmg, false);
        animateValue(el("enemy-hp-value"), displayEnemyHP, enemy.hp, 500); displayEnemyHP=enemy.hp;
        updateInfo();
        if(enemy.hp <= 0) setTimeout(winBattle, 800);
        else if(callback) callback(); else endEnemyTurn();
        return;
    }

    if (player.state.barrier) {
        player.state.barrier = false;
        addLog("★聖なるバリア発動！攻撃無効化＆反撃！", "log-skill");
        playSE("se-boom");
        el("flash-overlay").className="flash-gold"; setTimeout(()=>el("flash-overlay").className="",300);
        enemy.hp = Math.max(0, enemy.hp - 50);
        triggerEffect(el("enemy-panel"), 50, false);
        animateValue(el("enemy-hp-value"), displayEnemyHP, enemy.hp, 500); displayEnemyHP=enemy.hp;
        updateInfo();
        if(enemy.hp <= 0) setTimeout(winBattle, 800);
        else if(callback) callback(); else endEnemyTurn();
        return;
    }

    if (!ignoreShield && player.state.shield) { 
        addLog(`${enemy.name} の攻撃！ → 完全防御！`, "log-skill"); 
        player.state.shield=false; 
        triggerEffect(el("player-panel"),0,true); 
        el("flash-overlay").className="flash-blue"; setTimeout(()=>el("flash-overlay").className="",300); 
        updateInfo(); 
        if(callback) callback(); else endEnemyTurn(); 
        return; 
    }

    if (player.state.guardTurn > 0) {
        mult *= 0.5;
        addLog("[護封剣] 被ダメージ半減！", "log-skill");
    }

    if (isBossUlt) { 
        let dmg = fixedDmg > 0 ? fixedDmg : 60; 
        playSE("se-boom"); el("flash-overlay").className="flash-fire"; setTimeout(()=>el("flash-overlay").className="",600); 
        triggerEffect(el("player-panel"),dmg,true); 
        finishAttack(dmg, false, callback); 
        return; 
    }
    
    if (fixedDmg > 0) { finishAttack(fixedDmg, isDrain, callback); return; }
    
    const base = 2+floor+(stage-1)*3; 
    const dmg = Math.floor((base + Math.floor(Math.random()*6)) * mult);
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
            animateValue(el("enemy-hp-value"), displayEnemyHP, enemy.hp, 500); displayEnemyHP=enemy.hp; 
        } 
    }
    
    triggerEffect(el("player-panel"), dmg, true); 
    animateValue(el("player-hp"), displayPlayerHP, player.hp, 500); displayPlayerHP=player.hp; 
    updateInfo();
    
    if(player.hp<=0) setTimeout(loseBattle,1000); else { if(callback) callback(); else endEnemyTurn(); }
}

function endEnemyTurn() { 
    currentTurn++; 
    player.mp = Math.min(player.mp + 3, player.maxMp); 
    
    triggerFloatText("MP+3", el("player-mp-bar"));

    if(player.state.guardTurn > 0) {
        player.state.guardTurn--;
        if(player.state.guardTurn === 0) {
            addLog("光の護封剣の効果が切れた", "log-system");
        }
    }
    
    player.state.hexSeal = false; 
    
    // Reset Lock
    if (player.state.itemLock) {
        player.state.itemLock = false;
        addLog("封印が解除された", "log-system");
    }

    drawCard();

    updateInfo(); 
    isProcessing=false; 
}

// --- Battle Outcome ---
function winBattle() {
    addLog(`${enemy.name} を倒した`, "system");
    
    player.mp = Math.min(player.mp + 3, player.maxMp);
    triggerFloatText("MP+3", el("player-mp-bar"));
    drawCard(); 
    
    if (isJustFinish) { 
        player.maxHp += 10; const oldHP = player.hp; player.hp = Math.min(player.hp + 10, player.maxHp); 
        playSE("se-heal"); addLog(`★JUST FINISH! MaxHP+10 & HP+10`, "heal"); 
        animateValue(el("player-hp"), oldHP, player.hp, 500); updateInfo(); 
        setTimeout(() => { showDialog("JUST FINISH BONUS!!", `見事！ピッタリで倒した！<br>最大HPが ${player.maxHp} にアップ！<br>HPも10回復した。`, "clear", [{text:"OK", action:checkDrop}]); }, 800); 
    } else { setTimeout(checkDrop, 800); }
}

function checkDrop() {
    if(stage === 5 && floor === 1) { nextStep(); return; } // Extra
    if(stage === 6 && floor === 5) { nextStep(); return; } // God
    if(stage === 4 && floor === 6) { nextStep(); return; } // Toon
    
    const isBoss = (floor === 5 || (stage===4 && floor===6)); 
    let dropRate = isBoss ? 1.0 : 0.3; if (dropGuaranteed) dropRate = 1.0;
    
    if(Math.random() < dropRate) { 
        waitingForChest = true; 
        el("enemy-img").style.display = "none"; 
        el("chest-img").style.display = "block"; el("chest-img").classList.add("chest-shine"); 
        playSE("se-chest"); addLog("宝箱を見つけた！", "log-item"); 
    } else { nextStep(); }
}

function openChest() {
    if(!waitingForChest) return; waitingForChest = false; playSE("se-item");
    let seedRate = 0.15; if (weakHitCount >= 3) seedRate = 1.0; else if (weakHitCount >= 2) seedRate = 0.50;
    const rand = Math.random(); let itemName = ""; let itemEffect = "";
    
    if (rand < seedRate) { itemName = "★命の種"; itemEffect = "MaxHP +10"; player.items.seed++; } 
    else if (Math.random() < 0.6) { itemName = "薬草"; itemEffect = "HP 50 回復"; player.items.potion++; } 
    else { itemName = "魔法の聖水"; itemEffect = "MP 3 回復"; player.items.ether++; }
    
    updateInfo(); addLog(`宝箱: ${itemName} (${itemEffect}) を手に入れた`, "log-item");
    showDialog("TREASURE!", `<span style="font-size:24px;color:#00ff00;">${itemName}</span> を手に入れた！<br>${itemEffect}<br>(アイテムボタンで使用可能)`, "item", [{text:"OK", action:nextStep}]);
}

function nextStep() {
    floor++; const ppr = totalDarts>0 ? ((totalScore/totalDarts)*3).toFixed(1) : 0;

    const isStage5Clear = (stage === 5 && floor > 1); // Extra
    const isStage6Clear = (stage === 6 && floor > 5); // God
    const isStage4Clear = (stage === 4 && floor > 6);
    const isNormalClear = (stage <= 3 && floor > 5);

    if(isNormalClear || isStage4Clear || isStage6Clear || isStage5Clear) {
        const stageTurns = totalGameTurns - stageStartTurn;
        const [rank, dpBonus] = calculateStageRank(stage, stageTurns);
        
        const multipliers = { 1: 1.0, 2: 1.5, 3: 2.0, 4: 3.0, 5: 5.0, 6: 5.0 };
        const mult = multipliers[stage] || 1.0;
        
        const scoreDP = Math.floor(totalScore * 0.2 * mult); 
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

        if(stage === 5) { // Extra
            const res = finishSession("EXTRA-WIN", parseFloat(ppr), mult);
            showDialog("★ TRUE ENDING ★", `<span style="font-size:30px;color:#f0f;">THE LEGEND!!</span><br>最強の黒竜を倒した！<br><br>RANK: <span style="font-size:24px;color:${getRankColor(rank)};">${rank}</span><br>PPR: ${ppr}<br><br><span style="color:#ffd700; font-size:24px; font-weight:bold;">GET DP: +${res.gainedDP}</span>`, "clear", [{text:"TITLE", action:returnToTitle}]);
            return;
        }
        
        if(stage === 6) { // God
            const res = finishSession("GOD-WIN", parseFloat(ppr), mult);
            showDialog("GOD DEFEATED!", `<span style="font-size:30px;color:#ffd700;">DIVINE VICTORY!</span><br>神の試練を乗り越えた！<br><br>RANK: <span style="font-size:24px;color:${getRankColor(rank)};">${rank}</span><br><br><span style="color:#ffd700; font-size:24px; font-weight:bold;">GET DP: +${res.gainedDP}</span>`, "clear", [{text:"TITLE", action:returnToTitle}]);
            return;
        }

        if(stage === 4) {
            const res = finishSession("WIN", parseFloat(ppr), mult);
            showDialog("STAGE 4 CLEAR!", `<span style="font-size:28px;color:#e0b0ff;">NIGHTMARE CONQUERED!</span><br>RANK: <span style="font-size:24px;color:${getRankColor(rank)};">${rank}</span><br><br><span style="color:#ffd700; font-size:24px; font-weight:bold;">GET DP: +${res.gainedDP}</span>`, "clear", [{text:"TITLE", action:returnToTitle}]);
            return;
        }

        let title = "STAGE CLEAR";
        let msg = `STAGE ${stage} COMPLETED!<br>RANK: <span style="font-size:24px;color:${getRankColor(rank)};">${rank}</span><br><br>現在の獲得予定DP: <span style="color:#ffd700; font-weight:bold;">${potentialTotalDP} DP</span><br>(スコア倍率 x${mult.toFixed(1)})`;

        const btnNext = { text: "⛺ 次へ進む (繰越)", action: () => {
            player.hp = Math.min(player.hp + 30, player.maxHp);
            // Logic for next stage
            if(stage === 4) initGameSession(6, true);
            else initGameSession(stage + 1, true); 
        } };
        const btnReturn = { text: "🏠 帰還する (確定)", action: () => {
            const res = finishSession("RETURN", parseFloat(ppr), mult);
            showDialog("MISSION COMPLETE", `帰還しました。<br><br><span style="color:#ffd700; font-size:24px; font-weight:bold;">GET DP: +${res.gainedDP}</span>`, "clear", [{text:"TITLE", action:returnToTitle}]);
        } };

        if (stage === 3) {
            const btnExtra = { text: "⚠️ EXTRA STAGE", action: () => { player.hp = Math.min(player.hp + 30, player.maxHp); initGameSession(5, true); } };
            // Simple: Just allow clearing or extra
            if (parseFloat(ppr) >= 70.0 || savedData.clearedExtra) {
                msg += "<br><br><span style='color:#ff0000;'>強力な反応を感知...挑戦しますか？</span>";
                showDialog(title, msg, "clear", [btnExtra, btnReturn]);
            } else {
                msg += "<br><br>全てのエリアを踏破した！";
                showDialog(title, msg, "clear", [{ text: "🏠 ALL CLEAR", action: () => {
                    const res = finishSession("WIN", parseFloat(ppr), mult);
                    showDialog("ALL CLEAR!", `おめでとうございます！<br><br><span style="color:#ffd700; font-size:24px; font-weight:bold;">GET DP: +${res.gainedDP}</span>`, "clear", [{text:"TITLE", action:returnToTitle}]);
                } }]);
            }
        } else {
            showDialog(title, msg, "clear", [btnNext, btnReturn]);
        }
    } else {
        spawnEnemy();
    }
}

function loseBattle() {
    playBGM("bgm-lose");
    showDialog("GAME OVER", "力が尽きてしまった...<br>※獲得予定だったDPは失われます", "warning", [{text:"TITLE", action:returnToTitle}]);
}

function returnToTitle() { 
    playBGM("bgm-title"); 
    el("game-container").classList.remove("boss-mode","extra-mode"); 
    el("game-screen").style.display="none"; 
    el("title-screen").style.display="flex"; 
    updateTitleScore(); 
}

// --- Utils ---
function useItem(type) {
    if(isProcessing || waitingForChest) return;
    // ★ v2.2 Lock check
    if (player.state.itemLock) { playSE("se-warning"); return; }

    if(type === 'potion' && player.items.potion > 0) { 
        player.items.potion--; playSE("se-heal"); 
        const old=player.hp; player.hp=Math.min(player.hp+50, player.maxHp); 
        addLog(`アイテム: 薬草使用`, "log-item"); 
        animateValue(el("player-hp"), old, player.hp, 500); updateInfo(); 
    }
    else if(type === 'ether' && player.items.ether > 0) { 
        player.items.ether--; playSE("se-heal"); 
        player.mp=Math.min(player.mp+3, player.maxMp); 
        addLog(`アイテム: 聖水使用 (MP+3)`, "log-item"); updateInfo(); 
    }
    else if(type === 'seed' && player.items.seed > 0) { 
        player.items.seed--; playSE("se-buff"); 
        player.maxHp+=10; const old=player.hp; player.hp=Math.min(player.hp+10, player.maxHp); 
        addLog(`アイテム: 命の種使用`, "log-item"); 
        animateValue(el("player-hp"), old, player.hp, 500); updateInfo(); 
    }
}

// --- Visual & Audio (v1.4.2 Fix: BGM Control) ---
function stopAllBGM() { 
    const audio = ["bgm-title","bgm-battle","bgm-boss","bgm-extra","bgm-win","bgm-lose"]; 
    audio.forEach(id => { const el = document.getElementById(id); if(el){ el.pause(); el.currentTime=0;} }); 
    currentBgmId = "";
}

function playBGM(id) { 
    if(currentBgmId === id) return;
    stopAllBGM(); 
    const a=document.getElementById(id); 
    if(a){ 
        currentBgmId = id;
        a.volume=0.3; 
        a.play().catch(e=>{ console.log("BGM Play Error:", e); }); 
    } 
}

function playSE(id) { const a=document.getElementById(id); if(a){ a.currentTime=0; a.volume=0.5; a.play().catch(e=>{}); } }

function triggerFloatText(text, targetEl) {
    if(!targetEl) return;
    const float = document.createElement("div");
    float.className = "float-text-box";
    float.innerText = text;
    
    const rect = targetEl.getBoundingClientRect();
    document.body.appendChild(float);
    
    const left = rect.left + (rect.width / 2) - 30; 
    const top = rect.top;
    
    float.style.left = `${left}px`;
    float.style.top = `${top}px`;
    float.style.position = "fixed"; 
    
    setTimeout(() => float.remove(), 1500);
}

function showSkillCutin(name, type) { 
    playSE("se-warning"); 
    el("cutin-text-val").innerText = name; 
    const cutin = el("skill-cutin");
    cutin.className = ""; 
    if(type==="fire") cutin.classList.add("cutin-fire"); 
    if(type==="ice") cutin.classList.add("cutin-ice"); 
    if(type==="earth") cutin.classList.add("cutin-earth"); 
    if(type==="wind") cutin.classList.add("cutin-wind"); 
    if(type==="gold") cutin.classList.add("cutin-earth"); 
    if(type==="heal") cutin.classList.add("cutin-earth"); // Reuse
    cutin.style.display = "flex"; 
    el("game-container").classList.add("shake-heavy"); 
    setTimeout(()=>{ cutin.style.display="none"; el("game-container").classList.remove("shake-heavy"); }, 1500); 
}

function updateInfo() {
    if (!enemy.data) return;

    if(stage===6) { el("stage-display").innerText="STAGE 5"; el("floor-display").innerText=`${floor}F`; }
    else if(stage===5) { el("stage-display").innerText="EXTRA"; el("floor-display").innerText="FINAL"; }
    else if(stage===4) { el("stage-display").innerText="STAGE 4"; el("floor-display").innerText=`${floor}F`; }
    else { el("stage-display").innerText=`STAGE ${stage}`; el("floor-display").innerText=`${floor}F`; }
    el("turn-display").innerText=`TURN ${currentTurn}`;

    const elName = el("enemy-name"); elName.innerText = enemy.name;
    elName.style.fontSize = (enemy.name.length > 12) ? "12px" : ((enemy.name.length > 9) ? "15px" : "18px");

    const hpVal = el("enemy-hp-value"); hpVal.innerText = enemy.hp; 
    hpVal.className = "hp-big-text";
    if(enemy.hp <= 60) hpVal.classList.add("hp-danger"); else if(enemy.hp <= 180) hpVal.classList.add("hp-warning");

    let weakText = ""; 
    if(player.state.weakLock) weakText = "<span style='color:#f0f; animation:blink 0.5s infinite;'>★ WEAK LOCK ACTIVE ★</span>"; 
    else {
        let baseText = "WEAK: " + enemy.data.weak + "+";
        if (weakHitCount > 0) { 
            let color = weakHitCount >= 3 ? "#ff0000" : (weakHitCount >= 2 ? "#ffa500" : "#ffff00"); 
            let msg = weakHitCount >= 3 ? "ULTRA CHANCE!!!" : (weakHitCount >= 2 ? "SUPER CHANCE!!" : "DROP CHANCE UP!"); 
            weakText = `${baseText} <span style='color:${color}; text-shadow:0 0 5px ${color}; margin-left:5px;'>✨ ${msg}</span>`; 
        } else {
            weakText = baseText;
        }
    }
    el("weak-display").innerHTML = weakText;

    el("enemy-hp-bar").style.width=Math.max(0,(enemy.hp/enemy.maxHp)*100)+"%"; 
    el("player-hp-bar").style.width=Math.max(0,(player.hp/player.maxHp)*100)+"%";
    el("player-hp").innerText = player.hp; el("player-max-hp").innerText = player.maxHp;

    const mpContainer = el("player-mp-bar");
    mpContainer.innerHTML = ""; mpContainer.style.width = "100%"; 
    for(let i=0; i < player.maxMp; i++) {
        const dot = document.createElement("div");
        dot.className = "mp-dot";
        if (i < player.mp) dot.classList.add("active");
        mpContainer.appendChild(dot);
    }
    el("player-mp").innerText = player.mp; el("player-max-mp").innerText = player.maxMp;

    updateVisuals();
    renderHand();

    let ppr = 0; if(totalDarts>0) ppr = ((totalScore/totalDarts)*3); 
    el("avg-display").innerText=ppr.toFixed(1); el("rt-display").innerText=`(Rt ${calculateRating(ppr)})`;
    
    // ★ v2.2.1 Fix: Item Button Visual
    const isLocked = player.state.itemLock;
    ["btn-potion", "btn-ether", "btn-seed"].forEach(id => {
        const b = el(id);
        if(isLocked) { b.classList.add("disabled"); b.style.opacity = "0.3"; }
        else { b.classList.remove("disabled"); b.style.opacity = "1.0"; }
    });
    
    el("btn-potion").innerHTML = `💊 薬草 x${player.items.potion}<span class="tooltip">HPを50回復</span>`;
    el("btn-ether").innerHTML = `⚗️ マナ x${player.items.ether}<span class="tooltip">MPを3回復</span>`;
    el("btn-seed").innerHTML = `🌱 種 x${player.items.seed}<span class="tooltip">最大HP+10上昇</span>`;
}

function updateVisuals() {
    if(el("player-buff-badge")) {
        el("player-buff-badge").style.display = player.state.power ? "block" : "none";
        el("player-buff-badge").innerText = "ATK x2.0";
    }
    if(el("player-lock-badge")) {
        el("player-lock-badge").style.display = player.state.itemLock ? "block" : "none";
    }
    
    if(el("player-guard-badge")) {
        if(player.state.shield) {
            el("player-guard-badge").style.display = "block";
            el("player-guard-badge").innerText = "SHIELD";
        } else if(player.state.guardTurn > 0) {
            el("player-guard-badge").style.display = "block";
            el("player-guard-badge").innerText = "GUARD " + player.state.guardTurn;
        } else {
            el("player-guard-badge").style.display = "none";
        }
    }

    if(el("enemy-buff-badge")) el("enemy-buff-badge").style.display = enemy.state.charge ? "block" : "none";
    if(el("enemy-guard-badge")) el("enemy-guard-badge").style.display = (enemy.state.guard || enemy.state.guardType) ? "block" : "none";
    
    const dropBadge = el("enemy-drop-badge");
    const enemyPanel = el("enemy-panel");
    if(player.state.weakLock || dropGuaranteed) {
        if(dropBadge) dropBadge.style.display = "block";
        if(enemyPanel) enemyPanel.classList.add("drop-chance");
    } else {
        if(dropBadge) dropBadge.style.display = "none";
        if(enemyPanel) enemyPanel.classList.remove("drop-chance");
    }
}

function renderHand() {
    const handArea = el("hand-area");
    handArea.innerHTML = "";
    el("hand-count-display").innerText = player.hand.length;
    
    if (player.deckLocked) {
        el("battle-deck-count").innerText = "-";
        handArea.innerHTML = `<div class="hand-locked-msg">⚠️ NO DECK (DARTS ONLY)</div>`;
    } else {
        el("battle-deck-count").innerText = player.deck.length;
        if (player.hand.length === 0) {
             handArea.innerHTML = `<div class="hand-card-empty">NO CARD</div>`;
        } else {
            player.hand.forEach((cardId, index) => {
                const card = CARD_DB.find(c => c.id === cardId);
                const cost = (card.cost !== undefined) ? card.cost : 99;
                const div = document.createElement("div");
                div.className = "hand-card";
                if (player.mp < cost || player.state.itemLock) div.classList.add("disabled"); // Locked check

                const imgPath = `assets/cards/${card.id}.png`;
                div.innerHTML = `<div class="hand-cost">${cost}</div><div class="card-art" style="height:100%; border:none;"><img src="${imgPath}" onerror="this.style.display='none'"></div>`;
                div.onclick = () => playHandCard(index);
                div.onmouseenter = (e) => showTooltip(card.name, card.desc, e);
                div.onmouseleave = () => hideTooltip();
                handArea.appendChild(div);
            });
        }
    }
}

// --- Shop & Deck ---
function openCardShop() {
    playSE("se-tap");
    const list = el("pack-list"); list.innerHTML = "";
    el("shop-dp-display").innerText = savedData.dp;
    if (!savedData.cards) savedData.cards = {};

    PACK_DATA.forEach(pack => {
        const isUnlocked = (savedData.bestRanks && savedData.bestRanks[pack.unlockStage]);
        if (!isUnlocked) return; 
        const canBuy = savedData.dp >= pack.price;
        const imgHTML = `<img src="${pack.img}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"><div style="display:none; width:100%; height:100%; align-items:center; justify-content:center; font-size:50px; background:#333; color:#555;">📦</div>`;
        const div = document.createElement("div");
        div.className = "pack-item";
        div.innerHTML = `<div class="pack-img-container">${imgHTML}</div><div class="pack-name">${pack.name}</div><div class="pack-desc">${pack.desc}</div><button class="pack-buy-btn" ${canBuy ? "" : "disabled"} onclick="buyPack('${pack.id}')">${canBuy ? `BUY (${pack.price} DP)` : "LACK DP"}</button>`;
        list.appendChild(div);
    });
    if (list.innerHTML === "") list.innerHTML = "<div style='color:#666; width:100%; text-align:center;'>STAGE 1 CLEAR REQUIRED</div>";
    el("card-shop-modal").style.display = "flex";
}

function buyPack(packId) {
    const pack = PACK_DATA.find(p => p.id === packId);
    if (!pack || savedData.dp < pack.price) return;
    savedData.dp -= pack.price;
    el("shop-dp-display").innerText = savedData.dp;
    playSE("se-item");

    const results = [];
    for(let i=0; i<3; i++) {
        const card = drawShopCard(packId); 
        const isNew = !savedData.cards[card.id];
        if (!savedData.cards[card.id]) savedData.cards[card.id] = 0;
        savedData.cards[card.id]++;
        results.push({ card: card, isNew: isNew });
    }
    saveToDrive();
    showPackResult(results);
}

function drawShopCard(packId) {
    const rand = Math.random() * 100;
    let targetRarity = "N";
    if (rand < 2) targetRarity = "UR";
    else if (rand < 10) targetRarity = "SR";
    else if (rand < 40) targetRarity = "R";
    
    let pool = CARD_DB.filter(c => c.rarity === targetRarity);
    if(packId === "vol1") pool = pool.filter(c => c.id < 500);
    else if(packId === "vol2") pool = pool.filter(c => c.id >= 500);
    
    if (pool.length === 0) return CARD_DB[0];
    return pool[Math.floor(Math.random() * pool.length)];
}

function showPackResult(results) {
    const container = el("pack-results"); container.innerHTML = "";
    results.forEach((res, index) => {
        const c = res.card;
        const cardEl = createCardElement(c, false, 1, 1);
        cardEl.classList.add("result-card-anim");
        cardEl.style.animationDelay = `${index * 0.3}s`;
        if (res.isNew) {
            const badge = document.createElement("div"); badge.className = "new-badge-overlay"; badge.innerText = "NEW!";
            cardEl.appendChild(badge);
        }
        container.appendChild(cardEl);
    });
    const hasHighRare = results.some(r => r.card.rarity === "SR" || r.card.rarity === "UR");
    if (hasHighRare) setTimeout(() => playSE("se-win"), 300); else playSE("se-buff");
    el("pack-result-modal").style.display = "flex";
}

function closePackResult() { playSE("se-tap"); el("pack-result-modal").style.display = "none"; updateTitleScore(); }
function closeCardShop() { playSE("se-tap"); el("card-shop-modal").style.display = "none"; updateTitleScore(); }

// --- Collection ---
function openCollection() { playSE("se-tap"); renderDeckEditor(); el("collection-modal").style.display = "flex"; }
function closeCollection() { playSE("se-tap"); el("collection-modal").style.display = "none"; hideTooltip(); }

function renderDeckEditor() {
    if (!savedData.deck) savedData.deck = [];
    savedData.deck.sort((a,b) => a - b);

    const deckGrid = el("deck-grid"); deckGrid.innerHTML = "";
    for (let i = 0; i < DECK_SIZE; i++) {
        const cardId = savedData.deck[i]; 
        if (cardId) {
            const card = CARD_DB.find(c => c.id === cardId);
            const totalOwned = savedData.cards[card.id] || 0;
            const el = createCardElement(card, true, 0, totalOwned);
            
            // ★ v2.3.1: Hover detail for deck items
            el.onmouseenter = () => showCardDetail(card);
            
            deckGrid.appendChild(el);
        } else {
            const div = document.createElement("div"); div.className = "deck-slot-empty"; div.innerText = "EMPTY";
            deckGrid.appendChild(div);
        }
    }
    
    const deckCount = savedData.deck.length;
    const countEl = el("deck-count"); countEl.innerText = deckCount;
    if (deckCount < DECK_SIZE) { countEl.style.color = "#ff5555"; countEl.innerText += " (あと" + (DECK_SIZE - deckCount) + "枚)"; } 
    else { countEl.style.color = "#00ff00"; countEl.innerText += " (OK!)"; }

    const listGrid = el("card-grid"); listGrid.innerHTML = "";
    if (!savedData.cards) savedData.cards = {};
    let ownedCount = 0;

    CARD_DB.forEach(card => {
        const count = savedData.cards[card.id] || 0;
        if (count > 0) ownedCount++;
        const inDeckCount = savedData.deck.filter(id => id === card.id).length;
        const remaining = count - inDeckCount; 
        const el = createCardElement(card, false, remaining, count);
        listGrid.appendChild(el);
    });
    el("collection-rate").innerText = `${Math.floor((ownedCount / CARD_DB.length) * 100)}%`;
}

// ★ v2.3.1: Updated to handle detail view
function showCardDetail(card) {
    const detailEl = el("deck-card-detail");
    if(!detailEl) return;
    detailEl.innerHTML = `<span class="detail-name">${card.name}</span>${card.desc}`;
}

function createCardElement(card, isDeckItem, remainingCount = 1, totalCount = 0) {
    const div = document.createElement("div");
    const isOwned = (totalCount > 0 || isDeckItem);
    const notOwnedClass = (!isOwned) ? "card-not-owned" : "";
    div.className = `collection-card rarity-${card.rarity} ${notOwnedClass}`;
    const imgPath = `assets/cards/${card.id}.png`;
    const fallbackIcon = card.type === "MAGIC" ? "🪄" : "⛓️";
    const cost = (card.cost !== undefined) ? card.cost : "?";
    
    let shortDesc = card.desc;
    if(shortDesc.length > 20) shortDesc = shortDesc.substring(0, 19) + "..";

    const imgStyle = isDeckItem ? "height: 100%; border-radius: 4px;" : "";
    const artStyle = isDeckItem ? "height: 100%;" : "";

    div.innerHTML = `
        <div class="card-cost-badge">${cost}</div>
        <div class="card-count-badge">x${isDeckItem ? 1 : remainingCount}</div>
        <div class="card-art" style="${artStyle}">
            <img src="${imgPath}" style="${imgStyle}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
            <div class="card-placeholder" style="display:none;">${fallbackIcon}</div>
        </div>
        <div class="card-info">
            <div class="card-name">${card.name}</div>
            <div class="card-type">[${card.type}]</div>
            ${(!isDeckItem && isOwned) ? `<div class="card-info-direct" style="display:block;">${shortDesc}</div>` : ''}
        </div>
    `;
    div.onclick = function() {
        if (!isOwned) return; 
        if (isDeckItem) removeFromDeck(card.id); else addToDeck(card.id);
    };
    
    // ★ v2.3.1 Fix: Always show detail on hover (both list and deck)
    div.onmouseenter = (e) => {
        showCardDetail(card);
        if (isDeckItem) showTooltip(card.name, card.desc, e); // Keep tooltip for deck view
    };
    if (isDeckItem) {
        div.onmouseleave = () => hideTooltip();
    }
    return div;
}

// --- Global Tooltip System ---
function showTooltip(name, desc, e) {
    const tt = el("global-tooltip");
    el("gt-name").innerText = name;
    el("gt-desc").innerText = desc;
    tt.style.visibility = "visible";
    tt.style.opacity = "1";
    moveTooltip(e);
    e.currentTarget.onmousemove = moveTooltip;
}

function moveTooltip(e) {
    const tt = el("global-tooltip");
    const offset = 15;
    let left = e.clientX + offset;
    let top = e.clientY + offset;
    
    if (left + tt.offsetWidth > window.innerWidth) left = e.clientX - tt.offsetWidth - offset;
    if (top + tt.offsetHeight > window.innerHeight) top = e.clientY - tt.offsetHeight - offset;
    
    tt.style.left = left + "px";
    tt.style.top = top + "px";
}

function hideTooltip() {
    const tt = el("global-tooltip");
    tt.style.visibility = "hidden";
    tt.style.opacity = "0";
}

function addToDeck(cardId) {
    // ★ v2.3.1 Fix: Force hide tooltip before action
    hideTooltip();
    
    const SAME_CARD_LIMIT = 3;
    if (savedData.deck.length >= DECK_SIZE) { alert(`デッキは${DECK_SIZE}枚までです！`); return; }
    const ownedCount = savedData.cards[cardId] || 0;
    const currentInDeck = savedData.deck.filter(id => id === cardId).length;
    if (currentInDeck >= ownedCount) { alert("これ以上持っていません！"); return; }
    if (currentInDeck >= SAME_CARD_LIMIT) { alert(`「${getCardName(cardId)}」は3枚までです。`); return; }
    
    playSE("se-tap"); savedData.deck.push(cardId); saveToDrive(); renderDeckEditor(); 
}

function removeFromDeck(cardId) {
    // ★ v2.3.1 Fix: Force hide tooltip before action
    hideTooltip();
    
    playSE("se-tap");
    const index = savedData.deck.indexOf(cardId);
    if (index > -1) { savedData.deck.splice(index, 1); }
    saveToDrive(); renderDeckEditor();
}

function getCardName(id) { const c = CARD_DB.find(card => card.id === id); return c ? c.name : "カード"; }

// --- Helpers & Base Functions ---
function showDialog(title, text, type="normal", buttons=[{text:"OK", action:null}]) {
    const box = el("modal-box-inner");
    el("modal-title").innerText = title; el("modal-text").innerHTML = text; 
    box.className = "modal-box"; el("modal-title").style.color = "#f9a826";
    if (type === "clear") { box.classList.add("modal-clear"); el("modal-title").style.color = "#fff"; } 
    else if (type === "warning") { box.classList.add("modal-warning"); el("modal-title").style.color = "#ff0000"; } 
    else if (type === "item") { box.classList.add("modal-item"); el("modal-title").style.color = "#00ff00"; }

    const btnGroup = el("modal-buttons"); btnGroup.innerHTML = "";
    buttons.forEach(b => {
        const btn = document.createElement("button"); btn.className = "modal-btn"; btn.innerText = b.text;
        btn.onclick = function() { playSE("se-tap"); el("game-modal").style.display = "none"; if(b.action) b.action(); };
        btnGroup.appendChild(btn);
    });
    el("game-modal").style.display = "flex";
}

function calculateStageRank(stg, turns) {
    if (stg === 5 || stg === 6) { // Boss stages
        if (turns <= 15) return ["SSS", 1000]; if (turns <= 20) return ["S", 600]; if (turns <= 35) return ["A", 300]; if (turns <= 50) return ["B", 100]; return ["C", 50]; 
    }
    else if (stg === 4) { if (turns <= 20) return ["SSS", 1000]; if (turns <= 28) return ["S", 600]; if (turns <= 40) return ["A", 300]; if (turns <= 50) return ["B", 100]; return ["C", 50]; } 
    else { if (turns <= 12) return ["SSS", 1000]; if (turns <= 16) return ["S", 600]; if (turns <= 22) return ["A", 300]; if (turns <= 30) return ["B", 100]; return ["C", 50]; }
}

function finishSession(resultType, ppr, multiplier = 1.0) {
    let totalDP = 0;
    let earnedDP = 0;
    clearedStagesLog.forEach(log => { earnedDP += log.dp; });
    
    savedData.dp = (savedData.dp || 0);

    const curVal = stage * 100 + floor; const bestVal = savedData.highScore.stage * 100 + savedData.highScore.floor;
    let isNewRecord = false; if (curVal > bestVal) { savedData.highScore.stage = stage; savedData.highScore.floor = floor; isNewRecord = true; }
    if (ppr > savedData.highScore.avg) { savedData.highScore.avg = ppr; isNewRecord = true; }
    if (resultType === "EXTRA-WIN") savedData.clearedExtra = true;

    const now = new Date(); 
    const dateStr = `${now.getMonth()+1}/${now.getDate()} ${now.getHours()}:${("0"+now.getMinutes()).slice(-2)}`;
    let stgName = (stage === 6) ? "STAGE 5" : (stage===5 ? "EXTRA" : "S" + stage + "-" + floor + "F");
    let resultText = resultType;
    
    let gainedDP = 0;
    
    const scoreDP = Math.floor(totalScore * 0.2 * multiplier);
    let rankDP = 0;
    clearedStagesLog.forEach(log => rankDP += log.dp);
    gainedDP = scoreDP + rankDP;
    
    savedData.dp += gainedDP;

    if (clearedStagesLog.length > 0 && resultType === "RETURN") {
        const last = clearedStagesLog[clearedStagesLog.length-1];
        resultText = `CLEAR(${last.rank})`;
    }

    savedData.history.unshift({ date: dateStr, stage: stage, floor: floor, stgName: stgName, result: resultText, dp: gainedDP, ppr: ppr, rt: calculateRating(ppr) });
    if(savedData.history.length > 50) savedData.history.pop();
    updateTitleScore(); saveToDrive();
    return { isNewRecord: isNewRecord, gainedDP: gainedDP };
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function triggerEffect(el, dmg, isP) {
    el.classList.remove("shake-small", "shake-medium", "shake-heavy", "shake-ultimate"); void el.offsetWidth;
    if(dmg >= 150) { el.classList.add("shake-ultimate"); playSE("se-boom"); }
    else if(dmg >= 60) { el.classList.add("shake-heavy"); playSE("se-boom"); }
    else { el.classList.add(dmg>=30 ? "shake-medium" : "shake-small"); playSE("se-hit"); }
    
    const pop = document.createElement("div"); pop.innerText=dmg; 
    if(dmg >= 150) pop.className="damage-popup dmg-ultimate"; else if(dmg >= 60) pop.className="damage-popup dmg-heavy"; else if(dmg >= 30) pop.className="damage-popup dmg-medium"; else pop.className="damage-popup dmg-small";
    pop.style.left="50%"; pop.style.top="50%"; el.appendChild(pop); setTimeout(()=>pop.remove(),1500);
}

function animateValue(obj, s, e, d) { if(obj) obj.innerHTML = e; }
function addLog(t, type="") { const d=document.createElement("div"); d.innerHTML=t; if(type) d.className="log-"+type; el("battle-log").prepend(d); }

function showHistory() {
    const list = el("history-list"); list.innerHTML = "";
    if(!savedData.history || savedData.history.length === 0) { list.innerHTML = "<div style='padding:20px; text-align:center;'>NO HISTORY</div>"; }
    else {
        savedData.history.forEach(h => {
            let resClass = "res-lose"; let resStr = h.result || "LOSE";
            if (resStr.includes("WIN") || resStr.includes("CLEAR")) resClass = "res-win";
            if (resStr.includes("EXTRA")) resClass = "res-extra";
            list.innerHTML += `<div class='h-row'><div>${h.date}</div><div>${h.stgName}</div><div class='${resClass}'>${resStr}</div><div>+${h.dp} DP<br>Avg ${h.ppr.toFixed(1)}</div></div>`;
        });
    }
    playSE("se-tap"); el("history-modal").style.display = "flex";
}
function closeHistory() { playSE("se-tap"); el("history-modal").style.display = "none"; }
function resetSaveData() { if(confirm("【警告】現在のスロットのデータを完全に消去しますか？")) { allSaveData[currentSlot] = null; selectSlot(currentSlot.replace("slot","")); saveToDrive(); } }
function exportSave() { navigator.clipboard.writeText(JSON.stringify(savedData)).then(()=>alert("現在のスロットのデータをコピーしました")); }
function importSave() { const json = prompt("セーブデータ(JSON)を貼り付けてください"); if(json) { try { const d = JSON.parse(json); if(d.highScore && d.history) { savedData = d; updateTitleScore(); saveToDrive(); alert("読み込み完了"); } } catch(e) { alert("データ形式エラー"); } } }

// --- Debug & Keys ---
function tapKey(key) {
    if (el("game-screen").style.display === "none" || isProcessing) return;
    if(key === 'ENT') handleEnter();
    else if (key === 'BS') {
        if (currentInput.length > 0) currentInput = currentInput.slice(0, -1);
        else if (turnInputs.length > 0) currentInput = "" + turnInputs.pop();
        playSE("se-tap"); updateScoreDisplay();
    } else {
        if (currentInput.length < 3) { playSE("se-tap"); currentInput += key; updateScoreDisplay(); }
    }
}

window.addEventListener("keydown", function(e) {
    if (el("title-screen").style.display !== "none") {
        if (e.key === "1") cheatBuffer += e.key; else cheatBuffer = "";
        if (cheatBuffer.endsWith("1111")) { 
            playSE("se-item"); 
            savedData.dp = (savedData.dp || 0) + 5000; 
            updateTitleScore(); 
            saveToDrive(); 
            cheatBuffer = ""; 
        }
    }
    if (el("game-modal").style.display === "flex" && e.key === "Enter") {
        const btns = document.getElementById("modal-buttons");
        if (btns.children.length === 1) { e.preventDefault(); btns.children[0].click(); } return;
    }
    if (waitingForChest) { if (e.key === 'Enter') { e.preventDefault(); openChest(); } return; }
    if (el("game-screen").style.display !== "none" && !isProcessing) {
        if (e.key >= '0' && e.key <= '9') { if (currentInput.length < 3) { playSE("se-tap"); currentInput += e.key; updateScoreDisplay(); } }
        if (e.key === 'Backspace') { if (currentInput.length > 0) currentInput = currentInput.slice(0, -1); else if (turnInputs.length > 0) currentInput = "" + turnInputs.pop(); updateScoreDisplay(); }
        if (e.key === 'Enter') handleEnter();
    }
});

function updateScoreDisplay() {
    const slots = [el("slot-1"), el("slot-2"), el("slot-3")];
    slots.forEach((s, i) => { 
        s.className = "score-slot"; 
        if (restrictInput && i > 0) { s.classList.add("locked"); s.innerText = "X"; return; } 
        if (i < turnInputs.length) { s.innerText = turnInputs[i]; s.classList.add("filled"); } 
        else if (i === turnInputs.length) { s.innerText = currentInput; s.classList.add("active"); } 
        else { s.innerText = ""; } 
    });
    const currentThrow = turnInputs.length + 1;
    el("btn-d1").className = currentThrow === 1 ? "darts-btn active" : "darts-btn";
    el("btn-d2").className = currentThrow === 2 ? "darts-btn active" : "darts-btn";
    el("btn-d3").className = currentThrow === 3 ? "darts-btn active" : "darts-btn";
    if(restrictInput) { el("btn-d2").className="darts-btn disabled"; el("btn-d3").className="darts-btn disabled"; }
}

function getRankColor(r) { if(r==="SSS") return "#00ffff"; if(r==="S") return "#ffd700"; if(r==="A") return "#ff5555"; return "#fff"; }