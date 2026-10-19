// Otterly Games launch splash (Android app only). Classic script: it runs before the Pit Stop module loads.
(function () {
  var splash = document.getElementById('brand-splash');
  if (!splash) return;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var T = reduced ? { gameAt: 700, outAt: 1400, doneAt: 1500 } : { gameAt: 1800, outAt: 3200, doneAt: 3800 };
  var started = Date.now();
  var leaving = false;
  var timers = [];

  function finish() {
    for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]);
    if (splash.parentNode) splash.parentNode.removeChild(splash);
    document.documentElement.classList.remove('brand-splash-active');
  }

  function leave() {
    if (leaving) return;
    leaving = true;
    splash.classList.add('is-game', 'is-out');
    splash.setAttribute('aria-hidden', 'true');
    timers.push(setTimeout(finish, reduced ? 0 : T.doneAt - T.outAt));
  }

  // Never leave early: the splash covers a still-booting game. A broken boot is reported by the host, not hidden here.
  function whenReady() {
    if (globalThis.__otterlyAcademyNativeReady === true || Date.now() - started > 15000) leave();
    else timers.push(setTimeout(whenReady, 80));
  }

  document.documentElement.classList.add('brand-splash-active');
  timers.push(setTimeout(function () { splash.classList.add('is-game'); }, T.gameAt));
  timers.push(setTimeout(whenReady, T.outAt));
  splash.addEventListener('pointerdown', function () {
    if (Date.now() - started < 1000) return;
    splash.classList.add('is-game');
    whenReady();
  });
})();
