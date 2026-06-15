// ============================================================
// Cookie Consent Banner — Cuid-Arte
// AEPD compliant: rechazar tan visible como aceptar
// Guarda decision en localStorage clave "cookie_consent"
// Valores: "all" | "essential" | null (no decidido)
// ============================================================
(function () {
  'use strict';

  var STORAGE_KEY = 'cookie_consent';
  var STORAGE_DATE_KEY = 'cookie_consent_date';

  function getConsent() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function setConsent(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
      localStorage.setItem(STORAGE_DATE_KEY, new Date().toISOString());
    } catch (e) {}
    hideBanner();
    // Si en el futuro se anaden trackers, aqui se cargan condicionalmente:
    // if (value === 'all') { loadAnalytics(); }
    document.dispatchEvent(new CustomEvent('cookieConsent', { detail: { value: value } }));
  }

  function hideBanner() {
    var el = document.getElementById('cuidarte-cookie-banner');
    if (el) el.parentNode.removeChild(el);
  }

  function buildBanner() {
    var div = document.createElement('div');
    div.id = 'cuidarte-cookie-banner';
    div.setAttribute('role', 'dialog');
    div.setAttribute('aria-label', 'Aviso de cookies');
    div.style.cssText = [
      'position:fixed', 'bottom:0', 'left:0', 'right:0', 'z-index:9999',
      'background:#1A2E1A', 'color:#fff',
      'border-top:2px solid #6BA06B',
      'padding:18px 20px',
      'box-shadow:0 -8px 24px rgba(0,0,0,0.18)',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen,Ubuntu,Cantarell,sans-serif',
      'font-size:13px',
      'line-height:1.55'
    ].join(';');
    div.innerHTML = '' +
      '<div style="max-width:1100px;margin:0 auto;display:flex;flex-direction:column;gap:14px;align-items:flex-start">' +
        '<div style="flex:1">' +
          '<strong style="display:block;font-size:14px;margin-bottom:4px">Cookies en Cuid-Arte</strong>' +
          '<span style="opacity:0.9">Usamos cookies propias <strong>tecnicas y necesarias</strong> (sesion, formulario) y, solo si las aceptas, cookies de <strong>analitica</strong> (Google Analytics) para entender como se usa la web y mejorarla. No usamos cookies de publicidad. Puedes leer mas en nuestra ' +
          '<a href="politica-cookies.html" style="color:#CDE8CD;text-decoration:underline">Politica de Cookies</a>.</span>' +
        '</div>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;width:100%;justify-content:flex-end">' +
          '<button id="cuidarte-cookies-reject" type="button" style="cursor:pointer;background:transparent;color:#fff;border:1px solid rgba(255,255,255,0.3);padding:10px 18px;border-radius:999px;font-size:13px;font-weight:600;transition:all 0.2s">Rechazar no esenciales</button>' +
          '<button id="cuidarte-cookies-accept" type="button" style="cursor:pointer;background:#6BA06B;color:#fff;border:1px solid #6BA06B;padding:10px 22px;border-radius:999px;font-size:13px;font-weight:700;transition:all 0.2s">Aceptar todas</button>' +
        '</div>' +
      '</div>';
    return div;
  }

  function showBanner() {
    if (document.getElementById('cuidarte-cookie-banner')) return;
    var banner = buildBanner();
    document.body.appendChild(banner);
    document.getElementById('cuidarte-cookies-accept').addEventListener('click', function () { setConsent('all'); });
    document.getElementById('cuidarte-cookies-reject').addEventListener('click', function () { setConsent('essential'); });
  }

  // API publica para reabrir desde el footer ("Configurar cookies")
  window.cuidarteCookies = {
    open: function () {
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_DATE_KEY);
      } catch (e) {}
      showBanner();
    },
    get: getConsent
  };

  function init() {
    if (getConsent() === null) {
      showBanner();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
