// InSIS+ — "To do" (K vyřízení): things the student must do, from data InSIS+ has read (docs/ia/02-redesign.md §6).
// Each source names the stored data it uses, says when it was last checked, and turns that data into items.
// An item links to the InSIS page that holds the action, never to an action itself.
//
// ipx.todo.items({ course }) → [{ id, title, sub, due: Date | null, tone, href }] soonest first (course: only its code)
// ipx.todo.status()          → [{ id, label, checked: Date | null }] for the "last checked" line
// ipx.todo.add(source)       → page modules register more sources (exams, tests, …)
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.ui || !ipx.nav) return;
  const { lang, norm } = ipx;
  const { countdown, deadlineTone } = ipx.ui;

  const T = {
    cs: { submissions: 'odevzdávárny', hand: (t) => `Odevzdat: ${t}`, restriction: 'Omezení studia', restrictionSub: 'Podívejte se, co znamená a koho kontaktovat',
      notice: 'oznámení InSIS', dataCheck: 'Kontrola osobních údajů', dataCheckSub: 'InSIS vás žádá o kontrolu', portal: 'portál', group: 'skupinová' },
    en: { submissions: 'submissions', hand: (t) => `Hand in: ${t}`, restriction: 'Study restriction', restrictionSub: 'See what it means and whom to contact',
      notice: 'InSIS notices', dataCheck: 'Personal data check', dataCheckSub: 'InSIS asks you to check your data', portal: 'portal', group: 'group' },
  }[lang];

  const sources = [];
  const add = (source) => sources.push(source);
  const at = (s) => (s ? new Date(s) : null);

  // Open submission boxes with nothing handed in that close within 7 days.
  add({
    id: 'submissions', label: T.submissions, key: 'submissions',
    items(state, now) {
      return (state.submissions?.boxes || []).map((b) => ({ ...b, closesAt: at(b.closes), opensAt: at(b.opens) }))
        .filter((b) => b.closesAt && b.closesAt > now && b.closesAt - now < 7 * 864e5 && (!b.opensAt || b.opensAt <= now) && b.submitted !== true)
        .map((b) => ({
          id: `sub:${b.code}:${b.title}`, code: b.code, due: b.closesAt, tone: deadlineTone(b.closesAt, false, now),
          title: T.hand(b.title || b.name), sub: [b.code, b.name].filter(Boolean).join(' · '),
          when: countdown(b.closesAt, now), href: ipx.nav.safe(b.href, 'link', { copied: true }) || ipx.nav.target('courses.submissions'),
        }));
    },
  });

  // A restriction in the portal's studies table.
  add({
    id: 'portal', label: T.portal, key: 'portal',
    items(state) {
      const r = state.portal?.study?.restriction;
      return r ? [{ id: 'restriction', title: T.restriction, sub: `${r} · ${T.restrictionSub}`, tone: 'bad', href: ipx.nav.target('studies.status') }] : [];
    },
  });

  // InSIS's own notice on its main page asking for a personal data check (shown here, not also as a notice).
  add({
    id: 'notices', label: T.notice, key: 'notices',
    items(state) {
      return (state.notices?.items || []).filter((n) => /kontrol\w* osobnich|personal data check/.test(norm(n.text)))
        .map((n) => ({ id: 'datacheck', title: T.dataCheck, sub: T.dataCheckSub, tone: 'warn', href: ipx.nav.safe(n.href, 'link', { copied: true }) || ipx.nav.target('account.profile') }));
    },
  });

  function items({ course } = {}, now = new Date()) {
    const off = new Set(ipx.state.plus?.todoOff || []);
    return sources.filter((s) => !off.has(s.id) && (!s.optional || ipx.state.plus?.todoOn?.includes(s.id)))
      .flatMap((s) => s.items(ipx.state, now))
      .filter((it) => !course || it.code === course)
      .filter((it) => !(ipx.state.plus?.dismissed || []).includes(it.id))
      // Items without a deadline (a restriction, a data check) first, then soonest deadline first.
      .sort((a, b) => (a.due ? a.due.getTime() : 0) - (b.due ? b.due.getTime() : 0));
  }

  function status() {
    return sources.filter((s) => !s.optional || ipx.state.plus?.todoOn?.includes(s.id))
      .map((s) => ({ id: s.id, label: s.label, checked: ipx.state[s.key]?.updated ? new Date(ipx.state[s.key].updated) : null }));
  }

  ipx.todo = { add, items, status };
})();
