/**
 * Combat Manager: handles projectile trajectories and continuous collision checks,
 * bullet-to-body impacts, damage formulas, knockback physics impulses,
 * particle spark explosions, floating damage texts, and Web Audio SFX.
 */

class SoundFX {
  constructor() {
    this.ctx = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.initialized = true;
      }
    } catch (e) {
      console.warn('Web Audio not supported:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playLaser() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.09);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playShotgun() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;

    // Heavy bass pop
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.22);
    oscGain.gain.setValueAtTime(0.45, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.23);

    // Blast noise
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.16);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1400;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(now);
  }

  playEnemyShot() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.11);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  playHit(isFlesh = true) {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isFlesh ? 'triangle' : 'square';
    osc.frequency.setValueAtTime(isFlesh ? 220 : 380, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  playExplosion() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;

    const bufferSize = Math.floor(this.ctx.sampleRate * 0.45);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.28));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + 0.45);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.65, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
  }

  playPickup() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.setValueAtTime(780, now + 0.08);
    osc.frequency.setValueAtTime(1040, now + 0.16);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.29);
  }

  playDash() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.14);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  startThruster() {
    if (!this.ctx || this.thrusterNode) return;
    this.resume();
    try {
      const now = this.ctx.currentTime;
      // White noise generator for jetpack hiss
      const bufferSize = Math.floor(this.ctx.sampleRate * 1.0);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      this.thrusterSource = this.ctx.createBufferSource();
      this.thrusterSource.buffer = buffer;
      this.thrusterSource.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 650;
      filter.Q.value = 1.2;

      this.thrusterGain = this.ctx.createGain();
      this.thrusterGain.gain.setValueAtTime(0.01, now);
      this.thrusterGain.gain.linearRampToValueAtTime(0.12, now + 0.08);

      this.thrusterSource.connect(filter);
      filter.connect(this.thrusterGain);
      this.thrusterGain.connect(this.ctx.destination);
      this.thrusterSource.start(now);
      this.thrusterNode = true;
    } catch (e) {}
  }

  stopThruster() {
    if (!this.ctx || !this.thrusterNode || !this.thrusterGain) return;
    try {
      const now = this.ctx.currentTime;
      this.thrusterGain.gain.linearRampToValueAtTime(0.001, now + 0.08);
      setTimeout(() => {
        if (this.thrusterSource) {
          try { this.thrusterSource.stop(); } catch (e) {}
          this.thrusterSource = null;
        }
        this.thrusterNode = false;
      }, 90);
    } catch (e) {
      this.thrusterNode = false;
    }
  }
}

class CombatManager {
  constructor(game) {
    this.game = game;
    this.sfx = new SoundFX();

    this.projectiles = [];
    this.particles = [];
    this.floatingTexts = [];
  }

