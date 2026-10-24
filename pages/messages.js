// InSIS+ — Messages: InSIS's mail box (posta/slozka.pl), kept as InSIS shows it, with one box above it that answers
// "where do my messages arrive?": whether InSIS forwards its mail (the mail box states it; else InSIS's forwarding
// page is read when this page is opened) and a button to the university e-mail in Outlook (InSIS's own link).
// Stored for the envelope badge: ipx.state.messages = { updated, unread } (the count InSIS shows, nothing else).
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.ui || !ipx.nav) return;
  const { lang, clean } = ipx;
  const { h, icon, anchor, takeover, styleSlotted } = ipx.ui;
  const nav = ipx.nav;

  const T = {
    cs: { title: 'Kam chodí zprávy?', insis: 'Toto je pošta uvnitř InSIS. Univerzitní e-mail je v Outlooku.',
      forwarded: (list) => `InSIS přeposílá tuto poštu na: ${list}.`, notForwarded: 'InSIS tuto poštu nikam nepřeposílá: zprávy čtěte tady.',
      unknown: 'Přeposílání se nepodařilo zjistit.', outlook: 'Otevřít univerzitní e-mail', settings: 'Nastavit přeposílání' },
    en: { title: 'Where do messages arrive?', insis: 'This is the mail inside InSIS. Your university e-mail is in Outlook.',
      forwarded: (list) => `InSIS forwards this mail to: ${list}.`, notForwarded: 'InSIS does not forward this mail: read your messages here.',
      unknown: 'Forwarding could not be checked.', outlook: 'Open university e-mail', settings: 'Set up forwarding' },
  }[lang];

  function parse() {
    const page = document.getElementById('str1');
    if (!page || !page.querySelector('form[action*="posta/slozka.pl"]') || !page.querySelector('table.portal_menu')) return null;
    const outlook = page.querySelector('table.portal_menu a[href*="outlook"]');
    const forwarding = new URL('/auth/posta/forwardy.pl', document.baseURI).href;
    const text = clean(page.textContent);
    const fwd = /(?:forwarded to|přeposílány na|přesměrovány na)\s*:?\s*([^\s@]+@[^\s@]+\.[a-z]{2,})/i.exec(text)?.[1] || null;
    const unread = /(?:unread|nepřečten\w*)\s*:\s*(\d+)/i.exec(text)?.[1];
    return { page, outlook: outlook && nav.safe(outlook.href, 'link', { copied: true }), forwarding, fwd, unread: unread == null ? null : Number(unread) };
  }

  async function forwardingStatus(url, line) {
    const fetchUrl = nav.safe(url, 'fetch');
    try {
      if (!fetchUrl) throw new Error('not allowed');
      const doc = new DOMParser().parseFromString(await (await fetch(fetchUrl, { credentials: 'include' })).text(), 'text/html');
      const addresses = [...(doc.getElementById('str1') || doc).querySelectorAll('td')].map((td) => clean(td.textContent))
        .filter((t) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(t));
      line.textContent = addresses.length ? T.forwarded([...new Set(addresses)].join(', ')) : T.notForwarded;
    } catch {
      line.textContent = T.unknown;
    }
  }

  ipx.ready.then(() => {
    const data = parse();
    if (!data) return;
    if (data.unread != null) {
      ipx.state.messages = { updated: Date.now(), unread: data.unread };
      ipx.save();
    }
    if (ipx.syncOnly) return;
    const line = h('p', { class: 'msg-line' }, data.fwd ? T.forwarded(data.fwd) : '…');
    if (!data.fwd) forwardingStatus(data.forwarding, line);
    styleSlotted();
    takeover({
      key: 'messages',
      title: nav.label('messages'),
      slotted: [data.page],
      build: () => h('section', { class: 'card msg-where' },
        h('div', { class: 'msg-text' }, h('strong', {}, T.title), h('p', { class: 'muted' }, T.insis), line),
        h('div', { class: 'msg-actions' },
          data.outlook && anchor({ href: data.outlook, target: '_blank' }, { class: 'btn' }, icon('mail'), ' ', T.outlook),
          nav.safe(data.forwarding, 'link') && anchor({ href: data.forwarding }, { class: 'btn ghost' }, T.settings))),
    });
  });
})();
