# Technical Standards

本プロジェクトは 『データ駆動型非同期シーケンスエンジン』 で構成されています。ロジックをリファクタリングする際は、『演出の実行順序（Sequencing）』 と 『アトミックなアクション構造（Atomic Actions）』 を最優先で維持し、命令的なコードを宣言的なデータ処理へと昇華させてください。

## 1. Code Quality Principles
- **Generality (汎用性)**: 特定のモンスター専用のロジックを増やさず、パラメータで制御できる汎用的な関数を作る。
- **Extensibility (拡張性)**: 「後から属性が 100 個増えても壊れないか？」を常に自問し、ハードコーディングを避ける。
- **DRY (Don't Repeat Yourself)**: 同じ計算式が 2 箇所以上に出てきたら、即座に共通関数へ切り出す。

## 2. Architecture
- **Data-Driven Design**: ロジックとデータ（`data.js`）を完全に分離する。
- **Module Split**: `<script>` タグの読み込み順で依存を解決。state.js → audio.js → visual.js → battle.js → ui.js → main.js。
- **Pure Functions**: 可能な限り、外部変数に依存しない「入力に対して同じ結果を返す関数」として設計し、テストしやすくする。

## 3. JavaScript Standards
- Vanilla JS (No frameworks).
- 変数名・関数名はキャメルケース（例: `spawnEnemy`）。
- マジックナンバー（意味不明な数値）を禁止し、意味のある定数（例: `const MAX_HP = 100`）として定義する。

## 4. Async/Await & Flow Control（非同期演出の鉄則）
- Sequential Execution (直列実行): ゲーム内の演出（カットイン、ダメージ数字、SE、ウェイト）は、必ず async/await を用いて「直列」に管理すること。setTimeout のネスト（コールバック地獄）を禁止する。
- Orchestration (演出の調律): ロジックの解決（HPを減らすなど）と演出の実行を分離しつつも、プレイヤーが「何が起きたか」を理解できるだけの「余韻（Wait）」を必ずデータ定義またはエンジン計算から取得して挿入すること。

## 5. Atomic Action Pattern（アトミック設計の死守）
- Uniformity (規格の統一): 敵のスキルもプレイヤーのカードも、すべて同一の「Action Atom（type, val, target 等を持つオブジェクト）」の配列として定義すること。
- Universal Engine: 行動の実行は、特定の主体（敵・味方）に依存しない「ユニバーサル・アクション・エンジン」を介して行う。Refactoring 時も、この「発動者の抽象化」を壊してはならない。

## 6. Encapsulated Physics (物理法則の隠蔽)
- Unified Calculation: ダメージ計算は、必ず applyOffenseLogic（攻撃側）と applyDefenseLogic（防御側）の2つの「物理法則」を通過させること。各関数内に個別の計算式をバラけさせてはならない。
- Deterministic Logic: 乱数は共通の計算機内でのみ扱い、基本パワーに対して「±10%」といったルールをシステム全体で一貫させる。

## 7. CSS-First UI Design
- Class-Based State: UIの状態変更（グレーアウト、発光、演出）は、可能な限り JavaScript による直接的なスタイル操作（.style.opacity = 0 等）を避け、CSS クラスの付け外しで行う。
- Design System Integrity: createCardElement は、デザインシステムの中心コンポーネントである。この内部構造（Container Queries や Masking）を変更する際は、既存の全てのカード描画への影響を厳密に考慮すること。

## 8. State Management (将来の拡張)
- Decoupled States: 持続的な状態（バフ・デバフ）は、将来的に「配列管理」へ移行可能なよう、tickStates のような共通の更新サイクルを通じて処理すること。