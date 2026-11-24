# -*- coding: utf-8 -*-
"""Renders the carousel slides, graphics, story backgrounds and profile images for the launch pack.

python3 build_visuals.py <output_dir>      (needs Playwright via node: NODE_PATH=$(npm root -g))
"""
import base64, html, io, json, os, subprocess, sys

import qrcode

HERE = os.path.dirname(os.path.abspath(__file__))
BOOK = os.path.join(HERE, "..", "journal", "book")
sys.path.insert(0, HERE)
sys.path.insert(0, BOOK)
import art  # noqa: E402
import data as D  # noqa: E402

OUT = os.path.abspath(sys.argv[1])
FONTS = os.path.join(BOOK, "fonts")
ASSETS = os.path.join(BOOK, "assets")
TONES = {"coral": ("#ff6b4a", "#ffdfd6", "#c63f26"), "lavender": ("#a78bfa", "#e9defe", "#5b3fc4"),
         "blue": ("#00b6ff", "#d9f4ff", "#006fa8"), "seafoam": ("#2dd4bf", "#d5f7ee", "#0f7a6c")}
e = lambda s: html.escape(s, quote=False)


def qr(url):
    q = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=10, border=1)
    q.add_data(url); q.make(fit=True)
    b = io.BytesIO(); q.make_image(fill_color="#0b1326", back_color="white").save(b, format="PNG")
    return "data:image/png;base64," + base64.b64encode(b.getvalue()).decode()


def url_for(key, camp):
    base = D.BASE[key]
    return None if base.startswith("[") else f"{base}?utm_source=social&utm_medium=carousel&utm_campaign={camp}"


