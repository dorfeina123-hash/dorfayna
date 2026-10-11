/** Free, single-owner signing backend. Only doGet/rpc are public entry points. */
function doGet(e) {
  const token = e && e.parameter && e.parameter.s || '';
  if (token && !/^[a-f0-9]{64}$/.test(token)) return HtmlService.createHtmlOutput('הקישור אינו תקף');
  const page = HtmlService.createTemplateFromFile('Index');
  page.bootstrap = JSON.stringify({token:token,logo:LOGO_WHITE_}).replace(/</g,'\\u003c');
  page.styles = HtmlService.createHtmlOutputFromFile('Styles').getContent();
  page.body = HtmlService.createHtmlOutputFromFile(token?'Client':'Owner').getContent();
  return page.evaluate().setTitle('דור פיינה | הסכמים').addMetaTag('viewport','width=device-width, initial-scale=1');
}

function rpc(request) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return {ok:false,error:'המערכת עסוקה. נסו שוב בעוד רגע.'};
  try {
    if (!request || JSON.stringify(request).length > 350000) fail_('הבקשה אינה תקינה');
    rate_('global',100,600);
    const action = request.action, data=request.data || {};
    if (action === 'login') return {ok:true,data:login_(data.password)};
    if (['list','create','preview','revoke','ownerPdf','logout'].includes(action)) {
      admin_(request.session);
      if(action === 'logout') {CacheService.getScriptCache().remove('session:'+hash_(request.session));return {ok:true,data:{}};}
      if(action === 'list') return {ok:true,data:list_()};
      if(action === 'preview') return {ok:true,data:snapshot_(data)};
      if(action === 'create') return {ok:true,data:create_(data)};
      const record=recordById_(data.id);
      if(action === 'ownerPdf') return {ok:true,data:pdfDownload_(record)};
      if(record.data.status !== 'pending') fail_('ניתן לבטל רק הסכם הממתין לחתימה');
      record.data.status='revoked';save_(record);return {ok:true,data:{}};
    }
    const record = agreement_(request.token,action === 'view' || action === 'pdf');
    if(action === 'view') return {ok:true,data:view_(record.data)};
    if(action === 'code') return {ok:true,data:sendCode_(record,request.token)};
    if(action === 'complete') return {ok:true,data:complete_(record,request.token,data)};
    if(action === 'pdf') return {ok:true,data:pdfDownload_(record)};
    fail_('פעולה לא מוכרת');
  } catch(e) {
    // Never return Google service errors, file IDs or stack traces to visitors.
    return {ok:false,error:e && e.userMessage || 'הפעולה לא הושלמה. פנו לדור; אין לשלוח שוב לפני בדיקת המצב.'};
  } finally {lock.releaseLock();}
}

