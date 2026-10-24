# How to check InSIS+

## In your browser, on real InSIS (the real test)

1. `chrome://extensions` → Developer mode on → **Load unpacked** → this folder (first time), or press ⟳ on the
   InSIS+ card (after an update). Firefox: `about:debugging#/runtime/this-firefox` → Load Temporary Add-on →
   `manifest.json`.
2. **Start clean**, so you see what a new user sees: **Remove** InSIS+ on `chrome://extensions` and **Load
   unpacked** again (that deletes its stored data), or use **Clear stored data** in InSIS+ settings (avatar menu).
3. Open https://insis.vse.cz, log in, and stay on the main page (Přehled) for ~10 seconds:

   | Check | Expected |
   |---|---|
   | First visit | A question "Is this a shared computer?" (answer once; it can be changed in InSIS+ settings) |
   | Sidebar | Přehled · Předměty · Rozvrh · Zkoušky · Známky a kredity · Studijní záležitosti · Kampus a lidé, and at the bottom All services and Classic view. The current destination opens its sections under it (a submenu); there is no row of tabs above the page |
   | K vyřízení | Things to do with deadlines (submission boxes closing within 7 days, a study restriction, InSIS's personal data check), or "Nic nečeká", and one line saying what is watched and when it was updated |
   | Moje předměty | This semester's courses; finished ones under "Dokončené" (grey cover, ✓ with the result); each card opens the course page |
   | Right column | The week, Rozvrh with "Full timetable →", new materials by course (a row opens that course's Materials tab), teaching hours |
   | Top bar | Search, Messages (envelope), Notifications (bell), ?, the light/dark button, the language button (globe + CS/EN: a menu with Čeština · Slovenčina · English, the current one ticked), avatar menu (Account, Change password, InSIS+ settings, Log out). Below 900 px the theme and language are in the avatar menu |

4. Go through the sections (each opens from the sidebar submenu; the page title is the section, the line above it
   the destination; a page has at most one row of tabs, only for views of one thing):

   | Open | What you should see |
   |---|---|
   | Předměty › Moje předměty | Course cards; finished courses in their own group |
   | A course card | Tabs Souhrn · Materiály · Odevzdávárny · Body · Lidé, a status line (next class, deadline, new files, result). Souhrn: the syllabus with next classes and what is coming; Body: InSIS's result, the attempt, links to Results and Exam dates; Lidé: teachers and classmates |
   | Předměty › Materiály | Tabs Podle předmětů · Strom dokumentů · Nové dokumenty · Hledat; one card per course with its folders; an e-Library card |
   | Nové dokumenty | A summary, then InSIS's own list (its checkboxes and Mark as read stay InSIS's) |
   | Předměty › Všechny odevzdávárny / Anketa | Deadlines ordered by date; course evaluation with how many questionnaires are open (Fill in is InSIS's own link) |
   | Rozvrh › Můj týden | The week view; Export opens "Export and print" (Outlook transfer and InSIS's own print/PDF form) |
   | Rozvrh › Harmonogram | Academic calendar (an explanation when InSIS lists no teaching weeks) |
   | Zkoušky | Exam dates and Online tests (empty states explain what happens next) |
   | Známky a kredity | Výsledky with tabs Toto období · Celé studium · Statistiky · Srovnání; Co mi chybí (credits, compulsory courses left, groups; electives open 50 at a time); Studijní plány |
   | Studijní záležitosti | Your study and K vyřízení, Next degree in "Něco jiného?"; Stav studia a průkaz (study card, student card block); Platby a stipendia (tabs Poplatky · Stipendia · Bankovní účty); Žádosti (the contact centre's forms grouped, with a filter) |
   | Kampus a lidé | Your teachers this semester and rooms this week; Lidé (InSIS's search form in a card); Knihovna (loans or "no loans") |
   | Envelope (Messages) | InSIS mail: New message and University e-mail in the header, where mail is forwarded, folders as tabs; the sidebar shows InSIS mail · Noticeboard |
   | Bell (Notifications) | New documents and newly entered results; opening it clears the dot |
   | Zkoušky › Termíny zkoušek | One header with four views; dates as rows (date block, course, room, deadlines, InSIS's own sign-up controls); How it works folded; Filter opens InSIS's own form |
   | A submission box (from All submissions) | Box name as title, status with a countdown, InSIS's upload form as a card, handed-in files as rows |
   | Registrace a zápis | Next round with a countdown, enrolled courses and credits, rows to extra-semestral courses, minor tracks, favourites, statistics |
   | Studijní záležitosti › Potvrzení a rozhodnutí | Tabs Get a confirmation · Delivered · Printed; delivered documents with InSIS's Open button (opening records receipt) |
   | Kampus a lidé › a teacher's name | The person's page: contacts, consulting hours, Write in InSIS, "You have this teacher in" |
   | Any other InSIS page | The InSIS+ header, InSIS's content without its portal bar, breadcrumbs or page heading, the right section highlighted; nothing that looks like the old InSIS except the exceptions in `docs/ia/03-pages.md` §6 |

5. Log out with the avatar menu, log in again: Přehled loads the data again (nothing was kept from before).
6. Switch the language from the globe menu (Čeština / English): everything follows; the menu ticks the current one.
7. On any page, **Classic view** brings the original InSIS page back; the **InSIS+ view** button switches back.
8. The moon/sun button in the top bar switches light and dark at once; Avatar → InSIS+ settings → Appearance also offers System.
9. Phone: narrow the window below 900px: a bottom bar with Přehled · Předměty · Zkoušky · Známky · Menu.

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
  InSIS+ pages are at the same address with `#ipx:<node>`, e.g. `home-cs.built.html#ipx:course.overview/4IT431`.

- All snapshot pages at once (maintainer only): build the test pages with `python test/sync_fixtures.py`, then
  `python -P test/sweep.py [--shots]`, a headless sweep that opens each `snap-*.open.built.html` at 1300 and 375 px with only localhost and InSIS's
  public scripts and styles reachable, and reports the header, tab rows, raw InSIS tables or tab rows, old icons,
  sideways overflow and script errors per page (errors that also occur without InSIS+ are InSIS's own).

## Navigation model

```
python scripts/ia_check.py     # the mapping (docs/ia/mapping.json) against itself and the crawl
python scripts/build_nav.py    # regenerate nav-data.js after editing the mapping
```

## Repository checks

```
python scripts/check.py
python scripts/package.py
npx --yes web-ext@10.7.0 lint --source-dir . --ignore-files "test/**" "docs/**" "scripts/**" ".github/**" "dist/**" --self-hosted
```

The same checks run in CI on every push and pull request.
