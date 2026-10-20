import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, XCircle, Lightbulb, ChevronRight, ChevronLeft, 
  RotateCcw, Sparkles, Filter, Award, AlertCircle, Key, UserCheck, ShieldCheck 
} from 'lucide-react';
import { SUBJECTS, DIFFICULTIES } from '../data/questions';
import { getQuestionBank } from '../utils/storage';
import MathText from './MathText';

export default function PracticeMode({ onStartMock, onOpenScheduledModal, onOpenCandidateLogin }) {
  const [selectedSubject, setSelectedSubject] = useState('english');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [practiceStats, setPracticeStats] = useState({ correct: 0, attempted: 0 });
  const [questionBank, setQuestionBank] = useState(() => getQuestionBank());

  // Reload bank when component renders
  useEffect(() => {
    setQuestionBank(getQuestionBank());
  }, []);

  // Filter questions for the selected subject and difficulty
  const subjectQuestions = questionBank[selectedSubject] || [];
  const filteredQuestions = selectedDifficulty === 'All'
    ? subjectQuestions
    : subjectQuestions.filter(q => q.difficulty === selectedDifficulty);

  const currentQuestion = filteredQuestions[currentIndex] || filteredQuestions[0];

  const handleSelectOption = (label) => {
    if (isAnswerChecked) return;
    setSelectedOption(label);
  };

  const handleCheckAnswer = () => {
    if (!selectedOption || isAnswerChecked) return;
    setIsAnswerChecked(true);
    const isCorrect = selectedOption === currentQuestion.correctOption;
    setPracticeStats(prev => ({
      correct: isCorrect ? prev.correct + 1 : prev.correct,
      attempted: prev.attempted + 1
    }));
  };

  const handleNext = () => {
    if (currentIndex < filteredQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      resetQuestionState();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      resetQuestionState();
    }
  };

  const resetQuestionState = () => {
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setShowHint(false);
  };

  const handleSubjectChange = (subjectId) => {
    setSelectedSubject(subjectId);
    setCurrentIndex(0);
    resetQuestionState();
  };

  const handleDifficultyChange = (diff) => {
    setSelectedDifficulty(diff);
    setCurrentIndex(0);
    resetQuestionState();
  };

  const resetStats = () => {
    setPracticeStats({ correct: 0, attempted: 0 });
    resetQuestionState();
    setCurrentIndex(0);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Top Banner / Subject Selector */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-700/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Untimed Self-Paced Practice
              </span>
              <span className="text-xs text-slate-400">Step-by-step solutions</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Select Subject to Practice
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-700 flex items-center gap-3">
              <Award className="text-sky-400" size={20} />
              <div className="text-xs">
                <p className="text-slate-400">Session Score</p>
                <p className="text-base font-bold text-white font-mono">
                  {practiceStats.correct} / {practiceStats.attempted} 
                  {practiceStats.attempted > 0 && (
                    <span className="text-xs text-sky-400 font-normal ml-1">
                      ({Math.round((practiceStats.correct / practiceStats.attempted) * 100)}%)
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={resetStats}
              title="Reset Session Stats"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </div>

        {/* Subject Pills */}
        <div className="pt-4 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {SUBJECTS.map(sub => {
            const isSelected = selectedSubject === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => handleSubjectChange(sub.id)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                    : 'bg-slate-900/60 text-slate-300 hover:bg-slate-700/60 hover:text-white border border-slate-700/50'
                }`}
              >
                <span>{sub.name}</span>
                {sub.mandatory && (
                  <span className="text-[10px] bg-sky-950 text-sky-200 px-1.5 py-0.5 rounded uppercase font-bold">
                    UTME Req
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Practice Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left / Main Question Area */}
        <div className="lg:col-span-3 space-y-4">
          {/* Difficulty Bar & Question Counter */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter size={15} className="text-slate-400" />
              <span className="text-xs text-slate-400 font-medium">Difficulty:</span>
              <div className="flex items-center gap-1">
                {DIFFICULTIES.map(diff => (
                  <button
                    key={diff}
                    onClick={() => handleDifficultyChange(diff)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                      selectedDifficulty === diff
                        ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-400 font-mono">
              Question <span className="font-bold text-white">{filteredQuestions.length > 0 ? currentIndex + 1 : 0}</span> of{' '}
              <span className="font-bold text-white">{filteredQuestions.length}</span>
            </div>
          </div>

          {filteredQuestions.length === 0 ? (
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-12 text-center space-y-3">
              <AlertCircle size={40} className="mx-auto text-amber-400 opacity-80" />
              <h3 className="text-lg font-bold text-white">No questions for this difficulty level yet</h3>
              <p className="text-sm text-slate-400">Switch difficulty to "All" to view questions in this subject.</p>
              <button
                onClick={() => handleDifficultyChange('All')}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-sm font-semibold transition"
              >
                Show All Questions
              </button>
            </div>
          ) : (
            <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
              {/* Question Header */}
              <div className="flex items-start justify-between gap-4">
                <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-slate-700/60 text-slate-300">
                  {currentQuestion.difficulty}
                </span>

                <button
                  onClick={() => setShowHint(!showHint)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    showHint
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-amber-300 hover:bg-slate-700/50'
                  }`}
                >
                  <Lightbulb size={14} className={showHint ? 'fill-amber-400 text-amber-400' : ''} />
                  <span>{showHint ? 'Hide Hint' : 'Need a Hint?'}</span>
                </button>
              </div>

              {/* Hint Box */}
              {showHint && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-200">
                  <Lightbulb size={18} className="shrink-0 text-amber-400 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-300 mr-1.5">Examination Hint:</span>
                    <MathText text={currentQuestion.hint} />
                  </div>
                </div>
              )}

              {/* Passage if present */}
              {currentQuestion.passage && (
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/80 text-xs italic text-slate-300 leading-relaxed">
                  <span className="font-bold text-sky-400 not-italic mr-1.5">Reading Context / Passage:</span>
                  <MathText text={currentQuestion.passage} />
                </div>
              )}

              {/* Question Text */}
              <div className="text-base sm:text-lg font-medium text-white leading-relaxed">
                <MathText text={currentQuestion.question} />
              </div>

              {/* Options */}
              <div className="space-y-3 pt-2">
                {currentQuestion.options.map((opt) => {
                  const isSelected = selectedOption === opt.label;
                  const isCorrect = currentQuestion.correctOption === opt.label;

                  let optionStyle = 'bg-slate-900/60 hover:bg-slate-700/50 border-slate-700/70 text-slate-200';

                  if (isAnswerChecked) {
                    if (isCorrect) {
                      optionStyle = 'bg-emerald-500/15 border-emerald-500/70 text-emerald-200';
                    } else if (isSelected && !isCorrect) {
                      optionStyle = 'bg-rose-500/15 border-rose-500/70 text-rose-200';
                    } else {
                      optionStyle = 'bg-slate-900/40 border-slate-800 text-slate-500 opacity-60';
                    }
                  } else if (isSelected) {
                    optionStyle = 'bg-sky-500/20 border-sky-500 text-white ring-1 ring-sky-500';
                  }

                  return (
                    <button
                      key={opt.label}
                      onClick={() => handleSelectOption(opt.label)}
                      disabled={isAnswerChecked}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 group ${optionStyle}`}
                    >
                      <span className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 font-mono transition-colors ${
                        isAnswerChecked
                          ? isCorrect
                            ? 'bg-emerald-500 text-slate-950'
                            : isSelected
                            ? 'bg-rose-500 text-white'
                            : 'bg-slate-800 text-slate-500'
                          : isSelected
                          ? 'bg-sky-500 text-white'
                          : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700 group-hover:text-white'
                      }`}>
                        {opt.label}
                      </span>
                      <span className="text-sm sm:text-base pt-0.5 leading-snug flex-1">
                        <MathText text={opt.text} />
                      </span>
                      {isAnswerChecked && isCorrect && (
                        <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                      )}
                      {isAnswerChecked && isSelected && !isCorrect && (
                        <XCircle size={20} className="text-rose-400 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-700/70 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1.5"
                  >
                    <ChevronLeft size={16} />
                    <span>Previous</span>
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={currentIndex >= filteredQuestions.length - 1}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1.5"
                  >
                    <span>Next</span>
                    <ChevronRight size={16} />
                  </button>
                </div>

                {!isAnswerChecked ? (
                  <button
                    onClick={handleCheckAnswer}
                    disabled={!selectedOption}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Check Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    disabled={currentIndex >= filteredQuestions.length - 1}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 disabled:opacity-40 transition flex items-center gap-1.5"
                  >
                    <span>Continue to Next</span>
                    <ChevronRight size={16} />
                  </button>
                )}
              </div>

              {/* Step-by-Step Solution Card */}
              {isAnswerChecked && (
                <div className="mt-4 p-5 rounded-xl bg-slate-900/90 border border-sky-500/30 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400">
                    <Sparkles size={16} />
                    <span>Official Solution & Explanation</span>
                  </div>
                  <div className="text-sm text-slate-200 leading-relaxed">
                    <MathText text={currentQuestion.explanation} />
                  </div>
                  <div className="pt-2 text-xs text-slate-400">
                    Correct Option: <span className="font-bold text-emerald-400">{currentQuestion.correctOption}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar: Quick Navigation & Timed Mock Call-to-Action */}
        <div className="space-y-4">
          <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="font-bold text-white text-sm flex items-center justify-between">
              <span>Question Palette</span>
              <span className="text-xs text-slate-400">{filteredQuestions.length} Total</span>
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {filteredQuestions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => {
                    setCurrentIndex(idx);
                    resetQuestionState();
                  }}
                  className={`h-9 rounded-lg font-mono text-xs font-bold transition ${
                    currentIndex === idx
                      ? 'bg-sky-500 text-white ring-2 ring-sky-300 ring-offset-2 ring-offset-slate-900'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Candidate CBT Portal Login Card (High Visibility) */}
          <div className="bg-gradient-to-br from-sky-950/70 via-slate-900 to-slate-900 border border-sky-400/40 rounded-2xl p-5 space-y-3.5 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
            <div className="flex items-center justify-between relative">
              <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <UserCheck size={18} />
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-400/40 animate-pulse">
                Accredited Student Login
              </span>
            </div>
            <div className="relative">
              <h4 className="font-extrabold text-white text-sm flex items-center gap-1.5">
                <span>Candidate CBT Login</span>
                <ShieldCheck size={14} className="text-sky-400" />
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Log in with your official Reg No and Passcode to take your personalized exam stream with only your registered subjects.
              </p>
            </div>
            <button
              onClick={onOpenCandidateLogin}
              className="w-full py-2.5 px-3 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 relative"
            >
              <Key size={14} />
              <span>Enter Candidate Terminal</span>
            </button>
          </div>

          {/* Join Scheduled Exam Card */}
          <div className="bg-gradient-to-br from-emerald-950/50 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-5 space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Key size={18} />
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Institutional Access
              </span>
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Join Scheduled Exam</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Have a 6-digit access PIN from your school, tutor, or testing center? Join your scheduled session.
              </p>
            </div>
            <button
              onClick={onOpenScheduledModal}
              className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
            >
              <Key size={14} />
              <span>Enter 6-Digit Exam PIN</span>
            </button>
          </div>

          {/* Quick Mock Exam Card */}
          <div className="bg-gradient-to-br from-sky-900/40 via-slate-800 to-slate-900 border border-sky-500/30 rounded-2xl p-5 space-y-3.5 shadow-xl">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Award size={20} />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Open 4-Subject Practice Mock</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Experience the authentic 4-subject timed CBT mock with auto-scoring, official JAMB calculator, and WASSCE grade assignment.
              </p>
            </div>
            <button
              onClick={onStartMock}
              className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 rounded-xl text-xs font-bold transition"
            >
              Quick Preset Mock
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
