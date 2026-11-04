import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Calendar as CalIcon,
  CheckCircle2,
  Check,
  Sparkles,
  Flag,
  RefreshCw,
} from 'lucide-react';
import { formatThaiDate } from '../../utils/dateUtils';
import { getThaiHolidaysForSemester } from '../../utils/thaiHolidays';

export default function ThaiHolidaysSyncModal({
  isOpen,
  onClose,
  semester,
  multiDayEvents = [],
  onBatchSaveMultiDayEvents,
}) {
  const [includeSubstitute, setIncludeSubstitute] = useState(true);
  const [cancelClasses, setCancelClasses] = useState(true);
  const [selectedDates, setSelectedDates] = useState(new Set());

  const holidays = useMemo(() => {
    if (!semester) return [];
    return getThaiHolidaysForSemester(semester, multiDayEvents, {
      includeSubstitute,
    });
  }, [semester, multiDayEvents, includeSubstitute]);

  // Pre-select all unsynced holidays whenever the modal opens or holiday list updates
  useEffect(() => {
    if (isOpen) {
      const initial = new Set(
        holidays.filter((h) => !h.isAlreadySynced).map((h) => h.date)
      );
      setSelectedDates(initial);
    }
  }, [isOpen, holidays]);

  if (!isOpen || !semester) return null;

  const unsyncedHolidays = holidays.filter((h) => !h.isAlreadySynced);

  const handleToggleDate = (dateStr) => {
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) {
        next.delete(dateStr);
      } else {
        next.add(dateStr);
      }
      return next;
    });
  };

  const handleSelectAllUnsynced = () => {
    setSelectedDates(new Set(unsyncedHolidays.map((h) => h.date)));
  };

  const handleClearSelection = () => {
    setSelectedDates(new Set());
  };

  const handleSync = (e) => {
    e.preventDefault();
    const chosen = holidays.filter((h) => selectedDates.has(h.date));
    if (chosen.length === 0) {
      onClose();
      return;
    }

    const newEvents = chosen.map((h) => ({
      id: `mde-holiday-${semester.id}-${h.date}`,
      semesterId: semester.id,
      title: h.title,
      startDate: h.date,
      endDate: h.date,
      type: 'holiday',
      cancelClasses: cancelClasses,
      colorId: h.isSubstitute ? 'amber' : 'purple',
      notes: h.notes || 'ซิงค์จากปฏิทินวันหยุดราชการไทยอัตโนมัติ',
    }));

    if (onBatchSaveMultiDayEvents) {
      onBatchSaveMultiDayEvents(newEvents);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                ซิงค์วันหยุดราชการไทยประจำภาคเรียน
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {semester.name} ({formatThaiDate(semester.startDate, 'short')} –{' '}
                {formatThaiDate(semester.endDate, 'short')})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSync} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeSubstitute}
                onChange={(e) => setIncludeSubstitute(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-100 block">
                  รวมวันหยุดชดเชยอัตโนมัติ
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  เมื่อวันหยุดราชการตรงกับเสาร์-อาทิตย์ จะดึงวันจันทร์ถัดไปมาให้
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={cancelClasses}
                onChange={(e) => setCancelClasses(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-100 block">
                  งดการเรียนการสอนในวันหยุด
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  ปรับสถานะคาบเรียนในวันนั้นเป็น &quot;ติดกิจกรรม/วันหยุด&quot; อัตโนมัติ
                </span>
              </div>
            </label>
          </div>

          {/* Selection Controls */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              พบวันหยุดในวันจันทร์–ศุกร์ทั้งหมด {holidays.length} วัน (เลือกไว้ {selectedDates.size} วัน)
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSelectAllUnsynced}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
              >
                เลือกที่ยังไม่ซิงค์ ({unsyncedHolidays.length})
              </button>
              <button
                type="button"
                onClick={handleClearSelection}
                className="text-slate-500 hover:underline"
              >
                ล้างที่เลือก
              </button>
            </div>
          </div>

          {/* Holidays List */}
          {holidays.length === 0 ? (
            <div className="py-10 text-center text-slate-400 dark:text-slate-500 text-xs border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
              ไม่พบวันหยุดราชการที่ตรงกับวันจันทร์–ศุกร์ในช่วงวันที่ของภาคเรียนนี้
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {holidays.map((h) => {
                const isChecked = selectedDates.has(h.date);
                return (
                  <label
                    key={h.date}
                    className={`flex items-center justify-between gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-300 dark:border-purple-700'
                        : h.isAlreadySynced
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-800/50 opacity-85'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleDate(h.date)}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                          <span>{h.title}</span>
                          {h.isSubstitute && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-semibold">
                              วันหยุดชดเชย
                            </span>
                          )}
                          {h.isAlreadySynced && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                              <Check className="w-2.5 h-2.5" />
                              <span>มีในปฏิทินแล้ว</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          วัน{h.dayName}ที่ {formatThaiDate(h.date, 'short')}
                          {h.notes ? ` • ${h.notes}` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <Flag
                        className={`w-4 h-4 ${
                          h.isSubstitute
                            ? 'text-amber-500'
                            : 'text-purple-500 dark:text-purple-400'
                        }`}
                      />
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={selectedDates.size === 0}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl shadow-md shadow-purple-500/20 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>ซิงค์วันหยุดเข้าปฏิทิน ({selectedDates.size} วัน)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
