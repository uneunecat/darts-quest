# 🗺️ Project Architecture Map (v2.1.2)

## 1. ファイル構成
* `index.html`:
    * **Modals:** `#collection-modal` (2カラム構成), `#card-selector-modal` (手札破棄用)
    * **UI:** `#global-tooltip`, `.float-text-box` (動的生成)
* `style.css`:
    * **Layout:** `.modal-body-split`, `.deck-column`, `.list-column` (PC/SPレスポンシブ)
    * **Anim:** `@keyframes floatUpFade` (演出用)
* `main.js`: ゲームロジック集約（約1200行）。

## 2. main.js ロジックマップ
| Section ID | 内容 | 備考 |
|:---|:---|:---|
| **CONFIG** | `GAME_DATA`, `CARD_DB` | Vol.2カード(ID:500+)追加 |
| **STATE** | `player`, `savedData` | `state`に `magicCylinder`, `huge` 等のフラグ追加 |
| **CONST** | `DECK_SIZE=20`, `HAND_SIZE=5` | **v2.1.1で20枚に確定** |
| **INIT/SCENE** | `initGameSession`, `setupStage` | `drawCard(true)` でサイレント初期ドロー |
| **BATTLE** | `executeAttack` | 攻撃倍率計算(巨大化/突進)の複雑化 |
| **CARD** | `playHandCard`, `applyCardEffect` | `openDiscardSelector` (天使の施し用) |
| **AI** | `enemyTurn`, `doEnemyAttack` | 反射(魔法の筒)の割り込み処理 |
| **RESULT** | `winBattle`, `nextStep` | 撃破時リソース回復、DPスコア倍率適用 |
| **UI** | `renderDeckEditor`, `triggerFloatText` | 2カラム描画、演出生成(z-index修正済) |

## 3. 重要な依存関係
* **Card IDs:** 500番台以降は Vol.2 (Stage 3 Unlock)。
* **Hand Handling:** 手札が溢れる場合 (`HAND_SIZE=5`) はドロー不可。
* **Async Logic:** 「天使の施し」などの対象選択系カードは、一度処理を中断してモーダルを開き、コールバックで効果を発動する。