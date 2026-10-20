import React from 'react';
import { History, Award, Calendar, Trash2, ArrowRight, BookOpen } from 'lucide-react';
import { SUBJECTS } from '../data/questions';

export default function PastHistory({ historyList, onClearHistory, onStartMock, onReviewAttempt }) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-sky-500/15 text-sky-400 border border-sky-500/30">
              Mock Test Logs
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Past Mock Examinations
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track your performance progress over time, review past scores, and identify subject improvement areas.
          </p>
        </div>

        {historyList.length > 0 && (
          <button
            onClick={onClearHistory}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 transition"
          >
            <Trash2 size={15} />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* History Items */}
      {historyList.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <History size={48} className="mx-auto text-slate-600" />
          <h3 className="text-lg font-bold text-white">No Mock Examinations Recorded Yet</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Take a 4-subject timed CBT mock exam to generate your first JAMB aggregate score or WASSCE grade breakdown.
          </p>
          <button
            onClick={onStartMock}
            className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-sky-600/30 transition inline-flex items-center gap-2"
          >
            <span>Start First Mock Exam</span>
            <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {historyList.map((attempt, index) => {
            const date = new Date(attempt.timestamp).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            const subjectNames = attempt.examConfig.subjects
              .map(id => SUBJECTS.find(s => s.id === id)?.name || id)
              .join(' • ');

            return (
              <div
                key={attempt.id || index}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-slate-700 transition"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-sky-400 border border-slate-700">
                      {attempt.examConfig.examType}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar size={13} />
                      <span>{date}</span>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white">
                    {attempt.examConfig.candidateName} <span className="text-xs text-slate-400 font-mono">({attempt.examConfig.candidateReg})</span>
                  </h3>

                  <p className="text-xs text-slate-400">
                    Subjects: <span className="text-slate-300">{subjectNames}</span>
                  </p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                  <div className="text-right">
                    <div className="text-2xl font-black text-sky-400 font-mono">
                      {attempt.score} <span className="text-xs text-slate-400">/ {attempt.maxScore}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Accuracy: {attempt.percentage}%
                    </div>
                  </div>

                  <button
                    onClick={() => onReviewAttempt(attempt)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition"
                  >
                    <span>View Analytics</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
