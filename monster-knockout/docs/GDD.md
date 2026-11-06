# GAME DESIGN DOCUMENT (GDD)
**Project**: Monster Knockout  
**Document Version**: 2.0 (Continuous Survival Architecture)  
**Game Mode**: Endless Arcade Survival / Continuous Enemy Spawning  
**Target Viewport**: Desktop Web Browser First ($1280\times720$ Landscape, 16:9)  

---

## 1. Game Concept & Core Experience

Monster Knockout is a 2D physics-based projectile combat and survival arcade game set on floating prehistoric islands.

The player controls **Gloop**, a squishy bipedal creature armed with a tribal slingshot, perched on the left island. Opponents spawn across the chasm on the right platform one after another in continuous combat.

### Core Philosophy:
- **No Campaign Levels or Maps**: The player enters the arena directly and fights continuously until death.
- **Immediate Enemy Respawn**: When an enemy is knocked off the island or defeated, the kill counter increases immediately (`KILLS: 0 → 1 → 2 → 3 ...`), a brief satisfying ragdoll collapse plays, and the next enemy seamlessly appears.
- **Persistent Player Health**: Player health does not reset automatically after each enemy; survival requires tactical precision and minimizing incoming damage.
- **Objective**: Achieve the highest kill count, maximize score, and set personal survival records.

---

## 2. Continuous Survival Gameplay Loop

```
1. ARENA ENTRY: Gloop stands on left island; initial enemy spawns on right island.
2. AIM & DRAW: Player drags mouse/touch backwards; dynamic dotted parabolic trajectory appears.
3. LAUNCH: Projectile flies with Matter.js gravity (y = 1.25), velocity, and spin.
4. IMPACT & RAGDOLL REACTION:
   - Kinetic impulse applies knockback force.
   - Body limbs wobble dynamically; head whips back.
   - Damage subtracted from Enemy HP; floating combat text appears.
5. ENEMY RETALIATION: Active enemy aims, telegraphs windup, and counter-fires.
6. ENEMY DEFEAT:
   - Trigger: Enemy HP reaches 0 OR enemy falls below abyss sensor (y > height - 20).
   - Upright balance disconnects; enemy tumbles into chasm.
   - Kill counter increments instantly (+1 Kills).
   - Score & Acorn rewards awarded.
   - Difficulty manager adjusts parameters.
   - Next enemy spawns seamlessly after 1.0s defeat animation.
7. PLAYER DEFEAT:
   - Trigger: Gloop HP reaches 0 OR Gloop knocked off platform.
   - Game Over screen triggers instantly:
     * Total Kills Defeated
     * Final Score
     * Survival Duration (MM:SS)
     * Personal Best High Score (retrieved from LocalStorage)
     * Immediate One-Click Restart button.
```

---

## 3. Enemy Archetypes & Spawning System

The `EnemySpawner` manages continuous sequential spawning across difficulty tiers:

| Enemy Archetype | Visual Description | Mass | Base HP | Attack Style | Role & Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Giggle-Goblin** | Sassy fuchsia imp with golden horns | $38\text{kg}$ | $45\text{ HP}$ | Fast pebble tosses ($12\text{ dmg}$) | Fast, squishy grunt. Easily toppled with solid Boulder knockback. |
| **Chonker Behemoth** | Heavy stone-scaled bruiser | $110\text{kg}$ | $120\text{ HP}$ | Heavy mud boulders ($26\text{ dmg}$) | Tank beast. Resists light hits; requires headshot stuns or Sticky Slime to topple. |
| **Bat-Critter** | Winged creature hovering above perch | $28\text{kg}$ | $35\text{ HP}$ | Spits acid glob seeds ($16\text{ dmg}$) | Airborne harasser. Wing hits induce chaotic spiral tumble into the chasm. |
| **Elite Variants** | Glowing aura, tribal war paint | $+25\%$ | $+50\%$ | Faster telegraphs, burst shots | High-value target appearing periodically; grants bonus score & health recovery. |

