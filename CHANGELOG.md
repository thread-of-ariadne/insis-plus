# Changelog

All notable changes to InSIS+ are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). The version in `manifest.json` is the source of truth.

## [Unreleased]

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

[Unreleased]: https://github.com/thread-of-ariadne/insis-plus/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/thread-of-ariadne/insis-plus/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/thread-of-ariadne/insis-plus/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/thread-of-ariadne/insis-plus/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/thread-of-ariadne/insis-plus/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/thread-of-ariadne/insis-plus/releases/tag/v0.1.0
