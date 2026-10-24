"""Turn a saved InSIS page into a local test page that runs InSIS+.

Usage: python make_fixture.py <saved.html> <name> [page-url] [--with pages/x.js,pages/y.js]
Writes test/fixtures/<name>.html (or test/fixtures/private/<name>.built.html for logged-in snapshots).
--with adds page modules that are not in the manifest yet; they load before generic.js, as in the extension.
Serve the extension folder and open it:
    python -m http.server 8765 --directory insis-plus
    http://localhost:8765/test/fixtures/<name>.html

A <base> tag keeps InSIS's own CSS, images and links pointing at insis.vse.cz;
a small shim stands in for the chrome.* APIs the extension uses.
"""
import pathlib
import re
import sys

SERVER = "http://localhost:8765/"
SCRIPTS = ["content.js", "nav-data.js", "nav.js", "ui.js", "todo.js", "composed.js", "course.js", "home.js", "syllabus.js", "catalog.js", "pages/timetable.js", "pages/student-portal.js", "pages/submissions.js", "pages/study-record.js", "pages/docserver.js", "pages/messages.js", "generic.js", "sync.js"]

SHIM = """<script>
window.chrome = {
  runtime: { getURL: (p) => '%s' + p },
  storage: { local: {
    get: async (k) => { try { return { [k]: JSON.parse(localStorage.getItem(k)) || undefined }; } catch { return {}; } },
    set: async (o) => { try { for (const k in o) localStorage.setItem(k, JSON.stringify(o[k])); } catch {} },
    remove: async (k) => { try { for (const key of [].concat(k)) localStorage.removeItem(key); } catch {} },
  },
  // Writes from other test pages (the sync frame) arrive as "storage" events.
  onChanged: { addListener: (fn) => addEventListener('storage', (e) => {
    try { e.key && fn({ [e.key]: { newValue: JSON.parse(e.newValue) } }, 'local'); } catch {}
  }) } },
};
</script>""" % SERVER

# Logged-in test pages: background sync loads these local snapshots instead of InSIS (same language as the page).
SYNC_MAP = r"""<script>
window.__ipxFixtureFor = (url) => {
  const cs = /-cs[.-]/.test(location.pathname);
  // Most specific first: other addresses carry a link back to the portal (zpet=…moje_studium.pl).
  const map = [[/rozvrh_student/, 'timetable-personal'], [/moje_studium/, 'student-portal'],
    [/pruchod_studiem/, 'study-record'], [/odevzdavarny/, 'submissions', 'submissions-cs-real'], [/dok_server\/$/, 'docserver'],
    [/posta\/slozka/, 'mailbox', 'mailbox']];
  const hit = map.find(([re]) => re.test(url));
  return hit && new URL((cs ? hit[2] || hit[1] + '-cs' : hit[1]) + '.built.html', location.href).href;
};
</script>"""


def main():
    args = sys.argv[1:]
    extra = []
    if "--with" in args:
        i = args.index("--with")
        extra = [s for s in args[i + 1].split(",") if s]
        del args[i : i + 2]
    src, name = pathlib.Path(args[0]), args[1]
    html = src.read_text(encoding="utf-8", errors="replace")
    # Snapshots from collect_server.py start with "<!-- source: <url> -->"; that url is the best base.
    source = re.match(r"<!-- source: (\S+) -->", html)
    base = args[2] if len(args) > 2 else source.group(1) if source else "https://insis.vse.cz/"
    scripts = SCRIPTS[:-2] + extra + SCRIPTS[-2:]

    fixtures = pathlib.Path(__file__).parent / "fixtures"
    private = src.resolve().parent == (fixtures / "private").resolve()
    head = f'<base href="{base}">\n{SHIM}\n' + (SYNC_MAP + "\n" if private else "")
    i = html.lower().find("<head>")
    html = html[: i + 6] + "\n" + head + html[i + 6 :] if i >= 0 else head + html

    tail = "".join(f'<script src="{SERVER}{s}"></script>\n' for s in scripts)
    j = html.lower().rfind("</body>")
    html = html[:j] + tail + html[j:] if j >= 0 else html + tail

    # Logged-in snapshots hold personal data: their test pages stay next to them in the git-ignored private/ folder.
    out = fixtures / "private" / f"{name}.built.html" if private else fixtures / f"{name}.html"
    out.parent.mkdir(exist_ok=True)
    out.write_text(html, encoding="utf-8")
    print(out)


if __name__ == "__main__":
    main()
