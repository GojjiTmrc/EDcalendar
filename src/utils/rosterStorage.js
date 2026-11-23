import { useState, useCallback, useEffect, useRef } from 'react';
import { createStudent } from './rosterUtils';
import { fetchCloudRosters, pushCloudRosters } from '../services/rosterCloud';

// Student rosters are stored per signed-in account: in localStorage (works offline) and
// synced to the cloud in their own document. Per-class entries carry an updatedAt; the newer
// entry wins on merge. Deleting a class leaves a tombstone ({deleted:true}) so the deletion
// also propagates to other devices.

const ROSTER_KEY_PREFIX = 'edcalendar_rosters_v1_';
const GAME_STATE_KEY = 'edcalendar_game_state_v1';
const GAME_PREFS_KEY = 'edcalendar_game_prefs_v1';
const MAPPING_KEY = 'edcalendar_roster_mapping_v1';

const POLL_INTERVAL_MS = 30000;
const PUSH_DEBOUNCE_MS = 1200;

function storageKeyFor(userId) {
  return `${ROSTER_KEY_PREFIX}${userId || 'guest'}`;
}

function normalizeEntry(group, roster) {
  const deleted = !!roster?.deleted;
  return {
    classGroup: group,
    students: !deleted && Array.isArray(roster?.students) ? roster.students.map(createStudent) : [],
    updatedAt: roster?.updatedAt || null,
    ...(deleted ? { deleted: true } : {}),
  };
}

function normalizeRosters(parsed) {
  if (!parsed || typeof parsed !== 'object') return {};
  const result = {};
  Object.entries(parsed).forEach(([group, roster]) => {
    result[group] = normalizeEntry(group, roster);
  });
  return result;
}

function loadRosters(key) {
  try {
    const raw = localStorage.getItem(key);
    return normalizeRosters(raw ? JSON.parse(raw) : {});
  } catch {
    return {};
  }
}

function persistRosters(key, rosters) {
  try {
    localStorage.setItem(key, JSON.stringify(rosters));
  } catch (err) {
    console.error('Failed to save rosters:', err);
  }
}

const timeOf = (entry) => (entry?.updatedAt ? new Date(entry.updatedAt).getTime() || 0 : 0);

/** Per-class merge: the entry with the newer updatedAt wins. */
export function mergeRosters(a, b) {
  const merged = {};
  new Set([...Object.keys(a), ...Object.keys(b)]).forEach((group) => {
    const ea = a[group];
    const eb = b[group];
    merged[group] = !ea ? eb : !eb ? ea : timeOf(eb) > timeOf(ea) ? eb : ea;
  });
  return merged;
}

function sameRosters(a, b) {
  const ka = Object.keys(a);
  if (ka.length !== Object.keys(b).length) return false;
  return ka.every((g) => b[g] && b[g].updatedAt === a[g].updatedAt && !!b[g].deleted === !!a[g].deleted);
}

function visibleRosters(rosters) {
  const result = {};
  Object.entries(rosters).forEach(([g, r]) => {
    if (!r.deleted) result[g] = r;
  });
  return result;
}

/**
 * Rosters keyed by class group (e.g. "ม.6/2"). Stored locally per account and synced to the
 * cloud. Returns { rosters, saveRoster, deleteRoster, syncStatus }.
 */
