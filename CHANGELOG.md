# Changelog

All notable changes to InSIS+ are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). The version in `manifest.json` is the source of truth.

## [Unreleased]

### Added
- Top bar: one language menu instead of a button per language — a globe button with the current language (CS / SK /
  EN) opens Čeština · Slovenčina · English, each named in its own language, the current one ticked (InSIS shows
  only the other languages, so the current one used to be invisible); a light/dark toggle next to it (saved as the
  InSIS+ theme; "As the system" stays in InSIS+ settings). On phones both are in the account menu.
- Every InSIS page a student uses now has its own page, checked against 207 logged-in snapshots
  (`docs/ia/03-pages.md` §5). New: Confirmations & decisions (print, delivered, printed), Excuse notes, Thesis
  topics and detail, Theses archive, Study abroad reports and agreements, Internships, Elections, Map of my study,
  Enrolment statistics, Classmates, Topic sign-ups, the Submission box, Registration & enrolment (with
  extra-semestral courses, minor tracks, favourites), Course e-plans, Courses on offer, Departments (faculties,
  units, staff, courses, topics, publications), Who to ask (study offices), a person's page, Graduates, Rooms,
  E-mail & accounts, Apps & devices, Approvals, Access system, Help topics and articles, News, Discussions,
  To-do, Search, Mail settings. Reworked against real pages: Exam dates (rows, summary, How it works, filter),
  one exam date, Pass rates, Academic calendar, Timetable search, Study plans, History of study, cards, Payments,
  FAQ, Catalogue, Syllabus, e-Library, Noticeboard, InSIS mail.
- Page actions are a labelled row under the title on phones (never icons repeating the bar's own); on laptop
  widths the search box folds to its icon before a title wraps.

### Fixed
- Catalogue: InSIS's result links are no longer moved out of its form, and the filters fold with CSS only.
- Syllabus: the copied text keeps only text structure (an allow-list); images, frames and objects from
  teacher-entered HTML are dropped; the back link that failed the URL rule is gone; InSIS's output form is shown.
- Language links and the page-help link pass the URL rule; the remembered place of an unknown page is InSIS+
  session data instead of the page's own sessionStorage.
- Forwarding settings (`posta/forwardy.pl`) are no longer read in the background (settings pages are never read).
- Czech Payments page showed "—" for every date; course subfolders opened from a course lost the course context.
- InSIS's checkboxes are visible on the dark theme; header buttons keep their icons on phones.
- First-frame skeleton (`boot.js`): an InSIS+ skeleton instead of the original page while InSIS's server responds.
- In-place navigation between Home and the InSIS+ pages on its address (no server round trip); a session cache for
  course syllabi (shown at once, refreshed in the background); skeleton placeholders instead of "Loading…".
- Materials redesign (`docs/ia/04-materials.md`, reviewed): a course's files live in the course (New in this course,
  folders flattened with readable names such as "Lecture · Fri 14:00 · RB 212"); InSIS's folder page of a course
  folder is drawn as that course page; Courses › Materials has By course (newest course documents, one row per
  course), New (course chips, InSIS's list in place), All folders (drill-down with a path and Jump to folder, no
  expandable lists) and Search; Settings (E-mail and display, Your folders) replaces "DS settings" and "All my folders".
- One header per section on every page of the section (kit.section).

### Changed
- Red counts (bell, course cards, New tab, Home) count documents in the student's courses only; faculty and
  university documents no longer raise them.

