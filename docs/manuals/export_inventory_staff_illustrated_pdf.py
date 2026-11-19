"""Export the audited role manual without launching a desktop application.

The source DOCX is retained. ReportLab paginates the same content; Calibri is
used as the locally installed substitute for the reference's Aptos fonts.
"""
from pathlib import Path
from io import BytesIO
from copy import deepcopy
from xml.sax.saxutils import escape
import re
import json
import argparse
from datetime import datetime

from docx import Document
from docx.oxml.ns import qn
from docx.text.paragraph import Paragraph as WordParagraph
from docx.table import Table as WordTable
from pypdf import PdfReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Image,
    PageBreak, Table, TableStyle, KeepTogether,
)
from reportlab.platypus.tableofcontents import TableOfContents
from pdf2image import convert_from_path
from PIL import Image as PILImage, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / '.qa_inventory_staff_illustrated/Inventory_Staff_Illustrated_Source.docx'
OUTPUT = ROOT / 'SupplySync_Inventory_Staff_Manual.pdf'
parser = argparse.ArgumentParser()
parser.add_argument('--qa-dir', type=Path)
args = parser.parse_args()
QA = args.qa_dir or (ROOT / '.qa_inventory_staff_illustrated' / ('verified-pdf-' + datetime.now().strftime('%Y%m%d-%H%M%S')))
POPPLER = Path('C:/Users/Ramil/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin')
PAGE_W, PAGE_H = 8.27 * 72, 11.69 * 72
LEFT, RIGHT, TOP, BOTTOM = 0.75 * 72, 0.75 * 72, 0.72 * 72, 0.68 * 72
WIDTH = PAGE_W - LEFT - RIGHT

for family, file in [('Calibri', 'calibri.ttf'), ('Calibri-Bold', 'calibrib.ttf'),
                     ('Calibri-Italic', 'calibrii.ttf'), ('Calibri-BoldItalic', 'calibriz.ttf')]:
    pdfmetrics.registerFont(TTFont(family, str(Path('C:/Windows/Fonts') / file)))
pdfmetrics.registerFontFamily('Calibri', normal='Calibri', bold='Calibri-Bold',
                            italic='Calibri-Italic', boldItalic='Calibri-BoldItalic')

body_style = ParagraphStyle('Body', fontName='Calibri', fontSize=10.25,
                            leading=11.5, textColor=colors.HexColor('#111111'),
                            spaceAfter=4.5, allowWidows=0, allowOrphans=0)
heading_styles = {
    1: ParagraphStyle('Chapter', parent=body_style, fontName='Calibri-Bold', fontSize=18,
                      leading=21, spaceBefore=0, spaceAfter=8, keepWithNext=1),
    2: ParagraphStyle('Section', parent=body_style, fontName='Calibri-Bold', fontSize=14,
                      leading=16.5, spaceBefore=9, spaceAfter=5, keepWithNext=1),
    3: ParagraphStyle('Procedure', parent=body_style, fontName='Calibri-Bold', fontSize=11.5,
                      leading=14, spaceBefore=7, spaceAfter=4, keepWithNext=1),
}
table_style = ParagraphStyle('TableText', parent=body_style, fontSize=9, leading=10.6, spaceAfter=0)
table_head = ParagraphStyle('TableHead', parent=table_style, fontName='Calibri-Bold')
toc_styles = [
    ParagraphStyle('TOCChapter', parent=body_style, fontName='Calibri-Bold',
                   fontSize=10, leading=12, leftIndent=0, firstLineIndent=0, spaceBefore=3, spaceAfter=0),
    ParagraphStyle('TOCSection', parent=body_style, fontSize=9.5, leading=11.5,
                   leftIndent=12, firstLineIndent=0, spaceBefore=0, spaceAfter=0),
    ParagraphStyle('TOCProcedure', parent=body_style, fontSize=9.25, leading=11.25,
                   leftIndent=24, firstLineIndent=0, spaceBefore=0, spaceAfter=0),
]

def markup(p):
    text = []
    for r in p.runs:
        value = escape(r.text).replace('\n', '<br/>')
        if not value:
            continue
        if r.bold:
            value = '<b>' + value + '</b>'
        if r.italic:
            value = '<i>' + value + '</i>'
        text.append(value)
    return ''.join(text)

def picture(p, document):
    pics = []
    for drawing in p._element.xpath('.//wp:inline'):
        blip = drawing.xpath('.//a:blip')[0]
        rid = blip.get(qn('r:embed'))
        extent = drawing.find(qn('wp:extent'))
        width = int(extent.get('cx')) / 12700
        height = int(extent.get('cy')) / 12700
        pics.append(Image(BytesIO(document.part.related_parts[rid].blob), width=width, height=height, hAlign='CENTER'))
    return pics

