# -*- coding: utf-8 -*-
"""Builds The Teenpreneur Journal v6 in the uNickorns style.

python3 build_book.py           -> writes out/book_print.html and out/book_digital.html
node render.js                  -> renders both to PDF (print: A5 + 3 mm bleed, digital: A5 trim)
"""
import base64
import html
import io
import os
import re

import qrcode

import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import content as C
import art

FOOT = "The Teenpreneur Journal"

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out")
os.makedirs(OUT, exist_ok=True)

TONES = {
    "coral": ("#ff6b4a", "#ffdfd6", "#c63f26"),
    "lavender": ("#a78bfa", "#e9defe", "#5b3fc4"),
    "blue": ("#00b6ff", "#d9f4ff", "#006fa8"),
    "seafoam": ("#2dd4bf", "#d5f7ee", "#0f7a6c"),
}


def esc(s):
    return html.escape(s, quote=False)


def ref(s):
    return re.sub(r"\{\{ref:(\w+)\}\}", r'<span class="ref" data-ref="\1">00</span>', s)


# ------------------------------------------------------------------ blocks
def blk(b):
    k = b[0]
    if k == "p":
        return f'<p class="blk p">{ref(esc(b[1]))}</p>'
    if k == "h":
        return f'<h3 class="blk h">{esc(b[1])}</h3>'
    if k == "q":
        return f'<div class="blk q">{esc(b[1])}</div>'
    if k == "ul":
        return '<ul class="blk ul">' + "".join(f"<li>{ref(esc(i))}</li>" for i in b[1]) + "</ul>"
    if k == "ol":
        return '<ol class="blk ol">' + "".join(f"<li>{ref(esc(i))}</li>" for i in b[1]) + "</ol>"
    if k == "img":
        return '<figure class="blk img"><img src="assets/belt.png" alt=""></figure>'
    if k == "pq":
        return f'<blockquote class="blk pq"><p>{esc(b[1])}</p><cite>{esc(b[2])}</cite></blockquote>'
    if k == "sig":
        return f'<div class="blk sig"><b>{esc(b[1])}</b><span>{esc(b[2])}</span></div>'
    if k == "ex":
        fields = "".join(f'<div class="field"><span>{esc(f)}</span><i></i></div>' for f in b[3])
        return f'<div class="blk ex"><b>{esc(b[1])}</b><p>{esc(b[2])}</p>{fields}</div>'
    if k == "tool":
        return f'<div class="blk tool"><b>{esc(b[1])}</b><p>{esc(b[2])}</p></div>'
    if k == "art":
        return f'<div class="blk art">{art.svg(b[1])}</div>'
    if k == "cta":
        return (f'<div class="blk cta"><div><a href="{b[2]}">{esc(b[1])}</a><small>{esc(b[3])}</small></div>'
                f'<img src="{qr_uri(b[2])}" alt="QR code"></div>')
    raise ValueError(k)


def band_html(kicker, title, sub, numeral):  # compact variant is chosen by the page class
    return (f'<div class="band"><div class="band-in"><div class="kick">{esc(kicker)}</div><h2>{esc(title)}</h2>'
            f'<p class="sub">{esc(sub)}</p></div><div class="numeral">{esc(numeral)}</div></div>')


def flow(tone, blocks, band=None, head=None, toc=None, pid=None, compact=False):
    attrs = f'data-tone="{tone}"' + (' data-compact="1"' if compact else "") + (f' data-toc="{esc(toc)}"' if toc else "") + (f' data-id="{pid}"' if pid else "")
    t = ""
    if band:
        t += f'<template class="bandtpl">{band}</template>'
    if head:
        t += f'<template class="headtpl">{head}</template>'
    return f'<div class="item flow" {attrs}>{t}<div class="blocks">' + "".join(blk(b) for b in blocks) + "</div></div>"


def page(cls, inner, tone="coral", toc=None, pid=None, foot=True, stripe=True, band=None, bg=""):
    cls = cls + (" compactband" if band else "")
    attrs = f'data-tone="{tone}"' + (f' data-toc="{esc(toc)}"' if toc else "") + (f' data-id="{pid}"' if pid else "")
    nofoot = "" if foot else " nofoot"
    return (f'<div class="item page t-{tone} {cls}{nofoot}" {attrs}>{bg}'
            f'{"<div class=stripe></div>" if stripe and not band else ""}{band or ""}'
            f'<div class="safe{" withband" if band else ""}">{inner}</div>'
            f'<div class="foot"><span>{FOOT}</span><span class="num"></span></div></div>')


DOTS = ('<svg class="grid" width="100%" height="100%"><defs><pattern id="dp" width="5mm" height="5mm" patternUnits="userSpaceOnUse">'
        '<circle cx="2.5mm" cy="2.5mm" r="0.28mm" fill="#0b1326" fill-opacity=".34"/></pattern></defs>'
        '<rect width="100%" height="100%" fill="url(#dp)"/></svg>')
