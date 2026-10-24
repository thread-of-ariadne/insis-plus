// InSIS+ — Account: E-mail & accounts (sit/univ_posta.pl, ca/ucet.pl, ca/ucty_info.pl, sit/), Apps & devices
// (system/mobilni_aplikace.pl; system/mobilni_zarizeni.pl shares its header), Approvals (system/oou_uziv.pl) and the
// Access system (ps/, ps/povolene_body.pl, ps/body.pl; ps/moje_pruchody.pl shares its header). Treatments F, R and L
// (docs/ia/03-pages.md, teardowns/campus-messages-account.md §2.15–2.20). Uses pages/rebuild.js.
//
// Each group is one section with one header on all its pages and one row of view tabs (InSIS's tab rows and the
// pages they join): E-mail & accounts — University e-mail · Accounts; Apps & devices — Devices · Apps ·
// Authorisations; Access system — My card · Permitted points · All points · My passes; Approvals — InSIS's two tabs.
//   University e-mail (F): where e-mail is delivered now (from InSIS's notice) as the summary, one warning line, and
//     InSIS's own form in a form card; a line naming the other setting (InSIS mail forwarding).
//   Accounts (R): the login facts as a card, one card per server (status, valid until, quota), the addresses.
//   Apps (L): InSIS's list stays in place (its Permitted switch is an action link), styled as rows; icons in words.
//   Approvals (F): how many are granted, InSIS's form in a form card, each approval styled as a card in place.
//   Access points (L): InSIS's tree stays in place (its point links are InSIS's), as grouped lists, with a filter.
//   Devices (mobilni_zarizeni.pl) and My passes (ps/moje_pruchody.pl), not captured yet: B — InSIS's content under
//     the section's header and tabs, help lines hidden, each form a card (the pairing QR code stays InSIS's own).
// Nothing is stored or fetched; passes and points are drawn on the page only.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.rb || !ipx.kit || !ipx.nav) return;
  const { lang, clean, norm } = ipx;
  const { h, icon, anchor } = ipx.ui;
  const kit = ipx.kit;
  const nav = ipx.nav;
  const rb = ipx.rb;

  const T = {
    cs: { delivery: 'Univerzitní e-mail', accounts: 'Účty na serverech', devices: 'Zařízení', apps: 'Aplikace', auths: 'Pověření',
      card: 'Moje karta', permitted: 'Povolené body', allPoints: 'Všechny body', passes: 'Moje průchody', approvals: 'Souhlasy',
      deliveredTo: (s) => `Pošta se doručuje na: ${s}`, deliveryWarn: 'Změnou se přesune, kam přichází nová univerzitní pošta. InSIS ji provede, až stisknete Nastavit distribuční server.',
      otherSetting: 'Přeposílání pošty z InSIS je jiné nastavení:', mailSettings: 'Nastavení pošty v InSIS',
      login: 'Přihlášení', servers: 'Servery', addresses: 'E-mailové adresy', valid: 'Platnost do', status: 'Stav', quota: 'Kvóta', reasons: 'Důvody nároku',
      aboutServers: 'O univerzitních serverech', grace: 'Ochranná lhůta', serverInfo: 'Podrobnosti serveru',
      appsLead: 'Přepínač u aplikace platí hned: jakmile ho stisknete, InSIS jí přístup k vašim údajům povolí, nebo zakáže.', appsSummary: (a, n) => `${a} z ${n} aplikací má přístup`,
      granted: (g, n) => `${g} z ${n} ${kit.plural(n, 'souhlasu', 'souhlasů', 'souhlasů')} uděleno`, approvalsLead: 'InSIS zaznamená vaši volbu, až stisknete tlačítko; později ji můžete změnit.',
      notGranted: (n) => `${n} ${kit.plural(n, 'souhlas chybí', 'souhlasy chybí', 'souhlasů chybí')}`,
      noCard: 'Nemáte aktivní kartu.', pointsLead: 'Strom přístupových bodů z InSIS; podrobnosti bodu otevřete v InSIS.', findPoint: 'Hledat bod, budovu…',
      hub: 'Odkazy této stránky InSIS', formLead: 'Formulář InSIS: provede se, až stisknete jeho tlačítko.' },
    en: { delivery: 'University e-mail', accounts: 'Server accounts', devices: 'Devices', apps: 'Apps', auths: 'Authorisations',
      card: 'My card', permitted: 'Permitted points', allPoints: 'All points', passes: 'My passes', approvals: 'Approvals',
      deliveredTo: (s) => `Your e-mail is delivered to: ${s}`, deliveryWarn: 'Changing this moves where new university e-mail arrives. InSIS changes it when you press Set distribution server.',
      otherSetting: 'Forwarding of InSIS mail is a different setting:', mailSettings: 'InSIS mail settings',
      login: 'Sign-in', servers: 'Servers', addresses: 'E-mail addresses', valid: 'Valid until', status: 'Status', quota: 'Quota', reasons: 'Reasons for entitlement',
      aboutServers: 'About university servers', grace: 'Grace time', serverInfo: 'Server details',
      appsLead: 'An app’s switch acts at once: when you press it, InSIS permits or prohibits the app’s access to your data.', appsSummary: (a, n) => `${a} of ${n} apps have access`,
      granted: (g, n) => `${g} of ${n} approvals granted`, approvalsLead: 'InSIS records your choice when you press a button; you can change it later.',
      notGranted: (n) => `${n} not granted`,
      noCard: 'You have no active card.', pointsLead: 'InSIS’s tree of access points; a point’s details open in InSIS.', findPoint: 'Find a point, building…',
      hub: 'Links of this InSIS page', formLead: 'InSIS’s form: it runs when you press its button.' },
  }[lang];

  const ORIGIN = () => new URL(document.baseURI).origin;
  const plain = (path, params = '') => nav.safe(`${ORIGIN()}${path}${params ? `?${params}` : ''}`, 'link');
  const route = () => nav.route(document.baseURI.split('#')[0]);

  // ---------- sections ----------

  const email = kit.section({
    id: 'email', title: () => nav.sectionLabel('account.email'), subtitle: () => nav.label('account'),
    pages: { '/auth/sit/univ_posta.pl': 'delivery', '/auth/ca/ucet.pl': (r) => (r.params?.has('info') || r.params?.has('narok') ? null : 'accounts'),
      '/auth/ca/ucty_info.pl': null, '/auth/sit/': null },
    views: () => [{ id: 'delivery', text: T.delivery, href: plain('/auth/sit/univ_posta.pl') }, { id: 'accounts', text: T.accounts, href: plain('/auth/ca/ucet.pl') }],
    node: () => 'account.email',
  });
  const devices = kit.section({
    id: 'devices', title: () => nav.sectionLabel('account.devices'), subtitle: () => nav.label('account'),
    pages: { '/auth/system/mobilni_zarizeni.pl': 'devices', '/auth/system/mobilni_aplikace.pl': (r) => (r.params?.has('vydanapovereni') ? 'auths' : 'apps') },
    views: () => [{ id: 'devices', text: T.devices, href: plain('/auth/system/mobilni_zarizeni.pl') }, { id: 'apps', text: T.apps, href: plain('/auth/system/mobilni_aplikace.pl') },
      { id: 'auths', text: T.auths, href: plain('/auth/system/mobilni_aplikace.pl', 'vydanapovereni=1') }],
    node: () => 'account.devices',
  });
  const access = kit.section({
    id: 'access', title: () => nav.sectionLabel('account.access'), subtitle: () => nav.label('account'),
    pages: { '/auth/ps/': 'card', '/auth/ps/povolene_body.pl': 'permitted', '/auth/ps/body.pl': 'all', '/auth/ps/moje_pruchody.pl': 'passes' },
    views: () => [{ id: 'card', text: T.card, href: plain('/auth/ps/') }, { id: 'permitted', text: T.permitted, href: plain('/auth/ps/povolene_body.pl') },
      { id: 'all', text: T.allPoints, href: plain('/auth/ps/body.pl') }, { id: 'passes', text: T.passes, href: plain('/auth/ps/moje_pruchody.pl') }],
    node: () => 'account.access',
  });
  // Approvals: InSIS's two tabs (personal data · study) are the views; their links carry InSIS's group id.
  const approvalTabs = () => {
    const row = [...(document.getElementById('str1')?.querySelectorAll('table.portal_menu td') || [])];
    const here = nav.safe(document.baseURI.split('#')[0], 'link', { copied: true });
    return row.map((td, i) => {
      const a = td.querySelector('a[href]');
      return { id: `t${i}`, text: clean(td.textContent), href: a ? nav.safe(a.href, 'link', { copied: true }) : here, on: !a };
    }).filter((t) => t.text && t.href);
  };
  const approvals = kit.section({
    id: 'approvals', title: () => T.approvals, subtitle: () => nav.sectionLabel('account.profile'),
    pages: { '/auth/system/oou_uziv.pl': (r) => (r.params?.has('historie') ? null : 'current') },
    views: () => approvalTabs().map((t) => ({ ...t, id: t.on ? 'current' : t.id })),
    node: () => 'account.profile',
  });

  const head = (s, view) => ({ title: s.title(), subtitle: s.subtitle(), actions: s.actions?.(view), tabs: kit.sectionTabs(s, view) });
  const formCard = (lead, ...extra) => h('section', { class: 'card pad rb-form' }, lead && h('p', { class: 'muted form-lead' }, lead), ...extra, h('slot'));
  const hasSlot = (nodes) => nodes.flat(Infinity).some((n) => n instanceof Node && (n.matches?.('slot') || n.querySelector?.('slot')));

  // ---------- University e-mail (sit/univ_posta.pl) ----------

  function deliveryPage(page) {
    const form = page.querySelector('form[action*="univ_posta.pl"]');
    if (!form) return null;
    const notes = [...form.querySelectorAll('.uis_msg')];
    const current = clean(notes.find((n) => n.querySelector('b'))?.querySelector('b')?.textContent);
    const others = notes.filter((n) => !n.querySelector('b')).map((n) => ({ tone: 'info', text: kit.cellText(n.querySelector('.text') || n) }));
    const fwd = plain('/auth/posta/forwardy.pl');
    // The heading and help lines inside InSIS's form say what the summary and the lead say.
    const inForm = [...notes, ...form.querySelectorAll('div.small'), ...[...form.querySelectorAll(':scope > b')].filter((b) => !b.closest('table'))];
    return {
      hide: inForm, only: form,
      nodes: [
        current && h('p', { class: 'kit-note ok' }, icon('mail'), h('span', {}, h('strong', {}, T.deliveredTo(current)))),
        ...others.map(kit.note),
        formCard(T.deliveryWarn),
        fwd && h('p', { class: 'muted small acc-cross' }, T.otherSetting, ' ', anchor({ href: fwd }, {}, T.mailSettings)),
      ],
    };
  }

  // ---------- Accounts (ca/ucet.pl) ----------

  function accountsPage(page) {
    const tables = [...page.querySelectorAll('table')].filter((t) => !t.closest('table.portal_menu'));
    const login = tables.find((t) => !t.querySelector('th, .zahlavi') && rb.factsOf(t).length >= 3);
    const servers = tables.find((t) => /server/i.test(t.rows[0]?.textContent || '') && t.rows[0]?.cells.length > 5);
    const mails = tables.find((t) => t !== servers && kit.findTables(page).includes(t) && t.rows[0]?.cells.length === 2);
    if (!login && !servers) return null;
    const rows = servers ? [...servers.rows].filter((tr) => tr.closest('table') === servers && !tr.querySelector('th, td.zahlavi') && !tr.classList.contains('zahlavi') && tr.cells.length > 5) : [];
    const cards = rows.map((tr) => {
      const c = [...tr.cells];
      const name = c[0].querySelector('a[href]');
      const info = name && rb.link(name);
      const last = c.length - 1;
      const status = kit.cellText(c[last - 1]);
      const valid = kit.cellText(c[last - 2]);
      const reasons = c[last].querySelector('a[href]') && rb.link(c[last].querySelector('a[href]'));
      const quota = [1, 2, 3, 4].map((i) => kit.cellText(c[i] || document.createElement('td'))).filter(Boolean);
      return h('section', { class: 'rb-card acc-server' },
        h('div', { class: 'rb-card-top' }, h('span', { class: 'rb-badge' }, icon('cpu')),
          h('span', {}, info ? anchor(info, { class: 'acc-name' }, clean(c[0].textContent)) : h('strong', {}, clean(c[0].textContent)),
            valid && h('small', {}, `${T.valid} ${valid}`))),
        h('div', { class: 'rm-meta acc-meta' },
          status && h('span', { class: `delta ${/activ|aktiv/i.test(status) ? 'ok' : 'warn'}` }, status),
          quota.length > 0 && h('span', { class: 'tag' }, `${T.quota}: ${quota.join(' / ')}`),
          reasons && anchor(reasons, { class: 'acc-link' }, T.reasons)));
    });
    const mailData = mails ? kit.readTable(mails) : null;
    const tip = page.querySelector('.uis_msg.tip a[href]');
    const about = tip && rb.link(tip);
    return {
      nodes: [
        login && h('section', { class: 'card pad rb-facts' }, h('h2', { class: 'card-title' }, T.login), kit.facts(rb.factsOf(login))),
        cards.length > 0 && rb.title(T.servers), cards.length > 0 && h('div', { class: 'rb-grid' }, cards),
        mailData && rb.title(T.addresses), mailData && rb.table(mailData, { label: T.addresses }),
        about && anchor(about, { class: 'rb-chip acc-about' }, T.aboutServers, icon('arrow')),
      ],
    };
  }

  // ---------- documentation pages (ca/ucty_info.pl): InSIS's text is the content ----------

  function docPage(page) {
    const skip = rb.chrome(page).filter((n) => !n.matches('div.small, span.small'));
    const list = rb.blocks(page, { skip });
    return { kept: true, hide: rb.redrawn(list), nodes: rb.render(list) };
  }

  // ---------- menu hub (sit/) ----------

  function hubPage(page) {
    // InSIS's menu links carry its menu id (_m), which only tells InSIS which menu was clicked: left out.
    const links = [...page.querySelectorAll('#vsechny-polozky .polozky a[href]')].map((a) => {
      const href = nav.safe(a.href.replace(/([?;&])_m=\d+[;&]?/, '$1').replace(/[?;&]$/, ''), 'link', { copied: true });
      return href && { href, text: clean(a.textContent) };
    }).filter((l) => l?.text);
    if (!links.length) return null;
    return { nodes: [h('p', { class: 'rb-sub' }, T.hub), h('section', { class: 'card rb-list' }, links.map((l) => anchor(l, { class: 'rb-row' }, h('span', {}, l.text), icon('arrow'))))] };
  }

  // ---------- Apps / Authorisations (system/mobilni_aplikace.pl): InSIS's list, in place ----------

  function appsPage(page) {
    const table = kit.findTables(page)[0];
    if (!table) return null;
    const d = kit.readTable(table);
    const rows = d.rows.filter((r) => r.cells.length > 2);
    const hasActions = [...table.querySelectorAll('a[href]')].some(rb.isAction);
    const allowed = rows.filter((r) => r.el.querySelector('[data-sysid="stav-povoleno"]')).length;
    const notes = [...page.querySelectorAll('.uis_msg')].filter((n) => !n.closest('table'));
    if (!hasActions) {
      // Nothing to act on (the issued-authorisations list is empty, or has no Remove links): drawn again.
      return { hide: [table, ...notes], nodes: [rb.table(d, { label: T.apps })] };
    }
    table.setAttribute('data-ipx-apps', '');
    // Cells marked by their column (InSIS's script adds a row-number cell in front once the page has loaded).
    const ROLES = [['status', /^(status|stav)$/], ['app', /^(application|aplikace)$/], ['provider', /^(provider|poskytovatel|dodavatel)$/],
      ['detail', /^detail$/], ['action', /^(permitted|povoleno|remove|odebrat|zrušit)/]];
    const roles = d.head.map((t) => ROLES.find(([, re]) => re.test(norm(t)))?.[0] || null);
    for (const r of rows) {
      const cells = [...r.el.children];
      const offset = Math.max(0, cells.length - roles.length);
      cells.forEach((td, i) => td.setAttribute('data-ipx-col', i < offset ? 'num' : roles[i - offset] || 'other'));
    }
    document.documentElement.classList.add('ipx-acc-apps');
    return {
      hide: notes,
      nodes: [
        rows.length > 0 && page.querySelector('[data-sysid^="stav-"]') && h('p', { class: 'rb-status' }, h('strong', {}, T.appsSummary(allowed, rows.length))),
        // One short warning: InSIS's own paragraph says the same at length (it is hidden, not repeated).
        kit.note({ tone: 'warn', text: T.appsLead }),
        h('slot'),
      ],
    };
  }

  // ---------- Approvals (system/oou_uziv.pl) ----------

  function approvalsPage(page) {
    const form = page.querySelector('form[action*="oou_uziv.pl"]');
    if (!form) return null;
    const items = [...form.querySelectorAll('div.souhlas')];
    const granted = items.filter((d) => d.classList.contains('bunka_zelena')).length;
    for (const d of items) {
      d.setAttribute('data-ipx-approval', d.classList.contains('bunka_zelena') ? 'granted' : 'missing');
      // InSIS's grant / revoke switches are controls drawn as icons: they stay pictures.
      d.querySelector('.souhlas_cudliky')?.setAttribute('data-ipx-nolabel', '');
    }
    form.setAttribute('data-ipx-approvals', '');
    document.documentElement.classList.add('ipx-acc-approvals');
    // InSIS's intro paragraph inside the form (shortened into the lead) and its key.
    const intro = form.querySelector('table.souhlasy_table > tbody > tr:first-child > td:first-child span.small');
    return {
      only: form,
      hide: [intro, ...form.querySelectorAll('.uisLegend')].filter(Boolean),
      nodes: [
        items.length > 0 && h('div', { class: 'rb-status' },
          h('span', { class: `delta ${granted === items.length ? 'ok' : 'warn'}` }, T.granted(granted, items.length)),
          granted < items.length && h('span', { class: 'muted small' }, T.notGranted(items.length - granted))),
        formCard(T.approvalsLead),
      ],
    };
  }

  // ---------- Access system ----------

  function cardPage(page) {
    const list = rb.blocks(page, { skip: rb.chrome(page) });
    const facts = list.filter((b) => b.type === 'facts' || b.type === 'table');
    const said = list.find((b) => b.type === 'text');
    return {
      kept: true,
      hide: rb.redrawn(list),
      nodes: facts.length ? rb.render(list.filter((b) => b.type !== 'text' || b !== said)) : [h('div', { class: 'empty' }, h('p', {}, said?.text || T.noCard))],
    };
  }

  function pointsPage(page) {
    const tree = page.querySelector('div.tree');
    if (!tree) return null;
    tree.setAttribute('data-ipx-rb', 'keep');
    const lis = [...tree.querySelectorAll('li')];
    const labelOf = (li) => norm(clean(li.querySelector(':scope > .node-container .node-label')?.textContent || ''));
    const input = h('input', { type: 'search', class: 'rb-filter-input', placeholder: T.findPoint, 'aria-label': T.findPoint, autocomplete: 'off' });
    // The filter only toggles a data- attribute on InSIS's list items (CSS hides them); a match keeps its parents.
    input.addEventListener('input', () => {
      const q = norm(input.value.trim());
      if (!q) { lis.forEach((li) => li.removeAttribute('data-ipx-off')); return; }
      lis.forEach((li) => li.setAttribute('data-ipx-off', ''));
      for (const li of lis) {
        if (!labelOf(li).includes(q)) continue;
        for (let p = li; p && p !== tree; p = p.parentElement) if (p.tagName === 'LI') p.removeAttribute('data-ipx-off');
        li.querySelectorAll('li').forEach((c) => c.removeAttribute('data-ipx-off'));
      }
    });
    return { hide: [], nodes: [h('p', { class: 'rb-sub' }, T.pointsLead), h('label', { class: 'rb-filter' }, icon('search'), input), h('section', { class: 'card pad acc-tree' }, h('slot'))] };
  }

  // ---------- dispatch ----------

  ipx.ready.then(() => {
    const page = document.getElementById('str1');
    if (!page) return;
    const r = route();
    const p = r.path || '';
    let hdr;
    let built;
    let key = 'account';
    if (p === '/auth/sit/univ_posta.pl') { hdr = head(email, 'delivery'); built = deliveryPage(page); }
    else if (p === '/auth/ca/ucet.pl' && !r.params.has('info') && !r.params.has('narok')) { hdr = head(email, 'accounts'); built = accountsPage(page); }
    else if (p === '/auth/ca/ucet.pl') {
      hdr = head(email, null);
      const list = rb.blocks(page, { skip: rb.chrome(page) });
      built = { kept: true, hide: rb.redrawn(list), nodes: rb.render(list, { keepCard: (slot) => formCard(T.formLead, slot) }) };
    } else if (p === '/auth/ca/ucty_info.pl') { hdr = { ...head(email, null), title: clean(document.title) || T.aboutServers }; built = docPage(page); }
    else if (p === '/auth/sit/') { hdr = { ...head(email, null), title: rb.crumbs(page).at(-1) || nav.sectionLabel('account.email') }; built = hubPage(page); }
    else if (p === '/auth/system/mobilni_aplikace.pl') { hdr = head(devices, r.params.has('vydanapovereni') ? 'auths' : 'apps'); built = appsPage(page); }
    else if (p === '/auth/system/oou_uziv.pl' && !r.params.has('historie')) { hdr = head(approvals, 'current'); built = approvalsPage(page); }
    else if (p === '/auth/system/oou_uziv.pl') {
      hdr = head(approvals, null);
      const list = rb.blocks(page, { skip: rb.chrome(page) });
      built = { kept: true, hide: rb.redrawn(list), nodes: rb.render(list) };
    } else if (p === '/auth/ps/') { hdr = head(access, 'card'); built = cardPage(page); }
    else if (p === '/auth/system/mobilni_zarizeni.pl' || p === '/auth/ps/moje_pruchody.pl') {
      // Pages of these sections without a snapshot yet (device pairing, my passes): InSIS's content under the
      // section's header, help lines and keys hidden, each InSIS form a card. The pairing QR code stays InSIS's own.
      hdr = p.endsWith('mobilni_zarizeni.pl') ? head(devices, 'devices') : head(access, 'passes');
      for (const f of page.querySelectorAll('form')) if ([...f.elements].some((e) => e.type !== 'hidden')) f.setAttribute('data-ipx-card', '');
      built = { hide: rb.chrome(page), nodes: [h('p', { class: 'rb-sub' }, T.formLead), h('slot')] };
    } else if (p === '/auth/ps/povolene_body.pl' || p === '/auth/ps/body.pl') { hdr = head(access, p.endsWith('povolene_body.pl') ? 'permitted' : 'all'); built = pointsPage(page); }
    else return;
    if (!built) return;
    const nodes = built.nodes.filter(Boolean);
    rb.frame({ key, css: 'pages/account.css', title: hdr.title, subtitle: hdr.subtitle, actions: hdr.actions, tabs: hdr.tabs,
      slot: hasSlot(nodes), kept: !!built.kept, hide: built.hide || [], only: built.only, build: () => nodes });
  });
})();
