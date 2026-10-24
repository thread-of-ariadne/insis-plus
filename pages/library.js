// InSIS+ — Campus › Library: my loans (pim/knihovna_vypujcky.pl). Treatment R (docs/ia/03-pages.md).
// InSIS shows an intro line, a note that the data comes from the library system, and the loans as a table (or a
// sentence when there are none). Here: how many loans and how many are overdue first, then the loans with their
// return date as a countdown; InSIS's note shortened into the page's footnote. Nothing on the page is an action.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.kit) return;
  const { lang } = ipx;
  const { h, kpi, countdown } = ipx.ui;
  const kit = ipx.kit;

  const T = {
    cs: { title: 'Výpůjčky z knihovny', loans: 'Výpůjčky', overdue: 'Po termínu', next: 'Nejbližší vrácení', none: 'Nemáte žádné výpůjčky.',
      source: 'Údaje spravuje knihovní systém; InSIS je jen zobrazuje.', late: 'po termínu' },
    en: { title: 'Library loans', loans: 'Loans', overdue: 'Overdue', next: 'Next return', none: 'You have no library loans.',
      source: 'The library system keeps this data; InSIS only shows it.', late: 'overdue' },
  }[lang];

  // The column that holds the return date: named so ("return", "vrácení", "do") or the last dated column.
  function dueColumn(head, rows) {
    const named = head.findIndex((t) => /return|vr[aá]cen|due|\bdo\b/i.test(t));
    if (named >= 0) return named;
    const dated = head.map((_, i) => rows.some((r) => kit.dateOf(r.cells[i]?.text)));
    return dated.lastIndexOf(true);
  }

  ipx.ready.then(() => {
    if (ipx.nav.route(document.baseURI.split('#')[0]).path !== '/auth/pim/knihovna_vypujcky.pl') return;
    const page = document.getElementById('str1');
    if (!page) return;
    const table = kit.findTables(page)[0];
    const data = table ? kit.readTable(table) : { head: [], rows: [] };
    const now = new Date();
    const due = dueColumn(data.head, data.rows);
    const loans = data.rows.map((r) => ({ r, at: due >= 0 ? kit.dateOf(r.cells[due]?.text) : null }));
    const late = loans.filter((l) => l.at && l.at < now);
    const next = loans.filter((l) => l.at && l.at >= now).sort((a, b) => a.at - b.at)[0];
    const columns = data.head.map((label, i) => ({ key: `c${i}`, label, main: i === 0, align: i === due ? 'end' : null }));
    const rows = loans.sort((a, b) => (a.at || Infinity) - (b.at || Infinity)).map(({ r, at }) => Object.assign(
      { _tone: at && at < now ? 'bad' : null },
      ...r.cells.map((c, i) => ({ [`c${i}`]: i === due && at ? [c.text, ' ', h('span', { class: `delta ${at < now ? 'bad' : 'neutral'}` }, at < now ? T.late : countdown(at, now))]
        : c.links.length === 1 ? c.links[0] : c.text })),
    ));

    kit.page({
      key: 'library',
      title: ipx.nav.sectionLabel('campus.library'),
      subtitle: ipx.nav.label('campus'),
      build: () => [
        loans.length > 0 && h('div', { class: 'kpis' },
          kpi({ label: T.loans, value: loans.length }),
          kpi({ label: T.overdue, value: late.length, status: late.length > 0 && { tone: 'bad', text: T.late } }),
          next && kpi({ label: T.next, value: next.at.toLocaleDateString(lang === 'cs' ? 'cs-CZ' : 'en-GB'), isText: true, foot: countdown(next.at, now) })),
        loans.length ? kit.dataTable({ columns, rows, label: T.title })
          : h('div', { class: 'empty' }, h('p', {}, kit.looseText(page) || T.none)),
        ...kit.messages(page).filter((m) => m.tone !== 'info').map(kit.note),
        h('p', { class: 'muted small' }, T.source),
      ],
    });
  });
})();
