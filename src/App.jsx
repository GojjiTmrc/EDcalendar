import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import TimetableGrid from './components/Timetable/TimetableGrid';
import SlotModal from './components/Timetable/SlotModal';
import TimetablePrintView from './components/Timetable/TimetablePrintView';
import TeachingCalendar from './components/Calendar/TeachingCalendar';
import TeachingSummary from './components/Summary/TeachingSummary';
import SubjectManagerModal from './components/Subjects/SubjectManagerModal';
import SemesterModal from './components/Semesters/SemesterModal';
import BackupModal from './components/Backup/BackupModal';
import ShortNoteModal from './components/ShortNotes/ShortNoteModal';
import DueAlertBanner from './components/ShortNotes/DueAlertBanner';

import {
  loadData,
  saveData,
  resetData,
  loadTheme,
  saveTheme,
} from './services/storage';

export default function App() {
  // State from LocalStorage
  const [data, setData] = useState(() => loadData());
  const [theme, setTheme] = useState(() => loadTheme());
  const [activeTab, setActiveTab] = useState('timetable'); // 'timetable' | 'calendar'

  // Modals state
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [slotInitialDay, setSlotInitialDay] = useState(1);
  const [slotInitialPeriod, setSlotInitialPeriod] = useState(1);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isSemesterModalOpen, setIsSemesterModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Short Notes & Notifications state
  const [isShortNoteModalOpen, setIsShortNoteModalOpen] = useState(false);
  const [editingShortNote, setEditingShortNote] = useState(null);
  const [shortNoteInitialDate, setShortNoteInitialDate] = useState('');
  const [shortNoteInitialSubjectId, setShortNoteInitialSubjectId] = useState('');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Sync theme
  useEffect(() => {
    saveTheme(theme);
  }, [theme]);

  // Sync data to storage whenever it changes
  const updateData = (updater) => {
    setData((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveData(next);
      return next;
    });
  };

  // Active semester
  const activeSemester = data.semesters.find(s => s.id === data.activeSemesterId) || data.semesters[0];

  // ------------------ Timetable Slot Handlers ------------------
  const handleOpenAddSlot = (dayOfWeek = 1, periodNumber = 1) => {
    setEditingSlot(null);
    setSlotInitialDay(dayOfWeek);
    setSlotInitialPeriod(periodNumber);
    setIsSlotModalOpen(true);
  };

  const handleOpenEditSlot = (slot) => {
    setEditingSlot(slot);
    setSlotInitialDay(slot.dayOfWeek);
    setSlotInitialPeriod(slot.periodNumber || 1);
    setIsSlotModalOpen(true);
  };

  const handleSaveSlot = (slotData) => {
    updateData((prev) => {
      const existsIndex = prev.slots.findIndex(s => s.id === slotData.id);
      let newSlots;
      if (existsIndex >= 0) {
        newSlots = [...prev.slots];
        newSlots[existsIndex] = slotData;
      } else {
        newSlots = [...prev.slots, slotData];
      }
      return { ...prev, slots: newSlots };
    });
  };

  const handleDeleteSlot = (slotId) => {
    updateData((prev) => ({
      ...prev,
      slots: prev.slots.filter(s => s.id !== slotId),
      // Also clean up overrides tied to this slot
      overrides: prev.overrides.filter(o => o.slotId !== slotId),
    }));
  };

  // ------------------ Calendar Override Handlers ------------------
  const handleSaveOverride = (overrideData) => {
    updateData((prev) => {
      // Check if override already exists for this date and slotId (or id)
      const existingIndex = prev.overrides.findIndex(
        o => o.id === overrideData.id || (o.date === overrideData.date && o.slotId && o.slotId === overrideData.slotId)
      );

      let newOverrides;
      if (existingIndex >= 0) {
        newOverrides = [...prev.overrides];
        newOverrides[existingIndex] = overrideData;
      } else {
        newOverrides = [...prev.overrides, overrideData];
      }
      return { ...prev, overrides: newOverrides };
    });
  };

  const handleResetOverride = (dateStr, slotId) => {
    updateData((prev) => ({
      ...prev,
      overrides: prev.overrides.filter(
        o => !(o.date === dateStr && o.slotId === slotId)
      ),
    }));
  };

  const handleDeleteCustomSession = (customSessionId) => {
    updateData((prev) => ({
      ...prev,
      overrides: prev.overrides.filter(o => o.id !== customSessionId),
    }));
  };

  // ------------------ Multi-Day Event Handlers ------------------
  const handleSaveMultiDayEvent = (eventData) => {
    updateData((prev) => {
      const existingIndex = (prev.multiDayEvents || []).findIndex(e => e.id === eventData.id);
      let newEvents;
      if (existingIndex >= 0) {
        newEvents = [...(prev.multiDayEvents || [])];
        newEvents[existingIndex] = eventData;
      } else {
        newEvents = [...(prev.multiDayEvents || []), eventData];
      }
      return { ...prev, multiDayEvents: newEvents };
    });
  };

  const handleDeleteMultiDayEvent = (eventId) => {
    updateData((prev) => ({
      ...prev,
      multiDayEvents: (prev.multiDayEvents || []).filter(e => e.id !== eventId),
    }));
  };

  // ------------------ Subject Handlers ------------------
  const handleSaveSubject = (subjectData) => {
    updateData((prev) => {
      const exists = prev.subjects.findIndex(s => s.id === subjectData.id);
      let newSubjects;
      if (exists >= 0) {
        newSubjects = [...prev.subjects];
        newSubjects[exists] = subjectData;
      } else {
        newSubjects = [...prev.subjects, subjectData];
      }
      return { ...prev, subjects: newSubjects };
    });
  };

  const handleDeleteSubject = (subjectId) => {
    updateData((prev) => ({
      ...prev,
      subjects: prev.subjects.filter(s => s.id !== subjectId),
      slots: prev.slots.filter(s => s.subjectId !== subjectId),
      overrides: prev.overrides.filter(o => o.subjectId !== subjectId),
    }));
  };

  // ------------------ Semester Handlers ------------------
  const handleSelectSemester = (semesterId) => {
    updateData((prev) => ({ ...prev, activeSemesterId: semesterId }));
  };

  const handleSaveSemester = (semesterData) => {
    updateData((prev) => {
      const exists = prev.semesters.findIndex(s => s.id === semesterData.id);
      let newSemesters;
      if (exists >= 0) {
        newSemesters = [...prev.semesters];
        newSemesters[exists] = semesterData;
      } else {
        newSemesters = [...prev.semesters, semesterData];
      }
      return { ...prev, semesters: newSemesters, activeSemesterId: semesterData.id };
    });
  };

  const handleDeleteSemester = (semesterId) => {
    updateData((prev) => {
      const newSemesters = prev.semesters.filter(s => s.id !== semesterId);
      return {
        ...prev,
        semesters: newSemesters,
        activeSemesterId: newSemesters[0]?.id || null,
        slots: prev.slots.filter(s => s.semesterId !== semesterId),
        overrides: prev.overrides.filter(o => o.semesterId !== semesterId),
        multiDayEvents: (prev.multiDayEvents || []).filter(e => e.semesterId !== semesterId),
      };
    });
  };

  // ------------------ Backup & Reset Handlers ------------------
  const handleDataImported = (newData) => {
    setData(newData);
  };

  const handleResetData = () => {
    const res = resetData();
    setData(res);
  };

  // ------------------ Short Notes Handlers ------------------
  const handleOpenAddShortNote = (date = '', subjectId = '') => {
    setEditingShortNote(null);
    setShortNoteInitialDate(date);
    setShortNoteInitialSubjectId(subjectId);
    setIsShortNoteModalOpen(true);
  };

  const handleOpenEditShortNote = (note) => {
    setEditingShortNote(note);
    setIsShortNoteModalOpen(true);
  };

  const handleSaveShortNote = (noteData) => {
    updateData((prev) => {
      const notes = prev.shortNotes || [];
      const existsIndex = notes.findIndex(n => n.id === noteData.id);
      let newNotes;
      if (existsIndex >= 0) {
        newNotes = [...notes];
        newNotes[existsIndex] = noteData;
      } else {
        newNotes = [noteData, ...notes];
      }
      return { ...prev, shortNotes: newNotes };
    });
  };

  const handleDeleteShortNote = (noteId) => {
    updateData((prev) => ({
      ...prev,
      shortNotes: (prev.shortNotes || []).filter(n => n.id !== noteId),
    }));
  };

  const handleToggleCompleteShortNote = (noteId) => {
    updateData((prev) => {
      const notes = prev.shortNotes || [];
      const newNotes = notes.map((note) => {
        if (note.id !== noteId) return note;
        const nextCompleted = !note.isCompleted;
        return {
          ...note,
          isCompleted: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : null,
        };
      });
      return { ...prev, shortNotes: newNotes };
    });
  };

  // ------------------ Lesson Prep Checklist Handler ------------------
  const handleTogglePrepItem = (date, slotIdOrCustomId, prepItemId) => {
    updateData((prev) => {
      const overrides = prev.overrides || [];
      const index = overrides.findIndex(
        o => o.date === date && (o.id === slotIdOrCustomId || o.slotId === slotIdOrCustomId)
      );
      if (index < 0) return prev;

      const target = overrides[index];
      const checklist = Array.isArray(target.prepChecklist) ? target.prepChecklist : [];
      const newChecklist = checklist.map(item =>
        item.id === prepItemId ? { ...item, isDone: !item.isDone } : item
      );

      const updatedOverrides = [...overrides];
      updatedOverrides[index] = {
        ...target,
        prepChecklist: newChecklist,
      };

      return { ...prev, overrides: updatedOverrides };
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        semesters={data.semesters}
        activeSemesterId={data.activeSemesterId}
        setActiveSemesterId={handleSelectSemester}
        theme={theme}
        setTheme={setTheme}
        onOpenSubjects={() => setIsSubjectModalOpen(true)}
        onOpenSemesters={() => setIsSemesterModalOpen(true)}
        onOpenBackup={() => setIsBackupModalOpen(true)}
        onPrintTimetable={() => setIsPrintModalOpen(true)}
        shortNotes={data.shortNotes || []}
        overrides={data.overrides || []}
        subjects={data.subjects || []}
        onOpenAddShortNote={handleOpenAddShortNote}
        onOpenEditShortNote={handleOpenEditShortNote}
        onToggleCompleteShortNote={handleToggleCompleteShortNote}
        onTogglePrepItem={handleTogglePrepItem}
        onOpenSession={() => setActiveTab('calendar')}
        isNotificationOpen={isNotificationOpen}
        setIsNotificationOpen={setIsNotificationOpen}
      />

      {/* Due & Prep Alert Banner */}
      <DueAlertBanner
        shortNotes={data.shortNotes || []}
        overrides={data.overrides || []}
        subjects={data.subjects || []}
        onOpenDropdown={() => setIsNotificationOpen(true)}
        onOpenEdit={handleOpenEditShortNote}
        onToggleComplete={handleToggleCompleteShortNote}
        onOpenSession={() => setActiveTab('calendar')}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'timetable' && (
          <TimetableGrid
            slots={data.slots}
            subjects={data.subjects}
            activeSemester={activeSemester}
            onAddSlot={handleOpenAddSlot}
            onEditSlot={handleOpenEditSlot}
            onPrint={() => setIsPrintModalOpen(true)}
          />
        )}
        
        {activeTab === 'calendar' && (
          <TeachingCalendar
            semester={activeSemester}
            slots={data.slots}
            subjects={data.subjects}
            overrides={data.overrides}
            multiDayEvents={data.multiDayEvents || []}
            shortNotes={data.shortNotes || []}
            onSaveOverride={handleSaveOverride}
            onResetOverride={handleResetOverride}
            onDeleteCustomSession={handleDeleteCustomSession}
            onSaveMultiDayEvent={handleSaveMultiDayEvent}
            onDeleteMultiDayEvent={handleDeleteMultiDayEvent}
            onOpenAddShortNote={handleOpenAddShortNote}
            onOpenEditShortNote={handleOpenEditShortNote}
            onToggleCompleteShortNote={handleToggleCompleteShortNote}
          />
        )}

        {activeTab === 'summary' && (
          <TeachingSummary
            semester={activeSemester}
            slots={data.slots}
            subjects={data.subjects}
            overrides={data.overrides}
            multiDayEvents={data.multiDayEvents || []}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-slate-200 dark:border-slate-800/80 text-center text-xs text-slate-500 dark:text-slate-400 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">EDcalendar</span>
            <span>•</span>
            <span>ระบบจัดการตารางสอนและปฏิทินการสอน (Local-first)</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSubjectModalOpen(true)}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              รายวิชาทั้งหมด ({data.subjects.length})
            </button>
            <button
              onClick={() => setIsSemesterModalOpen(true)}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              {activeSemester?.name}
            </button>
            <button
              onClick={() => setIsBackupModalOpen(true)}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              สำรองข้อมูล
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SlotModal
        isOpen={isSlotModalOpen}
        onClose={() => setIsSlotModalOpen(false)}
        onSave={handleSaveSlot}
        onDelete={handleDeleteSlot}
        editingSlot={editingSlot}
        initialDayOfWeek={slotInitialDay}
        initialPeriodNumber={slotInitialPeriod}
        subjects={data.subjects}
        semesterId={data.activeSemesterId}
        onOpenNewSubject={() => {
          setIsSlotModalOpen(false);
          setIsSubjectModalOpen(true);
        }}
      />

      <TimetablePrintView
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        slots={data.slots}
        subjects={data.subjects}
        activeSemester={activeSemester}
      />

      <SubjectManagerModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        subjects={data.subjects}
        slots={data.slots}
        onSaveSubject={handleSaveSubject}
        onDeleteSubject={handleDeleteSubject}
      />

      <SemesterModal
        isOpen={isSemesterModalOpen}
        onClose={() => setIsSemesterModalOpen(false)}
        semesters={data.semesters}
        activeSemesterId={data.activeSemesterId}
        onSelectSemester={handleSelectSemester}
        onSaveSemester={handleSaveSemester}
        onDeleteSemester={handleDeleteSemester}
      />

      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        allData={data}
        onDataImported={handleDataImported}
        onResetData={handleResetData}
      />

      <ShortNoteModal
        isOpen={isShortNoteModalOpen}
        onClose={() => setIsShortNoteModalOpen(false)}
        editingNote={editingShortNote}
        initialDate={shortNoteInitialDate}
        initialSubjectId={shortNoteInitialSubjectId}
        subjects={data.subjects || []}
        onSave={handleSaveShortNote}
        onDelete={handleDeleteShortNote}
      />

    </div>
  );
}
