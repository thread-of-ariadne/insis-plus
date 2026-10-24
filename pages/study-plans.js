// InSIS+ — Grades & credits › Study plans, first step: the faculties (katalog/plany.pl without parameters).
// Treatment R (docs/ia/03-pages.md; teardowns/exams-grades-schedule.md §2.6).
// InSIS's page: a help sentence ("First select a faculty.") and the faculties and other units as logo links
// (div.vyber-fakult a.fakulta, each to plany.pl?fakulta=<id>). Here: one line saying what the section is for and
// that the student's own plan is in What's left (a link card), then the faculties as cards (the student's own
// faculty first, when the e-study record told us which it is) and the other units as a list. Every link is
// InSIS's own, through the URL rule. The later steps of the drill-down are not rebuilt yet (no snapshots) and stay
// with generic.js.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.kit) return;
  const { lang, clean } = ipx;
  const { h, icon, anchor, cover, facultyColors, facultyOf, sectionHead } = ipx.ui;
  const kit = ipx.kit;
  const nav = ipx.nav;
  const PATH = '/auth/katalog/plany.pl';

  const T = {
    cs: { lead: 'Studijní plány všech programů: vyberte fakultu, pak období, typ studia a program.',
      faculties: 'Fakulty', units: 'Další součásti', yours: 'vaše fakulta',
      mine: 'Váš vlastní plán', mineText: 'Kolik kreditů a které předměty vám ještě chybí, najdete v přehledu Co mi chybí.' },
    en: { lead: 'Study plans of every programme: choose a faculty, then the period, the type of study and the programme.',
      faculties: 'Faculties', units: 'Other units', yours: 'your faculty',
      mine: 'Your own plan', mineText: "How many credits and which courses you still need is in What's left." },
  }[lang];

  // Faculty from InSIS's logo file name (fis-ang.png …); the faculty id in the address as a fallback.
  const LOGO_FAC = { ffu: 'FFU', fmv: 'FMV', fph: 'FPH', fis: 'FIS', fnh: 'NF', fmh: 'FM' };
  const CODE_FAC = { 10: 'FFU', 20: 'FMV', 30: 'FPH', 40: 'FIS', 50: 'NF', 60: 'FM' };

  function parse(page) {
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

  ipx.ready.then(() => {
    const route = nav.route(document.baseURI.split('#')[0]);
    // Only the first step (no parameters): the later steps have other markup.
    if (route.path !== PATH || route.params?.size) return;
    const page = document.getElementById('str1');
    const units = page && parse(page);
    if (!units) return;
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

    kit.page({
      key: 'study-plans',
      css: 'pages/study-plans.css',
      title: nav.sectionLabel('grades.plans'),
      subtitle: nav.label('grades'),
      build: () => [
        h('p', { class: 'muted spl-lead' }, T.lead),
        left && anchor({ href: left }, { class: 'card glist-item spl-mine' },
          h('span', { class: 'spl-mine-ico' }, icon('layers')),
          h('span', { class: 'glist-text' }, h('strong', {}, T.mine), h('small', {}, T.mineText)),
          h('span', { class: 'glist-go' }, icon('arrow'))),
        facs.length > 0 && [sectionHead(T.faculties), h('div', { class: 'spl-units' }, facs.map(card))],
        rest.length > 0 && [sectionHead(T.units), h('ul', { class: 'card spl-list' }, rest.map((u) =>
          h('li', {}, anchor(u, { class: 'spl-link' }, h('span', {}, u.text), icon('arrow')))))],
      ],
    });
  });
})();
