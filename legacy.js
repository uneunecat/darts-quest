// =========================================
// LEGACY DARTS MODE - COUNT-UP (v1.0)
// =========================================

// --- State ---
let legacyMode = false;         // レガシーモードがアクティブか
const CU_MAX_ROUNDS = 8;       // カウントアップのラウンド数
let cuRound = 0;                // 現在のラウンド (0-indexed)
let cuThrow = 0;                // 現在の投擲番号 (0, 1, 2)
let cuRoundScores = [];         // 全ラウンドのスコア配列 [[r1t1,r1t2,r1t3], ...]
let cuCurrentThrows = [];       // 現ラウンドの投擲スコア
let cuTotalScore = 0;           // 合計スコア
let cuProcessing = false;       // 処理中フラグ
let cuInterval = false;         // インターバル中フラグ

// --- Entry Point ---
function openLegacyMenu() {
    // 将来: カウントアップ / 01 の選択画面
    // 今はカウントアップ直接開始
    startCountUp();
}

function startCountUp() {
    legacyMode = true;
    cuRound = 0;
    cuThrow = 0;
    cuRoundScores = [];
    cuCurrentThrows = [];
    cuTotalScore = 0;
    cuProcessing = false;
    cuInterval = false;

    // 画面切替
    el("title-screen").style.display = "none";
    el("legacy-screen").style.display = "flex";

    // UI初期化
    updateCountUpUI();
    updateCountUpDPDisplay();
    currentInput = "";  // キーボード入力バッファのクリア

    // BGM変更 (戦闘曲)
    playBGM("bgm-battle");
}

// --- Core: 1投ごとの処理 ---
function processLegacyThrow(score) {
    if (cuProcessing || cuInterval) return;
    if (cuRound >= CU_MAX_ROUNDS) return;

    cuProcessing = true;

    // スコア記録
    cuCurrentThrows.push(score);
    cuTotalScore += score;
    cuThrow++;

    // UI更新
    updateCountUpUI();
    updateCountUpBigTotal();

    // エフェクトトリガー
    triggerCountUpScoreEffect(score);

    // ラウンド完了判定 (3投)
    if (cuThrow >= 3) {
        const roundTotal = cuCurrentThrows.reduce((a, b) => a + b, 0);
        cuRoundScores.push([...cuCurrentThrows]);

        // ラウンド結果演出
        setTimeout(() => {
            showCountUpRoundResult(roundTotal);
        }, 300);
    } else {
        cuProcessing = false;
    }
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
            finishCountUp();
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
function finishCountUp() {
    cuProcessing = true;
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
        if (rTotal >= 100) {
            bonusDP += 10;
            bonusDetails.push(`R${i + 1} 100+: +10DP`);
        }
    });

    // ボーナス: 800点以上
    if (totalScore >= 800) {
        bonusDP += 100;
        bonusDetails.push("800点以上: +100DP");
    }

    // ハイスコア更新
    if (!savedData.legacy) {
        savedData.legacy = { countup: { highScore: 0, gamesPlayed: 0, bestPPR: 0 } };
    }
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

    // 履歴記録
    if (!savedData.legacy.countup.history) savedData.legacy.countup.history = [];
    savedData.legacy.countup.history.unshift({
        date: new Date().toISOString(),
        score: totalScore,
        ppr: parseFloat(ppr),
        rt: rt,
        rounds: cuRoundScores.map(r => r.reduce((a, b) => a + b, 0))
    });
    if (savedData.legacy.countup.history.length > 30) {
        savedData.legacy.countup.history = savedData.legacy.countup.history.slice(0, 30);
    }

    const totalDP = gainedDP + bonusDP;
    savedData.dp = (savedData.dp || 0) + totalDP;
    saveToDrive();

    // リザルト画面表示
    showCountUpResult(totalScore, ppr, rt, gainedDP, bonusDP, bonusDetails, isNewHighScore);
}

// --- リザルト画面 ---
function showCountUpResult(totalScore, ppr, rt, baseDP, bonusDP, bonusDetails, isNewHighScore) {
    const resultArea = el("cu-result-overlay");

    // 各ラウンドの100点ボーナスをマップに
    const roundBonusMap = {};
    cuRoundScores.forEach((throws, i) => {
        const rTotal = throws.reduce((a, b) => a + b, 0);
        if (rTotal >= 100) roundBonusMap[i] = true;
    });

    let roundsHTML = cuRoundScores.map((throws, i) => {
        const rTotal = throws.reduce((a, b) => a + b, 0);
        const throwsStr = throws.join("+");
        const highlight = rTotal >= 100 ? ' cu-result-highlight' : '';
        const bonusTag = roundBonusMap[i] ? '<span class="cu-inline-bonus">+10</span>' : '';
        return `<span class="cu-result-round-inline${highlight}">R${i + 1}:${rTotal}${bonusTag}</span>`;
    }).join("");

    // ボーナスまとめ (ラウンドボーナス以外)
    let extraBonus = bonusDetails.filter(b => !b.includes("100+")).map(b => `<span>🏆 ${b}</span>`).join("");

    resultArea.innerHTML = `
        <div class="cu-result-card">
            <div class="cu-result-title">COUNT-UP RESULT</div>
            ${isNewHighScore ? '<div class="cu-new-record">★ NEW RECORD ★</div>' : ''}
            <div class="cu-result-score">${totalScore}</div>
            <div class="cu-result-stats">
                <span>PPR: ${ppr}</span>
                <span>Rt: ${rt}</span>
            </div>
            <div class="cu-result-rounds-inline">${roundsHTML}</div>
            ${extraBonus ? `<div class="cu-result-bonus-line">${extraBonus}</div>` : ''}
            <div class="cu-result-dp-compact">
                <span>+${baseDP + bonusDP} DP</span>
                <span class="cu-result-dp-current">所持: ${savedData.dp || 0}</span>
            </div>
            <div class="cu-result-buttons">
                <button class="cu-result-btn cu-retry-btn" onclick="retryCountUp()">🔄 RETRY</button>
                <button class="cu-result-btn" onclick="exitLegacy()">🏠 TITLE</button>
            </div>
        </div>
    `;
    resultArea.style.display = "flex";
    playSE("se-item");
}

// --- リトライ ---
function retryCountUp() {
    el("cu-result-overlay").style.display = "none";
    startCountUp();
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
