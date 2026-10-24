// InSIS+ — Messages › InSIS mail: the mail box (posta/slozka.pl), Mail settings (posta/forwardy.pl, nastaveni.pl,
// slozky.pl, hz_ng_sprava_mlistu.pl) and a new message (posta/nova_zprava.pl). Treatments L and F (docs/ia/03-pages.md,
// teardowns/campus-messages-account.md §2.9–2.11, §3.5).
// Mail box: InSIS's page is one form that holds the folder tree, the counters, a key of icons, the forwarding notice
// and the message list with its row actions. Here: a header with the two things students do (write a message, open
// the university e-mail), one status line saying where this mail goes, the folders as view tabs (InSIS's own links,
// in a fixed order: Inbox · Sent · Drafts · Spam · Trash, then the student's own), and InSIS's message list itself,
// left in its form and in place (only InSIS's tree, counters, key and duplicate notices around it are hidden).
// Mail settings: one section with one row of view tabs instead of InSIS's two stacked rows — Forwarding (first: the
// one setting students need) · Basic setup · Notices · Folders · Recipient lists. Forwarding says where the mail goes
// (InSIS's notice) and which addresses InSIS forwards to, with InSIS's two forms in a form card; the other settings
// pages show InSIS's forms as cards (help lines and keys hidden). A new message: InSIS's form in a form card with one
// line on what happens when it is sent. Nothing is moved out of a form, nothing is filled in or sent.
// Stored for the envelope badge: ipx.state.messages = { updated, unread } (the count InSIS shows, nothing else).
// Where mail is forwarded is shown only when InSIS's notice on the mail box says it; otherwise the status line links
// InSIS's Forwarding settings (settings pages are never read in the background).
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.ui || !ipx.nav) return;

  // What is being read: this page, or a page fetched by the background sync (sync.js), which hands a parsed
  // document to the reader below. No InSIS script runs on a fetched page and nothing else is loaded.
  let doc = document;
  let here = location;
  const { lang, clean, norm } = ipx;
  const { h, icon, anchor, takeover, styleSlotted, hideInSlot, viewTabs } = ipx.ui;
  const nav = ipx.nav;

  const T = {
    cs: { write: 'Nová zpráva', outlook: 'Univerzitní e-mail', forwarded: (a) => `Zprávy z InSIS se přeposílají na ${a}.`,
      notForwarded: 'Zprávy z InSIS se nikam nepřeposílají: čtěte je tady.', fwdWhere: 'Zda se zprávy z InSIS přeposílají na e-mail, určuje nastavení',
      change: 'Změnit', empty: (f) => `Složka ${f} je prázdná.`, used: (q, p) => `Využito ${p} z ${q}`, folders: 'Spravovat složky',
      settings: 'Nastavení pošty', folderNav: 'Složky', drafts: 'Rozepsané',
      forwarding: 'Přeposílání', basic: 'Základní nastavení', notices: 'Upozornění', folderAdmin: 'Složky', lists: 'Seznamy příjemců',
      deliveredTo: (a, s) => `Pošta odchází na ${a}${s ? ` (distribuční server ${s})` : ''}.`, noAddresses: 'Žádné další adresy pro přeposílání.',
      addresses: (n) => `Přeposílá se i na ${n} ${ipx.kit?.plural(n, 'adresu', 'adresy', 'adres') || 'adres'}.`,
      otherSetting: 'Kam se doručuje celá univerzitní pošta, je jiné nastavení:', delivery: 'Univerzitní e-mail',
      fwdLead: 'Adresy a volby přeposílání jsou formuláře InSIS; InSIS je uloží, až stisknete Uložit nastavení.',
      settingsLead: 'Formuláře InSIS: uloží se, až stisknete jejich tlačítko.',
      compose: 'Nová zpráva', composeLead: 'Zpráva se pošle v InSIS; příjemce ji čte v InSIS, nebo v e-mailu, pokud si poštu přeposílá. InSIS ji odešle, až stisknete Odeslat.' },
    en: { write: 'New message', outlook: 'University e-mail', forwarded: (a) => `InSIS forwards this mail to ${a}.`,
      notForwarded: 'InSIS does not forward this mail: read it here.', fwdWhere: 'Whether InSIS forwards this mail to an e-mail address is set in',
      change: 'Change', empty: (f) => `The folder ${f} is empty.`, used: (q, p) => `${p} of ${q} used`, folders: 'Manage folders',
      settings: 'Mail settings', folderNav: 'Folders', drafts: 'Drafts',
      forwarding: 'Forwarding', basic: 'Basic setup', notices: 'Notices', folderAdmin: 'Folders', lists: 'Recipient lists',
      deliveredTo: (a, s) => `Your mail goes to ${a}${s ? ` (distribution server ${s})` : ''}.`, noAddresses: 'No other forwarding addresses.',
      addresses: (n) => `Also forwarded to ${n} ${n === 1 ? 'address' : 'addresses'}.`,
      otherSetting: 'Where all university e-mail is delivered is a different setting:', delivery: 'University e-mail',
      fwdLead: 'The addresses and options are InSIS’s forms; InSIS saves them when you press Save settings.',
      settingsLead: 'InSIS’s forms: they are saved when you press their button.',
      compose: 'New message', composeLead: 'Sent inside InSIS; the recipient reads it in InSIS, or in their e-mail if they forward it. InSIS sends it when you press Send.' },
  }[lang];

  // Page-action icons drawn by pages/rebuild.js (constant markup); the shared set if it is not loaded.
  const glyph = (name) => ipx.rb?.glyph?.(name) || icon(name === 'pencil' ? 'file' : 'arrow');
  const at = (path) => new URL(path, doc.baseURI).href;
  const plain = (path, params = '') => nav.safe(`${new URL(document.baseURI).origin}${path}${params ? `?${params}` : ''}`, 'link');

  // One header for every page of InSIS mail (kit.section): the mail box draws its folders as tabs itself; a new
  // message and the address book are pages below it, with the same title and the same two page actions.
  const mailActions = () => {
    const write = nav.safe(new URL('/auth/posta/nova_zprava.pl', document.baseURI).href, 'link');
    const outlook = nav.data.external?.outlook?.url;
    return [
      // Icons of their own: the top bar's envelope (mail) and globe (language) mean other things.
      write && anchor({ href: write }, { class: 'btn', title: T.write }, glyph('pencil'), h('span', {}, T.write)),
      outlook && anchor({ href: outlook, target: '_blank' }, { class: 'btn ghost', title: T.outlook }, glyph('external'), h('span', {}, T.outlook)),
    ].filter(Boolean);
  };
  ipx.kit?.section({
    id: 'mail',
    title: () => nav.sectionLabel('messages.mail'),
    subtitle: () => nav.label('messages'),
    pages: { '/auth/posta/nova_zprava.pl': null, '/auth/posta/kontakty.pl': null },
    views: () => [],
    actions: mailActions,
  });
  // Mail settings: InSIS's two stacked tab rows (mail · settings) become one row of the settings' own views.
  const settings = ipx.kit?.section({
    id: 'mail-settings',
    title: () => T.settings,
    subtitle: () => nav.label('messages'),
    pages: { '/auth/posta/forwardy.pl': 'forwarding', '/auth/posta/nastaveni.pl': (r) => (r.params?.get('zalozka') === '2' ? 'notices' : 'basic'),
      '/auth/posta/slozky.pl': 'folders', '/auth/posta/hz_ng_sprava_mlistu.pl': 'lists' },
    views: () => [
      { id: 'forwarding', text: T.forwarding, href: plain('/auth/posta/forwardy.pl') },
      { id: 'basic', text: T.basic, href: plain('/auth/posta/nastaveni.pl', 'zalozka=0') },
      { id: 'notices', text: T.notices, href: plain('/auth/posta/nastaveni.pl', 'zalozka=2') },
      { id: 'folders', text: T.folderAdmin, href: plain('/auth/posta/slozky.pl') },
      { id: 'lists', text: T.lists, href: plain('/auth/posta/hz_ng_sprava_mlistu.pl') },
    ],
    actions: () => mailActions().slice(0, 1),
    node: () => 'messages.mail',
  });
  const link = (a) => a && nav.safe(a.href, 'link', { copied: true });

  // InSIS's system folders in the order a mail app shows them; "Unfinished mail box" is what mail apps call Drafts.
  const FOLDER_ORDER = [/^(inbox|doručená|přijatá|prijata)/i, /^(sent|odeslaná|odeslana)/i, /^(unfinished|rozepsan|koncept)/i, /^(spam)/i, /^(trash|koš|kos)/i];
  const folderRank = (f) => { const i = FOLDER_ORDER.findIndex((re) => re.test(f.text)); return i < 0 ? 99 : i; };

  function parse() {
    const page = doc.getElementById('str1');
    const form = page?.querySelector('form[action*="posta/slozka.pl"]');
    if (!form) return null;
    const text = clean(page.textContent);
    const unread = /(?:unread|nepřečten\w*)\s*:\s*(\d+)/i.exec(text)?.[1];
    // Folders: the tree's labels; the current one is bold without a link.
    const folders = [...form.querySelectorAll('div.tree .node-label')].map((label) => {
      const a = label.querySelector('a[href]');
      const name = clean((a || label.querySelector('b'))?.textContent);
      const count = /\((\d+)\)/.exec(label.textContent)?.[1];
      // InSIS does not say whether a folder's number is unread or all messages: shown, never as a red badge.
      return name && { text: FOLDER_ORDER[2].test(name) ? T.drafts : name, raw: name, href: a ? link(a) : here.href.split('#')[0], on: !a, count: count == null ? null : Number(count), hot: false };
    }).filter((f) => f && f.href).sort((a, b) => folderRank({ text: a.raw }) - folderRank({ text: b.raw }));
    const notice = form.querySelector('.uis_msg');
    const fwd = /@/.test(notice?.textContent || '') ? clean(notice.querySelector('a')?.textContent || '') : null;
    const outlook = page.querySelector('table.portal_menu a[href*="outlook"]');
    // The counters are one table cell each ("Quota: 50 MiB", "Full: 0.00%").
    const cells = [...form.querySelectorAll('td')].map((td) => clean(td.textContent));
    const quota = cells.map((t) => /^(?:Quota|Kvóta)\s*:\s*([\d.,]+\s*\S+)$/i.exec(t)?.[1]).find(Boolean);
    const full = cells.map((t) => /^(?:Full|Zaplněno|Obsazeno)\s*:\s*([\d.,]+\s*%)$/i.exec(t)?.[1]).find(Boolean);
    const emptyLine = [...form.querySelectorAll('td b')].find((b) => /contains no messages|neobsahuje žádné/i.test(b.textContent));
    return {
      page, form, folders, fwd, notice, emptyLine,
      unread: unread == null ? null : Number(unread),
      outlook: link(outlook),
      write: nav.safe(at('/auth/posta/nova_zprava.pl'), 'link'),
      forwarding: at('/auth/posta/forwardy.pl'),
      folderAdmin: nav.safe(at('/auth/posta/slozky.pl'), 'link'),
      settings: nav.safe(at('/auth/posta/forwardy.pl'), 'link'),
      quota, full,
    };
  }

  // InSIS's chrome inside the form, hidden while InSIS+ is on (display only: no control is removed or moved).
  function chrome(d) {
    const out = [];
    const tree = d.form.querySelector('div.tree');
    // The left column: update link, tree, folder administration, counters and the key of icons.
    const leftCell = tree?.closest('td[valign="top"]');
    if (leftCell) out.push(leftCell);
    if (d.notice) out.push(d.notice);
    if (d.emptyLine) {
      // An empty folder: InSIS's picture and sentence (InSIS+ says it), and the form itself when nothing in it is a
      // control (an empty folder has no list, so no row actions).
      const box = d.emptyLine.closest('table');
      out.push(box, box?.parentElement?.closest('table'));
      if (![...d.form.elements].some((e) => e.type !== 'hidden')) out.push(d.form);
    }
    d.page.querySelectorAll('table.portal_menu, nav[aria-label="breadcrumb"], div.small').forEach((n) => out.push(n));
    return out.filter(Boolean);
  }

  // Background read (sync.js): parse a fetched page and store its data; nothing is drawn.
  (ipx.readers ||= {}).messages = (fetched, url) => {
    doc = fetched; here = new URL(url);
    try { const data = parse(); if (data?.unread != null) { ipx.state.messages = { updated: Date.now(), unread: data.unread }; ipx.save(); } } finally { doc = document; here = location; }
  };

  // ---------- mail settings and a new message (pages/rebuild.js frames them) ----------

  const card = (lead) => h('section', { class: 'card pad rb-form' }, lead && h('p', { class: 'muted form-lead' }, lead), h('slot'));

  function forwardingPage(page) {
    const rb = ipx.rb;
    const ko = page.querySelector('.uis_msg.ko, .uis_msg.error');
    const koText = clean(ko?.querySelector('.text')?.textContent || '');
    const address = /[^\s@:]+@[^\s@]+\.[a-z]{2,}/i.exec(koText)?.[0];
    const server = /(?:distribution server|distribuční server)\s*:\s*(\S+)/i.exec(koText)?.[1];
    // The forwarding addresses: rows of InSIS's table that hold an e-mail (InSIS writes "No suitable data found." else).
    const list = [...page.querySelectorAll('form table')].find((t) => /e-?mail/i.test(t.rows[0]?.textContent || ''));
    const extra = list ? [...list.rows].slice(1).filter((tr) => /@/.test(tr.textContent)).length : 0;
    const delivery = plain('/auth/sit/univ_posta.pl');
    return {
      // InSIS's headings between its two forms repeat the checkbox labels under them.
      hide: [...rb.chrome(page, { forms: true }), ...page.querySelectorAll('.uis_msg'), ...[...page.querySelectorAll('b')].filter((b) => !b.closest('form, table'))],
      nodes: [
        address ? h('p', { class: 'kit-note ok' }, icon('mail'), h('span', {}, h('strong', {}, T.deliveredTo(address, server))))
          : h('p', { class: 'kit-note warn' }, icon('alert'), h('span', {}, T.notForwarded)),
        h('p', { class: 'muted small msg-foot' }, extra ? T.addresses(extra) : T.noAddresses, ' ',
          delivery && h('span', {}, T.otherSetting, ' ', anchor({ href: delivery }, {}, T.delivery))),
        card(T.fwdLead),
      ],
    };
  }

  function settingsPage(page) {
    for (const f of page.querySelectorAll('form')) if ([...f.elements].some((e) => e.type !== 'hidden')) f.setAttribute('data-ipx-card', '');
    return { hide: ipx.rb.chrome(page), nodes: [h('p', { class: 'muted small msg-foot' }, T.settingsLead), h('slot')] };
  }

  function drawWithRebuild(r, page) {
    const rb = ipx.rb;
    if (!rb) return false; // pages/rebuild.js not loaded: generic.js frames the page with the section's header
    const s = ipx.kit.sectionFor();
    if (r.path === '/auth/posta/nova_zprava.pl') {
      const form = page.querySelector('form');
      if (!form) return false;
      rb.frame({ key: 'messages', css: 'pages/messages.css', title: T.compose, subtitle: nav.sectionLabel('messages.mail'), actions: mailActions().slice(1),
        only: form, hide: rb.chrome(page, { forms: true }), build: () => [card(T.composeLead)] });
      return true;
    }
    if (!s || s.section !== settings) return false;
    const built = r.path === '/auth/posta/forwardy.pl' ? forwardingPage(page) : settingsPage(page);
    rb.frame({ key: 'messages', css: 'pages/messages.css', title: settings.title(), subtitle: settings.subtitle(), actions: settings.actions(),
      tabs: ipx.kit.sectionTabs(settings, s.view), slot: true, hide: built.hide, build: () => built.nodes });
    return true;
  }

  ipx.ready.then(() => {
    const r = nav.route(document.baseURI.split('#')[0]);
    const page = document.getElementById('str1');
    if (page && /^\/auth\/posta\/(forwardy|nastaveni|slozky|hz_ng_sprava_mlistu|nova_zprava)\.pl$/.test(r.path || '')) {
      drawWithRebuild(r, page);
      return;
    }
    const data = parse();
    if (!data) return;
    if (data.unread != null) {
      ipx.state.messages = { updated: Date.now(), unread: data.unread };
      ipx.save();
    }
    const current = data.folders.find((f) => f.on);
    // Where this mail goes: InSIS's own notice on this page says it when mail is forwarded. Otherwise the line only
    // links InSIS's Forwarding settings: a settings page is never read in the background (03-pages §7, decision 10).
    const fwdLink = nav.safe(data.forwarding, 'link');
    const line = h('span', {}, data.fwd ? T.forwarded(data.fwd) : T.fwdWhere);
    hideInSlot(chrome(data));
    styleSlotted();
    takeover({
      key: 'messages',
      css: ['kit.css', 'pages/messages.css'],
      title: nav.sectionLabel('messages.mail'),
      subtitle: nav.label('messages'),
      extra: mailActions(),
      slotted: [data.page],
      build: () => h('div', { class: 'kit-page' },
        h('p', { class: 'kit-note info msg-status' }, icon('info'), line,
          fwdLink && anchor({ href: fwdLink }, { class: 'msg-change' }, data.fwd ? T.change : T.forwarding)),
        viewTabs(data.folders, T.folderNav),
        data.emptyLine && h('div', { class: 'empty' }, h('p', {}, T.empty(current?.text || ''))),
        h('slot'),
        h('p', { class: 'muted small msg-foot' },
          data.quota && data.full && h('span', {}, T.used(data.quota, data.full)),
          data.folderAdmin && anchor({ href: data.folderAdmin }, {}, T.folders),
          data.settings && anchor({ href: data.settings }, {}, T.settings))),
    });
  });
})();
