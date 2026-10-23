# InSIS pages: what gets redesigned, and how

Every InSIS page with a `#str1` content block gets the InSIS+ shell automatically (`generic.js`): sidebar, top bar
with the page title, the original content moved into the raised panel, and a shared look for InSIS tables, forms
and buttons. Pages listed below as **bespoke** get their own module on top of that.

Snapshots: public pages in `test/fixtures/`, logged-in pages in `test/fixtures/private/` (personal data, local only).

## Tier 1 — bespoke, special care

| Page | URL (under /auth/) | Snapshot | Notes |
|---|---|---|---|
| Personal timetable | `katalog/rozvrhy_view.pl?…rozvrh_student=…` | `private/timetable-personal` | 5-minute grid table. Week view + list of days; feeds the dashboard rail (next classes, hours per day). Variants on the canvas first. |
| Student's portal | `student/moje_studium.pl` | `private/student-portal` | Hub of ~25 links; enrolled courses for "My courses". |
| E-study record (grades) | `student/pruchod_studiem.pl` | `private/study-record` | Grades, credits, GPA → KPI cards. |
| Course attainment evaluation | `student/hodnoceni.pl` | `private/attainment` | Points per course. |
| Plan progress check | `studijni/studijni_povinnosti.pl` | `private/plan-progress` | 816 KB, thousands of checkboxes. Must stay fast. |
| Document server | `dok_server/`, `dok_server/nove_dok.pl` | `private/docserver`, `private/docserver-new` | Folder tree + files; new documents count is on the dashboard. |
| Coursework submissions | `student/odevzdavarny.pl` | `private/submissions` | Deadlines → dashboard rail. |
| Tests and examinations | `elis/ot/psani_testu.pl` | `private/tests` | Starting a test is an action: keep the original controls. |
| Academic calendar | `ca/prehled_tydnu.pl` | `private/weeks` | Teaching weeks → week strip labels. |
| Mail box | `posta/slozka.pl` | `private/mailbox` | Folder list. |
| Exam registration | (appears in the exam period) | — not collected yet | **Real actions** (register/unregister). Original form only, slotted, never auto-submitted. |
| Course registration | (appears in the registration period) | — not collected yet | Same as exam registration. |

## Tier 2 — bespoke, light (mostly layout and cards)

| Page | URL | Snapshot |
|---|---|---|
| Noticeboard | `vyveska/index.pl` | `private/noticeboard` |
| Electronic study materials | `eknihovna/` | `private/ematerials` |
| Course evaluation by students | `anketky/dotazniky.pl` | `private/surveys` |
| Persons at VŠE | `lide/` | `private/persons` |
| Study plans | `katalog/plany.pl` | `private/study-plans` |
| Tasks | `todo/` | `private/tasks` |
| Library borrowings | `pim/knihovna_vypujcky.pl` | `private/library` |
| Study financing | `student/financovani.pl` | `private/financing` |
| Contact centre | `kc/kc.pl` | `private/contact-centre` |
| User settings | `personalizace/pref.pl` | `private/settings` |

Done already: dashboard (`home.js`), course syllabus (`syllabus.js`), course catalogue search (`catalog.js`),
personal timetable (`pages/timetable.js`), Student's portal (`pages/student-portal.js`),
coursework submissions (`pages/submissions.js`), E-study record (`pages/study-record.js`),
document server (`pages/docserver.js`). Academic calendar: needs a snapshot taken during a semester.

## Tier 3 — generic shell only

Everything else, for example: science and research, InSIS documentation, statistics, licence information,
account and identity set-up (OTP, eID, delegates), personal data checks, mobile app pairing, eSurveys, elections,
printouts, access control, ID cards, departments, thematic search, graduates, final theses.

## Never touched

- Logout, password change, change identity: the shell may wrap them, but nothing is ever clicked or submitted for the user.
- Game room: hidden from the menu; the pages themselves get the generic shell.
- PDF and print outputs, pop-up windows and frames (`window.top !== window`).
