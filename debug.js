
// =========================================
// DEBUG MANAGER (v5.1 - Relief & Soul Support)
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

        // Updated: ボタンリストに新規デバッグ機能を追加
        const actions = [
            { label: "Unlock All Stages", action: () => this.unlockAllStages() },
            { label: "Unlock All Packs", action: () => this.unlockAllPacks() },
            { label: "Gain All Cards (x3)", action: () => this.gainAllCards() },
            { label: "Unlock All Reliefs", action: () => this.unlockAllReliefs() }, // ★新規
            { label: "Add 10,000 DP", action: () => this.addDP() },
            { label: "Add 10,000 SOULS", action: () => this.addSouls() },       // ★新規
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

    // --- 新規機能: 全レリーフ解放 ---
    unlockAllReliefs: function() {
        if (!savedData.unlockedReliefs) savedData.unlockedReliefs = [];
        
        // 1. 全てのレリーフIDを所持リストに追加
        Object.keys(RELIEF_DB).forEach(id => {
            if (!savedData.unlockedReliefs.includes(id)) {
                savedData.unlockedReliefs.push(id);
            }
        });

        // 2. ショップに表示させるため、全モンスターを討伐済みにする
        Object.values(WORLD_MAP).forEach(area => {
            area.stages.forEach(stage => {
                if (!savedData.stageStats[stage.id]) {
                    savedData.stageStats[stage.id] = { attempts: 1, clears: 1, maxDP: 0, bestTurns: 10 };
                } else {
                    savedData.stageStats[stage.id].clears = Math.max(savedData.stageStats[stage.id].clears, 1);
                }
            });
        });

        alert("All Monster Reliefs Unlocked & Monsters Defeated!");
        this.saveAndReload();
    },

    // --- 新規機能: ソウル増加 ---
    addSouls: function() {
        savedData.souls = (savedData.souls || 0) + 10000;
        saveToDrive();
        // UIが表示されていればリアルタイム更新
        if (document.getElementById("soul-count")) {
            document.getElementById("soul-count").innerText = savedData.souls;
        }
        alert("Added 10,000 Souls!");
    },

    jumpToStage: function () {
        const stageId = prompt("Enter Stage ID (e.g., 1-1, 2-EX):", savedData.highScore ? savedData.highScore.stage : "1-1");
        if (!stageId) return;

        const floorStr = prompt("Enter Floor Number:", "1");
        if (!floorStr) return;
        const floor = parseInt(floorStr);

        let isValid = false;
        for (const areaId in WORLD_MAP) {
            const area = WORLD_MAP[areaId];
            if (area.stages && area.stages.find(s => s.id === stageId)) {
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
        if (typeof currentSlot !== "undefined") {
            const slotNum = currentSlot.replace("slot", "");
            localStorage.setItem("debug_last_slot", slotNum);
        }
        saveToDrive();
        setTimeout(() => location.reload(), 500);
    },

    unlockAllStages: function () {
        if (!savedData.bestRanks) savedData.bestRanks = {};
        for (const areaId in WORLD_MAP) {
            const area = WORLD_MAP[areaId];
            if (area.stages) {
                area.stages.forEach(stage => {
                    savedData.bestRanks[stage.id] = "S";
                });
            }
        }
        alert("All stages unlocked (Rank S)!");
        this.saveAndReload();
    },

    unlockAllPacks: function () {
        this.unlockAllStages();
    },

    gainAllCards: function () {
        if (!savedData.cards) savedData.cards = {};
        if (typeof CARD_DB !== "undefined") {
            CARD_DB.forEach(card => {
                savedData.cards[card.id] = 3;
            });
            alert("All cards obtained (x3)!");
            this.saveAndReload();
        }
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
            localStorage.removeItem(SAVE_KEY);
            setTimeout(() => location.reload(), 500);
        }
    }
};

window.DebugManager = DebugManager;
