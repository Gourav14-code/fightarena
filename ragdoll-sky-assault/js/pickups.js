/**
 * Pickup system: dropped weapons from enemies, physics falling/resting on platforms,
 * floating bob animation, proximity detection, and player collection.
 */
class PickupManager {
  constructor(game) {
    this.game = game;
    this.pickups = [];
    this.sparkles = [];
  }

  spawnWeaponPickup(x, y, weaponTypeKey = 'SCATTER_GUN') {
    const p = {
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 4,
      vy: -5.0, // Pop up slightly
      weaponKey: weaponTypeKey,
      weaponConfig: WEAPON_TYPES[weaponTypeKey],
      radius: 16,
      bobTime: Math.random() * 10,
      isGrounded: false,
      life: 30.0 // Despawn after 30 seconds
    };
    this.pickups.push(p);
  }

  update(deltaMs) {
    const deltaSec = deltaMs / 1000;
    const physics = this.game.physics;
    const player = this.game.player;

    let nearestPickupToPlayer = null;
    let minDistance = 75;

    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      p.life -= deltaSec;
      p.bobTime += deltaSec * 3;

      if (p.life <= 0) {
        this.pickups.splice(i, 1);
        continue;
      }

      // Physics falling until on ground/platform
      if (!p.isGrounded) {
        p.vy += 0.45; // Gravity
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;

        // Check ground
        if (p.y >= physics.groundY - 14) {
          p.y = physics.groundY - 14;
          p.isGrounded = true;
          p.vy = 0;
          p.vx = 0;
        }

        // Check platforms
        for (let j = 0; j < physics.platforms.length; j++) {
          const plat = physics.platforms[j];
          const top = plat.position.y - 12;
          const left = plat.position.x - 120;
          const right = plat.position.x + 120;

          if (p.x >= left && p.x <= right && p.y >= top - 12 && p.y <= top + 10 && p.vy >= 0) {
            p.y = top - 12;
            p.isGrounded = true;
            p.vy = 0;
            p.vx = 0;
            break;
          }
        }
      }

      // Check proximity to player
      if (player && !player.isKnockedOut) {
        const pPos = player.body.position;
        const dist = Math.hypot(p.x - pPos.x, p.y - pPos.y);
        if (dist < minDistance) {
          nearestPickupToPlayer = p;
        }
      }
    }

    // Update active prompt
    this.activePromptPickup = nearestPickupToPlayer;

    // Update sparkles
    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const s = this.sparkles[i];
      s.x += s.vx;
      s.y += s.vy;
      s.alpha -= 0.04;
      if (s.alpha <= 0) {
        this.sparkles.splice(i, 1);
      }
    }
  }

  collectNearest(player) {
    if (!this.activePromptPickup || !player) return false;

    const p = this.activePromptPickup;
    player.equipWeapon(p.weaponKey);

    // Spawn pickup sparkles
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 5 + 2;
      this.sparkles.push({
        x: p.x,
        y: p.y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        radius: Math.random() * 3 + 1.5,
        color: '#fbbf24',
        alpha: 1.0
      });
    }

    this.game.combat.sfx.playPickup();

    // Remove from array
    const idx = this.pickups.indexOf(p);
    if (idx !== -1) {
      this.pickups.splice(idx, 1);
    }
    this.activePromptPickup = null;
    return true;
  }

  draw(ctx, camera) {
    ctx.save();

    for (let i = 0; i < this.pickups.length; i++) {
      const p = this.pickups[i];
      if (!camera.isVisible(p.x, p.y, 40)) continue;

      const bobY = p.isGrounded ? Math.sin(p.bobTime) * 4 : 0;
      const drawY = p.y + bobY;

      // Outer glow pulse
      ctx.shadowColor = p.weaponConfig.color;
      ctx.shadowBlur = 14;

      // Crate / Pod background
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = p.weaponConfig.color;
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.roundRect(p.x - 16, drawY - 14, 32, 28, 6);
      ctx.fill();
      ctx.stroke();

      // Weapon Icon / Symbol
      ctx.shadowBlur = 0;
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.weaponConfig.icon, p.x, drawY);

      // "WEAPON" label tag
      ctx.font = '900 8px sans-serif';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText('WEAPON', p.x, drawY + 22);
    }

    // Render collection sparkles
    for (let i = 0; i < this.sparkles.length; i++) {
      const s = this.sparkles[i];
      if (!camera.isVisible(s.x, s.y, 20)) continue;
      ctx.globalAlpha = Math.max(0, s.alpha);
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  reset() {
    this.pickups = [];
    this.sparkles = [];
    this.activePromptPickup = null;
  }
}
