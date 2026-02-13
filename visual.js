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

// 画面サイズ調整 (レスポンシブ対応)
function resizeGame() {
    const scaler = el('game-scaler');
    if (!scaler) return;

    if (window.innerWidth >= 900) {
        // PC向け: スケーリング処理
        const scale = Math.min(window.innerWidth / 900, window.innerHeight / 620) * 0.95;
        scaler.style.transform = `scale(${scale})`;
        scaler.style.width = "900px";
        scaler.style.height = "620px";
        scaler.style.position = "static";
        document.body.style.overflow = "hidden";
    } else {
        // モバイル向け: フル幅表示
        scaler.style.transform = "none";
        scaler.style.width = "100%";
        scaler.style.height = "auto";
        document.body.style.overflowY = "auto";
    }
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