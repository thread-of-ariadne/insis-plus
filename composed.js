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
      background: 'Číst data na pozadí', backgroundText: 'Rozvrh, výsledky, odevzdávárny a materiály se načítají samy, nejvýš jednou za 3 hodiny.',
      shared: 'Sdílený počítač', sharedText: 'Mezi návštěvami se neukládá nic (připnuté stránky, nastavení, co už jste viděli).',
      clear: 'Smazat uložená data', clearText: 'Smaže vše, co InSIS+ uložil, kromě volby sdíleného počítače.', clearButton: 'Smazat', cleared: 'Smazáno.',
      newFiles: (n) => `${n} nových dokumentů`, result: (c, n) => `Výsledek: ${c} ${n}`, fresh: 'nové', noNotifications: 'Zatím nic nového.',
      notifHint: 'Upozornění ukazují, co se v InSIS změnilo. Zprávy v InSIS najdete pod ikonou obálky.',
      nextDegree: 'Přihlášky ke studiu jsou v InSIS pod položkou Přihláška ke studiu na hlavní stránce (v klasickém zobrazení). InSIS+ je zatím neotevírá. Pokud si nejste jistí postupem, zeptejte se na studijním oddělení.' },
    en: { soon: 'This InSIS+ page is still being built.', open: 'Open in InSIS', settingsLead: 'Settings of the InSIS+ extension.',
      classic: 'Classic InSIS look', classicText: 'Switch the InSIS+ look off on any page with Classic view at the bottom of the sidebar.',
      privacy: 'Privacy', privacyText: 'InSIS+ runs only in your browser and sends nothing anywhere.',
      requests: 'Requests to the study department (interrupting studies, recognition of courses, deadline extensions) follow your faculty’s instructions. Ask the study department or the contact centre.',
      background: 'Read data in the background', backgroundText: 'Timetable, results, submission boxes and materials load by themselves, at most every 3 hours.',
      shared: 'Shared computer', sharedText: 'Nothing is kept between visits (pins, settings, what you have seen).',
      clear: 'Clear stored data', clearText: 'Deletes everything InSIS+ stored, except the shared-computer choice.', clearButton: 'Clear', cleared: 'Cleared.',
      newFiles: (n) => `${n} new documents`, result: (c, n) => `Result: ${c} ${n}`, fresh: 'new', noNotifications: 'Nothing new yet.',
      notifHint: 'Notifications show what changed in InSIS. InSIS messages are under the envelope icon.',
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

  for (const dest of ['matters', 'campus', 'all', 'help', 'account']) {
    register(`dest.${dest}`, () => ({ title: nav.label(dest), build: () => groupedList(dest) }));
  }

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

  register('plus.settings', () => ({
    title: nav.label('plus'),
    build: () => {
      const plus = () => (ipx.state.plus ||= {});
      const status = h('p', { class: 'muted', role: 'status' });
      return h('div', { class: 'glist' },
        h('p', { class: 'muted' }, T.settingsLead),
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
