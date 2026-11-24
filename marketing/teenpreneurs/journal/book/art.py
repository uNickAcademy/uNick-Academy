# -*- coding: utf-8 -*-
"""Bold outline doodles for The Teenpreneur Journal, in the style of the original WAKE UP alarm clock.

Every shape is vector. Colours come from CSS variables, so the same drawing takes each chapter's colour:
  --ink  outline colour        --tint  soft offset shadow        --tone  bright accent fill
Classes: o = white shape with outline, l = line only, k = solid ink, c = accent fill with outline,
s = shadow, t = comic lettering, tx = lettering extrusion.
"""
import math


def _a(attrs):
    return " ".join(f'{k.replace("_", "-")}="{v}"' for k, v in attrs.items())


def E(tag, cls="o", shadow=True, dx=6, dy=7, **attrs):
    a = _a(attrs)
    s = f'<{tag} class="s" {a} transform="translate({dx} {dy})"/>' if shadow else ""
    return s + f'<{tag} class="{cls}" {a}/>'


def P(d, cls="o", shadow=True, dx=6, dy=7, **kw):
    return E("path", cls, shadow, dx, dy, d=d, **kw)


def L(x1, y1, x2, y2, w=5):
    return f'<line class="l" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke-width="{w}"/>'


def LP(d, w=5, extra=""):
    return f'<path class="l" d="{d}" stroke-width="{w}" {extra}/>'


def dot(x, y, r=3):
    return f'<circle class="k" cx="{x}" cy="{y}" r="{r}"/>'


def tube(d, w=16, inner=7):
    """A thick outlined line (shackles, headbands)."""
    return (f'<path d="{d}" fill="none" stroke="var(--tint)" stroke-width="{w}" stroke-linecap="round" transform="translate(5 6)"/>'
            f'<path d="{d}" fill="none" stroke="var(--ink)" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'
            f'<path d="{d}" fill="none" stroke="#fff" stroke-width="{inner}" stroke-linecap="round" stroke-linejoin="round"/>')


def burst(cx, cy, R, r, n=16, rot=0):
    pts = []
    for i in range(n * 2):
        ang = math.pi * i / n + math.radians(rot)
        rad = R if i % 2 == 0 else r
        pts.append(f"{cx + rad * math.cos(ang):.1f},{cy + rad * math.sin(ang):.1f}")
    return "M" + " L".join(pts) + " Z"


def text3d(x, y, s, size, rot=0, depth=6):
    out = ""
    tr = f'transform="rotate({rot} {x} {y})"'
    for k in range(depth, 0, -1):
        out += f'<text class="tx" x="{x + k * 0.9:.1f}" y="{y + k * 0.9:.1f}" font-size="{size}" text-anchor="middle" {tr}>{s}</text>'
    out += f'<text class="t" x="{x}" y="{y}" font-size="{size}" text-anchor="middle" {tr}>{s}</text>'
    return out


def sparkle(x, y, s=10):
    return L(x - s, y, x + s, y, 4) + L(x, y - s, x, y + s, 4)


def rays(cx, cy, r1, r2, angles, w=5):
    return "".join(L(round(cx + r1 * math.cos(math.radians(a)), 1), round(cy + r1 * math.sin(math.radians(a)), 1),
                     round(cx + r2 * math.cos(math.radians(a)), 1), round(cy + r2 * math.sin(math.radians(a)), 1), w) for a in angles)


def gear(cx, cy, r, teeth=8, hole=0.38):
    out = ""
    for i in range(teeth):
        a = 2 * math.pi * i / teeth
        out += L(round(cx + r * math.cos(a), 1), round(cy + r * math.sin(a), 1), round(cx + (r + 9) * math.cos(a), 1), round(cy + (r + 9) * math.sin(a), 1), 11)
    out += E("circle", cx=cx, cy=cy, r=r, shadow=False)
    out += f'<circle class="o" cx="{cx}" cy="{cy}" r="{r * hole:.1f}"/>'
    return out


