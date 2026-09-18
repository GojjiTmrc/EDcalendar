import React from 'react';
import { Plus, Clock, MapPin, Users, BookOpen, AlertCircle, CheckCircle2, Edit3, Flag, FileText, Check } from 'lucide-react';
import { formatThaiDate } from '../../utils/dateUtils';
import { SESSION_STATUS, getColorById } from '../../utils/colors';

export default function DayView({
  dateStr,
  sessions = [],
  multiDayEvents = [],
  shortNotes = [],
  onSelectSession,
  onAddCustomSession,
  onEditMultiDayEvent,
  onOpenAddShortNote,
  onEditShortNote,
  onToggleCompleteShortNote,
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            ตารางสอนประจำวัน
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
            {formatThaiDate(dateStr, 'withDay')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            มีทั้งหมด {sessions.length} คาบ / รายการในวันนี้
          </p>
        </div>

        <button
          onClick={() => onAddCustomSession(dateStr)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-md shadow-indigo-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>บันทึกกิจกรรม / ชดเชย</span>
        </button>
      </div>

      {/* Multi-Day Event Alert Banner if active */}
      {multiDayEvents.length > 0 && (
        <div className="space-y-2">
          {multiDayEvents.map((mde) => {
            const mdeColor = getColorById(mde.colorId || 'amber');
            return (
              <div
                key={mde.id}
                onClick={() => onEditMultiDayEvent && onEditMultiDayEvent(mde)}
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all hover:scale-[1.005] ${mdeColor.bg} ${mdeColor.border}`}
              >
                <div className="flex items-center gap-2.5">
                  <Flag className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{mde.title}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-white/80 dark:bg-black/40 font-medium">
                        กิจกรรมต่อเนื่อง ({formatThaiDate(mde.startDate, 'short')} &ndash; {formatThaiDate(mde.endDate, 'short')})
                      </span>
                    </div>
                    {mde.notes && (
                      <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        {mde.notes}
                      </div>
                    )}
                  </div>
                </div>

                <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 underline">
                  แก้ไข
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Short Notes (งานที่นัดส่งในวันนี้) */}
      {(() => {
        const dayNotes = shortNotes.filter(n => n.dueDate === dateStr);
        return (
          <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50/50 dark:bg-amber-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    งานที่นัดส่งในวันนี้ ({dayNotes.length} รายการ)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    รายการการบ้านหรือชิ้นงานที่นัดหมายส่งในวันที่ {formatThaiDate(dateStr, 'short')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenAddShortNote && onOpenAddShortNote(dateStr)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ นัดหมายส่งงาน</span>
              </button>
            </div>

            {dayNotes.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic py-1">
                ไม่มีนัดหมายส่งงานในวันนี้ (กดปุ่มด้านบนเพื่อเพิ่ม)
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {dayNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-start gap-2.5"
                  >
                    <button
                      type="button"
                      onClick={() => onToggleCompleteShortNote && onToggleCompleteShortNote(note.id)}
                      className={`mt-0.5 w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center transition-all ${
                        note.isCompleted
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'border-2 border-slate-300 dark:border-slate-600 hover:border-emerald-500'
                      }`}
                    >
                      {note.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs font-bold truncate ${
                          note.isCompleted ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'
                        }`}>
                          {note.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => onEditShortNote && onEditShortNote(note)}
                          className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline shrink-0 font-medium"
                        >
                          แก้ไข
                        </button>
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{note.duePeriod || 'ในคาบเรียน'}</span>
                      </div>

                      {note.description && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                          {note.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Sessions List */}
      <div className="space-y-3">
        {sessions.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-base">
              ไม่มีคาบสอนในวันนี้
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              ท่านสามารถคลิกปุ่มด้านล่างเพื่อบันทึกกิจกรรมพิเศษ หรือเพิ่มคาบสอนชดเชยสำหรับวันนี้ได้
            </p>
            <button
              onClick={() => onAddCustomSession(dateStr)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-xl text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>บันทึกกิจกรรมหรือคาบพิเศษ</span>
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
                className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
                  isCancelled
                    ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900'
                    : isActivity
                    ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900'
                    : isMakeup
                    ? 'bg-sky-50/70 dark:bg-sky-950/20 border-sky-200 dark:border-sky-900'
                    : `${sess.color?.bg} ${sess.color?.border}`
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  
                  {/* Left: Time & Subject */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-indigo-500" />
                        {sess.startTime} - {sess.endTime}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-indigo-600/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {sess.periods || 1} คาบ
                      </span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${sess.statusInfo?.badgeClass}`}>
                        {sess.statusInfo?.label}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2 pt-1">
                      <span className={`text-lg font-bold text-slate-900 dark:text-white ${isCancelled ? 'line-through text-slate-500' : ''}`}>
                        {sess.subjectName}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white/80 dark:bg-black/40 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        {sess.subjectCode}
                      </span>
                    </div>
                  </div>

                  {/* Right: Room & Grade & Action */}
                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      {sess.gradeGroup && (
                        <span className="flex items-center gap-1 bg-white/80 dark:bg-black/40 px-2 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700">
                          <Users className="w-3 h-3" />
                          <span>ชั้น {sess.gradeGroup}</span>
                        </span>
                      )}
                      {sess.room && (
                        <span className="flex items-center gap-1 bg-white/80 dark:bg-black/40 px-2 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700">
                          <MapPin className="w-3 h-3" />
                          <span>{sess.room}</span>
                        </span>
                      )}
                    </div>

                    <button
                      className="p-1.5 rounded-lg bg-white/90 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 shadow-sm transition-colors"
                      title="แก้ไขสถานะหรือโน้ต"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>

                </div>

                {/* Reason Banner if Cancelled or Activity */}
                {sess.reason && (
                  <div className="mt-3 p-2.5 rounded-xl bg-white/80 dark:bg-black/40 border border-slate-200/80 dark:border-slate-800 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {isCancelled ? 'เหตุผลที่งดสอน:' : isActivity ? 'กิจกรรม:' : 'บันทึก:'}
                      </span>{' '}
                      <span className="text-slate-700 dark:text-slate-300">{sess.reason}</span>
                    </div>
                  </div>
                )}

                {/* Topic / Plan */}
                {sess.topic && (
                  <div className="mt-3 p-2.5 rounded-xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/60 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                        <span>หัวข้อที่จะสอน: {sess.topic}</span>
                      </span>

                      {Array.isArray(sess.prepChecklist) && sess.prepChecklist.length > 0 && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          sess.prepChecklist.every(i => i.isDone)
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}>
                          {sess.prepChecklist.every(i => i.isDone)
                            ? '✓ สื่อพร้อมครบแล้ว'
                            : `เตรียมสื่อ ${sess.prepChecklist.filter(i => i.isDone).length}/${sess.prepChecklist.length}`}
                        </span>
                      )}
                    </div>

                    {sess.lessonPlan && (
                      <p className="text-slate-600 dark:text-slate-300 text-[11px] pl-5">
                        {sess.lessonPlan}
                      </p>
                    )}

                    {Array.isArray(sess.prepChecklist) && sess.prepChecklist.length > 0 && (
                      <div className="pt-1 pl-5 space-y-1">
                        <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <Package className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                          <span>สื่อและอุปกรณ์:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {sess.prepChecklist.map((item) => (
                            <span
                              key={item.id}
                              className={`text-[10px] px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                                item.isDone
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 line-through dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                  : 'bg-white text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
                              }`}
                            >
                              <span>{item.isDone ? '✓' : '•'}</span>
                              <span>{item.text}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes / Homework */}
                {sess.notes && (
                  <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 bg-white/50 dark:bg-black/20 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800">
                    📝 <strong>บันทึกช่วยจำ/การบ้าน:</strong> {sess.notes}
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
