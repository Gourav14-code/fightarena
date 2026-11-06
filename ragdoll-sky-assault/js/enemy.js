/**
 * Enemy System: Scrap Soldier (ground/platform jetpack soldier) and
 * Attack Drone (hovering aerial unit), plus the progressive Wave Spawner.
 */

class ScrapSoldier {
  constructor(game, x, y) {
    this.game = game;
    this.physics = game.physics;
    this.combat = game.combat;
    this.type = 'soldier';

    this.maxHealth = 45;
    this.health = this.maxHealth;
    this.facing = -1;
    this.aimAngle = Math.PI;

    this.isDead = false;
    this.walkSpeed = 3.6;
    this.isGrounded = false;
    this.hitFlashTimer = 0;
    this.walkCycle = 0;

    // AI
    this.aiTimer = 0;
    this.preferredDistance = 280;
    this.fireTimer = 800 + Math.random() * 600;

    // Weapon
    this.weapon = new WeaponInstance('ENEMY_PISTOL');

    // Visuals (Red / Rust hostile)
    this.color = '#181e2b';
    this.accentColor = '#ef4444';

    // Physics body
    this.body = this.physics.createStickmanBody(x, y, false);
    this.body.enemyRef = this;
  }

  checkBulletHit(bullet) {
    if (this.isDead || !this.body) return false;
    const pos = this.body.position;
    return Math.hypot(bullet.x - pos.x, bullet.y - pos.y) < 32;
  }

  takeDamage(amount, bulletVelocity, knockbackForce) {
    if (this.isDead) return;

    this.health -= amount;
    this.hitFlashTimer = 140;

    // Apply knockback impulse
    if (this.body) {
      Matter.Body.setVelocity(this.body, {
        x: this.body.velocity.x + bulletVelocity.x * (knockbackForce * 0.12),
        y: this.body.velocity.y + bulletVelocity.y * (knockbackForce * 0.08) - 2.5
      });
      Matter.Body.setAngularVelocity(this.body, (Math.random() - 0.5) * 0.4);
    }

    if (this.health <= 0) {
      this.die(bulletVelocity);
    }
  }

  die(bulletVelocity) {
    if (this.isDead) return;
    this.isDead = true;

    const pos = this.body.position;
    const facing = this.facing;

    this.physics.removeBody(this.body);
    this.body = null;

    // Spawn floppy ragdoll
    this.physics.createSoldierRagdoll(
      pos.x,
      pos.y,
      facing,
      { x: bulletVelocity.x * 2.2, y: bulletVelocity.y * 2.2 - 3.5 },
      this.color,
      this.accentColor
    );

    // Score & drop chance
    this.game.onEnemyKilled(pos.x, pos.y, 100);
  }

  update(deltaMs) {
    if (this.isDead || !this.body) return;

    const player = this.game.player;
    if (!player || player.isKnockedOut) return;

    this.isGrounded = this.physics.isGrounded(this.body);
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= deltaMs;

    const myPos = this.body.position;
    const pPos = player.body ? player.body.position : { x: player.startX, y: player.startY };

    const dx = pPos.x - myPos.x;
    const dy = pPos.y - myPos.y;
    const distToPlayer = Math.hypot(dx, dy);

    this.facing = dx >= 0 ? 1 : -1;
    this.aimAngle = Math.atan2(dy, dx);

    // AI Movement Behavior
    this.aiTimer -= deltaMs;
    if (this.aiTimer <= 0) {
      this.aiTimer = 180 + Math.random() * 120;

      let moveDir = 0;
      if (distToPlayer > this.preferredDistance + 60) {
        moveDir = this.facing; // Approach
      } else if (distToPlayer < this.preferredDistance - 60) {
        moveDir = -this.facing; // Retreat
      }

      // Jump / Jetpack hop if player is elevated
      if (dy < -80 && this.isGrounded && Math.random() < 0.45) {
        Matter.Body.setVelocity(this.body, {
          x: this.body.velocity.x,
          y: -10.5
        });
      }

      const currentVx = this.body.velocity.x;
      const targetVx = moveDir * this.walkSpeed;
      const newVx = currentVx + (targetVx - currentVx) * 0.22;

      Matter.Body.setVelocity(this.body, {
        x: newVx,
        y: this.body.velocity.y
      });

      if (this.isGrounded && Math.abs(newVx) > 0.4) {
        this.walkCycle += Math.abs(newVx) * 0.06;
      }
    }

    this.physics.applyBalance(this.body, (this.body.velocity.x / this.walkSpeed) * 0.15, 0.08, 0.04);

    // Fire Weapon when in range
    this.weapon.update(deltaMs);
    this.fireTimer -= deltaMs;
    if (this.fireTimer <= 0 && distToPlayer < 650) {
      this.fireTimer = 1100 + Math.random() * 800;
      const shoulderX = myPos.x + 4 * this.facing;
      const shoulderY = myPos.y - 14;
      this.weapon.fire(shoulderX, shoulderY, this.aimAngle, false, this.game.combat);
    }
  }

