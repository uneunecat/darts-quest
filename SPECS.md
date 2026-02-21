# Game Specifications

## 1. Game Overview
- **タイトル**: DARTS QUEST
- **ジャンル**: ダーツ × RPG × カードゲーム (ブラウザゲーム)
- **技術構成**: Vanilla JS / HTML / CSS (フレームワーク不使用)
- **対応デバイス**: PC (900x620px スケーリング) / モバイル (フル幅レスポンシブ)
- **外部連携**: DARTSLIVE ダーツボード (Web Bluetooth API)
- **保存方式**: localStorage (3スロット制)
- **バージョン**: v4.8 (latest)

---

## 2. File Structure

| ファイル | 役割 | 行数(概算) | 読み込み順 |
|---------|------|-----------|-----------|
| `index.html` | 全画面のHTML構造 | UI骨格・Audio要素定義 | - |
| `style.css` | 全スタイル・アニメーション | カード・バトル・モーダル等 | - |
| `data.js` | マスターデータ | 845行: WORLD_MAP・カード・RELIEF_DB・定数・TIMING | 1 |
| `state.js` | グローバル状態・ユーティリティ・ステートエンジン・ステージヘルパー | 324行: Tick / Check / Utils | 2 |
| `audio.js` | サウンド管理 | 86行: BGM/SE再生・音量設定・SE_FALLBACK_MAP | 3 |
| `visual.js` | 演出処理 | 216行: エフェクト・カットイン・MPアニメーション | 4 |
| `battle.js` | 戦闘エンジン | 1311行: ProcessTurn・スキル実行・ステージセットアップ・敵出現 | 5 |
| `legacy.js` | レガシーダーツモード | 1460行: COUNT-UP・01・VS CPU | 6 |
| `ui.js` | UI描画・モーダル・レイアウト | 1675行: StageSelect(TCG)・カード生成・ショップ・デッキ | 7 |
| `debug.js` | デバッグマネージャ (GUI) | 203行: ステージジャンプ・データ操作 | 8 |
| `main.js` | エントリーポイント | 647行: 初期化・BT接続・ゲームフロー・セッション管理・セーブ | 9 |
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
  souls: 0,              // ★ ソウル (レリーフ通貨)
  bestRanks: {},         // { [stageId]: "SSS"|"S"|"A"|"B"|"C" }
  stageStats: {          // ★ v7.0: ステージ戦績 (TCGスタイル用)
    "1-1": { attempts: 10, clears: 5, maxDP: 1200, bestTurns: 8 },
    // ...
  },
  unlockedStage4: false, // Stage4解放フラグ
  deck: [],              // デッキ構成 (カードIDの配列, 20枚)
  cards: {},             // 所持カード { [cardId]: 所持枚数 }
  collection: {},        // 累計入手数
  unlockedReliefs: [],   // ★ 解放済みレリーフIDの配列
  equippedReliefs: [null, null, null]  // ★ 装備中レリーフID (3枠)
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
  "p_atk_buff":  { label: "攻撃UP", icon: "⚔️", category: "atk_mult", timing: "throw", class: "chip-p-buff" },
  "p_atk_flat":  { label: "ダメUP", icon: "⚔️", category: "atk_add",  timing: "throw", class: "chip-p-buff" },
  "e_atk_buff":  { label: "強攻",   icon: "⚔️", category: "atk_mult", timing: "round", class: "chip-e-buff" },
  "guard_ratio": { label: "ガード", icon: "🛡️", category: "dmg_mult", timing: "round", class: "chip-guard" },
  "guard_fixed": { label: "アーマー", icon: "🛡️", category: "dmg_sub", timing: "round", class: "chip-guard" },
  "barrier":     { label: "結界",   icon: "💠", category: "barrier",  timing: "round", class: "chip-barrier" },
  "charge":      { label: "溜め",   icon: "⚡", category: "charge",   timing: "round", class: "chip-charge" },
  "stun":        { label: "スタン", icon: "😵", category: "stun",     timing: "round", class: "chip-stun" },
  "item_lock":   { label: "カード封印", icon: "🔒", category: "item_lock", timing: "round", class: "chip-lock" },
  "bind":        { label: "拘束",   icon: "⛓️", category: "action_lock", timing: "throw", class: "chip-stun" }
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
| `item_lock` | カード・アイテム使用不可 | useItem / playHandCard |
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
const buffAdd = sourceObj.states
    .filter(s => STATE_MASTER[s.id]?.category === "atk_add")
    .reduce((sum, s) => sum + s.val, 0);

