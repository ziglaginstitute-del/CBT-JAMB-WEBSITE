import React, { useState } from 'react';
import { 
  Award, CheckCircle2, XCircle, Clock, RotateCcw, 
  ChevronRight, BookOpen, AlertCircle, FileText, Check, HelpCircle 
} from 'lucide-react';
import { SUBJECTS, getWassceGrade } from '../data/questions';
import MathText from './MathText';

export default function ResultAnalytics({ resultData, onRetake, onPracticeSubject }) {
  const { examConfig, answers, examQuestionsBySubject, timeSpentSeconds } = resultData;
  const { examType, candidateName, candidateReg, subjects } = examConfig;

  const [reviewFilter, setReviewFilter] = useState('all'); // 'all' | 'incorrect' | 'correct'
  const [activeReviewSubject, setActiveReviewSubject] = useState(subjects[0] || 'all');

  // Calculate subject-level statistics
  const subjectScores = subjects.map(subId => {
    const subObj = SUBJECTS.find(s => s.id === subId) || { name: subId, id: subId };
    const questions = examQuestionsBySubject[subId] || [];
    let correct = 0;
    let attempted = 0;

    questions.forEach(q => {
      const studentAns = answers[q.id];
      if (studentAns) {
        attempted++;
        if (studentAns === q.correctOption) {
          correct++;
        }
      }
    });

    const totalQuestions = questions.length;
    const accuracy = totalQuestions > 0 ? (correct / totalQuestions) : 0;
    const scaledScore = Math.round(accuracy * 100); // 100 max per subject in JAMB
    const percentage = Math.round(accuracy * 100);
    const wassce = getWassceGrade(percentage);

    return {
      subId,
      name: subObj.name,
      totalQuestions,
      attempted,
      correct,
      scaledScore,
      percentage,
      wassce
    };
  });

  // Overall JAMB Score = sum of scaled scores (scaled to 400 total)
  const totalScaledJambScore = subjectScores.reduce((acc, curr) => acc + curr.scaledScore, 0);
  const totalCorrect = subjectScores.reduce((acc, curr) => acc + curr.correct, 0);
  const totalQuestions = subjectScores.reduce((acc, curr) => acc + curr.totalQuestions, 0);
  const overallPercentage = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  // Format time spent
  const formatTimeSpent = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  // Viability remark for Nigerian universities (JAMB benchmark)
  const getJambRemark = (score) => {
    if (score >= 300) return { label: 'Exceptional (Tier 1 Medicine / Law / Eng. Guaranteed)', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    if (score >= 250) return { label: 'Very High (Competitive for Federal Universities)', color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' };
    if (score >= 200) return { label: 'Satisfactory (Above General Federal University Cutoff)', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
    if (score >= 160) return { label: 'Eligible for State Universities & Polytechnics', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    return { label: 'Below Average Cutoff — Needs Remedial Practice', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
  };

  // Compile question review list
  const reviewQuestions = (examQuestionsBySubject[activeReviewSubject] || []).filter(q => {
    const studentAns = answers[q.id];
    const isCorrect = studentAns === q.correctOption;
    if (reviewFilter === 'correct') return isCorrect;
    if (reviewFilter === 'incorrect') return !isCorrect;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Top Banner / Scorecard */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-sky-500/20 text-sky-400 border border-sky-500/30">
                Official Mock Performance Report
              </span>
              <span className="text-xs text-slate-400">
                Time Elapsed: <strong className="text-slate-200">{formatTimeSpent(timeSpentSeconds)}</strong>
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
              {candidateName}
            </h1>
            <p className="text-sm text-slate-400 font-mono mt-0.5">
              Reg. No: <span className="text-sky-400">{candidateReg}</span> • {examType} Standard Mock
            </p>

            <div className="mt-4">
              {examType === 'JAMB' ? (
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${getJambRemark(totalScaledJambScore).color}`}>
                  <Award size={16} />
                  <span>{getJambRemark(totalScaledJambScore).label}</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-400 text-xs font-bold">
                  <Award size={16} />
                  <span>WASSCE Grade Evaluation Complete</span>
                </div>
              )}
            </div>
          </div>

          {/* Big Score Card */}
          <div className="bg-slate-950/70 border border-slate-700/80 rounded-2xl p-6 text-center shrink-0 min-w-[240px] shadow-xl backdrop-blur-md">
            {examType === 'JAMB' ? (
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400 font-mono">
                  Aggregate JAMB Score
                </span>
                <div className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-sky-300 to-white font-mono my-1">
                  {totalScaledJambScore}
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  out of <span className="font-bold text-white">400 Marks</span> ({overallPercentage}%)
                </div>
              </div>
            ) : (
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400 font-mono">
                  Overall Accuracy
                </span>
                <div className="text-5xl sm:text-6xl font-black text-sky-400 font-mono my-1">
                  {overallPercentage}%
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  {totalCorrect} of {totalQuestions} Questions Correct
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onRetake}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-sky-600/30 transition"
            >
              <RotateCcw size={16} />
              <span>Retake Mock Exam</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold border border-slate-700 transition"
            >
              <FileText size={16} />
              <span>Print Score Slip</span>
            </button>
          </div>
        </div>
      </div>

      {/* Subject-by-Subject Score Breakdown Cards */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Award className="text-sky-400" size={20} />
          <span>Subject Performance & Grades</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {subjectScores.map(sub => (
            <div
              key={sub.subId}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm truncate">{sub.name}</h3>
                  {examType === 'WASSCE' ? (
                    <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs border ${sub.wassce.color}`}>
                      {sub.wassce.grade}
                    </span>
                  ) : (
                    <span className="text-xs font-mono font-bold text-sky-400">
                      {sub.scaledScore}/100
                    </span>
                  )}
                </div>

                {/* Accuracy Bar */}
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Accuracy</span>
                    <span className="font-mono text-white font-bold">{sub.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        sub.percentage >= 70 ? 'bg-emerald-400' : sub.percentage >= 50 ? 'bg-sky-400' : 'bg-rose-500'
                      }`}
                      style={{ width: `${sub.percentage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                  <span>Correct: <strong className="text-emerald-400">{sub.correct}</strong></span>
                  <span>Attempted: <strong className="text-white">{sub.attempted}/{sub.totalQuestions}</strong></span>
                </div>
              </div>

              <button
                onClick={() => onPracticeSubject(sub.subId)}
                className="w-full mt-2 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-sky-300 hover:text-sky-200 text-xs font-semibold border border-slate-700/70 transition flex items-center justify-center gap-1.5"
              >
                <BookOpen size={14} />
                <span>Practice Questions</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Comprehensive Question-by-Question Solution Review */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="text-sky-400" size={20} />
              <span>Thorough Solution & Explanation Review</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Review every attempted and skipped question with examiner notes and step-by-step guidance.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setReviewFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                reviewFilter === 'all'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Questions
            </button>
            <button
              onClick={() => setReviewFilter('incorrect')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                reviewFilter === 'incorrect'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Incorrect / Missed
            </button>
            <button
              onClick={() => setReviewFilter('correct')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                reviewFilter === 'correct'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Correct
            </button>
          </div>
        </div>

        {/* Subject Review Switcher */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {subjects.map(subId => {
            const sub = SUBJECTS.find(s => s.id === subId);
            return (
              <button
                key={subId}
                onClick={() => setActiveReviewSubject(subId)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  activeReviewSubject === subId
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {sub?.name || subId}
              </button>
            );
          })}
        </div>

        {/* Questions Cards */}
        <div className="space-y-4">
          {reviewQuestions.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              No questions found under the "{reviewFilter}" filter for this subject.
            </div>
          ) : (
            reviewQuestions.map((q, idx) => {
              const studentAns = answers[q.id];
              const isCorrect = studentAns === q.correctOption;
              const isSkipped = !studentAns;

              return (
                <div
                  key={q.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isCorrect
                      ? 'bg-slate-950/60 border-emerald-500/30'
                      : isSkipped
                      ? 'bg-slate-950/60 border-slate-800'
                      : 'bg-slate-950/60 border-rose-500/30'
                  }`}
                >
                  {/* Status Bar */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs">
                    <span className="font-bold text-slate-300 font-mono">
                      Question #{idx + 1} • <span className="uppercase">{q.difficulty}</span>
                    </span>

                    <div>
                      {isCorrect ? (
                        <span className="px-2 py-0.5 rounded font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 size={13} />
                          <span>Correct</span>
                        </span>
                      ) : isSkipped ? (
                        <span className="px-2 py-0.5 rounded font-bold bg-slate-800 text-slate-400 border border-slate-700">
                          Unanswered / Skipped
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                          <XCircle size={13} />
                          <span>Incorrect (Chose {studentAns})</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Prompt */}
                  <div className="text-white text-base font-medium mb-4">
                    <MathText text={q.question} />
                  </div>

                  {/* Option List with Highlights */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {q.options.map(opt => {
                      const isOptionCorrect = opt.label === q.correctOption;
                      const isOptionStudent = opt.label === studentAns;

                      let optBox = 'bg-slate-900 border-slate-800 text-slate-300';
                      if (isOptionCorrect) {
                        optBox = 'bg-emerald-500/15 border-emerald-500/60 text-emerald-200 font-semibold';
                      } else if (isOptionStudent && !isOptionCorrect) {
                        optBox = 'bg-rose-500/15 border-rose-500/60 text-rose-200';
                      }

                      return (
                        <div
                          key={opt.label}
                          className={`p-3 rounded-xl border flex items-start gap-2.5 ${optBox}`}
                        >
                          <span className={`w-5 h-5 rounded font-mono font-bold flex items-center justify-center shrink-0 ${
                            isOptionCorrect
                              ? 'bg-emerald-500 text-slate-950'
                              : isOptionStudent
                              ? 'bg-rose-500 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {opt.label}
                          </span>
                          <span className="pt-0.5 leading-snug">
                            <MathText text={opt.text} />
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation card */}
                  <div className="mt-4 p-4 rounded-xl bg-slate-900/90 border border-sky-500/20 text-xs sm:text-sm text-slate-300 space-y-1">
                    <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block">
                      Detailed Explanation:
                    </span>
                    <div className="leading-relaxed">
                      <MathText text={q.explanation} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
