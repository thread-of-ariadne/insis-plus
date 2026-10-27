# InSIS+: page by page (draft 2)

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
   tabs). Places are never tabs. One exception, on baseline (B) pages only: where InSIS itself has a second row of
   sub-views inside a view (Settings › Personal page › three sub-views), that row is drawn as a small segmented
   choice under the tabs, because InSIS's links cannot be merged into one row without moving them.
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
action of My week); Exams shows *Exam dates* (four views) and *Online tests*; Study matters loses *Next degree* (never
read: a card on its overview) and keeps *Requests*, whose page is the Contact centre's list of request forms
(interruption, recognition, transfers, scholarships); *Study plans* moves from Campus › Information to Grades &
credits, next to *What's left* (both answer "what does my programme require"). *Who to ask* has one home, Campus ›
Contacts; Help links to it.

6. **Top-bar places** (Messages, Account, Help) are not destinations: while the student is in one, the sidebar shows
   its sections in a block above the destinations.
7. **Titles**: on a section's own page the title is the section's label and the eyebrow is the destination; on a
   page below a section (a person, a folder, a box, a step) the title is that thing and the eyebrow is the section.
   View tabs name the views, never repeat the title.
8. **Empty views**: a view of the student's own list that is empty right now stays, with 0 (*My dates 0*); a view
   whose source cannot have data for this student (no submission boxes in a course, no teaching-weeks data) is
   hidden.

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

