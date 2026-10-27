// InSIS+ — a document server folder (dok_server/slozka.pl). Treatment L in place (docs/ia/04-materials.md §4.3):
// InSIS's page holds the documents table and the subfolders table inside its own forms, with the pager, "View
// information" and the download link (an action) in the rows. Nothing of that is moved, copied or rebuilt: this module
// only marks InSIS's elements with data attributes (the column of each cell, the file type, read/new, the highlighted
// document) and folder.css draws them as a modern file list — subfolders first as folder rows, then each document as
// one row (type badge, name, comment, author and date, "new"), with InSIS's own download link stretched over the row,
// the pager as buttons, the folder's actions as quiet buttons at the bottom. The header and the path come from the
// section registry (course.js: the course when reached from the course, else Materials › All folders), drawn by
// generic.js around this content.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.ui || !ipx.nav) return;
  const { lang, clean, norm } = ipx;
  const nav = ipx.nav;

  const T = {
    cs: { fresh: 'nový', files: 'Soubory', folders: 'Složky', actions: 'Akce se složkou', admins: 'Složku spravují', info: 'Podrobnosti' },
    en: { fresh: 'new', files: 'Files', folders: 'Folders', actions: 'Folder actions', admins: 'Folder administered by', info: 'Details' },
  }[lang];

  // Column roles by InSIS's header text (Czech and English).
  const DOC_COLS = [
    ['state', /^$/], ['name', /^(name|nazev)$/], ['comment', /^(comments?|komentar)$/], ['author', /^(entered by|vlozil)$/],
    ['date', /^(document date|datum dokumentu)$/], ['modified', /^(modifications?|modifikace)$/], ['info', /^(display|zobrazit)$/],
    ['modify', /^(modify|upravit)$/], ['stats', /^(statistics|statistika)$/], ['file', /^(attachment|priloha)$/],
    ['change', /^(change attachment|zmenit prilohu)$/],
  ];
  const DIR_COLS = [
    ['select', /^(sel\.?|ozn\.?)$/], ['name', /^(name|nazev)$/], ['english', /^(english name|anglicky nazev)$/],
    ['changed', /^(last change|posledni zmena)$/], ['modify', /^(modify|upravit)$/], ['enter', /^(enter folder|vstup do slozky)$/],
  ];

  function markTable(table, cols, kind) {
    const heads = [...table.querySelectorAll('thead th, tr.zahlavi > th')].map((th) => norm(clean(th.textContent)));
    const roles = heads.map((t) => cols.find(([, re]) => re.test(t))?.[0] || null);
    table.setAttribute('data-ipx-list', kind);
    for (const tr of table.querySelectorAll('tbody > tr')) {
      // InSIS's script adds a row-number cell ("1.") in front of the cells once the page has loaded: the extra
      // leading cells are marked as numbers (hidden) and the roles shift by as many.
      const cells = [...tr.children];
      const offset = Math.max(0, cells.length - roles.length);
      cells.forEach((td, i) => {
        const role = i < offset ? 'num' : roles[i - offset];
        if (role) td.setAttribute('data-ipx-col', role);
      });
    }
    return roles;
  }

  ipx.ready.then(() => {
    if (nav.route(document.baseURI.split('#')[0]).path !== '/auth/dok_server/slozka.pl') return;
    const page = document.getElementById('str1');
    if (!page) return;
    const tables = [...page.querySelectorAll('form table')].filter((t) => t.querySelector('tr.zahlavi, thead th'));
    const docs = tables.find((t) => t.querySelector('a[href*="download="], [data-sysid^="stav-"], [data-mime]')) ||
      tables.find((t) => /comments?|komentar/.test(norm(t.querySelector('thead, tr.zahlavi')?.textContent || '')));
    const dirs = tables.find((t) => t !== docs && /enter folder|vstup do slozky/.test(norm(t.querySelector('thead, tr.zahlavi')?.textContent || '')));
    const hl = /[#&]ipx-file=(\d+)/.exec(location.hash)?.[1] || null;
    // The place the folder was opened from (course.js): the course page, Materials › By course, or none (All folders).
    const ctx = /[#&]ipx-in=(course|bycourse)\b/.exec(location.hash)?.[1] || null;

    if (docs) {
      markTable(docs, DOC_COLS, 'docs');
      docs.setAttribute('data-ipx-title', T.files);
      for (const tr of docs.querySelectorAll('tbody > tr')) {
        const file = tr.querySelector('[data-ipx-col="file"] a[href]');
        const mime = file?.querySelector('[data-mime]')?.getAttribute('data-mime') || '';
        if (file) {
          file.setAttribute('data-ipx-mime', mime ? mime.slice(0, 4).toUpperCase() : '↓');
          tr.setAttribute('data-ipx-has-file', '');
        }
        // InSIS's read state icon: anything but "read" (stav-precteno) counts as new.
        const state = tr.querySelector('[data-ipx-col="state"] [data-sysid]')?.getAttribute('data-sysid') || '';
        if (state && state !== 'stav-precteno') tr.setAttribute('data-ipx-new', T.fresh);
        tr.querySelector('[data-ipx-col="info"] a')?.setAttribute('title', T.info);
        // The document asked for (#ipx-file=<id>, digits only): compared with each row's download id, never used
        // as a selector.
        if (hl && file && nav.parse(file.href)?.params.get('download') === hl) {
          tr.setAttribute('data-ipx-hl', '');
          requestAnimationFrame(() => tr.scrollIntoView({ block: 'center' }));
        }
      }
      const form = docs.closest('form');
      form?.setAttribute('data-ipx-block', 'docs');
      // Inside InSIS's form, only marks: its sort control (and the help line before it), the two pagers (the top one
      // is hidden: one pager, under the list), the count line.
      const sort = form?.querySelector('select');
      if (sort) {
        // The highest box around the control that holds neither the list nor a pager (InSIS wraps the whole form
        // in divs, so the nearest div may be everything).
        let box = sort;
        while (box.parentElement && box.parentElement !== form && !box.parentElement.contains(docs) && !box.parentElement.querySelector('ul.paginator')) box = box.parentElement;
        box.setAttribute('data-ipx-part', 'sort');
        // InSIS puts the select and its button straight into the form: the button is marked too.
        const go = [...form.querySelectorAll('input[type="submit"], button')].find((b) => box === sort ? b.previousElementSibling === sort : box.contains(b));
        go?.setAttribute('data-ipx-part', 'sort-go');
        let help = box.previousElementSibling;
        while (help && help.tagName === 'BR') help = help.previousElementSibling;
        if (help?.classList.contains('small')) help.setAttribute('data-ipx-part', 'sort-help');
      }
      // InSIS's "Mark all items on page as read" / "… in folder as read": two different submits, drawn side by side
      // under the list as quiet buttons (InSIS's own controls, only marked: the box that holds each, as a child of
      // the form, so the grid can place it).
      for (const b of form?.querySelectorAll('input[type="submit"], button[type="submit"]') || []) {
        if (b.getAttribute('data-ipx-part') || b.closest('[data-ipx-part="sort"]')) continue;
        let box = b;
        while (box.parentElement && box.parentElement !== form) box = box.parentElement;
        if (box.contains(docs) || box.querySelector('ul.paginator')) continue;
        box.setAttribute('data-ipx-part', 'mark-box');
        b.setAttribute('data-ipx-mark', '');
      }
      const pagers = [...(form?.querySelectorAll('ul.paginator') || [])];
      if (pagers.length > 1) pagers[0].setAttribute('data-ipx-part', 'pager-top');
      [...(form?.querySelectorAll(':scope > .small') || [])].find((d) => /\d/.test(d.textContent))?.setAttribute('data-ipx-part', 'count');
    }
    if (dirs) {
      markTable(dirs, DIR_COLS, 'folders');
      dirs.setAttribute('data-ipx-title', T.folders);
      // A course's folder opened from the course or from Materials › By course: a subfolder of the same course opens
      // in that place too. Only the fragment of InSIS's link is extended (#ipx-in=…), which changes nothing requested.
      const courseFolders = ipx.state.docserver?.folders || {};
      for (const tr of dirs.querySelectorAll('tbody > tr')) {
        const sel = tr.querySelector('[data-ipx-col="select"]');
        if (sel && !sel.querySelector('input')) sel.setAttribute('data-ipx-empty', '');
        const enter = tr.querySelector('[data-ipx-col="enter"] a[href]');
        const id = enter && nav.parse(enter.href)?.params.get('id');
        if (ctx && id && courseFolders[id] && !enter.getAttribute('href').includes('#')) enter.setAttribute('href', `${enter.getAttribute('href')}#ipx-in=${ctx}`);
        // The folder's name as the course page writes it: InSIS's English name in English (when it has one), and a
        // timetable name in its readable form (course.js folderLabel); drawn by folder.css, the cell keeps its text.
        const nameTd = tr.querySelector('[data-ipx-col="name"]');
        const raw = (lang === 'en' && clean(tr.querySelector('[data-ipx-col="english"]')?.textContent)) || clean(nameTd?.textContent);
        const label = ipx.folderLabel?.(raw) || raw;
        if (nameTd && label && label !== clean(nameTd.textContent)) nameTd.setAttribute('data-ipx-text', label);
      }
      // The subfolders block (its "list of subfolders" line and its form) comes first, as in any file browser.
      const form = dirs.closest('form');
      // No subfolders: the whole block (and InSIS's "0 - 0 of 0" line) is left out.
      form?.setAttribute('data-ipx-block', dirs.querySelector('tbody > tr a[href*="slozka.pl"]') ? 'folders' : 'folders-empty');
      let line = form?.previousElementSibling;
      while (line && line.tagName === 'BR') line = line.previousElementSibling;
      if (line?.classList.contains('small')) line.setAttribute('data-ipx-block', dirs.querySelector('tbody > tr a[href*="slozka.pl"]') ? 'folders-line' : 'folders-empty');
    }

    // A document's details (View information) stay in the same place as its folder: the same fragment on InSIS's own
    // link (it changes nothing that is requested; the details page reads it, course.js).
    if (ctx) {
      for (const a of page.querySelectorAll('a[href*="dokumenty_cteni.pl"]')) {
        if (!a.getAttribute('href').includes('#')) a.setAttribute('href', `${a.getAttribute('href')}#ipx-in=${ctx}`);
      }
    }

    // The folder's administrators line (InSIS's intro paragraph) and the actions row ("Transactions in folder").
    const intro = [...page.querySelectorAll(':scope div.small')].find((d) => d.querySelector('a[href*="clovek.pl"]'));
    intro?.setAttribute('data-ipx-block', 'admins');
    // Read as one line, "Folder administered by: A, B" (folder.css shows only InSIS's own links of the paragraph).
    intro?.setAttribute('data-ipx-label', T.admins);
    const ops = page.querySelector('.rada-ikon[data-rada="ds-operace_slozky"]');
    if (ops) {
      ops.parentElement.setAttribute('data-ipx-block', 'ops');
      ops.setAttribute('data-ipx-title', T.actions);
      // InSIS's heading and help line above the actions: shown by the block's own title instead.
      let el = ipx.kit.prev(ops.parentElement);
      for (let i = 0; el && i < 6; i++, el = ipx.kit.prev(el)) {
        if (el.tagName === 'B' || el.classList.contains('small')) { el.setAttribute('data-ipx-block', 'ops-head'); if (el.tagName === 'B') break; }
      }
    }
    page.querySelectorAll('ul.paginator').forEach((ul) => ul.setAttribute('data-ipx-pager', ''));
    // The flex container that holds the blocks (so folder.css can put the subfolders first).
    const body = (dirs || docs)?.closest('form')?.parentElement;
    body?.setAttribute('data-ipx-folder', '');
    document.documentElement.classList.add('ipx-folder');
    ipx.ui.styleSlotted('pages/folder.css');
  });
})();
