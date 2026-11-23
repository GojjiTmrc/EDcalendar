import React, { useState, useMemo } from 'react';
import {
  X,
  Users,
  Upload,
  Download,
  Trash2,
  Plus,
  ShieldCheck,
  GraduationCap,
} from 'lucide-react';
import RosterImportWizard from './RosterImportWizard';
import { createStudent, sortStudents, rosterToCsv } from '../../utils/rosterUtils';

const EMPTY_NEW = { number: '', firstName: '', lastName: '', nickname: '' };

export default function RosterManagerModal({
  isOpen,
  onClose,
  subjects = [],
  rosters = {},
  onSaveRoster,
  onDeleteRoster,
  initialClassGroup = '',
  syncStatus = 'idle',
}) {
  const [pickedGroup, setPickedGroup] = useState('');
  const [extraGroups, setExtraGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [newStudent, setNewStudent] = useState(EMPTY_NEW);

  const groups = useMemo(() => {
    const set = new Set();
    subjects.forEach((s) => {
      if (s.gradeGroup && s.gradeGroup.trim()) set.add(s.gradeGroup.trim());
    });
    Object.keys(rosters).forEach((g) => set.add(g));
    extraGroups.forEach((g) => set.add(g));
    return [...set].sort((a, b) => a.localeCompare(b, 'th', { numeric: true }));
  }, [subjects, rosters, extraGroups]);

  if (!isOpen) return null;

  const selectedGroup =
    (pickedGroup && groups.includes(pickedGroup) && pickedGroup) ||
    (initialClassGroup && groups.includes(initialClassGroup) && initialClassGroup) ||
    groups[0] ||
    '';
  const students = rosters[selectedGroup]?.students || [];

  const save = (nextStudents) => onSaveRoster(selectedGroup, nextStudents);

  const handleAddGroup = (e) => {
    e.preventDefault();
    const name = newGroupName.trim();
    if (!name) return;
    setExtraGroups((prev) => (prev.includes(name) ? prev : [...prev, name]));
    setPickedGroup(name);
    setNewGroupName('');
  };

  const handleEditField = (id, field, value) => {
    save(students.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const handleDeleteStudent = (id) => {
    save(students.filter((s) => s.id !== id));
  };

  const handleAddStudent = (e) => {
    e.preventDefault();
    if (!newStudent.firstName.trim() && !newStudent.lastName.trim()) return;
    const nextNumber =
      newStudent.number.trim() ||
      String(students.reduce((m, s) => Math.max(m, parseInt(s.number, 10) || 0), 0) + 1);
    save(
      sortStudents([
        ...students,
        createStudent({ ...newStudent, number: nextNumber }),
      ])
    );
    setNewStudent(EMPTY_NEW);
  };

  const handleImport = (imported, mode) => {
    if (mode === 'append') {
      const maxNumber = students.reduce((m, s) => Math.max(m, parseInt(s.number, 10) || 0), 0);
      const hasNumbers = imported.every((s) => /^\d+$/.test(s.number));
      const shifted =
        hasNumbers && students.length > 0 && imported.some((s) => students.some((x) => x.number === s.number))
          ? imported.map((s, i) => ({ ...s, number: String(maxNumber + i + 1) }))
          : imported;
      save(sortStudents([...students, ...shifted]));
    } else {
      save(sortStudents(imported));
    }
  };

  const handleExport = () => {
    const blob = new Blob([rosterToCsv(students)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `รายชื่อนักเรียน_${selectedGroup.replace(/[\\/:*?"<>|]/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleClearRoster = () => {
    if (!selectedGroup || students.length === 0) return;
    if (confirm(`ลบรายชื่อนักเรียนทั้งหมดของห้อง ${selectedGroup} (${students.length} คน) ใช่หรือไม่?\nการลบนี้ย้อนกลับไม่ได้`)) {
      onDeleteRoster(selectedGroup);
    }
  };

  const inputCls =
    'w-full px-2 py-1 text-xs bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-800 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none';
  const addCls =
    'w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400';

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
        <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">รายชื่อนักเรียน</h3>
                <p className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  {syncStatus === 'synced' ? 'ซิงก์ขึ้นคลาวด์แล้ว ใช้ได้ทุกเครื่องที่ล็อกอินบัญชีนี้' : syncStatus === 'syncing' ? 'กำลังซิงก์กับคลาวด์...' : syncStatus === 'offline' ? 'ซิงก์คลาวด์ไม่สำเร็จ (เก็บในเครื่องไว้ก่อน จะลองใหม่อัตโนมัติ)' : 'เก็บในเครื่อง และซิงก์ขึ้นคลาวด์เมื่อล็อกอิน'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="ปิด"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col md:flex-row min-h-0 flex-1">
            {/* Class list */}
            <div className="md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 p-3 space-y-2 overflow-y-auto max-h-44 md:max-h-none">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-1">ห้องเรียน</div>
              {groups.length === 0 && (
                <p className="text-xs text-slate-400 px-1">
                  ยังไม่มีห้อง เพิ่มห้องใหม่ด้านล่าง หรือกำหนด &quot;ชั้น/ห้อง&quot; ในหน้ารายวิชา
                </p>
              )}
              {groups.map((g) => {
                const count = rosters[g]?.students?.length || 0;
                const active = g === selectedGroup;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setPickedGroup(g)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                      active
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                      {g}
                    </span>
                    <span
                      className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                        active
                          ? 'bg-white/20'
                          : count > 0
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                      }`}
                    >
                      {count > 0 ? `${count} คน` : 'ว่าง'}
                    </span>
                  </button>
                );
              })}

              <form onSubmit={handleAddGroup} className="flex gap-1.5 pt-1">
                <input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="เพิ่มห้อง เช่น ม.4/1"
                  className={addCls}
                />
                <button
                  type="submit"
                  className="px-2.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600"
                  title="เพิ่มห้อง"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Students */}
            <div className="flex-1 min-w-0 flex flex-col">
              {selectedGroup ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="font-bold text-slate-900 dark:text-white">
                      ห้อง {selectedGroup}{' '}
                      <span className="text-xs font-medium text-slate-500">({students.length} คน)</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsWizardOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        นำเข้ารายชื่อ
                      </button>
                      <button
                        type="button"
                        onClick={handleExport}
                        disabled={students.length === 0}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700"
                      >
                        <Download className="w-3.5 h-3.5" />
                        ส่งออก CSV
                      </button>
                      <button
                        type="button"
                        onClick={handleClearRoster}
                        disabled={students.length === 0}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-40 text-xs font-semibold"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        ลบทั้งห้อง
                      </button>
                    </div>
                  </div>

                  <div className="overflow-y-auto flex-1 px-2">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400">
                        <tr>
                          <th className="py-2 px-2 text-left w-16">เลขที่</th>
                          <th className="py-2 px-2 text-left">ชื่อ</th>
                          <th className="py-2 px-2 text-left">นามสกุล</th>
                          <th className="py-2 px-2 text-left w-28">ชื่อเล่น</th>
                          <th className="w-9" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        <tr className="bg-indigo-50/50 dark:bg-indigo-950/20">
                          <td className="p-1.5">
                            <input
                              value={newStudent.number}
                              onChange={(e) => setNewStudent((p) => ({ ...p, number: e.target.value }))}
                              placeholder="อัตโนมัติ"
                              className={addCls}
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              value={newStudent.firstName}
                              onChange={(e) => setNewStudent((p) => ({ ...p, firstName: e.target.value }))}
                              placeholder="ชื่อ"
                              className={addCls}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddStudent(e)}
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              value={newStudent.lastName}
                              onChange={(e) => setNewStudent((p) => ({ ...p, lastName: e.target.value }))}
                              placeholder="นามสกุล"
                              className={addCls}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddStudent(e)}
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              value={newStudent.nickname}
                              onChange={(e) => setNewStudent((p) => ({ ...p, nickname: e.target.value }))}
                              placeholder="ชื่อเล่น"
                              className={addCls}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddStudent(e)}
                            />
                          </td>
                          <td className="p-1.5">
                            <button
                              type="button"
                              onClick={handleAddStudent}
                              className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
                              title="เพิ่มนักเรียน"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                        {students.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                            <td className="p-1">
                              <input value={s.number} onChange={(e) => handleEditField(s.id, 'number', e.target.value)} className={inputCls} />
                            </td>
                            <td className="p-1">
                              <input
                                value={s.firstName}
                                onChange={(e) => handleEditField(s.id, 'firstName', e.target.value)}
                                className={inputCls}
                                title={s.prefix ? `คำนำหน้า: ${s.prefix}` : undefined}
                              />
                            </td>
                            <td className="p-1">
                              <input value={s.lastName} onChange={(e) => handleEditField(s.id, 'lastName', e.target.value)} className={inputCls} />
                            </td>
                            <td className="p-1">
                              <input value={s.nickname} onChange={(e) => handleEditField(s.id, 'nickname', e.target.value)} className={inputCls} />
                            </td>
                            <td className="p-1 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteStudent(s.id)}
                                className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                title="ลบนักเรียนคนนี้"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {students.length === 0 && (
                      <div className="py-10 text-center text-xs text-slate-400 space-y-2">
                        <p>ห้องนี้ยังไม่มีรายชื่อ</p>
                        <p>กด &quot;นำเข้ารายชื่อ&quot; เพื่อวางจาก Excel หรืออัปโหลดไฟล์ หรือพิมพ์เพิ่มทีละคนในแถวสีฟ้าด้านบน</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center p-10 text-center text-sm text-slate-400">
                  เพิ่มห้องเรียนทางซ้ายมือเพื่อเริ่มจัดการรายชื่อ
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <RosterImportWizard
        isOpen={isWizardOpen}
        classGroup={selectedGroup}
        existingCount={students.length}
        onImport={handleImport}
        onClose={() => setIsWizardOpen(false)}
      />
    </>
  );
}
