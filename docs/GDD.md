# 📘 DARTS QUEST - Game Design Document
**Version:** 2.10.0 (Stable)
**Last Updated:** 2026-02-06

## 1. プロジェクト概要
* **タイトル:** DARTS QUEST
* **ジャンル:** Darts RPG (Physical Interaction)
* **コアコンセプト:** "Throw to Attack"
    * 物理ダーツボード（DARTSLIVE HOME）のBluetooth信号をリアルタイムでRPGのアクションに変換。

## 2. システム要件 & UX (v2.10 Update)

### A. Audio Architecture (3-Channel Mixing)
プレイヤーの「爽快感」と「快適性」を両立させるため、音声を3つのチャンネルで管理する。

| Channel | Role | Default Vol | Targets |
|:---|:---|:---:|:---|
| **BGM** | 雰囲気演出 | 30% | All Background Music |
| **SYSTEM** | 情報伝達 | 50% | UI Click, Heal, Buff, Warning, Chest |
| **ATTACK** | **打撃感・報酬** | **80%** | **Hit, Weak, Explosion, Magic, Damage** |

* **Global Persistence:**
    * 音量設定は `darts_quest_config` キーでLocalStorageに独立保存される。
    * ゲーム進行データ（`darts_quest_save`）のリセット影響を受けない。

## 3. 画面構成 (HUD)

### A. Title Screen
* **Top Left:** [⚙️ CONFIG] - 音量設定モーダルを開く。
* **Top Right:** [📡 CONNECT] - ダーツボード接続。
* **Center:** ロゴ、ハイスコア、ステージ選択。

### B. Battle Screen
* **Effect & Feedback:**
    * 攻撃ヒット時、画面揺れ（Shake Effect）と共に「ATTACK SE」が再生される。
    * 設定により攻撃音のみを大きくすることで、打撃感を強調可能。

## 4. ゲームバランス (v2.9.2 Base)
* **Rank System:**
    * Stage 4~6 のSSSランク基準は「25ターン以内」。
    * 敵撃破ターンも正しくカウントされるようロジックが修正済み。
* **Card Logic:**
    * **強欲な壺:** Cost 2 / Draw 2
    * **天使の施し:** Cost 2 / Discard 1 -> Draw 3
    * **六芒星の呪縛:** Trap / 被弾時半減＆スタン

## 5. データ構造
* **Save Data (`darts_quest_save`):** ゲーム進行、デッキ、所持カード。
* **Global Config (`darts_quest_config`):**
    ```json
    {
      "bgmVolume": 0.3,
      "sysVolume": 0.5,
      "atkVolume": 0.8
    }
    ```