export function useRosters(userId) {
  const key = storageKeyFor(userId);
  const cloudUserId = userId || null;
  const [store, setStore] = useState(() => ({ key, rosters: loadRosters(key) }));
  const [syncStatus, setSyncStatus] = useState('idle'); // idle | syncing | synced | offline
  const pushTimer = useRef(null);
  const syncing = useRef(false);

  // Reload when the signed-in account changes
  let current = store;
  if (store.key !== key) {
    current = { key, rosters: loadRosters(key) };
    setStore(current);
  }

  // Pull the cloud copy, merge with the local one, and push back whatever the cloud lacks.
  const syncNow = useCallback(async () => {
    if (!cloudUserId || syncing.current) return;
    syncing.current = true;
    setSyncStatus('syncing');
    try {
      const remote = await fetchCloudRosters(cloudUserId);
      if (!remote) {
        setSyncStatus('offline');
        return;
      }
      const remoteRosters = normalizeRosters(remote.rosters);
      const local = loadRosters(key);
      const merged = mergeRosters(local, remoteRosters);
      if (!sameRosters(merged, local)) {
        persistRosters(key, merged);
        setStore({ key, rosters: merged });
      }
      if (!remote.exists || !sameRosters(merged, remoteRosters)) {
        const ok = await pushCloudRosters(cloudUserId, merged);
        setSyncStatus(ok ? 'synced' : 'offline');
      } else {
        setSyncStatus('synced');
      }
    } finally {
      syncing.current = false;
    }
  }, [cloudUserId, key]);

  // Initial sync, periodic refresh and refresh when the tab becomes visible again
  useEffect(() => {
    if (!cloudUserId) return undefined;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    syncNow();
    const interval = setInterval(syncNow, POLL_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') syncNow();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      clearTimeout(pushTimer.current);
    };
  }, [cloudUserId, syncNow]);

  const schedulePush = useCallback(() => {
    if (!cloudUserId) return;
    clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(syncNow, PUSH_DEBOUNCE_MS);
  }, [cloudUserId, syncNow]);

  const update = useCallback(
    (mutate) => {
      setStore((prev) => {
        const base = prev.key === key ? prev.rosters : loadRosters(key);
        const next = mutate(base);
        persistRosters(key, next);
        return { key, rosters: next };
      });
      schedulePush();
    },
    [key, schedulePush]
  );

  const saveRoster = useCallback(
    (classGroup, students) => {
      const group = String(classGroup || '').trim();
      if (!group) return;
      update((prev) => ({
        ...prev,
        [group]: {
          classGroup: group,
          // keep the given order (callers sort when needed, so editing a number doesn't reorder rows mid-typing)
          students,
          updatedAt: new Date().toISOString(),
        },
      }));
    },
    [update]
  );

  const deleteRoster = useCallback(
    (classGroup) => {
      update((prev) => ({
        ...prev,
        [classGroup]: { classGroup, students: [], deleted: true, updatedAt: new Date().toISOString() },
      }));
    },
    [update]
  );

  return { rosters: visibleRosters(current.rosters), saveRoster, deleteRoster, syncStatus };
}

// --- Game progress per class (absent + already drawn); only student ids, no names ---

export function loadGameState(classGroup) {
  try {
    const all = JSON.parse(localStorage.getItem(GAME_STATE_KEY) || '{}');
    const st = all?.[classGroup] || {};
    return {
      absent: Array.isArray(st.absent) ? st.absent : [],
      drawn: Array.isArray(st.drawn) ? st.drawn : [],
    };
  } catch {
    return { absent: [], drawn: [] };
  }
}

export function saveGameState(classGroup, state) {
  try {
    const all = JSON.parse(localStorage.getItem(GAME_STATE_KEY) || '{}') || {};
    all[classGroup] = { absent: state.absent || [], drawn: state.drawn || [] };
    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(all));
  } catch {
    // ignore storage errors
  }
}

const DEFAULT_PREFS = { displayMode: 'nickname', hideSurname: false, fair: true };

export function loadGamePrefs() {
  try {
    return { ...DEFAULT_PREFS, ...(JSON.parse(localStorage.getItem(GAME_PREFS_KEY) || '{}') || {}) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function saveGamePrefs(prefs) {
  try {
    localStorage.setItem(GAME_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // ignore storage errors
  }
}

// --- Remembered column mapping for the import wizard (keyed by header signature) ---

export function loadSavedMapping(signature) {
  try {
    const all = JSON.parse(localStorage.getItem(MAPPING_KEY) || '{}') || {};
    return all[signature] || null;
  } catch {
    return null;
  }
}

export function saveMapping(signature, mapping) {
  try {
    const all = JSON.parse(localStorage.getItem(MAPPING_KEY) || '{}') || {};
    all[signature] = mapping;
    localStorage.setItem(MAPPING_KEY, JSON.stringify(all));
  } catch {
    // ignore storage errors
  }
}
