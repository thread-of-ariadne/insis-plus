// InSIS+ — Document server (dok_server/): the folder tree ("Document tree", index.pl) and the list of new
// documents (nove_dok.pl). One module, each page recognised by its content.
//
// Document tree: div.tree > ul > li > div.node-container + div.subtree > ul > li … Each node label holds the
// folder link (slozka.pl?…id=N) and after it "(files)" or "(new/files)", the new number in bold; a bold folder
// name means new documents somewhere below. Counts are per folder, so totals are summed over the subtree here.
// Course folders are recognised by their code ("4SA471 Innovation …"). The page is rebuilt (no forms on it).
//
// New documents: one table row per document (folder link, name, comment, author, date, info link, file link).
// The rows sit inside InSIS's "mark as read" form, which stays the original one: #str1 is slotted below the
// new list, everything but that form hidden, and shown only when the student asks for it. Never submitted here.
//
// Stored for the dashboard, plain values only:
// ipx.state.docserver = {
//   updated: Date.now(), source: location.href,
//   newCount: number | null,                      // "New documents (N)" from the tab row (or the list length)
//   courses: [{ code, name, href, newCount, semester, files, allFiles, tree }],   // course folders from the tree, href = the folder;
//            tree = its subfolders [{ name, href, files, fresh, allFiles, allNew, children }]
//   folders: { [folderId]: courseCode },          // every folder inside a course, to group new documents by course
// }
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.ui) return;

  // What is being read: this page, or a page fetched by the background sync (sync.js), which hands a parsed
  // document to the reader below. No InSIS script runs on a fetched page and nothing else is loaded.
  let doc = document;
  let here = location;
  const { clean, norm, lang } = ipx;
  const { h, icon, anchor, takeover, kpi, sectionHead, emptyState, cover, facultyColors, styleSlotted } = ipx.ui;

  const T = {
    cs: { tag: 'nové', title: 'Dokumentový server', tree: 'Strom dokumentů', fresh: 'Nové dokumenty', newBadge: (n) => `${n} ${n === 1 ? 'nový' : n < 5 ? 'nové' : 'nových'}`,
      inside: (n) => `${n} ${n === 1 ? 'nový dokument' : n < 5 ? 'nové dokumenty' : 'nových dokumentů'} v podsložkách`,
      files: (n) => `${n} ${n === 1 ? 'soubor' : n < 5 ? 'soubory' : 'souborů'}`,
      courses: 'Předměty', coursesNews: 'Předměty s novinkami', courseSection: 'Moje předměty',
      byCourse: 'Materiály podle předmětů', byCourseHint: 'Složky tvých předmětů na jednom místě.', byCourseNews: (c) => `Novinky v: ${c}`,
      allFolders: 'Celý strom složek', allHint: 'Všechny složky, které InSIS na stránce ukazuje. Složky s novými dokumenty jsou rozbalené.',
      expand: 'Rozbalit vše', collapse: 'Sbalit vše', filter: 'Hledat složku…', noMatch: 'Žádná složka neodpovídá.',
      whereNew: 'Kde je nové', whereEmpty: 'Ve stromu teď nejsou žádné nové dokumenty.', allNew: 'Všechny nové →',
      storage: 'Vaše úložiště', open: 'Rozbalit', close: 'Sbalit',
      none: 'žádné', latest: 'Poslední', today: 'dnes', yesterday: 'včera', refresh: 'Aktualizovat →',
      emptyNew: 'Nemáte žádné nové dokumenty.', other: 'Ostatní složky', details: 'Informace o dokumentu',
      markTitle: 'Označit jako přečtené', markHint: 'Otevřený dokument se v seznamu už znovu neukáže. Hromadně je označíte v původním formuláři InSIS.',
      markShow: 'Zobrazit formulář', markHide: 'Skrýt formulář', file: 'Soubor',
      treeTip: 'Seskupení podle předmětů funguje, až jednou otevřete Strom dokumentů.', inCourse: 've složce předmětu' },
    en: { tag: 'new', title: 'Document server', tree: 'Document tree', fresh: 'New documents', newBadge: (n) => `${n} new`,
      inside: (n) => `${n} new ${n === 1 ? 'document' : 'documents'} in subfolders`,
      files: (n) => `${n} ${n === 1 ? 'file' : 'files'}`,
      courses: 'Courses', coursesNews: 'Courses with news', courseSection: 'My courses',
      byCourse: 'Materials by course', byCourseHint: 'The folders of your courses in one place.', byCourseNews: (c) => `News in: ${c}`,
      allFolders: 'Whole folder tree', allHint: 'Every folder InSIS shows on this page. Folders with new documents are open.',
      expand: 'Expand all', collapse: 'Collapse all', filter: 'Find a folder…', noMatch: 'No folder matches.',
      whereNew: 'Where the news is', whereEmpty: 'No new documents in the tree right now.', allNew: 'All new →',
      storage: 'Your storage', open: 'Expand', close: 'Collapse',
      none: 'none', latest: 'Latest', today: 'today', yesterday: 'yesterday', refresh: 'Refresh →',
      emptyNew: 'You have no new documents.', other: 'Other folders', details: 'Document information',
      markTitle: 'Mark as read', markHint: 'A document you open no longer shows up here. To mark several at once, use the original InSIS form.',
      markShow: 'Show the form', markHide: 'Hide the form', file: 'File',
      treeTip: 'Open the Document tree once and new files get grouped by course.', inCourse: 'in the course folder' },
  }[lang];
  const locale = lang === 'cs' ? 'cs-CZ' : 'en-GB';

  // VŠE course codes start with the faculty number (4IT431 → FIS).
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

  const parseDate = (s) => {
    const m = (s || '').match(/(\d{1,2})\s*[./]\s*(\d{1,2})\s*[./]\s*(\d{4})/);
    return m ? new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])) : null;
  };

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
      });
    }
    const refresh = [...doc.querySelectorAll('#str1 a[href]')].find((a) => /nove_dok\.pl$/.test(a.getAttribute('href')) && clean(a.textContent) && !a.closest('table.portal_menu'));
    return { kind: 'new', tabs, docs, form, refresh: refresh && { href: refresh.href, text: T.refresh } };
  }

  // ---------- shared bits ----------

  const tabsNav = (tabs) => ipx.ui.viewTabs(tabs.map((t) => ({ href: t.href, text: t.text, on: t.active, count: t.count })), T.title);

  function when(d, text) {
    if (!d) return text || '';
    const days = Math.round((new Date().setHours(0, 0, 0, 0) - d.getTime()) / 864e5);
    if (days === 0) return T.today;
    if (days === 1) return T.yesterday;
    return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
  }

  const newBadge = (n) => n > 0 && h('span', { class: 'delta bad' }, T.newBadge(n));

  // ---------- document tree ----------

  // Collapsible folder tree. open(node) decides the initial state; the li elements are kept for filtering.
  function folderTree(nodes, open, els) {
    return h('ul', { class: 'ds-tree' }, nodes.map((n) => {
      const kids = n.children.length;
      const li = h('li', { class: 'ds-node' + (n.allNew ? ' has-new' : '') + (kids && open(n) ? ' open' : '') });
      const btn = kids
        ? h('button', { class: 'ds-toggle', type: 'button', 'aria-expanded': String(li.classList.contains('open')),
            'aria-label': `${T.open}: ${n.name}`,
            onclick: () => setOpen(li, !li.classList.contains('open')) }, icon('chevron'))
        : h('span', { class: 'ds-toggle-gap', 'aria-hidden': 'true' });
      const inside = n.allNew - n.fresh;
      li.append(
        h('div', { class: 'ds-row' },
          btn, folderIcon(),
          h('a', { class: 'ds-name', href: n.href, title: n.name }, n.name),
          h('span', { class: 'ds-counts' },
            inside > 0 && h('span', { class: 'ds-dot', title: T.inside(inside), 'aria-label': T.inside(inside) }),
            newBadge(n.fresh),
            n.files > 0 && h('span', { class: 'ds-files', title: T.files(n.files) }, String(n.files)))),
        ...(kids ? [folderTree(n.children, open, els)] : []));
      els?.set(n, li);
      return li;
    }));
  }
  function setOpen(li, on) {
    if (!li.querySelector(':scope > ul')) return;
    li.classList.toggle('open', on);
    li.querySelector(':scope > .ds-row > .ds-toggle')?.setAttribute('aria-expanded', String(on));
  }

  function buildTree(d) {
    const tab = newTab(d.tabs);
    const newCount = tab?.count ?? d.roots.reduce((s, n) => s + n.allNew, 0);
    const withNews = d.courses.filter((n) => n.allNew > 0);
    const freshFolders = [];
    walk(d.roots, (n) => { if (n.fresh > 0) freshFolders.push(n); });

    const els = new Map();
    const inCourse = (n) => n.course || ancestors(n).some((p) => p.course);
    const whole = folderTree(d.roots, (n) => n.allNew > 0 && !inCourse(n), els);
    const filter = h('input', { class: 'ds-filter', type: 'search', placeholder: T.filter, 'aria-label': T.filter, autocomplete: 'off' });
    const noMatch = h('p', { class: 'muted ds-nomatch', hidden: '' }, T.noMatch);
    const defaults = new Map([...els].map(([n, li]) => [li, li.classList.contains('open')]));
    const runFilter = () => {
      const q = norm(filter.value);
      const visit = (n) => {
        const li = els.get(n);
        const kidHit = n.children.map(visit).some(Boolean);
        const hit = !q || norm(n.name).includes(q) || kidHit;
        li.hidden = !hit;
        if (q) setOpen(li, kidHit);
        else setOpen(li, defaults.get(li));
        return hit;
      };
      const any = d.roots.map(visit).some(Boolean);
      noMatch.hidden = any;
    };
    filter.addEventListener('input', runFilter);
    const all = (on) => { filter.value = ''; runFilter(); els.forEach((li) => setOpen(li, on)); };

    const main = h('div', { class: 'ds-main' },
      tabsNav(d.tabs),
      // Course folders by course live on Courses › Materials (one card per course); this page is the whole tree.
      ipx.nav.composedUrl && h('a', { class: 'card ds-pointer', href: ipx.nav.composedUrl('courses.files') },
        h('span', { class: 'ds-pointer-text' }, h('strong', {}, T.byCourse), h('small', {},
          withNews.length ? T.byCourseNews(withNews.map((n) => n.course.code).join(', ')) : T.byCourseHint)),
        newCount > 0 && newBadge(newCount), icon('arrow')),
      sectionHead(T.allFolders, null, h('p', { class: 'muted ds-sub' }, T.allHint)),
      h('div', { class: 'ds-tools' },
        h('label', { class: 'ds-filter-wrap' }, icon('search'), filter),
        h('button', { class: 'ds-btn', type: 'button', onclick: () => all(true) }, T.expand),
        h('button', { class: 'ds-btn', type: 'button', onclick: () => all(false) }, T.collapse)),
      h('div', { class: 'card ds-whole' }, whole, noMatch));

    const rail = h('aside', { class: 'ds-rail' },
      h('section', {},
        h('div', { class: 'card-head' }, h('h2', {}, T.whereNew), tab && anchor({ href: tab.href }, { class: 'more' }, T.allNew)),
        freshFolders.length
          ? h('ul', { class: 'ds-fresh' }, freshFolders.map((n) => {
              const up = ancestors(n);
              const course = [n, ...up].find((p) => p.course);
              const where = course && course !== n
                ? [course.course.code, ...up.slice(up.indexOf(course) + 1).map((p) => p.name)].join(' › ')
                : up.slice(-2).map((p) => p.name).join(' › ');
              return h('li', {}, anchor({ href: n.href }, { class: 'ds-fresh-row' },
                h('span', { class: 'ds-fresh-body' }, h('strong', {}, course === n ? `${n.course.code} ${n.course.name}` : n.name),
                  where && h('small', {}, course === n ? T.inCourse : where)),
                newBadge(n.fresh)));
            }))
          : h('p', { class: 'muted ds-rail-empty' }, T.whereEmpty)),
      d.quota && h('section', { class: 'card ds-quota' },
        h('div', { class: 'card-head' }, h('h2', {}, T.storage)),
        h('dl', {}, d.quota.map((r) => [h('dt', {}, r.label), h('dd', {}, r.value, r.extra && h('small', {}, ` ${r.extra}`))]))));

    return h('div', { class: 'ds' }, main, rail);
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
        groups.set(key, code
          ? { code, faculty: facultyOfCode(code), name: c?.name || own?.[2] || code, href: c?.href || (own ? f.href : null), docs: [] }
          : { folder: f, docs: [] });
      }
      groups.get(key).docs.push(doc);
    }
    const latest = (g) => Math.max(...g.docs.map((x) => x.date?.getTime() || 0));
    return [...groups.values()].sort((a, b) => (!!b.code - !!a.code) || latest(b) - latest(a));
  }

  function docRow(doc, showFolder) {
    const link = doc.file || doc.info;
    return h('li', { class: 'ds-doc' },
      h('span', { class: 'ds-type', title: doc.type || T.file }, doc.type ? doc.type.slice(0, 4) : icon('file')),
      h('div', { class: 'ds-doc-body' },
        link ? h('a', { class: 'ds-doc-name', href: link }, doc.name) : h('span', { class: 'ds-doc-name' }, doc.name),
        doc.comment && h('p', { class: 'ds-doc-comment' }, doc.comment),
        h('div', { class: 'ds-doc-meta' },
          showFolder && doc.folder && h('a', { href: doc.folder.href, class: 'ds-doc-folder' }, folderIcon(), h('span', {}, doc.folder.name)),
          doc.author && anchor({ href: doc.author.href, target: doc.author.target }, {}, doc.author.text),
          doc.dateText && h('time', { title: doc.dateText }, when(doc.date, doc.dateText)))),
      doc.info && h('a', { class: 'ds-info', href: doc.info, title: T.details, 'aria-label': T.details }, svgIcon('info', 'ds-info-icon')));
  }

  function groupCard(g) {
    const head = g.code
      ? [cover(g.code, g.faculty, 44, 44),
          h('div', { class: 'ds-course-titles' },
            h('span', { class: 'course-code', style: `color: ${facultyColors(g.faculty)[1]}` }, [g.code, g.faculty].filter(Boolean).join(' · ')),
            g.href ? h('a', { class: 'ds-course-name', href: g.href }, g.name) : h('span', { class: 'ds-course-name' }, g.name))]
      : [h('span', { class: 'tile-icon' }, folderIcon()),
          h('div', { class: 'ds-course-titles' },
            g.folder?.href ? h('a', { class: 'ds-course-name', href: g.folder.href }, g.folder.name) : h('span', { class: 'ds-course-name' }, g.folder?.name || '—'))];
    // Inside a course card each document names its subfolder; a plain folder card already is the folder.
    return h('article', { class: 'card ds-group' },
      h('div', { class: 'ds-course-head' }, head, newBadge(g.docs.length)),
      h('ul', { class: 'ds-docs' }, g.docs.map((doc) => docRow(doc, !!g.code))));
  }

  function buildNew(d, state) {
    const groups = groupDocs(d.docs);
    const courseGroups = groups.filter((g) => g.code);
    const otherGroups = groups.filter((g) => !g.code);
    const tab = newTab(d.tabs);
    const count = d.docs.length || tab?.count || 0;
    const newest = d.docs.map((x) => x.date).filter(Boolean).sort((a, b) => b - a)[0];
    const mapped = !!ipx.state.docserver?.folders;
    const treeTab = d.tabs.find((t) => /index\.pl$|dok_server\/?$/.test(t.href));

    const toggle = h('button', { class: 'ds-btn primary', type: 'button', 'aria-expanded': 'false',
      onclick: () => {
        const on = !state.wrap.classList.contains('show-form');
        state.wrap.classList.toggle('show-form', on);
        toggle.setAttribute('aria-expanded', String(on));
        toggle.textContent = on ? T.markHide : T.markShow;
        if (on) requestAnimationFrame(() => d.form.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      } }, T.markShow);

    const main = h('div', { class: 'ds-main' },
      tabsNav(d.tabs),
      h('div', { class: 'kpis' },
        kpi({ label: T.fresh, value: count, status: count > 0 && { tone: 'bad', text: T.tag } }),
        kpi({ label: T.coursesNews, value: courseGroups.length, foot: courseGroups.map((g) => g.code).join(', ') || null }),
        newest && kpi({ label: T.latest, value: when(newest), isText: true, foot: newest.toLocaleDateString(locale) })),
      !mapped && d.docs.length && treeTab && h('p', { class: 'muted ds-sub' }, T.treeTip, ' ', anchor({ href: treeTab.href }, { class: 'ds-inline' }, treeTab.text)),
      d.docs.length
        ? [courseGroups.length && [sectionHead(T.courseSection, d.refresh), h('div', { class: 'ds-groups' }, courseGroups.map(groupCard))],
            otherGroups.length && [sectionHead(T.other, courseGroups.length ? null : d.refresh), h('div', { class: 'ds-groups' }, otherGroups.map(groupCard))]]
        : emptyState(T.emptyNew, d.refresh));

    const rail = h('aside', { class: 'ds-rail' },
      d.form && d.docs.length && h('section', { class: 'card ds-mark' },
        h('div', { class: 'card-head' }, h('h2', {}, T.markTitle)),
        h('p', { class: 'muted' }, T.markHint),
        toggle),
      courseGroups.length > 0 && h('section', {},
        h('div', { class: 'card-head' }, h('h2', {}, T.courses)),
        h('ul', { class: 'ds-fresh' }, courseGroups.map((g) => h('li', {},
          (g.href ? anchor : (l, p, ...k) => h('span', p, ...k))({ href: g.href }, { class: 'ds-fresh-row' },
            h('span', { class: 'ds-fresh-body' }, h('strong', {}, g.code), h('small', {}, g.name)), newBadge(g.docs.length)))))));

    return h('div', { class: 'ds' }, main, rail);
  }

  // ---------- dashboard data ----------

  // The course's subfolders as plain data (no parent links), so the course page can show them without opening InSIS.
  const slim = (nodes) => nodes.map((n) => ({ name: n.name, href: n.href, files: n.files, fresh: n.fresh, allFiles: n.allFiles, allNew: n.allNew, children: slim(n.children) }));

  function remember(d) {
    const prev = ipx.state.docserver || {};
    const tab = newTab(d.tabs);
    if (d.kind === 'tree') {
      ipx.state.docserver = {
        updated: Date.now(), source: here.href,
        newCount: tab?.count ?? d.roots.reduce((s, n) => s + n.allNew, 0),
        courses: d.courses.map((n) => ({ code: n.course.code, name: n.course.name, href: n.href, newCount: n.allNew, semester: n.course.semester,
          files: n.files, fresh: n.fresh, allFiles: n.allFiles, tree: slim(n.children) })),
        folders: d.folders,
      };
    } else {
      // The list is the truth for new documents: recount the known courses from it.
      const per = {};
      for (const doc of d.docs) {
        const code = (doc.folder?.id && prev.folders?.[doc.folder.id]) || doc.folder?.name.match(CODE_RE)?.[1];
        if (code) per[code] = (per[code] || 0) + 1;
      }
      ipx.state.docserver = {
        ...prev, updated: Date.now(), source: here.href,
        newCount: d.docs.length || tab?.count || 0,
        courses: (prev.courses || []).map((c) => ({ ...c, newCount: per[c.code] || 0 })),
      };
    }
    ipx.save();
  }

  // Background read (sync.js): parse a fetched page and store its data; nothing is drawn.
  (ipx.readers ||= {}).docserver = (fetched, url) => {
    doc = fetched; here = new URL(url);
    try { const data = parseTree() || parseNew(); if (data) remember(data); } finally { doc = document; here = location; }
  };

  ipx.ready.then(() => {
    const data = parseTree() || parseNew();
    if (!data) return;
    remember(data);
    const active = data.tabs.find((t) => t.active);

    if (data.kind === 'tree') {
      takeover({ key: 'docserver', css: 'pages/docserver.css', title: T.title, subtitle: active?.text || T.tree,
        build: () => buildTree(data) });
      return;
    }

    const page = doc.getElementById('str1');
    const slotted = page && data.form && data.docs.length && page.contains(data.form) ? [page] : null;
    if (slotted) {
      // Only the original "mark as read" form stays visible, shown on demand.
      ipx.ui.keepOnly(page, data.form);
      document.documentElement.classList.add('ipx-ds');
      styleSlotted('pages/docserver.css');
    }
    const state = {};
    takeover({ key: 'docserver', css: 'pages/docserver.css', title: T.title, subtitle: active?.text || T.fresh, slotted,
      build: () => (state.wrap = buildNew(data, state)) });
  });
})();
