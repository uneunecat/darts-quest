# Development Memories & Decisions

## 履歴 (最新が上)

### 2026-02-15: Bug Fix - Missing Battle Effects
- **事象**: 敵攻撃時のダメージ演出（SE、ポップアップ）が消失。
- **原因**: `battle.js` の `resolveAction` 内で `visual.anim` を参照していたが、正しくは `effectiveVisual.anim` であったため ReferenceError が発生し処理が中断されていた。
- **対処**: 変数名を修正し、正常に演出が再生されることを確認（ユーザー検証済み）。
- **教訓**: リファクタリング時（特に変数名変更やオブジェクトの統合時）は、影響範囲の変数参照を徹底的に確認する。

### 2026-02-15: Debug Features Implementation
- **意図**: 開発効率向上とテストの容易化。
- **変更内容**:
  - `debug.js`: デバッグマネージャー (`DebugManager`) を実装。
  - **GUIメニュー**: 画面右下の「DEBUG」ボタンから、全ステージ解放、全カード入手、DP追加、セーブデータ削除などをワンクリックで実行可能に。
  - **Stage Jump**: 任意のステージ・フロアへ即時遷移する機能 (`jumpToStage`) を実装。
  - **Auto-Resume**: デバッグ操作（リロードを伴うもの）の後、自動的に元のスロットを選択し、ジャンプ時は即座にゲームを開始するロジックを `main.js` に追加。
- **教訓**:
  - `location.reload()` はメモリ上のステートを全て消去するため、`localStorage` を用いた一時的なフラグ (`debug_last_slot`, `debug_jump_flag`) の受け渡しが不可欠。
  - `debug.js` の読み込み順序を `main.js` より前にすることで、`main.js` 初期化時に `DebugManager` が確実に利用可能になる。

### 2026-02-15: Vol.3 & Shop Carousel Update
- **意図**: 新パック "Rulers of Fate" の追加と、ショップ画面の視認性・演出強化。
- **変更内容**:
  - **Vol.3 実装**: ID 123-137 の15枚を追加。「敵攻撃力利用 (`scale`)」「状態解除 (`turn:0`)」などの新メカニクスを導入。
  - **Shop UI 刷新**: 縦スクロールリストから、3Dカルーセル (`transform-style: preserve-3d`) による横スクロール表示に変更。選択中のパックを中央に大きく表示し、没入感を向上。
  - **UI調整**: `.shop-carousel-container` を新設し、`pointer-events` の制御で中央のパックのみ購入可能にするなどUXを調整。

### 2026-02-15: Battle Effects (Exhilaration Update)
- **意図**: ダーツ命中時とラウンド終了時の演出を強化し、爽快感を高める。
- **変更内容**:
  - `visual.js`: 紫色のフラッシュ効果(`flash-purple`)、弱点破壊演出、Round Result Bonus（LOW TON, HAT TRICK, HIGH TON）のカットイン実装。
  - `style.css`: ネオン/サイバーなテキストエフェクトとアニメーション定義。
  - `battle.js`: 演出の統合と、不要な重複コード（古い `processOneThrow` 等）の削除。
- **教訓**:
  - **コードの重複に注意**: 大規模なリファクタリング後は、古い関数定義が残っていないか改めて検索（grep）して確認する。
  - **SEの選択**: ユーザーの具体的な音イメージ（「サンダーボルト風」など）を既存のSE資産でどう表現するか、組み合わせの提案が重要。

### 2026-02-15: Card Shop Redesign & Verification Protocol
- **意図**: カードショップと開封画面を「Cyber/TCG」スタイルに刷新し、ユーザーの美的感覚（黒×ネオン）に合わせる。
- **変更内容**:
  - `style.css`: ネオンカラー (#e94560, #00d2fc) を基調とした `.shop-modal-cyber`, `.result-modal-cyber` スタイルを追加。
  - `ui.js`: `openCardShop`, `showPackResult` をリファクタリングし、新しいHTML構造（Grid layout）を生成するように変更。
- **トラブル**: 「NEW!」バッジがカード枠で見切れる問題が発生。
  - **原因**: `.std-card` の `overflow: hidden` に対し、バッジを負の座標（枠外）に配置していたため。かつ、解決用の `.result-card` クラスが `ui.js` で付与されていなかった。
  - **対応**: ユーザーにより `ui.js` に `classList.add("result-card")` が追加され、CSSで `overflow: visible !important` が適用された。
- **教訓**:
  - **CSS追加時はJSも確認**: 新しいスタイルクラスを作成した際は、それを適用するJS側のロジックが実装されているか必ず「俯瞰して」確認する。
  - **検証プロトコル変更**: 今後はAIによる実装後の検証（ブラウザ操作）は行わず、ユーザー検証に委ねる（Verification Checklistのみ提示）。

### 2026-02-14: Design Guidelines Creation
- **意図**: 今後の開発Agentが、確立された「Cyber x Fantasy」の世界観を逸脱しないようにする。
- **内容**:
  - **Visual Identity**: ネオンカラー (#00d2fc, #bc13fe, #ffd700)、グリッド/ノイズテクスチャ、古代的フォント。
  - **Interaction**: 物理的衝撃（Haptic）、演出待ち時間の活用。
  - **Agent Rules**: "Make it Glow", "Make it Shake"。
- **成果物**: `design_guidelines.md` を作成。

### 2026-02-14: Battle Effect Specification (Exhilaration Update)
- **意図**: 戦闘画面の爽快感を強化し、物理的なインパクトと達成感を高める。
- **仕様策定**:
  - **Hit Impact**: 弱点破壊時の「ガラス割り」演出、強打時の画面シェイク・バイブレーション。
  - **Round Result Bonus**: 3段階のスコアボーナス演出。
    - **LOW TON (100+)**: 氷結系の「Solid Cool」。
    - **HAT TRICK (150)**: 金色の「Stylish Simple」。
    - **HIGH TON (151+)**: 虹色の「Elegant Rainbow」。
- **成果物**: `battle_effect_spec.md` を作成。

### 2026-02-14: Vol.3 Card Pack Planning (Brainstorming)
- **意図**: 新しいカードパック「Vol.3 - Rulers of Fate」のコンセプトとラインナップを策定し、戦略の幅を広げる。
- **企画内容**:
  - **テーマ**: 「Cyber x Fantasy」を継承しつつ、「運命の支配」と「リスク＆リワード」を強調。
  - **ラインナップ**: 魔法・罠カード計15枚。洗脳、フィールド破壊、HP参照ダメージなどテクニカルな効果を導入。
  - **レアリティ構成**: UR 2種, SR 3種, R 4種, N 6種。

### 2026-02-14: Gacha Effect Specification
- **意図**: パック開封（ガチャ）の演出を強化し、TCGらしい「物質的開封体験」と「射幸心」を提供する。
- **仕様策定**:
  - **Phase 1 (Peel)**: タップ/スワイプでの物理的な「パック剥ぎ取り」アクションと裂ける演出。
  - **Phase 2 (Set)**: 3枚のカードが裏面で浮遊して出現。
  - **Phase 3 (Manual Reveal)**: プレイヤーが1枚ずつタップしてめくる。レアリティに応じたSEと視覚効果（SR以上は発光・画面シェイク）。
  - **データ**: 既存の標準カードDOM (`standard` mode) を活用し、`face-down`, `glow-sr` 等のCSSクラスで状態を制御。
- **成果物**: `gacha_effect_spec.md` を作成。

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

