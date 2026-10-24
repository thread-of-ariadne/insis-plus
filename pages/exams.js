// InSIS+ — Exams › Exam dates (student/terminy_seznam.pl and the page of one date, terminy_info.pl).
// Treatment L (docs/ia/03-pages.md; teardowns/exams-grades-schedule.md §2.1): InSIS's list holds the sign-up and
// sign-off controls, so it stays InSIS's own, in place. What InSIS+ owns is the header: the four views of the list
// (My dates · Available dates · Past · Not yet scheduled, structure.views in mapping.json) as one row of view tabs,
// the same on every view and on a date's own page, so moving between them never changes the page around the list.
// The summary above the list waits for a snapshot taken while exam dates are open (03-pages.md §5, step 3).
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.kit) return;
  const nav = ipx.nav;
  const kit = ipx.kit;

  const VIEWS = nav.views['exams.mine'] || ['exams.mine', 'exams.signup', 'exams.past', 'exams.unscheduled'];

  // generic.js draws these pages from this definition (InSIS's own tab rows hidden, the list in place).
  kit.section({
    id: 'exams',
    title: () => nav.sectionLabel('exams.mine'),
    subtitle: () => nav.label('exams'),
    pages: {
      '/auth/student/terminy_seznam.pl': (r) => (VIEWS.includes(r.node) ? r.node : 'exams.mine'),
      '/auth/student/terminy_info.pl': null,
    },
    views: () => VIEWS.map((node) => ({ id: node, href: nav.target(node), text: nav.label(node) })),
  });
})();
