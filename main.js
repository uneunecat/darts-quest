console.log("★ main.js is loaded! (v1.4 Based on v1.3)");

// --- HELPER FUNCTIONS ---
function calculateRating(ppr) { if(ppr < 30) return 1; if(ppr < 40) return 2; if(ppr < 45) return 3; if(ppr < 50) return 4; if(ppr < 55) return 5; if(ppr < 60) return 6; if(ppr < 65) return 7; if(ppr < 70) return 8; if(ppr < 75) return 9; if(ppr < 80) return 10; if(ppr < 85) return 11; if(ppr < 90) return 12; if(ppr < 95) return 13; if(ppr < 100) return 14; if(ppr < 110) return 15; if(ppr < 120) return 16; if(ppr < 130) return 17; return 18; }
function calculateStageRank(stg, turns) {
    if (stg === 5) { if (turns <= 15) return ["SSS", 1000]; if (turns <= 20) return ["S", 600]; if (turns <= 35) return ["A", 300]; if (turns <= 50) return ["B", 100]; return ["C", 50]; }
    else if (stg === 4) { if (turns <= 20) return ["SSS", 1000]; if (turns <= 28) return ["S", 600]; if (turns <= 40) return ["A", 300]; if (turns <= 50) return ["B", 100]; return ["C", 50]; }
    else { if (turns <= 12) return ["SSS", 1000]; if (turns <= 16) return ["S", 600]; if (turns <= 22) return ["A", 300]; if (turns <= 30) return ["B", 100]; return ["C", 50]; }
}
function getRankColor(r) { if(r==="SSS") return "#00ffff"; if(r==="S") return "#ffd700"; if(r==="A") return "#ff5555"; return "#fff"; }
function shuffleArray(array) { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; } return array; }

// --- GAME DATA ---
const GAME_DATA = {
    enemies: {
        1: [{ name: "プチモス", img: "assets/1-1.png", weak: 20 }, { name: "ラーバモス", img: "assets/1-2.png", weak: 19 }, { name: "進化の繭", img: "assets/1-3.png", weak: 18 }, { name: "グレート・モス", img: "assets/1-4.png", weak: 17 }, { name: "究極完全態・グレート・モス", img: "assets/1-5.png", weak: 20 }],
        2: [{ name: "トラコドン", img: "assets/2-1.png", weak: 19 }, { name: "ワイルド・ラプター", img: "assets/2-2.png", weak: 18 }, { name: "屍を貪る竜", img: "assets/2-3.png", weak: 17 }, { name: "二頭を持つキング・レックス", img: "assets/2-4.png", weak: 20 }, { name: "剣竜", img: "assets/2-5.png", weak: 19 }],
        3: [{ name: "デュナミス・ヴァルキリア", img: "assets/3-1.png", weak: 20 }, { name: "ハーピィ・レディ", img: "assets/3-2.png", weak: 19 }, { name: "ハーピィ・レディ・SB", img: "assets/3-3.png", weak: 18 }, { name: "ハーピィ・レディ三姉妹", img: "assets/3-4.png", weak: 17 }, { name: "ハーピィズペット竜", img: "assets/3-5.png", weak: 20 }],
        4: [{ name: "ダーク・ラビット", img: "assets/4-1.png", weak: 20 }, { name: "デビル・ボックス", img: "assets/4-2.png", weak: 19 }, { name: "トゥーン・デーモン", img: "assets/4-3.png", weak: 18 }, { name: "ブルーアイズ・トゥーン・ドラゴン", img: "assets/4-4.png", weak: 17 }, { name: "サクリファイス", img: "assets/4-5.png", weak: 20 }, { name: "サウザンド・アイズ・サクリファイス", img: "assets/4-6.png", weak: 20 }],
        5: [{ name: "真紅眼の黒竜", img: "assets/extra.png", weak: 20 }]
    },
    bg: { 1: "assets/bg_stage1.png", 2: "assets/bg_stage2.png", 3: "assets/bg_stage3.png", 4_1: "assets/bg_stage4_1.png", 4_2: "assets/bg_stage4_2.png", 5: "assets/bg_extra.png" }
};

// ★UPDATE: Card Balance (Ver 2.2)
const CARD_DB = [
    { id: 101, name: "死者蘇生", rarity: "UR", type: "MAGIC", cost: 8, desc: "HPを完全回復する" },
    { id: 201, name: "サンダー・ボルト", rarity: "SR", type: "MAGIC", cost: 6, desc: "敵に100ダメージ + スタン(1回休み)" },
    { id: 202, name: "強欲な壺", rarity: "SR", type: "MAGIC", cost: 0, desc: "MPを5回復する" },
    { id: 301, name: "光の護封剣", rarity: "R", type: "MAGIC", cost: 5, desc: "3ターンの間、受けるダメージを半減" },
    { id: 302, name: "落とし穴", rarity: "R", type: "TRAP", cost: 3, desc: "敵のチャージを解除しスタンさせる" },
    { id: 303, name: "聖なるバリア", rarity: "R", type: "TRAP", cost: 4, desc: "1ターン攻撃無効化 + 敵に50反撃" },
    { id: 401, name: "火の粉", rarity: "N", type: "MAGIC", cost: 1, desc: "敵に20ダメージ" },
    { id: 402, name: "治療の神", rarity: "N", type: "MAGIC", cost: 4, desc: "HPを50回復する" },
    { id: 403, name: "はさみ撃ち", rarity: "N", type: "TRAP", cost: 2, desc: "敵に80ダメージ、自分に20ダメージ" },
    { id: 404, name: "昼夜の大火事", rarity: "N", type: "MAGIC", cost: 3, desc: "敵に80ダメージ" },
    { id: 405, name: "突進", rarity: "N", type: "MAGIC", cost: 2, desc: "次の一投のダメージが2倍になる" }
];
const PACK_DATA = [ { id: "vol1", name: "Vol.1 - Legend", price: 1000, desc: "伝説の始まり。基本魔法カード収録。", unlockStage: 1, img: "assets/packs/vol1.png" } ];

