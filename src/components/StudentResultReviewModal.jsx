import React, { useState } from 'react';
import { 
  Award, CheckCircle2, XCircle, BookOpen, Printer, Mail, 
  Clock, Check, X, ChevronRight, AlertCircle, ArrowLeft,
  Sparkles, ShieldCheck, Filter
} from 'lucide-react';
import { getAllSubjects } from '../utils/storage';
import { openMailClientForResult, sendResultEmail } from '../services/emailService';
import MathText from './MathText';

export default function StudentResultReviewModal({ candidate, onClose }) {
  const result = candidate?.examResult || {};
  const { 
    totalScore = 0, 
    maxScore = 400, 
    percentage = 0, 
    timeSpentSeconds = 0, 
    subjectScores = {}, 
    answers = {}, 
    examQuestionsBySubject = {} 
  } = result;

  const allSubjectsList = getAllSubjects();
  const subjectsList = candidate?.registeredSubjects || Object.keys(subjectScores);
  const [selectedSubject, setSelectedSubject] = useState(subjectsList[0] || 'all');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'missed' | 'correct'
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const minutesSpent = Math.round(timeSpentSeconds / 60);

  const handlePrint = () => {
    window.print();
  };

  const [emailStatus, setEmailStatus] = useState(null); // 'sending' | 'success' | null

  const handleEmailResult = async () => {
    if (!candidate.email || !candidate.email.includes('@')) {
      alert('No valid email address registered for this candidate.');
      return;
    }
    try {
      setEmailStatus('sending');
      await sendResultEmail(candidate);
      setEmailStatus('success');
      setTimeout(() => setEmailStatus(null), 4000);
    } catch (err) {
      // Fallback to local mail client
      openMailClientForResult(candidate);
      setEmailStatus(null);
    }
  };

  const getSubjectMeta = (subId) => {
    return allSubjectsList.find(s => s.id === subId) || { name: subId.toUpperCase(), color: '#38bdf8' };
  };

  // Compile active questions for review
  const activeQuestions = (() => {
    let list = [];
    if (selectedSubject === 'all') {
      Object.entries(examQuestionsBySubject).forEach(([subId, qList]) => {
        (qList || []).forEach(q => list.push({ ...q, subjectId: subId }));
      });
    } else {
      const qList = examQuestionsBySubject[selectedSubject] || [];
      list = qList.map(q => ({ ...q, subjectId: selectedSubject }));
    }

    if (filterMode === 'missed') {
      return list.filter(q => answers[q.id] !== q.correctOption);
    }
    if (filterMode === 'correct') {
      return list.filter(q => answers[q.id] === q.correctOption);
    }
    return list;
  })();

  const totalMissed = Object.values(examQuestionsBySubject)
    .flat()
    .filter(q => answers[q.id] !== q.correctOption).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="printable-transcript bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8 print:border-none print:shadow-none print:bg-white print:text-black print:my-0 flex flex-col max-h-[92vh]">
        
        {/* Top Header Controls (Hidden in Print) */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between text-xs print:hidden shrink-0">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <ShieldCheck size={18} />
            <span className="text-sm">Official Approved CBT Result & Detailed Performance Transcript</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleEmailResult}
              disabled={emailStatus === 'sending'}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold transition shadow-sm disabled:opacity-60"
              title="Send performance transcript and breakdown to your email"
            >
              <Mail size={14} />
              <span>{emailStatus === 'sending' ? 'Sending...' : emailStatus === 'success' ? 'Email Sent!' : 'Email Transcript'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold transition border border-slate-700"
              title="Print official result slip to PDF or paper"
            >
              <Printer size={14} />
              <span>Print to PDF / Result</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              title="Close modal (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6 flex-1 print:p-6 print:text-black">
          
          {/* Candidate Profile Summary Header */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 print:border-slate-300 print:bg-slate-50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 print:border-slate-300">
              <div>
                <span className="text-[11px] font-bold text-sky-400 tracking-wider uppercase">Accredited CBT Result Release</span>
                <h2 className="text-xl sm:text-2xl font-black text-white print:text-black">{candidate.fullName}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400 print:text-slate-600">
                  <span className="font-mono text-sky-400 font-bold">{candidate.username}</span>
                  <span>•</span>
                  <span>{candidate.examType || 'JAMB UTME'}</span>
                  <span>•</span>
                  <span>{candidate.email || 'No email registered'}</span>
                </div>
              </div>

              {/* Verified Result Badge */}
              <div className="px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5 shrink-0">
                <CheckCircle2 size={15} />
                <span>OFFICIALLY APPROVED & RELEASED</span>
              </div>
            </div>

            {/* Score Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 print:border-slate-300 print:bg-white text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Aggregate Score</span>
                <p className="text-2xl font-black text-emerald-400 print:text-emerald-700 font-mono mt-0.5">
                  {totalScore} <span className="text-xs text-slate-500 font-normal">/ {maxScore}</span>
                </p>
              </div>

              <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 print:border-slate-300 print:bg-white text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Overall Percentage</span>
                <p className="text-2xl font-black text-sky-400 print:text-sky-700 font-mono mt-0.5">
                  {percentage}%
                </p>
              </div>

              <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 print:border-slate-300 print:bg-white text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Questions Missed</span>
                <p className="text-2xl font-black text-rose-400 print:text-rose-700 font-mono mt-0.5">
                  {totalMissed}
                </p>
              </div>

              <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 print:border-slate-300 print:bg-white text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Exam Time Elapsed</span>
                <p className="text-2xl font-black text-slate-200 print:text-black font-mono mt-0.5">
                  {minutesSpent} <span className="text-xs text-slate-500 font-normal">mins</span>
                </p>
              </div>
            </div>
          </div>

          {/* Subject-by-Subject Score Cards */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 flex items-center gap-2">
              <BookOpen size={14} className="text-sky-400" />
              <span>Subject Performance Breakdown</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.entries(subjectScores).map(([subId, stats]) => {
                const subMeta = getSubjectMeta(subId);
                return (
                  <div 
                    key={subId}
                    className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2 print:border-slate-300 print:bg-white"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white print:text-black">{subMeta.name}</span>
                      <span className="font-mono font-bold text-sky-400 print:text-sky-700">{stats.score}%</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 print:text-slate-600">
                      <span>Correct:</span>
                      <span className="font-mono font-bold text-slate-200 print:text-black">{stats.correct} / {stats.total}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden print:bg-slate-200">
                      <div 
                        className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(0, stats.score))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Question Review & Missed Questions Section */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800 print:border-slate-300">
              <div>
                <h3 className="text-base font-extrabold text-white print:text-black flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-400" />
                  <span>Question-by-Question Review & Missed Answers</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 print:text-slate-600">
                  Review every question from your test, see your selected choice, view correct answers and explanations.
                </p>
              </div>

              {/* Subject Filter Pills (Hidden in Print) */}
              <div className="flex flex-wrap items-center gap-1.5 print:hidden">
                <button
                  type="button"
                  onClick={() => setSelectedSubject('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    selectedSubject === 'all'
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  All Subjects
                </button>
                {subjectsList.map(sId => {
                  const sName = getSubjectMeta(sId)?.name || sId;
                  return (
                    <button
                      key={sId}
                      type="button"
                      onClick={() => setSelectedSubject(sId)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        selectedSubject === sId
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {sName}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sub-filter: All / Missed / Correct (Hidden in Print) */}
            <div className="flex items-center gap-2 print:hidden text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <Filter size={13} />
                <span>Show:</span>
              </span>
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  filterMode === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Questions ({activeQuestions.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('missed')}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  filterMode === 'missed' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-rose-400/80 hover:text-rose-300'
                }`}
              >
                Missed Items Only
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('correct')}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  filterMode === 'correct' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-emerald-400/80 hover:text-emerald-300'
                }`}
              >
                Correct Items Only
              </button>
            </div>

            {/* Questions List */}
            {activeQuestions.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                No questions found matching the selected filter.
              </div>
            ) : (
              <div className="space-y-4">
                {activeQuestions.map((q, idx) => {
                  const studentAnswer = answers[q.id];
                  const isCorrect = studentAnswer === q.correctOption;
                  const isUnanswered = !studentAnswer;

                  return (
                    <div 
                      key={q.id || idx}
                      className={`p-5 rounded-2xl border text-xs space-y-3 transition print:border-slate-300 print:bg-white ${
                        isCorrect 
                          ? 'bg-slate-950/40 border-slate-800' 
                          : 'bg-rose-950/10 border-rose-500/20'
                      }`}
                    >
                      {/* Question Header & Status Badge */}
                      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/80 print:border-slate-200">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sky-400 text-xs">Question {idx + 1}</span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 uppercase font-semibold">
                            {q.topic || 'General'}
                          </span>
                        </div>

                        {isCorrect ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                            <Check size={12} />
                            <span>CORRECT</span>
                          </span>
                        ) : isUnanswered ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[11px] font-bold">
                            <span>UNANSWERED</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[11px] font-bold">
                            <X size={12} />
                            <span>INCORRECT</span>
                          </span>
                        )}
                      </div>

                      {/* Optional Passage */}
                      {q.passage && (
                        <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 italic text-slate-300 text-xs print:bg-slate-50 print:text-black">
                          {q.passage}
                        </div>
                      )}

                      {/* Question Text */}
                      <div className="text-sm font-semibold text-white print:text-black leading-relaxed">
                        <MathText text={q.question || q.question_text} />
                      </div>

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {q.options?.map((opt, optIdx) => {
                          const optKey = ['A', 'B', 'C', 'D'][optIdx];
                          const isStudentPick = studentAnswer === optKey;
                          const isTheCorrectOption = q.correctOption === optKey;

                          let badgeStyle = 'bg-slate-900 border-slate-800 text-slate-300';
                          if (isTheCorrectOption) {
                            badgeStyle = 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 font-bold';
                          } else if (isStudentPick && !isCorrect) {
                            badgeStyle = 'bg-rose-950/40 border-rose-500/50 text-rose-300 font-bold';
                          }

                          return (
                            <div
                              key={optKey}
                              className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${badgeStyle} print:border-slate-300`}
                            >
                              <span className={`w-5 h-5 rounded-md flex items-center justify-center font-mono font-bold text-[11px] shrink-0 ${
                                isTheCorrectOption 
                                  ? 'bg-emerald-600 text-white' 
                                  : isStudentPick 
                                    ? 'bg-rose-600 text-white' 
                                    : 'bg-slate-800 text-slate-400'
                              }`}>
                                {optKey}
                              </span>
                              <div className="flex-1">
                                <MathText text={opt} />
                                {isStudentPick && !isTheCorrectOption && (
                                  <span className="block text-[10px] text-rose-400 mt-1 font-semibold uppercase">
                                    ✗ Your choice (Incorrect)
                                  </span>
                                )}
                                {isTheCorrectOption && (
                                  <span className="block text-[10px] text-emerald-400 mt-1 font-semibold uppercase">
                                    ✓ Correct choice
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Detailed Explanation */}
                      {q.explanation && (
                        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-1 print:bg-slate-100 print:text-black">
                          <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider">
                            Detailed Explanation:
                          </span>
                          <p className="text-slate-300 print:text-slate-700 leading-relaxed">
                            <MathText text={q.explanation} />
                          </p>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>

        {/* Modal Bottom Footer (Hidden in Print) */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden shrink-0">
          <div className="text-xs text-slate-400">
            Registered Email: <span className="text-white font-mono">{candidate.email || 'None on file'}</span>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleEmailResult}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold text-xs transition shadow-md"
            >
              <Mail size={14} />
              <span>Email Full Report</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs transition border border-slate-700"
            >
              <ArrowLeft size={14} />
              <span>Exit Result Portal</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
