// InSIS+ — Grades & credits › What's left: the plan check (studijni/studijni_povinnosti.pl). Treatment R
// (docs/ia/03-pages.md; teardowns/exams-grades-schedule.md §2.5, §3.5–3.6).
//
// InSIS's page answers "what do I still need" in ~990 table rows (835 kB): two status lines, a summary table
// (Study · Credits "x obtained out of y of compulsory (MISSING z crd.)" · Initial period · Type of study system),
// then one table with, per group of courses, a header row ("hP - <name> (t: 1)" + "A group of elective courses
// (min. 36 crd.) - NOT ACCOMPLISHED missing 33 credits") and every course of the group twice: tr.predmety_vse_<id>
// (all courses of the group) and tr.predmety_<id> (studied ones only, a subset). Optional groups alone hold
// hundreds of courses.
//
// Here: the answer first (credits earned of required, what is missing, compulsory courses not taken yet), the
// student's own courses with their status, then one collapsible card per group (compulsory → elective → state
// exam → optional). Long course lists are drawn only when asked for, 50 at a time, with a filter.
//
// Speed is the point of this module: the page is parsed once, in one pass over the table rows, reading only
// textContent (innerText would force layout over the whole page), into plain data with no DOM references. Only
// the superset rows (predmety_vse) are read. The original is never slotted (it carries InSIS's favourite()
// onclick controls and JS links): it stays hidden in the page and comes back with Classic view. The time of
// parse + build is recorded as the performance measure "insis-plus:plan-progress".
//
// Stored for the Results rail (session data, plain numbers only):
// ipx.state.planProgress = { updated, source, earned: number | null, required: number | null, missing: number | null,
//   compulsoryLeft: number, groups: [{ code, name, kind: 'compulsory' | 'elective' | 'exam' | 'optional',
//   min: number | null, missing: number | null, done: boolean }] }
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.ui || !ipx.nav) return;
  const { clean, norm, lang } = ipx;
  const { h, icon, anchor, takeover, kpi, sectionHead, emptyState } = ipx.ui;
  const nav = ipx.nav;
  const PATH = '/auth/studijni/studijni_povinnosti.pl';
  const PAGE_SIZE = 50;

  const T = {
    cs: {
      credits: 'Kredity', of: (a, b) => `${a} z ${b}`, missing: (n) => `chybí ${n}`, needed: (n) => `ještě ${n} ${ipx.kit.plural(n, 'kredit', 'kredity', 'kreditů')}`,
      complete: 'splněno', compulsoryLeft: 'Povinné předměty', leftFoot: (n) => (n ? `nesplněno v povinných skupinách · z toho zapsané teď: ${n}` : 'nesplněno v povinných skupinách'),
      groupsDone: 'Splněné skupiny', groupsFoot: (n) => `z ${n} ${n === 1 ? 'skupiny' : 'skupin'} s požadavkem`,
      enrolledNow: 'Zapsáno teď', enrolledFoot: (n) => `${n} ${ipx.kit.plural(n, 'předmět právě probíhá', 'předměty právě probíhají', 'předmětů právě probíhá')}`,
      progress: (a, b) => `${a} z ${b} kreditů`,
      yours: 'Vaše předměty', yoursNone: 'V plánu zatím nemáte žádný zapsaný ani splněný předmět.',
      groups: 'Skupiny předmětů', kinds: { compulsory: 'povinné', elective: 'povinně volitelné', exam: 'státní zkouška', optional: 'volitelné' },
      done: 'Splněno', groupMissing: (n) => `chybí ${n} kr.`, minOf: (a, b) => `${a} z min. ${b} kr.`, earnedN: (a) => `${a} kr. získáno`,
      taken: (n) => (n ? `${n} ${ipx.kit.plural(n, 'předmět', 'předměty', 'předmětů')} z této skupiny` : 'zatím žádný předmět'),
      stDone: 'Splněno', stEnrolled: 'Zapsáno', stNot: 'Nezapsáno', stRecognised: 'Uznáno',
      notTaken: 'Ještě nesplněno', inGroup: 'Vaše předměty ve skupině', noneInGroup: 'Z této skupiny zatím nemáte žádný předmět.',
      choose: (n) => `Vybrat z ${n} ${n === 1 ? 'předmětu' : 'předmětů'}`, all: 'Všechny předměty skupiny', more: (n) => `Zobrazit dalších ${n}`,
      filter: 'Hledat podle kódu nebo názvu', noMatch: 'Žádný předmět neodpovídá hledání.', shown: (a, b) => `Zobrazeno ${a} z ${b}`,
      cr: 'kr.', times: (n) => `zapsáno ${n}×`,
      failed: 'Stránku kontroly plánu se nepodařilo přečíst. Původní stránku InSIS ukáže Klasické zobrazení v postranním panelu.',
      thesis: nav.label('studies.thesis'),
      since: 'od',
    },
    en: {
      credits: 'Credits', of: (a, b) => `${a} of ${b}`, missing: (n) => `${n} missing`, needed: (n) => `${n} more ${n === 1 ? 'credit' : 'credits'} needed`,
      complete: 'complete', compulsoryLeft: 'Compulsory courses', leftFoot: (n) => (n ? `not passed yet in compulsory groups · ${n} enrolled now` : 'not passed yet in compulsory groups'),
      groupsDone: 'Groups done', groupsFoot: (n) => `of ${n} ${n === 1 ? 'group' : 'groups'} with a requirement`,
      enrolledNow: 'Enrolled now', enrolledFoot: (n) => `${n} ${n === 1 ? 'course' : 'courses'} in progress`,
      progress: (a, b) => `${a} of ${b} credits`,
      yours: 'Your courses', yoursNone: 'You have no enrolled or passed course in this plan yet.',
      groups: 'Groups of courses', kinds: { compulsory: 'compulsory', elective: 'elective', exam: 'state exam', optional: 'optional' },
      done: 'Done', groupMissing: (n) => `${n} cr. missing`, minOf: (a, b) => `${a} of min. ${b} cr.`, earnedN: (a) => `${a} cr. earned`,
      taken: (n) => (n ? `${n} ${n === 1 ? 'course' : 'courses'} from this group` : 'no course yet'),
      stDone: 'Passed', stEnrolled: 'Enrolled', stNot: 'Not taken', stRecognised: 'Recognised',
      notTaken: 'Not passed yet', inGroup: 'Your courses in this group', noneInGroup: 'You have no course from this group yet.',
      choose: (n) => `Choose from ${n} ${n === 1 ? 'course' : 'courses'}`, all: 'All courses of the group', more: (n) => `Show ${n} more`,
      filter: 'Search by code or title', noMatch: 'No course matches the search.', shown: (a, b) => `Showing ${a} of ${b}`,
      cr: 'cr.', times: (n) => `enrolled ${n}×`,
      failed: "InSIS+ could not read this plan check. Classic view in the sidebar shows InSIS's own page.",
      thesis: nav.label('studies.thesis'),
      since: 'from',
    },
  }[lang];
  const locale = lang === 'cs' ? 'cs-CZ' : 'en-GB';
  const fmt = (n) => n.toLocaleString(locale, { maximumFractionDigits: 1 });
  const text = (el) => (el ? clean(el.textContent) : '');
  const num = (s) => { const m = /\d+(?:[.,]\d+)?/.exec(s || ''); return m ? Number(m[0].replace(',', '.')) : null; };

  // ---------- reading (one pass, textContent only) ----------

  // Status of a course row: "FULFILLED (06/10/2026)" / "SPLNĚNO (…)", "ENROLLED" / "ZAPSÁNO", "NOT ENROLLED" /
  // "NEZAPSÁNO"; a recognised course ("RECOGNISED" / "UZNÁNO") counts as done. Anything else keeps InSIS's word.
  function status(raw) {
    const t = norm(raw);
    const date = /\(([^)]*\d[^)]*)\)/.exec(raw)?.[1] || '';
    if (/^(not enrolled|nezapsan|nezaps)/.test(t)) return { st: 'not', date };
    if (/^(fulfilled|splnen|accomplished|passed)/.test(t)) return { st: 'done', date };
    if (/^(recogni[sz]ed|uznan)/.test(t)) return { st: 'recognised', date };
    if (/^(enrolled|zapsan|registered)/.test(t)) return { st: 'enrolled', date };
    return { st: 'other', date, raw };
  }

  // "hP - Compulsory course master (t: 1)" and "A group of elective courses (min. 36 crd.) - NOT ACCOMPLISHED
  // missing 33 credits" (Czech: "Skupina povinně volitelných předmětů (min. 36 kr.) - NESPLNĚNO chybí 33 kreditů").
  function readGroup(id, cell, iconCell) {
    const bs = [...cell.children].filter((c) => c.tagName === 'B');
    const title = text(bs[0]) || text(cell);
    const rule = bs.length > 1 ? bs.slice(1).map(text).join(' ') : '';
    const m = /^(\S+)\s+-\s+(.*?)\s*\(t:\s*(\d)\)\s*$/.exec(title) || /^(\S+)\s+-\s+(.*)$/.exec(title);
    const t = m?.[3] ? Number(m[3]) : null;
    const r = norm(rule);
    const name = m ? m[2] : title;
    const min = /\(min\.?\s*(\d+)/.exec(r)?.[1];
    const missing = /(missing|chybi)\D*(\d+)/.exec(r)?.[2];
    const sys = iconCell?.querySelector('[data-sysid]')?.getAttribute('data-sysid') || '';
    const failed = /nesplnen/.test(sys) || /not accomplished|nesplnen/.test(r);
    const doneMark = !failed && (/splnen/.test(sys) || /accomplished|splnen/.test(r));
    const exam = /state exam|statni (zaverecn\w* )?zkous|szz/.test(norm(name)) || /^h?SZ\d*$/i.test(m?.[1] || '');
    // The type InSIS gives as "(t: 1 | 2 | 3)"; without it, the group sentence ("povinně volitelných" first, as it
    // contains both other words).
    const kind = exam ? 'exam'
      : t === 1 ? 'compulsory' : t === 2 ? 'elective' : t === 3 ? 'optional'
        : /elective|povinne volit/.test(r) ? 'elective' : /compulsory|povinnych/.test(r) ? 'compulsory' : /optional|volitelnych/.test(r) ? 'optional' : 'elective';
    return { id, code: m ? m[1] : '', name, t, kind, rule, min: min ? Number(min) : null, missing: missing ? Number(missing) : (doneMark ? 0 : null),
      done: doneMark, courses: [], seen: new Set() };
  }

  function parse(page) {
    const planTable = page.querySelector('tr.predmety_vse')?.closest('table');
    if (!planTable) return null;
    const rows = planTable.rows;
    const groups = new Map();
    const order = [];
    let anchorId = null;
    let current = null;
    for (const tr of rows) {
      const cls = tr.className;
      if (cls.includes('predmety_vse')) {
        const id = /predmety_vse_(\d+)/.exec(cls)?.[1];
        const g = (id && groups.get(id)) || current;
        if (!g) continue;
        const c = tr.cells;
        if (c.length < 6) continue;
        const code = text(c[0]);
        if (!code || g.seen.has(code)) continue;
        g.seen.add(code);
        const a = c[1].querySelector('a[href]') || c[0].querySelector('a[href]');
        const st = status(text(c[5]));
        g.courses.push({
          code,
          name: text(a) || text(c[1]),
          href: a ? a.getAttribute('href') : null,
          completion: text(c[2]),
          credits: num(c[3].textContent),
          times: num(c[4].textContent) || 0,
          ...st,
        });
        continue;
      }
      if (cls.includes('predmety') || cls.includes('zadny_predmet')) continue;
      // The column-head row of a group carries the group's id as an anchor; the group's own row follows it.
      const named = tr.querySelector('a[name]');
      if (named && /^\d+$/.test(named.getAttribute('name'))) { anchorId = named.getAttribute('name'); continue; }
      const cells = tr.cells;
      if (cells.length === 2 && cells[1].colSpan === 5 && /\(t:\s*\d\)|\bmin\.|-\s+\S/.test(cells[1].textContent)) {
        const id = anchorId || `g${order.length}`;
        current = readGroup(id, cells[1], cells[0]);
        groups.set(id, current);
        order.push(current);
        anchorId = null;
      }
    }
    if (!order.length) return null;

    // Summary table and status lines (two-cell rows above the plan).
    const facts = {};
    const lines = [];
    for (const table of page.querySelectorAll('table')) {
      if (table === planTable) break;
      for (const tr of table.rows) {
        const c = tr.cells;
        if (c.length !== 2) continue;
        const label = norm(c[0].textContent).replace(/:$/, '').trim();
        const sys = c[0].querySelector('[data-sysid^="stav-"]')?.getAttribute('data-sysid');
        if (sys) { lines.push({ text: text(c[1]), ok: !/nesplnen/.test(sys) }); continue; }
        if (/^(study|studium)$/.test(label)) facts.study = text(c[1]);
        else if (/^(credits|kredity)$/.test(label)) facts.credits = text(c[1]);
        else if (/^(initial period|pocatecni obdobi|zacatek)/.test(label)) facts.initial = text(c[1]);
      }
    }
    const nums = (facts.credits || '').match(/\d+(?:[.,]\d+)?/g) || [];
    const missing = /(missing|chyb\w*)\D*(\d+)/i.exec(norm(facts.credits || ''))?.[2];
    const earned = nums[0] != null ? Number(nums[0].replace(',', '.')) : null;
    const required = nums[1] != null ? Number(nums[1].replace(',', '.')) : null;
    const rank = { compulsory: 0, elective: 1, exam: 2, optional: 3 };
    return {
      groups: order.map((g, i) => ({ ...g, i })).sort((a, b) => rank[a.kind] - rank[b.kind] || a.i - b.i),
      lines,
      study: facts.study || '',
      initial: facts.initial || '',
      earned,
      required,
      missing: missing != null ? Number(missing) : earned != null && required != null ? Math.max(0, required - earned) : null,
    };
  }

  // ---------- derived ----------

  const isDone = (c) => c.st === 'done' || c.st === 'recognised';
  const isMine = (c) => isDone(c) || c.st === 'enrolled' || c.st === 'other' || c.times > 0;
  const sum = (list) => list.reduce((s, c) => s + (c.credits || 0), 0);

  function derive(d) {
    for (const g of d.groups) {
      g.mine = g.courses.filter(isMine);
      g.earned = sum(g.courses.filter(isDone));
      g.left = g.kind === 'compulsory' ? g.courses.filter((c) => !isDone(c)) : [];
    }
    // A course can sit in two groups; count it once.
    const byCode = new Map();
    for (const g of d.groups) for (const c of g.mine) if (!byCode.has(c.code)) byCode.set(c.code, { ...c, group: g });
    const mine = [...byCode.values()];
    const enrolled = mine.filter((c) => c.st === 'enrolled');
    const required = d.groups.filter((g) => g.kind !== 'optional' || g.min != null);
    return {
      mine,
      enrolled,
      enrolledCredits: sum(enrolled),
      compulsoryLeft: new Set(d.groups.flatMap((g) => g.left.map((c) => c.code))).size,
      compulsoryEnrolled: new Set(d.groups.flatMap((g) => g.left.filter((c) => c.st === 'enrolled').map((c) => c.code))).size,
      required,
      groupsDone: required.filter((g) => g.done || g.missing === 0).length,
    };
  }

  // ---------- drawing ----------

  const link = (c) => {
    if (!c.href) return null;
    try { return nav.safe(new URL(c.href, document.baseURI).href, 'link', { copied: true }); } catch { return null; }
  };
  const STATUS = { done: ['ok', 'stDone'], recognised: ['ok', 'stRecognised'], enrolled: ['warn', 'stEnrolled'], not: ['neutral', 'stNot'], other: ['neutral', null] };

  function courseRow(c, withGroup) {
    const [tone, key] = STATUS[c.st] || STATUS.other;
    const href = link(c);
    return h('li', { class: `pp-course st-${c.st}` },
      h('span', { class: 'pp-code' }, c.code),
      h('span', { class: 'pp-title' },
        href ? h('a', { href }, c.name) : h('strong', {}, c.name),
        h('small', {}, [withGroup && c.group?.name, c.completion, c.times > 1 && T.times(c.times)].filter(Boolean).join(' · '))),
      h('span', { class: 'pp-cr' }, c.credits != null ? fmt(c.credits) : '', c.credits != null && h('small', {}, T.cr)),
      h('span', { class: `delta ${tone}` }, key ? T[key] : c.raw, c.date && ` ${c.date}`));
  }

  // A progress bar; a requirement of 0 counts as met (100 %), never "NaN %".
  const bar = (value, max, tone) => {
    const pct = max > 0 ? Math.min(100, ((value || 0) / max) * 100) : 100;
    return h('div', { class: 'pp-bar', role: 'img', 'aria-label': `${Math.round(pct)} %` },
      h('span', { class: tone ? `t-${tone}` : null, style: `width: ${pct}%` }));
  };

  // A long list drawn on demand, PAGE_SIZE rows at a time, with a filter when it is longer than one page.
  function lazyList(courses) {
    const list = h('ul', { class: 'pp-list' });
    const foot = h('div', { class: 'pp-more' });
    let query = '';
    let shown = 0;
    const matches = () => (query ? courses.filter((c) => norm(`${c.code} ${c.name}`).includes(query)) : courses);
    function more() {
      const all = matches();
      list.append(...all.slice(shown, shown + PAGE_SIZE).map((c) => courseRow(c)));
      shown = Math.min(all.length, shown + PAGE_SIZE);
      const rest = all.length - shown;
      foot.replaceChildren(...[
        !all.length ? h('p', { class: 'muted' }, T.noMatch) : h('span', { class: 'muted' }, T.shown(shown, all.length)),
        rest > 0 && h('button', { type: 'button', class: 'btn ghost', onclick: more }, T.more(Math.min(PAGE_SIZE, rest))),
      ].filter(Boolean));
    }
    const input = courses.length > PAGE_SIZE && h('input', { type: 'search', class: 'pp-filter', placeholder: T.filter, 'aria-label': T.filter,
      oninput: (e) => { query = norm(e.target.value).trim(); shown = 0; list.replaceChildren(); more(); } });
    more();
    return h('div', { class: 'pp-lazy' }, input, list, foot);
  }

  function groupBody(g) {
    const rest = g.courses.filter((c) => !isMine(c));
    const list = (courses) => (courses.length > PAGE_SIZE ? lazyList(courses) : h('ul', { class: 'pp-list' }, courses.map((c) => courseRow(c))));
    return [
      g.mine.length ? [h('p', { class: 'pp-sub' }, T.inGroup), h('ul', { class: 'pp-list' }, g.mine.map((c) => courseRow(c)))]
        : g.kind !== 'compulsory' && h('p', { class: 'muted pp-none' }, T.noneInGroup),
      // In a compulsory group the courses not passed yet are exactly what is left: always listed.
      g.kind === 'compulsory' && rest.length > 0 && [h('p', { class: 'pp-sub' }, T.notTaken), list(rest)],
      g.kind !== 'compulsory' && rest.length > 0 && (() => {
        const slot = h('div', { class: 'pp-choose' });
        const open = h('button', { type: 'button', class: 'btn ghost', onclick: () => slot.replaceChildren(h('p', { class: 'pp-sub' }, T.all), lazyList(rest)) },
          icon('list'), h('span', {}, T.choose(rest.length)));
        slot.append(open);
        return slot;
      })(),
    ];
  }

  function groupCard(g) {
    const has = g.min != null;
    const ok = g.done || g.missing === 0;
    const statusChip = has ? h('span', { class: `delta ${ok ? 'ok' : 'warn'}` }, ok ? T.done : T.groupMissing(fmt(g.missing ?? Math.max(0, g.min - g.earned))))
      : h('span', { class: 'delta neutral' }, T.taken(g.mine.length));
    const body = h('div', { class: 'pp-group-body' });
    let built = false;
    const build = () => { if (!built) { built = true; body.append(...[groupBody(g)].flat(Infinity).filter(Boolean)); } };
    // Open: groups that still ask for something (compulsory, elective and exam groups not done). Others are drawn
    // when opened.
    const startOpen = g.kind !== 'optional' && !ok;
    if (startOpen) build();
    return h('details', { class: `card pp-group k-${g.kind}`, open: startOpen ? '' : null, ontoggle: (e) => { if (e.currentTarget.open) build(); } },
      h('summary', {},
        h('span', { class: 'pp-group-head' },
          h('span', { class: 'pp-group-name' }, h('strong', {}, g.name), h('small', {}, [g.code, T.kinds[g.kind]].filter(Boolean).join(' · '))),
          statusChip),
        has ? h('span', { class: 'pp-group-progress' }, bar(g.earned, g.min, ok ? 'ok' : null), h('small', {}, T.minOf(fmt(g.earned), fmt(g.min))))
          : g.earned > 0 && h('span', { class: 'pp-group-progress' }, h('small', {}, T.earnedN(fmt(g.earned))))),
      body);
  }

  function buildPage(d, x) {
    const pct = d.required ? (d.earned / d.required) * 100 : null;
    const thesis = nav.target('studies.thesis');
    return h('div', { class: 'pp' },
      h('div', { class: 'pp-main' },
        d.required != null && h('section', { class: 'card pp-hero' },
          h('div', { class: 'pp-hero-top' },
            h('div', {},
              h('p', { class: 'pp-hero-label' }, T.credits),
              h('p', { class: 'pp-big' }, fmt(d.earned ?? 0), h('small', {}, ` / ${fmt(d.required)}`))),
            h('span', { class: `delta ${d.missing ? 'warn' : 'ok'}` }, d.missing ? T.needed(d.missing) : T.complete)),
          pct != null && bar(d.earned, d.required, d.missing ? null : 'ok'),
          (d.study || d.initial) && h('p', { class: 'muted pp-plan' }, [d.study, d.initial && `${T.since} ${d.initial}`].filter(Boolean).join(' · '))),
        d.lines.length > 0 && h('div', { class: 'pp-lines' }, d.lines.map((l) => {
          const isThesis = /thesis|zaverecn|szz|statni/.test(norm(l.text));
          return h('p', { class: `kit-note ${l.ok ? 'ok' : isThesis ? 'warn' : 'info'}` }, icon(l.ok ? 'check' : isThesis ? 'alert' : 'info'),
            h('span', {}, l.text, isThesis && !l.ok && thesis && [' ', anchor({ href: thesis }, { class: 'pp-line-link' }, T.thesis)]));
        })),
        h('div', { class: 'kpis' },
          kpi({ label: T.compulsoryLeft, value: x.compulsoryLeft, foot: T.leftFoot(x.compulsoryEnrolled), status: x.compulsoryLeft === 0 ? { tone: 'ok', text: T.done } : null }),
          x.required.length > 0 && kpi({ label: T.groupsDone, value: x.groupsDone, unit: `/ ${x.required.length}`, foot: T.groupsFoot(x.required.length) }),
          kpi({ label: T.enrolledNow, value: fmt(x.enrolledCredits), unit: T.cr, foot: T.enrolledFoot(x.enrolled.length) })),
        sectionHead(T.yours),
        x.mine.length ? h('ul', { class: 'card pp-list pp-mine' }, x.mine.map((c) => courseRow(c, true))) : emptyState(T.yoursNone),
        sectionHead(T.groups),
        h('div', { class: 'pp-groups' }, d.groups.map(groupCard))),
      // (Results is a sidebar section next to this one: no card repeating it here.)
    );
  }

  function remember(d, x) {
    ipx.state.planProgress = {
      updated: Date.now(),
      source: document.baseURI.split('#')[0],
      earned: d.earned, required: d.required, missing: d.missing,
      compulsoryLeft: x.compulsoryLeft,
      groups: d.groups.map((g) => ({ code: g.code, name: g.name, kind: g.kind, min: g.min, missing: g.missing, done: !!(g.done || g.missing === 0) })),
    };
    ipx.save();
  }

  ipx.ready.then(() => {
    if (nav.route(document.baseURI.split('#')[0]).path !== PATH) return;
    const page = document.getElementById('str1');
    if (!page) return;
    performance.mark('insis-plus:plan-progress:start');
    let data = null;
    try { data = parse(page); } catch { data = null; }
    const x = data && derive(data);
    // Never the generic shell here (it would slot and restyle the whole 835 kB table): a short error state instead.
    takeover({
      key: 'plan-progress',
      css: ['kit.css', 'pages/plan-progress.css'],
      title: nav.sectionLabel('grades.plan'),
      subtitle: nav.label('grades'),
      build: () => (data ? buildPage(data, x) : h('div', { class: 'kit-page' }, emptyState(T.failed))),
    });
    performance.measure('insis-plus:plan-progress', 'insis-plus:plan-progress:start');
    if (data) remember(data, x);
  });
})();
