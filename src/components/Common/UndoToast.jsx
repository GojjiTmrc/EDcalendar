import React, { useEffect } from 'react';
import { Undo2, X } from 'lucide-react';

/** Bottom toast offering to undo the last destructive action. Auto-dismisses after `duration` ms. */
export default function UndoToast({ toast, onUndo, onDismiss, duration = 8000 }) {
  const toastId = toast?.id;
  useEffect(() => {
    if (!toastId) return undefined;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [toastId, onDismiss, duration]);

  if (!toast) return null;
  return (
    <div
      role="status"
      className="fixed left-1/2 -translate-x-1/2 bottom-24 md:bottom-6 z-[90] flex items-center gap-3 pl-4 pr-2 py-2.5 rounded-xl bg-slate-900 text-white text-sm shadow-2xl border border-slate-700 no-print"
    >
      <span>{toast.label}</span>
      <button
        type="button"
        onClick={onUndo}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 font-semibold text-xs"
      >
        <Undo2 className="w-3.5 h-3.5" /> เลิกทำ
      </button>
      <button type="button" onClick={onDismiss} aria-label="ปิด" className="p-1 rounded-md hover:bg-slate-700">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
