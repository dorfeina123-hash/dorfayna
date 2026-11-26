/* Site assistant: fixed answers + a short event questionnaire that ends in a ready WhatsApp message.
   No AI, no server: nothing typed here is stored or sent until the visitor presses a WhatsApp button.
   Keep texts and prices in step with weddings-prices.html. */
(function () {
  'use strict';
  if (window.dorSiteAgent) return;
  window.dorSiteAgent = true;

  var PHONE = '972502858162';

  /* ---------- content ---------- */
  var PACKAGES = [
    { name: 'Standard', price: '5,500', regular: '7,500', extra: 'סט אלבומים בתוספת 1,000 ₪.',
      items: ['שני צלמי סטילס: אחד מההכנות, השני מצטרף לצילומי המשפחות באולם', 'כל התמונות בעריכה מקצועית, בגלריה דיגיטלית פרטית', 'וידאו ואלבומים אינם כלולים'] },
    { name: 'STANDART PLUS', price: '6,500', regular: '8,000', extra: 'סט אלבומים בתוספת 1,000 ₪ (סה״כ 7,500 ₪).',
      items: ['לחתונות קטנות: צלם סטילס אחד וצלם וידאו מההכנות', 'תמונות ערוכות בגלריה פרטית', 'סרט מלא, סרט מקוצר, היילייטס ו־REELS', 'רחפן, בכפוף לתנאי ההטסה', 'אלבומים ומגנטים אינם כלולים'] },
    { name: 'Premium', price: '9,500', regular: '11,500',
      items: ['שני צלמי סטילס (השני מצילומי המשפחות באולם)', 'צלם וידאו מההכנות, בשתי מצלמות', 'סרט ארוך, סרט מקוצר, היילייטס ו־REELS', 'רחפן, בכפוף לתנאי ההטסה', 'אלבום זוגי 30×60 + 2 אלבומי הורים 20×40'] },
    { name: 'Premium Plus', price: '11,000', regular: '13,000',
      items: ['כל מה שב־Premium', 'מגנטים ללא הגבלת כמות בשעות שסוכמו', '10 הגדלות מגנט ו־2–4 פוטובלוק, לפי ההצעה'] },
    { name: 'Diamond', price: '13,000', regular: '15,000',
      items: ['כל מה שב־Premium Plus', 'צילומי זוגיות (Save the Date) לפני האירוע', 'קנבס לזוג ושני קנבסים להורים, או הגדלת זכוכית, לפי ההצעה'] }
  ];

  /* keys: word stems. A key with a space is a phrase and weighs more. */
  var TOPICS = [
    { id: 'date', keys: ['פנוי', 'פנויים', 'זמין', 'זמינות', 'תאריך פנוי', 'לשריין', 'להזמין', 'לסגור'] },
    { id: 'prices', keys: ['מחיר', 'כמה עולה', 'כמה זה', 'כמה אתם לוקחים', 'עלות', 'חבילה', 'חבילות', 'מחירון', 'הצעה', 'תקציב'] },
    { id: 'delivery', keys: ['מתי מקבלים', 'כמה זמן', 'מסירה', 'תוך כמה', 'מתי התמונות', 'מתי הסרט', 'מתי האלבום'],
      text: 'מועדי המסירה:\n• תמונות: עד 21 ימי עסקים מהאירוע\n• וידאו: עד 45 ימי עסקים מבחירת השירים\n• אלבומים: עד 30 ימי עסקים מאישור העיצוב' },
    { id: 'albums', keys: ['אלבום', 'אלבומים', 'כריכה', 'אלבומי הורים', 'עולה אלבום'],
      text: 'סט האלבומים: אלבום זוגי 30×60 ס״מ ושני אלבומי הורים 20×40 ס״מ.\nכלול ב־Premium ומעלה, ובתוספת של 1,000 ₪ ל־Standard ול־STANDART PLUS.\nיש כמה גוונים של דמוי עור ובד, ואפשר לשדרג גדלים וכריכות.' },
    { id: 'magnets', keys: ['מגנט', 'מגנטים', 'פוטובלוק', 'עולה מגנטים'],
      text: 'המגנטים מודפסים באירוע עצמו והאורחים לוקחים אותם הביתה.\nבחבילות Premium Plus ו־Diamond הם כלולים. אפשר גם להזמין מגנטים בלבד, בהצעה נפרדת לפי המקום והשעות.',
      link: { text: 'בחירת מסגרת למגנטים', href: './magnets.html' } },
    { id: 'events', keys: ['חינה', 'בר מצווה', 'בת מצווה', 'ברית', 'בריתה', 'אירוסין', 'אירוע חברה', 'אירועי חברה', 'כנס', 'יום הולדת', 'עלייה לתורה', 'אירוע קטן', 'אירועים'],
      text: 'מצלם גם חינה, אירוסין, בר/בת מצווה, ברית/ה, אירועי חברה ואירועים פרטיים.\nהמחיר לאירוע שאינו חתונה נקבע בהצעה אישית.\nההצעה מותאמת לסוג האירוע, לשעות ולשירותים. באירועים קטנים בדרך כלל 4–5 שעות צילום בערב.', lead: 'קבלת הצעה לאירוע' },
    { id: 'hours', keys: ['שעות', 'מתי מגיעים', 'לכמה שעות', 'הכנות', 'עד מתי'],
      text: 'בחתונה: ליווי מההכנות ועד סיום הצילום, בשעות שנסכם בהצעה.\nבאירועים קטנים: בדרך כלל 4–5 שעות צילום בערב.' },
    { id: 'video', keys: ['וידאו', 'וידיאו', 'סרט', 'קליפ', 'רילס', 'reels'],
      text: 'וידאו כלול בכל החבילות מלבד Standard הבסיסית: סרט מלא, סרט מקוצר, קליפ היילייטס ו־REELS.',
      link: { text: 'לסרטי חתונה', href: './index.html#films' } },
    { id: 'drone', keys: ['רחפן', 'drone'],
      text: 'רחפן כלול בכל החבילות מלבד Standard, בכפוף להטסה חוקית ובטוחה, לתנאי המקום ולמזג האוויר. אם אי אפשר להטיס, מצלמים בזוויות מגוונות מהקרקע.' },
    { id: 'team', keys: ['כמה צלמים', 'צוות', 'צלם שני', 'צלם נוסף'],
      text: 'תלוי בחבילה: ב־STANDART PLUS צלם סטילס וצלם וידאו. ב־Standard שני צלמי סטילס. ב־Premium ומעלה שני צלמי סטילס וצלם וידאו.\nאפשר גם להתאים את החבילה ולהוסיף צלם.' },
    { id: 'gallery', keys: ['גלריה', 'גלריות', 'עבודות', 'דוגמאות', 'תיק עבודות', 'לראות עבודות'],
      text: 'התמונות נמסרות בגלריה דיגיטלית פרטית לצפייה, הורדה ושיתוף. הנה עבודות מאירועים שצילמתי:',
      link: { text: 'לגלריות', href: 'https://DorFayna.pixieset.com' } },
    { id: 'reviews', keys: ['המלצות', 'ביקורות', 'חוות דעת', 'ממליצים'],
      text: 'אפשר לקרוא חוות דעת של זוגות ב־mit4mit:',
      link: { text: 'להמלצות', href: 'https://www.mit4mit.co.il/biz/92756' } },
    { id: 'area', keys: ['איזור', 'אזור', 'איפה אתם', 'מאיפה', 'צפון', 'דרום', 'ירושלים', 'חיפה', 'באר שבע', 'אילת', 'אשדוד', 'מודיעין', 'פתח תקווה', 'רחובות', 'ראשון לציון', 'נס ציונה', 'חולון', 'בת ים', 'תל אביב', 'קריות', 'בית שמש', 'ראש העין', 'שפלה', 'מרכז'],
      text: 'אני מראשון לציון ומצלם חתונות ואירועים מבאר שבע ועד חיפה. למקום אחר, שלחו תאריך ומקום ונבדוק.', lead: 'בדיקת תאריך ומקום' },
    { id: 'meet', keys: ['פגישה', 'להיפגש', 'טלפון', 'שיחה', 'סטודיו', 'כתובת'],
      text: 'אפשר לתאם שיחה בטלפון או אונליין, או להיפגש במקום שנתאם מראש (אין קבלת קהל קבועה).\nטלפון: 050-285-8162' },
    { id: 'shy', keys: ['להצטלם', 'נבוכים', 'ביישן', 'מתביישים', 'לא רגילים', 'פוזות'],
      text: 'לא צריך ניסיון מול מצלמה. אני מכוון בפשטות, משאיר מקום לתנועה ולרגעים טבעיים ועוזר לכם להרגיש בנוח.' },
    { id: 'change', keys: ['לשנות', 'להתאים', 'להוסיף', 'להוריד', 'גמיש'],
      text: 'כן, אפשר להתאים את החבילה: סטילס, וידאו, אלבומים ומגנטים. כל שינוי בתכולה ובמחיר יופיע בהצעה האישית.' },
    { id: 'pay', keys: ['מקדמה', 'תשלום', 'תשלומים', 'לשלם', 'הסכם', 'חוזה'],
      text: 'מועדי התשלום והמחיר הסופי מפורטים בהצעה ובהסכם האישי. שמירת תאריך נעשית לפי ההסכם.' },
    { id: 'cancel', keys: ['ביטול', 'לבטל', 'החזר'],
      text: 'לביטול או שינוי: mmdorldor@gmail.com או 050-285-8162.', link: { text: 'מידע על ביטול עסקה', href: './cancellation.html' } },
    { id: 'social', keys: ['סושיאל', 'צלמת סושיאל', 'צלם סושיאל'],
      text: 'אם מגיע צלם או צלמת סושיאל, אשמח שתעדכנו אותי לפני האירוע כדי שנתאם מראש.' },
    { id: 'discount', keys: ['הנחה', 'הנחות', 'מבצע', 'קופון', 'יותר זול', 'להוזיל', 'יקר'],
      text: 'המחירים באתר הם כבר אחרי הנחה:\n• 2,000 ₪ ב־Standard, Premium, Premium Plus ו־Diamond\n• 1,500 ₪ ב־STANDART PLUS\nאפשר גם להתאים את ההצעה לצרכים שלכם.', lead: 'לקבל הצעה אישית' },
    { id: 'who', keys: ['מי מצלם', 'מי הצלם', 'מי אתה', 'ניסיון', 'ותק', 'כמה שנים', 'אתה בעצמך'],
      text: 'אני, דור, הצלם הראשי שמלווה אתכם, עם ניסיון של מעל עשור. צלם נוסף וצוות וידאו מצטרפים בהתאם לחבילה.' },
    { id: 'couple', keys: ['זוגיות', 'צילומי זוגיות', 'save the date', 'סייב דה דייט', 'שקיעה', 'לוקיישן', 'איפה מצטלמים'],
      text: 'ביום החתונה כדאי לבחור מקום אחד קרוב לאולם, עם צל או נוף פתוח. בשעה שלפני השקיעה האור רך יותר. נבחר יחד לפי האולם והשעה.\nצילומי זוגיות לפני החתונה (Save the Date) כלולים בחבילת Diamond.' },
    { id: 'religious', keys: ['דתי', 'דתית', 'דתיים', 'צניעות', 'כיסוי כלה', 'כיסוי הכלה'],
      text: 'כן, אני מצלם חתונות דתיות ומכיר את הסדר ואת הרגישויות: קבלת הפנים, כיסוי הכלה, החופה והריקודים. נתאם מראש מה מצלמים ואיפה.',
      link: { text: 'צילום חתונה דתית', href: './religious-wedding-photography.html' } },
    { id: 'schedule', keys: ['פקקים', 'לו ז', 'לוז', 'לוח זמנים', 'סדר היום'],
      text: 'בונים לו״ז עם מרווח בין ההכנות, הצילומים והאולם, ובוחרים מקום צילום קרוב לאולם כשאפשר.' },
    { id: 'process', keys: ['איך מתקדמים', 'איך זה עובד', 'איך מזמינים', 'תהליך', 'מה השלב', 'אחרי ההודעה'],
      text: 'ככה מתקדמים:\n1. שולחים תאריך ומקום ובודקים זמינות\n2. מדברים על מה שחשוב לכם ומקבלים הצעה אישית\n3. שומרים את התאריך לפי ההסכם\n4. יום האירוע, ואחריו קבלת התמונות והסרטים' },
    { id: 'compare', keys: ['להשוות', 'השוואה', 'ממה מורכב', 'הצעות מחיר', 'מה לבדוק', 'איך בוחרים'],
      text: 'כשמשווים בין צלמים כדאי לבדוק:\n1. כמה אנשי צוות\n2. כמה שעות צילום\n3. מה מקבלים ומתי (תמונות ערוכות, סרט, קליפ)\n4. אלבום ותוספות\nבקשו לראות חתונה שלמה, וודאו שיש כימיה.' },
    { id: 'photos', keys: ['כמה תמונות', 'כמות תמונות', 'עריכה', 'ערוכות', 'להוריד תמונות', 'שיתוף'],
      text: 'כל התמונות עוברות עריכה מקצועית ומגיעות בגלריה דיגיטלית פרטית לצפייה, הורדה ושיתוף.\nלגבי כמות משוערת לאירוע שלכם, דור יענה אישית.', wa: true },
    { id: 'songs', keys: ['שיר', 'שירים', 'מוזיקה', 'פסקול'],
      text: 'הווידאו נמסר בתוך 45 ימי עסקים מבחירת השירים. על אופן הבחירה דור יענה אישית.', wa: true },
    { id: 'extra', keys: ['מתארך', 'שעה נוספת', 'שעות נוספות', 'להאריך'],
      text: 'שעת ההתחלה, שעת הסיום והרחבות נקבעות בהצעה ובהסכם של האירוע שלכם.' },
    { id: 'early', keys: ['כמה מראש', 'זמן לפני', 'כמה זמן לפני', 'מתי כדאי להזמין', 'מתי לסגור'],
      text: 'מספר התאריכים בכל עונה מוגבל, ושווה לבדוק זמינות מוקדם.', lead: 'לבדוק את התאריך שלנו' },
    { id: 'ask', keys: ['חומרי גלם', 'raw', 'חולה', 'גיבוי', 'חו ל', 'מחוץ לארץ', 'צלמת', 'שישי', 'מוצש', 'נסיעות', 'גשם', 'מזג אוויר'],
      text: 'שאלה טובה, ועליה דור עונה אישית. שלחו לו אותה והוא יחזור אליכם בהקדם.', wa: true },
    { id: 'human', keys: ['וואטסאפ', 'ווטסאפ', 'לדבר', 'נציג', 'בן אדם', 'דור'] },
    { id: 'hello', keys: ['היי', 'שלום', 'אהלן', 'בוקר טוב', 'ערב טוב'] },
    { id: 'thanks', keys: ['תודה', 'מעולה', 'סבבה'] }
  ];

  var MENU = [
    ['חבילות ומחירים', 'prices'], ['יש הנחה?', 'discount'], ['מתי מקבלים?', 'delivery'],
    ['מגנטים', 'magnets'], ['אירוע שאינו חתונה', 'events'], ['המלצות', 'reviews'], ['לדבר עם דור', 'human']
  ];
  var MORE = [
    ['מי מצלם?', 'who'], ['גלריות', 'gallery'], ['אלבומים', 'albums'], ['וידאו', 'video'], ['כמה שעות?', 'hours'],
    ['לא רגילים להצטלם', 'shy'], ['צילומי זוגיות', 'couple'], ['חתונה דתית', 'religious'], ['איך מתקדמים?', 'process'],
    ['איך משווים מחירים?', 'compare'], ['אפשר לשנות חבילה?', 'change']
  ];

  /* ---------- matching ---------- */
  function norm(s) {
    return ' ' + String(s).toLowerCase().replace(/[֑-ׇ]/g, '').replace(/[^0-9a-zא-ת]+/g, ' ').trim() + ' ';
  }
  function match(text) {
    var t = norm(text), best = null, bestScore = 0, scores = {};
    TOPICS.forEach(function (topic) {
      var score = 0;
      topic.keys.forEach(function (key) {
        var k = norm(key).trim();
        /* whole word, optionally with Hebrew prefix letters (ו, ה, ב, ל, מ, ש, כ) */
        if (new RegExp(' [והבלמשכ]{0,3}' + k + (k.length > 3 ? '[א-ת]{0,2}' : '') + ' ').test(t)) {
          score += k.indexOf(' ') > -1 ? 4 : 2;
        }
      });
      if (topic.id === 'hello' || topic.id === 'thanks' || topic.id === 'human') score = score ? 1 : 0;
      scores[topic.id] = score;
      if (score > bestScore) { best = topic.id; bestScore = score; }
    });
    if (best === 'prices') {
      ['events', 'magnets', 'albums', 'discount', 'compare'].some(function (id) { if (scores[id]) { best = id; return true; } return false; });
    }
    return best;
  }
  function packageIn(text) {
    var t = norm(text);
    if (/premium plus|פרימיום פלוס/.test(t)) return PACKAGES[3];
    if (/standart plus|standard plus|סטנדרט פלוס/.test(t)) return PACKAGES[1];
    if (/premium|פרימיום/.test(t)) return PACKAGES[2];
    if (/standard|standart|סטנדרט/.test(t)) return PACKAGES[0];
    if (/diamond|דיימונד|יהלום/.test(t)) return PACKAGES[4];
    return null;
  }

  /* ---------- styles ---------- */
  var css =
    '.da-launch{position:fixed;right:16px;bottom:calc(20px + env(safe-area-inset-bottom));z-index:75;display:inline-flex;align-items:center;gap:8px;min-height:50px;padding:0 20px;border:1px solid #d7b66f;border-radius:30px;background:#191b1a;color:#fff;font:600 16px/1 Assistant,Arial,sans-serif;box-shadow:0 6px 22px #0004;cursor:pointer;direction:rtl}' +
    '.da-launch svg{color:#e3c68b;flex:none}' +
    '.da-panel{position:fixed;right:16px;bottom:20px;z-index:9000;width:390px;height:min(640px,calc(100dvh - 40px));display:flex;flex-direction:column;overflow:hidden;margin:0;padding:0;background:#faf8f4;color:#252525;border:1px solid #d9d0bd;border-radius:20px;box-shadow:0 18px 60px #0005;direction:rtl;text-align:right;font-family:Assistant,Arial,sans-serif}' +
    '.da-panel[hidden],.da-launch[hidden]{display:none}' +
    '.da-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 18px;background:#191b1a;color:#fff;flex:none}' +
    '.da-head b{display:block;font-size:18px;line-height:1.3;color:#e3c68b}.da-head small{display:block;font-size:13px;color:#d8d5ce}' +
    '.da-x{width:44px;height:44px;flex:none;border:0;border-radius:50%;background:#ffffff1a;color:#fff;font-size:26px;line-height:1;cursor:pointer}' +
    '.da-log{flex:1;overflow-y:auto;overscroll-behavior:contain;padding:16px;display:flex;flex-direction:column;gap:10px}' +
    '.da-msg{flex:none;max-width:88%;padding:11px 15px;border-radius:18px;white-space:pre-line;font-size:16px;line-height:1.6;overflow-wrap:anywhere}' +
    '.da-bot{align-self:flex-start;background:#fff;border:1px solid #e6e0d3;border-top-right-radius:5px}' +
    '.da-me{align-self:flex-end;background:#e9dcc0;border-top-left-radius:5px}' +
    '.da-opts{flex:none;display:flex;flex-wrap:wrap;gap:8px}' +
    '.da-opts button,.da-opts a{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:8px 15px;border:1px solid #98763d;border-radius:24px;background:#fff;color:#5f4720;font:600 15px/1.3 Assistant,Arial,sans-serif;text-decoration:none;cursor:pointer}' +
    '.da-opts button[aria-pressed=true]{background:#5f4720;border-color:#5f4720;color:#fff}.da-opts button.da-go{background:#191b1a;border-color:#191b1a;color:#fff}' +
    '.da-opts a.da-wa{width:100%;background:#177a37;border-color:#177a37;color:#fff;font-size:17px;min-height:50px}' +
    '.da-cta{display:flex;gap:8px;padding:10px 12px 0;border-top:1px solid #e6e0d3;background:#fff;flex:none}' +
    '.da-cta[hidden]{display:none}.da-cta button,.da-cta a{display:inline-flex;align-items:center;justify-content:center;min-height:46px;border-radius:24px;font:700 15px/1.2 Assistant,Arial,sans-serif;text-decoration:none;cursor:pointer}' +
    '.da-cta button{flex:1;border:0;background:#d7b66f;color:#242017}.da-cta a{padding:0 18px;border:0;background:#177a37;color:#fff}' +
    '.da-teaser{position:fixed;right:16px;bottom:calc(80px + env(safe-area-inset-bottom));z-index:76;display:flex;align-items:center;gap:6px;max-width:min(320px,calc(100vw - 32px));padding:8px 8px 8px 6px;border:1px solid #d7b66f;border-radius:16px;background:#fffaf4;color:#252525;box-shadow:0 8px 28px #0004;direction:rtl;font-family:Assistant,Arial,sans-serif}' +
    '.da-teaser button{border:0;background:none;color:inherit;cursor:pointer;min-height:44px;font:600 15px/1.45 Assistant,Arial,sans-serif;text-align:right}.da-teaser .da-no{min-width:40px;font-size:22px}' +
    '.da-form{display:flex;gap:8px;padding:10px 12px calc(10px + env(safe-area-inset-bottom));background:#fff;flex:none}' +
    '.da-form input{flex:1;min-width:0;min-height:46px;padding:8px 16px;border:1px solid #bdb4a2;border-radius:24px;background:#fff;color:#222;font:16px Assistant,Arial,sans-serif;text-align:right}' +
    '.da-form input[type=date]{-webkit-appearance:none;appearance:none;display:block;line-height:28px}' +
    '.da-form button{min-height:46px;padding:0 20px;border:0;border-radius:24px;background:#191b1a;color:#fff;font:600 15px Assistant,Arial,sans-serif;cursor:pointer}' +
    '@media(max-width:760px){.da-launch{bottom:calc(84px + env(safe-area-inset-bottom));right:12px;min-height:46px;padding:0 16px;font-size:15px}.da-teaser{right:12px;bottom:calc(140px + env(safe-area-inset-bottom))}.da-panel{right:0;left:0;bottom:0;width:auto;height:88dvh;border-radius:20px 20px 0 0}}';

  /* ---------- UI ---------- */
  var style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }
  var launch = el('button', 'da-launch');
  launch.type = 'button';
  launch.setAttribute('aria-haspopup', 'dialog');
  launch.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 5h16v11H10l-5 4v-4H4z"/></svg><span>יש שאלה?</span>';

  var panel = el('div', 'da-panel');
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'שאלות ותשובות, דור פיינה צילום');
  var head = el('div', 'da-head'), title = el('div');
  title.appendChild(el('b', '', 'דור פיינה צילום'));
  title.appendChild(el('small', '', 'תשובות אוטומטיות · תאריך מאשרים אישית'));
  var close = el('button', 'da-x', '×'); close.type = 'button'; close.setAttribute('aria-label', 'סגירת הצ׳אט');
  head.appendChild(title); head.appendChild(close);
  var log = el('div', 'da-log'); log.setAttribute('role', 'log'); log.setAttribute('aria-live', 'polite');
  var form = el('form', 'da-form');
  var input = el('input'); input.type = 'text'; input.maxLength = 200; input.autocomplete = 'off'; input.enterKeyHint = 'send';
  var send = el('button', '', 'שליחה'); send.type = 'submit';
  form.appendChild(input); form.appendChild(send);
  var cta = el('div', 'da-cta');
  var ctaDate = el('button', '', 'בדיקת תאריך פנוי'); ctaDate.type = 'button';
  var ctaWa = el('a', '', 'וואטסאפ'); ctaWa.target = '_blank'; ctaWa.rel = 'noopener';
  cta.appendChild(ctaDate); cta.appendChild(ctaWa);
  panel.appendChild(head); panel.appendChild(log); panel.appendChild(cta); panel.appendChild(form);
  document.body.appendChild(launch); document.body.appendChild(panel);

  var lead = null; /* { step, data, paused } while collecting event details */
  var answers = 0, nudged = false;

  function resetInput() { input.type = 'text'; input.removeAttribute('min'); input.removeAttribute('inputmode'); input.placeholder = 'כתבו שאלה…'; input.setAttribute('aria-label', 'כתבו שאלה'); input.value = ''; }
  function clearOptions() { log.querySelectorAll('.da-opts').forEach(function (n) { n.remove(); }); }
  function reveal(node) { log.scrollTop = node.offsetTop - log.offsetTop - 12; }
  /* keeps phone numbers, ranges and sizes in left-to-right order inside Hebrew text */
  function ltr(text) { return text.replace(/\+?\d[\d \-–×,.\/]*\d/g, '\u2066$&\u2069'); }
  function say(text) { var m = el('div', 'da-msg da-bot', ltr(text)); log.appendChild(m); reveal(m); return m; }
  function me(text) { clearOptions(); log.appendChild(el('div', 'da-msg da-me', ltr(text))); log.scrollTop = log.scrollHeight; }

  /* options: [label, handler] buttons, or {text, href, wa} links */
  function options(list) {
    var box = el('div', 'da-opts');
    if (lead && lead.paused) list = [['להמשיך בבדיקת התאריך', resume]].concat(list);
    list.forEach(function (o) {
      var n;
      if (Array.isArray(o)) {
        n = el('button', '', o[0]); n.type = 'button';
        n.addEventListener('click', function () { me(o[0]); o[1](); });
      } else {
        n = el('a', o.wa ? 'da-wa' : '', o.text); n.href = o.href;
        if (o.wa || /^https:/.test(o.href)) { n.target = '_blank'; n.rel = 'noopener'; }
        if (o.wa) n.addEventListener('click', trackWhatsApp);
        if (/^tel:/.test(o.href)) n.addEventListener('click', trackPhone);
      }
      box.appendChild(n);
    });
    log.appendChild(box);
    if (lead && !lead.paused) log.scrollTop = log.scrollHeight;
  }
  function track(name, payload) {
    try { if (window.weddingAnalyticsConsent === true && typeof window.gtag === 'function') window.gtag('event', name, payload); } catch (e) {}
  }
  /* Same event names as wedding-leads.js, so GA4 and the Meta pixel count these clicks. Never includes typed text. */
  function trackContact(name, method) {
    var payload = { placement: 'site-agent', page: location.pathname.split('/').pop() || 'index.html', contact_method: method };
    try { window.dispatchEvent(new CustomEvent(name, { detail: payload })); } catch (e) {}
    track(name, payload);
  }
  function trackWhatsApp() { trackContact('wedding_whatsapp_click', 'whatsapp'); }
  function trackPhone() { trackContact('phone_click', 'phone'); }
  function waLink(text) { return 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(text); }

  function topicButtons(list) {
    return list.map(function (m) { return [m[0], function () { answer(m[1]); }]; });
  }
  function menu(extra) {
    options((extra || []).concat(topicButtons(MENU), [['עוד שאלות', function () { say('הנה עוד נושאים:'); options(topicButtons(MORE)); }]]));
  }
  /* one gentle invitation, after the visitor has read two answers */
  function followUp(first) {
    var list = first || [];
    answers++;
    if (answers === 2 && !nudged && !lead) {
      nudged = true;
      say('רוצים לדעת אם התאריך שלכם פנוי? שולחים תאריך ומקום, ודור חוזר אליכם בהקדם, בדרך כלל עוד באותו יום.');
    }
    if (!lead) list.push(['בדיקת תאריך', function () { startLead(); }]);
    list.push(['שאלה אחרת', function () { say('בשמחה, מה לבדוק?'); menu(); }]);
    options(list);
  }

  function showPackages() {
    var m = say('חבילות החתונה (לחצו לפירוט ולמחיר):');
    options(PACKAGES.map(function (p) { return [p.name, function () { showPackage(p); }]; })
      .concat([['כל המחירים', showAllPrices]]));
    reveal(m);
  }
  function packageLead(p) {
    return ['בדיקת זמינות ל־' + p.name, function () { startLead({ event: 'חתונה', pack: p.name }); }];
  }
  function showPackage(p) {
    var m = say(p.name + '\n' + p.items.map(function (i) { return '• ' + i; }).join('\n'));
    options([
      ['הצג מחיר', function () {
        track('price_reveal', { placement: 'site-agent:' + p.name, page: location.pathname.split('/').pop() || 'index.html' });
        var r = say('מחיר ‏' + p.name + '‏: ' + p.price + ' ₪ כולל מע״מ\n(מחיר רגיל ' + p.regular + ' ₪)' + (p.extra ? '\n' + p.extra : ''));
        followUp([packageLead(p), ['חבילות נוספות', showPackages]]); reveal(r);
      }],
      packageLead(p),
      ['חבילות נוספות', showPackages]
    ]);
    reveal(m);
  }
  function showAllPrices() {
    track('price_reveal', { placement: 'site-agent:all', page: location.pathname.split('/').pop() || 'index.html' });
    var m = say(PACKAGES.map(function (p) { return '‏' + p.name + '‏: ' + p.price + ' ₪ (רגיל ' + p.regular + ' ₪)'; }).join('\n') + '\nכולל מע״מ. הצעה אישית לפני סגירה.');
    followUp([['פירוט החבילות', showPackages], { text: 'לעמוד המחירון', href: './weddings-prices.html#packages' }]);
    reveal(m);
  }

  function answer(id, question) {
    if (id === 'prices') return showPackages();
    if (id === 'date') return lead ? resume() : startLead();
    var topic = TOPICS.filter(function (t) { return t.id === id; })[0];
    var ask = { text: 'שליחת השאלה לדור בוואטסאפ', href: waLink('היי דור, הגעתי מהאתר. ' + (question || 'יש לי שאלה:')), wa: true };
    if (id === 'hello') { say('היי! מזל טוב אם יש שמחה בדרך 🙂 במה אפשר לעזור?'); return menu(); }
    if (id === 'thanks') { say('בשמחה 💛 עוד משהו?'); return menu(lead ? [] : [['בדיקת תאריך', function () { startLead(); }]]); }
    if (id === 'human') {
      say('בטח. הכי מהיר בוואטסאפ, ואפשר גם להתקשר:');
      return options([
        { text: 'וואטסאפ לדור', href: waLink('היי דור, הגעתי מהאתר ואשמח לדבר.'), wa: true },
        { text: 'להתקשר: 050-285-8162', href: 'tel:+' + PHONE },
        ['שאלה אחרת', function () { say('בשמחה, מה לבדוק?'); menu(); }]
      ]);
    }
    if (!topic || !topic.text) {
      say('על זה אין לי תשובה מוכנה, אבל לדור יש. שלחו לו את השאלה, או בחרו נושא:');
      return menu([ask]);
    }
    var m = say(topic.text), first = [];
    if (topic.wa) first.push(ask);
    if (topic.link) first.push({ text: topic.link.text, href: topic.link.href });
    if (topic.lead && !lead) first.push([topic.lead, function () { startLead(); }]);
    followUp(first);
    reveal(m);
  }

  /* ---------- short questionnaire, sent straight to Dor ---------- */
  var EVENTS = ['חתונה', 'חינה', 'בר/בת מצווה', 'ברית/ה', 'אירוסין', 'אירוע חברה', 'אירוע אחר'];
  var GUESTS = ['עד 100', '100 עד 200', '200 עד 350', '350 עד 500', 'מעל 500'];
  var SERVICES = ['סטילס', 'וידאו', 'מגנטים', 'אלבומים'];
  var STYLES = ['טבעי וספונטני', 'זוגי ומבוים', 'קלאסי ומשפחתי', 'שילוב של הכול', 'עוד לא בטוחים'];
  var FIELDS = ['event', 'date', 'place', 'guests', 'services', 'style'];
  var LABELS = { event: 'אירוע', date: 'תאריך', place: 'מקום', guests: 'מוזמנים', services: 'שירותים', style: 'סגנון', pack: 'חבילה' };
  var cancel = ['ביטול', function () { lead = null; resetInput(); cta.hidden = false; say('בוטל. אפשר לשאול כל שאלה.'); menu(); }];

  function startLead(preset) {
    lead = { data: {} };
    if (preset) Object.keys(preset).forEach(function (k) { lead.data[k] = preset[k]; });
    nextStep();
  }
  function resume() { lead.paused = false; nextStep(); }
  function set(key, value) { lead.data[key] = value; nextStep(); }
  function choice(label, key, value) { return [label, function () { set(key, value === undefined ? label : value); }]; }
  function toContact() {
    FIELDS.forEach(function (f) { if (!(f in lead.data)) lead.data[f] = ''; });
    nextStep();
  }

  function nextStep() {
    var d = lead.data;
    var step = FIELDS.filter(function (f) { return !(f in d); })[0];
    resetInput(); cta.hidden = true;
    if (!step) return finish();
    lead.step = step;
    var count = ' (' + (FIELDS.indexOf(step) + 1) + '/' + FIELDS.length + ')';
    var extra = ('place' in d) ? [['לדלג לסוף', toContact], cancel] : [cancel];
    if (step === 'event') {
      say('מעולה, כמה שאלות קצרות. איזה אירוע?');
      return options(EVENTS.map(function (e) { return choice(e, 'event'); }).concat(extra));
    }
    if (step === 'date') {
      var now = new Date(), pad = function (n) { return (n < 10 ? '0' : '') + n; };
      input.type = 'date'; input.min = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
      input.setAttribute('aria-label', 'תאריך האירוע');
      say('מה התאריך? בחרו בשדה למטה ולחצו ״שליחה״.' + count);
      return options([choice('עוד אין תאריך', 'date', 'עוד לא נקבע')].concat(extra));
    }
    if (step === 'place') {
      input.placeholder = 'אולם או עיר'; input.setAttribute('aria-label', 'מקום האירוע');
      say('איפה האירוע?' + count);
      return options([choice('עוד לא סגרנו', 'place', 'עוד לא נקבע')].concat(extra));
    }
    if (step === 'guests') {
      input.placeholder = 'מספר מוזמנים'; input.inputMode = 'numeric'; input.setAttribute('aria-label', 'כמות מוזמנים');
      say('כמה מוזמנים בערך?' + count);
      return options(GUESTS.map(function (g) { return choice(g, 'guests'); })
        .concat([choice('עוד לא יודעים', 'guests', 'עוד לא ידוע')], extra));
    }
    if (step === 'services') return askServices(extra, count);
    say('איזה סגנון צילום אתם מחפשים?' + count);
    options(STYLES.map(function (x) { return choice(x, 'style'); }).concat(extra));
  }

  /* several services can be picked before continuing */
  function askServices(extra, count) {
    var picked = {};
    say('במה אתם מתעניינים? אפשר לבחור כמה.' + count);
    options([]);
    var box = log.lastChild;
    function button(label, cls, run) {
      var b = el('button', cls, label); b.type = 'button'; b.addEventListener('click', run); box.appendChild(b); return b;
    }
    SERVICES.forEach(function (name) {
      var b = button(name, '', function () { picked[name] = !picked[name]; b.setAttribute('aria-pressed', String(picked[name])); });
      b.setAttribute('aria-pressed', 'false');
    });
    button('הכול יחד', '', function () { me('הכול יחד'); set('services', 'הכול: ' + SERVICES.join(', ')); });
    button('המשך ←', 'da-go', function () {
      var list = SERVICES.filter(function (n) { return picked[n]; }).join(', ');
      me(list || 'עוד לא יודעים'); set('services', list || 'עוד לא ידוע');
    });
    extra.forEach(function (o) { button(o[0], '', function () { me(o[0]); o[1](); }); });
    log.scrollTop = log.scrollHeight;
  }

  function finish() {
    var d = lead.data; lead = null; resetInput(); cta.hidden = true;
    var lines = ['event', 'date', 'place', 'guests', 'services', 'style', 'pack']
      .filter(function (k) { return d[k]; }).map(function (k) { return LABELS[k] + ': ' + d[k]; });
    say('מוכן! לחצו על הכפתור הירוק ואז ״שליחה״ בוואטסאפ, ודור יחזור אליכם בהקדם, בדרך כלל עוד באותו יום.\n' + lines.join('\n') + '\n\nהתאריך נשמר רק לפי הסכם.');
    options([
      { text: 'שליחה לדור בוואטסאפ', href: waLink('היי דור, הגעתי מהאתר ואשמח לבדוק זמינות.\n' + lines.join('\n')), wa: true },
      ['תיקון פרטים', function () { startLead(); }],
      ['שאלה אחרת', function () { cta.hidden = false; say('בשמחה, מה לבדוק?'); menu(); }]
    ]);
    log.scrollTop = log.scrollHeight;
  }

  function handle(text) {
    if (lead && !lead.paused) {
      if (/[?؟]\s*$/.test(text)) { lead.paused = true; resetInput(); cta.hidden = false; return answer(match(text), text); }
      if (lead.step === 'date' && input.type === 'date') {
        if (input.min && text < input.min) {
          say('התאריך הזה כבר עבר. בחרו תאריך אחר.');
          return options([choice('עוד אין תאריך', 'date', 'עוד לא נקבע'), cancel]);
        }
        return set('date', text.split('-').reverse().join('.'));
      }
      if (['place', 'guests', 'services', 'style'].indexOf(lead.step) > -1) return set(lead.step, text);
      lead.paused = true; cta.hidden = false; /* typed a question while choosing from buttons */
    }
    if (!lead) cta.hidden = false; /* a question typed after the questionnaire ended */
    var id = match(text), pack = packageIn(text);
    if (pack && (!id || id === 'prices')) return showPackage(pack);
    answer(id, text);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var value = input.value.trim();
    if (!value) { input.focus(); return; }
    me(lead && !lead.paused && input.type === 'date' ? value.split('-').reverse().join('.') : value);
    input.value = '';
    handle(value);
  });

  /* keep the input above the on-screen keyboard on phones */
  function fit() {
    var v = window.visualViewport;
    if (!v || panel.hidden || window.innerWidth > 760) { panel.style.height = ''; panel.style.bottom = ''; return; }
    var hidden = Math.max(0, window.innerHeight - v.height - v.offsetTop);
    panel.style.bottom = hidden + 'px';
    panel.style.height = hidden > 80 ? v.height + 'px' : '';
  }
  if (window.visualViewport) { window.visualViewport.addEventListener('resize', fit); window.visualViewport.addEventListener('scroll', fit); }

  var started = false;
  function dropTeaser() { var t = document.querySelector('.da-teaser'); if (t) t.remove(); }
  function open() {
    dropTeaser();
    panel.hidden = false; launch.hidden = true;
    if (!started) {
      started = true; resetInput();
      say('היי! כאן אפשר לשאול על חבילות, מחירים, מגנטים ואירועים, ולבדוק אם התאריך שלכם פנוי.');
      menu(); log.scrollTop = 0;
    }
    track('site_agent_open', { page: location.pathname.split('/').pop() || 'index.html' });
    fit(); close.focus();
  }
  function shut() { panel.hidden = true; launch.hidden = false; launch.focus(); }
  launch.addEventListener('click', open);
  close.addEventListener('click', shut);
  panel.addEventListener('keydown', function (e) { if (e.key === 'Escape') shut(); });
  ctaDate.addEventListener('click', function () { me('בדיקת תאריך פנוי'); if (lead) resume(); else startLead(); });
  ctaWa.href = waLink('היי דור, הגעתי מהאתר ואשמח לבדוק זמינות. תאריך: __, מקום: __');
  ctaWa.addEventListener('click', trackWhatsApp);

  /* a single small invitation per visit, only if the chat was not opened and no other window is showing */
  setTimeout(function () {
    var seen = false;
    try { seen = sessionStorage.getItem('da-teaser') === '1'; } catch (e) {}
    if (seen || started || document.querySelector('.dfp-back, dialog[open]')) return;
    try { sessionStorage.setItem('da-teaser', '1'); } catch (e) {}
    var box = el('div', 'da-teaser');
    var go = el('button', '', 'מתכננים אירוע? בדקו אם התאריך שלכם פנוי ←'); go.type = 'button';
    var no = el('button', 'da-no', '×'); no.type = 'button'; no.setAttribute('aria-label', 'סגירת ההודעה');
    go.addEventListener('click', function () { open(); me('בדיקת תאריך פנוי'); startLead(); });
    no.addEventListener('click', dropTeaser);
    box.appendChild(go); box.appendChild(no); document.body.appendChild(box);
    setTimeout(dropTeaser, 15000);
  }, 30000);
}());
