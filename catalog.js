// InSIS+ — Courses › Catalogue: course search (katalog/ and katalog/index.pl?jak=…). Treatment F
// (teardowns/courses.md §2.6 "Search").
// InSIS's page: a help paragraph, its own tab row of search modes (Courses by their names · by departments · for
// foreigners · Extended search: views of one tool), then one form: "Enter the course name" + the field + Search, the
// faculty and period checkboxes (a long form-edit table) and — after a search — the results, written straight into
// the form as "<bullet>&nbsp;<a>CODE Name</a> - period - faculty<br>" lines (the links carry InSIS's zpet).
// Here: the header (Catalogue, eyebrow Courses), the search modes as view tabs (InSIS's own links), one line on what
// the form does, InSIS's form itself slotted as the search card — nothing in it is moved, wrapped, filled or sent:
// the checkboxes are folded with data attributes and CSS behind a Filters button, InSIS's result lines are hidden in
// place (their text nodes with the form's font-size, the links and bullets with data attributes) and drawn again
// under the form as cards, one per course with its periods as chips (InSIS's own addresses, through the URL rule).
// Rail: the syllabi opened recently (ipx.state.courses, written by syllabus.js) and Pass rates (hodnoceni.pl).
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.ui || !ipx.kit) return;
  const { clean, lang } = ipx;
  const { h, icon, anchor, takeover, cover, facultyOf, facultyColors, hideInSlot, styleSlotted } = ipx.ui;
  const kit = ipx.kit;
  const nav = ipx.nav;

  const T = {
    cs: { filters: 'Filtry: fakulta a období', label: 'Název nebo kód předmětu',
      found: (n) => `Nalezené předměty: ${n}`, views: 'Způsob hledání',
      lead: 'Hledejte jakýkoli předmět VŠE v kterémkoli období; InSIS hledá po stisknutí tlačítka Vyhledat.',
      recent: 'Naposledy otevřené sylaby', passRates: 'Úspěšnost předmětů', passText: 'Jak dopadly zkoušky v minulých obdobích' },
    en: { filters: 'Filters: faculty and period', label: 'Course name or code',
      found: (n) => `Courses found: ${n}`, views: 'Search by',
      lead: "Search any course of any period; InSIS searches when you press its Search button.",
      recent: 'Recently opened syllabi', passRates: 'Pass rates', passText: 'How exams went in past periods' },
  }[lang];

  ipx.ready.then(() => {
    // The people search (lide/) uses the same search field: the catalogue is recognised by its address first.
    if (nav.route(document.baseURI.split('#')[0]).path !== '/auth/katalog/') return;
    const page = document.getElementById('str1');
    const form = page?.querySelector('form[action*="katalog/index.pl"], form[action*="/katalog/"]');
    if (!page || !form) return;
    // InSIS's search field is left exactly as InSIS wrote it (only data-* attributes go on InSIS's elements): what to
    // type is the form card's caption (data-ipx-cat, drawn by catalog.css above the field).
    const input = form.querySelector('input.uisSearchInput[name="vzorek"]');

    // InSIS's result lines: read, then hidden in place (never moved out of the form).
    const links = [...form.querySelectorAll('a[href*="syllabus.pl"]')].filter((a) => !a.closest('table'));
    const courses = new Map();
    for (const a of links) {
      const after = a.nextSibling?.nodeType === Node.TEXT_NODE ? a.nextSibling.nodeValue : '';
      const [, code = '', name = clean(a.textContent)] = clean(a.textContent).match(/^(\S+)\s+(.+)$/) || [];
      const [semester = '', faculty = ''] = clean(after).replace(/^-\s*/, '').split(/\s+-\s+/);
      const key = `${code}|${name}|${faculty}`;
      if (!courses.has(key)) courses.set(key, { code, name, faculty, items: [] });
      courses.get(key).items.push({ href: nav.safe(a.href, 'link', { copied: true }), semester });
    }
    const hide = [...links, ...form.querySelectorAll('[data-dept-bullet]'), ...form.querySelectorAll(':scope > div.small')];
    // Search modes are InSIS's own tab row; the help paragraph is shortened into the lead line.
    const modes = kit.insisTabs(page)[0] || [];
    hide.push(...page.querySelectorAll('table.portal_menu'), ...[...page.querySelectorAll('div.small')].filter((d) => !form.contains(d)));
    hideInSlot(hide);
    form.setAttribute('data-ipx-cat', T.label);
    // The faculty and period checkboxes of the name search: folded (CSS), shown by the Filters button.
    const filters = input && form.querySelector('table.form-edit');
    filters?.setAttribute('data-ipx-cat-filters', '');
    document.documentElement.classList.add('ipx-cat');
    styleSlotted('catalog.css');

    const rail = () => {
      const recent = Object.values(ipx.state.courses || {}).sort((a, b) => (b.s || 0) - (a.s || 0)).slice(0, 5)
        .map((c) => ({ ...c, href: nav.safe(c.href, 'link', { copied: true }) })).filter((c) => c.href);
      const pass = nav.safe(new URL('/auth/student/hodnoceni.pl', document.baseURI).href, 'link');
      return h('aside', { class: 'kit-stack' },
        recent.length > 0 && h('section', { class: 'card pad' },
          h('h2', { class: 'card-title' }, T.recent),
          h('div', { class: 'cat-recent' }, recent.map((c) => anchor({ href: c.href }, { class: 'cat-recent-row' },
            h('span', { class: 'cat-code', style: `color: ${facultyColors(c.faculty)[1]}` }, c.code), h('span', {}, c.name))))),
        pass && anchor({ href: pass }, { class: 'card pad cat-pass' }, icon('award'),
          h('span', {}, h('strong', {}, T.passRates), h('small', {}, T.passText)), icon('arrow')));
    };
    const results = () => courses.size > 0 && h('section', { class: 'cat-results' },
      h('p', { class: 'cat-count' }, T.found(courses.size)),
      [...courses.values()].map((c) => {
        const fac = facultyOf(c.faculty);
        const first = c.items.find((it) => it.href);
        const body = [cover(c.code, fac, 44, 44), h('span', { class: 'cat-text' },
          h('span', { class: 'cat-code', style: `color: ${facultyColors(fac)[1]}` }, [c.code, c.faculty].filter(Boolean).join(' · ')),
          h('strong', {}, c.name))];
        return h('div', { class: 'card cat-course' },
          first ? anchor({ href: first.href }, { class: 'cat-main' }, body) : h('span', { class: 'cat-main' }, body),
          h('span', { class: 'cat-sems' }, c.items.map((it) => (it.href ? anchor({ href: it.href }, { class: 'cat-sem' }, it.semester || '→') : h('span', { class: 'cat-sem' }, it.semester)))));
      }));

    takeover({
      key: 'catalog',
      css: ['kit.css', 'catalog.css'],
      title: nav.sectionLabel('courses.catalogue'),
      subtitle: nav.label('courses'),
      slotted: [page],
      build: () => h('div', { class: 'kit-page' },
        ipx.ui.viewTabs(modes, T.views),
        h('div', { class: 'kit-cols' },
          h('div', { class: 'kit-stack' },
            h('p', { class: 'muted cat-lead' }, T.lead),
            h('slot'),
            filters && h('button', { type: 'button', class: 'btn ghost cat-filters', 'aria-expanded': 'false', onclick: (e) => {
              const on = document.documentElement.classList.toggle('ipx-cat-open');
              e.currentTarget.setAttribute('aria-expanded', String(on));
            } }, icon('chevron'), h('span', {}, T.filters)),
            results()),
          rail())),
    });
    if (input && !input.value) input.focus();
  });
})();
