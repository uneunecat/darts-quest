console.log("★ interface.js is loaded!");

// --- CONSTANTS & DOM ---
const elContainer=document.getElementById("game-container"); const elTitle=document.getElementById("title-screen"); const elGame=document.getElementById("game-screen");
const elChapter=document.getElementById("chapter-screen"); const elChapTitle=document.getElementById("chapter-title"); const elChapSub=document.getElementById("chapter-sub");
const elStage=document.getElementById("stage-display"); const elFloor=document.getElementById("floor-display"); const elTurn=document.getElementById("turn-display");
const elBossLabel=document.getElementById("boss-label"); const elEnemyImg=document.getElementById("enemy-img"); const elEnemyName=document.getElementById("enemy-name");
const elWeak=document.getElementById("weak-display");
const elEnemyHP=document.getElementById("enemy-hp"); const elPlayerHP=document.getElementById("player-hp"); 
let displayPlayerHP=100; let displayEnemyHP=100;

const elAvg=document.getElementById("avg-display"); const elRt=document.getElementById("rt-display"); const elLog=document.getElementById("battle-log");
const elEnemyPanel=document.getElementById("enemy-panel"); const elPlayerPanel=document.getElementById("player-panel"); const elOverlay=document.getElementById("flash-overlay");
const btnD1=document.getElementById("btn-d1"); const btnD2=document.getElementById("btn-d2"); const btnD3=document.getElementById("btn-d3");
const btnPotion=document.getElementById("btn-potion"); const btnEther=document.getElementById("btn-ether"); const btnSeed=document.getElementById("btn-seed");
const elModal=document.getElementById("game-modal"); const elModalBox=document.getElementById("modal-box-inner"); const elModalTitle=document.getElementById("modal-title"); const elModalText=document.getElementById("modal-text"); const elModalBtn=document.getElementById("modal-btn"); const elModalBtns=document.getElementById("modal-buttons");
const elCutin=document.getElementById("skill-cutin"); const elCutinText=document.getElementById("cutin-text-val");
const elCurtain=document.getElementById("black-curtain"); const elChestImg=document.getElementById("chest-img");
const slots = [document.getElementById("slot-1"), document.getElementById("slot-2"), document.getElementById("slot-3")];
const audioElements = [document.getElementById("bgm-title"), document.getElementById("bgm-battle"), document.getElementById("bgm-boss"), document.getElementById("bgm-extra"), document.getElementById("bgm-win"), document.getElementById("bgm-lose")];
let currentBgmId = "";

// --- INITIALIZATION ---
function resizeGame() {
    const scaler = document.getElementById('game-scaler');
    const winW = window.innerWidth; const winH = window.innerHeight;
    const baseW = 900; const baseH = 620;
    const scale = Math.min(winW / baseW, winH / baseH) * 0.95;
    scaler.style.transform = `scale(${scale})`;
}
window.addEventListener('resize', resizeGame); window.addEventListener('load', resizeGame); setTimeout(resizeGame, 100);

// ここで初期化実行！
initSlotScreen();

// --- SLOT & TITLE ---
function initSlotScreen() {
    for(let i=1; i<=3; i++) {
        const key = "slot"+i; const data = allSaveData[key];
        const infoEl = document.getElementById("info-"+i);
        if(!data) { infoEl.innerHTML = "<div class='slot-empty'>NO DATA<br>- Start New Game -</div>"; }
        else {
            if(data.dp === undefined) data.dp = 0;
            if(data.bestRanks === undefined) data.bestRanks = { 1: null, 2: null, 3: null, 4: null, 5: null };
            if(data.unlockedStage4 === undefined) data.unlockedStage4 = false; 
            if(data.deck === undefined) data.deck = [];
            if(data.cards === undefined) data.cards = {};

            let stg = `STAGE ${data.highScore.stage} - ${data.highScore.floor}F`;
            if(data.highScore.stage === 5) stg = "EXTRA STAGE";
            else if(data.highScore.stage === 4) stg = "STAGE 4 - " + data.highScore.floor + "F";

            let badge = ""; if(data.clearedExtra) badge = "<br><span style='color:#f0f;font-weight:bold;'>★ EXTRA CLEARED</span>";
            infoEl.innerHTML = `<div>${stg}</div><div style='color:#ffdd00;'>Avg: ${data.highScore.avg.toFixed(1)} (Rt ${calculateRating(data.highScore.avg)})</div><div style='color:#aaa;font-size:12px;'>DP: ${data.dp}${badge}</div>`;
        }
    }
}

function selectSlot(n) {
    currentSlot = "slot"+n; const key = currentSlot;
    if(!allSaveData[key]) { allSaveData[key] = { highScore: { stage: 1, floor: 1, avg: 0.0 }, history: [], clearedExtra: false, dp: 0, bestRanks: { 1: null, 2: null, 3: null, 4: null, 5: null }, unlockedStage4: false, deck: [], cards: {} }; }
    savedData = allSaveData[key];
    if(savedData.dp === undefined) savedData.dp = 0;
    if(savedData.deck === undefined) savedData.deck = [];
    if(savedData.cards === undefined) savedData.cards = {};
    allSaveData.lastPlayed = n;
    updateTitleScore(); playSE("se-tap");
    document.getElementById("slot-screen").style.display = "none"; document.getElementById("title-screen").style.display = "flex";
    playBGM("bgm-title");
}

