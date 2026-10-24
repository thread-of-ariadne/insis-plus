"""Check the IA mapping (docs/ia/mapping.json) against itself and a crawl of InSIS.

Usage: python scripts/ia_check.py [crawl.json]   (default: test/fixtures/private/map/crawl.json, maintainer only)
Fails when:
- a node has no English or Czech label, or a page points to a node that does not exist;
- a page type has no `read` rule, or the rule is not background / on-open / never;
- a source of Home › To do or Notifications (a page whose `also` contains "home" or "notifications") is not
  `read: background` and `link: shell`;
- a page has no `link` rule (shell / insis-only);
- a fetched page has no `fetch` sets, a linkable page no `links` sets (unless marked `verify`), or a set contains an
  action parameter;
- a structure label (destination, group, block) is missing;
- a crawled page type is not mapped;
- a page marked `verify` has link or fetch sets, or a sets list names a transient parameter (lang, zpet, back, _m);
- an external link has no https url (and is not marked copied) or points to an unknown node;
- the crawl contradicts the mapping: a page marked `form` shows no form, a page with action buttons is not marked
  `form`, or a page never opened by the crawl has fetch sets.
Notes (not failures) list the `verify_data` features that stay off and external links waiting for confirmation.
Prints how many page types each node holds, so overloaded or empty nodes stand out.
"""
import collections
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
mapping = json.loads((ROOT / "docs/ia/mapping.json").read_text(encoding="utf-8"))
nodes = mapping["nodes"]
pages = mapping["pages"]
errors = []

for n, label in nodes.items():
    if not (isinstance(label, dict) and label.get("en") and label.get("cs")):
        errors.append(f"node {n}: needs both en and cs labels")

structure = mapping.get("structure", {})
for group, entries in structure.items():
    if group.startswith("_"):
        continue
    for key, label in entries.items():
        if key.startswith("_"):
            continue
        if group == "entry":
            errors += [f"structure entry.{key}: {path} is not a page of that node" for path in label
                       if path not in pages or (pages[path]["node"] != key and key not in pages[path].get("variants", {}).values())]
            continue
        if group == "views":
            errors += [f"structure views.{key}: unknown node {n}" for n in [key, *label] if n not in nodes]
            continue
        if group == "tabs":
            members = [n for lst in label.values() for n in lst] if isinstance(label, dict) else label
            errors += [f"structure tabs.{key}: unknown node {n}" for n in members if n not in nodes]
            continue
        if group == "glosses" and key not in nodes:
            errors.append(f"structure glosses.{key}: unknown node")
        if not (isinstance(label, list) and len(label) == 2 and all(label)):
            errors.append(f"structure {group}.{key}: needs [en, cs]")

# Parameter names that perform actions (01-current-map.md §4); no fetch or links set may contain them.
# (_m, a menu id, is handled as a transient parameter, not as an allowed-set name.)
DENY = re.compile(r"^(\w*tisk\w*|potvrz\w*|\w*_on|\w*_off|email\w*|notif\w*|odber\w*|add\w*|del\w*|remove\w*|_.*|akce|"
                  r"operace|smaz\w*|zrus\w*|odhlas\w*|prihlas\w*|odesl\w*|uloz\w*|form|on|off|vybrano|zalozeni|stahnuti|"
                  r"download|export\w*|zakaz\w*|blok\w*)$")
COMPOSED = {"home", "notifications", "exams.mine"}
for path, m in pages.items():
    targets = [m["node"], *m.get("also", []), *m.get("variants", {}).values()]
    for n in targets:
        if n not in nodes:
            errors.append(f"{path}: unknown node {n}")
    read, link = m.get("read"), m.get("link")
    if read not in ("background", "on-open", "never"):
        errors.append(f"{path}: read must be background, on-open or never (is {read!r})")
    if link not in ("shell", "insis-only"):
        errors.append(f"{path}: link must be shell or insis-only (is {link!r})")
    feeds = COMPOSED & set(m.get("also", []) + [m["node"]])
    # A composed page may read its own InSIS page when the student opens it (Home is InSIS's main page).
    if feeds and read != "background" and not (read == "on-open" and m["node"] in COMPOSED):
        errors.append(f"{path}: feeds {', '.join(sorted(feeds))} but is read: {read}")
    if feeds and link != "shell":
        errors.append(f"{path}: feeds {', '.join(sorted(feeds))} but composed pages may not link to it")
    if read in ("background", "on-open") and not m.get("fetch"):
        errors.append(f"{path}: a fetched page needs a fetch allow-list")
    if read == "never" and "fetch" in m:
        errors.append(f"{path}: a never-read page has no fetch sets")
    if link == "shell" and "links" not in m and not m.get("verify"):
        errors.append(f"{path}: a linkable page needs a links allow-list (or verify)")
    if m.get("verify") and ("links" in m or "fetch" in m):
        errors.append(f"{path}: a verify page has no links or fetch sets until verified")
    if link == "insis-only" and "links" in m:
        errors.append(f"{path}: an insis-only page has no links sets")
    for key in ("fetch", "links"):
        for allowed in m.get(key, []):
            bad = [x for x in allowed.split(",") if x and DENY.match(x)]
            if bad:
                errors.append(f"{path}: {key} set contains action parameters {bad}")
    if feeds and m.get("verify"):
        errors.append(f"{path}: feeds {', '.join(sorted(feeds))} but its parameter sets are not verified")
    if feeds and m.get("verify_data"):
        print(f"note: {path} feeds {', '.join(sorted(feeds))}; off until confirmed: {m['verify_data']}")
