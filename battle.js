// =========================================
// 1. BATTLE LIFECYCLE (戦闘ライフサイクル)
// =========================================

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

        const bgUrl = getStageBackground(stage, floor);
        if (bgUrl) container.style.backgroundImage = `url('${bgUrl}')`;
        else console.warn("No Background URL found");

        const stageData = getStageData(stage);
        const enemyList = stageData.floors;
        const enemyDef = enemyList[(floor - 1) % enemyList.length];

        enemy.data = enemyDef;
        enemy.atk = enemyDef.atk || 10;
        enemy.maxHp = enemyDef.hp || 100;
        enemy.name = enemyDef.name;
        enemy.hp = enemy.maxHp;
        displayEnemyHP = enemy.hp;

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

function triggerEncounterEffects() {
    const isBoss = isBossFloor(stage, floor);
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

async function handlePreemptiveAI() {
    try {
        const aiList = enemy.data.ai || [];
        const preemptiveSkill = aiList.find(a => a.preemptive && checkAICondition(a.cond));

        await wait(TIMING.PREEMPTIVE_DELAY);

        if (player.setCard) {
            const incomingDmg = triggerTrap('summon', 0);
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
            await executeSkill(preemptiveSkill, true);
            await wait(TIMING.PREEMPTIVE_AFTER);
            preparePlayerTurn();
        } else {
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

// Updated: loseGame (v7.4 - Fixed ReferenceError & Timing)
function loseGame() {
    try {
        isProcessing = true;
        playBGM("bgm-lose");

        const ppr = totalDarts > 0 ? ((totalScore / totalDarts) * 3).toFixed(1) : 0;

        // ★修正: STAGE_MASTER[stage] を getStageData(stage) に変更
        const stageData = getStageData(stage);
        const multiplier = stageData ? stageData.multiplier : 1.0;

        finishSession("LOSE", parseFloat(ppr), multiplier, "", 0);

        // モーダルを表示
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
    } catch (error) {
        console.error("Critical error in loseGame:", error);
        // 万が一エラーが起きてもタイトルに戻れるようにフォールバック
        returnToTitle();
    }
}

// Updated: nextStep (v6.4 - Fixed Selection Buttons)
function nextStep() {
    floor++;

    if (floor > getMaxFloors(stage)) {
        playBGM("bgm-win");

        const stageTurns = totalGameTurns - stageStartTurn;
        const [rank, dpBonus] = calculateStageRank(stage, stageTurns);

        // ベストランク更新
        const currentBest = savedData.bestRanks[stage];
        const ranksOrder = ["SSS", "S", "A", "B", "C"];
        if (!currentBest || ranksOrder.indexOf(rank) < ranksOrder.indexOf(currentBest)) {
            savedData.bestRanks[stage] = rank;
        }

        const sData = getStageData(stage);
        const mult = sData.multiplier || 1.0;
        const currentPPR = totalDarts > 0 ? ((totalScore / totalDarts) * 3).toFixed(1) : 0;

        clearedStagesLog.push({ stage, rank, dp: dpBonus });

        // 表示用DP（これまでの蓄積）
        let totalRankDP = 0;
        clearedStagesLog.forEach(log => { totalRankDP += log.dp; });
        const scoreDP = Math.floor(totalScore * 0.2 * mult);
        const potentialTotalDP = scoreDP + totalRankDP;

        // 次の行き先を判定
        const nextStageId = getNextStageId(stage);

        // --- 分岐処理 ---

        // A. EXTRAステージをクリアした場合（即帰還）
        if (sData.type === "EXTRA") {
            const { gainedDP } = finishSession("WIN", parseFloat(currentPPR), mult, rank, stageTurns);
            showDialog("EXTRA CLEAR!!",
                `<span style="color:#f0f; font-size:24px;">MISSION COMPLETE</span><br>
                 RANK: <span style="color:${getRankColor(rank)}">${rank}</span><br>
                 GET DP: <span style="color:#ffd700; font-weight:bold;">+${gainedDP}</span>`,
                "clear",
                [{ text: "TITLE", action: returnToTitle }]
            );
            return;
        }

        // B. 通常ステージをクリアした場合
        const btnGroup = [];

        // 次の通常ステージがあるなら NEXT ボタンを追加
        if (nextStageId) {
            btnGroup.push({
                text: "⛺ NEXT",
                action: () => {
                    player.hp = Math.min(player.hp + 30, player.maxHp);
                    initGameSession(nextStageId, true);
                }
            });
        }

        // 常に RETURN ボタンを追加
        btnGroup.push({
            text: "🏠 RETURN",
            action: () => {
                const { gainedDP } = finishSession("RETURN", parseFloat(currentPPR), mult, rank, stageTurns);
                showDialog("MISSION COMPLETE", `帰還しました。<br>獲得DP: <span style="color:#ffd700;">+${gainedDP}</span>`, "clear", [{ text: "OK", action: returnToTitle }]);
            }
        });

        showDialog("STAGE CLEAR",
            `RANK: <span style="font-size:24px; color:${getRankColor(rank)}">${rank}</span><br>
             獲得予定DP: <span style="color:#ffd700; font-weight:bold;">${potentialTotalDP}</span><br>
             <span style="font-size:12px; color:#aaa;">(累計PPR: ${currentPPR})</span>`,
            "clear",
            btnGroup
        );

    } else {
        spawnEnemy();
    }
}

function checkDrop() {
    // ★修正: ヘルパー使用
    if (floor === getMaxFloors(stage) && isBossFloor(stage, floor)) {
        // 最終フロアかつボスならドロップなしで次へ（この条件はゲーム性次第で調整可）
        nextStep();
        return;
    }

    const isBoss = isBossFloor(stage, floor);
    // ...以下同じ
    let dropRate = isBoss ? 1.0 : 0.3;
    if (dropGuaranteed) dropRate = 1.0;

    if (Math.random() < dropRate) {
        waitingForChest = true;
        el("enemy-img").style.display = "none";
        el("chest-img").style.display = "block";
        el("chest-img").classList.add("chest-shine");
        playSE("se-chest");
        addLog("宝箱を見つけた！", "log-item");
        setTimeout(() => { if (waitingForChest) openChest(); }, TIMING.CHEST_AUTO_OPEN);
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

// =========================================
// 2. TURN FLOW (ターン進行)
// =========================================

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

async function startPlayerTurn() {
    if (!isInterval) return;

    // ★追加: プレイヤーがかけた「round」ステートを経過させる
    tickStates("PLAYER", "round");

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

// Updated: processOneThrow (v5.9 - Fixed Action Lock / Bind)
async function processOneThrow(score) {
    try {
        if (enemy.hp <= 0 || player.hp <= 0 || isProcessing || isInterval) return;

        // 1. 投擲開始時の拘束状態を記録
        const isBound = hasState(player, "action_lock");

        // 既に1投投げているのに、拘束フラグがある場合はガード（通常ここには来ない）
        if (isBound && turnInputs.length > 0) return;

        // 2. 攻撃計算とステートの進行
        let singleDmg = applyOffenseLogic(score, player, false);

        // 投げた瞬間に「投数(throw)」タイミングのステートを減らす (atk_buffなど)
        tickStates("PLAYER", "throw");
        tickStates("ENEMY", "throw");

        // 防御計算
        singleDmg = await applyDefenseLogic(singleDmg, enemy, true);

        // 3. 判定と適用
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

        // 演出
        triggerEffect(el("game-screen"), singleDmg, false);
        el("enemy-hp-value").innerText = enemy.hp;
        displayEnemyHP = enemy.hp;
        updateInfo();

        // 4. 勝利判定
        if (enemy.hp <= 0) {
            isProcessing = true;
            totalGameTurns++;
            setTimeout(winBattle, TIMING.WIN_DELAY_LONG);
            return;
        }

        // 5. ★ 拘束解除とターン終了判定
        if (isBound) {
            // 手動削除を廃止。tickStates(player, "throw") で既に s.turn-- されており、自動的に削除される
            updateInfo();

            // 1投目だが拘束中だったので、即座にターン終了へ
            setTimeout(finishPlayerTurn, TIMING.TURN_END_DELAY);
        } else if (turnInputs.length >= 3) {
            // 通常の3投終了
            setTimeout(finishPlayerTurn, TIMING.TURN_END_DELAY);
        }
    } catch (error) {
        console.error("Battle Error (processOneThrow):", error);
        addLog(">> エラーが発生しました", "log-system");
        isProcessing = false;
        turnInputs = [];
        currentInput = "";
        updateScoreDisplay();
        preparePlayerTurn();
    }
}

function finishPlayerTurn() {
    totalGameTurns++;
    turnInputs = [];
    currentInput = "";
    updateScoreDisplay();

    setTimeout(processEnemyTurn, TIMING.ENEMY_TURN_DELAY);
}

// Updated: processEnemyTurn (v7.1 - Multi-turn Sequence Support)
async function processEnemyTurn() {

    // ★追加: 敵がかけたステートを経過させる
    tickStates("ENEMY");

    try {
        if (hasState(enemy, "stun")) { // ★修正: hasStateヘルパーを使用
            addLog(`${enemy.name}はスタン中`, "log-system");
            // スタン(round)は endEnemyTurn の tickStates で自動消滅します
            endEnemyTurn();
            if (player.hp > 0) preparePlayerTurn();
            return;
        }

        enemy.actionCount++;
        let selectedSkill = null;

        // 1. 進行中の連続行動があれば優先
        if (enemy.patternQueue && enemy.patternQueue.length > 0) {
            selectedSkill = enemy.patternQueue.shift();
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
            enemy.patternQueue = queue;
            await executeSkill(currentAction);
        } else {
            // 単発スキルの実行
            await executeSkill(selectedSkill);
        }

        endEnemyTurn();

        if (player.hp > 0) {
            preparePlayerTurn();
        }
    } catch (error) {
        console.error("Battle Error (processEnemyTurn):", error);
        addLog(">> エラーが発生しました", "log-system");
        isProcessing = false;
        endEnemyTurn();
        if (player.hp > 0) preparePlayerTurn();
    }
}

function endEnemyTurn() {
    // 敵が自身に付与した「round」タイミングのステート（バフ等）を減らす
    tickStates("ENEMY", "round");
    updateInfo();
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

function drawCard(isSilent = false) {
    if (player.deck.length === 0) return;
    if (player.hand.length >= HAND_SIZE) return;
    const cardId = player.deck.pop();
    player.hand.push(cardId);
    if (!isSilent) triggerFloatText("DRAW!", el("hand-area"));
    updateInfo();
}

// =========================================
// 3. BATTLE ENGINE (戦闘エンジン・解決)
// =========================================

// Updated: processOneThrow (v5.9 - Fixed Action Lock / Bind)
async function processOneThrow(score) {
    try {
        if (enemy.hp <= 0 || player.hp <= 0 || isProcessing || isInterval) return;

        // 1. 投擲開始時の拘束状態を記録
        const isBound = hasState(player, "action_lock");

        // 既に1投投げているのに、拘束フラグがある場合はガード（通常ここには来ない）
        if (isBound && turnInputs.length > 0) return;

        // 2. 攻撃計算とステートの進行
        let singleDmg = applyOffenseLogic(score, player, false);

        // 投げた瞬間に「投数(throw)」タイミングのステートを減らす (atk_buffなど)
        tickStates("PLAYER", "throw");
        tickStates("ENEMY", "throw");

        // 防御計算
        singleDmg = await applyDefenseLogic(singleDmg, enemy, true);

        // 3. 判定と適用
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

        // 演出
        triggerEffect(el("game-screen"), singleDmg, false);
        el("enemy-hp-value").innerText = enemy.hp;
        displayEnemyHP = enemy.hp;
        updateInfo();

        // 4. 勝利判定
        if (enemy.hp <= 0) {
            isProcessing = true;
            totalGameTurns++;
            setTimeout(winBattle, TIMING.WIN_DELAY_LONG);
            return;
        }

        // 5. ★ 拘束解除とターン終了判定
        if (isBound) {
            // 手動削除を廃止。tickStates(player, "throw") で既に s.turn-- されており、自動的に削除される
            updateInfo();

            // 1投目だが拘束中だったので、即座にターン終了へ
            setTimeout(finishPlayerTurn, TIMING.TURN_END_DELAY);
        } else if (turnInputs.length >= 3) {
            // 通常の3投終了
            setTimeout(finishPlayerTurn, TIMING.TURN_END_DELAY);
        }
    } catch (error) {
        console.error("Battle Error (processOneThrow):", error);
        addLog(">> エラーが発生しました", "log-system");
        isProcessing = false;
        turnInputs = [];
        currentInput = "";
        updateScoreDisplay();
        preparePlayerTurn();
    }
}

// プレイヤーターン終了処理
function finishPlayerTurn() {
    totalGameTurns++;
    turnInputs = [];
    currentInput = "";
    updateScoreDisplay();

    setTimeout(processEnemyTurn, TIMING.ENEMY_TURN_DELAY);
}


// =========================================
// 10. ENEMY AI & BATTLE SYSTEM (敵ターン・決着)
// =========================================

// Updated: triggerTrap (v4.6 - Async Support)
async function triggerTrap(triggerType, incomingDmg = 0) {
    try {
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
        setTimeout(() => el("flash-overlay").className = "", TIMING.FLASH_DURATION);

        if (enemy.hp <= 0) {
            setTimeout(winBattle, TIMING.WIN_DELAY_SHORT); // 少し待って勝利演出へ
        }

        return finalDmg;
    } catch (error) {
        console.error("Battle Error (triggerTrap):", error);
        addLog(">> トラップ実行エラー", "log-system");
        // エラー時は罠を消費せずダメージをそのまま返す
        return incomingDmg;
    }
}

// =========================================
// 3. BATTLE ENGINE (戦闘エンジン・解決)
// =========================================

// Updated: executeSkill (プレイヤー/敵 共通)
async function executeSkill(skill, isPreemptive = false, isCard = false) {
    try {
        // skill.visual が存在しない場合のフォールバック
        const skillVis = skill.visual || {};

        // 1. 演出（カード使用時はカットインなし、SEのみ）
        if (skill.name && !isCard) {
            showSkillCutin(skill.name, skill.visual?.cutin?.color || "fire");
            await wait(TIMING.CUTIN_DISPLAY);
        }
        if (skill.visual?.msg) {
            addLog(skill.visual.msg, "log-enemy");
        }

        // 2. 各アトムを順番に実行
        for (const action of skill.actions) {
            await resolveAction(action, isCard, skillVis);
            if (enemy.hp <= 0 || player.hp <= 0) return; // 決着がついたら中断
            await wait(isCard ? TIMING.CARD_ACTION_GAP : TIMING.ACTION_GAP);
        }

        // 3. 余韻
        if (!isPreemptive) {
            const finalWait = isCard ? TIMING.CARD_AFTERGLOW : getCalculatedWait(skill);
            await wait(finalWait);
        }
    } catch (error) {
        console.error("Battle Error (executeSkill):", error);
        addLog(">> スキル実行エラー", "log-system");
        // エラーが発生しても処理は続行（次のターンへ）
    }
}

// Updated: 攻撃ロジック (v5.0 ステート・スキャナー方式)
function applyOffenseLogic(basePower, sourceObj, applyRandom = true) {
    // 1. カテゴリが "atk_mult" (倍率) のステート値を合計する
    const multBonus = sourceObj.states
        .filter(s => STATE_MASTER[s.id]?.category === "atk_mult")
        .reduce((sum, s) => sum + s.val, 0);

    // 2. カテゴリが "atk_add" (加算) のステート値を合計する
    const addBonus = sourceObj.states
        .filter(s => STATE_MASTER[s.id]?.category === "atk_add")
        .reduce((sum, s) => sum + s.val, 0);

    // 3. 計算実行: (威力 + 加算) * (1.0 + 倍率)
    let finalDmg = (basePower + addBonus) * (1.0 + multBonus);

    if (applyRandom) {
        const rand = 0.9 + (Math.random() * 0.2);
        finalDmg *= rand;
    }

    return Math.floor(finalDmg);
}

// Updated: 防御ロジック (v5.0 ステート・スキャナー方式)
function applyDefenseLogic(dmg, targetObj, isDarts = false) {
    let finalDmg = dmg;

    // 1. 結界 (barrier) チェック
    const maxBarrier = targetObj.states
        .filter(s => STATE_MASTER[s.id]?.category === "barrier")
        .reduce((max, s) => Math.max(max, s.val), 0);

    if (maxBarrier > 0 && finalDmg < maxBarrier) {
        if (!isDarts) addLog("結界が攻撃を遮断！", "log-enemy");
        return 0;
    }

    // 2. 倍率防御 (dmg_mult) チェック
    const dmgMult = targetObj.states
        .filter(s => STATE_MASTER[s.id]?.category === "dmg_mult")
        .reduce((prod, s) => prod * s.val, 1.0); // 0.5が2つあれば0.25倍になる

    finalDmg *= dmgMult;

    // 3. 固定防御 (dmg_sub) チェック
    const dmgSub = targetObj.states
        .filter(s => STATE_MASTER[s.id]?.category === "dmg_sub")
        .reduce((sum, s) => sum + s.val, 0);

    finalDmg = Math.max(0, finalDmg - dmgSub);

    return Math.floor(finalDmg);
}

// Updated: resolveAction (v4.9.1 - Fixed Reference Error)
async function resolveAction(action, executorIsPlayer = false, skillVisual = {}) {
    try {
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
                            await wait(TIMING.DRAIN_DELAY);
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
                    // ★修正: 死亡チェック
                    if (targetObj.hp <= 0) {
                        isProcessing = true; // 操作をロック
                        if (isPlayerTarget) {
                            // プレイヤー敗北
                            setTimeout(loseGame, TIMING.WIN_DELAY_LONG);
                        } else {
                            // 敵撃破
                            setTimeout(winBattle, TIMING.WIN_DELAY_SHORT);
                        }
                        return; // 重要：ループを抜けてその後のアトムを実行させない
                    }
                    if (count > 1) await wait(TIMING.MULTI_HIT_GAP);
                }
                break;

            case "MP_ACTION":
                if (targetObj === player) {
                    const changeVal = action.val || 0;
                    if (changeVal < 0) {
                        // ★ 減少演出を待機実行
                        await animateMPLoss(changeVal);
                    } else if (changeVal > 0) {
                        // ★ 増加演出（以前作ったものを流用）
                        await animateMPGain(changeVal);
                    }
                }
                break;

            case "HEAL":
                playSE(effectiveVisual.se || "se-heal");
                const hVal = (action.val === "FULL" || action.val > 500) ? (targetObj.maxHp - targetObj.hp) : action.val;
                targetObj.hp = Math.min(targetObj.maxHp, targetObj.hp + hVal);
                triggerEffect(el("game-screen"), hVal, isPlayerTarget, true);
                break;

            case "STATE":
                targetObj.states.push({
                    id: action.kind,
                    turn: action.turn || 1,
                    val: action.val || 0,
                    // ★追加: 誰が付与したかを記録
                    caster: executorIsPlayer ? "PLAYER" : "ENEMY"
                });

                // 演出だけは共通で実行
                playSE(effectiveVisual.se || "se-buff");
                if (effectiveVisual.msg) addLog(effectiveVisual.msg, "log-skill");
                break;

            case "DRAW":
                for (let j = 0; j < action.val; j++) {
                    executeDrawWithAnim();
                    await wait(TIMING.CARD_DRAW_INTERVAL);
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
    } catch (error) {
        console.error("Battle Error (resolveAction):", error);
        addLog(">> アクション実行エラー", "log-system");
        // エラーが発生しても処理は続行
    }
}

// =========================================
// 4. CARD & ITEM (カード・アイテム)
// =========================================
function useItem(type) {
    if (isProcessing || waitingForChest) return;
    if (turnInputs.length > 0) {
        addLog(">> 投擲中はアイテムを使えません！", "log-system");
        return;
    }
    // ★修正: hasStateを使用してアイテム封印を判定
    if (hasState(player, "item_lock")) {
        playSE("se-warning");
        addLog(`>> アイテム封印中！`, "log-system");
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



// Updated: カード使用ロジック (v4.0 Async化)
async function playHandCard(index) {
    try {
        if (isProcessing || waitingForChest || isInterval) return;
        if (turnInputs.length > 0) {
            addLog(">> 投擲中はカードを使えません！", "log-system");
            return;
        }
        if (hasState(player, "item_lock")) {
            playSE("se-warning");
            addLog(`>> アイテム封印中！`, "log-system");
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
            await wait(TIMING.TRAP_SET_DELAY);
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
            setTimeout(winBattle, TIMING.WIN_DELAY);
        }
    } catch (error) {
        console.error("Battle Error (playHandCard):", error);
        addLog(">> カード使用エラー", "log-system");
        isProcessing = false;
        updateInfo();
    }
}



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
// 5. INPUT & DEBUG (入力・デバッグ)
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

