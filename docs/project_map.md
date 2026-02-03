# 🗺️ Project Architecture Map (v1.9.1)

## 1. ファイル構成
* `index.html`: ゲームのエントリーポイント。
    * **Structure:** DOM構造、Audioタグ、Modal定義。
    * **New:** `<div id="global-tooltip">` (v1.9追加)
* `style.css`: 全スタイリング。
    * **Key Classes:** `.collection-card`, `.hand-card`, `.global-tooltip`
    * **Responsive:** `@media (max-width: 768px)`
* `main.js`: ゲームロジックの全てを集約（約1100行）。

## 2. main.js ロジックマップ
コードのメンテナンス性を保つため、以下のセクション順序で記述されています。

| Section ID | 内容 | 主な関数/変数 | 備考 |
|:--|:--|:--|:--|
| **CONFIG** | ゲーム定数・設定 | `GAME_DATA`, `CARD_DB`, `PACK_DATA` | v1.4でコスト個別化 |
| **STATE** | グローバル変数・状態管理 | `player`, `enemy`, `savedData`, `stage` | v1.6で引き継ぎ対応 |
| **INIT** | 初期化・イベントリスナー | `window.onload`, `resizeGame`, `loadGameData` | |
| **SCENE** | 画面遷移・スロット管理 | `initSlotScreen`, `selectSlot`, `initGameSession` | |
| **BATTLE_CORE** | 戦闘の基本処理 | `spawnEnemy`, `handleEnter`, `executeAttack` | ダメージ計算式・Weak判定 |
| **CARD_LOGIC** | カード処理・効果発動 | `drawCard`, `playHandCard`, `applyCardEffect` | バフ・MP消費処理 |
| **AI_LOGIC** | 敵の行動パターン | `enemyTurn`, `doEnemyAttack`, `checkOpeningSkill` | ステージ別分岐 |
| **RESULT** | 決着・報酬・進行 | `winBattle`, `nextStep`, `finishSession` | DP倍率計算 (v1.6) |
| **UI_UTIL** | 描画更新・演出・音声 | `updateInfo`, `triggerEffect`, `playSE/BGM` | BGM制御 (v1.4.2) |
| **SHOP** | ショップ・デッキ編成 | `openCardShop`, `renderDeckEditor`, `createCardElement` | UI/UX改善 (v1.7-1.9) |
| **TOOLTIP** | 情報表示制御 | `showTooltip`, `moveTooltip`, `hideTooltip` | **v1.9 New** |
| **INPUT** | キー入力・デバッグ | `tapKey`, `keydown event` | |

## 3. 重要な依存関係・ルール
1.  **DOM IDの整合性:**
    * `index.html` のID（例: `game-container`, `enemy-hp-value`）と `main.js` の `el()` 指定は常に一致させること。
2.  **State Management:**
    * `savedData`: LocalStorageに保存される永続データ（進行度、所持カード）。
    * `player`/`enemy`: 戦闘中の一時データ。ただし v1.6 より `isContinue` フラグで一部引き継がれる。
3.  **UI Components:**
    * **Card Elements:** `createCardElement` 関数でデッキ画面とパック開封画面のカードDOMを統一的に生成。
    * **Global Tooltip:** 個別のDOMではなく、単一の `#global-tooltip` をマウス位置に追従させる方式を採用 (v1.9)。
4.  **One-File Rule:**
    * ファイル分割は行わず、セクションコメントで区切って管理する。