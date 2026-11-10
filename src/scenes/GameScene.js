/**
 * GameScene: Primary prehistoric jungle combat arena ("Mossy Canopy").
 * Viewport: 1280x720 Widescreen Landscape (16:9).
 * Features:
 * - Widescreen arena framing: Left Island (Player), Right Island (Enemy), Central Chasm (560px gap).
 * - Multi-layered atmospheric prehistoric jungle environment with canopy vines and chasm mist.
 * - Active Matter.js 2D physics simulation with gravity y = 1.25.
 * - Hero Gloop and initial Goblin rival with soft grounding drop-shadows.
 * - Slingshot drag-to-aim input pipeline (mouse & touch).
 * - Visual slingshot elastic band and parabolic dotted trajectory arc.
 * - Dynamic projectile launching with physical mass, velocity & spin.
 * - Kinetic knockback impulse, floating damage numbers, and continuous kill tracking.
 */
class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this.kills = data.kills || 0;
    this.score = data.score || 0;
    this.previewAim = (data && data.previewAim) || false;
    this.initialWeaponClass = (data && data.weaponClass) || 'slingshot';
    this.playerHealth = 100;
    this.enemyHealth = 45;
    this.maxEnemyHealth = 45;
    this.spores = [];
    this.isAiming = false;
    this.canLaunch = true;
    this.activeProjectiles = [];
  }

  create() {
    try {
      const { width, height } = this.scale;

      // 1. Layered Prehistoric Jungle Environment
      this.bg = this.add.graphics();
      this.drawLayeredJungle(width, height);

      // 2. Floating Bioluminescent Jungle Spores
      this.createAmbientSpores(width, height);

      // 3. Abyss Bottom Boundary Sensor
      this.abyssY = height - 10;
      this.abyssSensor = this.matter.add.rectangle(width / 2, this.abyssY, width * 2, 40, {
        isStatic: true,
        isSensor: true,
        label: 'abyss_sensor'
      });

      // 4. Platform Geometry for 1280x720 Widescreen
      const perchY = 540;
      this.perchY = perchY;
      const playerPerchX = 220;
      const enemyPerchX = width - 220;
      this.playerPerchX = playerPerchX;
      this.enemyPerchX = enemyPerchX;

      // Grounding Drop-Shadows
      this.playerShadow = this.add.image(playerPerchX, perchY - 58, 'character_shadow').setAlpha(0.65).setDepth(3);
      this.enemyShadow = this.add.image(enemyPerchX, perchY - 58, 'character_shadow').setAlpha(0.65).setDepth(3);

      // Left Floating Island (Player Perch Matter Sprite)
      this.playerPerch = this.matter.add.sprite(playerPerchX, perchY, 'island_perch', null, {
        isStatic: true,
        friction: 0.85,
        label: 'island_player'
      });
      this.playerPerch.setDepth(2);

      // Right Floating Island (Enemy Perch Matter Sprite)
      this.enemyPerch = this.matter.add.sprite(enemyPerchX, perchY, 'island_perch', null, {
        isStatic: true,
        friction: 0.85,
        label: 'island_enemy'
      });
      this.enemyPerch.setDepth(2);

      // 5. Hero Champion: "Gloop" (RagdollCreature with Active Balance Torque)
      this.launchAnchor = { x: playerPerchX + 15, y: perchY - 145 };
      this.player = new RagdollCreature(this, playerPerchX, perchY - 145, 'gloop', {
        isPlayer: true,
        health: this.playerHealth
      });
      this.playerCreature = this.player.sprite;

      // 6. Rival Enemy: "Giggle-Goblin" (RagdollCreature)
      this.spawnEnemyCreature(enemyPerchX, perchY - 145);

      // 7. Foreground Hanging Canopy Foliage
      this.fgCanopy = this.add.graphics().setDepth(10);
      this.drawForegroundCanopy(width);

      // 8. Visual Bow, Arrow Preview, Slingshot Band & Trajectory System
      this.slingBand = this.add.graphics().setDepth(18);
      this.bowSprite = this.add.sprite(0, 0, 'weapon_bow').setVisible(false).setDepth(19);
      this.arrowPreview = this.add.sprite(0, 0, 'projectile_arrow').setVisible(false).setDepth(20);
      this.enemyTelegraph = this.add.graphics().setDepth(17);
      this.trajectory = new Trajectory(this);

      // 9. Input Pipeline: Mouse/Touch Drag-to-Aim
      this.input.on('pointerdown', this.handlePointerDown, this);
      this.input.on('pointermove', this.handlePointerMove, this);
      this.input.on('pointerup', this.handlePointerUp, this);

      // 10. Matter.js Collision Handling
      this.matter.world.on('collisionstart', this.handleCollisions, this);

      // 11. Launch UI Overlay
      this.scene.launch('UIScene', {
        kills: this.kills,
        score: this.score,
        playerHealth: this.playerHealth,
        enemyHealth: this.enemyHealth
      });

      this.scale.on('resize', this.handleResize, this);
      this.events.once('shutdown', () => {
        this.scale.off('resize', this.handleResize, this);
        this.matter.world.off('collisionstart', this.handleCollisions, this);
        if (this.enemyCounterTimer) this.enemyCounterTimer.remove(false);
      });

      this.cameras.main.fadeIn(300, 5, 15, 26);

      // Instant preview aim setup if configured
      if (this.previewAim || (this.game.config && this.game.config.previewAim)) {
        this.isAiming = true;
        this.updateAim({ x: this.launchAnchor.x - 95, y: this.launchAnchor.y + 55 });
      }
    } catch (err) {
      console.error('GameScene create error:', err);
    }
  }

  update(time, delta) {
    if (this.player) this.player.update(time, delta);
    if (this.enemy) this.enemy.update(time, delta);

    if (this.player && this.player.sprite) {
      this.launchAnchor = {
        x: this.player.sprite.x + 18,
        y: this.player.sprite.y - 12
      };
    }
  }

  getWeaponClass() {
    const ui = this.scene.get('UIScene');
    return (ui && ui.activeWeaponClass) ? ui.activeWeaponClass : 'slingshot';
  }

  spawnEnemyCreature(x, y) {
    if (this.enemy) {
      this.enemy.destroy();
      this.enemy = null;
    }

    this.enemyHealth = this.maxEnemyHealth;
    this.isEnemyDefeated = false;

    this.enemy = new RagdollCreature(this, x, y, 'goblin', {
      isPlayer: false,
      flipX: true,
      health: this.maxEnemyHealth
    });
    this.enemyCreature = this.enemy.sprite;

    // Entrance pop tween
    this.enemy.sprite.setScale(0.1);
    this.tweens.add({
      targets: this.enemy.sprite,
      scaleX: -1.0,
      scaleY: 1.0,
      duration: 350,
      ease: 'Back.easeOut'
    });

    // Update enemy health bar in UI
    const ui = this.scene.get('UIScene');
    if (ui && ui.enemyHealthUI) {
      ui.enemyHealthUI.updateFill(this.enemyHealth, this.maxEnemyHealth);
      ui.enemyHealthUI.hpText.setText(`${this.enemyHealth}/${this.maxEnemyHealth} HP`);
    }

    // Schedule next enemy counter-attack
    this.scheduleEnemyCounterAttack();
  }

  handlePointerDown(pointer) {
    if (!this.canLaunch || this.isAiming) return;

    // Allow aiming if clicking anywhere on the left half of the screen
    if (pointer.x < this.scale.width * 0.48) {
      this.isAiming = true;
      this.updateAim(pointer);
    }
  }

  handlePointerMove(pointer) {
    if (!this.isAiming) return;
    this.updateAim(pointer);
  }

  handlePointerUp(pointer) {
    if (!this.isAiming) return;
    this.isAiming = false;
    this.slingBand.clear();
    this.trajectory.hide();

    // Calculate launch impulse vector
    const anchor = this.launchAnchor;
    const dx = anchor.x - pointer.x;
    const dy = anchor.y - pointer.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Minimum drag threshold to prevent misclicks
    if (dist < 18) {
      if (this.bowSprite) this.bowSprite.setVisible(false);
      if (this.arrowPreview) this.arrowPreview.setVisible(false);
      return;
    }

    // Clamp maximum pull distance
    const maxPull = 140;
    const clampedDist = Math.min(dist, maxPull);
    const angle = Math.atan2(dy, dx);

    const wClass = this.getWeaponClass();
    const speedMult = wClass === 'bow' ? 0.34 : 0.22;
    const speed = clampedDist * speedMult;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    // Launch active projectile or arrow
    this.launchProjectile(vx, vy);
  }

  updateAim(pointer) {
    const anchor = this.launchAnchor;
    const dx = anchor.x - pointer.x;
    const dy = anchor.y - pointer.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const maxPull = 140;
    const clampedDist = Math.min(dist, maxPull);
    const angle = Math.atan2(dy, dx);

    const pullX = anchor.x - Math.cos(angle) * clampedDist;
    const pullY = anchor.y - Math.sin(angle) * clampedDist;

    const wClass = this.getWeaponClass();

    if (wClass === 'bow') {
      // Bow & Arrow Mode
      const speed = clampedDist * 0.34;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      // Position Bow Sprite at Gloop's hands
      if (this.bowSprite) {
        this.bowSprite.setPosition(anchor.x + 8, anchor.y);
        this.bowSprite.setRotation(angle - Math.PI / 2);
        this.bowSprite.setVisible(true);
      }

      // Draw Taut Bowstring connecting bow tips to pull point
      this.slingBand.clear();
      this.slingBand.lineStyle(2, 0xe2e8f0, 0.95);

      const tipDist = 34;
      const topTipX = (anchor.x + 8) + Math.cos(angle - Math.PI / 2 - 0.65) * tipDist;
      const topTipY = anchor.y + Math.sin(angle - Math.PI / 2 - 0.65) * tipDist;
      const botTipX = (anchor.x + 8) + Math.cos(angle - Math.PI / 2 + 0.65) * tipDist;
      const botTipY = anchor.y + Math.sin(angle - Math.PI / 2 + 0.65) * tipDist;

      this.slingBand.beginPath();
      this.slingBand.moveTo(topTipX, topTipY);
      this.slingBand.lineTo(pullX, pullY);
      this.slingBand.lineTo(botTipX, botTipY);
      this.slingBand.strokePath();

      // Nocked Flint Arrow Preview
      if (this.arrowPreview) {
        this.arrowPreview.setPosition(pullX + Math.cos(angle) * 22, pullY + Math.sin(angle) * 22);
        this.arrowPreview.setRotation(angle);
        this.arrowPreview.setVisible(true);
      }

      // Flatter, faster trajectory arc
      if (clampedDist > 18) {
        this.trajectory.show(anchor.x, anchor.y, vx, vy, 0.28);
      } else {
        this.trajectory.hide();
      }
    } else {
      // Slingshot Mode
      if (this.bowSprite) this.bowSprite.setVisible(false);
      if (this.arrowPreview) this.arrowPreview.setVisible(false);

      const speed = clampedDist * 0.22;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      // 1. Draw Visual Slingshot Elastic Rubber Band
      this.slingBand.clear();
      this.slingBand.lineStyle(3.5, 0xca8a04, 0.95);
      // Upper band
      this.slingBand.beginPath();
      this.slingBand.moveTo(anchor.x - 14, anchor.y - 8);
      this.slingBand.lineTo(pullX, pullY);
      this.slingBand.strokePath();
      // Lower band
      this.slingBand.beginPath();
      this.slingBand.moveTo(anchor.x + 14, anchor.y + 6);
      this.slingBand.lineTo(pullX, pullY);
      this.slingBand.strokePath();

      // Loaded projectile preview at pull point
      const ui = this.scene.get('UIScene');
      const activeWpn = (ui && ui.activeWeapon) ? ui.activeWeapon : 'boulder';

      this.slingBand.fillStyle(0xf59e0b, 1);
      this.slingBand.fillCircle(pullX, pullY, 7);

      // 2. Render Parabolic Dotted Trajectory Arc
      if (clampedDist > 18) {
        this.trajectory.show(anchor.x, anchor.y, vx, vy, 0.42);
      } else {
        this.trajectory.hide();
      }
    }
  }

  launchProjectile(vx, vy) {
    this.canLaunch = false;
    if (this.bowSprite) this.bowSprite.setVisible(false);
    if (this.arrowPreview) this.arrowPreview.setVisible(false);

    const wClass = this.getWeaponClass();

    if (wClass === 'bow') {
      // Launch Ballistic Flint Arrow
      const arrow = new Arrow(this, this.launchAnchor.x, this.launchAnchor.y, { x: vx, y: vy }, 'player');
      this.activeProjectiles.push(arrow);
    } else {
      // Launch Slingshot Ammo
      const ui = this.scene.get('UIScene');
      const weaponType = (ui && ui.activeWeapon) ? ui.activeWeapon : 'boulder';
      const proj = new Projectile(this, this.launchAnchor.x, this.launchAnchor.y, weaponType, { x: vx, y: vy });
      this.activeProjectiles.push(proj);
    }

    // Gloop launch recoil squash
    if (this.player && this.player.sprite) {
      this.tweens.add({
        targets: this.player.sprite,
        scaleX: 1.15,
        scaleY: 0.88,
        duration: 100,
        yoyo: true,
        ease: 'Quad.easeInOut'
      });
    }

    // Cooldown before next shot can be charged
    this.time.delayedCall(500, () => {
      this.canLaunch = true;
    });
  }

  handleCollisions(event) {
    const pairs = event.pairs;

    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i];
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;

      // Identify projectile and target
      let projBody = null;
      let otherBody = null;

      if (bodyA.label && (bodyA.label.startsWith('projectile_'))) {
        projBody = bodyA;
        otherBody = bodyB;
      } else if (bodyB.label && (bodyB.label.startsWith('projectile_'))) {
        projBody = bodyB;
        otherBody = bodyA;
      }

      if (projBody && otherBody) {
        const projectile = projBody.gameObject ? (projBody.gameObject.projectileRef || projBody.gameObject.arrowRef) : null;

        // Collision with Enemy Creature
        if (otherBody.label === 'creature_enemy') {
          if (projectile && !projectile.hasCollided && (!projectile.isEnemyProjectile)) {
            const hitTarget = this.enemy || otherBody.gameObject;
            projectile.onHit(hitTarget, pair);
          }
        }
        // Collision with Player Hero Creature (Enemy Counter-Attack hit)
        else if (otherBody.label === 'creature_player') {
          if (projectile && !projectile.hasCollided && projectile.isEnemyProjectile) {
            const hitTarget = this.player || otherBody.gameObject;
            projectile.onHit(hitTarget, pair);

            if (this.playerHealth <= 0) {
              this.triggerPlayerDefeat();
            }
          }
        }
        // Collision with Abyss Sensor
        else if (otherBody.label === 'abyss_sensor') {
          if (projectile) {
            projectile.destroy();
          }
        }
      }
    }
  }

  handleCombatHit(projectile, targetCreature, options = {}) {
    const damage = options.damage || (projectile.config ? projectile.config.damage : 22);
    this.enemyHealth = Math.max(0, this.enemyHealth - damage);

    // Floating Damage Number
    const targetX = targetCreature.x || (this.enemy ? this.enemy.sprite.x : 1060);
    const targetY = targetCreature.y || (this.enemy ? this.enemy.sprite.y : 395);
    const textLabel = options.isHeadshot ? `💥 CRIT -${damage}` : `-${damage}`;
    this.spawnDamagePopup(targetX, targetY - 45, textLabel, options.isHeadshot);

    // Update Enemy Health bar in UIScene
    const ui = this.scene.get('UIScene');
    if (ui && ui.enemyHealthUI) {
      ui.enemyHealthUI.updateFill(this.enemyHealth, this.maxEnemyHealth);
      ui.enemyHealthUI.hpText.setText(`${this.enemyHealth}/${this.maxEnemyHealth} HP`);
    }

    // Camera micro-shake
    this.cameras.main.shake(options.isHeadshot ? 160 : 120, options.isHeadshot ? 0.007 : 0.005);

    // Score increment
    this.score += damage * 5 + (options.isHeadshot ? 50 : 0);
    if (ui) ui.setScore(this.score);

    // Check Enemy Defeat
    if (this.enemyHealth <= 0 && !this.isEnemyDefeated) {
      this.triggerEnemyDefeat(targetCreature);
    }
  }

  spawnDamagePopup(x, y, text, isCrit = false) {
    const popup = this.add.text(x, y, text, {
      fontFamily: 'sans-serif',
      fontSize: isCrit ? '26px' : '23px',
      fontWeight: '900',
      color: isCrit ? '#fbbf24' : '#f43f5e',
      stroke: '#0f172a',
      strokeThickness: isCrit ? 6 : 4
    }).setOrigin(0.5).setDepth(30);

    this.tweens.add({
      targets: popup,
      y: y - 55,
      alpha: 0,
      scale: isCrit ? 1.35 : 1.25,
      duration: isCrit ? 1000 : 800,
      ease: 'Back.easeOut',
      onComplete: () => popup.destroy()
    });
  }

  triggerEnemyDefeat(creature) {
    this.isEnemyDefeated = true;
    this.kills++;

    // Cancel pending enemy counter-attacks
    if (this.enemyCounterTimer) {
      this.enemyCounterTimer.remove(false);
      this.enemyCounterTimer = null;
    }
    if (this.enemyTelegraph) {
      this.enemyTelegraph.clear();
    }

    // Update Kills in UI & trigger Bow & Arrow unlock check
    const ui = this.scene.get('UIScene');
    if (ui) {
      ui.setKills(this.kills);
      this.score += 150;
      ui.setScore(this.score);
    }

    const enemyX = (this.enemy && this.enemy.sprite) ? this.enemy.sprite.x : (creature ? creature.x : 1060);
    const enemyY = (this.enemy && this.enemy.sprite) ? this.enemy.sprite.y : (creature ? creature.y : 395);

    // Floating "+1 KILL!" badge
    const killNotice = this.add.text(enemyX, enemyY - 80, '💀 +1 KILL!', {
      fontFamily: 'sans-serif',
      fontSize: '22px',
      fontWeight: '900',
      color: '#fbbf24',
      stroke: '#451a03',
      strokeThickness: 5
    }).setOrigin(0.5).setDepth(30);

    this.tweens.add({
      targets: killNotice,
      y: enemyY - 130,
      alpha: 0,
      scale: 1.3,
      duration: 1000,
      ease: 'Back.easeOut',
      onComplete: () => killNotice.destroy()
    });

    // Ragdoll defeat tumble into the chasm
    if (this.enemy) {
      this.enemy.knockout({ x: 0.018, y: -0.014 });
    } else if (creature && creature.body) {
      this.matter.body.applyForce(creature.body, creature.body.position, {
        x: -0.015,
        y: -0.012
      });
      this.matter.body.setAngularVelocity(creature.body, 0.18);
    }

    // Seamless automatic next enemy spawn after 1.2s defeat animation
    this.time.delayedCall(1200, () => {
      this.spawnEnemyCreature(this.enemyPerchX, this.perchY - 145);
    });
  }

  scheduleEnemyCounterAttack() {
    if (this.enemyCounterTimer) {
      this.enemyCounterTimer.remove(false);
      this.enemyCounterTimer = null;
    }

    // Grunt counter-attack interval: 3.5 to 5.0 seconds
    const delay = 3500 + Math.random() * 1500;
    this.enemyCounterTimer = this.time.delayedCall(delay, () => {
      if (this.enemy && !this.enemy.isRagdoll && !this.isEnemyDefeated && this.player && !this.player.isDead) {
        this.executeEnemyCounterAttack();
      }
    });
  }

  executeEnemyCounterAttack() {
    if (!this.enemy || !this.enemy.sprite || this.enemy.isRagdoll) return;

    const startX = this.enemy.sprite.x - 20;
    const startY = this.enemy.sprite.y - 12;
    const targetX = this.player ? this.player.sprite.x : 220;
    const targetY = this.player ? this.player.sprite.y : 395;

    // Telegraph: Subtle red aiming warning arc for 1.1s
    this.enemyTelegraph.clear();
    this.enemyTelegraph.lineStyle(2, 0xf43f5e, 0.65);
    this.enemyTelegraph.lineBetween(startX, startY, targetX, targetY);

    this.tweens.add({
      targets: this.enemyTelegraph,
      alpha: 0.2,
      duration: 250,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.enemyTelegraph.clear();
        this.enemyTelegraph.setAlpha(1);

        if (this.enemy && !this.enemy.isRagdoll && !this.isEnemyDefeated) {
          // Launch counter-projectile towards Gloop
          const dx = targetX - startX;
          const dy = targetY - startY;
          const speed = 19 + Math.random() * 2.5;
          const angle = Math.atan2(dy, dx) - 0.24; // Lofted ballistic angle

          const vx = Math.cos(angle) * speed;
          const vy = Math.sin(angle) * speed;

          const counterProj = new Projectile(this, startX, startY, 'boulder', { x: vx, y: vy });
          counterProj.isEnemyProjectile = true;
          this.activeProjectiles.push(counterProj);

          // Goblin recoil flinch
          if (this.enemy && this.enemy.sprite) {
            this.tweens.add({
              targets: this.enemy.sprite,
              scaleX: -1.15,
              scaleY: 0.88,
              duration: 100,
              yoyo: true,
              ease: 'Quad.easeInOut'
            });
          }

          // Reschedule next attack
          this.scheduleEnemyCounterAttack();
        }
      }
    });
  }

  triggerPlayerDefeat() {
    if (this.isPlayerDefeated) return;
    this.isPlayerDefeated = true;

    // Disconnect enemy timer
    if (this.enemyCounterTimer) {
      this.enemyCounterTimer.remove(false);
      this.enemyCounterTimer = null;
    }

    if (this.player) {
      this.player.knockout({ x: -0.018, y: -0.014 });
    }

    // Save Personal Best in localStorage
    try {
      const bestKills = parseInt(localStorage.getItem('monster_knockout_best_kills') || '0', 10);
      if (this.kills > bestKills) {
        localStorage.setItem('monster_knockout_best_kills', String(this.kills));
      }
      const bestScore = parseInt(localStorage.getItem('monster_knockout_best_score') || '0', 10);
      if (this.score > bestScore) {
        localStorage.setItem('monster_knockout_best_score', String(this.score));
      }
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }

    // Delayed restart modal or scene restart
    this.time.delayedCall(1600, () => {
      this.cameras.main.fadeOut(400, 5, 15, 26);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.stop('UIScene');
        this.scene.start('MenuScene');
      });
    });
  }

  drawLayeredJungle(w, h) {
    this.bg.clear();

    // Layer 1: Atmospheric Prehistoric Twilight Sky
    this.bg.fillStyle(0x040d18, 1);
    this.bg.fillRect(0, 0, w, h);

    // Ambient Jungle Glow (upper center)
    this.bg.fillStyle(0x0a242c, 0.7);
    this.bg.fillCircle(w / 2, h * 0.35, Math.min(w, h) * 0.6);

    this.bg.fillStyle(0x0d383b, 0.45);
    this.bg.fillCircle(w * 0.8, h * 0.25, Math.min(w, h) * 0.45);

    // Layer 2: Distant Prehistoric Mountain Ridges & Canopy
    this.bg.fillStyle(0x071e24, 0.9);
    this.bg.beginPath();
    this.bg.moveTo(0, h * 0.58);
    this.bg.lineTo(w * 0.18, h * 0.50);
    this.bg.lineTo(w * 0.38, h * 0.54);
    this.bg.lineTo(w * 0.62, h * 0.48);
    this.bg.lineTo(w * 0.85, h * 0.52);
    this.bg.lineTo(w, h * 0.46);
    this.bg.lineTo(w, h);
    this.bg.lineTo(0, h);
    this.bg.closePath();
    this.bg.fillPath();

    // Midground Jungle Canopy Horizon
    this.bg.fillStyle(0x062828, 0.95);
    this.bg.beginPath();
    this.bg.moveTo(0, h * 0.62);
    for (let x = 0; x <= w + 40; x += 60) {
      const peakY = h * 0.60 + Math.sin(x * 0.012) * 20;
      this.bg.lineTo(x, peakY);
    }
    this.bg.lineTo(w, h);
    this.bg.lineTo(0, h);
    this.bg.closePath();
    this.bg.fillPath();

    // Layer 3: Towering Ancient Jungle Trees (Left & Right Flanks)
    // Left Tree Trunk & Branch
    this.bg.fillStyle(0x021616, 0.95);
    this.bg.beginPath();
    this.bg.moveTo(-30, h * 0.10);
    this.bg.lineTo(90, h * 0.10);
    this.bg.lineTo(110, h * 0.55);
    this.bg.lineTo(70, h * 0.85);
    this.bg.lineTo(-30, h * 0.85);
    this.bg.closePath();
    this.bg.fillPath();
    this.bg.fillCircle(105, h * 0.18, 65);
    this.bg.fillCircle(135, h * 0.28, 55);

    // Right Tree Trunk & Branch
    this.bg.beginPath();
    this.bg.moveTo(w + 30, h * 0.08);
    this.bg.lineTo(w - 90, h * 0.08);
    this.bg.lineTo(w - 110, h * 0.52);
    this.bg.lineTo(w - 70, h * 0.85);
    this.bg.lineTo(w + 30, h * 0.85);
    this.bg.closePath();
    this.bg.fillPath();
    this.bg.fillCircle(w - 105, h * 0.16, 68);
    this.bg.fillCircle(w - 135, h * 0.26, 58);

    // Layer 4: Dramatic Central Chasm Depth (Between Islands)
    this.bg.fillStyle(0x020810, 0.98);
    this.bg.fillRect(0, h * 0.72, w, h * 0.28);

    // Rising Volumetric Chasm Mist
    this.bg.fillStyle(0x0d9488, 0.08);
    this.bg.fillCircle(w / 2, h * 0.78, Math.min(w, h) * 0.45);

    this.bg.fillStyle(0x10b981, 0.06);
    this.bg.fillCircle(w / 2, h * 0.84, Math.min(w, h) * 0.35);

    // Hanging ancient suspension vine rope bridging across the wide chasm
    this.bg.lineStyle(3, 0x064e3b, 0.45);
    this.bg.beginPath();
    for (let x = w * 0.22; x <= w * 0.78; x += 20) {
      const t = (x - w * 0.22) / (w * 0.56);
      const sag = Math.sin(t * Math.PI) * 60;
      const y = h * 0.68 + sag;
      if (x === w * 0.22) this.bg.moveTo(x, y);
      else this.bg.lineTo(x, y);
    }
    this.bg.strokePath();

    this.bg.lineStyle(2, 0x047857, 0.35);
    this.bg.beginPath();
    for (let x = w * 0.26; x <= w * 0.74; x += 20) {
      const t = (x - w * 0.26) / (w * 0.48);
      const sag = Math.sin(t * Math.PI) * 48;
      const y = h * 0.71 + sag;
      if (x === w * 0.26) this.bg.moveTo(x, y);
      else this.bg.lineTo(x, y);
    }
    this.bg.strokePath();

    // Layer 5: Soft Atmospheric God Rays (Sunlight streaming from upper canopy)
    this.bg.fillStyle(0xa7f3d0, 0.04);
    this.bg.beginPath();
    this.bg.moveTo(w * 0.85, 0);
    this.bg.lineTo(w * 0.95, 0);
    this.bg.lineTo(w * 0.50, h * 0.75);
    this.bg.lineTo(w * 0.38, h * 0.75);
    this.bg.closePath();
    this.bg.fillPath();

    this.bg.fillStyle(0xfef08a, 0.025);
    this.bg.beginPath();
    this.bg.moveTo(w * 0.65, 0);
    this.bg.lineTo(w * 0.75, 0);
    this.bg.lineTo(w * 0.25, h * 0.75);
    this.bg.lineTo(w * 0.14, h * 0.75);
    this.bg.closePath();
    this.bg.fillPath();
  }

  drawForegroundCanopy(w) {
    this.fgCanopy.clear();

    // Thick Jungle Vines & Leaves Draping Down from Screen Top
    this.fgCanopy.fillStyle(0x021a1a, 0.96);
    this.fgCanopy.fillRect(0, -10, w, 28);

    for (let x = 0; x <= w + 40; x += 45) {
      const drop = (x % 90 === 0) ? 44 : 30;
      this.fgCanopy.fillCircle(x, 22 + drop / 2, drop / 2);
    }

    this.fgCanopy.fillStyle(0x064e3b, 0.8);
    for (let x = 18; x <= w + 20; x += 45) {
      this.fgCanopy.fillCircle(x, 24, 15);
    }
    this.fgCanopy.fillStyle(0x10b981, 0.65);
    for (let x = 22; x <= w + 20; x += 60) {
      this.fgCanopy.fillCircle(x, 20, 8);
    }

    // Hanging Vines with leaves
    this.fgCanopy.lineStyle(3, 0x065f46, 0.9);
    this.fgCanopy.beginPath();
    this.fgCanopy.moveTo(w * 0.12, 25);
    this.fgCanopy.lineTo(w * 0.11, 70);
    this.fgCanopy.lineTo(w * 0.13, 110);
    this.fgCanopy.strokePath();
    this.fgCanopy.fillStyle(0x10b981, 1);
    this.fgCanopy.fillCircle(w * 0.11, 70, 5.5);
    this.fgCanopy.fillCircle(w * 0.13, 110, 6);

    this.fgCanopy.beginPath();
    this.fgCanopy.moveTo(w * 0.78, 25);
    this.fgCanopy.lineTo(w * 0.80, 80);
    this.fgCanopy.lineTo(w * 0.77, 120);
    this.fgCanopy.strokePath();
    this.fgCanopy.fillCircle(w * 0.80, 80, 5.5);
    this.fgCanopy.fillCircle(w * 0.77, 120, 6.5);
  }

  createAmbientSpores(w, h) {
    if (this.spores) {
      this.spores.forEach(s => s.destroy());
    }
    this.spores = [];

    for (let i = 0; i < 24; i++) {
      const x = Phaser.Math.Between(40, w - 40);
      const y = Phaser.Math.Between(h * 0.35, h * 0.85);
      const radius = Phaser.Math.FloatBetween(2.5, 4.5);
      const isGold = i % 3 === 0;

      const spore = this.add.circle(
        x, y, radius,
        isGold ? 0xfacc15 : 0x34d399,
        Phaser.Math.FloatBetween(0.35, 0.75)
      ).setDepth(4);

      this.tweens.add({
        targets: spore,
        y: y - Phaser.Math.Between(40, 100),
        x: x + Phaser.Math.Between(-30, 30),
        alpha: { from: spore.alpha, to: 0.1 },
        duration: Phaser.Math.Between(2600, 5200),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      this.spores.push(spore);
    }
  }

  handleResize(gameSize) {
    const { width, height } = gameSize;
    this.drawLayeredJungle(width, height);
    this.drawForegroundCanopy(width);
    this.createAmbientSpores(width, height);

    const perchY = 540;
    const playerPerchX = 220;
    const enemyPerchX = width - 220;
    this.playerPerchX = playerPerchX;
    this.enemyPerchX = enemyPerchX;
    this.launchAnchor = { x: playerPerchX + 15, y: perchY - 145 };

    if (this.playerShadow) this.playerShadow.setPosition(playerPerchX, perchY - 58);
    if (this.enemyShadow) this.enemyShadow.setPosition(enemyPerchX, perchY - 58);

    if (this.playerPerch && this.playerPerch.setPosition) {
      this.playerPerch.setPosition(playerPerchX, perchY);
    }
    if (this.enemyPerch && this.enemyPerch.setPosition) {
      this.enemyPerch.setPosition(enemyPerchX, perchY);
    }
  }
}
