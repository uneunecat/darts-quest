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

// CPU Battle State
let isCpuBattle = false;
let cpuLevel = 1;
let cpuTotalScore = 0;
let cpuStartRoundScore = 0; // バースト復帰用
let cpuRoundScores = [];
let cpuCurrentThrows = [];
let isPlayerTurn = true;        // true: Player, false: CPU

// --- Entry Point ---
// --- Entry Point ---
// --- Entry Point ---
// --- Entry Point ---
function openLegacyMenu() {
    el("title-screen").style.display = "none";
    el("legacy-select-screen").style.display = "flex";

    // Reset Mode UI
    switchLegacyMode(isCpuBattle ? 'CPU' : 'SOLO');
}

function backToTitleFromLegacySelect() {
    el("legacy-select-screen").style.display = "none";
    el("title-screen").style.display = "flex";
}

// --- UI Logic for CPU Mode ---
function switchLegacyMode(mode) {
    if (mode === 'SOLO') {
        isCpuBattle = false;
        el("btn-mode-solo").classList.add("active");
        el("btn-mode-cpu").classList.remove("active");
    } else {
        isCpuBattle = true;
        el("btn-mode-solo").classList.remove("active");
        el("btn-mode-cpu").classList.add("active");
    }
}

function openCpuLevelModal() {
    const grid = el("cpu-level-grid");
    grid.innerHTML = "";

    Object.values(LegacyAI.LEVELS).forEach(lvl => {
        const btn = document.createElement("div");
        btn.className = "level-btn";
        btn.onclick = () => startCpuGame(parseInt(lvl.name.replace("Lv.", "")));
        btn.innerHTML = `
            <div class="lvl-num">${lvl.name}</div>
            <div class="lvl-rt">Rt ${lvl.rt}</div>
            <div style="font-size:10px; color:#666; margin-top:5px;">Bull ${Math.round(lvl.bullRate * 100)}%</div>
        `;
        grid.appendChild(btn);
    });

    el("cpu-level-modal").style.display = "flex";
}

function closeCpuLevelModal() {
    el("cpu-level-modal").style.display = "none";
}

function startCpuGame(level) {
    cpuLevel = level;
    closeCpuLevelModal();
    startLegacyGameProcess(legacyModeType);
}

function startLegacyGame(mode) {
    legacyMode = true;
    legacyModeType = mode;

    if (isCpuBattle && mode !== "COUNTUP") {
        openCpuLevelModal();
    } else {
        startLegacyGameProcess(mode);
    }
}

