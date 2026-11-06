/**
 * Level Manager: builds Level 1 (SCRAP YARD), manages multi-layer parallax backgrounds,
 * floating industrial catwalks, shipping containers, and environmental boundaries.
 */
class LevelManager {
  constructor(game, width = 4800, height = 1400) {
    this.game = game;
    this.width = width;
    this.height = height;

    this.platforms = [];
    this.crates = [];
    this.sceneryDetails = [];

    this.initLevelScrapYard();
  }

  initLevelScrapYard() {
    const physics = this.game.physics;

    // Platform configurations across the 4800px battlefield
    const platformDefs = [
      // Section 1: Starting hangar ruins (0 -> 1200)
      { x: 380, y: 1040, w: 240, h: 22, type: 'catwalk' },
      { x: 780, y: 880, w: 220, h: 22, type: 'catwalk' },
      { x: 1150, y: 1060, w: 260, h: 28, type: 'container', color: '#b45309' },
      { x: 1050, y: 680, w: 200, h: 22, type: 'catwalk' },

      // Section 2: Industrial crane yard (1200 -> 2400)
      { x: 1550, y: 860, w: 240, h: 22, type: 'catwalk' },
      { x: 1850, y: 640, w: 220, h: 22, type: 'catwalk' },
      { x: 2180, y: 920, w: 280, h: 28, type: 'container', color: '#0369a1' },
      { x: 2320, y: 520, w: 180, h: 20, type: 'catwalk' },

      // Section 3: Scrap crushing towers (2400 -> 3600)
      { x: 2750, y: 840, w: 260, h: 22, type: 'catwalk' },
      { x: 3080, y: 1020, w: 240, h: 28, type: 'container', color: '#b91c1c' },
      { x: 3200, y: 680, w: 220, h: 22, type: 'catwalk' },
      { x: 3550, y: 860, w: 240, h: 22, type: 'catwalk' },

      // Section 4: Final extraction perimeter (3600 -> 4800)
      { x: 3950, y: 720, w: 260, h: 22, type: 'catwalk' },
      { x: 4250, y: 940, w: 280, h: 28, type: 'container', color: '#475569' },
      { x: 4500, y: 620, w: 220, h: 20, type: 'catwalk' }
    ];

    platformDefs.forEach(def => {
      const body = physics.addPlatform(def.x, def.y, def.w, def.h, 'platform');
      this.platforms.push({
        x: def.x,
        y: def.y,
        w: def.w,
        h: def.h,
        type: def.type,
        color: def.color || '#334155',
        body: body
      });
    });

    // Explosive fuel barrels placed strategically on platforms and ground
    this.barrels = [
      { x: 820, y: 880 - 24, hp: 15, maxHp: 15, isBlown: false, flashTimer: 0 },
      { x: 1600, y: 860 - 24, hp: 15, maxHp: 15, isBlown: false, flashTimer: 0 },
      { x: 2220, y: 920 - 28, hp: 15, maxHp: 15, isBlown: false, flashTimer: 0 },
      { x: 2800, y: 840 - 24, hp: 15, maxHp: 15, isBlown: false, flashTimer: 0 },
      { x: 3600, y: 860 - 24, hp: 15, maxHp: 15, isBlown: false, flashTimer: 0 },
      { x: 4280, y: 940 - 28, hp: 15, maxHp: 15, isBlown: false, flashTimer: 0 }
    ];

    // Generate distant background scenery items (cranes, smoke stacks)
    for (let x = 100; x < this.width; x += 380) {
      this.sceneryDetails.push({
        x: x + (Math.random() - 0.5) * 80,
        type: Math.random() < 0.5 ? 'smokestack' : 'crane',
        height: 220 + Math.random() * 180,
        width: 35 + Math.random() * 25
      });
    }
  }

  draw(ctx, camera) {
    const camX = camera.x;
    const camY = camera.y;
    const vpW = camera.viewportWidth;
    const vpH = camera.viewportHeight;

    // 1. Far Parallax Background: Twilight Sky & Distant Smog (0.12x scroll)
    this.drawSkyAndFarSmog(ctx, camX, camY, vpW, vpH);

    // 2. Mid Parallax Background: Silhouette Smokestacks & Cranes (0.35x scroll)
    this.drawMidBackground(ctx, camX, camY, vpW, vpH);

    // 3. Playfield: Platforms & Industrial Containers (1.0x scroll)
    this.drawPlayfieldPlatforms(ctx, camera);

    // 4. Explosive Fuel Barrels
    this.drawBarrels(ctx, camera);

    // 5. Ground Scrap Bed
    this.drawGround(ctx, camera);
  }

  drawBarrels(ctx, camera) {
    ctx.save();
    for (let i = 0; i < this.barrels.length; i++) {
      const b = this.barrels[i];
      if (b.isBlown || !camera.isVisible(b.x, b.y, 40)) continue;

      const isFlashing = b.flashTimer > 0;
      ctx.fillStyle = isFlashing ? '#ffffff' : '#dc2626';
      ctx.strokeStyle = '#991b1b';
      ctx.lineWidth = 2;

      // Fuel barrel drum
      ctx.beginPath();
      ctx.roundRect(b.x - 12, b.y - 15, 24, 30, 4);
      ctx.fill();
      ctx.stroke();

      // Hazard stripe
      ctx.fillStyle = '#facc15';
      ctx.fillRect(b.x - 12, b.y - 4, 24, 8);

      // Hazard skull / flame icon
      ctx.font = '900 7px sans-serif';
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.fillText('TNT', b.x, b.y + 2);
    }
    ctx.restore();
  }