function fail_(message) {const e=new Error(message);e.userMessage=message;throw e;}
function props_() {return PropertiesService.getScriptProperties();}
function owner_() {return props_().getProperty('OWNER_EMAIL') || 'mmdorldor@gmail.com';}
function hash_(s) {return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(s),Utilities.Charset.UTF_8).map(b=>('0'+(b&255).toString(16)).slice(-2)).join('');}
function random_() {return (Utilities.getUuid()+Utilities.getUuid()).replace(/-/g,'');}
function equal_(a,b) {a=hash_(a);b=hash_(b);let diff=0;for(let i=0;i<64;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;}
function rate_(key,max,seconds) {
  const cache=CacheService.getScriptCache(), k='rate:'+hash_(key), now=Date.now();
  let state=JSON.parse(cache.get(k)||'null');if(!state||now-state.at>seconds*1000)state={at:now,n:0};
  if(state.n>=max)fail_('נסו שוב מאוחר יותר');state.n++;cache.put(k,JSON.stringify(state),seconds);
}
function login_(password) {
  rate_('login',10,600);
  const configured=props_().getProperty('ADMIN_PASSWORD') || '';
  if(configured.length<20)fail_('יש להשלים את הגדרת סיסמת הניהול בחשבון Google');
  if(typeof password!=='string'||password.length>200||!equal_(password,configured))fail_('פרטי הכניסה אינם נכונים');
  const token=random_();CacheService.getScriptCache().put('session:'+hash_(token),'owner',21600);
  return {session:token};
}
function admin_(session) {
  if(typeof session!=='string'||!CacheService.getScriptCache().get('session:'+hash_(session)))fail_('נדרשת כניסה מחדש');
}
function folder_() {
  const id=props_().getProperty('DATA_FOLDER_ID');if(!id)fail_('יש להשלים את הגדרת תיקיית ההסכמים');
  const folder=DriveApp.getFolderById(id);
  if(folder.getSharingAccess()!==DriveApp.Access.PRIVATE)fail_('תיקיית ההסכמים חייבת להיות פרטית');
  return folder;
}
// Run only in the Apps Script editor after setting ADMIN_PASSWORD in Script Properties.
// Trailing underscore blocks google.script.run access to this setup function.
function setup_() {
  if(Session.getEffectiveUser().getEmail().toLowerCase()!==owner_().toLowerCase())fail_('יש להפעיל מהחשבון '+owner_());
  if((props_().getProperty('ADMIN_PASSWORD')||'').length<20)fail_('יש להגדיר ADMIN_PASSWORD עם 20 תווים לפחות');
  if(!props_().getProperty('DATA_FOLDER_ID'))props_().setProperty('DATA_FOLDER_ID',DriveApp.createFolder('Dor Fayna - הסכמים פרטיים').getId());
  folder_();MailApp.getRemainingDailyQuota();
  return 'ההגדרות נשמרו. לא נשלח מייל.';
}
function mailReady_() {
  if(Session.getEffectiveUser().getEmail().toLowerCase()!==owner_().toLowerCase())fail_('המערכת הופעלה מחשבון Google שונה מחשבון העסק');
  return MailApp.getRemainingDailyQuota();
}
function recordById_(id) {
  if(typeof id!=='string'||!/^[a-f0-9]{64}$/.test(id))fail_('הקישור אינו תקף');
  const files=folder_().getFilesByName(id+'.json');if(!files.hasNext())fail_('הקישור אינו תקף');
  const file=files.next();return {file:file,data:JSON.parse(file.getBlob().getDataAsString('UTF-8'))};
}
function save_(r) {r.file.setContent(JSON.stringify(r.data));}
function agreement_(token,signedAllowed) {
  if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))fail_('הקישור אינו תקף');
  const r=recordById_(hash_(token)),d=r.data;
  if(d.status==='revoked')fail_('הקישור בוטל');
  if(Date.now()>d.expires)fail_('הקישור פג תוקף. פנו לדור');
  if(d.status==='preparing')fail_('ההסכם בטיפול ונדרשת בדיקה של דור');
  if(d.status==='signed'&&!signedAllowed)fail_('ההסכם כבר נחתם');return r;
}
function text_(value,max,label,min) {
  if(typeof value!=='string'||value.trim().length<(min||0)||value.length>max)fail_('יש לבדוק '+label);return value.trim();
}
function cents_(value,max) {
  if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>max||Math.abs(value*100-Math.round(value*100))>0.00001)fail_('יש לבדוק את המחירים');return Math.round(value*100);
}
function money_(cents) {return (cents/100).toLocaleString('he-IL',{minimumFractionDigits:2,maximumFractionDigits:2})+' ₪';}
function snapshot_(o) {
  const customer=text_(o.customer,120,'שם לקוח',2),email=text_(o.email,254,'מייל',5),phone=text_(o.phone,30,'טלפון',6),venue=text_(o.venue,200,'מקום',2);
  if(!/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(email))fail_('כתובת המייל אינה תקינה');
  if(typeof o.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(o.date)||isNaN(Date.parse(o.date+'T12:00:00Z'))||new Date(o.date+'T12:00:00Z').toISOString().slice(0,10)!==o.date)fail_('תאריך אינו תקין');
  if(![o.start,o.end].every(t=>typeof t==='string'&&/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(t)))fail_('יש לבדוק את שעות הצילום');
  if(!Object.prototype.hasOwnProperty.call(TERMS_,o.package))fail_('חבילה לא מוכרת');
  const base=cents_(o.price,1000000),deposit=cents_(o.deposit,1000000),discount=cents_(o.discount,1000000);
  if(base<=0)fail_('נדרש מחיר לחבילה');
  if(!Array.isArray(o.extras)||o.extras.length>30)fail_('תוספות אינן תקינות');
  const extras=o.extras.map(x=>{
    if(!Number.isInteger(x.quantity)||x.quantity<1||x.quantity>100||typeof x.gift!=='boolean')fail_('תוספת אינה תקינה');
    const price=cents_(x.price,100000);if(!x.gift&&price<=0)fail_('נדרש מחיר לכל תוספת בתשלום');
    return {title:text_(x.title,120,'שם התוספת',1),details:text_(x.details,500,'פרטי התוספת'),price:price,quantity:x.quantity,gift:x.gift};
  });
  const total=base+extras.reduce((n,x)=>n+(x.gift?0:x.price*x.quantity),0)-discount;
  if(total<=0||deposit>total)fail_('מחיר או מקדמה אינם תקינים');
  const labels={standard:'Standard - סטילס',premium:'Premium - סטילס, וידאו ואלבומים','premium-plus':'Premium Plus - כולל מגנטים',diamond:'Diamond - החבילה המלאה',custom:'אירוע בהתאמה אישית'};
  const selected=services_(o);
  const summary=['שם הלקוח: '+customer,'דוא״ל: '+email+' | טלפון: '+phone,'האירוע שלכם: '+o.date+' | '+venue,'החבילה שסיכמנו: '+labels[o.package],'שעות הצילום: '+o.start+' עד '+o.end,'מחיר החבילה כולל מע״מ: '+money_(base)];
  if(discount)summary.push('הנחה שסוכמה: '+money_(discount));
  extras.forEach(x=>summary.push(x.title+' · '+x.quantity+' יחידות · '+(x.gift?'מתנה מאיתנו, ללא חיוב':money_(x.price*x.quantity))+(x.details?' · '+x.details:'')));
  summary.push('סך הכול כולל מע״מ: '+money_(total));
  if(deposit)summary.push('מקדמה במעמד סגירת ההזמנה: '+money_(deposit));
  summary.push('יתרה לתשלום: '+money_(total-deposit));
  const notes=text_(o.notes||'',2000,'הסכמות מיוחדות');if(notes)summary.push('עוד דברים שסיכמנו: '+notes);
  return {customer:customer,email:email,summary:summary,terms:tailoredTerms_(o.package,selected,deposit),services:selected,total:total,created_at:new Date().toISOString()};
}
// Explicit service selection controls every service-specific paragraph. Extras never infer scope from their free-text title.
function services_(o) {
  const defaults={standard:['stills'],premium:['stills','video','albums','drone'],'premium-plus':['stills','video','albums','drone','magnets'],diamond:['stills','video','albums','drone','magnets','prints','couple'],custom:['stills']};
  const list=o.services===undefined?defaults[o.package]:o.services;
  const allowed=['stills','video','albums','drone','magnets','prints','couple'];
  if(!Array.isArray(list)||!list.length||list.length>allowed.length||new Set(list).size!==list.length||list.some(x=>!allowed.includes(x)))fail_('יש לבחור את השירותים שסוכמו');
  if(list.includes('drone')&&!list.includes('video'))fail_('צילום רחפן דורש בחירת וידאו');
  return list.slice();
}
function tailoredTerms_(packageKey,selected,deposit) {
  const sections=[],has=x=>selected.includes(x),add=(title,lines)=>sections.push([['h',title],...lines.map(t=>['p',t])]);
  if(has('stills'))add('הצילום שלכם',['צילום סטילס בהובלת דור פיינה, בהתאם לשעות ולצוות שסוכמו בהזמנה. הצילום והעריכה נעשים מתוך שיקול דעת מקצועי ואומנותי.','התמונות יימסרו בגלריה אישית לצפייה, הורדה ושיתוף.']);
  if(has('video'))add('וידאו ועריכה',['צילום וידאו בשעות שסוכמו, כולל מצלמה נוספת על חצובה בחופה.','התוצרים שסוכמו: סרט מלא, סרט מקוצר באורך 45–60 דקות, היילייטס וטיזר באורך 40–50 שניות. התוצרים יימסרו בקישור להורדה באיכות גבוהה. שינויים בפירוט הזה יירשמו בהסכמות האישיות בהזמנה.']);
  if(has('drone'))add('צילום רחפן',['צילום הרחפן יבוצע בהתאם למזג האוויר, לתנאי המקום, לאישורים הנדרשים ולכללי הדין והבטיחות.']);
  if(has('albums'))add('האלבומים שלכם',[(packageKey==='standard'||packageKey==='custom')?'סוג האלבומים, הכמות, המידות והעיצוב הם כפי שנרשמו בתוספות ובהסכמות האישיות.':'בחבילה: אלבום זוגי 30×60 ס״מ ושני אלבומי הורים 20×40 ס״מ, עד 220 תמונות בכל אלבום, בעיצוב זהה ובכריכה מהמגוון. תוספות ושינויים הם לפי הפירוט האישי.','בחירת התמונות תיעשה בתוך חודשיים מהאירוע. תיקוני עיצוב יועברו בתוך 14 ימי עסקים, ואישור העיצוב יינתן בכתב. אם עיכוב גורר עליית מחירי ספקים, כל תוספת תפורט ותוסכם בכתב לפני ביצוע.']);
  if(has('magnets'))add('מגנטים באירוע',['המגנטים מודפסים באירוע מתמונות צלמי הסטילס, באמצעות איש צוות להדפסה, ללא הגבלה בכמות בשעות השירות שסוכמו.','ברירת המחדל היא 19:30–00:00, עד חמש שעות ולא יאוחר מחצות; שעות אחרות, הגדלות או פוטובלוקים יפורטו בהסכמות האישיות.']);
  if(has('prints'))add('הדפסות והגדלות',['סוג ההדפסה, המידות והכמות הם לפי החבילה והתוספות שסוכמו בהזמנה.']);
  if(has('couple'))add('צילומי זוגיות',['מועד, מיקום, משך הצילומים והתוצרים יהיו לפי הפירוט שסוכם בהזמנה ובתיאום עם דור.']);
  const delivery=[];
  if(has('stills'))delivery.push('תמונות סטילס: עד 21 יום לאחר האירוע.');
  if(has('video'))delivery.push('וידאו: עד 45 יום מבחירת השירים.');
  if(has('albums'))delivery.push('אלבומים: עד 30 יום מאישור העיצוב בכתב.');
  if(delivery.length)add('מתי מקבלים את הזיכרונות',delivery);
  add('התשלום ושמירת התאריך',[(deposit?'המקדמה הרשומה בהזמנה תשולם במעמד סגירת ההזמנה. חתימה אינה אישור שהמקדמה התקבלה. ':'')+'שמירת התאריך תאושר על ידי דור לאחר חתימה והסדרת התשלום שסוכם. מועדי ואמצעי תשלום היתרה יסוכמו בכתב. תשלום במזומן ייעשה בגבולות הדין.','בקשה להארכת צילום מעבר לשעות שסוכמו תתואם עם דור, לפי זמינות הצוות, במחיר 500 ₪ לכל צלם לכל שעה נוספת או חלק ממנה.']);
  add('כדי שהיום יעבור בנחת',['במעמד סגירת ההסכם יש לעדכן אם האולם או מקום האירוע דורשים אישור ביטוח צד ג׳ או אישור ביטוח אחר, ולהעביר את הדרישות הכתובות לבדיקה. אישור יימסר רק לאחר בדיקה ואישור מפורש של דור; אין בהסכם התחייבות לכיסוי ביטוחי שלא אושר.','יש לתאם עם האולם אפשרות לצוות הצילום לאכול ארוחה ולשתות במקום, ללא חיוב הצוות. ההפסקה תתואם ככל האפשר לזמנים שאינם כוללים רגעי צילום מרכזיים.','יש לדאוג לחניה נגישה לצוות. אם החניה בתשלום, עלותה בפועל תתווסף למחיר ההזמנה כנגד אסמכתה. הוצאה חריגה או סידור חניה מיוחד יתואמו מראש.','הצוות יעבוד בהתאם לכללי הבטיחות. יש לתאם עם האולם שלא יופעלו לייזרים באזורי הצילום; במקרה של סיכון, הצוות רשאי לעצור צילום באזור המסוכן עד להסרתו. תאורת המקום ותנאים שאינם בשליטת הצוות עשויים להשפיע על התוצאה.']);
  // Preserve the existing cancellation, postponement and liability terms; remove only unrelated service text.
  let active=false,lines=[];
  TERMS_[packageKey].flat().forEach(([kind,text])=>{
    if(kind!=='p'){
      if(active&&lines.length)add(active,lines);
      active=['ביטול ההזמנה על ידי המזמין','דחייה עקב כוח עליון','מניעה מצד הצלם ואחריות לחומרים'].includes(text)?text:false;lines=[];
    }else if(active)lines.push(text);
  });if(active&&lines.length)add(active,lines);
  if(has('stills')||has('video'))add('שמירה ושימוש בחומרים',['חומרי הגלם יישמרו במשך 14 ימי עסקים לאחר מסירת החומרים. חשוב להוריד ולגבות את הקבצים שנמסרו לכם.','זכויות היוצרים שמורות לצלם בכפוף לדין; תוכלו להשתמש בחומרים לשימוש אישי ולשתף עם משפחה וחברים. פרסום לצורכי שיווק ייעשה לפי הבחירה שלכם בעת החתימה ובכפוף לאישורים הנדרשים בדין.']);
  add('הסיכום שלנו',['השירותים, התוספות, המתנות, המחיר והשעות המפורטים בהזמנה הם הסיכום בינינו. שינוי ייעשה בהסכמה בכתב. זכויות הצדדים והוראות חובה לפי דין נשמרות.']);
  return sections;
}
function create_(order) {
  if(mailReady_()<3)fail_('מכסת המייל היומית אינה מספיקה כרגע');
  const url=ScriptApp.getService().getUrl();if(!url||!url.endsWith('/exec'))fail_('יש לפרוס את המערכת כיישום אינטרנט לפני יצירת קישור');
  const snapshot=snapshot_(order),token=random_(),id=hash_(token),r={id:id,snapshot:snapshot,digest:hash_(JSON.stringify(snapshot)),expires:Date.now()+7*86400000,status:'pending',mail_status:'not_sent',attempts:0};
  folder_().createFile(Utilities.newBlob(JSON.stringify(r),'application/json',id+'.json'));
  return {id:id,url:url+'?s='+token,digest:r.digest};
}
function list_() {
  const files=folder_().getFiles(),rows=[];while(files.hasNext()){
    const f=files.next();if(!/^[a-f0-9]{64}\.json$/.test(f.getName()))continue;
    const r=JSON.parse(f.getBlob().getDataAsString('UTF-8'));rows.push({id:r.id,customer:r.snapshot.customer,status:r.status,expired:Date.now()>r.expires,mail_status:r.mail_status,created_at:r.snapshot.created_at});
  }
  return {mail_ready:true,quota:mailReady_(),agreements:rows.sort((a,b)=>b.created_at.localeCompare(a.created_at)).slice(0,200)};
}
function view_(r) {return {summary:r.snapshot.summary,terms:r.snapshot.terms,digest:r.digest,status:r.status,mail_status:r.mail_status};}
function sendCode_(record,token) {
  const r=record.data,now=Date.now();
  if(!r.codeWindow||now-r.codeWindow>600000){r.codeWindow=now;r.codeCount=0;}
  if(r.codeCount>=3)fail_('ניתן לבקש עד שלושה קודים בעשר דקות');
  if(mailReady_()<3)fail_('מכסת המייל היומית אינה מספיקה כרגע. פנו לדור');
  const code=String(100000+parseInt(random_().slice(0,10),16)%900000);
  r.codeCount++;r.code_hash=hash_(token+code);r.code_until=now+600000;r.attempts=0;save_(record);
  try {MailApp.sendEmail({to:r.snapshot.email,subject:'קוד אימות לחתימת ההסכם עם דור פיינה',body:'קוד האימות שלך: '+code+'\nהקוד תקף לעשר דקות. אין להעביר אותו לאחרים.',name:'Dor Fayna Photography',replyTo:owner_()});}
  catch(e){r.code_hash=null;save_(record);fail_('שליחת הקוד נכשלה. ההסכם לא נחתם');}
  return {};
}
function signature_(data) {
  if(typeof data.signature!=='string'||data.signature.length>300000||!data.signature.startsWith('data:image/png;base64,'))fail_('יש לצייר חתימה');
  let bytes;try{bytes=Utilities.base64Decode(data.signature.slice(22));}catch(e){fail_('חתימה אינה תקינה');}
  if(bytes.length<100||[137,80,78,71,13,10,26,10].some((x,i)=>(bytes[i]&255)!==x))fail_('חתימה אינה תקינה');
  const uint=i=>((bytes[i]&255)*16777216+(bytes[i+1]&255)*65536+(bytes[i+2]&255)*256+(bytes[i+3]&255));
  if(uint(16)!==1000||uint(20)!==300)fail_('גודל חתימה אינו תקין');
  const strokes=data.strokes;
  if(!Array.isArray(strokes)||strokes.length<1||strokes.length>300)fail_('יש לצייר חתימה');
  let count=0,distance=0;strokes.forEach(points=>{
    if(!Array.isArray(points))fail_('חתימה אינה תקינה');count+=points.length;
    points.forEach((p,i)=>{if(!Array.isArray(p)||p.length!==2||p.some(v=>typeof v!=='number'||!Number.isFinite(v))||p[0]<0||p[0]>1000||p[1]<0||p[1]>300)fail_('חתימה אינה תקינה');if(i)distance+=Math.hypot(p[0]-points[i-1][0],p[1]-points[i-1][1]);});
  });
  if(count<3||count>5000||distance<20)fail_('יש לצייר חתימה ברורה');
  return Utilities.newBlob(bytes,'image/png','signature.png');
}
function complete_(record,token,data) {
  const r=record.data;
  if(data.accepted!==true||data.agreement_digest!==r.digest)fail_('יש לאשר את הגרסה המוצגת');
  if(typeof data.marketing!=='boolean')fail_('יש לבחור אם לאשר פרסום');
  const name=text_(data.name,120,'שם החותם',2);
  if(r.attempts>=5||!r.code_hash||Date.now()>r.code_until)fail_('קוד האימות אינו תקף');
  r.attempts++;save_(record);
  if(typeof data.code!=='string'||!/^\d{6}$/.test(data.code)||!equal_(r.code_hash,hash_(token+data.code)))fail_('קוד האימות אינו תקף');
  const signature=signature_(data);
  if(mailReady_()<2)fail_('מכסת המייל אינה מספיקה כרגע. ההסכם לא נחתם');
  r.status='preparing';r.signed_at=new Date().toISOString();r.signer=name;r.marketing=data.marketing;r.signature_hash=hash_(data.signature);r.code_hash=null;save_(record);
  try{const pdf=makePdf_(r,signature);r.pdf_id=pdf.getId();r.pdf_hash=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,pdf.getBlob().getBytes()).map(b=>('0'+(b&255).toString(16)).slice(-2)).join('');}
  catch(e){r.status='pending';r.mail_status='needs_review';save_(record);fail_('הפקת המסמך נכשלה. ההסכם לא הושלם; פנו לדור');}
  r.status='signed';r.mail_status='pending';save_(record);
  deliver_(record);return view_(r);
}
function makePdf_(r,signature) {
  const doc=DocumentApp.create('הסכם '+r.id.slice(0,12)),file=DriveApp.getFileById(doc.getId());file.moveTo(folder_());
  const body=doc.getBody();body.setMarginTop(38).setMarginBottom(38).setMarginLeft(38).setMarginRight(38);
  const logo=Utilities.newBlob(Utilities.base64Decode(LOGO_BLACK_),'image/png','logo.png');
  doc.addHeader().appendParagraph('').appendInlineImage(logo).setWidth(180).setHeight(62);
  const p=(text,heading)=>{const paragraph=body.appendParagraph(text);if(heading)paragraph.setHeading(DocumentApp.ParagraphHeading.HEADING2);paragraph.setLeftToRight(false).setAlignment(DocumentApp.HorizontalAlignment.RIGHT).setSpacingAfter(7);paragraph.editAsText().setFontFamily('Arial').setFontSize(heading?14:11);return paragraph;};
  p('הרגעים שלכם, הסיכום שלנו',true);r.snapshot.summary.forEach(t=>p(t));
  p('כל מה שסיכמנו לקראת האירוע',true);r.snapshot.terms.forEach(section=>section.forEach(([kind,text])=>p(text,kind!=='p')));
  body.appendPageBreak();p('חתימת המזמין ואישור ההסכם',true);
  body.appendParagraph('').setAlignment(DocumentApp.HorizontalAlignment.RIGHT).appendInlineImage(signature).setWidth(350).setHeight(105);
  ['שם החותם: '+r.signer,'מועד חתימה UTC: '+r.signed_at,'מזהה הסכם: '+r.id,'אימות: קוד חד־פעמי למייל שהוגדר בהזמנה','אישור פרסום: '+(r.marketing?'מאשר':'אינו מאשר'),'SHA256 גרסת ההסכם: '+r.digest,'SHA256 תמונת החתימה: '+r.signature_hash].forEach(t=>p(t));
  doc.addFooter().appendParagraph('Dor Fayna Photography | 050-2858162').setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  doc.saveAndClose();const pdf=file.getAs(MimeType.PDF).setName('signed-agreement-'+r.id.slice(0,12)+'.pdf');return folder_().createFile(pdf);
}
function deliver_(record) {
  const r=record.data;if(r.mail_status!=='pending')return;
  r.mail_status='sending';save_(record);
  try {
    const pdf=DriveApp.getFileById(r.pdf_id).getBlob(),options={name:'Dor Fayna Photography',replyTo:owner_(),attachments:[pdf]};
    MailApp.sendEmail(r.snapshot.email,'תודה שבחרתם בדור פיינה — ההסכם החתום שלכם','שלום '+r.snapshot.customer+',\nתודה שבחרתם בנו לתעד את האירוע שלכם!\nמצורף ההסכם החתום, כולל הפרטים שסיכמנו.\nנשמח ללוות אתכם וליצור זיכרונות שתאהבו.\nדור פיינה | 050-2858162',options);
    r.customer_mail='sent';save_(record);
    MailApp.sendEmail(owner_(),'הסכם חתום חדש — '+r.snapshot.customer,'מצורף ההסכם החתום. תשלום המקדמה דורש אימות נפרד.',options);
    r.owner_mail='sent';r.mail_status='sent';save_(record);
  } catch(e){r.mail_status='needs_review';save_(record);}
}
function pdfDownload_(record) {
  if(record.data.status!=='signed'||!record.data.pdf_id)fail_('אין עדיין PDF חתום');
  const file=DriveApp.getFileById(record.data.pdf_id);
  return {base64:Utilities.base64Encode(file.getBlob().getBytes()),filename:file.getName()};
}
