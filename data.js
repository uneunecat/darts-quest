// =========================================
// DARTS QUEST - MASTER DATA (data.js)
// =========================================

// Bluetooth UUIDs
const DL_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const DL_NOTIFY_UUID = '6e40fff6-b5a3-f393-e0a9-e50e24dcca9e';

// Bluetooth Score Map
const DL_SCORE_MAP = {
    0x3c: [60, 2], 0x28: [20, 0], 0x50: [60, 2], 0x14: [20, 0], 0x29: [2, 1], 0x15: [1, 0],
    0x3d: [3, 2], 0x01: [1, 0], 0x3a: [36, 1], 0x26: [18, 0], 0x4e: [54, 2], 0x12: [18, 0],
    0x2c: [8, 1], 0x18: [4, 0], 0x40: [12, 2], 0x04: [4, 0], 0x35: [26, 1], 0x21: [13, 0],
    0x49: [39, 2], 0x0d: [13, 0], 0x2e: [12, 1], 0x1a: [6, 0], 0x42: [18, 2], 0x06: [6, 0],
    0x32: [20, 1], 0x1e: [10, 0], 0x46: [30, 2], 0x0a: [10, 0], 0x37: [30, 1], 0x23: [15, 0],
    0x4b: [45, 2], 0x0f: [15, 0], 0x2a: [4, 1], 0x16: [2, 0], 0x3e: [6, 2], 0x02: [2, 0],
    0x39: [34, 1], 0x25: [17, 0], 0x4d: [51, 2], 0x11: [17, 0], 0x2b: [6, 1], 0x17: [3, 0],
    0x3f: [9, 2], 0x03: [3, 0], 0x3b: [38, 1], 0x27: [19, 0], 0x4f: [57, 2], 0x13: [19, 0],
    0x2f: [14, 1], 0x1b: [7, 0], 0x43: [21, 2], 0x07: [7, 0], 0x38: [32, 1], 0x24: [16, 0],
    0x4c: [48, 2], 0x10: [16, 0], 0x30: [16, 1], 0x1c: [8, 0], 0x44: [24, 2], 0x08: [8, 0],
    0x33: [22, 1], 0x1f: [11, 0], 0x47: [33, 2], 0x0b: [11, 0], 0x36: [28, 1], 0x22: [14, 0],
    0x4a: [42, 2], 0x0e: [14, 0], 0x31: [18, 1], 0x1d: [9, 0], 0x45: [27, 2], 0x09: [9, 0],
    0x34: [24, 1], 0x20: [12, 0], 0x48: [36, 2], 0x0c: [12, 0], 0x2d: [10, 1], 0x19: [5, 0],
    0x41: [15, 2], 0x05: [5, 0], 0x51: [50, 3], 0x52: [50, 4], 0x54: "CHANGE"
};

// Game Logic Constants
const DECK_SIZE = 20;
const HAND_SIZE = 5;
const INITIAL_HAND = 3;
const SAVE_KEY = "darts_quest_save";

// Enemy & Stage Data
const GAME_DATA = {
    enemies: {
        1: [
            { name: "プチモス", img: "assets/1-1.png", weak: 20 },
            { name: "ラーバモス", img: "assets/1-2.png", weak: 19 },
            { name: "進化の繭", img: "assets/1-3.png", weak: 18, hp: 260 },
            { name: "グレート・モス", img: "assets/1-4.png", weak: 17, hp: 290 },
            { name: "究極完全態・グレート・モス", img: "assets/1-5.png", weak: 20, hp: 420 }
        ],
        2: [
            { name: "トラコドン", img: "assets/2-1.png", weak: 19 },
            { name: "ワイルド・ラプター", img: "assets/2-2.png", weak: 18, hp: 280 },
            { name: "屍を貪る竜", img: "assets/2-3.png", weak: 17, hp: 310 },
            { name: "二頭を持つキング・レックス", img: "assets/2-4.png", weak: 20, hp: 340 },
            { name: "剣竜", img: "assets/2-5.png", weak: 19, hp: 540 }
        ],
        3: [
            { name: "デュナミス・ヴァルキリア", img: "assets/3-1.png", weak: 20, hp: 300 },
            { name: "ハーピィ・レディ", img: "assets/3-2.png", weak: 19, hp: 330 },
            { name: "ハーピィ・レディ・SB", img: "assets/3-3.png", weak: 18, hp: 360 },
            { name: "ハーピィ・レディ三姉妹", img: "assets/3-4.png", weak: 17, hp: 390 },
            { name: "ハーピィズペット竜", img: "assets/3-5.png", weak: 20, hp: 550 }
        ],
        4: [
            { name: "ダーク・ラビット", img: "assets/4-1.png", weak: 20, hp: 380 },
            { name: "デビル・ボックス", img: "assets/4-2.png", weak: 19, hp: 420 },
            { name: "トゥーン・デーモン", img: "assets/4-3.png", weak: 18, hp: 460 },
            { name: "ブルーアイズ・トゥーン・ドラゴン", img: "assets/4-4.png", weak: 17, hp: 500 },
            { name: "サクリファイス", img: "assets/4-5.png", weak: 20, hp: 550 },
            { name: "サウザンド・アイズ・サクリファイス", img: "assets/4-6.png", weak: 20, hp: 800 }
        ],
        5: [
            { name: "真紅眼の黒竜", img: "assets/extra.png", weak: 20, hp: 1500 }
        ],
        6: [
            { name: "ワームドレイク", img: "assets/5-1.png", weak: 19, hp: 400 },
            { name: "ヒューマノイド・スライム", img: "assets/5-2.png", weak: 18, hp: 450 },
            { name: "リバイバルスライム", img: "assets/5-3.png", weak: 20, hp: 300 },
            { name: "ヒューマノイド・ドレイク", img: "assets/5-4.png", weak: 17, hp: 600 },
            { name: "オシリスの天空竜", img: "assets/5-5.png", weak: 20, hp: 2000 }
        ]
    },
    bg: {
        1: "assets/bg_stage1.png",
        2: "assets/bg_stage2.png",
        3: "assets/bg_stage3.png",
        4_1: "assets/bg_stage4_1.png",
        4_2: "assets/bg_stage4_2.png",
        5: "assets/bg_extra.png",
        6: "assets/bg_stage5_1.png"
    }
};

// Card Database
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

// Pack Data
const PACK_DATA = [
    { id: "vol1", name: "Vol.1 - Legend", price: 1000, desc: "伝説の始まり。基本魔法カード収録。", unlockStage: 1, img: "assets/packs/vol1.png" },
    { id: "vol2", name: "Vol.2 - Awakening", price: 1500, desc: "テクニカルな戦略カードが登場。", unlockStage: 3, img: "assets/packs/vol2.png" }
];