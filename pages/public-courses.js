// InSIS+ — All services › Courses on offer & U3V (kurzy/nabidka_kurzu.pl). Treatment L in place.
// InSIS's page: an intro line; "Currently offered courses" with a help line and one form that holds both the filter
// (Supervising department, Restrict) and the list Name · Institute · Enrollment since / until · Number of students
// registered / maximum · Syllabus · Fee · Register, where Register is InSIS's link to its application page
// (kurz_prihlaska.pl: insis-only, never opened or read by InSIS+); then "Courses in preparation" with its own list or
// a message. The list sits inside InSIS's form and holds InSIS's actions, so it stays InSIS's own: rows styled in
// place (the course as the title, "until" with a countdown on the right, Syllabus and Register as buttons), the
// filter folded under Filter in the lead (open when InSIS shows a filtered list), help lines hidden. Header
// (kit.section): title the section (eyebrow All services). Nothing is stored.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.kit || !ipx.lists) return;
  const { lang, clean, norm } = ipx;
  const { h, icon, countdown, deadlineTone } = ipx.ui;
  const kit = ipx.kit;
  const nav = ipx.nav;
  const L = ipx.lists;
  const PATH = '/auth/kurzy/nabidka_kurzu.pl';

  const T = {
    cs: { offered: 'Kurzy, na které se lze přihlásit', preparing: 'Připravované kurzy', syllabus: 'Sylabus', register: 'Přihláška', filter: 'Filtr',
      n: (n) => `${n} ${kit.plural(n, 'kurz', 'kurzy', 'kurzů')} v nabídce`,
      lead: 'Kurzy pro veřejnost a Univerzita třetího věku. Přihlášku podáte na stránce kurzu v InSIS (Přihláška); sylabus popisuje obsah a podmínky.',
      filterLead: 'Jen kurzy vybraného pracoviště; InSIS seznam omezí po stisknutí tlačítka.', only: 'Zobrazeno jen', all: 'Zobrazit vše' },
    en: { offered: 'Open for registration', preparing: 'In preparation', syllabus: 'Syllabus', register: 'Register', filter: 'Filter',
      n: (n) => `${n} ${n === 1 ? 'course' : 'courses'} on offer`,
      lead: 'Courses for the public and the University of the Third Age. You apply on InSIS’s page of each course (Register); the syllabus describes content and conditions.',
      filterLead: "Only one department's courses; InSIS narrows the list when you press its button.", only: 'Showing only', all: 'Show all' },
  }[lang];

  let found = null;

  kit.section({
    id: 'public-courses',
    css: ['pages/course-pages.css'],
    title: () => nav.sectionLabel('all.public-courses'),
    subtitle: () => nav.label('all'),
    pages: { [PATH]: 'list' },
    views: () => [],
    node: () => 'all.public-courses',
    lead: () => found?.lead() || null,
  });

  const heading = (node) => {
    for (let n = node.previousElementSibling, k = 0; n && k < 8; n = n.previousElementSibling, k++) if (n.tagName === 'B') return n;
    return null;
  };

  ipx.ready.then(() => {
    if (nav.route(document.baseURI.split('#')[0]).path !== PATH) return;
    const page = document.getElementById('str1');
    if (!page) return;
    const now = new Date();
    const lists = [...page.querySelectorAll('table')].filter((t) => !t.classList.contains('form-edit') && L.columns(t).some((x) => /^(name|nazev)$/.test(norm(x))));
    let offered = 0;
    lists.forEach((table, i) => {
      const form = table.closest('form');
      const b = heading(form || table);
      const preparing = /prepar|priprav/.test(norm(b?.textContent || '')) || i > 0;
      // Two header rows: "Enrollment since / until", "Number of students registered / maximum" (expanded by lists.js).
      const { rows } = L.mark(table, (t) => (/^(name|nazev)$/.test(t) ? 'title' : /(until|do)$/.test(t) ? 'meta' : /(since|od)$/.test(t) ? 'sub'
        : /(number|pocet)/.test(t) ? 'sub' : /(syllabus|sylabus)/.test(t) ? 'act' : /(register|prihlas)/.test(t) ? 'act' : 'sub'), { title: preparing ? T.preparing : T.offered });
      if (!preparing) offered += rows.length;
      for (const tr of rows) {
        const acts = [...tr.querySelectorAll('td[data-il-col="act"] a[href]')];
        for (const a of acts) {
          const reg = /kurz_prihlaska/.test(a.getAttribute('href') || '');
          L.label(a, reg ? T.register : T.syllabus);
          if (reg) a.setAttribute('data-il-primary', '');
        }
        const until = tr.querySelector('td[data-il-col="meta"]');
        const at = kit.dateOf(clean(until?.textContent));
        if (until && at && at > now) { until.setAttribute('data-il-chip', countdown(at, now)); until.setAttribute('data-il-tone', deadlineTone(at, false, now)); }
      }
      if (b) ipx.ui.hideInSlot([b]);
      form?.setAttribute('data-il-holder', '');
    });
    // "Courses in preparation" without a list: InSIS's message under InSIS+'s heading.
    for (const b of page.querySelectorAll('b')) {
      if (b.closest('table, form, .uis_msg') || b.hasAttribute('data-ipx-keep')) continue;
      if (/prepar|priprav/.test(norm(b.textContent))) L.heading(b, T.preparing);
    }
    // The filter (InSIS's form-edit table inside the list's form): folded under Filter, open when it filters.
    const filter = page.querySelector('table.form-edit');
    const filtered = !!filter && [...filter.querySelectorAll('select')].some((s) => s.selectedIndex > 0);
    if (filter) {
      filter.setAttribute('data-il-fold', '');
      filter.setAttribute('data-il-filter', T.filterLead);
      if (filtered) document.documentElement.classList.add('ipx-il-filter');
    }
    found = {
      lead: () => h('div', { class: 'cp-lead' },
        h('p', { class: 'cp-facts' }, h('span', { class: 'delta neutral' }, T.n(offered)),
          filter && h('button', { type: 'button', class: 'btn ghost', 'aria-expanded': String(filtered), onclick: (e) => {
            const on = document.documentElement.classList.toggle('ipx-il-filter');
            e.currentTarget.setAttribute('aria-expanded', String(on));
          } }, icon('search'), h('span', {}, T.filter))),
        h('p', { class: 'muted small' }, T.lead),
        // InSIS shows a filtered list: what it is limited to, and the way back to the whole list.
        filter && L.onlyLine(filter.querySelectorAll('select'), T)),
    };
    L.chrome(page);
    L.on('ipx-public-courses');
  });
})();
