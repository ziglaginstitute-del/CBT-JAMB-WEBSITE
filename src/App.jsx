import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HomeDashboard from './views/HomeDashboard';
import AdminAuthModal from './components/AdminAuthModal';
import CandidateManager from './components/CandidateManager';
import CandidateResultsTable from './components/CandidateResultsTable';
import QuestionBankManager from './components/QuestionBankManager';
import ExamScheduler from './components/ExamScheduler';
import ExamInterface from './components/ExamInterface';
import ResultAnalytics from './components/ResultAnalytics';
import PracticeMode from './components/PracticeMode';
import PastHistory from './components/PastHistory';
import ExamSetupModal from './components/ExamSetupModal';
import InstructionsModal from './components/InstructionsModal';
import { 
  recordExamSubmission, recordCandidateSubmission, 
  updateCandidate, getScheduledExams, syncFromSupabase 
} from './utils/storage';
import { createExamHistoryRecord, fetchExamHistory } from './services/supabaseService';
import { ADMIN_SESSION_STORAGE_KEY } from './data/defaultSettings';
import { Lock, ShieldCheck } from 'lucide-react';

// Views that strictly require Master Administrator authentication
const ADMIN_PROTECTED_VIEWS = [
  'candidates',
  'candidate-manager',
  'candidate-results',
  'question-bank',
  'scheduled-exams',
  'scheduler',
  'admin-dashboard'
];

