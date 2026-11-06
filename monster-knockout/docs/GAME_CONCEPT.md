# GAME CONCEPT: MONSTER KNOCKOUT

## 1. Executive Summary
- **Working Title**: Monster Knockout
- **Genre**: 2D Physics-based Continuous Survival Projectile Combat & Creature Brawler
- **Target Audience**: Casual & arcade web and mobile players worldwide (primary focus: US market, all ages 9+)
- **Platforms**: Desktop Web Browser First ($1280\times720$ widescreen landscape) with future Android (Capacitor) cross-platform packaging
- **Core Inspiration**: The physical intuition, tactile trajectory aiming, funny ragdoll reactions, and continuous enemy encounter survival loop of *Ragdoll Archers*, reimagined with 100% original quirky creatures, eccentric projectile weapons, and endless wave escalation.

---

## 2. Core Fantasy & Player Objective
In an ancient, untamed prehistoric jungle of floating island perches, the player controls **Gloop**—a lovable, bouncy bipedal creature armed with a heavy tribal slingshot.

Across the floating island chasm, rival creatures appear one after another in relentless succession. The player's objective is simple, raw, and addictive:

**Survive as long as possible, defeat as many enemies as possible, and achieve the highest kill count record.**

There are:
- **NO traditional campaign levels or worlds.**
- **NO level selection maps or level completion screens.**
- **NO forced pauses between enemy encounters.**

When an enemy is knocked off their perch or defeated, they collapse in comedic ragdoll fashion, the kill counter increases immediately (`KILLS: 0 → 1 → 2 → 3 ...`), and the next enemy seamlessly spawns into the arena. The fight continues uninterrupted until the player falls.

---

## 3. Continuous Survival Gameplay Loop

```
[Start Run / Immediate Arena Entry]
                 ↓
      [Enemy Spawns on Island]
                 ↓
 [Drag to Aim Ballistic Arc Preview]
                 ↓
    [Release to Launch Projectile]
                 ↓
  [Physics Impact & Ragdoll Wobble]
                 ↓
[Enemy Counter-Attack / AI Projectile]
                 ↓
       [Resolution Branch]
        ├── Enemy Defeated:
        │     - Comedic Ragdoll Tumble into Abyss
        │     - Kill Counter +1 immediately
        │     - Score & Acorn Currency Awarded
        │     - Difficulty / Tier Escalation
        │     - Next Enemy Seamlessly Spawns (Loop continues)
        │
        └── Player Defeated (HP = 0 or Knocked into Abyss):
              - Game Over Screen Overlay
              - Stats: Total Kills, Final Score, Time Survived
              - Personal Best High Score Saved (LocalStorage)
              - Immediate One-Click Restart
```

---

## 4. Key Pillars of Originality

1. **Continuous Slapstick Survival**:
   - No menus or level boundaries breaking the player's momentum. The tension builds organically as kill counts rise and heavier or airborne creatures appear.
2. **Original Creature Personalities**:
   - **Gloop**: Lovable squishy cyan hero with bouncy golden ears and expressive cartoon reactions.
   - **Giggle-Goblin**: Light, nimble fuchsia imp with tribal horns and mischievous sneer.
   - **Chonker Behemoth**: Massive, heavy-mass rock beast requiring precise headshots or heavy kinetic knockback to topple.
   - **Bat-Critter**: Flapping airborne menace with erratic hovering patterns.
3. **Tactile Prehistoric Arsenal**:
   - **Boulder Nut**: Heavy kinetic knockback impulse.
   - **Spiky Puffer**: Exploding prickly fruit bomb with area-of-effect spines.
   - **Sticky Slime**: Gooey slug adding limb drag and surface friction.
   - **Boomerang Bone**: Curved piercing trajectory with dual-hit potential.
4. **Desktop Widescreen First**:
   - Expansive $16:9$ landscape layout ($1280\times720$) utilizing the browser viewport effectively with crisp cartoon readability and plenty of sky for high arcing shots.
