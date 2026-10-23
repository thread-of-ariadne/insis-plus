# How to check InSIS+

## In your browser, on real InSIS (the real test)

1. `chrome://extensions` → Developer mode on → **Load unpacked** → this folder (first time), or press ⟳ on the
   InSIS+ card (after an update). Firefox: `about:debugging#/runtime/this-firefox` → Load Temporary Add-on →
   `manifest.json`.
2. Open https://insis.vse.cz and log in. Then go through these pages; each should look redesigned, with the
   sidebar on the left:

   | Open | What you should see |
   |---|---|
   | InSIS main page | Greeting, KPIs (documents, tasks, pinned), My courses, the week, timetable, deadlines, new documents |
   | Student's portal | Your study on top, six action cards (Exams, Course registration, Timetable, Study record, Submissions, Plan check) |
   | Personal timetable (from the portal) | KPIs, week view with ◀ ▶, courses, next classes and hours on the right |
   | E-study record | Credits and average, courses by semester with a status |
   | Document server and New documents | Course cards with folders, "N new" badges; the mark-as-read form on demand |
   | Coursework submissions | Boxes by deadline with countdowns; "Insert files" opens InSIS's own upload page |
   | A course syllabus (from the catalogue) | Credits, completion, language, lecturers, grade breakdown |
   | Course catalogue search | One card per course with semesters side by side |
   | Any other page (e.g. User settings) | The sidebar and top bar around the original page |

3. After the timetable, document server and submissions pages were opened once, go back to the main page: the
   right column now shows next classes, deadlines and courses with new documents.
4. Switch InSIS to Czech (ČESKY at the top): everything should switch to Czech, the sidebar groups included.
5. On any page, **Classic view** (bottom of the sidebar) brings the original InSIS page back exactly;
   the **InSIS+ view** button in the corner switches back.
6. Try the sidebar: the filter field, ☆ to pin a page, a group to open, **Original grouping**. Try **Ctrl+K**.
7. Dark mode: switch your system to dark; the extension follows. Phone: narrow the window below 900px, the
   sidebar becomes a menu behind ☰.

If a page looks wrong: open Classic view (everything still works there), and report the page in an issue
(blur personal data).

## Without logging in (development)

```
python -m http.server 8765
```

- `http://localhost:8765/test/mock-home.html`: a mock main page.
- `http://localhost:8765/test/fixtures/syllabus-en.html`, `syllabus-cs.html`, `catalog-en.html`, `catalog-cs.html`:
  real public pages.
- Logged-in pages (only on the maintainer's machine, git-ignored): `test/fixtures/private/<page>.built.html`,
  built with `python test/make_fixture.py test/fixtures/private/<page>.html <page>`.

## Repository checks

```
python scripts/check.py
python scripts/package.py
npx --yes web-ext@10.7.0 lint --source-dir . --ignore-files "test/**" "docs/**" "scripts/**" ".github/**" --self-hosted
```

The same checks run in CI on every push and pull request.
