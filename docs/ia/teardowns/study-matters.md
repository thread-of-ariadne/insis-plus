# Study matters: page teardowns (draft 1)

Applies `03-pages.md` (§1 navigation rules, §2 anatomy, §3 treatments) to every page type whose node is
`studies.*` in `mapping.json`, plus the composed overview `dest.matters` (`composed.js`). Principle 7 of
`02-redesign.md` governs every action below: InSIS performs it, on its own page, by the student's own click.
InSIS+ never fills, submits, pre-selects, moves or copies an InSIS form; it slots InSIS's own form element.

Evidence: crawl (`test/fixtures/private/map/crawl.json`, 36 page records under these routes, 19 skipped as
actions or unverified), snapshots `student-portal.html` / `student-portal-cs.html` (`moje_studium.pl`) and
`financing.html` (`financovani.pl`), the current modules `pages/student-portal.js`, `composed.js`, `generic.js`
/ `generic.css`. No personal data from the snapshots is reproduced here.

## 1. Inventory

*Now*: **M** = own module, **S** = generic shell only (InSIS's `#str1` slotted with restyling). *Snapshot*: file
name, **crawl** = structure only, **–** = never opened.

| Page type (path) | Node | Now | Snapshot | Treatment | Reason |
|---|---|---|---|---|---|
| `#ipx:dest.matters` (composed) | dest.matters | M | – (InSIS+ page) | **C** | Overview with live data; today half of it is a second copy of the sidebar (§3.4). |
| `student/moje_studium.pl` | studies.status | M | ✓ student-portal.html, student-portal-cs.html | **R** | Becomes *Study status*: the studies table is the only content that is not navigation. |
| `student/studium.pl` | studies.status | S | crawl | **R** | Three read-only history tables (interruptions, trips abroad, registration coupons): a second view of the same study. |
| `karty/` | studies.status | S | crawl | **R** | A menu page with two links; drawn as the ID card block, never linked by InSIS+ (the block links the leaves). |
| `karty/typy_karet.pl` | studies.status | S | crawl | **R** | Short information text about card types (181 chars, no table); trivial. |
| `karty/platnost.pl` | studies.status | S | crawl | **F** | One field (card number) + Search: a form page. |
| `personalizace/vkladani_fotky.pl` | studies.status (also account.profile) | S | crawl (opened without parameters) | **F** | Photo upload and approval: a pure action, `read: never`. |
| `student/tisk_dokumentu.pl` | studies.papers | S | crawl | **L** | A list of documents whose every cell is a generating link (action): rebuilt as a matrix, InSIS's own anchors kept. |
| `student/tisk_dokumentu.pl?…tisk…` (generation links) | studies.papers | – (never opened) | – | **G** (§6: print outputs) | The output is a PDF / print; never touched, never read. |
| `uloziste/` (folders `rezim,slozka`) | studies.papers | S | crawl (both folders) | **L** | Delivered documents with delivery state; the Open link is InSIS's own (`zobrazeni.pl` records "Displayed"). |
| `uloziste/zobrazeni.pl` | studies.papers | – | – | **G** (§6) | Opening one stored document (file output, `read: never`, `insis-only`). |
| `tisk/evidence_tisku.pl` | studies.papers | S | crawl | **L** | Register of my printouts: a long table plus a filter form. |
| `epd/` | studies.papers | S | crawl (51 chars, no form captured) | **F** (provisional) | Electronic document verification; the crawl saw no form, so the treatment waits for a snapshot. |
| `student/moje_omluvenky.pl` | studies.excuses (also schedule.week) | S | crawl | **F** | My excuse notes: a three-column table and a filter checkbox; the "add" control was not seen. |
| `student/financovani.pl` (`obdobi,studium`, `studium`) | studies.money (also home) | S | ✓ financing.html | **R** | Two information tables (financing history, decisions on fees) and a key; no action. |
| `student/financovani.pl?prehled` | studies.money | S | crawl (276 chars) | **R** | Main-menu variant "Overview of financing"; almost empty in the crawl, probably a study chooser. |
| `student/vypl_stip_student.pl` | studies.money | S | crawl (empty: no table) | **R** | Paid-out scholarships: information only; columns unknown. |
| `student/bank_spojeni_clovek.pl` | studies.money | S | crawl | **F** | Register of bank accounts + a 20-field add form. |
| `student/zadost_ubyt_stip.pl` | studies.money | S | crawl | **F** | Accommodation benefit application: account fields + Submit application. |
| `student/zp_temata.pl` (`obdobi,studium`, `seznam`, `zaverecne`) | studies.thesis | S | crawl | **L** | List of thesis topics (≈170 rows) with capacity and Detail; filter form. |
| `student/zp_temata.pl?detail,…` | studies.thesis | S | crawl (3 topics) | **F** | One topic: description list + InSIS's Register button. |
| `student/zp_temata.pl?…zalozeni` / `?…vybrano` | studies.thesis | – (skipped) | – | **F** (when verified) | Propose a topic / selected topic: parameter sets not in `links`, no link until a snapshot confirms opening is side-effect free. |
| `int/zavzpr.pl` | studies.abroad | S | crawl (42 kB text, no table captured) | **L** | Reports of former students, a 14-select filter form; list markup unknown. |
| `int/podani_prihlasky.pl` | studies.abroad | S | – (`verify`) | **F** (when verified) | Exchange application form; never opened, so no link and no read. |
| `katalog/dohody.pl` (`""`, `typ`) | studies.abroad | S | crawl | **R** | Agreement types → countries with counts; the third level (`stat,typ`) is not allowed yet. |
| `praxe/` (`zalozka`: companies, offers, my internships, profile) | studies.internships | S | crawl (3 of 4 tabs) | **L** | One tool with four views; each view a list with a filter. |
| `prihlaska/auth/evidence_eprihlasek.pl` | studies.nextdegree | S | – (`verify`, `read: never`) | – (card on the overview) | Never read; said on the overview (rule 3). |
| `#ipx:studies.requests`, `#ipx:studies.nextdegree` (composed signposts) | studies.requests / nextdegree | M | – | **remove** | Dead-end pages left in `composed.js` after rule 3 removed the sections (§3.3). |

## 2. Teardowns

Common to every page below (not repeated): the header eyebrow is *Study matters*; InSIS's breadcrumbs, `#titulek`
heading, portal bar (`table.portal_menu` with the 11 links), "View application help" icon, icon images and layout
tables are gone; InSIS's help `.small` paragraphs are shortened into the line above a form or a gloss; the period /
study line under InSIS's heading ("Study – …, study period – …") becomes the subtitle only where the page depends on
it. Every link drawn by InSIS+ is the original `href`, passed through the URL rule; anything that fails it is
dropped, not rewritten.

### 2.1 Study status — `student/moje_studium.pl` (R, own module exists)

**Purpose.** "Am I properly enrolled, is anything blocking me, which study am I working in." Rare by choice (a
few times a year: after enrolment, when a restriction appears, when switching studies); today it is visited
constantly only because it is InSIS's second main page.

**On the InSIS page.** H1 "Student's portal", crumb "My College"; the portal bar (11 links); a help paragraph about
the Choose bullet; the **studies table** (Choose · Faculty · Study · Progress of study · Restriction, then five
icon-only columns: Register for examinations · Registration/Enrollment · Extra-sem. courses · Final thesis ·
Registration/Enrollment at VS); four icon blocks (*Support of the selected study* 10 links, *Study financing and
scholarships* 4, *My placements abroad* 1, *Student card* 1: Change photo). One empty POST form wraps all.

**What is wrong.** InSIS: one page, three names; status data is three cells in a table of icons; the only ID card
item is in a block whose help text says it is "not directly bonded to the study". InSIS+ now: the module's title
says *Study status & ID card* but its main content is *Everything else*, a filterable list of ~25 portal links in
InSIS+'s own groups. That is a repeat of the navigation (forbidden by §2 and rule 4: every link already has its
section). The rail shows the week strip, next classes and submission deadlines: Home's content, not related
context. The header comment promises "six main actions as labelled cards" that `buildPage` no longer draws.

