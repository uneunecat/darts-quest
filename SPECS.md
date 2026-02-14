# Game Specifications

## 1. Game Overview
- **タイトル**: DARTS QUEST
- **ジャンル**: ダーツ × RPG × カードゲーム (ブラウザゲーム)
- **技術構成**: Vanilla JS / HTML / CSS (フレームワーク不使用)
- **対応デバイス**: PC (900x620px スケーリング) / モバイル (フル幅レスポンシブ)
- **外部連携**: DARTSLIVE ダーツボード (Web Bluetooth API)
- **保存方式**: localStorage (3スロット制)
- **バージョン**: v2.18.6 (main.js冒頭のログより)

---

## 2. File Structure

| ファイル | 役割 | 行数(概算) | 読み込み順 |
|---------|------|-----------|-----------|
| `index.html` | 全画面のHTML構造 | 340行: UI骨格・Audio要素定義 | - |
| `style.css` | 全スタイル・アニメーション | 1302行: カード・バトル・モーダル等 | - |
| `data.js` | マスターデータ | 531行: WORLD_MAP・カード・定数・TIMING | 1 |
| `state.js` | グローバル状態・ユーティリティ・ステートエンジン・ステージヘルパー | 281行: el(), wait(), 全グローバル変数, tickStates(), checkCondition(), WORLD_MAPヘルパー | 2 |
| `audio.js` | サウンド管理 | 66行: BGM/SE再生・音量設定 | 3 |
| `visual.js` | 演出処理 | 148行: エフェクト・カットイン・MPアニメーション | 4 |
| `ui.js` | UI描画・モーダル・レイアウト | 974行: resizeGame, カード生成・ショップ・デッキ・設定 | 5 |
| `battle.js` | 戦闘エンジン | 1037行: 入力・攻撃・AI・スキル・ターン管理・ステージセットアップ・敵出現・先制AI | 6 |
| `main.js` | エントリーポイント | 545行: 初期化・BT接続・ゲームフロー・セッション管理・セーブ | 7 |
| `assets/` | 画像・BGM・SE リソース | PNG/MP3 | - |

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
  1. 敵出現 (spawnEnemy) → 落とし穴トラップ判定 → 先制スキル判定
  2. インターバル画面 (PULL DARTS / TAP TO DRAW)
  3. プレイヤーターン開始 (startPlayerTurn)
     - MP +3 チャージ (1つずつアニメーション)
     - カード1枚ドロー (初回ターンのみ3枚)
  4. ダーツ投擲 (3投/ターン、拘束時は1投)
     - キーボード入力 or Bluetooth入力
     - ダメージ計算 → 敵HP減少
  5. 敵ターン (processEnemyTurn → executeSkill → resolveAction)
     - AI判定 → スキル or 通常攻撃
  6. 敵撃破 → 宝箱判定 (checkDrop) → 次フロアへ (nextStep)
  7. ボス撃破 → ステージクリア → ランク判定 → DP獲得

[ステージ進行ルート]
  Stage 1 → Stage 2 → Stage 3 → Stage 4 → Stage 6 (GOD)
                                ↘ EXTRA (PPR≥70 or クリア済み)

[ステージクリア後の選択]
  - 「次へ進む」: HP+30回復して次ステージへ (状態引継ぎ)
  - 「帰還する」: DP確定してタイトルへ
  - Stage 3クリア時: PPR≥70 or EXTRAクリア済み → EXTRA STAGE 選択肢出現
  - Stage 3クリア時: 条件未達 → 全ステージ踏破扱いでALL CLEAR
  - Stage 4クリア後「次へ進む」: Stage 6 (GOD) へ (Stage 5をスキップ)
  - Stage 5 (EXTRA) / Stage 6 (GOD) クリア: タイトルへ直帰
