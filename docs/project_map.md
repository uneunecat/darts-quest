# 🗺️ Project Architecture Map (v2.4.4)

## 1. ファイル構成
* `index.html`:
    * **Connect Button:** `#bt-connect-btn` (Audio Unlockトリガー兼用).
    * **Stage Select:** ID 1〜6.
    * **Audio:** SEファイル定義（se-single〜se-dbull 追加済み）.
* `style.css`:
    * **Deck UI:** `.deck-grid .collection-card` (極小カード用スタイル) vs `.card-grid` (通常リスト用) の分離。
    * **Modal:** `#card-selector-modal` のレスポンシブ対応とテキスト表示。
* `main.js`:
    * **Core Logic:** ゲームループ、セーブロード、PPR計算。
    * **Bluetooth:** Web Bluetooth API連携。

## 2. main.js ロジックマップ

### A. Battle System (`processOneThrow`)
* **役割:** 1投ごとの処理を行う中核関数。
* **処理フロー:**
    1. 入力バリデーション（ロック中か？）
    2. ダメージ計算（バフ、召雷弾、弱点）
    3. `totalDarts` 加算 & `totalScore` 加算 **(v2.4.4 Fixed)**
    4. HP減算 & 演出（SE再生）
    5. 勝利判定 (`winBattle`) or ターン継続判定

### B. UI / UX Logic
* **PPR Display (`updateInfo`):** 正しい分母（実際に投げた数）で計算。
* **Deck Editor (`createCardElement`):** `isDeckItem` フラグに基づき、`in-deck-card` / `in-list-card` クラスを付与してスタイル制御。
* **Auto Progress:** `checkDrop`, `openChest` 内で `setTimeout` を使用した自動遷移。

### C. Bluetooth & Audio
* `connectToBoard()`:
    * 接続時に `unlockAudioContext()` を呼び出し、モバイルブラウザでのSE再生制限を解除。
* `handleBluetoothNotify()`:
    * 受信データからエリアタイプ（S/D/T/BULL）を判定し、対応するSEを再生。

## 3. 重要なデータ構造
* **`DL_SCORE_MAP`:**
    * Key: Byte Value (0x14)
    * Value: `[Score, Type]` (例: `[20, 0]` = 20点シングル)