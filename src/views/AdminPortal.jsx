import React, { useState, useEffect } from 'react';
import { 
  Users, BookOpen, BarChart3, Calendar, Lock, Unlock, 
  Usb, HardDrive, ShieldCheck, Monitor, Sparkles, RefreshCw, AlertTriangle
} from 'lucide-react';
import QuestionBankManager from '../components/QuestionBankManager';
import CandidateManager from '../components/CandidateManager';
import CandidateResultsTable from '../components/CandidateResultsTable';
import ExamScheduler from '../components/ExamScheduler';
import { 
  exportQuestionBankUSB, 
  importQuestionBankUSB, 
  toggleExamKioskMode, 
  isElectronApp, 
  syncFromSupabase 
} from '../utils/storage';

export default function AdminPortal({ onDirectLoginCandidate, onDirectLaunchExam }) {
  const [activeAdminTab, setActiveAdminTab] = useState('question-bank'); // 'question-bank' | 'candidates' | 'gradebook' | 'scheduler'
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const isElectron = isElectronApp();

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleExportFlashDrive = async () => {
    setIsExporting(true);
    try {
      const res = await exportQuestionBankUSB();
      if (res.success) {
        showToast(`✅ Exported Question Bank to flash drive (${res.filePath || 'saved'})!`);
      } else if (!res.canceled) {
        showToast(`❌ Export failed: ${res.error || 'Unknown error'}`);
      }
    } catch (err) {
      showToast(`Export error: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFlashDrive = async () => {
    setIsImporting(true);
    try {
      const res = await importQuestionBankUSB();
      if (res.success) {
        showToast(`✅ Successfully imported & merged ${res.count} questions from flash drive!`);
      } else if (!res.canceled) {
        showToast(`❌ Import failed: ${res.error || 'Unknown error'}`);
      }
    } catch (err) {
      showToast(`Import error: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleToggleKiosk = async () => {
    const nextState = !isKioskMode;
    const res = await toggleExamKioskMode(nextState);
    if (res.success) {
      setIsKioskMode(nextState);
      showToast(nextState 
        ? '🔒 Exam Center Kiosk Mode ACTIVATED! Full-screen examination locked.' 
        : '🔓 Exam Center Kiosk Mode DEACTIVATED. Standard desktop window restored.'
      );
    } else {
      showToast(`Kiosk toggle failed: ${res.error || 'Failed'}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* Toast Feedback */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Sparkles size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Admin Executive Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
              <ShieldCheck size={14} />
              <span>PrepCBT Master Administration Suite</span>
            </span>
            {isElectron ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                Offline Windows Desktop Engine
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
                Web Edition
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Institutional Exam Center Controller
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Manage question banks with offline USB sync, authorize candidate re-sits, configure scheduled mock windows, and lock workstations into tamper-proof Kiosk mode.
          </p>
        </div>

        {/* Global Hardware & Lockdown Quick Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportFlashDrive}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition shadow-sm disabled:opacity-50"
            title="Export full question bank to USB drive"
          >
            <Usb size={15} className="text-sky-400" />
            <span>{isExporting ? 'Exporting...' : 'Export Question Bank to Flash Drive'}</span>
          </button>

          <button
            type="button"
            onClick={handleImportFlashDrive}
            disabled={isImporting}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition shadow-sm disabled:opacity-50"
            title="Import questions from USB drive"
          >
            <HardDrive size={15} className="text-amber-400" />
            <span>{isImporting ? 'Importing...' : 'Import Questions from Flash Drive'}</span>
          </button>

          <button
            type="button"
            onClick={handleToggleKiosk}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition shadow-lg shrink-0 ${
              isKioskMode 
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
            }`}
          >
            {isKioskMode ? <Unlock size={15} /> : <Lock size={15} />}
            <span>{isKioskMode ? 'Exit Exam Lockdown' : 'Exam Center Kiosk Mode'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto text-xs sm:text-sm font-bold">
        <button
          onClick={() => setActiveAdminTab('question-bank')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition ${
            activeAdminTab === 'question-bank'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <BookOpen size={16} />
          <span>Question Bank Management</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('candidates')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition ${
            activeAdminTab === 'candidates'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Users size={16} />
          <span>Candidates Roster</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('gradebook')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition ${
            activeAdminTab === 'gradebook'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <BarChart3 size={16} />
          <span>Gradebook & Transcripts</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('scheduler')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition ${
            activeAdminTab === 'scheduler'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Calendar size={16} />
          <span>Mocks Scheduler</span>
        </button>
      </div>

      {/* Active Sub-Tab View */}
      <div>
        {activeAdminTab === 'question-bank' && <QuestionBankManager />}
        {activeAdminTab === 'candidates' && (
          <CandidateManager onDirectLoginCandidate={onDirectLoginCandidate} />
        )}
        {activeAdminTab === 'gradebook' && <CandidateResultsTable />}
        {activeAdminTab === 'scheduler' && (
          <ExamScheduler onDirectLaunchExam={onDirectLaunchExam} />
        )}
      </div>

    </div>
  );
}
