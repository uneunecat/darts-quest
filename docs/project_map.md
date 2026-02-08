# 🗺️ Project Architecture Map (v2.12)

## 1. File Structure & Responsibilities

* **index.html**: Application Entry Point
    * **Audio**: Centralized `<audio>` tags (BGM/SE).
    * **Layers**: Background -> Chapter Screen -> Game Container -> Modals.
    * **Modals**: History, Shop, Pack Opening, Deck Edit, Card Selector.
* **style.css**: Visual Design System
    * **Rarity Engine**: Detailed CSS for N/R/SR/UR effects (Glow, Sheen, Rainbow Text).
    * **Responsive**: Mobile-first adaptations (`@media max-width: 900px`).
    * **Animations**: Keyframes for shaking, flashing, and pack opening sequences.
* **main.js**: Core Game Logic (Monolithic)
    * **State Machines**: `player`, `enemy`, `gameConfig`, `savedData`.
    * **Bluetooth**: UUID services for DARTSLIVE HOME communication.
    * **Battle System**: Damage calculation, Trap triggers, Turn management.

## 2. Core Logic Flow

### A. Initialization
* `initGameSession(stage)`: Resets state, loads `GAME_DATA`, shuffles deck.
* `connectToBoard()`: Handles Web Bluetooth API connection & notifications.

### B. Battle Loop
1.  **Wait for Input**: Bluetooth signal or Keyboard (Debug).
2.  **`processOneThrow(score)`**:
    * Calc Damage (Base + Buffs - Guards).
    * Trigger `weakHit` (Critical) & Visual Effects.
    * Update HP UI (`animateValue`).
3.  **`finishPlayerTurn()`**:
    * Reset temporary buffs/locks.
    * Transition to Enemy Turn.
4.  **`enemyTurn()`**:
    * AI Logic based on Stage/Floor.
    * Execute Skills (Cut-in animation -> Damage/Heal/Debuff).
    * `triggerTrap()`: Interrupts enemy attack if Trap is set.

### C. Data Persistence
* **Storage**: `localStorage` ("darts_quest_save", "darts_quest_config").
* **Structure**: Slots 1-3, managing Deck arrays and Card ownership counts.

## 3. Key Classes & IDs
* `.std-card`: The universal card component (used in Hand, Deck, Shop).
* `#game-scaler`: Handles aspect ratio scaling for desktop/mobile consistency.
* `DL_SCORE_MAP`: Hex code to Darts Score conversion table.