function backToSlots() { stopAllBGM(); document.getElementById("title-screen").style.display = "none"; document.getElementById("slot-screen").style.display = "flex"; initSlotScreen(); }

function updateTitleScore() {
    let stg = `STAGE ${savedData.highScore.stage}`; if (savedData.highScore.stage === 5) stg = "EXTRA";
    document.getElementById("hs-reach").innerText = `${stg} - ${savedData.highScore.floor}F`;
    document.getElementById("hs-avg").innerText = savedData.highScore.avg.toFixed(1);
    document.getElementById("hs-rt").innerText = "Rt " + calculateRating(savedData.highScore.avg);
    document.getElementById("dp-display").innerText = "DP: " + savedData.dp;

    updateStageButton(1, "btn-st1"); updateStageButton(2, "btn-st2"); updateStageButton(3, "btn-st3");
    updateStageButton(4, "btn-stage4"); updateStageButton(5, "btn-extra");

    const isStage3Cleared = (savedData.bestRanks && savedData.bestRanks[3]);
    const canPlayStage4 = savedData.unlockedStage4 || isStage3Cleared || savedData.clearedExtra;
    
    if (canPlayStage4) document.getElementById("btn-stage4").style.display = "flex";
    else document.getElementById("btn-stage4").style.display = "none";

    if (savedData.clearedExtra) document.getElementById("btn-extra").style.display = "flex"; else document.getElementById("btn-extra").style.display = "none";
}

function updateStageButton(stgNum, btnId) {
    const btn = document.getElementById(btnId);
    const rank = savedData.bestRanks[stgNum];
    const oldBadge = btn.querySelector(".rank-badge-s");
    if(oldBadge) oldBadge.remove();

    btn.className = "stage-btn btn-default";
    if(btnId==="btn-stage4") btn.classList.add("stage4-btn");
    if(btnId==="btn-extra") btn.classList.add("extra-btn");

    if(rank) {
        btn.classList.remove("btn-default", "stage4-btn", "extra-btn");
        if(rank === "SSS") btn.classList.add("btn-prism");
        else if(rank === "S") btn.classList.add("btn-gold");
        else if(rank === "A") btn.classList.add("btn-silver");
        else btn.classList.add("btn-copper");
    }
}

function getRankColor(r) { if(r==="SSS") return "#00ffff"; if(r==="S") return "#ffd700"; if(r==="A") return "#ff5555"; return "#fff"; }

// --- AUDIO ---
function stopAllBGM() { audioElements.forEach(a => { a.pause(); a.currentTime=0; }); currentBgmId = ""; }
function playBGM(id) { 
    if(currentBgmId === id) return; 
    stopAllBGM(); currentBgmId = id; 
    const audio = document.getElementById(id); 
    if(audio) { audio.volume=0.3; audio.play().catch(e=>{}); } 
}
function playSE(id) { const audio = document.getElementById(id); if(audio) { audio.currentTime = 0; audio.volume = 0.5; audio.play().catch(e=>{}); } }

// --- BATTLE SYSTEM (DOM/UI parts) ---
function initGameSession(startStage, continueMode=false) {
    if (!continueMode) {
        player.hp = 100; player.maxHp = 100; player.mp = 3; player.items = { potion: 0, ether: 0, seed: 0 };
        totalGameTurns = 0; totalScore = 0; totalDarts = 0;
        clearedStagesLog = [];
    }
    startTransition(startStage);
}

function startTransition(sel) {
    let t="STAGE "+sel; let s=""; let warning=false;
    if(sel===1) { t="旅立ちの森"; s="Forest of Beginnings"; }
    if(sel===2) { t="荒れ狂う荒野"; s="Raging Wasteland"; }
    if(sel===3) { t="誘惑の迷宮"; s="Labyrinth of Temptation"; }
    if(sel===4) { t="幻想の狂宴"; s="Toon Nightmare"; warning=true; }
    if(sel===5) { t="燃えたぎる火口"; s="Burning Crater"; warning=true; }

    elChapTitle.innerText = t; elChapSub.innerText = s;
    if(warning) { playSE("se-warning"); elChapter.classList.add("chapter-extra"); } else { playSE("se-tap"); elChapter.classList.remove("chapter-extra"); }
    elCurtain.classList.add("fade-in");
    setTimeout(() => { elTitle.style.display="none"; elChapter.style.display="flex"; elChapter.style.opacity=1; setupStage(sel); setTimeout(() => { elChapter.style.opacity=0; setTimeout(()=>{ elChapter.style.display="none"; elCurtain.classList.remove("fade-in"); }, 1000); }, warning ? 4000 : 2500); }, 1000);
}

