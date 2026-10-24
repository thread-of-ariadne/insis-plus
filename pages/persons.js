// InSIS+ — Campus › People: search (lide/). Treatment F (docs/ia/03-pages.md, teardowns/campus-messages-account.md
// §2.2).
// InSIS shows a help paragraph, one form (the name field with InSIS's suggest widget, Search, and a layout table of
// twelve pre-ticked checkboxes: eight faculties/units and four kinds of person) and a tip box selling graduate lists.
// Here: one line on how the search works, InSIS's own form element as a form card (slotted, never filled, never
// sent by InSIS+), the checkboxes styled in place as two groups behind "Narrow the search" (CSS and data- attributes
// only: every input stays in the form with the value InSIS gave it), any result table InSIS shows outside the form
// redrawn as rows with InSIS's own person links (URL rule), and the student's teachers this semester beside it (from
// the timetable already read), which answers the most common search without searching. The tip box is dropped.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.kit || !ipx.nav) return;
  const { lang, clean } = ipx;
  const { h, icon, styleSlotted } = ipx.ui;
  const kit = ipx.kit;
  const nav = ipx.nav;

  const T = {
    cs: { lead: 'Hledejte podle jména, příjmení nebo loginu (stačí tři písmena, bez diakritiky). InSIS hledá, až stisknete Hledat.',
      search: 'Hledat osobu', narrow: 'Upřesnit hledání', where: 'Kde', who: 'Koho', units: (a, b) => `${a} z ${b} součástí`,
      nobody: 'nikoho', results: 'Výsledky', mine: 'Vaši vyučující v tomto semestru', mineLead: 'Z vašeho rozvrhu: bez hledání.' },
    en: { lead: 'Search by first name, surname or login (three letters are enough, no accents needed). InSIS searches when you press Search.',
      search: 'Find a person', narrow: 'Narrow the search', where: 'Where', who: 'Who', units: (a, b) => `${a} of ${b} units`,
      nobody: 'nobody', results: 'Results', mine: 'Your teachers this semester', mineLead: 'From your timetable: no search needed.' },
  }[lang];

  // The text InSIS writes right after a checkbox ("&nbsp;Faculty of Management") is its label.
  const labelOf = (input) => clean(input.nextSibling?.nodeType === 3 ? input.nextSibling.textContent : '');

  function parse() {
    const page = document.getElementById('str1');
    const form = page?.querySelector('form[action*="/lide/"]');
    if (!form?.querySelector('input[name="vzorek"]')) return null;
    const boxes = (name) => [...form.querySelectorAll(`input[type="checkbox"][name="${name}"]`)];
    // The layout table that holds the two checkbox groups (inside the form: styled in place, never moved).
    const groups = form.querySelector('table:has(input[type="checkbox"])');
    // Result tables InSIS draws outside the form (the response of a search); a table inside the form stays InSIS's.
    const results = kit.findTables(page).filter((t) => !form.contains(t)).map((t) => kit.readTable(t));
    return { page, form, groups, units: boxes('subjekt'), kinds: boxes('upresneni'), results, messages: kit.messages(page) };
  }

  // What the hidden checkboxes currently say, read (never set): "8 of 8 units · Students, Staff".
  function scope(d) {
    const on = d.units.filter((b) => b.checked).length;
    const kinds = d.kinds.filter((b) => b.checked).map(labelOf).filter(Boolean);
    return [d.units.length && T.units(on, d.units.length), d.kinds.length && (kinds.join(', ') || T.nobody)].filter(Boolean).join(' · ');
  }

  // Marks InSIS's checkbox table for persons.css: the two cells become captioned groups, the spacer cell goes.
  function markGroups(d) {
    d.form.setAttribute('data-ipx-persons', 'closed');
    if (!d.groups) return;
    d.groups.setAttribute('data-ipx-groups', '');
    for (const td of d.groups.querySelectorAll('td')) {
      if (td.querySelector('input[name="subjekt"]')) td.setAttribute('data-ipx-caption', T.where);
      else if (td.querySelector('input[name="upresneni"]')) td.setAttribute('data-ipx-caption', T.who);
      else td.setAttribute('data-ipx-spacer', '');
    }
  }

  // "Narrow the search": a disclosure outside the form that only toggles a data- attribute on it.
  function narrowToggle(d) {
    if (!d.groups) return null;
    const summary = h('small', {}, scope(d));
    const btn = h('button', { type: 'button', class: 'ppl-narrow', 'aria-expanded': 'false' },
      icon('chevron'), h('span', { class: 'ppl-narrow-text' }, h('strong', {}, T.narrow), summary));
    btn.addEventListener('click', () => {
      const open = d.form.getAttribute('data-ipx-persons') !== 'open';
      d.form.setAttribute('data-ipx-persons', open ? 'open' : 'closed');
      btn.setAttribute('aria-expanded', String(open));
      summary.textContent = scope(d);
    });
    return btn;
  }

  // The form card (InSIS's form slotted in it) with the disclosure under the form.
  function searchCard(formCard, d) {
    const card = formCard({ title: T.search, lead: T.lead });
    const toggle = narrowToggle(d);
    if (toggle) card.append(toggle);
    return card;
  }

  function resultTable(r) {
    if (!r.rows.length) return null;
    const columns = r.head.map((label, i) => ({ key: `c${i}`, label, main: i === 0 }));
    const rows = r.rows.map((row) => Object.assign({}, ...row.cells.map((c, i) => ({ [`c${i}`]: c.links.length === 1 ? { ...c.links[0], text: c.text || c.links[0].text } : c.text }))));
    return kit.dataTable({ columns, rows, label: T.results });
  }

  ipx.ready.then(() => {
    if (nav.route(document.baseURI.split('#')[0]).path !== '/auth/lide/') return;
    const data = parse();
    if (!data) return;
    markGroups(data);
    // persons.css styles the slotted form in the page's own DOM and the InSIS+ parts in the shadow root.
    styleSlotted('pages/persons.css');
    const mine = ipx.composed?.teachers?.() || [];
    const results = data.results.map(resultTable).filter(Boolean);

    kit.page({
      key: 'persons',
      css: 'pages/persons.css',
      title: nav.sectionLabel('campus.people'),
      subtitle: nav.label('campus'),
      form: data.form,
      build: ({ formCard }) => [
        ...data.messages.filter((m) => m.tone !== 'info').map(kit.note),
        h('div', { class: mine.length ? 'kit-cols' : 'kit-stack' },
          h('div', { class: 'kit-stack' },
            searchCard(formCard, data),
            results.length > 0 && h('section', { class: 'kit-stack' }, h('h2', { class: 'ppl-title' }, T.results), results)),
          mine.length > 0 && h('aside', { class: 'card pad ppl-mine' },
            h('h2', { class: 'card-title' }, T.mine),
            h('p', { class: 'muted small' }, T.mineLead),
            ipx.composed.teacherGrid(mine))),
      ],
    });
  });
})();