TRANSIENT = {k for k in mapping.get("transient_params", {}) if k != "_comment"}
for name in TRANSIENT:
    if not mapping["transient_params"][name].get("rule"):
        errors.append(f"transient parameter {name}: needs a rule")
for path, m in pages.items():
    for key in ("fetch", "links"):
        for allowed in m.get(key, []):
            hit = TRANSIENT & set(allowed.split(","))
            if hit:
                errors.append(f"{path}: {key} sets must not list transient parameters {sorted(hit)}")
for name, ext in mapping.get("external", {}).items():
    if name.startswith("_"):
        continue
    if ext.get("verify"):
        print(f"note: external link {name} stays hidden until confirmed: {ext['verify']}")
    if not (ext.get("copied") or str(ext.get("url", "")).startswith("https://")):
        errors.append(f"external {name}: needs an https url or copied: true")
    for n in ext.get("where", []):
        if n not in nodes:
            errors.append(f"external {name}: unknown node {n}")
for label, n in mapping.get("menu_only", {}).items():
    if not label.startswith("_") and n not in nodes:
        errors.append(f"menu '{label}': unknown node {n}")

crawl_file = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "test/fixtures/private/map/crawl.json"
if crawl_file.exists():
    crawl = json.loads(crawl_file.read_text(encoding="utf-8"))
    seen = {p["route"].split("?")[0] for p in crawl["pages"] if "not found" not in p["title"].lower()}
    seen |= {r.split("?")[0] for r in crawl.get("skipped", {})}
    errors += [f"crawled page type not mapped: {s}" for s in sorted(seen - set(pages))]
    # `form: true` must match what the crawl saw: a page with a form button somewhere among its crawled variants.
    with_form = {p["route"].split("?")[0] for p in crawl["pages"] if any(f.get("buttons") for f in p.get("forms", []))}
    # Buttons that only filter or display; any other button is an action, and its page must be marked `form`.
    FILTER = re.compile(r"^(restrict|search|display|go|choose|select|select all|show|filter|continue|search for town|"
                        r"print the list of phone numbers of the whole university)$", re.I)
    with_action = {p["route"].split("?")[0] for p in crawl["pages"]
                   for f in p.get("forms", []) for b in f.get("buttons", []) if not FILTER.match(b.strip())}
    crawled = {p["route"].split("?")[0] for p in crawl["pages"]}
    for path, m in pages.items():
        if path in crawled and m.get("form") and path not in with_form:
            errors.append(f"{path}: marked form but the crawl saw no form there")
        if path in with_action and not m.get("form"):
            errors.append(f"{path}: the crawl saw action buttons there but it is not marked form")
        if path not in crawled and m.get("fetch"):
            errors.append(f"{path}: never opened by the crawl, so it may not be fetched")
    print(f"crawl: {len(seen)} page types checked")
else:
    print("no crawl file: only the mapping itself was checked")

per = collections.Counter(m["node"] for m in pages.values())
per.update(v for k, v in mapping.get("menu_only", {}).items() if not k.startswith("_"))
linked = {n for m in pages.values() for n in [*m.get("also", []), *m.get("variants", {}).values()]}
empty = [n for n in nodes if n not in per and n not in linked]
reads = collections.Counter(m.get("read") for m in pages.values())
print("read rules:", ", ".join(f"{k} {v}" for k, v in reads.most_common()))
print("page types per node:", ", ".join(f"{n} {c}" for n, c in per.most_common()))
if empty:
    print("nodes with no InSIS page (InSIS+ only):", ", ".join(empty))
if errors:
    print("\n".join(errors))
    sys.exit(1)
print("ok")
