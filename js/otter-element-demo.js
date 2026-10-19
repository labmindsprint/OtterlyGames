(() => {
  const root = document.getElementById('otter-demo');
  if (!root) return;
  const frame = root.querySelector('#otter-demo-frame');
  const intro = root.querySelector('#otter-demo-start-layer');
  const start = root.querySelector('#otter-demo-start');
  const end = root.querySelector('#otter-demo-end');
  const again = root.querySelector('#otter-demo-again');
  const err = root.querySelector('#otter-demo-error');
  const badge = root.querySelector('.oe-badge');
  const bar = root.querySelector('#otter-demo-bar');
  const count = root.querySelector('#otter-demo-count');
  const fill = root.querySelector('#otter-demo-fill');
  const finish = root.querySelector('#otter-demo-finish');
  const TOTAL = 90;
  const GAME = '/games/otterelement/?nosplash';
  const HIDE_CSS = '.mobile-nav,.header-settings,.app-footer,.wallet button,.sidebar,.toast{display:none!important}.app-body{padding-bottom:0!important}';

  let left = TOTAL;
  let running = false;
  let visible = false;
  let timer = 0;
  let tidy = 0;
  let mutedByUs = false;

  const doc = () => { try { return frame.contentDocument; } catch { return null; } };
  const muteBtn = d => d && d.querySelector('.header-mute');

  function render() {
    count.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
    fill.style.width = `${((TOTAL - left) / TOTAL) * 100}%`;
  }

  function setAudio(on) {
    const b = muteBtn(doc());
    if (!b) return;
    const muted = b.getAttribute('aria-pressed') === 'true';
    if (!on && !muted) { b.click(); mutedByUs = true; }
    if (on && muted && mutedByUs) { b.click(); mutedByUs = false; }
  }

  function sync() {
    const active = running && visible && !document.hidden;
    if (active && !timer) {
      timer = setInterval(() => {
        left -= 1;
        render();
        if (left <= 0) stop();
      }, 1000);
    } else if (!active && timer) {
      clearInterval(timer);
      timer = 0;
    }
    if (running) setAudio(active);
  }

  function tidyFrame() {
    const d = doc();
    if (!d || !d.body) return false;
    if (!d.getElementById('oe-site-style')) {
      const s = d.createElement('style');
      s.id = 'oe-site-style';
      s.textContent = HIDE_CSS;
      d.head.appendChild(s);
    }
    const skip = [...d.querySelectorAll('button')].find(b => /^(skip|start)$/i.test(b.textContent.trim()));
    if (skip) skip.click();
    return d.querySelector('.battle-page') && !skip;
  }

  function stop() {
    running = false;
    clearInterval(timer);
    timer = 0;
    clearInterval(tidy);
    setAudio(false);
    frame.removeAttribute('src');
    frame.hidden = true;
    bar.hidden = true;
    badge.hidden = true;
    end.hidden = false;
    again.focus();
  }

  function begin() {
    err.hidden = true;
    intro.hidden = true;
    end.hidden = true;
    left = TOTAL;
    render();
    const open = () => {
      frame.hidden = false;
      badge.hidden = false;
      bar.hidden = false;
      running = true;
      mutedByUs = false;
      frame.src = GAME;
      let tries = 0;
      clearInterval(tidy);
      tidy = setInterval(() => {
        tries += 1;
        if (tidyFrame() && tries > 4 || tries > 60) {
          clearInterval(tidy);
          setTimeout(() => doc()?.querySelectorAll('*').forEach(el => { if (el.scrollTop) el.scrollTop = 0; }), 1500);
        }
      }, 250);
      sync();
    };
    // Each preview starts from a fresh first-run save so it behaves the same for everyone.
    let done = false;
    const go = () => { if (!done) { done = true; open(); } };
    try {
      const req = indexedDB.deleteDatabase('otter-element');
      req.onsuccess = req.onerror = req.onblocked = go;
      setTimeout(go, 1500);
    } catch {
      go();
    }
  }

  start.addEventListener('click', begin);
  again.addEventListener('click', begin);
  finish.addEventListener('click', stop);
  frame.addEventListener('error', () => { err.hidden = false; });

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }, { threshold: 0.25 }).observe(root);
  const screen = root.querySelector('.oe-screen');
  const fit = () => frame.style.setProperty('--oe-scale', String(screen.clientWidth / 390));
  new ResizeObserver(fit).observe(screen);
  fit();
  document.addEventListener('visibilitychange', sync);
  render();
})();
