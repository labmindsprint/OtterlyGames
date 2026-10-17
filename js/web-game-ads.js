(() => {
  'use strict';
  async function loadAd() {
    const container = document.querySelector('[data-web-game-ad]');
    if (!container) return;
    try {
      const response = await fetch('/_data/web-ads.json');
      if (!response.ok) throw new Error(`Advertising configuration unavailable (${response.status})`);
      const config = await response.json();
      if (config.enabled !== true) return;
      if (config.privacySetupVerified !== true || !/^\d+$/.test(config.mathTankSlot)) {
        throw new Error('Website ads require a real AdSense unit and verified privacy/consent setup before enabling.');
      }
      const ad = container.querySelector('ins');
      ad.dataset.adSlot = config.mathTankSlot;
      const observer = new MutationObserver(() => {
        if (ad.dataset.adStatus === 'unfilled') {
          container.hidden = true;
          observer.disconnect();
        }
      });
      observer.observe(ad, { attributes: true, attributeFilter: ['data-ad-status'] });
      container.hidden = false;
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.requestNonPersonalizedAds = 1;
      const script = document.createElement('script');
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5489426086320283';
      script.onerror = () => {
        container.hidden = true;
        observer.disconnect();
        console.warn('[Math Tank] Advertising unavailable; gameplay is unaffected.');
      };
      document.head.append(script);
      window.adsbygoogle.push({});
    } catch (error) {
      container.hidden = true;
      console.error('[Math Tank] Advertising not enabled', error);
    }
  }
  void loadAd();
})();
