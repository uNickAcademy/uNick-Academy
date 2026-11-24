"""Adds bookmarks and metadata to the rendered PDFs and copies them to ../ with their final names."""
import json, os, shutil
import pymupdf as fitz

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out")
DEST = os.path.join(HERE, "..")

JOBS = [
    ("Teenpreneur_Journal_v6_digital.pdf", "digital.toc.json", "Teenpreneur_Journal_v6_DIGITAL_A5.pdf", "The Teenpreneur Journal", True),
    ("Teenpreneur_Journal_v6_print.pdf", None, "Teenpreneur_Journal_v6_PRINT_A5_3mm-bleed.pdf", "The Teenpreneur Journal (print, A5 + 3 mm bleed)", True),
    ("Teenpreneur_Journal_Starter_Edition_raw.pdf", "starter.toc.json", "Teenpreneur_Journal_Starter_Edition.pdf", "The Teenpreneur Journal: Starter Edition", False),
]
for src, tocf, dst, title, full in JOBS:
    d = fitz.open(os.path.join(OUT, src))
    d.set_metadata({"title": title, "author": "Milena Rudd", "subject": "A journal for teenagers who think differently, from uNickorns",
                    "keywords": "Teenpreneurs, uNickorns, teen journal, mindset, entrepreneurship", "creator": "uNickorns", "producer": "uNickorns"})
    if tocf:
        entries = json.load(open(os.path.join(OUT, tocf)))
        toc, last = [], 0
        for e in entries:
            lvl = 1 if e["level"] in ("part", "item") else (2 if full else 1)
            lvl = min(lvl, last + 1) if toc else 1
            toc.append([lvl, e["label"], e["page"]])
            last = lvl
        d.set_toc(toc)
    d.save(os.path.join(DEST, dst), garbage=4, deflate=True)
    links = sum(len(p.get_links()) for p in d)
    print(f"{dst}: {len(d)} pages, {os.path.getsize(os.path.join(DEST, dst)) / 1e6:.1f} MB, {links} links, {len(d.get_toc())} bookmarks")
