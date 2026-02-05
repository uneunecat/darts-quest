# 🗺️ Project Architecture Map (v2.5.2)

## 1. ファイル構成
* `index.html`:
    * **Audio:** SE定義 (`se-single`, `se-double`... etc).
    * **Modal:** Shop, Deck, History, Card Selector.
* `style.css`:
    * **Card Styles:** `.rarity-N` 〜 `.rarity-UR` のエフェクト定義。
    * **Animations:** `@keyframes` (`sheen-move`, `holo-shimmer`, `spin-UR`).
    * **Layout Fixes:** `.card-info` (Flexbox強制左揃え).
* `main.js`:
    * **Core Logic:** ゲーム進行、セーブロード。
    * **UI Generation:** `createCardElement` (HTML構造生成).
    * **Bluetooth:** Web Bluetooth API (`connectToBoard`).

## 2. main.js ロジックマップ

### A. UI Generation (`createCardElement`)
* **役割:** カードのHTML要素を動的に生成。
* **v2.5.2 Update:**
    * `rarity === "UR"` の場合のみ、回転枠用のラッパー `<div class="inner-mask">` を追加する分岐処理を実装。
    * デッキ編集画面（極小表示）とリスト表示でクラスを分離 (`in-deck-card` / `in-list-card`)。

### B. Battle System (`processOneThrow`)
* **役割:** 1投ごとのダメージ計算と進行。
* **処理:**
    1. 入力ロック確認。
    2. ダメージ計算（バフ・弱点）。
    3. **PPR用データ更新** (`totalScore`, `totalDarts`).
    4. HP減算・演出。
    5. 勝利判定。

### C. Shop System
* `openCardShop`: パックリスト表示。
* `buyPack`: DP消費＆カード抽選。
* `showPackResult`: 結果表示（高レアリティ時はファンファーレSE変化）。

## 3. 重要なCSSクラス
* **`.card-shine`**: 全レアリティ共通のエフェクト用オーバーレイヤー（`mix-blend-mode: overlay`）。
* **`.card-info-direct`**: カード効果テキスト。`webkit-line-clamp` で3行制限しつつ、左揃えで表示。