// --- GLOBAL VARIABLES ---
let player = { hp: 100, maxHp: 100, mp: 3, maxMp: 10, items: { potion: 0, ether: 0, seed: 0 }, state: { power: false, shield: false, weakLock: false, nextShotMult: 1.0 }, deck: [], hand: [], discard: [], deckLocked: false };
let enemy = { hp: 100, maxHp: 100, data: null, name: "", state: { charge: false, guard: false, guardType: null, guardTurn: 0, atkBuff: 0, isStunned: false } };
let stage=1; floor=1; totalScore=0; totalDarts=0; currentDarts=3;
let displayPlayerHP=100; displayEnemyHP=100;
let isProcessing=false; extraBossTurnCount=0; currentTurn=1;
let dropGuaranteed = false; weakHitCount = 0; let restrictInput = false;
let turnInputs = []; let currentInput = ""; let isJustFinish = false; let waitingForChest = false;
let cheatBuffer = ""; 
let stageStartTurn = 0; let totalGameTurns = 0; let clearedStagesLog = [];

// --- DOM ELEMENTS ---
// (v1.3の定義を維持しつつ、不足していたら補う形)
const elContainer=document.getElementById("game-container"); const elTitle=document.getElementById("title-screen"); const elGame=document.getElementById("game-screen");
const elChapter=document.getElementById("chapter-screen"); const elChapTitle=document.getElementById("chapter-title"); const elChapSub=document.getElementById("chapter-sub");
const elStage=document.getElementById("stage-display"); const elFloor=document.getElementById("floor-display"); const elTurn=document.getElementById("turn-display");
const elBossLabel=document.getElementById("boss-label"); const elEnemyImg=document.getElementById("enemy-img"); const elEnemyName=document.getElementById("enemy-name");
const elWeak=document.getElementById("weak-display");
const elEnemyHP=document.getElementById("enemy-hp"); const elEnemyMaxHP=document.getElementById("enemy-max-hp"); const elEnemyHPBar=document.getElementById("enemy-hp-bar");
const elEnemyHPValue=document.getElementById("enemy-hp-value");
const elPlayerHP=document.getElementById("player-hp"); const elPlayerMaxHP=document.getElementById("player-max-hp"); const elPlayerHPBar=document.getElementById("player-hp-bar"); const elPlayerMP=document.getElementById("player-mp"); const elPlayerMPBar=document.getElementById("player-mp-bar");
const elAvg=document.getElementById("avg-display"); const elRt=document.getElementById("rt-display"); const elLog=document.getElementById("battle-log");
const elEnemyPanel=document.getElementById("enemy-panel"); const elPlayerPanel=document.getElementById("player-panel"); const elOverlay=document.getElementById("flash-overlay");
const btnD1=document.getElementById("btn-d1"); const btnD2=document.getElementById("btn-d2"); const btnD3=document.getElementById("btn-d3");
const btnPotion=document.getElementById("btn-potion"); const btnEther=document.getElementById("btn-ether"); const btnSeed=document.getElementById("btn-seed");
const elModal=document.getElementById("game-modal"); const elModalBox=document.getElementById("modal-box-inner"); const elModalTitle=document.getElementById("modal-title"); const elModalText=document.getElementById("modal-text"); const elModalBtn=document.getElementById("modal-btn"); const elModalBtns=document.getElementById("modal-buttons");
const elEnemyBuff=document.getElementById("enemy-buff-badge"); const elEnemyGuard=document.getElementById("enemy-guard-badge"); const elEnemyDrop=document.getElementById("enemy-drop-badge");
const elPlayerBuff=document.getElementById("player-buff-badge"); const elPlayerGuard=document.getElementById("player-guard-badge");
const elCutin=document.getElementById("skill-cutin"); const elCutinText=document.getElementById("cutin-text-val");
const elCurtain=document.getElementById("black-curtain"); const elChestImg=document.getElementById("chest-img");
const slots = [document.getElementById("slot-1"), document.getElementById("slot-2"), document.getElementById("slot-3")];
const audioElements = [document.getElementById("bgm-title"), document.getElementById("bgm-battle"), document.getElementById("bgm-boss"), document.getElementById("bgm-extra"), document.getElementById("bgm-win"), document.getElementById("bgm-lose")];

// --- CORE FUNCTIONS (From v1.3 + Fixes) ---
function resizeGame() {
    const scaler = document.getElementById('game-scaler');
    if(!scaler) return;
    const winW = window.innerWidth; const winH = window.innerHeight;
    const baseW = 900; const baseH = 620;
    const scale = Math.min(winW / baseW, winH / baseH) * 0.95;
    scaler.style.transform = `scale(${scale})`;
    // 中央寄せスタイルをJSで補完
    scaler.style.position = "absolute";
    scaler.style.top = "50%"; scaler.style.left = "50%";
    scaler.style.transform = `translate(-50%, -50%) scale(${scale})`;
}
window.addEventListener('resize', resizeGame); window.addEventListener('load', resizeGame); setTimeout(resizeGame, 100);

function loadGameData() {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) { try { allSaveData = JSON.parse(saved); } catch(e) { console.error(e); } }
    if(!allSaveData.slot1) allSaveData.slot1 = null;
    if(!allSaveData.slot2) allSaveData.slot2 = null;
    if(!allSaveData.slot3) allSaveData.slot3 = null;
}
loadGameData();

function saveToDrive() { allSaveData[currentSlot] = savedData; localStorage.setItem(SAVE_KEY, JSON.stringify(allSaveData)); }
function stopAllBGM() { audioElements.forEach(a => { if(a){a.pause(); a.currentTime=0;} }); currentBgmId = ""; }
function playBGM(id) { if(currentBgmId===id)return; stopAllBGM(); currentBgmId=id; const a=document.getElementById(id); if(a){a.volume=0.3; a.play().catch(e=>{});} }
function playSE(id) { const a=document.getElementById(id); if(a){a.currentTime=0; a.volume=0.5; a.play().catch(e=>{});} }