# ---------------------------------------------------------------- small pieces
def alarm_clock(scale=1.0, ox=0, oy=0):
    g = ""
    g += E("circle", cx=52, cy=46, r=17) + E("circle", cx=148, cy=46, r=17)
    g += L(64, 60, 76, 72, 6) + L(136, 60, 124, 72, 6)
    g += E("circle", cx=100, cy=116, r=66)
    g += f'<circle class="l" cx="100" cy="116" r="52" stroke-width="3.5"/>'
    for h in range(12):
        a = math.radians(h * 30 - 90)
        g += dot(round(100 + 41 * math.cos(a), 1), round(116 + 41 * math.sin(a), 1), 4.2 if h % 3 == 0 else 2.6)
    g += L(100, 116, 100, 86, 6) + L(100, 116, 128, 124, 5)
    g += E("circle", cx=100, cy=116, r=6.5, shadow=False)
    g += L(62, 174, 50, 192, 9) + L(138, 174, 150, 192, 9)
    g += L(20, 18, 34, 30, 4.5) + L(100, 4, 100, 18, 4.5) + L(180, 18, 166, 30, 4.5)
    return f'<g transform="translate({ox} {oy}) scale({scale})">{g}</g>'


def bulb(cx=100, cy=76, r=34, with_rays=True):
    g = E("rect", x=cx - 16, y=cy + 28, width=32, height=36, rx=5)
    g += E("circle", cx=cx, cy=cy, r=r)
    g += L(cx - 14, cy + 38, cx + 14, cy + 38, 3.5) + L(cx - 12, cy + 47, cx + 12, cy + 47, 3.5)
    g += LP(f"M{cx - 12} {cy + 6} q6 -18 12 0 t12 0", 3.5)
    if with_rays:
        g += rays(cx, cy, r + 14, r + 28, (-155, -125, -90, -55, -25), 5)
    return g


def bulb_box():
    g = P("M46 132 L24 102 L74 92 L92 132 Z") + P("M154 132 L176 102 L126 92 L108 132 Z")
    g += bulb(100, 72, 34)
    g += E("rect", x=46, y=130, width=108, height=56, rx=5)
    g += L(70, 146, 130, 146, 3.5)
    return g


def lock_heart():
    g = tube("M76 100 V72 A24 24 0 0 1 124 72 V54", 18, 8)
    g += E("rect", x=52, y=98, width=96, height=78, rx=16)
    g += P("M100 160 C66 140 74 112 100 128 C126 112 134 140 100 160 Z", cls="c", shadow=False)
    g += sparkle(150, 44, 9) + sparkle(46, 56, 7)
    return g


def switch_on():
    g = E("rect", x=48, y=38, width=104, height=124, rx=18)
    g += E("rect", x=86, y=64, width=28, height=72, rx=14, cls="l", shadow=False)
    g += f'<circle class="c" cx="100" cy="86" r="15"/>'
    g += rays(100, 100, 82, 98, (-160, -130, -50, -20, 20, 160), 5)
    g += L(100, 150, 100, 150, 1)
    return g


def sprout():
    g = P("M62 132 H138 L126 184 H74 Z")
    g += E("rect", x=56, y=118, width=88, height=18, rx=7)
    g += LP("M84 154 L94 164 L116 142", 5)
    g += L(100, 118, 100, 74, 6)
    g += P("M100 94 C68 100 56 74 64 54 C90 54 104 70 100 94 Z", cls="c")
    g += P("M100 80 C130 82 144 58 136 38 C110 38 96 56 100 80 Z", cls="c")
    g += sparkle(36, 40, 8) + sparkle(160, 100, 8)
    return g


