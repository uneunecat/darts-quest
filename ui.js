// =========================================
// 1. SYSTEM UI & CONFIG (システムUI・設定)
// =========================================

function resizeGame() {
    const scaler = el('game-scaler');
    if (!scaler) return;

    if (window.innerWidth >= 900) {
        const scale = Math.min(window.innerWidth / 900, window.innerHeight / 620) * 0.95;
        scaler.style.transform = `scale(${scale})`;
        scaler.style.width = "900px";
        scaler.style.height = "620px";
        scaler.style.position = "static";
        document.body.style.overflow = "hidden";
    } else {
        scaler.style.transform = "none";
        scaler.style.width = "100%";
        scaler.style.height = "auto";
        document.body.style.overflowY = "auto";
    }
}

function updateScoreDisplay() {
    [1, 2, 3].forEach((i) => {
        const sideSlot = el(`slot-${i}-side`);
        const mainSlot = el(`slot-${i}`);
        let val = "--";
        let styleClass = "low";

        if (i - 1 < turnInputs.length) {
            val = turnInputs[i - 1];
            styleClass = (val >= 50) ? "high filled" : "filled";
        } else if (i - 1 === turnInputs.length) {
            val = currentInput;
            styleClass = "active";
        }

        if (sideSlot) {
            sideSlot.innerText = val;
            sideSlot.className = `score-val ${styleClass}`;
        }
        if (mainSlot) {
            mainSlot.innerText = val;
        }
    });

    [1, 2, 3].forEach((i) => {
        const dot = el(`d-dot-${i}`);
        if (dot) {
            dot.className = "d-dot";
            if (i - 1 < turnInputs.length) dot.classList.add("filled");
            else if (i - 1 === turnInputs.length) dot.classList.add("active");
        }
    });
}