// --- UI / SCENE ---
function initSlotScreen() {
    for(let i=1; i<=3; i++) {
        const d = allSaveData["slot"+i]; const el = document.getElementById("info-"+i);
        if(!d) { el.innerHTML = "<div class='slot-empty'>NO DATA<br>- Start New Game -</div>"; }
        else {
            let stg = `STAGE ${d.highScore.stage} - ${d.highScore.floor}F`;
            if(d.highScore.stage === 5) stg = "EXTRA STAGE";
            let badge = d.clearedExtra ? "<br><span style='color:#f0f;'>★ EXTRA CLEARED</span>" : "";
            el.innerHTML = `<div>${stg}</div><div style='color:#ffdd00;'>Avg: ${d.highScore.avg.toFixed(1)} (Rt ${calculateRating(d.highScore.avg)})</div><div style='color:#aaa;font-size:12px;'>DP: ${d.dp}${badge}</div>`;
        }
    }
}
function selectSlot(n) {
    currentSlot = "slot"+n; 
    if(!allSaveData[currentSlot]) allSaveData[currentSlot] = { highScore: { stage: 1, floor: 1, avg: 0.0 }, history: [], clearedExtra: false, dp: 0, bestRanks: {}, unlockedStage4: false, deck: [], cards: {} };
    savedData = allSaveData[currentSlot];
    if(!savedData.deck) savedData.deck=[]; if(!savedData.cards) savedData.cards={};
    updateTitleScore(); playSE("se-tap");
    document.getElementById("slot-screen").style.display = "none"; document.getElementById("title-screen").style.display = "flex";
    playBGM("bgm-title");
}
function backToSlots() { stopAllBGM(); document.getElementById("title-screen").style.display="none"; document.getElementById("slot-screen").style.display="flex"; initSlotScreen(); }

function updateTitleScore() {
    let stg = `STAGE ${savedData.highScore.stage}`; if (savedData.highScore.stage === 5) stg = "EXTRA";
    document.getElementById("hs-reach").innerText = `${stg} - ${savedData.highScore.floor}F`;
    document.getElementById("hs-avg").innerText = savedData.highScore.avg.toFixed(1);
    document.getElementById("hs-rt").innerText = "Rt " + calculateRating(savedData.highScore.avg);
    document.getElementById("dp-display").innerText = "DP: " + savedData.dp;
    updateStageButton(1, "btn-st1"); updateStageButton(2, "btn-st2"); updateStageButton(3, "btn-st3");
    updateStageButton(4, "btn-stage4"); updateStageButton(5, "btn-extra");
    const canPlay4 = savedData.unlockedStage4 || (savedData.bestRanks && savedData.bestRanks[3]) || savedData.clearedExtra;
    document.getElementById("btn-stage4").style.display = canPlay4 ? "flex" : "none";
    document.getElementById("btn-extra").style.display = savedData.clearedExtra ? "flex" : "none";
}
function updateStageButton(stgNum, btnId) {
    const btn = document.getElementById(btnId); const rank = savedData.bestRanks ? savedData.bestRanks[stgNum] : null;
    const old = btn.querySelector(".rank-badge-s"); if(old) old.remove();
    btn.className = "stage-btn btn-default";
    if(btnId==="btn-stage4") btn.classList.add("stage4-btn"); if(btnId==="btn-extra") btn.classList.add("extra-btn");
    if(rank) {
        btn.classList.remove("btn-default", "stage4-btn", "extra-btn");
        if(rank === "SSS") btn.classList.add("btn-prism"); else if(rank === "S") btn.classList.add("btn-gold"); else if(rank === "A") btn.classList.add("btn-silver"); else btn.classList.add("btn-copper");
    }
}

// --- BATTLE ---
function initGameSession(s, cont=false) {
    if (!cont) { player.hp=100; player.maxHp=100; player.mp=3; player.items={potion:0,ether:0,seed:0}; totalGameTurns=0; totalScore=0; totalDarts=0; clearedStagesLog=[]; }
    let t=`STAGE ${s}`; if(s===5) t="燃えたぎる火口";
    elChapTitle.innerText=t; elChapSub.innerText=s===5?"Burning Crater":"";
    elChapter.classList.remove("chapter-extra"); if(s>=4) elChapter.classList.add("chapter-extra");
    playSE(s>=4?"se-warning":"se-tap");
    elTitle.style.display="none"; elChapter.style.display="flex"; elChapter.style.opacity=1;
    setTimeout(()=>{
        setupStage(s); 
        setTimeout(()=>{ elChapter.style.opacity=0; setTimeout(()=>{ elChapter.style.display="none"; checkOpeningSkill(); }, 1000); }, 2500);
    }, 1000);
}

function checkOpeningSkill() {
    // ヴァルキリアの先制行動 (v1.3では抜けていたが、仕様として追加)
    if (stage === 3 && floor === 1) { 
        showSkillCutin("光の護封剣", "wind");
        setTimeout(() => {
            enemy.state.guardType = 'cut'; enemy.state.guardTurn = 3;
            addLog(">> [先制] 光の護封剣！(3T被ダメ半減)", "log-enemy"); updateInfo();
        }, 1200);
    }
}

function setupStage(s) {
    stage=s; floor=1; isProcessing=false; extraBossTurnCount=0; currentTurn=1; stageStartTurn=totalGameTurns;
    elAvg.innerText="0.0"; elRt.innerText="(Rt -)"; elLog.innerHTML=""; elGame.style.display="block";
    spawnEnemy();
    player.state={power:false,shield:false,weakLock:false,nextShotMult:1.0}; player.mp=3;
    player.deckLocked=false;
    if(!savedData.deck || savedData.deck.length<12) { player.deckLocked=true; player.deck=[]; player.hand=[]; player.discard=[]; addLog("⚠ デッキ不完全: カード機能封鎖", "log-system"); }
    else { player.deck = shuffleArray([...savedData.deck]); player.hand=[]; player.discard=[]; for(let i=0;i<3;i++) drawCard(); }
    addLog(`STAGE ${stage} START!`, "system"); resizeGame();
}

