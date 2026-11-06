/**
 * Application Bootstrap: initializes and starts Ragdoll Sky Assault.
 */
document.addEventListener('DOMContentLoaded', () => {
  if (typeof Matter === 'undefined') {
    console.error('Matter.js failed to load. Check file path or network.');
    return;
  }

  // Initialize and run game
  window.skyAssaultGame = new Game();
  window.skyAssaultGame.start();

  console.log('🚀 Ragdoll Sky Assault - Phase 1 Initialized');
});
