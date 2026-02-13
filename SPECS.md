# Game Specifications

## 1. Game Overview
- **タイトル**: DARTS QUEST
- **ジャンル**: ダーツ × RPG × カードゲーム (ブラウザゲーム)
- **技術構成**: Vanilla JS / HTML / CSS (フレームワーク不使用)
- **対応デバイス**: PC (900x620px スケーリング) / モバイル (フル幅レスポンシブ)
- **外部連携**: DARTSLIVE ダーツボード (Web Bluetooth API)
- **保存方式**: localStorage (3スロット制)
- **バージョン**: v2.15.16 (main.js冒頭のログより)

---

## 2. File Structure

| ファイル | 役割 | 行数(概算) |
|---------|------|-----------|
| `index.html` | 全画面のHTML構造 (338行) | UI骨格・Audio要素定義 |
| `style.css` | 全スタイル・アニメーション (1263行) | カード・バトル・モーダル等 |
| `data.js` | マスターデータ (464行) | 敵・カード・ステージ・定数 |
| `main.js` | ゲームロジック全体 (約2864行) | 入力・戦闘・UI・ショップ等 |
| `assets/` | 画像・BGM・SE リソース | PNG/MP3 |

---

## 3. Game Flow

```
[起動] → セーブスロット選択 (3スロット)
  → [タイトル画面] (BGM: bgm-title)
    ├── GAME START → ステージ選択 → チャプター演出 → 戦闘画面
    ├── SHOP → カードパック購入 (DP消費)
    ├── DECK → デッキ編集 (20枚固定)
    ├── HISTORY → プレイ履歴
    └── SLOTS → スロット選択に戻る

[戦闘ループ] (1ステージ = 5フロア、Stage4のみ6フロア)
  1. 敵出現 (spawnEnemy) → 先制スキル判定
  2. インターバル画面 (PULL DARTS / TAP TO DRAW)
  3. プレイヤーターン開始 (startPlayerTurn)
     - MP +3 チャージ (アニメーション付き)
     - カード1枚ドロー
  4. ダーツ投擲 (3投/ターン、拘束時は1投)
     - キーボード入力 or Bluetooth入力
     - ダメージ計算 → 敵HP減少
  5. 敵ターン (enemyTurn → executeEnemySkill)
     - AI判定 → スキル or 通常攻撃
  6. 敵撃破 → 宝箱判定 (checkDrop) → 次フロアへ (nextStep)
  7. ボス撃破 → ステージクリア → ランク判定 → DP獲得

[ステージクリア後の選択]
  - 「次へ進む」: HP+30回復して次ステージへ (状態引継ぎ)
  - 「帰還する」: DP確定してタイトルへ
  - Stage3クリア + PPR≥70: EXTRA STAGE 出現
```

---

## 4. Data Structures

### 4.1 Player State (`player`)
```javascript
{
  hp: 100, maxHp: 100,
  mp: 3, maxMp: 10,
  items: { potion: 0, ether: 0, seed: 0 },
  state: {
    atkBuff: 1.0,       // 攻撃倍率
    atkFlat: 0,          // 攻撃固定値加算
    atkDuration: 0,      // バフ残り投数
    guardTurn: 0,        // 護封剣残りターン
    itemLockTurn: 0,     // アイテム封印残りターン
    restrictInput: false // 拘束状態 (1投制限)
  },
  deck: [],    // 山札 (カードIDの配列)
  hand: [],    // 手札 (最大5枚: HAND_SIZE)
  discard: [], // 墓地
  deckLocked: false, // デッキ不完全時true
  setCard: null      // セット中の罠カードID
}
```

### 4.2 Enemy State (`enemy`)
```javascript
{
  hp: 100, maxHp: 100,
  data: null,  // GAME_DATA.enemies[stage][floor] の参照
  name: "",
  state: {
    charge: false,      // チャージ中フラグ
    isStunned: false,   // スタン状態
    atkBuff: 0,         // 攻撃力バフ値
    atkBuffTurn: 0,     // バフ残りターン
    guardTurn: 0,       // ガード残りターン
    guardType: null,    // "ratio" | "fixed"
    guardValue: 0,      // 軽減率 or 固定値
    barrierTurn: 0,     // バリア残りターン
    barrierLimit: 0,    // バリア閾値 (未満のダメージ無効)
    actionCount: 0,     // 行動回数カウンタ
    patternQueue: []    // シーケンス行動のキュー
  }
}
```

