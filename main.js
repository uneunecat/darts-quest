console.log("★ main.js is loaded! (v2.11.10 Integrity)");
const el = (id) => document.getElementById(id);
function calculateRating(ppr) { if (ppr < 30) return 1; if (ppr < 40) return 2; if (ppr < 45) return 3; if (ppr < 50) return 4; if (ppr < 55) return 5; if (ppr < 60) return 6; if (ppr < 65) return 7; if (ppr < 70) return 8; if (ppr < 75) return 9; if (ppr < 80) return 10; if (ppr < 85) return 11; if (ppr < 90) return 12; if (ppr < 95) return 13; if (ppr < 100) return 14; if (ppr < 110) return 15; if (ppr < 120) return 16; if (ppr < 130) return 17; return 18; }
function shuffleArray(array) { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[array[i], array[j]] = [array[j], array[i]]; } return array; }
function animateValue(obj, s, e, d) { if (obj) obj.innerHTML = e; }

// --- Global Config & Audio Engine ---
let gameConfig = { bgmVolume: 0.3, sysVolume: 0.5, atkVolume: 0.8 };
function loadGameConfig() { const saved = localStorage.getItem("darts_quest_config"); if (saved) { try { gameConfig = { ...gameConfig, ...JSON.parse(saved) }; } catch (e) { } } }
loadGameConfig();
function saveGameConfig() { localStorage.setItem("darts_quest_config", JSON.stringify(gameConfig)); }
function stopAllBGM() { ["bgm-title", "bgm-battle", "bgm-boss", "bgm-extra", "bgm-win", "bgm-lose"].forEach(id => { const el = document.getElementById(id); if (el) { el.pause(); el.currentTime = 0; } }); currentBgmId = ""; }
function playBGM(id) { if (currentBgmId === id) return; stopAllBGM(); const a = document.getElementById(id); if (a) { currentBgmId = id; a.volume = gameConfig.bgmVolume; a.play().catch(e => { console.log("BGM Error:", e); }); } }
function updateCurrentBgmVolume() { if (currentBgmId) { const a = document.getElementById(currentBgmId); if (a) a.volume = gameConfig.bgmVolume; } }
function playSE(id) { const a = document.getElementById(id); if (a) { a.currentTime = 0; const attackSEs = ["se-hit", "se-weak", "se-attack", "se-boom", "se-damage", "se-single", "se-double", "se-triple", "se-bull", "se-dbull"]; if (attackSEs.includes(id)) a.volume = gameConfig.atkVolume; else a.volume = gameConfig.sysVolume; if (a.volume > 0.01) a.play().catch(e => { }); } }

function triggerFloatText(text, targetEl) { if (!targetEl) return; const float = document.createElement("div"); float.className = "float-text-box"; float.innerText = text; const rect = targetEl.getBoundingClientRect(); document.body.appendChild(float); const left = rect.left + (rect.width / 2) - 30; const top = rect.top; float.style.left = `${left}px`; float.style.top = `${top}px`; float.style.position = "fixed"; setTimeout(() => float.remove(), 1500); }
function triggerEffect(el, dmg, isPlayer, isHeal = false) { if (!isHeal && dmg > 0) { const shakeClass = dmg > 50 ? "shake-heavy" : "shake-small"; const container = document.getElementById("game-container"); container.classList.remove("shake-small", "shake-heavy"); void container.offsetWidth; container.classList.add(shakeClass); setTimeout(() => container.classList.remove(shakeClass), 500); } const pop = document.createElement("div"); pop.className = "damage-float"; if (isHeal) pop.classList.add("heal"); else if (dmg === 0) pop.classList.add("miss"); if (!isPlayer && !isHeal && dmg > 0) { pop.classList.add("enemy-dmg"); } pop.innerText = dmg === 0 ? "MISS" : dmg; document.getElementById("game-screen").appendChild(pop); setTimeout(() => { if(pop.parentNode) pop.parentNode.removeChild(pop); }, 1500); }
function resizeGame() { const scaler = el('game-scaler'); if (!scaler) return; if (window.innerWidth >= 900) { const scale = Math.min(window.innerWidth / 900, window.innerHeight / 620) * 0.95; scaler.style.transform = `scale(${scale})`; scaler.style.width = "900px"; scaler.style.height = "620px"; scaler.style.position = "static"; document.body.style.overflow = "hidden"; } else { scaler.style.transform = "none"; scaler.style.width = "100%"; scaler.style.height = "auto"; document.body.style.overflowY = "auto"; } }
function announce(text, type = "normal") { const ann = el("battle-announcer") || document.createElement("div"); ann.id = "battle-announcer"; if(!ann.parentNode) el("enemy-panel").appendChild(ann); ann.innerHTML = text; ann.className = "announcer-visible"; if (type === "danger" || type === "log-enemy") ann.classList.add("ann-danger"); if (type === "log-skill" || type === "log-weak") ann.classList.add("ann-warn"); setTimeout(() => { ann.className = ""; }, 2000); }
function addLog(text, type = "") { console.log(`[${type}] ${text}`); if ((type === "log-enemy" || type === "log-skill" || type === "log-weak" || type === "log-heal" || text.includes("WEAK") || text.includes("無効") || text.includes("回復")) && !text.includes("倒した") && !text.includes("宝箱")) { announce(text, type); } }

const GAME_DATA = { enemies: { 1: [{ name: "プチモス", img: "assets/1-1.png", weak: 20 }, { name: "ラーバモス", img: "assets/1-2.png", weak: 19 }, { name: "進化の繭", img: "assets/1-3.png", weak: 18, hp: 260 }, { name: "グレート・モス", img: "assets/1-4.png", weak: 17, hp: 290 }, { name: "究極完全態・グレート・モス", img: "assets/1-5.png", weak: 20, hp: 420 }], 2: [{ name: "トラコドン", img: "assets/2-1.png", weak: 19 }, { name: "ワイルド・ラプター", img: "assets/2-2.png", weak: 18, hp: 280 }, { name: "屍を貪る竜", img: "assets/2-3.png", weak: 17, hp: 310 }, { name: "二頭を持つキング・レックス", img: "assets/2-4.png", weak: 20, hp: 340 }, { name: "剣竜", img: "assets/2-5.png", weak: 19, hp: 540 }], 3: [{ name: "デュナミス・ヴァルキリア", img: "assets/3-1.png", weak: 20, hp: 300 }, { name: "ハーピィ・レディ", img: "assets/3-2.png", weak: 19, hp: 330 }, { name: "ハーピィ・レディ・SB", img: "assets/3-3.png", weak: 18, hp: 360 }, { name: "ハーピィ・レディ三姉妹", img: "assets/3-4.png", weak: 17, hp: 390 }, { name: "ハーピィズペット竜", img: "assets/3-5.png", weak: 20, hp: 550 }], 4: [{ name: "ダーク・ラビット", img: "assets/4-1.png", weak: 20, hp: 380 }, { name: "デビル・ボックス", img: "assets/4-2.png", weak: 19, hp: 420 }, { name: "トゥーン・デーモン", img: "assets/4-3.png", weak: 18, hp: 460 }, { name: "ブルーアイズ・トゥーン・ドラゴン", img: "assets/4-4.png", weak: 17, hp: 500 }, { name: "サクリファイス", img: "assets/4-5.png", weak: 20, hp: 550 }, { name: "サウザンド・アイズ・サクリファイス", img: "assets/4-6.png", weak: 20, hp: 800 }], 5: [{ name: "真紅眼の黒竜", img: "assets/extra.png", weak: 20, hp: 1500 }], 6: [{ name: "ワームドレイク", img: "assets/5-1.png", weak: 19, hp: 400 }, { name: "ヒューマノイド・スライム", img: "assets/5-2.png", weak: 18, hp: 450 }, { name: "リバイバルスライム", img: "assets/5-3.png", weak: 20, hp: 300 }, { name: "ヒューマノイド・ドレイク", img: "assets/5-4.png", weak: 17, hp: 600 }, { name: "オシリスの天空竜", img: "assets/5-5.png", weak: 20, hp: 2000 }] }, bg: { 1: "assets/bg_stage1.png", 2: "assets/bg_stage2.png", 3: "assets/bg_stage3.png", 4_1: "assets/bg_stage4_1.png", 4_2: "assets/bg_stage4_2.png", 5: "assets/bg_extra.png", 6: "assets/bg_stage5_1.png" } };
const CARD_DB = [
    { id: 101, name: "死者蘇生", rarity: "UR", type: "MAGIC", cost: 8, desc: "HPを最大値まで完全回復", packs: ["vol1"] },
    { id: 201, name: "サンダー・ボルト", rarity: "SR", type: "MAGIC", cost: 6, desc: "敵に100ダメージ＋スタン(1T行動不能)", packs: ["vol1"] },
    { id: 202, name: "強欲な壺", rarity: "SR", type: "MAGIC", cost: 2, desc: "MPを2消費し、カードを2枚引く。(手札上限5枚)", packs: ["vol1"] },
    { id: 301, name: "光の護封剣", rarity: "R", type: "MAGIC", cost: 5, desc: "3ターンの間、受けるダメージを半減", packs: ["vol1"] },
    { id: 302, name: "落とし穴", rarity: "R", type: "TRAP", cost: 3, desc: "【罠】敵モンスター出現時、50ダメージ＋1Tスタン", packs: ["vol1"] },
    { id: 303, name: "聖なるバリア", rarity: "R", type: "TRAP", cost: 4, desc: "【罠】敵の攻撃を無効化し、50ダメージ与える", packs: ["vol1"] },
    { id: 401, name: "火の粉", rarity: "N", type: "MAGIC", cost: 1, desc: "敵に30ダメージ", packs: ["vol1"] },
    { id: 402, name: "治療の神", rarity: "N", type: "MAGIC", cost: 4, desc: "HPを50回復", packs: ["vol1"] },
    { id: 403, name: "はさみ撃ち", rarity: "N", type: "TRAP", cost: 2, desc: "【罠】敵から攻撃を受けたら敵に80ダメージ", packs: ["vol1"] },
    { id: 404, name: "昼夜の大火事", rarity: "N", type: "MAGIC", cost: 3, desc: "敵に80ダメージ", packs: ["vol1"] },
    { id: 405, name: "突進", rarity: "N", type: "MAGIC", cost: 2, desc: "攻撃力2倍(次の1投のみ)", packs: ["vol1"] },
    { id: 501, name: "天使の施し", rarity: "UR", type: "MAGIC", cost: 2, desc: "手札を1枚選んで捨て、カードを3枚引く。", packs: ["vol2"] },
    { id: 601, name: "ブラック・ホール", rarity: "SR", type: "MAGIC", cost: 7, desc: "敵に150ダメージ。ただし自分の手札を全て捨てる。", packs: ["vol2"] },
    { id: 602, name: "魔法の筒", rarity: "SR", type: "TRAP", cost: 4, desc: "【罠】敵の攻撃を無効化し、そのダメージをそのまま敵に与える。", packs: ["vol2"] },
    { id: 701, name: "巨大化", rarity: "R", type: "MAGIC", cost: 3, desc: "HP半分以下なら3倍、半分以上なら0.5倍", packs: ["vol2"] },
    { id: 702, name: "地割れ", rarity: "R", type: "MAGIC", cost: 3, desc: "敵に40ダメージを与え、防御状態を解除する。", packs: ["vol2"] },
    { id: 703, name: "六芒星の呪縛", rarity: "R", type: "TRAP", cost: 3, desc: "【罠】敵の攻撃を半減し、さらに敵をスタン(1T行動不能)させる。", packs: ["vol2"] },
    { id: 801, name: "守備封じ", rarity: "N", type: "MAGIC", cost: 1, desc: "敵の防御状態を解除する。", packs: ["vol2"] },
    { id: 802, name: "火あぶりの刑", rarity: "N", type: "MAGIC", cost: 2, desc: "敵に60ダメージ。", packs: ["vol2"] },
    { id: 803, name: "援軍", rarity: "N", type: "MAGIC", cost: 2, desc: "HPを30回復し、攻撃力を+20する(次の1投)。", packs: ["vol2"] },
    { id: 804, name: "闇の仮面", rarity: "N", type: "MAGIC", cost: 4, desc: "捨て札からランダムに魔法カードを1枚手札に加える。", packs: ["vol2"] },
    { id: 805, name: "最終戦争", rarity: "N", type: "MAGIC", cost: 5, desc: "敵に150ダメージ、自分に50ダメージ。", packs: ["vol2"] }
];
const PACK_DATA = [{ id: "vol1", name: "Vol.1 - Legend", price: 1000, desc: "伝説の始まり。基本魔法カード収録。", unlockStage: 1, img: "assets/packs/vol1.png" }, { id: "vol2", name: "Vol.2 - Awakening", price: 1500, desc: "テクニカルな戦略カードが登場。", unlockStage: 3, img: "assets/packs/vol2.png" }];
const DL_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e'; const DL_NOTIFY_UUID = '6e40fff6-b5a3-f393-e0a9-e50e24dcca9e';
const DL_SCORE_MAP = { 0x3c: [60, 2], 0x28: [20, 0], 0x50: [60, 2], 0x14: [20, 0], 0x29: [2, 1], 0x15: [1, 0], 0x3d: [3, 2], 0x01: [1, 0], 0x3a: [36, 1], 0x26: [18, 0], 0x4e: [54, 2], 0x12: [18, 0], 0x2c: [8, 1], 0x18: [4, 0], 0x40: [12, 2], 0x04: [4, 0], 0x35: [26, 1], 0x21: [13, 0], 0x49: [39, 2], 0x0d: [13, 0], 0x2e: [12, 1], 0x1a: [6, 0], 0x42: [18, 2], 0x06: [6, 0], 0x32: [20, 1], 0x1e: [10, 0], 0x46: [30, 2], 0x0a: [10, 0], 0x37: [30, 1], 0x23: [15, 0], 0x4b: [45, 2], 0x0f: [15, 0], 0x2a: [4, 1], 0x16: [2, 0], 0x3e: [6, 2], 0x02: [2, 0], 0x39: [34, 1], 0x25: [17, 0], 0x4d: [51, 2], 0x11: [17, 0], 0x2b: [6, 1], 0x17: [3, 0], 0x3f: [9, 2], 0x03: [3, 0], 0x3b: [38, 1], 0x27: [19, 0], 0x4f: [57, 2], 0x13: [19, 0], 0x2f: [14, 1], 0x1b: [7, 0], 0x43: [21, 2], 0x07: [7, 0], 0x38: [32, 1], 0x24: [16, 0], 0x4c: [48, 2], 0x10: [16, 0], 0x30: [16, 1], 0x1c: [8, 0], 0x44: [24, 2], 0x08: [8, 0], 0x33: [22, 1], 0x1f: [11, 0], 0x47: [33, 2], 0x0b: [11, 0], 0x36: [28, 1], 0x22: [14, 0], 0x4a: [42, 2], 0x0e: [14, 0], 0x31: [18, 1], 0x1d: [9, 0], 0x45: [27, 2], 0x09: [9, 0], 0x34: [24, 1], 0x20: [12, 0], 0x48: [36, 2], 0x0c: [12, 0], 0x2d: [10, 1], 0x19: [5, 0], 0x41: [15, 2], 0x05: [5, 0], 0x51: [50, 3], 0x52: [50, 4], 0x54: "CHANGE" };
let bluetoothDevice = null; let bluetoothServer = null;
let player = { hp: 100, maxHp: 100, mp: 3, maxMp: 10, items: { potion: 0, ether: 0, seed: 0 }, state: { power: false, shield: false, weakLock: false, barrier: false, guardTurn: 0, magicCylinder: false, hexSeal: false, huge: 0, atkBonus: 0, itemLock: false }, deck: [], hand: [], discard: [], deckLocked: false, setCard: null };
let enemy = { hp: 100, maxHp: 100, data: null, name: "", state: { charge: false, guard: false, guardType: null, guardTurn: 0, atkBuff: 0, isStunned: false, toonSkin: false, barrierLimit: 0, sliferThunder: false } };
let stage = 1; floor = 1; totalScore = 0; totalDarts = 0; let displayPlayerHP = 100; displayEnemyHP = 100; let isProcessing = false; extraBossTurnCount = 0; currentTurn = 1; let dropGuaranteed = false; weakHitCount = 0; let restrictInput = false; let turnInputs = []; let currentInput = ""; let isJustFinish = false; let waitingForChest = false; let cheatBuffer = ""; let stageStartTurn = 0; let totalGameTurns = 0; let clearedStagesLog = []; let currentBgmId = "";
const DECK_SIZE = 20; const HAND_SIZE = 5; const INITIAL_HAND = 3; const SAVE_KEY = "darts_quest_save";
let allSaveData = { "slot1": null, "slot2": null, "slot3": null, "lastPlayed": 1 }; let currentSlot = "slot1"; let savedData = { highScore: { stage: 1, floor: 1, avg: 0.0 }, history: [], clearedExtra: false, dp: 0, bestRanks: {}, unlockedStage4: false, deck: [], cards: {} };
let pendingCardIndex = -1; let pendingCardCost = 0;

