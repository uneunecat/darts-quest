# 🗺️ Project Architecture Map (v2.7.0-beta)

## 1. File Structure & Responsibilities

* **index.html**: アプリケーションの「骨格」。
    * 静的なコンテナ (`#game-screen`, `#title-screen`, `#modal-overlay`) を定義。
    * **Dynamic Injection:** `#battle-announcer` や `#active-states` はHTML内には記述せず、JS側で生成・挿入する設計となっている（HTML変更漏れ防止のため）。
* **style.css**: アプリケーションの「装飾と挙動」。
    * CSS Animation (`.shake`, `.flash`, `.cutin`) による演出定義。
    * **HUD Layout:** `#battle-announcer` に対する `flex-direction: column` 指定など、JSのロジックと密結合なスタイル定義が含まれる。
* **main.js**: アプリケーションの「脳」。
    * Bluetooth通信、ゲームループ、状態管理、DOM操作の全てを担う。

## 2. `main.js` Code Structure Analysis

コードは機能ごとに明確なセクションに分かれており、上から順に読み込まれることを前提としています。

### Section 1: Utilities & Constants
* **Helper Functions:** `el(id)`, `playSE(id)`, `animateValue()`, `triggerEffect()`
    * **`announce(text, type)`:** **[v2.7 Modified]** `innerHTML` を受け付け、クラス付与によるアニメーション発火を行う。
    * **`addLog(text, type)`:** **[v2.7 Modified]** ログのフィルタリングロジック（`倒した` `宝箱` 除外）を含む。
* **Data Definitions:** `GAME_DATA` (Enemy/Stage), `CARD_DB` (Card Specs), `PACK_DATA` (Shop), `DL_SCORE_MAP` (Signal).

### Section 2: Core State & Initialization
* **Global State:** `player`, `enemy`, `stage`, `turnInputs` など。
* **`setupStage()`:** ゲーム初期化。
    * **Injection Logic:** `document.getElementById("battle-announcer")` が存在しない場合、`document.createElement` で生成し `enemy-panel` に挿入する安全装置が実装されている。

### Section 3: Battle Logic (The Loop)
* **`processOneThrow(score)`:** ダーツ入力時のメイン処理。
    * 1. 入力バリデーション & 演出
    * 2. ダメージ計算（`enemy.state` 参照: ToonSkin, Barrier, Guard）
    * 3. HP更新 & 判定（撃破 ? 次のターン ?）
* **`enemyTurn()`:** 敵AI。
    * 確率/条件分岐によるスキル選択。
    * スキル発動時は `showSkillCutin` を呼び、遅延実行で `doEnemyAttack` へ。

### Section 4: UI Rendering & Player Actions
* **`updateInfo()`:** 描画のマスター関数。全てのステータス変更後に必ず呼ばれる。
    * **`updateStateChips()`:** **[v2.7 Modified]** 敵の状態（`guard`, `guardType`, `toonSkin` 等）のみをチップとして描画。プレイヤーの状態は除外。
    * **`updateVisuals()`:** 旧来のバッジ表示制御（敵ガードバッジは強制非表示）。
* **`applyCardEffect(card)`:** **[v2.7 Modified]**
    * カード効果の実装。
    * アナウンス生成時に `<div>` タグを使用して「名称」と「効果」を分離するロジックを含む。

## 3. Safety Protocols & Rules

開発継続にあたり、以下のルールがコードベースで守られています。

1.  **State-Driven UI:**
    * UIは常に `player` / `enemy` オブジェクトの状態（State）を反映するものであり、直接DOMを操作して数値を書き換えることは避ける（`updateInfo` を通す）。
2.  **Logic-View Separation (Partial):**
    * ロジック（ダメージ計算）と演出（Effect, Announce）は関数内で混在しているが、`processOneThrow` 内では計算→演出の順序が厳守されている。
3.  **HTML Independence:**
    * 新しいUI要素を追加する場合、HTMLファイルを編集するのではなく、`setupStage` 内でJSによって動的に生成・挿入する「Injection Pattern」を維持すること。これにより、ユーザーが古いHTMLキャッシュを持っていてもJS更新だけで新UIが適用される。