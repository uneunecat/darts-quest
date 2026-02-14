# Development Memories & Decisions

## 履歴 (最新が上)

### 2026-02-14: Stage Selection Redesign (TCG Style)
- **意図**: ステージ選択画面のUX向上と、コレクション性の強化。
- **変更内容**:
  - **UI**: 縦スクロール・グリッドレイアウト（エリア別・4列）に変更。カード型デザインを採用し、ランク（SSS/S等）や戦績（クリア回数・最高DP）を表示。
  - **データ**: `savedData.stageStats` を追加し、ステージごとの詳細な戦績を記録。
  - **演出**: 未解禁ステージの「裏側表示 (LOCKED)」、レアリティに応じたフレーム色、SSSランクの虹色アニメーション等を実装。
- **技術的工夫**:
  - `renderStageSelectScreen` を全面的に書き換え。エリアごとにコンテナを作成し、`display: contents` や `grid` を活用してレスポンシブなレイアウトを実現。
  - CSSアニメーション (`rainbow-anim`, `gold-anim`) でリッチな質感を表現。
  - `isStageUnlocked` ヘルパーを活用し、ロック状態の判定ロジックを分離。

---

### 2026-02-14: ファイル責務リファクタリング
- **意図**: 分割後の各ファイルに責務外の関数が残っていたため、適切なファイルへ再配置。
- **state.js に追加** (battle.js/main.js から移動):
  - ステートエンジン: `tickStates()`, `hasState()`, `getCalculatedWait()`, `checkCondition()`
  - WORLD_MAPヘルパー: `getStageData()`, `getNextStageId()`, `getStageDisplayName()`, `getMaxFloors()`, `isBossFloor()`, `getStageBackground()`, `updateStageBGM()`, `isStageUnlocked()`, `preloadImage()`
- **battle.js に追加** (main.js から移動):
  - `setupStage()`, `spawnEnemy()`, `triggerEncounterEffects()`, `handlePreemptiveAI()`
- **main.js に追加** (ui.js から移動):
  - `calculateStageRank()`, `finishSession()`, `resetSaveData()`, `exportSave()`, `importSave()`
- **ui.js に追加** (visual.js から移動):
  - `resizeGame()`
- **バグ修正**:
  - `triggerEncounterEffects()` が main.js 内に2回定義されていた問題を解消（1つに統合してbattle.jsへ）
  - `checkCondition()` 内の `break` 後の到達不能 `return` 文を除去
- **影響範囲**: state.js, battle.js, main.js, ui.js, visual.js。ゲーム挙動は変化なし（関数移動のみ）。

---

### 2026-02-14: コード品質向上 (定数化 + エラーハンドリング)
- **意図**: 保守性向上とゲーム進行の安定性確保。
- **Task 1: マジックナンバーの定数化**
  - `data.js` に `TIMING` 定数オブジェクトを追加（32項目）
  - 演出タイミングの数値リテラルを定数に置換: `battle.js` (15箇所), `main.js` (10箇所), `visual.js` (7箇所)
  - **成果**: 演出タイミングが一元管理され、調整が容易に。コード可読性が向上。
- **Task 2: エラーハンドリング追加**
  - 7つの重要な非同期関数に try-catch を追加: `processOneThrow`, `processEnemyTurn`, `executeSkill`, `resolveAction`, `triggerTrap`, `playHandCard`, `handlePreemptiveAI`
  - エラー時の動作: エラーログ出力 → ゲーム内通知 → `isProcessing` リセット → `preparePlayerTurn()` で復帰
  - **成果**: ゲームが完全に止まるリスクを軽減。エラー発生時も可能な限りゲーム続行。
- **方針**: 過剰な try-catch は避け、ゲーム進行が止まる可能性がある箇所のみに適用。
- **影響範囲**: `battle.js` (6関数), `main.js` (1関数), `data.js` (定数追加), `visual.js` (定数適用)

---