CSS = """
@font-face{font-family:"Baloo 2";font-weight:600;src:url(file://%(f)s/Baloo2_600SemiBold.ttf)}
@font-face{font-family:"Baloo 2";font-weight:700;src:url(file://%(f)s/Baloo2_700Bold.ttf)}
@font-face{font-family:"Baloo 2";font-weight:800;src:url(file://%(f)s/Baloo2_800ExtraBold.ttf)}
@font-face{font-family:Inter;font-weight:400;src:url(file://%(f)s/Inter_400Regular.ttf)}
@font-face{font-family:Inter;font-weight:500;src:url(file://%(f)s/Inter_500Medium.ttf)}
@font-face{font-family:Inter;font-weight:600;src:url(file://%(f)s/Inter_600SemiBold.ttf)}
@font-face{font-family:Inter;font-weight:700;src:url(file://%(f)s/Inter_700Bold.ttf)}
@font-face{font-family:Inter;font-style:italic;font-weight:500;src:url(file://%(f)s/Inter_500Medium_Italic.ttf)}
*{box-sizing:border-box}body{margin:0;background:#888}
:root{--navy:#0b1326;--cream:#fff5e6;--coral:#ff6b4a}
.t-coral{--tone:#ff6b4a;--tint:#ffdfd6;--ink:#c63f26}.t-lavender{--tone:#a78bfa;--tint:#e9defe;--ink:#5b3fc4}
.t-blue{--tone:#00b6ff;--tint:#d9f4ff;--ink:#006fa8}.t-seafoam{--tone:#2dd4bf;--tint:#d5f7ee;--ink:#0f7a6c}
.s{width:1080px;height:1350px;position:relative;overflow:hidden;color:var(--navy);font-family:Inter;margin-bottom:20px}
.s.story{height:1920px}
.kick{font:700 30px Inter;letter-spacing:.2em}
.cover{background:var(--tone);padding:96px}
.cover h1{font:800 132px/.98 "Baloo 2";margin:28px 0 24px;max-width:900px}
.cover .sub{font:italic 500 42px Inter}
.cover .artbox{position:absolute;right:-10px;bottom:150px;width:640px}
.swipe{position:absolute;left:96px;bottom:90px;font:700 36px "Baloo 2";background:var(--navy);color:var(--cream);padding:18px 40px;border-radius:99px}
.text,.list,.qa{background:var(--cream);padding:120px 96px}
.qa{background:var(--tint)}
.bar{position:absolute;left:0;top:0;right:0;height:30px;background:var(--tone)}
.text h2{font:800 94px/1.02 "Baloo 2"}
.text p{font:500 47px/1.45 Inter;margin:44px 0 0;max-width:880px}
.list h2{font:800 80px/1.04 "Baloo 2";margin-bottom:46px}
.list ol{list-style:none;margin:0;padding:0;counter-reset:n}
.list li{counter-increment:n;position:relative;padding:0 0 0 96px;margin-bottom:34px;font:600 49px/1.3 Inter}
.list li:before{content:counter(n);position:absolute;left:0;top:-4px;width:68px;height:68px;border-radius:50%;background:var(--tone);font:800 40px/68px "Baloo 2";text-align:center}
.qa .qp{display:inline-block;font:800 34px "Baloo 2";background:var(--tone);padding:8px 30px;border-radius:99px;margin-bottom:34px}
.qa h2{font:800 82px/1.04 "Baloo 2";margin-bottom:52px}
.qa .a{background:#fff;border-radius:44px;padding:58px;font:500 46px/1.45 Inter;border:5px solid var(--tone)}
.smallart{position:absolute;right:70px;bottom:150px;width:270px}
.foot{position:absolute;left:96px;right:96px;bottom:56px;display:flex;justify-content:space-between;align-items:center}
.foot img{height:58px}.foot span{font:700 28px Inter;color:#5d6580}
.cta{background:var(--navy);color:var(--cream);padding:110px 96px}
.cta h2{font:800 104px/1 "Baloo 2";color:var(--coral);max-width:880px}
.cta p{font:500 48px/1.4 Inter;margin:36px 0 0;max-width:640px}
.cta .qrbox{position:absolute;left:96px;bottom:150px;display:flex;flex-direction:column;gap:22px;align-items:flex-start;max-width:420px}
.cta .qrbox img{width:270px;height:270px;border-radius:28px;background:#fff}
.cta .qrbox b{display:block;font:800 44px "Baloo 2";color:var(--coral)}
.cta .qrbox span{font:600 32px Inter}
.cta .linktxt{position:absolute;left:96px;bottom:150px;font:800 60px "Baloo 2";color:var(--coral)}
.cta .m{position:absolute;right:-60px;bottom:-40px;height:720px}
.cta .wm{position:absolute;left:96px;bottom:56px;height:62px}
.g{background:var(--cream);padding:110px 96px}
.g h2{font:800 112px/1 "Baloo 2"}
.g p{font:500 50px/1.4 Inter;margin-top:34px;max-width:860px}
.g.has-m p{max-width:470px}
.g .m{position:absolute;right:-20px;bottom:-30px;height:820px}
table.tz{border-collapse:separate;border-spacing:0 12px;margin-top:20px;font:600 44px Inter;width:100%}
table.tz td,table.tz th{padding:20px 30px;text-align:left}
table.tz th{font:800 40px "Baloo 2";background:var(--navy);color:var(--cream)}
table.tz th:first-child{border-radius:24px 0 0 24px}table.tz th:last-child{border-radius:0 24px 24px 0}
table.tz td{background:#fff;border-top:4px solid var(--tone);border-bottom:4px solid var(--tone)}
table.tz td:first-child{border-left:4px solid var(--tone);border-radius:24px 0 0 24px;font-weight:800}
table.tz td:last-child{border-right:4px solid var(--tone);border-radius:0 24px 24px 0}
.avatar{width:800px;height:800px;background:#ff6b4a;overflow:hidden;position:relative;margin-bottom:20px;border-radius:0}
.avatar img{position:absolute;width:760px;left:20px;top:30px}
.banner{width:2560px;height:1440px;background:#0b1326;position:relative;overflow:hidden;color:#fff5e6;margin-bottom:20px}
.banner .wm{position:absolute;left:560px;top:620px;width:440px}
.banner h1{position:absolute;left:1060px;top:520px;font:800 76px/1.02 "Baloo 2";width:600px;margin:0}
.banner h1 span{color:#ff6b4a}
.banner p{position:absolute;left:1060px;top:790px;font:italic 500 34px Inter;width:600px;margin:0}
.banner .m{position:absolute;right:380px;bottom:-40px;height:760px}
"""


