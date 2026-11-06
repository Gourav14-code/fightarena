# GAME DESIGN DOCUMENT (GDD)
**Project**: Magic Ragdoll Battle (Working Title)
**Status**: Architecture & Design Phase

---

## 1. Game Concept & Narrative
In a floating fantasy realm shattered by ancient mana storms, rival magical guilds fight for dominance atop precarious mystic spires. You play as an ambitious apprentice mage equipped with an enchanted staff, casting physical elemental magic to conquer rival mages across treacherous floating battlegrounds.

---

## 2. Core Gameplay Loop
1. **Level Entry**: The camera pans across the chasm, showing the opponent mage(s) on their tower/platform.
2. **Aim & Calibration**: Player drags back on the lower screen (or mouse) to visualize the predictive trajectory arc.
3. **Spell Launch**: Releasing throws the magical projectile with physics velocity and rotational spin.
4. **Collision & Impact**: The projectile strikes the opponent or environment, applying damage, knockback forces, and elemental status effects.
5. **Opponent Turn / Counter-fire**: AI mages aim and return fire with telegraph animations.
6. **Resolution**:
   - **Win**: All opponents are knocked off platforms, into hazards, or have health reduced to 0.
   - **Lose**: Player is knocked off their tower or health is depleted.
7. **Progression**: Stars (1-3) and coins awarded $\rightarrow$ Spend coins on spell power, health, and cooldowns $\rightarrow$ Unlock next stage or boss duel.

---

## 3. Main Mechanics & Elemental System

| Spell Name | Elemental School | Flight Trajectory | Impact Physics & Effect | Purpose / Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **Arcane Spark** | Neutral Mana | Fast, low-arc projectile | Moderate knockback, 15 damage | Quick, reliable default shot |
| **Blaze Orb** | Fire | Medium-arc explosive ball | Massive radial blast impulse, 35 damage, launches targets into air | Destabilizing towers and high knockback |
| **Frost Javelin** | Ice | High-speed piercing lance | Heavy mass penalty (freezes target solid for 2.5s), 22 damage | Weighs down opponent, causing tower collapse |
| **Thunder Bolt** | Lightning | Fast zigzag projectile | Disables enemy aim, applies chaotic angular twitches, 28 damage | Disrupts enemy counter-attacks |
| **Terra Boulder** | Earth | Heavy high-arc lob | Smashes through destructible cover/shields, 45 damage | Crushes static defense structures |

---

## 4. Player Interactions & Controls
- **Mobile (One-Handed)**:
  - Dragging anywhere in the lower 40% of the screen activates the slingshot-style trajectory arc.
  - Spell selection tray is positioned directly above the bottom navigation bar within easy thumb reach.
  - Buttons have a minimum touch target of $48\times48\text{dp}$ to prevent misclicks.
- **Desktop**:
  - Mouse click-and-drag for aiming and casting.
  - Number keys `1`–`4` or mouse click on spell icons for rapid selection.
- **Unified Input Pipeline**: A single Phaser Pointer input system processes both touch and mouse events identically.

---

## 5. Character & Ragdoll Behavior
- **Active State (Alive & Fighting)**:
  - Balanced composite humanoid: Head, Torso, Left/Right Arms, Legs connected by Matter.js revolute constraints.
  - An upright restorative torque (balance spring) keeps the mage standing tall while allowing natural torso tilt during aiming and spell recoil.
  - Floppy elements (pointy hat tip, robe hem) have independent spring constraints for organic, comedic wobble.
- **Hit Reaction**:
  - Direct kinetic impulses displace the struck body part; the head whips back with elastic recoil.
- **Knockout / Death State**:
  - When health drops to 0 or upon falling off the platform, balance constraints release completely.
  - The mage turns into a 100% loose multi-joint floppy ragdoll that tumbles, bounces, and flails off into the chasm.

---

## 6. Physics & Collision Architecture
- **Engine**: Phaser 3 integrated Matter.js.
- **Collision Categories**:
  - `CATEGORY_TERRAIN` (Solid floors, towers, floating islands)
  - `CATEGORY_PLAYER` (Player body parts)
  - `CATEGORY_ENEMY` (Enemy body parts)
  - `CATEGORY_PLAYER_SPELL` (Player projectiles)
  - `CATEGORY_ENEMY_SPELL` (Enemy projectiles)
  - `CATEGORY_DEBRIS` (Broken pillars, shields, rocks)
- **Continuous Collision Detection (CCD)**: Raycast path stepping prevents high-velocity magic bolts from tunneling through platforms or heads.

---

## 7. Environment & Level Design (Campaign Stages)
- **World 1: Mystic Spire Ruins** (Levels 1–5):
  - Flat stone pillars, stable platforms. Introduction to Arcane Spark and Blaze Orb.
  - **Level 5 Boss**: *Pyromancer Ignis* (Double-sized health, explosive staff).
- **World 2: Frostpeak Chasm** (Levels 6–10):
  - Narrow ice spires, slippery footing, wind currents that curve spell arcs. Introduction to Frost Javelin.
  - **Level 10 Boss**: *Frost King Boreas* (Summons ice shields).
- **World 3: Storm Citadel** (Levels 11–15):
  - Multi-tier platforms, moving sky-barges, lightning rods that attract bolts.
  - **Level 15 Boss**: *Storm Sovereign Raijin* (Rapid-fire twin lightning bolts).

---

## 8. Enemy AI Behavior
- **Apprentice AI (Early Levels)**:
  - Aim calculation has deliberate angular variance ($\pm 8^\circ$).
  - Cast delay: 2.2 seconds between shots, allowing player to react and counter-attack.
- **Veteran Mage AI (Mid Levels)**:
  - Tighter accuracy ($\pm 3^\circ$), leads shots based on player balance, reacts to incoming fire.
- **Boss AI**:
  - Unique attack sequences (charged ultimate spells, defensive barrier summons, changing platform heights).

---

## 9. UI / UX Design & Screen Flow
```
[Splash / Loading Screen]
          ↓
     [Main Menu] ←────────┐
     /         \          │
[Level Select]  [Settings]│
     ↓                    │
[Gameplay HUD] ───────────┤
  - Level Indicator       │
  - Player / Enemy HP     │
  - Spell Selector Tray   │
  - Pause Button          │
     ↓                    │
[Level Complete / Defeat]─┘
  (Stars, Coins, Next / Retry)
```

---

## 10. Audio & Visual Design
- **Visual Style**: High-contrast, clean 2D vector look. Dark atmospheric gradient skies with vibrant neon/pastel magical energy.
- **Audio Feedback (Web Audio API Synthesizer)**:
  - Spell cast whooshes (frequency modulation).
  - Impact crunches (filtered noise + low-frequency sine booms).
  - Ragdoll impact clatter and goofy grunts.
  - Level victory fanfare.

---

## 11. Progression, Economy & Monetization
- **Currency**: Mana Coins earned by completing levels and hitting skill shots (headshots, platform collapsers).
- **Upgrades**:
  - Spell Damage (+10% per tier).
  - Blast Radius (+15% area-of-effect).
  - Mage Hull Integrity (+15% max health).
  - Ward Shield (1-hit protection per round).
- **Monetization (Phase 8)**:
  - Optional rewarded video for 2x coin multiplier or free round retry.
  - Non-intrusive interstitial between every 3-4 levels (never during active combat).
  - Optional IAP: "Remove Ads" + Starter Spell Pack.
