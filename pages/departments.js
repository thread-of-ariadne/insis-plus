// InSIS+ — Campus & people › Departments and Who to ask: every page of pracoviste/* and sif/* (docs/ia/03-pages.md,
// teardowns/campus-messages-account.md §2.3–2.4). Uses pages/rebuild.js.
//
// Departments (section "departments"): pracoviste.pl is the university's units with InSIS's two tabs as views
// (By faculty · Full tree); each faculty is a card (contacts, the dean, the unit's pages as labelled chips instead of
// InSIS's icon row). Bodies (sif/organy_prehled.pl) and the concise phone directory (kompaktni_telsez.pl) are pages
// of the section.
// A unit (section "unit": a faculty or a department, one thing) has one header on all its pages, titled by InSIS's
// own abbreviation from the breadcrumb (FFU › KBP), with view tabs built from the unit's id through the URL rule:
// Overview (pracoviste.pl?id;nerozbaluj) · Departments (pracoviste.pl?id) · Staff (zamestnanci.pl) · Courses
// (predmety.pl) · Thesis topics (prehled_temat.pl) · Publications (publikace.pl). Projects, bodies and the phone list
// are pages below it (InSIS's links on the overview; "Phone list" is a page action).
//   R: overview, sub-units, staff, courses, projects, publications, bodies, a topic's detail — read and drawn again
//      (InSIS's own links, URL rule; long lists with a filter and "show all").
//   L in place: thesis topics — the list sits inside InSIS's filter form with its letter pager, so it stays InSIS's
//      own and is styled as topic rows (data- attributes + CSS) the way Study matters › Thesis topics shows them;
//      a summary of free places, a Filter toggle and a text search are drawn above it.
//   F: the phone list forms (telsez.pl, kompaktni_telsez.pl), InSIS's Restrict / Choose / Export forms — InSIS's own
//      form, slotted in a form card with one line saying what InSIS does with it.
// Who to ask (pracoviste/stud_odd.pl, section "office"): the offices as cards (the student's faculty first); an
// office: whether it is open now (from InSIS's office hours), its contacts, who handles what (contact persons with
// their field of activity first), office hours as a week with today marked, the vice-deans.
// Nothing is stored or fetched; InSIS's help lines, keys, icon rows and anchors are not shown.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.rb || !ipx.kit || !ipx.nav) return;
  const { lang, clean, norm } = ipx;
  const { h, icon, anchor, hideInSlot, styleSlotted, locale } = ipx.ui;
  const kit = ipx.kit;
  const nav = ipx.nav;
  const rb = ipx.rb;

  const T = {
    cs: { faculties: 'Podle fakult', tree: 'Celý strom', phones: 'Telefonní seznam', phoneList: 'Telefonní seznam', overview: 'Přehled',
      units: 'Pracoviště', staff: 'Zaměstnanci', courses: 'Předměty', topics: 'Témata prací', publications: 'Publikace', projects: 'Projekty',
      bodies: 'Orgány', yourFaculty: 'Vaše fakulta', unitsOf: (n) => `${n} ${kit.plural(n, 'pracoviště', 'pracoviště', 'pracovišť')}`,
      findUnit: 'Hledat pracoviště…', findPerson: 'Hledat jméno, pracoviště, kancelář…', findCourse: 'Hledat předmět nebo garanta…', findTopic: 'Hledat téma, vedoucího, program…',
      restrictLead: 'Filtr InSIS: omezí seznam podle pracovního zařazení, až stisknete Omezit.',
      filterLead: 'Filtr InSIS: omezí seznam, až stisknete tlačítko filtru.',
      exportLead: 'InSIS připraví seznam ke stažení pro Excel, až stisknete Export.',
      telLead: 'Vyberte, co má seznam obsahovat; InSIS ho zobrazí, až stisknete Zvolit.',
      compactLead: 'Vyberte pracoviště nebo vytiskněte seznam celé školy; InSIS připraví seznam k tisku, až stisknete tlačítko.',
      topicsCount: (n, free) => `${n} ${kit.plural(n, 'téma', 'témata', 'témat')}, ${free} s volným místem`, showing: (n) => `zobrazeno ${n}`,
      topicsLead: 'detail tématu otevřete kliknutím na řádek.', full: 'Obsazeno', placesTaken: (a, b) => `obsazeno ${a} z ${b}`, placesOpen: (a) => `${a} přihlášeno · bez limitu`,
      filter: 'Filtr', noTopic: 'Hledání neodpovídá žádné téma.', topic: 'Téma', members: 'Členové', programmes: 'Orgány programů', fields: 'Orgány oborů', deptBodies: 'Orgány pracoviště',
      office: 'Na koho se obrátit', offices: 'Kontaktní místa', another: 'Jiné pracoviště', ask: 'Zeptat se',
      openNow: (u) => `Otevřeno, dnes do ${u}`, closedNext: (d, f, u) => `Teď zavřeno · otevírá ${d} ${f}–${u}`, closedToday: 'Dnes už zavřeno',
      hours: 'Úřední hodiny', whoWhat: 'Kdo co vyřizuje', vicedeans: 'Proděkani', today: 'dnes', write: 'Napsat v InSIS', basic: 'Kontakt',
      officeLead: 'Žádosti a dotazy podáváte přes Kontaktní centrum; tady najdete, kdo je vyřizuje a kdy má oddělení otevřeno.',
      chooseOffice: 'Vyberte fakultu nebo pracoviště, jehož kontakty chcete vidět.', facts: 'Základní údaje', facultyCard: 'Fakulta' },
    en: { faculties: 'By faculty', tree: 'Full tree', phones: 'Phone directory', phoneList: 'Phone list', overview: 'Overview',
      units: 'Departments', staff: 'Staff', courses: 'Courses', topics: 'Thesis topics', publications: 'Publications', projects: 'Projects',
      bodies: 'Bodies', yourFaculty: 'Your faculty', unitsOf: (n) => `${n} ${n === 1 ? 'department' : 'departments'}`,
      findUnit: 'Find a department…', findPerson: 'Find a name, department, office…', findCourse: 'Find a course or supervisor…', findTopic: 'Find a topic, supervisor, programme…',
      restrictLead: 'InSIS’s filter: it limits the list by position when you press Restrict.',
      filterLead: 'InSIS’s filter: it limits the list when you press its button.',
      exportLead: 'InSIS prepares the list as an Excel download when you press Export.',
      telLead: 'Choose what the list shows; InSIS displays it when you press Choose.',
      compactLead: 'Choose departments or print the whole university’s list; InSIS prepares the list to print when you press a button.',
      topicsCount: (n, free) => `${n} ${n === 1 ? 'topic' : 'topics'}, ${free} with free places`, showing: (n) => `showing ${n}`,
      topicsLead: 'click a row for the topic’s details.', full: 'Full', placesTaken: (a, b) => `${a} of ${b} places taken`, placesOpen: (a) => `${a} registered · no limit`,
      filter: 'Filter', noTopic: 'No topic matches the search.', topic: 'Topic', members: 'Members', programmes: 'Programme bodies', fields: 'Field bodies', deptBodies: 'Department bodies',
      office: 'Who to ask', offices: 'Contact points', another: 'Another office', ask: 'Ask a question',
      openNow: (u) => `Open now, until ${u}`, closedNext: (d, f, u) => `Closed now · opens ${d} ${f}–${u}`, closedToday: 'Closed for today',
      hours: 'Office hours', whoWhat: 'Who handles what', vicedeans: 'Vice-deans', today: 'today', write: 'Write in InSIS', basic: 'Contact',
      officeLead: 'Requests and questions go through the Contact centre; here is who handles them and when the office is open.',
      chooseOffice: 'Choose the faculty or office whose contacts you want to see.', facts: 'Basic facts', facultyCard: 'Faculty' },
  }[lang];

  const ORIGIN = () => new URL(document.baseURI).origin;
  const plain = (path, params = '') => nav.safe(`${ORIGIN()}${path}${params ? `?${params}` : ''}`, 'link');
  const route = () => nav.route(document.baseURI.split('#')[0]);
  const P = '/auth/pracoviste/';

  // ---------- sections ----------

  const departments = kit.section({
    id: 'departments',
    title: () => nav.sectionLabel('campus.departments'),
    subtitle: () => nav.label('campus'),
    pages: {
      [`${P}pracoviste.pl`]: (r) => (r.params?.has('strom') ? 'tree' : r.params?.has('id') ? undefined : 'faculties'),
      [`${P}kompaktni_telsez.pl`]: null,
      '/auth/sif/organy_prehled.pl': null,
    },
    views: () => [
      { id: 'faculties', text: T.faculties, href: plain(`${P}pracoviste.pl`) },
      { id: 'tree', text: T.tree, href: plain(`${P}pracoviste.pl`, 'strom=1') },
    ],
    actions: () => [actionLink(plain(`${P}kompaktni_telsez.pl`), T.phones, 'phone')],
    node: () => 'campus.departments',
  });

  // The unit a page is about: InSIS's id parameter (prehled_temat.pl names it "pracoviste").
  const unitId = (r = route()) => {
    const v = r.params?.get('id') || r.params?.get('pracoviste') || '';
    return /^\d+$/.test(v) ? v : null;
  };
  const unitViews = (id) => (id ? [
    { id: 'overview', text: T.overview, href: plain(`${P}pracoviste.pl`, `id=${id};nerozbaluj=1`) },
    { id: 'units', text: T.units, href: plain(`${P}pracoviste.pl`, `id=${id}`) },
    { id: 'staff', text: T.staff, href: plain(`${P}zamestnanci.pl`, `id=${id}`) },
    { id: 'courses', text: T.courses, href: plain(`${P}predmety.pl`, `id=${id}`) },
    { id: 'topics', text: T.topics, href: plain(`${P}prehled_temat.pl`, `pracoviste=${id}`) },
    { id: 'publications', text: T.publications, href: plain(`${P}publikace.pl`, `id=${id}`) },
  ] : []);
  // InSIS's breadcrumb names the unit by its abbreviation (Departments › FFU › KBP): the header's title, the same on
  // every view. The page's own name (List of employees) is the last crumb unless the unit itself is last.
  function unitPath() {
    const c = rb.crumbs(document.getElementById('str1'));
    const i = c.findIndex((x) => /^(departments|pracoviště|pracoviste)$/i.test(x));
    // InSIS's names of its pages ("List of employees", "Summary of topics offered", "Details on the topic") are not
    // the unit: left out.
    let rest = (i >= 0 ? c.slice(i + 1) : []).filter((x) => !/(list of|summary of|details?\b|directory|seznam|přehled|prehled|podrobnost|telefonní|telefonni)/i.test(x));
    // sif/organy.pl: "List of department bodies - <unit>"
    if (!rest.length) { const m = /\s[-–]\s(.+)$/.exec(c.at(-1) || ''); if (m) rest = [m[1]]; }
    return rest;
  }
  const unit = kit.section({
    id: 'unit',
    title: () => unitPath().at(-1) || nav.sectionLabel('campus.departments'),
    subtitle: () => [nav.sectionLabel('campus.departments'), ...unitPath().slice(0, -1)].join(' › '),
    pages: {
      [`${P}pracoviste.pl`]: (r) => (r.params?.has('id') && !r.params.has('strom') ? (r.params.has('nerozbaluj') ? 'overview' : 'units') : undefined),
      [`${P}zamestnanci.pl`]: 'staff',
      [`${P}predmety.pl`]: 'courses',
      [`${P}prehled_temat.pl`]: (r) => (r.params?.has('detail') ? null : 'topics'),
      [`${P}publikace.pl`]: (r) => (r.params?.has('podrobnosti') ? null : 'publications'),
      [`${P}projekty.pl`]: null,
      [`${P}telsez.pl`]: null,
      '/auth/sif/organy.pl': null,
    },
    views: () => unitViews(unitId()),
    actions: () => { const id = unitId(); return id ? [actionLink(plain(`${P}telsez.pl`, `id=${id}`), T.phoneList, 'phone')] : []; },
    node: () => 'campus.departments',
  });

  const office = kit.section({
    id: 'office',
    title: () => nav.sectionLabel('campus.office'),
    subtitle: () => nav.label('campus'),
    pages: { [`${P}stud_odd.pl`]: null },
    views: () => [],
    actions: () => [actionLink(nav.target('studies.requests'), T.ask, 'pencil', true)].filter(Boolean),
    node: () => 'campus.office',
  });

  function actionLink(href, text, ico, primary) {
    // rb.glyph: icons the top bar does not use (its envelope is the mail box), e.g. a pencil for "Ask a question".
    return href ? anchor({ href }, { class: primary ? 'btn' : 'btn ghost', title: text }, rb.glyph(ico), h('span', {}, text)) : null;
  }

  // The header of a section: title, eyebrow, actions, and its view tabs with `view` marked.
  const head = (s, view) => ({ title: s.title(), subtitle: s.subtitle(), actions: s.actions(view), tabs: kit.sectionTabs(s, view) });

  // ---------- small readers ----------

  // "Label: value" inside one cell (InSIS writes unit contacts like that), with the cell's links.
  function inlineFacts(root) {
    const out = [];
    for (const td of root.querySelectorAll('td')) {
      if (td.querySelector('table')) continue;
      const text = kit.cellText(td);
      const m = /^([^:]{2,40}):\s*(.*)$/.exec(text);
      if (!m) continue;
      const value = m[2].trim();
      if (!value || /not known|neuveden|nezn[aá]m/i.test(value)) continue;
      out.push({ label: m[1], value, links: [...td.querySelectorAll('a[href]')].map((a) => rb.link(a)).filter(Boolean) });
    }
    return out;
  }
  // Label/value rows of a two-column table, skipping blank spacer rows.
  const pairsOf = (t) => rb.factsOf(t).filter((p) => p.value || p.links.length);
  const factsCard = (pairs, heading) => (pairs.length ? h('section', { class: 'card pad rb-facts' }, heading && h('h2', { class: 'card-title' }, heading), kit.facts(pairs)) : null);

  // The row of icon links (rada-ikon) → labelled links through the URL rule, named in the words of InSIS+'s own
  // sections where the page is one of them (InSIS says "Summary of topics offered", "Whom to contact").
  const LABELS = [[/zamestnanci\.pl/, 'staff'], [/predmety\.pl/, 'courses'], [/prehled_temat\.pl/, 'topics'], [/stud_odd\.pl/, 'office'],
    [/telsez\.pl/, 'phoneList'], [/sif\/organy/, 'bodies'], [/projekty\.pl/, 'projects'], [/publikace\.pl/, 'publications'], [/pracoviste\.pl/, 'units'],
    [/zakladni\.pl/, 'facts']];
  const named = (l) => { const k = LABELS.find(([re]) => re.test(new URL(l.href).pathname))?.[1]; return k ? { ...l, text: T[k] } : l; };
  const iconRow = (root) => [...(root?.querySelectorAll('.rada-ikon a[href]') || [])].map((a) => rb.link(a)).filter(Boolean).map(named);

  // A form card around the slot (InSIS's own forms show there) with one line on what InSIS does.
  const formCard = (lead, slot = h('slot')) => h('section', { class: 'card pad rb-form' }, lead && h('p', { class: 'muted form-lead' }, lead), slot);

  // ---------- Departments: by faculty ----------

  function facultiesPage(page) {
    const table = [...page.querySelectorAll('table')].find((t) => t.querySelector('.rada-ikon') && t.querySelector('img'));
    const mine = ipx.state.portal?.study?.faculty || '';
    const cards = [...(table?.rows || [])].filter((tr) => tr.closest('table') === table).map((tr) => {
      const name = clean(tr.querySelector('b font, b')?.textContent);
      if (!name) return null;
      const inner = tr.querySelector('table');
      const pairs = inner ? pairsOf(inner) : [];
      // The faculty's address line under its name.
      const address = clean([...tr.cells[1]?.childNodes || []].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(' '));
      const links = iconRow(tr);
      const code = Object.entries(kit.FACULTY_BY_CODE).find(([id]) => links.some((l) => new RegExp(`[?;]id=${id}(\\D|$)`).test(l.href)))?.[1] || '';
      return { name, address, pairs, links, code, el: tr };
    }).filter(Boolean);
    cards.sort((a, b) => (b.code && b.code === mine) - (a.code && a.code === mine));
    return {
      hide: [],
      build: () => [
        h('div', { class: 'dep-faculties' }, cards.map((c) => h('section', { class: 'card pad dep-faculty' + (c.code && c.code === mine ? ' is-mine' : '') },
          h('div', { class: 'dep-faculty-head' },
            h('span', { class: 'rb-badge', style: c.code ? `--fac: ${ipx.ui.facultyColors(c.code)[1]}` : null }, c.code || 'VŠE'),
            h('span', {}, h('strong', {}, c.name), c.code && c.code === mine && h('small', { class: 'dep-mine' }, T.yourFaculty), c.address && h('small', {}, c.address))),
          kit.facts(c.pairs.filter((p) => !/^web$/i.test(p.label))),
          rb.chips(c.links)))),
      ],
    };
  }

  // ---------- Departments: full tree ----------

  function treePage(page) {
    const tree = page.querySelector('div.tree');
    if (!tree) return null;
    const groups = [...tree.querySelectorAll(':scope > ul > li')].map((li) => {
      const top = li.querySelector(':scope > .node-container .node-label a[href]');
      const kids = [...li.querySelectorAll(':scope > .subtree > ul > li')].map((k) => k.querySelector(':scope > .node-container .node-label a[href]')).filter(Boolean);
      return { top: top && rb.link(top), name: clean(top?.textContent || li.querySelector('.node-label')?.textContent), kids: kids.map((a) => rb.link(a)).filter(Boolean) };
    }).filter((g) => g.name);
    const items = [];
    const sections = groups.map((g) => {
      const rows = g.kids.map((l) => { const el = anchor(l, { class: 'rb-row' }, h('span', {}, l.text), icon('arrow')); items.push({ el, text: norm(`${l.text} ${g.name}`) }); return el; });
      return h('section', { class: 'card dep-group' },
        h('div', { class: 'dep-group-head' }, g.top ? anchor(g.top, {}, g.name) : h('strong', {}, g.name), rows.length > 0 && h('small', {}, T.unitsOf(rows.length))),
        rows.length > 0 && h('div', { class: 'rb-list dep-rows' }, rows));
    });
    return {
      hide: [tree],
      build: () => [rb.longList(h('div', { class: 'dep-groups' }, sections), items, { cap: 10000, filterAt: 10, placeholder: T.findUnit })],
    };
  }

  // ---------- a unit: its sub-units (pracoviste.pl?id) ----------

  function unitsPage(page) {
    const tables = kit.findTables(page);
    if (!tables.length) return null;
    const cards = [];
    for (const t of tables) {
      const d = kit.readTable(t);
      for (const r of d.rows) {
        if (r.cells.length < 2) continue;
        const code = r.cells[0]?.text || '';
        const name = r.cells[1]?.text || '';
        const links = r.cells.slice(2).flatMap((c, i) => [...c.el.querySelectorAll('a[href]')].map((a) => {
          const l = kit.linkOf(a);
          return l && { ...l, text: d.head[i + 2] || rb.iconLabel(a) };
        })).filter(Boolean);
        const el = h('section', { class: 'rb-card' },
          h('div', { class: 'rb-card-top' }, h('span', { class: 'rb-badge' }, code || '·'), h('span', {}, h('strong', {}, name))),
          rb.chips(links));
        cards.push({ el, text: norm(`${code} ${name}`) });
      }
    }
    return {
      hide: tables,
      build: () => [cards.length ? rb.longList(h('div', { class: 'rb-grid' }, cards.map((c) => c.el)), cards, { cap: 10000, filterAt: 12, placeholder: T.findUnit })
        : h('div', { class: 'empty' }, h('p', {}, kit.looseText(page)))],
    };
  }

  // ---------- a unit: its own page (pracoviste.pl?id;nerozbaluj) ----------

  function overviewPage(page) {
    const outer = [...page.querySelectorAll('table')].find((t) => t.querySelector('.rada-ikon'));
    if (!outer) return null;
    const bold = [...outer.querySelectorAll('b')].map((b) => clean(b.textContent)).filter(Boolean);
    const code = bold.find((t) => /^\d{3,5}$/.test(t)) || '';
    const name = bold.find((t) => t !== code) || '';
    const inner = outer.querySelector('table table') || outer;
    const pairs = inlineFacts(inner).filter((p) => !/^web$/i.test(p.label) || p.links.length);
    // InSIS's icon row, less what the view tabs and the Phone list action already offer.
    const links = iconRow(outer).filter((l) => !/(zamestnanci|predmety|prehled_temat|publikace|telsez)\.pl/.test(l.href));
    return {
      hide: [...page.querySelectorAll('table')],
      build: () => [
        h('section', { class: 'card pad dep-unit' },
          h('div', { class: 'dep-faculty-head' }, h('span', { class: 'rb-badge' }, code || '·'), h('span', {}, h('strong', {}, name))),
          kit.facts([...(code ? [{ label: lang === 'cs' ? 'Kód' : 'Code', value: code }] : []), ...pairs])),
        links.length > 0 && rb.chips(links),
      ],
    };
  }

  // ---------- thesis topics: InSIS's list, styled in place ----------

  // The same presentation as Study matters › Thesis topics (pages/thesis.js, the same InSIS list for the student's own
  // study): the topic as the row's title; supervisor · department · programme · field under it; the type of work and
  // the places as chips in InSIS+'s words ("Master's", "0 of 1 places taken"); InSIS's Detail link stretched over the
  // row; a Filter toggle over InSIS's own filter (it stays in its form, collapsed) and a text search over the rows.
  const TOPIC_COLS = [['num', /^(ord|por)/], ['type', /^(type|typ)$/], ['topic', /^(topic|tema|nazev)/], ['supervisor', /^(thesis supervisor|vedouci)/],
    ['department', /^(supervising department|garantujici|pracoviste)/], ['programme', /^(programme|program)/], ['major', /^(field|obor|specializ)/],
    ['other', /^(intended|urceno)/], ['detail', /^detail/], ['capacity', /^(occupied|obsazeno)/], ['other', /^(project|ucastn)/]];
  const TYPES = { cs: { DT: 'Diplomová', DP: 'Diplomová', BT: 'Bakalářská', BP: 'Bakalářská', DIS: 'Disertační' },
    en: { DT: 'Master’s', DP: 'Master’s', BT: 'Bachelor’s', BP: 'Bachelor’s', DIS: 'Doctoral' } }[lang];
  const CONTROL = 'input:not([type="hidden"]), select, button, textarea';
  const hasAction = (el) => !!el.querySelector(CONTROL) || [...el.querySelectorAll('a[href]')].some((a) => !nav.safe(a.href, 'link', { copied: true }));

  function topicsPage(page) {
    const form = page.querySelector('form[name="temata2"], form[action*="prehled_temat.pl"]');
    const table = form?.querySelector('table#tmtab_1') || kit.findTables(form || page)[0];
    if (!table) return null;
    const heads = [...table.querySelectorAll('thead th, tr.zahlavi > th')].map((th) => norm(clean(th.textContent)));
    const roles = heads.map((t) => TOPIC_COLS.find(([, re]) => re.test(t))?.[0] || 'other');
    table.setAttribute('data-ipx-topics', '');
    let free = 0;
    const items = [];
    for (const tr of table.querySelectorAll('tbody > tr')) {
      const cells = [...tr.children];
      if (cells.length === 1) { tr.setAttribute('data-ipx-empty', ''); continue; }
      const offset = Math.max(0, cells.length - roles.length);
      cells.forEach((td, i) => {
        let role = i < offset ? 'num' : roles[i - offset];
        // A cell with a form control or an InSIS action link is never hidden (03-pages §2, moving rule).
        if (['num', 'other'].includes(role) && hasAction(td)) role = 'act';
        td.setAttribute('data-ipx-col', role);
        if (/^-*$/.test(clean(td.textContent)) && !td.querySelector('a')) td.setAttribute('data-ipx-blank', '');
      });
      const cell = (r) => tr.querySelector(`:scope > [data-ipx-col="${r}"]`);
      const type = clean(cell('type')?.textContent).toUpperCase();
      if (TYPES[type]) cell('type').setAttribute('data-ipx-label', TYPES[type]);
      // "0 / 1" (taken / max) or "0 / --" (no limit).
      const m = /(\d+)\s*\/\s*(\d+|-+)/.exec(clean(cell('capacity')?.textContent));
      let open = true;
      if (m) {
        const max = /\d/.test(m[2]) ? Number(m[2]) : null;
        open = max == null || Number(m[1]) < max;
        cell('capacity').setAttribute('data-ipx-label', max == null ? T.placesOpen(m[1]) : open ? T.placesTaken(m[1], max) : T.full);
        if (!open) tr.setAttribute('data-ipx-full', '');
      }
      if (open) free++;
      // The Detail icon link is the row's link (a chevron), not a labelled chip.
      tr.querySelector('[data-ipx-col="detail"]')?.setAttribute('data-ipx-nolabel', '');
      tr.querySelector('[data-ipx-col="detail"] a')?.setAttribute('data-ipx-stretch', '');
      items.push({ el: tr, text: norm(['topic', 'supervisor', 'department', 'programme', 'major'].map((r) => cell(r)?.textContent || '').join(' ')) });
    }
    form.setAttribute('data-ipx-topics-form', '');
    // InSIS's filter block (selects + Restrict) and its help line: collapsed until Filter is pressed (a data-
    // attribute on InSIS's elements; the controls stay in the form with InSIS's values). The letter pager stays.
    const filterBox = form.querySelector('table:has(select)');
    filterBox?.setAttribute('data-ipx-part', 'filter');
    const go = form.querySelector('input[type="submit"]');
    const help = [...form.querySelectorAll('div.small')].find((d) => !d.closest('table'));
    form.querySelector('ul.paginator')?.setAttribute('data-ipx-part', 'letters');
    document.documentElement.classList.add('ipx-topics');
    const targets = [filterBox, go, help].filter(Boolean);
    const setOpen = (on) => targets.forEach((t) => t.setAttribute('data-ipx-collapsed', on ? 'false' : 'true'));
    setOpen(false);
    const toggle = filterBox && h('button', { type: 'button', class: 'dep-toggle', 'aria-expanded': 'false' }, icon('list'), h('span', {}, T.filter));
    toggle?.addEventListener('click', () => { const on = toggle.getAttribute('aria-expanded') !== 'true'; toggle.setAttribute('aria-expanded', String(on)); setOpen(on); });
    // A text search over InSIS's rows: it only toggles a data- attribute (CSS hides the row); nothing is sent.
    const total = items.length;
    const status = h('b', {}, T.topicsCount(total, free));
    const none = h('p', { class: 'muted dep-none', hidden: '' }, T.noTopic);
    const input = h('input', { type: 'search', placeholder: T.findTopic, 'aria-label': T.findTopic, autocomplete: 'off' });
    input.addEventListener('input', () => {
      const words = norm(input.value).split(' ').filter(Boolean);
      let shown = 0;
      for (const it of items) {
        const ok = words.every((w) => it.text.includes(w));
        it.el.toggleAttribute('data-ipx-off', !ok);
        if (ok) shown++;
      }
      status.textContent = words.length ? `${T.topicsCount(total, free)} · ${T.showing(shown)}` : T.topicsCount(total, free);
      none.hidden = shown > 0;
    });
    return {
      hide: [],
      build: () => [
        h('div', { class: 'dep-bar' }, h('p', { class: 'muted dep-lead' }, status, ` · ${T.topicsLead}`), toggle),
        total > 0 && h('label', { class: 'dep-search' }, icon('search'), input),
        none,
        h('slot'),
      ],
    };
  }

  // ---------- bodies (sif/organy.pl, sif/organy_prehled.pl) ----------

  function bodiesPage(page) {
    const tables = kit.findTables(page);
    if (!tables.length) return null;
    const out = [];
    for (const t of tables) {
      // The kind of body is the bold word before the table ("Kind of body: advisory").
      let prev = ipx.kit.prev(t);
      while (prev && /^(BR|P)$/.test(prev.tagName) && !clean(prev.textContent)) prev = ipx.kit.prev(prev);
      const kind = prev?.tagName === 'B' ? clean(prev.textContent) : '';
      const d = kit.readTable(t);
      const rows = d.rows.filter((r) => r.cells.length >= 2).map((r) => {
        const links = r.cells.slice(1).flatMap((c, i) => [...c.el.querySelectorAll('a[href]')].map((a) => { const l = kit.linkOf(a); return l && { ...l, text: d.head[i + 1] || T.members }; })).filter(Boolean);
        const name = r.cells[0].text;
        return links.length === 1 && d.head.length === 2
          ? anchor(links[0], { class: 'rb-row' }, h('span', {}, name, h('small', {}, d.head[1])), icon('arrow'))
          : h('div', { class: 'rb-row dep-body' }, h('span', {}, name), rb.chips(links));
      });
      out.push(kind && rb.title(kind), h('section', { class: 'card rb-list' }, rows));
    }
    return { hide: [...tables, ...page.querySelectorAll('#str1 b'), ...[...page.querySelectorAll('div')].filter((d) => /^(kind of body|druh orgánu)/i.test(clean(d.firstChild?.textContent || '')))], build: () => out, loose: true };
  }

  // ---------- Who to ask (stud_odd.pl) ----------

  const DAYS = [/^(mon|po)/i, /^(tue|út|ut)/i, /^(wed|st)/i, /^(thu|čt|ct)/i, /^(fri|pá|pa)/i, /^(sat|so)/i, /^(sun|ne)/i];
  const dayIndex = (t) => DAYS.findIndex((re) => re.test(clean(t)));
  const minutes = (t) => { const m = /(\d{1,2})[:.](\d{2})/.exec(t || ''); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };

  function hoursStatus(rows, now = new Date()) {
    const today = (now.getDay() + 6) % 7;
    const mins = now.getHours() * 60 + now.getMinutes();
    const slots = rows.map((r) => ({ day: dayIndex(r.cells[0]?.text), from: r.cells[1]?.text, until: r.cells[2]?.text })).filter((s) => s.day >= 0 && minutes(s.from) != null);
    const open = slots.find((s) => s.day === today && minutes(s.from) <= mins && mins < minutes(s.until));
    if (open) return { tone: 'ok', text: T.openNow(open.until) };
    for (let k = 0; k < 7; k++) {
      const d = (today + k) % 7;
      const next = slots.filter((s) => s.day === d && (k > 0 || minutes(s.from) > mins)).sort((a, b) => minutes(a.from) - minutes(b.from))[0];
      if (next) {
        const date = new Date(now); date.setDate(now.getDate() + k);
        const label = k === 0 ? T.today : date.toLocaleDateString(locale, { weekday: 'long' });
        return { tone: 'warn', text: T.closedNext(label, next.from, next.until) };
      }
    }
    return slots.length ? { tone: 'warn', text: T.closedToday } : null;
  }

  function officeListPage(page) {
    const links = [...page.querySelectorAll('.vyber-fakult a.fakulta[href]')].map((a) => {
      const l = kit.linkOf(a);
      const id = nav.parse(a.href)?.params.get('fakulta');
      return l && { ...l, code: kit.FACULTY_BY_CODE[id] || '' };
    }).filter(Boolean);
    if (!links.length) return null;
    const mine = ipx.state.portal?.study?.faculty || '';
    links.sort((a, b) => (b.code && b.code === mine) - (a.code && a.code === mine));
    return {
      hide: [page.querySelector('.vyber-fakult')],
      build: () => [
        h('p', { class: 'rb-sub' }, T.chooseOffice),
        h('div', { class: 'rb-grid' }, links.map((l) => anchor(l, { class: 'rb-card' + (l.code && l.code === mine ? ' is-mine' : '') },
          h('div', { class: 'rb-card-top' }, h('span', { class: 'rb-badge', style: l.code ? `background: ${ipx.ui.facultyColors(l.code)[0]}; color: ${ipx.ui.facultyColors(l.code)[1]}` : null }, l.code || icon('people')),
            h('span', {}, h('strong', {}, l.text), l.code && l.code === mine && h('small', { class: 'dep-mine' }, T.yourFaculty)))))),
      ],
    };
  }

  function officePage(page) {
    const tables = [...page.querySelectorAll('table')].filter((t) => !t.closest('table table') && ownTable(t));
    if (!tables.length) return null;
    const name = clean(page.querySelector('big > b')?.childNodes[0]?.textContent || page.querySelector('big b')?.textContent);
    const read = tables.map((t) => ({ t, d: kit.readTable(t) }));
    const basic = read.find((x) => x.d.head.length <= 1);
    const hours = read.find((x) => x.d.head.some((t) => /^(day|den)$/i.test(t)));
    const persons = read.filter((x) => x.d.head.some((t) => /^(name|jméno|jmeno)$/i.test(t)));
    const status = hours ? hoursStatus(hours.d.rows) : null;
    const today = (new Date().getDay() + 6) % 7;
    const col = (d, re) => d.head.findIndex((t) => re.test(norm(t)));

    const personCards = ({ d }, specs) => {
      const ix = { name: col(d, /^(name|jmeno)$/), office: col(d, /^(office|kancelar|mistnost)/), phone: col(d, /^(phone|telefon)/), mail: col(d, /^e-?mail$/),
        field: col(d, /^(field of activity|oblast|agenda|cinnost)/), spec: col(d, /^(specification|upresneni|specifikace)/) };
      return h('div', { class: 'rb-grid' }, d.rows.filter((r) => r.cells.length > 2).map((r) => {
        const c = (i) => (i >= 0 ? r.cells[i] : null);
        const person = c(ix.name)?.el.querySelector('a[href]');
        const mail = c(ix.mail)?.el.querySelector('a[href]');
        const pl = person && rb.link(person);
        const ml = mail && rb.link(mail);
        const top = specs ? c(ix.spec)?.text || c(ix.field)?.text : c(ix.field)?.text;
        return h('section', { class: 'rb-card dep-person' },
          top && h('small', { class: 'dep-field' }, top),
          pl ? anchor(pl, { class: 'dep-name' }, c(ix.name).text) : h('strong', {}, c(ix.name)?.text || ''),
          h('small', {}, [c(ix.office)?.text, c(ix.phone)?.text].filter(Boolean).join(' · ')),
          specs && c(ix.field)?.text && c(ix.spec)?.text && h('small', {}, c(ix.field).text),
          ml && anchor(ml, { class: 'dep-mail' }, icon('mail'), h('span', {}, c(ix.mail).text || T.write)));
      }));
    };

    return {
      hide: [...tables, ...page.querySelectorAll('big')],
      build: () => [
        h('div', { class: 'dep-office-head' },
          h('div', { class: 'dep-office-name' }, name && h('h2', { class: 'rb-title' }, name),
            plain(`${P}stud_odd.pl`) && anchor({ href: plain(`${P}stud_odd.pl`) }, { class: 'rb-chip' }, icon('people'), T.another)),
          status && h('p', { class: `kit-note ${status.tone}` }, icon('clock'), h('span', {}, status.text)),
          h('p', { class: 'rb-sub' }, T.officeLead)),
        h('div', { class: 'kit-cols' },
          h('div', { class: 'kit-stack' },
            persons[0] && rb.title(T.whoWhat), persons[0] && personCards(persons[0]),
            persons[1] && rb.title(T.vicedeans), persons[1] && personCards(persons[1], true)),
          h('aside', { class: 'kit-stack' },
            basic && factsCard(basic.d.rows.filter((r) => r.cells.length === 2 && r.cells[1].text).map((r) => ({ label: r.cells[0].text, value: r.cells[1].text,
              links: [...r.cells[1].el.querySelectorAll('a[href]')].map((a) => rb.link(a)).filter(Boolean) })), T.basic),
            hours && h('section', { class: 'card pad dep-hours' }, h('h2', { class: 'card-title' }, T.hours),
              h('ul', {}, hours.d.rows.filter((r) => r.cells.length >= 3).map((r) => h('li', { class: dayIndex(r.cells[0].text) === today ? 'is-today' : null },
                h('strong', {}, r.cells[0].text, dayIndex(r.cells[0].text) === today && h('span', { class: 'delta neutral' }, T.today)),
                h('span', {}, `${r.cells[1].text}–${r.cells[2].text}`),
                r.cells[3]?.text && h('small', {}, r.cells[3].text))))))),
      ],
    };
  }
  const ownTable = (t) => [...t.rows].some((tr) => tr.closest('table') === t && (tr.classList.contains('zahlavi') || tr.closest('thead') || [...tr.cells].every((c) => c.tagName === 'TH')));

  // ---------- staff (zamestnanci.pl): person cards with consulting hours ----------

  function staffCards(b) {
    const d = b.data;
    const col = (re) => d.head.findIndex((t) => re.test(norm(t)));
    const ix = { name: col(/^(name|jmeno)/), dept: col(/^(department|pracoviste)/), pos: col(/^(position|zarazeni|funkce)/), office: col(/^(office|mistnost|kancelar)/),
      phone: col(/^(phone|telefon)/), mail: col(/^e-?mail/), hours: col(/^(consulting|konzultac)/) };
    const items = d.rows.filter((r) => r.cells.length >= 3).map((r) => {
      const extra = Math.max(0, r.cells.length - d.head.length);
      const c = (i) => (i >= 0 ? r.cells[i + extra] : null);
      const lk = (i) => { const a = c(i)?.el.querySelector('a[href]'); return a && rb.link(a); };
      const name = lk(ix.name);
      const mail = lk(ix.mail);
      const dept = lk(ix.dept);
      const hours = c(ix.hours)?.text;
      const el = h('section', { class: 'rb-card dep-person' },
        name ? anchor(name, { class: 'dep-name' }, c(ix.name).text) : h('strong', {}, c(ix.name)?.text || ''),
        c(ix.pos)?.text && h('small', {}, c(ix.pos).text),
        h('small', { class: 'dep-where' }, dept ? anchor(dept, {}, c(ix.dept).text) : c(ix.dept)?.text, [c(ix.office)?.text, c(ix.phone)?.text].filter(Boolean).map((t) => ` · ${t}`).join('')),
        mail && anchor(mail, { class: 'dep-mail' }, icon('mail'), h('span', {}, c(ix.mail).text || T.write)),
        hours && h('p', { class: 'dep-hours-text' }, icon('clock'), h('span', {}, hours)));
      return { el, text: norm(clean(r.el.textContent)) };
    });
    if (!items.length) return null;
    return rb.longList(h('div', { class: 'rb-grid' }, items.map((i) => i.el)), items, { cap: 48, filterAt: 12, placeholder: T.findPerson });
  }

  // ---------- generic R pages of the family (staff, courses, projects, publications, topic detail, zakladni) ----------

  function genericPage(page, { lead, find, tableNode } = {}) {
    const hideFirst = rb.chrome(page);
    const list = rb.blocks(page, { skip: hideFirst });
    // "Kind of body:" and "Number of entries found" are said by the page itself.
    const drawn = list.filter((b) => !(b.type === 'text' && /^(number of entries|počet nalezených|kind of body)/i.test(b.text)));
    return {
      hide: rb.redrawn(drawn),
      kept: true,
      build: () => rb.render(drawn, { table: { placeholder: find, cap: 60 }, tableNode, keepCard: (slot) => formCard(lead, slot) }),
    };
  }

  // ---------- dispatch ----------

  ipx.ready.then(() => {
    const page = document.getElementById('str1');
    if (!page) return;
    const r = route();
    const p = r.path || '';
    let built = null;
    let hdr = null;
    let key = 'departments';
    if (p === `${P}pracoviste.pl` && (!r.params.has('id') || r.params.has('strom'))) {
      hdr = head(departments, r.params.has('strom') ? 'tree' : 'faculties');
      built = r.params.has('strom') ? treePage(page) : facultiesPage(page);
    } else if (p === `${P}pracoviste.pl`) {
      hdr = head(unit, r.params.has('nerozbaluj') ? 'overview' : 'units');
      built = r.params.has('nerozbaluj') ? overviewPage(page) : unitsPage(page);
    } else if (p === `${P}zamestnanci.pl`) {
      hdr = head(unit, 'staff');
      built = genericPage(page, { lead: T.restrictLead, find: T.findPerson, tableNode: staffCards });
    } else if (p === `${P}predmety.pl`) {
      hdr = head(unit, 'courses');
      built = genericPage(page, { find: T.findCourse });
    } else if (p === `${P}prehled_temat.pl`) {
      hdr = head(unit, r.params.has('detail') ? null : 'topics');
      built = r.params.has('detail') ? genericPage(page) : topicsPage(page);
    } else if (p === `${P}publikace.pl` || p === `${P}projekty.pl`) {
      hdr = head(unit, p.endsWith('publikace.pl') && !r.params.has('podrobnosti') ? 'publications' : null);
      built = genericPage(page, { lead: r.params.has('podrobnosti') ? null : (page.querySelector('form select') ? T.filterLead : T.exportLead) });
    } else if (p === `${P}telsez.pl`) {
      hdr = head(unit, null);
      built = { hide: rb.chrome(page), only: page.querySelector('form'), build: () => [formCard(T.telLead)] };
    } else if (p === `${P}kompaktni_telsez.pl`) {
      hdr = { ...head(departments, null), actions: [] };
      hdr.title = T.phones; hdr.subtitle = nav.sectionLabel('campus.departments'); hdr.tabs = null;
      built = { hide: rb.chrome(page), only: page.querySelector('form'), build: () => [formCard(T.compactLead)] };
    } else if (p === '/auth/sif/organy.pl' || p === '/auth/sif/organy_prehled.pl') {
      const own = p.endsWith('organy.pl');
      hdr = own ? head(unit, null) : { ...head(departments, null), title: T.bodies, subtitle: nav.sectionLabel('campus.departments'), tabs: null };
      built = !r.params.has('clenove') ? bodiesPage(page) : null;
      if (!built) built = genericPage(page);
    } else if (p === '/auth/zakladni.pl') {
      key = 'about';
      hdr = { title: T.facts, subtitle: nav.sectionLabel('campus.about'), actions: [], tabs: null };
      built = genericPage(page);
    } else if (p === `${P}stud_odd.pl`) {
      key = 'office';
      hdr = head(office, null);
      built = r.params.has('fakulta') && page.querySelector('table') ? officePage(page) : officeListPage(page);
    } else return;
    if (!built) return;

    // A page with a <slot> keeps InSIS's original slotted (hidden where redrawn), so InSIS's forms and kept lists
    // show there; a page drawn entirely by InSIS+ leaves the original out of view.
    const nodes = built.build();
    const hasSlot = nodes.flat(Infinity).some((n) => n instanceof Node && (n.matches?.('slot') || n.querySelector?.('slot')));
    rb.frame({
      key, css: 'pages/departments.css', cls: 'ipx-dep', title: hdr.title, subtitle: hdr.subtitle, actions: hdr.actions, tabs: hdr.tabs,
      slot: hasSlot, kept: !!built.kept, hide: built.hide, only: built.only, build: () => nodes,
    });
  });
})();
