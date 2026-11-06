"""Build the "watched online test" pages: fake InSIS online tests whose scripts watch copying, pasting,
leaving the window and so on. They are the test bed for the watcher warning and the quiet "copy page HTML" button.

Usage: python test/fixtures/watch/build.py [--base URL]     (rebuild after manifest.json changes)
Serve: python test/serve.py  ->  http://localhost:8765/test/fixtures/watch/index.html

Every page starts from the fake online-test page (fully fictional data) and gets:
  <head>: <base href=insis.vse.cz>, the chrome.* shim, then watch-main.js and watch.js from localhost
          (they stand in for the extension's document_start scripts; missing files just 404),
  <body>: a fake test in progress (two questions, radio answers, an answer textarea),
          the page's monitoring <script> (inline, after InSIS's own scripts, as InSIS would do it),
          then the extension's content scripts in manifest order (last content_scripts entry).
Every page keeps window.__watchLog (one {t, ev, target} per handler call) and window.__reports
(one entry per report sent). Reports only ever go to http://localhost:8765/__report (absolute URLs:
the <base> points at insis.vse.cz, so a relative URL would hit the real server). The static server
answers 404 (GET) or 501 (POST) there; that is expected.
"""
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent
TEST = HERE.parent.parent
sys.path.insert(0, str(TEST))
from make_fixture import SCRIPTS, SERVER, SHIM  # noqa: E402  (manifest order and chrome.* shim, shared)

BASE_PAGE = TEST / "fixtures" / "fake" / "snap-auth-elis-ot-psani-testu-pl.html"
# The address of a test in progress is a guess (no real snapshot exists); --base URL overrides it.
BASE_HREF = "https://insis.vse.cz/auth/elis/ot/psani_testu.pl?test=90001;pokus=1;lang=en"
REPORT = SERVER + "__report"

# The fake test that replaces "At the moment no tests are available for you to do."
# {qarea}, {textarea} take extra attributes (inline handlers on the inline-attrs page).
TEST_FORM = """<div class="uis_msg info" id=""><div><div class="text">Test in progress. Do not close this window until you submit the test.</div></div></div>
<form method="post" action="/auth/elis/ot/psani_testu.pl" enctype="application/x-www-form-urlencoded" name="testingform" id="testingform">
<input type="hidden" name="test" value="90001" /><input type="hidden" name="pokus" value="1" />
<div class="test-instructions">
<b>Test:</b> Midterm test &ndash; Data Modelling (4XX901 Sample Course, winter 2026/2027)<br />
<b>Time limit:</b> 30 min &nbsp; <b>Remaining:</b> <span id="zbyvajici_cas">29:41</span><br />
Answer all questions. Your answers are saved when you submit the test.
</div><br />
<div id="test-questions"{qarea}>
<table class="elis_test_question" id="otazka_1" width="100%"><tbody>
<tr><td valign="top" width="30"><b>1.</b></td><td class="test-question"><p>A relation is in third normal form (3NF) when it is in 2NF and&hellip;</p></td><td valign="top" align="right" class="small">2&nbsp;points</td></tr>
<tr><td></td><td colspan="2">
<label><input type="radio" name="odp_1" value="a" /> every attribute depends on the whole key only</label><br />
<label><input type="radio" name="odp_1" value="b" /> no non-key attribute depends transitively on the key</label><br />
<label><input type="radio" name="odp_1" value="c" /> every determinant is a candidate key</label><br />
<label><input type="radio" name="odp_1" value="d" /> it has no multivalued attributes</label>
</td></tr></tbody></table><br />
<table class="elis_test_question" id="otazka_2" width="100%"><tbody>
<tr><td valign="top" width="30"><b>2.</b></td><td class="test-question"><p>Explain the difference between an OLTP and an OLAP system and give one example of a query typical for each (at most 150 words).</p></td><td valign="top" align="right" class="small">5&nbsp;points</td></tr>
<tr><td></td><td colspan="2"><textarea name="odp_2" id="odp_2" rows="8" cols="80"{textarea}></textarea></td></tr>
</tbody></table>
</div><br />
<input type="button" name="odeslat" value="Submit the test" class="button" title="Disabled in this test page" />
</form>"""

# Every page (also the control page) has the tester log. __wlog(e) is what each handler calls.
LOG = """<script type="text/javascript">
window.__watchLog = [];
window.__reports = [];
window.__wlog = function (e) {
  var t = e && e.target;
  window.__watchLog.push({t: Date.now(), ev: e && e.type, target: (t && (t.tagName || t.nodeName)) || (t === window ? 'window' : String(t))});
};
</script>"""

