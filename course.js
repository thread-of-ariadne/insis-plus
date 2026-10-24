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
  const { h, icon, anchor, courseCard, emptyState, nextClasses, facultyFor, facultyColors, countdown, deadlineTone, wallTime, initials } = ipx.ui;
  const nav = ipx.nav;
  const locale = lang === 'cs' ? 'cs-CZ' : 'en-GB';

  const T = {
    cs: { inProgress: 'Probíhá', passed: 'Splněno', failed: 'Nesplněno',
      next: 'Příští hodiny', noClasses: 'V rozvrhu nejsou žádné další hodiny tohoto předmětu.', waiting: 'Co tě čeká', nothing: 'Nic nečeká.',
      folder: 'Složka předmětu na dokumentovém serveru', newN: (n) => `${n} ${n === 1 ? 'nový' : n >= 2 && n <= 4 ? 'nové' : 'nových'}`, openFolder: 'Otevřít v InSIS',
      filesN: (n) => `${n} ${n === 1 ? 'soubor' : n >= 2 && n <= 4 ? 'soubory' : 'souborů'}`, folderEmpty: 'Složka je zatím prázdná.',
      folderNote: 'Složky se otevírají v InSIS až na vaše kliknutí: otevření může označit soubory jako přečtené.', noFolder: 'Složku předmětu se nepodařilo spárovat podle kódu.',
      allFolders: 'Všechny složky', moodle: 'Někteří vyučující dávají materiály do Moodlu.', noBoxes: 'Pro tento předmět nejsou žádné odevzdávárny.',
      topics: 'Přihlašování na témata', result: 'Výsledek', points: 'Průběžné body',
      pointsText: 'Body z průběžného hodnocení ukazuje InSIS v listu předmětu.', examDates: 'Termíny zkoušek', tests: 'Online testy a kvízy',
      classmates: 'Spolužáci', classmatesLoad: 'Načítám seznam…', classmatesNone: 'Seznam spolužáků se nepodařilo načíst.',
      classmatesAll: 'Celý seznam v InSIS', notMine: 'Tento předmět není mezi vašimi zapsanými předměty.',
      lectures: 'List předmětu v InSIS', syllabusLoad: 'Načítám sylabus…', syllabusNone: 'Sylabus se nepodařilo načíst.', syllabusFull: 'Celý sylabus v InSIS',
      teachersTitle: 'Vyučující', noTeachers: 'Vyučující se nepodařilo zjistit.', nextShort: 'příště', dueShort: 'odevzdat',
      coursesEmpty: 'Zapsané předměty se zatím nenačetly.', mineHint: (sem) => `Předměty ${sem ? `období ${sem}` : 'tohoto období'} podle e-indexu.`, finished: (n) => `Dokončené (${n})`,
      byCourse: 'Podle předmětů', newDocs: 'Nové dokumenty', tree: 'Strom dokumentů', search: 'Hledat', views: 'Pohledy na materiály',
      library: 'E-knihovna', libraryText: 'Veřejné studijní materiály, které zveřejňují katedry.',
      untilAt: (d) => `do ${d}`, closedOn: (d) => `uzavřeno ${d}`, confirmed: 'potvrzeno', submitted: 'odevzdáno', nothingIn: 'nic neodevzdáno', notOpen: (d) => `otevře se ${d}`,
      noResult: 'Výsledek zatím není zapsaný.', entered: (d) => `zapsáno ${d}`, attemptN: (n) => `${n}. pokus`, allAttempts: 'Všechny pokusy ve Výsledcích',
      examText: 'Termíny zkoušek tohoto předmětu a přihlašování na ně jsou v Termínech zkoušek.', examLink: 'Moje termíny',
      testsText: 'Online testy a kvízy předmětu se spouštějí v seznamu testů v InSIS.', testsLink: 'Seznam testů',
      sheetLink: 'List předmětu', statusLabel: 'Stav předmětu' },
    en: { inProgress: 'In progress', passed: 'Passed', failed: 'Not passed',
      next: 'Next classes', noClasses: 'No more classes of this course in the timetable.', waiting: 'What is coming', nothing: 'Nothing waiting.',
      folder: 'Course folder on the document server', newN: (n) => `${n} new`, openFolder: 'Open in InSIS',
      filesN: (n) => `${n} ${n === 1 ? 'file' : 'files'}`, folderEmpty: 'The folder is empty so far.',
      folderNote: 'Folders open in InSIS only when you click: opening one may mark its files as read.', noFolder: 'The course folder could not be matched by its code.',
      allFolders: 'All folders', moodle: 'Some teachers put materials in Moodle.', noBoxes: 'There are no submission boxes for this course.',
      topics: 'Topic sign-up', result: 'Result', points: 'Points so far',
      pointsText: 'InSIS shows the points of continuous assessment in the course sheet.', examDates: 'Exam dates', tests: 'Online tests and quizzes',
      classmates: 'Classmates', classmatesLoad: 'Loading the list…', classmatesNone: 'The list of classmates could not be loaded.',
      classmatesAll: 'Full list in InSIS', notMine: 'This course is not among your enrolled courses.',
      lectures: 'Course sheet in InSIS', syllabusLoad: 'Loading the syllabus…', syllabusNone: 'The syllabus could not be loaded.', syllabusFull: 'Full syllabus in InSIS',
      teachersTitle: 'Teachers', noTeachers: 'The teachers could not be found.', nextShort: 'next', dueShort: 'due',
      coursesEmpty: 'Your enrolled courses have not loaded yet.', mineHint: (sem) => `Courses of ${sem || 'this period'} from your study record.`, finished: (n) => `Finished (${n})`,
      byCourse: 'By course', newDocs: 'New documents', tree: 'Document tree', search: 'Search', views: 'Views of your materials',
      library: 'e-Library', libraryText: 'Public study materials published by departments.',
      untilAt: (d) => `until ${d}`, closedOn: (d) => `closed ${d}`, confirmed: 'confirmed', submitted: 'submitted', nothingIn: 'nothing submitted', notOpen: (d) => `opens ${d}`,
      noResult: 'No result has been entered yet.', entered: (d) => `entered ${d}`, attemptN: (n) => `attempt ${n}`, allAttempts: 'All attempts in Results',
      examText: 'This course’s exam dates, and signing up for them, are in Exam dates.', examLink: 'My dates',
      testsText: 'Online tests and quizzes of this course are started from InSIS’s list of tests.', testsLink: 'List of tests',
      sheetLink: 'Course sheet', statusLabel: 'Course status' },
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
  // This period's courses: the study record may list several periods; keep the one it is set to (else the latest).
  function current() {
    const list = courses();
    const terms = [...new Set(list.map((c) => c.semester).filter(Boolean))];
    if (terms.length < 2) return list;
    const period = ipx.state.studyRecord?.period;
    const term = terms.includes(period) ? period : terms.at(-1);
    return list.filter((c) => c.semester === term);
  }
  const courseOf = (code) => courses().find((c) => c.code === code) || null;
  const eventsOf = (code) => (ipx.state.timetable?.events || []).filter((e) => e.code === code);
  const folderOf = (code) => (ipx.state.docserver?.courses || []).find((c) => c.code === code) || null;
  const boxesOf = (code) => (ipx.state.submissions?.boxes || []).filter((b) => b.code === code);

  const portalLink = ipx.kit.portalLink;

  function statusOf(c) {
    if (c.passed === true) return { tone: 'ok', text: T.passed };
    if (c.passed === false) return { tone: 'bad', text: T.failed };
    return { tone: 'neutral', text: T.inProgress };
  }


  // ---------- the syllabus of a course (read when the course page opens) ----------

  const syllabi = new Map();
  // The syllabus page is public and read-only (read: on-open). Its content is shown inside the course page, so every
  // link in it goes through the URL rule; anything else becomes plain text.
  function syllabusOf(c) {
    if (!c.href) return Promise.resolve(null);
    if (!syllabi.has(c.code)) {
      const url = nav.safe(c.href, 'fetch', { copied: true });
      // Test pages map InSIS addresses to local snapshots (test/make_fixture.py); the extension never does.
      const from = url && (globalThis.__ipxFixtureFor?.(url) || url);
      syllabi.set(c.code, !url ? Promise.resolve(null) : fetch(from, { credentials: 'include' }).then((r) => r.text()).then((html) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        doc.head.prepend(Object.assign(doc.createElement('base'), { href: url }));
        return ipx.syllabus?.parse(doc) || null;
      }).catch(() => null));
    }
    return syllabi.get(c.code);
  }
  function sanitizeLinks(root) {
    for (const a of root.querySelectorAll('a[href]')) {
      const href = a.getAttribute('href');
      if (/^mailto:/i.test(href)) continue;
      const ok = nav.safe(a.href, 'link', { copied: true });
      if (ok) {
        a.setAttribute('href', ok);
        continue;
      }
      // Not allowed: keep what the link showed, without the link.
      const span = h('span', { class: a.className || null });
      span.append(...a.childNodes);
      a.replaceWith(span);
    }
    return root;
  }

  // ---------- the course page ----------

  // One folder of the document server tree as a row (indented by depth), then its subfolders. The tree comes from the
  // tree page (read in the background); the folders themselves open in InSIS on the student's click, because opening
  // one may mark its files as read.
  function folderRow(n, depth) {
    const to = nav.safe(n.href, 'link', { copied: true });
    const inner = [
      h('span', { class: 'ds-ico' }, icon('folder')),
      h('span', { class: 'glist-text' }, h('strong', {}, n.name), h('small', {}, T.filesN(n.allFiles))),
      n.allNew > 0 && h('span', { class: 'delta bad' }, T.newN(n.allNew)),
      to && h('span', { class: 'glist-go' }, icon('arrow')),
    ];
    const props = { class: 'folder-row' + (n.allFiles ? '' : ' is-empty'), style: `--depth: ${depth}` };
    return [to ? anchor({ href: to }, props, ...inner) : h('span', props, ...inner), ...(n.children || []).flatMap((k) => folderRow(k, depth + 1))];
  }

  const TABS = nav.tabs.course;

  function courseTabs(code, active) {
    return ipx.ui.viewTabs(TABS.map((node) => ({ href: nav.composedUrl(node, code), text: nav.label(node), on: node === active })), code);
  }

  function header(c) {
    const fac = facultyFor(c.code);
    const st = statusOf(c);
    return h('div', { class: 'course-head' },
      h('span', { class: 'course-code', style: `color: ${facultyColors(fac)[1]}` }, [c.code, fac].filter(Boolean).join(' · ')),
      h('span', { class: `delta ${st.tone}` }, st.text));
  }

  // The facts of the course card, under the header on every tab (teardowns/courses.md §2.1 "Summary"): the next
  // class (→ My week), the nearest deadline still to hand in (→ the box's InSIS page), new files (→ Materials) and
  // InSIS's result once there is one. A fact without data is left out; no facts, no line.
  const stampOf = (d) => {
    const w = wallTime(d);
    return `${w.day.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'numeric' })} ${w.time}`;
  };
  function nextDeadline(code, now) {
    return boxesOf(code).map((b) => ({ ...b, at: b.closes && new Date(b.closes), from: b.opens && new Date(b.opens) }))
      .filter((b) => b.at && b.at > now && (!b.from || b.from <= now) && b.submitted !== true && b.section !== 'done')
      .sort((a, b) => a.at - b.at)[0] || null;
  }
  function statusLine(c) {
    const now = new Date();
    const done = c.passed === true;
    const n = !done && eventsOf(c.code).filter((e) => e.date && new Date(`${e.date}T${e.end || '23:59'}`) > now)
      .sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`))[0];
    const due = !done && nextDeadline(c.code, now);
    const f = folderOf(c.code);
    const fact = (href, ic, text, tone) => {
      const body = [icon(ic), h('span', {}, text)];
      const cls = 'cs-fact' + (tone ? ` tone-${tone}` : '');
      return href ? anchor({ href }, { class: cls }, ...body) : h('span', { class: cls }, ...body);
    };
    const facts = [
      n && fact(nav.target('schedule.week'), 'clock',
        [`${T.nextShort} ${new Date(`${n.date}T${n.start}`).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'numeric' })} ${n.start}`, n.room].filter(Boolean).join(' · ')),
      due && fact(nav.safe(due.href, 'link', { copied: true }) || nav.composedUrl('course.submissions', c.code), 'file',
        `${T.dueShort} ${countdown(due.at, now)} · ${due.title || due.name}`, deadlineTone(due.at, false, now)),
      f?.newCount > 0 && fact(nav.composedUrl('course.files', c.code), 'folder', T.newN(f.newCount), 'bad'),
      c.result && fact(null, 'award', `${T.result}: ${c.result}`, statusOf(c).tone),
    ].filter(Boolean);
    return facts.length ? h('p', { class: 'course-status', 'aria-label': T.statusLabel }, facts) : null;
  }

  const BUILD = {
    'course.overview': (c) => {
      const todo = ipx.todo ? ipx.todo.items({ course: c.code }) : [];
      const upcoming = nextClasses(eventsOf(c.code), nav.target('schedule.week'), 3);
      const own = [
        h('section', { class: 'card pad' }, h('h2', { class: 'card-title' }, T.next), upcoming || h('p', { class: 'muted' }, T.noClasses)),
        h('section', { class: 'card pad' }, h('h2', { class: 'card-title' }, T.waiting),
          todo.length ? h('div', { class: 'todo-mini' }, todo.map((it) => anchor({ href: it.href }, { class: 'todo-row' },
            h('span', { class: 'todo-text' }, h('strong', {}, it.title), it.sub && h('small', {}, it.sub)),
            it.when && h('span', { class: `delta ${it.tone || 'neutral'}` }, it.when))))
            : h('p', { class: 'muted' }, T.nothing)),
      ];
      const box = h('div', { class: 'course-syllabus' }, h('p', { class: 'muted' }, T.syllabusLoad));
      syllabusOf(c).then((d) => {
        if (!d) {
          box.replaceChildren(h('div', { class: 'cols' }, h('div', { class: 'stack' }, h('p', { class: 'muted' }, T.syllabusNone)), h('div', { class: 'stack rail' }, own)));
          return;
        }
        // Teachers have one place, the People tab: the syllabus's lecturers card is hidden here by course.css
        // (.course-syllabus … :has(> .people)). Dropping the fact instead would make syllabus.js print a stray "0".
        // Teachers live on the People tab only: the syllabus is drawn here without its lecturers block.
        box.replaceChildren(sanitizeLinks(ipx.syllabus.build({ ...d, facts: d.facts.filter((f) => f.key !== 'lecturers') }, { embedded: true, rail: own })));
      });
      const full = c.href && nav.safe(c.href, 'link', { copied: true });
      const sheet = c.predmet && portalLink('/auth/student/list.pl', { predmet: c.predmet, prubezne: 1 });
      return [
        box,
        h('p', { class: 'course-links' },
          full && anchor({ href: full }, {}, T.syllabusFull),
          sheet && anchor({ href: sheet }, {}, T.lectures)),
      ];
    },
    'course.files': (c) => {
      const f = folderOf(c.code);
      const href = f && nav.safe(f.href, 'link', { copied: true });
      if (!href) return [emptyState(T.noFolder, { href: nav.composedUrl('courses.files'), text: T.allFolders }), h('p', { class: 'muted' }, T.moodle)];
      const tree = f.tree || [];
      const row = folderRow;
      return [
        h('section', { class: 'card pad' },
          h('div', { class: 'card-head' },
            h('h2', {}, T.folder),
            f.newCount > 0 && h('span', { class: 'delta bad' }, T.newN(f.newCount)),
            anchor({ href }, { class: 'more' }, T.openFolder)),
          h('div', { class: 'folder-list' },
            f.files > 0 && row({ name: f.name || c.name, href: f.href, allFiles: f.files, allNew: f.fresh || 0 }, 0),
            tree.flatMap((n) => row(n, 0)),
            !tree.length && !(f.files > 0) && (f.tree ? h('p', { class: 'muted' }, T.folderEmpty) : anchor({ href }, { class: 'folder-row' },
              h('span', { class: 'ds-ico' }, icon('folder')), h('span', { class: 'glist-text' }, h('strong', {}, f.name || c.name)),
              h('span', { class: 'glist-go' }, icon('arrow'))))),
          h('p', { class: 'muted small' }, T.folderNote)),
        h('p', { class: 'muted' }, T.moodle),
      ];
    },
    'course.submissions': (c) => {
      // This course's boxes, soonest deadline first; each row opens the box's own InSIS page (stored by
      // pages/submissions.js: Insert files / Display files, else the list itself), where InSIS takes the upload.
      const now = new Date();
      const boxes = boxesOf(c.code).map((b) => ({ ...b, at: b.closes && new Date(b.closes), from: b.opens && new Date(b.opens) }))
        .sort((a, b) => (a.at || Infinity) - (b.at || Infinity));
      const stateOf = (b) => {
        if (b.section === 'done') return { text: T.confirmed, tone: 'ok' };
        if (b.from && b.from > now) return { text: T.notOpen(stampOf(b.from)), tone: 'neutral' };
        if (b.at && b.at > now) return { text: countdown(b.at, now), tone: deadlineTone(b.at, b.submitted === true, now) };
        return null;
      };
      const all = nav.target('courses.submissions');
      const topics = portalLink('/auth/student/temata_prihlasovani.pl');
      return [
        boxes.length
          ? h('div', { class: 'card todo-mini pad' }, boxes.map((b) => {
              // A box without a page of its own (closed, nothing handed in) was stored with the list's address.
              const href = nav.safe(b.href, 'link', { copied: true }) || all;
              const st = stateOf(b);
              const when = b.at && (b.at > now ? T.untilAt(stampOf(b.at)) : T.closedOn(stampOf(b.at)));
              const files = b.submitted === true ? [T.submitted, b.files ? T.filesN(b.files) : null].filter(Boolean).join(' · ')
                : b.submitted === false ? T.nothingIn : null;
              const body = [
                h('span', { class: 'todo-text' }, h('strong', {}, b.title || b.name), h('small', {}, [when, files].filter(Boolean).join(' · '))),
                st && h('span', { class: `delta ${st.tone}` }, st.text),
                href && h('span', { class: 'glist-go' }, icon('arrow')),
              ];
              return href ? anchor({ href }, { class: 'todo-row box-row' }, ...body) : h('div', { class: 'todo-row box-row' }, ...body);
            }))
          : emptyState(T.noBoxes),
        (all || topics) && h('p', { class: 'course-links' },
          all && anchor({ href: all }, {}, nav.sectionLabel('courses.submissions')),
          topics && anchor({ href: topics }, {}, T.topics)),
      ];
    },
    'course.points': (c) => {
      // Decision 6 (03-pages.md §7): InSIS's result with the attempt (→ Results), then the way to this course's
      // exam dates (→ Exam dates) and online tests, each a fact with its one link; no list of bare links, no past
      // dates. Exam dates and tests are not read by InSIS+ yet, so their cards say where they are.
      const st = statusOf(c);
      const results = nav.target('grades.results');
      const exams = nav.target('exams.mine');
      const tests = nav.target('exams.tests');
      const sheet = c.predmet && portalLink('/auth/student/list.pl', { predmet: c.predmet, prubezne: 1 });
      const head = (title, link) => h('div', { class: 'card-head' }, h('h2', {}, title), link && anchor(link, { class: 'more' }, link.text));
      return [
        h('section', { class: 'card pad' },
          head(T.result, results && { href: results, text: T.allAttempts }),
          h('p', { class: 'result-line' }, h('span', { class: `delta ${st.tone}` }, st.text), h('span', {}, c.result || T.noResult)),
          (c.entered || c.attempt) && h('p', { class: 'muted result-meta' },
            [c.attempt && T.attemptN(c.attempt), c.entered && T.entered(c.entered)].filter(Boolean).join(' · '))),
        h('div', { class: 'course-grid' },
          h('section', { class: 'card pad' }, head(T.points, sheet && { href: sheet, text: T.sheetLink }), h('p', { class: 'muted' }, T.pointsText)),
          c.passed !== true && h('section', { class: 'card pad' }, head(T.examDates, exams && { href: exams, text: T.examLink }), h('p', { class: 'muted' }, T.examText)),
          c.passed !== true && h('section', { class: 'card pad' }, head(T.tests, tests && { href: tests, text: T.testsLink }), h('p', { class: 'muted' }, T.testsText))),
      ];
    },
    'course.people': (c) => {
      const teachers = h('div', { class: 'people' }, h('p', { class: 'muted' }, T.syllabusLoad));
      syllabusOf(c).then((d) => {
        const fact = d?.facts.find((f) => f.key === 'lecturers');
        const people = fact ? [...fact.el.querySelectorAll('a[href]')].map((a) => ({
          href: nav.safe(a.href, 'link', { copied: true }), text: clean(a.textContent),
          role: /\(([^)]+)\)/.exec(a.nextSibling?.nodeValue || '')?.[1] || '',
        })).filter((p) => p.text) : [];
        const fromTimetable = [...new Set(eventsOf(c.code).map((e) => clean(e.teacher)).filter(Boolean))].map((text) => ({ text }));
        const list = people.length ? people : fromTimetable;
        teachers.replaceChildren(...(list.length ? list.map((p) => (p.href ? anchor : (l, props, ...k) => h('span', props, ...k))(
          { href: p.href }, { class: 'person' }, h('span', { class: 'avatar sm' }, initials(p.text)),
          h('span', { class: 'person-text' }, h('strong', {}, p.text), p.role && h('small', {}, p.role))))
          : [h('p', { class: 'muted' }, T.noTeachers)]));
      });
      const list = h('div', { class: 'people-list' }, h('p', { class: 'muted' }, T.classmatesLoad));
      const all = c.predmet && portalLink('/auth/student/spoluzaci.pl', { predmet: c.predmet });
      if (all) loadClassmates(all, list);
      else list.replaceChildren(h('p', { class: 'muted' }, T.classmatesNone));
      return [
        h('section', { class: 'card pad' }, h('h2', { class: 'card-title' }, T.teachersTitle), teachers),
        h('section', { class: 'card pad' },
          h('div', { class: 'card-head' }, h('h2', {}, T.classmates), all && anchor({ href: all }, { class: 'more' }, T.classmatesAll)),
          list),
      ];
    },
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
        css: ['syllabus.css', 'course.css'],
        title: c?.name || code || nav.label('courses'),
        subtitle: nav.label('courses'),
        build: () => h('div', { class: 'course-page' },
          c && header(c),
          c && courseOf(code) && statusLine(c),
          courseTabs(code, node),
          !courseOf(code) && h('p', { class: 'notice' }, T.notMine),
          c && BUILD[node](c)),
      };
    });
  }

  // ---------- Courses › My courses and Materials ----------

  // The one course card used everywhere (Home, My courses, Materials): same look, same facts — next class, nearest
  // deadline, new files, and the result once there is one.
  function card(c, tab = 'course.overview') {
    const now = new Date();
    const f = folderOf(c.code);
    const done = c.passed === true;
    const n = !done && eventsOf(c.code).filter((e) => e.date && new Date(`${e.date}T${e.end || '23:59'}`) > now)
      .sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`))[0];
    const due = !done && ipx.todo?.items({ course: c.code }, now).find((it) => it.due);
    return courseCard({
      code: c.code, name: c.name, faculty: facultyFor(c.code), ects: c.ects ?? '',
      href: nav.composedUrl(tab, c.code), done,
      // A finished or failed course says so first; an ongoing one shows what is next.
      status: c.passed != null && { ...statusOf(c), text: [statusOf(c).text, c.result].filter(Boolean).join(' · ') },
      tags: [
        n && `${T.nextShort} ${new Date(`${n.date}T${n.start}`).toLocaleDateString(locale, { weekday: 'short' })} ${n.start}`,
        due && `${T.dueShort} ${due.when}`,
        f?.newCount > 0 && T.newN(f.newCount),
      ],
    });
  }

  // The courses of a list as cards: ongoing first, then the finished ones under their own heading.
  function courseCards(list, tab) {
    const done = list.filter((c) => c.passed === true);
    const open = list.filter((c) => c.passed !== true);
    return [
      open.length > 0 && h('div', { class: 'course-list' }, open.map((c) => card(c, tab))),
      done.length > 0 && h('div', { class: 'course-group-done' },
        h('h3', { class: 'course-group-title' }, T.finished(done.length)),
        h('div', { class: 'course-list' }, done.map((c) => card(c, tab)))),
    ];
  }
  ipx.courseCards = (tab) => { const list = current(); return list.length ? courseCards(list, tab) : null; };
  ipx.courseCard = card;

  ipx.composed.register('courses.mine', () => ({
    css: 'course.css',
    title: nav.label('courses'),
    build: () => {
      const list = current();
      return h('div', { class: 'course-page' },
        list.length ? [h('p', { class: 'muted' }, T.mineHint(list[0].semester)), courseCards(list)]
          : emptyState(ipx.state.sync?.running && Date.now() - ipx.state.sync.updated < 2 * 60e3 ? '…' : T.coursesEmpty));
    },
  }));

  ipx.composed.register('courses.files', () => ({
    css: 'course.css',
    title: nav.sectionLabel('courses.files'),
    subtitle: nav.label('courses'),
    build: () => {
      const list = current();
      const at = (path) => nav.safe(new URL(path, document.baseURI).href, 'link');
      // One row of view tabs for the whole section, the same as on the document server's pages (pages/docserver.js):
      // this page (By course), then InSIS's views of the document server. The e-library is another tool: a link card.
      const newCount = ipx.state.docserver?.newCount;
      const views = [
        { href: nav.composedUrl('courses.files'), text: T.byCourse, on: true },
        ...[[T.tree, '/auth/dok_server/'], [T.newDocs, '/auth/dok_server/nove_dok.pl', newCount ?? null], [T.search, '/auth/dok_server/vyhledavani.pl']]
          .map(([text, path, count]) => at(path) && { text, href: at(path), count }).filter(Boolean),
      ];
      const library = at('/auth/eknihovna/');
      const section = (c) => {
        const f = folderOf(c.code);
        const fac = facultyFor(c.code);
        const own = f && nav.safe(f.href, 'link', { copied: true });
        const top = (f?.tree || []).map((n) => ({ ...n, children: [] }));
        return h('section', { class: 'card pad files-course' },
          h('div', { class: 'card-head' },
            h('span', { class: 'course-code', style: `color: ${facultyColors(fac)[1]}` }, c.code),
            h('h2', {}, anchor({ href: nav.composedUrl('course.files', c.code) }, {}, c.name)),
            f?.newCount > 0 && h('span', { class: 'delta bad' }, T.newN(f.newCount)),
            own && anchor({ href: own }, { class: 'more' }, T.openFolder)),
          !f ? h('p', { class: 'muted' }, T.noFolder)
            : h('div', { class: 'folder-list' },
                f.files > 0 && folderRow({ name: f.name || c.name, href: f.href, allFiles: f.files, allNew: f.fresh || 0 }, 0),
                top.flatMap((n) => folderRow(n, 0)),
                !top.length && !(f.files > 0) && h('p', { class: 'muted' }, T.folderEmpty)));
      };
      return h('div', { class: 'course-page' },
        ipx.ui.viewTabs(views, T.views),
        list.length ? list.map(section) : emptyState(T.coursesEmpty),
        list.length > 0 && h('p', { class: 'muted small' }, T.folderNote),
        // Decision 3 (03-pages.md §7): the e-library lives here as a link card, never as a tab.
        library && anchor({ href: library }, { class: 'card glist-item files-library' },
          h('span', { class: 'ds-ico' }, icon('book')),
          h('span', { class: 'glist-text' }, h('strong', {}, T.library), h('small', {}, T.libraryText)),
          h('span', { class: 'glist-go' }, icon('arrow'))));
    },
  }));
})();
