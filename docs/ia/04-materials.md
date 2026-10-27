# InSIS+: Materials (draft 2)

The document server is the most used part of InSIS after the timetable, and the part students find hardest. This
document redesigns everything around it: what students come for, the places, how they lead into each other, the
folder view and what a student can manage. It follows `03-pages.md` (rules, anatomy, safety) and replaces the
Materials parts of `teardowns/courses.md`. Draft 1 was reviewed by two independent reviewers (UX/IA and
safety/feasibility, §7); their decisions are folded in.

## 1. What students come for (by frequency)

1. **"Is there anything new from my courses?"** — several times a week, from Home, the bell, a course card.
2. **"Get this week's slides / the assignment for course X"** — weekly, from the course.
3. **"Find that file I saw"** — occasionally: by name, teacher or date.
4. **Faculty and university documents** (study rules, board minutes, selection procedures) — rarely.
5. **Settings**: stop news from folders they do not care about, e-mail about new documents, the files they put in
   themselves — rarely, today hidden behind "All my folders" and "DS settings".
6. **e-Library** (published study materials) — rarely; a different tool.

## 2. What InSIS has

| InSIS page | What it is | Actions (InSIS's own, never InSIS+'s) |
|---|---|---|
| `dok_server/` tree | every folder the student can see. A course is `CODE Name` › *On-site classes* › one folder per class ("Lecture - since 25.09.2026 14:00-16:15, RB 212 (4x)") and › *Teachers* › one folder per teacher; most of these are empty containers. Faculty and university branches go 5–6 levels deep, folders of up to ~110 items. Counts "(new / all)" per folder. | none |
| `slozka.pl?id` folder | one folder: subfolders and documents (name, comment, who, when, file). **Never opened by the crawl**: markup, paging and whether opening it marks documents as read are unknown. | opening a file (a download), maybe inserting documents in folders the student administers, maybe InSIS's ignore control |
| `nove_dok.pl` New documents | every unread document, newest first, with folder, author, date, type; links to the folder with the document, to its details (`dokumenty_cteni.pl`, probably marks it read) and the download. InSIS+ lays its rows out like the course page's document rows, in place; the tab's count is InSIS's own "New documents (N)" | **Mark the selected / all as read** (one form with a checkbox per row) |
| `vyhledavani.pl` Search | text, author, date range, with/without attachment, folder | the search (a form) |
| `moje_dok.pl` All my folders | four sub-views (`zobraz_dok`): My documents · My folders (default) · Copy folders · Ignored folders | managing own folders, un-ignoring (unseen) |
| `nastaveni_stromu.pl` DS settings | **one form**: items per page (`po_dok`, folder and list pages are paged), e-mail information (`info`, `notif`: which one concerns *reading* students is to be confirmed), the folder the tree starts from (`id_slozky_od`, changes what InSIS+ can read) | **Save changes** |
| `eknihovna/…` e-Library | published study materials in folders, with their own search | opening an item |

## 3. What is wrong today

- The structure is InSIS's: "Document tree" is a technical view, folders are nested expand/collapse lists, the folder
  page (where the files are) is InSIS's page in a frame.
- **A course's folders throw the student out of the course**: from the course page a folder opens a Materials page;
  the sidebar, header and tabs change — the "navigation keeps changing" complaint.
- Course folders shown as they are: empty containers and machine labels.
- **Four news numbers** from three sources with different freshness (main-page counter, New tab, tree), and the
  headline count mixes course files with faculty minutes (~40 % in the snapshot) — a badge students learn to ignore.
- Settings buried under "All my folders" and "DS settings".

## 4. The design

### 4.1 A course's files live in the course

