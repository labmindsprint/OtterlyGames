(() => {
  const frame = document.getElementById('math-demo-frame') || document.getElementById('math-frame');
  const start = document.getElementById('math-demo-start');
  const host = document.getElementById('math-demo') || document.getElementById('play');
  let visible = false;
  function update() {
    if (!frame.getAttribute('src')) return;
    frame.contentWindow.postMessage({
      type: visible && !frame.hidden && frame.style.display !== 'none' && !document.hidden ? 'resumeAudio' : 'pauseAudio'
    }, location.origin);
  }
  start?.addEventListener('click', () => {
    start.hidden = true;
    frame.hidden = false;
    frame.src = '/games/mathtank/?mode=battle';
    frame.focus();
  });
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    update();
  }).observe(host);
  new MutationObserver(update).observe(frame, { attributes: true, attributeFilter: ['style', 'hidden', 'src'] });
  document.addEventListener('visibilitychange', update);
  window.addEventListener('message', event => {
    if (event.origin === location.origin && event.source === frame.contentWindow && event.data?.type === 'mathReady') update();
  });
})();
