/* Flows blocks onto fixed size pages, then numbers pages, fills the contents page and pads to a multiple of four. */
(function () {
  const src = document.getElementById('src');
  const book = document.getElementById('book');
  const items = Array.from(src.children);
  const report = { overflow: [], pages: 0, notes: 0 };

  const foot = () => '<div class="foot"><span>' + (window.FOOT || 'The Teenpreneur Journal') + '</span><span class="num"></span></div>';
  const over = (safe) => safe.scrollHeight > safe.clientHeight + 0.6;
  const keepNext = (el) => el.classList.contains('h') || (el.classList.contains('p') && /:\s*$/.test(el.textContent));

  function newFlowPage(tone, first, band, head) {
    const p = document.createElement('div');
    p.className = 'page t-' + tone;
    p.dataset.tone = tone;
    const withBand = first && band;
    p.innerHTML = (withBand ? band : '<div class="stripe"></div>') +
      '<div class="safe' + (withBand ? ' withband' : '') + '">' + (first && head ? head : '') + '</div>' + foot();
    book.appendChild(p);
    return p;
  }

  const SCALES = [1.05, 1.0, 0.965, 0.93];
  const ART = [1, 0.8, 0.62, 0.5, 0];

  function runFlow(it, s, aw) {
    const tone = it.dataset.tone;
    const bandT = it.querySelector('template.bandtpl');
    const headT = it.querySelector('template.headtpl');
    let blocks = Array.from(it.querySelector('.blocks').children).map((b) => b.cloneNode(true));
    if (aw === 0) blocks = blocks.filter((b) => !b.classList.contains('art'));
    const made = [];
    const mk = (first) => {
      const p = newFlowPage(tone, first, bandT ? bandT.innerHTML : '', headT ? headT.innerHTML : '');
      if (it.dataset.compact && first) p.classList.add('compactband');
      const sf = p.querySelector('.safe');
      sf.style.setProperty('--s', s);
      sf.style.setProperty('--aw', aw);
      made.push(p);
      return p;
    };
    let page = mk(true);
    if (it.dataset.toc) page.dataset.toc = it.dataset.toc;
    if (it.dataset.id) page.dataset.id = it.dataset.id;
    let safe = page.querySelector('.safe');
    let tooBig = false;
    for (const b of blocks) {
      safe.appendChild(b);
      if (over(safe)) {
        safe.removeChild(b);
        const carry = [b];
        while (safe.lastElementChild && keepNext(safe.lastElementChild) && safe.children.length > 1) {
          carry.unshift(safe.removeChild(safe.lastElementChild));
        }
        page = mk(false);
        safe = page.querySelector('.safe');
        carry.forEach((c) => safe.appendChild(c));
        if (over(safe)) tooBig = true;
      }
    }
    return { made, tooBig };
  }

  for (const it of items) {
    if (!it.classList.contains('flow')) { book.appendChild(it); continue; }
    const hasArt = !!it.querySelector('.blk.art');
    const trials = [];
    for (const s of SCALES) {
      for (const aw of (hasArt ? ART : [1])) {
        const r = runFlow(it, s, aw);
        r.made.forEach((p) => book.removeChild(p));
        trials.push({ s, aw, n: r.made.length, tooBig: r.tooBig });
      }
    }
    const ok = trials.filter((t) => !t.tooBig);
    const pool = ok.length ? ok : trials;
    const target = Math.min(...pool.map((t) => t.n));
    const best = pool.filter((t) => t.n === target).sort((a, b) => b.s - a.s || b.aw - a.aw)[0];
    const r = runFlow(it, best.s, best.aw);
    if (hasArt && best.aw === 0) {
      const band = r.made[0].querySelector('.band');
      const src = it.querySelector('.blk.art svg');
      if (band && src) { const sv = src.cloneNode(true); sv.classList.add('onTone'); const d = document.createElement('div'); d.className = 'band-art'; d.appendChild(sv); band.appendChild(d); }
    }
    if (r.tooBig) report.overflow.push('flow block taller than a page: ' + (it.dataset.toc || it.dataset.tone));
    report['fit ' + (it.dataset.toc || it.dataset.tone)] = best.s + 'x' + best.n + (hasArt ? ' art' + best.aw : '');
  }

  // pad to a multiple of four with notes pages, keeping the closing page last
  const closing = book.querySelector('.page.closing');
  const noteTpl = book.querySelector('.page.notes') || document.getElementById('notes-tpl').content.firstElementChild;
  while (book.children.length % 4 !== 0) {
    book.insertBefore(noteTpl.cloneNode(true), closing);
    report.notes++;
  }

  // numbers and references
  const pages = Array.from(book.children);
  const ids = {};
  pages.forEach((p, i) => {
    p.dataset.n = i + 1;
    p.id = 'p' + (i + 1);
    const n = p.querySelector('.foot .num');
    if (n) n.textContent = i + 1;
    if (p.dataset.id) ids[p.dataset.id] = i + 1;
  });
  document.querySelectorAll('.ref').forEach((r) => { r.textContent = ids[r.dataset.ref] || '?'; });

  // contents
  const toc = document.getElementById('toc');
  pages.forEach((p, i) => {
    if (!p.dataset.toc) return;
    const [label, level] = p.dataset.toc.split('|');
    const row = document.createElement('div');
    row.className = 'row ' + (level || 'item') + ' t-' + p.dataset.tone;
    row.innerHTML = '<a href="#p' + (i + 1) + '"><span class="lbl"></span><span class="d"></span><span class="pg">' + (i + 1) + '</span></a>';
    row.querySelector('.lbl').textContent = label.replace('  ', ' · ');
    toc.appendChild(row);
    (report.toc = report.toc || []).push({ label: label.replace('  ', ' · '), level: level || 'item', page: i + 1 });
  });

  // overflow check on every fixed page
  pages.forEach((p, i) => {
    const s = p.querySelector('.safe');
    if (s && !p.classList.contains('cover') && !p.classList.contains('closing') && !p.classList.contains('opener') && over(s)) report.overflow.push('page ' + (i + 1) + ' overflows');
  });
  report.pages = pages.length;
  window.__report = report;
})();
