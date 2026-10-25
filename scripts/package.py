"""Build the extension zip that is uploaded to the stores and attached to GitHub releases.

Usage: python scripts/package.py   ->  dist/insis-plus-<version>.zip (Firefox, unpacked installs)
                                       dist/insis-plus-<version>-chrome.zip (Chrome Web Store)

Only what the extension needs goes in: manifest.json, the scripts and styles it lists, the pages/ folder,
LICENSE and PRIVACY.md. Tests, docs and tooling stay out. Fails if a file the manifest references is missing.
"""
import json
import pathlib
import sys
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent


def files_from_manifest(manifest):
    names = {"manifest.json", "LICENSE", "PRIVACY.md"}
    for script in manifest.get("content_scripts", []):
        names.update(script.get("js", []))
        names.update(script.get("css", []))
    for entry in manifest.get("web_accessible_resources", []):
        for res in entry.get("resources", []):
            if "*" in res:
                names.update(str(p.relative_to(ROOT)).replace("\\", "/") for p in ROOT.glob(res) if p.is_file())
            else:
                names.add(res)
    background = manifest.get("background", {})
    names.update(background.get("scripts", []))
    if background.get("service_worker"):
        names.add(background["service_worker"])
    for icon in (manifest.get("icons") or {}).values():
        names.add(icon)
    return sorted(n for n in names if not n.endswith("README.md"))


def main():
    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    names = files_from_manifest(manifest)
    missing = [n for n in names if not (ROOT / n).is_file()]
    if missing:
        sys.exit(f"Missing files referenced by manifest.json: {', '.join(missing)}")

    (ROOT / "dist").mkdir(exist_ok=True)
    for suffix, man in (("", manifest), ("-chrome", chrome_manifest(manifest))):
        out = ROOT / "dist" / f"insis-plus-{manifest['version']}{suffix}.zip"
        with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
            for n in names:
                if n == "manifest.json":
                    z.writestr(n, json.dumps(man, indent=2, ensure_ascii=False) + "\n")
                else:
                    z.write(ROOT / n, n)
        print(f"{out.relative_to(ROOT)}  ({len(names)} files)")


def chrome_manifest(manifest):
    """The Chrome Web Store build: without the Firefox-only keys Chrome warns about."""
    man = json.loads(json.dumps(manifest))
    man.pop("browser_specific_settings", None)
    man.get("background", {}).pop("scripts", None)
    return man


if __name__ == "__main__":
    main()
