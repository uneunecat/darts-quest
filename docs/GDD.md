# 📘 DARTS QUEST - Game Design Document
**Version:** 2.7.0-beta (Cinematic HUD)
**Last Updated:** 2026-02-06

## 1. プロジェクト概要
* **タイトル:** DARTS QUEST
* **ジャンル:** Darts RPG (Physical Interaction)
* **コアコンセプト:** "Throw to Attack"
    * **Input:** 物理ダーツボード（DARTSLIVE HOME）からのBluetooth信号、またはデバッグ用キーパッド。
    * **Output:** リアルタイムでのダメージ計算、スキル発動、敵撃破。
    * **Skill Based:** プレイヤーのPPR（平均スコア）や精度（Weak Hit）が攻略難易度やドロップ率に直結する。

## 2. 画面構成 (HUD 2.1)
v2.7系では、視線移動を最小限に抑えつつ、戦況を直感的に把握できる「Cinematic HUD」を採用。

### A. Center Overlay: Battle Announcer
* **役割:** 戦闘アクションの瞬時伝達。
* **挙動:** 画面中央に黒帯背景付きでカットイン表示。
* **レイアウト:** `Flexbox (Column)` を採用。上段に「スキル/カード名」、下段に「効果内容」を配置し、視認性を最大化。
* **フィルタリング:** 「カード発動」「敵スキル」「WEAK HIT」などの**動的アクションのみ**を表示し、戦闘終了ログなどの静的情報は除外。

### B. Left Panel: ENEMY & STATUS
* **Visual:** 敵グラフィック（ドット絵）。特定条件下（Weak Hit 3回以上など）で宝箱に変化。
* **HP Gauge:** 現在HP/最大HPをバーと数値で表示。HP残量に応じて色変化（緑→黄→赤）。
* **State Chips Area (HPバー下):** 敵に適用されているバフ・デバフをアイコン付きチップで一覧表示。
    * `🛡️ -15 SKIN`: ダメージ軽減（永続/ターン制）
    * `🚫 <10 NULL`: ダメージ無効化閾値
    * `⚔️ GUARD 3`: ターン制防御（護封剣など）
    * `⚡ <15 NULL`: 特殊パッシブ（神の耐性）

### C. Right Panel: PLAYER & ACTION
* **Status:** HP/MP、現在の平均スコア(Avg/PPR)、レーティング(Rt)。
* **Hand Area:** 最大5枚の手札を表示。MP不足時はグレーアウト。
* **Item Buttons:** 薬草、聖水、種の使用ボタン（個数管理）。
* **Input History:** 直近3投のスコア履歴。

## 3. ゲームシステム詳細

### A. Battle Cycle (Real-time Turn System)
1.  **Tactics Phase:**
    * プレイヤーは投げる前にカードやアイテムを使用可能。
    * MP管理と手札の選択が鍵。
2.  **Action Phase:**
    * 1投目の着弾を検知した瞬間、UI操作（カード・アイテム）がロックされる。
    * 3投投げるか、敵HPが0になるとフェーズ終了。
    * **Weak System:** 敵ごとに設定された「弱点ナンバー」にヒット、または「Weak Lock」状態で、ドロップ率上昇フラグが立つ。
3.  **Enemy Turn:**
    * プレイヤー行動終了後、敵が確率分岐またはターン数で行動を決定。
    * 攻撃、回復、特殊スキル（カットイン演出あり）を行う。
    * ターン終了時にプレイヤーのMP回復(+3)とカードドロー(1枚)を行う。

### B. Enemy Logic & Skills
敵AIは `enemyTurn()` 関数内で管理され、ステージ・階層・ターン数・確率によって分岐する。

| Stage | Unit | Skill / Logic | Visual (Chip/Cutin) |
|:---|:---|:---|:---|
| **1-3** | **Evolution** | **自己再生:** 確率でHP回復。 | Cutin: Heal |
| **1-X** | **Basic** | **鉄壁の守り:** 1ターン被ダメージ半減。 | Chip: `🛡️ DEFENSE` |
| **3-1** | **Valkyrie** | **護封剣:** 開幕3ターン、被ダメージ0.8倍。 | Chip: `⚔️ GUARD 3` |
| **4-4** | **Toon** | **Toon Skin:** 被ダメージを常時 -15。 | Chip: `🛡️ -15 SKIN` |
| **4-6** | **Thousand** | **Chaos Barrier:** 10未満のダメージを無効化。 | Chip: `🚫 <10 NULL` |
| **6-5** | **GOD** | **Thunder Bullet:** 15以下のダメージを無効化。 | Chip: `⚡ <15 NULL` |

### C. Card System
* **種類:** 全20種（MAGIC / TRAP）。
* **デッキ:** 20枚構成。同名カードは最大3枚まで。
* **特殊挙動:**
    * **天使の施し (ID:501):** 使用時に専用モーダルを開き、捨てる手札を選択させる。
    * **ブラック・ホール (ID:601):** 手札を全て捨てて固定大ダメージ。
    * **マジック・シリンダー (ID:602):** 敵の攻撃を無効化し反射する（Trap状態）。

## 4. データ永続化 (Save Data)
LocalStorage `darts_quest_save` に以下のJSON構造で保存。
* `highScore`: { stage, floor, avg } - 到達記録
* `dp`: int - 所持ポイント（ショップ通貨）
* `deck`: Array<int> - 現在のデッキ構成（カードID配列）
* `cards`: Object<id: count> - 所持カード管理
* `history`: Array<Object> - プレイ履歴（日時、結果、PPR）
* `unlockedStage4`: boolean - ステージ開放フラグ
* `clearedExtra`: boolean - クリアフラグ