import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import art
tones=["coral","lavender","blue","seafoam"]
css=open("build_book.py",encoding="utf-8").read().split('CSS = r"""')[1].split('"""')[0].replace("__W__","154").replace("__H__","216").replace("__B__","3mm")
cells=""
for i,k in enumerate(art.SPOT):
    cells+=f'<div class="cell t-{tones[i%4]}">{art.svg(k)}<small>{k}</small></div>'
op=""
for n in range(1,5):
    t=["coral","lavender","blue","seafoam"][n-1]
    op+=f'<div class="op t-{t}">{art.opener(n)}</div>'
html=f'''<!doctype html><meta charset=utf-8><style>{css}{art.CSS}
body{{background:#fff;padding:10mm;width:260mm}}
.pg2{{display:grid;grid-template-columns:repeat(6,1fr);gap:6mm}}
.cell{{text-align:center}} .cell svg{{width:36mm;height:36mm;margin:auto}} small{{font:11px Inter}}
.ops{{display:grid;grid-template-columns:repeat(2,1fr);gap:6mm;margin-top:8mm}}
.op{{background:var(--tone);padding:8mm}} .op svg{{width:100%}}
</style><div class=pg2>{cells}</div><div class=ops>{op}</div>'''
open("art_preview.html","w",encoding="utf-8").write(html)
