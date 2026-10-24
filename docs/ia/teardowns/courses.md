# Courses and the course page: page teardowns (draft 1)

Scope: every page type in `mapping.json` whose node (or a `variants` value) starts with `courses.` or `course.`,
plus the composed pages of the destination (My courses, Materials, the course page). Rules applied:
`03-pages.md` §1 (navigation rules 1–5), §2 (page anatomy), §3 (treatments C/R/F/L/G); `02-redesign.md` §1
principle 7 (InSIS performs every action on its own page, by the student's own click; InSIS+ never submits, fills
in, pre-filters or moves a form) and §3 *Courses*.

Evidence: the crawl (`test/fixtures/private/map/crawl.json`, filtered by route), the logged-in snapshots in
`test/fixtures/private/`, the public fixtures `test/fixtures/catalog-*.html` and `syllabus-*.html`, and the current
code (`course.js`, `composed.js`, `catalog.js`, `syllabus.js`, `pages/docserver.js`, `pages/submissions.js`,
`pages/study-record.js`, `generic.js` / `generic.css`). Structure only: no names, results, counts or course codes
of the student are quoted; `<CODE>` stands for a course code.

Conventions used in every teardown:

- **Header** = InSIS+ top bar: eyebrow (section), title, chips, at most two page actions.
- **"InSIS's own link / control"** = the original element of the InSIS page, adopted into the rebuilt row (the
  same DOM node, not a copy) when it is a link; when it is a form control (checkbox, radio, select, submit), the
  control does not move: its InSIS form is slotted whole as a form card (the `L` rule cannot move inputs, see
  `02-redesign.md` §2 "inputs … are never hidden or moved").
- **Always removed** (§2 "never on a page"): breadcrumbs, `#titulek` heading, the study/period line ("<programme>
  [term N] · <period>") when the header already shows it, the portal bar (11 links, present on 8 of the page types
  below), decoration icons, InSIS's help paragraph (shortened into the line above a form or a gloss), the "Key
  (click to show/hide)" legends (turned into an inline legend only where icons carry meaning).

## 1. Inventory

*Now*: **M** = own module, **S** = generic shell only (`generic.js`: `#str1` slotted with `generic.css`), **–** = not
built. *Snapshot*: file in `test/fixtures/private/` unless noted, **crawl** = only the crawl's structure, **–** = none.

| Page type (path) | Node | Now | Snapshot | Treatment | Reason |
|---|---|---|---|---|---|
| `#ipx:courses.mine` | courses.mine | M (`course.js`) | – (composed) | C | the destination's landing: one card per course, the most used entry into a course |
| `#ipx:course.<tab>/<CODE>` (5 tabs) | course.overview … course.people | M (`course.js`) | – (composed) | C | principle 3: the course is a page composed from ~10 InSIS pages |
| `#ipx:courses.files` | courses.files | M (`course.js`) | – (composed) | C | "files of my courses" is the most frequent job in the destination |
| `#ipx:courses.registration` (new) | courses.registration | – (entry is `registrace.pl` in the shell) | – (composed) | C | rule 2: a section with several InSIS step pages needs an overview with live dates, not a link page |
| `/auth/dok_server/` (`index.pl`) | courses.files | M (`pages/docserver.js`) | ✓ `docserver.html`, `docserver-cs.html` | R | an information page (no forms): the whole folder tree |
| `/auth/dok_server/nove_dok.pl` | courses.files | M (`pages/docserver.js`) | ✓ `docserver-new.html`, `docserver-new-cs.html` | L | a list of new files whose only action (mark as read) is InSIS's form |
| `/auth/dok_server/slozka.pl` | courses.files (also course.files) | S | – | L | the course folder itself: files with InSIS's download links; the most opened page of the destination and the one still shown as an overlay |
| `/auth/dok_server/vyhledavani.pl` | courses.files | S | crawl | F | one action (search) with a result table |
| `/auth/dok_server/nastaveni_stromu.pl` | courses.files | S | crawl | F | one action (save settings) |
| `/auth/dok_server/moje_dok.pl` | courses.files | S | crawl | R | a list (my folders, copies, ignored folders), usually empty for students |
| `/auth/eknihovna/` and `strom_slozek.pl` | courses.files (also campus.library) | S | ✓ `ematerials.html` | R | a folder list, no forms |
| `/auth/eknihovna/slozky_objekty.pl` (list and item detail) | courses.files | S | crawl | R | a list of e-materials with a sort/filter form, and a detail page |
| `/auth/eknihovna/vyhledavani.pl` | courses.files | S | crawl | F | one action (search) |
| `/auth/eknihovna/opory/` | courses.files | S (when the student opens it) | – | G | `read: never`, `link: insis-only`, `verify`: opening one e-material; exception §6 |
| `/auth/student/odevzdavarny.pl` | courses.submissions (variant `predmet=mine` → course.submissions) | M (`pages/submissions.js`) | ✓ `submissions.html`, `-open`, `-empty`, `-clock`, `-cs`, `-cs-real` | L | a list of boxes whose action (Insert files) is InSIS's own link |
| `/auth/student/odevzdavarny_odevzdani.pl` | course.submissions | S | crawl | F | one action (upload a file into one box) |
| `/auth/student/temata_prihlasovani.pl` | courses.submissions (also course.submissions) | S | crawl | L | a list of topic groups whose action (register for a topic) is InSIS's |
| `/auth/student/registrace.pl` | courses.registration | S | crawl | L (R outside a round) | registration rows carry InSIS's controls during a round; outside a round it is information |
| `/auth/student/mimosemestr_zapis.pl` | courses.registration | S | crawl | L | a course list with InSIS's own selection checkboxes and a pay-and-enrol button |
| `/auth/student/vs_registrace.pl` | courses.registration | S | crawl | R | a catalogue of minor tracks; registering is not offered outside its period |
| `/auth/student/oblibene_predmety.pl` | courses.registration | S | crawl (empty) | R | a planning list |
| `/auth/student/reg_stat_tridy.pl` | courses.registration | S | crawl | R | statistics; its only form is a filter, slotted |
| `/auth/studijni/reg_stat_tridy.pl` | courses.registration | S | crawl | R | the same statistics at a second address (one job, one rendering: §3) |
| `/auth/katalog/` | courses.catalogue | M (`catalog.js`) | ✓ `test/fixtures/catalog-en.html`, `catalog-cs.html` | F | one action (search) with a result list |
| `/auth/katalog/syllabus.pl` | courses.catalogue (variant `predmet=mine` → course.syllabus) | M (`syllabus.js`) | ✓ `test/fixtures/syllabus-en.html`, `syllabus-cs.html` | R | information; one output-format form slotted at the end |
| `/auth/student/hodnoceni.pl` | courses.catalogue (also course.syllabus) | M (level 1 only, `pages/study-record.js`); S (levels 2–4) | ✓ `attainment.html`, `attainment-cs.html` (level 1); crawl (2–4) | R | four levels of drill-down information, no forms |
| `/auth/student/list.pl` | course.points (variant `no predmet` → courses.mine) | S | crawl | R (overview: L) | points so far per course; the overview holds InSIS's notification switches (GET action links) |
| `/auth/student/spoluzaci.pl` | course.people (variant `no predmet` → courses.mine) | S | crawl | R | classmates and seminar groups; the group-e-mail and photo buttons are InSIS's form, slotted |
| `/auth/elis/student/seznam_osnov.pl` | course.overview (variant `no predmet` → courses.mine) | S | crawl (empty) | R | weekly e-plans, information |
| `/auth/anketky/dotazniky.pl` | courses.evaluation | S | ✓ `surveys.html` | L | a list of questionnaires; "Fill in" is InSIS's own link to an `insis-only` page |
| `/auth/anketky/dotaznik.pl` | courses.evaluation | S | – (never opened) | G | the questionnaire itself: `read: never`, `link: insis-only`; exception §6 |

