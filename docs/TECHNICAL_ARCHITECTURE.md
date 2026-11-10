# TECHNICAL ARCHITECTURE SPECIFICATION
**Project**: Monster Knockout  
**Architecture Version**: 2.0 (Continuous Survival / Desktop Web First)  
**Framework**: Phaser 3 (v3.80.1) with Integrated Matter.js 2D Physics Engine  
**Target Viewport**: Desktop Web Browser ($1280\times720$ Landscape, 16:9)  

---

## 1. System Architecture Diagram

```
                             ┌─────────────────────────┐
                             │      Phaser 3 Game      │
                             │     (Core Manager)      │
                             └────────────┬────────────┘
                                          │
          ┌───────────────────────────────┼───────────────────────────────┐
          │                               │                               │
          ▼                               ▼                               ▼
 ┌─────────────────┐             ┌─────────────────┐             ┌─────────────────┐
 │  Scene Manager  │             │ Physics System  │             │  Audio Manager  │
 │ - BootScene     │             │ - Matter.js     │             │ - Web Audio API │
 │ - MenuScene     │             │ - Ragdoll Joints│             │ - Procedural SFX│
 │ - GameScene     │             │ - Balance Torque│             │ - Mute controls │
 │ - UIScene (HUD) │             │ - Ballistic Math│             └─────────────────┘
 └────────┬────────┘             └─────────────────┘
          │
          ▼
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                      Continuous Combat Subsystems                       │
 │  - EnemySpawner: Sequential auto-respawn, archetype factory, entrance    │
 │  - DifficultyManager: Kill-scaled HP, AI accuracy & archetype weights   │
 │  - ScoreManager: Kills counter, score calculation, LocalStorage bests   │
 │  - TrajectorySystem: Parabolic dotted aim prediction arc                │
 │  - ProjectileSystem: Physical Matter bodies (Boulder, Puffer, Slime, Bone)│
 │  - CombatResolver: Impulse transfer, ragdoll disconnect, damage numbers│
 │  - GameOverModal: End-of-run stats, personal best records, instant restart│
 └─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure

```
c:/arna/ (fightarena)
├── index.html                  # Widescreen desktop canvas wrapper
├── css/
│   └── style.css               # Landscape desktop flex container
├── assets/
│   ├── phaser.min.js           # Offline local Phaser 3 + Matter.js (1.18 MB)
│   └── images/                 # Procedural vector texture cache
├── docs/                       # Complete project documentation
│   ├── GAME_CONCEPT.md         # Continuous survival concept & fantasy
│   ├── GDD.md                  # Detailed gameplay mechanics & survival loop
│   ├── TECHNICAL_ARCHITECTURE.md # Revised continuous architecture
│   ├── DEVELOPMENT_ROADMAP.md  # Survival milestone roadmap
│   ├── PROGRESS_TRACKER.md     # Up-to-date execution log
│   └── ASSET_INVENTORY.md      # 100% original IP asset registry
└── src/
    ├── main.js                 # Phaser config: 1280x720 FIT landscape
    ├── entities/
    │   ├── RagdollCreature.js  # Articulated creature with active balance torque & ragdoll KO
    │   ├── Projectile.js       # Slingshot projectiles (Boulder, Puffer, Slime, Bone)
    │   └── Arrow.js            # Ballistic arrow entity with velocity rotation & body sticking
    ├── systems/
    │   ├── EnemySpawner.js     # Continuous auto-respawn controller
    │   ├── DifficultyManager.js# Kill-scaled progression manager
    │   ├── Trajectory.js       # Parabolic dotted ballistic arc
    │   ├── CombatResolver.js   # Physics impact, headshot multiplier & defeat
    │   └── ScoreManager.js     # Kills, score, timer & LocalStorage
    └── scenes/
        ├── BootScene.js        # Procedural canvas assets & loading
        ├── MenuScene.js        # Title, bouncing Gloop, Best Kills record
        ├── GameScene.js        # Main widescreen survival arena & weapon pipeline
        └── UIScene.js          # Survival HUD, weapon category switcher & Game Over modal
```

---

## 3. Core Subsystems Detail

### A. EnemySpawner (`src/systems/EnemySpawner.js`)
- **Responsibility**: Listens for enemy defeat events, triggers a 1.0s ragdoll defeat tumble, and spawns the next enemy seamlessly.
- **Archetype Factory**: Instantiates `Giggle-Goblin`, `Chonker-Behemoth`, `Bat-Critter`, or `Elite` based on weights from `DifficultyManager`.
- **Positioning**: Spawns securely on the right platform ($x = 1060, y = 390$) with zero obstacle overlap.

### B. DifficultyManager (`src/systems/DifficultyManager.js`)
- **Input**: Current run kill count (`kills`).
- **Scaling Formulae**:
  - Enemy HP: $\text{BaseHP} \times (1 + \min(2.5, \text{kills} \times 0.05))$
  - AI Aim Error Margin: $\max(4^\circ, 20^\circ - \text{kills} \times 1.2^\circ)$
  - Archetype Weights:
    - Kills 0–3: 100% Goblin
    - Kills 4–7: 60% Goblin, 40% Chonker
    - Kills 8–12: 40% Goblin, 40% Chonker, 20% Bat-Critter
    - Kills 13+: 30% Goblin, 35% Chonker, 25% Bat-Critter, 10% Elite

### C. ScoreManager (`src/systems/ScoreManager.js`)
- **State**: `kills` (int), `score` (int), `elapsedTime` (seconds).
- **Rewards**:
  - Grunt Kill: $+100$ pts
  - Heavy Tank Kill: $+250$ pts
  - Airborne Kill: $+200$ pts
  - Headshot Bonus: $+50$ pts
  - Abyss Ring-Out Bonus: $+75$ pts
- **Persistence**: Reads and writes `monster_knockout_best_kills` and `monster_knockout_best_score` via browser `window.localStorage`.

### D. Trajectory (`src/systems/Trajectory.js`)
- Pre-calculates 24 ballistic steps using Matter.js gravity ($g_y = 1.25$, step delta $2.0$).
- Displays dotted guideline sprites (`trajectory_dot`) curving towards the right platform.

---

## 4. Viewport & Canvas Configuration

```javascript
const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#040d18',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720
  },
  physics: {
    default: 'matter',
    matter: {
      gravity: { y: 1.25 },
      debug: false
    }
  },
  scene: [BootScene, MenuScene, GameScene, UIScene]
};
```
