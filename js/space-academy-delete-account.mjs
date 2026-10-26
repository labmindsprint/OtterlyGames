// Adult-only Space Academy parent purchase-account deletion. Nothing is sent until an explicit submit.
// The recovery code is only ever held in the password field and request body: never in a URL, storage, logs or telemetry.
export const API_BASE = 'https://otterly-rank-rqvoeb.azurewebsites.net/api/osa';
const APP_ID = 'space-academy';
const CONFIRMATION = 'delete-parent-purchase-account';
const CONTRACT_VERSION = 3;
const AUTH_METHOD = 'recovery-code-v1';
const CHALLENGE_LENGTH = 43;
const TIMEOUT_MS = 15000;
const EXPIRED_ERRORS = new Set(['parent-sign-in-expired-or-used', 'challenge-expired-or-used']);

export const MESSAGES = Object.freeze({
  missing: 'Enter your recovery code and tick the confirmation box to continue.',
  needConfirm: 'Tick the confirmation box to delete the account.',
  needCode: 'Enter your parent recovery code.',
  busy: 'Deleting. Please wait…',
  success: 'Parent purchase account deleted. Its server sessions and store benefits are revoked; an offline device may keep its cached benefit until it next contacts the server. Minimal pseudonymous purchase records are erased automatically after 30 days. Child progress on devices is unchanged and no Google Play refund is made.',
  invalidCode: 'That recovery code was not accepted. Check it carefully and try again. This attempt did not submit a deletion. If an earlier attempt could not be confirmed, access may already have been revoked.',
  expired: 'The sign-in request expired or was already used. Enter the same recovery code again to retry with a fresh request. If an earlier attempt could not be confirmed, access may already have been revoked.',
  rejected: 'The service could not process this request, so it was not completed. This is not necessarily a problem with your code. Reload the page and try again later.',
  noChallenge: 'We could not reach the service, so this attempt did not submit a deletion. Check your connection and try again later. If an earlier attempt could not be confirmed, retry with the same recovery code; access may already have been revoked. The service may not be enabled yet for this rollout.',
  uncertain: 'We could not confirm the deletion. Access may already have been revoked. Retry with the same recovery code to confirm.',
});

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

class RequestFailure extends Error {
  constructor(kind) { super(kind); this.kind = kind; }
}

async function postJson(fetchImpl, path, body, { timeoutMs = TIMEOUT_MS, setTimer = setTimeout, clearTimer = clearTimeout } = {}) {
  const controller = new AbortController();
  const timer = setTimer(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(`${API_BASE}/${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(body),
      credentials: 'omit',
      cache: 'no-store',
      redirect: 'error',
      referrerPolicy: 'no-referrer',
      signal: controller.signal,
    });
    let json = null;
    try { json = await response.json(); } catch { json = null; }
    return { status: response.status, json };
  } catch {
    throw new RequestFailure('network');
  } finally { clearTimer(timer); }
}

function validChallenge(json) {
  return isObject(json) && json.contractVersion === CONTRACT_VERSION && json.authMethod === AUTH_METHOD
    && json.appId === APP_ID && typeof json.challengeId === 'string' && json.challengeId.length === CHALLENGE_LENGTH;
}

function validDeletion(json) {
  return isObject(json) && json.appId === APP_ID && json.contractVersion === CONTRACT_VERSION && json.deleted === true
    && json.status === 'deleted' && json.retentionDays === 30 && typeof json.purgeAfter === 'number' && Number.isFinite(json.purgeAfter);
}

// Resolves to a fixed message key; never exposes server text.
export async function deleteParentAccount(fetchImpl, recoveryCode, options = {}) {
  let challenge;
  try { challenge = await postJson(fetchImpl, 'account/challenge', { appId: APP_ID }, options); } catch { return 'noChallenge'; }
  if (challenge.status !== 200 || !validChallenge(challenge.json)) return 'noChallenge';
  let result;
  try {
    result = await postJson(fetchImpl, 'account/delete', {
      appId: APP_ID, challengeId: challenge.json.challengeId, recoveryCode, confirmation: CONFIRMATION,
    }, options);
  } catch { return 'uncertain'; }
  if (result.status === 200) return validDeletion(result.json) ? 'success' : 'uncertain';
  const error = isObject(result.json) && typeof result.json.error === 'string' ? result.json.error : '';
  if (result.status === 401 && error === 'invalid-recovery-code') return 'invalidCode';
  if ((result.status === 401 || result.status === 400) && EXPIRED_ERRORS.has(error)) return 'expired';
  if (result.status >= 400 && result.status < 500 && result.status !== 408 && result.status !== 429) return 'rejected';
  return 'uncertain';
}

// els: { form, code, confirm, submit, status }. Injected so tests can drive it without a browser.
export function createController(els, fetchImpl, options = {}) {
  let busy = false;
  const say = (text, isError) => {
    els.status.textContent = text;
    if (els.status.setAttribute) els.status.setAttribute('role', isError ? 'alert' : 'status');
  };
  const submit = async event => {
    event?.preventDefault?.();
    if (busy) return;
    let code = String(els.code.value ?? '').trim();
    const confirmed = els.confirm.checked === true;
    if (!code && !confirmed) return say(MESSAGES.missing, true);
    if (!code) return say(MESSAGES.needCode, true);
    if (!confirmed) return say(MESSAGES.needConfirm, true);
    busy = true;
    els.submit.disabled = true;
    say(MESSAGES.busy, false);
    let key = 'uncertain';
    try { key = await deleteParentAccount(fetchImpl, code, options); } catch { key = 'uncertain'; } finally {
      code = '';
      busy = false;
      els.submit.disabled = false;
      els.code.value = '';
      if (key === 'success') els.confirm.checked = false;
    }
    say(MESSAGES[key], key !== 'success');
  };
  const clear = () => { els.code.value = ''; };
  // Controls stay disabled in the markup until the listeners are attached.
  const ready = () => {
    if (els.fieldset) els.fieldset.disabled = false;
    els.status.textContent = '';
  };
  return { submit, clear, ready, get busy() { return busy; } };
}

if (typeof document !== 'undefined') {
  const form = document.getElementById('osa-delete-form');
  if (form) {
    const controller = createController({
      form,
      fieldset: document.getElementById('osa-delete-fieldset'),
      code: document.getElementById('osa-recovery-code'),
      confirm: document.getElementById('osa-delete-confirm'),
      submit: document.getElementById('osa-delete-submit'),
      status: document.getElementById('osa-delete-status'),
    }, (...args) => fetch(...args));
    form.addEventListener('submit', controller.submit);
    window.addEventListener('pagehide', controller.clear);
    controller.ready();
  }
}
