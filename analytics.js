// ============================================================
// Google Analytics 4 — Escuela Cuid-Arte  (G-LQ4M9D3YDW)
// Consent Mode v2 BÁSICO (11-sep-2026): la librería gtag/js NO se
// descarga ni se ejecuta `config` hasta que el visitante acepta
// "todas" las cookies en el banner (cookie-consent.js →
// localStorage "cookie_consent" === "all", o el evento
// `cookieConsent` con ese valor). Antes era el modo AVANZADO:
// gtag se cargaba siempre y hacía pings sin cookies a Google
// (IP, user-agent, pantalla, idioma) antes de decidir y tras
// rechazar. Resultado: sin aceptar, 0 peticiones a
// googletagmanager.com y google-analytics.com.
// Se mantiene `consent default denied` + `consent update granted`
// por si algún día se vuelve al modo avanzado.
// ============================================================
(function () {
  'use strict';
  var GA_ID = 'G-LQ4M9D3YDW';
  var gaCargado = false;

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

  // Solo aquí se concede la analítica, se configura la propiedad y se
  // inserta la librería. Antes de esto no sale nada hacia Google.
  function activarGA() {
    if (gaCargado) return;
    gaCargado = true;
    gtag('consent', 'update', { analytics_storage: 'granted' });
    gtag('config', GA_ID);
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }

  // Si en una visita anterior ya aceptó todas, activar ahora.
  try {
    if (localStorage.getItem('cookie_consent') === 'all') activarGA();
  } catch (e) {}

  // Al decidir en el banner: "all" activa; cualquier otra cosa, si la
  // librería ya estaba cargada en esta misma página, vuelve a denegar.
  document.addEventListener('cookieConsent', function (e) {
    var valor = e && e.detail && e.detail.value;
    if (valor === 'all') activarGA();
    else if (gaCargado) gtag('consent', 'update', { analytics_storage: 'denied' });
  });

  // Umami — medición de audiencia sin cookies ni almacenamiento en el
  // terminal (declarada como exenta en la política). Complementa a GA4.
  var u = document.createElement('script');
  u.defer = true;
  u.src = 'https://monitorizacion-umami.pqtiji.easypanel.host/script.js';
  u.setAttribute('data-website-id', 'b37da2c7-c8da-4abd-9713-60606427b38f');
  document.head.appendChild(u);
})();

// ============================================================
// Atribución de origen del lead (UTMs + referrer, first-touch).
// Se construye al cargar y se guarda SOLO EN MEMORIA
// (window.__caAttribution) para que el formulario de admisión y el
// de inscripción al encuentro la adjunten al envío. Sin esto el
// origen se pierde: 54% de leads "sin origen" y la tienda invisible
// pese a originar a la mayoría de alumnas (estudio jul-2026).
// 11-sep-2026: ya NO se escribe en localStorage. El seguimiento de
// campañas no es "estrictamente necesario" para el visitante
// (art. 22.2 LSSI, Guía AEPD) y se escribía antes de decidir en el
// banner y tras rechazar. Ahora el origen solo viaja con la
// solicitud si la persona la envía. La clave antigua
// `ca_attribution`, si existe de una visita anterior, se lee una
// vez como respaldo y se borra.
// ============================================================
(function () {
  'use strict';
  var KEY = 'ca_attribution'; // clave antigua: solo se lee y se borra

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

  var actual = null;
  try {
    // Respaldo único: lo que dejó la versión anterior en localStorage
    // se recoge y se borra. A partir de aquí no se vuelve a escribir.
    var heredado = null;
    try {
      heredado = JSON.parse(localStorage.getItem(KEY) || 'null');
      localStorage.removeItem(KEY);
    } catch (e) {}

    var utm = leerUtms();
    var ref = document.referrer || '';
    // El referrer interno (navegación entre páginas de la propia landing) no es origen.
    try { if (ref && new URL(ref).hostname === window.location.hostname) ref = ''; } catch (e) { ref = ''; }

    var hayDatoNuevo = !!(utm.utm_source || Object.keys(utm).length || ref);
    // First-touch: un UTM real manda; si no lo hay, vale lo heredado; si no, el referrer.
    if (utm.utm_source || (hayDatoNuevo && !(heredado && heredado.canal_detectado))) {
      actual = construir(utm, ref);
    } else if (heredado && heredado.canal_detectado) {
      actual = heredado;
    }
  } catch (e) {}

  window.__caAttribution = actual;

  // API para los formularios: siempre devuelve un objeto con canal_detectado.
  window.getLeadAttribution = function () {
    var d = window.__caAttribution;
    if (d && d.canal_detectado) return d;
    return {
      utm_source: null, utm_medium: null, utm_campaign: null,
      utm_content: null, utm_term: null, referrer: null,
      landing_path: window.location.pathname, canal_detectado: 'directo'
    };
  };
})();
