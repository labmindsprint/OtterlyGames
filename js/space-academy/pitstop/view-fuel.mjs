import { ICONS, esc, ringo } from './ui.mjs';
import { adReady, sources, verifyCode } from './fuel-bridge.mjs';
import { DAILY_FREE, MAX_ADS, PACKS, REMOVE_ADS, applyBoughtFuel, applyUnlimited, fuelStatus } from './fuel.mjs';

const KOFI = 'https://ko-fi.com/otterly_games';

export function fuelBadge(status) {
  const text = status.unlimited ? 'Fuel: ∞' : status.firstFree ? 'Fuel: 1st free' : `Fuel: ${status.available}`;
  const label = status.unlimited ? 'Fuel: unlimited' : status.firstFree ? 'This first mock test is free' : `Fuel: ${status.available} ${status.available === 1 ? 'tank' : 'tanks'} left`;
  return `<span class="ps-fuel${status.canStart ? '' : ' is-empty'}" role="img" aria-label="${label}">${ICONS.fuel}<b>${text}</b></span>`;
}

export function fuelNote(status, kind = 'mock') {
  if (status.unlimited) return 'Unlimited fuel, thank you for supporting us!';
  if (kind === 'print') return `A Print test uses 1 fuel, every time. You get ${DAILY_FREE} free each day.`;
  if (status.firstFree) return 'Your first mock test is free. After that, each one uses 1 fuel.';
  return `This mock test uses 1 fuel. You get ${DAILY_FREE} free each day.`;
}

export function emptyTank(status) {
  return `<section class="ps-empty-tank" aria-live="polite">
    <p class="ps-fact">${ringo(48, 'think')}<span>The tank is empty! Free fuel comes back tomorrow. Welding parts, practice, flights and free roam are always free.</span></p>
    <button type="button" class="ps-primary ps-primary--big" data-act="ad" hidden>Watch an ad for +1 fuel<small>${status.adsLeft} of ${MAX_ADS} left today</small></button>
    <button type="button" class="ps-chip" data-act="practise">${ICONS.ship}<span>Practise a part for free</span></button>
    <button type="button" class="ps-chip" data-act="grown">${ICONS.lock}<span>Ask a grown-up for more fuel</span></button>
  </section>`;
}

// Shows the ad button only when the Android app really has a rewarded ad ready and ads are left today.
export async function revealAdButton(root, status) {
  const button = root.querySelector('[data-act="ad"]');
  if (button && status.adsLeft > 0 && await adReady()) button.hidden = false;
}

const row = (act, id, text, price = '') => `<button type="button" class="ps-chip ps-fuel-buy" data-fuel="${act}" data-id="${id}"><span>${esc(text)}</span>${price ? `<b>${esc(price)}</b>` : ''}</button>`;

async function sectionHtml(app) {
  const save = app.state();
  const status = fuelStatus(save, null);
  const { billing, native } = sources();
  const head = status.unlimited
    ? '<p><b>Unlimited fuel is on.</b> Thank you for supporting Otterly Games!</p>'
    : `<p>Each mock test after the first, and every Print test, uses 1 fuel. Welding parts, practice, flights and free roam are always free. ${DAILY_FREE} free fuel a day, plus up to ${MAX_ADS} rewarded ads. Fuel left today: <b>${status.daily}</b>${status.bank ? ` · bought fuel: <b>${status.bank}</b>` : ''}.</p>`;
  if (status.unlimited) return head;
  if (native && billing) {
    let prices = {};
    try { prices = Object.fromEntries((await billing.products()).map(item => [item.id, item.price])); } catch { /* prices stay blank */ }
    return `${head}<div class="ps-fuel-shop">
      ${row('buy', REMOVE_ADS.id, REMOVE_ADS.label, prices[REMOVE_ADS.id] ?? `₹${REMOVE_ADS.rupees}`)}
      <button type="button" class="ps-link" data-fuel="restore">Restore purchases</button></div>`;
  }
  return `${head}<div class="ps-fuel-shop">
    <p>Support us on Ko-fi with ₹${REMOVE_ADS.rupees} or more. We will send you a code for unlimited fuel and no ads.</p>
    <p><a class="ps-chip" href="${KOFI}" target="_blank" rel="noopener noreferrer">Support on Ko-fi ↗</a></p>
    <label class="ps-code">Have a code?<textarea rows="3" data-code spellcheck="false" autocomplete="off" aria-label="Supporter code"></textarea></label>
    <button type="button" class="ps-chip" data-fuel="code">Unlock unlimited fuel</button></div>`;
}

export function fuelSection() {
  return '<section class="ps-fuel-box" data-fuel-box aria-label="Fuel and support"><h2>Fuel</h2><div data-fuel-body></div><p class="ps-fuel-msg" data-fuel-msg role="status"></p></section>';
}

// Fills and wires the Fuel box inside the unlocked grown-ups panel.
export async function wireFuelSection(app) {
  const box = app.root.querySelector('[data-fuel-box]');
  const body = box.querySelector('[data-fuel-body]');
  const msg = box.querySelector('[data-fuel-msg]');
  const refresh = async () => { body.innerHTML = await sectionHtml(app); };
  await refresh();
  let busy = false;
  const onClick = async event => {
    const target = event.target.closest('[data-fuel]');
    if (!target || busy) return;
    busy = true;
    msg.textContent = '';
    try {
      const { billing } = sources();
      if (target.dataset.fuel === 'buy') {
        const id = target.dataset.id;
        const result = await billing.buy(id);
        if (!result?.ok) { msg.textContent = 'The purchase did not go through. You have not been charged.'; return; }
        const next = id === REMOVE_ADS.id ? applyUnlimited(app.state(), 'store') : applyBoughtFuel(app.state(), PACKS.find(pack => pack.id === id).fuel);
        await app.commit(next);
        msg.textContent = id === REMOVE_ADS.id ? 'Unlimited fuel is on. Thank you!' : 'Fuel added. Thank you!';
      } else if (target.dataset.fuel === 'restore') {
        const { ids = [] } = await billing.restore();
        if (ids.includes(REMOVE_ADS.id)) { await app.commit(applyUnlimited(app.state(), 'store')); msg.textContent = 'Unlimited fuel restored.'; }
        else msg.textContent = 'No earlier purchase was found for this account.';
      } else if (target.dataset.fuel === 'code') {
        const name = await verifyCode(box.querySelector('[data-code]').value);
        if (!name) { msg.textContent = 'That code did not work. Copy the whole code from our message.'; return; }
        await app.commit(applyUnlimited(app.state(), 'code'));
        msg.textContent = `Thank you, ${name}! Unlimited fuel is on.`;
      }
      await refresh();
    } catch (error) {
      msg.textContent = error?.message ?? 'Something went wrong.';
    } finally { busy = false; }
  };
  box.addEventListener('click', onClick);
  return () => box.removeEventListener('click', onClick);
}
