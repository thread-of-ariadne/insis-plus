// InSIS+ — a reader and renderer for the rare read-only InSIS pages of Campus & people, Account, Messages and Help
// (docs/ia/03-pages.md §3, treatments R and B). Used by pages/person.js, departments.js, rooms.js, account.js,
// help.js and services.js; loaded before them. It adds nothing to kit.js: it is the local part those modules share.
//
// What it does: walks InSIS's content block (#str1) in reading order and returns its parts as blocks (headings,
// data tables, label/value tables, message boxes, InSIS's rows of icon links, link lists, loose sentences, and the
// forms and lists that must stay InSIS's own), then draws the read-only blocks again with InSIS+ components. Links
// are InSIS's own addresses through the URL rule (kit.linkOf), so an action link is never copied. A form with a
// field, a table whose rows hold InSIS's action links, an action link itself and a row of icon links with an action
// (vCard, Export) are "kept": they stay where InSIS put them, inside the slotted original, styled in place
// (rebuild.css), and show where the page puts its <slot> (03-pages §2, moving rule: never dropped).
//
// ipx.rb.chrome(page, { forms })   → InSIS's chrome to hide (breadcrumbs, heading, tab rows, help lines, keys, tips)
// ipx.rb.blocks(root, opts)       → [{ type: 'heading' | 'table' | 'facts' | 'note' | 'links' | 'list' | 'text' | 'keep', … }]
// ipx.rb.render(blocks, opts)     → InSIS+ nodes; a <slot> where the first kept block was
// ipx.rb.table(data, opts)        → a readable table (kit.dataTable) with a filter and "show all" for long lists
// ipx.rb.chips(links)             → a row of labelled link chips (InSIS's icon rows, in words)
// ipx.rb.filter(items, opts)      → a client-side filter field over drawn rows (nothing is sent to InSIS)
// ipx.rb.labelIcons(root)         → InSIS's icon-only links in kept parts get their label as text (CSS, data- only);
//                                   [data-ipx-nolabel] keeps icons that are controls (switches) as they are
// ipx.rb.frame(opts)              → takeover with the anatomy of §2; hides what was redrawn, slots the rest
//                                   (opts.only: the one InSIS form a form page shows; opts.kept: only the kept parts)
// ipx.rb.hasSlot(nodes)           → whether drawn nodes hold a <slot>
// ipx.rb.glyph(name)              → a page-action icon (pencil, external, forward, at; else ui.icon)
// ipx.rb.crumbs(page)             → InSIS's breadcrumb texts (to name the thing a page is about)
// Nothing is stored and nothing is fetched.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.kit || !ipx.nav) return;
  const { lang, clean, norm } = ipx;
  const { h, icon, anchor, takeover, styleSlotted, hideInSlot } = ipx.ui;
  const kit = ipx.kit;
  const nav = ipx.nav;

  const T = {
    cs: { filter: 'Filtrovat seznam…', noMatch: 'Nic tomu neodpovídá.', showAll: (n) => `Zobrazit vše (${n})`,
      count: (n, shown) => (shown < n ? `${shown} z ${n}` : `${n}`), open: 'Otevřít' },
    en: { filter: 'Filter the list…', noMatch: 'Nothing matches.', showAll: (n) => `Show all (${n})`,
      count: (n, shown) => (shown < n ? `${shown} of ${n}` : `${n}`), open: 'Open' },
  }[lang];

  // Page-action icons the shared set (ui.js) does not have, so a page action never borrows a top-bar icon (the
  // envelope is the mail box, the globe the language). Constant markup only, parsed as an SVG document.
  const GLYPHS = {
    pencil: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4z"/><path d="m13.5 6.5 4 4"/>',
    external: '<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>',
    forward: '<path d="m15 5 6 6-6 6"/><path d="M21 11H10a6 6 0 0 0-6 6v2"/>',
    at: '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>',
  };
  function glyph(name) {
    if (!GLYPHS[name]) return icon(name);
    const doc = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${GLYPHS[name]}</svg>`, 'image/svg+xml');
    return h('span', { class: 'icon', 'aria-hidden': 'true' }, document.importNode(doc.documentElement, true));
  }

  const crumbs = (page) => [...(page || document).querySelectorAll('.breadcrumb-item')].map((li) => clean(li.textContent)).filter(Boolean);

  // The label of an icon (InSIS's aria-label on .uf-icon) or of an icon row item (.app-ikona-text).
  const iconLabel = (el) => clean(el.querySelector('.app-ikona-text')?.textContent || el.querySelector('[aria-label]')?.getAttribute('aria-label') || el.getAttribute('title') || '');

  // InSIS's own address through the URL rule; an icon-only link is named by its icon.
  function link(a, fallback) {
    const l = kit.linkOf(a);
    if (!l) return null;
    if (!l.text) l.text = iconLabel(a) || fallback || T.open;
    return l;
  }

  // An InSIS address that does not pass the URL rule (an action, a download, a page InSIS+ never opens).
  const isAction = (a) => {
    const raw = a.getAttribute('href') || '';
    if (!raw || raw.startsWith('#') || /^(javascript|mailto|callto|tel):/i.test(raw)) return false;
    let u;
    try { u = new URL(a.href); } catch { return false; }
    return u.origin === new URL(document.baseURI).origin && !nav.safe(a.href, 'link', { copied: true });
  };

  // ---------- chrome ----------

  // InSIS's chrome: breadcrumbs, heading, every tab row (the header has the views), keys of icons, "Are you also
  // interested in…" tips, Expand/Collapse all, and the help lines (outside forms, unless forms: true).
  function chrome(page, { forms = false, tips = true } = {}) {
    const out = [...page.querySelectorAll('nav[aria-label="breadcrumb"], #titulek, table.portal_menu, .uisLegend, input[id$="_open_all"], input[id$="_close_all"]')];
    if (tips) out.push(...page.querySelectorAll('.uis_msg.tip'));
    for (const s of page.querySelectorAll('div.small, span.small')) {
      if (s.closest('table.portal_menu, .uisLegend, [data-ipx-keep="hide"]')) continue;
      if (!forms && s.closest('form')) continue;
      if (s.tagName === 'SPAN' && s.parentElement?.matches('div.small')) continue;
      out.push(s);
    }
    return out;
  }

  // ---------- reading ----------

  const fieldsOf = (form) => [...form.elements].filter((e) => e.type !== 'hidden' && e.tagName !== 'FIELDSET' && e.tagName !== 'OBJECT');
  const isHeaderRow = (tr) => tr.classList.contains('zahlavi') || tr.closest('thead') || (tr.cells.length > 0 && [...tr.cells].every((c) => c.tagName === 'TH'));
  const ownRows = (t) => [...t.rows].filter((tr) => tr.closest('table') === t);
  const isData = (t) => ownRows(t).some(isHeaderRow) && ownRows(t).length > 1;
  // A label/value table: rows of two cells "Label:" | value, no nested tables in the label column.
  function isFacts(t) {
    const rows = ownRows(t).filter((tr) => clean(tr.textContent));
    if (!rows.length) return false;
    const two = rows.filter((tr) => tr.cells.length === 2 && !tr.cells[0].querySelector('table, form, input, select'));
    return two.length >= Math.max(1, rows.length - 1) && two.every((tr) => clean(tr.cells[0].textContent).length < 70);
  }
  // A heading: a short bold line standing alone (<b>, <big><b>, h2–h4) outside tables and links.
  function isHeading(el) {
    if (!/^(B|BIG|STRONG|H2|H3|H4)$/.test(el.tagName) || el.closest('a, td, li, p')) return false;
    const text = clean(el.textContent);
    return text.length > 0 && text.length < 140;
  }

  // Blocks of a content root in reading order.
  //   opts.skip: nodes to leave out (already hidden); opts.keepTable(t) → true to keep a table InSIS's own.
  function blocks(root, opts = {}) {
    const skip = new Set(opts.skip || []);
    const out = [];
    const push = (b) => out.push(b);
    let text = [];
    const flushText = () => {
      const t = clean(text.join(' '));
      if (t && !/^[\s:.,;–-]*$/.test(t)) push({ type: 'text', text: t });
      text = [];
    };
    const walk = (el) => {
      for (const n of el.childNodes) {
        if (n.nodeType === 3) { if (n.textContent.trim()) text.push(n.textContent); continue; }
        if (n.nodeType !== 1) continue;
        if (skip.has(n) || n.matches('script, style, noscript, input[type="hidden"], nav[aria-label="breadcrumb"], #titulek, table.portal_menu, .uisLegend') ||
            n.getAttribute('data-ipx-keep') === 'hide') continue;
        if (n.tagName === 'BR' || n.tagName === 'HR') { flushText(); continue; }
        if (n.matches('form')) {
          flushText();
          if (fieldsOf(n).length) push({ type: 'keep', el: n, form: true });
          // A form without fields only wraps InSIS's lists (rooms, projects): read through it. It is hidden with
          // what it wraps (InSIS's table manager adds column toggles to it after load) unless it holds a kept part.
          else { const at = out.length; walk(n); flushText(); push({ type: 'wrap', el: n, hide: !out.slice(at).some((b) => b.type === 'keep') }); }
          continue;
        }
        if (n.matches('.uis_msg')) { flushText(); const m = note(n); if (m.text) push({ type: 'note', ...m, el: n }); continue; }
        if (n.matches('.rada-ikon')) { flushText(); push({ type: 'links', el: n, links: [...n.querySelectorAll('a[href]')].map((a) => link(a)).filter(Boolean), actions: [...n.querySelectorAll('a[href]')].some(isAction) }); continue; }
        if (n.matches('div.tree')) { flushText(); push({ type: 'keep', el: n, tree: true }); continue; }
        if (n.matches('table')) {
          flushText();
          if (opts.keepTable?.(n) || (isData(n) && [...n.querySelectorAll('a[href]')].some(isAction))) { push({ type: 'keep', el: n, table: true }); continue; }
          if (isData(n)) { push({ type: 'table', el: n, data: kit.readTable(n) }); continue; }
          if (isFacts(n)) { const pairs = factsOf(n); if (pairs.length) push({ type: 'facts', el: n, pairs }); continue; }
          walk(n); // a layout table: read its cells
          continue;
        }
        if (n.matches('ul, ol') && n.querySelector(':scope > li a[href]')) {
          flushText();
          push({ type: 'list', el: n, items: [...n.querySelectorAll(':scope > li')].map((li) => ({ text: clean(li.textContent), link: li.querySelector('a[href]') && link(li.querySelector('a[href]')) })) });
          continue;
        }
        if (isHeading(n)) { flushText(); push({ type: 'heading', el: n, text: clean(n.textContent).replace(/:$/, '') }); continue; }
        if (n.matches('a[href]')) {
          flushText();
          const l = link(n);
          if (l) push({ type: 'link', el: n, link: l });
          // An action link (a page InSIS+ never opens, a download) is never copied: its table or the link itself
          // stays InSIS's own, in place.
          else if (isAction(n)) push({ type: 'keep', el: n.closest('table') || n, link: true });
          else text.push(n.textContent);
          continue;
        }
        // Inline wrappers are read as text, unless they hold a link (read through, so the link stays a link or,
        // if it is an action, InSIS's own in place).
        if (n.matches('i, em, span, font, label') && !n.querySelector('table, div, ul, form, a[href]')) { text.push(n.textContent); continue; }
        walk(n);
        if (/^(DIV|P|TD|LI|CENTER|BLOCKQUOTE)$/.test(n.tagName)) flushText();
      }
    };
    walk(root);
    flushText();
    // Consecutive loose links become one list.
    const merged = [];
    for (const b of out) {
      const last = merged.at(-1);
      if (b.type === 'link' && last?.type === 'list' && last.loose) last.items.push({ text: b.link.text, link: b.link });
      else if (b.type === 'link') merged.push({ type: 'list', loose: true, items: [{ text: b.link.text, link: b.link }] });
      else merged.push(b);
    }
    return merged;
  }

  // One of InSIS's message boxes (div.uis_msg info / warning / ko / success): tone, text, its links.
  const note = (n) => ({
    tone: n.classList.contains('error') || n.classList.contains('ko') ? 'bad' : n.classList.contains('warning') ? 'warn' : n.classList.contains('success') ? 'ok' : 'info',
    text: kit.cellText(n.querySelector('.text') || n),
    links: [...n.querySelectorAll('a[href]')].map((a) => link(a)).filter(Boolean),
  });

  // Label/value rows; a row of one cell spanning both columns is a sentence InSIS adds (kept as a note line).
  function factsOf(t) {
    return ownRows(t).map((tr) => {
      if (tr.cells.length !== 2) return null;
      const label = kit.cellText(tr.cells[0]).replace(/:\s*$/, '');
      const value = kit.cellText(tr.cells[1]);
      const links = [...tr.cells[1].querySelectorAll('a[href]')].map((a) => link(a)).filter(Boolean);
      return label && (value || links.length) ? { label, value, links } : null;
    }).filter(Boolean);
  }

  // ---------- drawing ----------

  // A cell: its links (InSIS's own, URL rule) or its text; empty cells a dash.
  function cell(c, head) {
    const links = [...c.el.querySelectorAll('a[href]')].map((a) => link(a, head)).filter(Boolean);
    if (links.length === 1) return anchor(links[0], {}, c.text && c.text.length <= 160 ? c.text : links[0].text);
    if (links.length > 1) {
      // A cell of text with several links in it (a publication and its authors): the text, then the links.
      const own = ownText(c.el);
      const list = h('span', { class: 'rb-links' }, links.map((l) => anchor(l, {}, l.text)));
      return own.length > 3 ? h('span', { class: 'rb-cell' }, h('span', {}, own), list) : list;
    }
    // Status icons InSIS puts in a cell without text: their label.
    return c.text || iconLabel(c.el) || '';
  }

  // A two-column table headed "Item · Entry" (or "Name · Entry") is label/value pairs, drawn as facts.
  const isPairs = (d) => d.head.length === 2 && /^(entry|value|hodnota|údaj|udaj|obsah|záznam|zaznam)$/i.test(d.head[1] || '') && d.rows.every((r) => r.cells.length <= 2);
  const pairsOfTable = (d) => d.rows.filter((r) => r.cells.length === 2 && r.cells[1].text && !/^(not entered|nezadáno|nezadano)$/i.test(r.cells[1].text))
    .map((r) => ({ label: r.cells[0].text.replace(/:\s*$/, ''), value: r.cells[1].text, links: [...r.cells[1].el.querySelectorAll('a[href]')].map((a) => link(a)).filter(Boolean) }));

  // A cell's text without its links' text.
  function ownText(el) {
    const copy = el.cloneNode(true);
    copy.querySelectorAll('a, .uf-icon, script').forEach((n) => n.remove());
    return clean(copy.textContent).replace(/^[\s,;:–-]+|[\s,;:–-]+$/g, '');
  }

  // Columns InSIS adds that say nothing: row numbers ("Ord.", "1.") and columns empty in every row.
  function usefulColumns(data) {
    return data.head.map((label, i) => i).filter((i) => {
      const values = data.rows.map((r) => r.cells[i]).filter(Boolean);
      const any = values.some((c) => c.text || c.el.querySelector('a[href], [aria-label]'));
      const numbers = values.length > 0 && values.every((c) => /^\d+\.?$/.test(c.text));
      return any && !(numbers && /^(ord\.?|poř\.?|č\.?|#|)$/i.test(norm(data.head[i] || '')));
    });
  }

  // A readable table from readTable() data. opts: { label, cap (rows before "Show all"), filterAt, main (column
  // index of the row's title), omit: [header regexps], tone(row) → 'ok' | 'bad' | 'warn' }
  function table(data, opts = {}) {
    // InSIS's script adds a row-number cell in front of each row once the page has loaded: rows longer than the
    // header shift their cells back by as many.
    const rows = data.rows.filter((r) => r.cells.length > 1 || clean(r.el.textContent)).map((r) => {
      const extra = Math.max(0, r.cells.length - data.head.length);
      return { ...r, cells: extra && data.head.length ? r.cells.slice(extra) : r.cells };
    });
    // A single cell across the table is InSIS's "No suitable data found."
    if (rows.length === 1 && rows[0].cells.length === 1) return h('div', { class: 'empty' }, h('p', {}, rows[0].cells[0].text));
    const d = { head: data.head, rows };
    const keep = usefulColumns(d).filter((i) => !(opts.omit || []).some((re) => re.test(norm(d.head[i] || ''))));
    const main = opts.main ?? keep[0];
    const columns = keep.map((i) => ({ key: `c${i}`, label: d.head[i] || '', main: i === main }));
    const drawn = rows.map((r) => Object.assign({ _tone: opts.tone?.(r) || null }, ...keep.map((i) => ({ [`c${i}`]: r.cells[i] ? cell(r.cells[i], d.head[i]) : '' }))));
    const card = kit.dataTable({ columns, rows: drawn, label: opts.label, empty: opts.empty });
    if (!card || !rows.length) return card;
    const trs = [...card.querySelectorAll('tbody > tr')];
    const texts = rows.map((r) => norm(clean(r.el.textContent)));
    return longList(card, trs.map((el, i) => ({ el, text: texts[i] })), opts);
  }

  // A long list: the first rows, "Show all", and a filter field above it (client-side only).
  function longList(node, items, { cap = 60, filterAt = 15, placeholder } = {}) {
    if (items.length <= filterAt) return node;
    let all = items.length <= cap;
    const more = h('button', { type: 'button', class: 'btn ghost rb-more' }, T.showAll(items.length));
    const noMatch = h('p', { class: 'muted rb-nomatch', hidden: '' }, T.noMatch);
    const input = h('input', { type: 'search', class: 'rb-filter-input', placeholder: placeholder || T.filter, 'aria-label': placeholder || T.filter, autocomplete: 'off' });
    const apply = () => {
      const q = norm(input.value.trim());
      let shown = 0;
      for (const it of items) {
        const hit = !q || it.text.includes(q);
        const visible = hit && (all || q || shown < cap);
        it.el.hidden = !visible;
        if (visible) shown++;
      }
      noMatch.hidden = shown > 0;
      more.hidden = all || !!q;
    };
    input.addEventListener('input', apply);
    more.addEventListener('click', () => { all = true; apply(); });
    apply();
    return h('div', { class: 'rb-long' }, h('label', { class: 'rb-filter' }, icon('search'), input), node, noMatch, more);
  }

  const filter = (items, opts) => (node) => longList(node, items, opts);

  // InSIS's row of icon links, in words.
  const chips = (links) => (links?.length ? h('div', { class: 'rb-chips' }, links.map((l) => anchor(l, { class: 'rb-chip' }, l.text, icon('arrow')))) : null);

  // InSIS's message box as an InSIS+ note: its text with InSIS's own links in place (URL rule), the rest as text.
  function noteNode(b) {
    const n = kit.note(b);
    if (!b.el || !b.links?.length) return n;
    const span = n.lastElementChild;
    span.textContent = '';
    const flat = (node) => [...node.childNodes].flatMap((c) => {
      if (c.nodeType === 3) return [c.textContent];
      if (c.nodeType !== 1 || c.matches('.uf-icon, script, style')) return [];
      if (c.matches('a[href]')) { const l = link(c); return [l ? anchor(l, { class: 'rb-note-link' }, clean(c.textContent) || l.text) : c.textContent]; }
      return flat(c);
    });
    const parts = flat(b.el.querySelector('.text') || b.el);
    parts.forEach((p, i) => span.append(typeof p === 'string' ? p.replace(/\s+/g, ' ').replace(i === 0 ? /^\s+/ : /$^/, '') : p));
    return n;
  }

  const title = (text, level = 2) => h(`h${level}`, { class: 'rb-title' }, text);

  // Blocks → nodes. Headings start a new group; facts become a card; tables readable tables; kept blocks show
  // through one <slot> at the first kept block's place. opts.table: options for every table; opts.only: block types.
  function render(list, opts = {}) {
    const out = [];
    let slotted = false;
    for (const b of list) {
      if (opts.only && !opts.only.includes(b.type)) continue;
      if (b.type === 'heading') out.push(title(b.text));
      else if (b.type === 'facts') out.push(h('section', { class: 'card pad rb-facts' }, kit.facts(b.pairs.map((p) => ({ label: p.label, value: p.value, links: p.links })))));
      else if (b.type === 'table' && isPairs(b.data)) out.push(h('section', { class: 'card pad rb-facts' }, kit.facts(pairsOfTable(b.data))));
      else if (b.type === 'table') out.push(opts.tableNode?.(b) || table(b.data, { ...(opts.table || {}), label: out.findLast?.((n) => n.classList?.contains('rb-title'))?.textContent }));
      else if (b.type === 'note') out.push(noteNode(b));
      else if (b.type === 'links') {
        // A row with InSIS's action links (an export, a vCard, "add to contacts") stays InSIS's own, in place.
        if (!b.actions) out.push(chips(b.links));
        else { b.el.setAttribute('data-ipx-rb', 'keep'); if (!slotted) { out.push(h('slot')); slotted = true; } }
      }
      else if (b.type === 'list') out.push(h('section', { class: 'card rb-list' }, b.items.map((it) => (it.link ? anchor(it.link, { class: 'rb-row' }, h('span', {}, it.text || it.link.text), icon('arrow')) : h('span', { class: 'rb-row' }, it.text)))));
      else if (b.type === 'text') out.push(h('p', { class: 'rb-text' }, b.text));
      else if (b.type === 'keep') {
        b.el.setAttribute('data-ipx-rb', 'keep');
        if (!slotted) { out.push(opts.keepCard ? opts.keepCard(h('slot')) : h('slot')); slotted = true; }
      }
    }
    return out.filter(Boolean);
  }

  // Nodes the page redrew (every block that is not kept) are hidden in the slotted original, with the chrome.
  const redrawn = (list) => list.filter((b) => b.el && b.type !== 'keep' && !(b.type === 'links' && b.actions) && (b.type !== 'wrap' || b.hide)).map((b) => b.el);

  // InSIS's icon-only links and icons inside kept parts: the label as text instead of the picture (CSS reads
  // data-ipx-label; nothing else changes).
  function labelIcons(root) {
    const links = [...root.querySelectorAll('a[href]')];
    for (const a of links) {
      if (clean(a.textContent) || a.closest('.rada-ikon, [data-ipx-nolabel]')) continue;
      // An icon link next to a text link to the same address (InSIS draws both): the icon's row goes.
      const twin = links.find((b) => b !== a && b.getAttribute('href') === a.getAttribute('href') && clean(b.textContent));
      if (twin) {
        const tr = a.closest('tr');
        (tr && !clean(tr.textContent) ? tr : a).setAttribute('data-ipx-keep', 'hide');
        document.documentElement.classList.add('ipx-keep');
        continue;
      }
      const label = iconLabel(a);
      if (label) a.setAttribute('data-ipx-label', label);
    }
    for (const s of root.querySelectorAll('.uf-icon[aria-label]')) {
      if (s.closest('a[data-ipx-label], [data-ipx-nolabel]')) continue;
      const label = s.getAttribute('aria-label');
      if (label && !clean(s.parentElement?.textContent)) s.setAttribute('data-ipx-label', label);
    }
    for (const r of root.querySelectorAll('.rada-ikon')) r.setAttribute('data-ipx-row', '');
  }

  // Only the kept parts of InSIS's content show in the slot: their ancestors' own text shrinks away and every
  // sibling on the way up is hidden (keepOnly for several nodes, without the card look). Loose sentences InSIS
  // writes between blocks are drawn again by render(), so they must not show twice.
  function keepOnlyKept(page, nodes) {
    const keep = nodes.filter((n) => page.contains(n) && !nodes.some((o) => o !== n && o.contains(n)));
    if (!keep.length) return;
    const path = new Set([page]);
    for (const n of keep) for (let p = n.parentElement; p && p !== page; p = p.parentElement) path.add(p);
    for (const p of path) {
      p.setAttribute('data-ipx-keep', 'path');
      for (const c of p.children) if (!path.has(c) && !keep.includes(c)) c.setAttribute('data-ipx-keep', 'hide');
    }
    keep.forEach((n) => n.setAttribute('data-ipx-keep', 'kept'));
    document.documentElement.classList.add('ipx-keep');
  }

  // Whether drawn nodes hold a <slot> (InSIS's kept parts show there).
  const hasSlot = (nodes) => [].concat(nodes).flat(Infinity).some((n) => n instanceof Node && (n.matches?.('slot') || n.querySelector?.('slot')));

  // A page drawn by a module of this family. opts: { key, css, title, subtitle, actions, tabs, build, page, hide,
  // slot: true to show the rest of InSIS's content (its forms and kept lists) where build() put its <slot>,
  // kept: true to show only the parts render() kept (call render() before frame()) }.
  function frame({ key, css, title: heading, subtitle, actions, tabs, build, page, hide = [], slot = false, cls, only, kept = false }) {
    page = page || document.getElementById('str1');
    // A page whose action is one InSIS form: only that form shows in the slot (keepOnly also shrinks InSIS's loose
    // text around it), without the card look keepOnly gives it (the page's own form card is the card).
    if (only && page.contains(only)) { slot = true; ipx.ui.keepOnly(page, only); only.setAttribute('data-ipx-rb-only', ''); }
    if (slot) {
      hideInSlot([...chrome(page), ...hide].filter(Boolean));
      if (kept && !only) keepOnlyKept(page, [...page.querySelectorAll('[data-ipx-rb="keep"]')]);
      labelIcons(page);
      document.documentElement.classList.add('ipx-rb');
      if (cls) document.documentElement.classList.add(cls);
      for (const f of ['pages/rebuild.css', ...[].concat(css || [])]) styleSlotted(f);
    }
    return takeover({
      key, css: ['kit.css', 'pages/rebuild.css', ...[].concat(css || [])], title: heading, subtitle, extra: actions,
      slotted: slot ? [page] : null,
      build: () => h('div', { class: 'kit-page rb-page' }, tabs || null, build()),
    });
  }

  // A disclosure that shows or hides parts of InSIS's own form (a filter): it only toggles a data- attribute on
  // InSIS's elements (CSS hides them); the controls stay in the form with the values InSIS gave them.
  function disclosure(label, summary, targets, open = false) {
    const set = (on) => targets.forEach((t) => t && t.setAttribute('data-ipx-collapsed', on ? 'false' : 'true'));
    const btn = h('button', { type: 'button', class: 'rb-disclosure', 'aria-expanded': String(open) },
      icon('chevron'), h('span', {}, h('strong', {}, label), summary && h('small', {}, summary)));
    btn.addEventListener('click', () => { const on = btn.getAttribute('aria-expanded') !== 'true'; btn.setAttribute('aria-expanded', String(on)); set(on); });
    set(open);
    return btn;
  }

  ipx.rb = { T, glyph, hasSlot, keepOnlyKept, disclosure, noteNode, crumbs, link, isAction, iconLabel, chrome, blocks, factsOf, render, redrawn, table, longList, filter, chips, title, labelIcons, frame };
})();
