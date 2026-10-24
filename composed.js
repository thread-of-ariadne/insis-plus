// InSIS+ — pages that exist only in InSIS+ (docs/ia/02-redesign.md): grouped lists of a destination's sections,
// and later the composed pages (My courses, Materials, the course page, Notifications, InSIS+ settings).
// They live on InSIS's main page address after "#ipx:<node>" so they run same-origin with InSIS; home.js hands
// such an address over to ipx.composed.show() instead of drawing the dashboard.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.ui || !ipx.nav) return;
  const { lang } = ipx;
  const { h, icon, anchor, takeover, nodeLinks, emptyState } = ipx.ui;
  const nav = ipx.nav;

  const T = {
    cs: { soon: 'Tato stránka InSIS+ se teprve připravuje.', open: 'Otevřít v InSIS', settingsLead: 'Nastavení rozšíření InSIS+.',
      classic: 'Klasický vzhled InSIS', classicText: 'Vzhled InSIS+ můžete na každé stránce vypnout tlačítkem Klasické zobrazení dole v postranním panelu.',
      privacy: 'Soukromí', privacyText: 'InSIS+ běží jen ve vašem prohlížeči a nic nikam neposílá.',
      theme: 'Vzhled', themeText: 'Světlý, tmavý, nebo podle nastavení systému.', themeSystem: 'Podle systému', themeLight: 'Světlý', themeDark: 'Tmavý',
      background: 'Číst data na pozadí', backgroundText: 'Rozvrh, výsledky, odevzdávárny a materiály se načítají samy, nejvýš jednou za 3 hodiny.',
      shared: 'Sdílený počítač', sharedText: 'Mezi návštěvami se neukládá nic (připnuté stránky, nastavení, co už jste viděli).',
      clear: 'Smazat uložená data', clearText: 'Smaže vše, co InSIS+ uložil, kromě volby sdíleného počítače.', clearButton: 'Smazat', cleared: 'Smazáno.',
      newFiles: (n) => `${n} nových dokumentů`, result: (c, n) => `Výsledek: ${c} ${n}`, fresh: 'nové', noNotifications: 'Zatím nic nového.',
      notifHint: 'Upozornění ukazují, co se v InSIS změnilo. Zprávy v InSIS najdete pod ikonou obálky.',
      somethingElse: 'Něco jiného?', myStudy: 'Vaše studium', details: 'Stav studia', restricted: 'Omezení', noRestriction: 'Bez omezení',
      studyUnknown: 'Údaje o studiu se zatím nenačetly.', toHandle: 'K vyřízení', nothingToHandle: 'Nic nečeká.',
      myTeachers: 'Vaši vyučující v tomto semestru', myRooms: 'Vaše místnosti tento týden',
      checkedAt: (t) => `Načteno z InSIS v ${t}`, nextClass: (w, r) => `příště ${w}${r ? ` · ${r}` : ''}`, findPerson: 'Hledat osobu', teachersUnknown: 'Vyučující se ukážou, až se načte váš rozvrh.',
      nextDegree: 'Přihlášky ke studiu (např. na navazující magisterské studium) se podávají elektronickou přihláškou VŠE; InSIS+ ji neotevírá. S postupem poradí studijní oddělení.' },
    en: { soon: 'This InSIS+ page is still being built.', open: 'Open in InSIS', settingsLead: 'Settings of the InSIS+ extension.',
      classic: 'Classic InSIS look', classicText: 'Switch the InSIS+ look off on any page with Classic view at the bottom of the sidebar.',
      privacy: 'Privacy', privacyText: 'InSIS+ runs only in your browser and sends nothing anywhere.',
      theme: 'Appearance', themeText: 'Light, dark, or as your system is set.', themeSystem: 'System', themeLight: 'Light', themeDark: 'Dark',
      background: 'Read data in the background', backgroundText: 'Timetable, results, submission boxes and materials load by themselves, at most every 3 hours.',
      shared: 'Shared computer', sharedText: 'Nothing is kept between visits (pins, settings, what you have seen).',
      clear: 'Clear stored data', clearText: 'Deletes everything InSIS+ stored, except the shared-computer choice.', clearButton: 'Clear', cleared: 'Cleared.',
      newFiles: (n) => `${n} new documents`, result: (c, n) => `Result: ${c} ${n}`, fresh: 'new', noNotifications: 'Nothing new yet.',
      notifHint: 'Notifications show what changed in InSIS. InSIS messages are under the envelope icon.',
      somethingElse: 'Something else?', myStudy: 'Your study', details: 'Study status', restricted: 'Restriction', noRestriction: 'No restriction',
      studyUnknown: 'Your study details have not loaded yet.', toHandle: 'To handle', nothingToHandle: 'Nothing waiting.',
      myTeachers: 'Your teachers this semester', myRooms: 'Your rooms this week',
      checkedAt: (t) => `Read from InSIS at ${t}`, nextClass: (w, r) => `next ${w}${r ? ` · ${r}` : ''}`, findPerson: 'Find a person', teachersUnknown: 'Your teachers appear once your timetable has loaded.',
      nextDegree: 'Applications for study (e.g. a master’s programme) are made with VŠE’s electronic application; InSIS+ does not open it. The study department can advise you.' },
  }[lang];

  const renderers = {};
  const register = (node, fn) => { renderers[node] = fn; };

  // A destination shown as groups of sections, each a row with its one-line explanation.
  function groupedList(dest) {
    const tabs = nav.tabs[dest];
    const groups = Array.isArray(tabs) ? { [dest]: tabs } : tabs;
    return h('div', { class: 'glist' }, Object.entries(groups).map(([group, nodes]) => {
      const links = nodeLinks(nodes);
      if (!links.length) return null;
      return h('section', { class: 'glist-group' },
        Array.isArray(tabs) ? null : h('h2', { class: 'section-title' }, nav.label(group)),
        h('div', { class: 'glist-items' }, links.map((l) => anchor(l, { class: 'card glist-item' },
          h('span', { class: 'glist-text' }, h('strong', {}, l.text), l.gloss && h('small', {}, l.gloss)),
          h('span', { class: 'glist-go' }, icon('arrow'))))));
    }));
  }

  for (const dest of ['all', 'help', 'account']) {
    register(`dest.${dest}`, () => ({ title: nav.label(dest), build: () => groupedList(dest) }));
  }

  // ---------- Study matters and Campus & people: facts only (docs/ia/03-pages.md §7, decision 9) ----------
  // The sections themselves are the sidebar's submenu while you are in the destination, so the overview repeats none
  // of them: it shows what InSIS+ already knows from data it has read (no read of its own) and where to ask.

  const todoRows = (items) => h('div', { class: 'todo-mini' }, items.map((it) => anchor({ href: it.href }, { class: 'todo-row' },
    h('span', { class: 'todo-text' }, h('strong', {}, it.title), it.sub && h('small', {}, it.sub)),
    it.when && h('span', { class: `delta ${it.tone || 'neutral'}` }, it.when))));
  const clock = (ms) => new Date(ms).toLocaleTimeString(ipx.ui.locale, { hour: '2-digit', minute: '2-digit' });
  register('dest.matters', () => ({
    title: nav.label('matters'),
    build: () => {
      const portal = ipx.state.portal;
      const s = portal?.study;
      const restricted = s?.restriction && !/^[-–—\s]*$/.test(s.restriction);
      const statusHref = nav.target('studies.status');
      // Things to handle that belong to no course: a restriction, InSIS's personal data check.
      const todo = ipx.todo ? ipx.todo.items().filter((it) => !it.code) : [];
      return h('div', { class: 'dest-page' },
        h('div', { class: 'dest-top' },
          h('section', { class: 'card pad study-card' },
            h('div', { class: 'card-head' }, h('h2', {}, T.myStudy), statusHref && anchor({ href: statusHref }, { class: 'more' }, T.details)),
            s ? [
              h('p', { class: 'study-name' }, s.name),
              s.detail && h('p', { class: 'muted' }, s.detail),
              h('p', { class: 'study-facts' },
                s.faculty && h('span', { class: 'chip' }, s.faculty),
                s.progress && h('span', { class: 'chip' }, s.progress),
                h('span', { class: `delta ${restricted ? 'bad' : 'ok'}` }, restricted ? `${T.restricted}: ${s.restriction}` : T.noRestriction),
                // When InSIS+ last read the study (the portal, refreshed by the background sync): the "stale" state.
                portal.updated && h('span', { class: 'checked' }, T.checkedAt(clock(portal.updated)))),
            ] : h('p', { class: 'muted' }, T.studyUnknown)),
          h('section', { class: 'card pad' },
            h('h2', { class: 'card-title' }, T.toHandle),
            todo.length ? todoRows(todo) : h('p', { class: 'muted' }, T.nothingToHandle))),
        // What InSIS has no page for: said here, with whom to ask (no dead-end sections in the navigation).
        h('section', { class: 'card pad else-card' },
          h('h2', { class: 'card-title' }, T.somethingElse),
          h('dl', { class: 'else-list' },
            h('dt', {}, nav.label('studies.nextdegree')), h('dd', {}, T.nextDegree)),
          nav.target('campus.office') && anchor({ href: nav.target('campus.office') }, { class: 'btn ghost' }, nav.label('campus.office'))));
    },
  }));

  // Teachers of this semester's classes, from the personal timetable (ipx.state.timetable.events): name, the
  // courses, their InSIS person page (copied through the URL rule) and the next class with them; soonest first.
  // Also used by People (pages/persons.js) through ipx.composed.teachers() / teacherGrid().
  const at = (date, hm) => {
    const [y, m, d] = date.split('-').map(Number);
    const [hh, mm] = hm.split(':').map(Number);
    return new Date(y, m - 1, d, hh, mm);
  };
  function teachers(now = new Date()) {
    const people = new Map();
    for (const e of ipx.state.timetable?.events || []) {
      const list = e.people?.length ? e.people : (e.teacher || '').split(/,\s*/).filter(Boolean).map((text) => ({ text }));
      const start = e.date && e.start ? at(e.date, e.start) : null;
      for (const p of list) {
        const key = ipx.clean(p.text);
        if (!key) continue;
        const it = people.get(key) || { text: key, href: p.href && nav.safe(p.href, 'link', { copied: true }), codes: new Set(), next: null };
        if (e.code) it.codes.add(e.code);
        if (start && start > now && (!it.next || start < it.next.at)) it.next = { at: start, room: e.room || '' };
        people.set(key, it);
      }
    }
    return [...people.values()].sort((a, b) => ((a.next?.at ?? Infinity) - (b.next?.at ?? Infinity)) || a.text.localeCompare(b.text, lang));
  }
  const nextText = (n) => n && T.nextClass(`${n.at.toLocaleDateString(ipx.ui.locale, { weekday: 'short' })} ${n.at.toLocaleTimeString(ipx.ui.locale, { hour: '2-digit', minute: '2-digit' })}`, n.room);
  // A person or room is a link when InSIS gave one, else plain text.
  const linkOrText = (href, props, ...kids) => (href ? anchor({ href }, props, ...kids) : h('span', props, ...kids));
  const teacherGrid = (list) => h('div', { class: 'people-grid' }, list.map((p) => linkOrText(p.href, { class: 'person' },
    h('span', { class: 'avatar sm' }, ipx.ui.initials(p.text)),
    h('span', { class: 'person-text' }, h('strong', {}, p.text),
      h('small', {}, [[...p.codes].join(', '), nextText(p.next)].filter(Boolean).join(' · '))))));

  // Rooms of this week's classes (every room of a weekly timetable), each with the room link the timetable gave.
  function roomsThisWeek(now = new Date()) {
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
    const nextMonday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 7);
    const rooms = new Map();
    for (const e of ipx.state.timetable?.events || []) {
      if (!e.room) continue;
      if (e.date) {
        const d = at(e.date, '00:00');
        if (d < monday || d >= nextMonday) continue;
      }
      const r = rooms.get(e.room) || { text: e.room, href: e.roomHref && nav.safe(e.roomHref, 'link', { copied: true }), codes: new Set() };
      if (e.code) r.codes.add(e.code);
      rooms.set(e.room, r);
    }
    return [...rooms.values()].sort((a, b) => a.text.localeCompare(b.text, lang));
  }

  register('dest.campus', () => ({
    title: nav.label('campus'),
    build: () => {
      const list = teachers();
      const rooms = roomsThisWeek();
      return h('div', { class: 'dest-page' },
        h('section', { class: 'card pad' },
          h('div', { class: 'card-head' }, h('h2', {}, T.myTeachers), nav.target('campus.people') && anchor({ href: nav.target('campus.people') }, { class: 'more' }, T.findPerson)),
          list.length ? teacherGrid(list) : h('p', { class: 'muted' }, T.teachersUnknown)),
        rooms.length > 0 && h('section', { class: 'card pad' },
          h('h2', { class: 'card-title' }, T.myRooms),
          h('p', { class: 'study-facts' }, rooms.map((r) => linkOrText(r.href, { class: 'chip', title: [...r.codes].join(', ') || null }, r.text)))));
    },
  }));

  // ---------- InSIS+ settings ----------

  function toggle(id, label, text, checked, onChange) {
    const input = h('input', { type: 'checkbox', id, class: 'switch-input' });
    input.checked = checked;
    input.addEventListener('change', () => onChange(input.checked));
    return h('label', { class: 'card setting', for: id },
      h('span', { class: 'glist-text' }, h('strong', {}, label), h('small', {}, text)), input);
  }

  // Appearance: follow the system, or always light / dark (applied at once, kept per user like other settings).
  function themePicker() {
    const current = () => ipx.state.plus?.theme || 'system';
    const options = [['system', T.themeSystem], ['light', T.themeLight], ['dark', T.themeDark]];
    const group = h('div', { class: 'segmented', role: 'radiogroup', 'aria-label': T.theme });
    const render = () => group.replaceChildren(...options.map(([id, text]) => h('button', {
      type: 'button', role: 'radio', 'aria-checked': String(current() === id), class: current() === id ? 'on' : null,
      onclick: () => ipx.setTheme(id).then(render),
    }, text)));
    render();
    return h('section', { class: 'card setting' },
      h('span', { class: 'glist-text' }, h('strong', {}, T.theme), h('small', {}, T.themeText)), group);
  }

  register('plus.settings', () => ({
    title: nav.label('plus'),
    build: () => {
      const plus = () => (ipx.state.plus ||= {});
      const status = h('p', { class: 'muted', role: 'status' });
      return h('div', { class: 'glist' },
        h('p', { class: 'muted' }, T.settingsLead),
        themePicker(),
        toggle('ipx-pause', T.background, T.backgroundText, !plus().pause, (on) => { plus().pause = !on; ipx.save(); }),
        toggle('ipx-shared', T.shared, T.sharedText, !!ipx.state.shared, (on) => ipx.setShared(on)),
        h('section', { class: 'card setting' },
          h('span', { class: 'glist-text' }, h('strong', {}, T.clear), h('small', {}, T.clearText)),
          h('button', { type: 'button', class: 'btn ghost', onclick: () => ipx.clearAll().then(() => { status.textContent = T.cleared; }) }, T.clearButton)),
        status,
        h('section', { class: 'card glist-note' }, h('strong', {}, T.classic), h('p', {}, T.classicText)),
        h('section', { class: 'card glist-note' }, h('strong', {}, T.privacy), h('p', {}, T.privacyText)));
    },
  }));

  // ---------- Notifications (docs/ia/02-redesign.md §7) ----------
  // Things that changed in InSIS, shown once. "Seen" is kept by InSIS+ per user (plain values: the time of the last
  // visit and the last count of new files) and never written to InSIS.

  const parseDate = (s) => {
    const m = /(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/.exec(s || '');
    return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null;
  };

  function notifications() {
    const seen = ipx.state.seen || {};
    const since = seen.lastVisit || 0;
    const out = [];
    const files = ipx.state.profile?.docs;
    if (files?.count > 0) {
      out.push({ id: 'files', fresh: files.count !== seen.files, title: T.newFiles(files.count),
        sub: (ipx.state.docserver?.courses || []).filter((c) => c.newCount > 0).map((c) => `${c.code} ${c.newCount}`).join(' · '),
        href: nav.safe(files.href, 'link', { copied: true }) || nav.composedUrl('courses.files') });
    }
    for (const c of ipx.state.studyRecord?.courses || []) {
      const at = parseDate(c.entered);
      if (!at || !c.result) continue;
      // Shared computer mode keeps no "last visit": a result counts as new only if entered today.
      const fresh = ipx.state.shared ? at.toDateString() === new Date().toDateString() : at.getTime() >= new Date(since).setHours(0, 0, 0, 0);
      out.push({ id: `result:${c.code}`, fresh, when: at, title: T.result(c.code, c.name), sub: c.result, href: nav.target('grades.results') });
    }
    return out.sort((a, b) => (b.fresh - a.fresh) || ((b.when || 0) - (a.when || 0)));
  }
  const unseen = () => notifications().filter((n) => n.fresh).length;

  register('notifications', () => ({
    title: nav.label('notifications'),
    build: () => {
      const list = notifications();
      // Opening the list marks everything as seen, in InSIS+ only.
      ipx.state.seen = { lastVisit: Date.now(), files: ipx.state.profile?.docs?.count ?? null };
      ipx.save();
      return h('div', { class: 'glist' },
        list.length
          ? h('div', { class: 'card todo-list notif-list' }, list.map((n) => anchor({ href: n.href }, { class: 'todo-row' + (n.fresh ? ' fresh' : '') },
              h('span', { class: 'todo-text' }, h('strong', {}, n.title), n.sub && h('small', {}, n.sub)),
              n.fresh && h('span', { class: 'delta bad' }, T.fresh))))
          : emptyState(T.noNotifications),
        h('p', { class: 'muted' }, T.notifHint));
    },
  }));

  // Shows the InSIS+ page for this route; false if there is none (the caller then draws its own page).
  function show(route) {
    const make = renderers[route.node];
    const page = make ? make(route) : {
      title: nav.label(route.node),
      build: () => emptyState(T.soon),
    };
    takeover({ key: 'composed', css: page.css, title: page.title, subtitle: page.subtitle, build: page.build });
    return true;
  }

  // Moving between InSIS+ pages only changes the hash: draw the new one.
  addEventListener('hashchange', () => { if (/^#ipx:/.test(location.hash)) location.reload(); });

  ipx.composed = { register, show, teachers, teacherGrid };
  ipx.notifications = { list: notifications, unseen };
})();
