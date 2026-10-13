/* No analytics or external requests in this module. Settings stay on this device. */
(()=>{'use strict';
 const body=document.body,main=document.querySelector('main');if(main&&!main.id)main.id='main-content';
 if(main&&!document.querySelector('.skip,.site-skip')){const skip=document.createElement('a');skip.className='site-skip';skip.href='#'+main.id;skip.textContent='דילוג לתוכן';body.prepend(skip);}
 const footer=document.querySelector('footer')||body.appendChild(document.createElement('footer'));
 const links=document.createElement('nav');links.className='legal-links';links.setAttribute('aria-label','מידע ושירות');
 links.innerHTML='<a href="./accessibility.html">הצהרת נגישות</a><a href="./privacy.html">פרטיות ועוגיות</a><a href="./terms.html">מידע ותנאי שימוש</a><a href="tel:+972502858162">050-285-8162</a>';footer.append(links);
 const launch=document.createElement('button');launch.type='button';launch.className='a11y-launch';launch.textContent='נגישות';launch.setAttribute('aria-haspopup','dialog');
 const d=document.createElement('dialog');d.className='a11y-dialog';d.setAttribute('aria-labelledby','a11y-title');
 d.innerHTML='<h2 id="a11y-title">אפשרויות קריאה ונגישות</h2><div class="a11y-controls"><button type="button" data-action="large">הגדלת טקסט</button><button type="button" data-action="contrast" aria-pressed="false">ניגודיות גבוהה</button><button type="button" data-action="links" aria-pressed="false">הדגשת קישורים</button><button type="button" data-action="motion" aria-pressed="false">הפחתת תנועה</button><button type="button" data-action="reset">איפוס התאמות</button></div><a href="./accessibility.html">הצהרת נגישות ופנייה לעזרה</a><button type="button" data-action="close">סגירה ✕</button>';
 let prefs={scale:1,contrast:false,links:false,motion:false};try{prefs={...prefs,...JSON.parse(localStorage.getItem('dor-reading-v1')||'{}')}}catch(e){}
 function apply(){prefs.scale=Math.max(1,Math.min(1.6,Number(prefs.scale)||1));body.style.setProperty('--reader-scale',prefs.scale);body.classList.toggle('reading-large',prefs.scale>1);['contrast','links','motion'].forEach(k=>{body.classList.toggle('reading-'+k,!!prefs[k]);d.querySelector('[data-action="'+k+'"]').setAttribute('aria-pressed',String(!!prefs[k]));});try{localStorage.setItem('dor-reading-v1',JSON.stringify(prefs))}catch(e){}}
 launch.addEventListener('click',()=>d.showModal());d.addEventListener('close',()=>launch.focus());d.addEventListener('click',e=>{const a=e.target.dataset.action;if(!a)return;if(a==='close'){d.close();return;}if(a==='large')prefs.scale=prefs.scale>=1.6?1:Math.min(1.6,prefs.scale+.2);else if(a==='reset')prefs={scale:1,contrast:false,links:false,motion:false};else prefs[a]=!prefs[a];apply();});body.append(launch,d);apply();
})();