function setupStage(sel) {
    stage=sel; floor=1; isProcessing=false; extraBossTurnCount=0; currentTurn=1;
    stageStartTurn = totalGameTurns; 
    elAvg.innerText="0.0"; elRt.innerText="(Rt -)"; elLog.innerHTML=""; elGame.style.display="block";
    spawnEnemy(); 
    player.state={power:false,shield:false,weakLock:false, nextShotMult:1.0}; 
    player.mp = 3; 
    player.deckLocked = false; 
    if (!savedData.deck || savedData.deck.length < 12) {
        player.deckLocked = true; player.deck = []; player.hand = []; player.discard = [];
        addLog("⚠ デッキ不完全: カード機能封鎖", "log-system");
    } else {
        player.deck = shuffleArray([...savedData.deck]); 
        player.hand = []; player.discard = [];
        for(let i=0; i<3; i++) drawCard();
    }
    addLog(`STAGE ${stage} START!`, "system"); resizeGame();
}

function spawnEnemy() {
    enemy.state={charge:false,guard:false,guardType:null,guardTurn:0,atkBuff:0,isStunned:false}; player.state={power:false,shield:false,weakLock:false,nextShotMult:1.0};
    currentTurn=1; turnInputs=[]; currentInput=""; restrictInput=false; updateScoreDisplay(); isJustFinish = false; waitingForChest = false; dropGuaranteed = false; weakHitCount=0;
    elContainer.className="container"; elEnemyPanel.className="left-panel"; elBossLabel.style.display="none"; elEnemyImg.style.display = "block"; elChestImg.style.display = "none";

    let bgKey = stage; if (stage === 4) bgKey = floor >= 5 ? "4_2" : "4_1";
    if (GAME_DATA.bg[bgKey]) elContainer.style.backgroundImage = `url('${GAME_DATA.bg[bgKey]}')`; else elContainer.style.backgroundImage = "none";

    let isBoss;
    if (stage === 5) {
        enemy.data = GAME_DATA.enemies[5][0]; isBoss=true; extraBossTurnCount=0; playBGM("bgm-extra"); elContainer.classList.add("extra-mode"); elEnemyPanel.classList.add("extra-border"); elBossLabel.innerText="☠️EXTRA BOSS"; elBossLabel.style.display="inline"; elStage.innerText="EXTRA STAGE"; enemy.maxHp=1200;
    } else if (stage === 4) {
        enemy.data = GAME_DATA.enemies[4][floor-1];
        isBoss = (floor >= 5); const base = 250; const bonus = (floor-1)*50; enemy.maxHp = base + bonus;
        if (floor === 5) { playBGM("bgm-boss"); elContainer.classList.add("boss-mode"); elBossLabel.innerText="⚠️BOSS"; elBossLabel.style.display="inline"; }
        else if (floor === 6) { playBGM("bgm-extra"); elContainer.classList.add("extra-mode"); elBossLabel.innerText="☠️FINAL BOSS"; elBossLabel.style.display="inline"; enemy.maxHp = 800; }
        else { playBGM("bgm-battle"); }
    } else {
        isBoss=(floor===5); if(isBoss) { playBGM("bgm-boss"); elContainer.classList.add("boss-mode"); elEnemyPanel.classList.add("boss-border"); elBossLabel.innerText="⚠️BOSS"; elBossLabel.style.display="inline"; } else { playBGM("bgm-battle"); }
        let list = GAME_DATA.enemies[stage]; enemy.data = list[(floor-1)%list.length]; const base=100+((stage-1)*50); const bonus=(floor-1)*30; enemy.maxHp=base+bonus+(isBoss?50:0);
    }
    enemy.name=enemy.data.name; elEnemyImg.src=enemy.data.img; enemy.hp=enemy.maxHp; displayEnemyHP=enemy.hp; updateInfo();
    if(stage===5) addLog(`>>> 伝説の黒竜、${enemy.name} が現れた！！！`, "log-skill"); else addLog(`=== STAGE ${stage} - ${floor}F ===`, "system");
    isProcessing=false;
}

