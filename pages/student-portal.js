// InSIS+ — Study matters › Study status (student/moje_studium.pl). Treatment R (docs/ia/03-pages.md,
// teardowns/study-matters.md §2.1).
// InSIS's "Student's portal" is one wrapping form with a studies table (whose actions are unlabelled icons), the
// portal bar and four blocks of ~30 icon links. Every one of those links is a section in the sidebar now, so the
// page keeps only what is not navigation: the study itself (programme, form, faculty, progress, restriction), the
// other studies when there are several, the links InSIS gives for this study (labelled), the ID card block and, on
// the side, whom to ask. Links are InSIS's own addresses copied through the URL rule (nav.safe); they sit inside
// InSIS's form, so they are copied, never moved. Nothing is filled in or submitted.
//
// Stored for the dashboard, the sidebar and the background sync (plain data, no HTML; shape unchanged):
// ipx.state.portal = {
//   updated, source,
//   study: { faculty, name, detail, progress, restriction } | null,
//   links: { exams, enrol, timetable, record, submissions, plan: { href, text } | undefined },
//   paths: { '/auth/student/…pl': { href, text } }   (every portal link, by path)
// }
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.ui) return;

  // What is being read: this page, or a page fetched by the background sync (sync.js), which hands a parsed
  // document to the reader below. No InSIS script runs on a fetched page and nothing else is loaded.
  let doc = document;
  let here = location;
  const { clean, lang } = ipx;
  const ui = ipx.ui;
  const { h, icon, anchor, takeover, PORTAL_ACTIONS, facultyColors } = ui;

  // One header for the section's pages (kit.section): Status (this page), History (studium.pl) and the student
  // card pages below it, which generic.js draws around InSIS's content.
  const statusLink = (path) => ipx.kit.portalLink(path) || ipx.nav.safe(new URL(path, document.baseURI).href, 'link');
  let statusSection = null;
  const T = {
    cs: { studyOffice: 'Studijní oddělení', title: 'Stav studia', status: 'Stav', history: 'Historie studia', views: 'Pohledy na studium',
      noRestriction: 'Bez omezení', restriction: 'Omezení', period: 'Období',
      restrictionText: (f) => `Omezení může zablokovat zápis předmětů i přihlašování na zkoušky. Ukládá a ruší ho studijní oddělení${f ? ` fakulty ${f}` : ''}.`,
      inStudy: 'Pro toto studium', inStudyLead: 'Stránky InSIS, které patří k právě zvolenému studiu.',
      studies: 'Vaše studia', active: 'Aktivní', workHere: 'Pracovat v tomto studiu',
      card: 'Průkaz studenta', cardText: 'Průkaz ISIC nebo zaměstnanecký průkaz používá fotografii uloženou v InSIS.',
      photo: 'Změnit fotografii', cardTypes: 'Typy průkazů', validity: 'Ověřit platnost průkazu',
      ask: 'Na koho se obrátit', askText: 'Se studiem, omezením i průkazem poradí studijní oddělení vaší fakulty.',
      requests: 'Formuláře kontaktního centra', noStudy: 'InSIS na této stránce neukazuje žádné studium.',
      details: 'Údaje o studiu', obtained: 'Získané kredity', ofCredits: (n) => `z ${n} potřebných`, enrolledCr: 'Zapsané kredity', wholeStudy: 'za celé studium',
      coupons: 'Registrační kupóny', couponsNow: 'Kupóny teď', ofCoupons: (n) => `z ${n} na začátku`, couponsLead: 'Kupóny se spotřebovávají při registraci předmětů.',
      extraCoupons: 'Přidělené navíc', interruptions: 'Přerušení studia', trips: 'Zahraniční pobyty', noData: 'Nic není zaznamenáno.',
      cardTitle: 'Průkaz studenta', typesTitle: 'Typy průkazů', cardLead: 'Stránky InSIS k průkazům, které smíte používat.',
      typesGloss: 'Jaké druhy průkazů jsou na VŠE v provozu', validityGloss: 'Zda je průkaz s daným číslem platný',
      photoGloss: 'Fotografie, kterou používá ISIC i zaměstnanecký průkaz', typesLead: 'Druhy identifikačních průkazů, které jsou na VŠE v provozu.' },
    en: { studyOffice: 'Study department', title: 'Study status', status: 'Status', history: 'History', views: 'Views of your study',
      noRestriction: 'No restriction', restriction: 'Restriction', period: 'Period',
      restrictionText: (f) => `A restriction can block course registration and exam sign-up. The study department${f ? ` of ${f}` : ''} sets and lifts it.`,
      inStudy: 'For this study', inStudyLead: 'InSIS pages that belong to the study you are working in.',
      studies: 'Your studies', active: 'Active', workHere: 'Work in this study',
      card: 'Student card', cardText: 'Your ISIC or employee card uses the photo stored in InSIS.',
      photo: 'Change photo', cardTypes: 'Card types', validity: 'Check a card’s validity',
      ask: 'Who to ask', askText: 'The study department of your faculty helps with your study, a restriction or your card.',
      requests: 'Contact centre forms', noStudy: 'InSIS shows no study on this page.',
      details: 'Study details', obtained: 'Credits obtained', ofCredits: (n) => `of ${n} required`, enrolledCr: 'Credits enrolled', wholeStudy: 'for the whole study',
      coupons: 'Registration coupons', couponsNow: 'Coupons now', ofCoupons: (n) => `of ${n} at the start`, couponsLead: 'Coupons are used up when you register for courses.',
      extraCoupons: 'Granted extra', interruptions: 'Interruption of study', trips: 'Trips abroad', noData: 'Nothing recorded.',
      cardTitle: 'Student card', typesTitle: 'Card types', cardLead: 'The InSIS pages about ID cards that you may use.',
      typesGloss: 'Which kinds of ID card are in use at VŠE', validityGloss: 'Whether the card with a given number is valid',
      photoGloss: 'The photo used on your ISIC and employee card', typesLead: 'The kinds of identification card in use at VŠE.' },
  }[lang];

  // Addresses are compared without their query: many carry a link back to the portal (zpet=…/student/…).
  const path = (href) => new URL(href).pathname;
  // Icon for each link InSIS gives in the studies table, by address.
  const ICON_BY = [[/terminy/, 'check'], [/vs_registrace/, 'layers'], [/registrace|zapis/, 'list'], [/mimosemestr/, 'calendar'], [/zp_temata/, 'file']];
  const iconFor = (href) => ICON_BY.find(([re]) => re.test(path(href)))?.[1] || 'arrow';
  // Every link shown on the page: InSIS's own address through the URL rule, or nothing.
  const safe = (l) => {
    const href = l?.href && ipx.nav?.safe(l.href, 'link', { copied: true });
    return href ? { ...l, href, target: null } : null;
  };
  const restricted = (r) => !!r && !/^[-–—\s]*$/.test(r);
  // "enrolled" / "řádně zapsán": the normal state of a running study.
  const isEnrolled = (p) => /enrolled|zaps[aá]n|studuj/i.test(p || '');

  // ---------- reading the original page ----------

  const linkOf = (a, label) => ({
    href: a.href,
    target: a.target || null,
    text: clean(label || a.querySelector('.app-ikona-text')?.textContent || a.textContent || a.title ||
      a.querySelector('[aria-label]')?.getAttribute('aria-label')),
  });

  // "Business Informatics<br>full-time<br>" → ['Business Informatics', 'full-time']. Split at the <br> elements, not
  // with innerText: a page fetched by the background sync is never laid out, so innerText has no line breaks there.
  function lines(el) {
    const out = [''];
    for (const n of el.childNodes) {
      if (n.nodeName === 'BR') out.push('');
      else out[out.length - 1] += n.textContent;
    }
    return out.map(clean).filter(Boolean);
  }

  function parse() {
    const page = doc.getElementById('str1');
    const form = page?.querySelector('form[action*="moje_studium"]');
    const menu = page?.querySelector('table.portal_menu');
    if (!form || !menu || !page.querySelector('.rada-ikon')) return null;

    // "Study – FIS C-BI pres [term 1, E], study period – WS 2026/2027 - FIS"
    const head = [...page.querySelectorAll('#titulek b')].map((b) => clean(b.textContent));

    const tabsRow = [...menu.querySelectorAll('a[href]')].map((a) => ({ ...linkOf(a, a.textContent), on: !!a.closest('b') }));

    // Studies table: the one with a "zahlavi" header whose rows carry the action icons.
    const studyTable = [...page.querySelectorAll('table')].find((t) => t.querySelector('tr.zahlavi') && t.querySelector('a [data-sysid]'));
    const headers = studyTable ? [...studyTable.querySelectorAll('tr.zahlavi th, tr.zahlavi td')].map((c) => clean(c.textContent)) : [];
    const studies = studyTable ? [...studyTable.querySelectorAll('tbody tr')].map((tr) => {
      const cells = [...tr.children];
      const status = cells[0]?.querySelector('[data-sysid]');
      return {
        // The green bullet ("stav-aktivni"); compared whole, so that no other state containing the word matches.
        active: status?.dataset.sysid === 'stav-aktivni',
        choose: cells[0]?.querySelector('a[href]') && linkOf(cells[0].querySelector('a[href]'), headers[0]),
        faculty: clean(cells[1]?.textContent),
        name: [...(cells[2]?.querySelectorAll('b') || [])].flatMap(lines),
        progress: clean(cells[3]?.textContent),
        restriction: clean(cells[4]?.textContent),
        // Each action icon's own label (aria-label) is clearer than the column header.
        actions: cells.slice(5).flatMap((c) => [...c.querySelectorAll('a[href]')].map((a) =>
          linkOf(a, a.querySelector('[aria-label]')?.getAttribute('aria-label')))),
      };
    }).filter((s) => s.faculty || s.name.length) : [];

    const icons = [...page.querySelectorAll('.rada-ikon a.app-ikona[href]')].map((a) => linkOf(a));
    const study = studies.find((s) => s.active) || studies[0] || null;

    // Every link once (the study's own icons first: their labels are the clearest).
    const seen = new Set([here.href.split('#')[0]]);
    const all = [...(study?.actions || []), ...tabsRow.filter((t) => !t.on), ...icons]
      .filter((l) => l.text && !/moje_studium\.pl$/.test(path(l.href)) && !seen.has(l.href) && seen.add(l.href));
    const links = {};
    for (const a of PORTAL_ACTIONS) {
      const l = all.find((x) => a.re.test(x.href));
      if (l) links[a.id] = { href: l.href, text: l.text };
    }
    const byPath = (re) => all.find((l) => re.test(path(l.href)));

    return {
      head, study, studies, links, all,
      history: byPath(/\/student\/studium\.pl$/),
      office: byPath(/stud_odd\.pl$/),
      requests: byPath(/\/kc\//),
      photo: byPath(/vkladani_fotky\.pl$/),
    };
  }

  function remember(d) {
    const s = d.study;
    ipx.state.portal = {
      updated: Date.now(),
      source: here.href,
      study: s && { faculty: s.faculty, name: s.name[0] || '', detail: s.name.slice(1).join(', '), progress: s.progress, restriction: s.restriction || '' },
      links: d.links,
      // Every portal link by page path, copied verbatim: the new navigation (nav.js) reaches InSIS pages through
      // the student's own links, which carry the right study and period.
      paths: Object.fromEntries(d.all.map((l) => [new URL(l.href).pathname.replace(/\/index\.pl$/, '/'), { href: l.href, text: l.text }])),
    };
    ipx.save();
  }

  // ---------- building the new page ----------

  const linkRow = (l, iconName, sub) => anchor(l, { class: 'sp-link' },
    h('span', { class: 'sp-link-icon' }, icon(iconName)),
    h('span', { class: 'sp-link-text' }, h('strong', {}, l.text), sub && h('small', {}, sub)),
    h('span', { class: 'sp-go' }, icon('arrow')));

  const statusChips = (s) => [
    s.progress && h('span', { class: `delta ${isEnrolled(s.progress) ? 'ok' : 'neutral'}` }, s.progress),
    h('span', { class: `delta ${restricted(s.restriction) ? 'bad' : 'ok'}` }, restricted(s.restriction) ? `${T.restriction}: ${s.restriction}` : T.noRestriction),
  ];

  function studyCard(d) {
    const s = d.study;
    return h('section', { class: 'card sp-study' },
      h('span', { class: 'sp-badge', style: `--fac: ${facultyColors(s.faculty)[1]}` }, s.faculty || '—'),
      h('span', { class: 'sp-study-text' },
        h('strong', {}, s.name[0] || d.head[0] || ''),
        h('small', {}, [s.name.slice(1).join(', '), d.head[1] && `${T.period} ${d.head[1]}`].filter(Boolean).join(' · '))),
      h('span', { class: 'sp-study-side' }, statusChips(s)));
  }

  function restrictionNote(d) {
    const s = d.study;
    if (!restricted(s.restriction)) return null;
    const office = safe(d.office);
    return h('p', { class: 'kit-note bad sp-note' }, icon('alert'),
      h('span', {}, T.restrictionText(s.faculty), ' ', office && anchor(office, { class: 'sp-note-link' }, ipx.nav.label('campus.office'))));
  }

  // The links InSIS gives in the study's row (exam sign-up, registration, …), each named by InSIS's own label —
  // only those the sidebar does not already lead to (a page whose section opens another page, e.g. minor-track
  // registration under Registration & enrolment); the rest would repeat the navigation (03-pages.md §2).
  function studyLinks(d) {
    const nav = ipx.nav;
    const list = (d.study.actions || []).map(safe).filter(Boolean).filter((l) => {
      const r = nav.route(l.href);
      const t = r.node && nav.target(nav.sectionOf(r.node));
      return !t || nav.route(t).path !== r.path;
    });
    if (!list.length) return null;
    return h('section', { class: 'card sp-block' },
      h('div', { class: 'card-head' }, h('h2', {}, T.inStudy)),
      h('p', { class: 'muted sp-lead' }, T.inStudyLead),
      h('div', { class: 'sp-links' }, list.map((l) => linkRow(l, iconFor(l.href)))));
  }

  // With two or more studies: one row each; the active one marked, the others with InSIS's Choose link (a GET the
  // student clicks: it switches the study InSIS works with; InSIS+ never follows it itself).
  function otherStudies(d) {
    if (d.studies.length < 2) return null;
    return h('section', { class: 'card sp-block' },
      h('div', { class: 'card-head' }, h('h2', {}, T.studies)),
      h('ul', { class: 'sp-studies' }, d.studies.map((s) => {
        const choose = safe(s.choose);
        return h('li', {},
          h('span', { class: 'sp-fac', style: `--fac: ${facultyColors(s.faculty)[1]}` }, s.faculty || '—'),
          h('span', { class: 'sp-study-text' }, h('strong', {}, s.name[0] || ''), s.name.length > 1 && h('small', {}, s.name.slice(1).join(', '))),
          h('span', { class: 'sp-study-side' },
            s.active && h('span', { class: 'delta ok' }, T.active),
            s.progress && h('span', { class: 'delta neutral' }, s.progress),
            restricted(s.restriction) && h('span', { class: 'delta bad' }, s.restriction),
            choose && anchor(choose, { class: 'btn ghost sm' }, T.workHere)));
      })));
  }

  function idCard(d) {
    const at = (p) => ipx.nav?.safe(new URL(p, doc.baseURI).href, 'link');
    const photo = safe(d.photo);
    const quiet = [{ href: at('/auth/karty/typy_karet.pl'), text: T.cardTypes }, { href: at('/auth/karty/platnost.pl'), text: T.validity }].filter((l) => l.href);
    return h('section', { class: 'card sp-block' },
      h('div', { class: 'card-head' }, h('h2', {}, T.card)),
      h('p', { class: 'muted sp-lead' }, T.cardText),
      h('div', { class: 'sp-card-actions' },
        photo && anchor({ ...photo, text: T.photo }, { class: 'btn ghost' }, icon('people'), h('span', {}, T.photo)),
        quiet.map((l) => anchor(l, { class: 'sp-quiet' }, l.text))));
  }

  function rail(d) {
    const office = safe(d.office);
    const requests = safe(d.requests);
    if (!office && !requests) return null;
    return h('aside', { class: 'rail' },
      h('section', {},
        h('div', { class: 'card-head' }, h('h2', {}, T.ask)),
        h('p', { class: 'muted rail-empty' }, T.askText),
        h('div', { class: 'sp-contacts' },
          office && linkRow({ ...office, text: T.studyOffice }, 'people', d.study?.faculty),
          requests && linkRow({ ...requests, text: ipx.nav.sectionLabel('studies.requests') }, 'mail', T.requests))));
  }

  statusSection = ipx.kit.section({
    id: 'status',
    title: () => ipx.nav.sectionLabel('studies.status'),
    subtitle: () => ipx.nav.label('matters'),
    pages: { '/auth/student/moje_studium.pl': 'status', '/auth/student/studium.pl': 'history', '/auth/karty/': null,
      '/auth/karty/typy_karet.pl': null, '/auth/karty/platnost.pl': null, '/auth/personalizace/vkladani_fotky.pl': null },
    views: () => [
      { id: 'status', href: statusLink('/auth/student/moje_studium.pl'), text: T.status },
      { id: 'history', href: statusLink('/auth/student/studium.pl'), text: T.history },
    ],
  });

  function buildPage(d) {
    return h('div', { class: 'sp' },
      h('div', { class: 'sp-main' },
        ipx.kit.sectionTabs(statusSection, 'status'),
        d.study ? [studyCard(d), restrictionNote(d), otherStudies(d), studyLinks(d)] : h('div', { class: 'empty' }, h('p', {}, T.noStudy)),
        idCard(d)),
      rail(d));
  }

  // ---------- History (student/studium.pl), the card pages (karty/, karty/typy_karet.pl) ----------
  // All three are information pages (treatment R): read, drawn again with InSIS+ components, the original hidden.
  // History holds the study's facts (a label/value table), the registration coupons and three history tables
  // (interruptions, trips abroad, extra coupons), each with InSIS's help paragraph; most are empty for most students.

  const card = (title, ...body) => h('section', { class: 'card pad' }, h('h2', { class: 'card-title' }, title), ...body);
  const isEmptyRow = (d) => !d || !d.rows.length || (d.rows.length === 1 && d.rows[0].cells.length === 1);
  // A history table as a readable table without InSIS's audit columns (Changed / Changed by); its own "nothing
  // here" sentence when empty.
  function historyTable(d, label) {
    // InSIS's own sentence when it says something specific ("You have no interruption of study registered."), not
    // its generic "No suitable data found."
    const said = d?.rows[0]?.cells[0]?.text;
    if (isEmptyRow(d)) return h('p', { class: 'muted mx-none' }, said && !/suitable data|vyhovuj/i.test(ipx.norm(said)) ? said : T.noData);
    const keep = d.head.map((t, i) => ({ t, i })).filter(({ t }) => t && !/^(changed|zmen)/.test(ipx.norm(t)));
    return ipx.kit.dataTable({ label, columns: keep.map(({ t, i }, n) => ({ key: `c${i}`, label: t, main: n === 0 })),
      rows: d.rows.map((r) => Object.fromEntries(keep.map(({ i }) => [`c${i}`, r.cells[i]?.links.length === 1 ? r.cells[i].links[0] : r.cells[i]?.text]))) });
  }

  function historyPage(page) {
    const kit = ipx.kit;
    const norm = ipx.norm;
    // Label/value tables: no header row, no nested table, not a tab row or the key. Read here rather than with
    // kit.keyValues, which skips labels over 60 characters ("Number of credits obtained during your whole …").
    const pairs = (t) => [...t.rows].filter((tr) => tr.cells.length === 2).map((tr) => ({
      label: kit.cellText(tr.cells[0]).replace(/:$/, ''), value: kit.cellText(tr.cells[1]) })).filter((f) => f.label);
    const plain = [...page.querySelectorAll('table')].filter((t) => !t.closest('table.portal_menu, .uisLegend') &&
      !t.querySelector('table, .zahlavi') && pairs(t).length);
    const facts = plain[0] ? pairs(plain[0]).filter((f) => f.value) : [];
    const couponFacts = plain[1] ? pairs(plain[1]) : [];
    const tables = kit.findTables(page).map((t) => kit.readTable(t));
    const pick = (re) => tables.find((d) => d.head.some((x) => re.test(norm(x))));
    const fact = (list, re) => list.find((f) => re.test(norm(f.label)))?.value;
    const required = fact(facts, /required|potreb|nutn/);
    const obtained = fact(facts, /obtained|ziskan/);
    const enrolled = fact(facts, /enrolled for|zapsan/);
    const initial = fact(couponFacts, /initial|pocatecni/);
    const current = fact(couponFacts, /current|aktualni|soucasn/);
    const extra = pick(/quantity|pocet|mnozstvi/);
    return h('div', { class: 'kit-stack' },
      h('div', { class: 'kpis' },
        ui.kpi({ label: T.obtained, value: obtained, foot: required && T.ofCredits(required) }),
        ui.kpi({ label: T.enrolledCr, value: enrolled, foot: T.wholeStudy }),
        ui.kpi({ label: T.couponsNow, value: current, foot: initial && T.ofCoupons(initial) })),
      h('div', { class: 'kit-cols' },
        facts.length ? card(T.details, kit.facts(facts)) : h('div', { class: 'empty' }, h('p', {}, T.noData)),
        h('div', { class: 'kit-stack' },
          (couponFacts.length > 0 || !isEmptyRow(extra)) && card(T.coupons,
            h('p', { class: 'muted small mx-gap' }, T.couponsLead),
            kit.facts(couponFacts.filter((f) => f.value)),
            !isEmptyRow(extra) && [h('h3', { class: 'mx-sub' }, T.extraCoupons), historyTable(extra, T.extraCoupons)]),
          card(T.interruptions, historyTable(pick(/reason|duvod/), T.interruptions)),
          card(T.trips, historyTable(pick(/institution|instituce|podnik/), T.trips)))));
  }

  // A row linking one InSIS page, with a one-line gloss.
  const pageRow = (l, iconName, gloss) => anchor(l, { class: 'mx-row' },
    h('span', { class: 'mx-row-icon' }, icon(iconName)),
    h('span', { class: 'mx-row-text' }, h('strong', {}, l.text), gloss && h('small', {}, gloss)),
    h('span', { class: 'mx-row-go' }, icon('arrow')));

  // karty/: InSIS's menu of card pages (with Open all / Close all) → the leaves as rows, plus the photo page.
  function cardsPage(page) {
    // InSIS's menu links carry its menu counter (_m), which the URL rule does not take: the plain address instead,
    // offered only when InSIS's menu lists the page.
    const find = (re, path) => [...page.querySelectorAll('a[href]')].some((x) => re.test(x.getAttribute('href'))) &&
      { href: ipx.nav.safe(new URL(path, document.baseURI).href, 'link') };
    const photo = ipx.state.portal?.paths?.['/auth/personalizace/vkladani_fotky.pl'];
    const rows = [
      [find(/typy_karet\.pl/, '/auth/karty/typy_karet.pl'), 'list', T.typesTitle, T.typesGloss],
      [find(/platnost\.pl/, '/auth/karty/platnost.pl'), 'check', T.validity, T.validityGloss],
      [safe(photo), 'people', T.photo, T.photoGloss],
    ].filter(([l]) => l?.href);
    return h('div', { class: 'kit-stack' },
      h('p', { class: 'muted mx-lead' }, T.cardLead),
      rows.length ? h('section', { class: 'card mx-rows' }, rows.map(([l, ic, text, gloss]) => pageRow({ ...l, text }, ic, gloss)))
        : h('div', { class: 'empty' }, h('p', {}, ipx.kit.looseText(page) || T.noData)));
  }

  // karty/typy_karet.pl: a short text, a table of card types, or InSIS's message that there are none.
  function typesPage(page) {
    const kit = ipx.kit;
    const tables = kit.findTables(page).map((t) => kit.readTable(t)).filter((d) => !isEmptyRow(d));
    const msgs = kit.messages(page);
    return h('div', { class: 'kit-stack' },
      h('p', { class: 'muted mx-lead' }, T.typesLead),
      tables.map((d) => historyTable(d, T.typesTitle)),
      !tables.length && h('div', { class: 'empty' }, h('p', {}, msgs.find((m) => m.tone === 'info')?.text || kit.looseText(page) || T.noData)),
      msgs.filter((m) => tables.length || m.tone !== 'info').map(kit.note));
  }

  // Background read (sync.js): parse a fetched page and store its data; nothing is drawn.
  (ipx.readers ||= {}).portal = (fetched, url) => {
    doc = fetched; here = new URL(url);
    try { const data = parse(); if (data) remember(data); } finally { doc = document; here = location; }
  };

  // The other pages of the section, each drawn only on its own address and only when InSIS's content is there.
  const OTHER = {
    '/auth/student/studium.pl': { key: 'study-history', view: 'history', build: historyPage, ok: (p) => p.querySelector('table') },
    '/auth/karty/': { key: 'id-cards', title: () => T.cardTitle, build: cardsPage, ok: (p) => p.querySelector('#menitko, a[href*="karty/"]') },
    '/auth/karty/typy_karet.pl': { key: 'card-types', title: () => T.typesTitle, build: typesPage, ok: () => true },
  };

  ipx.ready.then(() => {
    const other = OTHER[ipx.nav.route(document.baseURI.split('#')[0]).path];
    const original = document.getElementById('str1');
    if (other && original && other.ok(original)) {
      // History is a view of the section (its header and tabs); the card pages are below it (03-pages.md §1 rule 7:
      // titled by the thing, the section as eyebrow, no tabs).
      ipx.kit.page({
        key: other.key, css: 'pages/matters.css',
        title: other.view ? ipx.nav.sectionLabel('studies.status') : other.title(),
        subtitle: other.view ? ipx.nav.label('matters') : ipx.nav.sectionLabel('studies.status'),
        tabs: other.view ? ipx.kit.sectionTabs(statusSection, other.view) : null,
        build: () => other.build(original),
      });
      return;
    }
    const data = parse();
    if (!data) return;
    remember(data);
    takeover({
      key: 'student-portal',
      css: ['kit.css', 'pages/student-portal.css'],
      // Study matters › Study status: the section's own page (03-pages.md §1 rule 7).
      title: ipx.nav ? ipx.nav.sectionLabel('studies.status') : T.title,
      subtitle: ipx.nav ? ipx.nav.label('matters') : null,
      build: () => buildPage(data),
    });
  });
})();
