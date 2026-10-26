// Consent-gated Google Analytics (GA4) using Google Consent Mode v2.
//
// Nothing is sent, and the Google tag is not even loaded, until a visitor agrees to analytics.
// With no measurement ID set this does nothing at all, so it is safe to ship before the client's
// Analytics access arrives.
//
// To switch it on:
//   1. Put the GA4 measurement ID in GA_ID below (G-XXXXXXXXXX).
//   2. Have the cookie consent tool call window.cocosConsent.update() with the visitor's choice,
//      on every page load (consent tools replay a stored choice) and whenever it changes:
//
//        window.cocosConsent.update({ analytics: true, marketing: false });
//
//      Both Consent Pro and Termageddon/Usercentrics can run a snippet on consent; that snippet
//      is the only wiring needed. Until it runs, every category stays denied.
//
// Third parties the consent banner should list as well: Google Maps (stockist finder),
// Cloudflare Turnstile (form spam protection, strictly necessary) and Campaign Monitor
// (newsletter sign-up, only after the visitor submits the form).

const GA_ID = ''; // GA4 measurement ID, e.g. 'G-XXXXXXXXXX'. Empty keeps analytics off.

const DENIED = {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
};

export default function analytics() {
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments); // gtag.js only understands the arguments object
  }

  // Defaults first, before the tag can load, so nothing is stored by accident
  gtag('consent', 'default', { ...DENIED, wait_for_update: 500 });

  let loaded = false;
  function load() {
    if (loaded || !GA_ID) return;
    loaded = true;
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
    document.head.appendChild(script);
    gtag('js', new Date());
    gtag('config', GA_ID);
  }

  window.cocosConsent = {
    update({ analytics: allowAnalytics = false, marketing = false } = {}) {
      const ads = marketing ? 'granted' : 'denied';
      gtag('consent', 'update', {
        analytics_storage: allowAnalytics ? 'granted' : 'denied',
        ad_storage: ads,
        ad_user_data: ads,
        ad_personalization: ads,
      });
      if (allowAnalytics) load();
    },
  };
}
