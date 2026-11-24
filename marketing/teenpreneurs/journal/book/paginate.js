/* Flows blocks onto fixed size pages, then numbers pages, fills the contents page and pads to a multiple of four. */
(function () {
  const src = document.getElementById('src');
  const book = document.getElementById('book');
  const items = Array.from(src.children);
  const report = { overflow: [], pages: 0, notes: 0 };

  const foot = () => '<div class="foot"><span>The Teenpreneur Journal</span><span class="num"></span></div>';
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

  function runFlow(it, s) {
    const tone = it.dataset.tone;
    const bandT = it.querySelector('template.bandtpl');
    const headT = it.querySelector('template.headtpl');
    const blocks = Array.from(it.querySelector('.blocks').children).map((b) => b.cloneNode(true));
    const made = [];
    const mk = (first) => {
      const p = newFlowPage(tone, first, bandT ? bandT.innerHTML : '', headT ? headT.innerHTML : '');
      if (it.dataset.compact && first) p.classList.add('compactband');
      p.querySelector('.safe').style.setProperty('--s', s);
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
    const trials = SCALES.map((s) => {
      const r = runFlow(it, s);
      r.made.forEach((p) => book.removeChild(p));
      return { s, n: r.made.length, tooBig: r.tooBig };
    });
    const ok = trials.filter((t) => !t.tooBig);
    const target = Math.min(...ok.map((t) => t.n));
    const best = ok.filter((t) => t.n === target).sort((a, b) => b.s - a.s)[0] || trials[trials.length - 1];
    const r = runFlow(it, best.s);
    if (r.tooBig) report.overflow.push('flow block taller than a page: ' + (it.dataset.toc || it.dataset.tone));
    report['fit ' + (it.dataset.toc || it.dataset.tone)] = best.s + 'x' + best.n;
  }

  // pad to a multiple of four with notes pages, keeping the closing page last
  const closing = book.querySelector('.page.closing');
  const noteTpl = book.querySelector('.page.notes');
  while (book.children.length % 4 !== 0) {
    book.insertBefore(noteTpl.cloneNode(true), closing);
    report.notes++;
  }

  // numbers and references
  const pages = Array.from(book.children);
  const ids = {};
  pages.forEach((p, i) => {
    p.dataset.n = i + 1;
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
    row.innerHTML = '<span class="lbl"></span><span class="d"></span><span class="pg">' + (i + 1) + '</span>';
    row.querySelector('.lbl').textContent = label.replace('  ', ' · ');
    toc.appendChild(row);
  });

  // overflow check on every fixed page
  pages.forEach((p, i) => {
    const s = p.querySelector('.safe');
    if (s && !p.classList.contains('cover') && !p.classList.contains('closing') && !p.classList.contains('opener') && over(s)) report.overflow.push('page ' + (i + 1) + ' overflows');
  });
  report.pages = pages.length;
  window.__report = report;
})();
