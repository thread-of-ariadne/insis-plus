// InSIS+ — Study matters › Thesis & state exam: thesis topics (student/zp_temata.pl), and Campus › Theses archive
// (zp/, zp/portal_zp.pl). Treatments from 03-pages.md §7 decision 4 and teardowns/study-matters.md §2.13.
//   Topics list   zp_temata.pl            L in place: InSIS's ≈270 rows (inside its filter form) styled as topic rows; the
//                                         filter collapsed under Filter; a text search over the rows (it only marks rows
//                                         with a data attribute, never touches InSIS's form); Detail is InSIS's link
//   Topic detail  zp_temata.pl?detail     F: the topic redrawn as facts and its summary; InSIS's Register form slotted
//                                         as a form card (InSIS+ never presses Register)
//   Archive       zp/, portal_zp.pl       InSIS's search forms in place under one header with InSIS's five views as view
//                                         tabs; InSIS's results, when shown, stay below in the shared styles
// Propose topic (zalozeni) and Select (vybrano) are action parameters: never linked by InSIS+. Course topics is a
// different place (Courses), linked from the summary line. Nothing is stored.
// One view, so no view tabs. 03-pages.md §7 decision 4 asks for "Faculty topics · Department topics"; a department's
// topics page (pracoviste/prehled_temat.pl?pracoviste=<id>) passes the URL rule, but it needs a department id and none
// is available here: zp_temata.pl names the supervising department as plain text (no link, no id), its tab rows carry
// only study and period, and a student belongs to no single department. A tab that guessed one would change the
// header to another section's, so instead the summary line links "Topics by department" to Campus › Departments,
// where every department has its Topics view.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.kit || !ipx.nav) return;
  const { lang, clean, norm } = ipx;
  const { h, icon, anchor, hideInSlot, styleSlotted } = ipx.ui;
  const kit = ipx.kit;
  const nav = ipx.nav;

  const T = {
    cs: { topics: 'Témata', search: 'Hledat v tématech, vedoucích, katedrách', filter: 'Filtr', courseTopics: 'Předmětová témata', archive: 'Archiv prací',
      count: (n, free) => `${n} ${kit.plural(n, 'téma', 'témata', 'témat')}, ${free} s volným místem`, showing: (n) => `zobrazeno ${n}`,
      onlyOne: 'Přihlásit se můžete jen k jednomu tématu.', filtered: (t) => `Jen: ${t}`, noMatch: 'Hledání neodpovídá žádné téma.',
      full: 'Obsazeno', taken: (a, b) => `obsazeno ${a} z ${b}`, open: (a) => `${a} přihlášeno · bez limitu`,
      type: { DT: 'Diplomová', DP: 'Diplomová', BT: 'Bakalářská', BP: 'Bakalářská' },
      detailLead: (mode) => `Tlačítkem InSIS Přihlásit se k tématu přihlásíte.${mode ? ` Režim přihlašování: ${mode}` : ''}`,
      byDept: 'Témata podle kateder', register: 'Přihlášení k tématu', summary: 'Anotace', facts: 'O tématu', inInsis: 'Akce v InSIS',
      formsLead: (mode) => `Tlačítka InSIS k tomuto tématu; InSIS jedná až po stisknutí tlačítka.${mode ? ` Režim přihlašování: ${mode}` : ''}`,
      archiveViews: { search: 'Hledání', department: 'Podle katedry', supervisor: 'Podle vedoucího', opponent: 'Podle oponenta', programme: 'Podle programu' },
      archiveLead: { search: 'Zadejte název, autora nebo klíčová slova a stiskněte Zobrazit: InSIS vypíše odpovídající práce.',
        other: 'Vyberte v InSIS, co chcete vidět, a stiskněte Zobrazit: InSIS vypíše práce.' },
      coverage: (a, b) => `Elektronicky jsou v archivu práce od ${a}${b ? ` a záznamy z obhajob od ${b}` : ''}.` },
    en: { topics: 'Topics', search: 'Search topics, supervisors, departments', filter: 'Filter', courseTopics: 'Course topics', archive: 'Theses archive',
      count: (n, free) => `${n} ${n === 1 ? 'topic' : 'topics'}, ${free} with free places`, showing: (n) => `showing ${n}`,
      onlyOne: 'You can be registered for one topic only.', filtered: (t) => `Only: ${t}`, noMatch: 'No topic matches the search.',
      full: 'Full', taken: (a, b) => `${a} of ${b} places taken`, open: (a) => `${a} registered · no limit`,
      type: { DT: 'Master’s', DP: 'Master’s', BT: 'Bachelor’s', BP: 'Bachelor’s' },
      detailLead: (mode) => `Press InSIS’s Register button to sign up for this topic.${mode ? ` Registration mode: ${mode}` : ''}`,
      byDept: 'Topics by department', register: 'Register for the topic', summary: 'Summary', facts: 'About the topic', inInsis: 'In InSIS',
      formsLead: (mode) => `InSIS’s own buttons for this topic; InSIS acts only when you press one.${mode ? ` Registration mode: ${mode}` : ''}`,
      archiveViews: { search: 'Search', department: 'By department', supervisor: 'By supervisor', opponent: 'By opponent', programme: 'By programme' },
      archiveLead: { search: 'Enter a name, author or key words and press Display: InSIS lists the matching theses.',
        other: 'Choose in InSIS what to see and press Display: InSIS lists the theses.' },
      coverage: (a, b) => `The archive holds electronic theses from ${a}${b ? ` and defence records from ${b}` : ''}.` },
  }[lang];

  let leadNode = null;

  // ---------- Thesis topics: one header (the section) on the list; the detail is a page below it ----------

  const thesis = kit.section({
    id: 'thesis',
    title: () => nav.sectionLabel('studies.thesis'),
    subtitle: () => nav.label('matters'),
    // The list in its variants (seznam / zaverecne / none) is the one view; a topic (detail) and InSIS's other steps
    // (propose, select) sit below it.
    pages: { '/auth/student/zp_temata.pl': (r) => (r.params && ['detail', 'zalozeni', 'vybrano'].some((p) => r.params.has(p)) ? null : 'topics') },
    views: () => [{ id: 'topics', href: kit.portalLink('/auth/student/zp_temata.pl'), text: T.topics }],
    lead: () => leadNode,
    css: ['pages/matters.css'],
  });

  const TOPIC_COLS = [
    ['num', /^(ord\.?|por\.?)$/], ['type', /^(type|typ)$/], ['topic', /^(topic|nazev tematu|tema)$/], ['supervisor', /^(thesis supervisor|vedouci prace)/],
    ['department', /^(supervising department|garantujici pracoviste)/], ['programme', /^(programme|program)$/], ['major', /^(major track|specializace|obor)/],
    ['capacity', /^(occupied|obsazeno)/], ['proposed', /^(proposed|navrzeno)/], ['detail', /^detail$/],
  ];

  const CONTROL = 'input:not([type="hidden"]), select, button, textarea';
  const hasAction = (el) => !!el.querySelector(CONTROL) || [...el.querySelectorAll('a[href]')].some((a) => !nav.safe(a.href, 'link', { copied: true }));

  function markTopics(page) {
    const table = [...page.querySelectorAll('form table')].find((t) => t.querySelector('a[href*="zp_temata.pl?detail"]') ||
      /topic|nazev tematu/.test(norm(t.querySelector('thead, tr.zahlavi')?.textContent)));
    if (!table) return false;
    const heads = [...table.querySelectorAll('thead th, tr.zahlavi > th')].map((th) => norm(th.textContent));
    const roles = heads.map((t) => TOPIC_COLS.find(([, re]) => re.test(t))?.[0] || 'other');
    table.setAttribute('data-ipx-list', 'topics');
    const rows = [];
    for (const tr of table.querySelectorAll('tbody > tr')) {
      const cells = [...tr.children];
      if (cells.length === 1) { tr.setAttribute('data-ipx-empty', ''); continue; }
      const offset = Math.max(0, cells.length - roles.length);
      cells.forEach((td, i) => {
        let role = i < offset ? 'num' : roles[i - offset];
        // A cell with a form control or an InSIS action link (one the URL rule refuses to copy) is never hidden.
        if (['num', 'other', 'proposed'].includes(role) && hasAction(td)) role = 'act';
        td.setAttribute('data-ipx-col', role);
        if (/^-*$/.test(clean(td.textContent)) && !td.querySelector('a')) td.setAttribute('data-ipx-blank', '');
      });
      const cell = (r) => tr.querySelector(`:scope > [data-ipx-col="${r}"]`);
      const type = clean(cell('type')?.textContent).toUpperCase();
      if (T.type[type]) cell('type').setAttribute('data-ipx-label', T.type[type]);
      // "0 / 1" (taken / max) or "0 / --" (no limit).
      const m = /(\d+)\s*\/\s*(\d+|-+)/.exec(clean(cell('capacity')?.textContent));
      let free = true;
      if (m) {
        const max = /\d/.test(m[2]) ? Number(m[2]) : null;
        free = max == null || Number(m[1]) < max;
        cell('capacity').setAttribute('data-ipx-label', max == null ? T.open(m[1]) : free ? T.taken(m[1], max) : T.full);
        if (!free) tr.setAttribute('data-ipx-full', '');
      }
      rows.push({ tr, free, text: norm(['topic', 'supervisor', 'department', 'programme', 'major'].map((r) => cell(r)?.textContent || '').join(' ')) });
    }

    // InSIS's filter (supervisor, department, Restrict) is inside the same form as the list: hidden until Filter is
    // opened (a class on <html>; the form is untouched). An active filter shows as "Only: …".
    const form = table.closest('form');
    const selects = [...form.querySelectorAll('select')];
    const go = form.querySelector('input[type="submit"]');
    const filterBox = selects[0] && [...form.children].find((c) => c.contains(selects[0]));
    filterBox?.setAttribute('data-ipx-filter', 'collapsible');
    go?.setAttribute('data-ipx-filter', 'collapsible');
    const active = selects.filter((s) => s.value && s.value !== '0').map((s) => clean(s.selectedOptions[0]?.textContent));
    // InSIS's message ("You can be registered for one topic only."), its help lines and tab rows: said in the summary.
    const msgs = [...page.querySelectorAll('.uis_msg')].filter((m) => !m.closest('form'));
    hideInSlot([...msgs, ...page.querySelectorAll('.small')]);

    const total = rows.length;
    const freeN = rows.filter((r) => r.free).length;
    const status = h('span', {}, T.count(total, freeN));
    const none = h('p', { class: 'muted mx-none', hidden: true }, T.noMatch);
    const input = h('input', { type: 'search', placeholder: T.search, 'aria-label': T.search, autocomplete: 'off' });
    input.addEventListener('keydown', (e) => e.stopPropagation());
    input.addEventListener('input', () => {
      const words = norm(input.value).split(' ').filter(Boolean);
      let shown = 0;
      for (const r of rows) {
        const ok = words.every((w) => r.text.includes(w));
        r.tr.toggleAttribute('data-ipx-out', !ok);
        if (ok) shown++;
      }
      status.textContent = words.length ? `${T.count(total, freeN)} · ${T.showing(shown)}` : T.count(total, freeN);
      none.hidden = shown > 0;
    });
    const toggle = h('button', { type: 'button', class: 'mx-toggle', 'aria-expanded': 'false' }, icon('list'), h('span', {}, T.filter));
    toggle.addEventListener('click', () => {
      const on = !document.documentElement.hasAttribute('data-ipx-filter-open');
      document.documentElement.toggleAttribute('data-ipx-filter-open', on);
      toggle.setAttribute('aria-expanded', String(on));
    });
    const courseTopics = [...page.querySelectorAll('table.portal_menu a[href*="temata_prihlasovani"]')].map(kit.linkOf).find(Boolean);
    const archive = nav.target('campus.theses');
    const departments = nav.target('campus.departments');
    leadNode = h('div', { class: 'kit-stack' },
      h('div', { class: 'mx-bar' },
        h('p', { class: 'muted mx-lead' }, h('b', {}, status), msgs.length ? ` · ${T.onlyOne}` : ''),
        h('span', { class: 'mx-links' },
          courseTopics && anchor({ ...courseTopics, text: T.courseTopics }, {}, T.courseTopics),
          departments && anchor({ href: departments }, {}, T.byDept),
          archive && anchor({ href: archive }, {}, T.archive)),
        toggle),
      active.length > 0 && kit.note({ tone: 'info', text: T.filtered(active.join(' · ')) }),
      h('label', { class: 'mx-filter' }, icon('search'), input),
      none);
    return true;
  }

  // Topic detail: "Basic information" (label/value rows) redrawn; every InSIS form with a field or button on the page
  // (Register, sign off, whatever InSIS offers for the topic) slotted as the form card. Several forms: their nearest
  // common box is slotted and everything in it that is not one of those forms is hidden (nothing moved or wrapped).
  function detailPage(page) {
    const forms = [...page.querySelectorAll('form')].filter((f) => f.querySelector('input:not([type="hidden"]), select, textarea, button'));
    let form = forms[0] || null;
    if (forms.length > 1) {
      form = forms[0].parentElement;
      while (form && form !== page && !forms.every((f) => form.contains(f))) form = form.parentElement;
      const keepForms = (box) => {
        for (const child of box.children) {
          if (forms.includes(child)) continue;
          if (forms.some((f) => child.contains(f))) keepForms(child); else hideInSlot([child]);
        }
      };
      keepForms(form);
    }
    const register = forms.length === 1 && !!forms[0].querySelector('input[name="prihlasit"]');
    const facts = [];
    for (const t of page.querySelectorAll('table')) {
      if (forms.some((f) => f.contains(t))) continue;
      if (t.closest('table.portal_menu') || t.querySelector('table, .zahlavi')) continue;
      for (const tr of t.rows) {
        if (tr.cells.length !== 2) continue;
        const label = kit.cellText(tr.cells[0]).replace(/:$/, '');
        const links = [...tr.cells[1].querySelectorAll('a[href]')].map(kit.linkOf).filter(Boolean);
        if (label) facts.push({ label, value: kit.cellText(tr.cells[1]), links });
      }
    }
    if (!facts.length) return false;
    const pick = (re) => facts.find((f) => re.test(norm(f.label)));
    const topic = pick(/^(topic|tema|nazev)/);
    const summary = pick(/^(summary|anotace|abstrakt)/);
    const mode = pick(/^(registration mode|rezim)/);
    const msgs = kit.messages(page);
    if (form) hideInSlot(forms.flatMap((f) => [...f.querySelectorAll('.small, br')]));
    if (form) { forms.forEach((f) => f.setAttribute('data-ipx-card', '')); styleSlotted('pages/matters-slot.css'); }
    const shown = facts.filter((f) => f !== topic && f !== summary && f !== mode && f.value);
    kit.page({
      key: 'thesis-topic', css: 'pages/matters.css',
      title: topic?.value || nav.sectionLabel('studies.thesis'),
      subtitle: nav.sectionLabel('studies.thesis'),
      form,
      build: ({ formCard }) => [
        ...msgs.filter((m) => m.tone !== 'info').map(kit.note),
        h('div', { class: 'kit-cols' },
          h('div', { class: 'kit-stack' },
            h('section', { class: 'card pad' }, h('h2', { class: 'card-title' }, T.facts), kit.facts(shown)),
            summary?.value && h('section', { class: 'card pad' }, h('h2', { class: 'card-title' }, T.summary), h('p', { class: 'mx-text' }, summary.value))),
          h('div', { class: 'kit-stack' },
            form && formCard(register ? { title: T.register, lead: T.detailLead(mode?.value) } : { title: T.inInsis, lead: T.formsLead(mode?.value) }),
            ...msgs.filter((m) => m.tone === 'info').map(kit.note))),
      ],
    });
    return true;
  }

  // ---------- Theses archive (Campus): one tool, five views ----------

  const ARCHIVE_VIEWS = { vyhledavani: 'search', pracoviste: 'department', vedouci: 'supervisor', oponent: 'opponent', program: 'programme' };
  const archiveLink = (key) => nav.safe(new URL(`/auth/zp/portal_zp.pl?prehled=${key}`, document.baseURI).href, 'link');
  kit.section({
    id: 'theses',
    title: () => nav.sectionLabel('campus.theses'),
    subtitle: () => nav.label('campus'),
    pages: { '/auth/zp/': 'search', '/auth/zp/portal_zp.pl': (r) => ARCHIVE_VIEWS[r.params?.get('prehled')] || 'search' },
    views: () => Object.entries(ARCHIVE_VIEWS).map(([key, id]) => ({ id, text: T.archiveViews[id], href: archiveLink(key) || (id === 'search' && nav.target('campus.theses')) })),
    lead: () => leadNode,
    css: ['pages/matters.css'],
  });

  function markArchive(page) {
    const form = page.querySelector('form[action*="/zp/"]');
    if (!form) return false;
    const route = nav.route(document.baseURI.split('#')[0]);
    const view = ARCHIVE_VIEWS[route.params?.get('prehled')] || 'search';
    form.setAttribute('data-ipx-card', 'inplace');
    form.setAttribute('data-ipx-stack', '');
    // Groups of checkboxes (type, faculty, year, language) sit in one layout table: drawn as wrapping columns.
    for (const t of form.querySelectorAll('table')) {
      if (t.classList.contains('form-edit') || !t.querySelector('table.form-edit')) continue;
      t.setAttribute('data-ipx-groups', '');
      // InSIS's spacer cells between the groups would take grid columns of their own.
      for (const td of t.rows[0]?.cells || []) if (!td.querySelector('input, select')) td.setAttribute('data-ipx-blank', '');
    }
    // InSIS's two notices (since when theses and defence records are archived) become one line; help lines go.
    const msgs = [...page.querySelectorAll('.uis_msg')];
    const dates = msgs.map((m) => (/(\d{1,2}[./]\s*\d{1,2}[./]\s*\d{4})/.exec(m.textContent) || [])[1]).filter(Boolean);
    hideInSlot([...msgs, ...page.querySelectorAll('.small')].filter((n) => !n.closest('form') || n.matches('.small')));
    leadNode = h('div', { class: 'kit-stack' },
      h('p', { class: 'muted mx-lead' }, view === 'search' ? T.archiveLead.search : T.archiveLead.other),
      dates.length ? h('p', { class: 'muted small' }, T.coverage(dates[0], dates[1])) : null);
    return true;
  }

  ipx.ready.then(() => {
    const route = nav.route(document.baseURI.split('#')[0]);
    const page = document.getElementById('str1');
    if (!page) return;
    if (route.path === '/auth/student/zp_temata.pl') {
      if (route.params?.has('detail')) { detailPage(page); return; }
      if (markTopics(page)) { document.documentElement.classList.add('ipx-thesis'); styleSlotted('pages/thesis.css'); }
      return;
    }
    if (route.path === '/auth/zp/' || route.path === '/auth/zp/portal_zp.pl') {
      if (markArchive(page)) { document.documentElement.classList.add('ipx-thesis'); styleSlotted('pages/matters-slot.css'); styleSlotted('pages/thesis.css'); }
    }
  });
})();
