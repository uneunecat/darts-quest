# 🗺️ Project Architecture Map (v2.8.3)

## 1. File Structure & Responsibilities

* **index.html**: アプリケーションの骨格。
    * 静的コンテナ (`#game-screen`, `#pack-result-modal` 等) を定義。
    * 動的要素（アナウンサー、ズームオーバーレイ等）はJSによる **Injection Pattern** で生成される。
* **style.css**: デザインと演出の定義。
    * **Layered UI:** 通常UI、モーダル、オーバーレイ（ズーム/演出）のZ-index管理。
    * **Animation:** `@keyframes` による各種エフェクト（`drop-bounce`, `card-show-ur` 等）。
    * **Layout Fixes:** `!important` を用いたデッキ編集画面のレイアウト強制適用記述を含む。
* **main.js**: ゲームロジックの中枢。

## 2. `main.js` Code Structure Analysis

コードは機能ブロックごとに整理され、上から順に依存関係を持っています。

### Section 1: Utilities & Constants
* `el()`, `playSE()`, `animateValue()`
* **`announce(text, type)`:** HTMLタグを解釈し、CSSアニメーションをトリガーする通知システム。
* **`triggerEffect()`:** 画面揺れやダメージポップアップの制御。

### Section 2: Core Logic (Battle)
* **`setupStage()`:** 初期化とDOM要素の注入（Injection）。
* **`processOneThrow(score)`:** ダーツ入力処理。状態フラグ（`enemy.state`）に基づくダメージ計算。
* **`enemyTurn()`:** 敵AI。確率分岐とカットイン演出、ステート更新。

### Section 3: Shop & Gacha System (Legendary Unboxing)
* **`drawShopCard(packId)`:** パックIDに基づいたカード抽選とフィルタリング。
* **`buyPack(packId)`:** `async/await` を用いた非同期演出フロー制御。
    * Phase 1: Arrival (DOM生成、落下演出)
    * Phase 2: Charge (待機、SE再生)
    * Phase 3: Reveal (ホワイトアウト、カード順次表示)
    * Phase 4: Choice (再購入ボタン表示)

### Section 4: UI & Interaction
* **`createCardElement()`:** カードDOM生成。クリックイベントと**長押し判定(`setupLongPress`)**の付与。
* **`renderDeckEditor()` / `renderHand()`:** デッキ・手札の描画。
* **`updateInfo()`:** 画面全域のステータス更新（マスター関数）。
* **Input Handling:**
    * `window.addEventListener("keydown")`: ゲーム操作、およびガチャ演出中の入力（Enter/BS）を排他的に制御。

## 3. Development Protocols

* **State-Driven:** UIは常に内部ステート（`savedData`, `player`, `enemy`）を正として描画される。
* **Injection Safety:** `showZoomCard` や `buyPack` など、モーダルやオーバーレイを使用する機能は、実行時に必要なDOM要素が存在するかチェックし、なければ生成する自己完結型設計となっている。
* **CSS Override:** `v2.8.3` で適用されたデッキ編集画面のスタイル修正は、詳細度を高めたセレクタや `!important` を使用しているため、安易に変更しないよう注意が必要。