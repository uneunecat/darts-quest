# 🗺️ Project Architecture Map (v2.3)

## 1. ファイル構成
* `index.html`:
    * **Stage Select:** ID 1〜6 (Extra=5, Stage5=6) のボタン配置。
    * **Modals:** Shop (New Header), Deck Edit (Detail Area), History, etc.
* `style.css`:
    * **UI:** `.stage5-btn` (Gold/Red), `.float-text-box` (z-index 9999).
    * **Shop:** `.pack-item` (180px fixed width), `.pack-buy-btn` (Rich Gold).
    * **Layout:** `.deck-grid` (5 columns fixed).
* `main.js`: ゲームロジック集約（約1600行）。

## 2. main.js ロジックマップ (v2.3 Focus)
| Section ID | 内容 | 備考 |
|:---|:---|:---|
| **CONFIG** | `GAME_DATA` | ID:5(Extra), ID:6(Stage5) 定義 |
| **STATE** | `player.state` | `itemLock` フラグ追加 |
| **INIT/SCENE** | `setupStage` | IDに応じたBGM/背景切り替え, ログ修正 |
| **BATTLE** | `executeAttack` | **召雷弾ロジック**, 巨大化(Half HP)ロジック |
| **CARD** | `playHandCard` | `itemLock` チェック, ツールチップ消去 |
| **AI** | `enemyTurn` | **再生** (HP全快), **粘着** (Lock) ロジック |
| **UI** | `renderDeckEditor` | ホバー詳細表示 (`showCardDetail`) 追加 |
| **UI** | `updateInfo` | Lock時のボタン無効化表示 |

## 3. 重要な依存関係
* **Stage IDs:**
    * `1,2,3`: World 1
    * `4,6`: World 2
    * `5`: Extra
* **Unlock Conditions:**
    * Stage 4 Clear -> Stage 5 Unlock (`btn-stage5` visible)
    * Stage 3 Clear -> Vol.2 Pack Unlock