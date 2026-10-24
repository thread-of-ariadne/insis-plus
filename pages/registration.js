// InSIS+ — Courses › Registration & enrolment and the pages below it (teardowns/courses.md §2.5):
//   student/registrace.pl         the section's own page: enrolled courses and the dates of the next rounds
//   student/mimosemestr_zapis.pl  extra-semestral courses (InSIS's selection form with checkboxes and the button that
//                                 enrols and opens the online payment)
//   student/vs_registrace.pl      minor tracks (InSIS's own two views: Catalogue · Statistics of registrations)
//   student/oblibene_predmety.pl  favourite courses (a planning list; removing is InSIS's form)
// Every list here sits inside InSIS's <form> or holds InSIS's actions (enrol, pay, print, remove), so each stays
// InSIS's own: treatment L in place (pages/lists.js) — rows styled as list rows, InSIS's icons as words, help
// paragraphs, legends and decoration (payment card logos) hidden, filter and selection forms as form cards with one
// line on what InSIS does when its button is pressed. Nothing is ticked, selected, submitted or fetched by InSIS+.
// Header (kit.section, drawn by generic.js): registrace.pl is the section's page (title Registration & enrolment,
// eyebrow Courses) and its lead is the overview the teardown asks for — where the rounds stand (from InSIS's own
// dates on this page), what is enrolled, and the other steps as rows; the other three pages are pages below it
// (title the page, eyebrow the section). Minor tracks keep InSIS's two views as view tabs (InSIS's own links).
// Nothing is stored.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.kit || !ipx.lists) return;
  const { lang, clean, norm } = ipx;
  const { h, icon, anchor, countdown } = ipx.ui;
  const kit = ipx.kit;
  const nav = ipx.nav;
  const L = ipx.lists;
  const locale = lang === 'cs' ? 'cs-CZ' : 'en-GB';
  const P = { reg: '/auth/student/registrace.pl', extra: '/auth/student/mimosemestr_zapis.pl', minor: '/auth/student/vs_registrace.pl',
    fav: '/auth/student/oblibene_predmety.pl', stats: '/auth/student/reg_stat_tridy.pl' };

  const T = {
    cs: {
      extra: 'Mimosemestrální předměty', extraText: 'krátké kurzy mimo semestr, často placené',
      minor: 'Vedlejší specializace', minorText: 'specializace, kterou si přidáte ke studiu, často z jiné fakulty',
      fav: 'Oblíbené předměty', favText: 'váš seznam předmětů k plánování',
      stats: 'Statistiky zápisu', statsText: 'jak plné jsou jednotlivé rozvrhové akce',
      steps: 'Další kroky', enrolled: 'Zapsáno v tomto období', rounds: 'Nejbližší kola',
      courses: (n) => `${n} ${kit.plural(n, 'předmět', 'předměty', 'předmětů')}`, credits: (n) => `${n} ECTS`,
      noRound: 'Teď neprobíhá žádné kolo.', next: (what, d) => `${what} začíná ${d}`, open: (what, d) => `${what} běží do ${d}`,
      regLead: 'Registrace = vaše přání seřazená podle priority; zápis = potvrzená místa; po zápisu ještě úpravy rozvrhu. V kole se přání ukládají až tlačítkem InSIS.',
      compulsory: 'povinný', elective: 'volitelný', compElective: 'povinně volitelný', paid: 'placený',
      // extra-semestral
      openNow: 'Zápis právě běží', later: 'Zápis teprve začne', over: 'Zápis skončil', enrolledExtra: 'Zapsané mimosemestrální předměty',
      openN: (n) => `Otevřeno k zápisu: ${n}`, laterN: (n) => `Později: ${n}`, enrolledN: (n) => `Zapsáno: ${n}`,
      extraLead: 'Zaškrtněte předměty v seznamu a stiskněte tlačítko InSIS: InSIS vás zapíše a u placených předmětů otevře online platbu.',
      filter: 'Filtr', filterLead: 'Jen vybraný ústav nebo jen placené / neplacené předměty; InSIS seznam omezí po stisknutí tlačítka.',
      only: 'Zobrazeno jen', all: 'Zobrazit vše',
      showOver: (n) => `Zobrazit předměty po zápisu (${n})`, hideOver: 'Skrýt předměty po zápisu',
      // minor tracks
      tracks: (n) => `${n} ${kit.plural(n, 'specializace', 'specializace', 'specializací')}`, free: (n) => `${n} s volnými místy`, full: 'plno',
      print: 'Tisk', sortBy: 'Řadit:', catalogue: 'Katalog', statistics: 'Statistiky registrací',
      minorLead: 'Specializace se vypisují po vysokoškolských úsecích. Úsek vyberte ve formuláři; InSIS ukáže jeho specializace po stisknutí tlačítka.',
      unitLead: 'Vysokoškolský úsek: InSIS přepne seznam po stisknutí tlačítka.', brochure: 'Brožuru všech specializací k tisku vytvoří InSIS po stisknutí tlačítka.',
      // favourites
      favEmpty: 'Zatím nemáte žádné oblíbené předměty.', favLead: 'Předmět přidáte hvězdičkou u jeho názvu v InSIS; odebrání potvrdíte tlačítkem pod seznamem.',
    },
    en: {
      extra: 'Extra-semestral courses', extraText: 'short courses outside the semester, often paid',
      minor: 'Minor tracks', minorText: 'a specialisation you add to your study, often from another faculty',
      fav: 'Favourite courses', favText: 'your planning list of courses',
      stats: 'Enrolment statistics', statsText: 'how full each class is',
      steps: 'Other steps', enrolled: 'Enrolled this period', rounds: 'Next rounds',
      courses: (n) => `${n} ${n === 1 ? 'course' : 'courses'}`, credits: (n) => `${n} ECTS`,
      noRound: 'No round is open right now.', next: (what, d) => `${what} opens ${d}`, open: (what, d) => `${what} open until ${d}`,
      regLead: 'Registration = your wishes ranked by priority; enrolment = confirmed places; then timetable changes. During a round, wishes are saved only by InSIS’s button.',
      compulsory: 'compulsory', elective: 'elective', compElective: 'compulsory elective', paid: 'paid',
      openNow: 'Enrolment open now', later: 'Enrolment opens later', over: 'Enrolment over', enrolledExtra: 'Your extra-semestral courses',
      openN: (n) => `Open for enrolment: ${n}`, laterN: (n) => `Later: ${n}`, enrolledN: (n) => `Enrolled: ${n}`,
      extraLead: "Tick courses in the list and press InSIS's button: InSIS enrols you and, for paid courses, opens the online payment.",
      filter: 'Filter', filterLead: 'Only one institute, or only paid / free courses; InSIS narrows the list when you press its button.',
      only: 'Showing only', all: 'Show all',
      showOver: (n) => `Show courses whose enrolment is over (${n})`, hideOver: 'Hide courses whose enrolment is over',
      tracks: (n) => `${n} ${n === 1 ? 'track' : 'tracks'}`, free: (n) => `${n} with vacancies`, full: 'full',
      print: 'Print', sortBy: 'Sort by:', catalogue: 'Catalogue', statistics: 'Statistics of registrations',
      minorLead: 'Tracks are offered per university section. Pick one in the form; InSIS shows its tracks when you press its button.',
      unitLead: 'University section: InSIS switches the list when you press its button.', brochure: "A printable brochure of all tracks: InSIS creates it when you press its button.",
      favEmpty: 'You have no favourite courses yet.', favLead: 'Add a course with the star next to its name in InSIS; to remove some, tick them and confirm with the button under the list.',
    },
  }[lang];

  const route = () => nav.route(document.baseURI.split('#')[0]);
  const pathKey = () => Object.entries(P).find(([, p]) => p === route().path)?.[0] || null;

  // A link to another page of the section: the student's portal link (study and period), else InSIS's own link on
  // this page, else the bare address — always through the URL rule.
  function linkTo(path) {
    const fromPortal = kit.portalLink(path);
    if (fromPortal) return fromPortal;
    const a = [...document.querySelectorAll('#str1 a[href]')].find((x) => nav.route(x.href).path === path);
    return (a && nav.safe(a.href, 'link', { copied: true })) || nav.safe(new URL(path, document.baseURI).href, 'link');
  }

  let found = null;

  kit.section({
    id: 'registration',
    css: ['pages/course-pages.css'],
    title: () => ({ reg: nav.sectionLabel('courses.registration'), extra: T.extra, minor: T.minor, fav: T.fav })[pathKey()] || nav.sectionLabel('courses.registration'),
    subtitle: () => (pathKey() === 'reg' ? nav.label('courses') : nav.sectionLabel('courses.registration')),
    pages: {
      [P.reg]: 'overview',
      [P.extra]: null,
      [P.fav]: null,
      // Minor tracks: InSIS's own views (zalozka=1 Catalogue, zalozka=4 Statistics).
      [P.minor]: (r) => (r.params?.get?.('detail') ? null : r.params?.get?.('zalozka') === '4' ? 'stats' : 'catalogue'),
    },
    views: () => (pathKey() === 'minor' ? found?.views || [] : []),
    node: () => 'courses.registration',
    lead: () => found?.lead?.() || null,
  });

  // "Mon 1 Feb 00:00": InSIS's own clock time (never "24:00 of the day before"), as on the other Courses pages.
  const stamp = (d) => `${d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })} ${d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;

  // InSIS's course attribute icons, in words.
  function iconWords(root) {
    const words = { 'predmet-povinny': T.compulsory, 'predmet-volitelny': T.elective, 'predmet-povinne-volitelny': T.compElective, 'predmet-placeny': T.paid };
    for (const ic of root.querySelectorAll('[data-sysid]')) {
      const w = words[ic.getAttribute('data-sysid')];
      if (w) L.label(ic, w);
    }
  }

  // The bold heading right before a node (InSIS puts <b>Heading</b><p></p>[<div.small>] before each block).
  function headingBefore(node) {
    for (let n = node.previousElementSibling, k = 0; n && k < 8; n = n.previousElementSibling, k++) {
      if (n.tagName === 'B') return n;
      if (n.tagName === 'TABLE' || n.tagName === 'FORM') return null;
    }
    return null;
  }

  // ---------- registrace.pl ----------
  function registration(page) {
    const tables = [...page.querySelectorAll('table')].filter((t) => !t.classList.contains('portal_menu') && L.columns(t).length > 1);
    const enrolled = tables.find((t) => L.columns(t).some((x) => /^(code|kod)$/.test(norm(x))));
    // The whole header text is matched ("od" alone, never inside "kód").
    const rounds = tables.find((t) => t !== enrolled && L.columns(t).some((x) => /^(beginning|start|zacatek|od)$/.test(norm(x))));
    let courses = 0;
    let credits = 0;
    if (enrolled) {
      const { rows, cols } = L.mark(enrolled, (t) => (/^(code|kod)$/.test(t) ? 'lead' : /^(course|predmet)$/.test(t) ? 'title' : /^(crd|kr)/.test(t) ? 'meta'
        : /(timetable|rozvrh)/.test(t) ? 'note' : /^(type|typ)/.test(t) ? null : 'sub'), { title: T.enrolled });
      const crd = cols.findIndex((x) => /^(crd|kr)/.test(norm(x)));
      courses = rows.length;
      for (const tr of rows) credits += Number(clean(tr.querySelector('td[data-il-col="meta"]')?.textContent)) || 0;
      iconWords(enrolled);
      if (crd < 0) credits = 0;
      ipx.ui.hideInSlot([headingBefore(enrolled)].filter(Boolean));
    }
    // The rounds: InSIS's own dates; the nearest one that has not ended becomes the status line.
    const now = new Date();
    let next = null;
    if (rounds) {
      const { rows } = L.mark(rounds, (t) => (/(department|pracoviste|fakulta)/.test(t) ? 'title' : /(period|obdobi)/.test(t) ? 'sub' : /^(beginning|start|end|zacatek|konec|od|do)$/.test(t) ? 'meta' : 'sub'), { title: T.rounds });
      for (const tr of rows) {
        const [from, to] = [...tr.querySelectorAll('td[data-il-col="meta"]')].map((td) => kit.dateOf(clean(td.textContent)));
        // "Course registrations · SS 2026/2027": InSIS's heading of the table names the kind of round.
        const what = [clean(headingBefore(rounds)?.textContent), clean(tr.querySelector('td[data-il-col="sub"]')?.textContent)].filter(Boolean).join(' · ');
        if (to && to < now) continue;
        if (!next || (from && from < next.from)) next = { from, to, what };
      }
      // InSIS's two headings over the rounds ("Future events dates", "Course registrations") give way to the title.
      let b = headingBefore(rounds);
      const heads = [];
      for (let k = 0; b && k < 2; k++) { heads.push(b); b = headingBefore(b); }
      ipx.ui.hideInSlot(heads);
    }
    const noEvent = [...page.querySelectorAll('div.small')].map((d) => clean(d.textContent)).find((t) => /no events|zadne udalosti|neprobiha/.test(norm(t)));
    const steps = [
      ['extra', 'calendar', P.extra, T.extra, T.extraText],
      ['minor', 'layers', P.minor, T.minor, T.minorText],
      ['fav', 'star', P.fav, T.fav, T.favText],
      ['stats', 'list', P.stats, T.stats, T.statsText],
    ].map(([, ic, path, title, text]) => ({ ic, href: linkTo(path), title, text })).filter((s) => s.href);
    found = {
      lead: () => h('div', { class: 'cp-lead' },
        h('p', { class: 'cp-facts' },
          next && next.from && next.from > now ? h('span', { class: 'delta neutral' }, T.next(next.what || T.rounds, stamp(next.from)))
            : next && next.to ? h('span', { class: 'delta warn' }, T.open(next.what || T.rounds, stamp(next.to))) : h('span', { class: 'delta neutral' }, noEvent || T.noRound),
          next?.from && next.from > now && h('span', { class: 'muted' }, countdown(next.from, now)),
          courses > 0 && h('span', { class: 'cp-fact' }, [T.courses(courses), credits ? T.credits(credits) : null].filter(Boolean).join(' · '))),
        h('p', { class: 'muted small' }, T.regLead),
        steps.length > 0 && h('section', { class: 'card' },
          h('div', { class: 'card-head' }, h('h2', {}, T.steps)),
          h('div', { class: 'cp-rows' }, steps.map((s) => anchor({ href: s.href }, { class: 'cp-row' },
            h('span', { class: 'cp-ico' }, icon(s.ic)),
            h('span', {}, h('strong', {}, s.title), h('small', {}, s.text)),
            h('span', { class: 'cp-go' }, icon('arrow'))))))),
    };
  }

  // ---------- mimosemestr_zapis.pl ----------
  const EXTRA_ROLE = (t) => (/^(sel|ozn)/.test(t) ? 'pick' : /^(course|predmet|nazev)$/.test(t) ? 'title' : /^(crd|kr)/.test(t) ? 'meta'
    : /(enrol\w* till|enrol\w* to|zapis do)/.test(t) ? 'meta' : /(note|poznamka|timetable|rozvrh)/.test(t) ? 'note' : 'sub');
  function extra(page) {
    const tables = [...page.querySelectorAll('table')].filter((t) => !t.classList.contains('portal_menu') && !t.closest('.uisLegend')
      && L.columns(t).some((x) => /^(code|kod)$/.test(norm(x))));
    const lists = tables.map((table) => {
      const b = headingBefore(table) || headingBefore(table.closest('form') || table);
      const text = norm(b?.textContent || '');
      const kind = table.querySelector('input[type="checkbox"]') || /in progress|probiha/.test(text) ? 'open' : /future|budouc/.test(text) ? 'later'
        : /over|skoncil|ukoncen/.test(text) ? 'over' : /enrolled|zapsan/.test(text) ? 'enrolled' : 'open';
      const { rows } = L.mark(table, EXTRA_ROLE, { title: { open: T.openNow, later: T.later, over: T.over, enrolled: T.enrolledExtra }[kind] });
      iconWords(table);
      if (b) ipx.ui.hideInSlot([b]);
      if (kind === 'over') table.setAttribute('data-il-fold', '');
      return { table, kind, rows };
    });
    const count = (k) => lists.filter((l) => l.kind === k).reduce((s, l) => s + l.rows.length, 0);
    // The selection form: a card around InSIS's list and its button, with the line on what the button does.
    const selection = lists.find((l) => l.kind === 'open' && l.table.closest('form'))?.table.closest('form');
    selection?.setAttribute('data-il-form', T.extraLead);
    // The filter form (Restrict): a card, folded under Filter unless InSIS shows a filtered list.
    const filter = [...page.querySelectorAll('form')].find((f) => f !== selection && f.querySelector('select') && !f.querySelector('table[data-il]'));
    const filtered = !!filter && [...filter.querySelectorAll('select')].some((s) => s.selectedIndex > 0);
    if (filter) {
      filter.setAttribute('data-il-form', T.filterLead);
      filter.setAttribute('data-il-fold', '');
      if (filtered) document.documentElement.classList.add('ipx-il-filter');
      const fb = headingBefore(filter);
      if (fb) ipx.ui.hideInSlot([fb]);
    }
    // The page's own title line, InSIS's "enrolled" heading and, when the lead repeats it, its message under that
    // heading ("You are not enrolled in any …"); the payment card logos (decoration) and the legend (its sample
    // checkbox keeps chrome() from hiding it). Any other InSIS message stays.
    const enrolled = count('enrolled');
    const enrolledMsg = [...page.querySelectorAll('.uis_msg.info')].find((m) => /enrolled|zapsan/.test(norm(headingBefore(m)?.textContent || '')));
    const repeated = enrolledMsg && !enrolled ? [enrolledMsg] : [];
    const logos = [...page.querySelectorAll('table')].filter((t) => t.querySelector('img[sysid^="payment-"]') && !t.querySelector('a, input'));
    const loose = [...page.querySelectorAll('b')].filter((b) => !b.closest('table, form, .uis_msg') && b.parentElement?.closest('#str1') && !b.hasAttribute('data-ipx-keep'));
    ipx.ui.hideInSlot([...repeated, ...logos, ...loose, ...page.querySelectorAll('.uisLegend')]);
    found = {
      lead: () => {
        const filterBtn = filter && h('button', { type: 'button', class: 'btn ghost', 'aria-expanded': String(filtered), onclick: (e) => {
          const on = document.documentElement.classList.toggle('ipx-il-filter');
          e.currentTarget.setAttribute('aria-expanded', String(on));
        } }, icon('search'), h('span', {}, T.filter));
        const over = count('over');
        const overBtn = over > 0 && h('button', { type: 'button', class: 'btn ghost', onclick: (e) => {
          const on = document.documentElement.classList.toggle('ipx-il-unfold');
          e.currentTarget.lastChild.textContent = on ? T.hideOver : T.showOver(over);
        } }, icon('chevron'), h('span', {}, T.showOver(over)));
        return h('div', { class: 'cp-lead' },
          h('p', { class: 'cp-facts' },
            h('span', { class: `delta ${enrolled ? 'ok' : 'neutral'}` }, T.enrolledN(enrolled)),
            h('span', { class: 'delta neutral' }, T.openN(count('open'))),
            count('later') > 0 && h('span', { class: 'delta neutral' }, T.laterN(count('later')))),
          repeated[0] && h('p', { class: 'muted small' }, clean(repeated[0].textContent)),
          filter && L.onlyLine(filter.querySelectorAll('select'), T),
          (filterBtn || overBtn) && h('p', { class: 'cp-facts' }, filterBtn, overBtn));
      },
    };
  }

  // ---------- vs_registrace.pl ----------
  function minor(page) {
    const tabs = kit.insisTabs(page)[0] || [];
    const views = tabs.map((t) => ({ id: /zalozka=4/.test(t.href) ? 'stats' : 'catalogue', href: t.href, text: /zalozka=4/.test(t.href) ? T.statistics : T.catalogue }));
    const table = [...page.querySelectorAll('table')].find((t) => !t.closest('form') && !t.classList.contains('portal_menu') && L.columns(t).some((x) => /^(code|kod)$/.test(norm(x))));
    let total = 0;
    let free = 0;
    if (table) {
      const { rows, cols } = L.mark(table, (t) => (/^(code|kod)$/.test(t) ? 'lead' : /^(name|nazev)$/.test(t) ? 'title' : /(department|pracoviste|garant)/.test(t) ? 'sub'
        : /(capacity|kapacita|vacanc|volna)/.test(t) ? 'meta' : /(print|tisk)/.test(t) ? 'act' : 'sub'), { stretch: true, sort: true });
      table.querySelector('tr[data-il-head="sort"]')?.setAttribute('data-il-sort', T.sortBy);
      const vac = cols.findIndex((x) => /(vacanc|volna)/.test(norm(x)));
      total = rows.length;
      for (const tr of rows) {
        tr.querySelectorAll('td[data-il-col="act"] a[href]').forEach((a) => L.label(a, T.print));
        const cell = vac >= 0 ? tr.querySelectorAll('td[data-il-col]:not([data-il-col="num"])')[vac] : null;
        const n = Number(clean(cell?.textContent));
        if (cell && Number.isFinite(n) && clean(cell.textContent) !== '') {
          if (n > 0) free++;
          else { cell.setAttribute('data-il-chip', T.full); cell.setAttribute('data-il-tone', 'bad'); }
        }
      }
    }
    const forms = [...page.querySelectorAll('form')];
    forms.find((f) => f.querySelector('select'))?.setAttribute('data-il-form', T.unitLead);
    forms.find((f) => !f.querySelector('select') && f.querySelector('input[type="submit"]'))?.setAttribute('data-il-form', T.brochure);
    found = {
      views,
      lead: () => h('div', { class: 'cp-lead' },
        total > 0 && h('p', { class: 'cp-facts' }, h('span', { class: 'delta neutral' }, T.tracks(total)), h('span', { class: 'delta ok' }, T.free(free))),
        h('p', { class: 'muted small' }, T.minorLead)),
    };
  }

  // ---------- oblibene_predmety.pl ----------
  function favourites(page) {
    const table = [...page.querySelectorAll('table')].find((t) => !t.classList.contains('portal_menu') && L.columns(t).length > 1);
    let count = 0;
    if (table) {
      const { rows } = L.mark(table, (t) => (/^(code|kod)$/.test(t) ? 'lead' : /(course|predmet|nazev)/.test(t) ? 'title' : /^(sel|ozn|odebrat|remove)/.test(t) ? 'act' : 'sub'), { title: T.fav });
      count = rows.length;
      iconWords(table);
      table.closest('form')?.setAttribute('data-il-holder', '');
    }
    // Without favourites InSIS's own sentence (it says how to add one) becomes the empty state.
    const msg = !count ? page.querySelector('.uis_msg') : null;
    if (msg) ipx.ui.hideInSlot([msg]);
    found = {
      lead: () => h('div', { class: 'cp-lead' },
        count > 0 && h('p', { class: 'cp-facts' }, h('span', { class: 'delta neutral' }, T.courses(count))),
        count > 0 ? h('p', { class: 'muted small' }, T.favLead)
          : h('div', { class: 'empty' }, h('p', {}, h('strong', {}, T.favEmpty)), h('p', {}, clean(msg?.querySelector('.text')?.textContent).replace(/^[^.]*\.\s*/, '') || T.favLead))),
    };
  }

  ipx.ready.then(() => {
    const key = pathKey();
    if (!key || key === 'stats') return;
    const page = document.getElementById('str1');
    if (!page) return;
    if (key === 'minor' && route().params?.get?.('detail')) return; // a track's detail page: generic.js frames it
    ({ reg: registration, extra, minor, fav: favourites })[key](page);
    L.chrome(page);
    L.on(`ipx-reg-${key}`);
  });
})();