const buffMult = sourceObj.states
    .filter(s => STATE_MASTER[s.id]?.category === "atk_mult")
    .reduce((sum, s) => sum + s.val, 0);

let reliefAdd = 0; // レリーフ加算（プレイヤーのみ）

// 2. 計算式: (威力 + buffAdd + reliefAdd) * (1.0 + buffMult)
finalDmg = (basePower + buffAdd + reliefAdd) * (1.0 + buffMult);

// 3. 敵攻撃のみ乱数適用 (±10%)
if (applyRandom) finalDmg *= (0.9 + Math.random() * 0.2);

// 4. ★戻り値: ダメージ値 + ブレークダウン情報
return { dmg: Math.floor(finalDmg), breakdown: { base, buffAdd, reliefAdd, buffMult } };
// ※ resolveAction等、breakdown不要な呼び出し側では .dmg を参照
```

**防御力計算** (`applyDefenseLogic`):
```javascript
// 1. 結界チェック (barrier)
const maxBarrier = targetObj.states
    .filter(s => STATE_MASTER[s.id]?.category === "barrier")
    .reduce((max, s) => Math.max(max, s.val), 0);
if (dmg < maxBarrier) return isDarts ? { dmg: 0, defSub: 0 } : 0;

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

// 4. ★戻り値: isDarts時はdefSubも返却（ブレークダウン表示用）
return isDarts ? { dmg: result, defSub: dmgSub } : result;
```

**実行フロー**:
```
[プレイヤー → 敵]
  dartScore → applyOffenseLogic(score, player, false) → {dmg, breakdown}
           → applyDefenseLogic(dmg, enemy, true) → {dmg, defSub}
           → WEAK判定 → throwBreakdowns[] に記録
           → updateScoreDisplay() → サイドバーに計算式表示
           → enemy.hp -= finalDmg

[敵 → プレイヤー]
  action.mult → applyOffenseLogic(enemy.atk * mult, enemy, true).dmg
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

**tickStates(turnOwner, timing)**: Caster/Actor-Based ステート更新処理
```javascript
// turnOwner: "PLAYER" | "ENEMY"
// timing: "round" | "throw"
// 1. timing==="round" の場合: 
//    caster が turnOwner と一致するステートを減算 (自身のターン周期で減少)
// 2. timing==="throw" の場合: 
//    現在投げている本人 (turnOwner) にかかっているステートを減算 (行動回数で減少)
```

**呼び出しタイミング**:
- `tickStates("PLAYER", "round")` → プレイヤーターン開始時
- `tickStates("PLAYER", "throw")` → プレイヤーの投擲ごと
- `tickStates("ENEMY", "round")`  → 敵ターン終了時
- `tickStates("ENEMY", "throw")`  → 敵の投擲ごと

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
| `"2-2"` | 神の試練 | God's Testing Ground (GOD) | NORMAL | x4.0 | 5F | あり | 2-1クリア |
| `"2-3"` | 誇り高き決闘者の領域 | Realm of the Proud Duelist | NORMAL | x5.0 | 5F | あり | 2-2クリア |
| `"2-EX"` | 死の闇の闘技場 | Colosseum of Dark Despair | EXTRA | x6.0 | 5F | あり | 2-3クリア |

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

