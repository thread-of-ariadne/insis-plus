"""Serve the repository for the test pages, with caching off (so a reload always runs the current scripts,
also inside the background-sync frame).

Usage: python test/serve.py [port]    (default 8765, from any folder)
"""
import functools
import http.server
import pathlib
import sys


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    root = pathlib.Path(__file__).resolve().parent.parent
    handler = functools.partial(NoCache, directory=str(root))
    http.server.ThreadingHTTPServer(("127.0.0.1", port), handler).serve_forever()
