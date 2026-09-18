import React, { useState } from 'react';
import { Bell, AlertTriangle, Clock, Check, X, ArrowRight, Target, Package } from 'lucide-react';
import { toDateString } from '../../utils/dateUtils';

export default function DueAlertBanner({
  shortNotes = [],
  overrides = [],
  subjects = [],
  onOpenDropdown,
  onOpenEdit,
  onToggleComplete,
  onOpenSession,
}) {
  const [isDismissed, setIsDismissed] = useState(false);
  const todayStr = toDateString(new Date());

  // Calculate tomorrow's date string
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = toDateString(tomorrow);

  if (isDismissed) return null;

  // 1. Pending assignments due today or overdue
  const pendingDue = shortNotes.filter(
    (n) => !n.isCompleted && n.dueDate <= todayStr
  );

  // 2. Pending prep for today or tomorrow
  const subjectMap = new Map(subjects.map(s => [s.id, s]));
  const upcomingPrep = (overrides || [])
    .filter(o => (o.date === todayStr || o.date === tomorrowStr) && (o.topic || (o.prepChecklist && o.prepChecklist.length > 0)))
    .map(o => {
      const checklist = Array.isArray(o.prepChecklist) ? o.prepChecklist : [];
      const unchecked = checklist.filter(c => !c.isDone).length;
      return {
        ...o,
        subject: subjectMap.get(o.subjectId),
        unchecked,
        totalPrep: checklist.length,
      };
    })
    .filter(o => o.unchecked > 0 || (o.date === todayStr && o.topic));

  if (pendingDue.length === 0 && upcomingPrep.length === 0) return null;

  // Decide which alert to highlight primarily
  const hasDue = pendingDue.length > 0;
  const primaryNote = hasDue ? pendingDue[0] : null;
  const primaryNoteSubject = primaryNote ? subjectMap.get(primaryNote.subjectId) : null;

  const primaryPrep = upcomingPrep.length > 0 ? upcomingPrep[0] : null;

  return (
    <div className="bg-gradient-to-r from-amber-500/15 via-sky-500/10 to-transparent border-b border-amber-200 dark:border-amber-800/60 px-4 py-2.5 no-print animate-fadeIn">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
        
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-indigo-500/30 animate-bounce">
            <Bell className="w-3.5 h-3.5" />
          </div>
          
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            {hasDue ? (
              <>
                <span className="font-bold text-amber-900 dark:text-amber-200 flex-shrink-0">
                  📝 นัดส่งงาน ({pendingDue.length} รายการ):
                </span>
                <span className="text-amber-800 dark:text-amber-300 truncate">
                  {primaryNoteSubject ? `[${primaryNoteSubject.code} ${primaryNoteSubject.gradeGroup || ''}]` : ''}{' '}
                  {primaryNote.title} ({primaryNote.duePeriod || 'ในคาบเรียน'})
                </span>
              </>
            ) : (
              <>
                <span className="font-bold text-sky-900 dark:text-sky-200 flex-shrink-0">
                  🎯 เตรียมสอน ({primaryPrep.date === todayStr ? 'วันนี้' : 'พรุ่งนี้'}):
                </span>
                <span className="text-sky-800 dark:text-sky-300 truncate">
                  {primaryPrep.subject ? `[${primaryPrep.subject.code} ${primaryPrep.subject.gradeGroup || ''}]` : ''}{' '}
                  {primaryPrep.topic || 'มีรายการสื่อที่ต้องเตรียม'}
                  {primaryPrep.unchecked > 0 ? ` (ค้างสื่อ ${primaryPrep.unchecked} อย่าง)` : ''}
                </span>
              </>
            )}

            {hasDue && upcomingPrep.length > 0 && (
              <span className="text-[11px] text-sky-800 dark:text-sky-300 font-medium bg-sky-100 dark:bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-300 dark:border-sky-800">
                + มีแผนสอนและสื่อต้องเตรียม ({upcomingPrep.length} คาบ)
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {hasDue && (
            <button
              onClick={() => onToggleComplete(primaryNote.id)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors shadow-sm"
              title="ติ๊กรับ/ตรวจงานนี้เรียบร้อยแล้ว"
            >
              <Check className="w-3 h-3 stroke-[3]" />
              <span className="hidden sm:inline">ตรวจแล้ว</span>
            </button>
          )}

          <button
            onClick={onOpenDropdown}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-950/80 dark:hover:bg-indigo-900/80 text-indigo-900 dark:text-indigo-200 font-medium transition-colors border border-indigo-300 dark:border-indigo-800"
          >
            <span>ดูในกระดิ่ง</span>
            <ArrowRight className="w-3 h-3" />
          </button>

          <button
            onClick={() => setIsDismissed(true)}
            title="ซ่อนแถบแจ้งเตือนชั่วคราว"
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
