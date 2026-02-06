console.log("★ main.js is loaded! (v2.6.6 Integrity)");
const el = (id) => document.getElementById(id);
function calculateRating(ppr) { if (ppr < 30) return 1; if (ppr < 40) return 2; if (ppr < 45) return 3; if (ppr < 50) return 4; if (ppr < 55) return 5; if (ppr < 60) return 6; if (ppr < 65) return 7; if (ppr < 70) return 8; if (ppr < 75) return 9; if (ppr < 80) return 10; if (ppr < 85) return 11; if (ppr < 90) return 12; if (ppr < 95) return 13; if (ppr < 100) return 14; if (ppr < 110) return 15; if (ppr < 120) return 16; if (ppr < 130) return 17; return 18; }
function shuffleArray(array) { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[array[i], array[j]] = [array[j], array[i]]; } return array; }
function animateValue(obj, s, e, d) { if (obj) obj.innerHTML = e; }
/* --- main.js (Part 1: Audio Config & Engine v2.10.0) --- */

// グローバル設定 (ブラウザ保存)
let gameConfig = { bgmVolume: 0.3, sysVolume: 0.5, atkVolume: 0.8 };
function loadGameConfig() {
    const saved = localStorage.getItem("darts_quest_config");
    if (saved) { try { gameConfig = { ...gameConfig, ...JSON.parse(saved) }; } catch (e) { } }
}
loadGameConfig(); // 起動時にロード
function saveGameConfig() { localStorage.setItem("darts_quest_config", JSON.stringify(gameConfig)); }

// 音声エンジン (タグベース)
function stopAllBGM() {
    const audio = ["bgm-title", "bgm-battle", "bgm-boss", "bgm-extra", "bgm-win", "bgm-lose"];
    audio.forEach(id => { const el = document.getElementById(id); if (el) { el.pause(); el.currentTime = 0; } });
    currentBgmId = "";
}
function playBGM(id) {
    if (currentBgmId === id) return;
    stopAllBGM();
    const a = document.getElementById(id);
    if (a) {
        currentBgmId = id;
        a.volume = gameConfig.bgmVolume; // 設定値を適用
        a.play().catch(e => { console.log("BGM Error:", e); });
    }
}
// BGM音量のリアルタイム更新（設定画面用）
function updateCurrentBgmVolume() {
    if (currentBgmId) {
        const a = document.getElementById(currentBgmId);
        if (a) a.volume = gameConfig.bgmVolume;
    }
}
function playSE(id) {
    const a = document.getElementById(id);
    if (a) {
        a.currentTime = 0;
        // 攻撃系かシステム系かで音量を分岐
        const attackSEs = ["se-hit", "se-weak", "se-attack", "se-boom", "se-damage", "se-single", "se-double", "se-triple", "se-bull", "se-dbull"];
        if (attackSEs.includes(id)) a.volume = gameConfig.atkVolume;
        else a.volume = gameConfig.sysVolume;

        if (a.volume > 0.01) a.play().catch(e => { });
    }
}
function triggerFloatText(text, targetEl) { if (!targetEl) return; const float = document.createElement("div"); float.className = "float-text-box"; float.innerText = text; const rect = targetEl.getBoundingClientRect(); document.body.appendChild(float); const left = rect.left + (rect.width / 2) - 30; const top = rect.top; float.style.left = `${left}px`; float.style.top = `${top}px`; float.style.position = "fixed"; setTimeout(() => float.remove(), 1500); }
function triggerEffect(el, dmg, isP) { el.classList.remove("shake-small", "shake-medium", "shake-heavy", "shake-ultimate"); void el.offsetWidth; if (dmg >= 150) { el.classList.add("shake-ultimate"); playSE("se-boom"); } else if (dmg >= 60) { el.classList.add("shake-heavy"); playSE("se-boom"); } else { el.classList.add(dmg >= 30 ? "shake-medium" : "shake-small"); } const pop = document.createElement("div"); pop.innerText = dmg; if (dmg >= 150) pop.className = "damage-popup dmg-ultimate"; else if (dmg >= 60) pop.className = "damage-popup dmg-heavy"; else if (dmg >= 30) pop.className = "damage-popup dmg-medium"; else pop.className = "damage-popup dmg-small"; pop.style.left = "50%"; pop.style.top = "50%"; el.appendChild(pop); setTimeout(() => pop.remove(), 1500); }
function resizeGame() {
    const scaler = el('game-scaler');
    if (!scaler) return;
    if (window.innerWidth >= 900) {
        const winW = window.innerWidth;
        const winH = window.innerHeight;
        const baseW = 900;
        const baseH = 620;
        const scale = Math.min(winW / baseW, winH / baseH) * 0.95;
        scaler.style.transform = `scale(${scale})`;
        scaler.style.width = "900px";
        scaler.style.height = "620px";
        scaler.style.position = "static";
        document.body.style.overflow = "hidden";
    } else {
        scaler.style.transform = "none";
        scaler.style.width = "100%";
        scaler.style.height = "auto";
        document.body.style.overflowY = "auto";
    }
}
function announce(text, type = "normal") {
    const ann = el("battle-announcer"); if (!ann) return;
    ann.innerHTML = text; // innerText から innerHTML に変更してタグを有効化
    ann.className = "announcer-visible";
    if (type === "danger" || type === "log-enemy") ann.classList.add("ann-danger");
    if (type === "log-skill" || type === "log-weak") ann.classList.add("ann-warn");
    // アニメーションリセットのためにクラスを付け直す処理はCSS transitionで賄う
    setTimeout(() => { ann.className = ""; }, 2000);
}
function addLog(text, type = "") {
    console.log(`[${type}] ${text}`);
    // 自動アナウンスの条件フィルタリング
    // ・"倒した" (戦闘終了時) は除外
    // ・"宝箱" (アイテム入手時) は除外
    // ・それ以外で、重要なキーワードやタイプの場合のみ表示
    if (
        (type === "log-enemy" || type === "log-skill" || type === "log-weak" || type === "log-heal" ||
            text.includes("WEAK") || text.includes("無効") || text.includes("回復"))
        && !text.includes("倒した")
        && !text.includes("宝箱")
    ) {
        announce(text, type);
    }
}
const GAME_DATA = {
    enemies: {
        1: [{ name: "プチモス", img: "assets/1-1.png", weak: 20 }, { name: "ラーバモス", img: "assets/1-2.png", weak: 19 }, { name: "進化の繭", img: "assets/1-3.png", weak: 18, hp: 260 }, { name: "グレート・モス", img: "assets/1-4.png", weak: 17, hp: 290 }, { name: "究極完全態・グレート・モス", img: "assets/1-5.png", weak: 20, hp: 420 }],
        2: [{ name: "トラコドン", img: "assets/2-1.png", weak: 19 }, { name: "ワイルド・ラプター", img: "assets/2-2.png", weak: 18, hp: 280 }, { name: "屍を貪る竜", img: "assets/2-3.png", weak: 17, hp: 310 }, { name: "二頭を持つキング・レックス", img: "assets/2-4.png", weak: 20, hp: 340 }, { name: "剣竜", img: "assets/2-5.png", weak: 19, hp: 540 }],
        3: [{ name: "デュナミス・ヴァルキリア", img: "assets/3-1.png", weak: 20, hp: 300 }, { name: "ハーピィ・レディ", img: "assets/3-2.png", weak: 19, hp: 330 }, { name: "ハーピィ・レディ・SB", img: "assets/3-3.png", weak: 18, hp: 360 }, { name: "ハーピィ・レディ三姉妹", img: "assets/3-4.png", weak: 17, hp: 390 }, { name: "ハーピィズペット竜", img: "assets/3-5.png", weak: 20, hp: 550 }],
        4: [{ name: "ダーク・ラビット", img: "assets/4-1.png", weak: 20, hp: 380 }, { name: "デビル・ボックス", img: "assets/4-2.png", weak: 19, hp: 420 }, { name: "トゥーン・デーモン", img: "assets/4-3.png", weak: 18, hp: 460 }, { name: "ブルーアイズ・トゥーン・ドラゴン", img: "assets/4-4.png", weak: 17, hp: 500 }, { name: "サクリファイス", img: "assets/4-5.png", weak: 20, hp: 550 }, { name: "サウザンド・アイズ・サクリファイス", img: "assets/4-6.png", weak: 20, hp: 800 }],
        5: [{ name: "真紅眼の黒竜", img: "assets/extra.png", weak: 20, hp: 1500 }],
        6: [{ name: "ワームドレイク", img: "assets/5-1.png", weak: 19, hp: 400 }, { name: "ヒューマノイド・スライム", img: "assets/5-2.png", weak: 18, hp: 450 }, { name: "リバイバルスライム", img: "assets/5-3.png", weak: 20, hp: 300 }, { name: "ヒューマノイド・ドレイク", img: "assets/5-4.png", weak: 17, hp: 600 }, { name: "オシリスの天空竜", img: "assets/5-5.png", weak: 20, hp: 2000 }]
    },
    bg: { 1: "assets/bg_stage1.png", 2: "assets/bg_stage2.png", 3: "assets/bg_stage3.png", 4_1: "assets/bg_stage4_1.png", 4_2: "assets/bg_stage4_2.png", 5: "assets/bg_extra.png", 6: "assets/bg_stage5_1.png" }
};
/* --- main.js (Part 1: Card Database Update v2.9.0) --- */

const CARD_DB = [
    { id: 101, name: "死者蘇生", rarity: "UR", type: "MAGIC", cost: 8, desc: "HPを最大値まで完全回復" },
    { id: 201, name: "サンダー・ボルト", rarity: "SR", type: "MAGIC", cost: 6, desc: "敵に100ダメージ＋スタン(1T行動不能)" },
    { id: 202, name: "強欲な壺", rarity: "SR", type: "MAGIC", cost: 2, desc: "MPを2消費し、カードを2枚引く。(手札上限5枚)" },
    { id: 301, name: "光の護封剣", rarity: "R", type: "MAGIC", cost: 5, desc: "3ターンの間、受けるダメージを半減" },
    { id: 302, name: "落とし穴", rarity: "R", type: "TRAP", cost: 3, desc: "敵のチャージ状態を強制解除" },
    { id: 303, name: "聖なるバリア", rarity: "R", type: "TRAP", cost: 4, desc: "次の敵の攻撃を無効化し、50ダメージ与える" },
    { id: 401, name: "火の粉", rarity: "N", type: "MAGIC", cost: 1, desc: "敵に30ダメージ" },
    { id: 402, name: "治療の神", rarity: "N", type: "MAGIC", cost: 4, desc: "HPを50回復" },
    { id: 403, name: "はさみ撃ち", rarity: "N", type: "TRAP", cost: 2, desc: "自分も20ダメージ受け、敵に80ダメージ" },
    { id: 404, name: "昼夜の大火事", rarity: "N", type: "MAGIC", cost: 3, desc: "敵に80ダメージ" },
    { id: 405, name: "突進", rarity: "N", type: "MAGIC", cost: 2, desc: "攻撃力2倍(次の1投のみ)" },

    // ★ UPDATE: 天使の施し (コスト1→2, 2ドロー→3ドロー)
    { id: 501, name: "天使の施し", rarity: "UR", type: "MAGIC", cost: 2, desc: "手札を1枚選んで捨て、カードを3枚引く。" },

    { id: 601, name: "ブラック・ホール", rarity: "SR", type: "MAGIC", cost: 7, desc: "敵に150ダメージ。ただし自分の手札を全て捨てる。" },
    { id: 602, name: "魔法の筒", rarity: "SR", type: "TRAP", cost: 4, desc: "敵の攻撃を無効化し、そのダメージをそのまま敵に与える。" },
    { id: 701, name: "巨大化", rarity: "R", type: "MAGIC", cost: 3, desc: "HP半分以下なら3倍、半分以上なら0.5倍" },
    { id: 702, name: "地割れ", rarity: "R", type: "MAGIC", cost: 3, desc: "敵に40ダメージを与え、防御状態を解除する。" },
    { id: 703, name: "六芒星の呪縛", rarity: "R", type: "TRAP", cost: 3, desc: "【罠】敵の攻撃を半減し、さらに敵をスタン(1T行動不能)させる。" },
    { id: 801, name: "守備封じ", rarity: "N", type: "MAGIC", cost: 1, desc: "敵の防御状態を解除する。" },
    { id: 802, name: "火あぶりの刑", rarity: "N", type: "MAGIC", cost: 2, desc: "敵に60ダメージ。" },
    { id: 803, name: "援軍", rarity: "N", type: "MAGIC", cost: 2, desc: "HPを30回復し、攻撃力を+20する(次の1投)。" },
    { id: 804, name: "闇の仮面", rarity: "N", type: "MAGIC", cost: 4, desc: "捨て札からランダムに魔法カードを1枚手札に加える。" },
    { id: 805, name: "最終戦争", rarity: "N", type: "MAGIC", cost: 5, desc: "敵に150ダメージ、自分に50ダメージ。" }
];
const PACK_DATA = [{ id: "vol1", name: "Vol.1 - Legend", price: 1000, desc: "伝説の始まり。基本魔法カード収録。", unlockStage: 1, img: "assets/packs/vol1.png" }, { id: "vol2", name: "Vol.2 - Awakening", price: 1500, desc: "テクニカルな戦略カードが登場。", unlockStage: 3, img: "assets/packs/vol2.png" }];
const DL_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e'; const DL_NOTIFY_UUID = '6e40fff6-b5a3-f393-e0a9-e50e24dcca9e';
const DL_SCORE_MAP = { 0x3c: [60, 2], 0x28: [20, 0], 0x50: [60, 2], 0x14: [20, 0], 0x29: [2, 1], 0x15: [1, 0], 0x3d: [3, 2], 0x01: [1, 0], 0x3a: [36, 1], 0x26: [18, 0], 0x4e: [54, 2], 0x12: [18, 0], 0x2c: [8, 1], 0x18: [4, 0], 0x40: [12, 2], 0x04: [4, 0], 0x35: [26, 1], 0x21: [13, 0], 0x49: [39, 2], 0x0d: [13, 0], 0x2e: [12, 1], 0x1a: [6, 0], 0x42: [18, 2], 0x06: [6, 0], 0x32: [20, 1], 0x1e: [10, 0], 0x46: [30, 2], 0x0a: [10, 0], 0x37: [30, 1], 0x23: [15, 0], 0x4b: [45, 2], 0x0f: [15, 0], 0x2a: [4, 1], 0x16: [2, 0], 0x3e: [6, 2], 0x02: [2, 0], 0x39: [34, 1], 0x25: [17, 0], 0x4d: [51, 2], 0x11: [17, 0], 0x2b: [6, 1], 0x17: [3, 0], 0x3f: [9, 2], 0x03: [3, 0], 0x3b: [38, 1], 0x27: [19, 0], 0x4f: [57, 2], 0x13: [19, 0], 0x2f: [14, 1], 0x1b: [7, 0], 0x43: [21, 2], 0x07: [7, 0], 0x38: [32, 1], 0x24: [16, 0], 0x4c: [48, 2], 0x10: [16, 0], 0x30: [16, 1], 0x1c: [8, 0], 0x44: [24, 2], 0x08: [8, 0], 0x33: [22, 1], 0x1f: [11, 0], 0x47: [33, 2], 0x0b: [11, 0], 0x36: [28, 1], 0x22: [14, 0], 0x4a: [42, 2], 0x0e: [14, 0], 0x31: [18, 1], 0x1d: [9, 0], 0x45: [27, 2], 0x09: [9, 0], 0x34: [24, 1], 0x20: [12, 0], 0x48: [36, 2], 0x0c: [12, 0], 0x2d: [10, 1], 0x19: [5, 0], 0x41: [15, 2], 0x05: [5, 0], 0x51: [50, 3], 0x52: [50, 4], 0x54: "CHANGE" };
let bluetoothDevice = null; let bluetoothServer = null;
let player = { hp: 100, maxHp: 100, mp: 3, maxMp: 10, items: { potion: 0, ether: 0, seed: 0 }, state: { power: false, shield: false, weakLock: false, barrier: false, guardTurn: 0, magicCylinder: false, hexSeal: false, huge: 0, atkBonus: 0, itemLock: false }, deck: [], hand: [], discard: [], deckLocked: false };
let enemy = { hp: 100, maxHp: 100, data: null, name: "", state: { charge: false, guard: false, guardType: null, guardTurn: 0, atkBuff: 0, isStunned: false, toonSkin: false, barrierLimit: 0, sliferThunder: false } };
let stage = 1; floor = 1; totalScore = 0; totalDarts = 0; let displayPlayerHP = 100; displayEnemyHP = 100; let isProcessing = false; extraBossTurnCount = 0; currentTurn = 1; let dropGuaranteed = false; weakHitCount = 0; let restrictInput = false; let turnInputs = []; let currentInput = ""; let isJustFinish = false; let waitingForChest = false; let cheatBuffer = ""; let stageStartTurn = 0; let totalGameTurns = 0; let clearedStagesLog = []; let currentBgmId = "";
const DECK_SIZE = 20; const HAND_SIZE = 5; const INITIAL_HAND = 3; const SAVE_KEY = "darts_quest_save";
let allSaveData = { "slot1": null, "slot2": null, "slot3": null, "lastPlayed": 1 }; let currentSlot = "slot1"; let savedData = { highScore: { stage: 1, floor: 1, avg: 0.0 }, history: [], clearedExtra: false, dp: 0, bestRanks: {}, unlockedStage4: false, deck: [], cards: {} };
let pendingCardIndex = -1; let pendingCardCost = 0;

