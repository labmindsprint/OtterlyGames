import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { API_BASE, MESSAGES, createController, deleteParentAccount } from '../js/space-academy-delete-account.mjs';

const CHALLENGE = 'c'.repeat(43);
const challengeBody = { contractVersion: 3, authMethod: 'recovery-code-v1', appId: 'space-academy', challengeId: CHALLENGE };
const deletedBody = { appId: 'space-academy', contractVersion: 3, deleted: true, status: 'deleted', retentionDays: 30, purgeAfter: 1790000000000 };
const reply = (status, body) => ({ status, json: async () => { if (body === undefined) throw new SyntaxError('x'); return body; } });

function fakeFetch(...replies) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url, init });
    const next = replies.shift();
    if (next instanceof Error) throw next;
    return next;
  };
  fn.calls = calls;
  return fn;
}

const elements = (code = 'OSA1-SYNTHETIC-CODE', checked = true) => ({
  form: {}, code: { value: code }, confirm: { checked }, submit: { disabled: false }, status: { textContent: '', setAttribute() {} },
});

test('sends the exact two-step request with safe fetch options and the fixed confirmation', async () => {
  const fetchImpl = fakeFetch(reply(200, challengeBody), reply(200, deletedBody));
  assert.equal(await deleteParentAccount(fetchImpl, 'SYNTHETIC'), 'success');
  assert.equal(fetchImpl.calls[0].url, `${API_BASE}/account/challenge`);
  assert.equal(fetchImpl.calls[1].url, 'https://otterly-rank-rqvoeb.azurewebsites.net/api/osa/account/delete');
  assert.deepEqual(JSON.parse(fetchImpl.calls[0].init.body), { appId: 'space-academy' });
  assert.deepEqual(JSON.parse(fetchImpl.calls[1].init.body), {
    appId: 'space-academy', challengeId: CHALLENGE, recoveryCode: 'SYNTHETIC', confirmation: 'delete-parent-purchase-account',
  });
  for (const { url, init } of fetchImpl.calls) {
    assert.equal(init.method, 'POST');
    assert.equal(init.credentials, 'omit');
    assert.equal(init.cache, 'no-store');
    assert.equal(init.redirect, 'error');
    assert.ok(init.signal instanceof AbortSignal);
    assert.doesNotMatch(url, /SYNTHETIC|\?/);
  }
});

test('only a strictly valid deletion response counts as success', async () => {
  const bad = [
    { ...deletedBody, deleted: false }, { ...deletedBody, status: 'pending' }, { ...deletedBody, retentionDays: 7 },
    { ...deletedBody, purgeAfter: '1790000000000' }, { ...deletedBody, contractVersion: 2 }, { ...deletedBody, appId: 'other' }, null, [],
  ];
  for (const body of bad) {
    assert.equal(await deleteParentAccount(fakeFetch(reply(200, challengeBody), reply(200, body)), 'X'), 'uncertain');
  }
  assert.equal(await deleteParentAccount(fakeFetch(reply(200, challengeBody), reply(204, deletedBody)), 'X'), 'uncertain');
});

test('a malformed challenge or unreachable service sends no code and deletes nothing', async () => {
  for (const first of [reply(200, { ...challengeBody, challengeId: 'short' }), reply(200, { ...challengeBody, authMethod: 'x' }),
    reply(200, { ...challengeBody, contractVersion: 2 }), reply(500, challengeBody), new Error('offline')]) {
    const fetchImpl = fakeFetch(first);
    assert.equal(await deleteParentAccount(fetchImpl, 'SECRET'), 'noChallenge');
    assert.equal(fetchImpl.calls.length, 1);
  }
});

test('errors map to fixed messages and never reflect server text', async () => {
  const run = second => deleteParentAccount(fakeFetch(reply(200, challengeBody), second), 'X');
  assert.equal(await run(reply(401, { error: 'invalid-recovery-code' })), 'invalidCode');
  assert.equal(await run(reply(401, { error: 'parent-sign-in-expired-or-used' })), 'expired');
  assert.equal(await run(reply(401, { error: 'something-else' })), 'rejected');
  for (const error of ['deletion-not-confirmed', 'purchase-app-mismatch', 'invalid-request']) {
    assert.equal(await run(reply(400, { error })), 'rejected');
  }
  assert.equal(await run(reply(400, { error: 'invalid-recovery-code' })), 'rejected');
  assert.equal(await run(reply(400, { error: '<img src=x onerror=alert(1)> expired' })), 'rejected');
  assert.equal(await run(reply(410, undefined)), 'rejected');
  assert.equal(await run(reply(429, { error: 'purchase-rate-limit' })), 'uncertain');
  assert.equal(await run(reply(408, {})), 'uncertain');
  for (const error of ['parent-deletion-incomplete', 'parent-deletion-unavailable', 'storage-error']) {
    assert.equal(await run(reply(503, { error })), 'uncertain');
  }
  assert.equal(await run(reply(500, { error: 'boom' })), 'uncertain');
  assert.equal(await run(new Error('timeout')), 'uncertain');
  assert.doesNotMatch(MESSAGES.rejected, /incorrect|not accepted/i);
  assert.doesNotMatch(MESSAGES.expired, /incorrect|not accepted/i);
  assert.match(MESSAGES.uncertain, /could not confirm.*may already have been revoked.*same recovery code/i);
});

