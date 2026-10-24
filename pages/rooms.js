// InSIS+ — Campus & people › Rooms (mistnosti/, every level). Treatment R (docs/ia/03-pages.md,
// teardowns/campus-messages-account.md §2.5). Uses pages/rebuild.js.
// InSIS shows four levels of the same two-column tables (campuses → buildings → rooms → details) with "Select" and
// "Details" icon columns, inside forms that have no field, a help line on every level, and a breadcrumb that puts
// Lecture rooms under Departments. Here: the path as the eyebrow (Rooms › Žižkov › Nová budova) and the level's name
// as the title; campuses and buildings as cards (teaching campuses first, external places and sports grounds in a
// second group), rooms as cards with their capacity, a room's or building's details as one card of facts. Beside the
// lists: the rooms of the student's classes this week (from the timetable already read); on a room, the classes the
// student has in it. Every link is InSIS's own address (URL rule). Nothing is stored or fetched.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.rb || !ipx.kit || !ipx.nav) return;
  const { lang, clean, norm } = ipx;
  const { h, icon, anchor, locale } = ipx.ui;
  const kit = ipx.kit;
  const nav = ipx.nav;
  const rb = ipx.rb;

  const T = {
    cs: { rooms: (n) => `${n} ${kit.plural(n, 'místnost', 'místnosti', 'místností')}`, teaching: 'Areály s výukou', other: 'Externí a ostatní místa',
      details: 'Podrobnosti', seats: (n) => `${n} míst`, find: 'Hledat místnost, budovu, pracoviště…', findPlace: 'Hledat…',
      mine: 'Vaše místnosti tento týden', mineLead: 'Z vašeho rozvrhu.', here: 'Máte tu výuku', facts: 'Údaje',
      buildings: 'Budovy', roomsTitle: 'Místnosti', open: 'Otevřít' },
    en: { rooms: (n) => `${n} ${n === 1 ? 'room' : 'rooms'}`, teaching: 'Teaching campuses', other: 'External and other places',
      details: 'Details', seats: (n) => `${n} seats`, find: 'Find a room, building, department…', findPlace: 'Find…',
      mine: 'Your rooms this week', mineLead: 'From your timetable.', here: 'You have classes here', facts: 'Details',
      buildings: 'Buildings', roomsTitle: 'Rooms', open: 'Open' },
  }[lang];

  const route = () => nav.route(document.baseURI.split('#')[0]);
  const col = (d, re) => d.head.findIndex((t) => re.test(norm(t)));
  const linkIn = (c) => { const a = c?.el.querySelector('a[href]'); return a ? kit.linkOf(a) : null; };

  // The path InSIS gives at the top of a level ("Campus: Žižkov", "Building: Nová budova", "Lecture room: NB 468").
  function path(page, tables) {
    const t = tables.find((x) => !x.querySelector('tr.zahlavi, thead') && rb.factsOf(x).length && rb.factsOf(x).length <= 3);
    return { el: t, parts: t ? rb.factsOf(t).map((p) => p.value) : [] };
  }

  // Rooms of this week's classes, with the room link the timetable gave (as on the Campus overview).
  function roomsThisWeek(now = new Date()) {
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
    const next = new Date(monday); next.setDate(monday.getDate() + 7);
    const rooms = new Map();
    for (const e of ipx.state.timetable?.events || []) {
      if (!e.room) continue;
      if (e.date) { const [y, m, d] = e.date.split('-').map(Number); const at = new Date(y, m - 1, d); if (at < monday || at >= next) continue; }
      const r = rooms.get(e.room) || { text: e.room, href: e.roomHref && nav.safe(e.roomHref, 'link', { copied: true }), codes: new Set(), events: [] };
      if (e.code) r.codes.add(e.code);
      r.events.push(e);
      rooms.set(e.room, r);
    }
    return [...rooms.values()].sort((a, b) => a.text.localeCompare(b.text, lang));
  }

  const roomRow = (r) => {
    const inner = h('span', {}, r.text, h('small', {}, [...r.codes].join(', ')));
    return r.href ? anchor({ href: r.href }, { class: 'rb-row' }, inner, icon('arrow')) : h('span', { class: 'rb-row' }, inner);
  };
  const mineCard = (list) => (list.length ? h('aside', { class: 'card pad rm-mine' }, h('h2', { class: 'card-title' }, T.mine),
    h('p', { class: 'muted small' }, T.mineLead), h('div', { class: 'rb-list' }, list.map(roomRow))) : null);

  const isOther = (name, code) => /extern|fiktiv|fictitious|sport|bazén|bazen|hřiště|hriste/i.test(`${name} ${code}`);

  // A list level: campuses, buildings or rooms, as cards.
  function listLevel(d, kind) {
    const ix = {
      code: col(d, /^(abbreviation|zkratka|building identification|identifikace budovy|identification|identifikace|oznaceni)$/),
      name: col(d, /^(name|nazev)$/), number: col(d, /^(number|cislo)$/), count: col(d, /^(number of|pocet)/), building: col(d, /^(building|budova)$/),
      dept: col(d, /^(department|pracoviste)$/), cap: col(d, /^(capacity|kapacita)$/), details: col(d, /^(details|podrobnosti)$/), select: col(d, /^(select|vyber|vstup)/),
    };
    const items = d.rows.filter((r) => r.cells.length >= 3).map((r) => {
      const c = (i) => (i >= 0 ? r.cells[i] : null);
      const code = c(ix.code)?.text || '';
      const name = c(ix.name)?.text || (kind === 'rooms' ? code : '');
      const open = linkIn(c(ix.select)) || (kind === 'rooms' ? linkIn(c(ix.details)) : null);
      const details = kind !== 'rooms' ? linkIn(c(ix.details)) : null;
      const count = Number(c(ix.count)?.text) || null;
      const cap = c(ix.cap)?.text;
      const sub = kind === 'rooms' ? [c(ix.number)?.text && c(ix.number).text !== code ? c(ix.number).text : '', c(ix.dept)?.text].filter(Boolean).join(' · ') : '';
      const body = [
        h('div', { class: 'rb-card-top' }, h('span', { class: 'rb-badge rm-badge' }, kind === 'rooms' ? icon('layout') : code || '·'),
          h('span', {}, h('strong', {}, kind === 'rooms' ? code || name : name), sub && h('small', {}, sub),
            count != null && h('small', {}, T.rooms(count)))),
        (cap || details) && h('div', { class: 'rm-meta' }, cap && h('span', { class: 'tag' }, T.seats(cap)),
          details && anchor({ href: details.href }, { class: 'rm-details' }, T.details)),
      ];
      // The card opens the next level (InSIS's Select link); Details stays a separate link inside it.
      const el = open && !details ? anchor(open, { class: 'rb-card rm-card' }, body)
        : h('section', { class: 'rb-card rm-card' + (open ? ' has-open' : '') }, open ? anchor(open, { class: 'rm-open', 'aria-label': `${T.open}: ${name || code}` }) : null, body);
      return { el, text: norm(clean(r.el.textContent)), other: kind === 'campuses' && isOther(name, code), count: count || 0 };
    });
    if (kind === 'campuses') {
      const teaching = items.filter((i) => !i.other).sort((a, b) => b.count - a.count);
      const other = items.filter((i) => i.other).sort((a, b) => b.count - a.count);
      return [teaching.length > 0 && rb.title(T.teaching), teaching.length > 0 && h('div', { class: 'rb-grid' }, teaching.map((i) => i.el)),
        other.length > 0 && rb.title(T.other), other.length > 0 && h('div', { class: 'rb-grid' }, other.map((i) => i.el))];
    }
    return [rb.longList(h('div', { class: 'rb-grid' }, items.map((i) => i.el)), items, { cap: 60, filterAt: 15, placeholder: kind === 'rooms' ? T.find : T.findPlace })];
  }

  ipx.ready.then(() => {
    const page = document.getElementById('str1');
    const r = route();
    if (!page || r.path !== '/auth/mistnosti/') return;
    const tables = [...page.querySelectorAll('table')].filter((t) => !t.closest('table.portal_menu'));
    const { el: pathTable, parts } = path(page, tables);
    const data = kit.findTables(page).filter((t) => t !== pathTable).map((t) => ({ t, d: kit.readTable(t) }));
    const detail = data.find((x) => x.d.head.length === 2 && x.d.rows.every((row) => row.cells.length === 2));
    const list = data.find((x) => x !== detail);
    const level = r.params.has('areal') && r.params.has('budova') ? 'rooms' : r.params.has('areal') && !r.params.has('budovapodrobne') ? 'buildings' : 'campuses';
    const label = nav.label('campus.rooms');
    // Eyebrow: Rooms › campus › building; title: the level's own name.
    const title = parts.at(-1)?.replace(/\s*[-–]\s*(details|podrobnosti)$/i, '') || label;
    const subtitle = [label, ...parts.slice(0, -1)].join(' › ');
    const mine = roomsThisWeek();
    let nodes;
    let hide = [];
    if (detail) {
      const pairs = detail.d.rows.map((row) => ({ label: row.cells[0].text.replace(/:\s*$/, ''), value: row.cells[1].text,
        links: [...row.cells[1].el.querySelectorAll('a[href]')].map((a) => rb.link(a)).filter(Boolean) })).filter((p) => p.value && !/^(not entered|nezadáno|nezadano)$/i.test(p.value));
      const number = pairs.find((p) => /^(number|číslo|cislo)$/i.test(p.label))?.value || '';
      const here = number && mine.find((m) => norm(m.text).replace(/\s+/g, '') === norm(number).replace(/\s+/g, ''));
      nodes = [
        here && h('p', { class: 'kit-note ok' }, icon('calendar'), h('span', {}, `${T.here}: `, [...here.codes].join(', '),
          here.events[0]?.date && ` · ${new Date(`${here.events[0].date}T${here.events[0].start || '00:00'}`).toLocaleString(locale, { weekday: 'short', hour: '2-digit', minute: '2-digit' })}`)),
        h('section', { class: 'card pad rb-facts' }, kit.facts(pairs)),
      ];
    } else if (list) {
      nodes = [h('div', { class: mine.length ? 'kit-cols' : 'kit-stack' }, h('div', { class: 'kit-stack' }, listLevel(list.d, level)), mineCard(mine))];
    } else {
      // Anything else: read as blocks; InSIS's action links (kept blocks) stay its own, in place, in the slot.
      const blocks = rb.blocks(page, { skip: rb.chrome(page) });
      hide = rb.redrawn(blocks);
      nodes = rb.render(blocks);
    }
    rb.frame({ key: 'rooms', css: 'pages/rooms.css', title, subtitle: parts.length ? subtitle : nav.label('campus'),
      slot: rb.hasSlot(nodes), kept: true, hide, build: () => nodes });
  });
})();