### 4.3 Save Data (`savedData`)
```javascript
{
  highScore: { stage: 1, floor: 1, avg: 0.0 },
  history: [],           // 最大50件
  clearedExtra: false,   // EXTRAクリア済みフラグ
  dp: 0,                 // ダーツポイント (通貨)
  bestRanks: {},         // { [stageId]: "SSS"|"S"|"A"|"B"|"C" }
  unlockedStage4: false, // Stage4解放フラグ
  deck: [],              // デッキ構成 (カードIDの配列, 20枚)
  cards: {},             // 所持カード { [cardId]: 所持枚数 }
  collection: {}         // 累計入手数
}
```

### 4.4 Game Config (`gameConfig`)
```javascript
{ bgmVolume: 0.3, sysVolume: 0.5, atkVolume: 0.8 }
// localStorage key: "darts_quest_config"
```

---

## 5. Constants

| 定数名 | 値 | 用途 |
|--------|-----|------|
| `DECK_SIZE` | 20 | デッキ枚数 |
| `HAND_SIZE` | 5 | 手札上限 |
| `INITIAL_HAND` | 3 | 初期ドロー枚数 |
| `SAVE_KEY` | `"darts_quest_save"` | localStorageキー |
| `SAME_CARD_LIMIT` | 3 | 同名カード上限 (main.js内ハードコード) |
| `LONG_PRESS_DURATION` | 500 | カード長押し判定(ms) |

### 5.1 STAGE_MASTER 拡張プロパティ

| プロパティ | 型 | 説明 | 例 |
|-----------|-----|------|-----|
| `displayName` | string | UI表示名 | `"STAGE 1"`, `"EXTRA"`, `"STAGE 5"` |
| `floors` | number | 最大フロア数 | Stage4=6, Stage5(EXTRA)=1, 他=5 |
| `bossFloor` | number? | ボス扱い開始フロア (省略時=floors) | Stage4のみ `5` (5F,6F両方ボス扱い) |
| `img` | string\|{default,boss} | 背景画像URL (複数ならオブジェクト) | Stage4/6は2枚切り替え |

---

## 6. Battle System

### 6.1 Damage Calculation
```
[プレイヤー → 敵]
1. ダーツスコア(0-60) = singleDmg
2. バリア判定: score < barrierLimit → singleDmg = 0
3. ガード判定:
   - ratio: singleDmg *= guardValue
   - fixed:  singleDmg -= guardValue (最低0)
4. 攻撃バフ: singleDmg = floor((singleDmg + atkFlat) * atkBuff)
5. enemy.hp -= singleDmg

[敵 → プレイヤー]
1. base = 2 + floor + (stage - 1) * 3
2. baseDmg = floor((base + random(0-5)) * mult)
3. 敵バフ: baseDmg に atkBuff 加算
4. トラップ判定 (triggerTrap)
5. 護封剣: finalDmg *= 0.5
6. player.hp -= finalDmg
```

### 6.2 Weak Point System
- 各敵に `weak` 値 (17, 18, 19, 20) が設定
- `score >= 51` かつ `score % weak === 0` → WEAK HIT
- WEAK HIT効果: 宝箱ドロップ率100%保証、命の種ドロップ率上昇

### 6.3 JUST FINISH
- 敵HPをちょうど0にすると発動
- 効果: MaxHP +10 & HP +10 回復

### 6.4 Turn Flow (詳細)
```
[インターバル] (isInterval = true, 入力遮断)
  ↓ タップ/Enter
[startPlayerTurn]
  → MP +3 チャージアニメーション
  → カード1枚ドロー
  → currentTurn++
  ↓
[ダーツ投擲フェーズ] (最大3投)
  → processOneThrow(score) × 3
  → 敵HP 0 → winBattle → checkDrop → nextStep
  → 3投完了 → finishPlayerTurn
  ↓
[finishPlayerTurn]
  → totalGameTurns++
  → enemyTurn()
  ↓
[enemyTurn]
  → スタン判定
  → AI行動選択 (weight抽選 or guaranteed確定)
  → executeEnemySkill or doEnemyAttack
  ↓
[endEnemyTurn]
  → バフ/デバフのターン経過処理
  → 1.5秒待機
  → preparePlayerTurn (インターバルへ戻る)
```

