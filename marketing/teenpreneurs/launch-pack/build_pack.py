# -*- coding: utf-8 -*-
"""Assembles the Teenpreneurs launch pack: workbook, calendar view, shoot scripts, plain text captions, Polish readme and media folders.

usage: python3 -I build_pack.py OUT_DIR VISUALS_DIR POSTS_DIR
  OUT_DIR      empty folder where the pack is built
  VISUALS_DIR  output of build_visuals.py (carousels, graphics, stories, brand)
  POSTS_DIR    folder with post1..post8 png, the reel mp4, the YouTube thumbnail and the Starter Edition pdf
"""
import datetime as dt
import html
import json
import os
import re
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import data as D  # noqa: E402

from openpyxl import Workbook  # noqa: E402
from openpyxl.styles import Alignment, Font, PatternFill, Border, Side  # noqa: E402
from openpyxl.worksheet.datavalidation import DataValidation  # noqa: E402
from openpyxl.formatting.rule import FormulaRule  # noqa: E402
from openpyxl.utils import get_column_letter  # noqa: E402

OUT, VIS, POSTS = [os.path.abspath(a) for a in sys.argv[1:4]]
TEEN = os.path.abspath(os.path.join(HERE, ".."))
JOURNAL = os.path.join(TEEN, "journal")
FONTS = os.path.join(JOURNAL, "book", "fonts")
CAMPAIGN = "founding-cohort"
E = html.escape

NAVY, CREAM, CORAL, BLUE, LAV, SEA = "0B1326", "FFF5E6", "FF6B4A", "00B6FF", "A78BFA", "2DD4BF"
DAYS_PL = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nie"]
DAYS_PL_LONG = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"]
MONTHS_PL = {11: "Listopad 2026", 12: "Grudzień 2026", 1: "Styczeń 2027"}
KIND_PL = {"reel": "Rolka / Short", "image": "Grafika", "carousel": "Karuzela", "story": "Stories", "yt": "Film YouTube",
           "email": "E-mail", "fbgroup": "Grupa FB (tekst)", "live": "Zoom na żywo", "setup": "Przygotowanie", "rest": "Dzień wolny"}
KIND_COLOR = {"reel": CORAL, "image": BLUE, "carousel": LAV, "story": "F3A6FF", "yt": NAVY, "email": SEA, "fbgroup": "9AA3B2",
              "live": "C63F26", "setup": "9AA3B2", "rest": "D9D9D9"}
TABS = [("Instagram", ["IG", "IGR", "ST"]), ("Facebook", ["FB", "FBG"]), ("LinkedIn", ["LI"]), ("TikTok", ["TT"]),
        ("YouTube", ["YT", "YTS"]), ("Email", ["EM"]), ("Zoom na żywo", ["LIVE"])]


# ---------- helpers ----------
def wd(d):
    return dt.date.fromisoformat(d).weekday()


def pl_time(t):
    h, m = t.split(":")
    return f"{(int(h) + 1) % 24:02d}:{m}"


def link_for(it, plat):
    key = it.get("link")
    if not key:
        return ""
    base = D.BASE[key]
    if base.startswith("["):
        return base
    medium = "email" if plat == "EM" else "social"
    return f"{base}?utm_source={D.SRC.get(plat, 'social')}&utm_medium={medium}&utm_campaign={CAMPAIGN}&utm_content={it['d']}"


def tags_for(it, n):
    out = []
    for g in it.get("tags", []):
        out += D.TAGS[g].split()
    seen, res = set(), []
    for t in out:
        if t not in seen:
            seen.add(t); res.append(t)
    return " ".join(res[:n])


def text_for(it, plat):
    """caption or description for one platform"""
    core, link = it.get("core", ""), link_for(it, plat)
    if it["kind"] == "email":
        em = D.EMAILS[it["email"]]
        return f"TEMAT: {em['subject']}\nPODGLĄD: {em['preview']}\n\n" + em["body"].replace("{link}", link)
    if it["kind"] in ("setup", "rest"):
        return core
    core = core.replace("{link}", link)
    if plat in ("IG", "IGR"):
        s = core + ("\n\nLink in bio." if link else "")
        tg = tags_for(it, 12 if plat == "IG" else 6)
        return s + ("\n\n" + tg if tg else "")
    if plat == "ST":
        return it.get("story", "") or core
    if plat == "FB":
        s = core + (f"\n\n{link}" if link else "")
        tg = tags_for(it, 3)
        return s + ("\n\n" + tg if tg else "")
    if plat == "FBG":
        return core
    if plat == "LI":
        s = it.get("li") or core
        s += f"\n\n{link}" if link else ""
        tg = tags_for(it, 3)
        return s + ("\n\n" + tg if tg else "")
    if plat == "TT":
        tg = tags_for(it, 5)
        return core + (" Link in bio." if link else "") + ("\n\n" + tg if tg else "")
    if plat == "YTS":
        tg = tags_for(it, 4)
        return core + (f"\n\n{link}" if link else "") + ("\n\n" + tg if tg else "") + "\n#shorts"
    if plat == "YT":
        ex = D.YT_EXTRA.get(it.get("script", ""), {})
        s = core
        if ex.get("chapters"):
            s += "\n\n" + ex["chapters"]
        if ex.get("tags"):
            s += "\n\nTAGI (pole Tags w YouTube Studio): " + ex["tags"]
        return s
    if plat == "LIVE":
        return core
    return core


