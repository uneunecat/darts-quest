# 📘 DARTS QUEST - Game Design Document
**Version:** 2.11.7.1 (Stable)
**Last Updated:** 2026-02-07

## 1. プロジェクト概要
* **タイトル:** DARTS QUEST
* **ジャンル:** Darts RPG (Physical Interaction)
* **コアコンセプト:** "Throw to Attack"
    * 物理ダーツボード（DARTSLIVE HOME）のBluetooth信号をリアルタイムでRPGのアクションに変換。
    * プレイヤーのスキル（ダーツの腕前）と戦略（カードデッキ）の融合。

## 2. システム要件 & UX (v2.11.x Update)

### A. Audio Architecture (3-Channel Mixing)
プレイヤーの「爽快感」と「快適性」を両立させるため、音声を3つのチャンネルで管理・保存する。
* **Config:** タイトル画面左上の [⚙️ CONFIG] からいつでも調整可能。
* **Persistence:** `darts_quest_config` に設定を保存。

| Channel | Role | Default | Targets |
|:---|:---|:---:|:---|
| **BGM** | 雰囲気演出 | 30% | 背景音楽 (ループ) |
| **SYSTEM** | 情報伝達 | 50% | UI Click, Heal, Buff, Warning, Chest |
| **ATTACK** | **打撃感** | **80%** | **Hit, Weak, Explosion, Magic, Damage** |

### B. Trap System (Strategic Defense)
* **Mechanic:** 「TRAP」属性カードは使用時に即発動せず、MPを消費してフィールド左下の「TRAP SLOT」にセット（伏せカード状態）される。
* **Trigger:**
    * **Attack Trigger:** 敵の攻撃被弾時に発動（例：聖なるバリア、魔法の筒）。
    * **Summon Trigger:** 敵出現時に発動（例：落とし穴）。
* **Constraint:** セットできる罠は1枚のみ。上書き不可。

## 3. 画面構成 (HUD)

### A. Battle Screen (Immersive Arcade Style)
* **Visuals:** * **Mega HP:** 敵HPを画面下部に超巨大フォントで表示し、視認性を最大化。
    * **Floating Damage:** プレイヤー被弾（左側・赤）、敵被弾（中央・金）でダメージ数値を巨大にポップアップ。
* **Card UX:**
    * **Long Press:** デッキ編集画面等でカードを長押しすると、詳細ズームビューを表示。
    * **Hand Overlay:** 画面下部に手札を展開。タップで発動。

## 4. ゲームバランス
* **Rank System:**
    * Stage 4~6 のSSSランク基準は「25ターン以内」。
* **Card Logic:**
    * **天使の施し (UR):** 手札を1枚捨てて3枚ドロー。
    * **はさみ撃ち (N):** 被弾時に敵へ80ダメージ（カウンター）。
    * **六芒星の呪縛 (R):** 被弾時、ダメージ半減＆敵スタン。

## 5. データ構造
* **Save Data (`darts_quest_save`):**
    * 3つのセーブスロットに対応。
    * `deck`: カードIDの配列。
    * `cards`: 所持カードの連想配列 `{id: count}`。
    * `highScore`, `dp`, `clearedExtra` 等の進行度。