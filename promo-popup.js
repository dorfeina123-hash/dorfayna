(function(){
  'use strict';
  var KEY='df_promo_seen_v1', DAY=86400000;
  function seenRecently(){try{return sessionStorage.getItem(KEY)==='1';}catch(e){return false;}}
  function markSeen(){try{sessionStorage.setItem(KEY,'1');}catch(e){}}
  if(seenRecently())return;
  var WA='https://wa.me/972502858162?text='+encodeURIComponent('היי דור, ראיתי באתר את המבצע על החבילות. אשמח לבדוק זמינות. תאריך כולל שנה: __, מקום: __');
  var css='.dfp-back{position:fixed;inset:0;background:rgba(20,16,10,.62);z-index:9998;display:flex;align-items:center;justify-content:center;padding:16px;opacity:0;transition:opacity .35s}'+
  '.dfp-back.on{opacity:1}'+
  '.dfp{position:relative;background:#fff;max-width:400px;width:100%;max-height:92vh;overflow:auto;border-radius:10px;box-shadow:0 18px 50px rgba(0,0,0,.35);direction:rtl;text-align:right;font-family:Assistant,Arial,sans-serif;transform:translateY(24px) scale(.97);transition:transform .45s cubic-bezier(.2,.8,.2,1)}'+
  '.dfp-back.on .dfp{transform:none}'+
  '.dfp img{display:block;width:100%;height:190px;object-fit:cover}'+
  '.dfp-ribbon{position:absolute;top:14px;right:14px;background:#98763d;color:#fff;font-weight:700;font-size:14px;padding:6px 12px;border-radius:20px}'+
  '.dfp-x{position:absolute;top:10px;left:10px;width:36px;height:36px;border-radius:50%;border:0;background:rgba(255,255,255,.92);font-size:22px;line-height:36px;cursor:pointer;color:#222}'+
  '.dfp-body{padding:18px 22px 22px}'+
  '.dfp h2{margin:0 0 4px;font-size:24px;color:#2a2418}'+
  '.dfp .dfp-sub{margin:0 0 12px;color:#6b6252;font-size:15px}'+
  '.dfp ul{list-style:none;margin:0 0 14px;padding:0}'+
  '.dfp li{padding:5px 0;font-size:15px;color:#333;border-bottom:1px solid #eee6d6}'+
  '.dfp li:before{content:"✓";color:#98763d;margin-left:8px;font-weight:700}'+
  '.dfp-price{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin:6px 0 14px}'+
  '.dfp-price s{color:#8a8172;font-size:16px}'+
  '.dfp-price b{font-size:32px;color:#2a2418}'+
  '.dfp-price span{font-size:13px;color:#6b6252}'+
  '.dfp-cta{display:flex;justify-content:center;align-items:center;gap:8px;min-height:50px;background:#25a244;color:#fff!important;border-radius:28px;font-weight:700;font-size:17px;text-decoration:none}'+
  '.dfp-more{display:block;text-align:center;margin-top:10px;color:#98763d;font-size:15px}'+
  '.dfp-note{margin:10px 0 0;font-size:12px;color:#8a8172;text-align:center}'+
  '.dfp-foot{position:sticky;bottom:0;background:#fff;padding:6px 0 4px;box-shadow:0 -10px 14px -10px rgba(0,0,0,.18)}.dfp .dfp-sub strong{color:#2a2418}'+
  '@media (max-width:480px){.dfp img{height:110px}.dfp-body{padding:14px 18px 16px}.dfp h2{font-size:21px}.dfp .dfp-sub{margin-bottom:6px;font-size:14px}.dfp li{padding:4px 0;font-size:13.5px;line-height:1.45}.dfp-price{margin:2px 0 8px}.dfp-price b{font-size:28px}.dfp-note{display:none}}'+
  '@media (prefers-reduced-motion:reduce){.dfp-back,.dfp{transition:none}}';
  function open(){
    if(document.querySelector('.dfp-back'))return;
    markSeen();
    var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
    var last=document.activeElement;
    var back=document.createElement('div');back.className='dfp-back';
    back.innerHTML='<div class="dfp" role="dialog" aria-modal="true" aria-labelledby="dfp-t">'+
      '<img src="./assets/site/4dfb930b461788c8-960.webp" alt="חתן וכלה בצילומי זוגיות, צילום חתונה של דור פיינה" width="960" height="640">'+
      '<span class="dfp-ribbon">מבצע: 2,000 ₪ הנחה</span>'+
      '<button class="dfp-x" type="button" aria-label="סגירת החלון">×</button>'+
      '<div class="dfp-body"><h2 id="dfp-t">חבילת Premium לחתונה</h2>'+
      '<p class="dfp-sub"><strong>סטילס, וידאו וכל העריכות + סט 3 אלבומים</strong> · כולל רחפן בתנאי הטסה</p>'+
      '<ul><li>צלם סטילס מההכנות וצלם סטילס נוסף מצילומי המשפחות באולם</li>'+
      '<li>צלם וידאו מההכנות, בצילום בשתי מצלמות</li>'+
      '<li>צילומי רחפן, בכפוף לאפשרות הטסה חוקית ובטוחה ולתנאי המקום ומזג האוויר</li>'+
      '<li>ליווי מההכנות ועד סיום הצילום בשעות שסוכמו בהצעה</li>'+
      '<li>כל התמונות בעריכה מקצועית, בגלריה דיגיטלית פרטית — לצפייה, הורדה ושיתוף עם האורחים והחברים, כולל ברשתות</li>'+
      '<li>הפקת וידאו מלאה: סרט ארוך, סרט מקוצר, קליפ היילייטס ו‑REELS לרשתות</li>'+
      '<li><strong>אלבום זוגי ושני אלבומי הורים כלולים</strong> — אלבום זוגי 30×60 ס״מ + 2 אלבומי הורים 20×40 ס״מ</li></ul>'+
      '<div class="dfp-foot"><div class="dfp-price"><s>מחיר רגיל: 11,500 ₪</s><b>9,500 ₪</b><span>כולל מע״מ</span></div>'+
      '<a class="dfp-cta" data-lead="promo-popup" href="'+WA+'" target="_blank" rel="noopener">לבדיקת זמינות לתאריך בוואטסאפ</a></div>'+
      '<a class="dfp-more" href="./weddings-prices.html#packages">לכל החבילות והמחירים לאחר הנחה ←</a>'+
      '<p class="dfp-note">בדיקת זמינות אישית. שמירת תאריך רק לאחר סיכום הצעה.</p></div></div>';
    document.body.appendChild(back);
    requestAnimationFrame(function(){back.classList.add('on');});
    var x=back.querySelector('.dfp-x');x.focus();
    function close(){back.classList.remove('on');document.removeEventListener('keydown',key);setTimeout(function(){back.remove();if(last&&last.focus)last.focus();},350);}
    function key(e){if(e.key==='Escape')close();
      if(e.key==='Tab'){var f=back.querySelectorAll('a,button');var a=f[0],z=f[f.length-1];
        if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus();}
        else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus();}}}
    x.addEventListener('click',close);
    back.querySelector('.dfp-cta').addEventListener('click',function(){try{if(typeof window.gtag==='function')window.gtag('event','wedding_whatsapp_click',{placement:'promo-popup',contact_method:'whatsapp'});}catch(e){}});
    back.addEventListener('click',function(e){if(e.target===back)close();});
    document.addEventListener('keydown',key);
  }
  setTimeout(open,10000);
})();
