console.log("★ main.js is loaded! (v2.18.6)");

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
// WORLD MAP HELPERS (v6.0)
// =========================================

// ステージIDからステージデータを検索・取得
function getStageData(stageId) {
    // 数値で来たら文字列に変換 (互換性維持)
    const idStr = String(stageId);
    
    // 旧ID(1,2,3...) を 新ID(1-1, 1-2...) にマッピングする簡易対応 (必要なら)
    // 今回は直接 WORLD_MAP を探索します
    for (const areaKey in WORLD_MAP) {
        const area = WORLD_MAP[areaKey];
        const stageObj = area.stages.find(s => s.id === idStr);
        if (stageObj) return stageObj;
    }
    // 見つからない場合のフォールバック (1-1を返すなど)
    return WORLD_MAP["AREA_1"].stages[0];
}

// Updated: WORLD_MAPを走査して「次の通常ステージID」を見つける (v6.4)
function getNextStageId(currentId) {
    // 全エリアの「NORMAL」ステージだけを順番に並べた配列を作る
    let allNormalStages = [];
    Object.values(WORLD_MAP).forEach(area => {
        allNormalStages = allNormalStages.concat(area.stages.filter(s => s.type === "NORMAL"));
    });

    const currentIndex = allNormalStages.findIndex(s => s.id === currentId);
    // 次の通常ステージがあればそのIDを返し、なければ null
    if (currentIndex >= 0 && currentIndex < allNormalStages.length - 1) {
        return allNormalStages[currentIndex + 1].id;
    }
    return null; 
}

// ステージ表示名を取得 (例: "STAGE 1", "EXTRA", "STAGE 5")
function getStageDisplayName(stageId) {
    const data = getStageData(stageId);
    return data ? data.title : "UNKNOWN";
}

// ステージの最大フロア数を取得
function getMaxFloors(stageId) {
    const data = getStageData(stageId);
    return data ? data.floors.length : 1;
}

// ボスフロアかどうかを判定 (bossFloor未定義時はfloors値を使用)
function isBossFloor(stageId, flr) {
    const data = getStageData(stageId);
    if (!data) return false;
    // bossFloor定義があればそれ以降、なければ最終階のみ
    const bossStart = data.bossFloor || data.floors.length;
    return flr >= bossStart;
}

// ステージ背景画像のURLを取得
function getStageBackground(stageId, flr) {
    const data = getStageData(stageId);
    if (!data) return "";
    // ボスフロアかつボス背景設定があれば切り替え
    if (isBossFloor(stageId, flr) && data.bossBg) {
        return data.bossBg;
    }
    return data.bg;
}

// Updated: BGM管理の一元化関数
function updateStageBGM(stgId, flr) {
    const sData = getStageData(stgId);
    if (!sData) return;

    // 1. ボス戦かどうか
    const isBoss = isBossFloor(stgId, flr);

    // 2. ステージタイプによる判定
    if (sData.type === "EXTRA") {
        playBGM("bgm-extra");
    } else if (isBoss) {
        playBGM("bgm-boss");
    } else {
        // 将来的に data.js に bgm プロパティを持たせればここで分岐可能
        playBGM("bgm-battle");
    }
}

