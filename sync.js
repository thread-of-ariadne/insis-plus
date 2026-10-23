// InSIS+ — background sync: keeps the dashboard's data fresh without the student opening each page.
// The dashboard, the sidebar and the portal need data that lives on other InSIS pages (the personal timetable,
// the study record, submission boxes, new documents). When that data is missing or old, those pages are loaded
// one after another in a hidden same-origin frame (InSIS allows that: X-Frame-Options SAMEORIGIN). In the frame,
// the usual page modules recognise the page and store their data (ipx.syncOnly: nothing is drawn, nothing is
// clicked or submitted, only pages a student can open with a plain link are loaded). Everything stays in
// chrome.storage.local; open tabs pick it up through storage change events.
//
// ipx.state.sync = { updated: last start (ms), running: bool }   (also a lock between tabs)
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.ui) return;

  const FRAME = 'ipx-sync';
  const MAX_AGE = 3 * 3600e3; // data older than this is loaded again
  const LOCK = 2 * 60e3; // another tab started a sync less than this ago: let it finish
  const TIMEOUT = 25e3;

  // In the frame: tell the tab that started it when this page's data is stored.
  if (ipx.syncOnly) {
    ipx.ready.then(() => setTimeout(async () => {
      await ipx.save();
      parent.postMessage({ ipxSynced: location.href }, location.origin);
    }, 0));
    return;
  }

  const at = (path) => new URL(path, document.baseURI).href;
  // Test pages map InSIS addresses to local snapshots (see test/make_fixture.py); the extension never does.
  const resolve = (url) => globalThis.__ipxFixtureFor?.(url) || url;
  const stale = (key, age = MAX_AGE) => !ipx.state[key]?.updated || Date.now() - ipx.state[key].updated > age;

  function load(url) {
    return new Promise((resolveLoad) => {
      const frame = document.createElement('iframe');
      frame.name = FRAME;
      frame.setAttribute('aria-hidden', 'true');
      frame.tabIndex = -1;
      frame.style.cssText = 'position:fixed;width:1px;height:1px;left:-9999px;top:0;border:0;opacity:0;pointer-events:none';
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        removeEventListener('message', onMessage);
        clearTimeout(timer);
        frame.remove();
        resolveLoad();
      };
      const onMessage = (e) => {
        if (e.source === frame.contentWindow && e.data?.ipxSynced) finish();
      };
      // A page no module recognises (an error page, the login page) never answers: give up after a while.
      const timer = setTimeout(finish, TIMEOUT);
      addEventListener('message', onMessage);
      frame.src = resolve(url);
      document.documentElement.append(frame);
    });
  }

  async function run() {
    ipx.state.sync = { updated: Date.now(), running: true };
    await ipx.save();
    ipx.notify();

    // The portal first: it has this student's own addresses for the other pages.
    if (stale('portal', 12 * 3600e3)) await load(at('/auth/student/moje_studium.pl'));
    const links = ipx.state.portal?.links || {};
    const steps = [
      ['timetable', links.timetable?.href],
      ['studyRecord', links.record?.href],
      ['submissions', links.submissions?.href],
      ['docserver', at('/auth/dok_server/')],
    ];
    for (const [key, url] of steps) if (url && stale(key)) await load(url);

    ipx.state.sync = { updated: Date.now(), running: false };
    await ipx.save();
    ipx.notify();
  }

  ipx.ready.then(() => {
    // Only for a logged-in student (every logged-in page is under /auth/), in the tab's top window.
    if (!new URL(document.baseURI).pathname.startsWith('/auth/')) return;
    const s = ipx.state.sync;
    if (s?.running && Date.now() - s.updated < LOCK) return;
    const needed = stale('portal', 12 * 3600e3) || ['timetable', 'studyRecord', 'submissions', 'docserver'].some((k) => stale(k));
    if (!needed) return;
    // Let the page itself finish first.
    setTimeout(run, 800);
  });
})();
