// =========================================
// DARTS QUEST - main.js (v3.1.0 Clean & Just Finish Fix)
// =========================================

// --- [SECTION 1] GLOBAL STATE (状態定義) ---
let gameConfig = { bgmVolume: 0.3, sysVolume: 0.5, atkVolume: 0.8 };
let currentBgmId = "";
let bluetoothDevice = null;
let bluetoothServer = null;

// プレイヤー状態
let player = {
    ...JSON.parse(JSON.stringify(PLAYER_INITIAL_STATS)),
    state: {
        atkBuff: 1.0, atkFlat: 0, atkDuration: 0,
        guardTurn: 0, itemLock: false, restrictInput: false
    }, // Updated: hexSeal を削除
    deck: [], hand: [], discard: [], deckLocked: false, setCard: null
};

// 敵状態
let enemy = {
    hp: 100, maxHp: 100, data: null, name: "",
    state: {
        charge: false, isStunned: false,
        atkBuff: 0, atkBuffTurn: 0,
        guardTurn: 0, guardType: null, guardValue: 0,
        barrierTurn: 0, barrierLimit: 0,
        patternQueue: [], actionCount: 0
    }
};

// 進行管理フラグ
let stage = 1, floor = 1, currentTurn = 1, totalGameTurns = 0;
let totalScore = 0, totalDarts = 0, stageStartTurn = 0;
let displayPlayerHP = 100, displayEnemyHP = 100;
let isProcessing = false, waitingForChest = false, isJustFinish = false;
let turnInputs = [], currentInput = "", dropGuaranteed = false, weakHitCount = 0;
let pendingEffectsQueue = []; 
let clearedStagesLog = [];

// セーブデータ関連
let allSaveData = { "slot1": null, "slot2": null, "slot3": null, "lastPlayed": 1 };
let currentSlot = "slot1";
let savedData = { highScore: { stage: 1, floor: 1, avg: 0.0 }, history: [], clearedExtra: false, dp: 0, bestRanks: {}, unlockedStage4: false, deck: [], cards: {} };

// パック開封演出用
let isOpeningPack = false, openingPhase = 0, packResults = [], currentPackId = "", currentRevealIndex = 0, inputLockUntilRelease = false;

// --- [SECTION 2] CORE ENGINE (汎用計算エンジン) ---

// 汎用条件判定
function checkCondition(c) {
    if (!c) return true;
    let val = 0;
    switch (c.src) {
        case "e_hp": val = (enemy.hp / enemy.maxHp) * 100; break;
        case "p_hp": val = (player.hp / player.maxHp) * 100; break;
        case "p_mp": val = player.mp; break;
        case "hand": val = player.hand.length; break;
        case "turn": val = enemy.state.actionCount; break;
        case "turn_mod": return enemy.state.actionCount > 0 && (enemy.state.actionCount % c.val === 0);
        case "p_state": return player.state[c.tag] === c.val;
        case "trap": return !!player.setCard === c.val;
    }
    if (c.op === "lt") return val < c.val;
    if (c.op === "lte") return val <= c.val;
    if (c.op === "gt") return val > c.val;
    if (c.op === "gte") return val >= c.val;
    if (c.op === "eq") return Math.round(val) === c.val;
    return true;
}