  explodeBarrel(b) {
    if (b.isBlown) return;
    b.isBlown = true;

    const game = this.game;
    const combat = game.combat;
    const blastRadius = 160;
    const blastDmg = 55;

    combat.sfx.playExplosion();
    game.addScreenShake(14);

    // Blast particles
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 11 + 3;
      combat.particles.push({
        x: b.x,
        y: b.y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 2,
        radius: Math.random() * 6 + 3,
        color: Math.random() < 0.6 ? '#f59e0b' : '#ef4444',
        alpha: 1.0,
        decay: 0.035
      });
    }

    // Damage enemies in blast radius
    for (let i = 0; i < game.enemies.length; i++) {
      const e = game.enemies[i];
      if (e.isDead || !e.body) continue;
      const dist = Math.hypot(e.body.position.x - b.x, e.body.position.y - b.y);
      if (dist < blastRadius) {
        const falloff = 1 - dist / blastRadius;
        const pushAngle = Math.atan2(e.body.position.y - b.y, e.body.position.x - b.x);
        e.takeDamage(
          Math.floor(blastDmg * falloff),
          { x: Math.cos(pushAngle) * 8, y: Math.sin(pushAngle) * 8 - 4 },
          28
        );
      }
    }

    // Damage player if caught in blast
    if (game.player && !game.player.isKnockedOut && game.player.body) {
      const pDist = Math.hypot(game.player.body.position.x - b.x, game.player.body.position.y - b.y);
      if (pDist < blastRadius) {
        const falloff = 1 - pDist / blastRadius;
        const pushAngle = Math.atan2(game.player.body.position.y - b.y, game.player.body.position.x - b.x);
        game.player.takeDamage(Math.floor(35 * falloff), {
          x: Math.cos(pushAngle) * 10,
          y: Math.sin(pushAngle) * 10 - 4
        });
      }
    }
  }

  drawSkyAndFarSmog(ctx, camX, camY, vpW, vpH) {
    // Sky gradient fixed to screen
    const skyGrad = ctx.createLinearGradient(0, 0, 0, vpH);
    skyGrad.addColorStop(0, '#090d15');
    skyGrad.addColorStop(0.55, '#151d2a');
    skyGrad.addColorStop(1, '#0b0f17');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, vpW, vpH);

    // Distant industrial smog glow
    const farOffset = camX * 0.12;
    ctx.save();
    ctx.fillStyle = 'rgba(245, 158, 11, 0.05)';
    for (let i = 0; i < 8; i++) {
      const gx = (i * 650 - farOffset) % (vpW + 600) - 200;
      ctx.beginPath();
      ctx.arc(gx, vpH * 0.65, 280, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawMidBackground(ctx, camX, camY, vpW, vpH) {
    const midScroll = camX * 0.35;
    ctx.save();
    ctx.fillStyle = '#0f1724';

    for (let i = 0; i < this.sceneryDetails.length; i++) {
      const s = this.sceneryDetails[i];
      const screenX = s.x - midScroll;

      if (screenX < -150 || screenX > vpW + 150) continue;

      const baseScreenY = vpH * 0.85;

      if (s.type === 'smokestack') {
        // Factory stack
        ctx.fillRect(screenX - s.width / 2, baseScreenY - s.height, s.width, s.height);
        // Smokestack lip
        ctx.fillRect(screenX - (s.width + 10) / 2, baseScreenY - s.height, s.width + 10, 8);
      } else {
        // Lattice crane tower
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#0f1724';
        ctx.beginPath();
        ctx.moveTo(screenX - 25, baseScreenY);
        ctx.lineTo(screenX, baseScreenY - s.height);
        ctx.lineTo(screenX + 25, baseScreenY);
        ctx.stroke();

        // Crane horizontal arm
        ctx.fillRect(screenX - 80, baseScreenY - s.height, 160, 10);
      }
    }
    ctx.restore();
  }

  drawPlayfieldPlatforms(ctx, camera) {
    ctx.save();
    for (let i = 0; i < this.platforms.length; i++) {
      const p = this.platforms[i];
      if (!camera.isVisible(p.x, p.y, p.w)) continue;

      if (p.type === 'container') {
        // Heavy shipping container
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h);

        // Container corrugated ridges
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.lineWidth = 2.5;
        for (let rx = p.x - p.w / 2 + 15; rx < p.x + p.w / 2; rx += 18) {
          ctx.beginPath();
          ctx.moveTo(rx, p.y - p.h / 2);
          ctx.lineTo(rx, p.y + p.h / 2);
          ctx.stroke();
        }

        // Top highlight
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h);
      } else {
        // Steel industrial catwalk
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h);

        // Top grip tread
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(p.x - p.w / 2, p.y - p.h / 2, p.w, 3);

        // Under-girder support struts
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(p.x - p.w * 0.35, p.y + p.h / 2);
        ctx.lineTo(p.x - p.w * 0.15, p.y + p.h / 2 + 35);
        ctx.moveTo(p.x + p.w * 0.35, p.y + p.h / 2);
        ctx.lineTo(p.x + p.w * 0.15, p.y + p.h / 2 + 35);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  drawGround(ctx, camera) {
    const physics = this.game.physics;
    const groundY = physics.groundY;
    const w = this.width;

    ctx.save();
    // Metal ground bed
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, this.height);
    groundGrad.addColorStop(0, '#111827');
    groundGrad.addColorStop(0.1, '#0b0f19');
    groundGrad.addColorStop(1, '#05070a');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, w, this.height - groundY);

    // Glowing scrap border line
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(w, groundY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Industrial scrap plates along the surface
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    for (let gx = 80; gx < w; gx += 260) {
      if (!camera.isVisible(gx, groundY, 150)) continue;
      ctx.fillRect(gx - 40, groundY + 4, 80, 18);
      ctx.strokeRect(gx - 40, groundY + 4, 80, 18);
    }
    ctx.restore();
  }
}