**States** every page uses the same way (shared components, never invented per page): *loading* (first read
running), *not checked yet* (the source was never read: says which page to open), *stale* (shows the time it was
last checked), *failed* (says so and links InSIS's page), *session expired* (one notice: log in again), *empty*
(says what it means and what to do), *unmatched* (a record InSIS+ could not tie to a course: shown under "Not
matched", never dropped).

**InSIS's filter forms** (Restrict, Filter, Search within a list) are slotted whole, collapsed under *Filter*, never
removed or trimmed; an active InSIS filter shows as "Showing only … · Show all" (the link InSIS gives).

**Moving InSIS's elements** (safety review): an InSIS element may be moved into an InSIS+ row only if it is a link
(`a` with an http(s) address), outside any form, without `on…` attributes or an `id` InSIS's scripts use, and its
address passes the URL rule; it is put back in Classic view. Everything else (form controls, links inside forms,
action links: generating a document, opening a stored document, filling in a questionnaire, removing an
authorisation) stays where InSIS put it, inside the slotted original, styled in place with CSS and `data-` attributes
only. A table that holds form controls is treatment L *in place*: its summary is drawn above it, its rows are styled
(cards on phones) and never rebuilt, reordered or wrapped.

**What a background read may do**: fetch the page as text and parse it (no script runs, nothing else loads); only
with the student's current study and period values (another value may switch InSIS's working period); a list InSIS
shows filtered is not used for To do or Notifications; every new kind of data says its key and shape and is session
data (local storage keeps only settings).

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
| **B** | Baseline: InSIS's content under an InSIS+ header (title by rule 7); portal bar, breadcrumbs, InSIS heading, help paragraphs and legends removed; tables, forms and tab rows in the shared component styles; InSIS's own tab row as view tabs | rare pages (staff tools, deep drill-downs, settings that affect only classic InSIS), until use shows they need more |
| **G** | Generic: as B, for pages that must keep InSIS's exact wording or are never read | only the exceptions in §6 |

## 4. Inventory and teardowns

Per destination, with the treatment of every page type, its teardown and what needs a fresh snapshot:

- Courses and the course page: `teardowns/courses.md`
- Exams, Grades & credits, Schedule: `teardowns/exams-grades-schedule.md`
- Study matters: `teardowns/study-matters.md`
- Campus & people, Messages, Help, Account, All services: `teardowns/campus-messages-account.md`

Where a teardown and §7 (review decisions) disagree, §7 wins. Rare pages a teardown rebuilds in full (access system,
department detail views, pass rates levels 2–4, study plans drill-down, e-library item pages, rooms below the
building, account device pages) start as **B**.

## 5. Build order

1. Contradictions in the current code (done in round 1: Requests, titles, signposts, sidebar blocks, portal bar).
2. Baseline (B) for every page still in the generic shell: titles by rule 7, portal bar and InSIS chrome removed,
   InSIS's tab row as view tabs, filter forms collapsed.
3. Exam dates (L): summary, view tabs, rows in place; snapshot as soon as dates open (November).
4. The course folder (`dok_server/slozka.pl`, L): needs a snapshot.
5. Submission box page and Online tests.
6. Confirmations (*Get a confirmation*, InSIS's own links styled in place).
7. Results (four view tabs) and What's left (the 835 kB page, parsed once with `textContent`).
8. Course evaluation (before December), Registration overview (before January).
9. InSIS mail, Requests / Contact centre, Who to ask.
10. Everything else, by frequency.

**Status (2026-10-24):** steps 1–10 are built and checked against 207 logged-in snapshots (113 addresses), in
English and, where a snapshot exists, Czech, at 1300 px and 375 px: every page has its own module except the §6
exceptions. Not yet seen with real data, so written from InSIS's markup and checked with made-up rows: open exam
sign-up, an open submission box, a topic group open for sign-up, a registration round, Mail settings other than
Forwarding, a person's tabs other than Contacts. Exam dates' summary gets a fresh snapshot when dates open.

## 6. Exceptions (G)

Pages that stay InSIS's content in the shared styles, and why:

- Never touched (`docs/pages.md`): logout, password change, change of identity; PDF and print outputs, pop-up
  windows and frames.
- All services › rare tools used by staff or almost never by students: science and research (`vv/…`), statistics,
  system and licence information, the game room, InSIS documentation pages (`dok/…` except Help's front page).
- Pages InSIS+ never opens (`read: never` and `link: insis-only`), e.g. a questionnaire being filled in.

## 7. Review history and decisions

**Round 1 (2026-10-24)**: two independent reviews of the four teardowns, UX/IA and safety/feasibility. Decisions
adopted (they override the teardowns):

1. Requests is a section (Contact centre's request forms, `kc/kc.pl`); Help's *Ask a question* opens it; the
   overview card keeps only Next degree.
2. Who to ask: Campus › Contacts only.
3. e-library: Courses › Materials, as a link card; Library links to it; never a tab.
4. Thesis topics: node `studies.thesis`, view tabs *Faculty topics · Department topics*; *Propose a topic* is a page
   action; the department page links to its topics. Theses archive stays in Campus › Information.
5. Registration overview: composed page with live state on every step (open now / opens on / closed).
6. Course › Points: InSIS's result with the attempt (link to Results), then the points of regular assessment
   themselves (InSIS's points page of the course, `list.pl …;prubezne=1`, read when the tab opens; the same view
   on that InSIS page, which is drawn as the course's Points tab); while the course is not passed, one line with
   Exam dates and Online tests. No cards that only point elsewhere. Grades & credits opens a course here.
7. Excuse notes: no "Absent?" link in My week; gloss "Your excuse notes" until the add form is seen.
8. Rules 6–8 of §1 (top-bar places, titles, empty views), the States, filter-form, moving and background-read rules
   of §2, treatment B of §3.
9. Overviews of destinations show facts only (a section appears there only with a live fact); Help, Account and All
   services are indexes by nature.
10. Safety, done in round 1: background reads parse fetched text (no InSIS script, no analytics); local storage keeps
    settings only; pages with credentials or sensitive personal data are `read: never` (app pairing, personal data
    check, bank accounts, card passes, operations log), settings pages too; delivered documents only on open; the
    contact centre's form pages are never fetched; the action-parameter deny list is extended and case-insensitive.
11. Still open, need snapshots: everything listed under "needs a snapshot" in the teardowns; the effect of viewing the
    delivered-documents list; whether opening a contact-centre form page creates a draft; how InSIS marks an active
    exam-list filter.
