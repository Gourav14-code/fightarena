/**
 * LevelSelectScene: Campaign world map grid for World 1 (Mossy Canopy).
 * Displays levels 1 to 5, star ratings, milestone boss indicator, and back navigation.
 */
class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelSelectScene' });
  }

  create() {
    const { width, height } = this.scale;

    this.bg = this.add.graphics();
    this.drawBackground(width, height);

    this.container = this.add.container(width / 2, height / 2);

    // World Title
    this.worldTitle = this.add.text(0, -height * 0.40, 'WORLD 1: MOSSY CANOPY', {
      fontFamily: 'sans-serif',
      fontSize: '24px',
      fontWeight: '900',
      color: '#34d399',
      stroke: '#064e3b',
      strokeThickness: 4,
      letterSpacing: 1.5
    }).setOrigin(0.5);
    this.container.add(this.worldTitle);

    // Subtitle
    this.subtitle = this.add.text(0, -height * 0.35, 'Select a Stage', {
      fontFamily: 'sans-serif',
      fontSize: '15px',
      fontWeight: '700',
      color: '#94a3b8'
    }).setOrigin(0.5);
    this.container.add(this.subtitle);

    // Acorn Coins Pill
    this.createCoinsBadge(0, -height * 0.28);

    // Level Cards (1 to 5)
    this.createStageGrid();

    // Back to Menu Button
    this.btnBack = this.createBackButton(0, height * 0.40);
    this.container.add(this.btnBack);

    this.scale.on('resize', this.handleResize, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.handleResize, this);
    });

    this.cameras.main.fadeIn(250, 10, 16, 29);
  }

  createCoinsBadge(x, y) {
    const badge = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x1e293b, 0.85);
    bg.fillRoundedRect(-70, -16, 140, 32, 16);
    bg.lineStyle(1.5, 0xfbbf24, 0.7);
    bg.strokeRoundedRect(-70, -16, 140, 32, 16);

    const txt = this.add.text(0, 0, '🌰 0 ACORNS', {
      fontFamily: 'sans-serif',
      fontSize: '13px',
      fontWeight: '800',
      color: '#facc15'
    }).setOrigin(0.5);

    badge.add([bg, txt]);
    this.container.add(badge);
  }

  createStageGrid() {
    const stages = [
      { id: 1, name: 'Stage 1', isBoss: false, unlocked: true, stars: 0 },
      { id: 2, name: 'Stage 2', isBoss: false, unlocked: false, stars: 0 },
      { id: 3, name: 'Stage 3', isBoss: false, unlocked: false, stars: 0 },
      { id: 4, name: 'Stage 4', isBoss: false, unlocked: false, stars: 0 },
      { id: 5, name: 'BOSS', isBoss: true, unlocked: false, stars: 0, bossName: 'Chief Bramble' }
    ];

    const startY = -70;
    const spacingY = 78;

    stages.forEach((stg, idx) => {
      const y = startY + idx * spacingY;
      const card = this.add.container(0, y);

      const bg = this.add.graphics();
      const cardWidth = 280;
      const cardHeight = 62;

      const fillColor = stg.isBoss
        ? (stg.unlocked ? 0x991b1b : 0x1e293b)
        : (stg.unlocked ? 0x065f46 : 0x0f172a);
      const strokeColor = stg.isBoss ? 0xef4444 : (stg.unlocked ? 0x10b981 : 0x334155);

      bg.fillStyle(fillColor, 0.95);
      bg.fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 14);
      bg.lineStyle(2, strokeColor, 1);
      bg.strokeRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 14);

      // Title
      const titleTxt = this.add.text(-cardWidth / 2 + 24, -4, stg.isBoss ? '👑 BOSS: BRAMBLE' : `LEVEL ${stg.id}`, {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        fontWeight: '900',
        color: stg.unlocked ? '#ffffff' : '#64748b'
      }).setOrigin(0, 0.5);

      // Status / Stars
      const statusTxt = this.add.text(cardWidth / 2 - 24, -4, stg.unlocked ? '☆☆☆' : '🔒', {
        fontFamily: 'sans-serif',
        fontSize: stg.unlocked ? '14px' : '15px',
        color: stg.unlocked ? '#facc15' : '#64748b'
      }).setOrigin(1, 0.5);

      card.add([bg, titleTxt, statusTxt]);
      card.setSize(cardWidth, cardHeight);

      if (stg.unlocked) {
        card.setInteractive({ useHandCursor: true });
        card.on('pointerover', () => card.setScale(1.03));
        card.on('pointerout', () => card.setScale(1.0));
        card.on('pointerdown', () => {
          this.cameras.main.fadeOut(250, 10, 16, 29);
          this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('GameScene', { level: stg.id });
          });
        });
      }

      this.container.add(card);
    });
  }

  createBackButton(x, y) {
    const btn = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x334155, 1);
    bg.fillRoundedRect(-80, -22, 160, 44, 12);
    bg.lineStyle(1.5, 0x64748b, 1);
    bg.strokeRoundedRect(-80, -22, 160, 44, 12);

    const label = this.add.text(0, 0, '← MAIN MENU', {
      fontFamily: 'sans-serif',
      fontSize: '14px',
      fontWeight: '800',
      color: '#f8fafc'
    }).setOrigin(0.5);

    btn.add([bg, label]);
    btn.setSize(160, 44);
    btn.setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => {
      this.cameras.main.fadeOut(200, 10, 16, 29);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MenuScene');
      });
    });

    return btn;
  }

  drawBackground(w, h) {
    this.bg.clear();
    this.bg.fillStyle(0x060c18, 1);
    this.bg.fillRect(0, 0, w, h);
  }

  handleResize(gameSize) {
    const { width, height } = gameSize;
    this.drawBackground(width, height);
    this.container.setPosition(width / 2, height / 2);
  }
}
