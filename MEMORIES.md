# Development Memories & Decisions

## 履歴 (最新が上)

### 2026-02-12: スプリングクリーニング (拡張性リファクタリング)
- **意図**: TECH.md 基準で最も拡張性が低い3箇所を特定し、データ駆動設計に全面刷新。
- **変更1 (STAGE_MASTER拡張)**: `displayName`, `floors`, `bossFloor`, `img` を追加。`renderStageSelectScreen()` をハードコード配列から `Object.entries(STAGE_MASTER)` ループに書き換え。解放判定は `isStageUnlocked()` に一元化。
- **変更2 (ボス/フロア判定統一)**: `isBossFloor()`, `getMaxFloors()` ヘルパーを新設。`floor===5||(stage===4&&floor===6)` の3箇所散在パターンを全て置換。`checkDrop()`, `nextStep()` のフロア数ハードコードも統一。
- **変更3 (表示名DRY化)**: `getStageDisplayName()` ヘルパーで4箇所のコピペを統一。
- **変更4 (背景管理統合)**: `GAME_DATA.bg` + `getBackgroundKey()` を廃止し、`STAGE_MASTER.img` + `getStageBackground()` に統合。Stage 6 にボス用背景 `bg_stage5_2.png` を新規追加。
- **設計判断 (bossFloor)**: Stage 4 は `floors:6, bossFloor:5` とし、Floor 5 (サクリファイス) と Floor 6 (1000 Eyes) の両方にボスBGM・100%ドロップを適用（既存挙動を維持）。他ステージは `bossFloor` 省略で `floors` 値にフォールバック。
- **影響範囲**: data.js (STAGE_MASTER), main.js (約15箇所)。ゲーム挙動は変化なし（リファクタリングのみ）。Stage 6 ボス背景は新機能。

---
### 2026-02-12: 旧カードID ハードコード修正
- **意図**: `playHandCard()` 内の `card.id === 501` を、エフェクト内容 (`DISCARD_SELECT`) による判定に変更。
- **理由**: 旧ID(501)はカードDB再採番で112に変更済みだったが、ロジック側が追従しておらず「天使の施しを手札1枚で使えてしまう」バグが潜在していた。TECH.md の Generality / Data-Driven Design 原則に従い、IDではなくエフェクトの有無で判定するよう修正。
- **影響範囲**: `playHandCard()` のみ。他のカード処理 (`resolveEffects` 等) は影響なし。
- **注意点**: 今後 DISCARD_SELECT エフェクトを持つカードを追加した場合も自動的にガードが効く。

---
### 2026-02-12: 初回コード解析 & SPECS.md 構築
- **意図**: 4ファイル (index.html, style.css, main.js, data.js) を全文読み込み、ゲーム仕様を SPECS.md に体系的に記録。
- **発見事項 (再検証結果)**:
  - ~~data.js と main.js のフォーマット不一致~~ → 新アトミックエンジン (`processEnemyTurn` → `executeSkill` → `resolveAction`) が既に実装済みで解決済み。
  - `playHandCard()` に旧カードID (501) のハードコードが残存 → **上記で修正済み**。
  - ~~`GAME_DATA.bg` のキー不一致~~ → `getBackgroundKey()` ヘルパーが文字列キーを生成しており解決済み。
- **教訓**: git status に staged/unstaged 両方の変更がある場合、ディスク上の最新コードと初回読み取り結果が食い違う可能性がある。必ず問題箇所を直接再読み取りしてから判断すること。

---
### 2026-02-12: Claude Code システム導入
- **意図**: .md ファイルによる外部脳システムを構築し、記憶の混濁を防止。
