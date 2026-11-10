# Fight Arena — Monster Knockout

A physics-based continuous survival arcade combat game built with **Phaser 3 (v3.80.1)** and **Matter.js 2D Physics**.

## 🎮 Game Overview
Monster Knockout features physics-based projectile combat across floating prehistoric islands. Take control of **Gloop**, equipped with a tribal slingshot and unlockable bone recurve bow, launching organic projectiles and ballistic arrows against rival creatures!

- **Mode:** Continuous Survival / Endless Arcade Combat
- **Resolution:** 1280x720 Widescreen Landscape (Responsive `FIT`)
- **Physics Engine:** Matter.js with active upright torque balance stabilization
- **Weapons:**
  - **Tribal Slingshot:** Starting weapon with 4 ammunition types (Boulder Nut, Spiky Puffer, Sticky Slime, Boomerang Bone).
  - **Bow & Arrow:** Unlocked at 3 Kills; aerodynamic flight rotation tangent to velocity, upper 30% headshot criticals (1.75x damage), and arrow-sticking physics.
- **Enemies:** Reactive combat AI with telegraphed counter-attacks, dynamic expressions (normal, hurt, KO), and comical ragdoll chasm tumbles.

## 🚀 How to Run Locally

### Option 1: Node.js Server
```bash
node server.js
```
Open [http://localhost:8080/](http://localhost:8080/) in any modern web browser.

### Option 2: Quick Start Script (Windows)
Double-click `start-game.bat` or run:
```cmd
start-game.bat
```

### Option 3: Direct File / Static Server
Open `index.html` via any local HTTP server (e.g. VS Code Live Server, Python `python -m http.server 8080`).

## 🧪 Verification & Automated Testing
The project includes an in-engine test suite:
- Open `verify.html` in a browser or headless runner to execute all 88 runtime automated tests across 12 test suites.

## 🛠️ Project Structure
```
c:/arna/
├── assets/                   # Libraries and assets (Phaser 3 v3.80.1)
├── css/                      # Responsive styling and viewport canvas fits
├── docs/                     # GDD, Technical Architecture, Progress Tracker
├── src/
│   ├── entities/             # Projectile, Arrow, RagdollCreature
│   ├── scenes/               # BootScene, MenuScene, GameScene, UIScene
│   ├── systems/              # Trajectory prediction system
│   └── main.js               # Game config & engine initialization
├── index.html                # Main game entry point
├── preview.html              # Aiming & visual inspection preview
├── verify.html               # 88-test automated test suite
├── server.js                 # Lightweight local Node.js server
├── start-game.bat            # Windows one-click startup batch script
├── .gitignore                # Git ignore configuration
└── README.md                 # Project documentation
```
