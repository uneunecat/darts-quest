// =========================================
// 2. AUDIO SYSTEM (サウンド管理)
// =========================================
let gameConfig = { bgmVolume: 0.3, sysVolume: 0.5, atkVolume: 0.8 };
let currentBgmId = "";

function loadGameConfig() {
    const saved = localStorage.getItem("darts_quest_config");
    if (saved) {
        try {
            gameConfig = { ...gameConfig, ...JSON.parse(saved) };
        } catch (e) {
            console.error("Config Load Error:", e);
        }
    }
}
loadGameConfig();

function saveGameConfig() {
    localStorage.setItem("darts_quest_config", JSON.stringify(gameConfig));
}

function stopAllBGM() {
    AUDIO_ASSETS.BGM.forEach(id => {
        const audioEl = document.getElementById(id);
        if (audioEl) {
            audioEl.pause();
            audioEl.currentTime = 0;
        }
    });
    currentBgmId = "";
}

function playBGM(id) {
    if (currentBgmId === id) return; // 既に再生中なら何もしない
    stopAllBGM();
    const audioEl = document.getElementById(id);
    if (audioEl) {
        currentBgmId = id;
        audioEl.volume = gameConfig.bgmVolume;
        audioEl.play().catch(e => console.log("BGM Error:", e));
    }
}

function updateCurrentBgmVolume() {
    if (currentBgmId) {
        const audioEl = document.getElementById(currentBgmId);
        if (audioEl) audioEl.volume = gameConfig.bgmVolume;
    }
}

function playSE(id) {
    const audioEl = document.getElementById(id);
    if (audioEl) {
        audioEl.currentTime = 0;
        if (AUDIO_ASSETS.SE_ATTACK.includes(id)) {
            audioEl.volume = gameConfig.atkVolume;
        } else {
            audioEl.volume = gameConfig.sysVolume;
        }

        if (audioEl.volume > 0.01) {
            audioEl.play().catch(e => { });
        }
    }
}