window.addEventListener('resize', resizeGame);
window.addEventListener('load', () => {
    resizeGame();
    loadGameData();
    initSlotScreen();
    if (window.innerWidth < 900) document.body.style.overflowY = "auto";
});

function loadGameData() { const saved = localStorage.getItem(SAVE_KEY); if (saved) { try { allSaveData = JSON.parse(saved); } catch (e) { console.error(e); } } if (!allSaveData.slot1) allSaveData.slot1 = null; if (!allSaveData.slot2) allSaveData.slot2 = null; if (!allSaveData.slot3) allSaveData.slot3 = null; }
function saveToDrive() { allSaveData[currentSlot] = savedData; localStorage.setItem(SAVE_KEY, JSON.stringify(allSaveData)); }
function initSlotScreen() { for (let i = 1; i <= 3; i++) { const key = "slot" + i; const data = allSaveData[key]; const infoEl = el("info-" + i); if (!data) { infoEl.innerHTML = "<div class='slot-empty'>NO DATA<br>- Start New Game -</div>"; } else { let stgName = `STAGE ${data.highScore.stage}`; if (data.highScore.stage === 5) stgName = "EXTRA"; if (data.highScore.stage === 6) stgName = "STAGE 5"; let stg = `${stgName} - ${data.highScore.floor}F`; let badge = data.clearedExtra ? "<br><span style='color:#f0f;font-weight:bold;'>★ EXTRA CLEARED</span>" : ""; infoEl.innerHTML = `<div>${stg}</div><div style='color:#ffdd00;'>Avg: ${data.highScore.avg.toFixed(1)} (Rt ${calculateRating(data.highScore.avg)})</div><div style='color:#aaa;font-size:12px;'>DP: ${data.dp || 0}${badge}</div>`; } } }
function selectSlot(n) { currentSlot = "slot" + n; if (!allSaveData[currentSlot]) { allSaveData[currentSlot] = { highScore: { stage: 1, floor: 1, avg: 0.0 }, history: [], clearedExtra: false, dp: 0, bestRanks: {}, unlockedStage4: false, deck: [], cards: {} }; } savedData = allSaveData[currentSlot]; if (!savedData.deck) savedData.deck = []; if (!savedData.cards) savedData.cards = {}; allSaveData.lastPlayed = n; updateTitleScore(); playSE("se-tap"); playBGM("bgm-title"); el("slot-screen").style.display = "none"; el("title-screen").style.display = "flex"; }
function backToSlots() { stopAllBGM(); el("title-screen").style.display = "none"; el("slot-screen").style.display = "flex"; initSlotScreen(); }
function updateTitleScore() {
    // 1. ハイスコア・DPの更新
    let stg = `STAGE ${savedData.highScore.stage}`;
    if (savedData.highScore.stage === 5) stg = "EXTRA";
    if (savedData.highScore.stage === 6) stg = "STAGE 5";

    // 要素が存在する場合のみ更新（安全策）
    if (el("hs-reach")) el("hs-reach").innerText = `${stg} - ${savedData.highScore.floor}F`;
    if (el("hs-avg")) el("hs-avg").innerText = savedData.highScore.avg.toFixed(1);
    if (el("hs-rt")) el("hs-rt").innerText = "Rt " + calculateRating(savedData.highScore.avg);
    if (el("dp-display")) el("dp-display").innerText = "DP: " + (savedData.dp || 0);

    // 2. コンフィグボタンの生成（存在しなければ）
    if (!document.getElementById("btn-config-entry")) {
        const titleScreen = el("title-screen");
        if (titleScreen) {
            const btn = document.createElement("div");
            btn.id = "btn-config-entry";
            btn.className = "config-btn-title";
            btn.innerText = "⚙️ CONFIG";
            btn.onclick = openConfigModal;
            titleScreen.appendChild(btn);
        }
    }

    // ※以前ここにあった btn-st1, btn-stage4 等への操作は削除しました
}
function updateStageButton(stgNum, btnId) { const btn = el(btnId); if (!btn) return; const rank = savedData.bestRanks ? savedData.bestRanks[stgNum] : null; btn.className = "stage-btn btn-default"; if (stgNum === 4) btn.classList.add("stage4-btn"); if (stgNum === 5) btn.classList.add("extra-btn"); if (stgNum === 6) { if (!rank) btn.className = "stage-btn btn-danger"; else btn.classList.add("stage5-btn"); } if (rank) { btn.classList.remove("btn-default", "stage4-btn", "stage5-btn", "extra-btn", "btn-danger"); if (rank === "SSS") btn.classList.add("btn-prism"); else if (rank === "S") btn.classList.add("btn-gold"); else if (rank === "A") btn.classList.add("btn-silver"); else btn.classList.add("btn-copper"); } }
async function connectToBoard() { try { const btn = el("bt-connect-btn"); if (bluetoothDevice && bluetoothDevice.gatt.connected) { alert("既に接続されています"); return; } unlockAudioContext(); btn.innerText = "Scanning..."; const device = await navigator.bluetooth.requestDevice({ filters: [{ namePrefix: 'DARTSLIVE' }], optionalServices: [DL_SERVICE_UUID] }); bluetoothDevice = device; device.addEventListener('gattserverdisconnected', onDisconnected); const server = await device.gatt.connect(); bluetoothServer = server; const service = await server.getPrimaryService(DL_SERVICE_UUID); const characteristic = await service.getCharacteristic(DL_NOTIFY_UUID); await characteristic.startNotifications(); characteristic.addEventListener('characteristicvaluechanged', handleBluetoothNotify); btn.innerText = "📡 CONNECTED"; btn.classList.add("connected"); addLog(">> ダーツボード接続成功！", "log-heal"); } catch (error) { console.error("BT Error:", error); alert("接続に失敗しました: " + error); const btn = el("bt-connect-btn"); btn.innerText = "📡 CONNECT BOARD"; btn.classList.remove("connected"); } }
function unlockAudioContext() { const audioIds = ["se-single", "se-double", "se-triple", "se-bull", "se-dbull", "se-hit", "se-attack"]; audioIds.forEach(id => { const audio = document.getElementById(id); if (audio) { audio.volume = 0; audio.play().then(() => { audio.pause(); audio.currentTime = 0; audio.volume = 0.5; }).catch(e => console.log("Audio unlock skipped:", e)); } }); }
function onDisconnected(event) { const btn = el("bt-connect-btn"); btn.innerText = "📡 CONNECT BOARD"; btn.classList.remove("connected"); addLog(">> ダーツボード切断", "log-enemy"); }
function handleBluetoothNotify(event) { if (el("game-screen").style.display === "none" || isProcessing) return; const value = event.target.value; if (value.byteLength > 2) { const areaId = value.getUint8(2); const scoreData = DL_SCORE_MAP[areaId]; if (scoreData !== undefined) { if (scoreData === "CHANGE") { } else { const score = scoreData[0]; const type = scoreData[1]; if (type === 4) playSE("se-dbull"); else if (type === 3) playSE("se-bull"); else if (type === 2) playSE("se-triple"); else if (type === 1) playSE("se-double"); else playSE("se-single"); processOneThrow(score); } } } }
/* --- main.js Rewrite: initGameSession --- */
function initGameSession(startStage, continueMode = false) {
    if (!continueMode) {
        player = {
            hp: 100, maxHp: 100,
            mp: 3, maxMp: 10,
            items: { potion: 0, ether: 0, seed: 0 },
            state: { power: false, shield: false, weakLock: false, barrier: false, guardTurn: 0, magicCylinder: false, hexSealTrap: false, huge: 0, atkBonus: 0, itemLock: false },
            setCard: null, // ★ NEW: セットされた罠カードID
            deck: [], hand: [], discard: [], deckLocked: false
        };
        totalGameTurns = 0; totalScore = 0; totalDarts = 0; clearedStagesLog = [];
    }
    startTransition(startStage, continueMode);
}
function startTransition(sel, continueMode) { let t = "STAGE " + sel; let s = ""; let warning = false; if (sel === 1) { t = "旅立ちの森"; s = "Forest of Beginnings"; } if (sel === 2) { t = "荒れ狂う荒野"; s = "Raging Wasteland"; } if (sel === 3) { t = "誘惑の迷宮"; s = "Labyrinth of Temptation"; } if (sel === 4) { t = "幻想の狂宴"; s = "Toon Nightmare"; warning = true; } if (sel === 5) { t = "燃えたぎる火口"; s = "Burning Crater"; warning = true; } if (sel === 6) { t = "神の試練"; s = "God's Testing Ground"; warning = true; } el("chapter-title").innerText = t; el("chapter-sub").innerText = s; const ch = el("chapter-screen"); if (warning) { playSE("se-warning"); ch.classList.add("chapter-extra"); } else { playSE("se-tap"); ch.classList.remove("chapter-extra"); } el("black-curtain").classList.add("fade-in"); setTimeout(() => { el("title-screen").style.display = "none"; ch.style.display = "flex"; ch.style.opacity = 1; setupStage(sel, continueMode); setTimeout(() => { ch.style.opacity = 0; setTimeout(() => { ch.style.display = "none"; el("black-curtain").classList.remove("fade-in"); checkOpeningSkill(); }, 1000); }, warning ? 4000 : 2500); }, 1000); }
function setupStage(sel, continueMode) {
    stage = sel; floor = 1; isProcessing = false; extraBossTurnCount = 0; currentTurn = 1; stageStartTurn = totalGameTurns; if (!continueMode) totalDarts = 0; el("avg-display").innerText = "0.0"; el("rt-display").innerText = "(Rt -)"; el("battle-log").innerHTML = ""; el("game-screen").style.display = "block";
    const enemyPanel = el("enemy-panel");
    if (!document.getElementById("battle-announcer")) { const announcer = document.createElement("div"); announcer.id = "battle-announcer"; enemyPanel.appendChild(announcer); }
    if (!document.getElementById("active-states")) { const stateArea = document.createElement("div"); stateArea.id = "active-states"; const hpBar = el("enemy-hp-bar").parentElement; hpBar.parentNode.insertBefore(stateArea, hpBar.nextSibling); }

    // ★ UPDATE: hexSealTrap を追加 (Trap用)
    player.state = { power: false, shield: false, weakLock: false, barrier: false, guardTurn: 0, magicCylinder: false, hexSealTrap: false, huge: 0, atkBonus: 0, itemLock: false };

    if (!continueMode) { player.mp = 3; player.deckLocked = false; if (!savedData.deck || savedData.deck.length < DECK_SIZE) { player.deckLocked = true; player.deck = []; player.hand = []; player.discard = []; addLog(`⚠ デッキ不完全(${DECK_SIZE}枚未満): カード機能封鎖`, "log-system"); } else { player.deck = shuffleArray([...savedData.deck]); player.hand = []; player.discard = []; for (let i = 0; i < INITIAL_HAND; i++) drawCard(true); } } else { addLog(">> 前ステージの状態を引き継ぎました", "log-system"); } spawnEnemy(); let logStageName = "STAGE " + stage; if (stage === 5) logStageName = "EXTRA"; if (stage === 6) logStageName = "STAGE 5"; addLog(`${logStageName} START!`, "system"); resizeGame();
}
function spawnEnemy() {
    try {
        enemy.state = { charge: false, guard: false, guardType: null, guardTurn: 0, atkBuff: 0, isStunned: false, toonSkin: false, barrierLimit: 0, sliferThunder: false };
        player.state.power = false; player.state.shield = false; player.state.weakLock = false; player.state.barrier = false; player.state.guardTurn = 0; player.state.magicCylinder = false; player.state.hexSealTrap = false; player.state.huge = 0; player.state.atkBonus = 0; player.state.itemLock = false;
        
        currentTurn = 1; turnInputs = []; currentInput = ""; restrictInput = false; updateScoreDisplay(); isJustFinish = false; waitingForChest = false; dropGuaranteed = false; weakHitCount = 0;
        
        el("flash-overlay").className = ""; el("game-container").classList.remove("shake-heavy", "shake-medium", "shake-small"); el("game-container").className = "container"; el("boss-label").style.display = "none"; el("enemy-img").style.display = "block"; el("chest-img").style.display = "none";
        
        let bgKey = stage; if (stage === 4) bgKey = floor >= 5 ? "4_2" : "4_1"; if (stage === 6) bgKey = 6; if (GAME_DATA.bg[bgKey]) el("game-container").style.backgroundImage = `url('${GAME_DATA.bg[bgKey]}')`;
        
        let isBoss = false;
        // ... (ボス判定ロジックは既存維持) ...
        // 簡易版:
        let list = GAME_DATA.enemies[stage] || GAME_DATA.enemies[1];
        if(stage===5) list = GAME_DATA.enemies[5];
        if(stage===6) list = GAME_DATA.enemies[6];
        enemy.data = list[(floor - 1) % list.length];
        
        enemy.maxHp = enemy.data.hp || (100 + (stage-1)*50 + (floor-1)*30);
        if(floor===5 || (stage===4 && floor===6)) { isBoss = true; enemy.maxHp += 50; el("game-container").classList.add("boss-mode"); el("boss-label").style.display="inline"; playBGM("bgm-boss"); }
        else playBGM("bgm-battle");
        
        enemy.name = enemy.data.name; el("enemy-img").src = enemy.data.img; enemy.hp = enemy.maxHp; displayEnemyHP = enemy.hp;
        
        // ★ NEW: 召喚時トラップ発動チェック
        triggerTrap('summon');
        
        updateInfo();
        addLog(`=== STAGE ${stage} - ${floor}F START ===`, "system");
        isProcessing = false;
    } catch (e) { console.error("Spawn Error:", e); isProcessing = false; }
}
function checkOpeningSkill() { if (stage === 3 && floor === 1) { setTimeout(() => { showSkillCutin("護封剣の加護", "gold"); setTimeout(() => { enemy.state.guardType = 'cut'; enemy.state.guardTurn = 3; addLog(">> 先制行動: 敵が光の護封剣(3T)を展開！", "log-enemy"); updateInfo(); }, 1200); }, 500); } }
function handleEnter() { if (isProcessing) return; if (currentInput !== "") { const val = parseInt(currentInput); if (!isNaN(val)) { if (val < 0 || val > 60) { alert("単発の最大値は 60 (T20) です"); currentInput = ""; updateScoreDisplay(); return; } if (val === 50) playSE("se-bull"); else if (val >= 51) playSE("se-triple"); else playSE("se-hit"); processOneThrow(val); currentInput = ""; updateScoreDisplay(); } } }
function processOneThrow(score) {
    if (restrictInput && turnInputs.length > 0) return;
    let singleDmg = score; let weakHit = false;
    // ... (既存のダメージ計算ロジック: God, Power, Huge, ToonSkin, GuardType等) ...
    // ※ここは長いので既存コードを維持し、撃破判定部分のみ変更します
    if (stage === 6 && floor === 5) { if (singleDmg <= 15) { singleDmg = 0; addLog("召雷弾! (15以下無効)", "log-enemy"); } }
    if (player.state.atkBonus > 0) { singleDmg += player.state.atkBonus; player.state.atkBonus = 0; }
    if (player.state.power) { singleDmg = Math.floor(singleDmg * 2.0); player.state.power = false; }
    if (player.state.huge !== 0) { if (player.state.huge === 1) singleDmg = Math.floor(singleDmg * 3.0); else singleDmg = Math.floor(singleDmg * 0.5); player.state.huge = 0; }
    if (player.state.weakLock || (score >= 51 && enemy.data.weak && (score % enemy.data.weak === 0))) { weakHit = true; }
    if (stage === 4 && floor === 6 && currentTurn % 2 === 0) { if (singleDmg < 10) { singleDmg = 0; addLog("結界! (10未満無効)", "log-enemy"); } }
    if (stage === 4 && floor === 4 && currentTurn % 3 === 0) { singleDmg = Math.max(0, singleDmg - 15); }
    if (enemy.state.toonSkin) { singleDmg = Math.max(0, singleDmg - 15); }
    if (enemy.state.barrierLimit > 0 && singleDmg < enemy.state.barrierLimit) { singleDmg = 0; addLog(`結界! (${enemy.state.barrierLimit}未満無効)`, "log-enemy"); }
    if (enemy.state.guardType === 'cut') { singleDmg = Math.floor(singleDmg * 0.8); } if (enemy.state.guardType === 'half') { singleDmg = Math.floor(singleDmg * 0.5); } if (enemy.state.guard) { singleDmg = Math.floor(singleDmg / 2); enemy.state.guard = false; addLog("敵の防御で半減！", "system"); }

    if (enemy.hp - singleDmg === 0) isJustFinish = true;
    enemy.hp = Math.max(0, enemy.hp - singleDmg);
    totalScore += score; totalDarts++; turnInputs.push(score); updateScoreDisplay();
    if (weakHit) { dropGuaranteed = true; weakHitCount++; addLog(`WEAK HIT!!`, "log-weak"); if (!player.state.weakLock) { if (el("se-weak")) playSE("se-weak"); el("flash-overlay").className = "flash-purple"; setTimeout(() => el("flash-overlay").className = "", 600); } } if (player.state.weakLock) { player.state.weakLock = false; }
    triggerEffect(el("enemy-panel"), singleDmg, false); animateValue(el("enemy-hp-value"), displayEnemyHP, enemy.hp, 300); displayEnemyHP = enemy.hp; updateInfo();

    // ★ FIX: 敵撃破時にターンを加算する
    if (enemy.hp <= 0) {
        totalGameTurns++; // 現在のターンを消費したとみなす
        isProcessing = true;
        setTimeout(winBattle, 1000);
        return;
    }

    if (turnInputs.length >= 3 || (restrictInput && turnInputs.length >= 1)) { setTimeout(finishPlayerTurn, 1000); }
}
function finishPlayerTurn() { totalGameTurns++; if (restrictInput) { restrictInput = false; addLog("束縛が解けた", "log-system"); } if (enemy.state.guardType) { enemy.state.guardTurn--; if (enemy.state.guardTurn <= 0) { enemy.state.guardType = null; addLog("敵の護封剣が消滅", "log-system"); } } if (player.state.itemLock) { player.state.itemLock = false; addLog("粘着が取れた", "log-system"); } enemy.state.toonSkin = false; enemy.state.barrierLimit = 0; turnInputs = []; currentInput = ""; updateScoreDisplay(); setTimeout(enemyTurn, 500); }