def convert_table(word_table):
    matrix = []
    for ri, row in enumerate(word_table.rows):
        matrix.append([Paragraph('<br/>'.join(markup(p) or '&nbsp;' for p in c.paragraphs),
                                 table_head if ri == 0 else table_style) for c in row.cells])
    widths = [c.width.pt for c in word_table.rows[0].cells]
    widths = [w * WIDTH / sum(widths) for w in widths]
    table = Table(matrix, colWidths=widths, repeatRows=1, hAlign='LEFT', spaceBefore=4, spaceAfter=8)
    table.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#D1D5DB')),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F3F4F6')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 4.5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4.5),
        ('TOPPADDING', (0, 0), (-1, -1), 3.75),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3.75),
    ]))
    return table

def build_story():
    document = Document(SOURCE)
    story = []
    cover = True
    suppress_contents_instruction = False
    for child in document.element.body:
        if child.tag == qn('w:tbl'):
            story.append(convert_table(WordTable(child, document)))
            continue
        if child.tag != qn('w:p'):
            continue
        p = WordParagraph(child, document)
        txt = p.text.strip()
        style_name = p.style.name
        pf = p.paragraph_format
        page_break = bool(p._element.xpath('.//w:br[@w:type="page"]'))
        if txt == 'Contents' and style_name == 'Heading 1':
            story.append(Paragraph('Contents', heading_styles[1]))
            toc = TableOfContents()
            toc.levelStyles = toc_styles
            toc.dotsMinLevel = 0
            story.append(toc)
            suppress_contents_instruction = True
            continue
        if suppress_contents_instruction:
            if not (style_name == 'Heading 1' and re.match(r'1\.', txt)):
                continue
            suppress_contents_instruction = False
        if page_break:
            story.append(PageBreak())
            cover = False
            continue
        if not txt and not p._element.xpath('.//a:blip'):
            if cover:
                story.append(Spacer(1, 3))
            continue
        if cover:
            before = pf.space_before.pt if pf.space_before else 0
            if before:
                story.append(Spacer(1, before))
            pics = picture(p, document)
            if pics:
                story.extend(pics)
                continue
            if style_name == 'Title':
                cover_style = ParagraphStyle('CoverTitle', parent=body_style, fontName='Calibri-Bold',
                                             fontSize=28, leading=32, alignment=TA_CENTER, spaceAfter=8)
            elif style_name == 'Subtitle':
                cover_style = ParagraphStyle('CoverSubtitle', parent=body_style, fontSize=12.5,
                                             leading=15, alignment=TA_CENTER, textColor=colors.HexColor('#64748B'))
            else:
                first = next((r for r in p.runs if r.text), None)
                size = first.font.size.pt if first and first.font.size else 10.25
                color = str(first.font.color.rgb) if first and first.font.color.rgb else '111111'
                cover_style = ParagraphStyle('CoverText', parent=body_style, fontSize=size,
                                             leading=size * 1.2, alignment=TA_CENTER, textColor=colors.HexColor('#' + color))
            story.append(Paragraph(markup(p), cover_style))
            continue
        pics = picture(p, document)
        if pics:
            story.extend(pics)
            continue
        if style_name.startswith('Heading '):
            level = int(style_name.split()[-1])
            if level == 1 and pf.page_break_before is not False:
                story.append(PageBreak())
            h = Paragraph(markup(p), heading_styles[level])
            if re.match(r'^\d', txt):
                h.toc_level = min(level - 1, 1)
                h.heading_text = txt
            story.append(h)
            continue
        s = deepcopy(body_style)
        if pf.left_indent:
            s.leftIndent = pf.left_indent.pt
        if pf.first_line_indent:
            s.firstLineIndent = pf.first_line_indent.pt
        if pf.space_before:
            s.spaceBefore = pf.space_before.pt
        if pf.space_after:
            s.spaceAfter = pf.space_after.pt
        if style_name.startswith('List Bullet'):
            s.leftIndent = 18
            s.firstLineIndent = 0
            s.bulletIndent = 5
            s.spaceAfter = 2.5
            story.append(Paragraph(markup(p), s, bulletText='\u2022'))
        else:
            if txt.startswith('Figure INV-') or txt.startswith('Pointer ') or txt == 'Procedure:':
                s.keepWithNext = 1
            story.append(Paragraph(markup(p), s))
    grouped = []
    i = 0
    while i < len(story):
        item = story[i]
        if isinstance(item, Paragraph) and item.getPlainText().startswith('Figure INV-'):
            block = [item]
            i += 1
            while i < len(story):
                nxt = story[i]
                i += 1
                if isinstance(nxt, Paragraph) and nxt.getPlainText() == 'END FIGURE':
                    break
                block.append(nxt)
            grouped.append(KeepTogether(block))
        else:
            grouped.append(item)
            i += 1
    return grouped

