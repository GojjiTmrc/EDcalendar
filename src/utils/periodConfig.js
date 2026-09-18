import { timeToMinutes } from './dateUtils';

export const DEFAULT_PERIODS = [
  { period: 1, label: '1', startTime: '08:40', endTime: '09:30', isLunch: false },
  { period: 2, label: '2', startTime: '09:30', endTime: '10:20', isLunch: false },
  { period: 3, label: '3', startTime: '10:20', endTime: '11:10', isLunch: false },
  { period: 4, label: '4', startTime: '11:10', endTime: '12:00', isLunch: false },
  { period: 'lunch', label: 'พักเที่ยง', startTime: '12:00', endTime: '13:00', isLunch: true },
  { period: 5, label: '5', startTime: '13:00', endTime: '13:50', isLunch: false },
  { period: 6, label: '6', startTime: '13:50', endTime: '14:40', isLunch: false },
  { period: 7, label: '7', startTime: '14:40', endTime: '15:30', isLunch: false },
  { period: 8, label: '8', startTime: '15:30', endTime: '16:30', isLunch: false },
];

export const TEACHING_PERIODS = DEFAULT_PERIODS.filter(p => !p.isLunch);

/**
 * Standard weekly activities for Period 7 (from official Thai school timetable format)
 */
export const DEFAULT_ACTIVITIES = {
  1: 'แนะแนว',
  2: 'คุณธรรม',
  3: 'ลูกเสือ-เนตรนารี',
  4: 'ชุมนุม',
  5: '5 ส',
};

export const DEFAULT_SIGNATURES = [
  { name: 'นางวิยดา ลุมภักดิ์', title: 'หัวหน้าวิชาการ' },
  { name: 'นายวัฒนา แสนสุพงษ์', title: 'รองผู้อำนวยการ' },
  { name: 'นายเกษมศักดิ์ ฆ้องลา', title: 'ผู้อำนวยการโรงเรียน' },
];

const PERIOD_STORAGE_KEY = 'edcalendar_periods_config';
const SIGNATURE_STORAGE_KEY = 'edcalendar_signatures_config';

export function getStoredPeriods() {
  try {
    const raw = localStorage.getItem(PERIOD_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to parse stored periods', e);
  }
  return DEFAULT_PERIODS;
}

export function saveStoredPeriods(periods) {
  try {
    localStorage.setItem(PERIOD_STORAGE_KEY, JSON.stringify(periods));
  } catch (e) {
    console.error('Failed to save periods', e);
  }
}

export function getStoredSignatures() {
  try {
    const raw = localStorage.getItem(SIGNATURE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to parse stored signatures', e);
  }
  return DEFAULT_SIGNATURES;
}

export function saveStoredSignatures(signatures) {
  try {
    localStorage.setItem(SIGNATURE_STORAGE_KEY, JSON.stringify(signatures));
  } catch (e) {
    console.error('Failed to save signatures', e);
  }
}

/**
 * Maps a slot to its starting teaching period and how many periods it spans.
 * Returns { startPeriod: number, span: number } (e.g. { startPeriod: 2, span: 2 } for Period 2-3)
 */
export function getSlotPeriodMapping(slot, periods = DEFAULT_PERIODS) {
  if (!slot) return null;

  const teachingPeriods = periods.filter(p => !p.isLunch);
  const slotStartMin = timeToMinutes(slot.startTime);
  const slotEndMin = timeToMinutes(slot.endTime);
  const periodCount = Number(slot.periods) || 1;

  // 1. Find closest teaching period by start time
  let bestPeriod = teachingPeriods[0];
  let minDiff = Infinity;

  for (const p of teachingPeriods) {
    const pStartMin = timeToMinutes(p.startTime);
    const diff = Math.abs(pStartMin - slotStartMin);
    if (diff < minDiff) {
      minDiff = diff;
      bestPeriod = p;
    }
  }

  // 2. If slot.periodIndex is explicitly stored, use it directly
  let startPeriodNum = slot.periodNumber || bestPeriod.period;

  // 3. Compute span: based on slot.periods, or calculate from (slotEndMin - slotStartMin) / 50
  let span = periodCount;
  if (!span || span < 1) {
    const durationMin = Math.max(0, slotEndMin - slotStartMin);
    span = Math.max(1, Math.round(durationMin / 50));
  }

  // Ensure span doesn't exceed 8
  if (startPeriodNum + span - 1 > 8) {
    span = Math.max(1, 9 - startPeriodNum);
  }

  return {
    startPeriod: startPeriodNum,
    span: span,
  };
}