function updateInfo() {
    if (!enemy.data) return;
    if(stage===5) { elStage.innerText="EXTRA"; elFloor.innerText="FINAL"; }
    else if(stage===4) { elStage.innerText="STAGE 4"; elFloor.innerText=`${floor}F`; }
    else { elStage.innerText=`STAGE ${stage}`; elFloor.innerText=`${floor}F`; }
    elTurn.innerText=`TURN ${currentTurn}`;

    const elName = document.getElementById("enemy-name"); elName.innerText = enemy.name;
    elName.style.fontSize = (enemy.name.length > 12) ? "12px" : (enemy.name.length > 9 ? "15px" : "18px");

    document.getElementById("enemy-hp-value").innerText = enemy.hp;
    const elEnemyHPVal = document.getElementById("enemy-hp-value");
    elEnemyHPVal.className = "hp-big-text";
    if(enemy.hp <= 60) elEnemyHPVal.classList.add("hp-danger"); else if(enemy.hp <= 180) elEnemyHPVal.classList.add("hp-warning");

    let weakText = ""; let weakTargetStr = "(Target: " + enemy.data.weak + "+)";
    if(player.state.weakLock) { weakText = "<span style='color:#f0f; animation:blink 0.5s infinite;'>★ WEAK LOCK ACTIVE ★</span>"; }
    else if(weakHitCount > 0) { weakText = "<span style='color:#ffa500;'>DROP CHANCE UP!</span>"; }
    else { weakText = "WEAK: " + enemy.data.weak + "+"; }
    elWeak.innerHTML = weakText;

    document.getElementById("enemy-hp-bar").style.width=Math.max(0,(enemy.hp/enemy.maxHp)*100)+"%"; 
    document.getElementById("player-hp-bar").style.width=Math.max(0,(player.hp/player.maxHp)*100)+"%";
    document.getElementById("player-hp").innerText = player.hp; 
    document.getElementById("player-max-hp").innerText = player.maxHp;

    const mpContainer = document.getElementById("player-mp-bar");
    mpContainer.innerHTML = ""; mpContainer.style.width = "100%"; 
    for(let i=0; i < player.maxMp; i++) {
        const dot = document.createElement("div"); dot.className = "mp-dot";
        if (i < player.mp) dot.classList.add("active");
        mpContainer.appendChild(dot);
    }
    document.querySelector("#player-mp").innerText = player.mp;
    document.querySelector("#player-max-mp").innerText = player.maxMp;

    updateVisuals();
    renderHand();

    let ppr = totalDarts>0 ? ((totalScore/totalDarts)*3).toFixed(1) : 0;
    document.getElementById("avg-display").innerText = ppr;
    document.getElementById("rt-display").innerText = `(Rt ${calculateRating(ppr)})`;
    updateItemButtons();
}

function updateVisuals() {
    const elPlayerBuff = document.getElementById("player-buff-badge");
    const elPlayerGuard = document.getElementById("player-guard-badge");
    const elEnemyBuff = document.getElementById("enemy-buff-badge");
    const elEnemyGuard = document.getElementById("enemy-guard-badge");
    const elEnemyDrop = document.getElementById("enemy-drop-badge");
    
    elPlayerBuff.style.display = (player.state.power || player.state.nextShotMult > 1) ? "block" : "none";
    if(player.state.nextShotMult > 1) elPlayerBuff.innerText = "NEXT x2"; else elPlayerBuff.innerText = "ATK x1.5";

    elPlayerGuard.style.display = player.state.shield ? "block" : "none";
    elEnemyBuff.style.display = enemy.state.charge ? "block" : "none";
    elEnemyGuard.style.display = (enemy.state.guard || enemy.state.guardType) ? "block" : "none";
    
    if (player.state.weakLock || dropGuaranteed) {
        elEnemyDrop.style.display = "block"; elEnemyPanel.classList.add("drop-chance");
    } else {
        elEnemyDrop.style.display = "none"; elEnemyPanel.classList.remove("drop-chance");
    }
    
    if (stage !== 5) {
        elEnemyPanel.classList.remove("mode-charge", "mode-guard");
        if (enemy.state.charge) elEnemyPanel.classList.add("mode-charge");
        if (enemy.state.guard || enemy.state.guardType) elEnemyPanel.classList.add("mode-guard");
    }
}

function renderHand() {
    const handArea = document.getElementById("hand-area"); handArea.innerHTML = "";
    if (player.deckLocked) {
        document.getElementById("battle-deck-count").innerText = "-";
        handArea.innerHTML = `<div class="hand-locked-msg">⚠️ NO DECK (DARTS ONLY)</div>`;
    } else {
        document.getElementById("battle-deck-count").innerText = player.deck.length;
        if (player.hand.length === 0) { handArea.innerHTML = `<div class="hand-card-empty">NO CARD</div>`; } 
        else {
            player.hand.forEach((cardId, index) => {
                const card = CARD_DB.find(c => c.id === cardId);
                let cost = card.cost; 
                const div = document.createElement("div"); div.className = "hand-card";
                if (player.mp < cost) div.classList.add("disabled");
                const imgPath = `assets/cards/${card.id}.png`;
                div.innerHTML = `<div class="hand-cost">${cost}</div><div class="card-art" style="height:100%; border:none;"><img src="${imgPath}" onerror="this.style.display='none'"></div><div style="position:absolute; bottom:0; width:100%; font-size:8px; text-align:center; background:rgba(0,0,0,0.7); color:#fff;">${card.name}</div>`;
                div.onclick = () => playHandCard(index);
                handArea.appendChild(div);
            });
        }
    }
}

