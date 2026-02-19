// =========================================
// LEGACY DARTS MODE - COUNT-UP (v1.0)
// =========================================

// --- State ---
let legacyMode = false;         // レガシーモードがアクティブか
let legacyModeType = "COUNTUP"; // COUNTUP, 301, 501, 701, 901, 1501
let CU_MAX_ROUNDS = 8;          // ラウンド数 (可変)
let cuRound = 0;                // 現在のラウンド (0-indexed)
let cuThrow = 0;                // 現在の投擲番号 (0, 1, 2)
let cuRoundScores = [];         // 全ラウンドのスコア配列
let cuCurrentThrows = [];       // 現ラウンドの投擲スコア
let cuTotalScore = 0;           // 合計スコア
let legacyStartRoundScore = 0;  // ラウンド開始時スコア（バースト復帰用）
let cuProcessing = false;       // 処理中フラグ
let cuInterval = false;         // インターバル中フラグ

// --- Entry Point ---
// --- Entry Point ---
// --- Entry Point ---
function openLegacyMenu() {
    el("title-screen").style.display = "none";
    el("legacy-select-screen").style.display = "flex";
}

function backToTitleFromLegacySelect() {
    el("legacy-select-screen").style.display = "none";
    el("title-screen").style.display = "flex";
}

function startLegacyGame(mode) {
    legacyMode = true;
    legacyModeType = mode;
    el("legacy-select-screen").style.display = "none";

    // 初期化
    cuRound = 0;
    cuThrow = 0;
    cuRoundScores = [];
    cuCurrentThrows = [];
    cuProcessing = false;
    cuInterval = false;

    // モード別設定
    if (mode === "COUNTUP") {
        cuTotalScore = 0;
        legacyStartRoundScore = 0;
        CU_MAX_ROUNDS = 8;
        el("cu-mode-title").innerText = "COUNT-UP";
    } else {
        const startScore = parseInt(mode);
        cuTotalScore = startScore;
        legacyStartRoundScore = startScore;

        // 01ラウンド制限設定
        if (startScore <= 301) CU_MAX_ROUNDS = 10;
        else if (startScore <= 501) CU_MAX_ROUNDS = 15;
        else CU_MAX_ROUNDS = 20;

        el("cu-mode-title").innerText = `${mode} GAME`;
    }

    // 画面切替 (Game Start)
    el("legacy-screen").style.display = "flex";

    updateCountUpUI();
    updateCountUpDPDisplay();
    updateCountUpBigTotal(); // 初期スコア表示
    currentInput = "";

    playBGM("bgm-battle");
}

/* startCountUp は廃止（互換性のため残すならラップする） */
function startCountUp() { startLegacyGame("COUNTUP"); }

// --- Core: 1投ごとの処理 ---
function processLegacyThrow(score) {
    if (cuProcessing || cuInterval) return;
    if (cuRound >= CU_MAX_ROUNDS) return;

    cuProcessing = true;

    // スコア計算・判定
    let isBust = false;
    let isGameClear = false;

    if (legacyModeType === "COUNTUP") {
        cuCurrentThrows.push(score);
        cuTotalScore += score;
    } else {
        // 01 Logic
        const temp = cuTotalScore - score;
        if (temp < 0) {
            // BUST
            isBust = true;
            cuCurrentThrows.push(score);
            // スコアは減算しない（後で戻す処理）
        } else if (temp === 0) {
            // Game Clear
            isGameClear = true;
            cuCurrentThrows.push(score);
            cuTotalScore = 0;
        } else {
            // Continue
            cuCurrentThrows.push(score);
            cuTotalScore = temp;
        }
    }
    cuThrow++;

    // UI更新
    updateCountUpUI();
    updateCountUpBigTotal();
    triggerCountUpScoreEffect(score);

    // 特殊判定: バースト
    if (isBust) {
        handleBurst();
        return;
    }

    // 特殊判定: 01クリア
    if (isGameClear) {
        finishLegacyRound(true, false); // Clear
        return;
    }

    // ラウンド完了判定 (3投)
    if (cuThrow >= 3) {
        finishLegacyRound(false, false);
    } else {
        cuProcessing = false;
    }
}