---

## 7. Enemy AI System

### 7.1 現行アーキテクチャの注意点

**data.js** は v2.2「アトミック・スキル・システム」形式で記述されている:
```javascript
// data.js の新形式
{
  name: "スキル名",
  weight: 3,
  cond: { src: "e_hp", op: "lt", val: 80 },
  visual: { cutin: { text: "...", color: "..." }, msg: "..." },
  actions: [{ type: "HEAL", val: 20 }, { type: "DAMAGE", mult: 1.0 }]
}
```

一方、**main.js** の `executeEnemySkill()` は旧形式を前提としている:
```javascript
// main.js が期待する旧形式
{ type: "HEAL", value: 20 }
{ type: "BUFF_E", state: { ... } }
{ type: "ATTACK", mult: 2.0 }
```

**現状**: data.js の `actions` 配列内の個別エフェクトと、main.js の `skill.type` による分岐が一致していない。基本攻撃(name なし)は `doEnemyAttack(1.0)` にフォールスルーするため動作するが、複雑なスキルは正しく実行されない可能性がある。

### 7.2 AI Condition System (`cond`)

| src | 説明 | op | 例 |
|-----|------|-----|-----|
| `e_hp` | 敵HP% | lt/gt/eq/lte/gte | `{src:"e_hp", op:"lt", val:50}` |
| `p_hp` | プレイヤーHP% | 同上 | |
| `p_mp` | プレイヤーMP | 同上 | |
| `hand` | プレイヤー手札数 | 同上 | |
| `turn` | 敵行動回数 | 同上 | |
| `turn_mod` | 行動回数の剰余 | (特殊) | `{src:"turn_mod", val:4}` → 4の倍数ターン |
| `p_state` | プレイヤー状態 | (特殊) | `{src:"p_state", tag:"restrictInput", val:false}` |
| `trap` | 罠セット有無 | (特殊) | `{src:"trap", val:true}` |

### 7.3 AI Action Selection Priority
1. `patternQueue` にシーケンスが残っていれば最優先で消化
2. 条件を満たすアクションをフィルタ (既に有効なバフスキルは除外)
3. `guaranteed: true` のアクションがあれば確定発動
4. なければ `weight` による加重ランダム抽選

---

## 8. Stage & Enemy Database

### 8.1 Stage Master

| ID | 内部key | 名称 | 英名 | DP倍率 | フロア数 | 警告演出 | 解放条件 |
|---|---------|------|------|--------|---------|---------|---------|
| 1 | 1 | 旅立ちの森 | Forest of Beginnings | x1.0 | 5F | なし | 初期解放 |
| 2 | 2 | 荒れ狂う荒野 | Raging Wasteland | x1.5 | 5F | なし | Stage1クリア |
| 3 | 3 | 誘惑の迷宮 | Labyrinth of Temptation | x2.0 | 5F | なし | Stage2クリア |
| 4 | 4 | 幻想の狂宴 | Toon Nightmare | x3.0 | 6F | あり | Stage3クリア or EXTRAクリア |
| 5 | 5 | 燃えたぎる火口 | Burning Crater (EXTRA) | x5.0 | 1F | あり | EXTRAクリア済み (再挑戦用) |
| 6 | 6 | 神の試練 | God's Testing Ground (GOD) | x5.0 | 5F | あり | Stage4クリア |

### 8.2 Rank Thresholds (ターン数ベース)

| ランク | Stage 1-3 | Stage 4-6 | DP ボーナス |
|--------|-----------|-----------|------------|
| SSS | ≤12 | ≤25 | 1000 |
| S | ≤16 | ≤35 | 600 |
| A | ≤22 | ≤50 | 300 |
| B | ≤30 | ≤70 | 100 |
| C | >30 / >70 | (上記超過) | 50 |

