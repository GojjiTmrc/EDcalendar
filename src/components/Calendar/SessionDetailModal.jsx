import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  MapPin,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Plus,
  Trash2,
  FileText,
  Check,
  Target,
  Package,
  ListChecks
} from 'lucide-react';
import { formatThaiDate } from '../../utils/dateUtils';
import { SESSION_STATUS, getColorById } from '../../utils/colors';

export default function SessionDetailModal({
  isOpen,
  onClose,
  session,
  dateStr,
  subjects = [],
  semesterId,
  shortNotes = [],
  onSaveOverride,
  onResetOverride,
  onDeleteCustomSession,
  onOpenAddShortNote,
  onOpenEditShortNote,
  onToggleCompleteShortNote,
}) {
  const [status, setStatus] = useState('normal');
  const [reason, setReason] = useState('');
  const [topic, setTopic] = useState('');
  const [lessonPlan, setLessonPlan] = useState('');
  const [prepChecklist, setPrepChecklist] = useState([]);
  const [newPrepText, setNewPrepText] = useState('');
  const [notes, setNotes] = useState('');

  // For custom one-off makeup session
  const [isCustom, setIsCustom] = useState(false);
  const [customSubjectId, setCustomSubjectId] = useState('');
  const [startTime, setStartTime] = useState('08:30');
  const [endTime, setEndTime] = useState('10:10');
  const [customRoom, setCustomRoom] = useState('');

  useEffect(() => {
    if (session) {
      setStatus(session.status || 'normal');
      setReason(session.reason || '');
      setTopic(session.topic || '');
      setLessonPlan(session.lessonPlan || '');
      setPrepChecklist(Array.isArray(session.prepChecklist) ? session.prepChecklist : []);
      setNewPrepText('');
      setNotes(session.notes || '');
      setIsCustom(Boolean(session.isCustomSession));
      setCustomSubjectId(session.subjectId || subjects[0]?.id || '');
      setStartTime(session.startTime || '08:30');
      setEndTime(session.endTime || '10:10');
      setCustomRoom(session.room || '');
    } else {
      // New custom session on dateStr
      setStatus('activity');
      setReason('');
      setTopic('');
      setLessonPlan('');
      setPrepChecklist([]);
      setNewPrepText('');
      setNotes('');
      setIsCustom(true);
      setCustomSubjectId(subjects[0]?.id || '');
      setStartTime('08:30');
      setEndTime('10:00');
      setCustomRoom('');
    }
  }, [session, dateStr, isOpen, subjects]);

  const handleAddPrepItem = () => {
    if (!newPrepText.trim()) return;
    setPrepChecklist(prev => [
      ...prev,
      { id: `prep-${Date.now()}`, text: newPrepText.trim(), isDone: false }
    ]);
    setNewPrepText('');
  };

  const handleTogglePrepItem = (id) => {
    setPrepChecklist(prev => prev.map(item =>
      item.id === id ? { ...item, isDone: !item.isDone } : item
    ));
  };

  const handleDeletePrepItem = (id) => {
    setPrepChecklist(prev => prev.filter(item => item.id !== id));
  };

  if (!isOpen) return null;

  const activeDate = session?.date || dateStr;
  const selectedSubject = subjects.find(s => s.id === (isCustom ? customSubjectId : session?.subjectId));
  const color = selectedSubject ? getColorById(selectedSubject.colorId) : null;

  const handleSave = (e) => {
    e.preventDefault();

    if (isCustom) {
      if (!customSubjectId) {
        alert('กรุณาเลือกวิชา');
        return;
      }
      const customPayload = {
        id: session?.id || `custom-sess-${Date.now()}`,
        semesterId: semesterId,
        date: activeDate,
        subjectId: customSubjectId,
        isCustomSession: true,
        startTime,
        endTime,
        room: customRoom || selectedSubject?.defaultRoom || '-',
        status,
        reason: reason.trim(),
        topic: topic.trim(),
        lessonPlan: lessonPlan.trim(),
        prepChecklist: prepChecklist,
        notes: notes.trim(),
      };
      onSaveOverride(customPayload);
      onClose();
      return;
    }

    // Existing recurring slot override
    const payload = {
      id: session.id.startsWith('ovr-') ? session.id : `ovr-${Date.now()}`,
      semesterId: session.semesterId || semesterId,
      date: session.date,
      slotId: session.slotId,
      subjectId: session.subjectId,
      status,
      reason: reason.trim(),
      topic: topic.trim(),
      lessonPlan: lessonPlan.trim(),
      prepChecklist: prepChecklist,
      notes: notes.trim(),
    };

    onSaveOverride(payload);
    onClose();
  };

  const handleReset = () => {
    if (confirm('คุณต้องการรีเซ็ตสถานะคาบนี้กลับเป็น "สอนปกติ" ตามตารางใช่หรือไม่?')) {
      onResetOverride(session.date, session.slotId);
      onClose();
    }
  };

  const handleDeleteCustom = () => {
    if (confirm('คุณต้องการลบกิจกรรม/คาบพิเศษนี้ใช่หรือไม่?')) {
      onDeleteCustomSession(session.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              {formatThaiDate(activeDate, 'withDay')}
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mt-0.5">
              {session && !isCustom
                ? `${session.subjectName} (${session.subjectCode})`
                : isCustom && session
                ? 'แก้ไขกิจกรรม / คาบสอนชดเชย'
                : 'บันทึกกิจกรรมหรือคาบนอกตาราง'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
          
          {/* Info Card (For recurring slot) */}
          {!isCustom && session && (
            <div className={`p-3.5 rounded-xl border flex items-center justify-between ${session.color?.bg} ${session.color?.border}`}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{session.subjectName}</span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-white/80 dark:bg-black/40 font-semibold text-slate-700 dark:text-slate-300">
                    {session.subjectCode}
                  </span>
                  {session.gradeGroup && (
                    <span className="text-xs px-2 py-0.5 rounded-md bg-white/80 dark:bg-black/40 font-medium text-slate-700 dark:text-slate-300">
                      ชั้น {session.gradeGroup}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-3">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {session.startTime} - {session.endTime} ({session.periods || 1} คาบ)
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {session.room || '-'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Custom session inputs */}
          {isCustom && (
            <div className="space-y-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  วิชาที่เกี่ยวข้อง
                </label>
                <select
                  value={customSubjectId}
                  onChange={(e) => setCustomSubjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  required
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    เวลาเริ่มต้น
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
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
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  สถานที่ / ห้องเรียน
                </label>
                <input
                  type="text"
                  value={customRoom}
                  onChange={(e) => setCustomRoom(e.target.value)}
                  placeholder="เช่น ห้องคอมพิวเตอร์ 2"
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                />
              </div>
            </div>
          )}

          {/* STATUS SELECTOR TABS */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              สถานะของคาบในวันนี้
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              
              {/* Normal */}
              <button
                type="button"
                onClick={() => setStatus('normal')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                  status === 'normal'
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>สอนปกติ</span>
              </button>

              {/* Cancelled */}
              <button
                type="button"
                onClick={() => setStatus('cancelled')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                  status === 'cancelled'
                    ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <X className="w-4 h-4" />
                <span>งดสอน</span>
              </button>

              {/* Activity */}
              <button
                type="button"
                onClick={() => setStatus('activity')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                  status === 'activity'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <AlertCircle className="w-4 h-4" />
                <span>ติดกิจกรรม</span>
              </button>

              {/* Makeup */}
              <button
                type="button"
                onClick={() => setStatus('makeup')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                  status === 'makeup'
                    ? 'bg-sky-500 text-white border-sky-500 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>สอนชดเชย</span>
              </button>

            </div>
          </div>

          {/* Reason input (If cancelled or activity) */}
          {(status === 'cancelled' || status === 'activity' || status === 'makeup') && (
            <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
              <label className="block text-xs font-semibold text-amber-900 dark:text-amber-200 mb-1">
                {status === 'cancelled'
                  ? 'สาเหตุที่งดสอน / ไม่ได้เข้าสอน:'
                  : status === 'activity'
                  ? 'ชื่อกิจกรรม / วันหยุด:'
                  : 'รายละเอียดการสอนชดเชย:'}
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  status === 'cancelled'
                    ? 'เช่น ติดราชการอบรม, ลาป่วย, สัมมนาวิชาการ'
                    : status === 'activity'
                    ? 'เช่น งานสัปดาห์วิทยาศาสตร์, แข่งกีฬาสี, วันหยุดนักขัตฤกษ์'
                    : 'เช่น ชดเชยคาบของวันจันทร์ที่ 21 ก.ย.'
                }
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                required={status === 'cancelled' || status === 'activity'}
              />
            </div>
          )}

          {/* Lesson Plan & Next Class Preparation */}
          <div className="p-4 bg-sky-50/60 dark:bg-sky-950/30 rounded-2xl border border-sky-200/80 dark:border-sky-800/60 space-y-3.5">
            <div className="flex items-center justify-between border-b border-sky-200/60 dark:border-sky-800/60 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-sky-500 text-white flex items-center justify-center shadow-xs">
                  <Target className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    แผนการสอนและสิ่งที่ต้องเตรียมล่วงหน้า
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    วางแผนสำหรับคาบนี้ พร้อมเช็กลิสต์สื่อ/อุปกรณ์ และระบบจะแจ้งเตือนเมื่อใกล้ถึงวันสอน
                  </p>
                </div>
              </div>

              {prepChecklist.length > 0 && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  prepChecklist.every(i => i.isDone)
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                }`}>
                  {prepChecklist.every(i => i.isDone)
                    ? '✓ สื่อพร้อมครบแล้ว'
                    : `เตรียมสื่อแล้ว ${prepChecklist.filter(i => i.isDone).length}/${prepChecklist.length}`}
                </span>
              )}
            </div>

            {/* Topic */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                หัวข้อบทเรียน / กิจกรรมหลักที่จะสอน
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="เช่น การทดลองแรงเสียดทาน, เขียนโค้ดวนซ้ำ for loop"
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>

            {/* Lesson Plan / Activities */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                รายละเอียดกิจกรรมการเรียนรู้ / แผนการสอน (Lesson Plan)
              </label>
              <textarea
                rows={2}
                value={lessonPlan}
                onChange={(e) => setLessonPlan(e.target.value)}
                placeholder="เช่น แบ่งกลุ่ม 5 กลุ่ม ทำการทดลองวัดค่า... อภิปรายสรุป 15 นาทีท้ายคาบ"
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>

            {/* Prep Checklist */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>เช็กลิสต์สื่อและอุปกรณ์ที่ต้องเตรียม</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  (พิมพ์แล้วกด Enter หรือกดปุ่มเพิ่ม)
                </span>
              </label>

              {/* Input to add new checklist item */}
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newPrepText}
                  onChange={(e) => setNewPrepText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPrepItem();
                    }
                  }}
                  placeholder="พิมพ์ชื่อสื่อ/อุปกรณ์ เช่น ปริ้นต์ใบงาน 40 ชุด, เบิกชุดแล็บ..."
                  className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={handleAddPrepItem}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่ม</span>
                </button>
              </div>

              {/* Checklist items */}
              {prepChecklist.length > 0 && (
                <div className="space-y-1.5 bg-white/80 dark:bg-slate-900/60 p-2.5 rounded-xl border border-sky-100 dark:border-sky-900/60 max-h-44 overflow-y-auto">
                  {prepChecklist.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs transition-colors"
                    >
                      <label className="flex items-center gap-2 cursor-pointer min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={item.isDone}
                          onChange={() => handleTogglePrepItem(item.id)}
                          className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
                        />
                        <span className={`truncate ${
                          item.isDone ? 'line-through text-slate-400 dark:text-slate-500 font-normal' : 'text-slate-800 dark:text-slate-200 font-medium'
                        }`}>
                          {item.text}
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleDeletePrepItem(item.id)}
                        className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                        title="ลบรายการนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Additional Notes / Homework */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                บันทึกช่วยจำเพิ่มเติม / สิ่งที่ต้องติดตาม
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="เช่น เตือนเรื่องระเบียบห้องแล็บ, นัดหัวหน้าห้องรวบรวมงาน"
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
          </div>

          {/* Assignments Due in this Session / Date */}
          {(() => {
            const sessionNotes = shortNotes.filter((n) => {
              if (n.dueDate !== activeDate) return false;
              if (!selectedSubject) return true;
              return !n.subjectId || n.subjectId === selectedSubject.id;
            });

            return (
              <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200/80 dark:border-amber-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      งานที่นัดส่งในวันนี้ ({sessionNotes.length} รายการ)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAddShortNote && onOpenAddShortNote(activeDate, selectedSubject?.id);
                    }}
                    className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>สั่งงาน / นัดส่งงาน</span>
                  </button>
                </div>

                {sessionNotes.length === 0 ? (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                    ไม่มีรายการนัดหมายส่งงานในวันนี้ (กดปุ่มสั่งงานด้านบนเพื่อเพิ่ม)
                  </p>
                ) : (
                  <div className="space-y-1.5 pt-1">
                    {sessionNotes.map((note) => (
                      <div
                        key={note.id}
                        className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <button
                            type="button"
                            onClick={() => onToggleCompleteShortNote && onToggleCompleteShortNote(note.id)}
                            className={`w-4 h-4 rounded flex items-center justify-center transition-all ${
                              note.isCompleted
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'border border-slate-300 dark:border-slate-600 hover:border-emerald-500'
                            }`}
                          >
                            {note.isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                          </button>
                          <div className="truncate">
                            <span className={`font-semibold ${note.isCompleted ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
                              {note.title}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1.5">({note.duePeriod || 'ในคาบเรียน'})</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenEditShortNote && onOpenEditShortNote(note);
                          }}
                          className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline shrink-0 font-medium"
                        >
                          แก้ไข
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              {session?.isOverridden && !isCustom && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>คืนค่าตามตาราง</span>
                </button>
              )}

              {isCustom && session && (
                <button
                  type="button"
                  onClick={handleDeleteCustom}
                  className="flex items-center gap-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 py-1.5 px-2.5 rounded-lg transition-colors font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ลบรายการนี้</span>
                </button>
              )}
            </div>

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
                บันทึกข้อมูล
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
