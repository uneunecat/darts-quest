console.log("★ logic.js is loaded!");

// --- Global Variables (Logic) ---
let player = { 
    hp: 100, maxHp: 100, mp: 3, maxMp: 10,
    items: { potion: 0, ether: 0, seed: 0 }, 
    state: { power: false, shield: false, weakLock: false, nextShotMult: 1.0 }, // nextShotMult追加
    deck: [], hand: [], discard: [], deckLocked: false
};

let enemy = { hp: 100, maxHp: 100, data: null, name: "", state: { charge: false, guard: false, guardType: null, guardTurn: 0, atkBuff: 0, isStunned: false } };
let stage=1; floor=1; totalScore=0; totalDarts=0; currentDarts=3;
let isProcessing=false; extraBossTurnCount=0; currentTurn=1;
let dropGuaranteed = false; weakHitCount = 0; let restrictInput = false;
let turnInputs = []; let currentInput = ""; let isJustFinish = false; let waitingForChest = false;
let cheatBuffer = ""; 
let stageStartTurn = 0; let totalGameTurns = 0; let clearedStagesLog = [];

// --- SAVE / LOAD SYSTEM ---
let allSaveData = { "slot1": null, "slot2": null, "slot3": null, "lastPlayed": 1 };
const SAVE_KEY = "darts_quest_save";
let currentSlot = "slot1";
let savedData = { highScore: { stage: 1, floor: 1, avg: 0.0 }, history: [], clearedExtra: false, dp: 0, bestRanks: { 1: null, 2: null, 3: null, 4: null, 5: null }, unlockedStage4: false, deck: [], cards: {} };

function loadGameData() {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) { try { allSaveData = JSON.parse(saved); } catch(e) { console.error(e); } }
    if(!allSaveData.slot1) allSaveData.slot1 = null;
    if(!allSaveData.slot2) allSaveData.slot2 = null;
    if(!allSaveData.slot3) allSaveData.slot3 = null;
}
loadGameData();

function saveToDrive() { 
    allSaveData[currentSlot] = savedData; 
    localStorage.setItem(SAVE_KEY, JSON.stringify(allSaveData));
}

// --- RATING & RANK ---
function calculateRating(ppr) { if(ppr < 30) return 1; if(ppr < 40) return 2; if(ppr < 45) return 3; if(ppr < 50) return 4; if(ppr < 55) return 5; if(ppr < 60) return 6; if(ppr < 65) return 7; if(ppr < 70) return 8; if(ppr < 75) return 9; if(ppr < 80) return 10; if(ppr < 85) return 11; if(ppr < 90) return 12; if(ppr < 95) return 13; if(ppr < 100) return 14; if(ppr < 110) return 15; if(ppr < 120) return 16; if(ppr < 130) return 17; return 18; }

function calculateStageRank(stg, turns) {
    if (stg === 5) { if (turns <= 15) return ["SSS", 1000]; if (turns <= 20) return ["S", 600]; if (turns <= 35) return ["A", 300]; if (turns <= 50) return ["B", 100]; return ["C", 50]; }
    else if (stg === 4) { if (turns <= 20) return ["SSS", 1000]; if (turns <= 28) return ["S", 600]; if (turns <= 40) return ["A", 300]; if (turns <= 50) return ["B", 100]; return ["C", 50]; }
    else { if (turns <= 12) return ["SSS", 1000]; if (turns <= 16) return ["S", 600]; if (turns <= 22) return ["A", 300]; if (turns <= 30) return ["B", 100]; return ["C", 50]; }
}