function spawnEnemy() {
    enemy.state={charge:false,guard:false,guardType:null,guardTurn:0,atkBuff:0,isStunned:false};
    player.state={power:false,shield:false,weakLock:false,nextShotMult:1.0};
    currentTurn=1; turnInputs=[]; currentInput=""; restrictInput=false; updateScoreDisplay(); isJustFinish=false; waitingForChest=false; dropGuaranteed=false; weakHitCount=0;
    elContainer.className="container"; elEnemyPanel.className="left-panel"; elBossLabel.style.display="none"; elEnemyImg.style.display="block"; elChestImg.style.display="none";

    let bgKey=stage; if(stage===4) bgKey = floor>=5 ? "4_2" : "4_1";
    elContainer.style.backgroundImage = `url('${GAME_DATA.bg[bgKey]}')`;

    let isBoss=false;
    // ★UPDATE: Enemy HP Scaling (Ver 2.2)
    if(stage===5) {
        enemy.data=GAME_DATA.enemies[5][0]; isBoss=true;
        elContainer.classList.add("extra-mode"); elBossLabel.innerText="☠️EXTRA BOSS"; elBossLabel.style.display="inline";
        enemy.maxHp = 3000; playBGM("bgm-extra");
    } else if(stage===4) {
        enemy.data=GAME_DATA.enemies[4][floor-1];
        if(floor===5) { isBoss=true; enemy.maxHp=1000; elBossLabel.innerText="⚠️BOSS"; elBossLabel.style.display="inline"; playBGM("bgm-boss"); elContainer.classList.add("boss-mode"); }
        else if(floor===6) { isBoss=true; enemy.maxHp=1500; elBossLabel.innerText="☠️FINAL BOSS"; elBossLabel.style.display="inline"; playBGM("bgm-extra"); elContainer.classList.add("extra-mode"); }
        else { enemy.maxHp=250+(floor*50); playBGM("bgm-battle"); }
    } else {
        isBoss=(floor===5);
        let list=GAME_DATA.enemies[stage]; enemy.data=list[(floor-1)%list.length];
        enemy.maxHp = 100+((stage-1)*100) + (isBoss?200:0) + (floor*20);
        if(isBoss) { elBossLabel.innerText="⚠️BOSS"; elBossLabel.style.display="inline"; playBGM("bgm-boss"); elContainer.classList.add("boss-mode"); }
        else { playBGM("bgm-battle"); }
    }
    enemy.name=enemy.data.name; elEnemyImg.src=enemy.data.img; enemy.hp=enemy.maxHp; displayEnemyHP=enemy.hp; updateInfo();
}

// --- BATTLE LOGIC ---
function calculatePlayerDamage(score, p, e) {
    let dmg = score;
    if (p.state.nextShotMult > 1.0) { dmg = Math.floor(dmg * p.state.nextShotMult); p.state.nextShotMult = 1.0; addLog(`>> 突進効果！ダメージ倍増`, "log-skill"); }
    if (stage === 4 && floor === 4 && currentTurn % 3 === 0) { dmg = Math.max(0, dmg - 50); }
    if (e.state.guardType === 'cut') { dmg = Math.floor(dmg * 0.5); addLog("護封剣で半減！", "system"); } // v1.4: 20% -> 50%
    if (p.state.power) { dmg = Math.floor(dmg * 1.5); p.state.power = false; }
    if (e.state.guard) { dmg = Math.floor(dmg / 2); e.state.guard = false; addLog("敵の防御で半減！", "system"); }
    return dmg;
}

function executeAttack() {
    isProcessing = true; let totalScoreInTurn = 0; let weakHitInThisTurn = 0;
    turnInputs.forEach(s => { totalScoreInTurn += s; if (player.state.weakLock || (s >= 51 && enemy.data.weak && (s % enemy.data.weak === 0))) weakHitInThisTurn++; });

    if (stage === 4 && floor === 6 && currentTurn % 2 === 0 && totalScoreInTurn < 80) { playSE("se-warning"); addLog(">> 結界に阻まれた！(80点未満無効)", "log-enemy"); totalScoreInTurn = 0; }
    
    playSE("se-attack"); totalGameTurns++; totalScore += totalScoreInTurn; totalDarts += turnInputs.length; 
    let dmg = calculatePlayerDamage(totalScoreInTurn, player, enemy);
    let remaining = enemy.hp - dmg; if (remaining === 0) isJustFinish = true; enemy.hp = Math.max(0, remaining);

    if (weakHitInThisTurn > 0) { dropGuaranteed = true; weakHitCount += weakHitInThisTurn; addLog(`★ WEAK HIT x${weakHitInThisTurn}!!`, "log-weak"); if(!player.state.weakLock) { playSE("se-weak"); elOverlay.className = "flash-purple"; setTimeout(()=>elOverlay.className="", 600); } }
    if(player.state.weakLock) { player.state.weakLock = false; addLog("Weak Lock 終了", "log-system"); }

    addLog(`攻撃！ ${dmg} ダメージ (${turnInputs.join('+')})`); triggerEffect(elEnemyPanel, dmg, false);
    animateValue(elEnemyHP, displayEnemyHP, enemy.hp, 500); displayEnemyHP=enemy.hp; updateInfo();
    if (restrictInput) { restrictInput = false; addLog("束縛が解けた！", "log-system"); }
    if (enemy.state.guardType === 'cut') { enemy.state.guardTurn--; if(enemy.state.guardTurn<=0) { enemy.state.guardType=null; addLog("光の護封剣が消滅した", "log-system"); } }
    turnInputs = []; currentInput = ""; updateScoreDisplay();
    if(enemy.hp<=0) setTimeout(winBattle, 1000); else setTimeout(enemyTurn, 1000);
}

