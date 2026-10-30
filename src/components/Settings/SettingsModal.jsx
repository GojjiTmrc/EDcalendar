import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Settings,
  Sun,
  Moon,
  Clock,
  RotateCcw,
  Save,
  Cloud,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileSignature,
  Layout,
} from 'lucide-react';
import {
  DEFAULT_PERIODS,
  DEFAULT_SIGNATURES,
  getStoredPeriods,
  saveStoredPeriods,
  getStoredSignatures,
  saveStoredSignatures,
} from '../../utils/periodConfig';
import { exportBackupJSON, importBackupJSON } from '../../services/storage';

export const DEFAULT_TAB_STORAGE_KEY = 'edcalendar_default_tab';

export function getStoredDefaultTab() {
  try {
    const saved = localStorage.getItem(DEFAULT_TAB_STORAGE_KEY);
    if (saved === 'timetable' || saved === 'calendar' || saved === 'summary') {
      return saved;
    }
  } catch {
    // Ignore storage error
  }
  return 'timetable';
}

export default function SettingsModal({
  isOpen,
  onClose,
  theme,
  setTheme,
  defaultTab,
  onChangeDefaultTab,
  periods,
  onSavePeriods,
  allData = {},
  onDataImported,
  onResetData,
  onForceSyncCloud,
  syncStatus = 'saved',
  user = null,
}) {
  const [activeSection, setActiveSection] = useState('general'); // 'general' | 'periods' | 'backup'
  const [periodList, setPeriodList] = useState(() => periods || getStoredPeriods());
  const [signatures, setSignatures] = useState(() => getStoredSignatures());
  const [selectedDefaultTab, setSelectedDefaultTab] = useState(() => defaultTab || getStoredDefaultTab());
  const [statusBanner, setStatusBanner] = useState(null); // { success: boolean, message: string }
  const [isSyncingNow, setIsSyncingNow] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setPeriodList(periods || getStoredPeriods());
      setSignatures(getStoredSignatures());
      setSelectedDefaultTab(defaultTab || getStoredDefaultTab());
      setStatusBanner(null);
    }
  }, [isOpen, periods, defaultTab]);

  if (!isOpen) return null;

  const handlePeriodTimeChange = (index, field, value) => {
    const updated = [...periodList];
    updated[index] = { ...updated[index], [field]: value };
    setPeriodList(updated);
  };

  const handleResetPeriods = () => {
    if (confirm('คุณต้องการรีเซ็ตเวลาคาบเรียนและผู้ลงนามเป็นค่ามาตรฐานเริ่มต้นใช่หรือไม่?')) {
      setPeriodList(DEFAULT_PERIODS);
      setSignatures(DEFAULT_SIGNATURES);
    }
  };

  const handleSignatureChange = (index, field, value) => {
    const updated = [...signatures];
    updated[index] = { ...updated[index], [field]: value };
    setSignatures(updated);
  };

  const handleSelectDefaultTab = (tabValue) => {
    setSelectedDefaultTab(tabValue);
    try {
      localStorage.setItem(DEFAULT_TAB_STORAGE_KEY, tabValue);
    } catch {
      // Ignore storage error
    }
    if (onChangeDefaultTab) {
      onChangeDefaultTab(tabValue);
    }
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    saveStoredPeriods(periodList);
    saveStoredSignatures(signatures);
    if (onSavePeriods) {
      onSavePeriods(periodList);
    }
    setStatusBanner({
      success: true,
      message: 'บันทึกการตั้งค่าระบบและเวลาคาบเรียนเรียบร้อยแล้ว!',
    });
  };

  const handleSyncNow = async () => {
    if (!onForceSyncCloud) return;
    setIsSyncingNow(true);
    setStatusBanner(null);
    try {
      await onForceSyncCloud();
      setStatusBanner({
        success: true,
        message: 'ซิงค์ข้อมูลล่าสุดกับ Cloud สำเร็จเรียบร้อยแล้ว!',
      });
    } catch {
      setStatusBanner({
        success: false,
        message: 'ไม่สามารถซิงค์กับ Cloud ได้ในขณะนี้',
      });
    } finally {
      setIsSyncingNow(false);
    }
  };

  const handleExport = () => {
    exportBackupJSON(allData);
    setStatusBanner({
      success: true,
      message: 'ดาวน์โหลดไฟล์สำรองข้อมูล (.json) เรียบร้อยแล้ว',
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const res = importBackupJSON(content);
        if (res.success) {
          setStatusBanner({
            success: true,
            message: 'นำเข้าและกู้คืนข้อมูลสำเร็จเรียบร้อย!',
          });
          if (onDataImported) onDataImported(res.data);
        } else {
          setStatusBanner({
            success: false,
            message: res.error || 'ไฟล์สำรองข้อมูลไม่ถูกต้อง',
          });
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetAllData = () => {
    if (
      confirm(
        'คุณต้องการล้างข้อมูลตารางสอนและปฏิทินทั้งหมดเพื่อเริ่มต้นใหม่ใช่หรือไม่? การกระทำนี้จะแทนที่ข้อมูลปัจจุบันของคุณ'
      )
    ) {
      if (onResetData) onResetData();
      setStatusBanner({
        success: true,
        message: 'ล้างข้อมูลตารางสอนกลับสู่ค่าเริ่มต้นเรียบร้อยแล้ว',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                ตั้งค่าระบบ (Settings)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ปรับแต่งการแสดงผล เวลาคาบเรียน เอกสารพิมพ์ และการสำรองข้อมูล
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="px-6 pt-3 pb-0 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto bg-slate-50/60 dark:bg-slate-800/30">
          <button
            type="button"
            onClick={() => {
              setActiveSection('general');
              setStatusBanner(null);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeSection === 'general'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>การแสดงผล & ทั่วไป</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSection('periods');
              setStatusBanner(null);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeSection === 'periods'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>เวลาคาบเรียน & ผู้ลงนาม</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSection('backup');
              setStatusBanner(null);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeSection === 'backup'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>ซิงค์คลาวด์ & สำรองข้อมูล</span>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSaveSettings} className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm flex-1">
          {statusBanner && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                statusBanner.success
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
              }`}
            >
              {statusBanner.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusBanner.message}</span>
            </div>
          )}

          {/* TAB 1: GENERAL & APPEARANCE */}
          {activeSection === 'general' && (
            <div className="space-y-5">
              {/* Theme Switcher */}
              <div className="space-y-2.5">
                <label className="block font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  1. โหมดสีของแอป (Appearance Theme)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`flex items-center justify-center gap-2.5 p-3.5 rounded-xl border text-xs font-semibold transition-all ${
                      theme === 'light'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-400 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>โหมดสว่าง (Light Mode)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`flex items-center justify-center gap-2.5 p-3.5 rounded-xl border text-xs font-semibold transition-all ${
                      theme === 'dark'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-400 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Moon className="w-4 h-4 text-indigo-400" />
                    <span>โหมดมืด (Dark Mode)</span>
                  </button>
                </div>
              </div>

              {/* Default Landing Tab */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <label className="block font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  2. หน้าแรกเมื่อเข้าสู่ระบบ (Default Landing Page)
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  เลือกหน้าที่ต้องการให้ระบบเปิดขึ้นมาเป็นหน้าแรกทุกครั้งที่เข้าใช้งาน
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'timetable', label: 'ตารางสอนประจำสัปดาห์' },
                    { id: 'calendar', label: 'ปฏิทินการสอน' },
                    { id: 'summary', label: 'สรุปผลการสอน' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectDefaultTab(item.id)}
                      className={`p-3 rounded-xl border text-xs font-medium text-center transition-all ${
                        selectedDefaultTab === item.id
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-400 dark:text-indigo-300 font-semibold'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PERIOD TIMES & PRINT SIGNATURES */}
          {activeSection === 'periods' && (
            <div className="space-y-5">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    1. ช่วงเวลาคาบเรียน (คาบ 1–8 และพักเที่ยง)
                  </label>
                  <button
                    type="button"
                    onClick={handleResetPeriods}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>คืนค่าเริ่มต้น</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {periodList.map((p, idx) => {
                    const isLunch = p.isLunch;
                    return (
                      <div
                        key={p.period}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                          isLunch
                            ? 'sm:col-span-2 bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold">
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${
                              isLunch
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                                : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                            }`}
                          >
                            {isLunch ? 'พัก' : p.label}
                          </span>
                          <span className="text-slate-800 dark:text-slate-200">
                            {isLunch ? 'เวลาพักเที่ยง' : `คาบที่ ${p.label}`}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <input
                            type="time"
                            value={p.startTime}
                            onChange={(e) => handlePeriodTimeChange(idx, 'startTime', e.target.value)}
                            className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                            required
                          />
                          <span className="text-slate-400">-</span>
                          <input
                            type="time"
                            value={p.endTime}
                            onChange={(e) => handlePeriodTimeChange(idx, 'endTime', e.target.value)}
                            className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                            required
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Signatures Configuration */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <label className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <FileSignature className="w-3.5 h-3.5 text-indigo-500" />
                  2. รายชื่อผู้ลงนามท้ายเอกสารตารางสอน (3 ตำแหน่ง)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {signatures.map((sig, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5"
                    >
                      <span className="text-[11px] font-semibold text-slate-500">
                        ผู้ลงนามที่ {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={sig.name}
                        onChange={(e) => handleSignatureChange(idx, 'name', e.target.value)}
                        placeholder="ชื่อ-นามสกุล"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        value={sig.title}
                        onChange={(e) => handleSignatureChange(idx, 'title', e.target.value)}
                        placeholder="ตำแหน่ง"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-600 dark:text-slate-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CLOUD SYNC & BACKUP */}
          {activeSection === 'backup' && (
            <div className="space-y-4">
              {/* Cloud Sync Section */}
              {user && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <Cloud className="w-4 h-4 text-emerald-500" />
                      <span>การซิงค์ข้อมูลออนไลน์ (Cloud Firestore Sync)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      สถานะปัจจุบัน:{' '}
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {syncStatus === 'saving' ? 'กำลังซิงค์...' : 'ซิงค์เป็นปัจจุบันแล้ว'}
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSyncNow}
                    disabled={isSyncingNow}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingNow ? 'animate-spin' : ''}`} />
                    <span>{isSyncingNow ? 'กำลังซิงค์...' : 'ซิงค์ข้อมูลเดี๋ยวนี้'}</span>
                  </button>
                </div>
              )}

              {/* Export & Import JSON */}
              <div className="space-y-2.5">
                <label className="block font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  สำรองและกู้คืนข้อมูลด้วยไฟล์ (.JSON)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleExport}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>ดาวน์โหลดไฟล์สำรองข้อมูล (Export)</span>
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".json"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-all"
                  >
                    <Upload className="w-4 h-4 text-indigo-500" />
                    <span>นำเข้าข้อมูลจากไฟล์ (Import)</span>
                  </button>
                </div>
              </div>

              {/* Danger Zone: Reset Data */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-rose-700 dark:text-rose-300 text-xs">
                      ล้างข้อมูลตารางสอนทั้งหมด (Reset Data)
                    </div>
                    <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80">
                      ลบข้อมูลภาคเรียน รายวิชา และคาบสอนปัจจุบันเพื่อเริ่มต้นจัดตารางใหม่
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetAllData}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ล้างข้อมูลทั้งหมด</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              ปิดหน้าต่าง
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-500/20 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกการตั้งค่า</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
