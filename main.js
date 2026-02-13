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
        // ★ 修正: 個別のフラグ管理をやめ、states配列を空にする
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

