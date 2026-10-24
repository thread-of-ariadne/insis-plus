// InSIS+ — All services: News subscriptions (posta/novinky.pl), Discussions (diskuze/), InSIS tasks (todo/) and
// Thematic search (hledani/). Treatments F and B (docs/ia/03-pages.md, teardowns/campus-messages-account.md §2.23 and
// §4: low-use services). Uses pages/rebuild.js.
// Each page: the service's name as the title (eyebrow All services), InSIS's help lines shortened into one line above
// InSIS's own form (slotted in a form card, never filled or sent by InSIS+), lists outside forms drawn again as rows
// (discussion platforms with their counts, news categories) with InSIS's own links. Discussions: Platforms · Search ·
// Settings as view tabs (InSIS's own links from the page). Long checkbox groups of a search form are behind a
// disclosure (CSS only: every control stays in the form with InSIS's values). Nothing is stored or fetched.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.rb || !ipx.kit || !ipx.nav) return;
  const { lang, clean, norm } = ipx;
  const { h, icon, anchor } = ipx.ui;
  const kit = ipx.kit;
  const nav = ipx.nav;
  const rb = ipx.rb;

  const T = {
    cs: { platforms: 'Diskuse', search: 'Hledání', settings: 'Nastavení',
      newsLead: 'Zaškrtněte kanály, které chcete dostávat e-mailem; InSIS volbu uloží, až stisknete Uložit změny.',
      categories: 'Kategorie novinek', categoriesLead: 'Kanály jsou rozdělené do kategorií; kategorie otevře jejich seznam.',
      discussLead: 'Diskuse předmětů a zájmové skupiny; většina výuky dnes diskutuje v Moodle.',
      filterLead: 'Filtr InSIS: omezí seznam, až stisknete jeho tlačítko.', formLead: 'Formulář InSIS: provede se, až stisknete jeho tlačítko.',
      searchLead: 'Hledá v názvech a textech příspěvků; InSIS hledá, až stisknete Hledat.', settingsLead: 'InSIS nastavení uloží, až stisknete Uložit změny.',
      todoLead: 'Bloky úkolů, ke kterým máte přístup (používají je některá pracoviště); InSIS provede filtr nebo přidání, až stisknete tlačítko.',
      findLead: 'Napište hledaný výraz a vyberte, kde hledat; InSIS hledá, až stisknete Hledat.', narrow: 'Kde hledat', narrowSub: 'Oblasti, počet výsledků, pracoviště',
      find: 'Hledat diskusi…', enter: 'Vstoupit' },
    en: { platforms: 'Discussions', search: 'Search', settings: 'Settings',
      newsLead: 'Tick the channels you want by e-mail; InSIS saves your choice when you press Save changes.',
      categories: 'News categories', categoriesLead: 'Channels are grouped in categories; a category opens its list.',
      discussLead: 'Course discussions and interest groups; most teaching discusses in Moodle today.',
      filterLead: 'InSIS’s filter: it limits the list when you press its button.', formLead: 'InSIS’s form: it runs when you press its button.',
      searchLead: 'Searches titles and texts of contributions; InSIS searches when you press Search.', settingsLead: 'InSIS saves the settings when you press Save changes.',
      todoLead: 'Task blocks you have access to (some departments use them); InSIS filters or adds when you press a button.',
      findLead: 'Type a phrase and choose where to search; InSIS searches when you press Search.', narrow: 'Where to search', narrowSub: 'Areas, number of results, departments',
      find: 'Find a discussion…', enter: 'Enter' },
  }[lang];

  const ORIGIN = () => new URL(document.baseURI).origin;
  const plain = (path, params = '') => nav.safe(`${ORIGIN()}${path}${params ? `?${params}` : ''}`, 'link');
  const route = () => nav.route(document.baseURI.split('#')[0]);
  const formCard = (lead, ...extra) => h('section', { class: 'card pad rb-form' }, lead && h('p', { class: 'muted form-lead' }, lead), ...extra, h('slot'));
  const hasSlot = (nodes) => nodes.flat(Infinity).some((n) => n instanceof Node && (n.matches?.('slot') || n.querySelector?.('slot')));
  // InSIS's help lines inside its forms: said by the lead above the form.
  const helpLines = (root) => [...root.querySelectorAll('form div.small, form > span.small')];

  // Discussions: the views' links are InSIS's own, from the help lines of the platforms page; else plain addresses.
  const discussionLink = (param) => {
    const a = document.querySelector(`#str1 a[href*="${param}"]`);
    return (a && nav.safe(a.href, 'link', { copied: true })) || plain('/auth/diskuze/', `${param}=1`);
  };
  const discussions = kit.section({
    id: 'discussions', title: () => nav.label('all.discussions'), subtitle: () => nav.label('all'),
    pages: { '/auth/diskuze/': (r) => (r.params?.has('diskuze_vyhledavani') ? 'search' : r.params?.has('diskuze_nastaveni') ? 'settings' : r.params?.has('diskuze_temata') ? null : 'platforms') },
    views: () => [{ id: 'platforms', text: T.platforms, href: plain('/auth/diskuze/') }, { id: 'search', text: T.search, href: discussionLink('diskuze_vyhledavani') },
      { id: 'settings', text: T.settings, href: discussionLink('diskuze_nastaveni') }],
    node: () => 'all.discussions',
  });

  // ---------- pages ----------

  function newsPage(page, r) {
    const form = page.querySelector('form[action*="novinky.pl"]');
    if (form && r.params.has('kategorie')) {
      const heading = [...page.querySelectorAll('b')].find((b) => !b.closest('table'));
      const name = clean(heading?.textContent).replace(/^.*(category|kategori[ei])\s+/i, '');
      // The category's description: InSIS's loose text before the help line.
      const desc = clean([...(form.parentElement?.childNodes || [])].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(' '));
      form.setAttribute('data-ipx-news', '');
      document.documentElement.classList.add('ipx-svc-news');
      return { hide: [heading, ...helpLines(page)], only: form, nodes: [name && rb.title(name), desc && h('p', { class: 'rb-text' }, desc), formCard(T.newsLead)] };
    }
    const list = rb.blocks(page, { skip: rb.chrome(page) });
    const links = [...page.querySelectorAll('a[href*="kategorie="]')].map((a) => rb.link(a)).filter(Boolean);
    return {
      hide: rb.redrawn(list),
      nodes: links.length ? [h('p', { class: 'rb-sub' }, T.categoriesLead), h('section', { class: 'card rb-list' }, links.map((l) => anchor(l, { class: 'rb-row' }, h('span', {}, l.text), icon('arrow'))))]
        : rb.render(list, { keepCard: (slot) => formCard(T.formLead, slot) }),
    };
  }

  function discussionsPage(page, r) {
    if (r.params.has('diskuze_vyhledavani') || r.params.has('diskuze_nastaveni')) {
      const heads = [...page.querySelectorAll('big, b')].filter((b) => !b.closest('form, table') && !b.closest('#titulek'));
      return { hide: [...heads, ...helpLines(page)], only: page.querySelector('form'), nodes: [formCard(r.params.has('diskuze_nastaveni') ? T.settingsLead : T.searchLead)] };
    }
    if (r.params.has('diskuze_temata')) {
      const list = rb.blocks(page, { skip: rb.chrome(page) });
      return { hide: rb.redrawn(list), nodes: rb.render(list, { keepCard: (slot) => formCard(T.formLead, slot) }) };
    }
    // Platforms: InSIS's table (outside the filter form) → rows with their counts; the filter form stays InSIS's.
    const table = kit.findTables(page).find((t) => !t.closest('form'));
    const d = table ? kit.readTable(table) : null;
    const items = (d?.rows || []).filter((row) => row.cells.length >= 2).map((row) => {
      const enter = row.el.querySelector('a[href*="diskuze_temata"]');
      const l = enter && rb.link(enter);
      const cell = row.cells.find((c) => c.text);
      const name = clean(cell?.el.querySelector('b, strong, a')?.textContent || '') || cell?.text || '';
      const meta = clean((cell?.text || '').slice(name.length));
      const inner = [h('span', {}, name, meta && h('small', {}, meta)), l && icon('arrow')];
      const el = l ? anchor(l, { class: 'rb-row' }, inner) : h('div', { class: 'rb-row' }, inner);
      return { el, text: norm(cell?.text || '') };
    });
    return {
      hide: [table].filter(Boolean),
      nodes: [
        h('p', { class: 'rb-sub' }, T.discussLead),
        page.querySelector('form select') && formCard(T.filterLead),
        items.length > 0 && rb.longList(h('section', { class: 'card rb-list' }, items.map((i) => i.el)), items, { cap: 1000, filterAt: 15, placeholder: T.find }),
      ],
    };
  }

  function todoPage(page) {
    const form = page.querySelector('form[action*="todo"]');
    if (!form) return null;
    const unread = [...form.querySelectorAll(':scope > b')].find((b) => /task|úkol/i.test(b.textContent) && !b.nextElementSibling?.matches('table'));
    form.setAttribute('data-ipx-todo', '');
    return { hide: [...helpLines(page), unread].filter(Boolean), only: form, nodes: [unread && h('p', { class: 'kit-note info' }, icon('check'), h('span', {}, clean(unread.textContent))), formCard(T.todoLead)] };
  }

  function searchPage(page) {
    const form = page.querySelector('form[action*="hledani"]');
    if (!form) return null;
    // Everything after the field and its Search button (captions, the checkbox tables) is the "where" part.
    const go = form.querySelector('input[type="submit"], #dohledat');
    const kids = [...form.children];
    const from = go ? kids.findIndex((k) => k === go || k.contains(go)) + 1 : kids.findIndex((k) => k.matches('table'));
    const groups = kids.slice(Math.max(0, from)).filter((k) => !k.matches('input[type="hidden"], script'));
    const box = groups.length ? rb.disclosure(T.narrow, T.narrowSub, groups) : null;
    form.setAttribute('data-ipx-search', '');
    document.documentElement.classList.add('ipx-svc-search');
    return { hide: helpLines(page), only: form, nodes: [h('section', { class: 'card pad rb-form' }, h('p', { class: 'muted form-lead' }, T.findLead), h('slot'), box)] };
  }

  ipx.ready.then(() => {
    const page = document.getElementById('str1');
    const r = route();
    if (!page) return;
    let built = null;
    let hdr = { subtitle: nav.label('all'), tabs: null };
    if (r.path === '/auth/posta/novinky.pl') { hdr.title = nav.label('all.news'); built = newsPage(page, r); }
    else if (r.path === '/auth/diskuze/') {
      const view = discussions.pages['/auth/diskuze/'](r);
      hdr = { title: discussions.title(), subtitle: discussions.subtitle(), tabs: kit.sectionTabs(discussions, view) };
      built = discussionsPage(page, r);
    } else if (r.path === '/auth/todo/') { hdr.title = nav.label('all.tasks'); built = todoPage(page); }
    else if (r.path === '/auth/hledani/') { hdr.title = nav.label('all.search'); built = searchPage(page); }
    else return;
    if (!built) return;
    const nodes = built.nodes.filter(Boolean);
    // A discussion's topics: its name is InSIS's heading (kept as the first block), under the section's header.
    rb.frame({ key: 'services', css: 'pages/services.css', title: hdr.title, subtitle: hdr.subtitle, tabs: hdr.tabs,
      slot: hasSlot(nodes), hide: built.hide || [], only: built.only, build: () => nodes });
  });
})();