// ★IMPORTANT: Enemy Logic Preserved & Updated (v1.3 + v1.4 additions)
function enemyTurn() {
    if(enemy.state.isStunned) { addLog(`>> ${enemy.name} は麻痺して動けない！`, "log-system"); enemy.state.isStunned = false; endEnemyTurn(); return; }

    // --- Boss Gimmicks (Added for v1.4) ---
    if (stage === 4) {
        if (floor === 5 && currentTurn % 4 === 0) { showSkillCutin("イーター", "earth"); setTimeout(() => { destroyHandCard(1); addLog(">> [イーター] 手札を1枚食べられた！", "log-enemy"); doEnemyAttack(1.0, {isDrain: true}); }, 1200); return; }
        if (floor === 6 && currentTurn % 3 === 0) { showSkillCutin("千眼の呪縛", "wind"); setTimeout(() => { destroyHandCard(2); player.mp = Math.max(0, player.mp - 2); addLog(">> [呪縛] 手札2枚破壊 & MP-2", "log-enemy"); doEnemyAttack(1.2); }, 1200); return; }
    }
    if (stage === 5) {
        extraBossTurnCount++;
        if (extraBossTurnCount % 5 === 0) { showSkillCutin("黒 炎 弾", "fire"); setTimeout(() => { let dmg=80; if(enemy.hp<enemy.maxHp*0.5) dmg=120; addLog(`>> [黒炎弾] 全体焼却 (${dmg}ダメ)`, "log-enemy"); doEnemyAttack(0, {fixedDmg: dmg, isBossUlt: true}); }, 1200); return; }
        let mult = 1.0; if(enemy.hp<enemy.maxHp*0.5) mult=1.5; doEnemyAttack(mult); return;
    }

    // --- Original v1.3 Logic Preserved ---
    if(stage===4 && floor===3) { if(Math.random()<0.4) { showSkillCutin("呪いの視線", "earth"); setTimeout(() => { player.mp = Math.max(0, player.mp - 2); addLog(">> [呪い] MP2減少", "log-enemy"); doEnemyAttack(1.0); }, 1200); return; } }
    if(stage===3) {
        if(floor===2 && Math.random()<0.3) { showSkillCutin("誘惑の風", "wind"); setTimeout(() => { if(player.mp>0) { player.mp=Math.max(0,player.mp-1); enemy.hp=Math.min(enemy.hp+20,enemy.maxHp); addLog(">> [誘惑の風] MP吸収", "log-enemy"); } doEnemyAttack(1.0); }, 1200); return; }
        if(floor===5) { enemy.state.atkBuff += 0.1; addLog(`>> [主人の加護] 攻撃力UP (x${(1.0+enemy.state.atkBuff).toFixed(1)})`, "log-enemy"); if(currentTurn % 4 === 0) { showSkillCutin("愛の鞭", "fire"); setTimeout(() => { player.mp = 0; addLog(">> [愛の鞭] MP消滅", "log-enemy"); doEnemyAttack(2.0 * (1.0+enemy.state.atkBuff)); }, 1200); return; } doEnemyAttack(1.0 * (1.0+enemy.state.atkBuff)); return; }
    }
    if(stage===1 && floor===4 && player.mp>0 && Math.random()<0.3) { showSkillCutin("猛毒の鱗粉", "earth"); setTimeout(() => { player.mp = Math.max(0, player.mp - 1); addLog(">> [猛毒の鱗粉] MP1減少", "log-enemy"); doEnemyAttack(1.0); }, 1200); return; }
    
    // Actions
    if (stage === 4 && floor === 1 && Math.random() < 0.3) { showSkillCutin("トゥーン・ラッシュ", "wind"); setTimeout(() => { addLog(">> [速攻] 2回攻撃！", "log-enemy"); doEnemyAttack(0.7, {callback: () => { setTimeout(() => doEnemyAttack(0.7), 800); } }); }, 1200); return; }
    if (stage === 4 && floor === 2 && currentTurn === 5) { showSkillCutin("死のびっくり箱", "fire"); setTimeout(() => { addLog(">> [死の箱] 999ダメージ！", "log-enemy"); doEnemyAttack(0, {fixedDmg: 999, ignoreShield: true}); }, 1200); return; }
    if (stage === 4 && floor === 4 && currentTurn % 3 === 0) { showSkillCutin("トゥーン・スキン", "earth"); setTimeout(() => { addLog(">> [硬質化] 被ダメ-50", "log-enemy"); updateInfo(); endEnemyTurn(); }, 1200); return; }
    if (stage === 4 && floor === 5 && currentTurn % 3 === 0) { showSkillCutin("幻想の儀式", "wind"); setTimeout(() => { addLog(">> [儀式] HP吸収", "log-enemy"); doEnemyAttack(1.2, {isDrain: true}); }, 1200); return; }
    if (stage === 4 && floor === 6 && currentTurn % 2 === 0) { showSkillCutin("千眼の邪教神", "wind"); setTimeout(() => { addLog(">> [結界] 80点未満無効化！", "log-enemy"); doEnemyAttack(1.2); }, 1200); return; }
    
    if(stage===3) {
        if(floor===1 && enemy.state.guardTurn > 0) { addLog(`>> 光の護封剣 (残り${enemy.state.guardTurn}T)`, "log-enemy"); doEnemyAttack(1.0); return; }
        if(floor===3 && Math.random()<0.3) { showSkillCutin("サイバー・ボンテージ", "wind"); setTimeout(() => { restrictInput = true; addLog(">> [拘束] 次ターン1投制限！", "log-enemy"); doEnemyAttack(1.0); }, 1200); return; }
        if(floor===4 && Math.random()<0.3) { showSkillCutin("トライアングル・エクスタシー", "wind"); setTimeout(() => { addLog(">> [3姉妹] 3回攻撃！", "log-enemy"); doEnemyAttack(0.6, {callback: () => { setTimeout(() => doEnemyAttack(0.6, {callback: () => { setTimeout(() => doEnemyAttack(0.6), 600); } }), 600); } }); }, 1200); return; }
    }
    if(stage===2) {
        if(floor===2 && Math.random()<0.3) { showSkillCutin("俊足の連撃", "fire"); setTimeout(() => { addLog(">> [連撃] 2回攻撃！", "log-enemy"); doEnemyAttack(0.7, {callback: () => { setTimeout(() => doEnemyAttack(0.7), 800); } }); }, 1200); return; }
        if(floor===3 && Math.random()<0.3) { showSkillCutin("死肉の渇望", "fire"); setTimeout(() => { addLog(">> [渇望] HP吸収", "log-enemy"); doEnemyAttack(1.0, {isDrain: true}); }, 1200); return; }
        if(floor===4 && enemy.hp <= enemy.maxHp * 0.5 && Math.random()<0.5) { showSkillCutin("狂暴化", "fire"); setTimeout(() => { addLog(">> [狂暴化] 攻撃1.5倍", "log-enemy"); doEnemyAttack(1.5); }, 1200); return; }
        if(floor===5 && Math.random() < 0.3) { showSkillCutin("恐竜剣・兜割り", "earth"); setTimeout(() => { addLog(">> [BOSS] 兜割り！シールド無効", "log-enemy"); doEnemyAttack(1.8, {ignoreShield: true}); }, 1200); return; }
    }
    if(stage===1) {
        if(floor===3) { if(Math.random() < 0.2) { showSkillCutin("自己再生", "heal"); setTimeout(() => { enemy.hp = Math.min(enemy.hp + 20, enemy.maxHp); playSE("se-heal"); addLog(">> [自己再生] HP20回復", "log-heal"); animateValue(elEnemyHP,displayEnemyHP,enemy.hp,500); displayEnemyHP=enemy.hp; updateInfo(); endEnemyTurn(); }, 1200); return; } if(Math.random() < 0.4) { showSkillCutin("鉄壁の守り", "earth"); setTimeout(() => { enemy.state.guard = true; addLog(">> [鉄壁の守り] ダメージ半減", "log-enemy"); updateInfo(); endEnemyTurn(); }, 1200); return; } }
        if(floor===5) { if(enemy.state.charge) { enemy.state.charge = false; showSkillCutin("森の破壊衝動", "earth"); setTimeout(() => { doEnemyAttack(3.0); }, 1200); return; } if(Math.random() < 0.3) { enemy.state.charge = true; addLog(`>> 力を溜めている…`, "log-enemy"); updateInfo(); endEnemyTurn(); return; } }
    }
    doEnemyAttack(1.0);
}