class ManualPDF(BaseDocTemplate):
    def __init__(self, total_pages=0):
        super().__init__(str(OUTPUT), pagesize=(PAGE_W, PAGE_H),
                         leftMargin=LEFT, rightMargin=RIGHT, topMargin=TOP, bottomMargin=BOTTOM,
                         title='SupplySync Inventory Staff User Manual',
                         author='SupplySync Documentation Team')
        self.total_pages = total_pages
        self.heading_counter = 0
        self.heading_pages = []
        self.addPageTemplates(PageTemplate('Manual', [Frame(LEFT, BOTTOM, WIDTH, PAGE_H - TOP - BOTTOM,
                                                           leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)], self.chrome))

    def beforeDocument(self):
        self.heading_counter = 0
        self.heading_pages = []

    def afterFlowable(self, flowable):
        if hasattr(flowable, 'toc_level'):
            self.heading_counter += 1
            key = 'heading-' + str(self.heading_counter)
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(flowable.heading_text, key, flowable.toc_level, closed=False)
            self.notify('TOCEntry', (flowable.toc_level, flowable.heading_text, self.page, key))
            self.heading_pages.append({'text': flowable.heading_text, 'level': flowable.toc_level, 'page': self.page})

    def chrome(self, canvas, doc):
        if doc.page == 1:
            return
        canvas.saveState()
        canvas.setFont('Calibri', 8)
        canvas.setFillColor(colors.HexColor('#64748B'))
        canvas.drawRightString(PAGE_W - RIGHT, PAGE_H - 0.32 * 72, 'SupplySync  |  Inventory Staff Manual')
        total = str(self.total_pages) if self.total_pages else ''
        canvas.drawCentredString(PAGE_W / 2, 0.32 * 72, f'Controlled Copy  |  Version 1.1  |  Page {doc.page} of {total}')
        canvas.restoreState()

def main():
    QA.mkdir(parents=True, exist_ok=True)
    first = ManualPDF()
    first.multiBuild(build_story())
    page_count = len(PdfReader(OUTPUT).pages)
    final = ManualPDF(page_count)
    final.multiBuild(build_story())
    reader = PdfReader(OUTPUT)
    assert len(reader.pages) == page_count
    full_text = '\n'.join(p.extract_text() for p in reader.pages)
    assert 'Open this document in Microsoft Word and update' not in full_text
    assert 'Figure INV-62' in full_text
    assert 'Pointer 1:' in full_text
    assert 'does not insert live system images' not in full_text
    assert 'SCREENSHOT DIRECTION' not in full_text
    assert len(re.findall(r'Figure INV-\d\d', full_text)) == 62
    for entry in final.heading_pages:
        assert entry['text'].split(' ', 1)[0] in reader.pages[entry['page'] - 1].extract_text()
    for i, page in enumerate(reader.pages[1:], 2):
        assert f'Page {i} of {page_count}' in page.extract_text()
    pages = convert_from_path(str(OUTPUT), dpi=140, fmt='png', output_folder=str(QA),
                              output_file='render', paths_only=True, poppler_path=str(POPPLER), thread_count=4)
    for index, path in enumerate(pages, 1):
        target = QA / f'page-{index:02d}.png'
        Path(path).replace(target)
    for group in range(0, page_count, 6):
        sheet = PILImage.new('RGB', (1200, 1770), 'white')
        draw = ImageDraw.Draw(sheet)
        for offset in range(min(6, page_count - group)):
            num = group + offset + 1
            im = PILImage.open(QA / f'page-{num:02d}.png').convert('RGB')
            im.thumbnail((570, 548))
            x, y = (offset % 2) * 600 + 15, (offset // 2) * 590 + 25
            sheet.paste(im, (x, y))
            draw.text((x, y - 16), f'Page {num}', fill='black')
        sheet.save(QA / f'contact-{group // 6 + 1:02d}.png')
    report = {'pdf': str(OUTPUT), 'pages': page_count, 'headings': final.heading_pages,
              'font_substitution': 'Calibri substituted for Aptos because Aptos is not installed locally',
              'native_word_render': False, 'pdf_renderer': 'ReportLab; rasterized using Poppler at 140 dpi',
              'figures': 62, 'numbered_pointers': 219,
              'contents_and_page_numbers': 'Generated and checked in the PDF; Word fields remain deferred in the source DOCX'}
    (QA / 'validation.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps({k: v for k, v in report.items() if k != 'headings'}, indent=2))

if __name__ == '__main__':
    main()
