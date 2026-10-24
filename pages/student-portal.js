// InSIS+ — Student's portal (student/moje_studium.pl), rebuilt around what students come here to do.
// The original page mixes a table of studies (whose most important actions, exam and course registration, are
// unlabelled icons), a row of 11 tabs and five blocks of ~30 icons. Here: the study on top, the six main actions
// as labelled cards with live data, everything else as one short list in plain groups (with a filter), and the
// week, next classes, deadlines and contacts on the side.
// Only links are rebuilt (original hrefs); the page's form is not used and nothing is submitted.
//
// Stored for the dashboard, the sidebar and the background sync (plain data, no HTML):
// ipx.state.portal = {
//   updated, source,
//   study: { faculty, name, detail, progress, restriction } | null,
//   links: { exams, enrol, timetable, record, submissions, plan: { href, text } | undefined },
//   paths: { '/auth/student/…pl': { href, text } }   (every portal link, by path)
// }
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.ui) return;
  const { clean, norm, lang } = ipx;
  const { h, icon, anchor, takeover, PORTAL_ACTIONS, nextClasses, classDays, weekStrip, deadlineList,
    facultyColors } = ipx.ui;

  const T = {
    cs: { title: 'Portál studenta', main: 'Hlavní', more: 'Všechno ostatní', filter: 'Hledat v portálu',
      nothing: 'Nic takového tu není.', otherStudies: 'Další studia', schedule: 'Nejbližší hodiny', fullSchedule: 'Rozvrh →',
      noSchedule: 'Rozvrh se načítá na pozadí, nebo ho otevřete v kartě Můj rozvrh.', deadlines: 'Termíny odevzdání',
      allDeadlines: 'Odevzdávárny →', help: 'Kontakty a pomoc', insisHelp: 'Nápověda InSIS',
      groups: { study: 'Studium', calendar: 'Kalendář a omluvenky', docs: 'Dokumenty a ankety', money: 'Finance', other: 'Ostatní' } },
    en: { title: "Student's portal", main: 'Main', more: 'Everything else', filter: 'Search the portal',
      nothing: 'Nothing like that here.', otherStudies: 'Other studies', schedule: 'Next classes', fullSchedule: 'Timetable →',
      noSchedule: 'Your timetable is loading in the background, or open it from My timetable.', deadlines: 'Deadlines',
      allDeadlines: 'Submissions →', help: 'Contacts and help', insisHelp: 'InSIS help',
      groups: { study: 'Study', calendar: 'Calendar and excuses', docs: 'Documents and surveys', money: 'Money', other: 'Other' } },
  }[lang];

  // Our own groups for the remaining applications (by address; InSIS's own blocks mix unrelated things).
  const GROUPS = [
    ['calendar', /prehled_tydnu|harmonogram|omluvenk|mimosemestr/],
    ['money', /financ|stip|bank/],
    ['docs', /tisk|uloziste|anketk|dotaznik|evaluace/],
    ['study', /student\/|studijni|elis|zp_|diplom|registrace|zkousk|terminy/],
  ];
  const CONTACTS = /stud_odd|kc\.pl/;

  // Icon per application, by address.
  const ICON_BY = [
    [/terminy|zkousk/, 'check'], [/registrace|zapis/, 'list'], [/rozvrh|harmonogram|tydnu|mimosemestr/, 'calendar'],
    [/omluvenk|tisk|list\.pl|diplom|zp_/, 'file'], [/spoluzaci|stud_odd/, 'people'], [/kc\.pl/, 'mail'], [/uloziste|mapa/, 'layers'],
    [/anketk|evaluace|oblibene/, 'star'], [/praxe/, 'cpu'], [/financ|stip|bank/, 'award'], [/int\//, 'globe'],
    [/fotk/, 'people'], [/osnov/, 'book'], [/temata/, 'list'], [/studium\.pl/, 'cap'],
  ];
  // Addresses are compared without their query: many carry a link back to the portal (zpet=…/student/…).
  const path = (href) => new URL(href).pathname;
  const iconFor = (href) => ICON_BY.find(([re]) => re.test(path(href)))?.[1] || 'layers';

  // ---------- reading the original page ----------

  const linkOf = (a, label) => ({
    href: a.href,
    target: a.target || null,
    text: clean(label || a.querySelector('.app-ikona-text')?.textContent || a.textContent || a.title ||
      a.querySelector('[aria-label]')?.getAttribute('aria-label')),
  });

  function parse() {
    const page = document.getElementById('str1');
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
        active: /aktivni/.test(status?.dataset.sysid || ''),
        choose: cells[0]?.querySelector('a[href]') && linkOf(cells[0].querySelector('a[href]'), headers[0]),
        faculty: clean(cells[1]?.textContent),
        name: [...(cells[2]?.querySelectorAll('b') || [])].flatMap((b) => b.innerText.split('\n')).map(clean).filter(Boolean),
        progress: clean(cells[3]?.textContent),
        restriction: clean(cells[4]?.textContent),
        // Each action icon's own label (aria-label) is clearer than the column header.
        actions: cells.slice(5).flatMap((c) => [...c.querySelectorAll('a[href]')].map((a) =>
          linkOf(a, a.querySelector('[aria-label]')?.getAttribute('aria-label')))),
      };
    }).filter((s) => s.faculty || s.name.length) : [];

    const icons = [...page.querySelectorAll('.rada-ikon a.app-ikona[href]')].map((a) => linkOf(a));
    const help = page.querySelector('.helpinbreadcrumbs a[href]');
    const study = studies.find((s) => s.active) || studies[0] || null;

    // Every link once (the study's own icons first: their labels are the clearest), then sort them out.
    const seen = new Set([location.href.split('#')[0]]);
    const all = [...(study?.actions || []), ...tabsRow.filter((t) => !t.on), ...icons]
      .filter((l) => l.text && !/moje_studium\.pl$/.test(new URL(l.href).pathname) && !seen.has(l.href) && seen.add(l.href));
    const used = new Set();
    const links = {};
    for (const a of PORTAL_ACTIONS) {
      const l = all.find((x) => a.re.test(x.href));
      if (l) {
        links[a.id] = { href: l.href, text: l.text };
        used.add(l.href);
      }
    }
    // The e-index is the same page as the study record.
    for (const l of all) if (/pruchod_studiem\.pl/.test(path(l.href))) used.add(l.href);
    const contacts = all.filter((l) => !used.has(l.href) && CONTACTS.test(path(l.href)));
    contacts.forEach((l) => used.add(l.href));
    const rest = all.filter((l) => !used.has(l.href));
    const groupOf = (l) => GROUPS.find(([, re]) => re.test(path(l.href)))?.[0] || 'other';
    const groups = ['study', 'calendar', 'docs', 'money', 'other'].map((id) => ({
      id,
      title: T.groups[id],
      items: rest.filter((l) => groupOf(l) === id),
    })).filter((g) => g.items.length);

    return { head, study, others: studies.filter((s) => s !== study), links, contacts, groups, all,
      help: help && { href: help.href, target: '_blank' } };
  }

  function remember(d) {
    const s = d.study;
    ipx.state.portal = {
      updated: Date.now(),
      source: location.href,
      study: s && { faculty: s.faculty, name: s.name[0] || '', detail: s.name.slice(1).join(', '), progress: s.progress, restriction: s.restriction || '' },
      links: d.links,
      // Every portal link by page path, copied verbatim: the new navigation (nav.js) reaches InSIS pages through
      // the student's own links, which carry the right study and period.
      paths: Object.fromEntries(d.all.map((l) => [new URL(l.href).pathname.replace(/\/index\.pl$/, '/'), { href: l.href, text: l.text }])),
    };
    ipx.save();
  }

  // ---------- building the new page ----------

  const row = (l) => anchor(l, { class: 'sp-link', title: l.text }, h('span', { class: 'sp-link-icon' }, icon(iconFor(l.href))), h('span', {}, l.text));

  function buildMore(d) {
    const filter = h('input', { class: 'sp-filter', type: 'search', placeholder: T.filter, 'aria-label': T.filter, autocomplete: 'off' });
    const body = h('div', { class: 'sp-cols' });
    const render = () => {
      const q = norm(filter.value);
      const match = (l) => !q || q.split(' ').every((w) => norm(l.text).includes(w));
      const groups = d.groups.map((g) => ({ ...g, items: g.items.filter(match) })).filter((g) => g.items.length);
      body.replaceChildren(...(groups.length
        ? groups.map((g) => h('section', { class: 'sp-col' }, h('h3', {}, g.title), g.items.map(row)))
        : [h('p', { class: 'muted' }, T.nothing)]));
    };
    filter.addEventListener('input', render);
    filter.addEventListener('keydown', (e) => e.stopPropagation());
    render();
    return h('section', { class: 'card sp-more' },
      h('div', { class: 'card-head' }, h('h2', {}, T.more), h('span', { class: 'sp-filter-wrap' }, icon('search'), filter)),
      body);
  }

  function buildPage(d) {
    const study = d.study;
    const tt = ipx.state.timetable;
    const ttHref = d.links.timetable?.href || tt?.source;
    const upcoming = tt && nextClasses(tt.events, ttHref);
    const sub = ipx.state.submissions;

    return h('div', { class: 'sp' },
      h('div', { class: 'sp-main' },
        study && h('section', { class: 'card sp-study' },
          h('span', { class: 'sp-badge', style: `--fac: ${facultyColors(study.faculty)[1]}` }, study.faculty || '—'),
          h('span', { class: 'sp-study-text' },
            h('strong', {}, study.name[0] || d.head[0] || ''),
            h('small', {}, [study.name.slice(1).join(', '), d.head[1]].filter(Boolean).join(' · '))),
          h('span', { class: 'sp-study-side' },
            study.progress && h('span', { class: 'delta ' + (study.active ? 'ok' : 'neutral') }, study.progress),
            study.restriction && h('span', { class: 'delta warn' }, study.restriction))),


        buildMore(d),

        d.others.length > 0 && h('section', { class: 'card sp-more' },
          h('div', { class: 'card-head' }, h('h2', {}, T.otherStudies)),
          h('ul', { class: 'sp-others' }, d.others.map((s) => h('li', {},
            h('b', {}, s.faculty), h('span', {}, s.name.join(', ')), h('span', { class: 'delta neutral' }, s.progress),
            s.choose && anchor(s.choose, { class: 'more' }, s.choose.text || '→')))))),

      h('aside', { class: 'rail' },
        weekStrip(new Date(), classDays(tt?.events)),
        h('section', {},
          h('div', { class: 'card-head' }, h('h2', {}, T.schedule), ttHref && anchor({ href: ttHref }, { class: 'more' }, T.fullSchedule)),
          upcoming || h('p', { class: 'muted rail-empty' }, T.noSchedule)),
        sub && h('section', {},
          h('div', { class: 'card-head' }, h('h2', {}, T.deadlines), anchor({ href: d.links.submissions?.href || sub.source }, { class: 'more' }, T.allDeadlines)),
          deadlineList(sub.boxes) || h('p', { class: 'muted rail-empty' }, lang === 'cs' ? 'Žádná otevřená odevzdávárna nečeká.' : 'No open submission box is waiting.')),
        (d.contacts.length > 0 || d.help) && h('section', {},
          h('div', { class: 'card-head' }, h('h2', {}, T.help)),
          h('div', { class: 'sp-contacts' },
            d.contacts.map(row),
            d.help && anchor({ ...d.help, text: T.insisHelp }, { class: 'sp-link' },
              h('span', { class: 'sp-link-icon' }, icon('alert')), h('span', {}, T.insisHelp))))));
  }

  ipx.ready.then(() => {
    const data = parse();
    if (!data) return;
    remember(data);
    takeover({
      key: 'student-portal',
      css: 'pages/student-portal.css',
      // In the new structure the portal is Study matters › Study status (its links live in the navigation now).
      title: ipx.nav ? ipx.nav.label('studies.status') : T.title,
      subtitle: [T.title, data.head[1]].filter(Boolean).join(' · '),
      build: () => {
        // Redrawn when the background sync brings the timetable, credits or deadlines.
        const wrap = h('div', {});
        const render = () => wrap.replaceChildren(buildPage(data));
        render();
        ipx.onData(render);
        return wrap;
      },
    });
  });
})();