// Pack Opening State
let isOpeningPack = false;
let openingPhase = 0; // 0:None, 1:Summon, 2:Flash, 3:Reveal, 4:Result
let packResults = [];
let currentPackId = "";
let currentRevealIndex = 0;

window.addEventListener('resize', resizeGame);
window.addEventListener('load', () => { resizeGame(); loadGameData(); initSlotScreen(); if (window.innerWidth < 900) document.body.style.overflowY = "auto"; });

function loadGameData() { const saved = localStorage.getItem(SAVE_KEY); if (saved) { try { allSaveData = JSON.parse(saved); } catch (e) { console.error(e); } } if (!allSaveData.slot1) allSaveData.slot1 = null; if (!allSaveData.slot2) allSaveData.slot2 = null; if (!allSaveData.slot3) allSaveData.slot3 = null; }
function saveToDrive() { allSaveData[currentSlot] = savedData; localStorage.setItem(SAVE_KEY, JSON.stringify(allSaveData)); }
function initSlotScreen() { for (let i = 1; i <= 3; i++) { const key = "slot" + i; const data = allSaveData[key]; const infoEl = el("info-" + i); if (!data) { infoEl.innerHTML = "<div class='slot-empty'>NO DATA<br>- Start New Game -</div>"; } else { let stgName = `STAGE ${data.highScore.stage}`; if (data.highScore.stage === 5) stgName = "EXTRA"; if (data.highScore.stage === 6) stgName = "STAGE 5"; let stg = `${stgName} - ${data.highScore.floor}F`; let badge = data.clearedExtra ? "<br><span style='color:#f0f;font-weight:bold;'>★ EXTRA CLEARED</span>" : ""; infoEl.innerHTML = `<div>${stg}</div><div style='color:#ffdd00;'>Avg: ${data.highScore.avg.toFixed(1)} (Rt ${calculateRating(data.highScore.avg)})</div><div style='color:#aaa;font-size:12px;'>DP: ${data.dp || 0}${badge}</div>`; } } }
function selectSlot(n) { currentSlot = "slot" + n; if (!allSaveData[currentSlot]) { allSaveData[currentSlot] = { highScore: { stage: 1, floor: 1, avg: 0.0 }, history: [], clearedExtra: false, dp: 0, bestRanks: {}, unlockedStage4: false, deck: [], cards: {} }; } savedData = allSaveData[currentSlot]; if (!savedData.deck) savedData.deck = []; if (!savedData.cards) savedData.cards = {}; allSaveData.lastPlayed = n; updateTitleScore(); playSE("se-tap"); playBGM("bgm-title"); el("slot-screen").style.display = "none"; el("title-screen").style.display = "flex"; }
function backToSlots() { stopAllBGM(); el("title-screen").style.display = "none"; el("slot-screen").style.display = "flex"; initSlotScreen(); }
function updateTitleScore() { let stg = `STAGE ${savedData.highScore.stage}`; if (savedData.highScore.stage === 5) stg = "EXTRA"; if (savedData.highScore.stage === 6) stg = "STAGE 5"; if (el("hs-reach")) el("hs-reach").innerText = `${stg} - ${savedData.highScore.floor}F`; if (el("hs-avg")) el("hs-avg").innerText = savedData.highScore.avg.toFixed(1); if (el("hs-rt")) el("hs-rt").innerText = "Rt " + calculateRating(savedData.highScore.avg); if (el("dp-display")) el("dp-display").innerText = "DP: " + (savedData.dp || 0); if (!document.getElementById("btn-config-entry")) { const titleScreen = el("title-screen"); if(titleScreen) { const btn = document.createElement("div"); btn.id = "btn-config-entry"; btn.className = "config-btn-title"; btn.innerText = "⚙️ CONFIG"; btn.onclick = openConfigModal; titleScreen.appendChild(btn); } } }
async function connectToBoard() { try { const btn = el("bt-connect-btn"); if (bluetoothDevice && bluetoothDevice.gatt.connected) { alert("既に接続されています"); return; } unlockAudioContext(); btn.innerText = "Scanning..."; const device = await navigator.bluetooth.requestDevice({ filters: [{ namePrefix: 'DARTSLIVE' }], optionalServices: [DL_SERVICE_UUID] }); bluetoothDevice = device; device.addEventListener('gattserverdisconnected', onDisconnected); const server = await device.gatt.connect(); bluetoothServer = server; const service = await server.getPrimaryService(DL_SERVICE_UUID); const characteristic = await service.getCharacteristic(DL_NOTIFY_UUID); await characteristic.startNotifications(); characteristic.addEventListener('characteristicvaluechanged', handleBluetoothNotify); btn.innerText = "📡 CONNECTED"; btn.classList.add("connected"); addLog(">> ダーツボード接続成功！", "log-heal"); } catch (error) { console.error("BT Error:", error); alert("接続に失敗しました: " + error); const btn = el("bt-connect-btn"); btn.innerText = "📡 CONNECT BOARD"; btn.classList.remove("connected"); } }
function unlockAudioContext() { ["se-single", "se-double", "se-triple", "se-bull", "se-dbull", "se-hit", "se-attack"].forEach(id => { const audio = document.getElementById(id); if (audio) { audio.volume = 0; audio.play().then(() => { audio.pause(); audio.currentTime = 0; audio.volume = 0.5; }).catch(e => console.log("Audio unlock skipped:", e)); } }); }
function onDisconnected(event) { const btn = el("bt-connect-btn"); btn.innerText = "📡 CONNECT BOARD"; btn.classList.remove("connected"); addLog(">> ダーツボード切断", "log-enemy"); }
function handleBluetoothNotify(event) { if (el("game-screen").style.display === "none" || isProcessing) return; const value = event.target.value; if (value.byteLength > 2) { const areaId = value.getUint8(2); const scoreData = DL_SCORE_MAP[areaId]; if (scoreData !== undefined && scoreData !== "CHANGE") { const score = scoreData[0]; const type = scoreData[1]; if (type === 4) playSE("se-dbull"); else if (type === 3) playSE("se-bull"); else if (type === 2) playSE("se-triple"); else if (type === 1) playSE("se-double"); else playSE("se-single"); processOneThrow(score); } } }
function initGameSession(startStage, continueMode = false) { if (!continueMode) { player = { hp: 100, maxHp: 100, mp: 3, maxMp: 10, items: { potion: 0, ether: 0, seed: 0 }, state: { power: false, shield: false, weakLock: false, barrier: false, guardTurn: 0, magicCylinder: false, hexSealTrap: false, huge: 0, atkBonus: 0, itemLock: false }, setCard: null, deck: [], hand: [], discard: [], deckLocked: false }; totalGameTurns = 0; totalScore = 0; totalDarts = 0; clearedStagesLog = []; } startTransition(startStage, continueMode); }
function startTransition(sel, continueMode) { let t = "STAGE " + sel; let s = ""; let warning = false; if (sel === 1) { t = "旅立ちの森"; s = "Forest of Beginnings"; } if (sel === 2) { t = "荒れ狂う荒野"; s = "Raging Wasteland"; } if (sel === 3) { t = "誘惑の迷宮"; s = "Labyrinth of Temptation"; } if (sel === 4) { t = "幻想の狂宴"; s = "Toon Nightmare"; warning = true; } if (sel === 5) { t = "燃えたぎる火口"; s = "Burning Crater"; warning = true; } if (sel === 6) { t = "神の試練"; s = "God's Testing Ground"; warning = true; } el("chapter-title").innerText = t; el("chapter-sub").innerText = s; const ch = el("chapter-screen"); if (warning) { playSE("se-warning"); ch.classList.add("chapter-extra"); } else { playSE("se-tap"); ch.classList.remove("chapter-extra"); } el("black-curtain").classList.add("fade-in"); setTimeout(() => { el("title-screen").style.display = "none"; ch.style.display = "flex"; ch.style.opacity = 1; setupStage(sel, continueMode); setTimeout(() => { ch.style.opacity = 0; setTimeout(() => { ch.style.display = "none"; el("black-curtain").classList.remove("fade-in"); checkOpeningSkill(); }, 1000); }, warning ? 4000 : 2500); }, 1000); }
function setupStage(sel, continueMode) { stage = sel; floor = 1; isProcessing = false; extraBossTurnCount = 0; currentTurn = 1; stageStartTurn = totalGameTurns; if(!continueMode) totalDarts = 0; if(el("avg-display")) el("avg-display").innerText="0.0"; if(el("rt-display")) el("rt-display").innerText="(Rt -)"; el("battle-log").innerHTML=""; el("game-screen").style.display="block"; const enemyPanel = el("enemy-panel"); if (enemyPanel && !document.getElementById("battle-announcer")) { const announcer = document.createElement("div"); announcer.id = "battle-announcer"; enemyPanel.appendChild(announcer); } player.state = { power:false, shield:false, weakLock:false, barrier:false, guardTurn:0, magicCylinder:false, hexSealTrap:false, huge:0, atkBonus:0, itemLock:false }; player.setCard = null; if (!continueMode) { player.mp = 3; player.deckLocked = false; if (!savedData.deck || savedData.deck.length < DECK_SIZE) { player.deckLocked = true; player.deck = []; player.hand = []; player.discard = []; addLog(`⚠ デッキ不完全: カード機能封鎖`, "log-system"); } else { player.deck = shuffleArray([...savedData.deck]); player.hand = []; player.discard = []; for(let i=0; i<INITIAL_HAND; i++) drawCard(true); } } else { addLog(">> 前ステージの状態を引き継ぎました", "log-system"); } spawnEnemy(); resizeGame(); }
function spawnEnemy() { try { enemy.state = { charge: false, guard: false, guardType: null, guardTurn: 0, atkBuff: 0, isStunned: false, toonSkin: false, barrierLimit: 0, sliferThunder: false }; player.state.power = false; player.state.shield = false; player.state.weakLock = false; player.state.barrier = false; player.state.guardTurn = 0; player.state.magicCylinder = false; player.state.hexSealTrap = false; player.state.huge = 0; player.state.atkBonus = 0; player.state.itemLock = false; currentTurn = 1; turnInputs = []; currentInput = ""; restrictInput = false; updateScoreDisplay(); isJustFinish = false; waitingForChest = false; dropGuaranteed = false; weakHitCount = 0; el("flash-overlay").className = ""; el("game-container").classList.remove("shake-heavy", "shake-medium", "shake-small"); el("game-container").className = "container"; el("boss-label").style.display = "none"; el("enemy-img").style.display = "block"; el("chest-img").style.display = "none"; let bgKey = stage; if (stage === 4) bgKey = floor >= 5 ? "4_2" : "4_1"; if (stage === 6) bgKey = 6; if (GAME_DATA.bg[bgKey]) el("game-container").style.backgroundImage = `url('${GAME_DATA.bg[bgKey]}')`; let list = GAME_DATA.enemies[stage] || GAME_DATA.enemies[1]; if(stage===5) list = GAME_DATA.enemies[5]; if(stage===6) list = GAME_DATA.enemies[6]; enemy.data = list[(floor - 1) % list.length]; enemy.maxHp = enemy.data.hp || (100 + (stage-1)*50 + (floor-1)*30); if(floor===5 || (stage===4 && floor===6)) { if (!enemy.data.hp){enemy.maxHp += 50;} el("game-container").classList.add("boss-mode"); el("boss-label").style.display="inline"; playBGM("bgm-boss"); } else playBGM("bgm-battle"); enemy.name = enemy.data.name; el("enemy-img").src = enemy.data.img; enemy.hp = enemy.maxHp; displayEnemyHP = enemy.hp; triggerTrap('summon'); updateInfo(); addLog(`=== STAGE ${stage} - ${floor}F START ===`, "system"); isProcessing = false; } catch (e) { console.error("Spawn Error:", e); isProcessing = false; } }
function checkOpeningSkill() { if (stage === 3 && floor === 1) { setTimeout(() => { showSkillCutin("護封剣の加護", "gold"); setTimeout(() => { enemy.state.guardType = 'cut'; enemy.state.guardTurn = 3; addLog(">> 先制行動: 敵が光の護封剣(3T)を展開！", "log-enemy"); updateInfo(); }, 1200); }, 500); } }
function handleEnter() { if (isProcessing) return; if (currentInput !== "") { const val = parseInt(currentInput); if (!isNaN(val)) { if (val < 0 || val > 60) { alert("単発の最大値は 60 (T20) です"); currentInput = ""; updateScoreDisplay(); return; } if (val === 50) playSE("se-bull"); else if (val >= 51) playSE("se-triple"); else playSE("se-hit"); processOneThrow(val); currentInput = ""; updateScoreDisplay(); } } }
/* --- main.js UPDATE: processOneThrow (Stability Fix) --- */
/* --- main.js UPDATE: processOneThrow (v2.11.16 Stable) --- */
function processOneThrow(score) {
    // ★ 敵死亡時・処理中の入力遮断 (バグ防止)
    if (enemy.hp <= 0 || isProcessing) return;
    if (restrictInput && turnInputs.length > 0) return;

    let singleDmg = score;
    let weakHit = false;

    // 特殊ルール
    if (stage === 6 && floor === 5 && singleDmg <= 15) { singleDmg = 0; addLog("召雷弾! (15以下無効)", "log-enemy"); }
    if (stage === 4 && floor === 6 && currentTurn % 2 === 0 && singleDmg < 10) { singleDmg = 0; addLog("結界! (10未満無効)", "log-enemy"); }
    if (enemy.state.barrierLimit > 0 && singleDmg < enemy.state.barrierLimit) { singleDmg = 0; addLog(`結界! (${enemy.state.barrierLimit}未満無効)`, "log-enemy"); }

    // 補正
    if (player.state.atkBonus > 0) { singleDmg += player.state.atkBonus; player.state.atkBonus = 0; }
    if (player.state.power) { singleDmg = Math.floor(singleDmg * 2.0); player.state.power = false; }
    if (player.state.huge !== 0) {
        if (player.state.huge === 1) singleDmg = Math.floor(singleDmg * 3.0);
        else singleDmg = Math.floor(singleDmg * 0.5);
        player.state.huge = 0;
    }
    
    // 弱点・防御
    if (player.state.weakLock || (score >= 51 && enemy.data.weak && (score % enemy.data.weak === 0))) { weakHit = true; }
    if (stage === 4 && floor === 4 && currentTurn % 3 === 0) singleDmg = Math.max(0, singleDmg - 15);
    if (enemy.state.toonSkin) singleDmg = Math.max(0, singleDmg - 15);
    
    if (enemy.state.guardType === 'cut') singleDmg = Math.floor(singleDmg * 0.8);
    if (enemy.state.guardType === 'half') singleDmg = Math.floor(singleDmg * 0.5);
    if (enemy.state.guard) { singleDmg = Math.floor(singleDmg / 2); enemy.state.guard = false; addLog("敵の防御で半減！", "system"); }

    // ダメージ適用
    if (enemy.hp - singleDmg === 0) isJustFinish = true;
    enemy.hp = Math.max(0, enemy.hp - singleDmg);
    
    totalScore += score;
    totalDarts++;
    turnInputs.push(score);
    updateScoreDisplay();

    // 演出
    if (weakHit) {
        dropGuaranteed = true; weakHitCount++;
        addLog(`WEAK HIT!!`, "log-weak");
        if (!player.state.weakLock) {
            if (el("se-weak")) playSE("se-weak");
            el("flash-overlay").className = "flash-purple"; setTimeout(() => el("flash-overlay").className = "", 600);
        }
    }
    if (player.state.weakLock) player.state.weakLock = false;

    triggerEffect(el("enemy-panel"), singleDmg, false);
    animateValue(el("enemy-hp-value"), displayEnemyHP, enemy.hp, 300);
    displayEnemyHP = enemy.hp;
    
    updateInfo();

    // 勝利判定
    if (enemy.hp <= 0) {
        isProcessing = true; // ★ 入力ロック
        totalGameTurns++;
        setTimeout(winBattle, 1000);
        return;
    }

    if (turnInputs.length >= 3 || (restrictInput && turnInputs.length >= 1)) {
        setTimeout(finishPlayerTurn, 1000);
    }
}
function finishPlayerTurn() { totalGameTurns++; if (restrictInput) { restrictInput = false; addLog("束縛が解けた", "log-system"); } if (enemy.state.guardType) { enemy.state.guardTurn--; if (enemy.state.guardTurn <= 0) { enemy.state.guardType = null; addLog("敵の護封剣が消滅", "log-system"); } } if (player.state.itemLock) { player.state.itemLock = false; addLog("粘着が取れた", "log-system"); } enemy.state.toonSkin = false; enemy.state.barrierLimit = 0; turnInputs = []; currentInput = ""; updateScoreDisplay(); setTimeout(enemyTurn, 500); }
function enemyTurn() { if (enemy.state.isStunned) { addLog(`${enemy.name}はスタン中`, "log-system"); enemy.state.isStunned = false; endEnemyTurn(); return; } if (player.state.hexSeal) { addLog("呪縛により攻撃力半減", "log-skill"); } if (stage === 6) { if (floor === 3) { if (Math.random() < 0.3) { enemy.hp = enemy.maxHp; showSkillCutin("再 生", "heal"); setTimeout(() => { addLog("HP全回復！", "log-heal"); animateValue(el("enemy-hp-value"), displayEnemyHP, enemy.hp, 500); displayEnemyHP = enemy.hp; updateInfo(); endEnemyTurn(); }, 1200); return; } } if (floor === 4) { if (!player.state.itemLock && Math.random() < 0.3) { showSkillCutin("スライムの粘着", "earth"); setTimeout(() => { player.state.itemLock = true; updateInfo(); addLog("粘着！アイテム封印", "log-enemy"); doEnemyAttack(1.0); }, 1200); return; } } if (floor === 5) { extraBossTurnCount++; if (extraBossTurnCount % 5 === 0) { showSkillCutin("サンダー・フォース", "fire"); setTimeout(() => { addLog("神の怒り！", "log-enemy"); doEnemyAttack(1.0, { isBossUlt: true, fixedDmg: 80 }); }, 1200); return; } if (Math.random() < 0.4) { enemy.state.atkBuff += 0.1; addLog(`神の攻撃力UP (x${(1.0 + enemy.state.atkBuff).toFixed(1)})`, "log-enemy"); } doEnemyAttack(1.2 * (1.0 + enemy.state.atkBuff)); return; } } if (stage === 4 && floor === 3 && Math.random() < 0.4) { showSkillCutin("呪いの視線", "earth"); setTimeout(() => { player.mp = Math.max(0, player.mp - 2); addLog("MP2減少", "log-enemy"); doEnemyAttack(1.0); }, 1200); return; } if (stage === 5) { extraBossTurnCount++; if (extraBossTurnCount % 5 === 0) { showSkillCutin("黒 炎 弾", "fire"); setTimeout(() => { player.mp = Math.max(0, player.mp - 5); addLog("MP5消滅 & 大ダメージ", "log-enemy"); doEnemyAttack(1.0, { isBossUlt: true, fixedDmg: 50 }); }, 1200); return; } doEnemyAttack(1.3); return; } if (stage === 3) { if (floor === 2 && Math.random() < 0.3) { showSkillCutin("誘惑の風", "wind"); setTimeout(() => { if (player.mp > 0) { player.mp = Math.max(0, player.mp - 1); enemy.hp = Math.min(enemy.hp + 20, enemy.maxHp); addLog("MP吸収", "log-enemy"); } doEnemyAttack(1.0); }, 1200); return; } if (floor === 5) { enemy.state.atkBuff += 0.1; addLog(`攻撃力UP (x${(1.0 + enemy.state.atkBuff).toFixed(1)})`, "log-enemy"); if (currentTurn % 4 === 0) { showSkillCutin("愛の鞭・ブレス", "fire"); setTimeout(() => { player.mp = 0; addLog("MP消滅＆大ダメージ", "log-enemy"); doEnemyAttack(2.0 * (1.0 + enemy.state.atkBuff)); }, 1200); return; } doEnemyAttack(1.0 * (1.0 + enemy.state.atkBuff)); return; } } if (stage === 1) { if (floor === 4 && player.mp > 0 && Math.random() < 0.3) { showSkillCutin("猛毒の鱗粉", "earth"); setTimeout(() => { player.mp = Math.max(0, player.mp - 1); addLog("猛毒！MP-1", "log-enemy"); doEnemyAttack(1.0); }, 1200); return; } } if (stage === 4 && floor === 1 && Math.random() < 0.3) { showSkillCutin("トゥーン・ラッシュ", "wind"); setTimeout(() => { addLog("2回攻撃！", "log-enemy"); doEnemyAttack(0.7, { callback: () => { setTimeout(() => doEnemyAttack(0.7), 800); } }); }, 1200); return; } if (stage === 4 && floor === 2 && currentTurn === 5) { showSkillCutin("死のびっくり箱", "fire"); setTimeout(() => { addLog("死の箱！999ダメ", "log-enemy"); doEnemyAttack(0, { fixedDmg: 999, ignoreShield: true }); }, 1200); return; } if (stage === 4 && floor === 4 && currentTurn % 3 === 0) { showSkillCutin("トゥーン・スキン", "earth"); setTimeout(() => { enemy.state.toonSkin = true; addLog("硬質化！被ダメ-15", "log-enemy"); updateInfo(); endEnemyTurn(); }, 1200); return; } if (stage === 4 && floor === 5 && currentTurn % 3 === 0) { showSkillCutin("幻想の儀式", "wind"); setTimeout(() => { addLog("儀式！HP吸収", "log-enemy"); doEnemyAttack(1.2, { isDrain: true }); }, 1200); return; } if (stage === 4 && floor === 6 && currentTurn % 2 === 0) { showSkillCutin("千眼の邪教神", "wind"); setTimeout(() => { enemy.state.barrierLimit = 10; addLog("結界！10未満無効", "log-enemy"); doEnemyAttack(1.2); }, 1200); return; } if (stage === 3) { if (floor === 1 && enemy.state.guardTurn > 0) { addLog(`光の護封剣 残${enemy.state.guardTurn}T`, "log-enemy"); doEnemyAttack(1.0); return; } if (floor === 3 && Math.random() < 0.3) { showSkillCutin("サイバー・ボンテージ", "wind"); setTimeout(() => { restrictInput = true; addLog("拘束！次1投制限", "log-enemy"); doEnemyAttack(1.0); }, 1200); return; } if (floor === 4 && Math.random() < 0.3) { showSkillCutin("トライアングル・エクスタシー", "wind"); setTimeout(() => { addLog("3回攻撃！", "log-enemy"); doEnemyAttack(0.6, { callback: () => { setTimeout(() => doEnemyAttack(0.6, { callback: () => { setTimeout(() => doEnemyAttack(0.6), 600); } }), 600); } }); }, 1200); return; } } if (stage === 2) { if (floor === 2 && Math.random() < 0.3) { showSkillCutin("俊足の連撃", "fire"); setTimeout(() => { addLog("2回攻撃！", "log-enemy"); doEnemyAttack(0.7, { callback: () => { setTimeout(() => doEnemyAttack(0.7), 800); } }); }, 1200); return; } if (floor === 3 && Math.random() < 0.3) { showSkillCutin("死肉の渇望", "fire"); setTimeout(() => { addLog("与ダメ吸収", "log-enemy"); doEnemyAttack(1.0, { isDrain: true }); }, 1200); return; } if (floor === 4 && enemy.hp <= enemy.maxHp * 0.5 && Math.random() < 0.5) { showSkillCutin("狂暴化", "fire"); setTimeout(() => { addLog("狂暴化！攻撃1.5倍", "log-enemy"); doEnemyAttack(1.5); }, 1200); return; } if (floor === 5 && Math.random() < 0.3) { showSkillCutin("恐竜剣・兜割り", "earth"); setTimeout(() => { addLog("兜割り！シールド無効", "log-enemy"); doEnemyAttack(1.8, { ignoreShield: true }); }, 1200); return; } } if (stage === 1) { if (floor === 3) { if (Math.random() < 0.2) { showSkillCutin("自己再生", "heal"); setTimeout(() => { enemy.hp = Math.min(enemy.hp + 20, enemy.maxHp); playSE("se-heal"); addLog("HP20回復", "log-heal"); animateValue(el("enemy-hp-value"), displayEnemyHP, enemy.hp, 500); displayEnemyHP = enemy.hp; updateInfo(); endEnemyTurn(); }, 1200); return; } if (Math.random() < 0.4) { showSkillCutin("鉄壁の守り", "earth"); setTimeout(() => { enemy.state.guard = true; addLog("鉄壁！ダメージ半減", "log-enemy"); updateInfo(); endEnemyTurn(); }, 1200); return; } } if (floor === 5) { if (enemy.state.charge) { enemy.state.charge = false; showSkillCutin("森の破壊衝動", "earth"); setTimeout(() => { doEnemyAttack(3.0); }, 1200); return; } if (Math.random() < 0.3) { enemy.state.charge = true; addLog(`力を溜めている…`, "log-enemy"); updateInfo(); endEnemyTurn(); return; } } } doEnemyAttack(1.0); }
function doEnemyAttack(mult, options = {}) { const { ignoreShield = false, isDrain = false, isBossUlt = false, fixedDmg = 0, callback = null } = options; let baseDmg = 0; if (fixedDmg > 0) { baseDmg = Math.floor(fixedDmg * mult); } else { const base = 2 + floor + (stage - 1) * 3; baseDmg = Math.floor((base + Math.floor(Math.random() * 6)) * mult); } let finalDmg = baseDmg; if (typeof triggerTrap === "function") { finalDmg = triggerTrap('attack', baseDmg); } if (finalDmg === 0) { updateInfo(); if(options.callback) options.callback(); else endEnemyTurn(); return; } if (!ignoreShield && player.state.shield) { addLog(`完全防御！`, "log-skill"); player.state.shield = false; finalDmg = 0; triggerEffect(el("game-screen"), 0, true); el("flash-overlay").className = "flash-blue"; setTimeout(() => el("flash-overlay").className = "", 300); updateInfo(); if (callback) callback(); else endEnemyTurn(); return; } if (player.state.guardTurn > 0) { finalDmg = Math.floor(finalDmg * 0.5); addLog("護封剣！ダメージ半減", "log-skill"); } if (isBossUlt) { playSE("se-boom"); el("flash-overlay").className = "flash-fire"; setTimeout(() => el("flash-overlay").className = "", 600); } else { playSE("se-hit"); } player.hp = Math.max(0, player.hp - finalDmg); triggerEffect(el("game-screen"), finalDmg, true); if (player.hp <= 0) { updateInfo(); setTimeout(loseGame, 1000); return; } if (isDrain && finalDmg > 0) { const heal = Math.floor(finalDmg * 0.5); enemy.hp = Math.min(enemy.maxHp, enemy.hp + heal); addLog(`敵が${heal}回復！`, "log-skill"); triggerEffect(el("enemy-panel"), heal, false, true); } updateInfo(); if (callback) callback(); else endEnemyTurn(); }
function triggerTrap(triggerType, dmg = 0) { if (!player.setCard) return dmg; const trapId = player.setCard; let modifiedDmg = dmg; let triggered = false; if (triggerType === 'attack') { if (trapId === 303) { addLog("【罠】聖なるバリア！完全無効＆反撃！", "log-skill"); playSE("se-boom"); triggerEffect(el("enemy-panel"), 50, false); enemy.hp = Math.max(0, enemy.hp - 50); modifiedDmg = 0; triggered = true; } else if (trapId === 602) { addLog(`【罠】魔法の筒！${dmg}反射！`, "log-skill"); playSE("se-boom"); triggerEffect(el("enemy-panel"), dmg, false); enemy.hp = Math.max(0, enemy.hp - dmg); modifiedDmg = 0; triggered = true; } else if (trapId === 703) { addLog("【罠】六芒星の呪縛！半減＆スタン！", "log-skill"); playSE("se-buff"); enemy.state.isStunned = true; modifiedDmg = Math.floor(dmg * 0.5); triggered = true; } else if (trapId === 403) { addLog("【罠】はさみ撃ち！迎撃80ダメージ！", "log-skill"); playSE("se-attack"); triggerEffect(el("enemy-panel"), 80, false); enemy.hp = Math.max(0, enemy.hp - 80); triggered = true; } } if (triggerType === 'summon') { if (trapId === 302) { addLog("【罠】落とし穴！出鼻を挫く50ダメ＆スタン！", "log-skill"); playSE("se-hit"); triggerEffect(el("enemy-panel"), 50, false); enemy.hp = Math.max(0, enemy.hp - 50); enemy.state.isStunned = true; triggered = true; } } if (triggered) { player.discard.push(player.setCard); player.setCard = null; el("flash-overlay").className="flash-gold"; setTimeout(()=>el("flash-overlay").className="",300); animateValue(el("enemy-hp-value"), displayEnemyHP, enemy.hp, 500); displayEnemyHP=enemy.hp; updateInfo(); if (enemy.hp <= 0) setTimeout(winBattle, 800); } return modifiedDmg; }
function endEnemyTurn() { currentTurn++; player.mp = Math.min(player.mp + 3, player.maxMp); triggerFloatText("MP+3", el("player-mp-bar")); if (player.state.guardTurn > 0) { player.state.guardTurn--; if (player.state.guardTurn === 0) { addLog("護封剣 消滅", "log-system"); } } if (player.state.hexSeal > 0) { player.state.hexSeal--; if (player.state.hexSeal === 0) addLog("呪縛が解けた", "log-system"); } else { player.state.hexSeal = 0; } drawCard(); updateInfo(); isProcessing = false; }
function winBattle() { addLog(`${enemy.name} を倒した`, "system"); player.mp = Math.min(player.mp + 3, player.maxMp); triggerFloatText("MP+3", el("player-mp-bar")); drawCard(); if (isJustFinish) { player.maxHp += 10; const oldHP = player.hp; player.hp = Math.min(player.hp + 10, player.maxHp); playSE("se-heal"); addLog(`★JUST FINISH! MaxHP+10 & HP+10`, "heal"); animateValue(el("player-hp"), oldHP, player.hp, 500); updateInfo(); setTimeout(() => { showDialog("JUST FINISH BONUS!!", `見事！ピッタリで倒した！<br>最大HPが ${player.maxHp} にアップ！<br>HPも10回復した。`, "clear", [{ text: "OK", action: checkDrop }], 3000); }, 800); } else { setTimeout(checkDrop, 800); } }
function loseGame() { playBGM("bgm-lose"); el("game-modal").style.display = "flex"; el("modal-title").innerText = "YOU DIED"; el("modal-title").style.color = "#ff0000"; el("modal-text").innerText = "力尽きました..."; const btn = el("modal-btn"); btn.innerText = "RETURN TO TITLE"; btn.onclick = () => location.reload(); }
function checkDrop() { if (stage === 5 && floor === 1) { nextStep(); return; } if (stage === 6 && floor === 5) { nextStep(); return; } if (stage === 4 && floor === 6) { nextStep(); return; } const isBoss = (floor === 5 || (stage === 4 && floor === 6)); let dropRate = isBoss ? 1.0 : 0.3; if (dropGuaranteed) dropRate = 1.0; if (Math.random() < dropRate) { waitingForChest = true; el("enemy-img").style.display = "none"; el("chest-img").style.display = "block"; el("chest-img").classList.add("chest-shine"); playSE("se-chest"); addLog("宝箱を見つけた！", "log-item"); setTimeout(() => { if (waitingForChest) openChest(); }, 1500); } else { nextStep(); } }
function openChest() { if (!waitingForChest) return; waitingForChest = false; playSE("se-item"); let seedRate = 0.15; if (weakHitCount >= 3) seedRate = 1.0; else if (weakHitCount >= 2) seedRate = 0.50; const rand = Math.random(); let itemName = ""; let itemEffect = ""; if (rand < seedRate) { itemName = "★命の種"; itemEffect = "MaxHP +10"; player.items.seed++; } else if (Math.random() < 0.6) { itemName = "薬草"; itemEffect = "HP 50 回復"; player.items.potion++; } else { itemName = "魔法の聖水"; itemEffect = "MP 3 回復"; player.items.ether++; } updateInfo(); addLog(`宝箱: ${itemName} (${itemEffect}) を手に入れた`, "log-item"); showDialog("TREASURE!", `<span style="font-size:24px;color:#00ff00;">${itemName}</span> を手に入れた！<br>${itemEffect}<br>(アイテムボタンで使用可能)`, "item", [{ text: "OK", action: nextStep }], 2000); }
function nextStep() { floor++; const ppr = totalDarts > 0 ? ((totalScore / totalDarts) * 3).toFixed(1) : 0; const isStage5Clear = (stage === 5 && floor > 1); const isStage6Clear = (stage === 6 && floor > 5); const isStage4Clear = (stage === 4 && floor > 6); const isNormalClear = (stage <= 3 && floor > 5); if (isNormalClear || isStage4Clear || isStage6Clear || isStage5Clear) { const stageTurns = totalGameTurns - stageStartTurn; const [rank, dpBonus] = calculateStageRank(stage, stageTurns); const multipliers = { 1: 1.0, 2: 1.5, 3: 2.0, 4: 3.0, 5: 5.0, 6: 5.0 }; const mult = multipliers[stage] || 1.0; const scoreDP = Math.floor(totalScore * 0.2 * mult); let pendingBonusDP = dpBonus; clearedStagesLog.forEach(log => { pendingBonusDP += log.dp; }); let potentialTotalDP = scoreDP + pendingBonusDP; clearedStagesLog.push({ stage: stage, rank: rank, dp: dpBonus }); const currentBest = savedData.bestRanks[stage]; const ranksOrder = ["SSS", "S", "A", "B", "C"]; if (!currentBest || ranksOrder.indexOf(rank) < ranksOrder.indexOf(currentBest)) { savedData.bestRanks[stage] = rank; } playBGM("bgm-win"); if (stage === 5) { const res = finishSession("EXTRA-WIN", parseFloat(ppr), mult); showDialog("★ TRUE ENDING ★", `<span style="font-size:30px;color:#f0f;">THE LEGEND!!</span><br>最強の黒竜を倒した！<br><br>RANK: <span style="font-size:24px;color:${getRankColor(rank)};">${rank}</span><br>PPR: ${ppr}<br><br><span style="color:#ffd700; font-size:24px; font-weight:bold;">GET DP: +${res.gainedDP}</span>`, "clear", [{ text: "TITLE", action: returnToTitle }]); return; } if (stage === 6) { const res = finishSession("GOD-WIN", parseFloat(ppr), mult); showDialog("GOD DEFEATED!", `<span style="font-size:30px;color:#ffd700;">DIVINE VICTORY!</span><br>神の試練を乗り越えた！<br><br>RANK: <span style="font-size:24px;color:${getRankColor(rank)};">${rank}</span><br><br><span style="color:#ffd700; font-size:24px; font-weight:bold;">GET DP: +${res.gainedDP}</span>`, "clear", [{ text: "TITLE", action: returnToTitle }]); return; } let title = "STAGE CLEAR"; let msg = `STAGE ${stage} COMPLETED!<br>RANK: <span style="font-size:24px;color:${getRankColor(rank)};">${rank}</span><br><br>現在の獲得予定DP: <span style="color:#ffd700; font-weight:bold;">${potentialTotalDP} DP</span><br>(スコア倍率 x${mult.toFixed(1)})`; if (stage === 4) { title = "STAGE 4 CLEAR!"; msg = `<span style="font-size:28px;color:#e0b0ff;">NIGHTMARE CONQUERED!</span><br>` + msg; } const btnNext = { text: "⛺ 次へ進む (繰越)", action: () => { player.hp = Math.min(player.hp + 30, player.maxHp); if (stage === 4) initGameSession(6, true); else initGameSession(stage + 1, true); } }; const btnReturn = { text: "🏠 帰還する (確定)", action: () => { const res = finishSession("RETURN", parseFloat(ppr), mult); showDialog("MISSION COMPLETE", `帰還しました。<br><br><span style="color:#ffd700; font-size:24px; font-weight:bold;">GET DP: +${res.gainedDP}</span>`, "clear", [{ text: "TITLE", action: returnToTitle }]); } }; if (stage === 3) { const btnExtra = { text: "⚠️ EXTRA STAGE", action: () => { player.hp = Math.min(player.hp + 30, player.maxHp); initGameSession(5, true); } }; if (parseFloat(ppr) >= 70.0 || savedData.clearedExtra) { msg += "<br><br><span style='color:#ff0000;'>強力な反応を感知...挑戦しますか？</span>"; showDialog(title, msg, "clear", [btnExtra, btnReturn]); } else { msg += "<br><br>全てのエリアを踏破した！"; showDialog(title, msg, "clear", [{ text: "🏠 ALL CLEAR", action: () => { const res = finishSession("WIN", parseFloat(ppr), mult); showDialog("ALL CLEAR!", `おめでとうございます！<br><br><span style="color:#ffd700; font-size:24px; font-weight:bold;">GET DP: +${res.gainedDP}</span>`, "clear", [{ text: "TITLE", action: returnToTitle }]); } }]); } } else { showDialog(title, msg, "clear", [btnNext, btnReturn]); } } else { spawnEnemy(); } }
function returnToTitle() { playBGM("bgm-title"); el("game-container").classList.remove("boss-mode", "extra-mode"); el("game-screen").style.display = "none"; el("title-screen").style.display = "flex"; el("stage-select-screen").style.display = "none"; updateTitleScore(); }
function useItem(type) { if (isProcessing || waitingForChest) return; if (turnInputs.length > 0) { addLog(">> 投擲中はアイテムを使えません！", "log-system"); return; } if (player.state.itemLock) { playSE("se-warning"); addLog(">> 粘着されていてアイテムが使えない！", "log-system"); return; } if (type === 'potion' && player.items.potion > 0) { player.items.potion--; playSE("se-heal"); const old = player.hp; player.hp = Math.min(player.hp + 50, player.maxHp); addLog(`アイテム: 薬草使用`, "log-item"); animateValue(el("player-hp"), old, player.hp, 500); updateInfo(); } else if (type === 'ether' && player.items.ether > 0) { player.items.ether--; playSE("se-heal"); player.mp = Math.min(player.mp + 3, player.maxMp); addLog(`アイテム: 聖水使用 (MP+3)`, "log-item"); updateInfo(); } else if (type === 'seed' && player.items.seed > 0) { player.items.seed--; playSE("se-buff"); player.maxHp += 10; const old = player.hp; player.hp = Math.min(player.hp + 10, player.maxHp); addLog(`アイテム: 命の種使用`, "log-item"); animateValue(el("player-hp"), old, player.hp, 500); updateInfo(); } }
function showSkillCutin(name, type) { playSE("se-warning"); el("cutin-text-val").innerText = name; const cutin = el("skill-cutin"); cutin.className = ""; if (type === "fire") cutin.classList.add("cutin-fire"); if (type === "ice") cutin.classList.add("cutin-ice"); if (type === "earth") cutin.classList.add("cutin-earth"); if (type === "wind") cutin.classList.add("cutin-wind"); if (type === "gold") cutin.classList.add("cutin-earth"); if (type === "heal") cutin.classList.add("cutin-earth"); cutin.style.display = "flex"; el("game-container").classList.add("shake-heavy"); setTimeout(() => { cutin.style.display = "none"; el("game-container").classList.remove("shake-heavy"); }, 1500); }
function drawCard(isSilent = false) { if (player.deck.length === 0) return; if (player.hand.length >= HAND_SIZE) return; const cardId = player.deck.pop(); player.hand.push(cardId); if (!isSilent) triggerFloatText("DRAW!", el("hand-area")); updateInfo(); }
function playHandCard(index) { if(isProcessing || waitingForChest) return; if (turnInputs.length > 0) { addLog(">> 投擲中はカードを使えません！", "log-system"); return; } if (player.state.itemLock) { addLog(">> 封印されていて使えない！", "log-system"); playSE("se-warning"); return; } const cardId = player.hand[index]; const card = CARD_DB.find(c => c.id === cardId); let cost = (card.cost !== undefined) ? card.cost : 99; if (player.mp < cost) { addLog(`MPが足りません！(必要: ${cost})`, "log-system"); playSE("se-warning"); return; } if (card.id === 501 && player.hand.length < 2) { addLog("捨てる手札がありません！", "log-system"); playSE("se-warning"); return; } if (card.type === "TRAP") { if (player.setCard) { addLog("罠は1枚しかセットできません！", "log-system"); playSE("se-warning"); return; } player.mp -= cost; player.hand.splice(index, 1); player.setCard = cardId; playSE("se-buff"); addLog(`「${card.name}」をセットした！`, "log-skill"); updateInfo(); return; } player.mp -= cost; playSE("se-buff"); player.hand.splice(index, 1); player.discard.push(cardId); applyCardEffect(card); updateInfo(); }
function applyCardEffect(card) { let rawMsg = ""; switch (card.id) { case 101: player.hp = player.maxHp; rawMsg = "HP完全回復！"; playSE("se-heal"); break; case 201: const dmg201 = 100; enemy.hp = Math.max(0, enemy.hp - dmg201); enemy.state.isStunned = true; rawMsg = "100ダメージ＆スタン！"; playSE("se-boom"); triggerEffect(el("enemy-panel"), dmg201, false); break; case 202: drawCard(); drawCard(); rawMsg = "カードを2枚ドロー！"; playSE("se-heal"); break; case 301: player.state.guardTurn = 3; rawMsg = "3ターン防御(被ダメ半減)！"; break; case 302: if (enemy.state.charge) { enemy.state.charge = false; enemy.state.isStunned = true; rawMsg = "チャージ解除＆スタン！"; playSE("se-hit"); } else { rawMsg = "不発(敵はチャージしていない)"; } break; case 303: player.state.barrier = true; rawMsg = "バリア展開(次攻撃無効＆反撃)！"; break; case 401: const dmg401 = 30; enemy.hp = Math.max(0, enemy.hp - dmg401); rawMsg = "30ダメージ！"; playSE("se-attack"); triggerEffect(el("enemy-panel"), dmg401, false); break; case 402: player.hp = Math.min(player.hp + 50, player.maxHp); rawMsg = "HP50回復"; playSE("se-heal"); break; case 403: player.hp = Math.max(1, player.hp - 20); const dmg403 = 80; enemy.hp = Math.max(0, enemy.hp - dmg403); rawMsg = "自傷20＆敵に80ダメージ！"; playSE("se-attack"); triggerEffect(el("player-panel"), 20, true); triggerEffect(el("enemy-panel"), dmg403, false); break; case 404: const dmg404 = 80; enemy.hp = Math.max(0, enemy.hp - dmg404); rawMsg = "80ダメージ！"; playSE("se-attack"); triggerEffect(el("enemy-panel"), dmg404, false); break; case 405: player.state.power = true; rawMsg = "攻撃力2倍(このターン)！"; break; case 501: openDiscardSelector(); rawMsg = "捨てるカードを選んでください..."; break; case 601: const dmg601 = 150; enemy.hp = Math.max(0, enemy.hp - dmg601); while (player.hand.length > 0) player.discard.push(player.hand.pop()); rawMsg = "全手札を犠牲に150ダメージ！"; playSE("se-boom"); triggerEffect(el("enemy-panel"), dmg601, false); break; case 602: player.state.magicCylinder = true; rawMsg = "魔法の筒をセット(反射待機)！"; break; case 701: if (player.hp <= (player.maxHp * 0.5)) player.state.huge = 1; else player.state.huge = 2; rawMsg = (player.state.huge === 1) ? "HP劣勢…逆転の3倍パワー！" : "HP優勢…油断の0.5倍パワー…"; break; case 702: const dmg702 = 40; enemy.hp = Math.max(0, enemy.hp - dmg702); if (enemy.state.guard) { enemy.state.guard = false; rawMsg = "40ダメ＆敵の防御を破壊！"; } else rawMsg = "40ダメージ！"; triggerEffect(el("enemy-panel"), dmg702, false); break; case 703: player.state.hexSealTrap = true; rawMsg = "【罠】六芒星をセット！(次被弾時半減＆スタン)"; break; case 801: if (enemy.state.guard) { enemy.state.guard = false; rawMsg = "敵の防御を解除した！"; } else rawMsg = "敵は防御していなかった"; break; case 802: const dmg802 = 60; enemy.hp = Math.max(0, enemy.hp - dmg802); rawMsg = "60ダメージ！"; triggerEffect(el("enemy-panel"), dmg802, false); break; case 803: player.hp = Math.min(player.hp + 30, player.maxHp); player.state.atkBonus = 20; rawMsg = "HP30回復＆次撃+20！"; playSE("se-heal"); break; case 804: if (player.discard.length === 0) { rawMsg = "墓地にカードがない…"; break; } const magics = player.discard.filter(did => { const c = CARD_DB.find(cd => cd.id === did); return c.type === "MAGIC"; }); if (magics.length === 0) { rawMsg = "墓地に魔法がない…"; break; } const salvId = magics[Math.floor(Math.random() * magics.length)]; const dIndex = player.discard.indexOf(salvId); player.discard.splice(dIndex, 1); player.hand.push(salvId); rawMsg = `墓地から「${CARD_DB.find(c => c.id === salvId).name}」を回収！`; break; case 805: player.hp = Math.max(1, player.hp - 50); const dmg805 = 150; enemy.hp = Math.max(0, enemy.hp - dmg805); rawMsg = "自傷50＆敵に150ダメージ！"; triggerEffect(el("player-panel"), 50, true); triggerEffect(el("enemy-panel"), dmg805, false); break; default: rawMsg = "(発動)"; break; } console.log(`[Skill] ${card.name}: ${rawMsg}`); const announcerHTML = `<div style="font-size: 80%; opacity: 0.9; margin-bottom: 5px;">${card.name}</div><div>${rawMsg}</div>`; announce(announcerHTML, "log-skill"); animateValue(el("enemy-hp-value"), displayEnemyHP, enemy.hp, 500); displayEnemyHP = enemy.hp; animateValue(el("player-hp"), displayPlayerHP, player.hp, 500); displayPlayerHP = player.hp; if (enemy.hp <= 0) { isProcessing = true; setTimeout(winBattle, 800); } }
/* --- main.js UPDATE: openDiscardSelector (Size Fix) --- */
function openDiscardSelector() {
    pendingCardIndex = -1;
    const discardCandidates = [];
    player.hand.forEach((cid, idx) => {
        const c = CARD_DB.find(cd => cd.id === cid);
        discardCandidates.push({ id: cid, name: c.name, desc: c.desc, originalIndex: idx, rarity: c.rarity, type: c.type, cost: c.cost });
    });
    
    const modal = el("card-selector-modal");
    const grid = el("cs-grid");
    grid.innerHTML = "";
    
    discardCandidates.forEach(item => {
        // ★ FIX: mode="battle" で生成 (小さく表示)
        const div = createCardElement(item, "battle", 0, 1);
        
        // クリックで捨てる処理を上書き
        div.onclick = () => executeDiscardAndEffect(item.originalIndex);
        
        grid.appendChild(div);
    });
    
    el("cs-message").innerText = "墓地に送るカードを1枚選んでください";
    modal.style.display = "flex";
}
function closeCardSelector() { el("card-selector-modal").style.display = "none"; pendingCardIndex = -1; }
function executeDiscardAndEffect(discardIndex) { const discardId = player.hand[discardIndex]; player.hand.splice(discardIndex, 1); player.discard.push(discardId); playSE("se-heal"); addLog("手札を捨て、3枚ドロー！", "log-skill"); drawCard(); drawCard(); drawCard(); closeCardSelector(); updateInfo(); }
function showCardDetail(card) { const detailEl = el("deck-card-detail"); if (!detailEl) return; detailEl.innerHTML = `<span class="detail-name">${card.name}</span>${card.desc}`; }
/* --- main.js UPDATE: renderHand (Standard Format) --- */
/* --- main.js UPDATE: renderHand (Use createCardElement with 'battle') --- */
function renderHand() {
    const handArea = el("hand-area");
    handArea.innerHTML = "";
    el("hand-count-display").innerText = player.hand.length;
    
    const isThrowing = turnInputs.length > 0;
    const isCardLocked = player.state.itemLock || isThrowing;

    if (player.deckLocked) {
        el("battle-deck-count").innerText = "-";
        handArea.innerHTML = `<div class="hand-locked-msg">⚠️ NO DECK</div>`;
    } else {
        el("battle-deck-count").innerText = player.deck.length;
        if (player.hand.length === 0) {
            handArea.innerHTML = `<div class="hand-card-empty">NO CARD</div>`;
        } else {
            player.hand.forEach((cardId, index) => {
                const card = CARD_DB.find(c => c.id === cardId);
                
                // mode: 'battle'
                const div = createCardElement(card, "battle", 0, 1);
                div.className += " hand-card"; // 追加クラス
                
                if (player.mp < card.cost || isCardLocked) div.classList.add("disabled");
                
                // Click Override for Battle
                div.onclick = () => playHandCard(index);
                
                handArea.appendChild(div);
            });
        }
    }
}
/* --- main.js UPDATE: updateInfo (v2.11.14 Refined) --- */
/* --- main.js UPDATE: updateInfo (Fix Crash & UI) --- */
/* --- main.js UPDATE: updateInfo (v2.11.16 Fix) --- */
/* --- main.js UPDATE: updateInfo (v2.11.16 Clean) --- */
/* --- main.js UPDATE: updateInfo (v2.11.17 HP Color Logic) --- */
/* --- main.js UPDATE: updateInfo (v2.11.18 Enemy HP Fix) --- */
/* --- main.js UPDATE: updateInfo (v2.11.19 Blink Logic) --- */
function updateInfo() {
    if (!enemy.data) return;
    const setText = (id, text) => { const e = el(id); if(e) e.innerText = text; };
    const setHTML = (id, html) => { const e = el(id); if(e) e.innerHTML = html; };

    // Stage Info
    let stgDisp = `STAGE ${stage}`;
    if(stage===5) stgDisp = "EXTRA";
    if(stage===6) stgDisp = "STAGE 5";
    setText("stage-display", stgDisp);
    setText("floor-display", stage===5?"FINAL":`${floor}F`);
    setHTML("turn-display", `TURN ${currentTurn} <span style="font-size:12px; color:#888;">(Total ${(totalGameTurns - stageStartTurn) + 1})</span>`);

    // Enemy Info (Text Blink)
    setText("enemy-name-side", enemy.name);
    const eHpEl = el("enemy-hp-value");
    if(eHpEl) {
        eHpEl.innerText = enemy.hp;
        eHpEl.className = "hp-mega-text"; // Reset base
        
        // ★ FIX: Blink Logic
        if (enemy.hp <= enemy.maxHp * 0.2) eHpEl.classList.add("blink-fast");
        else if (enemy.hp <= enemy.maxHp * 0.5) eHpEl.classList.add("blink-slow");
    }
    
    let weakText = player.state.weakLock ? "★LOCK" : `WEAK: ${enemy.data.weak}+`;
    if(weakHitCount > 0) weakText += " <span style='color:#f0f;'>CHANCE!</span>";
    setHTML("weak-display", weakText);

    // Enemy Chips
    let eChips = "";
    if(enemy.state.guard) eChips += `<span class="status-chip chip-guard">🛡️GUARD</span>`;
    if(enemy.state.charge) eChips += `<span class="status-chip chip-charge">⚡CHARGE</span>`;
    if(enemy.state.isStunned) eChips += `<span class="status-chip chip-stun">😵STUN</span>`;
    if(enemy.state.barrierLimit > 0) eChips += `<span class="status-chip chip-barrier">💠BARRIER(${enemy.state.barrierLimit})</span>`;
    setHTML("enemy-states-side", eChips);

    // Player HP
    const hpBar = el("player-hp-bar");
    if(hpBar) {
        const pct = (player.hp / player.maxHp) * 100;
        hpBar.style.width = Math.max(0, pct) + "%";
        
        let hpClass = "hp-bar-fill player-fill";
        if (pct <= 20) hpClass += " hp-danger";
        else if (pct <= 50) hpClass += " hp-warning";
        hpBar.className = hpClass;
        
        const parent = hpBar.parentNode;
        let overlay = parent.querySelector(".hp-text-overlay");
        if(!overlay) {
            overlay = document.createElement("div");
            overlay.className = "hp-text-overlay";
            parent.appendChild(overlay);
        }
        overlay.innerText = `${player.hp} / ${player.maxHp}`;
    }
    setText("player-hp", "");

    // Player MP (Dots Only)
    const mpValEl = document.querySelector("#player-mp")?.parentNode; 
    if(mpValEl && mpValEl.classList.contains("p-val")) mpValEl.style.display = "none";
    
    let mpDots = "";
    for(let i=0; i<player.maxMp; i++) {
        mpDots += `<span class="mp-dot ${i < player.mp ? 'active' : ''}"></span>`;
    }
    setHTML("player-mp-dots", mpDots);
    
    const mpContainer = el("player-mp-dots");
    if(mpContainer) {
        if (player.mp >= player.maxMp) mpContainer.classList.add("mp-max-glow");
        else mpContainer.classList.remove("mp-max-glow");
    }

    // Player States
    let pChips = "";
    if(player.state.atkBonus > 0 || player.state.power) pChips += `<span class="status-chip chip-buff">⚔️ATK UP</span>`;
    if(player.state.guardTurn > 0) pChips += `<span class="status-chip chip-guard">🛡️SHIELD(${player.state.guardTurn})</span>`;
    if(player.state.barrier) pChips += `<span class="status-chip chip-barrier">✨BARRIER</span>`;
    if(player.state.itemLock) pChips += `<span class="status-chip chip-lock">🔒SEALED</span>`;
    setHTML("player-states-side", pChips);

    // Stats
    let ppr = totalDarts > 0 ? (totalScore / totalDarts) * 3 : 0;
    setText("avg-display", ppr.toFixed(1));
    setText("rt-display", `(Rt ${calculateRating(ppr)})`);
    
    const updateItemBtn = (btnId, count, icon) => {
        const b = el(btnId); if (!b) return;
        b.innerHTML = `${icon}x${count}`;
        b.className = "item-btn";
        if (player.state.itemLock || turnInputs.length > 0) b.classList.add("disabled");
        else if (count > 0) b.classList.add("has-item");
        else b.classList.add("disabled");
    };
    updateItemBtn("btn-potion", player.items.potion, "💊");
    updateItemBtn("btn-ether", player.items.ether, "⚗️");
    updateItemBtn("btn-seed", player.items.seed, "🌱");

    // Trap Slot
    const trapContainer = el("trap-slot-container");
    if(trapContainer) {
        trapContainer.innerHTML = "";
        if(player.setCard) {
            const c = CARD_DB.find(cd => cd.id === player.setCard);
            if(c) {
                const cardEl = createCardElement(c, "battle", 0, 1);
                cardEl.onclick = null;
                trapContainer.appendChild(cardEl);
            }
        } else {
            const emptyDiv = document.createElement("div");
            emptyDiv.id = "trap-slot";
            emptyDiv.className = "trap-slot empty";
            emptyDiv.innerHTML = "SET<br>TRAP";
            trapContainer.appendChild(emptyDiv);
        }
    }

    renderHand();
}
function openCardShop() { playSE("se-tap"); const list = el("pack-list"); list.innerHTML = ""; if(el("shop-dp-display")) el("shop-dp-display").innerText = (savedData.dp || 0); if (!savedData.cards) savedData.cards = {}; PACK_DATA.forEach(pack => { const isUnlocked = (savedData.bestRanks && savedData.bestRanks[pack.unlockStage]); if (!isUnlocked) return; const canBuy = (savedData.dp || 0) >= pack.price; const imgHTML = `<img src="${pack.img}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"><div style="display:none; width:100%; height:100%; align-items:center; justify-content:center; font-size:50px; background:#333; color:#555;">📦</div>`; const div = document.createElement("div"); div.className = "pack-item"; div.innerHTML = `<div class="pack-img-container">${imgHTML}</div><div class="pack-name">${pack.name}</div><div class="pack-desc">${pack.desc}</div><button class="pack-buy-btn" ${canBuy ? "" : "disabled"} onclick="buyPack('${pack.id}')">${canBuy ? `BUY (${pack.price} DP)` : "LACK DP"}</button>`; list.appendChild(div); }); if (list.innerHTML === "") { list.innerHTML = "<div style='color:#666; width:100%; text-align:center; padding-top:20px;'>STAGE 1 CLEAR REQUIRED</div>"; } el("card-shop-modal").style.display = "flex"; }
function buyPack(packId) { const pack = PACK_DATA.find(p => p.id === packId); if (!pack) return; if ((savedData.dp || 0) < pack.price) { playSE("se-warning"); alert("DPが足りません"); return; } savedData.dp -= pack.price; saveToDrive(); if(el("shop-dp-display")) el("shop-dp-display").innerText = savedData.dp; openCardShop(); startPackOpening(packId); }

