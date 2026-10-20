import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Clock, Flag, ChevronLeft, ChevronRight, Calculator, CheckCircle2, 
  AlertTriangle, User, HelpCircle, Send, LogOut, Check 
} from 'lucide-react';
import { SUBJECTS } from '../data/questions';
import { getQuestionBank } from '../utils/storage';
import JambCalculator from './JambCalculator';
import MathText from './MathText';

export default function ExamInterface({ examConfig, onFinishExam, onExitExam }) {
  const { examType, candidateName, candidateReg, subjects, durationMinutes } = examConfig;

  // Active Subject ID
  const [activeSubject, setActiveSubject] = useState(subjects[0] || 'english');

  // Answers Map: { [questionId]: 'A' | 'B' | 'C' | 'D' }
  const [answers, setAnswers] = useState({});

  // Flagged Map: { [questionId]: boolean }
  const [flagged, setFlagged] = useState({});

  // Active question index within current subject
  const [subjectQuestionIndices, setSubjectQuestionIndices] = useState(() => {
    const initial = {};
    subjects.forEach(s => { initial[s] = 0; });
    return initial;
  });

  // Timer: durationMinutes * 60 seconds
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showHotkeysHelp, setShowHotkeysHelp] = useState(false);

  // Compile list of questions for each subject in this exam
  const examQuestionsBySubject = useMemo(() => {
    if (examConfig.questionsBySubject && Object.keys(examConfig.questionsBySubject).length > 0) {
      return examConfig.questionsBySubject;
    }
    const bank = getQuestionBank();
    const map = {};
    subjects.forEach(subId => {
      map[subId] = bank[subId] || [];
    });
    return map;
  }, [subjects, examConfig.questionsBySubject]);

  const currentSubjectQuestions = examQuestionsBySubject[activeSubject] || [];
  const currentQIndex = subjectQuestionIndices[activeSubject] || 0;
  const currentQuestion = currentSubjectQuestions[currentQIndex];

  // Countdown timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleAutoSubmit = useCallback(() => {
    onFinishExam({
      examConfig,
      answers,
      flagged,
      examQuestionsBySubject,
      timeSpentSeconds: durationMinutes * 60 - timeLeft
    });
  }, [examConfig, answers, flagged, examQuestionsBySubject, durationMinutes, timeLeft, onFinishExam]);

  const handleSelectOption = useCallback((optionLabel) => {
    if (!currentQuestion) return;
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: optionLabel
    }));
  }, [currentQuestion]);

  const handleToggleFlag = useCallback(() => {
    if (!currentQuestion) return;
    setFlagged(prev => ({
      ...prev,
      [currentQuestion.id]: !prev[currentQuestion.id]
    }));
  }, [currentQuestion]);

  const handleNext = useCallback(() => {
    if (currentQIndex < currentSubjectQuestions.length - 1) {
      setSubjectQuestionIndices(prev => ({
        ...prev,
        [activeSubject]: currentQIndex + 1
      }));
    } else {
      // Optional: jump to next subject if at end of current
      const currentSubIdx = subjects.indexOf(activeSubject);
      if (currentSubIdx < subjects.length - 1) {
        setActiveSubject(subjects[currentSubIdx + 1]);
      }
    }
  }, [currentQIndex, currentSubjectQuestions.length, activeSubject, subjects]);

  const handlePrev = useCallback(() => {
    if (currentQIndex > 0) {
      setSubjectQuestionIndices(prev => ({
        ...prev,
        [activeSubject]: currentQIndex - 1
      }));
    } else {
      // Jump to previous subject if at start
      const currentSubIdx = subjects.indexOf(activeSubject);
      if (currentSubIdx > 0) {
        const prevSub = subjects[currentSubIdx - 1];
        const prevQuestions = examQuestionsBySubject[prevSub] || [];
        setActiveSubject(prevSub);
        setSubjectQuestionIndices(prev => ({
          ...prev,
          [prevSub]: Math.max(0, prevQuestions.length - 1)
        }));
      }
    }
  }, [currentQIndex, activeSubject, subjects, examQuestionsBySubject]);

  // Global Keyboard Shortcuts handler (A, B, C, D, N, P, R, S)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // If user is focused on an input or calculator, ignore
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      const key = e.key.toUpperCase();

      if (['A', 'B', 'C', 'D'].includes(key)) {
        e.preventDefault();
        handleSelectOption(key);
      } else if (key === 'N') {
        e.preventDefault();
        handleNext();
      } else if (key === 'P') {
        e.preventDefault();
        handlePrev();
      } else if (key === 'R') {
        e.preventDefault();
        handleToggleFlag();
      } else if (key === 'S') {
        e.preventDefault();
        setShowSubmitConfirm(true);
      } else if (key === 'C') {
        // Toggle calculator with 'C'
        setIsCalculatorOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSelectOption, handleNext, handlePrev, handleToggleFlag]);

  // Time format: HH:MM:SS
  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Timer warning shifts:
  // < 15 mins: Amber
  // < 5 mins: Pulsing Red
  const isTimeCritical = timeLeft <= 300; // < 5 mins
  const isTimeWarning = timeLeft > 300 && timeLeft <= 900; // 5-15 mins

  // Overall question stats across all subjects
  const allQuestions = useMemo(() => {
    return Object.values(examQuestionsBySubject).flat();
  }, [examQuestionsBySubject]);

  const totalAnswered = useMemo(() => {
    return allQuestions.filter(q => !!answers[q.id]).length;
  }, [allQuestions, answers]);

  const totalFlagged = useMemo(() => {
    return allQuestions.filter(q => !!flagged[q.id]).length;
  }, [allQuestions, flagged]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col select-none">
      {/* Official CBT Top Bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Candidate Bio Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-sky-500/50 flex items-center justify-center text-sky-400 font-bold">
              <User size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">{candidateName}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                  {candidateReg}
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Official {examType} CBT Examination Mode
              </div>
            </div>
          </div>

          {/* Controls: Calculator, Shortcuts & Timer */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCalculatorOpen(!isCalculatorOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                isCalculatorOpen
                  ? 'bg-sky-600 text-white border-sky-500 shadow-md shadow-sky-600/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
              }`}
              title="Toggle Official JAMB Calculator (HotKey: C)"
            >
              <Calculator size={15} />
              <span>Calculator [C]</span>
            </button>

            <button
              onClick={() => setShowHotkeysHelp(true)}
              className="p-1.5 bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
              title="Keyboard Shortcuts Guide"
            >
              <HelpCircle size={16} />
            </button>

            {/* Countdown Timer with Visual Warning Shift */}
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-sm sm:text-base font-extrabold border transition-all ${
                isTimeCritical
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500 animate-pulse ring-2 ring-rose-500/50'
                  : isTimeWarning
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                  : 'bg-sky-500/10 text-sky-300 border-sky-500/30'
              }`}
            >
              <Clock size={16} className={isTimeCritical ? 'text-rose-400' : isTimeWarning ? 'text-amber-400' : 'text-sky-400'} />
              <span>{formatTime(timeLeft)}</span>
            </div>

            <button
              onClick={() => setShowSubmitConfirm(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-600/30 transition"
            >
              <Send size={14} />
              <span>Submit [S]</span>
            </button>
          </div>
        </div>
      </header>

      {/* Subject Tabs Navigation */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto py-2.5 scrollbar-none">
          {subjects.map(subId => {
            const sub = SUBJECTS.find(s => s.id === subId) || { name: subId };
            const isActive = activeSubject === subId;
            const subQuestions = examQuestionsBySubject[subId] || [];
            const subAnsweredCount = subQuestions.filter(q => !!answers[q.id]).length;

            return (
              <button
                key={subId}
                onClick={() => setActiveSubject(subId)}
                className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50'
                }`}
              >
                <span>{sub.name}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                  isActive ? 'bg-sky-800 text-white font-bold' : 'bg-slate-700 text-slate-300'
                }`}>
                  {subAnsweredCount}/{subQuestions.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Examination Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Question Area */}
        <div className="lg:col-span-3 flex flex-col justify-between bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
          {currentQuestion ? (
            <div className="space-y-6">
              {/* Question Header Status */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase font-extrabold tracking-wider text-sky-400 font-mono">
                    Question {currentQIndex + 1} of {currentSubjectQuestions.length}
                  </span>
                  <span className="text-xs text-slate-500">•</span>
                  <span className="text-xs text-slate-400 capitalize">
                    {SUBJECTS.find(s => s.id === activeSubject)?.name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleFlag}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      flagged[currentQuestion.id]
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-amber-300'
                    }`}
                  >
                    <Flag size={14} className={flagged[currentQuestion.id] ? 'fill-amber-400 text-amber-400' : ''} />
                    <span>{flagged[currentQuestion.id] ? 'Flagged [R]' : 'Flag for Review [R]'}</span>
                  </button>
                </div>
              </div>

              {/* Comprehension Passage if present */}
              {currentQuestion.passage && (
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs italic text-slate-300 leading-relaxed">
                  <span className="font-bold text-sky-400 not-italic mr-1.5">Reading Context / Passage:</span>
                  <MathText text={currentQuestion.passage} />
                </div>
              )}

              {/* Question Text */}
              <div className="text-lg sm:text-xl font-medium text-white leading-relaxed">
                <MathText text={currentQuestion.question} />
              </div>

              {/* Options Cards */}
              <div className="space-y-3 pt-2">
                {currentQuestion.options.map(opt => {
                  const isSelected = answers[currentQuestion.id] === opt.label;

                  return (
                    <button
                      key={opt.label}
                      onClick={() => handleSelectOption(opt.label)}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-4 group ${
                        isSelected
                          ? 'bg-sky-600/20 border-sky-500 text-white ring-1 ring-sky-500'
                          : 'bg-slate-950/60 hover:bg-slate-800/60 border-slate-800 text-slate-300'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 font-mono transition-colors ${
                        isSelected
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-white'
                      }`}>
                        {opt.label}
                      </span>
                      <span className="text-sm sm:text-base pt-1 flex-1 leading-normal">
                        <MathText text={opt.text} />
                      </span>
                      {isSelected && (
                        <Check size={18} className="text-sky-400 shrink-0 mt-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              No questions found for this subject.
            </div>
          )}

          {/* CBT Navigation Footer */}
          <div className="mt-8 pt-5 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              onClick={handlePrev}
              disabled={currentQIndex === 0 && subjects.indexOf(activeSubject) === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={16} />
              <span>Previous [P]</span>
            </button>

            <button
              onClick={handleNext}
              disabled={currentQIndex === currentSubjectQuestions.length - 1 && subjects.indexOf(activeSubject) === subjects.length - 1}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <span>Next [N]</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Right Column: Palette Grid & Candidate Summary */}
        <div className="space-y-5">
          {/* Palette Grid Container */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">
                Question Palette
              </h3>
              <span className="text-xs text-sky-400 font-mono font-semibold">
                {SUBJECTS.find(s => s.id === activeSubject)?.name}
              </span>
            </div>

            {/* Grid of numbers */}
            <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto p-1">
              {currentSubjectQuestions.map((q, idx) => {
                const isCurrent = currentQIndex === idx;
                const isAnswered = !!answers[q.id];
                const isFlagged = !!flagged[q.id];

                let colorClass = 'bg-slate-800 text-slate-400 border-slate-700'; // Skipped / Unanswered

                if (isFlagged) {
                  colorClass = 'bg-amber-500/25 text-amber-300 border-amber-500';
                } else if (isAnswered) {
                  colorClass = 'bg-sky-600 text-white border-sky-500 shadow-sm';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setSubjectQuestionIndices(prev => ({
                        ...prev,
                        [activeSubject]: idx
                      }));
                    }}
                    className={`h-9 rounded-lg font-mono text-xs font-bold border transition relative ${colorClass} ${
                      isCurrent ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-105' : ''
                    }`}
                  >
                    {idx + 1}
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border border-slate-900"></span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-sky-600"></span>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500"></span>
                <span>Flagged for Review</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700"></span>
                <span>Unanswered / Skipped</span>
              </div>
            </div>
          </div>

          {/* Total Exam Overview Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400">
              Exam Overall Progress
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-800">
                <div className="text-base font-bold text-sky-400 font-mono">{totalAnswered}</div>
                <div className="text-[10px] text-slate-400">Answered</div>
              </div>
              <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-800">
                <div className="text-base font-bold text-amber-400 font-mono">{totalFlagged}</div>
                <div className="text-[10px] text-slate-400">Flagged</div>
              </div>
              <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-800">
                <div className="text-base font-bold text-slate-300 font-mono">{allQuestions.length - totalAnswered}</div>
                <div className="text-[10px] text-slate-400">Remaining</div>
              </div>
            </div>

            <button
              onClick={() => setShowSubmitConfirm(true)}
              className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
            >
              <Send size={14} />
              <span>Submit Entire Examination</span>
            </button>
          </div>
        </div>
      </main>

      {/* Floating Jamb Calculator */}
      {isCalculatorOpen && (
        <JambCalculator onClose={() => setIsCalculatorOpen(false)} />
      )}

      {/* Hotkeys Modal */}
      {showHotkeysHelp && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <HelpCircle className="text-sky-400" size={20} />
              <span>Official JAMB Keyboard Shortcuts</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              In JAMB CBT centers, a 8-key or standard keyboard layout is provided to candidates for rapid navigation without touching the mouse:
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800">
                <span className="font-mono font-bold text-sky-400 text-sm bg-slate-900 px-2 py-0.5 rounded">A, B, C, D</span>
                <span className="text-slate-300">Select option A, B, C, or D</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800">
                <span className="font-mono font-bold text-sky-400 text-sm bg-slate-900 px-2 py-0.5 rounded">N</span>
                <span className="text-slate-300">Navigate to Next question</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800">
                <span className="font-mono font-bold text-sky-400 text-sm bg-slate-900 px-2 py-0.5 rounded">P</span>
                <span className="text-slate-300">Navigate to Previous question</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800">
                <span className="font-mono font-bold text-sky-400 text-sm bg-slate-900 px-2 py-0.5 rounded">R</span>
                <span className="text-slate-300">Flag / Unflag question for review</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800">
                <span className="font-mono font-bold text-sky-400 text-sm bg-slate-900 px-2 py-0.5 rounded">S</span>
                <span className="text-slate-300">Open exam submission confirmation</span>
              </div>
            </div>

            <button
              onClick={() => setShowHotkeysHelp(false)}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition"
            >
              Got it, Return to Exam
            </button>
          </div>
        </div>
      )}

      {/* Submit Confirmation Dialog */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold text-white">Confirm Exam Submission</h3>
            </div>

            <p className="text-xs sm:text-sm text-slate-300">
              Are you sure you want to finish and submit your mock examination now? You cannot change your answers once submitted.
            </p>

            {/* Stats Breakdown */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Total Questions Attempted:</span>
                <span className="font-bold text-white font-mono">{totalAnswered} / {allQuestions.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Unanswered Questions:</span>
                <span className="font-bold text-rose-400 font-mono">{allQuestions.length - totalAnswered}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Flagged Questions:</span>
                <span className="font-bold text-amber-400 font-mono">{totalFlagged}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Remaining Exam Time:</span>
                <span className="font-bold text-sky-400 font-mono">{formatTime(timeLeft)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
              >
                No, Return to Test
              </button>
              <button
                onClick={() => {
                  setShowSubmitConfirm(false);
                  handleAutoSubmit();
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5"
              >
                <CheckCircle2 size={16} />
                <span>Yes, Submit Examination</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
