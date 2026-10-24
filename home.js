// InSIS+ — Home (Přehled), drawn over the InSIS main page (docs/ia/02-redesign.md §3).
// The main page's own menu, name, counters and notices are read here when the student opens it (never in the
// background) and stored for the session. If the page doesn't look like the main page, nothing is changed.
// InSIS+ pages (#ipx:…) also live on this address and are handed to composed.js.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.ui) return;
  const { clean, norm, lang } = ipx;
  const { h, anchor, takeover, onPinsChange, sectionHead, emptyState, notice, courseCard, weekStrip,
    nextClasses, hoursChart, classDays, facultyColors, facultyFor } = ipx.ui;
  const nav = ipx.nav;

  const T = {
    cs: { morning: 'Dobré ráno', day: 'Dobrý den', evening: 'Dobrý večer', welcome: 'Vítejte zpět',
      loading: 'Načítám data z InSIS…', passed: 'splněno', failed: 'nesplněno', fullSchedule: 'Celý rozvrh →',
      scheduleEmpty: 'Váš rozvrh se zatím nenačetl.', scheduleDone: 'V tomto rozvrhu už žádné další hodiny nejsou.',
      allFiles: 'Všechny →', newN: (n) => `${n} nové`, noNewFiles: 'Žádné nové materiály.', filesNotRead: 'Materiály se zatím nenačetly.',
      allCourses: 'Všechny →', coursesEmpty: 'Zapsané předměty se zatím nenačetly.', nothingTodo: 'Nic nečeká. ✓',
      checked: 'Zkontrolováno:', notChecked: 'zatím nekontrolováno',
      sharedQ: 'Je to sdílený počítač?', sharedText: 'Na sdíleném počítači InSIS+ mezi návštěvami nic neukládá (připnuté stránky ani nastavení). Data z InSIS se vždy mažou po odhlášení a po 10 minutách nečinnosti.',
      sharedNo: 'Ne, můj počítač', sharedYes: 'Ano, nic neukládat' },
    en: { morning: 'Good morning', day: 'Good afternoon', evening: 'Good evening', welcome: 'Welcome back',
      loading: 'Loading your data from InSIS…', passed: 'passed', failed: 'not passed', fullSchedule: 'Full timetable →',
      scheduleEmpty: 'Your timetable has not loaded yet.', scheduleDone: 'No more classes in this timetable.',
      allFiles: 'All →', newN: (n) => `${n} new`, noNewFiles: 'No new materials.', filesNotRead: 'Materials have not loaded yet.',
      allCourses: 'All →', coursesEmpty: 'Your enrolled courses have not loaded yet.', nothingTodo: 'Nothing to do. ✓',
      checked: 'Checked:', notChecked: 'not checked yet',
      sharedQ: 'Is this a shared computer?', sharedText: 'On a shared computer InSIS+ keeps nothing between visits (no pins, no settings). Data from InSIS is always wiped on logout and after 10 minutes without activity.',
      sharedNo: 'No, my computer', sharedYes: 'Yes, keep nothing' },
  }[lang];
  const locale = lang === 'cs' ? 'cs-CZ' : 'en-GB';

  const QUICK = ipx.ui.MAIN;

  const HEADER = [
    { id: 'docs', re: /^(\d+)\s+(documents?|dokument)/ },
    { id: 'tasks', re: /^(\d+)\s+(tasks?|ukol)/ },
    { id: 'office', re: /^office\s?365$/ },
    { id: 'lang', re: /^(cesky|english|slovensky)$/ },
    { id: 'logout', re: /odhlas|log ?out/ },
  ];

  const SKIP_GROUP = /game room|herna|^hry\b|logged in|prihlasen/;

  // ---------- reading the original page ----------

  // Non-link text chunks inside an element: a service box has exactly one (its title),
  // the grid around the boxes has many. That's how box boundaries are found without knowing the markup.
  const chunkCache = new Map();
  function titleChunks(el) {
    if (chunkCache.has(el)) return chunkCache.get(el);
    const out = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) =>
        n.parentElement.closest('a, script, style, noscript, select, button')
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT,
    });
    while (out.length < 2 && walker.nextNode()) {
      const t = clean(walker.currentNode.nodeValue);
      if (t.length >= 3 && /\p{L}{2}/u.test(t)) out.push(t);
    }
    chunkCache.set(el, out);
    return out;
  }

  function harvest() {
    const header = { lang: [] };
    const groups = new Map();

    for (const a of document.querySelectorAll('a[href]')) {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || /^(javascript|mailto|tel):/i.test(href)) continue;
      const ownText = clean(a.textContent);
      const text = ownText || clean(a.title) || clean(a.querySelector('img')?.alt);
      if (!text) continue;
      const link = { href: a.href, text, hasText: !!ownText, target: a.target };
      if (/_menuexpandall|_menucollapse/.test(href)) continue;

      // The real page writes "10" and "documents" as two links to the same place: recognise them by address.
      const counter = /dok_server\/nove_dok/.test(href) ? 'docs' : /\/todo\/(\?|$)/.test(href) && !/_m=/.test(href) ? 'tasks' : null;
      if (counter) {
        const entry = (header[counter] ||= { ...link, count: null });
        if (/^\d+$/.test(text)) entry.count = Number(text);
        else entry.text = text;
        continue;
      }

      const hd = HEADER.find((x) => x.re.test(norm(text)) || (x.id === 'logout' && x.re.test(href)));
      if (hd) {
        const m = norm(text).match(hd.re);
        if (hd.id === 'lang') header.lang.push(link);
        else header[hd.id] ||= { ...link, count: /^\d+$/.test(m?.[1] || '') ? Number(m[1]) : null };
        continue;
      }

      let box = a.parentElement;
      while (box.parentElement && box.parentElement !== document.body && titleChunks(box.parentElement).length <= 1) {
        box = box.parentElement;
      }
      if (!groups.has(box)) groups.set(box, { title: titleChunks(box)[0] || '', links: [] });
      const g = groups.get(box);
      if (!g.links.some((l) => l.href === link.href)) g.links.push(link);
    }

    const all = [...groups.values()];
    const services = all
      .filter((g) => g.title && !SKIP_GROUP.test(norm(g.title)))
      .map((g) => ({ ...g, links: g.links.filter((l) => l.hasText) }))
      .filter((g) => g.links.length);
    const notices = all
      .filter((g) => !g.title && g.links.length <= 3)
      .flatMap((g) => g.links)
      .filter((l) => l.hasText && l.text.length >= 8);
    const flat = services.flatMap((g) => g.links);
    const quick = QUICK.map((q) => {
      const link = flat.find((l) => q.re.test(norm(l.text)));
      return link && { ...q, link };
    }).filter(Boolean);

    return { header, services, notices, quick };
  }

  function userName() {
    const m = document.body.innerText.match(/(?:Logged in|Přihlášen[a-zá]*)\s*:\s*([^\n\t]+)/i);
    if (!m) return '';
    const words = [];
    for (const w of m[1].trim().split(/\s+/)) {
      if (words.length === 3 || /\d/.test(w) || !/^\p{Lu}/u.test(w)) break;
      words.push(w);
    }
    return words.join(' ');
  }

  // ---------- dashboard ----------

  // Winter semester runs Sep–Jan, summer Feb–Aug; InSIS writes them ZS/WS and LS/SS plus "2026/2027".
  function isThisTerm(semester) {
    const now = new Date();
    const m = now.getMonth();
    const y = now.getFullYear();
    const winter = m >= 8 || m === 0;
    const start = winter ? (m === 0 ? y - 1 : y) : y - 1;
    const years = new RegExp(`${start}\\s*/\\s*(${start + 1}|${String(start + 1).slice(2)})`);
    return (winter ? /\b(ZS|WS)\b/ : /\b(LS|SS)\b/).test(semester) && years.test(semester);
  }

  // This semester's courses: from the study record (stored by pages/study-record.js, loaded in the background),
  // else the courses in the personal timetable. Syllabus pages the student opened add the faculty and aims.
  function enrolled(viewed) {
    const byCode = new Map();
    for (const c of viewed) if (c.code && !byCode.has(c.code)) byCode.set(c.code, c);
    const card = (c) => {
      const v = byCode.get(c.code) || {};
      return { ...c, href: c.href || v.href, faculty: v.faculty || facultyFor(c.code), aims: v.aims };
    };
    const rec = ipx.state.studyRecord;
    if (rec?.courses?.length) {
      const terms = [...new Set(rec.courses.map((c) => c.semester).filter(Boolean))];
      const term = terms.find(isThisTerm) || (terms.includes(rec.period) ? rec.period : terms.at(-1));
      const list = rec.courses.filter((c) => !term || c.semester === term).map((c) => card({
        code: c.code, name: c.name, href: c.href, semester: c.semester, ects: c.ects ?? '',
        tags: [c.completion, c.passed === true ? T.passed : c.passed === false ? T.failed : null] }));
      if (list.length) return { list };
    }
    const tt = ipx.state.timetable;
    const seen = new Map();
    for (const e of tt?.events || []) {
      if (!e.code) continue;
      const c = seen.get(e.code) || { code: e.code, name: e.name, types: new Set() };
      if (e.type) c.types.add(e.type);
      seen.set(e.code, c);
    }
    const href = ipx.state.portal?.links?.timetable?.href || tt?.source;
    return { fromTimetable: true, list: [...seen.values()].map((c) => card({ code: c.code, name: c.name, href, tags: [...c.types] })) };
  }

  // Home (docs/ia/02-redesign.md §3): To do, My courses and InSIS notices; the rail with the week, the timetable,
  // new materials by course and teaching hours.
  function buildPage({ notices }, state) {
    const now = new Date();
    // A sync interrupted by a reload leaves running: true behind; it counts only for the 2-minute lock of sync.js.
    const syncing = ipx.state.sync?.running && Date.now() - ipx.state.sync.updated < 2 * 60e3;
    const tt = ipx.state.timetable;
    const ds = ipx.state.docserver || {};
    const viewed = Object.values(ipx.state.courses || {});
    const mine = enrolled(viewed).list;
    const todo = ipx.todo ? ipx.todo.items({}, now) : [];
    const checked = ipx.todo ? ipx.todo.status() : [];

    const sharedQuestion = !ipx.state.sharedAsked && ipx.user && h('section', { class: 'card ask' },
      h('div', {}, h('strong', {}, T.sharedQ), h('p', { class: 'muted' }, T.sharedText)),
      h('div', { class: 'ask-actions' },
        h('button', { type: 'button', class: 'btn', onclick: () => ipx.setShared(false).then(state.render) }, T.sharedNo),
        h('button', { type: 'button', class: 'btn ghost', onclick: () => ipx.setShared(true).then(state.render) }, T.sharedYes)));

    // The same course card as My courses and Materials (course.js).
    const card = (c) => (ipx.courseCard ? ipx.courseCard(c) : courseCard({ ...c, href: ipx.nav.composedUrl('course.overview', c.code) }));

    const shownNotices = notices.filter((n) => !todo.some((it) => it.id === 'datacheck' && /kontrol|check/i.test(n.text)));
    const news = (ds.courses || []).filter((c) => c.newCount > 0).sort((a, b) => b.newCount - a.newCount).slice(0, 6);
    const lastChecked = checked.map((s) => (s.checked ? `${s.label} ${s.checked.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}` : `${s.label} — ${T.notChecked}`)).join(' · ');

    return h('div', { class: 'dash' },
      h('div', { class: 'dash-main' },
        sharedQuestion,

        h('section', { class: 'todo-block' },
          sectionHead(nav.label('todo')),
          todo.length
            ? h('div', { class: 'card todo-list' }, todo.map((it) => anchor({ href: it.href }, { class: 'todo-row' },
                h('span', { class: 'todo-text' }, h('strong', {}, it.title), it.sub && h('small', {}, it.sub)),
                it.when && h('span', { class: `delta ${it.tone || 'neutral'}` }, it.when))))
            : h('div', { class: 'card todo-list empty-todo' }, h('p', {}, syncing ? T.loading : T.nothingTodo)),
          h('p', { class: 'checked' }, T.checked, ' ', lastChecked)),

        h('section', {},
          sectionHead(nav.label('mycourses'), { href: ipx.nav.composedUrl('courses.mine'), text: T.allCourses }),
          mine.length
            ? h('div', { class: 'course-list' }, mine.map(card))
            : emptyState(syncing ? T.loading : T.coursesEmpty)),

        shownNotices.length > 0 && h('section', {}, sectionHead(nav.label('notices')), shownNotices.map(notice))),

      h('aside', { class: 'rail' },
        weekStrip(now, classDays(tt?.events)),
        h('section', {},
          h('div', { class: 'card-head' }, h('h2', {}, nav.label('timetable')),
            ipx.nav.target('schedule.week') && anchor({ href: ipx.nav.target('schedule.week') }, { class: 'more' }, T.fullSchedule)),
          (tt && nextClasses(tt.events, ipx.nav.target('schedule.week'))) || h('p', { class: 'muted rail-empty' }, tt ? T.scheduleDone : syncing ? T.loading : T.scheduleEmpty)),
        h('section', {},
          h('div', { class: 'card-head' }, h('h2', {}, nav.label('newfiles')),
            anchor({ href: ipx.nav.composedUrl('courses.files') }, { class: 'more' }, T.allFiles)),
          news.length
            ? h('ul', { class: 'recent' }, news.map((c) => h('li', {},
                anchor({ href: ipx.nav.safe(c.href, 'link', { copied: true }) || ipx.nav.composedUrl('courses.files') }, { class: 'row' },
                  h('strong', {}, h('span', { class: 'news-code', style: `color: ${facultyColors(facultyFor(c.code))[1]}` }, c.code), ' ', c.name),
                  h('span', { class: 'delta bad' }, T.newN(c.newCount))))))
            : h('p', { class: 'muted rail-empty' }, ds.updated ? T.noNewFiles : syncing ? T.loading : T.filesNotRead)),
        tt && hoursChart(tt.events)));
  }

  ipx.ready.then(() => {
    const data = harvest();
    // Only take over a page that clearly is the InSIS main menu.
    if (data.services.length < 6 || data.quick.length < 3) return;
    const name = userName();

    ipx.state.menu = data.services.map((g) => ({ title: g.title, links: g.links.map(({ href, text, target }) => ({ href, text, target })) }));
    ipx.state.profile = { name, docs: data.header.docs || null, tasks: data.header.tasks || null };
    ipx.state.notices = { updated: Date.now(), items: data.notices.map(({ href, text }) => ({ href, text })) };
    ipx.state.homeUrl = location.href.split('#')[0];
    ipx.save();

    // An InSIS+ page (Study matters, All services, …) lives on this address after "#ipx:".
    const where = ipx.ui.here();
    if (where.composed && where.node !== 'home' && ipx.composed) {
      ipx.composed.show(where);
      return;
    }

    const hour = new Date().getHours();
    const greet = hour < 11 ? T.morning : hour < 18 ? T.day : T.evening;
    const date = new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });

    takeover({
      key: 'home',
      css: 'home.css',
      title: name ? `${greet}, ${name.split(' ')[0]}` : T.welcome,
      subtitle: date.charAt(0).toUpperCase() + date.slice(1),
      build: () => {
        // Re-rendered when data arrives from the background sync, pins change, or the shared-computer answer is given.
        const wrap = h('div', {});
        const state = { render: () => render() };
        const render = () => wrap.replaceChildren(buildPage(data, state));
        render();
        onPinsChange(render);
        ipx.onData(render);
        return wrap;
      },
    });
  });
})();
