# Chrome Web Store listing

What goes into the Chrome Web Store Developer Dashboard for InSIS+. Upload `dist/insis-plus-<version>-chrome.zip`
(built by `python scripts/package.py`, also attached to every GitHub release).

## Account

- Publisher display name: `thread-of-ariadne`
- Contact email: the project's Proton address (verified in the dashboard)
- Trader status: **non-trader** (free, no payments, no ads)

## Store listing

**Name:** InSIS+

**Summary** (max 132 characters):

> Unofficial redesign of VŠE's InSIS: a task-based menu, Ctrl+K search and a dashboard. Everything stays in your browser.

**Description:**

> InSIS+ makes insis.vse.cz, the information system of the Prague University of Economics and Business (VŠE),
> easier to use.
>
> • A clear sidebar (Home, Courses, Schedule, Exams, Grades & credits, Study matters, Campus & people) instead of
> boxes of links
> • Home: what you have to do today, deadlines, next classes and new materials
> • A page for every course: classes, materials, submissions, results, teachers and the syllabus in one place
> • Ctrl+K search across every InSIS page, typo-tolerant and diacritics-insensitive
> • Timetable as a week view, e-index with credits and average, document server by course
> • Czech and English, light and dark theme, phone layout
>
> Privacy: no server, no analytics, no tracking. InSIS+ only runs on insis.vse.cz, never submits a form or takes an
> action for you, and keeps data read from InSIS only for the session. Classic view brings back any original page.
>
> InSIS+ is an independent, open-source student project (MIT). It is not affiliated with, endorsed by or supported
> by VŠE. Source code and issues: https://github.com/thread-of-ariadne/insis-plus
>
> *Česky:* InSIS+ dělá InSIS přehlednějším: menu podle úkolů, přehled dne, vyhledávání Ctrl+K a čitelné stránky
> předmětů. Vše běží jen ve vašem prohlížeči. Neoficiální studentský projekt, není spojen s VŠE.

- Category: **Education**
- Language: English (add Czech as a second listing language if wanted)

## Graphics

- Store icon: `icons/icon-128.png`
- Screenshots, 1280×800, at least 1 (up to 5): Home, a course page, Ctrl+K search, timetable, document server.
  Take them on the local fixtures (`python test/serve.py`) or blur every name, grade and student number.
- Small promo tile 440×280: icon and "InSIS+, a friendlier InSIS".

## Privacy practices

**Single purpose:**

> Improves the interface of insis.vse.cz (VŠE's student information system): navigation, search and readable
> study pages.

**Permission justifications:**

- `storage`: keeps the user's settings (pinned pages, theme, Classic view per page) and session data read from
  InSIS, so pages open instantly. Nothing leaves the browser.
- `alarms`: a once-a-minute check that deletes the session data read from InSIS after 10 minutes without
  activity, even when no InSIS tab is open.
- Host permission `https://insis.vse.cz/*`: the extension redesigns InSIS pages and reads the user's own InSIS
  pages (timetable, study record, submissions, documents) with their existing session to fill the dashboard.

**Remote code:** No. All JavaScript is in the package. The only external request is a stylesheet and fonts from
Google Fonts (no code).

**Data usage** (tick these; everything is processed locally and never transmitted):

- Personally identifiable information (name shown by InSIS)
- Personal communications (unread count of InSIS mail)
- Web history (addresses and titles of InSIS pages opened, for Ctrl+K search)
- Website content (InSIS pages: timetable, results, deadlines)

Certify: not sold to third parties; not used or transferred for purposes unrelated to the single purpose; not used
for creditworthiness or lending.

**Privacy policy URL:** https://github.com/thread-of-ariadne/insis-plus/blob/main/PRIVACY.md

## Visibility

Start as **Unlisted** (installable by link, not in search), switch to Public after the first round of feedback.
