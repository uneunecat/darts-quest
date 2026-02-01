console.log("★ logic.js is loaded!");

// --- Global Variables ---
let player = { 
    hp: 100, maxHp: 100, mp: 3, maxMp: 10,
    items: { potion: 0, ether: 0, seed: 0 }, 
    state: { power: false, shield: false, weakLock: false, nextShotMult: 1.0 },
    deck: [], hand: [], discard: [], deckLocked: false
};

let enemy = { hp: 100, maxHp: 100, data: null, name: "", state: { charge: false, guard: false, guardType: null, guardTurn: 0, atkBuff: 0, isStunned: false } };
let stage=1; floor=1; totalScore=0; totalDarts=0; currentDarts=3;
let isProcessing=false; extraBossTurnCount=0; currentTurn=1;
let dropGuaranteed = false; weakHitCount = 0; let restrictInput = false;
let turnInputs = []; let currentInput = ""; let isJustFinish = false; let waitingForChest = false;
let cheatBuffer = ""; 
let stageStartTurn = 0; let totalGameTurns = 0; let clearedStagesLog = [];

// --- SAVE / LOAD SYSTEM ---
let allSaveData = { "slot1": null, "slot2": null, "slot3": null, "lastPlayed": 1 };
const SAVE_KEY = "darts_quest_save";
let currentSlot = "slot1";
let savedData = { highScore: { stage: 1, floor: 1, avg: 0.0 }, history: [], clearedExtra: false, dp: 0, bestRanks: { 1: null, 2: null, 3: null, 4: null, 5: null }, unlockedStage4: false, deck: [], cards: {} };

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

function resetSaveData() { if(confirm("【警告】現在のスロットのデータを完全に消去しますか？")) { allSaveData[currentSlot] = null; selectSlot(currentSlot.replace("slot","")); saveToDrive(); } }
function exportSave() { navigator.clipboard.writeText(JSON.stringify(savedData)).then(()=>alert("現在のスロットのデータをコピーしました")); }
function importSave() { const json = prompt("セーブデータ(JSON)を貼り付けてください"); if(json) { try { const d = JSON.parse(json); if(d.highScore && d.history) { savedData = d; updateTitleScore(); saveToDrive(); alert("読み込み完了"); } } catch(e) { alert("データ形式エラー"); } } }

// --- LOGIC HELPERS ---
function calculateRating(ppr) { if(ppr < 30) return 1; if(ppr < 40) return 2; if(ppr < 45) return 3; if(ppr < 50) return 4; if(ppr < 55) return 5; if(ppr < 60) return 6; if(ppr < 65) return 7; if(ppr < 70) return 8; if(ppr < 75) return 9; if(ppr < 80) return 10; if(ppr < 85) return 11; if(ppr < 90) return 12; if(ppr < 95) return 13; if(ppr < 100) return 14; if(ppr < 110) return 15; if(ppr < 120) return 16; if(ppr < 130) return 17; return 18; }

function calculateStageRank(stg, turns) {
    if (stg === 5) { if (turns <= 15) return ["SSS", 1000]; if (turns <= 20) return ["S", 600]; if (turns <= 35) return ["A", 300]; if (turns <= 50) return ["B", 100]; return ["C", 50]; }
    else if (stg === 4) { if (turns <= 20) return ["SSS", 1000]; if (turns <= 28) return ["S", 600]; if (turns <= 40) return ["A", 300]; if (turns <= 50) return ["B", 100]; return ["C", 50]; }
    else { if (turns <= 12) return ["SSS", 1000]; if (turns <= 16) return ["S", 600]; if (turns <= 22) return ["A", 300]; if (turns <= 30) return ["B", 100]; return ["C", 50]; }
}

function calculatePlayerDamage(score, p, e) {
    let dmg = score;
    // 突進の効果適用
    if (p.state.nextShotMult > 1.0) {
        dmg = Math.floor(dmg * p.state.nextShotMult);
        p.state.nextShotMult = 1.0; // 消費
        addLog(`>> 突進効果！ダメージ倍増 (${dmg})`, "log-skill");
    }

    if (stage === 4 && floor === 4 && currentTurn % 3 === 0) { dmg = Math.max(0, dmg - 50); }
    if (e.state.guardType === 'player_cut') { dmg = Math.floor(dmg * 0.5); addLog("護封剣で50%軽減！", "system"); } // 自分が使った場合
    if (p.state.power) { dmg = Math.floor(dmg * 1.5); p.state.power = false; }
    if (e.state.guard) { dmg = Math.floor(dmg / 2); e.state.guard = false; addLog("敵の防御で半減！", "system"); }
    return dmg;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function drawShopCard(packId) {
    const rand = Math.random() * 100;
    let targetRarity = "N";
    if (rand < 2) targetRarity = "UR";
    else if (rand < 10) targetRarity = "SR";
    else if (rand < 40) targetRarity = "R";
    const pool = CARD_DB.filter(c => c.rarity === targetRarity);
    if (pool.length === 0) return CARD_DB[0];
    return pool[Math.floor(Math.random() * pool.length)];
}