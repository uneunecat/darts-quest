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
        tickStates(player, "throw");
        tickStates(enemy, "throw");

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
            // 拘束ステートを強制削除
            player.states = player.states.filter(s => STATE_MASTER[s.id].category !== "action_lock");
            addLog("拘束解除", "log-system");
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
// Updated: 条件判定エンジン (v4.1)
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
        case "e_state": // ★追加: 敵自身の状態チェック
            const obj = (c.src === "p_state") ? player : enemy;
            // 指定された tag (カテゴリ名) を持っているかチェック
            // 持っていればその「残りターン/回数」を取得、なければ 0
            const state = obj.states.find(s => STATE_MASTER[s.id]?.category === c.tag);
            targetVal = state ? state.turn : 0;
            break;
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
// NEW: ATOMIC SKILL ENGINE (v3.0 - Async & Simplified Wait)
// =========================================


// Updated: 余韻時間を一律1秒(1000ms)に短縮
function getCalculatedWait(skill) {
    if (skill.visual && skill.visual.wait) return skill.visual.wait;
    // 名前がある技のみ、状況確認のため少しだけ(200ms)足す
    return skill.name ? TIMING.SKILL_AFTERGLOW_NAMED : TIMING.SKILL_AFTERGLOW;
}
// Updated: ステートの持続時間を進める共通関数 (v5.0)
// timingFilter: "throw" (1投ごと) または "round" (敵ターン終了ごと)
function tickStates(obj, timingFilter) {
    if (!obj.states || obj.states.length === 0) return;

    // 1. 指定されたタイミングのステートのカウントを減らす
    obj.states.forEach(s => {
        const master = STATE_MASTER[s.id];
        if (master && master.timing === timingFilter) {
            s.turn--;
        }
    });

    // 2. カウントが0になったステートを削除する前に、ログを出す（任意）
    obj.states.forEach(s => {
        if (s.turn === 0) {
            const master = STATE_MASTER[s.id];
            if (master && master.label) {
                addLog(`【効果終了】${master.label}`, "log-system");
            }
        }
    });

    // 3. 0以下になったものを配列から取り除く
    obj.states = obj.states.filter(s => s.turn > 0);
}

// ヘルパー: 特定のステートを持っているかチェックする
function hasState(obj, category) {
    return obj.states.some(s => STATE_MASTER[s.id]?.category === category);
}

// Updated: processEnemyTurn (v7.1 - Multi-turn Sequence Support)
async function processEnemyTurn() {
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
                if (targetObj.hp <= 0) {
                    if (!isPlayerTarget) setTimeout(winBattle, TIMING.WIN_DELAY_SHORT);
                    return;
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
            const turn = action.turn || 1;
            const val = action.val || 0;
            const stateId = action.kind;

            // エンジンは stateId の意味を知らなくていい。ただ積むだけ。
            targetObj.states.push({
                id: stateId,
                turn: turn,
                val: val
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

// Updated: endEnemyTurn (v4.3 - Universal Ticking)
function endEnemyTurn() {

    tickStates(enemy, "round");
    tickStates(player, "round");

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
