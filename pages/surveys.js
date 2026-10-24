// InSIS+ — Courses › Course evaluation: the list of course questionnaires (anketky/dotazniky.pl). Treatment L in
// place (docs/ia/03-pages.md §2 "Moving InSIS's elements", teardowns/courses.md §2.7).
// InSIS shows a breadcrumb, an intro line, a long paragraph on anonymity, the table Code · Course title · Part · Date
// of opening · Date of conclusion · Questionnaire and a key of the icons in the last cell (dotaznik-vyplneni = to fill
// in, a link to dotaznik.pl; dotaznik-vyplneny = filled in; dotaznik-sber-neprobiha = not open). dotaznik.pl is
// insis-only (read: never): its "Fill in" link is InSIS's own element and stays exactly where InSIS put it.
// Here: a summary above the list (how many are open and until when, which are done, when the rest open), the
// paragraph shortened into one line, and InSIS's own table styled in place: each row and cell gets data-ipx-*
// attributes only (state, column name for the phone layout, a text chip instead of the icon), so CSS can draw it;
// nothing in it is rebuilt, moved, reordered, copied or clicked. The legend is hidden (the chips say it in words).
// Nothing is stored.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.ui || !ipx.nav) return;
  const { lang, clean, norm } = ipx;
  const { h, icon, anchor, takeover, kpi, countdown, wallTime, deadlineTone, emptyState, styleSlotted, hideInSlot } = ipx.ui;
  const nav = ipx.nav;
  const locale = lang === 'cs' ? 'cs-CZ' : 'en-GB';

  const T = {
    cs: { open: 'K vyplnění', done: 'Vyplněno', later: 'Otevře se později', none: 'Žádný',
      until: (d) => `do ${d}`, opens: (d) => `otevře se ${d}`, afterResult: 'po zapsání výsledku', closed: 'uzavřeno',
      fill: 'Vyplnit', filled: 'vyplněno', allDone: 'vše vyplněno', firstOpens: (d) => `první ${d}`,
      openNow: 'Otevřené dotazníky', lead: 'Odpovědi jsou anonymní a po uložení je už nejde změnit. Dotazník vyplníte tlačítkem Vyplnit v seznamu InSIS.',
      empty: 'Pro vaše předměty teď nejsou žádné dotazníky.', noneOpen: 'Teď není otevřený žádný dotazník.' },
    en: { open: 'To fill in', done: 'Filled in', later: 'Opens later', none: 'None',
      until: (d) => `until ${d}`, opens: (d) => `opens ${d}`, afterResult: 'after your result is entered', closed: 'closed',
      fill: 'Fill in', filled: 'filled in', allDone: 'all filled in', firstOpens: (d) => `first ${d}`,
      openNow: 'Open questionnaires', lead: 'Answers are anonymous and cannot be changed once saved. Open a questionnaire with Fill in in InSIS\'s list.',
      empty: 'There are no questionnaires for your courses right now.', noneOpen: 'No questionnaire is open right now.' },
  }[lang];

  // "06/10/2026 00:00", "6. 10. 2026 0:00" → Date; InSIS's words ("date of result entry") → null.
  function dateOf(text) {
    const m = /(\d{1,2})\s*[./]\s*(\d{1,2})\s*[./]\s*(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/.exec(text || '');
    return m ? new Date(+m[3], +m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0)) : null;
  }
  const stamp = (d) => {
    const w = wallTime(d);
    return `${w.day.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })} ${w.time}`;
  };
  const day = (d) => wallTime(d).day.toLocaleDateString(locale, { day: 'numeric', month: 'short' });

  const COLS = [['code', /^(code|kod)/], ['name', /(course|predmet|nazev)/], ['part', /^(part|cast)/],
    ['opens', /(opening|otevren|zahajen|zacat|^od)/], ['closes', /(conclusion|uzavren|ukoncen|konec|^do)/], ['form', /(questionnaire|dotaznik|anket)/]];

  function parse() {
    const page = document.getElementById('str1');
    if (!page) return null;
    const table = [...page.querySelectorAll('table')].find((t) => t.querySelector('[data-sysid^="dotaznik-"]') && t.querySelector('tr.zahlavi, thead'))
      || [...page.querySelectorAll('table')].find((t) => {
        const head = [...(t.querySelector('tr.zahlavi, thead tr')?.cells || [])].map((c) => norm(c.textContent));
        return head.some((x) => /^(code|kod)/.test(x)) && head.some((x) => /(questionnaire|dotaznik)/.test(x));
      });
    const legend = page.querySelector('.uisLegend');
    if (!table) return { page, table: null, rows: [], legend };
    const headCells = [...table.querySelector('tr.zahlavi, thead tr').cells];
    const head = headCells.map((c) => clean(c.textContent));
    const col = {};
    head.forEach((text, i) => { const k = COLS.find(([, re]) => re.test(norm(text)))?.[0]; if (k && !(k in col)) col[k] = i; });
    const now = new Date();
    const rows = [...table.querySelectorAll('tbody tr')].filter((tr) => tr.closest('table') === table && !tr.classList.contains('zahlavi') && tr.cells.length > 2).map((tr) => {
      const cell = (k) => (k in col ? tr.cells[col[k]] : null);
      const text = (k) => clean(cell(k)?.textContent);
      const formCell = cell('form') || tr.cells[tr.cells.length - 1];
      const sys = formCell?.querySelector('[data-sysid^="dotaznik-"]')?.getAttribute('data-sysid') || '';
      const fill = formCell?.querySelector('a[href*="dotaznik.pl"]') || null;
      const opens = dateOf(text('opens'));
      const closes = dateOf(text('closes'));
      // InSIS's icon says the state; a "Fill in" link is the proof that it is open now.
      const state = fill || sys === 'dotaznik-vyplneni' ? 'open' : sys === 'dotaznik-vyplneny' ? 'done'
        : closes && closes <= now ? 'closed' : 'later';
      return { tr, formCell, fill, state, code: text('code'), name: text('name'), part: text('part'), opensText: text('opens'), opens, closes };
    });
    return { page, table, rows, legend, head, now };
  }

  // The data-ipx-* attributes CSS draws from. Only attributes are added: InSIS's cells and links stay as they are.
  function mark(d) {
    d.table.setAttribute('data-ipx-surveys', '');
    for (const r of d.rows) {
      r.tr.setAttribute('data-ipx-state', r.state);
      [...r.tr.cells].forEach((td, i) => { if (d.head[i]) td.setAttribute('data-ipx-label', d.head[i]); });
      const chip = r.state === 'open' ? null : r.state === 'done' ? T.filled : r.state === 'closed' ? T.closed
        : r.opens && r.opens > d.now ? T.opens(day(r.opens)) : T.afterResult;
      if (chip) r.formCell.setAttribute('data-ipx-chip', chip);
      // The "Fill in" link shows its name in words next to InSIS's icon (CSS ::after); the link itself is untouched.
      if (r.fill) r.fill.setAttribute('data-ipx-text', T.fill);
    }
  }

  // InSIS's chrome around the list: the intro line and the anonymity paragraph (shortened into the lead), the breaks
  // between them and the key of icons. Hidden while InSIS+ is on; Classic view shows them again.
  function chrome(d) {
    const out = [...d.page.querySelectorAll('div.small')].filter((n) => !d.table?.contains(n));
    for (const n of [...out]) for (let s = n.nextElementSibling; s?.tagName === 'BR'; s = s.nextElementSibling) out.push(s);
    if (d.legend) out.push(d.legend);
    // Without a list, InSIS's own sentence is said once, in the empty state.
    if (!d.rows.length) out.push(...d.page.querySelectorAll('.uis_msg'));
    return out;
  }

  function summary(d) {
    const open = d.rows.filter((r) => r.state === 'open').sort((a, b) => (a.closes || Infinity) - (b.closes || Infinity));
    const done = d.rows.filter((r) => r.state === 'done');
    const later = d.rows.filter((r) => r.state === 'later');
    const first = open.find((r) => r.closes);
    const nextOpen = later.map((r) => r.opens).filter((x) => x && x > d.now).sort((a, b) => a - b)[0];
    const mine = new Set((ipx.state.studyRecord?.courses || []).map((c) => c.code));
    const courseOf = (r) => (mine.has(r.code) ? anchor({ href: nav.composedUrl('course.overview', r.code) }, {}, r.name || r.code) : h('span', {}, r.name || r.code));
    return [
      h('div', { class: 'kpis' },
        kpi({ label: T.open, value: open.length,
          status: first && { tone: deadlineTone(first.closes, false, d.now), text: countdown(first.closes, d.now) },
          foot: first ? T.until(stamp(first.closes)) : open.length ? null : T.noneOpen }),
        kpi({ label: T.done, value: done.length, status: d.rows.length > 0 && done.length === d.rows.length && { tone: 'ok', text: T.allDone } }),
        kpi({ label: T.later, value: later.length, foot: later.length ? (nextOpen ? T.firstOpens(day(nextOpen)) : T.afterResult) : null })),
      open.length > 0 && h('section', { class: 'card sv-open' },
        h('div', { class: 'card-head' }, h('h2', {}, T.openNow)),
        h('ul', { class: 'sv-list' }, open.map((r) => h('li', {},
          h('span', { class: 'sv-body' }, h('small', {}, [r.code, r.part].filter(Boolean).join(' · ')), h('strong', {}, courseOf(r))),
          r.closes && h('span', { class: 'sv-when' }, T.until(stamp(r.closes))),
          r.closes && h('span', { class: `delta ${deadlineTone(r.closes, false, d.now)}` }, countdown(r.closes, d.now)))))),
    ];
  }

  ipx.ready.then(() => {
    if (nav.route(document.baseURI.split('#')[0]).path !== '/auth/anketky/dotazniky.pl') return;
    const d = parse();
    if (!d) return;
    if (d.table) mark(d);
    hideInSlot(chrome(d));
    styleSlotted('pages/surveys.css');
    takeover({
      key: 'surveys',
      css: ['kit.css', 'pages/surveys.css'],
      title: nav.sectionLabel('courses.evaluation'),
      subtitle: nav.label('courses'),
      slotted: [d.page],
      build: () => h('div', { class: 'kit-page sv' },
        d.rows.length ? [summary(d), h('p', { class: 'kit-note info' }, icon('info'), h('span', {}, T.lead))]
          : emptyState(clean(d.page.querySelector('.uis_msg')?.textContent) || T.empty),
        h('slot')),
    });
  });
})();
