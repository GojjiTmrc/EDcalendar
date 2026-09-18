import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  X,
  ChevronRight,
  Check,
  Calendar,
  Filter,
  Target,
  Package,
  ListChecks,
  MapPin
} from 'lucide-react';
import { formatThaiDate, toDateString } from '../../utils/dateUtils';
import { getColorById } from '../../utils/colors';

export default function NotificationDropdown({
  isOpen,
  onClose,
  shortNotes = [],
  overrides = [],
  subjects = [],
  onOpenAdd,
  onOpenEdit,
  onToggleComplete,
  onTogglePrepItem,
  onOpenSession,
}) {
  const [mainMode, setMainMode] = useState('due'); // 'due' (Assignments) | 'prep' (Lesson Prep)
  const [activeTab, setActiveTab] = useState('due'); // 'due' | 'upcoming' | 'all' | 'completed'
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const todayStr = useMemo(() => toDateString(new Date()), []);

  // Compute stats and categorized notes
  const { dueNotes, upcomingNotes, pendingNotes, completedNotes } = useMemo(() => {
    const sorted = [...shortNotes].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    const due = [];
    const upcoming = [];
    const pending = [];
    const completed = [];

    sorted.forEach((note) => {
      if (note.isCompleted) {
        completed.push(note);
        return;
      }
      pending.push(note);

      // Diff in days
      const noteDate = new Date(note.dueDate);
      const todayDate = new Date(todayStr);
      const diffDays = Math.round((noteDate - todayDate) / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        // Due today or overdue
        due.push({ ...note, diffDays });
      } else if (diffDays <= 3) {
        // Due in 1-3 days
        upcoming.push({ ...note, diffDays });
      }
    });

    return {
      dueNotes: due,
      upcomingNotes: upcoming,
      pendingNotes: pending,
      completedNotes: completed,
    };
  }, [shortNotes, todayStr]);

  // Compute upcoming planned classes with prep items
  const { plannedSessions, pendingPrepCount } = useMemo(() => {
    const subjectMap = new Map(subjects.map(s => [s.id, s]));

    // Filter overrides that have topic or prepChecklist and date >= todayStr (or within past 1 day)
    const planned = (overrides || [])
      .filter(o => o.date >= todayStr && (o.topic || (o.prepChecklist && o.prepChecklist.length > 0)))
      .sort((a, b) => a.date.localeCompare(b.date));

    let pendingCount = 0;
    const enriched = planned.map((p) => {
      const subject = subjectMap.get(p.subjectId);
      const checklist = Array.isArray(p.prepChecklist) ? p.prepChecklist : [];
      const unchecked = checklist.filter(c => !c.isDone).length;
      pendingCount += unchecked;

      return {
        ...p,
        subject,
        checklist,
        unchecked,
      };
    });

    return {
      plannedSessions: enriched,
      pendingPrepCount: pendingCount,
    };
  }, [overrides, subjects, todayStr]);

  if (!isOpen) return null;

  // Determine which list to display based on active tab for notes
  let displayList = [];
  if (activeTab === 'due') displayList = dueNotes;
  else if (activeTab === 'upcoming') displayList = upcomingNotes;
  else if (activeTab === 'all') displayList = pendingNotes;
  else if (activeTab === 'completed') displayList = completedNotes;

  const subjectMap = new Map(subjects.map(s => [s.id, s]));

  const renderBadge = (note) => {
    if (note.isCompleted) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
          <Check className="w-3 h-3 stroke-[3]" />
          <span>ตรวจแล้ว</span>
        </span>
      );
    }
    if (note.dueDate < todayStr) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-300 dark:border-rose-800 animate-pulse">
          <AlertCircle className="w-3 h-3" />
          <span>เกินกำหนด!</span>
        </span>
      );
    }
    if (note.dueDate === todayStr) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
          <Clock className="w-3 h-3" />
          <span>ครบกำหนดวันนี้</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-950/60 px-2 py-0.5 rounded-full border border-sky-300 dark:border-sky-800">
        <Calendar className="w-3 h-3" />
        <span>{formatThaiDate(note.dueDate, { showDayOfWeek: false })}</span>
      </span>
    );
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-[420px] max-w-[95vw] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-scaleUp text-left"
    >
      {/* Header with 2 Modes */}
      <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-sky-500/5 to-transparent border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              การแจ้งเตือน & เตรียมการสอน
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              งานค้างส่ง {pendingNotes.length} • สื่อรอเตรียม {pendingPrepCount} รายการ
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Mode Switcher: Assignments vs Lesson Prep */}
      <div className="grid grid-cols-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs">
        <button
          type="button"
          onClick={() => setMainMode('due')}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-semibold transition-all ${
            mainMode === 'due'
              ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>📝 นัดหมายส่งงาน</span>
          {pendingNotes.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
              {pendingNotes.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setMainMode('prep')}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-semibold transition-all ${
            mainMode === 'prep'
              ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>🎯 แผนเตรียมสอน</span>
          {pendingPrepCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-sky-500 text-white text-[10px] flex items-center justify-center font-bold">
              {pendingPrepCount}
            </span>
          )}
        </button>
      </div>

      {/* Mode 1: Short Notes (Assignments) */}
      {mainMode === 'due' && (
        <>
          {/* Sub Tabs */}
          <div className="flex items-center gap-1 p-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('due')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-all text-center flex items-center justify-center gap-1 ${
                activeTab === 'due'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>ถึงกำหนด</span>
              {dueNotes.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {dueNotes.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('upcoming')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-all text-center flex items-center justify-center gap-1 ${
                activeTab === 'upcoming'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>เร็วๆ นี้</span>
              {upcomingNotes.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {upcomingNotes.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-all text-center ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              ทั้งหมด ({pendingNotes.length})
            </button>

            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-all text-center ${
                activeTab === 'completed'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              ตรวจแล้ว ({completedNotes.length})
            </button>
          </div>

          {/* List Content */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {displayList.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  ไม่มีรายการในหมวดนี้
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  {activeTab === 'due' ? 'ยอดเยี่ยม! ไม่มีงานที่คั่งค้างหรือเกินกำหนด' : 'คลิกปุ่มด้านล่างเพื่อเพิ่มการนัดหมายส่งงาน'}
                </p>
              </div>
            ) : (
              displayList.map((note) => {
                const subject = subjectMap.get(note.subjectId);
                const colorTheme = subject ? getColorById(subject.colorId) : null;

                return (
                  <div
                    key={note.id}
                    className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-start gap-3 group"
                  >
                    {/* Checkbox button */}
                    <button
                      type="button"
                      title={note.isCompleted ? 'คลิกเพื่อเปลี่ยนกลับเป็นยังไม่เสร็จ' : 'คลิกเพื่อบันทึกว่าตรวจรับงานแล้ว'}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleComplete(note.id);
                      }}
                      className={`mt-0.5 w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center transition-all ${
                        note.isCompleted
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'border-2 border-slate-300 dark:border-slate-600 hover:border-emerald-500'
                      }`}
                    >
                      {note.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    {/* Content - Click to edit */}
                    <div
                      onClick={() => {
                        onOpenEdit(note);
                        onClose();
                      }}
                      className="flex-1 min-w-0 cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        {subject ? (
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${colorTheme?.badge || 'bg-slate-100 text-slate-700'}`}>
                            {subject.code} {subject.gradeGroup ? `(${subject.gradeGroup})` : ''}
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            งานทั่วไป
                          </span>
                        )}
                        {renderBadge(note)}
                      </div>

                      <h4 className={`text-xs font-semibold text-slate-900 dark:text-white line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors ${
                        note.isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : ''
                      }`}>
                        {note.title}
                      </h4>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {note.duePeriod || 'ในคาบเรียน'}
                        </span>
                        {note.description && (
                          <>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span className="truncate max-w-[130px]">{note.description}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <button
                      type="button"
                      onClick={() => {
                        onOpenEdit(note);
                        onClose();
                      }}
                      className="text-slate-300 dark:text-slate-600 hover:text-amber-600 dark:hover:text-amber-400 p-1"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              onClick={() => {
                onOpenAdd();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/60 hover:bg-amber-200/80 dark:hover:bg-amber-900/60 rounded-xl transition-colors border border-amber-200 dark:border-amber-800/50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ นัดหมายส่งงานใหม่</span>
            </button>
          </div>
        </>
      )}

      {/* Mode 2: Lesson Prep Checklist */}
      {mainMode === 'prep' && (
        <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {plannedSessions.length === 0 ? (
            <div className="py-10 px-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
                <Target className="w-6 h-6" />
              </div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                ยังไม่มีแผนการสอนล่วงหน้า
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto">
                เปิดหน้าปฏิทิน แล้วคลิกที่คาบสอนในสัปดาห์หน้าเพื่อลงหัวข้อและเช็กลิสต์สื่อที่ต้องเตรียม
              </p>
            </div>
          ) : (
            plannedSessions.map((ps) => {
              const colorTheme = ps.subject ? getColorById(ps.subject.colorId) : null;
              const isToday = ps.date === todayStr;

              return (
                <div key={ps.id} className="p-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors space-y-2">
                  {/* Session Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isToday
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300'
                          : 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300'
                      }`}>
                        {isToday ? '🔥 สอนวันนี้' : formatThaiDate(ps.date, { showDayOfWeek: true })}
                      </span>
                      {ps.subject && (
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${colorTheme?.badge || 'bg-slate-100'}`}>
                          {ps.subject.code} {ps.subject.gradeGroup}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenSession && onOpenSession(ps);
                      }}
                      className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline font-semibold flex items-center gap-0.5"
                    >
                      <span>ดูคาบนี้</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Topic */}
                  {ps.topic && (
                    <div className="flex items-start gap-1.5">
                      <Target className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                        {ps.topic}
                      </h4>
                    </div>
                  )}

                  {/* Lesson Plan snippet */}
                  {ps.lessonPlan && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 pl-5">
                      {ps.lessonPlan}
                    </p>
                  )}

                  {/* Prep Checklist */}
                  {ps.checklist.length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 ml-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300 pb-1 border-b border-slate-200/60 dark:border-slate-700/60">
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                          <span>สื่อและอุปกรณ์ที่ต้องเตรียม</span>
                        </span>
                        <span className={`text-[10px] font-bold ${ps.unchecked === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {ps.unchecked === 0 ? '✓ พร้อมแล้ว' : `เหลือ ${ps.unchecked} อย่าง`}
                        </span>
                      </div>

                      {ps.checklist.map((item) => (
                        <label
                          key={item.id}
                          className="flex items-center gap-2 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 p-1 rounded transition-colors text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={item.isDone}
                            onChange={() => onTogglePrepItem && onTogglePrepItem(ps.date, ps.slotId || ps.id, item.id)}
                            className="w-3.5 h-3.5 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
                          />
                          <span className={`truncate ${item.isDone ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>
                            {item.text}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

    </div>
  );
}