### Stage 2-3: 誇り高き決闘者の領域 (海馬系)

| Floor | 名前 | HP | ATK | WEAK | 特殊能力 |
|-------|------|----|-----|------|---------|
| 1F | ミノタウルス | 600 | 15 | 20 | **斧の連撃** (w4): 0.6倍 × 3連撃 |
| 2F | 闇・道化師のサギー | 550 | 12 | 19 | **死のデッキ破壊ウイルス** (w5): 手札1枚破棄 + 0.5倍攻撃 |
| 3F | ブラッド・ヴォルス | 750 | 18 | 18 | **狂暴な突進** (w4): ATK+0.5バフ(2T) + 1.2倍攻撃 |
| 4F | 青眼の白龍 | 1600 | 25 | 20 | **圧倒的な威圧感** (先制): プレイヤーATKダウン(2T) / **滅びの爆裂疾風弾** (w3): 2.5倍大ダメージ |
| 5F (BOSS) | オベリスクの巨神兵 | 3500 | 40 | 20 | **神の耐性** (先制): バリア(15未満無効) / **ゴッド・ハンド・クラッシャー** (シーケンス): チャージ・ATK2倍 → 80固定ダメ+MP全消去 |

---

## 10. Card System

### 10.1 Card Constants
- デッキ: 20枚固定 (`DECK_SIZE`)
- 手札上限: 5枚 (`HAND_SIZE`)
- 同名カード上限: 3枚
- ターン開始時: MP+3, ドロー1枚
- 初回ターン: ドロー3枚

### 10.1.1 ネタバレ防止 (未所持カード)
- **カード一覧 (`renderDeckEditor`)**: 未所持カードは画像・名前は表示するが、**効果テキスト (`desc`) を「未入手のカード」に差し替え**、タイプ (`[MAGIC]`/`[TRAP]`) も非表示。
- **カード詳細パネル (`showCardDetail`)**: 未所持カードのホバー時、効果テキストを「未入手のカード」にイタリック表示。
- **視覚スタイル**: `card-not-owned` クラスにより `grayscale(1.0) brightness(0.4)` + `opacity:0.8` のフィルター適用。

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
| `FREE_THROW` | 投擲回復 | 投擲回数を1回分巻き戻す |
| `RESURRECT` | 復活 | 死亡時にHPを`val`にする |

**拡張パラメータ (v9.0)**:
- `scale`: 動的な値を参照して `val` を決定する。
  - `{ source: "enemy_atk", factor: 1.0 }`: 敵の攻撃力 × 1.0
  - `{ source: "hand", factor: 10 }`: 現在の手札枚数 × 10
  - `{ source: "mp", factor: 10 }`: 現在のMP × 10
- `mode`: ダメージ計算モード指定
  - `"fixed"`: 固定ダメージ
  - `"current_hp_percent"`: 現在HPに対する割合ダメージ (val: 50 = 50%)
  - `"loss_hp"`: 減少HP分 (MaxHP - CurrentHP) のダメージ

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

### Vol.3 - Rulers of Fate (15枚, 解放: Stage2-1クリア, 1000DP)

