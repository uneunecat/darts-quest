# 📘 DARTS QUEST - Game Design Document
**Version:** 2.12 (Stable)
**Concept:** "Throw to Attack" - Physical Darts RPG

## 1. Core Mechanics
* **Physical Input:** Darts board hits translate directly to damage.
* **Deck System:** 20-card deck. Draw to hand. Use MP to activate Magic/Traps.
* **Trap System:** Set 1 Trap card to automatically counter enemy actions (Attack/Summon).

## 2. Battle System
* **Player Turn:** 3 Darts per turn.
    * **Magic:** Use before throwing (Healing, Buffs, Direct Damage).
    * **Attack:** Score = Damage. Multipliers apply (x2, x3).
    * **Weak Point:** Specific numbers trigger "Critical" (Guaranteed Drop chance).
* **Enemy Turn:**
    * **Patterns:** Attack, Charge, Heal, Special Skills (Bind, MP Drain).
    * **Bosses:** Unique mechanics (e.g., "Toon Skin" damage reduction, "Barrier" thresholds).

## 3. Card Rarity & Packs
* **Rarity:** N (Common) < R (Silver) < SR (Gold) < UR (Rainbow).
* **Packs:**
    * **Vol.1 Legend:** Basic Magic & Traps.
    * **Vol.2 Awakening:** Technical & High-Risk cards.
* **Unboxing:** Interactive pack opening animation with "shake" and "reveal" phases.

## 4. Stage Configuration
| Stage | Theme | Boss Feature |
|:---:|:---|:---|
| 1 | Forest | Evolution (Cocoon -> Moth), Regeneration |
| 2 | Wasteland | Power Aggression, Dinosaur Theme |
| 3 | Labyrinth | Trap/Stun tactics, Harpie Ladies |
| 4 | Toon World | Damage Immunity, Direct Attacks, RNG |
| 5 | Volcano (Extra) | High HP, MP Destruction (Red-Eyes) |
| 6 | God's Trial | Resurrection, Divine Wrath (Osiris) |

## 5. Technical Constraints
* **Audio:** 3-Channel Mixer (BGM, System SE, Attack SE).
* **Save:** 3 Slots + Auto-save on transaction.
* **Platform:** Web Browser (Chrome recommended for Bluetooth).