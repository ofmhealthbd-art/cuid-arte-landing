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

  // Umami — analítica sin cookies (no requiere consentimiento). Complementa a GA4.
  var u = document.createElement('script');
  u.defer = true;
  u.src = 'https://monitorizacion-umami.pqtiji.easypanel.host/script.js';
  u.setAttribute('data-website-id', 'b37da2c7-c8da-4abd-9713-60606427b38f');
  document.head.appendChild(u);
})();

// ============================================================
// Atribución de origen del lead (UTMs + referrer, first-touch).
// Guarda en localStorage el PRIMER origen conocido de la visita
// para que el formulario de admisión lo envíe con el lead
// (submit_landing_lead). Sin esto el origen se pierde: 54% de
// leads "sin origen" y la tienda invisible pese a originar a la
// mayoría de alumnas (estudio jul-2026).
// Solo almacenamiento propio, sin terceros ni identificadores de
// persona: no requiere consentimiento de cookies (como Umami).
// ============================================================
(function () {
  'use strict';
  var KEY = 'ca_attribution';

  function leerUtms() {
    var p = new URLSearchParams(window.location.search);
    var utm = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) {
      var v = p.get(k);
      if (v) utm[k] = v.slice(0, 200);
    });
    // Click-ids de plataformas: si no hay utm_source explícito, delatan el canal.
    if (!utm.utm_source) {
      if (p.get('fbclid')) { utm.utm_source = 'facebook-instagram'; utm.utm_medium = utm.utm_medium || 'paid'; }
      else if (p.get('gclid')) { utm.utm_source = 'google'; utm.utm_medium = utm.utm_medium || 'paid'; }
    }
    return utm;
  }

  function canalDetectado(utmSource, referrer) {
    if (utmSource) {
      var s = utmSource.toLowerCase();
      if (s.indexOf('insta') >= 0 || s === 'ig') return 'instagram';
      if (s.indexOf('tienda') >= 0 || s.indexOf('ofm') >= 0 || s.indexOf('shop') >= 0) return 'tienda-ofm';
      return s;
    }
    var host = '';
    try { host = referrer ? new URL(referrer).hostname.replace(/^www\./, '') : ''; } catch (e) {}
    if (!host) return 'directo';
    if (host.indexOf('ofm-health') >= 0) return 'tienda-ofm';
    if (host.indexOf('instagram') >= 0) return 'instagram';
    if (host.indexOf('facebook') >= 0 || host === 'fb.com' || host === 'fb.me') return 'facebook';
    if (host.indexOf('odilefernandez') >= 0) return 'blog-odile';
    if (host.indexOf('youtube') >= 0 || host === 'youtu.be') return 'youtube';
    if (host === 't.me' || host.indexOf('telegram') >= 0) return 'telegram';
    if (host.indexOf('whatsapp') >= 0 || host === 'wa.me') return 'whatsapp';
    if (host.indexOf('google.') >= 0 || host.indexOf('bing.') >= 0 || host.indexOf('duckduckgo') >= 0) return 'buscador';
    return 'referral:' + host;
  }

  function construir(utm, referrer) {
    var data = {
      utm_source: utm.utm_source || null,
      utm_medium: utm.utm_medium || null,
      utm_campaign: utm.utm_campaign || null,
      utm_content: utm.utm_content || null,
      utm_term: utm.utm_term || null,
      referrer: referrer ? referrer.slice(0, 500) : null,
      landing_path: window.location.pathname,
      first_seen_at: new Date().toISOString()
    };
    data.canal_detectado = canalDetectado(data.utm_source, data.referrer);
    return data;
  }

  try {
    var utm = leerUtms();
    var ref = document.referrer || '';
    // El referrer interno (navegación entre páginas de la propia landing) no es origen.
    try { if (ref && new URL(ref).hostname === window.location.hostname) ref = ''; } catch (e) { ref = ''; }

    var guardado = null;
    try { guardado = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}

    var hayDatoNuevo = !!(utm.utm_source || Object.keys(utm).length || ref);
    // First-touch: solo se escribe si no había nada, o si llega un UTM real
    // y lo guardado era solo referrer/directo (el UTM es señal más fuerte).
    if ((!guardado && hayDatoNuevo) || (utm.utm_source && guardado && !guardado.utm_source)) {
      localStorage.setItem(KEY, JSON.stringify(construir(utm, ref)));
    }
  } catch (e) {}

  // API para el formulario: siempre devuelve un objeto con canal_detectado.
  window.getLeadAttribution = function () {
    try {
      var d = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (d && d.canal_detectado) return d;
    } catch (e) {}
    return {
      utm_source: null, utm_medium: null, utm_campaign: null,
      utm_content: null, utm_term: null, referrer: null,
      landing_path: window.location.pathname, canal_detectado: 'directo'
    };
  };
})();
