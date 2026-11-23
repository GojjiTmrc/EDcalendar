import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Clock,
  MapPin,
  ClipboardCheck,
  NotebookPen,
  PartyPopper,
  Check,
  Plus,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { getSessionsForDate, getMultiDayEventsForDate } from '../../services/calendarGenerator';
import { calculateTeachingSummary } from '../../services/summaryService';
import { toDateString, formatThaiDate, timeToMinutes, parseDateString } from '../../utils/dateUtils';
import { getMoodLevel } from '../../utils/moodConfig';
import SessionDetailModal from '../Calendar/SessionDetailModal';

const STATUS_NO_TEACH = new Set(['cancelled', 'activity', 'holiday']);

function nowMinutes(now) {
  return now.getHours() * 60 + now.getMinutes();
}

/** One-page "today" overview: today's classes, pending logs, due homework and what's next. */
export default function TodayDashboard({
  semester,
  slots = [],
  subjects = [],
  overrides = [],
  multiDayEvents = [],
  shortNotes = [],
  onSaveOverride,
  onResetOverride,
  onDeleteCustomSession,
  onOpenAddShortNote,
  onOpenEditShortNote,
  onToggleCompleteShortNote,
  onGoTo,
}) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  const todayStr = toDateString(now);
  const [selected, setSelected] = useState(null); // { session, tab }

  const sessions = useMemo(
    () => getSessionsForDate(todayStr, semester, slots, subjects, overrides, multiDayEvents),
    [todayStr, semester, slots, subjects, overrides, multiDayEvents]
  );

  const todayEvents = useMemo(() => getMultiDayEventsForDate(todayStr, multiDayEvents), [todayStr, multiDayEvents]);

  const summary = useMemo(
    () => calculateTeachingSummary(semester, slots, subjects, overrides, multiDayEvents, 'todate'),
    [semester, slots, subjects, overrides, multiDayEvents]
  );
  const pendingLogs = summary?.pendingConfirmLogs || [];

  // Next upcoming teaching day (when today has no classes left or none at all)
  const nextClassDay = useMemo(() => {
    if (!semester) return null;
    const cursor = parseDateString(todayStr);
    for (let i = 1; i <= 30; i += 1) {
      cursor.setDate(cursor.getDate() + 1);
      const dateStr = toDateString(cursor);
      if (dateStr > semester.endDate) return null;
      const list = getSessionsForDate(dateStr, semester, slots, subjects, overrides, multiDayEvents).filter(
        (s) => !STATUS_NO_TEACH.has(s.status)
      );
      if (list.length > 0) return { dateStr, sessions: list };
    }
    return null;
  }, [semester, slots, subjects, overrides, multiDayEvents, todayStr]);

  const dueNotes = useMemo(
    () =>
      shortNotes
        .filter((n) => !n.isCompleted && n.dueDate && n.dueDate <= todayStr)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [shortNotes, todayStr]
  );

  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);

  const nowMin = nowMinutes(now);
  const teachingToday = sessions.filter((s) => !STATUS_NO_TEACH.has(s.status));
  const currentSession = teachingToday.find(
    (s) => timeToMinutes(s.startTime) <= nowMin && nowMin < timeToMinutes(s.endTime)
  );
  const upcomingSession = teachingToday.find((s) => timeToMinutes(s.startTime) > nowMin);
  const doneCount = teachingToday.filter((s) => timeToMinutes(s.endTime) <= nowMin).length;

  const statusFor = (s) => {
    if (STATUS_NO_TEACH.has(s.status)) return { label: s.statusInfo?.label || s.status, tone: 'rose' };
    const start = timeToMinutes(s.startTime);
    const end = timeToMinutes(s.endTime);
    if (nowMin >= end) return { label: 'จบแล้ว', tone: 'slate' };
    if (nowMin >= start) return { label: 'กำลังสอน', tone: 'emerald' };
    return { label: `อีก ${formatGap(start - nowMin)}`, tone: 'indigo' };
  };

  const toneClass = {
    rose: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300',
  };

  if (!semester) {
    return (
      <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">ยังไม่มีภาคเรียนที่ใช้งาน</div>
    );
  }

  const isOutOfSemester = todayStr < semester.startDate || todayStr > semester.endDate;
  const subjectLabel = (note) => {
    const sub = subjectMap.get(note.subjectId);
    return sub ? `${sub.code} ${sub.gradeGroup || ''}`.trim() : 'ทั่วไป';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl p-5 bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md">
        <div className="flex items-center gap-2 text-indigo-100 text-xs font-medium">
          <CalendarDays className="w-4 h-4" />
          <span>{formatThaiDate(todayStr, 'full')}</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold mt-1">
          {currentSession
            ? `กำลังสอน ${currentSession.subjectCode} ${currentSession.gradeGroup || ''}`
            : upcomingSession
            ? `คาบถัดไป ${upcomingSession.startTime} น. · ${upcomingSession.subjectCode} ${upcomingSession.gradeGroup || ''}`
            : teachingToday.length > 0
            ? 'วันนี้สอนครบแล้ว 🎉'
            : 'วันนี้ไม่มีคาบสอน'}
        </h2>
        <p className="text-sm text-indigo-100 mt-1">
          {teachingToday.length > 0
            ? `สอนไปแล้ว ${doneCount}/${teachingToday.length} คาบ`
            : isOutOfSemester
            ? 'วันนี้อยู่นอกช่วงภาคเรียนที่เลือก'
            : 'พักผ่อนหรือเตรียมสอนล่วงหน้าได้เลย'}
          {pendingLogs.length > 0 && ` · ค้างบันทึกหลังสอน ${pendingLogs.length} คาบ`}
          {dueNotes.length > 0 && ` · งานถึงกำหนด ${dueNotes.length} รายการ`}
        </p>
      </div>

      {todayEvents.length > 0 && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-3 text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2">
          <PartyPopper className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            {todayEvents.map((e) => (
              <div key={e.id}>
                <span className="font-semibold">{e.title}</span>
                {e.cancelClasses ? ' (งดสอน)' : ''}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Today's classes */}
        <section className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" /> คาบสอนวันนี้
            </h3>
            <button
              type="button"
              onClick={() => onGoTo?.('timetable')}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
            >
              ดูตารางสอน <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {sessions.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">ไม่มีคาบสอนวันนี้</p>
          ) : (
            <ul className="space-y-2">
              {sessions.map((s) => {
                const st = statusFor(s);
                const mood = getMoodLevel(s.postTeachingMood);
                const hasLog = Boolean(s.postTeachingLog && s.postTeachingLog.trim());
                const isNow = currentSession?.id === s.id;
                const needsLog = !STATUS_NO_TEACH.has(s.status) && timeToMinutes(s.endTime) <= nowMin && !hasLog;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => setSelected({ session: s, tab: needsLog ? 'postLog' : 'plan' })}
                      className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                        isNow
                          ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/20'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <span className={`w-1.5 self-stretch rounded-full ${s.color?.accent || 'bg-indigo-500'}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                            {s.subjectCode} {s.subjectName}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">{s.gradeGroup}</span>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${toneClass[st.tone]}`}>
                            {st.label}
                          </span>
                          {mood && <span title={mood.label}>{mood.emoji}</span>}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-3 flex-wrap">
                          <span>
                            {s.startTime} - {s.endTime} น.
                          </span>
                          {s.room && s.room !== '-' && (
                            <span className="inline-flex items-center gap-0.5">
                              <MapPin className="w-3 h-3" /> {s.room}
                            </span>
                          )}
                          {s.topic && <span className="truncate">หัวข้อ: {s.topic}</span>}
                        </div>
                      </div>
                      {needsLog && (
                        <span className="shrink-0 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/50 px-2 py-1 rounded-lg">
                          บันทึกหลังสอน
                        </span>
                      )}
                      {hasLog && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {nextClassDay && (!upcomingSession || teachingToday.length === 0) && (
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              คาบสอนถัดไป: {formatThaiDate(nextClassDay.dateStr, 'short')} เวลา {nextClassDay.sessions[0].startTime} น.
              ({nextClassDay.sessions[0].subjectCode} {nextClassDay.sessions[0].gradeGroup})
            </p>
          )}
        </section>

        <div className="space-y-4">
          {/* Pending post-class logs */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2">
              <ClipboardCheck className="w-4 h-4 text-amber-500" /> ค้างบันทึกหลังสอน
              {pendingLogs.length > 0 && (
                <span className="text-[11px] bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded-full">
                  {pendingLogs.length}
                </span>
              )}
            </h3>
            {pendingLogs.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">บันทึกครบแล้ว เยี่ยมมาก ✨</p>
            ) : (
              <ul className="space-y-1.5">
                {pendingLogs.slice(0, 5).map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setSelected({ session: p, tab: 'postLog' })}
                      className="w-full text-left text-sm px-2.5 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between gap-2"
                    >
                      <span className="truncate text-slate-700 dark:text-slate-200">
                        {p.subjectCode} {p.gradeGroup}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                        {formatThaiDate(p.date, 'short')}
                      </span>
                    </button>
                  </li>
                ))}
                {pendingLogs.length > 5 && (
                  <li>
                    <button
                      type="button"
                      onClick={() => onGoTo?.('summary')}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline px-2.5"
                    >
                      ดูทั้งหมด {pendingLogs.length} รายการในหน้าสรุปผล
                    </button>
                  </li>
                )}
              </ul>
            )}
          </section>

          {/* Due homework */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <NotebookPen className="w-4 h-4 text-sky-500" /> งานถึงกำหนด/เลยกำหนด
              </h3>
              <button
                type="button"
                onClick={() => onOpenAddShortNote?.(todayStr, '')}
                title="เพิ่มบันทึกสั้น (ปุ่มลัด N)"
                className="p-1 rounded-md text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {dueNotes.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">ไม่มีงานค้างตรวจ</p>
            ) : (
              <ul className="space-y-1.5">
                {dueNotes.slice(0, 6).map((n) => (
                  <li key={n.id} className="flex items-start gap-2 text-sm">
                    <button
                      type="button"
                      onClick={() => onToggleCompleteShortNote?.(n.id)}
                      title="ตรวจเรียบร้อยแล้ว"
                      className="mt-0.5 w-4 h-4 rounded border border-slate-300 dark:border-slate-600 hover:border-emerald-500 shrink-0"
                    />
                    <button
                      type="button"
                      onClick={() => onOpenEditShortNote?.(n)}
                      className="text-left min-w-0 flex-1"
                    >
                      <div className="truncate text-slate-700 dark:text-slate-200">{n.title}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        {n.dueDate < todayStr && <AlertTriangle className="w-3 h-3 text-rose-500" />}
                        {subjectLabel(n)} · {n.dueDate === todayStr ? 'วันนี้' : formatThaiDate(n.dueDate, 'short')}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <SessionDetailModal
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        session={selected?.session || null}
        dateStr={selected?.session?.date}
        initialTab={selected?.tab || 'plan'}
        subjects={subjects}
        semesterId={semester?.id}
        shortNotes={shortNotes}
        onSaveOverride={onSaveOverride}
        onResetOverride={onResetOverride}
        onDeleteCustomSession={onDeleteCustomSession}
        onOpenAddShortNote={onOpenAddShortNote}
        onOpenEditShortNote={onOpenEditShortNote}
        onToggleCompleteShortNote={onToggleCompleteShortNote}
      />
    </div>
  );
}

function formatGap(minutes) {
  if (minutes < 60) return `${minutes} นาที`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} ชม. ${m} นาที` : `${h} ชม.`;
}
