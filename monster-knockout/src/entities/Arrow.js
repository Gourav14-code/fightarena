/**
 * Arrow: High-speed piercing ballistic projectile.
 * Features:
 * - Dynamic flight rotation tangent to velocity vector (arrow points where it flies).
 * - Body-part specific impact detection: Headshot (upper 30%) deals 1.75x critical damage.
 * - Arrow-Sticking Physics: Temporarily pins / embeds into the struck ragdoll creature,
 *   wobbling dynamically with the creature's balance oscillations.
 */
class Arrow {
  constructor(scene, x, y, velocity = { x: 0, y: 0 }, shooter = 'player') {
    this.scene = scene;
    this.shooter = shooter;
    this.isDead = false;
    this.hasCollided = false;
    this.stuckTarget = null;
    this.stuckOffset = { x: 0, y: 0, angle: 0 };

    this.config = {
      texture: 'projectile_arrow',
      mass: 1.8,
      friction: 0.5,
      frictionAir: 0.002, // Aerodynamic - very low drag
      restitution: 0.1,
      damage: 20,
      headshotMultiplier: 1.75,
      knockbackImpulse: 10.0
    };

    // Matter.js Physics Sprite
    this.sprite = scene.matter.add.sprite(x, y, this.config.texture, null, {
      mass: this.config.mass,
      friction: this.config.friction,
      frictionAir: this.config.frictionAir,
      restitution: this.config.restitution,
      chamfer: { radius: 3 },
      label: 'projectile_arrow'
    });

    this.sprite.projectileRef = this;
    this.sprite.arrowRef = this;
    this.sprite.setDepth(16);

    // Initial Velocity & Aerodynamic Angle Alignment
    this.sprite.setVelocity(velocity.x, velocity.y);
    const initialAngle = Math.atan2(velocity.y, velocity.x);
    this.sprite.setRotation(initialAngle);

    // Aerodynamic flight updater: aligns arrow angle with velocity vector each frame
    this.updateListener = () => this.updateFlight();
    this.scene.events.on('update', this.updateListener);

    // Safety lifetime timer (6 seconds)
    this.lifeTimer = scene.time.delayedCall(6000, () => {
      this.destroy();
    });
  }

  updateFlight() {
    if (this.isDead || !this.sprite || !this.sprite.body) return;

    if (!this.hasCollided) {
      // Dynamic rotation tangent to trajectory
      const vx = this.sprite.body.velocity.x;
      const vy = this.sprite.body.velocity.y;
      const speed = Math.sqrt(vx * vx + vy * vy);

      if (speed > 0.8) {
        const targetAngle = Math.atan2(vy, vx);
        this.sprite.setRotation(targetAngle);
      }
    } else if (this.stuckTarget && this.stuckTarget.sprite && this.stuckTarget.sprite.active) {
      // Follow the stuck creature's position and rotation
      const target = this.stuckTarget.sprite;
      const rad = target.rotation;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      const worldOffsetX = this.stuckOffset.x * cos - this.stuckOffset.y * sin;
      const worldOffsetY = this.stuckOffset.x * sin + this.stuckOffset.y * cos;

      this.sprite.setPosition(target.x + worldOffsetX, target.y + worldOffsetY);
      this.sprite.setRotation(target.rotation + this.stuckOffset.angle);
    }
  }

  onHit(hitCreature, collisionPair) {
    if (this.hasCollided || this.isDead) return;
    this.hasCollided = true;

    // Remove active physics motion so arrow sticks
    if (this.sprite && this.sprite.body) {
      this.scene.matter.body.setVelocity(this.sprite.body, { x: 0, y: 0 });
      this.scene.matter.body.setAngularVelocity(this.sprite.body, 0);
      this.sprite.setIgnoreGravity(true);
      this.sprite.setCollisionCategory(0); // Disable further collisions
    }

    let isHeadshot = false;
    let finalDamage = this.config.damage;

    // Calculate body part hit based on vertical impact offset
    const creatureSprite = (hitCreature && hitCreature.sprite) ? hitCreature.sprite : hitCreature;
    if (creatureSprite && creatureSprite.y) {
      const creatureHeight = 160;
      const hitRelY = (this.sprite.y - creatureSprite.y) / (creatureHeight * 0.5); // -1 (top/head) to +1 (feet)

      // Upper 30% is Headshot
      if (hitRelY < -0.35) {
        isHeadshot = true;
        finalDamage = Math.round(this.config.damage * this.config.headshotMultiplier);
      }

      // Pin / embed arrow into creature
      if (hitCreature.attachStuckArrow) {
        hitCreature.attachStuckArrow(this);
      } else {
        // Fallback relative transform pin
        this.stuckTarget = hitCreature.ragdollRef || { sprite: creatureSprite };
        const rad = creatureSprite.rotation;
        const dx = this.sprite.x - creatureSprite.x;
        const dy = this.sprite.y - creatureSprite.y;
        this.stuckOffset = {
          x: dx * Math.cos(-rad) - dy * Math.sin(-rad),
          y: dx * Math.sin(-rad) + dy * Math.cos(-rad),
          angle: this.sprite.rotation - creatureSprite.rotation
        };
      }
    }

    // Apply kinetic impact impulse to creature
    if (hitCreature.applyHit) {
      hitCreature.applyHit(finalDamage, this.sprite.body.velocity.x * 0.35, -3, isHeadshot);
    } else if (this.scene.handleCombatHit) {
      this.scene.handleCombatHit(this, creatureSprite, { isHeadshot, damage: finalDamage });
    }

    // Embed penetration visual: nudge arrow slightly deeper into flesh
    const angle = this.sprite.rotation;
    this.sprite.x += Math.cos(angle) * 8;
    this.sprite.y += Math.sin(angle) * 8;

    // Sticking cleanup timer (fades out after 4 seconds)
    this.scene.time.delayedCall(4000, () => {
      this.destroy();
    });
  }

  destroy() {
    if (this.isDead) return;
    this.isDead = true;

    if (this.updateListener) {
      this.scene.events.off('update', this.updateListener);
      this.updateListener = null;
    }

    if (this.lifeTimer) {
      this.lifeTimer.remove(false);
      this.lifeTimer = null;
    }

    if (this.sprite && this.sprite.active) {
      this.scene.tweens.add({
        targets: this.sprite,
        alpha: 0,
        duration: 250,
        onComplete: () => {
          if (this.sprite && this.sprite.destroy) {
            this.sprite.destroy();
          }
        }
      });
    }
  }
}
