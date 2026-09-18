import React, { useState, useEffect } from 'react';
import { X, Trash2, Clock, MapPin, BookOpen, Calendar as CalIcon } from 'lucide-react';
import { SCHOOL_DAYS } from '../../utils/dateUtils';
import { getColorById } from '../../utils/colors';
import { DEFAULT_PERIODS } from '../../utils/periodConfig';

// Helper to compute standard end time based on periods (50 mins/period)
function calculateEndTime(startStr, periodCount) {
  if (!startStr) return '10:10';
  const [h, m] = startStr.split(':').map(Number);
  const durationMinutes = periodCount === 1 ? 50 : periodCount === 2 ? 100 : 150;
  const total = h * 60 + m + durationMinutes;
  const endH = Math.floor(total / 60) % 24;
  const endM = total % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

export default function SlotModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingSlot,
  initialDayOfWeek = 1,
  initialPeriodNumber = 1,
  configuredPeriods,
  subjects = [],
  semesterId,
  onOpenNewSubject,
}) {
  const teachingPeriods = (configuredPeriods || DEFAULT_PERIODS).filter(p => !p.isLunch);
  const [dayOfWeek, setDayOfWeek] = useState(initialDayOfWeek);
  const [startPeriodNumber, setStartPeriodNumber] = useState(initialPeriodNumber || 1);
  const [subjectId, setSubjectId] = useState('');
  const [periods, setPeriods] = useState(2);
  const [startTime, setStartTime] = useState('08:40');
  const [endTime, setEndTime] = useState('10:20');
  const [roomOverride, setRoomOverride] = useState('');

  // Helper to get time from period bells
  const getTimesForPeriodSpan = (startP, spanCount) => {
    const pStart = teachingPeriods.find(p => p.period === startP) || teachingPeriods[0];
    const targetEndP = startP + spanCount - 1;
    const pEnd = teachingPeriods.find(p => p.period === targetEndP) || pStart;
    return {
      start: pStart.startTime,
      end: pEnd.endTime,
    };
  };

  useEffect(() => {
    if (editingSlot) {
      setDayOfWeek(editingSlot.dayOfWeek);
      setSubjectId(editingSlot.subjectId);
      setPeriods(editingSlot.periods || 2);
      setStartTime(editingSlot.startTime);
      setEndTime(editingSlot.endTime);
      setRoomOverride(editingSlot.roomOverride || '');

      // Infer period number if not set
      if (editingSlot.periodNumber) {
        setStartPeriodNumber(editingSlot.periodNumber);
      } else {
        const match = teachingPeriods.find(p => p.startTime === editingSlot.startTime) || teachingPeriods[0];
        setStartPeriodNumber(match.period);
      }
    } else {
      const defaultSub = subjects[0];
      const initialPeriods = defaultSub?.periods || 2;
      const targetP = initialPeriodNumber || 1;
      const { start, end } = getTimesForPeriodSpan(targetP, initialPeriods);

      setDayOfWeek(initialDayOfWeek || 1);
      setStartPeriodNumber(targetP);
      setSubjectId(defaultSub?.id || '');
      setPeriods(initialPeriods);
      setStartTime(start);
      setEndTime(end);
      setRoomOverride('');
    }
  }, [editingSlot, initialDayOfWeek, initialPeriodNumber, isOpen, subjects]);

  if (!isOpen) return null;

  const selectedSubject = subjects.find(s => s.id === subjectId) || subjects[0];
  const color = selectedSubject ? getColorById(selectedSubject.colorId) : null;

  const handleStartPeriodChange = (pNum) => {
    setStartPeriodNumber(pNum);
    const { start, end } = getTimesForPeriodSpan(pNum, periods);
    setStartTime(start);
    setEndTime(end);
  };

  const handleSubjectChange = (newSubId) => {
    setSubjectId(newSubId);
    const sub = subjects.find(s => s.id === newSubId);
    if (sub && sub.periods) {
      setPeriods(sub.periods);
      const { start, end } = getTimesForPeriodSpan(startPeriodNumber, sub.periods);
      setStartTime(start);
      setEndTime(end);
    }
  };

  const handlePeriodChange = (num) => {
    setPeriods(num);
    const { start, end } = getTimesForPeriodSpan(startPeriodNumber, num);
    setStartTime(start);
    setEndTime(end);
  };

  const handleStartTimeChange = (newStart) => {
    setStartTime(newStart);
    setEndTime(calculateEndTime(newStart, periods));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!subjectId) {
      alert('กรุณาเลือกวิชา');
      return;
    }
    if (startTime >= endTime) {
      alert('เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น');
      return;
    }

    const payload = {
      id: editingSlot ? editingSlot.id : `slot-${Date.now()}`,
      semesterId,
      subjectId,
      dayOfWeek: Number(dayOfWeek),
      periodNumber: Number(startPeriodNumber) || 1,
      periods: Number(periods) || 2,
      startTime,
      endTime,
      roomOverride: roomOverride.trim() || undefined,
    };

    onSave(payload);
    onClose();
  };

  const handleDelete = () => {
    if (editingSlot && onDelete) {
      if (confirm('คุณต้องการลบคาบสอนนี้ออกจากตารางประจำสัปดาห์ใช่หรือไม่?')) {
        onDelete(editingSlot.id);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-900 dark:text-white">
                {editingSlot ? 'แก้ไขคาบสอนประจำสัปดาห์' : 'เพิ่มคาบสอนประจำสัปดาห์'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                คาบนี้จะปรากฏซ้ำทุกสัปดาห์ในภาคเรียนปัจจุบัน
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Day of Week */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              วันสอนในสัปดาห์ (จันทร์ - ศุกร์)
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {SCHOOL_DAYS.map((day) => {
                const isSelected = Number(dayOfWeek) === day.index;
                return (
                  <button
                    type="button"
                    key={day.index}
                    onClick={() => setDayOfWeek(day.index)}
                    className={`py-2 px-1 text-xs rounded-xl font-medium border transition-all text-center ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {day.short}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subject selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                <span>วิชาที่สอน</span>
              </label>
              {onOpenNewSubject && (
                <button
                  type="button"
                  onClick={onOpenNewSubject}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                  + เพิ่มวิชาใหม่
                </button>
              )}
            </div>

            <select
              value={subjectId}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} ({sub.code}) - {sub.periods || 2} คาบ {sub.gradeGroup ? `[${sub.gradeGroup}]` : ''}
                </option>
              ))}
            </select>

            {/* Subject Preview Card */}
            {selectedSubject && (
              <div className={`mt-2 p-3 rounded-xl border flex items-center justify-between ${color?.bg} ${color?.border}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{selectedSubject.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/70 dark:bg-black/30 font-semibold text-slate-700 dark:text-slate-300">
                      {selectedSubject.code}
                    </span>
                    {selectedSubject.gradeGroup && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/70 dark:bg-black/30 font-medium text-slate-700 dark:text-slate-300">
                        {selectedSubject.gradeGroup}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-right text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{roomOverride || selectedSubject.defaultRoom || '-'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Starting Period Selector (1 - 8) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                เริ่มสอนในคาบที่ (1 - 8)
              </label>
              <span className="text-[11px] text-slate-500">
                อ้างอิงช่วงเวลาตามเสียงกริ่งโรงเรียน
              </span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((pNum) => (
                <button
                  key={pNum}
                  type="button"
                  onClick={() => handleStartPeriodChange(pNum)}
                  className={`py-1.5 px-1 text-xs font-semibold rounded-xl border transition-all text-center ${
                    Number(startPeriodNumber) === pNum
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  คาบ {pNum}
                </button>
              ))}
            </div>
          </div>

          {/* Number of Periods Selector (1, 2, or 3 คาบ) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                วิชานี้สอนกี่คาบ (1, 2 หรือ 3 คาบ)
              </label>
              <span className="text-[11px] text-slate-500">
                คำนวณเวลาอัตโนมัติ: คาบละ 50 นาที
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handlePeriodChange(num)}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                    Number(periods) === num
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{num} คาบ</span>
                  <span className="text-[10px] opacity-80">
                    ({num === 1 ? '50 น.' : num === 2 ? '100 น.' : '150 น.'})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Time Pickers */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                เวลาเริ่มสอน
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                เวลาสิ้นสุด
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          {/* Room Override */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              ห้องเรียน (เว้นว่างไว้เพื่อใช้ห้องประจำของวิชา)
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={roomOverride}
                onChange={(e) => setRoomOverride(e.target.value)}
                placeholder={selectedSubject?.defaultRoom ? `ห้องประจำ: ${selectedSubject.defaultRoom}` : 'เช่น ห้อง 421 หรือ ห้องคอมฯ 2'}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            {editingSlot ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-sm font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>ลบคาบนี้</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-500/20 transition-all"
              >
                บันทึกคาบสอน
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