Counted: 28 InSIS page types (two e-library paths share one row) and 4 composed pages; 2 G exceptions, both
`insis-only`. 22 page types are shell-only today (plus levels 2–4 of `hodnoceni.pl`): they are the "overlay" the
user complained about. Apart from the 2 G exceptions, each gets an R, L or F treatment below.

## 2. Teardowns

### 2.1 Course page (`#ipx:course.<tab>/<CODE>`, C)

**Purpose.** Everything about one course in one place: files (several times a week in the semester), deadlines
(weekly), points and result (weekly near the end), classmates and teachers (occasionally). Entered from the course
card on Home, My courses, Materials and from search.

**Sources** (all matched by exact code or by the `predmet` parameter of an InSIS link): study record
(`pruchod_studiem.pl`, background), personal timetable (`rozvrhy_view.pl`, background), document server tree
(`dok_server/`, background), submissions (`odevzdavarny.pl`, background), topics (`temata_prihlasovani.pl`,
background), exam dates (`terminy_seznam.pl`, background), online tests (`psani_testu.pl`, background); read
on-open: the syllabus (`syllabus.pl`), classmates (`spoluzaci.pl`), teachers (`lide/clovek.pl`), lectures sheet
(`list.pl`, only after `verify_data` clears), e-plans (`seznam_osnov.pl`).

**What is wrong now** (`course.js`):

1. The *Points* tab is a list of links to Exam dates, Results and Online tests, none filtered to the course: a
   repeat of the navigation, which §2 forbids in the summary and which leaves the student to find the course
   again. It shows only the course status and InSIS's result text.
2. *Submissions* rows are plain `div`s: the box's InSIS page (`href`, already stored) is not linked, so the row
   whose whole point is "hand in" is a dead end.
3. Teachers appear twice: in the embedded syllabus rail on *Overview* and on *People*; neither has the e-mail
   address, office hours or InSIS's compose link that `02-redesign.md` §3 promises.
4. The links to the full syllabus and the lectures sheet sit at the bottom of *Overview* only; on other tabs the
   student has no way to InSIS's course pages except the sidebar.
5. Classmates are a bare list of names (first page) with no count, no seminar group, no filter.
6. `course.syllabus` is in `nav.js`'s composed set but has no renderer: any link to it shows "being built" (a dead
   end in waiting).
7. No summary: the facts of the course card (next class, next deadline, new files, result) are not on the course
   page itself.

**Rebuild.**