**Rebuild.**
- Header: title **Study status** (*Stav studia*); no page action.
- View tabs (rule 5, both pages are views of "my study"): **Status** (`moje_studium.pl`) · **History**
  (`studium.pl`). The tabs are the original links (`studium` / `obdobi,studium` sets).
- Summary: one status line from the active study's row: programme · form · faculty chip · progress chip
  ("enrolled" in `ok` tone, anything else `neutral`) · restriction chip (`bad` with the text, or "No restriction"
  in `ok`). With a restriction: one sentence "A restriction can block registration and exam sign-up; the study
  department of {faculty} sets and lifts it", and the faculty's *Whom to contact* link (copied from the page).
- Content:
  1. **Your studies** (only with 2+ rows): a list, one row per study: faculty, programme and form, progress,
     restriction; the active one marked *Active*; for the others InSIS's own Choose link labelled
     **Work in this study**. The top-bar study switch reads the same parse.
  2. **ID card** card: photo state is unknown to InSIS+, so the card says "Your ISIC / employee card uses the photo
     in InSIS" with **Change photo** (InSIS's link to `vkladani_fotky.pl`, copied), and two quiet links:
     *Card types* (`karty/typy_karet.pl`) and *Check a card's validity* (`karty/platnost.pl`).
- Dropped: the five per-study action icons and all four icon blocks (each is a sidebar section: Exams,
  Registration, Thesis, Money, Excuse notes, Papers, Internships, Abroad, Who to ask, Course evaluation, My week).
  Registration at VS (minor track) belongs to Registration & enrolment and must be reachable there before it is
  dropped here.
