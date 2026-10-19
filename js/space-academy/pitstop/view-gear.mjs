// Flight gear: schematics found in free roam are printed by a Print test; the child installs 2 turrets and 1 shield.
import { classById } from './data.mjs';
import { GEAR_ORDER, gearById, gearIcon, shieldSprite, turretSprite } from './gear.mjs';
import { MAX_TURRETS, applyLoadout, classState, gearOf, loadoutOf, shipComplete } from './progress.mjs';
import { lockHint } from './schematics.mjs';
import { ICONS, esc } from './ui.mjs';
import { chip, listen, mount, shipPicture } from './views.mjs';
import { printBar } from './view-print-test.mjs';
import { play } from './audio.mjs';

const power = n => `<span class="ps-pow" aria-label="Power ${n} of 5">${[1, 2, 3, 4, 5].map(step => `<i class="${step <= n ? 'is-on' : ''}"></i>`).join('')}</span>`;

const stat = item => item.kind === 'turret'
  ? `${item.pattern === 'beam' ? 'Chain zap' : item.pattern === 'homing' ? 'Homing' : item.pattern === 'spread3' ? '3-way' : item.pattern === 'twin' ? 'Twin shot' : 'Single'} · ${item.damage} dmg`
  : `${item.hits} hits · back in ${item.regenSec}s`;

// The ship with its installed turrets on the wings and the shield bubble around it.
export const rigged = (shipHtml, { turrets, shield }) => `<div class="ps-rig">
  ${shield ? `<span class="ps-rig-shield">${shieldSprite(shield.id)}</span>` : ''}
  <span class="ps-rig-ship">${shipHtml}</span>
  ${turrets.map((item, slot) => `<span class="ps-rig-turret ps-rig-turret--${slot ? 'r' : 'l'}">${turretSprite(item.id)}</span>`).join('')}
</div>`;

export function gear(app) {
  const save = app.state();
  const classId = save.activeClass;
  const info = classById(classId);
  const owned = gearOf(save, classId);
  const load = loadoutOf(save, classId);
  const installed = new Set([...load.turrets.map(item => item.id), load.shield?.id]);
  const have = new Set(owned.map(item => item.id));
  const state = classState(save, classId);
  const shipDone = shipComplete(save, classId);

  const cards = GEAR_ORDER.map(id => {
    const item = gearById(id);
    if (!have.has(id)) {
      const why = lockHint(state, { kind: 'gear', id }, shipDone);
      const inHold = why.startsWith('Schematic in cargo');
      return `<li><div class="ps-gear is-locked${inHold ? ' is-cargo' : ''}" role="group" aria-label="${esc(`${item.name}, ${item.kind}, locked. ${why}`)}"><span class="ps-gear-icon">${inHold ? gearIcon(id) : ICONS.lock}</span><span class="ps-gear-text"><b>${esc(item.name)}</b><small>${esc(item.kind)} · locked</small><small class="ps-gear-how">${esc(why)}</small></span></div></li>`;
    }
    const on = installed.has(id);
    return `<li><button type="button" class="ps-gear ${on ? 'is-on' : ''}" data-act="toggle" data-gear="${id}" aria-pressed="${on}">
      <span class="ps-gear-icon">${gearIcon(id)}</span>
      <span class="ps-gear-text"><b>${esc(item.name)}</b><small>${esc(item.blurb)}</small><small>${esc(stat(item))}</small></span>
      ${power(item.power)}<span class="ps-gear-state">${on ? 'Installed' : 'Install'}</span></button></li>`;
  }).join('');

  mount(app, `<header class="ps-head">${chip('map', ICONS.back, 'Back to map')}<h1>Flight gear</h1></header>
    ${printBar(save, classId)}
    <section class="ps-gearbay">
      <div class="ps-gearbay-ship">${rigged(shipPicture(app, classId, { built: 'all' }), load)}</div>
      <p class="ps-lead"><span>${load.turrets.length} of ${MAX_TURRETS} turrets · ${load.shield ? '1 of 1 shield' : 'no shield yet'}. Tap gear to install or remove it.</span></p>
    </section>
    <ul class="ps-gearlist">${cards}</ul>
    <footer class="ps-cta"><p>${owned.length} of ${GEAR_ORDER.length} printed</p>
      <button type="button" class="ps-primary ps-primary--big" data-act="map">Back to map</button>      </footer>`, 'gears');
  return listen(app, async (act, target) => {
    if (act === 'map') app.go('map');
    if (act === 'print') app.go('print-test');
    if (act === 'toggle') {
      try {
        await app.commit(applyLoadout(app.state(), classId, target.dataset.gear));
        play('tap');
        app.go('gear', {}, { replace: true });
      } catch (error) { app.fail(error); }
    }
  });
}
