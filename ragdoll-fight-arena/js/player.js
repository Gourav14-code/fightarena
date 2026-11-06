/**
 * Player Stickman entity: controls, physics interactions, animations,
 * combat moves (normal/heavy punch, dodge roll/dash), and ragdoll conversion.
 */
class Player {
  constructor(game, x = 360, y = 520) {
    this.game = game;
    this.physics = game.physics;
    this.combat = game.combat;

    this.startX = x;
    this.startY = y;

    this.maxHealth = 100;
    this.health = this.maxHealth;

    this.facing = 1; // 1 = right, -1 = left
    this.walkSpeed = 5.8;
    this.jumpForce = -13.8;

    // Visual styles
    this.color = '#0f172a'; // Deep black stickman
    this.accentColor = '#38bdf8'; // Cyan boxing gloves & visor
    this.glowColor = 'rgba(56, 189, 248, 0.4)';

    // State
    this.isGrounded = false;
    this.currentAttack = null;
    this.attackCooldownTimer = 0;

    this.isDodging = false;
    this.dodgeTimer = 0;
    this.dodgeDuration = 220; // ms
    this.dodgeCooldownTimer = 0;
    this.dodgeCooldown = 650; // ms
    this.isInvulnerable = false;
    this.dodgeDir = 1;
    this.dodgeGhosts = [];

    this.hitStunTimer = 0;
    this.isKnockedOut = false;
    this.ragdoll = null;

    // Animation timers
    this.walkCycle = 0;
    this.hitFlashTimer = 0;

    // Create Matter.js physics body
    this.body = this.physics.createFighterBody(x, y, true);
    this.body.fighterRef = this;
  }

  handleKeyDown(code) {
    if (this.isKnockedOut || this.hitStunTimer > 0) return;

    if (code === 'KeyJ') {
      this.initiateAttack('NORMAL');
    } else if (code === 'KeyK') {
      this.initiateAttack('HEAVY');
    } else if (code === 'KeyL') {
      this.initiateDodge();
    } else if (code === 'Space') {
      this.jump();
    }
  }

  jump() {
    if (this.isGrounded && !this.isDodging) {
      Matter.Body.setVelocity(this.body, {
        x: this.body.velocity.x,
        y: this.jumpForce
      });
      this.physics.applyBalance(this.body, 0, 0.2, 0.05);
    }
  }

  initiateAttack(type) {
    if (this.currentAttack || this.attackCooldownTimer > 0 || this.isDodging) return;

    const config = this.combat.ATTACKS[type];
    if (!config) return;

    this.currentAttack = {
      type: type,
      config: config,
      phase: 'windup', // 'windup' -> 'active' -> 'recovery'
      timer: 0,
      active: false,
      hasHit: false,
      id: this.combat.generateAttackId()
    };

    this.combat.sfx.playWhoosh(type === 'HEAVY' ? 0.8 : 1.1);
  }

  initiateDodge() {
    if (this.isDodging || this.dodgeCooldownTimer > 0 || this.currentAttack) return;

    this.isDodging = true;
    this.dodgeTimer = this.dodgeDuration;
    this.dodgeCooldownTimer = this.dodgeCooldown;
    this.isInvulnerable = true;

    // Dodge in current move direction, or facing direction
    const keys = this.game.inputKeys;
    let dir = this.facing;
    if (keys['KeyA']) dir = -1;
    if (keys['KeyD']) dir = 1;
    this.dodgeDir = dir;

    Matter.Body.setVelocity(this.body, {
      x: dir * 13.5,
      y: Math.min(this.body.velocity.y, -2)
    });

    this.combat.sfx.playDodge();
  }

  applyHitStun(durationMs, hitFromFacing, isHeavy) {
    this.hitStunTimer = durationMs;
    this.hitFlashTimer = 140;
    this.currentAttack = null; // Interrupt ongoing attack
    this.isDodging = false;
    this.isInvulnerable = false;
  }

  triggerKnockout(impulse, isHeavy) {
    if (this.isKnockedOut) return;
    this.isKnockedOut = true;
    this.currentAttack = null;
    this.isDodging = false;

    const x = this.body.position.x;
    const y = this.body.position.y;
    const facing = this.facing;

    // Remove active fighting body
    this.physics.removeBody(this.body);
    this.body = null;

    // Create floppy multi-joint ragdoll with knockout physics
    this.ragdoll = this.physics.createRagdoll(
      x,
      y,
      facing,
      impulse,
      this.color,
      this.accentColor
    );
  }