// --- バースト処理 ---
function handleBurst() {
    showCommonCutin("BUST!", "style-warning");
    playSE("se-warning");

    setTimeout(() => {
        // スコアをラウンド開始時に戻す
        cuTotalScore = legacyStartRoundScore;
        updateCountUpBigTotal();

        // ラウンド強制終了
        finishLegacyRound(false, true); // isClear=false, isBust=true
    }, 2000);
}

// --- ラウンド終了処理共通 ---
function finishLegacyRound(isClear, isBust) {
    const roundTotal = cuCurrentThrows.reduce((a, b) => a + b, 0);
    cuRoundScores.push([...cuCurrentThrows]);

    if (isClear) {
        // 即座にゲーム終了へ
        setTimeout(() => {
            finishLegacyGame(true);
        }, 1000);
        return;
    }

    // アワード表示 (Bust時はスキップ)
    if (!isBust) {
        setTimeout(() => {
            showCountUpRoundResult(roundTotal);
        }, 300);
    } else {
        // バースト時はアワードなしで次へ
        setTimeout(() => {
            if (cuRound >= CU_MAX_ROUNDS - 1) {
                finishLegacyGame(false);
            } else {
                startCountUpInterval();
            }
        }, 500);
    }
}

// --- バースト処理 ---
function handleBurst() {
    showCommonCutin("BUST!", "style-warning");
    playSE("se-warning");

    setTimeout(() => {
        // スコアをラウンド開始時に戻す
        cuTotalScore = legacyStartRoundScore;
        updateCountUpBigTotal();

        // ラウンド強制終了
        finishLegacyRound(false);
    }, 2000);
}

// --- ラウンド終了処理共通 ---
function finishLegacyRound(isClear) {
    const roundTotal = cuCurrentThrows.reduce((a, b) => a + b, 0);
    cuRoundScores.push([...cuCurrentThrows]);

    if (isClear) {
        // 即座にゲーム終了へ
        setTimeout(() => {
            finishLegacyGame(true);
        }, 1000);
        return;
    }

    // 通常ラウンド終了（アワード表示 -> 次へ）
    // バースト時もアワードは出ないが、ここを通る
    // バーストかどうかはスコアで判定してもいいが、
    // ここではアワード表示後にインターバルへ進む

    // アワード表示 (Count-Up or 01 non-bust)
    // バースト時は既にBUSTが出ているのでアワードは出さないのが一般的だが、
    // Hat Trickでバーストした場合どうする？ -> BUST優先

    // 一旦アワード表示
    setTimeout(() => {
        showCountUpRoundResult(roundTotal);
    }, 300);
}

// --- ラウンド結果表示 ---
function showCountUpRoundResult(roundTotal) {
    const roundNum = cuRound + 1;
    const throws = cuCurrentThrows;

    // ハットトリック判定: Bull×3 (50-50-50) のみ
    const isHatTrick = throws.length === 3 && throws[0] === 50 && throws[1] === 50 && throws[2] === 50;

    // 演出判定
    let effectText = "";
    let effectType = "";
    if (isHatTrick) {
        effectText = "HAT TRICK!";
        effectType = "hattrick";
    } else if (roundTotal >= 151) {
        effectText = "HIGH TON!";
        effectType = "highton";
    } else if (roundTotal >= 100) {
        effectText = "LOW TON!";
        effectType = "lowton";
    }

    if (effectText) {
        showCommonCutin(effectText, effectType);
    }

    // 次ラウンドへ & インターバル
    setTimeout(() => {
        if (cuRound >= CU_MAX_ROUNDS - 1) {
            // 最終ラウンド終了時はリザルトへ直行
            finishLegacyGame(false);
        } else {
            // インターバル画面を表示して待機
            startCountUpInterval();
        }
    }, (effectText ? 2000 : 700));
}

// --- インターバル開始 ---
function startCountUpInterval() {
    cuInterval = true;
    cuProcessing = false; // インターバル中は入力無効だがProcessingは解除しておく（ボタン用）

    // インターバル画面表示
    const overlay = el("cu-interval-screen");
    if (overlay) {
        overlay.style.display = "flex";
        // メッセージ更新などの余地あり
    }
}

