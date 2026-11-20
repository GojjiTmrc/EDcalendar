import React, { useState, useMemo } from 'react';
import { X, ClipboardPaste, FileSpreadsheet, ArrowRight, ArrowLeft, Check, Trash2, AlertTriangle } from 'lucide-react';
import {
  COLUMN_ROLES,
  parseDelimitedText,
  normalizeRows,
  detectHeaderRow,
  guessColumnsFromHeader,
  guessColumnsFromData,
  buildStudents,
  findDuplicateNames,
  fullDisplayName,
} from '../../utils/rosterUtils';
import { loadSavedMapping, saveMapping } from '../../utils/rosterStorage';

const PREVIEW_ROWS = 8;

function headerSignature(row) {
  return (row || []).map((c) => String(c || '').trim().toLowerCase()).join('|');
}

async function decodeTextFile(file) {
  const buf = await file.arrayBuffer();
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch {
    // Thai Windows CSV exports are often TIS-620 / Windows-874
    return new TextDecoder('windows-874').decode(buf);
  }
}

/**
 * Import wizard: 1) paste or choose a file  2) map columns  3) preview and confirm
 * onImport(students, mode)  mode: 'replace' | 'append'
 */
export default function RosterImportWizard({ isOpen, classGroup, existingCount = 0, onImport, onClose }) {
  const [step, setStep] = useState('source'); // 'source' | 'map' | 'preview'
  const [sourceTab, setSourceTab] = useState('paste'); // 'paste' | 'file'
  const [pasteText, setPasteText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [sheets, setSheets] = useState([]); // [{ sheet, data }]
  const [sheetIndex, setSheetIndex] = useState(0);
  const [rows, setRows] = useState([]);
  const [headerRowIndex, setHeaderRowIndex] = useState(-1);
  const [roles, setRoles] = useState([]);
  const [stripPrefixes, setStripPrefixes] = useState(true);
  const [splitFullNames, setSplitFullNames] = useState(true);

  const [students, setStudents] = useState([]);
  const [mode, setMode] = useState('replace');

  const resetAll = () => {
    setStep('source');
    setSourceTab('paste');
    setPasteText('');
    setError('');
    setBusy(false);
    setSheets([]);
    setSheetIndex(0);
    setRows([]);
    setHeaderRowIndex(-1);
    setRoles([]);
    setStudents([]);
    setMode('replace');
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  // Set rows + automatically detect header row and column roles (or reuse a remembered mapping)
  const applyRows = (rawRows) => {
    const clean = normalizeRows(rawRows);
    if (clean.length === 0) {
      setError('ไม่พบข้อมูลในไฟล์/ข้อความที่ใส่มา');
      return false;
    }
    const detected = detectHeaderRow(clean);
    let nextRoles;
    let nextHeader = detected;
    if (detected >= 0) {
      const sig = headerSignature(clean[detected]);
      const saved = loadSavedMapping(sig);
      nextRoles =
        saved && saved.roles?.length === clean[detected].length
          ? saved.roles
          : guessColumnsFromHeader(clean[detected]);
    } else {
      nextRoles = guessColumnsFromData(clean);
      nextHeader = -1;
    }
    setRows(clean);
    setHeaderRowIndex(nextHeader);
    setRoles(nextRoles);
    setError('');
    setStep('map');
    return true;
  };

  const handlePasteNext = () => {
    if (!pasteText.trim()) {
      setError('กรุณาวางรายชื่อก่อน');
      return;
    }
    setSheets([]);
    applyRows(parseDelimitedText(pasteText));
  };

  const handleFile = async (file) => {
    if (!file) return;
    setError('');
    setBusy(true);
    try {
      const lower = file.name.toLowerCase();
      if (lower.endsWith('.xlsx')) {
        const { default: readExcelFile } = await import('read-excel-file/browser');
        const result = await readExcelFile(file);
        const list = Array.isArray(result) ? result : [{ sheet: 'Sheet1', data: result }];
        const nonEmpty = list.filter((s) => (s.data || []).length > 0);
        if (nonEmpty.length === 0) {
          setError('ไฟล์ Excel นี้ไม่มีข้อมูล');
        } else {
          setSheets(nonEmpty);
          setSheetIndex(0);
          applyRows(nonEmpty[0].data);
        }
      } else if (lower.endsWith('.xls')) {
        setError('ยังไม่รองรับไฟล์ .xls แบบเก่า กรุณาเปิดใน Excel แล้วบันทึกเป็น .xlsx หรือ .csv ก่อน');
      } else if (lower.endsWith('.csv') || lower.endsWith('.txt') || lower.endsWith('.tsv')) {
        setSheets([]);
        applyRows(parseDelimitedText(await decodeTextFile(file)));
      } else {
        setError('รองรับเฉพาะไฟล์ .xlsx, .csv, .txt');
      }
    } catch (err) {
      console.error(err);
      setError('อ่านไฟล์ไม่สำเร็จ กรุณาตรวจสอบว่าไฟล์ไม่เสียหายหรือมีรหัสผ่าน');
    } finally {
      setBusy(false);
    }
  };

  const handleChangeSheet = (idx) => {
    setSheetIndex(idx);
    applyRows(sheets[idx].data);
  };

  const handleChangeHeaderRow = (idx) => {
    setHeaderRowIndex(idx);
    if (idx >= 0) {
      setRoles(guessColumnsFromHeader(rows[idx]));
    } else {
      setRoles(guessColumnsFromData(rows));
    }
  };

  const handleChangeRole = (colIdx, role) => {
    setRoles((prev) =>
      prev.map((r, i) => {
        if (i === colIdx) return role;
        // each role can be used by one column only (except "ignore")
        return role !== 'ignore' && r === role ? 'ignore' : r;
      })
    );
  };

  const hasNameColumn = roles.includes('firstName') || roles.includes('fullName');

  const handleToPreview = () => {
    if (!hasNameColumn) {
      setError('กรุณาเลือกคอลัมน์ "ชื่อ" หรือ "ชื่อ-นามสกุล" อย่างน้อย 1 คอลัมน์');
      return;
    }
    const built = buildStudents(rows, roles, { headerRowIndex, stripPrefixes, splitFullNames });
    if (built.length === 0) {
      setError('ไม่พบรายชื่อที่นำเข้าได้ ลองตรวจสอบแถวหัวตารางและคอลัมน์อีกครั้ง');
      return;
    }
    if (headerRowIndex >= 0) {
      saveMapping(headerSignature(rows[headerRowIndex]), { roles });
    }
    setError('');
    setStudents(built);
    setMode(existingCount > 0 ? 'append' : 'replace');
    setStep('preview');
  };

  const duplicates = useMemo(() => findDuplicateNames(students), [students]);

  const handleConfirm = () => {
    if (students.length === 0) return;
    onImport(students, mode);
    handleClose();
  };

  if (!isOpen) return null;

  const previewRows = rows.slice(0, Math.max(headerRowIndex + 1 + PREVIEW_ROWS, PREVIEW_ROWS));
  const width = rows[0]?.length || 0;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              นำเข้ารายชื่อนักเรียน {classGroup ? `ห้อง ${classGroup}` : ''}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-[11px] font-semibold">
              {[
                ['source', '1. เลือกข้อมูล'],
                ['map', '2. จัดคอลัมน์'],
                ['preview', '3. ตรวจและยืนยัน'],
              ].map(([key, label]) => (
                <span
                  key={key}
                  className={`px-2 py-0.5 rounded-full ${
                    step === key
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="ปิด"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: SOURCE */}
          {step === 'source' && (
            <div className="space-y-4">
              <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setSourceTab('paste')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                    sourceTab === 'paste'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-300 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  วางจากคลิปบอร์ด
                </button>
                <button
                  type="button"
                  onClick={() => setSourceTab('file')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                    sourceTab === 'file'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-300 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  อัปโหลดไฟล์ Excel / CSV
                </button>
              </div>

              {sourceTab === 'paste' ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    คัดลอกจาก Excel / Google Sheets แล้ววางที่นี่ได้เลย (จะคัดลอกทั้งตารางหรือคอลัมน์เดียวก็ได้) หรือพิมพ์ชื่อทีละบรรทัด
                  </p>
                  <textarea
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    rows={10}
                    placeholder={'ตัวอย่าง:\n1\tเด็กชายสมชาย ใจดี\n2\tเด็กหญิงสมหญิง รักเรียน'}
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    รองรับ .xlsx, .csv, .txt (ไฟล์ Excel เก่า .xls ให้บันทึกเป็น .xlsx ก่อน) ถ้ามีหลายชีตจะให้เลือกในขั้นถัดไป
                  </p>
                  <label className="flex flex-col items-center justify-center gap-2 py-10 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:border-indigo-400 transition-colors">
                    <FileSpreadsheet className="w-8 h-8 text-indigo-500" />
                    <span className="font-semibold">{busy ? 'กำลังอ่านไฟล์...' : 'คลิกเพื่อเลือกไฟล์'}</span>
                    <input
                      type="file"
                      accept=".xlsx,.csv,.txt,.tsv"
                      className="hidden"
                      disabled={busy}
                      onChange={(e) => {
                        handleFile(e.target.files?.[0]);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: MAP COLUMNS */}
          {step === 'map' && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                {sheets.length > 1 && (
                  <label className="space-y-1">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">ชีต (Sheet)</span>
                    <select
                      value={sheetIndex}
                      onChange={(e) => handleChangeSheet(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                    >
                      {sheets.map((s, i) => (
                        <option key={s.sheet + i} value={i}>
                          {s.sheet} ({s.data.length} แถว)
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label className="space-y-1">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">แถวหัวตาราง</span>
                  <select
                    value={headerRowIndex}
                    onChange={(e) => handleChangeHeaderRow(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                  >
                    <option value={-1}>ไม่มีหัวตาราง (ข้อมูลเริ่มแถวแรก)</option>
                    {rows.slice(0, 20).map((r, i) => (
                      <option key={i} value={i}>
                        แถวที่ {i + 1}: {r.filter(Boolean).slice(0, 3).join(' | ') || '(ว่าง)'}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                ระบบเดาคอลัมน์ให้แล้ว ตรวจสอบและเลือกชนิดข้อมูลของแต่ละคอลัมน์ด้านล่างได้ตามต้องการ
              </p>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60">
                      {Array.from({ length: width }).map((_, c) => (
                        <th key={c} className="p-2 min-w-[150px] align-top text-left">
                          <select
                            value={roles[c] || 'ignore'}
                            onChange={(e) => handleChangeRole(c, e.target.value)}
                            className={`w-full px-2 py-1.5 rounded-lg border text-xs font-semibold ${
                              (roles[c] || 'ignore') === 'ignore'
                                ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                                : 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-200'
                            }`}
                          >
                            {COLUMN_ROLES.map((r) => (
                              <option key={r.value} value={r.value}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {previewRows.map((r, i) => {
                      const isHeader = i === headerRowIndex;
                      const isSkipped = i < headerRowIndex;
                      return (
                        <tr
                          key={i}
                          className={
                            isHeader
                              ? 'bg-indigo-50/70 dark:bg-indigo-950/30 font-bold'
                              : isSkipped
                              ? 'opacity-40'
                              : ''
                          }
                        >
                          {r.map((cell, c) => (
                            <td key={c} className="px-2 py-1.5 text-slate-700 dark:text-slate-200 whitespace-nowrap">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600 dark:text-slate-300">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={stripPrefixes} onChange={(e) => setStripPrefixes(e.target.checked)} />
                  แยกคำนำหน้า (เด็กชาย/นาย/นางสาว ...) ออกจากชื่อ
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={splitFullNames} onChange={(e) => setSplitFullNames(e.target.checked)} />
                  แยกชื่อ-นามสกุลที่อยู่ช่องเดียวกัน
                </label>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW */}
          {step === 'preview' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  พบรายชื่อ {students.length} คน
                </div>
                {existingCount > 0 && (
                  <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setMode('append')}
                      className={`px-3 py-1.5 rounded-lg ${mode === 'append' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-300 shadow-xs' : 'text-slate-500'}`}
                    >
                      เพิ่มต่อจากเดิม ({existingCount} คน)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('replace')}
                      className={`px-3 py-1.5 rounded-lg ${mode === 'replace' ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-300 shadow-xs' : 'text-slate-500'}`}
                    >
                      แทนที่รายชื่อเดิมทั้งหมด
                    </button>
                  </div>
                )}
              </div>

              {duplicates.length > 0 && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>พบชื่อซ้ำ: {duplicates.join(', ')} (ลบแถวที่ไม่ต้องการออกได้ด้านล่าง)</span>
                </div>
              )}

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 max-h-80 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="p-2 text-left w-14">เลขที่</th>
                      <th className="p-2 text-left">ชื่อ-นามสกุล</th>
                      <th className="p-2 text-left">ชื่อเล่น</th>
                      <th className="p-2 text-left">รหัส</th>
                      <th className="p-2 w-10" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {students.map((s) => (
                      <tr key={s.id}>
                        <td className="p-2 text-slate-600 dark:text-slate-300">{s.number}</td>
                        <td className="p-2 font-medium text-slate-900 dark:text-slate-100">{fullDisplayName(s)}</td>
                        <td className="p-2 text-slate-600 dark:text-slate-300">{s.nickname}</td>
                        <td className="p-2 text-slate-500">{s.studentCode}</td>
                        <td className="p-2 text-right">
                          <button
                            type="button"
                            onClick={() => setStudents((prev) => prev.filter((x) => x.id !== s.id))}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="ลบแถวนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-slate-400">
                หลังนำเข้าแล้ว แก้ไขรายละเอียดรายคนได้ในหน้ารายชื่อนักเรียน
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-slate-100 dark:border-slate-800">
          <div>
            {step !== 'source' && (
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setStep(step === 'preview' ? 'map' : 'source');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                ย้อนกลับ
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              ยกเลิก
            </button>
            {step === 'source' && sourceTab === 'paste' && (
              <button
                type="button"
                onClick={handlePasteNext}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
              >
                ถัดไป
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            {step === 'map' && (
              <button
                type="button"
                onClick={handleToPreview}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
              >
                ดูตัวอย่าง
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            {step === 'preview' && (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={students.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold"
              >
                <Check className="w-3.5 h-3.5" />
                นำเข้า {students.length} คน
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
