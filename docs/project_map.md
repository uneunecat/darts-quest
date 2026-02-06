# 🗺️ Project Architecture Map (v2.10.0)

## 1. File Structure & Responsibilities

* **index.html**: アプリケーション骨格。静的なコンテナのみ定義。
* **style.css**: 
    * **Config UI:** `.config-box`, `.config-slider` (レンジ入力の装飾), `.config-btn-title` (左上固定)。
    * **Animations:** 演出用キーフレーム定義。
* **main.js**: ゲームロジック全般。

## 2. `main.js` Code Logic Analysis (v2.10.0)

### Section 1: Global Config & Audio Engine **[NEW]**
* **`gameConfig`**: 音量設定を保持するグローバルオブジェクト。
* **`loadGameConfig()` / `saveGameConfig()`**: `darts_quest_config` へのIO処理。
* **`playSE(id)`**: **[Modified]**
    * 引数の `id` を解析し、攻撃系ID（`se-hit`, `se-boom`等）なら `atkVolume`、それ以外なら `sysVolume` を適用して再生する分岐ロジック。
* **`playBGM(id)`**: **[Modified]**
    * `bgmVolume` を適用して再生。
* **`updateCurrentBgmVolume()`**: 設定画面のスライダー操作時に、再生中の `<audio>` タグの音量を即時更新する。

### Section 2: Core State Management
* **`setupStage()`**: ステージ初期化、DOM Injection。
* **`processOneThrow(score)`**: ダーツ入力処理。
    * **Turn Fix:** 敵HP<=0 の瞬間、`totalGameTurns` を加算し、`isProcessing = true` で入力をロックする（二重勝利バグ防止）。

### Section 3: UI & Injection
* **`updateTitleScore()`**: 
    * 既存のスコア更新処理に加え、**Configボタンが存在しない場合に動的に生成・挿入するフック処理**を含む。
* **`openConfigModal()`**: **[NEW]**
    * 設定モーダルのHTMLを動的に生成（Injection）し、現在の `gameConfig` の値をスライダーに反映して表示する。
* **Card Logic:**
    * `playHandCard`: 消費→発動の順序で処理。
    * `applyCardEffect`: 各カードの効果適用。

## 3. Development Protocols
* **Audio Categories:**
    * 新しいSEを追加する際は、それが「システム音」か「攻撃音（爽快感）」かを判断し、`playSE` 内の `attackSEs` 配列に追加するか検討すること。
* **Input Blocking:**
    * 勝利演出やカード効果発動中は `isProcessing` フラグを徹底し、非同期処理による競合（二重勝利など）を防ぐ。