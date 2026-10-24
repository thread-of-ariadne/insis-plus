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
      requests: 'Žádosti na studijní oddělení (přerušení studia, uznání předmětů, prodloužení termínů) se podávají podle pokynů vaší fakulty. Zeptejte se na studijním oddělení nebo v kontaktním centru.',
      theme: 'Vzhled', themeText: 'Světlý, tmavý, nebo podle nastavení systému.', themeSystem: 'Podle systému', themeLight: 'Světlý', themeDark: 'Tmavý',
      background: 'Číst data na pozadí', backgroundText: 'Rozvrh, výsledky, odevzdávárny a materiály se načítají samy, nejvýš jednou za 3 hodiny.',
      shared: 'Sdílený počítač', sharedText: 'Mezi návštěvami se neukládá nic (připnuté stránky, nastavení, co už jste viděli).',
      clear: 'Smazat uložená data', clearText: 'Smaže vše, co InSIS+ uložil, kromě volby sdíleného počítače.', clearButton: 'Smazat', cleared: 'Smazáno.',
      newFiles: (n) => `${n} nových dokumentů`, result: (c, n) => `Výsledek: ${c} ${n}`, fresh: 'nové', noNotifications: 'Zatím nic nového.',
      notifHint: 'Upozornění ukazují, co se v InSIS změnilo. Zprávy v InSIS najdete pod ikonou obálky.',
      somethingElse: 'Něco jiného?', myStudy: 'Tvoje studium', details: 'Stav studia', restricted: 'Omezení', noRestriction: 'Bez omezení',
      studyUnknown: 'Údaje o studiu se zatím nenačetly.', toHandle: 'K vyřízení', nothingToHandle: 'Nic nečeká.',
      myTeachers: 'Tvoji vyučující v tomto semestru', findPerson: 'Hledat osobu', teachersUnknown: 'Vyučující se ukážou, až se načte tvůj rozvrh.',
      nextDegree: 'Přihlášky ke studiu jsou v InSIS pod položkou Přihláška ke studiu na hlavní stránce (v klasickém zobrazení). InSIS+ je zatím neotevírá. Pokud si nejste jistí postupem, zeptejte se na studijním oddělení.' },
    en: { soon: 'This InSIS+ page is still being built.', open: 'Open in InSIS', settingsLead: 'Settings of the InSIS+ extension.',
      classic: 'Classic InSIS look', classicText: 'Switch the InSIS+ look off on any page with Classic view at the bottom of the sidebar.',
      privacy: 'Privacy', privacyText: 'InSIS+ runs only in your browser and sends nothing anywhere.',
      requests: 'Requests to the study department (interrupting studies, recognition of courses, deadline extensions) follow your faculty’s instructions. Ask the study department or the contact centre.',
      theme: 'Appearance', themeText: 'Light, dark, or as your system is set.', themeSystem: 'System', themeLight: 'Light', themeDark: 'Dark',
      background: 'Read data in the background', backgroundText: 'Timetable, results, submission boxes and materials load by themselves, at most every 3 hours.',
      shared: 'Shared computer', sharedText: 'Nothing is kept between visits (pins, settings, what you have seen).',
      clear: 'Clear stored data', clearText: 'Deletes everything InSIS+ stored, except the shared-computer choice.', clearButton: 'Clear', cleared: 'Cleared.',
      newFiles: (n) => `${n} new documents`, result: (c, n) => `Result: ${c} ${n}`, fresh: 'new', noNotifications: 'Nothing new yet.',
      notifHint: 'Notifications show what changed in InSIS. InSIS messages are under the envelope icon.',
      somethingElse: 'Something else?', myStudy: 'Your study', details: 'Study status', restricted: 'Restriction', noRestriction: 'No restriction',
      studyUnknown: 'Your study details have not loaded yet.', toHandle: 'To handle', nothingToHandle: 'Nothing waiting.',
      myTeachers: 'Your teachers this semester', findPerson: 'Find a person', teachersUnknown: 'Your teachers appear once your timetable has loaded.',
      nextDegree: 'Study applications are in InSIS under Study application form on the main page (in Classic view). InSIS+ does not open them yet. If you are unsure how to apply, ask the study department.' },
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

  // ---------- Study matters and Campus & people: what is going on first, then the sections ----------
  // (docs/ia/02-redesign.md §3). The sections are also a submenu in the sidebar while you are in the destination.

  // The destination's groups as compact columns: one card per group, a plain row per section with its gloss.
  function groupColumns(dest) {
    const groups = nav.tabs[dest];
    return h('div', { class: 'gcols' }, Object.entries(groups).map(([group, nodes]) => {
      const links = nodeLinks(nodes);
      return links.length > 0 && h('section', { class: 'card gcol' },
        h('h2', { class: 'card-title' }, nav.label(group)),
        h('div', { class: 'gcol-items' }, links.map((l) => anchor(l, { class: 'gcol-item' },
          h('span', { class: 'glist-text' }, h('strong', {}, l.text), l.gloss && h('small', {}, l.gloss)),
          h('span', { class: 'glist-go' }, icon('arrow'))))));
    }));
  }

  const todoRows = (items) => h('div', { class: 'todo-mini' }, items.map((it) => anchor({ href: it.href }, { class: 'todo-row' },
    h('span', { class: 'todo-text' }, h('strong', {}, it.title), it.sub && h('small', {}, it.sub)),
    it.when && h('span', { class: `delta ${it.tone || 'neutral'}` }, it.when))));

  register('dest.matters', () => ({
    title: nav.label('matters'),
    build: () => {
      const s = ipx.state.portal?.study;
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
                h('span', { class: `delta ${restricted ? 'bad' : 'ok'}` }, restricted ? `${T.restricted}: ${s.restriction}` : T.noRestriction)),
            ] : h('p', { class: 'muted' }, T.studyUnknown)),
          h('section', { class: 'card pad' },
            h('h2', { class: 'card-title' }, T.toHandle),
            todo.length ? todoRows(todo) : h('p', { class: 'muted' }, T.nothingToHandle))),
        groupColumns('matters'),
        // What InSIS has no page for: said here, with whom to ask (no dead-end sections in the navigation).
        h('section', { class: 'card pad else-card' },
          h('h2', { class: 'card-title' }, T.somethingElse),
          h('dl', { class: 'else-list' },
            h('dt', {}, nav.label('studies.requests')), h('dd', {}, T.requests),
            h('dt', {}, nav.label('studies.nextdegree')), h('dd', {}, T.nextDegree)),
          nav.target('campus.office') && anchor({ href: nav.target('campus.office') }, { class: 'btn ghost' }, nav.label('campus.office'))));
    },
  }));

  register('dest.campus', () => ({
    title: nav.label('campus'),
    build: () => {
      // Teachers of this semester's classes, from the personal timetable: name, the courses, their InSIS page.
      const people = new Map();
      for (const e of ipx.state.timetable?.events || []) {
        const list = e.people?.length ? e.people : (e.teacher || '').split(/,\s*/).filter(Boolean).map((text) => ({ text }));
        for (const p of list) {
          const key = ipx.clean(p.text);
          if (!key) continue;
          const it = people.get(key) || { text: key, href: p.href && nav.safe(p.href, 'link', { copied: true }), codes: new Set() };
          if (e.code) it.codes.add(e.code);
          people.set(key, it);
        }
      }
      const list = [...people.values()].sort((a, b) => a.text.localeCompare(b.text, lang));
      return h('div', { class: 'dest-page' },
        h('section', { class: 'card pad' },
          h('div', { class: 'card-head' }, h('h2', {}, T.myTeachers), nav.target('campus.people') && anchor({ href: nav.target('campus.people') }, { class: 'more' }, T.findPerson)),
          list.length ? h('div', { class: 'people-grid' }, list.map((p) => (p.href ? anchor : (l, props, ...k) => h('span', props, ...k))(
            { href: p.href }, { class: 'person' },
            h('span', { class: 'avatar sm' }, ipx.ui.initials(p.text)),
            h('span', { class: 'person-text' }, h('strong', {}, p.text), p.codes.size > 0 && h('small', {}, [...p.codes].join(', '))))))
            : h('p', { class: 'muted' }, T.teachersUnknown)),
        groupColumns('campus'));
    },
  }));

  // Sections whose InSIS pages are not verified yet: say where to go and who to ask (docs/ia/02-redesign.md §3).
  const signpost = (node, text) => register(node, () => ({
    title: nav.label(node),
    build: () => h('div', { class: 'glist' },
      h('section', { class: 'card glist-note' }, h('p', {}, text)),
      nodeLinks(['campus.office', 'help.ask']).map((l) => anchor(l, { class: 'card glist-item' },
        h('span', { class: 'glist-text' }, h('strong', {}, l.text), l.gloss && h('small', {}, l.gloss)),
        h('span', { class: 'glist-go' }, icon('arrow'))))),
  }));
  signpost('studies.requests', T.requests);
  signpost('studies.nextdegree', T.nextDegree);

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

  ipx.composed = { register, show };
  ipx.notifications = { list: notifications, unseen };
})();
