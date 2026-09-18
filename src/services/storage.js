import {
  INITIAL_SEMESTERS,
  INITIAL_SUBJECTS,
  INITIAL_TIMETABLE_SLOTS,
  INITIAL_OVERRIDES,
  INITIAL_MULTI_DAY_EVENTS,
  INITIAL_SHORT_NOTES,
} from './sampleData';

const STORAGE_KEY = 'edcalendar_data_v1';
const THEME_KEY = 'edcalendar_theme';

export function getInitialState() {
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

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const init = getInitialState();
      saveData(init);
      return init;
    }
    const parsed = JSON.parse(raw);
    return {
      semesters: parsed.semesters || INITIAL_SEMESTERS,
      subjects: parsed.subjects || INITIAL_SUBJECTS,
      slots: parsed.slots || INITIAL_TIMETABLE_SLOTS,
      overrides: parsed.overrides || INITIAL_OVERRIDES,
      multiDayEvents: parsed.multiDayEvents || INITIAL_MULTI_DAY_EVENTS || [],
      shortNotes: parsed.shortNotes || INITIAL_SHORT_NOTES || [],
      activeSemesterId: parsed.activeSemesterId || (parsed.semesters && parsed.semesters[0]?.id) || 'sem-2569-1',
    };
  } catch (err) {
    console.error('Error loading data from localStorage:', err);
    return getInitialState();
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
  const init = getInitialState();
  saveData(init);
  return init;
}

export function exportBackupJSON(data) {
  const payload = {
    app: 'EDcalendar',
    version: '1.1',
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
      activeSemesterId: content.activeSemesterId || content.semesters[0]?.id,
    };
    saveData(cleanData);
    return { success: true, data: cleanData };
  } catch (err) {
    return { success: false, error: err.message || 'ไฟล์ JSON ไม่ถูกต้อง' };
  }
}

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