function enemyTurn() {
    if (enemy.state.isStunned) { addLog(`${enemy.name}はスタン中`, "log-system"); enemy.state.isStunned = false; endEnemyTurn(); return; }
    if (player.state.hexSeal) { addLog("呪縛により攻撃力半減", "log-skill"); }
    if (stage === 6) { if (floor === 3) { if (Math.random() < 0.3) { enemy.hp = enemy.maxHp; showSkillCutin("再 生", "heal"); setTimeout(() => { addLog("HP全回復！", "log-heal"); animateValue(el("enemy-hp-value"), displayEnemyHP, enemy.hp, 500); displayEnemyHP = enemy.hp; updateInfo(); endEnemyTurn(); }, 1200); return; } } if (floor === 4) { if (!player.state.itemLock && Math.random() < 0.3) { showSkillCutin("スライムの粘着", "earth"); setTimeout(() => { player.state.itemLock = true; updateInfo(); addLog("粘着！アイテム封印", "log-enemy"); doEnemyAttack(1.0); }, 1200); return; } } if (floor === 5) { extraBossTurnCount++; if (extraBossTurnCount % 5 === 0) { showSkillCutin("サンダー・フォース", "fire"); setTimeout(() => { addLog("神の怒り！", "log-enemy"); doEnemyAttack(1.0, { isBossUlt: true, fixedDmg: 80 }); }, 1200); return; } if (Math.random() < 0.4) { enemy.state.atkBuff += 0.1; addLog(`神の攻撃力UP (x${(1.0 + enemy.state.atkBuff).toFixed(1)})`, "log-enemy"); } doEnemyAttack(1.2 * (1.0 + enemy.state.atkBuff)); return; } }
    if (stage === 4 && floor === 3 && Math.random() < 0.4) { showSkillCutin("呪いの視線", "earth"); setTimeout(() => { player.mp = Math.max(0, player.mp - 2); addLog("MP2減少", "log-enemy"); doEnemyAttack(1.0); }, 1200); return; } if (stage === 5) { extraBossTurnCount++; if (extraBossTurnCount % 5 === 0) { showSkillCutin("黒 炎 弾", "fire"); setTimeout(() => { player.mp = Math.max(0, player.mp - 5); addLog("MP5消滅 & 大ダメージ", "log-enemy"); doEnemyAttack(1.0, { isBossUlt: true, fixedDmg: 50 }); }, 1200); return; } doEnemyAttack(1.3); return; }
    if (stage === 3) { if (floor === 2 && Math.random() < 0.3) { showSkillCutin("誘惑の風", "wind"); setTimeout(() => { if (player.mp > 0) { player.mp = Math.max(0, player.mp - 1); enemy.hp = Math.min(enemy.hp + 20, enemy.maxHp); addLog("MP吸収", "log-enemy"); } doEnemyAttack(1.0); }, 1200); return; } if (floor === 5) { enemy.state.atkBuff += 0.1; addLog(`攻撃力UP (x${(1.0 + enemy.state.atkBuff).toFixed(1)})`, "log-enemy"); if (currentTurn % 4 === 0) { showSkillCutin("愛の鞭・ブレス", "fire"); setTimeout(() => { player.mp = 0; addLog("MP消滅＆大ダメージ", "log-enemy"); doEnemyAttack(2.0 * (1.0 + enemy.state.atkBuff)); }, 1200); return; } doEnemyAttack(1.0 * (1.0 + enemy.state.atkBuff)); return; } }
    if (stage === 1) { if (floor === 4 && player.mp > 0 && Math.random() < 0.3) { showSkillCutin("猛毒の鱗粉", "earth"); setTimeout(() => { player.mp = Math.max(0, player.mp - 1); addLog("猛毒！MP-1", "log-enemy"); doEnemyAttack(1.0); }, 1200); return; } }
    if (stage === 4 && floor === 1 && Math.random() < 0.3) { showSkillCutin("トゥーン・ラッシュ", "wind"); setTimeout(() => { addLog("2回攻撃！", "log-enemy"); doEnemyAttack(0.7, { callback: () => { setTimeout(() => doEnemyAttack(0.7), 800); } }); }, 1200); return; } if (stage === 4 && floor === 2 && currentTurn === 5) { showSkillCutin("死のびっくり箱", "fire"); setTimeout(() => { addLog("死の箱！999ダメ", "log-enemy"); doEnemyAttack(0, { fixedDmg: 999, ignoreShield: true }); }, 1200); return; }
    if (stage === 4 && floor === 4 && currentTurn % 3 === 0) { showSkillCutin("トゥーン・スキン", "earth"); setTimeout(() => { enemy.state.toonSkin = true; addLog("硬質化！被ダメ-15", "log-enemy"); updateInfo(); endEnemyTurn(); }, 1200); return; }
    if (stage === 4 && floor === 5 && currentTurn % 3 === 0) { showSkillCutin("幻想の儀式", "wind"); setTimeout(() => { addLog("儀式！HP吸収", "log-enemy"); doEnemyAttack(1.2, { isDrain: true }); }, 1200); return; }
    if (stage === 4 && floor === 6 && currentTurn % 2 === 0) { showSkillCutin("千眼の邪教神", "wind"); setTimeout(() => { enemy.state.barrierLimit = 10; addLog("結界！10未満無効", "log-enemy"); doEnemyAttack(1.2); }, 1200); return; }
    if (stage === 3) { if (floor === 1 && enemy.state.guardTurn > 0) { addLog(`光の護封剣 残${enemy.state.guardTurn}T`, "log-enemy"); doEnemyAttack(1.0); return; } if (floor === 3 && Math.random() < 0.3) { showSkillCutin("サイバー・ボンテージ", "wind"); setTimeout(() => { restrictInput = true; addLog("拘束！次1投制限", "log-enemy"); doEnemyAttack(1.0); }, 1200); return; } if (floor === 4 && Math.random() < 0.3) { showSkillCutin("トライアングル・エクスタシー", "wind"); setTimeout(() => { addLog("3回攻撃！", "log-enemy"); doEnemyAttack(0.6, { callback: () => { setTimeout(() => doEnemyAttack(0.6, { callback: () => { setTimeout(() => doEnemyAttack(0.6), 600); } }), 600); } }); }, 1200); return; } }
    if (stage === 2) { if (floor === 2 && Math.random() < 0.3) { showSkillCutin("俊足の連撃", "fire"); setTimeout(() => { addLog("2回攻撃！", "log-enemy"); doEnemyAttack(0.7, { callback: () => { setTimeout(() => doEnemyAttack(0.7), 800); } }); }, 1200); return; } if (floor === 3 && Math.random() < 0.3) { showSkillCutin("死肉の渇望", "fire"); setTimeout(() => { addLog("与ダメ吸収", "log-enemy"); doEnemyAttack(1.0, { isDrain: true }); }, 1200); return; } if (floor === 4 && enemy.hp <= enemy.maxHp * 0.5 && Math.random() < 0.5) { showSkillCutin("狂暴化", "fire"); setTimeout(() => { addLog("狂暴化！攻撃1.5倍", "log-enemy"); doEnemyAttack(1.5); }, 1200); return; } if (floor === 5 && Math.random() < 0.3) { showSkillCutin("恐竜剣・兜割り", "earth"); setTimeout(() => { addLog("兜割り！シールド無効", "log-enemy"); doEnemyAttack(1.8, { ignoreShield: true }); }, 1200); return; } }
    if (stage === 1) { if (floor === 3) { if (Math.random() < 0.2) { showSkillCutin("自己再生", "heal"); setTimeout(() => { enemy.hp = Math.min(enemy.hp + 20, enemy.maxHp); playSE("se-heal"); addLog("HP20回復", "log-heal"); animateValue(el("enemy-hp-value"), displayEnemyHP, enemy.hp, 500); displayEnemyHP = enemy.hp; updateInfo(); endEnemyTurn(); }, 1200); return; } if (Math.random() < 0.4) { showSkillCutin("鉄壁の守り", "earth"); setTimeout(() => { enemy.state.guard = true; addLog("鉄壁！ダメージ半減", "log-enemy"); updateInfo(); endEnemyTurn(); }, 1200); return; } } if (floor === 5) { if (enemy.state.charge) { enemy.state.charge = false; showSkillCutin("森の破壊衝動", "earth"); setTimeout(() => { doEnemyAttack(3.0); }, 1200); return; } if (Math.random() < 0.3) { enemy.state.charge = true; addLog(`力を溜めている…`, "log-enemy"); updateInfo(); endEnemyTurn(); return; } } }
    doEnemyAttack(1.0);
}
/* --- main.js Rewrite: doEnemyAttack --- */
/* --- main.js: doEnemyAttack (Update) --- */
function doEnemyAttack(mult, options = {}) {
    const { ignoreShield = false, isDrain = false, isBossUlt = false, fixedDmg = 0, callback = null } = options;
    
    // ベースダメージ計算
    let baseDmg = 0; 
    if (fixedDmg > 0) {
        baseDmg = Math.floor(fixedDmg * mult);
    } else {
        const base = 2 + floor + (stage - 1) * 3;
        baseDmg = Math.floor((base + Math.floor(Math.random() * 6)) * mult);
    }

    // ★ NEW: 被弾時トラップチェック ('attack')
    // 罠が発動すればダメージが軽減・無効化される
    let finalDmg = triggerTrap('attack', baseDmg);

    // ダメージが無効化された場合 (0) はここで中断して更新
    if (finalDmg === 0) { 
        updateInfo(); 
        if(options.callback) options.callback(); 
        else endEnemyTurn(); 
        return; 
    }

    // プレイヤーの防御スキル (Shield / Guard)
    if (!ignoreShield && player.state.shield) { 
        addLog(`完全防御！`, "log-skill"); 
        player.state.shield = false; 
        finalDmg = 0; // シールド発動時は0ダメージ
        triggerEffect(el("player-panel"), 0, true); 
        el("flash-overlay").className = "flash-blue"; 
        setTimeout(() => el("flash-overlay").className = "", 300); 
        updateInfo(); 
        if (callback) callback(); else endEnemyTurn(); 
        return; 
    }
    
    // 護封剣の軽減
    if (player.state.guardTurn > 0) { 
        finalDmg = Math.floor(finalDmg * 0.5); 
        addLog("護封剣！ダメージ半減", "log-skill"); 
    }
    
    // 演出とダメージ適用
    if (isBossUlt) { 
        playSE("se-boom"); 
        el("flash-overlay").className = "flash-fire"; 
        setTimeout(() => el("flash-overlay").className = "", 600); 
    } else {
        playSE("se-hit");
    }

    triggerEffect(el("player-panel"), finalDmg, true); 
    finishAttack(finalDmg, isDrain, callback);
}