// エフェクト解決エンジン
function resolveEffects(effects, context = {}) {
    if (!effects || effects.length === 0) return context;
    if (context.modifiedDmg === undefined) context.modifiedDmg = context.incomingDmg || 0;

    for (let i = 0; i < effects.length; i++) {
        const e = effects[i];
        if (e.cond && !checkCondition(e.cond)) continue;

        let rawMsg = "";
        switch (e.type) {
            case "DAMAGE":
                const target = e.target === "PLAYER" ? player : enemy;
                const targetEl = e.target === "PLAYER" ? el("player-panel") : el("enemy-panel");
                // Updated: ダメージ適用前にジャストフィニッシュ判定
                if (e.target !== "PLAYER" && enemy.hp > 0 && enemy.hp === e.value) isJustFinish = true;
                target.hp = Math.max(0, target.hp - e.value);
                triggerEffect(targetEl, e.value, e.target === "PLAYER");
                rawMsg = `${e.value}ダメージ！`;
                break;
            case "DAMAGE_MULT":
                context.modifiedDmg = Math.floor(context.modifiedDmg * e.value);
                break;
            case "HEAL":
                const healAmt = (e.value === "FULL") ? (player.maxHp - player.hp) : e.value;
                const oldHp = player.hp;
                player.hp = Math.min(player.hp + healAmt, player.maxHp);
                triggerEffect(el("player-panel"), healAmt, true, true);
                animateValue(el("player-hp"), oldHp, player.hp, 500);
                rawMsg = (e.value === "FULL") ? "HP完全回復！" : `HP ${healAmt} 回復！`;
                break;
            case "DRAW":
                for (let j = 0; j < e.value; j++) drawCard();
                rawMsg = `${e.value}枚ドロー！`;
                break;
            case "STATE_P":
                Object.assign(player.state, e.state);
                if (e.msg) rawMsg = e.msg;
                break;
            case "STATE_E":
                Object.assign(enemy.state, e.state);
                if (e.stun) enemy.state.isStunned = true;
                if (e.msg) rawMsg = e.msg;
                break;
            case "DISCARD_ALL":
                while (player.hand.length > 0) player.discard.push(player.hand.pop());
                rawMsg = "全手札を捨てた！";
                break;
            case "DISCARD_SELECT":
                pendingEffectsQueue = effects.slice(i + 1);
                openDiscardSelector(e.count);
                return context; 
            case "NEGATE":
                context.modifiedDmg = 0;
                rawMsg = "攻撃を無効化！";
                break;
            case "REFLECT":
                const reflectDmg = context.incomingDmg || 0;
                if (enemy.hp > 0 && enemy.hp === reflectDmg) isJustFinish = true; // 反射でも判定
                enemy.hp = Math.max(0, enemy.hp - reflectDmg);
                triggerEffect(el("enemy-panel"), reflectDmg, false);
                rawMsg = `${reflectDmg}ダメージ反射！`;
                break;
            case "SPECIAL_SALVAGE":
                rawMsg = executeSalvageMagic();
                break;
        }
        if (rawMsg) addLog(rawMsg, "log-skill");
    }
    if (enemy.hp <= 0) { isProcessing = true; setTimeout(winBattle, 800); }
    updateInfo();
    return context;
}

function executeSalvageMagic() {
    const magics = player.discard.filter(did => {
        const c = CARD_DB.find(cd => cd.id === did);
        return c && c.type === "MAGIC";
    });
    if (magics.length > 0) {
        const salvId = magics[Math.floor(Math.random() * magics.length)];
        player.discard.splice(player.discard.indexOf(salvId), 1);
        player.hand.push(salvId);
        return `墓地から「${CARD_DB.find(c => c.id === salvId).name}」を回収！`;
    }
    return "墓地に魔法がない…";
}

// --- [SECTION 3] BATTLE FLOW (戦闘メインループ) ---

function processOneThrow(score) {
    if (enemy.hp <= 0 || player.hp <= 0 || isProcessing) return;
    if (player.state.restrictInput && turnInputs.length > 0) return;

    let singleDmg = score;

    // 1. 敵防御判定
    if (enemy.state.barrierTurn > 0 && singleDmg < enemy.state.barrierLimit) {
        singleDmg = 0; addLog(`結界！(${enemy.state.barrierLimit}未満無効)`, "log-enemy");
    }
    if (singleDmg > 0 && enemy.state.guardTurn > 0) {
        if (enemy.state.guardType === 'ratio') singleDmg = Math.floor(singleDmg * enemy.state.guardValue);
        else if (enemy.state.guardType === 'fixed') singleDmg = Math.max(0, singleDmg - enemy.state.guardValue);
    }

    // 2. プレイヤー攻撃バフ
    if (player.state.atkDuration > 0) {
        singleDmg = Math.floor((singleDmg + player.state.atkFlat) * player.state.atkBuff);
        player.state.atkDuration--;
        if (player.state.atkDuration <= 0) {
            player.state.atkBuff = 1.0; player.state.atkFlat = 0;
            addLog("攻撃バフの効果が切れた", "log-system");
        }
    }

    // 3. 状態異常解除・ダメージ適用
    const wasRestricted = player.state.restrictInput;
    if (player.state.restrictInput) { player.state.restrictInput = false; addLog("拘束が解けた！", "log-system"); }

    // Updated: ジャストフィニッシュ判定
    if (singleDmg > 0 && enemy.hp === singleDmg) isJustFinish = true;

    let weakHit = (score >= 51 && enemy.data.weak && (score % enemy.data.weak === 0));
    enemy.hp = Math.max(0, enemy.hp - singleDmg);
    totalScore += score; totalDarts++; turnInputs.push(score);
    updateScoreDisplay();

    if (weakHit) { dropGuaranteed = true; weakHitCount++; addLog(`WEAK HIT!!`, "log-weak"); playSE("se-weak"); }

    triggerEffect(el("enemy-panel"), singleDmg, false);
    animateValue(el("enemy-hp-value"), displayEnemyHP, enemy.hp, 300);
    displayEnemyHP = enemy.hp;
    updateInfo();

    if (enemy.hp <= 0) { isProcessing = true; totalGameTurns++; setTimeout(winBattle, 1000); return; }

    // 4. ターン終了判定
    if (turnInputs.length >= 3 || (wasRestricted && turnInputs.length >= 1)) {
        setTimeout(finishPlayerTurn, 1000);
    }
}

