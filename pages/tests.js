// InSIS+ — Exams › Online tests (elis/ot/psani_testu.pl, ?vysledky=1). Teardowns/exams-grades-schedule.md §2.3.
// InSIS's page: its own two tabs (Tests to do · Submitted tests), a long help paragraph whose one important sentence
// is that starting a test is irreversible, a post form, and either the list of tests or a message ("At the moment
// no tests are available for you to do.").
// Here: the header, InSIS's two tabs as view tabs (its own links), and
// - no tests: an empty state that says what happens next (tests appear when a teacher opens them);
// - Tests to do with rows (treatment L): InSIS's own table, in place and styled with CSS and data- attributes only,
//   under a warning line. Starting a test is InSIS's control in that table: never moved, copied or pressed here;
// - Submitted tests with rows (treatment R): the rows read and drawn again as a table; links pass the URL rule.
// No snapshot with rows exists yet (only the empty list), so the list markup is read generically (header row +
// rows) and nothing is stored.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.kit) return;
  const { lang } = ipx;
  const { h, icon, takeover, kpi, styleSlotted, hideInSlot, viewTabs } = ipx.ui;
  const kit = ipx.kit;
  const nav = ipx.nav;
  const PATH = '/auth/elis/ot/psani_testu.pl';

  const T = {
    cs: { views: 'Testy', open: 'Otevřené testy', openFoot: 'můžete začít teď', submitted: 'Odevzdané testy',
      warn: 'Spuštění testu nejde vrátit: čas běží od chvíle, kdy stisknete tlačítko pro spuštění v InSIS.',
      emptyTodo: 'Teď není otevřený žádný test.', emptyTodoNext: 'Vyučující otevírá testy v daný čas; jakmile se nějaký otevře, objeví se tady.',
      emptyDone: 'Zatím jste neodevzdali žádný test.', emptyDoneNext: 'Odevzdané testy a jejich výsledky (když je vyučující zveřejní) se ukážou tady.',
      contact: 'Máte teď psát test a nevidíte ho? Ozvěte se hned vyučujícímu.' },
    en: { views: 'Tests', open: 'Open tests', openFoot: 'you can start now', submitted: 'Submitted tests',
      warn: "Starting a test can't be undone: the timer starts when you press InSIS's start button.",
      emptyTodo: 'No test is open right now.', emptyTodoNext: 'Teachers open tests at a set time; as soon as one opens it shows here.',
      emptyDone: "You haven't submitted any test yet.", emptyDoneNext: 'Submitted tests and their results (once the teacher publishes them) show here.',
      contact: "Should you be taking a test now and can't see it? Contact the teacher straight away." },
  }[lang];

  ipx.ready.then(() => {
    const route = nav.route(document.baseURI.split('#')[0]);
    if (route.path !== PATH) return;
    const page = document.getElementById('str1');
    if (!page) return;
    const tabs = kit.insisTabs(page)[0] || [];
    // Which view: the tab InSIS marks, else the address (vysledky = Submitted).
    const submittedView = tabs.length ? /vysledky/.test(tabs.find((t) => t.on)?.href || '') : route.params?.has('vysledky');
    const table = kit.findTables(page)[0] || null;
    const data = table ? kit.readTable(table) : null;
    const rows = data?.rows.length || 0;
    const problems = kit.messages(page).filter((m) => m.tone === 'bad' || m.tone === 'warn');
    const title = nav.sectionLabel('exams.tests');
    const subtitle = nav.label('exams');

    // Tests to do with rows: the list stays InSIS's element, in place.
    if (!submittedView && rows) {
      const head = data.head;
      table.setAttribute('data-ipx-ot', '');
      // Phone layout labels from InSIS's own header (CSS reads them; no cell is moved or changed).
      for (const r of data.rows) r.cells.forEach((c, i) => head[i] && c.el.setAttribute('data-label', head[i]));
      hideInSlot([...page.querySelectorAll('nav[aria-label="breadcrumb"], table.portal_menu, div.small, .uis_msg')]);
      document.documentElement.classList.add('ipx-ot');
      styleSlotted('pages/tests.css');
      takeover({
        key: 'tests', css: ['kit.css', 'pages/tests.css'], title, subtitle, slotted: [page],
        build: () => h('div', { class: 'kit-page' },
          viewTabs(tabs, T.views),
          h('div', { class: 'kpis' }, kpi({ label: T.open, value: rows, foot: T.openFoot })),
          problems.map(kit.note),
          h('p', { class: 'kit-note warn' }, icon('alert'), h('span', {}, T.warn)),
          h('slot')),
      });
      return;
    }

    kit.page({
      key: 'tests',
      css: 'pages/tests.css',
      title,
      subtitle,
      tabs,
      build: () => [
        problems.map(kit.note),
        rows ? [
          h('div', { class: 'kpis' }, kpi({ label: T.submitted, value: rows })),
          kit.dataTable({ label: T.submitted, columns: data.head.map((label, i) => ({ key: `c${i}`, label, main: i === 0 })),
            rows: data.rows.map((r) => Object.assign({}, ...r.cells.map((c, i) => ({ [`c${i}`]: c.links.length === 1 ? { ...c.links[0], text: c.text || c.links[0].text } : c.text })))) }),
        ] : h('div', { class: 'empty ot-empty' },
          h('p', { class: 'ot-empty-title' }, submittedView ? T.emptyDone : T.emptyTodo),
          h('p', {}, submittedView ? T.emptyDoneNext : T.emptyTodoNext)),
        !submittedView && h('p', { class: 'muted small' }, T.contact),
      ],
    });
  });
})();
