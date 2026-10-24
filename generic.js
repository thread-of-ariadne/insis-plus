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

    // Titles follow 03-pages.md: a section's own page is titled by the section (eyebrow: the destination); a page
    // below it (a person, a folder, a step) keeps InSIS's name for it (eyebrow: the section).
    const crumbs = [...page.querySelectorAll('.breadcrumb-item')].map((li) => clean(li.textContent)).filter(Boolean);
    const insisName = crumbs.at(-1) || clean(page.querySelector('#titulek h1')?.textContent) || clean(document.title);
    const nav = ipx.nav;
    const where = ipx.ui.here();
    const section = where.node && nav.sectionOf(where.node);
    const entry = section && nav.target(section);
    const isEntry = entry && nav.route(entry).path === where.path;
    const sectionName = section && nav.sectionLabel(section);
    const title = (isEntry && sectionName) || insisName;
    const eyebrow = isEntry ? (where.dest && nav.label(where.dest)) : sectionName && sectionName !== title ? sectionName : null;

    styleSlotted();
    takeover({ key: 'generic', title, subtitle: eyebrow, slotted: [page] });
  });
})();
