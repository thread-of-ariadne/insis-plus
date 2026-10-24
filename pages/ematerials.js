// InSIS+ — Courses › Materials › e-Library: the folder list of the public e-library (eknihovna/ and
// eknihovna/strom_slozek.pl). Treatment R (docs/ia/03-pages.md, teardowns/courses.md §2.3).
// InSIS shows a tab row (Tree of folders · Contents of folder · Searching), a help paragraph and the folders as a
// layout table (table.strom: tree-line images, then "<a>Folder</a> (N objects)"). Nothing on the page is an action.
// Here: the title in the student's words ("e-Library", eyebrow Materials), two view tabs (Folders · Search: the
// "Contents of folder" tab is a level reached by opening a folder, not a view), a one-line summary and the folders
// as rows; each row is InSIS's own folder address (through the URL rule) and opens InSIS's folder page.
// A folder's contents (slozky_objekty.pl), titled by the folder (eyebrow e-Library): its subfolders and items as rows, InSIS's Limit / Arrange form slotted
// behind a disclosure. An item, titled by its name (eyebrow e-Library): its facts drawn again, its operations (they open pages InSIS+ never opens) left as
// InSIS's own links in place. Search: InSIS's form in a form card. These three use pages/rebuild.js.
// Nothing is stored.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.kit || !ipx.nav) return;
  const { lang, clean, norm } = ipx;
  const { h, icon, anchor, emptyState } = ipx.ui;
  const kit = ipx.kit;
  const nav = ipx.nav;

  const T = {
    cs: { title: 'E-knihovna', folders: 'Složky', search: 'Hledat',
      summary: (f, o) => `${f} ${ipx.kit.plural(f, 'složka', 'složky', 'složek')} · ${o} ${ipx.kit.plural(o, 'studijní materiál', 'studijní materiály', 'studijních materiálů')}`,
      objects: (n) => `${n} ${ipx.kit.plural(n, 'materiál', 'materiály', 'materiálů')}`,
      lead: 'Veřejné studijní materiály, které zveřejňují katedry. Složka se otevře v InSIS.',
      filter: 'Hledat složku…', noMatch: 'Žádná složka neodpovídá.', none: 'E-knihovna teď nemá žádné složky.',
      searchLead: 'Napište hledaný text; InSIS hledá v e-knihovně, až stisknete Hledat.', itemLead: 'Materiál se otevře v InSIS.',
      arrange: 'Omezit a seřadit', arrangeSub: 'Filtr InSIS: druh materiálu, pořadí' },
    en: { title: 'e-Library', folders: 'Folders', search: 'Search',
      summary: (f, o) => `${f} ${f === 1 ? 'folder' : 'folders'} · ${o} study ${o === 1 ? 'material' : 'materials'}`,
      objects: (n) => `${n} ${n === 1 ? 'material' : 'materials'}`,
      lead: 'Public study materials published by departments. A folder opens in InSIS.',
      filter: 'Find a folder…', noMatch: 'No folder matches.', none: 'The e-library has no folders right now.',
      searchLead: 'Type what you are looking for; InSIS searches the e-library when you press Search.', itemLead: 'The material opens in InSIS.',
      arrange: 'Limit and arrange', arrangeSub: 'InSIS’s filter: kind of material, order' },
  }[lang];

  const PATHS = new Set(['/auth/eknihovna/', '/auth/eknihovna/strom_slozek.pl']);

  // One header for every e-Library page (kit.section): Folders and Search are the views; a folder's contents and an
  // item are pages below them (drawn by generic.js around InSIS's content). The view links are InSIS's own tab links
  // of the page at hand (every e-Library page carries the same row; they hold the library's folder id).
  const library = kit.section({
    id: 'elibrary',
    title: () => T.title,
    subtitle: () => nav.sectionLabel('courses.files'),
    pages: { '/auth/eknihovna/': 'folders', '/auth/eknihovna/strom_slozek.pl': 'folders', '/auth/eknihovna/slozky_objekty.pl': null,
      '/auth/eknihovna/vyhledavani.pl': 'search' },
    views: () => {
      const row = kit.insisTabs(document.getElementById('str1') || document)[0] || [];
      const pick = (re) => row.find((x) => re.test(x.href))?.href || null;
      return [
        { id: 'folders', href: pick(/strom_slozek\.pl/) || nav.safe(new URL('/auth/eknihovna/', document.baseURI).href, 'link'), text: T.folders },
        { id: 'search', href: pick(/vyhledavani\.pl/), text: T.search },
      ];
    },
  });

  // The folder rows of table.strom. Leading cells hold the tree lines, so their number is the folder's depth.
  function folders(page) {
    const out = [];
    for (const table of page.querySelectorAll('table.strom')) {
      for (const tr of table.rows) {
        const a = tr.querySelector('a[href*="slozky_objekty.pl"], a[href*="strom_slozek.pl"]');
        if (!a) continue; // the root row (only a tree image)
        const cell = a.closest('td');
        const link = kit.linkOf(a);
        const count = /\((\d+)[^)]*\)/.exec(clean(cell.textContent.replace(clean(a.textContent), '')))?.[1];
        out.push({
          name: clean(a.textContent),
          href: link?.href || null,
          objects: count == null ? null : Number(count),
          depth: Math.max(0, [...tr.cells].indexOf(cell) - 1),
        });
      }
    }
    return out;
  }

  // InSIS's tab row → the two views; "Contents of folder" is left out (a level, not a view).
  function folderRow(f) {
    const inner = [
      h('span', { class: 'el-ico' }, icon('folder')),
      h('span', { class: 'el-text' }, h('strong', {}, f.name), f.objects != null && h('small', {}, T.objects(f.objects))),
      f.href && h('span', { class: 'el-go' }, icon('arrow')),
    ];
    const props = { class: 'el-row' + (f.objects === 0 ? ' is-empty' : ''), style: `--depth: ${f.depth}` };
    return f.href ? anchor({ href: f.href }, props, ...inner) : h('span', props, ...inner);
  }

  // ---------- a folder's contents, an item, the search (pages/rebuild.js frames them) ----------

  // InSIS draws a folder's contents as a grid of layout cells: an icon link, then "<a>Name</a> 0 folders / 3 objects".
  function contentRows(page) {
    const out = [];
    for (const td of page.querySelectorAll('table td')) {
      if (td.closest('form, table.portal_menu') || td.querySelector('table')) continue;
      const a = [...td.querySelectorAll('a[href]')].find((x) => clean(x.textContent));
      if (!a) continue;
      const l = kit.linkOf(a);
      if (!l) continue;
      const meta = clean(td.textContent.replace(a.textContent, ''));
      const isFolder = !/[?;&]zobrazit=/.test(a.getAttribute('href'));
      out.push({ l, meta, isFolder });
    }
    return out;
  }

  function drawOther(path, page) {
    const rb = ipx.rb;
    if (!rb) return; // pages/rebuild.js missing: generic.js frames the page with the section's header
    const r = nav.route(document.baseURI.split('#')[0]);
    const view = path.endsWith('vyhledavani.pl') ? 'search' : null;
    const head = { key: 'ematerials', css: 'pages/ematerials.css', title: T.title, subtitle: nav.sectionLabel('courses.files'), tabs: kit.sectionTabs(library, view) };
    const crumb = rb.crumbs(page).at(-1);
    if (path.endsWith('vyhledavani.pl')) {
      const form = page.querySelector('form');
      if (!form) return;
      rb.frame({ ...head, only: form, hide: rb.chrome(page, { forms: true }),
        build: () => [h('section', { class: 'card pad rb-form' }, h('p', { class: 'muted form-lead' }, T.searchLead), h('slot'))] });
      return;
    }
    if (r.params?.has('zobrazit')) {
      // An item: InSIS's facts drawn again; its operations ("View study document") open pages InSIS+ never opens, so
      // they stay InSIS's own links, in place.
      const list = rb.blocks(page, { skip: rb.chrome(page) });
      // Rule 7: the title is the item, the eyebrow the e-Library.
      const name = list.find((b) => b.type === 'facts')?.pairs[0]?.value;
      rb.frame({ ...head, title: name || crumb || T.title, subtitle: T.title, slot: list.some((b) => b.type === 'keep'), kept: true, hide: rb.redrawn(list),
        build: () => [...rb.render(list, { keepCard: (slot) => h('section', { class: 'card pad rb-form' }, h('p', { class: 'muted form-lead' }, T.itemLead), slot) })] });
      return;
    }
    // A folder: its subfolders and items as rows; InSIS's Limit / Arrange form behind a disclosure.
    const rows = contentRows(page);
    const form = page.querySelector('form');
    const grid = [...page.querySelectorAll('table')].filter((t) => !t.closest('form, table.portal_menu') && !t.closest('table table'));
    const items = rows.map((x) => ({ el: anchor(x.l, { class: 'el-row' }, h('span', { class: 'el-ico' }, icon(x.isFolder ? 'folder' : 'file')),
      h('span', { class: 'el-text' }, h('strong', {}, x.l.text), x.meta && h('small', {}, x.meta)), h('span', { class: 'el-go' }, icon('arrow'))), text: norm(x.l.text) }));
    const box = form?.querySelector('table');
    // Rule 7: the title is the folder (InSIS's breadcrumb names it), the eyebrow the e-Library.
    rb.frame({ ...head, title: crumb || T.title, subtitle: T.title, slot: !!form, hide: grid,
      build: () => [
        form && h('div', { class: 'el-tools' }, box && rb.disclosure(T.arrange, T.arrangeSub, [box, ...form.querySelectorAll('input[type="submit"]')]), h('slot')),
        items.length ? rb.longList(h('section', { class: 'card el-list' }, items.map((i) => i.el)), items, { cap: 200, filterAt: 12, placeholder: T.filter })
          : emptyState(kit.looseText(page) || T.none),
      ] });
  }

  ipx.ready.then(() => {
    const path = nav.route(document.baseURI.split('#')[0]).path;
    if (path === '/auth/eknihovna/slozky_objekty.pl' || path === '/auth/eknihovna/vyhledavani.pl') {
      const page = document.getElementById('str1');
      if (page) drawOther(path, page);
      return;
    }
    if (!PATHS.has(path)) return;
    const page = document.getElementById('str1');
    if (!page || !page.querySelector('table.strom, table.portal_menu a[href*="strom_slozek.pl"]')) return;
    const list = folders(page);
    const total = list.reduce((s, f) => s + (f.objects || 0), 0);

    kit.page({
      key: 'ematerials',
      css: 'pages/ematerials.css',
      title: T.title,
      subtitle: nav.sectionLabel('courses.files'),
      tabs: kit.sectionTabs(library, 'folders'),
      build: () => {
        if (!list.length) return emptyState(kit.looseText(page) || T.none);
        const rows = list.map((f) => ({ f, el: folderRow(f) }));
        // A local filter only when the list is long enough to need one.
        const filter = list.length <= 12 ? null : h('input', { class: 'el-filter', type: 'search', placeholder: T.filter, 'aria-label': T.filter, autocomplete: 'off' });
        const noMatch = h('p', { class: 'muted el-nomatch', hidden: '' }, T.noMatch);
        filter?.addEventListener('input', () => {
          const q = norm(filter.value);
          let any = false;
          for (const r of rows) { const hit = !q || norm(r.f.name).includes(q); r.el.hidden = !hit; any ||= hit; }
          noMatch.hidden = any;
        });
        return [
          h('p', { class: 'el-summary' }, h('strong', {}, T.summary(list.length, total)), h('span', { class: 'muted' }, T.lead)),
          filter && h('label', { class: 'el-filter-wrap' }, icon('search'), filter),
          h('section', { class: 'card el-list' }, rows.map((r) => r.el), noMatch),
          ...kit.messages(page).filter((m) => m.tone !== 'info').map(kit.note),
        ];
      },
    });
  });
})();
