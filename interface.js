console.log("★ interface.js is loaded!");

// --- UI CONSTANTS & ELEMENTS ---
// DOM要素の取得は main.js からこちらに移動
const btnD1=document.getElementById("btn-d1"); const btnD2=document.getElementById("btn-d2"); const btnD3=document.getElementById("btn-d3");
const btnPotion=document.getElementById("btn-potion"); const btnEther=document.getElementById("btn-ether"); const btnSeed=document.getElementById("btn-seed");
const elEnemyHP=document.getElementById("enemy-hp"); const elPlayerHP=document.getElementById("player-hp");
let displayPlayerHP=100; let displayEnemyHP=100;

// --- INITIALIZATION ---
initSlotScreen();

// --- BUTTON ACTIONS ---
function selectSlot(n) {
    currentSlot = "slot"+n; const key = currentSlot;
    if(!allSaveData[key]) { allSaveData[key] = { highScore: { stage: 1, floor: 1, avg: 0.0 }, history: [], clearedExtra: false, dp: 0, bestRanks: { 1: null, 2: null, 3: null, 4: null, 5: null }, unlockedStage4: false, deck: [], cards: {} }; }
    savedData = allSaveData[key];
    if(savedData.deck === undefined) savedData.deck = [];
    if(savedData.cards === undefined) savedData.cards = {};
    allSaveData.lastPlayed = n;
    updateTitleScore(); playSE("se-tap");
    document.getElementById("slot-screen").style.display = "none"; document.getElementById("title-screen").style.display = "flex";
    playBGM("bgm-title");
}

function backToSlots() { stopAllBGM(); document.getElementById("title-screen").style.display = "none"; document.getElementById("slot-screen").style.display = "flex"; initSlotScreen(); }

