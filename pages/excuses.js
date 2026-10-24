// InSIS+ — Study matters › Excuse notes (student/moje_omluvenky.pl). Treatment F (03-pages.md §3, §7 decision 7,
// teardowns/study-matters.md §2.8).
// InSIS's page is one form: the portal bar, a heading, a help paragraph, a filter (checkbox "Display the history of
// records" + Go), a second help line and the table Since · Until · Reason (or "No suitable data found."). Students do
// not add notes here: the study department records the notes handed in to it. Here: how many notes InSIS shows, the
// notes as rows (dates, reason), and InSIS's own filter, slotted as a form card with one line on what Go does. The
// rest of InSIS's form is hidden in place (never removed, moved or submitted). Nothing is stored.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.kit || !ipx.nav) return;
  const { lang } = ipx;
  const { h, kpi, hideInSlot, styleSlotted } = ipx.ui;
  const kit = ipx.kit;
  const nav = ipx.nav;

  const T = {
    cs: { lead: 'Omluvenky odevzdané na studijním oddělení, jak je InSIS eviduje. Novou omluvenku odevzdáte na studijním oddělení; sem ji zapíše oddělení.',
      notes: 'Omluvenky', current: 'Aktuální', withPast: 'Včetně minulých', shown: 'Zobrazeno',
      none: 'Žádné omluvenky. Pokud jste nějakou odevzdali, zapíše ji sem studijní oddělení.', noneCurrent: 'Žádné aktuální omluvenky.',
      filter: 'Starší omluvenky', filterLead: 'Zaškrtněte políčko a stiskněte tlačítko InSIS: stránka ukáže i omluvenky z minulosti.',
      from: 'od', to: 'do', reason: 'Důvod' },
    en: { lead: 'Excuse notes handed in to the study department, as InSIS records them. Hand a new note in to the study department; the department enters it here.',
      notes: 'Excuse notes', current: 'Current', withPast: 'Including past', shown: 'Shown',
      none: 'No excuse notes. If you handed one in, the study department enters it here.', noneCurrent: 'No current excuse notes.',
      filter: 'Older excuse notes', filterLead: 'Tick the box and press InSIS’s button: the page shows your past excuse notes too.',
      from: 'from', to: 'to', reason: 'Reason' },
  }[lang];

  ipx.ready.then(() => {
    if (nav.route(document.baseURI.split('#')[0]).path !== '/auth/student/moje_omluvenky.pl') return;
    const page = document.getElementById('str1');
    const box = page?.querySelector('input[name="filtr"]');
    const form = box?.closest('form');
    if (!form) return;
    const filter = box.closest('table') || box.parentElement;
    const table = kit.findTables(page).find((t) => /since|odkdy/i.test(ipx.norm(t.rows[0]?.textContent)));
    const data = table ? kit.readTable(table) : { head: [], rows: [] };
    const notes = data.rows.filter((r) => r.cells.length > 1).map((r) => ({ since: r.cells[0]?.text || '', until: r.cells[1]?.text || '', reason: r.cells[2]?.text || '' }));
    const past = box.checked;

    // Inside InSIS's form only the filter stays visible; the heading, help lines, portal bar and table are hidden in
    // place (the table is drawn again above).
    for (let el = filter; el && el !== form; el = el.parentElement) {
      for (const sib of el.parentElement.children) if (sib !== el && !sib.matches('input[type="hidden"], script')) sib.setAttribute('data-ipx-keep', 'hide');
    }
    hideInSlot([]);
    filter.setAttribute('data-ipx-filter', '');
    form.setAttribute('data-ipx-card', '');
    styleSlotted('pages/matters-slot.css');

    const range = (n) => (n.until && n.until !== n.since ? `${n.since} – ${n.until}` : n.since);
    kit.page({
      key: 'excuses',
      css: 'pages/matters.css',
      title: nav.sectionLabel('studies.excuses'),
      subtitle: nav.label('matters'),
      form,
      build: ({ formCard }) => [
        h('p', { class: 'muted mx-lead' }, T.lead),
        h('div', { class: 'kit-cols' },
          h('div', { class: 'kit-stack' },
            notes.length > 0 && h('div', { class: 'kpis' }, kpi({ label: T.notes, value: notes.length, foot: past ? T.withPast : T.current })),
            notes.length
              ? h('section', { class: 'card mx-rows' }, h('h2', { class: 'card-title' }, T.notes), notes.map((n) => h('div', { class: 'mx-row' },
                h('span', { class: 'mx-row-text' }, h('strong', {}, range(n)), n.reason && h('small', {}, n.reason)))))
              : h('div', { class: 'empty' }, h('p', {}, past ? T.none : T.noneCurrent))),
          formCard({ title: T.filter, lead: T.filterLead })),
        ...kit.messages(page).filter((m) => m.tone !== 'info').map(kit.note),
      ],
    });
  });
})();