// --- THE LEGENDARY UNBOXING ANIMATION ---
/* --- main.js UPDATE: Pack Logic (No Duplicates & Result Fix) --- */

// 重複チェック用ヘルパー
function isCardInResults(results, cardId) {
    return results.some(c => c.id === cardId);
}

function startPackOpening(packId) {
    currentPackId = packId;
    isOpeningPack = true;
    openingPhase = 1;
    
    // UI Reset
    el("card-shop-modal").style.display = "none";
    el("pack-result-modal").style.display = "flex";
    
    // 1. 抽選 (重複なし)
    const targetCards = CARD_DB.filter(c => c.packs && c.packs.includes(packId));
    packResults = [];
    
    for(let i=0; i<3; i++) {
        const isGuaranteed = (i === 2);
        let card = null;
        let attempt = 0;
        
        // 重複しないカードが出るまでループ (最大10回試行して無限ループ防止)
        while (!card || isCardInResults(packResults, card.id)) {
            attempt++;
            if (attempt > 20) break; // 安全策

            const r = Math.random();
            let rarity = "N";
            if (isGuaranteed) {
                if (r < 0.03) rarity = "UR"; else if (r < 0.20) rarity = "SR"; else rarity = "R";
            } else {
                if (r < 0.01) rarity = "UR"; else if (r < 0.10) rarity = "SR"; else if (r < 0.40) rarity = "R"; else rarity = "N";
            }
            
            let pool = targetCards.filter(c => c.rarity === rarity);
            if (pool.length === 0) pool = targetCards;
            
            const candidate = pool[Math.floor(Math.random() * pool.length)];
            
            // 既に選ばれていなければ採用
            if (!isCardInResults(packResults, candidate.id)) {
                card = candidate;
            }
        }
        
        // 万が一決まらなかったら重複許容で最後のを採用
        if (!card) card = targetCards[Math.floor(Math.random() * targetCards.length)];

        // データ保存 (即時反映)
        if (!savedData.collection) savedData.collection = {};
        if (!savedData.cards) savedData.cards = {};
        
        // NEW判定 (所持数が0ならNEW)
        const currentCount = savedData.cards[card.id] || 0;
        const isNew = (currentCount === 0);
        
        // 加算
        savedData.collection[card.id] = (savedData.collection[card.id] || 0) + 1;
        savedData.cards[card.id] = (savedData.cards[card.id] || 0) + 1;
        
        // 結果配列には「加算後の所持数」を持たせる
        packResults.push({ ...card, isNew: isNew, ownCount: savedData.cards[card.id] });
    }
    
    saveToDrive();
    
    // ソート (N -> R -> SR -> UR)
    const rarityOrder = { "N": 0, "R": 1, "SR": 2, "UR": 3 };
    packResults.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);

    // DOM構築
    renderOpeningStage(packId);
}

