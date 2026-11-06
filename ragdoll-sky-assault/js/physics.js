/**
 * Physics Manager for Sky Assault: Matter.js world setup, collision categories,
 * level boundary physics, platform generation, active stickman balance,
 * and high-impact ragdoll death physics.
 */
class PhysicsManager {
  constructor(worldWidth = 4800, worldHeight = 1400) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;

    // Matter.js Aliases
    this.Engine = Matter.Engine;
    this.World = Matter.World;
    this.Bodies = Matter.Bodies;
    this.Body = Matter.Body;
    this.Composite = Matter.Composite;
    this.Constraint = Matter.Constraint;
    this.Events = Matter.Events;
    this.Vector = Matter.Vector;

    // Collision filter categories
    this.CATEGORY_SOLID         = 0x0001; // Ground, walls, platforms
    this.CATEGORY_PLAYER        = 0x0002;
    this.CATEGORY_ENEMY         = 0x0004;
    this.CATEGORY_PLAYER_BULLET = 0x0008;
    this.CATEGORY_ENEMY_BULLET  = 0x0010;
    this.CATEGORY_RAGDOLL       = 0x0020;
    this.CATEGORY_PICKUP        = 0x0040;

    // Create Engine with standard gravity (jetpack overcomes this with upward force)
    this.engine = this.Engine.create({
      gravity: { x: 0, y: 1.15, scale: 0.001 }
    });
    this.world = this.engine.world;

    this.boundaries = [];
    this.platforms = [];
    this.activeRagdolls = [];

