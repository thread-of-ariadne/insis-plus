// InSIS+ — Campus & people › People: a person's page (lide/clovek.pl), and About VŠE › Graduates (lide/absolventi.pl).
// Treatment R (docs/ia/03-pages.md, teardowns/campus-messages-account.md §2.2). Uses pages/rebuild.js.
//
// Person: InSIS shows a help line, a layout table with the photo, name, identification number, university e-mail and
// positions, a row of up to ten tabs in InSIS's order (research before teaching), another help line, the tab's
// content (Contacts: label/value rows) and a row of icon links (vCard export: a download; "Import person to postal
// contacts": a GET that changes data). Here: the name as the title (eyebrow People) on every tab; page action
// "Write in InSIS" (InSIS's own message link, posta/nova_zprava.pl; a mailto: is only an "E-mail" action); one row of view tabs by frequency (Contacts ·
// Teaching · Supervised theses · Final thesis · Publications · More), each InSIS's own tab link; Contacts as a card
// (positions with their departments, office, phone, e-mail) with the consulting hours set apart, and beside it the
// courses of this semester the student has with this person (from the timetable already read). Other tabs: their
// tables and lists drawn again; a form (Export to Excel) stays InSIS's own in a form card. The icon row's action links
// stay InSIS's own, in place, styled as chips (on Contacts under the contact card).
//
// Graduates: InSIS's single-tab row is dropped (a row of one tab says nothing); the faculties as cards, a faculty's
// years as chips, the filter form of a year as a form card.
// Nothing is stored or fetched.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.rb || !ipx.kit || !ipx.nav) return;
  const { lang, clean, norm } = ipx;
  const { h, icon, anchor, initials } = ipx.ui;
  const kit = ipx.kit;
  const nav = ipx.nav;
  const rb = ipx.rb;

  const T = {
    cs: { write: 'Napsat v InSIS', email: 'E-mail', more: 'Další', teaching: 'Výuka', hours: 'Konzultační hodiny', contacts: 'Kontakt', positions: 'Pracovní zařazení',
      yours: 'Máte u tohoto vyučujícího', yoursLead: 'Z vašeho rozvrhu v tomto semestru.', id: 'Identifikační číslo', mail: 'Univerzitní e-mail',
      graduates: 'Absolventi', chooseFaculty: 'Vyberte fakultu nebo součást; pak rok absolvování.', chooseYear: 'Vyberte rok absolvování.',
      allYears: 'Všechny roky', gradLead: 'Upřesněte seznam; InSIS ho zobrazí, až stisknete Zobrazit.', faculty: 'Fakulta', views: 'Části stránky osoby',
      formLead: 'Formulář InSIS: provede se, až stisknete jeho tlačítko.' },
    en: { write: 'Write in InSIS', email: 'E-mail', more: 'More', teaching: 'Teaching', hours: 'Consulting hours', contacts: 'Contact', positions: 'Positions',
      yours: 'You have this teacher in', yoursLead: 'From your timetable this semester.', id: 'Identification number', mail: 'University e-mail',
      graduates: 'Graduates', chooseFaculty: 'Choose a faculty or unit, then the year of graduation.', chooseYear: 'Choose the year of graduation.',
      allYears: 'All years', gradLead: 'Narrow the list; InSIS displays it when you press Display.', faculty: 'Faculty', views: 'Parts of the person page',
      formLead: 'InSIS’s form: it runs when you press its button.' },
  }[lang];

  const route = () => nav.route(document.baseURI.split('#')[0]);

  // ---------- person: header block ----------

  // The layout table above the tab row: photo, then a nested table of lines (name, id, e-mail, positions).
  function headBlock(page) {
    const menu = page.querySelector('table.portal_menu[data-pm-selected]') || [...page.querySelectorAll('table.portal_menu')].find((t) => !t.querySelector('a[href*="moje_studium.pl"]'));
    const table = [...page.querySelectorAll('table')].find((t) => t !== menu && t.querySelector('font[size="+1"], b font') && !t.closest('table.portal_menu'));
    if (!table) return null;
    const lines = [...table.querySelectorAll('table td')].filter((td) => !td.querySelector('table'));
    const name = clean(table.querySelector('b font, font[size="+1"], b')?.textContent);
    let id = '';
    let mail = null;
    const positions = [];
    for (const td of lines) {
      const text = kit.cellText(td);
      if (!text || text === name) continue;
      const a = td.querySelector('a[href]');
      if (/^(identification number|identifikační číslo|identifikacni cislo)/i.test(text)) id = text.split(':').pop().trim();
      else if (/^(university e-mail|univerzitní e-mail|e-mail)/i.test(text)) mail = { text: clean(a?.textContent || text.split(':').pop()), link: a && rb.link(a) };
      else positions.push({ text, link: a && !/nova_zprava/.test(a.getAttribute('href')) ? rb.link(a) : null, role: clean(text.split(/\s[-–]\s/)[0]) });
    }
    return { table, menu, name, id, mail, positions };
  }

  // InSIS's tab row → view tabs by frequency; tabs past the fifth go under More. Keys are InSIS's zalozka values.
  const ORDER = ['1', '3', '13', '7', '5', '4', '11', '6', '2', '14'];
  function tabs(menu) {
    if (!menu) return null;
    const selected = menu.getAttribute('data-pm-selected') || '1';
    const all = [...menu.querySelectorAll('td[data-pm-sysid]')].map((td) => {
      const a = td.querySelector('a[href]');
      const href = a && nav.safe(a.href, 'link', { copied: true });
      const key = td.getAttribute('data-pm-sysid');
      const text = /^(lesson|výuka|vyuka)$/i.test(clean(a?.textContent)) ? T.teaching : clean(a?.textContent);
      return href && { key, href, text, on: key === selected };
    }).filter(Boolean).sort((a, b) => (ORDER.indexOf(a.key) + 99) % 99 - (ORDER.indexOf(b.key) + 99) % 99);
    if (all.length < 2) return null;
    let main = all.slice(0, all.length > 6 ? 5 : 6);
    const rest = all.slice(main.length);
    const current = rest.find((t) => t.on);
    if (current) main = [...main, current];
    const others = rest.filter((t) => !t.on);
    const nav_ = h('nav', { class: 'view-tabs psn-tabs', 'aria-label': T.views },
      main.map((t) => h('a', { href: t.href, class: t.on ? 'on' : null, 'aria-current': t.on ? 'page' : null }, t.text)));
    if (others.length) {
      const menuEl = h('div', { class: 'psn-more-menu', role: 'menu' }, others.map((t) => h('a', { href: t.href, role: 'menuitem' }, t.text)));
      const btn = h('button', { type: 'button', class: 'psn-more', 'aria-expanded': 'false', 'aria-haspopup': 'true' }, T.more, icon('chevron'));
      const wrap = h('div', { class: 'psn-more-wrap' }, btn, menuEl);
      const close = () => { wrap.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); };
      btn.addEventListener('click', (e) => { e.stopPropagation(); const open = !wrap.classList.contains('open'); wrap.classList.toggle('open', open); btn.setAttribute('aria-expanded', String(open)); });
      wrap.addEventListener('keydown', (e) => { if (e.key === 'Escape') { close(); btn.focus(); } });
      document.addEventListener('click', close);
      wrap.addEventListener('focusout', (e) => { if (!wrap.contains(e.relatedTarget)) close(); });
      nav_.append(wrap);
    }
    return { node: nav_, selected };
  }

  // The student's own courses with this person, from the timetable (matched on the person link's id, else name).
  function mine(name, id) {
    const all = ipx.composed?.teachers?.() || [];
    const byId = id && all.find((p) => p.href && new RegExp(`[?;]id=${id}(\\D|$)`).test(p.href));
    const plainName = (s) => norm(s.split(',')[0].split(/\s+/).filter((w) => w && !w.includes('.')).join(' '));
    return byId || all.find((p) => plainName(p.text) && plainName(name).endsWith(plainName(p.text).split(' ').pop()) && plainName(name).includes(plainName(p.text).split(' ')[0]));
  }

  // ---------- person: Contacts ----------

  function contacts(page, hd) {
    const table = [...page.querySelectorAll('table')].find((t) => t !== hd.table && !hd.table.contains(t) && t.closest('table') === t && rb.factsOf(t).length >= 2);
    if (!table) return null;
    // A row whose value is only a link InSIS+ may not open (a SharePoint profile, a Skype address) says nothing here.
    const dead = new Set([...table.rows].filter((tr) => tr.cells.length === 2 && tr.cells[1].querySelector('a[href]') && ![...tr.cells[1].querySelectorAll('a[href]')].some((a) => rb.link(a)))
      .map((tr) => kit.cellText(tr.cells[0]).replace(/:\s*$/, '')));
    const pairs = rb.factsOf(table).filter((p) => !dead.has(p.label));
    const notes = [...table.rows].filter((tr) => tr.cells.length === 1 && clean(tr.textContent)).map((tr) => clean(tr.textContent));
    const hours = pairs.find((p) => /^(consulting hours|konzultační hodiny|konzultacni hodiny)/i.test(p.label));
    const rest = pairs.filter((p) => p !== hours);
    return { table, rest, hours, notes };
  }

  function personPage(page) {
    const hd = headBlock(page);
    if (!hd?.name) return null;
    const tb = tabs(hd.menu);
    const selected = tb?.selected || '1';
    const id = route().params?.get('id');
    // "Write in InSIS": InSIS's own message link to this person (posta/nova_zprava.pl with the person's id), never a
    // mailto: (that opens the mail client). Without one, the e-mail address stays a plain "E-mail" action.
    const own = [...page.querySelectorAll('a[href*="nova_zprava.pl"]')].map((a) => nav.safe(a.href, 'link', { copied: true })).find(Boolean);
    const message = own || (id && nav.safe(new URL(`/auth/posta/nova_zprava.pl?uzivatel=${id}`, document.baseURI).href, 'link', { copied: true }));
    const mailto = !message && hd.mail?.link && /^mailto:/i.test(hd.mail.link.href) ? hd.mail.link : null;
    const c = selected === '1' ? contacts(page, hd) : null;
    const teacher = mine(hd.name, id);
    // InSIS's icon row (vCard export, "Import person to postal contacts") holds action links: it stays InSIS's own,
    // in place, styled as chips (03-pages §2, moving rule), shown under the contact card.
    const rows = [...page.querySelectorAll('.rada-ikon')].filter((r) => r.querySelector('a[href]'));
    const hide = [hd.table];
    let content;
    if (c) {
      hide.push(c.table);
      rows.forEach((r) => r.setAttribute('data-ipx-rb', 'keep'));
      content = () => [
        h('div', { class: teacher ? 'kit-cols' : 'kit-stack' },
          h('div', { class: 'kit-stack' },
            h('section', { class: 'card pad psn-card' },
              h('div', { class: 'psn-head' }, h('span', { class: 'avatar psn-avatar' }, initials(hd.name)),
                h('span', {}, h('strong', {}, hd.name), hd.positions.length > 0 && h('small', {}, hd.positions.map((p) => p.role).filter(Boolean).join(' · ')))),
              kit.facts([
                hd.mail && { label: T.mail, value: hd.mail.text, links: hd.mail.link ? [{ ...hd.mail.link, text: hd.mail.text }] : [] },
                ...c.rest.map((p) => ({ label: p.label, value: p.value, links: p.links })),
                hd.id && { label: T.id, value: hd.id },
              ].filter(Boolean)),
              hd.positions.some((p) => p.link) && h('div', { class: 'psn-positions' }, h('h3', {}, T.positions),
                h('ul', {}, hd.positions.map((p) => h('li', {}, p.link ? [p.role, ' · ', anchor(p.link, {}, clean(p.text.slice(p.role.length).replace(/^\s*[-–]\s*/, '')) || p.link.text)] : p.text)))),
              c.notes.map((n) => h('p', { class: 'muted small' }, n)),
              rows.length > 0 && h('div', { class: 'psn-insis' }, h('slot'))),
            c.hours && h('section', { class: 'card pad psn-hours' }, h('h2', { class: 'card-title' }, icon('clock'), T.hours), h('p', {}, c.hours.value))),
          teacher && h('aside', { class: 'card pad psn-mine' }, h('h2', { class: 'card-title' }, T.yours), h('p', { class: 'muted small' }, T.yoursLead),
            ipx.composed.teacherGrid([teacher]))),
      ];
    } else {
      // Another tab: everything after InSIS's tab row, read as blocks.
      const list = rb.blocks(page, { skip: [...rb.chrome(page), ...hide] });
      hide.push(...rb.redrawn(list));
      content = () => rb.render(list, { keepCard: (slot) => h('section', { class: 'card pad rb-form' }, h('p', { class: 'muted form-lead' }, T.formLead), slot) });
    }
    return {
      title: hd.name,
      actions: [
        // One page action: a long name needs the header's room (the e-mail addresses are in the contact card).
        // Not the envelope: the top bar's envelope is the mail box.
        message && anchor({ href: message }, { class: 'btn', title: T.write }, rb.glyph('pencil'), h('span', {}, T.write)),
        mailto && anchor({ href: mailto.href }, { class: 'btn ghost', title: hd.mail.text }, rb.glyph('at'), h('span', {}, T.email)),
      ].filter(Boolean),
      tabs: tb?.node,
      hide,
      content,
    };
  }

  // ---------- graduates ----------

  function graduatesPage(page) {
    const r = route();
    const facultyLinks = [...page.querySelectorAll('.vyber-fakult a.fakulta[href]')].map((a) => {
      const l = kit.linkOf(a);
      const code = kit.FACULTY_BY_CODE[nav.parse(a.href)?.params.get('fakulta')] || '';
      return l && { ...l, code };
    }).filter(Boolean);
    if (facultyLinks.length) {
      return { hide: [page.querySelector('.vyber-fakult')], content: () => [h('p', { class: 'rb-sub' }, T.chooseFaculty),
        h('div', { class: 'rb-grid' }, facultyLinks.map((l) => anchor(l, { class: 'rb-card' },
          h('div', { class: 'rb-card-top' }, h('span', { class: 'rb-badge', style: l.code ? `background: ${ipx.ui.facultyColors(l.code)[0]}; color: ${ipx.ui.facultyColors(l.code)[1]}` : null }, l.code || icon('cap')),
            h('span', {}, h('strong', {}, l.text))))))] };
    }
    const form = [...page.querySelectorAll('form')].find((f) => [...f.elements].some((e) => e.type !== 'hidden'));
    if (form) return { hide: rb.chrome(page), only: form, content: () => [h('section', { class: 'card pad rb-form' }, h('p', { class: 'muted form-lead' }, T.gradLead), h('slot'))] };
    // A faculty: its years as chips.
    const years = [...page.querySelectorAll('a[href*="rok="]')].map((a) => kit.linkOf(a)).filter(Boolean);
    if (years.length && r.params?.has('fakulta')) {
      const facts = [...page.querySelectorAll('table')].filter((t) => rb.factsOf(t).length && !t.querySelector('a[href*="rok="]')).flatMap((t) => rb.factsOf(t));
      const all = years.find((y) => /rok=1(\D|$)/.test(y.href));
      return { hide: [], content: () => [
        facts.length > 0 && h('section', { class: 'card pad rb-facts' }, kit.facts(facts)),
        h('p', { class: 'rb-sub' }, T.chooseYear),
        h('div', { class: 'psn-years' }, years.filter((y) => y !== all).map((y) => anchor(y, { class: 'rb-chip' }, y.text))),
        all && anchor(all, { class: 'btn ghost psn-all' }, T.allYears),
      ] };
    }
    // The list of graduates (InSIS's response): read as blocks.
    const list = rb.blocks(page, { skip: rb.chrome(page) });
    return { hide: rb.redrawn(list), content: () => rb.render(list) };
  }

  // ---------- dispatch ----------

  ipx.ready.then(() => {
    const page = document.getElementById('str1');
    const r = route();
    if (!page) return;
    if (r.path === '/auth/lide/clovek.pl') {
      const p = personPage(page);
      if (!p) return;
      const nodes = p.content();
      const hasSlot = nodes.flat(Infinity).some((n) => n instanceof Node && (n.matches?.('slot') || n.querySelector?.('slot')));
      rb.frame({ key: 'person', css: 'pages/person.css', title: p.title, subtitle: nav.sectionLabel('campus.people'), actions: p.actions, tabs: p.tabs,
        slot: hasSlot, kept: true, hide: p.hide, build: () => nodes });
    } else if (r.path === '/auth/lide/absolventi.pl') {
      const g = graduatesPage(page);
      const nodes = g.content();
      const hasSlot = nodes.flat(Infinity).some((n) => n instanceof Node && (n.matches?.('slot') || n.querySelector?.('slot')));
      rb.frame({ key: 'graduates', css: 'pages/person.css', title: T.graduates, subtitle: nav.sectionLabel('campus.about'),
        slot: hasSlot, kept: true, hide: g.hide, only: g.only, build: () => nodes });
    }
  });
})();
