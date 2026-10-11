/* WhatsApp clicks measure intent, not received leads. Analytics loads only after consent. */
(function () {
  'use strict';
  var measurementId = 'G-5VN11ZNR5G';
  var choiceKey = 'wedding-analytics-choice-v1';
  var started = false;
  var params = new URLSearchParams(window.location.search);
  var attribution = {};
  ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].forEach(function(key) {
    var value = params.get(key);
    if(value && /^[a-zA-Z0-9_-]{1,80}$/.test(value)) attribution[key] = value;
  });
  function savedChoice() { try { return localStorage.getItem(choiceKey); } catch(e) { return null; } }
  function saveChoice(value) { try { localStorage.setItem(choiceKey,value); } catch(e) {} }
  function enable() {
    window.weddingAnalyticsConsent = true;
    if(started) { window.gtag('consent','update',{analytics_storage:'granted'}); return; }
    started = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){window.dataLayer.push(arguments);};
    window.gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    window.gtag('consent','update',{analytics_storage:'granted'});
    window.gtag('js',new Date());
    // Strip unknown query parameters and fragments; never send free text/contact fields.
    var safeUrl = new URL(location.origin + location.pathname);
    Object.keys(attribution).forEach(function(k){safeUrl.searchParams.set(k,attribution[k]);});
    window.gtag('config',measurementId,{page_location:safeUrl.href,page_referrer:'',allow_google_signals:false,allow_ad_personalization_signals:false,transport_type:'beacon'});
    var script = document.createElement('script'); script.async=true;
    script.src='https://www.googletagmanager.com/gtag/js?id='+measurementId;
    document.head.appendChild(script);
  }
  var panel=document.createElement('aside');
  panel.setAttribute('aria-label','העדפות מדידה');
  panel.style.cssText='position:fixed;bottom:80px;left:16px;right:16px;z-index:10;max-width:520px;margin:auto;padding:18px;background:#fffaf4;color:#2c2926;border:1px solid #826338;border-radius:12px;box-shadow:0 5px 30px #0003;font:15px/1.6 Arial;text-align:right';
  var description=document.createElement('p');
  description.textContent='אפשר למדוד ביקורים ולחיצות באתר באמצעות Google Analytics ועוגיות כדי לשפר את השירות. המדידה מופעלת רק באישורכם, ואפשר לשנות את הבחירה בכל עת.';
  description.style.cssText='font-size:15px;color:#2c2926;margin:0 0 12px';
  panel.appendChild(description);
  function choiceButton(text,value) {
    var button=document.createElement('button');button.type='button';button.textContent=text;
    button.style.cssText='padding:10px 14px;margin:4px;border:1px solid #826338;border-radius:20px;background:#fff;color:#2c2926;font:15px Arial;cursor:pointer';
    button.addEventListener('click',function(){
      saveChoice(value);
      if(value==='granted') enable();
      else {window.weddingAnalyticsConsent=false;if(started)window.gtag('consent','update',{analytics_storage:'denied'});}
      panel.hidden=true;
    });panel.appendChild(button);
  }
  choiceButton('אישור מדידה','granted');choiceButton('ללא מדידה','denied');
  document.body.appendChild(panel);
  var saved=savedChoice();panel.hidden=saved==='granted'||saved==='denied';
  if(saved==='granted')enable();
  var settings=document.createElement('button');settings.type='button';settings.textContent='העדפות מדידה';
  settings.style.cssText='margin:12px;padding:8px 14px;border:1px solid #826338;border-radius:20px;background:transparent;color:inherit;font:13px Arial;cursor:pointer';
  settings.addEventListener('click',function(){panel.hidden=false;panel.querySelector('button').focus();});
  document.querySelector('footer').appendChild(settings);
  document.querySelectorAll('[data-lead]').forEach(function(link){
    link.addEventListener('click',function(){
      var payload=Object.assign({placement:link.dataset.lead,page:'weddings'},attribution);
      try {
        window.dispatchEvent(new CustomEvent('wedding_whatsapp_click',{detail:payload}));
        if(window.weddingAnalyticsConsent===true && typeof window.gtag==='function')window.gtag('event','wedding_whatsapp_click',payload);
      }catch(e){} // Measurement must not block navigation.
    });
  });
}());