- Rail: **Who to ask** (the faculty's study department link and Contact centre, both copied from the page). No
  week strip, no classes, no deadlines.
- InSIS form: the wrapping form has no fields or buttons; nothing is slotted.

**Data to parse** (keep `parse()` / `remember()`; they feed the overview, To do and the study switch): per study
row the status icon `data-sysid` (`stav-aktivni` = active), Choose link, faculty, programme lines (`<b>` split by
`<br>`), progress, restriction text; the `#titulek b` pair (study, period); every link by path
(`ipx.state.portal.paths`, used by `nav.js`).

**Safety.** Read only; the page is `read: background`. The Choose link switches InSIS's working study by a GET the
student clicks; InSIS+ never follows it itself.

**Open questions.** Markup of a restriction cell and of a second study row (the snapshot has one study, empty
restriction): needs a snapshot from an account with a restriction or two studies.

### 2.2 Study status › History — `student/studium.pl` (R)

**Purpose.** "When was my study interrupted, was my exchange recorded, how many registration coupons do I have."
Rare (once or twice per study).

**On the InSIS page.** H1 "Student's portal", crumb "Study details", portal bar, an "all periods" heading, three
tables: *Interruption of study* (Status · In process · Since · Until · Days · Reason), *Trips abroad*
(Institution/Enterprise · Status · Past from · Original deadline · Real since when · Real till when · Changed ·
Changed by), *Registration coupons* (Quantity · Justification). Empty POST form.

**What is wrong.** Three empty tables with headers are the common case; "Changed by" is staff audit noise.

**Rebuild.** Header **Study status**, tab **History** active. Summary: one line per fact that exists ("No
interruptions", "1 trip abroad recorded", "Registration coupons: N"). Content: three cards, each a short list
(interruptions: dates + days + reason; trips: institution, status chip, real dates; coupons: quantity +
justification), each hidden when empty with the summary line saying so. Drop Changed / Changed by. Rail: link to
*Study abroad* for trips, *Registration & enrolment* for coupons.

**Data.** The three tables by their header row (match header text, not position).

**Open questions.** Rows of each table (all empty for the crawl account); what "registration coupons" are used for
(to write the gloss), and whether the "all periods" heading hides a period selector.

### 2.3 ID card pages — `karty/`, `karty/typy_karet.pl`, `karty/platnost.pl`, `personalizace/vkladani_fotky.pl`

**Purpose.** Change the card photo (once, before the first card, or when it is rejected); occasionally check a
card. Very rare.

**On the InSIS pages.** `karty/`: a menu ("Checking and types of cards") with two links and Open all / Close all.
`typy_karet.pl`: crumb only, ~180 characters of text. `platnost.pl`: field `cislo` + **Search**. `vkladani_fotky.pl`:
"Loading photograph from disc (only JPEG, max. size 5 MB)", a file input (`mfu_upload`), "Approval of photo",
**Continue**; ~11 kB of rules text.

**What is wrong.** `karty/` is a page of links (a dead end in all but name); the photo rules are a wall of text;
the generic shell keeps the menu's Open all / Close all.

**Rebuild.**
- `karty/` (R): title **ID card**, the two leaves as rows with glosses ("What each card type is for", "Check
  whether a card number is valid"). InSIS+ never links to this page (the Study status ID card block links the
  leaves); it is drawn only when InSIS sends the student there.
- `typy_karet.pl` (R): title **Card types**, InSIS's text as a description list if it is one, otherwise a single
  text card.
- `platnost.pl` (F): title **Check a card's validity**; summary none; one line: "Enter the number printed on the
  card and press Search: InSIS shows whether the card is valid." InSIS's form slotted as a form card; the result
  area below it rebuilt as a status line if it is structured, otherwise left as InSIS draws it.
- `vkladani_fotky.pl` (F): title **ID card photo**; one line: "Choose a JPEG (max. 5 MB) and press Continue;
  InSIS shows the photo for approval before it is used on your card." The rules text shortened into a checklist
  (format, size, face, background) with InSIS's full text behind a disclosure. Both InSIS forms slotted in order
  (upload, then approval) as one form card.

**Safety.** `vkladani_fotky.pl` is `read: never`: InSIS+ draws it only when the student opens it, never fetches it,
never touches the file input, never previews or resizes the file (that would mean reading it), never presses
Continue. Same for `platnost.pl`: no prefill of the card number.

**Open questions.** Snapshots of all four (the crawl has text lengths only), in particular what
`vkladani_fotky.pl` shows after an upload (the approval step) and the result markup of `platnost.pl`. Whether a
student can see their own cards anywhere (a "my cards" list was not found: if it exists, the ID card block shows
it).

### 2.4 Confirmations & decisions › Get a confirmation — `student/tisk_dokumentu.pl` (L)

**Purpose.** "I need a confirmation of study (for transport discount, insurance, visa, employer) in Czech or
English." The most frequent paperwork job: several times a year, often urgent.

**On the InSIS page.** Crumb "My College › Print documents", portal bar, two headings: *Print electronically sealed
documents* (six links: Confirmation of study, Study progress confirmation form, Study overview, each CZ and EN)
and *Print documents* (four links: Confirmation of study and Study progress confirmation form, each CZ and EN), a
link to Document storage. Each link carries a generation parameter (`potvrzeni_tisk_el`, `potvrz_prub_tisk`,
`prehled_tisk_el`, …, `jazyk`).

**What is wrong.** Ten links named almost alike, in two lists the student must decode ("electronically sealed"
vs plain); the difference between the documents is not explained; nothing says that the sealed one is the one
offices accept by e-mail.

**Rebuild.**
- Header: title **Get a confirmation** (*Potvrzení o studiu*); page action none.
- View tabs (rule 5, one section, three views of "my official papers"): **Get a confirmation** ·
  **Delivered to me** (`uloziste/`) · **Printed** (`tisk/evidence_tisku.pl`).
- Summary: one line: "Pick the document and the language. *Sealed PDF* carries VŠE's electronic seal and can be
  sent by e-mail; *Print* is a plain printout."
- Content: a matrix card, one row per document with a one-line gloss: *Confirmation of study* ("that you are a
  student now"), *Study progress confirmation* ("credits and results so far"), *Study overview* ("all your
  courses and grades"); columns **Sealed PDF: CZ · EN** and **Print: CZ · EN**; an empty cell where InSIS offers
  no link (Study overview has no plain print).
- The cells are **InSIS's own `<a>` elements**, moved inside the same page into the matrix (not copied, not
  rebuilt): their URLs carry action parameters and may never be built, copied or shown by InSIS+ (URL rule).
  Each is labelled by its column, with InSIS's original text as `title`.
- Rail: "Where does it go?" — the sealed PDF also appears under *Delivered to me* / *Printed* (to be verified),
  and **Verify a document** (`epd/`) for whoever receives it.

**Data.** Map each anchor to (document, sealed/plain, language) by its query parameter names
(`potvrzeni` / `potvrz_prub` / `prehled`, `_el`, `jazyk`), read from the DOM only; no fetch.

**Safety.** Every cell is an action (document generation; skipped by the crawl, on the deny list). InSIS+ never
follows, prefetches or hovers-prefetches them, never adds `target`, and never moves them off this page. A click is
the student's own.

**Open questions.** What a click produces (a PDF download, a new stored document, an entry in the register),
whether there is a daily limit or fee: observe once when the student next generates one (not by InSIS+). Whether
the page shows other documents in other states (e.g. after graduation).

### 2.5 Confirmations & decisions › Delivered to me — `uloziste/` (L)

**Purpose.** "Has the faculty sent me a decision (admission, fee, scholarship, interruption), and have I
received it?" Rare but legally important: delivery through InSIS has a deadline effect.

**On the InSIS page.** Crumb "Document storage"; InSIS's own folder tabs (*Admission procedure (n)* · *Study*,
links `rezim,slozka`); a filter form (`prihlaska_filtr` or `studium_filtr` select + **Restrict**); the table
Document · File name · E-seal/E-signature · E-signature · Note · Size · Display · Confirmed · Announced · Delivery
through InSIS · Displayed · Created · Created by · Application ID (admission folder only); a key.

**What is wrong.** Fourteen columns for what is "a letter, did I open it"; the delivery state is spread over four
date columns and an icon; the folder tabs would be a second tab row under the view tabs.

**Rebuild.**
- Header: title **Delivered to me** (*Doručené dokumenty*), tab active.
- Folders: not tabs (rule 1, one row): a segmented row of InSIS's own folder links with their counts in the
  summary ("Study · Admission procedure (2)").
- Summary: "N documents, M waiting for you to open" (waiting = delivered through InSIS and not yet displayed /
  confirmed).
- Content: one row per document: title (Document) + note; chips *Sealed* / *Signed* from the e-seal columns;
  delivery state as one chip: **Waiting** (`warn`, delivered, not displayed), **Opened {date}**, **Confirmed
  {date}**; created date; size. The **Open** control is InSIS's own link to `zobrazeni.pl`, kept in the row.
  Drop File name (machine name), Created by (staff), Application ID unless the folder has several applications.
- Filter: InSIS's form slotted as a compact card, only when its select has more than one option.
- Rail: what delivery through InSIS means (one sentence, from InSIS's help, checked with the study department
  wording) and *Who to ask*.

**Data** (`read: background`, feeds To do "Document delivered to me"): folder names and counts, per row: title,
note, e-seal/e-signature presence, Announced / Delivery / Displayed / Confirmed dates, created date. Never the file.

**Safety.** Opening a document is recorded by InSIS as "Displayed" (and can count as delivery): `zobrazeni.pl` is
`read: never` / `insis-only`; InSIS+ never fetches it, and the line above the list says "Opening a document records
in InSIS that you have received it."

**Open questions.** A row in the *Study* folder (the crawl's is empty) and an unconfirmed delivered row: which
column changes when, to define *Waiting* exactly (this blocks the To do trigger).

### 2.6 Confirmations & decisions › Printed — `tisk/evidence_tisku.pl` (L)

**Purpose.** "Which confirmations have I generated, and when." Rare.

**On the InSIS page.** A search form (radio `pro_typ`: for a user / for an application; text fields + Search for
each; Agenda; Type of document; From–To; **Restrict**), a second form (fields not captured; the *Sel.* column
suggests bulk controls) and the table Sel. · Type of document · Agenda · Study · Printed · Related to person ·
Marked as not released · Marked · Not released document · Details · E-seal/E-signature · Delivered · Changed ·
Changed by.

**What is wrong.** A staff-style register shown to students; 14 columns; the person search makes no sense for a
student.

**Rebuild.** Header **Printed** (*Vytištěné*), tab active. Summary: "N printouts, last {date}". Content: list,
one row per printout: type of document, study, printed date, chips *Sealed* / *Not released*, Details as InSIS's
link. The search form slotted whole, collapsed under **Filter** (never trimmed: hiding single fields of an InSIS
form is changing it). The second form and the *Sel.* checkboxes stay InSIS's own, in place.

**Open questions.** A snapshot with rows: what the second form does (if it is a bulk action, the rows keep InSIS's
checkboxes and the button stays visible under the list), what *Details* opens, whether *Delivered* links to
`uloziste/`.

### 2.7 Verify a document — `epd/` (F, provisional)

**Purpose.** Check that a sealed VŠE document is genuine. Mostly for the receiving office; a student almost never.

**On the page.** The crawl captured 51 characters and no form (likely a form drawn by script, or an iframe).

**Decision.** Not a view tab of Papers (it is not "my papers"): a rail link on *Get a confirmation* and an entry in
All services. Treatment F once a snapshot shows the form: title **Verify a document**, one line on what to enter,
InSIS's form slotted, result rebuilt as a status line.

**Open question.** Snapshot needed (what it asks for, whether it is in a frame: frames are §6 G).

### 2.8 Excuse notes — `student/moje_omluvenky.pl` (F)

**Purpose.** "Record that I was ill / away" and "which absences are excused". A few times a semester; also reached
from a past class in My week.

**On the InSIS page.** Crumb "My College › My excuse notes", portal bar, period heading, table Since · Until ·
Reason for absence, a form with one checkbox `filtr` and **Go**.

**What is wrong.** The crawl shows no way to add a note: either InSIS shows the add form only in some periods, or
students cannot add notes here at all (then the section's gloss "Excuse yourself from classes" promises something
InSIS does not do).

**Rebuild.** Header **Excuse notes** (*Omluvenky*); no view tabs. Summary: "N excuse notes this period" or the
empty state "No excuse notes this period. {how to get one: from the add form below, or the faculty rule}". Content:
list, one row per note: date range (one date if Since = Until) and reason. InSIS's filter form slotted next to the
list heading with its label kept. If the add form exists, it is slotted as a form card with the line "Enter the
dates and reason and press InSIS's button; the note goes to {whom — from InSIS's text}."

**Safety.** No prefill from My week: the link from a past class opens this page unchanged (principle 7.5).

**Open questions.** A snapshot in a period with notes and with the add form (if any); the label of the `filtr`
checkbox; the Czech/English wording of who approves a note. Until then the gloss changes to "Your excuse notes".

### 2.9 Payments & scholarships › Fees — `student/financovani.pl` (R)

**Purpose.** "Do I have to pay anything (study fee for exceeding the standard length, a second study), by when,
to which account." Rare but high-stakes; most students only need the reassurance "nothing to pay".

**On the InSIS page** (`financing.html`). Crumb "My College › Study financing", portal bar; an info message ("the
displayed data is just for your information; the printed decision on fee assessment is binding"); *Overview of
current financing* (help paragraph; table Financing · Since · Until: coded rows such as "1 – study fully
financed …", "8 – standard length of study exceeded < 1 year"); *Decision on financing* (help paragraph; table
Status · Account number · Recipient name · IBAN · SWIFT · Variable symbol · Issue date · Due date · Type · Sum ·
Manually · Settled · Installments · Entered · Entered by · Detail, or "No suitable data found."); a collapsible
key mapping status icons (`stav-zruseno2` cancelled, `stav-zaplaceno` paid, `stav-vytvoreno` created) and
settlement icons (`uhrazeno-pred-splatnosti`, `uhrazeno-po-splatnosti`, `neuhrazeno-pred-splatnosti`,
`neuhrazeno-po-splatnosti`).

**What is wrong.** The answer ("nothing to pay") is a "No suitable data found" row inside a 16-column table; the
financing table mixes the current state with a *future* change (the date the standard length runs out) without
saying which is which; the meaning of icons needs the key.

**Rebuild.**
- Header: title **Fees** (*Poplatky*); view tabs **Fees** · **Scholarships** (`vypl_stip_student.pl`) · **Bank
  accounts** (`bank_spojeni_clovek.pl`); page action **Apply for accommodation benefit** (link to
  `zadost_ubyt_stip.pl`, the page that holds the action).
- Summary: one status line: **Nothing to pay** (`ok`) or **{n} to pay, due {date}** (`bad` when past due) — only
  once `verify_data: items to pay` is lifted; until then "No fee decisions" / "{n} fee decisions" without a
  verdict. Second fact: "Funded by the state until {date}" from the financing row in force today; when a later
  row exists, "From {date}: {meaning}" in `warn` (the standard-length warning students miss).
- Content: (1) **Financing** timeline: rows Since–Until with InSIS's text minus the code number, today's row
  marked *Now*, future rows *From {date}*; (2) **Fee decisions**: one card per decision: type, sum (and the
  *Manually* amount when it differs, labelled "amount now requested"), issue and due dates, status chip from the
  icon's `data-sysid` (cancelled / created / paid) and settlement chip; a *Payment details* description list
  (account, IBAN, SWIFT, variable symbol, recipient) with Copy buttons (clipboard only, client-side); *Detail* as
  InSIS's link. Empty state: "No fee decisions. If you exceed the standard length of study, the faculty will issue
  one here."
- The info message becomes the line under the summary: "Only the printed decision is binding."
- Key dropped (chips are labelled). Entered / Entered by dropped.
- Rail: *Who to ask about money* (study department link from the portal state).

**Data** (`read: background`, also Home): financing rows (text, since, until), decision rows (status sysid,
settlement sysid, type, sum, manual, dates, payment fields, detail href). Payment fields stay in session storage
only (principle 8.1) and never reach To do text.

**Open questions.** A decision row (all columns, the settlement icon placement, installments): needed to lift
`verify_data` and switch on the To do "Payment to make". The `prehled` variant (`financovani.pl?prehled`, 276
characters): snapshot to see whether it is a study chooser (then: draw the choice as a list of InSIS's own links)
or the same page.

### 2.10 Payments & scholarships › Scholarships — `student/vypl_stip_student.pl` (R)

**Purpose.** "Was my scholarship paid, how much, when." A few times a year for those who get one.

**On the page.** Crumb "My College › Paid-out scholarships", portal bar, heading, no table for the crawl account.

**Rebuild.** Header **Scholarships** (*Stipendia*), tab active, page action **Apply for accommodation benefit**.
Summary: "{total} paid this academic year, last on {date}" or the empty state "No scholarships paid to you yet.
Scholarships are paid to the account marked for scholarships under Bank accounts." Content: list per payment
(type, period, amount, date). Rail: Bank accounts tab link is enough; *Who to ask*.

**Open questions.** Snapshot with payments (columns unknown).

### 2.11 Payments & scholarships › Bank accounts — `student/bank_spojeni_clovek.pl` (F)

**Purpose.** "Which account will VŠE pay my scholarship to / refund to"; add or change it. Once per study, plus
when the bank changes.

**On the page.** Crumb "My College › Register of bank accounts"; table Since · Until · Purpose · Modify purpose ·
Account number · Currency · Bank · Bank address · Recipient · Recipient's address · Already recorded · Note ·
Modify · Changed · Changed by; one form with ~20 fields (purpose, bank country, bank, bank name/address,
currency, account / IBAN / account-or-IBAN, SWIFT, recipient, country, street, postcode, city, from, to, note,
*activate* checkbox) and several **Add** buttons (`pridat`).

**What is wrong.** A 15-column table and a 20-field form on one screen; *Modify* and *Modify purpose* controls are
cells among data; the purpose (the thing a student cares about: "for scholarships") is the third column.

**Rebuild.** Header **Bank accounts** (*Bankovní účty*), tab active. Summary: "Scholarships go to the account
ending {last 4}" per purpose, or "No account for scholarships yet" (`warn`). Content: one card per account:
purpose as title, account shown with the middle masked and a reveal toggle (screen privacy only), bank, currency,
valid since–until, *Active* chip; InSIS's *Modify* and *Modify purpose* controls kept inside the card (moved within
the page). Below, InSIS's add form slotted whole as a form card titled **Add an account**, open when there is no
account, collapsed (a disclosure around the untouched form) otherwise; line above: "Fill in InSIS's form and press
Add; the account is used for payments with the purpose you choose from the date you enter."

**Safety.** Never prefill from the accommodation-benefit form or any other page; never auto-open the disclosure
with a field focused; never validate IBANs by rewriting the field (an inline hint is fine only if it does not change
the value).

**Open questions.** What *Modify* opens (same page with a filled form, or a separate step) and whether the several
Add buttons differ (Czech vs foreign account): snapshot of both states.

### 2.12 Accommodation benefit — `student/zadost_ubyt_stip.pl` (F)

**Purpose.** Apply for the accommodation benefit for the academic year. Once a year, in a window.

**On the page.** Heading "Accommodation benefit application form for the year {yyyy/yyyy}", a notice (account must
be in CZK at a Czech bank), *How to enter bank account number correctly* (help), fields prefix / account number /
bank select, **Submit application**. ~3.8 kB of text.

**Rebuild.** Not a view tab (it is an action, rule 1): reached by the page action on Fees / Scholarships, and the
sidebar highlights *Payments & scholarships* while on it. Header **Accommodation benefit {year}**
(*Ubytovací stipendium*). Summary: "Apply once per academic year; it is paid to the Czech (CZK) account you enter
here." Content: the help text shortened to three bullets (who qualifies — from InSIS's text, account format,
where it is paid) with InSIS's full text behind a disclosure. InSIS's form slotted as a form card; line above:
"Enter a CZK account at a Czech bank and press *Submit application*; InSIS records your application for {year}."

**Safety.** No prefill from Bank accounts (even if the account is known); no prefix/number splitting help that
writes into the fields.

**Open questions.** What the page shows after an application (status, or the form again), and outside the window:
snapshot of both.

### 2.13 Thesis & state exam — `student/zp_temata.pl` (L list, F detail)

**Purpose.** Final-year students: find and register for a thesis topic, or propose one; later see my topic and
supervisor. Weeks of browsing once, then rare.

**On the InSIS page.** Portal bar, then a second row (*Course topics* → `temata_prihlasovani.pl` · *Final theses
topics*) and a third row (*List of topics* · *Propose topic*); "all periods"; filter form (supervisor,
department, **Restrict**); table Ord. · Type · Topic · Thesis supervisor · Supervising department · Programme ·
Major track · Occupied/Max. · Proposed · Detail (≈170 rows). Detail: crumb "Select topic › Final theses topics",
*Basic information* (Type of work, Topic, State of topic, Thesis supervisor, Faculty, Supervising department, Max.
no. of students, Registration mode, Proposed by, Summary) and a form with **Register** (`prihlasit`).

**What is wrong.** Three tab rows (the generic shell shows two of them, against rule 1); *Course topics* is a
different place (course projects) presented as a sibling tab; full topics look the same as free ones; no search.

**Rebuild (list).**
- Header **Thesis topics** (*Témata závěrečných prací*); page action **Departments' topics** (link to
  `pracoviste/prehled_temat.pl`, `also: studies.thesis`).
