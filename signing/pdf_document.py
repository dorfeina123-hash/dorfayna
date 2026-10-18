import io
from pathlib import Path
from bidi.algorithm import get_display
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader

ROOT = Path(__file__).parent
pdfmetrics.registerFont(TTFont('Hebrew', str(ROOT / 'assets/NotoSansHebrew-Regular.ttf')))

def make_pdf(snapshot, signature=None, evidence=None):
    output = io.BytesIO()
    c = canvas.Canvas(output, pagesize=(595, 842))
    c.setTitle('Dor Fayna Photography - agreement')
    page, y = 0, 0
    def new_page():
        nonlocal page, y
        if page: c.showPage()
        page += 1
        c.drawImage(str(ROOT/'static/logo-black.png'), 45, 770, 180, 62, preserveAspectRatio=True)
        c.setFont('Hebrew', 9)
        c.drawRightString(550, 28, get_display(f'דור פיינה | עמוד {page}'))
        y = 746
    def paragraph(text, size=11):
        nonlocal y
        if size >= 14 and y < 140: new_page()
        words, line, lines = str(text).split(), '', []
        for word in words:
            trial = (line+' '+word).strip()
            if line and pdfmetrics.stringWidth(get_display(trial), 'Hebrew', size) > 500:
                lines.append(line); line = word
            else: line = trial
        if line: lines.append(line)
        for line in lines:
            if y < 62: new_page()
            c.setFont('Hebrew', size)
            c.drawRightString(550, y, get_display(line)); y -= size*1.5
        y -= 7
    new_page()
    paragraph('הסכם אישי להזמנת שירותי צילום', 19)
    for line in snapshot['summary']: paragraph(line)
    paragraph('תנאי ההזמנה', 15)
    for section in snapshot['terms']:
        for kind, text in section: paragraph(text, 14 if kind != 'p' else 10.5)
    if signature:
        if y < 210: new_page()
        paragraph('חתימת המזמין ואישור ההסכם', 15)
        c.drawImage(ImageReader(io.BytesIO(signature)), 250, y-90, 280, 85, preserveAspectRatio=True, mask='auto')
        y -= 105
        for line in evidence: paragraph(line, 9)
    c.save()
    return output.getvalue()
