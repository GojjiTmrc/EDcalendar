// Date and time utility functions for Thai academic calendar

export const THAI_DAYS = [
  { index: 1, key: 'mon', full: 'วันจันทร์', short: 'จันทร์', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30' },
  { index: 2, key: 'tue', full: 'วันอังคาร', short: 'อังคาร', color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-50 dark:bg-pink-950/30' },
  { index: 3, key: 'wed', full: 'วันพุธ', short: 'พุธ', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  { index: 4, key: 'thu', full: 'วันพฤหัสบดี', short: 'พฤหัสฯ', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/30' },
  { index: 5, key: 'fri', full: 'วันศุกร์', short: 'ศุกร์', color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/30' },
  { index: 6, key: 'sat', full: 'วันเสาร์', short: 'เสาร์', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/30' },
  { index: 7, key: 'sun', full: 'วันอาทิตย์', short: 'อาทิตย์', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30' },
];

/** School days: Monday to Friday only */
export const SCHOOL_DAYS = THAI_DAYS.slice(0, 5);

export const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

/** Convert standard JS getDay() (0=Sun..6=Sat) to 1=Mon..7=Sun */
export function jsDayToThaiDay(jsDay) {
  return jsDay === 0 ? 7 : jsDay;
}

/** Convert 1=Mon..7=Sun to JS getDay() (0=Sun..6=Sat) */
export function thaiDayToJsDay(thaiDay) {
  return thaiDay === 7 ? 0 : thaiDay;
}

export function toDateString(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateString(str) {
  const [year, month, day] = str.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatThaiDate(dateStr, format = 'full') {
  if (!dateStr) return '';
  const d = typeof dateStr === 'string' ? parseDateString(dateStr) : dateStr;
  const day = d.getDate();
  const monthIdx = d.getMonth();
  const yearBE = d.getFullYear() + 543;
  const thaiDay = THAI_DAYS.find(td => td.index === jsDayToThaiDay(d.getDay()));

  if (format === 'short') {
    return `${day} ${THAI_MONTHS_SHORT[monthIdx]} ${yearBE}`;
  }
  if (format === 'withDay') {
    return `${thaiDay?.full || ''}ที่ ${day} ${THAI_MONTHS_FULL[monthIdx]} พ.ศ. ${yearBE}`;
  }
  if (format === 'monthYear') {
    return `${THAI_MONTHS_FULL[monthIdx]} พ.ศ. ${yearBE}`;
  }
  return `${day} ${THAI_MONTHS_FULL[monthIdx]} พ.ศ. ${yearBE}`;
}

export function isSameDate(d1, d2) {
  const str1 = typeof d1 === 'string' ? d1 : toDateString(d1);
  const str2 = typeof d2 === 'string' ? d2 : toDateString(d2);
  return str1 === str2;
}

export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * 5-Day School Calendar Grid (Monday - Friday only, completely removes Saturday & Sunday).
 * Each row represents a 5-day school week.
 */
export function getSchoolWeekMonthGrid(year, month) {
  // First day of target month
  const firstDate = new Date(year, month, 1);
  const firstDayThai = jsDayToThaiDay(firstDate.getDay()); // 1=Mon .. 7=Sun

  // Find the Monday of the starting week
  let startMonday;
  if (firstDayThai <= 5) {
    // Falls on Mon-Fri: go back to Monday of this week
    startMonday = new Date(year, month, 1 - (firstDayThai - 1));
  } else if (firstDayThai === 6) {
    // Saturday: First school day is the upcoming Monday (day 3)
    startMonday = new Date(year, month, 3);
  } else {
    // Sunday: First school day is the upcoming Monday (day 2)
    startMonday = new Date(year, month, 2);
  }

  // Last day of target month
  const lastDate = new Date(year, month + 1, 0);
  const lastDayThai = jsDayToThaiDay(lastDate.getDay()); // 1=Mon .. 7=Sun

  // Find the Friday of the ending week
  let endFriday;
  if (lastDayThai >= 6) {
    // Falls on Sat or Sun: last school week ends on Friday of that same week
    const diffToFriday = lastDayThai === 6 ? -1 : -2;
    endFriday = new Date(year, month, lastDate.getDate() + diffToFriday);
  } else {
    // Falls on Mon-Fri: go forward to Friday of this week
    endFriday = new Date(year, month, lastDate.getDate() + (5 - lastDayThai));
  }

  const days = [];
  const currentCursor = new Date(startMonday);

  while (currentCursor <= endFriday) {
    // Each week has 5 school days: Monday (0) to Friday (4)
    for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
      const d = new Date(currentCursor);
      d.setDate(currentCursor.getDate() + dayOffset);

      const dMonth = d.getMonth();
      const dYear = d.getFullYear();
      const isCurrentMonth = dMonth === month && dYear === year;

      days.push({
        date: d,
        dateString: toDateString(d),
        dayNumber: d.getDate(),
        isCurrentMonth,
        isPrevMonth: dYear < year || (dYear === year && dMonth < month),
        isNextMonth: dYear > year || (dYear === year && dMonth > month),
        dayOfWeek: dayOffset + 1, // 1=Mon..5=Fri
        thaiDay: SCHOOL_DAYS[dayOffset],
      });
    }
    // Advance cursor by 7 days to next Monday
    currentCursor.setDate(currentCursor.getDate() + 7);
  }

  return days;
}

/**
 * Get 5-day school week dates (Monday to Friday only) for a given date.
 */
export function getSchoolWeekDates(baseDate = new Date()) {
  const d = new Date(baseDate);
  const currentDay = d.getDay(); // 0=Sun..6=Sat
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;

  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);

  const week = [];
  for (let i = 0; i < 5; i++) {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + i);
    week.push({
      date: dayDate,
      dateString: toDateString(dayDate),
      dayNumber: dayDate.getDate(),
      dayOfWeek: i + 1, // 1=Mon..5=Fri
      thaiDay: SCHOOL_DAYS[i],
    });
  }
  return week;
}

/** Time comparison: "08:30" -> minutes from midnight */
export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  return `${h}:${m} น.`;
}

/**
 * Format minutes into Thai "X ชั่วโมง Y นาที" (strictly no decimals)
 */
export function formatDurationThai(totalMinutes) {
  if (!totalMinutes || totalMinutes <= 0) return '0 นาที';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} นาที`;
  if (minutes === 0) return `${hours} ชั่วโมง`;
  return `${hours} ชั่วโมง ${minutes} นาที`;
}

/**
 * Short Thai format: "X ชม. Y นาที"
 */
export function formatDurationShortThai(totalMinutes) {
  if (!totalMinutes || totalMinutes <= 0) return '0 นาที';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} นาที`;
  if (minutes === 0) return `${hours} ชม.`;
  return `${hours} ชม. ${minutes} นาที`;
}

/**
 * Calculate the number of days in a date range [startDate, endDate] inclusive
 */
export function countDaysInRange(startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr) return 0;
  const start = parseDateString(startDateStr);
  const end = parseDateString(endDateStr);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}
