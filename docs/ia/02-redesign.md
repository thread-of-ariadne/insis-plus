# InSIS+: new information architecture (draft 18)

Goal: a student finds what they need without knowing how InSIS is built. (Pages still marked `verify`, such as the
study application form and the U3V application, are reached through Classic view of Home until verified.) The design is organised around **what a
student does** (attend classes, pass courses, take exams, sort out papers and money, find people and rooms) and
around **the course** as the main object. Everything InSIS has stays reachable; rare things move out of the way,
not out of reach.

Basis: `01-current-map.md` (crawl), `mapping.json` (every page type → node, labels, read and link rules, allowed
parameters; checked by `scripts/ia_check.py`), review rounds 1–16 (section 11).

Numbers: the crawl opened 483 pages of **135 page types** (138 with error and not-found pages); `mapping.json`
covers **157 page types**: those 138 plus 19 seen as links but deliberately not opened.

## 1. Principles

1. **Seven destinations in the student's words** (labels in `mapping.json`, section 10): Home, Courses, Schedule,
   Exams, Grades & credits, Study matters, Campus & people. Messages, Notifications, Help and the avatar menu in
   the top bar; rare services in *All services*, each with a plain gloss.
2. **One name, one place.** Each InSIS page has one canonical location and one label; other places link to it.
   Course **files** live in courses; official **papers** in Study matters; the word "documents" is not a label.
   *Grades & credits* answers "did I pass" and "what do I still need".
3. **The course is a page**, composed from what InSIS spreads over ~10 pages.
4. **Three attention surfaces, one fact each.** Home › *To do* = things the student must do (with the deadline
   where there is one).
   *Notifications* (bell) = things that changed in InSIS, shown once. *Messages* = InSIS's internal mail (its own
   unread badge).
5. **Progressive disclosure**: ≤6 tabs per page, ordered by frequency, empty ones hidden; destinations with more
   sections are grouped lists, not tab rows.
6. **Context is explicit but local**: the top bar switches the *study* (only with 2+; a minor track is part of a
   study). The *period* is chosen on each page; where InSIS's page has its own period form, only that form shows.
