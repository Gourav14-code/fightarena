/**
 * Trajectory: Calculates the exact Matter.js physics projectile path
 * to render a dotted aim preview arc across the chasm towards the enemy platform.
 * Viewport: 1280x720 Widescreen.
 */
class Trajectory {
  constructor(scene) {
    this.scene = scene;
    this.dots = [];
    this.maxDots = 30;

    // Create pool of dotted arc sprites
    for (let i = 0; i < this.maxDots; i++) {
      const dot = scene.add.image(0, 0, 'trajectory_dot');
      dot.setVisible(false);
      dot.setDepth(20);

      // Progressive fading and sizing along the arc
      const scale = 0.95 - (i / this.maxDots) * 0.45;
      dot.setScale(scale);
      dot.setAlpha(0.95 - (i / this.maxDots) * 0.5);
      this.dots.push(dot);
    }
  }

  /**
   * Updates dotted arc positions based on launch origin and initial velocity.
   * Uses Matter.js discrete integration: x += vx, y += vy, vy += gravityY.
   * In Phaser Matter with engine gravity y=1.25, per-step delta is ~0.42.
   * @param {number} startX - Origin X
   * @param {number} startY - Origin Y
   * @param {number} vx - Horizontal velocity
   * @param {number} vy - Vertical velocity
   * @param {number} gravityY - Matter gravity step acceleration
   */
  show(startX, startY, vx, vy, gravityY = 0.42) {
    let curX = startX;
    let curY = startY;
    let curVx = vx;
    let curVy = vy;

    // Simulation steps per dot
    const stepDelta = 2.0;

    for (let i = 0; i < this.maxDots; i++) {
      for (let s = 0; s < stepDelta; s++) {
        curX += curVx;
        curY += curVy;
        curVy += gravityY;
      }

      const dot = this.dots[i];
      dot.setPosition(curX, curY);
      dot.setVisible(true);

      // Stop preview if it drops below screen bounds or abyss sensor
      if (curY >= this.scene.scale.height - 60 || curX >= this.scene.scale.width + 50) {
        for (let j = i + 1; j < this.maxDots; j++) {
          this.dots[j].setVisible(false);
        }
        break;
      }
    }
  }

  hide() {
    for (let i = 0; i < this.maxDots; i++) {
      this.dots[i].setVisible(false);
    }
  }

  destroy() {
    this.dots.forEach(d => d.destroy());
    this.dots = [];
  }
}
