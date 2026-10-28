import { ICONS, esc, ringo } from './ui.mjs';
import { adReady, sources, verifyCode } from './fuel-bridge.mjs';
import { DAILY_FREE, MAX_ADS, REMOVE_ADS, applyUnlimited, fuelStatus } from './fuel.mjs';

const KOFI = 'https://ko-fi.com/otterly_games';

const DELETE_URL = 'https://otterlygames.com/space-academy-delete-account.html';

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
    <button type="button" class="ps-primary ps-primary--big"     data-act="ad" hidden>Watch an ad for +1 fuel<small>Ad · ${status.adsLeft} of ${MAX_ADS} left today</small></button>
    <button type="button" class="ps-chip" data-act="practise">${ICONS.ship}<span>Practise a part for free</span></button>
    <button type="button" class="ps-chip" data-act="grown">${ICONS.lock}<span>Ask a grown-up for more fuel</span></button>
        <p class="ps-adfree-note" data-adfree-note hidden></p>
      </section>`;
    }

    // Neutral note for the app only: ad-free play is a grown-ups purchase. The price is the live store price, never a typed amount.
    export function adFreeNote(price) {
      return `Want no ads and unlimited fuel? A grown-up can get it under For grown-ups${price ? ` (${price})` : ''}.`;
}

    async function livePrice(billing) {
      try { return (await billing.products()).find(item => item.id === REMOVE_ADS.id)?.price || ''; } catch { return ''; }
    }

    // Shows the ad button only when the Android app really has a rewarded ad ready and ads are left today.
    // Also shows the ad-free note where the app offers the purchase.
    export async function revealAdButton(root, status) {
      const button = root.querySelector('[data-act="ad"]');
      if (button && status.adsLeft > 0 && await adReady()) button.hidden = false;
      const note = root.querySelector('[data-adfree-note]');
      const { billing, native } = sources();
      if (!note || !native || !billing || status.unlimited) return;
      note.textContent = adFreeNote(await livePrice(billing));
      note.hidden = false;
    }

const row = (act, id, text, price = '') => `<button type="button" class="ps-chip ps-fuel-buy" data-fuel="${act}" data-id="${id}"${price ? '' : ' disabled'}><span>${esc(text)}</span>${price ? `<b>${esc(price)}</b>` : ''}</button>`;

const card = (icon, title, text) => `<div class="ps-purchased" role="status"><p class="ps-purchased-title"><span aria-hidden="true">${icon}</span> <b>${title}</b></p><p>${text}</p></div>`;

// The saved record has no test flag, so the durable card never claims a real payment; test wording comes only from the current verified callback.
function unlockCard() {
  return card('🚀', 'Ad-free unlocked!', 'No ads and unlimited fuel, for good. The otters are doing zero-gravity victory flips.');
}

function unlockText(result) {
  if (result?.test === true) return 'Test unlock verified: ad-free is on. This was a Google Play license-test purchase, so no real charge is implied.';
  if (result?.test === false) return 'Ad-free purchased! No ads and unlimited fuel. Thank you, space captain!';
  return 'Ad-free is on! No ads and unlimited fuel. Thank you, space captain!';
}

async function sectionHtml(app) {
  const save = app.state();
  const status = fuelStatus(save, null);
  const { billing, account, native, simulated } = sources();
  const head = status.unlimited
    ? '<p><b>Unlimited fuel is on.</b> Thank you for supporting Otterly Games!</p>'
    : `<p>Each mock test after the first, and every Print test, uses 1 fuel. Welding parts, practice, flights and free roam are always free. ${DAILY_FREE} free fuel a day${native ? `, plus up to ${MAX_ADS} rewarded ads` : ''}. Fuel left today: <b>${status.daily}</b>${status.bank ? ` · bought fuel: <b>${status.bank}</b>` : ''}.</p>`;
  const restore = '<button type="button" class="ps-link" data-fuel="restore">Restore purchases</button>';
  if (native && billing) {
    const parent = await account?.status();
    const privacy = '<p>Only the grown-up purchase account uses our server, with a recovery code instead of an email or Google sign-in. Child profiles and progress stay on this device.</p>';
    const accountPanel = simulated ? '<p>Simulation only. No purchase or entitlement will be saved.</p>'
      : parent?.signedIn ? `<h3>Parent purchase account</h3><p>Parent account connected. Child profiles and progress stay on this device.</p>
        <details class="ps-fuel-details"><summary>Purchase account &amp; privacy details</summary>${privacy}
        <p>A parent account is connected. The same recovery code is needed on another device. Open the recovery code screen to view the saved code, reconnect or change code.</p><button type="button" class="ps-chip" data-fuel="sign-in">Set up or restore with a recovery code</button><button type="button" class="ps-link" data-fuel="sign-out">Sign out of parent account (removes the code from this device)</button>${typeof account?.deleteAccount === 'function' ? `<p>Signing out does not delete server records. To delete the parent purchase account, revoke its sessions and store benefits, and schedule minimal purchase records for removal after 30 days, use the button below. It does not refund Google Play or delete child progress.</p><button type="button" class="ps-chip ps-chip--danger" data-fuel="delete-account">Delete parent purchase account…</button><p><a class="ps-link" href="${DELETE_URL}" target="_blank" rel="noopener noreferrer">Account deletion help on our website ↗</a></p>` : ''}</details>`
        : `<h3>Parent purchase account</h3><p>Set up or restore with a recovery code to purchase or restore. Children can keep playing offline without an account.</p><button type="button" class="ps-chip" data-fuel="sign-in">Set up or restore with a recovery code</button>
        <details class="ps-fuel-details"><summary>Purchase account &amp; privacy details</summary>${privacy}</details>`;
    if (!simulated && !parent?.signedIn) return `${head}${accountPanel}`;
    if (status.unlimited) return `${unlockCard()}${accountPanel}${restore}`;
    let prices = {};
    try { prices = Object.fromEntries((await billing.products()).map(item => [item.id, item.price])); } catch { /* prices stay blank */ }
    return `${head}${accountPanel}<div class="ps-fuel-shop">
      ${row('buy', REMOVE_ADS.id, REMOVE_ADS.label, prices[REMOVE_ADS.id] ?? '')}
      ${prices[REMOVE_ADS.id] ? '' : '<p>Purchases are unavailable. Connect to Google Play and try again.</p>'}
      ${restore}</div>`;
  }
  if (status.unlimited) return head;
  return `${head}<div class="ps-fuel-shop">
    <p>Support us on Ko-fi with ₹${REMOVE_ADS.rupees} or more. We will send you a code for unlimited fuel.</p>
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
  // Only a persisted store-verified grant for the currently connected parent counts; code grants and other owners never do.
  const storeGrant = async () => {
    const { account } = sources();
    const premium = app.state().premium;
    if (premium?.unlimited !== true || premium.via !== 'store-verified' || typeof premium.owner !== 'string') return null;
    try { const parent = await account?.status(); return parent?.signedIn === true && parent.owner === premium.owner ? premium : null; } catch { return null; }
  };
  let failing = false;
  const fail = async text => {
    const grant = await storeGrant();
    if (grant) { msg.textContent = unlockText(); failing = false; try { await refresh(); } catch { /* message stays */ } } else { msg.textContent = text; failing = true; }
  };
  const refresh = async () => {
    body.innerHTML = await sectionHtml(app);
    const grant = failing ? await storeGrant() : null;
    if (grant) { msg.textContent = unlockText(); failing = false; }
  };
  await refresh();
  let busy = false;
  const onClick = async event => {
    const target = event.target.closest('[data-fuel]');
    if (!target) return;
    if (busy) { msg.textContent = 'Still working on your last request. Please wait a moment and do not tap again.'; return; }
    busy = true;
    failing = false;
    const buying = target.dataset.fuel === 'buy';
    msg.textContent = buying ? 'Opening Google Play… Complete the payment there. We will confirm it here once it is verified.'
      : target.dataset.fuel === 'restore' ? 'Checking for your purchase…' : 'Working on it…';
    box.setAttribute?.('aria-busy', 'true');
    const locked = new Set([...(box.querySelectorAll?.('button[data-fuel]') ?? [])].filter(button => button.disabled));
    box.querySelectorAll?.('button[data-fuel]').forEach(button => { button.disabled = true; });
    try {
      const { billing, account, simulated } = sources();
      if (target.dataset.fuel === 'delete-account') {
        if (typeof account?.deleteAccount !== 'function') throw new Error('Account deletion is not available in this version.');
        const result = await account.deleteAccount();
        if (result?.status === 'account-deleted') {
          await app.purchases.accept(result);
          msg.textContent = 'Parent purchase account deleted. Server access was revoked on all devices and the recovery code was removed from this device. Child progress is kept. Minimal purchase records are scheduled for removal after 30 days. Google Play purchases are not refunded.';
        } else msg.textContent = deleteMessage(result);
      } else if (target.dataset.fuel === 'sign-in' || target.dataset.fuel === 'sign-out') {
        const signingIn = target.dataset.fuel === 'sign-in';
        const result = await (signingIn ? account.signIn() : account.signOut());
        await app.purchases.accept(result);
        msg.textContent = result?.status === 'verified' ? (result.unlimited ? 'Parent account connected. Unlimited fuel restored.' : 'Parent account connected. Keep your recovery code private.')
          : result?.status === 'signed-out' ? (result.remoteRevoked === false
            ? 'Signed out on this device and the stored recovery code was removed. Server-session revocation could not be confirmed; it expires automatically.'
            : 'Signed out on this device and the stored recovery code was removed. Child progress is unchanged.')
          : purchaseMessage(result);
      } else if (target.dataset.fuel === 'buy') {
        const id = target.dataset.id;
        if (id !== REMOVE_ADS.id) throw new Error('This product is not available.');
        const result = await billing.buy(id);
        if (simulated && result?.status === 'simulated') {
          msg.textContent = 'Simulation only: purchase flow completed. No entitlement was saved or payment made.';
        } else if (result?.status === 'verified' && result.unlimited === true && typeof result.test === 'boolean') {
          await app.purchases.accept(result);
          msg.textContent = unlockText(result);
        } else { await fail(purchaseMessage(result)); return; }
      } else if (target.dataset.fuel === 'restore') {
        const result = await billing.restore();
        if (result?.status !== 'verified' || typeof result.unlimited !== 'boolean' || typeof result.test !== 'boolean') {
          await fail(purchaseMessage(result));
          return;
        }
        await app.purchases.accept(result);
        msg.textContent = result.unlimited ? 'Unlimited fuel restored.' : 'No active verified purchase was found for this parent account.';
      } else if (target.dataset.fuel === 'code') {
        const name = await verifyCode(box.querySelector('[data-code]').value);
        if (!name) { msg.textContent = 'That code did not work. Copy the whole code from our message.'; return; }
        await app.commit(applyUnlimited(app.state(), 'code'));
        msg.textContent = `Thank you, ${name}! Unlimited fuel is on.`;
      }
      await refresh();
    } catch (error) {
      await fail(`${error?.message ?? 'Something went wrong.'}${buying ? ' If you were charged, tap Restore purchases to check; do not buy again.' : ''}`);
      try { await refresh(); } catch { /* keep the message visible */ }
    } finally {
      busy = false;
      box.removeAttribute?.('aria-busy');
      box.querySelectorAll?.('button[data-fuel]').forEach(button => { if (!locked.has(button)) button.disabled = false; });
    }
  };
  box.addEventListener('click', onClick);
  window.addEventListener('otterly-purchases-changed', refresh);
  return () => {
    box.removeEventListener('click', onClick);
    window.removeEventListener('otterly-purchases-changed', refresh);
  };
}

