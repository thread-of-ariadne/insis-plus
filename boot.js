// InSIS+ — the first frame. Runs at document_start, before InSIS's page is parsed, so the student never sees the
// original page flash by and then jump: while InSIS's server is still sending the page, a skeleton of the InSIS+
// shell (sidebar, top bar, a few placeholder cards) is shown instead. The real page replaces it as soon as a module
// draws it (ui.takeover calls __ipxBootDone), or when InSIS+ does not take the page over (classic view, the login
// page, a page no module recognises). Safety nets: InSIS's original page always comes back by itself — shortly after
// the page has loaded, and in any case after a fixed time — so a failure in InSIS+ can never leave a blank page.
// Nothing is sent; the only thing read is the appearance last used on this device (light / dark / system, kept by
// content.js), so the skeleton is never dark while InSIS+ is set to light, or the other way round.
(() => {
  if (window.top !== window) return;
  const path = location.pathname;
  // Only logged-in InSIS pages; never the pages that must stay exactly as InSIS shows them.
  if (!path.startsWith('/auth/') || /\/(logout|zmena_hesla|zmena_identity)\.pl$/.test(path)) return;

  const root = document.documentElement;
  const style = document.createElement('style');
  style.id = 'insis-plus-boot';
  style.textContent = `
    html.ipx-boot:not(.ipx-boot-pending) { background: #f2f4f8; }
    html.ipx-boot body { visibility: hidden !important; }
    html.ipx-boot.ipx-boot-dark { background: #0c0e13; }
    #insis-plus-boot { position: fixed; inset: 0; z-index: 2147483647; display: grid; grid-template-columns: 256px minmax(0, 1fr);
      background: radial-gradient(1100px 760px at 0 0, #d9e1fb 0%, #e6ebf9 40%, #f2f4f8 78%); font: 14px system-ui, sans-serif; }
    .ipx-boot-dark #insis-plus-boot { background: radial-gradient(1100px 760px at 0 0, #1b2447 0%, #121729 40%, #0c0e13 78%); }
    #insis-plus-boot .b-side { display: flex; flex-direction: column; gap: 10px; padding: 22px 16px; }
    #insis-plus-boot .b-main { margin: 12px 12px 12px 0; padding: 26px 32px; border-radius: 22px; background: #fcfcfe;
      box-shadow: 0 1px 0 rgba(16,19,31,.06), 0 12px 28px -20px rgba(16,19,31,.4); display: flex; flex-direction: column; gap: 16px; }
    .ipx-boot-dark #insis-plus-boot .b-main { background: #14171f; box-shadow: none; }
    #insis-plus-boot i { display: block; border-radius: 10px; background: linear-gradient(90deg, rgba(120,130,160,.16) 25%, rgba(120,130,160,.28) 50%, rgba(120,130,160,.16) 75%);
      background-size: 200% 100%; animation: ipx-boot-shimmer 1.4s ease-in-out infinite; }
    #insis-plus-boot .b-logo { width: 120px; height: 34px; margin-bottom: 14px; }
    #insis-plus-boot .b-nav { height: 34px; }
    #insis-plus-boot .b-top { display: flex; justify-content: space-between; gap: 16px; }
    #insis-plus-boot .b-title { width: 260px; height: 38px; }
    #insis-plus-boot .b-search { width: 300px; height: 40px; }
    #insis-plus-boot .b-tabs { width: 420px; max-width: 100%; height: 22px; }
    #insis-plus-boot .b-card { height: 110px; border-radius: 16px; }
    #insis-plus-boot .b-card.tall { height: 220px; }
    @keyframes ipx-boot-shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
    @media (prefers-reduced-motion: reduce) { #insis-plus-boot i { animation: none; } }
    @media (max-width: 900px) { #insis-plus-boot { grid-template-columns: minmax(0, 1fr); } #insis-plus-boot .b-side { display: none; }
      #insis-plus-boot .b-main { margin: 0; border-radius: 0; padding: 18px 16px; } #insis-plus-boot .b-search { display: none; } }`;
  const skel = document.createElement('div');
  skel.id = 'insis-plus-boot';
  skel.setAttribute('aria-hidden', 'true');
  const bar = (cls) => Object.assign(document.createElement('i'), { className: cls });
  const side = Object.assign(document.createElement('div'), { className: 'b-side' });
  side.append(bar('b-logo'), ...Array.from({ length: 7 }, () => bar('b-nav')));
  const main = Object.assign(document.createElement('div'), { className: 'b-main' });
  const top = Object.assign(document.createElement('div'), { className: 'b-top' });
  top.append(bar('b-title'), bar('b-search'));
  main.append(top, bar('b-tabs'), bar('b-card'), bar('b-card tall'), bar('b-card'));
  skel.append(side, main);

  // The original page is hidden at once; the skeleton is painted once the appearance is known (the read takes a few
  // milliseconds; without it, e.g. on test pages, the system setting decides).
  const systemDark = () => matchMedia('(prefers-color-scheme: dark)').matches;
  const paint = (theme) => {
    root.classList.remove('ipx-boot-pending');
    if (finished) return;
    root.classList.toggle('ipx-boot-dark', theme === 'dark' || (theme !== 'light' && systemDark()));
    root.classList.add('ipx-boot');
    root.append(skel);
  };
  root.classList.add('ipx-boot', 'ipx-boot-pending');
  root.append(style);
  try {
    chrome.storage.local.get('insisPlusBootTheme').then((r) => paint(r?.insisPlusBootTheme), () => paint(null));
  } catch {
    queueMicrotask(() => paint(null)); // after `finished` below is set up
  }

  let finished = false;
  const done = () => {
    if (finished) return;
    finished = true;
    root.classList.remove('ipx-boot', 'ipx-boot-dark', 'ipx-boot-pending');
    style.remove();
    skel.remove();
  };
  // ui.takeover() and content.js call this when the InSIS+ page is drawn or when InSIS+ stands aside.
  globalThis.__ipxBootDone = done;
  // InSIS+'s own theme setting, once known (light/dark chosen in InSIS+ settings).
  globalThis.__ipxBootTheme = (theme) => {
    if (finished) return;
    const dark = theme === 'dark' || (theme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
    root.classList.toggle('ipx-boot-dark', dark);
  };
  // Safety nets: shortly after the page has fully loaded, and at the latest after 12 s.
  addEventListener('load', () => setTimeout(done, 1500), { once: true });
  setTimeout(done, 12000);
})();
