// Automatic local safety copies of the calendar data (per account, in localStorage):
//  - one "start of day" copy for each of the last 7 days (taken the first time the app loads that day)
//  - one rolling "latest" copy, refreshed at most every 15 minutes
// Used to restore after an accidental delete/edit that already synced to the cloud.

const KEY_PREFIX = 'edcalendar_autobackup_v1_';
const MAX_DAILY = 7;
const ROLLING_INTERVAL_MS = 15 * 60 * 1000;

const storageKey = (accountKey) => `${KEY_PREFIX}${accountKey}`;

function read(accountKey) {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(accountKey)) || 'null');
    if (parsed && Array.isArray(parsed.daily)) return parsed;
  } catch {
    // ignore corrupted copy
  }
  return { daily: [], latest: null };
}

function write(accountKey, store) {
  // Drop the oldest daily copies until the data fits in localStorage
  const attempt = { ...store, daily: [...store.daily] };
  for (;;) {
    try {
      localStorage.setItem(storageKey(accountKey), JSON.stringify(attempt));
      return true;
    } catch {
      if (attempt.daily.length === 0) return false;
      attempt.daily.shift();
    }
  }
}

const isMeaningful = (data) =>
  Boolean(data) && ((data.subjects || []).length > 0 || (data.slots || []).length > 0 || (data.overrides || []).length > 0);

function toLocalDate(now) {
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${m}-${d}`;
}

/** Saves the daily/rolling copies when due. Cheap to call on every data change. */
export function saveAutoBackup(accountKey, data, now = new Date()) {
  if (!accountKey || !isMeaningful(data)) return;
  const store = read(accountKey);
  const today = toLocalDate(now);
  const nowIso = now.toISOString();
  let changed = false;

  if (!store.daily.some((d) => d.date === today)) {
    store.daily.push({ date: today, savedAt: nowIso, data });
    store.daily = store.daily.sort((a, b) => a.date.localeCompare(b.date)).slice(-MAX_DAILY);
    changed = true;
  }

  const lastRolling = store.latest ? new Date(store.latest.savedAt).getTime() : 0;
  if (now.getTime() - lastRolling >= ROLLING_INTERVAL_MS) {
    store.latest = { savedAt: nowIso, data };
    changed = true;
  }

  if (changed) write(accountKey, store);
}

const summarize = (data) => ({
  subjects: (data?.subjects || []).length,
  slots: (data?.slots || []).length,
  notes: (data?.shortNotes || []).length,
  logs: (data?.overrides || []).filter((o) => o.postTeachingLog && String(o.postTeachingLog).trim()).length,
});

/** Lists available copies, newest first: [{ id, kind, savedAt, counts }] */
export function listAutoBackups(accountKey) {
  if (!accountKey) return [];
  const store = read(accountKey);
  const items = store.daily.map((d) => ({
    id: `daily:${d.date}`,
    kind: 'daily',
    date: d.date,
    savedAt: d.savedAt,
    counts: summarize(d.data),
  }));
  if (store.latest) {
    items.push({ id: 'latest', kind: 'latest', savedAt: store.latest.savedAt, counts: summarize(store.latest.data) });
  }
  return items.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export function getAutoBackupData(accountKey, id) {
  const store = read(accountKey);
  if (id === 'latest') return store.latest?.data || null;
  const date = String(id).replace(/^daily:/, '');
  return store.daily.find((d) => d.date === date)?.data || null;
}
