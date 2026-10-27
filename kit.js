// InSIS+ — the page kit: what every rebuilt InSIS page uses (docs/ia/03-pages.md §2–3).
// Reading InSIS's markup (tables, key–value tables, tab rows, the page's form) and drawing it again with InSIS+
// components. Links keep InSIS's own addresses and pass the URL rule (nav.js); anything else becomes text.
// InSIS's forms are never copied or submitted: formCard() shows the form element itself (slotted) inside a card.
//
// ipx.kit.portalLink(path, add)  → the student's own link to an InSIS page (from the portal), through the URL rule
// ipx.kit.prev(el)                → the element before el, past InSIS's table-manager insertions
// ipx.kit.plural(n, one, few, many)  → the Czech plural form for n (0 and 5+ take "many")
// ipx.kit.readTable(table)        → { head: [text], rows: [{ cells: [{ text, links, el }], el }] }
// ipx.kit.findTables(root)        → InSIS data tables (with a header row) in reading order
// ipx.kit.keyValues(root)         → [{ label, value, links }] from two-column label/value tables
// ipx.kit.messages(root)         → [{ tone, text }] of InSIS's message boxes
// ipx.kit.looseText(root)        → InSIS's plain text outside tables/forms (its "nothing here" sentence)
// ipx.kit.dateOf(text)           → Date from "d. m. yyyy" or "dd/mm/yyyy" [hh:mm]
// ipx.kit.insisTabs(root)         → [{ href, text, on, count }] of the page's own tab row (portal bar excluded)
// ipx.kit.dataTable({ columns, rows, empty, label })  → a readable table; cards below 640 px
// ipx.kit.facts(pairs)            → <dl> of label / value
// ipx.kit.formCard(page, form, { title, lead })  → a card whose body is InSIS's own form (slotted)
// ipx.kit.page({ key, css, title, subtitle, actions, tabs, build, form })  → takeover with the anatomy of §2
// ipx.kit.section(def) / sectionFor(url) / sectionTabs(section, view)  → one header for every page of a section
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.ui || !ipx.nav) return;
  const { clean } = ipx;
  const { h, anchor, takeover, keepOnly, styleSlotted, viewTabs } = ipx.ui;
  const nav = ipx.nav;

  // ---------- reading ----------

  // A link InSIS+ may show: InSIS's own address through the URL rule, mailto, or an allowed external link.
  function linkOf(a) {
    const raw = a.getAttribute('href') || '';
    if (!raw || /^javascript:/i.test(raw) || raw.startsWith('#')) return null;
    if (/^mailto:/i.test(raw)) return { href: raw, text: clean(a.textContent) };
    const href = nav.safe(a.href, 'link', { copied: true });
    return href ? { href, text: clean(a.textContent) || clean(a.title), target: a.target === '_blank' ? '_blank' : null } : null;
  }

  // Text of a cell without InSIS's decoration (icon images, hidden helper spans).
  const cellText = (el) => clean([...el.childNodes].map((n) => (n.nodeType === 3 ? n.textContent
    : n.nodeName === 'IMG' || n.hidden || n.getAttribute?.('aria-hidden') === 'true' ? '' : n.innerText ?? n.textContent)).join(' '));

  // A header row: InSIS's tr.zahlavi, a thead row, or a row of only th cells or only td.zahlavi cells (ca/ucet.pl).
  const isHeaderRow = (tr) => tr.classList.contains('zahlavi') || tr.closest('thead') ||
    (tr.cells.length && [...tr.cells].every((c) => c.tagName === 'TH' || c.classList.contains('zahlavi')));

  function readTable(table) {
    const rows = [...table.rows].filter((tr) => tr.closest('table') === table);
    const headRow = rows.find(isHeaderRow);
    const head = headRow ? [...headRow.cells].map((c) => cellText(c)) : [];
    const body = rows.filter((tr) => tr !== headRow && !isHeaderRow(tr) && tr.cells.length);
    return {
      head,
      rows: body.map((tr) => ({
        el: tr,
        cells: [...tr.cells].map((c) => ({ el: c, text: cellText(c), links: [...c.querySelectorAll('a[href]')].map(linkOf).filter(Boolean) })),
      })),
    };
  }

  // Data tables: a header row and at least one row; layout tables (InSIS nests them) are skipped.
  function findTables(root) {
    return [...root.querySelectorAll('table')].filter((t) => !t.classList.contains('portal_menu') &&
      [...t.rows].some((tr) => tr.closest('table') === t && isHeaderRow(tr)) && t.rows.length > 1);
  }

  // InSIS shows facts as two-cell rows: "Label:" | value.
  function keyValues(root) {
    const out = [];
    for (const tr of root.querySelectorAll('tr')) {
      const cells = [...tr.children].filter((c) => /^T[DH]$/.test(c.tagName));
      if (cells.length !== 2 || tr.querySelector('table')) continue;
      const label = cellText(cells[0]).replace(/:$/, '');
      const value = cellText(cells[1]);
      if (label && value && label.length < 140) out.push({ label, value, links: [...cells[1].querySelectorAll('a[href]')].map(linkOf).filter(Boolean) });
    }
    return out;
  }

  // The page's own tab row (table.portal_menu), not InSIS's portal bar (which links the Student's portal).
  function insisTabs(root) {
    const rows = [...root.querySelectorAll('table.portal_menu')].filter((t) => !t.querySelector('a[href*="moje_studium.pl"]'));
    return rows.map((t) => [...t.querySelectorAll('a[href]')].map((a) => {
      const l = linkOf(a);
      if (!l) return null;
      const m = l.text.match(/^(.*?)\s*\((\d+)\)$/);
      return { href: l.href, text: m ? m[1] : l.text, count: m ? Number(m[2]) : null, on: !!a.closest('b, strong, .aktivni, .active') };
    }).filter(Boolean)).filter((r) => r.length);
  }

  // InSIS's message boxes (div.uis_msg info / warning / error / success) → [{ tone, text }].
  function messages(root) {
    return [...root.querySelectorAll('.uis_msg')].map((m) => ({
      tone: m.classList.contains('error') || m.classList.contains('ko') ? 'bad' : m.classList.contains('warning') ? 'warn' : m.classList.contains('success') ? 'ok' : 'info',
      text: cellText(m.querySelector('.text') || m),
    })).filter((m) => m.text);
  }

  // The page's plain text after InSIS's chrome (breadcrumbs, intro line, message boxes, tables, forms) is removed:
  // what InSIS says when there is nothing to show ("You have no library borrowings.").
  function looseText(root) {
    const copy = root.cloneNode(true);
    copy.querySelectorAll('nav, .breadcrumb, .small, .uis_msg, table, form, script, style').forEach((n) => n.remove());
    return clean(copy.textContent);
  }

  // A dated cell → Date, else null. InSIS writes "12. 11. 2026" (Czech) and "12/11/2026" (English, day first),
  // either with an optional "hh:mm".
  function dateOf(text) {
    const m = /(\d{1,2})(?:\.\s*|\/)(\d{1,2})(?:\.\s*|\/)(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/.exec(text || '');
    return m ? new Date(+m[3], +m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0)) : null;
  }

  // A link to one of the student's own InSIS pages, as the Student's portal gave it (it carries the study and the
  // period), with optional parameters added, through the URL rule.
  function portalLink(path, add) {
    const base = ipx.state.portal?.paths?.[path]?.href;
    if (!base) return null;
    const extra = Object.entries(add || {}).map(([k, v]) => `${k}=${v}`).join(';');
    return nav.safe(extra ? `${base}${base.includes('?') ? ';' : '?'}${extra}` : base, 'link', { copied: true });
  }

  // VŠE faculties by InSIS's logo file name (img/loga/vse/fis.png) and by the leading digits of a unit code.
  const FACULTY_BY_LOGO = { ffu: 'FFU', fmv: 'FMV', fph: 'FPH', fis: 'FIS', fnh: 'NF', fmh: 'FM' };
  const FACULTY_BY_CODE = { 10: 'FFU', 20: 'FMV', 30: 'FPH', 40: 'FIS', 50: 'NF', 60: 'FM' };

  // The element before `el`, past what InSIS's table manager inserts in front of a sortable table on the live page
  // (its toolbox, the "Display:" column toggles and their scripts). Headings found by walking back from a table
  // ("Extra-semestral courses that you can enrol in the future") are then as far away as in the page's markup.
  const INJECTED = (n) => /^(SCRIPT|STYLE|NOSCRIPT)$/.test(n.tagName) || (n.tagName === 'DIV' && n.matches('.jstm-toolbox, .clm_main'));
  function prev(el) {
    let n = el?.previousElementSibling || null;
    while (n && INJECTED(n)) n = n.previousElementSibling;
    return n;
  }

  // Czech plural forms: 1 → one, 2–4 → few, everything else (0, 5+) → many. ("1 složka, 3 složky, 0 / 5 složek")
  const plural = (n, one, few, many) => (n === 1 ? one : n >= 2 && n <= 4 ? few : many);

  // ---------- drawing ----------

  const cellNode = (v) => {
    if (v == null || v === '') return h('span', { class: 'faint' }, '—');
    if (v instanceof Node || Array.isArray(v)) return v;
    if (typeof v === 'object' && v.href) return anchor(v, {}, v.text);
    return String(v);
  };

  // columns: [{ key, label, align: 'end' | null, main: true (the row's title on phones) }]
  // rows: [{ [key]: text | node | { href, text }, _tone: 'ok' | 'bad' | 'warn' | null }]
  function dataTable({ columns, rows, empty, label }) {
    if (!rows.length) return empty ? h('div', { class: 'empty' }, h('p', {}, empty)) : null;
    return h('div', { class: 'card dtable-wrap' },
      h('table', { class: 'dtable', 'aria-label': label || null },
        h('thead', {}, h('tr', {}, columns.map((c) => h('th', { scope: 'col', class: c.align === 'end' ? 'end' : null }, c.label)))),
        h('tbody', {}, rows.map((r) => h('tr', { class: r._tone ? `tone-${r._tone}` : null },
          columns.map((c) => h('td', { class: [c.align === 'end' && 'end', c.main && 'dt-main'].filter(Boolean).join(' ') || null, 'data-label': c.label },
            cellNode(r[c.key]))))))));
  }

  const facts = (pairs) => h('dl', { class: 'facts' }, pairs.filter((p) => p && p.value != null && p.value !== '').map((p) =>
    [h('dt', {}, p.label), h('dd', {}, cellNode(p.links?.length === 1 && p.links[0].text === p.value ? p.links[0] : p.value))]));

  // InSIS's own form, shown inside an InSIS+ card: the rest of InSIS's page is hidden, the form element stays in
  // the page (slotted), so InSIS's own scripts and its submit button work as on InSIS. Nothing is filled or sent.
  function formCard(page, form, { title, lead } = {}) {
    keepOnly(page, form);
    return h('section', { class: 'card pad form-card' },
      title && h('h2', { class: 'card-title' }, title),
      lead && h('p', { class: 'muted form-lead' }, lead),
      h('slot'));
  }

  // ---------- sections with views: one header on every page of the section ----------
  // A section whose views live on several InSIS pages (Payments: fees, scholarships, bank accounts) must show the
  // same title, view tabs and page actions on each of them, whether InSIS+ redraws the page or only frames InSIS's
  // content (generic.js). Otherwise the header jumps as the student moves between the tabs. Modules register their
  // section at load time; generic.js and the modules draw the header from here.
  //   section({ id, title: () => text, subtitle: () => text, pages: { '/auth/…': view | null | (route) => view },
  //             views: () => [{ id, text, href, count? }], actions: (view) => [nodes],
  //             head: () => node (above the view tabs, as a course page has its code, status and facts there),
