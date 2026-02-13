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

// =========================================
// STATE MASTER REGISTRY (v5.0)
// =========================================
// category: エンジンが計算時に参照する分類
// timing: "throw" (投擲ごとに減少) | "round" (敵ターン終了時に減少)
const STATE_MASTER = {
    "p_atk_buff":  { label: "攻撃UP", icon: "⚔️", category: "atk_mult", timing: "throw", class: "chip-p-buff" },
    "p_atk_flat":  { label: "ダメUP",   icon: "⚔️", category: "atk_add",  timing: "throw", class: "chip-p-buff" },
    "e_atk_buff":  { label: "強攻",   icon: "⚔️", category: "atk_mult", timing: "round", class: "chip-e-buff" },
    "guard_ratio": { label: "ガード",   icon: "🛡️", category: "dmg_mult",   timing: "round", class: "chip-guard" },
    "guard_fixed": { label: "アーマー", icon: "🛡️", category: "dmg_sub",    timing: "round", class: "chip-guard" },
    "barrier":     { label: "結界",     icon: "💠", category: "barrier",    timing: "round", class: "chip-barrier" },
    "charge":      { label: "溜め",     icon: "⚡", category: "charge",     timing: "round", class: "chip-charge" },
    "stun":        { label: "スタン",   icon: "😵", category: "stun",       timing: "round", class: "chip-stun" },
    "item_lock":   { label: "アイテム封印", icon: "🔒", category: "item_lock", timing: "round", class: "chip-lock" },
    "bind":        { label: "拘束",     icon: "⛓️", category: "action_lock", timing: "throw", class: "chip-stun" }
};

// =========================================
// Updated: GAME_DATA.enemies (v2.2 アトミック・スキル・システム)
// =========================================
// atk: 基礎攻撃力 (ここから±10%の乱数でダメージ計算)
// actions: スキルを構成する「効果のアトム」リスト
// visual.msg: スキル発動時の説明文。待機時間はエンジン側で自動計算するため省略。