| ID | 名前 | レア | Type | Cost | 効果 |
|-----|------|------|------|------|------|
| 123 | ハーピィの羽根帚 | UR | MAGIC | 2 | 敵の全バフ・防御状態を解除 |
| 124 | 洗脳-ブレインコントロール | UR | MAGIC | 3 | 敵ATK分自傷 + スタン(1T) |
| 125 | 激流葬 | SR | TRAP | 3 | [召喚時] 敵100ダメ + 自分20ダメ |
| 126 | 破壊輪 | SR | TRAP | 3 | [被攻撃時] 攻撃無効 + 敵ATK分ダメ |
| 127 | フォース | SR | MAGIC | 10 | 敵HPを減少させる (現在HPの3割) |
| 128 | スケープ・ゴート | R | MAGIC | 3 | 4回のダメージを無効化 (アーマー999x4T) |
| 129 | 団結の力 | R | MAGIC | 3 | 手札枚数×10 攻撃力UP (1投) |
| 130 | 魔導師の力 | R | MAGIC | 3 | 現在MP×10 攻撃力UP (1投) |
| 131 | 停戦協定 | R | TRAP | 2 | [召喚時] 50ダメ + スタン(1T) |
| 132 | 成金ゴブリン | N | MAGIC | 1 | 2枚ドロー + 敵HP100回復 |
| 133 | 和睦の使者 | N | TRAP | 2 | [被攻撃時] ダメージ0にする |
| 134 | 鎖付きブーメラン | N | TRAP | 2 | [被攻撃時] 無効 + 次の一撃攻撃力1.5倍 |
| 135 | 強欲な瓶 | N | TRAP | 1 | [被攻撃時] 1枚ドロー |
| 136 | 魔法除去 | N | MAGIC | 1 | 敵の結界(バリア)を破壊 |
| 137 | 痛み分け | N | MAGIC | 2 | 減少HP分(Max-Cur)のダメージを与える |

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
- アイテム封印状態 (`hasState(player, "item_lock")`) 中は使用不可
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

### SE_FALLBACK_MAP (audio.js)
カードSEなど、HTML上にAudio要素がないSEを代替再生するためのマッピング。

| 指定SE | フォールバック先 |
|--------|----------------|
| `se-water` | `se-boom` |
| `se-wind` | `se-attack` |
| `se-dark` | `se-boom` |
| `se-bell` | `se-item` |
| `se-coin` | `se-item` |
| `se-guard` | `se-buff` |
| `se-debuff` | `se-warning` |
| `se-draw` | `se-item` |
| `se-chain` | `se-warning` |
| `se-break` | `se-boom` |

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
| ステージ選択 | `stage-select-screen` | 10 | **TCGスタイル (v8.0)**: エリア別4列グリッド、カード型UI |
| チャプター演出 | `chapter-screen` | 3500 | display+opacity |
| 戦闘画面 | `game-screen` | 1 | display |
| インターバル | `interval-screen` | 2500 | display |
| 汎用ダイアログ | `game-modal` | 2000 | display |
| 履歴モーダル | `history-modal` | (default) | display |
| カードショップ | `card-shop-modal` | (default) | **3D Carousel (v9.0)**: 横スクロール・立体視UI |
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
- ~~個別フラグ管理 (`itemLockTurn` 等)~~ → **修正済み** (v5.1: `states: []` 配列へ完全移行)
- ~~投擲制限 (`bind`) が機能しない~~ → **修正済み** (`processOneThrow` 内の入力遮断ロジックを修正)
- ~~ステージ選択画面の倍率表示不整合~~ → **修正済み** (`ui.js` が `multiplier` を正しく参照するように修正)

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

**GUIデバッグメニュー (debug.js)**:
- 画面右下の「DEBUG」ボタンで開閉。
- **Unlock All Stages**: 全ステージ解放 (Rank S付与)
- **Unlock All Packs**: 全パック解放 (Unlock All Stagesと同等)
- **Gain All Cards (x3)**: 全カード x3 入手
- **Unlock All Reliefs**: 全レリーフ解放 + 全モンスター討伐済み化
- **Add 10,000 DP**: DP +10,000
- **Add 10,000 SOULS**: ソウル +10,000
- **Jump to Stage**: ステージIDとフロアを指定して即時開始 (Auto-Resume機能付き)
- **Reset Save Data**: セーブデータ全削除

---

## 18. Visual & Audio Effects (v8.5 Exhilaration Update)

### 18.1 Hit Impact & Bonuses
- **Shatter Effect**: WEAK HIT時に画面が割れるようなエフェクト (`triggerShatterEffect`)
- **Round Bonus**: ラウンドスコアに応じてカットイン表示 (`showRoundBonus`)
  - **LOW TON**: Score 100-150
  - **HIGH TON**: Score > 150
  - **HAT TRICK**: BULL x3

