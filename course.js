// InSIS+ — the course page and the Courses pages that exist only in InSIS+ (docs/ia/02-redesign.md §3 Courses).
// A course is composed from what InSIS spreads over several pages: the study record (credits, completion, result),
// the personal timetable (classes, teachers), submission boxes, the document server tree (folder, new files) and
// To do. Records belong to a course only by exact course code. Per-course InSIS pages are read only when the
// course page is opened (classmates), and only through the URL rule (nav.js).
//
// Routes (composed.js): #ipx:courses.mine · #ipx:courses.files · #ipx:course.<tab>/<CODE>
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.ui || !ipx.nav || !ipx.composed) return;
  const { lang, clean } = ipx;
  const { h, icon, anchor, courseCard, emptyState, nextClasses, facultyFor, facultyColors, countdown } = ipx.ui;
  const nav = ipx.nav;
  const locale = lang === 'cs' ? 'cs-CZ' : 'en-GB';

  const T = {
    cs: { credits: 'kreditů', completion: 'Zakončení', status: 'Stav', inProgress: 'probíhá', passed: 'splněno', failed: 'nesplněno',
      next: 'Příští hodiny', noClasses: 'V rozvrhu nejsou žádné další hodiny tohoto předmětu.', waiting: 'Co tě čeká', nothing: 'Nic nečeká.',
      open: 'Otevřít', folder: 'Složka předmětu na dokumentovém serveru', newN: (n) => `${n} nových`, noFolder: 'Složku předmětu se nepodařilo spárovat podle kódu.',
      allFolders: 'Všechny složky', moodle: 'Někteří vyučující dávají materiály do Moodlu.', boxes: 'Odevzdávárny předmětu', noBoxes: 'Pro tento předmět nejsou žádné odevzdávárny.',
      allBoxes: 'Všechny odevzdávárny v InSIS', topics: 'Přihlašování na témata', result: 'Výsledek', attempts: 'Pokusy a termíny', points: 'Průběžné body',
      pointsText: 'Body z průběžného hodnocení ukazuje InSIS v listu předmětu.', examDates: 'Termíny zkoušek', tests: 'Online testy a kvízy',
      teachers: 'Vyučující (podle rozvrhu)', classmates: 'Spolužáci', classmatesLoad: 'Načítám seznam…', classmatesNone: 'Seznam spolužáků se nepodařilo načíst.',
      classmatesAll: 'Celý seznam v InSIS', syllabus: 'Otevřít sylabus', passRates: 'Úspěšnost předmětu', notMine: 'Tento předmět není mezi vašimi zapsanými předměty.',
      lectures: 'List předmětu (InSIS)', due: 'odevzdat', allCourses: 'Moje předměty', coursesEmpty: 'Zapsané předměty se zatím nenačetly.',
      mineHint: 'Předměty tohoto období podle e-indexu.', myFolders: 'Moje předměty', insisViews: 'Dokumentový server', newDocs: 'Nové dokumenty',
      myAll: 'Všechny moje složky', tree: 'Celý strom', search: 'Hledat', library: 'E-knihovna', settings: 'Nastavení' },
    en: { credits: 'credits', completion: 'Completion', status: 'Status', inProgress: 'in progress', passed: 'passed', failed: 'not passed',
      next: 'Next classes', noClasses: 'No more classes of this course in the timetable.', waiting: 'What is coming', nothing: 'Nothing waiting.',
      open: 'Open', folder: 'Course folder on the document server', newN: (n) => `${n} new`, noFolder: 'The course folder could not be matched by its code.',
      allFolders: 'All folders', moodle: 'Some teachers put materials in Moodle.', boxes: 'Submission boxes of this course', noBoxes: 'There are no submission boxes for this course.',
      allBoxes: 'All submission boxes in InSIS', topics: 'Topic sign-up', result: 'Result', attempts: 'Attempts and dates', points: 'Points so far',
      pointsText: 'InSIS shows the points of continuous assessment in the course sheet.', examDates: 'Exam dates', tests: 'Online tests and quizzes',
      teachers: 'Teachers (from the timetable)', classmates: 'Classmates', classmatesLoad: 'Loading the list…', classmatesNone: 'The list of classmates could not be loaded.',
      classmatesAll: 'Full list in InSIS', syllabus: 'Open the syllabus', passRates: 'Pass rates', notMine: 'This course is not among your enrolled courses.',
      lectures: 'Course sheet (InSIS)', due: 'due', allCourses: 'My courses', coursesEmpty: 'Your enrolled courses have not loaded yet.',
      mineHint: 'Courses of this period from your study record.', myFolders: 'My courses', insisViews: 'Document server', newDocs: 'New documents',
      myAll: 'All my folders', tree: 'Whole tree', search: 'Search', library: 'e-Library', settings: 'Settings' },
  }[lang];

  // ---------- the course model ----------

  function courses() {
    const rec = ipx.state.studyRecord;
    const list = (rec?.courses || []).map((c) => ({ ...c, predmet: /predmet=(\d+)/.exec(c.href || '')?.[1] || null }));
    if (list.length) return list;
    const seen = new Map();
    for (const e of ipx.state.timetable?.events || []) if (e.code && !seen.has(e.code)) seen.set(e.code, { code: e.code, name: e.name });
    return [...seen.values()];
  }
  const courseOf = (code) => courses().find((c) => c.code === code) || null;
  const eventsOf = (code) => (ipx.state.timetable?.events || []).filter((e) => e.code === code);
  const folderOf = (code) => (ipx.state.docserver?.courses || []).find((c) => c.code === code) || null;
  const boxesOf = (code) => (ipx.state.submissions?.boxes || []).filter((b) => b.code === code);

  // A link to an InSIS page of the student's (from the portal), with one parameter added, through the URL rule.
  function portalLink(path, add) {
    const base = ipx.state.portal?.paths?.[path]?.href;
    if (!base) return null;
    const extra = Object.entries(add || {}).map(([k, v]) => `${k}=${v}`).join(';');
    return nav.safe(extra ? `${base}${base.includes('?') ? ';' : '?'}${extra}` : base, 'link', { copied: true });
  }

  function statusOf(c) {
    if (c.passed === true) return { tone: 'ok', text: T.passed };
    if (c.passed === false) return { tone: 'bad', text: T.failed };
    return { tone: 'neutral', text: T.inProgress };
  }

  const linkRow = (l) => anchor(l, { class: 'card glist-item' },
    h('span', { class: 'glist-text' }, h('strong', {}, l.text), l.gloss && h('small', {}, l.gloss)),
    h('span', { class: 'glist-go' }, icon('arrow')));

  // ---------- the course page ----------

  const TABS = nav.tabs.course;

  function courseTabs(code, active) {
    return h('nav', { class: 'dest-tabs course-tabs', 'aria-label': code },
      TABS.map((node) => h('a', { href: nav.composedUrl(node, code), class: node === active ? 'on' : null,
        'aria-current': node === active ? 'page' : null }, nav.label(node))));
  }

  function header(c) {
    const fac = facultyFor(c.code);
    const st = statusOf(c);
    return h('div', { class: 'course-head' },
      h('span', { class: 'course-code', style: `color: ${facultyColors(fac)[1]}` }, [c.code, fac].filter(Boolean).join(' · ')),
      h('div', { class: 'course-facts' },
        c.ects != null && c.ects !== '' && h('span', { class: 'fact' }, h('b', {}, String(c.ects)), ' ', T.credits),
        c.completion && h('span', { class: 'fact' }, T.completion, ' ', h('b', {}, c.completion)),
        h('span', { class: `delta ${st.tone}` }, st.text)));
  }

  const BUILD = {
    'course.overview': (c) => {
      const todo = ipx.todo ? ipx.todo.items({ course: c.code }) : [];
      const upcoming = nextClasses(eventsOf(c.code), nav.target('schedule.week'), 3);
      return [
        h('div', { class: 'course-grid' },
          h('section', { class: 'card pad' }, h('h2', { class: 'card-title' }, T.next), upcoming || h('p', { class: 'muted' }, T.noClasses)),
          h('section', { class: 'card pad' }, h('h2', { class: 'card-title' }, T.waiting),
            todo.length ? h('div', { class: 'todo-mini' }, todo.map((it) => anchor({ href: it.href }, { class: 'todo-row' },
              h('span', { class: 'todo-text' }, h('strong', {}, it.title), it.sub && h('small', {}, it.sub)),
              it.when && h('span', { class: `delta ${it.tone || 'neutral'}` }, it.when))))
              : h('p', { class: 'muted' }, T.nothing))),
        h('div', { class: 'glist-items' }, [
          c.href && nav.safe(c.href, 'link', { copied: true }) && { href: c.href, text: T.syllabus },
          c.predmet && portalLink('/auth/student/list.pl', { predmet: c.predmet, prubezne: 1 }) && { href: portalLink('/auth/student/list.pl', { predmet: c.predmet, prubezne: 1 }), text: T.lectures },
        ].filter(Boolean).map(linkRow)),
      ];
    },
    'course.files': (c) => {
      const f = folderOf(c.code);
      const href = f && nav.safe(f.href, 'link', { copied: true });
      return [
        href
          ? anchor({ href }, { class: 'card glist-item big' },
              h('span', { class: 'glist-text' }, h('strong', {}, T.folder), h('small', {}, f.name || c.name)),
              f.newCount > 0 && h('span', { class: 'delta bad' }, T.newN(f.newCount)), h('span', { class: 'glist-go' }, icon('arrow')))
          : emptyState(T.noFolder, { href: nav.composedUrl('courses.files'), text: T.allFolders }),
        h('p', { class: 'muted' }, T.moodle),
      ];
    },
    'course.submissions': (c) => {
      const now = new Date();
      const boxes = boxesOf(c.code).map((b) => ({ ...b, at: b.closes && new Date(b.closes) })).sort((a, b) => (a.at || 0) - (b.at || 0));
      return [
        boxes.length
          ? h('div', { class: 'card todo-mini pad' }, boxes.map((b) => h('div', { class: 'todo-row' },
              h('span', { class: 'todo-text' }, h('strong', {}, b.title || b.name), h('small', {}, [b.type, b.section].filter(Boolean).join(' · '))),
              b.at && h('span', { class: `delta ${b.submitted ? 'ok' : b.at < now ? 'neutral' : 'warn'}` }, b.at > now ? countdown(b.at, now) : b.at.toLocaleDateString(locale)))))
          : emptyState(T.noBoxes),
        h('div', { class: 'glist-items' }, [
          nav.target('courses.submissions') && { href: nav.target('courses.submissions'), text: T.allBoxes },
          portalLink('/auth/student/temata_prihlasovani.pl') && { href: portalLink('/auth/student/temata_prihlasovani.pl'), text: T.topics },
        ].filter(Boolean).map(linkRow)),
      ];
    },
    'course.points': (c) => {
      const st = statusOf(c);
      return [
        h('section', { class: 'card pad' }, h('h2', { class: 'card-title' }, T.result),
          h('p', { class: 'result-line' }, h('span', { class: `delta ${st.tone}` }, st.text), c.result && h('span', {}, c.result))),
        h('div', { class: 'glist-items' }, [
          c.predmet && portalLink('/auth/student/list.pl', { predmet: c.predmet, prubezne: 1 }) && { href: portalLink('/auth/student/list.pl', { predmet: c.predmet, prubezne: 1 }), text: T.points, gloss: T.pointsText },
          nav.target('exams.signup') && { href: nav.target('exams.signup'), text: T.examDates },
          nav.target('grades.results') && { href: nav.target('grades.results'), text: T.attempts },
          nav.target('exams.tests') && { href: nav.target('exams.tests'), text: T.tests },
        ].filter(Boolean).map(linkRow)),
      ];
    },
    'course.people': (c) => {
      const teachers = [...new Set(eventsOf(c.code).map((e) => clean(e.teacher)).filter(Boolean))];
      const list = h('div', { class: 'people-list' }, h('p', { class: 'muted' }, T.classmatesLoad));
      const all = c.predmet && portalLink('/auth/student/spoluzaci.pl', { predmet: c.predmet });
      if (all) loadClassmates(all, list);
      else list.replaceChildren(h('p', { class: 'muted' }, T.classmatesNone));
      return [
        teachers.length > 0 && h('section', { class: 'card pad' }, h('h2', { class: 'card-title' }, T.teachers),
          h('ul', { class: 'plain' }, teachers.map((t) => h('li', {}, t)))),
        h('section', { class: 'card pad' },
          h('div', { class: 'card-head' }, h('h2', {}, T.classmates), all && anchor({ href: all }, { class: 'more' }, T.classmatesAll)),
          list),
      ];
    },
    'course.syllabus': (c) => [h('div', { class: 'glist-items' }, [
      c.href && nav.safe(c.href, 'link', { copied: true }) && { href: c.href, text: T.syllabus },
      nav.target('courses.catalogue') && { href: nav.target('courses.catalogue'), text: T.passRates },
    ].filter(Boolean).map(linkRow))],
  };

  // Classmates of a course: read when the People tab opens (read: on-open), first page only, never stored.
  async function loadClassmates(url, box) {
    const fetchUrl = nav.safe(url, 'fetch', { copied: true });
    try {
      if (!fetchUrl) throw new Error('not allowed');
      const html = await (await fetch(fetchUrl, { credentials: 'include' })).text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const people = [...doc.querySelectorAll('#str1 a[href*="clovek.pl"]')].map((a) => ({
        text: clean(a.textContent), href: nav.safe(new URL(a.getAttribute('href'), fetchUrl).href, 'link', { copied: true }),
      })).filter((p) => p.text && p.href);
      box.replaceChildren(people.length
        ? h('ul', { class: 'plain cols' }, people.map((p) => h('li', {}, anchor(p, {}, p.text))))
        : h('p', { class: 'muted' }, T.classmatesNone));
    } catch {
      box.replaceChildren(h('p', { class: 'muted' }, T.classmatesNone));
    }
  }

  for (const node of TABS) {
    ipx.composed.register(node, (route) => {
      const code = route.arg;
      const c = courseOf(code) || (code ? { code, name: code } : null);
      return {
        css: 'course.css',
        title: c?.name || code || nav.label('courses'),
        subtitle: nav.label('courses'),
        build: () => h('div', { class: 'course-page' },
          c && header(c),
          courseTabs(code, node),
          !courseOf(code) && h('p', { class: 'notice' }, T.notMine),
          c && BUILD[node](c)),
      };
    });
  }

  // ---------- Courses › My courses and Materials ----------

  function card(c) {
    const f = folderOf(c.code);
    return courseCard({
      code: c.code, name: c.name, faculty: facultyFor(c.code), semester: c.semester, ects: c.ects ?? '',
      href: nav.composedUrl('course.overview', c.code),
      tags: [c.completion, statusOf(c).text, f?.newCount > 0 && T.newN(f.newCount)],
    });
  }

  ipx.composed.register('courses.mine', () => ({
    css: 'course.css',
    title: nav.label('courses'),
    build: () => {
      const list = courses();
      return h('div', { class: 'course-page' },
        list.length ? [h('p', { class: 'muted' }, T.mineHint), h('div', { class: 'course-list' }, list.map(card))]
          : emptyState(ipx.state.sync?.running && Date.now() - ipx.state.sync.updated < 2 * 60e3 ? '…' : T.coursesEmpty));
    },
  }));

  ipx.composed.register('courses.files', () => ({
    css: 'course.css',
    title: nav.label('courses.files'),
    build: () => {
      const mine = courses().map((c) => ({ c, f: folderOf(c.code) })).filter(({ f }) => f && nav.safe(f.href, 'link', { copied: true }));
      const at = (path) => nav.safe(new URL(path, document.baseURI).href, 'link') && new URL(path, document.baseURI).href;
      const views = [
        [T.newDocs, '/auth/dok_server/nove_dok.pl'], [T.myAll, '/auth/dok_server/moje_dok.pl'], [T.tree, '/auth/dok_server/'],
        [T.search, '/auth/dok_server/vyhledavani.pl'], [T.library, '/auth/eknihovna/'], [T.settings, '/auth/dok_server/nastaveni_stromu.pl'],
      ].map(([text, path]) => at(path) && { text, href: at(path) }).filter(Boolean);
      return h('div', { class: 'glist' },
        h('section', { class: 'glist-group' }, h('h2', { class: 'section-title' }, T.myFolders),
          mine.length
            ? h('div', { class: 'glist-items' }, mine.map(({ c, f }) => anchor({ href: f.href }, { class: 'card glist-item' },
                h('span', { class: 'glist-text' }, h('strong', {}, `${c.code} ${c.name}`), h('small', {}, T.folder)),
                f.newCount > 0 && h('span', { class: 'delta bad' }, T.newN(f.newCount)), h('span', { class: 'glist-go' }, icon('arrow')))))
            : emptyState(T.noFolder)),
        h('section', { class: 'glist-group' }, h('h2', { class: 'section-title' }, T.insisViews),
          h('div', { class: 'glist-items' }, views.map(linkRow))),
        h('p', { class: 'muted' }, T.moodle));
    },
  }));

})();