// Updated: ステージ解放判定 (v6.3 - Dynamic Logic)
function isStageUnlocked(stageId) {
    // 最初のステージ(1-1)は常に解放
    if (stageId === "1-1") return true;

    // ステージデータ取得
    const sData = getStageData(stageId);
    if (!sData) return false;

    // EXTRAステージの特別条件
    if (sData.type === "EXTRA") {
        // 例: EXTRA解放済みフラグがある、またはキーとなるステージ(1-3)をクリア済みなど
        // 今回はシンプルに「EXTRAクリア済みフラグ」または「前のステージ(1-3)クリア」で判定
        // ※厳密な条件はゲームデザインによりますが、一旦「1-3クリアで解放」とします
        return !!savedData.bestRanks["1-3"];
    }

    // 通常ステージ: 「一つ前のステージ」をクリアしているか？
    // 全ステージリストを取得してインデックスで判定
    let allStages = [];
    Object.values(WORLD_MAP).forEach(area => {
        allStages = allStages.concat(area.stages);
    });
    
    const idx = allStages.findIndex(s => s.id === stageId);
    if (idx > 0) {
        const prevStage = allStages[idx - 1];
        // 前のステージのランク記録があればクリア済みとみなす
        // ただし、前のステージがEXTRAの場合は、その前(通常ステージ)を見るなどの調整が必要かもだが、
        // 今回の並び順(1-3 -> 1-EX -> 2-1)だと、1-EXクリアしないと2-1に行けないことになる。
        // それを避けるため、2-1の解放条件は「1-3クリア」としたい場合、データ構造順序に依存する。
        // ★暫定対応: 2-1 は 1-3 クリアで解放
        if (stageId === "2-1") return !!savedData.bestRanks["1-3"];
        
        return !!savedData.bestRanks[prevStage.id];
    }

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

// =========================================
// GAME FLOW (Refactored for WORLD_MAP)
// =========================================

function initGameSession(startStage, continueMode = false) {
    if (!continueMode) {
        player = {
            ...JSON.parse(JSON.stringify(PLAYER_INITIAL_STATS)), // ディープコピー
            states: [], // ★ 修正: 配列で初期化
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
    const stageData = getStageData(sel);
    
    el("chapter-title").innerText = stageData.title;
    el("chapter-sub").innerText = stageData.sub;
    const ch = el("chapter-screen");
    
    // warning プロパティ判定
    if (stageData.warning) { playSE("se-warning"); ch.classList.add("chapter-extra"); } 
    else { playSE("se-tap"); ch.classList.remove("chapter-extra"); }

    el("game-container").style.backgroundImage = "none";
    el("game-container").style.backgroundColor = "#000";

    // ★修正: 共通関数でBGM決定 (フロア1として判定)
    updateStageBGM(sel, 1);
    
    el("black-curtain").classList.add("fade-in");
    
    // --- プリロード開始 ---
    const assetsToLoad = [];

    // 背景画像
    if (stageData.bg) assetsToLoad.push(preloadImage(stageData.bg));
    if (stageData.bossBg) assetsToLoad.push(preloadImage(stageData.bossBg));
    
    // 敵画像 (floors配列から取得)
    if (stageData.floors) {
        stageData.floors.forEach(enemyDef => {
            if (enemyDef.img) assetsToLoad.push(preloadImage(enemyDef.img));
        });
    }

    const introTime = stageData.warning ? TIMING.BATTLE_TRANSITION_WARNING : TIMING.BATTLE_TRANSITION;
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
    }, TIMING.FADE_OUT);
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

    setTimeout(handlePreemptiveAI, TIMING.ENCOUNTER_WAIT_LONG);
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
        enemy.states = []; 
        enemy.actionCount = 0;
        enemy.patternQueue = [];
        enemy.preemptiveTriggered = false; 
        currentTurn = 0; turnInputs = []; currentInput = ""; isJustFinish = false; waitingForChest = false; dropGuaranteed = false; weakHitCount = 0;
        
        updateScoreDisplay();
        
        el("flash-overlay").className = "";
        const container = el("game-container");
        container.classList.remove("shake-heavy", "shake-medium", "shake-small", "boss-mode");
        el("boss-label").style.display = "none";
        el("chest-img").style.display = "none";
        
        const img = el("enemy-img");
        img.style.display = "none";
        img.src = "";
        img.classList.remove("enemy-appear-anim");

        // ★新ヘルパーで背景取得
        const bgUrl = getStageBackground(stage, floor);
        if (bgUrl) container.style.backgroundImage = `url('${bgUrl}')`;
        else console.warn("No Background URL found");

        // ★新データ構造から敵を取得
        const stageData = getStageData(stage);
        const enemyList = stageData.floors;
        
        // フロアが範囲外ならループさせるかエラーにする（ここではループ）
        const enemyDef = enemyList[(floor - 1) % enemyList.length];
        
        // Enemyオブジェクトへ展開
        enemy.data = enemyDef; // AI参照用
        enemy.atk = enemyDef.atk || 10; 
        enemy.maxHp = enemyDef.hp || 100;
        enemy.name = enemyDef.name;
        enemy.hp = enemy.maxHp;
        displayEnemyHP = enemy.hp;

        // ★修正: 共通関数でBGM決定
        updateStageBGM(stage, floor);

        isProcessing = true;

        const spawnDelay = (floor === 1) ? TIMING.SPAWN_DELAY_FIRST : TIMING.SPAWN_DELAY;
        setTimeout(() => {
            img.style.display = "block";
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
    // ...以下、既存ロジックと同じなので省略せず記述...
    const img = el("enemy-img");
    img.src = enemy.data.img;
    
    if (isBoss) {
        el("game-container").classList.add("boss-mode");
        el("boss-label").style.display = "inline";
        playSE("se-warning");
        announce(`WARNING: ${enemy.name}`, "danger");
    } else {
        playSE("se-attack");
        announce(`${enemy.name} APPEARED!`, "normal");
    }

    setTimeout(handlePreemptiveAI, TIMING.ENCOUNTER_WAIT);
}

// Updated: handlePreemptiveAI (v3.0 Async Support)
async function handlePreemptiveAI() {
    try {
        const aiList = enemy.data.ai || [];
        const preemptiveSkill = aiList.find(a => a.preemptive && checkAICondition(a.cond));

        // 出現演出の完了を少し待つ
        await wait(TIMING.PREEMPTIVE_DELAY);

        // ★追加: 敵が出現し、名前が出た後にトラップ(落とし穴)を判定
        if (player.setCard) {
            const incomingDmg = triggerTrap('summon', 0);
            // トラップでダメージが発生した場合は少し待つ
            if (incomingDmg > 0) {
                updateInfo();
                if (enemy.hp <= 0) {
                    setTimeout(winBattle, TIMING.WIN_DELAY);
                    return;
                }
                await wait(TIMING.TRAP_DELAY);
            }
        }

        if (preemptiveSkill) {
            // 新エンジンで実行し、完了を待つ
            await executeSkill(preemptiveSkill, true);
            await wait(TIMING.PREEMPTIVE_AFTER);
            preparePlayerTurn();
        } else {
            // 先制なし
            await wait(TIMING.NO_PREEMPTIVE_DELAY);
            preparePlayerTurn();
        }
    } catch (error) {
        console.error("Battle Error (handlePreemptiveAI):", error);
        addLog(">> エラーが発生しました", "log-system");
        isProcessing = false;
        preparePlayerTurn();
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










// Input Lock for Enter Key Up
window.addEventListener("keyup", (e) => {
    if (e.key === "Enter") inputLockUntilRelease = false;
});


// Input Handling for Unboxing & Cheats
window.addEventListener("keydown", function (e) {

    // [開発用ショートカット]
    if (el("game-screen").style.display !== "none") {
        // 'K'キーで敵を即倒す (Kill)
        if (e.key === 'k' || e.key === 'K') {
            enemy.hp = 0;
            updateInfo();
            winBattle();
            return;
        }
        // 'M'キーでMPを全快させる (Max MP)
        if (e.key === 'm' || e.key === 'M') {
            player.mp = player.maxMp;
            updateInfo();
            addLog("DEBUG: MP Refilled", "log-system");
            return;
        }
        // 'H'キーでHPを全快させる (Heal)
        if (e.key === 'h' || e.key === 'H') {
            player.hp = player.maxHp;
            updateInfo();
            addLog("DEBUG: HP Fully Restored", "log-system");
            return;
        }
    }

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

// =========================================
// DEBUG TOOLS (開発用)
// =========================================

/**
 * 指定したステージとフロアへ強制ジャンプ
 * 例: debugJump(3, 2) -> ステージ3の2Fへ
 */
window.DJ = function(s, f = 1) {
    console.log(`DEBUG: Jumping to Stage ${s}, Floor ${f}`);
    
    // 1. 全ての画面とBGMをリセット
    stopAllBGM();
    el("title-screen").style.display = "none";
    el("stage-select-screen").style.display = "none";
    el("chapter-screen").style.display = "none";
    el("interval-screen").style.display = "none";
    el("game-screen").style.display = "block";
    
    // 2. プレイヤーの状態を初期化（テスト用に全快させる）
    player.hp = player.maxHp;
    player.mp = player.maxMp;
    player.states = [];
    player.deck = shuffleArray([...savedData.deck]);
    player.hand = [];
    for(let i=0; i<3; i++) drawCard(true); // 初期手札3枚
    
    // 3. 座標をセットして敵を出現させる
    stage = s;
    floor = f;
    spawnEnemy();
    
    // 4. インターバルを飛ばして即戦闘開始したい場合
    isInterval = false;
    el("interval-screen").style.display = "none";
};
