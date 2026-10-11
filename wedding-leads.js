/* Clicks indicate intent, not received leads. No analytics vendor or personal data is loaded here. */
(function () {
  'use strict';
  var params = new URLSearchParams(window.location.search);
  var attribution = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (key) {
    var value = params.get(key);
    // Accept only campaign labels; never forward free text or contact details.
    if (value && /^[a-zA-Z0-9_-]{1,80}$/.test(value)) attribution[key] = value;
  });
  document.querySelectorAll('[data-lead]').forEach(function (link) {
    link.addEventListener('click', function () {
      var payload = Object.assign({placement: link.dataset.lead, page: 'weddings'}, attribution);
      try {
        window.dispatchEvent(new CustomEvent('wedding_whatsapp_click', {detail: payload}));
        // Only forward to an existing, explicitly consented integration.
        if (window.weddingAnalyticsConsent === true && typeof window.gtag === 'function') {
          window.gtag('event', 'wedding_whatsapp_click', payload);
        }
      } catch (error) { /* Analytics must never interrupt the WhatsApp link. */ }
    });
  });
}());