- View tabs: **Topics** · **Propose a topic** (the latter only once `zalozeni` is verified and allowed; until then
  absent). *Course topics* is not a tab: it is a place (Courses › topic sign-up) and gets a rail link.
- Summary: "My topic: {topic}, supervisor {name}" when the student has one (to be verified), otherwise
  "{n} topics, {m} with free places".
- Content: InSIS's filter form slotted as a compact card above the list; a client-side text search over the
  rendered rows (filters the DOM InSIS+ drew, never InSIS's form); one row per topic: topic title, type chip
  (bachelor / master), supervisor (InSIS person link), department, programme / major if not the student's own,
  capacity "occupied / max" with a *Full* chip when equal, Detail as InSIS's link.
- Rail: *Theses archive* (`zp/portal_zp.pl`), *Course topics*, the thesis deadlines once known.

**Rebuild (detail, F).** Header: the topic title; eyebrow *Thesis topics*. Summary: state of topic and capacity.
Content: description list (Basic information), Summary as text. InSIS's Register form slotted as a form card,
line above: "Press *Register* to sign up for this topic. Registration mode: {mode} — {what it means: e.g. the
supervisor confirms}." Supervisor as a person link.

**Safety.** Register, Propose and Select (`vybrano`) are actions: InSIS's own controls only; `zalozeni` and
`vybrano` get no InSIS+ link until a snapshot shows that opening them changes nothing.

