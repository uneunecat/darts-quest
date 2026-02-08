// =========================================
// 1. SYSTEM CONSTANTS & CONFIG
// =========================================
const DECK_SIZE = 20;
const HAND_SIZE = 5;
const INITIAL_HAND = 3;
const SAVE_KEY = "darts_quest_save";

// Bluetooth UUIDs
const DL_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const DL_NOTIFY_UUID = '6e40fff6-b5a3-f393-e0a9-e50e24dcca9e';

// Darts Score Mapping
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

// =========================================
// 2. ENEMY SKILLS & AI DATABASE (新規体系化)
// =========================================

// スキル定義 (行動の最小単位)
// type: 'attack' | 'heal' | 'buff' | 'debuff' | 'charge' | 'guard'
const ENEMY_SKILLS = {
    // --- 攻撃系 ---
    "basic_attack": { name: "通常攻撃", type: "attack", mult: 1.0 },
    "strong_attack": { name: "強攻撃", type: "attack", mult: 1.5, se: "se-boom" },
    "double_attack": { name: "連続攻撃", type: "attack", mult: 0.7, count: 2, cutin: "wind", msg: "2回攻撃！" },
    "triple_attack": { name: "怒涛の連撃", type: "attack", mult: 0.6, count: 3, cutin: "wind", msg: "3回攻撃！" },
    "drain_attack": { name: "吸血", type: "attack", mult: 1.0, effect: "drain", cutin: "fire", msg: "HP吸収！" },
    "ignore_shield": { name: "貫通攻撃", type: "attack", mult: 1.5, effect: "ignore_shield", cutin: "earth", msg: "シールド貫通！" },
    "death_box": { name: "死のびっくり箱", type: "attack", fixed: 999, effect: "ignore_shield", cutin: "fire", msg: "即死攻撃！" },
    
    // --- ボス必殺技 ---
    "thunder_force": { name: "サンダー・フォース", type: "attack", mult: 1.0, fixedAdd: 80, isUlt: true, cutin: "fire", msg: "神の怒り！" },
    "black_flame": { name: "黒炎弾", type: "attack", mult: 1.0, fixedAdd: 50, mpDmg: 5, isUlt: true, cutin: "fire", msg: "MP消滅＆大ダメージ" },
    "love_whip": { name: "愛の鞭・ブレス", type: "attack", mult: 2.0, mpDmg: 99, isUlt: true, cutin: "fire", msg: "MP全消滅＆極大ダメージ" },

    // --- 回復・防御系 ---
    "self_regen": { name: "自己再生", type: "heal", val: 20, cutin: "heal", msg: "HP20回復" },
    "full_heal": { name: "完全再生", type: "heal", val: 9999, cutin: "heal", msg: "HP全回復！" },
    "iron_guard": { name: "鉄壁の守り", type: "guard", val: 0.5, turn: 1, cutin: "earth", msg: "ダメージ半減！" },
    "opening_guard": { name: "護封剣の加護", type: "guard", val: 0.5, turn: 3, cutin: "gold", msg: "3ターン半減！" },
    "toon_skin": { name: "トゥーン・スキン", type: "buff", state: "toon", cutin: "earth", msg: "硬質化！被ダメ-15" },
    "barrier_10": { name: "千眼の邪教神", type: "buff", state: "barrier", val: 10, cutin: "wind", msg: "結界！10未満無効" },
    
    // --- デバフ・特殊系 ---
    "poison_dust": { name: "猛毒の鱗粉", type: "debuff", mpDmg: 1, cutin: "earth", msg: "猛毒！MP-1" },
    "curse_eye": { name: "呪いの視線", type: "debuff", mpDmg: 2, cutin: "earth", msg: "呪い！MP-2" },
    "mp_drain": { name: "誘惑の風", type: "debuff", mpDmg: 1, effect: "drain_mp", cutin: "wind", msg: "MP吸収！" },
    "bind_wire": { name: "拘束", type: "debuff", state: "restrict", cutin: "wind", msg: "投擲数制限！" },
    "slime_sticky": { name: "粘着液", type: "debuff", state: "seal_item", cutin: "earth", msg: "アイテム封印！" },
    "charge_power": { name: "力溜め", type: "charge", next: "forest_destroyer", cutin: "earth", msg: "力を溜めている…" },
    "forest_destroyer": { name: "森の破壊衝動", type: "attack", mult: 3.0, cutin: "earth", msg: "3倍攻撃！" },
    "rage_mode": { name: "狂暴化", type: "buff", state: "rage", val: 1.5, cutin: "fire", msg: "攻撃力1.5倍！" },
    "god_buff": { name: "神の加護", type: "buff", state: "buff_atk", val: 0.1, msg: "攻撃力UP" }
};