function startLegacyGameProcess(mode) {
    el("legacy-select-screen").style.display = "none";

    // 初期化
    cuRound = 0;
    cuThrow = 0;
    cuRoundScores = [];
    cuCurrentThrows = [];
    cuProcessing = false;
    cuInterval = false;

    // CPU Init
    if (isCpuBattle && mode !== "COUNTUP") {
        cpuTotalScore = parseInt(mode);
        cpuStartRoundScore = cpuTotalScore;
        cpuRoundScores = [];
        cpuCurrentThrows = [];
        isPlayerTurn = true; // Player first

        // Show Footer
        el("legacy-score-footer").style.display = "flex";


        // Initial Footer Update
        setTimeout(updateLegacyScoreFooter, 0);
    } else {
        el("legacy-score-footer").style.display = "none";
    }

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

// --- Core: 1投ごとの処理 (Player) ---
function processLegacyThrow(score) {
    if (cuProcessing || cuInterval) return;
    if (isCpuBattle && !isPlayerTurn) return; // CPUターン中は無視
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
    if (isCpuBattle) updateLegacyScoreFooter();
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
// --- ラウンド終了処理共通 ---
function finishLegacyRound(isClear, isBust) {
    console.log(`[DEBUG] finishLegacyRound: Clear=${isClear}, Bust=${isBust}, CPU=${isCpuBattle}, PlayerTurn=${isPlayerTurn}`);

    // Determine current throws
    let currentThrows = (isCpuBattle && !isPlayerTurn) ? cpuCurrentThrows : cuCurrentThrows;
    const rTotal = currentThrows.reduce((a, b) => a + b, 0);

    // Record History logic
    if (isCpuBattle) {
        if (isPlayerTurn) cuRoundScores.push([...cuCurrentThrows]);
        else cpuRoundScores.push([...cpuCurrentThrows]);
    } else {
        cuRoundScores.push([...cuCurrentThrows]);
    }

    if (isClear) {
        setTimeout(() => {
            finishLegacyGame(true);
        }, 1000);
        return;
    }

    // VS CPU Handling
    if (isCpuBattle) {
        if (!isBust) {
            setTimeout(() => {
                showCountUpRoundResult(rTotal);
            }, 300);
        } else {
            // No award on bust
            setTimeout(() => {
                proceedCpuBattleNextStep();
            }, 500);
        }
        return;
    }

    // SOLO Logic (Legacy)
    if (!isBust) {
        setTimeout(() => {
            showCountUpRoundResult(rTotal);
        }, 300);
    } else {
        setTimeout(() => {
            if (cuRound >= CU_MAX_ROUNDS - 1) {
                finishLegacyGame(false);
            } else {
                startCountUpInterval();
            }
        }, 500);
    }
}

// --- ラウンド結果表示 ---
function showCountUpRoundResult(roundTotal) {
    const roundNum = cuRound + 1;
    const throws = (isCpuBattle && !isPlayerTurn) ? cpuCurrentThrows : cuCurrentThrows;

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
        if (isCpuBattle) {
            proceedCpuBattleNextStep();
        } else {
            if (cuRound >= CU_MAX_ROUNDS - 1) {
                // 最終ラウンド終了時はリザルトへ直行
                finishLegacyGame(false);
            } else {
                // インターバル画面を表示して待機
                startCountUpInterval();
            }
        }
    }, (effectText ? 2000 : 700));
}

