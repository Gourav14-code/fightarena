/**
 * Physics module managing Matter.js world, collisions, categories,
 * arena boundaries, balance stabilization, and ragdoll creation.
 */
class PhysicsManager {
  constructor(canvasWidth = 1280, canvasHeight = 720) {
    this.width = canvasWidth;
    this.height = canvasHeight;

    // Matter.js Module Aliases
    this.Engine = Matter.Engine;
    this.World = Matter.World;
    this.Bodies = Matter.Bodies;
    this.Body = Matter.Body;
    this.Composite = Matter.Composite;
    this.Constraint = Matter.Constraint;
    this.Vector = Matter.Vector;

    // Collision filter categories
    this.CATEGORY_GROUND = 0x0001;
    this.CATEGORY_PLAYER = 0x0002;
    this.CATEGORY_ENEMY  = 0x0004;
    this.CATEGORY_HITBOX = 0x0008;
    this.CATEGORY_RAGDOLL = 0x0010;

    // Create Matter Engine with controlled gravity
    this.engine = this.Engine.create({
      gravity: { x: 0, y: 1.35, scale: 0.001 }
    });
    this.world = this.engine.world;

    this.groundY = 600;
    this.groundThickness = 120;

    this.boundaries = [];
    this.activeRagdolls = [];

    this.setupArenaBoundaries();
  }

  setupArenaBoundaries() {
    // Floor
    const ground = this.Bodies.rectangle(
      this.width / 2,
      this.groundY + this.groundThickness / 2,
      this.width * 1.5,
      this.groundThickness,
      {
        isStatic: true,
        friction: 0.8,
        restitution: 0.1,
        collisionFilter: {
          category: this.CATEGORY_GROUND,
          mask: 0xFFFF
        },
        label: 'ground'
      }
    );

    // Left arena wall
    const leftWall = this.Bodies.rectangle(
      -30,
      this.height / 2,
      70,
      this.height * 2,
      {
        isStatic: true,
        friction: 0.1,
        collisionFilter: { category: this.CATEGORY_GROUND, mask: 0xFFFF },
        label: 'wall_left'
      }
    );

    // Right arena wall
    const rightWall = this.Bodies.rectangle(
      this.width + 30,
      this.height / 2,
      70,
      this.height * 2,
      {
        isStatic: true,
        friction: 0.1,
        collisionFilter: { category: this.CATEGORY_GROUND, mask: 0xFFFF },
        label: 'wall_right'
      }
    );

    // Ceiling barrier
    const ceiling = this.Bodies.rectangle(
      this.width / 2,
      -100,
      this.width * 2,
      80,
      {
        isStatic: true,
        collisionFilter: { category: this.CATEGORY_GROUND, mask: 0xFFFF },
        label: 'ceiling'
      }
    );

    this.boundaries = [ground, leftWall, rightWall, ceiling];
    this.World.add(this.world, this.boundaries);
  }

  /**
   * Creates an active combat physics body for a stickman fighter.
   */
  createFighterBody(x, y, isPlayer = true) {
    const width = 36;
    const height = 96;

    const body = this.Bodies.rectangle(x, y, width, height, {
      mass: 55,
      friction: 0.2,
      frictionAir: 0.03,
      restitution: 0.05,
      chamfer: { radius: 14 },
      inertia: 12000, // Provides rotational inertia so fighters tilt realistically
      collisionFilter: {
        category: isPlayer ? this.CATEGORY_PLAYER : this.CATEGORY_ENEMY,
        mask: this.CATEGORY_GROUND | (isPlayer ? this.CATEGORY_ENEMY : this.CATEGORY_PLAYER)
      },
      label: isPlayer ? 'player_body' : 'enemy_body'
    });

    this.World.add(this.world, body);
    return body;
  }

