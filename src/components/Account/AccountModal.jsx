import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Save,
  GraduationCap,
  Building2,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Fingerprint,
} from 'lucide-react';
import { updateAccountProfile, getLocalAccounts } from '../../services/supabaseClient';

export default function AccountModal({
  isOpen,
  onClose,
  user,
  allData = {},
  onUserUpdated,
}) {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [academicRole, setAcademicRole] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      const accounts = getLocalAccounts();
      const matched = accounts.find(
        (a) =>
          (user.id && a.id === user.id) ||
          (user.email && a.email.toLowerCase() === user.email.toLowerCase())
      );

      const resolvedUsername =
        user.username ||
        user.user_metadata?.username ||
        matched?.username ||
        user.email?.split('@')[0] ||
        '';
      const resolvedDisplayName =
        user.user_metadata?.name || matched?.name || resolvedUsername;

      const storedTeacherName =
        matched?.teacherName ||
        user.teacherName ||
        localStorage.getItem('edcalendar_teacher_name') ||
        'นายกิตติพงษ์ โพธิวาระ';
      const storedSchoolName =
        matched?.schoolName ||
        user.schoolName ||
        localStorage.getItem('edcalendar_school_name') ||
        'โรงเรียนสุมเส้าพิทยาคาร';
      const storedAcademicRole =
        matched?.academicRole ||
        user.academicRole ||
        localStorage.getItem('edcalendar_academic_role') ||
        'กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี';

      setUsername(resolvedUsername);
      setDisplayName(resolvedDisplayName);
      setTeacherName(storedTeacherName);
      setSchoolName(storedSchoolName);
      setAcademicRole(storedAcademicRole);
      setNewPassword('');
      setConfirmPassword('');
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanUser = username.trim();
    if (!cleanUser || cleanUser.length < 3) {
      setErrorMsg('ชื่อผู้ใช้ (Username) ต้องมีความยาวอย่างน้อย 3 ตัวอักษร');
      return;
    }
    if (/\s/.test(cleanUser) || cleanUser.includes('@')) {
      setErrorMsg('ชื่อผู้ใช้ (Username) ห้ามมีช่องว่างหรือเครื่องหมาย @');
      return;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        setErrorMsg('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('รหัสผ่านยืนยันไม่ตรงกัน');
        return;
      }
    }

    try {
      setSaving(true);
      const updatedUser = await updateAccountProfile({
        userId: user.id,
        email: user.email,
        newUsername: cleanUser,
        displayName: displayName.trim() || cleanUser,
        teacherName: teacherName.trim(),
        schoolName: schoolName.trim(),
        academicRole: academicRole.trim(),
        newPassword: newPassword || undefined,
      });

      if (teacherName.trim()) {
        localStorage.setItem('edcalendar_teacher_name', teacherName.trim());
      }
      if (schoolName.trim()) {
        localStorage.setItem('edcalendar_school_name', schoolName.trim());
      }
      if (academicRole.trim()) {
        localStorage.setItem('edcalendar_academic_role', academicRole.trim());
      }

      if (onUserUpdated) {
        onUserUpdated(updatedUser);
      }

      setNewPassword('');
      setConfirmPassword('');
      setSuccessMsg('บันทึกข้อมูลบัญชีและซิงค์ขึ้น Cloud เรียบร้อยแล้ว!');
    } catch (err) {
      setErrorMsg(err.message || 'ไม่สามารถบันทึกข้อมูลบัญชีได้');
    } finally {
      setSaving(false);
    }
  };

  const semestersCount = allData.semesters?.length || 0;
  const subjectsCount = allData.subjects?.length || 0;
  const slotsCount = allData.slots?.length || 0;
  const notesCount = allData.shortNotes?.length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-base">
              {(username || user.email || 'U')[0].toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                จัดการบัญชีผู้ใช้
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                แก้ไขชื่อผู้ใช้ ข้อมูลครูประจำตัว และรหัสผ่านของบัญชีนี้
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Account Summary Banner */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
                <Fingerprint className="w-4 h-4 text-indigo-500" />
                รหัสบัญชี (User ID):
              </span>
              <code className="px-2 py-0.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 text-[11px] text-indigo-600 dark:text-indigo-400 font-mono">
                {user.id}
              </code>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs pt-1">
              <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
                <div className="font-bold text-sm text-slate-800 dark:text-slate-100">{semestersCount}</div>
                <div className="text-[10px] text-slate-500">ภาคเรียน</div>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
                <div className="font-bold text-sm text-slate-800 dark:text-slate-100">{subjectsCount}</div>
                <div className="text-[10px] text-slate-500">รายวิชา</div>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
                <div className="font-bold text-sm text-slate-800 dark:text-slate-100">{slotsCount}</div>
                <div className="text-[10px] text-slate-500">คาบสอน</div>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
                <div className="font-bold text-sm text-slate-800 dark:text-slate-100">{notesCount}</div>
                <div className="text-[10px] text-slate-500">โน้ตช่วยจำ</div>
              </div>
            </div>
          </div>

          {/* 1. Account & Identity */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-500" />
              1. ข้อมูลบัญชีและตัวตน (Account & Identity)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    อีเมลที่ผูกกับบัญชี (Email)
                  </label>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    1 อีเมล = 1 บัญชีถาวร
                  </span>
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={user.email || ''}
                    disabled
                    className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  ชื่อผู้ใช้สำหรับล็อกอิน (Username) *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="เช่น kru_somchai"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  ชื่อที่แสดงผล (Display Name)
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="ชื่อเรียกบนแถบเมนู"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* 2. Teacher Print Profile */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
              2. ข้อมูลครูสำหรับพิมพ์เอกสารราชการ (ใช้กรอกอัตโนมัติเวลาพิมพ์)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  ชื่อ-นามสกุลครูผู้สอน
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    placeholder="เช่น นายกิตติพงษ์ โพธิวาระ"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  ชื่อโรงเรียน / สถานศึกษา
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="เช่น โรงเรียนสุมเส้าพิทยาคาร"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  กลุ่มสาระการเรียนรู้ / แผนกวิชา
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={academicRole}
                    onChange={(e) => setAcademicRole(e.target.value)}
                    placeholder="เช่น กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Change Password */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-500" />
                3. เปลี่ยนรหัสผ่าน (เว้นว่างไว้หากไม่ต้องการเปลี่ยน)
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  รหัสผ่านใหม่
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                    className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  ยืนยันรหัสผ่านใหม่
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                    className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              ปิดหน้าต่าง
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>บันทึกการเปลี่ยนแปลง</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
