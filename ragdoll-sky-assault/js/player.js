/**
 * Player Stickman Soldier: jetpack integration, mouse-driven 360-degree aiming,
 * aerial flight physics, weapon firing, directional dashing, and damage reactions.
 */
class Player {
  constructor(game, x = 250, y = 1150) {
    this.game = game;
    this.physics = game.physics;
    this.combat = game.combat;

    this.startX = x;
    this.startY = y;

    this.maxHealth = 100;
    this.health = this.maxHealth;

    this.facing = 1;
    this.aimAngle = 0;

    // Movement speeds
    this.moveSpeed = 6.2;
    this.isGrounded = false;

    // Jetpack system
    this.jetpack = new Jetpack(this);

    // Weapons
    this.activeWeapon = new WeaponInstance('PULSE_BLASTER');

    // States
    this.isDodging = false;
    this.dodgeDuration = 220;
    this.dodgeTimer = 0;
    this.hitFlashTimer = 0;
    this.isKnockedOut = false;
    this.ragdoll = null;

    // Visuals
    this.color = '#0b0f19'; // Deep black stickman
    this.accentColor = '#38bdf8'; // Glowing cyan tactical visor
    this.walkCycle = 0;

    // Create Matter.js physics body
    this.body = this.physics.createStickmanBody(x, y, true);
    this.body.playerRef = this;
  }

  equipWeapon(weaponTypeKey) {
    this.activeWeapon = new WeaponInstance(weaponTypeKey);
    if (this.game.ui) {
      this.game.ui.updateWeaponDisplay(this.activeWeapon);
    }
  }

  checkBulletHit(bullet) {
    if (!this.body || this.isKnockedOut) return false;
    const pos = this.body.position;
    // Torso & head capsule check
    const dist = Math.hypot(bullet.x - pos.x, bullet.y - pos.y);
    return dist < 32;
  }

  takeDamage(amount, knockbackVel) {
    if (this.isKnockedOut || this.isDodging) return;

    this.health = Math.max(0, this.health - amount);
    this.hitFlashTimer = 160;

    if (this.body) {
      Matter.Body.setVelocity(this.body, {
        x: this.body.velocity.x + knockbackVel.x,
        y: this.body.velocity.y + knockbackVel.y
      });
      Matter.Body.setAngularVelocity(this.body, (Math.random() - 0.5) * 0.35);
    }

    if (this.health <= 0) {
      this.triggerKnockout(knockbackVel);
    }

    if (this.game.ui) {
      this.game.ui.updateHealth();
    }
  }

  triggerKnockout(impulse) {
    if (this.isKnockedOut) return;
    this.isKnockedOut = true;

    const pos = this.body.position;
    const facing = this.facing;

    this.physics.removeBody(this.body);
    this.body = null;

    this.ragdoll = this.physics.createSoldierRagdoll(
      pos.x,
      pos.y,
      facing,
      { x: impulse.x * 2.5, y: impulse.y * 2.5 - 4 },
      this.color,
      this.accentColor
    );

    this.game.combat.sfx.playExplosion();
    this.game.onPlayerDefeated();
  }

