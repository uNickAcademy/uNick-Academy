"""Repairs The Teenpreneur Journal print PDF (v4 -> v5).

Usage:  python3 fix_journal.py <input.pdf> <output.pdf>
Needs:  pip install pymupdf qrcode[pil]
Fonts:  fonts/ holds Gochi Hand and Lora (the fonts the book was made with).

What it does, in order:
  1. Moves the accent bar so it no longer runs through the first line of text (pp 3, 5, 8, 57, 61, 66, 71, 75, 80).
  2. Removes the duplicate footer line (pp 21-24, 27-30).
  3. Fixes text: "moreexperienced" (p71), the Apple credit (p4), the page 88 heading, the page 92 title overlap,
     and the author line (p4).
  4. Adds four pages so the book stays a multiple of four: wellbeing page, project log, notes, and a closing page.
The original file is never modified.
"""
import io
import os
import re
import sys

import pymupdf as fitz
import qrcode

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "..", "tools", "assets")
SRC, OUT = sys.argv[1], sys.argv[2]

doc = fitz.open(SRC)
orig = fitz.open(SRC)  # untouched copy, used to lift images for the new pages
log = []

# ------------------------------------------------------------------ fonts
FONT_FILES = {
    "gochi": "GochiHand_400Regular.ttf",
    "lora": "Lora_400Regular.ttf",
    "lorai": "Lora_400Regular_Italic.ttf",
    "lorab": "Lora_700Bold.ttf",
}
FONTS = {k: fitz.Font(fontfile=os.path.join(HERE, "fonts", v)) for k, v in FONT_FILES.items()}
_font_done = set()


def use_font(page, key):
    # one embed per page and font; identical copies are merged when saving (garbage=4)
    tag = (id(page.parent), page.xref, key)
    if tag not in _font_done:
        page.insert_font(fontname=key, fontfile=os.path.join(HERE, "fonts", FONT_FILES[key]))
        _font_done.add(tag)


def put(page, x, y, text, key, size, color):
    use_font(page, key)
    page.insert_text((x, y), text, fontname=key, fontsize=size, color=color)


def key_for(fontname):
    if "Gochi" in fontname:
        return "gochi"
    if "Italic" in fontname:
        return "lorai"
    if "Bold" in fontname:
        return "lorab"
    return "lora"


def rgb(i):
    return (((i >> 16) & 255) / 255, ((i >> 8) & 255) / 255, (i & 255) / 255)


def wrap(text, key, size, width):
    lines, cur = [], ""
    for w in text.split():
        t = (cur + " " + w).strip()
        if FONTS[key].text_length(t, fontsize=size) <= width:
            cur = t
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def redact(page, rects, images=fitz.PDF_REDACT_IMAGE_NONE, graphics=fitz.PDF_REDACT_LINE_ART_NONE):
    for r in rects:
        page.add_redact_annot(fitz.Rect(r))
    page.apply_redactions(images=images, graphics=graphics, text=fitz.PDF_REDACT_TEXT_REMOVE)


def find_span(page, needle):
    for b in page.get_text("dict")["blocks"]:
        if b["type"] != 0:
            continue
        for l in b["lines"]:
            for s in l["spans"]:
                if needle in s["text"]:
                    return s
    raise SystemExit(f"text not found on page {page.number + 1}: {needle!r}")


def replace_span(page, needle, new_text, dy=0.0):
    s = find_span(page, needle)
    r = fitz.Rect(s["bbox"])
    redact(page, [fitz.Rect(r.x0 + 0.3, r.y0 + 0.3, r.x1 - 0.3, r.y1 - 0.3)])
    ox, oy = s["origin"]
    put(page, ox, oy + dy, new_text, key_for(s["font"]), s["size"], rgb(s["color"]))