---

## 19. Monster Relief System (v1.6)

敵モンスターの魂「ソウル」を集めて解放・装備できる石版システム。
プレイヤーは最大3つまでレリーフを装備でき、パッシブスキルを得られる。

### 19.1 System Overview
- **入手方法**: 
  - ガチャでカード重複入手時に「ソウル」を獲得 (N:10, R:50, SR:200, UR:1000)
  - ソウルを消費してレリーフを解放 (Unlock)
- **装備**: 最大3枠。同名レリーフは1つのみ。
- **効果**: `STATIC` (常時発動) と `TRIGGER` (条件発動) の2種類。

### 19.1.1 ネタバレ防止 (レリーフ表示)
| 状態 | 画像 | 名前 | 効果 | 長押し | ホバー詳細 |
|------|------|------|------|--------|------------|
| 未討伐 (locked) | **非表示** (CSS `display:none`) | ？？？？ | 非表示 | 無効 | 「未だ見ぬ魔物の石版。討伐することで解放される。」 |
| 討伐済・未購入 (unlocked) | 表示 | 表示 | **表示** | **無効** | 名前・効果・ORIGIN表示 |
| 購入済 (owned) | 表示 | 表示 | 表示 | 有効 | 名前・効果・ORIGIN表示 |

- 未討伐: 黒背景 (`#0a0a0a`→`#1a1a1a`) + 「UNDISCOVERED」テキストが薄く中央表示
- 長押しプレビュー: `isUnlocked` が `true` の場合のみ有効

### 19.1.2 戦闘画面レリーフUI
- **スロットサイズ**: 70×70px (旧60px)
- **画像サイズ**: 85% / opacity 0.85
- **ホバーエフェクト** (装備済みスロット): `scale(1.1)` + 金色光彩 (`#ccaa44`) + `cursor:pointer` で長押し可能を示唆
- **パッシブサマリパネル**: 装備中レリーフのSTATIC効果をチップ形式で集計表示
- **トリガー発光**: 効果発動時に `relief-flash-enhanced` アニメーション (1.2s)

### 19.2 Database (RELIEF_DB)

#### Area 1
| ID | 名前 | レリーフ名 | ソウル | 効果 |
|----|------|------------|--------|------|
| 1-1-1 | 幼生の石版 | プチモス | 300 | MaxHP+30 (Static) |
| 1-1-2 | 成長の石版 | ラーバモス | 400 | ターン開始時20%でMP+1 |
| 1-1-3 | 潜伏の石版 | 進化の繭 | 600 | 被ダメ-5, ターン開始時20%でHP20回復 |
| 1-1-4 | 猛毒の石版 | グレート・モス | 1000 | 攻撃時5%でスタン(1T) |
| 1-1-5 | 森神の石版 | 究極完全態・グレート・モス | 2000 | 被ダメ-5, MaxHP+50 |
| 1-2-1 | 原始の石版 | トラコドン | 800 | 1投目ダメージ+10 |
| 1-2-2 | 俊足の石版 | ワイルド・ラプター | 1000 | 与ダメージ+5 |
| 1-2-3 | 腐敗の石版 | 屍を貪る竜 | 1500 | 敵撃破時HP50回復 |
| 1-2-4 | 王者の石版 | 二頭を持つキング・レックス | 1800 | HP50%以下で与ダメ+20 |
| 1-2-5 | 鋭牙の石版 | 剣竜 | 2000 | 固定軽減(アーマー)無視 |
| 1-3-1 | 守護天使の石版 | デュナミス・ヴァルキリア | 1200 | 被ダメ-8 |
| 1-3-2 | 狩場の石版 | ハーピィ・レディ | 1000 | ターン開始時10%でドロー |
| 1-3-3 | 魅惑の石版 | ハーピィ・レディ・SB | 1200 | 攻撃時5%で拘束+0.5倍ダメ |
| 1-3-4 | 三姉妹の石版 | ハーピィ・レディ三姉妹 | 1800 | 3投全て同じスコアなら+30ダメ |
| 1-3-5 | 寵愛の石版 | ハーピィズペット竜 | 2000 | 与ダメージ+10 |
| 1-EX-1 | 黒竜の石版 | 真紅眼の黒竜 | 2000 | 与ダメージ+15 |

