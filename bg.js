// InSIS+ — background script: keeps personal data to one session (docs/ia/02-redesign.md, principle 8).
// - Opens chrome.storage.session to the content scripts, so personal data never touches the disk.
// - Where that is not available, content.js keeps it under a "volatile" local key: wiped here when the browser starts.
// - Every minute: personal data with no InSIS activity for 10 minutes is wiped, even if no InSIS tab is open.
const SESSION_KEY = 'insisPlusSession';
const VOLATILE_KEY = 'insisPlusVolatile';
const IDLE_MS = 10 * 60e3;

function openSession() {
  try {
    chrome.storage.session?.setAccessLevel?.({ accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS' });
  } catch {}
}

async function wipeIdle() {
  const now = Date.now();
  for (const [area, key] of [[chrome.storage.session, SESSION_KEY], [chrome.storage.local, VOLATILE_KEY]]) {
    if (!area) continue;
    try {
      const v = (await area.get(key))[key];
      if (v && now - (v.active || 0) > IDLE_MS) await area.remove(key);
    } catch {}
  }
}

openSession();
chrome.runtime.onInstalled.addListener(() => {
  openSession();
  chrome.storage.local.remove(VOLATILE_KEY);
});
chrome.runtime.onStartup.addListener(() => {
  openSession();
  chrome.storage.local.remove(VOLATILE_KEY);
});
chrome.alarms.create('insis-plus-idle', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'insis-plus-idle') wipeIdle();
});