export default function App() {
  // Primary view defaults strictly to candidate CBT login portal
  const [currentView, setCurrentView] = useState('login'); // 'login' | 'exam' | 'result' | 'candidates' | 'candidate-results' | 'question-bank' | 'scheduled-exams' | 'practice' | 'history'
  
  // Administrator authentication state
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    try {
      return sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [pendingAdminView, setPendingAdminView] = useState(null);

  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);

  // Active exam configuration
  const [activeExamConfig, setActiveExamConfig] = useState(null);

  // Completed exam result data
  const [examResult, setExamResult] = useState(null);

  // History saved in localStorage
  const [historyList, setHistoryList] = useState(() => {
    try {
      const saved = localStorage.getItem('prepcbt_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Background sync with Supabase on app mount
  useEffect(() => {
    syncFromSupabase();
    fetchExamHistory().then(remoteHistory => {
      if (remoteHistory && remoteHistory.length > 0) {
        setHistoryList(remoteHistory);
      }
    }).catch(err => console.warn('Supabase initial history sync error:', err));
  }, []);

  // Global Keyboard Shortcut Listener for Staff Admin Portal: Ctrl + Shift + A
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setIsAdminAuthModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Protected View Navigator
  const handleNavigate = (targetView) => {
    // Normalise alias views
    let viewKey = targetView;
    if (viewKey === 'candidate-manager') viewKey = 'candidates';
    if (viewKey === 'scheduler') viewKey = 'scheduled-exams';

    // If attempting to access an admin view without authentication, intercept
    if (ADMIN_PROTECTED_VIEWS.includes(viewKey) && !isAdminAuthenticated) {
      setPendingAdminView(viewKey);
      setIsAdminAuthModalOpen(true);
      return;
    }

    setCurrentView(viewKey);
  };

  const handleAdminAuthSuccess = () => {
    setIsAdminAuthenticated(true);
    const target = pendingAdminView || 'candidates';
    setCurrentView(target);
    setPendingAdminView(null);
  };

  const handleLockAdminSession = () => {
    setIsAdminAuthenticated(false);
    try {
      sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear admin session', e);
    }
    // Return immediately to candidate portal
    setCurrentView('login');
  };

  const saveToHistory = (newAttempt) => {
    try {
      const updated = [newAttempt, ...historyList].slice(0, 30);
      setHistoryList(updated);
      localStorage.setItem('prepcbt_history', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save history to localStorage', e);
    }
  };

  const handleClearHistory = () => {
    setHistoryList([]);
    localStorage.removeItem('prepcbt_history');
  };

  const handleStartExam = (config) => {
    setActiveExamConfig(config);
    setIsSetupOpen(false);
    setCurrentView('exam');
  };

  const handleFinishExam = (completedData) => {
    const { examConfig, answers, examQuestionsBySubject, timeSpentSeconds } = completedData;

    let totalScore = 0;
    let totalQuestions = 0;
    let totalCorrect = 0;
    const subjectScores = {};

    examConfig.subjects.forEach(subId => {
      const questions = examQuestionsBySubject[subId] || [];
      let subCorrect = 0;
      questions.forEach(q => {
        if (answers[q.id] === q.correctOption) {
          subCorrect++;
          totalCorrect++;
        }
      });
      totalQuestions += questions.length;
      const subScaled = questions.length > 0 ? Math.round((subCorrect / questions.length) * 100) : 0;
      totalScore += subScaled;
      subjectScores[subId] = {
        correct: subCorrect,
        total: questions.length,
        score: subScaled
      };
    });

    const isJamb = examConfig.examType?.toLowerCase() === 'jamb' || examConfig.examType?.toLowerCase() === 'jamb utme';
    const maxScore = isJamb ? 400 : 100;
    const finalScore = isJamb
      ? totalScore
      : (totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0);

    const percentage = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    const historyRecord = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      examConfig,
      score: finalScore,
      maxScore,
      percentage,
      timeSpentSeconds
    };

    if (examConfig.isCandidateSession && examConfig.candidateId) {
      recordCandidateSubmission(examConfig.candidateId, {
        totalScore: finalScore,
        maxScore,
        percentage,
        timeSpentSeconds,
        submittedAt: new Date().toISOString(),
        subjectScores
      });
    }

    if (examConfig.isScheduled && examConfig.scheduledExamId) {
      recordExamSubmission(examConfig.scheduledExamId, {
        candidateName: examConfig.candidateName,
        candidateId: examConfig.candidateReg,
        submittedAt: new Date().toISOString(),
        totalScore: finalScore,
        percentage,
        timeSpentSeconds,
        subjectScores
      });
    }

    saveToHistory(historyRecord);
    createExamHistoryRecord(historyRecord).catch(e => console.warn('Supabase history write error:', e));
    setExamResult(completedData);
    setCurrentView('result');
  };

  const handleReviewPastAttempt = () => {
    setIsSetupOpen(true);
  };

  const handleDirectLaunchScheduledExam = (exam) => {
    handleStartExam({
      examType: exam.examType?.toUpperCase(),
      candidateName: 'Candidate ' + Math.floor(100 + Math.random() * 900),
      candidateReg: `2026/UTME/${Math.floor(100000 + Math.random() * 900000)}`,
      subjects: exam.subjectIds,
      durationMinutes: exam.durationMinutes,
      isScheduled: true,
      scheduledExamId: exam.id,
      questionsBySubject: exam.questionsBySubject
    });
  };

  // Launch personalized candidate CBT session
  const handleLaunchCandidateSession = (candidate, assignedExam = null) => {
    updateCandidate(candidate.id, { status: 'In Progress' });

    handleStartExam({
      examType: candidate.examType || 'JAMB UTME',
      candidateName: candidate.fullName,
      candidateReg: candidate.username,
      candidateId: candidate.id,
      isCandidateSession: true,
      subjects: candidate.registeredSubjects || ['english', 'mathematics', 'physics', 'chemistry'],
      durationMinutes: assignedExam ? assignedExam.durationMinutes : (candidate.examType === 'WASSCE' ? 150 : 120),
      isScheduled: !!assignedExam,
      scheduledExamId: assignedExam ? assignedExam.id : null,
      questionsBySubject: assignedExam?.questionsBySubject || null
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white">
      {/* Header with high-security Admin Active banner & zero-admin public interface */}
      {currentView !== 'exam' && (
        <Header
          activeTab={currentView}
          setActiveTab={handleNavigate}
          onOpenInstructions={() => setIsInstructionsOpen(true)}
          isAdminAuthenticated={isAdminAuthenticated}
          onLockAdminSession={handleLockAdminSession}
          onOpenAdminAuth={() => setIsAdminAuthModalOpen(true)}
        />
      )}

      {/* Main View Router */}
      <main className="flex-1 flex flex-col">
        {/* PUBLIC FOCUSED CANDIDATE CBT PORTAL (Zero admin traces) */}
        {currentView === 'login' && (
          <HomeDashboard
            onLoginSuccess={handleLaunchCandidateSession}
          />
        )}

        {/* ================= ADMIN PROTECTED VIEWS ================= */}
        {isAdminAuthenticated && (
          <>
            {currentView === 'candidates' && (
              <CandidateManager
                onDirectLoginCandidate={(cand) => handleLaunchCandidateSession(cand)}
              />
            )}

            {currentView === 'candidate-results' && (
              <CandidateResultsTable />
            )}

            {currentView === 'question-bank' && (
              <QuestionBankManager />
            )}

            {currentView === 'scheduled-exams' && (
              <ExamScheduler
                onDirectLaunchExam={handleDirectLaunchScheduledExam}
              />
            )}

            {currentView === 'practice' && (
              <PracticeMode
                onStartMock={() => setIsSetupOpen(true)}
                onOpenCandidateLogin={() => setCurrentView('login')}
              />
            )}

            {currentView === 'history' && (
              <PastHistory
                historyList={historyList}
                onClearHistory={handleClearHistory}
                onStartMock={() => setIsSetupOpen(true)}
                onReviewAttempt={handleReviewPastAttempt}
              />
            )}
          </>
        )}

        {/* Live Examination Interface */}
        {currentView === 'exam' && activeExamConfig && (
          <ExamInterface
            examConfig={activeExamConfig}
            onFinishExam={handleFinishExam}
            onExitExam={() => setCurrentView('login')}
          />
        )}

        {/* Exam Results & Analytics */}
        {currentView === 'result' && examResult && (
          <ResultAnalytics
            resultData={examResult}
            onRetake={() => {
              if (examResult?.examConfig?.isCandidateSession) {
                setCurrentView('login');
              } else {
                setIsSetupOpen(true);
              }
            }}
            onPracticeSubject={() => {
              if (isAdminAuthenticated) {
                setCurrentView('practice');
              } else {
                setCurrentView('login');
              }
            }}
          />
        )}
      </main>

      {/* Footer when not taking an exam */}
      {currentView !== 'exam' && (
        <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/70 py-6 text-center text-xs text-slate-400">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-slate-400">
              PrepCBT • High-Standard JAMB UTME & WASSCE Computer-Based Test Simulator
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400">
              <button 
                onClick={() => setCurrentView('login')} 
                className="hover:text-sky-400 transition font-medium text-sky-400"
              >
                Candidate Login
              </button>

              <button 
                onClick={() => setIsInstructionsOpen(true)} 
                className="hover:text-sky-400 transition"
              >
                Shortcuts Guide
              </button>

              {/* Privilege Admin Links: Shown ONLY if Admin Session is Active */}
              {isAdminAuthenticated ? (
                <>
                  <button onClick={() => setCurrentView('candidates')} className="hover:text-amber-400 text-amber-300 font-semibold transition">
                    Candidates Roster
                  </button>
                  <button onClick={() => setCurrentView('candidate-results')} className="hover:text-amber-400 text-amber-300 font-semibold transition">
                    Gradebook
                  </button>
                  <button onClick={() => setCurrentView('question-bank')} className="hover:text-amber-400 text-amber-300 font-semibold transition">
                    Question Bank
                  </button>
                  <button onClick={() => setCurrentView('scheduled-exams')} className="hover:text-amber-400 text-amber-300 font-semibold transition">
                    Mocks Scheduler
                  </button>
                  <button 
                    onClick={handleLockAdminSession}
                    className="text-rose-400 hover:text-rose-300 font-bold transition flex items-center gap-1"
                  >
                    <Lock size={12} />
                    <span>Lock Admin Session</span>
                  </button>
                </>
              ) : (
                /* Discrete, unlabelled lock icon entry point for the school administrator */
                <button
                  type="button"
                  onClick={() => setIsAdminAuthModalOpen(true)}
                  className="p-1.5 text-slate-600 hover:text-slate-400 transition rounded-md hover:bg-slate-800/50"
                  title="Staff Portal (Ctrl + Shift + A)"
                  aria-label="Staff Portal"
                >
                  <Lock size={13} className="opacity-60 hover:opacity-100" />
                </button>
              )}
            </div>
          </div>
        </footer>
      )}

      {/* Hidden Master Admin Password Gate Modal */}
      <AdminAuthModal
        isOpen={isAdminAuthModalOpen}
        onClose={() => {
          setIsAdminAuthModalOpen(false);
          setPendingAdminView(null);
        }}
        onSuccess={handleAdminAuthSuccess}
      />

      {/* Setup Exam Modal (Used if admin triggers manual mock) */}
      <ExamSetupModal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
        onStartExam={handleStartExam}
      />

      {/* Guidelines & Shortcuts Modal */}
      <InstructionsModal
        isOpen={isInstructionsOpen}
        onClose={() => setIsInstructionsOpen(false)}
        onStartMock={() => {
          if (isAdminAuthenticated) {
            setIsSetupOpen(true);
          } else {
            setCurrentView('login');
          }
        }}
      />
    </div>
  );
}
