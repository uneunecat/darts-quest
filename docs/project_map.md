# 🗺️ Project Architecture Map (v2.6.6)

## 1. File Structure
* **index.html:** アプリの骨格。`#game-screen` 内に左右パネルのレイアウトを持つ。
    * *Note:* `battle-announcer`, `active-states` は `main.js` によって動的に挿入されるため、ソースには記述されていない場合がある。
* **style.css:** 全てのデザイン定義。
    * `.announcer-visible`, `.state-chip` など、新UI用クラスが含まれる。
* **main.js:** ゲームロジックの全て。

## 2. `main.js` Code Structure (v2.6.6 Optimized)
コードは「定義順序」を厳守して構成されています。

### Section 1: Utilities & Definitions (Top of File)
* **Helper Functions:** `el`, `playSE`, `announce`, `updateStateChips` など。これらを冒頭に置くことで、どこからでも安全に呼び出せるようにしている。
* **Constants:** `GAME_DATA` (敵データ), `CARD_DB` (カード効果), `DL_SCORE_MAP` (ダーツ信号変換)。
* **Global Variables:** `player`, `enemy`, `stage`, `turnInputs` など。

### Section 2: Initialization & Event Listeners
* `window.onload` -> `resizeGame` -> `loadGameData` -> `initSlotScreen`。
* `setupStage` 内で `battle-announcer` 等のDOM要素が存在しない場合、`document.createElement` で生成・挿入する (Injection Logic)。

### Section 3: Core Battle Logic
* **`processOneThrow(score)`:** ダーツ入力時のメインループ。
    * `enemy.state` フラグを見てダメージ計算。
    * `announce` を呼んで演出。
* **`finishPlayerTurn()`:** プレイヤーフェーズ終了。状態異常（Item Lock等）の解除。
* **`enemyTurn()`:** 敵のAI。確率分岐でスキルを使用し、`enemy.state` フラグを立てる（例: `toonSkin = true`）。
* **`endEnemyTurn()`:** ターン更新、MP回復、ドロー。

### Section 4: Player Actions (UI / Card / Shop)
* **`playHandCard(index)`:** カード使用処理。`applyCardEffect` へ分岐。
* **`openCardShop()` / `buyPack()`:** ガチャシステム。
* **`updateInfo()`:** 画面描画の集約点。`updateStateChips` や `renderHand` もここから呼ばれる。

## 3. Critical Checkpoints for Future Dev
今後の改修時は、以下のポイントを遵守すること。

1.  **State Management:**
    * 敵の防御スキル等は、必ず `enemy.state` にフラグを持たせ、`processOneThrow` で判定する。「ターン数」で判定しないこと（ズレるため）。
2.  **UI Injection:**
    * HTMLを直接触らず JS だけで完結させるため、新規UI要素を追加する場合は `setupStage` 内の生成ロジックを確認・追記すること。
3.  **Function Integrity:**
    * `drawCard`, `renderHand`, `updateVisuals` は依存関係が強いため、削除や移動をする際は細心の注意を払うこと。