import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Download, Search, RefreshCw, Filter, 
  CheckCircle2, Clock, AlertTriangle, ArrowUpDown, Award, 
  ChevronRight, Users, Sparkles, BookOpen, Mail, Send, Lock, Unlock, Eye 
} from 'lucide-react';
import { 
  getCandidates, resetCandidateExam, syncFromSupabase,
  getGlobalResultsReleased, setGlobalResultsReleased,
  toggleCandidateResultsReleased, updateCandidate 
} from '../utils/storage';
import { SUBJECTS } from '../data/questions';
import SendResultEmailModal from './SendResultEmailModal';
import StudentResultReviewModal from './StudentResultReviewModal';

export default function CandidateResultsTable() {
  const [candidates, setCandidates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [examTypeFilter, setExamTypeFilter] = useState('All');
  const [sortBy, setSortBy] = useState('score-desc');
  const [selectedCandidateDetail, setSelectedCandidateDetail] = useState(null);
  const [candidateToSendEmail, setCandidateToSendEmail] = useState(null);
  const [reviewCandidate, setReviewCandidate] = useState(null);
  const [isGlobalReleased, setIsGlobalReleased] = useState(() => getGlobalResultsReleased());
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadData = () => {
    setCandidates(getCandidates());
    syncFromSupabase().then(() => {
      setCandidates(getCandidates());
    }).catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  const getSubjectName = (subId) => {
    return SUBJECTS.find(s => s.id === subId)?.name || subId;
  };

  const handleReset = (candidateId, name) => {
    resetCandidateExam(candidateId);
    loadData();
    showToast(`Exam score reset for ${name}. Candidate can re-sit.`);
  };

  const handleToggleGlobalRelease = () => {
    const nextVal = !isGlobalReleased;
    setGlobalResultsReleased(nextVal);
    setIsGlobalReleased(nextVal);
    loadData();
    showToast(nextVal 
      ? '✅ Official CBT Results APPROVED & RELEASED to students!' 
      : '🔒 Official CBT Results WITHHELD from students (Anti-Malpractice mode).'
    );
  };

  const handleToggleCandidateRelease = (candId) => {
    const nextVal = toggleCandidateResultsReleased(candId);
    loadData();
    showToast(nextVal ? 'Result released for this candidate.' : 'Result withheld for this candidate.');
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (candidates.length === 0) return;

    const headers = [
      'Registration Number',
      'Candidate Name',
      'Exam Type',
      'Category',
      'Status',
      'Total Score',
      'Max Score',
      'Percentage (%)',
      'Time Spent (Sec)',
      'Submitted At',
      'Subject Breakdown'
    ];

    const rows = candidates.map(c => {
      const res = c.examResult;
      const breakdown = res?.subjectScores
        ? Object.entries(res.subjectScores)
            .map(([sub, data]) => `${getSubjectName(sub)}: ${data.score}% (${data.correct}/${data.total})`)
            .join(' | ')
        : 'N/A';

      return [
        `"${c.username}"`,
        `"${c.fullName}"`,
        `"${c.examType || 'JAMB UTME'}"`,
        `"${c.category || 'General'}"`,
        `"${c.status || 'Pending'}"`,
        res ? res.totalScore : 'N/A',
        res ? (res.maxScore || 400) : 'N/A',
        res ? `${res.percentage}%` : 'N/A',
        res ? res.timeSpentSeconds : 'N/A',
        res?.submittedAt ? `"${new Date(res.submittedAt).toLocaleString()}"` : 'N/A',
        `"${breakdown}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PrepCBT_Master_Gradebook_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered and sorted list
  const filteredCandidates = candidates.filter(cand => {
    const q = searchQuery.toLowerCase();
    const matchSearch = cand.fullName.toLowerCase().includes(q) || cand.username.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'All' || cand.status === statusFilter;
    const matchExam = examTypeFilter === 'All' || cand.examType === examTypeFilter;
    return matchSearch && matchStatus && matchExam;
  }).sort((a, b) => {
    const scoreA = a.examResult?.totalScore ?? -1;
    const scoreB = b.examResult?.totalScore ?? -1;
    if (sortBy === 'score-desc') return scoreB - scoreA;
    if (sortBy === 'score-asc') return scoreA - scoreB;
    if (sortBy === 'name') return a.fullName.localeCompare(b.fullName);
    return 0;
  });

  const completedCount = candidates.filter(c => c.status === 'Completed').length;
  const inProgressCount = candidates.filter(c => c.status === 'In Progress').length;
  const pendingCount = candidates.filter(c => c.status === 'Pending').length;
  
  const completedWithScore = candidates.filter(c => c.status === 'Completed' && c.examResult?.totalScore !== undefined);
  const avgScore = completedWithScore.length > 0
    ? Math.round(completedWithScore.reduce((acc, c) => acc + (c.examResult.percentage || 0), 0) / completedWithScore.length)
    : 0;

  const highestScore = completedWithScore.length > 0
    ? Math.max(...completedWithScore.map(c => c.examResult.totalScore))
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/80 border border-slate-700/60 p-6 rounded-2xl shadow-xl backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
              <Award size={13} />
              <span>Administrative Gradebook</span>
            </span>
            <span className="text-xs text-slate-400">Institutional Master Records</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Candidate Results & Analytics Table
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track real-time examination submissions, analyze individual subject performances, and export standardized score reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition"
            title="Refresh Data"
          >
            <RefreshCw size={17} />
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition hover:scale-[1.02]"
          >
            <Download size={16} />
            <span>Export CSV Gradebook</span>
          </button>
        </div>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <div className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Enrolled Students</span>
            <Users size={16} className="text-sky-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2 font-mono">{candidates.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Total across all streams</div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Completed Exams</span>
            <CheckCircle2 size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2 font-mono">{completedCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Submissions locked</div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>In Progress / Sitting</span>
            <Clock size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 mt-2 font-mono">{inProgressCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Active exam terminals</div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Average Score</span>
            <BarChart3 size={16} className="text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400 mt-2 font-mono">{avgScore}%</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Cohort performance</div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-xl col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Top Raw Score</span>
            <Award size={16} className="text-yellow-400" />
          </div>
          <div className="text-2xl font-black text-yellow-400 mt-2 font-mono">{highestScore}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Highest recorded score</div>
        </div>
      </div>

      {/* Master Results Release & Anti-Malpractice Control Bar */}
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isGlobalReleased 
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
              : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
          }`}>
            {isGlobalReleased ? <Unlock size={20} /> : <Lock size={20} />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-extrabold text-white text-sm">Official CBT Score Release Control</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                isGlobalReleased 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {isGlobalReleased ? 'ALL RESULTS APPROVED & RELEASED' : 'SCORES WITHHELD (AUDIT IN PROGRESS)'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isGlobalReleased 
                ? 'Scores and answers are accessible to candidates via student login and official email dispatch.'
                : 'Raw scores and answers are blocked from candidate terminals pending administrative sign-off.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleGlobalRelease}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-lg shrink-0 ${
            isGlobalReleased
              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/25'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25'
          }`}
        >
          {isGlobalReleased ? <Lock size={14} /> : <Unlock size={14} />}
          <span>{isGlobalReleased ? 'Revoke / Withhold All Scores' : 'Approve & Release All Results'}</span>
        </button>
      </div>

      {/* Filters and Controls */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate name or reg number..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="All">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="In Progress">In Progress</option>
            <option value="Pending">Pending</option>
          </select>

          {/* Exam Type Filter */}
          <select
            value={examTypeFilter}
            onChange={(e) => setExamTypeFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="All">All Exam Types</option>
            <option value="JAMB UTME">JAMB UTME</option>
            <option value="WASSCE">WASSCE</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="score-desc">Highest Score First</option>
            <option value="score-asc">Lowest Score First</option>
            <option value="name">Candidate Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-700 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Candidate</th>
                <th className="py-3 px-4">Exam & Track</th>
                <th className="py-3 px-4">Status & Release</th>
                <th className="py-3 px-4 text-center">Score / 400</th>
                <th className="py-3 px-4 text-center">Percentage</th>
                <th className="py-3 px-4">Time Spent</th>
                <th className="py-3 px-4">Submitted</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No matching candidate records found.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map(cand => {
                  const res = cand.examResult;
                  const isCompleted = cand.status === 'Completed';

                  return (
                    <tr key={cand.id} className="hover:bg-slate-800/40 transition">
                      {/* Name & Reg */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-sm">{cand.fullName}</div>
                        <div className="font-mono text-[11px] text-sky-400">{cand.username}</div>
                        {cand.email && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[180px]">
                            {cand.email}
                          </div>
                        )}
                      </td>

                      {/* Exam & Track */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-200">{cand.examType || 'JAMB UTME'}</span>
                        <div className="text-[10px] text-slate-400">{cand.category || 'General'}</div>
                      </td>

                      {/* Status & Release Badge */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          cand.status === 'Completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : cand.status === 'In Progress'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse'
                            : 'bg-slate-700/50 text-slate-300 border border-slate-600'
                        }`}>
                          {cand.status === 'Completed' && <CheckCircle2 size={10} />}
                          {cand.status === 'In Progress' && <Clock size={10} />}
                          <span>{cand.status || 'Pending'}</span>
                        </span>
                        {isCompleted && (
                          <button
                            type="button"
                            onClick={() => handleToggleCandidateRelease(cand.id)}
                            className={`mt-1 flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold transition ${
                              cand.resultsReleased || isGlobalReleased
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                            title="Toggle release status for this candidate"
                          >
                            {cand.resultsReleased || isGlobalReleased ? <Unlock size={9} /> : <Lock size={9} />}
                            <span>{cand.resultsReleased || isGlobalReleased ? 'Released' : 'Withheld'}</span>
                          </button>
                        )}
                      </td>

                      {/* Score */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-sm">
                        {isCompleted && res ? (
                          <span className={res.totalScore >= 200 ? 'text-emerald-400' : 'text-amber-400'}>
                            {res.totalScore} <span className="text-[10px] text-slate-400">/ {res.maxScore || 400}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Percentage */}
                      <td className="py-3 px-4 text-center font-mono font-semibold">
                        {isCompleted && res ? (
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200">
                            {res.percentage}%
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Time Spent */}
                      <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">
                        {isCompleted && res?.timeSpentSeconds ? (
                          `${Math.floor(res.timeSpentSeconds / 60)}m ${res.timeSpentSeconds % 60}s`
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Submitted Date */}
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {isCompleted && res?.submittedAt ? (
                          new Date(res.submittedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Send Result Email if completed */}
                          {isCompleted && (
                            <button
                              onClick={() => setCandidateToSendEmail(cand)}
                              className="p-1.5 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[11px] font-semibold transition"
                              title="Send Official Scores & Question Breakdown to Candidate Email"
                            >
                              <Mail size={13} />
                            </button>
                          )}
                          {/* View Full Breakdown & Missed Questions */}
                          {isCompleted && (
                            <button
                              onClick={() => setReviewCandidate(cand)}
                              className="px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold transition flex items-center gap-1"
                              title="View Full Breakdown & Question-by-Question Review"
                            >
                              <Eye size={12} />
                              <span>Review</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleReset(cand.id, cand.fullName)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-400 border border-slate-700 text-[11px] transition"
                            title="Authorize Re-sit / Clear Result"
                          >
                            Re-sit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-sky-600 text-white px-5 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <Sparkles size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Official Score & Breakdown Dispatch Modal */}
      {candidateToSendEmail && (
        <SendResultEmailModal
          candidate={candidateToSendEmail}
          onClose={() => setCandidateToSendEmail(null)}
          onSentSuccess={(candId, email) => {
            updateCandidate(candId, { email, resultsReleased: true });
            loadData();
            showToast(`Result email dispatched to ${email}!`);
          }}
        />
      )}

      {/* Detailed Result Review Modal (All Questions, Missed Items & Explanations) */}
      {reviewCandidate && (
        <StudentResultReviewModal
          candidate={reviewCandidate}
          onClose={() => setReviewCandidate(null)}
        />
      )}

    </div>
  );
}