LINES = ('<svg class="grid" width="100%" height="100%"><defs><pattern id="lp" width="10mm" height="8.4mm" patternUnits="userSpaceOnUse">'
         '<rect y="8.1mm" width="10mm" height="0.25mm" fill="#0b1326" fill-opacity=".22"/></pattern></defs>'
         '<rect width="100%" height="100%" fill="url(#lp)"/></svg>')


def prompt_block(num, text, hint=None):
    badge = f'<span class="badge">{num}</span>' if num else ""
    h = f'<small>{esc(hint)}</small>' if hint else ""
    deco = f'<div class="wart">{art.svg("bulb")}</div>' if text in ("Idea space", "My business idea") else ""
    return f'<div class="prompt"><div class="q">{badge}<div>{esc(text)}{h}</div></div><div class="w">{DOTS}{deco}</div></div>'


def prompt_pages(ch, tone, label):
    items = []
    if ch.get("idea_box"):
        items.append((None, "My business idea", "Not sure yet? That’s a fine place to start. Write it, sketch it, dream it."))
    for i, q in enumerate(ch["prompts"], 1):
        items.append((i, q, None))
    if len(items) % 2:
        items.append((None, "Idea space", "Sketches, brainstorms, quotes, reminders or random thoughts."))
    out = []
    for pi in range(0, len(items), 2):
        head = (f'<div class="yt"><span class="pill">YOUR TURN</span><span class="lbl">{esc(label)}</span></div>')
        intro = f'<p class="yi">{esc(ch["prompts_intro"])}</p>' if pi == 0 and ch.get("prompts_intro") else ""
        body = "".join(prompt_block(*it) for it in items[pi:pi + 2])
        out.append(page("promptpage", head + intro + f'<div class="pgrid">{body}</div>', tone))
    return "".join(out)


# ------------------------------------------------------------------ fixed pages
def qr_uri(url):
    q = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=10, border=1)
    q.add_data(url)
    q.make(fit=True)
    buf = io.BytesIO()
    q.make_image(fill_color="#0b1326", back_color="white").save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


def cover(edition="full"):
    sticker = f'<div class="cv-sticker">{art.sticker("FREE", "STARTER EDITION")}</div>' if edition == "starter" else ""
    return ('<div class="item page cover t-coral nofoot" data-tone="coral">' + sticker + '<div class="safe cv">'
            '<img class="cv-wm" src="assets/wordmark.png" alt="uNickorns">'
            '<div class="cv-title"><span class="the">The</span><span class="teen">Teenpreneur</span><span class="jr">Journal</span>'
            '<p>For Dreamers, Doers<br>&amp; Difference-Makers</p></div>'
            '<img class="cv-mascot" src="assets/mascot.png" alt="">'
            '<div class="cv-by">by Milena Rudd</div>'
            '<div class="cv-co"><span>This journal is cowritten by</span><i></i></div></div></div>')


def copyright_page(edition="full"):
    c = C.COPYRIGHT
    extra = f'<p class="cp-x">{esc(C.STARTER_COPYRIGHT_EXTRA)}</p>' if edition == "starter" else ""
    inner = (f'<div class="copy"><img class="cp-wm" src="assets/wordmark.png" alt="">'
             f'<p class="cp-t">{esc(c[0])}</p>{extra}<p>{esc(c[1])}</p><p>{esc(c[2])}</p><p>{esc(c[3])}</p>'
             f'<p class="cp-s">First published 2026. Printed in Poland.<br>ISBN: ____________________</p>'
             f'<p class="cp-s">Made for Teenpreneurs, a uNickorns programme.<br>unickorns.com</p></div>')
    return page("copypage", inner, "coral", foot=False, stripe=False)


def toc_page():
    inner = '<h2 class="ptitle">What’s inside</h2><p class="psub">Jump in wherever you like. There is no right order.</p><div id="toc"></div>'
    return page("tocpage", inner, "coral", foot=True)


def part_opener(p, n):
    tone = p["tone"]
    inner = (f'<div class="op-in"><div class="op-label">{esc(p["label"])}</div><h1>{esc(p["title"])}</h1>'
             f'<p>{esc(p["sub"])}</p></div><div class="op-art pos{n}">{art.opener(n)}</div><img class="op-mascot pos{n}" src="assets/mascot.png" alt="">')
    return (f'<div class="item page opener t-{tone} nofoot" data-tone="{tone}" data-toc="{esc(p["label"].title())}: {esc(p["title"])}|part">'
            f'<div class="safe">{inner}</div></div>')