def brain():
    d = "M60 124 C34 124 28 94 50 86 C46 62 76 50 92 66 C104 48 138 54 142 76 C166 74 176 104 154 118 C160 138 138 150 122 142 C110 156 84 154 78 140 C70 140 62 134 60 124 Z"
    g = P(d)
    g += LP("M100 66 C94 90 106 112 98 140", 3.5)
    g += LP("M78 92 C90 90 92 104 80 108", 3.5) + LP("M124 92 C112 94 110 104 122 108", 3.5)
    g += LP("M68 120 q10 -6 20 2", 3.5) + LP("M132 122 q-10 -6 -20 2", 3.5)
    g += gear(150, 160, 17, 8)
    g += sparkle(46, 40, 8)
    return g


def compass():
    g = E("circle", cx=100, cy=104, r=70)
    g += E("rect", x=88, y=18, width=24, height=14, rx=5, shadow=False)
    g += f'<circle class="l" cx="100" cy="104" r="56" stroke-width="3"/>'
    g += L(100, 52, 100, 60, 4) + L(100, 148, 100, 156, 4) + L(48, 104, 56, 104, 4) + L(144, 104, 152, 104, 4)
    g += '<g transform="rotate(38 100 104)">' + '<path class="c" d="M100 54 L114 104 L86 104 Z"/>' + '<path class="o" d="M100 154 L114 104 L86 104 Z"/></g>'
    g += E("circle", cx=100, cy=104, r=6, shadow=False)
    return g


def friends():
    def person(cx, cy, s=1.0):
        h = E("circle", cx=cx, cy=cy, r=17 * s)
        h += f'<circle class="k" cx="{cx - 6 * s}" cy="{cy - 2 * s}" r="2"/><circle class="k" cx="{cx + 6 * s}" cy="{cy - 2 * s}" r="2"/>'
        h += LP(f"M{cx - 6 * s} {cy + 5 * s} q{6 * s} {6 * s} {12 * s} 0", 3)
        return h
    g = P("M16 176 C16 130 88 130 88 176 Z") + P("M112 176 C112 130 184 130 184 176 Z")
    g += person(52, 104) + person(148, 104)
    g += P("M62 184 C62 120 138 120 138 184 Z", cls="c")
    g += person(100, 86, 1.15)
    g += P("M100 40 C84 30 86 16 100 24 C114 16 116 30 100 40 Z", cls="c", shadow=False)
    return g


def coins():
    g = E("rect", x=22, y=128, width=70, height=46, rx=10)
    g += L(24, 144, 90, 144, 3.5) + L(24, 158, 90, 158, 3.5)
    g += E("ellipse", cx=57, cy=128, rx=35, ry=13)
    g += P("M70 96 L170 76 L180 126 L80 146 Z", dx=6, dy=7)
    g += E("circle", cx=125, cy=111, r=16, shadow=False)
    g += sparkle(125, 111, 0)
    g += P("M125 100 L128 108 L137 108 L130 114 L133 123 L125 118 L117 123 L120 114 L113 108 L122 108 Z", cls="c", shadow=False)
    g += E("circle", cx=146, cy=160, r=26, cls="c")
    g += f'<circle class="l" cx="146" cy="160" r="17" stroke-width="3"/>'
    g += sparkle(40, 78, 9) + sparkle(172, 44, 7)
    return g


def flask():
    out = "M82 28 H118 V68 L158 148 C164 164 154 178 138 178 H62 C46 178 36 164 42 148 L82 68 Z"
    g = f'<path class="s" d="{out}" transform="translate(6 7)"/>'
    g += f'<path class="o" d="{out}"/>'
    g += '<path d="M50 134 H150 L158 148 C164 164 154 178 138 178 H62 C46 178 36 164 42 148 Z" fill="var(--tone)"/>'
    g += f'<path class="l" d="{out}"/>'
    g += L(74, 28, 126, 28, 7)
    g += f'<circle class="l" cx="100" cy="100" r="6" stroke-width="3.5"/><circle class="l" cx="112" cy="80" r="4" stroke-width="3.5"/>'
    g += f'<circle class="o" cx="78" cy="156" r="6" stroke-width="3.5" fill="#fff"/><circle class="o" cx="112" cy="150" r="9" stroke-width="3.5" fill="#fff"/>'
    g += LP("M176 60 A22 22 0 1 1 152 36", 5) + '<path class="k" d="M144 26 L160 36 L144 48 Z"/>'
    g += sparkle(30, 50, 8)
    return g


