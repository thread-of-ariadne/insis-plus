// InSIS+ — background sync: keeps the dashboard's data fresh without the student opening each page.
// The dashboard, the sidebar and the portal need data that lives on other InSIS pages (the personal timetable,
// the study record, submission boxes, new documents). When that data is missing or old, those pages are fetched
// one after another as plain text and parsed with DOMParser: no InSIS script runs (so neither InSIS's own code nor
// the analytics it embeds), no image or stylesheet loads, nothing is clicked or submitted. The page module that
// owns the page parses the fetched document and stores its data (ipx.readers, registered by pages/*.js); open
// tabs pick it up through storage change events. Only pages a student can open with a plain link are fetched,
// and only through the URL rule of the mapping (nav.js).
//
// ipx.state.sync = { updated: last start (ms), running: bool }   (also a lock between tabs)
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.ui) return;

  const MAX_AGE = 3 * 3600e3; // data older than this is loaded again
  const LOCK = 2 * 60e3; // another tab started a sync less than this ago: let it finish
  const TIMEOUT = 25e3;

  const at = (path) => new URL(path, document.baseURI).href;
  // Test pages map InSIS addresses to local snapshots (see test/make_fixture.py); the extension never does.
  const resolve = (url) => globalThis.__ipxFixtureFor?.(url) || url;
  const stale = (key, age = MAX_AGE) => !ipx.state[key]?.updated || Date.now() - ipx.state[key].updated > age;

  // Every background read obeys the URL rule (nav.js): only pages marked readable, only with an allowed parameter
  // set. A page that does not pass is skipped, never "fixed up". A page no reader recognises (an error page, the
  // login page after InSIS logged the student out) stores nothing.
  async function load(key, url) {
    const allowed = ipx.nav ? ipx.nav.safe(url, 'fetch', { copied: true }) : null;
    const reader = ipx.readers?.[key];
    if (!allowed || !reader) return;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
    try {
      const res = await fetch(resolve(allowed), { credentials: 'include', signal: ctrl.signal, redirect: 'follow' });
      if (!res.ok) return;
      const fetched = new DOMParser().parseFromString(await res.text(), 'text/html');
      // Links in the fetched page resolve against its InSIS address, as they would on the page itself.
      fetched.head.prepend(Object.assign(fetched.createElement('base'), { href: allowed }));
      reader(fetched, allowed);
      await ipx.save();
    } catch {
      // A failed read leaves the old data; the "last checked" times on Home show it.
    } finally {
      clearTimeout(timer);
    }
  }

  async function run() {
    ipx.state.sync = { updated: Date.now(), running: true };
    await ipx.save();
    ipx.notify();

    // The portal first: it has this student's own addresses for the other pages.
    if (stale('portal', 12 * 3600e3)) await load('portal', at('/auth/student/moje_studium.pl'));
    const links = ipx.state.portal?.links || {};
    const steps = [
      ['timetable', links.timetable?.href],
      ['studyRecord', links.record?.href],
      ['submissions', links.submissions?.href],
      ['docserver', at('/auth/dok_server/')],
      // The mail box: only the unread count it shows, for the envelope badge (pages/messages.js).
      ['messages', at('/auth/posta/slozka.pl')],
    ];
    for (const [key, url] of steps) if (url && stale(key)) await load(key, url);

    ipx.state.sync = { updated: Date.now(), running: false };
    await ipx.save();
    ipx.notify();
  }

  ipx.ready.then(() => {
    // Only for a logged-in student (every logged-in page is under /auth/), in the tab's top window.
    if (!new URL(document.baseURI).pathname.startsWith('/auth/')) return;
    // Paused in InSIS+ settings: nothing is read in the background.
    if (ipx.state.plus?.pause) return;
    const s = ipx.state.sync;
    if (s?.running && Date.now() - s.updated < LOCK) return;
    const needed = stale('portal', 12 * 3600e3) || ['timetable', 'studyRecord', 'submissions', 'docserver', 'messages'].some((k) => stale(k));
    if (!needed) return;
    // Let the page itself finish first.
    setTimeout(run, 800);
  });
})();
