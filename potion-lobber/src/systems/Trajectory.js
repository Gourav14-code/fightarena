/**
 * Trajectory: Calculates the exact Matter.js physics projectile path
 * to render a dotted aim preview arc matching the real potion throw.
 */
class Trajectory {
  constructor(scene) {
    this.scene = scene;
    this.dots = [];
    this.maxDots = 24;

    // Create pool of dotted arc sprites
    for (let i = 0; i < this.maxDots; i++) {
      const dot = scene.add.image(0, 0, 'trajectory_dot');
      dot.setVisible(false);
      dot.setDepth(10);
      // Progressive fading and sizing along arc
      const scale = 0.9 - (i / this.maxDots) * 0.45;
      dot.setScale(scale);
      dot.setAlpha(0.85 - (i / this.maxDots) * 0.45);
      this.dots.push(dot);
    }
  }

  /**
   * Updates dotted arc positions based on launch origin and initial velocity.
   * @param {number} startX - Origin X
   * @param {number} startY - Origin Y
   * @param {number} vx - Initial horizontal velocity
   * @param {number} vy - Initial vertical velocity
   * @param {number} gravityY - Scene gravity acceleration per step
   */
  show(startX, startY, vx, vy, gravityY = 0.52) {
    let curX = startX;
    let curY = startY;
    let curVx = vx;
    let curVy = vy;

    // Simulation steps per dot
    const stepDelta = 2.2;

    for (let i = 0; i < this.maxDots; i++) {
      // Step simulation forward
      for (let s = 0; s < stepDelta; s++) {
        curX += curVx;
        curY += curVy;
        curVy += gravityY;
      }

      const dot = this.dots[i];
      dot.setPosition(curX, curY);
      dot.setVisible(true);

      // Stop preview if it hits the ground
      if (curY >= this.scene.scale.height - 120) {
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
}