def system():
    g = E("rect", x=96, y=34, width=72, height=100, rx=10)
    g += E("rect", x=114, y=26, width=36, height=16, rx=6, cls="c", shadow=False)
    for i, y in enumerate((64, 84, 104)):
        g += LP(f"M108 {y} l5 6 l9 -10", 3.5) + L(128, y, 156, y, 3.5)
    g += gear(62, 126, 26, 8)
    g += LP("M26 62 A44 44 0 0 1 60 38", 5) + '<path class="k" d="M58 28 L74 40 L56 50 Z"/>'
    g += sparkle(170, 160, 8)
    return g


def headphones():
    g = tube("M44 118 C44 36 156 36 156 118", 16, 7)
    g += E("rect", x=28, y=108, width=30, height=58, rx=13, cls="c") + E("rect", x=142, y=108, width=30, height=58, rx=13, cls="c")
    g += f'<circle class="k" cx="100" cy="146" r="34"/><circle class="l" cx="100" cy="146" r="24" stroke="#fff" stroke-width="2.5"/>'
    g += f'<circle class="c" cx="100" cy="146" r="11"/>'
    g += f'<circle class="o" cx="96" cy="64" r="5" shadow="no"/>'
    g += L(101, 64, 101, 42, 4) + LP("M101 42 q8 2 10 10", 4)
    g += sparkle(150, 52, 7)
    return g


def battery():
    g = E("rect", x=30, y=66, width=124, height=76, rx=13) + E("rect", x=154, y=88, width=16, height=32, rx=6, shadow=False)
    g += '<rect class="c" x="42" y="78" width="26" height="52" rx="5"/><rect class="c" x="74" y="78" width="26" height="52" rx="5"/>'
    g += P("M112 56 L84 106 H104 L94 152 L132 96 H110 L124 56 Z", cls="o", shadow=False)
    g += rays(100, 104, 92, 108, (-110, -70, 70, 110), 5)
    g += sparkle(30, 40, 8) + sparkle(172, 150, 8)
    return g


def signpost():
    g = E("rect", x=94, y=28, width=14, height=154, rx=5)
    g += P("M52 44 H138 L160 64 L138 84 H52 Z") + P("M148 98 H62 L40 118 L62 138 H148 Z")
    g += P("M60 148 H122 L140 162 L122 176 H60 Z", cls="c")
    g += L(66, 64, 112, 64, 3.5) + L(70, 118, 118, 118, 3.5)
    g += L(40, 188, 164, 188, 5)
    g += sparkle(170, 36, 8)
    return g


def megaphone():
    g = P("M44 88 L136 42 V150 L44 116 Z", cls="c")
    g += E("rect", x=28, y=84, width=22, height=36, rx=7)
    g += E("rect", x=62, y=116, width=20, height=40, rx=6)
    g += LP("M152 82 Q170 96 152 112", 5) + LP("M162 66 Q192 96 162 128", 5) + LP("M122 36 L140 28", 4)
    g += sparkle(170, 38, 8)
    return g


def bubbles():
    g = P("M28 40 H112 A24 24 0 0 1 136 64 V92 A24 24 0 0 1 112 116 H70 L44 138 V116 H28 A24 24 0 0 1 4 92 V64 A24 24 0 0 1 28 40 Z", dx=6, dy=7)
    g += P("M90 96 H172 A24 24 0 0 1 196 120 V146 A24 24 0 0 1 172 170 H160 V190 L136 170 H90 A24 24 0 0 1 66 146 V120 A24 24 0 0 1 90 96 Z", cls="c", shadow=False)
    g += P("M131 150 C112 138 116 122 131 130 C146 122 150 138 131 150 Z", cls="o", shadow=False)
    g += dot(32, 78, 4) + dot(54, 78, 4) + dot(76, 78, 4)
    return g


