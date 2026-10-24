// InSIS+ — one submission box (student/odevzdavarny_odevzdani.pl). Treatment F with the file list L in place
// (teardowns/courses.md §2.4 "Box page").
// InSIS's page: portal bar; a bold heading "Individual coursework submission - <course> (<CODE>)"; a help line; the
// box's facts as a two-column table (Name · Type · Status · Date of opening · Date of conclusion · Announced for ·
// Coursework submission quota); then two forms: the upload form (empty while the box is closed) and the form that
// holds "List of entered files" — a help line, InSIS's message (e.g. "Files failed to properly handed in." with its
// explanation), the table Name · File · Description · Size · Entered on · Entered by, where File is InSIS's download
// link and Description InSIS's link to edit the description (both actions).
// Here: the header says which box (title = the box's name, eyebrow All submissions — a page of the Submissions
// section), the lead says where it stands (open until … with a countdown / closed on …, files handed in, the course
// → its course page) with the facts as a list; InSIS's facts table, heading and help lines are hidden. Both forms
// stay InSIS's own, in place: the upload form as a form card with one line on what InSIS does (InSIS+ never touches
// the file input), the file list styled as list rows (the download link as the file badge stretched over the row,
// the description link as a button), InSIS's message kept and styled. An open box's controls in the list (if any)
// are never hidden (lists.js). Nothing is stored; nothing is fetched.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.kit || !ipx.lists) return;
  const { lang, clean, norm } = ipx;
  const { h, icon, anchor, countdown, deadlineTone } = ipx.ui;
  const kit = ipx.kit;
  const nav = ipx.nav;
  const L = ipx.lists;
  const PATH = '/auth/student/odevzdavarny_odevzdani.pl';
  const locale = lang === 'cs' ? 'cs-CZ' : 'en-GB';

  const T = {
    cs: { box: 'Odevzdávárna', files: 'Vaše soubory', desc: 'Popis', openUntil: (d) => `Otevřeno do ${d}`, closedOn: (d) => `Uzavřeno ${d}`,
      opensOn: (d) => `Otevře se ${d}`, closed: 'Uzavřeno', handed: (n) => `${n} ${kit.plural(n, 'soubor', 'soubory', 'souborů')}`, nothing: 'nic neodevzdáno',
      notHanded: (n) => `${n} ${kit.plural(n, 'soubor', 'soubory', 'souborů')} neodevzdáno řádně`,
      group: 'Skupinová odevzdávárna: platí i soubor, který vloží spolužák ze skupiny.', coursePage: 'Stránka předmětu',
      upload: 'Vyberte soubor a stiskněte tlačítko InSIS; soubor je odevzdaný, až to InSIS potvrdí.',
      opens: 'Otevření', closes: 'Uzavření', slot: 'Vypsáno pro', quota: 'Kvóta', type: 'Typ' },
    en: { box: 'Submission box', files: 'Your files', desc: 'Description', openUntil: (d) => `Open until ${d}`, closedOn: (d) => `Closed on ${d}`,
      opensOn: (d) => `Opens on ${d}`, closed: 'Closed', handed: (n) => `${n} ${n === 1 ? 'file' : 'files'}`, nothing: 'nothing handed in',
      notHanded: (n) => `${n} ${n === 1 ? 'file' : 'files'} not handed in properly`,
      group: 'Group box: a file a teammate hands in counts for the whole group.', coursePage: 'Course page',
      upload: "Choose the file and press InSIS's button; the file is handed in when InSIS confirms it.",
      opens: 'Opens', closes: 'Closes', slot: 'Announced for', quota: 'Quota', type: 'Type' },
  }[lang];

  // The facts by InSIS's labels (Czech and English).
  const FACT = [['name', /^(name of a coursework|nazev odevzdavarny)/], ['type', /^(type|typ)$/], ['status', /^(status|stav)$/],
    ['opens', /(date of opening|datum otevreni)/], ['closes', /(date of conclusion|datum uzavreni)/], ['slot', /(announced for|vypsano pro)/],
    ['quota', /(quota|kvota)/]];

  let box = null; // what ready() found, for the header

  const mineCodes = () => new Set([...(ipx.state.studyRecord?.courses || []).map((c) => c.code), ...(ipx.state.timetable?.events || []).map((e) => e.code)].filter(Boolean));
  const coursePage = () => (box?.code && mineCodes().has(box.code) ? nav.composedUrl('course.submissions', box.code) : null);

  kit.section({
    id: 'submission-box',
    css: ['pages/course-pages.css'],
    title: () => box?.name || T.box,
    subtitle: () => nav.sectionLabel('courses.submissions'),
    pages: { [PATH]: null },
    views: () => [],
    node: () => 'courses.submissions',
    actions: () => {
      const href = coursePage();
      return href ? [anchor({ href }, { class: 'btn ghost' }, icon('book'), h('span', {}, T.coursePage))] : [];
    },
    lead: () => box?.lead() || null,
  });

  // One date format on the whole page, the summary and the facts alike: "Mon 1 Feb 00:00" (InSIS's own clock time,
  // never "24:00 of the day before", so the chip and the facts list name the same day).
  const stamp = (d) => `${d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })} ${d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
  const when = (text) => { const d = kit.dateOf(text); return d ? stamp(d) : text; };

  ipx.ready.then(() => {
    if (nav.route(document.baseURI.split('#')[0]).path !== PATH) return;
    const page = document.getElementById('str1');
    if (!page) return;
    // The facts table: outside InSIS's forms, label/value rows.
    const factsTable = [...page.querySelectorAll('table')].find((t) => !t.closest('form') && kit.keyValues(t).some((f) => FACT.some(([k, re]) => k === 'closes' && re.test(norm(f.label)))));
    if (!factsTable) return;
    const facts = {};
    for (const f of kit.keyValues(factsTable)) {
      const key = FACT.find(([, re]) => re.test(norm(f.label)))?.[0];
      if (key && !(key in facts)) facts[key] = f.value;
    }
    // "Individual coursework submission - <course name> (<CODE>)"
    const heading = [...page.querySelectorAll('b')].find((b) => !b.closest('table, form') && /\([0-9A-Z]{4,8}\)\s*$/.test(clean(b.textContent)));
    const [, courseName = '', code = ''] = /-\s*(.+?)\s*\(([0-9A-Z]{4,8})\)\s*$/.exec(clean(heading?.textContent)) || [];
    const opens = kit.dateOf(facts.opens);
    const closes = kit.dateOf(facts.closes);
    const now = new Date();
    const isClosed = /closed|zavren|uzavren/.test(norm(facts.status || '')) || (closes && closes <= now);
    const notYet = !isClosed && opens && opens > now;
    const group = /group|skupin/.test(norm(facts.type || ''));

    // The file list: the table inside InSIS's form with a size column.
    const files = [...page.querySelectorAll('form table')].find((t) => L.columns(t).some((x) => /^(size|velikost)$/.test(norm(x))));
    let count = 0;
    if (files) {
      const { rows } = L.mark(files, (t) => (/^(name|nazev)$/.test(t) ? 'title' : /^(file|soubor)$/.test(t) ? 'lead' : /^(description|popis)$/.test(t) ? 'act'
        : /^(size|velikost)$/.test(t) ? 'meta' : /(entered on|vlozeno)/.test(t) ? 'meta' : /(entered by|vlozil)/.test(t) ? 'sub' : null), { title: T.files });
      count = rows.length;
      for (const tr of rows) {
        const dl = tr.querySelector('td[data-il-col="lead"] a[href]');
        // The file badge is InSIS's own download link: its type from InSIS's icon (mime-pdf → PDF).
        const mime = tr.querySelector('td[data-il-col="lead"] [data-sysid^="mime-"]')?.getAttribute('data-sysid')?.slice(5) || '';
        if (dl) dl.setAttribute('data-il-file', (mime || '↓').slice(0, 4).toUpperCase());
        tr.querySelectorAll('td[data-il-col="act"] a[href]').forEach((a) => L.label(a, T.desc));
        // "Entered on" in the page's one date format (InSIS's text stays in the cell, drawn over by CSS)
        for (const td of tr.querySelectorAll('td[data-il-col="meta"]')) {
          const d = /(entered on|vlozeno)/.test(norm(td.getAttribute('data-il-label') || '')) && kit.dateOf(clean(td.textContent));
          if (d) td.setAttribute('data-il-show', stamp(d));
        }
      }
      files.closest('form')?.setAttribute('data-il-holder', '');
    }
    // InSIS's own explanation under its message ("… the teacher cannot access them") stays with the message.
    const keep = [...page.querySelectorAll('.uis_msg')].map((m) => {
      let n = m.nextElementSibling;
      while (n && n.tagName === 'BR') n = n.nextElementSibling;
      if (n?.matches('div.small')) { n.setAttribute('data-il-msgnote', ''); return n; }
      return null;
    }).filter(Boolean);

    // The upload form (a file input): a form card; an empty form (a closed box) is left out.
    const forms = [...page.querySelectorAll('form')].filter((f) => f.getAttribute('action')?.includes('odevzdavarny_odevzdani'));
    const upload = forms.find((f) => f.querySelector('input[type="file"]'));
    upload?.setAttribute('data-il-form', T.upload);
    const emptyForms = forms.filter((f) => f !== upload && !f.querySelector('table, input:not([type="hidden"]), select, button, textarea, .uis_msg') && !clean(f.textContent));
    // InSIS's bold headings inside the forms ("List of entered files") give way to the list's own title.
    const formHeads = forms.flatMap((f) => [...f.querySelectorAll(':scope > b')]).filter((b) => files && !upload?.contains(b));
    ipx.ui.hideInSlot([factsTable, heading, ...emptyForms, ...formHeads].filter(Boolean));
    L.chrome(page, [...keep, ...(upload ? [upload] : [])]);

    const failed = !!files?.closest('form')?.querySelector('.uis_msg.ko, .uis_msg.error');
    const tone = isClosed || notYet ? 'neutral' : closes ? deadlineTone(closes, count > 0 && !failed, now) : 'neutral';
    box = {
      name: facts.name || null,
      code,
      lead: () => {
        const course = coursePage();
        const courseText = [code, courseName].filter(Boolean).join(' · ');
        const status = isClosed ? (closes ? T.closedOn(stamp(closes)) : T.closed) : notYet ? T.opensOn(stamp(opens)) : closes ? T.openUntil(stamp(closes)) : null;
        return h('div', { class: 'cp-lead' },
          h('p', { class: 'cp-facts' },
            courseText && (course ? anchor({ href: course }, { class: 'cp-fact' }, courseText) : h('span', { class: 'cp-fact' }, courseText)),
            status && h('span', { class: `delta ${tone}` }, status),
            !isClosed && !notYet && closes && h('span', { class: 'muted' }, countdown(closes, now)),
            // InSIS's error message in the file list ("Files failed to properly handed in.") outranks the count.
            files && (failed ? h('span', { class: 'delta bad' }, T.notHanded(count))
              : h('span', { class: `delta ${count ? 'ok' : !isClosed && !notYet ? 'warn' : 'neutral'}` }, count ? T.handed(count) : T.nothing))),
          group && h('p', { class: 'muted small' }, T.group),
          h('section', { class: 'card' }, kit.facts([
            { label: T.type, value: facts.type },
            { label: T.opens, value: facts.opens && when(facts.opens) },
            { label: T.closes, value: facts.closes && when(facts.closes) },
            { label: T.slot, value: facts.slot },
            { label: T.quota, value: facts.quota },
          ])));
      },
    };
    L.on('ipx-box');
  });
})();
