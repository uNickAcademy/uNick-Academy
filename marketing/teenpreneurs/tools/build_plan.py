"""Builds ../campaign-plan.html from plan_template.html and ../content-calendar.csv."""
import csv, html, os, datetime
HERE = os.path.dirname(os.path.abspath(__file__))
rows = list(csv.DictReader(open(os.path.join(HERE, "..", "content-calendar.csv"), encoding="utf-8")))
weeks = {}
for r in rows:
    weeks.setdefault(r["Week theme"], []).append(r)
out = []
for i, (theme, items) in enumerate(weeks.items()):
    d0 = datetime.date.fromisoformat(items[0]["Date"]); d1 = datetime.date.fromisoformat(items[-1]["Date"])
    span = f"{d0.day} {d0:%b} to {d1.day} {d1:%b}"
    body = []
    for r in items:
        d = datetime.date.fromisoformat(r["Date"])
        live = ' <span class="tag live">LIVE</span>' if "Zoom live" in r["Channel"] else ""
        body.append("<tr><td style='white-space:nowrap'><strong>%s %d %s</strong></td><td>%s%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td></tr>" % (
            r["Day"], d.day, d.strftime("%b"), html.escape(r["Channel"]), live, html.escape(r["Format"]),
            html.escape(r["Hook or title"]), html.escape(r["Asset needed"]), html.escape(r["Call to action"])))
    out.append('<details class="week"%s><summary><span>%s</span><span class="small">%s</span></summary><div class="tablebox"><table><tr><th>Day</th><th>Channel</th><th>Format</th><th>Hook or title</th><th>Asset</th><th>CTA</th></tr>%s</table></div></details>' % (
        " open" if i == 0 else "", html.escape(theme), span, "".join(body)))
t = open(os.path.join(HERE, "plan_template.html"), encoding="utf-8").read()
open(os.path.join(HERE, "..", "campaign-plan.html"), "w", encoding="utf-8").write(t.replace("<!--CALENDAR-->", "\n".join(out)))
print("ok", len(rows))
