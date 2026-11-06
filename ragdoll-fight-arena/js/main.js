/**
 * Application Bootstrap: initializes and starts Ragdoll Fight Arena.
 */
document.addEventListener('DOMContentLoaded', () => {
  // Ensure Matter.js is loaded
  if (typeof Matter === 'undefined') {
    console.error('Matter.js failed to load. Please check network connection or file path.');
    return;
  }

  // Initialize and run game
  window.ragdollGame = new Game();
  window.ragdollGame.start();

  console.log('🥊 Ragdoll Fight Arena - Phase 1 Initialized');
});
