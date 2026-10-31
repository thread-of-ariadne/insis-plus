// InSIS+ — one submission box (student/odevzdavarny_odevzdani.pl). Treatment F with InSIS's forms L in place
// (teardowns/courses.md §2.4 "Box page").
// InSIS's page: portal bar; a bold heading "Individual coursework submission - <course> (<CODE>)"; a help line; the
// box's facts as a two-column table (Name · Type · Status · Date of opening · Date of conclusion · Announced for ·
// Coursework submission quota); then
//   - the form of "List of entered files": InSIS's help (two paragraphs), its message once the box is closed ("Files
//     failed to properly handed in." with its explanation), the table [Sel.] · Name · File · Description · Size ·
//     Entered on · Entered by · [Modify] (File: InSIS's download link; Description: its link to the description),
//     and, once a file is inserted, InSIS's hand-in button ("Odevzdat soubory");
//   - on an open box, "Enter new file": InSIS's quota message and a form-edit table holding InSIS's drop area and file
//     button (a form of its own) and the Description box, then InSIS's "Insert file" button.
// Handing in takes two steps (InSIS's help, page 8958): insert the file, then confirm with "Odevzdat soubory"; a file
// only inserted is not handed in and the teacher does not see it. That is the page's message:
//   - the header says which box (title = the box's name, eyebrow All submissions); the lead says where it stands
//     (open until … with a countdown / closed on … / opens on …, the course → its course page, the state: nothing yet ·
//     inserted, not handed in · handed in · not handed in properly) and the box's facts in one compact card;
//   - an open box shows the two steps, the current one marked; a closed box says in one line what became of the work;
//   - InSIS's forms stay InSIS's own, in place (data attributes and CSS only, pages/submission-box.css): the upload
//     table as one card (the drop area, Description, the quota and the file-name rule as captions), "Insert file"
//     under it; the file list as list rows (type badge = InSIS's download link over the row; size · date · author
//     under the name), always shown on an open box ("No file inserted yet"), its hand-in button primary. The step at
//     hand comes first (upload while nothing is inserted, the list once something is). InSIS's facts table, heading
//     and help lines are hidden; nothing is clicked, filled, submitted, stored or fetched.
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
      opensOn: (d) => `Otevře se ${d}`, closed: 'Uzavřeno', nothing: 'zatím nic neodevzdáno', nothingClosed: 'nic neodevzdáno',
      inserted: (n) => `${n} ${kit.plural(n, 'soubor vložen', 'soubory vloženy', 'souborů vloženo')}, neodevzdáno`,
      handed: (n) => `${n} ${kit.plural(n, 'soubor odevzdán', 'soubory odevzdány', 'souborů odevzdáno')}`,
      notHanded: (n) => `${n} ${kit.plural(n, 'soubor', 'soubory', 'souborů')} neodevzdáno řádně`,
      group: 'Skupinová odevzdávárna: platí i soubor, který vloží spolužák ze skupiny.', coursePage: 'Stránka předmětu',
      steps: 'Jak odevzdat', step: (n) => `Krok ${n}`, done: 'hotovo', now: 'teď',
      step1: 'Vložte soubor', step1Text: (btn) => `Vyberte ho nebo přetáhněte do pole níže, případně připište popis, a stiskněte ${btn}.`,
      step2: 'Odevzdejte ho', step2Text: (btn) => `Pod Vašimi soubory stiskněte ${btn}. Do té doby vyučující soubor nevidí; vložený soubor jde ještě smazat.`,
      handIn: 'tlačítko „Odevzdat soubory“', insert: 'Vložit soubor',
      upload: 'Vložit soubor', names: 'Název souboru: písmena, číslice, _ - ( ). Mezery se změní na _, diakritika se odstraní; nejvýš 100 znaků.',
      noFiles: 'Zatím žádný vložený soubor.',
      endFailed: 'Neodevzdáno: soubor byl vložen, ale před uzavřením odevzdávárny nebyl odevzdán, takže ho vyučující nevidí.',
      endHanded: 'Odevzdáno. Odevzdávárna je uzavřená, soubory už nejdou měnit.',
      endNothing: 'Odevzdávárna je uzavřená a nic do ní odevzdáno nebylo.',
      notYet: 'Soubory půjde vkládat od otevření odevzdávárny.',
      opens: 'Otevření', closes: 'Uzavření', slot: 'Vypsáno pro', quota: 'Kvóta', type: 'Typ' },
    en: { box: 'Submission box', files: 'Your files', desc: 'Description', openUntil: (d) => `Open until ${d}`, closedOn: (d) => `Closed on ${d}`,
      opensOn: (d) => `Opens on ${d}`, closed: 'Closed', nothing: 'nothing handed in yet', nothingClosed: 'nothing handed in',
      inserted: (n) => `${n} ${n === 1 ? 'file' : 'files'} inserted, not handed in`,
      handed: (n) => `${n} ${n === 1 ? 'file' : 'files'} handed in`,
      notHanded: (n) => `${n} ${n === 1 ? 'file' : 'files'} not handed in properly`,
      group: 'Group box: a file a teammate hands in counts for the whole group.', coursePage: 'Course page',
      steps: 'How to hand in', step: (n) => `Step ${n}`, done: 'done', now: 'now',
      step1: 'Insert the file', step1Text: (btn) => `Choose it or drag it into the box below, add a description if you like, and press ${btn}.`,
      step2: 'Hand it in', step2Text: (btn) => `Press ${btn} under Your files. Until then the teacher cannot see the file; an inserted file can still be deleted.`,
      handIn: 'the hand-in button (Odevzdat soubory)', insert: 'Insert file',
      upload: 'Insert a file', names: 'File name: letters, digits, _ - ( ). Spaces become _ and accents are dropped; up to 100 characters.',
      noFiles: 'No file inserted yet.',
      endFailed: 'Not handed in: the file was inserted but not handed in before the box closed, so the teacher cannot see it.',
      endHanded: 'Handed in. The box is closed; the files can no longer be changed.',
      endNothing: 'The box is closed and nothing was handed in.',
      notYet: 'Files can be inserted once the box opens.',
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
    const isOpen = !isClosed && !notYet;
    const group = /group|skupin/.test(norm(facts.type || ''));

    // The file list: the table inside InSIS's form with a size column.
    const files = [...page.querySelectorAll('form table')].find((t) => L.columns(t).some((x) => /^(size|velikost)$/.test(norm(x))));
    const listForm = files?.closest('form') || null;
    let count = 0;
    let picks = false;
    if (files) {
      const { rows } = L.mark(files, (t) => (/^(sel|ozn)/.test(t) ? 'pick' : /^(name|nazev)$/.test(t) ? 'title' : /^(file|soubor)$/.test(t) ? 'lead'
        : /^(description|popis)$/.test(t) ? 'act' : /^(size|velikost)$/.test(t) ? 'sub' : /(entered on|vlozeno)/.test(t) ? 'sub'
        : /(entered by|vlozil)/.test(t) ? 'sub' : /^(modify|upravit)/.test(t) ? 'act' : null), { title: T.files });
      count = rows.length;
      for (const tr of rows) {
        const dl = tr.querySelector('td[data-il-col="lead"] a[href]');
        // The file badge is InSIS's own download link: its type from InSIS's icon (mime-pdf → PDF).
        const mime = tr.querySelector('td[data-il-col="lead"] [data-sysid^="mime-"]')?.getAttribute('data-sysid')?.slice(5) || '';
        if (dl) dl.setAttribute('data-il-file', (mime || '↓').slice(0, 4).toUpperCase());
        tr.querySelectorAll('td[data-il-col="act"] a[href*="popisek"]').forEach((a) => L.label(a, T.desc));
        if (tr.querySelector('td[data-il-col="pick"] input[type="checkbox"]')) picks = true;
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
      listForm?.setAttribute('data-il-holder', '');
    }
    // InSIS's own submits in the list's form: the hand-in button ("Odevzdat soubory") is the step that matters.
    const listButtons = [...(listForm?.querySelectorAll('input[type="submit"], button') || [])];
    const handInBtn = listButtons.find((b) => /odevzd|hand/i.test(`${b.name} ${b.value || b.textContent}`)) || null;
    handInBtn?.setAttribute('data-ipx-primary', '');
    const failed = !!listForm?.querySelector('.uis_msg.ko, .uis_msg.error');
    // Inserted but not handed in: InSIS's list then has its selection column (delete, reorder) or the hand-in button.
    const pending = count > 0 && !failed && (picks || !!handInBtn);
    const handed = count > 0 && !failed && !pending;

    // "Enter new file": InSIS's form-edit table with the file input, its heading and quota message before it, and its
    // "Insert file" button after it (owned by the form InSIS opens inside the table).
    const upTable = [...page.querySelectorAll('table.form-edit')].find((t) => t.querySelector('input[type="file"]')) || null;
    const textarea = upTable?.querySelector('textarea');
    const insertBtn = [...page.querySelectorAll('input[type="submit"], button')].find((b) => b !== handInBtn && !listForm?.contains(b)
      && ((textarea?.form && b.form === textarea.form) || /vlozit/.test(b.name || ''))) || null;
    const before = (el, test) => { for (let n = kit.prev(el), i = 0; n && i < 5; n = kit.prev(n), i++) if (test(n)) return n; return null; };
    const upHead = upTable && before(upTable, (n) => n.tagName === 'B');
    const quotaMsg = upTable && before(upTable, (n) => n.matches('.uis_msg'));
    if (upTable) {
      upTable.setAttribute('data-ipx-upload', T.names);
      L.heading(upHead, T.upload);
      quotaMsg?.setAttribute('data-ipx-quota', '');
      // The row InSIS leaves empty (it only opens a form) is not drawn.
      for (const tr of upTable.querySelectorAll(':scope > tbody > tr')) {
        if (!tr.querySelector('input:not([type="hidden"]), textarea, select, button')) tr.setAttribute('data-ipx-empty', '');
      }
      insertBtn?.setAttribute('data-ipx-insert', '');
    }
    // The step at hand comes first: the parent of InSIS's blocks becomes a column, its blocks ordered by CSS.
    const flow = (upTable || listForm)?.parentElement;
    if (flow && upTable && listForm && flow === listForm.parentElement) {
      flow.setAttribute('data-ipx-flow', pending ? 'list' : 'upload');
      for (const el of [upHead, quotaMsg, upTable, insertBtn].filter(Boolean)) el.setAttribute('data-ipx-part', 'upload');
      listForm.setAttribute('data-ipx-part', 'list');
    }

    // InSIS's own explanation under its message ("… the teacher cannot access them"): the lead says it now.
    const msgNotes = [...(listForm?.querySelectorAll('.uis_msg') || [])].map((m) => {
      let n = m.nextElementSibling;
      while (n && n.tagName === 'BR') n = n.nextElementSibling;
      return n?.matches('div.small') ? n : null;
    }).filter(Boolean);
    const listMsgs = failed ? [...listForm.querySelectorAll('.uis_msg.ko, .uis_msg.error')] : [];

    const forms = [...page.querySelectorAll('form')].filter((f) => f.getAttribute('action')?.includes('odevzdavarny_odevzdani'));
    const emptyForms = forms.filter((f) => !f.querySelector('table, input:not([type="hidden"]), select, button, textarea, .uis_msg') && !clean(f.textContent));
    // InSIS's bold headings inside the list's form ("List of entered files") give way to the list's own title.
    const formHeads = listForm ? [...listForm.querySelectorAll(':scope > b')] : [];
    ipx.ui.hideInSlot([factsTable, heading, ...emptyForms, ...formHeads, ...msgNotes, ...listMsgs].filter(Boolean));
    L.chrome(page, [...(quotaMsg ? [quotaMsg] : []), ...(upTable ? [upTable] : [])]);

    const quote = (t) => (lang === 'cs' ? `„${t}“` : `“${t}”`);
    const btnName = (b, fallback) => (b ? quote(clean(b.value || b.textContent)) : fallback);
    const tone = !isOpen ? 'neutral' : closes ? deadlineTone(closes, handed, now) : 'neutral';
    box = {
      name: facts.name || null,
      code,
      lead: () => {
        const course = coursePage();
        const courseText = [code, courseName].filter(Boolean).join(' · ');
        const status = isClosed ? (closes ? T.closedOn(stamp(closes)) : T.closed) : notYet ? T.opensOn(stamp(opens)) : closes ? T.openUntil(stamp(closes)) : null;
        const state = failed ? ['bad', T.notHanded(count)] : handed ? ['ok', T.handed(count)] : pending ? ['warn', T.inserted(count)]
          : isClosed ? ['neutral', T.nothingClosed] : isOpen ? ['warn', T.nothing] : null;
        // An open box: the two steps of handing in, the one at hand marked.
        const step = (n, title, text, st) => h('li', { class: `bx-step ${st}` },
          h('span', { class: 'bx-num' }, st === 'done' ? icon('tick') : String(n)),
          h('span', { class: 'bx-text' }, h('strong', {}, title, st === 'now' && h('span', { class: 'bx-now' }, T.now), st === 'done' && h('span', { class: 'bx-done' }, T.done)),
            h('small', {}, text)));
        const steps = isOpen && h('section', { class: 'card pad bx-steps' },
          h('h2', { class: 'card-title' }, T.steps),
          h('ol', {},
            step(1, T.step1, T.step1Text(btnName(insertBtn, quote(T.insert))), count > 0 ? 'done' : 'now'),
            step(2, T.step2, T.step2Text(btnName(handInBtn, T.handIn)), handed ? 'done' : pending ? 'now' : 'later')));
        // A closed (or not yet open) box: one line on what became of the work.
        const end = failed ? ['bad', T.endFailed] : isClosed ? (handed ? ['ok', T.endHanded] : count ? null : ['neutral', T.endNothing]) : notYet ? ['neutral', T.notYet] : null;
        return h('div', { class: 'cp-lead' },
          h('p', { class: 'cp-facts' },
            courseText && (course ? anchor({ href: course }, { class: 'cp-fact' }, courseText) : h('span', { class: 'cp-fact' }, courseText)),
            status && h('span', { class: `delta ${tone}` }, status),
            isOpen && closes && h('span', { class: 'muted' }, countdown(closes, now)),
            state && h('span', { class: `delta ${state[0]}` }, state[1])),
          end && h('p', { class: `kit-note ${end[0] === 'bad' ? 'bad' : end[0] === 'ok' ? 'ok' : 'info'}` }, icon(end[0] === 'bad' ? 'alert' : end[0] === 'ok' ? 'check' : 'info'), h('span', {}, end[1])),
          group && h('p', { class: 'muted small' }, T.group),
          steps,
          // The facts side by side, each label over its value (they wrap to rows on a phone).
          h('dl', { class: 'card bx-facts' }, [
            { label: T.opens, value: facts.opens && when(facts.opens) },
            { label: T.closes, value: facts.closes && when(facts.closes) },
            { label: T.quota, value: facts.quota },
            { label: T.slot, value: facts.slot },
            { label: T.type, value: facts.type },
          ].filter((f) => f.value).map((f) => h('div', {}, h('dt', {}, f.label), h('dd', {}, f.value)))));
      },
    };
    L.on('ipx-box', 'pages/submission-box.css');
  });
})();