### 8.3 EXTRA Stage 出現条件
- Stage 3 クリア時に PPR ≥ 70.0 **または** 過去にEXTRAクリア済み

### 8.4 DP 計算式
```
scoreDP = floor(totalScore × 0.2 × stageMultiplier)
rankDP  = 各クリアステージの RANK_BONUS 合計
gainedDP = scoreDP + rankDP
(敗北時は gainedDP = 0)
```

---

## 9. Enemy Database (全26体)

### Stage 1: 旅立ちの森 (昆虫系)

| Floor | 名前 | HP | ATK | WEAK | 特殊能力 |
|-------|------|----|-----|------|---------|
| 1F | プチモス | 100 | 4 | 20 | なし (通常攻撃のみ) |
| 2F | ラーバモス | 130 | 5 | 19 | なし (通常攻撃のみ) |
| 3F | 進化の繭 | 260 | 6 | 18 | **自己再生** (HP<80%時, w3): HP+20回復 / **鉄壁の守り** (w4): ダメ半減3T |
| 4F | グレート・モス | 290 | 8 | 17 | **猛毒の鱗粉** (MP>0時, w3): MP-1 + 攻撃 |
| 5F (BOSS) | 究極完全態・グレート・モス | 420 | 12 | 20 | **シーケンス** (w5): チャージ → **森の破壊衝動** (3.0倍攻撃) |

### Stage 2: 荒れ狂う荒野 (恐竜系)

| Floor | 名前 | HP | ATK | WEAK | 特殊能力 |
|-------|------|----|-----|------|---------|
| 1F | トラコドン | 150 | 7 | 19 | なし |
| 2F | ワイルド・ラプター | 280 | 8 | 18 | **俊足の連撃** (w3): 0.7倍 × 2連撃 |
| 3F | 屍を貪る竜 | 310 | 9 | 17 | **死肉の渇望** (w3): 1.0倍ドレイン攻撃 |
| 4F | 二頭を持つキング・レックス | 340 | 10 | 20 | **狂暴化** (HP<50%確定): ATK+1.0 × 10T |
| 5F (BOSS) | 剣竜 | 540 | 12 | 19 | **恐竜剣・兜割り** (w3): 2.0倍攻撃 |

### Stage 3: 誘惑の迷宮 (ハーピィ系)

| Floor | 名前 | HP | ATK | WEAK | 特殊能力 |
|-------|------|----|-----|------|---------|
| 1F | デュナミス・ヴァルキリア | 300 | 10 | 20 | **護封剣の加護** (先制): ダメ半減3T |
| 2F | ハーピィ・レディ | 330 | 11 | 19 | **誘惑の風** (MP>0, w3): MP-1 + 自己HP+20 |
| 3F | ハーピィ・レディ・SB | 360 | 12 | 18 | **サイバー・ボンテージ** (非拘束時, w8): 拘束(1投制限) + 攻撃 |
| 4F | ハーピィ・レディ三姉妹 | 390 | 13 | 17 | **トライアングル・アタック** (w3): 0.6倍 × 3連撃 |
| 5F (BOSS) | ハーピィズペット竜 | 550 | 15 | 20 | **愛の鞭・ブレス** (4T毎確定): MP全消去 + 2.0倍攻撃 |

### Stage 4: 幻想の狂宴 (トゥーン/儀式系)

| Floor | 名前 | HP | ATK | WEAK | 特殊能力 |
|-------|------|----|-----|------|---------|
| 1F | ダーク・ラビット | 380 | 13 | 20 | **トゥーン・ラッシュ** (w3): 0.7倍 × 2連撃 |
| 2F | デビル・ボックス | 420 | 14 | 19 | **死のびっくり箱** (5T目確定): 999固定ダメージ (即死級) |
| 3F | トゥーン・デーモン | 460 | 15 | 18 | **呪いの視線** (w4): MP-2 + 攻撃 |
| 4F | ブルーアイズ・トゥーン・ドラゴン | 500 | 18 | 17 | **トゥーン・スキン** (先制): 固定ガード-10 × 5T |
| 5F | サクリファイス | 550 | 16 | 20 | **幻想の儀式** (3T毎, w3): 1.2倍ドレイン攻撃 |
| 6F (BOSS) | サウザンド・アイズ・サクリファイス | 800 | 20 | 20 | **結界** (先制): バリア(10未満無効) / **千眼の邪教神** (4T毎確定): 2.0倍ドレイン |

