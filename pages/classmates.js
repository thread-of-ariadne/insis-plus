// InSIS+ — classmates (student/spoluzaci.pl). Treatment L in place (teardowns/courses.md §2.1 People, §2.2).
// Two InSIS views at one address:
// - the overview (no predmet): one row per course of the period — Code · Course · Seminar · Students (all / from
//   teacher / from seminar, the last with InSIS's "send an e-mail" link). The e-mail link is an action (email= is on
//   the deny list), so the table stays InSIS's own: its rows are styled in place as list rows, the icon links get
//   words next to them, nothing is moved or copied.
// - one course (predmet, optionally a group): the "Course:" line, a count line ("students 1 to 40 from 120"), two
//   page-range tables (top and bottom), the list Name · Study information · Send an e-mail (InSIS's mail compose
//   link per student) and InSIS's form with the "list with photos" button. The list is styled in place (the name,
//   InSIS's own link to the person, is stretched over the row), one pager under the list, the photo button as a
//   small form card. Names are never read into InSIS+ (docs/ia/02-redesign.md principle 8): only counts.
// Header (kit.section, drawn by generic.js): a course of mine is part of the course page — its title, the course's
// view tabs with People marked, the sidebar on the course (the same header as #ipx:course.people). Another course:
// title the course, eyebrow Classmates. The overview: title Classmates, eyebrow My courses.
// Nothing is stored.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.kit || !ipx.lists) return;
  const { lang, clean, norm } = ipx;
  const { h } = ipx.ui;
  const kit = ipx.kit;
  const nav = ipx.nav;
  const L = ipx.lists;
  const PATH = '/auth/student/spoluzaci.pl';

  const T = {
    cs: { title: 'Spolužáci', all: 'Celý předmět', teacher: 'Stejný vyučující', seminar: 'Můj seminář', mail: 'E-mail skupině',
      message: 'Zpráva', seminarCol: 'Seminář', students: (n) => `${n} ${kit.plural(n, 'student', 'studenti', 'studentů')}`,
      shown: (a, b) => `zobrazeno ${a}–${b}`, courses: (n) => `${n} ${kit.plural(n, 'předmět', 'předměty', 'předmětů')} v tomto období`,
      overview: 'Kdo s vámi studuje které předměty. Celý předmět ukáže všechny studenty, Můj seminář jen vaši skupinu; E-mail skupině otevře v InSIS zprávu pro váš seminář.',
      list: 'Jméno otevře stránku člověka; Zpráva napíše přes poštu InSIS.',
      photos: 'Seznam s fotografiemi otevře InSIS po stisknutí tlačítka.' },
    en: { title: 'Classmates', all: 'Whole course', teacher: 'Same teacher', seminar: 'My seminar', mail: 'E-mail group',
      message: 'Message', seminarCol: 'Seminar', students: (n) => `${n} ${n === 1 ? 'student' : 'students'}`,
      shown: (a, b) => `showing ${a}–${b}`, courses: (n) => `${n} ${n === 1 ? 'course' : 'courses'} this period`,
      overview: 'Who studies each course with you. Whole course lists every student, My seminar only your group; E-mail group opens a message to your seminar in InSIS.',
      list: 'A name opens the person’s page; Message writes through InSIS mail.',
      photos: 'InSIS opens the list with photos when you press its button.' },
  }[lang];

  const route = () => nav.route(document.baseURI.split('#')[0]);
  const predmet = () => route().params?.get?.('predmet') || null;

  // The student's course this page is about: the study record's syllabus links carry the same predmet number.
  function myCourse() {
    const id = predmet();
    if (!id) return null;
    const c = (ipx.state.studyRecord?.courses || []).find((x) => /predmet=(\d+)/.exec(x.href || '')?.[1] === id);
    return c?.code ? c : null;
  }

  // What the page module found (filled in ready(), before generic.js draws the header).
  let found = null;

  kit.section({
    id: 'classmates',
    css: ['pages/course-pages.css'],
    title: () => myCourse()?.name || (predmet() ? found?.course : null) || T.title,
    subtitle: () => (myCourse() ? nav.label('courses') : predmet() ? T.title : nav.sectionLabel('courses.mine')),
    pages: { [PATH]: () => (predmet() ? (myCourse() ? 'course.people' : null) : 'all') },
    views: () => {
      const c = myCourse();
      return c ? nav.tabs.course.map((node) => ({ id: node, href: nav.composedUrl(node, c.code), text: nav.label(node) })) : [];
    },
    node: () => (myCourse() ? 'course.people' : 'courses.mine'),
    lead: () => found?.lead?.() || null,
  });

  function overview(page, table) {
    const { rows } = L.mark(table, (t) => (/^(students|studenti)/.test(t) ? 'act' : /^(code|kod)/.test(t) ? 'lead'
      : /seminar/.test(t) ? 'sub' : /^(course|predmet)/.test(t) ? 'title' : null), { labels: { 2: T.seminarCol } });
    for (const tr of rows) {
      const acts = [...tr.querySelectorAll('td[data-il-col="act"] a[href]')];
      for (const a of acts) {
        const p = nav.parse(a.href)?.params;
        L.label(a, p?.has('email') ? T.mail : p?.has('vyucujici') ? T.teacher : p?.has('skupina') ? T.seminar : T.all);
      }
    }
    found = { lead: () => h('div', { class: 'cp-lead' },
      h('p', { class: 'cp-facts' }, h('span', { class: 'delta neutral' }, T.courses(rows.length))),
      h('p', { class: 'muted small' }, T.overview)) };
  }

  function course(page, list) {
    // The "Course:" line (a two-cell table) names the course; the header shows it, so the line goes.
    const kvTable = [...page.querySelectorAll('table')].find((t) => t !== list && !L.isHead(t.rows[0] || document.createElement('tr')) && t.rows.length <= 3 && kit.keyValues(t).length);
    const facts = kvTable ? kit.keyValues(kvTable) : [];
    const name = facts[0]?.value || null;
    // "… students 1 to 40 from 120 …" / "… spolužáků 1 až 40 z 120 …"
    const countLine = [...page.querySelectorAll('div.small')].map((d) => clean(d.textContent)).find((t) => /\d+\D+\d+\D+\d+/.test(t)) || '';
    const [, from, to, total] = /(\d+)\D+?(\d+)\D+?(\d+)/.exec(countLine) || [];
    const { rows } = L.mark(list, (t, i) => (/(name|jmeno)/.test(t) ? 'title' : /(e-?mail)/.test(t) ? 'act' : /(study|studi)/.test(t) ? 'note' : i === 0 ? 'num' : null), { stretch: true, side: true });
    rows.forEach((tr) => tr.querySelectorAll('td[data-il-col="act"] a[href]').forEach((a) => L.label(a, T.message)));
    // Page ranges: the tables of links between the count line and the list; only the one under the list stays.
    const pagers = [...page.querySelectorAll('table')].filter((t) => t !== list && t.querySelector('a[href*="spoluzaci.pl"]') && /\d+\s*[–-]\s*\d+/.test(t.textContent));
    pagers.forEach((t) => L.pager(t));
    const below = pagers.filter((t) => list.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING);
    ipx.ui.hideInSlot([...pagers.filter((t) => !below.includes(t) || t !== below.at(-1)), kvTable].filter(Boolean));
    const photos = [...page.querySelectorAll('form')].find((f) => f.querySelector('input[name="zobraz_fotky"]'));
    photos?.setAttribute('data-il-form', T.photos);
    found = {
      course: name,
      lead: () => h('div', { class: 'cp-lead' },
        h('p', { class: 'cp-facts' },
          total && h('span', { class: 'delta neutral' }, T.students(Number(total))),
          from && to && Number(total) > Number(to) - Number(from) + 1 && h('span', { class: 'muted' }, T.shown(from, to)),
          // Further lines of InSIS's course table (a seminar group, a teacher), as facts.
          facts.slice(1).map((f) => h('span', { class: 'cp-fact' }, h('span', { class: 'muted' }, `${f.label}: `), f.value))),
        h('p', { class: 'muted small' }, T.list)),
    };
  }

  ipx.ready.then(() => {
    if (route().path !== PATH) return;
    const page = document.getElementById('str1');
    if (!page) return;
    const tables = [...page.querySelectorAll('table')];
    const headOf = (t) => L.columns(t).map((x) => norm(x));
    const list = tables.find((t) => t.querySelector('a[href*="clovek.pl"]') && headOf(t).some((x) => /(name|jmeno)/.test(x)));
    const over = !list && tables.find((t) => headOf(t).some((x) => /^(code|kod)$/.test(x)) && headOf(t).some((x) => /seminar/.test(x)));
    if (!list && !over) return;
    if (list) course(page, list); else overview(page, over);
    L.chrome(page);
    L.on('ipx-classmates');
  });
})();
