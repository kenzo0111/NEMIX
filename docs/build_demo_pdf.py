from pathlib import Path
import re
import html
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.pagesizes import A4
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output' / 'pdf' / 'NEMIX_Demo_Test_Script.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)
NAVY = colors.HexColor('#172D43')
TEAL = colors.HexColor('#087E8B')
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='DemoTitle', fontName='Helvetica-Bold', fontSize=26, leading=31, textColor=NAVY, spaceAfter=15))
styles.add(ParagraphStyle(name='DemoH1', fontName='Helvetica-Bold', fontSize=17, leading=22, textColor=NAVY, spaceBefore=14, spaceAfter=10, keepWithNext=True))
styles.add(ParagraphStyle(name='DemoH2', fontName='Helvetica-Bold', fontSize=12, leading=16, textColor=TEAL, spaceBefore=14, spaceAfter=8, keepWithNext=True))
styles.add(ParagraphStyle(name='DemoBody', fontName='Helvetica', fontSize=9.5, leading=14, spaceAfter=7))
styles.add(ParagraphStyle(name='DemoBullet', parent=styles['DemoBody'], leftIndent=12, firstLineIndent=-8))
styles.add(ParagraphStyle(name='DemoCell', fontName='Helvetica', fontSize=8, leading=11, spaceAfter=0, wordWrap='CJK'))
styles.add(ParagraphStyle(name='DemoHeadCell', parent=styles['DemoCell'], fontName='Helvetica-Bold', textColor=colors.white))

def inline(text):
    text = text.replace('\u2014', '-').replace('\u2013', '-').replace('\u2011', '-')
    text = text.replace('\u201c', '"').replace('\u201d', '"').replace('\u2019', "'")
    text = html.escape(text)
    text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
    return re.sub(r'`(.+?)`', r'<font color="#435668">\1</font>', text)

def para(text, style='DemoBody'):
    return Paragraph(inline(text), styles[style])

def footer(canvas, doc):
    canvas.saveState()
    w, h = A4
    canvas.setStrokeColor(colors.HexColor('#D4DEE6'))
    canvas.line(43, h-34, w-43, h-34)
    canvas.setFont('Helvetica-Bold', 8)
    canvas.setFillColor(NAVY)
    canvas.drawString(43, h-25, 'NEMIX  /  DEMO & ACCEPTANCE TEST')
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(colors.HexColor('#617386'))
    canvas.drawString(43, 26, 'Inventory  |  RFID  |  Reports')
    canvas.drawRightString(w-43, 26, f'{doc.page}')
    canvas.restoreState()

lines = (ROOT / 'docs' / 'DEMO_TEST_SCRIPT.md').read_text(encoding='utf-8').splitlines()
story = []
i = 0
width = A4[0] - 86
while i < len(lines):
    line = lines[i].strip()
    if not line:
        i += 1
        continue
    if line.startswith('|'):
        rows = []
        while i < len(lines) and lines[i].strip().startswith('|'):
            cells = [s.strip() for s in lines[i].strip().strip('|').split('|')]
            if not all(re.fullmatch(r':?-+:?', c) for c in cells):
                rows.append(cells)
            i += 1
        n = len(rows[0])
        if n == 2:
            widths = [width*.31, width*.69]
        elif n == 3:
            widths = [width*.12, width*.43, width*.45]
        elif rows[0][0] == 'Point in the demo':
            widths = [width*.37, width*.14, width*.23, width*.26]
        else:
            widths = [width*.24, width*.34, width*.25, width*.17]
        data = [[para(c, 'DemoHeadCell' if r == 0 else 'DemoCell') for c in row] for r, row in enumerate(rows)]
        table = Table(data, colWidths=widths, repeatRows=1, hAlign='LEFT')
        table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), NAVY),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#F1F5F8'), colors.white]),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LEFTPADDING', (0,0), (-1,-1), 8), ('RIGHTPADDING', (0,0), (-1,-1), 8),
            ('TOPPADDING', (0,0), (-1,-1), 7), ('BOTTOMPADDING', (0,0), (-1,-1), 7),
            ('LINEBELOW', (0,0), (-1,0), .7, TEAL),
            ('LINEBELOW', (0,1), (-1,-1), .3, colors.HexColor('#D9E2E9')),
        ]))
        story.extend([table, Spacer(1, 10)])
        continue
    if line.startswith('# '):
        story.append(para(line[2:], 'DemoTitle'))
    elif line.startswith('## '):
        if re.match(r'## [345689]\.', line):
            story.append(PageBreak())
        story.append(para(line[3:], 'DemoH1'))
    elif line.startswith('### '):
        story.append(para(line[4:], 'DemoH2'))
    elif line.startswith('- '):
        story.append(para('- ' + line[2:], 'DemoBullet'))
    elif re.match(r'^\d+\. ', line):
        story.append(para(line, 'DemoBullet'))
    else:
        story.append(para(line))
    i += 1

grouped = []
block = []
for flowable in story:
    is_heading = isinstance(flowable, Paragraph) and flowable.style.name in ['DemoH1', 'DemoH2']
    if is_heading or isinstance(flowable, PageBreak):
        if block:
            grouped.append(KeepTogether(block))
            block = []
        if isinstance(flowable, Paragraph) and flowable.style.name == 'DemoH2':
            block.append(flowable)
        else:
            grouped.append(flowable)
    elif block:
        block.append(flowable)
    else:
        grouped.append(flowable)
if block:
    grouped.append(KeepTogether(block))

doc = SimpleDocTemplate(str(OUT), pagesize=A4, rightMargin=43, leftMargin=43,
                        topMargin=48, bottomMargin=45,
                        title='NEMIX Demo Test Script', author='NEMIX',
                        subject='Inventory, RFID, and reporting demo and acceptance tests')
doc.build(grouped, onFirstPage=footer, onLaterPages=footer)
reader = PdfReader(OUT)
text = '\n'.join(page.extract_text() for page in reader.pages)
for required in ['INV-05', 'RFID-03', 'REP-04', 'VAL-10', '25,400.00', 'Project references']:
    assert required in text, required
print(f'Created {OUT} | {len(reader.pages)} pages | {OUT.stat().st_size} bytes')