function enemyTurn() {
    if (enemy.state.isStunned) {
        addLog(`${enemy.name}はスタン中`, "log-system");
        enemy.state.isStunned = false; endEnemyTurn(); return;
    }

    enemy.state.actionCount++;
    let selectedAction = null;

    if (enemy.state.patternQueue && enemy.state.patternQueue.length > 0) {
        selectedAction = enemy.state.patternQueue.shift();
    } else {
        const aiList = enemy.data.ai || [{ id: "attack", weight: 1 }];
        const validActions = aiList.filter(a => {
            if (!checkCondition(a.cond)) return false;
            if (a.type === "BUFF_E" && a.state) {
                if (a.state.atkBuff && enemy.state.atkBuffTurn > 0) return false;
                if (a.state.guardTurn && enemy.state.guardTurn > 0) return false;
                if (a.state.barrierTurn && enemy.state.barrierTurn > 0) return false;
            }
            return true;
        });

        const guaranteedAction = validActions.find(a => a.guaranteed);
        if (guaranteedAction) {
            if (guaranteedAction.sequence) {
                enemy.state.patternQueue = [...guaranteedAction.sequence];
                selectedAction = enemy.state.patternQueue.shift();
            } else { selectedAction = guaranteedAction; }
        } else {
            const totalWeight = validActions.reduce((sum, a) => sum + (a.weight || 1), 0);
            let r = Math.random() * totalWeight;
            for (const a of validActions) {
                const w = a.weight || 1;
                if (r < w) {
                    if (a.sequence) {
                        enemy.state.patternQueue = [...a.sequence];
                        selectedAction = enemy.state.patternQueue.shift();
                    } else { selectedAction = a; }
                    break;
                }
                r -= w;
            }
        }
    }

    if (!selectedAction || selectedAction.id === "attack") {
        doEnemyAttack(1.0);
    } else {
        if (selectedAction.name) showSkillCutin(selectedAction.name, selectedAction.color || "fire");
        setTimeout(() => executeEnemySkill(selectedAction), 1200);
    }
}

function executeEnemySkill(skill, isPreemptive = false) {
    enemy.state.charge = false;
    switch (skill.type) {
        case "HEAL":
            const healVal = skill.value > 100 ? (enemy.maxHp - enemy.hp) : skill.value;
            enemy.hp = Math.min(enemy.maxHp, enemy.hp + healVal);
            addLog(`${enemy.name}は ${healVal} 回復した`, "log-heal");
            animateValue(el("enemy-hp-value"), displayEnemyHP, enemy.hp, 500);
            displayEnemyHP = enemy.hp;
            if (!isPreemptive) endEnemyTurn();
            break;
        case "BUFF_E":
            Object.assign(enemy.state, skill.state);
            if (skill.msg) addLog(skill.msg, "log-enemy");
            if (!isPreemptive) endEnemyTurn();
            break;
        case "STATE_P":
            if (skill.state.restrictInput) player.state.restrictInput = true;
            Object.assign(player.state, skill.state);
            if (skill.msg) addLog(skill.msg, "log-enemy");
            if (!isPreemptive) doEnemyAttack(1.0);
            break;
        case "MP_DAMAGE":
            player.mp = Math.max(0, player.mp - skill.value);
            addLog(`${skill.name}！プレイヤーのMPを ${skill.value} 減らした`, "log-enemy");
            doEnemyAttack(skill.mult || 1.0, { fixedDmg: skill.fixedDmg, isBossUlt: skill.isBossUlt });
            break;
        case "MP_DRAIN":
            const dVal = Math.min(player.mp, skill.value);
            player.mp -= dVal; enemy.hp = Math.min(enemy.maxHp, enemy.hp + skill.heal);
            addLog(`MPを ${dVal} 吸収！敵が ${skill.heal} 回復`, "log-enemy");
            doEnemyAttack(1.0);
            break;
        case "ATTACK":
            doEnemyAttack(skill.mult || 1.0, { fixedDmg: skill.fixedDmg, isBossUlt: skill.isBossUlt });
            break;
        case "MULTI_ATTACK":
            let count = 0;
            const loop = () => {
                count++;
                doEnemyAttack(skill.mult, { callback: () => {
                    if (count < skill.count) setTimeout(loop, 600);
                    else endEnemyTurn();
                }});
            };
            loop();
            break;
        case "DRAIN":
            doEnemyAttack(skill.mult, { isDrain: true });
            break;
        case "CHARGE":
            enemy.state.charge = true;
            addLog(`${enemy.name}は力を溜めている…`, "log-enemy");
            endEnemyTurn();
            break;
    }
    updateInfo();
}

