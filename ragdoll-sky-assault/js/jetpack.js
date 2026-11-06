/**
 * Jetpack physics module: fuel management, upward thrust dynamics,
 * recharge cycle, directional dashing, and particle exhaust FX.
 */
class Jetpack {
  constructor(owner) {
    this.owner = owner; // Player or Soldier

    this.maxFuel = 100;
    this.fuel = this.maxFuel;

    // Fuel rates
    this.consumptionRate = 32; // fuel per second
    this.rechargeRate = 38;    // fuel per second
    this.rechargeDelay = 220;  // ms after releasing thrust
    this.rechargeTimer = 0;

    // Thrust forces
    this.thrustPower = -0.92;
    this.maxAscentSpeed = -10.5;

    // Active state
    this.isThrusting = false;
    this.dashCooldown = 0;

    // Particles
    this.particles = [];
  }

  thrust(deltaMs) {
    if (this.fuel <= 0) {
      this.stopThrust();
      return false;
    }

    if (!this.isThrusting && this.owner && this.owner.game) {
      this.owner.game.combat.sfx.startThruster();
    }

    this.isThrusting = true;
    this.rechargeTimer = this.rechargeDelay;

    // Consume fuel
    const deltaSec = deltaMs / 1000;
    this.fuel = Math.max(0, this.fuel - this.consumptionRate * deltaSec);

    // Apply physics thrust to body
    const body = this.owner.body;
    if (body) {
      const currentVy = body.velocity.y;
      const targetVy = Math.max(this.maxAscentSpeed, currentVy + this.thrustPower);
      Matter.Body.setVelocity(body, {
        x: body.velocity.x,
        y: targetVy
      });
    }

    // Spawn exhaust particles
    this.spawnThrustParticles();
    return true;
  }

  stopThrust() {
    if (this.isThrusting && this.owner && this.owner.game) {
      this.owner.game.combat.sfx.stopThruster();
    }
    this.isThrusting = false;
  }

  dash(dirX, dirY) {
    if (this.dashCooldown > 0 || this.fuel < 20) return false;

    this.fuel = Math.max(0, this.fuel - 20);
    this.dashCooldown = 650; // ms
    this.rechargeTimer = 350;

    const body = this.owner.body;
    if (body) {
      const dashSpeedX = dirX * 15.0;
      const dashSpeedY = dirY !== 0 ? dirY * 11.0 : -2.5;

      Matter.Body.setVelocity(body, {
        x: dashSpeedX,
        y: dashSpeedY
      });
    }

    // Spawn dash shock burst
    const pos = this.owner.body.position;
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 6 + 2;
      this.particles.push({
        x: pos.x - dirX * 12,
        y: pos.y + 6,
        vx: Math.cos(angle) * spd - dirX * 4,
        vy: Math.sin(angle) * spd,
        radius: Math.random() * 4 + 2,
        color: '#38bdf8',
        alpha: 1.0,
        decay: 0.04
      });
    }

    return true;
  }

  update(deltaMs) {
    const deltaSec = deltaMs / 1000;

    if (this.dashCooldown > 0) {
      this.dashCooldown -= deltaMs;
    }

    // Recharge when not thrusting
    if (!this.isThrusting) {
      if (this.rechargeTimer > 0) {
        this.rechargeTimer -= deltaMs;
      } else {
        this.fuel = Math.min(this.maxFuel, this.fuel + this.rechargeRate * deltaSec);
      }
    }

    // Update exhaust particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      p.radius *= 0.96;
      if (p.alpha <= 0 || p.radius <= 0.5) {
        this.particles.splice(i, 1);
      }
    }
  }

  spawnThrustParticles() {
    const body = this.owner.body;
    if (!body) return;

    const facing = this.owner.facing || 1;
    const nozzleX = body.position.x - 14 * facing;
    const nozzleY = body.position.y + 6;

    for (let i = 0; i < 2; i++) {
      const angle = Math.PI * 0.5 + (Math.random() - 0.5) * 0.5;
      const speed = Math.random() * 5 + 4;
      const isFire = Math.random() < 0.7;

      this.particles.push({
        x: nozzleX + (Math.random() - 0.5) * 4,
        y: nozzleY,
        vx: Math.cos(angle) * speed - body.velocity.x * 0.2,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 4 + 2,
        color: isFire ? (Math.random() < 0.5 ? '#f59e0b' : '#38bdf8') : '#94a3b8',
        alpha: 0.9,
        decay: 0.05 + Math.random() * 0.03
      });
    }
  }

  draw(ctx, camera) {
    ctx.save();
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!camera.isVisible(p.x, p.y, 20)) continue;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
