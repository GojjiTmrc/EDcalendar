import React, { useState, useMemo } from 'react';
import {
  Printer,
  Calendar as CalIcon,
  CheckCircle2,
  Clock,
  Ban,
  AlertCircle,
  BookOpen,
  Sparkles,
  TrendingUp,
  Filter,
  Search,
  ChevronDown,
  BookCheck,
  Check
} from 'lucide-react';
import { calculateTeachingSummary, getTermScopeInfo } from '../../services/summaryService';
import SummaryPrintView from './SummaryPrintView';
import { formatThaiDate, parseDateString, THAI_MONTHS_FULL } from '../../utils/dateUtils';
import { getColorById } from '../../utils/colors';

export default function TeachingSummary({
  semester,
  slots = [],
  subjects = [],
  overrides = [],
  multiDayEvents = [],
  confirmTeachingMode = false,
  onChangeConfirmTeachingMode,
  onSaveOverride,
}) {
  const [scopeType, setScopeType] = useState('semester'); // 'semester' | 'todate' | 'month'
  const [pendingSubjectFilter, setPendingSubjectFilter] = useState('all');
  const [isPendingExpanded, setIsPendingExpanded] = useState(false);
  
  // Available months in semester for monthly filter
  const semesterMonths = useMemo(() => {
    if (!semester) return [];
    const list = [];
    const start = parseDateString(semester.startDate);
    const end = parseDateString(semester.endDate);
    const cur = new Date(start.getFullYear(), start.getMonth(), 1);

    while (cur <= end) {
      list.push({
        year: cur.getFullYear(),
        month: cur.getMonth(),
        label: `${THAI_MONTHS_FULL[cur.getMonth()]} พ.ศ. ${cur.getFullYear() + 543}`,
        key: `${cur.getFullYear()}-${cur.getMonth()}`,
      });
      cur.setMonth(cur.getMonth() + 1);
    }
    return list;
  }, [semester]);

  const [selectedMonthKey, setSelectedMonthKey] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth()}`;
  });

  const activeMonthObj = useMemo(() => {
    return semesterMonths.find(m => m.key === selectedMonthKey) || semesterMonths[0] || {
      year: new Date().getFullYear(),
      month: new Date().getMonth(),
    };
  }, [semesterMonths, selectedMonthKey]);

  // Log filters
  const [logStatusFilter, setLogStatusFilter] = useState('all'); // 'all' | 'cancelled' | 'activity' | 'makeup'
  const [logSearchQuery, setLogSearchQuery] = useState('');

  // Print modal state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Compute summary metrics
  const summary = useMemo(() => {
    return calculateTeachingSummary(
      semester,
      slots,
      subjects,
      overrides,
      multiDayEvents,
      scopeType,
      { year: activeMonthObj.year, month: activeMonthObj.month }
    );
  }, [semester, slots, subjects, overrides, multiDayEvents, scopeType, activeMonthObj]);

  if (!summary) {
    return (
      <div className="text-center py-12 text-slate-500">
        ไม่พบข้อมูลภาคเรียน กรุณาเลือกหรือตั้งค่าภาคเรียนในระบบ
      </div>
    );
  }

  // Filter history logs
  const filteredLogs = summary.historyLogs.filter((log) => {
    if (logStatusFilter !== 'all' && log.status !== logStatusFilter) return false;
    if (logSearchQuery.trim()) {
      const q = logSearchQuery.toLowerCase();
      const matchName = log.subjectName.toLowerCase().includes(q);
      const matchCode = log.subjectCode.toLowerCase().includes(q);
      const matchReason = log.reason.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchReason) return false;
    }
    return true;
  });

  // Filter pending confirmation logs (past/today sessions without postTeachingLog)
  const pendingLogs = summary.pendingConfirmLogs || [];
  const filteredPendingLogs = pendingLogs.filter((item) => {
    if (pendingSubjectFilter !== 'all' && item.subjectId !== pendingSubjectFilter) return false;
    return true;
  });

  const handleQuickConfirmSession = (sess) => {
    if (!onSaveOverride) return;
    const nowIso = new Date().toISOString();
    const defaultConfirmText = '- จัดการเรียนการสอนเรียบร้อยครบถ้วนตามแผนการสอน';

    if (sess.isCustomSession) {
      onSaveOverride({
        id: sess.id,
        semesterId: sess.semesterId || semester?.id,
        date: sess.date,
        subjectId: sess.subjectId,
        isCustomSession: true,
        startTime: sess.startTime,
        endTime: sess.endTime,
        room: sess.room || '-',
        status: sess.status || 'makeup',
        reason: sess.reason || '',
        topic: sess.topic || '',
        lessonPlan: sess.lessonPlan || '',
        prepChecklist: sess.prepChecklist || [],
        notes: sess.notes || '',
        postTeachingLog: defaultConfirmText,
        postTeachingLogUpdatedAt: nowIso,
      });
    } else {
      onSaveOverride({
        id: sess.id && sess.id.startsWith('ovr-') ? sess.id : `ovr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        semesterId: sess.semesterId || semester?.id,
        date: sess.date,
        slotId: sess.slotId,
        subjectId: sess.subjectId,
        status: sess.status || 'normal',
        reason: sess.reason || '',
        topic: sess.topic || '',
        lessonPlan: sess.lessonPlan || '',
        prepChecklist: sess.prepChecklist || [],
        notes: sess.notes || '',
        postTeachingLog: defaultConfirmText,
        postTeachingLogUpdatedAt: nowIso,
      });
    }
  };

  const handleQuickConfirmAllFiltered = () => {
    if (!onSaveOverride || filteredPendingLogs.length === 0) return;
    if (!confirm(`ยืนยันการบันทึกหลังการสอนด่วนสำหรับ ${filteredPendingLogs.length} คาบเรียนที่แสดงอยู่ใช่หรือไม่?`)) {
      return;
    }
    filteredPendingLogs.forEach((sess) => {
      handleQuickConfirmSession(sess);
    });
  };

  const activeOverallCompletionRate = confirmTeachingMode
    ? summary.overallConfirmedCompletionRate
    : summary.overallCompletionRate;

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Time Scope Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              สรุปผลการจัดการเรียนการสอน
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
              {semester?.name}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            ช่วงเวลาที่ประมวลผล: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatThaiDate(summary.rangeStart, 'short')} ถึง {formatThaiDate(summary.rangeEnd, 'short')}</span>
          </p>
        </div>

        {/* Time Scope Controls & Print */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Scope Buttons */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium">
            <button
              onClick={() => setScopeType('semester')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                scopeType === 'semester'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              ทั้งภาคเรียน
            </button>
            <button
              onClick={() => setScopeType('todate')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                scopeType === 'todate'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              ถึงปัจจุบัน
            </button>
            <button
              onClick={() => setScopeType('month')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                scopeType === 'month'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              รายเดือน
            </button>
          </div>

          {/* Month Dropdown (Visible only when scopeType === 'month') */}
          {scopeType === 'month' && semesterMonths.length > 0 && (
            <div className="relative">
              <select
                value={selectedMonthKey}
                onChange={(e) => setSelectedMonthKey(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                {semesterMonths.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Print Report Button */}
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02]"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>พิมพ์รายงานสรุปผล / PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* Total Planned */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">ตามแผน</span>
            <BookOpen className="w-4 h-4 text-indigo-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{summary.totalPlannedCount}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {summary.totalPlannedWeeks} สัปดาห์ที่ต้องสอน
            </div>
          </div>
        </div>

        {/* Taught / Completed */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
            <span className="text-xs font-semibold">
              {confirmTeachingMode ? 'สัปดาห์ที่คอนเฟิร์ม' : 'สอนสำเร็จ'}
            </span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {confirmTeachingMode ? summary.totalConfirmedWeeks : summary.totalCompletedCount}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {confirmTeachingMode
                ? `บันทึกหลังสอนแล้ว ${summary.totalConfirmedCount} คาบ`
                : `สอนจริง ${summary.totalTaughtWeeks} สัปดาห์`}
            </div>
          </div>
        </div>

        {/* Total Taught Time (Strictly Hours & Minutes) */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-2">
            <span className="text-xs font-semibold">เวลาสอนจริง</span>
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              {summary.taughtDurationShort}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">เวลาปฏิบัติการสอน</div>
          </div>
        </div>

        {/* Cancelled */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-2">
            <span className="text-xs font-semibold">งดสอน</span>
            <Ban className="w-4 h-4" />
          </div>
          <div>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{summary.totalCancelledCount}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">คาบที่ไม่ได้เข้าสอน</div>
          </div>
        </div>

        {/* Activity */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
            <span className="text-xs font-semibold">ติดกิจกรรม</span>
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{summary.totalActivityCount}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">กิจกรรม/วันหยุด</div>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-2">
            <span className="text-xs font-semibold">
              {confirmTeachingMode ? 'ความสำเร็จ (คอนเฟิร์ม)' : 'ความสำเร็จ'}
            </span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{activeOverallCompletionRate}%</div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${activeOverallCompletionRate}%` }}
              ></div>
            </div>
          </div>
        </div>

      </div>

      {/* Subject Breakdown Table Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                สรุปผลการสอนแยกตามรายวิชา ({summary.subjectBreakdown.length} วิชาในภาคเรียนนี้)
              </h3>
              {confirmTeachingMode && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <BookCheck className="w-3 h-3" />
                  <span>โหมดคอนเฟิร์มการสอน</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {confirmTeachingMode
                ? 'กำลังนับสัปดาห์ที่สอนจริงจากคาบที่มีการบันทึกหลังการสอนเรียบร้อยแล้ว'
                : 'แสดงเฉพาะวิชาที่ตั้งค่าเป็นวิชาในภาคเรียนนี้ หรือวิชาที่เรียนทั้ง 2 เทอม'}
            </p>
          </div>

          {/* Quick Toggle for Teaching Confirmation Mode (Synced with Settings) */}
          {onChangeConfirmTeachingMode && (
            <button
              type="button"
              onClick={() => onChangeConfirmTeachingMode(!confirmTeachingMode)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all shrink-0 ${
                confirmTeachingMode
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
              }`}
              title="สามารถตั้งค่าเปิด/ปิดถาวรได้ที่เมนู ตั้งค่าระบบ > การแสดงผล & ทั่วไป"
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  confirmTeachingMode ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              <span>ระบบคอนเฟิร์มการสอน: {confirmTeachingMode ? 'เปิด' : 'ปิด'}</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4 font-semibold">รายวิชา</th>
                <th className="py-3 px-3 font-semibold text-center">ระดับชั้น</th>
                <th className="py-3 px-3 font-semibold text-center whitespace-nowrap" title="จำนวนสัปดาห์ที่ต้องสอนตามแผน">
                  สัปดาห์ที่ต้องสอน
                </th>
                <th
                  className="py-3 px-3 font-semibold text-center whitespace-nowrap text-emerald-600 dark:text-emerald-400"
                  title={
                    confirmTeachingMode
                      ? 'จำนวนสัปดาห์ที่มีการกดบันทึกหลังการสอนเรียบร้อยแล้ว'
                      : 'จำนวนสัปดาห์ที่มีการจัดกิจกรรมการเรียนการสอนจริง'
                  }
                >
                  {confirmTeachingMode ? 'สัปดาห์ที่สอนจริง (คอนเฟิร์ม)' : 'สัปดาห์ที่สอนจริง'}
                </th>
                <th className="py-3 px-3 font-semibold text-center text-rose-600 dark:text-rose-400">งดสอน</th>
                <th className="py-3 px-3 font-semibold text-center text-amber-600 dark:text-amber-400">กิจกรรม</th>
                <th className="py-3 px-3 font-semibold text-center text-sky-600 dark:text-sky-400">ชดเชย</th>
                <th className="py-3 px-4 font-semibold text-center">เวลาสอนรวม</th>
                <th className="py-3 px-4 font-semibold w-40 text-center">ความคืบหน้า</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {summary.subjectBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400 dark:text-slate-500">
                    ไม่มีรายวิชาที่กำหนดไว้สำหรับภาคเรียนนี้ (สามารถตั้งค่าเทอมของแต่ละวิชาได้ที่ปุ่ม &quot;วิชา&quot; ด้านบน)
                  </td>
                </tr>
              ) : (
                summary.subjectBreakdown.map((item) => {
                  const color = getColorById(item.subject.colorId);
                  const scopeInfo = getTermScopeInfo(item.subject.termScope);
                  const rowCompletionRate = confirmTeachingMode
                    ? item.confirmedCompletionRate
                    : item.completionRate;

                  return (
                    <tr key={item.subject.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-3 h-3 rounded-full shrink-0 ${color.dot}`}></span>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                              <span>{item.subject.name}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${scopeInfo.badgeClass}`}>
                                {scopeInfo.shortLabel}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {item.subject.code} {item.subject.defaultRoom ? `• ${item.subject.defaultRoom}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-700 dark:text-slate-300 font-medium">
                        {item.subject.gradeGroup || '-'}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {item.plannedWeeksCount}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                          {confirmTeachingMode ? item.confirmedWeeksCount : item.taughtWeeksCount}
                        </div>
                        {confirmTeachingMode && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            บันทึกแล้ว {item.confirmedSessionsCount} ครั้ง
                            {item.pendingConfirmCount > 0 && (
                              <span className="ml-1 text-amber-600 dark:text-amber-400 font-semibold">
                                (รอ {item.pendingConfirmCount})
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-medium text-rose-600 dark:text-rose-400">
                        {item.cancelledCount > 0 ? item.cancelledCount : '-'}
                      </td>
                      <td className="py-3 px-3 text-center font-medium text-amber-600 dark:text-amber-400">
                        {item.activityCount > 0 ? item.activityCount : '-'}
                      </td>
                      <td className="py-3 px-3 text-center font-medium text-sky-600 dark:text-sky-400">
                        {item.makeupCount > 0 ? item.makeupCount : '-'}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-800 dark:text-slate-200">
                        {item.taughtDurationShort}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                              style={{ width: `${rowCompletionRate}%` }}
                            ></div>
                          </div>
                          <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400 w-10 text-right">
                            {rowCompletionRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Teaching Confirmation Section (Visible when confirmTeachingMode is ON) */}
      {confirmTeachingMode && pendingLogs.length > 0 && (
        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <BookCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <span>คาบเรียนที่ผ่านวันสอนมาแล้วแต่ยังไม่ได้คอนเฟิร์ม ({filteredPendingLogs.length} คาบ)</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  คุณสามารถกดปุ่ม &quot;คอนเฟิร์มด่วน&quot; เพื่อบันทึกหลังการสอนตามแผนและนับเป็นสัปดาห์ที่สอนจริง (คอนเฟิร์ม) ได้ทันที
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={pendingSubjectFilter}
                onChange={(e) => setPendingSubjectFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="all">ทุกวิชา ({pendingLogs.length} คาบ)</option>
                {summary.subjectBreakdown
                  .filter((s) => s.pendingConfirmCount > 0)
                  .map((s) => (
                    <option key={s.subject.id} value={s.subject.id}>
                      {s.subject.code} {s.subject.name} ({s.pendingConfirmCount} คาบ)
                    </option>
                  ))}
              </select>

              {onSaveOverride && filteredPendingLogs.length > 0 && (
                <button
                  type="button"
                  onClick={handleQuickConfirmAllFiltered}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>คอนเฟิร์มทั้งหมดที่เลือก ({filteredPendingLogs.length})</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsPendingExpanded(!isPendingExpanded)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50"
              >
                <span>{isPendingExpanded ? 'ซ่อนรายการ' : 'ดูรายการคาบ'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isPendingExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {isPendingExpanded && (
            <div className="border-t border-emerald-200/70 dark:border-emerald-800/60 bg-white dark:bg-slate-900 overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 sticky top-0">
                    <th className="py-2.5 px-4 font-semibold w-28">วันที่สอน</th>
                    <th className="py-2.5 px-4 font-semibold">รายวิชา</th>
                    <th className="py-2.5 px-3 font-semibold text-center">เวลาเรียน</th>
                    <th className="py-2.5 px-4 font-semibold text-right">การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredPendingLogs.map((sess) => (
                    <tr key={`${sess.date}-${sess.id}`} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {formatThaiDate(sess.date, 'short')}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {sess.subjectName}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {sess.subjectCode} {sess.gradeGroup ? `• ชั้น ${sess.gradeGroup}` : ''} {sess.room ? `• ห้อง ${sess.room}` : ''}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {sess.time} ({sess.periods} คาบ)
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {onSaveOverride && (
                          <button
                            type="button"
                            onClick={() => handleQuickConfirmSession(sess)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold shadow-2xs transition-colors"
                          >
                            <Check className="w-3 h-3" />
                            <span>คอนเฟิร์มสอนตามแผน</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* History Log Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Header & Log Filters */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              บันทึกประวัติการงดสอนและกิจกรรม ({filteredLogs.length} รายการ)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              รวบรวมเหตุผลการงดสอน กิจกรรมโรงเรียน และการสอนชดเชยที่บันทึกไว้ในปฏิทิน
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Tabs */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setLogStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  logStatusFilter === 'all'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setLogStatusFilter('cancelled')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  logStatusFilter === 'cancelled'
                    ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-300 shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                งดสอน
              </button>
              <button
                onClick={() => setLogStatusFilter('activity')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  logStatusFilter === 'activity'
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-300 shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                กิจกรรม
              </button>
              <button
                onClick={() => setLogStatusFilter('makeup')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  logStatusFilter === 'makeup'
                    ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                ชดเชย
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                placeholder="ค้นหาวิชา หรือเหตุผล..."
                className="pl-8 pr-3 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-40 sm:w-48"
              />
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-600 text-xs">
              - ไม่พบรายการประวัติการงดสอนหรือกิจกรรมในช่วงเวลานี้ -
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="py-2.5 px-4 font-semibold w-28">วันที่</th>
                  <th className="py-2.5 px-4 font-semibold">รายวิชา</th>
                  <th className="py-2.5 px-3 font-semibold text-center w-24">สถานะ</th>
                  <th className="py-2.5 px-4 font-semibold">เหตุผล / ชื่อกิจกรรม / บันทึกเพิ่มเติม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {formatThaiDate(log.date, 'short')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {log.subjectName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {log.subjectCode} {log.gradeGroup ? `• ชั้น ${log.gradeGroup}` : ''} ({log.time})
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        log.status === 'cancelled'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                          : log.status === 'activity'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                          : 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300'
                      }`}>
                        {log.statusLabel}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {log.reason}
                      </div>
                      {log.notes && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          โน้ต: {log.notes}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* Summary Print / PDF Modal */}
      <SummaryPrintView
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        summaryData={summary}
        semester={semester}
        confirmTeachingMode={confirmTeachingMode}
      />

    </div>
  );
}
