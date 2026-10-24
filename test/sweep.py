"""Headless sweep (maintainer only; needs `pip install playwright`, Chrome, `python test/serve.py` running, and
test/fixtures/private/snapnames.json listing the snap-* pages). Usage: python -P test/sweep.py [--shots] [filter...]

Opens every private snapshot test page at 1300 and 375 px and reports the header, tab rows, raw InSIS leftovers,
sideways overflow and script errors. Only localhost and InSIS's public scripts and styles are reachable (no
cookies; documents, images, XHR and fonts are aborted), so no personal data leaves the machine."""
import json, os, sys
from playwright.sync_api import sync_playwright

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fixtures', 'private')
OUT = os.path.join(ROOT, 'sweep')  # git-ignored with the snapshots
os.makedirs(OUT, exist_ok=True)
names = json.load(open(os.path.join(ROOT, 'snapnames.json')))
args = [a for a in sys.argv[1:] if not a.startswith('--')]
if args:
    names = [n for n in names if any(a in n for a in args)]
shots = '--shots' in sys.argv

PROBE = r"""() => {
  const host = document.getElementById('insis-plus-page'), r = host && host.shadowRoot, str1 = document.getElementById('str1');
  const vis = (e) => { if (!e.getClientRects().length) return false; const cs = getComputedStyle(e); return cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const slotted = !!(str1 && host && host.contains(str1) && vis(str1));
  const inStr = (sel) => slotted ? [...str1.querySelectorAll(sel)].filter(vis) : [];
  // Marked by a module: the element or an ancestor inside #str1 carries a data-ipx-* attribute or an ipx class.
  const marked = (e) => { for (let x = e; x && x !== str1; x = x.parentElement) { if ([...x.attributes].some(a => a.name.startsWith('data-ipx') && a.name !== 'data-ipx-keep') || /ipx/.test(x.className || '')) return true; } return false; };
  const rawTables = inStr('table').filter(t => !marked(t) && t.querySelectorAll('tr').length > 2 && !t.closest('form'));
  const rawFormTables = inStr('form table').filter(t => !marked(t) && t.querySelectorAll('tr').length > 2);
  const oldIcons = inStr('img').filter(i => /\.(gif|png)$/i.test(i.getAttribute('src') || '') && i.width > 0);
  return {
    takeover: !!r, slotted,
    title: r ? (r.querySelector('.titles h1') || {}).textContent || '' : '',
    eyebrow: r ? (r.querySelector('.titles .eyebrow') || {}).textContent || '' : '',
    tabRows: r ? r.querySelectorAll('.view-tabs').length : 0,
    insisTabRows: inStr('table.portal_menu, .rada-ikon[data-rada]').filter(e => !marked(e)).length,
    crumbs: inStr('nav[aria-label="breadcrumb"], #titulek').length,
    rawTables: rawTables.length, rawFormTables: rawFormTables.length, oldIcons: oldIcons.length,
    overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
    text: r ? (r.querySelector('main.content') || {innerText: ''}).innerText.length : 0,
    slotText: slotted ? str1.innerText.length : 0,
  };
}"""

rows = []
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', headless=True)
    for width, tag in ((1300, 'd'), (375, 'm')):
        ctx = b.new_context(viewport={'width': width, 'height': 900}, color_scheme='light')
        # InSIS's own public scripts and styles load as on the real page (they add row numbers etc.); nothing else leaves
        # localhost: no documents, images, XHR or fonts, and the context has no cookies.
        def allow(route):
            u, t = route.request.url, route.request.resource_type
            if u.startswith('http://localhost:8765/') or (u.startswith('https://insis.vse.cz/') and t in ('script', 'stylesheet')):
                return route.continue_()
            return route.abort()
        ctx.route('**/*', allow)
        page = ctx.new_page()
        errs = []
        def onerr(e):
            lines = (e.stack or '').splitlines()
            errs.append(str(e)[:120] + (' @ ' + lines[1].strip()[:110] if len(lines) > 1 else ''))
        page.on('pageerror', onerr)
        for n in names:
            errs.clear()
            try:
                page.goto(f'http://localhost:8765/test/fixtures/private/{n}.open.built.html', wait_until='domcontentloaded', timeout=20000)
                page.wait_for_timeout(2500)
                d = page.evaluate(PROBE)
            except Exception as e:
                d = {'error': str(e)[:160]}
            d.update(n=n.replace('snap-', ''), w=tag, errors=list(errs))
            rows.append(d)
            if shots and 'error' not in d:
                page.screenshot(path=os.path.join(OUT, f'{tag}-{n}.png'), full_page=False)
        ctx.close()
    b.close()
json.dump(rows, open(os.path.join(OUT, 'sweep.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
bad = [r for r in rows if r.get('error') or r.get('errors') or not r.get('takeover') or r.get('tabRows', 0) > 1 or r.get('crumbs') or r.get('insisTabRows') or r.get('rawTables') or r.get('rawFormTables') or r.get('oldIcons') or r.get('overflow', 0) > 2]
print('pages', len(rows), 'flagged', len(bad))
for r in bad:
    print(r['w'], r['n'][:60], {k: r[k] for k in ( 'tabRows', 'crumbs', 'insisTabRows', 'rawTables', 'rawFormTables', 'oldIcons', 'overflow') if k in r and r[k]}, r.get('error', ''), r.get('errors', [])[:1])
