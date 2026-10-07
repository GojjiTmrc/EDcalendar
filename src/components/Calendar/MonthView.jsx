import React from 'react';
import { Plus, AlertCircle, Ban, Clock, Flag } from 'lucide-react';
import { getSchoolWeekMonthGrid, toDateString, countDaysInRange } from '../../utils/dateUtils';
import { getColorById } from '../../utils/colors';

const SCHOOL_WEEKDAY_NAMES = [
  { short: 'จ.', full: 'วันจันทร์', color: 'text-amber-600 dark:text-amber-400' },
  { short: 'อ.', full: 'วันอังคาร', color: 'text-pink-600 dark:text-pink-400' },
  { short: 'พ.', full: 'วันพุธ', color: 'text-emerald-600 dark:text-emerald-400' },
  { short: 'พฤ.', full: 'วันพฤหัสบดี', color: 'text-orange-600 dark:text-orange-400' },
  { short: 'ศ.', full: 'วันศุกร์', color: 'text-sky-600 dark:text-sky-400' },
];

export default function MonthView({
  year,
  month,
  sessionsMap = {},
  multiDayEventsMap = {},
  shortNotes = [],
  onSelectSession,
  onSelectDate,
  onEditMultiDayEvent,
  onEditShortNote,
}) {
  const gridDays = getSchoolWeekMonthGrid(year, month);
  const todayStr = toDateString(new Date());

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      
      {/* 5-Day Weekday Header (Monday - Friday) */}
      <div className="grid grid-cols-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
        {SCHOOL_WEEKDAY_NAMES.map((w, idx) => (
          <div key={idx} className="py-2 sm:py-2.5 text-center text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className={w.color}>
              <span className="sm:hidden">{w.short}</span>
              <span className="hidden sm:inline">{w.full}</span>
            </span>
          </div>
        ))}
      </div>

      {/* Days Grid: 5 Columns */}
      <div className="grid grid-cols-5 divide-x divide-y divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800">
        {gridDays.map((dayObj, index) => {
          const sessions = sessionsMap[dayObj.dateString] || [];
          const multiDayEvents = multiDayEventsMap[dayObj.dateString] || [];
          const isToday = dayObj.dateString === todayStr;

          return (
            <div
              key={index}
              className={`min-h-[100px] sm:min-h-[145px] p-1 sm:p-2 flex flex-col transition-colors group relative ${
                !dayObj.isCurrentMonth
                  ? 'bg-slate-50/40 dark:bg-slate-950/40 text-slate-400 dark:text-slate-600'
                  : 'bg-white dark:bg-slate-900 hover:bg-slate-50/70 dark:hover:bg-slate-850'
              }`}
            >
              {/* Day Number and Quick Action */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`w-6 h-6 flex items-center justify-center text-xs font-semibold rounded-full ${
                    isToday
                      ? 'bg-indigo-600 text-white shadow-sm font-bold'
                      : dayObj.isCurrentMonth
                      ? 'text-slate-800 dark:text-slate-200'
                      : 'text-slate-400 dark:text-slate-600'
                  }`}
                >
                  {dayObj.dayNumber}
                </span>

                {/* Quick Add Button on Hover */}
                {dayObj.isCurrentMonth && (
                  <button
                    onClick={() => onSelectDate(dayObj.dateString)}
                    title="บันทึกกิจกรรมหรือสอนชดเชยในวันนี้"
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-600 transition-opacity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Multi-Day Event Banners for this day */}
              {multiDayEvents.length > 0 && (
                <div className="mb-1 space-y-1">
                  {multiDayEvents.map((mde) => {
                    const mdeColor = getColorById(mde.colorId || 'amber');
                    return (
                      <button
                        key={mde.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditMultiDayEvent(mde);
                        }}
                        title={`กิจกรรมหลายวัน: ${mde.title} (${mde.startDate} ถึง ${mde.endDate})`}
                        className={`w-full text-left px-1.5 py-0.5 rounded-md text-[11px] font-semibold border flex items-center gap-1 shadow-xs transition-all hover:scale-[1.01] ${mdeColor.bg} ${mdeColor.border} ${mdeColor.text}`}
                      >
                        <Flag className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{mde.title}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Short Notes (นัดหมายส่งงานในวันนี้) */}
              {(() => {
                const dayNotes = shortNotes.filter(n => n.dueDate === dayObj.dateString);
                if (dayNotes.length === 0) return null;
                return (
                  <div className="mb-1 space-y-0.5">
                    {dayNotes.map((note) => {
                      const isOverdue = !note.isCompleted && note.dueDate < todayStr;
                      return (
                        <button
                          key={note.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditShortNote && onEditShortNote(note);
                          }}
                          title={`นัดส่งงาน: ${note.title} (${note.duePeriod || 'ในคาบเรียน'})${note.isCompleted ? ' - ตรวจแล้ว' : ''}`}
                          className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium border flex items-center gap-1 transition-all hover:scale-[1.01] ${
                            note.isCompleted
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 line-through opacity-75'
                              : isOverdue
                              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold'
                              : 'bg-amber-100/80 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-semibold'
                          }`}
                        >
                          <span className="shrink-0">{note.isCompleted ? '✓' : '📝'}</span>
                          <span className="truncate">{note.title}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Sessions chips */}
              <div className="space-y-1 overflow-hidden flex-1">
                {sessions.slice(0, 3).map((sess) => {
                  const isCancelled = sess.status === 'cancelled';
                  const isActivity = sess.status === 'activity';
                  const isMakeup = sess.status === 'makeup';

                  let chipStyle = `${sess.color?.bg || 'bg-indigo-50'} ${sess.color?.border || 'border-indigo-200'} text-slate-800 dark:text-slate-100`;

                  if (isCancelled) {
                    chipStyle = 'bg-rose-100 dark:bg-rose-950/80 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 line-through';
                  } else if (isActivity) {
                    chipStyle = 'bg-amber-100 dark:bg-amber-950/80 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200';
                  } else if (isMakeup) {
                    chipStyle = 'bg-sky-100 dark:bg-sky-950/80 border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-200';
                  }

                  return (
                    <button
                      key={sess.id}
                      onClick={() => onSelectSession(sess)}
                      title={`${sess.startTime}-${sess.endTime} ${sess.subjectCode} ${sess.subjectName} ${sess.reason ? `(${sess.reason})` : ''}`}
                      className={`w-full text-left px-1.5 py-0.5 rounded text-[11px] font-medium border truncate transition-all flex items-center gap-1 hover:opacity-90 hover:scale-[1.01] ${chipStyle}`}
                    >
                      {isCancelled && <Ban className="w-2.5 h-2.5 text-rose-600 shrink-0" />}
                      {isActivity && <AlertCircle className="w-2.5 h-2.5 text-amber-600 shrink-0" />}
                      {isMakeup && <Clock className="w-2.5 h-2.5 text-sky-600 shrink-0" />}

                      <span className="truncate flex-1">
                        {isActivity && sess.reason ? sess.reason : (
                          <>
                            <span>{sess.subjectName} ({sess.startTime})</span>
                            {sess.topic && (
                              <span className="text-[10px] text-sky-700 dark:text-sky-300 font-semibold ml-1">
                                🎯 {sess.topic}
                              </span>
                            )}
                          </>
                        )}
                      </span>

                      {Array.isArray(sess.prepChecklist) && sess.prepChecklist.length > 0 && (
                        <span className={`text-[9px] px-1 py-0.2 rounded font-bold shrink-0 ${
                          sess.prepChecklist.every(i => i.isDone)
                            ? 'bg-emerald-200/80 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200'
                            : 'bg-amber-200/80 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200'
                        }`}>
                          {sess.prepChecklist.every(i => i.isDone)
                            ? '✓ สื่อพร้อม'
                            : `📦 ${sess.prepChecklist.filter(i => i.isDone).length}/${sess.prepChecklist.length}`}
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* Overflow count */}
                {sessions.length > 3 && (
                  <button
                    onClick={() => onSelectDate(dayObj.dateString)}
                    className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-indigo-600 font-medium pl-1"
                  >
                    +{sessions.length - 3} คาบเพิ่มเติม...
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
