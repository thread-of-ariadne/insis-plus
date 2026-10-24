# Teardowns: Exams, Grades & credits, Schedule (draft 1)

Applies `03-pages.md` (navigation rules §1, page anatomy §2, treatments §3) and `02-redesign.md` §1 (above all
principle 7), §3 (Schedule, Exams, Grades & credits) and §6 (To do) to every page type in `mapping.json` whose node
(or `variants` value) starts with `exams.`, `grades.` or `schedule.`.

Evidence: the crawl (`test/fixtures/private/map/crawl.json`), the logged-in snapshots `timetable-personal*.html`,
`study-record*.html`, `plan-progress.html`, `study-plans.html`, `tests.html`, `weeks.html` (all in
`test/fixtures/private/`), and the current modules `pages/timetable.js`, `pages/study-record.js`, `generic.js`,
`todo.js`. No personal data from the snapshots is reproduced here: structure only.

Conventions used below. *Slotted* = InSIS's own element moved into the InSIS+ page on the same page, never copied,
never submitted by InSIS+ (`03-pages.md` §2.6). *In place* (treatment L) = InSIS's list element stays InSIS's DOM in
InSIS's row order; InSIS+ may only add classes and `data-*` attributes to it and style it, never insert, move,
clone or re-order rows, cells or controls. Everything InSIS+ draws itself goes outside that element.

---

## 1. Inventory

Now: **M** = own module, **S** = generic shell only. Snapshot: **✓** file in `test/fixtures/private/`, **crawl** =
only the crawl's structure, **–** = nothing.

| Page type (path, variant) | Node | Now | Snapshot | Treatment | Reason |
|---|---|---|---|---|---|
| `student/terminy_seznam.pl` (no `zalozka`) | exams.mine | S | crawl | **L** | the list holds InSIS's sign-up and sign-off controls; InSIS+ adds the "my dates" summary above it |
| `student/terminy_seznam.pl?zalozka=1` | exams.signup | S | crawl | **L** | same InSIS tab as above; InSIS+ adds the "open for sign-up" summary and focuses the sign-up table |
| `student/terminy_seznam.pl?zalozka=2` | exams.past | S | crawl | **R** | past dates carry no action, so the list is rebuilt fully |
| `student/terminy_seznam.pl?zalozka=3` | exams.unscheduled | S | crawl | **R** | a three-column list of courses without dates; no action |
| `student/terminy_seznam.pl?termin,zobraz_duvod` | exams.signup | S | crawl | **R** | one "Reason:" line why a date cannot be signed up for |
| `student/terminy_info.pl` | exams.date | S | crawl | **R** | key–value details of one date; no form seen in the crawl |
| `elis/ot/psani_testu.pl` | exams.tests | S | ✓ `tests.html` (empty list) | **L** | starting a test is InSIS's irreversible control in the list |
| `elis/ot/psani_testu.pl?vysledky` | exams.tests | S | crawl (empty) | **R** | submitted tests are information only |
| `student/pruchod_studiem.pl` (default, `vyber=…`) | grades.results | M | ✓ `study-record.html` (+ `-cs`) | **R** | information only; the module exists but shows InSIS's 7 views and the portal links |
| `student/pruchod_studiem.pl?…predmet,vybrane_zobrazeni` | grades.results | S | crawl | **R** | attempts of one course; read on click into the Results row, page itself rebuilt |
| `student/mapa_studii.pl` | grades.plan | S | crawl | **R** | a year grid of the study; becomes a timeline block of What's left |
| `studijni/studijni_povinnosti.pl` | grades.plan | S | ✓ `plan-progress.html` (835 kB) | **R** | the "what's left" answer, buried in ~950 table rows |
| `katalog/plany.pl` (no parameters: faculties) | grades.plans | S | ✓ `study-plans.html` | **R** | a list of faculty links |
| `katalog/plany.pl?fakulta` | grades.plans | S | crawl | **R** | periods × study systems list; one InSIS button "Display past periods" |
| `katalog/plany.pl?fakulta,poc_obdobi,typ_ss` | grades.plans | S | crawl | **R** | list of study types |
| `katalog/plany.pl?fakulta,misto_vyuky,poc_obdobi,typ_ss,typ_studia` | grades.plans | S | crawl | **R** | list of programmes |
| `katalog/plany.pl?fakulta,(info,)misto_vyuky,poc_obdobi,program,typ_ss,typ_studia` | grades.plans | S | – (links only) | **R** | programme info / its plans; never crawled |
| `katalog/plany.pl?fakulta,matice` | grades.plans | S | crawl | **R** | plans × course groups matrix; a real table, kept as a table component; InSIS's "Display matrix" form slotted |
| `katalog/plany.pl?fakulta,skupina_predmetu_id,studijni_plan` | grades.plans | S | crawl | **R** | courses of one group of a plan (up to ~970 links) |
| `katalog/rozvrhy_view.pl?…rozvrh_student…` (personal) | schedule.week | M | ✓ `timetable-personal.html` (+ `-cs`) | **R** | the module exists; its InSIS display form still sits at the bottom of the page |
| `katalog/rozvrhy_view.pl` (no parameters: criteria) | schedule.search | S | crawl | **F** | the page is InSIS's search form |
| `katalog/rozvrhy_view.pl?konf` / `konf,vse` / `f,konf` / `k,konf,z` / `k,konf,rozvrh,z` | schedule.search | S | crawl | **F** (`konf,vse`: **R**) | steps choosing which published timetables to search; checkbox forms (the department list is links only) |
| `katalog/rozvrhy_view.pl?id,rozvrh_ucitel` | schedule.search | S | crawl | **R** | a teacher's weekly grid, the same component as My week |
| `katalog/rozvrhy_view.pl` (POST result: course / room / programme grid, `format=list`) | schedule.search | S | – | **R** | result grids of the search; never captured |
| `student/harmonogram.pl` (no parameters, `vyber_fakulty`, `fakulta`) | schedule.calendar | S | crawl | **R** | faculty and period pickers (links) |
| `student/harmonogram.pl?fakulta,obdobi(,studium)` | schedule.calendar | S | crawl | **R** | the academic year schedule: dated events |
| `ca/prehled_tydnu.pl` | schedule.calendar | S | ✓ `weeks.html` (empty: "no study period with active courses") | **R** | teaching weeks; a view of Academic calendar, hidden when empty |
| `ca/konfigurace_prenosu_udalosti.pl` | schedule.export | S | – (manual crawl, no content) | **F** | InSIS's Office 365 transfer settings: a standing configuration only the student changes |