def wm(h=58):
    return f'<img src="file://{ASSETS}/wordmark.png" style="height:{h}px" alt="">'


def foot(n, total):
    return f'<div class="foot">{wm()}<span>{n} / {total}</span></div>'


def cover_slide(cid, c, total):
    k, title, sub = c["cover"]
    t = c["tone"]
    return (f'<div class="s cover t-{t}" id="{cid}-01"><div class="kick">{e(k)}</div><h1>{e(title)}</h1><p class="sub">{e(sub)}</p>'
            f'<div class="artbox">{art.svg(c["art"], "onTone")}</div><div class="swipe">Swipe</div></div>')


def slide(cid, c, i, s, total):
    t = c["tone"]; typ = s[0]; n = i + 2
    if typ == "text":
        return (f'<div class="s text t-{t}" id="{cid}-{n:02d}"><div class="bar"></div><h2>{e(s[1])}</h2><p>{e(s[2])}</p>'
                f'<div class="smallart">{art.svg(c["art"] if c["art"] != "belt" else "signpost")}</div>{foot(n, total)}</div>')
    if typ == "list":
        li = "".join(f"<li>{e(x)}</li>" for x in s[2])
        return f'<div class="s list t-{t}" id="{cid}-{n:02d}"><div class="bar"></div><h2>{e(s[1])}</h2><ol>{li}</ol>{foot(n, total)}</div>'
    if typ == "qa":
        return (f'<div class="s qa t-{t}" id="{cid}-{n:02d}"><div class="bar"></div><span class="qp">Question</span><h2>{e(s[1])}</h2>'
                f'<div class="a">{e(s[2])}</div>{foot(n, total)}</div>')
    if typ == "cta":
        key = s[3]
        link = url_for(key, cid)
        box = (f'<div class="qrbox"><img src="{qr(link)}" alt=""><div><b>Scan or tap the link</b><span>{e(link.split("?")[0].replace("https://", ""))}</span></div></div>'
               if link else '<div class="linktxt">Link in bio</div>')
        return (f'<div class="s cta t-{t}" id="{cid}-{n:02d}"><h2>{e(s[1])}</h2><p>{e(s[2])}</p>{box}'
                f'<img class="m" src="file://{ASSETS}/mascot.png" alt=""></div>')
    raise ValueError(typ)


def graphics():
    g = []
    g.append(('greeting-24-dec', f'<div class="s g has-m t-coral"><h2>Warm wishes from uNickorns</h2><p>May your teenager get time to follow their curiosity this holiday.</p><img class="m" src="file://{ASSETS}/mascot.png" alt=""><div class="foot">{wm()}<span></span></div></div>'))
    g.append(('new-year-2027', f'<div class="s g t-lavender" style="background:var(--tint)"><h2>2027 is the year they start something</h2><p>Founding Cohort applications are open.</p><div style="position:absolute;right:50px;bottom:200px;width:520px">{art.svg("flag")}</div><div class="foot">{wm()}<span>unickorns.com</span></div></div>'))
    g.append(('last-call', f'<div class="s cover t-coral"><div class="kick">FOUNDING COHORT</div><h1>Last call</h1><p class="sub">Two groups, 24 seats. Starting 12 and 13 January.</p><div class="artbox">{art.svg("alarm", "onTone")}</div><div class="swipe">Apply at unickorns.com</div></div>'))
    g.append(('lastcall-intro', f'<div class="s cover t-blue"><div class="kick">TOMORROW, FREE</div><h1>Intro call on Zoom</h1><p class="sub">19:00 CET, 18:00 UK, 13:00 New York. Meet the programme and ask anything.</p><div class="artbox">{art.svg("bubbles", "onTone")}</div><div class="swipe">Link in bio</div></div>'))
    g.append(('timezones', '<div class="s g t-seafoam"><h2 style="font-size:92px">Your time</h2><table class="tz"><tr><th></th><th>Group 1</th><th>Group 2</th></tr><tr><td>Day</td><td>Tuesday</td><td>Wednesday</td></tr><tr><td>UK</td><td>18:00</td><td>09:00</td></tr><tr><td>Central Europe</td><td>19:00</td><td>10:00</td></tr><tr><td>New York</td><td>13:00</td><td>04:00</td></tr></table><p style="font-size:36px;margin-top:20px">Starts 12 and 13 January 2027. Winter times. In the US, Group 1 is the one that fits.</p><div class="foot">' + wm() + '<span>unickorns.com</span></div></div>'))
    return g


