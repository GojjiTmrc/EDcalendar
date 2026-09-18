import React, { useState, useEffect } from 'react';
import { X, Calendar as CalIcon, Flag, Trash2, Check, AlertCircle, Sparkles } from 'lucide-react';
import { SUBJECT_COLORS, getColorById } from '../../utils/colors';
import { countDaysInRange, formatThaiDate } from '../../utils/dateUtils';

export default function MultiDayEventModal({
  isOpen,
  onClose,
  editingEvent,
  initialDateStr,
  semesterId,
  onSave,
  onDelete,
}) {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState('activity'); // 'activity' | 'cancelled' | 'holiday'
  const [cancelClasses, setCancelClasses] = useState(true);
  const [colorId, setColorId] = useState('amber');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title || '');
      setStartDate(editingEvent.startDate || '');
      setEndDate(editingEvent.endDate || '');
      setType(editingEvent.type || 'activity');
      setCancelClasses(editingEvent.cancelClasses !== false);
      setColorId(editingEvent.colorId || 'amber');
      setNotes(editingEvent.notes || '');
    } else {
      const baseDate = initialDateStr || new Date().toISOString().split('T')[0];
      setTitle('');
      setStartDate(baseDate);
      setEndDate(baseDate);
      setType('activity');
      setCancelClasses(true);
      setColorId('amber');
      setNotes('');
    }
  }, [editingEvent, initialDateStr, isOpen]);

  if (!isOpen) return null;

  const daysCount = countDaysInRange(startDate, endDate);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('กรุณากรอกชื่อกิจกรรม');
      return;
    }
    if (!startDate || !endDate) {
      alert('กรุณาระบุวันที่เริ่มต้นและวันที่สิ้นสุด');
      return;
    }
    if (startDate > endDate) {
      alert('วันที่สิ้นสุดต้องไม่เกิดขึ้นก่อนวันที่เริ่มต้น');
      return;
    }

    const payload = {
      id: editingEvent ? editingEvent.id : `mde-${Date.now()}`,
      semesterId,
      title: title.trim(),
      startDate,
      endDate,
      type,
      cancelClasses,
      colorId,
      notes: notes.trim(),
    };

    onSave(payload);
    onClose();
  };

  const handleDelete = () => {
    if (editingEvent && onDelete) {
      if (confirm(`คุณต้องการลบกิจกรรม "${editingEvent.title}" ใช่หรือไม่?`)) {
        onDelete(editingEvent.id);
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
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Flag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                {editingEvent ? 'แก้ไขกิจกรรมต่อเนื่องหลายวัน' : 'บันทึกกิจกรรมต่อเนื่องหลายวัน'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                กำหนดกิจกรรมที่กินเวลาหลายวัน เช่น กีฬาสี, เข้าค่าย, สัปดาห์สอบ
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              ชื่อกิจกรรม / เหตุการณ์ *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น งานสัปดาห์กีฬาสีโรงเรียน, กิจกรรมเข้าค่ายลูกเสือ, สัปดาห์สอบกลางภาค"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                วันที่เริ่มต้น *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (endDate < e.target.value) setEndDate(e.target.value);
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                วันที่สิ้นสุด *
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
          </div>

          {/* Duration Pill */}
          {startDate && endDate && startDate <= endDate && (
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/80 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
              <span className="flex items-center gap-1.5 font-medium">
                <CalIcon className="w-3.5 h-3.5 text-amber-600" />
                {formatThaiDate(startDate, 'short')} &ndash; {formatThaiDate(endDate, 'short')}
              </span>
              <span className="font-bold px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-100">
                รวม {daysCount} วัน
              </span>
            </div>
          )}

          {/* Activity Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              ประเภทกิจกรรม
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('activity')}
                className={`py-2 px-2 text-xs font-medium rounded-xl border transition-all text-center ${
                  type === 'activity'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                ติดกิจกรรมโรงเรียน
              </button>
              <button
                type="button"
                onClick={() => setType('cancelled')}
                className={`py-2 px-2 text-xs font-medium rounded-xl border transition-all text-center ${
                  type === 'cancelled'
                    ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                งดการเรียนการสอน
              </button>
              <button
                type="button"
                onClick={() => setType('holiday')}
                className={`py-2 px-2 text-xs font-medium rounded-xl border transition-all text-center ${
                  type === 'holiday'
                    ? 'bg-purple-500 text-white border-purple-500 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                วันหยุด / สอบ
              </button>
            </div>
          </div>

          {/* Checkbox: Impact on classes */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="cancelClasses"
              checked={cancelClasses}
              onChange={(e) => setCancelClasses(e.target.checked)}
              className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="cancelClasses" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              <span className="font-semibold block text-slate-900 dark:text-white">
                งดการเรียนการสอนทุกคาบในช่วงนี้โดยอัตโนมัติ
              </span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block mt-0.5">
                ระบบจะเปลี่ยนสถานะคาบสอนปกติในวันที่ระบุให้กลายเป็น "ติดกิจกรรม / งดสอน" ตามชื่องานนี้ทันที
              </span>
            </label>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              สีแถบกิจกรรมบนปฏิทิน
            </label>
            <div className="flex flex-wrap gap-2">
              {SUBJECT_COLORS.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setColorId(c.id)}
                  className={`w-7 h-7 rounded-lg ${c.accent} flex items-center justify-center transition-transform ${
                    colorId === c.id ? 'scale-110 ring-2 ring-amber-500 ring-offset-2' : 'hover:scale-105'
                  }`}
                  title={c.name}
                >
                  {colorId === c.id && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              บันทึกรายละเอียดเพิ่มเติม / สิ่งที่ต้องเตรียม
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="เช่น จัดสถานที่ ณ อาคารอเนกประสงค์, นักเรียนนำอุปกรณ์มาเอง"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            {editingEvent ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>ลบกิจกรรมนี้</span>
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
                className="px-5 py-2 text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md shadow-amber-500/20 transition-all"
              >
                บันทึกกิจกรรม
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