7. **InSIS performs every action, on its own page, by the student's own click.**
   1. InSIS+ never submits, fills in, pre-filters or changes an InSIS form, and never moves a form to another page.
   2. **One URL rule** for every insis.vse.cz URL InSIS+ fetches *or* shows as a link: the page type is in
      `mapping.json`;
      its parameter names form one of the page's allowed sets — `fetch` sets for reading, `links` sets for links
      (values pinned where a value matters, e.g. `format=html`; InSIS's own language links, with `lang`, are
      only ever copied verbatim from the page). InSIS's navigation parameters (`lang`, `zpet`, `back`, `_m`;
      `transient_params` in `mapping.json`) are never added by InSIS+; on copied links they are tolerated, and a
      `zpet` / `back` value must itself be an InSIS URL that passes this rule, otherwise it is dropped. Fetch URLs
      are always built from an allowed set, never taken from a copied link. For every URL, no parameter name may be
      on the action deny list (`01-current-map.md` §4, enforced by `ia_check.py`
      and at run time). Outside InSIS, InSIS+ links only to the short `external` list in `mapping.json` (Moodle,
      Outlook; an entry marked `verify` stays hidden until confirmed) and to e-mail, app-store and support links
      copied verbatim from InSIS pages; it never fetches anything
      outside InSIS. A page type marked `verify` (its parameter sets were never seen) gets no link and no read until a snapshot
      confirms them; `verify_data` (the page is fine but the data a feature needs, or the absence of a side effect
      of reading it, is not confirmed) keeps links but switches that feature off until confirmed. Links on composed pages are either copied verbatim from an InSIS page
      InSIS+ has read and then passed through the same rule, or built from an allowed set.
   3. Composed pages link only to page types marked `link: shell`. An action control (Sign up, Hand in, Fill in,
      Change date, Get a confirmation, Write to the teacher) opens the InSIS page that *holds* the action.
      `link: insis-only` pages appear only as InSIS's own links on InSIS's own page.
   4. Pages that hold forms (password, security settings, excuse notes …) may be linked: opening them changes
      nothing. Named exceptions, each a navigation by the student's own click with nothing done in advance: **Log
      out** and **Language** (InSIS's own links, in the avatar menu).
   5. Where a shortcut would need a form (a filtered exam list, a search), InSIS+ opens the unfiltered page and
      highlights the relevant rows, or shows the query with a Copy button next to InSIS's search page.
   6. Fetching: `read: background` pages only while an InSIS tab is open and the student was active recently —
      the window is kept below InSIS's own idle logout (to be measured; 10 minutes until then). A read renews
      InSIS's session, so InSIS's idle logout can come up to one window later than it would without InSIS+; `read: on-open` pages only when the student opens them or a page that shows them (e.g. the
      course page reads that course's classmates list); `read: never` pages are never fetched. Every fetch obeys
      rule 2. Any page not in the mapping is `never`.
8. **Personal data does not outlive the session.**
   1. Parsed InSIS data (classes, grades, deadlines, counts, names) is kept in session-only storage: it is gone when
      the browser closes, and it is also wiped on Log out, Change identity, when the logged-in user differs, and by a
      timer after 10 minutes without InSIS activity (the same window as background reads), even if no InSIS tab is
      open.
   2. Kept between sessions, per InSIS user (a feature that needs more, e.g. registration results, adds its state
      here and to PRIVACY.md when it is switched on), only so that Notifications and To do work across logins (the full list
      is in PRIVACY.md): the time of the last visit; the last count of new course files; for each registered exam
      date its id, time and room; course codes that already have exam dates; dismissed To do items. These values are stored as they are: hashing them would not hide
      them (they are short and guessable), so the document does not pretend it does.
   3. InSIS+ settings (pause, To do choices, Classic view per page type) are kept per InSIS user too.
   4. **Shared computer** (InSIS+ settings; a per-browser choice offered the first time InSIS+ runs, applying to
      every InSIS user of that browser): nothing is kept
      between sessions; Notifications then only compare within the session and use InSIS's own markers (result
      "Entered" dates).
   5. A student can pause background reads and clear everything in InSIS+ settings.
9. **Search** finds what InSIS+ has read (page names, my courses and syllabi, people linked from them, rooms from
   the public room list read on the first room search) plus everyday and old-InSIS synonyms (section 9). For
   anything else it opens InSIS's own search page unchanged, with the query ready to paste.

## 2. Global layout

- **Sidebar (desktop)**: the seven destinations; at the bottom *All services*. Badges carry text ("Exams, sign-up
  open").
- **Top bar (desktop)**: page title and context · study switch (2+ studies) · search (button, "/", Ctrl+K or Alt+K
  where the browser takes Ctrl+K; ignored while typing in an InSIS field) · **Messages** · **Notifications** bell ·
  **Help** (?) · **CS / EN** language switch (InSIS's own language links, copied verbatim from the page like Log out) · **avatar menu**: Account, Change
  password, InSIS+ settings, Log out (on phones also Language and the study switch).
- **Phone**: top bar with search, Messages, Notifications and the avatar menu (which also holds the study switch);
  bottom bar Home · Courses · Exams · Grades · Menu (short labels in `mapping.json`). Menu: Help & who to ask ·
  Schedule · Study matters · Campus & people · All services (labels in `structure.menu`). (Grades replaces Schedule
  in the bottom bar: students check results more often than the full timetable, and Home already shows today's
  classes.) Touch targets ≥ 44 px.
- **Page template**: title and context · ≤6 tabs (links with `aria-current`, scrollable, selected tab in view) ·
  primary action link · content · "Who can help?" footer: a link to the matching topic in Who to ask (Who to ask
  shows the contacts).
- **Wrapped InSIS tables on phones**: horizontal scroll with a sticky key column (course or name, set per page type,
  never a checkbox or order number); card layouts put a `data-label` on non-control cells; inputs, checkboxes and
  hidden fields are never hidden or moved. Tables reflow at 320 px / 400 % zoom.
- **Fallbacks**: a page not in `mapping.json` inherits the node of the page the student came from (and is `read:
  never`); InSIS error pages get the `error` node (shell, Back, Help).
- **Accessibility**: skip link, `nav` landmarks, badges with text, focus returned after the drawer, search dialog
  and study switch; countdowns and last-checked times are not live regions; `lang` set on mixed content.

## 3. The tree

```
Home                    To do · My courses · InSIS notices | rail: This week · Timetable · New materials · Teaching hours
Courses                 My courses · Materials · All submissions · Registration & enrolment · Catalogue · Course evaluation
  └ Course page         Overview · Files · Submissions · Points · People · Syllabus
Schedule                My week · Academic calendar · Timetable search · Export to calendar
Exams                   My dates · Available dates · Past · Not yet scheduled · Online tests       (header: exam period dates)
  └ Exam date           (InSIS page: details; InSIS's own link to who is registered)
Grades & credits        Results · What's left
Study matters           Paperwork: Confirmations & decisions · Excuse notes · Study status & ID card · Requests
                        Money: Payments & scholarships
                        Thesis, exchange & career: Thesis & state exam · Study abroad (Erasmus) · Internships & jobs · Next degree
Campus & people         Contacts: Who to ask · People · Departments
                        Campus: Rooms · Library
                        Information: Study plans · Theses archive · About VŠE
Top bar                 Messages · Notifications · Help · CS/EN · avatar (Account · Change password · InSIS+ settings · Log out; phones: + Language, study switch)
All services            Discussions · InSIS tasks · News subscriptions · Courses on offer & U3V · Surveys & elections
                        · Research tools · Statistics · Thematic search · About the system · Games
```

### Home
Two columns on desktop, as in today's InSIS+ dashboard: the main column (To do, My courses, InSIS notices) and a
right rail (this week, timetable, new materials, teaching hours). On phones the rail follows the main column.
- **To do** (section 6): things to do, soonest deadline first, grouped where alike ("4 courses need an exam date");
  each links to the InSIS page that holds the action and says when it was last checked; a source not read yet says
  "not checked yet".
- **Rail › This week**: the week strip (Mon–Sun, today raised, a dot on days with classes).
- **Rail › Today and next / Dnes a příště** (titled "Timetable / Rozvrh" with "Full timetable →"): the next three
  classes (date, course, type, room → room page, course → course page), my exams in the next 3 days; "Full
  timetable →" opens Schedule › My week.
- **Rail › New materials / Nové materiály**: my courses with new files and how many ("4SA471 · 6 new"), from the
  document server's tree; each row opens that course's folder in InSIS; "All materials →" opens Courses ›
  Materials.
- **Rail › Teaching this week / Výuka tento týden**: hours of classes per weekday, today highlighted.
- **My courses**: cards → course page (next class, nearest deadline).
- **InSIS notices**: the notices InSIS shows on its main page, except those already shown as a To do item (e.g. the
  personal data check). One Home surface per fact: a registration round or exam sign-up period appears as a To do
  item, not also as a banner.

### Courses
- **My courses**: enrolled courses of a period (local period switch; past periods for old classmates and files).
- **All submissions / Všechny odevzdávárny**: every submission box of the period (InSIS's list), soonest first.
- **Course page** (composed; data matched only by exact course code or by the course parameter of its InSIS link;
  unmatched records stay visible under "Not matched – browse all"). Empty tabs are hidden.
  | Tab | Contents (InSIS sources) |
  |---|---|
  | Overview | next classes (personal timetable), weekly plan (course e-plans), teachers with office hours, completion, credits, my status; while open: an online test or quiz of this course to do, link to the course evaluation list; link to InSIS's lectures sheet (notification settings are there) |
  | Files | a link to the course's document-server folder when matched (the folder link is copied from the lectures sheet or the document server's tree, where the crawl shows course-folder links; read when the course page opens; to verify — until then Files links to all folders), else to all folders; a Moodle link once its address is confirmed ("some teachers put slides in Moodle instead") |
  | Submissions | the course's boxes (individual or group as InSIS states; for group boxes a teammate's upload counts), topic sign-up rows whose course code matches |
  | Points / Body | points so far as InSIS's own text (never totals), result and attempts, this course's exam dates, online tests when matched |
  | People | teachers: office hours, e-mail address (opens your own mail app; "teachers read their university e-mail"), and "Write in InSIS" (InSIS's own compose link, copied from InSIS's page); seminar groups and classmates (first page; InSIS link for more) |
  | Syllabus | redesigned syllabus, pass rates |
- **Registration & enrolment / Registrace a zápis** (always here; a badge during rounds, and the round as a To do item on Home): the rounds
  with dates (from the academic year schedule, the same data as the Academic calendar) and plain explanations —
  *registration* = your wishes ranked by priority, *enrolment* = confirmed places, changes after enrolment — then
  InSIS's pages as steps, each saying which period it works on; *Extra-semestral courses* ("short courses outside
  the semester, usually paid"); *Minor tracks – VS* ("a specialisation you add to your study, often from another
  faculty"); *Favourite courses* (a planning list); enrollment statistics.
- **Catalogue**: InSIS's course search (choose the period on InSIS's form); syllabi of any course; pass rates.
- **Course evaluation / Anketa**: InSIS's list of questionnaires.
- **Materials / Materiály** (second tab of Courses, right after My courses — the document server is one of the most
  used places): my courses first, each with its new-file count and its folder; then InSIS's document server views
  (new documents, all my folders, the whole tree, search, settings), the e-library and the Moodle link (once
  confirmed).

### Schedule
- **My week** (opened by "Full timetable →" on Home): InSIS+'s week view of the personal timetable with the week
  strip and teaching hours on top, back and forward by week, a list view and InSIS's own print/export form. Each class links to its room and
  course; past classes offer "Absent? Excuse note" → Study matters › Excuse notes.
- **Academic calendar**: teaching weeks and my faculty's academic year schedule (exam period, registration rounds,
  holidays); other faculties' courses may differ (noted).