The course page's **Materials** tab is the only home of a course's files. Every entry point that concerns one course
(Home, the course card badge, a course folder anywhere, InSIS's own folder page of a course folder) shows the course
page: course header and view tabs with *Materials* active, the sidebar on *My courses*.

- **InSIS's folder page of a course folder** (`slozka.pl?id` whose id is in the stored course-folder map) is drawn
  as that course page, one level down. Folders outside courses belong to Courses › Materials.
- The tab shows, top to bottom:
  1. **New in this course** — the course's unread documents (from the New list the student last opened, with its
     time; see 4.4), each linking to the folder page with the document highlighted.
  2. **Folders** — *flattened*: containers without files of their own are skipped; the folders that hold files are
     one list with readable names: *Course files* (the course folder itself), *Lecture · Fri 14:00 · RB 212*,
     *Seminar · Thu 9:15 · SB 321*, then each teacher folder under the teacher's name. Each row: name, n files,
     k new. Empty folders fold into one muted line ("3 empty folders"). A course with no files: "No files on the
     document server for this course yet."
  3. A note when files are elsewhere: "Some teachers use Moodle" (link once Moodle is verified).
- Files inside folders appear **only after** the folder-page check (§5): until then a folder row opens InSIS's
  folder page, which InSIS+ draws as the course page one level down (4.1).

### 4.2 Courses › Materials: across and outside courses

One row of view tabs, the same on its four views:

| View | Content |
|---|---|
| **By course** (default) | *New in your courses*: the newest 10 course documents as file rows with a course chip (from the last New list; stale label with its time); then one compact row per course of this period (code, name, n files, n new) opening the course's Materials tab; earlier periods in a collapsed group |
| **New** (count of course documents; "+ n other") | InSIS's own list, in place and in InSIS's order (its rows belong to the mark-as-read form): a course chip on each row (CSS, from a data attribute), a summary above ("6 in your courses · 4 other", per course with links to the course tab). Never filtered or regrouped (hidden rows next to *Mark all as read* would be marked unseen) |
| **All folders** | a drill-down browser of the whole tree (from the background-read tree, subfolders only): canonical breadcrumbs from the folder's place (*FIS › Dean's office › …*), one row per folder (name, n files, k new), one interaction per row, empty folders folded, a *Jump to folder* filter over all folder names (results with their path); course folders open the course page (4.1) |
| **Search** | InSIS's search form in a form card (InSIS's own results below, styled) |

Page action: **Settings** (4.5). "Document tree", "All my folders", "DS settings" and "My courses" (which collides
with the sidebar section) disappear as labels.

### 4.3 The folder view (one component)

Wherever a folder is drawn (course tab, All folders, InSIS's folder page):

- **Path**: canonical, derived from the folder's place, never from where the student came from (stable on reload,
  in a new tab, on shared links). Course folders start at the course (`Materials › Lecture · Fri 14:00`), others
  at their root. On phones: "… › Parent › Current".
- **Subfolders** as rows (folder icon, readable name, n files · k new); the whole row is a link; no expand/collapse
  triangles anywhere.
- **Files** (only where InSIS+ may show them, §5): type badge (PDF, DOCX, PPTX, ZIP…), name, one line of comment, who
  and when, *new* badge. Rows are real links (Ctrl-click opens a new tab). Sort/filter only when the page holds the
  whole folder; otherwise InSIS's paging stays with "Showing 1–20 of 109" and a pointer to the items-per-page
  setting.
- On **InSIS's folder page itself**: treatment decided from the snapshot — L (InSIS's rows in place, styled, path and
  summary above) if the rows sit inside a form, R otherwise. A highlighted document (`#ipx-file=<id>`, digits only)
  gets `data-ipx-hl` on its row and is scrolled into view; "not on this page" when paged.

### 4.4 News: one list, course documents only in red

- The **New list** (`nove_dok.pl`) is the source of every per-document view (New in this course, New in your
  courses). It is stored when the student opens New (session, slim rows, no download links). Reading it in the
  background is a later step, after a check that listing it marks nothing as read.
- The **tree** (background read) gives per-course and per-folder counts between visits to New.
- **Red badges count course documents only**: the bell, course cards, the course tab, the sidebar. Faculty and
  university documents show in neutral style ("+ 4 other" on New) and link to *Muted folders* in Settings.