function doEnemyAttack(mult, options = {}) {
    const { ignoreShield = false, isDrain = false, isBossUlt = false, fixedDmg = 0, callback = null } = options;
    if (!ignoreShield && player.state.shield) { addLog(`${enemy.name} の攻撃！ → 完全防御！`, "log-skill"); player.state.shield=false; triggerEffect(elPlayerPanel,0,true); elOverlay.className="flash-blue"; setTimeout(()=>elOverlay.className="",300); updateInfo(); if(callback) callback(); else endEnemyTurn(); return; }
    if (isBossUlt) { let dmg = fixedDmg > 0 ? fixedDmg : 60; playSE("se-boom"); elOverlay.className="flash-fire"; setTimeout(()=>elOverlay.className="",600); triggerEffect(elPlayerPanel,dmg,true); finishAttack(dmg, false, callback); return; }
    if (fixedDmg > 0) { finishAttack(fixedDmg, isDrain, callback); return; }
    const base = 2+floor+(stage-1)*3; const dmg = Math.floor((base + Math.floor(Math.random()*6)) * mult);
    finishAttack(dmg, isDrain, callback);
}

function finishAttack(dmg, isDrain, callback) {
    player.hp = Math.max(0, player.hp-dmg); addLog(`${enemy.name} の攻撃！ ${dmg} ダメージ`, "enemy");
    if(isDrain) { const heal = Math.floor(dmg * 0.5); if(heal > 0) { enemy.hp = Math.min(enemy.hp + heal, enemy.maxHp); addLog(`>> 敵が HP${heal} 吸収した！`, "log-enemy"); animateValue(elEnemyHP, displayEnemyHP, enemy.hp, 500); displayEnemyHP=enemy.hp; } }
    triggerEffect(elPlayerPanel, dmg, true); animateValue(elPlayerHP, displayPlayerHP, player.hp, 500); displayPlayerHP=player.hp; updateInfo();
    if(player.hp<=0) setTimeout(loseBattle,1000); else { if(callback) callback(); else endEnemyTurn(); }
}

function destroyHandCard(count) {
    if (player.deckLocked) return;
    for (let i = 0; i < count; i++) { if (player.hand.length > 0) { const idx = Math.floor(Math.random() * player.hand.length); const lostCard = player.hand.splice(idx, 1)[0]; player.discard.push(lostCard); } }
    updateInfo();
}

function endEnemyTurn() { currentTurn++; player.mp = Math.min(player.mp + 3, player.maxMp); updateInfo(); isProcessing=false; }

// --- CARD EFFECTS (Updated for v1.4) ---
function applyCardEffect(card) {
    let msg = `Card: [${card.name}] `;
    if (card.id === 101) { player.hp = player.maxHp; msg += "HP完全回復！"; playSE("se-heal"); }
    else if (card.id === 201) { const dmg = 100; enemy.hp = Math.max(0, enemy.hp - dmg); enemy.state.isStunned = true; msg += `100ダメ & スタン！`; playSE("se-boom"); triggerEffect(elEnemyPanel, dmg, false); }
    else if (card.id === 202) { player.mp = Math.min(player.mp + 5, player.maxMp); msg += "MP+5 チャージ！"; }
    else if (card.id === 301) { enemy.state.guardType='cut'; enemy.state.guardTurn=3; msg += "3ターン被ダメ半減！"; }
    else if (card.id === 302) { if (enemy.state.charge) { enemy.state.charge = false; enemy.state.isStunned = true; msg += "チャージ解除 & スタン！"; playSE("se-boom"); } else { msg += "(不発)"; } }
    else if (card.id === 303) { player.state.shield = true; const dmg = 50; enemy.hp = Math.max(0, enemy.hp - dmg); msg += `完全防御 & 50反撃！`; triggerEffect(elEnemyPanel, dmg, false); }
    else if (card.id === 401) { const dmg = 20; enemy.hp = Math.max(0, enemy.hp - dmg); msg += `20ダメージ`; triggerEffect(elEnemyPanel, dmg, false); }
    else if (card.id === 402) { player.hp = Math.min(player.hp + 50, player.maxHp); msg += "HP50回復"; playSE("se-heal"); }
    else if (card.id === 403) { const dmg = 80; const selfDmg = 20; enemy.hp = Math.max(0, enemy.hp - dmg); player.hp = Math.max(0, player.hp - selfDmg); msg += `敵80ダメ / 自20ダメ`; triggerEffect(elEnemyPanel, dmg, false); triggerEffect(elPlayerPanel, selfDmg, true); }
    else if (card.id === 404) { const dmg = 80; enemy.hp = Math.max(0, enemy.hp - dmg); msg += `80ダメージ！`; playSE("se-attack"); triggerEffect(elEnemyPanel, dmg, false); }
    else if (card.id === 405) { player.state.nextShotMult = 2.0; msg += "次の一投ダメージ2倍！"; }
    addLog(msg, "log-skill");
    animateValue(elEnemyHP, displayEnemyHP, enemy.hp, 500); displayEnemyHP=enemy.hp;
    animateValue(elPlayerHP, displayPlayerHP, player.hp, 500); displayPlayerHP=player.hp;
    if (enemy.hp <= 0) setTimeout(winBattle, 800);
}