  /**
   * Applies corrective balance torque and damping to keep the active fighter standing
   * while allowing dynamic wobble and recoil from hits and movement.
   */
  applyBalance(body, targetAngle = 0, stiffness = 0.09, damping = 0.045) {
    if (!body) return;
    const angleDiff = targetAngle - body.angle;
    const angularVel = body.angularVelocity;
    const torque = angleDiff * stiffness - angularVel * damping;
    this.Body.setAngularVelocity(body, angularVel + torque);
  }

  /**
   * Check if body is touching or very near the ground.
   */
  isGrounded(body) {
    if (!body) return false;
    const bottomY = body.position.y + 48;
    return bottomY >= (this.groundY - 14) && Math.abs(body.velocity.y) < 4.5;
  }

  /**
   * Creates a multi-joint ragdoll when a fighter is knocked out.
   */
  createRagdoll(x, y, facing = 1, impulse = { x: 0, y: 0 }, color = '#1e293b', accentColor = '#38bdf8') {
    const group = this.Body.nextGroup(true); // Self-collision group
    const filter = {
      group: group,
      category: this.CATEGORY_RAGDOLL,
      mask: this.CATEGORY_GROUND
    };

    const commonProps = {
      collisionFilter: filter,
      friction: 0.8,
      frictionAir: 0.02,
      restitution: 0.15
    };

    // Body parts
    const head = this.Bodies.circle(x, y - 48, 14, {
      ...commonProps,
      density: 0.0015,
      label: 'ragdoll_head'
    });

    const torso = this.Bodies.rectangle(x, y - 10, 22, 54, {
      ...commonProps,
      density: 0.003,
      chamfer: { radius: 6 },
      label: 'ragdoll_torso'
    });

    // Left arm
    const leftUpperArm = this.Bodies.rectangle(x - 12 * facing, y - 24, 8, 22, {
      ...commonProps,
      density: 0.001,
      label: 'ragdoll_left_upper_arm'
    });
    const leftForearm = this.Bodies.rectangle(x - 18 * facing, y - 6, 8, 22, {
      ...commonProps,
      density: 0.001,
      label: 'ragdoll_left_forearm'
    });

    // Right arm
    const rightUpperArm = this.Bodies.rectangle(x + 12 * facing, y - 24, 8, 22, {
      ...commonProps,
      density: 0.001,
      label: 'ragdoll_right_upper_arm'
    });
    const rightForearm = this.Bodies.rectangle(x + 18 * facing, y - 6, 8, 22, {
      ...commonProps,
      density: 0.001,
      label: 'ragdoll_right_forearm'
    });

    // Left leg
    const leftThigh = this.Bodies.rectangle(x - 8, y + 26, 9, 28, {
      ...commonProps,
      density: 0.002,
      label: 'ragdoll_left_thigh'
    });
    const leftCalf = this.Bodies.rectangle(x - 8, y + 50, 8, 26, {
      ...commonProps,
      density: 0.0015,
      label: 'ragdoll_left_calf'
    });

    // Right leg
    const rightThigh = this.Bodies.rectangle(x + 8, y + 26, 9, 28, {
      ...commonProps,
      density: 0.002,
      label: 'ragdoll_right_thigh'
    });
    const rightCalf = this.Bodies.rectangle(x + 8, y + 50, 8, 26, {
      ...commonProps,
      density: 0.0015,
      label: 'ragdoll_right_calf'
    });

    // Joints / Constraints
    const neck = this.Constraint.create({
      bodyA: head,
      pointA: { x: 0, y: 12 },
      bodyB: torso,
      pointB: { x: 0, y: -24 },
      stiffness: 0.85,
      damping: 0.1,
      render: { visible: false }
    });

    // Left arm joints
    const leftShoulder = this.Constraint.create({
      bodyA: torso,
      pointA: { x: -10 * facing, y: -20 },
      bodyB: leftUpperArm,
      pointB: { x: 0, y: -9 },
      stiffness: 0.8,
      damping: 0.1
    });
    const leftElbow = this.Constraint.create({
      bodyA: leftUpperArm,
      pointA: { x: 0, y: 9 },
      bodyB: leftForearm,
      pointB: { x: 0, y: -9 },
      stiffness: 0.8,
      damping: 0.1
    });

    // Right arm joints
    const rightShoulder = this.Constraint.create({
      bodyA: torso,
      pointA: { x: 10 * facing, y: -20 },
      bodyB: rightUpperArm,
      pointB: { x: 0, y: -9 },
      stiffness: 0.8,
      damping: 0.1
    });
    const rightElbow = this.Constraint.create({
      bodyA: rightUpperArm,
      pointA: { x: 0, y: 9 },
      bodyB: rightForearm,
      pointB: { x: 0, y: -9 },
      stiffness: 0.8,
      damping: 0.1
    });

    // Left leg joints
    const leftHip = this.Constraint.create({
      bodyA: torso,
      pointA: { x: -7, y: 24 },
      bodyB: leftThigh,
      pointB: { x: 0, y: -12 },
      stiffness: 0.8,
      damping: 0.1
    });
    const leftKnee = this.Constraint.create({
      bodyA: leftThigh,
      pointA: { x: 0, y: 12 },
      bodyB: leftCalf,
      pointB: { x: 0, y: -11 },
      stiffness: 0.8,
      damping: 0.1
    });

    // Right leg joints
    const rightHip = this.Constraint.create({
      bodyA: torso,
      pointA: { x: 7, y: 24 },
      bodyB: rightThigh,
      pointB: { x: 0, y: -12 },
      stiffness: 0.8,
      damping: 0.1
    });
    const rightKnee = this.Constraint.create({
      bodyA: rightThigh,
      pointA: { x: 0, y: 12 },
      bodyB: rightCalf,
      pointB: { x: 0, y: -11 },
      stiffness: 0.8,
      damping: 0.1
    });

    const parts = [
      head, torso,
      leftUpperArm, leftForearm,
      rightUpperArm, rightForearm,
      leftThigh, leftCalf,
      rightThigh, rightCalf
    ];

    const constraints = [
      neck,
      leftShoulder, leftElbow,
      rightShoulder, rightElbow,
      leftHip, leftKnee,
      rightHip, rightKnee
    ];

    // Apply knockout impulse and spin to parts
    parts.forEach(part => {
      this.Body.setVelocity(part, {
        x: impulse.x * (0.8 + Math.random() * 0.4),
        y: impulse.y * (0.8 + Math.random() * 0.4)
      });
      this.Body.setAngularVelocity(part, (Math.random() - 0.5) * 0.4);
    });

    const ragdollComposite = this.Composite.create({
      bodies: parts,
      constraints: constraints
    });

    this.World.add(this.world, ragdollComposite);

    const ragdollData = {
      composite: ragdollComposite,
      head: head,
      torso: torso,
      leftUpperArm, leftForearm,
      rightUpperArm, rightForearm,
      leftThigh, leftCalf,
      rightThigh, rightCalf,
      color: color,
      accentColor: accentColor
    };

    this.activeRagdolls.push(ragdollData);
    return ragdollData;
  }

  removeBody(body) {
    if (body) {
      this.World.remove(this.world, body);
    }
  }

  /**
   * Fixed physics timestep update (60hz)
   */
  update(deltaMs) {
    // Keep engine step stable at 1000/60 (~16.66ms)
    this.Engine.update(this.engine, 1000 / 60);
  }

  /**
   * Reset world for a new match
   */
  reset() {
    // Clear all bodies and constraints except boundaries
    this.activeRagdolls.forEach(r => {
      this.Composite.remove(this.world, r.composite, true);
    });
    this.activeRagdolls = [];

    // Remove all non-boundary bodies
    const allBodies = this.Composite.allBodies(this.world);
    allBodies.forEach(b => {
      if (!this.boundaries.includes(b)) {
        this.World.remove(this.world, b);
      }
    });
  }
}
