// Ringo's non-blocking spotlight: a ring around a real control plus a speech card. The dim never eats taps,
// so the player simply presses the highlighted control. Ported from the Otter Element Helium guide.
import { noBreakHyphens, ringo } from './ui.mjs';
import { markTipSeen, skipTips, tipView } from './tour.mjs';
import { sources } from './fuel-bridge.mjs';

const PAD = 6;
const GAP = 14;
const EDGE = 8;

const visible = rect => rect.width > 0 && rect.height > 0;

// Shows the current tip on the map, if any. Returns a cleanup. The tip retires when its control is tapped.
export function startTour(app) {
  const tip = tipView(app.state(), sources().native);
  if (!tip) return () => {};
  let stop = () => {};
  const save = async next => {
    try { await app.commit(next(app.state())); } catch (error) { app.fail(error); }
  };
  stop = showSpotlight({
    ...tip,
    reduced: app.reduced(),
    onHit: () => save(state => markTipSeen(state, tip.id)),
    onSkip: () => { stop(); save(skipTips); },
  });
  return () => stop();
}

export function showSpotlight({ target, mood = 'happy', line, onSkip, onHit, reduced = false }) {
  const layer = document.createElement('div');
  layer.className = `sg${reduced ? ' is-reduced' : ''}`;
  layer.innerHTML = `<div class="sg-ring" hidden></div>
    <div class="sg-card" role="status" aria-live="polite" hidden>
      <span class="sg-ringo">${ringo(44, mood)}</span>
      <p class="sg-line"></p>
      <button type="button" class="sg-skip" aria-label="Skip tips">✕</button>
      <i class="sg-arrow" aria-hidden="true"></i>
    </div>`;
  layer.querySelector('.sg-line').innerHTML = noBreakHyphens(line);
  document.body.append(layer);
  const ring = layer.querySelector('.sg-ring');
  const card = layer.querySelector('.sg-card');
  const arrow = layer.querySelector('.sg-arrow');
  let scrolled = false;

  const find = () => [...document.querySelectorAll(`[data-ob="${target}"]`)].find(node => visible(node.getBoundingClientRect()));

  const place = () => {
    const node = find();
    if (!node) { ring.hidden = true; card.hidden = true; return; }
    let rect = node.getBoundingClientRect();
    const view = window.visualViewport;
    const vw = view?.width ?? window.innerWidth;
    const vh = view?.height ?? window.innerHeight;
    if (!scrolled) {
      scrolled = true;
      if (rect.top < 0 || rect.bottom > vh) {
        node.scrollIntoView({ block: 'center', behavior: 'auto' });
        rect = node.getBoundingClientRect();
      }
    }
    Object.assign(ring.style, {
      left: `${rect.left - PAD}px`, top: `${rect.top - PAD}px`,
      width: `${rect.width + PAD * 2}px`, height: `${rect.height + PAD * 2}px`,
    });
    ring.hidden = false;
    card.hidden = false;
    const width = Math.min(264, vw - EDGE * 2);
    card.style.width = `${width}px`;
    const height = card.offsetHeight;
    const below = rect.bottom + PAD + GAP + height <= vh - EDGE;
    const top = below ? rect.bottom + PAD + GAP : Math.max(EDGE, rect.top - PAD - GAP - height);
    const center = rect.left + rect.width / 2;
    const left = Math.min(Math.max(EDGE, center - width / 2), vw - width - EDGE);
    Object.assign(card.style, { left: `${left}px`, top: `${top}px` });
    card.classList.toggle('is-below', below);
    arrow.style.left = `${Math.min(Math.max(22, center - left), width - 22)}px`;
  };

  const onClick = event => {
    if (event.target.closest('.sg-skip')) { onSkip?.(); return; }
    if (event.target.closest(`[data-ob="${target}"]`)) onHit?.();
  };
  document.addEventListener('click', onClick, true);
  const timer = window.setInterval(place, 400);
  const watched = [window, window.visualViewport].filter(Boolean);
  for (const item of watched) { item.addEventListener('resize', place); item.addEventListener('scroll', place); }
  place();

  return () => {
    window.clearInterval(timer);
    document.removeEventListener('click', onClick, true);
    for (const item of watched) { item.removeEventListener('resize', place); item.removeEventListener('scroll', place); }
    layer.remove();
  };
}
