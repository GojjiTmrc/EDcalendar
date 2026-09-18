import React, { useState } from 'react';
import { X, Plus, Calendar as CalIcon, Check, Trash2, Edit2, Clock } from 'lucide-react';
import { formatThaiDate } from '../../utils/dateUtils';

export default function SemesterModal({
  isOpen,
  onClose,
  semesters = [],
  activeSemesterId,
  onSelectSemester,
  onSaveSemester,
  onDeleteSemester,
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('2026-05-18');
  const [endDate, setEndDate] = useState('2026-10-09');

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setName('ภาคเรียนใหม่');
    setStartDate('2026-11-01');
    setEndDate('2027-03-15');
  };

  const handleStartEdit = (sem) => {
    setIsAdding(true);
    setEditingId(sem.id);
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

    const payload = {
      id: editingId || `sem-${Date.now()}`,
      name: name.trim(),
      startDate,
      endDate,
    };

    onSaveSemester(payload);
    setIsAdding(false);
    setEditingId(null);
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
                  placeholder="เช่น ภาคเรียนที่ 1/2569"
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

          {/* List of Semesters */}
          <div className="space-y-2.5">
            {semesters.map((sem) => {
              const isActive = sem.id === activeSemesterId;

              return (
                <div
                  key={sem.id}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                    isActive
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 ring-1 ring-indigo-500/20'
                      : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {sem.name}
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

                  <div className="flex items-center gap-1.5">
                    {!isActive && (
                      <button
                        onClick={() => onSelectSemester(sem.id)}
                        className="px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-xl border border-indigo-200 dark:border-indigo-800 transition-colors"
                      >
                        เลือกใช้เทอมนี้
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
