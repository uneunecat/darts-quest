# 🗺️ Project Architecture Map (v2.11.7.1)

## 1. File Structure
* **index.html**: アプリケーション骨格。モーダル、オーバーレイ、オーディオタグ定義。
* **style.css**: 
    * **Visual Effects**: `.shake-ultimate`, `.flash-gold`, `.hp-mega-text`.
    * **Responsive**: モバイル/PCでのレイアウト切り替え（Flex方向の変更）。
    * **Card Rarity**: `.rarity-UR` 等のアニメーション枠定義。
* **main.js**: 
    * **Global Config**: 音量設定管理。
    * **Game Loop**: `setupStage` -> `processOneThrow` -> `enemyTurn` -> `win/lose`.
    * **Bluetooth**: DARTSLIVE HOME 通信プロトコル処理。

## 2. Core Logic Analysis

### State Management (`main.js`)
* **`player.state`**: 
    * `setCard`: セット中の罠カードIDを保持（nullならなし）。
    * `hexSeal`: 六芒星の呪縛の効果ターン数（数値管理に変更）。
* **`triggerTrap(type, dmg)`**: 
    * ダメージ計算時に割り込み発生。罠の種類と発動条件(`attack`/`summon`)を照合し、ダメージ無効化や反撃処理を行う。

### UI/UX Implementation
* **Pack Opening**: 
    * `startPackOpening`: ガチャ演出。
    * `packSkipTrigger`: エンターキー/クリックによる演出スキップフラグ。
* **Zoom System**:
    * `setupLongPress`: マウスダウン/タッチ開始時間を計測し、一定時間経過で `showZoomCard` を発動。
* **Config Modal**:
    * `openConfigModal`: DOM Injectionにより設定画面を動的生成。スライダー操作で即時音量反映。

### Audio Engine
* **`playSE(id)`**: IDに基づき `atkVolume` (攻撃系) か `sysVolume` (その他) を振り分けて再生。
* **`playBGM(id)`**: `bgmVolume` を適用してループ再生。

## 3. Critical Functions
* **`processOneThrow(score)`**: ダーツ入力のメイン処理。HP0判定時に `totalGameTurns` を加算し、二重勝利を防止。
* **`loseGame()`**: プレイヤーHP<=0時に呼び出し。ゲームオーバーモーダルを表示（v2.11.7.1で復旧）。