console.log("★ main.js is loaded! (v2.18.3 Fixed Variable Scope)");

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
// 2. AUDIO SYSTEM (サウンド管理)
// =========================================
let gameConfig = { bgmVolume: 0.3, sysVolume: 0.5, atkVolume: 0.8 };
let currentBgmId = "";

function loadGameConfig() {
    const saved = localStorage.getItem("darts_quest_config");
    if (saved) {
        try {
            gameConfig = { ...gameConfig, ...JSON.parse(saved) };
        } catch (e) {
            console.error("Config Load Error:", e);
        }
    }
}
loadGameConfig();

function saveGameConfig() {
    localStorage.setItem("darts_quest_config", JSON.stringify(gameConfig));
}

function stopAllBGM() {
    AUDIO_ASSETS.BGM.forEach(id => {
        const audioEl = document.getElementById(id);
        if (audioEl) {
            audioEl.pause();
            audioEl.currentTime = 0;
        }
    });
    currentBgmId = "";
}

function playBGM(id) {
    if (currentBgmId === id) return; // 既に再生中なら何もしない
    stopAllBGM();
    const audioEl = document.getElementById(id);
    if (audioEl) {
        currentBgmId = id;
        audioEl.volume = gameConfig.bgmVolume;
        audioEl.play().catch(e => console.log("BGM Error:", e));
    }
}

function updateCurrentBgmVolume() {
    if (currentBgmId) {
        const audioEl = document.getElementById(currentBgmId);
        if (audioEl) audioEl.volume = gameConfig.bgmVolume;
    }
}

function playSE(id) {
    const audioEl = document.getElementById(id);
    if (audioEl) {
        audioEl.currentTime = 0;
        if (AUDIO_ASSETS.SE_ATTACK.includes(id)) {
            audioEl.volume = gameConfig.atkVolume;
        } else {
            audioEl.volume = gameConfig.sysVolume;
        }
        
        if (audioEl.volume > 0.01) {
            audioEl.play().catch(e => { });
        }
    }
}


// =========================================
// 3. VISUAL EFFECTS (演出処理)
// =========================================

// フローティングテキスト (DRAW! など)
function triggerFloatText(text, targetEl) {
    if (!targetEl) return;
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

// Updated: triggerEffect (位置情報をクラスで管理)
function triggerEffect(el, dmg, isPlayer, isHeal = false) {
    if (!isHeal && dmg > 0) {
        const shakeClass = dmg > 50 ? "shake-heavy" : "shake-small";
        const container = document.getElementById("game-container");
        container.classList.remove("shake-small", "shake-heavy");
        void container.offsetWidth; 
        container.classList.add(shakeClass);
        setTimeout(() => container.classList.remove(shakeClass), 500);
    }

    const pop = document.createElement("div");
    // ★ターゲットに応じて側（side）を決定
    const sideClass = isPlayer ? "player-side" : "enemy-side";
    pop.className = `damage-float ${sideClass} ${isHeal ? 'heal' : ''}`;
    
    pop.innerText = dmg === 0 ? "MISS" : dmg;
    el.appendChild(pop);
    
    setTimeout(() => pop.remove(), 1200);
}

// 画面サイズ調整 (レスポンシブ対応)
function resizeGame() {
    const scaler = el('game-scaler');
    if (!scaler) return;
    
    if (window.innerWidth >= 900) {
        // PC向け: スケーリング処理
        const scale = Math.min(window.innerWidth / 900, window.innerHeight / 620) * 0.95;
        scaler.style.transform = `scale(${scale})`;
        scaler.style.width = "900px";
        scaler.style.height = "620px";
        scaler.style.position = "static";
        document.body.style.overflow = "hidden";
    } else {
        // モバイル向け: フル幅表示
        scaler.style.transform = "none";
        scaler.style.width = "100%";
        scaler.style.height = "auto";
        document.body.style.overflowY = "auto";
    }
}

// バトルログのアナウンス表示
function announce(text, type = "normal") {
    const ann = el("battle-announcer") || document.createElement("div");
    ann.id = "battle-announcer";
    if (!ann.parentNode) el("enemy-panel").appendChild(ann);
    
    ann.innerHTML = text;
    ann.className = "announcer-visible";
    
    if (type === "danger" || type === "log-enemy") ann.classList.add("ann-danger");
    if (type === "log-skill" || type === "log-weak") ann.classList.add("ann-warn");
    
    setTimeout(() => {
        ann.className = "";
    }, 2000);
}

// ログ出力＆アナウンス振り分け
function addLog(text, type = "") {
    console.log(`[${type}] ${text}`);
    // 特定のログタイプのみ画面中央にアナウンスする
    if ((type === "log-enemy" || type === "log-skill" || type === "log-weak" || type === "log-heal" || 
         text.includes("WEAK") || text.includes("無効") || text.includes("回復")) && 
        !text.includes("倒した") && !text.includes("宝箱")) {
        announce(text, type);
    }
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
    state: {
        guardTurn: 0, // 光の護封剣用
        itemLockTurn: 0, // アイテムロック用
        restrictInput: false // 1投制限用
    },
    deck: [], hand: [], discard: [], deckLocked: false, setCard: null
};

// 敵状態
let enemy = {
    hp: 100, maxHp: 100, data: null, name: "",
    state: {
        charge: false, guard: false, guardType: null, guardTurn: 0,
        atkBuff: 0, isStunned: false, barrierLimit: 0
    }
};

// ゲーム進行フラグ
let stage = 1;
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

// =========================================
// 6. INITIALIZATION (初期化処理)
// =========================================
window.addEventListener('resize', resizeGame);
window.addEventListener('load', () => {
    resizeGame();
    loadGameData();
    initSlotScreen();
    if (window.innerWidth < 900) document.body.style.overflowY = "auto";
});

function loadGameData() {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
        try {
            allSaveData = JSON.parse(saved);
        } catch (e) {
            console.error(e);
        }
    }
    // データ整合性チェック
    if (!allSaveData.slot1) allSaveData.slot1 = null;
    if (!allSaveData.slot2) allSaveData.slot2 = null;
    if (!allSaveData.slot3) allSaveData.slot3 = null;
}

function saveToDrive() {
    allSaveData[currentSlot] = savedData;
    localStorage.setItem(SAVE_KEY, JSON.stringify(allSaveData));
}

function initSlotScreen() {
    for (let i = 1; i <= 3; i++) {
        const key = "slot" + i;
        const data = allSaveData[key];
        const infoEl = el("info-" + i);
        
        if (!data) {
            infoEl.innerHTML = "<div class='slot-empty'>NO DATA<br>- Start New Game -</div>";
        } else {
            let stgName = getStageDisplayName(data.highScore.stage);
            
            let stg = `${stgName} - ${data.highScore.floor}F`;
            let badge = data.clearedExtra ? "<br><span style='color:#f0f;font-weight:bold;'>★ EXTRA CLEARED</span>" : "";
            
            infoEl.innerHTML = `
                <div>${stg}</div>
                <div style='color:#ffdd00;'>Avg: ${data.highScore.avg.toFixed(1)} (Rt ${calculateRating(data.highScore.avg)})</div>
                <div style='color:#aaa;font-size:12px;'>DP: ${data.dp || 0}${badge}</div>
            `;
        }
    }
}

function selectSlot(n) {
    currentSlot = "slot" + n;
    
    // データがない場合は初期化
    if (!allSaveData[currentSlot]) {
        allSaveData[currentSlot] = {
            highScore: { stage: 1, floor: 1, avg: 0.0 },
            history: [], clearedExtra: false, dp: 0,
            bestRanks: {}, unlockedStage4: false, deck: [], cards: {}
        };
    }
    
    savedData = allSaveData[currentSlot]; 
    
    // データ修復
    if (!savedData.deck) savedData.deck = [];
    if (!savedData.cards) savedData.cards = {};
    allSaveData[currentSlot] = savedData;
    
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
    let stg = getStageDisplayName(savedData.highScore.stage);
    
    if (el("hs-reach")) el("hs-reach").innerText = `${stg} - ${savedData.highScore.floor}F`;
    if (el("hs-avg")) el("hs-avg").innerText = savedData.highScore.avg.toFixed(1);
    if (el("hs-rt")) el("hs-rt").innerText = "Rt " + calculateRating(savedData.highScore.avg);
    if (el("dp-display")) el("dp-display").innerText = "DP: " + (savedData.dp || 0);
    
    // コンフィグボタン生成
    if (!document.getElementById("btn-config-entry")) {
        const titleScreen = el("title-screen");
        if (titleScreen) {
            const btn = document.createElement("div");
            btn.id = "btn-config-entry";
            btn.className = "config-btn-title";
            btn.innerText = "⚙️ CONFIG";
            btn.onclick = openConfigModal;
            titleScreen.appendChild(btn);
        }
    }
}


// =========================================
// 7. BLUETOOTH CONNECTION (通信)
// =========================================
async function connectToBoard() {
    try {
        const btn = el("bt-connect-btn");
        if (bluetoothDevice && bluetoothDevice.gatt.connected) {
            alert("既に接続されています");
            return;
        }
        
        unlockAudioContext(); // iOS対策
        btn.innerText = "Scanning...";
        
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: 'DARTSLIVE' }],
            optionalServices: [DL_SERVICE_UUID]
        });
        
        bluetoothDevice = device;
        device.addEventListener('gattserverdisconnected', onDisconnected);
        
        const server = await device.gatt.connect();
        bluetoothServer = server;
        
        const service = await server.getPrimaryService(DL_SERVICE_UUID);
        const characteristic = await service.getCharacteristic(DL_NOTIFY_UUID);
        
        await characteristic.startNotifications();
        characteristic.addEventListener('characteristicvaluechanged', handleBluetoothNotify);
        
        btn.innerText = "📡 CONNECTED";
        btn.classList.add("connected");
        addLog(">> ダーツボード接続成功！", "log-heal");
        
    } catch (error) {
        console.error("BT Error:", error);
        alert("接続に失敗しました: " + error);
        const btn = el("bt-connect-btn");
        btn.innerText = "📡 CONNECT BOARD";
        btn.classList.remove("connected");
    }
}

function unlockAudioContext() {
    const sounds = ["se-single", "se-double", "se-triple", "se-bull", "se-dbull", "se-hit", "se-attack"];
    sounds.forEach(id => {
        const audio = document.getElementById(id);
        if (audio) {
            audio.volume = 0;
            audio.play().then(() => {
                audio.pause();
                audio.currentTime = 0;
                audio.volume = 0.5;
            }).catch(e => console.log("Audio unlock skipped:", e));
        }
    });
}

function onDisconnected(event) {
    const btn = el("bt-connect-btn");
    btn.innerText = "📡 CONNECT BOARD";
    btn.classList.remove("connected");
    addLog(">> ダーツボード切断", "log-enemy");
}

function handleBluetoothNotify(event) {
    if (el("game-screen").style.display === "none" || isProcessing || isInterval) return; // Updated: isInterval を追加
    
    const value = event.target.value;
    if (value.byteLength > 2) {
        const areaId = value.getUint8(2);
        const scoreData = DL_SCORE_MAP[areaId];
        
        if (scoreData !== undefined && scoreData !== "CHANGE") {
            const score = scoreData[0];
            const type = scoreData[1];
            
            // 効果音再生
            if (type === 4) playSE("se-dbull");
            else if (type === 3) playSE("se-bull");
            else if (type === 2) playSE("se-triple");
            else if (type === 1) playSE("se-double");
            else playSE("se-single");
            
            processOneThrow(score);
        }
    }
}


// =========================================
// 8. GAME LOOP START (ゲーム開始・遷移)
// =========================================
// ステージ表示名を取得 (例: "STAGE 1", "EXTRA", "STAGE 5")
function getStageDisplayName(stg) {
    const info = STAGE_MASTER[stg];
    return info ? info.displayName : `STAGE ${stg}`;
}

// ステージの最大フロア数を取得
function getMaxFloors(stg) {
    const info = STAGE_MASTER[stg];
    return info ? info.floors : 5;
}

// ボスフロアかどうかを判定 (bossFloor未定義時はfloors値を使用)
function isBossFloor(stg, flr) {
    const info = STAGE_MASTER[stg];
    if (!info) return false;
    return flr >= (info.bossFloor || info.floors);
}