/* --- main.js UPDATE: renderOpeningStage (Button Hidden Initially) --- */
function renderOpeningStage(packId) {
    const container = el("pack-opening-container");
    const packImg = PACK_DATA.find(p => p.id === packId).img;
    container.innerHTML = `
        <div id="opening-stage">
            <div id="white-out" class="white-out-overlay"></div>
            <img src="${packImg}" id="pack-visual" class="opening-pack anim-drop anim-breath">
            <div id="opening-prompt" class="prompt-text">TAP TO OPEN</div>
            <div id="reveal-area" class="reveal-stage" style="display:none;"></div>
            
            <div id="action-buttons" class="action-buttons" style="display:none;">
                <button class="modal-btn" onclick="buyPack('${packId}')">ONE MORE</button>
                <button class="modal-btn" onclick="closePackResult()" style="background:#555;">QUIT</button>
            </div>
        </div>
    `;
    
    const stage = el("opening-stage");
    stage.onclick = () => proceedUnboxing();
}

// --- Global Logic for Input Lock ---
let inputLockUntilRelease = false;

// ★ Enterキーのリリース検知を追加
window.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
        inputLockUntilRelease = false; // キーを離したらロック解除
    }
});

/* --- main.js UPDATE: Unboxing Sounds --- */

function proceedUnboxing() {
    if (openingPhase === 1) {
        openingPhase = 2;
        el("opening-prompt").style.display = "none";
        const pack = el("pack-visual");
        pack.classList.remove("anim-breath");
        pack.classList.add("anim-charge");
        
        // ★ Sound: Pack Shake -> se-double (Physical sound)
        playSE("se-double");
        
        setTimeout(() => {
            playSE("se-heal"); // Holy sound
            el("white-out").style.display = "block";
            el("white-out").classList.add("white-out-anim");
            pack.style.display = "none";
            
            setTimeout(() => {
                openingPhase = 3;
                el("reveal-area").style.display = "flex";
                currentRevealIndex = 0;
                showNextRevealCard();
            }, 800);
        }, 1500);
        
    } else if (openingPhase === 3) {
        const currentCardEl = document.getElementById("reveal-card-" + currentRevealIndex);
        if (currentCardEl) {
            currentCardEl.classList.add("fly-up");
            currentRevealIndex++;
            setTimeout(showNextRevealCard, 200);
        }
    }
}

