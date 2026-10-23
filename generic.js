// InSIS+ — the shell for every InSIS page that has no module of its own.
// The original #str1 content block moves into the InSIS+ panel as it is (slotted, not copied), so InSIS's
// scripts, forms and links keep working; generic.css gives its tables, forms and buttons the InSIS+ look.
// Loaded last: page modules (home, syllabus, catalog, …) take over first, and then this one stands aside.
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.ui) return;
  const { clean } = ipx;
  const { takeover, styleSlotted } = ipx.ui;

  // Pages that must stay exactly as InSIS shows them.
  const SKIP = /\/(logout|zmena_hesla|zmena_identity)\.pl$/;

  ipx.ready.then(() => {
    if (document.getElementById('insis-plus-page')) return;
    const page = document.getElementById('str1');
    if (!page || SKIP.test(location.pathname)) return;

    // The last breadcrumb names the page; the big InSIS heading often names its section ("Student's portal").
    const crumbs = [...page.querySelectorAll('.breadcrumb-item')].map((li) => clean(li.textContent)).filter(Boolean);
    const heading = clean(page.querySelector('#titulek h1')?.textContent);
    const title = crumbs.at(-1) || heading || clean(document.title);
    // Earlier breadcrumbs are often navigation ("Main page", "Previous page"), so the eyebrow is just one line.
    const eyebrow = heading && heading !== title ? heading : crumbs.length > 1 ? crumbs.at(-2) : null;

    styleSlotted();
    takeover({ key: 'generic', title, subtitle: eyebrow, slotted: [page] });
  });
})();
