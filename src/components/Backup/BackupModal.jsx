import React, { useRef, useState } from 'react';
import { X, Download, Upload, RotateCcw, Database, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { exportBackupJSON, importBackupJSON } from '../../services/storage';

export default function BackupModal({
  isOpen,
  onClose,
  allData,
  onDataImported,
  onResetData,
}) {
  const fileInputRef = useRef(null);
  const [importStatus, setImportStatus] = useState(null); // { success: boolean, message: string }

  if (!isOpen) return null;

  const handleExport = () => {
    exportBackupJSON(allData);
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
          setImportStatus({ success: true, message: 'กู้คืนข้อมูลสำเร็จเรียบร้อย!' });
          onDataImported(res.data);
          setTimeout(() => {
            setImportStatus(null);
            onClose();
          }, 1500);
        } else {
          setImportStatus({ success: false, message: res.error || 'ไฟล์ไม่ถูกต้อง' });
        }
      }
    };
    reader.readAsText(file);
    // Reset file input value
    e.target.value = '';
  };

  const handleReset = () => {
    if (confirm('คุณต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็น "ข้อมูลตัวอย่างเริ่มต้น" หรือไม่? ข้อมูลที่คุณแก้ไขไว้จะถูกแทนที่')) {
      onResetData();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                สำรองและกู้คืนข้อมูล
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ข้อมูลบันทึกในเครื่องเบราว์เซอร์ของคุณแบบ Local-first
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

        {/* Content */}
        <div className="p-6 space-y-4">
          
          {/* Status message */}
          {importStatus && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
              importStatus.success
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
            }`}>
              {importStatus.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
              <span>{importStatus.message}</span>
            </div>
          )}

          {/* Privacy Note */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              ข้อมูลของคุณจะถูกเก็บอยู่ในเครื่องนี้เท่านั้น ไม่มีการส่งขึ้นเซิร์ฟเวอร์ภายนอก เพื่อความปลอดภัยและเป็นส่วนตัว 100%
            </div>
          </div>

          {/* Current Data summary */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="font-bold text-base text-slate-800 dark:text-slate-200">{allData.subjects?.length || 0}</div>
              <div className="text-slate-500 text-[11px]">รายวิชา</div>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="font-bold text-base text-slate-800 dark:text-slate-200">{allData.slots?.length || 0}</div>
              <div className="text-slate-500 text-[11px]">คาบในตาราง</div>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="font-bold text-base text-slate-800 dark:text-slate-200">{allData.overrides?.length || 0}</div>
              <div className="text-slate-500 text-[11px]">บันทึกเฉพาะวัน</div>
            </div>
          </div>

          {/* Export Button */}
          <div className="pt-2 space-y-2.5">
            <button
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-md shadow-indigo-500/20 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลดไฟล์สำรองข้อมูล (Export JSON)</span>
            </button>

            {/* Import Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium transition-all"
            >
              <Upload className="w-4 h-4 text-indigo-500" />
              <span>นำเข้าข้อมูลจากไฟล์ (Import JSON)</span>
            </button>

            {/* Reset to Default */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 dark:hover:text-rose-400 hover:underline"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>รีเซ็ตข้อมูลเป็นตัวอย่างเริ่มต้น</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
