import React, { useState } from 'react';
import { X, Printer, Settings, Award } from 'lucide-react';
import { SCHOOL_DAYS, timeToMinutes, formatThaiDate } from '../../utils/dateUtils';
import {
  DEFAULT_PERIODS,
  DEFAULT_ACTIVITIES,
  DEFAULT_SIGNATURES,
  getStoredPeriods,
  getStoredSignatures,
  saveStoredSignatures,
  getSlotPeriodMapping,
} from '../../utils/periodConfig';

export default function TimetablePrintView({
  isOpen,
  onClose,
  slots = [],
  subjects = [],
  activeSemester,
}) {
  const [periods] = useState(() => getStoredPeriods());
  const [teacherName, setTeacherName] = useState(() => localStorage.getItem('edcalendar_teacher_name') || 'นายกิตติพงษ์ โพธิวาระ');
  const [schoolName, setSchoolName] = useState(() => localStorage.getItem('edcalendar_school_name') || 'โรงเรียนสุมเส้าพิทยาคาร');
  const [docDate, setDocDate] = useState(() => formatThaiDate(new Date(), 'short'));
  const [signatures, setSignatures] = useState(() => getStoredSignatures());

  if (!isOpen) return null;

  const subjectMap = new Map(subjects.map(s => [s.id, s]));
  const semesterSlots = slots.filter(s => s.semesterId === activeSemester?.id);
  const displayDays = SCHOOL_DAYS;

  const teachingPeriods = periods.filter(p => !p.isLunch);
  const lunchPeriod = periods.find(p => p.isLunch) || { label: 'พักเที่ยง', startTime: '12:00', endTime: '13:00' };

  const handlePrint = () => {
    // Save preferences
    localStorage.setItem('edcalendar_teacher_name', teacherName);
    localStorage.setItem('edcalendar_school_name', schoolName);
    saveStoredSignatures(signatures);
    window.print();
  };

  const handleSignatureChange = (index, field, value) => {
    const updated = [...signatures];
    updated[index] = { ...updated[index], [field]: value };
    setSignatures(updated);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex justify-center p-2 sm:p-6 print:p-0 print:bg-white">
      <div className="bg-white text-slate-900 w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col print:shadow-none print:w-full print:max-w-none print:rounded-none print:text-black">
        
        {/* Top bar (Hidden when printing) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                พิมพ์ตารางสอน (แบบฟอร์มทางการ A4 แนวนอน)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ถอดแบบเอกสารจริงตามระเบียบโรงเรียน พร้อมช่องลงนาม 3 ตำแหน่ง
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>สั่งพิมพ์ / บันทึกเป็น PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Editable settings area before print */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 space-y-3 no-print text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                ชื่อครูผู้สอน:
              </label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                ชื่อสถานศึกษา:
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                วันที่พิมพ์เอกสาร:
              </label>
              <input
                type="text"
                value={docDate}
                onChange={(e) => setDocDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
              />
            </div>
          </div>

          {/* Signature editors */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {signatures.map((sig, idx) => (
              <div key={idx} className="space-y-1">
                <span className="font-semibold text-slate-500">ผู้ลงนามที่ {idx + 1}:</span>
                <input
                  type="text"
                  value={sig.name}
                  onChange={(e) => handleSignatureChange(idx, 'name', e.target.value)}
                  placeholder="ชื่อ-นามสกุล"
                  className="w-full px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  value={sig.title}
                  onChange={(e) => handleSignatureChange(idx, 'title', e.target.value)}
                  placeholder="ตำแหน่ง"
                  className="w-full px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-[11px] text-slate-600 dark:text-slate-300"
                />
              </div>
            ))}
          </div>
        </div>

        {/* PRINTABLE DOCUMENT AREA (A4 LANDSCAPE) */}
        <div className="p-8 print:p-4 bg-white text-slate-900 space-y-4">
          
          {/* Document Header */}
          <div className="flex items-center justify-between pb-2 border-b-2 border-slate-800">
            {/* Logo Emblem Placeholder */}
            <div className="w-16 flex justify-start">
              <div className="w-12 h-12 rounded-full border-2 border-slate-700 flex items-center justify-center p-1">
                <Award className="w-8 h-8 text-slate-800" />
              </div>
            </div>

            {/* Center Header Titles */}
            <div className="text-center flex-1">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                ตารางสอน :{teacherName} {activeSemester?.name || 'ภาคเรียนที่ 1/2569'}
              </h2>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                {schoolName}
              </h3>
            </div>

            {/* Right Date */}
            <div className="w-28 text-right font-medium text-xs text-slate-800">
              {docDate}
            </div>
          </div>

          {/* Timetable Matrix Grid Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border-2 border-slate-800 text-xs">
              {/* Table Header: Periods 1 to 8 + Lunch */}
              <thead>
                <tr className="bg-slate-100 text-slate-900 border-b-2 border-slate-800">
                  <th className="border border-slate-800 p-1 text-center w-20 font-bold">
                    <div className="text-[11px]">คาบที่</div>
                    <div className="text-[10px] font-normal">วัน/เวลา</div>
                  </th>

                  {/* Morning Periods: 1 - 4 */}
                  {teachingPeriods.slice(0, 4).map((p) => (
                    <th key={p.period} className="border border-slate-800 p-1 text-center font-bold">
                      <div className="text-xs">{p.label}</div>
                      <div className="text-[10px] font-normal text-slate-700">
                        {p.startTime.replace(':', '.')}-{p.endTime.replace(':', '.')} น.
                      </div>
                    </th>
                  ))}

                  {/* Lunch Break Header */}
                  <th className="border border-slate-800 p-1 text-center font-bold w-12 bg-slate-50">
                    <div className="text-[11px]">พักเที่ยง</div>
                  </th>

                  {/* Afternoon Periods: 5 - 8 */}
                  {teachingPeriods.slice(4, 8).map((p) => (
                    <th key={p.period} className="border border-slate-800 p-1 text-center font-bold">
                      <div className="text-xs">{p.label}</div>
                      <div className="text-[10px] font-normal text-slate-700">
                        {p.startTime.replace(':', '.')}-{p.endTime.replace(':', '.')} น.
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Table Body: Monday to Friday */}
              <tbody>
                {displayDays.map((day) => {
                  const daySlots = semesterSlots
                    .filter(s => s.dayOfWeek === day.index)
                    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

                  // Map slots to starting period and span
                  const periodSlotMap = {};
                  for (const slot of daySlots) {
                    const mapping = getSlotPeriodMapping(slot, periods);
                    if (mapping) {
                      periodSlotMap[mapping.startPeriod] = {
                        slot,
                        span: mapping.span,
                      };
                    }
                  }

                  const renderPrintCells = (periodSlice) => {
                    const cells = [];
                    let skipUntil = 0;

                    for (const p of periodSlice) {
                      const pNum = p.period;
                      if (pNum < skipUntil) continue;

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
                        };
                        const room = slot.roomOverride || subject.defaultRoom;

                        cells.push(
                          <td
                            key={pNum}
                            colSpan={validSpan}
                            className="border border-slate-800 p-1.5 text-center align-middle h-24"
                          >
                            <div className="flex flex-col justify-center h-full space-y-0.5">
                              {/* Line 1: รหัสวิชา */}
                              <div className="font-bold text-xs text-slate-900">
                                {subject.code}
                              </div>
                              {/* Line 2: ชื่อวิชา */}
                              <div className="font-medium text-[11px] text-slate-800 line-clamp-1">
                                {subject.name}
                              </div>
                              {/* Line 3: ผู้เรียน */}
                              <div className="text-[10px] text-slate-700">
                                {subject.gradeGroup ? subject.gradeGroup : '-'}
                              </div>
                              {/* Line 4: ห้อง */}
                              <div className="text-[10px] text-slate-600">
                                {room ? `ห้อง ${room}` : '-'}
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
                            className="border border-slate-800 p-1 text-center align-middle h-24"
                          >
                            {defaultActivity ? (
                              <div className="font-medium text-xs text-slate-800">
                                {defaultActivity}
                              </div>
                            ) : null}
                          </td>
                        );
                      }
                    }

                    return cells;
                  };

                  return (
                    <tr key={day.index} className="border-b border-slate-800">
                      {/* Left Header Column */}
                      <td className="border border-slate-800 p-1.5 text-center bg-slate-50 align-middle">
                        <div className="flex items-center justify-between gap-1">
                          <div className="writing-vertical font-bold text-xs text-slate-900 py-1">
                            {day.full}
                          </div>
                          <div className="text-[9px] text-slate-600 font-normal leading-tight text-right space-y-1 pr-0.5">
                            <div>รหัส</div>
                            <div>วิชา</div>
                            <div>ผู้เรียน</div>
                            <div>ห้อง</div>
                          </div>
                        </div>
                      </td>

                      {/* Morning Periods (1 to 4) */}
                      {renderPrintCells(teachingPeriods.slice(0, 4))}

                      {/* Lunch Break (Midday) */}
                      <td className="border border-slate-800 p-1 text-center align-middle bg-slate-50 font-medium">
                        <div className="writing-vertical text-[10px] py-2 text-slate-700">
                          พักเที่ยง
                        </div>
                      </td>

                      {/* Afternoon Periods (5 to 8) */}
                      {renderPrintCells(teachingPeriods.slice(4, 8))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Document Footer: 3 Signatures */}
          <div className="pt-8 print:pt-6 grid grid-cols-3 gap-6 text-center text-xs">
            {signatures.map((sig, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="font-medium text-slate-800">
                  ({sig.name || '......................................................'})
                </div>
                <div className="text-slate-700 font-normal">
                  ตำแหน่ง {sig.title}
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}