function showNextRevealCard() {
    if (currentRevealIndex >= packResults.length) {
        showPackResult();
        return;
    }
    
    const card = packResults[currentRevealIndex];
    const area = el("reveal-area");
    
    // ★ Sound: Flip -> se-item (Revived)
    playSE("se-item");
    
    // Rarity FX
    let effectClass = "";
    if (card.rarity === "UR") { 
        playSE("se-boom"); // Additional Boom for UR
        effectClass = "card-show-ur"; 
    }
    else if (card.rarity === "SR") { 
        playSE("se-buff"); // Additional Buff for SR
        effectClass = "card-show-sr"; 
    }
    
    // ここは演出用なので独自生成だが、createCardElementのHTML構造に準拠させる
    const div = document.createElement("div");
    div.id = `reveal-card-${currentRevealIndex}`;
    div.className = `std-card rarity-${card.rarity} reveal-card-zoom card-appear ${effectClass}`;
    
    const imgPath = `assets/cards/${card.id}.png`;
    const cost = (card.cost !== undefined) ? card.cost : "?";
    const bgClass = (card.type === "TRAP") ? "bg-trap" : "bg-magic";
    
    let textClass = "text-n";
    if (card.rarity === "UR") textClass = "text-ur";
    else if (card.rarity === "SR") textClass = "text-sr";
    else if (card.rarity === "R") textClass = "text-r";
    
    const sheenHTML = (card.rarity === "UR" || card.rarity === "SR") ? '<div class="card-sheen"></div>' : '';

    div.innerHTML = `
        ${card.isNew ? '<div class="new-badge">NEW!</div>' : ''}
        <div class="std-art">
            <img src="${imgPath}" onerror="this.style.display='none';">
            <div class="std-cost">${cost}</div>
            <div class="std-count">GET</div>
            ${sheenHTML}
        </div>
        <div class="std-text-area ${bgClass}">
            <div class="std-name ${textClass}" style="font-size:14px;">${card.name}</div>
            <div class="std-type">[${card.type}]</div>
            <div class="std-desc" style="font-size:10px;">${card.desc}</div>
        </div>
    `;
    
    area.innerHTML = "";
    area.appendChild(div);
}

