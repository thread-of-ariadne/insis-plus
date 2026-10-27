// InSIS+ — Exams › Exam dates (student/terminy_seznam.pl, four views) and the page of one date (terminy_info.pl).
//
// The list (treatment L in place, docs/ia/03-pages.md §2 "Moving InSIS's elements"; teardowns/exams-grades-schedule.md
// §2.1): InSIS's tables hold the sign-up and sign-off controls, so they stay InSIS's own DOM in InSIS's row order.
// This module only adds data attributes to InSIS's elements (the kind of each table, the column of each cell, the date
// and deadlines as readable text, a label for each icon link, the main link of each row) and pages/exams.css draws
// them as modern list rows: a date block, the course with its form and room, places, the deadlines in words, then
// InSIS's own controls. Nothing is moved, copied, wrapped, clicked or submitted. InSIS's help paragraphs, legends,
// column toggles, table toolboxes and decorative icons are hidden (the "How it works" line above the list says the
// same in a few words); an empty table shows the kit's empty state (drawn by CSS on InSIS's hidden table, so the
// table itself stays in the page). InSIS's Restrict form stays where InSIS put it, collapsed under Filter
// (03-pages.md §2, filter forms): the Filter button only toggles a data attribute on it.
//
// The header (title, the four view tabs) comes from the section registered below and is drawn by generic.js on every
// view, so it never changes between them; the summary line above the list is the section's lead.
//
// The page of one date (treatment R): InSIS's label/value table read into a facts page: when, where, places and the
// deadlines first, then what kind of date it is, and who may sign up (collapsed). InSIS's link to the students
// registered for the date is an InSIS-only page (the URL rule refuses it), so it stays InSIS's own element, slotted
// in a card (kit.page with `form`), never copied.
//
// No data is stored by this module.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.kit) return;
  const { clean, norm, lang } = ipx;
  const { h, icon, anchor, styleSlotted } = ipx.ui;
  const nav = ipx.nav;
  const kit = ipx.kit;
  const LIST = '/auth/student/terminy_seznam.pl';
  const INFO = '/auth/student/terminy_info.pl';

  const T = {
    cs: {
      tables: {
        registered: 'Kam jste přihlášeni', open: 'Kam se můžete přihlásit', closed: 'Kam se teď přihlásit nemůžete',
        attended: 'Termíny, které jste absolvovali', realised: 'Další proběhlé termíny vašich předmětů', unscheduled: 'Předměty zatím bez termínu',
      },
      empty: {
        registered: 'Zatím nejste přihlášeni na žádný termín.', open: 'Teď není žádný termín, na který se můžete přihlásit.',
        closed: 'Žádné takové termíny.', attended: 'V tomto období jste zatím žádný termín neabsolvovali.',
        realised: 'Žádné další proběhlé termíny.', unscheduled: 'Všechny vaše předměty už termíny mají.',
      },
      summary: {
        current: (a, b, c) => [`přihlášeno ${a}`, `${b} k přihlášení`, `${c} ${kit.plural(c, 'nedostupný', 'nedostupné', 'nedostupných')}`],
        past: (a, b) => [`${a} ${kit.plural(a, 'absolvovaný termín', 'absolvované termíny', 'absolvovaných termínů')}`, `${b} dalších proběhlých`],
        unscheduled: (a) => [`${a} ${kit.plural(a, 'předmět', 'předměty', 'předmětů')} zatím bez termínu`],
      },
      next: 'Nejbližší termín', offUntil: (d) => `odhlásit se lze do ${d}`,
      filter: 'Filtr', filtered: 'Zobrazeno jen', how: 'Jak to funguje',
      howCurrent: ['Na termín se přihlásíte a odhlásíte tlačítkem InSIS přímo v řádku termínu; InSIS se vás zeptá na potvrzení.',
        'Proč se na termín přihlásit nemůžete, ukáže „Proč ne“ u daného termínu.',
        'Kliknutím na řádek otevřete všechny podrobnosti o termínu.'],
      howPast: ['Proběhlé termíny tohoto období; výsledky zkoušek najdete ve Výsledcích.', 'Kliknutím na řádek otevřete podrobnosti o termínu.'],
      howUnscheduled: ['Vyučující tyto termíny zatím nevypsali; před zkouškovým obdobím je to běžné.'],
      places: 'míst', from: 'Přihlášení od', until: 'Přihlásit do', off: 'Odhlásit do',
      labels: { 'prohlizeni-info': 'Podrobnosti', 'studevid-nesplnene-povinnosti': 'Proč ne' },
      // the date page
      when: 'Kdy', where: 'Kde', placesKpi: 'Obsazenost', ofPlaces: (a, b) => `${a} z ${b}`, reserve: (r) => `rezerva ${r}`, reserveLabel: 'Rezerva',
      dates: 'Přihlašování', about: 'O termínu', who: 'Kdo se může přihlásit', more: 'Další údaje', registered: 'Přihlášení studenti',
      registeredLead: 'Seznam studentů přihlášených na tento termín ukazuje InSIS na své stránce.',
      signUpUntil: (d) => `Přihlásit se lze do ${d}`, signUpOpens: (d) => `Přihlašování začíná ${d}`, signUpClosed: 'Přihlašování skončilo',
      signOffUntil: (d) => `odhlásit se lze do ${d}`, signOffClosed: 'odhlásit se už nelze',
      minutes: 'min',
    },
    en: {
      tables: {
        registered: "Dates you're registered for", open: 'Open for sign-up', closed: "Dates you can't sign up for now",
        attended: 'Dates you sat', realised: 'Other past dates of your courses', unscheduled: 'Courses without dates yet',
      },
      empty: {
        registered: "You aren't registered for any date yet.", open: 'No date is open for you to sign up right now.',
        closed: 'No such dates.', attended: "You haven't sat any date this period yet.",
        realised: 'No other past dates.', unscheduled: 'All your courses have dates.',
      },
      summary: {
        current: (a, b, c) => [`${a} registered`, `${b} open for sign-up`, `${c} not available`],
        past: (a, b) => [`${a} ${a === 1 ? 'date' : 'dates'} sat`, `${b} other past ${b === 1 ? 'date' : 'dates'}`],
        unscheduled: (a) => [`${a} ${a === 1 ? 'course' : 'courses'} without a date yet`],
      },
      next: 'Next date', offUntil: (d) => `sign off until ${d}`,
      filter: 'Filter', filtered: 'Showing only', how: 'How it works',
      howCurrent: ["Sign up and sign off with InSIS's button in the date's row; InSIS asks you to confirm.",
        "Why you can't sign up for a date: open “Why not” on that date.",
        'Click a row to see everything about the date.'],
      howPast: ['Past dates of this period; exam results are in Results.', 'Click a row to see the details of the date.'],
      howUnscheduled: ["Teachers haven't put up dates for these courses yet; that's normal before the exam period."],
      places: 'places', from: 'Sign-up from', until: 'Sign up by', off: 'Sign off by',
      labels: { 'prohlizeni-info': 'Details', 'studevid-nesplnene-povinnosti': 'Why not' },
      when: 'When', where: 'Where', placesKpi: 'Places taken', ofPlaces: (a, b) => `${a} of ${b}`, reserve: (r) => `reserve ${r}`, reserveLabel: 'Reserve',
      dates: 'Sign-up', about: 'About this date', who: 'Who can sign up', more: 'More details', registered: 'Registered students',
      registeredLead: 'InSIS shows the students registered for this date on its own page.',
      signUpUntil: (d) => `Sign up by ${d}`, signUpOpens: (d) => `Sign-up opens ${d}`, signUpClosed: 'Sign-up has closed',
      signOffUntil: (d) => `sign off by ${d}`, signOffClosed: 'signing off has closed',
      minutes: 'min',
    },
  }[lang];
  const locale = lang === 'cs' ? 'cs-CZ' : 'en-GB';

  const VIEWS = nav.views['exams.mine'] || ['exams.mine', 'exams.signup', 'exams.past', 'exams.unscheduled'];
  const viewOf = (r) => (VIEWS.includes(r.node) ? r.node : 'exams.mine');

  // ---------- reading the list ----------

  // The kind of each table, by InSIS's decorative icon in the heading above it (dekorace-…), else by its columns.
  const KIND_BY_ICON = {
    'dekorace-terminy-prihlasene': 'registered', 'dekorace-terminy-prihlasovaci': 'open', 'dekorace-terminy-neprihlasovaci': 'closed',
    'dekorace-moje-terminy': 'attended', 'dekorace-terminy-ubehle': 'realised', 'dekorace-terminy-nevypsane': 'unscheduled',
  };
  // Column roles by InSIS's header text (diacritics removed, lowercase), Czech and English.
  const COLS = [
    ['num', /^(ord|por)\.?$/], ['attempt', /^(exm\.?\s*att\.?|zuc\.?)$/], ['status', /^(status|stav)$/], ['code', /^(code|kod)$/],
    ['name', /^(course|predmet)$/], ['period', /^(study period|obdobi)$/], ['date', /^(date of exam sitting|datum terminu)/],
    ['where', /^(where|kde)$/], ['form', /^(type \(form\)|druh \(forma\))/], ['by', /^(put up by|vypsal)$/],
    ['places', /^(registered|prihlaseno)$/], ['kind', /^(type of exam sitting|typ terminu)$/],
    ['deadlines', /^(registration from|prihlasovani od)/], ['info', /^(information|info)$/], ['actions', /^(actions|operace)$/],
    ['logout', /^(log out|unregister|odhlasit)$/], ['register', /^(register|prihlasit)$/], ['supervisor', /^(course supervisor|garant)$/],
  ];

  function kindOf(table, roles) {
    for (let el = ipx.kit.prev(table), i = 0; el && i < 12; el = ipx.kit.prev(el), i++) {
      if (el.tagName === 'TABLE') break;
      const sys = el.querySelector?.('[data-sysid^="dekorace-"]')?.getAttribute('data-sysid');
      if (sys && KIND_BY_ICON[sys]) return { kind: KIND_BY_ICON[sys], heading: el };
    }
    const kind = roles.includes('supervisor') ? 'unscheduled' : roles.includes('register') || roles.includes('status') ? 'open'
      : roles.includes('logout') ? 'registered' : roles.includes('attempt') ? 'attended' : roles.includes('actions') ? 'closed' : null;
    return { kind, heading: null };
  }

  // InSIS's key (uisLegend): icon → its words ("first sit", "required"), so icon-only cells can say what they mean.
  function legendWords(page) {
    const out = {};
    for (const tr of page.querySelectorAll('.uisLegend tr')) {
      const cells = [...tr.children].filter((c) => c.tagName === 'TD');
      if (cells.length !== 2 || cells[0].querySelector('table')) continue;
      const sys = cells[0].querySelector('[data-sysid]')?.getAttribute('data-sysid');
      const text = clean(cells[1].textContent);
      if (sys && text) out[sys] = text;
    }
    return out;
  }

  const day = (d) => d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  const stamp = (d) => `${day(d)} ${d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
  const weekday = (d) => d.toLocaleDateString(locale, { weekday: 'short' });
  // The three dates of the deadlines cell: InSIS writes them as text lines separated by <br> ("--" = not set).
  const linesOf = (td) => {
    const out = [''];
    for (const n of td.childNodes) {
      if (n.nodeName === 'BR') out.push('');
      else out[out.length - 1] += n.textContent;
    }
    return out.map(clean);
  };

  // A cell or block that holds a form control or an InSIS action link (one the URL rule refuses to copy) is never
  // hidden, whatever its column: InSIS may put a Register button or a new action column there when sign-up opens.
  const CONTROL = 'input:not([type="hidden"]), select, button, textarea';
  const hasAction = (el) => !!el.querySelector(CONTROL)
    || [...el.querySelectorAll('a[href]')].some((a) => !nav.safe(a.href, 'link', { copied: true }));
  const HIDDEN_COLS = new Set([null, undefined, 'num', 'period', 'by']);

  function markTable(table, words, now) {
    const headRow = table.tHead?.rows[0] || table.querySelector('tr.zahlavi');
    if (!headRow) return null;
    const heads = [...headRow.cells].map((c) => (c.classList.contains('UISTMNumberCell') ? 'num' : norm(c.textContent)));
    const roles = heads.map((t) => (t === 'num' ? 'num' : COLS.find(([, re]) => re.test(t))?.[0] || null));
    const { kind, heading } = kindOf(table, roles);
    if (!kind) return null;
    table.setAttribute('data-ipx-list', kind);
    table.setAttribute('data-ipx-title', T.tables[kind]);
    const rows = [...(table.tBodies[0]?.rows || [])];
    const empty = rows.length <= 1 && (!rows.length || (rows[0].cells.length === 1 && rows[0].cells[0].colSpan > 1));
    if (empty) {
      table.setAttribute('data-ipx-empty', '');
      rows[0]?.cells[0]?.setAttribute('data-ipx-empty-text', T.empty[kind]);
      return { kind, heading, rows: [] };
    }
    table.setAttribute('data-ipx-count', String(rows.length));
    const out = [];
    for (const tr of rows) {
      const cells = [...tr.cells];
      const offset = Math.max(0, cells.length - roles.length);
      const cell = {};
      cells.forEach((td, i) => {
        let role = td.classList.contains('UISTMNumberCell') || i < offset ? 'num' : roles[i - offset];
        if (HIDDEN_COLS.has(role) && hasAction(td)) role = 'act';
        if (!role) return;
        td.setAttribute('data-ipx-col', role);
        cell[role] = td;
      });
      const row = { tr, name: clean(cell.name?.querySelector('a')?.textContent || cell.name?.textContent), code: clean(cell.code?.textContent) };
      if (cell.date) {
        const d = kit.dateOf(cell.date.textContent);
        if (d) {
          row.date = d;
          cell.date.setAttribute('data-ipx-day', String(d.getDate()));
          cell.date.setAttribute('data-ipx-mon', d.toLocaleDateString(locale, { month: 'short' }));
          const time = /\d{1,2}:\d{2}/.exec(cell.date.textContent)?.[0];
          cell.date.setAttribute('data-ipx-time', [weekday(d), time].filter(Boolean).join(' '));
          if (d < now) tr.setAttribute('data-ipx-past', '');
        }
      }
      if (cell.deadlines) {
        const [from, until, off] = linesOf(cell.deadlines).map((t) => kit.dateOf(t));
        row.until = until; row.off = off;
        const parts = [
          from && from > now && `${T.from} ${stamp(from)}`,
          until && `${T.until} ${stamp(until)}`,
          off && `${T.off} ${stamp(off)}`,
        ].filter(Boolean);
        if (parts.length) cell.deadlines.setAttribute('data-ipx-dl', parts.join(' · '));
        // A deadline of the student's own date within two days (signing off, or signing up for an open date).
        const due = kind === 'registered' ? off : kind === 'open' ? until : null;
        if (due && due > now && due - now < 2 * 864e5) tr.setAttribute('data-ipx-due', '');
      }
      // "examination<br>(e-test)" is drawn as one line with a space (exams.css)
      if (cell.form) cell.form.setAttribute('data-ipx-text', linesOf(cell.form).filter(Boolean).join(' '));
      if (cell.places && /\d/.test(cell.places.textContent)) cell.places.setAttribute('data-ipx-unit', T.places);
      for (const role of ['kind', 'attempt']) {
        const sys = cell[role]?.querySelector('[data-sysid]')?.getAttribute('data-sysid');
        if (sys && words[sys]) cell[role].setAttribute('data-ipx-text', words[sys]);
      }
      // Icon-only links (details, why not, InSIS's own controls) get a word; the details link opens the row.
      for (const a of tr.querySelectorAll('td[data-ipx-col="info"] a, td[data-ipx-col="actions"] a, td[data-ipx-col="act"] a, td[data-ipx-col="logout"] a, td[data-ipx-col="register"] a')) {
        const sys = a.querySelector('[data-sysid]')?.getAttribute('data-sysid');
        const label = T.labels[sys] || clean(a.title) || clean(a.querySelector('[title]')?.getAttribute('title')) || clean(a.textContent);
        if (label) a.setAttribute('data-ipx-label', label);
      }
      const main = tr.querySelector('a[href*="terminy_info.pl"]') || (kind === 'unscheduled' && cell.name?.querySelector('a[href*="syllabus"]'));
      if (main) { main.setAttribute('data-ipx-main', ''); tr.setAttribute('data-ipx-link', ''); }
      out.push(row);
    }
    return { kind, heading, rows: out };
  }

  let list = null;

  // Marks InSIS's list page; returns what the summary needs. Runs once (the section's lead and the module both ask).
  function readList() {
    if (list) return list;
    const page = document.getElementById('str1');
    if (!page) return null;
    const now = new Date();
    const words = legendWords(page);
    const tables = [...page.querySelectorAll('table')].filter((t) => t.querySelector('tr.zahlavi, thead th') && !t.closest('.uisLegend'));
    const found = tables.map((t) => markTable(t, words, now)).filter(Boolean);
    if (!found.length) return null;
    // The box that holds all the lists (InSIS's table script may wrap a table in a div of its own).
    const marked = [...page.querySelectorAll('table[data-ipx-list]')];
    let container = marked[0].parentElement;
    while (container !== page && !marked.every((t) => container.contains(t))) container = container.parentElement;
    container.setAttribute('data-ipx-exams', '');
    const hide = (n) => n?.setAttribute('data-ipx-part', 'hide');
    // InSIS's chrome inside the list: the bold page heading, help lines, line breaks, column toggles, toolboxes,
    // the key, the decorative table headings (each table draws its own title) and the empty print forms.
    for (const el of container.children) {
      if (el.matches('.clm_main') || (el.matches('div.small, br, p, b, .jstm-toolbox, .uisLegend, .pseudostrap-activated') && !hasAction(el))) hide(el);
      else if (el.tagName === 'FORM' && !el.querySelector('table, select, input:not([type="hidden"]), button')) hide(el);
      else if (el.tagName === 'DIV' && el.querySelector(':scope > [data-sysid^="dekorace-"]') && !hasAction(el)) hide(el);
    }
    found.forEach((f) => f.heading && !hasAction(f.heading) && hide(f.heading));
    // Each table (or the form InSIS wraps it in) is one block, so the Available view can put the open dates first.
    for (const t of container.querySelectorAll('table[data-ipx-list]')) {
      let block = t;
      while (block.parentElement && block.parentElement !== container) block = block.parentElement;
      block.setAttribute('data-ipx-block', t.getAttribute('data-ipx-list'));
    }
    // InSIS's Restrict form: collapsed under Filter until the student opens it, open when a filter is active.
    const filter = [...container.querySelectorAll(':scope > form')].find((f) => f.querySelector('select[name^="filtr_"]'));
    let active = [];
    if (filter) {
      filter.setAttribute('data-ipx-filter', '');
      active = [...filter.querySelectorAll('select[name^="filtr_"]')].filter((s) => s.value && s.value !== '0')
        .map((s) => clean(s.selectedOptions[0]?.textContent)).filter(Boolean);
    }
    document.documentElement.classList.add('ipx-exams');
    document.documentElement.setAttribute('data-ipx-exams-view', viewOf(nav.route(document.baseURI.split('#')[0])).replace('exams.', ''));
    styleSlotted('pages/exams.css');
    const by = Object.fromEntries(found.map((f) => [f.kind, f.rows]));
    list = { by, filter, active };
    return list;
  }

  // The summary above the list: counts per table, the next registered date, Filter and How it works.
  function lead() {
    const r = nav.route(document.baseURI.split('#')[0]);
    if (r.path !== LIST) return null;
    const d = readList();
    if (!d) return null;
    const view = viewOf(r);
    const n = (k) => d.by[k]?.length || 0;
    const facts = view === 'exams.past' ? T.summary.past(n('attended'), n('realised'))
      : view === 'exams.unscheduled' ? T.summary.unscheduled(n('unscheduled'))
        : T.summary.current(n('registered'), n('open'), n('closed'));
    const now = new Date();
    const next = (d.by.registered || []).filter((x) => x.date && x.date >= now).sort((a, b) => a.date - b.date)[0];
    const how = view === 'exams.past' ? T.howPast : view === 'exams.unscheduled' ? T.howUnscheduled : T.howCurrent;
    const toggle = d.filter && h('button', { type: 'button', class: 'btn ghost ex-filter-btn', 'aria-expanded': String(!!d.active.length),
      onclick: (e) => {
        const open = !d.filter.hasAttribute('data-ipx-open');
        d.filter.toggleAttribute('data-ipx-open', open);
        e.currentTarget.setAttribute('aria-expanded', String(open));
      } }, icon('search'), h('span', {}, T.filter));
    if (d.filter && d.active.length) d.filter.setAttribute('data-ipx-open', '');
    return h('div', { class: 'ex-lead' },
      h('p', { class: 'ex-facts' }, facts.map((f, i) => [i ? h('span', { class: 'ex-dot', 'aria-hidden': 'true' }, '·') : null, h('span', {}, f)])),
      next && h('p', { class: 'kit-note info ex-next' }, icon('calendar'),
        h('span', {}, h('strong', {}, `${T.next}: `), `${next.name} · ${next.date.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })} ${next.date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`,
          next.off && next.off > now ? ` · ${T.offUntil(stamp(next.off))}` : '')),
      d.active.length > 0 && h('p', { class: 'kit-note warn' }, icon('alert'), h('span', {}, `${T.filtered}: ${d.active.join(' · ')}`)),
      h('div', { class: 'ex-tools' }, toggle,
        h('details', { class: 'ex-how' }, h('summary', {}, icon('info'), h('span', {}, T.how)),
          h('ul', {}, how.map((t) => h('li', {}, t))))));
  }

  // generic.js draws the list's views from this definition (InSIS's own tab rows hidden, the list in place).
  const section = kit.section({
    id: 'exams',
    title: () => nav.sectionLabel('exams.mine'),
    subtitle: () => nav.label('exams'),
    pages: { [LIST]: viewOf, [INFO]: null },
    views: () => VIEWS.map((node) => ({ id: node, href: nav.target(node), text: nav.label(node) })),
    css: 'pages/exams.css',
    lead,
  });

  // ---------- the page of one date ----------

  const NOT_SET = /^-+\s*(not entered|nezad\w*|neuveden\w*)\s*-+$|^(not set|nenastaven\w*)$/i;
  const LABELS = [
    ['course', /course|predmet/], ['by', /announced|vypsal/], ['kind', /^kind|^druh/], ['form', /^form of exam|^forma terminu|^forma zkousky/],
    ['duration', /duration|delka|trvani/], ['mytype', /your exam|vaseho terminu/], ['type', /^type of exam|^typ terminu/],
    ['date', /^date of exam|^datum terminu|^datum zkousky|^datum$/], ['venue', /venue|misto konani|mistnost/],
    ['from', /registration since|prihlasovani od|prihlaseni od/], ['until', /registration until|prihlasovani do|prihlaseni do/],
    ['off', /unregistration|odhlasovani|odhlaseni/], ['count', /just registered|prihlaseno|pocet prihlasenych/], ['limit', /limit|kapacita/],
    ['reserve', /reserve|rezerva/], ['programme', /^programme|^program/], ['studyForm', /^form of study|^forma studia/],
    ['character', /character|charakter|typ studia/], ['place', /place of teaching|misto vyuky/], ['group', /group|skupin/],
    ['isp', /^isp$/], ['tests', /tests|testy/], ['note', /^note|^poznamka/],
  ];
  const WHO = ['programme', 'studyForm', 'character', 'place', 'group', 'isp'];

  function readInfo() {
    const page = document.getElementById('str1');
    if (!page) return null;
    const pairs = kit.keyValues(page);
    if (pairs.length < 5) return null;
    const by = {};
    const rest = [];
    for (const p of pairs) {
      if (NOT_SET.test(p.value)) continue;
      const key = LABELS.find(([k, re]) => !(k in by) && re.test(norm(p.label)))?.[0];
      if (key) by[key] = p; else rest.push(p);
    }
    if (!by.course || !by.date) return null;
    // Only the cell of InSIS's text link is slotted: the table around it is a layout table (an icon row above the
    // link), and slotting the whole table drew a big blank card.
    const students = [...page.querySelectorAll('a[href*="spoluzaci=1"]')].filter((a) => clean(a.textContent)).at(-1)?.closest('td') || null;
    return { by, rest, students };
  }

  // The date page writes "01/02/2027, 09:00 (Mon)": the comma goes before kit.dateOf reads the time.
  const infoDate = (p) => (p ? kit.dateOf(p.value.replace(/(\d{4}),\s*/, '$1 ')) : null);

  function buildInfo(d, formCard) {
    const { by } = d;
    const now = new Date();
    const date = infoDate(by.date);
    const until = infoDate(by.until);
    const from = infoDate(by.from);
    const off = infoDate(by.off);
    const count = Number(by.count?.value);
    const limit = Number(by.limit?.value);
    // One date format on the whole page ("Mon 1 Feb 00:00"): the note and the Sign-up card say the same.
    const full = (x) => `${x.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })} ${x.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
    const status = from && from > now ? T.signUpOpens(full(from)) : until && until > now ? T.signUpUntil(full(until)) : until ? T.signUpClosed : null;
    const offText = off ? (off > now ? T.signOffUntil(full(off)) : T.signOffClosed) : null;
    const pair = (k) => by[k] && { label: by[k].label, value: by[k].value, links: by[k].links };
    // The Sign-up card in InSIS+'s words and format (InSIS's raw labels and "01/02/2027, 00:00 (Mon)" are not
    // repeated); the places are in the KPI above, so they appear here only when InSIS gives no limit.
    const hasLimit = Number.isFinite(limit) && limit > 0;
    const signUp = [
      from && { label: T.from, value: full(from) },
      until && { label: T.until, value: full(until) },
      off && { label: T.off, value: full(off) },
      !hasLimit && by.count && { label: T.placesKpi, value: by.count.value },
      !hasLimit && by.reserve && { label: T.reserveLabel, value: by.reserve.value },
    ].filter(Boolean);
    const kpis = h('div', { class: 'kpis' },
      date && ipx.ui.kpi({ label: T.when, value: date.toLocaleDateString(locale, { day: 'numeric', month: 'short' }), isText: true,
        foot: [date.toLocaleDateString(locale, { weekday: 'long' }), date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }), by.duration?.value].filter(Boolean).join(' · ') }),
      by.venue && ipx.ui.kpi({ label: T.where, value: by.venue.value, isText: true, foot: by.form?.value }),
      Number.isFinite(limit) && limit > 0 && ipx.ui.kpi({ label: T.placesKpi, value: T.ofPlaces(Number.isFinite(count) ? count : '–', limit), isText: true,
        status: Number.isFinite(count) && count >= limit ? { tone: 'bad', text: '100 %' } : null,
        foot: by.reserve ? T.reserve(by.reserve.value) : null }));
    const who = WHO.map(pair).filter(Boolean);
    return [
      kpis,
      (status || offText) && h('p', { class: `kit-note ${until && until > now ? 'info' : 'warn'}` }, icon('clock'), h('span', {}, [status, offText].filter(Boolean).join(' · '))),
      h('div', { class: 'kit-cols' },
        h('div', { class: 'kit-stack' },
          h('section', { class: 'card pad' }, h('h2', { class: 'card-title' }, T.about),
            kit.facts(['course', 'kind', 'type', 'mytype', 'form', 'duration', 'by', 'tests', 'note'].map(pair))),
          d.rest.length > 0 && h('section', { class: 'card pad' }, h('h2', { class: 'card-title' }, T.more), kit.facts(d.rest)),
          who.length > 0 && h('details', { class: 'card pad ex-who' }, h('summary', { class: 'card-title' }, T.who), kit.facts(who))),
        h('div', { class: 'kit-stack' },
          signUp.length > 0 && h('section', { class: 'card pad' }, h('h2', { class: 'card-title' }, T.dates), kit.facts(signUp)),
          d.students && formCard({ title: T.registered, lead: T.registeredLead }))),
    ];
  }

  ipx.ready.then(() => {
    const r = nav.route(document.baseURI.split('#')[0]);
    if (r.path === LIST) { readList(); return; } // generic.js frames it with the section header and the lead.
    if (r.path !== INFO) return;
    const d = readInfo();
    if (!d) return; // generic.js keeps InSIS's page under the section header
    const course = d.by.course.links?.[0]?.text || d.by.course.value;
    kit.page({
      key: 'exam-date',
      css: 'pages/exams.css',
      // A page below the section (03-pages.md rule 7): the date is the title, the section the eyebrow; the view tabs
      // stay, none marked, so the header around the list does not change.
      title: [course, d.by.kind?.value].filter(Boolean).join(' · '),
      subtitle: nav.sectionLabel('exams.mine'),
      tabs: kit.sectionTabs(section, null),
      form: d.students,
      build: ({ formCard }) => buildInfo(d, formCard),
    });
  });
})();
