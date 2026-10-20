import React from 'react';
import { 
  GraduationCap, Timer, BookOpen, History, 
  HelpCircle, Sparkles, Key, Layers, Calendar 
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  onOpenInstructions, 
  onStartExamModal,
  onOpenJoinPinModal 
}) {
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
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'practice'
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BookOpen size={16} />
              <span className="hidden md:inline">Practice</span>
            </button>

            {/* Candidate CBT Login Button */}
            <button
              onClick={() => setActiveTab('login')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all shadow-sm ${
                activeTab === 'login'
                  ? 'bg-sky-500 text-white shadow-sky-500/30 ring-2 ring-sky-400'
                  : 'bg-sky-500/15 text-sky-400 border border-sky-500/30 hover:bg-sky-500/25'
              }`}
              title="Official Candidate CBT Login with Reg No and Passcode"
            >
              <Key size={15} />
              <span>Candidate Login</span>
            </button>

            {/* Enter PIN Button */}
            <button
              onClick={onOpenJoinPinModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all shadow-sm"
              title="Enter 6-digit scheduled exam access PIN"
            >
              <Key size={15} />
              <span className="hidden sm:inline">Join with PIN</span>
              <span className="sm:hidden">PIN</span>
            </button>

            {/* 4-Subject Mock Launcher */}
            <button
              onClick={onStartExamModal}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Timer size={16} />
              <span>Mock</span>
            </button>

            {/* Admin: Candidates & Results */}
            <button
              onClick={() => setActiveTab('candidates')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'candidates'
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
              title="Candidate Registration, Slips & Gradebook"
            >
              <GraduationCap size={16} />
              <span className="hidden lg:inline">Candidates & Results</span>
            </button>

            {/* Admin: Question Bank */}
            <button
              onClick={() => setActiveTab('question-bank')}
              className={`hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'question-bank'
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
              title="Manage Question Bank & PDF Ingestion"
            >
              <Layers size={16} />
              <span>Question Bank</span>
            </button>

            {/* Admin: Scheduled Exams */}
            <button
              onClick={() => setActiveTab('scheduled-exams')}
              className={`hidden xl:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'scheduled-exams'
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
              title="Schedule Institutional Mocks & View Gradebook"
            >
              <Calendar size={16} />
              <span>Scheduled Exams</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`hidden xl:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
              title="Test Score History"
            >
              <History size={16} />
              <span>History</span>
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
