// InSIS+ — "this page is watching": the half that runs in InSIS's own page world (manifest: world MAIN,
// document_start), before any of InSIS's scripts. Only from in here can InSIS+ see what the page's scripts ask the
// browser to tell them: listeners for copying, cutting, pasting, the context menu, selecting, leaving the tab or
// window, clipboard shortcuts; reading or rewriting the clipboard; and requests sent right after such a moment.
// It changes nothing the page does: every listener still runs, every request still goes out. It only reports, as
// plain text, to watch.js (InSIS+'s own world), which shows the warning. Nothing leaves the browser.
(() => {
  if (window.top !== window) return;

  const CHANNEL = 'insis-plus-watch';
  const HOST_ID = 'insis-plus-watch'; // watch.js's own widget: what happens there is InSIS+'s, never the page's
  const send = (msg) => {
    try { document.dispatchEvent(new CustomEvent(CHANNEL, { detail: JSON.stringify(msg) })); } catch {}
  };

  // Which events mean what. "leave" only counts on the window (a field's blur is just form checking); key listeners
  // are everywhere (menus, shortcuts), so they only count once one of them reacts to a clipboard or source shortcut
  // (see begin below).
  const KIND = {
    copy: 'copy', cut: 'copy', beforecopy: 'copy', beforecut: 'copy',
    paste: 'paste', beforepaste: 'paste',
    contextmenu: 'menu',
    selectstart: 'select',
    blur: 'leave', focus: 'leave', visibilitychange: 'leave', pagehide: 'leave',
    keydown: 'keys', keyup: 'keys', keypress: 'keys',
  };

  // Where a listener comes from: the first script on the stack that is not jQuery (jQuery only passes the page's
  // handler on) and not InSIS+ itself. Google Analytics, on every InSIS page, listens for leaving the tab to measure
  // time on page; that is not InSIS watching the student, so it is left out.
  // InSIS+'s own frames: extension URLs; on the local test pages (test/), the repository's scripts served next to them.
  const self = document.currentScript?.src || '';
  const ownBase = self ? self.slice(0, self.lastIndexOf('/') + 1) : '';
  const pageUrl = () => location.href.split('#')[0];
  // null: only InSIS+'s own code on the stack (its listeners are none of the page's business).
  function source() {
    // jQuery's .on() is deep: the page's own frame is often below the default 10 lines of a stack (V8).
    const limit = Error.stackTraceLimit;
    try { Error.stackTraceLimit = 40; } catch {}
    const stack = new Error().stack || '';
    try { Error.stackTraceLimit = limit; } catch {}
    const urls = stack.match(/(?:https?|chrome-extension|moz-extension):\/\/[^\s)]+?(?=:\d+:\d+)/g) || [];
    let lib = null;
    let other = false;
    for (const u of urls) {
      if (/^(chrome|moz)-extension:/.test(u) || (ownBase && u.startsWith(ownBase) && !u.startsWith(ownBase + 'test/'))) continue;
      other = true;
      if (/\/jquery[^/]*\.js|jquery[.-][\d.]+|jquery-ui|jquery-migrate/i.test(u)) { lib ||= u; continue; }
      return u;
    }
    return lib || (other || !urls.length ? '' : null);
  }
  const ignorable = (src) => !!src && /googletagmanager\.com|google-analytics\.com|gtag\/js/.test(src);
  const label = (src) => {
    if (!src) return '';
    if (src.split('#')[0] === pageUrl()) return 'inline';
    try { const u = new URL(src); return u.host === location.host ? u.pathname : u.host + u.pathname; } catch { return src; }
  };
  const where = (t) => (t === window ? 'window' : t === document ? 'document' : t === document.body ? 'body' : (t?.nodeName || '').toLowerCase());

  // ---- the moment of an event: who heard it, what they did ----
  // A watched event is followed from the first listener (ours, registered before the page's) to the end of its
  // dispatch: which page handlers ran, whether one cancelled it, read the selection or the pasted text, or rewrote
  // what goes to the clipboard.
  let current = null;
  const ran = (type, src) => {
    if (current && current.type === type) { current.ran = true; if (src) current.src ||= label(src); }
  };

  const wrappers = new WeakMap(); // page listener -> Map(type|capture -> wrapper)
  const keyOf = (type, opts) => type + '|' + !!(typeof opts === 'boolean' ? opts : opts?.capture);
  const add = EventTarget.prototype.addEventListener;
  const remove = EventTarget.prototype.removeEventListener;
  // Leaving: focus and blur only on the window itself (on the document they are every field's focus, which jQuery
  // listens for on every page); visibilitychange on the document or the window.
  // Selecting: only on the document, the window or the body; on an element it is a drag widget keeping text from
  // being selected while dragging (InSIS's movable menu boxes, menitka.js).
  const top = (t) => t === window || t === document || t === document.body;
  const watched = (target, type) => !!KIND[type] && (KIND[type] !== 'leave' || target === window ||
    (type === 'visibilitychange' && target === document)) && (KIND[type] !== 'select' || top(target));
  // A press of the mouse button listened to on the whole page (see the selection check at the end).
  let pageMouse = false;

  EventTarget.prototype.addEventListener = function (type, fn, opts) {
    if (type === 'mousedown' && !pageMouse && top(this) && source() !== null) pageMouse = true;
    if (!fn || !watched(this, type) || (typeof fn !== 'function' && typeof fn?.handleEvent !== 'function')) {
      return add.call(this, type, fn, opts);
    }
    const src = source();
    if (src === null) return add.call(this, type, fn, opts);
    // Key listeners are only told about once one reacts to a shortcut (begin below).
    if (!ignorable(src) && KIND[type] !== 'keys') send({ m: 'listen', type, kind: KIND[type], on: where(this), src: label(src) });
    let map = wrappers.get(fn);
    if (!map) wrappers.set(fn, (map = new Map()));
    const k = keyOf(type, opts);
    let w = map.get(k);
    if (!w) {
      const quiet = ignorable(src);
      w = function (e) {
        if (!quiet) ran(e.type, src);
        return typeof fn === 'function' ? fn.call(this, e) : fn.handleEvent(e);
      };
      map.set(k, w);
    }
    return add.call(this, type, w, opts);
  };
  EventTarget.prototype.removeEventListener = function (type, fn, opts) {
    const w = fn && wrappers.get(fn)?.get(keyOf(type, opts));
    return remove.call(this, type, w || fn, opts);
  };
  // The page sees its own functions.
  for (const [name, f] of [['addEventListener', add], ['removeEventListener', remove]]) {
    try { Object.defineProperty(EventTarget.prototype[name], 'toString', { value: () => f.toString() }); } catch {}
  }

  // Handlers given as properties (document.oncopy = …) or as attributes (<body oncopy="…">) skip addEventListener.
  // Properties are noticed when set; attributes when the page is parsed and when the event comes.
  // (The window's own handlers live on the window itself in some browsers, on Window.prototype in others.)
  for (const proto of [Document.prototype, HTMLElement.prototype, window, Window.prototype]) {
    for (const type of Object.keys(KIND)) {
      if (KIND[type] === 'keys') continue;
      const d = Object.getOwnPropertyDescriptor(proto, 'on' + type);
      if (!d?.set || !d.configurable) continue;
      Object.defineProperty(proto, 'on' + type, {
        ...d,
        set(v) {
          const src = typeof v === 'function' && watched(this, type) ? source() : null;
          if (src !== null && !ignorable(src)) send({ m: 'listen', type, kind: KIND[type], on: where(this), src: label(src), prop: true });
          return d.set.call(this, v);
        },
      });
    }
  }
  const ATTRS = Object.keys(KIND).filter((t) => KIND[t] !== 'keys' && KIND[t] !== 'leave').map((t) => 'on' + t);
  function scanAttributes() {
    const sel = ATTRS.map((a) => `[${a}]`).join(',');
    const seen = new Set();
    for (const el of document.querySelectorAll(sel)) {
      for (const a of ATTRS) {
        if (!el.hasAttribute(a)) continue;
        const blocks = /return\s+false|preventDefault/.test(el.getAttribute(a));
        // On an element, selecting only counts when it is plainly blocked there (oncopy etc. always count).
        if (a === 'onselectstart' && el !== document.body && !blocks) continue;
        const k = where(el) + a;
        if (seen.has(k)) continue;
        seen.add(k);
        send({ m: 'listen', type: a.slice(2), kind: KIND[a.slice(2)], on: where(el), src: 'inline', attr: true, blocks });
      }
    }
    // <body onblur> / onfocus / onvisibilitychange stand for the window.
    for (const a of ['onblur', 'onfocus']) if (document.body?.hasAttribute(a)) send({ m: 'listen', type: a.slice(2), kind: 'leave', on: 'window', src: 'inline', attr: true });
  }
  document.addEventListener('DOMContentLoaded', scanAttributes, { once: true });

  // A handler given as a property or an attribute on the event's path has run once the dispatch is over.
  // (The path is taken when the event starts: after the dispatch it is empty.)
  function propHandlers(e, path) {
    return path.some((n) => { try { return typeof n['on' + e.type] === 'function'; } catch { return false; } });
  }

  // Reading or rewriting the clipboard while the page handles a copy or a paste.
  const wrap = (obj, name, fn) => {
    const orig = obj?.[name];
    if (typeof orig !== 'function') return;
    obj[name] = function (...args) { try { fn(this, args); } catch {} return orig.apply(this, args); };
    try { Object.defineProperty(obj[name], 'toString', { value: () => orig.toString() }); } catch {}
  };
  wrap(Selection.prototype, 'toString', () => { if (current && /copy|cut/.test(current.type)) current.read = true; });
  wrap(DataTransfer.prototype, 'getData', () => { if (current?.type === 'paste') current.read = true; });
  wrap(DataTransfer.prototype, 'setData', () => { if (current && /copy|cut/.test(current.type)) current.rewrote = true; });
  if (window.Clipboard) {
    const clip = (op) => () => { const src = source(); if (src !== null) send({ m: 'clipboard', op, src: label(src) }); };
    for (const name of ['readText', 'read']) wrap(Clipboard.prototype, name, clip('read'));
    for (const name of ['writeText', 'write']) wrap(Clipboard.prototype, name, clip('write'));
  }

  // Requests that start right after a watched moment (when a page handler heard it) are probably its report.
  // A moment is in `recent` from its start; its requests wait in `reqs` until its dispatch is over and it is known
  // whether a page handler heard it (a quick request can be timed before that).
  const recent = []; // { name, at, done, heard, reqs }
  const REPORT_WINDOW = 2500;
  const sendRequest = (moment, req) => send({ m: 'request', for: moment.name, ...req });
  function noteRequest(url, how, at, own = false) {
    if (own) return; // InSIS+'s own requests (only on test pages, where it shares the page's world)
    let to = String(url || '');
    try { const u = new URL(to, document.baseURI); if (/^(chrome|moz)-extension:/.test(u.protocol) || ignorable(u.href)) return; to = (u.host === location.host ? '' : u.host) + u.pathname; } catch {}
    // The latest watched moment before the request (a Ctrl+C is followed by its copy event: the copy wins).
    const hit = recent.filter((x) => at >= x.at - 5 && at - x.at <= REPORT_WINDOW).pop();
    if (!hit) return;
    const req = { to, how };
    if (!hit.done) hit.reqs.push(req);
    else if (hit.heard) sendRequest(hit, req);
  }
  // Scripts' own requests are noted when they are made (a request that fails never reaches the timing list);
  // images and the rest come from the browser's timing list. Nothing is intercepted or slowed down.
  wrap(window, 'fetch', (_, [input]) => noteRequest(input?.url || input, 'fetch', performance.now(), source() === null));
  wrap(Navigator.prototype, 'sendBeacon', (_, [url]) => noteRequest(url, 'beacon', performance.now(), source() === null));
  const xhrUrl = new WeakMap();
  wrap(XMLHttpRequest.prototype, 'open', (xhr, [, url]) => xhrUrl.set(xhr, url));
  wrap(XMLHttpRequest.prototype, 'send', (xhr) => noteRequest(xhrUrl.get(xhr), 'xhr', performance.now(), source() === null));
  try {
    new PerformanceObserver((list) => {
      for (const r of list.getEntries()) {
        if (/img|other|ping|image/.test(r.initiatorType) && !/\.(css|woff2?|ttf|svg)(\?|$)/.test(r.name)) noteRequest(r.name, r.initiatorType, r.startTime);
      }
    }).observe({ type: 'resource', buffered: false });
  } catch {}

  // Our own first listeners, before the page has any.
  const SHORTCUT = (e) => ((e.ctrlKey || e.metaKey) && /^[cvxuas]$/i.test(e.key)) || e.key === 'F12' || e.key === 'PrintScreen';
  function begin(e) {
    if (!e.isTrusted || e.target?.id === HOST_ID) return; // InSIS+'s widget, or a script's own event
    if (KIND[e.type] === 'keys' && !SHORTCUT(e)) return;
    if (KIND[e.type] === 'leave' && !(e.target === window || (e.type === 'visibilitychange' && e.target === document))) return;
    const key = KIND[e.type] === 'keys' ? (e.ctrlKey || e.metaKey ? 'Ctrl+' : '') + e.key.toUpperCase() : '';
    const c = (current = { type: e.type, ran: false, read: false, rewrote: false, src: '', path: e.composedPath ? e.composedPath() : [] });
    const moment = { name: key || e.type, at: performance.now(), done: false, heard: false, reqs: [] };
    recent.push(moment);
    if (recent.length > 20) recent.shift();
    // After every listener has had the event (the page's included).
    setTimeout(() => {
      if (current === c) current = null;
      moment.done = true;
      moment.heard = c.ran || (KIND[e.type] !== 'keys' && propHandlers(e, c.path));
      if (!moment.heard) { const i = recent.indexOf(moment); if (i >= 0) recent.splice(i, 1); return; }
      // Menus and shortcuts listen to every key: a key listener that ran only counts if it cancelled the shortcut
      // or sent something right after it.
      if (KIND[e.type] !== 'keys' || e.defaultPrevented) {
        send({ m: 'event', type: e.type, kind: KIND[e.type], key, blocked: e.defaultPrevented, read: c.read, rewrote: c.rewrote, src: c.src });
      }
      moment.reqs.splice(0).forEach((req) => sendRequest(moment, req));
    }, 0);
  }
  // Selecting can also be stopped by cancelling the mouse button on text (InSIS's online tests do that, from the
  // document): told when the page listens to the button on the whole page and cancelled a press on plain text,
  // never for buttons, links, fields or a drag widget's own handle.
  add.call(window, 'mousedown', (e) => {
    if (!pageMouse || !e.isTrusted || e.button !== 0 || e.target?.id === HOST_ID) return;
    const t = e.target;
    setTimeout(() => {
      if (!e.defaultPrevented || !(t instanceof Element) || t.closest('a, button, input, select, textarea, label, img, [draggable="true"], [role], [contenteditable], [id^="insis-plus"]')) return;
      if (!(t.textContent || '').trim()) return;
      send({ m: 'event', type: 'mousedown', kind: 'select', key: '', blocked: true, read: false, rewrote: false, src: '' });
    }, 0);
  }, true);
  for (const type of Object.keys(KIND)) add.call(window, type, begin, true);
  add.call(document, 'visibilitychange', begin, true); // fired at the document, never reaches the window
})();
