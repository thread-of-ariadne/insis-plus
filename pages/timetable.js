// InSIS+ — the student's personal timetable (katalog/rozvrhy_view.pl?…rozvrh_student=…).
// The original is one big grid: a header row of 5-minute slots ("08:00-08:05" …), then one row per day
// ("Mon 14/09/2026" when listing particular days, "Mon" for the weekly summary) with each class as a cell
// spanning its slots (class rozvrh-pred = lecture, rozvrh-cvic = seminar, …). Times come from the header
// columns a cell covers. The display-mode form (weekly / particular days, PDF output) stays the original
// one, slotted below the new view; it is never submitted for the user.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.ui) return;

  // What is being read: this page, or a page fetched by the background sync (sync.js), which hands a parsed
  // document to the reader below. No InSIS script runs on a fetched page and nothing else is loaded.
  let doc = document;
  let here = location;
  const { clean, norm, lang } = ipx;
  const { h, icon, anchor, takeover, kpi, sectionHead, emptyState, weekStrip, styleSlotted, facultyColors, facultyFor,
    keepOnly } = ipx.ui;

  const T = {
    cs: { title: 'Rozvrh', days: ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'],
      classesWeek: 'Výuka tento týden', classesShown: 'Výuka v týdnu', hoursWeek: 'Hodin tento týden', hoursShown: 'Hodin v týdnu',
      next: 'Další hodina', nextList: 'Nejbližší hodiny', none: 'Žádná', noneLeft: 'V tomto rozvrhu už žádná další hodina není.',
      courses: 'Předměty', sessions: (n) => `${n} ${n === 1 ? 'termín' : n < 5 ? 'termíny' : 'termínů'}`,
      today: 'dnes', tomorrow: 'zítra', inDays: (n) => `za ${n} ${n < 5 ? 'dny' : 'dní'}`, now: 'právě teď',
      nearest: 'nejbližší', week: 'Týden', prev: 'Předchozí týden', next7: 'Další týden', back: 'Tento týden',
      backNearest: 'Nejbližší výuka', template: 'Týdenní přehled',
      emptyWeek: 'V tomto týdnu nemáte žádnou výuku.',
      notThisWeek: (w) => `Tento týden (${w}) nemáte žádnou výuku, proto ukazuji nejbližší týden s výukou.`,
      outside: (r) => `Dnešek je mimo období tohoto rozvrhu (${r}), proto ukazuji nejbližší týden s výukou.`,
      templateNote: 'Rozvrh je ve formě týdenního přehledu: data jednotlivých hodin nejsou uvedena.',
      hoursChart: 'Výuka v týdnu', semesterCourses: 'Předměty v rozvrhu', teachers: 'Vyučující', rooms: 'Místnosti',
      notes: 'Poznámky', options: 'Export a tisk', optionsHint: 'Výpis, tisk nebo PDF: zvolte typ výpisu, období nebo formát PDF a stiskněte Zobrazit (formulář InSIS).',
      toCalendar: 'Do Outlooku a telefonu', toCalendarText: 'InSIS přenese rozvrh do kalendáře vašeho univerzitního účtu: uvidíte ho v Outlooku i v telefonu.',
      criteria: 'Změnit kritéria', print: 'Export', lastChange: 'Poslední změna', noEvents: 'V tomto rozvrhu nejsou žádné hodiny.',
      inWeek: (n) => `${n}× v týdnu`, total: 'celkem' },
    en: { title: 'Timetable', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      classesWeek: 'Classes this week', classesShown: 'Classes in week', hoursWeek: 'Hours this week', hoursShown: 'Hours in week',
      next: 'Next class', nextList: 'Next classes', none: 'None', noneLeft: 'There are no more classes in this timetable.',
      courses: 'Courses', sessions: (n) => `${n} ${n === 1 ? 'session' : 'sessions'}`,
      today: 'today', tomorrow: 'tomorrow', inDays: (n) => `in ${n} days`, now: 'now',
      nearest: 'nearest', week: 'Week', prev: 'Previous week', next7: 'Next week', back: 'This week',
      backNearest: 'Nearest classes', template: 'Weekly overview',
      emptyWeek: 'You have no classes this week.',
      notThisWeek: (w) => `You have no classes this week (${w}), so this shows the nearest week with classes.`,
      outside: (r) => `Today is outside this timetable's period (${r}), so this shows the nearest week with classes.`,
      templateNote: 'This timetable is a weekly overview: it does not list the dates of individual classes.',
      hoursChart: 'Teaching this week', semesterCourses: 'Courses in this timetable', teachers: 'Teachers', rooms: 'Rooms',
      notes: 'Notes', options: 'Export and print', optionsHint: 'A list, print or PDF: choose the list type, period or PDF format and press Display (the InSIS form).',
      toCalendar: 'To Outlook and your phone', toCalendarText: 'InSIS transfers the timetable to the calendar of your university account: it shows in Outlook and on your phone.',
      criteria: 'Select criteria', print: 'Export', lastChange: 'Last change', noEvents: 'There are no classes in this timetable.',
      inWeek: (n) => `${n}× a week`, total: 'total' },
  }[lang];
  const locale = lang === 'cs' ? 'cs-CZ' : 'en-GB';

  // Day names as InSIS writes them in both languages, diacritic-free.
  const WEEKDAYS = [/^(mon|po)/, /^(tue|ut)/, /^(wed|st)/, /^(thu|ct)/, /^(fri|pa)/, /^(sat|so)/, /^(sun|ne)/];
  const TYPE_FALLBACK = { pred: lang === 'cs' ? 'přednáška' : 'lecture', cvic: lang === 'cs' ? 'cvičení' : 'seminar' };
  // VŠE course codes start with the faculty number (4IT431 → FIS).

  // ---------- small date/time helpers ----------

  const pad = (n) => String(n).padStart(2, '0');
  const toMin = (t) => { const [a, b] = t.split(':').map(Number); return a * 60 + b; };
  const toTime = (m) => `${pad(Math.floor(m / 60))}:${pad(Math.round(m % 60))}`;
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fromIso = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const mondayOf = (d) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
  const weekdayOf = (d) => (d.getDay() + 6) % 7;
  const short = (d) => d.toLocaleDateString(locale, { day: 'numeric', month: lang === 'cs' ? 'numeric' : 'short' });
  const range = (a, b) => `${short(a)} – ${short(b)}`;
  const long = (d) => d.toLocaleDateString(locale, { day: 'numeric', month: lang === 'cs' ? 'numeric' : 'short', year: 'numeric' });
  const rangeLong = (a, b) => `${long(a)} – ${long(b)}`;
  const dur = (min) => {
    const hh = Math.floor(min / 60);
    const mm = Math.round(min % 60);
    return { value: String(hh), unit: mm ? `h ${mm} min` : 'h', text: mm ? `${hh} h ${mm} min` : `${hh} h` };
  };
  const parseDate = (s) => {
    const m = s.match(/(\d{1,2})\s*[./]\s*(\d{1,2})\s*[./]\s*(\d{4})/);
    return m ? new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])) : null;
  };

  // ---------- reading the original page ----------

  // Header columns → [{ start, end }] in minutes, one entry per grid column (index 0 = the day column).
  function slotColumns(headRow) {
    const cols = [];
    for (const th of headRow.querySelectorAll(':scope > th, :scope > td')) {
      const span = Math.max(1, Number(th.getAttribute('colspan')) || 1);
      const m = clean(th.textContent).match(/^(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})$/);
      if (!m) {
        for (let i = 0; i < span; i++) cols.push(null);
        continue;
      }
      const a = Number(m[1]) * 60 + Number(m[2]);
      const b = Number(m[3]) * 60 + Number(m[4]);
      for (let i = 0; i < span; i++) cols.push({ start: a + ((b - a) * i) / span, end: a + ((b - a) * (i + 1)) / span });
    }
    return cols;
  }

  function findGrid() {
    for (const table of doc.querySelectorAll('table')) {
      const head = table.querySelector('tr');
      if (!head) continue;
      const cols = slotColumns(head);
      if (cols.filter(Boolean).length >= 12) return { table, head, cols };
    }
    return null;
  }

  // "(1)" → "Pouze pro studenty …", from the notes table under the grid.
  function footnotes(grid) {
    const out = {};
    for (const tr of doc.querySelectorAll('tr')) {
      if (grid.contains(tr)) continue;
      const tds = tr.querySelectorAll(':scope > td');
      const key = tds.length === 2 && clean(tds[0].textContent).match(/^\((\d+)\)$/)?.[1];
      if (key) out[key] = clean(tds[1].textContent);
    }
    return out;
  }

  // Type labels from the key under the grid ("lecture", "seminar"), so they follow the page language.
  function typeLabels(grid) {
    const out = { ...TYPE_FALLBACK };
    for (const td of doc.querySelectorAll('td[class*="rozvrh-"]')) {
      if (grid.contains(td)) continue;
      const key = td.className.match(/\brozvrh-([a-z]+)/)?.[1];
      const text = clean(td.textContent);
      if (key && text) out[key] = text;
    }
    return out;
  }

  function readEvent(td, start, end, typeKey, types, notes) {
    const course = td.querySelector('a[href*="syllabus.pl"]');
    const room = td.querySelector('a[href*="mistnost"]');
    const people = [...td.querySelectorAll('a[href*="clovek.pl"]')];
    // Without links, fall back to the text lines of the cell: room / course / teacher.
    const lines = [];
    let line = '';
    for (const n of (td.querySelector(':scope > div') || td).childNodes) {
      if (n.nodeName === 'BR') { lines.push(clean(line)); line = ''; } else if (n.nodeName !== 'SUP') line += n.textContent;
    }
    lines.push(clean(line));
    const courseText = clean(course?.textContent) || lines.find((l) => /^[0-9][0-9A-Z]{3,7}\s/.test(l)) || lines[1] || '';
    const [, code = '', name = courseText] = courseText.match(/^([0-9A-Z]{4,8})\s+(.+)$/) || [];
    const refs = (clean(td.querySelector('sup')?.textContent).match(/\d+/g) || []);
    const timeText = clean(td.textContent).match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);
    if (start == null && timeText) {
      start = Number(timeText[1]) * 60 + Number(timeText[2]);
      end = Number(timeText[3]) * 60 + Number(timeText[4]);
    }
    if (start == null || end == null || !(code || name)) return null;
    return {
      start: toTime(start),
      end: toTime(end),
      code,
      name,
      typeKey,
      type: types[typeKey] || typeKey,
      room: clean(room?.textContent) || (course ? '' : lines[0] || ''),
      roomHref: room?.href || null,
      teacher: people.map((a) => clean(a.textContent)).join(', ') || (course ? '' : lines[2] || ''),
      people: people.map((a) => ({ href: a.href, text: clean(a.textContent) })),
      notes: refs.map((r) => notes[r]).filter(Boolean),
      note: refs.map((r) => notes[r]).filter(Boolean).join(' · '),
      href: course?.href || null,
    };
  }

  function parse() {
    const personal = /rozvrh_student=/.test(here.href) || doc.querySelector('input[name="rozvrh_student"]');
    const found = findGrid();
    if (!personal || !found) return null;
    const { table, head, cols } = found;
    const notes = footnotes(table);
    const types = typeLabels(table);

    const events = [];
    let day = null;
    let dayLeft = 0;
    for (const tr of table.querySelectorAll('tr')) {
      if (tr === head) continue;
      const cells = [...tr.querySelectorAll(':scope > td, :scope > th')];
      if (!cells.length || (cells.length === 1 && !clean(cells[0].textContent))) continue;
      let col = 0;
      const first = cells[0];
      const label = clean(first.textContent);
      const isDay = first.classList.contains('zahlavi') || WEEKDAYS.some((re) => re.test(norm(label))) || parseDate(label);
      if (isDay && label && !first.className.includes('rozvrh-')) {
        const date = parseDate(label);
        const wd = date ? weekdayOf(date) : WEEKDAYS.findIndex((re) => re.test(norm(label)));
        day = { date: date ? iso(date) : null, weekday: wd };
        dayLeft = Math.max(1, Number(first.getAttribute('rowspan')) || 1);
        col = Math.max(1, Number(first.getAttribute('colspan')) || 1);
        cells.shift();
      } else if (dayLeft > 0) {
        col = 1; // a further row of the same day (overlapping classes); the day cell spans it
      } else {
        continue;
      }
      dayLeft--;
      if (!day || day.weekday < 0) continue;

      for (const td of cells) {
        const span = Math.max(1, Number(td.getAttribute('colspan')) || 1);
        const typeKey = td.className.match(/\brozvrh-([a-z]+)/)?.[1];
        if (typeKey && typeKey !== 'sep' && clean(td.textContent)) {
          const a = cols[col];
          const b = cols[col + span - 1];
          const ev = readEvent(td, a?.start ?? null, b?.end ?? null, typeKey, types, notes);
          if (ev) events.push({ ...day, ...ev });
        }
        col += span;
      }
    }
    events.sort((a, b) => (a.date || '').localeCompare(b.date || '') || a.weekday - b.weekday || a.start.localeCompare(b.start));

    const val = (name) => clean(doc.querySelector(`input[name="${name}"]`)?.value);
    const from = parseDate(val('konani_od'));
    const to = parseDate(val('konani_do'));
    const crumbs = [...doc.querySelectorAll('.breadcrumb-item a[href]')];
    const criteria = crumbs.find((a) => /rozvrhy_view\.pl$/.test(a.getAttribute('href') || ''));
    const form = doc.querySelector('form input[name="rozvrh_student"]')?.form || null;
    const changed = doc.body.innerText.match(/(?:Last change|Poslední změna)\s*:\s*([0-9./: ]+)/i)?.[1]?.trim() || '';

    return {
      events,
      weekly: !events.some((e) => e.date),
      from,
      to,
      criteria: criteria && { href: criteria.href, text: clean(criteria.textContent) },
      form,
      changed,
    };
  }

  // ---------- derived data ----------

  // Events of the week starting `monday`, each with a real Date. A weekly overview repeats every week.
  function weekEvents(d, monday) {
    if (d.weekly) return d.events.map((e) => ({ ...e, day: addDays(monday, e.weekday) }));
    const lo = iso(monday);
    const hi = iso(addDays(monday, 6));
    return d.events.filter((e) => e.date >= lo && e.date <= hi).map((e) => ({ ...e, day: fromIso(e.date) }));
  }

  const startOf = (e) => { const x = new Date(e.day); x.setHours(0, toMin(e.start), 0, 0); return x; };
  const endOf = (e) => { const x = new Date(e.day); x.setHours(0, toMin(e.end), 0, 0); return x; };
  const minutes = (list) => list.reduce((s, e) => s + toMin(e.end) - toMin(e.start), 0);

  function upcoming(d, now, n) {
    let list;
    if (d.weekly) {
      const monday = mondayOf(now);
      list = [...weekEvents(d, monday), ...weekEvents(d, addDays(monday, 7))];
    } else {
      list = d.events.map((e) => ({ ...e, day: fromIso(e.date) }));
    }
    return list.filter((e) => endOf(e) > now).sort((a, b) => startOf(a) - startOf(b)).slice(0, n);
  }

  // The week to open: this one if it has classes, otherwise the nearest week that has some.
  function initialWeek(d, now) {
    const here = mondayOf(now);
    if (d.weekly || !d.events.length) return { monday: here, reason: null };
    if (weekEvents(d, here).length) return { monday: here, reason: null };
    const mondays = [...new Set(d.events.map((e) => iso(mondayOf(fromIso(e.date)))))].map(fromIso);
    mondays.sort((a, b) => Math.abs(a - here) - Math.abs(b - here) || b - a);
    const first = fromIso(d.events[0].date);
    const last = fromIso(d.events.at(-1).date);
    const outside = (d.from && d.to) ? now < d.from || now > addDays(d.to, 1) : now < first || now > addDays(last, 1);
    return { monday: mondays[0], reason: outside ? 'outside' : 'empty' };
  }

  function relative(day, now) {
    const days = Math.round((new Date(day).setHours(0, 0, 0, 0) - new Date(now).setHours(0, 0, 0, 0)) / 864e5);
    return days === 0 ? T.today : days === 1 ? T.tomorrow : T.inDays(days);
  }

  // ---------- building the new page ----------

  const facStyle = (code) => `--fac: ${facultyColors(facultyFor(code))[1]}`;
  const label = (e) => [e.code, e.name].filter(Boolean).join(' ');
  const tooltip = (e) => [`${e.start}–${e.end}`, label(e), e.type, e.room, e.teacher, e.note].filter(Boolean).join('\n');
  const link = (e, cls, ...kids) => (e.href ? h('a', { class: cls, href: e.href, title: tooltip(e), style: facStyle(e.code) }, kids)
    : h('div', { class: cls, title: tooltip(e), style: facStyle(e.code) }, kids));

  // Lanes for overlapping classes within one day.
  function lanes(list) {
    const sorted = [...list].sort((a, b) => a.start.localeCompare(b.start) || b.end.localeCompare(a.end));
    const out = [];
    let group = [];
    let groupEnd = -1;
    const flush = () => {
      const ends = [];
      for (const e of group) {
        let lane = ends.findIndex((x) => x <= toMin(e.start));
        if (lane < 0) lane = ends.length;
        ends[lane] = toMin(e.end);
        out.push({ e, lane });
      }
      for (const x of out.slice(out.length - group.length)) x.of = ends.length;
      group = [];
    };
    for (const e of sorted) {
      if (group.length && toMin(e.start) >= groupEnd) flush();
      group.push(e);
      groupEnd = Math.max(groupEnd, toMin(e.end));
    }
    if (group.length) flush();
    return out;
  }

  function weekGrid(list, monday, axis, now, showDays) {
    const PX = 64;
    const hours = [];
    for (let m = axis.lo; m <= axis.hi; m += 60) hours.push(m);
    const height = ((axis.hi - axis.lo) / 60) * PX;
    const todayIso = iso(now);
    return h('div', { class: 'tt-grid', style: `--cols: ${showDays.length}` },
      h('div', { class: 'tt-gh' }),
      showDays.map((i) => {
        const day = addDays(monday, i);
        const isToday = iso(day) === todayIso;
        return h('div', { class: 'tt-gh' + (isToday ? ' today' : '') },
          h('span', {}, T.days[i]), h('b', {}, String(day.getDate())));
      }),
      h('div', { class: 'tt-axis', style: `height: ${height}px` },
        hours.map((m) => h('span', { style: `top: ${((m - axis.lo) / 60) * PX}px` }, toTime(m)))),
      showDays.map((i) => {
        const day = addDays(monday, i);
        const mine = list.filter((e) => e.weekday === i);
        return h('div', { class: 'tt-col' + (iso(day) === todayIso ? ' today' : ''), style: `height: ${height}px` },
          hours.map((m) => h('i', { class: 'tt-line', style: `top: ${((m - axis.lo) / 60) * PX}px` })),
          lanes(mine).map(({ e, lane, of }) => {
            const top = ((toMin(e.start) - axis.lo) / 60) * PX;
            const tall = ((toMin(e.end) - toMin(e.start)) / 60) * PX;
            const block = link(e, 'tt-block ' + `t-${e.typeKey}` + (tall < 70 ? ' short' : ''),
              h('span', { class: 'tt-time' }, `${e.start}–${e.end}`),
              h('strong', { class: 'tt-name' }, e.code && h('b', { class: 'tt-code' }, e.code), ' ', e.name),
              h('span', { class: 'tt-meta' }, [e.room, e.type].filter(Boolean).join(' · ')));
            block.style.cssText += `; top: ${top + 1}px; height: ${tall - 2}px; left: calc(${(lane / of) * 100}% + 3px); width: calc(${100 / of}% - 6px)`;
            return block;
          }));
      }));
  }

  // Phone: the same week as a list per day.
  function weekList(list, monday, now) {
    const todayIso = iso(now);
    const days = [0, 1, 2, 3, 4, 5, 6].filter((i) => list.some((e) => e.weekday === i));
    return h('div', { class: 'tt-list' }, days.map((i) => {
      const day = addDays(monday, i);
      return h('section', { class: 'card tt-day' + (iso(day) === todayIso ? ' today' : '') },
        h('div', { class: 'tt-day-head' },
          h('b', {}, String(day.getDate())),
          h('span', {}, day.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' }))),
        list.filter((e) => e.weekday === i).sort((a, b) => a.start.localeCompare(b.start)).map((e) =>
          link(e, 'tt-item',
            h('span', { class: 'tt-item-time' }, h('b', {}, e.start), h('small', {}, e.end)),
            h('span', { class: 'tt-item-body' },
              h('strong', {}, e.name || e.code),
              h('small', {}, [e.code, e.type, e.room].filter(Boolean).join(' · '))))));
    }));
  }

  function nextList(list, now) {
    if (!list.length) return h('p', { class: 'muted tt-rail-empty' }, T.noneLeft);
    return h('div', { class: 'tt-next' }, list.map((e, i) => link(e, 'tt-next-row' + (i === 0 ? ' first' : ''),
      h('span', { class: 'tt-next-day' }, h('b', {}, String(e.day.getDate())), h('small', {}, T.days[e.weekday])),
      h('span', { class: 'tt-next-sep' }),
      h('span', { class: 'tt-next-body' },
        h('strong', {}, e.name || e.code),
        h('small', {}, [e.code, e.type, e.room].filter(Boolean).join(' · '))),
      h('span', { class: 'tt-next-time' }, startOf(e) <= now ? T.now : `${e.start} – ${e.end}`))));
  }

  function hoursChart(list, monday, now) {
    const per = [0, 0, 0, 0, 0, 0, 0];
    for (const e of list) per[e.weekday] += toMin(e.end) - toMin(e.start);
    const max = Math.max(...per, 1);
    const thisWeek = iso(monday) === iso(mondayOf(now));
    const today = thisWeek ? weekdayOf(now) : -1;
    const fmt = (m) => (m ? (m / 60).toLocaleString(locale, { maximumFractionDigits: 1 }) : '');
    return h('section', { class: 'card tt-chart' },
      h('div', { class: 'card-head' }, h('h2', {}, T.hoursChart), h('span', { class: 'tt-chart-total' }, dur(minutes(list)).text)),
      h('div', { class: 'tt-bars', role: 'img', 'aria-label': per.map((m, i) => `${T.days[i]} ${fmt(m) || 0} h`).join(', ') },
        per.map((m, i) => h('span', { class: 'tt-bar-col' + (i === today ? ' today' : '') + (i >= 5 ? ' weekend' : '') },
          h('small', {}, fmt(m)),
          h('span', { class: 'tt-bar' + (m ? '' : ' zero'), style: `height: ${m ? Math.max(6, (m / max) * 100) : 4}%` })))),
      h('div', { class: 'tt-bar-labels' }, T.days.map((n, i) => h('span', { class: i === today ? 'today' : null }, n))));
  }

  // One card per course: when, who, where, how many sessions.
  function courseSummary(d) {
    const map = new Map();
    for (const e of d.events) {
      const key = e.code || e.name;
      if (!map.has(key)) map.set(key, { code: e.code, name: e.name, href: e.href, list: [], people: new Map(), rooms: new Map(), notes: new Set(), types: new Set() });
      const c = map.get(key);
      c.list.push(e);
      c.href ||= e.href;
      e.people.forEach((p) => c.people.set(p.text, p));
      if (!e.people.length && e.teacher) c.people.set(e.teacher, { text: e.teacher });
      if (e.room) c.rooms.set(e.room, { text: e.room, href: e.roomHref });
      e.notes.forEach((n) => c.notes.add(n));
      c.types.add(e.type);
    }
    return h('div', { class: 'tt-courses' }, [...map.values()].map((c) => {
      const fac = facultyFor(c.code);
      const total = dur(minutes(c.list));
      return h('section', { class: 'card tt-course', style: `--fac: ${facultyColors(fac)[1]}` },
        h('div', { class: 'tt-course-top' },
          h('span', { class: 'tt-course-code' }, [c.code, fac].filter(Boolean).join(' · ')),
          h('span', { class: 'tt-course-num' }, d.weekly ? T.inWeek(c.list.length) : T.sessions(c.list.length))),
        c.href ? h('a', { class: 'tt-course-name', href: c.href }, c.name) : h('strong', { class: 'tt-course-name' }, c.name),
        h('div', { class: 'tags' }, [...c.types].map((t) => h('span', { class: 'tag' }, t)), h('span', { class: 'tag' }, `${total.text} ${T.total}`)),
        h('dl', { class: 'tt-facts' },
          c.people.size > 0 && [h('dt', {}, T.teachers), h('dd', {}, [...c.people.values()].map((p, i) =>
            [i ? ', ' : '', p.href ? anchor(p, {}, p.text) : p.text]))],
          c.rooms.size > 0 && [h('dt', {}, T.rooms), h('dd', {}, [...c.rooms.values()].map((r, i) =>
            [i ? ', ' : '', r.href ? anchor(r, {}, r.text) : r.text]))],
          c.notes.size > 0 && [h('dt', {}, T.notes), h('dd', {}, [...c.notes].join(' · '))]));
    }));
  }

  function buildPage(d, state) {
    const now = new Date();
    const monday = state.monday;
    const list = weekEvents(d, monday);
    const isThisWeek = iso(monday) === iso(mondayOf(now));
    const next = upcoming(d, now, 5);
    const total = dur(minutes(list));
    const weekend = d.events.some((e) => e.weekday >= 5);
    const showDays = weekend ? [0, 1, 2, 3, 4, 5, 6] : [0, 1, 2, 3, 4];

    // The time axis covers the shown week only (whole hours, at least five), so a short week stays compact.
    const lo = Math.floor(Math.min(...list.map((e) => toMin(e.start))) / 60) * 60;
    const hi = Math.ceil(Math.max(...list.map((e) => toMin(e.end))) / 60) * 60;
    const axis = { lo, hi: Math.max(hi, lo + 5 * 60) };

    const first = next[0];
    const courseCount = new Set(d.events.map((e) => e.code || e.name)).size;
    const shownLabel = d.weekly ? T.template : range(monday, addDays(monday, 6));
    const minWeek = d.weekly || !d.events.length ? null : mondayOf(fromIso(d.events[0].date));
    const maxWeek = d.weekly || !d.events.length ? null : mondayOf(fromIso(d.events.at(-1).date));
    const go = (m) => { state.reason = null; state.monday = m; state.render(); };

    const hint = d.weekly ? T.templateNote
      : state.reason === 'outside' ? T.outside(d.from && d.to ? rangeLong(d.from, d.to) : '')
        : state.reason === 'empty' ? T.notThisWeek(range(mondayOf(now), addDays(mondayOf(now), 6))) : null;

    const nav = !d.weekly && d.events.length && h('div', { class: 'tt-nav' },
      h('button', { type: 'button', class: 'tt-icon', 'aria-label': T.prev, title: T.prev,
        disabled: minWeek && monday <= minWeek ? '' : null, onclick: () => go(addDays(monday, -7)) }, icon('back')),
      h('span', { class: 'tt-nav-label' }, shownLabel),
      h('button', { type: 'button', class: 'tt-icon fwd', 'aria-label': T.next7, title: T.next7,
        disabled: maxWeek && monday >= maxWeek ? '' : null, onclick: () => go(addDays(monday, 7)) }, icon('back')),
      !isThisWeek && mondayOf(now) >= minWeek && mondayOf(now) <= maxWeek &&
        h('button', { type: 'button', class: 'tt-today', onclick: () => go(mondayOf(now)) }, T.back),
      state.initial && iso(state.initial) !== iso(monday) && iso(state.initial) !== iso(mondayOf(now)) &&
        h('button', { type: 'button', class: 'tt-today', onclick: () => go(state.initial) }, T.backNearest));

    const main = h('div', { class: 'tt-main' },
      h('div', { class: 'kpis' },
        kpi({ label: isThisWeek || d.weekly ? T.classesWeek : T.classesShown, value: list.length,
          status: !isThisWeek && !d.weekly && state.reason && { tone: 'neutral', text: T.nearest },
          foot: !d.weekly && !isThisWeek ? shownLabel : null }),
        kpi({ label: isThisWeek || d.weekly ? T.hoursWeek : T.hoursShown, value: total.value, unit: total.unit }),
        kpi({ label: T.next, isText: true,
          value: first ? `${first.day.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: lang === 'cs' ? 'numeric' : 'short' })} · ${first.start}` : T.none,
          status: first && { tone: startOf(first) <= now ? 'ok' : 'neutral', text: startOf(first) <= now ? T.now : relative(first.day, now) },
          foot: first && [first.code, first.room].filter(Boolean).join(' · ') }),
        kpi({ label: T.courses, value: courseCount, foot: !d.weekly && T.sessions(d.events.length) })),

      sectionHead(T.week, null, nav),
      hint && h('p', { class: 'tt-hint' }, icon('alert'), h('span', {}, hint)),
      !d.events.length ? emptyState(T.noEvents)
        : list.length
          ? [h('div', { class: 'card tt-week' }, weekGrid(list, monday, axis, now, showDays)), weekList(list, monday, now)]
          : emptyState(T.emptyWeek),

      d.events.length > 0 && [sectionHead(T.semesterCourses), courseSummary(d)],
      // One place for everything that takes the timetable elsewhere: the calendar transfer, then InSIS's own
      // list / print / PDF form (slotted right under this section).
      (d.form || ipx.nav.target('schedule.export')) && [
        h('div', { id: 'tt-export' }, sectionHead(T.options)),
        ipx.nav.target('schedule.export') && anchor({ href: ipx.nav.target('schedule.export') }, { class: 'card glist-item tt-export' },
          h('span', { class: 'tt-export-ico' }, icon('calendar')),
          h('span', { class: 'glist-text' }, h('strong', {}, T.toCalendar), h('small', {}, T.toCalendarText)),
          h('span', { class: 'glist-go' }, icon('arrow'))),
        d.form && h('p', { class: 'muted tt-options-hint' }, T.optionsHint)]);

    const marks = [...new Set(list.map((e) => e.weekday))];
    const rail = h('aside', { class: 'tt-rail' },
      weekStrip(isThisWeek ? now : monday, marks),
      h('section', {},
        h('div', { class: 'card-head' }, h('h2', {}, T.nextList)),
        nextList(next, now)),
      hoursChart(list, monday, now),
      d.changed && h('p', { class: 'muted tt-changed' }, `${T.lastChange}: ${d.changed}`));

    return [main, rail];
  }

  // What the dashboard rail needs: plain fields only, no HTML.
  function remember(d) {
    ipx.state.timetable = {
      updated: Date.now(),
      source: here.href,
      from: d.from ? iso(d.from) : null,
      to: d.to ? iso(d.to) : null,
      events: d.events.map((e) => ({
        date: e.date, weekday: e.weekday, start: e.start, end: e.end, code: e.code, name: e.name,
        type: e.type, room: e.room, teacher: e.teacher, note: e.note, people: e.people,
      })),
    };
    ipx.save();
  }

  // Background read (sync.js): parse a fetched page and store its data; nothing is drawn.
  (ipx.readers ||= {}).timetable = (fetched, url) => {
    doc = fetched; here = new URL(url);
    try { const data = parse(); if (data) remember(data); } finally { doc = document; here = location; }
  };

  ipx.ready.then(() => {
    const data = parse();
    if (!data) return;
    remember(data);

    const page = doc.getElementById('str1');
    const slotted = page && data.form && page.contains(data.form) ? [page] : null;
    if (slotted) {
      // Only the display-mode form of the original stays visible under the new view.
      keepOnly(page, data.form);
      document.documentElement.classList.add('ipx-tt');
      styleSlotted('pages/timetable.css');
    }

    const now = new Date();
    const start = initialWeek(data, now);
    const extra = [
      data.criteria && anchor(data.criteria, { class: 'tt-action', title: T.criteria }, icon('calendar'), h('span', {}, T.criteria)),
      (slotted || ipx.nav.target('schedule.export')) && h('button', { type: 'button', class: 'tt-action', title: T.print,
        onclick: (e) => e.currentTarget.getRootNode().getElementById('tt-export')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, icon('file'), h('span', {}, T.print)),
    ];

    takeover({
      key: 'timetable',
      css: 'pages/timetable.css',
      title: T.title,
      subtitle: data.from && data.to ? rangeLong(data.from, data.to) : data.weekly ? T.template : null,
      extra,
      slotted,
      build: () => {
        const wrap = h('div', { class: 'tt' });
        const state = { monday: start.monday, initial: start.monday, reason: start.reason,
          render: () => wrap.replaceChildren(...buildPage(data, state)) };
        state.render();
        return wrap;
      },
    });
  });
})();
