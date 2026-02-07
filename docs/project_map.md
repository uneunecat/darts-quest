# 🗺️ Project Architecture Map (v2.11.8)

## 1. File Structure & Responsibilities

* **index.html**: アプリケーションのエントリーポイント。
    * **Audio Tags**: BGM/SE用の `<audio>` 要素定義（ID管理）。
    * **Modals**: 設定、ショップ、デッキ編集などのモーダルコンテナ。
    * **Game Screens**: Title, Stage Select, Battle HUD のHTML構造。
* **style.css**: ビジュアル表現とレスポンシブ制御。
    * **Animations**: `.shake`, `.flash`, `.pop-in` などのCSSアニメーション。
    * **Responsive**: `@media (max-width: 900px)` によるモバイルレイアウト切り替え。
    * **Visual Components**: `.rarity-UR`, `.hp-mega-text`, `.trap-slot` などの装飾。
* **main.js**: ゲームロジックの中核（約1000行）。

## 2. Core Logic Analysis (`main.js`)

### A. State Management (Global Variables)
* **`gameConfig`**: 音量設定 (`bgmVolume`, `sysVolume`, `atkVolume`)。
* **`player` Object**:
    * `hp`, `mp`: 現在のステータス。
    * `hand`, `deck`, `discard`: カード管理配列。
    * `state`: バフ・デバフフラグ (`power`, `shield`, `guardTurn`...)。
    * `setCard`: **[New]** セット中の罠カードID。
* **`enemy` Object**:
    * `hp`, `maxHp`: 敵ステータス。
    * `state`: 敵AI状態 (`guard`, `charge`, `isStunned`...)。
* **`savedData`**: 現在のスロットのセーブデータ参照。

### B. Audio Engine (3-Channel Mixer)
* **`loadGameConfig()` / `saveGameConfig()`**: LocalStorageとのIO。
* **`playBGM(id)`**: BGM再生。`gameConfig.bgmVolume` を適用。
* **`playSE(id)`**: SE再生。ID文字列判定により `atkVolume` か `sysVolume` を動的に適用。

### C. Game Loop & Battle Logic
1.  **Initialization**:
    * `initGameSession(stageId)` -> `startTransition()` -> `setupStage()`
    * 敵生成、デッキシャッフル、初期手札ドロー。
2.  **Input Processing**:
    * `handleBluetoothNotify(event)` / `handleEnter()`
    * `processOneThrow(score)`: ダメージ計算、HP減算、演出トリガー。
    * **Win Condition**: HP<=0 で `isProcessing = true` にし、`winBattle()` へ遷移。
3.  **Enemy AI**:
    * `finishPlayerTurn()` -> `enemyTurn()`
    * 確率分岐による行動選択（攻撃、スキル、回復）。
    * `doEnemyAttack(multiplier)`: プレイヤーへのダメージ計算。
4.  **Trap System**:
    * `playHandCard(index)`: TRAP属性なら `player.setCard` にIDを格納し終了。
    * `triggerTrap(type, dmg)`: 攻撃/召喚時に割り込み、ダメージ無効化や反撃処理を実行。

### D. UI/UX Logic
* **Modal Managers**: `openConfigModal`, `openCardShop`, `openCollection`.
* **Visual Effects**:
    * `triggerEffect(el, dmg)`: 画面揺れとフローティングテキスト生成。
    * `animateValue(obj, start, end)`: 数値のカウントアップ演出。
* **Card Interaction**:
    * `setupLongPress(el)`: マウスダウン/タッチ開始時間を計測しズーム発動。

## 3. Critical Dependencies
* **`CARD_DB`**: カードの全データ（ID, 名前, 効果, コスト, レアリティ）。
* **`GAME_DATA`**: ステージごとの敵リスト、背景画像定義。
* **`DL_SCORE_MAP`**: Bluetooth信号（バイト列）をダーツのスコアに変換するマッピングテーブル。

## 4. Development Notes (v2.11.8)
* **Trap Priority**: `triggerTrap` はダメージ計算の**直前**に呼ばれ、ダメージ値を書き換える権限を持つ。
* **Audio Unlock**: iOS/Android制限対策として、接続時に `unlockAudioContext()` で全音声を無音再生してアンロックしている。
* **Input Blocking**: アニメーション中や処理中は `isProcessing` フラグで入力をブロックし、非同期処理の競合を防いでいる。