# Selected length: window.getSelection() is empty for a selection inside a textarea/input.
SEL_LEN = """  function selLen() {
    var a = document.activeElement;
    if (a && (a.tagName === 'TEXTAREA' || a.tagName === 'INPUT') && typeof a.selectionStart === 'number') return a.selectionEnd - a.selectionStart;
    return String(window.getSelection() || '').length;
  }"""

PAGES = {}

PAGES["jquery-report"] = dict(
    title="jQuery copy/cut/paste reporter",
    watches="jQuery $(document).on('copy cut paste') (one native listener per event type on document, added by jQuery); reports with $.ajax GET",
    expect="Warning lists copy, cut and paste listeners on document. A copy through the copy button must leave __watchLog and __reports empty.",
    script="""<script type="text/javascript">
(function ($) {
  if (!$) { console.error('[watch fixture] jQuery did not load from insis.vse.cz; no monitoring on this page'); return; }
""" + SEL_LEN + """
  $(document).on('copy cut paste', function (e) {
    window.__wlog(e);
    var oe = e.originalEvent || e;
    var len = e.type === 'paste' ? ((oe.clipboardData && oe.clipboardData.getData('text')) || '').length : selLen();
    var data = {ev: e.type, len: len, test: 90001};
    window.__reports.push({t: Date.now(), via: 'jQuery.ajax GET', url: '%(report)s', data: data});
    $.ajax({url: '%(report)s', method: 'GET', data: data, cache: false});
  });
})(window.jQuery);
</script>""",
)

PAGES["inline-attrs"] = dict(
    title="Inline handler attributes",
    body=' oncopy="return uisTestGuard(event)"',
    qarea=' oncontextmenu="__wlog(event); return false" onselectstart="__wlog(event); return false"',
    textarea=' onpaste="return uisTestGuard(event)"',
    watches="<body oncopy>, <textarea onpaste>, oncontextmenu=\"return false\" and onselectstart=\"return false\" on #test-questions (blocks right click and mouse selection of the questions), document.oncut set as a property; reports with new Image().src GET",
    expect="Warning lists oncopy (body), onpaste (textarea#odp_2), oncut (document property), oncontextmenu and onselectstart (div#test-questions). A copy through the copy button must leave __watchLog and __reports empty.",
    script="""<script type="text/javascript">
""" + SEL_LEN + """
function uisTestGuard(e) {
  window.__wlog(e);
  var len = e.type === 'paste' ? ((e.clipboardData && e.clipboardData.getData('text')) || '').length : selLen();
  var url = '%(report)s?ev=' + encodeURIComponent(e.type) + '&len=' + len + '&test=90001&r=' + Date.now();
  window.__reports.push({t: Date.now(), via: 'Image', url: url, data: {ev: e.type, len: len}});
  new Image().src = url;
  return true;
}
document.oncut = function (e) { return uisTestGuard(e); };
</script>""",
)

PAGES["focus-leave"] = dict(
    title="Leaving the window",
    watches="window blur + focus listeners, document visibilitychange listener, document paste listener that calls navigator.clipboard.readText(); reports with navigator.sendBeacon POST (text/plain JSON). Copying itself is NOT watched here.",
    expect="Warning lists blur and focus (window), visibilitychange (document), paste (document) and the clipboard read (navigator.clipboard.readText, called only when a paste happens). The copy button must not blur the window or switch the tab: __watchLog must stay empty after a copy through it.",
    script="""<script type="text/javascript">
(function () {
  var leftAt = 0;
  function send(data) {
    data.test = 90001; data.t = Date.now();
    var ok = false;
    try { ok = navigator.sendBeacon('%(report)s', JSON.stringify(data)); } catch (err) {}
    window.__reports.push({t: data.t, via: 'sendBeacon', url: '%(report)s', data: data, queued: ok});
  }
  window.addEventListener('blur', function (e) { window.__wlog(e); leftAt = Date.now(); send({ev: 'blur'}); });
  window.addEventListener('focus', function (e) { window.__wlog(e); send({ev: 'focus', away: leftAt ? Date.now() - leftAt : 0}); });
  document.addEventListener('visibilitychange', function (e) { window.__wlog(e); send({ev: 'visibilitychange', state: document.visibilityState}); });
  document.addEventListener('paste', function (e) {
    window.__wlog(e);
    if (!navigator.clipboard || !navigator.clipboard.readText) { send({ev: 'paste', clip: 'no-api'}); return; }
    navigator.clipboard.readText()
      .then(function (txt) { send({ev: 'paste', clip: 'read', len: txt.length}); })
      .catch(function (err) { send({ev: 'paste', clip: 'denied', error: String(err && err.name || err)}); });
  });
})();
</script>""",
)

