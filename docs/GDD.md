# 📘 DARTS QUEST - Game Design Document
**Version:** 2.8.3 (Stable)
**Last Updated:** 2026-02-06

## 1. プロジェクト概要
* **タイトル:** DARTS QUEST
* **ジャンル:** Darts RPG (Physical Interaction)
* **コアコンセプト:** "Throw to Attack"
    * 物理ダーツボード（DARTSLIVE HOME）のBluetooth信号、またはデバッグ用キーパッドからの入力をリアルタイムでRPGのアクションに変換。
    * プレイヤーの「ダーツスキル（精度・PPR）」が攻略の鍵となるスキルベースRPG。

## 2. 画面構成 (HUD 2.1)

### A. Main Battle Screen
* **Center Overlay (Battle Announcer):** * スキル発動やクリティカルヒットなどの重要アクションを、画面中央に縦並び（名称＋効果）でカットイン表示。
    * 視線移動を減らすため、動的な情報のみをフィルタリングして表示。
* **Left Panel (Enemy):** * 敵グラフィック、HPバー、および防御状態（State Chips）の可視化エリア。
    * 敵の状態（ガード、無効化バリアなど）はアイコン付きチップで常時表示される。
* **Right Panel (Player):** * ステータス（HP/MP/Avg）、手札エリア、アイテムボタン、スコア履歴。

### B. Sub Screens
* **Deck Edit:** * 左カラム：現在のデッキ（サムネイル表示、最大20枚）。
    * 右カラム：所持カードリスト（クリックでデッキに追加）。
    * **長押しズーム:** 任意のカードを長押しすることで、詳細情報を拡大オーバーレイ表示可能。
* **Card Shop:** * DP（ダーツポイント）を消費してパックを購入。
    * **Legendary Unboxing:** 落下・振動・発光を組み合わせたシネマティックな開封演出。

## 3. ゲームシステム詳細

### A. Battle Cycle
1.  **Tactics Phase:** 投擲前。カード使用（MP消費）、アイテム使用が可能。
2.  **Action Phase:** 1投目を検知するとUIロック。3投投げるか敵撃破まで継続。
3.  **Enemy Turn:** 敵のAI行動（攻撃、スキル、回復）。ターン終了時にプレイヤーのMP回復(+3)とドロー。

### B. Card & Gacha System
* **種類:** 全20種（MAGIC / TRAP）。
* **パック仕様:**
    * **Vol.1 (Legend):** ID 100~499 のカードを排出。
    * **Vol.2 (Awakening):** ID 500~899 のカードを排出。
* **排出ロジック:** * レアリティ抽選（UR:3%, SR:12%, R:30%, N:55%）を行い、該当パック内のリストから選出。
    * **Climax Sort:** 排出された3枚は演出上、低レア→高レアの順に表示される。

### C. Enemy Logic (Sample)
* **Toon Dragon (4-4):** 常時ダメージ-15軽減 (Chip: `🛡️ -15 SKIN`)。
* **GOD (6-5):** 15以下のダメージを無効化 (Chip: `⚡ <15 NULL`)。
* **Rare Drop:** Weak Pointへのヒット回数に応じてドロップ率が変化。

## 4. データ構造 (SavedData)
LocalStorage `darts_quest_save` にJSON形式で保存。
* `highScore`: { stage, floor, avg }
* `dp`: 所持ポイント
* `deck`: Array<int> (カードID配列)
* `cards`: Object<id: count> (所持数)
* `history`: Array<Object> (プレイ履歴)