# 📘 DARTS QUEST - Game Design Document
**Version:** 2.11.8 (Stable)
**Last Updated:** 2026-02-07

## 1. プロジェクト概要
* **タイトル:** DARTS QUEST
* **ジャンル:** Darts RPG (Physical Interaction)
* **コアコンセプト:** "Throw to Attack"
    * 物理ダーツボード（DARTSLIVE HOME）のBluetooth信号をリアルタイムでRPGのダメージ・アクションに変換する。
    * プレイヤー自身の「ダーツスキル（命中率）」と「デッキ構築（戦略）」が攻略の鍵となる。

## 2. ゲームループ & システム詳細

### A. Battle System (Turn-Based Action)
1.  **Player Turn (Throw Phase):**
    * プレイヤーは1ターンにつき3投（3 Darts）を行う。
    * **Attack:** ダーツの点数がそのままダメージとなる（BULL=50, Triple=3倍）。
    * **Input Constraint:** 敵のスキル（拘束など）により、入力回数が制限される場合がある。
2.  **Card/Item Phase:**
    * 投擲前であれば、MPを消費して手札の魔法カードやアイテムを使用可能。
    * **Trap Set:** 罠カードはこのフェーズで「セット」状態に移行する。
3.  **Enemy Turn:**
    * 敵は固有の行動パターン（攻撃、バフ、デバフ、回復、必殺技）に基づいて行動する。
    * 確率判定により「溜め行動」や「連続攻撃」を行う。

### B. Trap Mechanics (v2.11 New)
プレイヤーは最大1枚まで罠をセットできる。セットされた罠は特定のトリガーで自動発動し、割り込み処理を行う。

| カード名 | レア | コスト | トリガー | 効果詳細 |
|:---|:---:|:---:|:---|:---|
| **落とし穴** | R | 3 | **Summon** | 敵出現時、50ダメージを与え、1ターンスタンさせる。 |
| **聖なるバリア** | R | 4 | **Attack** | 敵の攻撃を完全無効化し、50ダメージの反撃を行う。 |
| **魔法の筒** | SR | 4 | **Attack** | 敵の攻撃を完全無効化し、そのダメージをそのまま敵に与える。 |
| **六芒星の呪縛** | R | 3 | **Attack** | 敵の攻撃を半減（x0.5）させ、さらに1ターンスタンさせる。 |
| **はさみ撃ち** | N | 2 | **Attack** | 被弾時に発動。ダメージは受けるが、敵に80ダメージの反撃を行う。 |

### C. Audio Architecture
「爽快感」と「情報伝達」を分離するため、3つの独立したボリュームチャンネルを持つ。
* **Config:** `darts_quest_config` (LocalStorage) に保存。
* **Channels:**
    * `BGM`: 30% (Default) - 音楽。
    * `SYSTEM`: 50% (Default) - UI操作、回復、バフ音。
    * `ATTACK`: 80% (Default) - 攻撃ヒット、爆発、弱点ヒット音。

## 3. ゲームバランス & データ

### A. Stage Configuration
| Stage | Name | Boss Logic | Rank SSS (Turns) |
|:---:|:---|:---|:---:|
| 1 | 旅立ちの森 | HP型 (進化の繭→グレートモス) | 12 |
| 2 | 荒れ狂う荒野 | 攻撃型 (恐竜) | 12 |
| 3 | 誘惑の迷宮 | テクニカル (護封剣/スタン) | 12 |
| 4 | 幻想の狂宴 | 特殊 (Toon/吸収/無効化) | 25 |
| 5 | 燃えたぎる火口 | **EXTRA BOSS** (高火力/MP破壊) | 25 |
| 6 | 神の試練 | **GOD** (蘇生/即死無効/超火力) | 25 |

### B. Rank System
クリアにかかった総ターン数（`totalGameTurns`）に基づき評価。
* **SSS Rank:** 圧倒的な速度（12〜25ターン以内）。報酬DP大。
* **S/A/B/C Rank:** ターン数に応じて段階的に報酬減少。

## 4. UI/UX Design Specification
* **Immersive Arcade Layout:**
    * **Mega HP:** 敵HPを画面下部に超巨大フォントで表示。
    * **Floating Damage:** ダメージ数値を物理演算的にポップアップ。
    * **Zoom:** カード長押しで拡大表示し、フレーバーテキストを読めるようにする。
* **Responsive:**
    * PC（横長）とモバイル（縦長）でレイアウトを自動切り替え。モバイルではスクロールを前提とした配置になる。

## 5. Technical Specifications
* **Save Data (`darts_quest_save`):**
    * JSON形式。Slot1~3のオブジェクトを保持。
    * `deck`: `[cardId, cardId, ...]` (最大20枚)
    * `cards`: `{ "cardId": count, ... }`
* **Bluetooth Protocol:**
    * Service UUID: `6e400001-b5a3-f393-e0a9-e50e24dcca9e`
    * Notify UUID: `6e40fff6-b5a3-f393-e0a9-e50e24dcca9e`