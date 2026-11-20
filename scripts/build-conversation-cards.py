"""Build the branded PDF from the website's canonical English questions.

Requires reportlab, pypdf, Pillow, Poppler and Rubik regular/bold TTF fonts.
No generated full PDF is stored in the public website directory.
"""
import argparse
import json
import re
import subprocess
from pathlib import Path
from xml.sax.saxutils import escape

from PIL import Image, ImageDraw
from pypdf import PdfReader
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph

ROOT = Path(__file__).resolve().parents[1]
BLUE = colors.HexColor('#192847')
RED = colors.HexColor('#ba3428')
MUTED = colors.HexColor('#5c6574')
CUT = colors.HexColor('#99a3af')
WEBSITE = 'unick-academy.pl'
PAGE_WIDTH, PAGE_HEIGHT = A4
MARGIN, GAP = 28, 10
CARD_WIDTH = (PAGE_WIDTH - 2 * MARGIN - GAP) / 2
CARD_HEIGHT = (PAGE_HEIGHT - 94 - 4 * GAP) / 5


def source_themes():
    code = """
const fs = require('fs'), ts = require('typescript');
const source = fs.readFileSync('src/app/lib/conversation-cards.ts','utf8');
const code = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const data = {exports:{}};
new Function('exports','module',code)(data.exports,data);
process.stdout.write(JSON.stringify(data.exports.conversationThemes));
"""
    result = subprocess.run(['node', '-e', code], cwd=ROOT, check=True, capture_output=True, text=True)
    return json.loads(result.stdout)


