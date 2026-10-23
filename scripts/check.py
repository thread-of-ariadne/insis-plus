"""Repository checks run by CI (and runnable locally): python scripts/check.py

- manifest.json is valid JSON, its version is x.y.z and every file it references exists;
- no logged-in InSIS snapshot (personal data) is tracked by git;
- CHANGELOG.md has an [Unreleased] section and an entry for the manifest version.
JavaScript syntax is checked separately with `node --check`.
"""
import json
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
from package import files_from_manifest  # noqa: E402

errors = []

manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
version = manifest.get("version", "")
if not re.fullmatch(r"\d+\.\d+\.\d+", version):
    errors.append(f"manifest version '{version}' is not x.y.z")
for name in files_from_manifest(manifest):
    if not (ROOT / name).is_file():
        errors.append(f"manifest references a missing file: {name}")

tracked = subprocess.run(["git", "ls-files", "test/fixtures/private"], cwd=ROOT, capture_output=True, text=True).stdout.split()
leaked = [t for t in tracked if not t.endswith(".gitignore")]
if leaked:
    errors.append("private snapshots are tracked by git (personal data): " + ", ".join(leaked))

changelog = (ROOT / "CHANGELOG.md").read_text(encoding="utf-8")
if "## [Unreleased]" not in changelog:
    errors.append("CHANGELOG.md has no [Unreleased] section")
if f"## [{version}]" not in changelog:
    errors.append(f"CHANGELOG.md has no entry for version {version}")

if errors:
    print("\n".join(f"error: {e}" for e in errors))
    sys.exit(1)
print(f"ok: version {version}, {len(files_from_manifest(manifest))} packaged files, no private snapshots tracked")
