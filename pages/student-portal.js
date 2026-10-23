// InSIS+ — Student's portal (student/moje_studium.pl), rebuilt around what students come here to do.
// The original page mixes a table of studies (whose most important actions — exam and course registration —
// are unlabelled icons), a row of 11 tabs and four blocks of icons. Here: the study on top, the main actions as
// labelled cards, everything else grouped below, next classes and contacts on the side.
// Only links are rebuilt (original hrefs); the page's form is not used and nothing is submitted.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.ui) return;
  const { clean, norm, lang } = ipx;
  const { h, icon, anchor, takeover, nextClasses, classDays, weekStrip, facultyColors } = ipx.ui;

  const T = {
    cs: { title: 'Portál studenta', todo: 'Co potřebujete udělat', more: 'Další možnosti', study: 'Studium',
      active: 'aktivní', otherStudies: 'Další studia', schedule: 'Nejbližší hodiny', fullSchedule: 'Rozvrh →',
      noSchedule: 'Otevřete osobní rozvrh a ukážou se tu nejbližší hodiny.', help: 'Kontakty a pomoc',
      sections: 'Všechny aplikace portálu' },
    en: { title: "Student's portal", todo: 'What do you need to do', more: 'More', study: 'Study',
      active: 'active', otherStudies: 'Other studies', schedule: 'Next classes', fullSchedule: 'Timetable →',
      noSchedule: 'Open your personal timetable and your next classes will show up here.', help: 'Contacts and help',
      sections: 'All portal applications' },
  }[lang];

  // The main actions, in this order. Matched on the link's address (stable) rather than its label.
  // Short names of our own (InSIS's labels are long and stay as the tooltip). name, desc: [cs, en]
  const ACTIONS = [
    { id: 'exams', re: /terminy_seznam\.pl/, icon: 'check', name: ['Zkoušky', 'Exams'], desc: ['Termíny a přihlášení na zkoušky', 'Exam dates and registration'] },
    { id: 'enrol', re: /\/registrace\.pl/, icon: 'list', name: ['Zápis předmětů', 'Course registration'], desc: ['Zápis a změny po zápisu', 'Enrolment and later changes'] },
    { id: 'timetable', re: /rozvrhy_view\.pl.*rozvrh_student/, icon: 'calendar', name: ['Rozvrh', 'Timetable'], desc: ['Vaše hodiny po týdnech', 'Your classes week by week'] },
    { id: 'record', re: /pruchod_studiem\.pl/, icon: 'award', name: ['Studijní výsledky', 'Study record'], desc: ['Známky, kredity a pokusy', 'Grades, credits and attempts'] },
    { id: 'submissions', re: /odevzdavarny\.pl/, icon: 'file', name: ['Odevzdávárny', 'Submissions'], desc: ['Odevzdání prací a termíny', 'Hand-ins and deadlines'] },
    { id: 'plan', re: /studijni_povinnosti\.pl/, icon: 'layers', name: ['Kontrola plánu', 'Plan check'], desc: ['Co ještě musíte splnit', 'What is left to complete'] },
  ];

  // Icon for the remaining applications, by InSIS's own icon id (data-sysid) or address.
  const ICON_BY = [
    [/zkousk|terminy/, 'check'], [/zapis|registrace/, 'list'], [/mimosemestr/, 'calendar'], [/diplom|zp_/, 'file'],
    [/rozvrh/, 'calendar'], [/harmonogram|tydnu/, 'clock'], [/oddeleni|stud_odd|spoluzaci/, 'people'], [/kc/, 'mail'],
    [/omluvenk/, 'file'], [/tisk/, 'file'], [/uloziste/, 'layers'], [/evaluace|anketk/, 'star'], [/firma|praxe/, 'cpu'],
    [/fin|stipend|bank/, 'award'], [/ubytovani/, 'home'], [/pobyt|int\//, 'globe'], [/fotk/, 'people'],
    [/mapa/, 'layers'], [/osnov/, 'book'], [/temata/, 'list'], [/list\.pl/, 'file'], [/oblibene/, 'star'], [/studium\.pl/, 'cap'],
  ];
  const iconFor = (key) => ICON_BY.find(([re]) => re.test(key))?.[1] || 'layers';

  // ---------- reading the original page ----------

  const linkOf = (a, label) => ({
    href: a.href,
    target: a.target || null,
    text: clean(label || a.querySelector('.app-ikona-text')?.textContent || a.textContent || a.title ||
      a.querySelector('[aria-label]')?.getAttribute('aria-label')),
    key: `${a.querySelector('[data-sysid]')?.dataset.sysid || ''} ${a.getAttribute('href')}`,
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
        statusText: clean(status?.getAttribute('aria-label')),
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

    // Icon blocks: a bold title, a short description, then a .rada-ikon row of labelled icons.
    const sections = [...page.querySelectorAll('.rada-ikon')].map((row) => {
      let title = '';
      let desc = '';
      for (let el = row.closest('table') || row; el && !title; el = el.previousElementSibling) {
        if (!desc && el.matches?.('.small')) desc = clean(el.textContent);
        if (el.tagName === 'B') title = clean(el.textContent);
      }
      return { title, desc, items: [...row.querySelectorAll('a.app-ikona[href]')].map((a) => linkOf(a)) };
    }).filter((s) => s.items.length);

    const crumbs = [...page.querySelectorAll('.breadcrumb-item')].map((li) => clean(li.textContent)).filter(Boolean);
    const help = page.querySelector('.helpinbreadcrumbs a[href]');
    return { head, tabs: tabsRow, studies, sections, crumbs, help: help && { href: help.href, target: '_blank' } };
  }

  // ---------- building the new page ----------

  function actionCard(a, link) {
    const i = lang === 'cs' ? 0 : 1;
    return anchor(link, { class: 'card sp-action', title: link.text },
      h('span', { class: 'sp-action-icon' }, icon(a.icon)),
      h('span', { class: 'sp-action-text' }, h('strong', {}, a.name[i]), h('small', {}, a.desc[i])),
      h('span', { class: 'sp-go' }, icon('arrow')));
  }

  function tile(link) {
    return anchor(link, { class: 'sp-tile' }, h('span', { class: 'tile-icon' }, icon(iconFor(link.key))), h('span', {}, link.text));
  }

  function buildPage(d) {
    const study = d.studies.find((s) => s.active) || d.studies[0];
    const others = d.studies.filter((s) => s !== study);

    // Every link on the page once, then pick the main actions out of them.
    const all = [...(study?.actions || []), ...d.tabs, ...d.sections.flatMap((s) => s.items)];
    const seen = new Set();
    const unique = all.filter((l) => !seen.has(l.href) && seen.add(l.href));
    const used = new Set();
    const main = ACTIONS.map((a) => {
      const link = unique.find((l) => a.re.test(l.href));
      if (link) used.add(link.href);
      return link && actionCard(a, link);
    }).filter(Boolean);

    // Contacts go to the rail, not to a group.
    const contacts = unique.filter((l) => !used.has(l.href) && /stud_odd|kc\.pl/.test(l.href));
    contacts.forEach((l) => used.add(l.href));

    // The rest, grouped: the study's own links (tabs and table icons), then InSIS's icon blocks.
    const studyLinks = [...(study?.actions || []), ...d.tabs.filter((t) => !t.on)].filter((l) => !used.has(l.href) && used.add(l.href));
    const groups = [
      { title: T.study, items: studyLinks },
      ...d.sections.map((s) => ({ title: s.title, desc: s.desc, items: s.items.filter((l) => !used.has(l.href) && used.add(l.href)) })),
    ].filter((g) => g.items.length);

    const tt = ipx.state.timetable;
    const ttLink = unique.find((l) => /rozvrh_student/.test(l.href));
    const upcoming = tt && nextClasses(tt.events, ttLink?.href || tt.source);

    return h('div', { class: 'sp' },
      h('div', { class: 'sp-main' },
        study && h('section', { class: 'card sp-study' },
          h('span', { class: 'sp-badge', style: `--fac: ${facultyColors(study.faculty)[1]}` }, study.faculty || '—'),
          h('span', { class: 'sp-study-text' },
            h('strong', {}, study.name[0] || d.head[0] || ''),
            h('small', {}, [study.name.slice(1).join(', '), d.head[0]].filter(Boolean).join(' · '))),
          h('span', { class: 'sp-study-side' },
            study.progress && h('span', { class: 'delta ' + (study.active ? 'ok' : 'neutral') }, study.progress),
            study.restriction && h('span', { class: 'delta warn' }, study.restriction))),

        h('h2', { class: 'section-title sp-title' }, T.todo),
        h('div', { class: 'sp-actions' }, main),

        h('h2', { class: 'section-title sp-title' }, T.sections),
        h('div', { class: 'sp-groups' }, groups.map((g) => h('section', { class: 'card sp-group' },
          h('div', { class: 'card-head' }, h('h2', {}, g.title)),
          g.desc && h('p', { class: 'card-sub' }, g.desc),
          h('div', { class: 'sp-tiles' }, g.items.map(tile))))),

        others.length && h('section', { class: 'card sp-group' },
          h('div', { class: 'card-head' }, h('h2', {}, T.otherStudies)),
          h('ul', { class: 'sp-others' }, others.map((s) => h('li', {},
            h('b', {}, s.faculty), h('span', {}, s.name.join(', ')), h('span', { class: 'delta neutral' }, s.progress),
            s.choose && anchor(s.choose, { class: 'more' }, s.choose.text || '→')))))),

      h('aside', { class: 'rail' },
        weekStrip(new Date(), classDays(tt?.events)),
        h('section', {},
          h('div', { class: 'card-head' }, h('h2', {}, T.schedule), ttLink && anchor(ttLink, { class: 'more' }, T.fullSchedule)),
          upcoming || h('p', { class: 'muted rail-empty' }, T.noSchedule)),
        (contacts.length || d.help) && h('section', {},
          h('div', { class: 'card-head' }, h('h2', {}, T.help)),
          h('div', { class: 'sp-contacts' },
            contacts.map(tile),
            d.help && anchor({ ...d.help, text: lang === 'cs' ? 'Nápověda InSIS' : 'InSIS help' }, { class: 'sp-tile' },
              h('span', { class: 'tile-icon' }, icon('alert')), h('span', {}, lang === 'cs' ? 'Nápověda InSIS' : 'InSIS help'))))));
  }

  ipx.ready.then(() => {
    const data = parse();
    if (!data) return;
    takeover({
      key: 'student-portal',
      css: 'pages/student-portal.css',
      title: T.title,
      subtitle: data.head[1] || null,
      build: () => buildPage(data),
    });
  });
})();