function updateItemButtons() {
    btnPotion.innerHTML = `💊 薬草 x${player.items.potion}<span class="tooltip">HPを50回復 (使い切り)</span>`;
    btnPotion.className = player.items.potion > 0 ? "item-btn has-item" : "item-btn disabled";
    btnEther.innerHTML = `⚗️ マナ x${player.items.ether}<span class="tooltip">MPを3回復 (使い切り)</span>`;
    btnEther.className = player.items.ether > 0 ? "item-btn has-item" : "item-btn disabled";
    btnSeed.innerHTML = `🌱 種 x${player.items.seed}<span class="tooltip">最大HP+10上昇 (使い切り)</span>`;
    btnSeed.className = player.items.seed > 0 ? "item-btn has-item" : "item-btn disabled";
}

// --- BATTLE ACTIONS ---
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

function executeAttack() {
    isProcessing = true; let totalScoreInTurn = 0; let weakHitInThisTurn = 0;
    turnInputs.forEach(s => { totalScoreInTurn += s; if (player.state.weakLock || (s >= 51 && enemy.data.weak && (s % enemy.data.weak === 0))) weakHitInThisTurn++; });

    if (stage === 4 && floor === 6 && currentTurn % 2 === 0 && totalScoreInTurn < 80) {
        playSE("se-warning"); addLog(">> 結界に阻まれた！(80点未満無効)", "log-enemy"); totalScoreInTurn = 0;
    }

    playSE("se-attack"); totalGameTurns++;
    totalScore += totalScoreInTurn; totalDarts += turnInputs.length; 
    let dmg = calculatePlayerDamage(totalScoreInTurn, player, enemy);
    let remaining = enemy.hp - dmg; if (remaining === 0) isJustFinish = true; enemy.hp = Math.max(0, remaining);

    if (weakHitInThisTurn > 0) {
        dropGuaranteed = true; weakHitCount += weakHitInThisTurn; addLog(`★ WEAK HIT x${weakHitInThisTurn}!!`, "log-weak");
        if(!player.state.weakLock) { playSE("se-weak"); elOverlay.className = "flash-purple"; setTimeout(()=>elOverlay.className="", 600); }
    }
    if(player.state.weakLock) { player.state.weakLock = false; addLog("Weak Lock 効果終了", "log-system"); }

    addLog(`攻撃！ ${dmg} ダメージ (${turnInputs.join('+')})`);
    triggerEffect(elEnemyPanel, dmg, false);
    animateValue(elEnemyHP, displayEnemyHP, enemy.hp, 500); displayEnemyHP=enemy.hp; updateInfo();
    if (restrictInput) { restrictInput = false; addLog("束縛が解けた！", "log-system"); }
    if (enemy.state.guardType === 'player_cut') { enemy.state.guardTurn--; if(enemy.state.guardTurn<=0) { enemy.state.guardType=null; addLog("光の護封剣が消滅した", "log-system"); } }
    
    turnInputs = []; currentInput = ""; updateScoreDisplay();
    if(enemy.hp<=0) setTimeout(winBattle, 1000); else setTimeout(enemyTurn, 1000);
}

function winBattle() {
    addLog(`${enemy.name} を倒した`, "system");
    if (isJustFinish) { player.maxHp += 10; const oldHP = player.hp; player.hp = Math.min(player.hp + 10, player.maxHp); playSE("se-heal"); addLog(`★JUST FINISH! MaxHP+10 & HP+10`, "heal"); animateValue(elPlayerHP, oldHP, player.hp, 500); updateInfo(); setTimeout(() => { showDialog("JUST FINISH BONUS!!", `見事！ピッタリで倒した！<br>最大HPが ${player.maxHp} にアップ！<br>HPも10回復した。`, "clear", [{text:"OK", action:checkDrop}]); }, 800); } else { setTimeout(checkDrop, 800); }
}

function checkDrop() {
    if(stage === 5 || (stage === 4 && floor === 6)) { nextStep(); return; }
    const isBoss = (floor === 5); let dropRate = isBoss ? 1.0 : 0.3; if (dropGuaranteed) dropRate = 1.0;
    if(Math.random() < dropRate) { waitingForChest = true; elEnemyImg.style.display = "none"; elChestImg.style.display = "block"; elChestImg.classList.add("chest-shine"); playSE("se-chest"); addLog("宝箱を見つけた！", "log-item"); } else { nextStep(); }
}

function openChest() {
    if(!waitingForChest) return; waitingForChest = false; playSE("se-item");
    let seedRate = 0.15; if (weakHitCount >= 3) seedRate = 1.0; else if (weakHitCount >= 2) seedRate = 0.50;
    const rand = Math.random(); let itemName = ""; let itemEffect = "";
    if (rand < seedRate) { itemName = "★命の種"; itemEffect = "MaxHP +10"; player.items.seed++; } else if (Math.random() < 0.6) { itemName = "薬草"; itemEffect = "HP 50 回復"; player.items.potion++; } else { itemName = "魔法の聖水"; itemEffect = "MP 3 回復"; player.items.ether++; }
    updateInfo(); addLog(`宝箱: ${itemName} (${itemEffect}) を手に入れた`, "log-item");
    showDialog("TREASURE!", `<span style="font-size:24px;color:#00ff00;">${itemName}</span> を手に入れた！<br>${itemEffect}<br>(アイテムボタンで使用可能)`, "item", [{text:"OK", action:nextStep}]);
}

