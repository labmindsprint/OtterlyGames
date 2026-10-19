// Print test: 10 questions across the class's chapters. 7 or more right prints every schematic in the cargo hold.
import { PAINTS } from './data.mjs';
import { play } from './audio.mjs';
import { gearIcon } from './gear.mjs';
import { printTestMission } from './missions.mjs';
import { cargoOf, classState, printPassed, shipComplete, starsFor } from './progress.mjs';
import { PRINT_PASS, PRINT_QUESTIONS, printGate, schematicName } from './schematics.mjs';
import { stickerSVG } from './stickers.mjs';
import { applyAdFuel, applySpend, fuelStatus } from './fuel.mjs';
import { watchAd } from './fuel-bridge.mjs';
import { emptyTank, fuelBadge, fuelNote, revealAdButton } from './view-fuel.mjs';
import { ICONS, esc, ringo, stars } from './ui.mjs';
import { chip, listen, mount } from './views.mjs';

export const PRINT_ICON = '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="5" y="12" width="22" height="11" rx="3" fill="none" stroke="currentColor" stroke-width="3"/><path d="M10 12V5h12v7M10 19h12v8H10Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>';
export const PRINT_BUTTON = 'Print test (1 fuel)';

const countText = count => `${count} ${count === 1 ? 'schematic' : 'schematics'} in cargo`;

// The cargo count and the Print test button shown at the top of Flight gear and Look (and the home HUD badge uses the same gate).
export function printBar(save, classId) {
  const gate = printGate(classState(save, classId), shipComplete(save, classId));
  return `<section class="ps-printbar${gate.ok ? '' : ' is-idle'}" aria-label="Print test. ${esc(countText(gate.count))}">
    <span class="ps-printbar-cargo">${PRINT_ICON}<b>${esc(countText(gate.count))}</b></span>
    <button type="button" class="ps-chip ps-printbar-btn" data-act="print" ${gate.ok ? '' : 'disabled'} aria-label="${esc(gate.ok ? `${PRINT_BUTTON}: prints ${countText(gate.count)}. Needs ${PRINT_PASS} of ${PRINT_QUESTIONS} right.` : `${PRINT_BUTTON} is not ready. ${gate.reason}`)}">${PRINT_ICON}<span>${PRINT_BUTTON}</span></button>
    ${gate.ok ? '' : `<small class="ps-printbar-why">${esc(gate.reason)}</small>`}
  </section>`;
}

function art(item) {
  if (item.kind === 'gear') return gearIcon(item.id);
  if (item.kind === 'paint') return `<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><circle cx="20" cy="20" r="16" fill="${PAINTS.find(paint => paint.id === item.id)?.color ?? '#ff8a65'}" stroke="#2b2b2b" stroke-width="3"/></svg>`;
  return stickerSVG(item.id, 46);
}

const kindNote = item => (item.kind === 'gear' ? 'Added to Flight gear' : item.kind === 'paint' ? 'New paint for your ship' : 'New sticker for your ship');
const row = item => `<li class="ps-gain"><span class="ps-gain-icon">${art(item)}</span><span><b>${esc(schematicName(item))}</b><small>${esc(`${item.kind} · ${kindNote(item)}`)}</small></span></li>`;

// Spends the fuel and starts the quiz; shared by the intro and the retry button.
function wire(app, classId) {
  let busy = false;
  return listen(app, async act => {
    if (act === 'map') { app.go('map'); return; }
    if (act === 'practise') { app.go('skills'); return; }
    if (act === 'grown') { app.go('grownups'); return; }
    if (act === 'roam') { app.go('roam'); return; }
    if (act === 'gear' || act === 'look') { app.go(act); return; }
    if (busy) return;
    busy = true;
    try {
      if (act === 'start') {
        // Fuel burns at the start. A Print test never gets the first-free rule: that is for launch mocks.
        await app.commit(applySpend(app.state(), null));
        app.go('quiz', { mission: printTestMission(classId) });
      } else if (act === 'ad') {
        if (await watchAd()) {
          await app.commit(applyAdFuel(app.state()));
          app.go('print-test', {}, { replace: true });
        } else app.toast('Watch the whole ad to earn fuel.');
      }
    } catch (error) { app.toast(error.message); } finally { busy = false; }
  });
}

