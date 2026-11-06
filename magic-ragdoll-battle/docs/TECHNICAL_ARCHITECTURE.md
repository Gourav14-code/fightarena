# TECHNICAL ARCHITECTURE SPECIFICATION
**Project**: Magic Ragdoll Battle
**Framework**: Phaser 3 (v3.80.1) + Matter.js Physics Engine
**Target**: Android (Capacitor) & Modern Desktop Browsers

---

## 1. System Architecture Overview

```
                      ┌─────────────────────────┐
                      │      Phaser 3 Game      │
                      │     (Core Manager)      │
                      └────────────┬────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
         ▼                         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  Scene Manager  │       │ Physics System  │       │  Audio Manager  │
│ - BootScene     │       │ - Matter.js     │       │ - Web Audio API │
│ - MenuScene     │       │ - Ragdoll Joints│       │ - Zero-asset SFX│
│ - LevelSelect   │       │ - Constraints   │       │ - Mute controls │
│ - GameScene     │       │ - Balance Torque│       └─────────────────┘
│ - UIScene       │       └─────────────────┘
└────────┬────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────┐
│                      Entities & Data                       │
│  - PlayerMage (Composite Ragdoll + Trajectory Pointer)     │
│  - EnemyMage (AI Aim & Cast State Machine)                 │
│  - SpellProjectiles (Fire, Frost, Lightning, Earth)        │
│  - LevelStructures (Towers, Pillars, Dynamic Platforms)    │
│  - LevelsData (JSON-driven stage & boss definitions)       │
│  - SaveSystem (LocalStorage for stars, coins & upgrades)   │
└────────────────────────────────────────────────────────────┘
```

---

## 2. Directory & Module Structure

```
magic-ragdoll-battle/
├── index.html                  # Responsive HTML5 Canvas container
├── css/
│   └── style.css               # Fullscreen touch-safe styling
├── assets/
│   ├── phaser.min.js           # Offline Phaser 3 + Matter.js engine (1.18 MB)
│   ├── images/                 # Procedural & optimized vector textures
│   └── audio/                  # Audio assets (if external) or procedural synth
├── docs/                       # Complete project documentation
│   ├── GAME_CONCEPT.md
│   ├── GDD.md
│   ├── TECHNICAL_ARCHITECTURE.md
│   ├── DEVELOPMENT_ROADMAP.md
│   ├── PROGRESS_TRACKER.md
│   ├── ASSET_INVENTORY.md
│   └── CHANGELOG.md
└── src/
    ├── main.js                 # Phaser game boot config
    ├── core/
    │   ├── Constants.js        # Physics categories, dimensions, colors
    │   └── Events.js           # Global event emitter bus
    ├── scenes/
    │   ├── BootScene.js        # Texture generation & asset preloader
    │   ├── MenuScene.js        # Title, play & settings navigation
    │   ├── LevelSelectScene.js # Stage grid & star tracking
    │   ├── GameScene.js        # Active combat & Matter.js simulation
    │   └── UIScene.js          # HUD overlays, trajectory & spell tray
    ├── entities/
    │   ├── MageRagdoll.js      # Articulated humanoid physics composite
    │   ├── SpellProjectile.js  # Projectile flight, trails & impact handlers
    │   └── EnemyAI.js          # Trajectory prediction & combat decision logic
    ├── systems/
    │   ├── TrajectoryPreview.js# Real-time mathematical parabolic arc preview
    │   ├── ElementalCombat.js  # Freeze mass, explosion impulse, shock twitch
    │   ├── StructureBuilder.js # Tower platforms, destructible blocks
    │   ├── AudioManager.js     # Web Audio procedural sound synthesizer
    │   └── SaveManager.js      # LocalStorage save/load system
    └── data/
        ├── levels.json         # Campaign stages 1–15 & boss configs
        ├── spells.json         # Elemental spell attributes & unlock tiers
        └── upgrades.json       # Shop costs & stat scaling curves
```

---

## 3. Performance & Memory Budget (60 FPS on Low-End Hardware)

1. **Physics Constraint Limit**:
   - Max 2 active mages on screen simultaneously (Player + 1 Enemy / Boss).
   - Each mage ragdoll is composed of 5 primary bodies (Head, Torso, Left Arm, Right Arm, Legs) linked by 4 Matter.js revolute constraints. Total ragdoll bodies = 10.
   - Max 10 dynamic structural blocks on screen at any time.
   - Total active dynamic physics bodies per frame: $\le 24$.
2. **Fixed Physics Timestep**:
   - Matter.js engine set to fixed $60\text{ Hz}$ update (`delta: 1000 / 60`) to prevent frame jitter and tunneling.
3. **Continuous Collision Stepping**:
   - High-velocity projectiles step position with sub-frame ray-marching to eliminate clipping through thin terrain or heads.
4. **Memory Management & Zero GC Thrashing**:
   - No object creation inside `update()` loops.
   - Reusable Vector math instances for trajectory calculations.
   - Particle emitters use fixed pre-allocated pools.

---

## 4. Mobile & Desktop Scaling Strategy
- **Base Logical Resolution**: $720 \times 1280$ ($9:16$ portrait format).
- **Scale Mode**: `Phaser.Scale.FIT`, `autoCenter: Phaser.Scale.CENTER_BOTH`.
- **Safe Area Insets**: Top HUD anchored with $40\text{px}$ notch padding; bottom spell tray anchored with $24\text{px}$ home-bar padding.
- **Unified Pointer Input**: `pointerdown`, `pointermove`, `pointerup` handles mouse clicks and mobile multi-touch identically without redundant listeners.
