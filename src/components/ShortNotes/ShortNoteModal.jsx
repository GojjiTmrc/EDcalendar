import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Calendar as CalIcon,
  Clock,
  Trash2,
  CheckCircle2,
  BookOpen,
  AlertCircle,
  Check
} from 'lucide-react';
import { formatThaiDate } from '../../utils/dateUtils';
import { getColorById } from '../../utils/colors';

const PERIOD_SUGGESTIONS = [
  'ในคาบเรียน',
  'ก่อนเริ่มคาบ',
  'ท้ายคาบเรียน',
  'ก่อนเที่ยง (12:00 น.)',
  'ก่อน 16:30 น.',
  'ตลอดทั้งวัน',
];

export default function ShortNoteModal({
  isOpen,
  onClose,
  editingNote,
  initialDate,
  initialSubjectId,
  subjects = [],
  onSave,
  onDelete,
}) {
  const [subjectId, setSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [duePeriod, setDuePeriod] = useState('ในคาบเรียน');
  const [description, setDescription] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (editingNote) {
      setSubjectId(editingNote.subjectId || '');
      setTitle(editingNote.title || '');
      setDueDate(editingNote.dueDate || '');
      setDuePeriod(editingNote.duePeriod || 'ในคาบเรียน');
      setDescription(editingNote.description || '');
      setIsCompleted(Boolean(editingNote.isCompleted));
    } else {
      const todayStr = initialDate || new Date().toISOString().split('T')[0];
      setSubjectId(initialSubjectId || (subjects.length > 0 ? subjects[0].id : ''));
      setTitle('');
      setDueDate(todayStr);
      setDuePeriod('ในคาบเรียน');
      setDescription('');
      setIsCompleted(false);
    }
  }, [editingNote, initialDate, initialSubjectId, isOpen, subjects]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('กรุณากรอกชื่องานหรือคำสั่งการบ้าน');
      return;
    }
    if (!dueDate) {
      alert('กรุณาระบุวันกำหนดส่ง');
      return;
    }

    const payload = {
      id: editingNote ? editingNote.id : `note-${Date.now()}`,
      subjectId: subjectId || null,
      title: title.trim(),
      dueDate,
      duePeriod: duePeriod.trim() || 'ในคาบเรียน',
      description: description.trim(),
      isCompleted,
      createdAt: editingNote ? editingNote.createdAt : new Date().toISOString(),
      completedAt: isCompleted ? (editingNote?.completedAt || new Date().toISOString()) : null,
    };

    onSave(payload);
    onClose();
  };

  const selectedSubject = subjects.find(s => s.id === subjectId);
  const colorTheme = selectedSubject ? getColorById(selectedSubject.colorId) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-amber-50/60 dark:bg-amber-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingNote ? 'แก้ไขนัดหมายส่งงาน' : 'เพิ่มนัดหมายส่งงานใหม่'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                บันทึกการสั่งการบ้าน / งานที่ต้องเก็บ พร้อมแจ้งเตือนเมื่อถึงกำหนด
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* Select Subject */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              รายวิชา / ชั้นเรียน
            </label>
            <div className="relative">
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full pl-3 pr-8 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              >
                <option value="">-- งานทั่วไป / ไม่ระบุวิชา --</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.code} {sub.name} ({sub.gradeGroup || 'ไม่ระบุชั้น'})
                  </option>
                ))}
              </select>
            </div>
            {selectedSubject && colorTheme && (
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className={`w-3 h-3 rounded-full ${colorTheme.badge}`} />
                <span>{selectedSubject.code} - {selectedSubject.name}</span>
                <span className="text-slate-400">•</span>
                <span>{selectedSubject.gradeGroup}</span>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              หัวข้องาน / การบ้านที่สั่ง <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="เช่น ส่งสมุดแบบฝึกหัดบทที่ 2, โครงงานฉบับร่าง"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          {/* Due Date & Due Period */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                วันกำหนดส่ง <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
              {dueDate && (
                <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 font-medium">
                  {formatThaiDate(dueDate, { showDayOfWeek: true })}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                เวลาหรือคาบที่นัดส่ง
              </label>
              <input
                type="text"
                placeholder="เช่น ในคาบเรียน, ก่อน 16:30 น."
                value={duePeriod}
                onChange={(e) => setDuePeriod(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Quick period suggestion pills */}
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {PERIOD_SUGGESTIONS.map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => setDuePeriod(sug)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                  duePeriod === sug
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 font-semibold'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Description / Instructions */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              รายละเอียด / คำสั่ง / เกณฑ์คะแนน (ถ้ามี)
            </label>
            <textarea
              rows={3}
              placeholder="เช่น เก็บ 10 คะแนน, ส่งที่โต๊ะพักครู 421, ทำลงสมุดหรือกระดาษรายงาน..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          {/* Completion Status Toggle */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsCompleted(!isCompleted)}
                className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                  isCompleted
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'border-2 border-slate-300 dark:border-slate-600 hover:border-emerald-500'
                }`}
              >
                {isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
              </button>
              <div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  ตรวจ / รับงานเรียบร้อยแล้ว
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  เมื่อติ๊กแล้ว ระบบจะตัดงานนี้ออกจากยอดแจ้งเตือนที่ค้างอยู่
                </div>
              </div>
            </div>
            {isCompleted && (
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                เสร็จสิ้นแล้ว
              </span>
            )}
          </div>

        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
          {editingNote ? (
            <button
              type="button"
              onClick={() => {
                if (confirm('คุณต้องการลบนัดหมายส่งงานนี้ใช่หรือไม่?')) {
                  onDelete(editingNote.id);
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>ลบรายการ</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 rounded-xl shadow-md shadow-amber-500/20 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>บันทึกข้อมูล</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
