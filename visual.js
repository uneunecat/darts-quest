// =========================================
// 3. VISUAL EFFECTS (演出処理)
// =========================================

// フローティングテキスト (DRAW! など)
function triggerFloatText(text, targetEl) {
    if (!targetEl) return;
    const float = document.createElement("div");
    float.className = "float-text-box";
    float.innerText = text;

    const rect = targetEl.getBoundingClientRect();
    document.body.appendChild(float);

    const left = rect.left + (rect.width / 2) - 30;
    const top = rect.top;

    float.style.left = `${left}px`;
    float.style.top = `${top}px`;
    float.style.position = "fixed";

    setTimeout(() => float.remove(), TIMING.FLOAT_TEXT_DURATION);
}

// Updated: triggerEffect (位置情報をクラスで管理)
function triggerEffect(el, dmg, isPlayer, isHeal = false) {
    if (!isHeal && dmg > 0) {
        const shakeClass = dmg > 50 ? "shake-heavy" : "shake-small";
        const container = document.getElementById("game-container");
        container.classList.remove("shake-small", "shake-heavy");
        void container.offsetWidth;
        container.classList.add(shakeClass);
        setTimeout(() => container.classList.remove(shakeClass), TIMING.SHAKE_DURATION);
    }

    const pop = document.createElement("div");
    // ★ターゲットに応じて側（side）を決定
    const sideClass = isPlayer ? "player-side" : "enemy-side";
    pop.className = `damage-float ${sideClass} ${isHeal ? 'heal' : ''}`;

    pop.innerText = dmg === 0 ? "MISS" : dmg;
    el.appendChild(pop);

    setTimeout(() => pop.remove(), TIMING.DAMAGE_POP_DURATION);
}

// バトルログのアナウンス表示
function announce(text, type = "normal") {
    const ann = el("battle-announcer") || document.createElement("div");
    ann.id = "battle-announcer";
    if (!ann.parentNode) el("enemy-panel").appendChild(ann);

    ann.innerHTML = text;
    ann.className = "announcer-visible";

    if (type === "danger" || type === "log-enemy") ann.classList.add("ann-danger");
    if (type === "log-skill" || type === "log-weak") ann.classList.add("ann-warn");

    setTimeout(() => {
        ann.className = "";
    }, TIMING.ANNOUNCER_DURATION);
}

// ログ出力＆アナウンス振り分け
function addLog(text, type = "") {
    console.log(`[${type}] ${text}`);
    // 特定のログタイプのみ画面中央にアナウンスする
    if ((type === "log-enemy" || type === "log-skill" || type === "log-weak" || type === "log-heal" ||
        text.includes("WEAK") || text.includes("無効") || text.includes("回復")) &&
        !text.includes("倒した") && !text.includes("宝箱")) {
        announce(text, type);
    }
}

// Updated: カットイン色のマッピングを正確に行う
function showSkillCutin(name, type) {
    playSE("se-warning");
    el("cutin-text-val").innerText = name;

    const cutin = el("skill-cutin");
    cutin.className = "";
    // 定義済みのCSSクラスを付与
    if (["fire", "ice", "earth", "wind", "purple", "blue", "gold", "heal"].includes(type)) {
        cutin.classList.add("cutin-" + type);
    } else {
        cutin.classList.add("cutin-fire"); // デフォルト
    }

    cutin.style.display = "flex";
    el("game-container").classList.add("shake-heavy");

    setTimeout(() => {
        cutin.style.display = "none";
        el("game-container").classList.remove("shake-heavy");
    }, TIMING.CUTIN_DURATION);
}

// =========================================
// MP ANIMATION EFFECTS (visual.js)
// =========================================

// Updated: MPを1つずつチャージする演出 (SE付き)
async function animateMPGain(amount) {
    for (let i = 0; i < amount; i++) {
        if (player.mp >= player.maxMp) break;

        player.mp++;
        // 増加音: 軽快なタップ音
        playSE("se-tap");

        const dots = el("player-mp-dots").querySelectorAll(".mp-dot");
        const targetDot = dots[player.mp - 1];
        if (targetDot) {
            targetDot.classList.add("charging");
            await wait(TIMING.MP_CHARGE_GLOW); // 発光時間
            targetDot.classList.remove("charging");
        }

        updateInfo(); // UIに反映
        await wait(TIMING.MP_CHARGE_STEP); // 次のドットへの間隔
    }
}

// Updated: MPを1つずつ減らす演出 (SE付き)
async function animateMPLoss(amount) {
    const absoluteAmount = Math.abs(amount);
    for (let i = 0; i < absoluteAmount; i++) {
        if (player.mp <= 0) break;

        // 現在点灯している一番右のドットを特定
        const dots = el("player-mp-dots").querySelectorAll(".mp-dot");
        const targetDot = dots[player.mp - 1];

        if (targetDot) {
            targetDot.classList.add("losing");
            // 減少音: 少し重みのあるデバフ音
            playSE("se-debuff");
            await wait(TIMING.MP_LOSS_FLASH); // 閃光時間
            targetDot.classList.remove("losing");
        }

        player.mp--;
        updateInfo(); // 消灯を反映
        await wait(TIMING.MP_LOSS_STEP); // 次のドットへの間隔
    }
}

// =========================================
// 10. BATTLE EFFECTS (Hit Impact & Bonus)
// =========================================

// 10.1 Shatter Effect (弱点破壊)
function triggerShatterEffect() {

    // 1. 画面フラッシュ (Purple for Weak Hit)
    flashScreen("flash-purple"); // Added class arg
    playSE("se-hit"); // Fallback for glass-break

    // 2. 敵画像の粉砕アニメーション
    const enemyImg = el("enemy-img");
    if (enemyImg) {
        enemyImg.classList.remove("anim-shatter");
        void enemyImg.offsetWidth; // Reflow
        enemyImg.classList.add("anim-shatter");
    }

    // 3. 激しいシェイク
    const container = el("game-container");
    container.classList.add("shake-heavy");
    setTimeout(() => {
        container.classList.remove("shake-heavy");
        if (enemyImg) enemyImg.classList.remove("anim-shatter");
    }, 500);
}

// 10.2 Screen Flash (Whiteout)
function flashScreen(className = "") { // Added className param
    let flash = el("screen-flash-overlay");
    if (!flash) {
        flash = document.createElement("div");
        flash.id = "screen-flash-overlay";
        flash.className = "screen-flash";
        document.body.appendChild(flash);
    }

    flash.className = "screen-flash"; // Reset
    if (className) flash.classList.add(className); // Apply custom class (e.g., flash-purple)

    flash.classList.remove("flash-active");
    void flash.offsetWidth;
    flash.classList.add("flash-active");
}

// 10.3 Round Result Bonus (Low Ton / Hat Trick / High Ton)

// --- 共通カットイン演出 (Battle / Legacy) ---
function showCommonCutin(text, type) {
    const overlay = el("common-cutin-overlay");
    const textEl = el("common-cutin-text");
    if (!overlay || !textEl) return;

    textEl.innerText = text;
    overlay.className = "common-cutin-overlay " + type; // type別背景用クラス
    overlay.style.display = "flex";

    // SE再生
    if (type === "hattrick") {
        playSE("se-boom");      // 重厚な爆発音（サンダーボルト代替）
        setTimeout(() => playSE("se-warning"), 100); // 警告音重ねがけ
    } else {
        playSE("se-item");
    }

    setTimeout(() => {
        overlay.style.display = "none";
    }, 1800);
}