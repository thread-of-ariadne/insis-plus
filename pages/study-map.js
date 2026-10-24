// InSIS+ — Grades & credits › What's left › Map of my study (student/mapa_studii.pl). Treatment R
// (docs/ia/03-pages.md §3; teardowns/exams-grades-schedule.md §2.5: a page below What's left).
//
// InSIS's page: the portal bar, a help paragraph, the student's name, then a layout table that draws the study on a
// time line: a header row of years (th colspan=12, one column per month), and per study a row of cells whose ids
// end in void<n> (no study) or stud<n> / other words (a stretch of the study; the first such stretch runs up to
// today, the next one is the rest of its standard length), each with a colspan in months; "Today" is a floating
// label. Under it, InSIS's key (uisLegend) lists each study: "1." + its title, then label/value lines (since, code,
// programme, field, type, form, progress, financing).
//
// Here: a time line card (years, one bar per study from its start to its expected end, the part up to today filled,
// a Today mark) and one facts card per study. Nothing to act on: the original is hidden; Classic view shows it.
// Nothing is stored.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.kit) return;
  const { clean, lang } = ipx;
  const { h, icon } = ipx.ui;
  const kit = ipx.kit;
  const nav = ipx.nav;
  const PATH = '/auth/student/mapa_studii.pl';

  const T = {
    cs: { title: 'Mapa studia', lead: 'Vaše studia na VŠE na časové ose: od začátku po předpokládaný konec standardní doby studia.',
      today: 'Dnes', studies: (n) => `${n} ${kit.plural(n, 'studium', 'studia', 'studií')}`, timeline: 'Časová osa', details: 'Studium',
      elapsed: 'dosud', planned: 'standardní doba', break: 'přerušení', none: 'InSIS pro vás nezobrazuje žádné studium.' },
    en: { title: 'Map of my study', lead: 'Your studies at VŠE on a time line: from the start to the expected end of the standard length.',
      today: 'Today', studies: (n) => `${n} ${n === 1 ? 'study' : 'studies'}`, timeline: 'Time line', details: 'Study',
      elapsed: 'so far', planned: 'standard length', break: 'interruption', none: 'InSIS shows no study for you.' },
  }[lang];

  function parse(page) {
    const table = [...page.querySelectorAll('table')].find((t) => t.querySelector('thead th[colspan="12"]') && t.querySelector('td[id*="void"], td[id*="stud"]'));
    if (!table) return null;
    const years = [...table.querySelectorAll('thead th')].map((th) => ({ year: Number(clean(th.textContent)), months: Number(th.getAttribute('colspan')) || 12 }))
      .filter((y) => y.year > 1900);
    if (!years.length) return null;
    const months = years.reduce((s, y) => s + y.months, 0);
    // One row per study: cells with ids "<study><where><kind><n>", e.g. "123456tato_vsstud2"; kinds other than
    // "void" are stretches of the study ("stud"; anything else, e.g. an interruption, keeps its own kind).
    const bars = [];
    for (const tr of table.tBodies[0]?.rows || []) {
      const cells = [...tr.cells].filter((td) => /void|stud|\D\d+$/.test(td.id || ''));
      if (!cells.length) continue;
      let at = 0;
      const parts = [];
      for (const td of tr.cells) {
        const span = Number(td.getAttribute('colspan')) || 1;
        const kind = /void\d*$/.test(td.id) ? 'void' : /stud\d*$/.test(td.id) ? 'stud' : td.id ? 'other' : 'void';
        if (kind !== 'void') parts.push({ from: at, to: at + span, kind, label: clean(td.textContent) });
        at += span;
      }
      if (parts.length) bars.push({ parts, label: parts.map((p) => p.label).find(Boolean) || '' });
    }
    // The key: one block per study ("1." + title, then label / value lines).
    const studies = [];
    for (const t of page.querySelectorAll('.uisLegendContent table table')) {
      let cur = null;
      for (const tr of t.rows) {
        const cells = [...tr.cells];
        const title = tr.querySelector('b');
        if (title && /^\d+\.$/.test(clean(cells[0]?.textContent))) { cur = { title: clean(title.textContent), facts: [] }; studies.push(cur); continue; }
        if (cur && cells.length >= 3) {
          const label = clean(cells[1].textContent).replace(/:$/, '');
          const value = clean(cells[2].textContent);
          if (label && value) cur.facts.push({ label, value });
        }
      }
    }
    return { years, months, bars, studies };
  }

  function timeline(d) {
    const start = new Date(d.years[0].year, 0, 1);
    const now = new Date();
    const nowAt = (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() + (now.getDate() - 1) / 31;
    const pct = (m) => `${Math.max(0, Math.min(100, (m / d.months) * 100))}%`;
    return h('section', { class: 'card pad sm-line' },
      h('h2', { class: 'card-title' }, T.timeline),
      h('div', { class: 'sm-axis', style: `--months: ${d.months}` },
        h('div', { class: 'sm-years' }, d.years.map((y) => h('span', { style: `flex: ${y.months}` }, String(y.year)))),
        h('div', { class: 'sm-bars' },
          d.bars.map((b) => {
            const from = Math.min(...b.parts.map((p) => p.from));
            const to = Math.max(...b.parts.map((p) => p.to));
            return h('div', { class: 'sm-bar', style: `left: ${pct(from)}; width: calc(${pct(to)} - ${pct(from)})`, title: b.label },
              h('span', { class: 'sm-done', style: `width: ${Math.max(0, Math.min(100, ((nowAt - from) / (to - from)) * 100))}%` }),
              b.parts.filter((p) => p.kind === 'other').map((p) => h('span', { class: 'sm-break', title: T.break,
                style: `left: ${((p.from - from) / (to - from)) * 100}%; width: ${((p.to - p.from) / (to - from)) * 100}%` })),
              h('span', { class: 'sm-label' }, b.label));
          }),
          nowAt >= 0 && nowAt <= d.months && h('span', { class: 'sm-today', style: `left: ${pct(nowAt)}` }, h('small', {}, T.today))),
        h('div', { class: 'sm-ticks' }, d.years.map((y) => h('span', { style: `flex: ${y.months}` })))),
      h('p', { class: 'sm-key' },
        h('span', {}, h('i', { class: 'sm-swatch done' }), T.elapsed),
        h('span', {}, h('i', { class: 'sm-swatch' }), T.planned)));
  }

  ipx.ready.then(() => {
    if (nav.route(document.baseURI.split('#')[0]).path !== PATH) return;
    const page = document.getElementById('str1');
    const d = page && parse(page);
    if (!d) return; // generic.js keeps InSIS's page under its header
    kit.page({
      key: 'study-map',
      css: 'pages/study-map.css',
      // A page below What's left (03-pages.md rule 7): its own name as the title, the section as the eyebrow.
      title: T.title,
      subtitle: nav.sectionLabel('grades.plan'),
      build: () => [
        h('p', { class: 'muted sm-lead' }, T.lead),
        d.bars.length ? timeline(d) : ipx.ui.emptyState(T.none),
        d.studies.map((s) => h('section', { class: 'card pad' },
          h('h2', { class: 'card-title sm-study' }, icon('cap'), h('span', {}, s.title)),
          kit.facts(s.facts))),
      ],
    });
  });
})();