  update(deltaMs) {
    if (this.isKnockedOut) return;

    const keys = this.game.inputKeys;
    const mouse = this.game.mouse;
    const camera = this.game.camera;

    this.isGrounded = this.physics.isGrounded(this.body);

    if (this.hitFlashTimer > 0) this.hitFlashTimer -= deltaMs;

    // 1. Aim calculations
    const pos = this.body.position;
    const shoulderX = pos.x + 4 * this.facing;
    const shoulderY = pos.y - 14;

    const worldMouse = camera.screenToWorld(mouse.x, mouse.y);
    this.aimAngle = Math.atan2(worldMouse.y - shoulderY, worldMouse.x - shoulderX);
    this.facing = worldMouse.x >= pos.x ? 1 : -1;

    // 2. Jetpack Thrust (SPACE)
    if (keys['Space']) {
      this.jetpack.thrust(deltaMs);
    } else {
      this.jetpack.stopThrust();
    }
    this.jetpack.update(deltaMs);

    // 3. Dash (SHIFT)
    if (this.isDodging) {
      this.dodgeTimer -= deltaMs;
      if (this.dodgeTimer <= 0) {
        this.isDodging = false;
      }
    }

    // 4. Horizontal Movement (A / D)
    if (!this.isDodging) {
      let moveDir = 0;
      if (keys['KeyA']) moveDir -= 1;
      if (keys['KeyD']) moveDir += 1;

      const currentVx = this.body.velocity.x;
      const targetVx = moveDir * this.moveSpeed;
      const blendRate = this.isGrounded ? 0.28 : 0.12; // Lower air friction
      const newVx = currentVx + (targetVx - currentVx) * blendRate;

      Matter.Body.setVelocity(this.body, {
        x: newVx,
        y: this.body.velocity.y
      });

      // Walk cycle
      if (this.isGrounded && Math.abs(newVx) > 0.4) {
        this.walkCycle += Math.abs(newVx) * 0.06;
      } else {
        this.walkCycle *= 0.8;
      }

      // Dynamic tilt based on horizontal velocity and aim
      let targetLean = (newVx / this.moveSpeed) * 0.18;
      if (!this.isGrounded) {
        targetLean += (this.body.velocity.y * 0.02) * this.facing;
      }
      this.physics.applyBalance(this.body, targetLean, 0.09, 0.04);
    }

    // 5. Weapon Fire & Auto-Revert on Ammo Depletion
    this.activeWeapon.update(deltaMs);

    if (mouse.isDown && !this.isDodging) {
      const fired = this.activeWeapon.fire(shoulderX, shoulderY, this.aimAngle, true, this.combat);
      if (fired.length > 0) {
        this.game.addScreenShake(this.activeWeapon.config.screenShake);

        // Check if limited ammo ran out
        if (!this.activeWeapon.config.isUnlimited && this.activeWeapon.ammo <= 0) {
          this.equipWeapon('PULSE_BLASTER');
        }
      }
    }

    // Update UI
    if (this.game.ui) {
      this.game.ui.updateFuel(this.jetpack.fuel);
      this.game.ui.updateWeaponDisplay(this.activeWeapon);
    }
  }

  handleKeyDown(code) {
    if (this.isKnockedOut) return;

    if (code === 'ShiftLeft' || code === 'ShiftRight') {
      const keys = this.game.inputKeys;
      let dirX = this.facing;
      if (keys['KeyA']) dirX = -1;
      if (keys['KeyD']) dirX = 1;
      let dirY = keys['Space'] ? -1 : 0;

      if (this.jetpack.dash(dirX, dirY)) {
        this.isDodging = true;
        this.dodgeTimer = this.dodgeDuration;
        this.game.combat.sfx.playDash();
      }
    } else if (code === 'KeyE') {
      // Collect pickup
      this.game.pickups.collectNearest(this);
    }
  }

  draw(ctx, camera) {
    if (this.isKnockedOut) return;
    if (!this.body) return;

    // Draw Jetpack Exhaust in World
    this.jetpack.draw(ctx, camera);

    const pos = this.body.position;
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(this.body.angle);

    const isFlashing = this.hitFlashTimer > 0;
    this.renderStickman(ctx, isFlashing ? '#ffffff' : this.color);
    ctx.restore();

    // Render Aim Laser Sight / Reticle
    this.renderAimReticle(ctx, camera);
  }

  renderStickman(ctx, mainColor) {
    const facing = this.facing;

    ctx.strokeStyle = mainColor;
    ctx.fillStyle = mainColor;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const headY = -38;
    const neckY = -22;
    const hipY = 16;

    // 1. Jetpack Backpack Unit
    const packX = -14 * facing;
    const packY = neckY + 4;
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.fillRect(packX - 6, packY - 14, 12, 28);
    ctx.strokeRect(packX - 6, packY - 14, 12, 28);

    // Thruster Nozzle
    ctx.fillStyle = '#0ea5e9';
    ctx.beginPath();
    ctx.moveTo(packX - 4, packY + 14);
    ctx.lineTo(packX + 4, packY + 14);
    ctx.lineTo(packX + 6, packY + 22);
    ctx.lineTo(packX - 6, packY + 22);
    ctx.closePath();
    ctx.fill();

    // 2. Spine & Torso
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, neckY);
    ctx.lineTo(0, hipY);
    ctx.stroke();

