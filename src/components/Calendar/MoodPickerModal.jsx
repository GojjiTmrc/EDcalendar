import React, { useEffect } from 'react';
import { MOOD_LEVELS } from '../../utils/moodConfig';

/**
 * Popup asking how the class period felt (5 levels).
 * onSelect(value 1-5) / onSkip()
 */
export default function MoodPickerModal({ isOpen, currentMood, subjectLabel, onSelect, onSkip }) {
  // Keyboard shortcuts: 1-5 to choose, Esc to skip
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKey = (e) => {
      if (e.key >= '1' && e.key <= '5') {
        onSelect(Number(e.key));
      } else if (e.key === 'Escape') {
        onSkip();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onSelect, onSkip]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="ประเมินอารมณ์ของคาบเรียน"
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="text-center">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">คาบนี้รู้สึกอย่างไรบ้าง?</h3>
          {subjectLabel && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subjectLabel}</p>
          )}
        </div>

        <div className="mt-5 grid grid-cols-5 gap-2">
          {MOOD_LEVELS.map((mood) => {
            const selected = Number(currentMood) === mood.value;
            return (
              <button
                key={mood.value}
                type="button"
                onClick={() => onSelect(mood.value)}
                title={`${mood.value} • ${mood.label}`}
                className={`flex flex-col items-center gap-1.5 rounded-xl border px-1 py-3 transition-all hover:-translate-y-0.5 hover:shadow-md ${
                  selected
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 ring-2 ring-indigo-400'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-indigo-300'
                }`}
              >
                <span className="text-3xl leading-none">{mood.emoji}</span>
                <span className={`text-[10px] font-semibold leading-tight text-center ${mood.tone}`}>
                  {mood.label}
                </span>
                <span className="text-[10px] text-slate-400">{mood.value}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">กดเลข 1–5 บนคีย์บอร์ดได้</span>
          <button
            type="button"
            onClick={onSkip}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            ข้าม
          </button>
        </div>
      </div>
    </div>
  );
}
