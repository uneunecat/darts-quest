// =========================================
// 1. UTILITY FUNCTIONS (ヘルパー関数)
// =========================================
const el = (id) => document.getElementById(id);

// ダーツのPPR(Point Per Round)からレーティングを算出
function calculateRating(ppr) {
    const entry = RATING_TABLE.find(row => ppr >= row.ppr);
    return entry ? entry.rt : 1;
}

// 配列のシャッフル (フィッシャー–イェーツ)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}


// =========================================
// 5. GLOBAL STATE MANAGEMENT (状態管理)
// =========================================
let bluetoothDevice = null;
let bluetoothServer = null;

// プレイヤー状態
let player = {
    hp: 100, maxHp: 100, mp: 3, maxMp: 10,
    items: { potion: 0, ether: 0, seed: 0 },
    states: [], // ★ここがステートの保管庫。個別の変数はすべて削除
    deck: [], hand: [], discard: [], deckLocked: false, setCard: null
};

// 敵状態
let enemy = {
    hp: 100, maxHp: 100, data: null, name: "", atk: 10,
    states: [], // ★ここがステートの保管庫
    actionCount: 0, // 行動回数
    patternQueue: [] // シーケンス
};

// ゲーム進行フラグ
let stage = "1-1"; // ★数値の1から文字列へ変更
let floor = 1;
let totalScore = 0;
let totalDarts = 0;
let displayPlayerHP = 100;
let displayEnemyHP = 100;
let isProcessing = false;
let currentTurn = 1;
let dropGuaranteed = false;
let weakHitCount = 0;
let turnInputs = [];
let currentInput = "";
let isJustFinish = false;
let waitingForChest = false;
let cheatBuffer = "";
let stageStartTurn = 0;
let totalGameTurns = 0;
let clearedStagesLog = [];
let isInterval = false; // Updated: インターバル中（入力遮断）フラグ

// セーブデータ構造
let allSaveData = { "slot1": null, "slot2": null, "slot3": null, "lastPlayed": 1 };
let currentSlot = "slot1";
let savedData = {
    highScore: { stage: 1, floor: 1, avg: 0.0 },
    history: [], clearedExtra: false, dp: 0,
    bestRanks: {}, unlockedStage4: false,
    deck: [], cards: {}
};

// パック開封処理用
let isOpeningPack = false;
let openingPhase = 0; // 0:None, 1:Summon, 2:Flash, 3:Reveal, 4:Result
let packResults = [];
let currentPackId = "";
let currentRevealIndex = 0;
let pendingCardIndex = -1;
let inputLockUntilRelease = false;

let pendingEffectsQueue = []; // 中断されたエフェクトを保持するキュー

// 指定時間待機するための非同期ヘルパー
const wait = ms => new Promise(res => setTimeout(res, ms));
