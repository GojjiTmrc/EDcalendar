import React, { useState, useEffect } from 'react';
import {
  Clock,
  Timer,
  Hourglass,
  MapPin,
  Users,
  BookOpen,
  ArrowRight,
  Maximize2,
  Minimize2,
  FlaskConical,
  RotateCcw,
  Coffee,
  Sunrise,
  Moon,
  Sparkles,
  AlertTriangle,
  BellRing,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SCHOOL_DAYS } from '../../utils/dateUtils';

export default function LivePeriodTracker({
  clockState,
  onEditSlot,
  isFullscreenOpen = false,
  setIsFullscreenOpen,
}) {
  const [showSimulator, setShowSimulator] = useState(false);
  const [useMultiSpanMode, setUseMultiSpanMode] = useState(false);
  const [internalFullscreen, setInternalFullscreen] = useState(false);

  const isFullscreen = isFullscreenOpen !== undefined ? isFullscreenOpen : internalFullscreen;
  const setFullscreen = setIsFullscreenOpen || setInternalFullscreen;

  // Close fullscreen on Escape key
  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, setFullscreen]);

  if (!clockState) return null;

  const {
    clockHMS,
    thaiDateFull,
    thaiDayIndex,
    isWeekend,
    phase,
    currentPeriod,
    currentPeriodNum,
    nextPeriod,
    elapsed,
    remaining,
    progressPercent,
    urgency,
    currentSlotInfo,
    currentDefaultActivity,
    multiSpanTiming,
    nextTeachingSlotInfo,
    untilNextTeaching,
    isSimulated,
    jumpToSimulatedTime,
    resetToRealTime,
    setSimulatedDayIndex,
  } = clockState;

  const hasMultiSpan = Boolean(multiSpanTiming && multiSpanTiming.span > 1);
  const activeElapsed = hasMultiSpan && useMultiSpanMode ? multiSpanTiming.elapsed : elapsed;
  const activeRemaining = hasMultiSpan && useMultiSpanMode ? multiSpanTiming.remaining : remaining;
  const activeProgress = hasMultiSpan && useMultiSpanMode ? multiSpanTiming.progressPercent : progressPercent;

  // Color styles based on urgency & phase
  const getUrgencyStyles = () => {
    if (phase === 'lunch') {
      return {
        badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800',
        barBg: 'from-amber-500 to-orange-500',
        remainingCardBorder: 'border-amber-200 dark:border-amber-800/70 bg-amber-50/40 dark:bg-amber-950/20',
        remainingText: 'text-amber-700 dark:text-amber-300',
        dotColor: 'bg-amber-500',
        statusLabel: 'พักรับประทานอาหารกลางวัน',
      };
    }
    if (phase === 'before_school') {
      return {
        badgeBg: 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border-sky-300 dark:border-sky-800',
        barBg: 'from-sky-500 to-indigo-500',
        remainingCardBorder: 'border-sky-200 dark:border-sky-800/70 bg-sky-50/40 dark:bg-sky-950/20',
        remainingText: 'text-sky-700 dark:text-sky-300',
        dotColor: 'bg-sky-500',
        statusLabel: 'เตรียมเข้าเรียนคาบแรก',
      };
    }
    if (phase === 'after_school' || isWeekend) {
      return {
        badgeBg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
        barBg: 'from-slate-400 to-slate-500',
        remainingCardBorder: 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40',
        remainingText: 'text-slate-700 dark:text-slate-300',
        dotColor: 'bg-slate-400',
        statusLabel: isWeekend ? 'วันหยุดสุดสัปดาห์' : 'สิ้นสุดเวลาเรียนประจำวัน',
      };
    }
    if (urgency === 'critical') {
      return {
        badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800',
        barBg: 'from-rose-500 to-red-600',
        remainingCardBorder: 'border-rose-300 dark:border-rose-800 bg-rose-50/60 dark:bg-rose-950/30 ring-1 ring-rose-500/20',
        remainingText: 'text-rose-600 dark:text-rose-400',
        dotColor: 'bg-rose-500 animate-ping',
        statusLabel: 'ท้ายคาบ • เตรียมปล่อยชั้นเรียน / เปลี่ยนห้อง',
      };
    }
    if (urgency === 'warning') {
      return {
        badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800',
        barBg: 'from-amber-500 to-orange-500',
        remainingCardBorder: 'border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/25',
        remainingText: 'text-amber-700 dark:text-amber-300',
        dotColor: 'bg-amber-500 animate-pulse',
        statusLabel: 'ใกล้หมดคาบ • ช่วงสรุปบทเรียน',
      };
    }
    return {
      badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
      barBg: 'from-indigo-600 via-indigo-500 to-emerald-500',
      remainingCardBorder: 'border-emerald-200 dark:border-emerald-800/70 bg-emerald-50/30 dark:bg-emerald-950/20',
      remainingText: 'text-emerald-700 dark:text-emerald-300',
      dotColor: 'bg-emerald-500 animate-pulse',
      statusLabel: 'กำลังดำเนินการเรียนการสอน',
    };
  };

  const styles = getUrgencyStyles();

  // Period title display
  const getCurrentPeriodTitle = () => {
    if (isWeekend) return 'วันหยุดเสาร์ - อาทิตย์';
    if (phase === 'lunch') return `พักเที่ยง (${currentPeriod?.startTime} - ${currentPeriod?.endTime} น.)`;
    if (phase === 'before_school') return `ก่อนเข้าเรียน (คาบที่ 1 เริ่ม ${nextPeriod?.startTime || '08:40'} น.)`;
    if (phase === 'after_school') return 'หลังเลิกเรียน (ครบ 8 คาบแล้ว)';
    if (phase === 'between_periods') return currentPeriod?.label || 'พักเปลี่ยนคาบ';
    if (hasMultiSpan && useMultiSpanMode) {
      return `คาบที่ ${multiSpanTiming.startPeriod} - ${multiSpanTiming.endPeriod} (ควบ ${multiSpanTiming.span} คาบ • ${multiSpanTiming.startTime} - ${multiSpanTiming.endTime} น.)`;
    }
    return `คาบที่ ${currentPeriod?.label} (${currentPeriod?.startTime} - ${currentPeriod?.endTime} น.)`;
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
        {/* Top Header Bar: Status Badge, Multi-Span Toggle, Simulator & Fullscreen Buttons */}
        <div className="px-4 sm:px-5 py-3 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${styles.badgeBg}`}>
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${styles.dotColor}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${styles.dotColor.replace('animate-ping', '')}`} />
              </span>
              <span>
                {isWeekend
                  ? '🌴 วันหยุดสุดสัปดาห์'
                  : phase === 'in_period'
                  ? `กำลังอยู่ในคาบที่ ${currentPeriod?.label}`
                  : phase === 'lunch'
                  ? '🍱 พักเที่ยง'
                  : phase === 'before_school'
                  ? '🌅 ช่วงเช้าก่อนเริ่มคาบที่ 1'
                  : phase === 'between_periods'
                  ? '🔔 พักเปลี่ยนคาบ'
                  : '🌙 นอกเวลาเรียน'}
              </span>
            </span>

            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
              {thaiDateFull}
            </span>

            {isSimulated && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
                <FlaskConical className="w-3 h-3" />
                <span>โหมดจำลองเวลาทดสอบ</span>
                <button
                  type="button"
                  onClick={resetToRealTime}
                  className="ml-1 underline hover:text-purple-950 dark:hover:text-white"
                >
                  (กลับสู่เวลาจริง)
                </button>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Multi-Period Toggle (only shown if current class spans > 1 period) */}
            {hasMultiSpan && (
              <button
                type="button"
                onClick={() => setUseMultiSpanMode(prev => !prev)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
                  useMultiSpanMode
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50'
                }`}
                title="สลับการนับเวลาระหว่าง คาบย่อยปัจจุบัน กับ เวลารวมของวิชาที่ควบหลายคาบ"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{useMultiSpanMode ? `นับเวลารวม (${multiSpanTiming.span} คาบ)` : 'นับแยกรายคาบ'}</span>
              </button>
            )}

            {/* Time Simulator Toggle */}
            <button
              type="button"
              onClick={() => setShowSimulator(prev => !prev)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium border transition-colors ${
                showSimulator || isSimulated
                  ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
              title="จำลองเวลาเพื่อทดสอบดูสถานะในคาบต่างๆ"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">จำลองเวลา</span>
              {showSimulator ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {/* Fullscreen Classroom Mode Button */}
            <button
              type="button"
              onClick={() => setFullscreen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors"
              title="ขยายนาฬิกาเต็มจอสำหรับเปิดหน้าห้องเรียน"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">เต็มจอหน้าห้องเรียน</span>
            </button>
          </div>
        </div>

        {/* Optional Time Simulator Bar for easy testing */}
        {showSimulator && (
          <div className="px-4 sm:px-5 py-3 bg-purple-50/60 dark:bg-purple-950/20 border-b border-purple-200/70 dark:border-purple-800/50 space-y-2.5 text-xs animate-in fade-in duration-150">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-semibold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                <FlaskConical className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>แถบจำลองเวลาทดสอบ (คลิกเลือกช่วงเวลาที่ต้องการดูผลลัพธ์ได้ทันที — นาฬิกายังเดินระดับวินาทีตามปกติ)</span>
              </div>
              {isSimulated && (
                <button
                  type="button"
                  onClick={resetToRealTime}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-xs transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>รีเซ็ตกลับเป็นเวลาจริงปัจจุบัน</span>
                </button>
              )}
            </div>

            {/* Day selector + Time presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1">เลือกวัน:</span>
              {SCHOOL_DAYS.map(d => (
                <button
                  key={d.index}
                  type="button"
                  onClick={() => setSimulatedDayIndex(d.index)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                    thaiDayIndex === d.index
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-purple-100/50'
                  }`}
                >
                  {d.short}
                </button>
              ))}

              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 ml-2 mr-1">เลือกช่วงเวลา:</span>
              {[
                { label: 'ก่อนเริ่มเรียน (08:25)', time: '08:25:00' },
                { label: 'คาบ 1 (08:55)', time: '08:55:10' },
                { label: 'คาบ 2 (09:45)', time: '09:45:20' },
                { label: 'ใกล้หมดคาบ เหลือ 8 นาที (10:12)', time: '10:12:00' },
                { label: 'ท้ายคาบ เหลือ 2 นาที (10:18)', time: '10:18:00' },
                { label: 'พักเที่ยง (12:25)', time: '12:25:00' },
                { label: 'คาบ 5 บ่าย (13:15)', time: '13:15:30' },
                { label: 'คาบ 7 กิจกรรม (14:50)', time: '14:50:00' },
                { label: 'หลังเลิกเรียน (16:45)', time: '16:45:00' },
              ].map((preset) => (
                <button
                  key={preset.time}
                  type="button"
                  onClick={() => jumpToSimulatedTime(preset.time)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[11px] font-medium transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main 3-Column Grid: Real-Time Clock | Sub 1: Elapsed Time | Sub 2: Remaining Time */}
        <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          
          {/* BLOCK 1: REAL-TIME CLOCK (4 cols on lg) */}
          <div className="lg:col-span-4 p-4 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-indigo-700 dark:from-indigo-900 dark:via-slate-900 dark:to-slate-900 text-white shadow-md shadow-indigo-500/15 flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-indigo-100 text-xs font-medium">
                <Clock className="w-4 h-4 text-indigo-200" />
                <span>เวลาปัจจุบัน (Real-Time)</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/15 text-white font-semibold backdrop-blur-xs">
                {getCurrentPeriodTitle()}
              </span>
            </div>

            <div className="my-3 flex items-baseline gap-2">
              <div className="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono tabular-nums">
                {clockHMS}
              </div>
              <span className="text-sm font-medium text-indigo-200">น.</span>
            </div>

            <div className="text-xs text-indigo-100/90 flex items-center justify-between gap-2 pt-2 border-t border-white/15">
              <span className="truncate">{styles.statusLabel}</span>
              {(phase === 'in_period' || phase === 'lunch') && (
                <span className="font-mono font-bold text-white shrink-0">
                  {Math.round(activeProgress)}% ของคาบ
                </span>
              )}
            </div>
          </div>

          {/* BLOCK 2: SUB-INDICATOR 1 — ELAPSED TIME (คาบไหนเริ่มไปกี่นาที กี่วินาที) (4 cols on lg) */}
          <div className="lg:col-span-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Timer className="w-4 h-4" />
                </div>
                <span>เวลาที่เริ่มคาบไปแล้ว</span>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
                {phase === 'in_period'
                  ? hasMultiSpan && useMultiSpanMode
                    ? `คาบ ${multiSpanTiming.startPeriod}-${multiSpanTiming.endPeriod}`
                    : `คาบที่ ${currentPeriod?.label}`
                  : phase === 'lunch'
                  ? 'พักเที่ยง'
                  : phase === 'between_periods'
                  ? 'เปลี่ยนคาบ'
                  : 'สถานะเวลา'}
              </span>
            </div>

            {phase === 'in_period' || phase === 'lunch' || phase === 'between_periods' ? (
              <>
                <div className="my-3">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
                    {phase === 'lunch'
                      ? 'เริ่มพักเที่ยงมาแล้ว'
                      : hasMultiSpan && useMultiSpanMode
                      ? `เริ่มสอนวิชาควบ (คาบ ${multiSpanTiming.startPeriod}-${multiSpanTiming.endPeriod}) มาแล้ว`
                      : `เริ่มคาบที่ ${currentPeriod?.label} มาแล้ว`}
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums">
                    <span className="text-indigo-600 dark:text-indigo-400 font-mono text-2xl sm:text-3xl">
                      {activeElapsed.minutes}
                    </span>{' '}
                    <span className="text-sm sm:text-base font-bold text-slate-600 dark:text-slate-300">นาที</span>{' '}
                    <span className="text-indigo-600 dark:text-indigo-400 font-mono text-2xl sm:text-3xl">
                      {String(activeElapsed.seconds).padStart(2, '0')}
                    </span>{' '}
                    <span className="text-sm sm:text-base font-bold text-slate-600 dark:text-slate-300">วินาที</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-2 border-t border-slate-200/70 dark:border-slate-700/70">
                  <span>
                    เวลาเริ่มคาบ:{' '}
                    <strong className="text-slate-700 dark:text-slate-200 font-mono">
                      {hasMultiSpan && useMultiSpanMode ? multiSpanTiming.startTime : currentPeriod?.startTime} น.
                    </strong>
                  </span>
                  {hasMultiSpan && !useMultiSpanMode && (
                    <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                      (รวมวิชาควบ: {multiSpanTiming.elapsed.minutes} น. {String(multiSpanTiming.elapsed.seconds).padStart(2, '0')} วิ.)
                    </span>
                  )}
                </div>
              </>
            ) : phase === 'before_school' ? (
              <div className="my-auto py-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Sunrise className="w-5 h-5 text-amber-500 shrink-0" />
                <span>ยังไม่เริ่มคาบเรียนแรกของวันนี้ (คาบที่ 1 เริ่มเวลา {nextPeriod?.startTime || '08:40'} น.)</span>
              </div>
            ) : (
              <div className="my-auto py-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Moon className="w-5 h-5 text-indigo-400 shrink-0" />
                <span>
                  {isWeekend
                    ? 'วันนี้เป็นวันหยุดเสาร์-อาทิตย์ ไม่มีคาบเรียน'
                    : `เลิกเรียนมาแล้ว ${elapsed.minutes} นาที ${String(elapsed.seconds).padStart(2, '0')} วินาที`}
                </span>
              </div>
            )}
          </div>

          {/* BLOCK 3: SUB-INDICATOR 2 — REMAINING TIME (เหลืออีกกี่นาที กี่วินาที) (4 cols on lg) */}
          <div className={`lg:col-span-4 p-4 rounded-2xl border flex flex-col justify-between transition-colors ${styles.remainingCardBorder}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Hourglass className="w-4 h-4" />
                </div>
                <span>
                  {phase === 'before_school' ? 'เวลานับถอยหลังเข้าคาบ 1' : 'เวลาที่เหลือในคาบนี้'}
                </span>
              </div>

              {urgency === 'critical' && phase === 'in_period' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-600 text-white animate-pulse">
                  <BellRing className="w-3 h-3" />
                  <span>ท้ายคาบ!</span>
                </span>
              )}
              {urgency === 'warning' && phase === 'in_period' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500 text-white">
                  <AlertTriangle className="w-3 h-3" />
                  <span>สรุปบทเรียน</span>
                </span>
              )}
            </div>

            {phase === 'in_period' || phase === 'lunch' || phase === 'between_periods' || phase === 'before_school' ? (
              <>
                <div className="my-3">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
                    {phase === 'before_school'
                      ? 'อีกไม่นานจะเริ่มคาบที่ 1 ในอีก'
                      : phase === 'lunch'
                      ? 'เหลือเวลาพักเที่ยงอีก'
                      : hasMultiSpan && useMultiSpanMode
                      ? `เหลือเวลาสอนวิชาควบ (ถึงคาบ ${multiSpanTiming.endPeriod}) อีก`
                      : `เหลือเวลาในคาบที่ ${currentPeriod?.label} อีก`}
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums">
                    <span className={`font-mono text-2xl sm:text-3xl ${styles.remainingText}`}>
                      {activeRemaining.minutes}
                    </span>{' '}
                    <span className="text-sm sm:text-base font-bold text-slate-600 dark:text-slate-300">นาที</span>{' '}
                    <span className={`font-mono text-2xl sm:text-3xl ${styles.remainingText}`}>
                      {String(activeRemaining.seconds).padStart(2, '0')}
                    </span>{' '}
                    <span className="text-sm sm:text-base font-bold text-slate-600 dark:text-slate-300">วินาที</span>
                  </div>
                </div>

                {/* Live Progress Bar */}
                <div className="space-y-1.5">
                  <div className="w-full h-2 bg-slate-200/80 dark:bg-slate-700/80 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${styles.barBg} transition-all duration-500 rounded-full`}
                      style={{ width: `${Math.min(100, Math.max(2, activeProgress))}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>
                      หมดเวลาคาบ:{' '}
                      <strong className="text-slate-700 dark:text-slate-200 font-mono">
                        {phase === 'before_school'
                          ? `${nextPeriod?.startTime} น.`
                          : hasMultiSpan && useMultiSpanMode
                          ? `${multiSpanTiming.endTime} น.`
                          : `${currentPeriod?.endTime} น.`}
                      </strong>
                    </span>
                    {hasMultiSpan && !useMultiSpanMode && (
                      <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                        (จบวิชาควบในอีก {multiSpanTiming.remaining.minutes} น. {String(multiSpanTiming.remaining.seconds).padStart(2, '0')} วิ.)
                      </span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="my-auto py-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>สิ้นสุดคาบเรียนทั้งหมดของวันนี้เรียบร้อยแล้ว</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Context Bar: Current Teaching Subject + Up Next Preview */}
        <div className="px-4 sm:px-5 py-3 bg-slate-50/60 dark:bg-slate-900/90 border-t border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          
          {/* Left: What is happening in the current period for the teacher */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">
              ตารางของคุณในคาบนี้:
            </span>

            {currentSlotInfo ? (
              <div
                onClick={() => onEditSlot && onEditSlot(currentSlotInfo.slot)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer transition-all hover:brightness-95 ${currentSlotInfo.color.bg} ${currentSlotInfo.color.border}`}
                title="คลิกเพื่อดูหรือแก้ไขข้อมูลคาบสอนนี้"
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="font-bold text-slate-900 dark:text-white">
                  {currentSlotInfo.subject.code} {currentSlotInfo.subject.name}
                </span>
                {currentSlotInfo.subject.gradeGroup && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 font-semibold text-[11px]">
                    <Users className="w-3 h-3 text-slate-400" />
                    {currentSlotInfo.subject.gradeGroup}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 font-semibold text-[11px]">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  ห้อง {currentSlotInfo.room}
                </span>
                {currentSlotInfo.span > 1 && (
                  <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-white text-[10px] font-bold">
                    ควบคาบ {currentSlotInfo.startPeriod}-{currentSlotInfo.endPeriod}
                  </span>
                )}
                {currentSlotInfo.status !== 'normal' && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${currentSlotInfo.statusInfo.badge}`}>
                    {currentSlotInfo.statusInfo.label}
                    {currentSlotInfo.statusReason ? `: ${currentSlotInfo.statusReason}` : ''}
                  </span>
                )}
              </div>
            ) : phase === 'lunch' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-semibold">
                <Coffee className="w-3.5 h-3.5" />
                <span>เวลาพักรับประทานอาหารกลางวัน</span>
              </span>
            ) : currentDefaultActivity ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold">
                <span>กิจกรรมพัฒนาผู้เรียน: {currentDefaultActivity} (คาบที่ 7)</span>
              </span>
            ) : phase === 'in_period' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-medium">
                <span>⚪ คาบว่าง (ไม่มีวิชาสอนในคาบที่ {currentPeriodNum})</span>
              </span>
            ) : (
              <span className="text-slate-500 dark:text-slate-400">
                ไม่ได้อยู่ในช่วงเวลาคาบเรียน
              </span>
            )}
          </div>

          {/* Right: Up Next Preview */}
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            {nextTeachingSlotInfo ? (
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 shrink-0">
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>วิชาที่ต้องสอนถัดไป:</span>
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  คาบ {nextTeachingSlotInfo.span > 1 ? `${nextTeachingSlotInfo.startPeriod}-${nextTeachingSlotInfo.endPeriod}` : nextTeachingSlotInfo.startPeriod} ({nextTeachingSlotInfo.periodObj.startTime}) • {nextTeachingSlotInfo.subject.code} {nextTeachingSlotInfo.subject.name}
                </span>
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  ห้อง {nextTeachingSlotInfo.room}
                </span>
                {untilNextTeaching && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
                    (อีก {untilNextTeaching.minutes} น. {String(untilNextTeaching.seconds).padStart(2, '0')} วิ.)
                  </span>
                )}
              </div>
            ) : (
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                ไม่มีคาบสอนถัดไปในวันนี้แล้ว
              </span>
            )}
          </div>
        </div>
      </div>

      {/* FULLSCREEN CLASSROOM MODE OVERLAY */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-10 animate-in fade-in duration-200">
          {/* Top Bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-lg font-bold tracking-tight">
                  ED<span className="text-indigo-400">calendar</span> • นาฬิกาประจำห้องเรียน
                </div>
                <div className="text-sm text-slate-400">{thaiDateFull}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {hasMultiSpan && (
                <button
                  type="button"
                  onClick={() => setUseMultiSpanMode(prev => !prev)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-sm font-semibold border border-slate-700 transition-colors"
                >
                  {useMultiSpanMode ? `โหมดนับเวลารวม (${multiSpanTiming.span} คาบ)` : 'โหมดนับเวลาแยกตามคาบ'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setFullscreen(false)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 transition-colors"
              >
                <Minimize2 className="w-4 h-4" />
                <span>ย่อกลับ (ESC)</span>
              </button>
            </div>
          </div>

          {/* Center Giant Display */}
          <div className="my-auto max-w-6xl w-full mx-auto space-y-8 text-center">
            {/* Period & Subject Pill */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-lg sm:text-xl font-bold">
                <span className={`w-3 h-3 rounded-full ${styles.dotColor}`} />
                <span>{getCurrentPeriodTitle()}</span>
              </div>

              {currentSlotInfo && (
                <div className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {currentSlotInfo.subject.code} {currentSlotInfo.subject.name}
                  <span className="text-indigo-400 font-semibold text-xl sm:text-2xl ml-3">
                    ({currentSlotInfo.subject.gradeGroup || '-'} • ห้อง {currentSlotInfo.room})
                  </span>
                </div>
              )}
            </div>

            {/* Huge Real-Time Clock */}
            <div className="py-4">
              <div className="text-sm uppercase tracking-widest text-slate-400 font-semibold mb-2">
                เวลาปัจจุบัน (Real-Time)
              </div>
              <div className="text-6xl sm:text-8xl md:text-9xl font-black font-mono tabular-nums tracking-tight text-white drop-shadow">
                {clockHMS}
              </div>
            </div>

            {/* Two Giant Sub-Cards: Elapsed vs Remaining */}
            {(phase === 'in_period' || phase === 'lunch' || phase === 'between_periods') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                {/* Sub 1: Elapsed */}
                <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 text-left space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-sm font-semibold">
                    <span className="flex items-center gap-2">
                      <Timer className="w-5 h-5 text-indigo-400" />
                      เวลาที่เริ่มคาบไปแล้ว
                    </span>
                    <span className="font-mono">เริ่ม {hasMultiSpan && useMultiSpanMode ? multiSpanTiming.startTime : currentPeriod?.startTime} น.</span>
                  </div>
                  <div className="text-3xl sm:text-5xl font-black tabular-nums text-white pt-2">
                    <span className="text-indigo-400 font-mono">{activeElapsed.minutes}</span>{' '}
                    <span className="text-xl sm:text-2xl font-bold text-slate-300">นาที</span>{' '}
                    <span className="text-indigo-400 font-mono">{String(activeElapsed.seconds).padStart(2, '0')}</span>{' '}
                    <span className="text-xl sm:text-2xl font-bold text-slate-300">วินาที</span>
                  </div>
                </div>

                {/* Sub 2: Remaining */}
                <div className={`p-6 sm:p-8 rounded-3xl border text-left space-y-2 ${
                  urgency === 'critical'
                    ? 'bg-rose-950/40 border-rose-500/60'
                    : urgency === 'warning'
                    ? 'bg-amber-950/40 border-amber-500/60'
                    : 'bg-slate-900/90 border-slate-800'
                }`}>
                  <div className="flex items-center justify-between text-slate-400 text-sm font-semibold">
                    <span className="flex items-center gap-2">
                      <Hourglass className="w-5 h-5 text-emerald-400" />
                      เวลาที่เหลือในคาบนี้
                    </span>
                    <span className="font-mono">หมดเวลา {hasMultiSpan && useMultiSpanMode ? multiSpanTiming.endTime : currentPeriod?.endTime} น.</span>
                  </div>
                  <div className="text-3xl sm:text-5xl font-black tabular-nums text-white pt-2">
                    <span className={`font-mono ${
                      urgency === 'critical' ? 'text-rose-400' : urgency === 'warning' ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {activeRemaining.minutes}
                    </span>{' '}
                    <span className="text-xl sm:text-2xl font-bold text-slate-300">นาที</span>{' '}
                    <span className={`font-mono ${
                      urgency === 'critical' ? 'text-rose-400' : urgency === 'warning' ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {String(activeRemaining.seconds).padStart(2, '0')}
                    </span>{' '}
                    <span className="text-xl sm:text-2xl font-bold text-slate-300">วินาที</span>
                  </div>
                </div>
              </div>
            )}

            {/* Giant Progress Bar */}
            {(phase === 'in_period' || phase === 'lunch') && (
              <div className="max-w-5xl mx-auto space-y-2">
                <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden p-0.5">
                  <div
                    className={`h-full bg-gradient-to-r ${styles.barBg} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(100, Math.max(2, activeProgress))}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs font-mono text-slate-400">
                  <span>{hasMultiSpan && useMultiSpanMode ? multiSpanTiming.startTime : currentPeriod?.startTime} น.</span>
                  <span>ดำเนินการไปแล้ว {Math.round(activeProgress)}%</span>
                  <span>{hasMultiSpan && useMultiSpanMode ? multiSpanTiming.endTime : currentPeriod?.endTime} น.</span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Next Class Info */}
          <div className="flex items-center justify-between text-sm text-slate-400 border-t border-slate-800 pt-4">
            <div>{styles.statusLabel}</div>
            {nextTeachingSlotInfo && (
              <div>
                คาบสอนถัดไป: <strong className="text-white">คาบ {nextTeachingSlotInfo.startPeriod} ({nextTeachingSlotInfo.periodObj.startTime} น.) • {nextTeachingSlotInfo.subject.code} {nextTeachingSlotInfo.subject.name} (ห้อง {nextTeachingSlotInfo.room})</strong>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
