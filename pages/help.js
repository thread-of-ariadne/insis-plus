// InSIS+ — Help › InSIS documentation: the topic index (dok/help.pl) and a topic (help.pl). Treatments R and B
// (docs/ia/03-pages.md, teardowns/campus-messages-account.md §2.14). Uses pages/rebuild.js.
// Index: InSIS shows a tab row (General topics · All), a help line and the topics as letter-headed lists in layout
// columns. Here: the same two views as view tabs (InSIS's own links), a filter field and the topics A–Z as rows, each
// InSIS's own topic link. A topic: InSIS's documentation text is kept word for word (it is InSIS's documentation),
// slotted and set as a readable article (headings, notes, lists), titled by the topic, with a link back to the index.
// A tag search with several matches: the matching topics as rows. Nothing is stored or fetched.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.rb || !ipx.kit || !ipx.nav) return;
  const { lang, clean, norm } = ipx;
  const { h, icon, anchor } = ipx.ui;
  const kit = ipx.kit;
  const nav = ipx.nav;
  const rb = ipx.rb;

  const T = {
    cs: { docs: 'Dokumentace InSIS', general: 'Hlavní témata', all: 'Všechna témata', find: 'Hledat téma…', topics: (n) => `${n} ${kit.plural(n, 'téma', 'témata', 'témat')}`,
      index: 'Rejstřík témat', lead: 'Dokumentace popisuje klasické InSIS; názvy aplikací odpovídají jeho nabídkám.', choose: 'Několik témat odpovídá; vyberte jedno.' },
    en: { docs: 'InSIS documentation', general: 'General topics', all: 'All topics', find: 'Find a topic…', topics: (n) => `${n} ${n === 1 ? 'topic' : 'topics'}`,
      index: 'Topic index', lead: 'The documentation describes classic InSIS; application names follow its menus.', choose: 'Several topics match; choose one.' },
  }[lang];

  const ORIGIN = () => new URL(document.baseURI).origin;
  const plain = (path, params = '') => nav.safe(`${ORIGIN()}${path}${params ? `?${params}` : ''}`, 'link');
  const route = () => nav.route(document.baseURI.split('#')[0]);

  const docs = kit.section({
    id: 'docs', title: () => T.docs, subtitle: () => nav.label('help'),
    pages: { '/auth/dok/help.pl': (r) => (r.params?.get('tab') === '2' ? 'all' : 'general'), '/auth/help.pl': null },
    views: () => [{ id: 'general', text: T.general, href: plain('/auth/dok/help.pl', 'tab=1') }, { id: 'all', text: T.all, href: plain('/auth/dok/help.pl', 'tab=2') }],
    node: () => 'help',
  });

  // The index: letter headings (<b>) followed by lists of topic links, in InSIS's columns.
  function indexPage(page) {
    const box = page.querySelector('.uis-multicolumn-container') || page;
    const groups = [];
    for (const el of box.querySelectorAll('b, ul')) {
      if (el.tagName === 'B' && !el.closest('ul')) groups.push({ letter: clean(el.textContent), links: [] });
      else if (el.tagName === 'UL' && groups.length) groups.at(-1).links.push(...[...el.querySelectorAll('a[href]')].map((a) => rb.link(a)).filter(Boolean));
    }
    const all = groups.flatMap((g) => g.links);
    if (!all.length) return null;
    const items = [];
    const sections = groups.filter((g) => g.links.length).map((g) => {
      const rows = g.links.map((l) => { const el = anchor(l, { class: 'rb-row' }, h('span', {}, l.text), icon('arrow')); items.push({ el, text: norm(l.text) }); return el; });
      return h('section', { class: 'hlp-group' }, h('h2', { class: 'hlp-letter' }, g.letter), h('div', { class: 'rb-list' }, rows));
    });
    return [
      h('p', { class: 'rb-sub' }, `${T.topics(all.length)} · ${T.lead}`),
      rb.longList(h('div', { class: 'card hlp-index' }, sections), items, { cap: 100000, filterAt: 10, placeholder: T.find }),
    ];
  }

  ipx.ready.then(() => {
    const page = document.getElementById('str1');
    const r = route();
    if (!page) return;
    if (r.path === '/auth/dok/help.pl') {
      const view = r.params.get('tab') === '2' ? 'all' : 'general';
      const nodes = indexPage(page);
      if (!nodes) return;
      rb.frame({ key: 'help', css: 'pages/help.css', title: docs.title(), subtitle: docs.subtitle(), tabs: kit.sectionTabs(docs, view), build: () => nodes });
      return;
    }
    if (r.path !== '/auth/help.pl') return;
    const doc = page.querySelector('.help .documentation, .documentation');
    const topic = clean(page.querySelector('#titulek h1')?.textContent) || rb.crumbs(page).at(-1) || T.docs;
    const index = plain('/auth/dok/help.pl');
    const actions = [index && anchor({ href: index }, { class: 'btn ghost', title: T.index }, icon('book'), h('span', {}, T.index))].filter(Boolean);
    if (doc) {
      // InSIS's documentation text, word for word: slotted, everything around it hidden. Its icons are content
      // ("the icon ▢ opens…"): they stay pictures, sized to the text (help.css), never replaced by their label.
      doc.setAttribute('data-ipx-doc', '');
      doc.setAttribute('data-ipx-nolabel', '');
      ipx.ui.keepOnly(page, doc);
      document.documentElement.classList.add('ipx-help');
      rb.frame({ key: 'help', css: 'pages/help.css', title: topic, subtitle: T.docs, actions, slot: true, hide: [],
        build: () => [h('article', { class: 'card hlp-article' }, h('slot'))] });
      return;
    }
    // A tag with several topics: InSIS's list of matches. Parts that stay InSIS's own (a form, an action link) show
    // through the <slot> render() puts at their place; the rest of the original is hidden.
    const list = rb.blocks(page, { skip: rb.chrome(page) });
    const nodes = rb.render(list.map((b) => (b.type === 'heading' ? { type: 'text', text: T.choose } : b)));
    rb.frame({ key: 'help', css: 'pages/help.css', title: topic, subtitle: T.docs, actions,
      slot: rb.hasSlot(nodes), kept: true, hide: rb.redrawn(list), build: () => nodes });
  });
})();
