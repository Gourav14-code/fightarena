/**
 * UI Manager: action HUD, dual-layer health bar, jetpack fuel gauge,
 * weapon card & ammo counters, pickup prompt banner, and pause/defeat modals.
 */
class UIManager {
  constructor(game) {
    this.game = game;

    // Elements
    this.playerHpText = document.getElementById('player-hp-text');
    this.playerHealthFill = document.getElementById('player-health-fill');
    this.playerLagFill = document.getElementById('player-lag-fill');

    this.playerFuelText = document.getElementById('player-fuel-text');
    this.playerFuelFill = document.getElementById('player-fuel-fill');

    this.waveBadge = document.getElementById('wave-badge');
    this.scoreText = document.getElementById('score-text');
    this.killsText = document.getElementById('kills-text');

    this.weaponIcon = document.getElementById('weapon-icon');
    this.weaponName = document.getElementById('weapon-name');
    this.weaponAmmo = document.getElementById('weapon-ammo');

    this.pickupPrompt = document.getElementById('pickup-prompt');
    this.pickupText = document.getElementById('pickup-text');

    this.modalOverlay = document.getElementById('modal-overlay');
    this.modalTitle = document.getElementById('modal-title');
    this.modalScore = document.getElementById('modal-score');
    this.modalKills = document.getElementById('modal-kills');
    this.modalWave = document.getElementById('modal-wave');
    this.btnPrimary = document.getElementById('btn-modal-primary');
    this.btnSecondary = document.getElementById('btn-modal-secondary');

    this.playerLagHp = 100;
    this.setupListeners();
  }

  setupListeners() {
    this.btnPrimary.addEventListener('click', () => {
      if (this.game.isPaused) {
        this.game.resume();
      } else {
        this.game.restart();
      }
    });

    this.btnSecondary.addEventListener('click', () => {
      this.game.restart();
    });
  }

  updateHealth() {
    const player = this.game.player;
    if (!player) return;

    const hp = Math.max(0, player.health);
    const percent = (hp / player.maxHealth) * 100;

    this.playerHealthFill.style.width = `${percent}%`;
    this.playerHpText.textContent = `${Math.ceil(hp)} / ${player.maxHealth}`;

    if (this.playerLagHp > hp) {
      this.playerLagHp -= (this.playerLagHp - hp) * 0.12;
      this.playerLagFill.style.width = `${(this.playerLagHp / player.maxHealth) * 100}%`;
    } else {
      this.playerLagHp = hp;
      this.playerLagFill.style.width = `${percent}%`;
    }
  }

  updateFuel(fuel) {
    const clamped = Math.max(0, Math.min(100, fuel));
    this.playerFuelFill.style.width = `${clamped}%`;
    this.playerFuelText.textContent = `${Math.ceil(clamped)}%`;
  }

  updateWeaponDisplay(weapon) {
    if (!weapon) return;
    const cfg = weapon.config;
    this.weaponIcon.textContent = cfg.icon;
    this.weaponName.textContent = cfg.name;
    this.weaponName.style.color = cfg.color;

    if (cfg.isUnlimited) {
      this.weaponAmmo.textContent = 'AMMO: ∞ (AUTO-CHARGE)';
    } else {
      this.weaponAmmo.textContent = `AMMO: ${weapon.ammo} / ${cfg.maxAmmo}`;
    }
  }

  updatePickupPrompt(pickup) {
    if (pickup) {
      this.pickupText.textContent = `EQUIP ${pickup.weaponConfig.name.toUpperCase()}`;
      this.pickupPrompt.style.display = 'flex';
    } else {
      this.pickupPrompt.style.display = 'none';
    }
  }

  updateScoreAndKills(score, kills) {
    this.scoreText.textContent = `${score}`;
    this.killsText.textContent = `${kills}`;
  }

  updateWaveBadge(wave) {
    this.waveBadge.textContent = `WAVE ${wave} – SCRAP YARD`;
  }

  showPauseMenu() {
    this.modalTitle.className = 'modal-title pause';
    this.modalTitle.textContent = 'MISSION PAUSED';
    this.modalScore.textContent = this.game.score;
    this.modalKills.textContent = this.game.kills;
    this.modalWave.textContent = this.game.waveManager.currentWave;

    this.btnPrimary.textContent = 'RESUME';
    this.btnSecondary.textContent = 'RESTART';
    this.modalOverlay.style.display = 'flex';
  }

  showDefeatScreen() {
    this.modalTitle.className = 'modal-title defeat';
    this.modalTitle.textContent = 'SOLDIER DOWN';
    this.modalScore.textContent = this.game.score;
    this.modalKills.textContent = this.game.kills;
    this.modalWave.textContent = this.game.waveManager.currentWave;

    this.btnPrimary.textContent = 'REDEPLOY';
    this.btnSecondary.textContent = 'RESTART';
    this.modalOverlay.style.display = 'flex';
  }

  hideModal() {
    this.modalOverlay.style.display = 'none';
  }

  reset() {
    this.hideModal();
    this.playerLagHp = 100;
    this.updateHealth();
    this.updateFuel(100);
    this.updateScoreAndKills(0, 0);
    this.updateWaveBadge(1);
    this.pickupPrompt.style.display = 'none';
  }
}
