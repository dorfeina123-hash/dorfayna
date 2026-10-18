"""Private owner administration + capability links + email-verified signing.
Run from this directory: uvicorn app:app --host 127.0.0.1 --port 8787
Production requires HTTPS, persistent DATA_DIR and authenticated SMTP.
"""
import base64, hashlib, hmac, io, json, os, re, secrets, smtplib, sqlite3, time
from datetime import date, datetime, timezone
from contextlib import contextmanager
from decimal import Decimal
from email.message import EmailMessage
from pathlib import Path
from threading import Lock
from urllib.parse import urlparse
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from PIL import Image, ImageChops
from pdf_document import make_pdf

ROOT = Path(__file__).parent
DATA = Path(os.getenv('DATA_DIR', ROOT/'data')).resolve(); DATA.mkdir(parents=True, exist_ok=True)
DB = DATA/'agreements.sqlite'
PUBLIC_URL = os.getenv('PUBLIC_URL', 'http://127.0.0.1:8787').rstrip('/')
OWNER = os.getenv('OWNER_EMAIL', 'mmdorldor@gmail.com')
PASSWORD = os.getenv('ADMIN_PASSWORD', '')
if len(PASSWORD) < 20: raise RuntimeError('ADMIN_PASSWORD must contain at least 20 characters')
SECURE = os.getenv('COOKIE_SECURE', 'true').lower() == 'true'
PACKAGES = json.loads((ROOT/'assets/packages.json').read_text(encoding='utf-8'))
LOCK = Lock()
LIMITS = {}
app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)

@contextmanager
def db():
    con = sqlite3.connect(DB, timeout=10); con.row_factory = sqlite3.Row
    try:
        with con: yield con
    finally: con.close()
with db() as con:
    con.executescript('''
    CREATE TABLE IF NOT EXISTS agreements(id TEXT PRIMARY KEY, token_hash TEXT UNIQUE,
      snapshot TEXT NOT NULL, digest TEXT NOT NULL, expires REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending', signed_at TEXT, signer TEXT,
      signature BLOB, pdf BLOB, code_hash TEXT, code_until REAL, attempts INTEGER DEFAULT 0,
      mail_status TEXT DEFAULT 'not_sent', mail_error TEXT);
    CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, expires REAL NOT NULL);
    ''')

def digest(value): return hashlib.sha256(value.encode()).hexdigest()
def limited(key, maximum, seconds=600):
    now = time.time()
    with LOCK:
        if len(LIMITS) > 10000:
            for k in list(LIMITS):
                if now - LIMITS[k][0] > 3600: LIMITS.pop(k, None)
        started, count = LIMITS.get(key, (now, 0))
        if now-started > seconds: started, count = now, 0
        if count >= maximum: raise HTTPException(429, 'נסו שוב מאוחר יותר')
        LIMITS[key] = (started, count+1)

@app.middleware('http')
async def security(request, call_next):
    if request.method == 'POST' and request.headers.get('origin') != PUBLIC_URL:
        return Response('Origin denied', status_code=403)
    if request.method == 'POST':
        try: limited(('request', request.client.host), 100)
        except HTTPException as e: return JSONResponse({'detail':e.detail},status_code=e.status_code)
        try: length = int(request.headers.get('content-length', '0'))
        except ValueError: return Response('Invalid length',status_code=400)
        if length > 350000:
            return Response('Request too large', status_code=413)
    response = await call_next(request)
    response.headers.update({'Cache-Control':'no-store', 'Referrer-Policy':'no-referrer',
      'X-Content-Type-Options':'nosniff', 'X-Frame-Options':'DENY',
      'Content-Security-Policy':"default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'"})
    return response

def admin(request):
    token = request.cookies.get('owner_session', '')
    with db() as con: row = con.execute('SELECT expires FROM sessions WHERE token_hash=?', (digest(token),)).fetchone()
    if not row or row['expires'] < time.time(): raise HTTPException(401, 'נדרשת כניסה')

def agreement(token, allow_signed=False):
    with db() as con: row = con.execute('SELECT * FROM agreements WHERE token_hash=?', (digest(token),)).fetchone()
    if not row: raise HTTPException(404, 'הקישור אינו תקף')
    if row['status'] == 'revoked': raise HTTPException(410, 'הקישור בוטל')
    if row['expires'] < time.time(): raise HTTPException(410, 'הקישור פג תוקף')
    if row['status'] == 'signed' and not allow_signed: raise HTTPException(409, 'ההסכם כבר נחתם')
    return row