**Open questions.** A final-year account: my registered topic, supervisor block, submission and state-exam pages
(`02-redesign.md` notes these were not in the crawl); the Propose form; the `vybrano` page; registration modes.

### 2.14 Study abroad — `katalog/dohody.pl` (R), `int/zavzpr.pl` (L), `int/podani_prihlasky.pl` (F, verify)

**Purpose.** "Where can I go, with which programme, what did others say, how do I apply." Seasonal (application
windows), mostly second-year students.

**On the pages.** `dohody.pl`: table Name of agreement · Number of agreements / institutions / countries /
students · Choose (→ `typ`); `?typ`: Country · counts · Enter (→ `stat,typ`, not allowed, skipped).
`zavzpr.pl`: InSIS tabs *Study placements* · *Work placement* (links with `akce`, not allowed), a 14-select filter
form + **Display**, 42 kB of text but no table captured. `podani_prihlasky.pl`: never opened.

**What is wrong.** The agreements drill-down dead-ends at the country list for InSIS+ (the next level's
parameters are not allowed); the reports page cannot show its own second view; the application, the one action of
the section, has no link.

**Rebuild.**
- Section entry: `katalog/dohody.pl` (*Partner universities*), because it is the only verified page that answers
  "where can I go". Header **Partner universities**; summary "{n} agreement types, {m} countries"; content: a card
  per agreement type (name, counts) linking to InSIS's `typ` page; on `?typ`, a country list with counts and InSIS's
  Enter link once `stat,typ` is verified (until then the row shows counts only, no dead link).
