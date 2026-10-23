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
SCRIPTS = ["content.js", "ui.js", "home.js", "syllabus.js", "catalog.js", "pages/timetable.js", "pages/student-portal.js", "pages/submissions.js", "pages/study-record.js", "pages/docserver.js", "generic.js"]

SHIM = """<script>
window.chrome = {
  runtime: { getURL: (p) => '%s' + p },
  storage: { local: {
    get: async (k) => { try { return { [k]: JSON.parse(localStorage.getItem(k)) || undefined }; } catch { return {}; } },
    set: async (o) => { try { for (const k in o) localStorage.setItem(k, JSON.stringify(o[k])); } catch {} },
  } },
};
</script>""" % SERVER


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
    scripts = SCRIPTS[:-1] + extra + SCRIPTS[-1:]

    head = f'<base href="{base}">\n{SHIM}\n'
    i = html.lower().find("<head>")
    html = html[: i + 6] + "\n" + head + html[i + 6 :] if i >= 0 else head + html

    tail = "".join(f'<script src="{SERVER}{s}"></script>\n' for s in scripts)
    j = html.lower().rfind("</body>")
    html = html[:j] + tail + html[j:] if j >= 0 else html + tail

    # Logged-in snapshots hold personal data: their test pages stay next to them in the git-ignored private/ folder.
    fixtures = pathlib.Path(__file__).parent / "fixtures"
    private = src.resolve().parent == (fixtures / "private").resolve()
    out = fixtures / "private" / f"{name}.built.html" if private else fixtures / f"{name}.html"
    out.parent.mkdir(exist_ok=True)
    out.write_text(html, encoding="utf-8")
    print(out)


if __name__ == "__main__":
    main()