  update(deltaMs) {
    if (this.isKnockedOut) return;

    const deltaSec = deltaMs / 1000;
    this.isGrounded = this.physics.isGrounded(this.body);

    // Timers
    if (this.attackCooldownTimer > 0) this.attackCooldownTimer -= deltaMs;
    if (this.dodgeCooldownTimer > 0) this.dodgeCooldownTimer -= deltaMs;
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= deltaMs;

    if (this.hitStunTimer > 0) {
      this.hitStunTimer -= deltaMs;
      // Reeling balance during hit stun
      this.physics.applyBalance(this.body, -0.35 * this.facing, 0.08, 0.05);
      return;
    }

    // Update Dodge
    if (this.isDodging) {
      this.dodgeTimer -= deltaMs;
      // Spawn dodge ghost trail
      if (Math.random() < 0.45) {
        this.dodgeGhosts.push({
          x: this.body.position.x,
          y: this.body.position.y,
          angle: this.body.angle,
          facing: this.facing,
          alpha: 0.6
        });
      }

      // Invulnerability window (first 75% of dodge)
      this.isInvulnerable = this.dodgeTimer > this.dodgeDuration * 0.25;

      if (this.dodgeTimer <= 0) {
        this.isDodging = false;
        this.isInvulnerable = false;
      }
    }

    // Decay ghost trails
    for (let i = this.dodgeGhosts.length - 1; i >= 0; i--) {
      this.dodgeGhosts[i].alpha -= deltaMs * 0.003;
      if (this.dodgeGhosts[i].alpha <= 0) {
        this.dodgeGhosts.splice(i, 1);
      }
    }

    // Attack state machine
    if (this.currentAttack) {
      this.updateAttack(deltaMs);
    }

    // Horizontal Movement
    if (!this.isDodging) {
      let moveDir = 0;
      const keys = this.game.inputKeys;
      if (keys['KeyA']) moveDir -= 1;
      if (keys['KeyD']) moveDir += 1;

      // Auto face opponent when not attacking
      if (!this.currentAttack && this.game.enemy && !this.game.enemy.isKnockedOut) {
        const enemyX = this.game.enemy.getX();
        this.facing = enemyX > this.body.position.x ? 1 : -1;
      } else if (moveDir !== 0 && !this.currentAttack) {
        this.facing = moveDir;
      }

      let targetVx = moveDir * this.walkSpeed;
      if (this.currentAttack) {
        // Reduced movement during punch
        targetVx *= 0.25;
      }

      // Smooth horizontal velocity blending
      const currentVx = this.body.velocity.x;
      const newVx = currentVx + (targetVx - currentVx) * 0.28;
      Matter.Body.setVelocity(this.body, {
        x: newVx,
        y: this.body.velocity.y
      });

      // Animate walk cycle
      if (Math.abs(newVx) > 0.4 && this.isGrounded) {
        this.walkCycle += Math.abs(newVx) * 0.06;
      } else {
        this.walkCycle *= 0.8;
      }

      // Upright balance torque
      let targetLean = (newVx / this.walkSpeed) * 0.14 * this.facing;
      if (this.currentAttack && this.currentAttack.phase === 'active') {
        targetLean += 0.18 * this.facing; // Lean forward during punch
      }
      this.physics.applyBalance(this.body, targetLean, 0.1, 0.045);
    }
  }

  updateAttack(deltaMs) {
    const atk = this.currentAttack;
    const cfg = atk.config;
    atk.timer += deltaMs;

    if (atk.phase === 'windup') {
      atk.active = false;
      if (atk.timer >= cfg.windupMs) {
        atk.phase = 'active';
        atk.active = true;
        atk.timer = 0;
      }
    } else if (atk.phase === 'active') {
      atk.active = true;
      if (atk.timer >= cfg.activeMs) {
        atk.phase = 'recovery';
        atk.active = false;
        atk.timer = 0;
      }
    } else if (atk.phase === 'recovery') {
      atk.active = false;
      if (atk.timer >= cfg.recoveryMs) {
        // Attack completed
        this.attackCooldownTimer = cfg.cooldownMs;
        this.currentAttack = null;
      }
    }
  }

  getX() {
    return this.isKnockedOut ? (this.ragdoll ? this.ragdoll.torso.position.x : this.startX) : this.body.position.x;
  }

