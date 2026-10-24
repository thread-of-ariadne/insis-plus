# InSIS+: page by page (draft 1)

`02-redesign.md` decides *where* every InSIS page lives. This document decides *what each page looks like*: every
page type a student meets gets a treatment, a reason and, for the complex ones, a teardown (what the InSIS page
is for, what is wrong with it, how InSIS+ rebuilds it). Nothing ships as "InSIS's page with the InSIS+ colours on
top" unless it is listed in §6 (exceptions).

Basis: `mapping.json` (page types), the crawl (`test/fixtures/private/map/crawl.json`: headings, tables, forms and
tab rows of 483 pages), the logged-in snapshots in `test/fixtures/private/`, and the principles of `02-redesign.md`
§1 (above all 7: InSIS performs every action, on its own page, by the student's own click).

## 1. Navigation rules (decided 2026-10-24)

The InSIS pages carried up to three stacked rows of tabs: InSIS+'s destination tabs, InSIS's *portal bar*
("My College · E-study record · My schoolmates · …", 11 links on 41 page types) and the page's own tabs. A
second look at what each row does:

| Row | What it is | Decision |
|---|---|---|
| Destination tabs (My courses · Materials · …) | navigation between **places** | moved to the sidebar: the current destination opens its sections as a submenu (Stripe, Linear, GitHub settings, Vercel); the row is gone |
| InSIS's portal bar | a second copy of the navigation; every link in it is a sidebar section (checked against the crawl) | hidden everywhere |
| The page's own tabs | **views of one thing**: a course, one InSIS tool (mail box, document server, e-library), one list cut different ways (exam dates: mine / available / past / not scheduled) | kept: one row of view tabs under the page title (`ui.viewTabs`), always the same component |

Rules that follow:

1. **One row of tabs per page, at most**, and only for views of one thing (NN/g, "Tabs, used right"; Material 3
   tabs). Places are never tabs.
2. **Sections are places** and live in the sidebar. A destination with groups (Study matters, Campus & people)
   shows its sections in the submenu in group order; its landing page is an overview with live data, not a page
   of links.
3. **No dead ends in the navigation**: a section exists only if it opens a real page. What InSIS has no page for
   (requests to the study department, applying for the next degree) is said on the destination's overview.
4. **One place per job.** If two sections do the same job (the timetable's print/PDF form and *Export to
   calendar*), they become one (My week › Export and print).
5. When a view of a list must stay InSIS's own page (because the actions live in it), the views are still one
   section (`structure.views` in `mapping.json`): the sidebar shows *Exam dates* once, the page shows the views as
   view tabs.

Section changes made by these rules (`mapping.json` `structure.tabs`): Schedule loses *Export to calendar* (an
action of My week); Exams shows *Exam dates* (four views) and *Online tests*; Study matters loses *Requests* and
*Next degree* (a card on its overview); *Study plans* moves from Campus › Information to Grades & credits, next to
*What's left* (both answer "what does my programme require").

## 2. Page anatomy

Every page, InSIS's or InSIS+'s, is built from the same parts, in this order:

1. **Header** (top bar): eyebrow (the section), title (the page in the student's words, not InSIS's breadcrumb),
   page actions on the right (at most two, e.g. *Export*, *Change criteria*).
2. **View tabs**, only when rule 1 allows.
3. **Summary**: what the student came for, as facts (KPIs, a status line, a highlighted next item). Never a
   repeat of the navigation.
4. **Content**: the data as InSIS+ components (lists, cards, tables with a header row and readable cells, description
   lists for key–value pairs, empty states that say what to do).
5. **Rail** (wide screens): related context (the week, deadlines, contacts), never the main content.
6. **InSIS's own form**, when the page holds an action: InSIS's form element itself, slotted (never copied, never
   submitted by InSIS+), styled as a form card, with one line above it saying what it does and what happens when
   the student presses InSIS's button.

Never on a page: InSIS's breadcrumbs, InSIS's page heading (the header has it), the portal bar, InSIS's icon
images used as decoration, layout tables, InSIS's help paragraphs repeated word for word (shortened into the line
above the form or a gloss), empty InSIS sections, "back" links (the sidebar and browser do that).

## 3. Treatments

| Code | Treatment | When |
|---|---|---|
| **C** | Composed: an InSIS+ page from data read from InSIS | Home, My courses, Materials, the course page, overviews, Notifications, settings |
| **R** | Rebuilt: the InSIS page is read and drawn again with InSIS+ components; the original is hidden; links are the originals (URL rule) | pages that show information |
| **F** | Form page: header, a summary of what is there, InSIS's form slotted as a form card, InSIS's result table rebuilt | pages whose point is one action (excuse note, bank account, ID card validity, thesis topic) |
| **L** | List with actions: the list is rebuilt for reading; each row's action is InSIS's own control or link, kept in place | exam dates, submissions, registration, mail |
| **G** | Generic: InSIS's content with the shared component styles, portal bar and decoration removed | only the exceptions in §6 |

## 4. Inventory

One row per page type a student meets (from `mapping.json`). *Now* is the state before this document:
**M** = own module, **S** = generic shell only, **–** = not built. Snapshot: **✓** in `test/fixtures/private/`,
**crawl** = only the crawl's structure, **–** = needs a snapshot (collected read-only while logged in).

*(filled in per destination below; teardowns in §5)*

## 5. Teardowns

*(per destination, below)*

## 6. Exceptions (G)

Pages that stay InSIS's content in the shared styles, and why:

- Never touched (`docs/pages.md`): logout, password change, change of identity; PDF and print outputs, pop-up
  windows and frames.
- All services › rare tools used by staff or almost never by students: science and research (`vv/…`), statistics,
  system and licence information, the game room, InSIS documentation pages (`dok/…` except Help's front page).
- Pages InSIS+ never opens (`read: never` and `link: insis-only`), e.g. a questionnaire being filled in.

## 7. Review history

*(rounds below)*