- **Header**: eyebrow *Courses*; title = the course name in the page language (the syllabus has both names); chips
  `<CODE> · faculty · N ECTS · status` (In progress / Passed / Not passed, from the study record). Page actions:
  **Course folder** (InSIS's folder link from the tree; the most frequent job, so it is one click from every tab) and
  **Full syllabus** (InSIS's syllabus page). *Why*: two stable actions visible on every tab beat per-tab footers
  (Fitts, recognition over recall).
- **View tabs** (rule 1 allows: views of one course): Overview · Materials · Submissions · Points · People. Only
  *Submissions* may be hidden, and only when fresh data says the course has no box and no topic group;
  the other four always exist (a stable tab row; NN/g: do not shift tab positions).
- **Summary** (one status line under the tabs, the same on every tab): next class (day, time, room → room page),
  next deadline (countdown, → the box page), new files (count → *Materials* tab), result (InSIS's text) once
  entered. *Why*: the student lands here from a card that showed these facts; the page must not lose them.
- **Overview** content: the syllabus, embedded (`syllabus.js` with `embedded: true`): KPIs (ECTS with workload,
  completion, language, teaching per week, semester), then a jump row and the sections (aims, learning outcomes,
  contents, literature); assessment and workload as the two charts. The syllabus timetable table (all parallel
  classes of the course) goes into a closed `<details>` "All classes of this course" (the student's own classes are
  in the rail). The weekly e-plan, when `seznam_osnov.pl` has one for the course, becomes a "Week by week" section
  (hidden when absent). Rail: *Next classes* (3), *What is coming* (To do items of the course), *Online test open*
  (matched by code, → InSIS's test list), *Course evaluation open* (→ InSIS's questionnaire list, never the
  questionnaire), *Teachers* as names only with "Contacts → People". The lecturers card of the embedded
  syllabus is dropped (one place for contacts: People).
- **Materials** content: the course folder from the cached tree, regrouped the way students think of it: *From
  your teachers* (the "Teachers" subfolders) and *By class* (the "On-site classes" subfolders: lecture, seminar),
  each folder a row with file count and new count; folders with no files fold into "N empty folders". Every row
  opens the folder in InSIS on the student's click. Footer line: "Some teachers use Moodle" with the Moodle link
  from `external`. Empty state when no folder matched: "No folder for <CODE> on the document server. → All
  folders".
- **Submissions** content: this course's boxes, soonest deadline first, each row an anchor to the box page
  (`odevzdavarny_odevzdani.pl`), with type (individual / group; for group boxes "a teammate's upload counts"),
  state, countdown and file count; then this course's topic groups (from `temata_prihlasovani.pl`, matched by the
  course code in the row) with "Register until" and InSIS's topic page link. Footer: "All submissions →".
- **Points** content, in order: (1) *Result*: InSIS's text and the attempts (from the study record); (2) *Points so
  far*: once `list.pl`'s `verify_data` is cleared, the lectures sheet grid of this course rebuilt as a table
  (groupings × dates, InSIS's own *Total* text, never a sum computed by InSIS+); until then one card "Your points
  are in InSIS's lectures sheet" linking to it; (3) *Exam dates*: this course's rows from the exam list (date,
  type, places, register until, "registered" / "open" / "not open yet"), each opening InSIS's exam list with the
  course highlighted (Exams treatment; no sign-up here); (4) *Online tests* of this course. Rail: this semester's
  exam period dates. *Why*: "did I pass / how am I doing in this course" is one question; answering it with links
  to three lists is what InSIS already does.
- **People** content: *Teachers* from the syllabus lecturers (role from the syllabus); when the tab opens, each
  lecturer's `clovek.pl` is read (on-open, at most the syllabus lecturers) for e-mail address, office hours and
  InSIS's compose link: e-mail opens the student's mail app ("teachers read their university e-mail"), *Write in
  InSIS* is InSIS's own compose link copied from that page. *Your seminar*: the student's group(s) from
  `spoluzaci.pl` (overview row of this course: Seminar column) with the group's student count. *Classmates*:
  first page of the course list (40 names, a local filter field, "N students"), each name → the person's page;
  "Full list, photos and group e-mail in InSIS →" opens `spoluzaci.pl` for the seminar group, where InSIS's own
  buttons are. Names are never stored (`02-redesign.md` principle 8).
- **InSIS forms**: none on the composed page; every action opens the InSIS page that holds it.

**Data to parse**: covered by the source modules; new parsing needed for `clovek.pl` (e-mail, office hours, compose
link), `spoluzaci.pl` overview (Code | Course | Seminar | Students and its four links per row), `list.pl` per
course (the grouping table, header row = dates, last column *Total*), `seznam_osnov.pl` (structure unknown).

**Safety**: `list.pl` stays link-only until a snapshot shows that reading it marks nothing as seen; its
`email_on` links are never built or followed. `slozka.pl`, `nova_zprava.pl`, `dotaznik.pl` are links only
(`read: never`). Classmates are read only when People opens (on-open), first page only.

**Open questions**: does `clovek.pl` carry office hours for teachers (campus.people snapshot); `list.pl` with
points entered; `seznam_osnov.pl` with a plan; whether a group box's InSIS page states the group members.

**Fix outside this page**: drop `course.syllabus` from the composed set (or alias it to `course.overview`); the
node stays only for highlighting the sidebar on InSIS's syllabus page of a course of mine.

### 2.2 My courses (`#ipx:courses.mine`, C) and the three "all my courses" InSIS lists

**Purpose.** The way into each course (daily); past periods for old classmates and files (rarely).

**What is wrong now**: no period switch (the design's "local period switch"), so a past period's course page is
unreachable from here (a dead end for "where were last year's slides"); the page has a hint line and cards but no
summary; InSIS's notification settings for the lectures sheet (the only place to switch course e-mails on) are
reachable only through Classic view.

**Rebuild (C).** Header: *My courses*, period as a chip; page actions: **Period** (a local select of the periods
the study record lists; past periods read on-open from `pruchod_studiem.pl?obdobi,studium`) and **E-mail
notifications** (→ `list.pl?obdobi,studium`, InSIS's lectures sheet, where the switches are). No view tabs. Summary:
"N courses · N ECTS · next class … · next deadline …". Content: the shared course cards, ongoing first, finished
under "Finished (N)". No rail (Home has the week). Empty state: "Your enrolled courses have not loaded yet — they
come from your study record" with the link to Grades & credits › Results.

**The three InSIS lists that map here** (variants without `predmet`). They are views of "my courses" cut by one
facet; per rule 4 they get no sidebar entry and no tab, and are rebuilt so that each row leads into the course page:

| Page | On the InSIS page (crawl) | Rebuild |
|---|---|---|
| `spoluzaci.pl?obdobi,studium` ("My schoolmates") | portal bar; table Code · Course · Seminar · Students; per row links: syllabus, all students, from teacher, from seminar, send an e-mail | R. Header *Classmates* (eyebrow My courses). One row per course: name → course page *People* tab, the seminar group(s) as chips, student counts, InSIS's own "from seminar" / "from teacher" links. The "send an e-mail" link (`spoluzaci.pl?email,…`) is kept only as InSIS's own adopted link. |
| `list.pl?obdobi,studium` ("My lectures sheet") | portal bar; table Course · Timetable item · Actions · Settings; per row: syllabus, course folder (`slozka.pl`), the course's sheet (`list.pl?…prubezne`), and the notification switch (`list.pl?email_on,…`) | L. Header *Lectures sheets and notifications*. One row per course: name → course page *Points* tab; timetable item; InSIS's own folder and sheet links; the **Settings** cell stays InSIS's own link in place, with a one-line gloss above the list: "E-mail notifications per course: switch them in the last column; InSIS saves the change when you click." |
| `seznam_osnov.pl?obdobi,studium` ("Course e-plans") | portal bar; heading "eLearning plans"; empty for this account | R. Header *Week-by-week plans*. One row per course with a plan → course page *Overview* (Week by week). Empty state: "None of your courses has a weekly plan in InSIS this period; teachers who use one publish it here." |

**Safety**: `email_on` is on the action deny list: never fetched, never built, only InSIS's own link on its page.
`spoluzaci.pl?email,…` is not in any allowed set: InSIS's own link only.

**Open questions**: HTML of all three pages (crawl only); `seznam_osnov.pl` with a plan; the exact markup of the
Settings cell (link vs. icon, on/off state).

### 2.3 Materials (`#ipx:courses.files`, C) and the document server

**Purpose.** Get this week's slides and assignments (several times a week); see what is new (daily in the semester).

**What is wrong (InSIS)**: one tree of every folder the student may read (faculty boards, rectorate, senate, sports,
old years) with the student's four courses buried three levels down ("Faculty › Courses › <period> › <CODE> ›
On-site classes / Teachers"); new-file counts as "(new/all)" text and bold names; the tab row mixes views (tree, new,
search) with a settings form and a rarely used "All my folders" that has a second tab row of its own.

**What is wrong (InSIS+ now)**: four surfaces answer "what is new": Home's *New materials*, the chips on Materials,
the tree page's *Where the news is* rail and InSIS's *New documents* (rule 4). The InSIS views are a text line at
the bottom of Materials ("Document server in InSIS: …"), not the same tab row as on the document server pages,
so Materials and the document server feel like two places. `slozka.pl`, `vyhledavani.pl`, `nastaveni_stromu.pl`,
`moje_dok.pl` and the e-library are shell-only.

**One tab row for the whole section** (rule 1: views of one thing, the course files): **By course** (composed) ·
**New (N)** (`nove_dok.pl`) · **All folders** (`dok_server/`) · **Search** (`vyhledavani.pl`). The same row on all
four pages. *DS settings* and *All my folders* leave the row and become the two page actions **Settings** and
**My folders** on these four pages (a form and a rarely used list are not views). The e-library is a different
tool (public study materials from departments): a link card on *By course*, never a tab.

#### By course (C)
Header *Materials*; page actions Settings, My folders. Summary: "N new files in M courses · checked HH:MM" (one
line; the tab already carries the count). Content: one card per course of the period (the shared course card
header) with the folder groups of §2.1 (*From your teachers*, *By class*), first level only, each row → the folder
in InSIS; the course name → the course page *Materials* tab; "N new" chip → *New* tab. After the courses: *Other
folders you follow* (top-level tree folders that are not courses and have new files, e.g. a faculty noticeboard)
as rows; then two cards: **e-library** ("study materials published by departments") and **Moodle**. No rail.

#### All folders (`dok_server/`, R; now M)
On the InSIS page: tab row; help paragraph; `div.tree` of `li > .node-container > .node-label > a` with "(n)" or
"(new/n)"; quota table (quota, occupied, free); rights key. Rebuild: keep the current filterable, collapsible tree
and the pointer card to *By course*; **remove the *Where the news is* rail** (the *New* tab is the one place for
that job); quota becomes one muted line under the tree; the help paragraph and the rights key go. Data: as parsed
now (`readNodes`, course folders by `CODE_RE`); it remains the background source of the course trees.

#### New (`nove_dok.pl`, L; now M)
On the InSIS page: table Sel. · Folder · Name · Comments · Entered by · Entered on · Display · Attachment inside
the form `nove_dok.pl` with checkboxes `oznacene` and two submits (*Mark the selected items as read*, *Mark all
items as read*). Keep the current rebuild (cards per course, rows with type, name → file, folder, author, date,
info link) and the 3 KPIs. The InSIS form card stays behind "Show the form" with its line: "Opening a document
marks it as read. To mark several at once, tick them in InSIS's list and press InSIS's button." The original table
inside the form is the form (its checkboxes cannot move), so it is the form card's content, not a duplicate.
Safety: `read: never`, never fetched in the background; the bell uses Home's counter.

#### Folder (`slozka.pl`, L; now S)
Purpose: the page the student actually opens every time (from the course page, Materials, Home). Expected content
(unverified): folder title, subfolder list, a file table with InSIS's download and info links, possibly
subscription or upload controls. Rebuild: header title = folder name, eyebrow *Materials*, chip = course code when
the folder is inside a course (from `ipx.state.docserver.folders`); page action **Course page** for a course
folder. Content: subfolders as rows (count, new), then files as rows (type badge, name → InSIS's own download link,
comment, author, date, "new" marker as InSIS shows it), newest first; any InSIS form (upload, subscribe) slotted
as a form card at the end with one line. Safety: `read: never` — rendered only from the page the student opened;
never fetched; never followed for subfolders. **Needs a snapshot first** (taken by the student's own click).

#### Search (`vyhledavani.pl`, F; now S)
On the InSIS page: form with *text*, *entered by* (with its own lookup submit), *from* / *to* dates, *attachment*
select, *folder* select, *Search*. Rebuild: header *Search files*; the InSIS form slotted as a search card with
one line: "Search the document server; InSIS runs the search when you press Search." The folder select is long:
InSIS's own control, styled, not replaced. Results (after InSIS's submit): rebuilt like the *New* rows. Open: the
results markup (needs a snapshot after a search the student runs).

#### Settings (`nastaveni_stromu.pl`, F; now S) and My folders (`moje_dok.pl`, R; now S)
Settings: form card with page size, info-e-mail choice, notification radios, tree start folder, *Save changes*;
line: "Choose how many documents a page shows, whether InSIS e-mails you about new documents, and where the tree
starts. InSIS saves them when you press Save changes." My folders: its own sub-views (My folders · Copy folders ·
Ignored folders · My documents) become the page's one view-tab row (the section row is not shown on this page;
the sidebar leads back); table Name · Enter folder rebuilt as rows; empty state "You have no folders of your own.
Folders you create or ignore in InSIS appear here."

#### e-library (`eknihovna/`, `strom_slozek.pl`, `slozky_objekty.pl`, `vyhledavani.pl`; R / R / F; now S)
InSIS: tab row *Tree of folders · Contents of folder · Searching*; the tree is a flat list of folders with
"(N objects)"; *Contents of folder* is a list with a sort/limit form (`omezit`, `seradit`, *Go*) and an item detail
(Name, English name, Administrator, Filed, Released for, link to `opory/`). Rebuild: header *e-library*, eyebrow
*Materials*. View tabs: **Folders** · **Search** only ("Contents of folder" is a level reached by clicking a folder,
not a view). Folders: rows with object count. Folder contents: header title = folder name; InSIS's sort/limit form
slotted as a compact toolbar card above the list; objects as rows (name, type, date) → detail. Detail: description
list; the "open" link stays InSIS's own adopted link (`opory/` is `insis-only`, `verify`). Search: F card. Open:
HTML of contents, detail and search results (crawl only).

### 2.4 All submissions (`odevzdavarny.pl`, L; now M), the box page and topics

**Purpose.** Hand in coursework before the deadline (weekly in the semester, most often from a To do item).

**On the InSIS page** (snapshots): portal bar; study/period line; three tables marked by decoration icons: *Where I
can submit my papers* (… Number of files · Instructions · Put up by · **Insert files**), *Coursework submissions
with submitted files* (… Open · Points · Display files), *Where I cannot submit my papers* (… Display files);
columns Course title · Name · Type · Announced for · Since · Until · Topic · Details.

**Now**: a good rebuild (KPIs, Due soon / Later / Not open yet / Closed, week strip, next deadlines, by course,
"How to submit"). Wrong: the `predmet` variant (from InSIS links of one course) shows all boxes without saying it is
filtered; the topic sign-ups, which precede a project, are invisible here; the rail has four blocks (week strip,
next deadlines, by course, how to) where the main column already sorts by deadline, so *Next deadline* is said three
times (KPI, rail, first group).

**Rebuild.** Header *All submissions*, period chip. No view tabs. Summary: keep the 4 KPIs (open, due within 7
days with "N to do", submitted of N, next deadline). Content: the groups as now; each row's actions are InSIS's own
links (Insert files primary when open; Display files, Instructions, Details). New block **Topic sign-ups** above the
groups when `temata_prihlasovani.pl` has open groups: course, group, "register until", → the topics page. With
`predmet` in the URL: a filter line "Only <CODE> · Show all" (the show-all link is the page without `predmet`,
built from the allowed set `obdobi,studium`) and the course page chip. Rail: week strip and *By course* only (drop
*Next deadlines*: it repeats the KPI and the first group); the "How to submit" text moves to one line above the
list: "Files are uploaded on InSIS's page of each box: press Insert files."

**Safety**: no form on the page; `odevzdavarny_odevzdani.pl` opened by the student's click.

#### Box page (`odevzdavarny_odevzdani.pl`, F; now S)
On the InSIS page (crawl, a closed box): portal bar; heading "Individual coursework submission – <course>"; key–value
rows Name · Type · Status · Date of opening · Date of conclusion · Announced for · Coursework submission quota;
table *List of entered files* Name · File · Description · Size · Entered on · Entered by; two forms (empty while
closed); links to download a file (`…stahnuti…`) and to edit its description (`…popisek…`). Rebuild: header title =
box name, eyebrow *All submissions*, chips `<CODE>` · individual/group; page action **Course page**. Summary: status
line "Open until <day time> (in 2 days)" / "Closed on …", files handed in (N, "nothing handed in yet" in warning
tone while open), quota. Content: the key–value rows as a description list; *Your files* rows (name, size, date,
by; InSIS's own download and description links adopted). InSIS's upload form slotted as a form card with one line:
"Choose the file and press InSIS's button; the file is handed in when InSIS confirms it." Safety: `action:
unverified`; InSIS+ never touches the file input. **Needs a snapshot of an open box** (individual and group), and of
the confirmation after an upload.

#### Topics (`temata_prihlasovani.pl`, L; now S)
On the InSIS page: portal bar **and a second tab row** *Course topics · Final theses topics* (two rows of tabs,
rule 1); tables *Which topic(s) I am registered for*, *Which topic(s) I can register for*, *Rejections* (columns
Course title · Group of topics · Announced for · Register until · Number of topics · Topic · Put up by · Details).
Rebuild: header *Topic sign-ups*, eyebrow *All submissions*. No view tabs: *Final theses topics* is a place
(Study matters › Thesis & state exam) and is linked from there, not from here. Summary: "Registered: N · Open for
sign-up: N (closes …)". Content: *My topics* (course, group, topic, put up by), *Open for sign-up* sorted by
"register until" (countdown chip; InSIS's own register/detail link per row), *Rejections* collapsed. Rail: none.
Safety: register is `action: unverified`: only InSIS's own controls. Open: a snapshot while a group is open (where
the register control sits: in the row or on the detail page).

### 2.5 Registration & enrolment (`#ipx:courses.registration`, C) and its InSIS pages

**Purpose.** Twice a year, in rounds: wish for courses (registration), get confirmed places (enrolment), fix the
timetable afterwards; plus extra-semestral courses, minor tracks, favourites and enrolment statistics. Rare but
high-stakes; students need dates and order more than links.

**What is wrong now**: the section opens InSIS's `registrace.pl` in the shell, which outside a round shows only
"Enrolled courses in current period" and a table of rounds (Department · Study period · Beginning · End): the steps,
the other four pages and the explanations of the design are nowhere. Enrolment statistics exist at two addresses.

**Overview (C, new composed node)**. Header *Registration & enrolment*; page action **Academic calendar**. Summary:
the current or next round as a status line ("Registration round 2 is open until …" / "Next round opens …"), from
`harmonogram.pl` and `registrace.pl` (both background). Content: (1) *Rounds* as a timeline (registration → enrolment
→ changes), each with its dates and one plain sentence (*registration* = your wishes ranked by priority; *enrolment*
= confirmed places; *changes* after enrolment); (2) *Steps* as rows, each saying which period it works on: Course
registration (`registrace.pl`), Extra-semestral courses ("short courses outside the semester, usually paid"),
Minor tracks ("a specialisation you add to your study, often from another faculty"), Favourite courses ("a planning
list"), Enrolment statistics ("how full each class is"); (3) *Enrolled this period*: count and ECTS → My courses.
Rail: none. Needs: `courses.registration` added to the composed set and its `structure.entry` changed to the
composed page (mapping/nav change, outside this document).

#### Course registration (`registrace.pl`, L in a round / R outside; now S)
Outside a round (crawl): two tables, enrolled courses (Code · Course · Fac. · Oblg. · Com. · Crd. · Lang. · Group ·
Type · Timetable) and rounds. Rebuild R: header *Course registration*; summary "N courses · N ECTS enrolled; next
round …"; enrolled courses as rows (code, name → course page, credits, completion, group, timetable item); rounds
moved to the overview (one place), here one line → overview. In a round: InSIS's registration form slotted whole
as a form card (the wish list with its priority and add/remove controls), with the line "Your wishes are saved
when you press InSIS's button; places are decided when the round closes." Safety: `action: unverified`,
`verify_data` for results; no control is moved or pre-set. **Needs snapshots during a round and after its results.**

#### Extra-semestral courses (`mimosemestr_zapis.pl`, L; now S)
On the InSIS page (crawl): enrolled extra-semestral courses; a filter form (department, fee; *Restrict*); the main
form: table Sel. · Attr. · Code · Course · Study period · Com. · Crd. · Course supervisor · Institute · Limit · Sum ·
Approvals · Enrolment from / till · Teaching since / till · Note · Timetable with checkboxes `pridat_*` and the
submit **Add courses and pay online**; two information tables (list of extra-semestral courses; courses whose
enrolment is in progress) with a legend (enrolled / enrolment required / not possible). Rebuild: header
*Extra-semestral courses*; summary "Enrolled: N · open for enrolment now: N"; *Enrolled* as rows; the filter form
as a compact toolbar card; **the selection table stays InSIS's form card** (styled: sticky course column,
`data-label` cells, checkboxes untouched) with the line "Tick courses and press InSIS's button: InSIS enrols you
and opens the online payment." The two information tables rebuilt as one list with the legend's states as chips.
Safety: a payment action — InSIS+ never pre-ticks, never counts a price, never submits. Open: HTML snapshot (crawl
only); what the payment step opens.

#### Minor tracks (`vs_registrace.pl`, R; now S)
On the InSIS page (crawl): view tabs *Catalogue · Statistics of registrations* (views of one list: kept); a unit
select form (*Select*) and *Print brochure* (a print submit); table Code · Name · Department · Capacity · Vacancies ·
Information print; sort links (`order`); detail pages (track description, link to the study plan). Rebuild: header
*Minor tracks*; view tabs as InSIS's; summary "N tracks · N with vacancies"; the unit select as a toolbar card; rows
(code, name → detail, department, capacity, vacancies as a bar); *Print brochure* stays InSIS's form button in a
small card at the end. Detail: description list, link to the study plan. Safety: the `…tisk…` print links are
InSIS's own only. Open: a snapshot during the minor-track registration period (the register control).

#### Favourite courses (`oblibene_predmety.pl`, R; now S)
Crawl: empty (portal bar, heading only). Rebuild: header *Favourite courses*; rows (code, name → syllabus, period);
empty state: "No favourites yet. You can mark courses as favourites in InSIS while browsing them (to be confirmed
where)". Open: snapshot with favourites; where InSIS adds and removes them.

#### Enrolment statistics (`student/reg_stat_tridy.pl` and `studijni/reg_stat_tridy.pl`, R; now S)
InSIS: level 1 faculty picker; level 2 period table (Name · Beginning · End · Public period · Select); level 3 view
tabs *Registration – list of timetable items · Registration – course overview · Enrollment – list of timetable
items · Enrollment – course overview · Study – course overview* (views of one statistic: kept, labels shortened to
"Registration · classes", "Registration · courses", "Enrolment · classes", "Enrolment · courses", "Study ·
courses"), a filter form (form of study, department; *Zobrazit*) and the table Code · Course · Type of event · Day ·
Time · Room · Frequency · Teachers · Cap. · Cat. 1 · Cat. 2 · Cat. 3. Rebuild: picker as faculty cards (the same
component as the attainment picker, the student's faculty marked "yours"); periods as rows, newest first; the
statistics with the filter form as a toolbar card, rows with capacity vs. demand as a bar, **the student's own
courses first and highlighted** (matched by code), a local filter field. The `studijni/` address renders the same
way (one job, one rendering). Open: a snapshot during a round (the Cat. columns filled).

### 2.6 Catalogue: search, syllabus, pass rates

#### Search (`katalog/`, F; now M)
On the InSIS page: view tabs *Courses by their names · by departments · for foreigners · Extended search* (search
modes of one tool: kept); help paragraph; the form (`vzorek`, *Search*, 15 faculty and many period checkboxes);
results as `•` + link + " - period - faculty" lines (links carry InSIS's `zpet`). Now: `catalog.js` slots the whole
`#str1` with the shell styles, rebuilds the results into cards with period chips and hides the checkboxes behind
*Filters*. Wrong: the help paragraph, breadcrumb and InSIS heading stay; the tab row is InSIS's styled row, not
`ui.viewTabs`; nothing points to pass rates. Rebuild: header *Catalogue*; view tabs via `ui.viewTabs` (InSIS's links);
the InSIS form slotted as the search card (filters folded as now) with the line "Search any course of any period;
InSIS searches when you press Search"; results as now; rail: *Recently opened syllabi* (the cached `ipx.state.courses`,
newest 5) and a card **Pass rates** (→ `hodnoceni.pl`). Autofocus on the field only when it is empty (as now).

#### Syllabus (`syllabus.pl`, R; now M)
On the InSIS page: a tab row *Syllabus · Course syllabus · Czech · English* (two output types and two languages,
not views); a long label/value table; teaching-method, workload and assessment tables; the timetable of the course
(Day · Time · Room · Type of event · Frequency · Teacher · Capacity · Exceptions · Note); the programmes table
(Faculty · Programme/field code · Programme mode · Course group code · Study period); an output form (`vystup`
select, *Display*, two checkboxes to batch-process or store the syllabus). Now: a good rebuild (KPIs, sections,
charts, lecturers, details); wrong: a *back* link (forbidden), the output form is dropped (an InSIS action made
unreachable except through Classic view), the language switch sits in the content. Rebuild: header title = course
name, eyebrow *Catalogue* (or *Courses* when the course is mine), chips `code · faculty · period`; language as a
segmented control in the header (InSIS's own Czech/English links); page actions: **Course page** when the course is
mine (no automatic redirect: the student chose the InSIS page), else **Pass rates** (→ `hodnoceni.pl`). Content as
now; the course timetable as "When and where" rows (room → room page) in a closed `<details>` when long; the
programmes table as rows. At the end, the InSIS output form as a small form card: "PDF and other formats: choose
one and press Display (InSIS creates it)." Safety: `zprac_dok_uloziste…` stores a document in the student's
storage: InSIS's checkbox, never ticked by InSIS+.

#### Pass rates (`hodnoceni.pl`, R; now M for level 1, S below)
Purpose: before registration, "how hard is this course" (a few times a year). Levels (crawl): (1) faculty picker
`div.vyber-fakult a.fakulta`; (2) period table Name of period · Beginning · End · Choose (≈36 rows); (3) course list
Code · Course title · Course supervisor · Number of students · Choose (≈250 rows) with an A–Z row (`pismeno`) and
programme links; (4) one course: supervisor, mode of completion, table Term × 1 · 2 · 3 · 4+ · 4 · – · W · T with
rows *All exam sittings*, *Regular exam sitting*, *first resit*, …. Rebuild: header *Pass rates*, eyebrow
*Catalogue*, the chosen faculty/period as chips on lower levels (instead of breadcrumbs). Level 1 as now. Level 2:
periods grouped by academic year, newest first. Level 3: InSIS's A–Z links as a compact letter row, a local filter
field over the loaded rows, rows (code, name, students) → level 4, syllabus link per row. Level 4: summary
"Passed at first sitting: N %" only if InSIS states it, otherwise the grade distribution of *All exam sittings* as
a stacked bar (grades 1–4, "–", W, T with InSIS's own column labels explained in a legend) and the table below it.
Data: the level 4 table cells; percentages are drawn only from InSIS's numbers, never recomputed into a single
score. Open: HTML of levels 2–4 (crawl only), the meaning of W and T.

### 2.7 Course evaluation (`anketky/dotazniky.pl`, L; now S)

**Purpose.** Fill in the anonymous course questionnaires (twice a year, short window).

**On the InSIS page** (`surveys.html`): breadcrumb to My College; a long anonymity paragraph; table Code · Course
title · Part · Date of opening · Date of conclusion · Questionnaire; the last cell is an icon (`dotaznik-vyplneni`
= pending, a link to `dotaznik.pl`; `dotaznik-vyplneny` = filled; `dotaznik-sber-neprobiha` = not open) or text such
as "date of result entry"; a key legend.

**Rebuild.** Header *Course evaluation*, period chip. Summary: "N to fill in (closes …) · N done". One line instead
of the paragraph: "Answers are anonymous and cannot be changed once saved." Content: *To fill in* rows (course →
course page, part, closes with countdown, InSIS's own *Fill in* link adopted into the row as the primary control),
*Opens later* rows ("opens <date>" or "after your result is entered", InSIS's wording), *Done* rows collapsed. The
icon states become text chips (the legend is no longer needed). Rail: none. Safety: `dotaznik.pl` is
`insis-only`/`read: never`: only InSIS's own link element, never a link built by InSIS+, never on the course page
(which links to this list).

**The questionnaire (`dotaznik.pl`)**: G (§6): InSIS's content in the shared styles, nothing hidden or moved.

## 3. Section-level remarks

1. **Places shown as tabs.**
   - The document server row holds a settings form and "All my folders" (with a second row of four sub-tabs): fix
     §2.3 — one section row *By course · New · All folders · Search*, Settings and My folders as page actions,
     the sub-tabs only on My folders.
   - The topics page carries a second row with *Final theses topics*, a Study matters place: drop the row, link it
     from Thesis & state exam (§2.4).
   - The syllabus row mixes output types and languages: language becomes a segmented control, output types go
     into InSIS's own output form card (§2.6).
   - The e-library row has a "Contents of folder" tab that is a level, not a view: only *Folders · Search* (§2.3).
   - The portal bar appears on 8 page types here: hidden everywhere (rule decided in `03-pages.md` §1).
2. **Duplicate jobs (rule 4).**
   - "What is new in my files" has four surfaces: keep Home's *New materials* and the Materials chips as
     summaries that both lead to one list (*New*); remove the tree page's *Where the news is* rail.
   - Course › Submissions (composed) and `odevzdavarny.pl?predmet=…` both list one course's boxes: the course tab
     is the canonical place (rows → box pages); the InSIS variant renders as All submissions with a "Only <CODE> ·
     Show all" filter line.
   - Teachers on Overview and People: contacts only on People; Overview lists names with "→ People".
   - Enrolment statistics at `student/` and `studijni/`: one rendering, one sidebar place (Registration).
   - Next deadline three times on All submissions: KPI and list only.
3. **Dead ends.**
   - Course › Submissions rows without links: each row opens its InSIS box page.
   - Course › Points as a page of generic links: rebuilt around this course's result, points, dates and tests.
   - `course.syllabus` in the composed set without a renderer: drop or alias to Overview.
   - My courses without a period switch: add it (past files and classmates).
   - Registration & enrolment opening an InSIS page that, outside rounds, explains nothing: the composed overview
     says when the next round is and what each step does.
   - E-plans and favourites are empty for most students: their pages carry empty states that say what would appear
     and why; the course page shows *Week by week* only when a plan exists.
4. **Illogical grouping.**
   - Topic sign-ups live under *All submissions* without being visible there: they appear as a block on All
     submissions and on the course's Submissions tab; gloss of the section: "Hand-ins and topic sign-ups".
   - Pass rates hide under the catalogue without a way in: a card on the catalogue page and a page action on other
     courses' syllabi.
   - The e-library is not course files: kept under Materials as a link card (its canonical place) and linked from
     Campus › Library, never a tab.
   - Lectures-sheet notification switches (the only course e-mail settings) are reachable only through the portal:
     page action *E-mail notifications* on My courses.
5. **Order of work** (by frequency × how bad the current state is): folder page (`slozka.pl`, after its snapshot) →
   course page Points / Submissions / People fixes → Materials tab row → box page → All submissions changes →
   registration overview and pages (before the next round) → topics → evaluation → catalogue and syllabus fixes →
   pass rates levels 2–4 → e-library → DS search/settings/my folders → e-plans, favourites.

## 4. Snapshots still needed

Collected read-only while logged in, each by the student's own click (folders and boxes may mark things as read):

| Page | State needed | Why |
|---|---|---|
| `dok_server/slozka.pl` | a course folder with files, one with new files | the most used page; markup unknown |
| `student/odevzdavarny_odevzdani.pl` | an open individual box, an open group box, after an upload | upload form, group wording, confirmation |
| `student/registrace.pl` | during a round; after its results | the wish/priority form; `verify_data` registration results |
| `student/list.pl` | per course with points entered; the overview | points grid, Settings (notification) cell markup, whether reading marks anything as seen |
| `student/spoluzaci.pl` | overview and per course (seminar group) | HTML of rows, paging (`on`), group e-mail and photo forms |
| `student/temata_prihlasovani.pl` | a topic group open for sign-up | where the register control sits |
| `student/mimosemestr_zapis.pl` | any (HTML) | crawl only; payment step |
| `student/vs_registrace.pl` | during minor-track registration | the register control |
| `student/oblibene_predmety.pl` | with favourites | rows and where favourites are added/removed |
| `student/reg_stat_tridy.pl` | during a round | filled demand columns |
| `elis/student/seznam_osnov.pl` | a course with an e-plan | structure unknown |
| `student/hodnoceni.pl` | levels 2–4 (HTML) | crawl only; W/T meaning |
| `eknihovna/slozky_objekty.pl`, `eknihovna/vyhledavani.pl` | folder contents, item detail, search results | crawl only |
| `dok_server/vyhledavani.pl` | after a search | results markup |
| `dok_server/nastaveni_stromu.pl`, `dok_server/moje_dok.pl` | any (HTML) | crawl only |
| `lide/clovek.pl` (teacher) | a teacher's page | e-mail, office hours, compose link for Course › People |