function nextStep() {
    floor++; const ppr = totalDarts>0 ? ((totalScore/totalDarts)*3).toFixed(1) : 0;
    if((floor > 5 && stage !== 4) || (stage === 4 && floor > 6)) {
        const stageTurns = totalGameTurns - stageStartTurn;
        const [rank, dpBonus] = calculateStageRank(stage, stageTurns);
        const scoreDP = Math.floor(totalScore * 0.2); 
        let pendingBonusDP = dpBonus; clearedStagesLog.forEach(log => { pendingBonusDP += log.dp; });
        let potentialTotalDP = scoreDP + pendingBonusDP;
        clearedStagesLog.push({ stage: stage, rank: rank, dp: dpBonus });
        const currentBest = savedData.bestRanks[stage]; const ranksOrder = ["SSS", "S", "A", "B", "C"];
        if (!currentBest || ranksOrder.indexOf(rank) < ranksOrder.indexOf(currentBest)) { savedData.bestRanks[stage] = rank; }
        playBGM("bgm-win");

        if(stage === 5) {
            const res = finishSession("EXTRA-WIN", parseFloat(ppr));
            showDialog("★ TRUE ENDING ★", `<span style="font-size:30px;color:#f0f;">THE LEGEND!!</span><br>最強の黒竜を倒した！<br><br>RANK: <span style="font-size:24px;color:${getRankColor(rank)};">${rank}</span><br>PPR: ${ppr}<br><br><span style="color:#ffd700; font-size:24px; font-weight:bold;">GET DP: +${res.gainedDP}</span>`, "clear", [{text:"TITLE", action:returnToTitle}]);
            return;
        }
        if(stage === 4) {
            const res = finishSession("WIN", parseFloat(ppr));
            showDialog("STAGE 4 CLEAR!", `<span style="font-size:28px;color:#e0b0ff;">NIGHTMARE CONQUERED!</span><br>RANK: <span style="font-size:24px;color:${getRankColor(rank)};">${rank}</span><br><br><span style="color:#ffd700; font-size:24px; font-weight:bold;">GET DP: +${res.gainedDP}</span>`, "clear", [{text:"TITLE", action:returnToTitle}]);
            return;
        }
        let msg = `STAGE ${stage} COMPLETED!<br>RANK: <span style="font-size:24px;color:${getRankColor(rank)};">${rank}</span><br><br>現在の獲得予定DP: <span style="color:#ffd700; font-weight:bold;">${potentialTotalDP} DP</span>`;
        const btnNext = { text: "⛺ 次へ進む (繰越)", action: () => { player.hp = Math.min(player.hp + 30, player.maxHp); initGameSession(stage + 1, true); } };
        const btnExtra = { text: "⚠️ EXTRA STAGE", action: () => { player.hp = Math.min(player.hp + 30, player.maxHp); initGameSession(5, true); } };
        const btnReturn = { text: "🏠 帰還する (確定)", action: () => { const res = finishSession("RETURN", parseFloat(ppr)); showDialog("MISSION COMPLETE", `帰還しました。<br><br><span style="color:#ffd700; font-size:24px; font-weight:bold;">GET DP: +${res.gainedDP}</span>`, "clear", [{text:"TITLE", action:returnToTitle}]); } };
        let buttons = (stage === 3 && parseFloat(ppr) >= 70.0) ? [btnExtra, btnReturn] : [btnNext, btnReturn];
        if (stage === 3 && parseFloat(ppr) < 70.0) { msg += "<br><br>全てのエリアを踏破した！"; buttons = [{ text: "🏠 ALL CLEAR", action: () => { const res = finishSession("WIN", parseFloat(ppr)); showDialog("ALL CLEAR!", `おめでとうございます！<br><br><span style="color:#ffd700; font-size:24px; font-weight:bold;">GET DP: +${res.gainedDP}</span>`, "clear", [{text:"TITLE", action:returnToTitle}]); } }]; }
        showDialog("STAGE CLEAR", msg, "clear", buttons);
    } else {
        spawnEnemy();
    }
}

function loseBattle() {
    const ppr = totalDarts>0 ? ((totalScore/totalDarts)*3).toFixed(1) : 0;
    const res = finishSession("LOSE", parseFloat(ppr));
    playBGM("bgm-lose");
    let reached = (stage===5) ? "EXTRA" : (stage===4 ? `STAGE 4-${floor}F` : `STAGE ${stage}-${floor}F`);
    showDialog("GAME OVER", `到達: ${reached}<br>PPR: ${ppr} <span class='rt-badge'>Rt ${calculateRating(ppr)}</span><br><br><span style="color:#ffd700; font-size:20px;">GET DP: +${res.gainedDP}</span>`, "warning", [{text:"TITLE", action:returnToTitle}]);
}

