// InSIS+ — Messages › InSIS mail: the mail box (posta/slozka.pl). Treatment L (docs/ia/03-pages.md,
// teardowns/campus-messages-account.md): InSIS's page is one form that holds the folder tree, the counters, a key of
// icons, the forwarding notice and the message list with its row actions. Here: a header with the two things
// students do (write a message, open the university e-mail), one status line saying where this mail goes, the
// folders as view tabs (addresses copied from InSIS's own links), and InSIS's message list itself, left in its form
// and in place (only InSIS's tree, counters, key and duplicate notices around it are hidden). Nothing is moved out
// of the form, nothing is filled in or sent.
// Stored for the envelope badge: ipx.state.messages = { updated, unread } (the count InSIS shows, nothing else).
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.ui || !ipx.nav) return;

  // What is being read: this page, or a page fetched by the background sync (sync.js), which hands a parsed
  // document to the reader below. No InSIS script runs on a fetched page and nothing else is loaded.
  let doc = document;
  let here = location;
  const { lang, clean } = ipx;
  const { h, icon, anchor, takeover, styleSlotted, hideInSlot, viewTabs } = ipx.ui;
  const nav = ipx.nav;

  const T = {
    cs: { write: 'Nová zpráva', outlook: 'Univerzitní e-mail', forwarded: (a) => `Zprávy z InSIS se přeposílají na ${a}.`,
      notForwarded: 'Zprávy z InSIS se nikam nepřeposílají: čtěte je tady.', unknown: 'Přeposílání se nepodařilo zjistit.',
      change: 'Změnit', empty: (f) => `Složka ${f} je prázdná.`, used: (q, p) => `Využito ${p} z ${q}`, folders: 'Spravovat složky',
      settings: 'Nastavení pošty', folderNav: 'Složky' },
    en: { write: 'New message', outlook: 'University e-mail', forwarded: (a) => `InSIS forwards this mail to ${a}.`,
      notForwarded: 'InSIS does not forward this mail: read it here.', unknown: 'Forwarding could not be checked.',
      change: 'Change', empty: (f) => `The folder ${f} is empty.`, used: (q, p) => `${p} of ${q} used`, folders: 'Manage folders',
      settings: 'Mail settings', folderNav: 'Folders' },
  }[lang];

  const at = (path) => new URL(path, doc.baseURI).href;
  const link = (a) => a && nav.safe(a.href, 'link', { copied: true });

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
      return name && { text: name, href: a ? link(a) : here.href.split('#')[0], on: !a, count: count == null ? null : Number(count), hot: false };
    }).filter((f) => f && f.href);
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
      settings: nav.safe(at('/auth/posta/nastaveni.pl'), 'link'),
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
    if (d.emptyLine) out.push(d.emptyLine.closest('table'));
    d.page.querySelectorAll('table.portal_menu, nav[aria-label="breadcrumb"], div.small').forEach((n) => out.push(n));
    return out;
  }

  async function forwardingStatus(url, line) {
    const fetchUrl = nav.safe(url, 'fetch');
    try {
      if (!fetchUrl) throw new Error('not allowed');
      const page = new DOMParser().parseFromString(await (await fetch(fetchUrl, { credentials: 'include' })).text(), 'text/html');
      const addresses = [...(page.getElementById('str1') || page).querySelectorAll('td')].map((td) => clean(td.textContent))
        .filter((t) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(t));
      line.textContent = addresses.length ? T.forwarded([...new Set(addresses)].join(', ')) : T.notForwarded;
    } catch {
      line.textContent = T.unknown;
    }
  }

  // Background read (sync.js): parse a fetched page and store its data; nothing is drawn.
  (ipx.readers ||= {}).messages = (fetched, url) => {
    doc = fetched; here = new URL(url);
    try { const data = parse(); if (data?.unread != null) { ipx.state.messages = { updated: Date.now(), unread: data.unread }; ipx.save(); } } finally { doc = document; here = location; }
  };

  ipx.ready.then(() => {
    const data = parse();
    if (!data) return;
    if (data.unread != null) {
      ipx.state.messages = { updated: Date.now(), unread: data.unread };
      ipx.save();
    }
    const current = data.folders.find((f) => f.on);
    const line = h('span', {}, data.fwd ? T.forwarded(data.fwd) : '…');
    if (!data.fwd) forwardingStatus(data.forwarding, line);
    hideInSlot(chrome(data));
    styleSlotted();
    takeover({
      key: 'messages',
      css: ['kit.css'],
      title: nav.sectionLabel('messages.mail'),
      subtitle: nav.label('messages'),
      extra: [
        data.write && anchor({ href: data.write }, { class: 'btn', title: T.write }, icon('mail'), h('span', {}, T.write)),
        data.outlook && anchor({ href: data.outlook, target: '_blank' }, { class: 'btn ghost', title: T.outlook }, icon('globe'), h('span', {}, T.outlook)),
      ],
      slotted: [data.page],
      build: () => h('div', { class: 'kit-page' },
        h('p', { class: 'kit-note info msg-status' }, icon('info'), line,
          nav.safe(data.forwarding, 'link') && anchor({ href: data.forwarding }, { class: 'msg-change' }, T.change)),
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
