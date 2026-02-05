# 📘 DARTS QUEST - Game Design Document
**Version:** 2.5.9 (Stable)
**Last Updated:** 2024-05-XX

## 1. プロジェクト概要
* **タイトル:** DARTS QUEST
* **コアコンセプト:** "Your Skill is Your Weapon"
    * 物理ダーツボード（DARTSLIVE HOME）のBluetooth信号を攻撃力に変換するRPG。
    * 「投げる → 即ダメージ」のリアルタイム性と、カードによる戦略性の融合。

## 2. ゲームループとフェーズ定義

### Phase 1: Tactics (戦略フェーズ)
* **タイミング:** プレイヤーのターン開始時、1投目を投げる前。
* **可能な行動:**
    * **カード使用:** MPを消費して魔法・罠を発動（回復、バフ、敵デバフ）。
    * **アイテム使用:** 薬草、聖水などを使用（ただし「粘着」状態時は不可）。
    * **入力:** ダーツ投擲、またはキーボード入力。

### Phase 2: Action (アクションフェーズ / Real-time)
* **トリガー:** 1投目のスコアが入力された瞬間。
* **制約:** **UIロック（アイテム・カード使用不可）**。
* **処理フロー (Throw-by-Throw):**
    1. **ダメージ計算:** `(Score + Buff) * Multiplier`
        * *State Check:* 敵が「硬質化」中なら固定値軽減。「結界」中なら閾値以下のダメージ無効。
    2. **判定:**
        * `Just Finish`: 残りHPピッタリのダメージならボーナス（MaxHPアップ）。
        * `Win`: 敵HPが0になったら即勝利（残りの投擲はスキップ）。
    3. **履歴:** `turnInputs` にスコアを記録。
    4. **継続:** 3投投げるか、勝利するまで続く。
    * ※「サイバー・ボンテージ」等の制限時は1投で終了。

### Phase 3: Enemy Turn (敵ターン)
* **処理:**
    * 敵がスキルを使用（カットイン演出）。
    * プレイヤーへダメージ攻撃（シールド、護封剣などで軽減可能）。
    * 状態異常の付与（アイテムロック、MP破壊など）。
    * **状態フラグのセット:** 次のプレイヤー攻撃に備えて `enemy.state.toonSkin = true` 等を設定。

## 3. キャラクター & スキル詳細仕様

### 👾 Boss Logic (v2.5.9 Adjusted)
| Stage | Monster | Skill | Effect Logic (1投あたり) |
|:---:|:---|:---|:---|
| **4-4** | **Blue-Eyes Toon** | **Toon Skin** | `enemy.state.toonSkin` が ON の間、被ダメージ **-15**。 |
| **4-6** | **Thousand Eyes** | **Chaos Barrier** | `enemy.state.barrierLimit` が 10 の間、**10未満** のダメージを 0 にする。 |
| **6-5** | **Osiris (God)** | **Thunder Bullet** | 常時パッシブ。**15以下** のダメージを 0 にする（召雷弾）。 |
| **All** | **Drop** | **Treasure** | 弱点（Weak）にヒットさせた回数に応じて、種（MaxHPアップ）のドロップ率が変化。 |

### 🎴 Card System
* **Deck:** 20枚構成。同名カードは3枚まで。
* **Hand:** 最大5枚。ターン終了時に補充。
* **Costs:** MP（最大10）を消費。
* **Rarity:**
    * **UR:** 虹色回転枠 + 往復ホログラム + 虹色文字。
    * **SR:** 金色枠 + 流体ゴールド演出 + 金文字。
    * **R:** 銀色枠 + 金属光沢演出 + 銀文字。
    * **N:** ダークグレー枠 + 白文字。

## 4. データ構造 (Runtime)

### Player State (`player.state`)
* `itemLock` (bool): アイテム・カード使用不可（粘着）。`finishPlayerTurn` で解除。
* `weakLock` (bool): 次の1投を強制Weak扱いにする。
* `huge` (int): 巨大化（1: 3倍, 2: 0.5倍）。
* `guardTurn` (int): 光の護封剣の残りターン。

### Enemy State (`enemy.state`)
* `toonSkin` (bool): 物理耐性フラグ。
* `barrierLimit` (int): ダメージ無効化の閾値。
* `guardType` (string): 'cut' (20%軽減), 'half' (50%軽減)。