def book_pen():
    g = P("M100 70 C80 54 50 54 26 62 V152 C50 144 80 144 100 160 Z") + P("M100 70 C120 54 150 54 174 62 V152 C150 144 120 144 100 160 Z")
    g += L(100, 70, 100, 160, 4)
    for y in (86, 102, 118):
        g += L(40, y, 84, y + 2, 3.5)
    g += '<g transform="rotate(38 150 60)"><rect class="c" x="140" y="8" width="18" height="62" rx="5"/><path class="o" d="M140 70 H158 L149 92 Z"/></g>'
    g += sparkle(30, 32, 9) + sparkle(176, 128, 7)
    return g


def robot():
    g = L(100, 60, 100, 36, 6) + E("circle", cx=100, cy=30, r=8, cls="c", shadow=False)
    g += E("rect", x=48, y=60, width=104, height=88, rx=24)
    g += E("rect", x=32, y=92, width=16, height=34, rx=7, shadow=False) + E("rect", x=152, y=92, width=16, height=34, rx=7, shadow=False)
    g += f'<circle class="l" cx="78" cy="100" r="11"/><circle class="l" cx="122" cy="100" r="11"/>'
    g += dot(80, 102, 5) + dot(124, 102, 5)
    g += LP("M76 128 Q100 144 124 128", 5)
    g += P("M118 10 H170 A14 14 0 0 1 184 24 V40 A14 14 0 0 1 170 54 H150 L138 66 L138 54 H118 A14 14 0 0 1 104 40 V24 A14 14 0 0 1 118 10 Z", cls="c", shadow=False)
    g += '<text class="t" x="144" y="42" font-size="24" text-anchor="middle" stroke-width="4">AI</text>'
    g += E("rect", x=70, y=152, width=60, height=26, rx=8)
    return g


def storm_sun():
    g = E("circle", cx=146, cy=56, r=24, cls="c", shadow=False) + rays(146, 56, 34, 46, (-90, -45, 0, -135, 180), 5)
    d = "M54 132 C26 132 22 98 46 94 C46 68 82 62 96 82 C108 60 146 68 144 96 C170 98 174 132 144 132 Z"
    g += P(d)
    g += P("M98 134 L80 168 H98 L88 196 L122 156 H104 L114 134 Z", cls="c", shadow=False)
    g += L(40, 150, 36, 164, 4.5) + L(150, 148, 146, 162, 4.5)
    return g


def toolbox():
    g = tube("M72 96 V70 H128 V96", 14, 6)
    g += E("rect", x=28, y=92, width=144, height=84, rx=13)
    g += L(30, 124, 170, 124, 4.5)
    g += E("rect", x=86, y=112, width=28, height=22, rx=5, cls="c", shadow=False)
    g += P("M146 160 C132 150 136 140 146 146 C156 140 160 150 146 160 Z", cls="c", shadow=False)
    g += sparkle(26, 66, 8) + sparkle(176, 64, 8)
    return g


def flag():
    g = P("M12 182 C52 136 148 136 192 182 Z")
    g += L(108, 150, 108, 36, 7)
    g += P("M108 38 L172 56 L108 78 Z", cls="c")
    g += sparkle(46, 60, 9) + sparkle(160, 120, 8)
    return g


def heart():
    g = P("M100 170 C26 122 38 52 100 90 C162 52 174 122 100 170 Z", cls="c")
    g += LP("M62 78 q-12 8 -10 24", 4.5)
    g += '<path d="M100 104 V138 M83 121 H117" stroke="#fff" stroke-width="11" stroke-linecap="round" fill="none"/>'
    g += sparkle(30, 40, 8) + sparkle(172, 52, 9) + sparkle(166, 160, 6)
    return g


def key():
    g = E("circle", cx=54, cy=100, r=26) + f'<circle class="l" cx="54" cy="100" r="11"/>'
    g += E("rect", x=76, y=92, width=96, height=16, rx=7)
    g += E("rect", x=140, y=108, width=12, height=24, rx=4, shadow=False) + E("rect", x=158, y=108, width=12, height=18, rx=4, shadow=False)
    return g


