// InSIS+ — one submission box (student/odevzdavarny_odevzdani.pl). Treatment F with InSIS's forms L in place
// (teardowns/courses.md §2.4 "Box page").
// InSIS's page: portal bar; a bold heading "Individual coursework submission - <course> (<CODE>)"; a help line; the
// box's facts as a two-column table (Name · Type · Status · Date of opening · Date of conclusion · Announced for ·
// Coursework submission quota); then
//   - the form of "List of entered files": InSIS's help (two paragraphs), the table [Sel.] · Name · File · Description ·
//     Size · Entered on · Entered by · [Modify] (File: InSIS's download link; Description: its link to the
//     description), and once a file is inserted "Remove file" (for the ticked rows), InSIS's red message "Files have
//     not been properly handed in, only inserted.", a help line and the hand-in button "Submit files" ("Odevzdat
//     soubory"); once closed, the message "Files failed to properly handed in." instead of the buttons;
//   - on an open box, "Enter new file": InSIS's quota message and a form-edit table holding InSIS's drop area and file
//     button (a form of its own) and the Description box, then InSIS's "Insert file" button.
// Handing in takes two steps (InSIS's help, page 8958): insert the file, then press "Submit files"; a file only
// inserted is not handed in and the teacher does not see it. The page is built around that:
//   - the lead is one status card: where the work stands in one sentence (nothing yet · inserted, not handed in ·
//     handed in · not handed in properly · closed · not open yet), with what to do next, and the box's facts under it
//     (course → its course page, closes with a countdown, opens, quota, announced for);
//   - on an open box InSIS's two blocks become the two numbered steps, always in that order, the one at hand marked:
//     1 "Add your file" (the drop area, Description and "Insert file" as one card, the button in the card's footer and
//     primary once a file is chosen), 2 "Hand it in" (the file rows, "Submit files" in the card's footer, primary while
//     something waits; "Remove file" only once a row is ticked). A closed box shows only its files.
// InSIS's elements stay InSIS's own, in place (data attributes and CSS only, pages/submission-box.css); its facts
// table, heading, help lines and messages are hidden once the status card says the same. Nothing is clicked, filled,
// submitted, stored or fetched.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.kit || !ipx.lists) return;
  const { lang, clean, norm } = ipx;
  const { h, icon, anchor, countdown } = ipx.ui;
  const kit = ipx.kit;
  const nav = ipx.nav;
  const L = ipx.lists;
  const PATH = '/auth/student/odevzdavarny_odevzdani.pl';
  const locale = lang === 'cs' ? 'cs-CZ' : 'en-GB';
  const quote = (t) => (lang === 'cs' ? `„${t}“` : `“${t}”`);

  const T = {
    cs: { box: 'Odevzdávárna', files: 'Vaše soubory', desc: 'Popis', edit: 'Upravit', coursePage: 'Stránka předmětu',
      sNothing: 'Zatím nic neodevzdáno', sNothingText: 'Vložte soubor v kroku 1 a pak ho v kroku 2 odevzdejte.',
      sPending: 'Ještě neodevzdáno',
      sPendingText: (n, btn) => `${n === 1 ? 'Soubor je vložený' : `${n} ${kit.plural(n, 'soubor je vložený', 'soubory jsou vložené', 'souborů je vložených')}`}, ale vyučující ${n === 1 ? 'ho' : 'je'} uvidí, až v kroku 2 stisknete ${btn}.`,
      sHanded: 'Odevzdáno', sHandedText: (n) => `${n} ${kit.plural(n, 'soubor odevzdán', 'soubory odevzdány', 'souborů odevzdáno')}. Do uzavření můžete přidat další.`,
      sHandedClosed: (n) => `${n} ${kit.plural(n, 'soubor odevzdán', 'soubory odevzdány', 'souborů odevzdáno')}. Odevzdávárna je uzavřená, soubory už nejdou měnit.`,
      sFailed: 'Neodevzdáno', sFailedText: 'Soubor byl jen vložen a před uzavřením odevzdávárny nebyl odevzdán, takže ho vyučující nevidí.',
      sClosed: 'Uzavřeno', sClosedText: 'Odevzdávárna je uzavřená a nic do ní odevzdáno nebylo.',
      sNotYet: 'Ještě neotevřeno', sNotYetText: (d) => `Soubory půjde vkládat od ${d}.`,
      group: 'Skupinová odevzdávárna: platí i soubor, který odevzdá spolužák ze skupiny.',
      course: 'Předmět', closes: 'Uzavření', opens: 'Otevření', quota: 'Kvóta', slot: 'Vypsáno pro',
      step1: 'Přidejte soubor', step1Text: (btn) => `Vyberte ho nebo přetáhněte do pole, popis je nepovinný, a stiskněte ${btn}.`,
      step1More: 'Hotovo. Potřebujete-li, přidejte další soubor stejně.',
      step2: 'Odevzdejte', step2Text: (btn) => `Stiskněte ${btn}. Do té doby vyučující soubor nevidí.`,
      step2Empty: 'Vložené soubory se objeví tady.', step2Done: 'Odevzdáno.',
      files2: 'Vaše soubory', noFiles: 'Zatím žádný vložený soubor.', optional: ' (nepovinné)',
      names: 'Název souboru: písmena, číslice, _ - ( ). Mezery se změní na _, diakritika se odstraní; nejvýš 100 znaků.',
      tick: 'Chcete-li soubor odebrat, zaškrtněte ho.' },
    en: { box: 'Submission box', files: 'Your files', desc: 'Description', edit: 'Edit', coursePage: 'Course page',
      sNothing: 'Nothing handed in yet', sNothingText: 'Insert your file in step 1, then hand it in in step 2.',
      sPending: 'Not handed in yet',
      sPendingText: (n, btn) => `${n === 1 ? 'Your file is inserted' : `${n} files are inserted`}, but the teacher sees ${n === 1 ? 'it' : 'them'} only after you press ${btn} in step 2.`,
      sHanded: 'Handed in', sHandedText: (n) => `${n} ${n === 1 ? 'file' : 'files'} handed in. You can add more until the box closes.`,
      sHandedClosed: (n) => `${n} ${n === 1 ? 'file' : 'files'} handed in. The box is closed; the files can no longer be changed.`,
      sFailed: 'Not handed in', sFailedText: 'The file was only inserted and not handed in before the box closed, so the teacher cannot see it.',
      sClosed: 'Closed', sClosedText: 'The box is closed and nothing was handed in.',
      sNotYet: 'Not open yet', sNotYetText: (d) => `Files can be inserted from ${d}.`,
      group: 'Group box: a file a teammate hands in counts for the whole group.',
      course: 'Course', closes: 'Closes', opens: 'Opens', quota: 'Quota', slot: 'Announced for',
      step1: 'Add your file', step1Text: (btn) => `Choose it or drop it into the box, add a description if you like, and press ${btn}.`,
      step1More: 'Done. Add another file the same way if you need to.',
      step2: 'Hand it in', step2Text: (btn) => `Press ${btn}. Until then the teacher cannot see the file.`,
      step2Empty: 'Inserted files show up here.', step2Done: 'Handed in.',
      files2: 'Your files', noFiles: 'No file inserted yet.', optional: ' (optional)',
      names: 'File name: letters, digits, _ - ( ). Spaces become _ and accents are dropped; up to 100 characters.',
      tick: 'Tick a file to remove it.' },
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

  // One date format on the whole page: "Mon 1 Feb 00:00" (InSIS's own clock time, never "24:00 of the day before").
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
    const isOpen = !isClosed && !notYet;
    const group = /group|skupin/.test(norm(facts.type || ''));

    // The file list: the table inside InSIS's form with a size column.
    const files = [...page.querySelectorAll('form table')].find((t) => L.columns(t).some((x) => /^(size|velikost)$/.test(norm(x))));
    const listForm = files?.closest('form') || null;
    let count = 0;
    if (files) {
      const { rows } = L.mark(files, (t) => (/^(sel|ozn)/.test(t) ? 'pick' : /^(name|nazev)$/.test(t) ? 'title' : /^(file|soubor)$/.test(t) ? 'lead'
        : /^(description|popis)$/.test(t) ? 'act' : /^(size|velikost)$/.test(t) ? 'sub' : /(entered on|vlozeno)/.test(t) ? 'sub'
        : /(entered by|vlozil)/.test(t) ? 'sub' : /^(modify|upravit)/.test(t) ? 'act' : null));
      count = rows.length;
      for (const tr of rows) {
        const dl = tr.querySelector('td[data-il-col="lead"] a[href]');
        // The file badge is InSIS's own download link: its type from InSIS's icon (mime-pdf → PDF).
        const mime = tr.querySelector('td[data-il-col="lead"] [data-sysid^="mime-"]')?.getAttribute('data-sysid')?.slice(5) || '';
        if (dl) dl.setAttribute('data-il-file', (mime || '↓').slice(0, 4).toUpperCase());
        tr.querySelectorAll('td[data-il-col="act"] a[href*="popisek"]').forEach((a) => L.label(a, T.desc));
        // InSIS's Modify (rename, reorder): an icon only, named in words.
        tr.querySelectorAll('td[data-il-col="act"] a[href*="editace"]').forEach((a) => L.label(a, T.edit));
        // "Entered on" in the page's one date format (InSIS's text stays in the cell, drawn over by CSS)
        for (const td of tr.querySelectorAll('td[data-il-col="sub"]')) {
          const d = /(entered on|vlozeno)/.test(norm(td.getAttribute('data-il-label') || '')) && kit.dateOf(clean(td.textContent));
          if (d) td.setAttribute('data-il-show', stamp(d));
        }
      }
      files.setAttribute('data-ipx-files', '');
      // InSIS's "No suitable data found." cell says it in InSIS+'s words (drawn by CSS, the cell keeps its text).
      const none = files.querySelector('tr[data-il-row="none"] > td');
      none?.setAttribute('data-ipx-files', T.noFiles);
      none?.setAttribute('data-il-col', 'note');
      listForm.setAttribute('data-il-holder', '');
    }
    // InSIS's own submits in the list's form: "Submit files" (odevzdat) hands in, "Remove file" (odebrat) removes the
    // ticked rows.
    const listButtons = [...(listForm?.querySelectorAll('input[type="submit"], button') || [])];
    const handInBtn = listButtons.find((b) => /odevzd|submit|hand/i.test(`${b.name} ${b.value || b.textContent}`) && !/odebrat|remove|smaz|delete/i.test(`${b.name} ${b.value}`)) || null;
    const removeBtn = listButtons.find((b) => b !== handInBtn && /odebrat|remove|smaz|delete/i.test(`${b.name} ${b.value || b.textContent}`)) || null;
    handInBtn?.setAttribute('data-ipx-btn', 'handin');
    removeBtn?.setAttribute('data-ipx-btn', 'remove');
    // Where the work stands. InSIS's red message ("not properly handed in, only inserted") shows on an open box too,
    // while the hand-in button is there; only once the box is closed does it mean the work was not handed in.
    const pending = count > 0 && !!handInBtn;
    const failed = count > 0 && !handInBtn && !!listForm?.querySelector('.uis_msg.ko, .uis_msg.error');
    const handed = count > 0 && !pending && !failed;

    // "Enter new file": InSIS's form-edit table with the file input, its heading and quota message before it, and its
    // "Insert file" button after it.
    const upTable = [...page.querySelectorAll('table.form-edit')].find((t) => t.querySelector('input[type="file"]')) || null;
    const textarea = upTable?.querySelector('textarea');
    const insertBtn = [...page.querySelectorAll('input[type="submit"], button')].find((b) => b !== handInBtn && !listForm?.contains(b)
      && ((textarea?.form && b.form === textarea.form) || /vlozit/.test(b.name || ''))) || null;
    const before = (el, test) => { for (let n = kit.prev(el), i = 0; n && i < 5; n = kit.prev(n), i++) if (test(n)) return n; return null; };
    const upHead = upTable && before(upTable, (n) => n.tagName === 'B');
    const quotaMsg = upTable && before(upTable, (n) => n.matches('.uis_msg'));
    const listHead = listForm?.querySelector(':scope > b') || null;
    const listHelp = listForm ? [...listForm.querySelectorAll(':scope > div.small')] : [];
    const btnName = (b) => quote(clean(b?.value || b?.textContent || ''));

    if (upTable) {
      upTable.setAttribute('data-ipx-upload', T.names);
      quotaMsg?.setAttribute('data-ipx-quota', '');
      for (const tr of upTable.querySelectorAll(':scope > tbody > tr')) {
        // The row InSIS leaves empty (it only opens a form) is not drawn; the drop area's row needs no label.
        if (!tr.querySelector('input:not([type="hidden"]), textarea, select, button')) tr.setAttribute('data-ipx-empty', '');
        else if (tr.querySelector('input[type="file"]')) tr.setAttribute('data-ipx-row', 'drop');
        else if (tr.querySelector('textarea')) {
          tr.setAttribute('data-ipx-row', 'desc');
          tr.firstElementChild?.setAttribute('data-ipx-opt', T.optional);
        }
      }
      insertBtn?.setAttribute('data-ipx-btn', 'insert');
    }

    // The two steps: InSIS's two blocks, in InSIS's parent (one column, ordered by CSS), each with a numbered title
    // and a line saying what to do. Step 1's line is drawn on InSIS's quota message (its text stays after it), step 2's
    // on InSIS's help paragraph of the list's form (its own text gives way).
    const flow = (upTable || listForm)?.parentElement;
    const steps = !!(isOpen && upTable && listForm && flow === listForm.parentElement);
    if (steps) {
      flow.setAttribute('data-ipx-flow', '');
      for (const el of [upHead, quotaMsg, upTable, insertBtn].filter(Boolean)) el.setAttribute('data-ipx-part', 'upload');
      listForm.setAttribute('data-ipx-part', 'list');
      const s1 = count > 0 ? 'done' : 'now';
      const s2 = pending ? 'now' : handed ? 'done' : 'later';
      upHead?.setAttribute('data-ipx-step', s1);
      upHead?.setAttribute('data-ipx-num', '1');
      upHead?.setAttribute('data-ipx-title', T.step1);
      quotaMsg?.setAttribute('data-ipx-sub', count > 0 ? T.step1More : T.step1Text(btnName(insertBtn)));
      upTable.setAttribute('data-ipx-step', s1);
      listForm.setAttribute('data-ipx-step', s2);
      listHead?.setAttribute('data-ipx-num', '2');
      listHead?.setAttribute('data-ipx-title', T.step2);
      listHelp[0]?.setAttribute('data-ipx-sub', pending ? T.step2Text(btnName(handInBtn)) : handed ? T.step2Done : T.step2Empty);
    } else if (listHead) {
      listHead.setAttribute('data-ipx-title', T.files2);
    }
    // "Tick a file to remove it": under the rows while nothing is ticked (InSIS's "Remove file" shows once one is).
    if (removeBtn) listForm.setAttribute('data-ipx-tick', T.tick);

    // Hidden: InSIS's facts table and heading, its empty forms, the help paragraphs and messages of the list's form
    // (the status card and the steps say it), the help line before the hand-in button.
    const forms = [...page.querySelectorAll('form')].filter((f) => f.getAttribute('action')?.includes('odevzdavarny_odevzdani'));
    const emptyForms = forms.filter((f) => !f.querySelector('table, input:not([type="hidden"]), select, button, textarea, .uis_msg') && !clean(f.textContent));
    const listMsgs = listForm ? [...listForm.querySelectorAll(':scope > .uis_msg.ko, :scope > .uis_msg.error')] : [];
    const helps = listHelp.filter((d) => !d.hasAttribute('data-ipx-sub'));
    ipx.ui.hideInSlot([factsTable, heading, ...emptyForms, ...listMsgs, ...helps, ...(steps ? [] : [upHead].filter(Boolean))].filter(Boolean));
    L.chrome(page, [...(quotaMsg ? [quotaMsg] : []), ...(upTable ? [upTable] : [])]);

    box = {
      name: facts.name || null,
      code,
      lead: () => {
        const course = coursePage();
        const courseText = [code, courseName].filter(Boolean).join(' · ');
        // [tone, icon, title, sentence]
        const s = failed ? ['bad', 'alert', T.sFailed, T.sFailedText]
          : handed ? ['ok', 'tick', T.sHanded, isClosed ? T.sHandedClosed(count) : T.sHandedText(count)]
          : pending ? ['warn', 'clock', T.sPending, T.sPendingText(count, btnName(handInBtn))]
          : isClosed ? ['neutral', 'info', T.sClosed, T.sClosedText]
          : notYet ? ['neutral', 'clock', T.sNotYet, T.sNotYetText(stamp(opens))]
          : ['neutral', 'file', T.sNothing, T.sNothingText];
        const left = isOpen && closes ? countdown(closes, now) : null;
        const fact = (label, ...value) => h('div', {}, h('dt', {}, label), h('dd', {}, ...value));
        return h('section', { class: `card bx-status ${s[0]}` },
          h('div', { class: 'bx-head' },
            h('span', { class: 'bx-icon' }, icon(s[1])),
            h('div', { class: 'bx-say' }, h('h2', {}, s[2]), h('p', {}, s[3]), group && h('p', { class: 'bx-group' }, T.group))),
          h('dl', { class: 'bx-facts' },
            courseText && fact(T.course, course ? anchor({ href: course }, {}, courseText) : courseText),
            facts.closes && fact(T.closes, when(facts.closes), left && h('span', { class: 'bx-left' }, left)),
            facts.opens && fact(T.opens, when(facts.opens)),
            facts.quota && fact(T.quota, facts.quota),
            facts.slot && fact(T.slot, facts.slot)));
      },
    };
    L.on('ipx-box', 'pages/submission-box.css');
  });
})();
