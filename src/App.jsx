import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import PracticeMode from './components/PracticeMode';
import ExamSetupModal from './components/ExamSetupModal';
import ExamInterface from './components/ExamInterface';
import ResultAnalytics from './components/ResultAnalytics';
import PastHistory from './components/PastHistory';
import InstructionsModal from './components/InstructionsModal';
import QuestionBankManager from './components/QuestionBankManager';
import ExamScheduler from './components/ExamScheduler';
import ScheduledExamEntry from './components/ScheduledExamEntry';
import CandidateLogin from './components/CandidateLogin';
import CandidateManager from './components/CandidateManager';
import { 
  recordExamSubmission, recordCandidateSubmission, 
  updateCandidate, getScheduledExams 
} from './utils/storage';

export default function App() {
  const [currentView, setCurrentView] = useState('practice'); // 'practice' | 'login' | 'candidates' | 'exam' | 'result' | 'history' | 'question-bank' | 'scheduled-exams'
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const [isJoinPinOpen, setIsJoinPinOpen] = useState(false);

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
    setIsJoinPinOpen(false);
    setCurrentView('exam');
  };

  const handleFinishExam = (completedData) => {
    const { examConfig, answers, examQuestionsBySubject, timeSpentSeconds } = completedData;

    // Calculate total score and subject-level scores
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

    const isJamb = examConfig.examType?.toLowerCase() === 'jamb';
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

    // If this was an authenticated candidate session, record in candidate profile
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

    // If this was a scheduled exam, record in scheduled exam gradebook
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
    setExamResult(completedData);
    setCurrentView('result');
  };

  const handleReviewPastAttempt = (attempt) => {
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

  // Launch exam personalized exclusively for the authenticated candidate
  const handleLaunchCandidateSession = (candidate, assignedExam = null) => {
    // Set candidate status to In Progress
    updateCandidate(candidate.id, { status: 'In Progress' });

    handleStartExam({
      examType: candidate.examType || 'JAMB UTME',
      candidateName: candidate.fullName,
      candidateReg: candidate.username,
      candidateId: candidate.id,
      isCandidateSession: true,
      // Pass candidate's registered subjects list
      subjects: candidate.registeredSubjects || ['english', 'mathematics', 'physics', 'chemistry'],
      durationMinutes: assignedExam ? assignedExam.durationMinutes : (candidate.examType === 'WASSCE' ? 150 : 120),
      isScheduled: !!assignedExam,
      scheduledExamId: assignedExam ? assignedExam.id : null,
      questionsBySubject: assignedExam?.questionsBySubject || null
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white">
      {/* Hide standard navbar when inside live exam to maximize exam focus */}
      {currentView !== 'exam' && (
        <Navbar
          activeTab={currentView}
          setActiveTab={(tab) => setCurrentView(tab)}
          onOpenInstructions={() => setIsInstructionsOpen(true)}
          onStartExamModal={() => setIsSetupOpen(true)}
          onOpenJoinPinModal={() => setIsJoinPinOpen(true)}
        />
      )}

      {/* Main View Router */}
      <div className="flex-1 flex flex-col">
        {currentView === 'practice' && (
          <PracticeMode
            onStartMock={() => setIsSetupOpen(true)}
            onOpenScheduledModal={() => setIsJoinPinOpen(true)}
            onOpenCandidateLogin={() => setCurrentView('login')}
          />
        )}

        {currentView === 'login' && (
          <CandidateLogin
            onLoginSuccess={handleLaunchCandidateSession}
            onOpenAdminRoster={() => setCurrentView('candidates')}
          />
        )}

        {currentView === 'candidates' && (
          <CandidateManager
            onDirectLoginCandidate={(cand) => handleLaunchCandidateSession(cand)}
          />
        )}

        {currentView === 'question-bank' && (
          <QuestionBankManager />
        )}

        {currentView === 'scheduled-exams' && (
          <ExamScheduler
            onDirectLaunchExam={handleDirectLaunchScheduledExam}
          />
        )}

        {currentView === 'exam' && activeExamConfig && (
          <ExamInterface
            examConfig={activeExamConfig}
            onFinishExam={handleFinishExam}
            onExitExam={() => setCurrentView(activeExamConfig.isCandidateSession ? 'login' : 'practice')}
          />
        )}

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
            onPracticeSubject={(subjectId) => {
              setCurrentView('practice');
            }}
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
      </div>

      {/* Footer when not in exam */}
      {currentView !== 'exam' && (
        <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>
              PrepCBT • High-Standard JAMB UTME & WASSCE Computer-Based Test Simulator
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400">
              <button onClick={() => setCurrentView('login')} className="hover:text-sky-400 transition font-semibold text-sky-400">
                Candidate Login
              </button>
              <button onClick={() => setCurrentView('candidates')} className="hover:text-sky-400 transition">
                Candidates & Gradebook
              </button>
              <button onClick={() => setCurrentView('question-bank')} className="hover:text-sky-400 transition">
                Question Bank
              </button>
              <button onClick={() => setCurrentView('scheduled-exams')} className="hover:text-sky-400 transition">
                Scheduled Mocks
              </button>
              <button onClick={() => setIsJoinPinOpen(true)} className="hover:text-sky-400 transition">
                Join with PIN
              </button>
              <button onClick={() => setIsInstructionsOpen(true)} className="hover:text-sky-400 transition">
                Shortcuts Guide
              </button>
            </div>
          </div>
        </footer>
      )}

      {/* Setup Exam Modal */}
      <ExamSetupModal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
        onStartExam={handleStartExam}
      />

      {/* Scheduled Exam Entry Modal */}
      <ScheduledExamEntry
        isOpen={isJoinPinOpen}
        onClose={() => setIsJoinPinOpen(false)}
        onLaunchExam={handleStartExam}
      />

      {/* Guidelines & Shortcuts Modal */}
      <InstructionsModal
        isOpen={isInstructionsOpen}
        onClose={() => setIsInstructionsOpen(false)}
        onStartMock={() => setIsSetupOpen(true)}
      />
    </div>
  );
}
