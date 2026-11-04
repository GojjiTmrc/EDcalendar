import React, { useState } from 'react';
import { X, Plus, Calendar as CalIcon, Check, Trash2, Edit2, Clock, Copy, Sparkles } from 'lucide-react';
import { formatThaiDate } from '../../utils/dateUtils';

export default function SemesterModal({
  isOpen,
  onClose,
  semesters = [],
  slots = [],
  activeSemesterId,
  onSelectSemester,
  onSaveSemester,
  onDeleteSemester,
  onCloneSemesterSlots,
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('2026-05-18');
  const [endDate, setEndDate] = useState('2026-10-09');
  const [cloneFromSemesterId, setCloneFromSemesterId] = useState('');
  const [filterCloneByTermScope, setFilterCloneByTermScope] = useState(true);
  const [autoSyncHolidays, setAutoSyncHolidays] = useState(true);
  const [cloningTargetSem, setCloningTargetSem] = useState(null);
  const [cloneSourceForExisting, setCloneSourceForExisting] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setCloningTargetSem(null);
    setStatusMessage('');
    setName('ภาคเรียนที่ 2/2569');
    setStartDate('2026-11-01');
    setEndDate('2027-03-15');
    setCloneFromSemesterId(activeSemesterId || semesters[0]?.id || '');
    setFilterCloneByTermScope(true);
    setAutoSyncHolidays(true);
  };

  const handleStartEdit = (sem) => {
    setIsAdding(true);
    setEditingId(sem.id);
    setCloningTargetSem(null);
    setStatusMessage('');
    setName(sem.name);
    setStartDate(sem.startDate);
    setEndDate(sem.endDate);
  };

  const handleCancelForm = () => {
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !startDate || !endDate) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    if (startDate >= endDate) {
      alert('วันเริ่มต้นต้องเกิดขึ้นก่อนวันสิ้นสุด');
      return;
    }

    const isNew = !editingId;
    const payload = {
      id: editingId || `sem-${Date.now()}`,
      name: name.trim(),
      startDate,
      endDate,
    };

    onSaveSemester(payload, {
      cloneFromSemesterId: isNew ? cloneFromSemesterId : '',
      filterByTermScope: filterCloneByTermScope,
      autoSyncHolidays: isNew ? autoSyncHolidays : false,
    });
    setIsAdding(false);
    setEditingId(null);
    if (isNew) {
      setStatusMessage('สร้างภาคเรียนใหม่เรียบร้อยแล้ว!');
    }
  };

  const handleOpenCloneForExisting = (targetSem) => {
    setIsAdding(false);
    setCloningTargetSem(targetSem);
    const otherSem = semesters.find((s) => s.id !== targetSem.id);
    setCloneSourceForExisting(otherSem?.id || '');
    setStatusMessage('');
  };

  const handleConfirmCloneForExisting = () => {
    if (!cloningTargetSem || !cloneSourceForExisting || !onCloneSemesterSlots) return;
    const count = onCloneSemesterSlots(
      cloneSourceForExisting,
      cloningTargetSem,
      filterCloneByTermScope
    );
    const srcSem = semesters.find((s) => s.id === cloneSourceForExisting);
    setStatusMessage(
      `คัดลอกตารางสอนจาก "${srcSem?.name || ''}" เข้าสู่ "${cloningTargetSem.name}" เรียบร้อยแล้ว (${count} คาบสอน)`
    );
    setCloningTargetSem(null);
  };

  const handleDelete = (semId) => {
    if (semesters.length <= 1) {
      alert('ต้องมีภาคเรียนอย่างน้อย 1 ภาคเรียนในระบบ');
      return;
    }
    if (confirm('คุณต้องการลบภาคเรียนนี้ใช่หรือไม่? ตารางสอนและกิจกรรมของเทอมนี้จะถูกนำออก')) {
      onDeleteSemester(semId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <CalIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                จัดการภาคการศึกษา
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                กำหนดช่วงวันเปิด-ปิดภาคเรียน เพื่อสร้างปฏิทินการสอน
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isAdding && (
              <button
                onClick={handleStartAdd}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มภาคเรียน</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {statusMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Add / Edit form */}
          {isAdding && (
            <form onSubmit={handleSubmit} className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                {editingId ? 'แก้ไขภาคเรียน' : 'เพิ่มภาคเรียนใหม่'}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ชื่อภาคเรียน *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น ภาคเรียนที่ 1/2569 หรือ ภาคเรียนที่ 2/2569"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    วันเปิดภาคเรียน
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    วันปิดภาคเรียน
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                    required
                  />
                </div>
              </div>

              {/* Options when creating a new semester: Clone Timetable & Sync Thai Holidays */}
              {!editingId && (
                <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                  {semesters.length > 0 && (
                    <div className="space-y-2">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Copy className="w-3.5 h-3.5 text-indigo-500" />
                        <span>คัดลอกตารางสอนจากภาคเรียนเดิม (ไม่บังคับ)</span>
                      </label>
                      <select
                        value={cloneFromSemesterId}
                        onChange={(e) => setCloneFromSemesterId(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                      >
                        <option value="">-- ไม่คัดลอก (เริ่มตารางสอนว่างเปล่า) --</option>
                        {semesters.map((s) => {
                          const slotCount = slots.filter((sl) => sl.semesterId === s.id).length;
                          return (
                            <option key={s.id} value={s.id}>
                              คัดลอกจาก: {s.name} ({slotCount} คาบสอน)
                            </option>
                          );
                        })}
                      </select>

                      {cloneFromSemesterId && (
                        <label className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filterCloneByTermScope}
                            onChange={(e) => setFilterCloneByTermScope(e.target.checked)}
                            className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>คัดลอกเฉพาะวิชาที่เรียนทั้ง 2 เทอม หรือวิชาที่ตรงกับเทอมใหม่</span>
                        </label>
                      )}
                    </div>
                  )}

                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/70 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoSyncHolidays}
                      onChange={(e) => setAutoSyncHolidays(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <span className="font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>ซิงค์วันหยุดราชการไทยเข้าปฏิทินของเทอมนี้อัตโนมัติ</span>
                      </span>
                      <span className="text-[11px] text-slate-600 dark:text-slate-400 block mt-0.5">
                        ดึงวันหยุดราชการและวันหยุดชดเชยที่อยู่ในช่วงวันเปิด–ปิดภาคเรียนเข้าปฏิทินทันที
                      </span>
                    </div>
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow"
                >
                  บันทึก
                </button>
              </div>
            </form>
          )}

          {/* Clone Timetable Dialog for an Existing Semester */}
          {cloningTargetSem && (
            <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200 dark:border-indigo-800 space-y-3 text-xs">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Copy className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>คัดลอกตารางสอนเข้าสู่ &quot;{cloningTargetSem.name}&quot;</span>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  เลือกภาคเรียนต้นทางที่ต้องการดึงตารางสอนมา:
                </label>
                <select
                  value={cloneSourceForExisting}
                  onChange={(e) => setCloneSourceForExisting(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  {semesters
                    .filter((s) => s.id !== cloningTargetSem.id)
                    .map((s) => {
                      const count = slots.filter((sl) => sl.semesterId === s.id).length;
                      return (
                        <option key={s.id} value={s.id}>
                          {s.name} ({count} คาบสอน)
                        </option>
                      );
                    })}
                </select>
              </div>
              <label className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterCloneByTermScope}
                  onChange={(e) => setFilterCloneByTermScope(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>คัดลอกเฉพาะวิชาที่เรียนทั้ง 2 เทอม หรือวิชาที่ตรงกับเทอมปลายทาง</span>
              </label>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setCloningTargetSem(null)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCloneForExisting}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  ยืนยันคัดลอกตารางสอน
                </button>
              </div>
            </div>
          )}

          {/* List of Semesters */}
          <div className="space-y-2.5">
            {semesters.map((sem) => {
              const isActive = sem.id === activeSemesterId;
              const semSlotCount = slots.filter((sl) => sl.semesterId === sem.id).length;

              return (
                <div
                  key={sem.id}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                    isActive
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 ring-1 ring-indigo-500/20'
                      : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {sem.name}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                        {semSlotCount} คาบสอน
                      </span>
                      {isActive && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-600 text-white font-medium flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>กำลังใช้งาน</span>
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {formatThaiDate(sem.startDate, 'short')} - {formatThaiDate(sem.endDate, 'short')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isActive && (
                      <button
                        onClick={() => onSelectSemester(sem.id)}
                        className="px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-xl border border-indigo-200 dark:border-indigo-800 transition-colors"
                      >
                        เลือกใช้เทอมนี้
                      </button>
                    )}

                    {semesters.length > 1 && onCloneSemesterSlots && (
                      <button
                        type="button"
                        onClick={() => handleOpenCloneForExisting(sem)}
                        title="คัดลอกตารางสอนมาจากภาคเรียนอื่น"
                        className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => handleStartEdit(sem)}
                      title="แก้ไขช่วงเวลา"
                      className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {semesters.length > 1 && (
                      <button
                        onClick={() => handleDelete(sem.id)}
                        title="ลบภาคเรียน"
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </div>
  );
}
