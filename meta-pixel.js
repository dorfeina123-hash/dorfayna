/* Meta Pixel — loads whenever measurement is on (default on; off only if the visitor chose "ללא מדידה").
   Sends: PageView on load, Contact on a WhatsApp/phone click. No form fields or free text are sent. */
(function () {
  'use strict';
  var PIXEL_ID = 'PASTE_PIXEL_ID_HERE'; // digits only, from Meta Events Manager
  var loaded = false;
  function load() {
    if (loaded || !/^\d{10,20}$/.test(PIXEL_ID)) return;
    loaded = true;
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', PIXEL_ID);
    window.fbq('track', 'PageView');
  }
  function track(name, detail) {
    if (window.weddingAnalyticsConsent !== true || typeof window.fbq !== 'function') return;
    var d = detail || {};
    window.fbq('track', 'Contact', {content_name: name, content_category: d.contact_method || '', placement: d.placement || '', page: d.page || ''});
  }
  window.addEventListener('wedding-consent-granted', load);
  window.addEventListener('wedding_whatsapp_click', function (e) { track('whatsapp', e.detail); });
  window.addEventListener('phone_click', function (e) { track('phone', e.detail); });
  if (window.weddingAnalyticsConsent === true) load();
}());