/* --- main.js UPDATE: showPackResult (Mode Fix) --- */
function showPackResult() {
    openingPhase = 4;
    inputLockUntilRelease = true;
    
    const area = el("reveal-area");
    area.innerHTML = "";
    area.className = "result-stage";
    
    playSE("se-win");
    
    packResults.forEach((card, i) => {
        // mode: 'standard'
        const div = createCardElement(card, "standard", card.ownCount, card.ownCount);
        
        div.className += " result-card";
        div.style.animation = `pop-in 0.5s both ${i * 0.1}s`;
        
        if(card.isNew) {
            const badge = document.createElement("div");
            badge.className = "new-badge";
            badge.innerText = "NEW!";
            div.appendChild(badge);
        }
        div.onclick = null;
        setupLongPress(div, card);
        area.appendChild(div);
    });
    
    const btnArea = el("action-buttons");
    btnArea.style.display = "flex";
    setTimeout(() => btnArea.classList.add("visible"), 100);
}

// Skip Function
function skipUnboxing() {
    if (openingPhase >= 2 && openingPhase < 4) {
        showPackResult();
    }
}

/* --- main.js UPDATE: Input Handling with Release Lock --- */
window.addEventListener("keydown", function (e) {
    if (el("pack-result-modal").style.display === "flex") {
        e.preventDefault();
        
        // Skip Check (Key Repeat)
        if (e.repeat && e.key === "Enter" && openingPhase >= 2 && openingPhase < 4) {
            skipUnboxing();
            return;
        }

        if (openingPhase === 1 && e.key === "Enter") proceedUnboxing();
        else if (openingPhase === 3 && e.key === "Enter") proceedUnboxing();
        else if (openingPhase === 4) {
            // ★ Key-Up Lock Check
            if (e.key === "Enter") {
                if (inputLockUntilRelease) return; // ロック中は無視
                buyPack(currentPackId);
            }
            if (e.key === "Backspace" || e.key === "Escape") closePackResult();
        }
        return;
    }

    if (el("title-screen").style.display !== "none") { if (e.key === "1") cheatBuffer += e.key; else cheatBuffer = ""; if (cheatBuffer.endsWith("1111")) { playSE("se-item"); savedData.dp = (savedData.dp || 0) + 5000; updateTitleScore(); saveToDrive(); cheatBuffer = ""; } return; }
    if (el("game-modal").style.display === "flex" && e.key === "Enter") { const btns = document.getElementById("modal-buttons"); if (btns.children.length === 1) { e.preventDefault(); btns.children[0].click(); } return; }
    if (waitingForChest) { if (e.key === 'Enter') { e.preventDefault(); openChest(); } return; }
    if (el("game-screen").style.display !== "none" && !isProcessing) { if (e.key >= '0' && e.key <= '9') { if (currentInput.length < 3) { playSE("se-tap"); currentInput += e.key; updateScoreDisplay(); } } if (e.key === 'Backspace') { if (currentInput.length > 0) { currentInput = currentInput.slice(0, -1); updateScoreDisplay(); } } if (e.key === 'Enter') handleEnter(); }
});

