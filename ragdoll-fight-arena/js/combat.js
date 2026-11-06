/**
 * Combat system: hit detection, damage calculations, hitboxes,
 * impact physics impulses, floating damage text, particle FX, and Web Audio SFX.
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
      console.warn('Web Audio not supported or blocked:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playWhoosh(pitch = 1.0) {
    if (!this.ctx) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320 * pitch, now);
    osc.frequency.exponentialRampToValueAtTime(100 * pitch, now + 0.12);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  playHit(isHeavy = false) {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;

    // Sub thud
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    const startFreq = isHeavy ? 240 : 180;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + (isHeavy ? 0.22 : 0.12));

    oscGain.gain.setValueAtTime(isHeavy ? 0.6 : 0.35, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + (isHeavy ? 0.25 : 0.14));
    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + (isHeavy ? 0.26 : 0.15));

    // Impact crack noise
    const bufferSize = Math.floor(this.ctx.sampleRate * (isHeavy ? 0.15 : 0.08));
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = isHeavy ? 'lowpass' : 'bandpass';
    filter.frequency.value = isHeavy ? 1200 : 1800;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(isHeavy ? 0.5 : 0.28, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + (isHeavy ? 0.15 : 0.08));

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    whiteNoise.start(now);
  }

  playDodge() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.18);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.19);
  }

  playKnockout() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;

    // Dramatic gong / bell boom
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(140, now);
    osc1.frequency.exponentialRampToValueAtTime(40, now + 1.2);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(280, now);
    osc2.frequency.exponentialRampToValueAtTime(80, now + 0.9);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 1.2);
    osc2.stop(now + 1.2);
  }
}

class CombatManager {
  constructor(game) {
    this.game = game;
    this.sfx = new SoundFX();

    this.particles = [];
    this.floatingTexts = [];
    this.attackCounter = 0;

    // Attack configuration
    this.ATTACKS = {
      NORMAL: {
        id: 'NORMAL',
        damage: 10,
        windupMs: 70,
        activeMs: 110,
        recoveryMs: 120,
        cooldownMs: 240,
        fistRadius: 18,
        reach: 52,
        knockbackX: 13,
        knockbackY: -4.5,
        angularImpulse: 0.14,
        stunMs: 180,
        screenShake: 4
      },
      HEAVY: {
        id: 'HEAVY',
        damage: 28,
        windupMs: 220,
        activeMs: 140,
        recoveryMs: 240,
        cooldownMs: 580,
        fistRadius: 26,
        reach: 70,
        knockbackX: 24,
        knockbackY: -8.0,
        angularImpulse: 0.32,
        stunMs: 380,
        screenShake: 11
      }
    };
  }

  generateAttackId() {
    return ++this.attackCounter;
  }

  /**
   * Evaluates hit detection between an attacker's punch and target defender.
   */
  processHitCheck(attacker, defender) {
    if (!attacker.currentAttack || !attacker.currentAttack.active) return false;
    if (attacker.currentAttack.hasHit) return false; // Prevent repeated damage in single punch
    if (defender.isKnockedOut) return false;

    // Defender invulnerability during dodge
    if (defender.isDodging && defender.isInvulnerable) {
      return false;
    }

    const fist = attacker.getFistWorldPosition();
    const attackDef = attacker.currentAttack.config;
    const fistRadius = attackDef.fistRadius;

    // Defender hurtbox (torso capsule/circle representation)
    const defPos = defender.body.position;
    const torsoTop = { x: defPos.x, y: defPos.y - 36 };
    const torsoBottom = { x: defPos.x, y: defPos.y + 24 };

    // Distance from fist to vertical segment between torsoTop and torsoBottom
    const distSq = this.distToSegmentSq(fist, torsoTop, torsoBottom);
    const hurtboxRadius = 26;
    const hitRadius = fistRadius + hurtboxRadius;

    if (distSq <= hitRadius * hitRadius) {
      // Valid hit confirmed!
      attacker.currentAttack.hasHit = true;
      this.executeHit(attacker, defender, attackDef, fist);
      return true;
    }

    return false;
  }

  /**
   * Applies damage, physics knockback, audio-visual feedback, and knockout check.
   */
  executeHit(attacker, defender, attackDef, impactPos) {
    const isHeavy = attackDef.id === 'HEAVY';

    // 1. Damage target
    const finalDamage = attackDef.damage;
    defender.health = Math.max(0, defender.health - finalDamage);

    // 2. Play Audio FX
    this.sfx.playHit(isHeavy);

    // 3. Screen shake
    if (this.game) {
      this.game.addScreenShake(attackDef.screenShake);
    }

    // 4. Knockback & Physics reaction
    const facing = attacker.facing;
    const kbX = attackDef.knockbackX * facing;
    const kbY = attackDef.knockbackY;

    if (defender.health <= 0) {
      // Knockout!
      defender.triggerKnockout({ x: kbX * 1.3, y: kbY * 1.3 }, isHeavy);
      this.sfx.playKnockout();
      if (this.game) {
        this.game.addScreenShake(isHeavy ? 18 : 14);
      }
    } else {
      // Stun and impulse
      defender.applyHitStun(attackDef.stunMs, facing, isHeavy);
      Matter.Body.setVelocity(defender.body, {
        x: kbX,
        y: kbY
      });
      // Add rotational whip / wobble
      Matter.Body.setAngularVelocity(defender.body, attackDef.angularImpulse * facing);
    }

    // 5. Visual hit effects
    this.spawnHitSparks(impactPos.x, impactPos.y, facing, isHeavy);
    this.spawnDamageText(impactPos.x, impactPos.y - 20, finalDamage, isHeavy);

    // 6. Update UI Immediately
    if (this.game && this.game.ui) {
      this.game.ui.updateHealth();
    }
  }

  spawnHitSparks(x, y, facing, isHeavy) {
    const count = isHeavy ? 24 : 12;
    const sparkColor = isHeavy ? '#f59e0b' : '#38bdf8';

    for (let i = 0; i < count; i++) {
      const angle = (facing > 0 ? 0 : Math.PI) + (Math.random() - 0.5) * 1.6;
      const speed = (isHeavy ? 5 : 3.5) + Math.random() * (isHeavy ? 9 : 6);
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        radius: Math.random() * (isHeavy ? 4.5 : 3) + 1.5,
        color: Math.random() > 0.4 ? sparkColor : '#ffffff',
        alpha: 1.0,
        decay: 0.025 + Math.random() * 0.035,
        gravity: 0.28
      });
    }

    // Shockwave ring
    this.particles.push({
      x: x,
      y: y,
      isRing: true,
      radius: 6,
      maxRadius: isHeavy ? 46 : 28,
      expandSpeed: isHeavy ? 3.8 : 2.5,
      color: isHeavy ? '#fbbf24' : '#7dd3fc',
      alpha: 0.9,
      decay: 0.05
    });
  }

  spawnDamageText(x, y, damage, isHeavy) {
    this.floatingTexts.push({
      x: x + (Math.random() - 0.5) * 16,
      y: y,
      text: isHeavy ? `-${damage}!` : `-${damage}`,
      color: isHeavy ? '#facc15' : '#ffffff',
      fontSize: isHeavy ? 26 : 18,
      vy: -2.8,
      alpha: 1.0,
      scale: isHeavy ? 1.4 : 1.1,
      life: 0.85
    });
  }

  update(deltaSeconds) {
    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (p.isRing) {
        p.radius += p.expandSpeed;
        p.alpha -= p.decay;
        if (p.alpha <= 0 || p.radius >= p.maxRadius) {
          this.particles.splice(i, 1);
        }
      } else {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.alpha -= p.decay;
        if (p.alpha <= 0) {
          this.particles.splice(i, 1);
        }
      }
    }

    // Update Floating Damage Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y += t.vy;
      t.vy *= 0.92;
      t.life -= deltaSeconds;
      t.alpha = Math.max(0, t.life / 0.85);
      if (t.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    ctx.save();

    // Render particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      ctx.globalAlpha = Math.max(0, p.alpha);
      if (p.isRing) {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Render floating damage texts
    for (let i = 0; i < this.floatingTexts.length; i++) {
      const t = this.floatingTexts[i];
      ctx.globalAlpha = Math.max(0, t.alpha);
      ctx.font = `900 ${t.fontSize}px sans-serif`;
      ctx.fillStyle = t.color;
      ctx.strokeStyle = '#05070c';
      ctx.lineWidth = 3.5;
      ctx.textAlign = 'center';
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillText(t.text, t.x, t.y);
    }

    ctx.restore();
  }

  distToSegmentSq(p, v, w) {
    const l2 = (w.x - v.x) * (w.x - v.x) + (w.y - v.y) * (w.y - v.y);
    if (l2 === 0) return (p.x - v.x) * (p.x - v.x) + (p.y - v.y) * (p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    const projX = v.x + t * (w.x - v.x);
    const projY = v.y + t * (w.y - v.y);
    return (p.x - projX) * (p.x - projX) + (p.y - projY) * (p.y - projY);
  }

  reset() {
    this.particles = [];
    this.floatingTexts = [];
    this.attackCounter = 0;
  }
}
