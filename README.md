# InSIS+

**A friendlier InSIS for students of VŠE.** InSIS+ is a browser extension that redesigns
[insis.vse.cz](https://insis.vse.cz), the information system of the Prague University of Economics and Business:
a clear sidebar instead of 13 boxes of links, a dashboard with what matters today, search across every page,
and readable course pages. Everything runs in your browser; nothing is sent anywhere.

[![CI](https://github.com/thread-of-ariadne/insis-plus/actions/workflows/ci.yml/badge.svg)](https://github.com/thread-of-ariadne/insis-plus/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> InSIS+ is an independent student project. It is not affiliated with, endorsed by or supported by VŠE.
> If something looks wrong, switch any page back with **Classic view**.

*Česky:* InSIS+ je rozšíření prohlížeče, které dělá InSIS přehlednějším: postranní menu podle úkolů, přehled dne,
vyhledávání Ctrl+K a čitelné sylaby. Vše běží jen ve vašem prohlížeči.

## Features

- **A new structure instead of InSIS's 12 boxes of links**: Home, Courses, Schedule, Exams, Grades & credits, Study
  matters, Campus & people, and All services for the rare things. Every InSIS page has one place in it
  ([docs/ia](docs/ia)); every other page still opens, inside the same shell.
- **Home**: what you have to do (deadlines, restrictions, InSIS's requests), your courses, InSIS notices; the week,
  next classes, new materials by course and teaching hours on the side. Filled right after you log in.
- **A page for every course**: next classes, what is coming, materials folder, submission boxes, result, teachers
  and classmates, syllabus, gathered from the pages InSIS spreads them over.
- **Messages** (InSIS mail, and where it is forwarded), **Notifications** (new documents, results entered),
  **Help** with "who to ask", an **account menu**, Czech/English switch.
- **Personal timetable** as a week view; **e-index** with credits, average and status per course; **document
  server** by course with new-document badges; **coursework submissions** ordered by deadline; readable
  **syllabi** and **catalogue**.
- **Ctrl+K search** over InSIS pages, diacritics-insensitive and typo-tolerant. `Ctrl+D` pins a page.
- **Never acts for you**: every action happens on InSIS's own page, by your click. Data read from InSIS lives only
  for the session (see [PRIVACY.md](PRIVACY.md)); a shared-computer mode keeps nothing.
- Czech and English, light and dark theme, phone layout with a bottom bar.

## Install

Store releases are coming. Until then, install from source:

1. Download the latest release from [Releases](https://github.com/thread-of-ariadne/insis-plus/releases)
   (`insis-plus-x.y.z-chrome.zip` for Chrome, Edge and Brave, `insis-plus-x.y.z.zip` for Firefox) and unzip it,
   or clone this repository.
2. **Chrome / Edge / Brave**: open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked** and
   choose the folder.
   **Firefox**: open `about:debugging#/runtime/this-firefox`, click **Load Temporary Add-on** and choose
   `manifest.json`.
3. Open [insis.vse.cz](https://insis.vse.cz) and log in as usual.

## Privacy

Your data stays in your browser: no server, no analytics, no tracking. The extension only runs on `insis.vse.cz`
and never submits a form or takes an action for you. Details, including the one external request (Google Fonts),
are in [PRIVACY.md](PRIVACY.md).

## Development

No build step and no dependencies. Load the folder as an unpacked extension, edit, press ⟳ on the extension card,
reload the InSIS tab. To work without logging in:

```
python test/serve.py
```

and open `http://localhost:8765/test/mock-home.html` or a page in `test/fixtures/`.

- [docs/testing.md](docs/testing.md): how to check every page, on real InSIS and without logging in.
- [CONTRIBUTING.md](CONTRIBUTING.md): setup, project layout, rules, commit style, release process.
- [docs/pages.md](docs/pages.md): which InSIS pages get redesigned and in which order.
- [docs/agents.md](docs/agents.md): how to build a page module, the design rules and the shared components.

### How it works

`content.js` keeps state (personal data per session, settings per user) and the search palette. `nav.js` holds the
navigation model generated from `docs/ia/mapping.json` (where each InSIS page belongs, which addresses InSIS+ may
read or link to). `ui.js` builds the app shell in a closed shadow root and provides shared components (`ipx.ui`);
`composed.js` and `course.js` draw the pages that exist only in InSIS+; `todo.js` gathers what you have to do;
`bg.js` wipes session data after inactivity. Page modules (`home.js`, `syllabus.js`, `catalog.js`, `pages/*.js`) recognise
their page by its content and either rebuild it from parsed data or move InSIS's original content into the shell.
`generic.js` handles every page without a module. Pages are detected by content, not URL, and a module that isn't
sure does nothing. `sync.js` fetches the pages the dashboard needs as text and hands the parsed document to
the module that owns each page (`ipx.readers`): no InSIS script runs. `boot.js` shows a skeleton of the shell while
InSIS's server is still sending a page; `kit.js` holds the page kit and the section registry (one header per
section).

## Roadmap

- Exam and course registration (when their periods open), keeping InSIS's own forms.
- Academic calendar, mail box, noticeboard, tests and the other tier 1–2 pages in docs/pages.md.
- Bundled fonts (no Google Fonts request), store releases for Chrome and Firefox.

## Contributing

Bug reports, ideas and pull requests are welcome; please read [CONTRIBUTING.md](CONTRIBUTING.md) and the
[Code of Conduct](CODE_OF_CONDUCT.md). Security issues: see [SECURITY.md](SECURITY.md), not public issues.

## License

[MIT](LICENSE). "VŠE" and "InSIS" are names of the Prague University of Economics and Business and its system;
they are used here only to say what the extension works with.
