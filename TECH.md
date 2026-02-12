# Technical Standards

## 1. Code Quality Principles
- **Generality (汎用性)**: 特定のモンスター専用のロジックを増やさず、パラメータで制御できる汎用的な関数を作る。
- **Extensibility (拡張性)**: 「後から属性が 100 個増えても壊れないか？」を常に自問し、ハードコーディングを避ける。
- **DRY (Don't Repeat Yourself)**: 同じ計算式が 2 箇所以上に出てきたら、即座に共通関数へ切り出す。

## 2. Architecture
- **Data-Driven Design**: ロジック（`main.js`）とデータ（`data.js`）を完全に分離する。
- **Pure Functions**: 可能な限り、外部変数に依存しない「入力に対して同じ結果を返す関数」として設計し、テストしやすくする。

## 3. JavaScript Standards
- Vanilla JS (No frameworks).
- 変数名・関数名はキャメルケース（例: `spawnEnemy`）。
- マジックナンバー（意味不明な数値）を禁止し、意味のある定数（例: `const MAX_HP = 100`）として定義する。