### Stage 5 (EXTRA): 燃えたぎる火口

| Floor | 名前 | HP | ATK | WEAK | 特殊能力 |
|-------|------|----|-----|------|---------|
| FINAL | 真紅眼の黒竜 | 1500 | 25 | 20 | **黒炎弾** (5T毎確定): MP-5 + 50固定ダメージ |

### Stage 6 (GOD): 神の試練

| Floor | 名前 | HP | ATK | WEAK | 特殊能力 |
|-------|------|----|-----|------|---------|
| 1F | ワームドレイク | 400 | 20 | 19 | なし |
| 2F | ヒューマノイド・スライム | 450 | 22 | 18 | なし |
| 3F | リバイバルスライム | 300 | 18 | 20 | **再生** (w3): HP全回復 (val: 999) |
| 4F | ヒューマノイド・ドレイク | 600 | 25 | 17 | **スライムの粘着** (ロック未適用時, w3): アイテム封印2T + 攻撃 |
| 5F (BOSS) | オシリスの天空竜 | 2000 | 35 | 20 | **召雷弾** (先制): バリア(15未満無効) / **サンダー・フォース** (5T毎確定): 80固定ダメージ |

---

## 10. Card System

### 10.1 Card Constants
- デッキ: 20枚固定 (`DECK_SIZE`)
- 手札上限: 5枚 (`HAND_SIZE`)
- 同名カード上限: 3枚
- ターン開始時: MP+3, ドロー1枚
- 初回ターン: ドロー3枚

### 10.2 Card Types
- **MAGIC**: 使用時にMPを消費し即時効果。使用後は墓地へ。
- **TRAP**: MPを消費してセット (1枚のみ)。条件で自動発動後、墓地へ。
  - `trigger: "summon"` → 敵出現時に発動
  - `trigger: "attack"` → 敵の攻撃時に発動

### 10.3 Card Rarity
| レアリティ | 枠色 | 名前演出 | パック通常排出率 | 3枚目保証排出率 |
|-----------|------|---------|---------------|----------------|
| N | #555 (灰) | 白文字 | 60% | - |
| R | #c0c0c0 (銀) | 光沢白 | 30% | 80% (R以上保証) |
| SR | #ffd700 (金) | 金文字+影 | 9% | 17% |
| UR | 虹色回転 | レインボー | 1% | 3% |

### 10.4 Effect Resolution Engine (`resolveEffects`)
カード・罠の共通エフェクト実行エンジン。エフェクト配列を順番に処理する。

| type | 効果 | パラメータ |
|------|------|-----------|
| `DAMAGE` | ダメージ | `value`, `target` ("PLAYER" or 敵) |
| `DAMAGE_MULT` | ダメージ倍率変更 | `value` (罠用) |
| `HEAL` | HP回復 | `value` (数値 or "FULL") |
| `DRAW` | カードドロー | `value` (枚数) |
| `STATE_P` | プレイヤー状態変更 | `state` (オブジェクト), `msg` |
| `STATE_E` | 敵状態変更 | `state`, `stun`, `msg` |
| `DISCARD_ALL` | 手札全捨て | - |
| `DISCARD_SELECT` | 手札選択破棄 | `count` → モーダル表示後、残りエフェクトを `pendingEffectsQueue` に保存して再開 |
| `NEGATE` | 攻撃無効化 | - (罠用) |
| `REFLECT` | ダメージ反射 | `mult` (罠用) |
| `SPECIAL_SALVAGE` | 墓地回収 | 墓地のMAGICカードをランダム1枚回収 |

---

## 11. Card Database (全22枚)

### Vol.1 - Legend (11枚, 解放: Stage1クリア, 1000DP)

