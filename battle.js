// =========================================
// 1. BATTLE LIFECYCLE (戦闘ライフサイクル)
// =========================================

// レリーフ発光タイマー (スロットごとのタイムスタンプ、updateInfo再生成に耐える)
let reliefGlowTimers = [0, 0, 0];
const RELIEF_GLOW_DURATION = 1200; // ms (CSSアニメーションと同期)

function setReliefGlow(slotIndex) {
    reliefGlowTimers[slotIndex] = Date.now();
    // 即座にDOMにも反映（updateInfoを待たない場合のため）
    const slotEl = el(`relief-slot-${slotIndex}`);
    if (slotEl) {
        slotEl.classList.remove("trigger-glow");
        void slotEl.offsetWidth;
        slotEl.classList.add("trigger-glow");
    }
}

function isReliefGlowing(slotIndex) {
    return (Date.now() - reliefGlowTimers[slotIndex]) < RELIEF_GLOW_DURATION;
}

function setupStage(sel, continueMode, startFloor = 1) {
    stage = sel;
    floor = startFloor;
    isProcessing = false;
    extraBossTurnCount = 0;
    currentTurn = 1;
    stageStartTurn = totalGameTurns;
    player.reliefResurrectUsed = false; // ★リセット

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

    // ★追加: 石版のMaxHP加算を適用
    const hpBonus = getReliefStaticValue("hp_max");
    player.maxHp = PLAYER_INITIAL_STATS.maxHp + hpBonus;
    player.hp = Math.min(player.hp, player.maxHp);

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
        if (!player.equippedReliefs) { player.equippedReliefs = savedData.equippedReliefs ? [...savedData.equippedReliefs] : [null, null, null]; }
        currentTurn = 0; turnInputs = []; currentInput = ""; isJustFinish = false; weakHitCount = 0;

        updateScoreDisplay();

        el("flash-overlay").className = "";
        const container = el("game-container");
        container.classList.remove("shake-heavy", "shake-medium", "shake-small", "boss-mode");
        el("boss-label").style.display = "none";

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

async function winBattle() {
    if (player.hp <= 0) return;

    addLog(`${enemy.name} を倒した`, "system");
    el("enemy-img").style.display = "none";

    // ★追加: 敵撃破時レリーフトリガー (腐敗の石版など)
    await checkReliefTriggers("onEnemyKill");

    if (isJustFinish) {
        player.maxHp += 10;
        player.hp = Math.min(player.hp + 10, player.maxHp);
        playSE("se-heal");
        addLog(`★JUST FINISH! MaxHP+10 & HP+10`, "heal");
        updateInfo();
        setTimeout(() => {
            showDialog("JUST FINISH BONUS!!", `見事！ピッタリで倒した！<br>最大HPが ${player.maxHp} にアップ！<br>HPも10回復した。`, "clear", [{ text: "OK", action: nextFloorDecision }], 3000);
        }, 800);
    } else {
        setTimeout(nextFloorDecision, 800);
    }
}

function nextFloorDecision() {
    nextStep();
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

// checkDrop, openChest, addInventory deleted

// checkDrop, openChest, addInventory deleted



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

    // 3. ドロー演出 (await可能にラップ)
    if (floor === 1 && player.hand.length === 0) {
        await new Promise(resolve => {
            let dCount = 0;
            const drawLoop = setInterval(() => {
                executeDrawWithAnim();
                dCount++;
                if (dCount >= 3) {
                    clearInterval(drawLoop);
                    resolve();
                }
            }, 250);
        });
    } else {
        await new Promise(resolve => {
            setTimeout(() => {
                executeDrawWithAnim();
                resolve();
            }, 200);
        });
    }

    // 4. ★ターン開始時レリーフトリガー (ドロー完了後に発動)
    await checkReliefTriggers("onTurnStart");
}

// Updated: processEnemyTurn (v7.1 - Multi-turn Sequence Support)
async function processEnemyTurn() {

    // ★追加: 敵がかけた「round」ステートを経過させる
    tickStates("ENEMY", "round");

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

        // 既に1投投げているのに、拘束フラグがある場合はガード
        if (isBound && turnInputs.length > 0) return;

        // ★履歴に追加 & UI更新 (BT/Debug共通)
        turnInputs.push(score);
        updateScoreDisplay();

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

        // --- Weak Point Redesign (v4.0) ---
        let weakHit = false;
        if (score >= 51 && enemy.data.weak && (score % enemy.data.weak === 0)) {
            weakHit = true;
            weakHitCount++;
            singleDmg *= 2; // Damage doubled!
            addLog(`WEAK HIT!! Damage x2!`, "log-weak");
            playSE("se-weak");
            triggerShatterEffect();
        }

        enemy.hp = Math.max(0, enemy.hp - singleDmg);
        totalScore += score;
        totalDarts++;

        // 演出
        triggerEffect(el("game-screen"), singleDmg, false);
        el("enemy-hp-value").innerText = enemy.hp;
        displayEnemyHP = enemy.hp;

        // ★追加: drain_global (儀式の石版: ダーツ投擲にもドレイン適用)
        if (singleDmg > 0) {
            const drainRate = getReliefStaticValue("drain_global");
            if (drainRate > 0) {
                const drainHeal = Math.floor(singleDmg * drainRate);
                if (drainHeal > 0) {
                    player.hp = Math.min(player.maxHp, player.hp + drainHeal);
                    addLog(`${drainHeal} 吸収！`, "log-heal");
                    triggerEffect(el("game-screen"), drainHeal, true, true);
                }
            }
        }

        updateInfo();

        // ★追加: 攻撃命中時レリーフトリガー (猛毒/魅惑/箱の石版など)
        if (singleDmg > 0) {
            await checkReliefTriggers("onAttackHit");
            if (enemy.hp <= 0) {
                isProcessing = true;
                totalGameTurns++;
                setTimeout(winBattle, TIMING.WIN_DELAY_LONG);
                return;
            }
        }

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
            isProcessing = true; // ★修正: 連投防止
            setTimeout(finishPlayerTurn, TIMING.TURN_END_DELAY);
        } else if (turnInputs.length >= 3) {
            // 通常の3投終了
            isProcessing = true; // ★修正: 連投防止
            setTimeout(finishPlayerTurn, TIMING.TURN_END_DELAY);
        }
    } catch (error) {
        console.error("Battle Error (processOneThrow):", error);
        addLog(">> エラーが発生しました: " + error.message, "log-system");
        isProcessing = false;
        turnInputs = [];
        currentInput = "";
        updateScoreDisplay();
        preparePlayerTurn();
    }
}

