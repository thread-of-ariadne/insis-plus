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
      nextDegree: 'Přihlášky ke studiu jsou v InSIS pod položkou Přihláška ke studiu na hlavní stránce (v klasickém zobrazení). InSIS+ je zatím neotevírá. Pokud si nejste jistí postupem, zeptejte se na studijním oddělení.' },
    en: { soon: 'This InSIS+ page is still being built.', open: 'Open in InSIS', settingsLead: 'Settings of the InSIS+ extension.',
      classic: 'Classic InSIS look', classicText: 'Switch the InSIS+ look off on any page with Classic view at the bottom of the sidebar.',
      privacy: 'Privacy', privacyText: 'InSIS+ runs only in your browser and sends nothing anywhere.',
      requests: 'Requests to the study department (interrupting studies, recognition of courses, deadline extensions) follow your faculty’s instructions. Ask the study department or the contact centre.',
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

  register('plus.settings', () => ({
    title: nav.label('plus'),
    build: () => h('div', { class: 'glist' },
      h('p', { class: 'muted' }, T.settingsLead),
      h('section', { class: 'card glist-note' }, h('strong', {}, T.classic), h('p', {}, T.classicText)),
      h('section', { class: 'card glist-note' }, h('strong', {}, T.privacy), h('p', {}, T.privacyText))),
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
})();
