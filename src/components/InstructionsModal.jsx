import React from 'react';
import { X, CheckCircle, AlertTriangle, Keyboard, Calculator, ShieldCheck } from 'lucide-react';

export default function InstructionsModal({ isOpen, onClose, onStartMock }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 to-sky-700 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={22} />
            <div>
              <h2 className="font-extrabold text-lg">JAMB UTME & WASSCE Exam Guidelines</h2>
              <p className="text-xs text-sky-100">Official Computer-Based Testing Instructions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg transition text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-sm">
          {/* Section 1: Official Keyboard Shortcuts */}
          <div className="space-y-3">
            <h3 className="font-bold text-white flex items-center gap-2 text-base">
              <Keyboard className="text-sky-400" size={18} />
              <span>Standard 8-Key Keyboard Controls</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              At official JAMB Computer-Based Testing Centers, candidates can navigate and answer questions without touching the mouse:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center gap-2.5">
                <span className="px-2 py-1 bg-slate-900 rounded font-mono font-bold text-sky-400">A, B, C, D</span>
                <span className="text-slate-300">Select option A, B, C, or D</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center gap-2.5">
                <span className="px-2 py-1 bg-slate-900 rounded font-mono font-bold text-sky-400">N</span>
                <span className="text-slate-300">Next Question</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center gap-2.5">
                <span className="px-2 py-1 bg-slate-900 rounded font-mono font-bold text-sky-400">P</span>
                <span className="text-slate-300">Previous Question</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center gap-2.5">
                <span className="px-2 py-1 bg-slate-900 rounded font-mono font-bold text-amber-400">R</span>
                <span className="text-slate-300">Flag for Review</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center gap-2.5">
                <span className="px-2 py-1 bg-slate-900 rounded font-mono font-bold text-emerald-400">S</span>
                <span className="text-slate-300">Submit Exam Confirmation</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center gap-2.5">
                <span className="px-2 py-1 bg-slate-900 rounded font-mono font-bold text-sky-400">C</span>
                <span className="text-slate-300">Toggle JAMB Calculator</span>
              </div>
            </div>
          </div>

          {/* Section 2: Question Palette Color Coding */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h3 className="font-bold text-white text-base">Question Palette Color Guide</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-sky-950/40 border border-sky-500/40 rounded-xl space-y-1">
                <div className="flex items-center gap-2 font-bold text-sky-400">
                  <span className="w-3 h-3 rounded bg-sky-600"></span>
                  <span>Sky Blue</span>
                </div>
                <p className="text-slate-300 text-[11px]">The question has been answered and recorded.</p>
              </div>

              <div className="p-3 bg-amber-950/30 border border-amber-500/40 rounded-xl space-y-1">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <span className="w-3 h-3 rounded bg-amber-500"></span>
                  <span>Amber Orange</span>
                </div>
                <p className="text-slate-300 text-[11px]">Flagged for review. Return to this before submitting.</p>
              </div>

              <div className="p-3 bg-slate-800/60 border border-slate-700 rounded-xl space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-300">
                  <span className="w-3 h-3 rounded bg-slate-700"></span>
                  <span>Slate Gray</span>
                </div>
                <p className="text-slate-300 text-[11px]">Unanswered or skipped question.</p>
              </div>
            </div>
          </div>

          {/* Section 3: Scoring & Negative Marking Rules */}
          <div className="space-y-3 pt-4 border-t border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed">
            <h3 className="font-bold text-white text-base">Rules & Exam Conditions</h3>
            <ul className="list-disc list-inside space-y-1.5 text-slate-300">
              <li><strong className="text-white">Zero Negative Marking:</strong> There is no penalty for guessing. Attempt all questions before submitting.</li>
              <li><strong className="text-white">Mandatory English Subject:</strong> All UTME candidates must take Use of English (60 questions in official UTME) plus 3 chosen electives (40 questions each), totalling 180 questions in 120 minutes.</li>
              <li><strong className="text-white">Auto-Submission:</strong> Once the countdown reaches 00:00:00, the system automatically finalizes and scores your test.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950/80 px-6 py-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              onStartMock();
            }}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/30 transition"
          >
            Start 4-Subject Mock Now
          </button>
        </div>
      </div>
    </div>
  );
}
