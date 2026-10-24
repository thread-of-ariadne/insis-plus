// InSIS+ — course catalogue search (katalog/index.pl).
// The original form and its filters are moved into the InSIS+ shell as they are (slotted, not copied),
// so InSIS's own scripts keep working; only the presentation and the result list change.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.ui) return;
  const { clean, lang } = ipx;
  const { h, takeover, cover, facultyOf, facultyColors, T: UI } = ipx.ui;

  // The people search (lide/) uses the same search field: the catalogue is recognised by its address first.
  if (ipx.nav && ipx.nav.route(document.baseURI.split('#')[0]).path !== '/auth/katalog/') return;
  const input = document.querySelector('input.uisSearchInput[name="vzorek"]');
  const page = document.getElementById('str1');
  if (!input || !page) return;

  const T = {
    cs: { placeholder: 'Název nebo kód předmětu, např. 4IT431', filters: 'Filtry: fakulta a období',
      found: (n) => `Nalezené předměty: ${n}` },
    en: { placeholder: 'Course name or code, e.g. 4IT431', filters: 'Filters: faculty and period',
      found: (n) => `Courses found: ${n}` },
  }[lang];

  document.documentElement.classList.add('ipx-cat');
  ipx.ui.styleSlotted('catalog.css');
  input.placeholder = T.placeholder;
  input.setAttribute('autocomplete', 'off');

  // Results: "<bullet>&nbsp;<a>4IT431 Digital Transformation</a> - WS 2026/2027 - FIS<br>" repeated.
  // Several semesters of one course become one card with a chip per semester.
  const links = [...page.querySelectorAll('a[href*="syllabus.pl"]')].filter((a) => !a.closest('table'));
  if (links.length) {
    const courses = new Map();
    const remove = [];
    for (const a of links) {
      const spacer = a.previousSibling?.nodeType === Node.TEXT_NODE ? a.previousSibling : null;
      const bullet = (spacer || a).previousSibling;
      const after = a.nextSibling?.nodeType === Node.TEXT_NODE ? a.nextSibling : null;
      const br = after?.nextSibling?.nodeName === 'BR' ? after.nextSibling : null;

      const [, code = '', name = clean(a.textContent)] = clean(a.textContent).match(/^(\S+)\s+(.+)$/) || [];
      const [semester = '', faculty = ''] = clean(after?.nodeValue).replace(/^-\s*/, '').split(/\s+-\s+/);
      const isBullet = bullet?.matches?.('[data-dept-bullet]');

      const key = `${code}|${name}|${faculty}`;
      if (!courses.has(key)) courses.set(key, { code, name, faculty, items: [] });
      courses.get(key).items.push({ href: a.href, semester });

      remove.push(...[isBullet && bullet, spacer, a, after, br].filter(Boolean));
    }

    const list = h('div', { class: 'ipx-results' },
      h('p', { class: 'ipx-count' }, T.found(courses.size)),
      [...courses.values()].map((c) => {
        const fac = facultyOf(c.faculty);
        return h('div', { class: 'ipx-course' },
          h('a', { class: 'ipx-main', href: c.items[0].href },
            cover(c.code, fac, 48, 48),
            c.code && h('span', { class: 'ipx-code', style: `color: ${facultyColors(fac)[1]}` }, c.code),
            h('span', { class: 'ipx-name' }, c.name),
            c.faculty && h('span', { class: 'ipx-fac' }, c.faculty)),
          h('span', { class: 'ipx-sems' },
            c.items.map((it) => h('a', { class: 'ipx-sem', href: it.href }, it.semester || '→'))));
      }));

    remove[0].before(list);
    remove.forEach((n) => n.remove());
  }

  // The long list of faculty and period checkboxes goes behind a toggle.
  const filters = page.querySelector('table.form-edit');
  if (filters) {
    const details = h('details', { class: 'ipx-filters' }, h('summary', {}, T.filters));
    filters.before(details);
    details.append(filters);
  }

  const crumbs = [...page.querySelectorAll('.breadcrumb-item')];
  ipx.ready.then(() => {
    takeover({
      key: 'catalog',
      title: clean(crumbs[1]?.textContent) || UI.catalogue,
      subtitle: clean(crumbs.at(-1)?.textContent) || null,
      slotted: [page],
    });
    if (!input.value) input.focus();
  });
})();
