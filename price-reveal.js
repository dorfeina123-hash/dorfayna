(function(){
  'use strict';
  var css='.pr-gated .price,.pr-gated .price-detail,.pr-gated .pr-money{display:none!important}'+
    '.price-reveal{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:46px;margin:6px 0 14px;padding:10px 22px;border:1.5px solid #98763d;border-radius:28px;background:#fff;color:#7a5a2e;font:700 16px/1.2 inherit;font-family:inherit;cursor:pointer}'+
    '.price-reveal:hover,.price-reveal:focus-visible{background:#f6f1ea}'+
    'tr.pr-gated td:not(:first-child),tr.pr-gated th:not(:first-child){color:transparent;text-shadow:0 0 10px #0004;user-select:none}'+
    '.pr-row-btn{min-height:40px;margin:0;padding:6px 14px;font-size:14px}';
  var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

  function track(where){
    try{if(window.weddingAnalyticsConsent===true&&typeof window.gtag==='function')window.gtag('event','price_reveal',{placement:where,page:location.pathname.split('/').pop()||'index.html'});}catch(e){}
  }
  function makeBtn(label){
    var b=document.createElement('button');b.type='button';b.className='price-reveal';b.textContent=label||'הצג מחיר';b.setAttribute('aria-expanded','false');return b;
  }

  // Package cards: hide the price (and album add-on prices) until the visitor asks.
  document.querySelectorAll('.price').forEach(function(p){
    if(p.closest('.dfp'))return;
    var scope=p.closest('.pkg')||p.parentElement;
    if(scope.classList.contains('pr-gated'))return;
    scope.classList.add('pr-gated');
    scope.querySelectorAll('.addon b').forEach(function(b){if(b.textContent.indexOf('₪')>-1)b.classList.add('pr-money');});
    var name=(scope.querySelector('.pkg-name')||{}).textContent||'';
    var btn=makeBtn('הצג מחיר');
    btn.addEventListener('click',function(){scope.classList.remove('pr-gated');btn.remove();track('package:'+name.trim());});
    p.parentNode.insertBefore(btn,p);
  });

  // Comparison table: the price row stays blurred until revealed.
  document.querySelectorAll('tr').forEach(function(tr){
    var first=tr.firstElementChild;
    if(!first||!/^\s*מחיר/.test(first.textContent)||tr.textContent.indexOf('₪')<0)return;
    tr.classList.add('pr-gated');
    var btn=makeBtn('הצג מחיר');btn.classList.add('pr-row-btn');
    btn.addEventListener('click',function(){tr.classList.remove('pr-gated');btn.remove();track('comparison');});
    first.appendChild(document.createElement('br'));first.appendChild(btn);
  });
})();
