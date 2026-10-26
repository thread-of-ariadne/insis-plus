// InSIS+ — command palette (Ctrl+K) over every InSIS page you have seen.
// Data never leaves the browser. Also the storage of InSIS+ (personal data per session, settings per user).
(() => {
  // Frames (InSIS's pop-ups and embedded pages) are left alone.
  if (window.top !== window) return;

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

  // What is kept on disk (local storage, per user): only these settings. Everything else InSIS+ holds is data read
  // from InSIS and lives in session storage only (PRIVACY.md), so a new kind of data can never be kept by accident.
  const SETTINGS = ['links', 'fav', 'plus', 'classic', 'sideCollapsed', 'seen'];
  const FLAGS = ['shared', 'sharedAsked'];
  const personalKeys = (obj) => Object.keys(obj || {}).filter((k) => !SETTINGS.includes(k) && !FLAGS.includes(k));
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

  // InSIS's header names the logged-in user on every logged-in page: <span id="logs"><strong>Přihlášen:</strong> Name</span>.
  // (The header's img.pl?userunid= images are InSIS's own icons, the same for everyone.) Only a one-way hash is kept.
  const hash = async (text) => {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`insis-plus:${text}`));
    return [...new Uint8Array(digest).slice(0, 8)].map((b) => b.toString(16).padStart(2, '0')).join('');
  };
  async function currentUser() {
    const logs = document.getElementById('logs');
    if (!logs) return null;
    const name = clean([...logs.childNodes].filter((n) => n.nodeName !== 'STRONG').map((n) => n.textContent).join(' '));
    return name ? hash(`name:${name}`) : null;
  }
  // Settings kept before 0.7.1 sit under the hash of the shared logout icon's number.
  async function legacyUser() {
    const img = document.querySelector('#navigace img[src*="userunid="], img.in-header[src*="userunid="]');
    const id = img && /userunid=(\d+)/.exec(img.getAttribute('src'))?.[1];
    return id ? hash(id) : null;
  }

  const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => obj?.[k] !== undefined).map((k) => [k, obj[k]]));

  // Pages InSIS+ reads when the student opens a page that shows them (a course's syllabus): kept for the session in a
  // key of their own, so the state stays small; wiped with the personal data. { [key]: { at, text } }
  const CACHE_KEY = 'insisPlusCache';
  const CACHE_MAX = 40;
  const cache = {
    async get(key) {
      try { return (await session.area.get(CACHE_KEY))[CACHE_KEY]?.[key] || null; } catch { return null; }
    },
    async set(key, text) {
      if (shared) return;
      try {
        const all = (await session.area.get(CACHE_KEY))[CACHE_KEY] || {};
        all[key] = { at: Date.now(), text };
        const keys = Object.keys(all).sort((a, b) => all[b].at - all[a].at);
        for (const k of keys.slice(CACHE_MAX)) delete all[k];
        await session.area.set({ [CACHE_KEY]: all });
      } catch {}
    },
  };

  async function wipePersonal() {
    await session.area.remove(session.key);
    await session.area.remove(CACHE_KEY);
    for (const k of personalKeys(state)) delete state[k];
  }

  async function load() {
    session = await sessionArea();
    user = await currentUser();
    const local = (await chrome.storage.local.get(STORE_KEY))[STORE_KEY] || {};
    shared = !!local.shared;
    // Before 0.7 everything lived in one local object: personal data is dropped, settings move to this user.
    if (local.links || local.fav || local.timetable) {
      const settings = pick(local, SETTINGS);
      const next = { shared, users: {} };
      if (user && !shared) next.users[user] = settings;
      await chrome.storage.local.set({ [STORE_KEY]: next });
      Object.assign(local, next);
    }
    const legacy = user && !shared && local.users && await legacyUser();
    if (legacy && legacy !== user && local.users[legacy]) {
      local.users[user] = local.users[user] || local.users[legacy];
      delete local.users[legacy];
      await chrome.storage.local.set({ [STORE_KEY]: local });
    }
    let personal = (await session.area.get(session.key))[session.key];
    if (personal && (personal.user !== user || Date.now() - (personal.active || 0) > IDLE_MS)) {
      await session.area.remove(session.key);
      personal = null;
    }
    const settings = user && !shared ? pick(local.users?.[user], SETTINGS) : {};
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
    if (adoptNewer(storedData)) dataListeners.forEach((fn) => fn());
    const data = pick(state, personalKeys(state));
    await session.area.set({ [session.key]: { user, active: Date.now(), data } });
    if (shared) return;
    const local = (await chrome.storage.local.get(STORE_KEY))[STORE_KEY] || {};
    local.users = { ...local.users, [user]: pick(state, SETTINGS) };
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
    await session.area.remove(CACHE_KEY);
    await chrome.storage.local.remove('insisPlusBootTheme');
    const local = (await chrome.storage.local.get(STORE_KEY))[STORE_KEY] || {};
    await chrome.storage.local.set({ [STORE_KEY]: { shared: local.shared, sharedAsked: local.sharedAsked, users: {} } });
  }

  // Pick up data stored elsewhere (background sync, other tabs) and tell the page.
  chrome.storage.onChanged?.addListener((changes, area) => {
    const change = changes[session?.key];
    if (!change || area !== session.name) return;
    if (!change.newValue) {
      // Wiped (logout elsewhere, idle timer): forget it here too.
      for (const k of personalKeys(state)) delete state[k];
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
      // Search offers only links the mapping allows InSIS+ to show (nav.js): no action links, no menu switches.
      const nav = globalThis.insisPlus?.nav;
      if (nav && !nav.allowed(a.href, 'link', { copied: true })) continue;

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

  // ---------- theme (InSIS+ settings: system / light / dark) ----------
  // An explicit choice is an attribute: on <html> for InSIS's own content (generic.css), and data-theme on every
  // InSIS+ shadow host (marked data-ipx-host), whose stylesheets read it with :host([data-theme]).
  const BOOT_THEME_KEY = 'insisPlusBootTheme';
  let lastBootTheme = null;
  function applyTheme() {
    const theme = state.plus?.theme;
    const explicit = theme === 'light' || theme === 'dark' ? theme : null;
    if (explicit) document.documentElement.dataset.ipxTheme = explicit;
    else delete document.documentElement.dataset.ipxTheme;
    for (const el of document.querySelectorAll('[data-ipx-host]')) {
      if (explicit) el.dataset.theme = explicit;
      else delete el.dataset.theme;
    }
    globalThis.__ipxBootTheme?.(theme); // the first-frame skeleton (boot.js) in the same colours
    // The next page's first frame (boot.js) runs before the student is known, so it cannot read this student's
    // settings: the last appearance used on this device is kept apart, as one word (light / dark / system).
    const boot = explicit || 'system';
    // Shared computer mode keeps nothing between sessions, this word included.
    if (boot !== lastBootTheme) {
      lastBootTheme = boot;
      try { if (shared) chrome.storage.local.remove(BOOT_THEME_KEY); else chrome.storage.local.set({ [BOOT_THEME_KEY]: boot }); } catch {}
    }
    globalThis.insisPlus?.ui?.syncTheme?.(); // the top bar's light/dark button
  }
  function setTheme(theme) {
    state.plus = { ...state.plus, theme };
    applyTheme();
    return save();
  }

  const host = document.createElement('div');
  host.dataset.ipxHost = '';
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

  // Marks for measuring InSIS+'s own cost (Performance panel; nothing is sent anywhere).
  performance.mark('insis-plus:start');
  const ready = load().then(() => {
    performance.mark('insis-plus:ready');
    // Once every module has had its turn on this page: if none drew an InSIS+ page, the skeleton of the first frame
    // (boot.js) gives way to InSIS's own page.
    setTimeout(() => globalThis.__ipxBootDone?.(), 0);
    watchActivity();
    applyTheme();
    indexPage();
    save();
    document.body.append(host);
  });

  // Shared with ui.js, sync.js and the page modules (same content-script world).
  globalThis.insisPlus = {
    cache,
    ready,
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
    setTheme,
    applyTheme,
    open,
    setFab: (visible) => {
      fab.hidden = !visible;
    },
  };
})();