### 2026-02-13: main.js 分割 (モジュール化 Step1-3)
- **意図**: main.js (2839行) の肥大化を解消し、保守性を向上させるため6ファイルに分割。
- **方針**: モジュールシステム不使用。`<script>` タグの読み込み順で依存を解決。グローバル関数・変数はそのまま維持。コードの移動のみ、ロジック変更なし。
- **最終構成 (読み込み順)**:
  1. `data.js` — 定数・マスタデータ (既存、変更なし)
  2. `state.js` (92行) — el(), calculateRating(), shuffleArray(), wait(), グローバル変数全て
  3. `audio.js` (66行) — gameConfig, loadGameConfig(), saveGameConfig(), stopAllBGM(), playBGM(), updateCurrentBgmVolume(), playSE()
  4. `visual.js` (118行) — triggerFloatText(), triggerEffect(), resizeGame(), announce(), addLog(), showSkillCutin()
  5. `battle.js` (876行) — handleEnter(), processOneThrow(), checkCondition(), triggerTrap(), executeSkill(), resolveAction(), applyOffenseLogic(), applyDefenseLogic(), processEnemyTurn(), endEnemyTurn(), preparePlayerTurn(), startPlayerTurn(), winBattle(), loseGame(), checkDrop(), openChest(), nextStep(), useItem(), drawCard(), playHandCard(), executeSalvageMagic()
  6. `ui.js` (1042行) — openDiscardSelector(), renderHand(), updateInfo(), openCardShop(), buyPack(), startPackOpening(), proceedUnboxing(), createCardElement(), showDialog(), calculateStageRank(), finishSession(), showHistory(), updateScoreDisplay(), openConfigModal(), openStageSelect(), renderStageSelectScreen() 等
  7. `main.js` (645行) — エントリーポイント: 初期化, BT接続, スロット管理, タイトル, ステージヘルパー, ゲームフロー(initGameSession, startTransition, setupStage, spawnEnemy), イベントハンドラ(keydown, keyup, mousedown), returnToTitle()
- **読み込み順の根拠**: battle.js → ui.js → main.js。相互参照する関数は実行時に解決される（定義時には未定義でも問題なし）。
- **注意**: triggerEncounterEffects() が main.js 内に2回定義されている（元のコードのまま維持）。
- **合計行数**: 2839行 (分割前と同一、コード増減なし)

---
### 2026-02-12: スプリングクリーニング (拡張性リファクタリング)
- **意図**: TECH.md 基準で最も拡張性が低い3箇所を特定し、データ駆動設計に全面刷新。
- **変更1 (STAGE_MASTER拡張)**: `displayName`, `floors`, `bossFloor`, `img` を追加。`renderStageSelectScreen()` をハードコード配列から `Object.entries(STAGE_MASTER)` ループに書き換え。解放判定は `isStageUnlocked()` に一元化。
- **変更2 (ボス/フロア判定統一)**: `isBossFloor()`, `getMaxFloors()` ヘルパーを新設。`floor===5||(stage===4&&floor===6)` の3箇所散在パターンを全て置換。`checkDrop()`, `nextStep()` のフロア数ハードコードも統一。
- **変更3 (表示名DRY化)**: `getStageDisplayName()` ヘルパーで4箇所のコピペを統一。
- **変更4 (背景管理統合)**: `GAME_DATA.bg` + `getBackgroundKey()` を廃止し、`STAGE_MASTER.img` + `getStageBackground()` に統合。Stage 6 にボス用背景 `bg_stage5_2.png` を新規追加。
- **設計判断 (bossFloor)**: Stage 4 は `floors:6, bossFloor:5` とし、Floor 5 (サクリファイス) と Floor 6 (1000 Eyes) の両方にボスBGM・100%ドロップを適用（既存挙動を維持）。他ステージは `bossFloor` 省略で `floors` 値にフォールバック。
- **影響範囲**: data.js (STAGE_MASTER), main.js (約15箇所)。ゲーム挙動は変化なし（リファクタリングのみ）。Stage 6 ボス背景は新機能。

---
### 2026-02-12: 旧カードID ハードコード修正
- **意図**: `playHandCard()` 内の `card.id === 501` を、エフェクト内容 (`DISCARD_SELECT`) による判定に変更。
- **理由**: 旧ID(501)はカードDB再採番で112に変更済みだったが、ロジック側が追従しておらず「天使の施しを手札1枚で使えてしまう」バグが潜在していた。TECH.md の Generality / Data-Driven Design 原則に従い、IDではなくエフェクトの有無で判定するよう修正。
- **影響範囲**: `playHandCard()` のみ。他のカード処理 (`resolveEffects` 等) は影響なし。
- **注意点**: 今後 DISCARD_SELECT エフェクトを持つカードを追加した場合も自動的にガードが効く。

---
### 2026-02-12: 初回コード解析 & SPECS.md 構築
- **意図**: 4ファイル (index.html, style.css, main.js, data.js) を全文読み込み、ゲーム仕様を SPECS.md に体系的に記録。
- **発見事項 (再検証結果)**:
  - ~~data.js と main.js のフォーマット不一致~~ → 新アトミックエンジン (`processEnemyTurn` → `executeSkill` → `resolveAction`) が既に実装済みで解決済み。
  - `playHandCard()` に旧カードID (501) のハードコードが残存 → **上記で修正済み**。
  - ~~`GAME_DATA.bg` のキー不一致~~ → `getBackgroundKey()` ヘルパーが文字列キーを生成しており解決済み。
- **教訓**: git status に staged/unstaged 両方の変更がある場合、ディスク上の最新コードと初回読み取り結果が食い違う可能性がある。必ず問題箇所を直接再読み取りしてから判断すること。

---
### 2026-02-12: Claude Code システム導入
- **意図**: .md ファイルによる外部脳システムを構築し、記憶の混濁を防止。
