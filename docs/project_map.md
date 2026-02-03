# 🗺️ Project Architecture Map

## 1. ファイル構成
* `index.html`: ゲームのエントリーポイント。DOM構造、Audioタグ、外部フォント読み込み。
* `style.css`: 全スタイリング。アニメーション(@keyframes)、レスポンシブ(スマホ対応)。
* `main.js`: ゲームロジックの全てを集約（約1000行）。

## 2. main.js ロジックマップ (v1.6)
コードのメンテナンス性を保つため、以下のセクション順序で記述されています。

| Section ID | 内容 | 主な関数/変数 |
|:--|:--|:--|
| **CONFIG** | ゲーム定数・設定 | `GAME_DATA`, `CARD_DB`, `PACK_DATA` |
| **STATE** | グローバル変数・状態管理 | `player`, `enemy`, `savedData`, `stage`, `floor` |
| **INIT** | 初期化・イベントリスナー | `window.onload`, `resizeGame`, `loadGameData` |
| **SCENE** | 画面遷移・スロット管理 | `initSlotScreen`, `selectSlot`, `initGameSession`, `startTransition` |
| **BATTLE_CORE** | 戦闘の基本処理 | `spawnEnemy`, `handleEnter`, `executeAttack`, `calculatePlayerDamage` |
| **CARD_LOGIC** | カード処理・効果発動 | `drawCard`, `playHandCard`, `applyCardEffect` |
| **AI_LOGIC** | 敵の行動パターン | `enemyTurn`, `doEnemyAttack`, `checkOpeningSkill` |
| **RESULT** | 決着・報酬・進行 | `winBattle`, `nextStep`, `finishSession`, `calculateStageRank` |
| **UI_UTIL** | 描画更新・演出・音声 | `updateInfo`, `triggerEffect`, `playSE`, `playBGM` |
| **SHOP** | ショップ・デッキ編成 | `openCardShop`, `buyPack`, `openCollection`, `addToDeck` |
| **INPUT** | キー入力・デバッグ | `tapKey`, `keydown event` |

## 3. 重要な依存関係・ルール
1.  **DOM IDの整合性:** `index.html` のID（例: `game-container`, `enemy-hp-value`）と `main.js` の `el()` 指定は常に一致させること。
2.  **State Management:** `savedData` は永続化されるデータ、`player`/`enemy` は戦闘中のみの一時データ。ただし v1.6 より `player` ステータスの一部はステージ間で引き継がれる。
3.  **One-File Rule:** ファイル分割は行わず、セクションコメントで区切って管理する。