// --- 次ラウンド開始 (画面タップ) ---
function startCountUpNextRound() {
    if (!cuInterval) return;

    const overlay = el("cu-interval-screen");
    if (overlay) overlay.style.display = "none";

    cuInterval = false;
    cuRound++;
    cuThrow = 0;
    cuCurrentThrows = [];
    legacyStartRoundScore = cuTotalScore; // ★ラウンド開始時スコア更新

    // UI更新
    updateCountUpUI();
    // ここではアニメーションさせずに数値を整理
    const bigTotal = el("cu-big-total");
    if (bigTotal) bigTotal.innerText = cuTotalScore;

    // 最終ラウンドアナウンス (R8開始時)
    if (cuRound === CU_MAX_ROUNDS - 1) {
        showFinalRoundAnnounce();
    }
}

// --- 共通カットイン使用 (Legacy独自関数は削除) ---
// function showLegacyCutin(text, type) ... removed

// --- ゲーム終了・リザルト ---
// --- ゲーム終了・リザルト ---
function finishLegacyGame(isClear) {
    cuProcessing = true;

    // BGM変更
    playBGM("bgm-title");

    // リザルト画面表示
    showLegacyResult(isClear);
}

// --- リザルト画面構築 ---
function showLegacyResult(isClear) {
    const overlay = el("cu-result-overlay");
    overlay.innerHTML = "";
    overlay.style.display = "flex";
    playSE("se-item");

    // 全投擲取得
    let allThrows = [];
    cuRoundScores.forEach(r => allThrows = allThrows.concat(r));

    if (legacyModeType === "COUNTUP") {
        // --- COUNT-UP Logic ---
        const totalScore = cuTotalScore;
        const ppr = (totalScore / CU_MAX_ROUNDS).toFixed(1);
        const rt = calculateRating(parseFloat(ppr));

        // DP計算
        let gainedDP = Math.floor(totalScore * 1.0);
        let bonusDP = 0;
        let bonusDetails = [];

        // ボーナス: 1ラウンド100点以上
        cuRoundScores.forEach((throws, i) => {
            const rTotal = throws.reduce((a, b) => a + b, 0);
            if (rTotal >= 100) { bonusDP += 10; bonusDetails.push(`R${i + 1} 100+: +10DP`); }
        });
        if (totalScore >= 800) { bonusDP += 100; bonusDetails.push("800点以上: +100DP"); }

        // ハイスコア更新
        if (!savedData.legacy) { savedData.legacy = { countup: { highScore: 0, gamesPlayed: 0, bestPPR: 0 } }; }
        const cu = savedData.legacy.countup;
        let isNewHighScore = false;
        if (totalScore > cu.highScore) {
            cu.highScore = totalScore;
            isNewHighScore = true;
            bonusDP += 50;
            bonusDetails.push("ハイスコア更新: +50DP");
        }
        cu.gamesPlayed++;
        if (parseFloat(ppr) > cu.bestPPR) cu.bestPPR = parseFloat(ppr);

        // 履歴
        if (!cu.history) cu.history = [];
        cu.history.unshift({
            date: new Date().toISOString(),
            score: totalScore,
            ppr: parseFloat(ppr),
            rt: rt,
            rounds: cuRoundScores.map(r => r.reduce((a, b) => a + b, 0))
        });
        if (cu.history.length > 30) cu.history = cu.history.slice(0, 30);

        const totalDP = gainedDP + bonusDP;
        savedData.dp = (savedData.dp || 0) + totalDP;
        saveToDrive();
        updateCountUpDPDisplay();

        // グラフ削除し、HTML生成
        overlay.innerHTML = `
            <div class="cu-result-card">
                <div class="cu-result-title">COUNT-UP RESULT</div>
                ${isNewHighScore ? '<div class="cu-new-record">★ NEW RECORD ★</div>' : ''}
                <div class="cu-result-score">${totalScore}</div>
                <div class="cu-result-stats">
                    <span>PPR: ${ppr}</span>
                    <span>Rt: ${rt}</span>
                </div>
                
                <div class="cu-result-dp-compact" style="margin-top:20px;">
                    <span>+${totalDP} DP</span>
                    <span class="cu-result-dp-current">所持: ${savedData.dp}</span>
                </div>
                <div class="cu-result-buttons">
                    <button class="cu-result-btn cu-retry-btn" onclick="retryLegacyGame()">🔄 RETRY</button>
                    <button class="cu-result-btn" onclick="exitLegacy()">🏠 TITLE</button>
                </div>
            </div>
        `;

    } else {
        // --- 01 GAME Logic ---
        const startScore = parseInt(legacyModeType);
        const reducedScore = startScore - cuTotalScore;

        // PPD, PPR, Rt 計算
        const ppd = allThrows.length > 0 ? (reducedScore / allThrows.length).toFixed(2) : "0.00";
        const ppr = (parseFloat(ppd) * 3).toFixed(1); // 簡易換算
        const rt = calculateRating(parseFloat(ppr));

        let headerText = isClear ? "GAME CLEARED!" : "GAME OVER";
        let headerColor = isClear ? "#ffd700" : "#ff5252";

        // DP計算
        let gainedDP = Math.floor(reducedScore * 0.5);
        if (isClear) {
            const clearBonus = Math.floor(startScore * 0.1); // 10% bonus
            gainedDP += clearBonus;
        }

        savedData.dp = (savedData.dp || 0) + gainedDP;
        saveToDrive();
        updateCountUpDPDisplay();

        // 01リザルトHTML (PPR/Rt表示)
        overlay.innerHTML = `
            <div class="cu-result-card">
                <div class="cu-result-title" style="color:${headerColor};">${headerText}</div>
                <div class="cu-result-score" style="font-size:40px; margin:10px 0;">${legacyModeType}</div>
                
                <div style="display:flex; flex-direction:column; align-items:center; width:100%; margin:15px 0; gap:10px;">
                    <div style="text-align:center;">
                        <div style="font-size:14px; color:#aaa;">ROUNDS</div>
                        <div style="font-size:24px;">${cuRoundScores.length} / ${CU_MAX_ROUNDS}</div>
                    </div>
                     <div class="cu-result-stats">
                        <span>PPR: ${ppr}</span>
                        <span>Rt: ${rt}</span>
                    </div>
                </div>

                <div class="cu-result-dp-compact">
                    <span>+${gainedDP} DP</span>
                    <span class="cu-result-dp-current">所持: ${savedData.dp}</span>
                </div>
                <div class="cu-result-buttons">
                    <button class="cu-result-btn cu-retry-btn" onclick="retryLegacyGame()">🔄 RETRY</button>
                    <button class="cu-result-btn" onclick="exitLegacy()">🏠 TITLE</button>
                </div>
            </div>
        `;
    }
}

