# DEVELOPMENT ROADMAP: MONSTER KNOCKOUT
**Game Mode**: Continuous Survival Arcade Combat  
**Target Viewport**: Desktop Web Browser First ($1280\times720$ Landscape)  

---

### MILESTONE 1: Desktop Landscape Arena & Foundation
- Convert canvas and viewport to $1280\times720$ widescreen landscape (`Phaser.Scale.FIT`).
- Widescreen prehistoric jungle arena ("Mossy Canopy") with left and right floating islands separated by a central chasm.
- Prominently scaled Gloop and initial Goblin rival with grounding shadows.
- Remove outdated LevelSelectScene from active scene array.
- Survival HUD foundation in `UIScene`.

### MILESTONE 2: Core Ballistic Aim & Projectile Launch
- Slingshot drag-and-aim input pipeline (mouse drag for desktop, touch-ready).
- Parabolic dotted trajectory arc prediction matching Matter.js gravity ($g_y = 1.25$).
- Dynamic projectile launching with physical mass, velocity vector, and rotational spin.
- Platform, boundary, and abyss collision handling.

### MILESTONE 3: Ragdoll Creature Physics & Knockout Mechanics
- Matter.js creature composite bodies with active upright balance torque.
- Impact impulse transfer: head snaps back, body wobbles on balance spring.
- Knockout state: balance spring disconnects on HP $0$ or platform ring-out, triggering comedic floppy ragdoll tumble into the chasm.

### MILESTONE 4: Continuous Enemy Spawner & Survival HUD
- `EnemySpawner` system: automatically detects enemy defeat, plays 1.0s defeat animation, and seamlessly spawns the next rival.
- Immediate kill counter increment (`KILLS: 0 → 1 → 2 → 3 ...`).
- Survival HUD with Kills count, Score, Survival Timer (`00:00`), Player HP, and Active Enemy HP.
- Persistent player health across continuous encounters.

### MILESTONE 5: Enemy Combat AI & Progressive Difficulty Scaling
- Enemy creature AI state machine (Aim, Windup Telegraph, Counter-Fire, Cooldown).
- `DifficultyManager` tracking kill count:
  - Increases enemy HP multiplier gradually.
  - Tightens AI aiming variance from $\pm 18^\circ$ down to $\pm 5^\circ$.
  - Introduces heavy tank (**Chonker Behemoth**) and airborne (**Bat-Critter**) archetypes at kill milestones.

### MILESTONE 6: Complete 4-Weapon Arsenal
- **Boulder Nut**: Heavy mass kinetic pushback.
- **Spiky Puffer**: Explodes on contact into 6 sharp quills.
- **Sticky Slime**: Attaches to limbs, increasing drag & surface friction.
- **Boomerang Bone**: Curved piercing trajectory with return-hit combo.
- Floating bottom weapon selector tray with desktop number keys `[1]` to `[4]`.

### MILESTONE 7: Game Over Modal & Local High Score Records
- Game Over screen triggered upon Gloop's defeat:
  - Total Kills Defeated.
  - Final Score & Duration Survived.
  - Personal Best High Score retrieved and saved via `window.localStorage`.
  - Immediate "PLAY AGAIN" one-click restart.
- Seamless restart loop with zero menu back-and-forth.

### MILESTONE 8: Audio Synthesis & Visual Juice
- Procedural Web Audio API sound generator (slingshot rubber stretch, launch whoosh, meaty crunch impacts, comedic squeaks).
- Impact hit-stop (brief freeze frame on solid hit), screen shake, and dust/leaf particle bursts.

### MILESTONE 9: Cross-Platform Packaging & Android Export
- Capacitor packaging configuration for Android.
- Mobile touch safe-area anchoring and notch adjustments.
- 60 FPS performance verification on budget hardware.
