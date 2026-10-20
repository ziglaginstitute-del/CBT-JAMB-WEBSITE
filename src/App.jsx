import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import PracticeMode from './components/PracticeMode';
import ExamSetupModal from './components/ExamSetupModal';
import ExamInterface from './components/ExamInterface';
import ResultAnalytics from './components/ResultAnalytics';
import PastHistory from './components/PastHistory';
import InstructionsModal from './components/InstructionsModal';
import { SUBJECTS } from './data/questions';

export default function App() {
  const [currentView, setCurrentView] = useState('practice'); // 'practice' | 'exam' | 'result' | 'history'
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

    // Calculate total score
    let totalScore = 0;
    let totalQuestions = 0;
    let totalCorrect = 0;

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
    });

    const maxScore = examConfig.examType === 'JAMB' ? 400 : 100;
    const finalScore = examConfig.examType === 'JAMB'
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

    saveToHistory(historyRecord);
    setExamResult(completedData);
    setCurrentView('result');
  };

  const handleReviewPastAttempt = (attempt) => {
    // Reconstruct resultData view for the attempt
    // In practice we can show analytics with current question bank
    // But we can also set examResult if stored, or start mock
    setIsSetupOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white">
      {/* Hide standard navbar when inside live exam to maximize focus */}
      {currentView !== 'exam' && (
        <Navbar
          activeTab={currentView}
          setActiveTab={(tab) => setCurrentView(tab)}
          onOpenInstructions={() => setIsInstructionsOpen(true)}
          onStartExamModal={() => setIsSetupOpen(true)}
        />
      )}

      {/* Main View Router */}
      <div className="flex-1 flex flex-col">
        {currentView === 'practice' && (
          <PracticeMode
            onStartMock={() => setIsSetupOpen(true)}
          />
        )}

        {currentView === 'exam' && activeExamConfig && (
          <ExamInterface
            examConfig={activeExamConfig}
            onFinishExam={handleFinishExam}
            onExitExam={() => setCurrentView('practice')}
          />
        )}

        {currentView === 'result' && examResult && (
          <ResultAnalytics
            resultData={examResult}
            onRetake={() => setIsSetupOpen(true)}
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
            <div className="flex items-center gap-4 text-slate-400">
              <button onClick={() => setIsInstructionsOpen(true)} className="hover:text-sky-400 transition">
                Shortcuts Guide
              </button>
              <button onClick={() => setIsSetupOpen(true)} className="hover:text-sky-400 transition">
                4-Subject Mock
              </button>
              <button onClick={() => setCurrentView('practice')} className="hover:text-sky-400 transition">
                Untimed Practice
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

      {/* Guidelines & Shortcuts Modal */}
      <InstructionsModal
        isOpen={isInstructionsOpen}
        onClose={() => setIsInstructionsOpen(false)}
        onStartMock={() => setIsSetupOpen(true)}
      />
    </div>
  );
}