/* --- main.js ADD: triggerTrap (新規関数) --- */
function triggerTrap(triggerType, dmg = 0) {
    // triggerType: 'attack' (被弾時), 'summon' (出現時)
    if (!player.setCard) return dmg;

    const trapId = player.setCard;
    const card = CARD_DB.find(c => c.id === trapId);
    let modifiedDmg = dmg;
    let triggered = false;

    // --- Attack Triggers (被弾時) ---
    if (triggerType === 'attack') {
        if (trapId === 303) { // 聖なるバリア
            addLog("【罠】聖なるバリア！完全無効＆反撃！", "log-skill");
            playSE("se-boom");
            triggerEffect(el("enemy-panel"), 50, false);
            enemy.hp = Math.max(0, enemy.hp - 50);
            modifiedDmg = 0; triggered = true;
        } 
        else if (trapId === 602) { // 魔法の筒
            addLog(`【罠】魔法の筒！${dmg}反射！`, "log-skill");
            playSE("se-boom");
            triggerEffect(el("enemy-panel"), dmg, false);
            enemy.hp = Math.max(0, enemy.hp - dmg);
            modifiedDmg = 0; triggered = true;
        }
        else if (trapId === 703) { // 六芒星の呪縛
            addLog("【罠】六芒星の呪縛！半減＆スタン！", "log-skill");
            playSE("se-buff");
            enemy.state.isStunned = true;
            modifiedDmg = Math.floor(dmg * 0.5); triggered = true;
        }
        // ★ NEW: はさみ撃ち (被弾時に反撃)
        else if (trapId === 403) { 
            addLog("【罠】はさみ撃ち！迎撃80ダメージ！", "log-skill");
            playSE("se-attack");
            triggerEffect(el("enemy-panel"), 80, false);
            enemy.hp = Math.max(0, enemy.hp - 80);
            // ダメージはそのまま受ける
            triggered = true;
        }
    }

    // --- Summon Triggers (出現時) ---
    if (triggerType === 'summon') {
        // ★ NEW: 落とし穴 (出現時)
        if (trapId === 302) { 
            addLog("【罠】落とし穴！出鼻を挫く50ダメ＆スタン！", "log-skill");
            playSE("se-hit");
            triggerEffect(el("enemy-panel"), 50, false);
            enemy.hp = Math.max(0, enemy.hp - 50);
            enemy.state.isStunned = true;
            triggered = true;
        }
    }

    if (triggered) {
        player.discard.push(player.setCard);
        player.setCard = null;
        el("flash-overlay").className="flash-gold"; setTimeout(()=>el("flash-overlay").className="",300);
        animateValue(el("enemy-hp-value"), displayEnemyHP, enemy.hp, 500); displayEnemyHP=enemy.hp;
        updateInfo(); // スロット更新
        if (enemy.hp <= 0) setTimeout(winBattle, 800);
    }

    return modifiedDmg;
}

function endEnemyTurn() {
    currentTurn++;
    player.mp = Math.min(player.mp + 3, player.maxMp);
    triggerFloatText("MP+3", el("player-mp-bar"));

    if (player.state.guardTurn > 0) {
        player.state.guardTurn--;
        if (player.state.guardTurn === 0) { addLog("護封剣 消滅", "log-system"); }
    }

    // ★ UPDATE: HexSeal を boolean解除ではなく、ターン経過でデクリメント
    if (player.state.hexSeal > 0) {
        player.state.hexSeal--;
        if (player.state.hexSeal === 0) addLog("呪縛が解けた", "log-system");
    } else {
        player.state.hexSeal = 0; // 安全策
    }

    drawCard(); updateInfo(); isProcessing = false;
}
function winBattle() { addLog(`${enemy.name} を倒した`, "system"); player.mp = Math.min(player.mp + 3, player.maxMp); triggerFloatText("MP+3", el("player-mp-bar")); drawCard(); if (isJustFinish) { player.maxHp += 10; const oldHP = player.hp; player.hp = Math.min(player.hp + 10, player.maxHp); playSE("se-heal"); addLog(`★JUST FINISH! MaxHP+10 & HP+10`, "heal"); animateValue(el("player-hp"), oldHP, player.hp, 500); updateInfo(); setTimeout(() => { showDialog("JUST FINISH BONUS!!", `見事！ピッタリで倒した！<br>最大HPが ${player.maxHp} にアップ！<br>HPも10回復した。`, "clear", [{ text: "OK", action: checkDrop }], 3000); }, 800); } else { setTimeout(checkDrop, 800); } }
function checkDrop() { if (stage === 5 && floor === 1) { nextStep(); return; } if (stage === 6 && floor === 5) { nextStep(); return; } if (stage === 4 && floor === 6) { nextStep(); return; } const isBoss = (floor === 5 || (stage === 4 && floor === 6)); let dropRate = isBoss ? 1.0 : 0.3; if (dropGuaranteed) dropRate = 1.0; if (Math.random() < dropRate) { waitingForChest = true; el("enemy-img").style.display = "none"; el("chest-img").style.display = "block"; el("chest-img").classList.add("chest-shine"); playSE("se-chest"); addLog("宝箱を見つけた！", "log-item"); setTimeout(() => { if (waitingForChest) openChest(); }, 1500); } else { nextStep(); } }
function openChest() { if (!waitingForChest) return; waitingForChest = false; playSE("se-item"); let seedRate = 0.15; if (weakHitCount >= 3) seedRate = 1.0; else if (weakHitCount >= 2) seedRate = 0.50; const rand = Math.random(); let itemName = ""; let itemEffect = ""; if (rand < seedRate) { itemName = "★命の種"; itemEffect = "MaxHP +10"; player.items.seed++; } else if (Math.random() < 0.6) { itemName = "薬草"; itemEffect = "HP 50 回復"; player.items.potion++; } else { itemName = "魔法の聖水"; itemEffect = "MP 3 回復"; player.items.ether++; } updateInfo(); addLog(`宝箱: ${itemName} (${itemEffect}) を手に入れた`, "log-item"); showDialog("TREASURE!", `<span style="font-size:24px;color:#00ff00;">${itemName}</span> を手に入れた！<br>${itemEffect}<br>(アイテムボタンで使用可能)`, "item", [{ text: "OK", action: nextStep }], 2000); }
function nextStep() {
    floor++; const ppr = totalDarts > 0 ? ((totalScore / totalDarts) * 3).toFixed(1) : 0;
    const isStage5Clear = (stage === 5 && floor > 1);
    const isStage6Clear = (stage === 6 && floor > 5);
    const isStage4Clear = (stage === 4 && floor > 6);
    const isNormalClear = (stage <= 3 && floor > 5);

    if (isNormalClear || isStage4Clear || isStage6Clear || isStage5Clear) {
        // ★ FIX: 撃破時に加算済みなので、ここでは単純な差分でOK
        const stageTurns = totalGameTurns - stageStartTurn;
        const [rank, dpBonus] = calculateStageRank(stage, stageTurns);
        // ... (以下変更なし) ...
        const multipliers = { 1: 1.0, 2: 1.5, 3: 2.0, 4: 3.0, 5: 5.0, 6: 5.0 }; const mult = multipliers[stage] || 1.0;
        const scoreDP = Math.floor(totalScore * 0.2 * mult); let pendingBonusDP = dpBonus; clearedStagesLog.forEach(log => { pendingBonusDP += log.dp; }); let potentialTotalDP = scoreDP + pendingBonusDP;
        clearedStagesLog.push({ stage: stage, rank: rank, dp: dpBonus });
        // ... (ダイアログ表示処理) ...
        const currentBest = savedData.bestRanks[stage]; const ranksOrder = ["SSS", "S", "A", "B", "C"]; if (!currentBest || ranksOrder.indexOf(rank) < ranksOrder.indexOf(currentBest)) { savedData.bestRanks[stage] = rank; }
        playBGM("bgm-win");
        if (stage === 5) { const res = finishSession("EXTRA-WIN", parseFloat(ppr), mult); showDialog("★ TRUE ENDING ★", `<span style="font-size:30px;color:#f0f;">THE LEGEND!!</span><br>最強の黒竜を倒した！<br><br>RANK: <span style="font-size:24px;color:${getRankColor(rank)};">${rank}</span><br>PPR: ${ppr}<br><br><span style="color:#ffd700; font-size:24px; font-weight:bold;">GET DP: +${res.gainedDP}</span>`, "clear", [{ text: "TITLE", action: returnToTitle }]); return; }
        if (stage === 6) { const res = finishSession("GOD-WIN", parseFloat(ppr), mult); showDialog("GOD DEFEATED!", `<span style="font-size:30px;color:#ffd700;">DIVINE VICTORY!</span><br>神の試練を乗り越えた！<br><br>RANK: <span style="font-size:24px;color:${getRankColor(rank)};">${rank}</span><br><br><span style="color:#ffd700; font-size:24px; font-weight:bold;">GET DP: +${res.gainedDP}</span>`, "clear", [{ text: "TITLE", action: returnToTitle }]); return; }
        let title = "STAGE CLEAR"; let msg = `STAGE ${stage} COMPLETED!<br>RANK: <span style="font-size:24px;color:${getRankColor(rank)};">${rank}</span><br><br>現在の獲得予定DP: <span style="color:#ffd700; font-weight:bold;">${potentialTotalDP} DP</span><br>(スコア倍率 x${mult.toFixed(1)})`;
        if (stage === 4) { title = "STAGE 4 CLEAR!"; msg = `<span style="font-size:28px;color:#e0b0ff;">NIGHTMARE CONQUERED!</span><br>` + msg; }
        const btnNext = { text: "⛺ 次へ進む (繰越)", action: () => { player.hp = Math.min(player.hp + 30, player.maxHp); if (stage === 4) initGameSession(6, true); else initGameSession(stage + 1, true); } };
        const btnReturn = { text: "🏠 帰還する (確定)", action: () => { const res = finishSession("RETURN", parseFloat(ppr), mult); showDialog("MISSION COMPLETE", `帰還しました。<br><br><span style="color:#ffd700; font-size:24px; font-weight:bold;">GET DP: +${res.gainedDP}</span>`, "clear", [{ text: "TITLE", action: returnToTitle }]); } };
        if (stage === 3) { const btnExtra = { text: "⚠️ EXTRA STAGE", action: () => { player.hp = Math.min(player.hp + 30, player.maxHp); initGameSession(5, true); } }; if (parseFloat(ppr) >= 70.0 || savedData.clearedExtra) { msg += "<br><br><span style='color:#ff0000;'>強力な反応を感知...挑戦しますか？</span>"; showDialog(title, msg, "clear", [btnExtra, btnReturn]); } else { msg += "<br><br>全てのエリアを踏破した！"; showDialog(title, msg, "clear", [{ text: "🏠 ALL CLEAR", action: () => { const res = finishSession("WIN", parseFloat(ppr), mult); showDialog("ALL CLEAR!", `おめでとうございます！<br><br><span style="color:#ffd700; font-size:24px; font-weight:bold;">GET DP: +${res.gainedDP}</span>`, "clear", [{ text: "TITLE", action: returnToTitle }]); } }]); } }
        else { showDialog(title, msg, "clear", [btnNext, btnReturn]); }
    } else {
        spawnEnemy();
    }
}
function loseBattle() { playBGM("bgm-lose"); showDialog("GAME OVER", "力が尽きてしまった...<br>※獲得予定だったDPは失われます", "warning", [{ text: "TITLE", action: returnToTitle }]); }
function returnToTitle() { playBGM("bgm-title"); el("game-container").classList.remove("boss-mode", "extra-mode"); el("game-screen").style.display = "none"; el("title-screen").style.display = "flex"; updateTitleScore(); }
function useItem(type) {
    if (isProcessing || waitingForChest) return;
    if (turnInputs.length > 0) { addLog(">> 投擲中はアイテムを使えません！", "log-system"); return; }
    if (player.state.itemLock) { playSE("se-warning"); addLog(">> 粘着されていてアイテムが使えない！", "log-system"); return; }
    if (type === 'potion' && player.items.potion > 0) { player.items.potion--; playSE("se-heal"); const old = player.hp; player.hp = Math.min(player.hp + 50, player.maxHp); addLog(`アイテム: 薬草使用`, "log-item"); animateValue(el("player-hp"), old, player.hp, 500); updateInfo(); }
    else if (type === 'ether' && player.items.ether > 0) { player.items.ether--; playSE("se-heal"); player.mp = Math.min(player.mp + 3, player.maxMp); addLog(`アイテム: 聖水使用 (MP+3)`, "log-item"); updateInfo(); }
    else if (type === 'seed' && player.items.seed > 0) { player.items.seed--; playSE("se-buff"); player.maxHp += 10; const old = player.hp; player.hp = Math.min(player.hp + 10, player.maxHp); addLog(`アイテム: 命の種使用`, "log-item"); animateValue(el("player-hp"), old, player.hp, 500); updateInfo(); }
}
function showSkillCutin(name, type) { playSE("se-warning"); el("cutin-text-val").innerText = name; const cutin = el("skill-cutin"); cutin.className = ""; if (type === "fire") cutin.classList.add("cutin-fire"); if (type === "ice") cutin.classList.add("cutin-ice"); if (type === "earth") cutin.classList.add("cutin-earth"); if (type === "wind") cutin.classList.add("cutin-wind"); if (type === "gold") cutin.classList.add("cutin-earth"); if (type === "heal") cutin.classList.add("cutin-earth"); cutin.style.display = "flex"; el("game-container").classList.add("shake-heavy"); setTimeout(() => { cutin.style.display = "none"; el("game-container").classList.remove("shake-heavy"); }, 1500); }
function drawCard(isSilent = false) { if (player.deck.length === 0) return; if (player.hand.length >= HAND_SIZE) return; const cardId = player.deck.pop(); player.hand.push(cardId); if (!isSilent) triggerFloatText("DRAW!", el("hand-area")); updateInfo(); }
/* --- main.js Rewrite: playHandCard --- */
function playHandCard(index) {
    if(isProcessing || waitingForChest) return; 
    if (turnInputs.length > 0) { addLog(">> 投擲中はカードを使えません！", "log-system"); return; } 
    if (player.state.itemLock) { addLog(">> 封印されていて使えない！", "log-system"); playSE("se-warning"); return; }
    
    const cardId = player.hand[index]; 
    const card = CARD_DB.find(c => c.id === cardId); 
    let cost = (card.cost !== undefined) ? card.cost : 99; 
    
    if (player.mp < cost) { addLog(`MPが足りません！(必要: ${cost})`, "log-system"); playSE("se-warning"); return; }
    hideTooltip();

    // 501(天使の施し)の特殊チェック
    if (card.id === 501 && player.hand.length < 2) { addLog("捨てる手札がありません！", "log-system"); playSE("se-warning"); return; }

    // ★ NEW: 罠カードのセット処理
    if (card.type === "TRAP") {
        if (player.setCard) {
            addLog("罠は1枚しかセットできません！", "log-system");
            playSE("se-warning");
            return;
        }
        // コスト支払い & セット
        player.mp -= cost;
        player.hand.splice(index, 1); // 手札から削除
        player.setCard = cardId;      // セット枠へ移動
        
        playSE("se-buff"); // セット音
        addLog(`「${card.name}」をセットした！`, "log-skill");
        updateInfo();
        return; // ここで終了（効果は発動しない）
    }

    // --- 通常の魔法カード処理 ---
    player.mp -= cost; 
    playSE("se-buff"); 
    
    player.hand.splice(index, 1);
    player.discard.push(cardId);
    
    applyCardEffect(card);
    updateInfo();
}
/* --- main.js (Part 3: Apply Card Effect v2.9.0) --- */

