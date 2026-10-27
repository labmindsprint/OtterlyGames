(() => {
  const root = document.getElementById('otter-demo');
  if (!root) return;
  const stage = root.querySelector('#otter-demo-stage');
  const frame = root.querySelector('#otter-demo-frame');
  const intro = root.querySelector('#otter-demo-start-layer');
  const start = root.querySelector('#otter-demo-start');
  const err = root.querySelector('#otter-demo-error');
  const tools = root.querySelector('#otter-demo-tools');
  const full = root.querySelector('#otter-demo-full');
  const GAME = '/games/otterelement/?nosplash';

  let visible = false;

  // The preview keeps its own progress in this browser, so it is never reset from here. The page only tells the game
  // when it is out of view or the tab is hidden; the game pauses its fight and audio the way it does in the Android app.
  function sync() {
    if (frame.hidden || !frame.contentWindow) return;
    frame.contentWindow.postMessage({ type: 'oe-preview-active', active: visible && !document.hidden }, window.location.origin);
  }

  function begin() {
    err.hidden = true;
    intro.hidden = true;
    frame.hidden = false;
    tools.hidden = false;
    frame.addEventListener('load', () => { sync(); frame.focus(); }, { once: true });
    frame.src = GAME;
  }

  function toggleFull() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (stage.requestFullscreen) {
      stage.requestFullscreen().catch(() => { window.open(GAME, '_blank', 'noopener'); });
    } else {
      window.open(GAME, '_blank', 'noopener');
    }
  }

  start.addEventListener('click', begin);
  full.addEventListener('click', toggleFull);
  frame.addEventListener('error', () => { err.hidden = false; });
  document.addEventListener('fullscreenchange', () => {
    const on = document.fullscreenElement === stage;
    full.textContent = on ? 'Exit full screen' : 'Full screen';
    full.setAttribute('aria-pressed', String(on));
  });

  new IntersectionObserver((entries) => { visible = entries[entries.length - 1].intersectionRatio >= 0.2; sync(); }, { threshold: [0, 0.2] }).observe(stage);
  document.addEventListener('visibilitychange', sync);
})();
