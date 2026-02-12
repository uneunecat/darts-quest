# Development Memories & Decisions

## 履歴 (最新が上)

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