- InSIS's main-page counter is used only before the first read.
- After the student marks documents as read (InSIS's form), the counts follow on the next read; every place that
  shows per-document data says when it was last updated.

### 4.5 Settings (page action)

A page below the section (eyebrow *Materials*, title *Settings*), with its own view tabs, without the Materials row:

| Tab | InSIS page | Content |
|---|---|---|
| **E-mail and display** | `nastaveni_stromu.pl` | InSIS's one form, one form card (never split or collapsed); one line above it per control once identified on a snapshot; and: "InSIS+ reads the document tree: starting it lower can hide your courses here." |
| **Muted folders** (InSIS: Ignored folders) | `moje_dok.pl?zobraz_dok=4` | what muting does (documents in these folders no longer appear in New) and InSIS's list; linked once the sub-view is verified |
| **Your uploads** | `moje_dok.pl?zobraz_dok=1` | what the student put in themselves; usually empty ("You have not put any files on the document server") |

Until the `zobraz_dok` views are verified (snapshot), Settings has *E-mail and display* and *Your folders* (InSIS's
default view, with InSIS's own sub-tabs styled as the B-page sub-row).

### 4.6 Home and the bell

- **Home › New materials**: the newest 3–5 course documents by name with a course chip (from the last New list),
  else courses with new files; "All" opens By course.
- **The bell**: "n new course documents" (tree count), opening New.

### 4.7 e-Library

A separate tool (Folders · Search), reached from a link card on By course and from Campus › Library; its folders use
the folder view component.

## 5. Safety (binding)

- Opening a file, marking as read, saving settings, ignoring a folder, inserting a document: InSIS's own controls, in
  place, by the student's click. **No download link is ever shown outside InSIS's own page** (`download` stays on the
  deny list); a document row drawn from stored data links to its folder page (`slozka.pl?id`) with the document
  highlighted.
- `slozka.pl` carries `verify_effect` (nav.js never fetches it). The check, done once by the student by hand:
  pick a low-value folder with new documents; note the New count, the main-page counter, the tree's "(new/all)" for
  that folder and whether a document of it is on New; open the folder by a normal click and save the page (this is
  the snapshot); reload New and the tree and compare. A negative result allows on-open reading of folder pages
  (files inline in the course tab); a positive one keeps folders as InSIS's pages. The same once for
  `dokumenty_cteni.pl`.
- `dokumenty_cteni.pl` (a document's details) is drawn below its folder: inside the course (course tabs, path
  Materials › folder › document) when opened from the course's folder, else in Materials (All folders, or New
  documents when opened from New) with the tree path. InSIS's form stays in place as one card; its download button
  is InSIS's own.
- The folder map, the tree and the New list are session data; folder file lists (after the check) go to a session
  cache of their own (LRU ~30 folders, slim rows, never download links).

## 6. Build order

1. **Now**: course-folder pages drawn as the course page (4.1, with what InSIS's folder page shows in place);
   flattened course folders with readable names; By course (compact rows + New in your courses from the stored list);
   New with course chips and the summary; All folders drill-down with breadcrumbs and Jump to folder; Settings header
   with its tabs; course-only red counts; Home rail and bell.
2. **After the folder snapshot and check**: InSIS's folder page as L/R with highlighting; files inline in the course
  tab; sort/filter where complete; identified e-mail control; Muted folders and Your uploads tabs.
3. **Later**: background read of New (after its check); pinned folders.

## 7. Review history

**Round 1 (2026-10-24)**, draft 1 → draft 2. UX/IA: course folders must stay in the course (blocker); canonical
paths; flatten course folders; one list drives counts, red for course documents only; New stays InSIS's order;
default view By course instead of a second "My courses"; paging limits sort/filter; settings that change what InSIS+
reads; Settings instead of Manage; labels. Safety: draft 1's evidence about folders was wrong (the crawl never opened
a folder page); `verify_data` did not block reads (new key `verify_effect`, enforced); `#ipx:` bypass in nav.js
(fixed); no download links outside InSIS's pages; New view must not be regrouped; one settings form, never split;
stale counts after mark-as-read (separate times, done); redirect check in sync.js and cache wipes (done).
