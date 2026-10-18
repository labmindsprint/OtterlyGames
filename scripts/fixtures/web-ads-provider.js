// Intercepted test provider only. Never load this fixture from a production page.
(() => {
  const options = window.__webAdFixtureOptions || {};
  const national = options.region === 'usnat';
  const california = options.region === 'usca';
  const florida = options.region === 'usfl';
  const us = national || california || florida;
  const core = {
    Version: national ? 2 : 1, SharingNotice: 1, ProcessingNotice: 1,
    SaleOptOutNotice: 1, SaleOptOut: 2, SharingOptOutNotice: 1, SharingOptOut: 2,
    TargetedAdvertisingOptOutNotice: 1, TargetedAdvertisingOptOut: 2,
    SensitiveDataProcessing: Array(national ? 16 : california ? 9 : 8).fill(0),
    KnownChildSensitiveDataConsents: Array(california ? 2 : 3).fill(0),
    PersonalDataConsents: 0, AdditionalDataProcessingConsent: 0,
  };
  const fixture = window.__webAdFixture = {
    tcf: options.tcf !== undefined ? options.tcf : (options.region === 'eu' ? {
      gdprApplies: true, cmpStatus: 'loaded', eventStatus: 'tcloaded', isServiceSpecific: true,
      tcString: 'TEST_ONLY_NOT_A_REAL_TC_STRING',
      purpose: { consents: { 1: true }, legitimateInterests: { 2: true, 7: true, 9: true, 10: true } },
      vendor: { consents: { 755: true }, legitimateInterests: { 755: true }, disclosedVendors: { 755: true } },
    } : { gdprApplies: false }),
    gpp: options.gpp !== undefined ? options.gpp : {
      gppVersion: '1.1', cmpStatus: 'loaded', cmpDisplayStatus: 'hidden', signalStatus: 'ready',
      applicableSections: us ? [national ? 7 : california ? 8 : 13] : [-1],
      gppString: us ? 'TEST_ONLY_NOT_A_REAL_GPP_STRING' : '',
      parsedSections: us ? { [options.region]: [core] } : {},
    },
    pushes: 0, requests: [], revocations: 0, pending: [],
  };
  const tcfListeners = [], gppListeners = [];
  fixture.changeTcf = data => {
    fixture.tcf = data;
    for (const callback of tcfListeners) callback(data, true);
  };
  fixture.changeGpp = (data, eventName = 'sectionChange') => {
    fixture.gpp = data;
    for (const callback of gppListeners) callback({ eventName, data: data.signalStatus, pingData: data }, true);
  };
  if (!options.missingTcf) window.__tcfapi = (command, version, callback) => {
    if (command !== 'addEventListener' || version !== 2) throw new Error('Unexpected TCF command/version');
    tcfListeners.push(callback);
    if (!options.hangTcf) callback(fixture.tcf, !options.tcfError);
  };
  if (!options.missingGpp) window.__gpp = (command, callback) => {
    if (command === 'addEventListener') {
      gppListeners.push(callback);
      callback({ eventName: 'listenerRegistered', data: true, listenerId: gppListeners.length }, true);
    } else if (command === 'ping') {
      if (!options.hangGpp) callback(fixture.gpp, !options.gppError);
    } else {
      throw new Error('Unexpected GPP command');
    }
  };
  window.googlefc.showRevocationMessage = () => {
    fixture.revocations++;
    fixture.changeTcf({ ...fixture.tcf, eventStatus: 'cmpuishown' });
  };

  const queue = window.adsbygoogle;
  fixture.bootstrap = { paused: queue.pauseAdRequests, nonPersonalized: queue.requestNonPersonalizedAds };
  let paused = queue.pauseAdRequests;
  function fill(unit) {
    fixture.requests.push({ ...unit.dataset, nonPersonalized: queue.requestNonPersonalizedAds });
    if (options.fill === 'pending') return;
    unit.setAttribute('data-ad-status', options.fill === 'unfilled' ? 'unfilled' : 'filled');
    if (options.fill !== 'unfilled') {
      const frame = document.createElement('iframe');
      frame.title = 'Mock contextual advertisement';
      frame.style.width = '100%';
      frame.style.height = '120px';
      frame.style.border = '0';
      frame.srcdoc = '<body style="color:#b2b2c8;font:14px system-ui"><p>Local test advertisement. No Google request was made.</p></body>';
      unit.append(frame);
    }
  }
  Object.defineProperty(queue, 'pauseAdRequests', {
    get: () => paused,
    set(value) {
      paused = value;
      if (value === 0) for (const unit of fixture.pending.splice(0)) fill(unit);
    },
  });
  queue.push = () => {
    fixture.pushes++;
    if (options.pushError) throw new Error('Mock provider rejected the ad request');
    const unit = document.querySelector('[data-web-ad-unit] > ins');
    if (!unit) throw new Error('Missing manual ad unit');
    if (paused === 1) fixture.pending.push(unit);
    else fill(unit);
  };
  if (us) {
    const link = document.createElement('button');
    link.type = 'button';
    link.textContent = 'Do not sell or share my personal information';
    link.setAttribute('data-mock-google-dns-link', '');
    link.addEventListener('click', () => {
      const changed = JSON.parse(JSON.stringify(fixture.gpp));
      changed.parsedSections[options.region][0].SaleOptOut = 1;
      fixture.changeGpp(changed);
    });
    document.body.append(link);
  }
  const callbacks = window.googlefc.callbackQueue;
  const ready = entry => entry.CONSENT_API_READY?.();
  const pendingCallbacks = callbacks.splice(0);
  callbacks.push = entry => { ready(entry); return 1; };
  if (!options.noApiReady) for (const entry of pendingCallbacks) ready(entry);
})();
