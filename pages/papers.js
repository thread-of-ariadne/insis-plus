// InSIS+ — Study matters › Confirmations & decisions: three views of "my official papers" (03-pages.md §1 rule 5,
// teardowns/study-matters.md §2.4–2.7, §3.2), plus Verify a document below the section.
//   Get a confirmation  student/tisk_dokumentu.pl   L in place: InSIS's document links (each one generates a
//                                                    document: an action) styled as a matrix of tiles, never copied
//   Delivered to me     uloziste/                    L in place: InSIS's documents table (inside its filter form) as
//                                                    rows with a delivery state; Open stays InSIS's link
//   Printed             tisk/evidence_tisku.pl       L in place: InSIS's register; its search form collapsed under
//                                                    Filter (hidden, never trimmed or filled)
//   Verify a document   epd/                         R: InSIS's message or list redrawn (a page below the section)
// The three views share one header (kit.section; generic.js frames InSIS's content under it). On those pages this
// module only sets data attributes on InSIS's elements and adds pages/papers.css to the page; nothing inside a form
// is moved, copied, wrapped, filled or submitted. The summary line above each view is InSIS+'s (section lead).
// Nothing is stored.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.kit || !ipx.nav) return;
  const { lang, clean, norm } = ipx;
  const { h, icon, anchor, hideInSlot, styleSlotted } = ipx.ui;
  const kit = ipx.kit;
  const nav = ipx.nav;

  const T = {
    cs: { get: 'Vystavit potvrzení', delivered: 'Doručené dokumenty', printed: 'Vytištěné', verify: 'Ověřit dokument',
      getLead: 'Vyberte dokument a jazyk. Dokument s elektronickou pečetí VŠE lze poslat e-mailem a do hodiny se objeví v Doručených dokumentech; tisk je obyčejný dokument k vytištění.',
      sealed: 'S elektronickou pečetí (PDF)', plain: 'K vytištění',
      gloss: { confirmation: 'Že jste teď studentem VŠE', progress: 'Kredity a výsledky dosavadního studia', overview: 'Všechny předměty a známky' },
      docs: 'Dokumenty', docsN: (n) => `${n} ${kit.plural(n, 'dokument', 'dokumenty', 'dokumentů')}`,
      waitingN: (n) => `${n} z nich ${kit.plural(n, 'čeká', 'čekají', 'čeká')} na otevření`, noneWaiting: 'žádný z nich nečeká na otevření',
      inFolder: (folder, app) => [folder && `ve složce ${folder}`, app && `přihláška: ${app}`].filter(Boolean).join(', '), folder: 'Složka',
      openNote: 'Otevřením dokumentu InSIS zaznamená, že jste ho převzali.', open: 'Otevřít',
      waiting: 'Čeká na otevření', read: 'Doručeno, přečteno', delivering: 'Doručuje se', sealedChip: 'Zapečetěno',
      confirm: 'Potvrdíte převzetí', openedOn: 'Otevřeno', created: 'Vytvořeno',
      printedLead: (a, b) => `Dokumenty vytištěné z InSIS od ${a} do ${b}.`, printedAll: 'Dokumenty vytištěné z InSIS.',
      filter: 'Filtr', printouts: 'Výtisky', noPrintouts: 'V tomto období jste nic nevytiskli. Delší období nastavíte ve Filtru.',
      verifyLead: 'Ověření dokumentů, které VŠE vydala s elektronickou pečetí.', nothing: 'Nic tu není.', where: 'Kde ověřit dokument' },
    en: { get: 'Get a confirmation', delivered: 'Delivered to me', printed: 'Printed', verify: 'Verify a document',
      getLead: 'Pick the document and the language. A document with VŠE’s electronic seal can be sent by e-mail and appears under Delivered to me within an hour; a printout is a plain document to print.',
      sealed: 'With electronic seal (PDF)', plain: 'To print',
      gloss: { confirmation: 'That you are a VŠE student now', progress: 'Credits and results so far', overview: 'All your courses and grades' },
      docs: 'Documents', docsN: (n) => (n === 1 ? '1 document' : `${n} documents`),
      waitingN: (n) => `${n} of them waiting for you to open`, noneWaiting: 'none of them waiting for you to open',
      inFolder: (folder, app) => [folder && `in ${folder}`, app && `application: ${app}`].filter(Boolean).join(', '), folder: 'Folder',
      openNote: 'Opening a document records in InSIS that you have received it.', open: 'Open',
      waiting: 'Waiting for you', read: 'Delivered, read', delivering: 'Being delivered', sealedChip: 'Sealed',
      confirm: 'You confirm receipt', openedOn: 'Opened', created: 'Created',
      printedLead: (a, b) => `Documents printed from InSIS from ${a} to ${b}.`, printedAll: 'Documents printed from InSIS.',
      filter: 'Filter', printouts: 'Printouts', noPrintouts: 'You printed nothing in this period. Set a longer one under Filter.',
      verifyLead: 'Verification of documents VŠE issued with an electronic seal.', nothing: 'Nothing here.', where: 'Where to verify a document' },
  }[lang];

  // ---------- the section: one header on its three pages ----------

  // The portal's own link (it carries the study and period), else the plain address where the URL rule takes one.
  const link = (path, plain = path) => kit.portalLink(path) || nav.safe(new URL(plain, document.baseURI).href, 'link');
  let leadNode = null;
  const papers = kit.section({
    id: 'papers',
    title: () => nav.sectionLabel('studies.papers'),
    subtitle: () => nav.label('matters'),
    pages: { '/auth/student/tisk_dokumentu.pl': 'get', '/auth/uloziste/': 'delivered', '/auth/tisk/evidence_tisku.pl': 'printed' },
    views: () => [
      { id: 'get', href: link('/auth/student/tisk_dokumentu.pl'), text: T.get },
      { id: 'delivered', href: link('/auth/uloziste/', '/auth/uloziste/index.pl?rezim=2'), text: T.delivered },
      { id: 'printed', href: link('/auth/tisk/evidence_tisku.pl'), text: T.printed },
    ],
    lead: () => leadNode,
    // The storage's folders (Admission procedure · Study) are InSIS's own links, kept in the page body and drawn as a
    // captioned segmented control ("Folder [A | B]", papers.css), not as a second tab row (03-pages.md rule 1).
    keepRow: (t) => !!t.querySelector('a[href*="uloziste/"]'),
    css: ['pages/matters.css'],
  });

  // ---------- marking InSIS's tables ----------

  // A cell holding a form control or a link the URL rule would not copy (an InSIS action, a pop-up, a download) is
  // never hidden, whatever its column: it gets the role "act" and shows as a small labelled chip (papers.css).
  const CONTROL = 'input:not([type="hidden"]), select, button, textarea';
  const hasAction = (el) => !!el.querySelector(CONTROL) || [...el.querySelectorAll('a[href]')].some((a) => !nav.safe(a.href, 'link', { copied: true }));

  // Column roles by InSIS's header text (English and Czech), first match wins. `hidden`: the roles papers.css does
  // not show (their cells become "act" when they hold an action).
  function markColumns(table, cols, hidden = []) {
    const raw = [...table.querySelectorAll('thead th, tr.zahlavi > th, tr.zahlavi > td')].map((th) => clean(th.textContent));
    const heads = raw.map(norm);
    const roles = heads.map((t) => cols.find(([, re]) => re.test(t))?.[0] || null);
    for (const tr of table.querySelectorAll('tbody > tr')) {
      const cells = [...tr.children];
      if (cells.length === 1) { tr.setAttribute('data-ipx-empty', ''); continue; }
      // InSIS's script may add a row-number cell in front once the page has loaded: those are marked and hidden.
      const offset = Math.max(0, cells.length - roles.length);
      cells.forEach((td, i) => {
        let role = i < offset ? 'num' : roles[i - offset] || 'other';
        if ((role === 'num' || role === 'other' || hidden.includes(role)) && hasAction(td)) {
          role = 'act';
          // The chip's word: InSIS's own name for the icon link (its title or label), else the column's header.
          for (const a of td.querySelectorAll('a[href]')) {
            const ic = a.querySelector('[title], [aria-label]');
            const said = clean(ic?.getAttribute('aria-label')) || clean(ic?.getAttribute('title'));
            const head = raw[i - offset] || '';
            const word = said && head ? `${head}: ${said.toLowerCase()}` : said || head;
            a.setAttribute('data-ipx-act', clean(a.textContent) ? '' : word); // a link with its own words keeps them
          }
        }
        td.setAttribute('data-ipx-col', role);
      });
    }
    return roles;
  }
  const cellOf = (tr, role) => tr.querySelector(`:scope > [data-ipx-col="${role}"]`);
  const hideHelp = (root) => hideInSlot([...root.querySelectorAll('.small, .uisLegend')].filter((n) => !n.closest('table[data-ipx-list]')));

  // ---------- Get a confirmation ----------

  function markConfirmations(page) {
    const strips = [...page.querySelectorAll('.rada-ikon')].filter((r) => r.querySelector('a.app-ikona[href*="tisk"]'));
    if (!strips.length) return false;
    for (const strip of strips) {
      const links = [...strip.querySelectorAll('a.app-ikona[href]')];
      const sealed = links.some((a) => /_el=/.test(a.getAttribute('href')));
      // The layout table around the strip is the block (a card); InSIS's heading and help line above it go.
      const block = strip.closest('table') || strip;
      block.setAttribute('data-ipx-block', sealed ? 'sealed' : 'plain');
      block.setAttribute('data-ipx-title', sealed ? T.sealed : T.plain);
      for (let el = block.previousElementSibling, i = 0; el && i < 6; el = el.previousElementSibling, i++) {
        if (el.matches('b, .small, br, p')) el.setAttribute('data-ipx-keep', 'hide');
        if (el.tagName === 'B') break;
      }
      for (const a of links) {
        const href = a.getAttribute('href');
        const doc = /prehled/.test(href) ? 'overview' : /potvrz_prub/.test(href) ? 'progress' : 'confirmation';
        a.setAttribute('data-ipx-doc', doc);
        a.setAttribute('data-ipx-gloss', T.gloss[doc]);
        a.setAttribute('data-ipx-lang', /jazyk=eng/.test(href) ? 'EN' : 'CZ');
      }
    }
    document.documentElement.classList.add('ipx-keep');
    leadNode = h('div', { class: 'mx-bar' }, h('p', { class: 'muted mx-lead' }, T.getLead),
      (() => { const v = nav.safe(new URL('/auth/epd/index.pl', document.baseURI).href, 'link'); return v && anchor({ href: v }, { class: 'mx-toggle' }, icon('check'), h('span', {}, T.verify)); })());
    return true;
  }

  // ---------- Delivered to me ----------

  const DOC_COLS = [
    ['document', /^(document|dokument)$/], ['file', /^(file name|nazev souboru)/], ['seal', /^(e-seal|el\. pecet)/],
    ['sign', /^(e-signature|e-podpis)$/], ['note', /^(note|poznamka)/], ['size', /^(size|velikost)/], ['open', /^(display|zobrazit)$/],
    ['confirm', /^(confirmed|potvrzovany)/], ['posted', /^(announced|vyveseno)/], ['delivery', /^(delivery|doruceni)/],
    ['opened', /^(displayed|zobrazeno)$/], ['created', /^(created|vytvoreno)$/], ['by', /^(created by|vytvoril)/], ['app', /^(application id|id prihlasky)/],
  ];
  // InSIS's delivery icons (its key): not read yet = waiting for the student.
  const DELIVERY = { 'stav-doruceno-neprecteno': 'waiting', 'stav-doruceno-po-lhute-neprecteno': 'waiting', 'stav-dorucuje-se': 'delivering',
    'stav-doruceno-precteno': 'read', 'stav-doruceno-po-lhute-precteno': 'read' };

  function markStorage(page) {
    const table = [...page.querySelectorAll('form table')].find((t) => t.querySelector('a[href*="zobrazeni.pl"]') ||
      /^(document|dokument)$/.test(norm(t.querySelector('thead th, tr.zahlavi > th')?.textContent)));
    if (!table) return false;
    markColumns(table, DOC_COLS, ['file', 'sign', 'posted', 'by', 'app']);
    table.setAttribute('data-ipx-list', 'storage');
    table.setAttribute('data-ipx-title', T.docs);
    let total = 0;
    let waiting = 0;
    for (const tr of table.querySelectorAll('tbody > tr:not([data-ipx-empty])')) {
      total++;
      const state = DELIVERY[cellOf(tr, 'delivery')?.querySelector('[data-sysid]')?.getAttribute('data-sysid')] || '';
      if (state === 'waiting') waiting++;
      const delivery = cellOf(tr, 'delivery');
      if (state) { tr.setAttribute('data-ipx-state', state); delivery?.setAttribute('data-ipx-label', T[state]); }
      if (cellOf(tr, 'seal')?.querySelector('[data-sysid="stav-podepsano"]')) cellOf(tr, 'seal').setAttribute('data-ipx-label', T.sealedChip);
      if (/^(yes|ano)$/i.test(clean(cellOf(tr, 'confirm')?.textContent))) cellOf(tr, 'confirm').setAttribute('data-ipx-label', T.confirm);
      // Cells InSIS leaves blank (whitespace only) take no line in the row.
      for (const td of tr.children) if (!clean(td.textContent) && !td.querySelector('a, input, [data-sysid]')) td.setAttribute('data-ipx-blank', '');
      const opened = cellOf(tr, 'opened');
      if (clean(opened?.textContent)) opened.setAttribute('data-ipx-prefix', T.openedOn);
      const created = cellOf(tr, 'created');
      if (clean(created?.textContent)) created.setAttribute('data-ipx-prefix', T.created);
      const open = cellOf(tr, 'open')?.querySelector('a[href]');
      if (open) open.setAttribute('data-ipx-open', T.open);
    }
    // InSIS's filter (Application + Restrict) stays visible as a compact bar; its help lines and the key go.
    page.querySelector('table.form-edit')?.setAttribute('data-ipx-filter', '');
    hideHelp(page);
    [...page.querySelectorAll('form > b')].forEach((b) => b.setAttribute('data-ipx-keep', 'hide'));
    // The folder choice (InSIS's row of folder links) gets its caption; the summary says what it counts — this folder's
    // rows under InSIS's Application filter — so it never reads against InSIS's own count on a folder.
    const folders = [...page.querySelectorAll('table.portal_menu')].find((t) => t.querySelector('a[href*="uloziste/"]'));
    folders?.setAttribute('data-ipx-seg', T.folder);
    // (InSIS's count after the name, "(2)" or a badge its script draws later, is not part of the name)
    const folder = clean(folders?.querySelector('td.active a, b a')?.textContent).replace(/\s*\(?\d+\)?$/, '');
    const appSelect = page.querySelector('table.form-edit select');
    const app = appSelect && clean(appSelect.selectedOptions[0]?.textContent).replace(/^-+\s*|\s*-+$/g, '');
    leadNode = h('div', { class: 'kit-stack' },
      h('p', { class: 'muted mx-lead' }, h('b', {}, T.docsN(total)), ` ${T.inFolder(folder, app)}`.trimEnd(), ' · ',
        waiting ? h('b', { class: 'mx-warn' }, T.waitingN(waiting)) : T.noneWaiting),
      kit.note({ tone: 'info', text: T.openNote }));
    return true;
  }

  // ---------- Printed ----------

  const PRINT_COLS = [
    ['select', /^(sel\.?|ozn\.?|vyber)$/], ['type', /^(type of document|typ dokumentu)/], ['agenda', /^agenda/], ['study', /^(study|studium)$/],
    ['printed', /^(printed|vytisteno)/], ['person', /^(related to person|vztahuje se)/], ['marked', /^(marked as not released|oznacen)/],
    ['markedOn', /^(marked|oznaceno)$/], ['unreleased', /^(not released|neuvolnen)/], ['details', /^(details|detail)/], ['seal', /^(e-seal|el\. pecet)/],
    ['delivered', /^(delivered|doruceno)/], ['changed', /^(changed|zmeneno)$/], ['by', /^(changed by|zmenil)/],
  ];

  function markRegister(page) {
    const table = page.querySelector('table#data_table') || [...page.querySelectorAll('form table')].find((t) => /type of document|typ dokumentu/.test(norm(t.querySelector('thead, tr.zahlavi')?.textContent)));
    const search = [...page.querySelectorAll('form')].find((f) => f.querySelector('input[name="od"], select[name="agenda"]') && !f.contains(table));
    if (!table) return false;
    markColumns(table, PRINT_COLS, ['agenda', 'person', 'marked', 'markedOn', 'unreleased', 'delivered', 'changed', 'by']);
    table.setAttribute('data-ipx-list', 'register');
    table.setAttribute('data-ipx-title', T.printouts);
    const empty = table.querySelector('tbody > tr[data-ipx-empty] > td');
    empty?.setAttribute('data-ipx-label', T.noPrintouts);
    hideHelp(page);
    // The search form: hidden until the student opens Filter (InSIS+ only toggles a class on <html>; the form, its
    // values and its Restrict button are InSIS's, untouched).
    let toggle = null;
    if (search) {
      search.setAttribute('data-ipx-filter', 'collapsible');
      toggle = h('button', { type: 'button', class: 'mx-toggle', 'aria-expanded': 'false' }, icon('search'), h('span', {}, T.filter));
      toggle.addEventListener('click', () => {
        const on = !document.documentElement.hasAttribute('data-ipx-filter-open');
        document.documentElement.toggleAttribute('data-ipx-filter-open', on);
        toggle.setAttribute('aria-expanded', String(on));
      });
    }
    const from = clean(search?.querySelector('input[name="od"]')?.value);
    const to = clean(search?.querySelector('input[name="do"]')?.value);
    leadNode = h('div', { class: 'mx-bar' }, h('p', { class: 'muted mx-lead' }, from && to ? T.printedLead(from, to) : T.printedAll), toggle);
    return true;
  }

  // ---------- Verify a document (below the section, rule 7: titled by the page, the section as eyebrow) ----------

  function verifyPage(page) {
    const tables = kit.findTables(page).map((t) => kit.readTable(t)).filter((d) => d.rows.some((r) => r.cells.length > 1));
    const msgs = kit.messages(page);
    kit.page({
      key: 'verify', css: 'pages/matters.css', title: T.verify, subtitle: nav.sectionLabel('studies.papers'),
      build: () => [
        h('p', { class: 'muted mx-lead' }, T.verifyLead),
        tables.length ? tables.map((d) => kit.dataTable({ label: T.verify, columns: d.head.map((t, i) => ({ key: `c${i}`, label: t, main: i === 0 })),
          rows: d.rows.filter((r) => r.cells.length > 1).map((r) => Object.fromEntries(r.cells.map((c, i) => [`c${i}`, c.links.length === 1 ? c.links[0] : c.text]))) }))
          : h('div', { class: 'empty' }, h('p', {}, msgs.find((m) => m.tone === 'info')?.text || kit.looseText(page) || T.nothing)),
        ...msgs.filter((m) => tables.length || m.tone !== 'info').map(kit.note),
      ],
    });
  }

  ipx.ready.then(() => {
    const path = nav.route(document.baseURI.split('#')[0]).path;
    const page = document.getElementById('str1');
    if (!page) return;
    if (path === '/auth/epd/') { verifyPage(page); return; }
    const mark = { '/auth/student/tisk_dokumentu.pl': markConfirmations, '/auth/uloziste/': markStorage, '/auth/tisk/evidence_tisku.pl': markRegister }[path];
    // generic.js draws the header (this section) around InSIS's content after this; the marks only style it.
    if (mark?.(page)) {
      document.documentElement.classList.add('ipx-papers');
      styleSlotted('pages/papers.css');
    }
  });
})();
