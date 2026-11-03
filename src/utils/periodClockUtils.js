import { useState, useEffect } from 'react';
import { jsDayToThaiDay, THAI_DAYS, toDateString, formatThaiDate } from './dateUtils';
import { DEFAULT_PERIODS, DEFAULT_ACTIVITIES, getSlotPeriodMapping } from './periodConfig';
import { getColorById, SESSION_STATUS } from './colors';
import { getMultiDayEventsForDate } from '../services/calendarGenerator';

/**
 * Convert "HH:MM" or "HH:MM:SS" string to total seconds from midnight
 */
export function timeStrToSeconds(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  const h = parts[0] || 0;
  const m = parts[1] || 0;
  const s = parts[2] || 0;
  return h * 3600 + m * 60 + s;
}

/**
 * Convert Date object to total seconds from midnight
 */
export function dateToSeconds(date) {
  return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
}

/**
 * Format Date object into "HH:MM:SS"
 */
export function formatClockHMS(date) {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

/**
 * Break down total seconds into minutes and seconds + formatted strings
 * Strictly "X นาที Y วินาที" as requested by user
 */
export function formatMinutesSeconds(totalSeconds) {
  const safeSec = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSec / 60);
  const seconds = safeSec % 60;
  const paddedMin = String(minutes).padStart(2, '0');
  const paddedSec = String(seconds).padStart(2, '0');

  return {
    totalSeconds: safeSec,
    minutes,
    seconds,
    digital: `${paddedMin}:${paddedSec}`,
    thaiFull: `${minutes} นาที ${paddedSec} วินาที`,
    thaiCompact: `${minutes} น. ${paddedSec} วินาที`,
  };
}

/**
 * Core calculation for current period, elapsed time, remaining time,
 * subject being taught, and upcoming period.
 */