- `zavzpr.pl`: header **Reports from former students**; view tabs **Study placements** · **Work placements** once
  `akce` is reviewed (it reads like an action name but looks like a view switch here; if it stays denied, only the
  current view shows); InSIS's filter form slotted (14 selects: shown in two columns, untouched); results as a list
  per report.
- Page action on both: **Apply for an exchange** — absent until `podani_prihlasky.pl` is verified; until then the
  rail says where applications are announced (faculty international office, *Who to ask*).
- Rail: *Trips abroad recorded in your study* → Study status › History.

**Open questions.** Snapshots: `podani_prihlasky.pl` (opened by the student's own click, read-only look),
`dohody.pl?stat,typ`, `zavzpr.pl` result markup and its `akce` tab link.

### 2.15 Internships & jobs — `praxe/` (L)

**Purpose.** Find an internship offer, track my internships and their evaluation. Occasional; required in some
programmes.

**On the page.** Crumb "My College › Jobs portal"; InSIS tabs *List of companies* · *Offered internships* · *My
internships* · *My profile* (`je_student,studium,zalozka`), each with its own filter form: companies (`omezeni`),
offers (`obor`, `kraj`, **Choose**), my internships (`filtr_stav`, **Restrict**, plus a second form and a *Sel.*
column). Tables: Company · Administrator · No. of offers · Offers; Ord. · Offered internship · Branch · Company
name · Capacity · Details; Sel. · Status · Position · Company · Course of internship · Internship supervisor ·
Detail · Evaluation.

**What is wrong.** The default view is the company list, not the offers; the generic shell shows InSIS's tab row
as a second row of tabs.

**Rebuild.** Header **Internships & jobs** (*Praxe a pracovní nabídky*); view tabs (one tool, rule 1 allows):
**Offers** · **My internships** · **Companies** · **My profile** (InSIS's own `zalozka` links, reordered by
frequency; the default page stays InSIS's). Summary per view: offers "{n} offers"; my internships "{n}, {k}
waiting for evaluation". Content: offers as rows (position, company, branch, capacity, Details link); my
internships as rows with a status chip and InSIS's Detail / Evaluation links and *Sel.* checkboxes kept; companies
as rows (company, number of offers → its Offers link). Each view's InSIS filter form slotted above its list.

**Open questions.** *My profile* (not in the crawl: probably a form → F inside the tool); what the second form on
*My internships* does; an offer's Details page.

### 2.16 Study matters overview — `#ipx:dest.matters` (C)

**Purpose.** Landing page of the destination: "is anything wrong with my study, do I have paperwork or money to
handle", then the way into the sections.

**Now** (`composed.js`). *Your study* card (from `ipx.state.portal.study`) with a *Study status* link; *To handle*
(To do items without a course code); `groupColumns('matters')`: every section as a link row with its gloss;
*Something else?* card with the Requests and Next degree texts and a Who-to-ask button. The signpost pages for
`studies.requests` / `studies.nextdegree` are still registered.

**What is wrong.** The group columns are the sidebar submenu again (rule 2: "an overview with live data, not a
page of links"); the Next degree text tells the student to switch to Classic view, i.e. to leave InSIS+.

**Rebuild.** See §3.4 for the data. Header **Study matters**, no actions, no view tabs. Summary: *Your study*
status line (as on Study status) and *To handle*. Content: three group cards (Paperwork, Money, Thesis, exchange
& career), each row = section name + its **live fact** where InSIS+ has one, else the gloss. *Something else?*
card kept (Requests, Next degree), with the Classic-view sentence replaced by "InSIS+ does not open study
applications yet; ask the study department how to apply" and the Who to ask button.

## 3. Section-level remarks

### 3.1 Rule breaks and fixes

1. **The portal module repeats the navigation.** `student-portal.js` draws *Everything else* (all portal links,
   regrouped) and a Home-like rail. Fix: §2.1; delete `buildMore`, the link groups and the timetable/deadline
   rail; keep `parse()` / `remember()`.
2. **Tab rows the generic shell still shows.** `zp_temata.pl` (two extra rows), `uloziste/` (folders),
   `praxe/` (four views), `zavzpr.pl` (two views) keep InSIS's rows as underlined tab rows under the page. Fix:
   each page's own module draws at most one row of `ui.viewTabs` (praxe, zavzpr, Papers, Money, Status) and turns
   the rest into places (Course topics → rail link) or a segmented choice (uloziste folders).
3. **Dead ends.**
   - `composed.js` still registers `#ipx:studies.requests` and `#ipx:studies.nextdegree` signposts after rule 3
     removed the sections; search synonyms (žádost, přihláška) still point to them. Fix: delete both renderers;
     point the synonyms to `#ipx:dest.matters` scrolled to *Something else?*.
   - `karty/` is a two-link menu: never linked by InSIS+ (the ID card block links the leaves).
   - `dohody.pl?typ` → `stat,typ` and `zavzpr.pl` → `akce` links fail the URL rule; until verified, InSIS+ shows
     those rows without links rather than links that are dropped on click.
   - Study abroad has no way to apply (`podani_prihlasky.pl` is `verify`): the rail says where to ask, never an
     empty button.
4. **One place per job.**
   - Accommodation benefit is not a separate section or tab: an action of Money (page action on Fees and
     Scholarships).
   - Electronic document verification is not part of *my* papers: a rail link and All services, not a view.
   - *Registration at VS* (studies table icon) must live in Registration & enrolment; it is dropped from Study
     status only once it is there.
   - Study details (`studium.pl`) is not its own section: the *History* view of Study status.
5. **Gloss that over-promises.** *Excuse notes* "Excuse yourself from classes": the crawl shows no add form. Until a
   snapshot shows one, the gloss is "Your excuse notes" / "Vaše omluvenky".

### 3.2 Grouping decisions

- **Study status & ID card: one section.** The student has no ID card data page (only a photo upload, a list of
  card types and a validity checker), so a separate *ID card* section would open a menu page (rule 3). The card is
  a block on Study status; its four InSIS pages highlight this section in the sidebar. Label stays *Study status &
  ID card* / *Stav studia a průkaz*; the page title is *Study status*.
- **Delivered decisions and printed confirmations: one section, three views.** Both are "my official papers"
  (principle 2: papers live in one place); they differ by origin, which is a view, not a place. *Confirmations &
  decisions* = **Get a confirmation** (`tisk_dokumentu.pl`, entry: the most frequent job) · **Delivered to me**
  (`uloziste/`) · **Printed** (`evidence_tisku.pl`). Admission documents stay here (folder *Admission procedure*),
  not under Next degree.
- **Money: one section, three views.** **Fees** (`financovani.pl`, entry) · **Scholarships**
  (`vypl_stip_student.pl`) · **Bank accounts** (`bank_spojeni_clovek.pl`); accommodation benefit is an action.
- **Study status: two views.** **Status** (`moje_studium.pl`, new entry instead of `studium.pl`: it carries the
  status, the restriction, the studies and the photo link) · **History** (`studium.pl`).

`mapping.json` changes these imply (for the lead; not made here): new nodes with labels —
`studies.papers.delivered` *Delivered to me* / *Doručené dokumenty*, `studies.papers.printed` *Printed* /
*Vytištěné*, `studies.money.scholarships` *Scholarships* / *Stipendia*, `studies.money.accounts` *Bank accounts* /
*Bankovní účty*, `studies.status.history` *History* / *Historie studia*; `structure.views` entries for
`studies.papers`, `studies.money`, `studies.status`; `entry.studies.status` → `moje_studium.pl`;
`entry.studies.papers` → `tisk_dokumentu.pl` only; `epd/` → `all.*` with `also: studies.papers`; the studies.excuses
gloss as in 3.1.5.

### 3.3 Order in the sidebar

Paperwork: Confirmations & decisions · Excuse notes · Study status & ID card (unchanged: by frequency). Money:
Payments & scholarships. Thesis, exchange & career: Thesis & state exam · Study abroad · Internships & jobs
(unchanged).

### 3.4 What the overview shows (live data only from pages InSIS+ may read)

Background reads available: `moje_studium.pl`, `uloziste/`, `financovani.pl`. Everything else is `on-open`, so the
overview shows a fact from it only if the student opened that page in this session (session storage), else the
gloss.

| Block | Fact | Source | Tone / rule |
|---|---|---|---|
| Your study | programme · form · faculty · progress | portal | `ok` when enrolled |
| Your study | restriction or "No restriction" | portal | `bad` with the restriction; also a To handle item |
| Your study | other studies: "+1 other study" with the switch | portal | only with 2+ |
| To handle | To do items without a course (restriction, document waiting, payment, personal data check) | To do | unchanged |
| Paperwork › Confirmations & decisions | "{m} documents waiting for you to open" or "Last delivered {date}"; quiet link *Get a confirmation of study* (to `tisk_dokumentu.pl`, never a generation link) | `uloziste/` | `warn` when waiting |
| Paperwork › Excuse notes | "{n} this period" if read this session, else gloss | `moje_omluvenky.pl` (on-open) | neutral |
| Paperwork › Study status & ID card | the status chip again is a repeat: show the gloss | — | — |
| Money › Payments & scholarships | "Nothing to pay" / "{n} to pay by {date}" (after `verify_data`); otherwise "Funded by the state until {date}", `warn` when a fee-relevant row starts within 6 months | `financovani.pl` | `bad` past due |
| Thesis & state exam | "My topic: …" when known (final year, to be verified), else gloss | `zp_temata.pl` (on-open) | — |
| Study abroad, Internships & jobs | gloss; "{k} internships waiting for evaluation" if read this session | `praxe/` (on-open) | — |
| Something else? | Requests, Next degree: where to ask | static | — |

Not on the overview: the week, classes, deadlines (Home), any link list beyond one row per section, any amount of
money (only "to pay" and the due date; amounts stay on Fees).

## 4. Fresh snapshots needed

Collected read-only by the student's own navigation, never by following action links:

1. `karty/typy_karet.pl`, `karty/platnost.pl` (and its result), `personalizace/vkladani_fotky.pl` (both steps).
2. `epd/` (form or frame?).
3. `uloziste/` *Study* folder with a delivered, unconfirmed document.
4. `tisk/evidence_tisku.pl` with rows (second form, Details).
5. `student/moje_omluvenky.pl` with notes and, if it exists, the add form.
6. `student/financovani.pl` with a fee decision row; `student/financovani.pl?prehled`.
7. `student/vypl_stip_student.pl` with payments.
8. `student/bank_spojeni_clovek.pl` with an account and after *Modify*.
9. `student/zadost_ubyt_stip.pl` after an application and outside the window.
10. `student/studium.pl` with interruptions / trips / coupons.
11. `student/moje_studium.pl` with a restriction or a second study.
12. `student/zp_temata.pl?…zalozeni`, `?…vybrano`, and a final-year account (my topic, submission, state exam).
13. `int/podani_prihlasky.pl`, `int/zavzpr.pl` (results, `akce` tab), `katalog/dohody.pl?stat,typ`.
14. `praxe/` *My profile* tab and an offer's Details.
15. `prihlaska/auth/evidence_eprihlasek.pl` stays unread (`read: never`); only a decision to change that would need it.
