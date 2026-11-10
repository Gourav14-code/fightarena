/**
 * Projectile: Handles projectile spawning, Matter.js physical body attributes,
 * in-flight spin, trajectory trail, lifetime management, and collision dispatch.
 */
class Projectile {
  constructor(scene, x, y, type = 'boulder', velocity = { x: 0, y: 0 }) {
    this.scene = scene;
    this.type = type;
    this.isDead = false;
    this.hasCollided = false;

    // Weapon Configuration
    this.config = this.getWeaponConfig(type);

    // Matter.js Physics Sprite
    this.sprite = scene.matter.add.sprite(x, y, this.config.texture, null, {
      mass: this.config.mass,
      friction: this.config.friction,
      frictionAir: this.config.frictionAir,
      restitution: this.config.restitution,
      chamfer: { radius: 10 },
      label: 'projectile_' + type
    });

    this.sprite.projectileRef = this;
    this.sprite.setDepth(15);

    // Native Matter Sprite Velocity & Spin
    this.sprite.setVelocity(velocity.x, velocity.y);
    this.sprite.setAngularVelocity(
      (Math.random() * 0.12 + 0.08) * (velocity.x >= 0 ? 1 : -1)
    );

    // Safety lifetime timer (6 seconds)
    this.lifeTimer = scene.time.delayedCall(6000, () => {
      this.destroy();
    });
  }

  getWeaponConfig(type) {
    const configs = {
      boulder: {
        texture: 'projectile_boulder',
        mass: 4.8,
        friction: 0.6,
        frictionAir: 0.005,
        restitution: 0.32,
        damage: 22,
        knockbackImpulse: 16.0,
        sparkColor: 0xf59e0b
      },
      puffer: {
        texture: 'projectile_puffer',
        mass: 3.2,
        friction: 0.4,
        frictionAir: 0.008,
        restitution: 0.25,
        damage: 18,
        knockbackImpulse: 11.0,
        sparkColor: 0xf97316
      },
      slime: {
        texture: 'projectile_slime',
        mass: 3.5,
        friction: 0.85,
        frictionAir: 0.012,
        restitution: 0.05,
        damage: 12,
        knockbackImpulse: 8.0,
        sparkColor: 0x84cc16
      },
      bone: {
        texture: 'projectile_bone',
        mass: 2.8,
        friction: 0.3,
        frictionAir: 0.004,
        restitution: 0.4,
        damage: 16,
        knockbackImpulse: 12.0,
        sparkColor: 0x38bdf8
      }
    };
    return configs[type] || configs.boulder;
  }

  onHit(hitCreature) {
    if (this.hasCollided || this.isDead) return;
    this.hasCollided = true;

    const damage = this.isEnemyProjectile ? 9 : (this.config.damage || 22);
    const targetBody = (hitCreature && hitCreature.body) ? hitCreature.body : (hitCreature && hitCreature.sprite ? hitCreature.sprite.body : null);
    const targetSprite = (hitCreature && hitCreature.sprite) ? hitCreature.sprite : hitCreature;

    // Apply kinetic knockback impulse to the enemy
    if (targetBody && targetBody.position) {
      const vx = (this.sprite && this.sprite.body) ? this.sprite.body.velocity.x : (this.isEnemyProjectile ? -10 : 10);
      const impulseX = (vx >= 0 ? 1 : -1) * this.config.knockbackImpulse * 0.45;
      const impulseY = -this.config.knockbackImpulse * 0.3;

      this.scene.matter.body.applyForce(targetBody, targetBody.position, {
        x: impulseX * 0.001,
        y: impulseY * 0.001
      });

      // Flinch tween on hit creature (if not handled by RagdollCreature entity)
      if (targetSprite && targetSprite.active && (!hitCreature || !hitCreature.applyHit)) {
        this.scene.tweens.add({
          targets: targetSprite,
          scaleX: targetSprite.flipX ? -0.85 : 0.85,
          scaleY: 1.15,
          duration: 80,
          yoyo: true,
          ease: 'Quad.easeInOut'
        });
      }
    }

    // Inform creature entity of hit if available
    if (hitCreature && hitCreature.applyHit) {
      const vx = (this.sprite && this.sprite.body) ? this.sprite.body.velocity.x : (this.isEnemyProjectile ? -10 : 10);
      hitCreature.applyHit(damage, vx * 0.35, -3);
    } else if (this.scene.handleCombatHit) {
      this.scene.handleCombatHit(this, targetSprite, { damage });
    }

    // Schedule cleanup after bounce settles
    this.scene.time.delayedCall(1200, () => {
      this.destroy();
    });
  }

  destroy() {
    if (this.isDead) return;
    this.isDead = true;

    if (this.lifeTimer) {
      this.lifeTimer.remove(false);
    }

    if (this.sprite && this.sprite.active) {
      this.scene.tweens.add({
        targets: this.sprite,
        alpha: 0,
        scale: 0.3,
        duration: 200,
        onComplete: () => {
          if (this.sprite && this.sprite.destroy) {
            this.sprite.destroy();
          }
        }
      });
    }
  }
}
