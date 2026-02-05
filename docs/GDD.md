# 📘 DARTS QUEST - Game Design Document
**Version:** 2.6.6 (Stable)
**Last Updated:** 2024-05-XX

## 1. プロジェクト概要
* **タイトル:** DARTS QUEST
* **コアコンセプト:** "Throw to Attack"
    * 物理ダーツボード（DARTSLIVE HOME）のBluetooth信号をリアルタイムでダメージに変換するブラウザRPG。
    * プレイヤーの「ダーツの腕前（PPR/精度）」と「カード戦略」の融合。

## 2. 画面構成 (HUD 2.0)
v2.6.0以降、レスポンシブかつ視線移動の少ないUIを採用しています。

### Left Panel: ENEMY & BATTLE INFO
* **Enemy Image:** 敵グラフィック（ドット絵風）。
* **Battle Announcer (Overlay):** 敵画像の上に重なる形で、攻撃結果やスキル名をポップアップ表示。
* **HP Bar:** 緑→黄→赤と変化するHPバー。
* **State Chips Area:** HPバーの下に、現在発動中の効果（硬質化、結界、封印など）をアイコン付きで並列表示。

### Right Panel: PLAYER & ACTION
* **Hand Area:** 所持しているカード（最大5枚）を表示。クリックでMPを消費して発動。
* **Status Box:** プレイヤーHP/MP、PPR（平均スコア）、Rt（レーティング）を表示。
* **Item Buttons:** 薬草、聖水、種の使用ボタン。
* **Score History:** 直近3投のスコアを表示。

## 3. ゲームシステム仕様

### A. Battle Cycle (Real-time Turn System)
1.  **Player Phase (Tactics):**
    * 投げる前ならカード・アイテム使用可能。
    * 1投目を投げた瞬間、UIがロックされ「Action Phase」へ移行。
2.  **Player Phase (Action):**
    * ダーツを投げる → `processOneThrow`
    * ダメージ計算: `(Score + Buff) - (EnemyBarrier + Defense)`
    * 3投投げるか、敵を倒すとフェーズ終了。
3.  **Enemy Turn:**
    * 敵がスキルを使用（State Chips追加）または攻撃。
    * ターン数経過、MP回復、カードドロー。

### B. Enemy Skills & Logic
敵の行動は `main.js` の `enemyTurn` 関数内で定義されています。

| Stage | Monster | Logic / Skill | Visual Representation |
|:---|:---|:---|:---|
| **4-4** | **Toon Dragon** | **Toon Skin:** 1ターンの間、被ダメージを **-15** する。 | Chip: `🛡️ -15 SKIN` |
| **4-6** | **Thousand Eyes** | **Chaos Barrier:** 1ターンの間、**10未満** のダメージを無効化。 | Chip: `🚫 <10 NULL` |
| **6-5** | **Osiris (God)** | **Thunder Bullet:** 常時パッシブ。**15以下** のダメージを無効化。 | Chip: `⚡ <15 NULL` |
| **All** | **Rare Drop** | 弱点（Weak）にヒットさせた回数に応じて、クリア時の宝箱ドロップ率・内容が変化。 | Effect: Weak Hit時に紫色のフラッシュ |

### C. Card Effects
全20種。魔法（MAGIC）と罠（TRAP）に分類。
* **ID 501 (天使の施し):** 手札を1枚捨てて2枚引く（専用UI `openDiscardSelector` を使用）。
* **ID 601 (ブラック・ホール):** 手札を全て捨てて大ダメージ。
* **ID 101 (死者蘇生):** HP完全回復（UR）。

## 4. データ構造 (SavedData)
LocalStorage `darts_quest_save` に保存。
* `slot1` ~ `slot3`: セーブスロット。
* `highScore`: { stage, floor, avg } - 到達階層とPPR。
* `deck`: Array<int> - 所持しているカードIDのリスト。
* `cards`: Object<id, count> - カードの所持数。
* `history`: Array<Object> - 過去の対戦履歴（50件）。

* Update: v2.7.0-alpha
Visual Update:
アナウンサー演出を強化（フォント変更、背景帯追加、アニメーション調整）。
敵の「鉄壁の守り」や「光の護封剣」などの防御行動が、HPバー下のステートチップエリアに可視化されるように変更