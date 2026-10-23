// InSIS+ — command palette (Ctrl+K) over every InSIS page you have seen.
// Data never leaves the browser: links are indexed from pages you open and kept in chrome.storage.local.
(() => {
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

  // ---------- storage ----------

  let state = { links: {}, fav: [] };

  async function load() {
    const data = await chrome.storage.local.get(STORE_KEY);
    state = Object.assign({ links: {}, fav: [] }, data[STORE_KEY]);
  }

  function save() {
    const keys = Object.keys(state.links);
    if (keys.length > MAX_LINKS) {
      const favs = new Set(state.fav);
      keys
        .filter((k) => !favs.has(k))
        .sort((a, b) => (state.links[a].v - state.links[b].v) || (state.links[a].s - state.links[b].s))
        .slice(0, keys.length - MAX_LINKS)
        .forEach((k) => delete state.links[k]);
    }
    return chrome.storage.local.set({ [STORE_KEY]: state });
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
    indexPage();
    save();
    document.body.append(host);
  });

  // Shared with home.js (same content-script world).
  globalThis.insisPlus = {
    ready,
    lang,
    clean,
    norm,
    get state() {
      return state;
    },
    save,
    open,
    setFab: (visible) => {
      fab.hidden = !visible;
    },
  };
})();
