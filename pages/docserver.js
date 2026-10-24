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
//   updated: Date.now(), source: location.href,
//   newCount: number | null,                      // "New documents (N)" from the tab row (or the list length)
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
      byCourseTab: 'Podle předmětů', treeTab: 'Strom dokumentů', searchTab: 'Hledat', views: 'Pohledy na materiály', settings: 'Nastavení', myFolders: 'Moje složky',
      byCourse: 'Novinky ve vašich předmětech', byCourseNews: (c) => `Nové soubory v: ${c}. Podle předmětů je máte pohromadě.`,
      allHint: 'Všechny složky, které vám InSIS ukazuje. Složky s novými dokumenty jsou rozbalené.',
      expand: 'Rozbalit vše', collapse: 'Sbalit vše', filter: 'Hledat složku…', noMatch: 'Žádná složka neodpovídá.',
      storage: 'Vaše úložiště', open: 'Rozbalit',
      latest: 'Poslední', today: 'dnes', yesterday: 'včera', refresh: 'Aktualizovat',
      emptyNew: 'Nemáte žádné nové dokumenty.', inCourses: 'Ve složkách předmětů', ofCourses: (n) => `${n} ${ipx.kit.plural(n, 'předmět', 'předměty', 'předmětů')}`,
      perCourse: 'Podle předmětů', otherFolders: (n) => `${n} v ostatních složkách (fakulta, škola)`,
      markLead: 'Seznam je původní seznam InSIS. Otevřený dokument se v něm už znovu neukáže. Více dokumentů najednou označíte jako přečtené zaškrtnutím a tlačítkem InSIS pod seznamem.',
      treeTip: 'Předměty u nových dokumentů InSIS+ pozná, až jednou otevřete Strom dokumentů.' },
    en: { tag: 'new', fresh: 'New documents', newBadge: (n) => `${n} new`,
      inside: (n) => `${n} new ${n === 1 ? 'document' : 'documents'} in subfolders`,
      files: (n) => `${n} ${n === 1 ? 'file' : 'files'}`,
      byCourseTab: 'By course', treeTab: 'Document tree', searchTab: 'Search', views: 'Views of your materials', settings: 'Settings', myFolders: 'My folders',
      byCourse: 'News in your courses', byCourseNews: (c) => `New files in ${c}. By course shows them together.`,
      allHint: 'Every folder InSIS shows you. Folders with new documents are open.',
      expand: 'Expand all', collapse: 'Collapse all', filter: 'Find a folder…', noMatch: 'No folder matches.',
      storage: 'Your storage', open: 'Expand',
      latest: 'Latest', today: 'today', yesterday: 'yesterday', refresh: 'Refresh',
      emptyNew: 'You have no new documents.', inCourses: 'In course folders', ofCourses: (n) => `${n} ${n === 1 ? 'course' : 'courses'}`,
      perCourse: 'By course', otherFolders: (n) => `${n} in other folders (faculty, university)`,
      markLead: 'This is InSIS\'s own list. A document you open no longer shows up in it. To mark several as read at once, tick them and press InSIS\'s button under the list.',
      treeTip: 'InSIS+ can tell the courses of new documents once you have opened the Document tree.' },
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
          linkOr(n.href, { class: 'ds-name', title: n.name }, n.name),
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

    // The quota as one quiet line, in InSIS's own words ("Quota 40 MiB · Occupied 0.0 B (0 %) · Free 40.0 MiB").
    const quotaLine = d.quota && h('p', { class: 'muted ds-quota' }, `${T.storage}: `,
      d.quota.map((r) => `${r.label} ${r.value}${r.extra ? ` ${r.extra}` : ''}`).join(' · '));

    return h('div', { class: 'ds' },
      materials.tabs(d.kind === 'tree' ? 'tree' : 'new'),
      // Summary: which of the student's courses have new files; the files themselves are one tab away.
      withNews.length > 0 && h('a', { class: 'card ds-pointer', href: nav.composedUrl('courses.files') },
        h('span', { class: 'ds-pointer-text' }, h('strong', {}, T.byCourse),
          h('small', {}, T.byCourseNews(withNews.map((n) => n.course.code).join(', ')))),
        newCount > 0 && newBadge(newCount), icon('arrow')),
      h('div', { class: 'ds-tools' },
        h('label', { class: 'ds-filter-wrap' }, icon('search'), filter),
        h('button', { class: 'ds-btn', type: 'button', onclick: () => all(true) }, T.expand),
        h('button', { class: 'ds-btn', type: 'button', onclick: () => all(false) }, T.collapse)),
      h('p', { class: 'muted ds-sub' }, T.allHint),
      h('div', { class: 'card ds-whole' }, whole, noMatch),
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
  function labelCells(table) {
    const heads = [...(table?.querySelectorAll('thead th, tr.zahlavi > th') || [])].map((th) => clean(th.textContent).replace(/\s*\(.*$/, ''));
    for (const tr of table?.querySelectorAll('tbody tr') || []) {
      [...tr.children].forEach((td, i) => { if (heads[i]) td.setAttribute('data-ipx-label', heads[i]); });
    }
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

  // Every other page of the document server (Search, a folder, DS settings, My folders) gets the same Materials
  // header through the section registry (kit.section in course.js), drawn by generic.js around InSIS's content.

  ipx.ready.then(() => {
    const data = parseTree() || parseNew();
    if (!data) return;
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
      document.documentElement.classList.add('ipx-ds');
      styleSlotted('pages/docserver.css');
    }
    takeover({ ...common, slotted, build: () => buildNew(data) });
  });
})();
