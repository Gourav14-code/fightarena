/**
 * UIScene: Survival HUD for Widescreen Desktop (1280x720).
 * Features:
 * - Prominent Center Kills Counter: "💀 KILLS: X" with Score and Survival Time.
 * - Dual Health Bars with character avatar medallions (Gloop vs Goblin).
 * - Floating thumb & mouse weapon selector tray (Boulder, Puffer, Slime, Bone).
 * - Desktop keyboard hotkeys [1] - [4] with visual badges.
 * - Live Survival Timer (MM:SS).
 * - Pause and Mute icon buttons.
 */
class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  init(data) {
    this.kills = data.kills || 0;
    this.score = data.score || 0;
    this.playerHealth = data.playerHealth !== undefined ? data.playerHealth : 100;
    this.enemyHealth = data.enemyHealth !== undefined ? data.enemyHealth : 45;
    this.maxPlayerHealth = 100;
    this.maxEnemyHealth = 45;
    this.activeWeaponClass = 'slingshot'; // 'slingshot' | 'bow'
    this.activeWeapon = 'boulder';        // active ammo when slingshot selected
    this.isBowUnlocked = this.kills >= 3;
    this.survivalSeconds = 0;
  }

  create() {
    const { width, height } = this.scale;

    this.topHudContainer = this.add.container(0, 0).setDepth(100);
    this.bottomTrayContainer = this.add.container(0, 0).setDepth(100);

    this.setupTopHUD(width, height);
    this.setupWeaponTray(width, height);

    // Live Survival Timer (ticks every second)
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: this.tickSurvivalTimer,
      callbackScope: this,
      loop: true
    });

    // Keyboard 1–4 shortcuts for desktop ammo & Q/TAB for weapon switching
    if (this.input && this.input.keyboard) {
      this.input.keyboard.on('keydown-ONE', () => this.selectWeapon('boulder'));
      this.input.keyboard.on('keydown-TWO', () => this.selectWeapon('puffer'));
      this.input.keyboard.on('keydown-THREE', () => this.selectWeapon('slime'));
      this.input.keyboard.on('keydown-FOUR', () => this.selectWeapon('bone'));
      this.input.keyboard.on('keydown-Q', () => this.toggleWeaponClass());
      this.input.keyboard.on('keydown-TAB', (e) => {
        if (e && e.preventDefault) e.preventDefault();
        this.toggleWeaponClass();
      });
    }

    this.scale.on('resize', this.handleResize, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.handleResize, this);
      if (this.timerEvent) this.timerEvent.remove(false);
    });
  }

  setupTopHUD(w, h) {
    this.topHudContainer.removeAll(true);

    const hudY = 48;

    // 1. Center Kills & Score Badge (Prominent Prehistoric Gold Plaque)
    const centerBadge = this.add.container(w / 2, hudY);

    const badgeBg = this.add.graphics();
    badgeBg.fillStyle(0x0a1420, 0.95);
    badgeBg.fillRoundedRect(-110, -26, 220, 52, 16);
    badgeBg.lineStyle(2, 0xf59e0b, 0.9);
    badgeBg.strokeRoundedRect(-110, -26, 220, 52, 16);

    // Gold Corner Rivets
    badgeBg.fillStyle(0xfbbf24, 1);
    badgeBg.fillCircle(-102, -18, 2.5);
    badgeBg.fillCircle(102, -18, 2.5);
    badgeBg.fillCircle(-102, 18, 2.5);
    badgeBg.fillCircle(102, 18, 2.5);

    // Big Prominent Kill Counter
    this.killsText = this.add.text(0, -7, `💀 KILLS: ${this.kills}`, {
      fontFamily: 'sans-serif',
      fontSize: '18px',
      fontWeight: '900',
      color: '#fbbf24',
      letterSpacing: 2
    }).setOrigin(0.5);

    // Sub-row: Score & Timer
    this.subInfoText = this.add.text(0, 13, `SCORE: ${this.score}  •  ⏱ 00:00`, {
      fontFamily: 'sans-serif',
      fontSize: '11px',
      fontWeight: '800',
      color: '#94a3b8',
      letterSpacing: 1
    }).setOrigin(0.5);

    centerBadge.add([badgeBg, this.killsText, this.subInfoText]);
    this.topHudContainer.add(centerBadge);

    // 2. Player Hero Health Bar (Top Left)
    const barWidth = 200;
    const playerX = 180;
    this.playerHealthUI = this.createHealthBar(playerX, hudY, 'GLOOP', 0x06b6d4, 0x22d3ee, 'avatar_gloop', true, barWidth, this.playerHealth, this.maxPlayerHealth);

    // 3. Enemy Rival Health Bar (Top Right)
    const enemyX = w - 180;
    this.enemyHealthUI = this.createHealthBar(enemyX, hudY, 'GOBLIN', 0xd946ef, 0xf472b6, 'avatar_goblin', false, barWidth, this.enemyHealth, this.maxEnemyHealth);

    // 4. Menu & Mute/Restart Buttons (Left & Right Flanks)
    const btnMenu = this.createIconButton(38, hudY, '≡', () => {
      this.scene.stop('UIScene');
      this.scene.stop('GameScene');
      this.scene.start('MenuScene');
    });
    this.topHudContainer.add(btnMenu);

    const btnRestart = this.createIconButton(w - 38, hudY, '↺', () => {
      this.scene.stop('UIScene');
      this.scene.get('GameScene').scene.restart();
    });
    this.topHudContainer.add(btnRestart);
  }

  createHealthBar(x, y, label, mainColor, highlightColor, avatarKey, isPlayer, barWidth, currentHp, maxHp) {
    const barHeight = 20;
    const container = this.add.container(x, y);

    // Outer Dark Stone Track
    const track = this.add.graphics();
    track.fillStyle(0x060c14, 0.95);
    track.fillRoundedRect(-barWidth / 2, -barHeight / 2, barWidth, barHeight, 7);
    track.lineStyle(2, 0x1e293b, 1);
    track.strokeRoundedRect(-barWidth / 2, -barHeight / 2, barWidth, barHeight, 7);

    // Health Fill
    const fill = this.add.graphics();
    const updateFill = (hp, max) => {
      fill.clear();
      const pct = Math.max(0, Math.min(1, hp / max));
      const fw = (barWidth - 4) * pct;
      if (fw > 0) {
        fill.fillStyle(mainColor, 1);
        fill.fillRoundedRect(-barWidth / 2 + 2, -barHeight / 2 + 2, fw, barHeight - 4, 5);
        fill.fillStyle(highlightColor, 0.6);
        fill.fillRoundedRect(-barWidth / 2 + 3, -barHeight / 2 + 3, fw - 2, (barHeight - 4) * 0.42, 3);
      }
    };
    updateFill(currentHp, maxHp);

    // Name Label Above Bar
    const title = this.add.text(isPlayer ? -barWidth / 2 + 4 : barWidth / 2 - 4, -18, label, {
      fontFamily: 'sans-serif',
      fontSize: '12px',
      fontWeight: '900',
      color: isPlayer ? '#38bdf8' : '#f472b6',
      letterSpacing: 1.2
    }).setOrigin(isPlayer ? 0 : 1, 0.5);

    // Numeric Counter
    const hpText = this.add.text(isPlayer ? barWidth / 2 - 4 : -barWidth / 2 + 4, -18, `${currentHp}/${maxHp} HP`, {
      fontFamily: 'sans-serif',
      fontSize: '11px',
      fontWeight: '800',
      color: '#94a3b8'
    }).setOrigin(isPlayer ? 1 : 0, 0.5);

    // Avatar Medallion
    const avatarX = isPlayer ? -barWidth / 2 - 22 : barWidth / 2 + 22;
    const avatar = this.add.image(avatarX, 0, avatarKey);

    container.add([track, fill, title, hpText, avatar]);
    this.topHudContainer.add(container);

    return { container, updateFill, hpText };
  }

  setupWeaponTray(w, h) {
    this.bottomTrayContainer.removeAll(true);

    const trayY = h - 68;
    this.bottomTrayContainer.setPosition(w / 2, trayY);

    const trayWidth = 490;
    const trayHeight = 84;

    // Outer Glow / Shadow
    const trayBg = this.add.graphics();
    trayBg.fillStyle(0x000000, 0.6);
    trayBg.fillRoundedRect(-trayWidth / 2 + 2, -trayHeight / 2 + 4, trayWidth, trayHeight, 18);

    trayBg.fillStyle(0x09121d, 0.95);
    trayBg.fillRoundedRect(-trayWidth / 2, -trayHeight / 2, trayWidth, trayHeight, 16);
    trayBg.lineStyle(2, 0x10b981, 0.85);
    trayBg.strokeRoundedRect(-trayWidth / 2, -trayHeight / 2, trayWidth, trayHeight, 16);

    this.bottomTrayContainer.add(trayBg);

    // =========================================================================
    // 1. TOP ROW: PRIMARY WEAPON CLASS SWITCHER TABS (Slingshot vs Bow & Arrow)
    // =========================================================================
    const tabY = -22;

    // Slingshot Tab
    this.tabSlingshot = this.add.container(-115, tabY);
    const slingBg = this.add.graphics();
    const isSlingActive = this.activeWeaponClass === 'slingshot';
    slingBg.fillStyle(isSlingActive ? 0x1e293b : 0x0f172a, 0.9);
    slingBg.fillRoundedRect(-100, -13, 200, 26, 8);
    slingBg.lineStyle(2, isSlingActive ? 0xf59e0b : 0x334155, 1);
    slingBg.strokeRoundedRect(-100, -13, 200, 26, 8);

    const slingIco = this.add.sprite(-82, 0, 'icon_weapon_slingshot').setScale(0.48);
    const slingTxt = this.add.text(-68, 0, 'SLINGSHOT [1-4]', {
      fontFamily: 'sans-serif',
      fontSize: '11px',
      fontWeight: '900',
      color: isSlingActive ? '#fbbf24' : '#94a3b8',
      letterSpacing: 1
    }).setOrigin(0, 0.5);

    this.tabSlingshot.add([slingBg, slingIco, slingTxt]);
    this.tabSlingshot.setSize(200, 26);
    this.tabSlingshot.setInteractive({ useHandCursor: true });
    this.tabSlingshot.on('pointerdown', () => this.selectWeaponClass('slingshot'));
    this.bottomTrayContainer.add(this.tabSlingshot);

    // Bow & Arrow Tab
    this.tabBow = this.add.container(115, tabY);
    const bowBg = this.add.graphics();
    const isBowActive = this.activeWeaponClass === 'bow';
    bowBg.fillStyle(isBowActive ? 0x1e293b : 0x0f172a, 0.9);
    bowBg.fillRoundedRect(-100, -13, 200, 26, 8);
    bowBg.lineStyle(2, isBowActive ? 0x38bdf8 : (this.isBowUnlocked ? 0x10b981 : 0x475569), 1);
    bowBg.strokeRoundedRect(-100, -13, 200, 26, 8);

    const bowIco = this.add.sprite(-82, 0, 'icon_weapon_bow').setScale(0.48);
    const bowLabel = this.isBowUnlocked ? 'BOW & ARROW [Q]' : '🔒 BOW (3 KILLS)';
    const bowColor = isBowActive ? '#38bdf8' : (this.isBowUnlocked ? '#34d399' : '#64748b');

    const bowTxt = this.add.text(-68, 0, bowLabel, {
      fontFamily: 'sans-serif',
      fontSize: '11px',
      fontWeight: '900',
      color: bowColor,
      letterSpacing: 1
    }).setOrigin(0, 0.5);

    this.tabBow.add([bowBg, bowIco, bowTxt]);
    this.tabBow.setSize(200, 26);
    this.tabBow.setInteractive({ useHandCursor: true });
    this.tabBow.on('pointerdown', () => this.selectWeaponClass('bow'));
    this.bottomTrayContainer.add(this.tabBow);

    // =========================================================================
    // 2. BOTTOM ROW: WEAPON CONTENT (Ammo tray for Slingshot OR Flint Arrow for Bow)
    // =========================================================================
    this.ammoContainer = this.add.container(0, 16);
    this.bottomTrayContainer.add(this.ammoContainer);

    if (this.activeWeaponClass === 'slingshot') {
      const weapons = [
        { id: 'boulder', label: 'BOULDER', keyHint: '1', texture: 'projectile_boulder', color: 0xf59e0b },
        { id: 'puffer', label: 'PUFFER', keyHint: '2', texture: 'projectile_puffer', color: 0xf97316 },
        { id: 'slime', label: 'SLIME', keyHint: '3', texture: 'projectile_slime', color: 0x84cc16 },
        { id: 'bone', label: 'BONE', keyHint: '4', texture: 'projectile_bone', color: 0x38bdf8 }
      ];

      this.weaponButtons = {};
      const startX = -123;
      const spacingX = 82;

      weapons.forEach((wpn, idx) => {
        const x = startX + idx * spacingX;
        const btn = this.add.container(x, 0);

        const btnBg = this.add.graphics();
        btnBg.fillStyle(0x131f2e, 0.9);
        btnBg.fillRoundedRect(-22, -18, 44, 36, 8);
        btnBg.lineStyle(1.5, 0x1e293b, 1);
        btnBg.strokeRoundedRect(-22, -18, 44, 36, 8);

        const ring = this.add.graphics();
        ring.lineStyle(2.5, wpn.color, 1);
        ring.strokeRoundedRect(-24, -20, 48, 40, 10);
        ring.setVisible(this.activeWeapon === wpn.id);

        const icon = this.add.sprite(0, 0, wpn.texture).setScale(0.65);

        const keyPill = this.add.container(14, -13);
        const pillBg = this.add.graphics();
        pillBg.fillStyle(0x0f172a, 0.9);
        pillBg.fillCircle(0, 0, 7);
        pillBg.lineStyle(1, wpn.color, 0.8);
        pillBg.strokeCircle(0, 0, 7);
        const keyTxt = this.add.text(0, 0, wpn.keyHint, {
          fontFamily: 'sans-serif',
          fontSize: '8.5px',
          fontWeight: '900',
          color: '#f8fafc'
        }).setOrigin(0.5);
        keyPill.add([pillBg, keyTxt]);

        btn.add([btnBg, ring, icon, keyPill]);
        btn.setSize(44, 36);
        btn.setInteractive({ useHandCursor: true });

        btn.on('pointerdown', () => this.selectWeapon(wpn.id));
        btn.on('pointerover', () => btn.setScale(1.06));
        btn.on('pointerout', () => btn.setScale(1.0));

        this.weaponButtons[wpn.id] = { container: btn, ring: ring };
        this.ammoContainer.add(btn);
      });
    } else {
      // Bow & Arrow Active Info Card
      const arrowCard = this.add.container(0, 0);
      const cardBg = this.add.graphics();
      cardBg.fillStyle(0x0f172a, 0.85);
      cardBg.fillRoundedRect(-220, -16, 440, 32, 8);
      cardBg.lineStyle(1.5, 0x38bdf8, 0.8);
      cardBg.strokeRoundedRect(-220, -16, 440, 32, 8);

      const arrowIcon = this.add.sprite(-175, 0, 'projectile_arrow').setScale(0.7);

      const statsTxt = this.add.text(-120, 0, 'FLINT ARROW: 20 DMG • 1.75x HEADSHOT CRIT • PINS TO TARGET', {
        fontFamily: 'sans-serif',
        fontSize: '11px',
        fontWeight: '900',
        color: '#38bdf8',
        letterSpacing: 0.5
      }).setOrigin(0, 0.5);

      arrowCard.add([cardBg, arrowIcon, statsTxt]);
      this.ammoContainer.add(arrowCard);
    }
  }

  selectWeaponClass(wClass) {
    if (wClass === 'bow' && !this.isBowUnlocked) {
      // Locked alert
      this.showToast('🔒 Defeat 3 enemies to unlock the Bow & Arrow!');
      this.cameras.main.shake(100, 0.003);
      return;
    }

    this.activeWeaponClass = wClass;
    const { width, height } = this.scale;
    this.setupWeaponTray(width, height);

    // Update GameScene weapon state
    const gameScene = this.scene.get('GameScene');
    if (gameScene) {
      gameScene.activeWeaponClass = wClass;
    }
  }

  toggleWeaponClass() {
    if (this.activeWeaponClass === 'slingshot') {
      this.selectWeaponClass('bow');
    } else {
      this.selectWeaponClass('slingshot');
    }
  }

  selectWeapon(weaponId) {
    this.activeWeapon = weaponId;
    if (this.weaponButtons) {
      Object.keys(this.weaponButtons).forEach(id => {
        if (this.weaponButtons[id] && this.weaponButtons[id].ring) {
          this.weaponButtons[id].ring.setVisible(id === weaponId);
        }
      });
    }
  }

  showToast(message, color = '#fbbf24') {
    const toast = this.add.text(this.scale.width / 2, this.scale.height - 130, message, {
      fontFamily: 'sans-serif',
      fontSize: '15px',
      fontWeight: '900',
      color: color,
      backgroundColor: '#0f172a',
      padding: { x: 16, y: 8 },
      stroke: '#0284c7',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(200);

    this.tweens.add({
      targets: toast,
      y: this.scale.height - 150,
      alpha: 0,
      duration: 2200,
      ease: 'Quad.easeOut',
      onComplete: () => toast.destroy()
    });
  }

  tickSurvivalTimer() {
    this.survivalSeconds++;
    const mins = Math.floor(this.survivalSeconds / 60);
    const secs = this.survivalSeconds % 60;
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    if (this.subInfoText) {
      this.subInfoText.setText(`SCORE: ${this.score}  •  ⏱ ${timeStr}`);
    }
  }

  setKills(kills) {
    this.kills = kills;
    if (this.killsText) {
      this.killsText.setText(`💀 KILLS: ${this.kills}`);
    }

    // Check Bow & Arrow Unlock Threshold (3 Kills)
    if (this.kills >= 3 && !this.isBowUnlocked) {
      this.isBowUnlocked = true;
      this.showToast('🎉 BOW & ARROW UNLOCKED! Press [Q] to Equip!', '#38bdf8');
      const { width, height } = this.scale;
      this.setupWeaponTray(width, height);
    }
  }

  setScore(score) {
    this.score = score;
    const mins = Math.floor(this.survivalSeconds / 60);
    const secs = this.survivalSeconds % 60;
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    if (this.subInfoText) {
      this.subInfoText.setText(`SCORE: ${this.score}  •  ⏱ ${timeStr}`);
    }
  }

  createIconButton(x, y, iconChar, callback) {
    const btn = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x0f172a, 0.95);
    bg.fillCircle(0, 0, 20);
    bg.lineStyle(2, 0x10b981, 0.85);
    bg.strokeCircle(0, 0, 20);

    const txt = this.add.text(0, -1, iconChar, {
      fontFamily: 'sans-serif',
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#f8fafc'
    }).setOrigin(0.5);

    btn.add([bg, txt]);
    btn.setSize(40, 40);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerdown', callback);
    btn.on('pointerover', () => btn.setScale(1.1));
    btn.on('pointerout', () => btn.setScale(1.0));

    return btn;
  }

  handleResize(gameSize) {
    const { width, height } = gameSize;
    this.setupTopHUD(width, height);
    this.setupWeaponTray(width, height);
  }
}