// --- VISUAL & UI ---
function updateScoreDisplay() {
    slots.forEach((s, i) => { s.className = "score-slot"; if (restrictInput && i > 0) { s.classList.add("locked"); s.innerText = "X"; return; } if (i < turnInputs.length) { s.innerText = turnInputs[i]; s.classList.add("filled"); } else if (i === turnInputs.length) { s.innerText = currentInput; s.classList.add("active"); } else { s.innerText = ""; } });
    const currentThrow = turnInputs.length + 1;
    btnD1.className = currentThrow === 1 ? "darts-btn active" : "darts-btn"; btnD2.className = currentThrow === 2 ? "darts-btn active" : "darts-btn"; btnD3.className = currentThrow === 3 ? "darts-btn active" : "darts-btn";
    if(restrictInput) { btnD2.className="darts-btn disabled"; btnD3.className="darts-btn disabled"; }
}

function handleEnter() {
    if(isProcessing) return;
    if (currentInput !== "") {
        const val = parseInt(currentInput);
        if (!isNaN(val)) { 
            if (val < 0 || val > 60) { alert("単発の最大値は 60 (T20) です"); currentInput=""; updateScoreDisplay(); return; } 
            playSE("se-tap"); turnInputs.push(val); currentInput = ""; if (restrictInput || turnInputs.length === 3) executeAttack(); else updateScoreDisplay(); 
        }
    } else { if (turnInputs.length > 0) executeAttack(); }
}

function updateInfo() {
    if (!enemy.data) return;
    if(stage===5) { elStage.innerText="EXTRA"; elFloor.innerText="FINAL"; } else if(stage===4) { elStage.innerText="STAGE 4"; elFloor.innerText=`${floor}F`; } else { elStage.innerText=`STAGE ${stage}`; elFloor.innerText=`${floor}F`; }
    elTurn.innerText=`TURN ${currentTurn}`;

    const elName = document.getElementById("enemy-name"); elName.innerText = enemy.name;
    elName.style.fontSize = "18px"; if (enemy.name.length > 12) elName.style.fontSize = "12px";

    elEnemyHPValue.innerText = enemy.hp; elEnemyHPValue.className = "hp-big-text";
    if(enemy.hp <= 60) { elEnemyHPValue.classList.add("hp-danger"); } else if(enemy.hp <= 180) { elEnemyHPValue.classList.add("hp-warning"); }

    let weakText = ""; 
    if(player.state.weakLock) { weakText = "<span style='color:#f0f;'>★ WEAK LOCK ACTIVE ★</span>"; }
    else if(weakHitCount > 0) { weakText = "<span style='color:#ffa500;'>DROP CHANCE UP!</span>"; }
    else { weakText = "WEAK: " + enemy.data.weak + "+"; }
    elWeak.innerHTML = weakText;

    elEnemyHPBar.style.width=Math.max(0,(enemy.hp/enemy.maxHp)*100)+"%"; elPlayerHPBar.style.width=Math.max(0,(player.hp/player.maxHp)*100)+"%";
    document.getElementById("player-hp").innerText = player.hp; document.getElementById("player-max-hp").innerText = player.maxHp;

    const mpContainer = document.getElementById("player-mp-bar"); mpContainer.innerHTML = ""; mpContainer.style.width="100%";
    for(let i=0; i < player.maxMp; i++) { const dot = document.createElement("div"); dot.className = "mp-dot"; if (i < player.mp) dot.classList.add("active"); mpContainer.appendChild(dot); }
    document.querySelector("#player-mp").innerText = player.mp; document.querySelector("#player-max-mp").innerText = player.maxMp;

    updateVisuals();
    
    const handArea = document.getElementById("hand-area"); handArea.innerHTML = "";
    if (player.deckLocked) { document.getElementById("battle-deck-count").innerText = "-"; handArea.innerHTML = `<div class="hand-locked-msg">⚠️ NO DECK</div>`; } 
    else {
        document.getElementById("battle-deck-count").innerText = player.deck.length;
        if (player.hand.length === 0) { handArea.innerHTML = `<div class="hand-card-empty">NO CARD</div>`; } 
        else {
            player.hand.forEach((cardId, index) => {
                const card = CARD_DB.find(c => c.id === cardId);
                const div = document.createElement("div"); div.className = "hand-card";
                if (player.mp < card.cost) div.classList.add("disabled");
                const imgPath = `assets/cards/${card.id}.png`;
                div.innerHTML = `<div class="hand-cost">${card.cost}</div><div class="card-art"><img src="${imgPath}" onerror="this.style.display='none'"></div><div style="font-size:8px;text-align:center;">${card.name}</div>`;
                div.onclick = () => playHandCard(index);
                handArea.appendChild(div);
            });
        }
    }

    let ppr = totalDarts>0 ? ((totalScore/totalDarts)*3).toFixed(1) : 0; elAvg.innerText=ppr; elRt.innerText=`(Rt ${calculateRating(ppr)})`;
    btnPotion.innerHTML = `💊 薬草 x${player.items.potion}`; btnPotion.className = player.items.potion > 0 ? "item-btn has-item" : "item-btn disabled";
    btnEther.innerHTML = `⚗️ マナ x${player.items.ether}`; btnEther.className = player.items.ether > 0 ? "item-btn has-item" : "item-btn disabled";
    btnSeed.innerHTML = `🌱 種 x${player.items.seed}`; btnSeed.className = player.items.seed > 0 ? "item-btn has-item" : "item-btn disabled";
}

function updateVisuals() {
    if(elPlayerBuff) { elPlayerBuff.style.display = (player.state.power || player.state.nextShotMult > 1.0) ? "block" : "none"; if(player.state.nextShotMult > 1.0) elPlayerBuff.innerText = "NEXT x2"; else elPlayerBuff.innerText = "ATK x1.5"; }
    if(elPlayerGuard) elPlayerGuard.style.display = player.state.shield ? "block" : "none";
    if(elEnemyBuff) elEnemyBuff.style.display = enemy.state.charge ? "block" : "none";
    if(elEnemyGuard) elEnemyGuard.style.display = (enemy.state.guard || enemy.state.guardType) ? "block" : "none";
    if(elEnemyDrop) elEnemyDrop.style.display = (player.state.weakLock || dropGuaranteed) ? "block" : "none";
    if (stage !== 5 && elEnemyPanel) { elEnemyPanel.classList.remove("mode-charge", "mode-guard"); if (enemy.state.charge) elEnemyPanel.classList.add("mode-charge"); if (enemy.state.guard || enemy.state.guardType) elEnemyPanel.classList.add("mode-guard"); }
}

