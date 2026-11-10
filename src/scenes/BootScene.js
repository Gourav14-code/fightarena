/**
 * BootScene: Generates all high-definition original procedural vector assets:
 * Hero Gloop, Rival Goblin, Avatars, Organic Floating Island Perches,
 * Grounding Shadows, 4 Projectile Weapons, Trajectory Dots.
 */
class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    const { width, height } = this.cameras.main;

    // Ambient Prehistoric Sky Background
    const bg = this.add.graphics();
    bg.fillStyle(0x050f1a, 1);
    bg.fillRect(0, 0, width, height);

    // Title
    this.add.text(width / 2, height * 0.38, 'MONSTER KNOCKOUT', {
      fontFamily: 'sans-serif',
      fontSize: '40px',
      fontWeight: '900',
      color: '#38bdf8',
      stroke: '#0369a1',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.43, 'PREPARING ARENA...', {
      fontFamily: 'sans-serif',
      fontSize: '15px',
      fontWeight: '800',
      color: '#94a3b8',
      letterSpacing: 2
    }).setOrigin(0.5);

    // Animated Loading Bar
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
      progressFill.fillStyle(0x10b981, 1);
      progressFill.fillRoundedRect(barX + 2, barY + 2, (barWidth - 4) * value, barHeight - 4, 6);
    });
  }

  create() {
    this.generateProceduralAssets();

    this.cameras.main.fadeOut(250, 5, 15, 26);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('MenuScene');
    });
  }

  generateProceduralAssets() {
    // =========================================================================
    // 1. PLAYER HERO: "GLOOP" (Size: 140 x 160)
    // Lovable, bouncy turquoise creature with floppy golden ears & cartoon charm
    // =========================================================================
    const gloop = this.make.graphics({ x: 0, y: 0, add: false });
    const gw = 140, gh = 160;

    // Dark Cartoon Shadow / Outline layer
    gloop.fillStyle(0x042f2e, 1);
    gloop.fillRoundedRect(26, 42, 88, 102, 38);
    gloop.fillCircle(46, 148, 16);
    gloop.fillCircle(94, 148, 16);
    gloop.fillRoundedRect(10, 16, 28, 48, 14);
    gloop.fillRoundedRect(102, 16, 28, 48, 14);

    // Floppy Golden Ears / Antennae (Main)
    gloop.fillStyle(0xf59e0b, 1);
    gloop.fillRoundedRect(13, 19, 22, 42, 11);
    gloop.fillRoundedRect(105, 19, 22, 42, 11);
    // Ear Inner Highlights
    gloop.fillStyle(0xfde047, 1);
    gloop.fillRoundedRect(17, 23, 12, 30, 6);
    gloop.fillRoundedRect(111, 23, 12, 30, 6);

    // Chubby Turquoise Feet & Toes
    gloop.fillStyle(0x0891b2, 1);
    gloop.fillCircle(46, 146, 14);
    gloop.fillCircle(94, 146, 14);
    gloop.fillStyle(0x22d3ee, 1);
    gloop.fillCircle(44, 144, 10);
    gloop.fillCircle(92, 144, 10);
    // Toes highlights
    gloop.fillStyle(0xa5f3fc, 1);
    gloop.fillCircle(38, 148, 3.5);
    gloop.fillCircle(45, 150, 4);
    gloop.fillCircle(52, 148, 3.5);
    gloop.fillCircle(86, 148, 3.5);
    gloop.fillCircle(93, 150, 4);
    gloop.fillCircle(100, 148, 3.5);

    // Main Torso / Pear-shaped Body (Rich Cyan Gradient Feel)
    gloop.fillStyle(0x06b6d4, 1);
    gloop.fillRoundedRect(28, 44, 84, 98, 36);

    // Body 3D Volume Highlight (Upper Chest/Head Dome)
    gloop.fillStyle(0x22d3ee, 1);
    gloop.fillCircle(70, 72, 36);

    // Squishy Belly Patch (Pale Mint/Aqua)
    gloop.fillStyle(0xa5f3fc, 0.9);
    gloop.fillCircle(70, 112, 26);
    // Cute belly swirl spiral
    gloop.lineStyle(2.5, 0x0891b2, 0.65);
    gloop.beginPath();
    gloop.arc(70, 112, 12, 0.4, Math.PI * 1.6);
    gloop.strokePath();

    // Chubby Arms resting cute at sides
    gloop.fillStyle(0x0891b2, 1);
    gloop.fillCircle(24, 94, 12);
    gloop.fillCircle(116, 94, 12);
    gloop.fillStyle(0x22d3ee, 1);
    gloop.fillCircle(24, 93, 9);
    gloop.fillCircle(116, 93, 9);

    // Cheerful Rosy Cheek Blush
    gloop.fillStyle(0xf472b6, 0.4);
    gloop.fillCircle(42, 86, 9);
    gloop.fillCircle(98, 86, 9);

    // Expressive Big Cartoon Eyes
    gloop.fillStyle(0xffffff, 1);
    gloop.fillCircle(53, 68, 16);
    gloop.fillCircle(87, 68, 16);
    gloop.fillStyle(0x0f172a, 1);
    gloop.fillCircle(56, 68, 9);
    gloop.fillCircle(90, 68, 9);
    gloop.fillStyle(0x06b6d4, 1);
    gloop.fillCircle(57, 69, 5);
    gloop.fillCircle(91, 69, 5);
    gloop.fillStyle(0x0f172a, 1);
    gloop.fillCircle(56.5, 68.5, 4);
    gloop.fillCircle(90.5, 68.5, 4);
    gloop.fillStyle(0xffffff, 1);
    gloop.fillCircle(53, 64, 4.5);
    gloop.fillCircle(87, 64, 4.5);
    gloop.fillCircle(58, 71, 2);
    gloop.fillCircle(92, 71, 2);

    // Cute Cheerful Smile with tongue tip
    gloop.lineStyle(3, 0x083344, 1);
    gloop.beginPath();
    gloop.arc(70, 84, 10, 0.2, Math.PI - 0.2);
    gloop.strokePath();
    gloop.fillStyle(0xf43f5e, 1);
    gloop.fillCircle(70, 91, 4);

    // Top Head Antenna Tuft
    gloop.fillStyle(0xfbbf24, 1);
    gloop.fillCircle(70, 36, 6);

    gloop.generateTexture('creature_gloop', gw, gh);

    // Gloop Hurt Expression Texture
    this.createGloopVariant('creature_gloop_hurt', 'hurt');
    // Gloop KO Ragdoll Texture
    this.createGloopVariant('creature_gloop_ko', 'ko');

    // =========================================================================
    // 2. ENEMY RIVAL: "GIGGLE-GOBLIN" (Size: 140 x 160)
    // Sassy, quirky fuchsia imp with tribal horns, fangs & sneaky mischievous eyes
    // =========================================================================
    const goblin = this.make.graphics({ x: 0, y: 0, add: false });
    const ew = 140, eh = 160;

    // Dark Cartoon Shadow / Outline layer
    goblin.fillStyle(0x4a044e, 1);
    goblin.fillRoundedRect(28, 44, 84, 96, 34);
    goblin.fillTriangle(26, 48, 44, 48, 28, 4);
    goblin.fillTriangle(96, 48, 114, 48, 112, 4);
    goblin.fillTriangle(14, 76, 32, 64, 32, 88);
    goblin.fillTriangle(126, 76, 108, 64, 108, 88);
    goblin.fillCircle(48, 146, 15);
    goblin.fillCircle(92, 146, 15);

    // Tribal Horns (Warm Amber with Etched Dark Rings)
    goblin.fillStyle(0xf59e0b, 1);
    goblin.fillTriangle(28, 46, 42, 46, 30, 8);
    goblin.fillTriangle(98, 46, 112, 46, 110, 8);
    goblin.fillStyle(0xd97706, 1);
    goblin.fillRect(29, 26, 10, 4);
    goblin.fillRect(101, 26, 10, 4);
    goblin.fillRect(32, 16, 6, 3);
    goblin.fillRect(104, 16, 6, 3);

    // Pointy Goblin Ears Inner Pink
    goblin.fillStyle(0xc026d3, 1);
    goblin.fillTriangle(17, 76, 31, 66, 31, 86);
    goblin.fillTriangle(123, 76, 109, 66, 109, 86);
    goblin.fillStyle(0xf472b6, 0.7);
    goblin.fillTriangle(20, 76, 29, 70, 29, 82);
    goblin.fillTriangle(120, 76, 111, 70, 111, 82);

    // Imp Feet & Claws
    goblin.fillStyle(0xa21caf, 1);
    goblin.fillCircle(48, 144, 13);
    goblin.fillCircle(92, 144, 13);
    goblin.fillStyle(0xfde047, 1);
    goblin.fillCircle(42, 148, 3.5);
    goblin.fillCircle(49, 150, 4);
    goblin.fillCircle(56, 148, 3.5);
    goblin.fillCircle(86, 148, 3.5);
    goblin.fillCircle(93, 150, 4);
    goblin.fillCircle(100, 148, 3.5);

    // Main Torso / Pear Silhouette (Vibrant Magenta)
    goblin.fillStyle(0xd946ef, 1);
    goblin.fillRoundedRect(30, 46, 80, 92, 32);

    // Head Volume Highlight
    goblin.fillStyle(0xe879f9, 1);
    goblin.fillCircle(70, 70, 34);

    // Sassy Plum Belly Patch
    goblin.fillStyle(0xfae8ff, 0.85);
    goblin.fillCircle(70, 110, 24);
    goblin.fillStyle(0x9333ea, 0.6);
    goblin.fillCircle(64, 106, 3);
    goblin.fillCircle(76, 104, 2.5);
    goblin.fillCircle(70, 114, 3.5);

    // Imp Arms / Hands
    goblin.fillStyle(0xa21caf, 1);
    goblin.fillCircle(24, 94, 11);
    goblin.fillCircle(116, 94, 11);
    goblin.fillStyle(0xe879f9, 1);
    goblin.fillCircle(24, 93, 8);
    goblin.fillCircle(116, 93, 8);

    // Mischievous Eyes (Slanted Eyebrows)
    goblin.fillStyle(0x701a75, 0.4);
    goblin.fillCircle(52, 66, 16);
    goblin.fillCircle(88, 66, 16);
    goblin.fillStyle(0xffffff, 1);
    goblin.fillCircle(52, 66, 14);
    goblin.fillCircle(88, 66, 14);
    goblin.lineStyle(3.5, 0x581c87, 1);
    goblin.lineBetween(38, 56, 62, 62);
    goblin.lineBetween(102, 56, 78, 62);
    goblin.fillStyle(0x3b0764, 1);
    goblin.fillCircle(54, 67, 8);
    goblin.fillCircle(86, 67, 8);
    goblin.fillStyle(0xc026d3, 1);
    goblin.fillCircle(55, 68, 4.5);
    goblin.fillCircle(87, 68, 4.5);
    goblin.fillStyle(0xffffff, 1);
    goblin.fillCircle(51, 63, 4);
    goblin.fillCircle(83, 63, 4);

    // Wide Toothy Grin with bottom fangs poking up
    goblin.fillStyle(0x3b0764, 1);
    goblin.fillRoundedRect(52, 82, 36, 14, 6);
    goblin.fillStyle(0xffffff, 1);
    goblin.fillTriangle(58, 96, 64, 96, 61, 88);
    goblin.fillTriangle(76, 96, 82, 96, 79, 88);

    goblin.generateTexture('creature_goblin', ew, eh);

    // Goblin Hurt Expression Texture
    this.createGoblinVariant('creature_goblin_hurt', 'hurt');
    // Goblin KO Ragdoll Texture
    this.createGoblinVariant('creature_goblin_ko', 'ko');

    // =========================================================================
    // 3. AVATARS FOR HEALTH BARS (Size: 44 x 44)
    // =========================================================================
    const avGloop = this.make.graphics({ x: 0, y: 0, add: false });
    avGloop.fillStyle(0x06b6d4, 1);
    avGloop.fillCircle(22, 22, 20);
    avGloop.lineStyle(2.5, 0x38bdf8, 1);
    avGloop.strokeCircle(22, 22, 20);
    // Ears
    avGloop.fillStyle(0xf59e0b, 1);
    avGloop.fillRoundedRect(4, 8, 8, 16, 4);
    avGloop.fillRoundedRect(32, 8, 8, 16, 4);
    // Eyes & Smile
    avGloop.fillStyle(0xffffff, 1);
    avGloop.fillCircle(17, 20, 5);
    avGloop.fillCircle(27, 20, 5);
    avGloop.fillStyle(0x0f172a, 1);
    avGloop.fillCircle(18, 20, 2.5);
    avGloop.fillCircle(28, 20, 2.5);
    avGloop.lineStyle(2, 0x083344, 1);
    avGloop.beginPath();
    avGloop.arc(22, 26, 4, 0.2, Math.PI - 0.2);
    avGloop.strokePath();
    avGloop.generateTexture('avatar_gloop', 44, 44);

    const avGoblin = this.make.graphics({ x: 0, y: 0, add: false });
    avGoblin.fillStyle(0xd946ef, 1);
    avGoblin.fillCircle(22, 22, 20);
    avGoblin.lineStyle(2.5, 0xf472b6, 1);
    avGoblin.strokeCircle(22, 22, 20);
    // Horns
    avGoblin.fillStyle(0xf59e0b, 1);
    avGoblin.fillTriangle(10, 16, 16, 16, 11, 4);
    avGoblin.fillTriangle(28, 16, 34, 16, 33, 4);
    // Eyes & Smile
    avGoblin.fillStyle(0xffffff, 1);
    avGoblin.fillCircle(16, 21, 4.5);
    avGoblin.fillCircle(28, 21, 4.5);
    avGoblin.fillStyle(0x3b0764, 1);
    avGoblin.fillCircle(17, 21, 2.5);
    avGoblin.fillCircle(27, 21, 2.5);
    avGoblin.fillStyle(0xffffff, 1);
    avGoblin.fillTriangle(20, 29, 24, 29, 22, 26);
    avGoblin.generateTexture('avatar_goblin', 44, 44);

    // =========================================================================
    // 4. ORGANIC FLOATING ISLAND PERCH (Size: 280 x 160)
    // Craggy moss-capped prehistoric rock with sedimentary strata & hanging roots
    // =========================================================================
    const island = this.make.graphics({ x: 0, y: 0, add: false });
    const iw = 280, ih = 160;

    // Rock Silhouette Foundation (Deep Craggy Basalt)
    island.fillStyle(0x0f172a, 1);
    island.beginPath();
    island.moveTo(14, 28);
    island.lineTo(266, 28);
    island.lineTo(248, 70);
    island.lineTo(210, 110);
    island.lineTo(160, 134);
    island.lineTo(120, 134);
    island.lineTo(70, 110);
    island.lineTo(32, 70);
    island.closePath();
    island.fillPath();

    // Sedimentary Craggy Body (Slate Stone Layers)
    island.fillStyle(0x1e293b, 1);
    island.beginPath();
    island.moveTo(20, 32);
    island.lineTo(260, 32);
    island.lineTo(242, 68);
    island.lineTo(206, 106);
    island.lineTo(158, 128);
    island.lineTo(122, 128);
    island.lineTo(74, 106);
    island.lineTo(38, 68);
    island.closePath();
    island.fillPath();

    // Stone Strata / Facet Highlights & Cracks
    island.fillStyle(0x334155, 0.85);
    island.fillTriangle(50, 40, 110, 40, 70, 85);
    island.fillTriangle(140, 42, 210, 42, 180, 92);
    island.fillTriangle(190, 60, 246, 50, 215, 100);

    island.lineStyle(2, 0x0f172a, 0.7);
    island.lineBetween(80, 50, 105, 95);
    island.lineBetween(170, 45, 155, 110);
    island.lineBetween(195, 65, 185, 102);

    // Hanging Gnarled Roots (Rich Earth Brown)
    island.lineStyle(3.5, 0x451a03, 1);
    island.beginPath();
    island.moveTo(56, 75);
    island.lineTo(50, 110);
    island.lineTo(58, 142);
    island.strokePath();

    island.beginPath();
    island.moveTo(136, 128);
    island.lineTo(142, 146);
    island.lineTo(138, 158);
    island.strokePath();

    island.beginPath();
    island.moveTo(218, 90);
    island.lineTo(228, 124);
    island.lineTo(222, 148);
    island.strokePath();

    // Root leaves
    island.fillStyle(0x059669, 1);
    island.fillCircle(58, 142, 4);
    island.fillCircle(138, 158, 4.5);
    island.fillCircle(222, 148, 4);

    // Dense Deep Grass Bed (Dark Jungle Green Foundation)
    island.fillStyle(0x064e3b, 1);
    island.fillRoundedRect(12, 10, 256, 32, 12);

    // Lush Emerald Moss Turf
    island.fillStyle(0x10b981, 1);
    island.fillRoundedRect(10, 4, 260, 24, 10);

    // Bright Chartreuse Sunlit Moss Highlights
    island.fillStyle(0x34d399, 1);
    island.fillRoundedRect(16, 4, 248, 10, 5);

    // Scalloped Hanging Moss Fringe on stone
    island.fillStyle(0x059669, 1);
    for (let x = 24; x <= 256; x += 22) {
      const drop = (x % 44 === 0) ? 14 : 9;
      island.fillCircle(x, 26 + drop / 2, drop / 2);
    }

    // Little Tufts of Grass Blades poking upward
    island.lineStyle(2, 0x6ee7b7, 1);
    for (let gx = 30; gx < 250; gx += 28) {
      island.lineBetween(gx, 4, gx - 3, -4);
      island.lineBetween(gx + 4, 4, gx + 6, -5);
    }

    // Tiny Jungle Flower Blossoms on moss
    island.fillStyle(0xfb7185, 1);
    island.fillCircle(65, 12, 3);
    island.fillCircle(195, 10, 3);
    island.fillStyle(0xfbbf24, 1);
    island.fillCircle(65, 12, 1.5);
    island.fillCircle(195, 10, 1.5);

    island.generateTexture('island_perch', iw, ih);

    // =========================================================================
    // 5. CHARACTER GROUNDING DROP-SHADOW (Size: 120 x 36)
    // =========================================================================
    const shadow = this.make.graphics({ x: 0, y: 0, add: false });
    shadow.fillStyle(0x022c22, 0.45);
    shadow.fillEllipse(60, 18, 54, 14);
    shadow.fillStyle(0x022c22, 0.65);
    shadow.fillEllipse(60, 18, 36, 9);
    shadow.generateTexture('character_shadow', 120, 36);

    // =========================================================================
    // 6. WEAPON 1: BOULDER NUT (Size: 52 x 52)
    // =========================================================================
    const bNut = this.make.graphics({ x: 0, y: 0, add: false });
    bNut.fillStyle(0x451a03, 1);
    bNut.fillCircle(26, 26, 24);
    bNut.fillStyle(0xa16207, 1);
    bNut.fillCircle(26, 26, 21);
    bNut.fillStyle(0xca8a04, 1);
    bNut.fillCircle(23, 21, 14);
    bNut.lineStyle(2.5, 0x713f12, 0.9);
    bNut.beginPath();
    bNut.arc(26, 26, 16, -0.7, 1.1);
    bNut.strokePath();
    bNut.beginPath();
    bNut.arc(26, 26, 10, -0.4, 0.8);
    bNut.strokePath();
    bNut.generateTexture('projectile_boulder', 52, 52);

    // =========================================================================
    // 7. WEAPON 2: SPIKY PUFFER (Size: 52 x 52)
    // =========================================================================
    const puffer = this.make.graphics({ x: 0, y: 0, add: false });
    puffer.fillStyle(0x7c2d12, 1);
    puffer.fillCircle(26, 26, 22);
    puffer.fillStyle(0xfbbf24, 1);
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      const sx = 26 + Math.cos(a) * 19;
      const sy = 26 + Math.sin(a) * 19;
      puffer.fillCircle(sx, sy, 5);
    }
    puffer.fillStyle(0xf97316, 1);
    puffer.fillCircle(26, 26, 17);
    puffer.fillStyle(0xfdba74, 1);
    puffer.fillCircle(22, 22, 8);
    puffer.generateTexture('projectile_puffer', 52, 52);

    // =========================================================================
    // 8. WEAPON 3: STICKY SLIME (Size: 52 x 52)
    // =========================================================================
    const slime = this.make.graphics({ x: 0, y: 0, add: false });
    slime.fillStyle(0x14532d, 1);
    slime.fillCircle(26, 26, 22);
    slime.fillStyle(0x84cc16, 1);
    slime.fillCircle(26, 26, 19);
    slime.fillStyle(0xbbf7d0, 0.9);
    slime.fillCircle(20, 20, 9);
    slime.fillStyle(0xffffff, 1);
    slime.fillCircle(18, 18, 4);
    slime.generateTexture('projectile_slime', 52, 52);

    // =========================================================================
    // 9. WEAPON 4: BOOMERANG BONE (Size: 52 x 52)
    // =========================================================================
    const bone = this.make.graphics({ x: 0, y: 0, add: false });
    bone.fillStyle(0x334155, 1);
    bone.lineStyle(8, 0x334155, 1);
    bone.beginPath();
    bone.arc(26, 32, 20, Math.PI * 1.15, Math.PI * 1.85);
    bone.strokePath();
    bone.lineStyle(5, 0xf8fafc, 1);
    bone.beginPath();
    bone.arc(26, 32, 20, Math.PI * 1.15, Math.PI * 1.85);
    bone.strokePath();
    bone.fillStyle(0xf8fafc, 1);
    bone.fillCircle(11, 24, 6.5);
    bone.fillCircle(41, 24, 6.5);
    bone.fillStyle(0xe2e8f0, 1);
    bone.fillCircle(13, 24, 4);
    bone.fillCircle(39, 24, 4);
    bone.generateTexture('projectile_bone', 52, 52);

    // =========================================================================
    // 10. TRAJECTORY DOT (Size: 12 x 12)
    // =========================================================================
    const dot = this.make.graphics({ x: 0, y: 0, add: false });
    dot.fillStyle(0xb45309, 0.5);
    dot.fillCircle(6, 6, 6);
    dot.fillStyle(0xfacc15, 1);
    dot.fillCircle(6, 6, 4.5);
    dot.fillStyle(0xffffff, 1);
    dot.fillCircle(5, 5, 2);
    dot.generateTexture('trajectory_dot', 12, 12);

    // =========================================================================
    // 11. UNLOCKABLE WEAPON: BONE RECURVE BOW (Size: 36 x 80)
    // =========================================================================
    const bow = this.make.graphics({ x: 0, y: 0, add: false });
    // Outer shadow / dark outline
    bow.lineStyle(6, 0x1e293b, 1);
    bow.beginPath();
    bow.arc(10, 40, 36, -Math.PI * 0.42, Math.PI * 0.42);
    bow.strokePath();

    // Carved Ivory Bone Limbs
    bow.lineStyle(4, 0xf8fafc, 1);
    bow.beginPath();
    bow.arc(10, 40, 36, -Math.PI * 0.42, Math.PI * 0.42);
    bow.strokePath();

    // Limb Horn Tips
    bow.fillStyle(0xf59e0b, 1);
    bow.fillCircle(20, 6, 4);
    bow.fillCircle(20, 74, 4);

    // Leather Wrapped Grip
    bow.fillStyle(0x78350f, 1);
    bow.fillRoundedRect(30, 34, 6, 12, 3);
    bow.fillStyle(0xd97706, 1);
    bow.fillRect(31, 37, 4, 2);
    bow.fillRect(31, 41, 4, 2);

    // Taut Bowstring (Unstretched baseline)
    bow.lineStyle(1.5, 0xe2e8f0, 0.85);
    bow.lineBetween(20, 6, 20, 74);
    bow.generateTexture('weapon_bow', 36, 80);

    // =========================================================================
    // 12. BALLISTIC FLINT ARROW (Size: 72 x 18)
    // =========================================================================
    const arrow = this.make.graphics({ x: 0, y: 0, add: false });
    // Wooden Shaft
    arrow.lineStyle(3.5, 0x78350f, 1);
    arrow.lineBetween(12, 9, 56, 9);
    arrow.lineStyle(2, 0xd97706, 1);
    arrow.lineBetween(12, 9, 56, 9);

    // Sharp Chiseled Flint Arrowhead
    arrow.fillStyle(0x0f172a, 1);
    arrow.fillTriangle(54, 2, 70, 9, 54, 16);
    arrow.fillStyle(0x475569, 1);
    arrow.fillTriangle(56, 4, 68, 9, 56, 14);
    // Sharp razor highlight
    arrow.lineStyle(1.5, 0x94a3b8, 1);
    arrow.lineBetween(56, 4, 68, 9);

    // Fletching Feathers (Twin Cyan & Gold Vanes)
    arrow.fillStyle(0x06b6d4, 1);
    arrow.fillTriangle(4, 4, 16, 9, 8, 9);
    arrow.fillTriangle(4, 14, 16, 9, 8, 9);
    arrow.fillStyle(0xfbbf24, 1);
    arrow.fillTriangle(6, 6, 14, 9, 9, 9);
    arrow.fillTriangle(6, 12, 14, 9, 9, 9);
    arrow.generateTexture('projectile_arrow', 72, 18);

    // =========================================================================
    // 13. WEAPON CLASS SELECTOR ICONS (Size: 48 x 48)
    // =========================================================================
    const icSling = this.make.graphics({ x: 0, y: 0, add: false });
    icSling.fillStyle(0x1e293b, 1);
    icSling.fillRoundedRect(2, 2, 44, 44, 10);
    icSling.lineStyle(2, 0xca8a04, 1);
    icSling.strokeRoundedRect(2, 2, 44, 44, 10);
    // Y-fork frame
    icSling.lineStyle(4, 0xb45309, 1);
    icSling.lineBetween(24, 38, 24, 24);
    icSling.lineBetween(24, 24, 14, 12);
    icSling.lineBetween(24, 24, 34, 12);
    // Rubber band
    icSling.lineStyle(2, 0xfacc15, 1);
    icSling.lineBetween(14, 12, 24, 18);
    icSling.lineBetween(34, 12, 24, 18);
    icSling.fillStyle(0xf59e0b, 1);
    icSling.fillCircle(24, 18, 4);
    icSling.generateTexture('icon_weapon_slingshot', 48, 48);

    const icBow = this.make.graphics({ x: 0, y: 0, add: false });
    icBow.fillStyle(0x1e293b, 1);
    icBow.fillRoundedRect(2, 2, 44, 44, 10);
    icBow.lineStyle(2, 0x38bdf8, 1);
    icBow.strokeRoundedRect(2, 2, 44, 44, 10);
    // Curved Bow
    icBow.lineStyle(3, 0xf8fafc, 1);
    icBow.beginPath();
    icBow.arc(16, 24, 18, -Math.PI * 0.45, Math.PI * 0.45);
    icBow.strokePath();
    // String & Arrow
    icBow.lineStyle(1.5, 0x94a3b8, 1);
    icBow.lineBetween(22, 9, 22, 39);
    icBow.lineStyle(2.5, 0xd97706, 1);
    icBow.lineBetween(12, 24, 36, 24);
    icBow.fillStyle(0x0f172a, 1);
    icBow.fillTriangle(34, 20, 42, 24, 34, 28);
    icBow.generateTexture('icon_weapon_bow', 48, 48);
  }

  createGloopVariant(key, expr = 'normal') {
    const gw = 140, gh = 160;
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Outline / ears / feet
    g.fillStyle(0x042f2e, 1);
    g.fillRoundedRect(26, 42, 88, 102, 38);
    g.fillCircle(46, 148, 16);
    g.fillCircle(94, 148, 16);
    g.fillRoundedRect(10, 16, 28, 48, 14);
    g.fillRoundedRect(102, 16, 28, 48, 14);

    g.fillStyle(0xf59e0b, 1);
    g.fillRoundedRect(13, 19, 22, 42, 11);
    g.fillRoundedRect(105, 19, 22, 42, 11);

    // Torso
    g.fillStyle(0x06b6d4, 1);
    g.fillRoundedRect(28, 44, 84, 98, 36);
    g.fillStyle(0x22d3ee, 1);
    g.fillCircle(70, 72, 36);

    // Belly patch
    g.fillStyle(0xa5f3fc, 0.9);
    g.fillCircle(70, 112, 26);

    // Blush
    g.fillStyle(0xf472b6, 0.4);
    g.fillCircle(42, 86, 9);
    g.fillCircle(98, 86, 9);

    if (expr === 'hurt') {
      // Wincing tight eyes (> <)
      g.lineStyle(4, 0x0f172a, 1);
      // Left eye >
      g.beginPath();
      g.moveTo(44, 63); g.lineTo(55, 68); g.lineTo(44, 73);
      g.strokePath();
      // Right eye <
      g.beginPath();
      g.moveTo(96, 63); g.lineTo(85, 68); g.lineTo(96, 73);
      g.strokePath();
      // Gritted teeth
      g.fillStyle(0xffffff, 1);
      g.fillRoundedRect(56, 82, 28, 10, 4);
      g.lineStyle(2, 0x0f172a, 1);
      g.strokeRoundedRect(56, 82, 28, 10, 4);
      g.lineBetween(65, 82, 65, 92);
      g.lineBetween(75, 82, 75, 92);
    } else if (expr === 'ko') {
      // Spiral/X KO eyes (+ +)
      g.lineStyle(4.5, 0x0f172a, 1);
      // Left X
      g.lineBetween(46, 61, 60, 75);
      g.lineBetween(60, 61, 46, 75);
      // Right X
      g.lineBetween(80, 61, 94, 75);
      g.lineBetween(94, 61, 80, 75);
      // Limp open tongue mouth
      g.fillStyle(0x0f172a, 1);
      g.fillCircle(70, 85, 8);
      g.fillStyle(0xf43f5e, 1);
      g.fillCircle(72, 92, 5);
    }

    // Top Antenna
    g.fillStyle(0xfbbf24, 1);
    g.fillCircle(70, 36, 6);
    g.generateTexture(key, gw, gh);
  }

  createGoblinVariant(key, expr = 'normal') {
    const ew = 140, eh = 160;
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Foundation
    g.fillStyle(0x4a044e, 1);
    g.fillRoundedRect(28, 44, 84, 96, 34);
    g.fillTriangle(26, 48, 44, 48, 28, 4);
    g.fillTriangle(96, 48, 114, 48, 112, 4);

    // Horns
    g.fillStyle(0xf59e0b, 1);
    g.fillTriangle(28, 46, 42, 46, 30, 8);
    g.fillTriangle(98, 46, 112, 46, 110, 8);

    // Torso
    g.fillStyle(0xd946ef, 1);
    g.fillRoundedRect(30, 46, 80, 92, 32);
    g.fillStyle(0xe879f9, 1);
    g.fillCircle(70, 70, 34);

    // Belly
    g.fillStyle(0xfae8ff, 0.85);
    g.fillCircle(70, 110, 24);

    if (expr === 'hurt') {
      // Popped shocked eyes
      g.fillStyle(0xffffff, 1);
      g.fillCircle(52, 66, 15);
      g.fillCircle(88, 66, 15);
      g.fillStyle(0x3b0764, 1);
      g.fillCircle(52, 66, 5);
      g.fillCircle(88, 66, 5);
      // Wide open O mouth
      g.fillStyle(0x3b0764, 1);
      g.fillCircle(70, 86, 9);
      g.fillStyle(0xffffff, 1);
      g.fillTriangle(68, 80, 72, 80, 70, 84);
    } else if (expr === 'ko') {
      // Spiral/X KO eyes
      g.lineStyle(4.5, 0x3b0764, 1);
      g.lineBetween(45, 59, 59, 73);
      g.lineBetween(59, 59, 45, 73);
      g.lineBetween(81, 59, 95, 73);
      g.lineBetween(95, 59, 81, 73);
      // Drooping mouth with floppy tongue
      g.lineStyle(3, 0x3b0764, 1);
      g.beginPath();
      g.arc(70, 84, 8, 0.2, Math.PI - 0.2);
      g.strokePath();
      g.fillStyle(0xf43f5e, 1);
      g.fillCircle(72, 91, 5);
    }

    g.generateTexture(key, ew, eh);
  }
}
