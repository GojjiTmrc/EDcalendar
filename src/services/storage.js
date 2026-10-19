import {
  INITIAL_SEMESTERS,
  INITIAL_SUBJECTS,
  INITIAL_TIMETABLE_SLOTS,
  INITIAL_OVERRIDES,
  INITIAL_MULTI_DAY_EVENTS,
  INITIAL_SHORT_NOTES,
} from './sampleData';
import { supabase, checkSupabaseHealth, CLOUD_FIRESTORE_BASE_URL } from './supabaseClient';
import { getSemesterTerm } from './summaryService';

const STORAGE_KEY = 'edcalendar_data_v1';
const USER_STORAGE_PREFIX = 'edcalendar_user_data_';
const THEME_KEY = 'edcalendar_theme';
const REALTIME_CHANNEL_NAME = 'edcalendar_realtime_sync_v1';

// Unique ID for this browser tab/window instance to avoid echoing own writes
const CLIENT_INSTANCE_ID = `client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
let lastSyncedTimestamp = '';
let lastSyncedHash = '';

const broadcastChannel =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel(REALTIME_CHANNEL_NAME)
    : null;

function computeDataHash(data) {
  if (!data) return '';
  try {
    return JSON.stringify({
      semesters: data.semesters || [],
      subjects: data.subjects || [],
      slots: data.slots || [],
      overrides: data.overrides || [],
      multiDayEvents: data.multiDayEvents || [],
      shortNotes: data.shortNotes || [],
      activeSemesterId: data.activeSemesterId || null,
    });
  } catch {
    return '';
  }
}

function isSampleDataset(data) {
  if (!data || !Array.isArray(data.subjects)) return true;
  if (data.subjects.length === 0) return true;
  const sampleIds = new Set(['sub-1', 'sub-2', 'sub-3', 'sub-4', 'sub-5', 'sub-6']);
  return data.subjects.every((s) => sampleIds.has(s.id));
}

/**
 * Ensures valid arrays and automatically assigns termScope ('1', '2', or 'both')
 * to legacy subjects that don't have termScope defined yet based on their timetable slots.
 */
export function normalizeAndMigrateData(raw) {
  if (!raw || typeof raw !== 'object') {
    return getSampleState();
  }

  const semesters = Array.isArray(raw.semesters) ? raw.semesters : [];
  const slots = Array.isArray(raw.slots) ? raw.slots : [];
  const semesterMap = new Map(semesters.map((s) => [s.id, s]));

  const subjects = (Array.isArray(raw.subjects) ? raw.subjects : []).map((sub) => {
    if (sub.termScope === '1' || sub.termScope === '2' || sub.termScope === 'both') {
      return sub;
    }
    // Auto-infer termScope from slots if not explicitly set yet
    const subSlots = slots.filter((sl) => sl.subjectId === sub.id);
    const termsUsed = new Set();
    subSlots.forEach((sl) => {
      const sem = semesterMap.get(sl.semesterId);
      const t = getSemesterTerm(sem || { id: sl.semesterId });
      if (t) termsUsed.add(t);
    });

    let inferredScope = 'both';
    if (termsUsed.size === 1) {
      inferredScope = Array.from(termsUsed)[0];
    }
    return {
      ...sub,
      termScope: inferredScope,
    };
  });

  return {
    semesters,
    subjects,
    slots,
    overrides: Array.isArray(raw.overrides) ? raw.overrides : [],
    multiDayEvents: Array.isArray(raw.multiDayEvents) ? raw.multiDayEvents : [],
    shortNotes: Array.isArray(raw.shortNotes) ? raw.shortNotes : [],
    activeSemesterId: raw.activeSemesterId || semesters[0]?.id || null,
    updatedAt: raw.updatedAt || null,
  };
}

export function getSampleState() {
  return normalizeAndMigrateData({
    semesters: INITIAL_SEMESTERS,
    subjects: INITIAL_SUBJECTS,
    slots: INITIAL_TIMETABLE_SLOTS,
    overrides: INITIAL_OVERRIDES,
    multiDayEvents: INITIAL_MULTI_DAY_EVENTS || [],
    shortNotes: INITIAL_SHORT_NOTES || [],
    activeSemesterId: INITIAL_SEMESTERS[0].id,
  });
}

export function getEmptyState() {
  return {
    semesters: [],
    subjects: [],
    slots: [],
    overrides: [],
    multiDayEvents: [],
    shortNotes: [],
    activeSemesterId: null,
    updatedAt: new Date().toISOString(),
  };
}

export function hasExistingLocalData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.semesters) && parsed.semesters.length > 0;
  } catch {
    return false;
  }
}

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const init = getSampleState();
      saveData(init);
      return init;
    }
    const parsed = JSON.parse(raw);
    return normalizeAndMigrateData(parsed);
  } catch (err) {
    console.error('Error loading data from localStorage:', err);
    return getSampleState();
  }
}

export function saveData(data) {
  try {
    const normalized = normalizeAndMigrateData(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch (err) {
    console.error('Error saving data to localStorage:', err);
  }
}

function loadUserDataLocal(userId) {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(`${USER_STORAGE_PREFIX}${userId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return normalizeAndMigrateData(parsed);
  } catch {
    return null;
  }
}

