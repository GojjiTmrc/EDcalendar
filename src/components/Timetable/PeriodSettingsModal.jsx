import React, { useState } from 'react';
import { X, Clock, RotateCcw, Check, Save } from 'lucide-react';
import { DEFAULT_PERIODS } from '../../utils/periodConfig';

export default function PeriodSettingsModal({ isOpen, onClose, periods, onSave }) {
  const [periodList, setPeriodList] = useState(() => periods || DEFAULT_PERIODS);

  if (!isOpen) return null;

  const handleTimeChange = (index, field, value) => {
    const updated = [...periodList];
    updated[index] = { ...updated[index], [field]: value };
    setPeriodList(updated);
  };

  const handleReset = () => {
    if (confirm('คุณต้องการรีเซ็ตเวลาคาบเรียนเป็นค่ามาตรฐานเริ่มต้นใช่หรือไม่?')) {
      setPeriodList(DEFAULT_PERIODS);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(periodList);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-900 dark:text-white">
                ตั้งค่าช่วงเวลาคาบเรียน (1 - 8)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ปรับเวลาเริ่ม-เลิกเรียนในแต่ละคาบให้ตรงกับตารางเสียงกริ่งของโรงเรียน
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div className="space-y-2">
            {periodList.map((p, idx) => {
              const isLunch = p.isLunch;
              return (
                <div
                  key={p.period}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
                    isLunch
                      ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold w-24">
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${
                        isLunch
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                          : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                      }`}
                    >
                      {p.label}
                    </span>
                    <span className="text-slate-800 dark:text-slate-200">
                      {isLunch ? 'พักเที่ยง' : `คาบที่ ${p.label}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={p.startTime}
                      onChange={(e) => handleTimeChange(idx, 'startTime', e.target.value)}
                      className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                      required
                    />
                    <span className="text-slate-400">-</span>
                    <input
                      type="time"
                      value={p.endTime}
                      onChange={(e) => handleTimeChange(idx, 'endTime', e.target.value)}
                      className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                      required
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>รีเซ็ตเป็นค่ามาตรฐาน</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-500/20 transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>บันทึกการตั้งค่า</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
