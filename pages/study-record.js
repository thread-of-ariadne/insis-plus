// InSIS+ — the e-study record (student/pruchod_studiem.pl?studium=…;obdobi=…) and the first step of
// course attainment evaluation (student/hodnoceni.pl, the faculty picker).
//
// E-study record: the page has two rows of links (table.portal_menu): the student's portal pages, and the views
// of this record (current basic / detailed overview, whole study, credit statistics, …; the active one is in <b>,
// the table carries data-pm-selected). Below them, one course table per study period, preceded by a <b> label
// ("WS 2026/2027 - FIS:"), with columns found by header text (Code, Course, Compulsory, Lang., Com., Attempt,
// Result, Entered, Entered by, ECTS = grade letter, Group, Credits, Type; Czech equivalents too). Then a
// two-column statistics table (credits enrolled/obtained, courses completed, average score …), the key and
// the ECTS grade key. Views whose content isn't recognised keep it: #str1 is slotted below the new view with
// only the recognised parts hidden. A view with neither a course nor a statistics table is left to generic.js.
//
// Stored for the dashboard (plain data, no HTML):
// ipx.state.studyRecord = {
//   updated: Date.now(), source: location.href, view: 'podrobne_vybrane_obdobi' | … | null,
//   study: 'FIS C-BI pres [term 1, E]' | '', period: 'WS 2026/2027 - FIS' | '',
//   credits: { earned: number | null, registered: number | null },   // from the statistics table, else row sums
//   average: number | null,                                          // as InSIS states it, else mean of row grades
//   courses: [{ code, name, ects: number | null (credits), completion, result, grade: 1–4 | null,
//               semester, passed: true | false | null (null = no result yet) }],
// }
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.ui) return;
  const { clean, norm, lang } = ipx;
  const { h, icon, anchor, takeover, kpi, sectionHead, emptyState, styleSlotted, cover, facultyColors, facultyOf } = ipx.ui;

  const T = {
    cs: { title: 'Průchod studiem', earned: 'Získané kredity', toEarn: (n) => `${n} zatím nezískáno`,
      average: 'Průměrný prospěch', avgPage: 'podle InSIS', avgRows: (n) => `z ${n} ${n === 1 ? 'známky' : 'známek'} v tabulce`,
      passed: 'Splněné předměty', ofCourses: (n) => `z ${n} ${n === 1 ? 'předmětu' : 'předmětů'}`,
      failed: (n) => `${n} nesplněno`, progress: 'Probíhá', awaiting: 'bez výsledku',
      stPassed: 'Splněno', stFailed: 'Nesplněno', stProgress: 'Probíhá', stResult: 'Výsledek', stNone: 'Bez výsledku',
      attempt: (n) => `${n}. pokus`, attemptTitle: 'Předchozí termíny zkoušek', credits: 'kr.',
      creditsCard: 'Kredity v období', notEarned: 'Nezískáno', lost: 'Ztraceno', stats: 'Statistika období',
      portal: 'Portál studenta', ectsKey: 'Stupnice ECTS', study: 'Studium', views: 'Přehledy',
      courses: (n) => `${n} ${n === 1 ? 'předmět' : n < 5 ? 'předměty' : 'předmětů'}`,
      semCredits: (a, b) => (b != null ? `${a} / ${b} kr.` : `${a} kr.`),
      empty: 'V tomto přehledu nejsou žádné předměty.', more: 'Další údaje z InSIS',
      grade: 'Známka', ectsGrade: 'ECTS', entered: 'Zapsáno', by: 'Zapsal',
      faculties: 'Fakulty', units: 'Další součásti', yours: 'vaše fakulta',
      attainmentHint: 'Vyberte fakultu nebo součást, která předmět vyučuje; pak zvolíte předmět.' },
    en: { title: 'E-study record', earned: 'Credits earned', toEarn: (n) => `${n} not earned yet`,
      average: 'Average grade', avgPage: 'as stated by InSIS', avgRows: (n) => `from ${n} ${n === 1 ? 'grade' : 'grades'} in the table`,
      passed: 'Courses passed', ofCourses: (n) => `of ${n} ${n === 1 ? 'course' : 'courses'}`,
      failed: (n) => `${n} failed`, progress: 'In progress', awaiting: 'no result yet',
      stPassed: 'Passed', stFailed: 'Failed', stProgress: 'In progress', stResult: 'Result', stNone: 'No result',
      attempt: (n) => `Attempt ${n}`, attemptTitle: 'Past exam sittings', credits: 'cr.',
      creditsCard: 'Credits this period', notEarned: 'Not earned', lost: 'Lost', stats: 'Period statistics',
      portal: "Student's portal", ectsKey: 'ECTS grades', study: 'Study', views: 'Overviews',
      courses: (n) => `${n} ${n === 1 ? 'course' : 'courses'}`,
      semCredits: (a, b) => (b != null ? `${a} / ${b} cr.` : `${a} cr.`),
      empty: 'There are no courses in this overview.', more: 'More from InSIS',
      grade: 'Grade', ectsGrade: 'ECTS', entered: 'Entered', by: 'Entered by',
      faculties: 'Faculties', units: 'Other units', yours: 'your faculty',
      attainmentHint: 'Choose the faculty or unit that teaches the course, then pick the course.' },
  }[lang];
  const locale = lang === 'cs' ? 'cs-CZ' : 'en-GB';

  const SEMESTER = /\b(WS|ZS|LS|SS)\b.*\d{4}|\b(winter|summer|zimn|letn)\w*.*\d{4}/i;

  const num = (s) => {
    const m = clean(s).replace(/\s/g, '').match(/^-?\d+(?:[.,]\d+)?$/);
    return m ? Number(m[0].replace(',', '.')) : null;
  };
  const fmt = (n, digits = 0) => n.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });

  const facultyFor = (code) => ipx.ui.facultyFor(code);

  // ---------- reading the e-study record ----------

  // Column ids by header text (diacritic-free, lowercase). Order matters: "entered by" before "entered",
  // "compulsory" before the completion column ("Com.").
  const COLUMNS = [
    ['code', /^(code|kod)\b/],
    ['name', /^(course|predmet|nazev)/],
    ['compulsory', /compuls|povin/],
    ['lang', /^(lang|jaz)/],
    ['completion', /^(com\.?|uk\.?|ukon\w*|completion|zakonceni)$/],
    ['attempt', /attempt|pokus/],
    ['result', /result|vysledek|hodnoceni|znamka/],
    ['by', /entered by|zapsal|hodnotil|examiner|zkousejici/],
    ['date', /^(entered|zapsan|datum|date)/],
    ['ectsGrade', /^ects/],
    ['group', /group|skupina/],
    ['credits', /credit|kredit|^kr\.?$/],
    ['type', /^(type|typ)$/],
  ];

  function columnMap(table) {
    const head = table.querySelector('thead tr') || table.querySelector('tr');
    const map = {};
    let i = 0;
    for (const th of head?.querySelectorAll(':scope > th, :scope > td') || []) {
      const t = norm(th.textContent);
      const id = COLUMNS.find(([key, re]) => !(key in map) && re.test(t))?.[0];
      if (id) map[id] = i;
      i += Math.max(1, Number(th.getAttribute('colspan')) || 1);
    }
    return map;
  }

  // Text of a cell, or the label of its icon (the Compulsory and Type columns are icons only).
  const cellText = (td) => clean(td?.textContent) || clean(td?.querySelector('[aria-label]')?.getAttribute('aria-label'));

  // Passed / failed / no result yet. The result icon says it best (vysledek-uspesny / -neuspesny); the text
  // and the grade follow VŠE's scale: 1–3 and "credit" pass, 4 / F / "not credited" fail.
  function outcome(td, text, ectsGrade, credits) {
    const sys = td?.querySelector('[data-sysid^="vysledek"]')?.getAttribute('data-sysid') || '';
    if (/neuspes|neusp/.test(sys)) return false;
    if (/uspes/.test(sys)) return true;
    if (!text) return null;
    const t = norm(text);
    if (/\(4\)|\(f\)|nedostat|fail|nezapocten|not credited|neprospel|neuspes|unsuccess/.test(t) || ectsGrade === 'F') return false;
    if (/\([123]\)|\(z\)|zapocten|credit|prospel|passed|excellent|vyborn|dobre|good|uspes/.test(t)) return true;
    return credits > 0 ? true : null;
  }

  // The semester label InSIS writes in bold before each course table.
  function periodLabel(table) {
    let el = table.previousElementSibling;
    for (let i = 0; el && i < 6; i++, el = el.previousElementSibling) {
      if (el.tagName === 'TABLE') break;
      const b = el.tagName === 'B' ? el : null;
      const t = clean(b?.textContent).replace(/:$/, '');
      if (t && (SEMESTER.test(t) || /:$/.test(clean(b.textContent)))) return { text: t, node: b };
    }
    return null;
  }

  function readCourses(table, cols, fallbackPeriod) {
    const label = periodLabel(table);
    const semester = label?.text || fallbackPeriod || '';
    const rows = [];
    for (const tr of table.querySelectorAll('tbody tr')) {
      const tds = [...tr.querySelectorAll(':scope > td')];
      if (tds.length < 3) continue;
      const cell = (id) => (cols[id] != null ? tds[cols[id]] : null);
      const code = clean(cell('code')?.textContent);
      const nameCell = cell('name');
      const link = nameCell?.querySelector('a[href*="syllabus"]') || nameCell?.querySelector('a[href]');
      const name = clean(link?.textContent) || clean(nameCell?.textContent);
      if (!code && !name) continue;
      const result = clean(cell('result')?.textContent);
      const ectsGrade = clean(cell('ectsGrade')?.textContent).replace(/[()]/g, '');
      const credits = num(cell('credits')?.textContent);
      const attemptA = cell('attempt')?.querySelector('a[href]');
      const byA = cell('by')?.querySelector('a[href]');
      const gradeM = result.match(/\(([1-4])\)/);
      rows.push({
        code,
        name,
        href: link?.href || null,
        compulsory: cellText(cell('compulsory')),
        lang: clean(cell('lang')?.textContent),
        completion: clean(cell('completion')?.textContent),
        attempt: clean(cell('attempt')?.textContent),
        attemptHref: attemptA?.href || null,
        result,
        grade: gradeM ? Number(gradeM[1]) : null,
        date: clean(cell('date')?.textContent),
        by: clean(cell('by')?.textContent),
        byLink: byA ? { href: byA.href, target: byA.getAttribute('target') } : null,
        ectsGrade: /^[A-F]$/.test(ectsGrade) ? ectsGrade : '',
        ectsEstimate: /\(/.test(clean(cell('ectsGrade')?.textContent)),
        group: clean(cell('group')?.textContent),
        credits,
        type: cellText(cell('type')),
        semester,
        passed: outcome(cell('result'), result, ectsGrade, credits),
      });
    }
    return { semester, label, rows };
  }

  // Two-column "label → number" table: the statistics of the period or of the whole study.
  function readStats(table) {
    const rows = [...table.querySelectorAll('tbody tr')];
    if (rows.length < 3) return null;
    const out = [];
    for (const tr of rows) {
      const tds = tr.querySelectorAll(':scope > td');
      if (tds.length !== 2) return null;
      const value = num(tds[1].textContent);
      if (value == null) return null;
      out.push({ label: clean(tds[0].textContent), text: clean(tds[1].textContent), value });
    }
    if (!out.some((r) => /credit|kredit|average|prumer/.test(norm(r.label)))) return null;
    const title = clean(table.querySelector('thead th, tr.zahlavi th')?.textContent);
    return { title, rows: out };
  }

  // Named numbers from the statistics, matched in both languages; anything unmatched stays null.
  function statValues(stats) {
    const all = stats.flatMap((s) => s.rows);
    const find = (...tests) => all.find((r) => tests.every((re) => re.test(norm(r.label))))?.value ?? null;
    const not = (re) => ({ test: (s) => !re.test(s) });
    return {
      registered: find(/credit|kredit/, /enrol|registered|zapsan/),
      earned: find(/credit|kredit/, /obtain|earned|ziskan/, not(/not |nezisk/)),
      notEarned: find(/credit|kredit/, /not earned|nezisk/),
      lost: find(/credit|kredit/, /lost|ztrac|propad/),
      average: find(/average|prumer/, not(/includ|vcetne|academic|akademick/)),
    };
  }

  // The ECTS key under the tables: letter → description.
  function readEctsKey(table) {
    const rows = [...table.querySelectorAll('tbody tr')];
    const out = [];
    for (const tr of rows) {
      const tds = tr.querySelectorAll(':scope > td');
      if (tds.length === 2 && /^[A-F]$/.test(clean(tds[0].textContent))) out.push({ letter: clean(tds[0].textContent), text: clean(tds[1].textContent) });
    }
    return out.length >= 4 ? out : null;
  }

  const menuLinks = (table) => [...table.querySelectorAll('td')].map((td) => {
    const a = td.querySelector('a[href]');
    if (!a) return null;
    const sys = td.getAttribute('data-pm-sysid');
    return { href: a.href, text: clean(a.textContent), title: clean(a.title), id: sys, on: !!td.querySelector('b a, a b') };
  }).filter(Boolean);

  function parseRecord() {
    const page = document.getElementById('str1');
    if (!page) return null;
    const isRecord = /pruchod_studiem\.pl/.test(location.pathname) ||
      page.querySelector('form[action*="pruchod_studiem"]');
    if (!isRecord) return null;

    const known = new Set();
    const mark = (n) => n && known.add(n);
    const menus = [...page.querySelectorAll('table.portal_menu')];
    const viewMenu = menus.find((t) => t.hasAttribute('data-pm-selected') || t.querySelector('[data-pm-sysid]'));
    const portalMenu = menus.find((t) => t !== viewMenu);
    menus.forEach(mark);
    const views = viewMenu ? menuLinks(viewMenu) : [];
    const view = viewMenu?.getAttribute('data-pm-selected') || views.find((v) => v.on)?.id || null;
    const portal = portalMenu ? menuLinks(portalMenu) : [];

    const titulek = page.querySelector('#titulek');
    mark(titulek);
    const bolds = [...(titulek?.querySelectorAll('b') || [])].map((b) => clean(b.textContent));
    const study = bolds[0] || '';
    const period = bolds.find((t) => SEMESTER.test(t)) || bolds[1] || '';
    mark(page.querySelector('nav[aria-label="breadcrumb"]'));
    page.querySelectorAll('div.small').forEach(mark);
    page.querySelectorAll('.uisLegend').forEach(mark);

    const semesters = [];
    const stats = [];
    let ectsKey = null;
    for (const table of page.querySelectorAll('table')) {
      if ([...known].some((n) => n.contains(table))) continue;
      const cols = columnMap(table);
      if ('code' in cols && 'name' in cols && ('result' in cols || 'credits' in cols)) {
        const sem = readCourses(table, cols, period);
        mark(table);
        mark(sem.label?.node);
        semesters.push(sem);
        continue;
      }
      const st = readStats(table);
      if (st) { stats.push(st); mark(table); continue; }
      const key = readEctsKey(table);
      if (key) { ectsKey = key; mark(table); }
    }
    if (!semesters.length && !stats.length) return null;
    // A course without a result is in progress only in the current period; in an older one it simply has none.
    for (const r of semesters.flatMap((x) => x.rows)) {
      r.open = r.passed === null && !r.result && (semesters.length === 1 || !period || norm(r.semester) === norm(period));
    }

    // Same period printed twice (e.g. a heading per table) → merge.
    const bySem = new Map();
    for (const s of semesters) {
      if (!bySem.has(s.semester)) bySem.set(s.semester, { semester: s.semester, rows: [] });
      bySem.get(s.semester).rows.push(...s.rows);
    }

    // Anything left that carries content (a table or text InSIS+ didn't recognise) keeps showing, slotted below.
    const leftover = [...page.querySelectorAll('table, p, div, span, b, ul, ol')].some((el) =>
      !el.closest('script') && ![...known].some((n) => n === el || n.contains(el) || el.contains(n)) &&
      clean(el.textContent).length > 1 && !el.querySelector('table, div'));

    return {
      page, known, leftover, views, view, portal, study, period, ectsKey,
      title: portal.find((l) => l.on)?.text || '',
      semesters: [...bySem.values()],
      stats,
      values: statValues(stats),
    };
  }

  // ---------- e-study record view ----------

  function totals(d) {
    const rows = d.semesters.flatMap((s) => s.rows);
    const v = d.values;
    const rowCredits = rows.filter((r) => r.passed && r.credits != null);
    const earned = v.earned ?? (rowCredits.length ? rowCredits.reduce((s, r) => s + r.credits, 0) : null);
    const grades = rows.filter((r) => r.grade != null);
    const avgRows = grades.length ? grades.reduce((s, r) => s + r.grade, 0) / grades.length : null;
    return {
      rows,
      earned,
      registered: v.registered,
      average: v.average ?? avgRows,
      averageFrom: v.average != null ? 'page' : grades.length,
      passed: rows.filter((r) => r.passed === true).length,
      failed: rows.filter((r) => r.passed === false).length,
      open: rows.filter((r) => r.open).length,
    };
  }

  const tone = (r) => (r.passed === true ? 'ok' : r.passed === false ? 'bad' : r.open ? 'warn' : 'neutral');
  const statusText = (r) => (r.passed === true ? T.stPassed : r.passed === false ? T.stFailed : r.open ? T.stProgress : r.result ? T.stResult : T.stNone);

  function courseRow(r) {
    const fac = facultyFor(r.code);
    const badge = r.grade != null ? String(r.grade) : r.ectsGrade || (r.passed === true ? '✓' : r.passed === false ? '×' : '–');
    const name = r.href ? h('a', { class: 'sr-name', href: r.href }, r.name) : h('strong', { class: 'sr-name' }, r.name);
    return h('li', { class: `sr-row t-${tone(r)}`, style: `--fac: ${facultyColors(fac)[1]}` },
      h('span', { class: 'sr-badge', title: r.result || statusText(r) }, badge),
      h('div', { class: 'sr-course' },
        h('span', { class: 'sr-code' }, [r.code, fac].filter(Boolean).join(' · ')),
        name,
        h('span', { class: 'sr-tags' },
          [r.completion, r.compulsory].filter(Boolean).map((t) => h('span', { class: 'tag' }, t)),
          [r.lang && r.lang.toUpperCase(), r.group].filter(Boolean).map((t) => h('span', { class: 'tag raw' }, t)))),
      h('div', { class: 'sr-result' },
        h('span', { class: `delta ${tone(r)}` }, statusText(r)),
        r.result && h('span', { class: 'sr-result-text' }, r.result),
        (r.date || r.by) && h('small', { class: 'sr-meta' },
          r.date && h('span', { title: T.entered }, r.date),
          r.date && r.by && ' · ',
          r.by && (r.byLink ? anchor({ ...r.byLink, text: r.by }, { title: T.by }, r.by) : h('span', { title: T.by }, r.by)))),
      h('div', { class: 'sr-side' },
        r.credits != null && h('span', { class: 'sr-credits' }, fmt(r.credits), h('small', {}, T.credits)),
        r.ectsGrade && h('span', { class: 'sr-ects', title: T.ectsGrade + (r.ectsEstimate ? ' (≈)' : '') }, r.ectsGrade),
        r.attempt && (r.attemptHref
          ? h('a', { class: 'sr-attempt', href: r.attemptHref, title: T.attemptTitle }, T.attempt(r.attempt))
          : h('span', { class: 'sr-attempt' }, T.attempt(r.attempt)))));
  }

  function semesterBlock(s, registered, single) {
    const earned = s.rows.filter((r) => r.passed && r.credits != null).reduce((a, r) => a + r.credits, 0);
    // Order: in progress first (what still needs work), then failed, then passed.
    const order = { warn: 0, bad: 1, neutral: 2, ok: 3 };
    const rows = [...s.rows].sort((a, b) => order[tone(a)] - order[tone(b)]);
    return [
      sectionHead(s.semester || T.title, null,
        h('p', { class: 'sr-sem-meta' }, [T.courses(s.rows.length), T.semCredits(fmt(earned), single ? registered : null)].join(' · '))),
      h('ul', { class: 'card sr-list' }, rows.map(courseRow)),
    ];
  }

  function creditsCard(d, t) {
    const v = d.values;
    if (t.earned == null && t.registered == null) return null;
    const pct = t.registered ? Math.min(100, (t.earned / t.registered) * 100) : null;
    return h('section', { class: 'card sr-credits-card' },
      h('div', { class: 'card-head' }, h('h2', {}, T.creditsCard)),
      h('div', { class: 'sr-big' }, fmt(t.earned ?? 0), t.registered != null && h('small', {}, ` / ${fmt(t.registered)}`)),
      pct != null && h('div', { class: 'sr-bar', role: 'img', 'aria-label': `${Math.round(pct)} %` }, h('span', { style: `width: ${pct}%` })),
      (v.notEarned != null || v.lost != null) && h('dl', { class: 'sr-mini' },
        v.notEarned != null && [h('dt', {}, T.notEarned), h('dd', {}, fmt(v.notEarned))],
        v.lost != null && [h('dt', {}, T.lost), h('dd', { class: v.lost > 0 ? 'bad' : null }, fmt(v.lost))]));
  }

  function statsCard(s) {
    return [sectionHead(T.stats),
      h('section', { class: 'card sr-stats' },
        s.title && h('p', { class: 'card-sub' }, s.title),
        h('dl', { class: 'sr-grid' }, s.rows.map((r) => h('div', {}, h('dt', {}, r.label), h('dd', {}, r.text)))))];
  }

  function buildRecord(d) {
    const t = totals(d);
    const single = d.semesters.length === 1;
    const main = h('div', { class: 'sr-main' },
      h('div', { class: 'kpis' },
        t.earned != null && kpi({ label: T.earned, value: fmt(t.earned), unit: t.registered != null ? `/ ${fmt(t.registered)}` : null,
          status: t.registered ? { tone: t.earned >= t.registered ? 'ok' : 'neutral', text: `${Math.round((t.earned / t.registered) * 100)} %` } : null,
          foot: d.values.notEarned ? T.toEarn(fmt(d.values.notEarned)) : null }),
        t.average != null && kpi({ label: T.average, value: fmt(t.average, 2),
          foot: t.averageFrom === 'page' ? T.avgPage : T.avgRows(t.averageFrom) }),
        t.rows.length > 0 && kpi({ label: T.passed, value: t.passed, foot: T.ofCourses(t.rows.length),
          status: t.failed ? { tone: 'bad', text: T.failed(t.failed) } : null }),
        t.rows.length > 0 && kpi({ label: T.progress, value: t.open, foot: T.awaiting })),

      d.views.length > 1 && ipx.ui.linkTabs(d.views.map((v) => ({ ...v, on: v.on || v.id === d.view })), T.views),

      d.semesters.length
        ? d.semesters.map((s) => (s.rows.length ? semesterBlock(s, t.registered, single) : [sectionHead(s.semester), emptyState(T.empty)]))
        : null,
      d.stats.map(statsCard),
      d.leftover && sectionHead(T.more));

    const portal = d.portal.filter((l) => !l.on);
    const rail = h('aside', { class: 'sr-rail' },
      (d.study || d.period) && h('section', { class: 'sr-study' },
        h('div', { class: 'card-head' }, h('h2', {}, T.study)),
        d.study && h('p', { class: 'sr-study-name' }, d.study),
        d.period && h('p', { class: 'muted' }, d.period)),
      creditsCard(d, t),
      d.ectsKey && h('details', { class: 'sr-key' },
        h('summary', {}, T.ectsKey),
        h('dl', { class: 'sr-dl' }, d.ectsKey.map((k) => [h('dt', {}, h('b', { class: 'sr-ects' }, k.letter)), h('dd', {}, k.text)]))),
      portal.length > 0 && h('section', {},
        h('div', { class: 'card-head' }, h('h2', {}, T.portal)),
        h('ul', { class: 'sr-links' }, portal.map((l) => h('li', {}, anchor(l, { class: 'sr-link', title: l.title || null }, h('span', {}, l.text), icon('arrow')))))));

    return [main, rail];
  }

  function remember(d) {
    const t = totals(d);
    ipx.state.studyRecord = {
      updated: Date.now(),
      source: location.href,
      view: d.view,
      study: d.study,
      period: d.period,
      credits: { earned: t.earned, registered: t.registered },
      average: t.average,
      courses: t.rows.map((r) => ({ code: r.code, name: r.name, ects: r.credits, completion: r.completion,
        result: r.result, grade: r.grade, semester: r.semester, passed: r.passed })),
    };
    ipx.save();
  }

  // ---------- course attainment evaluation: the faculty picker ----------

  const LOGO_FAC = { ffu: 'FFU', fmv: 'FMV', fph: 'FPH', fis: 'FIS', fnh: 'NF', fmh: 'FM' };
  const CODE_FAC = { 10: 'FFU', 20: 'FMV', 30: 'FPH', 40: 'FIS', 50: 'NF', 60: 'FM' };

  function parseAttainment() {
    const page = document.getElementById('str1');
    const links = [...(page?.querySelectorAll('.vyber-fakult a.fakulta[href]') || [])];
    if (links.length < 2 || !links.every((a) => /hodnoceni\.pl/.test(a.getAttribute('href')))) return null;
    const units = links.map((a) => {
      const logo = a.querySelector('img')?.getAttribute('src') || '';
      const code = a.href.match(/fakulta=(\d+)/)?.[1];
      const fac = LOGO_FAC[logo.match(/\/(ffu|fmv|fph|fis|fnh|fmh)-/)?.[1]] || CODE_FAC[code] || '';
      return { href: a.href, text: clean(a.querySelector('.nazev')?.textContent) || clean(a.textContent), fac };
    }).filter((u) => u.text);
    const crumbs = [...page.querySelectorAll('.breadcrumb-item')].map((li) => clean(li.textContent)).filter(Boolean);
    return { units, title: crumbs.at(-1) || clean(document.title), intro: clean(page.querySelector('div.small')?.textContent) };
  }

  function buildAttainment(d) {
    // The student's own faculty, if the e-study record told us ("WS 2026/2027 - FIS").
    const mine = facultyOf(ipx.state.studyRecord?.period || '') || facultyOf(ipx.state.studyRecord?.study || '');
    const card = (u) => h('a', { class: 'card link-card sr-unit' + (u.fac && u.fac === mine ? ' mine' : ''), href: u.href },
      cover(u.fac || u.text, u.fac, 240, 64),
      h('span', { class: 'sr-unit-body' },
        u.fac && h('span', { class: 'sr-unit-code', style: `color: ${facultyColors(u.fac)[1]}` }, u.fac,
          u.fac === mine && h('span', { class: 'delta neutral' }, T.yours)),
        h('strong', {}, u.text)));
    const facs = d.units.filter((u) => u.fac);
    const rest = d.units.filter((u) => !u.fac);
    return h('div', { class: 'sr-attain' },
      h('p', { class: 'muted sr-attain-hint' }, d.intro || T.attainmentHint),
      facs.length > 0 && [sectionHead(T.faculties), h('div', { class: 'sr-units' }, facs.map(card))],
      rest.length > 0 && [sectionHead(T.units), h('ul', { class: 'card sr-unit-list' }, rest.map((u) =>
        h('li', {}, anchor(u, { class: 'sr-link' }, h('span', {}, u.text), icon('arrow')))))]);
  }

  // ---------- start ----------

  ipx.ready.then(() => {
    const record = parseRecord();
    if (record) {
      remember(record);
      const slotted = record.leftover ? [record.page] : null;
      if (slotted) {
        // Hide what the new view already shows (only while InSIS+ is on); the rest of the original stays.
        ipx.ui.hideInSlot(record.known);
        document.documentElement.classList.add('ipx-sr');
        styleSlotted('pages/study-record.css');
      }
      takeover({
        key: 'study-record',
        css: 'pages/study-record.css',
        title: record.title || T.title,
        subtitle: record.period || null,
        slotted,
        build: () => h('div', { class: 'sr' + (slotted ? ' has-slot' : '') }, ...buildRecord(record)),
      });
      return;
    }
    const attain = parseAttainment();
    if (attain) {
      takeover({
        key: 'attainment',
        css: 'pages/study-record.css',
        title: attain.title,
        build: () => buildAttainment(attain),
      });
    }
  });
})();
