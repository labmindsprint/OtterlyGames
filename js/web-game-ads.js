(() => {
  'use strict';

  const containers = [...document.querySelectorAll('[data-editorial-ad], [data-web-game-ad]')];
  if (containers.some(container => container.dataset.webAdInitialized === 'true')) return;
  for (const container of containers) {
    container.hidden = true;
    container.dataset.webAdState = 'ineligible';
  }

  const path = window.location.pathname;
  const isBlogArticle = /^\/blog\/[a-z0-9]+(?:-[a-z0-9]+)*\.html$/.test(path) && path !== '/blog/index.html';
  const isMathTank = path === '/play/math-tank.html';
  const editorialPlacement = isBlogArticle ? 'blogArticleEnd' : path === '/parents/' ? 'parentGuideEnd' : null;
  const candidates = containers.filter(container => isMathTank
    ? container.hasAttribute('data-web-game-ad')
    : editorialPlacement && container.hasAttribute('data-editorial-ad'));
  if (!candidates.length) return;
  for (const container of candidates) container.dataset.webAdInitialized = 'true';

  const publisher = 'ca-pub-5489426086320283';
  const sdkUrl = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisher}`;

  function failure(code, message) {
    return Object.assign(new Error(message), { code });
  }

  function block(error) {
    for (const container of candidates) {
      container.hidden = true;
      container.dataset.webAdState = 'blocked';
      container.dataset.webAdError = error.code || 'configuration-unavailable';
    }
    console.error(`[Website ads] ${error.message}; placements remain hidden.`);
  }

  function isRecord(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  function validateConfig(config) {
    const invalid = message => { throw failure('invalid-configuration', message); };
    if (!isRecord(config)) invalid('Advertising configuration must be an object');
    const keys = ['enabled', 'siteApprovalVerified', 'privacySetupVerified', 'mathTankSlot', 'placements'];
    if (Object.keys(config).some(key => !keys.includes(key))) invalid('Unknown advertising configuration field');
    if (typeof config.enabled !== 'boolean' || typeof config.privacySetupVerified !== 'boolean') {
      invalid('Advertising enabled and privacySetupVerified must be booleans');
    }
    if (config.siteApprovalVerified !== undefined && typeof config.siteApprovalVerified !== 'boolean') {
      invalid('siteApprovalVerified must be a boolean');
    }
    if (typeof config.mathTankSlot !== 'string' || (config.mathTankSlot && !/^\d+$/.test(config.mathTankSlot))) {
      invalid('mathTankSlot must be empty or a numeric unit ID');
    }
    const placements = config.placements === undefined ? {} : config.placements;
    if (!isRecord(placements)) invalid('Advertising placements must be an object');
    for (const [name, placement] of Object.entries(placements)) {
      if (!['blogArticleEnd', 'parentGuideEnd'].includes(name) || !isRecord(placement)) {
        invalid('Only explicit blogArticleEnd and parentGuideEnd editorial placements are supported');
      }
      if (Object.keys(placement).some(key => !['enabled', 'slot', 'paths'].includes(key)) ||
          typeof placement.enabled !== 'boolean' || typeof placement.slot !== 'string' ||
          (placement.slot && !/^\d+$/.test(placement.slot)) || !Array.isArray(placement.paths)) {
        invalid(`${name} requires enabled, an empty or numeric slot, and explicit paths`);
      }
      if (placement.paths.some(route => typeof route !== 'string' || (name === 'parentGuideEnd'
        ? route !== '/parents/'
        : !/^\/blog\/[a-z0-9]+(?:-[a-z0-9]+)*\.html$/.test(route) || route === '/blog/index.html')) ||
          new Set(placement.paths).size !== placement.paths.length) {
        invalid(`${name} paths must be unique, exact routes on that surface`);
      }
      if (placement.enabled && (!placement.slot || !placement.paths.length)) {
        invalid(`${name} cannot be enabled without a unit ID and eligible paths`);
      }
    }
    return placements;
  }

  async function readConfig() {
    const response = await fetch('/_data/web-ads.json', {
      mode: 'same-origin', credentials: 'omit', redirect: 'error', cache: 'no-store',
    });
    if (!response.ok) throw failure('configuration-unavailable', `Advertising configuration unavailable (${response.status})`);
    const config = await response.json();
    validateConfig(config);
    return config;
  }

  function permittedPurpose(data, purpose) {
    const restriction = data.publisher?.restrictions?.[purpose]?.[755];
    if (restriction === 0 || (restriction !== undefined && restriction !== 1 && restriction !== 2)) return false;
    const consent = data.purpose?.consents?.[purpose] === true && data.vendor?.consents?.[755] === true;
    const interest = data.purpose?.legitimateInterests?.[purpose] === true &&
      data.vendor?.legitimateInterests?.[755] === true;
    if (purpose === 1 || restriction === 1) return consent;
    return restriction === 2 ? interest : consent || interest;
  }

  function europeanPermission(data) {
    if (data.cmpStatus === 'error') throw failure('consent-unavailable', 'Google European privacy reporting failed');
    if (data.gdprApplies === false) return true;
    if (data.gdprApplies !== true || data.cmpStatus !== 'loaded' ||
        !['tcloaded', 'useractioncomplete'].includes(data.eventStatus)) return null;
    return data.isServiceSpecific === true && typeof data.tcString === 'string' && !!data.tcString.trim() &&
      data.vendor?.disclosedVendors?.[755] === true && [1, 2, 7, 9, 10].every(purpose => permittedPurpose(data, purpose));
  }

  function usPermission(data) {
    if (data.cmpStatus === 'error') throw failure('consent-unavailable', 'Google US privacy reporting failed');
    if (data.cmpStatus !== 'loaded' || data.signalStatus !== 'ready' || data.cmpDisplayStatus === 'visible') return null;
    if (data.gppVersion !== '1.1' || !Array.isArray(data.applicableSections) || !data.applicableSections.length) {
      throw failure('invalid-consent-data', 'The GPP privacy response is incomplete or unsupported');
    }
    if (data.applicableSections.length === 1 && data.applicableSections[0] === -1) return true;
    if (data.applicableSections.some(id => !Number.isInteger(id) || id < 1) ||
        new Set(data.applicableSections).size !== data.applicableSections.length ||
        typeof data.gppString !== 'string' || !data.gppString.trim()) {
      throw failure('invalid-consent-data', 'The GPP privacy response needs unique sections and a current signal');
    }
    // Google uses US National and Florida messaging; California is also explicitly supported.
    const sections = { 7: ['usnat', 'Sale', 'Sharing', 'TargetedAdvertising'],
      8: ['usca', 'Sale', 'Sharing'], 13: ['usfl', 'Sale', 'TargetedAdvertising'] };
    return data.applicableSections.every(id => {
      const specification = sections[id];
      if (!specification) throw failure('unsupported-privacy-region', `GPP section ${id} has not been reviewed for advertising`);
      const [name, ...choices] = specification;
      const segments = data.parsedSections?.[name];
      if (!Array.isArray(segments) || !segments.length || segments.some(segment => !isRecord(segment))) {
        throw failure('invalid-consent-data', `The ${name} privacy section is missing`);
      }
      const core = segments[0];
      if ((name === 'usnat' ? ![1, 2].includes(core.Version) : core.Version !== 1) ||
          segments.slice(1).some(segment => segment.SubsectionType !== 1 || typeof segment.Gpc !== 'boolean')) {
        throw failure('invalid-consent-data', `The ${name} privacy section version or subsections are unsupported`);
      }
      if (segments.some(segment => segment.Gpc === true)) return false;
      if ((name === 'usnat' && core.SharingNotice !== 1) || (name === 'usfl' && core.ProcessingNotice !== 1)) return false;
      return choices.every(choice => (core[`${choice}OptOutNotice`] === 1 && core[`${choice}OptOut`] === 2) ||
          (core[`${choice}OptOutNotice`] === 0 && core[`${choice}OptOut`] === 0)) &&
        ['SensitiveDataProcessing', 'KnownChildSensitiveDataConsents'].every(field =>
          Array.isArray(core[field]) && core[field].length > 0 && core[field].every(value => value === 0 || value === 2)) &&
        [core.PersonalDataConsents, core.AdditionalDataProcessingConsent].every(value =>
          value === undefined || value === 0 || value === 2);
    });
  }

  function startEditorial(container, settings) {
    const target = container.querySelector('[data-web-ad-unit]');
    const controls = document.createElement('section');
    controls.className = 'ad-privacy-controls';
    controls.setAttribute('aria-label', 'Advertising privacy choices');
    controls.setAttribute('data-ad-privacy-controls', '');
    const status = document.createElement('p');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    const europeanChoices = document.createElement('button');
    europeanChoices.type = 'button';
    europeanChoices.textContent = 'Privacy and cookie settings';
    europeanChoices.hidden = true;
    const keepOff = document.createElement('button');
    keepOff.type = 'button';
    keepOff.textContent = 'Keep ads off on this page';
    const privacy = document.createElement('a');
    privacy.href = '/privacy.html';
    privacy.textContent = 'Privacy policy';
    controls.append(status, europeanChoices, keepOff, privacy);
    container.before(controls);

    let european = null, us = null, sdkReady = false, subscribed = false;
    let europeanReported = false, usReported = false;
    let requested = false, requesting = false, locked = false, terminal = false;
    let observer, bootTimer, fillTimer;

    function pause() {
      if (window.adsbygoogle) window.adsbygoogle.pauseAdRequests = 1;
      observer?.disconnect();
      clearTimeout(fillTimer);
      target.replaceChildren();
      container.hidden = true;
      if (requested) locked = true;
    }

    function state(name, message) {
      container.dataset.webAdState = name;
      status.textContent = message;
    }

    function fail(error) {
      terminal = true;
      pause();
      clearTimeout(bootTimer);
      block(error);
      status.textContent = 'Advertising is unavailable. You can keep reading without ads.';
    }

    const guarded = (callback, privacyOnly = false) => (...args) => {
      if (terminal && !privacyOnly) return;
      try { callback(...args); } catch (error) { fail(error); }
    };

    function allowed() {
      return !terminal && !locked && !document.hidden && navigator.globalPrivacyControl !== true &&
        european === true && us === true;
    }

    async function requestAd() {
      if (!sdkReady || !allowed() || requested || requesting) return;
      requesting = true;
      try {
        // Recheck the kill switch after the potentially long consent interaction.
        const current = await readConfig();
        const placement = current.placements?.[editorialPlacement];
        if (!current.enabled || current.siteApprovalVerified !== true || !current.privacySetupVerified ||
            !placement?.enabled || !placement.paths.includes(path)) {
          locked = true;
          pause();
          state('disabled', 'Advertising has been switched off. You can keep reading.');
          return;
        }
        if (placement.slot !== settings.slot) throw failure('configuration-changed', 'The advertising unit changed while privacy choices were loading');
        if (!allowed()) return;
        const unit = document.createElement('ins');
        unit.className = 'adsbygoogle';
        unit.style.display = 'block';
        unit.dataset.adClient = publisher;
        unit.dataset.adSlot = settings.slot;
        unit.dataset.adFormat = 'auto';
        unit.dataset.fullWidthResponsive = 'true';
        unit.dataset.tagForAgeTreatment = '1';
        unit.dataset.restrictDataProcessing = '1';
        target.append(unit);
        container.hidden = false;
        state('requesting', 'Advertising uses child-directed, non-personalized settings. You can keep ads off on this page.');
        observer = new MutationObserver(guarded(() => {
          if (!allowed()) { pause(); return; }
          if (unit.dataset.adStatus === 'unfilled') {
            pause();
            state('unfilled', 'No advertisement is available. You can keep reading.');
          } else if (unit.dataset.adStatus === 'filled') {
            clearTimeout(fillTimer);
            container.dataset.webAdState = 'filled';
          }
        }));
        observer.observe(unit, { attributes: true, attributeFilter: ['data-ad-status'] });
        requested = true;
        fillTimer = setTimeout(() => fail(failure('ad-unavailable', 'The advertising provider did not return an ad status')), 20000);
        window.adsbygoogle.requestNonPersonalizedAds = 1;
        window.adsbygoogle.pauseAdRequests = 1;
        window.adsbygoogle.push({});
        if (allowed()) window.adsbygoogle.pauseAdRequests = 0;
      } catch (error) {
        fail(error);
      } finally {
        requesting = false;
      }
    }

    function update() {
      if (terminal) return;
      if (navigator.globalPrivacyControl === true) {
        locked = true;
        pause();
        state('browser-optout', 'Ads are off because your browser requests privacy protection.');
      } else if (locked) {
        state('privacy-changed', 'Ads stay off for this page. Google manages saved privacy choices for future visits.');
      } else if (european === false || us === false) {
        pause();
        state('consent-denied', 'Ads are off for your privacy choices. You can keep reading.');
      } else if (european !== true || us !== true || document.hidden) {
        pause();
        state('waiting-consent', 'Ads remain off while Google checks applicable privacy choices.');
      } else {
        void requestAd();
      }
    }

    keepOff.addEventListener('click', () => {
      locked = true;
      pause();
      state('visitor-optout', 'Ads are off for this page. Use Google privacy choices to change saved preferences.');
    });
    europeanChoices.addEventListener('click', guarded(() => {
      locked = true;
      pause();
      state('privacy-changed', 'Ads stay off for this page while you change your Google privacy choices.');
      window.googlefc.callbackQueue.push({ CONSENT_API_READY: guarded(() => window.googlefc.showRevocationMessage(), true) });
    }, true));
    document.addEventListener('visibilitychange', guarded(update));
    window.addEventListener('pagehide', () => {
      pause();
      if (!terminal) state('privacy-changed', 'Ads stay off after leaving this page. Reload to check saved privacy choices again.');
      terminal = true;
      clearTimeout(bootTimer);
    });

    update();
    if (locked) return;
    if (window.adsbygoogle || document.querySelector('script[src*="pagead/js/adsbygoogle.js"]')) {
      fail(failure('unmanaged-provider', 'An advertising SDK already exists outside the guarded placement'));
      return;
    }
    const queue = window.adsbygoogle = [];
    queue.pauseAdRequests = 1;
    queue.requestNonPersonalizedAds = 1;
    window.googlefc = window.googlefc || {};
    window.googlefc.callbackQueue = window.googlefc.callbackQueue || [];
    bootTimer = setTimeout(() => fail(failure('consent-unavailable', 'Google privacy APIs did not become available; operator flags are not visitor consent')), 15000);
    window.googlefc.callbackQueue.push({ CONSENT_API_READY: guarded(() => {
      if (subscribed) return;
      if (typeof window.__tcfapi !== 'function' || typeof window.__gpp !== 'function') {
        throw failure('consent-unavailable', 'Both European and US privacy APIs are required before advertising');
      }
      subscribed = true;
      window.__tcfapi('addEventListener', 2, guarded((data, success) => {
        if (success !== true || !isRecord(data)) throw failure('invalid-consent-data', 'Google European privacy data is unavailable');
        europeanChoices.hidden = data.gdprApplies !== true;
        if (data.gdprApplies === true && typeof window.googlefc.showRevocationMessage !== 'function') {
          throw failure('consent-unavailable', 'The European privacy revision control is unavailable');
        }
        european = europeanPermission(data);
        europeanReported = true;
        if (usReported) clearTimeout(bootTimer);
        update();
      }));
      let revision = 0;
      window.__gpp('addEventListener', guarded((event, success) => {
        if (success !== true || !isRecord(event) || event.eventName === 'error') {
          throw failure('invalid-consent-data', 'Google US privacy updates are unavailable');
        }
        if (event.eventName === 'sectionChange' || (event.eventName === 'signalStatus' && event.data !== 'ready') ||
            (event.eventName === 'cmpDisplayStatus' && event.data === 'visible')) {
          us = null;
          pause();
          update();
        }
        const current = ++revision;
        window.__gpp('ping', guarded((data, ok) => {
          if (current !== revision) return;
          if (ok !== true || !isRecord(data)) throw failure('invalid-consent-data', 'Google US privacy data is unavailable');
          us = usPermission(data);
          usReported = true;
          if (europeanReported) clearTimeout(bootTimer);
          update();
        }));
      }));
    }) });

    const sdk = document.createElement('script');
    sdk.async = true;
    sdk.crossOrigin = 'anonymous';
    sdk.src = sdkUrl;
    sdk.setAttribute('data-privacy-treatments', 'disablePersonalization');
    sdk.onload = guarded(() => { sdkReady = true; update(); });
    sdk.onerror = () => fail(failure('provider-unavailable', 'The advertising and privacy script could not load'));
    document.head.append(sdk);
  }

  async function loadAd() {
    try {
      if (candidates.length !== 1) {
        throw failure('invalid-markup', 'Exactly one advertising placement is permitted on an eligible page');
      }
      const container = candidates[0];
      if (!isMathTank && (container.tagName !== 'ASIDE' ||
          container.closest('article, a, button, form, [role="button"], [role="application"]') ||
          container.querySelectorAll('[data-web-ad-unit]').length !== 1 ||
          container.querySelector('.editorial-ad-label')?.textContent.trim() !== 'Advertisement' ||
          container.querySelector('[data-web-ad-unit]').childElementCount !== 0)) {
        throw failure('invalid-markup', 'The labelled editorial placement must be outside article content and interactive controls');
      }
      container.dataset.webAdState = 'loading';
      const config = await readConfig();
      if (isMathTank && config.enabled && config.mathTankSlot) {
        throw failure('activation-unimplemented',
          'Game advertising activation is not implemented. Editorial provider/site approval and privacy review ' +
          'do not authorize game ads; operator flags are not visitor consent, including denial and withdrawal');
      }
      const placement = config.placements?.[editorialPlacement];
      if (isMathTank || !placement?.paths.includes(path)) {
        container.dataset.webAdState = isMathTank ? 'disabled' : 'ineligible';
        return;
      }
      if (!config.enabled || !placement.enabled) {
        container.dataset.webAdState = 'disabled';
        return;
      }
      if (config.siteApprovalVerified !== true) throw failure('site-not-approved', 'Google site approval must be verified before loading advertising');
      if (!config.privacySetupVerified) throw failure('privacy-not-verified', 'Google privacy setup must be verified; an operator flag is not visitor consent');
      startEditorial(container, placement);
    } catch (error) {
      block(error);
    }
  }

  void loadAd();
})();
