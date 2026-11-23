import React, { useMemo, useState } from 'react';
import { Smile, Target, ChevronDown } from 'lucide-react';
import { calculateTeachingSummary } from '../../services/summaryService';
import { MOOD_LEVELS, getMoodLevel } from '../../utils/moodConfig';
import { getColorById } from '../../utils/colors';
import { parseDateString, toDateString, formatThaiDate } from '../../utils/dateUtils';

function mondayKey(dateStr) {
  const d = parseDateString(dateStr);
  const offset = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - offset);
  return toDateString(d);
}

const MOOD_BAR_COLORS = ['bg-rose-500', 'bg-orange-500', 'bg-amber-400', 'bg-lime-500', 'bg-emerald-500'];

/** Semester progress per subject + post-class mood overview (distribution, per subject, weekly trend). */
export default function InsightsPanel({ semester, slots = [], subjects = [], overrides = [], multiDayEvents = [] }) {
  const [open, setOpen] = useState(true);

  const { full, toDate } = useMemo(
    () => ({
      full: calculateTeachingSummary(semester, slots, subjects, overrides, multiDayEvents, 'semester'),
      toDate: calculateTeachingSummary(semester, slots, subjects, overrides, multiDayEvents, 'todate'),
    }),
    [semester, slots, subjects, overrides, multiDayEvents]
  );

  const progressRows = useMemo(() => {
    if (!full || !toDate) return [];
    const doneMap = new Map(toDate.subjectBreakdown.map((s) => [s.subject.id, s]));
    return full.subjectBreakdown
      .filter((s) => s.plannedCount > 0)
      .map((s) => {
        const done = doneMap.get(s.subject.id);
        const completed = done?.completedCount || 0;
        const plannedSoFar = done?.plannedCount || 0;
        return {
          subject: s.subject,
          total: s.plannedCount,
          completed,
          plannedSoFar,
          behind: Math.max(0, plannedSoFar - completed),
          percent: Math.min(100, Math.round((completed / s.plannedCount) * 100)),
          pacePercent: Math.min(100, Math.round((plannedSoFar / s.plannedCount) * 100)),
        };
      });
  }, [full, toDate]);

  const moodData = useMemo(() => {
    if (!semester) return null;
    const slotMap = new Map(slots.map((s) => [s.id, s]));
    const subjectMap = new Map(subjects.map((s) => [s.id, s]));
    const entries = [];
    overrides.forEach((o) => {
      const mood = getMoodLevel(o.postTeachingMood);
      if (!mood || !o.date) return;
      if (o.date < semester.startDate || o.date > semester.endDate) return;
      const subjectId = o.subjectId || slotMap.get(o.slotId)?.subjectId || null;
      entries.push({ date: o.date, value: mood.value, subjectId });
    });
    if (entries.length === 0) return { count: 0 };

    const distribution = [0, 0, 0, 0, 0];
    entries.forEach((e) => {
      distribution[e.value - 1] += 1;
    });
    const average = entries.reduce((sum, e) => sum + e.value, 0) / entries.length;

    const bySubject = new Map();
    entries.forEach((e) => {
      const key = e.subjectId || 'none';
      const row = bySubject.get(key) || { sum: 0, n: 0 };
      row.sum += e.value;
      row.n += 1;
      bySubject.set(key, row);
    });
    const subjectRows = [...bySubject.entries()]
      .map(([id, r]) => ({ subject: subjectMap.get(id) || null, avg: r.sum / r.n, n: r.n }))
      .sort((a, b) => b.avg - a.avg);

    const byWeek = new Map();
    entries.forEach((e) => {
      const key = mondayKey(e.date);
      const row = byWeek.get(key) || { sum: 0, n: 0 };
      row.sum += e.value;
      row.n += 1;
      byWeek.set(key, row);
    });
    const weeks = [...byWeek.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-16)
      .map(([week, r]) => ({ week, avg: r.sum / r.n, n: r.n }));

    return { count: entries.length, distribution, average, subjectRows, weeks };
  }, [semester, slots, subjects, overrides]);

  if (!semester) return null;

  const avgMood = moodData?.count ? getMoodLevel(Math.round(moodData.average)) : null;
  const maxDist = moodData?.count ? Math.max(...moodData.distribution) : 1;

  // Weekly trend chart geometry
  const W = 420;
  const H = 130;
  const PAD = { l: 26, r: 10, t: 10, b: 22 };
  const weeks = moodData?.weeks || [];
  const xAt = (i) => PAD.l + (weeks.length <= 1 ? (W - PAD.l - PAD.r) / 2 : (i * (W - PAD.l - PAD.r)) / (weeks.length - 1));
  const yAt = (v) => PAD.t + ((5 - v) * (H - PAD.t - PAD.b)) / 4;

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden no-print">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center">
            <Smile className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">ภาพรวมความคืบหน้าและอารมณ์การสอน</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ความคืบหน้าแต่ละวิชา และ mood ที่บันทึกหลังสอนในภาคเรียนนี้
            </p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-5 pb-5 grid grid-cols-1 lg:grid-cols-2 gap-6 border-t border-slate-100 dark:border-slate-800 pt-4">
          {/* Progress per subject */}
          <div>
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-3">
              <Target className="w-4 h-4 text-indigo-500" /> ความคืบหน้าตามแผนรายวิชา
            </h4>
            {progressRows.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">ยังไม่มีคาบสอนในแผนของภาคเรียนนี้</p>
            ) : (
              <ul className="space-y-3.5">
                {progressRows.map((r) => (
                  <li key={r.subject.id}>
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {r.subject.code} {r.subject.gradeGroup}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                        สอนแล้ว {r.completed}/{r.total} คาบ ({r.percent}%)
                      </span>
                    </div>
                    <div className="relative mt-1.5 h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-visible">
                      <div
                        className={`h-full rounded-full ${getColorById(r.subject.colorId).accent}`}
                        style={{ width: `${r.percent}%` }}
                      />
                      {/* pace marker: where the plan says we should be by today */}
                      <div
                        title={`ตามแผนควรสอนแล้ว ${r.plannedSoFar} คาบ`}
                        className="absolute -top-0.5 w-0.5 h-3.5 bg-slate-500 dark:bg-slate-300"
                        style={{ left: `${r.pacePercent}%` }}
                      />
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      {r.behind > 0 ? (
                        <span className="text-rose-600 dark:text-rose-400 font-medium">
                          ขาดไป {r.behind} คาบจากแผน (งดสอน/ติดกิจกรรม) · ควรหาคาบชดเชย
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">ตามแผน</span>
                      )}
                      {' · '}เหลืออีก {Math.max(0, r.total - r.completed)} คาบ
                    </div>
                  </li>
                ))}
                <li className="text-[11px] text-slate-400">เส้นดำบนแถบ = จุดที่ควรสอนถึงในวันนี้ตามตารางปกติ</li>
              </ul>
            )}
          </div>

          {/* Mood overview */}
          <div>
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-3">
              <Smile className="w-4 h-4 text-violet-500" /> Mood หลังสอน
            </h4>

            {!moodData?.count ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                ยังไม่มีข้อมูล mood — หลังบันทึกหลังสอนแล้วระบบจะถามอารมณ์ของคาบนั้น ข้อมูลจะมาแสดงที่นี่
              </p>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{avgMood?.emoji}</div>
                  <div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      เฉลี่ย {moodData.average.toFixed(2)} / 5 · {avgMood?.label}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">จาก {moodData.count} คาบที่บันทึกไว้</div>
                  </div>
                </div>

                {/* Distribution */}
                <ul className="space-y-1.5" aria-label="การกระจายของ mood">
                  {[...MOOD_LEVELS].reverse().map((m) => {
                    const n = moodData.distribution[m.value - 1];
                    return (
                      <li key={m.value} className="flex items-center gap-2 text-xs">
                        <span className="w-5 text-center text-base">{m.emoji}</span>
                        <span className="w-24 text-slate-600 dark:text-slate-300 truncate">{m.label}</span>
                        <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className={`h-full rounded-full ${MOOD_BAR_COLORS[m.value - 1]}`}
                            style={{ width: `${(n / maxDist) * 100}%` }}
                          />
                        </div>
                        <span className="w-6 text-right tabular-nums text-slate-500 dark:text-slate-400">{n}</span>
                      </li>
                    );
                  })}
                </ul>

                {/* Weekly trend */}
                {weeks.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      แนวโน้มรายสัปดาห์ (ค่าเฉลี่ย)
                    </div>
                    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto text-slate-400 dark:text-slate-500" role="img" aria-label="กราฟแนวโน้ม mood รายสัปดาห์">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <g key={v}>
                          <line x1={PAD.l} x2={W - PAD.r} y1={yAt(v)} y2={yAt(v)} stroke="currentColor" strokeOpacity="0.2" />
                          <text x={PAD.l - 6} y={yAt(v) + 3} textAnchor="end" fontSize="9" fill="currentColor">
                            {v}
                          </text>
                        </g>
                      ))}
                      {weeks.length > 1 && (
                        <polyline
                          points={weeks.map((w, i) => `${xAt(i)},${yAt(w.avg)}`).join(' ')}
                          fill="none"
                          stroke="#7c3aed"
                          strokeWidth="2"
                          strokeLinejoin="round"
                        />
                      )}
                      {weeks.map((w, i) => (
                        <g key={w.week}>
                          <circle cx={xAt(i)} cy={yAt(w.avg)} r="3.5" fill="#7c3aed">
                            <title>{`สัปดาห์ ${formatThaiDate(w.week, 'short')}: ${w.avg.toFixed(2)} (${w.n} คาบ)`}</title>
                          </circle>
                          {(i === 0 || i === weeks.length - 1) && (
                            <text x={xAt(i)} y={H - 6} textAnchor={i === 0 ? 'start' : 'end'} fontSize="9" fill="currentColor">
                              {formatThaiDate(w.week, 'short')}
                            </text>
                          )}
                        </g>
                      ))}
                    </svg>
                  </div>
                )}

                {/* Per subject */}
                <div>
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                    ค่าเฉลี่ยแยกตามวิชา/ห้อง
                  </div>
                  <ul className="space-y-1">
                    {moodData.subjectRows.map((r) => {
                      const lvl = getMoodLevel(Math.round(r.avg));
                      return (
                        <li key={r.subject?.id || 'none'} className="flex items-center justify-between text-xs gap-2">
                          <span className="truncate text-slate-700 dark:text-slate-200">
                            {r.subject ? `${r.subject.code} ${r.subject.gradeGroup || ''}` : 'กิจกรรมนอกตาราง'}
                          </span>
                          <span className="shrink-0 text-slate-500 dark:text-slate-400">
                            {lvl?.emoji} {r.avg.toFixed(2)} <span className="text-slate-400">({r.n} คาบ)</span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
