/**
 * Game Orchestrator: manages fixed timestep physics updates, side-scrolling camera,
 * entity updates, projectile combat collisions, responsive letterbox resizing,
 * and game state transitions (Play, Pause, Defeat).
 */
class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Base internal resolution
    this.width = 1280;
    this.height = 720;

    // Game stats
    this.score = 0;
    this.kills = 0;
    this.isPaused = false;
    this.isGameOver = false;

    // Screen Shake
    this.screenShakeIntensity = 0;

    // Input Tracking
    this.inputKeys = {};
    this.mouse = { x: this.width / 2, y: this.height / 2, isDown: false };

    // Core Systems
    this.camera = new Camera(this.width, this.height);
    this.physics = new PhysicsManager(4800, 1400);
    this.combat = new CombatManager(this);
    this.level = new LevelManager(this, 4800, 1400);
    this.pickups = new PickupManager(this);
    this.ui = new UIManager(this);

    // Entities
    this.player = null;
    this.enemies = [];
    this.waveManager = new EnemyWaveManager(this);

    // Timing
    this.lastTime = performance.now();
    this.physicsAccumulator = 0;
    this.physicsStep = 1000 / 60; // 16.66ms fixed timestep

    this.initEntities();
    this.setupInputs();
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
  }

  initEntities() {
    this.player = new Player(this, 300, 1150);
    this.enemies = [];
    this.waveManager.reset();
  }

  setupInputs() {
    const unlockAudio = () => {
      this.combat.sfx.init();
      this.combat.sfx.resume();
    };

    window.addEventListener('pointerdown', unlockAudio, { once: true });

    // Keyboard
    window.addEventListener('keydown', (e) => {
      unlockAudio();

      if (['Space', 'KeyA', 'KeyD', 'ShiftLeft', 'ShiftRight', 'KeyE', 'KeyR'].includes(e.code)) {
        if (e.code === 'Space') e.preventDefault();
      }

      this.inputKeys[e.code] = true;
      this.updateKeyBadge(e.code, true);

      // Pause toggle (ESC)
      if (e.code === 'Escape') {
        this.togglePause();
        return;
      }

      if (!this.isPaused && !this.isGameOver && this.player) {
        this.player.handleKeyDown(e.code);
      }
    });

    window.addEventListener('keyup', (e) => {
      this.inputKeys[e.code] = false;
      this.updateKeyBadge(e.code, false);
    });

    // Mouse aiming & shooting
    const updateMousePos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.width / rect.width;
      const scaleY = this.height / rect.height;
      this.mouse.x = (e.clientX - rect.left) * scaleX;
      this.mouse.y = (e.clientY - rect.top) * scaleY;
    };

    this.canvas.addEventListener('mousemove', updateMousePos);

    this.canvas.addEventListener('mousedown', (e) => {
      unlockAudio();
      if (e.button === 0) {
        this.mouse.isDown = true;
        this.updateKeyBadge('LMB', true);
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.mouse.isDown = false;
        this.updateKeyBadge('LMB', false);
      }
    });

    // Prevent context menu
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  updateKeyBadge(code, isActive) {
    let id = null;
    if (code === 'KeyA') id = 'key-A';
    else if (code === 'KeyD') id = 'key-D';
    else if (code === 'Space') id = 'key-Space';
    else if (code === 'ShiftLeft' || code === 'ShiftRight') id = 'key-Shift';
    else if (code === 'KeyE') id = 'key-E';
    else if (code === 'Escape') id = 'key-Esc';
    else if (code === 'LMB') id = 'key-LMB';

    if (id) {
      const el = document.getElementById(id);
      if (el) {
        if (isActive) el.classList.add('active');
        else el.classList.remove('active');
      }
    }
  }

  handleResize() {
    const container = document.getElementById('canvas-container');
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

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
    this.screenShakeIntensity = Math.min(26, this.screenShakeIntensity + intensity);
  }

  updateScreenShake(deltaMs) {
    if (this.screenShakeIntensity > 0) {
      const angle = Math.random() * Math.PI * 2;
      this.camera.shakeOffsetX = Math.cos(angle) * this.screenShakeIntensity;
      this.camera.shakeOffsetY = Math.sin(angle) * this.screenShakeIntensity;
      this.screenShakeIntensity *= Math.pow(0.85, deltaMs / 16.6);
      if (this.screenShakeIntensity < 0.2) {
        this.screenShakeIntensity = 0;
        this.camera.shakeOffsetX = 0;
        this.camera.shakeOffsetY = 0;
      }
    } else {
      this.camera.shakeOffsetX = 0;
      this.camera.shakeOffsetY = 0;
    }
  }

  togglePause() {
    if (this.isGameOver) return;
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.ui.showPauseMenu();
    } else {
      this.ui.hideModal();
    }
  }

  resume() {
    this.isPaused = false;
    this.ui.hideModal();
  }

  restart() {
    this.isPaused = false;
    this.isGameOver = false;
    this.score = 0;
    this.kills = 0;

    this.physics.reset();
    this.combat.reset();
    this.pickups.reset();
    this.initEntities();
    this.ui.reset();
  }

  onEnemyKilled(x, y, scoreVal) {
    this.score += scoreVal;
    this.kills += 1;
    this.ui.updateScoreAndKills(this.score, this.kills);

    // 35% chance to drop weapon pickup
    if (Math.random() < 0.35) {
      this.pickups.spawnWeaponPickup(x, y, 'SCATTER_GUN');
    }
  }

  onPlayerDefeated() {
    this.isGameOver = true;
    setTimeout(() => {
      this.ui.showDefeatScreen();
    }, 1200);
  }

  start() {
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  loop(currentTime) {
    const elapsed = currentTime - this.lastTime;
    this.lastTime = currentTime;

    const deltaMs = Math.min(elapsed, 100);

    if (!this.isPaused) {
      // 1. Fixed Timestep Physics Update
      this.physicsAccumulator += deltaMs;
      while (this.physicsAccumulator >= this.physicsStep) {
        this.physics.update(this.physicsStep);
        this.physicsAccumulator -= this.physicsStep;
      }

      // 2. Entity & System Updates
      if (this.player) this.player.update(deltaMs);

      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const e = this.enemies[i];
        if (e.isDead) {
          this.enemies.splice(i, 1);
        } else {
          e.update(deltaMs);
        }
      }

      this.waveManager.update(deltaMs);
      this.combat.update(deltaMs);
      this.pickups.update(deltaMs);

      // 3. Camera Follows Player
      if (this.player && this.player.body) {
        const pPos = this.player.body.position;
        this.camera.follow(pPos.x, pPos.y, this.player.facing, deltaMs);
      }

      this.updateScreenShake(deltaMs);

      // 4. Update UI
      if (this.player) {
        this.ui.updateHealth();
        this.ui.updatePickupPrompt(this.pickups.activePromptPickup);
      }
    }

    // 5. Render Scene
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Render Level Parallax Backgrounds & Platforms
    this.level.draw(ctx, this.camera);

    // 2. Render World Objects in Camera Frame
    ctx.save();
    this.camera.applyTransform(ctx);

    // Dead ragdolls tumbling on platforms
    this.physics.drawRagdolls(ctx, this.camera);

    // Pickups
    this.pickups.draw(ctx, this.camera);

    // Enemies
    for (let i = 0; i < this.enemies.length; i++) {
      this.enemies[i].draw(ctx, this.camera);
    }

    // Player
    if (this.player) {
      this.player.draw(ctx, this.camera);
    }

    // Bullets, Particles, Damage Texts
    this.combat.draw(ctx, this.camera);

    ctx.restore();

    // 3. Render Tactical Screen Radar Chevrons for Offscreen Threats
    this.drawOffscreenIndicators(ctx);
  }

  drawOffscreenIndicators(ctx) {
    if (!this.player || this.player.isKnockedOut) return;

    const margin = 26;
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    ctx.save();
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.isDead || !e.body) continue;

      const screenPos = this.camera.worldToScreen(e.body.position.x, e.body.position.y);
      const isOffscreen = (
        screenPos.x < margin ||
        screenPos.x > this.width - margin ||
        screenPos.y < margin ||
        screenPos.y > this.height - margin
      );

      if (!isOffscreen) continue;

      const angle = Math.atan2(screenPos.y - centerY, screenPos.x - centerX);
      const edgeDistX = (this.width / 2) - margin;
      const edgeDistY = (this.height / 2) - margin;

      let indX = centerX + Math.cos(angle) * edgeDistX;
      let indY = centerY + Math.sin(angle) * edgeDistY;

      indX = Math.max(margin, Math.min(this.width - margin, indX));
      indY = Math.max(margin, Math.min(this.height - margin, indY));

      // Draw red chevron
      ctx.save();
      ctx.translate(indX, indY);
      ctx.rotate(angle);

      ctx.fillStyle = e.type === 'drone' ? '#f59e0b' : '#ef4444';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 8;

      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(-6, -7);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-6, 7);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
    ctx.restore();
  }
}
