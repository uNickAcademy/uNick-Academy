"""Builds the sample creatives for the uNickorns Teenpreneurs campaign.

Run:  python3 build_samples.py
Swap tools/assets/ben-placeholder.jpg for a real photo of Ben to re-render everything.
Brand tokens come from unickorns.com (navy, coral, cream, Baloo 2 + Inter).
"""
import os
import subprocess
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "samples")
os.makedirs(OUT, exist_ok=True)

NAVY = (11, 19, 38)
NAVY_DEEP = (7, 17, 38)
CORAL = (255, 107, 74)
CORAL_INK = (198, 63, 38)
CREAM = (255, 245, 230)
BLUE = (0, 182, 255)
SEAFOAM = (45, 212, 191)
WHITE = (255, 255, 255)


def font(name, size):
    return ImageFont.truetype(os.path.join(HERE, "fonts", name), size)


def head(size):
    return font("Baloo2_800ExtraBold.ttf", size)


def sub(size):
    return font("Baloo2_700Bold.ttf", size)


def body(size, semi=False):
    return font("Inter_600SemiBold.ttf" if semi else "Inter_500Medium.ttf", size)


def wrap(draw, text, fnt, max_w):
    lines, cur = [], ""
    for word in text.split():
        trial = (cur + " " + word).strip()
        if draw.textlength(trial, font=fnt) <= max_w:
            cur = trial
        else:
            lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


def text_block(draw, xy, text, fnt, fill, max_w, line_h=1.08, align="left"):
    x, y = xy
    for line in wrap(draw, text, fnt, max_w):
        w = draw.textlength(line, font=fnt)
        px = x if align == "left" else x + (max_w - w) / 2
        draw.text((px, y), line, font=fnt, fill=fill)
        y += int(fnt.size * line_h)
    return y


