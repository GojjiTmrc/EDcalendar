import {
  parseDateString,
  toDateString,
  jsDayToThaiDay,
  timeToMinutes,
  formatDurationThai,
  formatDurationShortThai
} from '../utils/dateUtils';
import { getSessionsForDate } from './calendarGenerator';

/**
 * Detects whether a semester object represents Term '1' or Term '2'.
 * Returns '1', '2', or null if indeterminate.
 */
export function getSemesterTerm(semester) {
  if (!semester) return null;
  if (semester.term === '1' || semester.term === 1) return '1';
  if (semester.term === '2' || semester.term === 2) return '2';

  const name = String(semester.name || '');
  const match = name.match(/(?:ภาคเรียนที่|เทอม)\s*([12])|(?:^|\s)([12])\s*\//);
  if (match) return match[1] || match[2];

  const id = String(semester.id || '');
  if (id.endsWith('-1')) return '1';
  if (id.endsWith('-2')) return '2';

  return null;
}

/**
 * Checks whether a subject belongs to the given semester based on subject.termScope.
 * termScope values: '1' (วิชาเทอม 1) | '2' (วิชาเทอม 2) | 'both' (วิชาที่เรียนทั้ง 2 เทอม, default)
 */
export function isSubjectInSemester(subject, semester) {
  if (!subject) return false;
  const scope = subject.termScope || 'both';
  if (scope === 'both') return true;

  const semTerm = getSemesterTerm(semester);
  if (!semTerm) return true;

  return String(scope) === String(semTerm);
}

/**
 * Returns display label and badge classes for a subject's termScope.
 */
export function getTermScopeInfo(termScope) {
  const scope = termScope || 'both';
  if (scope === '1') {
    return {
      value: '1',
      label: 'วิชาเทอม 1',
      shortLabel: 'เทอม 1',
      badgeClass: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
    };
  }
  if (scope === '2') {
    return {
      value: '2',
      label: 'วิชาเทอม 2',
      shortLabel: 'เทอม 2',
      badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
    };
  }
  return {
    value: 'both',
    label: 'วิชาที่เรียนทั้ง 2 เทอม',
    shortLabel: 'ทั้ง 2 เทอม',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
  };
}

/**
 * Calculates teaching summary metrics and breakdown for a specified time scope.
 * 
 * @param {Object} semester 
 * @param {Array} slots 
 * @param {Array} subjects 
 * @param {Array} overrides 
 * @param {Array} multiDayEvents 
 * @param {string} scopeType 'semester' | 'todate' | 'month'
 * @param {Object} options { year, month } (when scopeType === 'month')
 */
export function calculateTeachingSummary(
  semester,
  slots = [],
  subjects = [],
  overrides = [],
  multiDayEvents = [],
  scopeType = 'semester',
  options = {}
) {
  if (!semester) return null;

  const todayStr = toDateString(new Date());

  // 1. Determine Start & End Date based on scope
  let rangeStart = semester.startDate;
  let rangeEnd = semester.endDate;

  if (scopeType === 'todate') {
    rangeEnd = todayStr < semester.endDate ? (todayStr > semester.startDate ? todayStr : semester.startDate) : semester.endDate;
  } else if (scopeType === 'month') {
    const { year, month } = options;
    if (year !== undefined && month !== undefined) {
      const monthStart = toDateString(new Date(year, month, 1));
      const monthEnd = toDateString(new Date(year, month + 1, 0));
      rangeStart = monthStart > semester.startDate ? monthStart : semester.startDate;
      rangeEnd = monthEnd < semester.endDate ? monthEnd : semester.endDate;
    }
  }

  // Ensure valid range
  if (rangeStart > rangeEnd) {
    rangeEnd = rangeStart;
  }

  const subjectMap = new Map((subjects || []).map(s => [s.id, s]));

  // Initialize subject breakdown map ONLY for subjects that match this semester's term
  const subjectStats = {};
  for (const sub of subjects) {
    if (!isSubjectInSemester(sub, semester)) continue;
    subjectStats[sub.id] = {
      subject: sub,
      plannedCount: 0,
      normalCount: 0,
      cancelledCount: 0,
      activityCount: 0,
      makeupCount: 0,
      completedCount: 0,
      taughtMinutes: 0,
      plannedMinutes: 0,
      plannedWeeksSet: new Set(),
      taughtWeeksSet: new Set(),
    };
  }

  let totalPlannedCount = 0;
  let totalNormalCount = 0;
  let totalCancelledCount = 0;
  let totalActivityCount = 0;
  let totalMakeupCount = 0;
  let totalCompletedCount = 0;
  let totalTaughtMinutes = 0;
  let totalPlannedMinutes = 0;
  const allPlannedWeeksSet = new Set();
  const allTaughtWeeksSet = new Set();

  const historyLogs = [];

  // Iterate school days (Mon-Fri) in [rangeStart, rangeEnd]
  const curDate = parseDateString(rangeStart);
  const endDateObj = parseDateString(rangeEnd);

  while (curDate <= endDateObj) {
    const jsDay = curDate.getDay(); // 0=Sun..6=Sat
    const thaiDay = jsDayToThaiDay(jsDay); // 1=Mon..7=Sun

    // Process only school days (Monday to Friday: 1..5)
    if (thaiDay >= 1 && thaiDay <= 5) {
      const dateStr = toDateString(curDate);
      const daySessions = getSessionsForDate(dateStr, semester, slots, subjects, overrides, multiDayEvents);

      // Compute week identifier (Monday of this week)
      const d = new Date(curDate);
      const dayOfWeek = d.getDay(); // 1=Mon..5=Fri
      const monDate = new Date(d);
      monDate.setDate(d.getDate() - (dayOfWeek - 1));
      const weekKey = toDateString(monDate);

      for (const sess of daySessions) {
        const subId = sess.subjectId;
        const knownSub = subjectMap.get(subId);
        // Skip sessions belonging to a subject explicitly restricted to another term
        if (knownSub && !isSubjectInSemester(knownSub, semester)) {
          continue;
        }
        const duration = Math.max(0, timeToMinutes(sess.endTime) - timeToMinutes(sess.startTime));

        // Create breakdown entry if not exists
        if (!subjectStats[subId]) {
          const sub = knownSub || {
            id: subId,
            code: sess.subjectCode || '???',
            name: sess.subjectName || 'วิชาทั่วไป',
            colorId: 'indigo',
            gradeGroup: sess.gradeGroup || '',
            termScope: 'both',
          };
          subjectStats[subId] = {
            subject: sub,
            plannedCount: 0,
            normalCount: 0,
            cancelledCount: 0,
            activityCount: 0,
            makeupCount: 0,
            completedCount: 0,
            taughtMinutes: 0,
            plannedMinutes: 0,
            plannedWeeksSet: new Set(),
            taughtWeeksSet: new Set(),
          };
        }

        const stat = subjectStats[subId];
        const periodWeight = Number(sess.periods) || 1;

        if (!sess.isCustomSession) {
          stat.plannedCount += periodWeight;
          totalPlannedCount += periodWeight;
          stat.plannedMinutes += duration;
          totalPlannedMinutes += duration;
          stat.plannedWeeksSet.add(weekKey);
          allPlannedWeeksSet.add(weekKey);
        }

        if (sess.status === 'normal' || sess.status === 'makeup') {
          stat.taughtWeeksSet.add(weekKey);
          allTaughtWeeksSet.add(weekKey);
        }

        if (sess.status === 'normal') {
          stat.normalCount += periodWeight;
          stat.completedCount += periodWeight;
          stat.taughtMinutes += duration;

          totalNormalCount += periodWeight;
          totalCompletedCount += periodWeight;
          totalTaughtMinutes += duration;
        } else if (sess.status === 'cancelled') {
          stat.cancelledCount += periodWeight;
          totalCancelledCount += periodWeight;

          historyLogs.push({
            id: sess.id,
            date: dateStr,
            subjectCode: sess.subjectCode,
            subjectName: sess.subjectName,
            gradeGroup: sess.gradeGroup,
            periods: periodWeight,
            time: `${sess.startTime} - ${sess.endTime}`,
            status: 'cancelled',
            statusLabel: 'งดสอน',
            reason: sess.reason || 'ไม่ได้ระบุเหตุผล',
            topic: sess.topic,
            notes: sess.notes,
          });
        } else if (sess.status === 'activity') {
          stat.activityCount += periodWeight;
          totalActivityCount += periodWeight;

          historyLogs.push({
            id: sess.id,
            date: dateStr,
            subjectCode: sess.subjectCode,
            subjectName: sess.subjectName,
            gradeGroup: sess.gradeGroup,
            periods: periodWeight,
            time: `${sess.startTime} - ${sess.endTime}`,
            status: 'activity',
            statusLabel: 'ติดกิจกรรม',
            reason: sess.reason || 'กิจกรรมโรงเรียน/ภายนอก',
            topic: sess.topic,
            notes: sess.notes,
          });
        } else if (sess.status === 'makeup') {
          stat.makeupCount += periodWeight;
          stat.completedCount += periodWeight;
          stat.taughtMinutes += duration;

          totalMakeupCount += periodWeight;
          totalCompletedCount += periodWeight;
          totalTaughtMinutes += duration;

          historyLogs.push({
            id: sess.id,
            date: dateStr,
            subjectCode: sess.subjectCode,
            subjectName: sess.subjectName,
            gradeGroup: sess.gradeGroup,
            periods: periodWeight,
            time: `${sess.startTime} - ${sess.endTime}`,
            status: 'makeup',
            statusLabel: 'สอนชดเชย',
            reason: sess.reason || 'สอนชดเชย',
            topic: sess.topic,
            notes: sess.notes,
          });
        }
      }
    }

    // Advance 1 day
    curDate.setDate(curDate.getDate() + 1);
  }

  // Calculate completion percentages
  const overallCompletionRate = totalPlannedCount > 0
    ? Math.min(100, Math.round((totalCompletedCount / totalPlannedCount) * 100))
    : 0;

  const subjectBreakdown = Object.values(subjectStats).map(s => {
    const rate = s.plannedCount > 0
      ? Math.min(100, Math.round((s.completedCount / s.plannedCount) * 100))
      : 0;
    return {
      ...s,
      plannedWeeksCount: s.plannedWeeksSet ? s.plannedWeeksSet.size : 0,
      taughtWeeksCount: s.taughtWeeksSet ? s.taughtWeeksSet.size : 0,
      completionRate: rate,
      taughtDurationText: formatDurationThai(s.taughtMinutes),
      taughtDurationShort: formatDurationShortThai(s.taughtMinutes),
      plannedDurationText: formatDurationThai(s.plannedMinutes),
    };
  }).sort((a, b) => b.plannedCount - a.plannedCount);

  // Sort history logs descending by date
  historyLogs.sort((a, b) => b.date.localeCompare(a.date));

  return {
    scopeType,
    rangeStart,
    rangeEnd,
    totalPlannedCount,
    totalCompletedCount,
    totalNormalCount,
    totalCancelledCount,
    totalActivityCount,
    totalMakeupCount,
    totalTaughtMinutes,
    totalPlannedMinutes,
    totalPlannedWeeks: allPlannedWeeksSet.size,
    totalTaughtWeeks: allTaughtWeeksSet.size,
    overallCompletionRate,
    taughtDurationText: formatDurationThai(totalTaughtMinutes),
    taughtDurationShort: formatDurationShortThai(totalTaughtMinutes),
    plannedDurationText: formatDurationThai(totalPlannedMinutes),
    subjectBreakdown,
    historyLogs,
  };
}