def card(pdf, x, y, question, theme, number, logo):
    pdf.setStrokeColor(CUT)
    pdf.setLineWidth(.5)
    pdf.setDash(2, 2)
    pdf.roundRect(x, y, CARD_WIDTH, CARD_HEIGHT, 5, fill=0, stroke=1)
    pdf.setDash()
    pdf.setStrokeColor(RED)
    pdf.setLineWidth(1.5)
    pdf.line(x + 12, y + CARD_HEIGHT - 1, x + CARD_WIDTH - 12, y + CARD_HEIGHT - 1)
    pdf.drawImage(logo, x + 12, y + CARD_HEIGHT - 32, width=58, height=25.36)
    pdf.setFillColor(MUTED)
    pdf.setFont('Rubik', 8)
    pdf.drawRightString(x + CARD_WIDTH - 12, y + CARD_HEIGHT - 17, f'{number:02}' if number else 'Pass it on')
    pdf.setFillColor(RED)
    pdf.setFont('RubikBold', 8.2)
    pdf.drawString(x + 12, y + CARD_HEIGHT - 46, theme)
    if question:
        style = ParagraphStyle('question', fontName='RubikBold', fontSize=13.2, leading=17, textColor=BLUE)
        paragraph = Paragraph(escape(question), style)
        _, height = paragraph.wrap(CARD_WIDTH - 24, 100)
        available = CARD_HEIGHT - 73
        assert height <= available, (number, height, available)
        paragraph.drawOn(pdf, x + 12, y + 22 + (available - height) / 2)
    else:
        pdf.setStrokeColor(colors.HexColor('#c3c8d0'))
        pdf.setLineWidth(.5)
        for offset in [34, 53, 72]:
            pdf.line(x + 12, y + offset, x + CARD_WIDTH - 12, y + offset)
        pdf.setFont('Rubik', 7.5)
        pdf.setFillColor(MUTED)
        pdf.drawString(x + 12, y + CARD_HEIGHT - 60, 'Asked by:')
    pdf.setFillColor(MUTED)
    pdf.setFont('Rubik', 7.5)
    pdf.drawCentredString(x + CARD_WIDTH / 2, y + 9, WEBSITE)
    pdf.linkURL('https://' + WEBSITE, (x + 45, y + 5, x + CARD_WIDTH - 45, y + 19), relative=0)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--font-dir', type=Path, required=True)
    parser.add_argument('--poppler-bin', type=Path, required=True)
    parser.add_argument('--output-dir', type=Path, required=True)
    args = parser.parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    proofs = args.output_dir / 'proofs'
    proofs.mkdir(exist_ok=True)
    for name, file in [('Rubik', 'Rubik-Regular.ttf'), ('RubikBold', 'Rubik-Bold.ttf')]:
        pdfmetrics.registerFont(TTFont(name, str(args.font_dir / file)))
    themes = source_themes()
    assert len(themes) == 10 and sum(len(t['questions']) for t in themes) == 100
    sheets = themes + [{'title': {'en': 'Your own questions'}, 'questions': [None] * 10}]
    path = args.output_dir / 'conversation-cards.pdf'
    pdf = canvas.Canvas(str(path), pagesize=A4, pageCompression=1)
    pdf.setTitle('Conversation Cards | uNick Academy')
    pdf.setAuthor('uNick Academy')
    pdf.setSubject('100 questions in English and 10 blank cards. A4, print at 100% scale.')
    logo = ImageReader(str(ROOT / 'public/brand/unick-academy-logo.png'))
    for page, sheet in enumerate(sheets, 1):
        pdf.setFillColor(BLUE)
        pdf.setFont('RubikBold', 16)
        pdf.drawString(MARGIN, PAGE_HEIGHT - 27, 'Conversation Cards')
        pdf.setFont('Rubik', 8.5)
        pdf.setFillColor(MUTED)
        pdf.drawRightString(PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 25, sheet['title']['en'])
        for index, question in enumerate(sheet['questions']):
            x = MARGIN + (index % 2) * (CARD_WIDTH + GAP)
            y = PAGE_HEIGHT - 47 - CARD_HEIGHT - (index // 2) * (CARD_HEIGHT + GAP)
            card(pdf, x, y, question, sheet['title']['en'], (page - 1) * 10 + index + 1 if question else None, logo)
        pdf.setFont('Rubik', 7.5)
        pdf.setFillColor(MUTED)
        pdf.drawString(MARGIN, 22, 'Print at 100% scale. Cut along the dashed lines. Skip any question you prefer.')
        pdf.drawRightString(PAGE_WIDTH - MARGIN, 22, f'{page} / {len(sheets)}')
        pdf.showPage()
    pdf.save()
    reader = PdfReader(path)
    assert len(reader.pages) == 11
    for index, page in enumerate(reader.pages):
        text = re.sub(r'\s+', ' ', page.extract_text())
        for question in sheets[index]['questions']:
            if question:
                assert question in text, question
        assert text.count(WEBSITE) == 10
        assert len(page['/Annots']) == 10
        assert abs(float(page.mediabox.width) - PAGE_WIDTH) < .01
    subprocess.run([str(args.poppler_bin / 'pdftoppm'), '-jpeg', '-r', '110', str(path), str(proofs / 'page')], check=True)
    images = sorted(proofs.glob('page-*.jpg'))
    assert len(images) == 11
    for start in range(0, len(images), 6):
        board = Image.new('RGB', (1350, 1304), '#e9edf2')
        draw = ImageDraw.Draw(board)
        for position, image_path in enumerate(images[start:start + 6]):
            image = Image.open(image_path).convert('RGB')
            image.thumbnail((430, 609))
            x, y = (position % 3) * 450 + 10, (position // 3) * 652 + 26
            board.paste(image, (x, y))
            draw.text((x, y - 18), f'Page {start + position + 1}', fill='#192847')
        board.save(args.output_dir / f'Print-proof-{start // 6 + 1:02}.jpg', quality=94)
    first = Image.open(images[0]).convert('RGB').resize((893, 1263), Image.Resampling.LANCZOS)
    first.save(ROOT / 'public/lesson-materials/samples/conversation-cards.webp', quality=91, method=6)
    print(f'Verified {len(reader.pages)} A4 pages, 100 unchanged questions, 10 blank cards, and 110 website links: {path}')


if __name__ == '__main__':
    main()