function doEnemyAttack(mult, options = {}) {
    const { isDrain = false, isBossUlt = false, fixedDmg = 0, callback = null } = options;
    enemy.state.charge = false;

    let currentMult = mult + (enemy.state.atkBuffTurn > 0 ? enemy.state.atkBuff : 0);
    let baseDmg = fixedDmg > 0 ? Math.floor(fixedDmg * currentMult) : Math.floor((2 + floor + (stage - 1) * 3 + Math.floor(Math.random() * 6)) * currentMult);
    
    let finalDmg = triggerTrap('attack', baseDmg);
    if (finalDmg === 0) { updateInfo(); if (callback) callback(); else endEnemyTurn(); return; }
    
    if (player.state.guardTurn > 0) { finalDmg = Math.floor(finalDmg * 0.5); addLog("護封剣！ダメージ半減", "log-skill"); }
    
    if (isBossUlt) { playSE("se-boom"); el("flash-overlay").className = "flash-fire"; setTimeout(() => el("flash-overlay").className = "", 600); }
    else playSE("se-hit");

    const oldHp = player.hp;
    player.hp = Math.max(0, player.hp - finalDmg);
    triggerEffect(el("game-screen"), finalDmg, true);
    animateValue(el("player-hp"), oldHp, player.hp, 500);
    displayPlayerHP = player.hp;

    if (player.hp <= 0) { isProcessing = true; updateInfo(); setTimeout(loseGame, 1000); return; }
    if (isDrain && finalDmg > 0) {
        const heal = Math.floor(finalDmg * 0.5); enemy.hp = Math.min(enemy.maxHp, enemy.hp + heal);
        addLog(`敵が ${heal} 回復！`, "log-skill"); triggerEffect(el("enemy-panel"), heal, false, true);
        animateValue(el("enemy-hp-value"), displayEnemyHP, enemy.hp, 500); displayEnemyHP = enemy.hp;
    }
    updateInfo();
    if (callback) callback(); else endEnemyTurn();
}

function finishPlayerTurn() {
    totalGameTurns++;
    turnInputs = []; currentInput = "";
    updateScoreDisplay();
    setTimeout(enemyTurn, 500);
}

function endEnemyTurn() {
    if (enemy.state.atkBuffTurn > 0) { enemy.state.atkBuffTurn--; if (enemy.state.atkBuffTurn === 0) enemy.state.atkBuff = 0; }
    if (enemy.state.guardTurn > 0) { enemy.state.guardTurn--; if (enemy.state.guardTurn === 0) { enemy.state.guardType = null; enemy.state.guardValue = 0; } }
    if (enemy.state.barrierTurn > 0) { enemy.state.barrierTurn--; if (enemy.state.barrierTurn === 0) enemy.state.barrierLimit = 0; }
    
    if (player.state.guardTurn > 0) { player.state.guardTurn--; if (player.state.guardTurn === 0) addLog("護封剣 消滅", "log-system"); }
    if (player.state.itemLock) { player.state.itemLock = false; addLog("アイテム封印解除", "log-system"); }
    // Updated: hexSeal 関連の古いロジックを削除

    currentTurn++;
    player.mp = Math.min(player.mp + 3, player.maxMp);
    triggerFloatText("MP+3", el("player-mp-bar"));
    drawCard(); updateInfo(); isProcessing = false;
}