# ------------------------------------------------------------------ 1. accent bars
BAR_PAGES = [3, 5, 8, 57, 61, 66, 71, 75, 80]
for pn in BAR_PAGES:
    p = doc[pn - 1]
    bar = [im for im in p.get_image_info(xrefs=True) if im["width"] == 1434 and im["height"] == 50][0]
    b = fitz.Rect(bar["bbox"])
    tops = []
    for bl in p.get_text("dict")["blocks"]:
        if bl["type"] != 0:
            continue
        for l in bl["lines"]:
            r = fitz.Rect(l["bbox"])
            if "".join(s["text"] for s in l["spans"]).strip() and r.y1 > b.y0 + 0.5 and r.y0 < b.y1 - 0.5 and r.x1 > b.x0 and r.x0 < b.x1:
                tops.append(r.y0)
    new_y1 = min(tops) - 5
    shift_local = (b.y1 - new_y1) / 0.24  # content stream units (page scale is 0.24)
    rx = re.compile(r"(-?[\d.]+) (-?[\d.]+) (1434\.375) (53\.125) re(\s+W\*\s+n\s+(?:EMC\s+)?q\s+)1434\.375 0 0 -53\.125 (-?[\d.]+) (-?[\d.]+) cm")
    done = False
    for xr in p.get_contents():
        s = doc.xref_stream(xr).decode("latin1")
        for m in rx.finditer(s):
            if abs(float(m.group(7)) - b.y1 / 0.24) < 3:
                new = "%s %s %s %s re%s1434.375 0 0 -53.125 %s %s cm" % (
                    m.group(1), "%.5f" % (float(m.group(2)) - shift_local), m.group(3), m.group(4), m.group(5),
                    m.group(6), "%.5f" % (float(m.group(7)) - shift_local))
                s = s[:m.start()] + new + s[m.end():]
                doc.update_stream(xr, s.encode("latin1"))
                done = True
                break
        if done:
            break
    if not done:
        raise SystemExit(f"bar not found in stream on page {pn}")
    log.append(f"p{pn}: accent bar moved up {b.y1 - new_y1:.1f} pt so it clears the text")

# ------------------------------------------------------------------ 2. duplicate footers
for p in doc:
    extra = []
    for bl in p.get_text("dict")["blocks"]:
        if bl["type"] != 0:
            continue
        for l in bl["lines"]:
            for s in l["spans"]:
                if s["text"].strip() == "The Teenpreneur Journal" and s["origin"][0] > 100:
                    extra.append(fitz.Rect(s["bbox"]))
    if extra:
        redact(p, [fitz.Rect(r.x0 + 0.3, r.y0 + 0.3, r.x1 - 0.3, r.y1 - 0.3) for r in extra])
        log.append(f"p{p.number + 1}: removed the duplicate 'The Teenpreneur Journal' footer line")

# ------------------------------------------------------------------ 3. text fixes
p4 = doc[3]
replace_span(p4, "Steve Jobs", "— Apple, Think Different (1997)")
log.append("p4: quote credit changed from Steve Jobs to Apple, Think Different (1997)")
s1 = find_span(p4, "Home educator of two teenagers")
s2 = find_span(p4, "and underdogs")
for s, t in ((s1, "Home educator of two teenagers • Founder of uNickorns and uNick Academy •"),
             (s2, "Lover of dogs and underdogs • Former teen who felt… just like you.")):
    r = fitz.Rect(s["bbox"])
    redact(p4, [fitz.Rect(r.x0 + 0.3, r.y0 + 0.3, r.x1 - 0.3, r.y1 - 0.3)])
    put(p4, s["origin"][0], s["origin"][1], t, "gochi", s["size"], rgb(s["color"]))
log.append("p4: author line now names uNickorns and uNick Academy, and the missing bullet before 'Lover of dogs' is back")

replace_span(doc[70], "moreexperienced", "You don’t have to wait until you’re older, smarter, or more experienced to")
log.append("p71: 'moreexperienced' now reads 'more experienced'")

replace_span(doc[87], "MIDDLE FINGER", "  SHOW PERFECTIONISM THE DOOR")
log.append("p88: heading 'Give perfectionism the middle finger' is now 'Show perfectionism the door'")

replace_span(doc[91], "EMERGENCY DOUBT-BUSTING TOOLKIT", "EMERGENCY DOUBT-BUSTING TOOLKIT", dy=-13)
log.append("p92: title moved up so the subtitle no longer overlaps it")

