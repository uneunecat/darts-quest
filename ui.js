// =========================================
// 13. UI & MODAL HANDLING (UI操作)
// =========================================

// 画面サイズ調整 (レスポンシブ対応)
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

// Updated: ユーザーの破棄選択を待機する (v4.2 Async Support)
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
                // カードを捨てる処理
                player.hand.splice(idx, 1);
                player.discard.push(cardId);
                playSE("se-tap");
                
                el("card-selector-modal").style.display = "none";
                
                if (count > 1 && player.hand.length > 0) {
                    // まだ捨てる必要があるなら再帰的に呼び出す
                    openDiscardSelector(count - 1).then(resolve);
                } else {
                    resolve(); // すべて捨て終わった
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
        
        // 保存されていた「残りのエフェクト」があれば再開する
        if (pendingEffectsQueue.length > 0) {
            const nextEffects = [...pendingEffectsQueue];
            pendingEffectsQueue = []; // クリアしてから実行
            setTimeout(() => resolveEffects(nextEffects), 300);
        }
    }
}

function closeCardSelector() {
    el("card-selector-modal").style.display = "none";
    pendingCardIndex = -1;
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

// Updated: renderHand (v4.6 - Disabled Style Fix)
function renderHand() {
    const handArea = el("hand-area");
    handArea.innerHTML = "";
    el("hand-count-display").innerText = player.hand.length;
    
    const isThrowing = turnInputs.length > 0;
    // アイテムロック、または投擲中はカード使用不可
    const isCardLocked = hasState(player, "item_lock") || isThrowing;

    if (player.deckLocked) {
        el("battle-deck-count").innerText = "-";
        handArea.innerHTML = `<div class="hand-locked-msg">⚠️ NO DECK</div>`;
    } else {
        el("battle-deck-count").innerText = player.deck.length;
        if (player.hand.length === 0) {
            handArea.innerHTML = `<div class="hand-card-empty">NO CARD</div>`;
        } else {
            player.hand.forEach((cardId, index) => {
                const card = CARD_DB.find(c => c.id === cardId);
                // 戦闘モードで生成
                const div = createCardElement(card, "battle", 0, 1);
                div.className += " hand-card";
                
                // コスト不足 or ロック状態で disabled クラス付与
                if (player.mp < card.cost || isCardLocked) {
                    div.classList.add("disabled");
                }
                
                div.onclick = () => playHandCard(index);
                handArea.appendChild(div);
            });
        }
    }
}

// Updated: updateInfo (v5.6 - hasState Integration)
function updateInfo() {
    if (!enemy.data) return;
    const setText = (id, text) => { const e = el(id); if (e) e.innerText = text; };
    const setHTML = (id, html) => { const e = el(id); if (e) e.innerHTML = html; };

    // Stage Info
    let stgDisp = getStageDisplayName(stage);
    setText("stage-display", stgDisp);
    setText("floor-display", getMaxFloors(stage) === 1 ? "FINAL" : `${floor}F`);
    setHTML("turn-display", `TURN ${currentTurn} <span style="font-size:12px; color:#888;">(Total ${(totalGameTurns - stageStartTurn) + 1})</span>`);

    // Enemy Stats
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

    // ステートバッジ生成 (v5.0 汎用ロジック)
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

    // Player HP
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

    // Player MP
    let mpDots = "";
    for (let i = 0; i < player.maxMp; i++) {
        mpDots += `<span class="mp-dot ${i < player.mp ? 'active' : ''}"></span>`;
    }
    setHTML("player-mp-dots", mpDots);
    if (player.mp >= player.maxMp) el("player-mp-dots").classList.add("mp-max-glow");
    else el("player-mp-dots").classList.remove("mp-max-glow");

    // Items
    const updateItemBtn = (btnId, count, icon) => {
        const b = el(btnId); if (!b) return;
        b.innerHTML = `${icon}x${count}`;
        b.className = "item-btn";
        // ★修正: hasStateを使用してアイテム封印をチェック
        const isLocked = hasState(player, "item_lock") || turnInputs.length > 0 || isInterval;
        if (isLocked || count <= 0) b.classList.add("disabled");
        else b.classList.add("has-item");
    };
    updateItemBtn("btn-potion", player.items.potion, "💊");
    updateItemBtn("btn-ether", player.items.ether, "⚗️");
    updateItemBtn("btn-seed", player.items.seed, "🌱");

    // Trap Slot
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

    // Stats (Avg / Rt) の計算と表示
    // totalDarts が 0 の時は 0.0 を表示して division by zero を防ぐ
    let ppr = totalDarts > 0 ? (totalScore / totalDarts) * 3 : 0;
    setText("avg-display", ppr.toFixed(1));
    setText("rt-display", `(Rt ${calculateRating(ppr)})`);

    renderHand();
}

function openCardShop() {
    playSE("se-tap");
    const list = el("pack-list");
    list.innerHTML = "";
    if (el("shop-dp-display")) el("shop-dp-display").innerText = (savedData.dp || 0);
    if (!savedData.cards) savedData.cards = {};
    
    PACK_DATA.forEach(pack => {
        // ★修正: 解放条件をチェック (文字列ID対応)
        // unlockStage が "1-1" なら、savedData.bestRanks["1-1"] があるか確認
        // 互換性のため数値の1も許容
        const unlockKey = pack.unlockStage;
        const isUnlocked = savedData.bestRanks && (savedData.bestRanks[unlockKey] || savedData.bestRanks[String(unlockKey)]);
        
        if (!isUnlocked) return;
        
        const canBuy = (savedData.dp || 0) >= pack.price;
        const imgHTML = `<img src="${pack.img}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"><div style="display:none; width:100%; height:100%; align-items:center; justify-content:center; font-size:50px; background:#333; color:#555;">📦</div>`;
        
        const div = document.createElement("div");
        div.className = "pack-item";
        div.innerHTML = `<div class="pack-img-container">${imgHTML}</div><div class="pack-name">${pack.name}</div><div class="pack-desc">${pack.desc}</div><button class="pack-buy-btn" ${canBuy ? "" : "disabled"} onclick="buyPack('${pack.id}')">${canBuy ? `BUY (${pack.price} DP)` : "LACK DP"}</button>`;
        list.appendChild(div);
    });
    
    if (list.innerHTML === "") {
        list.innerHTML = "<div style='color:#666; width:100%; text-align:center; padding-top:20px;'>STAGE 1 CLEAR REQUIRED</div>";
    }
    el("card-shop-modal").style.display = "flex";
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
    if (el("shop-dp-display")) el("shop-dp-display").innerText = savedData.dp;
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
    const area = el("reveal-area");
    area.innerHTML = "";
    area.className = "result-stage";
    playSE("se-win");
    
    packResults.forEach((card, i) => {
        const div = createCardElement(card, "standard", card.ownCount, card.ownCount);
        div.className += " result-card";
        div.style.animation = `pop-in 0.5s both ${i * 0.1}s`;
        if (card.isNew) {
            const badge = document.createElement("div");
            badge.className = "new-badge";
            badge.innerText = "NEW!";
            div.appendChild(badge);
        }
        div.onclick = null;
        setupLongPress(div, card);
        area.appendChild(div);
    });
    
    const btnArea = el("action-buttons");
    btnArea.style.display = "flex";
    setTimeout(() => btnArea.classList.add("visible"), 100);
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


// Updated: createCardElement (v4.6 - Status Class Support)
function createCardElement(card, mode = "standard", remainingCount = 1, totalCount = 0) {
    const div = document.createElement("div");
    // card が null の場合は EMPTY カード
    if (!card) {
        div.className = `std-card ${mode} empty`;
        return div;
    }
    
    // 所持判定 (battle/smallモードは所持前提、standardモードはtotalCountで判定)
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
    
    // イベント設定
    div.onclick = function (e) {
        if (div.dataset.longPressed === "true") { div.dataset.longPressed = "false"; return; }
        // 未所持ならクリック無効
        if (!isOwned) return;
        
        // パック開封中などのガード
        if (typeof isOpeningPack !== 'undefined' && isOpeningPack) return;
        
        // モード別動作
        if (mode === "small") removeFromDeck(card.id);
        else if (mode === "standard") addToDeck(card.id);
    };

    // ホバー時に詳細を表示
    div.onmouseenter = () => {
        if (mode !== "battle" && typeof showCardDetail === 'function') {
            showCardDetail(card);
        }
    };
    
    // 長押し詳細表示 (未所持でも詳細だけは見れるようにしても良いが、一旦所持者のみ)
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
    
    // 既存のイベントを一度削除して再登録（二重登録防止）
    overlay.onclick = closeZoomCard;
    
    const cardEl = createCardElement(card, "standard", 0, 1);
    // カード自体をクリックしても閉じないようにストップ
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
        // アニメーションが終わるのを待ってから非表示
        setTimeout(() => {
            overlay.style.display = "none";
            document.body.style.overflow = ""; // スクロール禁止解除
        }, 300);
    }
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
                <div class="h-col-ppr">${h.ppr.toFixed(1)} (Rt${h.rt})</div>
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

function getRankColor(r) {
    if (r === "SSS") return "#00ffff";
    if (r === "S") return "#ffd700";
    if (r === "A") return "#ff5555";
    return "#fff";
}

// Updated: 設定モーダルを開く関数 (修復版)
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

// 設定値をリアルタイム更新するグローバル関数
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

// 設定をリセット
window.resetConfig = function () {
    gameConfig = { bgmVolume: 0.3, sysVolume: 0.5, atkVolume: 0.8 };
    playSE("se-tap");
    openConfigModal();
    updateCurrentBgmVolume();
};

// 設定を閉じて保存
window.closeConfig = function () {
    saveGameConfig();
    playSE("se-tap");
    el("config-modal").style.display = "none";
};

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

// Updated: ステージ選択画面の描画 (v6.3 - WORLD_MAP対応)
function renderStageSelectScreen() {
    const container = el("stage-list-container");
    container.innerHTML = "";

    // WORLD_MAP の各エリアをループ
    Object.values(WORLD_MAP).forEach(area => {
        // エリア見出し (Area Header)
        const header = document.createElement("div");
        // CSSファイルで .area-header を定義しても良いが、ここでは直接スタイル指定
        header.style.width = "100%";
        header.style.color = "#00d2fc";
        header.style.borderBottom = "1px solid #444";
        header.style.marginBottom = "10px";
        header.style.marginTop = "20px";
        header.style.paddingBottom = "5px";
        header.style.fontFamily = "'Cinzel Decorative', serif";
        header.style.fontSize = "18px";
        header.innerText = area.name; // 例: "古の森と迷宮"
        container.appendChild(header);

        // エリア内のステージをループ
        area.stages.forEach(stageData => {
            const isLocked = !isStageUnlocked(stageData.id);
            const rank = savedData.bestRanks ? savedData.bestRanks[stageData.id] : null;
            const rankColor = getRankColor(rank || "");
            
            // 背景画像 (ボス用があればそちらをサムネにするなど調整可。基本はbg)
            const bgUrl = stageData.bg;

            const div = document.createElement("div");
            div.className = "stage-card-item";
            if (isLocked) div.classList.add("locked");

            // EXTRAステージは枠の色を変えるなどの演出も可能
            const typeLabel = stageData.type === "EXTRA" ? '<span style="color:#f0f; font-size:10px; border:1px solid #f0f; padding:2px;">EXTRA</span> ' : '';

            div.innerHTML = `
                <img src="${bgUrl}" class="st-img" onerror="this.style.display='none'">
                <div class="st-info">
                    <div class="st-title">${typeLabel}${isLocked ? "LOCKED" : stageData.title}</div>
                    <div class="st-sub">${stageData.sub}</div>
                </div>
                ${rank ? `<div class="st-rank" style="color:${rankColor}">${rank}</div>` : ""}
                ${isLocked ? `<div class="st-rank" style="font-size:20px;">🔒</div>` : ""}
            `;

            if (!isLocked) {
                div.onclick = () => {
                    playSE("se-tap");
                    el("stage-select-screen").style.display = "none";
                    // 新ID (例: "1-1") を渡して開始
                    initGameSession(stageData.id);
                };
            }
            container.appendChild(div);
        });
    });
}