```

---

## 4. Data Structures

### 4.1 Player State (`player`)
```javascript
{
  hp: 100, maxHp: 100,
  mp: 3, maxMp: 10,
  items: { potion: 0, ether: 0, seed: 0 },
  states: [  // ★ v5.0: 配列形式で複数ステート管理
    { id: "p_atk_buff", val: 1.0, turn: 1 },  // 攻撃倍率2倍 (次の1投)
    { id: "guard_ratio", val: 0.5, turn: 3 }  // 被ダメ半減 (3ターン)
  ],
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
  data: null,  // WORLD_MAP floors[floor] の敵定義オブジェクトへの参照
  name: "",
  atk: 10,    // 基礎攻撃力 (data.jsのatk値を代入)
  states: [   // ★ v5.0: 配列形式で複数ステート管理
    { id: "e_atk_buff", val: 1.0, turn: 10 }, // 攻撃倍率2倍 (10ターン)
    { id: "barrier", val: 10, turn: 999 }      // バリア (10未満無効)
  ],
  actionCount: 0,     // 行動回数カウンタ
  patternQueue: [],   // シーケンス行動のキュー
  preemptiveTriggered: false  // 先制スキル発動済みフラグ
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

## 5. Constants & Master Data

| 定数名 | 値 | 用途 |
|--------|-----|------|
| `DECK_SIZE` | 20 | デッキ枚数 |
| `HAND_SIZE` | 5 | 手札上限 |
| `INITIAL_HAND` | 3 | 初期ドロー枚数 |
| `SAVE_KEY` | `"darts_quest_save"` | localStorageキー |
| `SAME_CARD_LIMIT` | 3 | 同名カード上限 (addToDeck内ローカル定数) |
| `LONG_PRESS_DURATION` | 500 | カード長押し判定(ms) (setupLongPress内ローカル) |

### 5.1 STATE_MASTER (v5.0 - ステート統合管理システム)

全てのバフ/デバフをマスターテーブルで一元管理。エンジンは `category` を参照して自動的に効果を適用。

```javascript
STATE_MASTER = {
  "p_atk_buff":  { label: "攻撃UP", icon: "⚔️", category: "atk_mult", timing: "throw" },
  "p_atk_flat":  { label: "ダメUP", icon: "⚔️", category: "atk_add",  timing: "throw" },
  "e_atk_buff":  { label: "強攻",   icon: "⚔️", category: "atk_mult", timing: "round" },
  "guard_ratio": { label: "ガード", icon: "🛡️", category: "dmg_mult", timing: "round" },
  "guard_fixed": { label: "アーマー", icon: "🛡️", category: "dmg_sub", timing: "round" },
  "barrier":     { label: "結界",   icon: "💠", category: "barrier",  timing: "round" },
  "charge":      { label: "溜め",   icon: "⚡", category: "charge",   timing: "round" },
  "stun":        { label: "スタン", icon: "😵", category: "stun",     timing: "round" },
  "item_lock":   { label: "アイテム封印", icon: "🔒", category: "item_lock", timing: "round" },
  "bind":        { label: "拘束",   icon: "⛓️", category: "action_lock", timing: "throw" }
}
```

**カテゴリ一覧**:
| category | 効果 | 適用箇所 |
|----------|------|---------|
| `atk_mult` | 攻撃倍率加算 (val: 1.0 = 2倍) | applyOffenseLogic |
| `atk_add` | 攻撃固定値加算 | applyOffenseLogic |
| `dmg_mult` | 被ダメ倍率 (val: 0.5 = 半減) | applyDefenseLogic |
| `dmg_sub` | 被ダメ固定減算 | applyDefenseLogic |
| `barrier` | ダメージ閾値 (未満無効) | applyDefenseLogic |
| `charge` | チャージ状態フラグ | UI表示・条件判定 |
| `stun` | 行動不能 | processEnemyTurn |
| `item_lock` | アイテム・カード使用不可 | useItem / playHandCard |
| `action_lock` | 投擲制限 (1投のみ) | processOneThrow |

**タイミング制御**:
- `"throw"`: 投擲ごとにカウントダウン (例: 攻撃バフ、拘束)
- `"round"`: 敵ターン終了時にカウントダウン (例: ガード、スタン)

### 5.1 WORLD_MAP データ構造 (v6.0 - STAGE_MASTER置換)

旧 `STAGE_MASTER` + `GAME_DATA.enemies` を統合した一元管理構造。ステージIDは文字列 (`"1-1"`, `"1-EX"`, `"2-1"` 等)。

```javascript
WORLD_MAP = {
  "AREA_1": {
    name: "古の森と迷宮",
    stages: [
      {
        id: "1-1", title: "旅立ちの森", sub: "Forest of Beginnings",
        type: "NORMAL", bg: "url...", bossBg: "url...",
        warning: false, multiplier: 1.0,
        bossFloor: 5, rankThresholds: { SSS: 12, S: 16, A: 22, B: 30 },
        floors: [
          { name: "プチモス", hp: 100, atk: 4, weak: 20, img: "url...", ai: [...] },
          // ... 各フロアの敵定義
        ]
      },
      // ... 他ステージ
    ]
  },
  // ... 他エリア
}
```

| プロパティ | 型 | 説明 | 例 |
|-----------|-----|------|-----|
| `id` | string | ステージID | `"1-1"`, `"1-EX"`, `"2-1"` |
| `title` | string | ステージ日本語名 | `"旅立ちの森"` |
| `sub` | string | 英語サブタイトル | `"Forest of Beginnings"` |
| `type` | string | ステージ種別 | `"NORMAL"` / `"EXTRA"` |
| `bg` | string | 通常背景URL | |
| `bossBg` | string? | ボス背景URL | |
| `floors` | array | 敵定義の配列 (=フロア数) | |
| `bossFloor` | number? | ボス扱い開始フロア (省略時=floors.length) | |
| `multiplier` | number | DP倍率 | 1.0〜5.0 |
| `warning` | boolean | チャプター演出に警告効果を使うか | |
| `rankThresholds` | object | ランク判定の基準ターン数 | `{ SSS: 12, S: 16, A: 22, B: 30 }` |

**ステージヘルパー関数** (state.js):
| 関数 | 説明 |
|------|------|
| `getStageData(stageId)` | WORLD_MAPからステージデータを検索 |
| `getNextStageId(currentId)` | 次のNORMALステージIDを取得 |
| `getStageDisplayName(stageId)` | ステージ表示名を取得 |
| `getMaxFloors(stageId)` | 最大フロア数を取得 |
| `isBossFloor(stageId, flr)` | ボスフロアかどうか判定 |
| `getStageBackground(stageId, flr)` | 背景画像URLを取得 |
| `updateStageBGM(stgId, flr)` | BGMを適切に切り替え |
| `isStageUnlocked(stageId)` | ステージ解放済みか判定 |

---

## 6. Battle System (v5.0 - ステート・スキャナー方式)

### 6.1 Damage Calculation

**攻撃力計算** (`applyOffenseLogic`):
```javascript
// 1. ステートをスキャンして効果を集計
const multBonus = sourceObj.states
    .filter(s => STATE_MASTER[s.id]?.category === "atk_mult")
    .reduce((sum, s) => sum + s.val, 0);

const addBonus = sourceObj.states
    .filter(s => STATE_MASTER[s.id]?.category === "atk_add")
    .reduce((sum, s) => sum + s.val, 0);

// 2. 計算式: (威力 + 加算) * (1.0 + 倍率)
finalDmg = (basePower + addBonus) * (1.0 + multBonus);

// 3. 敵攻撃のみ乱数適用 (±10%)
if (applyRandom) finalDmg *= (0.9 + Math.random() * 0.2);
```

**防御力計算** (`applyDefenseLogic`):
```javascript
// 1. 結界チェック (barrier)
const maxBarrier = targetObj.states
    .filter(s => STATE_MASTER[s.id]?.category === "barrier")
    .reduce((max, s) => Math.max(max, s.val), 0);
if (dmg < maxBarrier) return 0;

// 2. 倍率防御 (dmg_mult) - 複数あれば積算
const dmgMult = targetObj.states
    .filter(s => STATE_MASTER[s.id]?.category === "dmg_mult")
    .reduce((prod, s) => prod * s.val, 1.0);
finalDmg *= dmgMult;

// 3. 固定減算 (dmg_sub) - 複数あれば合計
const dmgSub = targetObj.states
    .filter(s => STATE_MASTER[s.id]?.category === "dmg_sub")
    .reduce((sum, s) => sum + s.val, 0);
finalDmg = Math.max(0, finalDmg - dmgSub);
```

**実行フロー**:
```
[プレイヤー → 敵]
  dartScore → applyOffenseLogic(score, player, false)
           → applyDefenseLogic(dmg, enemy, true)
           → enemy.hp -= finalDmg

[敵 → プレイヤー]
  action.mult → applyOffenseLogic(enemy.atk * mult, enemy, true)
              → triggerTrap('attack', dmg) (罠判定)
              → applyDefenseLogic(dmg, player, false)
              → player.hp -= finalDmg

[カード → 敵]
  mode="fixed" → dmg = action.val (ATK計算スキップ)
              → applyDefenseLogic(dmg, enemy, false)
              → enemy.hp -= finalDmg
```

### 6.2 Weak Point System
- 各敵に `weak` 値 (17, 18, 19, 20) が設定
- `score >= 51` かつ `score % weak === 0` → WEAK HIT
- WEAK HIT効果: 宝箱ドロップ率100%保証、命の種ドロップ率上昇

### 6.3 JUST FINISH
- 敵HPをちょうど0にすると発動 (singleDmg === enemy.hp の厳密一致)
- 効果: MaxHP +10 & HP +10 回復

### 6.4 State Management (`tickStates` / `hasState`) — state.js

**tickStates(turnOwner)**: Caster-Based ステートカウントダウン処理
```javascript
// turnOwner: "PLAYER" | "ENEMY"
// player と enemy 両方のステートをスキャン
[player, enemy].forEach(obj => {
    // 1. caster が turnOwner と一致し、timing が "round" のステートのみ減算
    obj.states.forEach(s => {
        const master = STATE_MASTER[s.id];
        if (master && master.timing === "round" && s.caster === turnOwner) {
            s.turn--;
        }
    });
    // 2. 0になったステートを削除 (ログ出力付き)
    obj.states = obj.states.filter(s => s.turn > 0);
});
```

**呼び出しタイミング**:
- `tickStates("PLAYER")` → プレイヤーターン終了時 (投擲ステートは別途処理)
- `tickStates("ENEMY")` → 敵ターン終了時 (endEnemyTurn内)

**hasState(obj, category)**: 特定のステートを持っているか判定
```javascript
return obj.states.some(s => STATE_MASTER[s.id]?.category === category);

// 使用例:
if (hasState(player, "action_lock")) { /* 拘束中 */ }
if (hasState(enemy, "stun")) { /* スタン中 */ }
```

### 6.5 Turn Flow (詳細)
```
[インターバル] (isInterval = true, 入力遮断)
  ↓ タップ/Enter
[startPlayerTurn]
  → MP +3 チャージアニメーション (1ずつ150ms間隔)
  → カード1枚ドロー (初回のみ3枚を250ms間隔)
  → currentTurn++
  ↓
[ダーツ投擲フェーズ] (最大3投、拘束時は1投のみ)
  → processOneThrow(score):
     - 拘束判定: isBound = hasState(player, "action_lock")
     - ダメージ計算
     - tickStates(player, "throw") / tickStates(enemy, "throw")
     - 拘束中なら1投で強制終了 + ステート削除
  → 敵HP 0 → winBattle → checkDrop → nextStep
  → 3投完了 → finishPlayerTurn
  ↓
[finishPlayerTurn]
  → totalGameTurns++
  → processEnemyTurn()
  ↓
[processEnemyTurn]
  → スタン判定: hasState(enemy, "stun") → ログ出力して終了
  → actionCount++
  → AI行動選択 (patternQueue → guaranteed → weight抽選)
  → executeSkill → resolveAction (各アトムを順番に実行)
  ↓
[endEnemyTurn]
  → tickStates(enemy, "round") / tickStates(player, "round")
  → preparePlayerTurn (インターバルへ戻る)
```

---

## 7. Enemy AI System

### 7.1 アトミック・スキル・エンジン (v3.0)

**解決済み**: data.js と main.js のフォーマットは統一されている。

- **data.js**: `actions` 配列にアトム(効果単位)を記述
- **battle.js**: `processEnemyTurn` → `executeSkill` → `resolveAction` で実行
- 旧関数 (`enemyTurn`, `executeEnemySkill`, `doEnemyAttack`) は削除済み

```javascript
// 統一されたスキル形式 (data.js / CARD_DB 共通)
{
  name: "スキル名",
  weight: 3,
  cond: { src: "e_hp", op: "lt", val: 80 },
  visual: { cutin: { text: "...", color: "..." }, se: "se-xxx", msg: "..." },
  actions: [{ type: "HEAL", target: "ENEMY", val: 20 }, { type: "DAMAGE", target: "PLAYER", mult: 1.0 }]
}
```

### 7.2 AI Condition System (`cond` / `checkCondition`) — state.js

| src | 説明 | op | 例 |
|-----|------|-----|-----|
| `e_hp` | 敵HP% | lt/gt/eq/lte/gte | `{src:"e_hp", op:"lt", val:50}` |
| `p_hp` | プレイヤーHP% | 同上 | |
| `p_mp` | プレイヤーMP | 同上 | |
| `hand` | プレイヤー手札数 | 同上 | |
| `turn` | 敵行動回数 | 同上 | |
| `turn_mod` | 行動回数の剰余 | (特殊) | `{src:"turn_mod", val:4}` → 4の倍数ターン |
| `p_state` | プレイヤーの状態 | (特殊) | `{src:"p_state", tag:"action_lock", val:false}` |
| `e_state` | 敵自身の状態 | (特殊) | `{src:"e_state", tag:"atk_mult", val:0}` |
| `trap` | 罠セット有無 | (特殊) | `{src:"trap", val:true}` |

**v5.0 更新**: `p_state`/`e_state` は **category** (`tag`) で状態を検索し、該当ステートの残りターン数を返します。
```javascript
case "p_state":
case "e_state":
    const obj = (c.src === "p_state") ? player : enemy;
    const state = obj.states.find(s => STATE_MASTER[s.id]?.category === c.tag);
    targetVal = state ? state.turn : 0;
    break;
```

**使用例**:
- `{src:"e_state", tag:"atk_mult", val:0}` → 敵に攻撃バフが**ない**場合に発動 (狂暴化スキル用)
- `{src:"p_state", tag:"action_lock", val:false}` → プレイヤーが拘束されていない場合に発動

### 7.3 AI Action Selection Priority
1. `patternQueue` にシーケンスが残っていれば最優先で消化
2. 条件を満たし、かつ `preemptive` でないアクションをフィルタ
3. `guaranteed: true` のアクションがあれば確定発動
4. なければ `weight` による加重ランダム抽選
5. フォールバック: 通常攻撃 (mult: 1.0)

---

## 8. Stage & Enemy Database

### 8.1 Stage Master (WORLD_MAP)

| ID | 名称 | 英名 | Type | DP倍率 | フロア数 | 警告演出 | 解放条件 |
|----|------|------|------|--------|---------|---------|---------|
| `"1-1"` | 旅立ちの森 | Forest of Beginnings | NORMAL | x1.0 | 5F | なし | 初期解放 |
| `"1-2"` | 荒れ狂う荒野 | Raging Wasteland | NORMAL | x1.5 | 5F | なし | 1-1クリア |
| `"1-3"` | 誘惑の迷宮 | Labyrinth of Temptation | NORMAL | x2.0 | 5F | なし | 1-2クリア |
| `"1-EX"` | 燃えたぎる火口 | Burning Crater (EXTRA) | EXTRA | x5.0 | 1F | あり | 1-3クリア |
| `"2-1"` | 幻想の狂宴 | Toon Nightmare | NORMAL | x3.0 | 6F | あり | 1-3クリア |
| `"2-2"` | 神の試練 | God's Testing Ground (GOD) | NORMAL | x5.0 | 5F | あり | 2-1クリア |

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
- Stage 5 (EXTRA) をステージ選択から再挑戦するには `clearedExtra` が必要

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
| 4F | 二頭を持つキング・レックス | 340 | 10 | 20 | **狂暴化** (atkBuff未適用時, 確定): ATK+1.0 × 10T |
| 5F (BOSS) | 剣竜 | 540 | 12 | 19 | **恐竜剣・兜割り** (w3): 2.0倍攻撃 |

### Stage 3: 誘惑の迷宮 (ハーピィ系)

| Floor | 名前 | HP | ATK | WEAK | 特殊能力 |
|-------|------|----|-----|------|---------|
| 1F | デュナミス・ヴァルキリア | 300 | 10 | 20 | **護封剣の加護** (先制): ダメ半減3T |
| 2F | ハーピィ・レディ | 330 | 11 | 19 | **誘惑の風** (MP>0, w3): MP-1ドレイン(敵HP+20) |
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
  - `trigger: "summon"` → 敵出現時に発動 (落とし穴)
  - `trigger: "attack"` → 敵の攻撃時に発動 (バリア、筒、呪縛、はさみ撃ち)

### 10.3 Card Rarity
| レアリティ | 枠色 | 名前演出 | パック通常排出率 | 3枚目保証排出率 |
|-----------|------|---------|---------------|----------------|
| N | #555 (灰) | 白文字 | 60% | - |
| R | #c0c0c0 (銀) | 光沢白 | 30% | 80% (R以上保証) |
| SR | #ffd700 (金) | 金文字+影 | 9% | 17% |
| UR | 虹色回転(hue-rotate) | レインボー | 1% | 3% |

### 10.4 Atomic Action Engine (`resolveAction`)
カード・敵スキル・罠の共通エフェクト実行エンジン。`actions` 配列のアトムを順番に処理する。

| type | 効果 | パラメータ |
|------|------|-----------|
| `DAMAGE` | ダメージ | `target`, `mult`(ATK倍率) or `mode:"fixed",val`(固定), `count`(連撃), `drain`(吸収) |
| `DAMAGE_MULT` | ダメージ倍率変更 | `val` (罠用: 受けるダメージに乗算) |
| `HEAL` | HP回復 | `target`, `val` (数値 or 9999で全回復) |
| `DRAW` | カードドロー | `val` (枚数) |
| `STATE` | 状態変更 | `target`, `kind`, `val`, `turn` (下記kind表参照) |
| `MP_ACTION` | MP増減 | `target`, `val` (負数で減少), `drain`(true=敵HP回復) |
| `DISCARD_ALL` | 手札全捨て | - |
| `DISCARD_SELECT` | 手札選択破棄 | `count` → モーダル表示後、非同期で待機 |
| `NEGATE` | 攻撃無効化 | - (罠用) |
| `REFLECT` | ダメージ反射 | `mult` (罠用: 元ダメージ × mult を敵に反射) |
| `SPECIAL_SALVAGE` | 墓地回収 | 墓地のMAGICカードをランダム1枚回収 |

**STATE kind 一覧** (v5.0 - STATE_MASTERに準拠):
| kind | 効果 | category | timing | 対象 |
|------|------|----------|--------|------|
| `p_atk_buff` | 攻撃倍率バフ | atk_mult | throw | P |
| `p_atk_flat` | 攻撃固定値加算 | atk_add | throw | P |
| `e_atk_buff` | 攻撃倍率バフ | atk_mult | round | E |
| `guard_ratio` | 割合軽減ガード | dmg_mult | round | P/E |
| `guard_fixed` | 固定値軽減ガード | dmg_sub | round | E |
| `barrier` | バリア (閾値未満無効) | barrier | round | E |
| `charge` | チャージ状態 | charge | round | E |
| `item_lock` | アイテム封印 | item_lock | round | P |
| `bind` | 拘束 (1投制限) | action_lock | throw | P |
| `stun` | スタン (1T行動不能) | stun | round | E |
| `break_guard` | 防御状態解除 | (特殊処理) | - | E |

**注**: `break_guard` は states配列から `dmg_mult`, `dmg_sub` のステートを削除する特殊効果。

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
- インターバル中もアイテムボタンは `disabled` 表示

---

## 13. Audio Assets

### BGM
| ID | 用途 | ループ |
|----|------|--------|
| bgm-title | タイトル画面 | Yes |
| bgm-battle | 通常戦闘 | Yes |
| bgm-boss | ボス戦 (Stage 5/6 開始時も使用) | Yes |
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

### 17.1 data.js と battle.js のフォーマット不一致
**解決済み**: battle.js に新アトミックエンジン (`processEnemyTurn` → `executeSkill` → `resolveAction`) が実装済み。旧関数 (`enemyTurn`, `executeEnemySkill`, `doEnemyAttack`) は削除済み。

### 17.2 ハードコード箇所
- ~~`playHandCard()` 内の `card.id === 501` チェック~~ → **修正済み** (エフェクト内容 `DISCARD_SELECT` で判定するよう変更)
- `SAME_CARD_LIMIT = 3` が `addToDeck()` 内にローカル定数として定義
- ~~`renderStageSelectScreen()` のステージ一覧がハードコード~~ → **修正済み** (STAGE_MASTERベースのデータ駆動に全面書き換え)
- ~~ボス判定 `floor===5||(stage===4&&floor===6)` が3箇所に散在~~ → **修正済み** (`isBossFloor()` ヘルパーに統一)
- ~~ステージ表示名 `stage===5→EXTRA` が4箇所に重複~~ → **修正済み** (`getStageDisplayName()` ヘルパーに統一)
- ~~フロア数ハードコード (`floor>5`, `floor>6` 等)~~ → **修正済み** (`getMaxFloors()` ヘルパーに統一)

### 17.3 背景キー
**解決済み**: `getStageBackground()` ヘルパー (state.js) が `WORLD_MAP` の `bg` / `bossBg` プロパティから直接URLを返す。`GAME_DATA.bg` + `getBackgroundKey()` は廃止。ボスフロアで自動的にboss用背景に切り替わる。

### 17.4 デバッグ機能 (v2.18.6+)

**キーボードショートカット** (戦闘画面のみ有効):
| キー | 効果 | 説明 |
|------|------|------|
| `K` | 敵即死 | enemy.hp = 0 + winBattle() |
| `M` | MP全快 | player.mp = player.maxMp |
| `H` | HP全快 | player.hp = player.maxHp |

**デバッグジャンプ関数** (コンソール):
```javascript
// 使用例: DJ(3, 2) → ステージ3の2Fへ強制ジャンプ
window.DJ = function(stage, floor) {
  // 1. 画面・BGMリセット
  // 2. プレイヤー状態初期化 (HP/MP全快, 手札3枚)
  // 3. stage/floorをセットして spawnEnemy()
  // 4. インターバルをスキップして即戦闘開始
};
```

**チートコード**:
- タイトル画面で `1111` を4回入力 → DP +5000

### 17.5 未使用変数 (軽微)
- `battle.js` `oldHp` (useItem内で宣言されるが参照なし)
- `ui.js` `pprDisp`, `rtDisp` (showHistory内で宣言されるが未使用)
- `state.js` `reject` (preloadImage内のPromiseコールバック)

### 17.6 main.js の分割 (解決済み)
**解決済み (v2.18.6)**: main.js (2838行) を6ファイルに分割。詳細は MEMORIES.md 参照。

### 17.7 ファイル責務リファクタリング (解決済み)
**解決済み**: 分割後に残っていた責務外の関数を適切なファイルへ再配置。
- ステートエンジン・ステージヘルパー → state.js (battle.js/main.jsから移動)
- 戦闘セットアップ・敵出現・先制AI → battle.js (main.jsから移動)
- セッション管理・セーブ管理 → main.js (ui.jsから移動)
- resizeGame → ui.js (visual.jsから移動)
- `triggerEncounterEffects()` の重複定義を解消、`checkCondition()` のデッドコードを除去
