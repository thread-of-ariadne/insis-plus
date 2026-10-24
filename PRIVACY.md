# Privacy

InSIS+ is built so that your InSIS data stays in your browser, and only for as long as you need it.

## What the extension stores

**Data read from InSIS** (your study, classes, results, submission deadlines, new-file counts, the InSIS menu, your
name): only for the session. It is kept in the browser's session storage, which is never written to disk; where a
browser does not allow that, in a temporary entry that the extension deletes when the browser starts. It is also
deleted:

- when you log out (with InSIS+'s Log out or InSIS's own logout link) or change identity in InSIS;
- when a different InSIS user logs in in the same browser;
- after 10 minutes without activity in InSIS, even if no InSIS tab is open.

**Your settings**, per InSIS user (identified by a one-way hash of the name InSIS shows as logged in, never the name
itself), in the extension's local storage:

- pinned pages and the addresses and titles of InSIS pages you opened (for Ctrl+K search);
- interface choices (appearance, collapsed sidebar, Classic view per page type, background reads on or off);
- a small record for Notifications: the time of your last visit to Notifications and the last count of new
  documents (plain values; nothing about your grades or courses).

**Shared computer mode** (asked once on the main page, changeable in InSIS+ settings): nothing at all is kept
between sessions, no settings, no pins, no record.

"Clear stored data" in InSIS+ settings deletes everything; removing the extension does too.

## What it reads, and when

- **In the background**, at most every 3 hours, only while an InSIS tab is open and you were active in the last
  10 minutes, InSIS+ opens these InSIS pages in a hidden frame with your existing session: the Student's portal,
  your personal timetable, your study record, coursework submissions, the document server's folder tree and your
  InSIS mail box (only the unread count it shows). These are ordinary page loads from `insis.vse.cz`, the same as
  clicking the links; nothing is clicked, submitted or changed. They may appear in InSIS's own log of your
  operations ("My operations").
- **When you open a page that needs it**: the list of classmates on a course's People tab, and InSIS's mail
  forwarding page when the mail box does not say where mail is forwarded. Not stored.
- **Never**: pages or links that do something (sign up, sign off, mark as read, generate a document, delete,
  change settings), opening a stored document, questionnaires, messages. Every address InSIS+ reads or links to
  is checked against a reviewed list (`docs/ia/mapping.json`).

## What it sends

- **Nothing to us.** There is no InSIS+ server, no analytics, no tracking, no ads.
- **No requests outside InSIS**, with one exception: the fonts (Bricolage Grotesque and Figtree) are loaded from
  Google Fonts, which means Google sees your IP address and that a font was requested. Bundling the fonts with the
  extension to remove this is planned.
- Links outside InSIS that InSIS+ shows: your university e-mail in Outlook (InSIS's own link), and e-mail
  addresses, app-store and support links copied from InSIS pages.

## Permissions

- `storage`: to keep the data above.
- `alarms`: to delete the session data after 10 minutes without activity, even when no InSIS tab is open.
- Access to `https://insis.vse.cz/*` only: the extension runs on no other site.
