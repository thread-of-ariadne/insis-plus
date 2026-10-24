# Teardowns: Campus & people, Messages, Help, Account, All services (draft 1)

Part of `03-pages.md` (§4 inventory, §5 teardowns, §6 exceptions) for every page type in `mapping.json` whose node
starts with `campus.`, `messages.`, `help`, `account.` or `all.`, plus the composed pages `dest.campus`, `dest.help`,
`dest.account` and `dest.all` (`composed.js`). No `variants` in `mapping.json` point into these nodes.

Evidence: the crawl (`test/fixtures/private/map/crawl.json`, filtered by route), the logged-in snapshots
`persons`, `mailbox`, `noticeboard`, `library`, `contact-centre`, `settings`, `tasks` (all English), and the current
code (`pages/messages.js`, `composed.js`, `generic.js`/`generic.css`). The snapshot `surveys.html` is **Course
evaluation** (`anketky/dotazniky.pl`, node `courses.evaluation`), not the eSurveys page; it is out of this scope. No
personal values are quoted below; everything is structure.

Codes as in `03-pages.md`: **C** composed · **R** rebuilt · **F** form page · **L** list with actions · **G**
generic (exception, §4 below). *Now*: **M** own module (or composed renderer), **S** generic shell only, **–** not
wrapped at all (`generic.js` SKIP list).

---

## 1. Inventory

### Campus & people

| Page type (path) | Node | Now | Snapshot | T | Reason |
|---|---|---|---|---|---|
| InSIS+ `#ipx:dest.campus` | campus | M | – (composed) | C | Overview with live data; today it ends in a page of links that repeats the sidebar (§2.1) |
| `lide/` | campus.people | S | ✓ persons | F | One action (search); InSIS's form slotted, results rebuilt |
| `lide/clovek.pl` | campus.people | S | crawl (15 pages) | R | Read-only person page; up to 10 tabs must become ≤6 view tabs |
| `lide/absolventi.pl` | campus.about | S | crawl | G | Lists of graduates by faculty and year; almost never opened by a student |
| `pracoviste/stud_odd.pl` | campus.office | S | crawl (8) | R | Office hours and who handles what: the most useful contact page; read-only |
| `studijni/` | campus.office | S | crawl | G | Not the study office: an InSIS menu hub (catalogue, enrolment statistics); never linked, re-map (§3.4) |
| `pracoviste/pracoviste.pl` | campus.departments | S | crawl (11) | R | Department structure; two tabs are real views (by faculty / full tree) |
| `pracoviste/zamestnanci.pl` | campus.departments | S | crawl | R | Staff with office hours: the reason a student opens Departments |
| `pracoviste/predmety.pl` | campus.departments | S | crawl | R | Supervised courses: a plain table of courses → course rows |
| `pracoviste/prehled_temat.pl` | campus.departments | S | crawl | L | Thesis topics with a filter form; canonical job is Study matters › Thesis (§3.6) |
| `pracoviste/telsez.pl` | campus.departments | S | crawl | F | One action: produce a department phone list |
| `pracoviste/kompaktni_telsez.pl` | campus.departments | S | crawl | F | One action: produce/print the university phone list |
| `pracoviste/projekty.pl` | campus.departments | S | crawl | G | Research projects of a department; same data as `vv/`, staff-facing |
| `pracoviste/publikace.pl` | campus.departments | S | crawl | G | Publications of a department; same data as `vv/`, staff-facing |
| `sif/organy.pl` | campus.departments | S | crawl (16) | R | Bodies and members (senate etc.): small tables, trivially rebuilt |
| `sif/organy_prehled.pl` | campus.departments | S | crawl | R | One table of departments → their bodies; trivially rebuilt |
| `mistnosti/` | campus.rooms | S | crawl (18) | R | Campus → building → room → detail; pure information, deep hierarchy |
| `pim/knihovna_vypujcky.pl` | campus.library | S | ✓ library (no loans) | R | My loans and due dates; feeds To do |
| `zp/` | campus.theses | S | crawl | F | Theses archive search (5 search modes as tabs) |
| `zp/portal_zp.pl` | campus.theses | S | crawl | F | Same archive, the other search modes; results rebuilt |
| `verejne_informace.pl` | campus.about | S | crawl | G | A hub of links that are all InSIS+ sections already; not linked (§3.3) |
| `zakladni.pl` | campus.about | S | crawl | R | Basic facts about the university: one key–value table → content of About VŠE |

### Messages

| Page type (path) | Node | Now | Snapshot | T | Reason |
|---|---|---|---|---|---|
| `posta/slozka.pl` | messages.mail | M | ✓ mailbox (empty) | L | The mail box: a list whose row actions live in InSIS's form |
| `posta/nova_zprava.pl` | messages.mail | S | crawl (7) | F | One action: send a message |
| `posta/nastaveni.pl` | messages.mail | S | crawl | F | Mail settings form (+ signatures, + "Send notices" view) |
| `posta/slozky.pl` | messages.mail | S | crawl | F | Folder administration form |
| `posta/forwardy.pl` | messages.mail | S | crawl | F | Forwarding: the one setting students need; read by Messages |
| `posta/hz_ng_sprava_mlistu.pl` | messages.mail | S | crawl | F | Recipient lists for group messages; rare for students, demoted into Settings |
| `posta/kontakty.pl` | messages.mail | S | – | G | Address book, `read: never`, `insis-only`; reached only through InSIS's own link |
| `vyveska/` | messages.noticeboard | S | ✓ noticeboard | L | Folder tree with counts; folder links are InSIS's own |
| `vyveska/slozka.pl` | messages.noticeboard | S | – | G | A folder's notices; `read: never`, `insis-only`, may mark as read; until a snapshot |
| `vyveska/nove_prispevky.pl` | messages.noticeboard | S | – | G | New / my contributions; `verify`; until a snapshot |

### Help

| Page type (path) | Node | Now | Snapshot | T | Reason |
|---|---|---|---|---|---|
| InSIS+ `#ipx:dest.help` | help | M | – (composed) | C | Help is a top-bar place; today three bare links |
| `dok/help.pl` | help | S | crawl | R | Help's front page: topic list (General / All = 1 284 links) |
| `dok/faq.pl` | help | S | crawl (empty body) | R | FAQ; the crawl got 422 characters, content not seen |
| `help.pl` | help | S | crawl | G | Context help for each page: InSIS documentation text, opened in a new tab |
| `kc/kc.pl` | help.ask | S | ✓ contact-centre | F | Knowledge-base search + catalogue of 25 request forms; each form is F |
| `kc/` | help.ask | S | crawl | F | Same page as `kc/kc.pl` (same form, same links); one treatment |

### Account (avatar menu)