export function computeLivePeriodState({
  now = new Date(),
  periods = DEFAULT_PERIODS,
  slots = [],
  subjects = [],
  activeSemester = null,
  overrides = [],
  multiDayEvents = [],
}) {
  const currentSec = dateToSeconds(now);
  const todayStr = toDateString(now);
  const thaiDayIndex = jsDayToThaiDay(now.getDay()); // 1=Mon .. 7=Sun
  const thaiDayInfo = THAI_DAYS.find(d => d.index === thaiDayIndex) || THAI_DAYS[0];
  const isWeekend = thaiDayIndex >= 6;

  // Normalize & sort periods by startTime
  const normalizedPeriods = (periods && periods.length > 0 ? periods : DEFAULT_PERIODS)
    .map(p => {
      const startSec = timeStrToSeconds(p.startTime);
      const endSec = timeStrToSeconds(p.endTime);
      return {
        ...p,
        startSec,
        endSec,
        durationSec: Math.max(1, endSec - startSec),
      };
    })
    .sort((a, b) => a.startSec - b.startSec);

  const firstPeriod = normalizedPeriods[0];
  const lastPeriod = normalizedPeriods[normalizedPeriods.length - 1];

  // Build subject map
  const subjectMap = new Map((subjects || []).map(s => [s.id, s]));

  // Filter today's slots for active semester (if weekend, we also allow previewing daySlots if simulated)
  const targetDayOfWeek = isWeekend ? 1 : thaiDayIndex;
  const semesterSlots = activeSemester
    ? (slots || []).filter(s => s.semesterId === activeSemester.id)
    : (slots || []);

  const todaySlots = semesterSlots
    .filter(s => s.dayOfWeek === thaiDayIndex)
    .sort((a, b) => timeStrToSeconds(a.startTime) - timeStrToSeconds(b.startTime));

  // Map period number -> slot info for today
  const periodToSlotMap = {};
  const activeMultiDayEvents = getMultiDayEventsForDate(todayStr, multiDayEvents);
  const primaryMultiDay = activeMultiDayEvents.find(mde => mde.cancelClasses) || activeMultiDayEvents[0];

  for (const slot of todaySlots) {
    const mapping = getSlotPeriodMapping(slot, normalizedPeriods);
    if (!mapping) continue;

    const subject = subjectMap.get(slot.subjectId) || {
      id: slot.subjectId,
      code: '???',
      name: 'ไม่พบรายวิชา',
      defaultRoom: '-',
      gradeGroup: '',
      colorId: 'indigo',
    };
    const color = getColorById(subject.colorId);
    const override = (overrides || []).find(o => o.date === todayStr && o.slotId === slot.id);

    let status = 'normal';
    let statusReason = '';
    if (override && override.status) {
      status = override.status;
      statusReason = override.reason || override.topic || '';
    } else if (primaryMultiDay && primaryMultiDay.cancelClasses) {
      status = primaryMultiDay.type === 'cancelled' ? 'cancelled' : 'activity';
      statusReason = primaryMultiDay.title || '';
    }

    const statusInfo = SESSION_STATUS[status.toUpperCase()] || SESSION_STATUS.NORMAL;
    const room = override?.room || slot.roomOverride || subject.defaultRoom || '-';

    // Find start and end seconds of the entire multi-period span
    const startPeriodObj = normalizedPeriods.find(p => p.period === mapping.startPeriod);
    const endPeriodNum = mapping.startPeriod + mapping.span - 1;
    const endPeriodObj = normalizedPeriods.find(p => p.period === endPeriodNum);

    const slotStartSec = startPeriodObj ? startPeriodObj.startSec : timeStrToSeconds(slot.startTime);
    const slotEndSec = endPeriodObj ? endPeriodObj.endSec : timeStrToSeconds(slot.endTime);

    const enrichedSlot = {
      slot,
      subject,
      color,
      room,
      status,
      statusInfo,
      statusReason,
      override,
      startPeriod: mapping.startPeriod,
      endPeriod: endPeriodNum,
      span: mapping.span,
      slotStartTime: startPeriodObj?.startTime || slot.startTime,
      slotEndTime: endPeriodObj?.endTime || slot.endTime,
      slotStartSec,
      slotEndSec,
      slotDurationSec: Math.max(1, slotEndSec - slotStartSec),
    };

    for (let i = 0; i < mapping.span; i++) {
      periodToSlotMap[mapping.startPeriod + i] = enrichedSlot;
    }
  }

  // Determine current phase and active period
  let phase = 'outside_hours'; // 'before_school' | 'in_period' | 'lunch' | 'between_periods' | 'after_school'
  let currentPeriod = null;
  let nextPeriod = null;
  let elapsedSec = 0;
  let remainingSec = 0;
  let durationSec = 1;
  let progressPercent = 0;

  // 1. Check if inside any period
  for (let i = 0; i < normalizedPeriods.length; i++) {
    const p = normalizedPeriods[i];
    if (currentSec >= p.startSec && currentSec < p.endSec) {
      currentPeriod = p;
      nextPeriod = normalizedPeriods[i + 1] || null;
      phase = p.isLunch ? 'lunch' : 'in_period';
      elapsedSec = currentSec - p.startSec;
      remainingSec = p.endSec - currentSec;
      durationSec = p.durationSec;
      progressPercent = Math.min(100, Math.max(0, (elapsedSec / durationSec) * 100));
      break;
    }
  }

  // 2. If not inside a period, check before school, between periods, or after school
  if (!currentPeriod && normalizedPeriods.length > 0) {
    if (currentSec < firstPeriod.startSec) {
      phase = 'before_school';
      nextPeriod = firstPeriod;
      elapsedSec = 0;
      remainingSec = firstPeriod.startSec - currentSec;
      durationSec = Math.max(1, remainingSec);
      progressPercent = 0;
    } else if (currentSec >= lastPeriod.endSec) {
      phase = 'after_school';
      elapsedSec = currentSec - lastPeriod.endSec;
      remainingSec = 0;
      durationSec = 1;
      progressPercent = 100;
    } else {
      // Between two periods (break time)
      for (let i = 0; i < normalizedPeriods.length - 1; i++) {
        const prevP = normalizedPeriods[i];
        const nextP = normalizedPeriods[i + 1];
        if (currentSec >= prevP.endSec && currentSec < nextP.startSec) {
          phase = 'between_periods';
          currentPeriod = {
            period: 'break',
            label: `พักเปลี่ยนคาบ (${prevP.label} → ${nextP.label})`,
            startTime: prevP.endTime,
            endTime: nextP.startTime,
            isLunch: false,
            isBreak: true,
          };
          nextPeriod = nextP;
          elapsedSec = currentSec - prevP.endSec;
          remainingSec = nextP.startSec - currentSec;
          durationSec = Math.max(1, nextP.startSec - prevP.endSec);
          progressPercent = Math.min(100, Math.max(0, (elapsedSec / durationSec) * 100));
          break;
        }
      }
    }
  }

  // Current period's teaching slot or activity
  const currentPeriodNum = currentPeriod && !currentPeriod.isLunch && !currentPeriod.isBreak
    ? Number(currentPeriod.period)
    : null;

  const currentSlotInfo = currentPeriodNum ? periodToSlotMap[currentPeriodNum] || null : null;
  const currentDefaultActivity =
    currentPeriodNum === 7 && !currentSlotInfo && !isWeekend
      ? DEFAULT_ACTIVITIES[thaiDayIndex] || null
      : null;

  // Multi-period span calculations (if current slot spans > 1 period)
  let multiSpanTiming = null;
  if (currentSlotInfo && currentSlotInfo.span > 1) {
    const spanElapsed = Math.max(0, currentSec - currentSlotInfo.slotStartSec);
    const spanRemaining = Math.max(0, currentSlotInfo.slotEndSec - currentSec);
    const spanProgress = Math.min(100, Math.max(0, (spanElapsed / currentSlotInfo.slotDurationSec) * 100));
    multiSpanTiming = {
      startPeriod: currentSlotInfo.startPeriod,
      endPeriod: currentSlotInfo.endPeriod,
      span: currentSlotInfo.span,
      startTime: currentSlotInfo.slotStartTime,
      endTime: currentSlotInfo.slotEndTime,
      elapsed: formatMinutesSeconds(spanElapsed),
      remaining: formatMinutesSeconds(spanRemaining),
      progressPercent: spanProgress,
    };
  }

  // Find next teaching class today (after current period or current slot)
  let nextTeachingSlotInfo = null;
  let secondsUntilNextTeaching = null;
  for (const p of normalizedPeriods) {
    if (p.isLunch) continue;
    const pNum = Number(p.period);
    if (p.startSec > currentSec) {
      const candidate = periodToSlotMap[pNum];
      if (candidate) {
        // Avoid picking the second half of the currently active multi-period slot
        if (!currentSlotInfo || candidate.slot.id !== currentSlotInfo.slot.id) {
          nextTeachingSlotInfo = {
            ...candidate,
            periodObj: p,
          };
          secondsUntilNextTeaching = p.startSec - currentSec;
          break;
        }
      }
    }
  }

  // Determine urgency level for pacing color
  // - critical: <= 3 minutes left in period
  // - warning: <= 10 minutes left in period
  // - normal: > 10 minutes left
  let urgency = 'normal';
  if (phase === 'in_period') {
    if (remainingSec <= 180) {
      urgency = 'critical';
    } else if (remainingSec <= 600) {
      urgency = 'warning';
    }
  } else if (phase === 'lunch') {
    if (remainingSec <= 300) {
      urgency = 'warning';
    }
  }

  return {
    now,
    clockHMS: formatClockHMS(now),
    todayStr,
    thaiDateFull: formatThaiDate(todayStr, 'withDay'),
    thaiDateShort: formatThaiDate(todayStr, 'short'),
    thaiDayIndex,
    thaiDayInfo,
    isWeekend,
    targetDayOfWeek,
    phase,
    currentPeriod,
    currentPeriodNum,
    nextPeriod,
    elapsed: formatMinutesSeconds(elapsedSec),
    remaining: formatMinutesSeconds(remainingSec),
    durationSec,
    progressPercent,
    urgency,
    currentSlotInfo,
    currentDefaultActivity,
    multiSpanTiming,
    nextTeachingSlotInfo,
    untilNextTeaching: secondsUntilNextTeaching !== null ? formatMinutesSeconds(secondsUntilNextTeaching) : null,
    periodToSlotMap,
    normalizedPeriods,
  };
}

