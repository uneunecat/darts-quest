---
description: ベース画像から高品質なカード風イラストをAI生成するワークフロー
---

このワークフローは、収集済みのベース画像に対して、Image-to-Image生成を行い、高品質なカード風アーティファクトを作成する手順です。Google Geminiの画像生成機能を使用します。

1. **準備**:
   - ベース画像が保存されているディレクトリを確認する（例: `card_images/`）。
   - 生成画像の出力先ディレクトリを作成する（例: `card_images/generated/`）。

2. **画像生成 (Image-to-Image)**:
   - 各ベース画像に対して `generate_image` ツールを使用する。
   - **推奨プロンプト**:
     ```
     (trading card game illustration style:1.3), highly detailed, magical energy glow, dramatic lighting, masterpiece, intricate border design. based on the reference image, convert into a card artifact. No text, no icons. Maintain the composition and shape of the original object strictly.
     ```
   - **引数**:
     - `ImagePaths`: ベース画像の絶対パス（1枚指定）。
     - `Prompt`: 上記プロンプト。
     - `ImageName`: 出力ファイル名（拡張子は自動付与される）。

3. **エラーハンドリング (503 Capacity)**:
   - モデルのキャパシティ制限により `503 Service Unavailable` エラーが発生する場合がある。
   - エラー発生時は **30〜60秒待機** し、再試行する。
   - 複数枚を処理する場合は、バッチ（例: 5枚ごと）に分けて実行し、間に `sleep` を挟むと安定する。

4. **後処理**:
   - 生成された画像（Artifactディレクトリまたは指定パス）をプロジェクト内の適切な場所に移動する。
   - 必要に応じて、仕様書やデータファイルに合わせてファイル名を変更する（例: `123.png` などの連番）。
