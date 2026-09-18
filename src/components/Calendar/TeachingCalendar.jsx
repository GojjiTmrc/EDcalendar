import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalIcon,
  Plus,
  Flag,
  CheckCircle2,
  Ban,
  AlertCircle,
  Clock,
  FileText
} from 'lucide-react';
import MonthView from './MonthView';
import WeekView from './WeekView';
import DayView from './DayView';
import SessionDetailModal from './SessionDetailModal';
import MultiDayEventModal from './MultiDayEventModal';
import {
  THAI_MONTHS_FULL,
  toDateString,
  parseDateString,
  formatThaiDate,
  jsDayToThaiDay
} from '../../utils/dateUtils';
import {
  getMonthSessionsMap,
  getSessionsForDate,
  getMonthMultiDayEventsMap,
  getMultiDayEventsForDate
} from '../../services/calendarGenerator';

export default function TeachingCalendar({
  semester,
  slots,
  subjects,
  overrides,
  multiDayEvents = [],
  shortNotes = [],
  onSaveOverride,
  onResetOverride,
  onDeleteCustomSession,
  onSaveMultiDayEvent,
  onDeleteMultiDayEvent,
  onOpenAddShortNote,
  onOpenEditShortNote,
  onToggleCompleteShortNote,
}) {
  // Current active date in view
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    // If today is weekend (Sat=6, Sun=0), advance to Monday
    const jsDay = today.getDay();
    if (jsDay === 6) today.setDate(today.getDate() + 2);
    if (jsDay === 0) today.setDate(today.getDate() + 1);

    const todayStr = toDateString(today);
    if (semester && (todayStr < semester.startDate || todayStr > semester.endDate)) {
      return parseDateString(semester.startDate);
    }
    return today;
  });

  const [calendarView, setCalendarView] = useState('month'); // 'month' | 'week' | 'day'

  // Session modal state
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedDateForModal, setSelectedDateForModal] = useState(null);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);

  // Multi-day event modal state
  const [isMultiDayModalOpen, setIsMultiDayModalOpen] = useState(false);
  const [editingMultiDayEvent, setEditingMultiDayEvent] = useState(null);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const currentDateStr = toDateString(currentDate);

  // Calculate monthly sessions map (merging weekly slots, overrides, and multiDayEvents)
  const monthSessionsMap = useMemo(() => {
    return getMonthSessionsMap(currentYear, currentMonth, semester, slots, subjects, overrides, multiDayEvents);
  }, [currentYear, currentMonth, semester, slots, subjects, overrides, multiDayEvents]);

  // Calculate monthly multi-day events map
  const monthMultiDayEventsMap = useMemo(() => {
    return getMonthMultiDayEventsMap(currentYear, currentMonth, multiDayEvents);
  }, [currentYear, currentMonth, multiDayEvents]);

  // Daily sessions for Day view
  const daySessions = useMemo(() => {
    return getSessionsForDate(currentDateStr, semester, slots, subjects, overrides, multiDayEvents);
  }, [currentDateStr, semester, slots, subjects, overrides, multiDayEvents]);

  // Daily multi-day events for Day view
  const dayMultiDayEvents = useMemo(() => {
    return getMultiDayEventsForDate(currentDateStr, multiDayEvents);
  }, [currentDateStr, multiDayEvents]);

  // Navigation handlers (skips weekends in Day view)
  const handlePrev = () => {
    if (calendarView === 'month') {
      setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    } else if (calendarView === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else {
      // Day view: if Monday, jump to previous Friday (-3 days)
      const d = new Date(currentDate);
      const thaiDay = jsDayToThaiDay(d.getDay());
      if (thaiDay === 1) {
        d.setDate(d.getDate() - 3);
      } else {
        d.setDate(d.getDate() - 1);
      }
      setCurrentDate(d);
    }
  };

  const handleNext = () => {
    if (calendarView === 'month') {
      setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    } else if (calendarView === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else {
      // Day view: if Friday, jump to next Monday (+3 days)
      const d = new Date(currentDate);
      const thaiDay = jsDayToThaiDay(d.getDay());
      if (thaiDay === 5) {
        d.setDate(d.getDate() + 3);
      } else {
        d.setDate(d.getDate() + 1);
      }
      setCurrentDate(d);
    }
  };

  const handleToday = () => {
    const today = new Date();
    const jsDay = today.getDay();
    if (jsDay === 6) today.setDate(today.getDate() + 2);
    if (jsDay === 0) today.setDate(today.getDate() + 1);
    setCurrentDate(today);
  };

  // Open modal on session click
  const handleSelectSession = (sess) => {
    setSelectedSession(sess);
    setSelectedDateForModal(sess.date);
    setIsSessionModalOpen(true);
  };

  // Open modal on day click (to add custom activity or view that day)
  const handleSelectDate = (dateStr) => {
    setSelectedSession(null);
    setSelectedDateForModal(dateStr);
    setIsSessionModalOpen(true);
  };

  // Open multi-day event modal
  const handleOpenAddMultiDay = () => {
    setEditingMultiDayEvent(null);
    setIsMultiDayModalOpen(true);
  };

  const handleEditMultiDayEvent = (mde) => {
    setEditingMultiDayEvent(mde);
    setIsMultiDayModalOpen(true);
  };

  // Format header title according to current view
  const headerTitle = useMemo(() => {
    if (calendarView === 'month') {
      return `${THAI_MONTHS_FULL[currentMonth]} พ.ศ. ${currentYear + 543}`;
    }
    if (calendarView === 'week') {
      return `สัปดาห์ที่ ${formatThaiDate(currentDateStr, 'short')}`;
    }
    return formatThaiDate(currentDateStr, 'withDay');
  }, [calendarView, currentMonth, currentYear, currentDateStr]);

  return (
    <div className="space-y-4">
      
      {/* Calendar Controls & Top Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Navigation & Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={handlePrev}
              title="ย้อนกลับ"
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-semibold hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
            >
              วันนี้
            </button>
            <button
              onClick={handleNext}
              title="ถัดไป"
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              {headerTitle}
            </h2>
            <span className="hidden sm:inline-block text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
              จันทร์ - ศุกร์
            </span>
          </div>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium">
            <button
              onClick={() => setCalendarView('month')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                calendarView === 'month'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              รายเดือน
            </button>
            <button
              onClick={() => setCalendarView('week')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                calendarView === 'week'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              รายสัปดาห์
            </button>
            <button
              onClick={() => setCalendarView('day')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                calendarView === 'day'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              รายวัน
            </button>
          </div>

          {/* Add Multi-Day Event Button */}
          <button
            onClick={handleOpenAddMultiDay}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800 rounded-xl text-xs font-semibold transition-all hover:scale-[1.02]"
            title="บันทึกกิจกรรมต่อเนื่องหลายวัน (เช่น กีฬาสี, สัปดาห์สอบ, เข้าค่าย)"
          >
            <Flag className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>+ กิจกรรมหลายวัน</span>
          </button>

          {/* Add Short Note Button */}
          <button
            onClick={() => onOpenAddShortNote && onOpenAddShortNote(currentDateStr)}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 dark:bg-amber-950/70 hover:bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 rounded-xl text-xs font-semibold transition-all hover:scale-[1.02]"
            title="นัดหมายส่งงาน / การบ้าน"
          >
            <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>+ นัดหมายส่งงาน</span>
          </button>

          {/* Quick Add Single-day Custom Session */}
          <button
            onClick={() => handleSelectDate(currentDateStr)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ กิจกรรมรายวัน / ชดเชย</span>
          </button>
        </div>
      </div>

      {/* Status Legend Bar */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
        <span className="font-semibold text-slate-700 dark:text-slate-300">สัญลักษณ์:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>สอนปกติ</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <span>งดสอน</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>ติดกิจกรรม / วันหยุด</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
          <span>สอนชดเชย</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>📝 นัดส่งงาน</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto text-amber-700 dark:text-amber-300 font-medium">
          <Flag className="w-3 h-3" />
          <span>กิจกรรมหลายวัน: {multiDayEvents.length} รายการ</span>
        </div>
      </div>

      {/* Main Calendar View Area */}
      {calendarView === 'month' && (
        <MonthView
          year={currentYear}
          month={currentMonth}
          sessionsMap={monthSessionsMap}
          multiDayEventsMap={monthMultiDayEventsMap}
          shortNotes={shortNotes}
          onSelectSession={handleSelectSession}
          onSelectDate={handleSelectDate}
          onEditMultiDayEvent={handleEditMultiDayEvent}
          onEditShortNote={onOpenEditShortNote}
        />
      )}

      {calendarView === 'week' && (
        <WeekView
          currentDate={currentDate}
          sessionsMap={monthSessionsMap}
          multiDayEventsMap={monthMultiDayEventsMap}
          shortNotes={shortNotes}
          onSelectSession={handleSelectSession}
          onSelectDate={handleSelectDate}
          onEditMultiDayEvent={handleEditMultiDayEvent}
          onEditShortNote={onOpenEditShortNote}
        />
      )}

      {calendarView === 'day' && (
        <DayView
          dateStr={currentDateStr}
          sessions={daySessions}
          multiDayEvents={dayMultiDayEvents}
          shortNotes={shortNotes}
          onSelectSession={handleSelectSession}
          onAddCustomSession={handleSelectDate}
          onEditMultiDayEvent={handleEditMultiDayEvent}
          onOpenAddShortNote={onOpenAddShortNote}
          onEditShortNote={onOpenEditShortNote}
          onToggleCompleteShortNote={onToggleCompleteShortNote}
        />
      )}

      {/* Session Detail & Edit Modal */}
      <SessionDetailModal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        session={selectedSession}
        dateStr={selectedDateForModal || currentDateStr}
        subjects={subjects}
        semesterId={semester?.id}
        shortNotes={shortNotes}
        onSaveOverride={onSaveOverride}
        onResetOverride={onResetOverride}
        onDeleteCustomSession={onDeleteCustomSession}
        onOpenAddShortNote={onOpenAddShortNote}
        onOpenEditShortNote={onOpenEditShortNote}
        onToggleCompleteShortNote={onToggleCompleteShortNote}
      />

      {/* Multi-Day Event Modal */}
      <MultiDayEventModal
        isOpen={isMultiDayModalOpen}
        onClose={() => setIsMultiDayModalOpen(false)}
        editingEvent={editingMultiDayEvent}
        initialDateStr={selectedDateForModal || currentDateStr}
        semesterId={semester?.id}
        onSave={onSaveMultiDayEvent}
        onDelete={onDeleteMultiDayEvent}
      />

    </div>
  );
}
