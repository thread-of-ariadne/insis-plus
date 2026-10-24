// InSIS+ — topic sign-ups (student/temata_prihlasovani.pl). Treatment L in place (teardowns/courses.md §2.4 Topics).
// InSIS's page: the portal bar and a second tab row (Course topics · Final theses topics — the latter is a place in
// Study matters, so the row goes with the header), two help paragraphs, then four bold headings each with a help line
// and a table — Which topic(s) I am registered for · Which topic(s) I can register for · Rejections · Closed storages
// of topics — with the columns Course title · Group of topics · Announced for · Register until · Number of topics ·
// Topic · Put up by · Details, and a key of three sign-up icons. Registering for a topic is InSIS's control (in the
// row or on the group's detail page: not verified yet), so the tables stay InSIS's own: rows styled in place as list
// rows (the group as the title, "register until" with a countdown on the right, InSIS's Details link as a button),
// the icons as words, the empty tables and InSIS's help left out, Rejections and Closed folded behind one switch.
// Header (kit.section, drawn by generic.js): title Topic sign-ups, eyebrow All submissions — a page of the
// Submissions section (pages/submissions.js links it as a page action). Nothing is stored.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.kit || !ipx.lists) return;
  const { lang, clean, norm } = ipx;
  const { h, countdown, deadlineTone } = ipx.ui;
  const kit = ipx.kit;
  const nav = ipx.nav;
  const L = ipx.lists;
  const PATH = '/auth/student/temata_prihlasovani.pl';
  const locale = lang === 'cs' ? 'cs-CZ' : 'en-GB';

  const T = {
    cs: { title: 'Přihlašování na témata', mine: 'Moje témata', open: 'Můžete se přihlásit', rejected: 'Zamítnuté přihlášky', closed: 'Uzavřené skupiny témat',
      details: 'Témata', registered: (n) => `Přihlášeno: ${n}`, openN: (n) => `Otevřeno k přihlášení: ${n}`, closes: (d) => `končí ${d}`,
      only: 'jen přihlášeno', approved: 'schváleno', rejectedChip: 'zamítnuto',
      showFolded: (n) => `Zobrazit zamítnuté a uzavřené (${n})`, hideFolded: 'Skrýt zamítnuté a uzavřené',
      lead: 'Témata projektů a seminárních prací, která vypisují vyučující. Na téma se přihlásíte v InSIS (tlačítko Témata otevře skupinu); InSIS přihlášku uloží po vašem potvrzení.',
      empty: 'Pro vaše předměty teď nejsou vypsaná žádná témata.', emptyNext: 'Až vyučující otevře přihlašování na témata (projekt, seminární práce), skupina se objeví tady i s termínem, do kdy se lze přihlásit.' },
    en: { title: 'Topic sign-ups', mine: 'My topics', open: 'Open for sign-up', rejected: 'Rejected sign-ups', closed: 'Closed topic groups',
      details: 'Topics', registered: (n) => `Registered: ${n}`, openN: (n) => `Open for sign-up: ${n}`, closes: (d) => `closes ${d}`,
      only: 'signed up', approved: 'approved', rejectedChip: 'rejected',
      showFolded: (n) => `Show rejected and closed (${n})`, hideFolded: 'Hide rejected and closed',
      lead: 'Topics for projects and seminar papers that teachers put up. You sign up in InSIS (Topics opens the group); InSIS saves the sign-up when you confirm it.',
      empty: 'No topics are open for your courses right now.', emptyNext: 'When a teacher opens a topic sign-up (a project, a seminar paper), the group shows here with the date sign-up closes.' },
  }[lang];

  let found = null;

  kit.section({
    id: 'topics',
    css: ['pages/course-pages.css'],
    title: () => T.title,
    subtitle: () => nav.sectionLabel('courses.submissions'),
    pages: { [PATH]: null },
    views: () => [],
    node: () => 'courses.submissions',
    lead: () => found?.lead() || null,
  });

  // Which of InSIS's four tables: by the bold heading before it (Czech or English), else by position.
  const KINDS = [['mine', /registered for|jsem prihlasen|prihlasen/], ['open', /can register|mohu|lze/], ['rejected', /reject|zamit/], ['closed', /closed|uzavren/]];
  function headingOf(table) {
    for (let n = table.previousElementSibling, k = 0; n && k < 8; n = n.previousElementSibling, k++) {
      if (n.tagName === 'B') return n;
      if (n.tagName === 'TABLE') return null;
    }
    return null;
  }

  const ROLE = (t) => (/(group of topics|skupina temat|rozpis)/.test(t) ? 'title' : /(register until|prihlasovat do|do kdy)/.test(t) ? 'meta'
    : /(details|podrobnost|detail)/.test(t) ? 'act' : /^(topic|tema)$/.test(t) ? 'sub' : /(course|predmet)/.test(t) ? 'sub'
      : /(announced|vypsano|urceno)/.test(t) ? 'sub' : /(number|pocet)/.test(t) ? 'sub' : /(put up|vypsal|zadal)/.test(t) ? 'sub' : null);

  ipx.ready.then(() => {
    if (nav.route(document.baseURI.split('#')[0]).path !== PATH) return;
    const page = document.getElementById('str1');
    if (!page) return;
    const tables = [...page.querySelectorAll('table')].filter((t) => !t.classList.contains('portal_menu') && !t.closest('.uisLegend')
      && L.columns(t).some((x) => /(group of topics|skupina temat|rozpis)/.test(norm(x))));
    if (!tables.length) return;
    const now = new Date();
    const lists = tables.map((table, i) => {
      const b = headingOf(table);
      const kind = KINDS.find(([, re]) => re.test(norm(b?.textContent || '')))?.[0] || ['mine', 'open', 'rejected', 'closed'][i] || 'closed';
      const { rows } = L.mark(table, ROLE, { title: T[kind] });
      if (b) ipx.ui.hideInSlot([b]);
      const dates = [];
      for (const tr of rows) {
        const until = tr.querySelector('td[data-il-col="meta"]');
        const at = kit.dateOf(clean(until?.textContent));
        if (at) dates.push(at);
        // A countdown next to "register until" while sign-up is open (CSS ::after; the cell is untouched).
        if (until && at && at > now && kind !== 'closed') until.setAttribute('data-il-chip', countdown(at, now));
        if (until && at && at > now && kind !== 'closed') until.setAttribute('data-il-tone', deadlineTone(at, false, now));
        tr.querySelectorAll('td[data-il-col="act"] a[href]').forEach((a) => L.label(a, T.details));
        // InSIS's sign-up state icons, in words.
        for (const ic of tr.querySelectorAll('[data-sysid]')) {
          const sys = ic.getAttribute('data-sysid');
          const word = sys === 'pouze-prihlaseni' ? T.only : sys === 'prihlaseni-schvaleno' ? T.approved : sys === 'prihlaseni-zamitnuto' ? T.rejectedChip : null;
          if (word) L.label(ic, word);
        }
      }
      if (kind === 'rejected' || kind === 'closed') table.setAttribute('data-il-fold', '');
      return { kind, table, rows, dates };
    });
    const count = (k) => lists.filter((l) => l.kind === k).reduce((s, l) => s + l.rows.length, 0);
    const folded = count('rejected') + count('closed');
    const nextClose = lists.filter((l) => l.kind === 'open').flatMap((l) => l.dates).filter((d) => d > now).sort((a, b) => a - b)[0];
    const total = lists.reduce((s, l) => s + l.rows.length, 0);
    // InSIS's own clock time ("Mon 1 Feb 00:00", never "24:00 of the day before"), as on the other Courses pages.
    const stamp = (d) => `${d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })} ${d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;

    found = {
      lead: () => {
        const toggle = folded > 0 && h('button', { type: 'button', class: 'btn ghost', 'aria-expanded': 'false', onclick: (e) => {
          const on = document.documentElement.classList.toggle('ipx-il-unfold');
          e.currentTarget.setAttribute('aria-expanded', String(on));
          e.currentTarget.textContent = on ? T.hideFolded : T.showFolded(folded);
        } }, T.showFolded(folded));
        return h('div', { class: 'cp-lead' },
          total > 0 && h('p', { class: 'cp-facts' },
            h('span', { class: 'delta neutral' }, T.registered(count('mine'))),
            h('span', { class: `delta ${nextClose ? deadlineTone(nextClose, false, now) : 'neutral'}` }, T.openN(count('open'))),
            nextClose && h('span', { class: 'muted' }, T.closes(stamp(nextClose)))),
          total > 0 && h('p', { class: 'muted small' }, T.lead),
          // Nothing in any table: InSIS's four empty tables become one empty state.
          (count('mine') + count('open')) === 0 && h('div', { class: 'empty' }, h('p', {}, h('strong', {}, T.empty)), h('p', {}, T.emptyNext)),
          toggle && h('p', {}, toggle));
      },
    };
    L.chrome(page);
    L.on('ipx-topics');
  });
})();
