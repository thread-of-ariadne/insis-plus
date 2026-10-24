// InSIS+ — InSIS's own lists styled in place (treatment L, docs/ia/03-pages.md §2 "Moving InSIS's elements").
// Several Courses pages (classmates, topic sign-ups, a submission box, registration pages, public courses) show a
// list whose rows hold InSIS's actions (download, e-mail, register, print) or sit inside InSIS's <form>. Those rows
// may not be rebuilt, moved, copied or wrapped. This helper only puts data attributes on InSIS's elements; lists.css
// (injected into the page, scoped to html.ipx-generic.ipx-il) draws them as modern list rows:
//   [lead]  title ....................... meta  [actions]
//           sub · sub
// The page module says which column plays which role (by InSIS's header text, Czech or English) and marks InSIS's
// chrome (help paragraphs, legends, bold headings) to hide. Nothing is clicked, filled, submitted or read in the
// background. Should a later shared kit (kit.js) take this over, the API is small:
//
// ipx.lists.columns(table)            → labels of the body columns (InSIS's header rows expanded: rowspan/colspan)
// ipx.lists.mark(table, roleOf, opts) → marks rows and cells; roleOf(label, i) → 'lead' | 'title' | 'sub' | 'meta' |
//                                        'act' | 'pick' | 'hide' | null; opts: { title, stretch, labels: {i: text},
//                                        sort: true (keep InSIS's header row of sort links as a "Sort by" row),
//                                        side: true (one action per row, on the right across both lines) }
//                                        returns { rows: [tr], empty: true when InSIS says "no data" }
//                                        A cell that would be hidden ('hide', a number, no role) but holds a form
//                                        control or an InSIS action link (hasAction) becomes 'act' and stays visible.
// ipx.lists.hasAction(el)             → true when el holds a form control or a link the URL rule refuses to copy
//                                        (nav.safe(href, 'link', { copied: true }) — InSIS's actions, downloads)
// ipx.lists.pager(table)              → InSIS's page-range table (1–40 · 41–80 …) as a row of page buttons
// ipx.lists.chrome(root, keep)        → InSIS's help lines (div.small), legends, separators: hidden (Classic view
//                                        shows them); `keep` is a list of nodes to leave alone
// ipx.lists.heading(b, text)          → one of InSIS's bold headings, drawn as a section title (text: InSIS+ words)
// ipx.lists.label(el, text)           → a word shown next to one of InSIS's icon links (CSS ::after); the link
//                                        itself is untouched
// ipx.lists.on(cls, css)              → switches the in-place styles on for this page (html class + stylesheets)
// ipx.lists.onlyLine(selects, words)  → the "Showing only … · Show all" note for the lead when InSIS's filter selects
//                                        have a choice (words: { only, all }); null when nothing is filtered. "Show
//                                        all" is this page's own address without InSIS's filter parameters, through
//                                        the URL rule (left out when the rule refuses it); InSIS's form is untouched.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.ui) return;
  const { clean, norm } = ipx;

  const CONTROL = 'input:not([type="hidden"]), select, button, textarea';
  const isHead = (tr) => tr.classList.contains('zahlavi') || !!tr.closest('thead') || (tr.cells.length > 0 && [...tr.cells].every((c) => c.tagName === 'TH'));
  // A form control, or a link the URL rule would not copy (an action, a download, an InSIS-only page): such an element
  // is never hidden by InSIS+, whatever its column (InSIS may add a Delete or Register column later).
  const hasAction = (el) => !!el.querySelector(CONTROL)
    || [...el.querySelectorAll('a[href]')].some((a) => !ipx.nav?.safe(a.href, 'link', { copied: true }));
  const ownRows = (table) => [...table.rows].filter((tr) => tr.closest('table') === table);

  // InSIS's header can be two rows ("Students" over "all · from teacher · from seminar"): the grid is expanded so
  // every body column gets its full label ("Students all").
  function columns(table) {
    const heads = ownRows(table).filter(isHead);
    const grid = []; // grid[row][col] = the header cell covering it
    heads.forEach((tr, r) => {
      grid[r] ||= [];
      let c = 0;
      for (const cell of tr.cells) {
        while (grid[r][c]) c++;
        const span = Math.max(1, Number(cell.colSpan) || 1);
        const down = Math.max(1, Number(cell.rowSpan) || 1);
        for (let k = 0; k < down; k++) for (let i = 0; i < span; i++) (grid[r + k] ||= [])[c + i] = cell;
        c += span;
      }
    });
    const width = Math.max(0, ...grid.map((row) => row.length));
    const out = [];
    for (let c = 0; c < width; c++) {
      const cells = [...new Set(grid.map((row) => row[c]).filter(Boolean))];
      out.push(clean(cells.map((cell) => cell.textContent).join(' ')));
    }
    return out;
  }

  // "No suitable data found." / "Nebyla nalezena žádná vyhovující data." — one cell across the table.
  const isNoData = (tr) => tr.cells.length === 1 && Number(tr.cells[0].colSpan) > 1;

  function mark(table, roleOf, { title, stretch = false, labels = {}, sort = false, side = false } = {}) {
    const cols = columns(table);
    // No header row: the columns are counted from the first row and matched by position only.
    if (!cols.length) cols.push(...Array(ownRows(table).find((tr) => !isNoData(tr))?.cells.length || 0).fill(''));
    const roles = cols.map((label, i) => roleOf(norm(label), i, label) || null);
    table.setAttribute('data-il', '');
    if (title) table.setAttribute('data-il-title', title);
    if (stretch) table.setAttribute('data-il-stretch', '');
    if (side) table.setAttribute('data-il-side', '');
    const heads = ownRows(table).filter(isHead);
    heads.forEach((tr) => tr.setAttribute('data-il-head', ''));
    // A header row of sort links stays as a compact "Sort by" row.
    if (sort && heads.length === 1 && heads[0].querySelector('a[href]')) heads[0].setAttribute('data-il-head', 'sort');
    const rows = [];
    let empty = true;
    for (const tr of ownRows(table)) {
      if (isHead(tr)) continue;
      if (isNoData(tr)) { tr.setAttribute('data-il-row', 'none'); continue; }
      empty = false;
      tr.setAttribute('data-il-row', '');
      // InSIS's script adds a row-number cell ("1.") in front once the page has loaded: leading extra cells are
      // numbers (hidden) and the roles shift by as many.
      const cells = [...tr.cells];
      const offset = Math.max(0, cells.length - roles.length);
      cells.forEach((td, i) => {
        const at = i - offset;
        let role = at < 0 ? 'num' : roles[at] || 'hide';
        // A cell with one of InSIS's form controls or action links is never hidden (it may be the only way to an action).
        if ((role === 'hide' || role === 'num') && hasAction(td)) role = 'act';
        td.setAttribute('data-il-col', role);
        const label = labels[at] ?? cols[at];
        if (at >= 0 && label) td.setAttribute('data-il-label', label);
        if (at >= 0 && !clean(td.textContent) && !td.querySelector('a, input, select, button, img, [data-sysid]')) td.setAttribute('data-il-blank', '');
      });
      rows.push(tr);
    }
    if (empty) table.setAttribute('data-il-empty', '');
    return { rows, empty, cols };
  }

  // InSIS's page-range table: one row of cells, the current range as plain text, the others as links, arrows as icons.
  function pager(table) {
    table.setAttribute('data-il-pager', '');
    for (const td of table.querySelectorAll('td')) {
      if (td.querySelector('a[href]')) continue;
      if (clean(td.textContent) && clean(td.textContent) !== '...') td.setAttribute('data-il-current', '');
      else td.setAttribute('data-il-blank', '');
    }
  }

  // InSIS's chrome that the header and the lead line replace: help lines, legends, separators, empty paragraphs.
  // Nothing that holds one of InSIS's form controls or action links is hidden.
  function chrome(root, keep = []) {
    const out = [...root.querySelectorAll('div.small, .uisLegend, hr.uisseparator')]
      .filter((n) => !hasAction(n) && !keep.some((k) => k === n || k.contains?.(n) || n.contains?.(k)));
    ipx.ui.hideInSlot(out);
    return out;
  }

  function heading(b, text) {
    if (!b) return;
    b.setAttribute('data-il-heading', text || '');
  }

  function label(el, text) {
    el?.setAttribute('data-il-text', text);
  }

  function on(cls, css) {
    document.documentElement.classList.add('ipx-il', cls);
    ipx.ui.styleSlotted('pages/lists.css');
    for (const file of [].concat(css || [])) ipx.ui.styleSlotted(file);
  }

  function onlyLine(selects, { only, all }) {
    const active = [...selects].filter((s) => s.selectedIndex > 0 && s.value && s.value !== '0')
      .map((s) => clean(s.selectedOptions[0]?.textContent)).filter(Boolean);
    if (!active.length) return null;
    const u = new URL(document.baseURI);
    const kept = u.search.replace(/^\?/, '').split(/[;&]/).filter((p) => p && !/^filtr/i.test(p));
    const here = `${u.origin}${u.pathname}${kept.length ? `?${kept.join(';')}` : ''}`;
    const href = ipx.nav?.safe(here, 'link', { copied: true });
    const { h, icon, anchor } = ipx.ui;
    return h('p', { class: 'kit-note info' }, icon('search'),
      h('span', {}, `${only}: ${active.join(' · ')}`, href ? [' · ', anchor({ href }, {}, all)] : null));
  }

  ipx.lists = { columns, mark, pager, chrome, heading, label, on, isHead, hasAction, onlyLine };
})();