function returnToTitle() { playBGM("bgm-title"); elContainer.classList.remove("boss-mode","extra-mode"); elGame.style.display="none"; elTitle.style.display="flex"; updateTitleScore(); }

function useItem(type) {
    if(isProcessing || waitingForChest) return;
    if(type === 'potion' && player.items.potion > 0) { player.items.potion--; playSE("se-heal"); const old=player.hp; player.hp=Math.min(player.hp+50, player.maxHp); addLog(`アイテム: 薬草使用`, "log-item"); animateValue(elPlayerHP, old, player.hp, 500); updateInfo(); }
    else if(type === 'ether' && player.items.ether > 0) { player.items.ether--; playSE("se-heal"); player.mp=Math.min(player.mp+3, player.maxMp); addLog(`アイテム: 聖水使用 (MP+3)`, "log-item"); updateInfo(); }
    else if(type === 'seed' && player.items.seed > 0) { player.items.seed--; playSE("se-buff"); player.maxHp+=10; const old=player.hp; player.hp=Math.min(player.hp+10, player.maxHp); addLog(`アイテム: 命の種使用`, "log-item"); animateValue(elPlayerHP, old, player.hp, 500); updateInfo(); }
}

function drawCard() {
    if (player.deck.length === 0) return;
    const cardId = player.deck.pop();
    player.hand.push(cardId);
    updateInfo();
}

function playHandCard(index) {
    if(isProcessing || waitingForChest) return;
    const cardId = player.hand[index];
    const card = CARD_DB.find(c => c.id === cardId);
    let cost = card.cost;
    if (player.mp < cost) { addLog("MPが足りません！", "log-system"); playSE("se-warning"); return; }
    playSE("se-buff"); player.mp -= cost;
    applyCardEffect(card);
    player.hand.splice(index, 1); player.discard.push(cardId); drawCard();
    updateInfo();
}

// --- SHOP & COLLECTION ---
function openCardShop() {
    playSE("se-tap"); const list = document.getElementById("pack-list"); list.innerHTML = "";
    document.getElementById("shop-dp-display").innerText = savedData.dp;
    PACK_DATA.forEach(pack => {
        const isUnlocked = (savedData.bestRanks && savedData.bestRanks[pack.unlockStage]);
        if (!isUnlocked) return; 
        const canBuy = savedData.dp >= pack.price;
        const imgHTML = `<img src="${pack.img}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"><div style="display:none; width:100%; height:100%; align-items:center; justify-content:center; font-size:50px; background:#333; color:#555;">📦</div>`;
        const div = document.createElement("div"); div.className = "pack-item";
        div.innerHTML = `<div class="pack-img-container">${imgHTML}</div><div class="pack-name">${pack.name}</div><div class="pack-desc">${pack.desc}</div><button class="pack-buy-btn" ${canBuy ? "" : "disabled"} onclick="buyPack('${pack.id}')">${canBuy ? `BUY (${pack.price} DP)` : "LACK DP"}</button>`;
        list.appendChild(div);
    });
    if (list.innerHTML === "") { list.innerHTML = "<div style='color:#666; width:100%; text-align:center;'>STAGE 1 CLEAR REQUIRED</div>"; }
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
    const hasHighRare = results.some(r => r.card.rarity === "SR" || r.card.rarity === "UR");
    if (hasHighRare) setTimeout(() => playSE("se-win"), 300); else playSE("se-buff");
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
    if (deckCount < 12) { countEl.style.color = "#ff5555"; countEl.innerText += " (あと" + (12 - deckCount) + "枚)"; } else { countEl.style.color = "#00ff00"; countEl.innerText += " (OK!)"; }

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
    const imgPath = `assets/cards/${card.id}.png`; const fallbackIcon = card.type === "MAGIC" ? "🪄" : "⛓️";
    div.innerHTML = `<div class="card-count-badge">x${isDeckItem ? 1 : remainingCount}</div><div class="card-art"><img src="${imgPath}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"><div class="card-placeholder" style="display:none;">${fallbackIcon}</div></div><div class="card-info"><div class="card-name">${card.name}</div><div class="card-type">[${card.type}]</div></div>`;
    div.onclick = function() { if (isDeckItem) removeFromDeck(card.id); else addToDeck(card.id); };
    return div;
}

function addToDeck(cardId) {
    if (savedData.deck.length >= 12) { alert("デッキは12枚までです！"); return; }
    const ownedCount = savedData.cards[cardId] || 0; const currentInDeck = savedData.deck.filter(id => id === cardId).length;
    if (currentInDeck >= ownedCount) { alert("これ以上持っていません！"); return; }
    if (currentInDeck >= 3) { alert(`「${getCardName(cardId)}」は3枚までです。`); return; }
    playSE("se-tap"); savedData.deck.push(cardId); saveToDrive(); renderDeckEditor(); 
}

function removeFromDeck(cardId) {
    playSE("se-tap"); const index = savedData.deck.indexOf(cardId);
    if (index > -1) { savedData.deck.splice(index, 1); } saveToDrive(); renderDeckEditor();
}

