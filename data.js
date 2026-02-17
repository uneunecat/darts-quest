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
    "p_atk_buff": { label: "攻撃UP", icon: "⚔️", category: "atk_mult", timing: "throw", class: "chip-p-buff" },
    "p_atk_flat": { label: "ダメUP", icon: "⚔️", category: "atk_add", timing: "throw", class: "chip-p-buff" },
    "e_atk_buff": { label: "強攻", icon: "⚔️", category: "atk_mult", timing: "round", class: "chip-e-buff" },
    "guard_ratio": { label: "ガード", icon: "🛡️", category: "dmg_mult", timing: "round", class: "chip-guard" },
    "guard_fixed": { label: "アーマー", icon: "🛡️", category: "dmg_sub", timing: "round", class: "chip-guard" },
    "barrier": { label: "結界", icon: "💠", category: "barrier", timing: "round", class: "chip-barrier" },
    "charge": { label: "溜め", icon: "⚡", category: "charge", timing: "round", class: "chip-charge" },
    "stun": { label: "スタン", icon: "😵", category: "stun", timing: "round", class: "chip-stun" },
    "item_lock": { label: "カード封印", icon: "🔒", category: "item_lock", timing: "round", class: "chip-lock" },
    "bind": { label: "拘束", icon: "⛓️", category: "action_lock", timing: "throw", class: "chip-stun" }
};

// =========================================
// WORLD MAP DATA (v1.0 - Area/Stage Integration)
// =========================================
// 旧 GAME_DATA.enemies と STAGE_MASTER を統合
// Area > Stage > Floor の階層構造を実現