function applyCardEffect(card) {
    let rawMsg = "";
    switch (card.id) {
        // ... (101-405 は変更なし) ...
        case 101: player.hp = player.maxHp; rawMsg = "HP完全回復！"; playSE("se-heal"); break;
        case 201: const dmg201 = 100; enemy.hp = Math.max(0, enemy.hp - dmg201); enemy.state.isStunned = true; rawMsg = "100ダメージ＆スタン！"; playSE("se-boom"); triggerEffect(el("enemy-panel"), dmg201, false); break;
        case 202: drawCard(); drawCard(); rawMsg = "カードを2枚ドロー！"; playSE("se-heal"); break;
        case 301: player.state.guardTurn = 3; rawMsg = "3ターン防御(被ダメ半減)！"; break;
        case 302: if (enemy.state.charge) { enemy.state.charge = false; enemy.state.isStunned = true; rawMsg = "チャージ解除＆スタン！"; playSE("se-hit"); } else { rawMsg = "不発(敵はチャージしていない)"; } break;
        case 303: player.state.barrier = true; rawMsg = "バリア展開(次攻撃無効＆反撃)！"; break;
        case 401: const dmg401 = 30; enemy.hp = Math.max(0, enemy.hp - dmg401); rawMsg = "30ダメージ！"; playSE("se-attack"); triggerEffect(el("enemy-panel"), dmg401, false); break;
        case 402: player.hp = Math.min(player.hp + 50, player.maxHp); rawMsg = "HP50回復"; playSE("se-heal"); break;
        case 403: player.hp = Math.max(1, player.hp - 20); const dmg403 = 80; enemy.hp = Math.max(0, enemy.hp - dmg403); rawMsg = "自傷20＆敵に80ダメージ！"; playSE("se-attack"); triggerEffect(el("player-panel"), 20, true); triggerEffect(el("enemy-panel"), dmg403, false); break;
        case 404: const dmg404 = 80; enemy.hp = Math.max(0, enemy.hp - dmg404); rawMsg = "80ダメージ！"; playSE("se-attack"); triggerEffect(el("enemy-panel"), dmg404, false); break;
        case 405: player.state.power = true; rawMsg = "攻撃力2倍(このターン)！"; break;

        // ★ UPDATE: 天使の施し (501)
        case 501:
            // 既にカード本体は墓地にあるので、残りの手札から選ばせる
            openDiscardSelector();
            // アナウンス用のテキストはセットするが、実際のドローはコールバックで行う
            rawMsg = "捨てるカードを選んでください...";
            break;

        case 601: const dmg601 = 150; enemy.hp = Math.max(0, enemy.hp - dmg601); while (player.hand.length > 0) player.discard.push(player.hand.pop()); rawMsg = "全手札を犠牲に150ダメージ！"; playSE("se-boom"); triggerEffect(el("enemy-panel"), dmg601, false); break;
        case 602: player.state.magicCylinder = true; rawMsg = "魔法の筒をセット(反射待機)！"; break;
        case 701: if (player.hp <= (player.maxHp * 0.5)) player.state.huge = 1; else player.state.huge = 2; rawMsg = (player.state.huge === 1) ? "HP劣勢…逆転の3倍パワー！" : "HP優勢…油断の0.5倍パワー…"; break;
        case 702: const dmg702 = 40; enemy.hp = Math.max(0, enemy.hp - dmg702); if (enemy.state.guard) { enemy.state.guard = false; rawMsg = "40ダメ＆敵の防御を破壊！"; } else rawMsg = "40ダメージ！"; triggerEffect(el("enemy-panel"), dmg702, false); break;
        case 703: player.state.hexSealTrap = true; rawMsg = "【罠】六芒星をセット！(次被弾時半減＆スタン)"; break;
        case 801: if (enemy.state.guard) { enemy.state.guard = false; rawMsg = "敵の防御を解除した！"; } else rawMsg = "敵は防御していなかった"; break;
        case 802: const dmg802 = 60; enemy.hp = Math.max(0, enemy.hp - dmg802); rawMsg = "60ダメージ！"; triggerEffect(el("enemy-panel"), dmg802, false); break;
        case 803: player.hp = Math.min(player.hp + 30, player.maxHp); player.state.atkBonus = 20; rawMsg = "HP30回復＆次撃+20！"; playSE("se-heal"); break;
        case 804: if (player.discard.length === 0) { rawMsg = "墓地にカードがない…"; break; } const magics = player.discard.filter(did => { const c = CARD_DB.find(cd => cd.id === did); return c.type === "MAGIC"; }); if (magics.length === 0) { rawMsg = "墓地に魔法がない…"; break; } const salvId = magics[Math.floor(Math.random() * magics.length)]; const dIndex = player.discard.indexOf(salvId); player.discard.splice(dIndex, 1); player.hand.push(salvId); rawMsg = `墓地から「${CARD_DB.find(c => c.id === salvId).name}」を回収！`; break;
        case 805: player.hp = Math.max(1, player.hp - 50); const dmg805 = 150; enemy.hp = Math.max(0, enemy.hp - dmg805); rawMsg = "自傷50＆敵に150ダメージ！"; triggerEffect(el("player-panel"), 50, true); triggerEffect(el("enemy-panel"), dmg805, false); break;
        default: rawMsg = "(発動)"; break;
    }
    console.log(`[Skill] ${card.name}: ${rawMsg}`);
    const announcerHTML = `<div style="font-size: 80%; opacity: 0.9; margin-bottom: 5px;">${card.name}</div><div>${rawMsg}</div>`;
    announce(announcerHTML, "log-skill");
    animateValue(el("enemy-hp-value"), displayEnemyHP, enemy.hp, 500); displayEnemyHP = enemy.hp;
    animateValue(el("player-hp"), displayPlayerHP, player.hp, 500); displayPlayerHP = player.hp;
    if (enemy.hp <= 0) {
        isProcessing = true; // <--- これを追加！！！
        setTimeout(winBattle, 800);
    }
}
// 501用: 捨てるカード選択モーダル (引数不要に)
function openDiscardSelector() {
    // pendingCardIndex は不要になったが、互換性のためリセット
    pendingCardIndex = -1;

    // 現在の手札（既に501は除去済み）を表示
    const discardCandidates = [];
    player.hand.forEach((cid, idx) => {
        const c = CARD_DB.find(cd => cd.id === cid);
        discardCandidates.push({ id: cid, name: c.name, desc: c.desc, originalIndex: idx });
    });

    const modal = el("card-selector-modal");
    const grid = el("cs-grid");
    grid.innerHTML = "";

    discardCandidates.forEach(item => {
        const div = document.createElement("div");
        div.className = "collection-card";
        div.innerHTML = `<div class="card-art"><img src="assets/cards/${item.id}.png"></div><div class="card-info"><div class="card-name" style="font-size:9px;">${item.name}</div><div class="card-info-direct">${item.desc}</div></div>`;
        // 実際のindexを渡して実行
        div.onclick = () => executeDiscardAndEffect(item.originalIndex);
        grid.appendChild(div);
    });

    el("cs-message").innerText = "墓地に送るカードを1枚選んでください";
    modal.style.display = "flex";
}
function closeCardSelector() { el("card-selector-modal").style.display = "none"; pendingCardIndex = -1; }
// 501用: 実行処理 (3枚ドロー)
function executeDiscardAndEffect(discardIndex) {
    // 選択されたカードを捨てる
    const discardId = player.hand[discardIndex];
    player.hand.splice(discardIndex, 1);
    player.discard.push(discardId);

    playSE("se-heal");
    addLog("手札を捨て、3枚ドロー！", "log-skill");

    // ★ UPDATE: 3枚引く
    drawCard(); drawCard(); drawCard();

    closeCardSelector();
    updateInfo();
}
function showCardDetail(card) { const detailEl = el("deck-card-detail"); if (!detailEl) return; detailEl.innerHTML = `<span class="detail-name">${card.name}</span>${card.desc}`; }
function updateVisuals() {
    if (el("player-buff-badge")) { el("player-buff-badge").style.display = player.state.power ? "block" : "none"; el("player-buff-badge").innerText = "ATK x2.0"; }
    if (el("player-lock-badge")) { el("player-lock-badge").style.display = player.state.itemLock ? "block" : "none"; }
    if (el("player-guard-badge")) { if (player.state.shield) { el("player-guard-badge").style.display = "block"; el("player-guard-badge").innerText = "SHIELD"; } else if (player.state.guardTurn > 0) { el("player-guard-badge").style.display = "block"; el("player-guard-badge").innerText = "GUARD " + player.state.guardTurn; } else { el("player-guard-badge").style.display = "none"; } }
    if (el("enemy-buff-badge")) el("enemy-buff-badge").style.display = enemy.state.charge ? "block" : "none";

    // ★削除: 敵の右上のガードバッジ処理を削除 (チップで表示するため不要)
    // if(el("enemy-guard-badge")) el("enemy-guard-badge").style.display = ...; 
    if (el("enemy-guard-badge")) el("enemy-guard-badge").style.display = "none"; // 強制非表示

    const dropBadge = el("enemy-drop-badge"); const enemyPanel = el("enemy-panel");
    if (player.state.weakLock || dropGuaranteed) { if (dropBadge) dropBadge.style.display = "block"; if (enemyPanel) enemyPanel.classList.add("drop-chance"); } else { if (dropBadge) dropBadge.style.display = "none"; if (enemyPanel) enemyPanel.classList.remove("drop-chance"); }
}
// ステートチップの更新（プレイヤー情報を敵エリアから削除）
function updateStateChips() {
    const area = el("active-states"); if (!area) return;
    area.innerHTML = "";

    // --- ENEMY STATES ---
    if (enemy.state.toonSkin) area.innerHTML += `<div class='state-chip chip-guard'><span class='chip-icon'>🛡️</span>-15 SKIN</div>`;
    if (enemy.state.barrierLimit > 0) area.innerHTML += `<div class='state-chip chip-guard'><span class='chip-icon'>🚫</span><${enemy.state.barrierLimit} NULL</div>`;
    if (stage === 6 && floor === 5) area.innerHTML += `<div class='state-chip chip-bad'><span class='chip-icon'>⚡</span><15 NULL</div>`;

    // 敵の防御スキル
    if (enemy.state.guard) {
        area.innerHTML += `<div class='state-chip chip-guard' style='border-color:#ffff00; color:#ffffcc;'><span class='chip-icon'>🛡️</span>DEFENSE</div>`;
    }
    if (enemy.state.guardType) {
        const label = enemy.state.guardType === 'half' ? 'HALF' : 'GUARD';
        area.innerHTML += `<div class='state-chip chip-guard' style='border-color:#ffff00; color:#ffffcc;'><span class='chip-icon'>⚔️</span>${label} ${enemy.state.guardTurn}</div>`;
    }

    // ★ NEW: 六芒星の呪縛 (敵へのデバフとして表示)
    if (player.state.hexSeal > 0) {
        area.innerHTML += `<div class='state-chip chip-bad' style='border-color:#d0f; color:#e0f;'><span class='chip-icon'>✡️</span>CURSE ${player.state.hexSeal}</div>`;
    }
}
// ★ v2.6.6 Fixed: renderHand Definition Added
function renderHand() {
    const handArea = el("hand-area"); handArea.innerHTML = ""; el("hand-count-display").innerText = player.hand.length; const isThrowing = turnInputs.length > 0; const isCardLocked = player.state.itemLock || isThrowing; if (player.deckLocked) { el("battle-deck-count").innerText = "-"; handArea.innerHTML = `<div class="hand-locked-msg">⚠️ NO DECK (DARTS ONLY)</div>`; } else { el("battle-deck-count").innerText = player.deck.length; if (player.hand.length === 0) { handArea.innerHTML = `<div class="hand-card-empty">NO CARD</div>`; } else { player.hand.forEach((cardId, index) => { const card = CARD_DB.find(c => c.id === cardId); const cost = (card.cost !== undefined) ? card.cost : 99; const div = document.createElement("div"); div.className = "hand-card"; if (player.mp < cost || isCardLocked) div.classList.add("disabled"); const imgPath = `assets/cards/${card.id}.png`; div.innerHTML = `<div class="hand-cost">${cost}</div><div class="card-art" style="height:100%; border:none;"><img src="${imgPath}" onerror="this.style.display='none'"></div>`; div.onclick = () => playHandCard(index); div.onmouseenter = (e) => showTooltip(card.name, card.desc, e); div.onmouseleave = () => hideTooltip(); handArea.appendChild(div); }); } }
}
/* --- main.js: updateInfo (Update) --- */
function updateInfo() {
    if (!enemy.data) return;
    
    // Helper
    const setText = (id, text) => { const e = el(id); if(e) e.innerText = text; };
    const setHTML = (id, html) => { const e = el(id); if(e) e.innerHTML = html; };
    
    // Header Info
    let stgDisp = `STAGE ${stage}`;
    if(stage===5) stgDisp = "EXTRA";
    if(stage===6) stgDisp = "STAGE 5";
    setText("stage-display", stgDisp);
    setText("floor-display", stage===5?"FINAL":`${floor}F`);
    const currentTotal = (totalGameTurns - stageStartTurn) + 1;
    setHTML("turn-display", `TURN ${currentTurn} <span style="font-size:12px; color:#888;">(Total ${currentTotal})</span>`);
    
    // Enemy Info
    setText("enemy-name-side", enemy.name);
    // メインHP表示 (Mega Text)
    setText("enemy-hp-value", enemy.hp);
    if(el("enemy-hp-value")) {
        el("enemy-hp-value").className = "hp-mega-text"; 
        if (enemy.hp <= 60) el("enemy-hp-value").classList.add("hp-danger");
    }
    
    // Weak Info (Chance only)
    let weakText = player.state.weakLock ? "★LOCK" : `WEAK: ${enemy.data.weak}+`;
    if(weakHitCount > 0) weakText += " <span style='color:#f0f;'>CHANCE!</span>";
    setHTML("weak-display", weakText);
    
    if(el("enemy-hp-bar")) el("enemy-hp-bar").style.width = Math.max(0, (enemy.hp / enemy.maxHp) * 100) + "%";

    // Enemy States (Chips)
    let eChips = "";
    if(enemy.state.guard) eChips += `<span class="status-chip chip-guard">🛡️GUARD</span>`;
    if(enemy.state.charge) eChips += `<span class="status-chip chip-charge">⚡CHARGE</span>`;
    if(enemy.state.isStunned) eChips += `<span class="status-chip chip-stun">😵STUN</span>`;
    if(enemy.state.barrierLimit > 0) eChips += `<span class="status-chip chip-barrier">💠BARRIER(${enemy.state.barrierLimit})</span>`;
    if(enemy.state.toonSkin) eChips += `<span class="status-chip chip-guard">🛡️SKIN</span>`;
    setHTML("enemy-states-side", eChips);

    // Player Info
    setText("player-hp", player.hp);
    if(el("player-hp-bar")) {
        const pHpPct = (player.hp / player.maxHp) * 100;
        el("player-hp-bar").style.width = Math.max(0, pHpPct) + "%";
        el("player-hp-bar").className = "hp-bar-fill player-fill";
        if(pHpPct <= 20) el("player-hp-bar").classList.add("player-danger");
    }

    // MP Dots Logic
    setText("player-mp", player.mp);
    let mpDots = "";
    for(let i=0; i<player.maxMp; i++) {
        mpDots += `<span class="mp-dot ${i < player.mp ? 'active' : ''}"></span>`;
    }
    setHTML("player-mp-dots", mpDots);
    if(el("player-mp-bar")) el("player-mp-bar").style.width = Math.max(0, (player.mp / player.maxMp) * 100) + "%";

    // Player States (Chips)
    let pChips = "";
    if(player.state.atkBonus > 0 || player.state.power) pChips += `<span class="status-chip chip-buff">⚔️ATK UP</span>`;
    if(player.state.guardTurn > 0) pChips += `<span class="status-chip chip-guard">🛡️SHIELD(${player.state.guardTurn})</span>`;
    if(player.state.barrier) pChips += `<span class="status-chip chip-barrier">✨BARRIER</span>`;
    if(player.state.itemLock) pChips += `<span class="status-chip chip-lock">🔒SEALED</span>`;
    setHTML("player-states-side", pChips);

    // Avg & Items
    let ppr = totalDarts > 0 ? (totalScore / totalDarts) * 3 : 0;
    setText("avg-display", ppr.toFixed(1));
    setText("rt-display", `(Rt ${calculateRating(ppr)})`);

    const updateItemBtn = (btnId, count, icon) => { 
        const b = el(btnId); 
        if (!b) return; 
        b.innerHTML = `${icon}x${count}`;
        b.className = "item-btn"; 
        if (player.state.itemLock || turnInputs.length > 0) b.classList.add("disabled");
        else if (count > 0) b.classList.add("has-item"); 
        else b.classList.add("disabled"); 
    };
    updateItemBtn("btn-potion", player.items.potion, "💊"); 
    updateItemBtn("btn-ether", player.items.ether, "⚗️"); 
    updateItemBtn("btn-seed", player.items.seed, "🌱");

    // ★ NEW: Trap Slot Update
    const trapSlot = el("trap-slot");
    if(trapSlot) {
        if(player.setCard) {
            trapSlot.className = "trap-slot set";
            trapSlot.innerHTML = ""; // 裏面デザインのため中身は空
            // ツールチップ設定 (セット中のカード情報を表示)
            const c = CARD_DB.find(cd => cd.id === player.setCard);
            if(c) {
                trapSlot.onmouseenter = (e) => showTooltip(c.name + " (セット中)", c.desc, e);
                trapSlot.onmouseleave = () => hideTooltip();
            }
        } else {
            trapSlot.className = "trap-slot empty";
            trapSlot.innerHTML = "SET<br>TRAP";
            trapSlot.onmouseenter = null;
            trapSlot.onmouseleave = null;
        }
    }

    renderHand(); 
}
function openCardShop() { playSE("se-tap"); const list = el("pack-list"); list.innerHTML = ""; el("shop-dp-display").innerText = savedData.dp; if (!savedData.cards) savedData.cards = {}; PACK_DATA.forEach(pack => { const isUnlocked = (savedData.bestRanks && savedData.bestRanks[pack.unlockStage]); if (!isUnlocked) return; const canBuy = savedData.dp >= pack.price; const imgHTML = `<img src="${pack.img}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"><div style="display:none; width:100%; height:100%; align-items:center; justify-content:center; font-size:50px; background:#333; color:#555;">📦</div>`; const div = document.createElement("div"); div.className = "pack-item"; div.innerHTML = `<div class="pack-img-container">${imgHTML}</div><div class="pack-name">${pack.name}</div><div class="pack-desc">${pack.desc}</div><button class="pack-buy-btn" ${canBuy ? "" : "disabled"} onclick="buyPack('${pack.id}')">${canBuy ? `BUY (${pack.price} DP)` : "LACK DP"}</button>`; list.appendChild(div); }); if (list.innerHTML === "") list.innerHTML = "<div style='color:#666; width:100%; text-align:center;'>STAGE 1 CLEAR REQUIRED</div>"; el("card-shop-modal").style.display = "flex"; }
/* =========================================
   ★ NEW: Legendary Unboxing Logic (Start)
   ========================================= */

