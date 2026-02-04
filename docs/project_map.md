# 🗺️ Project Architecture Map (v2.4)

## 1. ファイル構成
* `index.html`:
    * **Connect Button:** `#bt-connect-btn` (Bluetooth接続トリガー).
    * **Stage Select:** ID 1〜6 (Extra=5, Stage5=6).
    * **Modals:** Shop, Deck Edit (Detail View), History.
* `style.css`:
    * **UI Lock:** `.ui-locked` (投擲中の操作無効化).
    * **Visuals:** `.connect-btn`, `.deck-card-detail`.
* `main.js`:
    * **Core Logic:** ゲーム進行、セーブロード、データ管理。
    * **Bluetooth:** Web Bluetooth API連携ロジック。

## 2. main.js ロジックマップ (v2.4 Focus)

### A. Bluetooth Integration (New)
* `connectToBoard()`: デバイススキャンとGATT接続。
    * **Service UUID:** `6e400001-b5a3-f393-e0a9-e50e24dcca9e`
    * **Notify UUID:** `6e40fff6-b5a3-f393-e0a9-e50e24dcca9e`
* `handleBluetoothNotify(event)`: 通知受信ハンドラ。
* `DL_SCORE_MAP`: バイト値(0x14等) → スコア(20)への変換テーブル。

### B. Real-time Battle System (Refactored)
* `processOneThrow(score)`: **【重要】** 1投ごとの処理を行う中核関数。
    1. **Validation:** 入力制限チェック。
    2. **Calculation:** バフ適用、弱点判定、ギミック判定（召雷弾など）。
    3. **Execution:** ダメージ適用、HP減少アニメーション。
    4. **Flow Control:** 勝利判定 or 3投終了判定 (`finishPlayerTurn`).
* `finishPlayerTurn()`: プレイヤーのターン終了処理。敵ターンへ移行。

### C. UI & State Management
* `updateInfo()`: HP/MP表示に加え、`ui-locked` クラスの着脱（投擲中のボタン無効化）を管理。
* `renderDeckEditor()`: ホバーイベント (`showCardDetail`) のバインド。

### D. Data Structures
* `GAME_DATA`: 敵キャラ、背景画像定義。
* `CARD_DB`: 全カードのスペック定義。
* `player.state`: `itemLock` (封印), `huge` (巨大化) などのバフフラグ。

## 3. 重要な依存関係 & フロー
1. **Input Flow:**
   `Bluetooth Device` -> `handleBluetoothNotify` -> `processOneThrow`
   `Keyboard (Enter)` -> `handleEnter` -> `processOneThrow`
   
2. **Turn Flow:**
   `Tactics Phase` (Card/Item OK) -> `Input (1st Throw)` -> `Action Phase` (UI Locked) -> `processOneThrow` x3 -> `Enemy Turn` -> `Tactics Phase`