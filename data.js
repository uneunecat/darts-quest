console.log("★ data.js is loaded!");

// --- ★ GAME DATA CONFIG ★ ---
const GAME_DATA = {
    enemies: {
        1: [
            { name: "プチモス", img: "assets/1-1.png", weak: 20 },
            { name: "ラーバモス", img: "assets/1-2.png", weak: 19 },
            { name: "進化の繭", img: "assets/1-3.png", weak: 18 },
            { name: "グレート・モス", img: "assets/1-4.png", weak: 17 },
            { name: "究極完全態・グレート・モス", img: "assets/1-5.png", weak: 20 }
        ],
        2: [
            { name: "トラコドン", img: "assets/2-1.png", weak: 19 },
            { name: "ワイルド・ラプター", img: "assets/2-2.png", weak: 18 },
            { name: "屍を貪る竜", img: "assets/2-3.png", weak: 17 },
            { name: "二頭を持つキング・レックス", img: "assets/2-4.png", weak: 20 },
            { name: "剣竜", img: "assets/2-5.png", weak: 19 }
        ],
        3: [
            { name: "デュナミス・ヴァルキリア", img: "assets/3-1.png", weak: 20 },
            { name: "ハーピィ・レディ", img: "assets/3-2.png", weak: 19 },
            { name: "ハーピィ・レディ・SB", img: "assets/3-3.png", weak: 18 },
            { name: "ハーピィ・レディ三姉妹", img: "assets/3-4.png", weak: 17 },
            { name: "ハーピィズペット竜", img: "assets/3-5.png", weak: 20 }
        ],
        4: [
            { name: "ダーク・ラビット", img: "assets/4-1.png", weak: 20 },
            { name: "デビル・ボックス", img: "assets/4-2.png", weak: 19 },
            { name: "トゥーン・デーモン", img: "assets/4-3.png", weak: 18 },
            { name: "ブルーアイズ・トゥーン・ドラゴン", img: "assets/4-4.png", weak: 17 },
            { name: "サクリファイス", img: "assets/4-5.png", weak: 20 },
            { name: "サウザンド・アイズ・サクリファイス", img: "assets/4-6.png", weak: 20 }
        ],
        5: [
            { name: "真紅眼の黒竜", img: "assets/extra.png", weak: 20 }
        ]
    },
    bg: {
        1: "assets/bg_stage1.png",
        2: "assets/bg_stage2.png",
        3: "assets/bg_stage3.png",
        4_1: "assets/bg_stage4_1.png",
        4_2: "assets/bg_stage4_2.png",
        5: "assets/bg_extra.png"
    }
};

// --- ★ CARD DATA (Ver 2.2 Balance) ★ ---
// コスト重め、特殊効果重視
const CARD_DB = [
    // UR
    { id: 101, name: "死者蘇生", rarity: "UR", type: "MAGIC", cost: 8, desc: "HPを完全回復する" },
    
    // SR
    { id: 201, name: "サンダー・ボルト", rarity: "SR", type: "MAGIC", cost: 6, desc: "敵に100ダメージ + スタン(1回休み)" },
    { id: 202, name: "強欲な壺", rarity: "SR", type: "MAGIC", cost: 0, desc: "MPを5回復する" },

    // R
    { id: 301, name: "光の護封剣", rarity: "R", type: "MAGIC", cost: 5, desc: "3ターンの間、受けるダメージを半減" },
    { id: 302, name: "落とし穴", rarity: "R", type: "TRAP", cost: 3, desc: "敵のチャージを解除しスタンさせる" },
    { id: 303, name: "聖なるバリア", rarity: "R", type: "TRAP", cost: 4, desc: "1ターン攻撃無効化 + 敵に50反撃" },

    // N
    { id: 401, name: "火の粉", rarity: "N", type: "MAGIC", cost: 1, desc: "敵に20ダメージ" },
    { id: 402, name: "治療の神", rarity: "N", type: "MAGIC", cost: 4, desc: "HPを50回復する" },
    { id: 403, name: "はさみ撃ち", rarity: "N", type: "TRAP", cost: 2, desc: "敵に80ダメージ、自分に20ダメージ" },
    { id: 404, name: "昼夜の大火事", rarity: "N", type: "MAGIC", cost: 3, desc: "敵に80ダメージ" },
    { id: 405, name: "突進", rarity: "N", type: "MAGIC", cost: 2, desc: "次の一投のダメージが2倍になる" }
];

// パック定義
const PACK_DATA = [
    { 
        id: "vol1", 
        name: "Vol.1 - Legend", 
        price: 1000, 
        desc: "伝説の始まり。基本魔法カード収録。", 
        unlockStage: 1,
        img: "assets/packs/vol1.png"
    }
];