function winBattle() {
    if (player.hp <= 0) return;
    addLog(`${enemy.name} を倒した`, "system");
    player.mp = Math.min(player.mp + 3, player.maxMp);
    drawCard();
    if (isJustFinish) {
        player.maxHp += 10; player.hp = Math.min(player.hp + 10, player.maxHp);
        playSE("se-heal"); addLog(`★JUST FINISH! MaxHP+10 & HP+10`, "heal");
        updateInfo();
        setTimeout(() => showDialog("JUST FINISH BONUS!!", `最大HPが ${player.maxHp} にアップ！`, "clear", [{ text: "OK", action: checkDrop }], 3000), 800);
    } else setTimeout(checkDrop, 800);
}

function loseGame() {
    isProcessing = true; playBGM("bgm-lose");
    showDialog("YOU DIED", "力尽きました...", "warning", [{ text: "RETURN TO TITLE", action: returnToTitle }]);
}

// --- [SECTION 4] STAGE & SYSTEM (進行管理) ---

function initGameSession(startStage, continueMode = false) {
    if (!continueMode) {
        player = { ...JSON.parse(JSON.stringify(PLAYER_INITIAL_STATS)), state: { atkBuff: 1.0, atkFlat: 0, atkDuration: 0, guardTurn: 0, itemLock: false, restrictInput: false }, deck: [], hand: [], discard: [], deckLocked: false, setCard: null };
        totalGameTurns = 0; totalScore = 0; totalDarts = 0; clearedStagesLog = [];
    }
    startTransition(startStage, continueMode);
}

function startTransition(sel, continueMode) {
    const info = STAGE_MASTER[sel] || { title: "UNKNOWN", sub: "Unknown Stage", warning: false };
    el("chapter-title").innerText = info.title; el("chapter-sub").innerText = info.sub;
    const ch = el("chapter-screen");
    if (info.warning) { playSE("se-warning"); ch.classList.add("chapter-extra"); }
    else { playSE("se-tap"); ch.classList.remove("chapter-extra"); }
    
    el("black-curtain").classList.add("fade-in");
    setTimeout(() => {
        el("title-screen").style.display = "none"; ch.style.display = "flex"; ch.style.opacity = 1;
        setupStage(sel, continueMode);
        setTimeout(() => {
            ch.style.opacity = 0;
            setTimeout(() => { ch.style.display = "none"; el("black-curtain").classList.remove("fade-in"); handlePreemptiveAI(); }, 1000);
        }, info.warning ? 4000 : 2500);
    }, 1000);
}

function setupStage(sel, continueMode) {
    stage = sel; floor = 1; isProcessing = false; currentTurn = 1; stageStartTurn = totalGameTurns;
    if (!continueMode) totalDarts = 0;
    el("battle-log").innerHTML = ""; el("game-screen").style.display = "block";
    
    if (!continueMode) {
        player.mp = 3;
        if (!savedData.deck || savedData.deck.length < DECK_SIZE) {
            player.deckLocked = true; player.deck = []; player.hand = [];
        } else {
            player.deck = shuffleArray([...savedData.deck]);
            for (let i = 0; i < INITIAL_HAND; i++) drawCard(true);
        }
    }
    spawnEnemy(); resizeGame();
}

function spawnEnemy() {
    if (player.hp <= 0) return;
    try {
        enemy.state = { charge: false, isStunned: false, atkBuff: 0, atkBuffTurn: 0, guardTurn: 0, guardType: null, guardValue: 0, barrierTurn: 0, barrierLimit: 0, patternQueue: [], actionCount: 0 };
        currentTurn = 1; turnInputs = []; currentInput = ""; isJustFinish = false; waitingForChest = false; dropGuaranteed = false; weakHitCount = 0;
        updateScoreDisplay();
        el("boss-label").style.display = "none"; el("enemy-img").style.display = "block"; el("chest-img").style.display = "none";
        
        let bgKey = stage;
        if (stage === 4) bgKey = floor >= 5 ? "4_2" : "4_1";
        if (GAME_DATA.bg[bgKey]) el("game-container").style.backgroundImage = `url('${GAME_DATA.bg[bgKey]}')`;
        
        let list = GAME_DATA.enemies[stage] || GAME_DATA.enemies[1];
        enemy.data = list[(floor - 1) % list.length];
        enemy.maxHp = enemy.data.hp || (100 + (stage - 1) * 50 + (floor - 1) * 30);
        
        if (floor === 5 || (stage === 4 && floor === 6)) {
            el("game-container").classList.add("boss-mode"); el("boss-label").style.display = "inline"; playBGM("bgm-boss");
        } else playBGM("bgm-battle");
        
        enemy.name = enemy.data.name; el("enemy-img").src = enemy.data.img;
        enemy.hp = enemy.maxHp; displayEnemyHP = enemy.hp;
        triggerTrap('summon'); updateInfo();
    } catch (e) { console.error(e); }
}

