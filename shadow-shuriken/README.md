# Shadow Shuriken: Rooftop Shinobi

A complete standalone 2D physics ragdoll distance-progression dueling game built with **Matter.js** and **HTML5 Canvas** in a single self-contained file.

## 🌙 Visual Aesthetic & Theme
- **Theme:** Stylized high-contrast Japanese night rooftops.
- **Visuals:** Pure dark silhouettes for characters, buildings, and pagodas (`#111115`), glowing crimson accent trails (`#ff2a4d`), a moonlit purple-tinted dusk gradient sky, and falling cherry blossom petals (sakura) with ember particles.
- **Zero External Assets:** 100% procedural HTML5 Canvas rendering. Zero image dependencies.

## 🎮 Controls (Single Touch / Single Mouse Only)
- **Aim & Throw:** Click/touch and drag backward from the shinobi to aim trajectory and set throw force.
- **Trajectory Arc:** Real-time glowing dotted parabolic preview showing the exact physical flight path.
- **Release:** Fires a spinning 4-point iron shuriken with physical impulse.
- No keyboard controls required; fully playable one-handed.

## ⚔️ Ragdoll Physics (Matter.js)
- **Articulated Ragdolls:** Multi-part composite bodies (head, torso, limbs, constraints).
- **Active Balance Stabilizer:** Upright spring torque keeps ninjas standing proudly while alive.
- **Headshot:** Instant critical KO! Balance spring disconnects, joints loosen into floppy ragdoll physics, awarding 2x coins.
- **Body / Limb Hits:** Disruption, damage, and stumbling knockback wobble.
- **Rooftop Falls:** Falling off the platform ledge results in an instant plunge into the abyss.

## 🏃 Endless Distance Progression
- Defeating the opposing enemy triggers an automatic ninja sprint / auto-dash.
- Seamless parallax scrolling with meter distance gains (+38m to +50m per rooftop).
- Scaled difficulty: variable rooftop heights, armored shadow ninja variants, and faster enemy counter-attack intervals.

## 🚀 How to Play
Open `index.html` in any browser or launch local server:
```bash
node server.js
```
Navigate to [http://localhost:8080/shadow-shuriken/](http://localhost:8080/shadow-shuriken/).
