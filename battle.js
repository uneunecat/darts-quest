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
