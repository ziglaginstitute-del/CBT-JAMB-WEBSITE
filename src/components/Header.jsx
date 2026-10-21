import React from 'react';
import { 
  GraduationCap, BookOpen, History, 
  HelpCircle, Key, Layers, Calendar, Lock, LogOut, ShieldCheck, 
  Users, BarChart3, ShieldAlert 
} from 'lucide-react';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  onOpenInstructions, 
  isAdminAuthenticated = false,
  onLockAdminSession,
  onOpenAdminAuth
}) {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-md">
      {/* High-Security Admin Active Banner */}
      {isAdminAuthenticated && (
        <div className="bg-gradient-to-r from-amber-500/20 via-sky-500/20 to-amber-500/20 border-b border-amber-500/30 px-4 py-1.5 text-xs text-amber-200">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className="font-mono font-bold tracking-wider text-amber-300 uppercase text-[11px] sm:text-xs">
                [ADMINISTRATOR SESSION ACTIVE — PRIVILEGED ACCESS GRANTED]
              </span>
            </div>

            <button
              onClick={onLockAdminSession}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/20 hover:bg-rose-500 hover:text-white border border-amber-500/40 hover:border-rose-500 text-amber-300 font-bold text-[11px] transition shadow-sm"
              title="Immediately lock the admin portal and return to public candidate view"
            >
              <Lock size={12} />
              <span>LOCK / EXIT ADMIN SESSION</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Top Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            onClick={() => setActiveTab(isAdminAuthenticated ? 'candidates' : 'login')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-105 ${
              isAdminAuthenticated 
                ? 'bg-gradient-to-tr from-amber-600 to-amber-400 shadow-amber-500/20 ring-1 ring-amber-400/50' 
                : 'bg-gradient-to-tr from-sky-600 to-sky-400 shadow-sky-500/20'
            }`}>
              <GraduationCap size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-white font-mono">
                  Prep<span className={isAdminAuthenticated ? "text-amber-400" : "text-sky-400"}>CBT</span>
                </span>
                <span className={`px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded border ${
                  isAdminAuthenticated
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                }`}>
                  {isAdminAuthenticated ? 'Admin Console' : 'UTME & WASSCE'}
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                {isAdminAuthenticated ? 'Institutional Control & Examination Management' : 'Accredited Computer-Based Test Portal'}
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <nav className="flex items-center gap-1.5 sm:gap-2">
            
            {/* PUBLIC STUDENT VIEW: ONLY Candidate Login is visible */}
            {!isAdminAuthenticated ? (
              <>
                <button
                  onClick={() => setActiveTab('login')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all shadow-sm ${
                    activeTab === 'login'
                      ? 'bg-sky-500 text-white shadow-sky-500/30 ring-2 ring-sky-400'
                      : 'bg-sky-500/15 text-sky-400 border border-sky-500/30 hover:bg-sky-500/25'
                  }`}
                >
                  <Key size={15} />
                  <span>Candidate Portal</span>
                </button>

                <button
                  onClick={onOpenInstructions}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                  title="Keyboard Shortcuts & Examination Guidelines"
                >
                  <HelpCircle size={16} />
                  <span className="hidden sm:inline">Shortcuts</span>
                </button>
              </>
            ) : (
              /* PRIVILEGED ADMIN VIEW: Full administrative suite */
              <>
                {/* Candidate Manager */}
                <button
                  onClick={() => setActiveTab('candidates')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                    activeTab === 'candidates' || activeTab === 'candidate-manager'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                  title="Register candidates, assign subjects, print slips & manage passwords"
                >
                  <Users size={16} />
                  <span className="hidden md:inline">Candidates</span>
                </button>

                {/* Gradebook / Results Table */}
                <button
                  onClick={() => setActiveTab('candidate-results')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                    activeTab === 'candidate-results'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                  title="Master student gradebook & CSV exports"
                >
                  <BarChart3 size={16} />
                  <span className="hidden lg:inline">Gradebook</span>
                </button>

                {/* Question Bank */}
                <button
                  onClick={() => setActiveTab('question-bank')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                    activeTab === 'question-bank'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                  title="Manage questions, LaTeX equations & PDF Ingestion"
                >
                  <Layers size={16} />
                  <span className="hidden md:inline">Question Bank</span>
                </button>

                {/* Scheduled Exams */}
                <button
                  onClick={() => setActiveTab('scheduled-exams')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                    activeTab === 'scheduled-exams' || activeTab === 'scheduler'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                  title="Schedule Institutional Mocks & Time Windows"
                >
                  <Calendar size={16} />
                  <span className="hidden lg:inline">Mocks Scheduler</span>
                </button>

                {/* Preview Candidate Portal */}
                <button
                  onClick={() => setActiveTab('login')}
                  className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeTab === 'login'
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  title="Preview Candidate CBT Login Portal"
                >
                  <Key size={14} />
                  <span>Student View</span>
                </button>

                {/* Instructions */}
                <button
                  onClick={onOpenInstructions}
                  className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                  title="Keyboard Shortcuts & Exam Instructions"
                >
                  <HelpCircle size={18} />
                </button>

                {/* Direct One-Click Lock */}
                <button
                  onClick={onLockAdminSession}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white transition"
                  title="Lock and exit admin console"
                >
                  <LogOut size={15} />
                  <span className="hidden sm:inline">Lock</span>
                </button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
