/**
 * Game Orchestrator: manages rendering loop, fixed physics updates,
 * camera screen shake, arena environment, match lifecycle, and input dispatch.
 */
class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Base internal resolution
    this.width = 1280;
    this.height = 720;

    // Input tracking
    this.inputKeys = {};

    // Systems
    this.physics = new PhysicsManager(this.width, this.height);
    this.combat = new CombatManager(this);
    this.ui = new UIManager(this);

    // Entities
    this.player = null;
    this.enemy = null;

    // Camera Screen Shake
    this.screenShakeIntensity = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;

    // Match State
    this.state = 'PLAYING'; // 'PLAYING', 'ROUND_OVER'
    this.roundOverTimer = 0;

    // Timing
    this.lastTime = performance.now();
    this.physicsAccumulator = 0;
    this.physicsStep = 1000 / 60; // 16.66ms fixed step

    this.initEntities();
    this.setupInputs();
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
  }

  initEntities() {
    this.player = new Player(this, 400, 520);
    this.enemy = new Enemy(this, 880, 520);
  }

  setupInputs() {
    const unlockAudio = () => {
      this.combat.sfx.init();
      this.combat.sfx.resume();
    };

    window.addEventListener('pointerdown', unlockAudio, { once: true });

    window.addEventListener('keydown', (e) => {
      unlockAudio();

      if (['Space', 'KeyA', 'KeyD', 'KeyJ', 'KeyK', 'KeyL'].includes(e.code)) {
        // Prevent default browser scrolling on Space
        if (e.code === 'Space') e.preventDefault();
      }

      this.inputKeys[e.code] = true;

      if (this.state === 'PLAYING' && this.player) {
        this.player.handleKeyDown(e.code);
      }
    });

    window.addEventListener('keyup', (e) => {
      this.inputKeys[e.code] = false;
    });
  }

  handleResize() {
    const container = document.getElementById('canvas-container');
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Maintain 16:9 aspect ratio
    const targetAspect = 16 / 9;
    let renderW = windowWidth * 0.95;
    let renderH = renderW / targetAspect;

    if (renderH > windowHeight * 0.92) {
      renderH = windowHeight * 0.92;
      renderW = renderH * targetAspect;
    }

    container.style.width = `${Math.floor(renderW)}px`;
    container.style.height = `${Math.floor(renderH)}px`;
  }

  addScreenShake(intensity) {
    this.screenShakeIntensity = Math.min(24, this.screenShakeIntensity + intensity);
  }

  updateScreenShake(deltaMs) {
    if (this.screenShakeIntensity > 0) {
      const angle = Math.random() * Math.PI * 2;
      const dist = this.screenShakeIntensity;
      this.shakeOffsetX = Math.cos(angle) * dist;
      this.shakeOffsetY = Math.sin(angle) * dist;
      this.screenShakeIntensity *= Math.pow(0.88, deltaMs / 16.6);
      if (this.screenShakeIntensity < 0.2) {
        this.screenShakeIntensity = 0;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
      }
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }
  }

  restart() {
    this.physics.reset();
    this.combat.reset();
    this.initEntities();
    this.ui.reset();
    this.state = 'PLAYING';
    this.roundOverTimer = 0;
  }

  start() {
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  loop(currentTime) {
    const elapsed = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Cap maximum elapsed to prevent spiral of death on tab unfocus
    const deltaMs = Math.min(elapsed, 100);

    // Fixed timestep physics update
    this.physicsAccumulator += deltaMs;
    while (this.physicsAccumulator >= this.physicsStep) {
      this.physics.update(this.physicsStep);
      this.physicsAccumulator -= this.physicsStep;
    }

    // Entity updates
    if (this.player) this.player.update(deltaMs);
    if (this.enemy) this.enemy.update(deltaMs);

    // Combat checks
    if (this.state === 'PLAYING') {
      if (this.player && this.enemy) {
        this.combat.processHitCheck(this.player, this.enemy);
        this.combat.processHitCheck(this.enemy, this.player);
      }

      // Check match victory / defeat condition
      if (this.enemy && this.enemy.isKnockedOut) {
        this.state = 'ROUND_OVER';
        this.roundOverTimer = 1400; // Allow 1.4s of ragdoll tumble
        this.winner = 'player';
      } else if (this.player && this.player.isKnockedOut) {
        this.state = 'ROUND_OVER';
        this.roundOverTimer = 1400;
        this.winner = 'enemy';
      }
    } else if (this.state === 'ROUND_OVER') {
      this.roundOverTimer -= deltaMs;
      if (this.roundOverTimer <= 0) {
        this.ui.showGameOver(this.winner);
      }
    }

    // FX Updates
    this.combat.update(deltaMs / 1000);
    this.updateScreenShake(deltaMs);
    this.ui.updateHealth();

    // Render frame
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    ctx.save();
    // Apply camera screen shake offset
    ctx.translate(this.shakeOffsetX, this.shakeOffsetY);

    // 1. Draw Clean Arena Background
    this.drawArena(ctx);

    // 2. Draw Entities
    if (this.player) this.player.draw(ctx);
    if (this.enemy) this.enemy.draw(ctx);

    // 3. Draw Combat Particles & Floating Texts
    this.combat.draw(ctx);

    ctx.restore();
  }

  drawArena(ctx) {
    const w = this.width;
    const h = this.height;
    const groundY = this.physics.groundY;

    // Atmospheric gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#0c1017');
    bgGrad.addColorStop(0.5, '#141a24');
    bgGrad.addColorStop(1, '#080a0f');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Arena Spotlight Cone
    ctx.save();
    const spotGrad = ctx.createRadialGradient(w / 2, 80, 50, w / 2, groundY, 480);
    spotGrad.addColorStop(0, 'rgba(56, 189, 248, 0.08)');
    spotGrad.addColorStop(0.7, 'rgba(30, 41, 59, 0.04)');
    spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = spotGrad;
    ctx.fillRect(0, 0, w, groundY);
    ctx.restore();

    // Boxing Ring Ropes (minimal stylized back & front ropes)
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 3;
    const ropeHeights = [groundY - 140, groundY - 95, groundY - 50];
    ropeHeights.forEach((ry) => {
      ctx.beginPath();
      ctx.moveTo(140, ry);
      ctx.lineTo(w - 140, ry);
      ctx.stroke();
    });

    // Ring corner posts
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    // Left post
    ctx.fillRect(130, groundY - 170, 16, 170);
    ctx.strokeRect(130, groundY - 170, 16, 170);
    // Right post
    ctx.fillRect(w - 146, groundY - 170, 16, 170);
    ctx.strokeRect(w - 146, groundY - 170, 16, 170);

    // Post pads (Cyan on player side, Red on enemy side)
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(126, groundY - 165, 24, 28);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(w - 150, groundY - 165, 24, 28);
    ctx.restore();

    // Arena Platform / Canvas Floor
    const floorGrad = ctx.createLinearGradient(0, groundY, 0, h);
    floorGrad.addColorStop(0, '#1e293b');
    floorGrad.addColorStop(0.08, '#0f172a');
    floorGrad.addColorStop(1, '#020617');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, groundY, w, h - groundY);

    // Ring top edge highlight line
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(w, groundY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Arena center ring decal
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(w / 2, groundY + 30, 180, 24, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}