// ステージ背景画像のURLを取得
function getStageBackground(stg, flr) {
    const info = STAGE_MASTER[stg];
    if (!info) return "";
    if (typeof info.img === 'string') return info.img;
    return isBossFloor(stg, flr) ? info.img.boss : info.img.default;
}

// ステージ解放判定 (一元管理)
function isStageUnlocked(stageId) {
    if (stageId <= 3) return true;
    if (stageId === 4) return !!(savedData.unlockedStage4 || (savedData.bestRanks && savedData.bestRanks[3]) || savedData.clearedExtra);
    if (stageId === 5) return !!savedData.clearedExtra;
    if (stageId === 6) return !!(savedData.bestRanks && savedData.bestRanks[4]);
    return false;
}

// Updated: 指定したURLの画像をプリロードするヘルパー (v5.4)
function preloadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => {
            console.warn("Failed to preload:", url);
            resolve(url); // エラーでも進行は止めない
        };
        img.src = url;
    });
}
function initGameSession(startStage, continueMode = false) {
    if (!continueMode) {
        player = {
            ...JSON.parse(JSON.stringify(PLAYER_INITIAL_STATS)), // ディープコピー
            state: {
                atkBuff: 0,    // ★ 1.0 から 0 に修正 (0 = 増加なし)
                atkFlat: 0,
                atkDuration: 0,
                guardTurn: 0,
                itemLockTurn: 0,
                restrictInput: false
            },
            setCard: null,
            deck: [], hand: [], discard: [], deckLocked: false
        };
        totalGameTurns = 0;
        totalScore = 0;
        totalDarts = 0;
        clearedStagesLog = [];
    }
    startTransition(startStage, continueMode);
}

// Updated: startTransition (v6.1 - Using ID Helper)
async function startTransition(sel, continueMode) {
    const info = STAGE_MASTER[sel] || { title: "UNKNOWN", sub: "Unknown Stage", warning: false };
    
    el("chapter-title").innerText = info.title;
    el("chapter-sub").innerText = info.sub;
    const ch = el("chapter-screen");
    
    if (info.warning) { playSE("se-warning"); ch.classList.add("chapter-extra"); } 
    else { playSE("se-tap"); ch.classList.remove("chapter-extra"); }

    el("game-container").style.backgroundImage = "none";
    el("game-container").style.backgroundColor = "#000";

    const isBossStage = [5, 6].includes(sel);
    playBGM(isBossStage ? "bgm-boss" : "bgm-battle");
    el("black-curtain").classList.add("fade-in");
    
    // --- プリロード開始 ---
    const assetsToLoad = [];

    // 背景画像の解決 (STAGE_MASTERから全背景をプリロード)
    const bgData = info.img;
    if (typeof bgData === 'string') {
        assetsToLoad.push(preloadImage(bgData));
    } else {
        if (bgData.default) assetsToLoad.push(preloadImage(bgData.default));
        if (bgData.boss) assetsToLoad.push(preloadImage(bgData.boss));
    }
    
    // 敵画像の解決
    const enemyList = GAME_DATA.enemies[sel] || [];
    enemyList.forEach(e => {
        if (e && e.img) assetsToLoad.push(preloadImage(e.img));
    });

    const introTime = info.warning ? 4000 : 2500;
    const timerPromise = new Promise(resolve => setTimeout(resolve, introTime));
    
    el("title-screen").style.display = "none";
    ch.style.display = "flex";
    ch.style.opacity = 1;

    console.log(`Preloading assets for Stage ${sel}...`);
    await Promise.all(assetsToLoad);
    await timerPromise;

    ch.style.opacity = 0;
    setTimeout(() => {
        ch.style.display = "none";
        el("black-curtain").classList.remove("fade-in");
        setupStage(sel, continueMode); 
    }, 1000);
}

// Updated: triggerEncounterEffects (v5.7 - Force Visibility)
function triggerEncounterEffects() {
    const isBoss = isBossFloor(stage, floor);
    const img = el("enemy-img");

    // 一旦クリア
    img.classList.remove("enemy-appear-anim");
    img.style.opacity = "0"; 
    
    // パスチェック
    const targetSrc = enemy.data.img;
    if (!targetSrc) {
        console.error("Enemy Image Path is Missing!");
        handlePreemptiveAI();
        return;
    }

    img.src = targetSrc;

    // 演出
    if (isBoss) {
        el("game-container").classList.add("boss-mode");
        el("boss-label").style.display = "inline";
        playSE("se-warning");
        announce(`WARNING: ${enemy.name}`, "danger");
    } else {
        playSE("se-attack");
        announce(`${enemy.name} APPEARED!`, "normal");
    }

    // ★強制表示ロジック
    const showImage = () => {
        img.classList.add("enemy-appear-anim");
        // アニメーションが失敗しても、0.2秒後には絶対に見えるように上書き
        setTimeout(() => { 
            img.style.opacity = "1"; 
        }, 200);
    };

    if (img.complete) {
        showImage();
    } else {
        img.onload = showImage;
        img.onerror = () => {
            console.error("Image Failed to Load in trigger:", targetSrc);
            handlePreemptiveAI(); // 止まらないように次へ
        };
    }
    
    setTimeout(handlePreemptiveAI, 1200);
}

function setupStage(sel, continueMode) {
    stage = sel;
    floor = 1;
    isProcessing = false;
    extraBossTurnCount = 0;
    currentTurn = 1;
    stageStartTurn = totalGameTurns;
    
    if (!continueMode) totalDarts = 0;
    if (el("avg-display")) el("avg-display").innerText = "0.0";
    if (el("rt-display")) el("rt-display").innerText = "(Rt -)";
    el("battle-log").innerHTML = "";
    el("game-screen").style.display = "block";
    
    const enemyPanel = el("enemy-panel");
    if (enemyPanel && !document.getElementById("battle-announcer")) {
        const announcer = document.createElement("div");
        announcer.id = "battle-announcer";
        enemyPanel.appendChild(announcer);
    }
    
    if (!continueMode) {
        player.mp = 0;
        player.deckLocked = false;
        
        // デッキチェック
        if (!savedData.deck || savedData.deck.length < DECK_SIZE) {
            player.deckLocked = true;
            player.deck = [];
            player.hand = [];
            player.discard = [];
            addLog(`⚠ デッキ不完全: カード機能封鎖`, "log-system");
        } else {
            player.deck = shuffleArray([...savedData.deck]);
            player.hand = [];
            player.discard = [];
        }
    } else {
        addLog(">> 前ステージの状態を引き継ぎました", "log-system");
    }
    
    spawnEnemy();
    resizeGame();
}
// Updated: spawnEnemy (v7.1 - ATK assignment & Image Reset)
function spawnEnemy() {
    if (player.hp <= 0) return;
    
    try {        
        enemy.state = { charge: false, isStunned: false, atkBuff: 0, atkBuffTurn: 0, guardTurn: 0, guardType: null, guardValue: 0, barrierTurn: 0, barrierLimit: 0, actionCount: 0, 
            patternQueue: enemy.state?.patternQueue || [] // 継続中の行動を維持
        };
        currentTurn = 0; turnInputs = []; currentInput = ""; isJustFinish = false; waitingForChest = false; dropGuaranteed = false; weakHitCount = 0;
        
        updateScoreDisplay();
        
        el("flash-overlay").className = "";
        const container = el("game-container");
        container.classList.remove("shake-heavy", "shake-medium", "shake-small", "boss-mode");
        el("boss-label").style.display = "none";
        el("chest-img").style.display = "none";
        
        // ★修正: 出現前に画像を一度消し、不透明度をリセット
        const img = el("enemy-img");
        img.style.display = "none";
        img.src = "";
        img.classList.remove("enemy-appear-anim");

        const bgUrl = getStageBackground(stage, floor);
        if (bgUrl) container.style.backgroundImage = `url('${bgUrl}')`;

        let list = GAME_DATA.enemies[stage] || GAME_DATA.enemies[1];
        if (stage === 5) list = GAME_DATA.enemies[5];
        if (stage === 6) list = GAME_DATA.enemies[6];
        enemy.data = list[(floor - 1) % list.length];
        
        // ★重要: 基礎攻撃力を反映
        enemy.atk = enemy.data.atk || 10; 
        
        enemy.maxHp = enemy.data.hp || (100 + (stage - 1) * 50 + (floor - 1) * 30);
        enemy.name = enemy.data.name;
        enemy.hp = enemy.maxHp;
        displayEnemyHP = enemy.hp;

        const isBoss = isBossFloor(stage, floor);
        if (isBoss) playBGM("bgm-boss");

        isProcessing = true;
        
        // 余韻のあとに画像を表示して開始
        const spawnDelay = (floor === 1) ? 1500 : 500;
        setTimeout(() => {
            img.style.display = "block"; // ここで表示
            triggerEncounterEffects();
        }, spawnDelay);

        updateInfo();

    } catch (e) {
        console.error("Spawn Error:", e);
        isProcessing = false;
    }
}

// Updated: triggerEncounterEffects (v6.0 - No Animation, Just Display)
function triggerEncounterEffects() {
    const isBoss = isBossFloor(stage, floor);
    const img = el("enemy-img");

    // 画像パスのセット（即座に反映）
    img.src = enemy.data.img;
    
    // 文字と音の演出
    if (isBoss) {
        el("game-container").classList.add("boss-mode");
        el("boss-label").style.display = "inline";
        playSE("se-warning");
        announce(`WARNING: ${enemy.name}`, "danger");
    } else {
        playSE("se-attack");
        announce(`${enemy.name} APPEARED!`, "normal");
    }

    // 画像の読み込み状況に関わらず、少し待ってから次へ進む
    // (画像が出なくてもゲームが止まらないようにする)
    setTimeout(handlePreemptiveAI, 1000);
}

// Updated: handlePreemptiveAI (v3.0 Async Support)
async function handlePreemptiveAI() {
    const aiList = enemy.data.ai || [];
    const preemptiveSkill = aiList.find(a => a.preemptive && checkAICondition(a.cond));

    // 出現演出の完了を少し待つ
    await wait(1200);

    // ★追加: 敵が出現し、名前が出た後にトラップ(落とし穴)を判定
    if (player.setCard) {
        const incomingDmg = triggerTrap('summon', 0);
        // トラップでダメージが発生した場合は少し待つ
        if (incomingDmg > 0) {
            updateInfo();
            if (enemy.hp <= 0) {
                setTimeout(winBattle, 800);
                return;
            }
            await wait(1000);
        }
    }

    if (preemptiveSkill) {
        // 新エンジンで実行し、完了を待つ
        await executeSkill(preemptiveSkill, true);
        await wait(1500);
        preparePlayerTurn();
    } else {
        // 先制なし
        await wait(500);
        preparePlayerTurn();
    }
}


// =========================================
// 9. INPUT & ATTACK LOGIC (入力・攻撃処理)
// =========================================

// キーボード入力処理 (デバッグ用)
function handleEnter() {
    if (isInterval) {
        startPlayerTurn(); // インターバル中にEnterで次へ
        return;
    }
    if (isProcessing) return;
    if (currentInput !== "") {
        const val = parseInt(currentInput);
        if (!isNaN(val)) {
            if (val < 0 || val > 60) {
                alert("単発の最大値は 60 (T20) です");
                currentInput = "";
                updateScoreDisplay();
                return;
            }
            // 効果音
            if (val === 50) playSE("se-bull");
            else if (val >= 51) playSE("se-triple");
            else playSE("se-hit");
            
            processOneThrow(val);
            currentInput = "";
            updateScoreDisplay();
        }
    }
}

