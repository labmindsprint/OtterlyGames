import { sources } from './fuel-bridge.mjs';

// A legacy ok/ids response is not verified ownership. Ordinary offline saves and older grants remain untouched.
export function applyPurchaseSnapshot(save, result) {
  const owner = typeof result?.owner === 'string' && /^[a-f0-9]{64}$/.test(result.owner);
  const signedOut = ['signed-out', 'account-deleted'].includes(result?.status) && result.signedIn === false;
  const switched = result?.status === 'signed-in' && result.signedIn === true && owner
    && save.premium?.owner !== result.owner;
  const verified = result?.status === 'verified' && result.signedIn === true && owner
    && typeof result.unlimited === 'boolean' && typeof result.test === 'boolean';
  if (!signedOut && !switched && !verified) return save;
  if (save.premium?.unlimited && save.premium.via === 'code') return save;
  const unlimited = verified && result.unlimited;
  if (!unlimited && save.premium?.via !== 'store-verified') return save;
  if (save.premium?.via === 'store-verified' && save.premium.unlimited === unlimited
    && save.premium.owner === (owner ? result.owner : undefined)) return save;
  const draft = structuredClone(save);
  draft.premium = { unlimited, via: 'store-verified', at: new Date().toISOString(),
    ...(owner ? { owner: result.owner } : {}) };
  draft.revision += 1;
  return draft;
}

export function installPurchaseRecovery(app) {
  let queue = Promise.resolve();
  let restoring = null;
  let accountVersion = -1;
  const accept = result => {
    if (!Number.isSafeInteger(result?.accountVersion) || result.accountVersion < accountVersion) return Promise.resolve();
    accountVersion = result.accountVersion;
    const task = queue.then(async () => {
      if (result.accountVersion < accountVersion) return;
      const current = app.state();
      const next = applyPurchaseSnapshot(current, result);
      if (next === current) return;
      await app.commit(next);
      window.dispatchEvent(new Event('otterly-purchases-changed'));
    });
    // A failed local save must not poison subsequent paid-order recovery.
    queue = task.catch(() => {});
    return task;
  };
  const recover = () => {
    if (restoring) return restoring;
    const { billing, account, simulated } = sources();
    if (!billing || !account || simulated) return Promise.resolve();
    restoring = (async () => {
      const parent = await account.status();
      await accept(parent);
      if (!parent.signedIn) return parent;
      const result = await billing.restore();
      await accept(result);
      return result;
    })().finally(() => { restoring = null; });
    return restoring;
  };
  const report = error => app.toast(error?.message ?? 'Purchase recovery could not be saved. Try Restore purchases again.');
  window.addEventListener('otterly-native-purchases', event => { accept(event.detail).catch(report); });
  window.addEventListener('online', () => { recover().catch(report); });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) recover().catch(report);
  });
  recover().catch(report);
  return { accept, recover };
}
