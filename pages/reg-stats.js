// InSIS+ — Registration & enrolment › Enrolment statistics (student/reg_stat_tridy.pl and studijni/reg_stat_tridy.pl,
// the same InSIS tool reached from the student's menu and from InSIS's Study Department hub). Treatment R, with
// InSIS's filter form slotted (03-pages.md §2, filter forms; §3).
//
// Three steps, all with the same header (a page below the Registration & enrolment section, rule 7: the tool's
// name as the title, the section as the eyebrow) and a path line from InSIS's breadcrumbs (unit › period):
// 1. no parameters: InSIS's unit picker (div.vyber-fakult a.fakulta) → faculty cards (the student's own faculty
//    first) and the other units as a list;
// 2. ?fakulta=…: the unit's periods (Name of period · Beginning · End · Public period · Select) → a list, the
//    periods running now marked;
// 3. ?fakulta=…;obdobi=…: InSIS's own tab row (registration / enrolment × timetable items / courses, study) → one
//    row of view tabs (views of one thing: the numbers of that unit and period); InSIS's filter form (form of study,
//    supervising department, Display) → slotted whole, collapsed under Filter, never filled or sent by InSIS+; the
//    result table → an InSIS+ table (kit.dataTable, every column InSIS gives, links kept), InSIS's "No suitable data
//    found." → the kit's empty state; InSIS's letter pager, when it shows one, as letter chips (its own links).
// Every link is InSIS's own, through the URL rule. Nothing is stored.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.kit) return;
  const { clean, norm, lang } = ipx;
  const { h, icon, anchor, cover, facultyColors, facultyOf, sectionHead, emptyState } = ipx.ui;
  const kit = ipx.kit;
  const nav = ipx.nav;
  const PATHS = ['/auth/student/reg_stat_tridy.pl', '/auth/studijni/reg_stat_tridy.pl'];

  const T = {
    cs: { title: 'Statistika zápisu', pickUnit: 'Vyberte fakultu nebo součást, jejíž předměty chcete sledovat.',
      pickPeriod: 'Vyberte období, za které chcete počty registrovaných a zapsaných studentů vidět.',
      faculties: 'Fakulty', units: 'Další součásti', yours: 'vaše fakulta', nowPeriod: 'probíhá', notPublic: 'neveřejné',
      lead: 'Počty studentů registrovaných a zapsaných na předměty a rozvrhové akce, jak je InSIS právě vede.',
      filter: 'Filtr', filterLead: 'Forma studia a garantující pracoviště; po stisku tlačítka InSIS seznam znovu načte.',
      empty: 'InSIS pro tento výběr nic nenašel. Zkuste ve Filtru jinou formu studia nebo pracoviště.',
      letters: 'Počáteční písmeno', views: 'Přehledy', rows: (n) => `${n} ${kit.plural(n, 'řádek', 'řádky', 'řádků')}` },
    en: { title: 'Enrolment statistics', pickUnit: 'Choose the faculty or unit whose courses you want to follow.',
      pickPeriod: 'Choose the period whose registration and enrolment numbers you want to see.',
      faculties: 'Faculties', units: 'Other units', yours: 'your faculty', nowPeriod: 'now', notPublic: 'not public',
      lead: 'How many students are registered and enrolled in courses and timetable items, as InSIS has it now.',
      filter: 'Filter', filterLead: 'Form of study and supervising department; when you press its button, InSIS reloads the list.',
      empty: 'InSIS found nothing for this selection. Try another form of study or department in the filter.',
      letters: 'First letter', views: 'Overviews', rows: (n) => `${n} ${n === 1 ? 'row' : 'rows'}` },
  }[lang];

  // ---------- reading ----------

  // InSIS's breadcrumbs after "Enrollment statistics": the unit, then the period.
  function pathOf(page) {
    const items = [...page.querySelectorAll('.breadcrumb-item')];
    const at = items.findIndex((li) => /reg_stat_tridy\.pl$/.test(li.querySelector('a')?.getAttribute('href') || '') || /statisti/i.test(li.textContent));
    return items.slice(at + 1).map((li) => {
      const a = li.querySelector('a[href]');
      return (a && kit.linkOf(a)) || { text: clean(li.textContent) };
    }).filter((c) => c.text);
  }

  function readUnits(page) {
    const links = [...page.querySelectorAll('.vyber-fakult a.fakulta[href]')];
    if (links.length < 2) return null;
    const units = links.map((a) => {
      const l = kit.linkOf(a);
      if (!l) return null;
      const logo = a.querySelector('img')?.getAttribute('src') || '';
      const code = /fakulta=(\d+)/.exec(a.getAttribute('href'))?.[1];
      const fac = kit.FACULTY_BY_LOGO[logo.match(/\/(ffu|fmv|fph|fis|fnh|fmh)-/)?.[1]] || kit.FACULTY_BY_CODE[code] || '';
      return { href: l.href, text: clean(a.querySelector('.nazev')?.textContent) || l.text, fac };
    }).filter(Boolean);
    return units.length ? { kind: 'units', units } : null;
  }

  function readPeriods(page) {
    const table = kit.findTables(page).find((t) => /period|obdobi/.test(norm(t.querySelector('tr.zahlavi, thead tr')?.textContent || '')));
    if (!table) return null;
    const t = kit.readTable(table);
    const col = (re) => t.head.findIndex((x) => re.test(norm(x)));
    const name = col(/^(name of period|nazev obdobi|obdobi)$/); const from = col(/^(beginning|zacatek)/); const to = col(/^(end|konec)/);
    const pub = col(/^(public|verejne)/);
    if (name < 0) return null;
    const rows = t.rows.map((r) => ({ text: r.cells[name]?.text, from: r.cells[from]?.text, to: r.cells[to]?.text,
      pub: pub >= 0 ? r.cells[pub]?.text : '', link: r.cells.flatMap((c) => c.links).find((l) => /reg_stat_tridy\.pl/.test(l.href)) }))
      .filter((r) => r.text && r.link);
    return rows.length ? { kind: 'periods', rows } : null;
  }

  function readResults(page) {
    const tabs = kit.insisTabs(page)[0] || [];
    const filter = [...page.querySelectorAll('form')].find((f) => f.querySelector('select, input:not([type="hidden"])'));
    const table = kit.findTables(page).find((t) => !t.closest('form') && !t.classList.contains('portal_menu'));
    if (!tabs.length && !filter && !table) return null;
    let columns = [];
    let rows = [];
    if (table) {
      const t = kit.readTable(table);
      const single = t.rows.length === 1 && t.rows[0].cells.length === 1;
      if (!single) {
        columns = t.head.map((label, i) => ({ key: `c${i}`, label, main: i === 1 || (t.head.length === 1),
          align: t.rows.every((r) => /^[\d\s/.,%-]*$/.test(r.cells[i]?.text || '')) ? 'end' : null }));
        rows = t.rows.map((r) => Object.fromEntries(r.cells.map((c, i) => [`c${i}`, c.links.length === 1 && c.links[0].text === c.text ? c.links[0] : c.text])));
      }
    }
    const letters = [...page.querySelectorAll('ul.paginator a[href]')].filter((a) => !a.closest('form')).map((a) => {
      const l = kit.linkOf(a);
      return l && { ...l, text: clean(a.textContent), on: a.getAttribute('data-selected') === 'true' };
    }).filter(Boolean);
    return { kind: 'results', tabs, filter, columns, rows, letters };
  }

  // ---------- drawing ----------

  const pathLine = (path) => path.length > 0 && h('p', { class: 'rs-path' }, path.map((c, i) => [
    i ? h('span', { class: 'rs-sep', 'aria-hidden': 'true' }, '›') : null,
    c.href && i < path.length - 1 ? anchor(c, {}, c.text) : h('strong', {}, c.text)]));

  function buildUnits(d) {
    const mine = facultyOf(ipx.state.studyRecord?.period || '') || facultyOf(ipx.state.studyRecord?.study || '');
    const facs = d.units.filter((u) => u.fac).sort((a, b) => (b.fac === mine) - (a.fac === mine));
    const rest = d.units.filter((u) => !u.fac);
    return [
      h('p', { class: 'muted rs-lead' }, T.pickUnit),
      facs.length > 0 && [sectionHead(T.faculties), h('div', { class: 'rs-units' }, facs.map((u) =>
        h('a', { class: 'card link-card rs-unit' + (u.fac === mine ? ' mine' : ''), href: u.href },
          cover(u.fac, u.fac, 240, 56),
          h('span', { class: 'rs-unit-body' },
            h('span', { class: 'rs-unit-code', style: `color: ${facultyColors(u.fac)[1]}` }, u.fac, u.fac === mine && h('span', { class: 'delta neutral' }, T.yours)),
            h('strong', {}, u.text)))))],
      rest.length > 0 && [sectionHead(T.units), h('ul', { class: 'card rs-list' }, rest.map((u) =>
        h('li', {}, anchor(u, { class: 'rs-row' }, h('span', { class: 'rs-row-main' }, h('strong', {}, u.text)), icon('arrow')))))],
    ];
  }

  function buildPeriods(d, path) {
    const now = new Date();
    const isNow = (r) => { const a = kit.dateOf(r.from); const b = kit.dateOf(r.to); return !!(a && b && a <= now && now < b); };
    const isPublic = (r) => !r.pub || /^(yes|ano)$/i.test(r.pub);
    return [
      pathLine(path),
      h('p', { class: 'muted rs-lead' }, T.pickPeriod),
      h('ul', { class: 'card rs-list' }, d.rows.map((r) => h('li', {}, anchor(r.link, { class: 'rs-row' },
        h('span', { class: 'rs-row-main' }, h('strong', {}, r.text), isNow(r) && h('span', { class: 'delta ok' }, T.nowPeriod),
          !isPublic(r) && h('span', { class: 'delta neutral' }, T.notPublic)),
        h('span', { class: 'rs-row-meta' }, [r.from, r.to].filter(Boolean).join(' – ')),
        icon('arrow'))))),
    ];
  }

  function buildResults(d, path, formCard) {
    return [
      pathLine(path),
      h('p', { class: 'muted rs-lead' }, T.lead),
      d.filter && h('details', { class: 'rs-filter' }, h('summary', { class: 'btn ghost' }, icon('search'), h('span', {}, T.filter)),
        formCard({ lead: T.filterLead })),
      d.letters.length > 1 && h('nav', { class: 'rs-letters', 'aria-label': T.letters },
        d.letters.map((l) => anchor(l, { class: l.on ? 'on' : null, 'aria-current': l.on ? 'page' : null }, l.text))),
      d.rows.length
        ? [h('p', { class: 'muted small' }, T.rows(d.rows.length)), kit.dataTable({ columns: d.columns, rows: d.rows, label: T.title })]
        : emptyState(T.empty),
    ];
  }

  ipx.ready.then(() => {
    const r = nav.route(document.baseURI.split('#')[0]);
    if (!PATHS.includes(r.path)) return;
    const page = document.getElementById('str1');
    if (!page) return;
    const d = readUnits(page) || readPeriods(page) || readResults(page);
    if (!d) return; // generic.js keeps InSIS's page
    const path = pathOf(page);
    if (d.kind === 'results' && d.filter) {
      // The slotted filter form's own rules (stacked fields on phones) live in the page.
      document.documentElement.classList.add('ipx-rs');
      ipx.ui.styleSlotted('pages/reg-stats.css');
    }
    kit.page({
      key: 'reg-stats',
      css: 'pages/reg-stats.css',
      title: T.title,
      subtitle: nav.sectionLabel('courses.registration'),
      // InSIS's own tab row of the result step: one row of view tabs (views of the same unit and period).
      tabs: d.kind === 'results' && d.tabs.length > 1 ? d.tabs : null,
      form: d.kind === 'results' ? d.filter : null,
      build: ({ formCard }) => (d.kind === 'units' ? buildUnits(d) : d.kind === 'periods' ? buildPeriods(d, path) : buildResults(d, path, formCard)),
    });
  });
})();