function handlePreemptiveAI() {
    const aiList = enemy.data.ai || [];
    const preemptiveAction = aiList.find(a => a.preemptive && checkCondition(a.cond));
    if (preemptiveAction) {
        setTimeout(() => {
            if (preemptiveAction.name) showSkillCutin(preemptiveAction.name, preemptiveAction.color || "gold");
            setTimeout(() => executeEnemySkill(preemptiveAction, true), 1200);
        }, 500);
    }
}

function loadGameData() {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) { try { allSaveData = JSON.parse(saved); } catch (e) { console.error(e); } }
}
function saveToDrive() { allSaveData[currentSlot] = savedData; localStorage.setItem(SAVE_KEY, JSON.stringify(allSaveData)); }

function selectSlot(n) {
    currentSlot = "slot" + n;
    if (!allSaveData[currentSlot]) allSaveData[currentSlot] = JSON.parse(JSON.stringify(savedData));
    savedData = allSaveData[currentSlot];
    updateTitleScore(); playSE("se-tap"); playBGM("bgm-title");
    el("slot-screen").style.display = "none"; el("title-screen").style.display = "flex";
}
function backToSlots() { stopAllBGM(); el("title-screen").style.display = "none"; el("slot-screen").style.display = "flex"; initSlotScreen(); }

// --- [SECTION 5] UI & VISUALS (画面表示・演出) ---

function updateInfo() {
    if (!enemy.data) return;
    el("stage-display").innerText = stage === 5 ? "EXTRA" : `STAGE ${stage}`;
    el("floor-display").innerText = stage === 5 ? "FINAL" : `${floor}F`;
    el("turn-display").innerHTML = `TURN ${currentTurn}`;
    el("enemy-name-side").innerText = enemy.name;
    el("enemy-hp-value").innerText = enemy.hp;
    el("weak-display").innerHTML = `WEAK: ${enemy.data.weak}+`;

    let eChips = "";
    if (enemy.state.charge) eChips += `<span class="status-chip chip-charge">⚡CHARGE</span>`;
    if (enemy.state.isStunned) eChips += `<span class="status-chip chip-stun">😵STUN</span>`;
    if (enemy.state.atkBuffTurn > 0) eChips += `<span class="status-chip chip-buff">⚔️ATK UP(${enemy.state.atkBuffTurn})</span>`;
    if (enemy.state.guardTurn > 0) eChips += `<span class="status-chip chip-guard">🛡️${enemy.state.guardType==='ratio'?'GUARD':'ARMOR'}(${enemy.state.guardTurn})</span>`;
    if (enemy.state.barrierTurn > 0) eChips += `<span class="status-chip chip-barrier">💠BARRIER(${enemy.state.barrierTurn})</span>`;
    el("enemy-states-side").innerHTML = eChips;

    const hpPct = (player.hp / player.maxHp) * 100;
    el("player-hp-bar").style.width = hpPct + "%";
    el("player-hp").innerText = `${player.hp}/${player.maxHp}`;
    
    let mpDots = "";
    for (let i = 0; i < player.maxMp; i++) mpDots += `<span class="mp-dot ${i < player.mp ? 'active' : ''}"></span>`;
    el("player-mp-dots").innerHTML = mpDots;

    let pChips = "";
    if (player.state.atkDuration > 0) {
        const isBuff = player.state.atkBuff > 1.0 || player.state.atkFlat > 0;
        pChips += `<span class="status-chip ${isBuff?'chip-buff':'chip-lock'}">⚔️ATK(${player.state.atkBuff}x/${player.state.atkDuration}D)</span>`;
    }
    if (player.state.guardTurn > 0) pChips += `<span class="status-chip chip-guard">🛡️SHIELD(${player.state.guardTurn})</span>`;
    if (player.state.itemLock) pChips += `<span class="status-chip chip-lock">🔒ITEM LOCK</span>`;
    if (player.state.restrictInput) pChips += `<span class="status-chip chip-stun">⛓️BIND</span>`;
    el("player-states-side").innerHTML = pChips;

    el("avg-display").innerText = totalDarts > 0 ? ((totalScore / totalDarts) * 3).toFixed(1) : "0.0";
    el("btn-potion").innerHTML = `💊x${player.items.potion}`;
    el("btn-ether").innerHTML = `⚗️x${player.items.ether}`;
    el("btn-seed").innerHTML = `🌱x${player.items.seed}`;
    renderHand();
}

