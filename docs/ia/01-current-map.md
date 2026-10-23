# InSIS today: the map

Source: a read-only crawl of a logged-in student account (2026-10-23, English UI): 483 pages, 135 distinct page
types (138 with error and not-found pages), up to 4 clicks from the main page. Links that could change something (sign up, cancel, delete, mark as
read, rename, generate a document, start a test, settings forms) were not opened. Raw data stays on the
maintainer's machine (`test/fixtures/private/map/`); this file has no personal data.

## 1. How InSIS is organised

The main page is 12 boxes with ~60 links, grouped by **how the system is built**, not by what a student does:

| Box | Items |
|---|---|
| Public information portal | Study plans · Timetables (public search) · Persons at VŠE · Departments · Thematic search · Course catalogue · Graduates · Final theses at VŠE · Further information |
| My College (Moje studium) | **Student's portal** · Course Attainment Evaluation · Course evaluation by students · Study application form · Enrollment statistics · Overview of financing |
| eLearning | Tests and examinations · Electronic study materials |
| Science and research | Matching of publications · Biographical information · Creation of CVs |
| Personal management | Document server · Mail box · Sign up for news · Document storage · Discussion platforms · Noticeboard · Tasks · Library borrowings · Courses on offer · Application to U3V |
| eAgenda | Contact centre · eSurveys · My Elections · Register of printouts · Electronic document verification |
| Technology | Access control system · Accounts administration · University e-mail delivery · Identification cards |
| InSIS documentation | Documentation · System integrators · Licence · Statistics · My operations · Development projects |
| Adjustment of the IS | User settings · Portlets · Change photo · My favourites menu · Office 365 events |
| IS set-up | OTP · eID · My operations · Change identity · Delegates · Password change · Password recovery data · Login overview |
| Personal data | Personal data check · Approvals · Check statistics |
| Mobile app | About · Paired devices · Google Play · FAQ · App Store · Support · External app authorisations |

Plus in the header: new documents counter, tasks counter, Office 365, language, logout. There is also a games box.

### The Student's portal is a second main page

`student/moje_studium.pl` ("My College" / "Student's portal" / "Moje studium": one page, three names) is where
almost all study work starts. It has:

- a **studies table** whose columns are *unlabelled icons*: Register for examinations · Registration/Enrollment ·
  Extra-semestral courses · Final thesis · Registration at VS (minor tracks);
- an **11-tab row** shared by ~40 pages: My College · E-study record · My schoolmates · Study details · Map of my
  study · Course e-plans · List of topics · Coursework submissions · Plan progress check · My lectures sheet ·
  My favourite courses;
- **icon blocks**: Support of the selected study (Personal timetable, weeks overview, academic year schedule,
  whom to contact, contact centre, excuse notes, print documents, document storage, course evaluation, jobs
  portal) · Study financing and scholarships (financing, accommodation benefit, paid-out scholarships, bank
  accounts) · Placements abroad (exchange application) · Student card (change photo).

Exam registration and course registration, the two most important seasonal tasks, are reachable **only** through
those unlabelled icons.

## 2. Depth of common student tasks today

Clicks from the main page (each step = a page load); "hunt" = the target is one of 20+ similar items.

| Task | Path today | Clicks |
|---|---|---|
| See this week's classes | Main → Student's portal → (hunt) Personal timetable | 2 |
| Sign up for an exam | Main → Student's portal → unlabelled icon → tab "currently offered" → sign-up form | 3–4 |
| Register / change courses | Main → Student's portal → unlabelled icon → one of 5 sub-tabs | 3–4 |
| See my grades | Main → Student's portal → tab E-study record | 2 |
| See points during the semester | Main → portal → tab My lectures sheet → course → Regular assessment | 4 |
| Get materials for a course | Main → Document server → tree (faculty → department → course folder) | 3–6 |
| Hand in coursework | Main → portal → tab Coursework submissions → Insert files | 3 |
| Exam date details / who else is registered | portal → icon → list → Details | 4 |
| What do I still have to complete | Main → portal → tab Plan progress check ("Unaccomplished study duties") | 2 |
| Classmates in my seminar | Main → portal → My schoolmates → course → group | 4 |
| Syllabus of my course | Main → Course catalogue → search → syllabus (or from the e-study record) | 3 |
| Confirmation of study | Main → portal → (hunt) Print documents → document | 3 |
| Find a room | Main → Departments → Lecture rooms → campus → building → room | 4–5 |
| Contact a teacher | Main → Persons → search → person → Send an e-mail | 4 |
| Whom to contact (study department) | Main → portal → (hunt) Whom to contact | 2 |
| Academic calendar | Main → portal → (hunt) weeks overview / academic year schedule | 2–3 |
| Fill in course evaluation | Main → Course evaluation by students → Fill in | 2 |
| Online test | Main → Tests and examinations | 1 |
| Final thesis topic | Main → portal → List of topics → Final theses topics | 3 |
| Change password | Main → (expand box) → Password change | 1–2 |

## 3. Problems found

1. **Organised by system modules.** "Personal management", "eAgenda", "Technology", "Adjustment" and "IS set-up"
   mean nothing to a student; settings alone are spread over five boxes.
2. **Key tasks hidden.** Exam and course registration sit behind unlabelled icons two levels deep.
3. **One thing, many names.** E-study record = E-index = Průchod studiem = "Overviews and your study information";
   Coursework submissions = "Submission of theses and projects" = Odevzdávárny; Plan progress check =
   "Unaccomplished study duties"; Timetables (public search) vs Personal timetable vs "Display and print the
   course weekly plan"; Contact centre has two addresses.
4. **No course page.** Everything about one course is spread over ~10 pages: syllabus, e-plans, timetable,
   schoolmates, lectures sheet (points), submissions, e-study record (result, attempts), exam dates, document
   server folder, course evaluation, topics. Each page lists *all* courses, and the student filters by eye.
5. **Long flat tab rows.** The portal's 11 tabs mix weekly needs (record, submissions) with rare ones (map of
   study, favourite courses); some pages add a second row of 3–6 sub-tabs.
6. **Duplicates in the menu.** Course evaluation, financing, document storage and contact centre each appear both
   on the main page and in the portal; "My operations" appears twice.
7. **Irrelevant items for students** next to important ones: publication matching, biographical data for
   researchers, CV creation, elections, U3V application, statistics, licence, games.
8. **Study context is implicit.** Most study pages carry `studium` and `obdobi` (study, period) parameters; the
   period switch is buried in each page.
9. **Dead ends and inconsistency.** Every page has a generic help link; titles, breadcrumbs and tab rows differ
   between modules (bio has 8 + up to 15 sub-tabs; document server 5 + 4; mail 6 + 4).

## 4. Links that change something (never opened, never read in the background)

InSIS uses plain links (GET) for some actions. The crawl, and any background reading by InSIS+, skips:
menu state (`_menuexpand*`, `menu_indiv.pl` up/down/quick link), sign up / sign off / add / delete / rename
parameters, document generation (`tisk_dokumentu.pl?…tisk…`, confirmations), notification switches
(`list.pl?email_on`), adding contacts (`posta/kontakty.pl?add_guy`), disabling app access
(`mobilni_aplikace.pl?…zakazat`), questionnaires (`anketky/dotaznik.pl`), proposing or selecting thesis topics,
downloads and exports, logout, password and identity pages. Opening document-server and noticeboard *items* may
mark them as read, so only lists are read. New parameter names are treated as unsafe until reviewed.

## 5. Page inventory

All 135 page types with their new place: see `mapping.json` (machine-checked: every crawled page type must be
mapped) and the summary in `02-redesign.md`.