| Page type (path) | Node | Now | Snapshot | T | Reason |
|---|---|---|---|---|---|
| InSIS+ `#ipx:dest.account` | account | M | – (composed) | C | Account overview with live status; today a page of six links |
| `kontrola/` | account.profile | S | crawl | R | Personal data check: six key–value groups; "Modify" links are InSIS's |
| `kontrola/statistika.pl` | account.profile | S | crawl | G | University-wide check statistics; no student job |
| `system/oou_uziv.pl` | account.profile | S | crawl | F | Grant / revoke approvals: InSIS's buttons; history table rebuilt |
| `system/zmena_hesla.pl` | account.security | – | crawl | G | Never touched (`docs/pages.md`) |
| `system/zmena_identity.pl` | account.security | – | – | G | Never touched |
| `system/hesla_nastaveni.pl` | account.security | S | crawl | G | Recovery methods; `read: never`, security wording must stay verbatim |
| `system/nastaveni_totp.pl` | account.security | S | crawl | G | OTP set-up; security form, rare |
| `system/nia.pl` | account.security | S | – | G | eID (NIA) link-up; security form, rare, not crawled |
| `system/nastaveni_delegatu.pl` | account.security | S | crawl | G | Delegates; staff tool, security form |
| `system/sessions.pl` | account.security | S | crawl | G | Current logins; `read: never`, rare |
| `system/zobraz_wlog.pl` | account.security | S | crawl | G | My operations log; rare, date form |
| `system/mobilni_zarizeni.pl` | account.devices | S | crawl | F | Pair the My College app (QR): one action, real student use |
| `system/mobilni_aplikace.pl` | account.devices | S | crawl | L | Permitted apps / issued authorisations; "Remove" is InSIS's link |
| `sit/univ_posta.pl` | account.email | S | crawl | F | Where university e-mail is delivered: one consequential action |
| `sit/` | account.email | S | crawl | G | Menu hub with one link (Accounts administration); never linked |
| `system/info_dist_srv.pl` | account.email | S | crawl | G | One-off notice with "Do not display again" (an action) |
| `ca/ucet.pl` | account.email | S | crawl (7) | R | My accounts on university servers: validity, quotas; read-only |
| `ca/ucty_info.pl` | account.email | S | crawl | G | 23 000 characters of server terminology: documentation |
| `ps/` | account.access | S | crawl | R | Access card data; four tabs are views of one thing (my card) |
| `ps/povolene_body.pl` | account.access | S | crawl | R | View "Permitted points" of the same page |
| `ps/body.pl` | account.access | S | crawl | R | View "All points" |
| `ps/moje_pruchody.pl` | account.access | S | crawl | F | View "My passes": month/point form, result rebuilt |
| `personalizace/pref.pl` | account.custom | S | ✓ settings | F | Who sees my photo/timetable/contacts, InSIS notifications: real privacy choices |
| `personalizace/menu_user.pl` | account.custom | S | crawl | G | Favourites menu of the classic InSIS look; irrelevant under InSIS+ |
| `personalizace/portlety.pl` | account.custom | S | crawl | G | Portlets of the classic InSIS main page; irrelevant under InSIS+ |
| `personalizace/menu_indiv.pl` | account.custom | S | – | G | Menu customisation, `insis-only`; irrelevant under InSIS+ |

### All services

| Page type (path) | Node | Now | Snapshot | T | Reason |
|---|---|---|---|---|---|
| InSIS+ `#ipx:dest.all` | all | M | – (composed) | C | The A–Z index the IA promises; today unsorted, unsearchable, no badges |
| `vv/epruzkumy/prehled_pruzkumu.pl` | all.surveys | S | crawl | L | Open eSurveys; "Show questionnaire" is InSIS's link; badge source |
| `evolby/portal_volice.pl` | all.surveys | S | crawl | L | Elections: current / past; "Vote" is InSIS's control; badge source |
| `todo/` | all.tasks | S | ✓ tasks | G | Staff task blocks + "Add block" form; the student fact is a count, shown as a badge |
| `posta/novinky.pl` | all.news | S | crawl | F | Tick channels, save: trivially simple form page |
| `diskuze/` | all.discussions | S | crawl | G | Forums with 4 forms (settings, search, new topic); little use, Moodle took over |
| `kurzy/nabidka_kurzu.pl` | all.public-courses | S | crawl | G | Fee-paying public courses / U3V; not a degree-student job |
| `kurzy/prihlaska.pl`, `kurzy/kurz_prihlaska.pl` | all.public-courses | S | – | G | Applications; `read: never`, `verify` |
| `vv/bio/` + `howto`, `navigace`, `odborne_aktivity`, `osobni_udaje`, `pedag_aktivity`, `preklad`, `prehled`, `vv_aktivity`, `zivotopis` (10) | all.research | S | crawl | G | Staff biographical data, up to three stacked tab rows; §6 exception |
| `vv/projekty.pl`, `vv/publikace.pl`, `vv/parovani_publikaci.pl` | all.research | S | crawl | G | Research records; §6 exception |
| `system/agregat.pl` | all.stats | S | crawl | G | InSIS load statistics; §6 |
| `hledani/` | all.search | S | crawl | G | Thematic search form; Ctrl+K covers the student cases |
| `about/`, `dok/integratori.pl` | all.system | S | crawl | G | Licence and integrators; §6 |
| `herna/`, `herna/housenka.pl`, `kamenozrout.pl`, `soliter.pl` | all.games | S | – | G | Games; `read: never`; §6 |

Count: 91 InSIS page types (all of `mapping.json` in these nodes): 41 rebuilt (R/F/L), 50 exceptions (G); plus 4
composed pages (C).

---

## 2. Teardowns

Template per page: **For** (job, frequency) · **InSIS page** · **Wrong** (InSIS / InSIS+ today) · **Rebuild**
(header · actions · view tabs · summary · content · rail · InSIS form) · **Data** · **Safety** · **Open**.

What every page in this scope loses, once, so it is not repeated below: InSIS's breadcrumb, the `.small` help
paragraph under it (shortened into the line above the form), the context-help icon (moved into Help › *Help for this
page*), "Key (click to show/hide)" legends (icons get text labels instead), "Expand all / Collapse all" buttons of
trees that InSIS+ redraws, layout tables, `uis_msg` boxes whose fact is moved into the summary.

### 2.1 Campus & people overview (`#ipx:dest.campus`, C)

- **For**: "who teaches me, where is my study office, when is it open, what do I owe the library". Weekly at most.
- **Now**: card *Your teachers this semester* (from `ipx.state.timetable.events`: name, course codes, person link),
  then `groupColumns('campus')`: the three groups as cards of links. The columns repeat the sidebar submenu, which
  §2 forbids ("never a repeat of the navigation"); with no timetable cached the page is a link page.
- **Rebuild**
  - Header: eyebrow none, title *Campus & people*. Page actions: *Find a person* (→ `campus.people`), *Find a room*
    (opens search with the room scope; no form).
  - Summary (KPI row, each hidden when its data is missing, never a placeholder):
    1. *Study department* — "Open today 9:00–11:00" / "Closed today · next Tue 9:00", for the student's faculty,
       from `stud_odd.pl` (one on-open read, see 2.3); links to Who to ask.
    2. *Library* — "2 loans · next due 4 Nov" with `deadlineTone`; links to Library. Only after `verify_data` is
       cleared; until then hidden.
    3. *Teachers this semester* — count; links to the list below.
  - Content: *Your teachers this semester* as now (avatar initials, name, course codes, InSIS person page), sorted
    by the next class with them (from the same events), each with "next: Tue 14:00 · SB 309". *Rooms this week*:
    the distinct rooms from the timetable with the room link copied from the timetable.
  - Rail: none (all content is short).
  - Delete `groupColumns('campus')`; the sidebar submenu (also the phone drawer, which is the sidebar below 900 px)
    carries the sections.
- **Data**: `ipx.state.timetable.events` (people, rooms, times); `ipx.state.studyOffice = { updated, faculty, today:
  [from, until, note], next }` (no names); `ipx.state.library` (see 2.5).
- **Safety**: no person page is fetched from the overview (that would be N reads per visit); office hours of a
  teacher live on the person page and the course page People tab.
- **Open**: which `fakulta` value identifies the student's study office (the portal's link carries
  `fakulta,studium,zpet_student`; the fetch must be rebuilt from the allowed set `fakulta`, `fakulta,studium`).

### 2.2 People: search (`lide/`, F) and person page (`lide/clovek.pl`, R)

