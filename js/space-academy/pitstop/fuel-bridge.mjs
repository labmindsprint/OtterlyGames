// Where fuel can come from. The Android app injects window.OtterlyNative; the website has no ads or in-app purchases.
//
// window.OtterlyNative contract (set by the Android wrapper before the page loads):
//   rewardedAd: { available(): Promise<boolean>, show(): Promise<{ rewarded: boolean }> }
//   billing:    { products(): Promise<{ id, price }[]>, buy(id): Promise<{ ok: boolean }>, restore(): Promise<{ ids: string[] }> }
// Product ids: fuel-5, fuel-15 (consumable) and remove-ads (one time).
const PUBLIC_KEY = { kty: 'EC', crv: 'P-256', x: 'l5Pzrd1722xXZ4tUaUVI_cdJsBzIJwRjG9Wji37sw1Q', y: 'e1lkpFT083PUJrCUWQjV_R_6oLibFC-2wEGJx5atHOk' };

// Rehearsal stand-in, only on a developer machine with ?test=1&native=fake. Never reachable on the public site.
function installFake() {
  const query = new URLSearchParams(location.search);
  const local = ['localhost', '127.0.0.1'].includes(location.hostname);
  if (!local || query.get('test') !== '1' || query.get('native') !== 'fake' || window.OtterlyNative) return;
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  window.OtterlyNative = {
    rewardedAd: { available: async () => true, show: async () => { await wait(300); return { rewarded: query.get('ad') !== 'skip' }; } },
    billing: {
      products: async () => [{ id: 'fuel-5', price: '₹49' }, { id: 'fuel-15', price: '₹99' }, { id: 'remove-ads', price: '₹150' }],
      buy: async () => { await wait(300); return { ok: true }; },
      restore: async () => ({ ids: [] }),
    },
  };
}

// The Android shell already pads the WebView below the status bar, so the page must not add that inset again.
if (typeof window !== 'undefined' && window.OtterlyNative) document.documentElement.style.setProperty('--ps-safe-top', '0px');

export function sources() {
  installFake();
  const native = window.OtterlyNative ?? null;
  return { ad: native?.rewardedAd ?? null, billing: native?.billing ?? null, native: Boolean(native) };
}

export async function adReady() {
  try { return Boolean(await sources().ad?.available()); } catch { return false; }
}

// Resolves true only when the provider says the child watched the whole ad.
export async function watchAd() {
  const { ad } = sources();
  if (!ad) return false;
  try { return (await ad.show())?.rewarded === true; } catch { return false; }
}

const fromB64u = text => Uint8Array.from(atob(text.replaceAll('-', '+').replaceAll('_', '/')), char => char.charCodeAt(0));

// Checks a supporter code signed by the operator's private key. Returns the supporter name, or null.
export async function verifyCode(raw) {
  try {
    const [body, signature, ...extra] = String(raw).replace(/\s+/g, '').split('.');
    if (!body || !signature || extra.length) return null;
    const payload = new TextDecoder().decode(fromB64u(body));
    const [version, tier, name] = payload.split('|');
    if (version !== 'OTT1' || tier !== 'unlimited' || !name) return null;
    const key = await crypto.subtle.importKey('jwk', PUBLIC_KEY, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    const good = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, fromB64u(signature), new TextEncoder().encode(payload));
    return good ? name : null;
  } catch {
    return null;
  }
}