  draw(ctx, camera) {
    if (this.isDead || !this.body) return;
    if (!camera.isVisible(this.body.position.x, this.body.position.y, 80)) return;

    ctx.save();
    const pos = this.body.position;
    ctx.translate(pos.x, pos.y);
    ctx.rotate(this.body.angle);

    const isFlashing = this.hitFlashTimer > 0;
    this.renderSoldierBody(ctx, isFlashing ? '#ffffff' : this.color);
    ctx.restore();
  }

  renderSoldierBody(ctx, mainColor) {
    const facing = this.facing;

    ctx.strokeStyle = mainColor;
    ctx.fillStyle = mainColor;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';

    const headY = -38;
    const neckY = -22;
    const hipY = 16;

    // Torso
    ctx.beginPath();
    ctx.moveTo(0, neckY);
    ctx.lineTo(0, hipY);
    ctx.stroke();

    // Legs
    const legWalk = Math.sin(this.walkCycle);
    const kneeL = { x: -6 + Math.sin(legWalk * 0.4) * 16, y: hipY + 16 };
    const footL = { x: -6 + Math.sin(legWalk * 0.4) * 32, y: hipY + 32 };
    ctx.beginPath();
    ctx.moveTo(-5, hipY); ctx.lineTo(kneeL.x, kneeL.y); ctx.lineTo(footL.x, footL.y);
    ctx.stroke();

    const kneeR = { x: 6 - Math.sin(legWalk * 0.4) * 16, y: hipY + 16 };
    const footR = { x: 6 - Math.sin(legWalk * 0.4) * 32, y: hipY + 32 };
    ctx.beginPath();
    ctx.moveTo(5, hipY); ctx.lineTo(kneeR.x, kneeR.y); ctx.lineTo(footR.x, footR.y);
    ctx.stroke();

    // Head
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.arc(0, headY, 13, 0, Math.PI * 2);
    ctx.fill();

    // Red visor
    ctx.strokeStyle = this.accentColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-4 * facing, headY);
    ctx.lineTo(11 * facing, headY);
    ctx.stroke();

    // Gun Arm
    ctx.save();
    ctx.translate(4 * facing, neckY + 4);
    ctx.rotate(this.aimAngle - this.body.angle);

    ctx.fillStyle = '#334155';
    ctx.fillRect(4, -3.5, 18, 7);
    ctx.strokeStyle = this.accentColor;
    ctx.strokeRect(4, -3.5, 18, 7);
    ctx.restore();
  }
}

class AttackDrone {
  constructor(game, x, y) {
    this.game = game;
    this.physics = game.physics;
    this.combat = game.combat;
    this.type = 'drone';

    this.maxHealth = 28;
    this.health = this.maxHealth;

    this.isDead = false;
    this.hitFlashTimer = 0;
    this.hoverTime = Math.random() * 10;
    this.fireTimer = 1200 + Math.random() * 800;

    this.weapon = new WeaponInstance('DRONE_BLASTER');

    // Physics body
    this.body = this.physics.createDroneBody(x, y);
    this.body.enemyRef = this;
  }

  checkBulletHit(bullet) {
    if (this.isDead || !this.body) return false;
    const pos = this.body.position;
    return Math.hypot(bullet.x - pos.x, bullet.y - pos.y) < 26;
  }

  takeDamage(amount, bulletVelocity, knockbackForce) {
    if (this.isDead) return;

    this.health -= amount;
    this.hitFlashTimer = 140;

    if (this.body) {
      Matter.Body.setVelocity(this.body, {
        x: this.body.velocity.x + bulletVelocity.x * (knockbackForce * 0.16),
        y: this.body.velocity.y + bulletVelocity.y * (knockbackForce * 0.12)
      });
    }

    if (this.health <= 0) {
      this.die(bulletVelocity);
    }
  }

  die(bulletVelocity) {
    if (this.isDead) return;
    this.isDead = true;

    const pos = this.body.position;
    this.physics.removeBody(this.body);
    this.body = null;

    // Explode into kinetic debris
    this.physics.createDroneDebris(pos.x, pos.y, {
      x: bulletVelocity.x * 2.0,
      y: bulletVelocity.y * 2.0 - 2
    });

    this.combat.sfx.playExplosion();
    this.game.addScreenShake(8);

    // Score & drop chance
    this.game.onEnemyKilled(pos.x, pos.y, 150);
  }