def title_for(it, plat):
    if plat == "YT":
        return it["hook"][:100]
    if plat == "YTS":
        return it["hook"][:90]
    return it["hook"]


def needs_for(it):
    n = []
    for m in it.get("media", []):
        if m.startswith("["):
            n.append("Dostarcz plik: " + m.strip("[]"))
    if it["kind"] in ("reel", "yt") and it.get("script") and not any(not m.startswith("[") for m in it.get("media", [])):
        n.append(f"Nagraj wideo wg skryptu {it['script']}")
    if it.get("script") and it["kind"] == "live":
        n.append(f"Przygotuj spotkanie wg {it['script']}")
    blob = " ".join([it.get("core", ""), it.get("li", ""), it.get("story", "")])
    if it.get("email"):
        blob += " " + D.EMAILS[it["email"]]["body"]
    key = it.get("link")
    if key and D.BASE[key].startswith("["):
        n.append("Uzupełnij link " + D.BASE[key])
    if "[SEATS]" in blob or "[SEATS]" in it.get("hook", ""):
        n.append("Wpisz realną liczbę wolnych miejsc w miejsce [SEATS]")
    if it["kind"] == "story":
        n.append("Dodaj naklejkę w aplikacji (ankieta, pytanie, odliczanie)")
    if it.get("script") == "S8" or it["d"] == "2026-12-19":
        n.append("Warsztat 19 grudnia to PROPOZYCJA, potwierdź termin")
    if it["kind"] == "yt":
        n.append("Miniatura i opis do wklejenia w YouTube Studio")
    out = []
    for x in n:
        if x not in out:
            out.append(x)
    return "; ".join(out)


# ---------- media layout ----------
M = os.path.join(OUT, "02_MEDIA")
LAYOUT = {  # source -> destination under 02_MEDIA
    "posts": ["post1-not-made-to-blend-in_real-photo.png", "post2-jobs-are-changing.png", "post3-too-much-for-school.png",
              "post4-founding-cohort.png", "post5-ideas-everywhere.png", "post6-differentability.png",
              "post7-you-are-not-lazy.png", "post8-conveyor-belt-trap.png"],
    "wideo": ["reel1-ask-your-own-questions_real-photo.mp4", "youtube-thumbnail_real-photo.png"],
    "dziennik": ["Teenpreneur_Journal_Starter_Edition.pdf"],
}
FOLDER_PL = {"posts": "01_posty_grafiki", "wideo": "02_wideo", "dziennik": "03_dziennik_lead_magnet", "carousels": "04_karuzele",
             "graphics": "05_grafiki_okolicznosciowe", "stories": "06_stories", "brand": "07_marka_profile"}
where = {}  # filename -> relative path inside the pack


def copy_media():
    for sub, files in LAYOUT.items():
        for f in files:
            dst = os.path.join(M, FOLDER_PL[sub]); os.makedirs(dst, exist_ok=True)
            shutil.copy(os.path.join(POSTS, f), dst)
            where[f] = f"02_MEDIA/{FOLDER_PL[sub]}/{f}"
    # full journal, digital and print
    dst = os.path.join(M, FOLDER_PL["dziennik"])
    for f in ["Teenpreneur_Journal_v6_DIGITAL_A5.pdf", "Teenpreneur_Journal_v6_PRINT_A5_3mm-bleed.pdf"]:
        shutil.copy(os.path.join(JOURNAL, f), dst)
    for sub in ("carousels", "graphics", "stories", "brand"):
        shutil.copytree(os.path.join(VIS, sub), os.path.join(M, FOLDER_PL[sub]))
    # carousel 1 slide 1 reuses post 8
    c1 = os.path.join(M, FOLDER_PL["carousels"], "c1-conveyor-belt"); os.makedirs(c1, exist_ok=True)
    shutil.copy(os.path.join(POSTS, "post8-conveyor-belt-trap.png"), os.path.join(c1, "slide-01.png"))


def media_ref(m):
    if m.startswith("["):
        return "(do dostarczenia) " + m.strip("[]")
    if m.endswith("/"):
        cid = m.rstrip("/").split("/")[-1]
        return f"02_MEDIA/{FOLDER_PL['carousels']}/{cid}/ (slajdy slide-01 do slide-NN)"
    if "/" in m:
        top, rest = m.split("/", 1)
        return f"02_MEDIA/{FOLDER_PL[top]}/{rest}"
    return where.get(m, m)


