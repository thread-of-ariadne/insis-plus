// InSIS+ — coursework submissions ("Odevzdávárny", student/odevzdavarny.pl?studium=…;obdobi=…).
// The original page lists the submission boxes of the current period in three tables, each under a bold heading
// with a decoration icon:
//   dekorace-terminy-prihlasene    "Where I can submit my papers"           → open boxes ("Insert files" column)
//   dekorace-terminy-prihlasovaci  "Coursework submissions with submitted files" → confirmed, closed for the student
//   dekorace-terminy-neprihlasovaci "Where I cannot submit my papers"       → closed or not yet open
// Columns are found by their header text (Czech or English), so a missing or reordered column only drops a field.
// The new view is a rebuild: every original link is shown with InSIS's own address, through the URL rule (a link
// that does not pass is left out); uploading happens on InSIS's own page of each box ("Insert files" opens it),
// nothing here submits, uploads or re-creates a form. Title by 03-pages.md §1 rule 7 (the section's own page:
// "All submissions", eyebrow Courses). The rail keeps only the week and the boxes by course: the next deadlines
// are the KPI and the first group of the list already, and the "how to submit" note is one line above the list.
//
// Stored for the dashboard (ipx.state.submissions):
//   { updated: ms, source: url,
//     boxes: [{ code: '4XY102', name: 'course name', title: 'box name',
//               opens: 'YYYY-MM-DDTHH:MM' | null, closes: 'YYYY-MM-DDTHH:MM' | null,
//               submitted: true | false | null,   // true = files in the box (or confirmed), false = none, null = unknown
//               files: number | null, section: 'open' | 'done' | 'closed',  // the InSIS table the box was listed in
//               href: url }] }                  // the box's own InSIS page (insert/display files), else this page
// "closes" is InSIS's own time; "…T00:00" means the end of the previous day.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.ui) return;

  // What is being read: this page, or a page fetched by the background sync (sync.js), which hands a parsed
  // document to the reader below. No InSIS script runs on a fetched page and nothing else is loaded.
  let doc = document;
  let here = location;
  const { clean, norm, lang } = ipx;
  const { h, icon, anchor, takeover, kpi, sectionHead, emptyState, weekStrip, facultyColors, facultyOf } = ipx.ui;

  const T = {
    cs: { open: 'Otevřené odevzdávárny', due7: 'Termín do 7 dní', submitted: 'Odevzdáno',
      next: 'Nejbližší termín', none: 'Žádný', of: (n) => `z ${n} odevzdáváren`,
      soon: 'Brzy končí', later: 'Později', upcoming: 'Zatím neotevřené', closed: 'Uzavřené',
      today: 'dnes', tomorrow: 'zítra', inDays: (n) => `za ${n} ${n < 5 ? 'dny' : 'dní'}`,
      inHours: (n) => `za ${n} h`, inMin: (n) => `za ${n} min`,
      opens: 'otevře se', closesAt: 'do', closedOn: 'uzavřeno', noLimit: 'bez omezení', noDeadline: 'bez termínu',
      files: (n) => `${n} ${n === 1 ? 'soubor' : n > 1 && n < 5 ? 'soubory' : 'souborů'}`,
      noFiles: 'nic neodevzdáno', todo: (n) => `${n} zbývá`, allDone: 'vše odevzdáno',
      noFilesIn: (n) => `${n} bez odevzdaného souboru`, confirmed: 'potvrzeno', points: 'Body',
      insert: 'Vložit soubory', display: 'Zobrazit soubory', instructions: 'Pokyny', details: 'Podrobnosti',
      by: 'Zadal', forSlot: 'Pro', topic: 'Téma',
      emptyAll: 'Pro předměty v tomto období nejsou vypsané žádné odevzdávárny.',
      emptyOpen: 'Teď není otevřená žádná odevzdávárna.',
      showClosed: (n) => `Zobrazit uzavřené (${n})`, hideClosed: 'Skrýt uzavřené',
      how: 'Soubory se nahrávají na stránce InSIS u každé odevzdávárny: klikněte na Vložit soubory.',
      only: (c) => `Jen ${c}`, showAll: 'Zobrazit vše',
      byCourse: 'Podle předmětů', boxes: (n) => `${n} ${n === 1 ? 'odevzdávárna' : n > 1 && n < 5 ? 'odevzdávárny' : 'odevzdáváren'}`,
      openShort: (n) => `${n} otevř.`, stale: 'Stránka je načtená dříve, stav se mohl změnit. Obnovte ji pro aktuální údaje.' },
    en: { open: 'Open boxes', due7: 'Due within 7 days', submitted: 'Submitted',
      next: 'Next deadline', none: 'None', of: (n) => `of ${n} boxes`,
      soon: 'Due soon', later: 'Later', upcoming: 'Not open yet', closed: 'Closed',
      today: 'today', tomorrow: 'tomorrow', inDays: (n) => `in ${n} days`,
      inHours: (n) => `in ${n} h`, inMin: (n) => `in ${n} min`,
      opens: 'opens', closesAt: 'until', closedOn: 'closed', noLimit: 'no restrictions', noDeadline: 'no deadline',
      files: (n) => `${n} ${n === 1 ? 'file' : 'files'}`,
      noFiles: 'nothing submitted', todo: (n) => `${n} to do`, allDone: 'all submitted',
      noFilesIn: (n) => `${n} with nothing submitted yet`, confirmed: 'confirmed', points: 'Points',
      insert: 'Insert files', display: 'Display files', instructions: 'Instructions', details: 'Details',
      by: 'Put up by', forSlot: 'For', topic: 'Topic',
      emptyAll: 'No coursework submissions have been set up for your courses in this period.',
      emptyOpen: 'No submission box is open right now.',
      showClosed: (n) => `Show closed (${n})`, hideClosed: 'Hide closed',
      how: 'Files are uploaded on InSIS’s page of each box: press Insert files.',
      only: (c) => `Only ${c}`, showAll: 'Show all',
      byCourse: 'By course', boxes: (n) => `${n} ${n === 1 ? 'box' : 'boxes'}`,
      openShort: (n) => `${n} open`, stale: 'This page was loaded a while ago, so the status may have changed. Reload it for current data.' },
  }[lang];
  const locale = lang === 'cs' ? 'cs-CZ' : 'en-GB';

  // ---------- date helpers ----------

  const pad = (n) => String(n).padStart(2, '0');
  const isoMin = (d) => d && `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const dayStart = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayDiff = (a, b) => Math.round((dayStart(a) - dayStart(b)) / 864e5);
  // "25/09/2026 18:00", "25.09.2026 18:00", "25. 9. 2026 18:00"
  function parseDateTime(s) {
    const m = clean(s).match(/(\d{1,2})\s*[./]\s*(\d{1,2})\s*[./]\s*(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
    return m ? new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), Number(m[4] || 0), Number(m[5] || 0)) : null;
  }
  // A deadline at 00:00 is shown as 24:00 of the day before, which is how it reads to people.
  function wall(d) {
    if (d.getHours() === 0 && d.getMinutes() === 0) {
      const x = new Date(d);
      x.setDate(x.getDate() - 1);
      return { day: x, time: '24:00' };
    }
    return { day: d, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
  }
  const dayLabel = (d) => d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: lang === 'cs' ? 'numeric' : 'short' });
  const stamp = (d) => { const w = wall(d); return `${dayLabel(w.day)} ${w.time}`; };

  // ---------- reading the original page ----------

  const COLS = [
    ['course', /^(course|predmet|nazev predmetu)/],
    ['title', /^(name|nazev)/],
    ['type', /^(type|typ)/],
    ['slot', /^(announced|vypsan|urcen|pro )/],
    ['since', /^(since|from|od|odkdy|otevreno od)$/],
    ['until', /^(until|till|to|do|dokdy|otevreno do)$/],
    ['topic', /^(topic|tema)/],
    ['open', /^(open|otevren)/],
    ['points', /^(points|body)/],
    ['details', /^(details|podrobnost|detail)/],
    ['files', /^(number of files|pocet)/],
    ['instructions', /^(instructions|pokyn|zadani)/],
    ['by', /^(put up|zadal|vlozil|zalozil|vypsal)/],
    ['insert', /^(insert|vlozit|odevzdat)/],
    ['display', /^(display|zobrazit)/],
  ];

  function columns(table) {
    const head = table.querySelector('thead tr') || table.querySelector('tr');
    const map = {};
    let i = 0;
    for (const th of head?.querySelectorAll(':scope > th, :scope > td') || []) {
      const key = COLS.find(([, re]) => re.test(norm(th.textContent)))?.[0];
      if (key && !(key in map)) map[key] = i;
      i += Math.max(1, Number(th.getAttribute('colspan')) || 1);
    }
    return map;
  }

  // Which of the three tables this is: by the decoration icon of its heading, then by its columns.
  function sectionOf(table, cols) {
    for (let n = table.previousElementSibling, k = 0; n && k < 6; n = n.previousElementSibling, k++) {
      const sys = n.querySelector?.('[data-sysid^="dekorace-terminy"]')?.getAttribute('data-sysid') || '';
      if (sys.endsWith('-neprihlasovaci')) return 'closed';
      if (sys.endsWith('-prihlasovaci')) return 'done';
      if (sys.endsWith('-prihlasene')) return 'open';
      if (n.tagName === 'TABLE') break;
    }
    if ('insert' in cols) return 'open';
    if ('points' in cols) return 'done';
    return 'closed';
  }

  // A link inside a cell: the original href and a readable label (icons carry it in aria-label / title).
  function linkIn(td, fallback) {
    const a = td?.querySelector('a[href]');
    const href = a?.getAttribute('href');
    if (!a || !href || /^javascript:/i.test(href)) return null;
    const text = clean(a.textContent) || clean(a.querySelector('[aria-label]')?.getAttribute('aria-label')) || clean(a.title) || fallback;
    return { href: a.href, text, target: a.target || null };
  }

  function readRow(tr, cols, section) {
    const cells = [];
    for (const td of tr.querySelectorAll(':scope > td, :scope > th')) {
      const span = Math.max(1, Number(td.getAttribute('colspan')) || 1);
      for (let i = 0; i < span; i++) cells.push(span > 1 ? null : td);
    }
    const cell = (k) => (k in cols ? cells[cols[k]] : null);
    const text = (k) => clean(cell(k)?.textContent);
    const courseCell = cell('course');
    if (!courseCell) return null;
    const courseText = clean(courseCell.textContent);
    const [, code = '', name = courseText] = courseText.match(/^([0-9A-Z]{4,8})\s+(.+)$/) || [];
    const title = text('title');
    if (!code && !title) return null;
    const opens = parseDateTime(text('since'));
    const closes = parseDateTime(text('until'));
    const filesText = text('files');
    const files = /^\d+$/.test(filesText) ? Number(filesText) : null;
    const openSys = cell('open')?.querySelector('[data-sysid]')?.getAttribute('data-sysid') || '';
    const label = (k) => clean(cell(k)?.querySelector('[aria-label]')?.getAttribute('aria-label'));
    const people = [...(cell('by')?.querySelectorAll('a[href]') || [])].map((a) => ({ href: a.href, text: clean(a.textContent) }));
    return {
      section,
      code,
      name,
      courseHref: linkIn(courseCell)?.href || null,
      title,
      type: label('type') || text('type'),
      slot: text('slot'),
      topic: text('topic'),
      opens,
      closes,
      opensText: text('since'),
      closesText: text('until'),
      openIcon: /otevren/.test(openSys) ? true : /zavren/.test(openSys) ? false : null,
      points: text('points'),
      files,
      by: people.length ? people : text('by') ? [{ text: text('by') }] : [],
      insert: linkIn(cell('insert'), T.insert),
      display: linkIn(cell('display'), T.display),
      instructions: linkIn(cell('instructions'), T.instructions),
      details: linkIn(cell('details'), T.details),
    };
  }

  function parse() {
    const url = /odevzdavarny\.pl/.test(here.pathname);
    const tables = [];
    for (const table of doc.querySelectorAll('table')) {
      const cols = columns(table);
      // A submissions table has a course column, a deadline column and a files column.
      if ('course' in cols && 'until' in cols && ('files' in cols || 'insert' in cols || 'display' in cols)) tables.push({ table, cols });
    }
    const decorated = doc.querySelector('[data-sysid^="dekorace-terminy"]');
    if (!tables.length || !(url || decorated)) return null;

    const boxes = [];
    for (const { table, cols } of tables) {
      const section = sectionOf(table, cols);
      for (const tr of table.querySelectorAll('tr')) {
        if (tr.closest('table') !== table || tr.closest('thead') || tr.querySelector(':scope > th')) continue;
        const box = readRow(tr, cols, section);
        if (box) boxes.push(box);
      }
    }

    const studyLine = doc.querySelector('#titulek div');
    const period = clean(studyLine?.querySelectorAll('b')[1]?.textContent);
    return { boxes, period, tableCount: tables.length };
  }

  // ---------- state at a given moment ----------

  const facultyFor = (code) => ipx.ui.facultyFor(code);

  const submittedOf = (b) => (b.section === 'done' ? true : b.files == null ? null : b.files > 0);

  // 'open' | 'upcoming' | 'closed' | 'done'
  function stateOf(b, now) {
    if (b.section === 'done') return 'done';
    if (b.opens && b.opens > now) return 'upcoming';
    if (b.closes && b.closes <= now) return 'closed';
    if (b.section === 'open' || b.openIcon === true) return 'open';
    return 'closed';
  }

  // "today 24:00", "tomorrow 12:00", "in 3 days", "in 40 min"
  function countdown(target, now) {
    const ms = target - now;
    const w = wall(target);
    const days = dayDiff(w.day, now);
    if (ms < 60 * 60e3) return T.inMin(Math.max(1, Math.ceil(ms / 60e3)));
    if (days <= 0) return ms < 6 * 3600e3 ? `${T.inHours(Math.ceil(ms / 3600e3))} · ${w.time}` : `${T.today} ${w.time}`;
    if (days === 1) return `${T.tomorrow} ${w.time}`;
    return T.inDays(days);
  }

  function toneOf(b, now) {
    if (!b.closes) return 'neutral';
    const ms = b.closes - now;
    if (submittedOf(b)) return 'ok';
    if (ms < 36 * 3600e3) return 'bad';
    if (ms < 7 * 864e5) return 'warn';
    return 'neutral';
  }

  // ---------- building the new page ----------

  const facStyle = (code) => `--fac: ${facultyColors(facultyFor(code))[1]}`;

  // Every link shown passes the URL rule (nav.js); one that does not is left out. Parsing keeps InSIS's addresses
  // as they are, so the stored data (remember()) does not change.
  const nav = ipx.nav;
  const safeLink = (l) => {
    const href = l?.href && nav?.safe(l.href, 'link', { copied: true });
    return href ? { ...l, href } : null;
  };
  // A course of mine opens its course page (Submissions tab, the canonical place for one course's boxes);
  // any other course its syllabus, InSIS's own link.
  const mine = () => new Set((ipx.state.studyRecord?.courses || []).map((c) => c.code));
  const courseLink = (code, href) => (code && nav?.composedUrl && mine().has(code)
    ? { href: nav.composedUrl('course.submissions', code) } : safeLink(href && { href }));

  function dateBlock(d, muted) {
    if (!d) return h('span', { class: 'sb-date none' }, h('b', {}, '–'), h('small', {}, T.noDeadline));
    const w = wall(d);
    return h('span', { class: 'sb-date' + (muted ? ' muted' : '') },
      h('small', {}, w.day.toLocaleDateString(locale, { weekday: 'short' })),
      h('b', {}, String(w.day.getDate())),
      h('small', {}, w.day.toLocaleDateString(locale, { month: 'short' })));
  }

  function chip(text, tone) { return h('span', { class: `delta ${tone}` }, text); }

  function boxRow(b, now) {
    const st = stateOf(b, now);
    const sub = submittedOf(b);
    const course = [b.code, b.name].filter(Boolean).join(' ');
    let when;
    let status;
    if (st === 'open') {
      when = b.closes ? `${T.closesAt} ${stamp(b.closes)}` : T.noDeadline;
      status = b.closes && chip(countdown(b.closes, now), toneOf(b, now));
    } else if (st === 'upcoming') {
      when = `${T.opens} ${stamp(b.opens)}${b.closes ? ` · ${T.closesAt} ${stamp(b.closes)}` : ''}`;
      status = chip(`${T.opens} ${countdown(b.opens, now)}`, 'neutral');
    } else {
      when = b.closes ? `${T.closedOn} ${stamp(b.closes)}` : T.closedOn;
      status = st === 'done' ? chip(T.confirmed, 'ok') : null;
    }
    const filesTag = b.files != null && st !== 'upcoming' && h('span', { class: 'sb-files' + (sub ? ' ok' : st === 'open' ? ' warn' : '') },
      icon(sub ? 'check' : 'file'), sub || b.files ? T.files(b.files) : T.noFiles);

    // Labels follow the InSIS+ language; the original label stays as the tooltip.
    const act = (raw, label, ic, cls = 'sb-act') => {
      const link = safeLink(raw);
      return link && anchor(link, { class: cls, title: link.text || label }, ic && icon(ic), h('span', {}, label));
    };
    const courseTo = courseLink(b.code, b.courseHref);
    const actions = [
      act(b.insert, T.insert, st === 'open' ? 'arrow' : null, st === 'open' ? 'sb-act primary' : 'sb-act'),
      act(b.display, T.display, 'file'),
      act(b.instructions, T.instructions, 'list'),
      act(b.details, T.details, null),
    ].filter(Boolean);

    const meta = [
      b.slot && `${T.forSlot}: ${b.slot}`,
      b.type,
      b.topic && !/^(free|volne|volny|-)$/.test(norm(b.topic)) && `${T.topic}: ${b.topic}`,
    ].filter(Boolean).join(' · ');

    return h('div', { class: `sb-row s-${st}`, style: facStyle(b.code) },
      dateBlock(st === 'upcoming' ? b.opens : b.closes, st === 'closed' || st === 'done'),
      h('span', { class: 'sb-sep' }),
      h('div', { class: 'sb-body' },
        h('div', { class: 'sb-course' },
          b.code && h('b', { class: 'sb-code' }, b.code),
          courseTo ? anchor(courseTo, {}, b.name) : h('span', {}, b.name)),
        h('strong', { class: 'sb-title', title: course }, b.title || b.name),
        h('span', { class: 'sb-when' }, when),
        meta && h('span', { class: 'sb-meta' }, meta),
        (b.by.length > 0 || b.points) && h('span', { class: 'sb-meta' },
          b.by.length > 0 && [`${T.by}: `, b.by.map((p, i) => [i ? ', ' : '', safeLink(p) ? anchor(safeLink(p), {}, p.text) : p.text])],
          b.points && [b.by.length ? ' · ' : '', `${T.points}: ${b.points}`])),
      h('div', { class: 'sb-side' },
        h('div', { class: 'sb-status' }, status, filesTag),
        actions.length > 0 && h('div', { class: 'sb-actions' }, actions)));
  }

  function group(title, list, now, extra) {
    if (!list.length) return null;
    return [
      sectionHead(title, null, h('span', { class: 'sb-count' }, String(list.length)), extra),
      h('div', { class: 'card sb-list' }, list.map((b) => boxRow(b, now))),
    ];
  }

  function courseRail(boxes, now) {
    const map = new Map();
    for (const b of boxes) {
      const key = b.code || b.name;
      if (!map.has(key)) map.set(key, { code: b.code, name: b.name, link: courseLink(b.code, b.courseHref), n: 0, open: 0 });
      const c = map.get(key);
      c.n++;
      if (stateOf(b, now) === 'open') c.open++;
    }
    return h('div', { class: 'sb-courses' }, [...map.values()].map((c) => {
      const fac = facultyFor(c.code);
      const body = [
        h('span', { class: 'sb-fac', style: `--fac: ${facultyColors(fac)[1]}` }, [c.code, fac].filter(Boolean).join(' · ')),
        h('strong', {}, c.name),
        h('small', {}, [T.boxes(c.n), c.open ? T.openShort(c.open) : null].filter(Boolean).join(' · ')),
      ];
      return c.link ? anchor(c.link, { class: 'sb-course-row' }, body) : h('div', { class: 'sb-course-row' }, body);
    }));
  }

  function buildPage(d, state) {
    const now = new Date();
    const by = (st) => d.boxes.filter((b) => stateOf(b, now) === st);
    const open = by('open').sort((a, b) => (a.closes || Infinity) - (b.closes || Infinity));
    const soon = open.filter((b) => b.closes && b.closes - now <= 7 * 864e5);
    const later = open.filter((b) => !soon.includes(b));
    const upcoming = by('upcoming').sort((a, b) => a.opens - b.opens);
    const closed = [...by('closed'), ...by('done')].sort((a, b) => (b.closes || 0) - (a.closes || 0));
    const submitted = d.boxes.filter((b) => submittedOf(b)).length;
    const first = open.find((b) => b.closes);
    const unsubmittedSoon = soon.filter((b) => !submittedOf(b)).length;

    // The page is a snapshot: if the clock moved past an open box's deadline, say so instead of pretending.
    const stale = d.boxes.some((b) => b.section === 'open' && b.closes && b.closes <= now);

    const closedOpen = state.showClosed ?? (!open.length && !upcoming.length);
    const toggle = closed.length > 0 && (open.length > 0 || upcoming.length > 0) && h('button', { type: 'button', class: 'sb-toggle',
      'aria-expanded': String(closedOpen), onclick: () => { state.showClosed = !closedOpen; state.render(); } },
    closedOpen ? T.hideClosed : T.showClosed(closed.length), icon('chevron'));

    const main = h('div', { class: 'sb-main' },
      h('div', { class: 'kpis' },
        kpi({ label: T.open, value: open.length, foot: upcoming.length ? `${T.upcoming}: ${upcoming.length}` : null }),
        kpi({ label: T.due7, value: soon.length,
          status: soon.length > 0 && (unsubmittedSoon
            ? { tone: soon.some((b) => !submittedOf(b) && toneOf(b, now) === 'bad') ? 'bad' : 'warn', text: T.todo(unsubmittedSoon) }
            : { tone: 'ok', text: T.allDone }),
          foot: soon.length > 0 && unsubmittedSoon > 0 ? T.noFilesIn(unsubmittedSoon) : null }),
        kpi({ label: T.submitted, value: submitted, foot: d.boxes.length ? T.of(d.boxes.length) : null }),
        kpi({ label: T.next, isText: true, value: first ? stamp(first.closes) : T.none,
          status: first && { tone: toneOf(first, now), text: countdown(first.closes, now) },
          foot: first && [first.code, first.title].filter(Boolean).join(' · ') })),
      stale && h('p', { class: 'sb-hint' }, icon('alert'), h('span', {}, T.stale)),
      // InSIS's page of one course (…;predmet=N, from InSIS's own links) lists only that course's boxes: say so.
      d.only && h('p', { class: 'sb-filter' }, icon('list'), h('span', {}, T.only(d.only.code)),
        d.only.all && anchor({ href: d.only.all }, { class: 'sb-filter-all' }, T.showAll)),
      d.boxes.length > 0 && h('p', { class: 'sb-lead muted' }, [d.period, T.how].filter(Boolean).join(' · ')),
      !d.boxes.length ? emptyState(T.emptyAll)
        : [
          !open.length && !upcoming.length && emptyState(T.emptyOpen),
          group(T.soon, soon, now),
          group(T.later, later, now),
          group(T.upcoming, upcoming, now),
          closed.length > 0 && (closedOpen ? group(T.closed, closed, now, toggle)
            : h('div', { class: 'section-head' }, h('div', {}, h('h2', { class: 'section-title' }, T.closed), h('span', { class: 'sb-count' }, String(closed.length)), toggle))),
        ]);

    const marks = [...new Set(open.filter((b) => b.closes).map((b) => wall(b.closes).day)
      .filter((x) => dayDiff(x, now) >= 0 && dayDiff(x, now) < 7 && ((x.getDay() + 6) % 7) >= ((now.getDay() + 6) % 7))
      .map((x) => (x.getDay() + 6) % 7))];
    const rail = h('aside', { class: 'sb-rail' },
      weekStrip(now, marks),
      d.boxes.length > 0 && h('section', {}, h('div', { class: 'card-head' }, h('h2', {}, T.byCourse)), courseRail(d.boxes, now)));

    return [main, rail];
  }

  function remember(d) {
    ipx.state.submissions = {
      updated: Date.now(),
      source: here.href,
      boxes: d.boxes.map((b) => ({
        code: b.code, name: b.name, title: b.title,
        opens: isoMin(b.opens), closes: isoMin(b.closes),
        submitted: submittedOf(b), files: b.files, section: b.section,
        href: (b.insert || b.display)?.href || here.href,
      })),
    };
    ipx.save();
  }

  // Background read (sync.js): parse a fetched page and store its data; nothing is drawn.
  (ipx.readers ||= {}).submissions = (fetched, url) => {
    doc = fetched; here = new URL(url);
    try { const data = parse(); if (data) remember(data); } finally { doc = document; here = location; }
  };

  ipx.ready.then(() => {
    const data = parse();
    if (!data) return;
    remember(data);
    // A one-course list: which course, and the whole list (where the sidebar's All submissions leads).
    if (/[?;&]predmet=/.test(document.baseURI)) {
      const codes = [...new Set(data.boxes.map((b) => b.code).filter(Boolean))];
      const all = ipx.nav.target('courses.submissions');
      if (codes.length === 1) data.only = { code: codes[0], all: all && ipx.nav.route(all).path === ipx.nav.route(document.baseURI).path && !/[?;&]predmet=/.test(all) ? all : null };
    }
    takeover({
      key: 'submissions',
      css: 'pages/submissions.css',
      title: ipx.nav.sectionLabel('courses.submissions'),
      subtitle: ipx.nav.label('courses'),
      build: () => {
        const wrap = h('div', { class: 'sb' });
        const state = { showClosed: null, render: () => wrap.replaceChildren(...buildPage(data, state)) };
        state.render();
        return wrap;
      },
    });
  });
})();