def pill(draw, xy, label, fnt, bg, fg, pad=(28, 12)):
    x, y = xy
    w = draw.textlength(label, font=fnt)
    h = fnt.size
    draw.rounded_rectangle([x, y, x + w + pad[0] * 2, y + h + pad[1] * 2], radius=(h + pad[1] * 2) // 2, fill=bg)
    draw.text((x + pad[0], y + (h + pad[1] * 2) / 2), label, font=fnt, fill=fg, anchor="lm")
    return x + w + pad[0] * 2


def load(name):
    return Image.open(os.path.join(HERE, "assets", name)).convert("RGBA")


def paste_fit_width(canvas, img, x, y, width):
    r = width / img.width
    im = img.resize((width, int(img.height * r)), Image.LANCZOS)
    canvas.paste(im, (x, y), im)
    return im.size


WORDMARK = load("wordmark.png")
MASCOT = load("mascot.png")
BEN = load("ben-placeholder.jpg")


# ---------------------------------------------------------------- Post 1
def post_photo():
    W, H = 1080, 1350
    c = Image.new("RGBA", (W, H), NAVY)
    d = ImageDraw.Draw(c)
    ph = BEN.resize((W, int(BEN.height * W / BEN.width)), Image.LANCZOS)
    c.paste(ph, (0, 0))
    y0 = ph.height
    d.rectangle([0, y0, W, H], fill=NAVY)
    pill(d, (60, y0 + 48), "TEENPRENEURS  ·  AGES 13 TO 18", body(26, True), CORAL, NAVY)
    y = text_block(d, (60, y0 + 120), "Not made to blend in.", head(92), CREAM, W - 120, 1.0)
    d.text((60, y - 6), "Made to create.", font=head(92), fill=CORAL)
    d.text((60, y + 118), "A live online programme for teenagers who think sideways.", font=body(32), fill=CREAM)
    d.text((60, H - 120), "Live online, in English. Applications open.", font=body(30, True), fill=CREAM)
    paste_fit_width(c, WORDMARK, W - 60 - 250, H - 140, 250)
    return c.convert("RGB")


# ---------------------------------------------------------------- Post 2
def post_stat():
    W, H = 1080, 1350
    c = Image.new("RGBA", (W, H), NAVY)
    d = ImageDraw.Draw(c)
    d.text((60, 70), "EMPLOYERS EXPECT, BY 2030", font=sub(40), fill=BLUE)
    d.text((56, 110), "170M", font=head(270), fill=SEAFOAM)
    d.text((64, 440), "new jobs created", font=sub(64), fill=CREAM)
    d.text((56, 540), "92M", font=head(270), fill=CORAL)
    d.text((64, 870), "jobs displaced", font=sub(64), fill=CREAM)
    d.rectangle([60, 990, 260, 996], fill=CORAL)
    text_block(d, (60, 1030), "What will set young people apart: starting things, finishing things and working well with others.", body(34, True), CREAM, W - 120, 1.35)
    d.text((60, 1210), "Source: World Economic Forum, Future of Jobs Report 2025", font=body(22), fill=(160, 170, 195))
    pill(d, (60, 1250), "Teenpreneurs by uNickorns", body(26, True), CORAL, NAVY, pad=(26, 10))
    return c.convert("RGB")


# ---------------------------------------------------------------- Post 3
def post_mascot():
    W, H = 1080, 1350
    c = Image.new("RGBA", (W, H), CREAM)
    d = ImageDraw.Draw(c)
    d.ellipse([430, 330, 1230, 1130], fill=(255, 223, 214))
    m = MASCOT.resize((int(MASCOT.width * 1.05), int(MASCOT.height * 1.05)), Image.LANCZOS)
    c.paste(m, (W - m.width + 70, H - m.height + 40), m)
    d = ImageDraw.Draw(c)
    y = text_block(d, (60, 90), "Too much for school?", head(88), NAVY, 520, 0.98)
    y = text_block(d, (60, y + 24), "Just right for this.", head(88), CORAL_INK, 520, 0.98)
    text_block(d, (60, y + 40), "A live online programme for teens who think sideways. No business idea needed.", body(30, True), NAVY, 440, 1.4)
    paste_fit_width(c, WORDMARK, 60, H - 150, 260)
    return c.convert("RGB")


# ---------------------------------------------------------------- Post 4
def post_offer():
    W, H = 1080, 1350
    c = Image.new("RGBA", (W, H), CORAL)
    d = ImageDraw.Draw(c)
    d.rounded_rectangle([50, 50, W - 50, H - 50], radius=48, fill=NAVY)
    d.text((100, 100), "FOUNDING COHORT", font=sub(36), fill=CORAL)
    y = text_block(d, (100, 150), "24 seats. Two groups. One first edition.", head(88), CREAM, W - 200, 1.0)
    rows = [
        ("Starts", "12 and 13 January 2027"),
        ("Format", "Live online, 60 min a week, 16 weeks"),
        ("Group 1", "Tue 18:00 UK  ·  13:00 New York"),
        ("Group 2", "Wed 09:00 UK  ·  04:00 New York"),
        ("Price", "$70 / £50 / €60 a month, 4 payments"),
    ]
    y += 40
    for k, v in rows:
        d.text((100, y), k, font=body(28, True), fill=BLUE)
        d.text((290, y - 2), v, font=body(32, True), fill=CREAM)
        d.line([100, y + 56, W - 100, y + 56], fill=(40, 52, 82), width=2)
        y += 76
    text_block(d, (100, y + 20), "Build a real project with teens around the world. Finish with a Demo Day and your own Portfolio of Proof.", body(32, True), CREAM, W - 200, 1.4)
    text_block(d, (100, y + 170), "14 day money back guarantee. Free intro call on Zoom, 5 January 2027.", body(26), (190, 198, 215), W - 200, 1.4)
    pill(d, (100, H - 200), "Apply at unickorns.com", head(46), CORAL, NAVY, pad=(40, 14))
    return c.convert("RGB")


# ---------------------------------------------------------------- Post 5
def post_ideas():
    W, H = 1080, 1350
    c = Image.new("RGBA", (W, H), (217, 244, 255))
    d = ImageDraw.Draw(c)
    m = MASCOT.resize((int(MASCOT.width * 0.86), int(MASCOT.height * 0.86)), Image.LANCZOS)
    c.paste(m, (W - m.width + 20, H - m.height + 30), m)
    d = ImageDraw.Draw(c)
    y = text_block(d, (60, 90), "Ideas everywhere?", head(100), NAVY, 600, 0.98)
    y = text_block(d, (60, y + 20), "Good. Let's finish one.", head(100), CORAL_INK, 600, 0.98)
    text_block(d, (60, y + 44), "A live, hands on programme in small groups, for creative, intense, easily bored teens.", body(32, True), NAVY, 470, 1.4)
    paste_fit_width(c, WORDMARK, 60, H - 150, 260)
    return c.convert("RGB")


# ---------------------------------------------------------------- Post 6
def post_differentability():
    W, H = 1080, 1350
    c = Image.new("RGBA", (W, H), NAVY)
    d = ImageDraw.Draw(c)
    d.text((70, 110), "differentability", font=head(132), fill=CREAM)
    d.text((74, 270), "noun", font=body(34, True), fill=BLUE)
    y = text_block(d, (70, 360), "A different way of doing things, one that does not conform to the majority.", head(70), CREAM, W - 140, 1.02)
    d.rectangle([70, y + 40, 270, y + 46], fill=CORAL)
    text_block(d, (70, y + 90), "Not a lack. Not a flaw to hide. Material to build with.", head(70), CORAL, W - 140, 1.02)
    d.text((70, H - 230), "From the uNickorns manifesto", font=body(28), fill=(160, 170, 195))
    paste_fit_width(c, WORDMARK, 70, H - 170, 300)
    return c.convert("RGB")


# ---------------------------------------------------------------- YouTube thumbnail
def thumb():
    W, H = 1280, 720
    c = Image.new("RGBA", (W, H), NAVY)
    ph = BEN.crop((620, 0, 1270, 1024)).resize((457, 720), Image.LANCZOS)
    c.paste(ph, (W - ph.width, 0))
    d = ImageDraw.Draw(c)
    y = text_block(d, (50, 70), "ASK YOUR", head(128), CREAM, 760, 0.95)
    y = text_block(d, (50, y), "OWN", head(128), CREAM, 760, 0.95)
    d.text((50, y), "QUESTIONS", font=head(128), fill=CORAL)
    pill(d, (50, H - 120), "Teenpreneurs", sub(40), CORAL, NAVY, pad=(26, 10))
    return c.convert("RGB")


# ---------------------------------------------------------------- Reel (9:16)
FPS, DUR = 24, 12
RW, RH = 1080, 1920


def ease(t):
    t = max(0.0, min(1.0, t))
    return 1 - (1 - t) ** 3


def fade_slide(local, start, dur_in=0.45):
    p = ease((local - start) / dur_in)
    return p, int((1 - p) * 50)


def blend(color, bg, a):
    return tuple(int(bg[i] + (color[i] - bg[i]) * a) for i in range(3))


def reel_frame(t):
    scenes = [(0, 2.6), (2.6, 5.4), (5.4, 8.6), (8.6, 10.8), (10.8, 12.0)]
    idx = next(i for i, (a, b) in enumerate(scenes) if a <= t < b) if t < 12 else 4
    a, b = scenes[idx]
    lt = t - a
    c = Image.new("RGB", (RW, RH), NAVY)
    d = ImageDraw.Draw(c)

    def line(text, y, fnt, color, start, bg=NAVY, align="center"):
        p, dy = fade_slide(lt, start)
        col = blend(color, bg, p)
        w = d.textlength(text, font=fnt)
        x = (RW - w) / 2 if align == "center" else 70
        d.text((x, y + dy), text, font=fnt, fill=col)

    if idx == 0:
        line("AI is changing", 700, head(130), CREAM, 0.1)
        line("every job.", 840, head(130), CORAL, 0.5)
    elif idx == 1:
        line("Most school teaches", 640, head(104), CREAM, 0.1)
        line("you to answer", 760, head(104), CREAM, 0.1)
        line("other people's", 880, head(104), CREAM, 0.1)
        line("questions.", 1000, head(104), CORAL, 0.6)
    elif idx == 2:
        c = Image.new("RGB", (RW, RH), NAVY)
        d = ImageDraw.Draw(c)
        zoom = 1.0 + 0.08 * (lt / (b - a))
        pw = int(RW * zoom)
        ph = int(BEN.height * pw / BEN.width)
        im = BEN.resize((pw, ph), Image.LANCZOS).convert("RGB")
        cx = (pw - RW) // 2
        c.paste(im.crop((cx, 0, cx + RW, ph)), (0, 600))
        d = ImageDraw.Draw(c)
        line("We teach you", 250, head(116), CREAM, 0.1)
        line("to ask your own.", 380, head(116), CORAL, 0.55)
    elif idx == 3:
        p = ease(lt / 0.6)
        m = MASCOT.resize((int(MASCOT.width * 0.95), int(MASCOT.height * 0.95)), Image.LANCZOS)
        c.paste(m, ((RW - m.width) // 2, int(RH - m.height + 80 * (1 - p))), m)
        d = ImageDraw.Draw(c)
        line("TEENPRENEURS", 170, head(130), CORAL, 0.1)
        line("Ages 13 to 18  ·  Live online", 330, body(44, True), CREAM, 0.4)
        line("No business idea needed", 400, body(44, True), CREAM, 0.6)
    else:
        c = Image.new("RGB", (RW, RH), CORAL)
        d = ImageDraw.Draw(c)
        line("Applications open", 700, head(120), NAVY, 0.05, bg=CORAL)
        line("Starts 12 and 13 January 2027", 860, body(48, True), NAVY, 0.25, bg=CORAL)
        p = ease((lt - 0.4) / 0.5)
        wm = WORDMARK.resize((520, int(WORDMARK.height * 520 / WORDMARK.width)), Image.LANCZOS)
        c.paste(wm, ((RW - 520) // 2, 1000 + int((1 - p) * 40)), wm)
        line("unickorns.com", 1200, head(76), NAVY, 0.5, bg=CORAL)
    return c


def reel(path):
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{RW}x{RH}",
           "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-movflags", "+faststart", path]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for i in range(FPS * DUR):
        p.stdin.write(reel_frame(i / FPS).tobytes())
    p.stdin.close()
    p.wait()


if __name__ == "__main__":
    post_photo().save(os.path.join(OUT, "post1-not-made-to-blend-in.png"))
    post_stat().save(os.path.join(OUT, "post2-jobs-are-changing.png"))
    post_mascot().save(os.path.join(OUT, "post3-too-much-for-school.png"))
    post_offer().save(os.path.join(OUT, "post4-founding-cohort.png"))
    post_ideas().save(os.path.join(OUT, "post5-ideas-everywhere.png"))
    post_differentability().save(os.path.join(OUT, "post6-differentability.png"))
    thumb().save(os.path.join(OUT, "youtube-thumbnail-ask-your-own-questions.png"))
    reel(os.path.join(OUT, "reel1-ask-your-own-questions.mp4"))
    print("done")
