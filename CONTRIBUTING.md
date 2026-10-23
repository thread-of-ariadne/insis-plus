# Contributing to InSIS+

Thanks for helping make InSIS easier to use. This guide covers how to set up, what a good change looks like,
and how releases are made. By taking part you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to help

- **Report a bug** or a page that looks broken: open an issue with the bug template. Screenshots help, but please
  blur personal data (names, grades, study numbers).
- **Suggest an improvement**: open an issue with the feature template, describe the problem first, then the idea.
- **Redesign a page**: pick one from [docs/pages.md](docs/pages.md), comment on its issue (or open one) so two people
  don't work on the same page, and follow [docs/agents.md](docs/agents.md).
- **Translations**: the UI is Czech and English; Slovak is welcome.

## Development setup

No build step and no dependencies: the extension is plain JavaScript and CSS.

1. Fork and clone the repository.
2. Load it in the browser:
   - Chrome / Edge / Brave: `chrome://extensions` → Developer mode → **Load unpacked** → the repository folder.
   - Firefox: `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on** → `manifest.json`.
3. After a change, press ⟳ on the extension card and reload the InSIS tab.

You can work without logging in to InSIS:

```
python test/serve.py
```

Then open `http://localhost:8765/test/mock-home.html` or any page in `test/fixtures/`. To test a page module on a
saved page: `python test/make_fixture.py <saved.html> <name> --with pages/<page>.js`.

## Project layout

| Path | What it is |
|---|---|
| `content.js` | Core: state, Ctrl+K search palette, language detection |
| `ui.js`, `shared.css` | App shell (sidebar, top bar, panel) and shared components |
| `home.js`, `syllabus.js`, `catalog.js` | Page modules for the main page, course syllabus, course catalogue |
| `generic.js`, `generic.css` | Shell and look for every other InSIS page |
| `pages/` | New page modules |
| `docs/` | Page plan and the brief for page modules |
| `test/` | Mock page, public fixtures, fixture and snapshot tools |

## Rules that matter

- **Privacy first.** Nothing leaves the browser: no servers, no analytics, no requests outside `insis.vse.cz`
  (Google Fonts is the one exception, see [PRIVACY.md](PRIVACY.md)). Data goes to `chrome.storage.local` only.
- **Never act for the user.** No auto-submitted forms, no POST requests, no clicks on their behalf. Pages with
  actions (exam registration, course registration, tests, settings) keep InSIS's original form, restyled.
- **Never commit personal data.** Snapshots of logged-in pages live in `test/fixtures/private/`, which is
  git-ignored. Do not paste them into issues or pull requests.
- **Safe DOM.** Build UI with `h()` and `textContent`; never insert InSIS content as HTML strings.
- **Match the design.** Tokens and components from `shared.css` / `ipx.ui`, rules in [docs/agents.md](docs/agents.md).
- **Match the code around you.** Vanilla JS, small functions, comments only where the "why" isn't obvious.
- **Fail safe.** If a module isn't sure it recognised its page, it does nothing and the generic shell takes over.

## Commits and pull requests

- Branch from `main`: `feat/timetable-week-view`, `fix/catalog-semesters`, `docs/contributing`.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/):
  `feat(timetable): week view with next classes`, `fix(home): counters on the real main page`,
  `docs: release process`. Use `feat!:` or a `BREAKING CHANGE:` footer for breaking changes.
- One topic per pull request. Fill in the template, attach before/after screenshots (light and dark, desktop and
  phone) with personal data blurred.
- Add a line under **[Unreleased]** in [CHANGELOG.md](CHANGELOG.md) (Added / Changed / Fixed / Removed / Security).
- CI must pass: it checks JavaScript syntax, the manifest and that no private snapshots are committed.

## How updates are released

InSIS+ uses [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`.

- **PATCH** (0.4.1): fixes that don't change behaviour users rely on.
- **MINOR** (0.5.0): new pages, features or visible design changes.
- **MAJOR** (1.0.0): breaking changes, for example removing a feature or a new permission.

Release steps (maintainers):

1. Make sure `main` is green and **[Unreleased]** in `CHANGELOG.md` describes the release in user-facing words.
2. Bump `version` in `manifest.json`.
3. In `CHANGELOG.md`, rename **[Unreleased]** to `[x.y.z] - YYYY-MM-DD`, add a fresh empty **[Unreleased]**, and
   update the comparison links at the bottom.
4. Commit `chore(release): vx.y.z`, tag `vx.y.z`, push the tag.
5. The release workflow builds `insis-plus-x.y.z.zip` and attaches it to a GitHub release with the changelog notes.
6. Upload the zip to the Chrome Web Store and Firefox Add-ons (manual for now).

Any change that adds a browser permission or a new host must be called out in the changelog and the release notes.