let isOpeningPack = false;
let currentPackId = "";

// ユーティリティ: 指定ミリ秒待機
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/* --- main.js (Part 1: Pack Content Logic Fix) --- */

// カード抽選ロジック (パックID対応版)
function drawShopCard(packId) {
    // 1. レアリティ抽選 (重み付け)
    const rand = Math.random() * 100;
    let targetRarity = "N";
    if (rand < 3) targetRarity = "UR";
    else if (rand < 15) targetRarity = "SR";
    else if (rand < 45) targetRarity = "R";

    // 2. パックごとの収録カード定義
    // Vol.1: ID 100~499 / Vol.2: ID 500~899
    let minId = 0, maxId = 999;
    if (packId === "vol1") { minId = 100; maxId = 499; }
    else if (packId === "vol2") { minId = 500; maxId = 899; }

    // 3. 候補リスト作成 (レアリティ かつ ID範囲内)
    let candidates = CARD_DB.filter(c =>
        c.rarity === targetRarity && c.id >= minId && c.id <= maxId
    );

    // 該当なしの場合（例: Vol.1にURがない場合など）のフォールバック
    if (candidates.length === 0) {
        // 同パック内のNカードに落とす
        candidates = CARD_DB.filter(c => c.rarity === "N" && c.id >= minId && c.id <= maxId);
    }
    // それでもなければ全カードのN（安全装置）
    if (candidates.length === 0) {
        candidates = CARD_DB.filter(c => c.rarity === "N");
    }

    // ランダムに1枚決定
    return candidates[Math.floor(Math.random() * candidates.length)];
}

// パック購入プロセス (Async Control)
// パック購入プロセス (OKボタン非表示処理を追加)
async function buyPack(packId) {
    if (isOpeningPack) return;

    const pack = PACK_DATA.find(p => p.id === packId);
    if (!pack || savedData.dp < pack.price) {
        playSE("se-warning");
        return;
    }

    // 購入処理
    savedData.dp -= pack.price;
    el("shop-dp-display").innerText = savedData.dp;
    saveToDrive();

    // ステート設定
    isOpeningPack = true;
    currentPackId = packId;

    // モーダル初期化
    const modal = el("pack-result-modal");
    const container = el("pack-results");
    modal.style.display = "flex";
    container.innerHTML = "";

    // ★ FIX: 静的な「OK」ボタンを探して非表示にする
    // (modal-boxの直下にある button タグを対象とする)
    const staticBtn = modal.querySelector(".modal-box > button.modal-btn");
    if (staticBtn) staticBtn.style.display = "none";

    // 古い動的ボタンがあれば削除
    const oldBtn = document.querySelector(".action-buttons");
    if (oldBtn) oldBtn.remove();

    // --- Phase 1: The Arrival ---
    container.innerHTML = `
        <div id="opening-stage">
            <div class="god-rays" id="god-rays"></div>
            <img src="${pack.img}" class="opening-pack anim-drop" id="opening-pack">
            <div class="prompt-text" id="opening-prompt" style="opacity:0">PRESS ENTER to OPEN</div>
        </div>
        <div class="white-out-overlay" id="white-out"></div>
    `;

    playSE("se-chest");
    await wait(1000);

    const packImg = el("opening-pack");
    if (packImg) {
        packImg.classList.remove("anim-drop");
        packImg.classList.add("anim-breath");
        packImg.onclick = () => proceedToOpen();
    }
    const prompt = el("opening-prompt");
    if (prompt) prompt.style.opacity = 1;
}

/* --- main.js (Part 2: Unboxing Logic Update) --- */

