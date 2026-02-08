console.log("★ main.js loaded (v2.14.0 Data-Driven & Complete UI)");

// =========================================
// 1. UTILITY & AUDIO
// =========================================
const el = (id) => document.getElementById(id);

function calculateRating(ppr) {
    if (ppr < 30) return 1; if (ppr < 40) return 2; if (ppr < 45) return 3;
    if (ppr < 50) return 4; if (ppr < 55) return 5; if (ppr < 60) return 6;
    if (ppr < 65) return 7; if (ppr < 70) return 8; if (ppr < 75) return 9;
    if (ppr < 80) return 10; if (ppr < 85) return 11; if (ppr < 90) return 12;
    if (ppr < 95) return 13; if (ppr < 100) return 14; if (ppr < 110) return 15;
    if (ppr < 120) return 16; if (ppr < 130) return 17; return 18;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function animateValue(obj, start, end, duration) { if (obj) obj.innerHTML = end; }

// --- AUDIO SYSTEM ---
let gameConfig = { bgmVolume: 0.3, sysVolume: 0.5, atkVolume: 0.8 };
let currentBgmId = "";

function loadGameConfig() {
    const saved = localStorage.getItem("darts_quest_config");
    if (saved) try { gameConfig = { ...gameConfig, ...JSON.parse(saved) }; } catch (e) {}
}
loadGameConfig();

function saveGameConfig() { localStorage.setItem("darts_quest_config", JSON.stringify(gameConfig)); }

function stopAllBGM() {
    ["bgm-title", "bgm-battle", "bgm-boss", "bgm-extra", "bgm-win", "bgm-lose"].forEach(id => {
        const a = el(id); if (a) { a.pause(); a.currentTime = 0; }
    });
    currentBgmId = "";
}

function playBGM(id) {
    if (currentBgmId === id) return;
    stopAllBGM();
    const a = el(id);
    if (a) { currentBgmId = id; a.volume = gameConfig.bgmVolume; a.play().catch(e=>{}); }
}

function updateCurrentBgmVolume() {
    if (currentBgmId) { const a = el(currentBgmId); if(a) a.volume = gameConfig.bgmVolume; }
}

function playSE(id) {
    const a = el(id);
    if (a) {
        a.currentTime = 0;
        const atk = ["se-hit","se-weak","se-attack","se-boom","se-single","se-double","se-triple","se-bull","se-dbull"];
        a.volume = atk.includes(id) ? gameConfig.atkVolume : gameConfig.sysVolume;
        if (a.volume > 0.01) a.play().catch(e=>{});
    }
}

// =========================================
// 2. VISUAL EFFECTS
// =========================================
function triggerFloatText(text, targetEl) {
    if (!targetEl) return;
    const f = document.createElement("div"); f.className = "float-text-box"; f.innerText = text;
    const r = targetEl.getBoundingClientRect(); document.body.appendChild(f);
    f.style.left = `${r.left + r.width/2 - 30}px`; f.style.top = `${r.top}px`; f.style.position = "fixed";
    setTimeout(() => f.remove(), 1500);
}

function triggerEffect(tgt, dmg, isPlayer, isHeal=false) {
    if (!isHeal && dmg > 0) {
        const shake = dmg > 50 ? "shake-heavy" : "shake-small";
        const c = el("game-container"); c.classList.remove("shake-small","shake-heavy");
        void c.offsetWidth; c.classList.add(shake); setTimeout(()=>c.classList.remove(shake), 500);
    }
    const pop = document.createElement("div"); pop.className = "damage-float";
    if (isHeal) pop.classList.add("heal"); else if (dmg === 0) pop.classList.add("miss");
    if (!isPlayer && !isHeal && dmg > 0) pop.classList.add("enemy-dmg");
    pop.innerText = dmg === 0 ? "MISS" : dmg;
    el("game-screen").appendChild(pop);
    setTimeout(() => pop.remove(), 1500);
}

function resizeGame() {
    const s = el('game-scaler'); if (!s) return;
    if (window.innerWidth >= 900) {
        const scale = Math.min(window.innerWidth/900, window.innerHeight/620) * 0.95;
        s.style.transform = `scale(${scale})`; s.style.width = "900px"; s.style.height = "620px"; s.style.position = "static";
        document.body.style.overflow = "hidden";
    } else {
        s.style.transform = "none"; s.style.width = "100%"; s.style.height = "auto";
        document.body.style.overflowY = "auto";
    }
}

function announce(text, type="normal") {
    const a = el("battle-announcer") || document.createElement("div"); a.id="battle-announcer";
    if(!a.parentNode) el("enemy-panel").appendChild(a);
    a.innerHTML = text; a.className = "announcer-visible";
    if (type.includes("danger") || type.includes("enemy")) a.classList.add("ann-danger");
    if (type.includes("skill") || type.includes("weak")) a.classList.add("ann-warn");
    setTimeout(() => a.className = "", 2000);
}

function addLog(text, type="") {
    console.log(`[${type}] ${text}`);
    if ((type.includes("log") || text.includes("WEAK") || text.includes("回復")) && !text.includes("倒した") && !text.includes("宝箱")) announce(text, type);
}

// =========================================
// 3. GLOBAL STATE
// =========================================
let player = {
    hp: 100, maxHp: 100, mp: 3, maxMp: 10, items: { potion:0, ether:0, seed:0 },
    state: { power: false, shield: false, weakLock: false, barrier: false, guardTurn: 0, magicCylinder: false, hexSeal: false, huge: 0, atkBonus: 0, itemLock: false },
    deck: [], hand: [], discard: [], deckLocked: false, setCard: null
};

// New Standardized Enemy State
let enemy = {
    hp: 100, maxHp: 100, data: null, name: "",
    state: {
        stun: false,
        guard: 0,       // 0.0 ~ 1.0 (Reduction Rate)
        guardTurn: 0,
        barrier: 0,     // Threshold
        buffAtk: 0,     // Attack Buff (e.g. 0.1 for 10%)
        chargeSkill: null, // Queued Skill ID
        flags: {}       // toon, restrict, seal_item, etc.
    }
};

let stage = 1, floor = 1;
let totalScore = 0, totalDarts = 0, currentTurn = 1, totalGameTurns = 0, stageStartTurn = 0;
let isProcessing = false, dropGuaranteed = false, weakHitCount = 0;
let turnInputs = [], currentInput = "";
let isJustFinish = false, waitingForChest = false;
let clearedStagesLog = [];
let restrictInput = false; // Used for binding (replaces raw variable with flag check)

let allSaveData = { "slot1": null, "slot2": null, "slot3": null, "lastPlayed": 1 };
let currentSlot = "slot1";
let savedData = { highScore: { stage:1, floor:1, avg:0.0 }, history:[], clearedExtra:false, dp:0, bestRanks:{}, unlockedStage4:false, deck:[], cards:{} };

// =========================================
// 4. INIT & SAVE
// =========================================
window.onload = () => { resizeGame(); loadGameData(); initSlotScreen(); if(window.innerWidth<900) document.body.style.overflowY="auto"; };
window.onresize = resizeGame;

function loadGameData() {
    const s = localStorage.getItem(SAVE_KEY);
    if (s) try { allSaveData = JSON.parse(s); } catch (e) {}
    if (!allSaveData.slot1) allSaveData.slot1 = null;
}
function saveToDrive() {
    allSaveData[currentSlot] = savedData; localStorage.setItem(SAVE_KEY, JSON.stringify(allSaveData));
}
function initSlotScreen() {
    for (let i=1; i<=3; i++) {
        const d = allSaveData["slot"+i];
        const elInfo = el("info-"+i);
        if(!d) elInfo.innerHTML = "<div class='slot-empty'>NO DATA<br>- Start New Game -</div>";
        else {
            let stgName = d.highScore.stage===5?"EXTRA":(d.highScore.stage===6?"STAGE 5":`STAGE ${d.highScore.stage}`);
            let badge = d.clearedExtra ? "<br><span style='color:#f0f;font-weight:bold;'>★ EXTRA CLEARED</span>" : "";
            elInfo.innerHTML = `<div>${stgName} - ${d.highScore.floor}F</div><div style='color:#fd0'>Avg: ${d.highScore.avg.toFixed(1)} (Rt ${calculateRating(d.highScore.avg)})</div><div style='color:#aaa;font-size:12px;'>DP: ${d.dp||0}${badge}</div>`;
        }
    }
}
function selectSlot(n) {
    currentSlot = "slot"+n;
    if (!allSaveData[currentSlot]) allSaveData[currentSlot] = { highScore:{stage:1,floor:1,avg:0.0}, history:[], clearedExtra:false, dp:0, bestRanks:{}, unlockedStage4:false, deck:[], cards:{} };
    savedData = allSaveData[currentSlot];
    if (!savedData.deck) savedData.deck = [];
    if (!savedData.cards) savedData.cards = {};
    updateTitleScore(); playSE("se-tap"); playBGM("bgm-title");
    el("slot-screen").style.display = "none"; el("title-screen").style.display = "flex";
}
function backToSlots() { stopAllBGM(); el("title-screen").style.display = "none"; el("slot-screen").style.display = "flex"; initSlotScreen(); }
function updateTitleScore() {
    let s = savedData.highScore.stage === 5 ? "EXTRA" : (savedData.highScore.stage === 6 ? "STAGE 5" : `STAGE ${savedData.highScore.stage}`);
    el("hs-reach").innerText = `${s} - ${savedData.highScore.floor}F`;
    el("hs-avg").innerText = savedData.highScore.avg.toFixed(1);
    el("hs-rt").innerText = "Rt " + calculateRating(savedData.highScore.avg);
    el("dp-display").innerText = "DP: " + (savedData.dp || 0);
    if (!document.getElementById("btn-config-entry")) {
        const btn = document.createElement("div"); btn.id="btn-config-entry"; btn.className="config-btn-title"; btn.innerText="⚙️ CONFIG"; btn.onclick=openConfigModal;
        el("title-screen").appendChild(btn);
    }
}

// =========================================
// 5. GAME FLOW
// =========================================
function initGameSession(stg, cont=false) {
    if (!cont) {
        player = { hp:100, maxHp:100, mp:3, maxMp:10, items:{potion:0,ether:0,seed:0}, state:{power:false,shield:false,weakLock:false,barrier:false,guardTurn:0,magicCylinder:false,hexSeal:false,huge:0,atkBonus:0,itemLock:false}, deck:[], hand:[], discard:[], deckLocked:false, setCard:null };
        totalGameTurns=0; totalScore=0; totalDarts=0; clearedStagesLog=[];
    }
    startTransition(stg, cont);
}

function startTransition(sel, cont) {
    let titles = {1:["旅立ちの森","Forest"],2:["荒れ狂う荒野","Wasteland"],3:["誘惑の迷宮","Labyrinth"],4:["幻想の狂宴","Nightmare"],5:["燃えたぎる火口","Volcano"],6:["神の試練","God's Trial"]};
    let t = titles[sel];
    el("chapter-title").innerText = `STAGE ${sel} ${t[0]}`; el("chapter-sub").innerText = t[1];
    const ch = el("chapter-screen");
    if(sel>=4) { playSE("se-warning"); ch.classList.add("chapter-extra"); } else { playSE("se-tap"); ch.classList.remove("chapter-extra"); }
    
    el("black-curtain").classList.add("fade-in");
    setTimeout(() => {
        el("title-screen").style.display="none"; ch.style.display="flex"; ch.style.opacity=1;
        setupStage(sel, cont);
        setTimeout(() => { ch.style.opacity=0; setTimeout(()=>{ ch.style.display="none"; el("black-curtain").classList.remove("fade-in"); },1000); }, sel>=4?4000:2500);
    }, 1000);
}

function setupStage(sel, cont) {
    stage = sel; floor = 1; isProcessing = false; currentTurn = 1; stageStartTurn = totalGameTurns;
    if (!cont) totalDarts = 0;
    el("avg-display").innerText = "0.0"; el("rt-display").innerText = "(Rt -)"; el("battle-log").innerHTML = "";
    el("game-screen").style.display = "block";
    player.state = { power:false, shield:false, weakLock:false, barrier:false, guardTurn:0, magicCylinder:false, hexSeal:false, huge:0, atkBonus:0, itemLock:false };
    player.setCard = null;
    
    if (!cont) {
        player.mp = 3; player.deckLocked=false;
        if (!savedData.deck || savedData.deck.length < DECK_SIZE) { player.deckLocked = true; player.deck=[]; player.hand=[]; player.discard=[]; addLog("⚠ Deck Incomplete", "log-system"); }
        else { player.deck = shuffleArray([...savedData.deck]); player.hand=[]; player.discard=[]; for(let i=0;i<INITIAL_HAND;i++) drawCard(true); }
    } else addLog(">> Stage Continued", "log-system");
    spawnEnemy(); resizeGame();
}

function spawnEnemy() {
    if (player.hp <= 0) return;
    enemy.state = { stun:false, guard:0, guardTurn:0, barrier:0, buffAtk:0, chargeSkill:null, flags:{} };
    player.state.power=false; player.state.weakLock=false; player.state.atkBonus=0;
    
    currentTurn = 1; turnInputs = []; currentInput = ""; dropGuaranteed = false; weakHitCount = 0; restrictInput=false; isJustFinish=false; waitingForChest=false;
    updateScoreDisplay();
    
    el("flash-overlay").className=""; el("game-container").classList.remove("shake-heavy","shake-small"); el("game-container").className="container";
    el("boss-label").style.display="none"; el("enemy-img").style.display="block"; el("chest-img").style.display="none";
    
    let bgKey = stage; if (stage===4 && floor>=5) bgKey="4_2"; if(stage===6) bgKey=6;
    if(GAME_DATA.bg[bgKey]) el("game-container").style.backgroundImage = `url('${GAME_DATA.bg[bgKey]}')`;
    
    let list = GAME_DATA.enemies[stage] || GAME_DATA.enemies[1];
    enemy.data = list[(floor-1) % list.length];
    enemy.maxHp = enemy.data.hp || (100 + (stage-1)*50 + (floor-1)*30);
    
    if (floor===5 || (stage===4 && floor===6)) {
        if(!enemy.data.hp) enemy.maxHp+=50;
        el("game-container").classList.add("boss-mode"); el("boss-label").style.display="inline"; playBGM("bgm-boss");
    } else playBGM("bgm-battle");
    
    enemy.name = enemy.data.name; el("enemy-img").src = enemy.data.img;
    enemy.hp = enemy.maxHp;
    
    triggerTrap('summon');
    updateInfo(); addLog(`=== STAGE ${stage} - ${floor}F START ===`, "system");
    
    // Stage 3-1 Initial Skill
    if (stage === 3 && floor === 1) {
        setTimeout(() => { executeEnemySkill(ENEMY_SKILLS["opening_guard"]); }, 500);
    }
}

// =========================================
// 6. BATTLE LOGIC (PLAYER)
// =========================================
function processOneThrow(score) {
    if (enemy.hp <= 0 || player.hp <= 0 || isProcessing) return;
    if (enemy.state.flags.restrict && turnInputs.length > 0) return; // 拘束
    
    let dmg = score;
    let weakHit = false;
    
    // Enemy Defenses
    if (enemy.state.barrier > 0 && dmg < enemy.state.barrier) { dmg=0; addLog(`結界! (${enemy.state.barrier}未満無効)`, "log-enemy"); }
    if (stage===6 && floor===5 && dmg <= 15) { dmg=0; addLog("召雷弾! (15以下無効)", "log-enemy"); }
    
    // Player Buffs
    if (player.state.atkBonus > 0) { dmg += player.state.atkBonus; player.state.atkBonus = 0; }
    if (player.state.power) { dmg = Math.floor(dmg * 2); player.state.power = false; }
    if (player.state.huge !== 0) { dmg = Math.floor(dmg * (player.state.huge===1 ? 3.0 : 0.5)); player.state.huge=0; }
    
    // Weak / Guard
    if (player.state.weakLock || (score >= 51 && enemy.data.weak && (score % enemy.data.weak === 0))) weakHit = true;
    if (stage===4 && floor===4 && currentTurn%3===0) dmg = Math.max(0, dmg - 15);
    if (enemy.state.flags.toon) dmg = Math.max(0, dmg - 15);
    if (enemy.state.guard > 0) { dmg = Math.floor(dmg * (1.0 - enemy.state.guard)); addLog("敵の防御で軽減！", "system"); }
    
    if (enemy.hp - dmg === 0) isJustFinish = true;
    enemy.hp = Math.max(0, enemy.hp - dmg);
    
    totalScore += score; totalDarts++; turnInputs.push(score);
    updateScoreDisplay();
    
    if (weakHit) {
        dropGuaranteed = true; weakHitCount++; addLog("WEAK HIT!!", "log-weak");
        if (!player.state.weakLock) { playSE("se-weak"); el("flash-overlay").className = "flash-purple"; setTimeout(()=>el("flash-overlay").className="",600); }
    }
    player.state.weakLock = false;
    
    triggerEffect(el("enemy-panel"), dmg, false);
    animateValue(el("enemy-hp-value"), 0, enemy.hp, 300);
    updateInfo();
    
    if (enemy.hp <= 0) { isProcessing = true; totalGameTurns++; setTimeout(winBattle, 1000); return; }
    if (turnInputs.length >= 3 || (enemy.state.flags.restrict && turnInputs.length >= 1)) setTimeout(finishPlayerTurn, 1000);
}

function finishPlayerTurn() {
    totalGameTurns++;
    if (enemy.state.flags.restrict) { enemy.state.flags.restrict=false; addLog("束縛が解けた", "log-system"); }
    if (enemy.state.guardTurn > 0) {
        enemy.state.guardTurn--;
        if (enemy.state.guardTurn <= 0) { enemy.state.guard = 0; addLog("敵のガードが消滅", "log-system"); }
    }
    if (player.state.itemLock) { player.state.itemLock=false; addLog("粘着が取れた", "log-system"); }
    enemy.state.flags.toon = false;
    enemy.state.barrier = 0;
    
    turnInputs = []; currentInput = ""; updateScoreDisplay();
    setTimeout(enemyTurn, 500);
}

// =========================================
// 7. AI ENGINE (ENEMY TURN)
// =========================================
function enemyTurn() {
    if (enemy.state.stun) {
        addLog(`${enemy.name}はスタン中`, "log-system"); enemy.state.stun = false; endEnemyTurn(); return;
    }
    if (player.state.hexSeal) addLog("呪縛により攻撃力半減", "log-skill");
    
    if (enemy.state.chargeSkill) {
        const skillId = enemy.state.chargeSkill; enemy.state.chargeSkill = null;
        executeEnemySkill(ENEMY_SKILLS[skillId]); return;
    }
    
    const aiId = enemy.data.ai || "default";
    const patterns = AI_PATTERNS[aiId] || AI_PATTERNS["default"];
    
    for (let p of patterns) {
        if (checkAiCondition(p)) { executeEnemySkill(ENEMY_SKILLS[p.skill]); return; }
    }
    executeEnemySkill(ENEMY_SKILLS["basic_attack"]);
}

function checkAiCondition(p) {
    if (p.cond === "always") return true;
    if (p.cond === "random") return Math.random() < p.val;
    if (p.cond === "turn_mod") return (currentTurn % p.val === 0);
    if (p.cond === "turn_eq") return (currentTurn === p.val);
    if (p.cond === "hp_under") {
        if (enemy.hp / enemy.maxHp <= p.val) return (!p.prob || Math.random() < p.prob);
    }
    if (p.cond === "charge_release") return false; // Handled by state check
    return false;
}

function executeEnemySkill(skill) {
    if (!skill) { endEnemyTurn(); return; }
    if (skill.cutin) showSkillCutin(skill.name, skill.cutin);
    const delay = skill.cutin ? 1200 : 200;
    
    setTimeout(() => {
        if (skill.msg) addLog(skill.msg, "log-enemy");
        
        // State Changes
        if (skill.type === "guard") { enemy.state.guard = skill.val; enemy.state.guardTurn = skill.turn; updateInfo(); endEnemyTurn(); return; }
        if (skill.type === "heal") {
            const h = skill.val === 9999 ? enemy.maxHp : Math.min(enemy.hp + skill.val, enemy.maxHp);
            enemy.hp = h; playSE("se-heal"); triggerEffect(el("enemy-panel"), skill.val, false, true);
            updateInfo(); endEnemyTurn(); return;
        }
        if (skill.type === "charge") { enemy.state.chargeSkill = skill.next; updateInfo(); endEnemyTurn(); return; }
        if (skill.type === "buff") {
            if (skill.state === "toon") enemy.state.flags.toon = true;
            if (skill.state === "barrier") enemy.state.barrier = skill.val;
            if (skill.state === "rage") enemy.state.buffAtk += (skill.val - 1.0);
            if (skill.state === "buff_atk") enemy.state.buffAtk += skill.val;
            updateInfo(); endEnemyTurn(); return;
        }
        if (skill.type === "debuff") {
            if (skill.state === "restrict") { enemy.state.flags.restrict = true; addLog("次1投制限", "log-enemy"); }
            if (skill.state === "seal_item") { player.state.itemLock = true; addLog("アイテム封印", "log-enemy"); }
            if (skill.mpDmg) { player.mp = Math.max(0, player.mp - skill.mpDmg); triggerFloatText(`MP-${skill.mpDmg}`, el("player-mp-dots")); }
            if (!skill.mult && !skill.fixed) { updateInfo(); endEnemyTurn(); return; }
        }
        
        // Attacks
        const count = skill.count || 1;
        const loopAttack = (c) => {
            if (c <= 0) { endEnemyTurn(); return; }
            let base = 0;
            if (skill.fixed) base = skill.fixed;
            else if (skill.fixedAdd) base = Math.floor(skill.fixedAdd * (skill.mult || 1));
            else {
                const rnd = 2 + floor + (stage - 1) * 3 + Math.floor(Math.random()*6);
                base = Math.floor(rnd * (skill.mult || 1.0));
            }
            
            base = Math.floor(base * (1.0 + enemy.state.buffAtk));
            let finalDmg = triggerTrap('attack', base);
            if (finalDmg === 0) { if (c===1) endEnemyTurn(); return; }
            
            if (skill.effect !== "ignore_shield" && player.state.shield) {
                player.state.shield = false; finalDmg = 0; triggerEffect(el("game-screen"), 0, true);
                el("flash-overlay").className = "flash-blue"; setTimeout(()=>el("flash-overlay").className="",300);
                addLog("完全防御！", "log-skill");
            } else if (player.state.guardTurn > 0) {
                finalDmg = Math.floor(finalDmg * 0.5); addLog("護封剣！ダメージ半減", "log-skill");
            }
            
            player.hp = Math.max(0, player.hp - finalDmg);
            if (skill.isUlt) { playSE("se-boom"); el("flash-overlay").className="flash-fire"; setTimeout(()=>el("flash-overlay").className="",600); }
            else playSE(skill.se || "se-hit");
            
            triggerEffect(el("game-screen"), finalDmg, true);
            if (skill.effect === "drain") { const d = Math.floor(finalDmg/2); enemy.hp = Math.min(enemy.maxHp, enemy.hp+d); triggerEffect(el("enemy-panel"), d, false, true); }
            
            updateInfo();
            if (player.hp <= 0) { isProcessing = true; setTimeout(loseGame, 1000); return; }
            if (c > 1) setTimeout(() => loopAttack(c - 1), 600); else endEnemyTurn();
        };
        loopAttack(count);
    }, delay);
}

function triggerTrap(type, dmg=0) {
    if (!player.setCard) return dmg;
    const trap = player.setCard; let ret = dmg; let fired = false;
    
    if (type === 'attack') {
        if (trap===303) { addLog("聖なるバリア！", "log-skill"); playSE("se-boom"); triggerEffect(el("enemy-panel"),50,false); enemy.hp=Math.max(0,enemy.hp-50); ret=0; fired=true; }
        else if (trap===602) { addLog(`魔法の筒！${dmg}反射`, "log-skill"); playSE("se-boom"); triggerEffect(el("enemy-panel"),dmg,false); enemy.hp=Math.max(0,enemy.hp-dmg); ret=0; fired=true; }
        else if (trap===703) { addLog("六芒星！半減＆スタン", "log-skill"); playSE("se-buff"); enemy.state.stun=true; ret=Math.floor(dmg/2); fired=true; }
        else if (trap===403) { addLog("はさみ撃ち！80ダメ", "log-skill"); playSE("se-attack"); triggerEffect(el("enemy-panel"),80,false); enemy.hp=Math.max(0,enemy.hp-80); fired=true; }
    } else if (type === 'summon' && trap===302) {
        addLog("落とし穴！50ダメ＆スタン", "log-skill"); playSE("se-hit"); triggerEffect(el("enemy-panel"),50,false); enemy.hp=Math.max(0,enemy.hp-50); enemy.state.stun=true; fired=true;
    }
    
    if (fired) {
        player.discard.push(player.setCard); player.setCard = null;
        el("flash-overlay").className = "flash-gold"; setTimeout(()=>el("flash-overlay").className="",300);
        updateInfo();
        if (enemy.hp <= 0) setTimeout(winBattle, 800);
    }
    return ret;
}

function endEnemyTurn() {
    currentTurn++;
    player.mp = Math.min(player.mp + 3, player.maxMp);
    triggerFloatText("MP+3", el("player-mp-dots"));
    if (player.state.guardTurn > 0) { player.state.guardTurn--; if(player.state.guardTurn===0) addLog("護封剣 消滅", "log-system"); }
    if (player.state.hexSeal > 0) { player.state.hexSeal--; if(player.state.hexSeal===0) addLog("呪縛が解けた", "log-system"); }
    drawCard(); updateInfo(); isProcessing = false;
}

// =========================================
// 8. WIN & UI & OTHERS
// =========================================
function winBattle() {
    if (player.hp <= 0) return;
    addLog(`${enemy.name} 撃破`, "system");
    player.mp = Math.min(player.mp + 3, player.maxMp); drawCard();
    if (isJustFinish) {
        player.maxHp+=10; player.hp = Math.min(player.hp+10, player.maxHp);
        playSE("se-heal"); addLog("JUST FINISH BONUS!", "heal");
        updateInfo();
        setTimeout(() => showDialog("BONUS", "MaxHP+10 & HP回復", "clear", [{text:"OK", action:checkDrop}]), 800);
    } else setTimeout(checkDrop, 800);
}

function checkDrop() {
    if ((stage===5 && floor===1) || (stage===6 && floor===5) || (stage===4 && floor===6)) { nextStep(); return; }
    let rate = (floor===5) ? 1.0 : (dropGuaranteed ? 1.0 : 0.3);
    if (Math.random() < rate) {
        waitingForChest=true; el("enemy-img").style.display="none"; el("chest-img").style.display="block"; el("chest-img").classList.add("chest-shine");
        playSE("se-chest"); addLog("宝箱発見！", "log-item"); setTimeout(()=> { if(waitingForChest) openChest(); }, 1500);
    } else nextStep();
}

function openChest() {
    if (!waitingForChest) return;
    waitingForChest=false; playSE("se-item");
    let r = Math.random(), item="", eff="";
    if (r < (weakHitCount>=3 ? 1.0 : 0.15)) { item="★命の種"; eff="MaxHP+10"; player.items.seed++; }
    else if (Math.random()<0.6) { item="薬草"; eff="HP50回復"; player.items.potion++; }
    else { item="聖水"; eff="MP3回復"; player.items.ether++; }
    addLog(`宝箱: ${item}`, "log-item");
    showDialog("TREASURE", `${item} (${eff})`, "item", [{text:"OK", action:nextStep}], 2000);
}

function nextStep() {
    floor++;
    let cleared = false;
    if (stage<=3 && floor>5) cleared=true;
    if (stage===4 && floor>6) cleared=true;
    if (stage===5 && floor>1) cleared=true;
    if (stage===6 && floor>5) cleared=true;
    
    if (cleared) {
        const turns = totalGameTurns - stageStartTurn;
        let rank="C", bonus=50;
        if (turns <= 25) { rank="SSS"; bonus=1000; }
        else if (turns <= 35) { rank="S"; bonus=600; }
        else if (turns <= 50) { rank="A"; bonus=300; }
        else if (turns <= 70) { rank="B"; bonus=100; }
        
        savedData.dp += bonus;
        clearedStagesLog.push({ stage: stage, rank: rank, dp: bonus });
        if (!savedData.bestRanks[stage] || rank<savedData.bestRanks[stage]) savedData.bestRanks[stage]=rank;
        playBGM("bgm-win");
        
        // Final Results
        if(stage===5 || stage===6) {
            let resText = stage===5 ? "EXTRA-WIN" : "GOD-WIN";
            let ppr = totalDarts > 0 ? ((totalScore / totalDarts) * 3).toFixed(1) : 0;
            finishSession(resText, ppr);
            showDialog("COMPLETE!", `THE LEGEND!<br>RANK: ${rank}<br>DP: +${bonus}`, "clear", [{text:"TITLE", action:returnToTitle}]);
            return;
        }
        
        showDialog("CLEAR!", `RANK: ${rank}<br>DP: +${bonus}`, "clear", [
            {text:"NEXT (HP+30)", action:()=>{ player.hp = Math.min(player.hp + 30, player.maxHp); initGameSession(stage===4?6:stage+1, true); }},
            {text:"EXIT", action:()=>{ 
                let ppr = totalDarts > 0 ? ((totalScore / totalDarts) * 3).toFixed(1) : 0;
                finishSession("RETURN", ppr); returnToTitle(); 
            }}
        ]);
        
        // Extra Prompt
        if (stage===3) {
            if (savedData.highScore.avg >= 70.0 || savedData.clearedExtra) {
                showDialog("WARNING", "強力な反応を感知...挑戦しますか？", "warning", [
                    {text:"EXTRA STAGE", action:()=>{ player.hp = Math.min(player.hp + 30, player.maxHp); initGameSession(5, true); }},
                    {text:"EXIT", action:returnToTitle}
                ]);
            }
        }
    } else spawnEnemy();
}

function loseGame() { playBGM("bgm-lose"); showDialog("YOU DIED", "...", "warning", [{text:"TITLE", action:returnToTitle}]); }
function returnToTitle() { playBGM("bgm-title"); el("game-container").classList.remove("boss-mode","extra-mode"); el("game-screen").style.display="none"; el("title-screen").style.display="flex"; el("stage-select-screen").style.display="none"; updateTitleScore(); }

// --- UI Updates ---
function updateInfo() {
    if (!enemy.data) return;
    el("stage-display").innerText = stage===5?"EXTRA":(stage===6?"STAGE 5":`STAGE ${stage}`);
    el("floor-display").innerText = stage===5?"FINAL":`${floor}F`;
    el("turn-display").innerText = `TURN ${currentTurn}`;
    el("enemy-name-side").innerText = enemy.name;
    el("enemy-hp-value").innerText = enemy.hp;
    el("weak-display").innerHTML = player.state.weakLock ? "★LOCK" : `WEAK: ${enemy.data.weak}+${weakHitCount>0?" <span style='color:#f0f;'>CHANCE!</span>":""}`;
    
    let chips = "";
    if (enemy.state.guard > 0) chips += `<span class="status-chip chip-guard">🛡️GUARD</span>`;
    if (enemy.state.chargeSkill) chips += `<span class="status-chip chip-charge">⚡CHARGE</span>`;
    if (enemy.state.stun) chips += `<span class="status-chip chip-stun">😵STUN</span>`;
    if (enemy.state.barrier > 0) chips += `<span class="status-chip chip-barrier">💠BARRIER(${enemy.state.barrier})</span>`;
    if (enemy.state.buffAtk > 0) chips += `<span class="status-chip chip-buff">⚔️ATK+${Math.round(enemy.state.buffAtk*100)}%</span>`;
    if (enemy.state.flags.toon) chips += `<span class="status-chip chip-guard">🛡️TOON</span>`;
    if (enemy.state.flags.restrict) chips += `<span class="status-chip chip-lock">🔒BIND</span>`;
    el("enemy-states-side").innerHTML = chips;
    
    const pct = (player.hp/player.maxHp)*100;
    el("player-hp-bar").style.width = pct+"%";
    el("player-hp-bar").className = `hp-bar-fill player-fill ${pct<=20?"hp-danger":pct<=50?"hp-warning":""}`;
    el("player-hp-bar").parentNode.querySelector(".hp-text-overlay").innerText = `${player.hp}/${player.maxHp}`;
    
    let dots=""; for(let i=0;i<player.maxMp;i++) dots+=`<span class="mp-dot ${i<player.mp?'active':''}"></span>`;
    el("player-mp-dots").innerHTML = dots;
    if(player.mp>=player.maxMp) el("player-mp-dots").classList.add("mp-max-glow"); else el("player-mp-dots").classList.remove("mp-max-glow");
    
    let pchips = "";
    if (player.state.atkBonus > 0 || player.state.power) pchips += `<span class="status-chip chip-buff">⚔️ATK UP</span>`;
    if (player.state.guardTurn > 0) pchips += `<span class="status-chip chip-guard">🛡️SHIELD(${player.state.guardTurn})</span>`;
    if (player.state.barrier) pchips += `<span class="status-chip chip-barrier">✨BARRIER</span>`;
    if (player.state.itemLock) pchips += `<span class="status-chip chip-lock">🔒SEAL</span>`;
    el("player-states-side").innerHTML = pchips;
    
    let ppr = totalDarts > 0 ? (totalScore / totalDarts) * 3 : 0;
    el("avg-display").innerText = ppr.toFixed(1);
    el("rt-display").innerText = `(Rt ${calculateRating(ppr)})`;
    
    const setBtn = (id, n, i) => { const b=el(id); b.innerHTML=`${i}x${n}`; b.className=`item-btn ${n>0&&!player.state.itemLock?"has-item":"disabled"}`; };
    setBtn("btn-potion", player.items.potion, "💊");
    setBtn("btn-ether", player.items.ether, "⚗️");
    setBtn("btn-seed", player.items.seed, "🌱");
    
    const tc = el("trap-slot-container"); tc.innerHTML="";
    if(player.setCard) {
        const c = CARD_DB.find(x=>x.id===player.setCard);
        if(c) { const ce = createCardElement(c, "battle", 0, 1); ce.onclick=null; tc.appendChild(ce); }
    } else tc.innerHTML = `<div id="trap-slot" class="trap-slot empty">SET<br>TRAP</div>`;
    
    renderHand();
}

function useItem(t) {
    if (isProcessing || waitingForChest || turnInputs.length > 0 || player.state.itemLock) { playSE("se-warning"); return; }
    if (t==='potion' && player.items.potion>0) { player.items.potion--; player.hp=Math.min(player.hp+50,player.maxHp); playSE("se-heal"); addLog("薬草使用", "log-item"); }
    else if (t==='ether' && player.items.ether>0) { player.items.ether--; player.mp=Math.min(player.mp+3,player.maxMp); playSE("se-heal"); addLog("聖水使用", "log-item"); }
    else if (t==='seed' && player.items.seed>0) { player.items.seed--; player.maxHp+=10; player.hp=Math.min(player.hp+10,player.maxHp); playSE("se-buff"); addLog("命の種使用", "log-item"); }
    updateInfo();
}

// --- Card Logic ---
function renderHand() {
    const h = el("hand-area"); h.innerHTML = "";
    el("hand-count-display").innerText = player.hand.length;
    el("battle-deck-count").innerText = player.deck.length;
    if (player.deckLocked) { h.innerHTML = `<div class="hand-locked-msg">⚠️ NO DECK</div>`; return; }
    
    player.hand.forEach((cid, i) => {
        const c = CARD_DB.find(x => x.id === cid);
        const div = createCardElement(c, "battle", 0, 1);
        div.className += " hand-card";
        if (player.mp < c.cost || player.state.itemLock || turnInputs.length > 0) div.classList.add("disabled");
        div.onclick = () => playHandCard(i);
        h.appendChild(div);
    });
}

function playHandCard(i) {
    if (player.state.itemLock || turnInputs.length > 0) return;
    const cid = player.hand[i]; const c = CARD_DB.find(x => x.id === cid);
    if (player.mp < c.cost) { playSE("se-warning"); return; }
    if (c.id === 501 && player.hand.length < 2) { addLog("手札不足", "log-system"); return; }
    
    if (c.type === "TRAP") {
        if (player.setCard) { addLog("罠は1枚まで", "log-system"); return; }
        player.mp -= c.cost; player.hand.splice(i,1); player.setCard = cid;
        addLog(`TRAPセット: ${c.name}`, "log-skill"); playSE("se-buff");
    } else {
        if(c.id===501) { openDiscardSelector(); return; }
        player.mp -= c.cost; player.hand.splice(i,1); player.discard.push(cid);
        applyCardEffect(c);
    }
    updateInfo();
}

function applyCardEffect(c) {
    playSE("se-buff");
    let msg = "";
    switch(c.id) {
        case 101: player.hp=player.maxHp; playSE("se-heal"); msg="HP完全回復"; break;
        case 201: enemy.hp=Math.max(0,enemy.hp-100); enemy.state.stun=true; playSE("se-boom"); triggerEffect(el("enemy-panel"),100,false); msg="100ダメ＆スタン"; break;
        case 202: drawCard(); drawCard(); msg="2枚ドロー"; break;
        case 301: player.state.guardTurn=3; msg="3T防御"; break;
        case 302: if(enemy.state.chargeSkill){ enemy.state.chargeSkill=null; enemy.state.stun=true; msg="チャージ解除＆スタン"; } break;
        case 303: player.state.barrier=true; msg="バリア展開"; break;
        case 401: enemy.hp=Math.max(0,enemy.hp-30); playSE("se-attack"); triggerEffect(el("enemy-panel"),30,false); msg="30ダメージ"; break;
        case 402: player.hp=Math.min(player.hp+50,player.maxHp); playSE("se-heal"); msg="HP50回復"; break;
        case 403: player.hp=Math.max(1,player.hp-20); enemy.hp=Math.max(0,enemy.hp-80); triggerEffect(el("player-panel"),20,true); triggerEffect(el("enemy-panel"),80,false); msg="自傷20＆敵80"; break;
        case 404: enemy.hp=Math.max(0,enemy.hp-80); playSE("se-attack"); triggerEffect(el("enemy-panel"),80,false); msg="80ダメージ"; break;
        case 405: player.state.power=true; msg="攻撃2倍"; break;
        case 601: enemy.hp=Math.max(0,enemy.hp-150); while(player.hand.length>0) player.discard.push(player.hand.pop()); playSE("se-boom"); triggerEffect(el("enemy-panel"),150,false); msg="手札全捨て150ダメ"; break;
        case 602: player.state.magicCylinder=true; msg="魔法の筒セット"; break;
        case 701: player.state.huge = (player.hp <= player.maxHp*0.5) ? 1 : 2; msg=player.state.huge===1?"3倍パワー":"0.5倍パワー"; break;
        case 702: enemy.hp=Math.max(0,enemy.hp-40); enemy.state.guard=0; triggerEffect(el("enemy-panel"),40,false); msg="40ダメ＆防御破壊"; break;
        case 703: player.state.hexSealTrap=true; msg="六芒星セット"; break;
        case 801: enemy.state.guard=0; msg="防御解除"; break;
        case 802: enemy.hp=Math.max(0,enemy.hp-60); triggerEffect(el("enemy-panel"),60,false); msg="60ダメージ"; break;
        case 803: player.hp=Math.min(player.hp+30,player.maxHp); player.state.atkBonus=20; playSE("se-heal"); msg="回復＆次撃+20"; break;
        case 804: 
            const magics = player.discard.filter(did => CARD_DB.find(cd=>cd.id===did).type==="MAGIC");
            if(magics.length>0) { const salv=magics[Math.floor(Math.random()*magics.length)]; player.discard.splice(player.discard.indexOf(salv),1); player.hand.push(salv); msg="魔法回収"; }
            break;
        case 805: player.hp=Math.max(1,player.hp-50); enemy.hp=Math.max(0,enemy.hp-150); triggerEffect(el("player-panel"),50,true); triggerEffect(el("enemy-panel"),150,false); msg="自傷50＆敵150"; break;
    }
    if(msg) addLog(msg, "log-skill");
    updateInfo();
}

function drawCard(silent=false) {
    if (player.deck.length > 0 && player.hand.length < HAND_SIZE) {
        player.hand.push(player.deck.pop());
        if(!silent) triggerFloatText("DRAW", el("hand-area"));
    }
}

// Discard Selector
let pendingCardIndex = -1;
function openDiscardSelector() {
    el("card-selector-modal").style.display="flex";
    const g = el("cs-grid"); g.innerHTML="";
    player.hand.forEach((cid,i) => {
        const c = CARD_DB.find(x=>x.id===cid);
        const div = createCardElement(c, "battle", 0, 1);
        div.onclick = () => {
            player.hand.splice(i,1); player.discard.push(cid);
            player.mp -= 2; // Cost for Angel's Charity
            drawCard(); drawCard(); drawCard();
            addLog("天使の施し", "log-skill");
            el("card-selector-modal").style.display="none"; updateInfo();
        };
        g.appendChild(div);
    });
}

// =========================================
// 9. BLUETOOTH & INPUT
// =========================================
async function connectToBoard() {
    try {
        const device = await navigator.bluetooth.requestDevice({ filters: [{ namePrefix: 'DARTSLIVE' }], optionalServices: [DL_SERVICE_UUID] });
        const server = await device.gatt.connect();
        const service = await server.getPrimaryService(DL_SERVICE_UUID);
        const char = await service.getCharacteristic(DL_NOTIFY_UUID);
        await char.startNotifications();
        char.addEventListener('characteristicvaluechanged', (e) => {
            const val = e.target.value;
            if (val.byteLength > 2) {
                const s = DL_SCORE_MAP[val.getUint8(2)];
                if (s && s !== "CHANGE") {
                    const se = ["se-single","se-double","se-triple","se-bull","se-dbull"][s[1]];
                    playSE(se); processOneThrow(s[0]);
                }
            }
        });
        el("bt-connect-btn").innerText = "CONNECTED"; el("bt-connect-btn").classList.add("connected");
        // Audio Unlock
        ["se-single","se-bull","bgm-battle"].forEach(id=>{ const a=el(id); if(a){ a.volume=0; a.play().then(()=>{a.pause(); a.currentTime=0;}); } });
    } catch (e) { alert("接続失敗: " + e); }
}

window.addEventListener("keydown", (e) => {
    if (el("game-screen").style.display === "none" && !isOpeningPack) return;
    if (el("game-screen").style.display !== "none") {
        if (e.key >= '0' && e.key <= '9') { currentInput += e.key; updateScoreDisplay(); }
        if (e.key === 'Enter') { processOneThrow(parseInt(currentInput)||0); currentInput=""; }
        if (e.key === 'Backspace') { currentInput = currentInput.slice(0,-1); updateScoreDisplay(); }
    }
    if (isOpeningPack) {
        if (e.key === "Enter") { if(openingPhase===4 && inputLockUntilRelease) return; if(openingPhase===4) buyPack(currentPackId); else proceedUnboxing(); }
        if (e.key === "Backspace") closePackResult();
    }
});
window.addEventListener("keyup", (e) => { if(e.key==="Enter") inputLockUntilRelease=false; });

function updateScoreDisplay() {
    [1,2,3].forEach(i => {
        const s = el(`slot-${i}-side`);
        if (i-1 < turnInputs.length) { s.innerText = turnInputs[i-1]; s.className = `score-val filled ${turnInputs[i-1]>=50?"high":""}`; }
        else if (i-1 === turnInputs.length) { s.innerText = currentInput; s.className = "score-val active"; }
        else { s.innerText = "--"; s.className = "score-val low"; }
        el(`d-dot-${i}`).className = `d-dot ${i-1<turnInputs.length?"filled":i-1===turnInputs.length?"active":""}`;
    });
}

function showSkillCutin(name, type) {
    playSE("se-warning"); el("cutin-text-val").innerText=name;
    const c=el("skill-cutin"); c.className=""; if(type) c.classList.add(`cutin-${type}`); c.style.display="flex";
    setTimeout(()=>c.style.display="none", 1500);
}

function showDialog(title, text, type, btns) {
    el("modal-title").innerText = title; el("modal-text").innerHTML = text;
    const box = el("modal-box-inner");
    box.classList.remove("modal-clear","modal-warning","modal-item");
    if(type==="clear") box.classList.add("modal-clear");
    if(type==="warning") box.classList.add("modal-warning");
    if(type==="item") box.classList.add("modal-item");
    
    const g = el("modal-buttons"); g.innerHTML="";
    btns.forEach(b => {
        const btn = document.createElement("button"); btn.className="modal-btn"; btn.innerText=b.text;
        btn.onclick = () => { el("game-modal").style.display="none"; if(b.action) b.action(); };
        g.appendChild(btn);
    });
    el("game-modal").style.display = "flex";
}

function finishSession(resType, ppr) {
    const cur = stage*100+floor; const best = savedData.highScore.stage*100+savedData.highScore.floor;
    if(cur > best) { savedData.highScore.stage=stage; savedData.highScore.floor=floor; }
    if(ppr > savedData.highScore.avg) savedData.highScore.avg = parseFloat(ppr);
    
    const historyItem = { date: new Date().toLocaleString(), stgName: stage===6?"STAGE 5":`S${stage}-${floor}F`, result: resType, dp: savedData.dp, ppr: parseFloat(ppr) };
    if(!savedData.history) savedData.history=[];
    savedData.history.unshift(historyItem); if(savedData.history.length>50) savedData.history.pop();
    saveToDrive();
}

// =========================================
// 10. UI FUNCTIONS (Shop, Deck, etc)
// =========================================
let isOpeningPack = false, openingPhase = 0, packResults = [], currentPackId = "", currentRevealIndex = 0, inputLockUntilRelease = false;

window.openCardShop = function() {
    playSE("se-tap");
    const list = el("pack-list"); list.innerHTML = "";
    if (el("shop-dp-display")) el("shop-dp-display").innerText = (savedData.dp || 0);
    PACK_DATA.forEach(pack => {
        const isUnlocked = (savedData.bestRanks && savedData.bestRanks[pack.unlockStage]);
        if (!isUnlocked) return;
        const canBuy = (savedData.dp || 0) >= pack.price;
        const div = document.createElement("div"); div.className = "pack-item";
        div.innerHTML = `<div class="pack-img-container"><img src="${pack.img}" onerror="this.style.display='none'"></div><div class="pack-name">${pack.name}</div><div class="pack-desc">${pack.desc}</div><button class="pack-buy-btn" ${canBuy?"":"disabled"} onclick="buyPack('${pack.id}')">${canBuy?`BUY (${pack.price})`:"LACK DP"}</button>`;
        list.appendChild(div);
    });
    if (list.innerHTML === "") list.innerHTML = "<div style='color:#666;padding:20px;'>STAGE 1 CLEAR REQUIRED</div>";
    el("card-shop-modal").style.display = "flex";
}
window.closeCardShop = function() { playSE("se-tap"); el("card-shop-modal").style.display="none"; updateTitleScore(); };

window.buyPack = function(pid) {
    const p = PACK_DATA.find(x=>x.id===pid);
    if ((savedData.dp||0) < p.price) { playSE("se-warning"); return; }
    savedData.dp -= p.price; saveToDrive();
    if(el("shop-dp-display")) el("shop-dp-display").innerText = savedData.dp;
    startPackOpening(pid);
};

function startPackOpening(pid) {
    currentPackId = pid; isOpeningPack = true; openingPhase = 1;
    el("card-shop-modal").style.display="none"; el("pack-result-modal").style.display="flex";
    const targets = CARD_DB.filter(c => c.packs.includes(pid));
    packResults = [];
    for(let i=0; i<3; i++) {
        const isG = (i===2);
        let card = null, attempt=0;
        while(!card || packResults.some(r=>r.id===card.id)) {
            attempt++; if(attempt>20) break;
            const r = Math.random();
            let rarity = "N";
            if (isG) { if(r<0.03) rarity="UR"; else if(r<0.20) rarity="SR"; else rarity="R"; }
            else { if(r<0.01) rarity="UR"; else if(r<0.10) rarity="SR"; else if(r<0.40) rarity="R"; else rarity="N"; }
            let pool = targets.filter(c=>c.rarity===rarity); if(pool.length===0) pool=targets;
            const c = pool[Math.floor(Math.random()*pool.length)];
            if(!packResults.some(r=>r.id===c.id)) card=c;
        }
        if(!card) card = targets[Math.floor(Math.random()*targets.length)];
        const count = savedData.cards[card.id] || 0;
        savedData.cards[card.id] = count + 1;
        packResults.push({ ...card, isNew: count===0, ownCount: savedData.cards[card.id] });
    }
    saveToDrive();
    packResults.sort((a,b)=> { const o={N:0,R:1,SR:2,UR:3}; return o[a.rarity]-o[b.rarity]; });
    const pImg = PACK_DATA.find(p=>p.id===pid).img;
    el("pack-opening-container").innerHTML = `<div id="opening-stage" onclick="proceedUnboxing()"><div id="white-out" class="white-out-overlay"></div><img src="${pImg}" id="pack-visual" class="opening-pack anim-drop anim-breath"><div id="opening-prompt" class="prompt-text">TAP TO OPEN</div><div id="reveal-area" class="reveal-stage" style="display:none"></div><div id="action-buttons" class="action-buttons" style="display:none"><button class="modal-btn" onclick="buyPack('${pid}')">ONE MORE</button><button class="modal-btn" onclick="closePackResult()" style="background:#555">QUIT</button></div></div>`;
}

window.proceedUnboxing = function() {
    if (openingPhase===1) {
        openingPhase=2; el("opening-prompt").style.display="none";
        const pv = el("pack-visual"); pv.classList.remove("anim-breath"); pv.classList.add("anim-charge"); playSE("se-double");
        setTimeout(()=>{
            playSE("se-heal"); el("white-out").style.display="block"; el("white-out").classList.add("white-out-anim"); pv.style.display="none";
            setTimeout(()=>{ openingPhase=3; el("reveal-area").style.display="flex"; currentRevealIndex=0; showNextRevealCard(); }, 800);
        }, 1500);
    } else if (openingPhase===3) {
        const c = document.getElementById(`reveal-card-${currentRevealIndex}`);
        if(c) { c.classList.add("fly-up"); currentRevealIndex++; setTimeout(showNextRevealCard, 200); }
    }
};

function showNextRevealCard() {
    if (currentRevealIndex >= packResults.length) { showPackResult(); return; }
    const c = packResults[currentRevealIndex];
    const area = el("reveal-area"); playSE("se-item");
    if(c.rarity==="UR"){ playSE("se-boom"); } else if(c.rarity==="SR"){ playSE("se-buff"); }
    const div = document.createElement("div"); div.id=`reveal-card-${currentRevealIndex}`;
    div.className=`std-card rarity-${c.rarity} reveal-card-zoom card-appear ${c.rarity==="UR"?"card-show-ur":""}`;
    div.innerHTML = `<div class="std-art"><img src="assets/cards/${c.id}.png"><div class="card-sheen"></div></div><div class="std-text-area"><div class="std-name text-${c.rarity.toLowerCase()}">${c.name}</div></div>`;
    area.innerHTML=""; area.appendChild(div);
}

function showPackResult() {
    openingPhase=4; inputLockUntilRelease=true;
    const area = el("reveal-area"); area.innerHTML=""; area.className="result-stage"; playSE("se-win");
    packResults.forEach((c,i) => {
        const div = createCardElement(c, "standard", c.ownCount, c.ownCount);
        div.className+=" result-card"; div.style.animation=`pop-in 0.5s both ${i*0.1}s`;
        if(c.isNew) div.innerHTML+=`<div class="new-badge">NEW!</div>`;
        div.onclick=null; setupLongPress(div,c); area.appendChild(div);
    });
    const btns = el("action-buttons"); btns.style.display="flex"; setTimeout(()=>btns.classList.add("visible"),100);
}

window.closePackResult = function() {
    if(openingPhase<4 && openingPhase>0) return;
    playSE("se-tap"); el("pack-result-modal").style.display="none"; isOpeningPack=false; openingPhase=0;
    el("card-shop-modal").style.display="flex"; updateTitleScore();
};

window.openCollection = function() { playSE("se-tap"); renderDeckEditor(); el("collection-modal").style.display="flex"; };
window.closeCollection = function() { playSE("se-tap"); el("collection-modal").style.display="none"; };

function renderDeckEditor() {
    if(!savedData.deck) savedData.deck=[]; savedData.deck.sort((a,b)=>a-b);
    const dGrid = el("deck-grid"); dGrid.innerHTML="";
    for(let i=0; i<DECK_SIZE; i++) {
        const cid = savedData.deck[i];
        if(cid) {
            const c = CARD_DB.find(x=>x.id===cid);
            const div = createCardElement(c, "small", 0, savedData.cards[cid]||0);
            div.onmouseenter = () => el("deck-card-detail").innerHTML = `<span class="detail-name">${c.name}</span>${c.desc}`;
            dGrid.appendChild(div);
        } else {
            const div = document.createElement("div"); div.className="std-card small empty-slot";
            div.innerHTML=`<div class="std-art" style="font-size:10px; color:#666; display:flex; justify-content:center; align-items:center;">EMPTY</div>`; dGrid.appendChild(div);
        }
    }
    const cnt = savedData.deck.length; el("deck-count").innerText=cnt; el("deck-count").style.color = cnt<DECK_SIZE?"#f55":"#0f0";
    const lGrid = el("card-grid"); lGrid.innerHTML="";
    let owned=0;
    CARD_DB.forEach(c => {
        const n = savedData.cards[c.id]||0; if(n>0) owned++;
        const inD = savedData.deck.filter(x=>x===c.id).length;
        lGrid.appendChild(createCardElement(c, "standard", n-inD, n));
    });
    el("collection-rate").innerText = `${Math.floor((owned/CARD_DB.length)*100)}%`;
}

function createCardElement(c, mode, rem, total) {
    const div = document.createElement("div");
    const isOwned = (mode==="small"||mode==="battle"||total>0);
    div.className = `std-card ${mode} rarity-${c.rarity} ${!isOwned?"card-not-owned":""}`;
    if(mode==="small") div.classList.add("in-deck-card");
    
    const sheen = (c.rarity==="UR"||c.rarity==="SR") ? '<div class="card-sheen"></div>' : '';
    const txt = mode==="small"?"":`x${rem}`;
    div.innerHTML = `<div class="std-art"><img src="assets/cards/${c.id}.png" onerror="this.style.display='none'"><div class="std-cost">${c.cost}</div><div class="std-count">${txt}</div>${sheen}</div><div class="std-text-area ${c.type==="TRAP"?"bg-trap":"bg-magic"}"><div class="std-name text-${c.rarity.toLowerCase()}">${c.name}</div><div class="std-type">[${c.type}]</div><div class="std-desc">${c.desc}</div></div>`;
    
    div.onclick = () => {
        if(div.dataset.lp==="true"){ div.dataset.lp="false"; return; }
        if(!isOwned || isOpeningPack) return;
        if(mode==="small") { const idx=savedData.deck.indexOf(c.id); if(idx>-1) savedData.deck.splice(idx,1); }
        else {
            if(savedData.deck.length>=DECK_SIZE) { alert("Deck Full"); return; }
            const inD = savedData.deck.filter(x=>x===c.id).length;
            if(inD >= (savedData.cards[c.id]||0)) { alert("No more cards"); return; }
            if(inD >= 3) { alert("Max 3 copies"); return; }
            savedData.deck.push(c.id);
        }
        playSE("se-tap"); saveToDrive(); renderDeckEditor();
    };
    if(isOwned) setupLongPress(div,c);
    return div;
}

function setupLongPress(el, c) {
    let t;
    const s = (e) => { if(e.type==="mousedown"&&e.button!==0)return; el.dataset.lp="false"; t=setTimeout(()=>{ el.dataset.lp="true"; showZoomCard(c); }, 500); };
    const e = () => { if(t) clearTimeout(t); };
    el.addEventListener("mousedown",s); el.addEventListener("touchstart",s,{passive:true});
    el.addEventListener("mouseup",e); el.addEventListener("mouseleave",e); el.addEventListener("touchend",e);
}

function showZoomCard(c) {
    let ov = el("card-zoom-overlay");
    if(!ov){ ov=document.createElement("div"); ov.id="card-zoom-overlay"; ov.onclick=()=>ov.style.display="none"; document.body.appendChild(ov); }
    ov.innerHTML = `<img src="assets/cards/${c.id}.png" class="zoom-card-img"><div class="zoom-info-box"><div class="zoom-name">${c.name}</div><div class="zoom-desc">${c.desc}</div></div>`;
    ov.style.display="flex"; playSE("se-tap");
}

window.showHistory = function() {
    const list = el("history-list"); list.innerHTML="";
    if(!savedData.history || savedData.history.length===0) list.innerHTML="<div style='padding:20px;text-align:center'>NO DATA</div>";
    else {
        savedData.history.forEach(h => {
            const div = document.createElement("div"); div.className=`history-row ${h.result.includes("WIN")?"win":""}`;
            div.innerHTML = `<div class="h-date">${h.date.split(' ')[0]}</div><div class="h-stage">${h.stgName}</div><div class="h-result">${h.result}</div><div class="h-detail">+${h.dp} DP</div>`;
            list.appendChild(div);
        });
    }
    el("history-modal").style.display="flex";
};
window.closeHistory = function() { el("history-modal").style.display="none"; };

window.openConfigModal = function() {
    let m = el("config-modal");
    if(!m) { m=document.createElement("div"); m.id="config-modal"; document.body.appendChild(m); }
    m.innerHTML = `<div class="config-box"><div class="config-title">CONFIG</div>
    <div class="config-row"><div class="config-label"><span>BGM</span><span id="val-bgm">${Math.round(gameConfig.bgmVolume*100)}%</span></div><input type="range" class="config-slider" min="0" max="100" value="${gameConfig.bgmVolume*100}" oninput="updateConfigVal('bgm',this.value)"></div>
    <div class="config-row"><div class="config-label"><span>SE</span><span id="val-sys">${Math.round(gameConfig.sysVolume*100)}%</span></div><input type="range" class="config-slider" min="0" max="100" value="${gameConfig.sysVolume*100}" oninput="updateConfigVal('sys',this.value)"></div>
    <div class="config-buttons"><button class="btn-conf btn-save" onclick="closeConfig()">CLOSE</button></div></div>`;
    m.style.display="flex";
};
window.updateConfigVal = function(t,v) {
    if(t==='bgm'){ gameConfig.bgmVolume=v/100; el("val-bgm").innerText=v+"%"; updateCurrentBgmVolume(); }
    if(t==='sys'){ gameConfig.sysVolume=v/100; el("val-sys").innerText=v+"%"; }
};
window.closeConfig = function() { saveGameConfig(); el("config-modal").style.display="none"; };

window.openStageSelect = function() { playSE("se-tap"); el("title-screen").style.display="none"; el("stage-select-screen").style.display="flex"; renderStageSelect(); };
window.closeStageSelect = function() { playSE("se-tap"); el("stage-select-screen").style.display="none"; el("title-screen").style.display="flex"; };

function renderStageSelect() {
    const c = el("stage-list-container"); c.innerHTML="";
    const stages = [
        {id:1, n:"旅立ちの森", img:"assets/bg_stage1.png"}, {id:2, n:"荒れ狂う荒野", img:"assets/bg_stage2.png"},
        {id:3, n:"誘惑の迷宮", img:"assets/bg_stage3.png"}, {id:4, n:"幻想の狂宴", img:"assets/bg_stage4_1.png"},
        {id:5, n:"燃えたぎる火口", img:"assets/bg_extra.png"}, {id:6, n:"神の試練", img:"assets/bg_stage5_1.png"}
    ];
    stages.forEach(s => {
        let locked = false;
        if(s.id===4) locked = !(savedData.unlockedStage4 || (savedData.bestRanks && savedData.bestRanks[3]) || savedData.clearedExtra);
        if(s.id===5) locked = !savedData.clearedExtra;
        if(s.id===6) locked = !(savedData.bestRanks && savedData.bestRanks[4]);
        
        const div = document.createElement("div"); div.className=`stage-card-item ${locked?"locked":""}`;
        div.innerHTML = `<img src="${s.img}" class="st-img"><div class="st-info"><div class="st-title">${locked?"LOCKED":s.n}</div></div>`;
        if(!locked) div.onclick = () => { el("stage-select-screen").style.display="none"; initGameSession(s.id); };
        c.appendChild(div);
    });
}

function resetSaveData() {
    if(confirm("データをリセットしますか？")) { allSaveData[currentSlot]=null; selectSlot(currentSlot.replace("slot","")); saveToDrive(); }
}
function exportSave() { navigator.clipboard.writeText(JSON.stringify(savedData)).then(()=>alert("Copied")); }
function importSave() {
    const j = prompt("Paste JSON"); if(j) try { savedData=JSON.parse(j); updateTitleScore(); saveToDrive(); alert("Loaded"); } catch(e){alert("Error");}
}