// --- リトライ ---
function retryLegacyGame() {
    el("cu-result-overlay").style.display = "none";
    startLegacyGame(legacyModeType);
}

// --- レガシーモード終了 ---
function exitLegacy() {
    legacyMode = false;
    cuProcessing = false;
    cuProcessing = false;
    cuInterval = false;
    el("cu-result-overlay").style.display = "none";
    el("cu-interval-screen").style.display = "none"; // インターバルリセット
    el("legacy-screen").style.display = "none";
    el("title-screen").style.display = "flex";
    updateTitleScore();

    // BGM戻す (タイトル)
    playBGM("bgm-title");
}

// --- DP表示更新 ---
function updateCountUpDPDisplay() {
    const dpEl = el("cu-dp-display");
    if (dpEl) dpEl.innerText = `DP: ${savedData.dp || 0}`;
}

// --- 右側巨大TOTAL更新 ---
// --- 右側巨大TOTAL更新 (アニメーション付き) ---
function updateCountUpBigTotal() {
    const bigTotal = el("cu-big-total");
    if (!bigTotal) return;

    // 現在の表示値を取得
    const currentVal = parseInt(bigTotal.innerText.replace(/,/g, "")) || 0;
    const targetVal = cuTotalScore;

    if (currentVal !== targetVal) {
        // カウントアップアニメーション
        animateNumber(bigTotal.id, currentVal, targetVal, 500);

        // バンプエフェクト (CSSクラス付与)
        bigTotal.classList.remove("bump");
        void bigTotal.offsetWidth; // リフロー
        bigTotal.classList.add("bump");
    }
}

