# 🗺️ Project Architecture Map (v2.3)

## 1. ファイル構成
* `index.html`:
    * **Stage Select:** ID 1〜6 (Extra=5, Stage5=6) のボタン配置。
    * **Modals:** Shop, Deck Edit, History, etc.
* `style.css`:
    * **UI:** `.stage5-btn` (Gold/Red style), `.float-text-box` (z-index 9999).
    * **Layout:** `.modal-body-split` (PC 2-col / SP Stack).
* `main.js`: ゲームロジック集約（約1300行）。

## 2. main.js ロジックマップ (v2.3 Focus)
| Section ID | 内容 | 備考 |
|:---|:---|:---|
| **CONFIG** | `GAME_DATA` | ID:5(Extra), ID:6(Stage5) 定義 |
| **STATE** | `player.state` | `itemLock` フラグ追加 |
| **INIT/SCENE** | `setupStage` | IDに応じたBGM/背景切り替え |
| **BATTLE** | `executeAttack` | **召雷弾ロジック** (Stg6-Flr5: <=20 dmg -> 0) |
| **CARD** | `playHandCard` | `itemLock` チェック追加 |
| **AI** | `enemyTurn` | **再生** (HP全快), **粘着** (Lock) ロジック |
| **RESULT** | `finishSession` | DPスコア倍率計算の修正 |
| **UI** | `updateInfo` | Lock時のボタン無効化表示 |

## 3. 重要な依存関係
* **Stage IDs:**
    * `1,2,3`: World 1
    * `4,6`: World 2
    * `5`: Extra
* **Unlock Conditions:**
    * Stage 4 Clear -> Stage 5 Unlock (`btn-stage5` visible)
    * Stage 3 Clear -> Vol.2 Pack Unlock