function renderHand() {
    const area = el("hand-area"); area.innerHTML = "";
    el("hand-count-display").innerText = player.hand.length;
    el("battle-deck-count").innerText = player.deck.length;
    player.hand.forEach((id, idx) => {
        const card = CARD_DB.find(c => c.id === id);
        const div = createCardElement(card, "battle");
        if (player.mp < card.cost || player.state.itemLock || turnInputs.length > 0) div.classList.add("disabled");
        div.onclick = () => playHandCard(idx);
        area.appendChild(div);
    });
    const trapArea = el("trap-slot-container"); trapArea.innerHTML = "";
    if (player.setCard) {
        const c = CARD_DB.find(cd => cd.id === player.setCard);
        trapArea.appendChild(createCardElement(c, "battle"));
    } else trapArea.innerHTML = '<div id="trap-slot" class="trap-slot empty">SET<br>TRAP</div>';
}

function updateScoreDisplay() {
    [1, 2, 3].forEach(i => {
        const val = i - 1 < turnInputs.length ? turnInputs[i-1] : (i - 1 === turnInputs.length ? currentInput : "--");
        const side = el(`slot-${i}-side`);
        if (side) { side.innerText = val; side.className = `score-val ${i-1<turnInputs.length?'filled':(i-1===turnInputs.length?'active':'')}`; }
    });
}

function showDialog(title, text, type = "normal", buttons = [{ text: "OK", action: null }]) {
    el("modal-title").innerText = title; el("modal-text").innerHTML = text;
    const btnGroup = el("modal-buttons"); btnGroup.innerHTML = "";
    buttons.forEach(b => {
        const btn = document.createElement("button"); btn.className = "modal-btn"; btn.innerText = b.text;
        btn.onclick = () => { playSE("se-tap"); el("game-modal").style.display = "none"; if (b.action) b.action(); };
        btnGroup.appendChild(btn);
    });
    el("game-modal").style.display = "flex";
}

function triggerEffect(target, dmg, isPlayer, isHeal = false) {
    if (!isHeal && dmg > 0) {
        const container = el("game-container");
        container.classList.add(dmg > 50 ? "shake-heavy" : "shake-small");
        setTimeout(() => container.classList.remove("shake-heavy", "shake-small"), 500);
    }
    const pop = document.createElement("div");
    pop.className = `damage-float ${isHeal?'heal':''} ${!isPlayer && !isHeal?'enemy-dmg':''}`;
    pop.innerText = dmg === 0 ? "MISS" : dmg;
    el("game-screen").appendChild(pop);
    setTimeout(() => pop.remove(), 1500);
}

function triggerFloatText(text, target) {
    const f = document.createElement("div"); f.className = "float-text-box"; f.innerText = text;
    const r = target.getBoundingClientRect(); f.style.left = `${r.left + r.width/2}px`; f.style.top = `${r.top}px`;
    document.body.appendChild(f); setTimeout(() => f.remove(), 1500);
}

function announce(text, type) {
    const ann = el("battle-announcer"); ann.innerHTML = text; ann.className = "announcer-visible " + (type === "log-enemy" ? "ann-danger" : "ann-warn");
    setTimeout(() => ann.className = "", 2000);
}
function addLog(text, type) { if (type && type.includes("log")) announce(text, type); }

function showSkillCutin(name, type) {
    playSE("se-warning"); el("cutin-text-val").innerText = name;
    const c = el("skill-cutin"); c.className = "cutin-" + type; c.style.display = "flex";
    setTimeout(() => c.style.display = "none", 1500);
}

function openCardShop() {
    const list = el("pack-list"); list.innerHTML = "";
    el("shop-dp-display").innerText = savedData.dp;
    PACK_DATA.forEach(p => {
        if (savedData.bestRanks[p.unlockStage]) {
            const div = document.createElement("div"); div.className = "pack-item";
            div.innerHTML = `<div class="pack-img-container"><img src="${p.img}"></div><div class="pack-name">${p.name}</div><button class="pack-buy-btn" ${savedData.dp>=p.price?'':'disabled'} onclick="buyPack('${p.id}')">${p.price} DP</button>`;
            list.appendChild(div);
        }
    });
    el("card-shop-modal").style.display = "flex";
}

