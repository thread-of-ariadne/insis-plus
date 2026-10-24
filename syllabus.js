// InSIS+ — readable course syllabus (katalog/syllabus.pl).
// The original page is one long two-column table of "Label: value" rows and "Label:" + content rows.
// ipx.syllabus.parse(doc) / ipx.syllabus.build(data, { embedded, rail }) also draw a syllabus inside the course page
// (course.js), from the syllabus page read when the course is opened.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.ui) return;
  const { clean, norm, lang } = ipx;
  const { h, icon, anchor, initials, takeover, facultyOf } = ipx.ui;

  const T = {
    cs: { ects: 'ECTS kredity', work: (n) => `≈ ${n} h práce`, completion: 'Ukončení', language: 'Jazyk výuky',
      mode: 'Výuka týdně', modeHint: 'přednášky / cvičení', semester: 'Semestr', lecturers: 'Vyučující',
      grading: 'Z čeho se skládá hodnocení', workload: 'Časová zátěž', details: 'Další údaje', total: 'Celkem',
      table: 'Zobrazit tabulku', syllabusLang: 'Jazyk sylabu' },
    en: { ects: 'ECTS credits', work: (n) => `≈ ${n} h of work`, completion: 'Completion', language: 'Language',
      mode: 'Teaching per week', modeHint: 'lectures / seminars', semester: 'Semester', lecturers: 'Lecturers',
      grading: 'How the grade is made up', workload: 'Workload', details: 'More details', total: 'Total',
      table: 'Show table', syllabusLang: 'Syllabus language' },
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

    // "Course syllabus 4XY101 - Digital Transformation (FIS - SS 2026/2027)"
    const m = clean(title.textContent).match(/(\S+)\s+-\s+(.+?)\s*\(([^)]*)\)\s*$/);
    const crumbs = [...doc.querySelectorAll('.breadcrumb-item a')];
    const versions = [...doc.querySelectorAll('table.portal_menu a[href*="syllabus.pl"]')].map((a) => ({
      href: a.href, text: clean(a.textContent), active: !!a.closest('b') || !!a.querySelector('b'),
    }));

    return {
      code: m?.[1] || '',
      name: m?.[2] || clean(title.textContent),
      meta: m?.[3] || '',
      back: crumbs[1] && { href: crumbs[1].href, text: clean(crumbs[1].textContent) },
      versions,
      facts,
      sections,
    };
  }

  function lecturers(el) {
    return [...el.querySelectorAll('a[href]')].map((a) => {
      const after = a.nextSibling?.nodeType === Node.TEXT_NODE ? a.nextSibling.nodeValue : '';
      return { href: a.href, target: a.target, text: clean(a.textContent), role: after.match(/\(([^)]+)\)/)?.[1] || '' };
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
      !embedded && h('div', { class: 'page-row' },
        d.back && anchor(d.back, { class: 'back' }, icon('back'), d.back.text),
        d.versions.length > 1 && h('div', { class: 'versions' },
          h('span', {}, T.syllabusLang),
          h('div', { class: 'seg-control' }, d.versions.map((v) => anchor(v, { class: v.active ? 'on' : null }, v.text))))),

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
          people.length && h('section', { class: 'card' },
            h('div', { class: 'card-head' }, h('h2', {}, T.lecturers)),
            h('div', { class: 'people' },
              people.map((p) => anchor(p, { class: 'person' },
                h('span', { class: 'avatar sm' }, initials(p.text)),
                h('span', { class: 'person-text' }, h('strong', {}, p.text), p.role && h('small', {}, p.role)))))),
          rail,
          others.length && h('section', { class: 'card' },
            h('div', { class: 'card-head' }, h('h2', {}, T.details)),
            h('dl', { class: 'details' }, others.map((f) => [h('dt', {}, f.label), h('dd', {}, content(f.el))]))))));
  }

  ipx.syllabus = { parse, build: buildPage };

  ipx.ready.then(() => {
    const data = parse();
    if (!data) return;
    remember(data);
    takeover({
      key: 'syllabus',
      css: 'syllabus.css',
      title: data.name,
      subtitle: [data.code, data.meta].filter(Boolean).join(' · '),
      build: () => buildPage(data),
    });
  });
})();
