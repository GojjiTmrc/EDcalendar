import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, BookOpen, MapPin, Users, Palette, Check, Clock, Calendar } from 'lucide-react';
import { SUBJECT_COLORS, getColorById } from '../../utils/colors';
import { getTermScopeInfo } from '../../services/summaryService';

const TERM_SCOPE_OPTIONS = [
  { value: '1', label: 'วิชาเทอม 1', desc: 'แสดงเฉพาะเทอม 1' },
  { value: '2', label: 'วิชาเทอม 2', desc: 'แสดงเฉพาะเทอม 2' },
  { value: 'both', label: 'วิชาที่เรียนทั้ง 2 เทอม', desc: 'แสดงทั้งเทอม 1 และ 2' },
];

export default function SubjectManagerModal({
  isOpen,
  onClose,
  subjects = [],
  slots = [],
  onSaveSubject,
  onDeleteSubject,
}) {
  const [editingSubject, setEditingSubject] = useState(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [defaultRoom, setDefaultRoom] = useState('');
  const [gradeGroup, setGradeGroup] = useState('');
  const [periods, setPeriods] = useState(2);
  const [termScope, setTermScope] = useState('both');
  const [colorId, setColorId] = useState('indigo');
  const [description, setDescription] = useState('');
  const [filterTerm, setFilterTerm] = useState('all'); // 'all' | '1' | '2' | 'both'

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setEditingSubject({ id: null });
    setCode('');
    setName('');
    setDefaultRoom('');
    setGradeGroup('');
    setPeriods(2);
    setTermScope(filterTerm === '1' || filterTerm === '2' ? filterTerm : 'both');
    setColorId(SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length].id);
    setDescription('');
  };

  const handleStartEdit = (sub) => {
    setEditingSubject(sub);
    setCode(sub.code);
    setName(sub.name);
    setDefaultRoom(sub.defaultRoom || '');
    setGradeGroup(sub.gradeGroup || '');
    setPeriods(sub.periods || 2);
    setTermScope(sub.termScope || 'both');
    setColorId(sub.colorId || 'indigo');
    setDescription(sub.description || '');
  };

  const handleCancelForm = () => {
    setEditingSubject(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      alert('กรุณากรอกรหัสวิชาและชื่อวิชา');
      return;
    }

    const payload = {
      id: editingSubject?.id || `sub-${Date.now()}`,
      code: code.trim(),
      name: name.trim(),
      defaultRoom: defaultRoom.trim(),
      gradeGroup: gradeGroup.trim(),
      periods: Number(periods) || 2,
      termScope: termScope || 'both',
      colorId,
      description: description.trim(),
    };

    onSaveSubject(payload);
    setEditingSubject(null);
  };

  const handleQuickChangeTermScope = (sub, newScope) => {
    onSaveSubject({
      ...sub,
      termScope: newScope,
    });
    if (editingSubject?.id === sub.id) {
      setTermScope(newScope);
    }
  };

  const handleDelete = (subId) => {
    const isUsed = slots.some(s => s.subjectId === subId);
    if (isUsed) {
      if (!confirm('วิชานี้มีคาบสอนในตารางประจำสัปดาห์ หากลบอาจทำให้ตารางแสดงผลไม่สมบูรณ์ ยืนยันที่จะลบหรือไม่?')) {
        return;
      }
    } else {
      if (!confirm('ต้องการลบวิชานี้ใช่หรือไม่?')) return;
    }

    onDeleteSubject(subId);
    if (editingSubject?.id === subId) {
      setEditingSubject(null);
    }
  };

  const filteredSubjects = subjects.filter((sub) => {
    if (filterTerm === 'all') return true;
    return (sub.termScope || 'both') === filterTerm;
  });

  const countByScope = {
    all: subjects.length,
    '1': subjects.filter(s => (s.termScope || 'both') === '1').length,
    '2': subjects.filter(s => (s.termScope || 'both') === '2').length,
    both: subjects.filter(s => (s.termScope || 'both') === 'both').length,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                จัดการรายวิชา ({subjects.length} วิชา)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                กำหนดเทอมที่สอน (เทอม 1 / เทอม 2 / ทั้ง 2 เทอม) จำนวนคาบ ห้องเรียน และสีประจำวิชา
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!editingSubject && (
              <button
                onClick={handleStartAdd}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มวิชาใหม่</span>
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

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* Add / Edit Form */}
          {editingSubject && (
            <form onSubmit={handleSubmit} className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                {editingSubject.id ? 'แก้ไขข้อมูลวิชา' : 'เพิ่มรายวิชาใหม่'}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    รหัสวิชา *
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="เช่น ว31101, ค21102"
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    กลุ่มชั้นเรียน / ระดับชั้น
                  </label>
                  <input
                    type="text"
                    value={gradeGroup}
                    onChange={(e) => setGradeGroup(e.target.value)}
                    placeholder="เช่น ม.4/1 หรือ Sec 1"
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ชื่อรายวิชา *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น วิทยาการคำนวณ 1, คอมพิวเตอร์กราฟิก"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                  required
                />
              </div>

              {/* Term Scope Selector (วิชาเทอม 1 / วิชาเทอม 2 / เรียนทั้ง 2 เทอม) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  ภาคเรียนที่สอนวิชานี้ (เพื่อให้หน้าสรุปผลแสดงเฉพาะวิชาที่สอนจริงในแต่ละเทอม)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {TERM_SCOPE_OPTIONS.map((opt) => {
                    const isSelected = termScope === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setTermScope(opt.value)}
                        className={`py-2 px-3 text-xs rounded-xl border transition-all flex flex-col items-center justify-center gap-0.5 ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm font-bold'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold'
                        }`}
                      >
                        <span>{opt.label}</span>
                        <span className={`text-[10px] font-normal ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                          {opt.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Number of Periods Selector (1, 2, 3 คาบ) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  วิชานี้สอนกี่คาบ (จำนวนคาบต่อครั้ง)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setPeriods(num)}
                      className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                        Number(periods) === num
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>{num} คาบ</span>
                      <span className="text-[10px] opacity-80">
                        ({num === 1 ? '50 นาที' : num === 2 ? '1 ชม. 40 น.' : '2 ชม. 30 น.'})
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ห้องเรียนประจำ
                  </label>
                  <input
                    type="text"
                    value={defaultRoom}
                    onChange={(e) => setDefaultRoom(e.target.value)}
                    placeholder="เช่น ห้องคอมพิวเตอร์ 2"
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                {/* Color Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    สีประจำวิชา
                  </label>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {SUBJECT_COLORS.map((c) => (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => setColorId(c.id)}
                        className={`w-7 h-7 rounded-lg ${c.accent} flex items-center justify-center transition-transform ${
                          colorId === c.id ? 'scale-110 ring-2 ring-indigo-500 ring-offset-2' : 'hover:scale-105'
                        }`}
                        title={c.name}
                      >
                        {colorId === c.id && <Check className="w-4 h-4 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Form Actions */}
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
                  บันทึกวิชา
                </button>
              </div>
            </form>
          )}

          {/* Filter Tabs by Term Scope */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
            <div className="flex flex-wrap items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium">
              {[
                { id: 'all', label: `ทั้งหมด (${countByScope.all})` },
                { id: '1', label: `วิชาเทอม 1 (${countByScope['1']})` },
                { id: '2', label: `วิชาเทอม 2 (${countByScope['2']})` },
                { id: 'both', label: `ทั้ง 2 เทอม (${countByScope.both})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterTerm(tab.id)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    filterTerm === tab.id
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              กดเลือกเทอมที่การ์ดวิชาเพื่อเปลี่ยนเทอมได้ทันที
            </span>
          </div>

          {/* Subjects List */}
          <div className="space-y-2.5">
            {filteredSubjects.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                ไม่พบรายวิชาในหมวดหมู่นี้
              </div>
            ) : (
              filteredSubjects.map((sub) => {
                const color = getColorById(sub.colorId);
                const countInSlots = slots.filter(s => s.subjectId === sub.id).length;
                const currentScope = sub.termScope || 'both';
                const scopeInfo = getTermScopeInfo(currentScope);

                return (
                  <div
                    key={sub.id}
                    className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${color.bg} ${color.border}`}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {sub.code}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800">
                          {sub.periods || 2} คาบ
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-md font-semibold border ${scopeInfo.badgeClass}`}>
                          {scopeInfo.label}
                        </span>
                        {sub.gradeGroup && (
                          <span className="text-xs px-2 py-0.5 rounded-md bg-white/80 dark:bg-black/40 font-medium text-slate-700 dark:text-slate-300">
                            ชั้น {sub.gradeGroup}
                          </span>
                        )}
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          ({countInSlots} จุดในตาราง)
                        </span>
                      </div>

                      <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        {sub.name}
                      </div>

                      {sub.defaultRoom && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>ห้องประจำ: {sub.defaultRoom}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2">
                      {/* Quick Term Scope Switcher right on the card */}
                      <div className="flex items-center bg-white/80 dark:bg-slate-900/80 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700 text-[11px]">
                        {[
                          { value: '1', label: 'เทอม 1' },
                          { value: '2', label: 'เทอม 2' },
                          { value: 'both', label: 'ทั้ง 2 เทอม' },
                        ].map((opt) => {
                          const active = currentScope === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => handleQuickChangeTermScope(sub, opt.value)}
                              className={`px-2 py-1 rounded-lg font-semibold transition-all ${
                                active
                                  ? 'bg-indigo-600 text-white shadow-sm'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                              }`}
                              title={`ตั้งเป็น${opt.value === 'both' ? 'วิชาที่เรียนทั้ง 2 เทอม' : `วิชา${opt.label}`}`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEdit(sub)}
                          title="แก้ไขวิชานี้"
                          className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(sub.id)}
                          title="ลบวิชานี้"
                          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
