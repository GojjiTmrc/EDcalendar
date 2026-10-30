import React, { useState, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  BookOpen,
  GraduationCap,
  ChevronDown,
  BarChart3,
  Bell,
  Cloud,
  Loader2,
  LogOut,
  User,
  UserCog,
  Settings,
} from 'lucide-react';
import NotificationDropdown from './ShortNotes/NotificationDropdown';
import { toDateString } from '../utils/dateUtils';

export default function Navbar({
  activeTab,
  setActiveTab,
  semesters,
  activeSemesterId,
  onOpenSubjects,
  onOpenSemesters,
  onOpenAccount,
  onOpenSettings,
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
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const closeMenuTimeoutRef = useRef(null);

  const handleProfileMouseEnter = () => {
    if (closeMenuTimeoutRef.current) {
      clearTimeout(closeMenuTimeoutRef.current);
      closeMenuTimeoutRef.current = null;
    }
    setIsProfileMenuOpen(true);
  };

  const handleProfileMouseLeave = () => {
    closeMenuTimeoutRef.current = setTimeout(() => {
      setIsProfileMenuOpen(false);
    }, 150);
  };

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

  const displayName = user
    ? user.user_metadata?.name ||
      user.username ||
      user.user_metadata?.username ||
      user.email?.split('@')[0] ||
      'ผู้ใช้งาน'
    : '';
  const usernameText = user
    ? user.username || user.user_metadata?.username || user.email?.split('@')[0] || displayName
    : '';

  return (
    <>
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
                <span className="hidden sm:inline-block text-[11px] font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
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
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700">
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
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={onOpenSubjects}
              title="จัดการรายชื่อวิชา"
              className="hidden md:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
            >
              <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>รายวิชา</span>
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

            {/* User Profile Hover Dropdown Menu */}
            {user ? (
              <div
                className="relative pl-2 border-l border-slate-200 dark:border-slate-800"
                onMouseEnter={handleProfileMouseEnter}
                onMouseLeave={handleProfileMouseLeave}
              >
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                    {usernameText ? usernameText[0].toUpperCase() : <User className="w-3.5 h-3.5" />}
                  </div>
                  <span className="hidden sm:inline max-w-[130px] truncate font-semibold">
                    {usernameText}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                      isProfileMenuOpen ? 'rotate-180 text-indigo-500' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-1.5 w-60 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    {/* User Info Header */}
                    <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                      <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {displayName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        @{usernameText}
                      </div>
                      {user.email && (
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                          {user.email}
                        </div>
                      )}
                    </div>

                    {/* Menu Items */}
                    <div className="py-1 px-1.5 space-y-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          if (onOpenAccount) onOpenAccount();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-400 transition-colors text-left"
                      >
                        <UserCog className="w-4 h-4 text-indigo-500" />
                        <span>จัดการบัญชี</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          if (onOpenSettings) onOpenSettings();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-400 transition-colors text-left"
                      >
                        <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <span>ตั้งค่า</span>
                      </button>
                    </div>

                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                    <div className="px-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          if (onSignOut) onSignOut();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>ออกจากระบบ</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : isDemoMode && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="ตั้งค่าระบบ"
                >
                  <Settings className="w-4 h-4" />
                </button>
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

      {/* Mobile Bottom Navigation Bar (md:hidden) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-lg px-2 py-1.5 flex items-center justify-around no-print pb-safe">
        <button
          onClick={() => setActiveTab('timetable')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'timetable'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Clock className={`w-5 h-5 ${activeTab === 'timetable' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">ตารางสอน</span>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'calendar'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <CalendarIcon className={`w-5 h-5 ${activeTab === 'calendar' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">ปฏิทินสอน</span>
        </button>

        <button
          onClick={() => setActiveTab('summary')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'summary'
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BarChart3 className={`w-5 h-5 ${activeTab === 'summary' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">สรุปผล</span>
        </button>

        <button
          onClick={onOpenSubjects}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">รายวิชา</span>
        </button>
      </nav>
    </>
  );
}
