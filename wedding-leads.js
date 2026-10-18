/* WhatsApp clicks measure intent, not received leads. Analytics loads only after consent. */
(function () {
  'use strict';
  var measurementId = 'G-9G009C987J';
  var choiceKey = 'wedding-analytics-choice-v1';
  var started = false;
  var params = new URLSearchParams(window.location.search);
  var attribution = {};
  ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','utm_id','utm_source_platform'].forEach(function(key) {
    var value = params.get(key);
    if(value && /^[a-zA-Z0-9_-]{1,80}$/.test(value)) attribution[key] = value;
  });
  function savedChoice() { try { return localStorage.getItem(choiceKey); } catch(e) { return null; } }
  function saveChoice(value) { try { localStorage.setItem(choiceKey,value); } catch(e) {} }
  function enable() {
    window['ga-disable-'+measurementId]=false;
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
    // Keep Google's auto-tagging identifier in the consented page URL only.
    // Do not persist it ourselves or copy it into contact links/custom events.
    var clickId = params.get('gclid');
    if(clickId && /^[a-zA-Z0-9_-]{1,512}$/.test(clickId)) safeUrl.searchParams.set('gclid',clickId);
    // Preserve search/referral attribution without forwarding query strings or private paths.
    var safeReferrer='';
    try { if(document.referrer) { var ref=new URL(document.referrer); if(/^https?:$/.test(ref.protocol)) safeReferrer=ref.origin+(ref.origin===location.origin?ref.pathname:'/'); } } catch(e) {}
    window.gtag('config',measurementId,{page_location:safeUrl.href,page_referrer:safeReferrer,allow_google_signals:false,allow_ad_personalization_signals:false,transport_type:'beacon'});
    var script = document.createElement('script'); script.async=true;
    script.src='https://www.googletagmanager.com/gtag/js?id='+measurementId;
    document.head.appendChild(script);
  }
  var panel=document.createElement('aside');
  panel.setAttribute('aria-label','העדפות מדידה');
  panel.style.cssText='position:fixed;bottom:80px;left:16px;right:16px;z-index:70;max-height:50dvh;overflow:auto;max-width:520px;margin:auto;padding:18px;background:#fffaf4;color:#2c2926;border:1px solid #826338;border-radius:12px;box-shadow:0 5px 30px #0003;font:15px/1.6 Arial;text-align:right';
  var description=document.createElement('p');
  description.textContent='אפשר למדוד ביקורים ולחיצות באתר באמצעות Google Analytics ועוגיות כדי לשפר את השירות. המדידה מופעלת רק באישורכם, ואפשר לשנות את הבחירה בכל עת.';
  description.style.cssText='font-size:15px;color:#2c2926;margin:0 0 12px';
  panel.appendChild(description);
  var privacy=document.createElement('a');privacy.href='./privacy.html';privacy.textContent='פרטיות, עוגיות והשימוש במידע';privacy.style.cssText='display:block;color:#184d36;text-decoration:underline;margin-bottom:12px';panel.appendChild(privacy);
  function choiceButton(text,value) {
    var button=document.createElement('button');button.type='button';button.textContent=text;
    button.style.cssText='padding:10px 14px;margin:4px;border:1px solid #826338;border-radius:20px;background:#fff;color:#2c2926;font:15px Arial;cursor:pointer';
    button.addEventListener('click',function(){
      saveChoice(value);
      if(value==='granted') enable();
      else {window.weddingAnalyticsConsent=false;window['ga-disable-'+measurementId]=true;
        if(started)window.gtag('consent','update',{analytics_storage:'denied'});
        document.cookie.split(';').forEach(function(item){var key=item.split('=')[0].trim();if(/^_ga(?:_|$)/.test(key)){['/','/dorfayna','/dorfayna/'].forEach(function(path){document.cookie=key+'=; Max-Age=0; path='+path;document.cookie=key+'=; Max-Age=0; path='+path+'; domain='+location.hostname;});}});
        if(started){location.reload();return;}}

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
  (document.querySelector('footer')||document.body).appendChild(settings);
  document.querySelectorAll('[data-lead],a[href^="https://wa.me/"],a[href^="tel:"]').forEach(function(link){
    link.addEventListener('click',function(){
      var section=link.closest('section');
      var placement=link.dataset.lead||(link.classList.contains('sticky-bar')?'sticky':section&&section.id||'navigation');
      var page=location.pathname.split('/').pop()||'index.html';
      var phone=link.getAttribute('href').indexOf('tel:')===0;
      var eventName=phone?'phone_click':'wedding_whatsapp_click';
      var payload=Object.assign({placement:placement,page:page,contact_method:phone?'phone':'whatsapp'},attribution);
      try {
        window.dispatchEvent(new CustomEvent(eventName,{detail:payload}));
        if(window.weddingAnalyticsConsent===true && typeof window.gtag==='function')window.gtag('event',eventName,payload);
      }catch(e){} // Measurement must not block navigation.
    });
  });
}());
