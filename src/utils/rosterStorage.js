import { useState, useCallback } from 'react';
import { createStudent } from './rosterUtils';

// Student rosters are personal data: they are stored ONLY in this browser (localStorage),
// scoped per signed-in account, and are never sent to the cloud sync.

const ROSTER_KEY_PREFIX = 'edcalendar_rosters_v1_';
const GAME_STATE_KEY = 'edcalendar_game_state_v1';
const GAME_PREFS_KEY = 'edcalendar_game_prefs_v1';
const MAPPING_KEY = 'edcalendar_roster_mapping_v1';

function storageKeyFor(userId) {
  return `${ROSTER_KEY_PREFIX}${userId || 'guest'}`;
}

function loadRosters(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== 'object') return {};
    const result = {};
    Object.entries(parsed).forEach(([group, roster]) => {
      const students = Array.isArray(roster?.students) ? roster.students.map(createStudent) : [];
      result[group] = { classGroup: group, students, updatedAt: roster?.updatedAt || null };
    });
    return result;
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

/** Rosters keyed by class group (e.g. "ม.6/2"), stored locally per account. */
export function useRosters(userId) {
  const key = storageKeyFor(userId);
  const [store, setStore] = useState(() => ({ key, rosters: loadRosters(key) }));

  // Reload when the signed-in account changes
  let current = store;
  if (store.key !== key) {
    current = { key, rosters: loadRosters(key) };
    setStore(current);
  }

  const update = useCallback(
    (mutate) => {
      setStore((prev) => {
        const base = prev.key === key ? prev.rosters : loadRosters(key);
        const next = mutate(base);
        persistRosters(key, next);
        return { key, rosters: next };
      });
    },
    [key]
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
      update((prev) => {
        const next = { ...prev };
        delete next[classGroup];
        return next;
      });
    },
    [update]
  );

  return { rosters: current.rosters, saveRoster, deleteRoster };
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
