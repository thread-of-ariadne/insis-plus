// InSIS+ — Study matters › Study abroad (teardowns/study-matters.md §2.14).
//   Partner universities  katalog/dohody.pl       R: agreement types as rows (InSIS's own link to each type's page),
//                                                  with a filter over the rows InSIS+ drew
//   One agreement type    katalog/dohody.pl?typ   R: its countries with counts; the next level (stat,typ) is not
//                                                  allowed by the URL rule yet, so the rows carry no dead links
//   Reports               int/zavzpr.pl           InSIS's 14-select filter form in place as a card, InSIS's results
//                                                  below it; its Study / Work placement tabs (akce: an action
//                                                  parameter) are not linked, only the current view shows
// Applying for an exchange (int/podani_prihlasky.pl) is still unverified: no link, the summary says where to ask.
// Nothing is stored.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.kit || !ipx.nav) return;
  const { lang, norm } = ipx;
  const { h, icon, anchor, kpi, hideInSlot, styleSlotted } = ipx.ui;
  const kit = ipx.kit;
  const nav = ipx.nav;

  const T = {
    cs: { reports: 'Zprávy studentů', partners: 'Partnerské školy', types: 'Programy a dohody', agreementsN: 'Dohod celkem',
      lead: 'Dohody VŠE se zahraničními školami podle programu. Otevřete program a uvidíte jeho země.',
      apply: 'Přihlášky na výjezdy vypisuje zahraniční oddělení fakulty; poradí i studijní oddělení.',
      filter: 'Hledat program', filterCountry: 'Hledat zemi', noMatch: 'Hledání neodpovídá žádný program.', countries: 'Země', countriesLead: 'Země, se kterými má VŠE v tomto programu dohodu.',
      agreements: (n) => `${n} ${kit.plural(Number(n), 'dohoda', 'dohody', 'dohod')}`, institutions: (n) => `${n} ${kit.plural(Number(n), 'škola', 'školy', 'škol')}`,
      countriesN: (n) => `${n} ${kit.plural(Number(n), 'země', 'země', 'zemí')}`, students: (n) => `${n} ${kit.plural(Number(n), 'student', 'studenti', 'studentů')}`,
      reportsTitle: 'Zprávy bývalých studentů',
      reportsLead: 'Závěrečné zprávy studentů, kteří byli v zahraničí. Vyberte období, dohodu, zemi nebo školu a stiskněte Zobrazit: InSIS vypíše zprávy pod formulářem.',
      nothing: 'Nic tu není.' },
    en: { reports: 'Student reports', partners: 'Partner universities', types: 'Programmes and agreements', agreementsN: 'Agreements in total',
      lead: 'VŠE’s agreements with universities abroad, by programme. Open a programme to see its countries.',
      apply: 'Exchange applications are announced by your faculty’s international office; the study department can help too.',
      filter: 'Find a programme', filterCountry: 'Find a country', noMatch: 'No programme matches.', countries: 'Countries', countriesLead: 'Countries VŠE has an agreement with in this programme.',
      agreements: (n) => `${n} ${Number(n) === 1 ? 'agreement' : 'agreements'}`, institutions: (n) => `${n} ${Number(n) === 1 ? 'university' : 'universities'}`,
      countriesN: (n) => `${n} ${Number(n) === 1 ? 'country' : 'countries'}`, students: (n) => `${n} ${Number(n) === 1 ? 'student' : 'students'}`,
      reportsTitle: 'Reports from former students',
      reportsLead: 'Final reports of students who studied abroad. Choose the period, agreement, country or institution and press Display: InSIS lists the reports below the form.',
      nothing: 'Nothing here.' },
  }[lang];

  // InSIS writes some agreement names in lower case ("additional exchange selection"): a title starts with a capital.
  const upper = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const plain = (path) => nav.safe(new URL(path, document.baseURI).href, 'link');
  const col = (head, re) => head.findIndex((t) => re.test(norm(t)));

  // Counts of a row by InSIS's column names ("Number of agreements", "Počet dohod", …).
  function counts(head, r) {
    const at = (re) => { const i = col(head, re); return i >= 0 ? r.cells[i]?.text : null; };
    return [
      [at(/agreements|dohod/), T.agreements], [at(/institutions|instituc|skol/), T.institutions],
      [at(/countries|zemi|statu/), T.countriesN], [at(/students|studentu/), T.students],
    ].filter(([v]) => v != null && v !== '').map(([v, f]) => h('span', {}, f(v)));
  }

  function rowsCard(title, rows) {
    return h('section', { class: 'card mx-rows' }, h('h2', { class: 'card-title' }, title), rows);
  }
  const row = (text, side, link) => {
    const body = [h('span', { class: 'mx-row-text' }, h('strong', {}, text)), h('span', { class: 'mx-row-side' }, side)];
    return link ? anchor({ ...link, text }, { class: 'mx-row' }, ...body, h('span', { class: 'mx-row-go' }, icon('arrow'))) : h('div', { class: 'mx-row' }, ...body);
  };

  function partnersPage(page, typ) {
    const d = kit.findTables(page).map((t) => kit.readTable(t)).find((x) => x.rows.some((r) => r.cells.length > 2));
    if (!d) return false;
    const name = Math.max(0, col(d.head, /^(name|nazev|country|stat|zeme)/));
    const items = d.rows.filter((r) => r.cells.length > 2).map((r) => ({
      text: r.cells[name]?.text || '', side: counts(d.head, r),
      // The row's own link (Choose → the type's page) where the URL rule takes it; country pages are not allowed yet.
      link: r.cells.flatMap((c) => c.links).find((l) => /dohody\.pl/.test(l.href)) || null,
      agreements: Number(r.cells[col(d.head, /agreements|dohod/)]?.text) || 0,
    }));
    const agreement = typ ? [...page.querySelectorAll('table')].flatMap((t) => [...t.rows]).find((tr) => tr.cells.length === 2 && /agreement|dohoda/i.test(norm(tr.cells[0].textContent))) : null;
    const reports = plain('/auth/int/zavzpr.pl');
    const office = nav.target('campus.office');
    const list = h('div', { class: 'kit-stack' });
    const hint = typ ? T.filterCountry : T.filter;
    const input = h('input', { type: 'search', placeholder: hint, 'aria-label': hint, autocomplete: 'off' });
    const render = () => {
      const words = norm(input.value).split(' ').filter(Boolean);
      const hits = items.filter((it) => words.every((w) => norm(it.text).includes(w)));
      list.replaceChildren(hits.length ? rowsCard(typ ? T.countries : T.types, hits.map((it) => row(it.text, it.side, it.link)))
        : h('div', { class: 'empty' }, h('p', {}, T.noMatch)));
    };
    input.addEventListener('input', render);
    input.addEventListener('keydown', (e) => e.stopPropagation());
    render();
    kit.page({
      key: typ ? 'abroad-type' : 'abroad',
      css: 'pages/matters.css',
      // The section's entry page is titled by the section; one agreement type is a page below it (rule 7).
      title: typ ? (agreement ? upper(kit.cellText(agreement.cells[1])) : T.countries) : nav.sectionLabel('studies.abroad'),
      subtitle: typ ? nav.sectionLabel('studies.abroad') : nav.label('matters'),
      actions: reports && anchor({ href: reports }, { class: 'btn ghost', title: T.reports }, icon('people'), h('span', {}, T.reports)),
      build: () => [
        h('p', { class: 'muted mx-lead' }, typ ? T.countriesLead : T.lead),
        !typ && h('div', { class: 'kpis' },
          kpi({ label: T.types, value: items.length }),
          kpi({ label: T.agreementsN, value: items.reduce((s, it) => s + it.agreements, 0) })),
        items.length > 8 && h('label', { class: 'mx-filter' }, icon('search'), input),
        list,
        h('p', { class: 'muted small' }, T.apply, ' ', office && anchor({ href: office }, {}, nav.label('campus.office'))),
      ],
    });
    return true;
  }

  // Reports: one header (a section of one view, so generic.js frames InSIS's form and results under it).
  let leadNode = null;
  kit.section({
    id: 'abroad-reports',
    title: () => T.reportsTitle,
    subtitle: () => nav.sectionLabel('studies.abroad'),
    pages: { '/auth/int/zavzpr.pl': 'reports' },
    views: () => [],
    lead: () => leadNode,
    css: ['pages/matters.css'],
  });

  function markReports(page) {
    const form = page.querySelector('form[action*="zavzpr"]');
    if (!form) return false;
    form.setAttribute('data-ipx-card', 'inplace');
    form.querySelector('table.form-edit')?.setAttribute('data-ipx-columns', '');
    hideInSlot([...page.querySelectorAll('.small')]);
    const partners = plain('/auth/katalog/dohody.pl');
    leadNode = h('div', { class: 'mx-bar' }, h('p', { class: 'muted mx-lead' }, T.reportsLead),
      partners && h('span', { class: 'mx-links' }, anchor({ href: partners }, {}, T.partners)));
    document.documentElement.classList.add('ipx-abroad');
    styleSlotted('pages/matters-slot.css');
    return true;
  }

  ipx.ready.then(() => {
    const route = nav.route(document.baseURI.split('#')[0]);
    const page = document.getElementById('str1');
    if (!page) return;
    if (route.path === '/auth/katalog/dohody.pl') partnersPage(page, route.params?.has('typ'));
    else if (route.path === '/auth/int/zavzpr.pl') markReports(page);
  });
})();
