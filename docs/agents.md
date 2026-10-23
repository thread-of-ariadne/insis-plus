# Brief for page agents: redesigning one InSIS page for InSIS+

You redesign **one** InSIS page as an InSIS+ page module. Read this file, `docs/pages.md` (your page's row and notes),
and the two example modules: `syllabus.js` (rebuilds the page from parsed data) and `catalog.js` (keeps the original
form and restyles it). The look to match is the live dashboard (`home.js`, `home.css`), which follows artboard 8 of the
maintainers' design canvas.

## What you may touch

- **Only** `pages/<page>.js` and `pages/<page>.css` (create them). Nothing else.
- Do **not** edit `ui.js`, `shared.css`, `generic.css`, `content.js`, other modules or `manifest.json`. If you need a
  new shared component or a token, build it locally in your page files and list it under "Requests" in your report;
  the lead moves it into the shared files and registers your module in the manifest.
- Never commit, push or publish. Never send page content anywhere: no `fetch` outside `insis.vse.cz`, no external
  libraries, no analytics. Fonts are already loaded by the shell.

## How a module works

Every InSIS page already gets the shell from `generic.js` (sidebar, top bar, original `#str1` moved into the raised
panel, generic look for tables and forms). A page module runs **before** `generic.js` and, when it recognises its
page, takes over instead. Template:

```js
// InSIS+ — <what this page is> (<path>).
(() => {
  const ipx = globalThis.insisPlus;
  if (!ipx?.ui) return;
  const { clean, norm, lang } = ipx;
  const { h, takeover, kpi, sectionHead, tabs, emptyState, notice, courseCard, weekStrip, styleSlotted } = ipx.ui;

  const T = { cs: { … }, en: { … } }[lang];

  function parse() {
    // Recognise the page by its content, not only by URL (fixtures run on localhost). Return null if unsure:
    // then generic.js handles the page, which is always a safe fallback.
  }

  ipx.ready.then(() => {
    const data = parse();
    if (!data) return;
    takeover({ key: '<page>', css: 'pages/<page>.css', title: …, subtitle: …, build: () => buildPage(data) });
    // or, to keep the original content: styleSlotted('pages/<page>.css'); takeover({ key, title, slotted: [node] });
  });
})();
```

`takeover()` options: `key` (remembers the "classic view" choice per page type), `css` (your stylesheet inside the
shadow root), `active` (`'home'` only for the dashboard), `title`, `subtitle` (one short eyebrow line), and either
`build` (returns your DOM, rendered in the closed shadow root) or `slotted` (original nodes moved into the panel,
styled in the page's own DOM by `generic.css` + your css via `styleSlotted`). Both can be combined: build a summary
on top, slot the original below.

## Two modes, and the one rule about actions

- **Rebuild (`build`)** for pages that only show information: parse the original DOM, render clean components.
  Keep every original link working (use the original `href`). Copy text with `textContent`; never inject page HTML
  as a string. If you clone nodes, clone them (`cloneNode(true)`), never move them out of InSIS's forms.
- **Keep (`slotted`)** for anything with forms or actions: exam and course registration, starting tests, uploads,
  settings, surveys. Move the original form into the panel and restyle it. **Never** re-create a submit button,
  never submit, click or `fetch` with POST on the user's behalf, never change what a form sends.

## Design rules (match these exactly)

- **Tokens only.** Use the CSS variables from `shared.css` inside the shadow root (`--surface`, `--panel`, `--fg`,
  `--fg-2`, `--muted`, `--faint`, `--line`, `--chip`, `--accent`, `--accent-soft`, `--ok`/`--bad`/`--warn` and their
  `-soft`, `--shadow-card`, `--shadow-raised`, `--font`, `--display`). In slotted content use the same names, which
  `generic.css` defines on `#str1`. No raw hex except faculty colours from `facultyColors()`. Dark mode then works.
- **Type.** Headings and big numbers: `var(--display)` (Bricolage Grotesque) with `font-stretch: 80%`, weight 800.
  Everything else: `var(--font)` (Figtree). Body 14–15px, labels 12–13px, section titles use `.section-title`.
- **Surfaces.** Cards have no border: `.card` (radius 16, `--shadow-card`). Inner elements radius 12, controls 10,
  tags 6. Segmented controls: `--chip` track, white raised active item. Dividers: 1px `--line`.
- **Layout.** Main column + optional right rail like the dashboard (`.dash` pattern in `home.css`): rail 340–360px,
  separated by a `--line` border. KPIs first (`.kpis` row of `kpi()`), then sections (`sectionHead()` + cards).
  Below 1100px the rail drops under the main column; below 900px the sidebar is a drawer and padding is 16px.
- **Components** (all in `ipx.ui`, styles in `shared.css`):
  - `kpi({ label, value, unit, status: { tone, text }, foot, href, isText })`
  - `sectionHead(title, { href, text }?, ...extraNodes)`, `tabs([{ id, label }], activeId, onPick)`
  - `courseCard({ href, code, faculty, name, aims, tags, semester, ects })`, `cover(code, faculty, w, h)`
  - `weekStrip(date?, markedDayIndexes?)`, `notice({ href, text })`, `emptyState(text, { href, text }?)`
  - `nextClasses(events, href, n?)`, `hoursChart(events, date?)`, `classDays(events, date?)` (timetable events)
  - `deadlineList(boxes, n?)`, `countdown(date, now?)`, `wallTime(date)`, `deadlineTone(closes, submitted, now?)`
  - `linkTabs([{ href, text, on, count }], label?)` for InSIS tab rows that are links
  - `facultyFor(code, text?)` (stored syllabus data → faculty in text → first digit of the code), `facultyColors(fac)`
  - `keepOnly(page, node)` shows one original node (a form) as a card and hides the rest of a slotted `#str1`;
    `hideInSlot(nodes)` hides parts you already show your own way. Both only while InSIS+ is on.
  - Icons: `cap calendar file mail book check people list search alert star layout back chevron panel burger
    clock globe award layers flask gear shield phone cpu arrow home folder info`
  - `h(tag, props, ...children)`, `icon(name)`, `anchor(link, props, ...children)`, `initials(name)`
- **Copy.** Czech and English (`ipx.lang`), short and plain. No invented data: if something is missing, show an
  empty state, never placeholder numbers.
- **Motion.** Only what `shared.css` already does (card entrance, hover lift). Respect `prefers-reduced-motion`.
- **No AI tropes.** No gradients on cards, no emoji icons, no left-border accent cards, no pills on everything.

## Testing (required before you report)

1. Serve the repository root: `python test/serve.py` (port 8765, caching off).
2. Build the test page from the snapshot, with your module loaded before `generic.js`:
   `python test/make_fixture.py test/fixtures/private/<snapshot>.html <snapshot> --with pages/<page>.js`
   (public snapshots: same script, output goes to `test/fixtures/<snapshot>.html`). Rebuild after each change to
   the snapshot; changes to your `.js`/`.css` only need a reload.
3. Open `http://localhost:8765/test/fixtures/private/<snapshot>.built.html`, open the mock home once first
   (`/test/mock-home.html`) so the sidebar has the full menu.
4. Check: light and dark, 1440px, ~1000px and 375px wide; no console errors (InSIS icon sprite errors are expected);
   every link still goes where the original did; "Classic view" in the sidebar brings the original page back.

## Lessons from the pilot (timetable)

- **Dates.** Test "today" inside and outside the data: mock the clock (e.g. override `Date` in the test page) and
  check the page still shows something sensible, with an honest note instead of invented data.
- **Narrow preview pane.** Screenshots of 1440px layouts get scaled down; measure elements instead (a temporary
  copy of the test page with `mode: 'open'` shadow roots works) and screenshot at the pane's real width too.
- **Background tabs freeze animations**, so cards stay invisible mid-fade; bring your test tab to the front.
- **Keeping part of the original.** To show one original form below a rebuilt view, slot the whole `#str1` and
  call `keepOnly(page, form)` (see `pages/timetable.js`, `pages/docserver.js`).
- **Czech and English.** Every page has both; snapshots of both live in `test/fixtures/private/` (`*-cs.html`).
  Match columns and labels in both languages and test both.
- **Shared data.** If your page is a source of data for the dashboard, store it compactly in `ipx.state.<page>`
  (no HTML) with `updated` and `source`, document the shape at the top of your module, and say so in the report.
- **Timetable events** are available to every module through `ipx.state.timetable.events` and the shared
  `nextClasses()`, `hoursChart()` and `classDays()` components.
- **Background sync.** `sync.js` loads the portal, personal timetable, study record, submissions and document
  server in a hidden frame; there `ipx.syncOnly` is true and `takeover()` does nothing, so your module must call
  its `remember()` **before** `takeover()` and must not depend on layout (sizes, visibility). Pages that show
  synced data redraw with `ipx.onData(render)`. The portal's links are in `ipx.state.portal.links`
  (`exams enrol timetable record submissions plan`), drawn by `quickActions(links)`.

## Report (your final message)

- What the page shows and what you parsed (selectors you rely on).
- Screenshots you checked (light, dark, phone) and anything that looked off.
- Assumptions and anything you could not verify.
- **Requests**: shared components or tokens you would like added, with the code you used locally.

Privacy: snapshots in `test/fixtures/private/` hold the user's personal data. Read them locally; do not quote names,
grades or other personal values in your report beyond what is needed to describe the layout.