export function printTest(app) {
  const save = app.state();
  const classId = save.activeClass;
  const gate = printGate(classState(save, classId), shipComplete(save, classId));
  const fuel = fuelStatus(save, null);
  const held = cargoOf(save, classId);
  mount(app, `<header class="ps-head">${chip('map', ICONS.back, 'Back to map')}<h1>Print test</h1>${fuelBadge(fuel)}</header>
    <section class="ps-brief ps-brief--mock">
      <p class="ps-kicker">${esc(countText(gate.count))}</p>
      <h2>${PRINT_QUESTIONS} questions · every chapter</h2>
      <p class="ps-fact">${ringo(48, 'cheer')}<span>Get ${PRINT_PASS} or more right first time to print everything in your cargo hold. Not enough? Try again, nothing is lost.</span></p>
      ${held.length ? `<ul class="ps-printlist" aria-label="Schematics in cargo">${held.map(row).join('')}</ul>` : ''}
    </section>
    <footer class="ps-cta">${!gate.ok
    ? `<p>${esc(gate.reason)}</p><button type="button" class="ps-primary ps-primary--big" disabled>Start Print test · 1 fuel</button>${shipComplete(save, classId) ? chip('roam', ICONS.ship, 'Free roam: find schematics (free)') : ''}`
    : fuel.canStart
      ? `<p class="ps-fuel-note">${esc(fuelNote(fuel, 'print'))}</p><button type="button" class="ps-primary ps-primary--big" data-act="start">Start Print test · 1 fuel</button>`
      : emptyTank(fuel)}</footer>`, 'print-test');
  if (gate.ok && !fuel.canStart) revealAdButton(app.root, fuel);
  return wire(app, classId);
}

export function printResult(app, { right, total, items = [] }) {
  const save = app.state();
  const classId = save.activeClass;
  const ok = printPassed(right);
  const fuel = fuelStatus(save, null);
  const hasGear = items.some(item => item.kind === 'gear');
  const hasLook = items.some(item => item.kind !== 'gear');
  const retry = fuel.canStart
    ? `<button type="button" class="ps-primary ps-primary--big" data-act="start">Try again · 1 fuel</button>`
    : emptyTank(fuel);
  if (ok) {
    mount(app, `<header class="ps-head"><h1>Printed!</h1></header>
      <section class="ps-result">
        <p class="ps-result-line">${ringo(44, 'cheer')}<span>${right} of ${total} right first time. ${items.length ? `Printed ${items.length} ${items.length === 1 ? 'thing' : 'things'}!` : 'Your cargo hold was already empty.'}</span></p>
        ${stars(starsFor(right, total))}
        <ul class="ps-printlist" aria-label="Printed items">${items.map(row).join('')}</ul>
      </section>
      <footer class="ps-cta">
        ${hasLook ? chip('look', ICONS.paint, 'Decorate my ship') : ''}${hasGear ? chip('gear', ICONS.gear, 'Flight gear') : ''}
        <button type="button" class="ps-primary ps-primary--big" data-act="map">Back to map</button></footer>`, 'print-result');
    play('stars');
  } else {
    mount(app, `<header class="ps-head"><h1>Not printed yet</h1>${fuelBadge(fuel)}</header>
      <section class="ps-result">
        <p class="ps-result-line">${ringo(44, 'think')}<span>${right} of ${total}. You need ${PRINT_PASS} to print. Try again.</span></p>
        <p class="ps-fuel-note">Nothing was lost: your schematics are still in the cargo hold.</p>
      </section>
      <footer class="ps-cta">${retry}<button type="button" class="ps-link" data-act="map">Back to map</button></footer>`, 'print-result');
    if (!fuel.canStart) revealAdButton(app.root, fuel);
  }
  return wire(app, classId);
}
