// =========================================
// 1. UTILITY FUNCTIONS (ヘルパー関数)
// =========================================
const el = (id) => document.getElementById(id);

// 指定時間待機するための非同期ヘルパー
const wait = ms => new Promise(res => setTimeout(res, ms));

// 配列のシャッフル (フィッシャー–イェーツ)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 指定したURLの画像をプリロードするヘルパー
function preloadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => {
            console.warn("Failed to preload:", url);
            resolve(url);
        };
        img.src = url;
    });
}

// =========================================
// 2. GLOBAL STATE MANAGEMENT (状態管理)
// =========================================
let bluetoothDevice = null;
let bluetoothServer = null;

// セーブデータ管理
let allSaveData = { slot1: null, slot2: null, slot3: null };
let currentSlot = "slot1";

// プレイヤー状態
let player = {
    hp: 100, maxHp: 100, mp: 3, maxMp: 10,
    states: [],
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
let stage = "1-1";
let floor = 1;
let totalScore = 0;
let totalDarts = 0;
let displayPlayerHP = 100;
let displayEnemyHP = 100;
let isProcessing = false;
let currentTurn = 1;
let weakHitCount = 0;
let turnInputs = [];
let currentInput = "";
let isJustFinish = false;
let cheatBuffer = "";
let stageStartTurn = 0;
let totalGameTurns = 0;
let clearedStagesLog = [];
let isInterval = false;

// セーブデータ構造
let savedData = {
    highScore: { stage: 1, floor: 1, avg: 0.0 },
    history: [],
    clearedExtra: false,
    dp: 0,
    souls: 0,              // ★ 新規: 所持ソウル
    unlockedReliefs: [],   // ★ 新規: 所持しているレリーフIDリスト
    equippedReliefs: [null, null, null], // ★ 新規: 装備中のレリーフ (3枠)
    bestRanks: {},
    stageStats: {},
    unlockedStage4: false,
    deck: [],
    cards: {},
    collection: {}
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

// =========================================
// 3. STATE ENGINE HELPERS (ステートエンジン)
// =========================================

// Updated: ステート更新ロジック (Caster-Based / Actor-Based)
// turnOwner: "PLAYER" | "ENEMY"
// timing: "round" | "throw"
function tickStates(turnOwner, timing) {
    const ownerObj = (turnOwner === "PLAYER") ? player : enemy;

    // プレイヤーと敵、両方のステートをスキャン
    [player, enemy].forEach(obj => {
        if (!obj.states) return;

        // 1. カウントダウン
        obj.states.forEach(s => {
            if (typeof STATE_MASTER === 'undefined') return;
            const master = STATE_MASTER[s.id];
            if (!master || master.timing !== timing) return;

            let shouldDecrease = false;
            if (timing === "round") {
                // Roundタイミング: そのターンの持ち主(caster)がかけたものが、その人のターン周期で減少
                shouldDecrease = (s.caster === turnOwner);
            } else if (timing === "throw") {
                // Throwタイミング: 今投げている本人(obj)にかかっているものが減少
                shouldDecrease = (obj === ownerObj);
            }

            if (shouldDecrease) {
                s.turn--;
            }
        });

        // 2. ログ出力と削除
        obj.states.forEach(s => {
            if (s.turn === 0) {
                if (typeof STATE_MASTER !== 'undefined') {
                    const master = STATE_MASTER[s.id];
                    if (master && master.label) {
                        addLog(`【終了】${master.label}`, "log-system");
                    }
                }
            }
        });
        obj.states = obj.states.filter(s => s.turn > 0);
    });
}

// ヘルパー: 特定のステートを持っているかチェックする (Robust Version)
function hasState(obj, category) {
    if (!obj || !obj.states) return false;
    // START_MASTER undefined check added to prevent crash
    if (typeof STATE_MASTER === 'undefined') {
        console.warn("STATE_MASTER is undefined");
        return false;
    }
    return obj.states.some(s => {
        const master = STATE_MASTER[s.id];
        return master && master.category === category;
    });
}

// 余韻時間の算出
function getCalculatedWait(skill) {
    if (skill.visual && skill.visual.wait) return skill.visual.wait;
    return skill.name ? TIMING.SKILL_AFTERGLOW_NAMED : TIMING.SKILL_AFTERGLOW;
}

// 条件判定エンジン (v4.1)
function checkCondition(c) {
    if (!c) return true;

    let targetVal = 0;
    switch (c.src) {
        case "e_hp": targetVal = (enemy.hp / enemy.maxHp) * 100; break;
        case "p_hp": targetVal = (player.hp / player.maxHp) * 100; break;
        case "p_mp": targetVal = player.mp; break;
        case "hand": targetVal = player.hand.length; break;
        case "turn": targetVal = enemy.actionCount; break;
        case "turn_mod": return enemy.actionCount > 0 && (enemy.actionCount % c.val === 0);
        case "p_state":
        case "e_state":
            const obj = (c.src === "p_state") ? player : enemy;
            const state = obj.states.find(s => STATE_MASTER[s.id] && STATE_MASTER[s.id].category === c.tag);
            targetVal = state ? state.turn : 0;
            break;
        case "trap": return !!player.setCard === c.val;
    }

    if (c.op === "lt") return targetVal < c.val;
    if (c.op === "lte") return targetVal <= c.val;
    if (c.op === "gt") return targetVal > c.val;
    if (c.op === "gte") return targetVal >= c.val;
    if (c.op === "eq") return Math.round(targetVal) === c.val;

    return true;
}
// 互換性維持のためエイリアスを設定
const checkAICondition = checkCondition;

// =========================================
// 4. WORLD MAP HELPERS (ステージ情報)
// =========================================

// ステージIDからステージデータを検索・取得
function getStageData(stageId) {
    const idStr = String(stageId);
    for (const areaKey in WORLD_MAP) {
        const area = WORLD_MAP[areaKey];
        const stageObj = area.stages.find(s => s.id === idStr);
        if (stageObj) return stageObj;
    }
    return WORLD_MAP["AREA_1"].stages[0];
}

// WORLD_MAPを走査して「次の通常ステージID」を見つける
function getNextStageId(currentId) {
    let allNormalStages = [];
    Object.values(WORLD_MAP).forEach(area => {
        allNormalStages = allNormalStages.concat(area.stages.filter(s => s.type === "NORMAL"));
    });

    const currentIndex = allNormalStages.findIndex(s => s.id === currentId);
    if (currentIndex >= 0 && currentIndex < allNormalStages.length - 1) {
        return allNormalStages[currentIndex + 1].id;
    }
    return null;
}

// ステージ表示名を取得
function getStageDisplayName(stageId) {
    const data = getStageData(stageId);
    return data ? data.title : "UNKNOWN";
}

// ステージの最大フロア数を取得
function getMaxFloors(stageId) {
    const data = getStageData(stageId);
    return data ? data.floors.length : 1;
}

// ボスフロアかどうかを判定
function isBossFloor(stageId, flr) {
    const data = getStageData(stageId);
    if (!data) return false;
    const bossStart = data.bossFloor || data.floors.length;
    return flr >= bossStart;
}

// ステージ背景画像のURLを取得
function getStageBackground(stageId, flr) {
    const data = getStageData(stageId);
    if (!data) return "";
    if (isBossFloor(stageId, flr) && data.bossBg) {
        return data.bossBg;
    }
    return data.bg;
}

// BGM管理の一元化関数
function updateStageBGM(stgId, flr) {
    const sData = getStageData(stgId);
    if (!sData) return;

    const isBoss = isBossFloor(stgId, flr);

    if (sData.type === "EXTRA") {
        playBGM("bgm-extra");
    } else if (isBoss) {
        playBGM("bgm-boss");
    } else {
        playBGM("bgm-battle");
    }
}

// ステージ解放判定
function isStageUnlocked(stageId) {
    if (stageId === "1-1") return true;

    const sData = getStageData(stageId);
    if (!sData) return false;

    if (sData.type === "EXTRA") {
        return !!savedData.bestRanks["1-3"];
    }

    let allStages = [];
    Object.values(WORLD_MAP).forEach(area => {
        allStages = allStages.concat(area.stages);
    });

    const idx = allStages.findIndex(s => s.id === stageId);
    if (idx > 0) {
        const prevStage = allStages[idx - 1];
        if (stageId === "2-1") return !!savedData.bestRanks["1-3"];

        return !!savedData.bestRanks[prevStage.id];
    }

    return false;
}

// =========================================
// 5. RATING & STATS (評価・統計)
// =========================================

// ダーツのPPR(Point Per Round)からレーティングを算出
function calculateRating(ppr) {
    const entry = RATING_TABLE.find(row => ppr >= row.ppr);
    return entry ? entry.rt : 1;
}

// ステージクリア時のランク判定
function calculateStageRank(stageId, turns) {
    const data = getStageData(stageId);
    const th = data.rankThresholds || { SSS: 12, S: 16, A: 22, B: 30 };
    let rank = "C";

    if (turns <= th.SSS) rank = "SSS";
    else if (turns <= th.S) rank = "S";
    else if (turns <= th.A) rank = "A";
    else if (turns <= th.B) rank = "B";

    return [rank, RANK_BONUS[rank] || 50];
}
