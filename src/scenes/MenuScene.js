/**
 * MenuScene: Displays game title, animated bouncing Gloop mascot,
 * Start Survival button, and Personal Best Kill Record badge.
 * Viewport: 1280x720 Widescreen Landscape.
 */
class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const { width, height } = this.scale;

    // Atmospheric Prehistoric Jungle Background
    this.bg = this.add.graphics();
    this.drawBackground(width, height);

    // Floating jungle spores
    this.createAmbientSpores(width, height);

    // UI Container centered
    this.uiContainer = this.add.container(width / 2, height / 2);

    // Title
    this.titleText = this.add.text(0, -height * 0.28, 'MONSTER KNOCKOUT', {
      fontFamily: 'sans-serif',
      fontSize: '48px',
      fontWeight: '900',
      color: '#f8fafc',
      stroke: '#0891b2',
      strokeThickness: 8,
      align: 'center',
      shadow: { blur: 20, color: '#06b6d4', fill: true }
    }).setOrigin(0.5);
    this.uiContainer.add(this.titleText);

    // Subtitle
    this.subtitleText = this.add.text(0, -height * 0.18, 'Endless Physics Creature Survival', {
      fontFamily: 'sans-serif',
      fontSize: '18px',
      fontWeight: '800',
      color: '#38bdf8',
      letterSpacing: 2
    }).setOrigin(0.5);
    this.uiContainer.add(this.subtitleText);

    // Animated Gloop Mascot with squash & stretch
    this.mascot = this.add.sprite(0, -height * 0.02, 'creature_gloop').setScale(1.1);
    this.uiContainer.add(this.mascot);

    this.tweens.add({
      targets: this.mascot,
      y: -height * 0.02 - 14,
      scaleY: 1.16,
      scaleX: 1.04,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // START SURVIVAL Button
    this.btnPlay = this.createButton(0, height * 0.18, 'START SURVIVAL', 0x059669, 0x34d399, () => {
      this.cameras.main.fadeOut(250, 5, 15, 26);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene');
      });
    });
    this.uiContainer.add(this.btnPlay);

    // Personal Best Kills Record Badge
    const bestKills = parseInt(localStorage.getItem('monster_knockout_best_kills') || '0', 10);
    const bestScore = parseInt(localStorage.getItem('monster_knockout_best_score') || '0', 10);

    const recordContainer = this.add.container(0, height * 0.32);
    const recordBg = this.add.graphics();
    recordBg.fillStyle(0x0f172a, 0.9);
    recordBg.fillRoundedRect(-140, -16, 280, 32, 16);
    recordBg.lineStyle(1.5, 0xf59e0b, 0.8);
    recordBg.strokeRoundedRect(-140, -16, 280, 32, 16);

    const recordText = this.add.text(0, 0, `👑 BEST: ${bestKills} KILLS  •  ${bestScore} PTS`, {
      fontFamily: 'sans-serif',
      fontSize: '12px',
      fontWeight: '800',
      color: '#facc15',
      letterSpacing: 1
    }).setOrigin(0.5);

    recordContainer.add([recordBg, recordText]);
    this.uiContainer.add(recordContainer);

    this.scale.on('resize', this.handleResize, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.handleResize, this);
    });

    this.cameras.main.fadeIn(300, 5, 15, 26);
  }

  createButton(x, y, text, bgColor, strokeColor, callback) {
    const btn = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(bgColor, 1);
    bg.fillRoundedRect(-140, -28, 280, 56, 16);
    bg.lineStyle(2.5, strokeColor, 0.9);
    bg.strokeRoundedRect(-140, -28, 280, 56, 16);

    const label = this.add.text(0, 0, text, {
      fontFamily: 'sans-serif',
      fontSize: '18px',
      fontWeight: '900',
      color: '#ffffff',
      letterSpacing: 1.5
    }).setOrigin(0.5);

    btn.add([bg, label]);
    btn.setSize(280, 56);
    btn.setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setScale(1.05));
    btn.on('pointerout', () => btn.setScale(1.0));
    btn.on('pointerdown', () => btn.setScale(0.96));
    btn.on('pointerup', () => {
      btn.setScale(1.0);
      callback();
    });

    return btn;
  }

  drawBackground(w, h) {
    this.bg.clear();
    this.bg.fillStyle(0x040d18, 1);
    this.bg.fillRect(0, 0, w, h);

    // Glowing center moon/spore haze
    this.bg.fillStyle(0x0284c7, 0.08);
    this.bg.fillCircle(w / 2, h * 0.45, Math.min(w, h) * 0.5);
  }

  createAmbientSpores(w, h) {
    for (let i = 0; i < 24; i++) {
      const spore = this.add.circle(
        Phaser.Math.Between(20, w - 20),
        Phaser.Math.Between(40, h - 40),
        Phaser.Math.Between(2, 4),
        0x10b981,
        Phaser.Math.FloatBetween(0.3, 0.7)
      );

      this.tweens.add({
        targets: spore,
        y: spore.y - Phaser.Math.Between(30, 80),
        alpha: { from: spore.alpha, to: 0 },
        duration: Phaser.Math.Between(2200, 4800),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  handleResize(gameSize) {
    const { width, height } = gameSize;
    this.drawBackground(width, height);
    this.uiContainer.setPosition(width / 2, height / 2);
  }
}