- **Timetable search**: InSIS's search for teachers, courses and programmes (room timetables: Campus › Rooms).
- **Export to calendar**: InSIS's transfer of events to Office 365 ("appears in Outlook and in phone calendars
  connected to your university account").

### Exams
Header: this semester's exam period dates (from the academic calendar) and the state of sign-up. **Every exam
action happens on InSIS's own exam list** (`terminy_seznam.pl`, "Register for examinations"), shown unchanged in
the shell: InSIS+ adds a summary *above* it and highlights the student's course in it, never replaces or regroups
the list itself. Where exactly InSIS puts the sign-up and sign-off controls (in the list, or on a page behind it)
is to be confirmed with a snapshot taken while dates are open (section 5).
Both **My dates** and **Available dates** are summaries over the same InSIS tab ("List of currently offered exam
dates", which starts with the dates the student is registered for): My dates links to it without a tab parameter,
Available dates with `zalozka=1`, so the right tab stays highlighted.
- **My dates** (default): a summary of registered dates with sign-off deadlines (a deadline within 2 days is
  highlighted here and in Today and next), above InSIS's list of current dates. *Change date* explains the order
  (sign up for the new date first where InSIS allows; signing off — InSIS's column is called "Log out" / "Odhlásit" — first can lose your place) and points to the
  course's other dates in the same list.
- **Available dates / Volné termíny**: a summary of dates open for sign-up (exams and credit tests) by course, my
  courses first, places left, above InSIS's list with the course highlighted.
- **Past**: InSIS's tab of past dates; each of my courses links to Grades & credits › Results.
- **Not yet scheduled**: InSIS's tab of courses without dates, with the note "dates for these courses are not
  published yet; this is normal before the exam period"; Notifications tells you when they appear.
- **Online tests / Testy a kvízy**: tests to do and submitted ("quizzes during the semester are here too").
- **Exam date** (`terminy_info.pl`): details, linked from the list; the list of registered students is only
  InSIS's own link on that page.
- The **state final exam** lives in Study matters › Thesis & state exam (linked from here).

### Grades & credits / Známky a kredity
- **Results** (e-index): current period, whole study, statistics. Exams › Past and course pages link here.
- **What's left / Co mi chybí**: credits earned this period and in total, credits needed, compulsory courses still
  missing ("am I on track to graduate"), map of my study, my study plan.

### Study matters / Studijní záležitosti
A grouped list (each row with a short line and, where known, a live value); groups side by side on desktop.

| Group › Section | Contents |
|---|---|
| Paperwork › Confirmations & decisions / Potvrzení a rozhodnutí | confirmation of study and study overview in Czech or English (InSIS's print page), decisions and documents delivered to me with delivery and confirmation dates (InSIS's storage list), register of printouts, verification |
| Paperwork › Excuse notes / Omluvenky | excuse notes (InSIS form); also offered on past classes in My week |
| Paperwork › Study status & ID card | status and history, restrictions with what they mean and who to ask, other studies, ID card (ISIC: photo, cards in use, validity) |
| Paperwork › Requests / Žádosti | requests to the study department (interruption, recognition of courses, deadline extensions): *not in the crawl; until verified this row explains where to ask (Who to ask)* |
| Money › Payments & scholarships / Platby a stipendia | financing overview (fees, payments), scholarships paid out, accommodation benefit, bank accounts; who to ask about money |
| Thesis, exchange & career › Thesis & state exam | my thesis topic and supervisor (with contact), topic lists (choose / propose on InSIS's page), departments' topics, thesis submission, state final exam ("SZZ – the final exam before graduation"): dates and registration, theses archive. *Submission, supervisor data and state-exam pages are not in the crawl (first-year account); to be verified with a final-year account before building.* |
| Thesis, exchange & career › Study abroad (Erasmus) | exchange application (linked once its page is verified), partner universities and agreements, reports from former students |
| Thesis, exchange & career › Internships & jobs | jobs portal (companies, offers, my internships, my profile) |
| Thesis, exchange & career › Next degree | study application forms (e.g. master's): *the page was not opened in the crawl; until verified this row explains where to apply and links to Who to ask*; admission documents delivered to me are under Confirmations & decisions |

### Campus & people / Kampus a lidé
A grouped list.
- **Contacts**: **Who to ask / Na koho se obrátit** (whom to contact by faculty and topic, the Study Department
  page, link to Help › Ask a question) · **People** (InSIS's person search, opened unchanged; person pages with
  contacts, office hours, teaching, theses) · **Departments** (structure, staff, phone directory, supervised
  courses, topics, projects, publications, bodies).
- **Campus**: **Rooms** (campuses, buildings, rooms, room timetables, building address; all rooms searchable) ·
  **Library** (my loans and due dates; e-library link).
- **Information**: Study plans · Theses archive · About VŠE (basic and further information, graduates).

### Top bar
- **CS / EN**: InSIS's own language links, copied verbatim from the page (desktop); on phones in the avatar menu.
- **Messages / Zprávy v InSIS**: InSIS's internal mail, clearly separated from university e-mail. At the top a box
  "Where do messages arrive?": whether InSIS forwards its mail to your e-mail (the addresses set in InSIS's
  forwarding page, read when Messages is opened), and an "Open university e-mail (Outlook)" button. Then the mail
  folders, new message, group messages, mail settings and forwarding (linked with Account › E-mail delivery);
  Noticeboard.
- **Notifications / Upozornění** (bell): section 7. Opening the list marks items as seen *in InSIS+ only*.
- **Help (?)** (on phones: the first row of Menu): **Who to ask** (same page as Campus › Who to ask) · help for this page (InSIS context help) · **Ask
  a question** (Contact centre) · InSIS documentation and FAQ · mobile app (about, stores, support).
- **InSIS+ settings** (avatar menu): pause background reads, clear stored data, choose which To do items show,
  Classic view (the original InSIS look for any page), privacy (what is stored and read, with a link to PRIVACY.md).
- **Avatar menu**: **Account** — Profile & privacy (photo, personal data check and statistics, approvals) ·
  Security (password, recovery data, OTP, eID, login overview, delegates, change identity, my operations) · Apps &
  devices · E-mail & accounts (university e-mail delivery, distribution server, accounts administration) · Access
  system · InSIS customisation ("settings of the classic InSIS look"); **Change password** (shortcut to InSIS's
  page); **InSIS+ settings**; on phones also **Language** and the study switch (2+ studies); **Log out**.

### All services (A–Z, searchable, each with a gloss)
Discussions / Diskuse (course and interest forums) · InSIS tasks (task lists some departments use; the count InSIS shows in
its header appears here as a badge) · News subscriptions (Odběr novinek) · Courses on offer & U3V (public courses;
University of the Third Age for seniors) · Surveys & elections (university surveys, academic senate elections; a badge while one is open) ·
Research tools · Statistics · Thematic search · About the system · Games.

## 4. Tasks before → after

**Rule**: count from the start page (InSIS main page today, Home new); every page load, tab switch, menu opening
(phone Menu, avatar menu) and InSIS form submit is one step; expanding a box on InSIS's main page is not. Today's column is recounted with this rule, so it is
higher than the page-load counts in `01-current-map.md` §2. ↓ marks a regression in that column.

| Task | Today | New path | Desktop | Phone |
|---|---|---|---|---|
| Next class and room | 2 (hunt) | Home › Today | 0 | 0 |
| Sign up for an exam | 5 (unlabelled icon) | Exams → Available dates (InSIS's list, course highlighted) → sign-up control → submit (to verify) | 4 | 4 |
| … from To do | – | To do item (Available dates, course highlighted) → sign-up control → submit (to verify) | 3 | 3 |
| Change an exam date | 7+ | Exams → Change date (opens InSIS's list with the explainer above it) → new date: sign up → submit → old date: sign off → submit (to verify) | 6 | 6 |
| Register courses | 5+ (icon) | Courses → Registration & enrolment → InSIS step page → submit | 4+ | 4+ |
| Did I pass | 3 | Grades & credits | 1 | 1 |
| What's left in my plan | 3 | Grades & credits → What's left | 2 | 2 |
| Points so far | 5 | Course card → Points (to verify: lectures sheet read on opening) | 2 | 2 |
| New materials in a course | 3–6 | Home › New materials → the course's folder | 1 | 1 |
| Materials of any of my courses | 3–6 | Courses → Materials → the course's folder (or course card → Files → folder) | 3 | 3 |
| Full timetable | 2 (hunt) | Home › Full timetable → (or Schedule › My week) | 1 | 1 |
| Hand in coursework | 4 | To do item → InSIS box page → submit | 2 | 2 |
| Seminar classmates | 5 | Course card → People | 2 | 2 |
| Syllabus of another course | 4 | Courses → Catalogue → InSIS search submit → syllabus | 4 | 4 |
| Confirmation of study (EN) | 4 (hunt) | Study matters → Confirmations & decisions → InSIS print page → document | 4 | 5 ↓ |
| Excuse note | 4 (hunt) | Study matters → Excuse notes → submit | 3 | 4 |
| Who to ask (scholarship) | 3 (hunt) | Help → Who to ask | 2 | 3 |
| Room of my next class | 5 | Home › Today → room | 1 | 1 |
| Any room | 5 | Search "SB 309" → room | 2 | 2 |
| E-mail a teacher | 5 | Course card → People → e-mail address (own mail app) | 3 | 3 |
| Supervisor's contact | 4 | Study matters → Thesis & state exam → supervisor | 3 | 4 |
| Exam period dates | 3 | Exams (header) | 1 | 1 |
| Course evaluation | 3 | Courses → Course evaluation → questionnaire → submit (To do, if switched on: 3) | 4 ↓ | 4 ↓ |
| Online test | 1 | Exams → Online tests (or To do while a test is open: 1) | 2 ↓ | 2 ↓ |
| Fee / scholarship | 1 | Study matters → Payments & scholarships | 2 ↓ | 3 ↓ |
| Library due date | 1 | Campus & people → Library (or To do when due: 1) | 2 ↓ | 3 ↓ |
| Change password | 2 | Avatar → Change password → submit | 3 ↓ | 3 ↓ |
| Log out | 1 | Avatar → Log out | 2 ↓ | 2 ↓ |
| Language | 1 | CS/EN in the top bar (phone: avatar → Language) | 1 | 2 ↓ |

Regressions: Log out, Change password (and Language on phones) move into the avatar menu, the usual place; online
tests, money and the library were one click from InSIS's long main menu and are now two (three on phones) — To do
brings them to Home when they matter; course evaluation gains a step because InSIS+ links to InSIS's questionnaire
list, never to a questionnaire.

## 5. What InSIS+ must build (feasibility)

- **InSIS's main page is Home itself**: its menu, header counters (new files, tasks) and notices are read when the
  student opens Home, never in the background.
- **Page identity**: `index.pl` and a trailing `/` are the same page type (the run-time check normalises both).
- **Composed pages** (Home, My courses, Exams › My dates and header, Grades summary, Study matters and Campus
  lists, Notifications) use `read: background` list pages; the Course page also reads that course's `read: on-open`
  pages when it is opened (rules in principle 7.6). They cache parsed data
  locally, show per block when it was last checked, with a refresh control and a link to the source page.
  Deadlines count down from the cached time. One notice when the InSIS session expired.
- **Activity rule**: no background reads once the student has been inactive in InSIS tabs for 10 minutes (to be
  set below InSIS's own idle logout once that is measured), so that logout still works on shared computers.
- **Storage** (principle 8): personal data in session-only storage (`storage.session`, with the extension in
  `"incognito": "split"` mode so private windows never share it with normal ones; which needs a minimal
  background worker to open it to content scripts and to run the wipe timer); the per-user seen record in local
  storage; documented in PRIVACY.md. Background reads appear in InSIS's own log of operations
  ("My operations"); documented in PRIVACY.md.
- **Matching**: exact course code or the course parameter of an InSIS link; never by name.
- **Pages that list all courses** map by their `predmet` parameter: a course of mine → that course page's tab; no
  course → the all-courses node; another course → Catalogue.
- **Wrapped pages** show InSIS's page and form in the new layout (CSS, `data-label` on non-control cells, sticky
  key column).
- **Links and fetches**: one URL rule (principle 7.2), including the transient-parameter rule, checked at run time; links copied verbatim from read pages
  or built from an allowed set; e-mail and "write in InSIS" links copied from InSIS's own pages.
- **Not verified yet** (columns or pages not in the crawl): financing items to pay, library loans, unread mail
  count, that opening the pages the crawl skipped but InSIS+ links to (Office 365 transfer, login
  overview, password recovery data, InSIS customisation pages) changes nothing — the same click as InSIS's own menu,
  that InSIS's `_m` menu parameter has no side effect (un-normalised snapshot), the course-folder links on the lectures sheet and document server tree, InSIS's idle timeout, how InSIS's exam sign-up and sign-off controls work (the crawl shows "Register" and "Log out" columns in the list; the control itself needs a snapshot while dates are open),
  whether reading a course's lectures sheet when its course page opens marks anything as seen, registration results, thesis submission, supervisor data, state exam registration, study department
  requests, and the allowed parameter sets marked `verify` in `mapping.json`. Each is built only
  after a snapshot shows the data.

## 6. To do (Home): triggers

Only things the student must do. Sources are background pages (principle 7.6, checked while an InSIS tab is open)
or Home's own page, read when the student opens Home.

| Item | Source | Shown when | Refresh | Gone when |
|---|---|---|---|---|
| Study restriction | portal studies table | a restriction is set | 12 h | cleared |
| Document delivered to me | `uloziste/` list → links to the list | delivered and not confirmed | 12 h | confirmed in InSIS |
| Submission due | `odevzdavarny.pl` | box open, nothing handed in (group: by anyone), closes within 7 days | 3 h + countdown | handed in / closed |
| Online test open | `elis/ot/psani_testu.pl` | a test to do is open | 6 h | submitted / closed |
| Exam or credit date to sign up for | `terminy_seznam.pl`, `pruchod_studiem.pl` | a course of mine has dates whose registration is open (or opens within 3 days), no passing result and no registered date; grouped; ranked by register-until and places left | 6 h | registered / passed / registration closed |
| Topic sign-up | `temata_prihlasovani.pl` | "Register until" within 7 days, no topic chosen | 12 h | chosen / closed |
| Registration round | `harmonogram.pl`, `registrace.pl` | a round opens within 7 days or is open; "Done for this round" dismisses it (until registration data is verified) | 12 h | closed / dismissed / done |
| Course evaluation (optional: off by default, on in InSIS+ settings; the list is read in the background only while this is on) | `anketky/dotazniky.pl` → links to the list | open and not filled | 12 h | filled / closed |
| Payment to make (not verified) | `financovani.pl` | an unpaid item | 12 h | paid |
| Personal data check | InSIS main page notices | InSIS's main page asks for a check (the notice then shows here only) | when Home is opened | notice gone |
| Library loan due (not verified) | `pim/knihovna_vypujcky.pl` | due within 5 days or overdue | 24 h | returned |
| Thesis / state exam deadlines (not verified) | to be found with a final-year account | a deadline within 14 days | 24 h | done / passed |

## 7. Notifications (bell): what changed

| Notification | Source | New when | Refresh |
|---|---|---|---|
| New course files | InSIS main page header counter ("N documents", read when Home is opened) → links to InSIS's new-documents list | the count is above 0 and differs from the stored count (InSIS+ never opens the list in the background and never uses "Mark as read") | when Home is opened |
| Result entered | `pruchod_studiem.pl` | a result whose InSIS "Entered" date is after the last visit (Shared computer mode: after the session started) | 6 h |
| Exam dates published | `terminy_seznam.pl` | a course in "Not yet scheduled" gets dates | 6 h |
| Exam date changed or cancelled | `terminy_seznam.pl` | a registered future date's time/room changed; or a registered future date is no longer listed at all, neither as registered nor as offered ("may be cancelled – check in InSIS") | 6 h |
| Registration result (`verify_data`) | `registrace.pl` | a place confirmed or lost after a round | 12 h |

**Messages badge**: unread count of InSIS mail from `posta/slozka.pl` (background, count only; `verify_data`
until the count is confirmed in a snapshot).
**All services badge**: an open election or survey (`evolby/`, `vv/epruzkumy/`). The
noticeboard has no badge (reading its "new" list could reset it). Seen state is kept locally, never written to
InSIS.

## 8. Never read by InSIS+ (links only as `mapping.json` states)

In addition to `01-current-map.md` §4: opening one stored document (`uloziste/zobrazeni.pl`, recorded by InSIS as
"Displayed"), document-server folders (linked, never read) and noticeboard items (may mark as read), questionnaires, print
and confirmation generation, mail messages, the personal data check entry form (`kontrola/?…form`), paging links
with unreviewed parameters.
`mapping.json` marks page types `read: never` / `link: insis-only`; the parameter deny list in `ia_check.py` keeps
action parameters out of every allow-list.

## 9. Search synonyms

e-index, průchod studiem, známky, zápočet, did I pass → Results · kredity, credits, co mi chybí, kontrola plánu →
What's left · body, points, průběžné hodnocení → Course › Points · úspěšnost, pass rate → Syllabus · termín, přihlásit na zkoušku → Available dates · zkouškové, harmonogram → Exams header, Academic calendar ·
odevzdávárna, hand in → All submissions · omluvenka, sick → Excuse notes · potvrzení o studiu, confirmation, visa,
rozhodnutí → Confirmations & decisions · úložiště dokumentů → Confirmations & decisions · dokumentový server, materiály, slides → All course
files · můj list předmětů, e-plány → Course › Overview · spolužáci → Course › People · anketa, evaluace → Course
evaluation · stipendium, scholarship, poplatek, fee, koleje, ubytovací stipendium → Money · SZZ, státnice,
bakalářka, diplomka → Thesis & state exam · přihláška, navazující studium, master's → Next degree · Erasmus,
výjezd, exchange → Study abroad · praxe, stáž, internship → Internships & jobs · ISIC, průkaz, card → Study status
& ID card · studijní, studijko, study office, kontaktní centrum → Who to ask / Ask a question · pošta, mail, vývěska, noticeboard →
Messages · osobní údaje, kontrola údajů → Account › Profile & privacy · žádost, přerušení, uznání
předmětů → Requests · Outlook → Messages (university e-mail button) · heslo, password → Change password · přesměrování,
forwarding → Messages settings, E-mail delivery · jazyk, language → Language · moje studium, portál studenta →
Study matters · zápis, registrace → Registration & enrolment · místnost, room → Rooms · Moodle → Materials.

## 10. Labels (single source)

Every node, destination, group and Home block has its English and Czech label in `mapping.json` (`nodes`,
`structure`); the shell, search and this document use them, and `ia_check.py` fails when one is missing.
Short labels for the phone bottom bar are in `structure.short`, phone Menu rows in `structure.menu`. Destinations: Home / Přehled · Courses / Předměty · Schedule / Rozvrh · Exams / Zkoušky · Grades & credits / Známky
a kredity · Study matters / Studijní záležitosti · Campus & people / Kampus a lidé · All services / Všechny služby;
top bar: Messages / Zprávy v InSIS · Notifications / Upozornění · Help / Nápověda · Account / Účet.

## 11. Review history

**Round 1** (IA review + first-year student): attention triggers; period local, study global; honest counts;
lifecycle tasks; Messages and Documents demoted; registration under Courses; course page 6 tabs; phone tables;
fallbacks; one meaning of "documents"; Change date; Grades; plain registration words.

**Round 2** (IA review + international student): never act for the student; To do / Notifications / Messages
roles; matching by code; triggers; phone counts; Grades and Study admin split; contacts and campus; All services
with glosses; Contact centre under Help; phone tables; English confirmations, ID card, Moodle link.

**Round 3** (IA review + final-year student): GET links only, highlight / Copy instead of forms; read rule per
page; idle rule; all-course pages by `predmet`; attention de-duplicated; online-test trigger; removed dates
notified; labels (Moje studium, Registrace a zápis, Upozornění); Next degree; thesis hub (to verify); All
submissions; Language; Messages on phones; one counting rule.

**Round 4** (IA review + first-year student regression):
- *Rules*: `read` (fetch) and `link` (may InSIS+ show a link) are separate; Log out and Language are named
  exceptions; Course › Files links to the folder instead of showing it; background reads limited to allowed
  parameter sets per page; noticeboard and personal data check no longer read in the background (the check comes
  from main-page notices); unmapped pages are `never`; `on-open` includes pages read when the student opens the
  page that shows them.
- *Labels*: every destination, group and block labelled in `mapping.json`; Grades → **Grades & credits / Známky a
  kredity** with **What's left / Co mi chybí** (the plan check is no longer hidden under "grades"); My studies →
  **Study matters / Studijní záležitosti** (grouped: Papers & money, Milestones); Contacts & campus → **Campus &
  people / Kampus a lidé** (grouped: Contacts, Campus, Information); **Who to ask / Na koho se obrátit** as the one
  contact page, first in Help; Absences & requests → **Excuse notes**; "Přihlásit se" → **Volné termíny**; "New
  documents" → **New course files**.
- *Features*: exam period dates in the Exams header; Grades in the phone bottom bar (Schedule into Menu);
  Change password in the avatar menu; Outlook button in Messages; teacher's e-mail address opens the student's
  own mail app; all rooms searchable; credit dates included in the sign-up trigger; notifications for published
  dates and registration results; thesis deadlines as a placeholder.
- *Counts*: recounted under one rule, including Today.
- *Not adopted*: campus map (InSIS has no map; building address and a link to VŠE's own campus map page may be
  added later); free-room finder.

**Round 5** (IA review + Slovak second-year student):
- *Safety*: one URL rule for every fetch and every link (allowed parameter sets for all fetched page types, deny
  list at run time, pinned values such as `format=html`); pages holding forms may be linked (opening changes
  nothing); §8 and principle 7 aligned with `mapping.json`; course folder link copied from "All my folders".
- *Correctness*: "date gone" fires only for future dates not signed off via InSIS+; topic sign-up matched by course
  code in the rows (no unverified parameter variant); credit-test dates trigger by their own registration window;
  "exam within 3 days" moved from To do to Today and next; sources' `also` completed; unverified parameter sets
  marked `verify`.
- *Labels*: Study matters regrouped — **Paperwork** (Confirmations & decisions, Excuse notes, Study status & ID
  card, Requests), **Money**, **Thesis, exchange & career** (with "Study abroad (Erasmus)"); course tab
  **Grades / Hodnocení**; Czech fixes (Odhlásit se, Dnes a příště, K vyřízení); short labels.
- *Features*: "Where do messages arrive?" box in Messages (forwarding status); Help as the first Menu row on
  phones; study switch in the avatar menu on phones; Requests row (to verify).
- *Counts*: fixed, regressions marked per column.

**Round 6** (IA review + student check, verdict from the student: ready to build):
- *Rules*: separate `fetch` and `links` parameter sets (links to never-read pages such as course folders and Log
  out are now checked too); `lang` allowed on links; teacher timetables allowed; `verify` pages get no link or read
  until confirmed; on-open pages with no confirmed sets are `never`.
- *Privacy*: cached data keyed by InSIS user and wiped on logout, identity change, session expiry and user
  mismatch; activity window kept below InSIS's idle logout (15 min until measured); the new-documents list marked
  `verify` until a read is shown not to change InSIS's counter.
- *Home*: To do holds only must-dos (sign-off deadlines moved to My dates and Today; elections and surveys to an All
  services badge); one Home surface per fact (no duplicate banners or notices).
- *InSIS+ settings* in the avatar menu: pause reads, clear data, To do choices, Classic view, privacy.
- *Labels*: course tab **Points / Body** (no clash with the Grades destination); visible **CS / EN** switch on
  desktop; online tests to do shown on the course Overview; Menu labels in `mapping.json`.

**Round 7** (IA review):
- *verify split*: `verify` only for parameter sets never seen (no link, no read); `verify_data` for unconfirmed
  data or side effects (feature off, links kept); registration, mail box, teaching weeks and surveys linkable again.
- *Privacy vs notifications* (seen record refined in round 8): personal data in session-only storage, wiped on browser close, logout, identity
  change, user mismatch and by an idle timer even without an InSIS tab; only a hashed per-user seen record
  survives; notifications use InSIS's own markers (result "Entered" date, the main-page new-files counter — the new
  files list is no longer read in the background).
- *Details*: course evaluation optional in To do; activity window 10 min until measured, and its effect on InSIS's
  idle logout stated; To do exam item counted through Available dates; Today column recounted (one-click menu items);
  synonyms fixed; online tests on the course Overview sourced; "Praxe a pracovní nabídky".

**Round 8** (IA review):
- *Notifications across sessions*: exactly what is kept per user is listed (principle 8.2) and stored plainly, not
  as "hashes"; a Shared computer mode keeps nothing; the files notification fires when the count differs, not only
  when it grows.
- *One activity window*: 10 minutes for background reads and for the wipe timer.
- *Counts*: course evaluation (To do item off by default) and Change password marked as regressions.
- *Minor*: document server root and teaching weeks no longer read in the background (nothing used them); settings
  kept per user; registration-round To do dismissible; Language only in the phone avatar menu; Diskuse; Termín.

**Round 9** (IA review):
- *Exam actions*: the crawl shows no form on the exam date page, so every exam action happens on InSIS's own exam
  list, shown unchanged with a summary above and the course highlighted; where the controls sit is listed as to
  verify while dates are open; counts marked accordingly.
- *New course files list* is `read: never` (only the student opens it).
- *Polish*: Language only in the phone avatar menu; "date cancelled" rule simplified (no sign-off timestamp kept);
  noticeboard not read at all; main page notices "seen" effect listed to verify; `ia_check.py` also compares
  `form` with the crawl.

**Round 10** (IA review):
- *Reads*: seven settings pages the crawl never opened are `read: never` (links stay); the main page is not read in
  the background at all, because Home is that page and reads it when the student opens it; `ia_check.py` fails if
  a page never opened by the crawl has fetch sets.
- *Form marks*: every crawled page with an action button (not a filter) is marked `form`, checked both ways
  (e.g. discussions, publications, group e-mail to classmates, exports).
- *Polish*: `vystup` pinned on syllabi; `index.pl` = trailing `/`; `verify` pages carry no link or fetch sets
  (checked); lectures-sheet "seen" effect listed to verify.

**Round 11** (IA review):
- *External links*: the URL rule covers insis.vse.cz; an `external` allow-list (Moodle, Outlook) plus links copied
  verbatim from InSIS (e-mail addresses, app stores, support); nothing outside InSIS is ever fetched; checked.
- *Exam tabs*: variants use InSIS's real values (`zalozka=1` available, `2` past, `3` without dates); variant-key
  grammar defined in `mapping.json`.
- *Polish*: To do sources include Home's own page; course evaluation list read in the background only while its
  optional To do item is on; Shared computer is a per-browser choice; "Who can help?" footer sourced from Who to
  ask; duplicate menu entry removed; future per-user state for registration results noted.

**Round 12** (IA review):
- *Exams*: My dates and Available dates are both summaries over InSIS's "currently offered" tab; the URL without a
  tab parameter maps to My dates, `zalozka=1` to Available dates, so the right tab is highlighted after InSIS's own
  back-links.
- *Polish*: registered-students list only through InSIS's own link; main-page sources refresh "when Home is
  opened"; Points marked to verify; Moodle link hidden until its host is confirmed; Shared computer mode compares
  results with the session start; `incognito: split`; compose page no longer fetched; avatar menu text aligned.
- *Outside the IA*: `sync.js` (0.6.0) reads the document server tree in the background; draft 18 keeps that read
  (see round 17).

**Round 13** (IA review):
- *Language*: InSIS's language links are copied verbatim from the page, like Log out (the crawl normalised `lang`
  away, so no parameter set is claimed for it).
- *Next degree*: a placeholder that explains where to apply and links to Who to ask until the page is verified;
  admission documents point to Confirmations & decisions.
- *Registration*: one Home surface — a To do item and a badge, no banner.
- *Polish*: Moodle "once confirmed" everywhere; footer links to Who to ask; exam controls: columns seen, the
  control itself to verify; error pages `never` / `insis-only`; `terminy_info.pl` note aligned.

**Round 14** (IA review):
- *Course › Files*: the crawl shows course-folder links on the lectures sheet and the document server's tree, not
  on "All my folders" (empty in the crawl; its real view uses an unreviewed parameter); the folder link comes from
  those, read when the course page opens, and is marked to verify (until then Files links to all folders).
- *Polish*: "Display reason" on the exam list maps to Available dates; language links described as copied, as in
  `mapping.json`; InSIS's "Log out" column named in the Change date explainer; course evaluation note aligned.

**Round 15** (IA review):
- *Navigation parameters*: `lang`, `zpet`, `back` and `_m` (normalised away by the crawl) now have an explicit rule:
  never added by InSIS+; tolerated on copied links; `zpet` / `back` values checked recursively as InSIS URLs; `_m`
  exempt from the deny pattern but to verify with an un-normalised snapshot; `ia_check.py` knows the list.
- *Polish*: `mapping.json` comment rewritten; `ia_check.py` docstring lists every check; one wording for `lang`;
  the Change date step defined.

**Round 16** (IA review: *ready for user review*, polish only): `zpet_student` and `skoc_zpet` values pinned;
fetch URLs always built, never copied; the deny-list clause applies to every URL; `verify` menu pages reachable via
Classic view; pages skipped by the crawl but linked listed to confirm.

**Round 17** (user feedback on draft 17):
- *Home keeps today's dashboard rail*: week strip, timetable with "Full timetable →", new materials by course,
  teaching hours chart.
- *Full timetable*: "Full timetable →" opens Schedule › My week (InSIS+'s week view, with the week strip and hours on
  top).
- *Document server is a top path*: Courses › **Materials** is the second tab; Home › New materials opens a course's
  folder in one click. The document server tree (`dok_server/`) is read in the background again for per-course
  new-file counts: the crawl opened the tree and folders and InSIS's own "10 new documents" counter did not change,
  so reading the tree marks nothing as read (the new-documents *list* stays never-read).