//             lead: () => node (a path or note above the content), node: () => node id (where the sidebar marks the page),
  //             css: extra stylesheets for the header parts, keepRow: (table) => true to keep one of InSIS's tab rows })
  // A page function returning undefined declines the page, so another section can claim it.
  // A page mapped to null belongs to the section but is none of its views (a step below it): no tab is marked.
  const sections = [];
  function section(def) { sections.push(def); return def; }
  function sectionFor(url = document.baseURI.split('#')[0]) {
    const r = nav.route(url);
    for (const s of sections) {
      if (!r.path || !(r.path in s.pages)) continue;
      const v = s.pages[r.path];
      const view = typeof v === 'function' ? v(r) : v;
      // A page function returning undefined declines the page (another section claims it).
      if (view === undefined) continue;
      return { section: s, view, route: r };
    }
    return null;
  }
  // The current view always has a tab: when its link is not known yet (nothing read from the portal so far), this
  // page's own address stands in, so the header never loses a tab on the page the student is on.
  const sectionTabs = (s, view) => {
    const here = nav.safe(document.baseURI.split('#')[0], 'link', { copied: true });
    return viewTabs((s.views() || []).filter(Boolean)
      .map((v) => ({ ...v, href: v.href || (v.id === view ? here : null), on: v.id === view }))
      .filter((v) => v.href), s.title());
  };

  // A rebuilt InSIS page with the anatomy of 03-pages.md §2. `form` (optional): InSIS's form element that holds the
  // page's action; build() places it with formCard(). Without a form the original content is not slotted at all.
  function page({ key, css, title, subtitle, actions, tabs, build, form }) {
    const original = document.getElementById('str1');
    const slotted = form && original?.contains(form) ? [original] : null;
    // The form keeps InSIS's markup: the shared form styles (generic.css) apply to it.
    if (slotted) styleSlotted();
    return takeover({
      key, css: ['kit.css', ...[].concat(css || [])], title, subtitle, extra: actions, slotted,
      build: () => h('div', { class: 'kit-page' }, tabs && (tabs instanceof Node ? tabs : viewTabs(tabs, title)), build({ formCard: (opts) => formCard(original, form, opts) })),
    });
  }

    const note = ({ tone, text }) => h('p', { class: `kit-note ${tone}` }, ipx.ui.icon(tone === 'bad' || tone === 'warn' ? 'alert' : 'info'), h('span', {}, text));

  ipx.kit = { prev, section, sectionFor, sectionTabs, plural, portalLink, FACULTY_BY_LOGO, FACULTY_BY_CODE, readTable, findTables, keyValues, insisTabs, messages, looseText, dateOf, linkOf, cellText, dataTable, facts, note, formCard, page };
})();
