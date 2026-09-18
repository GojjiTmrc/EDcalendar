import React from 'react';
import { Plus, Clock, MapPin, AlertCircle, Ban, BookOpen, Flag } from 'lucide-react';
import { getSchoolWeekDates, formatThaiDate, toDateString } from '../../utils/dateUtils';
import { SESSION_STATUS, getColorById } from '../../utils/colors';

export default function WeekView({
  currentDate,
  sessionsMap = {},
  multiDayEventsMap = {},
  shortNotes = [],
  onSelectSession,
  onSelectDate,
  onEditMultiDayEvent,
  onEditShortNote,
}) {
  const weekDays = getSchoolWeekDates(currentDate);
  const todayStr = toDateString(new Date());

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      
      {/* 5-Day School Week Columns (Mon-Fri) */}
      <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
        {weekDays.map((day) => {
          const sessions = sessionsMap[day.dateString] || [];
          const multiDayEvents = multiDayEventsMap[day.dateString] || [];
          const isToday = day.dateString === todayStr;

          return (
            <div key={day.dateString} className="flex flex-col min-h-[440px] bg-white dark:bg-slate-900">
              
              {/* Day Column Header */}
              <div
                className={`p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between ${
                  isToday
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-b-2 border-b-indigo-500'
                    : 'bg-slate-50/60 dark:bg-slate-800/40'
                }`}
              >
                <div>
                  <div className={`text-xs font-bold ${day.thaiDay?.color || 'text-slate-700'}`}>
                    {day.thaiDay?.full || ''}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    {day.dayNumber} {formatThaiDate(day.dateString, 'short').split(' ')[1]}
                  </div>
                </div>

                <button
                  onClick={() => onSelectDate(day.dateString)}
                  title={`บันทึกกิจกรรมหรือชดเชยในวันที่ ${day.dayNumber}`}
                  className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Multi-Day Event Banner */}
              {multiDayEvents.length > 0 && (
                <div className="p-2 bg-slate-50/80 dark:bg-slate-850/60 border-b border-slate-100 dark:border-slate-800 space-y-1">
                  {multiDayEvents.map((mde) => {
                    const mdeColor = getColorById(mde.colorId || 'amber');
                    return (
                      <button
                        key={mde.id}
                        onClick={() => onEditMultiDayEvent && onEditMultiDayEvent(mde)}
                        className={`w-full text-left p-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all hover:scale-[1.01] ${mdeColor.bg} ${mdeColor.border} ${mdeColor.text}`}
                      >
                        <Flag className="w-3 h-3 shrink-0" />
                        <span className="truncate">{mde.title}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Short Notes for this day */}
              {(() => {
                const dayNotes = shortNotes.filter(n => n.dueDate === day.dateString);
                if (dayNotes.length === 0) return null;
                return (
                  <div className="p-2 bg-amber-50/60 dark:bg-amber-950/30 border-b border-amber-200/70 dark:border-amber-800/50 space-y-1">
                    {dayNotes.map((note) => {
                      const isOverdue = !note.isCompleted && note.dueDate < todayStr;
                      return (
                        <button
                          key={note.id}
                          onClick={() => onEditShortNote && onEditShortNote(note)}
                          className={`w-full text-left p-1.5 rounded-lg text-xs font-semibold border flex items-start gap-1.5 transition-all hover:scale-[1.01] ${
                            note.isCompleted
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 line-through opacity-75'
                              : isOverdue
                              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                              : 'bg-amber-100/90 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 shadow-xs'
                          }`}
                        >
                          <span className="shrink-0 mt-0.5">{note.isCompleted ? '✓' : '📝'}</span>
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-semibold">{note.title}</div>
                            <div className="text-[10px] opacity-80">{note.duePeriod || 'ในคาบเรียน'}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Sessions List */}
              <div className="p-2.5 flex-1 space-y-2 overflow-y-auto">
                {sessions.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-10 text-slate-400 dark:text-slate-600">
                    <p className="text-xs">ไม่มีคาบสอน</p>
                    <button
                      onClick={() => onSelectDate(day.dateString)}
                      className="mt-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>เพิ่มรายการ</span>
                    </button>
                  </div>
                ) : (
                  sessions.map((sess) => {
                    const isCancelled = sess.status === 'cancelled';
                    const isActivity = sess.status === 'activity';
                    const isMakeup = sess.status === 'makeup';

                    return (
                      <div
                        key={sess.id}
                        onClick={() => onSelectSession(sess)}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all hover:shadow-md hover:scale-[1.01] ${
                          isCancelled
                            ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900'
                            : isActivity
                            ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900'
                            : isMakeup
                            ? 'bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-900'
                            : `${sess.color?.bg} ${sess.color?.border}`
                        }`}
                      >
                        {/* Time & Badge */}
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {sess.startTime} - {sess.endTime}
                          </span>
                          
                          {sess.status !== 'normal' && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${sess.statusInfo?.badgeClass}`}>
                              {sess.statusInfo?.label}
                            </span>
                          )}
                        </div>

                        {/* Subject info */}
                        <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between">
                          <span className={`line-clamp-1 ${isCancelled ? 'line-through text-slate-500' : ''}`}>
                            {sess.subjectName}
                          </span>
                          {sess.room && (
                            <span className="text-[10px] text-slate-500 font-normal shrink-0 ml-1">
                              {sess.room}
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium flex items-center justify-between">
                          <span>{sess.subjectCode} {sess.gradeGroup ? `(${sess.gradeGroup})` : ''}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-white/80 dark:bg-black/40 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                            {sess.periods || 1} คาบ
                          </span>
                        </div>

                        {/* Reason / Activity note */}
                        {sess.reason && (
                          <div className="text-[11px] font-medium text-amber-700 dark:text-amber-300 mt-1.5 p-1 bg-white/60 dark:bg-black/30 rounded border border-amber-200/50">
                            {sess.reason}
                          </div>
                        )}

                        {/* Planned Topic */}
                        {sess.topic && (
                          <div className="text-[11px] font-semibold text-sky-900 dark:text-sky-200 mt-1.5 p-1.5 bg-sky-100/80 dark:bg-sky-950/60 rounded-lg border border-sky-200 dark:border-sky-800/60 flex items-start gap-1 shadow-2xs">
                            <span className="shrink-0">🎯</span>
                            <span className="line-clamp-2">{sess.topic}</span>
                          </div>
                        )}

                        {/* Prep Checklist Readiness Badge */}
                        {Array.isArray(sess.prepChecklist) && sess.prepChecklist.length > 0 && (
                          <div className="mt-1 flex items-center justify-between text-[10px]">
                            <span className={`px-1.5 py-0.5 rounded-md font-bold flex items-center gap-1 ${
                              sess.prepChecklist.every(i => i.isDone)
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                            }`}>
                              <span>📦</span>
                              <span>
                                {sess.prepChecklist.every(i => i.isDone)
                                  ? 'สื่อพร้อมครบแล้ว'
                                  : `สื่อ ${sess.prepChecklist.filter(i => i.isDone).length}/${sess.prepChecklist.length} รายการ`}
                              </span>
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
