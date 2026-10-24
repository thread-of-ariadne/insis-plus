// InSIS+ — All services › Surveys & elections › Elections (evolby/portal_volice.pl). A list with actions (L in
// place): InSIS's page is one form with its two tabs (Current elections · Past elections), a help line, the elections
// table (Status · Name · Subject · Group of voters · Kind · Start · End · Ballot · You may abstain · Vote) and a key of
// status icons. The page is the list, not a ballot (mapping.json: read background, link shell): entering an election
// is InSIS's own Vote link in the row, never copied. Here: one header with the two views as view tabs, a summary
// line, the rows styled in place (status as a labelled chip instead of the key, Vote as a button), InSIS's empty row
// as an empty state. Nothing is stored.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.kit || !ipx.nav) return;
  const { lang, clean, norm } = ipx;
  const { h, hideInSlot, styleSlotted } = ipx.ui;
  const kit = ipx.kit;
  const nav = ipx.nav;

  const T = {
    cs: { title: 'Volby', current: 'Probíhající volby', past: 'Minulé volby', list: 'Volby', vote: 'Hlasovat',
      leadCurrent: 'Volby, ve kterých můžete hlasovat. Hlasuje se v InSIS: odkazem Hlasovat v řádku voleb.',
      leadPast: 'Volby, které už skončily, s jejich stavem.',
      noneCurrent: 'Teď neprobíhají žádné volby, ve kterých byste mohli hlasovat.', nonePast: 'Žádné minulé volby.' },
    en: { title: 'Elections', current: 'Current elections', past: 'Past elections', list: 'Elections', vote: 'Vote',
      leadCurrent: 'Elections you can vote in. Voting happens in InSIS: use the Vote link in the election’s row.',
      leadPast: 'Elections that have ended, with their status.',
      noneCurrent: 'There are no elections you can vote in right now.', nonePast: 'No past elections.' },
  }[lang];

  // Which tab InSIS marks (its tab links repeat the parameter, "zalozka=2;zalozka=1", so the address is not enough).
  const activeTab = () => {
    const links = [...document.querySelectorAll('#str1 table.portal_menu a[href*="portal_volice"]')];
    const i = links.findIndex((a) => a.closest('b'));
    return i === 1 ? 'past' : 'current';
  };
  const link = (n) => nav.safe(new URL(`/auth/evolby/portal_volice.pl?zalozka=${n}`, document.baseURI).href, 'link');

  let leadNode = null;
  kit.section({
    id: 'elections',
    title: () => T.title,
    subtitle: () => nav.sectionLabel('all.surveys'),
    pages: { '/auth/evolby/portal_volice.pl': () => (document.getElementById('str1') ? activeTab() : 'current') },
    views: () => [{ id: 'current', text: T.current, href: link(1) }, { id: 'past', text: T.past, href: link(2) }],
    lead: () => leadNode,
    css: ['pages/matters.css'],
  });

  ipx.ready.then(() => {
    if (nav.route(document.baseURI.split('#')[0]).path !== '/auth/evolby/portal_volice.pl') return;
    const page = document.getElementById('str1');
    const table = page && kit.findTables(page).find((t) => !t.closest('.uisLegend'));
    if (!table) return;
    const view = activeTab();
    const heads = [...table.querySelectorAll('thead th, tr.zahlavi > th')].map((th) => clean(th.textContent));
    table.setAttribute('data-ipx-rows', T.list);
    for (const tr of table.querySelectorAll('tbody > tr')) {
      const cells = [...tr.children];
      if (cells.length === 1) { tr.setAttribute('data-ipx-empty', ''); cells[0].setAttribute('data-ipx-label', view === 'past' ? T.nonePast : T.noneCurrent); continue; }
      const offset = Math.max(0, cells.length - heads.length);
      cells.forEach((td, i) => {
        td.setAttribute('data-ipx-cell', '');
        const head = heads[i - offset] || '';
        const n = norm(head);
        if (i < offset) { td.setAttribute('data-ipx-num', ''); return; }
        // Status: InSIS's icon (its key) → a labelled chip.
        const icon = td.querySelector('[data-sysid^="volby-"]');
        if (/^(status|stav)$/.test(n) && icon) { td.setAttribute('data-ipx-chip', icon.getAttribute('aria-label') || ''); return; }
        // Vote: InSIS's own link into the election, drawn as a button (never copied or followed by InSIS+).
        const vote = td.querySelector('a[href]');
        if (/^(vote|hlasovat|hlasovani)$/.test(n)) { if (vote) vote.setAttribute('data-ipx-button', T.vote); else td.setAttribute('data-ipx-blank', ''); return; }
        if (/^(name of election|nazev voleb|nazev)/.test(n)) { td.setAttribute('data-ipx-main', ''); return; }
        if (!clean(td.textContent) && !td.querySelector('a, input, [data-sysid]')) { td.setAttribute('data-ipx-blank', ''); return; }
        if (head) td.setAttribute('data-ipx-prefix', head);
      });
    }
    hideInSlot([...page.querySelectorAll('.small, .uisLegend')]);
    leadNode = h('p', { class: 'muted mx-lead' }, view === 'past' ? T.leadPast : T.leadCurrent);
    document.documentElement.classList.add('ipx-elections');
    styleSlotted('pages/matters-slot.css');
  });
})();
