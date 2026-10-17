(() => {
  'use strict';
  const launch = document.getElementById('launch-game');
  const frame = document.getElementById('universe-frame');
  const placeholder = document.getElementById('game-placeholder');
  const fullscreen = document.getElementById('fullscreen-game');
  const status = document.getElementById('game-status');
  let visible = false;
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
  }).observe(frame);
  document.addEventListener('visibilitychange', updateVisibility);
  window.addEventListener('message', event => {
    if (event.origin === location.origin && event.source === frame.contentWindow && event.data?.type === 'mathReady') updateVisibility();
  });
  launch.addEventListener('click', () => {
    if (!frame.getAttribute('src')) {
      status.textContent = 'Loading Math Tank. The game will check that this browser can save progress.';
      frame.addEventListener('load', () => { status.textContent = ''; }, { once: true });
      frame.src = '/games/mathtank/';
      frame.hidden = false;
      placeholder.hidden = true;
      fullscreen.disabled = !frame.requestFullscreen;
      launch.textContent = 'Return to game';
    }
    frame.scrollIntoView({ block: 'start', behavior: 'instant' });
    frame.focus();
  });
  fullscreen.addEventListener('click', async () => {
    try {
      await frame.requestFullscreen();
    } catch (error) {
      console.warn('[Math Tank] Full screen unavailable', error);
      status.textContent = 'Full screen is unavailable. You can keep playing in this window.';
    }
  });
})();
