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
// Updated: data.js (GAME_DATA 全体の差し替え)
const GAME_DATA = {
    enemies: {
        1: [
            { name: "プチモス", img: "assets/1-1.png", weak: 20, ai: [{ id: "attack", weight: 1 }] },
            { name: "ラーバモス", img: "assets/1-2.png", weak: 19, ai: [{ id: "attack", weight: 1 }] },
            { name: "進化の繭", img: "assets/1-3.png", weak: 18, hp: 260, ai: [
                { name: "自己再生", type: "HEAL", value: 20, se: "se-heal", color: "heal", weight: 3, cond: { src: "e_hp", op: "lt", val: 80 } },
                { name: "鉄壁の守り", type: "BUFF_E", state: { guard: true }, se: "se-buff", color: "earth", weight: 4 },
                { id: "attack", weight: 4 }
            ]},
            { name: "グレート・モス", img: "assets/1-4.png", weak: 17, hp: 290, ai: [
                { name: "猛毒の鱗粉", type: "MP_DAMAGE", value: 1, se: "se-attack", color: "earth", weight: 3, cond: { src: "p_mp", op: "gt", val: 0 } },
                { id: "attack", weight: 7 }
            ]},
            { name: "究極完全態・グレート・モス", img: "assets/1-5.png", weak: 20, hp: 420, ai: [
                { 
                    weight: 5,
                    sequence: [
                        { name: "力を溜めている…", type: "CHARGE", se: "se-warning", color: "earth" },
                        { name: "森の破壊衝動", type: "ATTACK", mult: 3.0, se: "se-boom", color: "earth" }
                    ]
                },
                { id: "attack", weight: 5 }
            ]}
        ],
        2: [
            { name: "トラコドン", img: "assets/2-1.png", weak: 19, ai: [{ id: "attack", weight: 1 }] },
            { name: "ワイルド・ラプター", img: "assets/2-2.png", weak: 18, hp: 280, ai: [
                { name: "俊足の連撃", type: "MULTI_ATTACK", count: 2, mult: 0.7, color: "fire", weight: 3 },
                { id: "attack", weight: 7 }
            ]},
            { name: "屍を貪る竜", img: "assets/2-3.png", weak: 17, hp: 310, ai: [
                { name: "死肉の渇望", type: "DRAIN", mult: 1.0, color: "fire", weight: 3 },
                { id: "attack", weight: 7 }
            ]},
            { name: "二頭を持つキング・レックス", img: "assets/2-4.png", weak: 20, hp: 340, ai: [
                { name: "狂暴化", type: "BUFF_E", state: { atkBuff: 0.5, atkBuffTurn: 10 }, se: "se-buff", color: "fire", guaranteed: true, cond: { src: "e_hp", op: "lt", val: 50 } },
                { id: "attack", weight: 5 }
            ]},
            { name: "剣竜", img: "assets/2-5.png", weak: 19, hp: 540, ai: [
                { name: "恐竜剣・兜割り", type: "ATTACK", mult: 2.0, color: "earth", weight: 3 },
                { id: "attack", weight: 7 }
            ]}
        ],
        3: [
            { name: "デュナミス・ヴァルキリア", img: "assets/3-1.png", weak: 20, hp: 300, ai: [
                { name: "護封剣の加護", type: "BUFF_E", state: { guardType: 'cut', guardTurn: 3 }, color: "gold", weight: 10, cond: { src: "turn", op: "eq", val: 1 } },
                { id: "attack", weight: 10 }
            ]},
            { name: "ハーピィ・レディ", img: "assets/3-2.png", weak: 19, hp: 330, ai: [
                { name: "誘惑の風", type: "MP_DRAIN", value: 1, heal: 20, color: "wind", weight: 3, cond: { src: "p_mp", op: "gt", val: 0 } },
                { id: "attack", weight: 7 }
            ]},
            { name: "ハーピィ・レディ・SB", img: "assets/3-3.png", weak: 18, hp: 360, ai: [
                { name: "サイバー・ボンテージ", type: "STATE_P", state: { restrictInput: true }, color: "wind", weight: 8, cond: { src: "p_state", tag: "restrictInput", val: false } },
                { id: "attack", weight: 7 }
            ]},
            { name: "ハーピィ・レディ三姉妹", img: "assets/3-4.png", weak: 17, hp: 390, ai: [
                { name: "トライアングル・エクスタシー", type: "MULTI_ATTACK", count: 3, mult: 0.6, color: "wind", weight: 3 },
                { id: "attack", weight: 7 }
            ]},
            { name: "ハーピィズペット竜", img: "assets/3-5.png", weak: 20, hp: 550, ai: [
                { name: "愛の鞭・ブレス", type: "MP_DAMAGE", value: 99, mult: 2.0, color: "fire", guaranteed: true, cond: { src: "turn_mod", val: 4 } },
                { id: "attack", weight: 7 }
            ]}
        ],
        4: [
            { name: "ダーク・ラビット", img: "assets/4-1.png", weak: 20, hp: 380, ai: [
                { name: "トゥーン・ラッシュ", type: "MULTI_ATTACK", count: 2, mult: 0.7, color: "wind", weight: 3 },
                { id: "attack", weight: 7 }
            ]},
            { name: "デビル・ボックス", img: "assets/4-2.png", weak: 19, hp: 420, ai: [
                {name: "死のびっくり箱",type: "ATTACK", fixedDmg: 999, color: "fire", guaranteed: true, cond: { src: "turn", op: "eq", val: 5 }},
                { id: "attack", weight: 10 }
            ]},
            { name: "トゥーン・デーモン", img: "assets/4-3.png", weak: 18, hp: 460, ai: [
                { name: "呪いの視線", type: "MP_DAMAGE", value: 2, color: "earth", weight: 4 },
                { id: "attack", weight: 6 }
            ]},
            { name: "ブルーアイズ・トゥーン・ドラゴン", img: "assets/4-4.png", weak: 17, hp: 500, ai: [
                { name: "トゥーン・スキン", type: "BUFF_E", state: { toonSkin: true }, weight: 10, cond: { src: "turn_mod", val: 3 } },
                { id: "attack", weight: 10 }
            ]},
            { name: "サクリファイス", img: "assets/4-5.png", weak: 20, hp: 550, ai: [
                { name: "幻想の儀式", type: "DRAIN", mult: 1.2, weight: 3, cond: { src: "turn_mod", val: 3 } },
                { id: "attack", weight: 7 }
            ]},
            { name: "サウザンド・アイズ・サクリファイス", img: "assets/4-6.png", weak: 20, hp: 800, ai: [
                { name: "千眼の邪教神", type: "BUFF_E", state: { barrierLimit: 10 }, weight: 5, cond: { src: "turn_mod", val: 2 } },
                { id: "attack", weight: 5 }
            ]}
        ],
        5: [
            { name: "真紅眼の黒竜", img: "assets/extra.png", weak: 20, hp: 1500, ai: [
                { name: "黒 炎 弾", type: "MP_DAMAGE", value: 5, fixedDmg: 50, se: "se-boom", color: "fire",guaranteed: true, cond: { src: "turn_mod", val: 5 } },
                { id: "attack", weight: 8 }
            ]}
        ],
        6: [
            { name: "ワームドレイク", img: "assets/5-1.png", weak: 19, hp: 400, ai: [{ id: "attack", weight: 1 }] },
            { name: "ヒューマノイド・スライム", img: "assets/5-2.png", weak: 18, hp: 450, ai: [{ id: "attack", weight: 1 }] },
            { name: "リバイバルスライム", img: "assets/5-3.png", weak: 20, hp: 300, ai: [
                { name: "再 生", type: "HEAL", value: 999, se: "se-heal", weight: 3, cond: { src: "e_hp", op: "lt", val: 30 } },
                { id: "attack", weight: 7 }
            ]},
            { name: "ヒューマノイド・ドレイク", img: "assets/5-4.png", weak: 17, hp: 600, ai: [
                { name: "スライムの粘着", type: "STATE_P", state: { itemLock: true }, weight: 3, cond: { src: "p_state", tag: "itemLock", val: false } },
                { id: "attack", weight: 7 }
            ]},
            { name: "オシリスの天空竜", img: "assets/5-5.png", weak: 20, hp: 2000, ai: [
                { name: "サンダー・フォース", type: "ATTACK", fixedDmg: 80, isBossUlt: true, color: "fire", guaranteed: true, cond: { src: "turn_mod", val: 5 } },
                { id: "attack", weight: 8 }
            ]}
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

// Updated: data.js (CARD_DB アトミック・システム完全版)

const CARD_DB = [
    // --- MAGIC CARDS ---
    { id: 101, name: "死者蘇生", rarity: "UR", type: "MAGIC", cost: 8, desc: "HPを最大値まで完全回復", se: "se-heal",
      effects: [{ type: "HEAL", value: "FULL" }], packs: ["vol1"] },

    { id: 201, name: "サンダー・ボルト", rarity: "SR", type: "MAGIC", cost: 6, desc: "100ダメ＋スタン(1T行動不能)", se: "se-boom",
      effects: [{ type: "DAMAGE", value: 100 }, { type: "STATE_E", stun: true }], packs: ["vol1"] },

    { id: 202, name: "強欲な壺", rarity: "SR", type: "MAGIC", cost: 2, desc: "カードを2枚引く", se: "se-heal",
      effects: [{ type: "DRAW", value: 2 }], packs: ["vol1"] },

    { id: 301, name: "光の護封剣", rarity: "R", type: "MAGIC", cost: 5, desc: "3ターンの間、被ダメージ半減", se: "se-buff",
      effects: [{ type: "STATE_P", state: { guardTurn: 3 }, msg: "3ターン防御(被ダメ半減)！" }], packs: ["vol1"] },

    { id: 401, name: "火の粉", rarity: "N", type: "MAGIC", cost: 1, desc: "敵に30ダメージ", se: "se-attack",
      effects: [{ type: "DAMAGE", value: 30 }], packs: ["vol1"] },

    { id: 402, name: "治療の神", rarity: "N", type: "MAGIC", cost: 4, desc: "HPを50回復", se: "se-heal",
      effects: [{ type: "HEAL", value: 50 }], packs: ["vol1"] },

    { id: 404, name: "昼夜の大火事", rarity: "N", type: "MAGIC", cost: 3, desc: "敵に80ダメージ", se: "se-attack",
      effects: [{ type: "DAMAGE", value: 80 }], packs: ["vol1"] },

    { id: 405, name: "突進", rarity: "N", type: "MAGIC", cost: 2, desc: "攻撃力2倍(このターンのみ)", se: "se-buff",
      effects: [{ type: "STATE_P", state: { power: true }, msg: "攻撃力2倍(このターン)！" }], packs: ["vol1"] },

    { id: 501, name: "天使の施し", rarity: "UR", type: "MAGIC", cost: 2, desc: "手札を1枚選んで捨て、3枚引く", se: "se-heal",
      effects: [{ type: "DISCARD_SELECT", count: 1 }, { type: "DRAW", value: 3 }], packs: ["vol2"] },

    { id: 601, name: "ブラック・ホール", rarity: "SR", type: "MAGIC", cost: 7, desc: "手札全捨て＋150ダメ", se: "se-boom",
      effects: [{ type: "DAMAGE", value: 150 }, { type: "DISCARD_ALL" }], packs: ["vol2"] },

    { id: 701, name: "巨大化", rarity: "R", type: "MAGIC", cost: 3, desc: "HP状況で攻撃力3倍or0.5倍", se: "se-buff",
      effects: [{ type: "SPECIAL_HUGE" }], packs: ["vol2"] },

    { id: 702, name: "地割れ", rarity: "R", type: "MAGIC", cost: 3, desc: "40ダメ＋敵の防御を破壊", se: "se-attack",
      effects: [{ type: "DAMAGE", value: 40 }, { type: "STATE_E", state: { guard: false }, msg: "敵の防御を破壊！" }], packs: ["vol2"] },

    { id: 801, name: "守備封じ", rarity: "N", type: "MAGIC", cost: 1, desc: "敵の防御状態を解除", se: "se-tap",
      effects: [{ type: "STATE_E", state: { guard: false }, msg: "敵の防御を解除した！" }], packs: ["vol2"] },

    { id: 802, name: "火あぶりの刑", rarity: "N", type: "MAGIC", cost: 2, desc: "敵に60ダメージ", se: "se-attack",
      effects: [{ type: "DAMAGE", value: 60 }], packs: ["vol2"] },

    { id: 803, name: "援軍", rarity: "N", type: "MAGIC", cost: 2, desc: "HP30回復＋攻撃力+20", se: "se-heal",
      effects: [{ type: "HEAL", value: 30 }, { type: "STATE_P", state: { atkBonus: 20 } }], packs: ["vol2"] },

    { id: 804, name: "闇の仮面", rarity: "N", type: "MAGIC", cost: 4, desc: "墓地の魔法カードを回収", se: "se-tap",
      effects: [{ type: "SPECIAL_SALVAGE" }], packs: ["vol2"] },

    { id: 805, name: "最終戦争", rarity: "N", type: "MAGIC", cost: 5, desc: "自傷50＋敵に150ダメージ", se: "se-boom",
      effects: [{ type: "DAMAGE", value: 150 }, { type: "DAMAGE", target: "PLAYER", value: 50 }], packs: ["vol2"] },

    // --- TRAP CARDS ---
    { id: 302, name: "落とし穴", rarity: "R", type: "TRAP", cost: 3, desc: "【罠】敵出現時、50ダメ＋1Tスタン", se: "se-hit",
      trap: { trigger: "summon", effects: [{ type: "DAMAGE", value: 50 }, { type: "STATE_E", stun: true }] }, packs: ["vol1"] },

    { id: 303, name: "聖なるバリア", rarity: "R", type: "TRAP", cost: 4, desc: "【罠】攻撃無効化＋50ダメ", se: "se-boom",
      trap: { trigger: "attack", effects: [{ type: "NEGATE" }, { type: "DAMAGE", value: 50 }] }, packs: ["vol1"] },

    { id: 403, name: "はさみ撃ち", rarity: "N", type: "TRAP", cost: 2, desc: "【罠】被弾時に敵に80ダメージ", se: "se-attack",
      trap: { trigger: "attack", effects: [{ type: "DAMAGE", value: 80 }] }, packs: ["vol1"] },

    { id: 602, name: "魔法の筒", rarity: "SR", type: "TRAP", cost: 4, desc: "【罠】攻撃無効＋そのダメを反射", se: "se-boom",
      trap: { trigger: "attack", effects: [{ type: "NEGATE" }, { type: "REFLECT", mult: 1.0 }] }, packs: ["vol2"] },

    { id: 703, name: "六芒星の呪縛", rarity: "R", type: "TRAP", cost: 3, desc: "【罠】敵攻撃半減＋1Tスタン", se: "se-buff",
      trap: { trigger: "attack", effects: [{ type: "STATE_E", stun: true }, { type: "DAMAGE_MULT", value: 0.5 }] }, packs: ["vol2"] }
];

// Pack Data
const PACK_DATA = [
    { id: "vol1", name: "Vol.1 - Legend", price: 1000, desc: "伝説の始まり。基本魔法カード収録。", unlockStage: 1, img: "assets/packs/vol1.png" },
    { id: "vol2", name: "Vol.2 - Awakening", price: 1500, desc: "テクニカルな戦略カードが登場。", unlockStage: 3, img: "assets/packs/vol2.png" }
];

// Updated: data.js (追加分)

// Player Default Stats
const PLAYER_INITIAL_STATS = {
    hp: 100,
    maxHp: 100,
    mp: 3,
    maxMp: 10,
    items: { potion: 0, ether: 0, seed: 0 }
};

// Stage & Rank Master
const STAGE_MASTER = {
    1: { title: "旅立ちの森", sub: "Forest of Beginnings", multiplier: 1.0, warning: false, 
         thresholds: { SSS: 12, S: 16, A: 22, B: 30 } },
    2: { title: "荒れ狂う荒野", sub: "Raging Wasteland", multiplier: 1.5, warning: false, 
         thresholds: { SSS: 12, S: 16, A: 22, B: 30 } },
    3: { title: "誘惑の迷宮", sub: "Labyrinth of Temptation", multiplier: 2.0, warning: false, 
         thresholds: { SSS: 12, S: 16, A: 22, B: 30 } },
    4: { title: "幻想の狂宴", sub: "Toon Nightmare", multiplier: 3.0, warning: true, 
         thresholds: { SSS: 25, S: 35, A: 50, B: 70 } },
    5: { title: "燃えたぎる火口", sub: "Burning Crater", multiplier: 5.0, warning: true, 
         thresholds: { SSS: 25, S: 35, A: 50, B: 70 } }, // EXTRA
    6: { title: "神の試練", sub: "God's Testing Ground", multiplier: 5.0, warning: true, 
         thresholds: { SSS: 25, S: 35, A: 50, B: 70 } }  // GOD
};

const RANK_BONUS = {
    SSS: 1000, S: 600, A: 300, B: 100, C: 50
};

// Audio Asset IDs
const AUDIO_ASSETS = {
    BGM: ["bgm-title", "bgm-battle", "bgm-boss", "bgm-extra", "bgm-win", "bgm-lose"],
    SE_ATTACK: ["se-hit", "se-weak", "se-attack", "se-boom", "se-single", "se-double", "se-triple", "se-bull", "se-dbull"],
    SE_SYSTEM: ["se-tap", "se-heal", "se-buff", "se-warning", "se-chest", "se-item"]
};

// Updated: data.js (追加分)

// レーティング算出用テーブル
const RATING_TABLE = [
    { ppr: 130, rt: 17 }, { ppr: 120, rt: 16 }, { ppr: 110, rt: 15 },
    { ppr: 100, rt: 14 }, { ppr: 95,  rt: 13 }, { ppr: 90,  rt: 12 },
    { ppr: 85,  rt: 11 }, { ppr: 80,  rt: 10 }, { ppr: 75,  rt: 9 },
    { ppr: 70,  rt: 8 },  { ppr: 65,  rt: 7 },  { ppr: 60,  rt: 6 },
    { ppr: 55,  rt: 5 },  { ppr: 50,  rt: 4 },  { ppr: 45,  rt: 3 },
    { ppr: 40,  rt: 2 },  { ppr: 30,  rt: 1 }
];

// アイテム効果の定義
const ITEM_EFFECTS = {
    potion: { name: "薬草",       type: "hp",    value: 50, msg: "HP 50 回復", icon: "💊" },
    ether:  { name: "魔法の聖水", type: "mp",    value: 3,  msg: "MP 3 回復",  icon: "⚗️" },
    seed:   { name: "命の種",     type: "maxHp", value: 10, msg: "MaxHP +10",  icon: "🌱" }
};

// 宝箱のドロップ率設定
const CHEST_DROP_CONFIG = {
    default_rate: 0.3,
    boss_rate: 1.0,
    seed_rates: {
        base: 0.15,
        weak2: 0.50,
        weak3: 1.0
    }
};