#### Area 2
| ID | 名前 | レリーフ名 | ソウル | 効果 |
|----|------|------------|--------|------|
| 2-1-1 | 兎の石版 | ダーク・ラビット | 1200 | 2投目ダメージ+15 |
| 2-1-2 | 箱の石版 | デビル・ボックス | 1200 | 攻撃時10%で+30ダメ |
| 2-1-3 | 嘲笑の石版 | トゥーン・デーモン | 1500 | ターン開始時10%でMP+1 |
| 2-1-4 | 幻影龍の石版 | ブルーアイズ・トゥーン・ドラゴン | 2000 | 与ダメージ+15 |
| 2-1-5 | 儀式の石版 | サクリファイス | 2500 | 全攻撃5%ドレイン |
| 2-1-6 | 千眼の石版 | サウザンド・アイズ・サクリファイス | 3500 | 被弾時10%で無効化 |
| 2-2-1 | 寄生の石版 | ワームドレイク | 1200 | 合計Score≤60時50%でMP+1 |
| 2-2-2 | 粘着の石版 | ヒューマノイド・スライム | 1200 | 被ダメ-3, MaxHP+60 |
| 2-2-3 | 再生の石版 | リバイバルスライム | 2500 | ターン開始時30%でHP50回復 |
| 2-2-4 | 融合の石版 | ヒューマノイド_ドレイク | 2000 | バフ中与ダメ+15 |
| 2-2-5 | 雷神の石版 | オシリスの天空竜 | 5000 | 手札枚数×6ダメ加算 |
| 2-3-1 | 重斧の石版 | ミノタウルス | 2000 | バリア貫通10 |
| 2-3-2 | 道化の石版 | 闇・道化師のサギー | 1500 | 魔法コスト-1 |
| 2-3-3 | 伏兵の石版 | ブラッド・ヴォルス | 1800 | SINGLE時ダメージ+20 |
| 2-3-4 | 滅びの石版 | 青眼の白龍 | 4000 | 与ダメ+30 / 被ダメ+10 |
| 2-3-5 | 破壊神の石版 | オベリスクの巨神兵 | 5000 | 被ダメ-20 |

#### Area 2-EX
| ID | 名前 | レリーフ名 | ソウル | 効果 |
|----|------|------------|--------|------|
| 2-EX-1 | 拷問の石版 | ギル・ガース | 2500 | MP×2ダメ加算 |
| 2-EX-2 | 奈落の石版 | 地獄詩人ヘルポエマー | 2500 | 敵ATK-5 (常時) |
| 2-EX-3 | 万力の石版 | バイサー・デス | 3000 | ターン開始時15%でスタン |
| 2-EX-4 | 溶岩の石版 | 溶岩魔神ラヴァ・ゴーレム | 3500 | ターン終了時50ダメ |
| 2-EX-5 | 太陽神の石版 | ラーの翼神竜 | 5000 | ＨＰ回復効果2倍 |


### 18.1 Battle Impacts
- **Shatter Effect**: 弱点攻撃 (WEAK HIT) 時に敵画像が粉砕されるアニメーション (`anim-shatter`) ＋ 画面激震 (`shake-heavy`)。
- **Screen Flash**: 強い衝撃や効果発動時に画面全体が発光 (`flash-purple` 等)。
- **Damage Popups**: ダメージ数値を物理演算風にポップアップ。プレイヤー側と敵側で出現位置を分離。

