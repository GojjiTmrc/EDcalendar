import React, { useState } from 'react';
import { X, Printer, FileText } from 'lucide-react';
import { formatThaiDate } from '../../utils/dateUtils';

export default function SummaryPrintView({
  isOpen,
  onClose,
  summaryData,
  semester,
}) {
  const [teacherName, setTeacherName] = useState('ครูผู้สอน');
  const [schoolName, setSchoolName] = useState('โรงเรียน / วิทยาลัย');
  const [academicRole, setAcademicRole] = useState('กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี');

  if (!isOpen || !summaryData) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex justify-center p-2 sm:p-6 print:p-0 print:bg-white">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col print:shadow-none print:w-full print:max-w-none print:rounded-none print:text-black print:bg-white">
        
        {/* Top Control Bar (Hidden when printing) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              พิมพ์รายงานสรุปผลการสอน (Print Preview / A4)
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-md shadow-indigo-500/20 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์เอกสาร (Print / PDF)</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Pre-print Form Controls (Hidden when printing) */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 no-print">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              ชื่อสถานศึกษา:
            </label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              ชื่อครูผู้สอน:
            </label>
            <input
              type="text"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              กลุ่มสาระฯ / แผนกวิชา:
            </label>
            <input
              type="text"
              value={academicRole}
              onChange={(e) => setAcademicRole(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
            />
          </div>
        </div>

        {/* PRINTABLE DOCUMENT CONTENT */}
        <div className="p-8 print:p-6 bg-white text-slate-900 space-y-6">
          
          {/* Header */}
          <div className="text-center border-b pb-4 border-slate-300">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              รายงานสรุปผลการจัดการเรียนการสอนและการปฏิบัติงาน
            </h1>
            <div className="text-sm font-semibold text-slate-800 mt-1">
              {schoolName} • {academicRole}
            </div>
            <div className="text-xs text-slate-600 mt-1">
              <span>{semester?.name || 'ภาคเรียนปัจจุบัน'}</span>
              <span className="mx-2">•</span>
              <span>
                ช่วงเวลาที่รายงาน: {formatThaiDate(summaryData.rangeStart, 'short')} ถึง {formatThaiDate(summaryData.rangeEnd, 'short')}
              </span>
              <span className="mx-2">•</span>
              <span>ครูผู้สอน: <strong>{teacherName}</strong></span>
            </div>
          </div>

          {/* KPI Summary Grid Table */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wide">
              1. สรุปภาพรวมการปฏิบัติการสอน (Executive Summary)
            </h3>
            <table className="w-full border-collapse border border-slate-400 text-xs">
              <tbody>
                <tr className="bg-slate-50">
                  <td className="border border-slate-400 p-2 font-semibold w-1/3">สัปดาห์ที่ต้องสอนทั้งหมด</td>
                  <td className="border border-slate-400 p-2 text-center font-bold">{summaryData.totalPlannedWeeks} สัปดาห์</td>
                  <td className="border border-slate-400 p-2 font-semibold w-1/3">สัปดาห์ที่สอนจริง</td>
                  <td className="border border-slate-400 p-2 text-center font-bold text-emerald-700">{summaryData.totalTaughtWeeks} สัปดาห์</td>
                </tr>
                <tr>
                  <td className="border border-slate-400 p-2 font-semibold w-1/3">คาบสอนตามแผนทั้งหมด</td>
                  <td className="border border-slate-400 p-2 text-center font-bold">{summaryData.totalPlannedCount} คาบ</td>
                  <td className="border border-slate-400 p-2 font-semibold w-1/3">เวลาสอนรวมที่สอนได้จริง</td>
                  <td className="border border-slate-400 p-2 text-center font-bold text-emerald-700">
                    {summaryData.taughtDurationText}
                  </td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="border border-slate-400 p-2 font-semibold">สอนสำเร็จจริง (ปกติ+ชดเชย)</td>
                  <td className="border border-slate-400 p-2 text-center font-bold text-emerald-700">
                    {summaryData.totalCompletedCount} คาบ
                  </td>
                  <td className="border border-slate-400 p-2 font-semibold">ร้อยละความสำเร็จ (% Completion)</td>
                  <td className="border border-slate-400 p-2 text-center font-bold text-indigo-700">
                    {summaryData.overallCompletionRate}%
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-400 p-2 font-semibold">งดสอน / ไม่ได้เข้าสอน</td>
                  <td className="border border-slate-400 p-2 text-center font-bold text-rose-700">
                    {summaryData.totalCancelledCount} คาบ
                  </td>
                  <td className="border border-slate-400 p-2 font-semibold">ติดกิจกรรมโรงเรียน / วันหยุด</td>
                  <td className="border border-slate-400 p-2 text-center font-bold text-amber-700">
                    {summaryData.totalActivityCount} คาบ
                  </td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="border border-slate-400 p-2 font-semibold">สอนชดเชยเรียบร้อยแล้ว</td>
                  <td className="border border-slate-400 p-2 text-center font-bold text-sky-700">
                    {summaryData.totalMakeupCount} คาบ
                  </td>
                  <td className="border border-slate-400 p-2 font-semibold">คาบคงค้างที่ต้องชดเชย</td>
                  <td className="border border-slate-400 p-2 text-center font-bold text-slate-700">
                    {Math.max(0, summaryData.totalCancelledCount - summaryData.totalMakeupCount)} คาบ
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Subject Breakdown Table */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wide">
              2. สรุปผลการสอนจำแนกตามรายวิชา (Subject Breakdown)
            </h3>
            <table className="w-full border-collapse border border-slate-400 text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-800">
                  <th className="border border-slate-400 p-2 text-left">รหัสวิชา</th>
                  <th className="border border-slate-400 p-2 text-left">ชื่อวิชา</th>
                  <th className="border border-slate-400 p-2 text-center">ชั้นเรียน</th>
                  <th className="border border-slate-400 p-2 text-center whitespace-nowrap">สัปดาห์ที่ต้องสอน</th>
                  <th className="border border-slate-400 p-2 text-center whitespace-nowrap">สัปดาห์ที่สอนจริง</th>
                  <th className="border border-slate-400 p-2 text-center">ตามแผน</th>
                  <th className="border border-slate-400 p-2 text-center">สอนจริง</th>
                  <th className="border border-slate-400 p-2 text-center">งดสอน</th>
                  <th className="border border-slate-400 p-2 text-center">กิจกรรม</th>
                  <th className="border border-slate-400 p-2 text-center">ชดเชย</th>
                  <th className="border border-slate-400 p-2 text-center">เวลาสอนรวม</th>
                  <th className="border border-slate-400 p-2 text-center">ร้อยละ</th>
                </tr>
              </thead>
              <tbody>
                {summaryData.subjectBreakdown.map((item) => (
                  <tr key={item.subject.id} className="border-b border-slate-300">
                    <td className="border border-slate-400 p-2 font-bold">{item.subject.code}</td>
                    <td className="border border-slate-400 p-2 font-medium">{item.subject.name}</td>
                    <td className="border border-slate-400 p-2 text-center">{item.subject.gradeGroup || '-'}</td>
                    <td className="border border-slate-400 p-2 text-center font-bold">{item.plannedWeeksCount}</td>
                    <td className="border border-slate-400 p-2 text-center font-bold text-emerald-700">{item.taughtWeeksCount}</td>
                    <td className="border border-slate-400 p-2 text-center">{item.plannedCount}</td>
                    <td className="border border-slate-400 p-2 text-center font-bold text-emerald-700">{item.completedCount}</td>
                    <td className="border border-slate-400 p-2 text-center text-rose-700">{item.cancelledCount}</td>
                    <td className="border border-slate-400 p-2 text-center text-amber-700">{item.activityCount}</td>
                    <td className="border border-slate-400 p-2 text-center text-sky-700">{item.makeupCount}</td>
                    <td className="border border-slate-400 p-2 text-center font-medium">{item.taughtDurationShort}</td>
                    <td className="border border-slate-400 p-2 text-center font-bold text-indigo-700">{item.completionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Activity & Absence Log Table */}
          {summaryData.historyLogs.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wide">
                3. บันทึกประวัติการงดสอน ติดกิจกรรม และสอนชดเชย ({summaryData.historyLogs.length} รายการ)
              </h3>
              <table className="w-full border-collapse border border-slate-400 text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-800">
                    <th className="border border-slate-400 p-2 text-center w-24">วันที่</th>
                    <th className="border border-slate-400 p-2 text-left">วิชาที่เกี่ยวข้อง</th>
                    <th className="border border-slate-400 p-2 text-center w-24">สถานะ</th>
                    <th className="border border-slate-400 p-2 text-left">สาเหตุ / ชื่อกิจกรรม / บันทึก</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryData.historyLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="border border-slate-400 p-2 text-center whitespace-nowrap">
                        {formatThaiDate(log.date, 'short')}
                      </td>
                      <td className="border border-slate-400 p-2">
                        <span className="font-semibold">{log.subjectName}</span>{' '}
                        <span className="text-[11px] text-slate-500">({log.subjectCode})</span>
                      </td>
                      <td className="border border-slate-400 p-2 text-center font-bold">
                        <span className={
                          log.status === 'cancelled'
                            ? 'text-rose-700'
                            : log.status === 'activity'
                            ? 'text-amber-700'
                            : 'text-sky-700'
                        }>
                          {log.statusLabel}
                        </span>
                      </td>
                      <td className="border border-slate-400 p-2">
                        {log.reason}
                        {log.notes && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            โน้ต: {log.notes}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Signatures Area */}
          <div className="grid grid-cols-3 gap-6 pt-10 text-center text-xs">
            <div>
              <div className="w-36 mx-auto border-b border-slate-400 mb-1.5 pb-8"></div>
              <div>ลงชื่อ ({teacherName})</div>
              <div className="text-slate-500 mt-0.5">ครูผู้สอน / ผู้รายงาน</div>
            </div>
            <div>
              <div className="w-36 mx-auto border-b border-slate-400 mb-1.5 pb-8"></div>
              <div>ลงชื่อ (.......................................................)</div>
              <div className="text-slate-500 mt-0.5">หัวหน้ากลุ่มสาระการเรียนรู้</div>
            </div>
            <div>
              <div className="w-36 mx-auto border-b border-slate-400 mb-1.5 pb-8"></div>
              <div>ลงชื่อ (.......................................................)</div>
              <div className="text-slate-500 mt-0.5">รองผู้อำนวยการกลุ่มบริหารวิชาการ</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