// AIパターン定義 (When to do)
// cond: 'turn_mod'(周期), 'hp_under'(HP割合), 'random'(確率), 'first'(初回), 'always'(常時)
const AI_PATTERNS = {
    "default": [
        { cond: "always", skill: "basic_attack" }
    ],
    // --- STAGE 1 ---
    "s1_p3": [ // 進化の繭
        { cond: "random", val: 0.2, skill: "self_regen" },
        { cond: "random", val: 0.4, skill: "iron_guard" },
        { cond: "always", skill: "basic_attack" }
    ],
    "s1_p4": [ // グレートモス
        { cond: "random", val: 0.3, skill: "poison_dust" },
        { cond: "always", skill: "basic_attack" }
    ],
    "s1_p5": [ // 究極完全態
        { cond: "charge_release", skill: "forest_destroyer" }, // 溜め開放
        { cond: "random", val: 0.3, skill: "charge_power" },
        { cond: "always", skill: "basic_attack" }
    ],
    // --- STAGE 2 ---
    "s2_p2": [ // ワイルドラプター
        { cond: "random", val: 0.3, skill: "double_attack" },
        { cond: "always", skill: "basic_attack" }
    ],
    "s2_p3": [ // 屍竜
        { cond: "random", val: 0.3, skill: "drain_attack" },
        { cond: "always", skill: "basic_attack" }
    ],
    "s2_p4": [ // キングレックス
        { cond: "hp_under", val: 0.5, prob: 0.5, skill: "rage_mode" },
        { cond: "always", skill: "basic_attack" }
    ],
    "s2_p5": [ // 剣竜
        { cond: "random", val: 0.3, skill: "ignore_shield" },
        { cond: "always", skill: "strong_attack" }
    ],
    // --- STAGE 3 ---
    "s3_p1": [ // ヴァルキリア (先制護封剣はmain.jsで処理)
        { cond: "always", skill: "basic_attack" }
    ],
    "s3_p2": [ // ハーピィ
        { cond: "random", val: 0.3, skill: "mp_drain" },
        { cond: "always", skill: "basic_attack" }
    ],
    "s3_p3": [ // ハーピィSB
        { cond: "random", val: 0.3, skill: "bind_wire" },
        { cond: "always", skill: "basic_attack" }
    ],
    "s3_p4": [ // 三姉妹
        { cond: "random", val: 0.3, skill: "triple_attack" },
        { cond: "always", skill: "basic_attack" }
    ],
    "s3_p5": [ // ペット竜
        { cond: "turn_mod", val: 4, skill: "love_whip" },
        { cond: "always", skill: "god_buff" } // 毎回バフ+攻撃
    ],
    // --- STAGE 4 (Toon) ---
    "s4_p1": [ // ラビット
        { cond: "random", val: 0.3, skill: "double_attack" },
        { cond: "always", skill: "basic_attack" }
    ],
    "s4_p2": [ // デビルボックス
        { cond: "turn_eq", val: 5, skill: "death_box" },
        { cond: "always", skill: "basic_attack" }
    ],
    "s4_p3": [ // デーモン
        { cond: "random", val: 0.4, skill: "curse_eye" },
        { cond: "always", skill: "basic_attack" }
    ],
    "s4_p4": [ // ブルーアイズトゥーン
        { cond: "turn_mod", val: 3, skill: "toon_skin" },
        { cond: "always", skill: "strong_attack" }
    ],
    "s4_p5": [ // サクリファイス
        { cond: "turn_mod", val: 3, skill: "drain_attack" },
        { cond: "always", skill: "basic_attack" }
    ],
    "s4_p6": [ // サウザンドアイズ
        { cond: "turn_mod", val: 2, skill: "barrier_10" },
        { cond: "always", skill: "basic_attack" }
    ],
    // --- STAGE 5 (Extra) ---
    "s5_boss": [ // 真紅眼
        { cond: "turn_mod", val: 5, skill: "black_flame" },
        { cond: "always", skill: "strong_attack" }
    ],
    // --- STAGE 6 (God) ---
    "s6_p3": [ // 再生スライム
        { cond: "random", val: 0.3, skill: "full_heal" },
        { cond: "always", skill: "basic_attack" }
    ],
    "s6_p4": [ // ヒューマノイド
        { cond: "random", val: 0.3, skill: "slime_sticky" },
        { cond: "always", skill: "basic_attack" }
    ],
    "s6_boss": [ // オシリス
        { cond: "turn_mod", val: 5, skill: "thunder_force" },
        { cond: "random", val: 0.4, skill: "god_buff" },
        { cond: "always", skill: "strong_attack" }
    ]
};