// Updated: ダーツ投擲処理 (ジャストフィニッシュ判定の厳密化)
async function processOneThrow(score) {
    if (enemy.hp <= 0 || player.hp <= 0 || isProcessing || isInterval) return;
    if (player.state.restrictInput && turnInputs.length > 0) return;

    // 1. 攻撃計算
    let singleDmg = applyOffenseLogic(score, player, false);

    if (player.state.atkDuration > 0) {
        player.state.atkDuration--;
        if (player.state.atkDuration <= 0) {
            player.state.atkBuff = 0; player.state.atkFlat = 0;
            addLog("攻撃強化終了", "log-system");
        }
    }

    // 2. 防御計算
    singleDmg = await applyDefenseLogic(singleDmg, enemy, true);

    // 3. 判定と適用
    if (player.state.restrictInput) {
        player.state.restrictInput = false;
        addLog("拘束解除", "log-system");
    }

    // ★ジャストフィニッシュ判定 (単発ダメージが残りHPと「等しい」場合のみ)
    if (singleDmg === enemy.hp && enemy.hp > 0) { 
        isJustFinish = true; 
    }

    enemy.hp = Math.max(0, enemy.hp - singleDmg);
    totalScore += score;
    totalDarts++;
    turnInputs.push(score);
    updateScoreDisplay();

    // 弱点判定
    let weakHit = false;
    if (score >= 51 && enemy.data.weak && (score % enemy.data.weak === 0)) {
        dropGuaranteed = true;
        weakHitCount++;
        addLog(`WEAK HIT!!`, "log-weak");
        playSE("se-weak");
    }

    // 演出 (ターゲットは敵なので isPlayer=false)
    triggerEffect(el("game-screen"), singleDmg, false);
    el("enemy-hp-value").innerText = enemy.hp;
    displayEnemyHP = enemy.hp;
    updateInfo();

    if (enemy.hp <= 0) {
        isProcessing = true;
        totalGameTurns++;
        setTimeout(winBattle, 1000);
        return;
    }

    if (turnInputs.length >= 3) {
        setTimeout(finishPlayerTurn, 1000);
    }
}

// プレイヤーターン終了処理
function finishPlayerTurn() {
    totalGameTurns++;
    turnInputs = [];
    currentInput = "";
    updateScoreDisplay();
    
    setTimeout(processEnemyTurn, 500); 
}


