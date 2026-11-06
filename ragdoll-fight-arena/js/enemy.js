/**
 * Enemy AI Stickman entity: autonomous decision-making, distance control,
 * attack selection (normal/heavy punches), hit reactions, and ragdoll knockout.
 */
class Enemy {
  constructor(game, x = 920, y = 520) {
    this.game = game;
    this.physics = game.physics;
    this.combat = game.combat;

    this.startX = x;
    this.startY = y;

    this.maxHealth = 100;
    this.health = this.maxHealth;

    this.facing = -1; // Faces left towards player
    this.walkSpeed = 4.8;
    this.jumpForce = -13.0;

    // Visual styles (Red / Crimson adversary)
    this.color = '#181b26';
    this.accentColor = '#ef4444';
    this.glowColor = 'rgba(239, 68, 68, 0.4)';

    // Combat state
    this.isGrounded = false;
    this.currentAttack = null;
    this.attackCooldownTimer = 0;

    this.isDodging = false;
    this.dodgeTimer = 0;
    this.dodgeDuration = 220;
    this.dodgeCooldownTimer = 0;
    this.dodgeCooldown = 1200;
    this.isInvulnerable = false;

    this.hitStunTimer = 0;
    this.isKnockedOut = false;
    this.ragdoll = null;

    // AI State Machine
    this.aiState = 'APPROACH'; // 'APPROACH', 'SPACING', 'RETREAT'
    this.aiTimer = 0;
    this.idealDistance = 64; // Ideal boxing strike range
    this.walkCycle = 0;
    this.hitFlashTimer = 0;

    // Create Matter.js physics body
    this.body = this.physics.createFighterBody(x, y, false);
    this.body.fighterRef = this;
  }

  applyHitStun(durationMs, hitFromFacing, isHeavy) {
    this.hitStunTimer = durationMs;
    this.hitFlashTimer = 140;
    this.currentAttack = null;
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

    this.physics.removeBody(this.body);
    this.body = null;

    this.ragdoll = this.physics.createRagdoll(
      x,
      y,
      facing,
      impulse,
      this.color,
      this.accentColor
    );
  }

  initiateAttack(type) {
    if (this.currentAttack || this.attackCooldownTimer > 0 || this.isDodging) return;

    const config = this.combat.ATTACKS[type];
    if (!config) return;

    this.currentAttack = {
      type: type,
      config: config,
      phase: 'windup',
      timer: 0,
      active: false,
      hasHit: false,
      id: this.combat.generateAttackId()
    };

    this.combat.sfx.playWhoosh(type === 'HEAVY' ? 0.75 : 1.05);
  }

  update(deltaMs) {
    if (this.isKnockedOut) return;

    this.isGrounded = this.physics.isGrounded(this.body);

    if (this.attackCooldownTimer > 0) this.attackCooldownTimer -= deltaMs;
    if (this.dodgeCooldownTimer > 0) this.dodgeCooldownTimer -= deltaMs;
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= deltaMs;

    if (this.hitStunTimer > 0) {
      this.hitStunTimer -= deltaMs;
      this.physics.applyBalance(this.body, -0.35 * this.facing, 0.08, 0.05);
      return;
    }

    // Update ongoing attack
    if (this.currentAttack) {
      this.updateAttack(deltaMs);
    }

    // AI Logic Routine
    this.updateAI(deltaMs);
  }

