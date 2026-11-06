/**
 * RagdollCreature: Physics creature entity with active upright balance stabilization,
 * dynamic hit wobbling, headshot / body-part detection, and limp ragdoll knockout tumble.
 * Viewport: 1280x720 Widescreen Landscape.
 */
class RagdollCreature {
  constructor(scene, x, y, type = 'gloop', options = {}) {
    this.scene = scene;
    this.type = type;
    this.isPlayer = options.isPlayer || false;
    this.flipX = options.flipX || false;
    this.maxHealth = options.health || (this.isPlayer ? 100 : 45);
    this.health = this.maxHealth;

    this.homeX = x;
    this.homeY = y;
    this.isDead = false;
    this.isRagdoll = false;
    this.stuckArrows = [];

    // Balance Stabilizer Tuning Parameters
    this.kpTorque = 0.085;    // Upright angular spring stiffness
    this.kdTorque = 0.045;    // Angular velocity damping
    this.maxTilt = 0.78;      // ~45 degrees max recoverable tilt
    this.kpPos = 0.0018;      // Platform anchoring stiffness

    // Drop Shadow
    this.shadow = scene.add.image(x, y + 82, 'character_shadow')
      .setAlpha(0.65)
      .setDepth(3);

    // Matter.js Physics Sprite
    const mass = this.isPlayer ? 55 : (options.mass || 42);
    this.sprite = scene.matter.add.sprite(x, y, `creature_${type}`, null, {
      mass: mass,
      friction: 0.7,
      frictionAir: 0.02,
      restitution: 0.05,
      chamfer: { radius: 26 },
      label: this.isPlayer ? 'creature_player' : 'creature_enemy'
    });

    this.sprite.ragdollRef = this;
    this.sprite.setFlipX(this.flipX);
    this.sprite.setDepth(5);

    // Idle breathing tween (only active while standing)
    this.breathTween = scene.tweens.add({
      targets: this.sprite,
      scaleY: 1.03,
      scaleX: this.flipX ? -0.97 : 0.97,
      duration: 1300 + Math.random() * 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  update(time, delta) {
    if (this.isDead || !this.sprite || !this.sprite.body) return;

    // 1. Update Drop Shadow position
    if (this.shadow && this.shadow.active) {
      this.shadow.x = this.sprite.x;
      const distFromPerch = Math.abs(this.sprite.y - this.homeY);
      const alpha = Math.max(0, 0.65 - distFromPerch * 0.004);
      this.shadow.setAlpha(alpha);
      this.shadow.setScale(Math.max(0.3, 1.0 - distFromPerch * 0.003));
    }

    // 2. Active Upright Balance Stabilizer (Ragdoll Archers Physics)
    if (!this.isRagdoll) {
      const angle = this.sprite.rotation;
      const angVel = this.sprite.body.angularVelocity;

      // Spring torque fighting tilt: torque = -kp * angle - kd * angularVelocity
      const restorativeTorque = -this.kpTorque * angle - this.kdTorque * angVel;
      this.scene.matter.body.applyForce(this.sprite.body, {
        x: this.sprite.x + Math.sin(angle) * 30,
        y: this.sprite.y - Math.cos(angle) * 30
      }, {
        x: Math.cos(angle) * restorativeTorque * 0.015,
        y: Math.sin(angle) * restorativeTorque * 0.015
      });

      // Angular velocity damping for wobble recovery
      this.scene.matter.body.setAngularVelocity(this.sprite.body, angVel * 0.94);

      // Elastic anchoring to home perch surface
      const dx = this.homeX - this.sprite.x;
      if (Math.abs(dx) > 1.0) {
        this.scene.matter.body.applyForce(this.sprite.body, this.sprite.body.position, {
          x: dx * this.kpPos,
          y: 0
        });
      }

      // Check if tilted beyond recovery threshold
      if (Math.abs(angle) > this.maxTilt || Math.abs(this.sprite.x - this.homeX) > 120) {
        // Lost balance!
        this.knockout({ x: this.sprite.body.velocity.x * 0.5, y: -2 });
      }
    }

    // 3. Update any stuck arrows
    for (let i = this.stuckArrows.length - 1; i >= 0; i--) {
      const arrow = this.stuckArrows[i];
      if (arrow.isDead) {
        this.stuckArrows.splice(i, 1);
      }
    }
  }

  applyHit(damage, impulseX, impulseY, isHeadshot = false) {
    if (this.isDead) return;

    this.health = Math.max(0, this.health - damage);

    // Sync Scene & HUD Health
    if (!this.isPlayer) {
      this.scene.enemyHealth = this.health;
      const ui = this.scene.scene.get('UIScene');
      if (ui && ui.enemyHealthUI) {
        ui.enemyHealthUI.updateFill(this.health, this.maxHealth);
        ui.enemyHealthUI.hpText.setText(`${this.health}/${this.maxHealth} HP`);
      }
    } else {
      this.scene.playerHealth = this.health;
      const ui = this.scene.scene.get('UIScene');
      if (ui && ui.playerHealthUI) {
        ui.playerHealthUI.updateFill(this.health, this.maxHealth);
        ui.playerHealthUI.hpText.setText(`${this.health}/${this.maxHealth} HP`);
      }
    }

    // Apply linear and rotational impulse
    if (this.sprite && this.sprite.body) {
      this.scene.matter.body.applyForce(this.sprite.body, this.sprite.body.position, {
        x: impulseX * 0.002,
        y: impulseY * 0.002
      });

      // Headshots impart strong rotational torque
      const torqueDir = impulseX >= 0 ? 1 : -1;
      const torqueAmount = isHeadshot ? 0.22 : 0.09;
      this.scene.matter.body.setAngularVelocity(this.sprite.body, torqueDir * torqueAmount);
    }

    // Dynamic hurt facial expression (only if not already dead/KO)
    if (this.health > 0 && !this.isRagdoll) {
      this.setExpression('hurt');
      this.scene.time.delayedCall(450, () => {
        if (!this.isRagdoll && !this.isDead) {
          this.setExpression('normal');
        }
      });
    }

    // Flinch squash tween
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: this.flipX ? -0.85 : 0.85,
      scaleY: 1.15,
      duration: 80,
      yoyo: true,
      ease: 'Quad.easeInOut'
    });

    // Floating Damage Number
    const label = isHeadshot ? `💥 CRITICAL -${damage}` : `-${damage}`;
    const color = isHeadshot ? '#fbbf24' : (this.isPlayer ? '#ef4444' : '#f43f5e');
    this.spawnDamagePopup(label, color, isHeadshot);

    // Camera micro-shake
    this.scene.cameras.main.shake(isHeadshot ? 160 : 100, isHeadshot ? 0.007 : 0.004);

    // Check Defeat / Knockout
    if (this.health <= 0 && !this.isRagdoll) {
      this.knockout({
        x: (impulseX >= 0 ? 1 : -1) * (isHeadshot ? 0.022 : 0.015),
        y: -0.012
      });
    }
  }

  setExpression(expr = 'normal') {
    if (!this.sprite || !this.sprite.active) return;
    const textureKey = expr === 'normal' ? `creature_${this.type}` : `creature_${this.type}_${expr}`;
    if (this.scene.textures.exists(textureKey)) {
      this.sprite.setTexture(textureKey);
    }
  }

  attachStuckArrow(arrow) {
    if (!arrow || arrow.isDead) return;
    const rad = this.sprite.rotation;
    const dx = arrow.sprite.x - this.sprite.x;
    const dy = arrow.sprite.y - this.sprite.y;

    arrow.stuckTarget = this;
    arrow.stuckOffset = {
      x: dx * Math.cos(-rad) - dy * Math.sin(-rad),
      y: dx * Math.sin(-rad) + dy * Math.cos(-rad),
      angle: arrow.sprite.rotation - this.sprite.rotation
    };

    this.stuckArrows.push(arrow);
  }

  knockout(tumbleForce = { x: -0.015, y: -0.012 }) {
    if (this.isRagdoll) return;
    this.isRagdoll = true;

    // Disconnect breathing tween
    if (this.breathTween) {
      this.breathTween.stop();
      this.breathTween = null;
    }

    // Switch to Spiral/X KO eyes
    this.setExpression('ko');

    // Completely disable active upright balance torque
    this.kpTorque = 0;
    this.kdTorque = 0;
    this.kpPos = 0;

    // Apply defeat launch tumble impulse into the chasm
    if (this.sprite && this.sprite.body) {
      this.scene.matter.body.applyForce(this.sprite.body, this.sprite.body.position, tumbleForce);
      this.scene.matter.body.setAngularVelocity(this.sprite.body, 0.24 * (tumbleForce.x >= 0 ? 1 : -1));
    }

    // Inform GameScene of knockout resolution
    if (this.scene.handleCreatureKnockout) {
      this.scene.handleCreatureKnockout(this);
    }
  }

  spawnDamagePopup(text, color = '#f43f5e', isCrit = false) {
    const popup = this.scene.add.text(this.sprite.x, this.sprite.y - 50, text, {
      fontFamily: 'sans-serif',
      fontSize: isCrit ? '26px' : '22px',
      fontWeight: '900',
      color: color,
      stroke: '#0f172a',
      strokeThickness: isCrit ? 6 : 4
    }).setOrigin(0.5).setDepth(30);

    this.scene.tweens.add({
      targets: popup,
      y: this.sprite.y - 100,
      alpha: 0,
      scale: isCrit ? 1.35 : 1.2,
      duration: isCrit ? 1100 : 850,
      ease: 'Back.easeOut',
      onComplete: () => popup.destroy()
    });
  }

  destroy() {
    this.isDead = true;

    if (this.sprite) {
      this.scene.tweens.killTweensOf(this.sprite);
    }

    if (this.breathTween) {
      this.breathTween.stop();
      this.breathTween = null;
    }

    if (this.shadow) {
      this.scene.tweens.killTweensOf(this.shadow);
      this.shadow.destroy();
      this.shadow = null;
    }

    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }

    this.stuckArrows = [];
  }
}
