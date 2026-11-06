/**
 * BootScene: Loads all resources, generates procedural placeholder textures,
 * displays an animated loading bar, and transitions to MenuScene.
 */
class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    const { width, height } = this.cameras.main;

    // Loading Screen Background
    const bg = this.add.graphics();
    bg.fillStyle(0x0f172a, 1);
    bg.fillRect(0, 0, width, height);

    // Title placeholder
    this.add.text(width / 2, height * 0.38, 'POTION LOBBER', {
      fontFamily: 'sans-serif',
      fontSize: '44px',
      fontWeight: '900',
      color: '#38bdf8'
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.43, 'PREPARING MAGIC...', {
      fontFamily: 'sans-serif',
      fontSize: '16px',
      fontWeight: '700',
      color: '#94a3b8',
      letterSpacing: 2
    }).setOrigin(0.5);

    // Progress Bar Track & Fill
    const barWidth = 320;
    const barHeight = 16;
    const barX = (width - barWidth) / 2;
    const barY = height * 0.52;

    const progressTrack = this.add.graphics();
    progressTrack.fillStyle(0x1e293b, 1);
    progressTrack.fillRoundedRect(barX, barY, barWidth, barHeight, 8);
    progressTrack.lineStyle(2, 0x334155, 1);
    progressTrack.strokeRoundedRect(barX, barY, barWidth, barHeight, 8);

    const progressFill = this.add.graphics();

    this.load.on('progress', (value) => {
      progressFill.clear();
      progressFill.fillStyle(0x38bdf8, 1);
      progressFill.fillRoundedRect(barX + 2, barY + 2, (barWidth - 4) * value, barHeight - 4, 6);
    });
  }

  create() {
    // Generate clean procedural textures for crisp resolution
    this.generateProceduralTextures();

    // Transition smoothly to Main Menu
    this.cameras.main.fadeOut(300, 15, 23, 42);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('MenuScene');
    });
  }

  generateProceduralTextures() {
    // 1. Wizard Texture (Cute Chibi Wizard)
    const wiz = this.make.graphics({ x: 0, y: 0, add: false });
    // Robe
    wiz.fillStyle(0x2563eb, 1);
    wiz.fillRoundedRect(16, 36, 32, 40, 8);
    // Face
    wiz.fillStyle(0xfde047, 1);
    wiz.fillCircle(32, 28, 14);
    // Eyes
    wiz.fillStyle(0x0f172a, 1);
    wiz.fillCircle(27, 26, 2.5);
    wiz.fillCircle(37, 26, 2.5);
    // White Beard
    wiz.fillStyle(0xf8fafc, 1);
    wiz.fillTriangle(20, 32, 44, 32, 32, 50);
    // Wizard Pointy Hat
    wiz.fillStyle(0x1d4ed8, 1);
    wiz.fillTriangle(10, 20, 54, 20, 32, -4);
    // Hat Yellow Star
    wiz.fillStyle(0xfacc15, 1);
    wiz.fillCircle(32, 10, 3.5);
    wiz.generateTexture('wizard', 64, 80);

    // 2. Potion Flask Texture
    const potion = this.make.graphics({ x: 0, y: 0, add: false });
    // Glass Cork
    potion.fillStyle(0xb45309, 1);
    potion.fillRoundedRect(18, 2, 12, 8, 2);
    // Glass Neck
    potion.fillStyle(0x94a3b8, 0.4);
    potion.fillRect(20, 8, 8, 10);
    // Round Glass Flask Body
    potion.fillStyle(0x38bdf8, 1);
    potion.fillCircle(24, 32, 16);
    // Glass shine highlight
    potion.fillStyle(0xffffff, 0.6);
    potion.fillCircle(18, 26, 4);
    potion.generateTexture('potion_ice', 48, 54);

    // Goo Potion (Green)
    potion.clear();
    potion.fillStyle(0xb45309, 1); potion.fillRoundedRect(18, 2, 12, 8, 2);
    potion.fillStyle(0x94a3b8, 0.4); potion.fillRect(20, 8, 8, 10);
    potion.fillStyle(0x84cc16, 1); potion.fillCircle(24, 32, 16);
    potion.fillStyle(0xffffff, 0.6); potion.fillCircle(18, 26, 4);
    potion.generateTexture('potion_goo', 48, 54);

    // Gas Potion (Purple)
    potion.clear();
    potion.fillStyle(0xb45309, 1); potion.fillRoundedRect(18, 2, 12, 8, 2);
    potion.fillStyle(0x94a3b8, 0.4); potion.fillRect(20, 8, 8, 10);
    potion.fillStyle(0xc084fc, 1); potion.fillCircle(24, 32, 16);
    potion.fillStyle(0xffffff, 0.6); potion.fillCircle(18, 26, 4);
    potion.generateTexture('potion_gas', 48, 54);

    // Fire Potion (Orange)
    potion.clear();
    potion.fillStyle(0xb45309, 1); potion.fillRoundedRect(18, 2, 12, 8, 2);
    potion.fillStyle(0x94a3b8, 0.4); potion.fillRect(20, 8, 8, 10);
    potion.fillStyle(0xf97316, 1); potion.fillCircle(24, 32, 16);
    potion.fillStyle(0xffffff, 0.6); potion.fillCircle(18, 26, 4);
    potion.generateTexture('potion_fire', 48, 54);

    // 3. Wooden Plank Texture
    const plank = this.make.graphics({ x: 0, y: 0, add: false });
    plank.fillStyle(0xa16207, 1);
    plank.fillRoundedRect(0, 0, 160, 24, 4);
    plank.lineStyle(2, 0x713f12, 1);
    plank.strokeRoundedRect(0, 0, 160, 24, 4);
    // Wood grain lines
    plank.lineStyle(1.5, 0xca8a04, 0.6);
    plank.lineBetween(10, 8, 150, 8);
    plank.lineBetween(20, 16, 140, 16);
    plank.generateTexture('plank_horizontal', 160, 24);

    // Vertical Wood Pillar
    const pillar = this.make.graphics({ x: 0, y: 0, add: false });
    pillar.fillStyle(0x854d0e, 1);
    pillar.fillRoundedRect(0, 0, 24, 120, 4);
    pillar.lineStyle(2, 0x713f12, 1);
    pillar.strokeRoundedRect(0, 0, 24, 120, 4);
    pillar.generateTexture('pillar_vertical', 24, 120);

    // 4. Enemy Monster Texture (Cute, Soft-Bodied Cyclops Blob)
    const monster = this.make.graphics({ x: 0, y: 0, add: false });
    // Squishy round body
    monster.fillStyle(0xec4899, 1);
    monster.fillCircle(28, 30, 24);
    // Horns / Ears
    monster.fillTriangle(14, 12, 22, 12, 16, 0);
    monster.fillTriangle(34, 12, 42, 12, 40, 0);
    // Eye
    monster.fillStyle(0xffffff, 1);
    monster.fillCircle(28, 26, 10);
    monster.fillStyle(0x1e1b4b, 1);
    monster.fillCircle(28, 26, 5);
    // Silly cute mouth
    monster.lineStyle(2, 0x831843, 1);
    monster.beginPath();
    monster.arc(28, 38, 8, 0.2, Math.PI - 0.2);
    monster.strokePath();
    monster.generateTexture('monster_blob', 56, 58);

    // 5. Trajectory Dot
    const dot = this.make.graphics({ x: 0, y: 0, add: false });
    dot.fillStyle(0xffffff, 0.9);
    dot.fillCircle(5, 5, 5);
    dot.generateTexture('trajectory_dot', 10, 10);

    // 6. UI Button Background
    const btn = this.make.graphics({ x: 0, y: 0, add: false });
    btn.fillStyle(0x0284c7, 1);
    btn.fillRoundedRect(0, 0, 260, 64, 16);
    btn.lineStyle(3, 0x38bdf8, 1);
    btn.strokeRoundedRect(0, 0, 260, 64, 16);
    btn.generateTexture('ui_button_primary', 260, 64);
  }
}
