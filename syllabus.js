// InSIS+ — readable course syllabus (katalog/syllabus.pl).
// The original page is one long two-column table of "Label: value" rows and "Label:" + content rows.
// ipx.syllabus.parse(doc) / ipx.syllabus.build(data, { embedded, rail }) also draw a syllabus inside the course page
// (course.js), from the syllabus page read when the course is opened.
// Title by 03-pages.md rule 7: the course's name, eyebrow the section (Catalogue, or Courses for a course of mine) and
// the code. InSIS's tab row mixes two languages and two output types: the languages are a segmented control on the
// page's first row, the output types sit with InSIS's own output form, which stays InSIS's element (slotted as a form card at the
// end: format select, Display, and the checkbox that stores the syllabus — never ticked or sent by InSIS+). No back
// link (the sidebar and the browser do that). Copied cells keep only links that pass the URL rule; form controls and
// InSIS's script attributes never travel into the copy.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.ui) return;
  const { clean, norm, lang } = ipx;
  const { h, icon, anchor, initials, takeover, facultyOf } = ipx.ui;

  const T = {
    cs: { ects: 'ECTS kredity', work: (n) => `≈ ${n} h práce`, completion: 'Ukončení', language: 'Jazyk výuky',
      mode: 'Výuka týdně', modeHint: 'přednášky / cvičení', semester: 'Semestr', lecturers: 'Vyučující',
      grading: 'Z čeho se skládá hodnocení', workload: 'Časová zátěž', details: 'Další údaje', total: 'Celkem',
      table: 'Zobrazit tabulku', syllabusLang: 'Jazyk sylabu', output: 'PDF a další formáty',
      outputLead: 'Vyberte formát a stiskněte Zobrazit; InSIS ho vytvoří. Druhá podoba sylabu:', coursePage: 'Stránka předmětu', passRates: 'Úspěšnost',
      none: 'Žádné údaje.' },
    en: { ects: 'ECTS credits', work: (n) => `≈ ${n} h of work`, completion: 'Completion', language: 'Language',
      mode: 'Teaching per week', modeHint: 'lectures / seminars', semester: 'Semester', lecturers: 'Lecturers',
      grading: 'How the grade is made up', workload: 'Workload', details: 'More details', total: 'Total',
      table: 'Show table', syllabusLang: 'Syllabus language', output: 'PDF and other formats',
      outputLead: 'Choose a format and press Display; InSIS creates it. The other form of the syllabus:', coursePage: 'Course page', passRates: 'Pass rates',
      none: 'No data.' },
  }[lang];

  // Label → key, matched on diacritic-free lowercase label text (English and Czech).
  const FACTS = [
    ['code', /^course code|^kod predmetu/],
    ['ects', /ects/],
    ['completion', /mode of completion|zpusob ukonceni|ukonceni/],
    ['language', /^language of instruction|^jazyk vyuky/],
    ['mode', /mode of delivery|zpusob vyuky|forma vyuky|rozsah/],
    ['semester', /^semester|^semestr|^obdobi/],
    ['lecturers', /lecturer|vyucujici/],
  ];
  // Relative links in a syllabus are relative to its own address (also when the copy is drawn on the course page).
  const SYLLABUS_URL = () => new URL('/auth/katalog/syllabus.pl', document.baseURI);
  const keyOf = (label) => FACTS.find(([, re]) => re.test(norm(label)))?.[0] || null;

  // ---------- reading the original page ----------

  function parse(doc = document) {
    const title = doc.querySelector('#titulek h1');
    const labels = [...doc.querySelectorAll('td > b > span.nowrap')];
    const isSyllabus = doc.querySelector('table.portal_menu a[href*="syllabus.pl"]');
    if (!title || !isSyllabus || labels.length < 5) return null;

    const main = labels[0].closest('table');
    const facts = [];
    const sections = [];
    for (const span of labels) {
      const row = span.closest('tr');
      if (row.closest('table') !== main) continue;
      const label = clean(span.textContent).replace(/:\s*$/, '');
      const cells = row.querySelectorAll(':scope > td');
      if (cells.length >= 2) {
        facts.push({ label, key: keyOf(label), el: cells[1] });
      } else {
        const next = row.nextElementSibling;
        const isLabelRow = next?.querySelector(':scope > td > b > span.nowrap');
        const el = !isLabelRow && next?.querySelector(':scope > td');
        if (el && clean(el.textContent)) sections.push({ label, el });
      }
    }

    // "Course syllabus 4IT431 - Digital Transformation (FIS - SS 2026/2027)"
    const m = clean(title.textContent).match(/(\S+)\s+-\s+(.+?)\s*\(([^)]*)\)\s*$/);
    // InSIS's tab rows: one with the output types (Syllabus · Course syllabus), one with the languages.
    const isLang = (t) => /^(czech|english|cesky|anglicky|cestina|anglictina)$/.test(norm(t));
    const versions = [...doc.querySelectorAll('table.portal_menu a[href*="syllabus.pl"]')].map((a) => ({
      href: ipx.nav?.safe(a.href, 'link', { copied: true }) || null, text: clean(a.textContent), active: !!a.closest('b') || !!a.querySelector('b'),
    })).filter((v) => v.href);

    return {
      code: m?.[1] || '',
      name: m?.[2] || clean(title.textContent),
      meta: m?.[3] || '',
      languages: versions.filter((v) => isLang(v.text)),
      outputs: versions.filter((v) => !isLang(v.text)),
      form: [...doc.querySelectorAll('form')].find((f) => f.querySelector('select[name="vystup"]')) || null,
      facts,
      sections,
    };
  }

  function lecturers(el) {
    return [...el.querySelectorAll('a[href]')].map((a) => {
      const after = a.nextSibling?.nodeType === Node.TEXT_NODE ? a.nextSibling.nodeValue : '';
      // The person's page, through the URL rule (null: the name is shown without a link).
      const href = ipx.nav ? ipx.nav.safe(new URL(a.getAttribute('href') || '', SYLLABUS_URL()).href, 'link', { copied: true }) : a.href;
      return { href, target: a.target, text: clean(a.textContent), role: after.match(/\(([^)]+)\)/)?.[1] || '' };
    });
  }

  // Rows of a "label | value | value" table where values end in % or h (assessment, workload).
  function shares(el) {
    const table = el.querySelector('table');
    if (!table) return null;
    const rows = [];
    let unit = null;
    for (const tr of table.querySelectorAll('tr')) {
      const tds = tr.querySelectorAll(':scope > td');
      if (tds.length < 2 || tr.classList.contains('zahlavi') || tr.querySelector('b')) continue;
      const raw = clean(tds[1].textContent);
      const value = parseFloat(raw.replace(',', '.'));
      if (Number.isNaN(value)) continue;
      unit ||= raw.includes('%') ? '%' : /\bh\b/.test(raw) ? 'h' : null;
      rows.push({ label: clean(tds[0].textContent), value });
    }
    return rows.length >= 2 && unit ? { unit, rows } : null;
  }

  // Turns "•\titem<br>•\titem" text into a real list; other lines become paragraphs.
  function bulletize(root) {
    if (root.querySelector('table')) return root;
    const lines = [[]];
    for (const n of [...root.childNodes]) {
      if (n.nodeName === 'BR') lines.push([]);
      else lines.at(-1).push(n);
    }
    const text = (line) => clean(line.map((n) => n.textContent).join(''));
    const isBullet = (line) => /^[•▪◦‣-]\s*/.test(text(line));
    if (lines.filter(isBullet).length < 2) return root;

    const out = document.createDocumentFragment();
    let ul = null;
    for (const line of lines) {
      if (!text(line)) continue;
      if (isBullet(line)) {
        if (!ul) out.append((ul = h('ul', { class: 'bullets' })));
        const li = h('li', {}, line);
        const first = li.firstChild;
        if (first?.nodeType === Node.TEXT_NODE) first.nodeValue = first.nodeValue.replace(/^\s*[•▪◦‣-]\s*/, '');
        ul.append(li);
      } else {
        ul = null;
        out.append(h('p', {}, line));
      }
    }
    root.replaceChildren(out);
    return root;
  }

  // A copy of an original cell, with InSIS's jQuery show/hide legends turned into <details>.
  function content(el) {
    const copy = el.cloneNode(true);
    // A copy carries no form controls, no InSIS script hooks, and only links that pass the URL rule (others become
    // their text).
    copy.querySelectorAll('form, input, select, button, textarea, script').forEach((n) => n.remove());
    for (const n of copy.querySelectorAll('*')) for (const a of [...n.attributes]) if (/^on/i.test(a.name)) n.removeAttribute(a.name);
    for (const a of copy.querySelectorAll('a')) {
      const raw = a.getAttribute('href') || '';
      const href = /^mailto:/i.test(raw) ? raw : raw && !/^(javascript:|#)/i.test(raw) ? ipx.nav?.safe(new URL(raw, SYLLABUS_URL()).href, 'link', { copied: true }) : null;
      if (href) a.setAttribute('href', href); else a.replaceWith(...a.childNodes);
    }
    // Then an allow-list (the cell holds teacher-entered HTML): text structure only. Embedding elements (images,
    // frames, objects, SVG, media, styles) are dropped so nothing loads from elsewhere; any other unknown element is
    // unwrapped to its text; the attributes kept are href (a, checked above), class, colspan and rowspan.
    const DROP = /^(img|picture|source|iframe|frame|frameset|object|embed|applet|svg|math|video|audio|track|canvas|map|area|style|link|meta|base|template|noscript)$/;
    const KEEP = /^(a|p|br|hr|div|span|b|strong|i|em|u|s|sub|sup|small|code|pre|blockquote|q|cite|abbr|ul|ol|li|dl|dt|dd|h[1-6]|table|thead|tbody|tfoot|tr|th|td|caption|colgroup|col|details|summary)$/;
    for (const n of [...copy.querySelectorAll('*')]) {
      const tag = n.localName;
      if (DROP.test(tag)) { n.remove(); continue; }
      if (!KEEP.test(tag)) { n.replaceWith(...n.childNodes); continue; }
      for (const at of [...n.attributes]) if (!/^(class|colspan|rowspan)$/.test(at.name) && !(tag === 'a' && at.name === 'href')) n.removeAttribute(at.name);
    }
    // InSIS's empty tables ("No suitable data found.") read as one quiet line.
    for (const t of copy.querySelectorAll('table')) {
      const body = [...t.rows].filter((tr) => !tr.classList.contains('zahlavi') && !tr.closest('thead'));
      if (body.length === 1 && body[0].cells.length === 1) t.replaceWith(h('p', { class: 'muted' }, clean(body[0].textContent) || T.none));
    }
    for (const legend of copy.querySelectorAll('.uisLegend')) {
      const summary = clean(legend.querySelector('.uisLegendTitle a')?.textContent);
      const body = legend.querySelector('.uisLegendContent');
      legend.replaceWith(h('details', { class: 'legend' }, h('summary', {}, summary), body ? [...body.childNodes] : []));
    }
    const div = h('div', { class: 'prose' });
    div.append(...copy.childNodes);
    return bulletize(div);
  }

  // ---------- building the new page ----------

  function shareChart(data) {
    const total = data.rows.reduce((s, r) => s + r.value, 0) || 1;
    if (data.unit === '%') {
      return h('div', { class: 'chart' },
        h('div', { class: 'stackbar' },
          data.rows.map((r, i) => h('span', { class: `seg c${i % 6}`, style: `flex: ${r.value}`, title: `${r.label}: ${r.value} %` }))),
        h('ul', { class: 'legend-list' },
          data.rows.map((r, i) => h('li', {}, h('i', { class: `dot c${i % 6}` }), h('span', {}, r.label), h('b', {}, `${r.value} %`)))));
    }
    const max = Math.max(...data.rows.map((r) => r.value));
    return h('div', { class: 'chart' },
      h('ul', { class: 'bars' },
        data.rows.map((r) => h('li', {},
          h('span', { class: 'bar-label' }, r.label),
          h('b', {}, `${r.value} h`),
          h('span', { class: 'bar-track' }, h('span', { class: 'bar-fill', style: `width: ${(r.value / max) * 100}%` }))))),
      h('p', { class: 'bar-total' }, h('span', {}, T.total), h('b', {}, `${total} h`)));
  }

  const kpi = (label, value, foot, isText) => ipx.ui.kpi({ label, value, foot, isText });

  // What the dashboard's "My courses" needs, kept per syllabus page (newest 30).
  function remember(d) {
    const text = (key) => clean(d.facts.find((f) => f.key === key)?.el.textContent);
    const aims = d.sections.find((s) => /aims|zamer|cil/.test(norm(s.label))) || d.sections[0];
    const sentence = clean(aims?.el.textContent).match(/^.{20,160}?[.!?](\s|$)/)?.[0] || clean(aims?.el.textContent).slice(0, 140);
    const courses = (ipx.state.courses ||= {});
    courses[location.href.split('#')[0]] = {
      href: location.href.split('#')[0],
      code: d.code,
      name: d.name,
      faculty: facultyOf(d.meta),
      semester: text('semester') || d.meta.replace(/^\S+\s*-\s*/, ''),
      ects: text('ects').match(/^\d+/)?.[0] || '',
      completion: text('completion'),
      language: text('language'),
      aims: clean(sentence),
      s: Date.now(),
    };
    const keys = Object.keys(courses).sort((a, b) => courses[b].s - courses[a].s);
    keys.slice(30).forEach((k) => delete courses[k]);
    ipx.save();
  }

  // embedded: inside the course page (no back link, no language switch); rail: nodes to put on top of the right
  // column (the course page's next classes and to-do).
  function buildPage(d, { embedded = false, rail: railTop = [] } = {}) {
    const fact = (key) => d.facts.find((f) => f.key === key);
    const text = (key) => clean(fact(key)?.el.textContent);

    const ectsRaw = text('ects');
    const ects = ectsRaw.match(/^\d+/)?.[0];
    const perCredit = Number(ectsRaw.match(/=\s*(\d+)/)?.[1]);
    const mode = text('mode').match(/\d+\/\d+/)?.[0];
    const people = fact('lecturers') ? lecturers(fact('lecturers').el) : [];
    const others = d.facts.filter((f) => !f.key);

    const main = [];
    const rail = [];
    d.sections.forEach((s, i) => {
      const chart = shares(s.el);
      if (chart) {
        rail.push(h('section', { class: 'card' },
          h('div', { class: 'card-head' }, h('h2', {}, chart.unit === '%' ? T.grading : T.workload)),
          shareChart(chart),
          h('details', { class: 'legend' }, h('summary', {}, T.table), content(s.el))));
      } else {
        main.push({ id: `s${i}`, label: s.label, node: h('section', { class: 'card block' },
          h('div', { class: 'card-head' }, h('h2', {}, s.label)), content(s.el)) });
      }
    });

    const jump = h('nav', { class: 'jump' },
      main.map((b) => h('button', { type: 'button', onclick: () => b.node.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, b.label)));

    return h('div', {},
      h('div', { class: 'kpis' },
        kpi(T.ects, ects, perCredit && ects ? T.work(ects * perCredit) : null),
        kpi(T.completion, text('completion'), null, true),
        kpi(T.language, text('language'), null, true),
        kpi(T.mode, mode, mode && T.modeHint),
        kpi(T.semester, text('semester'), null, true)),

      h('div', { class: 'cols' },
        h('div', { class: 'stack' }, main.length > 2 && jump, main.map((b) => b.node)),
        h('div', { class: 'stack rail' },
          railTop,
          people.length > 0 && h('section', { class: 'card' },
            h('div', { class: 'card-head' }, h('h2', {}, T.lecturers)),
            h('div', { class: 'people' },
              people.map((p) => (p.href ? (b) => anchor(p, { class: 'person' }, b) : (b) => h('span', { class: 'person' }, b))([
                h('span', { class: 'avatar sm' }, initials(p.text)),
                h('span', { class: 'person-text' }, h('strong', {}, p.text), p.role && h('small', {}, p.role))])))),
          rail,
          others.length > 0 && h('section', { class: 'card' },
            h('div', { class: 'card-head' }, h('h2', {}, T.details)),
            h('dl', { class: 'details' }, others.map((f) => [h('dt', {}, f.label), h('dd', {}, content(f.el))]))))));
  }

  ipx.syllabus = { parse, build: buildPage };

  ipx.ready.then(() => {
    const data = parse();
    if (!data) return;
    remember(data);
    const nav = ipx.nav;
    const mine = !!data.code && [...(ipx.state.studyRecord?.courses || []), ...(ipx.state.timetable?.events || [])].some((c) => c.code === data.code);
    // Page action: the course page for a course of mine (no automatic redirect: the student chose InSIS's page),
    // else Pass rates (how hard is this course).
    const action = mine ? { href: nav.composedUrl('course.overview', data.code), text: T.coursePage, icon: 'book' }
      : { href: nav.safe(new URL('/auth/student/hodnoceni.pl', document.baseURI).href, 'link'), text: T.passRates, icon: 'award' };
    const extra = action.href ? [anchor({ href: action.href }, { class: 'btn ghost' }, icon(action.icon), h('span', {}, action.text))] : null;
    // The syllabus language: a segmented control on the page's first row (the header keeps room for the title).
    const languages = data.languages.length > 1 && h('div', { class: 'page-row syl-lang' }, h('div', { class: 'versions' },
      h('span', {}, T.syllabusLang),
      h('div', { class: 'seg-control', role: 'group', 'aria-label': T.syllabusLang },
        data.languages.map((v) => anchor(v, { class: v.active ? 'on' : null, 'aria-current': v.active ? 'page' : null }, v.text)))));
    // InSIS's output form stays InSIS's element: the page is slotted and only the form is shown, in a card.
    const page = document.getElementById('str1');
    const form = data.form && page?.contains(data.form) ? data.form : null;
    if (form) { ipx.ui.styleSlotted(); ipx.ui.keepOnly(page, form); }
    takeover({
      key: 'syllabus',
      css: 'syllabus.css',
      title: data.name,
      subtitle: [nav.label(mine ? 'courses' : 'courses.catalogue'), data.code].filter(Boolean).join(' · '),
      extra,
      slotted: form ? [page] : null,
      build: () => h('div', {},
        languages,
        buildPage(data),
        form && h('section', { class: 'card syl-output' },
          h('div', { class: 'card-head' }, h('h2', {}, T.output)),
          h('p', { class: 'muted syl-output-lead' }, T.outputLead, ' ',
            data.outputs.map((v, i) => [i ? ' · ' : '', v.active ? h('strong', {}, v.text) : anchor(v, {}, v.text)])),
          h('slot'))),
    });
  });
})();
