// InSIS+ — Study matters › Payments & scholarships › Fees (student/financovani.pl). Treatment R (docs/ia/03-pages.md,
// teardowns/study-matters.md §2.9).
// InSIS shows an info box, two tables with help paragraphs (the financing of the whole study, past and estimated,
// and the decisions on fees in 16 columns, or "No suitable data found") and a key of status icons, all inside a
// form that has no field or button. Here: what the financing is now and what InSIS expects to change (the date the
// standard length runs out is the one students miss), how many fee decisions exist, then both tables redrawn with
// labelled status chips instead of the key. No "nothing to pay" verdict: what an unpaid decision row looks like
// has not been verified yet (study-matters.md §2.9, open questions), so the page states facts, not a conclusion.
// Nothing is stored: payment details stay on this page (principle 8.1). Nothing on the page is an action.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.kit || !ipx.nav) return;
  const { lang, norm } = ipx;
  const { h, icon, anchor, kpi, locale } = ipx.ui;
  const kit = ipx.kit;
  const nav = ipx.nav;

  const T = {
    cs: { fees: 'Poplatky', scholarships: 'Stipendia', accounts: 'Bankovní účty', views: 'Platby a stipendia',
      benefit: 'Ubytovací stipendium', now: 'Financování teď', state: 'Hradí stát', until: (d) => `do ${d}`,
      from: (d) => `Od ${d}`, inMonths: (n) => (n < 1 ? 'tento měsíc' : n === 1 ? 'za měsíc' : n < 5 ? `za ${n} měsíce` : `za ${n} měsíců`), estimate: 'Odhad InSIS podle současných údajů', decisions: 'Rozhodnutí o poplatcích',
      noneIssued: 'Žádné nebylo vydáno', issued: (n) => (n === 1 ? '1 rozhodnutí' : `${n} rozhodnutí`),
      binding: 'Údaje jsou jen pro informaci: závazné je vytištěné rozhodnutí o vyměření poplatku.',
      financing: 'Financování studia', financingLead: 'Celé studium: co platilo, co platí a co InSIS odhaduje dopředu.',
      when: 'Kdy', finCol: 'Financování', sinceH: 'Od', untilH: 'Do', nowTag: 'Teď', past: 'Skončilo', future: (d) => `Od ${d}`,
      decisionsLead: 'Rozhodnutí o poplatcích za studium, která fakulta vydala.',
      noDecisions: 'Žádná rozhodnutí o poplatcích. Kdyby fakulta poplatek vyměřila (třeba po překročení standardní doby studia), objeví se tady.',
      type: 'Druh', sum: 'Částka', manual: 'Požadováno teď', issuedOn: 'Vydáno', due: 'Splatnost', status: 'Stav', settled: 'Úhrada', detail: 'Detail',
      payment: (t) => `Platební údaje${t ? ` · ${t}` : ''}`, copy: 'Kopírovat', copied: 'Zkopírováno',
      overview: 'Přehled poplatků po obdobích: kolik bylo v kterém období požadováno a kolik zaplaceno.',
      noOverview: 'Žádné poplatky za studium nejsou evidovány.', scholLead: 'Stipendia, která vám VŠE za toto studium vyplatila.',
      noSchol: 'Za toto studium vám zatím nebylo vyplaceno žádné stipendium.', scholWhere: 'Stipendia chodí na účet označený pro stipendia v Bankovních účtech.',
      payments: 'Výplaty', lastPaid: 'Poslední výplata',
      ask: 'Otázky k poplatkům', askText: 'Poplatky vyměřuje a vysvětluje studijní oddělení vaší fakulty; odvolání se podává formulářem v Žádostech.',
      statusOf: { 'stav-zruseno2': 'Zrušeno', 'stav-zaplaceno': 'Zaplaceno', 'stav-vytvoreno': 'Vytvořeno' },
      settledOf: { 'uhrazeno-pred-splatnosti': 'Uhrazeno včas', 'uhrazeno-po-splatnosti': 'Uhrazeno po splatnosti',
        'neuhrazeno-pred-splatnosti': 'Neuhrazeno, před splatností', 'neuhrazeno-po-splatnosti': 'Neuhrazeno, po splatnosti' } },
    en: { fees: 'Fees', scholarships: 'Scholarships', accounts: 'Bank accounts', views: 'Payments & scholarships',
      benefit: 'Accommodation benefit', now: 'Financing now', state: 'Funded by the state', until: (d) => `until ${d}`,
      from: (d) => `From ${d}`, inMonths: (n) => (n < 1 ? 'this month' : n === 1 ? 'in 1 month' : `in ${n} months`), estimate: 'InSIS’s estimate from current data', decisions: 'Fee decisions',
      noneIssued: 'None issued', issued: (n) => (n === 1 ? '1 decision' : `${n} decisions`),
      binding: 'This is for your information only: the printed decision on fee assessment is binding.',
      financing: 'Financing of your study', financingLead: 'The whole study: what applied, what applies now and what InSIS expects next.',
      when: 'When', finCol: 'Financing', sinceH: 'Since', untilH: 'Until', nowTag: 'Now', past: 'Ended', future: (d) => `From ${d}`,
      decisionsLead: 'Decisions on study fees issued by the faculty.',
      noDecisions: 'No fee decisions. If the faculty assesses a fee (for example after the standard length of study is exceeded), it appears here.',
      type: 'Type', sum: 'Sum', manual: 'Requested now', issuedOn: 'Issued', due: 'Due date', status: 'Status', settled: 'Payment', detail: 'Detail',
      payment: (t) => `Payment details${t ? ` · ${t}` : ''}`, copy: 'Copy', copied: 'Copied',
      overview: 'Fees per period of your study: what was requested in each period and what was paid.',
      noOverview: 'No study fees are recorded.', scholLead: 'Scholarships VŠE has paid to you for this study.',
      noSchol: 'No scholarships have been paid to you for this study yet.', scholWhere: 'Scholarships go to the account marked for scholarships under Bank accounts.',
      payments: 'Payments', lastPaid: 'Last payment',
      ask: 'Questions about fees', askText: 'The study department of your faculty assesses and explains fees; an appeal is a form under Requests.',
      statusOf: { 'stav-zruseno2': 'Cancelled', 'stav-zaplaceno': 'Paid', 'stav-vytvoreno': 'Created' },
      settledOf: { 'uhrazeno-pred-splatnosti': 'Settled before due date', 'uhrazeno-po-splatnosti': 'Settled past due date',
        'neuhrazeno-pred-splatnosti': 'Outstanding, not yet due', 'neuhrazeno-po-splatnosti': 'Outstanding, past due date' } },
  }[lang];

  // Tones of InSIS's status icons (data-sysid): the key InSIS draws under the table, as chip colours.
  const STATUS_TONE = { 'stav-zruseno2': 'neutral', 'stav-zaplaceno': 'ok', 'stav-vytvoreno': 'neutral' };
  const SETTLED_TONE = { 'uhrazeno-pred-splatnosti': 'ok', 'uhrazeno-po-splatnosti': 'ok', 'neuhrazeno-pred-splatnosti': 'warn', 'neuhrazeno-po-splatnosti': 'bad' };

  const dateOf = kit.dateOf;
  // Whole months from today to a date (at least 0), for "in 22 months".
  const monthsUntil = (d) => { const n = new Date(); return Math.max(0, (d.getFullYear() - n.getFullYear()) * 12 + d.getMonth() - n.getMonth() - (d.getDate() < n.getDate() ? 1 : 0)); };
  const day = (d) => d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  const col = (head, re) => head.findIndex((t) => re.test(norm(t)));

  // ---------- reading ----------

  function parse(page) {
    const tables = kit.findTables(page).map((t) => kit.readTable(t));
    // Financing: three columns (Financing · Since · Until). Decisions: the wide one with the payment columns.
    const fin = tables.find((t) => t.head.length <= 4 && col(t.head, /^financ/) >= 0);
    const dec = tables.find((t) => t !== fin && (col(t.head, /variab|iban/) >= 0 || t.head.length >= 8));
    if (!fin && !dec) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fi = fin ? { text: Math.max(0, col(fin.head, /^financ/)), since: col(fin.head, /^(since|odkdy|od\b)/), until: col(fin.head, /^(until|dokdy|do\b)/) } : null;
    const financing = (fin?.rows || []).filter((r) => r.cells.length > 1).map((r) => {
      const raw = r.cells[fi.text]?.text || '';
      // "1 - study fully financed from MŠMT": InSIS's code, then its meaning.
      const m = /^(\d+)\s*[-–]\s*(.+)$/.exec(raw);
      const since = dateOf(r.cells[fi.since]?.text);
      const until = dateOf(r.cells[fi.until]?.text);
      const when = since && since > today ? 'future' : until && until < today ? 'past' : 'now';
      return { code: m?.[1] || null, text: m ? m[2] : raw, sinceText: r.cells[fi.since]?.text || '', untilText: r.cells[fi.until]?.text || '', since, until, when };
    });

    // Decision rows: InSIS's "No suitable data found." is one cell across all columns.
    const k = (re) => (dec ? col(dec.head, re) : -1);
    const ix = {
      status: k(/^(status|stav)$/), account: k(/^(account number|cislo uctu)/), recipient: k(/^(recipient|prijemce|nazev prijemce)/),
      iban: k(/^iban/), swift: k(/^(swift|bic)/), vs: k(/variab|^var\.? ?symbol/), issued: k(/^(issue date|datum vydani|vydani|rozh)/), due: k(/^(due|splatnost|datum splatnosti)/),
      type: k(/^(type|typ|druh)$/), sum: k(/^(sum|castka|suma)$/), manual: k(/^(manually|rucne)/), settled: k(/^(settled|uhrazeno|uhrada)$/),
      detail: k(/^detail/),
    };
    const cell = (r, i) => (i >= 0 ? r.cells[i] : null);
    const sysid = (c) => c?.el.querySelector('[data-sysid]')?.dataset.sysid || null;
    const iconLabel = (c) => c?.el.querySelector('[aria-label]')?.getAttribute('aria-label') || '';
    const decisions = (dec?.rows || []).filter((r) => r.cells.length > 1).map((r) => {
      const st = cell(r, ix.status);
      const se = cell(r, ix.settled);
      const text = (i) => cell(r, i)?.text || '';
      return {
        type: text(ix.type), sum: text(ix.sum), manual: text(ix.manual), issued: text(ix.issued), due: text(ix.due),
        status: { id: sysid(st), text: T.statusOf[sysid(st)] || iconLabel(st) || text(ix.status) },
        settled: { id: sysid(se), text: T.settledOf[sysid(se)] || iconLabel(se) || text(ix.settled) },
        // Payment fields under InSIS's own column names; shown on this page only, never stored.
        pay: [ix.recipient, ix.account, ix.iban, ix.swift, ix.vs].filter((i) => i >= 0 && text(i)).map((i) => ({ label: dec.head[i], value: text(i) })),
        detail: cell(r, ix.detail)?.links[0] || null,
      };
    });
    return { financing, decisions, hasDecisionTable: !!dec, messages: kit.messages(page) };
  }

  // ---------- drawing ----------

  const chip = (s, tones) => (s.text ? h('span', { class: `delta ${tones[s.id] || 'neutral'}` }, s.text) : null);

  function summary(d) {
    const now = d.financing.find((f) => f.when === 'now');
    const next = d.financing.find((f) => f.when === 'future');
    // Code 1 is InSIS's "study fully financed by the ministry"; anything else is said in InSIS's own words.
    const funded = now?.code === '1';
    const count = d.decisions.length;
    return h('div', { class: 'kpis' },
      now && kpi({ label: T.now, value: funded ? T.state : now.text, isText: true, foot: now.until ? T.until(day(now.until)) : now.untilText }),
      next && kpi({ label: next.since ? T.from(day(next.since)) : T.from(next.sinceText), value: next.text, isText: true,
        status: next.code !== '1' && next.since && { tone: 'warn', text: T.inMonths(monthsUntil(next.since)) }, foot: T.estimate }),
      d.hasDecisionTable && kpi({ label: T.decisions, value: count, foot: count ? T.issued(count) : T.noneIssued }));
  }

  function financingTable(d) {
    if (!d.financing.length) return null;
    const rows = d.financing.map((f) => ({
      _tone: f.when === 'now' && f.code === '1' ? 'ok' : f.when === 'future' && f.code !== '1' ? 'warn' : null,
      text: f.text, since: f.sinceText, until: f.untilText,
      when: h('span', { class: `delta ${f.when === 'now' ? 'ok' : f.when === 'future' ? 'warn' : 'neutral'}` },
        f.when === 'now' ? T.nowTag : f.when === 'past' ? T.past : T.future(f.since ? day(f.since) : f.sinceText)),
    }));
    return h('section', { class: 'kit-stack fin-section' },
      h('div', {}, h('h2', { class: 'fin-title' }, T.financing), h('p', { class: 'muted small' }, T.financingLead)),
      kit.dataTable({ label: T.financing, rows, columns: [
        { key: 'text', label: T.finCol, main: true }, { key: 'since', label: T.sinceH },
        { key: 'until', label: T.untilH }, { key: 'when', label: T.when, align: 'end' }] }));
  }

  // A value with a Copy button (clipboard only, nothing leaves the browser).
  function copyable(value) {
    const btn = h('button', { type: 'button', class: 'fin-copy', 'aria-label': `${T.copy}: ${value}` }, T.copy);
    btn.addEventListener('click', () => navigator.clipboard?.writeText(value).then(() => { btn.textContent = T.copied; }, () => {}));
    return h('span', { class: 'fin-copyable' }, h('span', {}, value), btn);
  }

  function decisionsBlock(d) {
    if (!d.hasDecisionTable) return null;
    const anyManual = d.decisions.some((x) => x.manual && x.manual !== x.sum);
    const columns = [
      { key: 'type', label: T.type, main: true }, { key: 'sum', label: T.sum, align: 'end' },
      anyManual && { key: 'manual', label: T.manual, align: 'end' },
      { key: 'issued', label: T.issuedOn }, { key: 'due', label: T.due },
      { key: 'status', label: T.status }, { key: 'settled', label: T.settled }, { key: 'detail', label: T.detail },
    ].filter(Boolean);
    const rows = d.decisions.map((x) => ({
      _tone: SETTLED_TONE[x.settled.id] === 'bad' ? 'bad' : null,
      type: x.type, sum: x.sum, manual: x.manual !== x.sum ? x.manual : '', issued: x.issued, due: x.due,
      status: chip(x.status, STATUS_TONE), settled: chip(x.settled, SETTLED_TONE), detail: x.detail && { ...x.detail, text: x.detail.text || T.detail },
    }));
    // Payment details only for decisions that are neither cancelled nor paid nor settled.
    const open = d.decisions.filter((x) => x.pay.length && !['stav-zruseno2', 'stav-zaplaceno'].includes(x.status.id) && !/^uhrazeno/.test(x.settled.id || ''));
    return h('section', { class: 'kit-stack fin-section' },
      h('div', {}, h('h2', { class: 'fin-title' }, T.decisions), h('p', { class: 'muted small' }, T.decisionsLead)),
      kit.dataTable({ label: T.decisions, columns, rows, empty: T.noDecisions }),
      open.map((x) => h('section', { class: 'card pad' },
        h('h3', { class: 'card-title' }, T.payment(x.type)),
        kit.facts(x.pay.map((p) => ({ label: p.label, value: copyable(p.value) }))))));
  }

  function rail() {
    const office = nav.target('campus.office');
    const requests = nav.target('studies.requests');
    if (!office && !requests) return null;
    return h('aside', { class: 'kit-stack' },
      h('section', { class: 'card pad fin-ask' },
        h('h2', { class: 'card-title' }, T.ask),
        h('p', { class: 'muted small' }, T.askText),
        h('div', { class: 'fin-links' },
          office && anchor({ href: office }, { class: 'fin-link' }, icon('people'), h('span', {}, nav.label('campus.office'))),
          requests && anchor({ href: requests }, { class: 'fin-link' }, icon('mail'), h('span', {}, nav.sectionLabel('studies.requests'))))));
  }

  const portalLink = (path) => kit.portalLink(path);

  // The section's views: the portal's own links, else the plain address where the URL rule allows one. One header
  // for all three pages and the accommodation benefit form (kit.section; generic.js draws the pages this module
  // does not rebuild).
  const link = (path) => portalLink(path) || nav.safe(new URL(path, document.baseURI).href, 'link');
  const benefitAction = () => {
    const benefit = link('/auth/student/zadost_ubyt_stip.pl');
    return benefit && anchor({ href: benefit }, { class: 'btn ghost', title: T.benefit }, icon('home'), h('span', {}, T.benefit));
  };
  const money = kit.section({
    id: 'money',
    title: () => nav.sectionLabel('studies.money'),
    subtitle: () => nav.label('matters'),
    pages: { '/auth/student/financovani.pl': 'fees', '/auth/student/vypl_stip_student.pl': 'scholarships',
      '/auth/student/bank_spojeni_clovek.pl': 'accounts', '/auth/student/zadost_ubyt_stip.pl': null },
    views: () => [
      { id: 'fees', href: link('/auth/student/financovani.pl'), text: T.fees },
      { id: 'scholarships', href: link('/auth/student/vypl_stip_student.pl'), text: T.scholarships },
      { id: 'accounts', href: link('/auth/student/bank_spojeni_clovek.pl'), text: T.accounts },
    ],
    actions: () => [benefitAction()].filter(Boolean),
    // The header parts (the page action's narrow form) on the pages generic.js frames too (Bank accounts).
    css: ['pages/financing.css'],
  });

  // The section's two other information pages: the main menu's "Overview of financing" (financovani.pl?prehled:
  // no form, a summary per period, or InSIS's message that there is nothing) and Scholarships (vypl_stip_student.pl:
  // a table of payments, or InSIS's message). Both are read and drawn again; their tables in readable form, InSIS's
  // message as the empty state. Bank accounts and the accommodation benefit form stay generic.js's (forms, F later).
  function infoView(page, { view, lead, empty, foot }) {
    const tables = kit.findTables(page).map((t) => kit.readTable(t)).filter((d) => d.rows.some((r) => r.cells.length > 1));
    const msgs = kit.messages(page);
    const rows = tables.flatMap((d) => d.rows.filter((r) => r.cells.length > 1));
    const dates = rows.flatMap((r) => r.cells.map((c) => dateOf(c.text))).filter(Boolean).sort((a, b) => b - a);
    kit.page({
      key: `money-${view}`,
      css: ['pages/financing.css', 'pages/matters.css'],
      title: nav.sectionLabel('studies.money'),
      subtitle: nav.label('matters'),
      tabs: kit.sectionTabs(money, view),
      actions: money.actions(),
      build: () => [
        h('p', { class: 'muted mx-lead' }, lead),
        view === 'scholarships' && rows.length > 0 && h('div', { class: 'kpis' },
          kpi({ label: T.payments, value: rows.length }),
          dates[0] && kpi({ label: T.lastPaid, value: day(dates[0]), isText: true })),
        tables.length ? tables.map((d) => kit.dataTable({ label: lead, rows: d.rows.filter((r) => r.cells.length > 1).map((r) =>
          Object.fromEntries(r.cells.map((c, i) => [`c${i}`, c.links.length === 1 ? c.links[0] : c.text]))),
        columns: d.head.map((t, i) => ({ key: `c${i}`, label: t, main: i === 0, align: /sum|amount|castka|suma|kc\b|czk/.test(norm(t)) ? 'end' : null })) }))
          : h('div', { class: 'empty' }, h('p', {}, empty), foot && h('p', { class: 'muted small' }, foot)),
        // InSIS's message is the empty state when there is no table; otherwise (and any warning) a note.
        ...msgs.filter((m) => tables.length || (m.tone !== 'info' && m.tone !== 'bad')).map(kit.note),
      ],
    });
  }

  ipx.ready.then(() => {
    const route = nav.route(document.baseURI.split('#')[0]);
    const page = document.getElementById('str1');
    if (!page) return;
    if (route.path === '/auth/student/vypl_stip_student.pl') {
      const said = kit.messages(page)[0]?.text;
      infoView(page, { view: 'scholarships', lead: T.scholLead, empty: said || T.noSchol, foot: T.scholWhere });
      return;
    }
    if (route.path !== '/auth/student/financovani.pl') return;
    if (!page.querySelector('form[action*="financovani"]')) {
      if (route.params?.has('prehled')) infoView(page, { view: 'fees', lead: T.overview, empty: kit.messages(page)[0]?.text || T.noOverview });
      return;
    }
    const data = parse(page);
    if (!data) return;
    kit.page({
      key: 'financing',
      css: 'pages/financing.css',
      title: nav.sectionLabel('studies.money'),
      subtitle: nav.label('matters'),
      tabs: kit.sectionTabs(money, 'fees'),
      actions: money.actions(),
      build: () => [
        summary(data),
        data.messages.some((m) => m.tone === 'info') && kit.note({ tone: 'info', text: T.binding }),
        ...data.messages.filter((m) => m.tone !== 'info').map(kit.note),
        h('div', { class: 'kit-cols' },
          h('div', { class: 'kit-stack' }, financingTable(data), decisionsBlock(data)),
          rail()),
      ],
    });
  });
})();