// =========================================
// 10. ENEMY AI & BATTLE SYSTEM (敵ターン・決着)
// =========================================
// Updated: 条件判定エンジン (v4.1)
function checkCondition(c) {
    if (!c) return true;
    
    let targetVal = 0;
    switch (c.src) {
        case "e_hp": targetVal = (enemy.hp / enemy.maxHp) * 100; break;
        case "p_hp": targetVal = (player.hp / player.maxHp) * 100; break;
        case "p_mp": targetVal = player.mp; break;
        case "hand": targetVal = player.hand.length; break;
        case "turn": targetVal = enemy.state.actionCount; break;
        case "turn_mod": return enemy.state.actionCount > 0 && (enemy.state.actionCount % c.val === 0);
        case "p_state": 
        case "e_state": // ★追加: 敵自身の状態チェック
            const stateObj = (c.src === "p_state") ? player.state : enemy.state;
            const tag = c.tag.includes("Turn") ? c.tag : c.tag + "Turn";
            // 指定された値（例: 0）と一致するか判定
            return (stateObj[c.tag] || stateObj[tag] || 0) === c.val;
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

// Updated: triggerTrap (v4.6 - Async Support)
async function triggerTrap(triggerType, incomingDmg = 0) {
    if (!player.setCard) return incomingDmg;

    const card = CARD_DB.find(c => c.id === player.setCard);
    if (!card || !card.trap || card.trap.trigger !== triggerType) return incomingDmg;

    if (card.se) playSE(card.se);
    addLog(`【罠】${card.name} 発動！`, "log-skill");

    let finalDmg = incomingDmg;

    // ★ 順番に解決するため for...of ループに変更
    for (const action of card.trap.actions) {
        if (action.type === "NEGATE") {
            finalDmg = 0;
            addLog("攻撃を無効化！", "log-skill");
        } else if (action.type === "DAMAGE_MULT") {
            finalDmg = Math.floor(finalDmg * action.val);
        } else if (action.type === "REFLECT") {
            const rDmg = Math.floor(incomingDmg * (action.mult || 1.0));
            enemy.hp = Math.max(0, enemy.hp - rDmg);
            triggerEffect(el("game-screen"), rDmg, false);
            addLog(`${rDmg} ダメージ反射！`, "log-skill");
        } else {
            // ★ resolveAction を await して演出が終わるのを待つ
            await resolveAction(action, true, card.visual);
        }
        // ★重要: トラップダメージで敵が死んだら即終了
        if (enemy.hp <= 0) break;
    }

    player.discard.push(player.setCard);
    player.setCard = null;
    
    el("flash-overlay").className = "flash-gold";
    setTimeout(() => el("flash-overlay").className = "", 300);

    if (enemy.hp <= 0) {
        setTimeout(winBattle, 500); // 少し待って勝利演出へ
    }

    return finalDmg;
}

// =========================================
// NEW: ATOMIC SKILL ENGINE (v3.0 - Async & Simplified Wait)
// =========================================

// Updated: 指定時間待機するための非同期ヘルパー
const wait = ms => new Promise(res => setTimeout(res, ms));

// Updated: 余韻時間を一律1秒(1000ms)に短縮
function getCalculatedWait(skill) {
    if (skill.visual && skill.visual.wait) return skill.visual.wait;
    // 名前がある技のみ、状況確認のため少しだけ(200ms)足す
    return skill.name ? 1200 : 800;
}

// Updated: processEnemyTurn (v7.1 - Multi-turn Sequence Support)
async function processEnemyTurn() {
    if (enemy.state.isStunned) {
        addLog(`${enemy.name}はスタン中`, "log-system");
        enemy.state.isStunned = false;
        endEnemyTurn(); 
        preparePlayerTurn();
        return;
    }

    enemy.state.actionCount++;
    let selectedSkill = null;

    // 1. 進行中の連続行動があれば優先
    if (enemy.state.patternQueue && enemy.state.patternQueue.length > 0) {
        selectedSkill = enemy.state.patternQueue.shift();
    } else {
        const aiList = enemy.data.ai || [{ weight: 1, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }];
        
        // 2. ★修正: 条件を満たし、かつ「先制用(preemptive)ではない」スキルだけを抽出
        const validActions = aiList.filter(s => !s.preemptive && checkCondition(s.cond));

        // 3. 確定(guaranteed)スキルがあれば選択、なければ重み抽選
        selectedSkill = validActions.find(s => s.guaranteed);
        
        if (!selectedSkill && validActions.length > 0) {
            const totalWeight = validActions.reduce((sum, s) => sum + (s.weight || 1), 0);
            let r = Math.random() * totalWeight;
            for (const s of validActions) {
                r -= (s.weight || 1);
                if (r <= 0) { selectedSkill = s; break; }
            }
        }
    }

    // 万が一のフォールバック
    if (!selectedSkill) selectedSkill = { weight: 1, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] };

    // 3. 抽選されたものが「sequence（複数ターンの行動）」だった場合
    if (selectedSkill.sequence) {
        const queue = [...selectedSkill.sequence];
        const currentAction = queue.shift();
        enemy.state.patternQueue = queue; // 残りをキューに保存
        await executeSkill(currentAction);
    } else {
        // 単発スキルの実行
        await executeSkill(selectedSkill);
    }
    
    endEnemyTurn();

    if (player.hp > 0) {
        preparePlayerTurn();
    }

}

// Updated: executeSkill (プレイヤー/敵 共通)
async function executeSkill(skill, isPreemptive = false, isCard = false) {
    if (!isCard) enemy.state.charge = false;

    // skill.visual が存在しない場合のフォールバック
    const skillVis = skill.visual || {};

    // 1. 演出（カード使用時はカットインなし、SEのみ）
    if (skill.name && !isCard) {
        showSkillCutin(skill.name, skill.visual?.cutin?.color || "fire");
        await wait(1200);
    }
    if (skill.visual?.msg) {
        addLog(skill.visual.msg, "log-enemy");
    }

    // 2. 各アトムを順番に実行
    for (const action of skill.actions) {
         await resolveAction(action, isCard, skillVis);
        if (enemy.hp <= 0 || player.hp <= 0) return; // 決着がついたら中断
        await wait(isCard ? 100 : 300);
    }

    // 3. 余韻
    if (!isPreemptive) {
        const finalWait = isCard ? 500 : getCalculatedWait(skill);
        await wait(finalWait);
    }
}

// Updated: 攻撃ロジックの共通計算機 (v4.4)
// basePower: 点数 または (ATK * 倍率)
// sourceObj: 攻撃者 (player または enemy)
// applyRandom: 乱数を適用するか (ダーツには不要、スキルには必要)
function applyOffenseLogic(basePower, sourceObj, applyRandom = true) {
    const s = sourceObj.state;
    const boost = s.atkBuff || 0;  // 倍率バフ
    const flat = s.atkFlat || 0;    // 固定値加算 (援軍など)

    // 基本計算式: (基礎威力 + 固定加算) * (1.0 + 倍率バフ)
    let finalDmg = (basePower + flat) * (1.0 + boost);

    // スキル攻撃などの場合は乱数(0.9~1.1)を適用
    if (applyRandom) {
        const rand = 0.9 + (Math.random() * 0.2);
        finalDmg *= rand;
    }

    return Math.floor(finalDmg);
}

// Updated: 防御ロジックの共通計算機 (v4.3)
function applyDefenseLogic(dmg, targetObj, isDarts = false) {
    let finalDmg = dmg;

    // 1. 結界 (Barrier) 判定
    if (targetObj.state.barrierTurn > 0 && finalDmg < targetObj.state.barrierLimit) {
        if (!isDarts) addLog("結界が攻撃を弾いた！", "log-enemy");
        return 0; 
    }

    // 2. ガード (Guard/Armor) 判定
    if (finalDmg > 0 && targetObj.state.guardTurn > 0) {
        if (targetObj.state.guardType === 'ratio') {
            finalDmg = Math.floor(finalDmg * targetObj.state.guardValue);
        } else if (targetObj.state.guardType === 'fixed') {
            finalDmg = Math.max(0, finalDmg - targetObj.state.guardValue);
        }
    }
    return finalDmg;
}

// Updated: resolveAction (v4.9.1 - Fixed Reference Error)
async function resolveAction(action, executorIsPlayer = false, skillVisual = {}) {
    // 1. 演出データの解決 (アトムのvisualを優先、なければスキルのvisual)
    const atomVisual = action.visual || {};
    const effectiveVisual = { ...skillVisual, ...atomVisual }; 

    const targetObj = (action.target === "ENEMY") ? enemy : player;
    const isPlayerTarget = (action.target === "PLAYER");

    if (action.cond && !checkCondition(action.cond)) return;

    switch (action.type) {
        case "DAMAGE":
            const count = action.count || 1;
            for (let i = 0; i < count; i++) {
                if (!isPlayerTarget && enemy.hp <= 0) return;

                let dmg = 0;
                if (action.mode === "fixed") {
                    dmg = action.val;
                } else {
                    const source = isPlayerTarget ? enemy : player;
                    const baseAtk = isPlayerTarget ? enemy.atk : 10;
                    const mult = action.mult || action.val || 1.0;
                    dmg = applyOffenseLogic(baseAtk * mult, source, !executorIsPlayer);
                }

                dmg = applyDefenseLogic(dmg, targetObj, false);

                if (isPlayerTarget && dmg > 0) {
                    dmg = await triggerTrap('attack', dmg);
                    if (enemy.hp <= 0) { isProcessing = false; return; }
                }

                if (dmg > 0) {
                    targetObj.hp = Math.max(0, targetObj.hp - dmg);
                    
                    const isBossUlt = (action.mode === "fixed" && dmg > 50);
                    if (isBossUlt) {
                        playSE("se-boom");
                        el("flash-overlay").className = "flash-fire";
                        setTimeout(() => el("flash-overlay").className = "", 600);
                    } else {
                        // 決定した演出データからSEを再生
                        playSE(effectiveVisual.se || (isPlayerTarget ? "se-hit" : "se-attack"));
                    }

                    triggerEffect(el("game-screen"), dmg, isPlayerTarget);
                    
                    if (action.drain) {
                        await wait(400);
                        const heal = Math.floor(dmg * 1.0);
                        const attacker = isPlayerTarget ? enemy : player;
                        attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
                        addLog(`${heal} 吸収！`, "log-skill");
                        triggerEffect(el("game-screen"), heal, !isPlayerTarget, true);
                    }
                } else {
                    if (isPlayerTarget) triggerEffect(el("game-screen"), 0, true);
                }

                updateInfo();
                if (targetObj.hp <= 0) {
                    if (!isPlayerTarget) setTimeout(winBattle, 500);
                    return; 
                }
                if (count > 1) await wait(400);
            }
            break;

        case "HEAL":
            playSE(effectiveVisual.se || "se-heal");
            const hVal = (action.val === "FULL" || action.val > 500) ? (targetObj.maxHp - targetObj.hp) : action.val;
            targetObj.hp = Math.min(targetObj.maxHp, targetObj.hp + hVal);
            triggerEffect(el("game-screen"), hVal, isPlayerTarget, true);
            break;

        case "STATE":
            const turn = action.turn || 1;
            const val = action.val || 0;
            if (action.kind === "atk_buff" || action.kind === "atk_flat") {
                if (action.kind === "atk_buff") targetObj.state.atkBuff = val;
                if (action.kind === "atk_flat") targetObj.state.atkFlat = val;
                if (isPlayerTarget) targetObj.state.atkDuration = turn;
                else targetObj.state.atkBuffTurn = turn;
            } else if (action.kind === "guard_ratio") {
                targetObj.state.guardTurn = turn;
                targetObj.state.guardType = 'ratio';
                targetObj.state.guardValue = val;
            } else if (action.kind === "guard_fixed") {
                targetObj.state.guardTurn = turn;
                targetObj.state.guardType = 'fixed';
                targetObj.state.guardValue = val;
            } else if (action.kind === "barrier") {
                targetObj.state.barrierTurn = turn;
                targetObj.state.barrierLimit = val;
            } else if (action.kind === "charge") {
                targetObj.state.charge = true;
            } else if (action.kind === "item_lock") {
                targetObj.state.itemLockTurn = turn;
            } else if (action.kind === "bind") {
                player.state.restrictInput = true;
            } else if (action.kind === "stun") {
                targetObj.state.isStunned = true;
            } else if (action.kind === "break_guard") {
                targetObj.state.guardTurn = 0;
            }
            playSE(effectiveVisual.se || "se-buff");
            if (effectiveVisual.msg) addLog(effectiveVisual.msg, "log-skill");
            break;

        case "DRAW":
            for (let j = 0; j < action.val; j++) {
                executeDrawWithAnim();
                await wait(250);
            }
            break;
        case "DISCARD_SELECT":
            isProcessing = false; 
            await openDiscardSelector(action.count);
            isProcessing = true;
            break;
        case "DISCARD_ALL":
            while (player.hand.length > 0) player.discard.push(player.hand.pop());
            addLog("全手札を捨てた！", "log-skill");
            break;
        case "SPECIAL_SALVAGE":
            const msg = executeSalvageMagic();
            addLog(msg, "log-skill");
            break;
    }
    updateInfo();
}

// Updated: endEnemyTurn (v4.3 - Universal Ticking)
function endEnemyTurn() {
    const tick = (obj) => {
        const s = obj.state;
        // 時間（ターン）で管理しているものだけを減らす
        if (s.atkBuffTurn > 0) s.atkBuffTurn--; // 敵用
        if (s.guardTurn > 0) s.guardTurn--;     // 共通
        if (s.barrierTurn > 0) s.barrierTurn--; // 敵用
        if (s.itemLockTurn > 0) s.itemLockTurn--; // プレイヤー用
        
        // --- 0になった時のクリーンアップ ---
        if (s.guardTurn === 0) { s.guardType = null; s.guardValue = 0; }
        if (s.barrierTurn === 0) s.barrierLimit = 0;
        if (s.atkBuffTurn === 0 && obj === enemy) s.atkBuff = 0; 
        
        // ※ ここで player.state.atkDuration は「投数」なので触らない！
    };

    tick(enemy, false);
    tick(player, true);

    updateInfo();
}
// Updated: プレイヤーターンの準備（インターバル開始）
function preparePlayerTurn() {
    isInterval = true;
    isProcessing = false;
    
    const overlay = el("interval-screen");
    const msg = el("interval-msg");
    const sub = el("interval-sub");
    
    // 1Fかつ手札がない場合は初期ドローを案内
    if (floor === 1 && player.hand.length === 0) {
        msg.innerText = "GET CARDS";
        sub.innerText = "TAP TO DRAW 3 CARDS";
    } else {
        msg.innerText = "PULL DARTS";
        sub.innerText = "TAP TO DRAW";
    }
    
    overlay.style.display = "flex";
    updateInfo();
}

// Updated: startPlayerTurn (演出強化版)
async function startPlayerTurn() {
    if (!isInterval) return;
    
    isInterval = false;
    el("interval-screen").style.display = "none";
    
    // 1. MPチャージ演出 (非同期で1つずつ増やす)
    await animateMPGain(3);
    
    // 2. ターンの進行
    currentTurn++;
    
    // 3. ドロー演出
    if (floor === 1 && player.hand.length === 0) {
        let dCount = 0;
        const drawLoop = setInterval(() => {
            executeDrawWithAnim();
            dCount++;
            if (dCount >= 3) {
                clearInterval(drawLoop);
            }
        }, 250);
    } else {
        setTimeout(() => {
            executeDrawWithAnim();
        }, 200);
    }
}
function executeDrawWithAnim() {
    if (player.deck.length === 0 || player.hand.length >= HAND_SIZE) return;
    
    const cardId = player.deck.pop();
    player.hand.push(cardId);
    playSE("se-item");
    
    updateInfo(); // DOMを作成
    
    // 作成されたばかりの最後のカード要素にアニメーションクラスを付与
    const handCards = el("hand-area").querySelectorAll(".std-card");
    const lastCard = handCards[handCards.length - 1];
    if (lastCard) {
        lastCard.classList.add("card-draw-anim");
        setTimeout(() => {
            lastCard.classList.remove("card-draw-anim");
        }, 500);
    }
}
// Updated: MPを1つずつチャージする演出
async function animateMPGain(amount) {
    for (let i = 0; i < amount; i++) {
        if (player.mp >= player.maxMp) break;
        
        player.mp++;
        playSE("se-tap"); // 1音ずつ鳴らす
        
        // UI更新（一瞬だけchargingクラスを付けるために手動で操作）
        const dots = el("player-mp-dots").querySelectorAll(".mp-dot");
        const targetDot = dots[player.mp - 1];
        if (targetDot) {
            targetDot.classList.add("charging");
            setTimeout(() => targetDot.classList.remove("charging"), 200);
        }
        
        updateInfo(); // 全体更新
        await new Promise(resolve => setTimeout(resolve, 150)); // 少し待機
    }
}

// Updated: winBattle (v7.1 - Clear image)
function winBattle() {
    if (player.hp <= 0) return;
    
    addLog(`${enemy.name} を倒した`, "system");
    
    // ★追加: 敵の画像を消す
    el("enemy-img").style.display = "none";

    if (isJustFinish) {
        player.maxHp += 10;
        player.hp = Math.min(player.hp + 10, player.maxHp);
        playSE("se-heal");
        addLog(`★JUST FINISH! MaxHP+10 & HP+10`, "heal");
        updateInfo();
        setTimeout(() => {
            showDialog("JUST FINISH BONUS!!", `見事！ピッタリで倒した！<br>最大HPが ${player.maxHp} にアップ！<br>HPも10回復した。`, "clear", [{ text: "OK", action: checkDrop }], 3000);
        }, 800);
    } else {
        setTimeout(checkDrop, 800);
    }
}

function loseGame() {
    isProcessing = true;
    playBGM("bgm-lose");
    
    const ppr = totalDarts > 0 ? ((totalScore / totalDarts) * 3).toFixed(1) : 0;
    finishSession("LOSE", parseFloat(ppr), STAGE_MASTER[stage]?.multiplier || 1.0, "", 0);

    showDialog(
        "YOU DIED", 
        "力尽きました...", 
        "warning", 
        [{ 
            text: "RETURN TO TITLE", 
            action: () => {
                returnToTitle();
            } 
        }]
    );
}


// =========================================
// 11. ITEM & DROP SYSTEM (ドロップ・進行)
// =========================================
function checkDrop() {
    // 最終ボス(Stage4以上)はドロップなしで次へ
    if (floor === getMaxFloors(stage) && stage >= 4) { nextStep(); return; }

    const isBoss = isBossFloor(stage, floor);
    let dropRate = isBoss ? 1.0 : 0.3;
    if (dropGuaranteed) dropRate = 1.0;
    
    if (Math.random() < dropRate) {
        waitingForChest = true;
        el("enemy-img").style.display = "none";
        el("chest-img").style.display = "block";
        el("chest-img").classList.add("chest-shine");
        playSE("se-chest");
        addLog("宝箱を見つけた！", "log-item");
        setTimeout(() => { if (waitingForChest) openChest(); }, 1500);
    } else {
        nextStep();
    }
}

function openChest() {
    if (!waitingForChest) return;
    waitingForChest = false;
    playSE("se-item");
    
    const conf = CHEST_DROP_CONFIG;
    let seedRate = conf.seed_rates.base;
    if (weakHitCount >= 3) seedRate = conf.seed_rates.weak3;
    else if (weakHitCount >= 2) seedRate = conf.seed_rates.weak2;
    
    const rand = Math.random();
    let itemKey = "";
    
    if (rand < seedRate) itemKey = "seed";
    else if (Math.random() < 0.6) itemKey = "potion";
    else itemKey = "ether";
    
    const item = ITEM_EFFECTS[itemKey];
    player.items[itemKey]++;
    
    updateInfo();
    addLog(`宝箱: ${item.name} (${item.msg}) を手に入れた`, "log-item");
    showDialog("TREASURE!", `<span style="font-size:24px;color:#00ff00;">${item.name}</span> を手に入れた！<br>${item.msg}<br>(アイテムボタンで使用可能)`, "item", [{ text: "OK", action: nextStep }], 2000);
}

function nextStep() {
    floor++;
    const ppr = totalDarts > 0 ? ((totalScore / totalDarts) * 3).toFixed(1) : 0;
    const isStageClear = floor > getMaxFloors(stage);

    if (isStageClear) {
        // ステージクリア処理
        const stageTurns = totalGameTurns - stageStartTurn;
        const [rank, dpBonus] = calculateStageRank(stage, stageTurns);
        const mult = STAGE_MASTER[stage]?.multiplier || 1.0;
        
        // 報酬計算
        const scoreDP = Math.floor(totalScore * 0.2 * mult);
        let pendingBonusDP = dpBonus;
        clearedStagesLog.forEach(log => { pendingBonusDP += log.dp; });
        let potentialTotalDP = scoreDP + pendingBonusDP;
        
        clearedStagesLog.push({ stage: stage, rank: rank, dp: dpBonus });
        
        // ベストランク更新
        const currentBest = savedData.bestRanks[stage];
        const ranksOrder = ["SSS", "S", "A", "B", "C"];
        if (!currentBest || ranksOrder.indexOf(rank) < ranksOrder.indexOf(currentBest)) {
            savedData.bestRanks[stage] = rank;
        }
        
        playBGM("bgm-win");
        
        // エンディング分岐
        if (stage === 5) {
            const res = finishSession("EXTRA-WIN", parseFloat(ppr), mult, rank, stageTurns);
            showDialog("★ TRUE ENDING ★", `<span style="font-size:30px;color:#f0f;">THE LEGEND!!</span><br>最強の黒竜を倒した！<br><br>RANK: <span style="font-size:24px;color:${getRankColor(rank)};">${rank}</span><br>PPR: ${ppr}<br><br><span style="color:#ffd700; font-size:24px; font-weight:bold;">GET DP: +${res.gainedDP}</span>`, "clear", [{ text: "TITLE", action: returnToTitle }]);
            return;
        }
        if (stage === 6) {
            const res = finishSession("GOD-WIN", parseFloat(ppr), mult, rank, stageTurns);
            showDialog("GOD DEFEATED!", `<span style="font-size:30px;color:#ffd700;">DIVINE VICTORY!</span><br>神の試練を乗り越えた！<br><br>RANK: <span style="font-size:24px;color:${getRankColor(rank)};">${rank}</span><br><br><span style="color:#ffd700; font-size:24px; font-weight:bold;">GET DP: +${res.gainedDP}</span>`, "clear", [{ text: "TITLE", action: returnToTitle }]);
            return;
        }
        
        // 通常クリア
        let title = "STAGE CLEAR";
        let msg = `STAGE ${stage} COMPLETED!<br>RANK: <span style="font-size:24px;color:${getRankColor(rank)};">${rank}</span><br><br>現在の獲得予定DP: <span style="color:#ffd700; font-weight:bold;">${potentialTotalDP} DP</span><br>(スコア倍率 x${mult.toFixed(1)})`;
        if (stage === 4) {
            title = "STAGE 4 CLEAR!";
            msg = `<span style="font-size:28px;color:#e0b0ff;">NIGHTMARE CONQUERED!</span><br>` + msg;
        }
        
        const btnNext = {
            text: "⛺ 次へ進む (繰越)",
            action: () => {
                player.hp = Math.min(player.hp + 30, player.maxHp);
                if (stage === 4) initGameSession(6, true);
                else initGameSession(stage + 1, true);
            }
        };
        const btnReturn = {
            text: "🏠 帰還する (確定)",
            action: () => {
                const res = finishSession("RETURN", parseFloat(ppr), mult, rank, stageTurns);
                showDialog("MISSION COMPLETE", `帰還しました。<br><br><span style="color:#ffd700; font-size:24px; font-weight:bold;">GET DP: +${res.gainedDP}</span>`, "clear", [{ text: "TITLE", action: returnToTitle }]);
            }
        };
        
        if (stage === 3) {
            const btnExtra = {
                text: "⚠️ EXTRA STAGE",
                action: () => {
                    player.hp = Math.min(player.hp + 30, player.maxHp);
                    initGameSession(5, true);
                }
            };
            if (parseFloat(ppr) >= 70.0 || savedData.clearedExtra) {
                msg += "<br><br><span style='color:#ff0000;'>強力な反応を感知...挑戦しますか？</span>";
                showDialog(title, msg, "clear", [btnExtra, btnReturn]);
            } else {
                msg += "<br><br>全てのエリアを踏破した！";
                showDialog(title, msg, "clear", [{
                    text: "🏠 ALL CLEAR",
                    action: () => {
                        const res = finishSession("WIN", parseFloat(ppr), mult, rank, stageTurns);
                        showDialog("ALL CLEAR!", `おめでとうございます！<br><br><span style="color:#ffd700; font-size:24px; font-weight:bold;">GET DP: +${res.gainedDP}</span>`, "clear", [{ text: "TITLE", action: returnToTitle }]);
                    }
                }]);
            }
        } else {
            showDialog(title, msg, "clear", [btnNext, btnReturn]);
        }
    } else {
        spawnEnemy();
    }
}

function returnToTitle() {
    playBGM("bgm-title");
    el("game-container").classList.remove("boss-mode", "extra-mode");
    el("game-screen").style.display = "none";
    el("title-screen").style.display = "flex";
    el("stage-select-screen").style.display = "none";
    updateTitleScore();
}

function useItem(type) {
    if (isProcessing || waitingForChest) return;
    if (turnInputs.length > 0) {
        addLog(">> 投擲中はアイテムを使えません！", "log-system");
        return;
    }
    if (player.state.itemLockTurn > 0) {
        playSE("se-warning");
        addLog(`>> 粘着されていてアイテムが使えない！(残り${player.state.itemLockTurn}T)`, "log-system");
        return;
    }
    
    const item = ITEM_EFFECTS[type];
    if (item && player.items[type] > 0) {
        player.items[type]--;
        playSE(item.type === "hp" || item.type === "mp" ? "se-heal" : "se-buff");
        
        const oldHp = player.hp;
        if (item.type === "hp") player.hp = Math.min(player.hp + item.value, player.maxHp);
        if (item.type === "mp") player.mp = Math.min(player.mp + item.value, player.maxMp);
        if (item.type === "maxHp") {
            player.maxHp += item.value;
            player.hp = Math.min(player.hp + item.value, player.maxHp);
        }
        
        addLog(`アイテム: ${item.name}使用`, "log-item");
        updateInfo();
    }
}


// Updated: カットイン色のマッピングを正確に行う
function showSkillCutin(name, type) {
    playSE("se-warning");
    el("cutin-text-val").innerText = name;
    
    const cutin = el("skill-cutin");
    cutin.className = "";
    // 定義済みのCSSクラスを付与
    if (["fire", "ice", "earth", "wind", "purple", "blue", "gold", "heal"].includes(type)) {
        cutin.classList.add("cutin-" + type);
    } else {
        cutin.classList.add("cutin-fire"); // デフォルト
    }
    
    cutin.style.display = "flex";
    el("game-container").classList.add("shake-heavy");
    
    setTimeout(() => {
        cutin.style.display = "none";
        el("game-container").classList.remove("shake-heavy");
    }, 1500);
}



// =========================================
// 12. CARD LOGIC (カード効果・ドロー)
// =========================================
function drawCard(isSilent = false) {
    if (player.deck.length === 0) return;
    if (player.hand.length >= HAND_SIZE) return;
    const cardId = player.deck.pop();
    player.hand.push(cardId);
    if (!isSilent) triggerFloatText("DRAW!", el("hand-area"));
    updateInfo();
}

// Updated: カード使用ロジック (v4.0 Async化)
async function playHandCard(index) {
    if (isProcessing || waitingForChest || isInterval) return;
    if (turnInputs.length > 0) {
        addLog(">> 投擲中はカードを使えません！", "log-system");
        return;
    }
    if (player.state.itemLockTurn > 0) {
        playSE("se-warning");
        addLog(`>> アイテム封印中！(残り${player.state.itemLockTurn}T)`, "log-system");
        return;
    }
    
    const cardId = player.hand[index];
    const card = CARD_DB.find(c => c.id === cardId);
    let cost = (card.cost !== undefined) ? card.cost : 99;
    
    if (player.mp < cost) {
        addLog(`MP不足！(必要: ${cost})`, "log-system");
        playSE("se-warning");
        return;
    }

    // カード消費
    player.mp -= cost;
    player.hand.splice(index, 1);
    
    isProcessing = true; // 演出中のガード

    if (card.type === "TRAP") {
        if (player.setCard) {
            player.discard.push(player.setCard); // 上書き
        }
        player.setCard = cardId;
        playSE("se-buff");
        addLog(`「${card.name}」をセット！`, "log-skill");
        await wait(500);
    } else {
        // 魔法カード: 新エンジンで実行
        player.discard.push(cardId);
        if (card.se) playSE(card.se);
        announce(card.name, "log-skill");
        
        await executeSkill(card, false, true); // (skill, isPreemptive, isCard)
    }

    isProcessing = false;
    updateInfo();

    // 敵の死亡チェック
    if (enemy.hp <= 0) {
        setTimeout(winBattle, 800);
    }
}

// =========================================
// CARD SPECIAL LOGICS (特殊カード用処理)
// =========================================

function executeSalvageMagic() {
    const magics = player.discard.filter(did => {
        const c = CARD_DB.find(cd => cd.id === did);
        return c && c.type === "MAGIC";
    });
    if (magics.length > 0) {
        const salvId = magics[Math.floor(Math.random() * magics.length)];
        const dIndex = player.discard.indexOf(salvId);
        player.discard.splice(dIndex, 1);
        player.hand.push(salvId);
        return `墓地から「${CARD_DB.find(c => c.id === salvId).name}」を回収！`;
    }
    return "墓地に魔法がない…";
}



// =========================================
// 13. UI & MODAL HANDLING (UI操作)
// =========================================
// Updated: ユーザーの破棄選択を待機する (v4.2 Async Support)
function openDiscardSelector(count = 1) {
    return new Promise((resolve) => {
        const modal = el("card-selector-modal");
        const grid = el("cs-grid");
        grid.innerHTML = "";
        el("cs-message").innerText = `${count}枚選んで捨ててください`;

        player.hand.forEach((cardId, idx) => {
            const card = CARD_DB.find(c => c.id === cardId);
            const div = createCardElement(card, "battle", 0, 1);
            div.onclick = () => {
                // カードを捨てる処理
                player.hand.splice(idx, 1);
                player.discard.push(cardId);
                playSE("se-tap");
                
                el("card-selector-modal").style.display = "none";
                
                if (count > 1 && player.hand.length > 0) {
                    // まだ捨てる必要があるなら再帰的に呼び出す
                    openDiscardSelector(count - 1).then(resolve);
                } else {
                    resolve(); // すべて捨て終わった
                }
            };
            grid.appendChild(div);
        });
        modal.style.display = "flex";
    });
}

function executeDiscardStep(handIndex, remainingCount) {
    const cardId = player.hand[handIndex];
    player.hand.splice(handIndex, 1);
    player.discard.push(cardId);
    playSE("se-tap");
    
    remainingCount--;

    if (remainingCount > 0 && player.hand.length > 0) {
        openDiscardSelector(remainingCount);
    } else {
        closeCardSelector();
        updateInfo();
        
        // 保存されていた「残りのエフェクト」があれば再開する
        if (pendingEffectsQueue.length > 0) {
            const nextEffects = [...pendingEffectsQueue];
            pendingEffectsQueue = []; // クリアしてから実行
            setTimeout(() => resolveEffects(nextEffects), 300);
        }
    }
}

function closeCardSelector() {
    el("card-selector-modal").style.display = "none";
    pendingCardIndex = -1;
}

function executeDiscardAndEffect(discardIndex) {
    const discardId = player.hand[discardIndex];
    player.hand.splice(discardIndex, 1);
    player.discard.push(discardId);
    playSE("se-heal");
    addLog("手札を捨て、3枚ドロー！", "log-skill");
    drawCard();
    drawCard();
    drawCard();
    closeCardSelector();
    updateInfo();
}

function showCardDetail(card) {
    const detailEl = el("deck-card-detail");
    if (!detailEl) return;
    detailEl.innerHTML = `<span class="detail-name">${card.name}</span>${card.desc}`;
}

// Updated: renderHand (v4.6 - Disabled Style Fix)
function renderHand() {
    const handArea = el("hand-area");
    handArea.innerHTML = "";
    el("hand-count-display").innerText = player.hand.length;
    
    const isThrowing = turnInputs.length > 0;
    // アイテムロック、または投擲中はカード使用不可
    const isCardLocked = (player.state.itemLockTurn > 0) || isThrowing;

    if (player.deckLocked) {
        el("battle-deck-count").innerText = "-";
        handArea.innerHTML = `<div class="hand-locked-msg">⚠️ NO DECK</div>`;
    } else {
        el("battle-deck-count").innerText = player.deck.length;
        if (player.hand.length === 0) {
            handArea.innerHTML = `<div class="hand-card-empty">NO CARD</div>`;
        } else {
            player.hand.forEach((cardId, index) => {
                const card = CARD_DB.find(c => c.id === cardId);
                // 戦闘モードで生成
                const div = createCardElement(card, "battle", 0, 1);
                div.className += " hand-card";
                
                // コスト不足 or ロック状態で disabled クラス付与
                if (player.mp < card.cost || isCardLocked) {
                    div.classList.add("disabled");
                }
                
                div.onclick = () => playHandCard(index);
                handArea.appendChild(div);
            });
        }
    }
}

function updateInfo() {
    if (!enemy.data) return;
    const setText = (id, text) => { const e = el(id); if (e) e.innerText = text; };
    const setHTML = (id, html) => { const e = el(id); if (e) e.innerHTML = html; };

    // Stage Display
    let stgDisp = getStageDisplayName(stage);
    setText("stage-display", stgDisp);
    setText("floor-display", getMaxFloors(stage) === 1 ? "FINAL" : `${floor}F`);
    setHTML("turn-display", `TURN ${currentTurn} <span style="font-size:12px; color:#888;">(Total ${(totalGameTurns - stageStartTurn) + 1})</span>`);

    // Enemy Status
    setText("enemy-name-side", enemy.name);
    const eHpEl = el("enemy-hp-value");
    if (eHpEl) {
        eHpEl.innerText = enemy.hp;
        eHpEl.className = "hp-mega-text";
        if (enemy.hp <= enemy.maxHp * 0.2) eHpEl.classList.add("blink-fast");
        else if (enemy.hp <= enemy.maxHp * 0.5) eHpEl.classList.add("blink-slow");
    }
    
    let weakText = player.state.weakLock ? "★LOCK" : `WEAK: ${enemy.data.weak}+`;
    if (weakHitCount > 0) weakText += " <span style='color:#f0f;'>CHANCE!</span>";
    setHTML("weak-display", weakText);

    let eChips = "";
    if (enemy.state.charge) eChips += `<span class="status-chip chip-charge">⚡CHARGE</span>`;
    if (enemy.state.isStunned) eChips += `<span class="status-chip chip-stun">😵STUN</span>`;
    if (enemy.state.atkBuffTurn > 0) eChips += `<span class="status-chip chip-buff">⚔️ATK x${(1 + enemy.state.atkBuff).toFixed(1)}(${enemy.state.atkBuffTurn}T)</span>`;
    if (enemy.state.guardTurn > 0) {
        const label = enemy.state.guardType === 'ratio' ? 'GUARD' : 'ARMOR';
        eChips += `<span class="status-chip chip-guard">🛡️${label}(${enemy.state.guardTurn}T)</span>`;
    }
    if (enemy.state.barrierTurn > 0) eChips += `<span class="status-chip chip-barrier">💠BARRIER(${enemy.state.barrierTurn}T)</span>`;
    setHTML("enemy-states-side", eChips);

    // Player HP
    const hpBar = el("player-hp-bar");
    if (hpBar) {
        const pct = (player.hp / player.maxHp) * 100;
        hpBar.style.width = Math.max(0, pct) + "%";
        let hpClass = "hp-bar-fill player-fill";
        if (pct <= 20) hpClass += " hp-danger";
        else if (pct <= 50) hpClass += " hp-warning";
        hpBar.className = hpClass;
        
        const parent = hpBar.parentNode;
        let overlay = parent.querySelector(".hp-text-overlay");
        if (!overlay) {
            overlay = document.createElement("div");
            overlay.className = "hp-text-overlay";
            parent.appendChild(overlay);
        }
        overlay.innerText = `${player.hp} / ${player.maxHp}`;
    }
    setText("player-hp", ""); 

    // Player MP
    const mpValEl = document.querySelector("#player-mp")?.parentNode; 
    if (mpValEl && mpValEl.classList.contains("p-val")) mpValEl.style.display = "none";
    
    let mpDots = "";
    for (let i = 0; i < player.maxMp; i++) {
        mpDots += `<span class="mp-dot ${i < player.mp ? 'active' : ''}"></span>`;
    }
    setHTML("player-mp-dots", mpDots);
    
    const mpContainer = el("player-mp-dots");
    if (mpContainer) {
        if (player.mp >= player.maxMp) mpContainer.classList.add("mp-max-glow");
        else mpContainer.classList.remove("mp-max-glow");
    }

    // Player States
    let pChips = "";
    if (player.state.atkDuration > 0) {
        const valText = player.state.atkBuff > 0 ? `x${(1 + player.state.atkBuff).toFixed(1)}` : `+${player.state.atkFlat}`;
        pChips += `<span class="status-chip chip-buff">⚔️ATK ${valText}(${player.state.atkDuration}投)</span>`;
    }
    if (player.state.guardTurn > 0) pChips += `<span class="status-chip chip-guard">🛡️SHIELD(${player.state.guardTurn}T)</span>`;
    if (player.state.itemLockTurn > 0) pChips += `<span class="status-chip chip-lock">🔒ITEM LOCK(${player.state.itemLockTurn}T)</span>`;
    if (player.state.restrictInput) pChips += `<span class="status-chip chip-stun">⛓️BIND</span>`;
    setHTML("player-states-side", pChips);

    const turnVal = currentTurn === 0 ? 1 : currentTurn; // 準備中も1と出す
    setHTML("turn-display", `TURN ${turnVal}`);

    // Stats
    let ppr = totalDarts > 0 ? (totalScore / totalDarts) * 3 : 0;
    setText("avg-display", ppr.toFixed(1));
    setText("rt-display", `(Rt ${calculateRating(ppr)})`);
    
    // Items
    const updateItemBtn = (btnId, count, icon) => {
        const b = el(btnId); if (!b) return;
        b.innerHTML = `${icon}x${count}`;
        b.className = "item-btn";
        if (player.state.itemLockTurn > 0 || turnInputs.length > 0 || isInterval) b.classList.add("disabled");
        else if (count > 0) b.classList.add("has-item");
        else b.classList.add("disabled");
    };
    updateItemBtn("btn-potion", player.items.potion, "💊");
    updateItemBtn("btn-ether", player.items.ether, "⚗️");
    updateItemBtn("btn-seed", player.items.seed, "🌱");

    // Trap Slot
    const trapContainer = el("trap-slot-container");
    if (trapContainer) {
        trapContainer.innerHTML = "";
        if (player.setCard) {
            const c = CARD_DB.find(cd => cd.id === player.setCard);
            if (c) {
                const cardEl = createCardElement(c, "battle", 0, 1);
                cardEl.onclick = null;
                trapContainer.appendChild(cardEl);
            }
        } else {
            const emptyDiv = document.createElement("div");
            emptyDiv.id = "trap-slot";
            emptyDiv.className = "trap-slot empty";
            emptyDiv.innerHTML = "SET<br>TRAP";
            trapContainer.appendChild(emptyDiv);
        }
    }
    
    renderHand();
}

function openCardShop() {
    playSE("se-tap");
    const list = el("pack-list");
    list.innerHTML = "";
    if (el("shop-dp-display")) el("shop-dp-display").innerText = (savedData.dp || 0);
    if (!savedData.cards) savedData.cards = {};
    
    PACK_DATA.forEach(pack => {
        const isUnlocked = (savedData.bestRanks && savedData.bestRanks[pack.unlockStage]);
        if (!isUnlocked) return;
        
        const canBuy = (savedData.dp || 0) >= pack.price;
        const imgHTML = `<img src="${pack.img}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"><div style="display:none; width:100%; height:100%; align-items:center; justify-content:center; font-size:50px; background:#333; color:#555;">📦</div>`;
        
        const div = document.createElement("div");
        div.className = "pack-item";
        div.innerHTML = `<div class="pack-img-container">${imgHTML}</div><div class="pack-name">${pack.name}</div><div class="pack-desc">${pack.desc}</div><button class="pack-buy-btn" ${canBuy ? "" : "disabled"} onclick="buyPack('${pack.id}')">${canBuy ? `BUY (${pack.price} DP)` : "LACK DP"}</button>`;
        list.appendChild(div);
    });
    
    if (list.innerHTML === "") {
        list.innerHTML = "<div style='color:#666; width:100%; text-align:center; padding-top:20px;'>STAGE 1 CLEAR REQUIRED</div>";
    }
    el("card-shop-modal").style.display = "flex";
}

function buyPack(packId) {
    const pack = PACK_DATA.find(p => p.id === packId);
    if (!pack) return;
    if ((savedData.dp || 0) < pack.price) {
        playSE("se-warning");
        alert("DPが足りません");
        return;
    }
    savedData.dp -= pack.price;
    saveToDrive();
    if (el("shop-dp-display")) el("shop-dp-display").innerText = savedData.dp;
    openCardShop();
    startPackOpening(packId);
}

function isCardInResults(results, cardId) {
    return results.some(c => c.id === cardId);
}

function startPackOpening(packId) {
    currentPackId = packId;
    isOpeningPack = true;
    openingPhase = 1;
    el("card-shop-modal").style.display = "none";
    el("pack-result-modal").style.display = "flex";
    
    const targetCards = CARD_DB.filter(c => c.packs && c.packs.includes(packId));
    packResults = [];
    
    for (let i = 0; i < 3; i++) {
        const isGuaranteed = (i === 2);
        let card = null;
        let attempt = 0;
        
        while (!card || isCardInResults(packResults, card.id)) {
            attempt++;
            if (attempt > 20) break;
            const r = Math.random();
            let rarity = "N";
            if (isGuaranteed) {
                if (r < 0.03) rarity = "UR"; else if (r < 0.20) rarity = "SR"; else rarity = "R";
            } else {
                if (r < 0.01) rarity = "UR"; else if (r < 0.10) rarity = "SR"; else if (r < 0.40) rarity = "R"; else rarity = "N";
            }
            let pool = targetCards.filter(c => c.rarity === rarity);
            if (pool.length === 0) pool = targetCards;
            const candidate = pool[Math.floor(Math.random() * pool.length)];
            if (!isCardInResults(packResults, candidate.id)) card = candidate;
        }
        
        if (!card) card = targetCards[Math.floor(Math.random() * targetCards.length)];
        if (!savedData.collection) savedData.collection = {};
        if (!savedData.cards) savedData.cards = {};
        
        const currentCount = savedData.cards[card.id] || 0;
        const isNew = (currentCount === 0);
        savedData.collection[card.id] = (savedData.collection[card.id] || 0) + 1;
        savedData.cards[card.id] = (savedData.cards[card.id] || 0) + 1;
        
        packResults.push({ ...card, isNew: isNew, ownCount: savedData.cards[card.id] });
    }
    
    saveToDrive();
    const rarityOrder = { "N": 0, "R": 1, "SR": 2, "UR": 3 };
    packResults.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);
    renderOpeningStage(packId);
}