export function deleteMessage(result) {
  switch (result?.status) {
    case 'cancelled': return 'Account deletion was cancelled.';
    case 'sign-in-required': case 'signed-out': return 'Set up or restore with a recovery code first, then try deleting again.';
    case 'invalid-recovery-code': return 'The saved recovery code was not accepted. Use the website deletion page with the same code.';
    case 'busy': return 'An account or purchase operation is already in progress. Please wait.';
    case 'delete-unavailable': return 'Account deletion is unavailable right now. Check the connection and try again, or use the deletion page on our website.';
    default: return 'We could not confirm the deletion. Access may already have been revoked. Try again with the same recovery code, or use the deletion page on our website.';
  }
}

export function purchaseMessage(result) {
  switch (result?.status) {
    case 'pending': return 'Payment is pending. Ad-free unlocks only after payment and verification complete. Check back soon with Restore purchases; do not buy again.';
    case 'cancelled': return 'The purchase was cancelled.';
    case 'ownership-required': return 'This purchase belongs to a different parent account. Use the original parent recovery code; do not buy again.';
    case 'sign-in-required': case 'signed-out': return 'Set up or restore with a recovery code to purchase or restore.';
    case 'sign-in-unavailable': return 'The parent account is unavailable. Check the connection and try again.';
    case 'invalid-recovery-code': return 'That recovery code was not accepted. Check it carefully and try again.';
    case 'sign-in-no-account': return 'No parent account is available for this code. Check it and try again.';
    case 'busy': return 'An account or purchase operation is already in progress. Please wait.';
    case 'test-not-enabled': return 'This server is not configured for license-test purchases.';
    case 'revoked': return 'This purchase is no longer active.';
    default: return 'We could not confirm the purchase yet, so ad-free is not on. If you were charged, it may still be pending: go online and tap Restore purchases to check. Do not buy again.';
  }
}