def smtp_ready(): return bool(os.getenv('SMTP_HOST') and os.getenv('MAIL_FROM'))
def mail(to, subject, text, pdf=None):
    if not smtp_ready(): raise RuntimeError('שירות המייל טרם הוגדר')
    m = EmailMessage(); m['From'] = os.environ['MAIL_FROM']; m['To'] = to; m['Subject'] = subject
    m.set_content(text)
    if pdf: m.add_attachment(pdf, maintype='application', subtype='pdf', filename='signed-agreement.pdf')
    with smtplib.SMTP(os.environ['SMTP_HOST'], int(os.getenv('SMTP_PORT', '587')), timeout=20) as server:
        server.starttls()
        if os.getenv('SMTP_USER'): server.login(os.environ['SMTP_USER'], os.environ['SMTP_PASSWORD'])
        server.send_message(m)

class Login(BaseModel): password: str = Field(max_length=200)
@app.post('/api/login')
def login(data: Login, request: Request, response: Response):
    limited(('login', request.client.host), 8)
    if not hmac.compare_digest(data.password.encode(), PASSWORD.encode()): raise HTTPException(401, 'פרטי הכניסה אינם נכונים')
    token = secrets.token_urlsafe(32)
    with db() as con: con.execute('INSERT INTO sessions VALUES(?,?)', (digest(token), time.time()+8*3600))
    response.set_cookie('owner_session', token, httponly=True, secure=SECURE, samesite='strict', max_age=28800)
    return {'ok': True}

@app.post('/api/logout')
def logout(request: Request, response: Response):
    with db() as con: con.execute('DELETE FROM sessions WHERE token_hash=?', (digest(request.cookies.get('owner_session','')),))
    response.delete_cookie('owner_session'); return {'ok': True}

