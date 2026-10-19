// The rocket lab: the home screen. A blueprint-grid workshop where two robot arms weld the next part onto your ship.
import { LEVEL_NAMES, classById } from './data.mjs';
import { getGrade } from '../curriculum.mjs';
import { builtParts, cargoOf, classState, nextPart, proficiency, shipComplete, weakest } from './progress.mjs';
import { shipData } from './ships/index.mjs';
import { SKY } from './sky.mjs';
import { ICONS, esc, ringo } from './ui.mjs';
import { armPair, backdrop, H, W } from './arms.mjs';
import { chip, copyright, grownupsButton, listen, mount, nextAction, shipPicture, skyArt, soundButton } from './views.mjs';
import { fuelStatus } from './fuel.mjs';
import { fuelBadge } from './view-fuel.mjs';
import { PRINT_ICON } from './view-print-test.mjs';

function gauge(label, value, total, text) {
  const pct = total ? Math.round(value / total * 100) : 0;
  return `<div class="ps-gauge" role="img" aria-label="${esc(label)} ${esc(text)}"><span class="ps-gauge-label">${esc(label)}</span><span class="ps-gauge-bar"><i style="width:${pct}%"></i></span><span class="ps-gauge-text">${esc(text)}</span></div>`;
}

export function map(app) {
  const save = app.state();
  const classId = save.activeClass;
  const info = classById(classId);
  const state = classState(save, classId);
  const action = nextAction(save, classId);
  const built = builtParts(save, classId);
  const complete = shipComplete(save, classId);
  const next = nextPart(save, classId);
  const flown = info.sky.filter(id => state.flown[id]).length;
  const rows = proficiency(save, classId, getGrade(classId).chapters);
  const focus = weakest(rows);
  const scored = rows.filter(item => item.index >= 0);
  const rank = scored.length ? Math.min(3, Math.round(scored.reduce((sum, item) => sum + item.index, 0) / scored.length)) : 0;
  const starsHave = info.parts.reduce((sum, part) => sum + (state.parts[part.id]?.stars ?? 0), 0);
  const ready = state.launchReady;

  const joints = next ? shipData(classId).parts.find(item => item.id === next.id).joints : [];
  const arms = armPair(joints, { working: Boolean(next), wordOffset: built.length * 2 });

  const plate = complete
    ? (ready ? 'ROCKET READY · LAUNCH!' : flown >= info.sky.length ? 'ALL OBJECTS FOUND · FREE ROAM: FIND SCHEMATICS' : `ROCKET BUILT · MOCK TEST ${flown + 1} OF ${info.sky.length} TO LAUNCH`)
    : `WELDING PART ${info.parts.indexOf(next) + 1} OF ${info.parts.length} · ${next.label.toUpperCase()}`;
  const cargo = cargoOf(save, classId).length;
  const printChip = complete && cargo > 0
    ? `<button type="button" class="ps-chip ps-chip--print" data-act="print" aria-label="Print test, 1 fuel. ${cargo} ${cargo === 1 ? 'schematic' : 'schematics'} in cargo">${PRINT_ICON}<span>Print test · 1 fuel</span><b class="ps-chip-count">${cargo}</b></button>`
    : '';

  const bom = info.parts.map((part, index) => {
    const have = state.parts[part.id];
    const status = have ? `<span class="ps-bom-state is-done">${'★'.repeat(have.stars)}${'☆'.repeat(3 - have.stars)}</span>` : part === next ? '<span class="ps-bom-state is-next">NEXT</span>' : `<span class="ps-bom-state">${ICONS.lock}</span>`;
    return `<li class="${have ? 'is-done' : part === next ? 'is-next' : ''}"><span class="ps-bom-no">${String(index + 1).padStart(2, '0')}</span><span class="ps-bom-name">${esc(part.label)}<small>${esc(part.topic)}</small></span>${status}</li>`;
  }).join('');

  const plan = info.sky.map((id, index) => {
    const seen = Boolean(state.flown[id]);
    const open = ready === id;
    return `<li class="ps-plan-node ${seen ? 'is-done' : open ? 'is-next' : ''}"><button type="button" class="ps-plan-btn" data-act="plan" data-index="${index}" aria-label="Mock test ${index + 1}: ${seen ? `${esc(SKY[id].name)}, visit again` : open ? `${esc(SKY[id].name)}, ready to launch` : 'locked, tap to see what unlocks it'}">
          <span class="ps-plan-art">${seen || open ? skyArt(id) : '<b aria-hidden="true">?</b>'}</span><span class="ps-plan-no">${seen || open ? esc(SKY[id].name) : `Mock ${index + 1}`}</span></button></li>`;
  }).join('');

  const checks = rows.map(row => `<li class="${focus?.chapter === row.chapter ? 'is-focus' : ''}"><span class="ps-check-title">${esc(row.title)}</span>
      <span class="ps-level" aria-hidden="true">${[0, 1, 2, 3].map(step => `<i class="${row.index >= step ? 'is-on' : ''}"></i>`).join('')}</span><span class="ps-check-name">${row.name}</span></li>`).join('');

  mount(app, `<header class="ps-hud">
      <div class="ps-hud-row">
        <button type="button" class="ps-chip ps-chip--class" data-act="classes" aria-label="Change class. Now ${esc(info.label)}, ${esc(info.shipName)}">${esc(info.label)}<span class="ps-chip-sub"> · ${esc(info.shipName)}</span></button>
        <div class="ps-head-tools">${fuelBadge(fuelStatus(save, classId))}${chip('gear', ICONS.gear, 'Gear')}${chip('look', ICONS.paint, 'Look')}${complete ? chip('roam', ICONS.ship, 'Free roam') : ''}${printChip}<button type="button" class="ps-chip ps-chip--help" data-act="guide" aria-label="How to play">?</button>${soundButton(app)}${grownupsButton}</div>
      </div>
      <div class="ps-gauges">
        ${gauge('Hull', built.length, info.parts.length, `${built.length}/${info.parts.length} parts`)}
        ${gauge('Flights', flown, info.sky.length, `${flown}/${info.sky.length} found`)}
        ${gauge('Stars', starsHave, info.parts.length * 3, `${starsHave}/${info.parts.length * 3}`)}
        <div class="ps-gauge ps-gauge--rank" role="img" aria-label="Pilot rank ${LEVEL_NAMES[rank]}"><span class="ps-gauge-label">Rank</span><span class="ps-level">${[0, 1, 2, 3].map(step => `<i class="${rank >= step ? 'is-on' : ''}"></i>`).join('')}</span><span class="ps-gauge-text">${LEVEL_NAMES[rank]}</span></div>
      </div>
    </header>
    <section class="ps-lab" aria-label="Rocket lab: ${esc(plate.toLowerCase())}">
      ${backdrop(info)}
      <div class="ps-lab-ship">${shipPicture(app, classId, { built, ghost: true, flame: complete })}<span class="ps-lab-scan" aria-hidden="true"></span></div>
      <svg class="ps-lab-svg ps-lab-svg--front" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false">${arms}</svg>
      <p class="ps-lab-plate">${esc(plate)}</p>
    </section>
    <div class="ps-mid">
    <section class="ps-panel ps-panel--bom" aria-label="Parts list"><h2>Parts list</h2><ol class="ps-bom">${bom}</ol></section>
    <section class="ps-panel ps-panel--plan" aria-label="Flight plan"><h2>Flight plan</h2><ol class="ps-plan">${plan}</ol></section>
    </div>
    <section class="ps-panel ps-panel--checks" aria-label="Systems check"><h2>Systems check</h2><ul class="ps-checks">${checks}</ul>
      <button type="button" class="ps-link" data-act="skills">${focus ? `Needs work: ${esc(focus.title)} · open Skills` : 'Open Skills'}</button></section>
    <footer class="ps-cta">
      <p>${ringo(30, 'cheer')}<span>${esc(action.sub)}</span></p>
      <button type="button" class="ps-primary ps-primary--big" data-act="go">${esc(action.label)}</button>
      ${complete ? '<button type="button" class="ps-link" data-act="roam">Free roam (free): zap enemies, find schematics</button>' : ''}
          </footer>${copyright}`, 'map');
        if (next) app.root.querySelector(`.ps-lab-ship [data-part="${next.id}"]`)?.classList.add('is-next');
  return listen(app, (act, target) => {
    if (act === 'classes') app.go('start');
    if (act === 'print') app.go('print-test');
    if (act === 'guide') app.go('guide', { replay: true });
    if (act === 'grownups') app.go('grownups');
    if (act === 'skills') app.go('skills');
    if (act === 'look') app.go('look');
    if (act === 'gear') app.go('gear');
    if (act === 'roam') app.go('roam');
    if (act === 'go') app.go(action.view, action.params);
    if (act === 'plan') {
      const index = Number(target.dataset.index);
      const id = info.sky[index];
      if (state.flown[id]) return app.go('discover', { objectId: id });
      if (ready === id) return app.go('launch', { objectId: id });
      if (!complete) {
        const left = info.parts.length - built.length;
        return app.toast(`Finish building your rocket first: ${left} part${left === 1 ? '' : 's'} left to weld. Then take Mock test ${index + 1}.`);
      }
      if (ready) return app.toast('Your rocket is ready. Tap Launch first.');
      if (index === flown) return app.go('mock-intro');
      app.toast(`Take Mock test ${flown + 1} first. Mock test ${index + 1} unlocks after it.`);
    }
  });
}