# ------------------------------------------------------------------ 4. new pages
def lift(xref):
    """Pull an image (with its transparency) out of the untouched copy as PNG bytes."""
    pix = fitz.Pixmap(orig, xref)
    sm = orig.extract_image(xref).get("smask", 0)
    if sm:
        pix = fitz.Pixmap(pix, fitz.Pixmap(orig, sm))
    return pix.tobytes("png")


BAND = lift(1020)      # pink title band (from p86)
BAR = lift(1019)       # coral accent bar (from p86)
CALLOUT = lift(1018)   # pink callout box with coral edge (from p86)
CORAL, BROWN, GREY, NAVY, BLUE = rgb(0xD46C47), rgb(0x51483B), rgb(0x9A9283), rgb(0x2C2647), rgb(0x3E75A2)
RULE = (0.8824, 0.8588, 0.8275)
LEFT, RIGHT = 57.2, 380.0


def new_page(template_pno, number, wipe=True):
    doc.fullcopy_page(template_pno - 1, -1)
    p = doc[-1]
    boxes = [fitz.Rect(500, 500, 501, 501)]
    if wipe:
        boxes = [fitz.Rect(0, 55, 437.25, 568)]
    # page number box
    boxes.append(fitz.Rect(370, 573, 400, 586))
    for r in boxes:
        p.add_redact_annot(r)
    p.apply_redactions(images=fitz.PDF_REDACT_IMAGE_REMOVE if wipe else fitz.PDF_REDACT_IMAGE_NONE,
                       graphics=fitz.PDF_REDACT_LINE_ART_REMOVE_IF_TOUCHED if wipe else fitz.PDF_REDACT_LINE_ART_NONE,
                       text=fitz.PDF_REDACT_TEXT_REMOVE)
    put(p, 375.4, 580.6, str(number), "gochi", 8, CORAL)
    return p


def header(p, title, subtitle):
    p.insert_image(fitz.Rect(18, 57, 438, 157), stream=BAND)
    put(p, LEFT, 77.5, title, "gochi", 21, BROWN)
    y = 104.6
    for ln in wrap(subtitle, "lorai", 9.5, RIGHT - LEFT):
        put(p, LEFT, y, ln, "lorai", 9.5, GREY)
        y += 12.7
    p.insert_image(fitz.Rect(52, 172, 396, 184.8), stream=BAR)


def para(p, y, text, key="lora", size=9.5, color=BROWN, lh=14.6, x=LEFT, width=RIGHT - LEFT):
    for ln in wrap(text, key, size, width):
        put(p, x, y, ln, key, size, color)
        y += lh
    return y


def heading(p, y, text):
    put(p, LEFT, y, text, "gochi", 10.5, CORAL)
    return y + 15


def bullets(p, y, items, lh=14.6):
    for t in items:
        lines = wrap(t, "lora", 9.5, RIGHT - LEFT - 14)
        put(p, LEFT + 2, y, "•", "lora", 9.5, CORAL)
        for ln in lines:
            put(p, LEFT + 14, y, ln, "lora", 9.5, BROWN)
            y += lh
    return y


base = len(doc)  # 92

# --- p93: wellbeing
p = new_page(86, base + 1)
header(p, "If things feel too heavy", "For the days when it feels like more than a bad day.")
y = 206
y = para(p, y, "This journal can help you notice your thoughts and feelings. It cannot replace people, and it is not a substitute for professional support.") + 5
y = para(p, y, "If you feel low, anxious or hopeless for more than a couple of weeks, or the thoughts get heavy, tell someone today. You can start with one sentence: “I’m not okay and I need some help.”") + 8
y = heading(p, y, "WHO YOU CAN TALK TO")
y = bullets(p, y, ["A parent, carer or another adult you trust.", "A teacher, mentor or school counsellor.", "Your doctor.", "A friend, and then an adult together."]) + 8
y = heading(p, y, "IF YOU NEED SOMEONE RIGHT NOW")
y = para(p, y, "If you are in danger or might hurt yourself, call your local emergency number straight away: 112 in the EU, 999 in the UK, 911 in the US.") + 3
y = bullets(p, y, ["UK: Childline, 0800 1111.", "US: 988 Suicide and Crisis Lifeline. Call or text 988.", "Poland: Telefon Zaufania dla Dzieci i Młodzieży, 116 111.", "Anywhere else: findahelpline.com lists services by country."]) + 6
y = para(p, y, "Asking for help is the brave thing, as chapter 14 says. Helpline details can change, so check they are current.", key="lorai", size=9, color=GREY, lh=13)
assert y < 566, f"wellbeing page overflows: {y}"
log.append("p93 (new): 'If things feel too heavy', a short page pointing teens to a trusted adult, a doctor and helplines")

