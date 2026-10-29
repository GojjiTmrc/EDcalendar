import { jsDayToThaiDay, parseDateString, toDateString, timeToMinutes } from '../utils/dateUtils';
import { getColorById, SESSION_STATUS } from '../utils/colors';

/**
 * Returns any multi-day events active on a specific date (YYYY-MM-DD)
 */
export function getMultiDayEventsForDate(dateStr, multiDayEvents = []) {
  if (!dateStr || !multiDayEvents) return [];
  return multiDayEvents.filter(
    mde => dateStr >= mde.startDate && dateStr <= mde.endDate
  );
}

/**
 * Returns all sessions for a specific date (YYYY-MM-DD),
 * merging recurring weekly slots with per-date overrides, multi-day events, and one-off events.
 */
export function getSessionsForDate(dateStr, semester, slots, subjects, overrides, multiDayEvents = []) {
  if (!dateStr || !semester) return [];

  const subjectMap = new Map((subjects || []).map(s => [s.id, s]));
  const d = parseDateString(dateStr);
  const dayOfWeek = jsDayToThaiDay(d.getDay()); // 1=Mon .. 7=Sun

  // Check if date falls within semester boundaries
  const isWithinSemester = dateStr >= semester.startDate && dateStr <= semester.endDate;

  // Active multi-day events on this date
  const activeMultiDayEvents = getMultiDayEventsForDate(dateStr, multiDayEvents);
  const primaryMultiDay = activeMultiDayEvents.find(mde => mde.cancelClasses) || activeMultiDayEvents[0];

  const results = [];

  // 1. Process recurring slots for this semester if date is within semester
  if (isWithinSemester) {
    const daySlots = (slots || []).filter(
      slot => slot.semesterId === semester.id && slot.dayOfWeek === dayOfWeek
    );

    for (const slot of daySlots) {
      const subject = subjectMap.get(slot.subjectId) || {
        id: slot.subjectId,
        code: '???',
        name: 'ไม่พบข้อมูลวิชา',
        defaultRoom: '-',
        gradeGroup: '',
        colorId: 'indigo',
      };

      // Check if there's an explicit manual override for this slot on this specific date
      const override = (overrides || []).find(
        ovr => ovr.date === dateStr && ovr.slotId === slot.id
      );

      const color = getColorById(subject.colorId);
      const periods = Number(slot.periods) || Number(subject.periods) || 1;

      if (override) {
        results.push({
          id: override.id || `session-${dateStr}-${slot.id}`,
          date: dateStr,
          slotId: slot.id,
          semesterId: semester.id,
          subjectId: slot.subjectId,
          subjectCode: subject.code,
          subjectName: subject.name,
          gradeGroup: subject.gradeGroup,
          periods: Number(override.periods) || periods,
          room: override.room || slot.roomOverride || subject.defaultRoom,
          startTime: override.startTime || slot.startTime,
          endTime: override.endTime || slot.endTime,
          color: color,
          status: override.status || 'normal',
          statusInfo: SESSION_STATUS[override.status?.toUpperCase()] || SESSION_STATUS.NORMAL,
          reason: override.reason || '',
          topic: override.topic || '',
          lessonPlan: override.lessonPlan || '',
          prepChecklist: override.prepChecklist || [],
          notes: override.notes || '',
          postTeachingLog: override.postTeachingLog || '',
          postTeachingLogUpdatedAt: override.postTeachingLogUpdatedAt || null,
          isOverridden: true,
          isCustomSession: false,
        });
      } else if (primaryMultiDay && primaryMultiDay.cancelClasses) {
        // Automatically affected by multi-day activity/event
        const eventStatus = primaryMultiDay.type === 'cancelled' ? 'cancelled' : 'activity';
        results.push({
          id: `session-${dateStr}-${slot.id}`,
          date: dateStr,
          slotId: slot.id,
          semesterId: semester.id,
          subjectId: slot.subjectId,
          subjectCode: subject.code,
          subjectName: subject.name,
          gradeGroup: subject.gradeGroup,
          periods: periods,
          room: slot.roomOverride || subject.defaultRoom,
          startTime: slot.startTime,
          endTime: slot.endTime,
          color: color,
          status: eventStatus,
          statusInfo: SESSION_STATUS[eventStatus.toUpperCase()] || SESSION_STATUS.ACTIVITY,
          reason: primaryMultiDay.title,
          topic: '',
          notes: primaryMultiDay.notes || '',
          postTeachingLog: '',
          postTeachingLogUpdatedAt: null,
          isOverridden: false,
          isFromMultiDay: true,
          multiDayEventId: primaryMultiDay.id,
          isCustomSession: false,
        });
      } else {
        // Normal recurring session
        results.push({
          id: `session-${dateStr}-${slot.id}`,
          date: dateStr,
          slotId: slot.id,
          semesterId: semester.id,
          subjectId: slot.subjectId,
          subjectCode: subject.code,
          subjectName: subject.name,
          gradeGroup: subject.gradeGroup,
          periods: periods,
          room: slot.roomOverride || subject.defaultRoom,
          startTime: slot.startTime,
          endTime: slot.endTime,
          color: color,
          status: 'normal',
          statusInfo: SESSION_STATUS.NORMAL,
          reason: '',
          topic: '',
          lessonPlan: '',
          prepChecklist: [],
          notes: '',
          postTeachingLog: '',
          postTeachingLogUpdatedAt: null,
          isOverridden: false,
          isCustomSession: false,
        });
      }
    }
  }

  // 2. Add custom one-off sessions (e.g. makeup sessions or ad-hoc activities) for this date
  const customSessions = (overrides || []).filter(
    ovr => ovr.date === dateStr && ovr.isCustomSession
  );

  for (const custom of customSessions) {
    const subject = subjectMap.get(custom.subjectId) || {
      id: custom.subjectId,
      code: custom.subjectCode || 'กิจกรรม',
      name: custom.subjectName || 'กิจกรรมพิเศษ / นอกตาราง',
      defaultRoom: custom.room || '-',
      gradeGroup: custom.gradeGroup || '',
      colorId: custom.colorId || 'sky',
    };
    const color = getColorById(subject.colorId);

    results.push({
      id: custom.id,
      date: dateStr,
      slotId: null,
      semesterId: semester.id,
      subjectId: custom.subjectId,
      subjectCode: subject.code,
      subjectName: subject.name,
      gradeGroup: subject.gradeGroup,
      periods: Number(custom.periods) || Number(subject.periods) || 1,
      room: custom.room || subject.defaultRoom,
      startTime: custom.startTime || '08:30',
      endTime: custom.endTime || '10:00',
      color: color,
      status: custom.status || 'makeup',
      statusInfo: SESSION_STATUS[custom.status?.toUpperCase()] || SESSION_STATUS.MAKEUP,
      reason: custom.reason || '',
      topic: custom.topic || '',
      lessonPlan: custom.lessonPlan || '',
      prepChecklist: custom.prepChecklist || [],
      notes: custom.notes || '',
      postTeachingLog: custom.postTeachingLog || '',
      postTeachingLogUpdatedAt: custom.postTeachingLogUpdatedAt || null,
      isOverridden: true,
      isCustomSession: true,
    });
  }

  // Sort chronologically by startTime
  return results.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
}