function tapKey(key) {
    if (elGame.style.display === "none" || isProcessing) return;
    if(key === 'ENT') handleEnter();
    else if (key === 'BS') { if (currentInput.length > 0) currentInput = currentInput.slice(0, -1); else if (turnInputs.length > 0) currentInput = "" + turnInputs.pop(); playSE("se-tap"); updateScoreDisplay(); }
    else { if (currentInput.length < 3) { playSE("se-tap"); currentInput += key; updateScoreDisplay(); } }
}

// --- SHOP & COLLECTION (Restored) ---
function openCardShop() {
    playSE("se-tap"); const list = document.getElementById("pack-list"); list.innerHTML = "";
    document.getElementById("shop-dp-display").innerText = savedData.dp;
    PACK_DATA.forEach(pack => {
        const canBuy = savedData.dp >= pack.price;
        const div = document.createElement("div"); div.className = "pack-item";
        div.innerHTML = `<div class="pack-img-container"><img src="${pack.img}"></div><div class="pack-name">${pack.name}</div><div class="pack-desc">${pack.desc}</div><button class="pack-buy-btn" ${canBuy ? "" : "disabled"} onclick="buyPack('${pack.id}')">${canBuy ? `BUY (${pack.price} DP)` : "LACK DP"}</button>`;
        list.appendChild(div);
    });
    document.getElementById("card-shop-modal").style.display = "flex";
}
function buyPack(packId) {
    const pack = PACK_DATA.find(p => p.id === packId); if (!pack || savedData.dp < pack.price) return;
    savedData.dp -= pack.price; document.getElementById("shop-dp-display").innerText = savedData.dp; playSE("se-item");
    const results = []; for(let i=0; i<3; i++) {
        const card = drawShopCard(packId); 
        const isNew = !savedData.cards[card.id];
        if (!savedData.cards[card.id]) savedData.cards[card.id] = 0; savedData.cards[card.id]++;
        results.push({ card: card, isNew: isNew });
    }
    saveToDrive(); showPackResult(results);
}
function showPackResult(results) {
    const container = document.getElementById("pack-results"); container.innerHTML = "";
    results.forEach((res, index) => {
        const c = res.card; const cardEl = createCardElement(c, false, 1);
        cardEl.classList.add("result-card-anim"); cardEl.style.animationDelay = `${index * 0.3}s`;
        if (res.isNew) { const badge = document.createElement("div"); badge.className = "new-badge-overlay"; badge.innerText = "NEW!"; cardEl.appendChild(badge); }
        container.appendChild(cardEl);
    });
    document.getElementById("pack-result-modal").style.display = "flex";
}
function closePackResult() { playSE("se-tap"); document.getElementById("pack-result-modal").style.display = "none"; updateTitleScore(); }
function closeCardShop() { playSE("se-tap"); document.getElementById("card-shop-modal").style.display = "none"; updateTitleScore(); }

function openCollection() { playSE("se-tap"); renderDeckEditor(); document.getElementById("collection-modal").style.display = "flex"; }
function closeCollection() { playSE("se-tap"); document.getElementById("collection-modal").style.display = "none"; }
function renderDeckEditor() {
    if (!savedData.deck) savedData.deck = [];
    const deckGrid = document.getElementById("deck-grid"); deckGrid.innerHTML = "";
    for (let i = 0; i < 12; i++) {
        const cardId = savedData.deck[i]; 
        if (cardId) { const card = CARD_DB.find(c => c.id === cardId); deckGrid.appendChild(createCardElement(card, true)); }
        else { const div = document.createElement("div"); div.className = "deck-slot-empty"; div.innerText = "EMPTY"; deckGrid.appendChild(div); }
    }
    const deckCount = savedData.deck.length; const countEl = document.getElementById("deck-count"); countEl.innerText = deckCount;
    if (deckCount < 12) { countEl.style.color = "#ff5555"; } else { countEl.style.color = "#00ff00"; }
    const listGrid = document.getElementById("card-grid"); listGrid.innerHTML = "";
    if (!savedData.cards) savedData.cards = {}; let ownedCount = 0;
    CARD_DB.forEach(card => {
        const count = savedData.cards[card.id] || 0; if (count > 0) ownedCount++;
        const inDeckCount = savedData.deck.filter(id => id === card.id).length;
        const remaining = count - inDeckCount; 
        listGrid.appendChild(createCardElement(card, false, remaining));
    });
    document.getElementById("collection-rate").innerText = `${Math.floor((ownedCount / CARD_DB.length) * 100)}%`;
}
function createCardElement(card, isDeckItem, remainingCount = 1) {
    const div = document.createElement("div"); const notOwnedClass = (!isDeckItem && remainingCount <= 0) ? "card-not-owned" : "";
    div.className = `collection-card rarity-${card.rarity} ${notOwnedClass}`;
    const imgPath = `assets/cards/${card.id}.png`; 
    div.innerHTML = `<div class="card-count-badge">x${isDeckItem ? 1 : remainingCount}</div><div class="card-art"><img src="${imgPath}" onerror="this.style.display='none'"></div><div class="card-info"><div class="card-name">${card.name}</div></div>`;
    div.onclick = function() { if (isDeckItem) removeFromDeck(card.id); else addToDeck(card.id); };
    return div;
}
function addToDeck(cardId) {
    if (savedData.deck.length >= 12) { alert("デッキは12枚までです！"); return; }
    const ownedCount = savedData.cards[cardId] || 0; const currentInDeck = savedData.deck.filter(id => id === cardId).length;
    if (currentInDeck >= ownedCount) { alert("これ以上持っていません！"); return; }
    playSE("se-tap"); savedData.deck.push(cardId); saveToDrive(); renderDeckEditor(); 
}
function removeFromDeck(cardId) {
    playSE("se-tap"); const index = savedData.deck.indexOf(cardId);
    if (index > -1) { savedData.deck.splice(index, 1); } saveToDrive(); renderDeckEditor();
}

// --- INIT (Ensuring everything is ready) ---
initSlotScreen();