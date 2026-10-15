import base64, io, json, os, re, tempfile, unittest
from pathlib import Path
from unittest.mock import patch
from PIL import Image, ImageDraw
from fastapi.testclient import TestClient

temporary = tempfile.TemporaryDirectory()
os.environ.update(DATA_DIR=temporary.name, ADMIN_PASSWORD='synthetic-test-password-only', COOKIE_SECURE='false', PUBLIC_URL='http://testserver')
import app as service

class SigningTests(unittest.TestCase):
    def setUp(self):
        service.LIMITS.clear()
        with service.db() as con:
            con.execute('DELETE FROM agreements'); con.execute('DELETE FROM sessions')
        self.messages=[]
        self.patches=[patch.object(service,'smtp_ready',return_value=True),patch.object(service,'mail',side_effect=lambda *a:self.messages.append(a))]
        for p in self.patches:p.start()
        self.client=TestClient(service.app,headers={'Origin':'http://testserver'})
        self.assertEqual(self.client.post('/api/login',json={'password':os.environ['ADMIN_PASSWORD']}).status_code,200)
        self.order=dict(customer='לקוח בדיקה בלבד',email='synthetic@example.invalid',phone='0500000000',date='2027-02-18',venue='אולם בדיקה',package='standard',start='15:00',end='01:00',price=7500,deposit=1500,discount=0,extras=[dict(title='מגנטים',quantity=1,price=1500,gift=False),dict(title='אלבום במתנה',quantity=1,price=400,gift=True)],notes='הסכם בדיקה בלבד; אינו עסקה אמיתית.')
    def tearDown(self):
        self.client.close()
        for p in reversed(self.patches):p.stop()
    def create(self):
        r=self.client.post('/api/admin/agreements',json=self.order)
        self.assertEqual(r.status_code,200,r.text)
        d=r.json();return d,d['url'].rsplit('/',1)[1]
    def payload(self,d,token,blank=False):
        self.assertEqual(self.client.post('/api/sign/'+token+'/code',json={}).status_code,200)
        code=re.search(r'\d{6}',self.messages[-1][2]).group()
        im=Image.new('RGB',(500,160),'white')
        if not blank: ImageDraw.Draw(im).line([(40,100),(100,30),(180,120),(350,50)],fill='black',width=5)
        b=io.BytesIO();im.save(b,format='PNG')
        return dict(name='לקוח בדיקה',code=code,agreement_digest=d['digest'],signature='data:image/png;base64,'+base64.b64encode(b.getvalue()).decode(),accepted=True,marketing=False)
    def test_auth_and_origin(self):
        anonymous=TestClient(service.app,headers={'Origin':'http://testserver'})
        self.assertEqual(anonymous.get('/api/admin/agreements').status_code,401)
        self.assertEqual(anonymous.post('/api/admin/agreements',json=self.order).status_code,401)
        self.assertEqual(self.client.post('/api/admin/agreements',json=self.order,headers={'Origin':'https://attacker.invalid'}).status_code,403)
    def test_server_totals_and_invalid_order(self):
        d,t=self.create();self.assertEqual(d['snapshot']['total'],'9000')
        self.assertIn('מקדמה: 1,500.00',str(d['snapshot']['summary']))
        self.order['deposit']=10000
        self.assertEqual(self.client.post('/api/admin/agreements',json=self.order).status_code,422)
        self.order['deposit']=0;self.order['start']='99:99'
        self.assertEqual(self.client.post('/api/admin/agreements',json=self.order).status_code,422)
    def test_full_signing_is_immutable_and_one_time(self):
        d,t=self.create();p=self.payload(d,t)
        r=self.client.post('/api/sign/'+t+'/complete',json=p);self.assertEqual(r.status_code,200,r.text)
        self.assertEqual(len(self.messages),3)
        self.assertEqual(self.messages[1][3],self.messages[2][3])
        self.assertTrue(self.messages[1][3].startswith(b'%PDF'))
        self.assertEqual(self.client.post('/api/sign/'+t+'/complete',json=p).status_code,409)
        self.assertEqual(len(self.messages),3)
        self.assertEqual(self.client.get('/api/sign/'+t).json()['mail_status'],'sent')
        self.assertEqual(self.client.get('/api/sign/'+t+'/pdf').content,self.messages[1][3])
        with service.db() as con:self.assertEqual(json.loads(con.execute('SELECT snapshot FROM agreements').fetchone()[0]),d['snapshot'])
        output=os.getenv('DEMO_PDF')
        if output:Path(output).write_bytes(self.messages[1][3])
    def test_wrong_digest_and_code_lockout(self):
        d,t=self.create();p=self.payload(d,t);correct=p['code']
        p['agreement_digest']='0'*64
        self.assertEqual(self.client.post('/api/sign/'+t+'/complete',json=p).status_code,409)
        p['agreement_digest']=d['digest'];p['code']='000000'
        for _ in range(5):self.assertEqual(self.client.post('/api/sign/'+t+'/complete',json=p).status_code,403)
        p['code']=correct
        self.assertEqual(self.client.post('/api/sign/'+t+'/complete',json=p).status_code,403)
        self.assertEqual(len(self.messages),1)
    def test_blank_signature_and_missing_consent(self):
        d,t=self.create();p=self.payload(d,t,True)
        self.assertEqual(self.client.post('/api/sign/'+t+'/complete',json=p).status_code,422)
        p['accepted']=False
        self.assertEqual(self.client.post('/api/sign/'+t+'/complete',json=p).status_code,409)
    def test_revocation_and_expiry(self):
        d,t=self.create()
        self.assertEqual(self.client.post('/api/admin/agreements/'+d['id']+'/revoke',json={}).status_code,200)
        self.assertEqual(self.client.get('/api/sign/'+t).status_code,410)
        d,t=self.create()
        with service.db() as con:con.execute('UPDATE agreements SET expires=0 WHERE id=?',(d['id'],))
        self.assertEqual(self.client.get('/api/sign/'+t).status_code,410)
    def test_mail_failure_preserves_pdf_without_retry(self):
        d,t=self.create();p=self.payload(d,t)
        with patch.object(service,'mail',side_effect=RuntimeError('simulated delivery failure')):
            self.assertEqual(self.client.post('/api/sign/'+t+'/complete',json=p).status_code,200)
        self.assertEqual(self.client.get('/api/sign/'+t).json()['mail_status'],'needs_review')
        self.assertEqual(self.client.get('/api/admin/agreements/'+d['id']+'/pdf').status_code,200)
        service.deliver(d['id']);self.assertEqual(len(self.messages),1)
    def test_mail_missing_blocks_customer_links(self):
        with patch.object(service,'smtp_ready',return_value=False):
            self.assertEqual(self.client.post('/api/admin/agreements',json=self.order).status_code,503)

if __name__=='__main__':unittest.main()