function renderOpeningStage(packId) {
    const container = el("pack-opening-container");
    const packImg = PACK_DATA.find(p => p.id === packId).img;
    container.innerHTML = `<div id="opening-stage"><div id="white-out" class="white-out-overlay"></div><img src="${packImg}" id="pack-visual" class="opening-pack anim-drop anim-breath"><div id="opening-prompt" class="prompt-text">TAP TO OPEN</div><div id="reveal-area" class="reveal-stage" style="display:none;"></div><div id="action-buttons" class="action-buttons" style="display:none;"><button class="modal-btn" onclick="buyPack('${packId}')">ONE MORE</button><button class="modal-btn" onclick="closePackResult()" style="background:#555;">QUIT</button></div></div>`;
    const stage = el("opening-stage");
    stage.onclick = () => proceedUnboxing();
}

// Input Lock for Enter Key Up
window.addEventListener("keyup", (e) => {
    if (e.key === "Enter") inputLockUntilRelease = false;
});

function proceedUnboxing() {
    if (openingPhase === 1) {
        openingPhase = 2;
        el("opening-prompt").style.display = "none";
        const pack = el("pack-visual");
        pack.classList.remove("anim-breath");
        pack.classList.add("anim-charge");
        playSE("se-double");
        
        setTimeout(() => {
            playSE("se-heal");
            const container = el("pack-result-modal");
            container.classList.add("shake-heavy");
            el("white-out").style.display = "block";
            el("white-out").classList.add("white-out-anim");
            pack.style.display = "none";
            
            setTimeout(() => {
                container.classList.remove("shake-heavy");
                openingPhase = 3;
                el("reveal-area").style.display = "flex";
                currentRevealIndex = 0;
                showNextRevealCard();
            }, 800);
        }, 1500);
        
    } else if (openingPhase === 3) {
        const currentCardEl = document.getElementById("reveal-card-" + currentRevealIndex);
        if (currentCardEl) {
            currentCardEl.classList.add("fly-up");
            currentRevealIndex++;
            setTimeout(showNextRevealCard, 200);
        }
    }
}

