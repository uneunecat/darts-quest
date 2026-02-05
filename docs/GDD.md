# 📘 DARTS QUEST - Game Design Document
**Version:** 2.5.2 (Visual Polish)
**Last Updated:** 2024-05-XX

## 1. プロジェクト概要
* **タイトル:** DARTS QUEST
* **ジャンル:** リアルタイム・ダーツRPG
* **コンセプト:**
    * "Your Skill is Your Weapon"（あなたのダーツスキルが攻撃力になる）
    * 物理ダーツボード（DARTSLIVE HOME）との完全連動。
    * TCG（トレーディングカードゲーム）のような収集と戦略の楽しさ。

## 2. ゲームシステム仕様

### A. リアルタイム・バトルフロー
1.  **Tactics Phase (戦略フェーズ):**
    * ターン開始時。カード使用、アイテム使用が可能。
2.  **Action Phase (アクションフェーズ):**
    * 1投目がヒットした瞬間にUIロック。
    * 1投ごとに即時ダメージ反映。敵HP0で即勝利。
3.  **Enemy Turn:**
    * 3投終了後、敵が攻撃。

### B. ステータス・計算式
* **PPR (Avg):** `(総スコア / 総投擲数) * 3`
    * ※v2.4.4にて計算式を適正化済み。
* **Damage:** `(Throw Score + Buff) * Multiplier`

## 3. アートワーク・演出仕様 (v2.5 Updated)

### 🃏 Card Rarity Design
| Rarity | Frame Color | Text Color | Animation Effect | Concept |
|:---:|:---|:---|:---|:---|
| **N** | Dark Gray | White | None | Basic / Matte |
| **R** | Silver Grad | Silver Grad | **Sharp Sheen** (Linear wipe) | Metallic / Sharp |
| **SR** | Gold Grad | Gold Grad | **Liquid Flow** (Reverse linear) | Luxury / Wealth |
| **UR** | **Rainbow Spin** | **Rainbow** | **Holo Shimmer** (Oscillating) | Prism / Godly |

### 🔊 Sound Effects
* **Hit Sounds:** Single, Double, Triple, Bull, D-Bull で個別のSEを再生。
* **Audio Unlock:** Bluetooth接続時に全SEをミュート再生し、モバイルブラウザでの再生制限を解除。

## 4. 今後の展望
* **World 3 Implementation:** 墓守シリーズ、ラーの翼神竜。
* **Online Ranking:** Firebase等を用いたハイスコアランキングの実装。