// --- BATTLE LOGIC ---
function calculatePlayerDamage(score, p, e) {
    let dmg = score;
    // 突進の効果適用
    if (p.state.nextShotMult > 1.0) {
        dmg = Math.floor(dmg * p.state.nextShotMult);
        p.state.nextShotMult = 1.0; // 消費
        addLog(`>> 突進効果！ダメージ倍増 (${dmg})`, "log-skill");
    }

    if (stage === 4 && floor === 4 && currentTurn % 3 === 0) { dmg = Math.max(0, dmg - 50); }
    if (e.state.guardType === 'cut') { dmg = Math.floor(dmg * 0.8); addLog("護封剣で20%軽減！", "system"); } // プレイヤーが使うと敵が軽減はおかしいが、元コード準拠
    if (p.state.power) { dmg = Math.floor(dmg * 1.5); p.state.power = false; }
    if (e.state.guard) { dmg = Math.floor(dmg / 2); e.state.guard = false; addLog("敵の防御で半減！", "system"); }
    return dmg;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function drawShopCard(packId) {
    const rand = Math.random() * 100;
    let targetRarity = "N";
    if (rand < 2) targetRarity = "UR";
    else if (rand < 10) targetRarity = "SR";
    else if (rand < 40) targetRarity = "R";
    const pool = CARD_DB.filter(c => c.rarity === targetRarity);
    if (pool.length === 0) return CARD_DB[0];
    return pool[Math.floor(Math.random() * pool.length)];
}

// --- CARD EFFECTS (Ver 2.2 Logic) ---
function applyCardEffect(card) {
    let msg = `Card: [${card.name}] `;
    
    if (card.id === 101) { // 死者蘇生
        player.hp = player.maxHp;
        msg += "HP完全回復！";
        playSE("se-heal");
    } else if (card.id === 201) { // サンダーボルト
        const dmg = 100;
        enemy.hp = Math.max(0, enemy.hp - dmg);
        enemy.state.isStunned = true; // スタン追加
        msg += `100ダメ & スタン！`;
        playSE("se-boom");
        triggerEffect(document.getElementById("enemy-panel"), dmg, false);
    } else if (card.id === 202) { // 強欲な壺
        player.mp = Math.min(player.mp + 5, player.maxMp);
        msg += "MP+5 チャージ！";
    } else if (card.id === 301) { // 光の護封剣
        // 敵の攻撃力を下げるのではなく、プレイヤーに防御バフをつける処理にするのが自然だが
        // 既存ロジック「guardType='cut'」を利用
        enemy.state.guardType = 'player_cut'; // 識別用
        enemy.state.guardTurn = 3;
        msg += "3ターン被ダメ半減！";
    } else if (card.id === 302) { // 落とし穴
        if (enemy.state.charge) {
            enemy.state.charge = false;
            enemy.state.isStunned = true;
            msg += "チャージ解除 & スタン！";
            playSE("se-boom");
        } else {
            msg += "(不発…敵はチャージしていない)";
        }
    } else if (card.id === 303) { // 聖なるバリア
        player.state.shield = true;
        const dmg = 50;
        enemy.hp = Math.max(0, enemy.hp - dmg);
        msg += `完全防御 & 50反撃！`;
        triggerEffect(document.getElementById("enemy-panel"), dmg, false);
    } else if (card.id === 401) { // 火の粉
        const dmg = 20;
        enemy.hp = Math.max(0, enemy.hp - dmg);
        msg += `20ダメージ`;
        triggerEffect(document.getElementById("enemy-panel"), dmg, false);
    } else if (card.id === 402) { // 治療の神
        player.hp = Math.min(player.hp + 50, player.maxHp);
        msg += "HP50回復";
        playSE("se-heal");
    } else if (card.id === 403) { // はさみ撃ち
        const dmg = 80;
        const selfDmg = 20;
        enemy.hp = Math.max(0, enemy.hp - dmg);
        player.hp = Math.max(0, player.hp - selfDmg);
        msg += `敵80ダメ / 自20ダメ`;
        triggerEffect(document.getElementById("enemy-panel"), dmg, false);
        triggerEffect(document.getElementById("player-panel"), selfDmg, true);
    } else if (card.id === 404) { // 大火事
        const dmg = 80;
        enemy.hp = Math.max(0, enemy.hp - dmg);
        msg += `80ダメージ！`;
        playSE("se-attack");
        triggerEffect(document.getElementById("enemy-panel"), dmg, false);
    } else if (card.id === 405) { // 突進
        player.state.nextShotMult = 2.0;
        msg += "次の一投ダメージ2倍！";
    }
    
    addLog(msg, "log-skill");
    animateValue(document.getElementById("enemy-hp"), displayEnemyHP, enemy.hp, 500); displayEnemyHP=enemy.hp;
    animateValue(document.getElementById("player-hp"), displayPlayerHP, player.hp, 500); displayPlayerHP=player.hp;

    if (enemy.hp <= 0) setTimeout(winBattle, 800);
}

// --- ENEMY AI (Ver 2.0: Boss Gimmicks) ---
function enemyTurn() {
    if(enemy.state.isStunned) { addLog(`>> ${enemy.name} は麻痺して動けない！`, "log-system"); enemy.state.isStunned = false; endEnemyTurn(); return; }

    // --- Boss Gimmicks ---
    // Stage 4: サクリファイス系 (手札破壊)
    if (stage === 4) {
        if (floor === 5) { // サクリファイス
            if (currentTurn % 4 === 0) {
                showSkillCutin("イーター", "earth");
                setTimeout(() => {
                    destroyHandCard(1); // 1枚破壊
                    addLog(">> [イーター] 手札を1枚食べられた！", "log-enemy");
                    doEnemyAttack(1.0, {isDrain: true});
                }, 1200);
                return;
            }
        }
        if (floor === 6) { // サウザンド・アイズ
            if (currentTurn % 3 === 0) {
                showSkillCutin("千眼の呪縛", "wind");
                setTimeout(() => {
                    destroyHandCard(2); // 2枚破壊
                    player.mp = Math.max(0, player.mp - 2);
                    addLog(">> [呪縛] 手札2枚破壊 & MP-2", "log-enemy");
                    doEnemyAttack(1.2);
                }, 1200);
                return;
            }
        }
    }

    // Stage 5: 真紅眼の黒竜
    if (stage === 5) {
        extraBossTurnCount++;
        if (extraBossTurnCount % 3 === 0) {
            showSkillCutin("黒 炎 弾", "fire");
            setTimeout(() => {
                let dmg = 80;
                if (enemy.hp < enemy.maxHp * 0.5) dmg = 120; // 憤激
                addLog(`>> [黒炎弾] 全体焼却 (${dmg}ダメ)`, "log-enemy");
                doEnemyAttack(0, {fixedDmg: dmg, isBossUlt: true});
            }, 1200);
            return;
        }
        // 通常攻撃 (HP半分以下で強化)
        let mult = 1.0;
        if (enemy.hp < enemy.maxHp * 0.5) mult = 1.5;
        doEnemyAttack(mult);
        return;
    }

    // --- Standard AI (Stage 1-3) ---
    // 既存のランダム行動ロジック (簡略化して維持)
    if(stage <= 3 && Math.random() < 0.2) {
        enemy.state.charge = true;
        addLog(`>> ${enemy.name} は力を溜めている…`, "log-enemy");
        updateInfo();
        endEnemyTurn();
        return;
    }
    if(enemy.state.charge) {
        enemy.state.charge = false;
        showSkillCutin("強攻撃", "fire");
        setTimeout(() => doEnemyAttack(2.5), 1000);
        return;
    }

    doEnemyAttack(1.0);
}

// Helper: 手札破壊
function destroyHandCard(count) {
    if (player.deckLocked) return;
    for (let i = 0; i < count; i++) {
        if (player.hand.length > 0) {
            const idx = Math.floor(Math.random() * player.hand.length);
            const lostCard = player.hand.splice(idx, 1)[0];
            player.discard.push(lostCard);
        }
    }
    updateInfo();
}

function doEnemyAttack(mult, options = {}) {
    const { ignoreShield = false, isDrain = false, isBossUlt = false, fixedDmg = 0, callback = null } = options;
    
    // ガード判定 (光の護封剣)
    let finalMult = mult;
    if (enemy.state.guardType === 'player_cut') {
        finalMult *= 0.5; // 半減
    }

    // シールド判定
    if (!ignoreShield && player.state.shield) { 
        addLog(`${enemy.name} の攻撃！ → 完全防御！`, "log-skill"); 
        player.state.shield=false; 
        triggerEffect(document.getElementById("player-panel"),0,true); 
        document.getElementById("flash-overlay").className="flash-blue"; 
        setTimeout(()=>document.getElementById("flash-overlay").className="",300); 
        updateInfo(); 
        if(callback) callback(); else endEnemyTurn(); 
        return; 
    }

    let dmg = 0;
    if (fixedDmg > 0) dmg = fixedDmg;
    else {
        const base = 10 + (stage * 5) + (floor * 2); // 基礎攻撃力
        dmg = Math.floor((base + Math.random()*5) * finalMult);
    }
    
    if (enemy.state.guardType === 'player_cut') {
        enemy.state.guardTurn--;
        if (enemy.state.guardTurn <= 0) enemy.state.guardType = null;
    }

    finishAttack(dmg, isDrain, callback);
}

function finishAttack(dmg, isDrain, callback) {
    player.hp = Math.max(0, player.hp-dmg); 
    addLog(`${enemy.name} の攻撃！ ${dmg} ダメージ`, "enemy");
    if(isDrain) { 
        const heal = Math.floor(dmg * 0.5); 
        if(heal > 0) { 
            enemy.hp = Math.min(enemy.hp + heal, enemy.maxHp); 
            addLog(`>> 敵が HP${heal} 吸収した！`, "log-enemy"); 
            animateValue(document.getElementById("enemy-hp"), displayEnemyHP, enemy.hp, 500); 
            displayEnemyHP=enemy.hp; 
        } 
    }
    triggerEffect(document.getElementById("player-panel"), dmg, true); 
    animateValue(document.getElementById("player-hp"), displayPlayerHP, player.hp, 500); 
    displayPlayerHP=player.hp; 
    updateInfo();
    
    if(player.hp<=0) setTimeout(loseBattle,1000); 
    else { if(callback) callback(); else endEnemyTurn(); }
}

function endEnemyTurn() { 
    currentTurn++; 
    player.mp = Math.min(player.mp + 3, player.maxMp); 
    updateInfo(); 
    isProcessing=false; 
}