function getCardName(id) { const c = CARD_DB.find(card => card.id === id); return c ? c.name : "カード"; }

// --- UTILS ---
function addLog(t, type="") { const d=document.createElement("div"); d.innerHTML=t; if(type) d.className="log-"+type; elLog.prepend(d); }
function showDialog(title, text, type="normal", buttons=[{text:"OK", action:null}]) {
    elModalTitle.innerText = title; elModalText.innerHTML = text; elModalBox.className = "modal-box"; elModalTitle.style.color = "#f9a826";
    if (type === "clear") { elModalBox.classList.add("modal-clear"); elModalTitle.style.color = "#fff"; } else if (type === "warning") { elModalBox.classList.add("modal-warning"); elModalTitle.style.color = "#ff0000"; } else if (type === "item") { elModalBox.classList.add("modal-item"); elModalTitle.style.color = "#00ff00"; }
    elModalBtns.innerHTML = ""; buttons.forEach(b => {
        const btn = document.createElement("button"); btn.className = "modal-btn"; btn.innerText = b.text;
        btn.onclick = function() { playSE("se-tap"); elModal.style.display = "none"; if(b.action) b.action(); };
        elModalBtns.appendChild(btn);
    });
    elModal.style.display = "flex";
}
function triggerEffect(el, dmg, isP, isWeak=false) {
    el.classList.remove("shake-small", "shake-medium", "shake-heavy", "shake-ultimate"); void el.offsetWidth;
    if(dmg >= 100) { el.classList.add("shake-ultimate"); playSE("se-boom"); elOverlay.className = "flash-gold"; setTimeout(()=>elOverlay.className="", 800); }
    else if(dmg >= 50) { el.classList.add("shake-heavy"); playSE("se-boom"); elOverlay.className = isP ? "flash-red" : "flash-white"; setTimeout(()=>elOverlay.className="", 300); }
    else { el.classList.add(dmg>=20 ? "shake-medium" : "shake-small"); playSE("se-hit"); }
    const pop = document.createElement("div"); pop.innerText=dmg; if(dmg >= 100) pop.className="damage-popup dmg-ultimate"; else if(dmg >= 50) pop.className="damage-popup dmg-heavy"; else if(dmg >= 20) pop.className="damage-popup dmg-medium"; else pop.className="damage-popup dmg-small";
    pop.style.left="50%"; pop.style.top="50%"; el.appendChild(pop); setTimeout(()=>pop.remove(),1500);
}
function animateValue(obj, s, e, d) { if(obj) obj.innerHTML = e; }
function showHistory() {
    const list = document.getElementById("history-list"); list.innerHTML = "";
    if(!savedData.history || savedData.history.length === 0) { list.innerHTML = "<div style='padding:20px; text-align:center;'>NO HISTORY</div>"; }
    else {
        savedData.history.forEach(h => {
            let resClass = "res-lose"; let resStr = h.result || "LOSE";
            if (resStr.includes("WIN") || resStr.includes("CLEAR")) resClass = "res-win";
            if (resStr.includes("EXTRA")) resClass = "res-extra";
            let stgName = h.stgName ? h.stgName : (h.stage === 5 ? "EXTRA" : "S" + h.stage + "-" + h.floor + "F");
            let dpText = (h.dp !== undefined) ? `+${h.dp} DP` : ""; let pprVal = h.ppr !== undefined ? h.ppr : (h.avg !== undefined ? h.avg : 0);
            list.innerHTML += `<div class='h-row'><div>${h.date}</div><div>${stgName}</div><div class='${resClass}'>${resStr}</div><div>${dpText}<br>Avg ${pprVal.toFixed(1)}</div></div>`;
        });
    }
    playSE("se-tap"); document.getElementById("history-modal").style.display = "flex";
}

function tapKey(key) {
    if (elGame.style.display === "none" || isProcessing) return;
    if(key === 'ENT') handleEnter();
    else if (key === 'BS') { if (currentInput.length > 0) currentInput = currentInput.slice(0, -1); else if (turnInputs.length > 0) currentInput = "" + turnInputs.pop(); playSE("se-tap"); updateScoreDisplay(); }
    else { if (currentInput.length < 3) { playSE("se-tap"); currentInput += key; updateScoreDisplay(); } }
}

// Debug
let cheatCodeInput = ""; let cheatTimeout;
document.addEventListener("keydown", function(e) {
    const titleScreen = document.getElementById("title-screen"); if (!titleScreen || titleScreen.style.display === "none") return;
    if (e.key === "1") { cheatCodeInput += "1"; clearTimeout(cheatTimeout); cheatTimeout = setTimeout(() => { cheatCodeInput = ""; }, 2000); if (cheatCodeInput.includes("1111")) { cheatCodeInput = ""; savedData.dp += 2000; saveToDrive(); playSE("se-buff"); updateTitleScore(); alert(`[DEBUG MODE]\nDP +2000\nCurrent DP: ${savedData.dp}`); } } else { cheatCodeInput = ""; }
});