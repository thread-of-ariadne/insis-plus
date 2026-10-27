// InSIS+ — Grades & credits › Study plans (katalog/plany.pl, every step of the drill-down). Treatment R
// (docs/ia/03-pages.md; teardowns/exams-grades-schedule.md §2.6).
// InSIS's pages: a public drill-down without tabs, context only in truncated breadcrumbs, help paragraphs, icon-only
// "View" links. Every step keeps the same header (eyebrow Grades & credits, title Study plans) and shows InSIS+'s
// own context line (faculty · study system · period, from InSIS's "Faculty: …" key–value table) instead:
// - faculties (no parameters, div.vyber-fakult a.fakulta): faculty cards (the student's own first) and the other
//   units as a list, with a link card to What's left (the student's own plan lives there);
// - a faculty (fakulta): "Matrix of study plans" as a link card, then the study systems with their initial periods
//   as a list (InSIS's table repeats the system only on its first row); InSIS's "Display past periods" form is
//   slotted as a small form card with one lead line (its own help line inside the form is hidden by a data
//   attribute + CSS, never moved);
// - the matrix (fakulta,matice): plans × course groups as a table component with a sticky header row and first
//   column, scrolling sideways; each mark is InSIS's own link to that group of the plan. InSIS's matrix form is
//   slotted under a collapsed "Filter" (never filled or submitted by InSIS+);
// - any other step (study types, programmes, plans, a group's courses: no snapshot of most of them): InSIS's data
//   tables read with kit.readTable and drawn with kit.dataTable, icon-only links given a word. A step that holds a
//   form with controls slots that form, collapsed, the same way.
// Every link is InSIS's own, through the URL rule (kit.linkOf / nav.safe copied).
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.kit) return;
  const { lang, clean, norm } = ipx;
  const { h, icon, anchor, cover, facultyColors, facultyOf, sectionHead, emptyState, keepOnly } = ipx.ui;
  const kit = ipx.kit;
  const nav = ipx.nav;
  const PATH = '/auth/katalog/plany.pl';

  const T = {
    cs: { lead: 'Studijní plány všech programů: vyberte fakultu, pak období, typ studia a program.',
      faculties: 'Fakulty', units: 'Další součásti', yours: 'vaše fakulta',
      mine: 'Váš vlastní plán', mineText: 'Kolik kreditů a které předměty vám ještě chybí, najdete v přehledu Co mi chybí.',
      matrix: 'Matice studijních plánů', matrixText: 'Které skupiny předmětů patří do kterého plánu fakulty',
      systems: 'Typy studia a počáteční období', newest: 'nejnovější', open: 'Zobrazit',
      past: 'Starší období', pastLead: 'Zobrazit i starší plány: InSIS po stisku svého tlačítka tento seznam načte znovu.',
      filter: 'Filtr matice', filterLead: 'Změnit, co matice ukazuje: InSIS ji po stisku tlačítka Zobrazit matici překreslí.',
      plan: 'Plán / skupina', inPlan: 'skupina je v plánu', plans: (n) => `${n} ${kit.plural(n, 'plán', 'plány', 'plánů')}`,
      groups: (n) => `${n} ${kit.plural(n, 'skupina', 'skupiny', 'skupin')} předmětů`,
      search: 'Hledat v seznamu', noMatch: 'Hledání nic nenašlo.', empty: 'InSIS tu nic neukazuje.', form: 'Volby InSIS',
      formLead: 'Volby této stránky InSIS: stránka se po stisku tlačítka InSIS načte znovu.' },
    en: { lead: 'Study plans of every programme: choose a faculty, then the period, the type of study and the programme.',
      faculties: 'Faculties', units: 'Other units', yours: 'your faculty',
      mine: 'Your own plan', mineText: "How many credits and which courses you still need is in What's left.",
      matrix: 'Matrix of study plans', matrixText: "Which groups of courses belong to which of the faculty's plans",
      systems: 'Study systems and initial periods', newest: 'newest', open: 'Open',
      past: 'Older periods', pastLead: "Show older plans too: InSIS reloads this list when you press its button.",
      filter: 'Filter the matrix', filterLead: "Change what the matrix shows: InSIS redraws it when you press Display matrix.",
      plan: 'Plan / group', inPlan: 'group included in the plan', plans: (n) => `${n} ${n === 1 ? 'plan' : 'plans'}`,
      groups: (n) => `${n} course ${n === 1 ? 'group' : 'groups'}`,
      search: 'Search the list', noMatch: 'Nothing matches the search.', empty: 'InSIS shows nothing here.', form: "InSIS's options",
      formLead: "This InSIS page's options: the page reloads when you press InSIS's button." },
  }[lang];

  const LOGO_FAC = kit.FACULTY_BY_LOGO;
  const CODE_FAC = kit.FACULTY_BY_CODE;
  const header = () => ({ key: 'study-plans', css: 'pages/study-plans.css', title: nav.sectionLabel('grades.plans'), subtitle: nav.label('grades') });

  // ---------- step 1: the faculties ----------

  function parseUnits(page) {
    const links = [...page.querySelectorAll('.vyber-fakult a.fakulta[href]')];
    const units = links.map((a) => {
      const href = nav.safe(a.href, 'link', { copied: true });
      if (!href) return null;
      const logo = a.querySelector('img')?.getAttribute('src') || '';
      const fac = LOGO_FAC[/\/(ffu|fmv|fph|fis|fnh|fmh)-/.exec(logo)?.[1]] || CODE_FAC[/fakulta=(\d+)/.exec(a.href)?.[1]] || '';
      return { href, fac, text: clean(a.querySelector('.nazev')?.textContent) || clean(a.textContent) };
    }).filter((u) => u && u.text);
    return units.length ? units : null;
  }

  function buildUnits(units) {
    // The student's own faculty, from the e-study record ("WS 2026/2027 - FIS"), when it was read.
    const mine = facultyOf(ipx.state.studyRecord?.period || '') || facultyOf(ipx.state.studyRecord?.study || '');
    const facs = units.filter((u) => u.fac).sort((a, b) => (b.fac === mine) - (a.fac === mine));
    const rest = units.filter((u) => !u.fac);
    const left = nav.target('grades.plan');
    const card = (u) => anchor(u, { class: 'card link-card spl-unit' + (u.fac === mine ? ' mine' : '') },
      cover(u.fac, u.fac, 240, 64),
      h('span', { class: 'spl-unit-body' },
        h('span', { class: 'spl-unit-code', style: `color: ${facultyColors(u.fac)[1]}` }, u.fac,
          u.fac === mine && h('span', { class: 'delta neutral' }, T.yours)),
        h('strong', {}, u.text)));
    return [
      h('p', { class: 'muted spl-lead' }, T.lead),
      left && linkCard({ href: left }, 'layers', T.mine, T.mineText),
      facs.length > 0 && [sectionHead(T.faculties), h('div', { class: 'spl-units' }, facs.map(card))],
      rest.length > 0 && [sectionHead(T.units), h('ul', { class: 'card spl-list' }, rest.map((u) =>
        h('li', {}, anchor(u, { class: 'spl-link' }, h('span', {}, u.text), icon('arrow')))))],
    ];
  }

  const linkCard = (link, ico, title, text) => anchor(link, { class: 'card glist-item spl-mine' },
    h('span', { class: 'spl-mine-ico' }, icon(ico)),
    h('span', { class: 'glist-text' }, h('strong', {}, title), text && h('small', {}, text)),
    h('span', { class: 'glist-go' }, icon('arrow')));

  // ---------- the context line (every later step) ----------

  // InSIS's "Faculty: … / Type of study system: … / Initial period: …" table and the breadcrumbs' links up the
  // drill-down (only to plany.pl steps). Returns { node, kvTables }.
  function context(page) {
    const kvTables = [...page.querySelectorAll('table')].filter((t) => !t.querySelector('tr.zahlavi, th') && !t.closest('form') &&
      [...t.rows].length && [...t.rows].every((tr) => tr.cells.length === 2 && /:$/.test(clean(tr.cells[0].textContent))));
    const pairs = kvTables.flatMap((t) => kit.keyValues(t));
    const crumbs = [...page.querySelectorAll('.breadcrumb-item a[href]')].map((a) => ({ a, link: kit.linkOf(a) }))
      .filter((c) => c.link && nav.route(c.link.href).path === PATH && nav.route(c.link.href).params?.size);
    const facLink = crumbs.find((c) => nav.route(c.link.href).params.has('fakulta') && nav.route(c.link.href).params.size === 1)?.link;
    const parts = pairs.map((p, i) => (i === 0 && facLink ? anchor(facLink, {}, p.value) : h('span', {}, p.value)));
    // No key–value table (the matrix): the faculty from the breadcrumbs.
    if (!parts.length && facLink) parts.push(anchor(facLink, {}, facLink.text));
    const node = parts.length ? h('p', { class: 'spl-context' }, parts.flatMap((p, i) => (i ? [h('span', { class: 'spl-sep', 'aria-hidden': 'true' }, '·'), p] : [p]))) : null;
    return { node, kvTables };
  }

  // A small card with InSIS's own form (slotted, never filled or submitted). `open`: shown unfolded.
  function formSlot(page, form, title, lead, open) {
    keepOnly(page, form);
    form.setAttribute('data-ipx-spl-form', '');
    // InSIS's help lines inside the form are said by the lead line above it: hidden in place, never moved.
    form.querySelectorAll('div.small').forEach((d) => d.setAttribute('data-ipx-spl-hide', ''));
    return h('details', { class: 'card spl-form', open: open ? '' : null },
      h('summary', {}, icon('gear'), h('span', {}, title)),
      h('p', { class: 'muted form-lead' }, lead),
      h('slot'));
  }

  // ---------- step 2: a faculty ----------

  function buildFaculty(page, table) {
    const t = kit.readTable(table);
    const groups = [];
    for (const r of t.rows) {
      const [sys, period] = r.cells;
      const link = r.cells.flatMap((c) => c.links)[0];
      if (!period || !link) continue;
      if (sys.text || !groups.length) groups.push({ name: sys.text, items: [] });
      groups.at(-1).items.push({ text: period.text, href: link.href, bold: !!period.el.querySelector('b') });
    }
    const matrixA = [...page.querySelectorAll('a[href*="matice="]')].find((a) => !a.closest('form'));
    const matrix = matrixA && kit.linkOf(matrixA);
    const form = [...page.querySelectorAll('form')].find((f) => f.querySelector('input[type="submit"][name="vsechna_obdobi"]'));
    return {
      form,
      build: () => [
        matrix && linkCard(matrix, 'layers', T.matrix, T.matrixText),
        sectionHead(T.systems),
        groups.length ? h('div', { class: 'spl-groups' }, groups.map((g) => h('section', { class: 'card spl-group' },
          g.name && h('h3', { class: 'spl-group-title' }, g.name),
          h('ul', { class: 'spl-list flat' }, g.items.map((it, i) => h('li', {},
            anchor({ href: it.href }, { class: 'spl-link' }, h('span', {}, it.text,
              i === 0 && h('span', { class: 'delta neutral spl-chip' }, T.newest)), icon('arrow')))))))) : emptyState(T.empty),
        form && formSlot(page, form, T.past, T.pastLead, true),
      ],
    };
  }

  // ---------- the matrix ----------

  function buildMatrix(page, table) {
    const rows = [...table.rows].filter((tr) => tr.closest('table') === table);
    const isHead = (tr) => tr.cells[0] && /^(plan \/ group|plan \/ skupina|plán \/ skupina)/.test(norm(clean(tr.cells[0].textContent)));
    const headRow = rows.find(isHead) || rows[0];
    const groups = [...headRow.cells].slice(1).map((c) => clean(c.textContent));
    const plans = rows.filter((tr) => tr !== headRow && !isHead(tr) && tr.cells.length > 1).map((tr) => ({
      name: clean(tr.cells[0].textContent),
      marks: [...tr.cells].slice(1).map((c) => { const a = c.querySelector('a[href]'); return a ? kit.linkOf(a) : null; }),
    })).filter((p) => p.name);
    const form = [...page.querySelectorAll('form')].find((f) => f.querySelector('[name="matice_typ_ss"], [name="matice_poc_obdobi"]'));
    const search = h('input', { type: 'search', class: 'spl-search', placeholder: T.search, 'aria-label': T.search });
    const body = h('tbody', {}, plans.map((p) => h('tr', { 'data-name': norm(p.name) },
      h('th', { scope: 'row' }, p.name),
      p.marks.map((m, i) => h('td', {}, m ? h('a', { href: m.href, class: 'spl-dot', title: `${groups[i]}: ${T.inPlan}`, 'aria-label': `${groups[i]}: ${T.inPlan}` }) : null)))));
    const none = h('p', { class: 'muted spl-nomatch', hidden: '' }, T.noMatch);
    search.addEventListener('input', () => {
      const q = norm(search.value.trim());
      let shown = 0;
      for (const tr of body.rows) { const on = !q || tr.dataset.name.includes(q); tr.hidden = !on; shown += on; }
      none.hidden = shown > 0;
    });
    return {
      form,
      build: () => [
        form && formSlot(page, form, T.filter, T.filterLead, false),
        h('div', { class: 'spl-matrix-head' }, h('p', { class: 'muted' }, `${T.plans(plans.length)} · ${T.groups(groups.length)}`), search),
        plans.length ? h('div', { class: 'card spl-matrix-wrap' },
          h('table', { class: 'spl-matrix' },
            h('thead', {}, h('tr', {}, h('th', { scope: 'col', class: 'corner' }, T.plan), groups.map((g) => h('th', { scope: 'col' }, h('span', {}, g))))),
            body)) : emptyState(T.empty),
        none,
      ],
    };
  }

  // ---------- any other step ----------

  function buildGeneric(page, kvTables) {
    const tables = kit.findTables(page).filter((t) => !kvTables.includes(t) && !t.closest('.uisLegend'));
    const form = [...page.querySelectorAll('form')].find((f) => f.querySelector('select, input[type="text"], input[type="checkbox"], input[type="radio"]'));
    const blocks = tables.map((table) => {
      const t = kit.readTable(table);
      const keep = t.head.map((_, i) => t.rows.some((r) => r.cells[i] && (r.cells[i].text || r.cells[i].links.length)));
      const cols = t.head.map((label, i) => ({ key: `c${i}`, label: label || '' })).filter((_, i) => keep[i]);
      // The row's title: the first column with a link text, else the first with text.
      const mainIdx = t.head.findIndex((_, i) => keep[i] && t.rows.some((r) => r.cells[i]?.links.some((l) => l.text)));
      cols.forEach((c) => { c.main = c.key === `c${mainIdx >= 0 ? mainIdx : t.head.findIndex((_, i) => keep[i])}`; });
      const rows = t.rows.map((r) => Object.fromEntries(r.cells.map((c, i) => {
        if (!keep[i]) return [`c${i}`, null];
        const link = c.links[0];
        if (link) return [`c${i}`, { href: link.href, text: c.text || link.text || T.open }];
        // Numbers in a "Choose/View" cell of an icon only, or a plain value.
        return [`c${i}`, c.text || null];
      })));
      const title = clean(ipx.kit.prev(table)?.tagName === 'B' ? ipx.kit.prev(table).textContent : '');
      return [title && sectionHead(title), kit.dataTable({ columns: cols, rows, empty: T.empty })];
    });
    return {
      form,
      build: () => [
        form && formSlot(page, form, T.form, T.formLead, false),
        blocks.length ? blocks : emptyState(clean(kit.looseText(page)).slice(0, 300) || T.empty),
      ],
    };
  }

  ipx.ready.then(() => {
    const route = nav.route(document.baseURI.split('#')[0]);
    if (route.path !== PATH) return;
    const page = document.getElementById('str1');
    if (!page) return;

    if (!route.params?.size) {
      const units = parseUnits(page);
      if (!units) return;
      kit.page({ ...header(), build: () => buildUnits(units) });
      return;
    }

    const ctx = context(page);
    const matrixTable = route.params.has('matice') && page.querySelector('table.detailni_ramecek');
    const facultyTable = !matrixTable && route.params.size === 1 && route.params.has('fakulta') &&
      kit.findTables(page).find((t) => kit.readTable(t).head.length >= 3 && t.querySelector('a[href*="poc_obdobi="]'));
    const step = matrixTable ? buildMatrix(page, matrixTable) : facultyTable ? buildFaculty(page, facultyTable) : buildGeneric(page, ctx.kvTables);
    if (step.form) ipx.ui.styleSlotted('pages/study-plans.css');
    kit.page({ ...header(), form: step.form, build: () => [ctx.node, step.build()] });
  });
})();