/**
 * Returns a map of dateStr -> sessions for an entire month
 */
export function getMonthSessionsMap(year, month, semester, slots, subjects, overrides, multiDayEvents = []) {
  const map = {};
  if (!semester) return map;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = toDateString(new Date(year, month, d));
    const sessions = getSessionsForDate(dateStr, semester, slots, subjects, overrides, multiDayEvents);
    if (sessions.length > 0) {
      map[dateStr] = sessions;
    }
  }
  return map;
}

/**
 * Returns a map of dateStr -> array of multiDayEvents active on that date
 */
export function getMonthMultiDayEventsMap(year, month, multiDayEvents = []) {
  const map = {};
  if (!multiDayEvents || multiDayEvents.length === 0) return map;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = toDateString(new Date(year, month, d));
    const active = getMultiDayEventsForDate(dateStr, multiDayEvents);
    if (active.length > 0) {
      map[dateStr] = active;
    }
  }
  return map;
}

/**
 * Collects all sessions that have a postTeachingLog recorded in the given semester,
 * grouped by date (YYYY-MM-DD).
 */
export function getPostTeachingLogsByDay(semester, slots = [], subjects = [], overrides = [], multiDayEvents = []) {
  if (!semester) return [];

  const semesterSlotIds = new Set(
    (slots || []).filter(s => s.semesterId === semester.id).map(s => s.id)
  );
  const subjectMap = new Map((subjects || []).map(s => [s.id, s]));
  const slotMap = new Map((slots || []).map(s => [s.id, s]));

  // Find all dates that have at least one override with postTeachingLog for this semester
  const relevantDates = new Set();
  for (const ovr of overrides || []) {
    if (!ovr.postTeachingLog || !ovr.postTeachingLog.trim()) continue;
    const belongsToSemester =
      ovr.semesterId === semester.id ||
      (ovr.slotId && semesterSlotIds.has(ovr.slotId)) ||
      (!ovr.semesterId && ovr.date >= semester.startDate && ovr.date <= semester.endDate);

    if (belongsToSemester && ovr.date) {
      relevantDates.add(ovr.date);
    }
  }

  const dayGroups = [];
  const sortedDates = Array.from(relevantDates).sort((a, b) => b.localeCompare(a));

  for (const dateStr of sortedDates) {
    const allDaySessions = getSessionsForDate(dateStr, semester, slots, subjects, overrides, multiDayEvents);
    let loggedSessions = allDaySessions.filter(s => s.postTeachingLog && s.postTeachingLog.trim());

    // Fallback if dateStr was outside semester startDate..endDate boundary
    if (loggedSessions.length === 0) {
      const dateOverrides = (overrides || []).filter(
        ovr => ovr.date === dateStr && ovr.postTeachingLog && ovr.postTeachingLog.trim()
      );
      loggedSessions = dateOverrides.map(ovr => {
        const slot = ovr.slotId ? slotMap.get(ovr.slotId) : null;
        const subId = ovr.subjectId || slot?.subjectId;
        const subject = subjectMap.get(subId) || {
          id: subId,
          code: ovr.subjectCode || 'วิชา',
          name: ovr.subjectName || 'รายวิชา',
          defaultRoom: ovr.room || '-',
          gradeGroup: ovr.gradeGroup || '',
          colorId: 'indigo',
        };
        const color = getColorById(subject.colorId);
        return {
          id: ovr.id || `session-${dateStr}-${ovr.slotId || 'custom'}`,
          date: dateStr,
          slotId: ovr.slotId || null,
          semesterId: semester.id,
          subjectId: subId,
          subjectCode: subject.code,
          subjectName: subject.name,
          gradeGroup: subject.gradeGroup,
          periods: Number(ovr.periods) || Number(slot?.periods) || Number(subject.periods) || 1,
          room: ovr.room || slot?.roomOverride || subject.defaultRoom,
          startTime: ovr.startTime || slot?.startTime || '08:30',
          endTime: ovr.endTime || slot?.endTime || '10:10',
          color,
          status: ovr.status || 'normal',
          statusInfo: SESSION_STATUS[ovr.status?.toUpperCase()] || SESSION_STATUS.NORMAL,
          reason: ovr.reason || '',
          topic: ovr.topic || '',
          lessonPlan: ovr.lessonPlan || '',
          prepChecklist: ovr.prepChecklist || [],
          notes: ovr.notes || '',
          postTeachingLog: ovr.postTeachingLog || '',
          postTeachingLogUpdatedAt: ovr.postTeachingLogUpdatedAt || null,
          isOverridden: true,
          isCustomSession: Boolean(ovr.isCustomSession),
        };
      }).sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    }

    if (loggedSessions.length > 0) {
      dayGroups.push({
        date: dateStr,
        sessions: loggedSessions,
        allDaySessions,
      });
    }
  }

  return dayGroups;
}
