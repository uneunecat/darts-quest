# 🗺️ Project Architecture Map (v2.9.0)

## 1. File Structure & Responsibilities
* **index.html**: アプリケーション骨格。動的UIはJSによるInjectionで生成。
* **style.css**: デザイン定義。`.announcer-visible` (縦書きレイアウト), `.in-deck-card` (サムネイル強制) 等の重要クラスを含む。
* **main.js**: ゲームロジック全般。

## 2. `main.js` Code Logic Analysis (v2.9.0)

### Section 1: Data & Constants
* **`CARD_DB`**: **[v2.9 Updated]** カードデータの定義配列。ID 202, 401, 703, 802 のパラメータが更新されている。

### Section 2: Core State Management
* **`setupStage()`**:
    * `player.state` の初期化オブジェクトに `hexSealTrap: false` が追加された（旧 `hexSeal` 数値管理からの移行）。
    * `active-states` エリアの生成ロジック（Injection）を含む。

### Section 3: Battle Logic
* **`processOneThrow(score)`**:
    * ダーツ入力処理。
* **`doEnemyAttack(mult, options)`**: **[v2.9 Modified]**
    * 攻撃処理のメイン関数。
    * **Trap Check:** `player.state.hexSealTrap` が true の場合、攻撃発動前にダメージを半減し、敵にスタンを付与する割り込み処理が記述されている。
    * **Ult Calculation:** `isBossUlt` (必殺技) の処理ブロック内でも `mult` (倍率) を適用するよう修正済み。
* **`calculateStageRank(stg, turns)`**: **[v2.9 Modified]**
    * ステージごとの閾値判定ロジック。後半ステージの条件が緩和されている。

### Section 4: UI & Effects
* **`applyCardEffect(card)`**:
    * カードIDごとの分岐処理。
    * `ID 202` (強欲な壺) は `drawCard()` を2回呼ぶ処理に変更。
    * `ID 703` (六芒星) は `hexSealTrap = true` をセットする処理に変更。
* **`updateStateChips()`**:
    * `hexSealTrap` が有効な場合、敵ステータスエリアにデバフアイコンを表示する。

## 3. Development Rules
* **State Integrity:**
    * 敵の状態（Guard等）とプレイヤーの罠（Trap）は明確に区別し、`enemy.state` と `player.state` で管理する。
* **Balance Sensitivity:**
    * `CARD_DB` の数値を変更する際は、必ず `applyCardEffect` 内の実装ロジックとも整合性を取る（テキストだけの変更にならないよう注意）。