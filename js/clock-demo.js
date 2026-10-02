(() => {
  const host = document.getElementById('clock-demo');
  const frame = document.getElementById('clock-demo-frame');
  const start = document.getElementById('clock-demo-start');
  let visible = false;
  let started = false;
  function update() {
    if (started) frame.contentWindow.postMessage({
      type: visible && !document.hidden ? 'resumeAudio' : 'pauseAudio'
    }, location.origin);
  }
  start.addEventListener('click', () => {
    started = true;
    start.hidden = true;
    frame.hidden = false;
    frame.src = '/games/clockmaster/?mode=race';
    frame.focus();
  });
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    update();
  }).observe(host);
  document.addEventListener('visibilitychange', update);
  window.addEventListener('message', event => {
    if (event.origin === location.origin && event.source === frame.contentWindow &&
        event.data?.type === 'clockReady') update();
  });
})();