---

## 2. Teardowns

### 2.1 Exam dates (`student/terminy_seznam.pl`, four views)

**Purpose.** The single most stressful job in InSIS: find the date for each course, sign up before places run out,
know the sign-off deadline, change a date. Daily during the exam period and the weeks before it; otherwise
rarely (Past after results, Not yet scheduled when waiting).

**What is on the InSIS page** (crawl, English; Czech the same structure).
- Breadcrumb "My College › Register for examinations", the "Student's portal" heading with the study and period,
  the 11-link portal bar, then InSIS's own tab row: *List of currently offered exam dates* (no `zalozka` or
  `zalozka=1`, identical content), *List of past exam dates* (`zalozka=2`), *List of courses without exam dates*
  (`zalozka=3`).
- Help paragraph, then a filter form (post): `filtr_predmet` (course), `filtr_druh` (kind), `filtr_vypsal` (put up
  by), button *Restrict* (`jen_predmet`).
- Current tab, three tables (each wrapped in an empty post form):
  1. "Which exam sittings I have registered for": Ord. · Code · Course · Study period · Date of exam sitting ·
     Where · Type (form) · Put up by · Registered · Type of exam sitting · *Registration from / Register until /
     Unregister until* (three dates in one cell) · Information (icon link *Details* → `terminy_info.pl`) · **Log out**
     (the sign-off control).
  2. "Which exam sittings I can register for": the same columns plus **Status**, then *Actions* and **Register**
     (the sign-up control).
  3. A third table without the Register column, whose rows carry *Display reason* (→ `zobraz_duvod=1`): by
     inference the dates the student cannot sign up for (heading cut off in the crawl: **to verify**).
- Past tab: "Exam dates I attended" (adds *Exm.att.*, the attempt) and "Exam sittings realized" (other past dates
  of my courses); Information column only; the same *Restrict* form.
- Not yet scheduled tab: "Which exam sittings I cannot register for yet": Code · Course · Course supervisor.

**What is wrong.**
- InSIS: three tab-ish rows (portal bar, InSIS tabs); 13 columns where the student needs four facts (course, when,
  where, places); three deadlines crammed into one cell; the controls are unlabelled icons; the dates I am
  registered for and the dates I can take are two tables with the same columns, so changing a date means
  comparing rows across tables; nothing says which deadline is next.
- InSIS+ today: generic shell only (`generic.js`): title "Register for examinations" from the breadcrumb, the whole
  `#str1` slotted with recoloured tables. No summary, no highlight, no To do source, no Notifications source,
  though `02-redesign.md` §6–7 depend on this page.

**Rebuild.**
- **Header**: eyebrow *Exams*, title **Exam dates** (`section_labels`), subtitle the exam period of the current
  period from the academic calendar ("Exam period 4 Jan – 14 Feb", from `harmonogram.pl`, when read). Page actions:
  *Change date* (opens the explainer sheet, below) and nothing else.
- **View tabs** (`ui.viewTabs`, allowed by rule 5 / `structure.views`): **My dates** · **Available** · **Past** ·
  **Not yet scheduled**. Each tab is a link to InSIS's URL (no `zalozka` / `zalozka=1` / `=2` / `=3`), so the view
  survives reload and InSIS's own tab state matches. A tab whose list is empty stays (it is a view of the student's
  own list, and "nothing yet" is information) but shows its count as 0.
- **Summary** (per view):
  - *My dates*: one row per registered date, soonest first: course, weekday + date + time, room, "Sign off until …"
    with a countdown; a sign-off deadline within 2 days is highlighted (same tone as Today and next). Above the
    rows, a status line: "Registered for N of M courses · K courses still without a date" (M = my courses with an
    exam or credit test this period, from the e-study record).
  - *Available*: dates open for sign-up grouped by course, my unfinished courses first, each with places left
    (from *Registered* "x/y"), "Sign up until …" countdown, and "opens …" for dates not open yet; courses already
    passed (e-study record) are collapsed under "Already passed".
  - Each summary row ends with **Go to the date ↓**: it scrolls InSIS's list to that row and highlights it. It never
    links to, copies or triggers the row's control (principle 7.3).
