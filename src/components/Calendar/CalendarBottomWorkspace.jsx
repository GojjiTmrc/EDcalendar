import React, { useState, useMemo } from 'react';
import {
  BookCheck,
  Calendar as CalIcon,
  Clock,
  MapPin,
  Users,
  Search,
  Filter,
  Edit3,
  Plus,
  Sparkles,
  Target,
  ArrowUpDown,
  Layers,
  CheckCircle2,
  FileText
} from 'lucide-react';
import {
  formatThaiDate,
  parseDateString,
  jsDayToThaiDay,
  THAI_DAYS,
  THAI_MONTHS_FULL
} from '../../utils/dateUtils';
import { getPostTeachingLogsByDay } from '../../services/calendarGenerator';

/**
 * Extensible feature tabs for the bottom workspace window.
 * Future features can be added to this list.
 */
const WORKSPACE_FEATURES = [
  {
    id: 'post_teaching_logs',
    label: 'ดูบันทึกหลังการสอน',
    icon: BookCheck,
    description: 'อ่านและทบทวนบันทึกหลังการสอนโดยรวมของแต่ละวัน แยกตามวันและรายวิชา',
  },
];

export default function CalendarBottomWorkspace({
  semester,
  slots = [],
  subjects = [],
  overrides = [],
  multiDayEvents = [],
  currentDate,
  currentDateStr,
  daySessions = [],
  onSelectSession,
  onJumpToDate,
}) {
  const [activeFeature, setActiveFeature] = useState('post_teaching_logs');
  const [scopeFilter, setScopeFilter] = useState('all'); // 'all' | 'month' | 'selectedDay'
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' (newest first) | 'asc' (oldest first)

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const currentMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  // All day groups that have post-teaching logs in this semester
  const allLoggedDays = useMemo(() => {
    return getPostTeachingLogsByDay(semester, slots, subjects, overrides, multiDayEvents);
  }, [semester, slots, subjects, overrides, multiDayEvents]);

  // Total count of logged sessions across the semester
  const totalLogsCount = useMemo(() => {
    return allLoggedDays.reduce((acc, group) => acc + group.sessions.length, 0);
  }, [allLoggedDays]);

  // Filter and sort day groups based on user controls
  const filteredDayGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const groups = allLoggedDays
      .filter((group) => {
        if (scopeFilter === 'month') {
          return group.date.startsWith(currentMonthPrefix);
        }
        if (scopeFilter === 'selectedDay') {
          return group.date === currentDateStr;
        }
        return true;
      })
      .map((group) => {
        const matchingSessions = group.sessions.filter((sess) => {
          if (subjectFilter !== 'all' && sess.subjectId !== subjectFilter) {
            return false;
          }
          if (!q) return true;
          const haystack = [
            sess.subjectName,
            sess.subjectCode,
            sess.gradeGroup,
            sess.topic,
            sess.postTeachingLog,
            formatThaiDate(group.date, 'withDay'),
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          return haystack.includes(q);
        });

        return {
          ...group,
          sessions: matchingSessions,
        };
      })
      .filter((group) => group.sessions.length > 0);

    return groups.sort((a, b) =>
      sortOrder === 'desc' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)
    );
  }, [allLoggedDays, scopeFilter, currentMonthPrefix, currentDateStr, subjectFilter, searchQuery, sortOrder]);

  return (
    <section
      id="calendar-bottom-workspace"
      className="mt-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden scroll-mt-20"
    >
      {/* ==================== WINDOW TOP HEADER & FEATURE MENU ==================== */}
      <div className="bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-indigo-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/80 px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0 mt-0.5">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  หน้าต่างบันทึกและเครื่องมือเสริมการสอน
                </h2>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  บันทึกแล้ว {totalLogsCount} คาบเรียน
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                ดูบันทึกหลังการสอนโดยรวมของแต่ละวัน แยกตามวันและรายวิชาให้อ่านได้ทันที (พร้อมรองรับฟีเจอร์ใหม่ในอนาคต)
              </p>
            </div>
          </div>

          {/* Feature Menu Tabs (Extensible for future features) */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-white/90 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              {WORKSPACE_FEATURES.map((feat) => {
                const Icon = feat.icon;
                const isActive = activeFeature === feat.id;
                return (
                  <button
                    key={feat.id}
                    type="button"
                    onClick={() => setActiveFeature(feat.id)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{feat.label}</span>
                  </button>
                );
              })}
            </div>

            <div
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-[11px] font-medium text-slate-400 dark:text-slate-500 select-none"
              title="พื้นที่สำหรับเพิ่มเมนูฟีเจอร์ใหม่ในอนาคต"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>+ ฟีเจอร์ใหม่เร็วๆ นี้</span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== FEATURE 1: ดูบันทึกหลังการสอน ==================== */}
      {activeFeature === 'post_teaching_logs' && (
        <div className="p-5 sm:p-6 space-y-6">
          
          {/* Quick Strip: คาบเรียนในวันที่เลือกบนปฏิทิน (เพื่อให้กดเขียนบันทึกหลังการสอนของวันนั้นได้ทันที) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/90 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CalIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  คาบสอนของวันที่เลือกในปฏิทิน ({formatThaiDate(currentDateStr, 'withDay')})
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                คลิกที่วิชาเพื่อเขียนหรือแก้ไขบันทึกหลังการสอนของแต่ละคาบ
              </span>
            </div>

            {daySessions.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                ไม่มีคาบสอนในวันที่เลือก ({formatThaiDate(currentDateStr, 'short')})
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {daySessions.map((sess) => {
                  const hasLog = Boolean(sess.postTeachingLog && sess.postTeachingLog.trim());
                  return (
                    <button
                      key={sess.id}
                      type="button"
                      onClick={() => onSelectSession(sess, 'postLog')}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-2 hover:shadow-sm ${
                        hasLog
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          <Clock className="w-3 h-3 text-indigo-500 shrink-0" />
                          <span>{sess.startTime} - {sess.endTime}</span>
                          {sess.gradeGroup && <span>• ม.{sess.gradeGroup.replace(/^ม\./, '')}</span>}
                        </div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white truncate mt-0.5">
                          {sess.subjectName} ({sess.subjectCode})
                        </div>
                      </div>

                      <span
                        className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 ${
                          hasLog
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                        }`}
                      >
                        <BookCheck className="w-3 h-3" />
                        <span>{hasLog ? 'บันทึกแล้ว' : '+ บันทึก'}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
            {/* Scope Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 self-start">
              <button
                type="button"
                onClick={() => setScopeFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  scopeFilter === 'all'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                ทั้งหมดในภาคเรียน ({allLoggedDays.length} วัน)
              </button>
              <button
                type="button"
                onClick={() => setScopeFilter('month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  scopeFilter === 'month'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                เดือน{THAI_MONTHS_FULL[currentMonth]}
              </button>
              <button
                type="button"
                onClick={() => setScopeFilter('selectedDay')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  scopeFilter === 'selectedDay'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                เฉพาะวันที่เลือก ({formatThaiDate(currentDateStr, 'short')})
              </button>
            </div>

            {/* Subject Filter, Search & Sort */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Subject Select */}
              <div className="relative">
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="all">ทุกรายวิชา ({subjects.length})</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.code} - {sub.name} {sub.gradeGroup ? `(${sub.gradeGroup})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Input */}
              <div className="relative flex-1 sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาบันทึก, วิชา, หรือหัวข้อ..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Sort Order Toggle */}
              <button
                type="button"
                onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
                title="สลับการเรียงลำดับวันที่"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                <span>{sortOrder === 'desc' ? 'ใหม่สุดก่อน' : 'เก่าสุดก่อน'}</span>
              </button>
            </div>
          </div>

          {/* ==================== DAILY POST-TEACHING LOGS FEED ==================== */}
          {filteredDayGroups.length === 0 ? (
            <div className="py-14 px-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/40 dark:bg-slate-900/40">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <BookCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                ยังไม่มีบันทึกหลังการสอนในหมวดที่เลือก
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                คุณสามารถคลิกที่คาบสอนในปฏิทินด้านบน หรือคลิกปุ่ม <strong>"+ บันทึก"</strong> จากรายการคาบสอนด้านบน เพื่อเขียนบันทึกหลังการสอนในแต่ละคาบได้ทันที
              </p>
              {scopeFilter !== 'all' && allLoggedDays.length > 0 && (
                <button
                  type="button"
                  onClick={() => setScopeFilter('all')}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                >
                  <span>ดูบันทึกหลังการสอนทั้งหมด ({totalLogsCount} รายการ)</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {filteredDayGroups.map((dayGroup) => {
                const d = parseDateString(dayGroup.date);
                const thaiDayIndex = jsDayToThaiDay(d.getDay());
                const thaiDayInfo = THAI_DAYS.find((td) => td.index === thaiDayIndex) || THAI_DAYS[0];

                return (
                  <div
                    key={dayGroup.date}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden"
                  >
                    {/* Day Group Header (วัน) */}
                    <div className={`px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 ${thaiDayInfo.bg}`}>
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 shadow-2xs ${thaiDayInfo.color}`}>
                          {thaiDayInfo.full}
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                          {formatThaiDate(dayGroup.date, 'full')}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/90 dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          บันทึกแล้ว {dayGroup.sessions.length} วิชา
                        </span>
                        {onJumpToDate && (
                          <button
                            type="button"
                            onClick={() => {
                              onJumpToDate(dayGroup.date);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-1 rounded-lg bg-white/80 dark:bg-slate-800/80"
                          >
                            ดูในปฏิทิน ↑
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Subjects & Logs List for this Day (วิชาและบันทึกให้อ่านได้เลย) */}
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {dayGroup.sessions.map((sess) => (
                        <div
                          key={sess.id}
                          className="p-4 sm:p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors space-y-3"
                        >
                          {/* Subject & Period Info Row */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span
                                className={`w-3 h-3 rounded-full shrink-0 ${sess.color?.dot || 'bg-indigo-500'}`}
                              />
                              <span className="text-base font-bold text-slate-900 dark:text-white">
                                วิชา {sess.subjectName}
                              </span>
                              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {sess.subjectCode}
                              </span>
                              {sess.gradeGroup && (
                                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  <span>ชั้น {sess.gradeGroup}</span>
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 self-start sm:self-auto text-xs text-slate-500 dark:text-slate-400">
                              <span className="flex items-center gap-1 font-medium bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                                <span>{sess.startTime} - {sess.endTime} น. ({sess.periods || 1} คาบ)</span>
                              </span>
                              {sess.room && (
                                <span className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{sess.room}</span>
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => onSelectSession(sess, 'postLog')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold flex items-center gap-1 transition-colors"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>แก้ไขบันทึก</span>
                              </button>
                            </div>
                          </div>

                          {/* Topic taught (if specified) */}
                          {sess.topic && (
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-800 dark:text-sky-300 bg-sky-50/80 dark:bg-sky-950/40 px-3 py-1.5 rounded-xl border border-sky-200/70 dark:border-sky-800/60 w-fit">
                              <Target className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                              <span>หัวข้อที่สอน: {sess.topic}</span>
                            </div>
                          )}

                          {/* Readable Post-Teaching Log Content Box */}
                          <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/25 border border-emerald-200/80 dark:border-emerald-800/60">
                            <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 mb-1.5 flex items-center gap-1.5">
                              <BookCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>บันทึกหลังการสอน:</span>
                            </div>
                            <div className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-line leading-relaxed pl-1">
                              {sess.postTeachingLog}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}
    </section>
  );
}