### 18.1.1 ダメージ計算式ブレークダウン表示

左サイドバーのスコアボックス直下に、3投分のダメージ計算内訳を常駐表示。

**表示形式**: `投番号▸ 素点 +バフ +レリーフ ×倍率 -防御 ×2 WEAK →最終値`

| 要素 | 色 | 条件 |
|------|------|------|
| 投番号 `1▸` | グレー `#555` | 常時 |
| 素点 | 白 `#ddd` | 常時 |
| バフ加算 | 水色 `#4fc3f7` | buffAdd > 0 |
| レリーフ加算 | 紫 `#ce93d8` | reliefAdd > 0 |
| バフ倍率 | 水色 `#4fc3f7` | buffMult > 0 |
| 防御減算 | グレー `#888` | defSub > 0 |
| WEAK | 赤 `#ff4444` | WEAK HIT時 |
| 矢印・最終値 | 金 `#ffd700` | 補正あり時のみ |

**リセットタイミング**: 次ターンの1投目入力時（インターバル中は前ターンの式が残る）

**関連コード**: `throwBreakdowns[]` (battle.js)、`buildFormulaHTML()` (ui.js)、`.dmg-breakdown-block` (style.css)

### 18.2 Round Result Bonus
ラウンド終了時のスコアに応じてカットイン演出が発生。
| 条件 | 表示名 | スタイル | SE |
|------|-------|----------|----|
| 100-150点 | LOW TON | 青系 (Solid Cool) | `se-item` |
| 150点 (Bul x3) | HAT TRICK | 金系 (Stylish Simple) | `se-boom` x3 |
| 151点以上 | HIGH TON | 虹色 (Elegant Rainbow) | `se-item` |

### 18.3 MP Animation
- **Charge**: ターン開始時、MPドットが1つずつ光りながら回復 (`charging` クラス)。SE: `se-tap`。
- **Loss**: MP消費時、ドットが点滅して消失 (`losing` クラス)。SE: `se-debuff`。

### 17.5 未使用変数 (軽微)
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

---

## 20. UI外観

### 20.1 ゲーム画面スタイル
- **枠線**: なし (`border: none; border-radius: 0`)
- **ヴィネット効果**: `box-shadow: inset 0 0 80px rgba(0,0,0,0.4)` で画面端を自然に暗く
- **ボスモード**: `.boss-mode` — 内側赤グロー (`inset 0 0 60px rgba(255,0,0,0.25)`)
- **EXTRAモード**: `.extra-mode` — より強い赤グロー
- **背景 (body)**: 放射グラデーション `radial-gradient(ellipse at center, #0a0f1e, #000)`

### 20.2 全画面表示
- **API**: `document.documentElement.requestFullscreen()` / `document.exitFullscreen()`
- **トグル**: `toggleFullscreen()` (ui.js)
- **ボタン**: タイトル画面サブボタン「🔲 FULL」、戦闘画面右上アイコンボタン
- **スケーリング**: 全画面時 `resizeGame()` の係数が `0.95 → 1.0` に変化
- **イベント**: `fullscreenchange` でリサイズ再計算 + ボタンアイコン更新

---

## 21. Legacy Darts Mode (legacy.js)

QUESTモード以外の従来のダーツゲームモード。タイトル画面の「LEGACY」ボタンから遷移。

### 21.1 ゲームモード
| モード | 説明 |
|--------|------|
| COUNT-UP | 8ラウンド × 3投で合計スコアを競う |
| 01 | 指定点数 (301/501/701) からゼロを目指す |
| VS CPU | CPUとの対戦 (COUNT-UP形式) |

### 21.2 特徴
- QUESTモードとは独立した状態管理 (別スコープの変数群)
- Bluetooth入力・キーボード入力に対応
- 1460行の単一ファイルで3モード全てを管理
