/**
 * CombatResolver: Handles projectile impact resolution, damage calculation,
 * physical impulse knockback, particle spark bursts, floating damage numbers,
 * and HUD health updates.
 */
class CombatResolver {
  constructor(scene) {
    this.scene = scene;
  }

  resolveHit(projectile, hitBody) {
    const x = projectile.sprite.x;
    const y = projectile.sprite.y;
    const cfg = projectile.config;

    // 1. Spawn Impact Spark Particles
    this.spawnImpactParticles(x, y, cfg.sparkColor);

    // 2. Camera Micro-Shake
    this.scene.cameras.main.shake(120, 0.006);

    // 3. Creature Hit Check
    if (hitBody && hitBody.label && hitBody.label.startsWith('creature_')) {
      const isPlayer = hitBody.label === 'creature_player';
      const creatureSprite = hitBody.gameObject;

      const damage = cfg.damage;
      const impulsePower = cfg.knockbackImpulse;

      // Calculate directional impulse vector from projectile velocity
      const pVel = projectile.sprite.body.velocity;
      const speed = Math.hypot(pVel.x, pVel.y);
      const dirX = speed > 0.1 ? pVel.x / speed : (isPlayer ? -1 : 1);
      const dirY = speed > 0.1 ? pVel.y / speed : -0.2;

      // Apply physical momentum to creature
      this.scene.matter.body.setVelocity(hitBody, {
        x: hitBody.velocity.x + dirX * impulsePower,
        y: hitBody.velocity.y + dirY * (impulsePower * 0.45) - 2.5
      });

      // Angular wobble torque
      this.scene.matter.body.setAngularVelocity(
        hitBody,
        (Math.random() * 0.2 + 0.1) * (dirX >= 0 ? 1 : -1)
      );

      // Hit Flash Tween
      if (creatureSprite) {
        this.scene.tweens.add({
          targets: creatureSprite,
          alpha: 0.4,
          yoyo: true,
          repeat: 1,
          duration: 60
        });
      }

      // 4. Floating Damage Text
      this.spawnDamageText(x, y - 24, damage, isPlayer);

      // 5. Update Creature Health & UIScene HUD
      if (isPlayer) {
        this.scene.playerHealth = Math.max(0, (this.scene.playerHealth || 100) - damage);
      } else {
        this.scene.enemyHealth = Math.max(0, (this.scene.enemyHealth || 100) - damage);
      }

      const uiScene = this.scene.scene.get('UIScene');
      if (uiScene) {
        uiScene.updateHealth(isPlayer, isPlayer ? this.scene.playerHealth : this.scene.enemyHealth, 100);
      }
    }
  }

  spawnImpactParticles(x, y, color = 0xca8a04, count = 16) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2;

      const p = this.scene.add.circle(
        x,
        y,
        Math.random() * 3 + 2,
        Math.random() < 0.65 ? color : 0xffffff,
        0.9
      );
      p.setDepth(20);

      this.scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed * 7,
        y: y + Math.sin(angle) * speed * 7 + 10,
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(300, 600),
        ease: 'Quad.easeOut',
        onComplete: () => p.destroy()
      });
    }
  }

  spawnDamageText(x, y, damage, isPlayer = false) {
    const txt = this.scene.add.text(x, y, `-${damage}`, {
      fontFamily: 'sans-serif',
      fontSize: '22px',
      fontWeight: '900',
      color: isPlayer ? '#ef4444' : '#facc15',
      stroke: '#060a10',
      strokeThickness: 4
    }).setOrigin(0.5);
    txt.setDepth(25);

    this.scene.tweens.add({
      targets: txt,
      y: y - 36,
      alpha: 0,
      scale: 1.25,
      duration: 750,
      ease: 'Back.easeOut',
      onComplete: () => txt.destroy()
    });
  }
}
