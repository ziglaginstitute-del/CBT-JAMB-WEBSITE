import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, XCircle, Lightbulb, ChevronRight, ChevronLeft, 
  RotateCcw, Sparkles, Filter, Award, AlertCircle, Key, UserCheck, ShieldCheck 
} from 'lucide-react';
import { DIFFICULTIES } from '../data/questions';
import { getQuestionBank, getAllSubjects } from '../utils/storage';
import MathText from './MathText';
import Question from './Question';

export default function PracticeMode({ onStartMock, onOpenCandidateLogin }) {
  const [selectedSubject, setSelectedSubject] = useState('english');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [practiceStats, setPracticeStats] = useState({ correct: 0, attempted: 0 });
  const [questionBank, setQuestionBank] = useState(() => getQuestionBank());
  const [allSubjects, setAllSubjects] = useState(() => getAllSubjects());

  // Reload bank when component renders
  useEffect(() => {
    setQuestionBank(getQuestionBank());
    setAllSubjects(getAllSubjects());
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
          {allSubjects.map(sub => {
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
            <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-xl">
              <Question
                question={currentQuestion}
                questionNumber={filteredQuestions.length > 0 ? currentIndex + 1 : 0}
                totalQuestions={filteredQuestions.length}
                selectedOption={selectedOption}
                onSelectOption={handleSelectOption}
                mode="practice"
                isAnswerChecked={isAnswerChecked}
                onCheckAnswer={handleCheckAnswer}
                onNext={handleNext}
                onPrev={handlePrev}
                isFirst={currentIndex === 0}
                isLast={currentIndex >= filteredQuestions.length - 1}
                subjectName={SUBJECTS.find(s => s.id === selectedSubject)?.name}
              />
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