### Fixed / safety
- A copied link ending in "#ipx:…" could pass the URL rule; pages whose reading might change InSIS state
  (`verify_effect`: folder pages, a document's details, the lectures sheet) are never fetched; background reads
  discard redirects to pages the rule does not allow; the session cache is wiped with the personal data everywhere.

## [0.9.0] - 2026-10-24

### Added
- Page-by-page design (`docs/ia/03-pages.md`, four teardowns in `docs/ia/teardowns/`), reviewed for UX and safety.
- Page kit (`kit.js`, `kit.css`) for rebuilt InSIS pages: tables, facts, InSIS's own form in a card, notes, dates,
  Czech plurals.
- Rebuilt pages: What's left (the plan check), Online tests, Academic calendar, Study plans, e-Library, Course
  evaluation, Payments & scholarships, People search, Noticeboard, Requests (the contact centre's forms), Library
  loans; InSIS mail with a forwarding status line and folders as tabs.
- Finished courses have their own group on Home and My courses (dimmed card, ✓ with the result).
- Messages, Account and Help show their sections in the sidebar while you are there.

### Changed
- Navigation: each destination opens its sections as a submenu in the sidebar; the row of destination tabs is
  gone. A page has at most one row of view tabs, only for views of one thing. InSIS's portal bar is hidden.
- Sections: Export to calendar is part of My week (Export and print); the four exam-list views are one section,
  Exam dates; Study plans moved to Grades & credits; Requests opens the contact centre's request forms.
- Titles: a section's page is titled by the section, a page below it by its own name with the section above.
- Results has four views (This period, Whole study, Statistics, Comparison); My week, Materials, All submissions,
  Study status and the overviews no longer repeat the navigation.
- To do says what it watches and when the data was updated.

### Fixed
- Background reads opened InSIS pages in a hidden frame, which ran InSIS's scripts, including the Google Analytics
  InSIS embeds: each read sent a page view to Google. Pages are now fetched as text and parsed; nothing runs.
- Only settings are kept on disk; everything read from InSIS is session data by default.
- Pages with credentials or sensitive personal data are never read; the action-parameter deny list is wider.
- InSIS's submissions page for one course replaced the stored boxes of all courses.
- The course catalogue module took over the people search page.
- Stray "0" in some cards; Czech plural forms.

## [0.8.0] - 2026-10-24

### Added
- Appearance in InSIS+ settings: follow the system, or always light or dark. Applied at once to the shell, the
  search palette and InSIS's own content; kept per user like other settings.
- Course › Overview shows the course's syllabus inside the page (facts, aims, outcomes, content, assessment,
  literature, time load) next to the next classes and what is coming; the separate Syllabus tab is gone.
- Course › Materials shows the course folder's subfolders right away (file counts, new files); a folder opens in
  InSIS on your click. Courses › Materials lists every course with its folders.
- Study matters and Campus & people are overviews: your study and its state, things to handle, your teachers this
  semester; the sections in compact columns, and as a submenu in the sidebar while you are there.

### Changed
- One course card everywhere (Home, My courses, Materials).
- InSIS's own tab rows (document server views, portal tabs) are a thin underlined row instead of a second segmented
  bar under the destination tabs. The document server's whole-tree page keeps only the tree and links to Materials.
- Course People lists the teachers from the syllabus (with role and person page).

### Fixed
- The InSIS user was recognised by an icon in InSIS's header that is the same for everyone, so per-user settings
  and the "another user logged in" wipe did not tell users apart. The user is now recognised by a one-way hash of
  the logged-in name; settings kept so far move over once.
- Links in public InSIS pages shown inside InSIS+ (e.g. a teacher's page in the syllabus) were turned into plain text.

## [0.7.0] - 2026-10-24

### Added
- A new information architecture, designed from a read-only crawl of InSIS (135 page types) and reviewed in 16 rounds
  (`docs/ia/`): seven destinations (Home, Courses, Schedule, Exams, Grades & credits, Study matters, Campus & people),
  All services, Messages, Notifications, Help and an account menu. `docs/ia/mapping.json` maps every InSIS page type
  to its place, with the addresses InSIS+ may read or link to; `nav-data.js` is generated from it
  (`scripts/build_nav.py`), and `scripts/ia_check.py` checks it against the crawl (both run in CI).
- Navigation shell: sidebar with the destinations and pins, destination tabs, top bar, phone bottom bar.
- Home: To do (with when each source was last checked), My courses, InSIS notices; the rail keeps the week, timetable,
  new materials by course and teaching hours.
- Course page (Overview, Materials, Submissions, Points, People, Syllabus) and Courses › My courses / Materials.
- Messages ("Where do messages arrive?"), Notifications, InSIS+ settings (background reads, shared computer, clear
  data), grouped lists for Study matters, Campus & people, All services, Help and Account.
- `bg.js` and the `alarms` permission: session data is wiped after 10 minutes without InSIS activity.

### Changed
- Personal data read from InSIS is kept only for the session (session storage), wiped on logout, change of identity
  and when another user logs in; settings are kept per user; a shared-computer mode keeps nothing (PRIVACY.md).
- Every address InSIS+ reads in the background or shows as a link passes one rule from the mapping (allowed
  parameter sets, no action parameters); Ctrl+K search offers only such links.
- The Student's portal page is Study status; its actions live in the navigation. The old dashboard KPIs, quick actions
  and "recently opened" are gone.
- The card entrance animation no longer starts from invisible.

### Fixed
- The document server module took the mail box's folder tree for its own and wiped the materials data.
- The Czech e-index "Zadáno" column (date a result was entered) was not read.

## [0.6.0] - 2026-10-23

### Added
- Background sync (`sync.js`): when the data is missing or older than 3 hours, the Student's portal, personal
  timetable, study record, submissions and document server are read in a hidden same-origin frame, so the
  dashboard is filled right after logging in, without opening each page first. Nothing is clicked or submitted.
- Dashboard: a "Student's portal" row with the six main actions (exams, course registration, my timetable, study
  record, submissions, plan check), each with a live line (next class, credits, nearest deadline).
- Shared `quickActions()` component and `PORTAL_ACTIONS` in `ipx.ui`; `ipx.onData()` for pages that redraw when
  synced data arrives. `test/serve.py` serves the test pages with caching off.

### Changed
- Student's portal rebuilt: study, the six main actions, and everything else in one card as plain columns of
  links (Study, Calendar and excuses, Documents and surveys, Money, Other) with a filter, instead of five blocks
  of tiles.
- "My courses" on the dashboard shows the courses you are enrolled in (study record, else your timetable);
  syllabi you opened are under "Recently viewed".
- Saving merges data stored by other tabs or the sync frame instead of overwriting it.

### Fixed
- The dashboard's "Full timetable" and the sidebar's main timetable item opened the public timetable search;
  they now open your personal timetable ("My timetable"), and the public search moved to Study.
- Czech submissions page was not recognised ("Název předmětu", "Odkdy", "Dokdy" columns).

## [0.5.0] - 2026-10-23

### Added
- Dashboard rail: upcoming submission deadlines with countdowns, and courses with new documents.
- Shared helpers in `ipx.ui`: `facultyFor()` / `facultyFromCode()`, `linkTabs()`, `keepOnly()` / `hideInSlot()`,
  `countdown()` / `wallTime()` / `deadlineList()`, `folder` and `info` icons. Page modules use them instead of copies.
- Personal timetable page (`pages/timetable.js`): week view with previous/next week, KPIs, courses in the
  timetable, next classes and hours per weekday; the original list/print/PDF form is kept. Classes are stored for
  the dashboard.
- Student's portal (`pages/student-portal.js`): the study on top, the main actions (exams, course registration,
  timetable, study record, submissions, plan check) as labelled cards instead of unlabelled icons, every other
  application grouped below, next classes and contacts on the side.
- Coursework submissions (`pages/submissions.js`): boxes ordered by deadline (due soon, later, not open yet,
  closed) with countdowns and links to InSIS's own upload pages; deadlines are stored for the dashboard.
- E-study record (`pages/study-record.js`): credits and average as KPIs, courses per semester with pass/fail/
  in-progress status, grade and examiner; the view tabs and unknown content stay available. Also the faculty
  picker of Course Attainment Evaluation.
- Document server (`pages/docserver.js`): one card per course with its folder tree and new-document badges, a
  filterable whole tree, new documents grouped by course; the mark-as-read form stays InSIS's own.
- Dashboard rail shows the next classes, the week's class days and teaching hours once the timetable was opened.
- Shared components `nextClasses()`, `hoursChart()` and `classDays()`.

### Changed
- Sidebar grouping rules checked against the real Czech and English menus: news, discussion, noticeboard, tasks,
  library, courses, surveys, elections, password and login items now land in the right group.
- SVG icons and course covers are built without `innerHTML`; the Firefox manifest declares that no data is collected.

### Fixed
- "Lidé na VŠE" (Czech "Persons at VŠE") is recognised as a main menu item.
- In slotted InSIS tables, header rows no longer slide over the top bar and InSIS's own grey stripes are gone.
- Classic view now also switches off the InSIS+ styles for slotted content, so the page is fully original.
- Native checkboxes and radios in slotted InSIS forms are visible in dark mode.

## [0.4.0] - 2026-10-23

### Added
- Shell for every InSIS page without a module of its own (`generic.js`, `generic.css`): sidebar, top bar with the
  page title, original content moved into the panel, InSIS tables, tabs, forms and buttons in the InSIS+ look.
- Shared components in `ipx.ui`: KPI card, section head, tabs, course card, week strip, notice, empty state.
- `docs/pages.md` (which pages get redesigned, by tier) and `docs/agents.md` (brief for page modules).
- `pages/` folder for page modules; `test/make_fixture.py --with` to test a module before it is registered.
- `test/collect_server.py` to save logged-in pages as local, git-ignored test snapshots.

### Fixed
- Dashboard counters on the real InSIS main page, where the number and the word are separate links.
- The menu's "Open all" link no longer shows up as a notice.

## [0.3.0] - 2026-10-23

### Added
- App shell after the chosen design: menu on a blue haze in VŠE colours, content on a raised inset panel.
- Sidebar with the whole InSIS menu, regrouped by task (Main, Study, Communication, Documents, Account, Other),
  with a filter, pins and a switch back to the original grouping.
- Dashboard: KPI cards, "My courses" with covers drawn from the course code, week strip, recent pages.
- Course catalogue and syllabus moved into the shell.

### Changed
- Fonts: Bricolage Grotesque (headings, numbers) and Figtree (text).
- "Favourites" and "Pinned" are one list, called "Pinned" everywhere.

## [0.2.0] - 2026-10-23

### Added
- Task-oriented replacement for the InSIS main page.
- Readable course syllabus page.
- Course catalogue results as cards, one per course with a chip per semester.

## [0.1.0] - 2026-10-23

### Added
- Ctrl+K search over InSIS pages, indexed as you browse; favourites and frequently used pages.

[Unreleased]: https://github.com/thread-of-ariadne/insis-plus/compare/v0.9.0...HEAD
[0.5.0]: https://github.com/thread-of-ariadne/insis-plus/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/thread-of-ariadne/insis-plus/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/thread-of-ariadne/insis-plus/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/thread-of-ariadne/insis-plus/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/thread-of-ariadne/insis-plus/releases/tag/v0.1.0
