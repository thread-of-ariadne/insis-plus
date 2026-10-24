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
   | Sidebar | Přehled · Předměty · Rozvrh · Zkoušky · Známky a kredity · Studijní záležitosti · Kampus a lidé, and at the bottom All services and Classic view |
   | K vyřízení | Things to do with deadlines (open submission boxes closing within 7 days, a study restriction, InSIS's personal data check), or "Nothing to do", and a line saying when each source was last checked |
   | Moje předměty | This semester's courses; each card opens the course page |
   | Right column | The week, Rozvrh with "Full timetable →" (opens your personal timetable), new materials by course (a row opens that course's folder), teaching hours |
   | Top bar | Search, Messages (envelope), Notifications (bell), ?, CS/EN, avatar menu (Account, Change password, InSIS+ settings, Log out) |

4. Go through the sections:

   | Open | What you should see |
   |---|---|
   | Předměty | Tabs Moje předměty · Materiály · Všechny odevzdávárny · Registrace a zápis · Katalog · Anketa |
   | A course card | The course page with Souhrn · Materiály · Odevzdávárny · Body · Lidé · Sylabus; Lidé lists classmates |
   | Předměty › Materiály | Your course folders with new counts, then InSIS's document server views |
   | Rozvrh | Your personal timetable (week view) with tabs Můj týden · Harmonogram · Hledání rozvrhů · Export |
   | Zkoušky | InSIS's exam list with the tabs Moje termíny · Volné termíny · Proběhlé · Zatím bez termínu · Testy |
   | Známky a kredity | The e-index (Výsledky) and Co mi chybí |
   | Studijní záležitosti, Kampus a lidé, All services | Grouped lists; each row opens the InSIS page |
   | Envelope (Messages) | InSIS's mail box with "Where do messages arrive?" and a button to Outlook |
   | Bell (Notifications) | New documents and newly entered results; opening it clears the dot |
   | Any other InSIS page | The shell around the original page, with the right section highlighted |

5. Log out with the avatar menu, log in again: Přehled loads the data again (nothing was kept from before).
6. Switch InSIS to Czech or English (CS/EN): everything follows.
7. On any page, **Classic view** brings the original InSIS page back; the **InSIS+ view** button switches back.
8. Phone: narrow the window below 900px: a bottom bar with Přehled · Předměty · Zkoušky · Známky · Menu.

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
  InSIS+ pages are at the same address with `#ipx:<node>`, e.g. `home-cs.built.html#ipx:course.overview/4XY101`.

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
