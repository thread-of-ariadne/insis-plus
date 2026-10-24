// InSIS+ — Study matters › Requests: the Contact centre (kc/kc.pl and kc/, the same page). Treatment F
// (docs/ia/03-pages.md §7 decision 1, teardowns/campus-messages-account.md §2.13 and §3.2).
// InSIS shows a help line, a knowledge-base search form, and then the request forms students actually come for,
// hidden behind a script-driven folder picker (Forms › Registration and Enrollment · Scholarships · …). Here: the
// forms first, grouped by InSIS's own categories as rows, the general query on top, with a filter over the rows;
// each row is InSIS's own link to the form page, copied through the URL rule (the form pages are links only: InSIS+
// never fetches them). The knowledge-base search is InSIS's own form, slotted as a form card (never filled or sent
// by InSIS+). The help line, the picker and InSIS's own copy of the links are hidden while InSIS+ is on.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.kit || !ipx.nav) return;
  const { lang, clean, norm } = ipx;
  const { h, icon, anchor, emptyState } = ipx.ui;
  const kit = ipx.kit;
  const nav = ipx.nav;

  const T = {
    cs: { lead: 'Formulář se otevře v InSIS: tam vyberete studium, vyplníte ho a odešlete tlačítkem InSIS.',
      filter: 'Hledat formulář', general: 'Obecný dotaz', noMatch: 'Žádný formulář neodpovídá hledání.', none: 'InSIS teď nenabízí žádné formuláře.',
      kb: 'Hledat v databázi znalostí', kbLead: 'Hledá v odpovědích InSIS na časté otázky; nikomu se nic neposílá.', faq: 'Časté dotazy',
      ask: 'Nevíte, který formulář?', askText: 'Poradí studijní oddělení vaší fakulty.', forms: (n) => `${n} ${ipx.kit.plural(n, 'formulář', 'formuláře', 'formulářů')}` },
    en: { lead: 'A form opens in InSIS: you choose the study there, fill it in and send it with InSIS’s button.',
      filter: 'Find a form', general: 'General question', noMatch: 'No form matches.', none: 'InSIS offers no forms right now.',
      kb: 'Search the knowledge base', kbLead: 'Searches InSIS’s answers to common questions; nothing is sent to anyone.', faq: 'FAQ',
      ask: 'Not sure which form?', askText: 'The study department of your faculty can help.', forms: (n) => (n === 1 ? '1 form' : `${n} forms`) },
  }[lang];

  function parse() {
    const page = document.getElementById('str1');
    const picker = page?.querySelector('.kc-forms-selection');
    const form = page?.querySelector('form[action*="/kc/"]');
    if (!picker) return null;
    // Categories: InSIS's folder names by data-id ("&nbsp;&nbsp;&nbsp;&nbsp;Scholarships"); the first, top-level folder
    // ("Forms") holds the general query.
    const names = new Map([...picker.querySelectorAll('.kc-folder-name[data-id]')].map((f) => [f.dataset.id, clean(f.textContent)]));
    const top = picker.querySelector('.kc-folder-name[data-id]')?.dataset.id;
    const groups = [...picker.querySelectorAll('.kc-forms-in-folder[data-id]')].map((g) => ({
      id: g.dataset.id,
      title: names.get(g.dataset.id) || '',
      top: g.dataset.id === top,
      forms: [...g.querySelectorAll('a.kc-form-name[href]')].map((a) => ({ href: nav.safe(a.href, 'link', { copied: true }), text: clean(a.textContent) }))
        .filter((l) => l.href && l.text),
    })).filter((g) => g.forms.length);
    // Only InSIS's knowledge-base form (it carries the _dotaz field) becomes the form card.
    const kb = form?.querySelector('input[name="_dotaz"]') ? form : null;
    return { page, picker, kb, groups, tabs: kit.insisTabs(page)[0] || [], messages: kit.messages(page) };
  }

  const row = (l) => anchor(l, { class: 'rq-row' },
    h('span', { class: 'rq-icon' }, icon('file')),
    h('span', { class: 'rq-text' }, l.text),
    h('span', { class: 'rq-go' }, icon('arrow')));

  // The forms grouped by category, with a filter over the rows InSIS+ drew (InSIS's page is not touched).
  function formsList(d) {
    const general = d.groups.filter((g) => g.top).flatMap((g) => g.forms);
    const rest = d.groups.filter((g) => !g.top);
    const total = d.groups.reduce((s, g) => s + g.forms.length, 0);
    if (!total) return emptyState(T.none);
    const input = h('input', { type: 'search', class: 'rq-filter-input', placeholder: T.filter, 'aria-label': T.filter, autocomplete: 'off' });
    const body = h('div', { class: 'kit-stack rq-groups' });
    const render = () => {
      const words = norm(input.value).split(' ').filter(Boolean);
      // A word matches the form's name or its category ("abroad" finds every Study Abroad form).
      const match = (group) => (l) => words.every((w) => norm(`${group} ${l.text}`).includes(w));
      const generalHits = general.filter(match(T.general));
      const blocks = [
        generalHits.length > 0 && h('section', { class: 'card rq-group rq-general' },
          h('h2', { class: 'rq-title' }, T.general), generalHits.map((l) => row(l))),
        ...rest.map((g) => {
          const list = g.forms.filter(match(g.title));
          return list.length > 0 && h('section', { class: 'card rq-group' },
            h('div', { class: 'rq-head' }, h('h2', { class: 'rq-title' }, g.title), h('span', { class: 'rq-count' }, T.forms(list.length))),
            list.map((l) => row(l)));
        }),
      ].filter(Boolean);
      body.replaceChildren(...(blocks.length ? blocks : [emptyState(T.noMatch)]));
    };
    input.addEventListener('input', render);
    // Typing here must not open InSIS+'s search (Ctrl K / slash shortcuts listen on the page).
    input.addEventListener('keydown', (e) => e.stopPropagation());
    render();
    return h('div', { class: 'kit-stack' },
      h('label', { class: 'rq-filter' }, icon('search'), input),
      body);
  }

  function rail(d, formCard) {
    const office = nav.target('campus.office');
    return h('aside', { class: 'kit-stack' },
      d.kb && formCard({ title: T.kb, lead: T.kbLead }),
      office && h('section', { class: 'card pad rq-ask' },
        h('h2', { class: 'card-title' }, T.ask),
        h('p', { class: 'muted small' }, T.askText),
        anchor({ href: office }, { class: 'rq-link' }, icon('people'), h('span', {}, nav.label('campus.office')))));
  }

  // Help › FAQ (dok/faq.pl, treatment R): InSIS's help line and a table of FAQ categories inside an empty form (no
  // field, no button), or "No category found." Here: the categories as rows (InSIS's own links through the URL
  // rule), otherwise an empty state that points to where questions are answered (Requests and its knowledge base).
  const F = {
    cs: { title: 'Časté dotazy', lead: 'Odpovědi InSIS na časté otázky, po kategoriích.', none: 'InSIS teď nemá žádné kategorie častých dotazů.',
      instead: 'Odpověď můžete hledat v databázi znalostí nebo položit dotaz formulářem v Žádostech.', categories: 'Kategorie' },
    en: { title: 'FAQ', lead: 'InSIS’s answers to common questions, by category.', none: 'InSIS has no FAQ categories right now.',
      instead: 'You can search the knowledge base or ask a question with a form under Requests.', categories: 'Categories' },
  }[lang];
  function faqPage(page) {
    const rows = [...page.querySelectorAll('form table tr')].filter((tr) => tr.closest('table').closest('form'));
    const links = rows.flatMap((tr) => [...tr.querySelectorAll('a[href]')].map(kit.linkOf).filter((l) => l?.text));
    const requests = nav.target('studies.requests');
    kit.page({
      key: 'faq',
      css: ['pages/requests.css', 'pages/matters.css'],
      title: F.title,
      subtitle: nav.label('help'),
      build: () => [
        h('p', { class: 'muted mx-lead' }, F.lead),
        links.length ? h('section', { class: 'card mx-rows' }, h('h2', { class: 'card-title' }, F.categories), links.map((l) => row(l)))
          : h('div', { class: 'empty' }, h('p', {}, F.none), h('p', { class: 'muted small' }, F.instead),
            requests && anchor({ href: requests, text: nav.sectionLabel('studies.requests') }, { class: 'more' }, nav.sectionLabel('studies.requests'))),
        ...kit.messages(page).filter((m) => m.tone !== 'info').map(kit.note),
      ],
    });
  }

  ipx.ready.then(() => {
    const path = nav.route(document.baseURI.split('#')[0]).path;
    if (path === '/auth/dok/faq.pl') {
      const page = document.getElementById('str1');
      if (page?.querySelector('form[action*="faq"]')) faqPage(page);
      return;
    }
    if (path !== '/auth/kc/kc.pl' && path !== '/auth/kc/') return;
    const data = parse();
    if (!data) return;
    const faq = nav.safe(new URL('/auth/dok/faq.pl', document.baseURI).href, 'link');
    if (data.kb) {
      // Inside InSIS's form, its heading and help paragraph repeat the card's title and line: hidden, not removed.
      ipx.ui.hideInSlot([...data.kb.querySelectorAll(':scope > b, :scope > .small, :scope > br, :scope > p')]);
      data.kb.setAttribute('data-ipx-kb', '');
      ipx.ui.styleSlotted('pages/requests.css');
    }

    kit.page({
      key: 'requests',
      css: 'pages/requests.css',
      title: nav.sectionLabel('studies.requests'),
      subtitle: nav.label('matters'),
      actions: faq && anchor({ href: faq }, { class: 'btn ghost', title: T.faq }, icon('info'), h('span', {}, T.faq)),
      tabs: data.tabs.length > 1 ? data.tabs : null,
      form: data.kb,
      build: ({ formCard }) => [
        h('p', { class: 'muted rq-lead' }, T.lead),
        ...data.messages.filter((m) => m.tone !== 'info').map(kit.note),
        h('div', { class: 'kit-cols' }, formsList(data), rail(data, formCard)),
      ],
    });
  });
})();