def lined_page(title, sub, inner_extra="", tone="coral", toc=None):
    head = f'<div class="pgart">{art.svg("book")}</div><h2 class="ptitle">{esc(title)}</h2><p class="psub">{esc(sub)}</p>{inner_extra}'
    return page("linepage", head + f'<div class="lined">{LINES}</div>', tone, toc=toc)


def commitment_page():
    def lines(n):
        return "".join('<i class="ln"></i>' for _ in range(n))
    inner = (f'<div class="pgart">{art.svg("flag")}</div><h2 class="ptitle">My Commitment</h2><p class="psub">Make it small. Make it real.</p>'
             '<div class="cm"><b>I will…</b>' + lines(3) + '<b>I will stop…</b>' + lines(3) +
             '<div class="sign"><span>Signed</span><i></i><span>Date</span><i></i></div>'
             '<div class="cm-end">You’ve got this. Now go out there and surprise yourself.</div></div>')
    return page("cmpage", inner, "coral", toc="My Commitment|item")


def toolkit_page():
    items = "".join(f'<div class="tk"><span class="n">{i}</span><div><b>{esc(t)}</b><p>{esc(d)}</p></div></div>' for i, (t, d) in enumerate(C.TOOLKIT, 1))
    inner = (f'<div class="pgart">{art.svg("toolbox")}</div><h2 class="ptitle">Emergency Doubt-Busting Toolkit</h2><p class="psub">For when you’re freaking out and don’t have time to reread the whole chapter.</p>'
             f'<div class="tkgrid">{items}</div>')
    return page("tkpage", inner, "coral", toc="Emergency Doubt-Busting Toolkit|item", pid="toolkit")


def project_log():
    rows = ""
    for t, hint in C.PROJECT_STEPS:
        h = f"<small>{esc(hint)}</small>" if hint else ""
        rows += f'<div class="pl"><b>{esc(t)}{h}</b><i></i><i></i></div>'
    band = band_html("BUILDER TOOLS", "My Project Log", "From idea to something real. One page per project. Messy is fine.", "")
    inner = f'<div class="plname"><span>Project name</span><i></i></div>{rows}'
    return page("plpage", inner, "seafoam", toc="My Project Log|item", band=band)


def closing_page():
    q = qr_uri("https://unickorns.com")
    d = C.CLOSING
    return (f'<div class="item page closing nofoot" data-tone="coral"><div class="safe">'
            f'<h1>{esc(d["title"])}</h1><p class="cl-sub">{esc(d["sub"])}</p><p class="cl-t">{esc(d["text"])}</p>'
            f'<div class="cl-tag"><span>Not made to blend in.</span><span class="c">Made to create.</span></div>'
            f'<div class="cl-qr"><img src="{q}" alt="QR code to unickorns.com"><div><b>Find out more</b><span>unickorns.com</span></div></div>'
            f'<img class="cl-wm" src="assets/wordmark.png" alt="uNickorns"><img class="cl-mascot" src="assets/mascot.png" alt=""></div></div>')


def notes_page():
    return page("linepage notes", '<h2 class="ptitle sm">Notes</h2>' + f'<div class="dotted">{DOTS}</div>', "coral")


def why_page():
    return page("promptpage", '<div class="yt"><span class="pill">START HERE</span><span class="lbl">Before chapter 1</span></div>'
                f'<div class="pgrid single">{prompt_block(None, "Why I picked up this journal", "Write your thoughts here. Messy is fine.")}</div>', "coral", toc="Why I picked up this journal|item")


# ------------------------------------------------------------------ assemble
def chapter_items(ch, tone, ptitle):
    n = ch["n"]
    numeral = f"{n:02d}" if isinstance(n, int) else "AI"
    kicker = f"CHAPTER {n}" if isinstance(n, int) else "BONUS CHAPTER"
    band = band_html(kicker, ch["title"], ch["sub"], numeral)
    label = f"{'Chapter ' + str(n) if isinstance(n, int) else 'Bonus'}: {ch['title']}"
    toc = f"{'Chapter ' + str(n) if isinstance(n, int) else 'Bonus'}  {ch['title']}|ch"
    key = C.ART_FOR_CHAPTER.get(n)
    blocks = ([("art", key)] if key else []) + list(ch["blocks"])
    return flow(tone, blocks, band=band, toc=toc, pid=f"ch{n}") + prompt_pages(ch, tone, label)


def doubt_flow():
    doubt_band = band_html("EMERGENCY CHAPTER", "When the Doubt Comes", "For those days when fear and imposter syndrome crash the party.", "")
    blocks = [("art", "storm")] + list(C.DOUBT_INTRO)
    e = C.DOUBT_EXERCISE
    blocks.append(("ex", e["title"], e["text"], e["fields"]))
    blocks.append(("h", "Flip the Script: Tools to Tackle Doubt"))
    for t, d in C.DOUBT_TOOLS:
        blocks.append(("tool", t, d))
    blocks.append(("h", "Quick Confidence Boosters"))
    for t, d in C.DOUBT_BOOSTERS:
        blocks.append(("tool", t, d))
    blocks.append(("h", "Your Challenge: Turning Doubt into Dominance"))
    blocks += C.DOUBT_CHALLENGE
    return flow("coral", blocks, band=doubt_band, toc="When the Doubt Comes|item")