def stories():
    mk = lambda cid, tone, head, sub: (cid, f'<div class="s story cover t-{tone}" style="height:1920px"><div class="kick">{e(sub)}</div><h1 style="font-size:120px;max-width:880px">{e(head)}</h1><img src="file://{ASSETS}/mascot.png" style="position:absolute;right:-30px;bottom:-60px;height:900px" alt=""><div style="position:absolute;left:96px;bottom:90px">{wm(70)}</div></div>')
    return [mk("story-question", "coral", "Ask us anything", "TEENPRENEURS"), mk("story-poll", "lavender", "Quick poll", "TEENPRENEURS"), mk("story-countdown", "blue", "Intro call countdown", "5 JANUARY, 19:00 CET")]


def brand():
    return [("avatar", f'<div class="avatar"><img src="file://{ASSETS}/mascot.png" alt=""></div>'),
            ("youtube-banner", f'<div class="banner"><img class="wm" src="file://{ASSETS}/wordmark.png" alt=""><h1>Not made to blend in. <span>Made to create.</span></h1><p>Teenpreneurs: live online, ages 13 to 18.</p><img class="m" src="file://{ASSETS}/mascot.png" alt=""></div>')]


def main():
    os.makedirs(OUT, exist_ok=True)
    body, jobs = "", []
    for cid, c in D.CAROUSELS.items():
        total = len(c["slides"]) + 1
        if cid != "c1-conveyor-belt":
            body += cover_slide(cid, c, total); jobs.append((f"{cid}-01", f"carousels/{cid}/slide-01.png"))
        for i, s in enumerate(c["slides"]):
            body += slide(cid, c, i, s, total); jobs.append((f"{cid}-{i + 2:02d}", f"carousels/{cid}/slide-{i + 2:02d}.png"))
    for gid, h in graphics():
        body += h.replace('class="s ', f'id="g-{gid}" class="s ', 1); jobs.append((f"g-{gid}", f"graphics/{gid}.png"))
    for sid, h in stories():
        body += h.replace('class="s ', f'id="{sid}" class="s ', 1); jobs.append((sid, f"stories/{sid}.png"))
    for bid, h in brand():
        body += h.replace('class="', f'id="{bid}" class="', 1); jobs.append((bid, f"brand/{bid}.png"))
    doc = f'<!doctype html><meta charset="utf-8"><style>{CSS.replace("%(f)s", FONTS)}{art.CSS}</style>{body}'
    page = os.path.join(OUT, "_slides.html")
    open(page, "w", encoding="utf-8").write(doc)
    js = ("const {chromium}=require('playwright');(async()=>{const jobs=JSON.parse(process.argv[2]);const b=await chromium.launch();"
          "const p=await b.newPage({viewport:{width:2700,height:1500}});await p.goto('file://'+process.argv[1]);"
          "await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500);"
          "for(const [id,out] of jobs){await p.locator('#'+id).screenshot({path:out});}await b.close();})()")
    full = [(i, os.path.join(OUT, o)) for i, o in jobs]
    for _, o in full:
        os.makedirs(os.path.dirname(o), exist_ok=True)
    subprocess.run(["node", "-e", js, page, json.dumps(full)], check=True)
    os.remove(page)
    print(len(jobs), "images")


if __name__ == "__main__":
    main()
