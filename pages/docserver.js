// InSIS+ — Document server (dok_server/): the folder tree ("Document tree", index.pl) and the list of new
// documents (nove_dok.pl). One module, each page recognised by its content. Both are views of Courses › Materials
// (docs/ia/03-pages.md §1 rule 7, teardowns/courses.md §2.3): the title is the section ("Materials"), the views
// are one row of view tabs (By course, InSIS+'s composed page, then InSIS's own Document tree · New documents ·
// Searching), and InSIS's two non-views (DS settings, All my folders) are the page actions.
//
// Document tree: div.tree > ul > li > div.node-container + div.subtree > ul > li … Each node label holds the
// folder link (slozka.pl?…id=N) and after it "(files)" or "(new/files)", the new number in bold; a bold folder
// name means new documents somewhere below. Counts are per folder, so totals are summed over the subtree here.
// Course folders are recognised by their code ("4XY102 Innovation …"). The page is rebuilt (no forms on it); the
// one place that answers "what is new" is the New documents view, so the tree has no list of news of its own.
//
// New documents: InSIS's list is a table inside its "mark as read" form (a checkbox per row), so it is treatment L
// in place (03-pages.md §2 "Moving InSIS's elements"): the summary is drawn above it, the form itself stays
// InSIS's (slotted, everything around it hidden), its rows are styled in place and get data-ipx-label attributes
// for the phone layout; no row is rebuilt, moved or reordered, and nothing is ticked or submitted here. The file
// and info links of the rows are InSIS's own elements (a download link does not pass the URL rule).
//
// Stored for the dashboard, plain values only:
// ipx.state.docserver = {
//   updated: Date.now(), source: location.href,     // the tree's read (the background read keys on this)
//   newCount: number | null,                      // "New documents (N)" from the tab row (or the list length)
//   newUpdated, fresh: [{ id, name, type, author, date, folderId, folderName, code }], freshPartial,   // the New list, when the student opened it
//   courses: [{ code, name, href, newCount, semester, files, allFiles, tree }],   // course folders from the tree, href = the folder;
//            tree = its subfolders [{ name, href, files, fresh, allFiles, allNew, children }]
//   folders: { [folderId]: courseCode },          // every folder inside a course, to group new documents by course
// }
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.ui || !ipx.nav) return;

  // What is being read: this page, or a page fetched by the background sync (sync.js), which hands a parsed
  // document to the reader below. No InSIS script runs on a fetched page and nothing else is loaded.
  let doc = document;
  let here = location;
  const { clean, norm, lang } = ipx;
  const { h, icon, anchor, takeover, kpi, emptyState, facultyColors, styleSlotted } = ipx.ui;
  const nav = ipx.nav;

  const T = {
    cs: { tag: 'nové', fresh: 'Nové dokumenty', newBadge: (n) => `${n} ${ipx.kit.plural(n, 'nový', 'nové', 'nových')}`,
      inside: (n) => `${n} ${ipx.kit.plural(n, 'nový dokument', 'nové dokumenty', 'nových dokumentů')} v podsložkách`,
      files: (n) => `${n} ${ipx.kit.plural(n, 'soubor', 'soubory', 'souborů')}`,
      jump: 'Přejít na složku…', top: 'Všechny složky', pathLabel: 'Cesta ke složce', emptyFolder: 'prázdná', emptyFolders: (n) => `${n} ${ipx.kit.plural(n, 'prázdná složka', 'prázdné složky', 'prázdných složek')}`, filesHere: (n) => `${n} ${ipx.kit.plural(n, 'soubor', 'soubory', 'souborů')} v této složce`, filesHereHint: 'Otevře složku v InSIS', byCourseTab: 'Podle předmětů', treeTab: 'Strom dokumentů', searchTab: 'Hledat', views: 'Pohledy na materiály', settings: 'Nastavení', myFolders: 'Moje složky',
      byCourse: 'Novinky ve vašich předmětech', byCourseNews: (c) => `Nové soubory v: ${c}. Podle předmětů je máte pohromadě.`,
      allHint: 'Všechny složky, které vám InSIS ukazuje. Složky s novými dokumenty jsou rozbalené.',
      expand: 'Rozbalit vše', collapse: 'Sbalit vše', filter: 'Hledat složku…', noMatch: 'Žádná složka neodpovídá.',
      storage: 'Vaše úložiště', open: 'Rozbalit',
      latest: 'Poslední', today: 'dnes', yesterday: 'včera', refresh: 'Aktualizovat',
      emptyNew: 'Nemáte žádné nové dokumenty.', inCourses: 'Ve složkách předmětů', ofCourses: (n) => `${n} ${ipx.kit.plural(n, 'předmět', 'předměty', 'předmětů')}`,
      perCourse: 'Podle předmětů', otherFolders: (n) => `${n} v ostatních složkách (fakulta, škola)`,
      markLead: 'Seznam je původní seznam InSIS. Otevřený dokument se v něm už nemusí znovu ukázat. Více dokumentů najednou označíte jako přečtené zaškrtnutím a tlačítkem InSIS pod seznamem.',
      treeTip: 'Předměty u nových dokumentů InSIS+ pozná, až jednou otevřete Strom dokumentů.', courseFiles: 'Soubory předmětu' },
    en: { tag: 'new', fresh: 'New documents', newBadge: (n) => `${n} new`,
      inside: (n) => `${n} new ${n === 1 ? 'document' : 'documents'} in subfolders`,
      files: (n) => `${n} ${n === 1 ? 'file' : 'files'}`,
      jump: 'Jump to folder…', top: 'All folders', pathLabel: 'Folder path', emptyFolder: 'empty', emptyFolders: (n) => `${n} empty ${n === 1 ? 'folder' : 'folders'}`, filesHere: (n) => `${n} ${n === 1 ? 'file' : 'files'} in this folder`, filesHereHint: 'Opens the folder in InSIS', byCourseTab: 'By course', treeTab: 'Document tree', searchTab: 'Search', views: 'Views of your materials', settings: 'Settings', myFolders: 'My folders',
      byCourse: 'News in your courses', byCourseNews: (c) => `New files in ${c}. By course shows them together.`,
      allHint: 'Every folder InSIS shows you. Folders with new documents are open.',
      expand: 'Expand all', collapse: 'Collapse all', filter: 'Find a folder…', noMatch: 'No folder matches.',
      storage: 'Your storage', open: 'Expand',
      latest: 'Latest', today: 'today', yesterday: 'yesterday', refresh: 'Refresh',
      emptyNew: 'You have no new documents.', inCourses: 'In course folders', ofCourses: (n) => `${n} ${n === 1 ? 'course' : 'courses'}`,
      perCourse: 'By course', otherFolders: (n) => `${n} in other folders (faculty, university)`,
      markLead: 'This is InSIS\'s own list. A document you open may no longer show up in it. To mark several as read at once, tick them and press InSIS\'s button under the list.',
      treeTip: 'InSIS+ can tell the courses of new documents once you have opened the Document tree.', courseFiles: 'Course files' },
  }[lang];
  const locale = lang === 'cs' ? 'cs-CZ' : 'en-GB';

  // VŠE course codes start with the faculty number (4XY101 → FIS).
  const CODE_RE = /^(\d[A-Z0-9]{2}\d{3})\s+(.+)$/;
  const SEM_RE = /\b(ZS|LS|WS|SS)\s*\d{4}\s*\/\s*\d{2,4}\b/;
  const facultyOfCode = (code) => ipx.ui.facultyFor(code);
  const folderId = (href) => (href || '').match(/[?;&]id=(\d+)/)?.[1] || null;

  const svgIcon = (name, cls) => {
    const s = ipx.ui.icon(name);
    s.classList.add(cls);
    return s;
  };
  const folderIcon = () => svgIcon('folder', 'ds-folder');

  // ---------- reading the original page ----------

  // The tab row (Document tree / All my folders / New documents (N) / DS settings / Searching).
  function tabRow() {
    const table = doc.querySelector('#str1 table.portal_menu') || doc.querySelector('table.portal_menu');
    if (!table) return [];
    return [...table.querySelectorAll('a[href]')].map((a) => {
      const text = clean(a.textContent);
      const m = text.match(/^(.*?)\s*\((\d+)\)$/);
      return { href: a.href, text: m ? m[1] : text, count: m ? Number(m[2]) : null, active: !!a.closest('b, strong') };
    });
  }
  const newTab = (tabs) => tabs.find((t) => /nove_dok/.test(t.href));

  // Text of a node label outside its link: "(3)" or "(1/11)".
  const labelRest = (label, a) => clean([...label.childNodes].filter((n) => n !== a).map((n) => n.textContent).join(''));

  function readNodes(ul, parent) {
    const out = [];
    for (const li of ul.children) {
      if (li.tagName !== 'LI') continue;
      const box = li.querySelector(':scope > .node-container');
      const label = box?.querySelector('.node-label');
      const a = label?.querySelector('a[href]');
      if (!a) continue; // the empty root row
      const m = labelRest(label, a).match(/\((\d+)(?:\s*\/\s*(\d+))?\)/);
      const node = {
        id: folderId(a.href) || box.id, name: clean(a.textContent), href: a.href, parent,
        files: m ? Number(m[2] ?? m[1]) : 0, fresh: m && m[2] != null ? Number(m[1]) : 0,
        bold: !!a.querySelector('b, strong'), children: [],
      };
      const sub = li.querySelector(':scope > .subtree > ul');
      if (sub) node.children = readNodes(sub, node);
      node.allFiles = node.files + node.children.reduce((s, c) => s + c.allFiles, 0);
      node.allNew = node.fresh + node.children.reduce((s, c) => s + c.allNew, 0);
      out.push(node);
    }
    return out;
  }

  const walk = (nodes, fn) => nodes.forEach((n) => { fn(n); walk(n.children, fn); });
  const ancestors = (n) => { const out = []; for (let p = n.parent; p; p = p.parent) out.unshift(p); return out; };

  // "Quota: 40 MiB / Occupied: 0.0 B (0 %) / Free: 40.0 MiB": label + value rows of the small table under the tree.
  function quota() {
    const rows = [];
    for (const tr of doc.querySelectorAll('#str1 tr')) {
      const tds = [...tr.querySelectorAll(':scope > td')];
      if (tds.length < 2 || tds.length > 3 || tr.querySelector('table')) continue;
      const label = clean(tds[0].textContent).replace(/:$/, '');
      const value = clean(tds[1].textContent);
      if (label && /^\d[\d.,]*\s*(B|[KMGT]i?B)$/.test(value)) rows.push({ label, value, extra: clean(tds[2]?.textContent) });
    }
    return rows.length ? rows : null;
  }

  function parseTree() {
    const ul = doc.querySelector('div.tree > ul');
    if (!ul) return null;
    const roots = readNodes(ul, null);
    let count = 0;
    // Document-server folders only: the mail box has a folder tree of its own (posta/slozka.pl).
    walk(roots, (n) => { if (/dok_server\/slozka\.pl/.test(n.href)) count++; });
    if (!count) return null;

    const courses = [];
    const folders = {};
    walk(roots, (n) => {
      const m = n.name.match(CODE_RE);
      if (!m || ancestors(n).some((p) => p.course)) return;
      const sem = ancestors(n).reverse().find((p) => SEM_RE.test(p.name));
      n.course = { code: m[1], name: m[2], faculty: facultyOfCode(m[1]), semester: sem?.name.match(SEM_RE)[0] || '' };
      courses.push(n);
      walk([n], (d) => { if (d.id) folders[d.id] = m[1]; });
    });
    const tabs = tabRow();
    return { kind: 'tree', roots, courses, folders, tabs, quota: quota(), count };
  }

  const parseDate = (s) => ipx.kit.dateOf(s);

  function parseNew() {
    const tabs = tabRow();
    const active = tabs.find((t) => t.active);
    const form = [...doc.querySelectorAll('form')].find((f) => /nove_dok/.test(f.getAttribute('action') || ''));
    const table = [...doc.querySelectorAll('#str1 table, table')].find((t) => t.querySelector('a[href*="download="], a[href*="dokumenty_cteni"]'));
    const isNewPage = (active && /nove_dok/.test(active.href)) || (form && table);
    if (!isNewPage || doc.querySelector('div.tree')) return null;

    const heads = table ? [...table.querySelectorAll('thead th, tr.zahlavi > th')].map((th) => norm(th.textContent)) : [];
    const col = (re) => heads.findIndex((t) => re.test(t));
    const iName = col(/^(name|nazev|jmeno)/);
    const iComment = col(/comment|koment|poznam/);

    const docs = [];
    for (const tr of table ? table.querySelectorAll('tbody tr') : []) {
      const tds = [...tr.querySelectorAll(':scope > td')];
      const fileA = tr.querySelector('a[href*="download="]');
      const infoA = tr.querySelector('a[href*="dokumenty_cteni"]');
      if (!fileA && !infoA) continue;
      const folderTd = tds.findIndex((td) => td.querySelector('a[href*="slozka.pl"]:not([href*="download="])'));
      const folderA = folderTd >= 0 ? tds[folderTd].querySelector('a[href]') : null;
      const nameTd = tds[iName >= 0 ? iName : folderTd + 1];
      const personA = tr.querySelector('a[href*="clovek.pl"]');
      const dateTd = tds.find((td) => /^\d{1,2}\s*[./]\s*\d{1,2}\s*[./]\s*\d{4}/.test(clean(td.textContent)));
      const mime = fileA?.querySelector('[data-mime]')?.getAttribute('data-mime') || '';
      docs.push({
        id: tr.querySelector('input[type="checkbox"]')?.value || (infoA?.href.match(/dok=(\d+)/) || [])[1] || null,
        name: clean(nameTd?.textContent) || clean(folderA?.textContent),
        comment: iComment >= 0 ? clean(tds[iComment]?.textContent) : '',
        folder: folderA ? { id: folderId(folderA.href), name: clean(folderA.textContent), href: folderA.href } : null,
        author: personA ? { text: clean(personA.textContent), href: personA.href, target: personA.target ? '_blank' : null } : null,
        dateText: clean(dateTd?.textContent), date: parseDate(dateTd?.textContent),
        file: fileA?.href || null, info: infoA?.href || null, type: mime.toUpperCase(),
        // InSIS's folder cell and row (never stored): get the course chip and the cell roles, styled in place.
        cell: folderTd >= 0 ? tds[folderTd] : null, row: tr,
      });
    }
    const refresh = [...doc.querySelectorAll('#str1 a[href]')].find((a) => /nove_dok\.pl(\?lang=\w+)?$/.test(a.getAttribute('href')) && clean(a.textContent) && !a.closest('table.portal_menu'));
    return { kind: 'new', tabs, docs, form, refresh: refresh && { href: refresh.href, text: T.refresh } };
  }

  // ---------- shared bits ----------

  // Every link shown goes through the URL rule; one that does not pass becomes text.
  const safe = (href) => (href ? nav.safe(href, 'link', { copied: true }) : null);
  const linkOr = (href, props, ...kids) => {
    const to = safe(href);
    return to ? h('a', { ...props, href: to }, ...kids) : h('span', props, ...kids);
  };

  // The Materials header (title, view tabs, page actions) is shared with Courses › Materials: course.js.
  const materials = ipx.materials;

  function when(d, text) {
    if (!d) return text || '';
    const days = Math.round((new Date().setHours(0, 0, 0, 0) - d.getTime()) / 864e5);
    if (days === 0) return T.today;
    if (days === 1) return T.yesterday;
    return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
  }

  const newBadge = (n) => n > 0 && h('span', { class: 'delta bad' }, T.newBadge(n));

  // ---------- All folders: a drill-down browser (04-materials.md §4.2) ----------
  // One level at a time, like Finder or Google Drive: a path at the top (canonical: from the top of InSIS's tree to
  // the folder, never from where the student came from), then the folder's subfolders as rows. A row with
  // subfolders opens that level here; a folder's own files are on InSIS's folder page (the first row, "n files in
  // this folder"); a course folder opens the course's Materials tab. The level shown is kept in the address
  // (#ipx-folder=<id>), so Back, reload and a new tab come back to the same place. "Jump to folder" searches every
  // folder name and shows each result with its path. No expand/collapse anywhere.
  function buildTree(d) {
    const byId = new Map();
    let seq = 0;
    walk(d.roots, (n) => { n.key = n.id || `n${++seq}`; byId.set(String(n.key), n); });
    const courseOfNode = (n) => n.course || ancestors(n).find((p) => p.course)?.course || null;
    const levelFromHash = () => byId.get(decodeURIComponent((/#ipx-folder=([\w-]+)/.exec(location.hash) || [])[1] || '')) || null;
    const view = h('div', { class: 'ds-browser' });

    // The browser stays the browser all the way down, course folders included: a folder with subfolders opens its
    // level here, a folder without them opens InSIS's folder page in the same context (All folders, the tree's path).
    const folderLink = (n) => {
      const c = courseOfNode(n);
      if (n.children.length) return { level: n, course: c };
      return { href: safe(n.href), course: c };
    };
    const go = (n) => {
      // Absolute, from the page's own address (a <base> must not change where the state points).
      history.pushState(null, '', location.href.split('#')[0] + (n ? `#ipx-folder=${encodeURIComponent(n.key)}` : ''));
      render();
    };
    const row = (n, withPath) => {
      const to = folderLink(n);
      const inner = [
        folderIcon(),
        h('span', { class: 'ds-row-text' }, h('strong', {}, n.name),
          h('small', {}, [withPath && ancestors(n).map((p) => p.name).join(' › '), to.course && to.course.code,
            n.allFiles > 0 ? T.files(n.allFiles) : T.emptyFolder].filter(Boolean).join(' · '))),
        n.allNew > 0 && newBadge(n.allNew),
        icon('arrow'),
      ];
      if (to.level) return h('button', { type: 'button', class: 'ds-row', onclick: () => go(to.level) }, ...inner);
      return to.href ? h('a', { class: 'ds-row', href: to.href }, ...inner) : h('span', { class: 'ds-row' }, ...inner);
    };

    const filter = h('input', { class: 'ds-filter', type: 'search', placeholder: T.jump, 'aria-label': T.jump, autocomplete: 'off' });
    filter.addEventListener('input', () => render());

    function render() {
      const level = levelFromHash();
      const q = norm(filter.value);
      const kids = level ? level.children : d.roots;
      const path = level ? [...ancestors(level), level] : [];
      let body;
      if (q) {
        const hits = [];
        walk(d.roots, (n) => { if (norm(n.name).includes(q)) hits.push(n); });
        body = hits.length ? h('div', { class: 'ds-rows' }, hits.slice(0, 80).map((n) => row(n, true))) : h('p', { class: 'muted ds-nomatch' }, T.noMatch);
      } else {
        const own = level && level.files > 0 && safe(level.href);
        const empty = kids.filter((n) => !n.allFiles && !n.children.length);
        const shown = kids.filter((n) => n.allFiles || n.children.length);
        body = h('div', { class: 'ds-rows' },
          own && h('a', { class: 'ds-row ds-own', href: own }, icon('file'),
            h('span', { class: 'ds-row-text' }, h('strong', {}, T.filesHere(level.files)), h('small', {}, T.filesHereHint)),
            newBadge(level.fresh), icon('arrow')),
          shown.map((n) => row(n, false)),
          empty.length > 0 && h('p', { class: 'muted ds-empty-line' }, T.emptyFolders(empty.length)),
          !own && !shown.length && !empty.length && h('p', { class: 'muted' }, T.emptyFolder));
      }
      view.replaceChildren(
        h('nav', { class: 'ds-path', 'aria-label': T.pathLabel },
          path.length ? h('button', { type: 'button', class: 'ds-crumb', onclick: () => go(null) }, T.top) : h('strong', {}, T.top),
          path.map((n, i) => [h('span', { class: 'ds-sep', 'aria-hidden': 'true' }, '›'),
            i === path.length - 1 ? h('strong', {}, n.name) : h('button', { type: 'button', class: 'ds-crumb', onclick: () => go(n) }, n.name)])),
        body);
    }
    addEventListener('popstate', render);
    render();

    // The quota as one quiet line, in InSIS's own words ("Quota 40 MiB · Occupied 0.0 B (0 %) · Free 40.0 MiB").
    const quotaLine = d.quota && h('p', { class: 'muted ds-quota' }, `${T.storage}: `,
      d.quota.map((r) => `${r.label} ${r.value}${r.extra ? ` ${r.extra}` : ''}`).join(' · '));

    return h('div', { class: 'ds' },
      materials.tabs('tree'),
      h('label', { class: 'ds-filter-wrap' }, icon('search'), filter),
      h('div', { class: 'card ds-whole' }, view),
      quotaLine);
  }

  // ---------- new documents ----------

  function groupDocs(docs) {
    const stored = ipx.state.docserver || {};
    const byCode = Object.fromEntries((stored.courses || []).map((c) => [c.code, c]));
    const groups = new Map();
    for (const doc of docs) {
      const f = doc.folder;
      const own = f?.name.match(CODE_RE);
      const code = (f?.id && stored.folders?.[f.id]) || own?.[1] || null;
      const key = code ? `c:${code}` : `f:${f?.id || f?.name || '?'}`;
      if (!groups.has(key)) {
        const c = code && byCode[code];
        groups.set(key, code ? { code, faculty: facultyOfCode(code), name: c?.name || own?.[2] || code, docs: [] } : { folder: f, docs: [] });
      }
      groups.get(key).docs.push(doc);
    }
    const latest = (g) => Math.max(...g.docs.map((x) => x.date?.getTime() || 0));
    return [...groups.values()].sort((a, b) => (!!b.code - !!a.code) || latest(b) - latest(a));
  }

  // One row per course with new documents: the course page's Materials tab (where its folders are), the count.
  function courseRows(groups) {
    return h('section', { class: 'card ds-percourse' },
      h('div', { class: 'card-head' }, h('h2', {}, T.perCourse)),
      h('ul', { class: 'ds-fresh' }, groups.map((g) => h('li', {},
        anchor({ href: nav.composedUrl('course.files', g.code) }, { class: 'ds-fresh-row' },
          h('span', { class: 'ds-fresh-body' },
            h('small', { class: 'ds-fresh-code', style: `color: ${facultyColors(g.faculty)[1]}` }, [g.code, g.faculty].filter(Boolean).join(' · ')),
            h('strong', {}, g.name)),
          newBadge(g.docs.length), icon('arrow'))))));
  }

  // The rows of InSIS's table get the column name as a data attribute, so on phones each row reads as a card
  // (CSS only: the cells, links and checkboxes stay exactly where InSIS put them).
  // The role of each column by its header (InSIS: Sel. · Folder · Name · Comments · Entered by · Entered on · Display ·
  // Attachment; Ozn. · Složka · Název · Komentář · Vložil · Vloženo · Zobrazit · Příloha), for the row layout.
  const ROLES = [['sel', /^(sel|ozn)/], ['folder', /^(folder|slozka)/], ['name', /^(name|nazev)/], ['note', /^(comment|koment|poznam)/],
    ['by', /^(entered by|vlozil)/], ['date', /^(entered on|vlozeno|date|datum)/], ['info', /^(display|zobraz)/], ['file', /^(attachment|priloha)/]];
  function labelCells(table) {
    const raw = [...(table?.querySelectorAll('thead th, tr.zahlavi > th') || [])].map((th) => clean(th.textContent).replace(/\s*\(.*$/, ''));
    const roles = raw.map((t) => ROLES.find(([, re]) => re.test(norm(t)))?.[0] || null);
    for (const tr of table?.querySelectorAll('tbody tr') || []) {
      [...tr.children].forEach((td, i) => {
        if (raw[i]) td.setAttribute('data-ipx-label', raw[i]);
        if (roles[i]) td.setAttribute('data-ipx-col', roles[i]);
      });
    }
    // The rows' layout applies only when every role was recognised (an unknown InSIS column keeps the plain table).
    if (roles.length && roles.every(Boolean)) table.setAttribute('data-ipx-rows', '');
  }

  function buildNew(d) {
    const groups = groupDocs(d.docs);
    const courseGroups = groups.filter((g) => g.code);
    const otherDocs = groups.filter((g) => !g.code).reduce((s, g) => s + g.docs.length, 0);
    const inCourses = d.docs.length - otherDocs;
    const tab = newTab(d.tabs);
    const count = d.docs.length || tab?.count || 0;
    const newest = d.docs.map((x) => x.date).filter(Boolean).sort((a, b) => b - a)[0];
    const mapped = !!ipx.state.docserver?.folders;
    const treeTab = d.tabs.find((t) => /index\.pl|dok_server\/(\?|$)/.test(t.href));
    const refresh = d.refresh && safe(d.refresh.href);

    return h('div', { class: 'ds' },
      materials.tabs(d.kind === 'tree' ? 'tree' : 'new'),
      d.docs.length > 0 && h('div', { class: 'kpis' },
        kpi({ label: T.fresh, value: count, status: { tone: 'bad', text: T.tag } }),
        mapped && kpi({ label: T.inCourses, value: inCourses, foot: courseGroups.length ? T.ofCourses(courseGroups.length) : null }),
        newest && kpi({ label: T.latest, value: when(newest), isText: true, foot: newest.toLocaleDateString(locale) })),
      !mapped && d.docs.length > 0 && treeTab && safe(treeTab.href) && h('p', { class: 'muted ds-sub' }, T.treeTip, ' ',
        anchor({ href: safe(treeTab.href) }, { class: 'ds-inline' }, treeTab.text)),
      courseGroups.length > 0 && courseRows(courseGroups),
      otherDocs > 0 && courseGroups.length > 0 && h('p', { class: 'muted ds-sub' }, T.otherFolders(otherDocs)),
      !d.docs.length ? emptyState(T.emptyNew, refresh && { href: refresh, text: T.refresh })
        : d.form && [h('p', { class: 'kit-note info ds-lead' }, icon('info'), h('span', {}, T.markLead)), h('slot')]);
  }

  // ---------- dashboard data ----------

  // The course's subfolders as plain data (no parent links), so the course page can show them without opening InSIS.
  const slim = (nodes) => nodes.map((n) => ({ name: n.name, href: n.href, files: n.files, fresh: n.fresh, allFiles: n.allFiles, allNew: n.allNew, children: slim(n.children) }));

  function remember(d) {
    const prev = ipx.state.docserver || {};
    const tab = newTab(d.tabs);
    if (d.kind === 'tree') {
      ipx.state.docserver = {
        // The New list the student last opened stays (it has its own time).
        fresh: prev.fresh, freshPartial: prev.freshPartial, newUpdated: prev.newUpdated,
        updated: Date.now(), source: here.href,
        newCount: tab?.count ?? d.roots.reduce((s, n) => s + n.allNew, 0),
        courses: d.courses.map((n) => ({ code: n.course.code, name: n.course.name, href: n.href, newCount: n.allNew, semester: n.course.semester,
          files: n.files, fresh: n.fresh, allFiles: n.allFiles, tree: slim(n.children) })),
        folders: d.folders,
        // Every folder's name and parent, for the path above InSIS's folder page (slim: a few kB).
        index: (() => { const out = {}; walk(d.roots, (n) => { if (n.id) out[n.id] = [n.name, n.parent?.id || null]; }); return out; })(),
      };
    } else {
      // The New documents list (opened by the student; never read in the background). It has its own time: the tree
      // keeps `updated`, so visiting New does not stop the background read of the tree. When InSIS shows the list in
      // pages (fewer rows than its count), per-course numbers are left to the tree.
      const total = tab?.count ?? d.docs.length;
      const partial = total > d.docs.length;
      const codeOf = (doc) => (doc.folder?.id && prev.folders?.[doc.folder.id]) || doc.folder?.name.match(CODE_RE)?.[1] || null;
      const perCourse = {};
      const perFolder = {};
      for (const doc of d.docs) {
        const code = codeOf(doc);
        if (code) perCourse[code] = (perCourse[code] || 0) + 1;
        if (doc.folder?.id) perFolder[doc.folder.id] = (perFolder[doc.folder.id] || 0) + 1;
      }
      // The course folders' subfolder counts follow the list too (a folder's id is in its address).
      const recount = (nodes) => (nodes || []).map((n) => {
        const children = recount(n.children);
        const fresh = perFolder[folderId(n.href)] || 0;
        return { ...n, fresh, allNew: fresh + children.reduce((s, k) => s + k.allNew, 0), children };
      });
      ipx.state.docserver = {
        ...prev,
        newCount: total,
        newUpdated: Date.now(),
        // Slim rows for "New in your courses" (no download links: those stay on InSIS's pages).
        fresh: d.docs.slice(0, 60).map((doc) => ({ id: doc.id, name: doc.name, type: doc.type || '', author: doc.author?.text || '',
          date: doc.date ? doc.date.toISOString() : null, folderId: doc.folder?.id || null, folderName: doc.folder?.name || '', code: codeOf(doc) })),
        freshPartial: partial,
        courses: partial || !prev.courses ? prev.courses : prev.courses.map((c) => {
          const tree = recount(c.tree);
          const fresh = perFolder[folderId(c.href)] || 0;
          return { ...c, newCount: perCourse[c.code] || 0, fresh, tree };
        }),
      };
    }
    ipx.save();
  }

  // A document's details (dokumenty_cteni.pl, "View information"): InSIS's form holds a two-column table (Name ·
  // Entered by · Document date · Comments · Attachment, with empty spacer rows) and its "Download and save" button,
  // which submits the form. Everything stays InSIS's, in place: each row gets its role and pages/docserver.css draws
  // the form as one card (the name as its title, the facts under it, the attachment with InSIS's button last).
  // The header (Materials, or the course when opened from it) and the path come from the sections in course.js.
  function docDetails() {
    const page = document.getElementById('str1');
    const form = page?.querySelector('form[action*="dokumenty_cteni"]');
    const table = form?.querySelector('table');
    if (!table) return;
    const rows = [...table.querySelectorAll(':scope > tbody > tr')];
    rows.forEach((tr, i) => {
      const role = !clean(tr.textContent) ? 'gap' : tr.querySelector('input[type="submit"]') ? 'file' : i === 0 ? 'name' : 'fact';
      tr.setAttribute('data-ipx-doc', role);
    });
    form.setAttribute('data-ipx-doc-card', '');
    // InSIS's one-line help ("Use this application to read documents.") says what the page is; the header does.
    const help = [...page.querySelectorAll('div.small')].filter((d) => !form.contains(d));
    ipx.ui.hideInSlot([...help, ...help.map((d) => d.nextElementSibling).filter((n) => n?.tagName === 'BR')]);
    document.documentElement.classList.add('ipx-docinfo');
    styleSlotted('pages/docserver.css');
  }

  // Background read (sync.js): parse a fetched page and store its data; nothing is drawn.
  (ipx.readers ||= {}).docserver = (fetched, url) => {
    doc = fetched; here = new URL(url);
    try { const data = parseTree() || parseNew(); if (data) remember(data); } finally { doc = document; here = location; }
  };

  // Every other page of the document server (Search, a folder, DS settings, My folders) gets the same Materials
  // header through the section registry (kit.section in course.js), drawn by generic.js around InSIS's content.

  ipx.ready.then(() => {
    const data = parseTree() || parseNew();
    if (!data) {
      // Any other page of the document server (a folder, a document's details, Search, settings) carries InSIS's tab
      // row with "New documents (N)" (no number: none new): the Materials tab's count follows it, before the header
      // is drawn (generic.js), so every page of the section shows InSIS's own number.
      const path = nav.route(document.baseURI.split('#')[0]).path || '';
      const tab = path.startsWith('/auth/dok_server/') && newTab(tabRow());
      if (tab && ipx.state.docserver) { ipx.state.docserver.newCount = tab.count ?? 0; ipx.save(); }
      if (path === '/auth/dok_server/dokumenty_cteni.pl') docDetails();
      return;
    }
    remember(data);
    const common = { key: 'docserver', css: ['kit.css', 'pages/docserver.css'], title: nav.sectionLabel('courses.files'),
      subtitle: nav.label('courses'), extra: materials.actions(null) };

    if (data.kind === 'tree') {
      takeover({ ...common, build: () => buildTree(data) });
      return;
    }

    const page = doc.getElementById('str1');
    const slotted = page && data.form && data.docs.length && page.contains(data.form) ? [page] : null;
    if (slotted) {
      // Only InSIS's own "mark as read" form (with its list) stays visible, in place; its rows are styled, not moved.
      ipx.ui.keepOnly(page, data.form);
      labelCells(data.form.querySelector('table:has(input[name="oznacene"])') || data.form.querySelector('table'));
      // Each row reads like the course page's document rows (course.js docRow): the type, the name, then "folder ·
      // author · date" under it. Only data attributes are set (the role of each cell, the course chip, the readable
      // folder name and the type); CSS lays InSIS's own cells out, and the folder link keeps its address and text.
      const folders = ipx.state.docserver?.folders || {};
      const courseFolder = (code) => (ipx.state.docserver?.courses || []).find((c) => c.code === code);
      for (const x of data.docs) {
        const code = (x.folder?.id && folders[x.folder.id]) || x.folder?.name.match(CODE_RE)?.[1];
        if (code && x.cell) x.cell.setAttribute('data-ipx-course', code);
        const a = x.cell?.querySelector('a[href]');
        if (a && x.folder) {
          const own = code && folderId(courseFolder(code)?.href) === x.folder.id;
          const label = own || (code && CODE_RE.test(x.folder.name) && x.folder.name.startsWith(code)) ? T.courseFiles : ipx.folderLabel?.(x.folder.name) || x.folder.name;
          if (label !== clean(a.textContent)) a.setAttribute('data-ipx-text', label);
          // InSIS opens the folder in a new window (target="blank"); every other folder link opens in place.
          if (a.getAttribute('target') === 'blank') a.removeAttribute('target');
        }
        if (x.row && x.type) x.row.querySelector('[data-ipx-col="file"] a[href]')?.setAttribute('data-ipx-type', x.type.slice(0, 4));
      }
      document.documentElement.classList.add('ipx-ds');
      styleSlotted('pages/docserver.css');
    }
    takeover({ ...common, slotted, build: () => buildNew(data) });
  });
})();