def real_people_flow():
    rp = C.REAL_PEOPLE
    person = lambda n: ("ex", f"Person {n}", "Who are they, and what did they say?", ["Who", "Their exact words", "What surprised me"])
    blocks = [("art", "bubbles"), ("p", rp["intro"]), ("h", "Five questions to ask"), ("ol", rp["qs"]), person(1), person(2), person(3),
              ("ex", "What I noticed across all three", "Patterns, surprises, and what I will change.", ["The pattern I saw", "What I will try next"])]
    return flow("seafoam", blocks, band=band_html("BUILDER TOOLS", rp["title"], rp["sub"], ""), toc="Talk to Real People|item", compact=True)


def wellbeing_flow():
    w = C.WELLBEING
    wb = [("art", "heart"), ("p", w["p1"]), ("p", w["p2"]), ("h", "Who you can talk to"), ("ul", w["talk"]), ("h", "If you need someone right now"),
          ("p", w["now"]), ("ul", w["lines"]), ("q", w["note"])]
    return flow("blue", wb, band=band_html("TAKE CARE", w["title"], w["sub"], ""), toc="If things feel too heavy|item", pid="wellbeing", compact=True)


def build_items(edition="full"):
    global FOOT
    FOOT = "The Teenpreneur Journal" + (" · Starter edition" if edition == "starter" else "")
    it = [cover(edition), copyright_page(edition)]
    if edition == "starter":
        it.append(flow("coral", C.STARTART, head='<h2 class="ptitle">Start here</h2><p class="psub">Your free starter edition of The Teenpreneur Journal.</p>', toc="Start here|item"))
    it.append(toc_page())
    it.append(flow("coral", C.FOREWORD, head='<h2 class="ptitle">Foreword</h2>', toc="Foreword|item"))
    it.append(flow("coral", C.INTRO, head='<h2 class="ptitle">This Is Not Another School Book</h2><p class="psub">A quick word before we begin</p>', toc="This Is Not Another School Book|item"))
    it.append(why_page())
    if edition == "starter":
        for p in C.PARTS:
            for ch in p["chapters"]:
                if ch["n"] in C.STARTER_CHAPTERS:
                    it.append(chapter_items(ch, p["tone"], p["title"]))
        it.append(chapter_items(C.BONUS_AI, "seafoam", "Think alongside AI"))
        it.append(toolkit_page())
        it.append(commitment_page())
        it.append(real_people_flow())
        it.append(project_log())
        it.append(wellbeing_flow())
        it.append(flow("seafoam", C.WHATNEXT_TEEN, band=band_html("WHAT NEXT", "Ready to build something real?", "From the inner game to the outer game.", ""), toc="Ready to build something real?|item", compact=True))
        it.append(flow("blue", C.WHATNEXT_PARENTS, band=band_html("FOR PARENTS", "A note for parents", "What this journal is, and how to use it with your teen.", ""), toc="A note for parents|item", compact=True))
        it.append(closing_page())
        return "".join(it)
    for i, p in enumerate(C.PARTS, 1):
        it.append(part_opener(p, i))
        for ch in p["chapters"]:
            it.append(chapter_items(ch, p["tone"], p["title"]))
            if ch["n"] == 15:
                it.append(lined_page("A Letter From Your Future Self", "Write freely. No rules. Just you.", '<p class="dear">Dear younger me…</p>', "blue", toc="A Letter From Your Future Self|item"))
                it.append(page("linepage", f'<div class="lined">{LINES}</div>', "blue"))
    it.append(chapter_items(C.BONUS_AI, "seafoam", "Think alongside AI"))
    it.append(doubt_flow())
    it.append(prompt_pages(dict(prompts=C.DOUBT_PROMPTS), "coral", "Your challenge"))
    it.append(commitment_page())
    it.append(toolkit_page())
    it.append(real_people_flow())
    it.append(project_log())
    it.append(wellbeing_flow())
    it.append(notes_page())
    it.append(notes_page())
    it.append(closing_page())
    return "".join(it)