class Extra(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    quantity: int = Field(ge=1, le=100)
    price: Decimal = Field(ge=0, le=100000, decimal_places=2)
    gift: bool = False
    details: str = Field(default='', max_length=500)
class Order(BaseModel):
    customer: str = Field(min_length=2, max_length=120)
    email: str = Field(max_length=254)
    phone: str = Field(min_length=6, max_length=30)
    date: date
    venue: str = Field(min_length=2, max_length=200)
    package: str
    start: str = Field(pattern=r'^(?:[01]\d|2[0-3]):[0-5]\d$')
    end: str = Field(pattern=r'^(?:[01]\d|2[0-3]):[0-5]\d$')
    price: Decimal = Field(gt=0, le=1000000, decimal_places=2)
    deposit: Decimal = Field(ge=0, decimal_places=2)
    discount: Decimal = Field(default=0, ge=0, decimal_places=2)
    extras: list[Extra] = Field(default_factory=list, max_length=30)
    notes: str = Field(default='', max_length=2000)

def build_snapshot(order):
    if order.package not in PACKAGES: raise HTTPException(422, 'חבילה לא מוכרת')
    if not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', order.email): raise HTTPException(422, 'כתובת המייל אינה תקינה')
    if any(not x.gift and x.price <= 0 for x in order.extras): raise HTTPException(422, 'נדרש מחיר לכל תוספת בתשלום')
    total = order.price + sum(x.quantity*x.price for x in order.extras if not x.gift)-order.discount
    if total <= 0 or order.deposit > total: raise HTTPException(422, 'מחיר או מקדמה אינם תקינים')
    terms = []
    for section in PACKAGES[order.package]:
        terms.append([(kind, text) for kind, text in section if not re.match(r'^(שמות המזמינים|דוא״ל לקבלת ההסכם|סוג האירוע|מקום האירוע וכתובתו|מקום התארגנות|איש קשר ביום האירוע|צלם סטילס ראשי:|צלם סטילס נוסף:|וידאו:|מגנטים:|מחיר בסיס החבילה|מחיר החבילה הכולל|מקדמה במועד|תשלום ביום האירוע:|יתרה:|מזמין ראשון:|מזמין שני אם|הספק דור פיינה:|עותק ההסכם המאושר יימסר|___)',text)])
    label = {'standard':'Standard - סטילס','premium':'Premium - סטילס, וידאו ואלבומים','premium-plus':'Premium Plus - כולל מגנטים','diamond':'Diamond - החבילה המלאה','custom':'אירוע בהתאמה אישית'}[order.package]
    summary = [f'המזמין: {order.customer}', f'דוא״ל: {order.email} | טלפון: {order.phone}',
      f'תאריך: {order.date} | מקום: {order.venue}', f'חבילה: {label} | שעות: {order.start} עד {order.end}',
      f'מחיר החבילה כולל מע״מ: {order.price:,.2f} ₪ | הנחה: {order.discount:,.2f} ₪',
      f'מחיר סופי כולל מע״מ: {total:,.2f} ₪ | מקדמה: {order.deposit:,.2f} ₪ | יתרה: {total-order.deposit:,.2f} ₪']
    for x in order.extras:
        summary.append(f'{x.title} | כמות {x.quantity} | '+('מתנה ללא חיוב' if x.gift else f'מחיר יחידה {x.price:,.2f} ₪ | סך הכול {x.price*x.quantity:,.2f} ₪')+f' | {x.details}')
    if order.notes: summary.append('הסכמות מיוחדות: '+order.notes)
    summary.append('פרטי ההזמנה והמחיר הסופי לעיל גוברים על מחירי הבסיס בתבנית. המקדמה אינה נחשבת משולמת מעצם החתימה.')
    return {'customer':order.customer, 'email':order.email, 'summary':summary, 'terms':terms,
      'created_at':datetime.now(timezone.utc).isoformat(), 'total':str(total)}

@app.get('/api/admin/agreements')
def list_agreements(request: Request):
    admin(request)
    with db() as con: rows = con.execute('SELECT id,snapshot,status,signed_at,mail_status,expires FROM agreements ORDER BY rowid DESC LIMIT 200').fetchall()
    return {'mail_ready':smtp_ready(), 'agreements':[{'id':r['id'],'customer':json.loads(r['snapshot'])['customer'], 'status':r['status'],'mail_status':r['mail_status'],'signed_at':r['signed_at']} for r in rows]}

@app.post('/api/admin/agreements')
def create(order: Order, request: Request):
    admin(request)
    if not smtp_ready(): raise HTTPException(503, 'יש לחבר שירות מייל לפני יצירת קישור לחתימה')
    snapshot = build_snapshot(order); serialized = json.dumps(snapshot, ensure_ascii=False, sort_keys=True)
    token, id = secrets.token_urlsafe(32), secrets.token_hex(12)
    with db() as con: con.execute('INSERT INTO agreements(id,token_hash,snapshot,digest,expires) VALUES(?,?,?,?,?)', (id,digest(token),serialized,digest(serialized),time.time()+7*86400))
    return {'id':id,'url':PUBLIC_URL+'/sign/'+token,'digest':digest(serialized), 'snapshot':snapshot}

@app.post('/api/admin/agreements/{id}/revoke')
def revoke(id: str, request: Request):
    admin(request)
    with db() as con:
        result = con.execute("UPDATE agreements SET status='revoked' WHERE id=? AND status='pending'",(id,))
        if result.rowcount != 1: raise HTTPException(409, 'ניתן לבטל רק הסכם הממתין לחתימה')
    return {'ok': True}

@app.get('/api/sign/{token}')
def view(token: str):
    row = agreement(token, True); s=json.loads(row['snapshot'])
    return {'summary':s['summary'],'terms':s['terms'],'digest':row['digest'],'status':row['status'],'mail_status':row['mail_status']}

@app.post('/api/sign/{token}/code')
def code(token: str, request: Request):
    row = agreement(token); limited(('code',row['id']),3)
    pin = str(secrets.randbelow(900000)+100000)
    with db() as con: con.execute('UPDATE agreements SET code_hash=?,code_until=?,attempts=0 WHERE id=?', (digest(token+pin),time.time()+600,row['id']))
    try: mail(json.loads(row['snapshot'])['email'],'קוד אימות לחתימת ההסכם עם דור פיינה',f'קוד האימות שלך: {pin}\nהקוד תקף לעשר דקות. אין להעבירו לאחרים.')
    except Exception:
        with db() as con: con.execute('UPDATE agreements SET code_hash=NULL WHERE id=?',(row['id'],))
        raise HTTPException(503, 'שליחת קוד האימות נכשלה. ההסכם לא נחתם.')
    return {'ok': True}

class Sign(BaseModel):
    name: str = Field(min_length=2,max_length=120)
    code: str = Field(pattern=r'^\d{6}$')
    agreement_digest: str = Field(min_length=64,max_length=64)
    signature: str = Field(max_length=300000)
    accepted: bool
    marketing: bool

@app.post('/api/sign/{token}/complete')
def complete(token: str, data: Sign):
    row = agreement(token)
    if not data.accepted or data.agreement_digest != row['digest']: raise HTTPException(409,'יש לאשר את הגרסה המוצגת')
    with db() as con:
        attempt = con.execute("UPDATE agreements SET attempts=attempts+1 WHERE id=? AND attempts<5 AND status='pending' AND code_hash=?",(row['id'],row['code_hash']))
    if not attempt.rowcount or not row['code_hash'] or row['code_until'] < time.time() or not hmac.compare_digest(row['code_hash'],digest(token+data.code)):
        raise HTTPException(403,'קוד האימות אינו תקף')
    try:
        if not data.signature.startswith('data:image/png;base64,'): raise ValueError()
        raw = base64.b64decode(data.signature.split(',',1)[1],validate=True)
        im = Image.open(io.BytesIO(raw))
        if im.format != 'PNG' or im.width > 1500 or im.height > 800 or im.width < 20 or im.height < 20: raise ValueError()
        im.load()
        rgba = im.convert('RGBA')
        white = Image.new('RGBA',rgba.size,'white')
        white.alpha_composite(rgba)
        if ImageChops.difference(white.convert('RGB'),Image.new('RGB',rgba.size,'white')).getbbox() is None: raise ValueError()
    except Exception: raise HTTPException(422,'יש לצייר חתימה תקינה')
    at = datetime.now(timezone.utc).isoformat()
    evidence = [f'שם החותם: {data.name}',f'מועד חתימה UTC: {at}',f'מזהה הסכם: {row["id"]}',
      'אימות: קוד חד־פעמי למייל שהוגדר בהזמנה',f'אישור פרסום: {"מאשר" if data.marketing else "אינו מאשר"}',f'SHA256: {row["digest"]}']
    pdf = make_pdf(json.loads(row['snapshot']),raw,evidence)
    with db() as con:
        result = con.execute("UPDATE agreements SET status='signed',signed_at=?,signer=?,signature=?,pdf=?,code_hash=NULL,mail_status='pending' WHERE id=? AND status='pending' AND code_hash=? AND code_until>?",(at,data.name,raw,pdf,row['id'],row['code_hash'],time.time()))
        if result.rowcount != 1: raise HTTPException(409,'ההסכם כבר טופל')
    deliver(row['id'])
    return {'ok': True, 'status':'signed','pdf_url':PUBLIC_URL+'/api/sign/'+token+'/pdf'}

def deliver(id):
    # Claim before sending. An ambiguous SMTP outcome is NOT retried automatically.
    with db() as con:
        claimed = con.execute("UPDATE agreements SET mail_status='sending' WHERE id=? AND mail_status='pending'",(id,))
        if not claimed.rowcount: return
        row=con.execute('SELECT * FROM agreements WHERE id=?',(id,)).fetchone()
    try:
        s=json.loads(row['snapshot'])
        mail(s['email'],'תודה שבחרתם בדור פיינה — ההסכם החתום שלכם',f'שלום {s["customer"]},\nתודה שבחרתם בנו לתעד את האירוע שלכם!\nמצורף ההסכם החתום, כולל הפרטים שסיכמנו.\nנשמח ללוות אתכם וליצור זיכרונות שתאהבו.\nדור פיינה | 050-2858162',row['pdf'])
        mail(OWNER,'הסכם חתום חדש — '+s['customer'],'מצורף ההסכם החתום. תשלום המקדמה דורש אימות נפרד.',row['pdf'])
        status='sent'
    except Exception: status='needs_review'
    with db() as con: con.execute('UPDATE agreements SET mail_status=? WHERE id=?',(status,id))

@app.get('/api/sign/{token}/pdf')
def client_pdf(token: str):
    row=agreement(token,True)
    if not row['pdf']: raise HTTPException(409,'ההסכם טרם נחתם')
    return Response(row['pdf'],media_type='application/pdf',headers={'Content-Disposition':'attachment; filename="signed-agreement.pdf"'})

@app.get('/api/admin/agreements/{id}/pdf')
def owner_pdf(id: str, request: Request):
    admin(request)
    with db() as con: row=con.execute('SELECT pdf FROM agreements WHERE id=?',(id,)).fetchone()
    if not row or not row['pdf']: raise HTTPException(404,'אין מסמך חתום')
    return Response(row['pdf'],media_type='application/pdf',headers={'Content-Disposition':'attachment; filename="signed-agreement.pdf"'})

app.mount('/static', StaticFiles(directory=ROOT/'static'),name='static')
@app.get('/')
def owner_page(): return FileResponse(ROOT/'static/admin.html')
@app.get('/sign/{token}')
def client_page(token: str):
    agreement(token,True)
    return FileResponse(ROOT/'static/client.html')
