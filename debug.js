
// =========================================
// DEBUG MANAGER
// =========================================
const DebugManager = {
    init: function () {
        console.log("DebugManager Initialized");
        this.createDebugUI();
    },

    createDebugUI: function () {
        const debugBtn = document.createElement("button");
        debugBtn.innerText = "DEBUG";
        debugBtn.style.position = "fixed";
        debugBtn.style.bottom = "10px";
        debugBtn.style.right = "10px";
        debugBtn.style.zIndex = "9999";
        debugBtn.style.padding = "5px 10px";
        debugBtn.style.background = "rgba(0, 0, 0, 0.7)";
        debugBtn.style.color = "#0f0";
        debugBtn.style.border = "1px solid #0f0";
        debugBtn.style.fontFamily = "monospace";
        debugBtn.style.cursor = "pointer";
        debugBtn.onclick = () => this.toggleMenu();
        document.body.appendChild(debugBtn);

        const menu = document.createElement("div");
        menu.id = "debug-menu";
        menu.style.display = "none";
        menu.style.position = "fixed";
        menu.style.bottom = "50px";
        menu.style.right = "10px";
        menu.style.zIndex = "9999";
        menu.style.background = "rgba(0, 0, 0, 0.9)";
        menu.style.border = "1px solid #0f0";
        menu.style.padding = "10px";
        menu.style.flexDirection = "column";
        menu.style.gap = "5px";

        const actions = [
            { label: "Unlock All Stages", action: () => this.unlockAllStages() },
            { label: "Unlock All Packs", action: () => this.unlockAllPacks() }, // Actually just unlocks stages which unlocks packs
            { label: "Gain All Cards (x3)", action: () => this.gainAllCards() },
            { label: "Reset Cards", action: () => this.resetCards() },
            { label: "Add 10,000 DP", action: () => this.addDP() },
            { label: "Jump to Stage", action: () => this.jumpToStage() },
            { label: "Reset Save Data", action: () => this.resetSave() },
            { label: "Close", action: () => this.toggleMenu() }
        ];

        actions.forEach(item => {
            const btn = document.createElement("button");
            btn.innerText = item.label;
            btn.style.background = "#222";
            btn.style.color = "#eee";
            btn.style.border = "1px solid #555";
            btn.style.padding = "5px";
            btn.style.cursor = "pointer";
            btn.style.textAlign = "left";
            btn.style.fontFamily = "monospace";
            btn.onmouseover = () => btn.style.background = "#444";
            btn.onmouseout = () => btn.style.background = "#222";
            btn.onclick = item.action;
            menu.appendChild(btn);
        });

        document.body.appendChild(menu);
    },

    toggleMenu: function () {
        const menu = document.getElementById("debug-menu");
        if (menu.style.display === "none") {
            menu.style.display = "flex";
        } else {
            menu.style.display = "none";
        }
    },

    jumpToStage: function () {
        const stageId = prompt("Enter Stage ID (e.g., 1-1, 2-EX):", savedData.highScore ? savedData.highScore.stage : "1-1");
        if (!stageId) return;

        const floorStr = prompt("Enter Floor Number:", "1");
        if (!floorStr) return;
        const floor = parseInt(floorStr);

        // Validate Stage ID loosely (check if it exists in any area)
        let isValid = false;
        // WORLD_MAP is an object
        for (const areaId in WORLD_MAP) {
            const area = WORLD_MAP[areaId];
            const stages = area.stages || area.chapters;
            if (stages && stages.find(s => s.id === stageId)) {
                isValid = true;
                break;
            }
        }

        if (isValid) {
            if (!savedData.highScore) savedData.highScore = {};
            savedData.highScore.stage = stageId;
            savedData.highScore.floor = floor;
            saveToDrive();
            alert(`Jumping to ${stageId} - Floor ${floor}...`);
            localStorage.setItem("debug_jump_flag", "true");
            this.saveAndReload();
        } else {
            alert("Invalid Stage ID or Stage not found in WORLD_MAP.");
        }
    },

    saveAndReload: function () {
        // Save current slot index to auto-resume
        if (typeof currentSlot !== "undefined") {
            const slotNum = currentSlot.replace("slot", "");
            localStorage.setItem("debug_last_slot", slotNum);
        }

        saveToDrive();
        setTimeout(() => location.reload(), 500);
    },

    unlockAllStages: function () {
        if (!savedData.bestRanks) savedData.bestRanks = {};
        // WORLD_MAP is an object, not array
        for (const areaId in WORLD_MAP) {
            const area = WORLD_MAP[areaId];
            if (area.stages) {
                // Legacy structure check
                area.stages.forEach(stage => {
                    savedData.bestRanks[stage.id] = "S";
                });
            } else if (area.chapters) {
                // New structure check
                area.chapters.forEach(stage => {
                    savedData.bestRanks[stage.id] = "S";
                });
            }
        }
        alert("All stages unlocked (Rank S)!");
        this.saveAndReload();
    },

    unlockAllPacks: function () {
        // Unlocking all stages effectively unlocks all packs based on current logic
        this.unlockAllStages();
    },

    gainAllCards: function () {
        if (!savedData.cards) savedData.cards = {};

        // Use CARD_DB from data.js
        if (typeof CARD_DB !== "undefined") {
            CARD_DB.forEach(card => {
                savedData.cards[card.id] = 3;
            });
            alert("All cards obtained (x3)!");
            this.saveAndReload();
        } else {
            alert("Error: CARD_DB not found.");
        }
    },

    resetCards: function () {
        savedData.cards = {};
        // INITIAL_DECK definitions need to be checked. Assuming it's in data.js or main.js
        // If INITIAL_DECK is just IDs
        if (typeof INITIAL_DECK !== "undefined") {
            INITIAL_DECK.forEach(id => {
                savedData.cards[id] = (savedData.cards[id] || 0) + 1;
            });
            player.deck = [...INITIAL_DECK]; // Reset current deck too
        } else {
            // Fallback if INITIAL_DECK is missing
            console.warn("INITIAL_DECK not found, clearing cards only.");
            player.deck = [];
        }

        alert("Cards reset to initial state.");
        this.saveAndReload();
    },

    addDP: function () {
        savedData.dp = (savedData.dp || 0) + 10000;
        saveToDrive();
        if (document.getElementById("shop-dp-display")) {
            document.getElementById("shop-dp-display").innerText = savedData.dp;
        }
        alert("Added 10,000 DP!");
    },

    resetSave: function () {
        if (confirm("Are you sure you want to delete all save data?")) {
            localStorage.removeItem(SAVE_KEY); // SAVE_KEY from data.js
            setTimeout(() => location.reload(), 500);
        }
    }
};

// Expose to window
window.DebugManager = DebugManager;
