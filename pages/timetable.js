// InSIS+ — the student's personal timetable (katalog/rozvrhy_view.pl?…rozvrh_student=…).
// The original is one big grid: a header row of 5-minute slots ("08:00-08:05" …), then one row per day
// ("Mon 14/09/2026" when listing particular days, "Mon" for the weekly summary) with each class as a cell
// spanning its slots (class rozvrh-pred = lecture, rozvrh-cvic = seminar, …). Times come from the header
// columns a cell covers.
//
// My week (teardowns/exams-grades-schedule.md §2.7): title from the section label, no "Change criteria" action
// (the timetable search is a place in the sidebar). Everything that takes the timetable elsewhere is one place
// (03-pages.md §1 rule 4): the Export page action opens the "Export and print" sheet with the transfer to the
// university calendar and InSIS's own display-mode form (weekly / particular days, list, PDF). That form is the
// original element, slotted into the sheet (keepOnly hides the rest of InSIS's page): never copied, filled in or
// submitted by InSIS+, and nowhere else on the page.
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
    cs: { days: ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'],
      classesWeek: 'Výuka tento týden', classesShown: 'Výuka v týdnu', hoursWeek: 'Hodin tento týden', hoursShown: 'Hodin v týdnu',
      next: 'Další hodina', nextList: 'Nejbližší hodiny', none: 'Žádná', noneLeft: 'V tomto rozvrhu už žádná další hodina není.',
      courses: 'Předměty', sessions: (n) => `${n} ${ipx.kit.plural(n, 'termín', 'termíny', 'termínů')}`,
      today: 'dnes', tomorrow: 'zítra', inDays: (n) => `za ${n} ${n < 5 ? 'dny' : 'dní'}`, now: 'právě teď',
      nearest: 'nejbližší', week: 'Týden', prev: 'Předchozí týden', next7: 'Další týden', back: 'Tento týden',
      backNearest: 'Nejbližší výuka', template: 'Týdenní přehled',
      emptyWeek: 'V tomto týdnu nemáte žádnou výuku.',
      notThisWeek: (w) => `Tento týden (${w}) nemáte žádnou výuku, proto ukazuji nejbližší týden s výukou.`,
      outside: (r) => `Dnešek je mimo období tohoto rozvrhu (${r}), proto ukazuji nejbližší týden s výukou.`,
      templateNote: 'Rozvrh je ve formě týdenního přehledu: data jednotlivých hodin nejsou uvedena.',
      hoursChart: 'Výuka v týdnu', semesterCourses: 'Předměty v rozvrhu', teachers: 'Vyučující', rooms: 'Místnosti',
      notes: 'Poznámky', options: 'Export a tisk', printTitle: 'Tisk, PDF nebo seznam',
      optionsHint: 'Zvolte typ výpisu a formát a stiskněte tlačítko Zobrazit (InSIS). PDF se stáhne jako soubor; seznam a HTML znovu načtou tuto stránku. Váš rozvrh se tím nemění.',
      toCalendar: 'Do Outlooku a telefonu', toCalendarText: 'InSIS přenese rozvrh do kalendáře vašeho univerzitního účtu: uvidíte ho v Outlooku i v telefonu.',
      calendarTitle: 'Do kalendáře', close: 'Zavřít', print: 'Export', period: 'Období rozvrhu', lastChange: 'Poslední změna', noEvents: 'V tomto rozvrhu nejsou žádné hodiny.',
      inWeek: (n) => `${n}× v týdnu`, total: 'celkem' },
    en: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
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
      notes: 'Notes', options: 'Export and print', printTitle: 'Print, PDF or list',
      optionsHint: "Choose the type of list and the format, then press InSIS's Display button. PDF downloads a file; List and HTML reload this page. Your timetable itself doesn't change.",
      toCalendar: 'To Outlook and your phone', toCalendarText: 'InSIS transfers the timetable to the calendar of your university account: it shows in Outlook and on your phone.',
      calendarTitle: 'To your calendar', close: 'Close', print: 'Export', period: 'Timetable period', lastChange: 'Last change', noEvents: 'There are no classes in this timetable.',
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
      // Several notes in one cell are separated by <br> only ("Public holiday: …<br>Innovation day: …").
      if (key) out[key] = [...tds[1].childNodes].map((n) => (n.nodeName === 'BR' ? ' · ' : n.textContent)).join('').split(' · ').map(clean).filter(Boolean).join(' · ');
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

  // `search: true` also reads the grids of the timetable search (a teacher's timetable, a course's, a room's …):
  // the same markup, but never stored (not the student's own timetable).
  function parse({ search = false } = {}) {
    const personal = !!(/rozvrh_student=/.test(here.href) || doc.querySelector('input[name="rozvrh_student"]'));
    const found = findGrid();
    if ((!personal && !search) || !found) return null;
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
    const form = (personal ? doc.querySelector('form input[name="rozvrh_student"]') : doc.querySelector('form input[name="typ_vypisu"]'))?.form || null;
    const changed = doc.body.innerText.match(/(?:Last change|Poslední změna)\s*:\s*([0-9./: ]+)/i)?.[1]?.trim() || '';

    return {
      personal,
      events,
      weekly: !events.some((e) => e.date),
      from,
      to,
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

    const nav = !d.weekly && d.events.length > 0 && h('div', { class: 'tt-nav' },
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

      d.events.length > 0 && [sectionHead(T.semesterCourses), courseSummary(d)]);

    const marks = [...new Set(list.map((e) => e.weekday))];
    const rail = h('aside', { class: 'tt-rail' },
      weekStrip(isThisWeek ? now : monday, marks),
      h('section', {},
        h('div', { class: 'card-head' }, h('h2', {}, T.nextList)),
        nextList(next, now)),
      hoursChart(list, monday, now),
      ((d.from && d.to) || d.changed) && h('p', { class: 'muted tt-changed' },
        d.from && d.to && h('span', {}, `${T.period}: ${rangeLong(d.from, d.to)}`),
        d.changed && h('span', {}, `${T.lastChange}: ${d.changed}`)));

    return [main, rail];
  }

  // Export and print (one place per job): a side sheet on this page. (a) the transfer to the university calendar
  // (a link to InSIS's settings page, which only the student changes there); (b) InSIS's display-mode form, which
  // shows in the sheet through the <slot> (the form element itself, slotted; never copied or submitted here).
  function exportSheet(calendar, withForm, heading = T.options, hint = T.optionsHint) {
    const sheet = h('dialog', { class: 'tt-sheet', 'aria-labelledby': 'tt-sheet-title' });
    const close = () => sheet.close();
    // A click on the backdrop (outside the panel) closes the sheet, like Escape.
    sheet.addEventListener('click', (e) => { if (e.target === sheet) close(); });
    sheet.append(h('div', { class: 'tt-sheet-body' },
      h('div', { class: 'tt-sheet-head' },
        h('h2', { id: 'tt-sheet-title' }, heading),
        h('button', { type: 'button', class: 'btn ghost tt-sheet-close', onclick: close }, T.close)),
      calendar && h('section', { class: 'tt-sheet-part' },
        h('h3', {}, T.calendarTitle),
        anchor({ href: calendar }, { class: 'card glist-item tt-export' },
          h('span', { class: 'tt-export-ico' }, icon('calendar')),
          h('span', { class: 'glist-text' }, h('strong', {}, T.toCalendar), h('small', {}, T.toCalendarText)),
          h('span', { class: 'glist-go' }, icon('arrow')))),
      withForm && h('section', { class: 'tt-sheet-part' },
        h('h3', {}, T.printTitle),
        h('p', { class: 'muted tt-options-hint' }, hint),
        h('slot'))));
    return sheet;
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
        type: e.type, room: e.room, roomHref: e.roomHref, teacher: e.teacher, note: e.note, people: e.people,
      })),
    };
    ipx.save();
  }

  // ---------- the timetable search (teardowns/exams-grades-schedule.md §2.8) ----------
  // Every other page of rozvrhy_view.pl: the criteria page (F: InSIS's "Other timetables" form in a form card; its
  // "Personal timetable" form is hidden, because that job is My week), the steps choosing which published timetables
  // are searched (konf: link lists → R; the checkbox step → F, InSIS's table styled in place), and the result grids
  // (a teacher's timetable …: R with the week view above, InSIS's display-mode form only in the Display options
  // sheet). InSIS's forms are slotted, never copied, filled in or submitted; links pass the URL rule. Titles follow
  // 03-pages.md rule 7: the criteria page is the section (Timetable search, eyebrow Schedule); the steps and the
  // results are pages below it (eyebrow Timetable search).

  const TS = {
    cs: { search: 'Hledání v rozvrzích', choose: 'Výběr rozvrhů', timetable: 'Rozvrh',
      searchLead: 'Najděte rozvrh vyučujícího, předmětu nebo studijního programu. Rozvrhy místností jsou v sekci Místnosti.',
      mine: 'Váš vlastní rozvrh', mineText: 'Vaše hodiny, týden po týdnu, jsou v Mém týdnu.',
      formTitle: 'Další rozvrhy', formLead: 'Zvolte jedno nebo více kritérií a stiskněte tlačítko Zobrazit (InSIS). Tlačítko Individuální výběr umožní vybrat víc vyučujících, předmětů nebo místností.',
      who: 'Kdo', what: 'Co a kdy', where: 'Kde', programme: 'Program a skupina',
      scope: 'V kterých rozvrzích se hledá', scopeText: 'Obvykle je vybrán aktuální semestr; měnit to potřebujete jen výjimečně.',
      chooseLead: 'V kterých zveřejněných rozvrzích hledat. Obvykle je aktuální semestr už vybrán; měnit to potřebujete jen výjimečně.',
      pickTitle: 'Rozvrhy k prohledání', pickLead: 'Zaškrtněte rozvrhy a stiskněte tlačítko Vybrat zaškrtnuté rozvrhy (InSIS). Tlačítka pod seznamem zaškrtnou rozvrhy podle fakulty nebo formy studia.',
      byPeriod: 'Podle období platnosti', byDept: 'Podle pracoviště', allPeriods: 'Zobrazit všechna období',
      count: (n) => `${n} ${ipx.kit.plural(n, 'rozvrh', 'rozvrhy', 'rozvrhů')}`, now: 'teď', filter: 'Hledat období (např. 2026)', noMatch: 'Nic neodpovídá hledání.',
      options: 'Možnosti zobrazení', optionsHint: 'Zvolte typ výpisu a formát a stiskněte tlačítko Zobrazit (InSIS). PDF se stáhne jako soubor; seznam a HTML znovu načtou tuto stránku.' },
    en: { search: 'Timetable search', choose: 'Choose timetables', timetable: 'Timetable',
      searchLead: 'Find the timetable of a teacher, a course or a programme. Room timetables are in Rooms.',
      mine: 'Your own timetable', mineText: 'Your classes, week by week, are in My week.',
      formTitle: 'Other timetables', formLead: "Pick one or more criteria and press InSIS's Display button. Individual selection lets you pick several teachers, courses or rooms.",
      who: 'Who', what: 'What and when', where: 'Where', programme: 'Programme and group',
      scope: 'Which timetables are searched', scopeText: 'Usually the current semester is already chosen; you rarely need to change it.',
      chooseLead: 'Which published timetables to search in. Usually the current semester is already chosen; you rarely need this.',
      pickTitle: 'Timetables to search', pickLead: "Tick the timetables and press InSIS's Select ticked timetables button. The buttons under the list tick them by faculty or form of study.",
      byPeriod: 'By period of validity', byDept: 'By department', allPeriods: 'Show all periods',
      count: (n) => `${n} ${n === 1 ? 'timetable' : 'timetables'}`, now: 'now', filter: 'Find a period (e.g. 2026)', noMatch: 'Nothing matches.',
      options: 'Display options', optionsHint: "Choose the type of list and the format, then press InSIS's Display button. PDF downloads a file; List and HTML reload this page." },
  }[lang];

  // The row groups of the criteria form, by the names of InSIS's selects (CSS draws the group labels).
  const CRITERIA = { mistnost: 'where', garant: 'who', ucitel: 'who', predmet: 'what', ustav: 'what', den: 'what',
    stupen: 'programme', program: 'programme', obor: 'programme', k_skupina: 'programme' };
  // Columns of the checkbox step, by InSIS's header text.
  const PICK_COLS = [['select', /^(sel|ozn)/], ['name', /^(timetable|rozvrh)/], ['period', /^(study period|obdobi)/],
    ['dept', /^(department|pracoviste|fakulta)/], ['form', /^(form|forma)/], ['from', /^(beginning|zacatek|od)/], ['to', /^(end|konec|do)/]];

  const crumbLinks = (page) => [...page.querySelectorAll('.breadcrumb-item a[href]')].map(ipx.kit.linkOf).filter(Boolean);
  const kind = (page) => {
    if (page.querySelector('form select[name="ucitel"], form select[name="garant"]')) return 'criteria';
    if (page.querySelector('form input[type="checkbox"][name="rozvrh"]')) return 'pick';
    if (ipx.kit.findTables(page).some((t) => t.querySelector('a[href*="konf="]'))) return 'konf';
    return null;
  };

  function criteriaPage(page) {
    const form = page.querySelector('form select[name="ucitel"], form select[name="garant"]').form;
    form.setAttribute('data-ipx-criteria', '');
    const seen = new Set();
    for (const tr of form.querySelectorAll('tr')) {
      const sel = tr.querySelector('select[name]');
      const grp = sel && CRITERIA[sel.name];
      if (grp) {
        tr.setAttribute('data-ipx-grp', grp);
        if (!seen.has(grp)) { seen.add(grp); tr.setAttribute('data-ipx-grp-label', TS[grp]); }
      } else if (sel?.name === 'format') tr.setAttribute('data-ipx-grp', 'format');
      else if (!sel && /^\*/.test(clean(tr.textContent))) tr.setAttribute('data-ipx-grp', 'note');
    }
    document.documentElement.classList.add('ipx-tts');
    styleSlotted('pages/timetable.css');
    const week = ipx.nav.target('schedule.week');
    const scope = crumbLinks(page).filter((l) => /konf=/.test(l.href)).at(-1);
    ipx.kit.page({
      key: 'timetable-search', css: 'pages/timetable.css', title: ipx.nav.sectionLabel('schedule.search') || TS.search, subtitle: ipx.nav.label('schedule'), form,
      build: ({ formCard }) => [
        h('p', { class: 'muted tts-lead' }, TS.searchLead),
        week && anchor({ href: week }, { class: 'card glist-item tts-card' },
          h('span', { class: 'tt-export-ico' }, icon('calendar')),
          h('span', { class: 'glist-text' }, h('strong', {}, TS.mine), h('small', {}, TS.mineText)),
          h('span', { class: 'glist-go' }, icon('arrow'))),
        formCard({ title: TS.formTitle, lead: TS.formLead }),
        scope && anchor({ href: scope.href }, { class: 'card glist-item tts-card' },
          h('span', { class: 'tt-export-ico' }, icon('layers')),
          h('span', { class: 'glist-text' }, h('strong', {}, TS.scope), h('small', {}, TS.scopeText)),
          h('span', { class: 'glist-go' }, icon('arrow'))),
      ],
    });
  }

  function pickPage(page) {
    const form = page.querySelector('form input[type="checkbox"][name="rozvrh"]').form;
    const table = [...form.querySelectorAll('table')].find((t) => t.querySelector('input[type="checkbox"][name="rozvrh"]'));
    form.setAttribute('data-ipx-pick', '');
    table.setAttribute('data-ipx-list', 'pick');
    const heads = [...(table.tHead?.rows[0]?.cells || [])];
    const roles = heads.map((th) => (th.classList.contains('UISTMNumberCell') ? 'num' : PICK_COLS.find(([, re]) => re.test(norm(th.textContent)))?.[0] || null));
    const mark = () => {
      for (const tr of table.tBodies[0]?.rows || []) {
        // InSIS's table script may add a (hidden) row-number cell in front after load: the roles shift by it.
        const offset = Math.max(0, tr.cells.length - roles.length);
        [...tr.cells].forEach((td, i) => td.setAttribute('data-ipx-col', i < offset ? 'num' : roles[i - offset] || 'other'));
        // The row reads as: name · dates / period · department · form. Department, form and end date are shown
        // by CSS from these attributes (InSIS's cells stay where they are).
        const cell = (role) => tr.querySelector(`[data-ipx-col="${role}"]`);
        const extra = [cell('dept'), cell('form')].map((td) => clean(td?.textContent)).filter(Boolean).join(' · ');
        if (extra) cell('period')?.setAttribute('data-ipx-extra', ` · ${extra}`);
        const to = clean(cell('to')?.textContent);
        if (to) cell('from')?.setAttribute('data-ipx-to', ` – ${to}`);
      }
    };
    mark();
    // InSIS's script runs after this module on some loads; mark again once it has added its cells.
    setTimeout(mark, 800);
    form.querySelectorAll(':scope > input[type="button"]').forEach((b) => b.setAttribute('data-ipx-part', 'tick'));
    document.documentElement.classList.add('ipx-tts');
    styleSlotted('pages/timetable.css');
    ipx.kit.page({
      key: 'timetable-search', css: 'pages/timetable.css', title: TS.choose, subtitle: ipx.nav.sectionLabel('schedule.search'), form,
      build: ({ formCard }) => [h('p', { class: 'muted tts-lead' }, TS.chooseLead), formCard({ title: TS.pickTitle, lead: TS.pickLead })],
    });
  }

  function konfPage(page) {
    const lists = ipx.kit.findTables(page).filter((t) => t.querySelector('a[href*="konf="]')).map((t) => {
      const { rows } = ipx.kit.readTable(t);
      const items = rows.map((r) => {
        const link = r.cells.flatMap((c) => c.links).find((l) => /konf=/.test(l.href));
        const texts = r.cells.map((c) => c.text);
        const from = ipx.kit.dateOf(texts[0]);
        const to = from && ipx.kit.dateOf(texts[1]);
        const n = texts.slice(1).find((x) => /^\d+$/.test(x));
        return link && { href: link.href, from, to, name: from ? null : texts[0], n: n != null ? Number(n) : null };
      }).filter(Boolean);
      return { dated: items.some((i) => i.from), items };
    }).filter((l) => l.items.length);
    if (!lists.length) return;
    const all = [...page.querySelectorAll('a[href*="vse=1"]')].filter((a) => !a.closest('table')).map(ipx.kit.linkOf).find(Boolean);
    const now = new Date();
    const isNow = (i) => i.from && i.to && i.from <= now && now < addDays(i.to, 1);
    const row = (i) => anchor({ href: i.href }, { class: 'tts-row' + (isNow(i) ? ' now' : '') },
      h('span', { class: 'tts-row-main' }, i.from ? rangeLong(i.from, i.to || i.from) : i.name),
      isNow(i) && h('span', { class: 'delta ok' }, TS.now),
      i.n != null && h('small', { class: 'tts-row-n' }, TS.count(i.n)),
      h('span', { class: 'tts-go' }, icon('chevron')));
    const block = (l) => {
      // Periods newest first; a long list gets a filter (InSIS lists every period since 2009 on "all").
      const items = l.dated ? [...l.items].sort((a, b) => b.from - a.from) : l.items;
      const box = h('div', { class: 'card tts-list' }, items.map(row));
      const empty = h('p', { class: 'muted tts-nomatch', hidden: '' }, TS.noMatch);
      const filter = items.length > 30 && h('input', { type: 'search', class: 'tts-filter', placeholder: TS.filter, 'aria-label': TS.filter,
        oninput: (e) => {
          const q = norm(e.target.value.trim());
          let shown = 0;
          [...box.children].forEach((a) => { const hit = !q || norm(a.textContent).includes(q); a.hidden = !hit; shown += hit ? 1 : 0; });
          empty.hidden = shown > 0;
        } });
      return h('section', { class: 'tts-block' },
        sectionHead(l.dated ? TS.byPeriod : TS.byDept, l.dated && all ? { href: all.href, text: TS.allPeriods } : null), filter, box, empty);
    };
    ipx.kit.page({
      key: 'timetable-search', css: 'pages/timetable.css', title: TS.choose, subtitle: ipx.nav.sectionLabel('schedule.search'),
      build: () => [h('p', { class: 'muted tts-lead' }, TS.chooseLead), lists.map(block)],
    });
  }

  // A result grid (a teacher's timetable …): the week view of My week, with InSIS's display-mode form in the sheet.
  function resultPage(data) {
    const page = doc.getElementById('str1');
    const heading = clean(page.querySelector('#titulek h1')?.textContent || page.querySelector('#titulek')?.textContent);
    // "Timetable for teacher doc. … / Rozvrh učitele …" → the person or thing it is for.
    const what = heading.replace(/^(timetable|rozvrh)\s+(for\s+)?(teacher|učitele|vyučujícího|of)?\s*/i, '') || heading;
    const slotted = data.form && page.contains(data.form) ? [page] : null;
    if (slotted) {
      keepOnly(page, data.form);
      document.documentElement.classList.add('ipx-tt');
      styleSlotted('pages/timetable.css');
    }
    const sheet = slotted ? exportSheet(null, true, TS.options, TS.optionsHint) : null;
    const start = initialWeek(data, new Date());
    takeover({
      key: 'timetable-search',
      css: 'pages/timetable.css',
      title: what ? `${TS.timetable} · ${what}` : TS.timetable,
      subtitle: ipx.nav.sectionLabel('schedule.search'),
      extra: [sheet && h('button', { type: 'button', class: 'tt-action', title: TS.options, 'aria-haspopup': 'dialog',
        onclick: () => sheet.showModal() }, icon('gear'), h('span', {}, TS.options))],
      slotted,
      build: () => {
        const view = h('div', { class: 'tt-view' });
        const state = { monday: start.monday, initial: start.monday, reason: start.reason,
          render: () => view.replaceChildren(...buildPage(data, state)) };
        state.render();
        return h('div', { class: 'tt tt-result' }, view, sheet);
      },
    });
  }

  function search() {
    if (ipx.nav.route(document.baseURI.split('#')[0]).path !== '/auth/katalog/rozvrhy_view.pl') return;
    const page = doc.getElementById('str1');
    if (!page || !ipx.kit) return;
    const grid = parse({ search: true });
    if (grid && !grid.personal) { resultPage(grid); return; }
    const k = kind(page);
    if (k === 'criteria') criteriaPage(page);
    else if (k === 'pick') pickPage(page);
    else if (k === 'konf') konfPage(page);
  }

  // Background read (sync.js): parse a fetched page and store its data; nothing is drawn.
  (ipx.readers ||= {}).timetable = (fetched, url) => {
    doc = fetched; here = new URL(url);
    try { const data = parse(); if (data?.personal) remember(data); } finally { doc = document; here = location; }
  };

  ipx.ready.then(() => {
    const data = parse();
    if (!data) { search(); return; }
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
    const calendar = ipx.nav.target('schedule.export');
    const sheet = (slotted || calendar) ? exportSheet(calendar, !!slotted) : null;
    const extra = [
      sheet && h('button', { type: 'button', class: 'tt-action', title: T.options, 'aria-haspopup': 'dialog',
        onclick: () => sheet.showModal() }, icon('file'), h('span', {}, T.print)),
    ];

    takeover({
      key: 'timetable',
      css: 'pages/timetable.css',
      title: ipx.nav.sectionLabel('schedule.week'),
      subtitle: ipx.nav.label('schedule'),
      extra,
      slotted,
      build: () => {
        // The week view redraws itself (week navigation); the sheet stays outside it, so its slot is never lost.
        const view = h('div', { class: 'tt-view' });
        const state = { monday: start.monday, initial: start.monday, reason: start.reason,
          render: () => view.replaceChildren(...buildPage(data, state)) };
        state.render();
        return h('div', { class: 'tt' }, view, sheet);
      },
    });
  });
})();
