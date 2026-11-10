/**
 * Monster Knockout - Main Game Configuration
 * Mode: Continuous Survival / Endless Arcade Combat
 * Viewport: Desktop Widescreen Landscape (1280x720, 16:9)
 * Framework: Phaser 3 (v3.80.1) with Matter.js 2D Physics
 */

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#040d18',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720
  },
  physics: {
    default: 'matter',
    matter: {
      gravity: { y: 1.25 },
      debug: false
    }
  },
  scene: [
    BootScene,
    MenuScene,
    GameScene,
    UIScene
  ]
};

window.addEventListener('DOMContentLoaded', () => {
  window.monsterKnockoutGame = new Phaser.Game(config);
  console.log('🥊 Monster Knockout - Continuous Survival Foundation Initialized');
});