test('a hung request is aborted by the timeout', async () => {
  const fetchImpl = (url, init) => new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(new Error('aborted'))));
  assert.equal(await deleteParentAccount(fetchImpl, 'X', { timeoutMs: 5 }), 'noChallenge');
});

test('controller validates input before any network call and clears the code on success', async () => {
  const none = fakeFetch();
  let els = elements('', true);
  let ctl = createController(els, none);
  await ctl.submit({ preventDefault() {} });
  assert.equal(els.status.textContent, MESSAGES.needCode);
  els = elements('CODE', false);
  await createController(els, none).submit();
  assert.equal(els.status.textContent, MESSAGES.needConfirm);
  assert.equal(none.calls.length, 0);

  els = elements();
  const fetchImpl = fakeFetch(reply(200, challengeBody), reply(200, deletedBody));
  await createController(els, fetchImpl).submit();
  assert.equal(els.status.textContent, MESSAGES.success);
  assert.equal(els.code.value, '');
  assert.equal(els.confirm.checked, false);
  assert.equal(els.submit.disabled, false);
});

test('controller blocks double submit while busy and clears the code after every completed submission', async () => {
  const els = elements();
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const fetchImpl = fakeFetch();
  let count = 0;
  const slow = async (...args) => { count++; fetchImpl.calls.push(args); await gate; return reply(200, challengeBody); };
  const ctl = createController(els, slow);
  const first = ctl.submit();
  await ctl.submit();
  assert.equal(els.submit.disabled, true);
  assert.equal(count, 1);
  release();
  await first;
  assert.equal(els.status.textContent, MESSAGES.uncertain);
  assert.equal(els.code.value, '');
  assert.equal(els.submit.disabled, false);
  ctl.clear();
  assert.equal(els.code.value, '');
});

test('page markup follows the privacy and deletion requirements', () => {
  const html = readFileSync(new URL('../space-academy-delete-account.html', import.meta.url), 'utf8');
  assert.match(html, /<link rel="canonical" href="https:\/\/otterlygames\.com\/space-academy-delete-account\.html">/);
  assert.match(html, /<body>/);
  assert.doesNotMatch(html, /data-og-includes/);
  assert.match(html, /<!-- og:nav:start -->[\s\S]*<!-- og:nav:end -->/);
  assert.match(html, /<!-- og:footer:start -->[\s\S]*<!-- og:footer:end -->/);
  assert.equal(html.match(/<script[^>]*includes\.js/g)?.length ?? 0, 1);
  assert.match(html, /<main id="main-content"/);
  assert.match(html, /id="osa-recovery-code"[^>]*type="password"|type="password"[^>]*id="osa-recovery-code"/);
  assert.match(html, /upcoming/i);
  assert.match(html, /href="\/privacy\.html/);
  assert.match(html, /<form[^>]*method="post"[^>]*onsubmit="return false;?"/);
  assert.match(html, /<fieldset id="osa-delete-fieldset" disabled/);
  assert.doesNotMatch(html, /formspree|<form[^>]*method="get"|action="https?:/i);
  const els = elements();
  els.fieldset = { disabled: true };
  createController(els, fakeFetch()).ready();
  assert.equal(els.fieldset.disabled, false);
  const privacy = readFileSync(new URL('../privacy.html', import.meta.url), 'utf8');
  assert.match(privacy, /href="\/space-academy-delete-account\.html"/);
  const csp = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1] ?? '';
  assert.match(csp, /script-src 'self' 'unsafe-hashes' 'sha256-2rvfFrggTCtyF5WOiTri1gDS8Boibj4Njn0e\+VCBmDI='/);
  assert.match(csp, /connect-src 'self' https:\/\/otterly-rank-rqvoeb\.azurewebsites\.net(;|$)/);
  assert.match(csp, /form-action 'none'/);
  assert.doesNotMatch(csp, /unsafe-inline|unsafe-eval|cloudflareinsights/);
  assert.match(privacy, /<strong>Cloudflare:<\/strong>[^]*cloudflareinsights\.com/);
});