    // 3. Legs
    if (this.isGrounded) {
      const legWalk = Math.sin(this.walkCycle);
      const kneeL = { x: -6 + Math.sin(legWalk * 0.4) * 18, y: hipY + 16 };
      const footL = { x: -6 + Math.sin(legWalk * 0.4) * 34, y: hipY + 34 };
      ctx.beginPath();
      ctx.moveTo(-5, hipY); ctx.lineTo(kneeL.x, kneeL.y); ctx.lineTo(footL.x, footL.y);
      ctx.stroke();

      const kneeR = { x: 6 - Math.sin(legWalk * 0.4) * 18, y: hipY + 16 };
      const footR = { x: 6 - Math.sin(legWalk * 0.4) * 34, y: hipY + 34 };
      ctx.beginPath();
      ctx.moveTo(5, hipY); ctx.lineTo(kneeR.x, kneeR.y); ctx.lineTo(footR.x, footR.y);
      ctx.stroke();
    } else {
      // Aerial flying legs (trailing slightly behind)
      const trailAngle = -0.35 * facing;
      ctx.beginPath();
      ctx.moveTo(-4, hipY);
      ctx.lineTo(-4 + Math.sin(trailAngle) * 20, hipY + 18);
      ctx.lineTo(-4 + Math.sin(trailAngle) * 36, hipY + 34);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(4, hipY);
      ctx.lineTo(4 + Math.sin(trailAngle) * 18, hipY + 20);
      ctx.lineTo(4 + Math.sin(trailAngle) * 34, hipY + 36);
      ctx.stroke();
    }

    // 4. Head
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.arc(0, headY, 14, 0, Math.PI * 2);
    ctx.fill();

    // Cyan glowing visor
    ctx.strokeStyle = this.accentColor;
    ctx.lineWidth = 3.5;
    ctx.shadowColor = this.accentColor;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(-4 * facing, headY);
    ctx.lineTo(12 * facing, headY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 5. Weapon Arm (Aiming at crosshair)
    this.renderWeaponArm(ctx, neckY, facing);
  }

  renderWeaponArm(ctx, neckY, facing) {
    const shoulderX = 4 * facing;
    const shoulderY = neckY + 4;

    ctx.save();
    ctx.translate(shoulderX, shoulderY);

    // Normalize aim angle relative to player body rotation
    const localAim = this.aimAngle - this.body.angle;
    ctx.rotate(localAim);

    // Weapon barrel
    const cfg = this.activeWeapon.config;
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = cfg.color;
    ctx.lineWidth = 2;

    ctx.fillRect(4, -5, cfg.barrelLength, 9);
    ctx.strokeRect(4, -5, cfg.barrelLength, 9);

    // Glowing energy core on gun
    ctx.fillStyle = cfg.color;
    ctx.fillRect(10, -2, 10, 4);

    // Forearm & Hands holding the grip
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.lineTo(8, 0);
    ctx.stroke();

    ctx.restore();
  }

  renderAimReticle(ctx, camera) {
    const mouse = this.game.mouse;
    const worldMouse = camera.screenToWorld(mouse.x, mouse.y);

    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;

    // Outer aiming ring
    ctx.beginPath();
    ctx.arc(worldMouse.x, worldMouse.y, 10, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshair ticks
    ctx.beginPath();
    ctx.moveTo(worldMouse.x - 15, worldMouse.y); ctx.lineTo(worldMouse.x - 6, worldMouse.y);
    ctx.moveTo(worldMouse.x + 6, worldMouse.y); ctx.lineTo(worldMouse.x + 15, worldMouse.y);
    ctx.moveTo(worldMouse.x, worldMouse.y - 15); ctx.lineTo(worldMouse.x, worldMouse.y - 6);
    ctx.moveTo(worldMouse.x, worldMouse.y + 6); ctx.lineTo(worldMouse.x, worldMouse.y + 15);
    ctx.stroke();

    ctx.restore();
  }
}