function showNextRevealCard() {
    if (currentRevealIndex >= packResults.length) {
        showPackResult();
        return;
    }
    const card = packResults[currentRevealIndex];
    const area = el("reveal-area");
    playSE("se-item");
    
    // standardモードで生成し、サイズはCSSで調整
    const div = createCardElement(card, "standard", 0, 1);
    div.id = `reveal-card-${currentRevealIndex}`;
    div.classList.add("reveal-card-zoom", "card-appear");
    
    area.innerHTML = "";
    area.appendChild(div);
}

function showPackResult() {
    openingPhase = 4;
    inputLockUntilRelease = true;
    const area = el("reveal-area");
    area.innerHTML = "";
    area.className = "result-stage";
    playSE("se-win");
    
    packResults.forEach((card, i) => {
        const div = createCardElement(card, "standard", card.ownCount, card.ownCount);
        div.className += " result-card";
        div.style.animation = `pop-in 0.5s both ${i * 0.1}s`;
        if (card.isNew) {
            const badge = document.createElement("div");
            badge.className = "new-badge";
            badge.innerText = "NEW!";
            div.appendChild(badge);
        }
        div.onclick = null;
        setupLongPress(div, card);
        area.appendChild(div);
    });
    
    const btnArea = el("action-buttons");
    btnArea.style.display = "flex";
    setTimeout(() => btnArea.classList.add("visible"), 100);
}