// 開封実行 (SE変更 & レイアウト修正版)
async function proceedToOpen() {
    const packImg = el("opening-pack");
    const prompt = el("opening-prompt");
    const rays = el("god-rays");
    const whiteOut = el("white-out");

    if (!packImg || packImg.classList.contains("anim-charge")) return;

    // --- Phase 2: The Charge (蓄積) ---
    if (prompt) prompt.style.display = "none";
    packImg.classList.remove("anim-breath");
    packImg.classList.add("anim-charge");
    if (rays) rays.classList.add("rays-active");

    // ★ SE変更: 警告音 -> 能力アップ音 (エネルギー充填感)
    playSE("se-buff");

    await wait(1500);

    // --- Phase 3: The Reveal (解放) ---
    // ★ SE変更: 爆発音 -> 回復音 (浄化・解放感)
    playSE("se-heal");

    if (whiteOut) whiteOut.classList.add("white-out-anim");

    // カード抽選 & ソート
    const results = [];
    const rarityScore = { "N": 1, "R": 2, "SR": 3, "UR": 4 };
    for (let i = 0; i < 3; i++) {
        const card = drawShopCard(currentPackId);
        const isNew = !savedData.cards[card.id];
        if (!savedData.cards[card.id]) savedData.cards[card.id] = 0;
        savedData.cards[card.id]++;
        results.push({ card, isNew, score: rarityScore[card.rarity] });
    }
    results.sort((a, b) => a.score - b.score);
    saveToDrive();

    await wait(500);

    const stage = el("opening-stage");
    if (!stage) return;
    stage.innerHTML = `<div class="reveal-stage" id="reveal-stage"></div>`;
    const revealContainer = el("reveal-stage");

    // カード生成 (リザルト画面用)
    results.forEach(res => {
        const cardEl = createCardElement(res.card, false, 1, savedData.cards[res.card.id]);
        cardEl.classList.add("card-appear");

        // ★ 修正: リザルト画面ではクリックによるデッキ追加/削除を無効化
        // (長押し拡大機能は createCardElement 内で付与されているのでそのまま有効)
        cardEl.onclick = null;

        if (res.isNew) {
            const badge = document.createElement("div");
            badge.className = "new-badge-overlay";
            badge.innerText = "NEW!";
            cardEl.appendChild(badge);
        }
        revealContainer.appendChild(cardEl);
    });

    // 順次表示
    const cards = revealContainer.children;
    for (let i = 0; i < 3; i++) {
        await wait(300);
        const c = results[i].card;
        const elm = cards[i];

        if (c.rarity === "UR") {
            playSE("se-win");
            elm.classList.add("card-show-ur");
            triggerEffect(document.body, 100, false);
        } else if (c.rarity === "SR") {
            playSE("se-double");
            elm.classList.add("card-show-sr");
        } else {
            playSE("se-single");
            elm.classList.add("card-show-normal");
        }
    }

    // --- Phase 4: The Choice (決断) ---
    await wait(800);

    const btnArea = document.createElement("div");
    btnArea.className = "action-buttons"; // CSSで絶対配置・下部固定済み
    const packData = PACK_DATA.find(p => p.id === currentPackId);
    const price = packData ? packData.price : 1000;
    const canBuyAgain = savedData.dp >= price;

    btnArea.innerHTML = `
        <button class="modal-btn" style="background:#444;" onclick="closePackResult()">↩️ BACK [BS]</button>
        <button class="modal-btn" style="background:${canBuyAgain ? '#e94560' : '#555'};" 
                onclick="${canBuyAgain ? 'buyPack(currentPackId)' : ''}" ${canBuyAgain ? '' : 'disabled'}>
            🎁 BUY AGAIN (${price} DP) [ENTER]
        </button>
    `;

    el("pack-results").appendChild(btnArea);
    requestAnimationFrame(() => btnArea.classList.add("visible"));

    isOpeningPack = false;
}
// リザルト閉じる処理 (OKボタン復帰処理を追加)
function closePackResult() {
    if (isOpeningPack) return;

    playSE("se-tap");
    const modal = el("pack-result-modal");
    modal.style.display = "none";
    el("pack-results").innerHTML = "";

    // ★ FIX: 静的な「OK」ボタンを表示状態に戻す（念のため）
    const staticBtn = modal.querySelector(".modal-box > button.modal-btn");
    if (staticBtn) staticBtn.style.display = "inline-block";

    updateTitleScore();
    currentPackId = "";
}
function closeCardShop() { playSE("se-tap"); el("card-shop-modal").style.display = "none"; updateTitleScore(); }
function openCollection() { playSE("se-tap"); renderDeckEditor(); el("collection-modal").style.display = "flex"; }
function closeCollection() { playSE("se-tap"); el("collection-modal").style.display = "none"; hideTooltip(); }
function renderDeckEditor() { if (!savedData.deck) savedData.deck = []; savedData.deck.sort((a, b) => a - b); const deckGrid = el("deck-grid"); deckGrid.innerHTML = ""; for (let i = 0; i < DECK_SIZE; i++) { const cardId = savedData.deck[i]; if (cardId) { const card = CARD_DB.find(c => c.id === cardId); const totalOwned = savedData.cards[card.id] || 0; const el = createCardElement(card, true, 0, totalOwned); el.onmouseenter = () => showCardDetail(card); deckGrid.appendChild(el); } else { const div = document.createElement("div"); div.className = "deck-slot-empty"; div.innerText = "EMPTY"; deckGrid.appendChild(div); } } const deckCount = savedData.deck.length; const countEl = el("deck-count"); countEl.innerText = deckCount; if (deckCount < DECK_SIZE) { countEl.style.color = "#ff5555"; countEl.innerText += " (あと" + (DECK_SIZE - deckCount) + "枚)"; } else { countEl.style.color = "#00ff00"; countEl.innerText += " (OK!)"; } const listGrid = el("card-grid"); listGrid.innerHTML = ""; if (!savedData.cards) savedData.cards = {}; let ownedCount = 0; CARD_DB.forEach(card => { const count = savedData.cards[card.id] || 0; if (count > 0) ownedCount++; const inDeckCount = savedData.deck.filter(id => id === card.id).length; const remaining = count - inDeckCount; const el = createCardElement(card, false, remaining, count); listGrid.appendChild(el); }); el("collection-rate").innerText = `${Math.floor((ownedCount / CARD_DB.length) * 100)}%`; }
/* --- main.js (Part 1: Card Creation & Zoom Logic) --- */

// カード要素生成 (長押し対応版)
function createCardElement(card, isDeckItem, remainingCount = 1, totalCount = 0) {
    const div = document.createElement("div");
    const isOwned = (totalCount > 0 || isDeckItem);
    const notOwnedClass = (!isOwned) ? "card-not-owned" : "";
    const typeClass = isDeckItem ? "in-deck-card" : "in-list-card";

    div.className = `collection-card rarity-${card.rarity} ${notOwnedClass} ${typeClass}`;

    const imgPath = `assets/cards/${card.id}.png`;
    const fallbackIcon = card.type === "MAGIC" ? "🪄" : "⛓️";
    const cost = (card.cost !== undefined) ? card.cost : "?";
    let shortDesc = card.desc;
    if (shortDesc.length > 20) shortDesc = shortDesc.substring(0, 19) + "..";

    // HTML構造 (URかそれ以外かで分岐)
    if (card.rarity === "UR" && !isDeckItem) {
        div.innerHTML = `<div class="inner-mask"><div class="card-cost-badge">${cost}</div><div class="card-count-badge">x${remainingCount}</div><div class="card-shine"></div><div class="card-art"><img src="${imgPath}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"><div class="card-placeholder" style="display:none;">${fallbackIcon}</div></div><div class="card-info"><div class="card-name">${card.name}</div><div class="card-type">[${card.type}]</div>${isOwned ? `<div class="card-info-direct">${shortDesc}</div>` : ''}</div></div>`;
    } else {
        div.innerHTML = `<div class="card-cost-badge">${cost}</div><div class="card-count-badge">x${isDeckItem ? 1 : remainingCount}</div><div class="card-shine"></div><div class="card-art"><img src="${imgPath}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"><div class="card-placeholder" style="display:none;">${fallbackIcon}</div></div><div class="card-info"><div class="card-name">${card.name}</div><div class="card-type">[${card.type}]</div>${(!isDeckItem && isOwned) ? `<div class="card-info-direct">${shortDesc}</div>` : ''}</div>`;
    }

    // ★ クリックと長押しの共存ロジック
    // デッキ編集画面やリスト画面でのみクリック有効 (リザルト画面でのクリック無効化は呼び出し元で制御)
    div.onclick = function (e) {
        if (div.dataset.longPressed === "true") {
            div.dataset.longPressed = "false"; // フラグ消費
            return; // 長押し直後のクリックは無視
        }
        if (!isOwned) return;
        if (isDeckItem) removeFromDeck(card.id);
        else addToDeck(card.id);
    };

    // マウスオーバー詳細
    div.onmouseenter = (e) => {
        showCardDetail(card);
        if (isDeckItem) showTooltip(card.name, card.desc, e);
    };
    if (isDeckItem) { div.onmouseleave = () => hideTooltip(); }

    // ★ 長押しセットアップ (所持している場合のみ)
    if (isOwned || isDeckItem) {
        setupLongPress(div, card);
    }

    return div;
}

// 長押し判定ロジック
function setupLongPress(element, card) {
    let pressTimer;
    const LONG_PRESS_DURATION = 500; // 0.5秒

    const start = (e) => {
        // 右クリック等は除外
        if (e.type === "mousedown" && e.button !== 0) return;
        element.dataset.longPressed = "false";
        pressTimer = setTimeout(() => {
            element.dataset.longPressed = "true";
            showZoomCard(card); // ズーム実行
            if (navigator.vibrate) navigator.vibrate(50); // 微振動フィードバック
        }, LONG_PRESS_DURATION);
    };

    const cancel = () => {
        if (pressTimer) clearTimeout(pressTimer);
    };

    element.addEventListener("mousedown", start);
    element.addEventListener("touchstart", start, { passive: true });
    element.addEventListener("mouseup", cancel);
    element.addEventListener("mouseleave", cancel);
    element.addEventListener("touchend", cancel);
    element.addEventListener("touchmove", cancel); // 指が動いたらキャンセル
}

// ズーム表示関数
function showZoomCard(card) {
    let overlay = document.getElementById("card-zoom-overlay");
    // オーバーレイがなければ生成 (Injection)
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "card-zoom-overlay";
        overlay.onclick = closeZoomCard; // タップで閉じる
        document.body.appendChild(overlay);
    }

    const imgPath = `assets/cards/${card.id}.png`;
    overlay.innerHTML = `
        <img src="${imgPath}" class="zoom-card-img">
        <div class="zoom-info-box">
            <div class="zoom-name">${card.name} <span style="font-size:14px; color:#aaa;">(${card.rarity})</span></div>
            <div class="zoom-desc">${card.desc}</div>
            <div class="zoom-close-hint">TAP TO CLOSE</div>
        </div>
    `;

    overlay.style.display = "flex";
    // フェードイン
    requestAnimationFrame(() => overlay.classList.add("visible"));
    playSE("se-tap");
}