# --- p94: project log
p = new_page(86, base + 2)
header(p, "My Project Log", "From idea to something real. One page per project. Messy is fine.")
put(p, LEFT, 207, "PROJECT NAME", "gochi", 10.5, CORAL)
p.draw_line((LEFT + 80, 207.5), (RIGHT + 14, 207.5), color=RULE, width=0.8)
sections = [("THE IDEA", "the problem, and who it is for"), ("MY FIRST VERSION", "what I made, and how fast"),
            ("FEEDBACK I GOT", "who I asked, what they said"), ("WHAT FAILED", "and what it told me"),
            ("WHAT I CHANGED", ""), ("THE FINAL PROJECT", "what I am showing the world"),
            ("WHAT I LEARNED ABOUT MYSELF", "")]
y = 232
for label, hint in sections:
    put(p, LEFT, y, label, "gochi", 10.5, CORAL)
    if hint:
        put(p, LEFT + FONTS["gochi"].text_length(label, fontsize=10.5) + 8, y, hint, "lorai", 8.5, GREY)
    for k in (1, 2):
        p.draw_line((LEFT, y + 4 + k * 15.5), (RIGHT + 14, y + 4 + k * 15.5), color=RULE, width=0.8)
    y += 47.5
assert y < 566, f"project log overflows: {y}"
log.append("p94 (new): 'My Project Log', mirrors the Portfolio of Proof steps on the course page")

# --- p95: notes (copy of the lined page 85)
p = new_page(85, base + 3, wipe=False)
log.append("p95 (new): a lined notes page")

# --- p96: closing page
p = new_page(86, base + 4)
header(p, "Keep going.", "This journal is the inner game. Now go and build something real.")
y = para(p, 206, "Teenpreneurs is a live online programme for teenagers aged 13 to 18. Real projects, a small international group, and a Portfolio of Proof of what you made. No business idea needed.") + 10
put(p, LEFT, y + 6, "Not made to blend in.", "gochi", 19, BROWN)
put(p, LEFT, y + 28, "Made to create.", "gochi", 19, CORAL)
qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=10, border=1)
qr.add_data("https://unickorns.com")
qr.make(fit=True)
buf = io.BytesIO()
qr.make_image(fill_color="#0b1326", back_color="white").save(buf, format="PNG")
p.insert_image(fitz.Rect(LEFT, 352, LEFT + 88, 440), stream=buf.getvalue())
put(p, LEFT, 458, "Find out more", "gochi", 10.5, CORAL)
put(p, LEFT, 474, "unickorns.com", "lorab", 11, NAVY)
p.insert_image(fitz.Rect(LEFT - 4, 500, LEFT + 146, 500 + 150 * 333 / 1000), filename=os.path.join(ASSETS, "wordmark.png"))
mh = 232
p.insert_image(fitz.Rect(RIGHT - mh * 747 / 1120 + 14, 566 - mh, RIGHT + 14, 566), filename=os.path.join(ASSETS, "mascot.png"))
log.append("p96 (new): closing page with the uNickorns wordmark, mascot, programme line and a QR code to unickorns.com")

# ------------------------------------------------------------------ save
doc.set_metadata({**doc.metadata, "title": "The Teenpreneur Journal (print ready v5)"})
doc.save(OUT, garbage=4, deflate=True)
print(f"saved {OUT}: {len(doc)} pages")
with open(os.path.join(HERE, "CHANGES_v5.txt"), "w", encoding="utf-8") as f:
    f.write("The Teenpreneur Journal, v4 to v5\n\n" + "\n".join("- " + l for l in log) + "\n")
print("\n".join(log))