function skipUnboxing() {
    if (openingPhase >= 2 && openingPhase < 4) {
        showPackResult();
    }
}

// Input Handling for Unboxing & Cheats
window.addEventListener("keydown", function (e) {
    if (el("pack-result-modal").style.display === "flex") {
        e.preventDefault();
        if (e.repeat && e.key === "Enter" && openingPhase >= 2 && openingPhase < 4) { skipUnboxing(); return; }
        if (openingPhase === 1 && e.key === "Enter") proceedUnboxing();
        else if (openingPhase === 3 && e.key === "Enter") proceedUnboxing();
        else if (openingPhase === 4) {
            if (e.key === "Enter") { if (inputLockUntilRelease) return; buyPack(currentPackId); }
            if (e.key === "Backspace" || e.key === "Escape") closePackResult();
        }
        return;
    }
    
    // Title Cheats
    if (el("title-screen").style.display !== "none") {
        if (e.key === "1") cheatBuffer += e.key;
        else cheatBuffer = "";
        
        if (cheatBuffer.endsWith("1111")) {
            playSE("se-item");
            savedData.dp = (savedData.dp || 0) + 5000;
            updateTitleScore();
            saveToDrive();
            cheatBuffer = "";
        }
        return;
    }
    
    // Modal Interaction
    if (el("game-modal").style.display === "flex" && e.key === "Enter") {
        const btns = document.getElementById("modal-buttons");
        if (btns.children.length === 1) { e.preventDefault(); btns.children[0].click(); }
        return;
    }
    
    // Chest Interaction
    if (waitingForChest) {
        if (e.key === 'Enter') { e.preventDefault(); openChest(); }
        return;
    }
    
    // Battle Input (Debug)
    if (el("game-screen").style.display !== "none" && !isProcessing) {
        if (e.key >= '0' && e.key <= '9') {
            if (currentInput.length < 3) {
                playSE("se-tap");
                currentInput += e.key;
                updateScoreDisplay();
            }
        }
        if (e.key === 'Backspace') {
            if (currentInput.length > 0) {
                currentInput = currentInput.slice(0, -1);
                updateScoreDisplay();
            }
        }
        if (e.key === 'Enter') handleEnter();
    }
});

document.addEventListener('mousedown', (e) => {
    if (isOpeningPack && openingPhase >= 2 && openingPhase < 4) {
        const start = Date.now();
        const upHandler = () => {
            if (Date.now() - start > 500) skipUnboxing();
            document.removeEventListener('mouseup', upHandler);
        };
        document.addEventListener('mouseup', upHandler);
    }
});

function closePackResult() {
    if (openingPhase < 4 && openingPhase > 0) return;
    playSE("se-tap");
    el("pack-result-modal").style.display = "none";
    el("pack-opening-container").innerHTML = "";
    updateTitleScore();
    isOpeningPack = false;
    openingPhase = 0;
    el("card-shop-modal").style.display = "flex";
}

function closeCardShop() {
    playSE("se-tap");
    el("card-shop-modal").style.display = "none";
    updateTitleScore();
}

function openCollection() {
    playSE("se-tap");
    renderDeckEditor();
    el("collection-modal").style.display = "flex";
}

function closeCollection() {
    playSE("se-tap");
    el("collection-modal").style.display = "none";
}

function renderDeckEditor() {
    if (!savedData.deck) savedData.deck = [];
    savedData.deck.sort((a, b) => a - b);
    if (!savedData.cards) savedData.cards = {};
    
    const deckGrid = el("deck-grid");
    deckGrid.innerHTML = "";
    
    for (let i = 0; i < DECK_SIZE; i++) {
        const cardId = savedData.deck[i];
        if (cardId) {
            const card = CARD_DB.find(c => c.id === cardId);
            const totalOwned = savedData.cards[card.id] || 0;
            // 既存カードを表示
            const div = createCardElement(card, "small", 0, totalOwned);
            deckGrid.appendChild(div);
        } else {
            // Updated: null を渡して EMPTY カードを生成
            const div = createCardElement(null, "small");
            deckGrid.appendChild(div);
        }
    }
    
    const deckCount = savedData.deck.length;
    const countEl = el("deck-count");
    countEl.innerText = deckCount;
    if (deckCount < DECK_SIZE) { countEl.style.color = "#ff5555"; } else { countEl.style.color = "#00ff00"; }
    
    const listGrid = el("card-grid");
    listGrid.innerHTML = "";
    let ownedCount = 0;
    CARD_DB.forEach(card => {
        const count = savedData.cards[card.id] || 0;
        if (count > 0) ownedCount++;
        const inDeckCount = savedData.deck.filter(id => id === card.id).length;
        const remaining = count - inDeckCount;
        const div = createCardElement(card, "standard", remaining, count);
        listGrid.appendChild(div);
    });
    el("collection-rate").innerText = `${Math.floor((ownedCount / CARD_DB.length) * 100)}%`;
}


// Updated: createCardElement (v4.6 - Status Class Support)
function createCardElement(card, mode = "standard", remainingCount = 1, totalCount = 0) {
    const div = document.createElement("div");
    // card が null の場合は EMPTY カード
    if (!card) {
        div.className = `std-card ${mode} empty`;
        return div;
    }
    
    // 所持判定 (battle/smallモードは所持前提、standardモードはtotalCountで判定)
    const isOwned = (mode === "small" || mode === "battle" || totalCount > 0);
    const notOwnedClass = (!isOwned) ? "card-not-owned" : "";
    
    div.className = `std-card ${mode} rarity-frame-${card.rarity} ${notOwnedClass}`;
    
    const imgPath = `assets/cards/${card.id}.png`;
    const cost = (card.cost !== undefined) ? card.cost : "?";
    const bgClass = (card.type === "TRAP") ? "bg-trap" : "bg-magic";
    
    let textClass = "text-n";
    if (card.rarity === "UR") textClass = "text-ur";
    else if (card.rarity === "SR") textClass = "text-sr";
    else if (card.rarity === "R") textClass = "text-r";
    
    const sheenHTML = (card.rarity === "UR" || card.rarity === "SR") ? '<div class="card-sheen"></div>' : '';
    const countText = (mode === "small" || mode === "battle") ? "" : `x${remainingCount}`;
    
    div.innerHTML = `
        <div class="std-art">
            <img src="${imgPath}" onerror="this.style.display='none';">
            <div class="std-cost">${cost}</div>
            <div class="std-count">${countText}</div>
            ${sheenHTML}
        </div>
        <div class="std-text-area ${bgClass}">
            <div class="std-name ${textClass}">${card.name}</div>
            <div class="std-type">[${card.type}]</div>
            <div class="std-desc">${card.desc}</div>
        </div>
    `;
    
    // イベント設定
    div.onclick = function (e) {
        if (div.dataset.longPressed === "true") { div.dataset.longPressed = "false"; return; }
        // 未所持ならクリック無効
        if (!isOwned) return;
        
        // パック開封中などのガード
        if (typeof isOpeningPack !== 'undefined' && isOpeningPack) return;
        
        // モード別動作
        if (mode === "small") removeFromDeck(card.id);
        else if (mode === "standard") addToDeck(card.id);
    };

    // ホバー時に詳細を表示
    div.onmouseenter = () => {
        if (mode !== "battle" && typeof showCardDetail === 'function') {
            showCardDetail(card);
        }
    };
    
    // 長押し詳細表示 (未所持でも詳細だけは見れるようにしても良いが、一旦所持者のみ)
    if (isOwned) { setupLongPress(div, card); }
    
    return div;
}


function setupLongPress(element, card) {
    let pressTimer;
    const LONG_PRESS_DURATION = 500;
    
    const start = (e) => {
        if (e.type === "mousedown" && e.button !== 0) return;
        element.dataset.longPressed = "false";
        pressTimer = setTimeout(() => {
            element.dataset.longPressed = "true";
            showZoomCard(card);
            if (navigator.vibrate) navigator.vibrate(50);
        }, LONG_PRESS_DURATION);
    };
    
    const cancel = () => { if (pressTimer) clearTimeout(pressTimer); };
    
    element.addEventListener("mousedown", start);
    element.addEventListener("touchstart", start, { passive: true });
    element.addEventListener("mouseup", cancel);
    element.addEventListener("mouseleave", cancel);
    element.addEventListener("touchend", cancel);
    element.addEventListener("touchmove", cancel);
}

function showZoomCard(card) {
    let overlay = document.getElementById("card-zoom-overlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "card-zoom-overlay";
        document.body.appendChild(overlay);
    }
    
    // 既存のイベントを一度削除して再登録（二重登録防止）
    overlay.onclick = closeZoomCard;
    
    const cardEl = createCardElement(card, "standard", 0, 1);
    // カード自体をクリックしても閉じないようにストップ
    cardEl.onclick = (e) => e.stopPropagation();
    
    overlay.innerHTML = ""; 
    overlay.appendChild(cardEl);
    
    const hint = document.createElement("div");
    hint.className = "zoom-close-hint";
    hint.innerText = "TAP ANYWHERE TO CLOSE";
    overlay.appendChild(hint);

    overlay.style.display = "flex";
    document.body.style.overflow = "hidden";
    
    requestAnimationFrame(() => {
        overlay.classList.add("visible");
    });
    
    playSE("se-tap");
}

function closeZoomCard() {
    const overlay = document.getElementById("card-zoom-overlay");
    if (overlay) {
        overlay.classList.remove("visible");
        // アニメーションが終わるのを待ってから非表示
        setTimeout(() => {
            overlay.style.display = "none";
            document.body.style.overflow = ""; // スクロール禁止解除
        }, 300);
    }
}

function addToDeck(cardId) {
    const SAME_CARD_LIMIT = 3;
    if (savedData.deck.length >= DECK_SIZE) { alert(`デッキは${DECK_SIZE}枚までです！`); return; }
    
    const ownedCount = savedData.cards[cardId] || 0;
    const currentInDeck = savedData.deck.filter(id => id === cardId).length;
    
    if (currentInDeck >= ownedCount) { alert("これ以上持っていません！"); return; }
    if (currentInDeck >= SAME_CARD_LIMIT) { alert(`「${getCardName(cardId)}」は3枚までです。`); return; }
    
    playSE("se-tap");
    savedData.deck.push(cardId);
    saveToDrive();
    renderDeckEditor();
}

function removeFromDeck(cardId) {
    playSE("se-tap");
    const index = savedData.deck.indexOf(cardId);
    if (index > -1) { savedData.deck.splice(index, 1); }
    saveToDrive();
    renderDeckEditor();
}

function getCardName(id) {
    const c = CARD_DB.find(card => card.id === id);
    return c ? c.name : "カード";
}

function showDialog(title, text, type = "normal", buttons = [{ text: "OK", action: null }], autoClose = 0) {
    const box = el("modal-box-inner");
    el("modal-title").innerText = title;
    el("modal-text").innerHTML = text;
    box.className = "modal-box";
    el("modal-title").style.color = "#f9a826";
    
    if (type === "clear") {
        box.classList.add("modal-clear");
        el("modal-title").style.color = "#fff";
    } else if (type === "warning") {
        box.classList.add("modal-warning");
        el("modal-title").style.color = "#ff0000";
    } else if (type === "item") {
        box.classList.add("modal-item");
        el("modal-title").style.color = "#00ff00";
    }
    
    const btnGroup = el("modal-buttons");
    btnGroup.innerHTML = "";
    
    buttons.forEach(b => {
        const btn = document.createElement("button");
        btn.className = "modal-btn";
        btn.innerText = b.text;
        btn.onclick = function () {
            if (window.dialogTimeout) clearTimeout(window.dialogTimeout);
            playSE("se-tap");
            el("game-modal").style.display = "none";
            if (b.action) b.action();
        };
        btnGroup.appendChild(btn);
    });
    
    el("game-modal").style.display = "flex";
    
    if (autoClose > 0 && buttons.length > 0) {
        const primaryAction = buttons[0].action;
        window.dialogTimeout = setTimeout(() => {
            el("game-modal").style.display = "none";
            if (primaryAction) primaryAction();
        }, autoClose);
    }
}