# ---------- workbook ----------
thin = Side(style="thin", color="D9D2C5")
BORDER = Border(left=thin, right=thin, top=thin, bottom=thin)
HEAD_FILL = PatternFill("solid", fgColor=NAVY)
HEAD_FONT = Font(name="Calibri", bold=True, color="FFF5E6", size=11)
COLS = [("Data", 11), ("Dzień", 8), ("Godz. UK", 8), ("Godz. PL", 8), ("Platforma", 16), ("Format", 14), ("Tytuł / hook", 34),
        ("Treść do wklejenia", 70), ("Link z UTM", 34), ("Plik", 38), ("Opis alternatywny (alt)", 34), ("Skrypt", 8),
        ("Uwagi", 36), ("Do zrobienia przez Ciebie", 38), ("Status", 14)]
STATUS = ["Czeka", "Gotowe", "Zaplanowane", "Opublikowane"]


def rows_for(platform_codes):
    rows = []
    for it in D.ITEMS:
        for p in it["on"]:
            if p in platform_codes:
                rows.append((it, p))
    rows.sort(key=lambda r: (r[0]["d"], D.TIME[r[1]], r[1]))
    return rows


def sheet_calendar(ws, rows):
    ws.append([c for c, _ in COLS])
    for i, (_, w) in enumerate(COLS, 1):
        ws.column_dimensions[get_column_letter(i)].width = w
        c = ws.cell(row=1, column=i); c.fill = HEAD_FILL; c.font = HEAD_FONT
        c.alignment = Alignment(wrap_text=True, vertical="center")
    ws.row_dimensions[1].height = 30
    for it, p in rows:
        d = dt.date.fromisoformat(it["d"])
        need = needs_for(it)
        media = "\n".join(media_ref(m) for m in it.get("media", []))
        ws.append([d, DAYS_PL[d.weekday()], D.TIME[p], pl_time(D.TIME[p]), D.PLATFORMS[p], KIND_PL[it["kind"]],
                   title_for(it, p), text_for(it, p), link_for(it, p), media, it.get("alt", ""), it.get("script", it.get("email", "")),
                   it.get("notes", ""), need, "Czeka" if (need or it["kind"] == "setup") else "Gotowe"])
        r = ws.max_row
        ws.cell(row=r, column=1).number_format = "DD.MM.YYYY"
        for c in range(1, len(COLS) + 1):
            cell = ws.cell(row=r, column=c)
            cell.alignment = Alignment(wrap_text=True, vertical="top")
            cell.border = BORDER
        ws.cell(row=r, column=6).fill = PatternFill("solid", fgColor=KIND_COLOR[it["kind"]])
        ws.cell(row=r, column=6).font = Font(bold=True, color="FFFFFF" if it["kind"] not in ("email", "story") else NAVY)
        txt = ws.cell(row=r, column=8).value or ""
        ws.row_dimensions[r].height = min(409, max(48, 15 * (len(txt) // 62 + txt.count("\n") + 1)))
    ws.freeze_panes = "E2"
    ws.auto_filter.ref = f"A1:{get_column_letter(len(COLS))}{max(ws.max_row, 2)}"
    last = max(ws.max_row, 2)
    dv = DataValidation(type="list", formula1='"' + ",".join(STATUS) + '"', allow_blank=True)
    ws.add_data_validation(dv); dv.add(f"O2:O{last}")
    green = PatternFill("solid", bgColor="CFF3E8"); amber = PatternFill("solid", bgColor="FFE9B8"); blue = PatternFill("solid", bgColor="CDEBFF")
    ws.conditional_formatting.add(f"O2:O{last}", FormulaRule(formula=['$O2="Gotowe"'], fill=green))
    ws.conditional_formatting.add(f"O2:O{last}", FormulaRule(formula=['$O2="Czeka"'], fill=amber))
    ws.conditional_formatting.add(f"O2:O{last}", FormulaRule(formula=['OR($O2="Zaplanowane",$O2="Opublikowane")'], fill=blue))
    ws.sheet_view.zoomScale = 90


def simple_sheet(wb, name, header, rows, widths, tall=True):
    ws = wb.create_sheet(name)
    ws.append(header)
    for i, w in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(i)].width = w
        c = ws.cell(row=1, column=i); c.fill = HEAD_FILL; c.font = HEAD_FONT; c.alignment = Alignment(wrap_text=True, vertical="center")
    for r in rows:
        ws.append(r)
        for c in range(1, len(header) + 1):
            cell = ws.cell(row=ws.max_row, column=c)
            cell.alignment = Alignment(wrap_text=True, vertical="top"); cell.border = BORDER
        longest = max(len(str(v)) / max(8, widths[i] * 0.95) + str(v).count("\n") for i, v in enumerate(r))
        ws.row_dimensions[ws.max_row].height = min(409, max(30, 15 * (longest + 1)))
    ws.freeze_panes = "A2"
    return ws


def build_workbook(path):
    wb = Workbook()
    ws = wb.active; ws.title = "Czytaj najpierw"
    lines = [
        ("Teenpreneurs · pakiet postów i kalendarz", True),
        ("29 listopada 2026 do 13 stycznia 2027. Treści są po angielsku (publiczność USA, UK i świat), opisy i instrukcje po polsku.", False),
        ("", False),
        ("JAK TEGO UŻYWAĆ", True),
        ("1. Zakładka „Kalendarz” to wszystko w jednym miejscu, jeden wiersz to jeden post na jednej platformie. Filtruj po platformie lub dacie.", False),
        ("2. Zakładki z nazwami platform (Instagram, Facebook, LinkedIn, TikTok, YouTube, Email) pokazują to samo osobno. Kolumna „Treść do wklejenia” jest gotowa do skopiowania.", False),
        ("3. Kolumna „Plik” mówi, który plik z folderu 02_MEDIA dołączyć. „Opis alternatywny” wklej w pole tekstu alternatywnego.", False),
        ("4. Kolumna „Do zrobienia przez Ciebie” pokazuje, czego brakuje, zanim post może wyjść. Gdy to zrobisz, zmień Status na Gotowe, Zaplanowane lub Opublikowane.", False),
        ("5. Godziny to czas brytyjski (UK) i polski (PL). 16:00 UK to 11:00 w Nowym Jorku.", False),
        ("", False),
        ("NA CO UWAŻAĆ", True),
        ("Nic nie zostało opublikowane. Pakiet jest gotowy, ale czeka na Twój sygnał.", False),
        ("Miejsca w [KWADRATOWYCH NAWIASACH] trzeba uzupełnić: [STARTER_PAGE_URL] strona zapisu na darmowy Starter Edition, [ZOOM_WORKSHOP_LINK], [ZOOM_INTRO_LINK], [SEATS] realna liczba wolnych miejsc.", False),
        ("Warsztat 19 grudnia jest PROPOZYCJĄ. Jeśli go nie robisz, pomiń posty i e-maile z nim związane (18, 19 i 20 grudnia).", False),
        ("Zgoda Bena i Twoja zostały wyrażone w czacie 24 listopada. Zachowaj zgodę na piśmie. Treści Antka (muzyka, wideo) wymagają jego akceptacji, używaj tylko oryginalnej muzyki.", False),
        ("Przed reklamami płatnymi nie używaj sformułowań sugerujących stan zdrowia dziecka, np. „Czy Twoje dziecko ma ADHD?”. W organicznych postach jest to dozwolone. Najpierw potwierdź, jakie realne wsparcie dla neuroróżnorodnych uczniów oferujesz.", False),
        ("Dane: WEF Future of Jobs 2025 (170 mln nowych miejsc pracy, 92 mln zlikwidowanych do 2030). Sprawdź cennik i terminy na unickorns.com tuż przed publikacją.", False),
    ]
    for t, b in lines:
        ws.append([t]); c = ws.cell(row=ws.max_row, column=1)
        c.font = Font(bold=b, size=14 if b else 11, color=NAVY if b else "222222"); c.alignment = Alignment(wrap_text=True, vertical="top")
    ws.column_dimensions["A"].width = 130
    ws.sheet_view.showGridLines = False

    cal = wb.create_sheet("Kalendarz")
    sheet_calendar(cal, rows_for(set(D.PLATFORMS)))
    for name, codes in TABS:
        sheet_calendar(wb.create_sheet(name), rows_for(set(codes)))

    # scripts
    rows = []
    for k, s in D.SCRIPTS.items():
        rows.append([k, s["title"], s["len"], s["who"], s["props"], "\n".join(f"{i + 1}. {x}" for i, x in enumerate(s["shots"])),
                     "\n".join(s["lines"]), "\n".join(s["onscreen"]), s["notes"]])
    simple_sheet(wb, "Skrypty", ["Nr", "Tytuł", "Długość", "Kto", "Rekwizyty", "Ujęcia", "Tekst do powiedzenia", "Napisy na ekranie", "Uwagi"],
                 rows, [6, 30, 12, 16, 28, 34, 60, 30, 34])
    # carousels
    rows = []
    for cid, c in D.CAROUSELS.items():
        rows.append([cid, "Okładka", c["cover"][1], f"{c['cover'][0]}. {c['cover'][2]}", ""])
        for i, s in enumerate(c["slides"], 2):
            if s[0] == "list":
                body = "\n".join(f"{j}. {x}" for j, x in enumerate(s[2], 1))
            else:
                body = s[2]
            rows.append([cid, f"Slajd {i}", s[1], body, ""])
    simple_sheet(wb, "Karuzele", ["Karuzela", "Slajd", "Nagłówek", "Treść", "Uwagi"], rows, [24, 12, 40, 80, 20])
    # emails
    rows = [[k, e["subject"], e["preview"], e["body"]] for k, e in D.EMAILS.items()]
    simple_sheet(wb, "E-maile", ["Nr", "Temat", "Podgląd", "Treść"], rows, [6, 44, 44, 100])
    # bios
    li = D.BASE
    bios = [
        ["Instagram i TikTok, bio", "Teenpreneurs by uNickorns. Live online entrepreneurship for teens 13 to 18. Not made to blend in. Made to create. Founding Cohort starts 12 Jan 2027.",
         f"{li['apply']}?utm_source=instagram&utm_medium=social&utm_campaign={CAMPAIGN} (dla TikToka utm_source=tiktok)"],
        ["YouTube, opis kanału", "Teenpreneurs is a live international online entrepreneurship programme for teens aged 13 to 18, from uNickorns. Real projects, a small global group and a Portfolio of Proof. Founding Cohort starts 12 and 13 January 2027.",
         f"{li['apply']}?utm_source=youtube&utm_medium=social&utm_campaign={CAMPAIGN}"],
        ["LinkedIn, post o stronie", "Teenpreneurs by uNickorns: a live online programme for teenagers 13 to 18 who have ideas and think differently.", li["about"]],
        ["Nazwa konta", "@unickorns (sprawdź, czy wolna na każdej platformie)", ""],
        ["Avatar", "02_MEDIA/07_marka_profile/avatar.png", ""],
        ["Baner YouTube", "02_MEDIA/07_marka_profile/youtube-banner.png (2560 x 1440, treść w bezpiecznej strefie środkowej)", ""],
        ["Konta zakłada dorosły", "Instagram, TikTok i YouTube wymagają dorosłego właściciela konta. Ben i Antek mogą występować w treściach, ale konto prowadzisz Ty.", ""],
        ["Planowanie postów", "Meta Business Suite (Instagram i Facebook), TikTok Studio na komputerze, YouTube Studio, LinkedIn: harmonogram w kreatorze posta. Albo powiedz mi, które konta podłączyć przez Zapier, a opublikuję po Twoim wyraźnym poleceniu.", ""],
    ]
    simple_sheet(wb, "Profile i start", ["Element", "Treść", "Link"], bios, [28, 90, 60])
    # hashtags
    simple_sheet(wb, "Hashtagi", ["Grupa", "Hashtagi", "Kiedy"], [
        ["core", D.TAGS["core"], "Prawie wszędzie"], ["ai", D.TAGS["ai"], "Posty o AI i pracy"], ["journal", D.TAGS["journal"], "Dziennik"],
        ["music", D.TAGS["music"], "Antek"], ["neuro", D.TAGS["neuro"], "Tylko organicznie, nie w reklamach"],
        ["home", D.TAGS["home"], "Edukacja domowa"], ["build", D.TAGS["build"], "Prototypy i projekty"]], [12, 60, 36])
    # placeholders
    simple_sheet(wb, "Do uzupełnienia", ["Co", "Gdzie występuje", "Kto", "Zrobione"], [
        ["[STARTER_PAGE_URL] strona zapisu na darmowy Starter Edition", "Posty i e-maile od 1 grudnia", "Ty", ""],
        ["[ZOOM_WORKSHOP_LINK] rejestracja na warsztat 19 grudnia (jeśli robisz)", "E-mail 3, post 18 grudnia", "Ty", ""],
        ["[ZOOM_INTRO_LINK] rejestracja na spotkanie 5 stycznia", "E-maile 5 i 6, Stories, rolka 4 stycznia", "Ty", ""],
        ["[SEATS] liczba wolnych miejsc", "Rolka 8 stycznia", "Ty", ""],
        ["Zgoda Antka na użycie jego nagrań i muzyki", "Rolki 5, 12, 23 grudnia i 2 stycznia", "Antek", ""],
        ["Nagrania wg skryptów S1 do S16", "Zakładka Skrypty i plik 03_SKRYPTY", "Ty i Ben", ""],
        ["Sprawdź prawdziwe adaptacje dla neuroróżnorodnych uczniów przed slajdem o ADHD", "Karuzela 5, slajd 9", "Ty", ""]],
        [70, 50, 12, 12])
    wb.save(path)


# ---------- calendar pdf ----------
CSS_BASE = """
@font-face{font-family:"Baloo 2";font-weight:800;src:url(file://%(f)s/Baloo2_800ExtraBold.ttf)}
@font-face{font-family:"Baloo 2";font-weight:700;src:url(file://%(f)s/Baloo2_700Bold.ttf)}
@font-face{font-family:Inter;font-weight:400;src:url(file://%(f)s/Inter_400Regular.ttf)}
@font-face{font-family:Inter;font-weight:600;src:url(file://%(f)s/Inter_600SemiBold.ttf)}
@font-face{font-family:Inter;font-weight:700;src:url(file://%(f)s/Inter_700Bold.ttf)}
*{box-sizing:border-box}body{margin:0;font-family:Inter,sans-serif;color:#0b1326;background:#fff5e6}
h1,h2,h3{font-family:"Baloo 2";margin:0}
""".replace("%(f)s", FONTS)


def chip_label(it):
    code = " ".join(x for x in it["on"] if x not in ("SETUP",))
    return code


def calendar_html():
    by = {}
    for it in D.ITEMS:
        by.setdefault(it["d"], []).append(it)
    pages = ""
    for month, year in ((11, 2026), (12, 2026), (1, 2027)):
        first = dt.date(year, month, 1)
        start = first - dt.timedelta(days=first.weekday())
        cells = ""
        d = start
        weeks = 0
        while True:
            for _ in range(7):
                inm = d.month == month
                chips = ""
                for it in by.get(d.isoformat(), []):
                    col = KIND_COLOR[it["kind"]]
                    fg = "#fff" if it["kind"] in ("reel", "image", "carousel", "yt", "live") else "#0b1326"
                    chips += (f'<div class="chip" style="background:#{col};color:{fg}"><b>{E(chip_label(it))}</b> {E(KIND_PL[it["kind"]])}<br>'
                              f'{E(it["hook"][:44] + ("…" if len(it["hook"]) > 44 else ""))}</div>')
                cells += f'<div class="cell{"" if inm else " off"}"><div class="dn">{d.day}</div>{chips if inm else ""}</div>'
                d += dt.timedelta(days=1)
            weeks += 1
            if d.month != month and d > first:
                break
        head = "".join(f"<div class='dh'>{n}</div>" for n in DAYS_PL_LONG)
        rows_n = weeks
        pages += (f'<section class="pg"><h1>{MONTHS_PL[month]}</h1><div class="grid" style="grid-template-rows:auto repeat({rows_n},1fr)">{head}{cells}</div>'
                  f'<div class="leg">' + "".join(f'<span><i style="background:#{KIND_COLOR[k]}"></i>{KIND_PL[k]}</span>' for k in ("reel", "image", "carousel", "story", "yt", "email", "live", "fbgroup"))
                  + '<span class="codes">IG Instagram · IGR Reels · ST Stories · FB Facebook · FBG grupy · LI LinkedIn · TT TikTok · YTS Shorts · YT YouTube · EM e-mail</span></div></section>')
    css = CSS_BASE + """
@page{size:A4 landscape;margin:0}
.pg{width:297mm;height:210mm;padding:9mm 10mm;page-break-after:always;display:flex;flex-direction:column;overflow:hidden}
h1{font-size:26pt;margin-bottom:3mm}
.grid{flex:1;display:grid;grid-template-columns:repeat(7,1fr);gap:1.2mm;min-height:0}
.dh{font:700 7.5pt Inter;text-transform:uppercase;letter-spacing:.06em;color:#006fa8;padding:0 1mm}
.cell{background:#fff;border:.25mm solid #e6dccb;border-radius:1.6mm;padding:1mm;overflow:hidden;min-height:0}
.cell.off{background:transparent;border-color:transparent}
.dn{font:800 9pt "Baloo 2";color:#0b1326;line-height:1;margin-bottom:.6mm}
.chip{font:400 5.2pt/1.25 Inter;border-radius:1mm;padding:.7mm 1mm;margin-bottom:.6mm}
.chip b{font-weight:700;font-size:5pt;letter-spacing:.02em}
.leg{display:flex;gap:4mm;align-items:center;font:600 6.5pt Inter;margin-top:2.5mm;flex-wrap:wrap}
.leg i{display:inline-block;width:3mm;height:3mm;border-radius:.8mm;margin-right:1mm;vertical-align:-.6mm}
.codes{font-weight:400;color:#555;margin-left:auto}
"""
    return f"<!doctype html><meta charset=utf-8><title>Kalendarz Teenpreneurs</title><style>{css}</style>{pages}"


# ---------- scripts pdf ----------
def scripts_html():
    cards = ""
    for k, s in D.SCRIPTS.items():
        lines = "".join(f"<li>{E(x)}</li>" for x in s["lines"])
        shots = "".join(f"<li>{E(x)}</li>" for x in s["shots"]) or "<li>Bez konkretnych ujęć</li>"
        onscreen = "".join(f"<li>{E(x)}</li>" for x in s["onscreen"])
        live = "min" in s["len"] and "live" in s["len"]
        used = ", ".join(sorted({f"{it['d']} {it['hook'][:38]}" for it in D.ITEMS if it.get("script") == k}))
        cards += f"""<section class="card">
<div class="top"><span class="id">{k}</span><div><h2>{E(s['title'])}</h2><p class="meta">{E(s['len'])} · {E(s['who'])}</p></div></div>
<div class="cols"><div><h3>{'Plan spotkania' if live else 'Tekst do powiedzenia'}</h3><ol class="lines">{lines}</ol></div>
<div><h3>Ujęcia</h3><ul>{shots}</ul>{('<h3>Napisy na ekranie</h3><ul>' + onscreen + '</ul>') if onscreen else ''}<h3>Rekwizyty</h3><p>{E(s['props'])}</p></div></div>
<p class="note"><b>Uwagi.</b> {E(s['notes'])}</p>{('<p class="used">Użyte w: ' + E(used) + '</p>') if used else ''}</section>"""
    tips = """<section class="card intro"><h2>Jak nagrywać w 30 minut</h2>
<ol class="lines"><li>Telefon pionowo (9:16), na statywie lub oparty o książki, światło z okna przed twarzą, nie za plecami.</li>
<li>Jedna scena, jedno ujęcie. Nagraj każdy skrypt 3 razy i wybierz najlepszy. Błędy w mowie są w porządku, to ma być prawdziwe.</li>
<li>Napisy włącz zawsze, 80 procent osób ogląda bez dźwięku. Napisy na ekranie z tej listy możesz dodać w CapCut lub w edytorze Instagrama.</li>
<li>Muzyka: tylko oryginalne utwory Antka, za jego zgodą. Żadnych coverów ani piosenek z listy popularnych, bo klip zostanie wyciszony.</li>
<li>Ben i Antek nagrywają to, co sami uznają za naturalne. Mogą zmienić słowa na swoje, byle zachować sens i brak obietnic, których nie możemy spełnić.</li>
<li>Do każdego wideo wybierz ostatnie zdanie: „Link in bio.” Link jest w kolumnie Link z UTM w pliku Kalendarz.</li></ol></section>"""
    css = CSS_BASE + """
@page{size:A4;margin:12mm}
body{background:#fff;font-size:10pt}
.card{break-inside:avoid;border:.4mm solid #0b1326;border-radius:3mm;padding:5mm 6mm;margin-bottom:6mm;background:#fff5e6}
.card.intro{background:#0b1326;color:#fff5e6}.card.intro h2{color:#ff6b4a}
.top{display:flex;gap:4mm;align-items:center;margin-bottom:2mm}
.id{font:800 14pt "Baloo 2";background:#ff6b4a;color:#fff;border-radius:2mm;padding:1mm 3mm}
h2{font-size:15pt;line-height:1.05}.meta{margin:0;color:#006fa8;font-weight:600;font-size:8.5pt}
h3{font:700 8pt Inter;text-transform:uppercase;letter-spacing:.07em;color:#5b3fc4;margin:2mm 0 1mm}
.cols{display:grid;grid-template-columns:1.35fr 1fr;gap:6mm}
ol.lines{margin:0;padding-left:5mm}ol.lines li{margin-bottom:1.6mm;font-size:10.5pt}
ul{margin:0;padding-left:4.5mm}li{margin-bottom:.8mm}p{margin:0 0 1mm}
.note{margin-top:2mm;font-size:9pt}.used{font-size:8pt;color:#555;margin-top:1mm}
.cover{padding:0 0 6mm}.cover h1{font-size:30pt;color:#0b1326}.cover p{font-size:11pt;max-width:150mm}
"""
    cover = '<section class="cover"><h1>Skrypty nagrań</h1><p>Teenpreneurs by uNickorns · 16 krótkich skryptów, filmów i spotkań na żywo. Teksty są po angielsku, instrukcje po polsku. Zmieniaj słowa na swoje.</p></section>'
    return f"<!doctype html><meta charset=utf-8><title>Skrypty nagrań</title><style>{css}</style>{cover}{tips}{cards}"


def pdf(html_text, out, landscape=False):
    tmp = out + ".html"
    open(tmp, "w", encoding="utf-8").write(html_text)
    js = ("const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage();"
          "await p.goto('file://'+process.argv[1]);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(400);"
          "await p.pdf({path:process.argv[2],preferCSSPageSize:true,printBackground:true});await b.close();})()")
    subprocess.run(["node", "-e", js, tmp, out], check=True)
    os.remove(tmp)


# ---------- plain text ----------
def captions_txt(path):
    out = ["WSZYSTKIE TREŚCI DO WKLEJENIA, PO DACIE I PLATFORMIE", "Godziny w czasie brytyjskim (UK). Polska to godzina więcej.", ""]
    for it in sorted(D.ITEMS, key=lambda x: x["d"]):
        d = dt.date.fromisoformat(it["d"])
        out.append("=" * 78)
        out.append(f"{d.strftime('%d.%m.%Y')} {DAYS_PL_LONG[d.weekday()]}  ·  {KIND_PL[it['kind']]}  ·  {it['hook']}")
        if it.get("media"):
            out.append("PLIK: " + "; ".join(media_ref(m) for m in it["media"]))
        if needs_for(it):
            out.append("DO ZROBIENIA: " + needs_for(it))
        for p in it["on"]:
            out.append("")
            out.append(f"--- {D.PLATFORMS[p]} ({D.TIME[p]} UK) ---")
            if p in ("YT", "YTS"):
                out.append("TYTUŁ: " + title_for(it, p))
            out.append(text_for(it, p))
            if it.get("alt") and p in ("IG", "FB", "LI", "IGR"):
                out.append("")
                out.append("ALT: " + it["alt"])
        out.append("")
    open(path, "w", encoding="utf-8").write("\n".join(out))


START = """TEENPRENEURS · PACZKA POSTÓW I KALENDARZ
=========================================
Okres: 29 listopada 2026 do 13 stycznia 2027. Wszystkie platformy.
Nic nie zostało opublikowane. Pakiet czeka na Twój sygnał.

CO JEST W ŚRODKU
01_KALENDARZ
  Kalendarz_Teenpreneurs.xlsx   główny plik: kalendarz, zakładki dla każdej platformy, skrypty, karuzele, e-maile, profile
  Kalendarz_widok.pdf           kalendarz miesiąc po miesiącu do wydruku lub na lodówkę
  Wszystkie_tresci.txt          wszystkie podpisy do skopiowania, po dacie i platformie
02_MEDIA                        gotowe grafiki, karuzele, stories, wideo, Dziennik (lead magnet), avatar i baner
03_SKRYPTY
  Skrypty_nagran.pdf            16 skryptów do nagrania z ujęciami i tekstem

JAK ZACZĄĆ (30 minut)
1. Otwórz Kalendarz_Teenpreneurs.xlsx i przeczytaj zakładkę „Czytaj najpierw”.
2. Uzupełnij zakładkę „Do uzupełnienia”: link do zapisu na Starter Edition i linki Zoom.
3. Załóż lub podłącz konta (zakładka „Profile i start”). Konta zakłada dorosły.
4. Zaplanuj pierwszy tydzień w Meta Business Suite, TikTok Studio, YouTube Studio i LinkedIn.
5. Nagraj 3 pierwsze wideo wg skryptów S1, S3 i S4, to wystarczy na pierwszy tydzień.

RYTM
Od 1 do 3 publikacji dziennie, razem 58 pozycji w 46 dni: rolki, grafiki, karuzele, Stories, filmy YouTube, e-maile i dwa spotkania na Zoomie.

KOLEJNOŚĆ PRIORYTETÓW, GDY BRAKUJE CZASU
1. Karuzele i grafiki (gotowe), 2. rolki z Benem według skryptów, 3. e-maile, 4. YouTube, 5. reszta.

BEZPIECZEŃSTWO I ZGODY
Ben i Ty wyrazili zgodę w czacie 24 listopada. Zachowaj ją na piśmie.
Treści Antka tylko za jego akceptacją. Tylko oryginalna muzyka.
W reklamach płatnych nie sugeruj stanu zdrowia dziecka. W postach organicznych wolno.
Warsztat 19 grudnia to propozycja. Jeśli go nie robisz, pomiń 18, 19 i 20 grudnia.
Dane o rynku pracy: WEF Future of Jobs Report 2025. Sprawdź ceny i terminy na unickorns.com tuż przed publikacją.

GDY BĘDZIESZ GOTOWA DO PUBLIKACJI
Napisz mi, które kanały mam użyć. Jedynym podłączonym teraz jest LinkedIn. Facebook i Instagram wymagają podłączenia konta w Zapier.
"""


def main():
    os.makedirs(os.path.join(OUT, "01_KALENDARZ"), exist_ok=True)
    os.makedirs(os.path.join(OUT, "03_SKRYPTY"), exist_ok=True)
    copy_media()
    build_workbook(os.path.join(OUT, "01_KALENDARZ", "Kalendarz_Teenpreneurs.xlsx"))
    pdf(calendar_html(), os.path.join(OUT, "01_KALENDARZ", "Kalendarz_widok.pdf"))
    pdf(scripts_html(), os.path.join(OUT, "03_SKRYPTY", "Skrypty_nagran.pdf"))
    captions_txt(os.path.join(OUT, "01_KALENDARZ", "Wszystkie_tresci.txt"))
    open(os.path.join(OUT, "00_START_TUTAJ.txt"), "w", encoding="utf-8").write(START)
    print("pack built:", OUT)


if __name__ == "__main__":
    main()
