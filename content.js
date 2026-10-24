// InSIS+ — command palette (Ctrl+K) over every InSIS page you have seen.
// Data never leaves the browser. Also the storage of InSIS+ (personal data per session, settings per user).
(() => {
  // Frames are left alone, except the hidden frame sync.js uses to read pages in the background: there page modules
  // only parse and store their data (ipx.syncOnly), nothing is drawn.
  const syncOnly = window.top !== window && window.name === 'ipx-sync';
  if (window.top !== window && !syncOnly) return;

  const STORE_KEY = 'insisPlus';
  const MAX_LINKS = 2000;
  const MAX_RESULTS = 30;
  // Never offer links that perform an action just by being opened.
  const UNSAFE = /odhlas|logout|log_out|smaz|delete|zrusit|cancel/i;

  // The language switch (#vlajky) offers the other languages: a Czech page links to ENGLISH, an English one doesn't.
  const switcher = document.getElementById('vlajky');
  const lang = (
    switcher
      ? /ENGLISH/i.test(switcher.textContent)
      : /^cs/i.test(document.documentElement.lang) ||
        /Přihlášen|Osobní administrativa/.test((document.body?.innerText || '').slice(0, 3000))
  )
    ? 'cs'
    : 'en';
  const T = {
    cs: { placeholder: 'Hledat v InSIS… (rozvrh, zkoušky, dokumenty)', fav: 'Připnuté', frequent: 'Často používané',
      results: 'Výsledky', empty: 'Nic nenalezeno. Stránky se indexují, jak je procházíte.', button: 'Hledat',
      hint: '↑↓ výběr · Enter otevřít · Ctrl+Enter nová karta · Ctrl+D připnout · Esc zavřít' },
    en: { placeholder: 'Search InSIS… (timetable, exams, documents)', fav: 'Pinned', frequent: 'Frequently used',
      results: 'Results', empty: 'Nothing found. Pages get indexed as you browse them.', button: 'Search',
      hint: '↑↓ select · Enter open · Ctrl+Enter new tab · Ctrl+D pin · Esc close' },
  }[lang];

  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const norm = (s) => clean(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  function urlKey(href) {
    try {
      const u = new URL(href, location.href);
      if (u.origin !== location.origin) return null;
      u.hash = '';
      return u.href;
    } catch {
      return null;
    }
  }

  // ---------- storage (docs/ia/02-redesign.md, principle 8) ----------
  //
  // Two stores:
  // - personal data read from InSIS (classes, grades, deadlines, counts, names): session-only. chrome.storage.session
  //   where the content script may use it (bg.js opens it), else a "volatile" key in local storage that bg.js wipes
  //   when the browser starts. Wiped on logout, on change of identity, when another user logs in, and by bg.js after
  //   10 minutes without InSIS activity.
  // - settings and the small "seen" record, per InSIS user (a hash of InSIS's user id from the page header), in local
  //   storage; nothing at all in Shared computer mode.

  const PERSONAL = ['timetable', 'submissions', 'docserver', 'studyRecord', 'portal', 'sync', 'courses', 'profile',
    'menu', 'homeUrl', 'messages', 'notices'];
  // Data stored by page modules, each with an `updated` time: on save the newer copy wins (another tab, the sync frame).
  const DATA_KEYS = ['timetable', 'submissions', 'docserver', 'studyRecord', 'portal', 'sync', 'messages'];
  const SESSION_KEY = 'insisPlusSession';
  const IDLE_MS = 10 * 60e3;

  let state = { links: {}, fav: [] };
  let user = null;
  let shared = false;
  let session = null; // the storage area that holds personal data
  const dataListeners = [];

  async function sessionArea() {
    try {
      if (chrome.storage.session) {
        await chrome.storage.session.get(SESSION_KEY);
        return { area: chrome.storage.session, name: 'session', key: SESSION_KEY };
      }
    } catch {}
    return { area: chrome.storage.local, name: 'local', key: 'insisPlusVolatile' };
  }

  // InSIS's header shows the logged-in user's photo as /img.pl?userunid=<id> on every logged-in page.
  async function currentUser() {
    const img = document.querySelector('#navigace img[src*="userunid="], img.in-header[src*="userunid="]');
    const id = img && /userunid=(\d+)/.exec(img.getAttribute('src'))?.[1];
    if (!id) return null;
    const bytes = new TextEncoder().encode(`insis-plus:${id}`);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest).slice(0, 8)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => obj?.[k] !== undefined).map((k) => [k, obj[k]]));
  const omit = (obj, keys) => Object.fromEntries(Object.entries(obj || {}).filter(([k]) => !keys.includes(k)));

  async function wipePersonal() {
    await session.area.remove(session.key);
    for (const k of PERSONAL) delete state[k];
  }

  async function load() {
    session = await sessionArea();
    user = await currentUser();
    const local = (await chrome.storage.local.get(STORE_KEY))[STORE_KEY] || {};
    shared = !!local.shared;
    // Before 0.7 everything lived in one local object: personal data is dropped, settings move to this user.
    if (local.links || local.fav || local.timetable) {
      const settings = omit(local, [...PERSONAL, 'users', 'shared', 'lastUser']);
      const next = { shared, users: {} };
      if (user && !shared) next.users[user] = settings;
      await chrome.storage.local.set({ [STORE_KEY]: next });
      Object.assign(local, next);
    }
    let personal = (await session.area.get(session.key))[session.key];
    if (personal && (personal.user !== user || Date.now() - (personal.active || 0) > IDLE_MS)) {
      await session.area.remove(session.key);
      personal = null;
    }
    const settings = user && !shared ? local.users?.[user] || {} : {};
    state = Object.assign({ links: {}, fav: [] }, settings, user ? personal?.data || {} : {});
    state.shared = shared;
    state.sharedAsked = !!local.sharedAsked;
  }

  function adoptNewer(from) {
    let changed = false;
    for (const k of DATA_KEYS) {
      if (from?.[k] && (from[k].updated || 0) > (state[k]?.updated || 0)) {
        state[k] = from[k];
        changed = true;
      }
    }
    if (from?.courses) state.courses = { ...from.courses, ...state.courses };
    return changed;
  }

  async function save() {
    const keys = Object.keys(state.links);
    if (keys.length > MAX_LINKS) {
      const favs = new Set(state.fav);
      keys
        .filter((k) => !favs.has(k))
        .sort((a, b) => (state.links[a].v - state.links[b].v) || (state.links[a].s - state.links[b].s))
        .slice(0, keys.length - MAX_LINKS)
        .forEach((k) => delete state.links[k]);
    }
    if (!user) return;
    const stored = (await session.area.get(session.key))[session.key];
    const storedData = stored?.user === user ? stored.data : {};
    let data = pick(state, PERSONAL);
    if (syncOnly) {
      // The sync frame only adds page data it read; everything else stays as the visible tabs left it.
      data = { ...storedData };
      for (const k of DATA_KEYS) if (state[k] && (state[k].updated || 0) > (storedData?.[k]?.updated || 0)) data[k] = state[k];
      data.courses = { ...storedData?.courses, ...state.courses };
    } else if (adoptNewer(storedData)) {
      data = pick(state, PERSONAL);
      dataListeners.forEach((fn) => fn());
    }
    await session.area.set({ [session.key]: { user, active: Date.now(), data } });
    if (syncOnly || shared) return;
    const local = (await chrome.storage.local.get(STORE_KEY))[STORE_KEY] || {};
    local.users = { ...local.users, [user]: omit(state, [...PERSONAL, 'shared', 'sharedAsked']) };
    await chrome.storage.local.set({ [STORE_KEY]: local });
  }

  // Shared computer mode (InSIS+ settings, and asked once on Home): nothing is kept between sessions.
  async function setShared(on) {
    const local = (await chrome.storage.local.get(STORE_KEY))[STORE_KEY] || {};
    local.shared = on;
    local.sharedAsked = true;
    if (on) local.users = {};
    await chrome.storage.local.set({ [STORE_KEY]: local });
    shared = on;
    state.shared = on;
    state.sharedAsked = true;
    if (!on) await save();
  }

  // Everything InSIS+ keeps, for "Clear stored data" in InSIS+ settings.
  async function clearAll() {
    await session.area.remove(session.key);
    const local = (await chrome.storage.local.get(STORE_KEY))[STORE_KEY] || {};
    await chrome.storage.local.set({ [STORE_KEY]: { shared: local.shared, sharedAsked: local.sharedAsked, users: {} } });
  }

  // Pick up data stored elsewhere (background sync, other tabs) and tell the page.
  chrome.storage.onChanged?.addListener((changes, area) => {
    const change = changes[session?.key];
    if (!change || area !== session.name) return;
    if (!change.newValue) {
      // Wiped (logout elsewhere, idle timer): forget it here too.
      for (const k of PERSONAL) delete state[k];
      dataListeners.forEach((fn) => fn());
      return;
    }
    if (change.newValue.user === user && adoptNewer(change.newValue.data)) dataListeners.forEach((fn) => fn());
  });

  // Activity keeps the personal data alive (bg.js wipes it after IDLE_MS without any); logout and change of identity
  // wipe it at once. Clicks on InSIS's own logout link count too.
  let lastActive = 0;
  function touch() {
    if (!user || Date.now() - lastActive < 60e3) return;
    lastActive = Date.now();
    session.area.get(session.key).then((r) => {
      const v = r[session.key];
      if (v?.user === user) session.area.set({ [session.key]: { ...v, active: lastActive } });
    });
  }
  function watchActivity() {
    for (const type of ['pointerdown', 'keydown', 'scroll']) addEventListener(type, touch, { passive: true, capture: true });
    addEventListener('click', (e) => {
      const a = e.target.closest?.('a[href]');
      if (a && /\/(logout|zmena_identity)\.pl/.test(a.getAttribute('href') || '')) wipePersonal();
    }, true);
    if (/\/(logout|zmena_identity)\.pl/.test(location.pathname)) wipePersonal();
  }

  function pageTitle() {
    return clean(document.title)
      .replace(/^InSIS\s*[-–:|]\s*/i, '')
      .replace(/^(Sylabus předmětu|Course syllabus)\s+/i, '') || location.pathname;
  }

  function indexPage() {
    const now = Date.now();
    const ctx = pageTitle();

    for (const a of document.querySelectorAll('a[href]')) {
      const href = a.getAttribute('href');
      if (!href || /^(javascript|mailto|tel):/i.test(href) || href.startsWith('#')) continue;
      const key = urlKey(href);
      if (!key) continue;
      const title = clean(a.textContent) || clean(a.title) || clean(a.querySelector('img')?.alt);
      if (title.length < 2 || title.length > 100 || UNSAFE.test(key) || UNSAFE.test(title)) continue;

      const link = state.links[key];
      if (link) {
        link.s = now;
      } else {
        state.links[key] = { t: title, c: ctx, v: 0, s: now };
      }
    }

    const here = urlKey(location.href);
    if (here && !UNSAFE.test(here)) {
      const link = (state.links[here] ||= { t: ctx, c: '', v: 0, s: now });
      link.v += 1;
      link.s = now;
    }
  }

  // ---------- search ----------

  function score(q, text) {
    const i = text.indexOf(q);
    if (i >= 0) return 100 - Math.min(i, 50) + (i === 0 || text[i - 1] === ' ' ? 50 : 0);
    const tokens = q.split(' ').filter(Boolean);
    if (tokens.length > 1 && tokens.every((t) => text.includes(t))) return 60;
    let pos = 0;
    let gaps = 0;
    for (const ch of q.replace(/ /g, '')) {
      const f = text.indexOf(ch, pos);
      if (f < 0) return 0;
      gaps += f - pos;
      pos = f + 1;
    }
    return Math.max(1, 30 - gaps);
  }

  function search(query) {
    const favs = new Set(state.fav);
    const entries = Object.entries(state.links).map(([url, l]) => ({ url, ...l, fav: favs.has(url) }));
    const q = norm(query);

    if (!q) {
      const fav = entries.filter((e) => e.fav);
      const frequent = entries
        .filter((e) => !e.fav && e.v > 0)
        .sort((a, b) => b.v - a.v || b.s - a.s)
        .slice(0, MAX_RESULTS);
      return [
        { label: T.fav, items: fav },
        { label: T.frequent, items: frequent },
      ].filter((g) => g.items.length);
    }

    const items = entries
      .map((e) => {
        const s = score(q, norm(e.t)) || (norm(e.c).includes(q) ? 10 : 0);
        return { ...e, rank: s && s + Math.log2(e.v + 1) * 5 + (e.fav ? 30 : 0) };
      })
      .filter((e) => e.rank > 0)
      .sort((a, b) => b.rank - a.rank)
      .slice(0, MAX_RESULTS);
    return items.length ? [{ label: T.results, items }] : [];
  }

  // ---------- UI ----------

  const host = document.createElement('div');
  host.id = 'insis-plus-root';
  const root = host.attachShadow({ mode: 'closed' });
  const el = (tag, props = {}, ...kids) => {
    const n = Object.assign(document.createElement(tag), props);
    n.append(...kids);
    return n;
  };

  const css = el('link', { rel: 'stylesheet', href: chrome.runtime.getURL('palette.css') });
  const fab = el('button', { className: 'fab', type: 'button' },
    el('span', { className: 'kbd', textContent: 'Ctrl K' }), el('span', { className: 'fab-label', textContent: T.button }));
  const input = el('input', { className: 'query', type: 'text', autocomplete: 'off', spellcheck: false });
  const list = el('div', { className: 'list' });
  list.setAttribute('role', 'listbox');
  const dialog = el('div', { className: 'palette' }, input, list, el('div', { className: 'hint', textContent: T.hint }));
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  const backdrop = el('div', { className: 'backdrop', hidden: true }, dialog);
  root.append(css, fab, backdrop);
  input.placeholder = T.placeholder;

  let flat = [];
  let active = 0;

  function render() {
    const groups = search(input.value);
    flat = groups.flatMap((g) => g.items);
    active = Math.min(active, Math.max(0, flat.length - 1));
    list.replaceChildren();

    if (!flat.length) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = T.empty;
      list.append(empty);
      return;
    }

    let n = 0;
    for (const g of groups) {
      const label = document.createElement('div');
      label.className = 'group';
      label.textContent = g.label;
      list.append(label);

      for (const item of g.items) {
        const idx = n++;
        const row = document.createElement('div');
        row.className = 'item' + (idx === active ? ' active' : '');
        row.setAttribute('role', 'option');

        const star = document.createElement('button');
        star.type = 'button';
        star.className = 'star' + (item.fav ? ' on' : '');
        star.textContent = item.fav ? '★' : '☆';
        star.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleFav(item.url);
        });

        const text = document.createElement('div');
        text.className = 'text';
        const title = document.createElement('div');
        title.className = 'title';
        title.textContent = item.t;
        const ctx = document.createElement('div');
        ctx.className = 'ctx';
        ctx.textContent = item.c;
        text.append(title, ctx);

        row.append(star, text);
        row.addEventListener('mousemove', () => {
          if (active !== idx) {
            active = idx;
            highlight();
          }
        });
        row.addEventListener('click', (e) => go(item.url, e.ctrlKey || e.metaKey));
        list.append(row);
      }
    }
  }

  function highlight() {
    root.querySelectorAll('.item').forEach((el, i) => el.classList.toggle('active', i === active));
    root.querySelector('.item.active')?.scrollIntoView({ block: 'nearest' });
  }

  function toggleFav(url) {
    const i = state.fav.indexOf(url);
    if (i >= 0) state.fav.splice(i, 1);
    else state.fav.push(url);
    save();
    render();
  }

  function go(url, newTab) {
    if (newTab) window.open(url, '_blank', 'noopener');
    else location.href = url;
    close();
  }

  function open() {
    backdrop.hidden = false;
    input.value = '';
    active = 0;
    render();
    input.focus();
  }

  function close() {
    backdrop.hidden = true;
  }

  const isOpen = () => !backdrop.hidden;

  fab.addEventListener('click', open);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });
  input.addEventListener('input', () => {
    active = 0;
    render();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!flat.length) return;
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + flat.length) % flat.length;
      highlight();
    } else if (e.key === 'Enter' && flat[active]) {
      e.preventDefault();
      go(flat[active].url, e.ctrlKey || e.metaKey);
    } else if (e.key === 'Escape') {
      close();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && flat[active]) {
      e.preventDefault();
      toggleFav(flat[active].url);
    }
    e.stopPropagation();
  });

  document.addEventListener(
    'keydown',
    (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        isOpen() ? close() : open();
      } else if (e.key === '/' && !typing && !isOpen()) {
        e.preventDefault();
        open();
      }
    },
    true,
  );

  const ready = load().then(() => {
    if (syncOnly) return;
    watchActivity();
    indexPage();
    save();
    document.body.append(host);
  });

  // Shared with ui.js, sync.js and the page modules (same content-script world).
  globalThis.insisPlus = {
    ready,
    syncOnly,
    onData: (fn) => dataListeners.push(fn),
    notify: () => dataListeners.forEach((fn) => fn()),
    lang,
    clean,
    norm,
    get state() {
      return state;
    },
    save,
    get user() {
      return user;
    },
    setShared,
    clearAll,
    wipe: wipePersonal,
    open,
    setFab: (visible) => {
      fab.hidden = !visible;
    },
  };
})();
