/**
 * Camera system: smooth 2D tracking with horizontal/vertical deadzone and lerp,
 * world-to-screen and screen-to-world coordinate transformations,
 * screen shake integration, and viewport visibility culling for 60 FPS performance.
 */
class Camera {
  constructor(viewportWidth = 1280, viewportHeight = 720) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;

    this.x = 0;
    this.y = 0;

    this.targetX = 0;
    this.targetY = 0;

    // Follow speeds
    this.lerpSpeedX = 0.085;
    this.lerpSpeedY = 0.075;

    // Camera lead offset (looking ahead in facing/aim direction)
    this.leadOffsetX = 80;

    // World bounds (will be updated by Level)
    this.worldWidth = 4800;
    this.worldHeight = 1400;

    // Shake offsets
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  setWorldBounds(width, height) {
    this.worldWidth = width;
    this.worldHeight = height;
  }

  follow(targetX, targetY, facing = 1, deltaMs = 16.6) {
    // Lead slightly in facing/movement direction
    const desiredTargetX = targetX - this.viewportWidth * 0.42 + (facing * this.leadOffsetX);
    const desiredTargetY = targetY - this.viewportHeight * 0.52;

    // Smooth lerp
    const factor = Math.min(1.0, (deltaMs / 16.66) * this.lerpSpeedX);
    this.x += (desiredTargetX - this.x) * factor;
    this.y += (desiredTargetY - this.y) * (factor * 0.9);

    // Clamp to level world boundaries
    const maxX = Math.max(0, this.worldWidth - this.viewportWidth);
    const maxY = Math.max(0, this.worldHeight - this.viewportHeight);

    this.x = Math.max(0, Math.min(this.x, maxX));
    this.y = Math.max(0, Math.min(this.y, maxY));
  }

  screenToWorld(screenX, screenY) {
    return {
      x: screenX + this.x - this.shakeOffsetX,
      y: screenY + this.y - this.shakeOffsetY
    };
  }

  worldToScreen(worldX, worldY) {
    return {
      x: worldX - this.x + this.shakeOffsetX,
      y: worldY - this.y + this.shakeOffsetY
    };
  }

  isVisible(worldX, worldY, radius = 80) {
    const rx = worldX - this.x;
    const ry = worldY - this.y;
    return (
      rx >= -radius &&
      rx <= this.viewportWidth + radius &&
      ry >= -radius &&
      ry <= this.viewportHeight + radius
    );
  }

  applyTransform(ctx) {
    ctx.translate(
      -Math.floor(this.x) + this.shakeOffsetX,
      -Math.floor(this.y) + this.shakeOffsetY
    );
  }
}