def bulb_only():
    return bulb(100, 90, 40)


SPOT = dict(
    alarm=lambda: alarm_clock(), bulb_box=bulb_box, lock=lock_heart, switch=switch_on, sprout=sprout, brain=brain,
    compass=compass, friends=friends, coins=coins, flask=flask, system=system, headphones=headphones, battery=battery,
    signpost=signpost, megaphone=megaphone, bubbles=bubbles, book=book_pen, robot=robot, storm=storm_sun,
    toolbox=toolbox, flag=flag, heart=heart, bulb=bulb_only,
)


def svg(key, cls="", vb="0 0 200 200"):
    return f'<svg class="art {cls}" viewBox="{vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">{SPOT[key]()}</svg>'


# ---------------------------------------------------------------- big opener compositions (320 x 250)
def opener(n):
    vb = "0 0 320 250"
    if n == 1:
        g = alarm_clock(1.0, -8, 52)
        g += P(burst(238, 70, 88, 60, 16, 8), cls="o", dx=6, dy=7)
        g += text3d(238, 66, "WAKE", 38, -6) + text3d(242, 110, "UP", 50, -6)
        g += sparkle(300, 168, 9) + sparkle(120, 34, 8)
    elif n == 2:
        g = f'<g transform="translate(26 -6) scale(1.2)">{bulb_box()}</g>'
        g += sparkle(24, 44, 11) + sparkle(296, 60, 11) + sparkle(290, 190, 8)
    elif n == 3:
        g = f'<g transform="translate(60 -6) scale(1.2)">{lock_heart()}</g>'
        g += f'<g transform="translate(-6 130) scale(.72) rotate(-18 100 100)">{key()}</g>'
        g += sparkle(290, 60, 10) + sparkle(30, 56, 9)
    else:
        g = P(burst(160, 126, 126, 94, 18, 4), cls="o", dx=6, dy=7)
        g += text3d(160, 142, "ACTION!", 46, -8)
        g += LP("M30 30 l14 -12 l8 14 l14 -12", 5) + LP("M250 200 l14 -12 l8 14 l14 -12", 5)
        g += sparkle(290, 36, 10) + sparkle(36, 206, 9)
    return f'<svg class="art onTone" viewBox="{vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">{g}</svg>'


def sticker(line1, line2, w=44):
    g = P(burst(110, 110, 104, 78, 14, 6), cls="c", dx=5, dy=6)
    g += text3d(110, 100, line1, 40, -8, 5) + text3d(110, 140, line2, 21, -8, 3)
    return f'<svg class="art onTone sticker" viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="width:{w}mm">{g}</svg>'


CSS = """
.art{display:block;overflow:visible}
.art .o{fill:#fff;stroke:var(--ink);stroke-width:5;stroke-linejoin:round;stroke-linecap:round}
.art .l{fill:none;stroke:var(--ink);stroke-width:5;stroke-linejoin:round;stroke-linecap:round}
.art .k{fill:var(--ink);stroke:var(--ink);stroke-width:3;stroke-linejoin:round}
.art .c{fill:var(--tone);stroke:var(--ink);stroke-width:5;stroke-linejoin:round;stroke-linecap:round}
.art .s{fill:var(--tint);stroke:var(--tint);stroke-width:5;stroke-linejoin:round;stroke-linecap:round}
.art .t{font-family:"Baloo 2",sans-serif;font-weight:800;fill:#fff;stroke:var(--ink);stroke-width:5;paint-order:stroke;stroke-linejoin:round}
.art .tx{font-family:"Baloo 2",sans-serif;font-weight:800;fill:var(--ink);stroke:var(--ink);stroke-width:7;stroke-linejoin:round}
.art.onTone{--ink:#0b1326;--tint:rgba(255,255,255,.4)}
"""