// --- スコアエフェクト (数値ポップ) ---
function triggerCountUpScoreEffect(score) {
    const totalEl = el("cu-big-total");
    if (!totalEl) return;

    const effect = document.createElement("div");
    effect.className = "cu-score-effect";
    effect.innerText = "+" + score;
    // totalEl の中に追加して相対配置にする
    totalEl.appendChild(effect);

    setTimeout(() => effect.remove(), 800);
}

// --- 最終ラウンドアナウンス ---
function showFinalRoundAnnounce() {
    const overlay = el("cu-final-round-overlay");
    if (overlay) {
        overlay.style.display = "flex";
        playSE("se-warning");
        setTimeout(() => {
            overlay.style.display = "none";
            cuProcessing = false;
        }, 1800);
    } else {
        cuProcessing = false;
    }
}

// --- UI更新 ---
function updateCountUpUI() {
    // ラウンド表示
    const roundDisp = el("cu-round-display");
    if (roundDisp) roundDisp.innerText = `ROUND ${cuRound + 1} / ${CU_MAX_ROUNDS}`;

    // 投擲スロット
    for (let i = 0; i < 3; i++) {
        const slot = el(`cu-throw-${i + 1}`);
        if (!slot) continue;
        if (i < cuCurrentThrows.length) {
            slot.innerText = cuCurrentThrows[i];
            slot.className = "cu-throw-slot filled";
        } else if (i === cuThrow) {
            // 現在入力中
            slot.innerText = currentInput || "--";
            slot.className = "cu-throw-slot current";
        } else {
            slot.innerText = "--";
            slot.className = "cu-throw-slot";
        }
    }

    // PPR (リアルタイム)
    const pprDisp = el("cu-ppr-display");
    if (pprDisp) {
        if (cuRound > 0 || cuCurrentThrows.length > 0) {
            const completedRounds = cuRound + (cuCurrentThrows.length >= 3 ? 1 : 0);
            const ppr = completedRounds > 0 ? (cuTotalScore / completedRounds).toFixed(1) : "0.0";
            const rt = calculateRating(parseFloat(ppr));
            pprDisp.innerText = `PPR: ${ppr} (Rt ${rt})`;
        } else {
            pprDisp.innerText = "PPR: -- (Rt --)";
        }
    }

    // ラウンド履歴
    const historyEl = el("cu-round-history");
    if (historyEl) {
        let html = "";
        for (let r = 0; r < cuRoundScores.length; r++) {
            const throws = cuRoundScores[r];
            const rTotal = throws.reduce((a, b) => a + b, 0);
            const cls = rTotal >= 100 ? "cu-history-high" : "";
            html += `<div class="cu-history-row ${cls}">R${r + 1}: ${throws.join(" + ")} = <strong>${rTotal}</strong></div>`;
        }
        // 現在のラウンド (未完了)
        if (cuRound < CU_MAX_ROUNDS && cuCurrentThrows.length > 0) {
            const partial = cuCurrentThrows.join(" + ");
            const partialTotal = cuCurrentThrows.reduce((a, b) => a + b, 0);
            html += `<div class="cu-history-row cu-history-current">R${cuRound + 1}: ${partial} (${partialTotal})</div>`;
        }
        historyEl.innerHTML = html;
    }
}

// --- レガシーモード用 handleEnter ---
function handleLegacyEnter() {
    if (cuProcessing) return;
    if (cuRound >= CU_MAX_ROUNDS) return;
    if (currentInput !== "") {
        const val = parseInt(currentInput);
        if (!isNaN(val)) {
            if (val < 0 || val > 60) {
                alert("単発の最大値は 60 (T20) です");
                currentInput = "";
                updateCountUpUI();
                return;
            }
            // 効果音
            if (val === 50) playSE("se-bull");
            else if (val >= 51) playSE("se-triple");
            else playSE("se-single");

            processLegacyThrow(val);
            currentInput = "";
            updateCountUpUI();
        }
    }
}
