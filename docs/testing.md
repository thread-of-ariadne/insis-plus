# How to check InSIS+

## In your browser, on real InSIS (the real test)

1. `chrome://extensions` → Developer mode on → **Load unpacked** → this folder (first time), or press ⟳ on the
   InSIS+ card (after an update). Firefox: `about:debugging#/runtime/this-firefox` → Load Temporary Add-on →
   `manifest.json`.
2. **Start clean**, so you see what a new user sees: **Remove** InSIS+ on `chrome://extensions` and **Load
   unpacked** again (that deletes its stored data). Or, on an InSIS tab: F12 → Console → in the context menu at
   the top left pick **InSIS+** → run `chrome.storage.local.clear()` → reload.
3. Open https://insis.vse.cz, log in, and stay on the main page for ~10 seconds. Without opening anything else:

   | Check | Expected |
   |---|---|
   | "Student's portal" row | First "Loading your data from InSIS…", then six cards: Exams, Course registration, My timetable (with the next class), Study record (credits), Submissions (nearest deadline or "Nothing due"), Plan check |
   | My courses → Enrolled | The courses of this semester from your study record |
   | Right column | The week with class days, next classes, deadlines, new documents, teaching hours |
   | "Full timetable →" and the "My timetable" card | Your **personal** timetable (your classes), not the timetable search |
   | Sidebar → Main → "My timetable" | The same personal timetable; the public "Timetables" search is under More services → Study |
   | Sidebar → Main → "Student's portal", or "Whole portal →" on the dashboard | The Student's portal |

4. Then go through the redesigned pages; each should look redesigned, with the sidebar on the left:

   | Open | What you should see |
   |---|---|
   | Student's portal | Your study on top, the six main actions with live lines, "Everything else" as columns of links with a search field, next classes, deadlines and contacts on the right |
   | Personal timetable | KPIs, week view with ◀ ▶, courses, next classes and hours on the right |
   | E-study record | Credits and average, courses by semester with a status |
   | Document server and New documents | Course cards with folders, "N new" badges; the mark-as-read form on demand |
   | Coursework submissions | Boxes by deadline with countdowns; "Insert files" opens InSIS's own upload page |
   | A course syllabus (from the catalogue) | Credits, completion, language, lecturers, grade breakdown |
   | Course catalogue search | One card per course with semesters side by side |
   | Any other page (e.g. User settings) | The sidebar and top bar around the original page |

   The background data is read again after 3 hours (the portal after 12); open a page yourself to refresh it now.
5. Switch InSIS to Czech (ČESKY at the top): everything should switch to Czech, the sidebar groups included.
6. On any page, **Classic view** (bottom of the sidebar) brings the original InSIS page back exactly;
   the **InSIS+ view** button in the corner switches back.
7. Try the sidebar: the filter field, ☆ to pin a page, a group to open, **Original grouping**. Try **Ctrl+K**.
8. Dark mode: switch your system to dark; the extension follows. Phone: narrow the window below 900px, the
   sidebar becomes a menu behind ☰.

If a page looks wrong: open Classic view (everything still works there), and report the page in an issue
(blur personal data).

## Without logging in (development)

```
python test/serve.py
```

- `http://localhost:8765/test/mock-home.html`: a mock main page.
- `http://localhost:8765/test/fixtures/syllabus-en.html`, `syllabus-cs.html`, `catalog-en.html`, `catalog-cs.html`:
  real public pages.
- Logged-in pages (only on the maintainer's machine, git-ignored): `test/fixtures/private/<page>.built.html`,
  built with `python test/make_fixture.py test/fixtures/private/<page>.html <page>`. On these, the background
  sync loads the other local snapshots instead of InSIS (`home-cs.built.html` uses the `-cs` ones), so the fresh
  install flow can be tested: run `localStorage.clear()` in the console, open `home-cs.built.html`, wait ~10 s.

## Repository checks

```
python scripts/check.py
python scripts/package.py
npx --yes web-ext@10.7.0 lint --source-dir . --ignore-files "test/**" "docs/**" "scripts/**" ".github/**" --self-hosted
```

The same checks run in CI on every push and pull request.
