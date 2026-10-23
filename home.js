// InSIS+ — dashboard replacing the InSIS main page.
// Built from the links found on the page itself, so it adapts when InSIS renames or adds items.
// The service menu, name and counters are stored so every other redesigned page can show them.
// If the page doesn't look like the main page, nothing is changed.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.ui) return;
  const { clean, norm, lang } = ipx;
  const { h, anchor, takeover, onPinsChange, kpi, sectionHead, tabs, emptyState, notice, courseCard, weekStrip,
    nextClasses, hoursChart, classDays, deadlineList, facultyColors, facultyFor } = ipx.ui;

  const T = {
    cs: { morning: 'Dobré ráno', day: 'Dobrý den', evening: 'Dobrý večer', welcome: 'Vítejte zpět',
      docs: 'Dokumenty', tasks: 'Úkoly', pinned: 'Připnuté', fresh: 'nové', allDone: '✓ hotovo', waiting: (n) => `${n} čeká`,
      courses: 'Moje předměty', termTab: 'Tento semestr', allTab: 'Nedávno zobrazené', catalogue: 'Katalog →',
      coursesHint: 'Předměty, jejichž sylabus jste otevřeli.',
      coursesEmpty: 'Zatím žádné. Otevřete sylabus předmětu, třeba z katalogu, a objeví se tady.',
      semester: 'Semestr', schedule: 'Rozvrh', fullSchedule: 'Celý rozvrh →',
      scheduleEmpty: 'Až otevřete svůj rozvrh v InSIS, ukážou se tu nejbližší hodiny a zkoušky.',
      scheduleDone: 'V tomto rozvrhu už žádné další hodiny nejsou.',
      deadlines: 'Termíny odevzdání', allDeadlines: 'Odevzdávárny →', noDeadlines: 'Žádná otevřená odevzdávárna nečeká.',
      newDocs: 'Nové dokumenty', allDocs: 'Dokumentový server →', newN: (n) => `${n} nové`,
      recent: 'Naposledy otevřené', recentEmpty: 'Tady se objeví stránky, které otevřete.',
      today: 'dnes', yesterday: 'včera' },
    en: { morning: 'Good morning', day: 'Good afternoon', evening: 'Good evening', welcome: 'Welcome back',
      docs: 'Documents', tasks: 'Tasks', pinned: 'Pinned', fresh: 'new', allDone: '✓ done', waiting: (n) => `${n} waiting`,
      courses: 'My courses', termTab: 'This semester', allTab: 'Recently viewed', catalogue: 'Catalogue →',
      coursesHint: 'Courses whose syllabus you have opened.',
      coursesEmpty: 'None yet. Open a course syllabus, for example from the catalogue, and it shows up here.',
      semester: 'Semester', schedule: 'Timetable', fullSchedule: 'Full timetable →',
      scheduleEmpty: 'Once you open your timetable in InSIS, your next classes and exams will show up here.',
      scheduleDone: 'No more classes in this timetable.',
      deadlines: 'Deadlines', allDeadlines: 'Submissions →', noDeadlines: 'No open submission box is waiting.',
      newDocs: 'New documents', allDocs: 'Document server →', newN: (n) => `${n} new`,
      recent: 'Recently opened', recentEmpty: 'Pages you open will show up here.',
      today: 'today', yesterday: 'yesterday' },
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

  function when(ts) {
    const d = new Date(ts);
    const days = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(ts).setHours(0, 0, 0, 0)) / 864e5);
    const time = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    if (days === 0) return `${T.today} ${time}`;
    if (days === 1) return `${T.yesterday} ${time}`;
    return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  }

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

  function buildPage({ header, notices, quick }, state) {
    const pins = ipx.state.fav.filter((url) => ipx.state.links[url]);
    const here = location.href.split('#')[0];
    const recent = Object.entries(ipx.state.links)
      .filter(([url, l]) => l.v > 0 && url !== here)
      .sort((a, b) => b[1].s - a[1].s)
      // One page often has several addresses (different parameters): list each title once.
      .filter(([, l], i, all) => all.findIndex(([, m]) => m.t === l.t) === i)
      .slice(0, 5)
      .map(([url, l]) => ({ href: url, text: l.t, s: l.s }));

    const courses = Object.values(ipx.state.courses || {}).sort((a, b) => b.s - a.s);
    const thisTerm = courses.filter((c) => isThisTerm(c.semester));
    const tab = state.tab || (thisTerm.length ? 'term' : 'all');
    const shown = (tab === 'term' ? thisTerm : courses).slice(0, 4);

    const { docs, tasks } = header;
    // The personal timetable module stores its classes; the menu's "Timetables" is only the public search.
    const tt = ipx.state.timetable;
    const timetable = tt?.source ? { href: tt.source } : quick.find((q) => q.icon === 'calendar')?.link;
    const upcoming = tt && nextClasses(tt.events, tt.source);
    // Stored by pages/submissions.js and pages/docserver.js when those pages were opened.
    const sub = ipx.state.submissions;
    const ds = ipx.state.docserver || {};
    const news = (ds.courses || []).filter((c) => c.newCount > 0).sort((a, b) => b.newCount - a.newCount).slice(0, 5);
    const catalogue = new URL('/katalog/', document.baseURI).href;

    return h('div', { class: 'dash' },
      h('div', { class: 'dash-main' },
        notices.map(notice),

        h('div', { class: 'kpis' },
          docs && kpi({ label: T.docs, value: docs.count ?? '—', href: docs.href,
            status: docs.count > 0 && { tone: 'bad', text: T.fresh } }),
          tasks && kpi({ label: T.tasks, value: tasks.count ?? '—', href: tasks.href,
            status: tasks.count > 0 ? { tone: 'warn', text: T.waiting(tasks.count) } : { tone: 'ok', text: T.allDone } }),
          kpi({ label: T.pinned, value: pins.length })),

        sectionHead(T.courses, { href: catalogue, text: T.catalogue },
          tabs([{ id: 'term', label: T.termTab }, { id: 'all', label: T.allTab }], tab, state.setTab)),
        shown.length
          ? [h('p', { class: 'muted hint' }, T.coursesHint),
              h('div', { class: 'course-list' }, shown.map((c) => courseCard({ ...c, tags: [c.completion, c.language] })))]
          : emptyState(T.coursesEmpty)),

      h('aside', { class: 'rail' },
        weekStrip(new Date(), classDays(tt?.events)),
        h('section', {},
          h('div', { class: 'card-head' }, h('h2', {}, T.schedule), timetable && anchor(timetable, { class: 'more' }, T.fullSchedule)),
          upcoming || h('p', { class: 'muted rail-empty' }, tt ? T.scheduleDone : T.scheduleEmpty)),
        sub && h('section', {},
          h('div', { class: 'card-head' }, h('h2', {}, T.deadlines), anchor({ href: sub.source }, { class: 'more' }, T.allDeadlines)),
          deadlineList(sub.boxes) || h('p', { class: 'muted rail-empty' }, T.noDeadlines)),
        news.length > 0 && h('section', {},
          h('div', { class: 'card-head' }, h('h2', {}, T.newDocs), ds.source && anchor({ href: ds.source }, { class: 'more' }, T.allDocs)),
          h('ul', { class: 'recent' }, news.map((c) => h('li', {},
            anchor({ href: c.href || ds.source }, { class: 'row' },
              h('strong', {}, h('span', { class: 'news-code', style: `color: ${facultyColors(facultyFor(c.code))[1]}` }, c.code), ' ', c.name),
              h('span', { class: 'delta bad' }, T.newN(c.newCount))))))),
        tt && hoursChart(tt.events),
        h('section', {},
          h('div', { class: 'card-head' }, h('h2', {}, T.recent)),
          recent.length
            ? h('ul', { class: 'recent' }, recent.map((r) => h('li', {},
                anchor(r, { class: 'row' }, h('strong', {}, r.text), h('small', {}, when(r.s))))))
            : h('p', { class: 'muted rail-empty' }, T.recentEmpty))));
  }

  ipx.ready.then(() => {
    const data = harvest();
    // Only take over a page that clearly is the InSIS main menu.
    if (data.services.length < 6 || data.quick.length < 3) return;
    const name = userName();

    ipx.state.menu = data.services.map((g) => ({ title: g.title, links: g.links.map(({ href, text, target }) => ({ href, text, target })) }));
    ipx.state.profile = { name, docs: data.header.docs || null, tasks: data.header.tasks || null };
    ipx.state.homeUrl = location.href.split('#')[0];
    ipx.save();

    const hour = new Date().getHours();
    const greet = hour < 11 ? T.morning : hour < 18 ? T.day : T.evening;
    const date = new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });

    takeover({
      key: 'home',
      css: 'home.css',
      active: 'home',
      title: name ? `${greet}, ${name.split(' ')[0]}` : T.welcome,
      subtitle: date.charAt(0).toUpperCase() + date.slice(1),
      build: () => {
        // Re-rendered when the course tab changes or pins change in the sidebar.
        const wrap = h('div', {});
        const state = { tab: null, setTab: (t) => { state.tab = t; render(); } };
        const render = () => wrap.replaceChildren(buildPage(data, state));
        render();
        onPinsChange(render);
        return wrap;
      },
    });
  });
})();