function saveUserDataLocal(userId, data) {
  if (!userId) return;
  try {
    const normalized = normalizeAndMigrateData(data);
    localStorage.setItem(`${USER_STORAGE_PREFIX}${userId}`, JSON.stringify(normalized));
  } catch (err) {
    console.error('Error saving user data locally:', err);
  }
}

export function resetData() {
  const init = getEmptyState();
  saveData(init);
  return init;
}

// ----------------- Cloud Firestore Real-Time Storage Helpers -----------------

function toSafeDocId(userId) {
  return String(userId || '').replace(/[^a-zA-Z0-9_-]/g, '_');
}

async function fetchFirestoreCalendar(userId, timeoutMs = 3500) {
  const docId = toSafeDocId(userId);
  if (!docId) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${CLOUD_FIRESTORE_BASE_URL}/edcalendar_calendars/${docId}`, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const json = await res.json();
    const fields = json?.fields;
    if (!fields || !fields.calendarJson?.stringValue) return null;
    const parsed = JSON.parse(fields.calendarJson.stringValue);
    const updatedAt = fields.updatedAt?.stringValue || parsed.updatedAt || '';
    const clientId = fields.clientId?.stringValue || '';
    return {
      data: normalizeAndMigrateData({ ...parsed, updatedAt }),
      updatedAt,
      clientId,
    };
  } catch {
    return null;
  }
}

async function pushFirestoreCalendar(userId, data, timeoutMs = 4000) {
  const docId = toSafeDocId(userId);
  if (!docId || !data) return false;
  try {
    const updatedAt = data.updatedAt || new Date().toISOString();
    const payloadToStore = normalizeAndMigrateData({ ...data, updatedAt });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const body = {
      fields: {
        userId: { stringValue: String(userId) },
        calendarJson: { stringValue: JSON.stringify(payloadToStore) },
        updatedAt: { stringValue: updatedAt },
        clientId: { stringValue: CLIENT_INSTANCE_ID },
      },
    };
    const res = await fetch(`${CLOUD_FIRESTORE_BASE_URL}/edcalendar_calendars/${docId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      lastSyncedTimestamp = updatedAt;
      lastSyncedHash = computeDataHash(payloadToStore);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function broadcastLocalUpdate(userId, data) {
  if (!broadcastChannel) return;
  try {
    broadcastChannel.postMessage({
      type: 'CALENDAR_UPDATED',
      userId,
      data,
      updatedAt: data.updatedAt || new Date().toISOString(),
      clientId: CLIENT_INSTANCE_ID,
    });
  } catch {
    // Ignore broadcast errors
  }
}

// ----------------- Cloud Sync & Real-Time Subscription -----------------

export async function loadCloudData(userId) {
  if (!userId) {
    return loadData();
  }

  // Strictly read ONLY this specific user's isolated local cache (never shared demo storage)
  const localUserCache = loadUserDataLocal(userId);

  // 1. Fetch from Always-On Cloud Firestore for this specific userId
  const cloudRecord = await fetchFirestoreCalendar(userId, 3500);

  if (cloudRecord && cloudRecord.data) {
    const cloudData = cloudRecord.data;
    const localHasRealData = localUserCache && !isSampleDataset(localUserCache);

    if (localHasRealData) {
      const localTime = localUserCache.updatedAt ? new Date(localUserCache.updatedAt).getTime() : 0;
      const cloudTime = cloudRecord.updatedAt ? new Date(cloudRecord.updatedAt).getTime() : 0;

      if (localTime > cloudTime) {
        const merged = normalizeAndMigrateData({
          ...localUserCache,
          updatedAt: new Date().toISOString(),
        });
        saveUserDataLocal(userId, merged);
        lastSyncedTimestamp = merged.updatedAt;
        lastSyncedHash = computeDataHash(merged);
        pushFirestoreCalendar(userId, merged);
        return merged;
      }
    }

    saveUserDataLocal(userId, cloudData);
    lastSyncedTimestamp = cloudRecord.updatedAt || '';
    lastSyncedHash = computeDataHash(cloudData);
    return cloudData;
  }

  // 2. Fallback: Check Supabase if configured & reachable (for non-local UUIDs)
  const isLocalId = String(userId).startsWith('user-');
  if (supabase && !isLocalId) {
    try {
      const health = await checkSupabaseHealth(2000);
      if (health.ok) {
        const { data, error } = await supabase
          .from('user_calendars')
          .select('calendar_data')
          .eq('user_id', userId)
          .maybeSingle();

        if (!error && data?.calendar_data) {
          const normalized = normalizeAndMigrateData(data.calendar_data);
          saveUserDataLocal(userId, normalized);
          pushFirestoreCalendar(userId, normalized);
          return normalized;
        }
      }
    } catch {
      // Ignore Supabase error
    }
  }

  // 3. Brand-new user with no cloud data yet: use their own localUserCache if present, otherwise start with a clean empty calendar
  const initialToSave = normalizeAndMigrateData({
    ...(localUserCache || getEmptyState()),
    updatedAt: new Date().toISOString(),
  });
  saveUserDataLocal(userId, initialToSave);
  lastSyncedTimestamp = initialToSave.updatedAt;
  lastSyncedHash = computeDataHash(initialToSave);
  await pushFirestoreCalendar(userId, initialToSave);
  return initialToSave;
}

export async function saveCloudDataImmediate(userId, data) {
  const stamped = normalizeAndMigrateData({
    ...data,
    updatedAt: new Date().toISOString(),
  });
  if (!userId) {
    saveData(stamped);
    return;
  }
  saveUserDataLocal(userId, stamped);
  lastSyncedTimestamp = stamped.updatedAt;
  lastSyncedHash = computeDataHash(stamped);
  broadcastLocalUpdate(userId, stamped);

  await pushFirestoreCalendar(userId, stamped);

  if (!supabase || String(userId).startsWith('user-')) return;
  try {
    const health = await checkSupabaseHealth(2000);
    if (!health.ok) return;
    await supabase
      .from('user_calendars')
      .upsert(
        {
          user_id: userId,
          calendar_data: stamped,
          updated_at: stamped.updatedAt,
        },
        { onConflict: 'user_id' }
      );
  } catch {
    // Ignore Supabase error
  }
}

let syncTimeout = null;
export function debouncedSaveCloudData(userId, data, onStatusChange) {
  const stamped = normalizeAndMigrateData({
    ...data,
    updatedAt: new Date().toISOString(),
  });

  if (!userId) {
    saveData(stamped);
    if (onStatusChange) onStatusChange('saved');
    return;
  }

  // 1. Instant isolated per-user local update + instant cross-tab broadcast (0ms)
  saveUserDataLocal(userId, stamped);
  lastSyncedTimestamp = stamped.updatedAt;
  lastSyncedHash = computeDataHash(stamped);
  broadcastLocalUpdate(userId, stamped);

  if (onStatusChange) onStatusChange('saving');
  clearTimeout(syncTimeout);

  syncTimeout = setTimeout(async () => {
    try {
      // 2. Push to Always-On Cloud Firestore under this user's own document ID
      await pushFirestoreCalendar(userId, stamped);

      // 3. Also push to Supabase if applicable
      if (supabase && !String(userId).startsWith('user-')) {
        const health = await checkSupabaseHealth(2000);
        if (health.ok) {
          await supabase
            .from('user_calendars')
            .upsert(
              {
                user_id: userId,
                calendar_data: stamped,
                updated_at: stamped.updatedAt,
              },
              { onConflict: 'user_id' }
            );
        }
      }
      if (onStatusChange) onStatusChange('saved');
    } catch (err) {
      console.error('Sync failed:', err);
      if (onStatusChange) onStatusChange('saved');
    }
  }, 350);
}

/**
 * Subscribes to real-time updates across tabs (BroadcastChannel + storage event)
 * AND across devices via Cloud Firestore live polling + Supabase Realtime.
 */
export function subscribeRealtimeCloudData(userId, onRemoteUpdate, onSyncStatus) {
  if (!userId || typeof window === 'undefined') return () => {};

  let isActive = true;
  let isCheckingCloud = false;

  const applyIncomingData = (incomingData, incomingUpdatedAt) => {
    if (!isActive || !incomingData) return;
    const normalized = normalizeAndMigrateData(incomingData);
    const incomingHash = computeDataHash(normalized);
    if (!incomingHash || incomingHash === lastSyncedHash) return;

    lastSyncedHash = incomingHash;
    if (incomingUpdatedAt) {
      lastSyncedTimestamp = incomingUpdatedAt;
    }
    saveUserDataLocal(userId, normalized);
    onRemoteUpdate(normalized);
    if (onSyncStatus) onSyncStatus('saved');
  };

  // 1. Instant Cross-Tab Listener via BroadcastChannel (filtered strictly by userId)
  const handleBroadcast = (event) => {
    const msg = event?.data;
    if (!msg || msg.type !== 'CALENDAR_UPDATED') return;
    if (msg.userId !== userId || msg.clientId === CLIENT_INSTANCE_ID) return;
    applyIncomingData(msg.data, msg.updatedAt);
  };
  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcast);
  }

  // 2. Cross-Tab Fallback via window 'storage' event (filtered strictly by this user's key)
  const userKey = `${USER_STORAGE_PREFIX}${userId}`;
  const handleStorage = (e) => {
    if (e.key === userKey && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        applyIncomingData(parsed, parsed.updatedAt);
      } catch {
        // Ignore parse error
      }
    }
  };
  window.addEventListener('storage', handleStorage);

  // 3. Cross-Device Real-Time Cloud Watcher (Cloud Firestore)
  const checkCloudUpdates = async () => {
    if (!isActive || isCheckingCloud) return;
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
    isCheckingCloud = true;
    try {
      const remote = await fetchFirestoreCalendar(userId, 2500);
      if (remote && remote.data && remote.clientId !== CLIENT_INSTANCE_ID) {
        const remoteTime = remote.updatedAt ? new Date(remote.updatedAt).getTime() : 0;
        const localTime = lastSyncedTimestamp ? new Date(lastSyncedTimestamp).getTime() : 0;
        if (remoteTime > localTime || !lastSyncedTimestamp) {
          applyIncomingData(remote.data, remote.updatedAt);
        }
      }
    } catch {
      // Ignore transient network errors
    } finally {
      isCheckingCloud = false;
    }
  };

  const pollInterval = setInterval(checkCloudUpdates, 2500);

  const handleVisibilityOrFocus = () => {
    if (document.visibilityState === 'visible') {
      checkCloudUpdates();
    }
  };
  window.addEventListener('focus', handleVisibilityOrFocus);
  document.addEventListener('visibilitychange', handleVisibilityOrFocus);

  // 4. Optional Supabase Realtime Channel (when Supabase is online for UUID users)
  let supabaseChannel = null;
  if (supabase && !String(userId).startsWith('user-')) {
    try {
      supabaseChannel = supabase
        .channel(`realtime_user_calendar_${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_calendars',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const nextCal = payload?.new?.calendar_data;
            if (nextCal) {
              applyIncomingData(nextCal, payload?.new?.updated_at);
            }
          }
        )
        .subscribe();
    } catch {
      // Ignore Supabase channel error
    }
  }

  return () => {
    isActive = false;
    clearInterval(pollInterval);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcast);
    }
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener('focus', handleVisibilityOrFocus);
    document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    if (supabaseChannel && supabase) {
      supabase.removeChannel(supabaseChannel).catch(() => {});
    }
  };
}

// ----------------- Backup & Restore -----------------

export function exportBackupJSON(data) {
  const payload = {
    app: 'EDcalendar',
    version: '1.2',
    exportedAt: new Date().toISOString(),
    data: data,
  };
  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  a.href = url;
  a.download = `EDcalendar_backup_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importBackupJSON(fileContent) {
  try {
    const parsed = JSON.parse(fileContent);
    const content = parsed.data || parsed;
    if (!Array.isArray(content.semesters) || !Array.isArray(content.subjects) || !Array.isArray(content.slots)) {
      throw new Error('โครงสร้างไฟล์สำรองข้อมูลไม่ถูกต้อง');
    }
    const cleanData = normalizeAndMigrateData({
      semesters: content.semesters,
      subjects: content.subjects,
      slots: content.slots,
      overrides: content.overrides || [],
      multiDayEvents: content.multiDayEvents || [],
      shortNotes: content.shortNotes || [],
      activeSemesterId: content.activeSemesterId || content.semesters[0]?.id || null,
      updatedAt: new Date().toISOString(),
    });
    saveData(cleanData);
    return { success: true, data: cleanData };
  } catch (err) {
    return { success: false, error: err.message || 'ไฟล์ JSON ไม่ถูกต้อง' };
  }
}

// ----------------- Theme -----------------

export function loadTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  } catch {
    return 'light';
  }
}

export function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (err) {
    console.error('Error saving theme:', err);
  }
}
