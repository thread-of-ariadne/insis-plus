"""Tiny local receiver for InSIS page snapshots, used while developing InSIS+.

Run:  python test/collect_server.py
Then, in a logged-in insis.vse.cz tab, either POST page HTML to http://127.0.0.1:8766/save?name=<name>,
or (when the browser blocks a public site from calling localhost) embed http://127.0.0.1:8766/receiver.html
in an iframe and postMessage({name, html}) to it; the receiver, being on localhost itself, does the POST.
Files land in test/fixtures/private/<name>.html. They contain personal data: keep them local, never commit or publish.

Only accepts snapshots from https://insis.vse.cz (directly or through the receiver), only on 127.0.0.1,
only plain file names.
"""
import http.server
import pathlib
import re
import urllib.parse

ORIGIN = "https://insis.vse.cz"
OUT = pathlib.Path(__file__).parent / "fixtures" / "private"
MAX_BYTES = 5 * 1024 * 1024
SELF = "http://127.0.0.1:8766"

# Accepts messages only from the InSIS origin and forwards them to /save on this same origin.
RECEIVER = f"""<!doctype html><meta charset="utf-8"><title>InSIS+ receiver</title>
<script>
addEventListener('message', async (e) => {{
  if (e.origin !== '{ORIGIN}' || !e.data || typeof e.data.html !== 'string') return;
  const r = await fetch('/save?name=' + encodeURIComponent(e.data.name), {{
    method: 'POST', headers: {{ 'Content-Type': 'text/plain;charset=utf-8', 'X-Snapshot-Origin': e.origin }}, body: e.data.html }});
  e.source.postMessage({{ name: e.data.name, status: r.status }}, e.origin);
}});
if (window.parent !== window) parent.postMessage({{ ready: true }}, '{ORIGIN}');

// Hand-over through window.name: an InSIS tab sets window.name = 'IPX:' + JSON [{{name, html}}] and navigates here.
(async () => {{
  if (!window.name.startsWith('IPX:')) return;
  const items = JSON.parse(window.name.slice(4));
  window.name = '';
  const out = [];
  for (const it of items) {{
    const r = await fetch('/save?name=' + encodeURIComponent(it.name), {{
      method: 'POST', headers: {{ 'Content-Type': 'text/plain;charset=utf-8', 'X-Snapshot-Origin': '{ORIGIN}' }}, body: it.html }});
    out.push(it.name + ': ' + r.status);
  }}
  document.body.textContent = out.join('\\n');
  document.title = 'saved ' + out.length;
}})();
</script>"""


class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if urllib.parse.urlparse(self.path).path != "/receiver.html":
            self.send_response(404)
            self.end_headers()
            return
        body = RECEIVER.encode()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def cors(self):
        self.send_header("Access-Control-Allow-Origin", ORIGIN)
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        # Chrome's Private Network Access: a public site calling localhost needs this on the preflight.
        self.send_header("Access-Control-Allow-Private-Network", "true")

    def do_OPTIONS(self):
        self.send_response(204 if self.headers.get("Origin") == ORIGIN else 403)
        self.cors()
        self.end_headers()

    def do_POST(self):
        query = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        name = (query.get("name") or [""])[0]
        length = int(self.headers.get("Content-Length") or 0)
        # Either InSIS itself, or our receiver page relaying a message it verified came from InSIS.
        relayed = self.headers.get("Origin") == SELF and self.headers.get("X-Snapshot-Origin") == ORIGIN
        if (self.headers.get("Origin") != ORIGIN and not relayed) or not re.fullmatch(r"[a-z0-9-]{1,60}", name) or not 0 < length <= MAX_BYTES:
            self.send_response(400)
            self.cors()
            self.end_headers()
            return
        OUT.mkdir(parents=True, exist_ok=True)
        (OUT / f"{name}.html").write_bytes(self.rfile.read(length))
        self.send_response(200)
        self.cors()
        self.end_headers()
        self.wfile.write(b"ok")


if __name__ == "__main__":
    print(f"Saving to {OUT}")
    http.server.HTTPServer(("127.0.0.1", 8766), Handler).serve_forever()