// --- BATTLE UI UPDATES ---
function updateInfo() {
    if (!enemy.data) return;

    const elStage = document.getElementById("stage-display");
    const elFloor = document.getElementById("floor-display");
    const elTurn = document.getElementById("turn-display");

    if(stage===5) { elStage.innerText="EXTRA"; elFloor.innerText="FINAL"; }
    else if(stage===4) { elStage.innerText="STAGE 4"; elFloor.innerText=`${floor}F`; }
    else { elStage.innerText=`STAGE ${stage}`; elFloor.innerText=`${floor}F`; }
    elTurn.innerText=`TURN ${currentTurn}`;

    const elName = document.getElementById("enemy-name"); elName.innerText = enemy.name;
    elName.style.fontSize = (enemy.name.length > 12) ? "12px" : (enemy.name.length > 9 ? "15px" : "18px");

    document.getElementById("enemy-hp-value").innerText = enemy.hp;
    const elWeak = document.getElementById("weak-display");
    let weakText = ""; 
    if(player.state.weakLock) { weakText = "<span style='color:#f0f; animation:blink 0.5s infinite;'>★ WEAK LOCK ACTIVE ★</span>"; }
    else if(weakHitCount > 0) { weakText = "<span style='color:#ffa500;'>DROP CHANCE UP!</span>"; }
    else { weakText = "WEAK: " + enemy.data.weak + "+"; }
    elWeak.innerHTML = weakText;

    document.getElementById("enemy-hp-bar").style.width=Math.max(0,(enemy.hp/enemy.maxHp)*100)+"%"; 
    
    // Player Status
    document.getElementById("player-hp-bar").style.width=Math.max(0,(player.hp/player.maxHp)*100)+"%";
    document.getElementById("player-hp").innerText = player.hp; 
    document.getElementById("player-max-hp").innerText = player.maxHp;

    // MP Dots
    const mpContainer = document.getElementById("player-mp-bar");
    mpContainer.innerHTML = ""; 
    mpContainer.style.width = "100%"; 
    for(let i=0; i < player.maxMp; i++) {
        const dot = document.createElement("div");
        dot.className = "mp-dot";
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
    const elEnemyPanel = document.getElementById("enemy-panel");

    elPlayerBuff.style.display = (player.state.power || player.state.nextShotMult > 1) ? "block" : "none";
    if(player.state.nextShotMult > 1) elPlayerBuff.innerText = "NEXT x2";
    else elPlayerBuff.innerText = "ATK x1.5";

    elPlayerGuard.style.display = player.state.shield ? "block" : "none";
    elEnemyBuff.style.display = enemy.state.charge ? "block" : "none";
    elEnemyGuard.style.display = (enemy.state.guard || enemy.state.guardType) ? "block" : "none";
    
    if (player.state.weakLock || dropGuaranteed) {
        elEnemyDrop.style.display = "block";
        elEnemyPanel.classList.add("drop-chance");
    } else {
        elEnemyDrop.style.display = "none";
        elEnemyPanel.classList.remove("drop-chance");
    }
    
    if (stage !== 5) {
        elEnemyPanel.classList.remove("mode-charge", "mode-guard");
        if (enemy.state.charge) elEnemyPanel.classList.add("mode-charge");
        if (enemy.state.guard || enemy.state.guardType) elEnemyPanel.classList.add("mode-guard");
    }
}

function renderHand() {
    const handArea = document.getElementById("hand-area");
    handArea.innerHTML = "";
    
    if (player.deckLocked) {
        document.getElementById("battle-deck-count").innerText = "-";
        handArea.innerHTML = `<div class="hand-locked-msg">⚠️ NO DECK (DARTS ONLY)</div>`;
    } else {
        document.getElementById("battle-deck-count").innerText = player.deck.length;
        if (player.hand.length === 0) {
             handArea.innerHTML = `<div class="hand-card-empty">NO CARD</div>`;
        } else {
            player.hand.forEach((cardId, index) => {
                const card = CARD_DB.find(c => c.id === cardId);
                let cost = card.cost; // data.jsから取得

                const div = document.createElement("div");
                div.className = "hand-card";
                if (player.mp < cost) div.classList.add("disabled");

                const imgPath = `assets/cards/${card.id}.png`;
                div.innerHTML = `
                    <div class="hand-cost">${cost}</div>
                    <div class="card-art" style="height:100%; border:none;">
                        <img src="${imgPath}" onerror="this.style.display='none'">
                    </div>
                    <div style="position:absolute; bottom:0; width:100%; font-size:8px; text-align:center; background:rgba(0,0,0,0.7); color:#fff;">${card.name}</div>
                `;
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

// --- UTILITIES ---
function addLog(t, type="") { const d=document.createElement("div"); d.innerHTML=t; if(type) d.className="log-"+type; document.getElementById("battle-log").prepend(d); }
function triggerEffect(el, dmg, isP, isWeak=false) {
    el.classList.remove("shake-small", "shake-medium", "shake-heavy", "shake-ultimate"); void el.offsetWidth;
    if(dmg >= 100) { el.classList.add("shake-ultimate"); playSE("se-boom"); document.getElementById("flash-overlay").className = "flash-gold"; setTimeout(()=>document.getElementById("flash-overlay").className="", 800); }
    else if(dmg >= 50) { el.classList.add("shake-heavy"); playSE("se-boom"); document.getElementById("flash-overlay").className = isP ? "flash-red" : "flash-white"; setTimeout(()=>document.getElementById("flash-overlay").className="", 300); }
    else { el.classList.add(dmg>=20 ? "shake-medium" : "shake-small"); playSE("se-hit"); }
    const pop = document.createElement("div"); pop.innerText=dmg; if(dmg >= 100) pop.className="damage-popup dmg-ultimate"; else if(dmg >= 50) pop.className="damage-popup dmg-heavy"; else if(dmg >= 20) pop.className="damage-popup dmg-medium"; else pop.className="damage-popup dmg-small";
    pop.style.left="50%"; pop.style.top="50%"; el.appendChild(pop); setTimeout(()=>pop.remove(),1500);
}
function animateValue(obj, s, e, d) { if(obj) obj.innerHTML = e; }