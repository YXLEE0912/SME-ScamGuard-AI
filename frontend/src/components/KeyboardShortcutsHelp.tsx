import React, { useState } from "react";
import { Keyboard, X } from "lucide-react";

export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title="View keyboard triage shortcuts"
      >
        <Keyboard size={13} />
        <span>Shortcuts</span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100"
        >
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Keyboard size={16} className="text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Keyboard Ergonomics
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={16} />
              </button>
            </div>

            <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Triage and process accounts payable incidents without lifting your hands from the keyboard:
            </p>

            <div className="mt-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                <span className="text-slate-700 dark:text-slate-300">Next incident in queue</span>
                <kbd className="num px-2 py-0.5 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md">
                  J / ↓
                </kbd>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                <span className="text-slate-700 dark:text-slate-300">Previous incident</span>
                <kbd className="num px-2 py-0.5 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md">
                  K / ↑
                </kbd>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                <span className="text-slate-700 dark:text-slate-300">Approve / mark safe dialog</span>
                <kbd className="num px-2 py-0.5 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md">
                  A
                </kbd>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                <span className="text-slate-700 dark:text-slate-300">Block / escalate workflow</span>
                <kbd className="num px-2 py-0.5 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md">
                  X
                </kbd>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-700 dark:text-slate-300">Focus search bar</span>
                <kbd className="num px-2 py-0.5 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md">
                  Ctrl + K
                </kbd>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
              Note: Shortcuts are paused automatically while entering text into form inputs.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
export default KeyboardShortcutsHelp;