// プレイヤーターン終了処理
async function finishPlayerTurn() {
    // --- Round Result Bonus Check ---
    const totalRoundScore = turnInputs.reduce((a, b) => a + b, 0);
    const isHatTrick = turnInputs.length === 3 && turnInputs.every(s => s === 50);

    let bonusType = null;
    if (isHatTrick) {
        bonusType = "HAT_TRICK";
        // Log removed as per request
    } else if (totalRoundScore >= 151) {
        bonusType = "HIGH_TON";
        // Log removed as per request
    } else if (totalRoundScore >= 100) {
        bonusType = "LOW_TON";
        // Log removed as per request
    }

    if (bonusType) {
        // Wait for the cut-in effect to finish
        await showRoundBonus(bonusType);
    }
    // --------------------------------

    // ★追加: ラウンド終了時トリガー (ワームドレイク、ラヴァゴーレムなど)
    await checkReliefTriggers("onRoundEnd");
    // トリガー効果で敵が死んだ場合、敵ターンには行かない
    if (enemy.hp <= 0) {
        setTimeout(winBattle, 500);
        return;
    }

    totalGameTurns++;
    turnInputs = [];
    currentInput = "";
    updateScoreDisplay();

    setTimeout(processEnemyTurn, TIMING.ENEMY_TURN_DELAY);
}