/**
 * Custom React Hook that ticks every second (1000ms) and supports optional time simulation offset
 * so the user can test any period anytime.
 */
export function useRealtimePeriodClock({
  periods,
  slots,
  subjects,
  activeSemester,
  overrides,
  multiDayEvents,
}) {
  // Optional time offset in seconds for testing/simulation (0 = real local time)
  const [simulatedOffsetSec, setSimulatedOffsetSec] = useState(0);
  // Optional simulated day of week override (null = real day)
  const [simulatedDayIndex, setSimulatedDayIndex] = useState(null);
  const [tickNow, setTickNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTickNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute effective Date
  const effectiveNow = new Date(tickNow.getTime() + simulatedOffsetSec * 1000);
  if (simulatedDayIndex !== null) {
    const currentThaiDay = jsDayToThaiDay(effectiveNow.getDay());
    const dayDiff = simulatedDayIndex - currentThaiDay;
    effectiveNow.setDate(effectiveNow.getDate() + dayDiff);
  }

  const jumpToSimulatedTime = (timeStr, targetDay = null) => {
    const realNow = new Date();
    const realSec = dateToSeconds(realNow);
    const targetSec = timeStrToSeconds(timeStr);
    setSimulatedOffsetSec(targetSec - realSec);
    if (targetDay !== null) {
      setSimulatedDayIndex(targetDay);
    } else if (jsDayToThaiDay(realNow.getDay()) >= 6) {
      // If today is weekend, default simulation to Monday so timetable slots show up
      setSimulatedDayIndex(1);
    }
  };

  const resetToRealTime = () => {
    setSimulatedOffsetSec(0);
    setSimulatedDayIndex(null);
  };

  const isSimulated = simulatedOffsetSec !== 0 || simulatedDayIndex !== null;

  const state = computeLivePeriodState({
    now: effectiveNow,
    periods,
    slots,
    subjects,
    activeSemester,
    overrides,
    multiDayEvents,
  });

  return {
    ...state,
    isSimulated,
    simulatedDayIndex,
    jumpToSimulatedTime,
    resetToRealTime,
    setSimulatedDayIndex,
  };
}
