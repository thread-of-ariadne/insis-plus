// InSIS+ — the page kit: what every rebuilt InSIS page uses (docs/ia/03-pages.md §2–3).
// Reading InSIS's markup (tables, key–value tables, tab rows, the page's form) and drawing it again with InSIS+
// components. Links keep InSIS's own addresses and pass the URL rule (nav.js); anything else becomes text.
// InSIS's forms are never copied or submitted: formCard() shows the form element itself (slotted) inside a card.
//
// ipx.kit.readTable(table)        → { head: [text], rows: [{ cells: [{ text, links, el }], el }] }
// ipx.kit.findTables(root)        → InSIS data tables (with a header row) in reading order
// ipx.kit.keyValues(root)         → [{ label, value, links }] from two-column label/value tables
// ipx.kit.messages(root)         → [{ tone, text }] of InSIS's message boxes
// ipx.kit.looseText(root)        → InSIS's plain text outside tables/forms (its "nothing here" sentence)
// ipx.kit.dateOf(text)           → Date from "d. m. yyyy [hh:mm]"
// ipx.kit.insisTabs(root)         → [{ href, text, on, count }] of the page's own tab row (portal bar excluded)
// ipx.kit.dataTable({ columns, rows, empty, label })  → a readable table; cards below 640 px
// ipx.kit.facts(pairs)            → <dl> of label / value
// ipx.kit.formCard(page, form, { title, lead })  → a card whose body is InSIS's own form (slotted)
// ipx.kit.page({ key, css, title, subtitle, actions, tabs, build, form })  → takeover with the anatomy of §2
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

  const isHeaderRow = (tr) => tr.classList.contains('zahlavi') || tr.closest('thead') || (tr.cells.length && [...tr.cells].every((c) => c.tagName === 'TH'));

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
      if (label && value && label.length < 60) out.push({ label, value, links: [...cells[1].querySelectorAll('a[href]')].map(linkOf).filter(Boolean) });
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
      tone: m.classList.contains('error') ? 'bad' : m.classList.contains('warning') ? 'warn' : m.classList.contains('success') ? 'ok' : 'info',
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

  // A dated cell ("12. 11. 2026", "12.11.2026 14:00") → Date, else null.
  function dateOf(text) {
    const m = /(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/.exec(text || '');
    return m ? new Date(+m[3], +m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0)) : null;
  }

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
          columns.map((c) => h('td', { class: [c.align === 'end' && 'end', c.main && 'main'].filter(Boolean).join(' ') || null, 'data-label': c.label },
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

  // A rebuilt InSIS page with the anatomy of 03-pages.md §2. `form` (optional): InSIS's form element that holds the
  // page's action; build() places it with formCard(). Without a form the original content is not slotted at all.
  function page({ key, css, title, subtitle, actions, tabs, build, form }) {
    const original = document.getElementById('str1');
    const slotted = form && original?.contains(form) ? [original] : null;
    // The form keeps InSIS's markup: the shared form styles (generic.css) apply to it.
    if (slotted) styleSlotted();
    return takeover({
      key, css: ['kit.css', ...[].concat(css || [])], title, subtitle, extra: actions, slotted,
      build: () => h('div', { class: 'kit-page' }, tabs && viewTabs(tabs, title), build({ formCard: (opts) => formCard(original, form, opts) })),
    });
  }

    const note = ({ tone, text }) => h('p', { class: `kit-note ${tone}` }, ipx.ui.icon(tone === 'bad' || tone === 'warn' ? 'alert' : 'info'), h('span', {}, text));

  ipx.kit = { readTable, findTables, keyValues, insisTabs, messages, looseText, dateOf, linkOf, cellText, dataTable, facts, note, formCard, page };
})();
