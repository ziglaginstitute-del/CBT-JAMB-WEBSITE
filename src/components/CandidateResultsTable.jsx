import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Download, Search, RefreshCw, Filter, 
  CheckCircle2, Clock, AlertTriangle, ArrowUpDown, Award, 
  ChevronRight, Users, Sparkles, BookOpen 
} from 'lucide-react';
import { getCandidates, resetCandidateExam } from '../utils/storage';
import { SUBJECTS } from '../data/questions';

export default function CandidateResultsTable() {
  const [candidates, setCandidates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [examTypeFilter, setExamTypeFilter] = useState('All');
  const [sortBy, setSortBy] = useState('score-desc');
  const [selectedCandidateDetail, setSelectedCandidateDetail] = useState(null);

  const loadData = () => {
    setCandidates(getCandidates());
  };

  useEffect(() => {
    loadData();
  }, []);

  const getSubjectName = (subId) => {
    return SUBJECTS.find(s => s.id === subId)?.name || subId;
  };

  const handleReset = (candidateId, name) => {
    if (window.confirm(`Are you sure you want to authorize a re-sit for ${name}? Their recorded exam score will be cleared.`)) {
      resetCandidateExam(candidateId);
      loadData();
    }
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
                <th className="py-3 px-4">Status</th>
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
                      </td>

                      {/* Exam & Track */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-200">{cand.examType || 'JAMB UTME'}</span>
                        <div className="text-[10px] text-slate-400">{cand.category || 'General'}</div>
                      </td>

                      {/* Status */}
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
                          {isCompleted && (
                            <button
                              onClick={() => setSelectedCandidateDetail(cand)}
                              className="px-2 py-1 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[11px] font-semibold transition"
                              title="View Subject Breakdown"
                            >
                              Breakdown
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

      {/* Subject Breakdown Detail Modal */}
      {selectedCandidateDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-base">{selectedCandidateDetail.fullName}</h3>
                <p className="text-xs text-sky-400 font-mono">{selectedCandidateDetail.username}</p>
              </div>
              <button
                onClick={() => setSelectedCandidateDetail(null)}
                className="text-slate-400 hover:text-white text-sm px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs text-slate-300 bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                <span>Total Score: <strong className="text-emerald-400 font-mono text-sm">{selectedCandidateDetail.examResult?.totalScore}</strong> / {selectedCandidateDetail.examResult?.maxScore || 400}</span>
                <span>Percentage: <strong className="text-purple-400 font-mono">{selectedCandidateDetail.examResult?.percentage}%</strong></span>
              </div>

              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Subject-by-Subject Breakdown</h4>
              <div className="space-y-2">
                {selectedCandidateDetail.examResult?.subjectScores && Object.entries(selectedCandidateDetail.examResult.subjectScores).map(([subId, sc]) => (
                  <div key={subId} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40 border border-slate-700 text-xs">
                    <span className="font-semibold text-white capitalize">{getSubjectName(subId)}</span>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-slate-400">{sc.correct} / {sc.total} correct</span>
                      <span className="text-emerald-400 font-bold">{sc.score}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedCandidateDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
