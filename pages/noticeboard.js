// InSIS+ — Messages › Noticeboard (vyveska/, the "Contribution tree" view). Treatment L (docs/ia/03-pages.md,
// teardowns/campus-messages-account.md §2.12).
// InSIS shows its heading, a tab row (Contribution tree · New contributions (n) · My contributions · Settings), a help
// paragraph, a tree of ~60 folders in three levels with "(n)" after each name, Expand all / Collapse all and a key of
// rights icons. The folder links lead to vyveska/slozka.pl, which InSIS+ never opens or links itself (opening a folder
// may mark notices as read: `insis-only`), so the tree stays InSIS's own, in place: it is styled here as one card per
// unit with its folders as rows (CSS and data- attributes only; no node is moved, copied or rebuilt). Above it: how
// many new contributions there are and in which folders, read from the page. InSIS's tab row gives the view tabs
// (only links that pass the URL rule); Settings is a page action, not a view. The heading, help paragraph, the two
// buttons and the key are hidden while InSIS+ is on. Nothing is fetched: the noticeboard is `read: never`.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.ui || !ipx.nav) return;
  const { lang, clean } = ipx;
  const { h, icon, anchor, takeover, styleSlotted, hideInSlot, viewTabs } = ipx.ui;
  const nav = ipx.nav;

  const T = {
    cs: { fresh: (n) => (n === 1 ? '1 nový příspěvek' : n < 5 ? `${n} nové příspěvky` : `${n} nových příspěvků`), nothing: 'Na vývěsce není nic nového.',
      inFolders: (list) => `Ve složkách: ${list}.`, folders: (n, c) => `${n} ${ipx.kit.plural(n, 'složka', 'složky', 'složek')}, celkem ${c} ${ipx.kit.plural(c, 'příspěvek', 'příspěvky', 'příspěvků')}.`, newBadge: (n) => `${n} ${ipx.kit.plural(n, 'nový', 'nové', 'nových')}`,
      settings: 'Nastavení vývěsky', views: 'Vývěska', lead: 'Složku otevřete v InSIS; čísla v závorkách jsou počty příspěvků.' },
    en: { fresh: (n) => (n === 1 ? '1 new contribution' : `${n} new contributions`), nothing: 'Nothing new on the noticeboard.',
      inFolders: (list) => `In: ${list}.`, folders: (n, c) => `${n} folders, ${c} contributions in total.`, newBadge: (n) => `${n} new`,
      settings: 'Noticeboard settings', views: 'Noticeboard', lead: 'A folder opens in InSIS; the numbers are the contributions in it.' },
  }[lang];

  function parse() {
    const page = document.getElementById('str1');
    const tree = page?.querySelector('div.tree');
    const menu = page?.querySelector('table.portal_menu[data-pm-selected]');
    // Only the contribution tree (InSIS's selected tab "strom_prispevku"); Settings and other views keep the shell.
    if (!tree || menu?.getAttribute('data-pm-selected') !== 'strom_prispevku') return null;
    if (!tree.querySelector('a[href*="slozka.pl"]')) return null;

    // InSIS's tab row: views whose links pass the URL rule, Settings apart (a page action), counts kept.
    const tabs = [...menu.querySelectorAll('td[data-pm-sysid]')].map((td) => {
      const a = td.querySelector('a[href]');
      const m = /^(.*?)\s*\((\d+)\)$/.exec(clean(a?.textContent));
      return a && { sysid: td.getAttribute('data-pm-sysid'), href: nav.safe(a.href, 'link', { copied: true }),
        text: m ? m[1] : clean(a.textContent), count: m ? Number(m[2]) : null, on: !!td.querySelector('b a') };
    }).filter(Boolean);
    const settings = tabs.find((t) => t.sysid === 'nastaveni');
    const freshTab = tabs.find((t) => t.sysid === 'nove_prispevky');

    // Every folder label: "<a>Name</a> (n) <rights icon>"; new contributions are a bold number in the label.
    const folders = [...tree.querySelectorAll('.node-label')].map((label) => {
      const a = label.querySelector(':scope > a[href]');
      const count = /\((\d+)/.exec([...label.childNodes].filter((n) => n.nodeType === 3 || n.nodeName === 'B').map((n) => n.textContent).join(' '))?.[1];
      const fresh = [...label.querySelectorAll(':scope > b, :scope > strong')].map((b) => Number(/\d+/.exec(b.textContent)?.[0])).find((n) => n > 0) || 0;
      const container = label.closest('.node-container');
      return { label, container, name: clean((a || label).textContent).replace(/\s*\(\d+.*$/, ''), link: !!a,
        count: count == null ? null : Number(count), fresh, root: container?.classList.contains('root') };
    }).filter((f) => !f.root && f.name);

    // Views InSIS+ may not link (New and My contributions are insis-only until verified) are reachable only through
    // InSIS's own tab row: then that row stays, styled in place, and InSIS+ draws no tabs or Settings action of its own.
    const ownRow = tabs.some((t) => !t.href && t.sysid !== 'nastaveni');
    return {
      page, tree, menu, folders, ownRow,
      views: ownRow ? [] : tabs.filter((t) => t.href && t.sysid !== 'nastaveni'),
      settings: !ownRow && settings?.href ? settings : null,
      fresh: freshTab?.count ?? folders.reduce((s, f) => s + f.fresh, 0),
      chrome: [page.querySelector('#titulek'), !ownRow && menu, ...page.querySelectorAll('nav[aria-label="breadcrumb"], div.small, .uisLegend'),
        ...page.querySelectorAll('input[type="button"][id$="_open_all"], input[type="button"][id$="_close_all"]'),
        // InSIS's spacing around the tree (empty paragraphs, line breaks): the page's own gaps replace it.
        ...[...tree.parentElement.children].filter((n) => n !== tree && (n.nodeName === 'BR' || (n.nodeName === 'P' && !n.textContent.trim())))].filter(Boolean),
    };
  }

  // Data attributes for noticeboard.css: the count and the new-contributions badge become text the CSS can show
  // (InSIS writes them as bare text next to the link), levels and empty folders are marked.
  function mark(d) {
    d.tree.setAttribute('data-ipx-board', '');
    for (const f of d.folders) {
      f.label.setAttribute('data-ipx-kind', f.link ? 'folder' : 'group');
      if (f.count != null) f.label.setAttribute('data-ipx-count', String(f.count));
      if (f.fresh) f.label.setAttribute('data-ipx-new', T.newBadge(f.fresh));
      if (f.count === 0 && !f.fresh) f.label.setAttribute('data-ipx-empty', '');
    }
  }

  function summary(d) {
    // Folder names repeat across units ("Aktuality" in every faculty): name the unit too.
    const unitOf = (f) => {
      const top = f.label.closest('div.tree > ul > li')?.querySelector(':scope > .node-container .node-label');
      return top && top !== f.label ? d.folders.find((x) => x.label === top)?.name : null;
    };
    const freshFolders = d.folders.filter((f) => f.fresh).map((f) => (unitOf(f) ? `${f.name} (${unitOf(f)})` : f.name));
    const total = d.folders.reduce((s, f) => s + (f.count || 0), 0);
    const linked = d.folders.filter((f) => f.link).length;
    return h('div', { class: 'nb-summary' },
      h('p', { class: `kit-note ${d.fresh ? 'warn' : 'info'}` }, icon(d.fresh ? 'bell' : 'info'),
        h('span', {}, d.fresh ? [h('strong', {}, T.fresh(d.fresh)), freshFolders.length > 0 && ` ${T.inFolders(freshFolders.join(', '))}`] : T.nothing)),
      h('p', { class: 'muted small' }, [T.folders(linked, total), T.lead].join(' ')));
  }

  ipx.ready.then(() => {
    if (nav.route(document.baseURI.split('#')[0]).path !== '/auth/vyveska/') return;
    const data = parse();
    if (!data) return;
    mark(data);
    hideInSlot(data.chrome);
    styleSlotted('pages/noticeboard.css');
    takeover({
      key: 'noticeboard',
      css: ['kit.css', 'pages/noticeboard.css'],
      title: nav.sectionLabel('messages.noticeboard'),
      subtitle: nav.label('messages'),
      extra: data.settings && anchor({ href: data.settings.href }, { class: 'btn ghost' }, icon('gear'), h('span', {}, T.settings)),
      slotted: [data.page],
      build: () => h('div', { class: 'kit-page' },
        viewTabs(data.views, T.views),
        summary(data),
        h('slot')),
    });
  });
})();