  update(deltaMs) {
    const deltaSec = deltaMs / 1000;
    const physics = this.game.physics;
    const player = this.game.player;
    const enemies = this.game.enemies;

    // Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= deltaSec;
      if (p.life <= 0) {
        this.projectiles.splice(i, 1);
        continue;
      }

      p.prevX = p.x;
      p.prevY = p.y;
      p.x += p.vx;
      p.y += p.vy;

      let hitDetected = false;

      // 1. Check solid level collisions (Ground & Platforms)
      if (p.y >= physics.groundY - 4) {
        this.spawnImpactSparks(p.x, physics.groundY, '#cbd5e1', 6);
        this.sfx.playHit(false);
        hitDetected = true;
      } else {
        // Platform collisions
        for (let j = 0; j < physics.platforms.length; j++) {
          const plat = physics.platforms[j];
          const left = plat.position.x - 120;
          const right = plat.position.x + 120;
          const top = plat.position.y - 12;
          const bot = plat.position.y + 12;

          if (p.x >= left && p.x <= right && p.y >= top && p.y <= bot) {
            this.spawnImpactSparks(p.x, p.y, '#94a3b8', 6);
            this.sfx.playHit(false);
            hitDetected = true;
            break;
          }
        }
      }

      if (hitDetected) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check explosive barrels
      const level = this.game.level;
      if (level && level.barrels) {
        for (let bIdx = 0; bIdx < level.barrels.length; bIdx++) {
          const b = level.barrels[bIdx];
          if (b.isBlown) continue;
          if (Math.abs(p.x - b.x) < 14 && Math.abs(p.y - b.y) < 16) {
            b.flashTimer = 80;
            b.hp -= p.damage;
            this.spawnImpactSparks(p.x, p.y, '#f59e0b', 8);
            if (b.hp <= 0) {
              level.explodeBarrel(b);
            }
            hitDetected = true;
            break;
          }
        }
      }

      if (hitDetected) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // 2. Player Bullet vs Enemies
      if (p.isPlayerBullet) {
        for (let eIdx = 0; eIdx < enemies.length; eIdx++) {
          const enemy = enemies[eIdx];
          if (enemy.isDead) continue;

          if (enemy.checkBulletHit(p)) {
            // Check Headshot for Soldier
            let isHeadshot = false;
            let finalDmg = p.damage;
            if (enemy.type === 'soldier' && enemy.body) {
              const headY = enemy.body.position.y - 38;
              if (Math.abs(p.y - headY) < 14) {
                isHeadshot = true;
                finalDmg = Math.floor(p.damage * 1.8);
              }
            }

            // Apply damage & knockback
            enemy.takeDamage(finalDmg, { x: p.vx * 0.45, y: p.vy * 0.45 }, p.knockback * (isHeadshot ? 1.6 : 1.0));

            this.spawnImpactSparks(p.x, p.y, isHeadshot ? '#fbbf24' : p.color, isHeadshot ? 16 : 10);
            this.spawnDamageText(p.x, p.y - 14, finalDmg, false, isHeadshot);
            this.sfx.playHit(enemy.type === 'soldier');

            if (isHeadshot) {
              this.game.addScreenShake(6);
            }

            hitDetected = true;
            break;
          }
        }
      } else {
        // 3. Enemy Bullet vs Player
        if (player && !player.isKnockedOut) {
          if (!player.isDodging && player.checkBulletHit(p)) {
            player.takeDamage(p.damage, { x: p.vx * 0.35, y: p.vy * 0.35 });

            this.spawnImpactSparks(p.x, p.y, '#ef4444', 12);
            this.spawnDamageText(p.x, p.y - 16, p.damage, true);
            this.sfx.playHit(true);
            this.game.addScreenShake(6);

            hitDetected = true;
          }
        }
      }

      if (hitDetected) {
        this.projectiles.splice(i, 1);
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const part = this.particles[i];
      part.x += part.vx;
      part.y += part.vy;
      part.alpha -= part.decay;
      if (part.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y += t.vy;
      t.life -= deltaSec;
      t.alpha = Math.max(0, t.life / 0.7);
      if (t.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  spawnImpactSparks(x, y, color = '#38bdf8', count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 3 + 1,
        color: color,
        alpha: 1.0,
        decay: 0.05 + Math.random() * 0.04
      });
    }
  }

  spawnDamageText(x, y, damage, isPlayerHurt = false, isCrit = false) {
    this.floatingTexts.push({
      x: x + (Math.random() - 0.5) * 14,
      y: y,
      text: isCrit ? `-${damage}! CRIT` : `-${damage}`,
      color: isPlayerHurt ? '#ef4444' : (isCrit ? '#facc15' : '#ffffff'),
      vy: isCrit ? -3.0 : -2.2,
      alpha: 1.0,
      life: isCrit ? 1.0 : 0.7,
      isCrit: isCrit
    });
  }

  draw(ctx, camera) {
    ctx.save();

    // 1. Render Projectiles (with glowing streaks)
    for (let i = 0; i < this.projectiles.length; i++) {
      const p = this.projectiles[i];
      if (!camera.isVisible(p.x, p.y, 40)) continue;

      // Glow halo
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.radius * 2;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(p.prevX, p.prevY);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();

      // Bright white core
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = p.radius * 0.8;
      ctx.beginPath();
      ctx.moveTo(p.prevX, p.prevY);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }

    // 2. Render Particles
    for (let i = 0; i < this.particles.length; i++) {
      const part = this.particles[i];
      if (!camera.isVisible(part.x, part.y, 20)) continue;
      ctx.globalAlpha = Math.max(0, part.alpha);
      ctx.fillStyle = part.color;
      ctx.beginPath();
      ctx.arc(part.x, part.y, part.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Render Floating Texts
    for (let i = 0; i < this.floatingTexts.length; i++) {
      const t = this.floatingTexts[i];
      if (!camera.isVisible(t.x, t.y, 30)) continue;
      ctx.globalAlpha = Math.max(0, t.alpha);
      ctx.font = '900 16px sans-serif';
      ctx.fillStyle = t.color;
      ctx.strokeStyle = '#050810';
      ctx.lineWidth = 3;
      ctx.textAlign = 'center';
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillText(t.text, t.x, t.y);
    }

    ctx.restore();
  }

  reset() {
    this.projectiles = [];
    this.particles = [];
    this.floatingTexts = [];
  }
}
