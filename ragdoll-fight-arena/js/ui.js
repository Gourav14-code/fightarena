/**
 * UI Manager: handles health bars with chip-damage lag interpolation,
 * HP labels, victory/defeat modal screens, and restart binding.
 */
class UIManager {
  constructor(game) {
    this.game = game;

    // DOM Elements
    this.playerHpText = document.getElementById('player-hp-text');
    this.playerHealthFill = document.getElementById('player-health-fill');
    this.playerLagFill = document.getElementById('player-lag-fill');

    this.enemyHpText = document.getElementById('enemy-hp-text');
    this.enemyHealthFill = document.getElementById('enemy-health-fill');
    this.enemyLagFill = document.getElementById('enemy-lag-fill');

    this.modalOverlay = document.getElementById('modal-overlay');
    this.modalTitle = document.getElementById('modal-title');
    this.modalSubtitle = document.getElementById('modal-subtitle');
    this.btnRestart = document.getElementById('btn-restart');

    this.playerLagHp = 100;
    this.enemyLagHp = 100;

    this.setupListeners();
  }

  setupListeners() {
    if (this.btnRestart) {
      this.btnRestart.addEventListener('click', () => {
        this.game.restart();
      });
    }

    window.addEventListener('keydown', (e) => {
      // If modal is active and user presses Space or Enter, restart
      if (this.modalOverlay && this.modalOverlay.style.display === 'flex') {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          this.game.restart();
        }
      }
    });
  }

  updateHealth() {
    const player = this.game.player;
    const enemy = this.game.enemy;

    if (player) {
      const pHp = Math.max(0, player.health);
      const pPercent = (pHp / player.maxHealth) * 100;
      this.playerHealthFill.style.width = `${pPercent}%`;
      this.playerHpText.textContent = `${Math.ceil(pHp)} HP`;

      // Update lag bar smoothly
      if (this.playerLagHp > pHp) {
        this.playerLagHp -= (this.playerLagHp - pHp) * 0.12;
        this.playerLagFill.style.width = `${(this.playerLagHp / player.maxHealth) * 100}%`;
      } else {
        this.playerLagHp = pHp;
        this.playerLagFill.style.width = `${pPercent}%`;
      }
    }

    if (enemy) {
      const eHp = Math.max(0, enemy.health);
      const ePercent = (eHp / enemy.maxHealth) * 100;
      this.enemyHealthFill.style.width = `${ePercent}%`;
      this.enemyHpText.textContent = `${Math.ceil(eHp)} HP`;

      if (this.enemyLagHp > eHp) {
        this.enemyLagHp -= (this.enemyLagHp - eHp) * 0.12;
        this.enemyLagFill.style.width = `${(this.enemyLagHp / enemy.maxHealth) * 100}%`;
      } else {
        this.enemyLagHp = eHp;
        this.enemyLagFill.style.width = `${ePercent}%`;
      }
    }
  }

  showGameOver(winner) {
    if (!this.modalOverlay) return;

    this.modalTitle.className = 'modal-title ' + (winner === 'player' ? 'victory' : 'defeat');
    if (winner === 'player') {
      this.modalTitle.textContent = 'VICTORY!';
      this.modalSubtitle.textContent = 'Spectacular knockout! The arena is yours.';
    } else {
      this.modalTitle.textContent = 'DEFEAT!';
      this.modalSubtitle.textContent = 'You were knocked out. Dust yourself off and fight again.';
    }

    this.modalOverlay.style.display = 'flex';
  }

  hideGameOver() {
    if (this.modalOverlay) {
      this.modalOverlay.style.display = 'none';
    }
  }

  reset() {
    this.hideGameOver();
    this.playerLagHp = 100;
    this.enemyLagHp = 100;
    this.updateHealth();
  }
}