function openConfigModal() {
    let modal = el("config-modal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "config-modal";
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="config-box">
            <div class="config-title">AUDIO CONFIG</div>
            <div class="config-row">
                <div class="config-label"><span>BGM (Music)</span><span id="val-bgm">${Math.round(gameConfig.bgmVolume * 100)}%</span></div>
                <input type="range" class="config-slider" min="0" max="100" value="${gameConfig.bgmVolume * 100}" oninput="updateConfigVal('bgm', this.value)">
            </div>
            <div class="config-row">
                <div class="config-label"><span>SYSTEM SE</span><span id="val-sys">${Math.round(gameConfig.sysVolume * 100)}%</span></div>
                <input type="range" class="config-slider" min="0" max="100" value="${gameConfig.sysVolume * 100}" oninput="updateConfigVal('sys', this.value)">
            </div>
            <div class="config-row">
                <div class="config-label"><span style="color:#ffaaaa;">ATTACK SE (Hit)</span><span id="val-atk" style="color:#ff4444;">${Math.round(gameConfig.atkVolume * 100)}%</span></div>
                <input type="range" class="config-slider slider-atk" min="0" max="100" value="${gameConfig.atkVolume * 100}" oninput="updateConfigVal('atk', this.value)">
            </div>
            <div class="config-buttons">
                <button class="btn-conf btn-reset" onclick="resetConfig()">RESET</button>
                <button class="btn-conf btn-save" onclick="closeConfig()">CLOSE</button>
            </div>
        </div>`;

    modal.style.display = "flex";
    playSE("se-tap");
}

window.updateConfigVal = function (type, val) {
    const floatVal = val / 100;
    if (type === 'bgm') {
        gameConfig.bgmVolume = floatVal;
        el("val-bgm").innerText = val + "%";
        updateCurrentBgmVolume();
    } else if (type === 'sys') {
        gameConfig.sysVolume = floatVal;
        el("val-sys").innerText = val + "%";
    } else if (type === 'atk') {
        gameConfig.atkVolume = floatVal;
        el("val-atk").innerText = val + "%";
    }
};

window.resetConfig = function () {
    gameConfig = { bgmVolume: 0.3, sysVolume: 0.5, atkVolume: 0.8 };
    playSE("se-tap");
    openConfigModal();
    updateCurrentBgmVolume();
};

window.closeConfig = function () {
    saveGameConfig();
    playSE("se-tap");
    el("config-modal").style.display = "none";
};

function getRankColor(r) {
    if (r === "SSS") return "#00ffff";
    if (r === "S") return "#ffd700";
    if (r === "A") return "#ff5555";
    return "#fff";
}

// =========================================
// 2. BATTLE UI (戦闘UI・表示)
// =========================================

function updateInfo() {
    if (!enemy.data) return;
    const setText = (id, text) => { const e = el(id); if (e) e.innerText = text; };
    const setHTML = (id, html) => { const e = el(id); if (e) e.innerHTML = html; };

    let stgDisp = getStageDisplayName(stage);
    setText("stage-display", stgDisp);
    setText("floor-display", getMaxFloors(stage) === 1 ? "FINAL" : `${floor}F`);
    setHTML("turn-display", `TURN ${currentTurn} <span style="font-size:12px; color:#888;">(Total ${(totalGameTurns - stageStartTurn) + 1})</span>`);

    setText("enemy-name-side", enemy.name);
    const eHpEl = el("enemy-hp-value");
    if (eHpEl) {
        eHpEl.innerText = enemy.hp;
        eHpEl.className = "hp-mega-text";
        if (enemy.hp <= enemy.maxHp * 0.2) eHpEl.classList.add("blink-fast");
        else if (enemy.hp <= enemy.maxHp * 0.5) eHpEl.classList.add("blink-slow");
    }

    let weakText = `WEAK: ${enemy.data.weak}+`;
    if (weakHitCount > 0) weakText += " <span style='color:#f0f;'>CHANCE!</span>";
    setHTML("weak-display", weakText);

    const renderChips = (obj) => {
        if (!obj || !obj.states) return "";
        return obj.states.map(s => {
            const master = STATE_MASTER[s.id];
            if (!master) return "";
            let valText = "";
            if (master.category === "atk_mult") valText = `x${(1 + s.val).toFixed(1)}`;
            else if (master.category === "atk_add") valText = `+${s.val}`;
            else if (s.val !== 0) valText = `${s.val}`;
            const unit = (master.timing === "throw") ? "投" : "T";
            return `<span class="status-chip ${master.class}">${master.icon}${master.label} ${valText}(${s.turn}${unit})</span>`;
        }).join("");
    };

    setHTML("enemy-states-side", renderChips(enemy));
    setHTML("player-states-side", renderChips(player));

    const hpBar = el("player-hp-bar");
    if (hpBar) {
        const pct = (player.hp / player.maxHp) * 100;
        hpBar.style.width = Math.max(0, pct) + "%";
        hpBar.className = `hp-bar-fill player-fill ${pct <= 20 ? 'hp-danger' : pct <= 50 ? 'hp-warning' : ''}`;

        let overlay = hpBar.parentNode.querySelector(".hp-text-overlay");
        if (!overlay) {
            overlay = document.createElement("div");
            overlay.className = "hp-text-overlay";
            hpBar.parentNode.appendChild(overlay);
        }
        overlay.innerText = `${player.hp} / ${player.maxHp}`;
    }

    let mpDots = "";
    for (let i = 0; i < player.maxMp; i++) {
        mpDots += `<span class="mp-dot ${i < player.mp ? 'active' : ''}"></span>`;
    }
    setHTML("player-mp-dots", mpDots);
    if (player.mp >= player.maxMp) el("player-mp-dots").classList.add("mp-max-glow");
    else el("player-mp-dots").classList.remove("mp-max-glow");

    /* updateItemBtn deleted */

    const trapContainer = el("trap-slot-container");
    if (trapContainer) {
        trapContainer.innerHTML = "";
        if (player.setCard) {
            const c = CARD_DB.find(cd => cd.id === player.setCard);
            if (c) {
                const cardEl = createCardElement(c, "battle", 0, 1);
                cardEl.onclick = null;
                trapContainer.appendChild(cardEl);
            }
        } else {
            trapContainer.innerHTML = `<div id="trap-slot" class="trap-slot empty">SET<br>TRAP</div>`;
        }
    }

    let ppr = totalDarts > 0 ? (totalScore / totalDarts) * 3 : 0;
    const avgDisp = el("avg-display");
    if (avgDisp) avgDisp.innerText = ppr.toFixed(1);
    const rtDisp = el("rt-display");
    if (rtDisp) rtDisp.innerText = `(Rt ${calculateRating(ppr)})`;

    renderHand();
}

function renderHand() {
    const handArea = el("hand-area");
    if (!handArea) return;
    handArea.innerHTML = "";
    const countDisp = el("hand-count-display");
    if (countDisp) countDisp.innerText = player.hand.length;

    const isThrowing = turnInputs.length > 0;
    const isCardLocked = hasState(player, "item_lock") || isThrowing;

    const deckCountDisp = el("battle-deck-count");
    if (player.deckLocked) {
        if (deckCountDisp) deckCountDisp.innerText = "-";
        handArea.innerHTML = `<div class="hand-locked-msg">⚠️ NO DECK</div>`;
    } else {
        if (deckCountDisp) deckCountDisp.innerText = player.deck.length;
        if (player.hand.length === 0) {
            handArea.innerHTML = `<div class="hand-card-empty">NO CARD</div>`;
        } else {
            player.hand.forEach((cardId, index) => {
                const card = CARD_DB.find(c => c.id === cardId);
                const div = createCardElement(card, "battle", 0, 1);
                div.className += " hand-card";

                if (player.mp < card.cost || isCardLocked) {
                    div.classList.add("disabled");
                }

                div.onclick = () => playHandCard(index);
                handArea.appendChild(div);
            });
        }
    }
}

function openDiscardSelector(count = 1) {
    return new Promise((resolve) => {
        const modal = el("card-selector-modal");
        const grid = el("cs-grid");
        grid.innerHTML = "";
        el("cs-message").innerText = `${count}枚選んで捨ててください`;

        player.hand.forEach((cardId, idx) => {
            const card = CARD_DB.find(c => c.id === cardId);
            const div = createCardElement(card, "battle", 0, 1);
            div.onclick = () => {
                player.hand.splice(idx, 1);
                player.discard.push(cardId);
                playSE("se-tap");
                el("card-selector-modal").style.display = "none";
                if (count > 1 && player.hand.length > 0) {
                    openDiscardSelector(count - 1).then(resolve);
                } else {
                    resolve();
                }
            };
            grid.appendChild(div);
        });
        modal.style.display = "flex";
    });
}

function executeDiscardStep(handIndex, remainingCount) {
    const cardId = player.hand[handIndex];
    player.hand.splice(handIndex, 1);
    player.discard.push(cardId);
    playSE("se-tap");

    remainingCount--;

    if (remainingCount > 0 && player.hand.length > 0) {
        openDiscardSelector(remainingCount);
    } else {
        closeCardSelector();
        updateInfo();
    }
}

function closeCardSelector() {
    el("card-selector-modal").style.display = "none";
}

function executeDiscardAndEffect(discardIndex) {
    const discardId = player.hand[discardIndex];
    player.hand.splice(discardIndex, 1);
    player.discard.push(discardId);
    playSE("se-heal");
    addLog("手札を捨て、3枚ドロー！", "log-skill");
    drawCard();
    drawCard();
    drawCard();
    closeCardSelector();
    updateInfo();
}

function showCardDetail(card) {
    const detailEl = el("deck-card-detail");
    if (!detailEl) return;
    detailEl.innerHTML = `<span class="detail-name">${card.name}</span>${card.desc}`;
}

// =========================================
// 3. CARD COMPONENTS (カード部品・描画)
// =========================================

function createCardElement(card, mode = "standard", remainingCount = 1, totalCount = 0) {
    const div = document.createElement("div");
    if (!card) {
        div.className = `std-card ${mode} empty`;
        return div;
    }

    const isOwned = (mode === "small" || mode === "battle" || totalCount > 0);
    const notOwnedClass = (!isOwned) ? "card-not-owned" : "";

    div.className = `std-card ${mode} rarity-frame-${card.rarity} ${notOwnedClass}`;

    const imgPath = `assets/cards/${card.id}.png`;
    const cost = (card.cost !== undefined) ? card.cost : "?";
    const bgClass = (card.type === "TRAP") ? "bg-trap" : "bg-magic";

    let textClass = "text-n";
    if (card.rarity === "UR") textClass = "text-ur";
    else if (card.rarity === "SR") textClass = "text-sr";
    else if (card.rarity === "R") textClass = "text-r";

    const sheenHTML = (card.rarity === "UR" || card.rarity === "SR") ? '<div class="card-sheen"></div>' : '';
    const countText = (mode === "small" || mode === "battle") ? "" : `x${remainingCount}`;

    div.innerHTML = `
        <div class="std-art">
            <img src="${imgPath}" onerror="this.style.display='none';">
            <div class="std-cost">${cost}</div>
            <div class="std-count">${countText}</div>
            ${sheenHTML}
        </div>
        <div class="std-text-area ${bgClass}">
            <div class="std-name ${textClass}">${card.name}</div>
            <div class="std-type">[${card.type}]</div>
            <div class="std-desc">${card.desc}</div>
        </div>
    `;

    div.onclick = function (e) {
        if (div.dataset.longPressed === "true") { div.dataset.longPressed = "false"; return; }
        if (!isOwned) return;
        if (typeof isOpeningPack !== 'undefined' && isOpeningPack) return;

        if (mode === "small") removeFromDeck(card.id);
        else if (mode === "standard") addToDeck(card.id);
        else if (mode === "battle") playHandCard(player.hand.indexOf(card.id));
    };

    div.onmouseenter = () => {
        if (mode !== "battle" && typeof showCardDetail === 'function') {
            showCardDetail(card);
        }
    };

    if (isOwned) { setupLongPress(div, card); }

    return div;
}

function setupLongPress(element, card) {
    let pressTimer;
    const LONG_PRESS_DURATION = 500;

    const start = (e) => {
        if (e.type === "mousedown" && e.button !== 0) return;
        element.dataset.longPressed = "false";
        pressTimer = setTimeout(() => {
            element.dataset.longPressed = "true";
            showZoomCard(card);
            if (navigator.vibrate) navigator.vibrate(50);
        }, LONG_PRESS_DURATION);
    };

    const cancel = () => { if (pressTimer) clearTimeout(pressTimer); };

    element.addEventListener("mousedown", start);
    element.addEventListener("touchstart", start, { passive: true });
    element.addEventListener("mouseup", cancel);
    element.addEventListener("mouseleave", cancel);
    element.addEventListener("touchend", cancel);
    element.addEventListener("touchmove", cancel);
}

function showZoomCard(card) {
    let overlay = document.getElementById("card-zoom-overlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "card-zoom-overlay";
        document.body.appendChild(overlay);
    }

    overlay.onclick = closeZoomCard;

    const cardEl = createCardElement(card, "standard", 0, 1);
    cardEl.onclick = (e) => e.stopPropagation();

    overlay.innerHTML = "";
    overlay.appendChild(cardEl);

    const hint = document.createElement("div");
    hint.className = "zoom-close-hint";
    hint.innerText = "TAP ANYWHERE TO CLOSE";
    overlay.appendChild(hint);

    overlay.style.display = "flex";
    document.body.style.overflow = "hidden";

    requestAnimationFrame(() => {
        overlay.classList.add("visible");
    });

    playSE("se-tap");
}

function closeZoomCard() {
    const overlay = document.getElementById("card-zoom-overlay");
    if (overlay) {
        overlay.classList.remove("visible");
        setTimeout(() => {
            overlay.style.display = "none";
            document.body.style.overflow = "";
        }, 300);
    }
}

// =========================================
// 4. CARD SHOP & PACK OPENING (カードショップ)
// =========================================
// =========================================
// 4. CARD SHOP & PACK OPENING (カードショップ - v2.0 Carousel)
// =========================================

let currentPackIndex = 0; // Pack Carousel State

function openCardShop() {
    playSE("se-tap");

    // Create Cyber Shop Modal Structure dynamically
    const modalOverlay = el("card-shop-modal");
    modalOverlay.innerHTML = "";
    modalOverlay.style.display = "flex";

    const shopContainer = document.createElement("div");
    shopContainer.className = "shop-modal-cyber";

    // 1. Header
    const header = document.createElement("div");
    header.className = "cyber-shop-header";
    header.innerHTML = `
        <div class="shop-title-cyber">CARD SHOP</div>
        <div class="shop-currency">
            DP: <span class="val" id="shop-dp-display">${savedData.dp || 0}</span>
        </div>
        <button class="close-btn-cyber" onclick="closeCardShop()">×</button>
    `;
    shopContainer.appendChild(header);

    // 2. Carousel Container
    const carousel = document.createElement("div");
    carousel.className = "shop-carousel-container";
    carousel.innerHTML = `
        <div class="shop-arrow left" onclick="moveShopCarousel(-1)">❮</div>
        <div class="shop-arrow right" onclick="moveShopCarousel(1)">❯</div>
    `;

    // Filter unlocked packs
    const unlockedPacks = PACK_DATA.filter(pack => {
        const unlockKey = pack.unlockStage;
        return savedData.bestRanks && (savedData.bestRanks[unlockKey] || savedData.bestRanks[String(unlockKey)]);
    });

    if (unlockedPacks.length === 0) {
        carousel.innerHTML = "<div style='color:#666; width:100%; text-align:center; font-family:Orbitron;'>STAGE 1 CLEAR REQUIRED TO UNLOCK SHOP</div>";
    } else {
        unlockedPacks.forEach((pack, index) => {
            const cardItem = document.createElement("div");
            cardItem.className = `pack-card-carousel pack-item-${index}`;
            cardItem.onclick = (e) => {
                // Click side pack to navigate
                if (index !== currentPackIndex) {
                    const diff = index - currentPackIndex;
                    if (Math.abs(diff) === 1) moveShopCarousel(diff);
                }
            };

            const canBuy = (savedData.dp || 0) >= pack.price;

            cardItem.innerHTML = `
                <div class="pack-visual-carousel">
                    <img src="${pack.img}" onerror="this.style.display='none'">
                </div>
                <div class="pack-info-carousel">
                    <div class="pack-name-carousel">${pack.name}</div>
                    <div class="pack-desc-carousel">${pack.desc}</div>
                    <button class="buy-btn-carousel" ${canBuy ? "" : "disabled"} onclick="buyPack('${pack.id}')">
                        ${canBuy ? `BUY [${pack.price} DP]` : "INSUFFICIENT DP"}
                    </button>
                </div>
            `;
            carousel.appendChild(cardItem);
        });
    }

    shopContainer.appendChild(carousel);
    modalOverlay.appendChild(shopContainer);

    // Initialize logic
    window.currentShopPacks = unlockedPacks;
    if (currentPackIndex >= unlockedPacks.length) currentPackIndex = 0;
    updateCarousel();
}

function moveShopCarousel(dir) {
    if (!window.currentShopPacks || window.currentShopPacks.length === 0) return;

    currentPackIndex += dir;
    // Loop navigation
    if (currentPackIndex < 0) currentPackIndex = window.currentShopPacks.length - 1;
    if (currentPackIndex >= window.currentShopPacks.length) currentPackIndex = 0;

    playSE("se-tap");
    updateCarousel();
}

function updateCarousel() {
    const packs = window.currentShopPacks;
    if (!packs) return;

    packs.forEach((pack, index) => {
        const el = document.querySelector(`.pack-item-${index}`);
        if (!el) return;

        el.className = `pack-card-carousel pack-item-${index}`; // Reset

        if (index === currentPackIndex) {
            el.classList.add("center");
        } else {
            // Determine relative position handling loops
            let diff = index - currentPackIndex;
            // Shortest path logic for loop (optional, but good for UX if many packs)
            // For now, simple loop logic:
            if (diff === 1 || diff === -(packs.length - 1)) {
                el.classList.add("right");
            } else if (diff === -1 || diff === (packs.length - 1)) {
                el.classList.add("left");
            } else {
                el.classList.add("hidden");
            }
        }
    });

    // Update DP Display just in case
    const dpDisp = document.getElementById("shop-dp-display");
    if (dpDisp) dpDisp.innerText = savedData.dp || 0;
}

function buyPack(packId) {
    const pack = PACK_DATA.find(p => p.id === packId);
    if (!pack) return;
    if ((savedData.dp || 0) < pack.price) {
        playSE("se-warning");
        alert("DPが足りません");
        return;
    }
    savedData.dp -= pack.price;
    saveToDrive();
    if (document.getElementById("shop-dp-display")) document.getElementById("shop-dp-display").innerText = savedData.dp;

    // Re-render button state (if DP dropped below price)
    openCardShop();
    startPackOpening(packId);
}

function isCardInResults(results, cardId) {
    return results.some(c => c.id === cardId);
}

function startPackOpening(packId) {
    currentPackId = packId;
    isOpeningPack = true;
    openingPhase = 1;
    el("card-shop-modal").style.display = "none";
    el("pack-result-modal").style.display = "flex";

    const targetCards = CARD_DB.filter(c => c.packs && c.packs.includes(packId));
    packResults = [];

    for (let i = 0; i < 3; i++) {
        const isGuaranteed = (i === 2);
        let card = null;
        let attempt = 0;

        while (!card || isCardInResults(packResults, card.id)) {
            attempt++;
            if (attempt > 20) break;
            const r = Math.random();
            let rarity = "N";
            if (isGuaranteed) {
                if (r < 0.03) rarity = "UR"; else if (r < 0.20) rarity = "SR"; else rarity = "R";
            } else {
                if (r < 0.01) rarity = "UR"; else if (r < 0.10) rarity = "SR"; else if (r < 0.40) rarity = "R"; else rarity = "N";
            }
            let pool = targetCards.filter(c => c.rarity === rarity);
            if (pool.length === 0) pool = targetCards;
            const candidate = pool[Math.floor(Math.random() * pool.length)];
            if (!isCardInResults(packResults, candidate.id)) card = candidate;
        }

        if (!card) card = targetCards[Math.floor(Math.random() * targetCards.length)];
        if (!savedData.collection) savedData.collection = {};
        if (!savedData.cards) savedData.cards = {};

        const currentCount = savedData.cards[card.id] || 0;
        const isNew = (currentCount === 0);
        savedData.collection[card.id] = (savedData.collection[card.id] || 0) + 1;
        savedData.cards[card.id] = (savedData.cards[card.id] || 0) + 1;

        packResults.push({ ...card, isNew: isNew, ownCount: savedData.cards[card.id] });
    }

    saveToDrive();
    const rarityOrder = { "N": 0, "R": 1, "SR": 2, "UR": 3 };
    packResults.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);
    renderOpeningStage(packId);
}

function renderOpeningStage(packId) {
    const container = el("pack-opening-container");
    const packImg = PACK_DATA.find(p => p.id === packId).img;
    container.innerHTML = `<div id="opening-stage"><div id="white-out" class="white-out-overlay"></div><img src="${packImg}" id="pack-visual" class="opening-pack anim-drop anim-breath"><div id="opening-prompt" class="prompt-text">TAP TO OPEN</div><div id="reveal-area" class="reveal-stage" style="display:none;"></div><div id="action-buttons" class="action-buttons" style="display:none;"><button class="modal-btn" onclick="buyPack('${packId}')">ONE MORE</button><button class="modal-btn" onclick="closePackResult()" style="background:#555;">QUIT</button></div></div>`;
    const stage = el("opening-stage");
    stage.onclick = () => proceedUnboxing();
}

function proceedUnboxing() {
    if (openingPhase === 1) {
        openingPhase = 2;
        el("opening-prompt").style.display = "none";
        const pack = el("pack-visual");
        pack.classList.remove("anim-breath");
        pack.classList.add("anim-charge");
        playSE("se-double");

        setTimeout(() => {
            playSE("se-heal");
            const container = el("pack-result-modal");
            container.classList.add("shake-heavy");
            el("white-out").style.display = "block";
            el("white-out").classList.add("white-out-anim");
            pack.style.display = "none";

            setTimeout(() => {
                container.classList.remove("shake-heavy");
                openingPhase = 3;
                el("reveal-area").style.display = "flex";
                currentRevealIndex = 0;
                showNextRevealCard();
            }, 800);
        }, 1500);

    } else if (openingPhase === 3) {
        const currentCardEl = document.getElementById("reveal-card-" + currentRevealIndex);
        if (currentCardEl) {
            currentCardEl.classList.add("fly-up");
            currentRevealIndex++;
            setTimeout(showNextRevealCard, 200);
        }
    }
}

function showNextRevealCard() {
    if (currentRevealIndex >= packResults.length) {
        showPackResult();
        return;
    }
    const card = packResults[currentRevealIndex];
    const area = el("reveal-area");
    playSE("se-item");

    // standardモードで生成し、サイズはCSSで調整
    const div = createCardElement(card, "standard", 0, 1);
    div.id = `reveal-card-${currentRevealIndex}`;
    div.classList.add("reveal-card-zoom", "card-appear");

    area.innerHTML = "";
    area.appendChild(div);
}

function showPackResult() {
    openingPhase = 4;
    inputLockUntilRelease = true;
    playSE("se-win");

    const container = el("pack-opening-container");
    container.innerHTML = ""; // Clear earlier content

    // Build Cyber Modal for Result
    const modal = document.createElement("div");
    modal.className = "result-modal-cyber";

    // Header
    const header = document.createElement("div");
    header.className = "cyber-shop-header";
    header.innerHTML = `<div class="shop-title-cyber">UNBOXING RESULT</div>`;
    modal.appendChild(header);

    // Grid
    const grid = document.createElement("div");
    grid.className = "result-card-grid";

    packResults.forEach((card, i) => {
        // Wrapper for animation
        const wrapper = document.createElement("div");
        wrapper.className = "result-card-cyber-wrapper";
        wrapper.style.animationDelay = `${i * 0.1}s`;

        // Card Element (Standard)
        const cardDiv = createCardElement(card, "standard", card.ownCount, card.ownCount);

        // ★ 修正: 見切れ防止用のクラスを追加
        cardDiv.classList.add("result-card");

        // New Badge
        if (card.isNew) {
            const badge = document.createElement("div");
            badge.className = "new-badge";
            badge.innerText = "NEW!";
            cardDiv.appendChild(badge);
        }

        setupLongPress(cardDiv, card);

        wrapper.appendChild(cardDiv);
        grid.appendChild(wrapper);
    });
    modal.appendChild(grid);

    // Actions
    const btnArea = document.createElement("div");
    btnArea.className = "cyber-result-actions";

    // Check if player has enough DP for another pack
    const pack = PACK_DATA.find(p => p.id === currentPackId);
    const canBuy = pack && (savedData.dp >= pack.price);

    btnArea.innerHTML = `
        <button class="btn-cyber-primary" ${canBuy ? "" : "disabled"} onclick="buyPack('${currentPackId}')">
            ONE MORE ${pack ? `(${pack.price})` : ""}
        </button>
        <button class="btn-cyber-secondary" onclick="closePackResult()">CLOSE</button>
    `;
    modal.appendChild(btnArea);

    container.appendChild(modal);
}

function skipUnboxing() {
    if (openingPhase >= 2 && openingPhase < 4) {
        showPackResult();
    }
}

function closePackResult() {
    if (openingPhase < 4 && openingPhase > 0) return;
    playSE("se-tap");
    el("pack-result-modal").style.display = "none";
    el("pack-opening-container").innerHTML = "";
    updateTitleScore();
    isOpeningPack = false;
    openingPhase = 0;
    el("card-shop-modal").style.display = "flex";
}

function closeCardShop() {
    playSE("se-tap");
    el("card-shop-modal").style.display = "none";
    updateTitleScore();
}

// =========================================
// 5. DECK EDITOR & COLLECTION (デッキ編集)
// =========================================

function openCollection() {
    playSE("se-tap");
    renderDeckEditor();
    el("collection-modal").style.display = "flex";
}

function closeCollection() {
    playSE("se-tap");
    el("collection-modal").style.display = "none";
}

function renderDeckEditor() {
    if (!savedData.deck) savedData.deck = [];
    savedData.deck.sort((a, b) => a - b);
    if (!savedData.cards) savedData.cards = {};

    const deckGrid = el("deck-grid");
    deckGrid.innerHTML = "";

    for (let i = 0; i < DECK_SIZE; i++) {
        const cardId = savedData.deck[i];
        if (cardId) {
            const card = CARD_DB.find(c => c.id === cardId);
            const totalOwned = savedData.cards[card.id] || 0;
            // 既存カードを表示
            const div = createCardElement(card, "small", 0, totalOwned);
            deckGrid.appendChild(div);
        } else {
            // Updated: null を渡して EMPTY カードを生成
            const div = createCardElement(null, "small");
            deckGrid.appendChild(div);
        }
    }

    const deckCount = savedData.deck.length;
    const countEl = el("deck-count");
    countEl.innerText = deckCount;
    if (deckCount < DECK_SIZE) { countEl.style.color = "#ff5555"; } else { countEl.style.color = "#00ff00"; }

    const listGrid = el("card-grid");
    listGrid.innerHTML = "";
    let ownedCount = 0;
    CARD_DB.forEach(card => {
        const count = savedData.cards[card.id] || 0;
        if (count > 0) ownedCount++;
        const inDeckCount = savedData.deck.filter(id => id === card.id).length;
        const remaining = count - inDeckCount;
        const div = createCardElement(card, "standard", remaining, count);
        listGrid.appendChild(div);
    });
    el("collection-rate").innerText = `${Math.floor((ownedCount / CARD_DB.length) * 100)}%`;
}



function addToDeck(cardId) {
    const SAME_CARD_LIMIT = 3;
    if (savedData.deck.length >= DECK_SIZE) { alert(`デッキは${DECK_SIZE}枚までです！`); return; }

    const ownedCount = savedData.cards[cardId] || 0;
    const currentInDeck = savedData.deck.filter(id => id === cardId).length;

    if (currentInDeck >= ownedCount) { alert("これ以上持っていません！"); return; }
    if (currentInDeck >= SAME_CARD_LIMIT) { alert(`「${getCardName(cardId)}」は3枚までです。`); return; }

    playSE("se-tap");
    savedData.deck.push(cardId);
    saveToDrive();
    renderDeckEditor();
}

function removeFromDeck(cardId) {
    playSE("se-tap");
    const index = savedData.deck.indexOf(cardId);
    if (index > -1) { savedData.deck.splice(index, 1); }
    saveToDrive();
    renderDeckEditor();
}

function getCardName(id) {
    const c = CARD_DB.find(card => card.id === id);
    return c ? c.name : "カード";
}

// =========================================
// 6. DIALOGS, HISTORY & NAVIGATION (ダイアログ・履歴・ナビ)
// =========================================

function showDialog(title, text, type = "normal", buttons = [{ text: "OK", action: null }], autoClose = 0) {
    const box = el("modal-box-inner");
    el("modal-title").innerText = title;
    el("modal-text").innerHTML = text;
    box.className = "modal-box";
    el("modal-title").style.color = "#f9a826";

    if (type === "clear") {
        box.classList.add("modal-clear");
        el("modal-title").style.color = "#fff";
    } else if (type === "warning") {
        box.classList.add("modal-warning");
        el("modal-title").style.color = "#ff0000";
    } else if (type === "item") {
        box.classList.add("modal-item");
        el("modal-title").style.color = "#00ff00";
    }

    const btnGroup = el("modal-buttons");
    btnGroup.innerHTML = "";

    buttons.forEach(b => {
        const btn = document.createElement("button");
        btn.className = "modal-btn";
        btn.innerText = b.text;
        btn.onclick = function () {
            if (window.dialogTimeout) clearTimeout(window.dialogTimeout);
            playSE("se-tap");
            el("game-modal").style.display = "none";
            if (b.action) b.action();
        };
        btnGroup.appendChild(btn);
    });

    el("game-modal").style.display = "flex";

    if (autoClose > 0 && buttons.length > 0) {
        const primaryAction = buttons[0].action;
        window.dialogTimeout = setTimeout(() => {
            el("game-modal").style.display = "none";
            if (primaryAction) primaryAction();
        }, autoClose);
    }
}


function showHistory() {
    const modal = el("history-modal");

    modal.innerHTML = `
        <div class="modal-box history-box" style="max-width:850px; width:95%;">
            <div class="modal-header-row">
                <div class="modal-title" style="color:#00d2fc; font-family:'Cinzel Decorative'; margin:0;">BATTLE LOG</div>
                <button class="header-close-btn" onclick="closeHistory()">×</button>
            </div>
            <div class="history-list" id="history-list">
                <div class="h-header">
                    <div class="h-col-date">DATE</div>
                    <div class="h-col-stage">STAGE INFO</div>
                    <div class="h-col-res">RESULT</div>
                    <div class="h-col-rank">RANK</div>
                    <div class="h-col-turn">TURN</div>
                    <div class="h-col-ppr">AVG(RT)</div>
                    <div class="h-col-dp">DP</div>
                </div>
            </div>
        </div>
    `;

    const list = el("history-list");

    if (!savedData.history || savedData.history.length === 0) {
        list.innerHTML = "<div style='padding:40px; text-align:center; color:#666;'>NO DATA</div>";
    } else {
        savedData.history.forEach(h => {
            let isLose = (h.result === "LOSE");
            let resultText = isLose ? "LOSE" : "CLEAR";
            let rankText = (isLose || !h.rank) ? "-" : h.rank;
            let turnText = (isLose || !h.turn) ? "-" : h.turn;

            // ★修正: ヘルパー関数で名前を取得
            const stgName = h.stgName || getStageDisplayName(h.stage);

            const pprDisp = (h.ppr !== undefined && h.ppr !== null) ? Number(h.ppr).toFixed(1) : "-";
            const rtDisp = (h.rt !== undefined && h.rt !== null) ? h.rt : "-";

            let rankClass = "";
            if (rankText === "SSS") rankClass = "rank-sss";
            else if (rankText === "S") rankClass = "rank-s";
            else if (rankText === "A") rankClass = "rank-a";

            const div = document.createElement("div");
            div.className = "history-row" + (isLose ? " row-lose" : " row-clear");

            div.innerHTML = `
                <div class="h-col-date">${h.date.split(' ')[0]}</div>
                <div class="h-col-stage">${stgName}</div>
                <div class="h-col-res">${resultText}</div>
                <div class="h-col-rank ${rankClass}">${rankText}</div>
                <div class="h-col-turn">${turnText}</div>
                <div class="h-col-ppr">${pprDisp} (Rt${rtDisp})</div>
                <div class="h-col-dp">+${h.dp}</div>
            `;
            list.appendChild(div);
        });
    }
    playSE("se-tap");
    modal.style.display = "flex";
}

function closeHistory() {
    playSE("se-tap");
    el("history-modal").style.display = "none";
}




function openStageSelect() {
    playSE("se-tap");
    el("title-screen").style.display = "none";
    el("stage-select-screen").style.display = "flex";
    renderStageSelectScreen();
}

function closeStageSelect() {
    playSE("se-tap");
    el("stage-select-screen").style.display = "none";
    el("title-screen").style.display = "flex";
}

// Updated: ステージ選択画面の描画 (v8.0 - Area Grouping & 4-Col Grid)
function renderStageSelectScreen() {
    const container = el("stage-list-container");
    container.className = "stage-list-wrapper"; // スクロール用ラッパー
    container.innerHTML = "";

    // WORLD_MAP の各エリアをループ
    Object.values(WORLD_MAP).forEach(area => {
        // 1. エリアコンテナ作成
        const areaBox = document.createElement("div");
        areaBox.className = "area-container";

        // 2. エリアヘッダー
        const header = document.createElement("div");
        header.className = "area-header";
        header.innerText = area.name;
        areaBox.appendChild(header);

        // 3. カードグリッド (4列)
        const grid = document.createElement("div");
        grid.className = "area-card-grid";

        // エリア内のステージをループ
        area.stages.forEach(stageData => {
            const isLocked = !isStageUnlocked(stageData.id);
            // stageStatsから戦績取得
            const sKey = String(stageData.id);
            const stats = (savedData.stageStats && savedData.stageStats[sKey])
                ? savedData.stageStats[sKey]
                : { attempts: 0, clears: 0, maxDP: 0, bestTurns: null };

            // ランク取得
            const rank = savedData.bestRanks ? savedData.bestRanks[stageData.id] : null;

            const card = createStageCard(stageData, stats, rank, isLocked);
            grid.appendChild(card);
        });

        areaBox.appendChild(grid);
        container.appendChild(areaBox);
    });
}

/**
 * TCG風ステージカードを生成するヘルパー関数
 */
function createStageCard(stageData, stats, rank, isLocked) {
    const card = document.createElement("div");
    card.className = "stage-card-tcg";
    if (isLocked) card.classList.add("locked");

    // 1. 枠 (Rarity Frame)
    const frame = document.createElement("div");
    // ID等からレアリティ判定（簡易的にEXTRAかどうかで判定）
    let rarity = "NORMAL";
    if (stageData.type === "EXTRA") rarity = "EXTRA";
    else if (stageData.type === "BOSS") rarity = "GOD"; // BOSSタイプがあれば

    frame.className = `card-frame ${rarity}`;
    card.appendChild(frame);

    if (isLocked) {
        // --- Locked Face Data ---
        const content = document.createElement("div");
        content.className = "locked-content";
        content.innerHTML = `
            <div style="font-size:40px; margin-bottom:10px;">🔒</div>
            <div style="font-size:12px; letter-spacing:2px;">TARGET<br>UNKNOWN</div>
        `;
        card.appendChild(content);

    } else {
        // --- Unlocked Face Data ---

        // Header
        const header = document.createElement("div");
        header.className = "card-header-tcg";
        header.innerHTML = `<span>ID: ${stageData.id}</span><span>${stageData.type || "MISSION"}</span>`;
        card.appendChild(header);

        // Rank Badge
        if (rank) {
            const rBadge = document.createElement("div");
            rBadge.className = "card-rank-badge";
            if (rank === "SSS") rBadge.classList.add("rank-sss-tcg");
            else if (rank === "S") rBadge.classList.add("rank-s-tcg");
            else if (rank === "A") rBadge.classList.add("rank-a-tcg");
            rBadge.innerText = rank;
            card.appendChild(rBadge);
        }

        // Art
        const art = document.createElement("div");
        art.className = "card-art-tcg";
        const img = document.createElement("img");
        // ★修正: bossBgがあればそちらを優先 (2-1, 2-2, 2-3対策)
        img.src = stageData.bossBg || stageData.bg;
        img.onerror = () => { img.style.display = "none"; };
        art.appendChild(img);

        // DP Multiplier Badge
        const dpMult = document.createElement("div");
        dpMult.className = "card-dp-mult";
        // data.js の multiplier 定義を参照 (未定義なら 1.0)
        let mult = stageData.multiplier || 1.0;
        dpMult.innerText = `DP x${mult.toFixed(1)}`;
        art.appendChild(dpMult);

        card.appendChild(art);

        // Info Body
        const info = document.createElement("div");
        info.className = "card-info-tcg";

        const title = document.createElement("div");
        title.className = "tcg-title";
        title.innerText = stageData.title;
        info.appendChild(title);

        const sub = document.createElement("div");
        sub.className = "tcg-sub";
        sub.innerText = stageData.sub;
        info.appendChild(sub);

        // Stats Box
        const statBox = document.createElement("div");
        statBox.className = "tcg-stats-box";
        statBox.innerHTML = `
            <div class="stat-row">
                <span>BEST TURN</span>
                <span class="stat-val" style="color:#00d2fc;">${stats.bestTurns !== null ? stats.bestTurns : "-"}</span>
            </div>
            <div class="stat-row">
                <span>MAX DP</span>
                <span class="stat-val" style="color:#ffd700;">${stats.maxDP}</span>
            </div>
            <div class="stat-row" style="margin-top:2px; border-top:1px dashed #444; padding-top:2px;">
                <span>CLEAR/TRY</span>
                <span class="stat-val">${stats.clears}/${stats.attempts}</span>
            </div>
        `;
        info.appendChild(statBox);

        card.appendChild(info);

        // OnClick Action
        card.onclick = () => {
            playSE("se-tap"); // 本来は"se-flash"などが良い
            el("stage-select-screen").style.display = "none";
            // フラッシュ演出などを挟むならここに書く
            initGameSession(stageData.id);
        };
    }

    return card;
}