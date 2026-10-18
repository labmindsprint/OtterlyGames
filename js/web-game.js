(() => {
  'use strict';
  const launch = document.getElementById('launch-game');
  const frame = document.getElementById('universe-frame');
  const placeholder = document.getElementById('game-placeholder');
  const fullscreen = document.getElementById('fullscreen-game');
  const status = document.getElementById('game-status');
  const launchButtons = [...document.querySelectorAll('#launch-game, [data-launch-game]')];
  const dock = document.querySelector('[data-game-dock]');
  const gameName = frame.dataset.gameName || 'Math Tank';
  const gameSource = frame.dataset.gameSource || '/games/mathtank/';
  const readyMessage = frame.dataset.readyMessage || 'mathReady';
  let visible = false;
  const visibleLaunchButtons = new Set([launch]);
  function updateDock() {
    if (dock) dock.hidden = visibleLaunchButtons.size > 0 || visible;
  }
  const launchObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting && entry.intersectionRatio >= .8) visibleLaunchButtons.add(entry.target);
      else visibleLaunchButtons.delete(entry.target);
    }
    updateDock();
  }, { threshold: [0, .8], rootMargin: '-64px 0px 0px' });
  for (const button of launchButtons) {
    if (!button.closest('[data-game-dock]')) launchObserver.observe(button);
  }
  function revealGame() {
    if (document.fullscreenElement) return;
    const bounds = frame.getBoundingClientRect();
    const top = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    if (bounds.height <= innerHeight - top && (bounds.top < top - 1 || bounds.bottom > innerHeight)) {
      frame.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  }
  frame.addEventListener('load', () => {
    // Browser focus scrolling can expose one control while clipping an iframe dialog.
    frame.contentDocument.addEventListener('click', revealGame);
    frame.contentDocument.addEventListener('keyup', revealGame);
  });
  function updateVisibility() {
    if (frame.getAttribute('src')) frame.contentWindow.postMessage({
      type: visible && !document.hidden ? 'resumeAudio' : 'pauseAudio'
    }, location.origin);
  }
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    updateVisibility();
    updateDock();
  }).observe(frame);
  document.addEventListener('visibilitychange', updateVisibility);
  window.addEventListener('message', event => {
    if (event.origin === location.origin && event.source === frame.contentWindow && event.data?.type === readyMessage) updateVisibility();
  });
  function launchGame() {
    if (!frame.getAttribute('src')) {
      status.textContent = `Loading ${gameName}. The game will check that this browser can save progress.`;
      frame.addEventListener('load', () => { status.textContent = ''; }, { once: true });
      frame.src = gameSource;
      frame.hidden = false;
      placeholder.hidden = true;
      fullscreen.disabled = !frame.requestFullscreen;
      for (const button of launchButtons) button.textContent = 'Return to game';
    }
    frame.scrollIntoView({ block: 'start', behavior: 'instant' });
    frame.focus();
  }
  for (const button of launchButtons) button.addEventListener('click', launchGame);
  fullscreen.addEventListener('click', async () => {
    try {
      await frame.requestFullscreen();
    } catch (error) {
      console.warn(`[${gameName}] Full screen unavailable`, error);
      status.textContent = 'Full screen is unavailable. You can keep playing in this window.';
    }
  });
})();