- **Content** (current views): InSIS's three tables, **in place**, under one line: "Sign up and sign off with
  InSIS's buttons in this list. InSIS asks you to confirm." (wording to confirm with the snapshot). Restyling:
  rows of the student's courses get `data-ipx-mine`; rows whose sign-off deadline is within 2 days get
  `data-ipx-due`; *Ord.*, *Study period* and *Put up by* columns are hidden by CSS; cells get `data-label` so on a
  phone each row reads as a card (course, date, room, places, deadlines, then InSIS's control); the three-date cell
  keeps InSIS's text, laid out as three lines by CSS. Table 3 gets the heading "You can't sign up for these yet"
  (InSIS+'s heading, drawn outside the table) and its *Display reason* links stay InSIS's.
- **Past** (R): one list grouped by course: date, type, attempt (from *Exm.att.*), room; each course row links to
  Grades & credits › Results at that course (`pruchod_studiem.pl?obdobi,studium` + highlight). No results are
  shown here (Results owns them, §3).
- **Not yet scheduled** (R): a list of courses with the supervisor as a person link, the note "Dates for these
  courses are not published yet; this is normal before the exam period. You'll get a notification when they
  appear."
- **Rail**: the exam period on a small timeline (registration opens, exam period, last day to sign off), my
  registered dates as marks on a month strip, and "Online tests open: N" when the tests list has some.
- **InSIS's forms**: the *Restrict* filter form is not shown: InSIS+'s summary already groups by course, and a
  filter would only hide rows. When the page arrives already filtered (InSIS keeps the filter in the session),
  a line says "InSIS is showing only <course> · Show all" where *Show all* is the unfiltered tab link. (If testing
  shows students need the *Put up by* filter, the form is slotted as a form card under the list instead; it is
  never filled in by InSIS+.)
- **Change date sheet** (same page, opened by the page action): the order to follow (sign up for the new date
  first where InSIS allows it; signing off first can lose the place), then the student's registered dates, each
  with "Other dates of this course ↓", which closes the sheet and highlights that course's rows in the list.

**Data to parse.** Per row of each table: table kind (registered / can register / cannot register / attended /
realised), course code (from the syllabus link's `predmet` and the Code cell), course name, date and time, room
(link to `mistnosti/`), type (form), kind of sitting (regular / resit), registered and limit, the three
registration dates, the `termin` id from the *Details* link, presence of a control in Log out / Register, the
Status text. Not-yet-scheduled: code, name, supervisor link. Feeds: To do "Exam or credit date to sign up for",
Notifications "Exam dates published" and "Exam date changed or cancelled", Today and next (registered dates),
the stored per-user set (date id, time, room; course codes with dates; principle 8.2).

**Safety.** The *Register* and *Log out* controls (and whatever confirmation step follows them) are InSIS's; InSIS+
never clicks, focuses, prefetches, copies or follows their URLs, and the background read of this page
(`read: background`) loads only the list itself. Summary rows link to rows, never to controls. *Restrict* is never
submitted. *Display reason* and *Details* are plain links (allowed sets `obdobi,studium,termin,zobraz_duvod` and
`obdobi,studium,termin`). No element is inserted into InSIS's tables, so InSIS's scripts and row indices stay
valid.

**Needs a fresh snapshot.** The current tab while dates are open, with rows in all three tables (markup of the
Register and Log out controls: link or form button, which parameters, whether a confirmation page follows; the
Status values; the heading of table 3; the *Registered* format). The Past and Not yet scheduled tabs with rows. The
page after *Restrict* (how the filter is shown).

### 2.2 Exam date details (`student/terminy_info.pl`) and Reason (`terminy_seznam.pl?zobraz_duvod`)

**Purpose.** Check everything about one date (form, duration, exact room, limit, who may sign up). Occasional,
linked from the list's *Details*.

**InSIS page.** Breadcrumb "My College › List of exam sittings › Information about exam date", portal bar, then
label–value lines: Exam date for course · announced by · Kind · Form · Duration · Type · (Type of your exam
sitting, when registered) · Date · Venue · Registration since / until · Unregistration until · Just registered ·
Limit · Reserve · Programme · Form / Character of study · Place of teaching · Group of students · ISP · Tests for
the exam date. A link to the list of registered students (`spoluzaci`, insis-only).

**Wrong.** Twenty lines of equal weight; the three dates that matter (when, sign-up and sign-off deadlines) are in
the middle; the eligibility lines (programme, form, group) are noise unless the student cannot sign up.

**Rebuild (R).** Header: eyebrow *Exam dates*, title "<course name> · <kind>" (e.g. "… · Exam"), no page actions.
Summary: when (weekday, date, time, duration), where (room link), places "x of y (reserve r)", status line
"You're registered" / "Sign up until …" / "Sign-up opens …". Content: a description list in two groups,
"Dates" (sign-up from, until, sign-off until) and "Who can sign up" (programme, form, place, group, ISP, collapsed
by default); "Tests for this date" as links when present. The registered-students link stays InSIS's own link,
copied verbatim (insis-only). No back link: the sidebar highlights Exam dates.

**Reason page (R).** Header title "Why you can't sign up", the reason text as a status card, and one line: "Sign-up
rules are set by the department; ask the teacher who put up the date" with the teacher link when InSIS gives it.

**Safety.** No forms seen. If the snapshot shows a sign-up control here, it stays InSIS's, slotted as a form card
with the one-line explanation, and the summary says "Sign up below".

**Snapshot.** `terminy_info.pl` for a date I can sign up for (does it hold a control?) and for a registered one;
the reason page with a real reason.

### 2.3 Online tests (`elis/ot/psani_testu.pl`, `?vysledky`)

**Purpose.** Start a test the teacher opened (in-semester quizzes and some exams); later see that it was submitted.
Rare but time-critical.

**InSIS page.** No portal bar; its own two tabs *Tests to do* / *Submitted tests*; a long help paragraph ("To take
the exam click on the relevant icon. This transaction is irreversible …"); a post form around the list; the empty
state "At the moment no tests are available for you to do."

**Wrong.** The single most important sentence ("irreversible: the test starts and the time runs") is in the
middle of a grey paragraph; the start control is an icon; the empty state gives no next step.

**Rebuild.** Header: eyebrow *Exams*, title **Online tests**. View tabs: *To do* · *Submitted* (InSIS's own two
URLs; rule 1: views of one tool). Summary: "N tests open · next closes <countdown>" or the empty state "No test is
open now. Teachers open tests at a set time; To do on Home shows one as soon as it opens."
- *To do* (L, in place): InSIS's list styled as cards (course, test name, open from–until, time limit, attempts);
  above it a warning line in the alert tone: "Starting a test can't be undone: the timer starts when you press
  InSIS's start button." The start control stays InSIS's, in place.
- *Submitted* (R): course, test, submitted at, score when InSIS shows it, InSIS's link to the result.
- Rail: none (the page is short).

**Data.** Per test: course code, name, open from / until, time limit, start control present. Feeds To do "Online
test open" (refresh 6 h) and the Exam dates rail count.

**Safety.** The start control is InSIS's only; To do, Home and the course page link to `psani_testu.pl`, never to
a test URL. The empty post form is never submitted.

**Snapshot.** *Tests to do* with an open test (markup of the row and the start control); *Submitted* with a
result.

### 2.4 Results: the e-study record (`student/pruchod_studiem.pl`)

**Purpose.** "Did I pass, what grade, how many credits": after every exam result (the Notifications "Result
entered" leads here) and at the end of each period. Weekly in the exam period.

**InSIS page** (`study-record.html`, crawl). Portal bar (11 links), then a second link row with **seven views**
(`vyber=`): *Current basic overview* (`vybrane_obdobi`), *Basic overview for the whole study* (`vsechna_obdobi`),
*Statistical information for the whole study* (`stat_info`), *Current detailed overview*
(`podrobne_vybrane_obdobi`, the default), *Detailed overview of the whole study* (`podrobne_vsechna_obdobi`),
*Credit statistics* (`stat_studia_kred`), *Study results comparison* (`zobrazeni_percentilu`). Then a help
sentence, per period a bold label and a course table (detailed: Code · Course · Compulsory (icon) · Lang. · Com.
(completion) · Attempt (a number linking to that course's attempts) · Result · Entered · Entered by · ECTS ·
Group · Credits · Type (icon); basic: without Code, Entered, Entered by), a two-column statistics table (credits
enrolled / obtained / not earned / lost, courses completed / not completed / recognised / unregistered, three
averages), a collapsible icon key and the ECTS key. Per-course attempts page: Attempt · Result · Entered by · Date.

**Wrong.**
- InSIS: seven views are really a 2 × 2 grid (this period / whole study × basic / detailed) plus three statistics
  pages; basic vs detailed only hides three columns. Two icon-only columns need a key. The statistics are a list
  of eleven sentences.
- InSIS+ today (`pages/study-record.js`): KPIs and per-period cards are right, but it shows all seven InSIS views
  as link tabs (rule 1 broken in spirit: three of them duplicate others), and the **rail repeats the portal bar**
  as "Student's portal" links (§1 rule: portal bar hidden everywhere; rail is context, never navigation). The
  attempts page falls through to the generic shell. Unrecognised parts are slotted below ("More from InSIS"),
  which on the statistics views is most of the page.

**Rebuild (R).**
- **Header**: eyebrow *Grades & credits*, title **Results**, subtitle the period ("Winter 2026/27") or "Whole
  study". No page actions (What's left is a place: the rail links it).
- **View tabs** (4): **This period** (`vyber=podrobne_vybrane_obdobi`) · **Whole study**
  (`vyber=podrobne_vsechna_obdobi`) · **Statistics** (`vyber=stat_info`) · **Comparison**
  (`vyber=zobrazeni_percentilu`). The basic views are never offered: InSIS+ always links the detailed variant and
  shows the extra columns in the row's detail. A copied link to a basic view still renders (as This period /
  Whole study). *Credit statistics* is shown inside **Statistics** as "Credits by period" (a link to InSIS's URL
  at the bottom of that view) until a snapshot shows whether it is a per-period table, then it becomes that
  view's second block.
- **Summary**: KPIs: credits earned / enrolled (this period) or earned in total (whole study); average as InSIS
  states it; passed of N; in progress (no result yet). One status line when a result was entered since the last
  visit: "New result: <course>".
- **Content**: per period a card list: course name (syllabus link), completion (exam / graded credit / credit),
  result as a tone chip (passed / failed / no result yet) with the grade and ECTS letter, credits; the icon
  columns become text chips (compulsory / elective / optional; usual / extra-semestral …) using InSIS's key text.
  Row detail (disclosure): entered on, entered by (person link), language, group, and **Attempts (n)**: opening it
  reads the attempts page for that course (`obdobi,predmet,studium,vybrane_zobrazeni`, a fetch set, read on the
  student's click) and lists attempt · result · date. The ECTS key becomes a gloss on the ECTS letter.
  Statistics view: the period block and the whole-study block as description lists, the three averages as one
  KPI row. Comparison view: drawn after its snapshot; until then InSIS's content slotted under a line saying what
  it compares.
- **Rail**: "What's left" mini card (credits earned of required and missing, from the plan check when read in
  this session; otherwise a link card "See what's left in your plan"), and "Exam dates for unfinished courses"
  (from the Exam dates cache, linking to Exam dates › Available with the course highlighted). No portal links.
- **InSIS form**: the page's post form has no fields; nothing to slot.
- **Attempts page opened directly** (R): header "Attempts · <course>", the attempts list; no back link.

**Data.** As stored now (`ipx.state.studyRecord`), plus `attempts` per course on demand and the result's
*Entered* date (Notifications "Result entered"; To do needs "passing result" to stop asking for sign-up).

**Safety.** Links only. Reading the attempts page on click is a plain GET from an allowed fetch set.

**Snapshot.** `vyber=podrobne_vsechna_obdobi` (several periods), `stat_info`, `stat_studia_kred`,
`zobrazeni_percentilu`; a record with a failed attempt, a recognised course and a resit (Attempt > 1); how the
period is changed on this page (a link or form in the header area: principle 6 says only InSIS's own period
control shows).

### 2.5 What's left: plan check (`studijni/studijni_povinnosti.pl`) + map of my study (`student/mapa_studii.pl`)

**Purpose.** "Am I on track: how many credits do I still need, which compulsory courses haven't I taken, how much
of each elective group is left." Before every registration round, and anxiously in the last year.

**InSIS page** (`plan-progress.html`). Portal bar; help sentence; two status lines with icons ("Some requisites for
submitting the final thesis failed to be fulfilled." / "The study plan has not been completed yet."); a summary
table (Study, Credits "x obtained out of y of compulsory (MISSING z crd.)", Initial period, Type of study system);
a paragraph about *Show all courses of a plan* / *Show studied courses only* (`href="#"`, JS); then **one table of
~990 rows**: per group a header row ("<group code> - <name> (t: 1|2|3)" and "A group of elective courses (min. N
crd.) - NOT ACCOMPLISHED missing M credits" or "A group of optional courses"), column heads Code · Course title ·
Mode of completion · Credits · Enrolled ("1x") · Status (ENROLLED / NOT ENROLLED / FULFILLED (date)), and per-group
JS links. Every course is present **twice** (`tr.predmety_vse_*` = all courses of the group, `tr.predmety_*` =
studied only), each with two syllabus links: ~930 rows, ~1 880 links, 835 kB. Optional groups (general electives,
physical education) alone hold hundreds of courses. A small legend table at the end.

*Map of my study* (crawl only): portal bar, a heading with the student, a table whose columns are calendar years
(three in the crawl) and the programme line: a year-by-year picture of the study.

**Wrong.**
- InSIS: the answer (missing credits per group, compulsory courses not taken) is spread across a page so long that
  browsers stall; the default view lists every course of optional groups; status words in capitals; the group type
  is a cryptic "(t: 2)".
- InSIS+ today: generic shell, which slots the whole 835 kB table and then restyles it: the slowest page in the
  extension, no answer on top. Map of my study: generic shell, a separate page nobody finds.

**Rebuild (R).** One place: **What's left** (node `grades.plan`); Map of my study is a block on it, not a section.
- **Header**: eyebrow *Grades & credits*, title **What's left**, subtitle the plan ("Business Informatics, from
  winter 2026/27" in the student's words, from the summary table). No page actions.
- **No view tabs** (one thing, one view; "all courses vs studied" becomes per-group disclosure).
- **Summary**: a progress bar "x of y credits" with "z still needed"; KPIs: compulsory courses left (count of
  NOT ENROLLED in compulsory groups), groups accomplished of N, credits enrolled now (in progress). InSIS's two
  status lines as status chips: "Plan not complete yet" (neutral), "Thesis requirements not met yet" (warn, linking
  Study matters › Thesis & state exam).
- **Content**: one card per group, ordered compulsory → elective → state exam → optional: name (code as small
  text), type in words (compulsory / elective / optional), a progress bar "earned of min. N credits" and the status
  ("Done" / "12 credits missing"). Inside: the student's courses of the group (fulfilled with date, enrolled now)
  and, for compulsory groups, the courses not taken yet (they *are* what's left). For elective groups:
  "Choose from N courses" opens a searchable list rendered on demand, 50 at a time. For optional groups (more than
  ~50 courses): only the count and "Browse in the catalogue / study plans" — never rendered in full.
- **Study timeline block** (from `mapa_studii.pl`, read on open, `obdobi,studium`): the years of the study as a
  horizontal strip with the current period marked; "Open the full map" links InSIS's page. Its exact content is
  decided after the snapshot.
- **Rail**: "This period" (credits enrolled, link to Results), "Next registration round" (from the academic
  calendar, linking Courses › Registration & enrolment).
- **InSIS form**: the page's post form has no fields; InSIS's `#` JS links are dropped (InSIS+ has its own
  disclosure).

**Performance (decisive).** The module hides `#str1` before first paint (a CSS class set at the earliest point the module
runs), parses only the `tr.predmety_vse_*` rows (the superset) plus
group header rows in one pass, keeps plain data (no DOM references), and never slots the original. It is
`read: on-open` only (as mapped): never in the background. Target: < 150 ms parse on a mid laptop.

**Data.** Summary: obtained, required, missing, initial period, system; the two status lines. Per group: code,
name, type (t), min credits, missing credits, accomplished flag. Per course (deduplicated by code): code, name,
syllabus link (`aktualni,poc_obdobi,predmet`, allowed), completion, credits, times enrolled, status, fulfilled
date. Map: years, periods, markers (after snapshot).

**Safety.** Links only (syllabus, InSIS's own pages). Nothing to submit.

**Snapshot.** `mapa_studii.pl` (HTML; the crawl has only its heads). A plan check of a student in a later year
(accomplished groups, recognised courses, state exam group with dates) to confirm the status vocabulary.

### 2.6 Study plans (`katalog/plany.pl`, drill-down)

**Purpose.** Look at a programme's plan other than through my own check: choosing electives, a minor, a next
degree. Rare.

**InSIS page.** A public drill-down without tabs: faculties (links) → per faculty a "matrix of study plans" link
and a table Type of study system · Initial period · View, with an InSIS button *Display past periods* (post,
`vsechna_obdobi`) → types of study → programmes (Code · Programme · Language · Information · View · Bodies) →
plans → courses of a group (Code · Course · Mode of completion · Credits · Study period · Changed · Changed by,
sometimes ~970 links). The matrix: plans (rows, ~25+) × group codes (~30 columns), with a form (`matice_typ_spec`,
`matice_typ_ss`, `matice_poc_obdobi`, `aktualne_studovane`, *Display matrix*). Breadcrumbs are the only context.

**Wrong.** Five steps of near-empty tables; context only in truncated breadcrumbs ("Presentation of study
programm…"); faculties in InSIS's order with the student's faculty buried; the group page lists "Changed by"
(staff data no student needs).

**Rebuild (R, each step).** Header: eyebrow *Grades & credits*, title **Study plans**, subtitle the path so far in
words ("FIS · winter 2026/27 · Master's") — InSIS+'s own context line, not InSIS's breadcrumbs. No view tabs (steps
are a drill-down, not views). Summary on the first step only: "Your own plan and what's left in it are in What's
left" (link card). Content: each step as an InSIS+ list (my faculty first, then the rest; periods newest first;
programmes with language chips); the course-group step as a searchable list with credits and completion; the
matrix as a table component with a sticky first column and header, horizontally scrollable. InSIS forms: *Display
past periods* and the matrix form are slotted as small form cards with one line each ("Show older plans — InSIS
reloads this list"; "Change what the matrix shows — InSIS redraws it"). Rail: none.

**Data.** Link lists per step (text + href, passed through the URL rule), table rows of the group page.

**Safety.** Only the two InSIS filter forms; never submitted by InSIS+.

**Snapshot.** One HTML per step (`fakulta`, `fakulta,poc_obdobi,typ_ss`, programme list, the never-crawled
`program` steps, group page, matrix) to fix selectors; the crawl has headings only.

### 2.7 My week: personal timetable (`katalog/rozvrhy_view.pl?…rozvrh_student…`)

**Purpose.** "Where and when is my next class, what does this week look like." Several times a week (Home covers
the next class; this is the full view).

**InSIS page** (`timetable-personal.html`). H1 "Personal timetable for student <name>", breadcrumb "Main page ›
Select criteria › …", one grid table with **5-minute columns** (08:00–08:05 …) and a row per day (or per date in
"particular in days" mode), class cells `rozvrh-pred` (lecture) / `rozvrh-cvic` (seminar) with room, course and
teacher links and footnote marks; notes table; key; "Last change: …". Under it InSIS's **display form** (post):
*Type of list* radios `typ_vypisu` = total weekly / particular in days / exemptions in days, *since / till* dates,
*Format* = HTML / List of timetable items / PDF, checkboxes (all versions of unselected items, notes, notes for
events, other teachers), *Display*.

**Wrong.**
- InSIS: a 150-column grid that scrolls sideways; dates and weekdays mixed; the form is the only way to see a list
  or a PDF and it is labelled for staff.
- InSIS+ today (`pages/timetable.js`): the week view, KPIs, week strip, next classes and hours chart are right, but
  (1) the page title is "Timetable", not the section label **My week**; (2) `keepOnly()` leaves **InSIS's display
  form slotted at the bottom of the page** under "Options", reachable by a "Print" action that scrolls down: an
  InSIS form as page furniture, which is exactly the "overlay" feeling; (3) a "Change criteria" page action goes to
  the timetable search, another place (the sidebar does that); (4) the per-course summary and the phone list are
  stacked below the grid, so the page is three pages long.

**Rebuild (R).**
- **Header**: eyebrow *Schedule*, title **My week**, subtitle the timetable's date range. Page actions (2):
  **Today** (back to the current week; hidden when it is shown) and **Export and print**.
- **View tabs** (client-side views of the same parsed data): **Week** (grid on wide screens, day list on phones)
  · **All dates** (every session of the period by date, filterable by course; the answer for block-taught and
  irregular classes) · **Courses** (one card per course: when, who, where, number of sessions).
- **Summary**: classes this week, hours, next class (time, room), courses; a hint line when the shown week is not
  the current one.
- **Content**: Week: back / forward by week, the grid or list; each class links to its room and course; past
  classes of this week offer "Absent? Excuse note" (→ Study matters › Excuse notes).
- **Rail**: week strip, next classes, teaching hours chart, "Last change" from InSIS.
- **Export and print** (one place per job, rule 4): a side sheet on the same page with two parts: (a) **To your
  calendar**: link card to InSIS's *Configure transfer of events to Office 365* (`konfigurace_prenosu_udalosti.pl`)
  "appears in Outlook and phone calendars connected to your university account"; (b) **Print, PDF or list**:
  InSIS's display form, slotted into the sheet as a form card, with the line "Choose the format and press InSIS's
  Display. PDF downloads a file; List and HTML reload this page. Your timetable itself doesn't change." The form
  is no longer anywhere else on the page.
- **Modes**: when InSIS returns the weekly template (`souhrn`), Week shows it with the note "a weekly overview
  without dates"; All dates is hidden (no dates). The *exemptions in days* result (`vyjimky`) and the *List* format
  result are drawn as All dates with a "Changes only" chip once a snapshot shows their markup; until then the
  module steps aside to the generic shell for them.

**Data.** As stored now (`ipx.state.timetable`: events with date/weekday/start/end/code/name/type/room/teacher/
note/people, range). Add the shown mode (`typ_vypisu`) so Home knows whether dates are real.

**Safety.** The display form is InSIS's; InSIS+ never changes its radios, dates or format and never submits it.
The PDF result is a download made by InSIS on the student's click. Background reads use only the `format=html`
fetch sets.

**Snapshot.** Results of `typ_vypisu=souhrn`, `typ_vypisu=vyjimky`, `format=list` (markup of the list), and a
week with overlapping classes.

### 2.8 Timetable search (`katalog/rozvrhy_view.pl`: criteria, `konf…` steps, results, teacher grid)

**Purpose.** See a teacher's, course's or programme's timetable (when is the other seminar group, when is a
teacher in). Occasional. Room timetables are canonical in Campus › Rooms.

**InSIS page.** Criteria page (crawl): "Display timetables – criteria selection", headings *Personal timetable*
(form: `format` + *Display*) and *Other timetables* (one form: room `mistnost` + *Individual selection*; course
supervisor `garant`, teacher `ucitel`, course `predmet` + *Individual selection*; department `ustav`, day `den`,
level `stupen`, programme `program`, field `obor`, group `k_skupina`, `format` + *Display*). `konf` steps: tables
"Selection by the validity of timetables" (Beginning · End · Number · Choose) and "Selection by department", then a
checkbox table of timetables (Sel. · Timetable · Study period · Department · Form of study · Beginning · End) with
JS buttons (*Select all*, *Only FIS*, *Only full-time* …) and *Select ticked timetables*. Teacher grid
(`id,rozvrh_ucitel`): a weekly grid with 45-minute columns and the same display-mode form as the personal one.

**Wrong.** InSIS's personal-timetable form duplicates My week here (rule 4); a dozen selects in one form with
staff vocabulary; the `konf` steps are a configuration students meet by accident; result grids scroll sideways.

**Rebuild.**
- **Criteria page (F)**: header eyebrow *Schedule*, title **Timetable search**; summary line "Find the timetable
  of a teacher, a course or a programme. Rooms: Campus › Rooms." with a link card **Your own timetable → My week**
  in place of InSIS's *Personal timetable* form (that form is hidden with the rest of the original: the job lives
  in My week). Content: InSIS's *Other timetables* form slotted as one form card, laid out by CSS into three
  labelled groups (Who: supervisor, teacher · What: course, department, day · Programme: level, programme, field,
  group) and the format select; no field is moved out of the form, hidden or pre-set. One line above: "Pick one
  or more criteria and press InSIS's Display; Individual selection lets you pick several teachers, courses or
  rooms." Rail: none.
- **`konf` steps (F)**: title **Choose timetables**, line "Which published timetables to search in. Usually the
  current semester is already chosen; you rarely need this." InSIS's checkbox form slotted as a form card, its
  table styled in place. The department list (`konf,vse`, links only) is R: a filterable list.
- **Results and teacher grid (R)**: title "Timetable · <teacher | course | programme>", the Week view component
  in weekly-template mode (shared with My week; columns read from the header, any slot length), a course list;
  page action **Display options** opens the same sheet as My week's *Export and print* (part b only) with InSIS's
  display-mode form slotted.

**Data.** Grid events (same parser as My week, generalised: not tied to `rozvrh_student`), the result's title.

**Safety.** All three forms are InSIS's, slotted, never filled or submitted; the JS selection buttons stay
InSIS's. Results are not stored (not personal timetable data).

**Snapshot.** The criteria page HTML; one result each for a course, a programme and an *Individual selection*
of several teachers; a `konf` checkbox step HTML.

### 2.9 Academic calendar (`student/harmonogram.pl` + `ca/prehled_tydnu.pl`)

**Purpose.** "When does the exam period start, when is registration, which teaching week is it, are there
holidays." A few times per semester; its data also feeds the Exams header and To do (registration rounds).

**InSIS pages.** `harmonogram.pl`: three steps without tabs: faculty selection (links), "More than one period has
been found. Select one." (Study period · Beginning · End · View), then the schedule of one period: "Faculty
selected: …", "Study period …", then lines of events with one or two dates each (labels not captured by the crawl).
The portal links it with `fakulta,obdobi,studium,zpet_student` (my faculty and period directly).
`prehled_tydnu.pl`: portal bar, a help sentence and — in `weeks.html`, mid-semester — only "No study period with
active courses has been found. The courses of the next study period has not been set." (sic).

**Wrong.** Two InSIS pages for one thing; the faculty and period pickers come first even though InSIS knows both;
the weeks overview is an empty dead end for this student; the event list is plain text with dates in a different
format per line.

**Rebuild (R).** One section, **Academic calendar**, with two views (rule 1: views of one thing):
- **Header**: eyebrow *Schedule*, title **Academic calendar**, subtitle "<faculty> · <period>". Page action:
  **Other faculty or period** (opens InSIS's picker step, `vyber_fakulty` / `fakulta`; those steps render as R
  lists with my faculty first and the current period marked).
- **View tabs**: **Key dates** (`harmonogram.pl?fakulta,obdobi,studium`, default) · **Teaching weeks**
  (`prehled_tydnu.pl?obdobi,studium`). The Teaching weeks tab is shown only when that page has data: Academic
  calendar reads it on open (`read: on-open`); when empty, the tab is hidden (principle 5) and Key dates shows
  "Teaching week n" computed from the teaching period's dates instead.
- **Summary** (Key dates): "Now: <current event>" and "Next: <next event> in n days"; the exam period as a
  highlighted range.
- **Content**: events as a vertical timeline grouped by month, each with its date or range and a category chip
  (registration · teaching · exams · holidays · deadlines; from the label text, both languages); past events
  dimmed. Note under it: "Courses taught by other faculties may follow their faculty's calendar."
- **Teaching weeks**: a list of weeks (number, dates, teaching / holiday) with the current week highlighted.
- **Rail**: this week (week strip) and "My exam dates" count linking Exam dates.

**Data.** Per event: label, from, to, category; teaching period range; exam period range; registration rounds
(To do "Registration round", 12 h). Weeks: number, from, to, kind.

**Safety.** Links only (the steps are GET links). `zpet_student` on copied links is tolerated per
`transient_params`; InSIS+ builds `fakulta,obdobi,studium` without it.

**Snapshot.** `harmonogram.pl?fakulta,obdobi,studium` HTML (labels and markup of events); `prehled_tydnu.pl` with
data (another account or period) to design Teaching weeks at all.

### 2.10 Export to calendar (`ca/konfigurace_prenosu_udalosti.pl`)

**Purpose.** Switch on the transfer of InSIS events (timetable, exam dates) to Office 365, once. **Not a section**
any more (rule 4): reached from My week › Export and print.

**InSIS page.** Crawl marked it `manual` (not opened automatically): title "Configure transfer of events to Office
365", ~600 characters, no structure captured. `read: never`, `action: unverified`.

**Rebuild (F).** Header: eyebrow *Schedule*, title **Export to calendar**; summary line "InSIS copies your classes
and exam dates to your university Outlook calendar; phones connected to that account show them too." InSIS's form
slotted as a form card with the line "Your choice is saved by InSIS when you press its button; you can switch it
off here again." Until the snapshot exists the page stays in the generic shell (G) and InSIS+ shows only the link.

**Safety.** A standing configuration: InSIS+ never reads it in the background, never fills or submits it, never
infers its state.

**Snapshot.** The page HTML, opened by a student's click, confirming that opening it changes nothing.

---

## 3. Section-level remarks (rule breaks and fixes)

1. **E-study record: seven InSIS views, three of them duplicates.** Basic vs detailed is a column toggle, not a
   view; whole study vs this period is a real view; statistics, credit statistics and comparison are views of the
   same record. None of the seven is a place. The 11-link row above them *is* places (the portal bar) and is
   hidden. **Fix**: four view tabs (This period · Whole study · Statistics · Comparison); basic views never
   linked; credit statistics folded into Statistics; `study-record.js` drops its "Student's portal" rail block and
   its seven link tabs.
2. **Exam dates: My dates and Available are one InSIS page.** Both URLs return the same three tables. Kept as two
   views (as `structure.views` decides) because they answer different questions (what am I signed up for / what
   can I still take); the difference is the summary and which table the page scrolls to, never a re-ordered or
   trimmed InSIS list. If testing shows students expect different lists, merge them into one **Current** view
   with both summaries; do not hide InSIS tables per view.
3. **Exam dates: no InSIS+ buttons that act.** Every "sign up / sign off / change" affordance in InSIS+ is a
   scroll-to-row or an explainer; the controls exist only once, in InSIS's list. This is what keeps L honest.
4. **Past exam dates vs Results: one job each.** Past = when and where I sat; Results = what came of it. Past
   shows no grades, Results shows no rooms; the attempts list lives in Results (row detail), Past links each course
   to its Results row. Same for the course page: it links to both, copies neither.
5. **What's left is one page, not three.** Plan check, map of my study and "my study plan" were three InSIS
   pages answering one question. Plan check is the page; Map of my study is its timeline block; the student's own
   plan is the group cards (with every compulsory course shown). **Study plans** stays a separate section only for
   *other* programmes; it does not offer "my plan" (InSIS gives no link from the plan check to the student's
   `studijni_plan`, so it could only be guessed) and says so with a link card to What's left.
6. **Plan check size.** ~990 rows, every course twice, ~1 880 links, 835 kB, mostly optional groups nobody reads.
   **Fix**: never slot or restyle the original; hide it before paint, parse the superset rows once into plain data,
   render the student's courses and compulsory gaps only, render elective lists on demand 50 at a time, never
   render optional groups in full, `read: on-open` only. The generic shell must never be the fallback for this
   page (if parsing fails: a short error state with InSIS's page behind *Classic view*).
7. **Academic calendar: two page types, one place.** Key dates (`harmonogram.pl`) and Teaching weeks
   (`prehled_tydnu.pl`) become view tabs of one section; the faculty and period pickers are steps behind a page
   action, not the first screen. The empty weeks overview is a dead end today: hide the tab when empty and compute
   the teaching week from Key dates.
8. **Timetable: one place per job.** Print / PDF / list (InSIS's display form) and the Office 365 transfer are one
   *Export and print* sheet in My week (rule 4); the display form leaves the bottom of the page; the "Change
   criteria" page action goes (a link to another place, which the sidebar already is); the search page's
   *Personal timetable* form becomes a link to My week; room timetables are canonical in Campus › Rooms and only
   glossed in the search form.
9. **Timetable search steps are not places.** The `konf` validity / department / checkbox steps are configuration
   of one search; they get one title ("Choose timetables"), are never in the sidebar and are only reached through
   InSIS's own links on the search page.
10. **Online tests empty state.** Today a paragraph and "no tests available": a dead end. **Fix**: the empty state
    says what happens next (tests appear when a teacher opens them; To do on Home shows them) and Submitted stays
    one tab away.
11. **Titles in the student's words.** The generic shell titles these pages from InSIS's last breadcrumb
    ("Register for examinations", "Unaccomplished study duties", "Display and print the course weekly plan",
    "Overviews and your study information"); the timetable module says "Timetable". **Fix**: every page in this
    scope takes its title from the node label (Exam dates, Online tests, Results, What's left, Study plans, My
    week, Timetable search, Academic calendar, Export to calendar).

---

## 4. Snapshots needed (collected read-only while logged in)

| Page type / variant | What it must show | Blocks |
|---|---|---|
| `terminy_seznam.pl` current tab, during sign-up | rows in all three tables; Register / Log out control markup and any confirmation step; Status values; table 3 heading; *Registered* format | Exam dates L, To do, Notifications |
| `terminy_seznam.pl?zalozka=2`, `?zalozka=3` with rows | row markup of past and unscheduled lists | Past, Not yet scheduled |
| `terminy_seznam.pl` after *Restrict* | how InSIS shows an active filter | the "InSIS is showing only…" line |
| `terminy_seznam.pl?…zobraz_duvod=1` | a real reason text | Reason page |
| `terminy_info.pl` (open date; registered date) | whether a control is on this page | Exam date details |
| `elis/ot/psani_testu.pl` with an open test; `?vysledky` with a result | row and start-control markup; result link | Online tests, To do |
| `pruchod_studiem.pl` `vyber=podrobne_vsechna_obdobi`, `stat_info`, `stat_studia_kred`, `zobrazeni_percentilu` | multi-period tables, statistics and comparison markup | Results views |
| `pruchod_studiem.pl` with a failed / repeated / recognised course; attempts page | result vocabulary; attempts table | Results row detail |
| `pruchod_studiem.pl` period change | where InSIS lets the student change the period | principle 6 on Results |
| `mapa_studii.pl` | its year grid markup | What's left timeline |
| `studijni_povinnosti.pl` of a later-year student | accomplished groups, state exam group, recognised courses | What's left statuses |
| `plany.pl` each step (incl. never-crawled `program` steps, group page, matrix) | selectors | Study plans |
| `rozvrhy_view.pl` personal: `typ_vypisu=souhrn`, `=vyjimky`, `format=list` | weekly template, exemptions and list markup | My week modes |
| `rozvrhy_view.pl` criteria page; course / programme / multi-teacher results; a `konf` checkbox step | form and result markup | Timetable search |
| `harmonogram.pl?fakulta,obdobi,studium` | event labels and markup | Academic calendar, Exams header, To do rounds |
| `prehled_tydnu.pl` with data | weeks markup | Teaching weeks view |
| `konfigurace_prenosu_udalosti.pl` | the form; that opening it changes nothing | Export to calendar F |
