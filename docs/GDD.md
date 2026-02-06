# 📘 DARTS QUEST - Game Design Document
**Version:** 2.9.0 (Stable)
**Last Updated:** 2026-02-06

## 1. プロジェクト概要
* **タイトル:** DARTS QUEST
* **ジャンル:** Darts RPG (Physical Interaction)
* **コアコンセプト:** "Throw to Attack"
    * ダーツの「精度（Accuracy）」とカードゲームの「戦略（Strategy）」を融合させたスキルベースRPG。

## 2. ゲームシステム詳細

### A. Battle Cycle
1.  **Tactics Phase:** 投げる前の準備フェーズ。カード・アイテム使用可能。
2.  **Action Phase:** ダーツ入力（3投）。敵HPを0にすれば勝利。
3.  **Enemy Turn:** 敵の行動。攻撃、スキル、回復を行う。

### B. Card System (全20種)
v2.9.0にてバランス調整実施。魔法（MAGIC）と罠（TRAP）に分類される。

| ID | Name | Type | Cost | Effect Summary | Note |
|:---|:---|:---:|:---:|:---|:---|
| 101 | 死者蘇生 | MAGIC | 8 | HP完全回復 | UR / 起死回生 |
| 201 | サンダー・ボルト | MAGIC | 6 | 100ダメ + 確定スタン | SR / 足止め最強 |
| 202 | **強欲な壺** | MAGIC | **2** | **2枚ドロー** | **v2.9 Reworked** |
| 301 | 光の護封剣 | MAGIC | 5 | 3ターン被ダメ半減 | 防御の要 |
| 303 | 聖なるバリア | TRAP | 4 | 攻撃無効 + 50ダメ | カウンター |
| 401 | **火の粉** | MAGIC | 1 | **30ダメージ** | **v2.9 Buffed** |
| 501 | 天使の施し | MAGIC | 1 | 手札1枚捨てて2枚ドロー | UR / サイクル加速 |
| 601 | ブラック・ホール | MAGIC | 7 | 全手札捨て + 150ダメ | SR / 最後の一撃 |
| 703 | **六芒星の呪縛** | **TRAP** | 3 | **被弾時半減 + スタン** | **v2.9 Reworked** |
| 802 | **火あぶりの刑** | MAGIC | 2 | **60ダメージ** | **v2.9 Buffed** |
| 805 | 最終戦争 | MAGIC | 5 | 自傷50 + 150ダメ | ハイリスク火力 |

### C. Ranking System (Turn Attack)
クリアにかかった総ターン数で評価が決まる。

| Stage | SSS (Perfect) | S (Great) | A (Good) | B (Clear) |
|:---|:---:|:---:|:---:|:---:|
| **1 ~ 3** | <= 12 | <= 16 | <= 22 | <= 30 |
| **4 ~ 6** | **<= 25** | **<= 35** | **<= 50** | **<= 70** |

## 3. Enemy Logic
* **必殺技仕様:**
    * ボスが放つ「サンダー・フォース」等の固定ダメージ技も、プレイヤーの防御スキル（シールド、護封剣）や敵へのデバフ（六芒星）によって**軽減可能**となった。(v2.9 Fix)

## 4. データ構造
LocalStorage `darts_quest_save` に保存。
* `deck`: Array<int> (カードID)
* `cards`: Object<id: count> (所持数)
* `highScore`: { stage, floor, avg }