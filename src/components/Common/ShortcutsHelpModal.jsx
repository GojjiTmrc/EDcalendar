import React, { useEffect } from 'react';
import { Keyboard, X } from 'lucide-react';

const SHORTCUT_GROUPS = [
  {
    title: 'ทั่วทั้งระบบ',
    items: [
      ['1', 'หน้า "วันนี้"'],
      ['2', 'ตารางสอนประจำสัปดาห์'],
      ['3', 'ปฏิทินการสอน'],
      ['4', 'สรุปผลการสอน'],
      ['N', 'เพิ่มบันทึกสั้น / งานที่สั่ง'],
      ['R', 'รายชื่อนักเรียน'],
      ['S', 'รายวิชา'],
      ['F', 'เปิดนาฬิกาเต็มจอ'],
      ['?', 'แสดงหน้าต่างนี้'],
    ],
  },
  {
    title: 'ในโหมดนาฬิกาเต็มจอ',
    items: [
      ['Space', 'เริ่ม / หยุดตัวจับเวลากิจกรรม'],
      ['G', 'เปิดสุ่มชื่อ / แบ่งกลุ่ม'],
      ['Esc', 'ปิดหน้าต่างที่เปิดอยู่ หรือออกจากเต็มจอ'],
    ],
  },
  {
    title: 'ป๊อปอัพต่าง ๆ',
    items: [['Esc', 'ปิดป๊อปอัพ'], ['1 – 5', 'เลือกอารมณ์ในหน้าถาม mood หลังสอน']],
  },
];

export default function ShortcutsHelpModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-indigo-500" /> ปุ่มลัด
          </h3>
          <button type="button" onClick={onClose} aria-label="ปิด" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                {group.title}
              </div>
              <ul className="space-y-1">
                {group.items.map(([key, desc]) => (
                  <li key={key + desc} className="flex items-center justify-between text-sm gap-3">
                    <span className="text-slate-700 dark:text-slate-200">{desc}</span>
                    <kbd className="px-2 py-0.5 rounded-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-700 dark:text-slate-200 shrink-0">
                      {key}
                    </kbd>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            ปุ่มลัดจะไม่ทำงานตอนกำลังพิมพ์ในช่องข้อความ หรือเมื่อมีป๊อปอัพเปิดอยู่
          </p>
        </div>
      </div>
    </div>
  );
}