const GAME_DATA = {
    enemies: {
        1: [
            { name: "プチモス", img: "assets/1-1.png", weak: 20, hp: 100, atk: 4, ai: [
                { weight: 10, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
            ]},
            { name: "ラーバモス", img: "assets/1-2.png", weak: 19, hp: 130, atk: 5, ai: [
                { weight: 10, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
            ]},
            { name: "進化の繭", img: "assets/1-3.png", weak: 18, hp: 260, atk: 6, ai: [
                { 
                    name: "自己再生", weight: 3, cond: { src: "e_hp", op: "lt", val: 80 },
                    visual: { cutin: { text: "自己再生", color: "heal" }, msg: "傷ついた体を修復した！" },
                    actions: [{ type: "HEAL", target: "ENEMY", val: 20, visual: { se: "se-heal" } }]
                },
                { 
                    name: "鉄壁の守り", weight: 4,
                    visual: { cutin: { text: "鉄壁の守り", color: "earth" }, msg: "硬化してダメージを半減する！" },
                    actions: [{ type: "STATE", target: "ENEMY", kind: "guard_ratio", val: 0.5, turn: 3, visual: { se: "se-buff" } }]
                },
                { weight: 4, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
            ]},
            { name: "グレート・モス", img: "assets/1-4.png", weak: 17, hp: 290, atk: 8, ai: [
                { 
                    name: "猛毒の鱗粉", weight: 3, cond: { src: "p_mp", op: "gt", val: 0 },
                    visual: { cutin: { text: "猛毒の鱗粉", color: "purple" }, msg: "毒の粉でMPを蝕む！" },
                    actions: [
                        { type: "MP_ACTION", target: "PLAYER", val: -1, visual: { se: "se-debuff" } },
                        { type: "DAMAGE", target: "PLAYER", mult: 1.0 }
                    ]
                },
                { weight: 7, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
            ]},
            { name: "究極完全態・グレート・モス", img: "assets/1-5.png", weak: 20, hp: 420, atk: 12, ai: [
                { 
                    weight: 5,
                    sequence: [
                        { 
                            name: "力を溜めている…", visual: { msg: "次の一撃に備えている…" },
                            actions: [{ type: "STATE", target: "ENEMY", kind: "charge", turn: 1, visual: { se: "se-warning" } }] 
                        },
                        { 
                            name: "森の破壊衝動", 
                            visual: { cutin: { text: "森の破壊衝動", color: "earth" }, se: "se-boom", anim: "shake-heavy", msg: "全てを破壊する一撃！" },
                            actions: [{ type: "DAMAGE", target: "PLAYER", mult: 3.0 }] 
                        }
                    ]
                },
                { weight: 5, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
            ]}
        ],
        2: [
            { name: "トラコドン", img: "assets/2-1.png", weak: 19, hp: 150, atk: 7, ai: [
                { weight: 10, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
            ]},
            { name: "ワイルド・ラプター", img: "assets/2-2.png", weak: 18, hp: 280, atk: 8, ai: [
                { 
                    name: "俊足の連撃", weight: 3,
                    visual: { cutin: { text: "俊足の連撃", color: "wind" }, msg: "目にも止まらぬ連続攻撃！" },
                    actions: [{ type: "DAMAGE", target: "PLAYER", mult: 0.7, count: 2 }]
                },
                { weight: 7, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
            ]},
            { name: "屍を貪る竜", img: "assets/2-3.png", weak: 17, hp: 310, atk: 9, ai: [
                { 
                    name: "死肉の渇望", weight: 3,
                    visual: { cutin: { text: "死肉の渇望", color: "fire" }, msg: "噛みつきHPを吸収した！" },
                    actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0, drain: true }]
                },
                { weight: 7, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
            ]},
            { name: "二頭を持つキング・レックス", img: "assets/2-4.png", weak: 20, hp: 340, atk: 10, ai: [
                { 
                    name: "狂暴化", weight: 5, guaranteed: true, cond: { src: "e_state", tag: "atk_mult", val: 0 }, 
                    visual: { cutin: { text: "狂暴化", color: "fire" }, msg: "怒りで攻撃力が倍増した！" },
                    actions: [{ type: "STATE", target: "ENEMY", kind: "atk_buff", val: 1.0, turn: 10, visual: { se: "se-buff" } }]
                },
                { weight: 5, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
            ]},
            { name: "剣竜", img: "assets/2-5.png", weak: 19, hp: 540, atk: 12, ai: [
                { 
                    name: "恐竜剣・兜割り", weight: 3,
                    visual: { cutin: { text: "恐竜剣・兜割り", color: "earth" }, se: "se-boom", anim: "shake-medium", msg: "強烈な剣撃が襲う！" },
                    actions: [{ type: "DAMAGE", target: "PLAYER", mult: 2.0 }]
                },
                { weight: 7, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
            ]}
        ],
        3: [
            { name: "デュナミス・ヴァルキリア", img: "assets/3-1.png", weak: 20, hp: 300, atk: 10, ai: [
                { 
                    name: "護封剣の加護", preemptive: true,
                    visual: { cutin: { text: "護封剣の加護", color: "gold" }, msg: "光の剣で守りを固めた！" },
                    actions: [{ type: "STATE", target: "ENEMY", kind: "guard_ratio", val: 0.5, turn: 3 }]
                },
                { weight: 10, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
            ]},
            { name: "ハーピィ・レディ", img: "assets/3-2.png", weak: 19, hp: 330, atk: 11, ai: [
                { 
                    name: "誘惑の風", weight: 3, 
                    visual: { cutin: { text: "誘惑の風", color: "wind" }, msg: "強烈な風がMPを削り、敵を癒やす！" },
                    actions: [
                        { type: "MP_ACTION", target: "PLAYER", val: -3 },
                        { type: "HEAL", target: "ENEMY", val: 50, visual: { se: "se-heal" } }
                    ]
                },
                { weight: 7, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
            ]},
            { name: "ハーピィ・レディ・SB", img: "assets/3-3.png", weak: 18, hp: 360, atk: 12, ai: [
                { 
                    name: "サイバー・ボンテージ", weight: 8, cond: { src: "p_state", tag: "action_lock", val: false },
                    visual: { cutin: { text: "サイバー・ボンテージ", color: "purple" }, msg: "鞭で拘束された！(1投制限)" },
                    actions: [
                        { type: "STATE", target: "PLAYER", kind: "bind", turn: 1 },
                        { type: "DAMAGE", target: "PLAYER", mult: 1.0 }
                    ]
                },
                { weight: 7, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
            ]},
            { name: "ハーピィ・レディ三姉妹", img: "assets/3-4.png", weak: 17, hp: 390, atk: 13, ai: [
                { 
                    name: "トライアングル・アタック", weight: 3,
                    visual: { cutin: { text: "トライアングル・アタック", color: "wind" }, msg: "三位一体の連携攻撃！" },
                    actions: [{ type: "DAMAGE", target: "PLAYER", mult: 0.6, count: 3 }]
                },
                { weight: 7, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
            ]},
            { name: "ハーピィズペット竜", img: "assets/3-5.png", weak: 20, hp: 550, atk: 15, ai: [
                { 
                    name: "愛の鞭・ブレス", guaranteed: true, cond: { src: "turn_mod", val: 4 },
                    visual: { cutin: { text: "愛の鞭・ブレス", color: "fire" }, se: "se-boom", anim: "shake-heavy", msg: "強烈なブレスでMPが消し飛んだ！" },
                    actions: [
                        { type: "MP_ACTION", target: "PLAYER", val: -99 },
                        { type: "DAMAGE", target: "PLAYER", mult: 2.0 }
                    ]
                },
                { weight: 7, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
            ]}
        ],
        4: [
            { name: "ダーク・ラビット", img: "assets/4-1.png", weak: 20, hp: 380, atk: 13, ai: [
                { 
                    name: "トゥーン・ラッシュ", weight: 3,
                    visual: { cutin: { text: "トゥーン・ラッシュ", color: "wind" }, msg: "コミカルな連続攻撃！" },
                    actions: [{ type: "DAMAGE", target: "PLAYER", mult: 0.7, count: 2 }]
                },
                { weight: 7, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
            ]},
            { name: "デビル・ボックス", img: "assets/4-2.png", weak: 19, hp: 420, atk: 14, ai: [
                { 
                    name: "死のびっくり箱", guaranteed: true, cond: { src: "turn", op: "eq", val: 5 },
                    visual: { cutin: { text: "死のびっくり箱", color: "purple" }, se: "se-boom", anim: "flash-purple", msg: "箱から死神が現れた！" },
                    actions: [{ type: "DAMAGE", target: "PLAYER", mode: "fixed", val: 999 }]
                },
                { weight: 10, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
            ]},
            { name: "トゥーン・デーモン", img: "assets/4-3.png", weak: 18, hp: 460, atk: 15, ai: [
                { 
                    name: "呪いの視線", weight: 4,
                    visual: { cutin: { text: "呪いの視線", color: "purple" }, msg: "邪悪な視線でMPを削られた！" },
                    actions: [
                        { type: "MP_ACTION", target: "PLAYER", val: -2 },
                        { type: "DAMAGE", target: "PLAYER", mult: 1.0 }
                    ]
                },
                { weight: 6, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
            ]},
            { name: "ブルーアイズ・トゥーン・ドラゴン", img: "assets/4-4.png", weak: 17, hp: 500, atk: 18, ai: [
                { 
                    name: "トゥーン・スキン", preemptive: true,
                    visual: { cutin: { text: "トゥーン・スキン", color: "blue" }, msg: "ダメージを軽減する皮膚！" },
                    actions: [{ type: "STATE", target: "ENEMY", kind: "guard_fixed", val: 10, turn: 5 }]
                },
                { weight: 5, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
            ]},
            { name: "サクリファイス", img: "assets/4-5.png", weak: 20, hp: 550, atk: 16, ai: [
                { 
                    name: "幻想の儀式", weight: 3, cond: { src: "turn_mod", val: 3 },
                    visual: { cutin: { text: "幻想の儀式", color: "purple" }, msg: "幻想の力で体力を吸収された！" },
                    actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.2, drain: true }]
                },
                { weight: 7, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
            ]},
            { name: "サウザンド・アイズ・サクリファイス", img: "assets/4-6.png", weak: 20, hp: 800, atk: 20, ai: [
                { 
                    name: "結界", preemptive: true,
                    visual: { cutin: { text: "結界", color: "gold" }, msg: "邪教の力でバリアを展開した！" },
                    actions: [{ type: "STATE", target: "ENEMY", kind: "barrier", val: 10, turn: 999 }]
                },
                { 
                    name: "千眼の邪教神", guaranteed: true, cond: { src: "turn_mod", val: 4 },
                    visual: { cutin: { text: "千眼の邪教神", color: "purple" }, se: "se-boom", msg: "全てを見通す邪眼で吸収！" },
                    actions: [{ type: "DAMAGE", target: "PLAYER", mult: 2.0, drain: true }]
                },
                { weight: 5, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
            ]}
        ],
        5: [
            { name: "真紅眼の黒竜", img: "assets/extra.png", weak: 20, hp: 1500, atk: 25, ai: [
                { 
                    name: "黒 炎 弾", guaranteed: true, cond: { src: "turn_mod", val: 5 },
                    visual: { cutin: { text: "黒 炎 弾", color: "fire" }, se: "se-boom", anim: "flash-fire", wait: 2500, msg: "焼き尽くす黒い炎！" },
                    actions: [
                        { type: "MP_ACTION", target: "PLAYER", val: -5 },
                        { type: "DAMAGE", target: "PLAYER", mode: "fixed", val: 50 }
                    ]
                },
                { weight: 8, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
            ]}
        ],
        6: [
            { name: "ワームドレイク", img: "assets/5-1.png", weak: 19, hp: 400, atk: 20, ai: [{ weight: 1, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }] },
            { name: "ヒューマノイド・スライム", img: "assets/5-2.png", weak: 18, hp: 450, atk: 22, ai: [{ weight: 1, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }] },
            { name: "リバイバルスライム", img: "assets/5-3.png", weak: 20, hp: 300, atk: 18, ai: [
                { 
                    name: "再 生", weight: 3,
                    visual: { cutin: { text: "再 生", color: "blue" }, msg: "驚異的な速度で再生した！" },
                    actions: [{ type: "HEAL", target: "ENEMY", val: 999 }]
                },
                { weight: 7, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
            ]},
            { name: "ヒューマノイド・ドレイク", img: "assets/5-4.png", weak: 17, hp: 600, atk: 25, ai: [
                { 
                    name: "スライムの粘着", weight: 3, cond: { src: "p_state", tag: "item_lock", val: 0 },
                    visual: { cutin: { text: "スライムの粘着", color: "green" }, msg: "アイテムの使用を封じられた！" },
                    actions: [
                        { type: "STATE", target: "PLAYER", kind: "item_lock", turn: 2 },
                        { type: "DAMAGE", target: "PLAYER", mult: 1.0 }
                    ]
                },
                { weight: 7, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
            ]},
            { name: "オシリスの天空竜", img: "assets/5-5.png", weak: 20, hp: 2000, atk: 35, ai: [
                { 
                    name: "召雷弾", preemptive: true,
                    visual: { cutin: { text: "召雷弾", color: "gold" }, msg: "神の弾丸で迎撃体勢！" },
                    actions: [{ type: "STATE", target: "ENEMY", kind: "barrier", val: 15, turn: 999 }]
                },
                { 
                    name: "サンダー・フォース", guaranteed: true, cond: { src: "turn_mod", val: 5 },
                    visual: { cutin: { text: "サンダー・フォース", color: "gold" }, se: "se-boom", anim: "flash-gold", wait: 3000, msg: "神の雷が地上を滅ぼす！" },
                    actions: [{ type: "DAMAGE", target: "PLAYER", mode: "fixed", val: 80 }]
                },
                { weight: 8, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
            ]}
        ],
    },

     // Background IDs (String Key)
    bg: {
        "010": "assets/bg_stage1.png",
        "020": "assets/bg_stage2.png",
        "030": "assets/bg_stage3.png",
        "041": "assets/bg_stage4_1.png",
        "042": "assets/bg_stage4_2.png",
        "050": "assets/bg_extra.png",
        "060": "assets/bg_stage5_1.png"
    }
};

// =========================================
// Updated: CARD_DB (v3.0 アトミック規格)
// =========================================
// effects を actions に統合し、敵スキルと同じアトム構造を採用。
// target: "PLAYER" | "ENEMY" で対象を明示。
// 罠(TRAP)も、発動時の効果(actions)をアトミック化しています。

const CARD_DB = [
    { 
        id: 101, name: "死者蘇生", rarity: "UR", type: "MAGIC", cost: 8, desc: "HPを最大値まで完全回復", 
        visual: { se: "se-heal" },
        actions: [{ type: "HEAL", target: "PLAYER", val: 9999 }], 
        packs: ["vol1"] 
    },
    { 
        id: 102, name: "サンダー・ボルト", rarity: "SR", type: "MAGIC", cost: 6, desc: "100ダメ＋スタン(1T行動不能)", 
        visual: { se: "se-boom" },
        actions: [
            { type: "DAMAGE", target: "ENEMY", mode: "fixed", val: 100 }, 
            { type: "STATE", target: "ENEMY", kind: "stun", turn: 1 }
        ], 
        packs: ["vol1"] 
    },
    { 
        id: 103, name: "強欲な壺", rarity: "SR", type: "MAGIC", cost: 2, desc: "カードを2枚引く", 
        visual: { se: "se-heal" },
        actions: [{ type: "DRAW", val: 2 }], 
        packs: ["vol1"] 
    },
    { 
        id: 104, name: "光の護封剣", rarity: "R", type: "MAGIC", cost: 5, desc: "3ターンの間、被ダメージ半減", 
        visual: { se: "se-buff", msg: "3ターン防御(被ダメ半減)！" },
        actions: [{ type: "STATE", target: "PLAYER", kind: "guard_ratio", val: 0.5, turn: 3 }], 
        packs: ["vol1"] 
    },
    { 
        id: 105, name: "落とし穴", rarity: "R", type: "TRAP", cost: 3, desc: "敵出現時、50ダメ＋1Tスタン", 
        visual: { se: "se-hit" },
        trap: { 
            trigger: "summon", 
            actions: [
                { type: "DAMAGE", target: "ENEMY", mode: "fixed", val: 50 }, 
                { type: "STATE", target: "ENEMY", kind: "stun", turn: 1 }
            ] 
        }, 
        packs: ["vol1"] 
    },
    { 
        id: 106, name: "聖なるバリア", rarity: "R", type: "TRAP", cost: 4, desc: "攻撃無効化＋50ダメ", 
        visual: { se: "se-boom" },
        trap: { 
            trigger: "attack", 
            actions: [
                { type: "NEGATE" }, 
                { type: "DAMAGE", target: "ENEMY", mode: "fixed", val: 50 }
            ] 
        }, 
        packs: ["vol1"] 
    },
    { 
        id: 107, name: "火の粉", rarity: "N", type: "MAGIC", cost: 1, desc: "敵に30ダメージ", 
        visual: { se: "se-attack" },
        actions: [{ type: "DAMAGE", target: "ENEMY", mode: "fixed", val: 30 }], 
        packs: ["vol1"] 
    },
    { 
        id: 108, name: "治療の神", rarity: "N", type: "MAGIC", cost: 4, desc: "HPを50回復", 
        visual: { se: "se-heal" },
        actions: [{ type: "HEAL", target: "PLAYER", val: 50 }], 
        packs: ["vol1"] 
    },
    { 
        id: 109, name: "はさみ撃ち", rarity: "N", type: "TRAP", cost: 2, desc: "被弾時に敵に80ダメージ", 
        visual: { se: "se-attack" },
        trap: { 
            trigger: "attack", 
            actions: [{ type: "DAMAGE", target: "ENEMY", mode: "fixed", val: 80 }] 
        }, 
        packs: ["vol1"] 
    },
    { 
        id: 110, name: "昼夜の大火事", rarity: "N", type: "MAGIC", cost: 3, desc: "敵に80ダメージ", 
        visual: { se: "se-attack" },
        actions: [{ type: "DAMAGE", target: "ENEMY", mode: "fixed", val: 80 }], 
        packs: ["vol1"] 
    },
    { 
        id: 111, name: "突進", rarity: "N", type: "MAGIC", cost: 2, desc: "攻撃力2倍(次の1投のみ)", 
        visual: { se: "se-buff", msg: "攻撃力2倍(次の一撃)！" },
        actions: [{ type: "STATE", target: "PLAYER", kind: "atk_buff", val: 1.0, turn: 1 }], 
        packs: ["vol1"] 
    },
    { 
        id: 112, name: "天使の施し", rarity: "UR", type: "MAGIC", cost: 2, desc: "手札を1枚選んで捨て、3枚引く", 
        visual: { se: "se-heal" },
        actions: [
            { type: "DISCARD_SELECT", count: 1 }, 
            { type: "DRAW", val: 3 }
        ], 
        packs: ["vol2"] 
    },
    { 
        id: 113, name: "ブラック・ホール", rarity: "SR", type: "MAGIC", cost: 7, desc: "手札全捨て＋150ダメ", 
        visual: { se: "se-boom" },
        actions: [
            { type: "DAMAGE", target: "ENEMY", mode: "fixed", val: 150 }, 
            { type: "DISCARD_ALL" }
        ], 
        packs: ["vol2"] 
    },
    { 
        id: 114, name: "魔法の筒", rarity: "SR", type: "TRAP", cost: 4, desc: "攻撃無効＋そのダメを反射", 
        visual: { se: "se-boom" },
        trap: { 
            trigger: "attack", 
            actions: [
                { type: "NEGATE" }, 
                { type: "REFLECT", mult: 1.0 }
            ] 
        }, 
        packs: ["vol2"] 
    },
    { 
        id: 115, name: "巨大化", rarity: "R", type: "MAGIC", cost: 3, desc: "HP半分以下なら3倍、半分以上なら0.5倍", 
        visual: { se: "se-buff" },
        actions: [
            { 
                cond: { src: "p_hp", op: "lte", val: 50 }, 
                type: "STATE", target: "PLAYER", kind: "atk_buff", val: 2.0, turn: 1, 
                visual: { msg: "HP劣勢…逆転の3倍パワー！" } 
            },
            { 
                cond: { src: "p_hp", op: "gt", val: 50 }, 
                type: "STATE", target: "PLAYER", kind: "atk_buff", val: -0.5, turn: 1, 
                visual: { msg: "HP優勢…油断の0.5倍パワー…" } 
            }
        ], 
        packs: ["vol2"] 
    },
    { 
        id: 116, name: "地割れ", rarity: "R", type: "MAGIC", cost: 3, desc: "40ダメ＋敵の防御を破壊", 
        visual: { se: "se-attack" },
        actions: [
            { type: "DAMAGE", target: "ENEMY", mode: "fixed", val: 40 }, 
            { type: "STATE", target: "ENEMY", kind: "break_guard", visual: { msg: "敵の防御を破壊！" } }
        ], 
        packs: ["vol2"] 
    },
    { 
        id: 117, name: "六芒星の呪縛", rarity: "R", type: "TRAP", cost: 3, desc: "敵攻撃半減＋1Tスタン", 
        visual: { se: "se-buff" },
        trap: { 
            trigger: "attack", 
            actions: [
                { type: "STATE", target: "ENEMY", kind: "stun", turn: 1 }, 
                { type: "DAMAGE_MULT", val: 0.5 }
            ] 
        }, 
        packs: ["vol2"] 
    },
    { 
        id: 118, name: "守備封じ", rarity: "N", type: "MAGIC", cost: 1, desc: "敵の防御状態を解除", 
        visual: { se: "se-tap" },
        actions: [{ type: "STATE", target: "ENEMY", kind: "break_guard", visual: { msg: "敵の防御を解除した！" } }], 
        packs: ["vol2"] 
    },
    { 
        id: 119, name: "火あぶりの刑", rarity: "N", type: "MAGIC", cost: 2, desc: "敵に60ダメージ", 
        visual: { se: "se-attack" },
        actions: [{ type: "DAMAGE", target: "ENEMY", mode: "fixed", val: 60 }], 
        packs: ["vol2"] 
    },
    { 
        id: 120, name: "援軍", rarity: "N", type: "MAGIC", cost: 2, desc: "HP30回復＋次の一撃+20", 
        visual: { se: "se-heal" },
        actions: [
            { type: "HEAL", target: "PLAYER", val: 30 }, 
            { type: "STATE", target: "PLAYER", kind: "atk_flat", val: 20, turn: 1 }
        ], 
        packs: ["vol2"] 
    },
    { 
        id: 121, name: "闇の仮面", rarity: "N", type: "MAGIC", cost: 4, desc: "墓地の魔法カードを回収", 
        visual: { se: "se-tap" },
        actions: [{ type: "SPECIAL_SALVAGE" }], 
        packs: ["vol2"] 
    },
    { 
        id: 122, name: "最終戦争", rarity: "N", type: "MAGIC", cost: 5, desc: "自傷50＋敵に150ダメージ", 
        visual: { se: "se-boom" },
        actions: [
            { type: "DAMAGE", target: "ENEMY", mode: "fixed", val: 150 }, 
            { type: "DAMAGE", target: "PLAYER", mode: "fixed", val: 50 }
        ], 
        packs: ["vol2"] 
    }
];

// Pack Data
const PACK_DATA = [
    { id: "vol1", name: "Vol.1 - Legend", price: 1000, desc: "伝説の始まり。基本魔法カード収録。", unlockStage: 1, img: "assets/packs/vol1.png" },
    { id: "vol2", name: "Vol.2 - Awakening", price: 1500, desc: "テクニカルな戦略カードが登場。", unlockStage: 3, img: "assets/packs/vol2.png" }
];

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
    1: { title: "旅立ちの森", sub: "Forest of Beginnings", displayName: "STAGE 1",
         floors: 5, img: "assets/bg_stage1.png",
         multiplier: 1.0, warning: false, thresholds: { SSS: 12, S: 16, A: 22, B: 30 } },
    2: { title: "荒れ狂う荒野", sub: "Raging Wasteland", displayName: "STAGE 2",
         floors: 5, img: "assets/bg_stage2.png",
         multiplier: 1.5, warning: false, thresholds: { SSS: 12, S: 16, A: 22, B: 30 } },
    3: { title: "誘惑の迷宮", sub: "Labyrinth of Temptation", displayName: "STAGE 3",
         floors: 5, img: "assets/bg_stage3.png",
         multiplier: 2.0, warning: false, thresholds: { SSS: 12, S: 16, A: 22, B: 30 } },
    4: { title: "幻想の狂宴", sub: "Toon Nightmare", displayName: "STAGE 4",
         floors: 6, bossFloor: 5, img: { default: "assets/bg_stage4_1.png", boss: "assets/bg_stage4_2.png" },
         multiplier: 3.0, warning: true, thresholds: { SSS: 25, S: 35, A: 50, B: 70 } },
    5: { title: "燃えたぎる火口", sub: "Burning Crater", displayName: "EXTRA",
         floors: 1, img: "assets/bg_extra.png",
         multiplier: 5.0, warning: true, thresholds: { SSS: 25, S: 35, A: 50, B: 70 } },
    6: { title: "神の試練", sub: "God's Testing Ground", displayName: "STAGE 5",
         floors: 5, img: { default: "assets/bg_stage5_1.png", boss: "assets/bg_stage5_2.png" },
         multiplier: 5.0, warning: true, thresholds: { SSS: 25, S: 35, A: 50, B: 70 } }
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

// =========================================
// TIMING CONSTANTS (演出タイミング定数)
// =========================================
const TIMING = {
    // スキル・カットイン演出
    CUTIN_DISPLAY: 1200,           // スキルカットイン表示時間
    CUTIN_DURATION: 1500,          // カットイン全体の表示時間
    SKILL_AFTERGLOW: 800,          // スキル後の余韻（名前なし）
    SKILL_AFTERGLOW_NAMED: 1200,   // スキル後の余韻（名前あり）
    CARD_AFTERGLOW: 500,           // カード使用後の余韻

    // アクション間隔
    ACTION_GAP: 300,               // アクション間の標準間隔
    CARD_ACTION_GAP: 100,          // カード効果間の短い間隔
    MULTI_HIT_GAP: 400,            // 複数回攻撃の間隔

    // 戦闘遷移
    WIN_DELAY_SHORT: 500,          // 勝利演出までの待機（短）
    WIN_DELAY: 800,                // 勝利演出までの待機（標準）
    WIN_DELAY_LONG: 1000,          // 勝利演出までの待機（長）
    TURN_END_DELAY: 1000,          // ターン終了処理の待機
    ENEMY_TURN_DELAY: 500,         // 敵ターン開始までの待機
    JUST_FINISH_DIALOG: 800,       // JUST FINISHダイアログ表示前の待機
    DROP_CHECK_DELAY: 800,         // ドロップチェックまでの待機

    // エンカウンター演出
    ENCOUNTER_WAIT: 1000,          // エンカウンター演出後の待機
    ENCOUNTER_WAIT_LONG: 1200,     // エンカウンター演出後の待機（長）
    PREEMPTIVE_DELAY: 1200,        // 先制スキル前の待機
    PREEMPTIVE_AFTER: 1500,        // 先制スキル後の待機
    NO_PREEMPTIVE_DELAY: 500,      // 先制なし時の待機
    TRAP_DELAY: 1000,              // トラップ後の待機
    DRAIN_DELAY: 400,              // ドレイン前の待機

    // ステージ遷移
    BATTLE_TRANSITION: 2500,       // 戦闘遷移時の待機（通常）
    BATTLE_TRANSITION_WARNING: 4000, // 戦闘遷移時の待機（警告ステージ）
    FADE_OUT: 1000,                // フェードアウト時間
    SPAWN_DELAY_FIRST: 1500,       // 敵出現待機（1F）
    SPAWN_DELAY: 500,              // 敵出現待機（通常）

    // MP演出
    MP_CHARGE_GLOW: 150,           // MP回復1つあたりの発光時間
    MP_CHARGE_STEP: 100,           // MP回復1つあたりの間隔
    MP_LOSS_FLASH: 150,            // MP減少時の閃光時間
    MP_LOSS_STEP: 100,             // MP減少時の間隔

    // カード・アイテム
    CARD_DRAW_INTERVAL: 250,       // カードドロー間隔
    CARD_DRAW_PREP: 200,           // 通常ドロー前の待機
    TRAP_SET_DELAY: 500,           // トラップセット時の待機
    CHEST_AUTO_OPEN: 1500,         // 宝箱自動開封までの時間

    // UI演出
    FLOAT_TEXT_DURATION: 1500,     // フローティングテキスト表示時間
    DAMAGE_POP_DURATION: 1200,     // ダメージ表示の消失時間
    ANNOUNCER_DURATION: 2000,      // アナウンス表示時間
    SHAKE_DURATION: 500,           // シェイクアニメーション継続時間
    FLASH_DURATION: 300            // フラッシュエフェクト継続時間
};