  updateAI(deltaMs) {
    const player = this.game.player;
    if (!player || player.isKnockedOut) {
      // Idle victory stance
      this.physics.applyBalance(this.body, 0, 0.1, 0.05);
      return;
    }

    const myX = this.body.position.x;
    const playerX = player.getX();
    const distToPlayer = Math.abs(myX - playerX);
    const directionToPlayer = playerX > myX ? 1 : -1;

    // Face player
    if (!this.currentAttack) {
      this.facing = directionToPlayer;
    }

    this.aiTimer -= deltaMs;
    if (this.aiTimer <= 0) {
      // Re-evaluate strategy
      this.aiTimer = 160 + Math.random() * 140;

      if (distToPlayer > 140) {
        this.aiState = 'APPROACH';
      } else if (distToPlayer < 45) {
        this.aiState = 'RETREAT';
      } else {
        this.aiState = Math.random() < 0.65 ? 'SPACING' : 'APPROACH';
      }

      // Attack decision if in striking distance
      if (distToPlayer <= 82 && !this.currentAttack && this.attackCooldownTimer <= 0) {
        const roll = Math.random();
        if (roll < 0.55) {
          this.initiateAttack('NORMAL');
        } else if (roll < 0.82) {
          this.initiateAttack('HEAVY');
        }
      }
    }

    // Execute movement based on state
    let moveDir = 0;
    if (this.aiState === 'APPROACH') {
      moveDir = directionToPlayer;
    } else if (this.aiState === 'RETREAT') {
      moveDir = -directionToPlayer;
    } else if (this.aiState === 'SPACING') {
      // Subtle weave back and forth
      moveDir = distToPlayer < this.idealDistance ? -directionToPlayer : directionToPlayer;
      if (Math.abs(distToPlayer - this.idealDistance) < 10) {
        moveDir = 0;
      }
    }

    let targetVx = moveDir * this.walkSpeed;
    if (this.currentAttack) {
      targetVx *= 0.2;
    }

    const currentVx = this.body.velocity.x;
    const newVx = currentVx + (targetVx - currentVx) * 0.22;

    Matter.Body.setVelocity(this.body, {
      x: newVx,
      y: this.body.velocity.y
    });

    // Walk cycle animation
    if (Math.abs(newVx) > 0.4 && this.isGrounded) {
      this.walkCycle += Math.abs(newVx) * 0.06;
    } else {
      this.walkCycle *= 0.8;
    }

    // Upright balance
    let targetLean = (newVx / this.walkSpeed) * 0.12 * this.facing;
    if (this.currentAttack && this.currentAttack.phase === 'active') {
      targetLean += 0.18 * this.facing;
    }
    this.physics.applyBalance(this.body, targetLean, 0.1, 0.045);
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
        reach = -10 + progress * 10;
      } else if (this.currentAttack.phase === 'active') {
        const progress = this.currentAttack.timer / cfg.activeMs;
        reach = cfg.reach * Math.sin(progress * Math.PI * 0.5);
      } else if (this.currentAttack.phase === 'recovery') {
        const progress = this.currentAttack.timer / cfg.recoveryMs;
        reach = cfg.reach * (1 - progress);
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

    ctx.save();
    const pos = this.body.position;
    ctx.translate(pos.x, pos.y);
    ctx.rotate(this.body.angle);

    const isFlashing = this.hitFlashTimer > 0;
    this.renderStickmanBody(ctx, this.facing, isFlashing ? '#ffffff' : null);
    ctx.restore();
  }

  renderStickmanBody(ctx, facing, overrideColor = null) {
    const mainColor = overrideColor || this.color;
    const gloveColor = this.accentColor;

    ctx.strokeStyle = mainColor;
    ctx.fillStyle = mainColor;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const headY = -42;
    const neckY = -24;
    const hipY = 18;

    // Spine
    ctx.beginPath();
    ctx.moveTo(0, neckY);
    ctx.lineTo(0, hipY);
    ctx.stroke();

    // Legs
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

    // Guard Arm
    const guardShoulder = { x: -6 * facing, y: neckY + 4 };
    const guardElbow = { x: -14 * facing, y: neckY + 16 };
    const guardFist = { x: 4 * facing, y: neckY + 8 };

    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(guardShoulder.x, guardShoulder.y);
    ctx.lineTo(guardElbow.x, guardElbow.y);
    ctx.lineTo(guardFist.x, guardFist.y);
    ctx.stroke();

    // Guard Glove
    ctx.fillStyle = gloveColor;
    ctx.beginPath();
    ctx.arc(guardFist.x, guardFist.y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Punching / Front Arm
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

    // Glove
    const gloveRadius = this.currentAttack && this.currentAttack.type === 'HEAVY' ? 16 : 13;
    ctx.fillStyle = gloveColor;
    ctx.beginPath();
    ctx.arc(fistPosLocal.x, fistPosLocal.y, gloveRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Head
    ctx.fillStyle = mainColor;
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#020617';
    ctx.beginPath();
    ctx.arc(0, headY, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Red visor accent
    ctx.strokeStyle = this.accentColor;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-6 * facing, headY - 1);
    ctx.lineTo(12 * facing, headY - 1);
    ctx.stroke();

    ctx.shadowColor = this.accentColor;
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  drawRagdoll(ctx) {
    const rd = this.ragdoll;
    if (!rd) return;

    ctx.save();
    ctx.strokeStyle = rd.color;
    ctx.fillStyle = rd.color;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';

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
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-6, -4); ctx.lineTo(-2, 0);
    ctx.moveTo(-2, -4); ctx.lineTo(-6, 0);
    ctx.moveTo(2, -4); ctx.lineTo(6, 0);
    ctx.moveTo(6, -4); ctx.lineTo(2, 0);
    ctx.stroke();

    ctx.restore();
    ctx.restore();
  }
}