// Updated: main.js (calculateStageRank)
function calculateStageRank(stg, turns) {
    const info = STAGE_MASTER[stg];
    const th = info.thresholds;
    let rank = "C";

    if (turns <= th.SSS) rank = "SSS";
    else if (turns <= th.S) rank = "S";
    else if (turns <= th.A) rank = "A";
    else if (turns <= th.B) rank = "B";

    return [rank, RANK_BONUS[rank] || 50];
}

function finishSession(resultType, ppr, multiplier = 1.0, rank = "", turn = 0) {
    let earnedDP = 0;
    clearedStagesLog.forEach(log => { earnedDP += log.dp; });
    savedData.dp = (savedData.dp || 0);
    
    let resultText = resultType; 

    const curVal = stage * 100 + floor;
    const bestVal = savedData.highScore.stage * 100 + savedData.highScore.floor;
    let isNewRecord = false;
    
    if (curVal > bestVal) {
        savedData.highScore.stage = stage;
        savedData.highScore.floor = floor;
        isNewRecord = true;
    }
    if (ppr > savedData.highScore.avg) {
        savedData.highScore.avg = ppr;
        isNewRecord = true;
    }
    if (resultType === "EXTRA-WIN") savedData.clearedExtra = true;

    const isLose = (resultType === "LOSE");
    const scoreDP = isLose ? 0 : Math.floor(totalScore * 0.2 * multiplier);
    let rankDP = 0;
    if (!isLose) {
        clearedStagesLog.forEach(log => rankDP += log.dp);
    }
    const gainedDP = scoreDP + rankDP;
    savedData.dp += gainedDP;

    const now = new Date();
    const dateStr = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${("0" + now.getMinutes()).slice(-2)}`;
    let stgName = (stage >= 5) ? getStageDisplayName(stage) : "S" + stage + "-" + floor + "F";
    
    if (clearedStagesLog.length > 0 && resultType === "RETURN") {
        const last = clearedStagesLog[clearedStagesLog.length - 1];
        resultText = `CLEAR`; 
    }
    
    const historyItem = {
        date: dateStr, stage: stage, floor: floor, stgName: stgName,
        result: resultText, dp: gainedDP, ppr: isNaN(ppr) ? 0 : parseFloat(ppr),
        rt: calculateRating(isNaN(ppr) ? 0 : parseFloat(ppr)),
        rank: rank, 
        turn: turn
    };
    
    if (!savedData.history) savedData.history = [];
    savedData.history.unshift(historyItem);
    if (savedData.history.length > 50) savedData.history.pop();
    
    updateTitleScore();
    saveToDrive();
    return { isNewRecord: isNewRecord, gainedDP: gainedDP };
}

function showHistory() {
    const modal = el("history-modal");
    
    modal.innerHTML = `
        <div class="modal-box history-box" style="max-width:850px; width:95%;">
            <div class="modal-header-row">
                <div class="modal-title" style="color:#00d2fc; font-family:'Cinzel Decorative'; margin:0;">BATTLE LOG</div>
                <button class="header-close-btn" onclick="closeHistory()">×</button>
            </div>
            <div class="history-list" id="history-list">
                <div class="h-header">
                    <div class="h-col-date">DATE</div>
                    <div class="h-col-stage">STAGE INFO</div>
                    <div class="h-col-res">RESULT</div>
                    <div class="h-col-rank">RANK</div>
                    <div class="h-col-turn">TURN</div>
                    <div class="h-col-ppr">AVG(RT)</div>
                    <div class="h-col-dp">DP</div>
                </div>
            </div>
        </div>
    `;
    
    const list = el("history-list");
    
    if (!savedData.history || savedData.history.length === 0) {
        list.innerHTML = "<div style='padding:40px; text-align:center; color:#666;'>NO DATA</div>";
    } else {
        savedData.history.forEach(h => {
            let isLose = (h.result === "LOSE");
            let resultText = isLose ? "LOSE" : "CLEAR";
            
            let rankText = (isLose || !h.rank) ? "-" : h.rank;
            let turnText = (isLose || !h.turn) ? "-" : h.turn;
            
            const master = STAGE_MASTER[h.stage] || { title: "Unknown" };
            const floorText = (h.stage === 5) ? "FINAL" : `${h.floor}F`;
            
            const stageDisplay = `STAGE ${h.stage} ${master.title} ${floorText}`;

            let rankClass = "";
            if (rankText === "SSS") rankClass = "rank-sss";
            else if (rankText === "S") rankClass = "rank-s";
            else if (rankText === "A") rankClass = "rank-a";
            
            const div = document.createElement("div");
            div.className = "history-row" + (isLose ? " row-lose" : " row-clear");
            const dpText = h.dp > 0 ? `+${h.dp}` : `+0`;

            div.innerHTML = `
                <div class="h-col-date">${h.date.split(' ')[0]}</div>
                <div class="h-col-stage">${stageDisplay}</div>
                <div class="h-col-res">${resultText}</div>
                <div class="h-col-rank ${rankClass}">${rankText}</div>
                <div class="h-col-turn">${turnText}</div>
                <div class="h-col-ppr">${h.ppr.toFixed(1)} (Rt${h.rt})</div>
                <div class="h-col-dp">+${h.dp}</div>
            `;
            list.appendChild(div);
        });
    }
    playSE("se-tap");
    modal.style.display = "flex";
}

function closeHistory() {
    playSE("se-tap");
    el("history-modal").style.display = "none";
}

function resetSaveData() {
    if (confirm("【警告】現在のスロットのデータを完全に消去しますか？")) {
        allSaveData[currentSlot] = null;
        selectSlot(currentSlot.replace("slot", ""));
        saveToDrive();
    }
}

function exportSave() {
    navigator.clipboard.writeText(JSON.stringify(savedData)).then(() => alert("現在のスロットのデータをコピーしました"));
}

function importSave() {
    const json = prompt("セーブデータ(JSON)を貼り付けてください");
    if (json) {
        try {
            const d = JSON.parse(json);
            if (d.highScore && d.history) {
                savedData = d;
                updateTitleScore();
                saveToDrive();
                alert("読み込み完了");
            }
        } catch (e) {
            alert("データ形式エラー");
        }
    }
}

function updateScoreDisplay() {
    [1, 2, 3].forEach((i) => {
        const sideSlot = el(`slot-${i}-side`);
        const mainSlot = el(`slot-${i}`);
        let val = "--";
        let styleClass = "low";
        
        if (i - 1 < turnInputs.length) {
            val = turnInputs[i - 1];
            styleClass = (val >= 50) ? "high filled" : "filled";
        } else if (i - 1 === turnInputs.length) {
            val = currentInput;
            styleClass = "active";
        }
        
        if (sideSlot) {
            sideSlot.innerText = val;
            sideSlot.className = `score-val ${styleClass}`;
        }
        if (mainSlot) {
            mainSlot.innerText = val;
        }
    });
    
    [1, 2, 3].forEach((i) => {
        const dot = el(`d-dot-${i}`);
        if (dot) {
            dot.className = "d-dot";
            if (i - 1 < turnInputs.length) dot.classList.add("filled");
            else if (i - 1 === turnInputs.length) dot.classList.add("active");
        }
    });
}

function getRankColor(r) {
    if (r === "SSS") return "#00ffff";
    if (r === "S") return "#ffd700";
    if (r === "A") return "#ff5555";
    return "#fff";
}

// Updated: 設定モーダルを開く関数 (修復版)
function openConfigModal() {
    let modal = el("config-modal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "config-modal";
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = `
        <div class="config-box">
            <div class="config-title">AUDIO CONFIG</div>
            <div class="config-row">
                <div class="config-label"><span>BGM (Music)</span><span id="val-bgm">${Math.round(gameConfig.bgmVolume * 100)}%</span></div>
                <input type="range" class="config-slider" min="0" max="100" value="${gameConfig.bgmVolume * 100}" oninput="updateConfigVal('bgm', this.value)">
            </div>
            <div class="config-row">
                <div class="config-label"><span>SYSTEM SE</span><span id="val-sys">${Math.round(gameConfig.sysVolume * 100)}%</span></div>
                <input type="range" class="config-slider" min="0" max="100" value="${gameConfig.sysVolume * 100}" oninput="updateConfigVal('sys', this.value)">
            </div>
            <div class="config-row">
                <div class="config-label"><span style="color:#ffaaaa;">ATTACK SE (Hit)</span><span id="val-atk" style="color:#ff4444;">${Math.round(gameConfig.atkVolume * 100)}%</span></div>
                <input type="range" class="config-slider slider-atk" min="0" max="100" value="${gameConfig.atkVolume * 100}" oninput="updateConfigVal('atk', this.value)">
            </div>
            <div class="config-buttons">
                <button class="btn-conf btn-reset" onclick="resetConfig()">RESET</button>
                <button class="btn-conf btn-save" onclick="closeConfig()">CLOSE</button>
            </div>
        </div>`;
    
    modal.style.display = "flex";
    playSE("se-tap");
}

// 設定値をリアルタイム更新するグローバル関数
window.updateConfigVal = function (type, val) {
    const floatVal = val / 100;
    if (type === 'bgm') {
        gameConfig.bgmVolume = floatVal;
        el("val-bgm").innerText = val + "%";
        updateCurrentBgmVolume();
    } else if (type === 'sys') {
        gameConfig.sysVolume = floatVal;
        el("val-sys").innerText = val + "%";
    } else if (type === 'atk') {
        gameConfig.atkVolume = floatVal;
        el("val-atk").innerText = val + "%";
    }
};

// 設定をリセット
window.resetConfig = function () {
    gameConfig = { bgmVolume: 0.3, sysVolume: 0.5, atkVolume: 0.8 };
    playSE("se-tap");
    openConfigModal();
    updateCurrentBgmVolume();
};

// 設定を閉じて保存
window.closeConfig = function () {
    saveGameConfig();
    playSE("se-tap");
    el("config-modal").style.display = "none";
};

function openStageSelect() {
    playSE("se-tap");
    el("title-screen").style.display = "none";
    el("stage-select-screen").style.display = "flex";
    renderStageSelectScreen();
}

function closeStageSelect() {
    playSE("se-tap");
    el("stage-select-screen").style.display = "none";
    el("title-screen").style.display = "flex";
}

function renderStageSelectScreen() {
    const container = el("stage-list-container");
    container.innerHTML = "";

    Object.entries(STAGE_MASTER).forEach(([id, info]) => {
        const stageId = parseInt(id);
        const isLocked = !isStageUnlocked(stageId);

        const rank = savedData.bestRanks ? savedData.bestRanks[stageId] : null;
        const rankColor = getRankColor(rank || "");
        const stageImg = typeof info.img === 'string' ? info.img : info.img.default;

        const div = document.createElement("div");
        div.className = "stage-card-item";
        if (isLocked) div.classList.add("locked");

        div.innerHTML = `
            <img src="${stageImg}" class="st-img">
            <div class="st-info">
                <div class="st-title">${isLocked ? "LOCKED" : info.title}</div>
                <div class="st-sub">${info.sub}</div>
            </div>
            ${rank ? `<div class="st-rank" style="color:${rankColor}">${rank}</div>` : ""}
            ${isLocked ? `<div class="st-rank" style="font-size:20px;">🔒</div>` : ""}
        `;

        if (!isLocked) {
            div.onclick = () => {
                el("stage-select-screen").style.display = "none";
                initGameSession(stageId);
            };
        }
        container.appendChild(div);
    });
}