  getY() {
    return this.isKnockedOut ? (this.ragdoll ? this.ragdoll.torso.position.y : this.startY) : this.body.position.y;
  }

  getFistWorldPosition() {
    if (this.isKnockedOut || !this.body) return { x: 0, y: 0 };

    const pos = this.body.position;
    const facing = this.facing;
    let reach = 22;

    if (this.currentAttack) {
      const cfg = this.currentAttack.config;
      if (this.currentAttack.phase === 'windup') {
        const progress = this.currentAttack.timer / cfg.windupMs;
        reach = -10 + progress * 10; // Pull fist back
      } else if (this.currentAttack.phase === 'active') {
        const progress = this.currentAttack.timer / cfg.activeMs;
        reach = cfg.reach * Math.sin(progress * Math.PI * 0.5); // Thrust forward
      } else if (this.currentAttack.phase === 'recovery') {
        const progress = this.currentAttack.timer / cfg.recoveryMs;
        reach = cfg.reach * (1 - progress); // Retract
      }
    }

    const shoulderX = pos.x + 8 * facing;
    const shoulderY = pos.y - 18;

    return {
      x: shoulderX + reach * facing,
      y: shoulderY + 4
    };
  }

  draw(ctx) {
    if (this.isKnockedOut && this.ragdoll) {
      this.drawRagdoll(ctx);
      return;
    }

    if (!this.body) return;

    // Draw dodge ghost echoes
    for (let i = 0; i < this.dodgeGhosts.length; i++) {
      const g = this.dodgeGhosts[i];
      ctx.save();
      ctx.globalAlpha = g.alpha * 0.4;
      ctx.translate(g.x, g.y);
      ctx.rotate(g.angle);
      this.renderStickmanBody(ctx, g.facing, null, true);
      ctx.restore();
    }

    // Draw active stickman
    ctx.save();
    const pos = this.body.position;
    ctx.translate(pos.x, pos.y);
    ctx.rotate(this.body.angle);

    // Hit flash tint
    const isFlashing = this.hitFlashTimer > 0;
    this.renderStickmanBody(ctx, this.facing, isFlashing ? '#ef4444' : null, false);
    ctx.restore();
  }

