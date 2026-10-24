"""Bring built test pages up to date with the extension's script list (manifest.json), without rebuilding them:
every <script src=".../x.js"> of the extension is replaced by the current list, in the manifest's order.

Usage: python test/sync_fixtures.py   (from any folder)
"""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SERVER = "http://localhost:8765/"
scripts = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))["content_scripts"][-1]["js"]
tags = "".join(f'<script src="{SERVER}{s}"></script>\n' for s in scripts)
pattern = re.compile(r'(?:<script src="' + re.escape(SERVER) + r'[\w/.-]+\.js"></script>\n?)+')
for f in [*ROOT.glob("test/fixtures/*.html"), *ROOT.glob("test/fixtures/private/*.built.html")]:
    text = f.read_text(encoding="utf-8")
    new, n = pattern.subn(lambda m: tags, text, count=1)
    if n and new != text:
        f.write_text(new, encoding="utf-8")
        print("updated", f.name)
