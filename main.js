console.log("★ main.js is loaded! (v2.18.6)");

// =========================================
// 1. INITIALIZATION & DATA (初期化・データ)
// =========================================
window.addEventListener('resize', resizeGame);
window.addEventListener('load', () => {
    resizeGame();
    loadGameData();
    initSlotScreen();
    if (window.innerWidth < 900) document.body.style.overflowY = "auto";
    if (window.DebugManager) window.DebugManager.init();

    // Debug Auto-Resume
    const lastSlot = localStorage.getItem("debug_last_slot");
    if (lastSlot) {
        localStorage.removeItem("debug_last_slot");
        selectSlot(parseInt(lastSlot));

        // If jump was requested (implicitly via savedData override, or explicit flag can be added)
        // Since we modify savedData directly in debug.js, we can just check if we are in a "jump" context?
        // Actually, jumpToStage modifies savedData.highScore.stage.
        // If we want to AUTO START, we need a flag.

        // For now, just selecting the slot is a huge win.
        // But the user pressed "Jump to Stage", so they expect to be IN game.
        // Let's check a specific flag for jump.
        const jumpFlag = localStorage.getItem("debug_jump_flag");
        if (jumpFlag) {
            localStorage.removeItem("debug_jump_flag");
            // We need to wait for selectSlot to finish? It's synchronous mostly.
            // stageId is in savedData.highScore.stage
            if (savedData && savedData.highScore && savedData.highScore.stage) {
                // Determine if we should start immediately
                // UI.js: initGameSession(stageId)
                if (window.initGameSession) {
                    // Pass floor if available
                    const startFloor = savedData.highScore.floor || 1;
                    initGameSession(savedData.highScore.stage, false, startFloor);
                }
            }
        }
    }
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

// =========================================
// 2. SLOT MANAGEMENT (スロット管理)
// =========================================

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
            bestRanks: {}, unlockedStage4: false, deck: [], cards: {},
            stageStats: {} // 新規: ステージ戦績
        };
    }

    savedData = allSaveData[currentSlot];

    // データ修復
    if (!savedData.deck) savedData.deck = [];
    if (!savedData.cards) savedData.cards = {};
    if (!savedData.stageStats) savedData.stageStats = {}; // 既存データ対応
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
// 3. BLUETOOTH CONNECTION (通信)
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
// 4. GAME FLOW & SESSION (ゲーム進行・セッション)
// =========================================

function initGameSession(startStage, continueMode = false, startFloor = 1) {
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
    startTransition(startStage, continueMode, startFloor);
}

// Updated: startTransition (v6.1 - Using ID Helper)
async function startTransition(sel, continueMode, startFloor = 1) {
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
        setupStage(sel, continueMode, startFloor);
    }, TIMING.FADE_OUT);
}

function returnToTitle() {
    playBGM("bgm-title");
    el("game-container").classList.remove("boss-mode", "extra-mode");
    el("game-screen").style.display = "none";
    el("title-screen").style.display = "flex";
    el("stage-select-screen").style.display = "none";
    updateTitleScore();
}


// =========================================
// 5. SAVE & EXPORT (セーブ・データ出力)
// =========================================


function finishSession(resultType, ppr, multiplier = 1.0, rank = "", turn = 0) {
    let earnedDP = 0;
    clearedStagesLog.forEach(log => { earnedDP += log.dp; });

    const scoreDP = (resultType === "LOSE") ? 0 : Math.floor(totalScore * 0.2 * multiplier);
    const totalDP = earnedDP + scoreDP;

    savedData.dp = (savedData.dp || 0) + totalDP;

    const getStageIndex = (id) => {
        let idx = 0;
        let found = -1;
        Object.values(WORLD_MAP).forEach(area => {
            area.stages.forEach(s => {
                if (s.id === id) found = idx;
                idx++;
            });
        });
        return found;
    };

    const currentIdx = getStageIndex(stage);
    const bestIdx = getStageIndex(savedData.highScore.stage);

    let isNewRecord = false;

    if (currentIdx > bestIdx || (currentIdx === bestIdx && floor > savedData.highScore.floor)) {
        savedData.highScore.stage = stage;
        savedData.highScore.floor = floor;
        isNewRecord = true;
    }

    if (parseFloat(ppr) > savedData.highScore.avg) {
        savedData.highScore.avg = parseFloat(ppr);
        isNewRecord = true;
    }

    if (getStageData(stage).type === "EXTRA" && resultType === "WIN") {
        savedData.clearedExtra = true;
    }

    const now = new Date();
    const dateStr = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${("0" + now.getMinutes()).slice(-2)}`;
    let stgName = getStageDisplayName(stage) + ((resultType === "WIN" || resultType === "RETURN") ? " CLEAR" : `-${floor}F`);

    // --- stageStats 更新ロジック (v6.4) ---
    if (!savedData.stageStats) savedData.stageStats = {};
    // stageは数値IDの可能性があるため文字列化してキーにする
    const sKey = String(stage);

    if (!savedData.stageStats[sKey]) {
        savedData.stageStats[sKey] = { attempts: 0, clears: 0, maxDP: 0, bestTurns: null };
    }
    const stats = savedData.stageStats[sKey];

    // 1. 挑戦回数
    stats.attempts++;

    // 2. クリア回数 & 最短ターン
    // 2. クリア回数 & 最短ターン
    if (resultType === "WIN" || resultType === "RETURN") {
        stats.clears++;
        if (stats.bestTurns === null || turn < stats.bestTurns) {
            stats.bestTurns = turn;
        }
    }

    // 3. 最高DP (敗北時もDPは入るため判定して更新)
    if (totalDP > stats.maxDP) {
        stats.maxDP = totalDP;
    }
    // ----------------------------------------

    const historyItem = {
        date: dateStr, stage: stage, floor: floor, stgName: stgName,
        result: resultType === "LOSE" ? "LOSE" : "WIN",
        dp: totalDP,
        ppr: isNaN(ppr) ? 0 : parseFloat(ppr),
        rt: calculateRating(isNaN(ppr) ? 0 : parseFloat(ppr)),
        rank: rank,
        turn: turn
    };

    if (!savedData.history) savedData.history = [];
    savedData.history.unshift(historyItem);
    if (savedData.history.length > 50) savedData.history.pop();

    updateTitleScore();
    saveToDrive();

    return { isNewRecord: isNewRecord, gainedDP: totalDP };
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







// =========================================
// 6. INPUT & CHEATS (入力・チート)
// =========================================

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

    // Chest Interaction removed

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
// 7. DEBUG TOOLS (デバッグツール)
// =========================================

/**
 * 指定したステージとフロアへ強制ジャンプ
 * 例: debugJump(3, 2) -> ステージ3の2Fへ
 */
window.DJ = function (s, f = 1) {
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
    for (let i = 0; i < 3; i++) drawCard(true); // 初期手札3枚

    // 3. 座標をセットして敵を出現させる
    stage = s;
    floor = f;
    spawnEnemy();

    // 4. インターバルを飛ばして即戦闘開始したい場合
    isInterval = false;
    el("interval-screen").style.display = "none";
};