CSS = r"""
@font-face{font-family:"Baloo 2";font-weight:600;src:url(fonts/Baloo2_600SemiBold.ttf)}
@font-face{font-family:"Baloo 2";font-weight:700;src:url(fonts/Baloo2_700Bold.ttf)}
@font-face{font-family:"Baloo 2";font-weight:800;src:url(fonts/Baloo2_800ExtraBold.ttf)}
@font-face{font-family:Inter;font-weight:400;src:url(fonts/Inter_400Regular.ttf)}
@font-face{font-family:Inter;font-weight:500;src:url(fonts/Inter_500Medium.ttf)}
@font-face{font-family:Inter;font-weight:600;src:url(fonts/Inter_600SemiBold.ttf)}
@font-face{font-family:Inter;font-weight:700;src:url(fonts/Inter_700Bold.ttf)}
@font-face{font-family:Inter;font-style:italic;font-weight:400;src:url(fonts/Inter_400Regular_Italic.ttf)}
@font-face{font-family:Inter;font-style:italic;font-weight:500;src:url(fonts/Inter_500Medium_Italic.ttf)}
:root{--navy:#0b1326;--cream:#fff5e6;--coral:#ff6b4a;--coral-ink:#c63f26;--grey:#5d6580;--b:__B__}
@page{size:__W__mm __H__mm;margin:0}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#fff}
body{font-family:Inter,system-ui,sans-serif;color:var(--navy);-webkit-print-color-adjust:exact;print-color-adjust:exact}
.t-coral{--tone:#ff6b4a;--tint:#ffdfd6;--ink:#c63f26}
.t-lavender{--tone:#a78bfa;--tint:#e9defe;--ink:#5b3fc4}
.t-blue{--tone:#00b6ff;--tint:#d9f4ff;--ink:#006fa8}
.t-seafoam{--tone:#2dd4bf;--tint:#d5f7ee;--ink:#0f7a6c}
.page{position:relative;width:__W__mm;height:__H__mm;overflow:hidden;break-after:page;page-break-after:always;background:#fff}
.safe{position:absolute;left:calc(var(--b) + 16mm);right:calc(var(--b) + 16mm);top:calc(var(--b) + 17mm);bottom:calc(var(--b) + 21mm);overflow:hidden}
.safe{font-size:calc(9.7pt * var(--s,1))}
.safe.withband{top:calc(var(--b) + 61mm)}
.compactband .band{height:calc(var(--b) + 36mm)}
.compactband .band-in{top:calc(var(--b) + 11mm)}
.compactband .band h2{font-size:19pt}
.compactband .safe.withband{top:calc(var(--b) + 44mm)}
.stripe{position:absolute;left:0;right:0;top:0;height:calc(var(--b) + 2.6mm);background:var(--tone)}
.foot{position:absolute;left:calc(var(--b) + 16mm);right:calc(var(--b) + 16mm);bottom:calc(var(--b) + 8.5mm);display:flex;justify-content:space-between;font-size:6.4pt;letter-spacing:.06em;text-transform:uppercase;color:var(--grey);font-weight:600}
.foot .num{color:var(--ink);font-weight:700;font-size:7.5pt}
.nofoot .foot{display:none}
/* type */
h1,h2,h3{font-family:"Baloo 2",sans-serif;margin:0}
.ptitle{font-weight:800;font-size:24pt;line-height:1.02;margin:2mm 0 2.6mm;letter-spacing:-.005em}
.ptitle.sm{font-size:15pt}
.psub{font-style:italic;font-size:9.6pt;color:var(--grey);margin:0 0 5mm}
.blk.p{font-size:1em;line-height:1.6;margin:0 0 .3em}
.blk.h{font-family:"Baloo 2";font-weight:700;font-size:1.3em;line-height:1.15;color:var(--ink);margin:.5em 0 .17em}
.blk.q{background:var(--cream);border-left:1.7mm solid var(--tone);border-radius:0 3mm 3mm 0;padding:3.2mm 4mm;font-style:italic;font-weight:500;font-size:1.05em;line-height:1.5;margin:.34em 0 .4em}
.blk.ul,.blk.ol{margin:0 0 3mm;padding:0;list-style:none;font-size:1em;line-height:1.5}
.blk.ul li{position:relative;padding-left:5mm;margin-bottom:.14em}
.blk.ul li:before{content:"";position:absolute;left:.9mm;top:.62em;width:1.9mm;height:1.9mm;border-radius:50%;background:var(--tone)}
.blk.ol{counter-reset:n}
.blk.ol li{position:relative;padding-left:6.4mm;margin-bottom:1.6mm;counter-increment:n}
.blk.ol li:before{content:counter(n);position:absolute;left:0;top:.05em;width:4.4mm;height:4.4mm;border-radius:50%;background:var(--tone);font-family:"Baloo 2";font-weight:800;font-size:7.6pt;line-height:4.4mm;text-align:center;color:var(--navy)}
.blk.img{margin:1mm 0 3mm;text-align:center}
.blk.img img{width:84mm;max-width:100%}
.blk.pq{margin:3.2mm 0 3.6mm;padding:2mm 0 0 7mm;position:relative}
.blk.pq:before{content:"“";position:absolute;left:0;top:-3mm;font-family:"Baloo 2";font-weight:800;font-size:42pt;color:var(--tone);line-height:1}
.blk.pq p{font-style:italic;font-weight:500;font-size:1.07em;line-height:1.5;margin:0 0 1.4mm}
.blk.pq cite{font-style:normal;font-size:7.4pt;letter-spacing:.1em;text-transform:uppercase;font-weight:700;color:var(--ink)}
.blk.sig{margin-top:3mm;padding-top:3mm;border-top:.3mm solid rgba(11,19,38,.18)}
.blk.sig b{display:block;font-family:"Baloo 2";font-weight:800;font-size:13pt;margin-bottom:.6mm}
.blk.sig span{font-size:8pt;line-height:1.5;color:var(--grey);display:block}
.blk.tool{border:.3mm solid rgba(11,19,38,.14);border-left:1.7mm solid var(--tone);border-radius:0 3mm 3mm 0;padding:2.4mm 3.6mm;margin:0 0 2.4mm}
.blk.tool b{font-family:"Baloo 2";font-weight:700;font-size:1.1em;display:block;color:var(--ink);line-height:1.15}
.blk.tool p{margin:.6mm 0 0;font-size:.93em;line-height:1.5}
.blk.ex{background:var(--tint);border-radius:3mm;padding:3.4mm 4mm;margin:2mm 0 3mm}
.blk.ex b{font-family:"Baloo 2";font-weight:800;font-size:11pt;display:block}
.blk.ex p{font-size:.93em;line-height:1.5;margin:.8mm 0 2mm}
.field{margin-top:1.8mm;font-size:7.8pt;font-weight:600;color:var(--navy)}
.field i{display:block;height:6.2mm;border-bottom:.3mm solid rgba(11,19,38,.4)}
.ref{font-weight:700}
/* band */
.band{position:absolute;left:0;right:0;top:0;height:calc(var(--b) + 52mm);background:var(--tone)}
.band-in{position:absolute;left:calc(var(--b) + 16mm);top:calc(var(--b) + 14mm);width:92mm}
.band .kick{font-size:7.4pt;font-weight:700;letter-spacing:.2em;margin-bottom:1.6mm}
.band h2{font-weight:800;font-size:22pt;line-height:1.03}
.band .sub{font-style:italic;font-size:9.4pt;margin:2mm 0 0;font-weight:500}
.band .numeral{position:absolute;right:calc(var(--b) + 11mm);bottom:3mm;font-family:"Baloo 2";font-weight:800;font-size:54pt;line-height:1;color:rgba(11,19,38,.92)}
/* cover */
.cover{background:var(--navy);color:var(--cream)}
.cover .safe{overflow:visible}
.cv-wm{position:absolute;left:-2mm;top:-4mm;width:42mm}
.cv-title{position:absolute;left:0;top:30mm;width:120mm}
.cv-title span{display:block;font-family:"Baloo 2";font-weight:800;line-height:.9}
.cv-title .the{font-size:19pt;font-weight:700;color:var(--cream);margin-bottom:1mm}
.cv-title .teen{font-size:39pt;color:var(--coral)}
.cv-title .jr{font-size:39pt;color:var(--cream)}
.cv-title p{font-style:italic;font-size:10.6pt;margin:5mm 0 0;color:#fff5e6;width:72mm;line-height:1.4}
.cv-mascot{position:absolute;right:-9mm;bottom:19mm;height:104mm}
.cv-by{position:absolute;left:0;bottom:25mm;font-family:"Baloo 2";font-weight:700;font-size:13pt}
.cv-co{position:absolute;left:0;right:0;bottom:-3mm;background:var(--cream);color:var(--navy);border-radius:3mm;padding:2.6mm 4mm;display:flex;align-items:flex-end;gap:3mm;font-size:8pt;font-weight:600}
.cv-co i{flex:1;border-bottom:.3mm solid rgba(11,19,38,.5);height:5mm}
.cv-co span{white-space:nowrap}
/* copyright */
.copy{position:absolute;left:0;right:0;bottom:6mm}
.copy p{font-size:8.4pt;line-height:1.55;margin:0 0 2.6mm}
.copy .cp-t{font-weight:700}
.copy .cp-s{font-size:7.8pt;color:var(--grey);margin-top:4mm}
.cp-wm{width:38mm;margin-bottom:8mm;display:block}
/* openers */
.opener{background:var(--tone)}
.op-in{position:absolute;left:0;top:34mm;width:110mm}
.op-label{font-weight:700;font-size:9pt;letter-spacing:.24em;margin-bottom:3mm}
.opener h1{font-weight:800;font-size:46pt;line-height:.94;margin-bottom:5mm}
.opener p{font-style:italic;font-weight:500;font-size:13pt;margin:0;width:84mm;line-height:1.35}
.op-mascot{position:absolute;height:66mm}
.op-mascot.pos1{right:-8mm;bottom:calc(-1 * var(--b) - 22mm)}
.op-mascot.pos2{right:-6mm;bottom:calc(-1 * var(--b) - 22mm)}
.op-mascot.pos3{right:-8mm;bottom:calc(-1 * var(--b) - 22mm)}
.op-mascot.pos4{right:-6mm;bottom:calc(-1 * var(--b) - 22mm)}
/* toc */
#toc{margin-top:3mm}
#toc .row{display:flex;align-items:baseline;gap:2mm;font-size:8.2pt;line-height:1;padding:.86mm 0}
#toc .row .lbl{white-space:nowrap}
#toc .row .d{flex:1;border-bottom:.3mm dotted rgba(11,19,38,.4);transform:translateY(-.8mm)}
#toc .row .pg{font-weight:700;color:var(--ink)}
#toc .row.part{margin-top:1.1mm;font-family:"Baloo 2";font-weight:800;font-size:10pt}
#toc .row.part .lbl:before{content:"";display:inline-block;width:2.4mm;height:2.4mm;border-radius:50%;background:var(--tone);margin-right:2mm}
#toc .row.ch .lbl{padding-left:4.5mm}
/* prompt pages */
.yt{display:flex;align-items:center;gap:3mm;margin-bottom:3.6mm}
.pill{background:var(--tone);color:var(--navy);font-weight:700;font-size:7.4pt;letter-spacing:.16em;padding:1.3mm 3mm;border-radius:99px}
.yt .lbl{font-size:7.8pt;color:var(--grey);font-weight:600}
.yi{font-style:italic;font-size:9.2pt;margin:-1mm 0 3mm;color:var(--grey)}
.promptpage .safe{display:flex;flex-direction:column}
.pgrid{flex:1;display:flex;flex-direction:column;gap:5mm;min-height:0}
.prompt{flex:1;display:flex;flex-direction:column;border:.35mm solid var(--tone);border-radius:3.6mm;overflow:hidden;min-height:0}
.prompt .q{background:var(--tint);padding:3.6mm 4.4mm;display:flex;gap:3mm;align-items:flex-start;font-family:"Baloo 2";font-weight:700;font-size:11.2pt;line-height:1.22}
.prompt .q small{display:block;font-family:Inter;font-weight:500;font-size:7.8pt;color:var(--grey);margin-top:.8mm}
.badge{flex:none;width:6.2mm;height:6.2mm;border-radius:50%;background:var(--tone);font-weight:800;font-size:8.4pt;line-height:6.2mm;text-align:center;margin-top:.4mm}
.prompt .w{flex:1;position:relative;background:#fff;min-height:0}
.grid{position:absolute;inset:0;display:block}
/* lined pages */
.linepage .safe{display:flex;flex-direction:column}
.lined,.dotted{flex:1;position:relative;min-height:0;margin-top:2mm}
.dear{font-family:"Baloo 2";font-weight:700;font-size:12pt;color:var(--ink);margin:0}
.notes .ptitle{margin-bottom:1mm}
/* commitment */
.cm{margin-top:2mm}
.cm b{display:block;font-family:"Baloo 2";font-weight:800;font-size:14pt;margin:5mm 0 1mm}
.cm .ln{display:block;height:9mm;border-bottom:.3mm solid rgba(11,19,38,.35)}
.sign{display:flex;gap:2.5mm;align-items:flex-end;margin-top:9mm;font-size:8pt;font-weight:600}
.sign i{flex:1;border-bottom:.3mm solid rgba(11,19,38,.5);height:5mm}
.cm-end{margin-top:12mm;background:var(--coral);color:var(--navy);border-radius:3mm;padding:4mm 5mm;font-family:"Baloo 2";font-weight:800;font-size:13pt;line-height:1.2}
/* toolkit */
.tkgrid{display:grid;grid-template-columns:1fr;gap:2.1mm}
.tk{display:flex;gap:3mm;align-items:flex-start;border-bottom:.3mm solid rgba(11,19,38,.12);padding-bottom:1.8mm}
.tk .n{flex:none;width:5.4mm;height:5.4mm;border-radius:50%;background:var(--tone);font-family:"Baloo 2";font-weight:800;font-size:8.4pt;line-height:5.4mm;text-align:center}
.tk b{font-family:"Baloo 2";font-weight:700;font-size:10pt;display:block;line-height:1.1}
.tk p{margin:.4mm 0 0;font-size:8.4pt;line-height:1.4}
/* project log */
.plname{display:flex;gap:3mm;align-items:flex-end;font-family:"Baloo 2";font-weight:700;font-size:10.5pt;color:var(--ink);margin-bottom:1mm}
.plname i{flex:1;border-bottom:.3mm solid rgba(11,19,38,.45);height:5mm}
.pl{margin-top:2.6mm}
.pl b{font-family:"Baloo 2";font-weight:700;font-size:10.4pt;color:var(--ink);display:block;text-transform:uppercase;letter-spacing:.03em;font-size:9.4pt}
.pl b small{font-family:Inter;font-weight:500;text-transform:none;letter-spacing:0;font-size:7.6pt;color:var(--grey);margin-left:2mm}
.pl i{display:block;height:5.9mm;border-bottom:.3mm solid rgba(11,19,38,.25)}
/* closing */
.closing{background:var(--navy);color:var(--cream)}
.closing .safe{overflow:visible}
.closing h1{font-weight:800;font-size:40pt;line-height:.95;color:var(--coral);margin-top:6mm}
.closing .cl-sub{font-style:italic;font-size:11pt;margin:3mm 0 5mm;width:90mm;line-height:1.4}
.closing .cl-t{font-size:9.2pt;line-height:1.6;width:80mm;margin:0 0 6mm}
.cl-tag span{display:block;font-family:"Baloo 2";font-weight:800;font-size:15pt;line-height:1.1}
.cl-tag .c{color:var(--coral)}
.cl-qr{position:absolute;left:0;bottom:36mm;display:flex;gap:3.5mm;align-items:center}
.cl-qr img{width:25mm;height:25mm;border-radius:2.4mm;background:#fff}
.cl-qr b{display:block;font-family:"Baloo 2";font-weight:700;font-size:10pt;color:var(--coral)}
.cl-qr span{font-family:"Baloo 2";font-weight:800;font-size:13pt}
.cl-wm{position:absolute;left:-2mm;bottom:2mm;width:46mm}
.cl-mascot{position:absolute;right:-12mm;bottom:-6mm;height:104mm}
.blk.art{float:right;width:calc(38mm * var(--aw,1));margin:.5mm 0 2mm 5mm}
.blk.q,.blk.ex,.blk.tool,.blk.cta{display:flow-root}
.blk.cta{display:flex;gap:4mm;align-items:center;background:var(--navy);color:var(--cream);border-radius:4mm;padding:4mm 5mm;margin:4mm 0 0;clear:both}
.blk.cta a{color:var(--coral);font-family:"Baloo 2";font-weight:800;font-size:13.5pt;text-decoration:none;display:block;line-height:1.1}
.blk.cta small{display:block;font-size:8pt;margin-top:1.2mm;opacity:.9}
.blk.cta img{width:24mm;height:24mm;border-radius:2.4mm;background:#fff;flex:none;margin-left:auto}
.pgart{position:absolute;right:0;top:-2mm;width:30mm}
.tkpage .ptitle,.cmpage .ptitle,.linepage .ptitle{max-width:84mm}
.band-art{position:absolute;right:calc(var(--b) + 13mm);top:calc(var(--b) + 7mm);width:24mm}
.band-art svg{width:100%}
.wart{position:absolute;right:3.5mm;bottom:2.5mm;width:24mm}
.op-art{position:absolute;left:-5mm;top:84mm;width:122mm}
.op-art svg{width:100%;display:block}
.cv-sticker{position:absolute;right:calc(var(--b) + 6mm);top:calc(var(--b) + 8mm)}
.copy .cp-x{font-weight:600;color:var(--ink);background:var(--tint);border-radius:3mm;padding:3mm 3.6mm}
.foot a{color:inherit;text-decoration:none}
#toc .row a{display:flex;flex:1;align-items:baseline;gap:2mm;color:inherit;text-decoration:none}
"""


def html_doc(bleed, edition="full"):
    w, h = 148 + 2 * bleed, 210 + 2 * bleed
    css = CSS.replace("__W__", str(w)).replace("__H__", str(h)).replace("__B__", f"{bleed}mm") + art.CSS
    items = build_items(edition)
    js = open(os.path.join(HERE, "paginate.js"), encoding="utf-8").read()
    title = "The Teenpreneur Journal" + (": Starter Edition" if edition == "starter" else "")
    return (f'<!doctype html><html><head><meta charset="utf-8"><title>{title}</title><style>{css}</style></head>'
            f'<body><div id="src" style="display:none">{items}</div><template id="notes-tpl">{notes_page()}</template><div id="book"></div>'
            f'<script>window.FOOT={FOOT!r};</script><script>{js}</script></body></html>')


if __name__ == "__main__":
    for name, bleed, edition in (("print", 3, "full"), ("digital", 0, "full"), ("starter", 0, "starter")):
        with open(os.path.join(HERE, f"book_{name}.html"), "w", encoding="utf-8") as f:
            f.write(html_doc(bleed, edition))
    with open(os.path.join(HERE, "..", "CHANGES_v6.txt"), "w", encoding="utf-8") as f:
        f.write(C.CHANGES)
    print("built html")