// =========================================
// 4. ENEMY AI & TRAP (敵ターン・罠)
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
// 5. DAMAGE CALCULATION (ダメージ計算)
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

// Updated: 攻撃ロジック (レリーフ補正を追加)
function applyOffenseLogic(basePower, sourceObj, applyRandom = true) {
    let multBonus = sourceObj.states.filter(s => STATE_MASTER[s.id]?.category === "atk_mult").reduce((sum, s) => sum + s.val, 0);
    let addBonus = sourceObj.states.filter(s => STATE_MASTER[s.id]?.category === "atk_add").reduce((sum, s) => sum + s.val, 0);

    // プレイヤーの攻撃時のみレリーフ補正を計算
    if (sourceObj === player) {
        // 1. 基本加算
        addBonus += getReliefStaticValue("atk_add");

        // 2. 条件付き加算
        if (turnInputs.length === 1) addBonus += getReliefStaticValue("atk_add_first"); // 1投目
        if (turnInputs.length === 2) addBonus += getReliefStaticValue("atk_add_second"); // 2投目

        // シングルヒット判定 (1-20点の時)
        if (basePower > 0 && basePower <= 20) addBonus += getReliefStaticValue("atk_add_single");

        // 三姉妹: 3投目かつ1,2投目とスコアが同じなら
        if (turnInputs.length === 3 && turnInputs[0] === turnInputs[1] && turnInputs[1] === basePower) {
            addBonus += getReliefStaticValue("atk_add_triple_same");
        }

        // オシリス: 手札1枚につき
        addBonus += (player.hand.length * getReliefStaticValue("atk_add_per_hand"));

        // ギルガース: MP1につき
        addBonus += (player.mp * getReliefStaticValue("atk_add_per_mp"));

        // ヒューマノイドドレイク: 自身にバフがある場合
        if (hasState(player, "atk_mult") || hasState(player, "atk_add")) {
            addBonus += getReliefStaticValue("atk_add_if_buffed");
        }

        // 3. 条件付き加算(HP) 
        // キングレックス: HP50%以下なら与ダメ+20
        if ((player.hp / player.maxHp) <= 0.5) {
            addBonus += getReliefStaticValue("atk_add_low_hp");
        }
    }

    let finalDmg = (basePower + addBonus) * (1.0 + multBonus);
    if (applyRandom) finalDmg *= (0.9 + Math.random() * 0.2);
    return Math.floor(finalDmg);
}