| ID | 名前 | レア | Type | Cost | 効果 |
|-----|------|------|------|------|------|
| 101 | 死者蘇生 | UR | MAGIC | 8 | HP完全回復 |
| 102 | サンダー・ボルト | SR | MAGIC | 6 | 100ダメ + スタン(1T) |
| 103 | 強欲な壺 | SR | MAGIC | 2 | 2枚ドロー |
| 104 | 光の護封剣 | R | MAGIC | 5 | 被ダメ半減 × 3T |
| 105 | 落とし穴 | R | TRAP | 3 | [召喚時] 50ダメ + スタン(1T) |
| 106 | 聖なるバリア | R | TRAP | 4 | [被攻撃時] 攻撃無効 + 50ダメ |
| 107 | 火の粉 | N | MAGIC | 1 | 30ダメージ |
| 108 | 治療の神 | N | MAGIC | 4 | HP+50回復 |
| 109 | はさみ撃ち | N | TRAP | 2 | [被攻撃時] 80ダメージ |
| 110 | 昼夜の大火事 | N | MAGIC | 3 | 80ダメージ |
| 111 | 突進 | N | MAGIC | 2 | 攻撃力2倍 (次の1投のみ) |

### Vol.2 - Awakening (11枚, 解放: Stage3クリア, 1500DP)

| ID | 名前 | レア | Type | Cost | 効果 |
|-----|------|------|------|------|------|
| 112 | 天使の施し | UR | MAGIC | 2 | 手札1枚捨て → 3枚ドロー |
| 113 | ブラック・ホール | SR | MAGIC | 7 | 150ダメ + 手札全捨て |
| 114 | 魔法の筒 | SR | TRAP | 4 | [被攻撃時] 攻撃無効 + ダメージ反射 |
| 115 | 巨大化 | R | MAGIC | 3 | HP≤50%: 3倍 / HP>50%: 0.5倍 (次の1投) |
| 116 | 地割れ | R | MAGIC | 3 | 40ダメ + 敵防御破壊 |
| 117 | 六芒星の呪縛 | R | TRAP | 3 | [被攻撃時] スタン + ダメ半減 |
| 118 | 守備封じ | N | MAGIC | 1 | 敵の防御状態解除 |
| 119 | 火あぶりの刑 | N | MAGIC | 2 | 60ダメージ |
| 120 | 援軍 | N | MAGIC | 2 | HP+30回復 + 次の一撃+20 |
| 121 | 闇の仮面 | N | MAGIC | 4 | 墓地のMAGICをランダム1枚回収 |
| 122 | 最終戦争 | N | MAGIC | 5 | 自傷50 + 敵に150ダメ |

---

## 12. Item System

### 12.1 アイテム効果
| Key | 名前 | アイコン | 効果 |
|-----|------|---------|------|
| potion | 薬草 | 💊 | HP +50 回復 |
| ether | 魔法の聖水 | ⚗️ | MP +3 回復 |
| seed | 命の種 | 🌱 | MaxHP +10 (HP も +10) |

### 12.2 アイテム入手 (宝箱)
- ドロップ率: 通常30%, ボス100%, WEAK HIT時100%
- 種のドロップ率: 基本15%, WEAK×2で50%, WEAK×3で100%
- 種以外: ポーション60% / エーテル40%

### 12.3 使用制限
- 投擲中 (`turnInputs.length > 0`) は使用不可
- `itemLockTurn > 0` (スライムの粘着) 中は使用不可
- カードの使用も同じ制限を共有

---

## 13. Audio Assets

### BGM
| ID | 用途 | ループ |
|----|------|--------|
| bgm-title | タイトル画面 | Yes |
| bgm-battle | 通常戦闘 | Yes |
| bgm-boss | ボス戦 | Yes |
| bgm-extra | EXTRA戦 | Yes |
| bgm-win | 勝利 | No |
| bgm-lose | 敗北 | No |

### SE (System)
`se-tap`, `se-heal`, `se-buff`, `se-warning`, `se-chest`, `se-item`

### SE (Attack)
`se-attack`, `se-hit`, `se-single`, `se-double`, `se-triple`, `se-bull`, `se-dbull`, `se-boom`, `se-weak`

---

## 14. Rating System
PPR (Points Per Round) = `(totalScore / totalDarts) * 3` から算出。