### Spawning Rules:
- New enemy spawns only after current enemy is confirmed eliminated (dead or in abyss).
- Spawn occurs at safe platform anchor coordinates ($x = \text{width} - 220$, $y = \text{perchY} - 120$) with zero obstacle intersection.
- Spawn entrance animation: cute drop-in bounce from top or pop-up with dust puff.

---

## 4. Progressive Difficulty Progression

Difficulty scales continuously based on total kills:

| Kill Threshold | Tier Name | Active Enemies | Enemy HP Multiplier | AI Aim Variance | Special Mechanics |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Kills 0–3** | Warm-Up | 100% Giggle-Goblins | $1.0\times$ | $\pm 18^\circ$ (gentle) | Baseline pacing |
| **Kills 4–7** | Escalation | 60% Goblin, 40% Chonker | $1.15\times$ | $\pm 12^\circ$ | High-mass knockback required |
| **Kills 8–12** | Airborne Threat | Goblin, Chonker, Bat-Critter | $1.30\times$ | $\pm 8^\circ$ (accurate) | Hovering flying enemies |
| **Kills 13+** | Endless Frenzy | All archetypes + Elites | $+5\%$ per kill | $\pm 5^\circ$ (deadly) | Elite glowing variants appear |

---

## 5. Primary Weapon Progression — Slingshot & Bow and Arrow

Monster Knockout features two distinct primary weapon classes with unique mechanics, ballistic profiles, and impact interactions:

### 1. Slingshot — Starting Weapon
- **Availability**: Unlocked from the very beginning.
- **Theme & Mechanic**: Tribal Y-fork slingshot with pull-back rubber elastic band.
- **Ballistics**: Looping parabolic trajectory, high kinetic knockback impulse.
- **Ammunition Arsenal** (Switchable via `[1]`–`[4]`):
  - **Boulder Nut**: Heavy carved prehistoric nut. Mass $4.8$, high linear impulse ($22\text{px/s}$ pushback), $22\text{ dmg}$. Excellent for toppling heavy foes off platforms.
  - **Spiky Puffer**: Prickly orange puffer fruit. Mass $3.2$, bouncy, bursts into radial quills on impact, $18\text{ dmg}$.
  - **Sticky Slime**: Sticky slug. Mass $3.5$, multiplies target limb drag by $2.5\times$, $12\text{ dmg}$. Disables mobility.
  - **Boomerang Bone**: Curved ivory bone. Pierces through and returns, $16\text{ dmg}$.
- **Suitability**: Easy to learn, forgiving aiming arc, highly effective for environmental knockback.

### 2. Bow & Arrow — Unlockable Weapon
- **Availability**: Unlocked through survival gameplay progression upon reaching **3 Kills**.
- **Theme & Mechanic**: Carved bone recurve bow with drawn sinew bowstring and flint-tipped feathered arrows.
- **Ballistics**: Higher velocity ($1.4\times$ speed), flatter aerodynamic trajectory. Arrow body dynamically rotates tangent to flight velocity ($\theta = \text{atan2}(v_y, v_x)$).
- **Body-Part Specific Damage**:
  - **Headshot Hit** (Upper $30\%$ of creature body): $1.75\times$ Critical Damage ($35\text{ dmg}$), violent head-whip tilt, floating `CRITICAL HEADSHOT!` text.
  - **Torso Hit**: Standard piercing damage ($20\text{ dmg}$).
  - **Foot / Perch Hit**: Moderate chip damage ($12\text{ dmg}$) with stumbling flinch.
- **Arrow-Sticking Physics**:
  - On collision with creature body, arrow embeds and sticks into the creature's physical ragdoll body (using a physical pin constraint).
  - Stuck arrows sway and wobble dynamically with the creature's balance oscillations and tumble with them into the chasm on knockout.

### Weapon Switching Controls
- **Desktop**: Click weapon tab in bottom HUD, or press `[TAB]` / `[Q]` to toggle between Slingshot and Bow. Keys `[1]`–`[4]` switch Slingshot ammo.
- **Mobile**: Large dedicated weapon switch toggle icon in floating bottom tray.