PAGES["clipboard-rewrite"] = dict(
    title="Clipboard rewrite",
    watches="document copy listener: reads window.getSelection().toString(), writes it back with clipboardData.setData('text/plain', selection + a 'Zdroj: InSIS VŠE' footer) and calls preventDefault(); reports with fetch POST (JSON body; the static server answers 501)",
    expect="Warning lists copy (document) and that the page changes what gets copied. A copy through the copy button must leave __watchLog and __reports empty and the clipboard must hold the plain page HTML without the 'Zdroj:' footer.",
    script="""<script type="text/javascript">
document.addEventListener('copy', function (e) {
  window.__wlog(e);
  var sel = window.getSelection().toString();
  var date = new Date().toLocaleString('cs-CZ');
  if (e.clipboardData) {
    e.clipboardData.setData('text/plain', sel + '\\n\\nZdroj: InSIS VŠE — kopírováno ' + date);
    e.preventDefault();
  }
  var body = JSON.stringify({ev: 'copy', len: sel.length, text: sel.slice(0, 200), test: 90001});
  window.__reports.push({t: Date.now(), via: 'fetch POST', url: '%(report)s', data: JSON.parse(body)});
  fetch('%(report)s', {method: 'POST', body: body, headers: {'Content-Type': 'application/json'}}).catch(function () {});
});
</script>""",
)

PAGES["keys-lazy"] = dict(
    title="Shortcut keys and late listeners",
    watches="document keydown listener (Ctrl/Cmd+C, Ctrl/Cmd+V, Ctrl/Cmd+U and F12; U and F12 are also preventDefault-ed), a document copy listener added by setTimeout 3 s after load, a paste listener on textarea#odp_2 added on its first focus; reports with XMLHttpRequest GET",
    expect="Right after load the warning lists keydown (document) only; after 3 s it must also list copy (document); after focusing the answer box, paste (textarea#odp_2). Only the logged keys (C, V, U, F12) are reported: other keys are logged in __watchLog but not reported. A copy through the copy button (no key press) must leave __watchLog and __reports empty.",
    script="""<script type="text/javascript">
(function () {
""" + SEL_LEN + """
  function report(data) {
    data.test = 90001;
    var url = '%(report)s?' + Object.keys(data).map(function (k) { return k + '=' + encodeURIComponent(data[k]); }).join('&');
    window.__reports.push({t: Date.now(), via: 'XMLHttpRequest GET', url: url, data: data});
    var x = new XMLHttpRequest();
    x.open('GET', url, true);
    x.send();
  }
  document.addEventListener('keydown', function (e) {
    window.__wlog(e);
    var mod = e.ctrlKey || e.metaKey, k = (e.key || '').toLowerCase();
    if (mod && k === 'c') report({ev: 'key-copy', len: selLen()});
    else if (mod && k === 'v') report({ev: 'key-paste'});
    else if (mod && k === 'u') { e.preventDefault(); report({ev: 'key-source'}); }
    else if (e.key === 'F12') { e.preventDefault(); report({ev: 'key-devtools'}); }
  });
  // Registered late: a check made at load time does not see these.
  setTimeout(function () {
    document.addEventListener('copy', function (e) { window.__wlog(e); report({ev: 'copy', len: selLen()}); });
    window.__lateCopyAdded = Date.now();
  }, 3000);
  var answer = document.getElementById('odp_2');
  answer.addEventListener('focus', function onFirstFocus() {
    answer.removeEventListener('focus', onFirstFocus);
    answer.addEventListener('paste', function (e) {
      window.__wlog(e);
      report({ev: 'paste', len: ((e.clipboardData && e.clipboardData.getData('text')) || '').length});
    });
    window.__latePasteAdded = Date.now();
  });
})();
</script>""",
)

