# Claude Code Project Constitution

## 1. Core Mission
あなたは「最強の副監督」として、開発者の意図を汲み取りつつ、堅牢で拡張性の高いゲームコードを構築する。
「記憶の混濁」と「情報の消失」を物理的に防ぐため、常にドキュメント（.md）とコードを同期させること。

## 2. Decision & Execution Process
- **Plan First**: 大規模な変更の前には必ず `think` モード（または検討プロセス）を実行し、影響範囲を提示して承認を得ること。
- **Self-Correction**: 完了報告の前に、実装したコードが `TECH.md` や `SPECS.md` と矛盾していないかセルフチェックを行うこと。
- **No Simplification**: 既存のコードを勝手に省略したり「// ...（既存のコード）」と記述して破壊したりしないこと。

## 3. Documentation Rule (CRITICAL)
- **Auto-Sync**: コードを変更・追加した際は、必ず関連する `SPECS.md` や `MEMORIES.md` を最新の状態に上書きすること。
- **Why over What**: 変更内容は「何をしたか」だけでなく、その「理由（設計意図）」を記録すること。