| PPR | Rating | PPR | Rating |
|-----|--------|-----|--------|
| ≥130 | Rt 17 | ≥75 | Rt 9 |
| ≥120 | Rt 16 | ≥70 | Rt 8 |
| ≥110 | Rt 15 | ≥65 | Rt 7 |
| ≥100 | Rt 14 | ≥60 | Rt 6 |
| ≥95 | Rt 13 | ≥55 | Rt 5 |
| ≥90 | Rt 12 | ≥50 | Rt 4 |
| ≥85 | Rt 11 | ≥45 | Rt 3 |
| ≥80 | Rt 10 | ≥40 | Rt 2 |
| - | - | ≥30 | Rt 1 |

---

## 15. Bluetooth Integration
- **プロトコル**: Web Bluetooth API
- **対応ボード**: DARTSLIVE (namePrefix: `'DARTSLIVE'`)
- **Service UUID**: `6e400001-b5a3-f393-e0a9-e50e24dcca9e`
- **Notify UUID**: `6e40fff6-b5a3-f393-e0a9-e50e24dcca9e`
- **データ形式**: `value.getUint8(2)` → `DL_SCORE_MAP[areaId]` → `[score, type]`
  - type: 0=シングル, 1=ダブル, 2=トリプル, 3=ブル, 4=Dブル

---

## 16. UI Screens

| 画面 | 要素ID | z-index | 表示制御 |
|------|--------|---------|---------|
| セーブスロット | `slot-screen` | 2000 | display |
| タイトル | `title-screen` | 5 | display |
| ステージ選択 | `stage-select-screen` | 10 | display |
| チャプター演出 | `chapter-screen` | 3500 | display+opacity |
| 戦闘画面 | `game-screen` | 1 | display |
| インターバル | `interval-screen` | 2500 | display |
| 汎用ダイアログ | `game-modal` | 2000 | display |
| 履歴モーダル | `history-modal` | (default) | display |
| カードショップ | `card-shop-modal` | (default) | display |
| パック開封 | `pack-result-modal` | 3000 | display |
| デッキ編集 | `collection-modal` | (default) | display |
| カード選択 | `card-selector-modal` | 4000 | display |
| カードズーム | `card-zoom-overlay` | 5000 (fixed) | display |
| 設定モーダル | `config-modal` | 9999 (fixed) | display |

---

## 17. Known Issues & Architecture Notes

### 17.1 data.js と main.js のフォーマット不一致
**解決済み**: main.js に新アトミックエンジン (`processEnemyTurn` → `executeSkill` → `resolveAction`) が実装済み。旧関数 (`enemyTurn`, `executeEnemySkill`, `doEnemyAttack`) は削除済み。

### 17.2 ハードコード箇所
- ~~`playHandCard()` 内の `card.id === 501` チェック~~ → **修正済み** (エフェクト内容 `DISCARD_SELECT` で判定するよう変更)
- `SAME_CARD_LIMIT = 3` が `addToDeck()` 内にローカル定数として定義
- ~~`renderStageSelectScreen()` のステージ一覧がハードコード~~ → **修正済み** (STAGE_MASTERベースのデータ駆動に全面書き換え)
- ~~ボス判定 `floor===5||(stage===4&&floor===6)` が3箇所に散在~~ → **修正済み** (`isBossFloor()` ヘルパーに統一)
- ~~ステージ表示名 `stage===5→EXTRA` が4箇所に重複~~ → **修正済み** (`getStageDisplayName()` ヘルパーに統一)
- ~~フロア数ハードコード (`floor>5`, `floor>6` 等)~~ → **修正済み** (`getMaxFloors()` ヘルパーに統一)

### 17.3 背景キー
**解決済み**: `getStageBackground()` ヘルパーが `STAGE_MASTER` の `img` プロパティから直接URLを返す。`GAME_DATA.bg` + `getBackgroundKey()` は廃止。Stage 4 / Stage 6 はボスフロアで自動的にboss用背景に切り替わる。

### 17.4 チートコード
- タイトル画面で `1111` を入力 → DP +5000

### 17.5 未使用変数 (軽微)
- `main.js:1656` `oldHp` (HEAL処理内)
- `main.js:2578` `last` (finishSession内)
- `main.js:2646` `dpText` (showHistory内)