  update(deltaMs) {
    if (this.isDead || !this.body) return;

    const player = this.game.player;
    if (!player || player.isKnockedOut) return;

    const deltaSec = deltaMs / 1000;
    this.hoverTime += deltaSec * 3.5;
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= deltaMs;

    const pos = this.body.position;
    const pPos = player.body ? player.body.position : { x: player.startX, y: player.startY };

    // Floating sinusoidal flight path
    const targetY = pPos.y - 120 + Math.sin(this.hoverTime) * 60;
    const targetX = pPos.x + (pos.x >= pPos.x ? 240 : -240);

    const steerX = (targetX - pos.x) * 0.025;
    const steerY = (targetY - pos.y) * 0.025;

    Matter.Body.setVelocity(this.body, {
      x: this.body.velocity.x + steerX,
      y: this.body.velocity.y + steerY
    });

    // Drone firing logic
    this.weapon.update(deltaMs);
    this.fireTimer -= deltaMs;

    const dist = Math.hypot(pPos.x - pos.x, pPos.y - pos.y);
    if (this.fireTimer <= 0 && dist < 600) {
      this.fireTimer = 1600 + Math.random() * 600;
      const aim = Math.atan2(pPos.y - pos.y, pPos.x - pos.x);
      this.weapon.fire(pos.x, pos.y, aim, false, this.game.combat);
    }
  }

  draw(ctx, camera) {
    if (this.isDead || !this.body) return;
    if (!camera.isVisible(this.body.position.x, this.body.position.y, 60)) return;

    ctx.save();
    const pos = this.body.position;
    ctx.translate(pos.x, pos.y);
    ctx.rotate(this.body.angle);

    const isFlashing = this.hitFlashTimer > 0;

    // Drone chassis (Aerodynamic octagonal shell)
    ctx.fillStyle = isFlashing ? '#ffffff' : '#1e293b';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Twin side thruster pods
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-24, -6, 8, 12);
    ctx.fillRect(16, -6, 8, 12);

    // Glowing crimson central sensor lens
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();
  }
}

class EnemyWaveManager {
  constructor(game) {
    this.game = game;
    this.currentWave = 1;
    this.waveSpawnTimer = 0;
    this.enemiesSpawnedThisWave = 0;
    this.waveTotalEnemies = 6;
  }

  update(deltaMs) {
    const player = this.game.player;
    if (!player || player.isKnockedOut) return;

    // Count alive enemies
    const aliveEnemies = this.game.enemies.filter(e => !e.isDead);

    // Spawn next enemy if quota not reached
    if (this.enemiesSpawnedThisWave < this.waveTotalEnemies) {
      this.waveSpawnTimer -= deltaMs;
      if (this.waveSpawnTimer <= 0) {
        this.waveSpawnTimer = 1600 + Math.random() * 1200;
        this.spawnEnemyAhead(player);
        this.enemiesSpawnedThisWave++;
      }
    } else if (aliveEnemies.length === 0) {
      // Wave Cleared! Advance to next wave
      this.advanceWave();
    }
  }

  spawnEnemyAhead(player) {
    const pPos = player.body ? player.body.position : { x: player.startX, y: player.startY };
    const levelWidth = this.game.level.width;

    // Spawn 700 to 1100 px ahead of player
    let spawnX = pPos.x + 750 + Math.random() * 350;
    if (spawnX > levelWidth - 100) {
      spawnX = pPos.x - 750 - Math.random() * 200; // Spawn behind if near end
    }

    const isDrone = Math.random() < (0.35 + this.currentWave * 0.08);

    if (isDrone) {
      const spawnY = Math.max(250, pPos.y - 200 + (Math.random() - 0.5) * 200);
      const drone = new AttackDrone(this.game, spawnX, spawnY);
      this.game.enemies.push(drone);
    } else {
      // Soldier spawns near ground or platform
      const spawnY = Math.min(this.game.physics.groundY - 60, Math.max(500, pPos.y));
      const soldier = new ScrapSoldier(this.game, spawnX, spawnY);
      this.game.enemies.push(soldier);
    }
  }

  advanceWave() {
    this.currentWave++;
    this.enemiesSpawnedThisWave = 0;
    this.waveTotalEnemies = 6 + this.currentWave * 3;
    this.waveSpawnTimer = 2200;

    if (this.game.ui) {
      this.game.ui.updateWaveBadge(this.currentWave);
    }
  }

  reset() {
    this.currentWave = 1;
    this.enemiesSpawnedThisWave = 0;
    this.waveTotalEnemies = 6;
    this.waveSpawnTimer = 1200;
  }
}
