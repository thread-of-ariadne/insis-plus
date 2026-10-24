// InSIS+ — Schedule › Academic calendar: Key dates (student/harmonogram.pl, three steps) and Teaching weeks
// (ca/prehled_tydnu.pl). Treatment R (docs/ia/03-pages.md §3; teardowns/exams-grades-schedule.md §2.9, §3.7).
//
// One section with two views (kit.section): the header (title, the two view tabs) is the same on every page of it.
//
// Key dates, harmonogram.pl:
// - ?vyber_fakulty=1: InSIS's faculty picker (div.vyber-fakult a.fakulta, links with logos) → faculty cards, the
//   student's own faculty first;
// - ?fakulta=… (and no parameters): "More than one period has been found. Select one." (Study period · Beginning ·
//   End · View) → a list of periods, the current one marked;
// - ?fakulta=…;obdobi=…(;studium=…): the period's schedule, a "tree" table (table.strom) whose rows carry either a
//   period boundary (first cell, a date) or an event (a date or date range, then its label). Empty rows only space
//   the time line. Rows in italics belong to this period but take place in another (InSIS's help says so).
//   → a summary (Now / Next, the current teaching week) and the events as a time line grouped by month, each with
//   a category chip from its label, past events dimmed. InSIS's link to the current period (its info box) is the
//   lead line; "Other period" and "Other faculty" (InSIS's own breadcrumb links) sit on that line in the page body.
// All of these are plain GET links (no forms): the original is hidden, every link is InSIS's own through the URL rule.
//
// Teaching weeks, prehled_tydnu.pl: InSIS's weeks (slotted under the header, InSIS's chrome hidden) or, mostly, its
// "No study period with active courses" boxes → one empty state that says what that means and links Key dates
// (InSIS's own sentence is not repeated under it).
//
// One fixed header on every page of the section: the same two view tabs (Key dates · Teaching weeks) and no page
// actions. The weeks tab is not dropped when the weeks page was empty (rule 8): that made the tab set differ between
// the pages of one section. Nothing is stored.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.kit) return;
  const { lang, clean, norm } = ipx;
  const { h, anchor, icon, takeover, styleSlotted, hideInSlot, cover, facultyColors, facultyOf } = ipx.ui;
  const kit = ipx.kit;
  const nav = ipx.nav;
  const PATH = '/auth/ca/prehled_tydnu.pl';
  const CAL = '/auth/student/harmonogram.pl';

  const T = {
    cs: { keyDates: 'Důležitá data', weeks: 'Výukové týdny', views: 'Harmonogram',
      empty: 'Přehled výukových týdnů je teď prázdný.',
      why: 'InSIS tento přehled sestaví jen tehdy, když pro vaše studium najde období s aktivními předměty, a teď žádné nenašel. Na vaši výuku ani rozvrh to nemá vliv.',
      instead: 'Začátek a konec výuky, zkouškové období a další termíny najdete v harmonogramu.',
      open: 'Otevřít harmonogram',
      otherPeriod: 'Jiné období', otherFaculty: 'Jiná fakulta', current: 'Zobrazit aktuální období',
      pickFaculty: 'Vyberte fakultu, jejíž harmonogram chcete vidět.', pickPeriod: 'Vyberte období.',
      faculties: 'Fakulty', units: 'Další součásti', yours: 'vaše fakulta', nowPeriod: 'probíhá',
      now: 'Teď', next: 'Další', inDays: (n) => (n === 0 ? 'dnes' : n === 1 ? 'zítra' : `za ${n} ${kit.plural(n, 'den', 'dny', 'dní')}`),
      untilDay: (d) => `do ${d}`, teachingWeek: (n) => `${n}. výukový týden`,
      events: 'Události období', none: 'InSIS pro toto období neuvádí žádné události.', otherTime: 'probíhá v jiném období',
      note: 'Předměty jiných fakult se mohou řídit harmonogramem své fakulty.',
      cat: { reg: 'zápis', teach: 'výuka', exams: 'zkoušky', holiday: 'volno', admit: 'přijímačky', deadline: 'termín', other: 'událost' } },
    en: { keyDates: 'Key dates', weeks: 'Teaching weeks', views: 'Academic calendar',
      empty: 'There are no teaching weeks to show right now.',
      why: "InSIS builds this overview only when it finds a study period with active courses for your study, and right now it found none. This doesn't affect your classes or your timetable.",
      instead: 'When teaching starts and ends, the exam period and other dates are in the academic calendar.',
      open: 'Open the academic calendar',
      otherPeriod: 'Other period', otherFaculty: 'Other faculty', current: 'Show the current period',
      pickFaculty: 'Choose the faculty whose calendar you want to see.', pickPeriod: 'Choose a period.',
      faculties: 'Faculties', units: 'Other units', yours: 'your faculty', nowPeriod: 'now',
      now: 'Now', next: 'Next', inDays: (n) => (n === 0 ? 'today' : n === 1 ? 'tomorrow' : `in ${n} days`),
      untilDay: (d) => `until ${d}`, teachingWeek: (n) => `Teaching week ${n}`,
      events: 'Events of the period', none: 'InSIS lists no events for this period.', otherTime: 'held in another period',
      note: "Courses taught by other faculties may follow their faculty's calendar.",
      cat: { reg: 'registration', teach: 'teaching', exams: 'exams', holiday: 'holiday', admit: 'admissions', deadline: 'deadline', other: 'event' } },
  }[lang];
  const locale = lang === 'cs' ? 'cs-CZ' : 'en-GB';
  const here = () => nav.route(document.baseURI.split('#')[0]);

  // One header for both views of the section (kit.section): Key dates (harmonogram.pl) and Teaching weeks (this
  // page), the same two tabs on every page.
  const plainLink = (path) => nav.safe(new URL(path, document.baseURI).href, 'link');
  // The weeks overview needs the study and period: the student's own link (portal), this page's address on the weeks
  // page, else the study and period of this page's address or of one of InSIS's links on it — through the URL rule.
  function weeksHref() {
    const portal = kit.portalLink(PATH);
    if (portal) return portal;
    if (here().path === PATH) return nav.safe(document.baseURI.split('#')[0], 'link', { copied: true });
    const sources = [document.baseURI, ...[...document.querySelectorAll('#str1 a[href*="studium="]')].map((a) => a.href)];
    for (const src of sources) {
      const p = nav.parse(src)?.params;
      const studium = p?.get('studium');
      const obdobi = p?.get('obdobi');
      if (!/^\d+$/.test(studium || '') || !/^\d+$/.test(obdobi || '')) continue;
      const href = nav.safe(new URL(`${PATH}?studium=${studium};obdobi=${obdobi}`, document.baseURI).href, 'link');
      if (href) return href;
    }
    return null;
  }
  const calendar = kit.section({
    id: 'calendar',
    title: () => nav.sectionLabel('schedule.calendar'),
    subtitle: () => nav.label('schedule'),
    pages: { [CAL]: 'key', [PATH]: 'weeks' },
    views: () => {
      const key = nav.target('schedule.calendar');
      const weeks = weeksHref();
      return [
        { id: 'key', href: key && nav.route(key).path !== PATH ? key : plainLink(CAL), text: T.keyDates },
        weeks && { id: 'weeks', href: weeks, text: T.weeks },
      ];
    },
  });

  // ---------- Key dates: reading InSIS's steps ----------

  const day = (d) => d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  const dayStart = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const daysTo = (d, now) => Math.round((dayStart(d) - dayStart(now)) / 864e5);
  const allDates = (text) => [...(text || '').matchAll(/(\d{1,2})(?:\.\s*|\/)(\d{1,2})(?:\.\s*|\/)(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/g)]
    .map((m) => new Date(+m[3], +m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0)));

  // Category of an event by its label, Czech and English (InSIS gives no category of its own).
  const CATS = [
    ['admit', /prihlask|e-application|admission|prijim|pre-?enrol|predzapis|potvrzen/],
    ['exams', /zkous|exam|zapoct|credit test/],
    ['reg', /registra|zapis|enrol/],
    ['holiday', /prazdnin|holiday|vacation|volno|svat|rektorsk|dean|dekansk|innovation day|den inovac/],
    ['teach', /vyuk|teaching|semestr|lecture|classes/],
  ];
  const categoryOf = (label, single) => CATS.find(([, re]) => re.test(norm(label)))?.[0] || (single ? 'deadline' : 'other');

  function readSchedule(page) {
    const tree = page.querySelector('table.strom');
    if (!tree) return null;
    const events = [];
    const bounds = [];
    for (const tr of tree.rows) {
      const cells = [...tr.cells];
      if (cells.length < 4) continue;
      const first = clean(cells[0].textContent);
      if (first && allDates(first).length) { bounds.push(allDates(first)[0]); continue; }
      const when = clean(cells[2].textContent);
      const label = clean(cells[3].textContent);
      const dates = allDates(when);
      if (!label || !dates.length) continue;
      const style = (cells[3].getAttribute('style') || '') + (cells[2].getAttribute('style') || '');
      events.push({ label, from: dates[0], to: dates[1] || null, other: /italic/.test(style), cat: categoryOf(label, dates.length === 1) });
    }
    const bolds = [...page.querySelectorAll('b')].filter((b) => !b.closest('table, nav, #titulek')).map((b) => clean(b.textContent));
    const faculty = bolds.find((t) => /:/.test(t))?.split(':').slice(1).join(':').trim() || '';
    const period = bolds.find((t) => /\d{4}\/\d{4}/.test(t))?.replace(/^\S+\s+(period\s+)?/i, '') || '';
    const current = [...page.querySelectorAll('.uis_msg a[href]')].map(kit.linkOf).find(Boolean) || null;
    // Boundaries: the first and the last date in the axis column, without today's mark (InSIS shows today there too).
    const today = dayStart(new Date()).getTime();
    const edge = bounds.filter((d) => dayStart(d).getTime() !== today);
    return { kind: 'schedule', events: events.sort((a, b) => a.from - b.from), faculty, period, current, range: edge.length >= 2 ? [edge[0], edge.at(-1)] : null };
  }

  function readPeriods(page) {
    const table = page.querySelector('table#tmtab_1') || kit.findTables(page)[0];
    if (!table) return null;
    const t = kit.readTable(table);
    const col = (re) => t.head.findIndex((x) => re.test(norm(x)));
    const name = col(/^(study period|obdobi)$/); const from = col(/^(beginning|zacatek)/); const to = col(/^(end|konec)/);
    if (name < 0) return null;
    const rows = t.rows.map((r) => ({ text: r.cells[name]?.text, from: r.cells[from]?.text, to: r.cells[to]?.text,
      link: r.cells.flatMap((c) => c.links).find((l) => /harmonogram\.pl/.test(l.href)) })).filter((r) => r.text && r.link);
    const faculty = [...page.querySelectorAll('b')].map((b) => clean(b.textContent)).find((x) => /:/.test(x) && !/\d{4}/.test(x))?.split(':').slice(1).join(':').trim() || '';
    return rows.length ? { kind: 'periods', rows, faculty } : null;
  }

  function readFaculties(page) {
    const links = [...page.querySelectorAll('.vyber-fakult a.fakulta[href]')];
    if (links.length < 2) return null;
    const units = links.map((a) => {
      const l = kit.linkOf(a);
      if (!l) return null;
      const logo = a.querySelector('img')?.getAttribute('src') || '';
      const code = /fakulta=(\d+)/.exec(a.getAttribute('href'))?.[1];
      const fac = kit.FACULTY_BY_LOGO[logo.match(/\/(ffu|fmv|fph|fis|fnh|fmh)-/)?.[1]] || kit.FACULTY_BY_CODE[code] || '';
      return { href: l.href, text: clean(a.querySelector('.nazev')?.textContent) || l.text, fac };
    }).filter(Boolean);
    return units.length ? { kind: 'faculties', units } : null;
  }

  // InSIS's breadcrumbs give the two picker steps ("Select faculty", "Select period"): the page actions.
  function pickers(page) {
    const links = [...page.querySelectorAll('.breadcrumb-item a[href*="harmonogram.pl"]')];
    const of = (re) => links.find((a) => re.test(a.getAttribute('href'))) && kit.linkOf(links.find((a) => re.test(a.getAttribute('href'))));
    return { faculty: of(/vyber_fakulty/), period: of(/fakulta=\d+(?!.*obdobi)/) };
  }

  // ---------- Key dates: drawing ----------

  function eventRow(e, now) {
    const end = e.to || e.from;
    const past = end < now;
    const live = !past && e.from <= now;
    const when = e.to ? `${day(e.from)} – ${day(e.to)}` : day(e.from);
    return h('li', { class: 'wk-event' + (past ? ' past' : '') + (live ? ' live' : '') + (e.cat === 'exams' ? ' exams' : '') },
      h('span', { class: 'wk-when' }, when),
      h('span', { class: 'wk-what' }, h('strong', {}, e.label), e.other && h('small', {}, T.otherTime)),
      h('span', { class: `wk-cat c-${e.cat}` }, T.cat[e.cat]));
  }

  // InSIS's picker steps (Other period, Other faculty) as small links on the page's path line: the section has no
  // page actions, so its header is the same on every page.
  const pickLinks = (pick, kind) => [kind === 'schedule' && pick.period && anchor(pick.period, { class: 'wk-pick' }, icon('calendar'), h('span', {}, T.otherPeriod)),
    pick.faculty && anchor(pick.faculty, { class: 'wk-pick' }, icon('layers'), h('span', {}, T.otherFaculty))].filter(Boolean);

  function buildSchedule(d, pick) {
    const now = new Date();
    const live = d.events.filter((e) => e.from <= now && (e.to || e.from) >= now && e.to);
    const next = d.events.find((e) => e.from > now);
    const teach = d.events.find((e) => e.cat === 'teach' && e.to && e.from <= now && now <= e.to);
    const week = teach ? Math.floor((dayStart(now) - dayStart(teach.from)) / (7 * 864e5)) + 1 : null;
    const months = new Map();
    for (const e of d.events) {
      const key = e.from.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
      if (!months.has(key)) months.set(key, []);
      months.get(key).push(e);
    }
    return [
      h('p', { class: 'wk-path' },
        [d.faculty, d.period].filter(Boolean).map((t, i) => [i ? h('span', { class: 'wk-sep', 'aria-hidden': 'true' }, '·') : null, h('strong', {}, t)]),
        d.current && anchor(d.current, { class: 'wk-current' }, T.current, icon('arrow')),
        h('span', { class: 'wk-picks' }, pickLinks(pick, 'schedule'))),
      (live.length > 0 || next || week) && h('div', { class: 'kpis wk-kpis' },
        week && ipx.ui.kpi({ label: T.now, value: T.teachingWeek(week), isText: true, foot: teach.label }),
        !week && live[0] && ipx.ui.kpi({ label: T.now, value: live[0].label, isText: true, foot: T.untilDay(day(live[0].to)) }),
        next && ipx.ui.kpi({ label: T.next, value: next.label, isText: true, foot: `${day(next.from)} · ${T.inDays(daysTo(next.from, now))}` })),
      d.events.length
        ? h('section', { class: 'card wk-timeline' }, [...months].map(([m, list]) => [
          h('h3', { class: 'wk-month' }, m),
          h('ul', { class: 'wk-events' }, list.map((e) => eventRow(e, now)))]))
        : ipx.ui.emptyState(T.none),
      h('p', { class: 'muted small' }, T.note),
    ];
  }

  function buildPeriods(d, pick) {
    const now = new Date();
    const isNow = (r) => { const a = kit.dateOf(r.from); const b = kit.dateOf(r.to); return !!(a && b && a <= now && now < b); };
    return [
      h('p', { class: 'wk-path' }, d.faculty && h('strong', {}, d.faculty), h('span', { class: 'wk-picks' }, pickLinks(pick, 'periods'))),
      h('p', { class: 'muted wk-lead' }, T.pickPeriod),
      h('ul', { class: 'card wk-list' }, d.rows.map((r) => h('li', {}, anchor(r.link, { class: 'wk-row' },
        h('span', { class: 'wk-row-main' }, h('strong', {}, r.text), isNow(r) && h('span', { class: 'delta ok' }, T.nowPeriod)),
        h('span', { class: 'wk-row-meta' }, [r.from, r.to].filter(Boolean).join(' – ')),
        icon('arrow'))))),
    ];
  }

  function buildFaculties(d) {
    const mine = facultyOf(ipx.state.studyRecord?.period || '') || facultyOf(ipx.state.studyRecord?.study || '');
    const facs = d.units.filter((u) => u.fac).sort((a, b) => (b.fac === mine) - (a.fac === mine));
    const rest = d.units.filter((u) => !u.fac);
    return [
      h('p', { class: 'muted wk-lead' }, T.pickFaculty),
      facs.length > 0 && [ipx.ui.sectionHead(T.faculties), h('div', { class: 'wk-units' }, facs.map((u) =>
        h('a', { class: 'card link-card wk-unit' + (u.fac === mine ? ' mine' : ''), href: u.href },
          cover(u.fac, u.fac, 240, 56),
          h('span', { class: 'wk-unit-body' },
            h('span', { class: 'wk-unit-code', style: `color: ${facultyColors(u.fac)[1]}` }, u.fac, u.fac === mine && h('span', { class: 'delta neutral' }, T.yours)),
            h('strong', {}, u.text)))))],
      rest.length > 0 && [ipx.ui.sectionHead(T.units), h('ul', { class: 'card wk-list' }, rest.map((u) =>
        h('li', {}, anchor(u, { class: 'wk-row' }, h('span', { class: 'wk-row-main' }, h('strong', {}, u.text)), icon('arrow')))))],
    ];
  }

  function drawKeyDates(page) {
    const d = readSchedule(page) || readFaculties(page) || readPeriods(page);
    if (!d) return false;
    const pick = pickers(page);
    kit.page({
      key: 'calendar',
      css: 'pages/weeks.css',
      title: nav.sectionLabel('schedule.calendar'),
      subtitle: nav.label('schedule'),
      tabs: kit.sectionTabs(calendar, 'key'),
      build: () => (d.kind === 'schedule' ? buildSchedule(d, pick) : d.kind === 'periods' ? buildPeriods(d, pick) : buildFaculties(d)),
    });
    return true;
  }

  // ---------- Teaching weeks ----------

  function drawWeeks(page) {
    const keyDates = nav.target('schedule.calendar');
    // Key dates is the section's first entry page (harmonogram.pl); never this page itself.
    const keyLink = keyDates && nav.route(keyDates).path !== PATH ? keyDates : null;
    const title = nav.sectionLabel('schedule.calendar');
    const subtitle = nav.label('schedule');
    const tables = kit.findTables(page);

    if (tables.length) {
      const chrome = [...page.querySelectorAll('nav[aria-label="breadcrumb"], #titulek, table.portal_menu, div.small, .uisLegend')];
      // InSIS's own heading of this page: a bold line directly in the page, before the tables.
      const heading = [...page.querySelectorAll('b')].find((b) => !b.closest('table') && /week|týdn/i.test(b.textContent));
      if (heading) chrome.push(heading);
      hideInSlot(chrome);
      styleSlotted();
      takeover({
        key: 'weeks', css: ['kit.css', 'pages/weeks.css'], title, subtitle, slotted: [page],
        build: () => h('div', { class: 'kit-page' },
          kit.sectionTabs(calendar, 'weeks'),
          h('slot')),
      });
      return;
    }

    kit.page({
      key: 'weeks',
      css: 'pages/weeks.css',
      title,
      subtitle,
      tabs: kit.sectionTabs(calendar, 'weeks'),
      build: () => [
        h('section', { class: 'empty wk-empty' },
          h('span', { class: 'wk-icon' }, icon('calendar')),
          h('p', { class: 'wk-title' }, T.empty),
          h('p', {}, T.why),
          h('p', {}, T.instead),
          keyLink && anchor({ href: keyLink }, { class: 'btn' }, h('span', {}, T.open), icon('arrow'))),
      ],
    });
  }

  ipx.ready.then(() => {
    const path = here().path;
    if (path !== PATH && path !== CAL) return;
    const page = document.getElementById('str1');
    if (!page) return;
    if (path === PATH) drawWeeks(page);
    else drawKeyDates(page); // anything unrecognised stays generic.js's, under the same section header
  });
})();