// Updated: 防御ロジック (v9.0 - Relief Full Support)
function applyDefenseLogic(dmg, targetObj, isDarts = false) {
    if (!targetObj || !targetObj.states) return dmg;
    let finalDmg = dmg;

    // 攻撃者（プレイヤー）のレリーフによる貫通性能をチェック
    let barrierIgnore = 0;
    let armorIgnore = 0;
    if (!isDarts) { // 敵がダメージを受ける時 (executorはplayer)
        barrierIgnore = getReliefStaticValue("pierce_barrier");
        armorIgnore = getReliefStaticValue("pierce_fixed");
    }

    // 1. 結界 (Barrier)
    let barrierVal = targetObj.states.filter(s => STATE_MASTER[s.id]?.category === "barrier").reduce((max, s) => Math.max(max, s.val), 0);
    if (targetObj === player) barrierVal = Math.max(barrierVal, getReliefStaticValue("barrier"));

    // 貫通を適用
    barrierVal = Math.max(0, barrierVal - barrierIgnore);

    if (barrierVal > 0 && finalDmg < barrierVal) {
        if (!isDarts) addLog("結界が攻撃を遮断！", "log-enemy");
        return 0;
    }

    // 2. 倍率防御
    let dmgMult = targetObj.states.filter(s => STATE_MASTER[s.id]?.category === "dmg_mult").reduce((prod, s) => prod * s.val, 1.0);
    if (targetObj === player) dmgMult *= (getReliefStaticValue("dmg_mult") || 1.0);

    finalDmg *= dmgMult;

    // 3. 固定減算
    let dmgSub = targetObj.states.filter(s => STATE_MASTER[s.id]?.category === "dmg_sub").reduce((sum, s) => sum + s.val, 0);
    if (targetObj === player) {
        dmgSub += getReliefStaticValue("dmg_sub");
        // ヘルポエマー: 敵のATKを直接下げる（プレイヤーの被ダメを減らす）
        dmgSub += Math.abs(getReliefStaticValue("enemy_atk_flat"));
    }

    // アーマー貫通を適用
    dmgSub = Math.max(0, dmgSub - armorIgnore);

    return Math.max(0, Math.floor(finalDmg - dmgSub));
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

        // 汎用スケーリング解決 (v7.5)
        let scaledVal = action.val;
        if (action.scale) {
            const factor = action.scale.factor || 1.0;
            switch (action.scale.source) {
                case "hand": scaledVal = player.hand.length * factor; break;
                case "mp": scaledVal = player.mp * factor; break;
                case "enemy_atk": scaledVal = enemy.atk * factor; break;
                case "player_hp_loss": scaledVal = (player.maxHp - player.hp) * factor; break;
                case "current_hp_percent": scaledVal = Math.floor(targetObj.hp * (factor / 100)); break;
            }
        }

        switch (action.type) {
            case "DAMAGE":
                const count = action.count || 1;
                for (let i = 0; i < count; i++) {
                    if (!isPlayerTarget && enemy.hp <= 0) return;

                    let dmg = 0;
                    if (action.mode === "fixed") {
                        dmg = action.val;
                    } else if (action.mode === "loss_hp") {
                        // 痛み分け: 減少HP分
                        dmg = (executorIsPlayer ? player.maxHp - player.hp : enemy.maxHp - enemy.hp);
                    } else if (action.mode === "current_hp_percent") {
                        // フォース: 現在HPの割合
                        dmg = Math.floor(targetObj.hp * (action.val / 100));
                    } else if (action.scale) {
                        // スケーリング（破壊輪など）: 固定ダメージ扱い
                        dmg = scaledVal;
                    } else {
                        const source = isPlayerTarget ? enemy : player;
                        const baseAtk = isPlayerTarget ? enemy.atk : 10;
                        const mult = action.mult || action.val || 1.0;
                        dmg = applyOffenseLogic(baseAtk * mult, source, !executorIsPlayer);
                    }

                    dmg = applyDefenseLogic(dmg, targetObj, false);

                    if (isPlayerTarget && dmg > 0) {
                        // ★追加: 被弾時レリーフトリガー (千眼の石版: 10%無効化)
                        const defTriggerResult = await checkReliefDefenseTrigger(dmg);
                        if (defTriggerResult === 0) {
                            dmg = 0; // 無効化された
                        } else {
                            dmg = await triggerTrap('attack', dmg);
                            if (enemy.hp <= 0) { isProcessing = false; return; }
                        }
                    }

                    if (dmg > 0) {
                        targetObj.hp = Math.max(0, targetObj.hp - dmg);

                        // 1. フラッシュ演出 (flash-xxx)
                        const animClass = effectiveVisual.anim;
                        if (animClass && animClass.startsWith("flash-")) {
                            const flashEl = el("flash-overlay");
                            flashEl.className = animClass;
                            setTimeout(() => flashEl.className = "", TIMING.FLASH_DURATION || 300);
                        } else if (action.mode === "fixed" && dmg > 50) {
                            // ボス必殺技の標準フラッシュ
                            el("flash-overlay").className = "flash-fire";
                            setTimeout(() => el("flash-overlay").className = "", 600);
                        }

                        // 2. 画面振動演出 (shake-xxx)
                        if (animClass && animClass.startsWith("shake-")) {
                            const container = el("game-container");
                            container.classList.add(animClass);
                            setTimeout(() => container.classList.remove(animClass), TIMING.SHAKE_DURATION || 500);
                        }

                        playSE(effectiveVisual.se || (isPlayerTarget ? "se-hit" : "se-attack"));
                        triggerEffect(el("game-screen"), dmg, isPlayerTarget);

                        // ★追加: drain_global (儀式の石版: 全攻撃5%ドレイン)
                        const drainRate = (!isPlayerTarget && executorIsPlayer) ? getReliefStaticValue("drain_global") : 0;
                        if (action.drain || drainRate > 0) {
                            await wait(TIMING.DRAIN_DELAY);
                            const drainMult = action.drain ? 1.0 : drainRate;
                            const heal = Math.floor(dmg * drainMult);
                            const attacker = isPlayerTarget ? enemy : player;
                            attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
                            addLog(`${heal} 吸収！`, action.drain ? "log-skill" : "log-heal");
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
                    const changeVal = scaledVal || action.val || 0; // scaledVal優先
                    if (changeVal < 0) {
                        await animateMPLoss(changeVal);
                    } else if (changeVal > 0) {
                        await animateMPGain(changeVal);
                    }
                }
                break;

            case "HEAL":
                let hVal = (action.val === "FULL" || action.val > 500) ? (targetObj.maxHp - targetObj.hp) : action.val;
                // ★ ラーの翼神竜: 回復量2倍
                if (targetObj === player) {
                    const healMult = getReliefStaticValue("heal_multiplier") || 1.0;
                    hVal = Math.floor(hVal * healMult);
                }
                targetObj.hp = Math.min(targetObj.maxHp, targetObj.hp + hVal);
                triggerEffect(el("game-screen"), hVal, isPlayerTarget, true);
                break;

            case "STATE":
                const stateVal = (action.scale) ? scaledVal : (action.val || 0);
                const stateTurn = (action.turn !== undefined) ? action.turn : 1;

                // ★修正: ユニークステート管理 (上書き / turn:0 で削除)
                if (stateTurn === 0) {
                    // 削除 (Dispel)
                    targetObj.states = targetObj.states.filter(s => s.id !== action.kind);
                } else {
                    // 上書き or 追加
                    const existingIdx = targetObj.states.findIndex(s => s.id === action.kind);
                    const newState = {
                        id: action.kind,
                        turn: stateTurn,
                        val: stateVal,
                        caster: executorIsPlayer ? "PLAYER" : "ENEMY"
                    };

                    if (existingIdx >= 0) {
                        targetObj.states[existingIdx] = newState;
                    } else {
                        targetObj.states.push(newState);
                    }
                }

                // 演出だけは共通で実行
                playSE(effectiveVisual.se || "se-buff");
                if (effectiveVisual.msg) addLog(effectiveVisual.msg, "log-skill");
                break;

            case "DRAW":
                const drawCount = scaledVal || action.val; // scaledVal優先
                for (let j = 0; j < drawCount; j++) {
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

            case "FREE_THROW":
                // スロー回数を1回分「なかったこと」にする
                if (turnInputs.length > 0) {
                    turnInputs.pop();
                    totalDarts--; // 統計も戻す
                    addLog("スロー回数が回復した！", "log-item");
                }
                break;

            case "RESURRECT":
                // 死に際にHPを1にする（本実装は死亡判定箇所で行うが、アトムとしても定義）
                player.hp = action.val;
                addLog("石版の力で踏みとどまった！", "log-heal");
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
// 6. CARD & ITEM (カード・アイテム)
// =========================================
// useItem deleted



// Updated: カード使用ロジック (v4.0 Async化)
async function playHandCard(index) {
    try {
        if (isProcessing || isInterval) return;
        if (turnInputs.length > 0) {
            addLog(">> 投擲中はカードを使えません！", "log-system");
            return;
        }
        if (hasState(player, "item_lock")) {
            playSE("se-warning");
            addLog(`>> カード封印中！`, "log-system");
            return;
        }

        const cardId = player.hand[index];
        const card = CARD_DB.find(c => c.id === cardId);
        let cost = (card.cost !== undefined) ? card.cost : 99;

        // ★追加: サギーの石版 (マジックカードのコスト軽減)
        if (card.type === "MAGIC") {
            const reduction = getReliefStaticValue("cost_down_magic"); // 最低1
            const reductionZero = getReliefStaticValue("cost_down_magic_zero"); // 最低0

            if (reductionZero > 0) {
                cost = Math.max(0, cost - reductionZero);
            } else if (reduction > 0) {
                cost = Math.max(1, cost - reduction);
            }
        }

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
// 7. INPUT & DEBUG (入力・デバッグ)
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

            // turnInputs.push(val); // processOneThrow内で追加するように変更 (v5.9.1)
            processOneThrow(val);
            currentInput = "";
            updateScoreDisplay();
        }
    }
}

// =========================================
// 8. RELIEF SYSTEM (レリーフシステム)
// =========================================

// --- 装備中のレリーフから特定のSTATIC効果の合計値を取得するヘルパー ---
function getReliefStaticValue(category) {
    // player.equippedReliefs が未定義なら 0 を返す
    if (!player.equippedReliefs) return 0;

    return player.equippedReliefs.reduce((sum, rId) => {
        // rId が null (空き枠) または DBに存在しない場合はスキップ
        if (!rId || !RELIEF_DB[rId]) return sum;

        const passive = RELIEF_DB[rId].passives.find(p => p.type === "STATIC" && p.category === category);
        return sum + (passive ? passive.val : 0);
    }, 0);
}

// Updated: レリーフのトリガーアクションを実行する共通関数 (v9.0)
async function checkReliefTriggers(triggerType) {
    if (!player.equippedReliefs) return;

    for (let i = 0; i < 3; i++) {
        const rId = player.equippedReliefs[i];
        if (!rId || !RELIEF_DB[rId]) continue;

        const passive = RELIEF_DB[rId].passives.find(p => p.trigger === triggerType);
        if (passive) {
            // 条件判定 (condition属性がある場合)
            if (passive.condition === "score_lte_60") {
                const roundTotal = turnInputs.reduce((a, b) => a + b, 0);
                if (roundTotal > 60) continue;
            }

            // 確率判定
            if (passive.chance && Math.random() > passive.chance) continue;

            // 視覚演出: スロットを発光させる
            setReliefGlow(i);

            addLog(`【石版発動】${RELIEF_DB[rId].name}`, "log-skill");

            // アトミック・エンジンを利用して効果を実行
            for (const action of passive.actions) {
                await resolveAction(action, true, { se: "se-buff" });
            }
            await wait(400);
        }
    }
}

// ★追加: onDefense トリガー (千眼の石版: 被弾時に確率で無効化)
// NEGATEアクションの有無でダメージ値を操作するため、checkReliefTriggersとは別関数
async function checkReliefDefenseTrigger(incomingDmg) {
    if (!player.equippedReliefs) return incomingDmg;

    for (let i = 0; i < 3; i++) {
        const rId = player.equippedReliefs[i];
        if (!rId || !RELIEF_DB[rId]) continue;

        const passive = RELIEF_DB[rId].passives.find(p => p.trigger === "onDefense");
        if (!passive) continue;

        // 確率判定
        if (passive.chance && Math.random() > passive.chance) continue;

        // 視覚演出: スロットを発光させる
        setReliefGlow(i);

        addLog(`【石版発動】${RELIEF_DB[rId].name}`, "log-skill");

        // NEGATEアクションがあればダメージを0にする
        for (const action of passive.actions) {
            if (action.type === "NEGATE") {
                addLog("攻撃を無効化！", "log-skill");
                playSE("se-buff");
                return 0;
            }
            await resolveAction(action, true, { se: "se-buff" });
        }
    }
    return incomingDmg;
}