const WORLD_MAP = {
    "AREA_1": {
        id: "AREA_1",
        name: "古の森と迷宮",
        sub: "Ancient Forest & Labyrinth",
        stages: [
            {
                id: "1-1",
                title: "旅立ちの森",
                sub: "Forest of Beginnings",
                bg: "assets/bg_stage1.png",
                multiplier: 1.0,
                type: "NORMAL",
                rankThresholds: { SSS: 12, S: 16, A: 22, B: 30 },
                floors: [
                    // Floor 1
                    { name: "プチモス", img: "assets/1-1.png", weak: 20, hp: 100, atk: 4, ai: [{ weight: 10, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }] },
                    // Floor 2
                    { name: "ラーバモス", img: "assets/1-2.png", weak: 19, hp: 130, atk: 5, ai: [{ weight: 10, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }] },
                    // Floor 3
                    {
                        name: "進化の繭", img: "assets/1-3.png", weak: 18, hp: 260, atk: 6, ai: [
                            { name: "自己再生", weight: 3, cond: { src: "e_hp", op: "lt", val: 80 }, visual: { cutin: { text: "自己再生", color: "heal" }, msg: "傷ついた体を修復した！" }, actions: [{ type: "HEAL", target: "ENEMY", val: 20, visual: { se: "se-heal" } }] },
                            { name: "鉄壁の守り", weight: 4, visual: { cutin: { text: "鉄壁の守り", color: "earth" }, msg: "硬化してダメージを半減する！" }, actions: [{ type: "STATE", target: "ENEMY", kind: "guard_ratio", val: 0.5, turn: 3, visual: { se: "se-buff" } }] },
                            { weight: 4, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
                        ]
                    },
                    // Floor 4
                    {
                        name: "グレート・モス", img: "assets/1-4.png", weak: 17, hp: 290, atk: 8, ai: [
                            { name: "猛毒の鱗粉", weight: 3, cond: { src: "p_mp", op: "gt", val: 0 }, visual: { cutin: { text: "猛毒の鱗粉", color: "purple" }, msg: "毒の粉でMPを蝕む！" }, actions: [{ type: "MP_ACTION", target: "PLAYER", val: -1, visual: { se: "se-debuff" } }, { type: "DAMAGE", target: "PLAYER", mult: 1.0 }] },
                            { weight: 7, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
                        ]
                    },
                    // Floor 5 (BOSS)
                    {
                        name: "究極完全態・グレート・モス", img: "assets/1-5.png", weak: 20, hp: 420, atk: 12, ai: [
                            {
                                weight: 5, sequence: [
                                    { name: "力を溜めている…", visual: { msg: "次の一撃に備えている…" }, actions: [{ type: "STATE", target: "ENEMY", kind: "charge", turn: 1, visual: { se: "se-warning" } }] },
                                    { name: "森の破壊衝動", visual: { cutin: { text: "森の破壊衝動", color: "earth" }, se: "se-boom", anim: "shake-heavy", msg: "全てを破壊する一撃！" }, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 3.0 }] }
                                ]
                            },
                            { weight: 5, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
                        ]
                    }
                ]
            },
            {
                id: "1-2",
                title: "荒れ狂う荒野",
                sub: "Raging Wasteland",
                bg: "assets/bg_stage2.png",
                multiplier: 1.5,
                type: "NORMAL",
                rankThresholds: { SSS: 12, S: 16, A: 22, B: 30 },
                floors: [
                    { name: "トラコドン", img: "assets/2-1.png", weak: 19, hp: 150, atk: 7, ai: [{ weight: 10, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }] },
                    {
                        name: "ワイルド・ラプター", img: "assets/2-2.png", weak: 18, hp: 280, atk: 8, ai: [
                            { name: "俊足の連撃", weight: 3, visual: { cutin: { text: "俊足の連撃", color: "wind" }, msg: "目にも止まらぬ連続攻撃！" }, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 0.7, count: 2 }] },
                            { weight: 7, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
                        ]
                    },
                    {
                        name: "屍を貪る竜", img: "assets/2-3.png", weak: 17, hp: 310, atk: 9, ai: [
                            { name: "死肉の渇望", weight: 3, visual: { cutin: { text: "死肉の渇望", color: "fire" }, msg: "噛みつきHPを吸収した！" }, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0, drain: true }] },
                            { weight: 7, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
                        ]
                    },
                    {
                        name: "二頭を持つキング・レックス", img: "assets/2-4.png", weak: 20, hp: 340, atk: 10, ai: [
                            { name: "狂暴化", weight: 5, cond: { src: "e_state", tag: "atk_mult", val: 0 }, visual: { cutin: { text: "狂暴化", color: "fire" }, msg: "怒りで攻撃力が倍増した！" }, actions: [{ type: "STATE", target: "ENEMY", kind: "e_atk_buff", val: 1.0, turn: 10, visual: { se: "se-buff" } }] },
                            { weight: 5, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
                        ]
                    },
                    {
                        name: "剣竜", img: "assets/2-5.png", weak: 19, hp: 540, atk: 12, ai: [
                            { name: "恐竜剣・兜割り", weight: 3, visual: { cutin: { text: "恐竜剣・兜割り", color: "earth" }, se: "se-boom", anim: "shake-medium", msg: "強烈な剣撃が襲う！" }, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 2.0 }] },
                            { weight: 7, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
                        ]
                    }
                ]
            },
            {
                id: "1-3",
                title: "誘惑の迷宮",
                sub: "Labyrinth of Temptation",
                bg: "assets/bg_stage3.png",
                multiplier: 2.0,
                type: "NORMAL",
                rankThresholds: { SSS: 12, S: 16, A: 22, B: 30 },
                floors: [
                    {
                        name: "デュナミス・ヴァルキリア", img: "assets/3-1.png", weak: 20, hp: 300, atk: 10, ai: [
                            { name: "護封剣の加護", preemptive: true, visual: { cutin: { text: "護封剣の加護", color: "gold" }, msg: "光の剣で守りを固めた！" }, actions: [{ type: "STATE", target: "ENEMY", kind: "guard_ratio", val: 0.5, turn: 3 }] },
                            { weight: 10, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
                        ]
                    },
                    {
                        name: "ハーピィ・レディ", img: "assets/3-2.png", weak: 19, hp: 330, atk: 11, ai: [
                            { name: "誘惑の風", weight: 3, cond: { src: "p_mp", op: "gt", val: 0 }, visual: { cutin: { text: "誘惑の風", color: "wind" }, msg: "MPを奪い、自らを癒やした！" }, actions: [{ type: "MP_ACTION", target: "PLAYER", val: -1, drain: true }, { type: "HEAL", target: "ENEMY", val: 20, visual: { se: "se-heal" } }] },
                            { weight: 7, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
                        ]
                    },
                    {
                        name: "ハーピィ・レディ・SB", img: "assets/3-3.png", weak: 18, hp: 360, atk: 12, ai: [
                            { name: "サイバー・ボンテージ", weight: 8, cond: { src: "p_state", tag: "action_lock", val: false }, visual: { cutin: { text: "サイバー・ボンテージ", color: "purple" }, msg: "鞭で拘束された！(1投制限)" }, actions: [{ type: "STATE", target: "PLAYER", kind: "bind", turn: 1 }, { type: "DAMAGE", target: "PLAYER", mult: 1.0 }] },
                            { weight: 7, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
                        ]
                    },
                    {
                        name: "ハーピィ・レディ三姉妹", img: "assets/3-4.png", weak: 17, hp: 390, atk: 13, ai: [
                            { name: "トライアングル・アタック", weight: 3, visual: { cutin: { text: "トライアングル・アタック", color: "wind" }, msg: "三位一体の連携攻撃！" }, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 0.6, count: 3 }] },
                            { weight: 7, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
                        ]
                    },
                    {
                        name: "ハーピィズペット竜", img: "assets/3-5.png", weak: 20, hp: 550, atk: 15, ai: [
                            { name: "愛の鞭・ブレス", guaranteed: true, cond: { src: "turn_mod", val: 4 }, visual: { cutin: { text: "愛の鞭・ブレス", color: "fire" }, se: "se-boom", anim: "shake-heavy", msg: "強烈なブレスでMPが消し飛んだ！" }, actions: [{ type: "MP_ACTION", target: "PLAYER", val: -99 }, { type: "DAMAGE", target: "PLAYER", mult: 2.0 }] },
                            { weight: 7, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
                        ]
                    }
                ]
            },
            {
                id: "1-EX",
                title: "燃えたぎる火口",
                sub: "Burning Crater",
                bg: "assets/bg_extra.png",
                multiplier: 5.0,
                type: "EXTRA",
                warning: true,
                rankThresholds: { SSS: 25, S: 35, A: 50, B: 70 },
                floors: [
                    {
                        name: "真紅眼の黒竜", img: "assets/extra.png", weak: 20, hp: 1500, atk: 25, ai: [
                            { name: "黒 炎 弾", guaranteed: true, cond: { src: "turn_mod", val: 5 }, visual: { cutin: { text: "黒 炎 弾", color: "fire" }, se: "se-boom", anim: "flash-fire", wait: 2500, msg: "焼き尽くす黒い炎！" }, actions: [{ type: "MP_ACTION", target: "PLAYER", val: -5 }, { type: "DAMAGE", target: "PLAYER", mode: "fixed", val: 50 }] },
                            { weight: 8, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
                        ]
                    }
                ]
            }
        ]
    },
    "AREA_2": {
        id: "AREA_2",
        name: "幻想と神の領域",
        sub: "Realm of Illusions & Gods",
        stages: [
            {
                id: "2-1",
                title: "幻想の狂宴",
                sub: "Toon Nightmare",
                bg: "assets/bg_stage4_1.png",
                bossBg: "assets/bg_stage4_2.png", // ボス戦で背景切り替え
                bossFloor: 5, // 5階層目からボスBGM/背景
                multiplier: 3.0,
                type: "NORMAL",
                warning: true,
                rankThresholds: { SSS: 25, S: 35, A: 50, B: 70 },
                floors: [
                    { name: "ダーク・ラビット", img: "assets/4-1.png", weak: 20, hp: 380, atk: 13, ai: [{ name: "トゥーン・ラッシュ", weight: 3, visual: { cutin: { text: "トゥーン・ラッシュ", color: "wind" }, msg: "コミカルな連続攻撃！" }, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 0.7, count: 2 }] }, { weight: 7, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }] },
                    { name: "デビル・ボックス", img: "assets/4-2.png", weak: 19, hp: 420, atk: 14, ai: [{ name: "死のびっくり箱", guaranteed: true, cond: { src: "turn", op: "eq", val: 5 }, visual: { cutin: { text: "死のびっくり箱", color: "purple" }, se: "se-boom", anim: "flash-purple", msg: "箱から死神が現れた！" }, actions: [{ type: "DAMAGE", target: "PLAYER", mode: "fixed", val: 999 }] }, { weight: 10, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }] },
                    { name: "トゥーン・デーモン", img: "assets/4-3.png", weak: 18, hp: 460, atk: 15, ai: [{ name: "呪いの視線", weight: 4, visual: { cutin: { text: "呪いの視線", color: "purple" }, msg: "邪悪な視線でMPを削られた！" }, actions: [{ type: "MP_ACTION", target: "PLAYER", val: -2 }, { type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }, { weight: 6, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }] },
                    { name: "ブルーアイズ・トゥーン・ドラゴン", img: "assets/4-4.png", weak: 17, hp: 500, atk: 18, ai: [{ name: "トゥーン・スキン", preemptive: true, visual: { cutin: { text: "トゥーン・スキン", color: "blue" }, msg: "ダメージを軽減する皮膚！" }, actions: [{ type: "STATE", target: "ENEMY", kind: "guard_fixed", val: 10, turn: 5 }] }, { weight: 5, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }] },
                    { name: "サクリファイス", img: "assets/4-5.png", weak: 20, hp: 550, atk: 16, ai: [{ name: "幻想の儀式", weight: 3, cond: { src: "turn_mod", val: 3 }, visual: { cutin: { text: "幻想の儀式", color: "purple" }, msg: "幻想の力で体力を吸収された！" }, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.2, drain: true }] }, { weight: 7, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }] },
                    { name: "サウザンド・アイズ・サクリファイス", img: "assets/4-6.png", weak: 20, hp: 800, atk: 20, ai: [{ name: "結界", preemptive: true, visual: { cutin: { text: "結界", color: "gold" }, msg: "邪教の力でバリアを展開した！" }, actions: [{ type: "STATE", target: "ENEMY", kind: "barrier", val: 10, turn: 999 }] }, { name: "千眼の邪教神", guaranteed: true, cond: { src: "turn_mod", val: 4 }, visual: { cutin: { text: "千眼の邪教神", color: "purple" }, se: "se-boom", msg: "全てを見通す邪眼で吸収！" }, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 2.0, drain: true }] }, { weight: 5, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }] }
                ]
            },
            {
                id: "2-2",
                title: "神の試練",
                sub: "God's Testing Ground",
                bg: "assets/bg_stage5_1.png",
                bossBg: "assets/bg_stage5_2.png",
                multiplier: 4.0,
                type: "NORMAL",
                warning: true,
                rankThresholds: { SSS: 25, S: 35, A: 50, B: 70 },
                floors: [
                    { name: "ワームドレイク", img: "assets/5-1.png", weak: 19, hp: 400, atk: 20, ai: [{ weight: 1, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }] },
                    { name: "ヒューマノイド・スライム", img: "assets/5-2.png", weak: 18, hp: 450, atk: 22, ai: [{ weight: 1, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }] },
                    { name: "リバイバルスライム", img: "assets/5-3.png", weak: 20, hp: 300, atk: 18, ai: [{ name: "再 生", weight: 3, visual: { cutin: { text: "再 生", color: "blue" }, msg: "驚異的な速度で再生した！" }, actions: [{ type: "HEAL", target: "ENEMY", val: 999 }] }, { weight: 7, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }] },
                    { name: "ヒューマノイド・ドレイク", img: "assets/5-4.png", weak: 17, hp: 600, atk: 25, ai: [{ name: "スライムの粘着", weight: 3, cond: { src: "p_state", tag: "item_lock", val: 0 }, visual: { cutin: { text: "スライムの粘着", color: "green" }, msg: "アイテムの使用を封じられた！" }, actions: [{ type: "STATE", target: "PLAYER", kind: "item_lock", turn: 1 }, { type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }, { weight: 7, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }] },
                    { name: "オシリスの天空竜", img: "assets/5-5.png", weak: 20, hp: 2000, atk: 35, ai: [{ name: "召雷弾", preemptive: true, visual: { cutin: { text: "召雷弾", color: "gold" }, msg: "神の弾丸で迎撃体勢！" }, actions: [{ type: "STATE", target: "ENEMY", kind: "barrier", val: 15, turn: 999 }] }, { name: "サンダー・フォース", guaranteed: true, cond: { src: "turn_mod", val: 5 }, visual: { cutin: { text: "サンダー・フォース", color: "gold" }, se: "se-boom", anim: "flash-gold", wait: 3000, msg: "神の雷が地上を滅ぼす！" }, actions: [{ type: "DAMAGE", target: "PLAYER", mode: "fixed", val: 80 }] }, { weight: 8, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }] }
                ]
            },
            {
                id: "2-3",
                title: "誇り高き決闘者の領域",
                sub: "Realm of the Proud Duelist",
                bg: "assets/bg_stage_kaiba.png",
                bossBg: "assets/bg_stage_kaiba_god.png",
                bossFloor: 5,
                multiplier: 5.0,
                type: "NORMAL",
                warning: true,
                rankThresholds: { SSS: 25, S: 35, A: 50, B: 70 },
                floors: [
                    {
                        name: "ミノタウルス", img: "assets/2-3-1.png", weak: 20, hp: 600, atk: 15, ai: [
                            { name: "斧の連撃", weight: 4, visual: { cutin: { text: "斧の連撃", color: "earth" }, msg: "巨大な斧が何度も襲いかかる！" }, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 0.6, count: 3 }] },
                            { weight: 6, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
                        ]
                    },
                    {
                        name: "闇・道化師のサギー", img: "assets/2-3-2.png", weak: 19, hp: 550, atk: 12, ai: [
                            { name: "死のデッキ破壊ウイルス", weight: 5, visual: { cutin: { text: "死のデッキ破壊ウイルス", color: "purple" }, msg: "ウイルスがカードを腐敗させる！" }, actions: [{ type: "DISCARD_SELECT", count: 1 }, { type: "DAMAGE", target: "PLAYER", mult: 0.5 }] },
                            { weight: 5, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
                        ]
                    },
                    {
                        name: "ブラッド・ヴォルス", img: "assets/2-3-3.png", weak: 18, hp: 750, atk: 18, ai: [
                            { name: "狂暴な突進", weight: 4, visual: { cutin: { text: "狂暴な突進", color: "fire" }, msg: "凄まじい勢いで突進してきた！" }, actions: [{ type: "STATE", target: "ENEMY", kind: "e_atk_buff", val: 0.5, turn: 2, visual: { se: "se-buff" } }, { type: "DAMAGE", target: "PLAYER", mult: 1.2, visual: { anim: "shake-medium" } }] },
                            { weight: 6, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
                        ]
                    },
                    {
                        name: "青眼の白龍", img: "assets/2-3-4.png", weak: 20, hp: 1000, atk: 25, ai: [
                            { name: "圧倒的な威圧感", preemptive: true, visual: { cutin: { text: "圧倒的な威圧感", color: "blue" }, msg: "伝説の龍の咆哮に体がすくむ！" }, actions: [{ type: "STATE", target: "PLAYER", kind: "p_atk_buff", val: -0.5, turn: 3 }] },
                            { name: "滅びの爆裂疾風弾", weight: 3, visual: { cutin: { text: "滅びの爆裂疾風弾", color: "blue" }, se: "se-boom", anim: "flash-blue", msg: "全てを焼き払う閃光が放たれた！" }, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 2.5, visual: { anim: "shake-heavy" } }] },
                            { weight: 7, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
                        ]
                    },
                    {
                        name: "オベリスクの巨神兵", img: "assets/2-3-5.png", weak: 20, hp: 2500, atk: 40, ai: [
                            { name: "神の耐性", preemptive: true, visual: { cutin: { text: "神の耐性", color: "gold" }, msg: "神に対して中途半端な攻撃は通じない！" }, actions: [{ type: "STATE", target: "ENEMY", kind: "barrier", val: 15, turn: 999 }] },
                            {
                                weight: 3, sequence: [
                                    { name: "ソウルエナジーMAX", visual: { msg: "敵が生け贄を捧げ、神の力が膨れ上がる！" }, actions: [{ type: "STATE", target: "ENEMY", kind: "charge", turn: 2, visual: { se: "se-warning" } }, { type: "STATE", target: "ENEMY", kind: "e_atk_buff", val: 2.0, turn: 2 }] },
                                    { name: "ゴッド・ハンド・クラッシャー", visual: { cutin: { text: "ゴッド・ハンド・クラッシャー", color: "gold" }, se: "se-boom", anim: "flash-gold", msg: "神の拳が全てを砕く！" }, actions: [{ type: "DAMAGE", target: "PLAYER", mode: "fixed", val: 80, visual: { anim: "shake-ultimate" } }, { type: "MP_ACTION", target: "PLAYER", val: -99 }] }
                                ]
                            },
                            { weight: 7, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
                        ]
                    }
                ]
            },
            {
                id: "2-EX",
                title: "死の闇の闘技場",
                sub: "Colosseum of Dark Despair",
                bg: "assets/bg_stage_marik.png",     // 紫色の霧が漂う不気味な神殿
                bossBg: "assets/bg_stage_marik_god.png", // 黄金のオーラに包まれた空
                bossFloor: 5,
                multiplier: 6.0, // 超高難易度
                type: "EXTRA",
                warning: true,
                rankThresholds: { SSS: 25, S: 35, A: 50, B: 70 },
                floors: [
                    {
                        name: "ギル・ガース", img: "assets/2-ex-1.png", weak: 18, hp: 800, atk: 20, ai: [
                            { name: "ギロチン・アタック", weight: 5, visual: { cutin: { text: "ギロチン・アタック", color: "earth" } }, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.5 }] },
                            { weight: 5, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
                        ]
                    },
                    {
                        name: "地獄詩人ヘルポエマー", img: "assets/2-ex-2.png", weak: 17, hp: 850, atk: 18, ai: [
                            { name: "冥界からの呼び声", weight: 4, visual: { cutin: { text: "冥界からの呼び声", color: "purple" }, msg: "カードと魔力が吸い取られる！" }, actions: [{ type: "DISCARD_SELECT", count: 1 }, { type: "MP_ACTION", target: "PLAYER", val: -2 }] },
                            { weight: 6, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
                        ]
                    },
                    {
                        name: "バイサー・デス", img: "assets/2-ex-3.png", weak: 20, hp: 900, atk: 22, ai: [
                            { name: "痛恨の拘束", weight: 6, visual: { cutin: { text: "痛恨の拘束", color: "purple" }, msg: "拷問器具が動きを封じる！" }, actions: [{ type: "STATE", target: "PLAYER", kind: "bind", turn: 1 }, { type: "DAMAGE", target: "PLAYER", mult: 0.8 }] },
                            { weight: 4, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
                        ]
                    },
                    {
                        name: "溶岩魔神ラヴァ・ゴーレム", img: "assets/2-ex-4.png", weak: 19, hp: 1200, atk: 25, ai: [
                            { name: "黒曜石の檻", preemptive: true, visual: { cutin: { text: "黒曜石の檻", color: "fire" }, msg: "溶岩の檻が防御力を焼き尽くす！" }, actions: [{ type: "STATE", target: "PLAYER", kind: "guard_fixed", val: -15, turn: 5 }] },
                            { name: "ボルケーノ・エンチャント", weight: 4, visual: { cutin: { text: "ボルケーノ・エンチャント", color: "fire" }, se: "se-boom" }, actions: [{ type: "DAMAGE", target: "PLAYER", mode: "fixed", val: 40 }] },
                            { weight: 6, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
                        ]
                    },
                    {
                        name: "ラーの翼神竜", img: "assets/2-ex-5.png", weak: 20, hp: 3000, atk: 45, ai: [
                            { name: "スフィア・モード", preemptive: true, visual: { cutin: { text: "スフィア・モード", color: "gold" }, msg: "神はあらゆる下等な術を跳ね返す！" }, actions: [{ type: "STATE", target: "ENEMY", kind: "barrier", val: 20, turn: 999 }] },
                            {
                                name: "ゴッド・フェニックス", weight: 3, cond: { src: "turn_mod", val: 3 }, visual: { cutin: { text: "ゴッド・フェニックス", color: "fire" }, se: "se-boom", msg: "不死鳥の炎が全てを無に帰す！" }, actions: [{ type: "DAMAGE", target: "PLAYER", mode: "fixed", val: 60 },
                                { type: "STATE", target: "PLAYER", kind: "p_atk_buff", turn: 0 },
                                { type: "STATE", target: "PLAYER", kind: "guard_ratio", turn: 0 },
                                { type: "STATE", target: "PLAYER", kind: "guard_fixed", turn: 0 },
                                { type: "STATE", target: "PLAYER", kind: "barrier", turn: 0 },]
                            },
                            {
                                weight: 3, sequence: [
                                    { name: "古代神の唱文", visual: { msg: "呪文を唱える！神の力が解放される！" }, actions: [{ type: "STATE", target: "ENEMY", kind: "charge", turn: 2, visual: { se: "se-warning" } }] },
                                    { name: "黄金の輝き", visual: { cutin: { text: "黄金の輝き", color: "gold" }, anim: "flash-gold" }, actions: [{ type: "STATE", target: "ENEMY", kind: "e_atk_buff", val: 3.0, turn: 1 }, { type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
                                ]
                            },
                            { weight: 4, actions: [{ type: "DAMAGE", target: "PLAYER", mult: 1.0 }] }
                        ]
                    }
                ]
            }
        ]
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
        actions: [{ type: "STATE", target: "PLAYER", kind: "p_atk_buff", val: 1.0, turn: 1 }],
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
                type: "STATE", target: "PLAYER", kind: "p_atk_buff", val: 2.0, turn: 1,
                visual: { msg: "HP劣勢…逆転の3倍パワー！" }
            },
            {
                cond: { src: "p_hp", op: "gt", val: 50 },
                type: "STATE", target: "PLAYER", kind: "p_atk_buff", val: -0.5, turn: 1,
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
            { type: "STATE", target: "PLAYER", kind: "p_atk_flat", val: 20, turn: 1 }
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
    },
    // --- Vol.3 Cards (123-137) ---
    {
        id: 123, name: "ハーピィの羽根帚", rarity: "UR", type: "MAGIC", cost: 2, desc: "敵の全てのバフ・壁を解除",
        visual: { se: "se-wind", msg: "敵の守りを吹き飛ばした！" },
        actions: [
            { type: "STATE", target: "ENEMY", kind: "e_atk_buff", turn: 0 },
            { type: "STATE", target: "ENEMY", kind: "guard_ratio", turn: 0 },
            { type: "STATE", target: "ENEMY", kind: "guard_fixed", turn: 0 },
            { type: "STATE", target: "ENEMY", kind: "barrier", turn: 0 },
            { type: "STATE", target: "ENEMY", kind: "charge", turn: 0 }
        ],
        packs: ["vol3"]
    },
    {
        id: 124, name: "洗脳-ブレインコントロール", rarity: "UR", type: "MAGIC", cost: 3, desc: "敵が混乱して自傷＋スタン",
        visual: { se: "se-hit", msg: "敵は混乱して自分を攻撃した！" },
        actions: [
            { type: "DAMAGE", target: "ENEMY", scale: { source: "enemy_atk", factor: 1.0 } },
            { type: "STATE", target: "ENEMY", kind: "stun", turn: 1 }
        ],
        packs: ["vol3"]
    },
    {
        id: 125, name: "激流葬", rarity: "SR", type: "TRAP", cost: 3, desc: "敵出現時に100ダメージ",
        visual: { se: "se-water" },
        trap: {
            trigger: "summon",
            actions: [
                { type: "DAMAGE", target: "ENEMY", mode: "fixed", val: 100 },
                { type: "DAMAGE", target: "PLAYER", mode: "fixed", val: 20 }
            ]
        },
        packs: ["vol3"]
    },
    {
        id: 126, name: "破壊輪", rarity: "SR", type: "TRAP", cost: 3, desc: "攻撃無効＋敵攻撃力分ダメージ",
        visual: { se: "se-boom" },
        trap: {
            trigger: "attack",
            actions: [
                { type: "NEGATE" },
                { type: "DAMAGE", target: "ENEMY", scale: { source: "enemy_atk", factor: 1.0 } }
            ]
        },
        packs: ["vol3"]
    },
    {
        id: 127, name: "フォース", rarity: "SR", type: "MAGIC", cost: 10, desc: "敵HPを3割減らす",
        visual: { se: "se-dark" },
        actions: [{ type: "DAMAGE", target: "ENEMY", mode: "current_hp_percent", val: 30 }],
        packs: ["vol3"]
    },
    {
        id: 128, name: "スケープ・ゴート", rarity: "R", type: "MAGIC", cost: 4, desc: "4Tダメージを10カット",
        visual: { se: "se-buff", msg: "羊トークンが盾になる！" },
        actions: [{ type: "STATE", target: "PLAYER", kind: "guard_fixed", val: 10, turn: 4 }],
        packs: ["vol3"]
    },
    {
        id: 129, name: "団結の力", rarity: "R", type: "MAGIC", cost: 3, desc: "手札枚数×20の攻撃力UP(1投)",
        visual: { se: "se-buff" },
        actions: [{ type: "STATE", target: "PLAYER", kind: "p_atk_flat", val: 0, scale: { source: "hand", factor: 20 }, turn: 1 }],
        packs: ["vol3"]
    },
    {
        id: 130, name: "魔導師の力", rarity: "R", type: "MAGIC", cost: 4, desc: "現在MP×20の攻撃力UP(1投)",
        visual: { se: "se-buff" },
        actions: [{ type: "STATE", target: "PLAYER", kind: "p_atk_flat", val: 0, scale: { source: "mp", factor: 20 }, turn: 1 }],
        packs: ["vol3"]
    },
    {
        id: 131, name: "停戦協定", rarity: "R", type: "TRAP", cost: 2, desc: "敵出現時に1Tスタン",
        visual: { se: "se-bell" },
        trap: {
            trigger: "summon",
            actions: [{ type: "STATE", target: "ENEMY", kind: "stun", turn: 1 }]
        },
        packs: ["vol3"]
    },
    {
        id: 132, name: "成金ゴブリン", rarity: "N", type: "MAGIC", cost: 1, desc: "2枚ドロー＋敵HP100回復",
        visual: { se: "se-coin" },
        actions: [
            { type: "DRAW", val: 2 },
            { type: "HEAL", target: "ENEMY", val: 100 }
        ],
        packs: ["vol3"]
    },
    {
        id: 133, name: "和睦の使者", rarity: "N", type: "TRAP", cost: 3, desc: "このターンのダメージを0にする",
        visual: { se: "se-guard" },
        trap: {
            trigger: "attack",
            actions: [{ type: "NEGATE" }]
        },
        packs: ["vol3"]
    },
    {
        id: 134, name: "鎖付きブーメラン", rarity: "N", type: "TRAP", cost: 4, desc: "攻撃無効＋次の一撃攻撃力1.5倍",
        visual: { se: "se-chain" },
        trap: {
            trigger: "attack",
            actions: [
                { type: "NEGATE" },
                { type: "STATE", target: "PLAYER", kind: "p_atk_buff", val: 0.5, turn: 1 }
            ]
        },
        packs: ["vol3"]
    },
    {
        id: 135, name: "強欲な瓶", rarity: "N", type: "TRAP", cost: 1, desc: "攻撃された時に1枚ドロー",
        visual: { se: "se-draw" },
        trap: {
            trigger: "attack",
            actions: [{ type: "DRAW", val: 1 }]
        },
        packs: ["vol3"]
    },
    {
        id: 136, name: "魔法除去", rarity: "N", type: "MAGIC", cost: 1, desc: "敵の結界(バリア)を破壊",
        visual: { se: "se-break" },
        actions: [{ type: "STATE", target: "ENEMY", kind: "barrier", turn: 0 }],
        packs: ["vol3"]
    },
    {
        id: 137, name: "痛み分け", rarity: "N", type: "MAGIC", cost: 2, desc: "自身の減少HP分のダメージを敵に与える",
        visual: { se: "se-dark" },
        actions: [{ type: "DAMAGE", target: "ENEMY", mode: "loss_hp" }],
        packs: ["vol3"]
    }
];

// Pack Data
const PACK_DATA = [
    { id: "vol1", name: "Vol.1 - Legend", price: 1000, desc: "伝説の始まり。基本魔法カード収録。", unlockStage: "1-1", img: "assets/packs/vol1.png" },
    { id: "vol2", name: "Vol.2 - Awakening", price: 1000, desc: "テクニカルな戦略カードが登場。", unlockStage: "1-3", img: "assets/packs/vol2.png" },
    { id: "vol3", name: "Vol.3 - Rulers", price: 1000, desc: "運命を操作する強力な魔法・罠。", unlockStage: "2-1", img: "assets/packs/vol3.png" }
];

// Player Default Stats
const PLAYER_INITIAL_STATS = {
    hp: 100,
    maxHp: 100,
    mp: 3,
    maxMp: 10
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
    { ppr: 100, rt: 14 }, { ppr: 95, rt: 13 }, { ppr: 90, rt: 12 },
    { ppr: 85, rt: 11 }, { ppr: 80, rt: 10 }, { ppr: 75, rt: 9 },
    { ppr: 70, rt: 8 }, { ppr: 65, rt: 7 }, { ppr: 60, rt: 6 },
    { ppr: 55, rt: 5 }, { ppr: 50, rt: 4 }, { ppr: 45, rt: 3 },
    { ppr: 40, rt: 2 }, { ppr: 30, rt: 1 }
];

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

// =========================================
// SOUL & RELIEF SYSTEM DATA (v1.0)
// =========================================

// カードの自動変換レート (4枚目以降)
const SOUL_RECYCLE_RATES = {
    "N": 10,
    "R": 50,
    "SR": 200,
    "UR": 1000
};

// =========================================
// RELIEF DATABASE (v1.6 Complete & Final)
// =========================================
const RELIEF_DB = {
    // --- AREA 1: 古の森と迷宮 / 荒野 / 誘惑の迷宮 ---
    "1-1-1": { name: "幼生の石版", monsterName: "プチモス", souls: 300, img: "assets/1-1.png", desc: "未熟な生命力。最大HP+30。", passives: [{ type: "STATIC", category: "hp_max", val: 30 }] },
    "1-1-2": { name: "成長の石版", monsterName: "ラーバモス", souls: 400, img: "assets/1-2.png", desc: "進化の予兆。ターン開始時、20%の確率でMPが1回復する。", passives: [{ trigger: "onTurnStart", chance: 0.2, actions: [{ type: "MP_ACTION", target: "PLAYER", val: 1 }] }] },
    "1-1-3": { name: "潜伏の石版", monsterName: "進化の繭", souls: 600, img: "assets/1-3.png", desc: "鉄壁の守護。被ダメージ-5。さらにターン開始時、20%の確率でHP20回復。", passives: [{ type: "STATIC", category: "dmg_sub", val: 5 }, { trigger: "onTurnStart", chance: 0.2, actions: [{ type: "HEAL", target: "PLAYER", val: 20 }] }] },
    "1-1-4": { name: "猛毒の石版", monsterName: "グレート・モス", souls: 1000, img: "assets/1-4.png", desc: "毒の鱗粉。攻撃命中時、5%の確率で敵を1Tスタンさせる。", passives: [{ trigger: "onAttackHit", chance: 0.05, actions: [{ type: "STATE", target: "ENEMY", kind: "stun", turn: 1 }] }] },
    "1-1-5": { name: "森神の石版", monsterName: "究極完全態・グレート・モス", souls: 2000, img: "assets/1-5.png", desc: "究極の生命力。被ダメージ-5。最大HP+50。", passives: [{ type: "STATIC", category: "dmg_sub", val: 5 }, { type: "STATIC", category: "hp_max", val: 50 }] },
    
    "1-2-1": { name: "原始の石版", monsterName: "トラコドン", souls: 800, img: "assets/2-1.png", desc: "原始の力。各ターンの1投目のダメージを+20加算する。", passives: [{ type: "STATIC", category: "atk_add_first", val: 20 }] },
    "1-2-2": { name: "俊足の石版", monsterName: "ワイルド・ラプター", souls: 1000, img: "assets/2-2.png", desc: "俊足の狩人。常に与ダメージ+10。", passives: [{ type: "STATIC", category: "atk_add", val: 10 }] },
    "1-2-3": { name: "腐敗の石版", monsterName: "屍を貪る竜", souls: 1500, img: "assets/2-3.png", desc: "死肉の渇望。敵を撃破した瞬間にHPを50回復する。", passives: [{ trigger: "onEnemyKill", actions: [{ type: "HEAL", target: "PLAYER", val: 50 }] }] },
    "1-2-4": { name: "王者の石版", monsterName: "二頭を持つキング・レックス", souls: 2000, img: "assets/2-4.png", desc: "王者の威圧。自分のHPが50%以下の時、与ダメージ+20。", passives: [{ type: "STATIC", category: "atk_add_low_hp", val: 20 }] },
    "1-2-5": { name: "鋭牙の石版", monsterName: "剣竜", souls: 1800, img: "assets/2-5.png", desc: "鎧通しの牙。常に敵の固定軽減（アーマー）を無視して攻撃する。", passives: [{ type: "STATIC", category: "pierce_fixed", val: 999 }] },
    
    "1-3-1": { name: "守護天使の石版", monsterName: "デュナミス・ヴァルキリア", souls: 1200, img: "assets/3-1.png", desc: "天使の盾。常に被ダメージ-8。", passives: [{ type: "STATIC", category: "dmg_sub", val: 8 }] },
    "1-3-2": { name: "狩場の石版", monsterName: "ハーピィ・レディ", souls: 1000, img: "assets/3-2.png", desc: "風まとう狩人。ターン開始時、10%の確率でドローする。", passives: [{ trigger: "onTurnStart", chance: 0.1, actions: [{ type: "DRAW", val: 1 }] }] },
    "1-3-3": { name: "魅惑の石版", monsterName: "ハーピィ・レディ・SB", souls: 1200, img: "assets/3-3.png", desc: "華麗なる束縛。攻撃命中時、5%の確率で敵を拘束しダメージを与える。", passives: [{ trigger: "onAttackHit", chance: 0.05, actions: [{ type: "DAMAGE", target: "ENEMY", mult: 0.5 }] }] },
    "1-3-4": { name: "三姉妹の石版", monsterName: "ハーピィ・レディ三姉妹", souls: 1800, img: "assets/3-4.png", desc: "華麗なる三位一体。1～3投目が全て同じスコアなら、3投目に+30ダメージ。", passives: [{ type: "STATIC", category: "atk_add_triple_same", val: 30 }] },
    "1-3-5": { name: "寵愛の石版", monsterName: "ハーピィズペット竜", souls: 1500, img: "assets/3-5.png", desc: "竜の愛。常に与ダメージ+15。", passives: [{ type: "STATIC", category: "atk_add", val: 15 }] },

    "1-EX-1": { name: "黒竜の石版", monsterName: "真紅眼の黒竜", souls: 2000, img: "assets/extra.png", desc: "可能性の咆哮。常に与ダメージ+15。さらにWeak時ダメージUP。", passives: [{ type: "STATIC", category: "atk_add", val: 15 }] },

    // --- AREA 2: 幻想 / 神の領域 / 海馬 ---
    "2-1-1": { name: "兎の石版", monsterName: "ダーク・ラビット", souls: 1200, img: "assets/4-1.png", desc: "コミカルな連撃。2投目のダメージを常に+15加算する。", passives: [{ type: "STATIC", category: "atk_add_second", val: 15 }] },
    "2-1-2": { name: "箱の石版", monsterName: "デビル・ボックス", souls: 1200, img: "assets/4-2.png", desc: "驚喜の演出。攻撃命中時、10%の確率でダメージが+30される。", passives: [{ trigger: "onAttackHit", chance: 0.1, actions: [{ type: "DAMAGE", target: "ENEMY", mode: "fixed", val: 30 }] }] },
    "2-1-3": { name: "嘲笑の石版", monsterName: "トゥーン・デーモン", souls: 1500, img: "assets/4-3.png", desc: "悪魔の嘲笑。ターン開始時、10%の確率でMPが1回復する。", passives: [{ trigger: "onTurnStart", chance: 0.1, actions: [{ type: "MP_ACTION", target: "PLAYER", val: 1 }] }] },
    "2-1-4": { name: "幻影龍の石版", monsterName: "ブルーアイズ・トゥーン・ドラゴン", souls: 2000, img: "assets/4-4.png", desc: "ブルーアイズの咆哮。常に与ダメージが 10 アップする。", passives: [{ type: "STATIC", category: "atk_add", val: 10 }] },
    "2-1-5": { name: "儀式の石版", monsterName: "サクリファイス", souls: 2500, img: "assets/4-5.png", desc: "吸着する魔眼。全ての攻撃に5%の吸収（ドレイン）効果を付与。", passives: [{ type: "STATIC", category: "drain_global", val: 0.05 }] },
    "2-1-6": { name: "千眼の石版", monsterName: "サウザンド・アイズ・サクリファイス", souls: 3500, img: "assets/4-6.png", desc: "魔眼の回避。敵の攻撃を10%の確率で無効化する。", passives: [{ trigger: "onDefense", chance: 0.1, actions: [{ type: "NEGATE" }] }] },

    "2-2-1": { name: "寄生の石版", monsterName: "ワームドレイク", souls: 1200, img: "assets/5-1.png", desc: "執拗な寄生。3投の合計スコアが60以下の時、50%の確率でMPが1回復する。", passives: [{ trigger: "onRoundEnd", chance: 0.5, actions: [{ type: "MP_ACTION", target: "PLAYER", val: 1 }], condition: "score_lte_60" }] },
    "2-2-2": { name: "粘着の石版", monsterName: "ヒューマノイド・スライム", souls: 1200, img: "assets/5-2.png", desc: "流動する防御。被ダメージ-3。さらに最大HP+40。", passives: [{ type: "STATIC", category: "dmg_sub", val: 3 }, { type: "STATIC", category: "hp_max", val: 40 }] },
    "2-2-3": { name: "再生の石版", monsterName: "リバイバルスライム", souls: 2500, img: "assets/5-3.png", desc: "不滅の肉体。ターン開始時、30%の確率でHPが50回復する。", passives: [{ trigger: "onTurnStart", chance: 0.3, actions: [{ type: "HEAL", target: "PLAYER", val: 50 }] }] },
    "2-2-4": { name: "融合の石版", monsterName: "ヒューマノイド_ドレイク", souls: 2000, img: "assets/5-4.png", desc: "融合する力。自身にバフ(攻撃UP系)がかかっている時、与ダメージ+15。", passives: [{ type: "STATIC", category: "atk_add_if_buffed", val: 15 }] },
    "2-2-5": { name: "雷神の石版", monsterName: "オシリスの天空竜", souls: 5000, img: "assets/5-5.png", desc: "召雷の弾丸。手札1枚につき、常に与ダメージ+5。", passives: [{ type: "STATIC", category: "atk_add_per_hand", val: 5 }] },

    "2-3-1": { name: "重斧の石版", monsterName: "ミノタウルス", souls: 2000, img: "assets/2-3-1.png", desc: "防御粉砕。常に敵の「結界（バリア）」を 10 無視して攻撃する。", passives: [{ type: "STATIC", category: "pierce_barrier", val: 10 }] },
    "2-3-2": { name: "道化の石版", monsterName: "闇・道化師のサギー", souls: 1500, img: "assets/2-3-2.png", desc: "魔力軽減。マジックカードを使用する際、MPコストを常に-1する(最低0)。", passives: [{ type: "STATIC", category: "cost_down_magic_zero", val: 1 }] },
    "2-3-3": { name: "伏兵の石版", monsterName: "ブラッド・ヴォルス", souls: 1800, img: "assets/2-3-3.png", desc: "単発の威力。判定が「SINGLE」だった場合、ダメージを+20加算する。", passives: [{ type: "STATIC", category: "atk_add_single", val: 20 }] },
    "2-3-4": { name: "滅びの石版", monsterName: "青眼の白龍", souls: 4000, img: "assets/2-3-4.png", desc: "圧倒的破壊。与ダメージ+30。ただし被ダメージも常に+10増える。", passives: [{ type: "STATIC", category: "atk_add", val: 30 }, { type: "STATIC", category: "dmg_sub", val: -10 }] },
    "2-3-5": { name: "破壊神の石版", monsterName: "オベリスクの巨神兵", souls: 5000, img: "assets/2-3-5.png", desc: "神の耐性。常に被ダメージ-20。", passives: [{ type: "STATIC", category: "dmg_sub", val: 20 }] },

    // --- AREA 2-EX: 死の闇の闘技場 ---
    "2-EX-1": { name: "拷問の石版", monsterName: "ギル・ガース", souls: 2500, img: "assets/2-ex-1.png", desc: "魔力の代償。現在MPが 1 につき、ダメージを+2加算する。", passives: [{ type: "STATIC", category: "atk_add_per_mp", val: 2 }] },
    "2-EX-2": { name: "奈落の石版", monsterName: "地獄詩人ヘルポエマー", souls: 2500, img: "assets/2-ex-2.png", desc: "冥界の衰弱。敵の基礎攻撃力（ATK）を常に -5 低下させる。", passives: [{ type: "STATIC", category: "enemy_atk_flat", val: -5 }] },
    "2-EX-3": { name: "万力の石版", monsterName: "バイサー・デス", souls: 3000, img: "assets/2-ex-3.png", desc: "拘束の反動。ターン開始時、15%の確率で敵を1Tスタンさせる。", passives: [{ trigger: "onTurnStart", chance: 0.15, actions: [{ type: "STATE", target: "ENEMY", kind: "stun", turn: 1 }] }] },
    "2-EX-4": { name: "溶岩の石版", monsterName: "溶岩魔神ラヴァ・ゴーレム", souls: 3500, img: "assets/2-ex-4.png", desc: "自動燃焼。ターン終了時、敵に 50 の固定ダメージを与える。", passives: [{ trigger: "onRoundEnd", actions: [{ type: "DAMAGE", target: "ENEMY", mode: "fixed", val: 50 }] }] },
    "2-EX-5": { name: "太陽神の石版", monsterName: "ラーの翼神竜", souls: 5000, img: "assets/2-ex-5.png", desc: "大いなる再生。あらゆるHP回復効果を2倍にする。", passives: [{ type: "STATIC", category: "heal_multiplier", val: 2.0 }] }
};