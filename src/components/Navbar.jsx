import React from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  BookOpen,
  GraduationCap,
  Download,
  Printer,
  Moon,
  Sun,
  ChevronDown,
  BarChart3,
  Bell,
  Cloud,
  Check,
  Loader2,
  LogOut,
  User
} from 'lucide-react';
import NotificationDropdown from './ShortNotes/NotificationDropdown';
import { toDateString } from '../utils/dateUtils';

export default function Navbar({
  activeTab,
  setActiveTab,
  semesters,
  activeSemesterId,
  setActiveSemesterId,
  theme,
  setTheme,
  onOpenSubjects,
  onOpenSemesters,
  onOpenBackup,
  onPrintTimetable,
  shortNotes = [],
  overrides = [],
  subjects = [],
  onOpenAddShortNote,
  onOpenEditShortNote,
  onToggleCompleteShortNote,
  onTogglePrepItem,
  onOpenSession,
  isNotificationOpen,
  setIsNotificationOpen,
  user = null,
  onSignOut,
  syncStatus = 'saved',
  isDemoMode = false,
}) {
  const activeSemester = semesters.find(s => s.id === activeSemesterId) || semesters[0];
  const todayStr = toDateString(new Date());

  const pendingCount = shortNotes.filter(n => !n.isCompleted).length;
  const dueTodayCount = shortNotes.filter(n => !n.isCompleted && n.dueDate <= todayStr).length;

  // Unchecked prep items
  const pendingPrepCount = (overrides || [])
    .filter(o => o.date >= todayStr)
    .reduce((acc, o) => acc + (Array.isArray(o.prepChecklist) ? o.prepChecklist.filter(c => !c.isDone).length : 0), 0);

  const prepTodayCount = (overrides || [])
    .filter(o => o.date === todayStr)
    .reduce((acc, o) => acc + (Array.isArray(o.prepChecklist) ? o.prepChecklist.filter(c => !c.isDone).length : 0), 0);

  const totalPending = pendingCount + pendingPrepCount;
  const hasUrgent = dueTodayCount > 0 || prepTodayCount > 0;

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 shadow-sm no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Semester Indicator */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
                  ED<span className="text-indigo-600 dark:text-indigo-400">calendar</span>
                </span>
                <span className="text-[11px] font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                  สำหรับครูอาจารย์
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                <button
                  onClick={onOpenSemesters}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-0.5 underline-offset-2 hover:underline"
                >
                  <span>{activeSemester?.name || 'เลือกภาคเรียน'}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('timetable')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'timetable'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>ตารางสอนประจำสัปดาห์</span>
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'calendar'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>ปฏิทินการสอน</span>
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'summary'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>สรุปผลการสอน</span>
            </button>
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2">
            {activeTab === 'timetable' && (
              <button
                onClick={onPrintTimetable}
                title="พิมพ์ตารางสอน / บันทึก PDF"
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
              >
                <Printer className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>พิมพ์ตารางสอน</span>
              </button>
            )}

            <button
              onClick={onOpenSubjects}
              title="จัดการรายชื่อวิชา"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
            >
              <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden md:inline">รายวิชา</span>
            </button>

            <button
              onClick={onOpenBackup}
              title="สำรองและกู้คืนข้อมูล (Export / Import)"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
            >
              <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden lg:inline">สำรองข้อมูล</span>
            </button>

            {/* Notification Bell with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                title={`แจ้งเตือน & เตรียมสอน (${totalPending} รายการค้าง)`}
                className={`relative p-2 rounded-lg transition-colors border ${
                  isNotificationOpen
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Bell className="w-4 h-4" />
                
                {/* Badge count */}
                {totalPending > 0 && (
                  <span
                    className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center shadow-sm ${
                      hasUrgent
                        ? 'bg-rose-500 animate-pulse ring-2 ring-white dark:ring-slate-900'
                        : 'bg-indigo-600'
                    }`}
                  >
                    {totalPending > 99 ? '99+' : totalPending}
                  </span>
                )}
              </button>

              <NotificationDropdown
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
                shortNotes={shortNotes}
                overrides={overrides}
                subjects={subjects}
                onOpenAdd={onOpenAddShortNote}
                onOpenEdit={onOpenEditShortNote}
                onToggleComplete={onToggleCompleteShortNote}
                onTogglePrepItem={onTogglePrepItem}
                onOpenSession={onOpenSession}
              />
            </div>

            {/* Dark/Light toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด'}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-slate-600" />
              )}
            </button>

            {/* Cloud Sync Status */}
            {user && (
              <div 
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                title={syncStatus === 'saving' ? 'กำลังบันทึกข้อมูลขึ้น Cloud...' : syncStatus === 'error' ? 'บันทึกขึ้น Cloud ไม่สำเร็จ' : 'ข้อมูลซิงค์กับ Cloud แล้ว'}
              >
                {syncStatus === 'saving' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                    <span className="text-[11px]">กำลังซิงค์</span>
                  </>
                ) : syncStatus === 'error' ? (
                  <>
                    <Cloud className="w-3.5 h-3.5 text-rose-500" />
                    <span className="text-[11px] text-rose-600 dark:text-rose-400">ซิงค์ผิดพลาด</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400">คลาวด์</span>
                  </>
                )}
              </div>
            )}

            {/* User Profile / Logout */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div 
                  className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200"
                  title={user.email}
                >
                  <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                    {user.email ? user.email[0].toUpperCase() : <User className="w-3.5 h-3.5" />}
                  </div>
                  <span className="hidden xl:inline max-w-[120px] truncate">
                    {user.email?.split('@')[0]}
                  </span>
                </div>
                <button
                  onClick={onSignOut}
                  title="ออกจากระบบ (Sign Out)"
                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : isDemoMode && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                  Offline
                </span>
                <button
                  onClick={onSignOut}
                  title="กลับไปหน้าเข้าสู่ระบบ"
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  เข้าสู่ระบบ
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