// Click Handling Update for Unboxing
document.addEventListener('mousedown', (e) => {
    if (isOpeningPack && openingPhase >= 2 && openingPhase < 4) {
        // Simple skip on click for Phase 3 if needed, or stick to phase flow
        // To implement Long Press Skip on screen:
        const start = Date.now();
        const upHandler = () => {
            if (Date.now() - start > 500) skipUnboxing(); // 0.5s hold
            document.removeEventListener('mouseup', upHandler);
        };
        document.addEventListener('mouseup', upHandler);
    }
});

function closePackResult() { if (openingPhase < 4 && openingPhase > 0) return; playSE("se-tap"); el("pack-result-modal").style.display = "none"; el("pack-opening-container").innerHTML = ""; updateTitleScore(); isOpeningPack = false; openingPhase = 0; el("card-shop-modal").style.display = "flex"; }
function closeCardShop() { playSE("se-tap"); el("card-shop-modal").style.display = "none"; updateTitleScore(); }
function openCollection() { playSE("se-tap"); renderDeckEditor(); el("collection-modal").style.display = "flex"; }
function closeCollection() { playSE("se-tap"); el("collection-modal").style.display = "none";}
/* --- main.js UPDATE: renderDeckEditor (v2.11.22 Stable Layout) --- */
function renderDeckEditor() {
    if (!savedData.deck) savedData.deck = [];
    savedData.deck.sort((a, b) => a - b);
    
    const deckGrid = el("deck-grid");
    deckGrid.innerHTML = "";
    
    // Render Deck (Small Mode)
    for (let i = 0; i < DECK_SIZE; i++) {
        const cardId = savedData.deck[i];
        
        // スロットコンテナ (ガタつき防止のためのラッパーは不要、Gridセル直下に配置)
        if (cardId) {
            const card = CARD_DB.find(c => c.id === cardId);
            const totalOwned = savedData.cards[card.id] || 0;
            
            // mode: 'small'
            const div = createCardElement(card, "small", 0, totalOwned);
            div.onmouseenter = () => showCardDetail(card);
            
            // デッキリスト内での固有クラスを追加
            div.classList.add("deck-list-item");
            
            deckGrid.appendChild(div);
        } else {
            // Empty Slot
            const div = document.createElement("div");
            div.className = "deck-slot-empty";
            div.innerText = "EMPTY";
            deckGrid.appendChild(div);
        }
    }
    
    // Count Display
    const deckCount = savedData.deck.length;
    const countEl = el("deck-count");
    countEl.innerText = deckCount;
    if (deckCount < DECK_SIZE) {
        countEl.style.color = "#ff5555";
        countEl.innerText += " (あと" + (DECK_SIZE - deckCount) + "枚)";
    } else {
        countEl.style.color = "#00ff00";
        countEl.innerText += " (OK!)";
    }
    
    // Render List (Standard Mode)
    const listGrid = el("card-grid");
    listGrid.innerHTML = "";
    if (!savedData.cards) savedData.cards = {};
    
    let ownedCount = 0;
    CARD_DB.forEach(card => {
        const count = savedData.cards[card.id] || 0;
        if (count > 0) ownedCount++;
        const inDeckCount = savedData.deck.filter(id => id === card.id).length;
        const remaining = count - inDeckCount;
        
        // mode: 'standard'
        const div = createCardElement(card, "standard", remaining, count);
        listGrid.appendChild(div);
    });
    
    el("collection-rate").innerText = `${Math.floor((ownedCount / CARD_DB.length) * 100)}%`;
}
/* --- main.js UPDATE: createCardElement (Standard Format) --- */
/* --- main.js UPDATE: createCardElement (Premium Format) --- */
/* --- main.js UPDATE: createCardElement (v2.11.13 Mode Support) --- */
// mode: 'standard' (default), 'small' (deck), 'battle' (hand)
/* --- main.js UPDATE: createCardElement (Remove Tooltip) --- */
function createCardElement(card, mode = "standard", remainingCount = 1, totalCount = 0) {
    const div = document.createElement("div");
    
    const isOwned = (mode === "small" || mode === "battle" || totalCount > 0);
    const notOwnedClass = (!isOwned) ? "card-not-owned" : "";
    
    div.className = `std-card ${mode} rarity-${card.rarity} ${notOwnedClass}`;
    if (mode === "small") div.classList.add("in-deck-card");

    const imgPath = `assets/cards/${card.id}.png`;
    const cost = (card.cost !== undefined) ? card.cost : "?";
    
    const bgClass = (card.type === "TRAP") ? "bg-trap" : "bg-magic";
    let textClass = "text-n";
    if (card.rarity === "UR") textClass = "text-ur";
    else if (card.rarity === "SR") textClass = "text-sr";
    else if (card.rarity === "R") textClass = "text-r";

    const sheenHTML = (card.rarity === "UR" || card.rarity === "SR") ? '<div class="card-sheen"></div>' : '';
    const countText = (mode === "small") ? "" : `x${remainingCount}`;

    div.innerHTML = `
        <div class="std-art">
            <img src="${imgPath}" onerror="this.style.display='none';">
            <div class="std-cost">${cost}</div>
            <div class="std-count">${countText}</div>
            ${sheenHTML}
        </div>
        <div class="std-text-area ${bgClass}">
            <div class="std-name ${textClass}">${card.name}</div>
            <div class="std-type">[${card.type}]</div>
            <div class="std-desc">${card.desc}</div>
        </div>
    `;

    div.onclick = function (e) {
        if (div.dataset.longPressed === "true") {
            div.dataset.longPressed = "false";
            return;
        }
        if (!isOwned) return;
        if (typeof isOpeningPack !== 'undefined' && isOpeningPack) return;

        if (mode === "small") removeFromDeck(card.id);
        else if (mode === "standard") addToDeck(card.id);
    };

    // ★ Tooltip & Detail Hover Removed for Battle
    div.onmouseenter = (e) => {
        // Show detail only in Deck Editor (standard/small mode)
        if (mode !== "battle" && typeof showCardDetail === 'function') showCardDetail(card);
    };
    
    if (isOwned) {
        setupLongPress(div, card);
    }

    return div;
}
function setupLongPress(element, card) { let pressTimer; const LONG_PRESS_DURATION = 500; const start = (e) => { if (e.type === "mousedown" && e.button !== 0) return; element.dataset.longPressed = "false"; pressTimer = setTimeout(() => { element.dataset.longPressed = "true"; showZoomCard(card); if (navigator.vibrate) navigator.vibrate(50); }, LONG_PRESS_DURATION); }; const cancel = () => { if (pressTimer) clearTimeout(pressTimer); }; element.addEventListener("mousedown", start); element.addEventListener("touchstart", start, { passive: true }); element.addEventListener("mouseup", cancel); element.addEventListener("mouseleave", cancel); element.addEventListener("touchend", cancel); element.addEventListener("touchmove", cancel); }
function showZoomCard(card) { let overlay = document.getElementById("card-zoom-overlay"); if (!overlay) { overlay = document.createElement("div"); overlay.id = "card-zoom-overlay"; overlay.onclick = closeZoomCard; document.body.appendChild(overlay); } const imgPath = `assets/cards/${card.id}.png`; overlay.innerHTML = `<img src="${imgPath}" class="zoom-card-img"><div class="zoom-info-box"><div class="zoom-name">${card.name} <span style="font-size:14px; color:#aaa;">(${card.rarity})</span></div><div class="zoom-desc">${card.desc}</div><div class="zoom-close-hint">TAP TO CLOSE</div></div>`; overlay.style.display = "flex"; requestAnimationFrame(() => overlay.classList.add("visible")); playSE("se-tap"); }
function closeZoomCard() { const overlay = document.getElementById("card-zoom-overlay"); if (overlay) { overlay.classList.remove("visible"); setTimeout(() => { overlay.style.display = "none"; }, 200); } }
function addToDeck(cardId) {const SAME_CARD_LIMIT = 3; if (savedData.deck.length >= DECK_SIZE) { alert(`デッキは${DECK_SIZE}枚までです！`); return; } const ownedCount = savedData.cards[cardId] || 0; const currentInDeck = savedData.deck.filter(id => id === cardId).length; if (currentInDeck >= ownedCount) { alert("これ以上持っていません！"); return; } if (currentInDeck >= SAME_CARD_LIMIT) { alert(`「${getCardName(cardId)}」は3枚までです。`); return; } playSE("se-tap"); savedData.deck.push(cardId); saveToDrive(); renderDeckEditor(); }
function removeFromDeck(cardId) {playSE("se-tap"); const index = savedData.deck.indexOf(cardId); if (index > -1) { savedData.deck.splice(index, 1); } saveToDrive(); renderDeckEditor(); }
function getCardName(id) { const c = CARD_DB.find(card => card.id === id); return c ? c.name : "カード"; }
function showDialog(title, text, type = "normal", buttons = [{ text: "OK", action: null }], autoClose = 0) { const box = el("modal-box-inner"); el("modal-title").innerText = title; el("modal-text").innerHTML = text; box.className = "modal-box"; el("modal-title").style.color = "#f9a826"; if (type === "clear") { box.classList.add("modal-clear"); el("modal-title").style.color = "#fff"; } else if (type === "warning") { box.classList.add("modal-warning"); el("modal-title").style.color = "#ff0000"; } else if (type === "item") { box.classList.add("modal-item"); el("modal-title").style.color = "#00ff00"; } const btnGroup = el("modal-buttons"); btnGroup.innerHTML = ""; buttons.forEach(b => { const btn = document.createElement("button"); btn.className = "modal-btn"; btn.innerText = b.text; btn.onclick = function () { if (window.dialogTimeout) clearTimeout(window.dialogTimeout); playSE("se-tap"); el("game-modal").style.display = "none"; if (b.action) b.action(); }; btnGroup.appendChild(btn); }); el("game-modal").style.display = "flex"; if (autoClose > 0 && buttons.length > 0) { const primaryAction = buttons[0].action; window.dialogTimeout = setTimeout(() => { el("game-modal").style.display = "none"; if (primaryAction) primaryAction(); }, autoClose); } }
function calculateStageRank(stg, turns) { if (stg === 5 || stg === 6) { if (turns <= 25) return ["SSS", 1000]; if (turns <= 35) return ["S", 600]; if (turns <= 50) return ["A", 300]; if (turns <= 70) return ["B", 100]; return ["C", 50]; } else if (stg === 4) { if (turns <= 25) return ["SSS", 1000]; if (turns <= 35) return ["S", 600]; if (turns <= 50) return ["A", 300]; if (turns <= 70) return ["B", 100]; return ["C", 50]; } else { if (turns <= 12) return ["SSS", 1000]; if (turns <= 16) return ["S", 600]; if (turns <= 22) return ["A", 300]; if (turns <= 30) return ["B", 100]; return ["C", 50]; } }
function finishSession(resultType, ppr, multiplier = 1.0) { let earnedDP = 0; clearedStagesLog.forEach(log => { earnedDP += log.dp; }); savedData.dp = (savedData.dp || 0); const curVal = stage * 100 + floor; const bestVal = savedData.highScore.stage * 100 + savedData.highScore.floor; let isNewRecord = false; if (curVal > bestVal) { savedData.highScore.stage = stage; savedData.highScore.floor = floor; isNewRecord = true; } if (ppr > savedData.highScore.avg) { savedData.highScore.avg = ppr; isNewRecord = true; } if (resultType === "EXTRA-WIN") savedData.clearedExtra = true; const now = new Date(); const dateStr = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${("0" + now.getMinutes()).slice(-2)}`; let stgName = (stage === 6) ? "STAGE 5" : (stage === 5 ? "EXTRA" : "S" + stage + "-" + floor + "F"); let resultText = resultType; let gainedDP = 0; const scoreDP = Math.floor(totalScore * 0.2 * multiplier); let rankDP = 0; clearedStagesLog.forEach(log => rankDP += log.dp); gainedDP = scoreDP + rankDP; savedData.dp += gainedDP; if (clearedStagesLog.length > 0 && resultType === "RETURN") { const last = clearedStagesLog[clearedStagesLog.length - 1]; resultText = `CLEAR(${last.rank})`; } const historyItem = { date: dateStr, stage: stage, floor: floor, stgName: stgName, result: resultText, dp: gainedDP, ppr: isNaN(ppr) ? 0 : parseFloat(ppr), rt: calculateRating(isNaN(ppr) ? 0 : parseFloat(ppr)) }; if (!savedData.history) savedData.history = []; savedData.history.unshift(historyItem); if (savedData.history.length > 50) savedData.history.pop(); updateTitleScore(); saveToDrive(); return { isNewRecord: isNewRecord, gainedDP: gainedDP }; }
/* --- main.js UPDATE: showHistory (v2.11.21 Date Sort) --- */
function showHistory() {
    const modal = el("history-modal");
    
    modal.innerHTML = `
        <div class="modal-box" style="position:relative; width:90%; max-width:600px; max-height:80vh; padding:20px; background:rgba(0,0,0,0.95); border:1px solid #444;">
            <div style="font-family:'Cinzel Decorative'; font-size:20px; margin-bottom:15px; text-align:center; color:#fff;">
                BATTLE LOG
            </div>
            <button class="sub-btn" onclick="closeHistory()" style="background:transparent; border:none; font-size:24px; color:#fff; position:absolute; top:10px; right:15px; cursor:pointer;">×</button>
            <div id="history-list" class="history-list"></div>
        </div>
    `;

    const list = el("history-list");
    
    if (!savedData.history || savedData.history.length === 0) {
        list.innerHTML = "<div style='padding:40px; text-align:center; color:#666;'>NO DATA</div>";
    } else {
        // ★ FIX: 日付文字列を解析して新しい順にソート
        const sorted = [...savedData.history].sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB - dateA; // 降順 (新しい日付が先)
        });

        sorted.forEach(h => {
            let rowClass = "history-row";
            let resTextClass = "res-lose-text";
            
            if (h.result.includes("WIN") || h.result.includes("CLEAR")) {
                rowClass += " win";
                resTextClass = "res-win-text";
            }
            if (h.result.includes("EXTRA") || h.result.includes("GOD")) {
                rowClass += " extra";
                resTextClass = "res-extra-text";
            }
            if (!h.result.includes("WIN") && !h.result.includes("CLEAR")) {
                rowClass += " lose";
            }

            const pprVal = h.ppr ? h.ppr.toFixed(1) : "-";
            const dateStr = h.date ? h.date.split(' ')[0] : "-"; // YYYY/MM/DD
            
            const div = document.createElement("div");
            div.className = rowClass;
            div.innerHTML = `
                <div class="h-date" style="font-size:10px;">${dateStr}</div>
                <div class="h-stage" style="font-size:11px;">${h.stgName}</div>
                <div class="h-result ${resTextClass}">${h.result}</div>
                <div class="h-detail">
                    <div style="font-size:11px;">+${h.dp} DP</div>
                    <div style="font-size:9px; color:#666;">Avg ${pprVal}</div>
                </div>
            `;
            list.appendChild(div);
        });
    }
    
    playSE("se-tap");
    modal.style.display = "flex";
}
function closeHistory() { playSE("se-tap"); el("history-modal").style.display = "none"; }
function resetSaveData() { if (confirm("【警告】現在のスロットのデータを完全に消去しますか？")) { allSaveData[currentSlot] = null; selectSlot(currentSlot.replace("slot", "")); saveToDrive(); } }
function exportSave() { navigator.clipboard.writeText(JSON.stringify(savedData)).then(() => alert("現在のスロットのデータをコピーしました")); }
function importSave() { const json = prompt("セーブデータ(JSON)を貼り付けてください"); if (json) { try { const d = JSON.parse(json); if (d.highScore && d.history) { savedData = d; updateTitleScore(); saveToDrive(); alert("読み込み完了"); } } catch (e) { alert("データ形式エラー"); } } }
function updateScoreDisplay() { [1, 2, 3].forEach((i) => { const sideSlot = el(`slot-${i}-side`); const mainSlot = el(`slot-${i}`); let val = "--"; let styleClass = "low"; if (i-1 < turnInputs.length) { val = turnInputs[i-1]; styleClass = (val >= 50) ? "high filled" : "filled"; } else if (i-1 === turnInputs.length) { val = currentInput; styleClass = "active"; } if(sideSlot) { sideSlot.innerText = val; sideSlot.className = `score-val ${styleClass}`; } if(mainSlot) { mainSlot.innerText = val; } }); [1, 2, 3].forEach((i) => { const dot = el(`d-dot-${i}`); if(dot) { dot.className = "d-dot"; if (i-1 < turnInputs.length) dot.classList.add("filled"); else if (i-1 === turnInputs.length) dot.classList.add("active"); } }); }
function getRankColor(r) { if (r === "SSS") return "#00ffff"; if (r === "S") return "#ffd700"; if (r === "A") return "#ff5555"; return "#fff"; }
function openConfigModal() { let modal = el("config-modal"); if (!modal) { modal = document.createElement("div"); modal.id = "config-modal"; document.body.appendChild(modal); } modal.innerHTML = `<div class="config-box"><div class="config-title">AUDIO CONFIG</div><div class="config-row"><div class="config-label"><span>BGM (Music)</span><span id="val-bgm">${Math.round(gameConfig.bgmVolume * 100)}%</span></div><input type="range" class="config-slider" min="0" max="100" value="${gameConfig.bgmVolume * 100}" oninput="updateConfigVal('bgm', this.value)"></div><div class="config-row"><div class="config-label"><span>SYSTEM SE</span><span id="val-sys">${Math.round(gameConfig.sysVolume * 100)}%</span></div><input type="range" class="config-slider" min="0" max="100" value="${gameConfig.sysVolume * 100}" oninput="updateConfigVal('sys', this.value)"></div><div class="config-row"><div class="config-label"><span style="color:#ffaaaa;">ATTACK SE (Hit)</span><span id="val-atk" style="color:#ff4444;">${Math.round(gameConfig.atkVolume * 100)}%</span></div><input type="range" class="config-slider slider-atk" min="0" max="100" value="${gameConfig.atkVolume * 100}" oninput="updateConfigVal('atk', this.value)"></div><div class="config-buttons"><button class="btn-conf btn-reset" onclick="resetConfig()">RESET</button><button class="btn-conf btn-save" onclick="closeConfig()">CLOSE</button></div></div>`; modal.style.display = "flex"; playSE("se-tap"); }
window.updateConfigVal = function (type, val) { const floatVal = val / 100; if (type === 'bgm') { gameConfig.bgmVolume = floatVal; el("val-bgm").innerText = val + "%"; updateCurrentBgmVolume(); } else if (type === 'sys') { gameConfig.sysVolume = floatVal; el("val-sys").innerText = val + "%"; } else if (type === 'atk') { gameConfig.atkVolume = floatVal; el("val-atk").innerText = val + "%"; } };
window.resetConfig = function () { gameConfig = { bgmVolume: 0.3, sysVolume: 0.5, atkVolume: 0.8 }; playSE("se-tap"); openConfigModal(); updateCurrentBgmVolume(); };
window.closeConfig = function () { saveGameConfig(); playSE("se-tap"); el("config-modal").style.display = "none"; };
function openStageSelect() { playSE("se-tap"); el("title-screen").style.display = "none"; el("stage-select-screen").style.display = "flex"; renderStageSelectScreen(); }
function closeStageSelect() { playSE("se-tap"); el("stage-select-screen").style.display = "none"; el("title-screen").style.display = "flex"; }
function renderStageSelectScreen() { const container = el("stage-list-container"); container.innerHTML = ""; const stages = [ { id: 1, name: "旅立ちの森", sub: "Forest of Beginnings", img: "assets/bg_stage1.png" }, { id: 2, name: "荒れ狂う荒野", sub: "Raging Wasteland", img: "assets/bg_stage2.png" }, { id: 3, name: "誘惑の迷宮", sub: "Labyrinth of Temptation", img: "assets/bg_stage3.png" }, { id: 4, name: "幻想の狂宴", sub: "Toon Nightmare", img: "assets/bg_stage4_1.png" }, { id: 5, name: "燃えたぎる火口", sub: "Burning Crater", img: "assets/bg_extra.png", isExtra: true }, { id: 6, name: "神の試練", sub: "God's Testing Ground", img: "assets/bg_stage5_1.png", isExtra: true } ]; stages.forEach(st => { let isLocked = false; if (st.id === 4) isLocked = !(savedData.unlockedStage4 || (savedData.bestRanks && savedData.bestRanks[3]) || savedData.clearedExtra); if (st.id === 5) isLocked = !savedData.clearedExtra; if (st.id === 6) isLocked = !(savedData.bestRanks && savedData.bestRanks[4]); const rank = savedData.bestRanks ? savedData.bestRanks[st.id] : null; let rankColor = "#444"; if (rank === "SSS") rankColor = "#00ffff"; else if (rank === "S") rankColor = "#ffd700"; else if (rank === "A") rankColor = "#ff5555"; else if (rank) rankColor = "#fff"; const div = document.createElement("div"); div.className = "stage-card-item"; if (isLocked) div.classList.add("locked"); div.innerHTML = `<img src="${st.img}" class="st-img"><div class="st-info"><div class="st-title">${isLocked ? "LOCKED" : st.name}</div><div class="st-sub">${st.sub}</div></div>${rank ? `<div class="st-rank" style="color:${rankColor}">${rank}</div>` : ""}${isLocked ? `<div class="st-rank" style="font-size:20px;">🔒</div>` : ""}`; if (!isLocked) { div.onclick = () => { el("stage-select-screen").style.display = "none"; initGameSession(st.id); }; } container.appendChild(div); }); }