  renderStickmanBody(ctx, facing, overrideColor = null, isGhost = false) {
    const mainColor = overrideColor || this.color;
    const gloveColor = this.accentColor;

    ctx.strokeStyle = mainColor;
    ctx.fillStyle = mainColor;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 1. Torso & Spine
    const headY = -42;
    const neckY = -24;
    const hipY = 18;

    ctx.beginPath();
    ctx.moveTo(0, neckY);
    ctx.lineTo(0, hipY);
    ctx.stroke();

    // 2. Legs & Feet
    const legWalk = Math.sin(this.walkCycle);
    const leftHipAngle = legWalk * 0.45;
    const rightHipAngle = -legWalk * 0.45;

    // Left Leg
    const kneeL = { x: -6 + Math.sin(leftHipAngle) * 20, y: hipY + 18 };
    const footL = { x: -6 + Math.sin(leftHipAngle) * 36, y: hipY + 36 };
    ctx.beginPath();
    ctx.moveTo(-5, hipY);
    ctx.lineTo(kneeL.x, kneeL.y);
    ctx.lineTo(footL.x, footL.y);
    ctx.stroke();

    // Right Leg
    const kneeR = { x: 6 + Math.sin(rightHipAngle) * 20, y: hipY + 18 };
    const footR = { x: 6 + Math.sin(rightHipAngle) * 36, y: hipY + 36 };
    ctx.beginPath();
    ctx.moveTo(5, hipY);
    ctx.lineTo(kneeR.x, kneeR.y);
    ctx.lineTo(footR.x, footR.y);
    ctx.stroke();

    // 3. Back Arm (Guard Arm)
    const guardShoulder = { x: -6 * facing, y: neckY + 4 };
    const guardElbow = { x: -14 * facing, y: neckY + 16 };
    const guardFist = { x: 4 * facing, y: neckY + 8 };

    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(guardShoulder.x, guardShoulder.y);
    ctx.lineTo(guardElbow.x, guardElbow.y);
    ctx.lineTo(guardFist.x, guardFist.y);
    ctx.stroke();

    // Back Glove
    ctx.fillStyle = gloveColor;
    ctx.beginPath();
    ctx.arc(guardFist.x, guardFist.y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 4. Punching / Front Arm
    let fistPosLocal = { x: 18 * facing, y: neckY + 12 };
    let elbowPosLocal = { x: 8 * facing, y: neckY + 20 };

    if (this.currentAttack) {
      const cfg = this.currentAttack.config;
      let reach = 18;
      if (this.currentAttack.phase === 'windup') {
        const p = this.currentAttack.timer / cfg.windupMs;
        reach = -12 * (1 - p);
        elbowPosLocal = { x: -14 * facing, y: neckY + 18 };
      } else if (this.currentAttack.phase === 'active') {
        const p = this.currentAttack.timer / cfg.activeMs;
        reach = cfg.reach;
        elbowPosLocal = { x: (reach * 0.5) * facing, y: neckY + 8 };
      } else if (this.currentAttack.phase === 'recovery') {
        const p = this.currentAttack.timer / cfg.recoveryMs;
        reach = cfg.reach * (1 - p * 0.7);
        elbowPosLocal = { x: (reach * 0.4) * facing, y: neckY + 14 };
      }
      fistPosLocal = { x: (8 + reach) * facing, y: neckY + 8 };
    }

    const frontShoulder = { x: 6 * facing, y: neckY + 4 };
    ctx.lineWidth = 5;
    ctx.strokeStyle = mainColor;
    ctx.beginPath();
    ctx.moveTo(frontShoulder.x, frontShoulder.y);
    ctx.lineTo(elbowPosLocal.x, elbowPosLocal.y);
    ctx.lineTo(fistPosLocal.x, fistPosLocal.y);
    ctx.stroke();

    // Front Boxing Glove (Large, stylized arcade boxing glove)
    const gloveRadius = this.currentAttack && this.currentAttack.type === 'HEAVY' ? 16 : 13;
    ctx.fillStyle = gloveColor;
    ctx.beginPath();
    ctx.arc(fistPosLocal.x, fistPosLocal.y, gloveRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Glove cuff stripe
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(fistPosLocal.x - 3 * facing, fistPosLocal.y, gloveRadius - 2, 0, Math.PI * 2);
    ctx.stroke();

    // 5. Head
    ctx.fillStyle = mainColor;
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#020617';
    ctx.beginPath();
    ctx.arc(0, headY, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Expressive glowing headband / visor line
    if (!isGhost) {
      ctx.strokeStyle = this.accentColor;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-6 * facing, headY - 1);
      ctx.lineTo(12 * facing, headY - 1);
      ctx.stroke();

      // Subtle glow
      ctx.shadowColor = this.accentColor;
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }

  drawRagdoll(ctx) {
    const rd = this.ragdoll;
    if (!rd) return;

    ctx.save();
    ctx.strokeStyle = rd.color;
    ctx.fillStyle = rd.color;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';

    // Helper to draw segment body
    const drawBody = (body, w, h, isGlove = false) => {
      ctx.save();
      ctx.translate(body.position.x, body.position.y);
      ctx.rotate(body.angle);
      if (isGlove) {
        ctx.fillStyle = rd.accentColor;
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        ctx.fillStyle = rd.color;
        ctx.fillRect(-w / 2, -h / 2, w, h);
      }
      ctx.restore();
    };

    // Draw limbs
    drawBody(rd.torso, 18, 48);
    drawBody(rd.leftUpperArm, 7, 20);
    drawBody(rd.leftForearm, 7, 20, true);
    drawBody(rd.rightUpperArm, 7, 20);
    drawBody(rd.rightForearm, 7, 20, true);
    drawBody(rd.leftThigh, 8, 26);
    drawBody(rd.leftCalf, 7, 24);
    drawBody(rd.rightThigh, 8, 26);
    drawBody(rd.rightCalf, 7, 24);

    // Head
    ctx.save();
    ctx.translate(rd.head.position.x, rd.head.position.y);
    ctx.rotate(rd.head.angle);
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fillStyle = rd.color;
    ctx.fill();
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Knockout eyes (X X)
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    // Left eye X
    ctx.beginPath();
    ctx.moveTo(-6, -4); ctx.lineTo(-2, 0);
    ctx.moveTo(-2, -4); ctx.lineTo(-6, 0);
    // Right eye X
    ctx.moveTo(2, -4); ctx.lineTo(6, 0);
    ctx.moveTo(6, -4); ctx.lineTo(2, 0);
    ctx.stroke();

    ctx.restore();
    ctx.restore();
  }
}
