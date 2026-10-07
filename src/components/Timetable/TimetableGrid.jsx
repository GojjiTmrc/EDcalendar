import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Clock, 
  MapPin, 
  Users, 
  BookOpen, 
  Printer, 
  Settings, 
  Filter, 
  Sparkles, 
  AlertCircle, 
  Edit3,
  Smartphone,
  LayoutGrid,
  ChevronRight
} from 'lucide-react';
import { SCHOOL_DAYS, timeToMinutes, formatDurationThai, jsDayToThaiDay } from '../../utils/dateUtils';
import { getColorById } from '../../utils/colors';
import {
  DEFAULT_PERIODS,
  DEFAULT_ACTIVITIES,
  getStoredPeriods,
  saveStoredPeriods,
  getSlotPeriodMapping,
} from '../../utils/periodConfig';
import PeriodSettingsModal from './PeriodSettingsModal';

export default function TimetableGrid({
  slots = [],
  subjects = [],
  activeSemester,
  onAddSlot,
  onEditSlot,
  onPrint,
}) {
  const [periods, setPeriods] = useState(() => getStoredPeriods());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all');

  // Mobile responsive view modes: 'daily' (vertical cards by day) | 'matrix' (full horizontal scroll table)
  const [mobileViewMode, setMobileViewMode] = useState('daily');
  const [selectedDay, setSelectedDay] = useState(() => {
    const todayNum = jsDayToThaiDay(new Date().getDay());
    return todayNum >= 1 && todayNum <= 5 ? todayNum : 1;
  });

  const subjectMap = new Map(subjects.map(s => [s.id, s]));

  // School days: Monday to Friday only
  const displayDays = SCHOOL_DAYS;

  // Filter slots by active semester
  const semesterSlots = slots.filter(s => s.semesterId === activeSemester?.id);

  // Filter by subject if selected
  const filteredSlots = selectedSubjectFilter === 'all'
    ? semesterSlots
    : semesterSlots.filter(s => s.subjectId === selectedSubjectFilter);

  // Calculate statistics (Strictly Hours and Minutes, NO decimals)
  const totalSlotsCount = semesterSlots.reduce((acc, slot) => {
    const sub = subjects.find(s => s.id === slot.subjectId);
    return acc + (Number(slot.periods) || Number(sub?.periods) || 1);
  }, 0);
  const totalMinutes = semesterSlots.reduce((acc, slot) => {
    return acc + Math.max(0, timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime));
  }, 0);
  const hoursPart = Math.floor(totalMinutes / 60);
  const minsPart = totalMinutes % 60;
  const uniqueSubjectsCount = new Set(semesterSlots.map(s => s.subjectId)).size;

  const handleSavePeriods = (newPeriods) => {
    setPeriods(newPeriods);
    saveStoredPeriods(newPeriods);
  };

  const teachingPeriods = periods.filter(p => !p.isLunch);
  const lunchPeriod = periods.find(p => p.isLunch) || { label: 'พักเที่ยง', startTime: '12:00', endTime: '13:00' };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Action Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              ตารางสอนประจำสัปดาห์
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
              {activeSemester?.name || 'ภาคเรียนปัจจุบัน'}
            </span>
            <span className="text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
              ตารางมาตรฐานโรงเรียน (คาบ 1 - 8)
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            คลิกที่ช่องว่างในตารางเพื่อเพิ่มคาบสอน หรือคลิกที่คาบเพื่อแก้ไขข้อมูล
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mobile View Switcher (Daily Cards vs Full Matrix) */}
          <div className="flex md:hidden items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs w-full sm:w-auto justify-center mb-1 sm:mb-0">
            <button
              type="button"
              onClick={() => setMobileViewMode('daily')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                mobileViewMode === 'daily'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>การ์ดรายวัน</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileViewMode('matrix')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                mobileViewMode === 'matrix'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>ตารางรวม</span>
            </button>
          </div>

          {/* Filter by subject */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer text-xs"
            >
              <option value="all">ทุกรายวิชา</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
              ))}
            </select>
          </div>

          {/* Period Settings button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            title="ตั้งค่าเวลาคาบเรียนกริ่งโรงเรียน"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">ตั้งค่าเวลาคาบ</span>
          </button>

          {/* Print button */}
          <button
            onClick={onPrint}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-indigo-500" />
            <span>พิมพ์ / PDF</span>
          </button>

          {/* Add Slot Button */}
          <button
            onClick={() => onAddSlot(selectedDay, 1)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>เพิ่มคาบสอน</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards (Responsive 2x2 on mobile, 4 columns on lg) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">{totalSlotsCount}</div>
            <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">คาบสอนต่อสัปดาห์</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="text-base sm:text-2xl font-bold text-slate-900 dark:text-white">
              {hoursPart} ชม. {minsPart > 0 ? `${minsPart} น.` : ''}
            </div>
            <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">เวลาสอนรวม</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">{uniqueSubjectsCount}</div>
            <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">วิชาที่รับผิดชอบ</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">5 วัน</div>
            <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">จันทร์ - ศุกร์</div>
          </div>
        </div>
      </div>

      {/* MOBILE DAILY VIEW (Shown when mobileViewMode === 'daily' on small screens) */}
      <div className={`md:hidden ${mobileViewMode === 'daily' ? 'block' : 'hidden'} space-y-3`}>
        {/* Day Selector Tabs (จันทร์ - ศุกร์) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {displayDays.map((d) => {
            const daySlotsCount = filteredSlots.filter(s => s.dayOfWeek === d.index).length;
            const isSelected = selectedDay === d.index;
            return (
              <button
                key={d.index}
                type="button"
                onClick={() => setSelectedDay(d.index)}
                className={`flex-1 min-w-[62px] py-2 px-1 rounded-xl text-center transition-all border flex flex-col items-center justify-center gap-0.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                <span className="text-xs font-bold">{d.short}</span>
                <span className={`text-[10px] px-1.5 rounded-full font-medium ${
                  isSelected
                    ? 'bg-indigo-500/80 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  {daySlotsCount} คาบ
                </span>
              </button>
            );
          })}
        </div>

        {/* Current Day Schedule Cards */}
        <div className="space-y-2.5">
          {(() => {
            const curDaySlots = filteredSlots
              .filter(s => s.dayOfWeek === selectedDay)
              .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

            // Map slots to start period & span
            const periodSlotMap = {};
            for (const slot of curDaySlots) {
              const mapping = getSlotPeriodMapping(slot, periods);
              if (mapping) {
                periodSlotMap[mapping.startPeriod] = { slot, span: mapping.span };
              }
            }

            const timelineItems = [];
            let skipUntil = 0;

            for (const p of periods) {
              if (p.isLunch) {
                timelineItems.push(
                  <div key="lunch" className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
                    <div className="flex items-center gap-2 font-medium">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>พักรับประทานอาหารกลางวัน</span>
                    </div>
                    <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400">{p.startTime} - {p.endTime}</span>
                  </div>
                );
                continue;
              }

              const pNum = p.period;
              if (pNum < skipUntil) continue;

              const slotInfo = periodSlotMap[pNum];
              if (slotInfo) {
                const { slot, span } = slotInfo;
                skipUntil = pNum + span;
                const subject = subjectMap.get(slot.subjectId) || {
                  code: '???',
                  name: 'ไม่พบวิชา',
                  defaultRoom: '-',
                  gradeGroup: '',
                  colorId: 'indigo',
                };
                const color = getColorById(subject.colorId);
                const room = slot.roomOverride || subject.defaultRoom;

                timelineItems.push(
                  <div
                    key={pNum}
                    onClick={() => onEditSlot(slot)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-xs active:scale-[0.99] ${color.bg} ${color.border}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-white/80 dark:bg-slate-900/80 text-slate-800 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700/50">
                          คาบ {span > 1 ? `${pNum} - ${pNum + span - 1}` : pNum}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          {slot.startTime} - {slot.endTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {span > 1 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-indigo-600 text-white">
                            {span} คาบ
                          </span>
                        )}
                        <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>

                    <div className="mt-2">
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        {subject.code} {subject.name}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-600 dark:text-slate-300">
                        {subject.gradeGroup && (
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-slate-400" />
                            <span>{subject.gradeGroup}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{room ? `ห้อง ${room}` : 'ไม่ระบุห้อง'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              } else {
                // Empty period or activity
                const isPeriod7 = pNum === 7;
                const defaultActivity = isPeriod7 ? DEFAULT_ACTIVITIES[selectedDay] : null;

                if (defaultActivity) {
                  timelineItems.push(
                    <div
                      key={pNum}
                      onClick={() => onAddSlot(selectedDay, pNum)}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 cursor-pointer hover:bg-slate-100"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          คาบ {pNum}
                        </span>
                        <span>{defaultActivity.title} ({p.startTime} - {p.endTime})</span>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  );
                } else {
                  timelineItems.push(
                    <div
                      key={pNum}
                      onClick={() => onAddSlot(selectedDay, pNum)}
                      className="py-2.5 px-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 flex items-center justify-between text-xs text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">คาบ {pNum}</span>
                        <span className="text-[10px] font-mono text-slate-400">{p.startTime} - {p.endTime}</span>
                        <span className="text-[11px] text-slate-400 group-hover:text-indigo-600">ว่าง (แตะเพื่อเพิ่ม)</span>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
                    </div>
                  );
                }
              }
            }

            return timelineItems;
          })()}
        </div>
      </div>

      {/* MATRIX TIMETABLE GRID TABLE (Hidden on mobile if daily view is active) */}
      <div className={`${mobileViewMode === 'daily' ? 'hidden md:block' : 'block'} bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden`}>
        {/* Horizontal scroll hint on mobile */}
        <div className="md:hidden flex items-center justify-between px-4 py-2 bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 text-xs border-b border-indigo-100 dark:border-indigo-900/50">
          <span>👉 เลื่อนซ้าย-ขวา เพื่อดูตารางสอนให้ครบ 8 คาบ</span>
          <button
            type="button"
            onClick={() => setMobileViewMode('daily')}
            className="text-[11px] underline font-medium"
          >
            สลับเป็นการ์ดรายวัน
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs min-w-[1050px]">
            {/* Header: Periods 1 to 8 + Lunch */}
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border-b border-slate-300 dark:border-slate-700">
                {/* Top-left Corner: คาบที่ / วัน-เวลา */}
                <th className="border-r border-slate-300 dark:border-slate-700 p-2.5 w-28 text-center font-bold bg-slate-200/70 dark:bg-slate-800 sticky left-0 z-10 shadow-xs">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">คาบที่</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">วัน / เวลา</div>
                </th>

                {/* Morning Periods: 1 - 4 */}
                {teachingPeriods.slice(0, 4).map((p) => (
                  <th key={p.period} className="border-r border-slate-300 dark:border-slate-700 p-2 text-center font-bold min-w-[100px]">
                    <div className="text-sm font-bold text-indigo-700 dark:text-indigo-400">{p.label}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      {p.startTime} - {p.endTime}
                    </div>
                  </th>
                ))}

                {/* Lunch Break Column Header */}
                <th className="border-r border-slate-300 dark:border-slate-700 p-2 text-center font-bold w-16 bg-amber-50/80 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300">
                  <div className="text-xs font-bold">พักเที่ยง</div>
                  <div className="text-[10px] opacity-80 font-normal">
                    {lunchPeriod.startTime}-{lunchPeriod.endTime}
                  </div>
                </th>

                {/* Afternoon Periods: 5 - 8 */}
                {teachingPeriods.slice(4, 8).map((p) => (
                  <th key={p.period} className="border-r border-slate-300 dark:border-slate-700 p-2 text-center font-bold min-w-[100px] last:border-r-0">
                    <div className="text-sm font-bold text-indigo-700 dark:text-indigo-400">{p.label}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      {p.startTime} - {p.endTime}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body: Monday to Friday */}
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {displayDays.map((day) => {
                // Day slots
                const daySlots = filteredSlots
                  .filter(s => s.dayOfWeek === day.index)
                  .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

                // Map slots to starting period and span
                const periodSlotMap = {};
                const coveredPeriods = new Set();

                for (const slot of daySlots) {
                  const mapping = getSlotPeriodMapping(slot, periods);
                  if (mapping) {
                    periodSlotMap[mapping.startPeriod] = {
                      slot,
                      span: mapping.span,
                    };
                    for (let i = 0; i < mapping.span; i++) {
                      coveredPeriods.add(mapping.startPeriod + i);
                    }
                  }
                }

                // Helper to render teaching period cells
                const renderPeriodCells = (periodSlice) => {
                  const cells = [];
                  let skipUntil = 0;

                  for (const p of periodSlice) {
                    const pNum = p.period;

                    // If covered by previous multi-period span, skip rendering cell
                    if (pNum < skipUntil) {
                      continue;
                    }

                    const slotInfo = periodSlotMap[pNum];

                    if (slotInfo) {
                      const { slot, span } = slotInfo;
                      const maxSpanInSlice = periodSlice[periodSlice.length - 1].period - pNum + 1;
                      const validSpan = Math.min(span, maxSpanInSlice);
                      skipUntil = pNum + validSpan;

                      const subject = subjectMap.get(slot.subjectId) || {
                        code: '???',
                        name: 'ไม่พบวิชา',
                        defaultRoom: '-',
                        gradeGroup: '',
                        colorId: 'indigo',
                      };
                      const color = getColorById(subject.colorId);
                      const room = slot.roomOverride || subject.defaultRoom;

                      cells.push(
                        <td
                          key={pNum}
                          colSpan={validSpan}
                          onClick={() => onEditSlot(slot)}
                          className="border-r border-slate-300 dark:border-slate-700 p-1.5 align-middle cursor-pointer transition-all hover:brightness-95 group"
                        >
                          <div className={`h-full min-h-[90px] p-2.5 rounded-xl border flex flex-col justify-between transition-all group-hover:shadow-md ${color.bg} ${color.border}`}>
                            {/* Line 1: Code & Span Badge */}
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                {subject.code}
                              </span>
                              {validSpan > 1 ? (
                                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-indigo-600 text-white shrink-0 shadow-xs">
                                  {validSpan} คาบ
                                </span>
                              ) : (
                                <Edit3 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                              )}
                            </div>

                            {/* Line 2: Subject Name */}
                            <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 line-clamp-1 my-0.5">
                              {subject.name}
                            </div>

                            {/* Line 3: Learners / Grade */}
                            <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                              {subject.gradeGroup ? subject.gradeGroup : '-'}
                            </div>

                            {/* Line 4: Room */}
                            <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5 text-slate-400" />
                              <span className="truncate">{room ? `ห้อง ${room}` : '-'}</span>
                            </div>
                          </div>
                        </td>
                      );
                    } else {
                      // Empty Period or Default Activity (e.g. Period 7)
                      const isPeriod7 = pNum === 7;
                      const defaultActivity = isPeriod7 ? DEFAULT_ACTIVITIES[day.index] : null;

                      cells.push(
                        <td
                          key={pNum}
                          colSpan={1}
                          onClick={() => onAddSlot(day.index, pNum)}
                          className={`border-r border-slate-300 dark:border-slate-700 p-1.5 align-middle cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/60 group ${
                            isPeriod7 ? 'bg-slate-50/50 dark:bg-slate-900/40' : ''
                          }`}
                        >
                          <div className="h-full min-h-[90px] rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-2 flex flex-col items-center justify-center text-center transition-colors group-hover:border-indigo-400 dark:group-hover:border-indigo-600 group-hover:bg-indigo-50/20">
                            {defaultActivity ? (
                              <div className="space-y-1">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                  {defaultActivity}
                                </span>
                                <div className="text-[10px] text-slate-400 font-medium">
                                  กิจกรรมพัฒนาผู้เรียน
                                </div>
                              </div>
                            ) : (
                              <div className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex flex-col items-center gap-1 transition-colors">
                                <Plus className="w-4 h-4" />
                                <span className="text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                  เพิ่มคาบ {pNum}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    }
                  }

                  return cells;
                };

                return (
                  <tr key={day.index} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                    {/* Left Column: Day Label + 4 Sublabels */}
                    <td className="border-r border-slate-300 dark:border-slate-700 p-2.5 font-bold text-center bg-slate-50 dark:bg-slate-800/70 align-middle sticky left-0 z-10 shadow-xs">
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          {day.full}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal leading-tight text-right space-y-0.5">
                          <div>รหัส</div>
                          <div>วิชา</div>
                          <div>ผู้เรียน</div>
                          <div>ห้อง</div>
                        </div>
                      </div>
                    </td>

                    {/* Periods 1 to 4 */}
                    {renderPeriodCells(teachingPeriods.slice(0, 4))}

                    {/* Lunch Break Cell */}
                    <td className="border-r border-slate-300 dark:border-slate-700 p-1.5 text-center bg-amber-50/60 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 font-semibold align-middle">
                      <div className="writing-vertical text-xs tracking-wider py-2">
                        พักเที่ยง
                      </div>
                    </td>

                    {/* Periods 5 to 8 */}
                    {renderPeriodCells(teachingPeriods.slice(4, 8))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Period Settings Modal */}
      <PeriodSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        periods={periods}
        onSave={handleSavePeriods}
      />

    </div>
  );
}