    this.groundY = 1260;
    this.setupWorldBoundaries();
  }

  setupWorldBoundaries() {
    const w = this.worldWidth;
    const h = this.worldHeight;
    const groundThickness = 120;

    // Main bottom scrap ground
    const ground = this.Bodies.rectangle(
      w / 2,
      this.groundY + groundThickness / 2,
      w * 1.5,
      groundThickness,
      {
        isStatic: true,
        friction: 0.8,
        restitution: 0.05,
        collisionFilter: { category: this.CATEGORY_SOLID, mask: 0xFFFF },
        label: 'ground'
      }
    );

    // Left boundary
    const leftWall = this.Bodies.rectangle(
      -40,
      h / 2,
      90,
      h * 2,
      {
        isStatic: true,
        friction: 0.0,
        collisionFilter: { category: this.CATEGORY_SOLID, mask: 0xFFFF },
        label: 'boundary_left'
      }
    );

    // Right boundary
    const rightWall = this.Bodies.rectangle(
      w + 40,
      h / 2,
      90,
      h * 2,
      {
        isStatic: true,
        friction: 0.0,
        collisionFilter: { category: this.CATEGORY_SOLID, mask: 0xFFFF },
        label: 'boundary_right'
      }
    );

    // High altitude ceiling
    const ceiling = this.Bodies.rectangle(
      w / 2,
      -80,
      w * 1.5,
      120,
      {
        isStatic: true,
        collisionFilter: { category: this.CATEGORY_SOLID, mask: 0xFFFF },
        label: 'boundary_ceiling'
      }
    );

    this.boundaries = [ground, leftWall, rightWall, ceiling];
    this.World.add(this.world, this.boundaries);
  }

  addPlatform(x, y, width, height, label = 'platform') {
    const platform = this.Bodies.rectangle(x, y, width, height, {
      isStatic: true,
      friction: 0.5,
      restitution: 0.05,
      chamfer: { radius: 4 },
      collisionFilter: {
        category: this.CATEGORY_SOLID,
        mask: 0xFFFF
      },
      label: label
    });

    this.platforms.push(platform);
    this.World.add(this.world, platform);
    return platform;
  }

  /**
   * Creates an active combat stickman body (Player or Soldier).
   */
  createStickmanBody(x, y, isPlayer = true) {
    const width = 32;
    const height = 86;

    const body = this.Bodies.rectangle(x, y, width, height, {
      mass: 55,
      friction: 0.15,
      frictionAir: 0.025, // Atmospheric air damping for aerial flight
      restitution: 0.02,
      chamfer: { radius: 12 },
      inertia: 14000,
      collisionFilter: {
        category: isPlayer ? this.CATEGORY_PLAYER : this.CATEGORY_ENEMY,
        mask: this.CATEGORY_SOLID | (isPlayer ? this.CATEGORY_ENEMY_BULLET : this.CATEGORY_PLAYER_BULLET)
      },
      label: isPlayer ? 'player_body' : 'enemy_soldier_body'
    });

    this.World.add(this.world, body);
    return body;
  }

  /**
   * Creates a hovering attack drone body.
   */
  createDroneBody(x, y) {
    const radius = 22;
    const body = this.Bodies.circle(x, y, radius, {
      mass: 35,
      friction: 0.1,
      frictionAir: 0.045, // Hovering air drag
      restitution: 0.25,
      collisionFilter: {
        category: this.CATEGORY_ENEMY,
        mask: this.CATEGORY_SOLID | this.CATEGORY_PLAYER_BULLET
      },
      label: 'enemy_drone_body'
    });

    this.World.add(this.world, body);
    return body;
  }

  /**
   * Applies balance torque to keep standing/flying fighters upright
   * with natural tilt based on velocity and momentum.
   */
  applyBalance(body, targetAngle = 0, stiffness = 0.08, damping = 0.04) {
    if (!body) return;
    const angleDiff = targetAngle - body.angle;
    const angularVel = body.angularVelocity;
    const torque = angleDiff * stiffness - angularVel * damping;
    this.Body.setAngularVelocity(body, angularVel + torque);
  }

  /**
   * Check if body is touching ground or platform surfaces.
   */
  isGrounded(body) {
    if (!body) return false;
    const bottomY = body.position.y + 43;

    // Check bottom ground
    if (bottomY >= this.groundY - 10 && Math.abs(body.velocity.y) < 3.5) {
      return true;
    }

    // Check platform collision
    const pos = body.position;
    for (let i = 0; i < this.platforms.length; i++) {
      const p = this.platforms[i];
      const pTop = p.position.y - 12;
      const pLeft = p.position.x - 120;
      const pRight = p.position.x + 120;

      if (pos.x >= pLeft && pos.x <= pRight) {
        if (bottomY >= pTop - 8 && bottomY <= pTop + 14 && body.velocity.y >= -1.0 && body.velocity.y < 3.5) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Creates a multi-joint floppy ragdoll upon soldier death.
   */
  createSoldierRagdoll(x, y, facing = 1, impulse = { x: 0, y: 0 }, color = '#181b26', accentColor = '#ef4444') {
    const group = this.Body.nextGroup(true);
    const filter = {
      group: group,
      category: this.CATEGORY_RAGDOLL,
      mask: this.CATEGORY_SOLID
    };

    const commonProps = {
      collisionFilter: filter,
      friction: 0.8,
      frictionAir: 0.02,
      restitution: 0.15
    };

    // Body segments
    const head = this.Bodies.circle(x, y - 42, 13, { ...commonProps, density: 0.0015, label: 'ragdoll_head' });
    const torso = this.Bodies.rectangle(x, y - 8, 20, 50, { ...commonProps, density: 0.003, chamfer: { radius: 5 }, label: 'ragdoll_torso' });

    // Arms
    const leftUpperArm = this.Bodies.rectangle(x - 10 * facing, y - 20, 7, 20, { ...commonProps, density: 0.001 });
    const leftForearm = this.Bodies.rectangle(x - 16 * facing, y - 4, 6, 20, { ...commonProps, density: 0.001 });
    const rightUpperArm = this.Bodies.rectangle(x + 10 * facing, y - 20, 7, 20, { ...commonProps, density: 0.001 });
    const rightForearm = this.Bodies.rectangle(x + 16 * facing, y - 4, 6, 20, { ...commonProps, density: 0.001 });

    // Legs
    const leftThigh = this.Bodies.rectangle(x - 7, y + 24, 8, 26, { ...commonProps, density: 0.002 });
    const leftCalf = this.Bodies.rectangle(x - 7, y + 46, 7, 24, { ...commonProps, density: 0.0015 });
    const rightThigh = this.Bodies.rectangle(x + 7, y + 24, 8, 26, { ...commonProps, density: 0.002 });
    const rightCalf = this.Bodies.rectangle(x + 7, y + 46, 7, 24, { ...commonProps, density: 0.0015 });

    // Pin Joints
    const neck = this.Constraint.create({ bodyA: head, pointA: { x: 0, y: 11 }, bodyB: torso, pointB: { x: 0, y: -22 }, stiffness: 0.85, damping: 0.1 });
    const lShoulder = this.Constraint.create({ bodyA: torso, pointA: { x: -9 * facing, y: -18 }, bodyB: leftUpperArm, pointB: { x: 0, y: -8 }, stiffness: 0.8 });
    const lElbow = this.Constraint.create({ bodyA: leftUpperArm, pointA: { x: 0, y: 8 }, bodyB: leftForearm, pointB: { x: 0, y: -8 }, stiffness: 0.8 });
    const rShoulder = this.Constraint.create({ bodyA: torso, pointA: { x: 9 * facing, y: -18 }, bodyB: rightUpperArm, pointB: { x: 0, y: -8 }, stiffness: 0.8 });
    const rElbow = this.Constraint.create({ bodyA: rightUpperArm, pointA: { x: 0, y: 8 }, bodyB: rightForearm, pointB: { x: 0, y: -8 }, stiffness: 0.8 });
    const lHip = this.Constraint.create({ bodyA: torso, pointA: { x: -6, y: 22 }, bodyB: leftThigh, pointB: { x: 0, y: -11 }, stiffness: 0.8 });
    const lKnee = this.Constraint.create({ bodyA: leftThigh, pointA: { x: 0, y: 11 }, bodyB: leftCalf, pointB: { x: 0, y: -10 }, stiffness: 0.8 });
    const rHip = this.Constraint.create({ bodyA: torso, pointA: { x: 6, y: 22 }, bodyB: rightThigh, pointB: { x: 0, y: -11 }, stiffness: 0.8 });
    const rKnee = this.Constraint.create({ bodyA: rightThigh, pointA: { x: 0, y: 11 }, bodyB: rightCalf, pointB: { x: 0, y: -10 }, stiffness: 0.8 });

    const parts = [head, torso, leftUpperArm, leftForearm, rightUpperArm, rightForearm, leftThigh, leftCalf, rightThigh, rightCalf];
    const joints = [neck, lShoulder, lElbow, rShoulder, rElbow, lHip, lKnee, rHip, rKnee];

    // Apply death blast kinetic velocity
    parts.forEach(part => {
      this.Body.setVelocity(part, {
        x: impulse.x * (0.8 + Math.random() * 0.4),
        y: impulse.y * (0.8 + Math.random() * 0.4)
      });
      this.Body.setAngularVelocity(part, (Math.random() - 0.5) * 0.5);
    });

    const composite = this.Composite.create({ bodies: parts, constraints: joints });
    this.World.add(this.world, composite);

    const ragdollData = {
      type: 'soldier',
      composite,
      head, torso,
      leftUpperArm, leftForearm,
      rightUpperArm, rightForearm,
      leftThigh, leftCalf,
      rightThigh, rightCalf,
      color, accentColor,
      life: 6.0 // Despawns after 6 seconds
    };

    this.activeRagdolls.push(ragdollData);
    return ragdollData;
  }

  /**
   * Spawns physics debris when an Attack Drone is blown up.
   */
  createDroneDebris(x, y, impulse = { x: 0, y: 0 }) {
    const debrisParts = [];
    const count = 4;

    for (let i = 0; i < count; i++) {
      const part = this.Bodies.rectangle(
        x + (Math.random() - 0.5) * 16,
        y + (Math.random() - 0.5) * 16,
        Math.random() * 12 + 6,
        Math.random() * 12 + 6,
        {
          friction: 0.8,
          restitution: 0.35,
          collisionFilter: {
            category: this.CATEGORY_RAGDOLL,
            mask: this.CATEGORY_SOLID
          }
        }
      );

      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 10 + 4;
      this.Body.setVelocity(part, {
        x: impulse.x * 0.6 + Math.cos(angle) * speed,
        y: impulse.y * 0.6 + Math.sin(angle) * speed - 2
      });
      this.Body.setAngularVelocity(part, (Math.random() - 0.5) * 0.8);

      this.World.add(this.world, part);
      debrisParts.push(part);
    }

    const debrisData = {
      type: 'drone_debris',
      bodies: debrisParts,
      life: 4.5
    };

    this.activeRagdolls.push(debrisData);
    return debrisData;
  }

  removeBody(body) {
    if (body) {
      this.World.remove(this.world, body);
    }
  }

  update(deltaMs) {
    this.Engine.update(this.engine, 1000 / 60);

    // Update & clean up old ragdolls
    const deltaSec = deltaMs / 1000;
    for (let i = this.activeRagdolls.length - 1; i >= 0; i--) {
      const rd = this.activeRagdolls[i];
      rd.life -= deltaSec;
      if (rd.life <= 0) {
        if (rd.composite) {
          this.Composite.remove(this.world, rd.composite, true);
        } else if (rd.bodies) {
          rd.bodies.forEach(b => this.World.remove(this.world, b));
        }
        this.activeRagdolls.splice(i, 1);
      }
    }
  }

  drawRagdolls(ctx, camera) {
    for (let i = 0; i < this.activeRagdolls.length; i++) {
      const rd = this.activeRagdolls[i];
      if (rd.type === 'soldier') {
        this.renderSoldierRagdoll(ctx, rd, camera);
      } else if (rd.type === 'drone_debris') {
        this.renderDroneDebris(ctx, rd, camera);
      }
    }
  }

  renderSoldierRagdoll(ctx, rd, camera) {
    if (!camera.isVisible(rd.torso.position.x, rd.torso.position.y, 100)) return;

    ctx.save();
    ctx.strokeStyle = rd.color;
    ctx.fillStyle = rd.color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    const drawPart = (body, w, h, isGlove = false) => {
      ctx.save();
      ctx.translate(body.position.x, body.position.y);
      ctx.rotate(body.angle);
      if (isGlove) {
        ctx.fillStyle = rd.accentColor;
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = rd.color;
        ctx.fillRect(-w / 2, -h / 2, w, h);
      }
      ctx.restore();
    };

    drawPart(rd.torso, 16, 44);
    drawPart(rd.leftUpperArm, 6, 18);
    drawPart(rd.leftForearm, 6, 18, true);
    drawPart(rd.rightUpperArm, 6, 18);
    drawPart(rd.rightForearm, 6, 18, true);
    drawPart(rd.leftThigh, 7, 24);
    drawPart(rd.leftCalf, 6, 22);
    drawPart(rd.rightThigh, 7, 24);
    drawPart(rd.rightCalf, 6, 22);

    // Head
    ctx.save();
    ctx.translate(rd.head.position.x, rd.head.position.y);
    ctx.rotate(rd.head.angle);
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fillStyle = rd.color;
    ctx.fill();

    // Red X eyes on dead soldier
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-5, -3); ctx.lineTo(-1, 1);
    ctx.moveTo(-1, -3); ctx.lineTo(-5, 1);
    ctx.moveTo(1, -3); ctx.lineTo(5, 1);
    ctx.moveTo(5, -3); ctx.lineTo(1, 1);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  renderDroneDebris(ctx, rd, camera) {
    ctx.save();
    ctx.fillStyle = '#475569';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;

    for (let i = 0; i < rd.bodies.length; i++) {
      const b = rd.bodies[i];
      if (!camera.isVisible(b.position.x, b.position.y, 50)) continue;
      ctx.save();
      ctx.translate(b.position.x, b.position.y);
      ctx.rotate(b.angle);
      ctx.fillRect(-5, -5, 10, 10);
      ctx.strokeRect(-5, -5, 10, 10);
      ctx.restore();
    }
    ctx.restore();
  }

  reset() {
    this.activeRagdolls.forEach(rd => {
      if (rd.composite) this.Composite.remove(this.world, rd.composite, true);
      if (rd.bodies) rd.bodies.forEach(b => this.World.remove(this.world, b));
    });
    this.activeRagdolls = [];

    const allBodies = this.Composite.allBodies(this.world);
    allBodies.forEach(b => {
      if (!this.boundaries.includes(b) && !this.platforms.includes(b)) {
        this.World.remove(this.world, b);
      }
    });
  }
}
