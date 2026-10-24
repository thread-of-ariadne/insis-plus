// InSIS+ — course e-plans (elis/student/seznam_osnov.pl?obdobi,studium). Teardowns/courses.md §2.2 ("Course
// e-plans"): one row per course with a weekly plan. InSIS's page: the portal bar, the heading "eLearning plans", a
// help paragraph and either the list or a message ("No plans are accessible."). The list's markup is not known yet
// (no snapshot with a plan), and an e-plan row may hold InSIS's own links to activities, so a list stays InSIS's own,
// styled in place (pages/lists.js: the first linked column as the row's title, the rest as facts); without plans the
// header's lead says what would appear here and why. Header (kit.section): title Course e-plans, eyebrow My courses.
// Nothing is stored.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.kit || !ipx.lists) return;
  const { lang } = ipx;
  const { h } = ipx.ui;
  const kit = ipx.kit;
  const nav = ipx.nav;
  const L = ipx.lists;
  const PATH = '/auth/elis/student/seznam_osnov.pl';

  const T = {
    cs: { title: 'E-osnovy předmětů', plans: 'Předměty s e-osnovou', n: (n) => `${n} ${kit.plural(n, 'předmět', 'předměty', 'předmětů')} s e-osnovou`,
      lead: 'E-osnova je seznam činností, které vyučující pro předmět naplánoval týden po týdnu (studijní materiály, úkoly, testy).',
      empty: 'Žádný z vašich předmětů teď nemá e-osnovu v InSIS.', emptyNext: 'Vyučující, kteří ji používají, ji zveřejní tady; většina předmětů ji nemá.' },
    en: { title: 'Course e-plans', plans: 'Courses with an e-plan', n: (n) => `${n} ${n === 1 ? 'course' : 'courses'} with an e-plan`,
      lead: 'An e-plan lists what the teacher planned for the course week by week (study materials, assignments, tests).',
      empty: 'None of your courses has an e-plan in InSIS right now.', emptyNext: 'Teachers who use one publish it here; most courses have none.' },
  }[lang];

  let found = null;

  kit.section({
    id: 'eplans',
    css: ['pages/course-pages.css'],
    title: () => T.title,
    subtitle: () => nav.sectionLabel('courses.mine'),
    pages: { [PATH]: () => (nav.route(document.baseURI.split('#')[0]).params?.get?.('predmet') ? undefined : 'list') },
    views: () => [],
    node: () => 'courses.mine',
    lead: () => found?.lead() || null,
  });

  ipx.ready.then(() => {
    const r = nav.route(document.baseURI.split('#')[0]);
    if (r.path !== PATH || r.params?.get?.('predmet')) return;
    const page = document.getElementById('str1');
    if (!page) return;
    const tables = [...page.querySelectorAll('table')].filter((t) => !t.classList.contains('portal_menu') && !t.closest('.uisLegend') && L.columns(t).length > 1);
    let count = 0;
    for (const table of tables) {
      let titled = false;
      const { rows } = L.mark(table, (t, i) => {
        // The first column whose rows carry a link is the row's title; everything else a fact.
        const linked = !titled && [...table.rows].some((tr) => tr.cells[i]?.querySelector('a[href]'));
        if (linked) { titled = true; return 'title'; }
        return 'sub';
      }, { title: T.plans });
      count += rows.length;
    }
    // InSIS's own heading ("eLearning plans") repeats the title; without plans its message is said in the lead.
    const heads = [...page.querySelectorAll('b')].filter((b) => !b.closest('table, form, .uis_msg'));
    const msg = !count ? page.querySelector('.uis_msg') : null;
    ipx.ui.hideInSlot([...heads, msg].filter(Boolean));
    found = {
      lead: () => h('div', { class: 'cp-lead' },
        count > 0 && h('p', { class: 'cp-facts' }, h('span', { class: 'delta neutral' }, T.n(count))),
        h('p', { class: 'muted small' }, T.lead),
        !count && h('div', { class: 'empty' }, h('p', {}, h('strong', {}, T.empty)), h('p', {}, T.emptyNext))),
    };
    L.chrome(page);
    L.on('ipx-eplans');
  });
})();
