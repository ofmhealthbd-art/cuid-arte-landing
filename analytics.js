// ============================================================
// Google Analytics 4 — Escuela Cuid-Arte  (G-LQ4M9D3YDW)
// Carga con Consent Mode v2: la analítica queda DENEGADA por
// defecto y solo se concede si el usuario aceptó "todas" las
// cookies en el banner (cookie-consent.js → localStorage
// "cookie_consent" === "all"). RGPD/AEPD compliant.
// ============================================================
(function () {
  'use strict';
  var GA_ID = 'G-LQ4M9D3YDW';

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  gtag('js', new Date());

  // Por defecto, todo denegado hasta que haya consentimiento explícito.
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied'
  });

  // Si en una visita anterior ya aceptó todas, conceder analítica.
  try {
    if (localStorage.getItem('cookie_consent') === 'all') {
      gtag('consent', 'update', { analytics_storage: 'granted' });
    }
  } catch (e) {}

  // Al aceptar "todas" en el banner, conceder analítica al momento.
  document.addEventListener('cookieConsent', function (e) {
    if (e && e.detail && e.detail.value === 'all') {
      gtag('consent', 'update', { analytics_storage: 'granted' });
    }
  });

  gtag('config', GA_ID);

  // Cargar la librería de gtag.
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);
})();
