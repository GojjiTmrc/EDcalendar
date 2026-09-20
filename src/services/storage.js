import {
  INITIAL_SEMESTERS,
  INITIAL_SUBJECTS,
  INITIAL_TIMETABLE_SLOTS,
  INITIAL_OVERRIDES,
  INITIAL_MULTI_DAY_EVENTS,
  INITIAL_SHORT_NOTES,
} from './sampleData';
import { supabase } from './supabaseClient';

const STORAGE_KEY = 'edcalendar_data_v1';
const THEME_KEY = 'edcalendar_theme';

export function getSampleState() {
  return {
    semesters: INITIAL_SEMESTERS,
    subjects: INITIAL_SUBJECTS,
    slots: INITIAL_TIMETABLE_SLOTS,
    overrides: INITIAL_OVERRIDES,
    multiDayEvents: INITIAL_MULTI_DAY_EVENTS || [],
    shortNotes: INITIAL_SHORT_NOTES || [],
    activeSemesterId: INITIAL_SEMESTERS[0].id,
  };
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
    return {
      semesters: parsed.semesters || [],
      subjects: parsed.subjects || [],
      slots: parsed.slots || [],
      overrides: parsed.overrides || [],
      multiDayEvents: parsed.multiDayEvents || [],
      shortNotes: parsed.shortNotes || [],
      activeSemesterId: parsed.activeSemesterId || (parsed.semesters && parsed.semesters[0]?.id) || null,
    };
  } catch (err) {
    console.error('Error loading data from localStorage:', err);
    return getSampleState();
  }
}

export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Error saving data to localStorage:', err);
  }
}

export function resetData() {
  const init = getEmptyState();
  saveData(init);
  return init;
}

// ----------------- Supabase Cloud Sync -----------------

export async function loadCloudData(userId) {
  if (!supabase || !userId) {
    return loadData();
  }

  try {
    const { data, error } = await supabase
      .from('user_calendars')
      .select('calendar_data')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Supabase query error, fallback to local:', error.message);
      return loadData();
    }

    if (data && data.calendar_data) {
      const cloudData = data.calendar_data;
      // Cache locally
      saveData(cloudData);
      return cloudData;
    }

    // New user with no cloud data yet:
    // Check if there is existing local data in this machine (e.g. ครู ก็อดจิ)
    if (hasExistingLocalData()) {
      const existingLocal = loadData();
      // Auto-migrate to this user's cloud account!
      await saveCloudDataImmediate(userId, existingLocal);
      return existingLocal;
    }

    // Otherwise, clean empty state for a new user/friend
    const empty = getEmptyState();
    await saveCloudDataImmediate(userId, empty);
    saveData(empty);
    return empty;
  } catch (err) {
    console.error('Failed to load cloud data:', err);
    return loadData();
  }
}

export async function saveCloudDataImmediate(userId, data) {
  saveData(data);
  if (!supabase || !userId) return;

  try {
    const { error } = await supabase
      .from('user_calendars')
      .upsert({
        user_id: userId,
        calendar_data: data,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    if (error) throw error;
  } catch (err) {
    console.error('Error saving directly to Supabase:', err);
    throw err;
  }
}

let syncTimeout = null;
export function debouncedSaveCloudData(userId, data, onStatusChange) {
  // Always update local cache instantly for responsive UI
  saveData(data);

  if (!supabase || !userId) {
    if (onStatusChange) onStatusChange('saved');
    return;
  }

  if (onStatusChange) onStatusChange('saving');
  clearTimeout(syncTimeout);

  syncTimeout = setTimeout(async () => {
    try {
      const { error } = await supabase
        .from('user_calendars')
        .upsert({
          user_id: userId,
          calendar_data: data,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('Sync to Supabase error:', error);
        if (onStatusChange) onStatusChange('error');
      } else {
        if (onStatusChange) onStatusChange('saved');
      }
    } catch (err) {
      console.error('Sync failed:', err);
      if (onStatusChange) onStatusChange('error');
    }
  }, 600);
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
    const cleanData = {
      semesters: content.semesters,
      subjects: content.subjects,
      slots: content.slots,
      overrides: content.overrides || [],
      multiDayEvents: content.multiDayEvents || [],
      shortNotes: content.shortNotes || [],
      activeSemesterId: content.activeSemesterId || content.semesters[0]?.id || null,
    };
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