function proceedCpuBattleNextStep() {
    if (isPlayerTurn) {
        // Player -> CPU
        isPlayerTurn = false;
        showCommonCutin("CPU TURN", "#ff5252");
        setTimeout(startCpuTurn, 1500);
    } else {
        // CPU -> Player
        isPlayerTurn = true;
        cuRound++;

        if (cuRound >= CU_MAX_ROUNDS) {
            finishLegacyGame(false);
        } else {
            showCommonCutin("PLAYER TURN", "#00d2fc");
            setTimeout(prepareNextRound, 1500);
        }
    }
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

// --- VS CPU Round Reset ---
function prepareNextRound() {
    cuThrow = 0;
    cuCurrentThrows = [];
    legacyStartRoundScore = cuTotalScore; // Update Start Score
    // 残りラウンド表示など

    // フッター更新 (VS CPU)
    if (isCpuBattle) updateLegacyScoreFooter();

    updateCountUpUI();
    const bigTotal = el("cu-big-total");
    if (bigTotal) bigTotal.innerText = cuTotalScore;

    // Final Round Announce
    if (cuRound === CU_MAX_ROUNDS - 1) {
        showFinalRoundAnnounce();
    }

    cuProcessing = false; // Unlock Input
}

// --- 共通カットイン使用 (Legacy独自関数は削除) ---
// function showLegacyCutin(text, type) ... removed

// --- ゲーム終了・リザルト ---
// --- ゲーム終了・リザルト ---
function finishLegacyGame(isClear) {
    cuProcessing = true;
    playBGM("bgm-title");

    if (isCpuBattle) {
        // Determine Winner
        let isPlayerWin = false;

        if (isClear) {
            // Open Out: The one who cleared wins
            isPlayerWin = isPlayerTurn;
        } else {
            // Round Limit: Compare scores (Closest to 0 wins, i.e. Smallest score)
            // Draw (same score) -> Player win? or Draw? Lets say Draw is Player Win for now.
            isPlayerWin = cuTotalScore <= cpuTotalScore;
        }
        showCpuBattleResult(isPlayerWin);
    } else {
        showLegacyResult(isClear);
    }
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
        const ppd = allThrows.length > 0 ? (totalScore / allThrows.length) : 0;
        const ppr = (ppd * 3).toFixed(1);
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

        // PPD, PPR, Rt 計算 (Intermediate rounding removed to match UI precisely)
        const ppd = allThrows.length > 0 ? (reducedScore / allThrows.length) : 0;
        const ppr = (ppd * 3).toFixed(1); // 簡易換算
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

// --- CPU Actions ---
function startCpuTurn() {
    updateCountUpUI();
    cpuCurrentThrows = []; // Reset current throws

    // Update Start Round Score for Bust
    cpuStartRoundScore = cpuTotalScore;

    // Start Sequence
    setTimeout(() => cpuThrowLoop(1), 1000);
}

function cpuThrowLoop(throwNum) {
    if (isPlayerTurn) return; // Guard

    // 1. Calculate Throw
    // CPU Score Logic
    // CPU Score Logic
    const result = LegacyAI.throwDart(cpuTotalScore, cpuLevel);
    cpuCurrentThrows.push(result); // Record Throw

    // 2. Animate/Sound
    playSE("se-throw");
    setTimeout(() => {
        // playSE("se-item"); 
        // Sound Logic (Player Same)
        if (result === 50) playSE("se-bull");
        else if (result >= 51) playSE("se-triple");
        else playSE("se-single");

        // 3. Process Result
        let isBust = false;
        let isGameClear = false;
        const temp = cpuTotalScore - result;

        if (temp < 0) {
            isBust = true;
            showCommonCutin("CPU BUST!", "#ff5252");
        } else if (temp === 0) {
            isGameClear = true;
            cpuTotalScore = 0;
            updateCpuUI();
        } else {
            cpuTotalScore = temp;
            updateCpuUI();
        }

        updateCountUpUI(); // Ensure CPU slots and PPR update immediately

        if (isBust) {
            // Restore score
            cpuTotalScore = cpuStartRoundScore;
            updateCpuUI();

            // バースト即終了
            setTimeout(() => finishLegacyRound(false, "bust"), 1000); // isClear=false, isBust=true(string for debug)
            return;
        }

        if (isGameClear) {
            finishLegacyRound(true, false);
            return;
        }

        if (throwNum < 3) {
            setTimeout(() => cpuThrowLoop(throwNum + 1), 800); // Next throw
        } else {
            setTimeout(() => finishLegacyRound(false, false), 1000);
        }

    }, 300); // Flight time
}

function updateCpuUI() {
    updateCountUpBigTotal();
    updateLegacyScoreFooter();
    updateCountUpUI();
}

function updateLegacyScoreFooter() {
    if (!isCpuBattle) return;

    // Update Scores
    el("footer-player-score").innerText = cuTotalScore;
    el("footer-cpu-score").innerText = cpuTotalScore;

    // Update Active Styling
    const pBox = el("footer-player-box");
    const cBox = el("footer-cpu-box");
    const mainArea = document.querySelector(".cu-main-area");

    if (isPlayerTurn) {
        pBox.classList.add("active");
        cBox.classList.remove("active");
        mainArea.classList.remove("turn-cpu");
    } else {
        pBox.classList.remove("active");
        cBox.classList.add("active");
        mainArea.classList.add("turn-cpu");
    }
}

// --- CPU Result Screen ---
function showCpuBattleResult(isPlayerWin) {
    const overlay = el("cu-result-overlay");
    overlay.innerHTML = "";
    overlay.style.display = "flex";

    const headerText = isPlayerWin ? "YOU WIN!" : "YOU LOSE...";
    const headerColor = isPlayerWin ? "#ffd700" : "#ff5252";

    // DP Calc
    let earnedDP = 0;
    const startScore = parseInt(legacyModeType);

    if (isPlayerWin) {
        // Base: Start Score
        earnedDP += startScore; // User request: "501Game -> 500 DP" (approx)
        // Level Bonus
        earnedDP += cpuLevel * 50;
        // Winner BGM
        playSE("se-fanfare");
    } else {
        // Lose: Reduced Score * 0.2? (Low reward)
        const reduced = startScore - cuTotalScore;
        earnedDP += Math.floor(reduced * 0.2);
    }

    savedData.dp = (savedData.dp || 0) + earnedDP;
    saveToDrive();
    updateCountUpDPDisplay();

    const playerTotalThrows = cuRoundScores.reduce((acc, r) => acc + r.length, 0);
    const cpuTotalThrows = cpuRoundScores.reduce((acc, r) => acc + r.length, 0);

    const playerPoints = startScore - cuTotalScore;
    const cpuPoints = startScore - cpuTotalScore;

    const playerPPR = playerTotalThrows > 0 ? ((playerPoints / playerTotalThrows) * 3).toFixed(1) : "0.0";
    const cpuPPR = cpuTotalThrows > 0 ? ((cpuPoints / cpuTotalThrows) * 3).toFixed(1) : "0.0";

    const playerRt = calculateRating(parseFloat(playerPPR));
    const cpuRt = calculateRating(parseFloat(cpuPPR));

    overlay.innerHTML = `
        <div class="cu-result-card" style="border-color:${headerColor}; box-shadow:0 0 30px ${headerColor};">
            <div class="cu-result-title" style="color:${headerColor}; font-size:50px;">${headerText}</div>
            
            <div style="display:flex; justify-content:space-around; width:100%; margin:20px 0; align-items:center;">
                <div style="text-align:center;">
                    <div style="font-size:16px; color:#aaa;">PLAYER</div>
                    <div style="font-size:24px; color:#fff;">
                        PPR: ${playerPPR}<br>
                        Rt: ${playerRt}
                    </div>
                </div>
                <div style="font-size:30px; color:#888;">VS</div>
                <div style="text-align:center;">
                    <div style="font-size:16px; color:#aaa;">CPU (Lv.${cpuLevel})</div>
                    <div style="font-size:24px; color:#fff;">
                        PPR: ${cpuPPR}<br>
                        Rt: ${cpuRt}
                    </div>
                </div>
            </div>

            <div class="cu-result-dp-compact">
                <span>+${earnedDP} DP</span>
                <span class="cu-result-dp-current">所持: ${savedData.dp}</span>
            </div>
            
            <div class="cu-result-buttons">
                <button class="cu-result-btn cu-retry-btn" onclick="retryLegacyGame()">🔄 REMATCH</button>
                <button class="cu-result-btn" onclick="exitLegacy()">🏠 TITLE</button>
            </div>
        </div>
    `;
}

// --- レガシーモード終了 ---
function exitLegacy() {
    el("cu-result-overlay").style.display = "none";
    el("legacy-screen").style.display = "none";
    backToTitleFromLegacySelect(); // タイトルへ戻る

    // BGM
    playBGM("bgm-title");
}


// =========================================
// AI LOGIC (LegacyAI)
// =========================================
const LegacyAI = {
    // Clockwise order
    BOARD_LAYOUT: [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5],

    // Level Params
    LEVELS: {
        1: { name: "Lv.1", rt: 1, bullRate: 0.10, sBullRatio: 0.50 },
        2: { name: "Lv.2", rt: 3, bullRate: 0.20, sBullRatio: 0.50 },
        3: { name: "Lv.3", rt: 5, bullRate: 0.30, sBullRatio: 0.60 },
        4: { name: "Lv.4", rt: 7, bullRate: 0.40, sBullRatio: 0.60 },
        5: { name: "Lv.5", rt: 9, bullRate: 0.50, sBullRatio: 0.70 },
        6: { name: "Lv.6", rt: 12, bullRate: 0.65, sBullRatio: 0.70 },
        7: { name: "Lv.7", rt: 15, bullRate: 0.80, sBullRatio: 0.80 },
        8: { name: "Lv.8", rt: 18, bullRate: 0.95, sBullRatio: 0.90 }
    },

    // Hit Rate Multipliers
    RATES: { SINGLE: 1.5, DOUBLE: 0.8, TRIPLE: 0.6, BULL: 1.0 },

    // DartsHive Single Out Arrange Chart (120 to 1)
    SINGLE_OUT_ARRANGE: {
        120: "BULL", 119: "BULL", 118: "BULL", 117: "BULL", 116: "BULL",
        115: "BULL", 114: "BULL", 113: "BULL", 112: "BULL", 111: "BULL",
        110: "BULL", 109: "BULL", 108: "BULL", 107: "BULL", 106: "BULL",
        105: "BULL", 104: "BULL", 103: "BULL", 102: "BULL", 101: "BULL",
        100: "BULL", 99: "T20", 98: "BULL", 97: "T19", 96: "BULL",
        95: "BULL", 94: "BULL", 93: "BULL", 92: "BULL", 91: "BULL",
        90: "BULL", 89: "T19", 88: "BULL", 87: "T17", 86: "BULL",
        85: "T19", 84: "BULL", 83: "T20", 82: "BULL", 81: "T19",
        80: "BULL", 79: "T19", 78: "BULL", 77: "BULL", 76: "BULL",
        75: "T17", 74: "BULL", 73: "T19", 72: "BULL", 71: "T20",
        70: "BULL", 69: "BULL", 68: "BULL", 67: "BULL", 66: "BULL",
        65: "BULL", 64: "BULL", 63: "BULL", 62: "BULL", 61: "BULL",
        60: "S20", 59: "BULL", 58: "BULL", 57: "S19", 56: "BULL",
        55: "BULL", 54: "S18", 53: "BULL", 52: "BULL", 51: "S17",
        50: "BULL", 49: "S20", 48: "S20", 47: "S20", 46: "S20",
        45: "S15", 44: "S20", 43: "S20", 42: "S14", 41: "S20",
        40: "S20", 39: "S20", 38: "S20", 37: "S20", 36: "S18",
        35: "S20", 34: "S17", 33: "S20", 32: "S16", 31: "S20",
        30: "S15", 29: "S20", 28: "S14", 27: "S9", 26: "S13",
        25: "S20", 24: "S12", 23: "S20", 22: "S11", 21: "S7",
        20: "S20", 19: "S19", 18: "S18", 17: "S17", 16: "S16",
        15: "S15", 14: "S14", 13: "S13", 12: "S12", 11: "S11",
        10: "S10", 9: "S9", 8: "S8", 7: "S7", 6: "S6",
        5: "S5", 4: "S4", 3: "S3", 2: "S2", 1: "S1"
    },

    // Core Method: Calculate a throw
    throwDart: function (currentScore, level) {
        const lvlData = this.LEVELS[level] || this.LEVELS[1];
        const bestTarget = this.decideTarget(currentScore, lvlData);
        return this.executeThrow(bestTarget, lvlData);
    },

    decideTarget: function (currentScore, lvlData) {
        // If not 01 Game, just aim for BULL scoring
        if (legacyModeType === "COUNTUP") {
            return { type: "BULL", value: 50 };
        }

        // 01 Game: Arrange logic under 120 points
        if (currentScore <= 120 && currentScore > 0) {
            const arrangeCode = this.SINGLE_OUT_ARRANGE[currentScore];
            if (arrangeCode) {
                if (arrangeCode === "BULL") return { type: "BULL", value: 50 };
                const typeChar = arrangeCode.charAt(0);
                const num = parseInt(arrangeCode.substring(1));
                if (typeChar === "S") return { type: "SINGLE", value: num, num: num };
                if (typeChar === "D") return { type: "DOUBLE", value: num * 2, num: num };
                if (typeChar === "T") return { type: "TRIPLE", value: num * 3, num: num };
            }
        }

        // Scoring Phase (>120): Aim for BULL
        return { type: "BULL", value: 50 };
    },

    findWinningTargets: function (score) {
        const targets = [];
        // Bull Finish
        if (score === 50) targets.push({ type: "BULL", value: 50 });
        // Singles (1-20)
        if (score <= 20) targets.push({ type: "SINGLE", value: score, num: score });
        // Doubles (1-20)
        if (score <= 40 && score % 2 === 0) targets.push({ type: "DOUBLE", value: score, num: score / 2 });
        // Triples (1-20)
        if (score <= 60 && score % 3 === 0) targets.push({ type: "TRIPLE", value: score, num: score / 3 });
        // S-Bull (25) -> 50
        if (score === 50) targets.push({ type: "S-BULL", value: 50 });
        return targets;
    },

    getHitRate: function (type, baseRate) {
        if (type === "BULL" || type === "S-BULL") return baseRate * this.RATES.BULL;
        if (type === "SINGLE") return Math.min(1.0, baseRate * this.RATES.SINGLE);
        if (type === "DOUBLE") return Math.min(1.0, baseRate * this.RATES.DOUBLE);
        if (type === "TRIPLE") return Math.min(1.0, baseRate * this.RATES.TRIPLE);
        return 0;
    },

    executeThrow: function (target, lvlData) {
        const hitRate = this.getHitRate(target.type, lvlData.bullRate);
        const rand = Math.random();

        if (rand < hitRate) {
            // HIT!
            if (target.type === "BULL") {
                return 50; // Use 50 for both Inner/Outer in this rule
            }
            if (target.type === "S-BULL") return 50;
            return target.value;
        } else {
            // MISS
            return this.getMissResult(target);
        }
    },

    getMissResult: function (target) {
        if (target.type === "BULL" || target.type === "S-BULL") {
            // Bull miss -> Random Single 1-20
            return Math.floor(Math.random() * 20) + 1;
        }

        const num = target.num;
        const neighbors = this.getNeighbors(num);
        const candidates = [];

        if (target.type === "TRIPLE") {
            candidates.push(num); // S(target)
            candidates.push(neighbors[0]); // S(left)
            candidates.push(neighbors[0] * 3); // T(left)
            candidates.push(neighbors[1]); // S(right)
            candidates.push(neighbors[1] * 3); // T(right)
        } else if (target.type === "DOUBLE") {
            candidates.push(num);
            candidates.push(neighbors[0]);
            candidates.push(neighbors[0] * 2);
            candidates.push(neighbors[1]);
            candidates.push(neighbors[1] * 2);
            candidates.push(0); // OUT
        } else if (target.type === "SINGLE") {
            candidates.push(num * 2);
            candidates.push(num * 3);
            candidates.push(neighbors[0]);
            candidates.push(neighbors[1]);
        }

        // Pick random
        const r = Math.floor(Math.random() * candidates.length);
        return candidates[r];
    },

    getNeighbors: function (num) {
        const idx = this.BOARD_LAYOUT.indexOf(num);
        if (idx === -1) return [1, 20];
        const leftIdx = (idx === 0) ? this.BOARD_LAYOUT.length - 1 : idx - 1;
        const rightIdx = (idx === this.BOARD_LAYOUT.length - 1) ? 0 : idx + 1;
        return [this.BOARD_LAYOUT[leftIdx], this.BOARD_LAYOUT[rightIdx]];
    }
};

// --- DP表示更新 ---
function updateCountUpDPDisplay() {
    const dpEl = el("cu-dp-display");
    if (dpEl) dpEl.innerText = `DP: ${savedData.dp || 0}`;
}

// --- 右側巨大TOTAL更新 ---
// --- スコア表示更新 (Big Total) ---
function updateCountUpBigTotal() {
    const elTotal = el("cu-big-total");
    if (!elTotal) return;

    let displayScore = cuTotalScore;
    if (isCpuBattle && !isPlayerTurn) {
        displayScore = cpuTotalScore;
    }

    // 単純更新（アニメーション効果は別途CSSまたはeffectで）
    // elTotal.innerText = displayScore;

    const currentVal = parseInt(elTotal.innerText.replace(/,/g, "")) || 0;
    if (currentVal !== displayScore) {
        legacyAnimateNumber(elTotal.id, currentVal, displayScore, 500);
        elTotal.classList.remove("bump");
        void elTotal.offsetWidth;
        elTotal.classList.add("bump");
    }
}

// --- スコアエフェクト (数値ポップ) ---
function triggerCountUpScoreEffect(score) {
    const totalEl = el("cu-big-total");
    if (!totalEl) return;

    /* Disabled
    const elEffect = document.createElement("div");
    elEffect.className = "cu-score-effect";
    if (isCpuBattle && !isPlayerTurn) {
        elEffect.classList.add("cpu-effect");
    }
    elEffect.innerText = `+${score}`;
    totalEl.appendChild(elEffect);
    setTimeout(() => elEffect.remove(), 800);
    */
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

    // Target Selection
    const targetScores = (isCpuBattle && !isPlayerTurn) ? cpuRoundScores : cuRoundScores;
    const targetCurrent = (isCpuBattle && !isPlayerTurn) ? cpuCurrentThrows : cuCurrentThrows;
    const targetLabel = (isCpuBattle && !isPlayerTurn) ? "CPU" : "";

    // 投擲スロット
    for (let i = 0; i < 3; i++) {
        const slot = el(`cu-throw-${i + 1}`);
        if (!slot) continue;
        if (i < targetCurrent.length) {
            slot.innerText = targetCurrent[i];
            slot.className = "cu-throw-slot filled";
        } else if (i === cuThrow && (!isCpuBattle || isPlayerTurn)) {
            // 現在入力中 (Player Only)
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
        const isCpuTurn = isCpuBattle && !isPlayerTurn;
        const currentTotalScore = isCpuTurn ? cpuTotalScore : cuTotalScore;
        const targetRoundScores = isCpuTurn ? cpuRoundScores : cuRoundScores;

        let totalThrows = 0;
        targetRoundScores.forEach(r => totalThrows += r.length);
        // ラウンド履歴に現在の投擲がまだ記録されていない（ラウンド進行中）場合のみ、現在の投擲数を加算
        if (targetRoundScores.length === cuRound) {
            totalThrows += targetCurrent.length;
        }

        if (totalThrows > 0) {
            // Calculate Total Points (Hit based)
            let totalPoints = 0;
            if (legacyModeType === "COUNTUP") {
                totalPoints = currentTotalScore;
            } else {
                const startScore = parseInt(legacyModeType);
                totalPoints = startScore - currentTotalScore;
            }

            const ppd = totalPoints / totalThrows;
            const ppr = (ppd * 3).toFixed(1);
            const rt = calculateRating(parseFloat(ppr));

            const label = isCpuTurn ? "CPU " : "";
            pprDisp.innerText = `${label}PPR: ${ppr} (Rt ${rt})`;
        } else {
            const label = isCpuTurn ? "CPU " : "";
            pprDisp.innerText = `${label}PPR: 0.0 (Rt 1)`;
        }
    }

    // ラウンド履歴
    const historyEl = el("cu-round-history");
    if (historyEl) {
        const targetScores = (isCpuBattle && !isPlayerTurn) ? cpuRoundScores : cuRoundScores;
        const targetCurrent = (isCpuBattle && !isPlayerTurn) ? cpuCurrentThrows : cuCurrentThrows;
        const targetLabel = (isCpuBattle && !isPlayerTurn) ? "CPU" : "";

        let html = "";
        for (let r = 0; r < targetScores.length; r++) {
            const throws = targetScores[r];
            const rTotal = throws.reduce((a, b) => a + b, 0);
            const cls = rTotal >= 100 ? "cu-history-high" : "";
            html += `<div class="cu-history-row ${cls}">${targetLabel} R${r + 1}: ${throws.join(" + ")} = <strong>${rTotal}</strong></div>`;
        }
        // 現在のラウンド (未完了)
        if (cuRound < CU_MAX_ROUNDS && targetCurrent.length > 0) {
            const partial = targetCurrent.join(" + ");
            const partialTotal = targetCurrent.reduce((a, b) => a + b, 0);
            html += `<div class="cu-history-row cu-history-current">${targetLabel} R${cuRound + 1}: ${partial} (${partialTotal})</div>`;
        }
        historyEl.innerHTML = html;
    }
}

function legacyAnimateNumber(id, start, end, duration) {
    const obj = document.getElementById(id);
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.innerHTML = end;
        }
    };
    window.requestAnimationFrame(step);
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