// ズーム閉じる
function closeZoomCard() {
    const overlay = document.getElementById("card-zoom-overlay");
    if (overlay) {
        overlay.classList.remove("visible");
        setTimeout(() => { overlay.style.display = "none"; }, 200);
    }
}
function showCardDetail(card) { const detailEl = el("deck-card-detail"); if (!detailEl) return; detailEl.innerHTML = `<span class="detail-name">${card.name}</span>${card.desc}`; }
function showTooltip(name, desc, e) { const tt = el("global-tooltip"); el("gt-name").innerText = name; el("gt-desc").innerText = desc; tt.style.visibility = "visible"; tt.style.opacity = "1"; moveTooltip(e); e.currentTarget.onmousemove = moveTooltip; }
function moveTooltip(e) { const tt = el("global-tooltip"); const offset = 15; let left = e.clientX + offset; let top = e.clientY + offset; if (left + tt.offsetWidth > window.innerWidth) left = e.clientX - tt.offsetWidth - offset; if (top + tt.offsetHeight > window.innerHeight) top = e.clientY - tt.offsetHeight - offset; tt.style.left = left + "px"; tt.style.top = top + "px"; }
function hideTooltip() { const tt = el("global-tooltip"); tt.style.visibility = "hidden"; tt.style.opacity = "0"; }
function addToDeck(cardId) { hideTooltip(); const SAME_CARD_LIMIT = 3; if (savedData.deck.length >= DECK_SIZE) { alert(`デッキは${DECK_SIZE}枚までです！`); return; } const ownedCount = savedData.cards[cardId] || 0; const currentInDeck = savedData.deck.filter(id => id === cardId).length; if (currentInDeck >= ownedCount) { alert("これ以上持っていません！"); return; } if (currentInDeck >= SAME_CARD_LIMIT) { alert(`「${getCardName(cardId)}」は3枚までです。`); return; } playSE("se-tap"); savedData.deck.push(cardId); saveToDrive(); renderDeckEditor(); }
function removeFromDeck(cardId) { hideTooltip(); playSE("se-tap"); const index = savedData.deck.indexOf(cardId); if (index > -1) { savedData.deck.splice(index, 1); } saveToDrive(); renderDeckEditor(); }
function getCardName(id) { const c = CARD_DB.find(card => card.id === id); return c ? c.name : "カード"; }
function showDialog(title, text, type = "normal", buttons = [{ text: "OK", action: null }], autoClose = 0) { const box = el("modal-box-inner"); el("modal-title").innerText = title; el("modal-text").innerHTML = text; box.className = "modal-box"; el("modal-title").style.color = "#f9a826"; if (type === "clear") { box.classList.add("modal-clear"); el("modal-title").style.color = "#fff"; } else if (type === "warning") { box.classList.add("modal-warning"); el("modal-title").style.color = "#ff0000"; } else if (type === "item") { box.classList.add("modal-item"); el("modal-title").style.color = "#00ff00"; } const btnGroup = el("modal-buttons"); btnGroup.innerHTML = ""; buttons.forEach(b => { const btn = document.createElement("button"); btn.className = "modal-btn"; btn.innerText = b.text; btn.onclick = function () { if (window.dialogTimeout) clearTimeout(window.dialogTimeout); playSE("se-tap"); el("game-modal").style.display = "none"; if (b.action) b.action(); }; btnGroup.appendChild(btn); }); el("game-modal").style.display = "flex"; if (autoClose > 0 && buttons.length > 0) { const primaryAction = buttons[0].action; window.dialogTimeout = setTimeout(() => { el("game-modal").style.display = "none"; if (primaryAction) primaryAction(); }, autoClose); } }
function calculateStageRank(stg, turns) {
    if (stg === 5 || stg === 6) { // Extra & God
        if (turns <= 25) return ["SSS", 1000];
        if (turns <= 35) return ["S", 600];
        if (turns <= 50) return ["A", 300];
        if (turns <= 70) return ["B", 100];
        return ["C", 50];
    } else if (stg === 4) { // Toon (6 Floors)
        if (turns <= 25) return ["SSS", 1000];
        if (turns <= 35) return ["S", 600];
        if (turns <= 50) return ["A", 300];
        if (turns <= 70) return ["B", 100];
        return ["C", 50];
    } else { // Normal (1-3)
        if (turns <= 12) return ["SSS", 1000];
        if (turns <= 16) return ["S", 600];
        if (turns <= 22) return ["A", 300];
        if (turns <= 30) return ["B", 100];
        return ["C", 50];
    }
}
function finishSession(resultType, ppr, multiplier = 1.0) {
    let totalDP = 0; let earnedDP = 0; clearedStagesLog.forEach(log => { earnedDP += log.dp; }); savedData.dp = (savedData.dp || 0); const curVal = stage * 100 + floor; const bestVal = savedData.highScore.stage * 100 + savedData.highScore.floor; let isNewRecord = false; if (curVal > bestVal) { savedData.highScore.stage = stage; savedData.highScore.floor = floor; isNewRecord = true; } if (ppr > savedData.highScore.avg) { savedData.highScore.avg = ppr; isNewRecord = true; } if (resultType === "EXTRA-WIN") savedData.clearedExtra = true; const now = new Date(); const dateStr = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${("0" + now.getMinutes()).slice(-2)}`; let stgName = (stage === 6) ? "STAGE 5" : (stage === 5 ? "EXTRA" : "S" + stage + "-" + floor + "F"); let resultText = resultType; let gainedDP = 0; const scoreDP = Math.floor(totalScore * 0.2 * multiplier); let rankDP = 0; clearedStagesLog.forEach(log => rankDP += log.dp); gainedDP = scoreDP + rankDP; savedData.dp += gainedDP; if (clearedStagesLog.length > 0 && resultType === "RETURN") { const last = clearedStagesLog[clearedStagesLog.length - 1]; resultText = `CLEAR(${last.rank})`; }
    const historyItem = { date: dateStr, stage: stage, floor: floor, stgName: stgName, result: resultText, dp: gainedDP, ppr: isNaN(ppr) ? 0 : parseFloat(ppr), rt: calculateRating(isNaN(ppr) ? 0 : parseFloat(ppr)) }; if (!savedData.history) savedData.history = []; savedData.history.unshift(historyItem); if (savedData.history.length > 50) savedData.history.pop(); updateTitleScore(); saveToDrive(); return { isNewRecord: isNewRecord, gainedDP: gainedDP };
}
function shuffleArray(array) { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[array[i], array[j]] = [array[j], array[i]]; } return array; }
function triggerEffect(el, dmg, isP) { el.classList.remove("shake-small", "shake-medium", "shake-heavy", "shake-ultimate"); void el.offsetWidth; if (dmg >= 150) { el.classList.add("shake-ultimate"); playSE("se-boom"); } else if (dmg >= 60) { el.classList.add("shake-heavy"); playSE("se-boom"); } else { el.classList.add(dmg >= 30 ? "shake-medium" : "shake-small"); } const pop = document.createElement("div"); pop.innerText = dmg; if (dmg >= 150) pop.className = "damage-popup dmg-ultimate"; else if (dmg >= 60) pop.className = "damage-popup dmg-heavy"; else if (dmg >= 30) pop.className = "damage-popup dmg-medium"; else pop.className = "damage-popup dmg-small"; pop.style.left = "50%"; pop.style.top = "50%"; el.appendChild(pop); setTimeout(() => pop.remove(), 1500); }
function animateValue(obj, s, e, d) { if (obj) obj.innerHTML = e; }
function showHistory() { const list = el("history-list"); list.innerHTML = ""; if (!savedData.history || savedData.history.length === 0) { list.innerHTML = "<div style='padding:20px; text-align:center;'>NO HISTORY</div>"; } else { savedData.history.forEach(h => { let resClass = "res-lose"; let resStr = h.result || "LOSE"; if (resStr.includes("WIN") || resStr.includes("CLEAR")) resClass = "res-win"; if (resStr.includes("EXTRA")) resClass = "res-extra"; const pprVal = h.ppr ? h.ppr.toFixed(1) : "0.0"; list.innerHTML += `<div class='h-row'><div>${h.date}</div><div>${h.stgName}</div><div class='${resClass}'>${resStr}</div><div>+${h.dp} DP<br>Avg ${pprVal}</div></div>`; }); } playSE("se-tap"); el("history-modal").style.display = "flex"; }
function closeHistory() { playSE("se-tap"); el("history-modal").style.display = "none"; }
function resetSaveData() { if (confirm("【警告】現在のスロットのデータを完全に消去しますか？")) { allSaveData[currentSlot] = null; selectSlot(currentSlot.replace("slot", "")); saveToDrive(); } }
function exportSave() { navigator.clipboard.writeText(JSON.stringify(savedData)).then(() => alert("現在のスロットのデータをコピーしました")); }
function importSave() { const json = prompt("セーブデータ(JSON)を貼り付けてください"); if (json) { try { const d = JSON.parse(json); if (d.highScore && d.history) { savedData = d; updateTitleScore(); saveToDrive(); alert("読み込み完了"); } } catch (e) { alert("データ形式エラー"); } } }
function tapKey(key) { if (el("game-screen").style.display === "none" || isProcessing) return; if (key === 'ENT') handleEnter(); else if (key === 'BS') { if (currentInput.length > 0) { currentInput = currentInput.slice(0, -1); playSE("se-tap"); updateScoreDisplay(); } } else { if (currentInput.length < 3) { playSE("se-tap"); currentInput += key; updateScoreDisplay(); } } }
/* --- main.js (Part 2: Input Handling & Cleanup) --- */

// キー入力ハンドリング (統合版)
window.addEventListener("keydown", function (e) {
    // 1. パック開封モーダルが表示中の場合 (最優先)
    if (el("pack-result-modal").style.display === "flex") {
        e.preventDefault(); // 背景のゲーム操作などをブロック

        // Phase 1: 待機中 (Enterで開封開始)
        if (isOpeningPack && el("opening-prompt") && el("opening-prompt").style.opacity == 1) {
            if (e.key === "Enter") proceedToOpen();
            return;
        }

        // Phase 4: 結果表示後 (Enterで再購入, BS/Escで戻る)
        if (!isOpeningPack && el("reveal-stage")) {
            if (e.key === "Enter") {
                // 再購入 (現在選択中のパックIDで実行)
                buyPack(currentPackId);
            }
            if (e.key === "Backspace" || e.key === "Escape") {
                closePackResult();
            }
        }
        return;
    }

    // 2. タイトル画面 (チートコード)
    if (el("title-screen").style.display !== "none") {
        if (e.key === "1") cheatBuffer += e.key; else cheatBuffer = "";
        if (cheatBuffer.endsWith("1111")) {
            playSE("se-item");
            savedData.dp = (savedData.dp || 0) + 5000;
            updateTitleScore();
            saveToDrive();
            cheatBuffer = "";
        }
        return;
    }

    // 3. 汎用ダイアログ (EnterでOKボタン押下)
    if (el("game-modal").style.display === "flex" && e.key === "Enter") {
        const btns = document.getElementById("modal-buttons");
        if (btns.children.length === 1) {
            e.preventDefault();
            btns.children[0].click();
        }
        return;
    }

    // 4. 宝箱イベント (Enterで開ける)
    if (waitingForChest) {
        if (e.key === 'Enter') {
            e.preventDefault();
            openChest();
        }
        return;
    }

    // 5. ゲーム本編 (数値入力とEnter)
    if (el("game-screen").style.display !== "none" && !isProcessing) {
        if (e.key >= '0' && e.key <= '9') {
            if (currentInput.length < 3) {
                playSE("se-tap");
                currentInput += e.key;
                updateScoreDisplay();
            }
        }
        if (e.key === 'Backspace') {
            if (currentInput.length > 0) {
                currentInput = currentInput.slice(0, -1);
                updateScoreDisplay();
            }
        }
        if (e.key === 'Enter') handleEnter();
    }
});
function updateScoreDisplay() {
    // Side Slots (Horizontal)
    [1, 2, 3].forEach((i) => {
        const sideSlot = el(`slot-${i}-side`);
        const mainSlot = el(`slot-${i}`);
        
        let val = "--";
        let styleClass = "low";
        
        if (i-1 < turnInputs.length) {
            val = turnInputs[i-1];
            styleClass = (val >= 50) ? "high filled" : "filled";
        } else if (i-1 === turnInputs.length) {
            val = currentInput;
            styleClass = "active";
        }
        
        if(sideSlot) { 
            sideSlot.innerText = val; 
            sideSlot.className = `score-val ${styleClass}`; 
        }
        if(mainSlot) { mainSlot.innerText = val; }
    });

    // Indicators
    [1, 2, 3].forEach((i) => {
        const dot = el(`d-dot-${i}`);
        if(dot) {
            dot.className = "d-dot";
            if (i-1 < turnInputs.length) dot.classList.add("filled");
            else if (i-1 === turnInputs.length) dot.classList.add("active");
        }
    });
}
function getRankColor(r) { if (r === "SSS") return "#00ffff"; if (r === "S") return "#ffd700"; if (r === "A") return "#ff5555"; return "#fff"; }

/* --- main.js (Part 2: Config UI & Injection v2.10.0) --- */

// 設定モーダルの表示
function openConfigModal() {
    let modal = el("config-modal");
    if (!modal) {
        // モーダル要素の生成（初回のみ）
        modal = document.createElement("div");
        modal.id = "config-modal";
        document.body.appendChild(modal);
    }

    // HTML構築
    modal.innerHTML = `
        <div class="config-box">
            <div class="config-title">AUDIO CONFIG</div>
            <div class="config-row">
                <div class="config-label"><span>BGM (Music)</span><span id="val-bgm">${Math.round(gameConfig.bgmVolume * 100)}%</span></div>
                <input type="range" class="config-slider" min="0" max="100" value="${gameConfig.bgmVolume * 100}" oninput="updateConfigVal('bgm', this.value)">
            </div>
            <div class="config-row">
                <div class="config-label"><span>SYSTEM SE</span><span id="val-sys">${Math.round(gameConfig.sysVolume * 100)}%</span></div>
                <input type="range" class="config-slider" min="0" max="100" value="${gameConfig.sysVolume * 100}" oninput="updateConfigVal('sys', this.value)">
            </div>
            <div class="config-row">
                <div class="config-label"><span style="color:#ffaaaa;">ATTACK SE (Hit)</span><span id="val-atk" style="color:#ff4444;">${Math.round(gameConfig.atkVolume * 100)}%</span></div>
                <input type="range" class="config-slider slider-atk" min="0" max="100" value="${gameConfig.atkVolume * 100}" oninput="updateConfigVal('atk', this.value)">
            </div>
            <div class="config-buttons">
                <button class="btn-conf btn-reset" onclick="resetConfig()">RESET</button>
                <button class="btn-conf btn-save" onclick="closeConfig()">CLOSE</button>
            </div>
        </div>
    `;
    modal.style.display = "flex";
    playSE("se-tap");
}

// 設定値の更新処理
window.updateConfigVal = function (type, val) {
    const floatVal = val / 100;
    if (type === 'bgm') {
        gameConfig.bgmVolume = floatVal;
        el("val-bgm").innerText = val + "%";
        updateCurrentBgmVolume(); // BGMは即座に反映
    } else if (type === 'sys') {
        gameConfig.sysVolume = floatVal;
        el("val-sys").innerText = val + "%";
    } else if (type === 'atk') {
        gameConfig.atkVolume = floatVal;
        el("val-atk").innerText = val + "%";
    }
};

window.resetConfig = function () {
    gameConfig = { bgmVolume: 0.3, sysVolume: 0.5, atkVolume: 0.8 };
    playSE("se-tap");
    openConfigModal(); // 再描画
    updateCurrentBgmVolume();
};

window.closeConfig = function () {
    saveGameConfig();
    playSE("se-tap");
    el("config-modal").style.display = "none";
};

// ★ タイトル画面の更新関数にフックしてボタンを追加
const originalUpdateTitleScore = updateTitleScore;
updateTitleScore = function () {
    originalUpdateTitleScore(); // 元の処理を実行

    // コンフィグボタンがなければ追加する
    if (!document.getElementById("btn-config-entry")) {
        const titleScreen = el("title-screen");
        const btn = document.createElement("div");
        btn.id = "btn-config-entry";
        btn.className = "config-btn-title";
        btn.innerText = "⚙️ CONFIG";
        btn.onclick = openConfigModal;
        titleScreen.appendChild(btn);
    }
};

/* --- main.js (Part 3: Stage Select & UI Logic v2.11) --- */

// ステージ選択画面を開く
function openStageSelect() {
    playSE("se-tap");
    el("title-screen").style.display = "none";
    el("stage-select-screen").style.display = "flex";
    renderStageSelectScreen();
}

// ステージ選択画面を閉じる
function closeStageSelect() {
    playSE("se-tap");
    el("stage-select-screen").style.display = "none";
    el("title-screen").style.display = "flex";
}

// ステージリストの描画
function renderStageSelectScreen() {
    const container = el("stage-list-container");
    container.innerHTML = "";

    // ステージ定義
    const stages = [
        { id: 1, name: "旅立ちの森", sub: "Forest of Beginnings", img: "assets/bg_stage1.png" },
        { id: 2, name: "荒れ狂う荒野", sub: "Raging Wasteland", img: "assets/bg_stage2.png" },
        { id: 3, name: "誘惑の迷宮", sub: "Labyrinth of Temptation", img: "assets/bg_stage3.png" },
        { id: 4, name: "幻想の狂宴", sub: "Toon Nightmare", img: "assets/bg_stage4_1.png" },
        { id: 5, name: "燃えたぎる火口", sub: "Burning Crater", img: "assets/bg_extra.png", isExtra: true },
        { id: 6, name: "神の試練", sub: "God's Testing Ground", img: "assets/bg_stage5_1.png", isExtra: true }
    ];

    stages.forEach(st => {
        // ロック判定
        let isLocked = false;
        if (st.id === 4) isLocked = !(savedData.unlockedStage4 || (savedData.bestRanks && savedData.bestRanks[3]) || savedData.clearedExtra);
        if (st.id === 5) isLocked = !savedData.clearedExtra;
        if (st.id === 6) isLocked = !(savedData.bestRanks && savedData.bestRanks[4]); // Stage 4 clear
        // ※Stage 1-3 are always open for now

        // ランク取得
        const rank = savedData.bestRanks ? savedData.bestRanks[st.id] : null;
        let rankColor = "#444";
        if (rank === "SSS") rankColor = "#00ffff";
        else if (rank === "S") rankColor = "#ffd700";
        else if (rank === "A") rankColor = "#ff5555";
        else if (rank) rankColor = "#fff";

        const div = document.createElement("div");
        div.className = "stage-card-item";
        if (isLocked) div.classList.add("locked");

        div.innerHTML = `
            <img src="${st.img}" class="st-img">
            <div class="st-info">
                <div class="st-title">${isLocked ? "LOCKED" : st.name}</div>
                <div class="st-sub">${st.sub}</div>
            </div>
            ${rank ? `<div class="st-rank" style="color:${rankColor}">${rank}</div>` : ""}
            ${isLocked ? `<div class="st-rank" style="font-size:20px;">🔒</div>` : ""}
        `;

        if (!isLocked) {
            div.onclick = () => {
                el("stage-select-screen").style.display = "none";
                initGameSession(st.id); // ゲーム開始
            };
        }

        container.appendChild(div);
    });
}

// 戻るボタンの挙動修正
const originalReturnToTitle = returnToTitle;
returnToTitle = function () {
    playBGM("bgm-title");
    el("game-container").classList.remove("boss-mode", "extra-mode");
    el("game-screen").style.display = "none";
    el("title-screen").style.display = "flex"; // 常にタイトルへ
    el("stage-select-screen").style.display = "none";
    updateTitleScore();
};

/* --- FIX: updateTitleScore for v2.11 --- */
function updateTitleScore() {
    // 1. ハイスコア・DPの更新
    let stg = `STAGE ${savedData.highScore.stage}`;
    if (savedData.highScore.stage === 5) stg = "EXTRA";
    if (savedData.highScore.stage === 6) stg = "STAGE 5";

    // 要素が存在する場合のみ更新（安全策）
    if (el("hs-reach")) el("hs-reach").innerText = `${stg} - ${savedData.highScore.floor}F`;
    if (el("hs-avg")) el("hs-avg").innerText = savedData.highScore.avg.toFixed(1);
    if (el("hs-rt")) el("hs-rt").innerText = "Rt " + calculateRating(savedData.highScore.avg);
    if (el("dp-display")) el("dp-display").innerText = "DP: " + (savedData.dp || 0);

    // 2. コンフィグボタンの生成（存在しなければ）
    if (!document.getElementById("btn-config-entry")) {
        const titleScreen = el("title-screen");
        if (titleScreen) {
            const btn = document.createElement("div");
            btn.id = "btn-config-entry";
            btn.className = "config-btn-title";
            btn.innerText = "⚙️ CONFIG";
            btn.onclick = openConfigModal;
            titleScreen.appendChild(btn);
        }
    }
}