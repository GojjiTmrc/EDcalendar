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

  // Initialize subject breakdown map
  const subjectStats = {};
  for (const sub of subjects) {
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
        const duration = Math.max(0, timeToMinutes(sess.endTime) - timeToMinutes(sess.startTime));

        // Create breakdown entry if not exists
        if (!subjectStats[subId]) {
          const sub = subjectMap.get(subId) || {
            id: subId,
            code: sess.subjectCode || '???',
            name: sess.subjectName || 'วิชาทั่วไป',
            colorId: 'indigo',
            gradeGroup: sess.gradeGroup || '',
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