**Search (`lide/`)**
- **For**: find a teacher's e-mail, office, office hours; occasionally a classmate. Several times a semester.
- **InSIS page** (snapshot): help paragraph; form `vzorek` (with InSIS's suggest widget `uisSearchInput`) + *Search*;
  a two-column layout table of checkboxes: 8 faculties/units (`subjekt`, all checked) and 4 person types
  (`upresneni`: Students, Graduates, Staff, Outside staff); a tip box linking to graduate lists.
- **Wrong**: InSIS: 12 checkboxes before the first result, all pre-set, in a layout table; the tip box sells a page
  nobody needs. InSIS+ today: the same form in the panel with the help paragraph verbatim.
- **Rebuild**
  - Header: *People*. No page actions.
  - Summary: none (the search is the summary). Above the form one line: "Search by name, surname or login; at least
    three letters. InSIS searches when you press Search."
  - InSIS's form slotted as a form card: the name field first and full width with InSIS's own button; the two
    checkbox groups styled as two fieldsets *Where* / *Who* under a disclosure "Narrow the search" (closed by
    default; CSS only, the inputs stay in the form and keep InSIS's defaults).
  - Results (the POST response page, same path): table rebuilt as person rows (photo if InSIS shows one, name with
    titles, role/department, link to the person page copied from InSIS).
  - Rail: *Your teachers this semester* (from the timetable, as on the overview): the most common search answered
    without searching.
  - Drop the graduates tip (Graduates stays reachable from About VŠE).
- **Data**: result rows (name, link, unit) — never stored.
- **Safety**: InSIS+ never fills `vzorek`; Ctrl+K hands a person query over as text with a Copy button (principle
  7.5). Checkbox defaults untouched.
- **Open**: the results page (markup, columns, paging) — needs a snapshot after a search.

**Person page (`lide/clovek.pl`)**
- **For**: contact a teacher (e-mail, office, phone, office hours), see what they teach and which theses they
  supervise. Weekly during thesis season; also opened from the course page People tab.
- **InSIS page** (crawl): heading = the person's name; tab row of 7–10 tabs depending on the person: Contacts ·
  Lesson · Final thesis · Projects · Publications · Curriculum vitae · Placements · Bodies · Supervised theses ·
  Conferences. Contacts has an e-mail link to `posta/nova_zprava.pl?uzivatel`, department links, a vCard export
  (`export_osoby`) and *Import person to postal contacts* (`posta/kontakty.pl?add_guy`). Lesson: table Code ·
  Course · Department · Study period · Role. Projects: table + *Export to Excel* form.
- **Wrong**: InSIS: up to 10 tabs in InSIS's order (research before teaching), "Lesson" for teaching, an import
  link that changes data on a GET. InSIS+ today: the slotted page with the tab row as an underlined strip.
- **Rebuild**
  - Header: eyebrow *People*, title = name with titles. Page actions: *Write in InSIS* (InSIS's `nova_zprava.pl?
    uzivatel` link copied) and the e-mail address (mailto copied verbatim).
  - View tabs (one person, rule 1; ≤6 by frequency, only tabs InSIS shows): Contacts · Teaching · Supervised theses
    · Final thesis · Publications · **More** (Projects, Curriculum vitae, Placements, Bodies, Conferences). Each tab is
    InSIS's own `id,zalozka` link (`ui.linkTabs`).
  - Summary (Contacts): office · phone · e-mail as a description list; *Office hours* with the next slot
    highlighted ("Next: Wed 10:00–11:30, NB 412"); department chips linking to Departments.
  - Content: Teaching → course rows (code, name, role, period; course link to the syllabus or my course page per
    the `predmet` rule); Supervised theses / Final thesis → thesis rows (title, type, year, state); research tabs →
    G content under the InSIS+ header and tabs.
  - Rail: "You have this teacher in: <CODE> (Tue 14:00)" from the timetable, when the person is one of mine.
- **Data**: contacts and office hours (session only, not stored beyond the page); teaching rows.
- **Safety**: hide `kontakty.pl?add_guy` (a GET that adds a contact; add `add_guy` to the deny list) and the vCard
  export (a download; not in `links`). *Export to Excel* stays InSIS's own button, in its form.
- **Open**: Contacts tab markup (office hours table, photo, phone format) for a teacher, a student and the user's
  own page; Supervised theses and Final thesis tab markup; Czech labels.

### 2.3 Who to ask (`pracoviste/stud_odd.pl`, R)

- **For**: "whom do I write about scholarships / exchange / my studies, and is the office open now". The most
  frequent Help task (02 §4: Who to ask (scholarship)).
- **InSIS page** (crawl): without `fakulta` a list of 10 offices (6 faculties, International Office, Institute of
  Property Appraisal, U3V ×2); with `fakulta`: office name (twice), *Basic information* (type of department, contact
  address, phone, e-mail, note), *Office hours* table (Day · From · Until · Note), *Contact persons* table (Name ·
  Office · Phone · E-mail · Send an e-mail · Field of activity), *Faculty vice-deans* table (+ Specifications).
- **Wrong**: InSIS: office hours as a raw table (no "today"), contact persons in arbitrary order with the field of
  activity in the last column, although the field is what the student is looking for; the office name repeated.
  InSIS+ today: generic shell.
- **Rebuild**
  - Header: eyebrow *Help*, title *Who to ask*, subtitle the office ("Study department, FIS"). Page actions: *Ask a
    question* (→ Contact centre) and *Another office* (a menu of InSIS's own `fakulta` links from the no-faculty list).
  - Summary: status line from office hours — "Open now until 11:00" (ok tone) / "Closed · next Tue 9:00–11:00";
    contact address, phone, e-mail as one description list.
  - Content: *Who handles what*: contact persons grouped by Field of activity (heading = the field, rows = name,
    office, phone, e-mail; *Write in InSIS* = InSIS's link). Then *Office hours* as a week list (today marked). Then
    *Vice-deans* with their specification as the row's subtitle.
  - Rail: the request forms of the Contact centre that match the faculty (link list from 2.13), "Requests go through
    the Contact centre".
  - Default faculty: the student's (from the portal), with the no-faculty list reachable through *Another office*.
- **Data**: office hours rows → `ipx.state.studyOffice` (times only); contact rows on the page only.
- **Safety**: e-mail and "Send an e-mail" links copied verbatim; nothing prefilled.
- **Open**: Czech snapshot (field-of-activity values, day names); whether Field of activity is free text or a fixed
  list (grouping depends on it); HTML snapshot (only crawl structure exists).

### 2.4 Departments (`pracoviste/*`, `sif/*`; R, with L/F/G parts)

- **For**: a teacher's office hours when the student knows the department, not the name; supervised courses;
  thesis topics of a department. A few times a year.
- **InSIS pages** (crawl): `pracoviste.pl` with two tabs *Basic structure* / *Tree structure* (university → 6
  faculties + Rectorate, 83/162 links). `pracoviste.pl?id` (a faculty): heads alternating code / department name;
  a unit row has a table Abbreviation · Name · Departments · Staff · Bodies · Projects · Publications (columns are icon
  links). Detail pages per department: `zamestnanci.pl` (Name · Department · Position · Office · Phone · E-mail ·
  Consulting hours, each person with a nested Date · Time · Room · Note table; 660 KB for the whole university, 127 KB
  for a faculty; filter form *Restrict*), `predmety.pl` (Code · Course title · Study period · Course supervisor),
  `prehled_temat.pl` (11 columns, filter form of 5 selects, 210 KB), `projekty.pl`, `publikace.pl`, `sif/organy.pl`
  (Body · Members list per category; members: Body member · Identification · E-mail · Note), `telsez.pl` (form of 4
  selects + 3 checkboxes → a printable list), `kompaktni_telsez.pl` (faculty checkboxes + Print).
- **Wrong**: InSIS: the department is not a page: its parts hang off unlabelled icon columns; staff and office hours
  only exist as one huge table; the crumb puts *Lecture rooms* under *Departments*. InSIS+ today: generic shell over
  every one of them, icon columns unlabelled.
- **Rebuild**
  - `pracoviste.pl` — Header *Departments*; page action *Phone directory* (→ `kompaktni_telsez.pl`). View tabs: *By
    faculty* · *Full tree* (InSIS's own two tabs). Summary: "Your faculty: FIS" card first. Content: faculty cards
    (faculty colour) → department rows (code, name) with labelled links *Staff · Courses · Thesis topics*. A
    client-side name filter over the rendered list (no InSIS form involved).
  - Department detail = one thing with view tabs (rule 1), built from the allowed sets with the page's own `id`:
    **Staff** (`zamestnanci.pl?id`) · **Courses** (`predmety.pl?id`) · **Thesis topics** (`prehled_temat.pl?
    pracoviste`) · **Bodies** (`sif/organy.pl?id,uni`) · **Publications** · **Projects** (the last two G content).
    Header: eyebrow *Departments › faculty*, title = department name; page action *Phone list* (→ `telsez.pl?id`).
  - Staff (R): person cards (name → person page, position, office, phone, e-mail) with *Office hours* as "Next: date
    time room", the rest in a disclosure; a name filter on top; InSIS's *Restrict* form slotted as a small form card
    (it filters by position). For the 660 KB university list, render the first 50 and the rest on scroll; parse once.
  - Courses (R): course rows (code, title, period, supervisor link); course link → my course page or syllabus.
  - Thesis topics (L): InSIS's filter form slotted (*Restrict*), topic cards: title, type, supervisor, programme,
    *Intended for*, *Occupied/Max* → tag "1 of 2 free" / "Full"; *Detail* is InSIS's link. Teardown of the job lives
    with Study matters › Thesis.
  - Bodies (R): list of bodies by category; members as rows (role, name link, e-mail). `organy_prehled.pl`: a
    department → bodies table rebuilt as rows.
  - `telsez.pl`, `kompaktni_telsez.pl` (F): header, one line "Choose what to include; InSIS opens the list to print",
    InSIS's form as a form card.
- **Data**: department code/name/id from the faculty page; staff rows on the page only.
- **Safety**: *Export to Excel* and *Print* are InSIS's buttons in InSIS's forms (downloads by the student's click).
- **Open**: snapshot of one department's own `pracoviste.pl?id=<department>` (the crawl only has faculty level);
  confirm that the same `id` addresses a department in `zamestnanci`, `predmety`, `organy` and `pracoviste` in
  `prehled_temat`; Czech labels of the icon columns.

### 2.5 Rooms (`mistnosti/`, R)

- **For**: "where is SB 309, what equipment does it have, what is on in it". Mostly reached from a class; search
  finds rooms directly (principle 9).
- **InSIS page** (crawl, one path with parameters): campuses (Abbreviation · Name · Campus code · Details · Number of
  rooms · Select campus) → `areal`: buildings (Building identification · Name · Details · Number · Select building)
  → `areal,budova`: rooms (Identification · Number · Building · Department · Capacity · Details) → detail
  (`arealpodrobne` / `budovapodrobne` / `zobrazit_mistnost`): Name · Entry table, for rooms also *Lecture room
  equipment and furnishing*. Empty forms wrap the "Select" columns.
- **Wrong**: InSIS: four levels of the same two-column table, "Select" columns instead of links, sports fields and a
  "Fictitious campus" listed with teaching buildings. InSIS+ today: generic shell, crumbs hidden so the level is lost.
- **Rebuild**
  - Header: eyebrow = the path (*Rooms › Žižkov › Rajská budova*), title = the level's name. Page action on a room:
    *Timetable of this room* (the room timetable link InSIS gives, copied).
  - Campus level: campus cards (name, number of rooms), teaching campuses first, others ("External…", sports) in a
    second group. Building level: building cards with address. Room list: rows with capacity tag and department.
  - Room detail: description list (name, building, floor, capacity, type, …) and *Equipment* as a tag list.
  - Summary on the room page: "You have classes here: Tue 14:00 <CODE>" from the timetable.
  - Rail on lists: *Your rooms this week* (as on the overview).
- **Data**: the public room list (read on the first room search, per principle 9); detail pairs.
- **Open**: HTML snapshots (crawl only) of a room detail with equipment and its timetable link; whether the
  building detail carries an address InSIS+ can show; Czech labels.

### 2.6 Library (`pim/knihovna_vypujcky.pl`, R)

- **For**: "what do I have out and when is it due". A few times a semester; the To do trigger covers the rest.
- **InSIS page** (snapshot, no loans): help line, a note that the data come from the library system, "You have no
  library borrowings." The loan table has never been seen.
- **Wrong**: InSIS: no due-date emphasis (assumed). InSIS+ today: generic shell with two paragraphs of InSIS prose
  for an empty list.
- **Rebuild**
  - Header: *Library*. No page actions (renewal happens in the library's system; linked only if InSIS's page carries
    the link, copied).
  - Summary: KPIs *Loans* (n), *Next due* (date, `deadlineTone`, "overdue" in bad tone).
  - Content: loan rows (title, author, due date with countdown, renewals left if shown), sorted by due date.
  - Empty state: "No loans. The list comes from the library system." (one line).
- **Data**: `ipx.state.library = { updated, loans: [{ due, title }] }` (titles needed for the To do item; session
  only). Background read stays off until `verify_data: loan due dates` is cleared.
- **Open**: snapshot with at least one loan (columns, date format, renew link); Czech version.

### 2.7 Theses archive (`zp/`, `zp/portal_zp.pl`, F)

- **For**: read defended theses of a supervisor or topic before choosing one's own. During thesis preparation.
- **InSIS page** (crawl): heading *Final theses*; 5 tabs: Searching · A list by the department · by the supervisor ·
  by the opponent · by the study programme. Each tab is a form: text pattern + where-to-search checkboxes + state
  select (Searching), department select (by department), name pattern (by supervisor), with type and defence-year
  checkboxes.
- **Wrong**: InSIS: five tabs that are five search modes of one archive (acceptable as views), each with 10–15
  checkboxes. InSIS+ today: generic shell.
- **Rebuild**
  - Header: *Theses archive*. View tabs: *Search* · *By department* · *By supervisor* · *By opponent* · *By programme*
    (rule 1: views of one archive; 5 ≤ 6). InSIS's own tab links.
  - Line above the form: "Search defended theses; InSIS lists them when you press Display."
  - InSIS's form slotted as a form card; checkbox groups as fieldsets with their InSIS captions.
  - Results (POST response): thesis rows (title, author, type, year, supervisor link, department), the thesis link
    InSIS's own.
  - Rail: *Your thesis* (link to Study matters › Thesis) and *Thesis topics on offer* (→ department topics).
- **Open**: results page and thesis detail page (never captured); Czech labels.

### 2.8 About VŠE (`zakladni.pl` + `verejne_informace.pl`; C replacing a hub)

- **For**: rare: the university's basic facts, graduate lists.
- **InSIS pages**: `verejne_informace.pl` is a menu page of 16 links (People, ID card validity, Departments, Thematic
  search, ID card types, Public document server, Graduates, Academic year schedule, Study plans, Catalogue,
  e-materials, Foreign agreements, Final theses, Timetables, Abroad reports, Projects, Publications);
  `zakladni.pl?id` is one Item · Entry table.
- **Wrong**: the hub duplicates the navigation: 12 of its 16 links are InSIS+ sections already (rule 4).
- **Rebuild**: the section *About VŠE* opens a composed page: *Basic facts* (description list from `zakladni.pl`,
  read on open) and *Public information without a section elsewhere*: Graduates, ID card types and card validity
  (also Study matters › Status), Reports about placements abroad (also Study abroad). `verejne_informace.pl` is never
  linked.
- **Open**: the `id` value `zakladni.pl` needs (the crawl reached it from Departments); is it fixed for VŠE (then pin
  it in `values`)?

### 2.9 InSIS mail: mail box (`posta/slozka.pl`, L)

- **For**: read the occasional InSIS message (system messages, a teacher writing through InSIS). Most students
  forward InSIS mail to Outlook; the page then exists to confirm that and to find an old message.
- **InSIS page** (snapshot, empty Inbox; crawl): **row 1 of tabs** (`portal_menu`): Office365 · New message · Mail box ·
  Group messages · Contacts · Settings. Help line. Form `post_slozka`: left column — *Update folder* link, folder tree
  (Inbox, Sent, Trash, Unfinished mail box, Spam, each with a count), *Folder administration* link, *E-mails in total*,
  *Unread*, *Quota*, *Full* with a red bar, a *Key* of five icons. Right column — a `uis_msg ko` box "All messages are
  forwarded to: <address>" linking to `forwardy.pl`, then the message list or "The mail folder Inbox contains no
  messages". On settings pages a **second row** appears (Basic setup · Send notices · Folder administration · Forward
  mail).
- **Wrong**
  - InSIS: two rows of tabs mixing a place outside InSIS (Office365), an action (New message), a rare staff tool
    (Group messages), an address book and settings, with folders as a third navigation in a tree; the forwarding fact
    — the one thing most students need — is a red error-styled box; a legend explains icons.
  - InSIS+ today (`messages.js`): a "Where do messages arrive?" card on top, then the whole `#str1` slotted: the tab
    row as an underlined strip, the tree, the legend and InSIS's red box again. Two answers to the same question on
    one screen; the overlay the user complained about.
- **Rebuild**
  - Header: eyebrow *Messages*, title *InSIS mail*. Page actions: **New message** (InSIS's `nova_zprava.pl` link,
    primary) and **Open university e-mail** (the Office365 link copied from the row; external `outlook`).
  - View tabs: the folders — *Inbox (n)* · *Sent* · *Drafts* (InSIS's "Unfinished mail box") · *Spam* · *Trash*; user
    folders in *More*. Rule 1: views of one mail box. Links = InSIS's folder links (`fid`).
  - Summary: one status line replacing both the card and InSIS's box: "Forwarded to your university e-mail — you will
    also find these in Outlook." (ok tone) or "Not forwarded: read your InSIS mail here." (warn tone) + *Change*
    (→ Settings › Forwarding). Unread count as a chip. Quota only when *Full* > 80 %.
  - Content: the message list as rows (unread bold, sender, subject, date, attachment icon with label). **L**: the
    list sits inside InSIS's form with checkboxes and per-row reply/forward/delete controls, so the table is
    restyled in place (CSS, `data-label`s), never moved or rebuilt outside the form; InSIS's move/delete buttons
    stay where InSIS puts them, styled as a toolbar.
  - Hidden: row 1 of tabs (each item moved: Office365 and New message → page actions, Mail box → this page, Group
    messages and Contacts → Settings / New message, Settings → sidebar section), the tree (→ view tabs), the legend,
    totals, the red box (→ summary), *Update folder* (a browser reload does the same; keep it only if a snapshot
    shows it does more).
  - Sidebar while in Messages: *InSIS mail* · *Noticeboard* · *Mail settings*.
- **Data**: unread count (stored as now: `ipx.state.messages = { updated, unread }`), folder names and counts (page
  only), forwarding address (page only; stated by the page, else `forwardy.pl` read on open as now).
- **Safety**: messages are never fetched (`read: never` for message pages: opening one marks it read); no preview
  text exists beyond what the folder page shows. Every row control is InSIS's.
- **Open**: snapshot with messages (row markup, unread marker, paging, the move-to-folder control), a user folder,
  Czech version; what *Update folder* (`on=0`) does.

### 2.10 New message (`posta/nova_zprava.pl`, F)

- **For**: write to a teacher or office through InSIS (e.g. *Write in InSIS* on a person page). Rare.
- **InSIS page** (crawl): row 1 of tabs; form: message type radios (`zprava`), recipient list select (`mlist`), To,
  Cc, Bcc, Subject, body, attachment upload, checkboxes (confirm receipt, keep message, keep addresses, save sent,
  folder select); buttons *Save to Drafts*, *SEND MESSAGE*.
- **Wrong**: tabs row on a compose page; options before the body.
- **Rebuild**: header *New message*, eyebrow *InSIS mail*; no view tabs; one line: "Sent inside InSIS. The recipient
  reads it in InSIS or, if forwarded, in their e-mail." InSIS's form as one form card: To/Cc/Bcc, Subject, body,
  attachments, then the options in a disclosure *Options* (CSS only). InSIS's two buttons in place.
- **Safety**: InSIS+ never fills a field; a recipient arrives only through InSIS's own `uzivatel` link. The address
  book link (`kontakty.pl`) stays InSIS's own link inside the form.
- **Open**: HTML snapshot (crawl only); how the address book link appears.

### 2.11 Mail settings (`posta/nastaveni.pl`, `slozky.pl`, `forwardy.pl`, `hz_ng_sprava_mlistu.pl`; F)

- **For**: once: set forwarding to the university e-mail; rarely: signature, folders.
- **InSIS pages** (crawl): two tab rows. *Basic setup*: 15+ fields (sender, messages per page, width, HTML format,
  trash/spam checkboxes, save sent, …) and two signature tables (Sel. · Impl. · Signature · Modify) with *Add end
  signature*. *Send notices*: not crawled. *Folder administration*: table Sel. · Ord. · Type · Name · Modify ·
  Changed · Changed by; *Put folders in implicit / alphabetical order*; add-folder form. *Forward mail*: table Sel. ·
  E-mail · Changed · Changed by; checkboxes *Save forwarded messages*, *forward all*; *Save settings*. *Group
  messages*: lists of recipients table + *Compile a new list of recipients*.
- **Wrong**: two stacked tab rows; forwarding, the one setting that matters, is the last sub-tab.
- **Rebuild**: section *Mail settings* (sidebar under Messages). Header *Mail settings*. View tabs (one row, views of
  one settings object): **Forwarding** (first; entry page) · Basic · Notices · Folders · Recipient lists. Summary per
  view: Forwarding — "Forwarded to <address> since <date>" / "Not forwarded"; Folders — "5 folders"; others none. Each
  InSIS form slotted as a form card with one line ("InSIS saves this when you press Save settings."). Tables with
  `Sel.` checkboxes stay inside their forms.
- **Safety**: all toggles (delete trash, don't forward spam, forward all) are InSIS's; InSIS+ shows state, never
  sets it. Forwarding is read on open (as now) for the Messages status line only.
- **Open**: *Send notices* view (`nastaveni.pl?zalozka=…`); HTML snapshots of forwarding with and without an address
  (`messages.js` assumes addresses are in plain `td` cells).

### 2.12 Noticeboard (`vyveska/`, L)

- **For**: faculty notices, official board, ads (accommodation, textbooks). Occasional.
- **InSIS page** (snapshot): an `h1` *Noticeboard*; tab row Contribution tree · New contributions (n) · My
  contributions · Settings (Settings has a sub-row: Noticeboard setting · Folder setting); help paragraph; a tree of
  ~60 folders in three levels (units → topics → offer/seek), each "(n)" with new ones in bold; *Expand all / Collapse
  all*; a *Key* of rights icons.
- **Wrong**: InSIS: the whole tree expanded, all counts "(0)" given equal weight; rights legend irrelevant to
  students; a second tab row in Settings. InSIS+ today: generic shell, InSIS's `h1` duplicated under the header.
- **Rebuild**
  - Header: eyebrow *Messages*, title *Noticeboard*. Page action: *Noticeboard settings* (InSIS's link; Settings is a
    form, not a view).
  - View tabs: *Folders* · *New (n)* · *Mine* — InSIS's own links (rule 1: views of one board). Settings' sub-row
    becomes the view tabs of the settings page (one row).
  - Summary: "n new contributions in m folders" with the folders named, or "Nothing new".
  - Content (L): the tree as grouped lists — top-level units as section headings, folders as rows with count, rows
    with new contributions first and marked; folders with 0 and no children collapse under "Other folders". Every
    folder link is InSIS's own anchor kept (`slozka.pl` is `insis-only`).
  - Hidden: `h1`, help paragraph, Expand/Collapse, rights key.
- **Data**: folder name, count, new count — on the page only; no badge in the background (`read: never`).
- **Safety**: never fetch a folder or a contribution (may mark as read).
- **Open**: snapshot with new contributions (bold markup), `slozka.pl` and `nove_prispevky.pl` (verify); Czech.

### 2.13 Contact centre (`kc/kc.pl`, `kc/`; F)

- **For**: ask the study department in writing; **file a request** (interruption, recognition of courses,
  scholarships, transfer, special needs). A few times per study, each one important.
- **InSIS page** (snapshot): help line; form *Search in a knowledge database* (`_dotaz` + *Search*), with a link to
  FAQ; a JS category selector (Forms › Registration and Enrollment · Scholarships · Special Needs · Study Abroad ·
  Study Fees · Study Issues) and 25 form links (`kc.pl?formular=…;zalozka=novy`). A form page: selects for contact
  centre, study, employment, e-application; subject; questions (`_zad_otazka_*`); file upload; *Submit*.
- **Wrong**: InSIS: the request forms — what students actually come for — hide behind a JS category picker below a
  knowledge-base search; the IA says Study matters › Requests has no InSIS page, but they are right here (§3.2).
  InSIS+ today: generic shell; the picker's indentation (non-breaking spaces) shows as is.
- **Rebuild**
  - Header: eyebrow *Help*, title *Ask a question*. Page action: *FAQ* (→ `dok/faq.pl`).
  - Summary: none; content leads.
  - Content: **Requests and applications**: the 25 forms as a grouped list (the six categories as headings, each
    form a row with InSIS's own link), a client-side filter field over the rows. **General question**: the *General
    application/query* form as the first row, highlighted. **Search the knowledge base**: InSIS's search form slotted
    as a small form card with one line ("InSIS searches its answers; nothing is sent to anyone").
  - A form page (`formular,zalozka`): header = the form's name, eyebrow *Ask a question*; one line: "Sent to the
    study department of the study you choose. You get the answer in InSIS mail."; InSIS's form as a form card.
  - Rail: *Who to ask* card (the faculty office's hours, from 2.3).
  - `kc/` and `kc/kc.pl` are the same page: one module recognises both.
- **Safety**: InSIS+ never preselects the study, never fills the subject, never touches the upload; *Submit* is
  InSIS's.
- **Open**: is there a "my queries" history view (other `zalozka` values)? Czech snapshot; a form page HTML.

### 2.14 Help (`#ipx:dest.help`, C; `dok/help.pl`, R; `dok/faq.pl`, R)

- **For**: "how does X work", "who do I ask", "this page is confusing".
- **Now**: `groupedList('help')`: three link cards (Who to ask, Help, Ask a question). `dok/help.pl`: generic shell.
- **Rebuild**
  - `dest.help` (C): **Help for this page** first: the context-help link of the page the student came from (copied
    from that page's breadcrumb, `help.pl?page`), named after the page; **Who to ask** card with the office status
    line (2.3); **Ask a question** card with the three most used forms (2.13); **Documentation & FAQ** (→
    `dok/help.pl`, `dok/faq.pl`); **Mobile app** (About, App Store, Google Play, Support: links copied from InSIS's
    menu, `menu_only`).
  - `dok/help.pl` (R): header *InSIS documentation*; view tabs *General topics* · *All* (InSIS's two); General →
    topic rows; All (1 284 links) → A–Z list with a filter field.
  - `dok/faq.pl` (R): question rows with disclosure answers — once a snapshot shows the content.
- **Open**: FAQ content (crawl got only 422 characters); `dok/help.pl` HTML.

### 2.15 Account overview (`#ipx:dest.account`, C)

- **For**: "is my account all right; where is the setting for X". Rare, but the avatar menu leads here.
- **Now**: `groupedList('account')`: six link cards. *Security* opens `zmena_hesla.pl` (its `entry`), the
  never-touched password form, so "Security" is a password page with no way to the other seven security tools.
- **Rebuild**: header *Account*. Content in the six groups, each group a card whose rows are the InSIS pages
  themselves (not the section), with a status where one can be read on open:
  - *Profile & privacy*: Personal data check (status from Home's notices: "Check requested" / nothing), Approvals,
    Who sees what (`pref.pl`).
  - *Security*: Change password · Recovery methods · One-time passwords · eID · Current logins · Delegates · My
    operations · Change identity (glosses only; nothing is read).
  - *Apps & devices*: Paired devices ("1 device", read on open), Permitted apps.
  - *E-mail & accounts*: University e-mail ("Delivered to Office 365", `univ_posta.pl` read on open), InSIS mail
    forwarding (status as in Messages, link to Mail settings), Accounts on university servers.
  - *Access system*: My card.
  - *Classic InSIS look*: User settings › design, favourites, portlets — one row, gloss "only matters in Classic view".
  - The sections stay in `structure.tabs.account` for labels; their `entry` becomes this page's anchor
    (`#ipx:account/security`), so no section opens a never-touched form directly.
- **Safety**: on-open reads only (`univ_posta.pl`, `mobilni_zarizeni.pl`, `forwardy.pl`); nothing stored but the
  status words.

### 2.16 Personal data check (`kontrola/`, R)

- **For**: once a year InSIS asks the student to check their data (To do item from Home's notices).
- **InSIS page** (crawl): note "The information appears only to you"; tables: Personal data (Name · Entry · Changed ·
  Modify), Recorded documents (Type · Document issued by the state · Number · Valid until · Changed), Security setting
  (Name · Entry · Changed), Addresses (Type · Address · Modify), Study (10 columns), Bank accounts (10 columns).
  *Modify* links go to `kontrola/?form`, a Contact-centre e-application (`read: never`).
- **Wrong**: six wide tables of key–value data; the "Changed" column dominates; the reason the student is here (is
  everything correct? where to fix it?) is not stated.
- **Rebuild**: header eyebrow *Account*, title *Personal data check*. Summary: "InSIS asks you to check these data" (only
  when Home's notice says so) + one line "If something is wrong, use Modify: InSIS opens a request to the study
  department." Content: one description-list card per group (Personal data, Documents, Addresses, Study, Bank
  account), each row's *Modify* InSIS's own link at the row end. Study as a compact card (programme, field, form,
  start, status).
- **Safety**: document numbers, birth data and bank accounts are drawn on the page only and never stored in
  `ipx.state`; the page is not in `PERSONAL` keys because nothing is kept.
- **Open**: HTML snapshot during a check period: is there a "Confirm the data are correct" control, and where?

### 2.17 Approvals (`system/oou_uziv.pl`, F)

- **For**: grant or revoke consents (personal data, matriculation oath); at enrolment, rarely after.
- **InSIS page** (crawl): tab *Protection of personal data* / *Approvals – study* (one tab each, so no real row);
  "I want to grant all approvals:"; per-approval blocks; buttons *Grant approvals*, *Revoke approvals*, *Continue*;
  history view (`historie,skoc_zpet`): Version · Approval granted · Approval revoked · Detail.
- **Rebuild**: header *Approvals*; summary "n granted · m not granted"; each approval as a card (name, state tag,
  granted date, *History* link); InSIS's form with its three buttons as one form card with the line "InSIS records
  your choice when you press a button; you can change it later." The single-tab row is dropped.
- **Safety**: no state is inferred as advice; the buttons are InSIS's.
- **Open**: HTML snapshot (per-approval markup, Czech).

### 2.18 Paired devices (`system/mobilni_zarizeni.pl`, F) and permitted apps (`system/mobilni_aplikace.pl`, L)

- **For**: pair the My College app (QR code); check which apps have access. Once per phone.
- **InSIS pages** (crawl): devices table Sel. · Active · Name · Producer · Platform · System version · Since · Until;
  *Pairing:* with *Generate new QR code*; *Display past records*. Apps: two tabs *Permitted applications* (Status ·
  Application · Provider · Detail · Permitted) and *Issued authorizations* (… · Remove authorization).
- **Rebuild**: one section *Apps & devices*; view tabs *Devices* · *Apps* · *Authorisations* (the device page and the
  app page's two tabs: three views of "what can access my account"). Devices: device rows (name, platform, active
  tag, since); one line "Generate a QR code in InSIS and scan it in the My College app"; InSIS's two forms as form
  cards. Apps/Authorisations: rows with InSIS's *Remove* link kept in place (L).
- **Safety**: the QR code is a pairing credential: it stays in InSIS's DOM (slotted), never cloned or redrawn.
- **Open**: HTML snapshots; the QR result page.

### 2.19 University e-mail delivery (`sit/univ_posta.pl`, F) and accounts (`ca/ucet.pl`, R)

- **For**: rarely, but consequential: where university e-mail is delivered; when my accounts expire (graduation).
- **InSIS pages** (crawl): *Distribution server* with the current one ("office365 …"); form radios `distr_server`,
  checkboxes *remove forwarding*, *cancel storing*, *Set distribution server*. `ca/ucet.pl`: login, per server Permitted
  / Maximum values, Grace time, Account validity until, Status, Reasons for entitlement; `?info` server info with
  administrators; `?narok` groups.
- **Rebuild**: `univ_posta.pl`: header *University e-mail*; summary "Delivered to Office 365"; warning line "Changing
  this moves where new university e-mail arrives. InSIS changes it when you press Set distribution server."; form card.
  Cross-link: "InSIS mail forwarding is a different setting → Mail settings". `ca/ucet.pl`: header *Accounts*; one card
  per server (name, status tag, valid until, quota); `?info` as a description list with administrator rows.
- **Safety**: InSIS+ never preselects a server or ticks the removal boxes.
- **Open**: HTML snapshots of both.

### 2.20 Access system (`ps/*`, R + F)

- **For**: "which doors does my card open", "was my card read at the gym". Rare.
- **InSIS pages** (crawl): four tabs Basic information · Permitted points · All points · My passes-through (four page
  types, one tab row); Basic: *Identification data of your card*; All points: 320 links; My passes: form (point, month,
  year, *Display*).
- **Rebuild**: header *Access card*; view tabs = InSIS's four (rule 1: views of my card); Basic → description list;
  Permitted points → grouped list by building; All points → grouped list with filter; My passes → InSIS's form as a
  form card + rows (time, point).
- **Safety**: passes are a location history: drawn on the page only, never stored.
- **Open**: HTML snapshots of all four (the crawl found no tables, so the markup is unknown).

### 2.21 Who sees what & InSIS notifications (`personalizace/pref.pl`, F)

- **For**: hide or show my photo, timetable, contact details on my person page; photo transfer to Office 365 /
  Moodle; which e-mail notifications InSIS sends. Once, or after a surprise.
- **InSIS page** (snapshot): **two tab rows**: Personal page · Set data · Design of the information system ·
  Notifications; sub-row Display information mode · My personal information · Further information. Help paragraph
  linking to the own person page. Form: a table Information × Nowhere / After logging in / Public with 8 radio rows
  (photo, family name, personal timetable, projects, publications, placements, contact details, redirected e-mail),
  a Yes/No table (photo transfer), a checkbox (show study info after graduation), *Save entered information*.
- **Wrong**: two stacked rows; the "Design" tab only matters in Classic view; the privacy table is a radio grid with
  no current-state summary.
- **Rebuild**: header eyebrow *Account*, title *Who sees what*. One row of view tabs flattening both rows:
  *Visibility* · *About me* · *More about me* · *Data* · *Notifications* · *Classic look* (6). Summary on Visibility:
  "Public: projects, publications, placements · Logged-in users: — · Nobody: photo, timetable, contacts, e-mail"
  (from the checked radios at load). Page action: *See my page as others do* (the person-page link InSIS gives).
  InSIS's form as a form card, the radio grid restyled in place (column headers sticky, row labels in `--fg`).
- **Safety**: the summary reads the radios once; it never changes them; *Save* is InSIS's.
- **Open**: snapshots of `zalozka=2,3,4` (Set data, Design, Notifications) and sub-tabs 2–3; Czech.

### 2.22 Surveys & elections (`vv/epruzkumy/prehled_pruzkumu.pl`, `evolby/portal_volice.pl`; L, section page C)

- **For**: answer a university survey; vote in senate elections. A few times a year, with a deadline.
- **InSIS pages** (crawl): eSurveys: tabs *List of eSurveys* · *Settings*; filter form (type, state, activity,
  *Restrict*); table Status · Name · Type · Anonymous · Submitter · Since · Until · Answered by · Show questionnaire;
  Settings: one radio group "Send info about new eSurveys". Elections: tabs *Current* · *Past*; table Status · Name ·
  Subject · Group of voters · Kind · Start · End · Ballot · You may abstain · Vote (Past: Preview · Confirm ·
  Results; a *Restrict* form).
- **Rebuild**: section *Surveys & elections* opens a C page: **Open now** — open surveys and running elections as rows
  (name, closes in, InSIS's *Show questionnaire* / *Vote* link kept as InSIS's link) or "Nothing open"; then links
  *All surveys* and *Past elections*. Each InSIS page (L): header, view tabs (Surveys: *List* · *Settings*; Elections:
  *Current* · *Past*), filter form slotted, rows rebuilt with the action cell InSIS's own. The All services badge and
  a To do item ("Survey closes in 3 days") come from the same background read.
- **Safety**: questionnaires and ballots are never read (`read: never`); InSIS+ does not show results it has not been
  given on the list page.
- **Open**: snapshots with an open survey and a running election (status markup, action cells).

### 2.23 All services (`#ipx:dest.all`, C)

- **Now**: `groupedList('all')`: ten cards in `structure.tabs.all` order.
- **Rebuild**: header *All services*; a filter field ("Find a service"); the services A–Z by label with their gloss;
  badges with text ("1 survey open", "2 tasks"); exceptions (G) marked nothing special — they are services like any
  other. No groups (the IA promises A–Z).

---

## 3. Section-level remarks

### 3.1 Who to ask is in two places
`structure.tabs.campus` (Contacts) and `structure.tabs.help` both hold `campus.office`, so the sidebar shows the page
in Campus and Help; when it is open, two destinations claim it. **Fix**: Who to ask lives in **Help** (the top-bar
"?" is on every page, the phone Menu's first row is "Help & who to ask", the task table counts it from Help). Remove
`campus.office` from `structure.tabs.campus`; rename the node `help.office` (labels unchanged); the Campus overview
links to it through its *Study department* KPI (a link from another place, principle 2). Contacts keeps People ·
Departments.

### 3.2 "Requests" is not a dead end: the Contact centre holds the forms
The Study matters overview says requests (interruption, recognition of courses) have no InSIS page. The Contact
centre lists exactly these as e-applications: *Application for interruption of study*, *Request to recognize a course
studied outside / at VŠE*, *Abandoning the studies*, transfers, CTVS exemptions, scholarships, special needs.
**Fix**: restore *Study matters › Paperwork › Requests* with `entry` `/auth/kc/kc.pl` (allowed set `""`) and a gloss
"Applications to the study department (Contact centre forms)"; the Requests page of InSIS+ is the Contact centre's
form list (2.13) filtered to *Study Issues*, *Study Abroad*, *Scholarships*, *Registration*, *Fees* by default. The
"Something else?" card on the Study matters overview drops the requests sentence. Help › Ask a question keeps the same
page (one page, two entries: it is one job — writing to the office — so it is the same InSIS page, not a duplicate).

### 3.3 About VŠE duplicates the navigation
Its entry `verejne_informace.pl` is a menu of 16 links, 12 of them sections already. **Fix**: composed About VŠE
(2.8); `verejne_informace.pl` gets no link from InSIS+ (keep its mapping for Classic view arrivals).

### 3.4 `studijni/` is mapped to the wrong place
Mapped as "Study Department landing" (`campus.office`), it is an InSIS menu hub with *Course catalogue* and
*Enrollment statistics*. **Fix**: node `courses.catalogue`, never linked from InSIS+; arrivals get the generic
shell. Same for `sit/` (menu hub of Account › E-mail & accounts): never linked.

### 3.5 The mail box's two rows of tabs, and the forwarding box twice
Row 1 mixes a place outside InSIS, an action, a staff tool, an address book and settings; row 2 (settings) stacks under
it; the folder tree is a third navigation. **Fix** (2.9, 2.11): Office365 and New message → page actions; folders →
the one row of view tabs; Settings → its own section *Mail settings* with one row (Forwarding first); Group messages →
a view of Mail settings; Contacts → InSIS's own link inside New message. The forwarding fact appears once, as the
mail box's status line; delete the separate "Where do messages arrive?" card in `messages.js`. Add node
`messages.settings` (entry `/auth/posta/forwardy.pl`) to `structure.tabs.messages`.

### 3.6 Thesis topics have two homes
`pracoviste/prehled_temat.pl` is node `campus.departments`, also `studies.thesis`. The job ("find a topic to write")
belongs to Study matters › Thesis. **Fix**: node `studies.thesis`, also `campus.departments`; the department's
*Thesis topics* tab links to the same page. Likewise the Theses archive (past theses) stays in Campus › Information
with a cross-link from Thesis — a different job (read, not choose).

### 3.7 Two "where does my mail go" settings
`posta/forwardy.pl` (InSIS mail → an address) and `sit/univ_posta.pl` (university e-mail → a distribution server)
answer neighbouring questions on pages in two places. **Fix**: keep each in its place (Messages › Mail settings;
Account › E-mail & accounts) with one line on each page naming the other; the Account overview shows both statuses
side by side (2.15).

### 3.8 Security opens the password form
`entry` of `account.security` is `zmena_hesla.pl`, a never-touched page; the other seven security tools have no
route except InSIS's menu. **Fix**: Account overview rows (2.15); *Change password* stays the avatar shortcut.

### 3.9 Tab rows beyond rule 1
- Person page: up to 10 tabs → 5 + *More* by frequency (2.2).
- `pref.pl`, noticeboard settings, mail settings: two stacked rows → one row (2.11, 2.12, 2.21).
- Theses archive: 5 search modes as tabs — allowed (views of one archive).
- Departments: InSIS has no tabs for a department; InSIS+ adds one row of six views (2.4), replacing icon columns.
- Approvals and Graduates: single-tab rows → dropped (a row of one tab says nothing).
- `vv/bio/*`: three stacked rows; left as G (§4) — staff only.

### 3.10 Rooms under Departments
InSIS's crumb puts *Lecture rooms* under *Departments*; InSIS+ keeps Rooms under Campus and replaces the crumb with its
own eyebrow path (2.5). No change to the mapping.

### 3.11 Proposed `mapping.json` changes (for the lead; not applied)
`campus.office` → `help.office`, removed from `tabs.campus`; `studies.requests` restored with entry `/auth/kc/kc.pl`;
new `messages.settings` (entry `posta/forwardy.pl`; pages `nastaveni.pl`, `slozky.pl`, `forwardy.pl`,
`hz_ng_sprava_mlistu.pl`); `/auth/studijni/` → `courses.catalogue`; `prehled_temat.pl` → `studies.thesis` (also
`campus.departments`); `add_guy` and `export_osoby` on the parameter deny list; `account.*` entries → the Account
overview anchors; `zakladni.pl` `id` pinned in `values` once verified.

---

## 4. Exceptions (G) for `03-pages.md` §6

- **Never touched**: `system/zmena_hesla.pl`, `system/zmena_identity.pl` (and logout) — credentials and identity; the
  shell does not even wrap them.
- **Security forms, verbatim**: `system/hesla_nastaveni.pl`, `nastaveni_totp.pl`, `nia.pl`, `nastaveni_delegatu.pl`,
  `sessions.pl`, `zobraz_wlog.pl` — security wording must stay exactly InSIS's, most are `read: never`, each is used
  once a study at most; reached from the Account overview.
- **Research and staff tools**: all `vv/*` (13 types), `pracoviste/projekty.pl`, `pracoviste/publikace.pl` (same
  records via departments; shown as G content under InSIS+'s department tabs).
- **Classic-look customisation**: `personalizace/menu_user.pl`, `portlety.pl`, `menu_indiv.pl` — they configure the
  InSIS look InSIS+ replaces; they matter only in Classic view.
- **System and statistics**: `about/`, `dok/integratori.pl`, `system/agregat.pl`, `kontrola/statistika.pl`,
  `ca/ucty_info.pl` (server documentation).
- **InSIS documentation**: `help.pl` (context help, opens in a new tab).
- **Menu hubs, never linked**: `studijni/`, `sit/`, `verejne_informace.pl` — their links are InSIS+ sections already.
- **One-off notices**: `system/info_dist_srv.pl` (its only control is "do not show again", an action).
- **Low-use services**: `diskuze/` (forums replaced by Moodle; four forms, posting is an action), `todo/` (staff task
  blocks; the student's fact is the header count, shown as a badge; revisit if a student snapshot shows assigned
  tasks), `hledani/` (Ctrl+K covers it), `kurzy/nabidka_kurzu.pl` (public, fee-paying), `lide/absolventi.pl`.
- **Never read, not verified**: `vyveska/slozka.pl`, `vyveska/nove_prispevky.pl`, `posta/kontakty.pl`,
  `kurzy/prihlaska.pl`, `kurzy/kurz_prihlaska.pl`, `herna/*` — until a snapshot shows the markup and that opening
  them changes nothing.

---

## 5. Fresh snapshots needed (read-only, logged in, EN and CS)

1. `posta/slozka.pl` with messages (and a user folder); `posta/nova_zprava.pl`; `posta/forwardy.pl` with and without
   an address; `posta/nastaveni.pl` *Send notices* view.
2. `lide/` results after a search; `lide/clovek.pl` Contacts / Supervised theses / Final thesis tabs (a teacher, a
   student, the user's own page).
3. `pracoviste/stud_odd.pl` (with `fakulta`, CS and EN).
4. `pracoviste/pracoviste.pl?id=<department>` and that department's `zamestnanci.pl`, `predmety.pl`.
5. `mistnosti/` room detail (with equipment) and building detail.
6. `pim/knihovna_vypujcky.pl` with at least one loan.
7. `zp/` results and a thesis detail.
8. `vyveska/` with new contributions; `vyveska/slozka.pl`, `vyveska/nove_prispevky.pl` (only if opening a folder
   is confirmed not to mark notices as read).
9. `kc/kc.pl` other views (a "my queries" history, if any) and one form page; `dok/help.pl`; `dok/faq.pl`.
10. `kontrola/` during a check period; `system/oou_uziv.pl`.
11. `system/mobilni_zarizeni.pl`, `system/mobilni_aplikace.pl` (both views), `sit/univ_posta.pl`, `ca/ucet.pl`.
12. `ps/` (all four views).
13. `personalizace/pref.pl` tabs 2–4 and sub-tabs 2–3.
14. `vv/epruzkumy/prehled_pruzkumu.pl` with an open survey; `evolby/portal_volice.pl` during an election.
