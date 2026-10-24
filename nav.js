// InSIS+ — the navigation model: where every InSIS page belongs in the new structure, and the one URL rule.
// Data comes from nav-data.js, generated from docs/ia/mapping.json (the reviewed design, docs/ia/02-redesign.md).
//
// ipx.nav.route(url)            → { path, page, node, dest } for any InSIS URL (unknown pages: node null)
// ipx.nav.allowed(url, kind)    → true when InSIS+ may show it as a link (kind 'link') or read it ('fetch')
// ipx.nav.safe(url, kind)       → the URL if allowed (a copied link loses an unsafe zpet/back), else null
// ipx.nav.target(node)          → where a sidebar item or tab for that node leads (InSIS page or InSIS+ page)
// ipx.nav.label(id)             → the node's / structure entry's label in the page language
(() => {
  const ipx = globalThis.insisPlus;
  const D = globalThis.insisPlusNav;
  if (!ipx || !D) return;
  const L = ipx.lang === 'cs' ? 1 : 0;
  const base = () => new URL(document.baseURI);
  const ORIGIN = base().origin;

  // Parameter names that perform actions (docs/ia/01-current-map.md §4). Same list as scripts/ia_check.py.
  const DENY = /^(\w*tisk\w*|potvrz\w*|\w*_on|\w*_off|email\w*|notif\w*|odber\w*|add\w*|del\w*|remove\w*|_.*|akce|operace|smaz\w*|zrus\w*|odhlas\w*|prihlas\w*|odesl\w*|uloz\w*|form|on|off|vybrano|zalozeni|stahnuti|download|export\w*|zakaz\w*|blok\w*)$/;
  const TRANSIENT = new Set(D.transient);

  // InSIS writes parameters after "?" and ";" (and sometimes a second "?"). A back-link (zpet…) carries a whole
  // address with its own "?" and commas, so it runs to the next ";".
  const BACKLINK = /^(zpet\w*|back)=/;
  function parse(url) {
    let u;
    try { u = new URL(url, document.baseURI); } catch { return null; }
    const params = new Map();
    const parts = u.search.replace(/^\?/, '').split(/[;&]/).flatMap((seg) => (BACKLINK.test(seg) ? [seg] : seg.split('?')));
    for (const part of parts) {
      if (!part) continue;
      const i = part.indexOf('=');
      let value = i < 0 ? '' : part.slice(i + 1);
      try { value = decodeURIComponent(value.replace(/\+/g, ' ')); } catch {}
      params.set(i < 0 ? part : part.slice(0, i), value);
    }
    let path = u.pathname.replace(/\/index\.pl$/, '/');
    // Public pages (/lide/…, /katalog/…) are the same pages as their logged-in versions under /auth/.
    if (u.origin === ORIGIN && !path.startsWith('/auth/') && D.pages[`/auth${path}`]) {
      path = `/auth${path}`;
      u.pathname = `/auth${u.pathname}`;
    }
    return { u, path, params };
  }

  // Internal course ids of my courses (syllabus links of the study record and the timetable).
  function myCourseIds() {
    const ids = new Set();
    for (const c of ipx.state.studyRecord?.courses || []) {
      const m = /predmet=(\d+)/.exec(c.href || '');
      if (m) ids.add(m[1]);
    }
    return ids;
  }

  function variantNode(page, params) {
    for (const [key, node] of Object.entries(page.variants || {})) {
      const [name, value] = key.split('=');
      if (key.startsWith('no ')) { if (!params.has(key.slice(3))) return node; continue; }
      if (value === 'mine') { if (params.has(name) && myCourseIds().has(params.get(name))) return node; continue; }
      if (value === undefined ? params.has(name) : params.get(name) === value) return node;
    }
    return null;
  }

  const DEST = [
    [/^home$/, 'home'], [/^courses?\./, 'courses'], [/^schedule\./, 'schedule'], [/^exams\./, 'exams'],
    [/^grades\./, 'grades'], [/^studies\./, 'matters'], [/^campus\./, 'campus'], [/^all\./, 'all'],
    [/^messages\./, 'messages'], [/^help/, 'help'], [/^(account\.|plus\.|language|logout)/, 'account'],
    [/^notifications$/, 'notifications'],
  ];
  const destOf = (node) => (node?.startsWith('dest.') ? node.slice(5) : node && DEST.find(([re]) => re.test(node))?.[1]) || null;

  function route(url) {
    const p = parse(url);
    if (!p || p.u.origin !== ORIGIN) return { path: null, page: null, node: null, dest: null };
    // InSIS+ pages live on the main page's address after "#ipx:" (see target()).
    const hash = /^#ipx:([\w.-]+)(?:\/(.*))?$/.exec(p.u.hash);
    if (hash) return { path: p.path, page: D.pages[p.path], node: hash[1], arg: hash[2] ? decodeURIComponent(hash[2]) : null, dest: destOf(hash[1]), composed: true };
    const page = D.pages[p.path] || null;
    const node = page ? variantNode(page, p.params) || page.node : null;
    return { path: p.path, page, node, dest: destOf(node), params: p.params };
  }

  // ---------- the URL rule (docs/ia/02-redesign.md, principle 7.2) ----------

  function externalAllowed(u, copied) {
    if (u.protocol === 'mailto:') return copied && Object.values(D.external).some((e) => e.copied);
    return Object.values(D.external).some((e) => e.url && !e.verify && u.href.startsWith(e.url));
  }

  // kind: 'link' | 'fetch'. copied: the URL was taken verbatim from an InSIS page (then InSIS's navigation
  // parameters are tolerated; a zpet/back value must itself pass). Returns the URL to use, or null.
  function safe(url, kind = 'link', { copied = false, depth = 0 } = {}) {
    const p = parse(url);
    if (!p) return null;
    if (p.u.origin !== ORIGIN) return kind === 'link' && externalAllowed(p.u, copied) ? p.u.href : null;
    if (/^#ipx:/.test(p.u.hash)) return kind === 'link' ? p.u.href : null;
    const page = D.pages[p.path];
    url = p.u.href;
    if (!page || page.verify) return null;
    if (kind === 'link' && page.link !== 'shell') return null;
    if (kind === 'fetch' && page.read === 'never') return null;
    const names = [];
    let out = url;
    for (const [name, value] of p.params) {
      if (TRANSIENT.has(name)) {
        if (!copied) return null;
        if (name !== 'lang' && name !== '_m') {
          let target = value;
          if (name === 'back') { try { target = atob(value); } catch { target = ''; } }
          if (depth > 2 || !target || !safe(new URL(target, p.u.href).href, 'link', { copied: true, depth: depth + 1 })) {
            out = out.replace(new RegExp(`[;&?]${name}=[^;&]*`), '').replace(/\?;/, '?');
          }
        }
        continue;
      }
      if (DENY.test(name)) return null;
      const pinned = page.values?.[name];
      if (pinned && !pinned.includes(value)) return null;
      names.push(name);
    }
    const key = names.sort().join(',');
    const sets = kind === 'fetch' ? page.fetch : page.links;
    return sets?.includes(key) ? out : null;
  }
  const allowed = (url, kind, opts) => safe(url, kind, opts) !== null;

  // ---------- where a node leads ----------

  // Nodes that exist only in InSIS+ (composed pages), shown at the main page's address + "#ipx:<node>".
  const COMPOSED = new Set(['home', 'courses.mine', 'courses.files', 'notifications', 'plus.settings', 'language',
    'studies.requests', 'studies.nextdegree', 'course.overview', 'course.files', 'course.submissions', 'course.points', 'course.people',
    'course.syllabus', 'dest.matters', 'dest.campus', 'dest.all', 'dest.help', 'dest.account']);
  const home = () => ipx.state.homeUrl || `${ORIGIN}/auth/`;
  const composedUrl = (node, arg) => `${home().split('#')[0]}#ipx:${node}${arg ? '/' + encodeURIComponent(arg) : ''}`;

  // Links InSIS itself gave us (portal, main menu): copied verbatim, the preferred way to reach a page.
  function copiedLinks() {
    const out = [];
    for (const l of Object.values(ipx.state.portal?.paths || {})) out.push(l);
    for (const g of ipx.state.menu || []) out.push(...g.links);
    return out;
  }

  // The InSIS page a node opens: its entry pages first (structure.entry), each reached through a link InSIS gave
  // the student when there is one (it carries the right study and period), else by its plain address. A link is
  // used only if it really belongs to the node (route() agrees) and passes the URL rule.
  function target(node, arg) {
    if (COMPOSED.has(node)) return node === 'home' ? home().split('#')[0] : composedUrl(node, arg);
    const paths = D.structure.entry?.[node] || Object.keys(D.pages).filter((p) => D.pages[p].node === node ||
      Object.values(D.pages[p].variants || {}).includes(node));
    const copies = copiedLinks();
    for (const path of paths) {
      const pg = D.pages[path];
      if (!pg) continue;
      const variant = Object.entries(pg.variants || {}).find(([, n]) => n === node)?.[0];
      for (const l of copies) {
        const p = parse(l.href);
        if (!p || p.path !== path) continue;
        let href = l.href;
        // A tab of the same InSIS page (e.g. the exam list's zalozka=2): the copied link with that literal value.
        if (variant && /^\w+=\w+$/.test(variant) && !variant.endsWith('=mine')) {
          const [name, value] = variant.split('=');
          href = p.params.has(name) ? href.replace(new RegExp(`${name}=[^;&]*`), `${name}=${value}`) : `${href}${href.includes('?') ? ';' : '?'}${name}=${value}`;
        } else if (variant?.startsWith('no ')) {
          href = href.replace(new RegExp(`[;&?]${variant.slice(3)}=[^;&]*`), '');
        }
        const ok = safe(href, 'link', { copied: true });
        if (ok && route(ok).node === node) return ok;
      }
      const plain = `${ORIGIN}${path}`;
      if (safe(plain, 'link') && route(plain).node === node) return plain;
    }
    return null;
  }

  // ---------- labels ----------

  function label(id) {
    const s = D.structure;
    const pick = (v) => (Array.isArray(v) ? v[L] : v?.[L ? 'cs' : 'en']);
    for (const group of ['destinations', 'topbar', 'groups', 'home_blocks', 'menu', 'short']) {
      if (s[group]?.[id]) return pick(s[group][id]);
    }
    const n = D.nodes[id];
    if (!n) return id;
    // Node labels carry their parent ("Course › Files"); inside the parent only the last part is shown.
    return pick(n).split(' › ').pop();
  }
  // A section with views (structure.views): the section a view belongs to, and its sidebar label.
  const sectionOf = (node) => Object.entries(D.structure.views || {}).find(([k, list]) => !k.startsWith('_') && list.includes(node))?.[0] || node;
  const sectionLabel = (id) => D.structure.section_labels?.[id]?.[L] || label(id);
  const gloss = (id) => D.structure.glosses?.[id]?.[L] || '';
  const shortLabel = (id) => D.structure.short?.[id]?.[L] || label(id);

  ipx.nav = { route, safe, allowed, target, label, sectionLabel, sectionOf, views: D.structure.views || {}, gloss, shortLabel, composedUrl, destOf, tabs: D.structure.tabs, data: D, parse };
})();
