# 🗺️ Project Architecture Map (v2.5.9)

## 1. System Overview
本プロジェクトは、`index.html` (View), `style.css` (Visuals), `main.js` (Logic) の3ファイルで構成されるシングルページアプリケーション（SPA）です。
外部ライブラリには依存せず、標準の Web Bluetooth API と DOM操作のみで構築されています。

## 2. `main.js` Logic Flow & Dependencies

### A. Initialization & Setup
* **Entry Point:** `window.onload` -> `loadGameData()` -> `initSlotScreen()`.
* **Game Start:** `initGameSession()` -> `setupStage()` -> `spawnEnemy()`.
    * *Safety:* `spawnEnemy` 内で `player.state.itemLock = false` を実行し、前戦の状態異常を持ち越さない。

### B. The Battle Loop (Core)
このループがゲームの心臓部です。

1.  **Input Handling:**
    * `handleBluetoothNotify()` (BLE) or `handleEnter()` (Keyboard)
    * ↓ calls
    * `processOneThrow(score)`
2.  **Process One Throw (Action Phase):**
    * **Validation:** `restrictInput` チェック。
    * **Calculation:** `player.state` (Buffs) と `enemy.state` (Barriers) を参照して `singleDmg` を決定。
    * **Execution:** `enemy.hp` 減算、`totalScore/totalDarts` 更新（PPR用）、SE再生。
    * **Branching:**
        * Enemy Dead? -> `winBattle()`
        * 3 Throws Done? -> `finishPlayerTurn()`
3.  **Turn Transition:**
    * `finishPlayerTurn()`: プレイヤー側のバフ解除、`itemLock` 解除、`turnInputs` リセット。
    * ↓ calls
    * `enemyTurn()`: 敵のAIロジック。スキル発動 (`enemy.state` フラグセット) -> 攻撃。
    * ↓ calls
    * `endEnemyTurn()`: ターン数加算、MP回復、ドロー処理。

### C. Critical Functions Inventory (Do Not Delete)
以下の関数群は、UI操作や進行に必須であり、Minify時に消失しないよう注意が必要です。

* **Card/Item Operations:**
    * `drawCard()`: デッキから手札へ。
    * `playHandCard(index)`: カード使用のエントリーポイント。
    * `applyCardEffect(card)`: カードIDごとの効果switch文。
    * `openDiscardSelector()` / `executeDiscardAndEffect()`: 天使の施し等の処理。
    * `useItem(type)`: ポーション等の使用。
* **Shop System:**
    * `openCardShop()`: モーダル展開。
    * `buyPack()` / `drawShopCard()`: ガチャロジック。
    * `showPackResult()`: 結果表示演出。
* **Visual Helpers:**
    * `createCardElement()`: レアリティに応じたHTML構造（URの`inner-mask`含む）を生成。
    * `updateInfo()`: HPバー色、MP発光、PPR計算などのDOM更新。

## 3. CSS Architecture (`style.css`)
* **Visual Logic:** クラスベースの装飾（`.rarity-UR`, `.boss-mode`, `.player-danger`）。
* **Layout Safety:** `.card-info` に `align-items: flex-start !important` を適用し、Flexboxのレイアウト崩れを防止。
* **Effects:** `mix-blend-mode: overlay/color-dodge` を使用した「光」の表現。