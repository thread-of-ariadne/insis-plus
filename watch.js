// InSIS+ — "this page is watching", and a quiet copy of the page's code. Runs in InSIS+'s own world at
// document_start, on every InSIS page, in classic view and in the InSIS+ view alike.
//
// 1. Warning. watch-main.js (in the page's world) tells this script which of InSIS's scripts listen for copying,
//    pasting, the context menu, selecting, leaving the window or clipboard shortcuts, and what they did when it
//    happened (noticed it, blocked it, read the text, rewrote the clipboard, sent a request right after). A small
//    amber chip says so; its panel lists who listens and a log of what the page caught.
// 2. Copy page code. The page's HTML as InSIS sent it (taken when it was parsed, before InSIS+ changed anything)
//    goes to the clipboard through the Clipboard API, which fires no copy event, so the page's copy listeners never
//    run. The widget lives in a closed shadow root, and its clicks, keys and focus are stopped at the window by the
//    first listener on the page (this one), before any of InSIS's own: the page never learns the button was used.
//
// Nothing is blocked on the page and nothing is sent anywhere.
(() => {
  if (window.top !== window) return;
  const CHANNEL = 'insis-plus-watch';

  // ---------- the widget's events stay InSIS+'s ----------
  const host = document.createElement('div');
  host.id = 'insis-plus-watch';
  host.dataset.ipxHost = '';
  const root = host.attachShadow({ mode: 'closed' });
  const GUARDED = ['click', 'dblclick', 'auxclick', 'contextmenu', 'mousedown', 'mouseup', 'mousemove', 'mouseover', 'mouseout',
    'mouseenter', 'mouseleave', 'pointerdown', 'pointerup', 'pointermove', 'pointerover', 'pointerout', 'pointerenter',
    'pointerleave', 'pointercancel', 'touchstart', 'touchmove', 'touchend', 'wheel', 'keydown', 'keyup', 'keypress',
    'focus', 'blur', 'focusin', 'focusout', 'input', 'beforeinput', 'copy', 'cut', 'paste', 'selectstart', 'dragstart'];
  // The element under the pointer, or the focused one for the keyboard (the closed root's own view of itself).
  const inner = (e) => (e.detail === 0 || e.clientX === undefined ? root.activeElement : root.elementFromPoint?.(e.clientX, e.clientY)) || null;
  function guard(e) {
    if (e.target !== host) return;
    e.stopImmediatePropagation();
    if (e.type === 'mousedown' || e.type === 'pointerdown') {
      // Focus and the page's text selection stay where they were (so the page sees no focus change either).
      e.preventDefault();
    } else if (e.type === 'click') {
      const btn = inner(e)?.closest?.('[data-act]');
      if (btn) act(btn.dataset.act);
    } else if (e.type === 'keydown' && e.key === 'Escape') {
      setOpen(false);
    }
  }
  for (const type of GUARDED) addEventListener(type, guard, true);

  // ---------- what watch-main.js reports ----------
  const kinds = new Map(); // kind -> [{ type, on, src, blocks }]
  const log = []; // { at, type, kind, key, blocked, read, rewrote, src, to: [] }
  let unseen = 0;
  document.addEventListener(CHANNEL, (e) => {
    let m;
    try { m = JSON.parse(e.detail); } catch { return; }
    if (!m || typeof m !== 'object') return;
    if (m.m === 'listen') note(m.kind, m);
    else if (m.m === 'clipboard') {
      note('clipboard', { type: m.op, src: m.src });
      if (m.op === 'read') caught({ type: 'clipboard-read', kind: 'clipboard', src: m.src });
    } else if (m.m === 'event') {
      note(m.kind, { type: m.type, on: '', src: m.src || '', blocks: !!m.blocked && m.kind !== 'keys' });
      caught(m);
    } else if (m.m === 'request') {
      const last = log.findLast((x) => (x.key || x.type) === m.for && Date.now() - x.at < 4000);
      if (last) { if (!last.to.includes(m.to)) last.to.push(m.to); }
      else if (/\+|F12/.test(m.for)) { note('keys', { type: 'keydown', src: '' }); caught({ type: 'keydown', kind: 'keys', key: m.for, to: [m.to] }); return; }
      else return;
      refresh(last);
    }
  });
  const KINDS = ['copy', 'paste', 'menu', 'select', 'leave', 'keys', 'clipboard'];
  function note(kind, item) {
    if (!KINDS.includes(kind)) return;
    const list = kinds.get(kind) || [];
    const same = list.find((x) => x.type === item.type && (x.src === item.src || !item.src) && (x.on === item.on || !item.on));
    if (!same) list.push(item);
    else if (item.blocks && !same.blocks) { same.blocks = true; if (kinds.has(kind)) draw(); }
    const fresh = !kinds.has(kind);
    kinds.set(kind, list);
    if (fresh) draw();
  }
  // Selecting and coming back to the window happen all the time: logged, never popped up.
  const QUIET = new Set(['selectstart', 'focus', 'mousedown']);
  function caught(m) {
    // The same moment again (a drag fires selectstart many times): one line, counted.
    const last = log.at(-1);
    if (last && last.type === m.type && last.key === m.key && !!last.blocked === !!m.blocked && !!last.read === !!m.read &&
        !!last.rewrote === !!m.rewrote && !m.to?.length && Date.now() - last.at < 15000) {
      last.n = (last.n || 1) + 1;
      last.at = Date.now();
      draw();
      return;
    }
    const entry = { at: Date.now(), to: [], ...m };
    entry.to = [...(m.to || [])];
    log.push(entry);
    if (log.length > 50) log.shift();
    if (!QUIET.has(m.type)) { unseen++; toast(entry); }
    draw();
  }
  // A quiet moment the page then reported (it sent a request about you coming back) is worth a word after all.
  function refresh(entry) {
    if (toastEntry === entry || QUIET.has(entry.type)) toast(entry);
    else draw();
  }

  // ---------- the page's code, as InSIS sent it ----------
  let snapshot = '';
  const serialize = (docEl) => {
    const dt = document.doctype;
    const doctype = dt ? `<!DOCTYPE ${dt.name}${dt.publicId ? ` PUBLIC "${dt.publicId}"` : ''}${dt.systemId ? ` "${dt.systemId}"` : ''}>\n` : '';
    const copy = docEl.cloneNode(true);
    // InSIS+'s own: the first-frame skeleton and its style, its shadow hosts and page.
    copy.querySelectorAll('#insis-plus-boot, style#insis-plus-boot, [data-ipx-host], #insis-plus-page, #insis-plus-root, [id^="insis-plus"]').forEach((n) => n.remove());
    copy.classList.remove('ipx-boot', 'ipx-boot-dark', 'ipx-boot-pending', 'ipx-takeover', 'ipx-generic', 'ipx-keep');
    if (!copy.classList.length) copy.removeAttribute('class');
    copy.removeAttribute('data-ipx-theme');
    return doctype + copy.outerHTML;
  };
  document.addEventListener('DOMContentLoaded', () => { try { snapshot = serialize(document.documentElement); } catch {} }, { once: true });

  async function copyCode() {
    const code = snapshot || serialize(document.documentElement);
    let ok = false;
    try { await navigator.clipboard.writeText(code); ok = true; } catch {}
    if (!ok) {
      // Older browsers: a copy command inside the closed root. Its copy event is stopped by guard() above
      // before the page's listeners.
      const prev = root.activeElement;
      const ta = Object.assign(document.createElement('textarea'), { value: code });
      ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none;';
      root.append(ta);
      ta.select();
      try { ok = document.execCommand('copy'); } catch {}
      ta.remove();
      prev?.focus({ preventScroll: true });
    }
    flash(ok ? T.copied(Math.max(1, Math.round(new Blob([code]).size / 1024))) : T.copyFailed, ok ? 'ok' : 'bad');
  }

  // ---------- texts ----------
  let T;
  const texts = (cs) => (cs ? {
    code: 'Kopírovat kód stránky', codeHint: 'Kód stránky, jak ho InSIS poslal. Bez události kopírování: skripty stránky to nevidí.',
    copied: (kb) => `Kód stránky zkopírován (${kb} kB). Stránka o tom neví.`, copyFailed: 'Kód se nepodařilo zkopírovat.',
    watches: 'Stránka sleduje', title: 'Tato stránka sleduje, co děláte', close: 'Zavřít',
    intro: 'Skripty InSIS na této stránce dostanou zprávu, když:',
    kind: { copy: 'kopírujete nebo vyjímáte text', paste: 'vkládáte text', menu: 'otevřete místní nabídku (pravé tlačítko)',
      select: 'začnete označovat text', leave: 'přepnete na jinou kartu nebo okno', keys: 'stisknete klávesovou zkratku (Ctrl+C, Ctrl+V…)',
      clipboard: '' },
    clip: { read: 'Stránka sama čte vaši schránku.', write: 'Stránka sama zapisuje do vaší schránky.', both: 'Stránka sama čte vaši schránku a zapisuje do ní.' },
    short: { copy: 'kopírování', paste: 'vkládání', menu: 'pravé tlačítko', select: 'označování', leave: 'opuštění okna', keys: 'zkratky', clipboard: 'schránku' },
    inline: 'skript přímo ve stránce', blocks: 'blokuje', caughtTitle: 'Co stránka zachytila',
    did: { copy: 'Zkopírovali jste text', cut: 'Vyjmuli jste text', paste: 'Vložili jste text', contextmenu: 'Otevřeli jste místní nabídku',
      selectstart: 'Začali jste označovat text', mousedown: 'Zkusili jste označit text', blur: 'Opustili jste okno', focus: 'Vrátili jste se do okna', visibilitychange: 'Přepnuli jste kartu',
      pagehide: 'Opouštíte stránku', 'clipboard-read': 'Stránka se pokusila číst vaši schránku', keydown: 'Stiskli jste', keyup: 'Stiskli jste', keypress: 'Stiskli jste',
      beforecopy: 'Kopírujete text', beforecut: 'Vyjímáte text', beforepaste: 'Vkládáte text' },
    noticed: 'stránka to zaznamenala', blocked: 'zablokovala to', read: 'přečetla text', rewrote: 'změnila, co se zkopíruje',
    sent: 'odeslala požadavek', nothingYet: 'Zatím nic.',
    note: 'InSIS+ nic neblokuje ani neodesílá, jen ukazuje, co dělají skripty stránky.',
  } : {
    code: 'Copy page code', codeHint: 'The page code as InSIS sent it. No copy event: the page’s scripts can’t see it.',
    copied: (kb) => `Page code copied (${kb} kB). The page wasn’t told.`, copyFailed: 'The code could not be copied.',
    watches: 'This page watches', title: 'This page watches what you do', close: 'Close',
    intro: 'InSIS’s scripts on this page are told when you:',
    kind: { copy: 'copy or cut text', paste: 'paste text', menu: 'open the context menu (right-click)', select: 'start selecting text',
      leave: 'switch to another tab or window', keys: 'press a shortcut (Ctrl+C, Ctrl+V…)', clipboard: '' },
    clip: { read: 'The page itself reads your clipboard.', write: 'The page itself writes to your clipboard.', both: 'The page itself reads and writes your clipboard.' },
    short: { copy: 'copying', paste: 'pasting', menu: 'right-click', select: 'selecting', leave: 'leaving the window', keys: 'shortcuts', clipboard: 'clipboard' },
    inline: 'a script inside the page', blocks: 'blocks it', caughtTitle: 'What the page caught',
    did: { copy: 'You copied text', cut: 'You cut text', paste: 'You pasted text', contextmenu: 'You opened the context menu',
      selectstart: 'You started selecting text', mousedown: 'You tried to select text', blur: 'You left the window', focus: 'You came back to the window', visibilitychange: 'You switched tabs',
      pagehide: 'You are leaving the page', 'clipboard-read': 'The page tried to read your clipboard', keydown: 'You pressed', keyup: 'You pressed', keypress: 'You pressed',
      beforecopy: 'You are copying text', beforecut: 'You are cutting text', beforepaste: 'You are pasting text' },
    noticed: 'the page noticed', blocked: 'blocked it', read: 'read the text', rewrote: 'changed what goes to the clipboard',
    sent: 'sent a request', nothingYet: 'Nothing yet.',
    note: 'InSIS+ blocks nothing and sends nothing; it only shows what the page’s scripts do.',
  });
  function language() {
    // As content.js: InSIS's language switch offers the other language (a Czech page links to ENGLISH).
    const sw = document.getElementById('vlajky');
    if (sw) return /ENGLISH/i.test(sw.textContent);
    if (/[?;&]lang=en\b/.test(location.search)) return false;
    return /^cs/i.test(document.documentElement.lang) || /[?;&]lang=cz\b/.test(location.search) ||
      /Přihlášen|Osobní administrativa/.test((document.body?.innerText || '').slice(0, 3000));
  }

  // ---------- the widget ----------
  const ICON = {
    code: '<path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
  };
  const svg = (name) => `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name]}</svg>`;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  root.innerHTML = `<style>
    :host { --bg: #ffffff; --fg: #10131f; --muted: #6b7286; --line: #e6e8ee; --hover: rgba(16,19,31,.05);
      --accent: #2f45d1; --accent-ink: #fff; --warn: #8a4b00; --warn-soft: #fff3dc; --warn-line: #f3d9a4; --ok: #15803d; --bad: #c62828;
      all: initial; position: fixed; right: 16px; bottom: 68px; z-index: 2147483646;
      font: 13px/1.45 "Figtree", system-ui, -apple-system, "Segoe UI", sans-serif; color: var(--fg); }
    :host([data-view="plus"]) { bottom: 16px; }
    /* InSIS+ on a phone has its bottom bar there (shared.css .bottom-bar). */
    @media (max-width: 900px) { :host([data-view="plus"]) { bottom: calc(76px + env(safe-area-inset-bottom, 0px)); } }
    @media (prefers-color-scheme: dark) { :host(:not([data-theme="light"])) { --bg: #1b1f2a; --fg: #eceef4; --muted: #9aa1b2; --line: #2b3040;
      --hover: rgba(255,255,255,.06); --accent: #8d9cff; --accent-ink: #0c0e13; --warn: #fbbf24; --warn-soft: #33270f; --warn-line: #5a4415; --ok: #4ade80; --bad: #f87171; } }
    :host([data-theme="dark"]) { --bg: #1b1f2a; --fg: #eceef4; --muted: #9aa1b2; --line: #2b3040; --hover: rgba(255,255,255,.06);
      --accent: #8d9cff; --accent-ink: #0c0e13; --warn: #fbbf24; --warn-soft: #33270f; --warn-line: #5a4415; --ok: #4ade80; --bad: #f87171; }
    * { box-sizing: border-box; }
    .wrap { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
    button { font: inherit; color: inherit; cursor: pointer; }
    .bar { display: flex; gap: 6px; align-items: center; }
    .pop:empty { display: none; }
    .icon { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 999px; border: 1px solid var(--line);
      background: var(--bg); color: var(--muted); box-shadow: 0 4px 14px rgba(0,0,0,.12); opacity: .7; padding: 0; }
    .icon:hover, .icon:focus-visible { opacity: 1; color: var(--fg); }
    .chip { display: flex; align-items: center; gap: 7px; height: 34px; padding: 0 12px 0 10px; border-radius: 999px;
      border: 1px solid var(--warn-line); background: var(--warn-soft); color: var(--warn); font-weight: 600;
      box-shadow: 0 4px 14px rgba(0,0,0,.12); max-width: min(420px, calc(100vw - 80px)); }
    .chip span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .chip b { display: grid; place-items: center; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9px; background: var(--warn); color: var(--warn-soft); font-size: 11px; }
    .chip.pulse { animation: pulse .9s ease-out 2; }
    @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(212,140,20,.55); } 100% { box-shadow: 0 0 0 12px rgba(212,140,20,0); } }
    @media (prefers-reduced-motion: reduce) { .chip.pulse { animation: none; } }
    button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    .bubble, .panel { background: var(--bg); border: 1px solid var(--line); border-radius: 14px; box-shadow: 0 16px 40px -12px rgba(0,0,0,.35); }
    .bubble { max-width: min(360px, calc(100vw - 32px)); padding: 9px 12px; }
    .bubble.warn { border-color: var(--warn-line); }
    .bubble.ok, .flash.ok { color: var(--ok); } .bubble.bad, .flash.bad { color: var(--bad); }
    .flash { margin-top: 8px; font-weight: 600; }
    .bubble small, .panel small { display: block; color: var(--muted); font-size: 12px; }
    .panel { width: min(380px, calc(100vw - 32px)); max-height: min(70vh, 560px); overflow: auto; padding: 14px 16px 16px; }
    .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 6px; }
    h2 { margin: 0; font-size: 15px; line-height: 1.3; }
    h3 { margin: 14px 0 6px; font-size: 12px; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); }
    .x { border: 0; background: none; padding: 4px; border-radius: 6px; color: var(--muted); display: grid; }
    .x:hover { background: var(--hover); color: var(--fg); }
    p { margin: 4px 0; }
    ul { margin: 6px 0 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 6px; }
    li { padding-left: 12px; position: relative; }
    li::before { content: ""; position: absolute; left: 0; top: .6em; width: 5px; height: 5px; border-radius: 50%; background: var(--warn); }
    .log li::before { background: var(--muted); }
    .tag { display: inline-block; margin-left: 4px; padding: 0 6px; border-radius: 6px; background: var(--warn-soft); color: var(--warn); font-size: 11px; font-weight: 600; }
    code { font: 11.5px ui-monospace, Consolas, monospace; overflow-wrap: anywhere; }
    .primary { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; margin-top: 14px; padding: 9px 12px;
      border: 0; border-radius: 10px; background: var(--accent); color: var(--accent-ink); font-weight: 600; }
    .hint { margin-top: 6px; }
    .clip { margin-top: 8px; color: var(--warn); font-weight: 600; }
    .note { margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--line); }
    [hidden] { display: none !important; }
  </style><div class="wrap"></div>`;
  const wrap = root.querySelector('.wrap');
  const popEl = wrap.appendChild(document.createElement('div'));
  popEl.className = 'pop';
  const barEl = wrap.appendChild(document.createElement('div'));
  barEl.className = 'bar';
  let popHtml = '';
  let chipHtml = '';

  let open = false;
  let flashMsg = null; // { text, tone }
  let toastEntry = null;
  let timer = 0;
  const setOpen = (on) => { open = on; if (on) { unseen = 0; toastEntry = null; flashMsg = null; } draw(); };
  function act(what) {
    if (what === 'code') copyCode();
    else if (what === 'toggle') setOpen(!open);
    else if (what === 'close') setOpen(false);
  }
  function flash(text, tone) {
    flashMsg = { text, tone };
    toastEntry = null;
    clearTimeout(timer);
    timer = setTimeout(() => { flashMsg = null; draw(); }, 4000);
    draw();
  }
  function toast(entry) {
    if (open) { draw(); return; }
    toastEntry = entry;
    flashMsg = null;
    clearTimeout(timer);
    timer = setTimeout(() => { toastEntry = null; draw(); }, 7000);
    pulse = true;
    draw();
  }
  let pulse = false;

  const what = (e) => {
    const head = T.did[e.type] ? T.did[e.type] + (e.key ? ' ' + e.key : '') : e.type;
    if (e.kind === 'clipboard') return esc(head);
    const parts = [T.noticed];
    if (e.rewrote) parts.push(T.rewrote);
    else if (e.blocked) parts.push(T.blocked);
    if (e.read) parts.push(T.read);
    if (e.to?.length) parts.push(`${T.sent}: ${e.to.map((t) => `<code>${esc(t)}</code>`).join(', ')}`);
    return `${esc(head)} — ${parts.join(', ')}`;
  };
  const time = (at) => new Date(at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const srcText = (s) => (s === 'inline' ? T.inline : s ? `<code>${esc(s)}</code>` : '');

  function clipNote() {
    const ops = new Set((kinds.get('clipboard') || []).map((x) => x.type));
    if (!ops.size) return '';
    const srcs = [...new Set(kinds.get('clipboard').map((x) => x.src).filter(Boolean))].map(srcText);
    const text = ops.size > 1 ? T.clip.both : T.clip[[...ops][0]];
    return `<p class="clip">${esc(text)}${srcs.length ? `<small>${srcs.join(', ')}</small>` : ''}</p>`;
  }

  function draw() {
    if (!T) return;
    const watched = KINDS.filter((k) => kinds.has(k));
    let pop = '';
    if (open && watched.length) {
      const items = watched.filter((k) => k !== 'clipboard').map((k) => {
        const list = kinds.get(k);
        const blocks = list.some((x) => x.blocks);
        const srcs = [...new Set(list.map((x) => x.src).filter(Boolean))].map(srcText);
        const types = [...new Set(list.map((x) => x.type))].join(', ');
        return `<li>${esc(T.kind[k])}${blocks ? `<span class="tag">${T.blocks}</span>` : ''}<small>${esc(types)}${srcs.length ? ' · ' + srcs.join(', ') : ''}</small></li>`;
      }).join('');
      const caughtList = log.slice(-12).reverse().map((e) => `<li>${what(e)}<small>${time(e.at)}${e.n > 1 ? ` · ${e.n}×` : ''}</small></li>`).join('');
      pop = `<section class="panel" role="dialog" aria-label="${esc(T.title)}">
        <div class="head"><h2>${esc(T.title)}</h2><button class="x" type="button" data-act="close" aria-label="${esc(T.close)}">${svg('x')}</button></div>
        ${items ? `<p>${esc(T.intro)}</p><ul>${items}</ul>` : ''}${clipNote()}
        <h3>${esc(T.caughtTitle)}</h3>${caughtList ? `<ul class="log">${caughtList}</ul>` : `<small>${esc(T.nothingYet)}</small>`}
        <button class="primary" type="button" data-act="code">${svg('code')}${esc(T.code)}</button>
        <small class="hint">${esc(T.codeHint)}</small>
        ${flashMsg ? `<p class="flash ${flashMsg.tone}" role="status">${esc(flashMsg.text)}</p>` : ''}
        <small class="note">${esc(T.note)}</small></section>`;
    } else if (flashMsg) {
      pop = `<div class="bubble ${flashMsg.tone}" role="status">${esc(flashMsg.text)}</div>`;
    } else if (toastEntry) {
      pop = `<div class="bubble warn" role="status">${what(toastEntry)}<small>${time(toastEntry.at)}</small></div>`;
    }
    const names = watched.map((k) => T.short[k]);
    const label = `${T.watches}: ${names.join(', ')}`;
    const chip = watched.length
      ? `<button class="chip${pulse ? ' pulse' : ''}" type="button" data-act="toggle" aria-expanded="${open}" title="${esc(label)}">${svg('eye')}<span>${esc(label)}</span>${unseen ? `<b>${unseen}</b>` : ''}</button>`
      : '';
    pulse = false;
    // Only what changed is drawn again, and keyboard focus stays on the same button.
    const focused = root.activeElement?.dataset?.act;
    const inPanel = !!root.activeElement?.closest?.('.panel');
    if (popHtml !== pop) popEl.innerHTML = popHtml = pop;
    // The chip and the icon are separate nodes: the icon keeps its node (and focus) when the chip changes.
    if (chipHtml !== chip) {
      chipHtml = chip;
      barEl.querySelector('.chip')?.remove();
      if (chip) barEl.insertAdjacentHTML('afterbegin', chip);
    }
    if (focused && !root.activeElement) root.querySelector(`${inPanel ? '.panel' : '.bar'} [data-act="${focused}"]`)?.focus({ preventScroll: true });
  }

  // InSIS+ view or classic: in classic view the Ctrl K button sits in the corner, so the widget sits above it.
  const view = () => { host.dataset.view = document.documentElement.classList.contains('ipx-takeover') ? 'plus' : 'classic'; };
  new MutationObserver(view).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('DOMContentLoaded', () => {
    T = texts(language());
    view();
    // The theme InSIS+ chose (content.js keeps every [data-ipx-host] in step later on).
    const theme = document.documentElement.dataset.ipxTheme;
    if (theme) host.dataset.theme = theme;
    // Next to <body>, not in it: InSIS+ pages hide and move what is inside the body.
    barEl.innerHTML = `<button class="icon" type="button" data-act="code" title="${esc(T.code)}" aria-label="${esc(T.code)}">${svg('code')}</button>`;
    document.documentElement.append(host);
    draw();
  }, { once: true });
})();
