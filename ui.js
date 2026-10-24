// InSIS+ — the app shell shared by every redesigned page: the sidebar with the seven destinations of the new
// structure (docs/ia/02-redesign.md), the top bar (search, messages, notifications, help, language, account),
// the destination's tabs, and the switch back to the classic page.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx) return;
  const { lang, clean, norm } = ipx;

  const T = {
    cs: { classic: 'Klasické zobrazení', back: 'Vzhled InSIS+', search: 'Hledat v InSIS…',
      menu: 'Menu', collapse: 'Sbalit panel',
      note: 'Neoficiální rozšíření. Data zůstávají ve vašem prohlížeči.', unpin: 'Odepnout',
      pinned: 'Připnuté', semester: 'Semestr', now: 'právě teď', teaching: 'Výuka tento týden',
      inMin: (n) => `za ${n} min`, inHours: (n) => `za ${n} h`, todayAt: 'dnes', creditsOf: (a, b) => `${a} z ${b} kreditů`, creditsN: (a) => `${a} kreditů`, nothingDue: 'Nic nečeká na odevzdání', tomorrowAt: 'zítra',
      inDays: (n) => (n < 5 ? `za ${n} dny` : `za ${n} dní`), navigation: 'Navigace', account: 'Účet',
      pageHelp: 'Nápověda k této stránce', allHelp: 'Veškerá nápověda' },
    en: { classic: 'Classic view', back: 'InSIS+ view', search: 'Search InSIS…',
      menu: 'Menu', collapse: 'Collapse sidebar',
      note: 'Unofficial extension. Your data stays in your browser.', unpin: 'Unpin',
      pinned: 'Pinned', semester: 'Semester', now: 'now', teaching: 'Teaching this week',
      inMin: (n) => `in ${n} min`, inHours: (n) => `in ${n} h`, todayAt: 'today', creditsOf: (a, b) => `${a} of ${b} credits`, creditsN: (a) => `${a} credits`, nothingDue: 'Nothing due', tomorrowAt: 'tomorrow',
      inDays: (n) => `in ${n} days`, navigation: 'Navigation', account: 'Account',
      pageHelp: 'Help for this page', allHelp: 'All help' },
  }[lang];

  // The places students use most: always visible in the sidebar ("Main"); home.js also uses them to spot the main page.
  // Matched against diacritic-free, lowercased link text in both languages.
  const MAIN = [
    { re: /portal studenta|student'?s portal/, icon: 'cap', desc: ['Studium, zkoušky, zápis', 'Studies, exams, registration'] },
    { re: /^rozvrh|^timetable/, icon: 'calendar', desc: ['Hodiny a místnosti', 'Classes and rooms'] },
    { re: /dokumentov\w* server|document server/, icon: 'file', desc: ['Materiály od vyučujících', 'Files from teachers'] },
    { re: /postovni schranka|^posta|mail ?box/, icon: 'mail', desc: ['Zprávy v InSIS', 'Messages in InSIS'] },
    { re: /elektronicke studijni materialy|electronic study materials/, icon: 'book', desc: ['Kurzy a podklady', 'Courses and handouts'] },
    { re: /testy a zkouseni|^testy|tests and exam/, icon: 'check', desc: ['Online testy', 'Online tests'] },
    { re: /osoby na vse|lide na vse|persons at vse/, icon: 'people', desc: ['Lidé a kontakty', 'People and contacts'] },
    { re: /studijni plany|study plans/, icon: 'list', desc: ['Předměty a požadavky', 'Courses and requirements'] },
  ];

  // What students come to the Student's portal for, in this order. Matched on the link's address (stable) rather
  // than its label. pages/student-portal.js stores the student's own links in ipx.state.portal.links[id], and the
  // dashboard and the sidebar use them. name, desc: [cs, en]
  const PORTAL_ACTIONS = [
    { id: 'exams', re: /terminy_seznam\.pl/, icon: 'check', name: ['Zkoušky', 'Exams'], desc: ['Termíny a přihlášení', 'Dates and registration'] },
    { id: 'enrol', re: /\/registrace\.pl/, icon: 'list', name: ['Zápis předmětů', 'Course registration'], desc: ['Zápis a změny po zápisu', 'Enrolment and changes'] },
    { id: 'timetable', re: /rozvrhy_view\.pl.*rozvrh_student/, icon: 'calendar', name: ['Můj rozvrh', 'My timetable'], desc: ['Vaše hodiny po týdnech', 'Your classes by week'] },
    { id: 'record', re: /pruchod_studiem\.pl/, icon: 'award', name: ['Výsledky', 'Study record'], desc: ['Známky a kredity', 'Grades and credits'] },
    { id: 'submissions', re: /odevzdavarny\.pl/, icon: 'file', name: ['Odevzdávárny', 'Submissions'], desc: ['Odevzdání prací', 'Hand-ins and deadlines'] },
    { id: 'plan', re: /studijni_povinnosti\.pl/, icon: 'layers', name: ['Kontrola plánu', 'Plan check'], desc: ['Co zbývá splnit', 'What is left to do'] },
  ];

  const ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1Z"/>',
    cap: '<path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15Z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
    check: '<path d="m9 11 3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    people: '<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6M16 4a4 4 0 0 1 0 8M22 21c0-3-2-5-4-5.5"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
    star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2L5.8 21 7 14.2 2 9.3l6.9-1Z"/>',
    layout: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    panel: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M16 10l-2 2 2 2"/>',
    burger: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    award: '<circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 8 5-3 5 3-1.5-8"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7Z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
    flask: '<path d="M9 3h6M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3"/><path d="M7 15h10"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>',
    phone: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>',
    cpu: '<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M9 9h6v6H9zM9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  };

  function h(tag, props = {}, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v);
    }
    el.append(...kids.flat(Infinity).filter((c) => c != null && c !== false));
    return el;
  }

  // SVG markup here is always our own constant or computed numbers, never page content; it is parsed as an
  // SVG document (not innerHTML) and imported.
  function svg(markup) {
    const doc = new DOMParser().parseFromString(markup.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"'), 'image/svg+xml');
    return document.importNode(doc.documentElement, true);
  }

  function icon(name) {
    return h('span', { class: 'icon', 'aria-hidden': 'true' }, svg(`<svg viewBox="0 0 24 24">${ICONS[name] || ICONS.layers}</svg>`));
  }

  const anchor = (link, props, ...kids) =>
    h('a', { href: link.href, target: link.target || null, rel: link.target ? 'noopener' : null, ...props }, ...kids);

  // "doc. Ing. Ota Novotný, Ph.D." → "ON": skip titles (words with a dot) and the degree after the comma.
  function initials(name) {
    const words = name.split(',')[0].split(/\s+/).filter((w) => w && !w.includes('.'));
    return words.slice(-2).map((w) => w[0]).join('').toUpperCase();
  }

  const LANG_CODES = { cesky: 'CS', english: 'EN', slovensky: 'SK' };

  // Language switch links of the original page (ČESKY / SLOVENSKY / ENGLISH).
  function langLinks() {
    return [...document.querySelectorAll('#vlajky a[href]')]
      .filter((a) => /^(cesky|english|slovensky)$/.test(norm(a.textContent)))
      .map((a) => ({ href: a.href, text: clean(a.textContent) }));
  }

  // ---------- navigation (docs/ia/02-redesign.md §2–3; data in nav-data.js) ----------

  const nav = () => ipx.nav;
  const DESTS = [
    { id: 'home', icon: 'home' },
    { id: 'courses', icon: 'book', first: 'courses.mine' },
    { id: 'schedule', icon: 'calendar', first: 'schedule.week' },
    { id: 'exams', icon: 'check', first: 'exams.mine' },
    { id: 'grades', icon: 'award', first: 'grades.results' },
    { id: 'matters', icon: 'file', landing: 'dest.matters' },
    { id: 'campus', icon: 'people', landing: 'dest.campus' },
  ];

  // Where this page sits in the new structure. Test pages carry the InSIS address in <base>, so the base URL
  // (plus the page's own hash) is the page's identity.
  function here() {
    if (!nav()) return { node: null, dest: null };
    const r = nav().route(document.baseURI.split('#')[0] + location.hash);
    // A page the mapping does not know (e.g. the page after a form was sent) keeps the place of the page before it.
    if (!r.node) {
      try {
        const last = JSON.parse(sessionStorage.getItem('ipx-last-node') || 'null');
        if (last && document.referrer && new URL(document.referrer).origin === location.origin) return { ...r, ...last, inherited: true };
      } catch {}
    } else {
      try { sessionStorage.setItem('ipx-last-node', JSON.stringify({ node: r.node, dest: r.dest })); } catch {}
    }
    return r;
  }

  function destHref(d) {
    if (d.id === 'home') return ipx.state.homeUrl || new URL('/auth/', document.baseURI).href;
    if (d.landing) return nav().composedUrl(d.landing);
    return nav().target(d.first) || nav().composedUrl(`dest.${d.id}`);
  }

  // Links for a list of nodes (a destination's tabs or grouped sections), leaving out nodes with no reachable page.
  function nodeLinks(nodes) {
    return nodes.map((n) => ({ node: n, href: nav().target(n), text: nav().label(n), gloss: nav().gloss(n) })).filter((l) => l.href);
  }

  function sidebar() {
    const where = here();
    const body = h('div', { class: 'nav-body' });

    const unpin = (href) => {
      const i = ipx.state.fav.indexOf(href);
      if (i >= 0) ipx.state.fav.splice(i, 1);
      ipx.save();
      render();
      pinListeners.forEach((fn) => fn());
    };

    function render() {
      const items = DESTS.map((d) => {
        const on = where.dest === d.id;
        return h('a', { class: 'nav-item has-icon' + (on ? ' active' : ''), href: destHref(d), title: nav().label(d.id),
          'aria-current': on ? 'page' : null }, icon(d.icon), h('span', { class: 'label' }, nav().label(d.id)));
      });
      const pinned = ipx.state.fav.map((url) => ipx.state.links[url] && { href: url, text: ipx.state.links[url].t }).filter(Boolean);
      body.replaceChildren(...[
        h('div', { class: 'dests' }, items),
        pinned.length > 0 && h('p', { class: 'side-label' }, T.pinned),
        pinned.map((l) => h('div', { class: 'nav-row' },
          anchor(l, { class: 'nav-item', title: l.text }, h('span', { class: 'label' }, l.text)),
          h('button', { class: 'pin on', type: 'button', title: T.unpin, 'aria-label': `${T.unpin}: ${l.text}`, onclick: () => unpin(l.href) }, icon('star')))),
      ].flat().filter(Boolean));
    }
    render();
    ipx.onData?.(render);
    onPinsChange(render);

    const allOn = where.dest === 'all';
    return h('aside', { class: 'side', 'aria-label': T.navigation },
      h('div', { class: 'side-head' },
        h('a', { class: 'brand', href: destHref(DESTS[0]) },
          h('span', { class: 'mark' }, 'VŠE'),
          h('span', { class: 'brand-name' }, 'InSIS', h('i', {}, '+'))),
        h('button', { class: 'icon-btn collapse', type: 'button', title: T.collapse, 'aria-label': T.collapse,
          onclick: () => setCollapsed(!ipx.state.sideCollapsed) }, icon('panel'))),
      h('nav', { class: 'side-nav' }, body),
      h('div', { class: 'side-foot' },
        h('a', { class: 'nav-item has-icon' + (allOn ? ' active' : ''), href: nav().composedUrl('dest.all'), 'aria-current': allOn ? 'page' : null },
          icon('layers'), h('span', { class: 'label' }, nav().label('all'))),
        h('button', { class: 'nav-item has-icon', type: 'button', onclick: () => setClassic(true) }, icon('layout'), h('span', { class: 'label' }, T.classic)),
        h('p', { class: 'side-note' }, T.note)));
  }

  // ---------- top bar ----------

  // A small menu that opens under its button (Help, avatar). Closes on Escape or a click outside.
  function popMenu(button, label, items) {
    const panel = h('div', { class: 'pop', role: 'menu', hidden: true }, items.filter(Boolean).map((it) =>
      it.href ? anchor(it, { class: 'pop-item' + (it.phone ? ' phone-only' : ''), role: 'menuitem', onclick: it.onclick }, it.icon && icon(it.icon), h('span', {}, it.text))
        : h('p', { class: 'pop-note' }, it.text)));
    const wrap = h('div', { class: 'pop-wrap' }, button, panel);
    button.setAttribute('aria-haspopup', 'menu');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', label);
    const close = () => { panel.hidden = true; button.setAttribute('aria-expanded', 'false'); };
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = panel.hidden;
      wrap.getRootNode().querySelectorAll?.('.pop').forEach((p) => { p.hidden = true; });
      panel.hidden = !open;
      button.setAttribute('aria-expanded', String(open));
    });
    wrap.addEventListener('keydown', (e) => { if (e.key === 'Escape') { close(); button.focus(); } });
    document.addEventListener('click', close);
    return wrap;
  }

  // InSIS's own links on this page, copied verbatim (Log out, the page's context help).
  const pageLink = (re) => [...document.querySelectorAll('a[href]')].find((a) => re.test(a.getAttribute('href')));

  function topBar(title, subtitle, extra) {
    const p = ipx.state.profile || {};
    const at = (path) => new URL(path, document.baseURI).href;
    const mail = nav().target('messages.mail');
    const logout = pageLink(/logout\.pl/)?.href || at('/auth/system/logout.pl');
    const help = pageLink(/help\.pl/);
    const unread = ipx.state.messages?.unread;
    const fresh = ipx.notifications?.unseen() || 0;

    const helpBtn = h('button', { class: 'chip-btn', type: 'button' }, h('b', { class: 'q' }, '?'));
    const avatarBtn = h('button', { class: 'avatar', type: 'button', title: p.name || T.account }, p.name ? initials(p.name) : icon('people'));

    return h('header', { class: 'topbar' },
      h('button', { class: 'icon-btn burger', type: 'button', 'aria-label': T.menu, onclick: () => shellEl.classList.toggle('drawer') }, icon('burger')),
      h('div', { class: 'titles' },
        subtitle && h('p', { class: 'eyebrow' }, subtitle),
        h('h1', {}, title)),
      h('div', { class: 'top-actions' },
        extra,
        h('button', { class: 'searchbox', type: 'button', onclick: () => ipx.open() },
          icon('search'), h('span', {}, T.search), h('kbd', {}, 'Ctrl K')),
        mail && h('a', { class: 'chip-btn', href: mail, title: nav().label('messages'), 'aria-label': unread ? `${nav().label('messages')}: ${unread}` : nav().label('messages') },
          icon('mail'), unread > 0 && h('span', { class: 'dot', 'aria-hidden': 'true' })),
        h('a', { class: 'chip-btn', href: nav().composedUrl('notifications'), title: nav().label('notifications'),
          'aria-label': fresh ? `${nav().label('notifications')}: ${fresh}` : nav().label('notifications') },
          icon('bell'), fresh > 0 && h('span', { class: 'dot', 'aria-hidden': 'true' })),
        popMenu(helpBtn, nav().label('help'), [
          { href: nav().target('campus.office'), text: nav().label('campus.office'), icon: 'people' },
          { href: nav().target('help.ask'), text: nav().label('help.ask'), icon: 'mail' },
          help && { href: help.href, target: '_blank', text: T.pageHelp, icon: 'info' },
          { href: nav().composedUrl('dest.help'), text: T.allHelp, icon: 'book' },
        ].filter((x) => !x || x.href)),
        h('span', { class: 'langs' }, langLinks().map((l) => anchor(l, { class: 'lang', title: l.text }, LANG_CODES[norm(l.text)] || l.text.slice(0, 2)))),
        popMenu(avatarBtn, nav().label('account'), [
          p.name && { text: p.name },
          { href: nav().composedUrl('dest.account'), text: nav().label('account'), icon: 'gear' },
          nav().safe(at('/auth/system/zmena_hesla.pl')) && { href: at('/auth/system/zmena_hesla.pl'), text: nav().label('password'), icon: 'shield' },
          { href: nav().composedUrl('plus.settings'), text: nav().label('plus'), icon: 'layout' },
          ...langLinks().map((l) => ({ ...l, icon: 'globe', phone: true })),
          // Personal data goes before InSIS logs out (principle 8).
          { href: logout, text: nav().label('logout'), icon: 'back', onclick: () => ipx.wipe() },
        ])));
  }

  // Phones: the four most used destinations and Menu (the sidebar as a drawer) at the bottom (docs/ia/02-redesign.md §2).
  function bottomBar() {
    const where = here();
    const items = ['home', 'courses', 'exams', 'grades'].map((id) => DESTS.find((d) => d.id === id));
    return h('nav', { class: 'bottom-bar', 'aria-label': T.navigation },
      items.map((d) => h('a', { href: destHref(d), class: where.dest === d.id ? 'on' : null, 'aria-current': where.dest === d.id ? 'page' : null },
        icon(d.icon), h('span', {}, nav().shortLabel(d.id)))),
      h('button', { type: 'button', onclick: () => shellEl.classList.toggle('drawer') }, icon('burger'), h('span', {}, nav().shortLabel('menu'))));
  }

  // The destination's tabs under the top bar (links, the current one marked); none on pages without tabs.
  function tabRow() {
    const where = here();
    const list = nav().tabs[where.dest];
    if (!Array.isArray(list) || where.node?.startsWith('course.')) return null;
    const links = nodeLinks(list);
    if (links.length < 2) return null;
    return h('nav', { class: 'dest-tabs', 'aria-label': nav().label(where.dest) },
      links.map((l) => h('a', { href: l.href, class: l.node === where.node ? 'on' : null, 'aria-current': l.node === where.node ? 'page' : null }, l.text)));
  }

  // ---------- page takeover ----------

  let shellEl = null;
  let setClassic = () => {};
  let setCollapsed = () => {};

  // Replaces the original page with the InSIS+ shell rendered in a closed shadow root.
  // `slotted` nodes stay in the light DOM (so InSIS's own scripts and forms keep working) and show in the content area.
  function takeover({ key, css, title, subtitle, extra, build, slotted }) {
    // In the hidden background-sync frame, modules only store their data.
    if (ipx.syncOnly) return null;
    if (!document.getElementById('insis-plus-takeover-style')) {
      const style = h('style', { id: 'insis-plus-takeover-style' });
      style.textContent = `
        html.ipx-takeover body > :not(#insis-plus-page):not(#insis-plus-root) { display: none !important; }
        html.ipx-takeover body { margin: 0; background: #f2f4f8; }
        @media (prefers-color-scheme: dark) { html.ipx-takeover:not([data-ipx-theme="light"]) body { background: #0c0e13; } }
        html.ipx-takeover[data-ipx-theme="dark"] body { background: #0c0e13; }`;
      document.head.append(style);
      // Fonts must be declared in the document; shadow roots then use them. Bricolage needs its width axis.
      document.head.append(h('link', { rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,200..800&family=Figtree:wght@400..800&display=swap' }));
    }
    // InSIS pages have no viewport tag, so phones render them 980px wide and zoomed out.
    if (!document.querySelector('meta[name="viewport"]')) {
      document.head.append(h('meta', { name: 'viewport', content: 'width=device-width, initial-scale=1' }));
    }

    const host = h('div', { id: 'insis-plus-page', 'data-ipx-host': '' });
    const root = host.attachShadow({ mode: 'closed' });
    const isClassic = () => !!(typeof ipx.state.classic === 'object' && ipx.state.classic?.[key]);
    // Classic view means the original look too, so the slotted-content styles switch off with it.
    const usesGeneric = document.documentElement.classList.contains('ipx-generic');

    setClassic = (on) => {
      if (typeof ipx.state.classic !== 'object' || !ipx.state.classic) ipx.state.classic = {};
      ipx.state.classic[key] = on;
      ipx.save();
      apply();
    };
    setCollapsed = (on) => {
      ipx.state.sideCollapsed = on;
      ipx.save();
      shellEl.classList.toggle('collapsed', on);
    };

    shellEl = h('div', { class: 'shell' + (ipx.state.sideCollapsed ? ' collapsed' : '') });
    shellEl.append(
      sidebar(),
      h('div', { class: 'scrim', onclick: () => shellEl.classList.remove('drawer') }),
      h('div', { class: 'main' },
        topBar(title, subtitle, extra),
        tabRow(),
        h('main', { class: 'content' }, build ? build() : null, slotted ? h('slot') : null)),
      bottomBar());
    const pill = h('button', { class: 'pill', type: 'button', onclick: () => setClassic(false) }, icon('layout'), T.back);

    const sharedCss = h('link', { rel: 'stylesheet', href: chrome.runtime.getURL('shared.css') });
    sharedCss.addEventListener('load', () => requestAnimationFrame(() => shellEl.classList.add('ready')));
    root.append(
      ...[
        sharedCss,
        css && h('link', { rel: 'stylesheet', href: chrome.runtime.getURL(css) }),
        shellEl,
        pill,
      ].filter(Boolean),
    );
    // Remember where slotted nodes came from, before apply() moves them into the shell.
    slotted?.forEach((n) => {
      n._ipxHome = document.createComment('insis-plus');
      n.before(n._ipxHome);
    });
    document.body.prepend(host);
    ipx.applyTheme?.();

    function apply() {
      const classic = isClassic();
      // Slotted nodes were moved out of their place; in classic view they go back.
      if (slotted) {
        if (classic) slotted.forEach((n) => n._ipxHome?.before(n));
        else host.append(...slotted);
      }
      document.documentElement.classList.toggle('ipx-takeover', !classic);
      if (usesGeneric) document.documentElement.classList.toggle('ipx-generic', !classic);
      shellEl.hidden = classic;
      pill.hidden = !classic;
      ipx.setFab(classic);
      window.scrollTo(0, 0);
    }
    apply();
    return root;
  }

  // ---------- course covers ----------

  // Pastel ground + ink per VŠE faculty; unknown faculties get the InSIS+ blue.
  const FACULTY = {
    FFU: ['#E3E0FB', '#4C3FC9'],
    FMV: ['#FBE6CC', '#C9761E'],
    FPH: ['#DDF0E6', '#1F8A55'],
    FIS: ['#FCE3E1', '#C8352B'],
    NF: ['#DCEBF7', '#2A6FB0'],
    FM: ['#F5E1EF', '#A23B82'],
  };
  const facultyOf = (text) => (clean(text).toUpperCase().match(/\b(FFU|FMV|FPH|FIS|NF|FM)\b/) || [])[1] || '';
  const facultyColors = (fac) => FACULTY[fac] || ['#E6E9F8', '#2F45D1'];
  // VŠE course codes start with the faculty's number: 4XY101 → FIS. A naming convention, not page data.
  const FACULTY_BY_DIGIT = { 1: 'FFU', 2: 'FMV', 3: 'FPH', 4: 'FIS', 5: 'NF', 6: 'FM' };
  const facultyFromCode = (code) => FACULTY_BY_DIGIT[String(code || '')[0]] || '';
  // Best guess for a course: what a syllabus page told us, then a faculty named in the text, then the code.
  const facultyFor = (code, text = '') =>
    Object.values(ipx.state.courses || {}).find((c) => c.code === code)?.faculty || facultyOf(text) || facultyFromCode(code);

  // A cover drawn from the course code: the same code always gives the same picture of "bursts"
  // (rays from a centre), so every course is recognisable at a glance without any images.
  function cover(code, fac, W = 150, H = 108) {
    let seed = 0;
    for (const ch of code || '?') seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
    const [bg, ink] = facultyColors(fac);
    const bursts = [];
    const n = 1 + Math.floor(rnd() * 3);
    for (let i = 0; i < n; i++) {
      const big = i === 0;
      const cx = (big ? 0.3 + rnd() * 0.25 : 0.65 + rnd() * 0.25) * W;
      const cy = (0.25 + rnd() * 0.5) * H;
      const r = (big ? 0.34 + rnd() * 0.12 : 0.12 + rnd() * 0.1) * Math.min(W, H) * 1.2;
      const rays = [6, 8, 12, 16][Math.floor(rnd() * 4)];
      const turn = rnd() * Math.PI;
      let d = '';
      for (let k = 0; k < rays; k++) {
        const a = turn + (k / rays) * Math.PI * 2;
        d += `M${cx.toFixed(1)} ${cy.toFixed(1)}L${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`;
      }
      const ring = big && rnd() > 0.5 ? `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(r * 0.45).toFixed(1)}"/>` : '';
      bursts.push(`<g stroke="#2a2a3a" stroke-opacity=".75" stroke-width="1" fill="none"><path d="${d}"/>${ring}</g>` +
        `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${big ? 3 : 2}" fill="${ink}"/>`);
    }
    return h('span', { class: 'cover', 'aria-hidden': 'true' },
      svg(`<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"><rect width="${W}" height="${H}" fill="${bg}"/>${bursts.join('')}</svg>`));
  }

  // ---------- shared components (documented in docs/agents.md) ----------

  const locale = lang === 'cs' ? 'cs-CZ' : 'en-GB';
  const DAYS = lang === 'cs' ? ['PO', 'ÚT', 'ST', 'ČT', 'PÁ', 'SO', 'NE'] : ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

  // KPI card: label and optional status badge on top, a big narrow number (or short text) below.
  // status: { tone: 'ok' | 'bad' | 'warn' | 'neutral', text }
  function kpi({ label, value, unit, status, foot, href, isText }) {
    if (value == null || value === '') return null;
    const body = [
      h('div', { class: 'kpi-top' }, h('span', {}, label), status && h('span', { class: `delta ${status.tone}` }, status.text)),
      h('div', { class: 'num' + (isText ? ' text' : '') }, String(value), unit && h('small', {}, unit)),
      foot && h('div', { class: 'kpi-foot' }, foot),
    ];
    return href ? h('a', { class: 'card kpi link-card', href }, body) : h('div', { class: 'card kpi' }, body);
  }

  // Big section title with an optional "see all" link on the right.
  const sectionHead = (title, link, ...extra) =>
    h('div', { class: 'section-head' }, h('div', {}, h('h2', { class: 'section-title' }, title), extra),
      link && anchor(link, { class: 'more' }, link.text));

  // Text tabs with a dot under the active one. items: [{ id, label }]
  const tabs = (items, active, onPick) =>
    h('div', { class: 'tabs', role: 'group' }, items.map((t) =>
      h('button', { type: 'button', class: 'tab' + (t.id === active ? ' on' : ''), 'aria-pressed': String(t.id === active),
        onclick: () => onPick(t.id) }, t.label)));

  // Dashed box for "nothing here yet", with an optional link.
  const emptyState = (text, link) =>
    h('div', { class: 'empty' }, h('p', {}, text), link && anchor(link, { class: 'more' }, link.text));

  // Warm notice bar linking somewhere.
  const notice = (link) => anchor(link, { class: 'notice' }, icon('alert'), h('span', {}, link.text), icon('arrow'));

  // Course card. c: { href, code, faculty, name, aims, tags: [], semester, ects }
  function courseCard(c) {
    return h('a', { class: 'card course', href: c.href },
      cover(c.code, c.faculty),
      h('span', { class: 'course-body' },
        h('span', { class: 'course-code', style: `color: ${facultyColors(c.faculty)[1]}` }, [c.code, c.faculty].filter(Boolean).join(' · ')),
        h('strong', { class: 'course-name' }, c.name),
        c.aims && h('span', { class: 'course-desc' }, c.aims),
        h('span', { class: 'tags' }, (c.tags || []).filter(Boolean).map((t) => h('span', { class: 'tag' }, t)))),
      h('span', { class: 'course-side' },
        c.semester && h('span', { class: 'course-term' }, T.semester, h('b', {}, c.semester)),
        c.ects && h('span', { class: 'course-num' }, c.ects, h('small', {}, 'ECTS'))));
  }

  // Monday–Sunday strip of the week containing `date`; today is raised. marks: day indexes 0–6 with a dot.
  function weekStrip(date = new Date(), marks = []) {
    const monday = new Date(date);
    monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    const month = date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
    const today = new Date().toDateString();
    return h('section', { class: 'week' },
      h('div', { class: 'week-head' }, h('b', {}, month.charAt(0).toUpperCase() + month.slice(1))),
      h('div', { class: 'days' }, DAYS.map((name, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const isToday = d.toDateString() === today;
        return h('span', { class: 'day' + (isToday ? ' today' : '') + (i >= 5 ? ' weekend' : ''), 'aria-current': isToday ? 'date' : null },
          name, h('b', {}, String(d.getDate())), (isToday || marks.includes(i)) && h('i', { 'aria-hidden': 'true' }));
      })));
  }

  // Timetable events (as stored by pages/timetable.js in ipx.state.timetable.events):
  // { date: 'YYYY-MM-DD' | null, weekday: 0–6 (Mon=0), start: 'HH:MM', end: 'HH:MM', code, name, type, room, … }
  const at = (date, time) => {
    const [y, m, d] = date.split('-').map(Number);
    const [hh, mm] = time.split(':').map(Number);
    return new Date(y, m - 1, d, hh, mm);
  };
  const minutes = (e) => { const [a, b] = [e.start, e.end].map((t) => t.split(':').map(Number)); return (b[0] - a[0]) * 60 + b[1] - a[1]; };
  const hm = (min) => (min % 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min / 60} h`);

  // Next classes, soonest first; the first one is filled dark. Returns null when there is nothing ahead.
  function nextClasses(events, href, n = 3, now = new Date()) {
    const list = (events || []).filter((e) => e.date && at(e.date, e.end) > now)
      .sort((a, b) => at(a.date, a.start) - at(b.date, b.start)).slice(0, n);
    if (!list.length) return null;
    return h('div', { class: 'next-list' }, list.map((e, i) => {
      const start = at(e.date, e.start);
      return h('a', { class: 'next-row' + (i === 0 ? ' first' : ''), href },
        h('span', { class: 'next-day' }, h('b', {}, String(start.getDate())), h('small', {}, DAYS[e.weekday ?? (start.getDay() + 6) % 7])),
        h('span', { class: 'next-sep' }),
        h('span', { class: 'next-body' }, h('strong', {}, e.name || e.code), h('small', {}, [e.code, e.type, e.room].filter(Boolean).join(' · '))),
        h('span', { class: 'next-time' }, start <= now ? T.now : `${e.start} – ${e.end}`));
    }));
  }

  // Teaching hours per weekday of the week containing `date`, today highlighted. Null when that week is empty.
  function hoursChart(events, date = new Date()) {
    const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - ((date.getDay() + 6) % 7));
    const per = [0, 0, 0, 0, 0, 0, 0];
    for (const e of events || []) {
      if (!e.date) continue;
      const i = Math.floor((at(e.date, '00:00') - monday) / 864e5);
      if (i >= 0 && i < 7) per[i] += minutes(e);
    }
    const total = per.reduce((s, m) => s + m, 0);
    if (!total) return null;
    const max = Math.max(...per);
    const today = new Date().toDateString() === date.toDateString() ? (date.getDay() + 6) % 7 : -1;
    return h('section', { class: 'card hours' },
      h('div', { class: 'card-head' }, h('h2', {}, T.teaching), h('span', { class: 'more' }, hm(total))),
      h('div', { class: 'hbars', role: 'img', 'aria-label': per.map((m, i) => `${DAYS[i]} ${m ? hm(m) : 0}`).join(', ') },
        per.map((m, i) => h('span', { class: 'hbar-col' + (i === today ? ' today' : '') },
          h('span', { class: 'hbar' + (m ? '' : ' zero'), style: `height: ${m ? Math.max(6, (m / max) * 100) : 4}%` })))),
      h('div', { class: 'hbar-labels' }, DAYS.map((d, i) => h('span', { class: i === today ? 'today' : null }, d))));
  }

  // Indexes (Mon=0) of days in the week containing `date` that have classes, for weekStrip() marks.
  function classDays(events, date = new Date()) {
    const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - ((date.getDay() + 6) % 7));
    return [...new Set((events || []).filter((e) => e.date).map((e) => Math.floor((at(e.date, '00:00') - monday) / 864e5))
      .filter((i) => i >= 0 && i < 7))];
  }

  // Tabs that are links (InSIS's portal_menu rows): items [{ href, text, on, count }]. Same look as tabs().
  const linkTabs = (items, label) =>
    h('nav', { class: 'tabs link-tabs', 'aria-label': label || null }, items.map((t) =>
      anchor(t, { class: 'tab' + (t.on ? ' on' : ''), 'aria-current': t.on ? 'page' : null },
        t.text, t.count != null && h('b', { class: 'tab-count' }, String(t.count)))));

  // ---------- deadlines ----------

  const pad2 = (n) => String(n).padStart(2, '0');
  // A deadline at 00:00 reads as 24:00 of the day before.
  function wallTime(d) {
    if (d.getHours() === 0 && d.getMinutes() === 0) {
      const x = new Date(d);
      x.setDate(x.getDate() - 1);
      return { day: x, time: '24:00' };
    }
    return { day: d, time: `${pad2(d.getHours())}:${pad2(d.getMinutes())}` };
  }
  const dayStart = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  // "in 40 min", "in 2 h · 23:59", "today 23:59", "tomorrow 12:00", "in 4 days"
  function countdown(target, now = new Date()) {
    const ms = target - now;
    const w = wallTime(target);
    const days = Math.round((dayStart(w.day) - dayStart(now)) / 864e5);
    if (ms < 3600e3) return T.inMin(Math.max(1, Math.ceil(ms / 60e3)));
    if (days <= 0) return ms < 6 * 3600e3 ? `${T.inHours(Math.ceil(ms / 3600e3))} · ${w.time}` : `${T.todayAt} ${w.time}`;
    if (days === 1) return `${T.tomorrowAt} ${w.time}`;
    return T.inDays(days);
  }
  // Red under 36 hours, amber within a week, green once something is handed in.
  const deadlineTone = (closes, submitted, now = new Date()) =>
    submitted ? 'ok' : closes - now < 36 * 3600e3 ? 'bad' : closes - now < 7 * 864e5 ? 'warn' : 'neutral';

  // Open submission boxes with nothing handed in yet, soonest first (ipx.state.submissions.boxes).
  function deadlineList(boxes, n = 3, now = new Date()) {
    const parse = (s) => (s ? new Date(s) : null);
    const list = (boxes || []).map((b) => ({ ...b, at: parse(b.closes), from: parse(b.opens) }))
      .filter((b) => b.at && b.at > now && (!b.from || b.from <= now) && b.submitted !== true)
      .sort((a, b) => a.at - b.at).slice(0, n);
    if (!list.length) return null;
    return h('div', { class: 'next-list' }, list.map((b, i) => {
      const w = wallTime(b.at);
      return h('a', { class: 'next-row' + (i === 0 ? ' first' : ''), href: b.href },
        h('span', { class: 'next-day' }, h('b', {}, String(w.day.getDate())), h('small', {}, DAYS[(w.day.getDay() + 6) % 7])),
        h('span', { class: 'next-sep' }),
        h('span', { class: 'next-body' }, h('strong', {}, b.title || b.name), h('small', {}, [b.code, b.name].filter(Boolean).join(' · '))),
        h('span', { class: `delta ${deadlineTone(b.at, b.submitted, now)}` }, countdown(b.at, now)));
    }));
  }

  // ---------- the portal's main actions ----------

  // One live line per action when the data is there: the next class, credits, the nearest deadline.
  function actionInfo(id, now = new Date()) {
    const s = ipx.state;
    if (id === 'timetable' && s.timetable) {
      const e = (s.timetable.events || []).filter((x) => x.date && at(x.date, x.end) > now)
        .sort((a, b) => at(a.date, a.start) - at(b.date, b.start))[0];
      if (e) {
        const start = at(e.date, e.start);
        return { text: `${start <= now ? T.now : countdown(start, now)} · ${e.code || e.name}` };
      }
    }
    if (id === 'record' && s.studyRecord?.credits?.earned != null) {
      const c = s.studyRecord.credits;
      return { text: c.registered != null ? T.creditsOf(c.earned, c.registered) : T.creditsN(c.earned) };
    }
    if (id === 'submissions' && s.submissions) {
      const b = (s.submissions.boxes || []).map((x) => ({ ...x, at: x.closes && new Date(x.closes), from: x.opens && new Date(x.opens) }))
        .filter((x) => x.at && x.at > now && (!x.from || x.from <= now) && x.submitted !== true)
        .sort((a, c) => a.at - c.at)[0];
      return b ? { text: `${countdown(b.at, now)} · ${b.code || b.title}`, tone: deadlineTone(b.at, false, now) } : { text: T.nothingDue };
    }
    return null;
  }

  // The Student's portal main actions as labelled cards (dashboard and portal). `links` maps PORTAL_ACTIONS ids to
  // the student's own links (ipx.state.portal.links); actions without a link are left out.
  function quickActions(links) {
    const i = lang === 'cs' ? 0 : 1;
    const cards = PORTAL_ACTIONS.filter((a) => links?.[a.id]).map((a) => {
      const info = actionInfo(a.id);
      return anchor(links[a.id], { class: 'card qa', title: links[a.id].text || a.name[i] },
        h('span', { class: 'qa-icon' }, icon(a.icon)),
        h('span', { class: 'qa-text' },
          h('strong', {}, a.name[i]),
          h('small', { class: info?.tone ? `qa-info ${info.tone}` : null }, info?.text || a.desc[i])),
        h('span', { class: 'qa-go' }, icon('arrow')));
    });
    return cards.length ? h('div', { class: 'qa-grid' }, cards) : null;
  }

  // ---------- keeping part of the original page ----------

  // Hide everything in `page` except `node` (and the path down to it) while InSIS+ is on; classic view shows the
  // whole page untouched. Loose text along the path is shrunk away. `node` gets the card look from generic.css.
  function keepOnly(page, node) {
    for (let n = node; n && n !== page; n = n.parentElement) {
      n.parentElement.setAttribute('data-ipx-keep', 'path');
      for (const sib of n.parentElement.children) if (sib !== n && !sib.hasAttribute('data-ipx-keep')) sib.setAttribute('data-ipx-keep', 'hide');
    }
    node.setAttribute('data-ipx-keep', 'node');
    document.documentElement.classList.add('ipx-keep');
  }
  // Hide nodes the page module already shows in its own way (the rest of the slotted original stays visible).
  function hideInSlot(nodes) {
    nodes.forEach((n) => n.setAttribute('data-ipx-keep', 'hide'));
    document.documentElement.classList.add('ipx-keep');
  }

  // Original InSIS content that stays in the page (slotted into the shell) gets the shared look from generic.css,
  // plus an optional page stylesheet for what is specific to that page.
  function styleSlotted(pageCss) {
    if (ipx.syncOnly) return;
    document.documentElement.classList.add('ipx-generic');
    for (const file of ['generic.css', pageCss].filter(Boolean)) {
      if (document.querySelector(`link[data-ipx="${file}"]`)) continue;
      document.head.append(h('link', { rel: 'stylesheet', href: chrome.runtime.getURL(file), 'data-ipx': file }));
    }
  }

  const pinListeners = [];
  const onPinsChange = (fn) => pinListeners.push(fn);

  ipx.ui = {
    PORTAL_ACTIONS, quickActions, here, nodeLinks, h, icon, anchor, initials, langLinks, takeover, styleSlotted, onPinsChange,
    cover, facultyOf, facultyColors,
    facultyFromCode, facultyFor, linkTabs, wallTime, countdown, deadlineTone, deadlineList, keepOnly, hideInSlot,
    kpi, sectionHead, tabs, emptyState, notice, courseCard, weekStrip, nextClasses, hoursChart, classDays,
    T, MAIN, locale,
  };
})();
