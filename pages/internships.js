// InSIS+ — Study matters › Internships & jobs (praxe/, teardowns/study-matters.md §2.15). One InSIS tool with four
// views (InSIS's own tab links, zalozka): Offers · My internships · Companies · My profile, drawn as one row of view
// tabs under one header (kit.section; generic.js frames InSIS's content under it). Each view keeps InSIS's content in
// place: its filter form as a compact bar, its list as rows (InSIS's links and checkboxes untouched), InSIS's
// "nothing found" row as an empty state; InSIS's tab row, help lines and the portal notice are said in the summary.
// Views without a snapshot (offers, my internships, profile) get the same treatment by structure. Nothing is stored.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.kit || !ipx.nav) return;
  const { lang, clean, norm } = ipx;
  const { h, hideInSlot, styleSlotted } = ipx.ui;
  const kit = ipx.kit;
  const nav = ipx.nav;

  const T = {
    cs: { views: { offers: 'Nabídky', mine: 'Moje praxe', companies: 'Firmy', profile: 'Můj profil' },
      leads: { offers: 'Nabídky praxí od registrovaných firem. Detail nabídky otevřete v jejím řádku.',
        mine: 'Vaše praxe, jejich stav a hodnocení.', companies: 'Firmy registrované v portálu praxí a počet jejich nabídek.',
        profile: 'Váš profil, který vidí firmy v portálu praxí.' },
      list: { offers: 'Nabídky', mine: 'Praxe', companies: 'Firmy', profile: 'Profil' },
      nothing: { offers: 'Žádné nabídky praxí.', mine: 'Nemáte žádné praxe.', companies: 'Žádné firmy k zobrazení.', profile: 'Nic tu není.' },
      testing: 'Portál povinných praxí se teprve nastavuje a testuje; některé funkce mohou chybět.' },
    en: { views: { offers: 'Offers', mine: 'My internships', companies: 'Companies', profile: 'My profile' },
      leads: { offers: 'Internship offers from registered companies. Open an offer from its row.',
        mine: 'Your internships, their status and evaluation.', companies: 'Companies registered in the internships portal and how many offers each has.',
        profile: 'Your profile, which companies see in the internships portal.' },
      list: { offers: 'Offers', mine: 'Internships', companies: 'Companies', profile: 'Profile' },
      nothing: { offers: 'No internship offers.', mine: 'You have no internships.', companies: 'No companies to show.', profile: 'Nothing here.' },
      testing: 'The mandatory internships portal is still being set up and tested; some features may be missing.' },
  }[lang];

  // InSIS's tab numbers (zalozka) → views, in the order students use them (offers first; InSIS opens on companies).
  const TAB = { 1: 'offers', 5: 'mine', 4: 'companies', 2: 'profile' };
  const ORDER = ['offers', 'mine', 'companies', 'profile'];
  const viewOf = (r) => TAB[r.params?.get('zalozka')] || 'companies';

  // The views' links: InSIS's own tab links on this page (they carry the study), through the URL rule.
  const tabLinks = () => {
    const out = {};
    for (const a of document.querySelectorAll('#str1 table.portal_menu a[href*="praxe/"]')) {
      const l = kit.linkOf(a);
      const v = l && TAB[nav.parse(l.href)?.params.get('zalozka')];
      if (v) out[v] = l.href;
    }
    return out;
  };

  let leadNode = null;
  kit.section({
    id: 'internships',
    title: () => nav.sectionLabel('studies.internships'),
    subtitle: () => nav.label('matters'),
    pages: { '/auth/praxe/': viewOf },
    views: () => { const links = tabLinks(); return ORDER.map((id) => ({ id, text: T.views[id], href: links[id] })); },
    lead: () => leadNode,
    css: ['pages/matters.css'],
  });

  ipx.ready.then(() => {
    const route = nav.route(document.baseURI.split('#')[0]);
    if (route.path !== '/auth/praxe/') return;
    const page = document.getElementById('str1');
    if (!page) return;
    const view = viewOf(route);

    // The list tables: header row, not inside the filter form.
    for (const t of kit.findTables(page)) {
      if (t.closest('.uisLegend')) continue;
      const heads = [...t.querySelectorAll('thead th, tr.zahlavi > th')].map((th) => clean(th.textContent));
      t.setAttribute('data-ipx-rows', T.list[view]);
      for (const tr of t.querySelectorAll('tbody > tr')) {
        const cells = [...tr.children];
        if (cells.length === 1) { tr.setAttribute('data-ipx-empty', ''); if (/suitable|vyhovuj/.test(norm(tr.textContent))) cells[0].setAttribute('data-ipx-label', T.nothing[view]); continue; }
        const offset = Math.max(0, cells.length - heads.length);
        // The title column: the first one with text that is not a selection box or an order number.
        let main = null;
        cells.forEach((td, i) => {
          td.setAttribute('data-ipx-cell', '');
          const head = heads[i - offset] || '';
          const text = clean(td.textContent);
          if (i < offset || /^(ord\.?|por\.?)$/i.test(norm(head))) { td.setAttribute('data-ipx-num', ''); return; }
          if (!text && !td.querySelector('a, input, [data-sysid]')) { td.setAttribute('data-ipx-blank', ''); return; }
          if (!main && text && !td.querySelector('input')) { main = td; td.setAttribute('data-ipx-main', ''); return; }
          // A cell that is only a link (Offers, Detail, Evaluation) needs no label; data cells get InSIS's header.
          if (head && !(td.querySelector('a') && clean(td.querySelector('a').textContent) === text)) td.setAttribute('data-ipx-prefix', head);
        });
      }
    }
    // Filter forms (a select and Restrict / Choose): a compact bar above the list.
    for (const f of page.querySelectorAll('form')) if (f.querySelector('select') && !f.querySelector('table[data-ipx-rows]')) f.setAttribute('data-ipx-bar', '');
    const notice = [...page.querySelectorAll('.uis_msg')].find((m) => /testing|testov|configur|nastav/i.test(norm(m.textContent)));
    hideInSlot([...page.querySelectorAll('.small'), notice].filter(Boolean));
    leadNode = h('div', { class: 'kit-stack' },
      h('p', { class: 'muted mx-lead' }, T.leads[view]),
      notice && kit.note({ tone: 'info', text: T.testing }));
    document.documentElement.classList.add('ipx-praxe');
    styleSlotted('pages/matters-slot.css');
  });
})();
