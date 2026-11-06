/**
 * Weapon system for Sky Assault: modular weapon definitions,
 * projectile physics and trails, firing cooldowns, and ammo management.
 */

const WEAPON_TYPES = {
  PULSE_BLASTER: {
    id: 'PULSE_BLASTER',
    name: 'Pulse Blaster',
    icon: '\u26A1',
    cooldownMs: 155,
    damage: 18,
    knockback: 12,
    speed: 24,
    pellets: 1,
    spread: 0.03,
    color: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.6)',
    maxAmmo: Infinity,
    isUnlimited: true,
    projectileRadius: 3.5,
    screenShake: 2,
    barrelLength: 28
  },
  SCATTER_GUN: {
    id: 'SCATTER_GUN',
    name: 'Scatter Gun',
    icon: '\uD83D\uDCA5',
    cooldownMs: 440,
    damage: 13,
    knockback: 22,
    speed: 21,
    pellets: 6,
    spread: 0.26,
    color: '#fbbf24',
    glowColor: 'rgba(251, 191, 36, 0.7)',
    maxAmmo: 28,
    isUnlimited: false,
    projectileRadius: 3.0,
    screenShake: 7,
    barrelLength: 24
  },
  ENEMY_PISTOL: {
    id: 'ENEMY_PISTOL',
    name: 'Scrap Pistol',
    icon: '\uD83D\uDD34',
    cooldownMs: 950,
    damage: 12,
    knockback: 8,
    speed: 15,
    pellets: 1,
    spread: 0.08,
    color: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.6)',
    maxAmmo: Infinity,
    isUnlimited: true,
    projectileRadius: 3.5,
    screenShake: 0,
    barrelLength: 20
  },
  DRONE_BLASTER: {
    id: 'DRONE_BLASTER',
    name: 'Drone Pulse',
    icon: '\uD83D\uDD34',
    cooldownMs: 1400,
    damage: 10,
    knockback: 7,
    speed: 13,
    pellets: 1,
    spread: 0.05,
    color: '#f87171',
    glowColor: 'rgba(248, 113, 113, 0.6)',
    maxAmmo: Infinity,
    isUnlimited: true,
    projectileRadius: 3.0,
    screenShake: 0,
    barrelLength: 10
  }
};

class WeaponInstance {
  constructor(weaponTypeKey) {
    this.config = WEAPON_TYPES[weaponTypeKey] || WEAPON_TYPES.PULSE_BLASTER;
    this.ammo = this.config.maxAmmo;
    this.cooldownTimer = 0;
  }

  canFire() {
    return this.cooldownTimer <= 0 && (this.config.isUnlimited || this.ammo > 0);
  }

  fire(originX, originY, aimAngle, isPlayerBullet, combatManager) {
    if (!this.canFire()) return [];

    this.cooldownTimer = this.config.cooldownMs;
    if (!this.config.isUnlimited) {
      this.ammo = Math.max(0, this.ammo - 1);
    }

    const spawnedProjectiles = [];
    const cfg = this.config;

    for (let i = 0; i < cfg.pellets; i++) {
      const angle = aimAngle + (Math.random() - 0.5) * cfg.spread;
      const speed = cfg.speed * (0.95 + Math.random() * 0.1);

      const p = {
        x: originX + Math.cos(angle) * cfg.barrelLength,
        y: originY + Math.sin(angle) * cfg.barrelLength,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: cfg.projectileRadius,
        color: cfg.color,
        glowColor: cfg.glowColor,
        damage: cfg.damage,
        knockback: cfg.knockback,
        isPlayerBullet: isPlayerBullet,
        life: 1.8, // seconds
        prevX: originX,
        prevY: originY
      };

      spawnedProjectiles.push(p);
      combatManager.projectiles.push(p);
    }

    // Play SFX
    if (cfg.id === 'PULSE_BLASTER') {
      combatManager.sfx.playLaser();
    } else if (cfg.id === 'SCATTER_GUN') {
      combatManager.sfx.playShotgun();
    } else {
      combatManager.sfx.playEnemyShot();
    }

    return spawnedProjectiles;
  }

  update(deltaMs) {
    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= deltaMs;
    }
  }
}
