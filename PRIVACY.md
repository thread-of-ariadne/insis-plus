# Privacy

InSIS+ is built so that your InSIS data stays in your browser.

## What the extension stores

Locally, in your browser's extension storage (`chrome.storage.local`), and nowhere else:

- Titles and addresses of InSIS pages you opened, to power Ctrl+K search and "Recently opened".
- Your pinned pages and interface choices (sidebar grouping, collapsed state, classic view per page).
- The InSIS menu, your name and the document/task counters from the InSIS main page, to show them on other pages.
- Summaries of course syllabi you opened (code, name, semester, credits), for "My courses".
- Parsed data from pages that a module reads, such as your timetable, for the dashboard.

You can delete all of it by removing the extension or clearing its storage.

## What it sends

- **Nothing to us.** There is no InSIS+ server, no analytics, no tracking, no ads.
- **No requests outside InSIS**, with one exception: the fonts (Bricolage Grotesque and Figtree) are loaded from
  Google Fonts, which means Google sees your IP address and that a font was requested. Bundling the fonts with the
  extension to remove this is planned.
- Modules may read other InSIS pages in the background (for example your timetable) using your existing session.
  These are ordinary read-only requests to `insis.vse.cz`; nothing is submitted or changed.

## Permissions

- `storage`: to keep the data above.
- Access to `https://insis.vse.cz/*` only: the extension runs on no other site.