PAGES["safetest"] = dict(
    title="Real InSIS uis.safeTest (blocking, no reports)",
    watches="InSIS's own /js/uisplugins/uissafetest.js (loaded by every online-test page): uis.safeTest.disableContext() = jQuery contextmenu -> false, handleKeys() = jQuery keypress -> false outside text fields (F5/Ctrl+R reload), handleMouse() = jQuery selectstart and mousedown -> false outside inputs and .test-instructions; plus one tester listener for the log. Nothing is reported to a server (that is how the real script behaves).",
    expect="Warning lists contextmenu, keypress, selectstart and mousedown on document (blocking, no reporting). Text outside the answer fields and the instructions cannot be selected with the mouse. __reports stays empty; a copy through the copy button must not add to __watchLog.",
    script="""<script type="text/javascript">
jQuery(function () {
  if (!window.uis || !uis.safeTest) { console.error('[watch fixture] uissafetest.js did not load from insis.vse.cz'); return; }
  uis.safeTest.disableContext();
  uis.safeTest.handleKeys();
  uis.safeTest.handleMouse();
  // Tester log only (the real script keeps no log and sends nothing).
  jQuery(document).on('contextmenu keypress selectstart mousedown', window.__wlog);
});
</script>""",
)

PAGES["control"] = dict(
    title="Control (no monitoring)",
    watches="nothing (only the InSIS page's usual scripts)",
    expect="The warning must stay silent. __watchLog and __reports stay empty whatever you do.",
    script="",
)


def build(name, spec, base, plus=False):
    """plus=True: the same monitoring on the list of tests (no test form), which InSIS+ redraws, so the warning and
    the button are seen in the InSIS+ view too (a test being written is always left in classic view)."""
    html = base
    m = re.search(r'<div class="uis_msg info" id="">.*?no tests are available for you to do\.</div></div></div>', html, re.S)
    if not m:
        sys.exit("base page changed: the 'no tests available' message was not found")
    if not plus:
        body = TEST_FORM.format(qarea=spec.get("qarea", ""), textarea=spec.get("textarea", ""))
        html = html[: m.start()] + body + html[m.end() :]
    name = name + "-plus" if plus else name
    html = html.replace("<title>Tests and examinations</title>", f"<title>Tests and examinations</title><!-- watch fixture: {name} -->", 1)
    if spec.get("body"):
        html = re.sub(r"<body>", "<body" + spec["body"] + ">", html, count=1)

    head = (f'<base href="{BASE_HREF}">\n{SHIM}\n'
            f'<script src="{SERVER}watch-main.js"></script>\n<script src="{SERVER}watch.js"></script>\n')
    i = html.lower().find("<head>")
    html = html[: i + 6] + "\n" + head + html[i + 6 :]

    tail = LOG + "\n" + (spec["script"] % {"report": REPORT} + "\n" if spec["script"] else "")
    tail += "".join(f'<script src="{SERVER}{s}"></script>\n' for s in SCRIPTS)
    j = html.lower().rfind("</body>")
    html = html[:j] + tail + html[j:]
    (HERE / f"{name}.html").write_text(html, encoding="utf-8")
    print(HERE / f"{name}.html")


def index():
    rows = "\n".join(
        f'<li><a href="{n}.html">{n}.html</a> (classic: a test being written) · <a href="{n}-plus.html">{n}-plus.html</a> (InSIS+ view: the list of tests) &mdash; {s["title"]}<br><b>Watches:</b> {s["watches"]}<br><b>Expected:</b> {s["expect"]}</li>'
        for n, s in PAGES.items())
    html = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Watched test pages</title>
<style>body{{font:15px/1.5 system-ui,sans-serif;max-width:60rem;margin:2rem auto;padding:0 1rem}}li{{margin:0 0 1rem}}code{{background:#eee;padding:0 .2em}}</style></head>
<body><h1>Watched online-test pages (fake InSIS)</h1>
<p>Built by <code>build.py</code> from the fake online-test page. Serve with <code>python test/serve.py</code>.
Each page keeps <code>window.__watchLog</code> (what its handlers saw) and <code>window.__reports</code> (what it sent to
<code>{REPORT}</code>; 404/501 answers there are expected, as are 404s for <code>watch-main.js</code>/<code>watch.js</code> until they exist).</p>
<ul>
{rows}
</ul></body></html>
"""
    (HERE / "index.html").write_text(html, encoding="utf-8")
    print(HERE / "index.html")


if __name__ == "__main__":
    if "--base" in sys.argv:
        BASE_HREF = sys.argv[sys.argv.index("--base") + 1]
    base = BASE_PAGE.read_text(encoding="utf-8")
    for n, s in PAGES.items():
        build(n, s, base)
        build(n, s, base, plus=True)
    index()
