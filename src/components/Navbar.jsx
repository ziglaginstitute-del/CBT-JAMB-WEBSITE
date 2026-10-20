import React from 'react';
import { GraduationCap, Timer, BookOpen, History, HelpCircle, Sparkles } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenInstructions, onStartExamModal }) {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            onClick={() => setActiveTab('practice')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-white font-mono">
                  Prep<span className="text-sky-400">CBT</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded">
                  UTME & WASSCE
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Standard Computer-Based Test Portal</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('practice')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'practice'
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BookOpen size={16} />
              <span className="hidden md:inline">Untimed Practice</span>
              <span className="md:hidden">Practice</span>
            </button>

            <button
              onClick={onStartExamModal}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Timer size={16} />
              <span className="hidden sm:inline">4-Subject Mock Exam</span>
              <span className="sm:hidden">Mock Exam</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
              title="Test Score History"
            >
              <History size={16} />
              <span className="hidden lg:inline">Past Mock History</span>
            </button>

            <button
              onClick={onOpenInstructions}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
              title="Keyboard Shortcuts & Exam Instructions"
            >
              <HelpCircle size={18} />
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