---

## 6. Combat Integration & Enemy Counter-Attacks

Combat in Monster Knockout is a continuous duel against respawning opponents:

- **Continuous Respawn**: Defeating an enemy immediately increments the Kill counter (`KILLS: 0 → 1 → 2 ...`) and triggers an automatic next enemy spawn after a $1.2\text{s}$ ragdoll defeat animation.
- **Enemy Counter-Attacks**:
  - Enemies do not passively wait; they periodically wind up, telegraph their aim with a subtle red trajectory line for $1.2\text{s}$, and launch projectiles at Gloop.
  - **Fair Damage Scaling**: Initial grunts deal low, fair damage ($8$–$12\text{ HP}$) compared to player damage ($20$–$35\text{ HP}$), giving players ample survival room (Player HP: $100$).
  - **Persistent Player Health**: Player HP does not fully reset between kills; surviving multiple enemy encounters requires strategic aiming, dodging, or eliminating enemies before they release their shot.
- **Articulated Ragdoll Reactions**:
  - Both Gloop and opponents feature active upright balance torque stabilization.
  - Non-lethal impacts cause stumbling wobble, torso tilt, and dynamic hurt facial expressions.
  - Lethal hits ($0\text{ HP}$) or falling off platforms disables the balance stabilizer, causing the creature to collapse into a limp ragdoll that tumbles down the cliff into the chasm abyss.

---

## 6. Desktop Widescreen ($1280 \times 720$) Layout & Visual Direction

### Viewport Framing:
- **Aspect Ratio**: $16:9$ Landscape ($1280\times720$ canvas centered in browser window).
- **Player Perch**: Left floating island ($x = 220, y = 540$, width $280\text{px}$).
- **Enemy Perch**: Right floating island ($x = 1060, y = 540$, width $280\text{px}$).
- **Central Chasm**: Wide, dramatic $560\text{px}$ abyss between platforms with rising mist and hanging suspension vines.
- **Upper Sky Arc**: Expansive vertical clearance ($y = 80$ to $420$) allowing high arcing ballistic shots.

### Visual Styling:
- 5-layer prehistoric Mossy Canopy: deep starry twilight gradient, distant misty mountain ridges, towering ancient jungle trees on flanks, draping canopy foliage along screen top, volumetric chasm mist, and drifting bioluminescent spores.
- Crisp cartoon characters ($140\times160\text{px}$) with soft grounding drop-shadows on mossy stone.

---

## 7. Survival HUD Specification

- **Top Left**: Player Health Bar with Cyan fill, numeric HP (`100/100`), and Gloop avatar medallion.
- **Top Right**: Active Enemy Health Bar with Magenta/Crimson fill, numeric HP, and Enemy Archetype avatar medallion.
- **Top Center Badge**:
  - `KILLS: X` in prominent gold typography with skull/trophy icon.
  - `SCORE: Y` and `TIME: MM:SS` directly below.
- **Bottom Center**: Floating Weapon Selector Tray with 4 weapon buttons (`Boulder`, `Puffer`, `Slime`, `Bone`) and desktop key hints `[1]`, `[2]`, `[3]`, `[4]`.
- **Top Corners**: Pause (`⏸`) and Mute (`🔊`) icon buttons.

---

## 8. Game Over & Local High Score System

When Gloop's HP reaches $0$ or Gloop falls into the chasm:
1. Active combat freezes.
2. Centered Game Over modal dialog appears:
   - "RUN FINISHED" header in glowing crimson/gold.
   - Total Enemies Knocked Out (`KILLS: X`).
   - Final Score (`SCORE: Y`).
   - Survival Duration (`TIME: MM:SS`).
   - "PERSONAL BEST" indicator (reads/writes `monster_knockout_best_kills` and `monster_knockout_best_score` from browser `localStorage`).
   - "PLAY AGAIN" primary button (instant run restart).
   - "MAIN MENU" secondary button.