// =========================================
// 3. MASTER DATA (Enemies, Cards, Packs)
// =========================================

// 敵データ (AI IDを紐付け)
const GAME_DATA = {
    enemies: {
        1: [
            { name: "プチモス", img: "assets/1-1.png", weak: 20, ai: "default" },
            { name: "ラーバモス", img: "assets/1-2.png", weak: 19, ai: "default" },
            { name: "進化の繭", img: "assets/1-3.png", weak: 18, hp: 260, ai: "s1_p3" },
            { name: "グレート・モス", img: "assets/1-4.png", weak: 17, hp: 290, ai: "s1_p4" },
            { name: "究極完全態・グレート・モス", img: "assets/1-5.png", weak: 20, hp: 420, ai: "s1_p5" }
        ],
        2: [
            { name: "トラコドン", img: "assets/2-1.png", weak: 19, ai: "default" },
            { name: "ワイルド・ラプター", img: "assets/2-2.png", weak: 18, hp: 280, ai: "s2_p2" },
            { name: "屍を貪る竜", img: "assets/2-3.png", weak: 17, hp: 310, ai: "s2_p3" },
            { name: "二頭を持つキング・レックス", img: "assets/2-4.png", weak: 20, hp: 340, ai: "s2_p4" },
            { name: "剣竜", img: "assets/2-5.png", weak: 19, hp: 540, ai: "s2_p5" }
        ],
        3: [
            { name: "デュナミス・ヴァルキリア", img: "assets/3-1.png", weak: 20, hp: 300, ai: "s3_p1" },
            { name: "ハーピィ・レディ", img: "assets/3-2.png", weak: 19, hp: 330, ai: "s3_p2" },
            { name: "ハーピィ・レディ・SB", img: "assets/3-3.png", weak: 18, hp: 360, ai: "s3_p3" },
            { name: "ハーピィ・レディ三姉妹", img: "assets/3-4.png", weak: 17, hp: 390, ai: "s3_p4" },
            { name: "ハーピィズペット竜", img: "assets/3-5.png", weak: 20, hp: 550, ai: "s3_p5" }
        ],
        4: [
            { name: "ダーク・ラビット", img: "assets/4-1.png", weak: 20, hp: 380, ai: "s4_p1" },
            { name: "デビル・ボックス", img: "assets/4-2.png", weak: 19, hp: 420, ai: "s4_p2" },
            { name: "トゥーン・デーモン", img: "assets/4-3.png", weak: 18, hp: 460, ai: "s4_p3" },
            { name: "ブルーアイズ・トゥーン・ドラゴン", img: "assets/4-4.png", weak: 17, hp: 500, ai: "s4_p4" },
            { name: "サクリファイス", img: "assets/4-5.png", weak: 20, hp: 550, ai: "s4_p5" },
            { name: "サウザンド・アイズ・サクリファイス", img: "assets/4-6.png", weak: 20, hp: 800, ai: "s4_p6" }
        ],
        5: [
            { name: "真紅眼の黒竜", img: "assets/extra.png", weak: 20, hp: 1500, ai: "s5_boss" }
        ],
        6: [
            { name: "ワームドレイク", img: "assets/5-1.png", weak: 19, hp: 400, ai: "default" },
            { name: "ヒューマノイド・スライム", img: "assets/5-2.png", weak: 18, hp: 450, ai: "default" },
            { name: "リバイバルスライム", img: "assets/5-3.png", weak: 20, hp: 300, ai: "s6_p3" },
            { name: "ヒューマノイド・ドレイク", img: "assets/5-4.png", weak: 17, hp: 600, ai: "s6_p4" },
            { name: "オシリスの天空竜", img: "assets/5-5.png", weak: 20, hp: 2000, ai: "s6_boss" }
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

// カードデータベース
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

// パックデータ
const PACK_DATA = [
    { id: "vol1", name: "Vol.1 - Legend", price: 1000, desc: "伝説の始まり。基本魔法カード収録。", unlockStage: 1, img: "assets/packs/vol1.png" },
    { id: "vol2", name: "Vol.2 - Awakening", price: 1500, desc: "テクニカルな戦略カードが登場。", unlockStage: 3, img: "assets/packs/vol2.png" }
];