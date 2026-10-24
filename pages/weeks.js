// InSIS+ — Schedule › Academic calendar, the teaching weeks view (ca/prehled_tydnu.pl). Treatment B
// (docs/ia/03-pages.md §3; teardowns/exams-grades-schedule.md §2.9).
// InSIS's page: the portal bar, a heading, a help sentence, then either the weeks of the study period or two
// message boxes ("No study period with active courses has been found." / "The courses of the next study period
// has not been set."), which leave the student at a dead end.
// Here: the header by rule 7 (the section is Academic calendar, the destination Schedule) and
// - no weeks: an empty state that says what the message means and where the key dates are instead (Key dates is
//   the other view of the section; the view tabs stay, so the header does not change between the two views);
// - weeks: InSIS's content slotted under view tabs Key dates · Teaching weeks, with InSIS's chrome (portal bar,
//   heading, help sentence) hidden. No snapshot with weeks exists yet, so the list itself keeps InSIS's markup
//   in the shared table styles until one does.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.kit) return;
  const { lang, clean } = ipx;
  const { h, anchor, icon, takeover, styleSlotted, hideInSlot, viewTabs } = ipx.ui;
  const kit = ipx.kit;
  const nav = ipx.nav;
  const PATH = '/auth/ca/prehled_tydnu.pl';

  const T = {
    cs: { keyDates: 'Důležitá data', weeks: 'Výukové týdny', views: 'Harmonogram',
      empty: 'Přehled výukových týdnů je teď prázdný.',
      why: 'InSIS tento přehled sestaví jen tehdy, když pro vaše studium najde období s aktivními předměty, a teď žádné nenašel. Na vaši výuku ani rozvrh to nemá vliv.',
      instead: 'Začátek a konec výuky, zkouškové období a další termíny najdete v harmonogramu.',
      open: 'Otevřít harmonogram', insis: 'InSIS píše' },
    en: { keyDates: 'Key dates', weeks: 'Teaching weeks', views: 'Academic calendar',
      empty: 'There are no teaching weeks to show right now.',
      why: "InSIS builds this overview only when it finds a study period with active courses for your study, and right now it found none. This doesn't affect your classes or your timetable.",
      instead: 'When teaching starts and ends, the exam period and other dates are in the academic calendar.',
      open: 'Open the academic calendar', insis: 'InSIS says' },
  }[lang];

  // One header for both views of the section (kit.section): Key dates (harmonogram.pl, drawn by generic.js) and
  // Teaching weeks (this page). The weeks view stays a tab even when InSIS has no weeks to show: it explains why,
  // and the header does not change as the student moves between the two.
  const plainLink = (path) => nav.safe(new URL(path, document.baseURI).href, 'link');
  const calendar = kit.section({
    id: 'calendar',
    title: () => nav.sectionLabel('schedule.calendar'),
    subtitle: () => nav.label('schedule'),
    pages: { '/auth/student/harmonogram.pl': 'key', [PATH]: 'weeks' },
    views: () => {
      const key = nav.target('schedule.calendar');
      return [
        { id: 'key', href: key && nav.route(key).path !== PATH ? key : plainLink('/auth/student/harmonogram.pl'), text: T.keyDates },
        // The weeks overview needs the study and period: the student's own link (portal), or this page's address.
        { id: 'weeks', href: kit.portalLink(PATH) || (nav.route(document.baseURI.split('#')[0]).path === PATH
          ? nav.safe(document.baseURI.split('#')[0], 'link', { copied: true }) : null), text: T.weeks },
      ];
    },
  });

  // InSIS's "ko" boxes (class uis_msg ko) are not one of kit.messages()'s tones; their text is what matters here.
  const boxes = (page) => [...page.querySelectorAll('.uis_msg')].map((m) => clean((m.querySelector('.text') || m).textContent)).filter(Boolean);

  ipx.ready.then(() => {
    if (nav.route(document.baseURI.split('#')[0]).path !== PATH) return;
    const page = document.getElementById('str1');
    if (!page) return;
    const keyDates = nav.target('schedule.calendar');
    // Key dates is the section's first entry page (harmonogram.pl); never this page itself.
    const keyLink = keyDates && nav.route(keyDates).path !== PATH ? keyDates : null;
    const title = nav.sectionLabel('schedule.calendar');
    const subtitle = nav.label('schedule');
    const tables = kit.findTables(page);

    if (tables.length) {
      const chrome = [...page.querySelectorAll('nav[aria-label="breadcrumb"], #titulek, table.portal_menu, div.small')];
      // InSIS's own heading of this page: a bold line directly in the page, before the tables.
      const heading = [...page.querySelectorAll('b')].find((b) => !b.closest('table') && /week|týdn/i.test(b.textContent));
      if (heading) chrome.push(heading);
      hideInSlot(chrome);
      styleSlotted();
      takeover({
        key: 'weeks', css: ['kit.css', 'pages/weeks.css'], title, subtitle, slotted: [page],
        build: () => h('div', { class: 'kit-page' },
          kit.sectionTabs(calendar, 'weeks'),
          h('slot')),
      });
      return;
    }

    const said = boxes(page);
    kit.page({
      key: 'weeks',
      css: 'pages/weeks.css',
      title,
      subtitle,
      tabs: kit.sectionTabs(calendar, 'weeks'),
      build: () => [
        h('section', { class: 'empty wk-empty' },
          h('span', { class: 'wk-icon' }, icon('calendar')),
          h('p', { class: 'wk-title' }, T.empty),
          h('p', {}, T.why),
          h('p', {}, T.instead),
          keyLink && anchor({ href: keyLink }, { class: 'btn' }, h('span', {}, T.open), icon('arrow'))),
        said.length > 0 && h('p', { class: 'muted small wk-said' }, `${T.insis}: `, said.join(' ')),
      ],
    });
  });
})();
