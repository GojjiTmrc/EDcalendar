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
  ChevronDown
} from 'lucide-react';
import { calculateTeachingSummary } from '../../services/summaryService';
import SummaryPrintView from './SummaryPrintView';
import { formatThaiDate, parseDateString, THAI_MONTHS_FULL } from '../../utils/dateUtils';
import { getColorById } from '../../utils/colors';

export default function TeachingSummary({
  semester,
  slots = [],
  subjects = [],
  overrides = [],
  multiDayEvents = [],
}) {
  const [scopeType, setScopeType] = useState('semester'); // 'semester' | 'todate' | 'month'
  
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
            <span className="text-xs font-semibold">สอนสำเร็จ</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{summary.totalCompletedCount}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              สอนจริง {summary.totalTaughtWeeks} สัปดาห์
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
            <span className="text-xs font-semibold">ความสำเร็จ</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{summary.overallCompletionRate}%</div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${summary.overallCompletionRate}%` }}
              ></div>
            </div>
          </div>
        </div>

      </div>

      {/* Subject Breakdown Table Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              สรุปผลการสอนแยกตามรายวิชา
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              รายละเอียดคาบสอนจริง เปรียบเทียบกับแผนการสอนและอัตราความสำเร็จ
            </p>
          </div>
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
                <th className="py-3 px-3 font-semibold text-center whitespace-nowrap text-emerald-600 dark:text-emerald-400" title="จำนวนสัปดาห์ที่มีการจัดกิจกรรมการเรียนการสอนจริง">
                  สัปดาห์ที่สอนจริง
                </th>
                <th className="py-3 px-3 font-semibold text-center">ตามแผน</th>
                <th className="py-3 px-3 font-semibold text-center text-emerald-600 dark:text-emerald-400">สอนจริง</th>
                <th className="py-3 px-3 font-semibold text-center text-rose-600 dark:text-rose-400">งดสอน</th>
                <th className="py-3 px-3 font-semibold text-center text-amber-600 dark:text-amber-400">กิจกรรม</th>
                <th className="py-3 px-3 font-semibold text-center text-sky-600 dark:text-sky-400">ชดเชย</th>
                <th className="py-3 px-4 font-semibold text-center">เวลาสอนรวม</th>
                <th className="py-3 px-4 font-semibold w-40 text-center">ความคืบหน้า</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {summary.subjectBreakdown.map((item) => {
                const color = getColorById(item.subject.colorId);

                return (
                  <tr key={item.subject.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-3 h-3 rounded-full shrink-0 ${color.dot}`}></span>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {item.subject.name}
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
                    <td className="py-3 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {item.taughtWeeksCount}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800 dark:text-slate-200">
                      {item.plannedCount}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                      {item.completedCount}
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
                            style={{ width: `${item.completionRate}%` }}
                          ></div>
                        </div>
                        <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400 w-10 text-right">
                          {item.completionRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

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
      />

    </div>
  );
}