function openCollection() { renderDeckEditor(); el("collection-modal").style.display = "flex"; }
function renderDeckEditor() {
    const dGrid = el("deck-grid"); dGrid.innerHTML = "";
    for (let i = 0; i < DECK_SIZE; i++) {
        const id = savedData.deck[i];
        if (id) {
            const c = CARD_DB.find(x => x.id === id);
            const div = createCardElement(c, "small");
            div.onclick = () => { savedData.deck.splice(i, 1); saveToDrive(); renderDeckEditor(); };
            dGrid.appendChild(div);
        } else dGrid.innerHTML += '<div class="std-card small empty-slot"></div>';
    }
    const cGrid = el("card-grid"); cGrid.innerHTML = "";
    CARD_DB.forEach(c => {
        const count = savedData.cards[c.id] || 0;
        const inDeck = savedData.deck.filter(x => x === c.id).length;
        const div = createCardElement(c, "standard", count - inDeck);
        div.onclick = () => { if (count > inDeck && savedData.deck.length < DECK_SIZE) { savedData.deck.push(c.id); saveToDrive(); renderDeckEditor(); } };
        cGrid.appendChild(div);
    });
}

function createCardElement(card, mode, count) {
    const div = document.createElement("div");
    div.className = `std-card ${mode} rarity-${card.rarity}`;
    div.innerHTML = `<div class="std-art"><img src="assets/cards/${card.id}.png"><div class="std-cost">${card.cost}</div>${count!==undefined?`<div class="std-count">x${count}</div>`:''}</div><div class="std-text-area ${card.type==='TRAP'?'bg-trap':'bg-magic'}"><div class="std-name">${card.name}</div><div class="std-desc">${card.desc}</div></div>`;
    return div;
}

function showHistory() {
    const list = el("history-list"); list.innerHTML = "";
    savedData.history.forEach(h => {
        list.innerHTML += `<div class="history-row ${h.result.includes('WIN')?'win':'lose'}"><div>${h.date}</div><div>${h.stgName}</div><div>${h.result}</div><div>+${h.dp}DP</div></div>`;
    });
    el("history-modal").style.display = "flex";
}

// --- [SECTION 6] INPUT & UTILITY (入力・便利関数) ---

function handleBluetoothNotify(event) {
    if (el("game-screen").style.display === "none" || isProcessing) return;
    const val = event.target.value;
    if (val.byteLength > 2) {
        const scoreData = DL_SCORE_MAP[val.getUint8(2)];
        if (scoreData && scoreData !== "CHANGE") {
            const [s, type] = scoreData;
            playSE(type === 4 ? "se-dbull" : (type === 3 ? "se-bull" : (type === 2 ? "se-triple" : (type === 1 ? "se-double" : "se-single"))));
            processOneThrow(s);
        }
    }
}

async function connectToBoard() {
    try {
        const device = await navigator.bluetooth.requestDevice({ filters: [{ namePrefix: 'DARTSLIVE' }], optionalServices: [DL_SERVICE_UUID] });
        const server = await device.gatt.connect();
        const service = await server.getPrimaryService(DL_SERVICE_UUID);
        const char = await service.getCharacteristic(DL_NOTIFY_UUID);
        await char.startNotifications();
        char.addEventListener('characteristicvaluechanged', handleBluetoothNotify);
        el("bt-connect-btn").innerText = "📡 CONNECTED"; el("bt-connect-btn").classList.add("connected");
    } catch (e) { alert(e); }
}

function resizeGame() {
    const s = el('game-scaler');
    const scale = Math.min(window.innerWidth / 900, window.innerHeight / 620) * 0.95;
    if (window.innerWidth >= 900) { s.style.transform = `scale(${scale})`; s.style.width = "900px"; s.style.height = "620px"; }
    else { s.style.transform = "none"; s.style.width = "100%"; s.style.height = "auto"; }
}

function shuffleArray(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function calculateRating(ppr) { const e = RATING_TABLE.find(r => ppr >= r.ppr); return e ? e.rt : 1; }
function animateValue(obj, start, end, duration) { if (obj) obj.innerHTML = end; }

window.addEventListener('resize', resizeGame);
window.addEventListener('load', () => { loadGameData(); initSlotScreen(); resizeGame(); });
window.addEventListener('keydown', e => {
    if (isProcessing) return;
    if (e.key >= '0' && e.key <= '9') { currentInput += e.key; updateScoreDisplay(); }
    if (e.key === 'Backspace') { currentInput = currentInput.slice(0, -1); updateScoreDisplay(); }
    if (e.key === 'Enter') handleEnter();
});
function handleEnter() { if (currentInput !== "") { processOneThrow(parseInt(currentInput)); currentInput = ""; updateScoreDisplay(); } }