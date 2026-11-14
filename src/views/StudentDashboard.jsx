import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, Award, TrendingUp, BarChart3, Clock, Calendar, 
  Play, CheckCircle2, XCircle, BookOpen, ArrowRight, User, Mail, 
  Key, Printer, RotateCcw, FileText, Sparkles, Filter, Layers, 
  LogOut, ExternalLink, ShieldCheck, HelpCircle, ChevronRight, 
  AlertCircle, Plus, Eye, Check, ChevronDown, ChevronUp
} from 'lucide-react';
import { 
  getAllSubjects, 
  getQuestionBank, 
  getScheduledExams, 
  getAvailableTopicsForSubject 
} from '../utils/storage';
import CandidateExamSlipModal from '../components/CandidateExamSlipModal';
import StudentResultReviewModal from '../components/StudentResultReviewModal';

const SUBJECT_PRESETS = [
  { name: 'Physical Sciences / Engineering', subjects: ['english', 'mathematics', 'physics', 'chemistry'] },
  { name: 'Biological / Medical Sciences', subjects: ['english', 'biology', 'chemistry', 'physics'] },
  { name: 'Social / Management Sciences', subjects: ['english', 'mathematics', 'economics', 'government'] },
  { name: 'Arts & Humanities', subjects: ['english', 'literature', 'government', 'economics'] },
  { name: 'Commercial & Business', subjects: ['english', 'mathematics', 'economics', 'commerce'] }
];

export default function StudentDashboard({ 
  student, 
  onStartExam, 
  onLogout 
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'new-exam' | 'history' | 'scheduled'
  const [selectedReviewAttempt, setSelectedReviewAttempt] = useState(null);
  const [showSlipModal, setShowSlipModal] = useState(false);
  
  // Custom Exam Builder States
  const [selectedExamType, setSelectedExamType] = useState('JAMB UTME'); // 'JAMB UTME' | 'WASSCE' | 'Topic Practice'
  const [selectedSubjects, setSelectedSubjects] = useState(
    student?.registeredSubjects && student.registeredSubjects.length > 0 
      ? student.registeredSubjects 
      : ['english', 'mathematics', 'physics', 'chemistry']
  );
  const [selectedTopics, setSelectedTopics] = useState({}); // { [subjectId]: string[] }
  const [examDuration, setExamDuration] = useState(120);

  const allSubjects = getAllSubjects();
  const allScheduledExams = getScheduledExams();

  // Multi-attempt exam history for this student
  const examHistory = Array.isArray(student?.examHistory) && student.examHistory.length > 0 
    ? student.examHistory 
    : (student?.examResult ? [student.examResult] : []);

  // Compute aggregated analytics across all attempts
  const totalAttempts = examHistory.length;
  
  const averagePercentage = totalAttempts > 0 
    ? Math.round(examHistory.reduce((acc, curr) => acc + (Number(curr.percentage) || 0), 0) / totalAttempts)
    : 0;

  const highestScore = totalAttempts > 0
    ? Math.max(...examHistory.map(h => Number(h.totalScore) || 0))
    : 0;

  const latestAttempt = examHistory[0] || null;

  const totalTimeSpentSeconds = examHistory.reduce((acc, curr) => acc + (Number(curr.timeSpentSeconds) || 0), 0);
  const totalHoursPracticed = (totalTimeSpentSeconds / 3600).toFixed(1);

  // Subject Mastery Matrix: Aggregate performance per subject across attempts
  const subjectMastery = (() => {
    const map = {};
    examHistory.forEach(att => {
      const scores = att.subjectScores || {};
      Object.entries(scores).forEach(([subId, data]) => {
        if (!map[subId]) {
          map[subId] = { correct: 0, total: 0, attemptsCount: 0 };
        }
        map[subId].correct += (Number(data.correct) || 0);
        map[subId].total += (Number(data.total) || 0);
        map[subId].attemptsCount++;
      });
    });

    return Object.entries(map).map(([subId, data]) => {
      const subObj = allSubjects.find(s => s.id === subId) || { name: subId.toUpperCase(), id: subId };
      const accuracy = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
      return {
        subId,
        name: subObj.name,
        accuracy,
        totalAnswered: data.total,
        correctCount: data.correct,
        attemptsCount: data.attemptsCount
      };
    }).sort((a, b) => b.accuracy - a.accuracy);
  })();

  const bestSubject = subjectMastery.length > 0 ? subjectMastery[0] : null;
  const weakestSubject = subjectMastery.length > 1 ? subjectMastery[subjectMastery.length - 1] : null;

  // Handle Exam Launch from Dashboard
  const handleLaunchConfiguredExam = (overrideConfig = null) => {
    if (overrideConfig) {
      onStartExam(overrideConfig);
      return;
    }

    // Default configured exam
    const hasTopicFilter = Object.values(selectedTopics).some(list => list && list.length > 0);
    let customQuestions = null;

    if (hasTopicFilter) {
      customQuestions = {};
      const bank = getQuestionBank();
      selectedSubjects.forEach(subId => {
        const available = bank[subId] || [];
        const targeted = selectedTopics[subId] || [];
        if (targeted.length > 0) {
          const filtered = available.filter(q => q.topic && targeted.includes(q.topic.trim()));
          customQuestions[subId] = filtered.length > 0 ? filtered : available;
        } else {
          customQuestions[subId] = available;
        }
      });
    }

    const config = {
      examType: selectedExamType === 'Topic Practice' ? 'Custom Topic Drill' : selectedExamType,
      candidateName: student.fullName,
      candidateReg: student.username,
      candidateId: student.id,
      candidateEmail: student.email || '',
      category: selectedExamType === 'Topic Practice' ? 'Targeted Topic Practice' : 'Online Self-Service',
      isCandidateSession: true,
      isSelfRegistered: true,
      showImmediateResult: true,
      subjects: selectedSubjects,
      durationMinutes: Number(examDuration),
      isScheduled: false,
      scheduledExamId: null,
      questionsBySubject: customQuestions
    };

    onStartExam(config);
  };

  const handleLaunchScheduledExam = (exam) => {
    const config = {
      examType: exam.examType?.toUpperCase() || 'JAMB UTME',
      candidateName: student.fullName,
      candidateReg: student.username,
      candidateId: student.id,
      candidateEmail: student.email || '',
      category: 'Institution Scheduled Mock',
      isCandidateSession: true,
      isSelfRegistered: true,
      showImmediateResult: true,
      subjects: exam.subjectIds || ['english', 'mathematics', 'physics', 'chemistry'],
      durationMinutes: exam.durationMinutes || 120,
      isScheduled: true,
      scheduledExamId: exam.id,
      questionsBySubject: exam.questionsBySubject || null
    };

    onStartExam(config);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      
      {/* Top Student Navigation Bar */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          
          {/* Identity & Portal Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-emerald-400 flex items-center justify-center text-white font-black text-lg shadow-md shadow-sky-500/20">
              {student.fullName?.charAt(0)?.toUpperCase() || 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">{student.fullName}</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center gap-1">
                  <ShieldCheck size={11} />
                  <span>Student Portal</span>
                </span>
                {student.email && (
                  <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                    Google Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                <span>Reg: <strong className="text-sky-300 font-bold">{student.username}</strong></span>
                <span>•</span>
                <span>Passcode: <strong className="text-amber-400 font-bold">{student.password}</strong></span>
                {student.email && (
                  <>
                    <span>•</span>
                    <span className="text-slate-300 truncate max-w-[200px]">{student.email}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setShowSlipModal(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
              title="Print official candidate docket"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">Exam Docket</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('new-exam');
                window.scrollTo({ top: 350, behavior: 'smooth' });
              }}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/25 transition hover:scale-[1.02]"
            >
              <Play size={13} className="fill-white" />
              <span>Take New Exam</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 hover:border-rose-500 text-xs font-bold flex items-center gap-1.5 transition"
              title="Sign out of student account"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>

        </div>

        {/* View Switcher Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 border-t border-slate-800/80 pt-1 overflow-x-auto">
          {[
            { id: 'overview', label: 'Performance & Dashboard', icon: BarChart3 },
            { id: 'new-exam', label: 'Take An Examination', icon: Play },
            { id: 'history', label: `My Exam History (${totalAttempts})`, icon: Clock },
            { id: 'scheduled', label: `Scheduled Mocks (${allScheduledExams.length})`, icon: Calendar }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-sky-400 text-sky-400 bg-sky-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        
        {/* ========================================================================= */}
        {/* TAB 1: OVERVIEW & PERFORMANCE TRACKER                                     */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            
            {/* Welcome & Launch Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-900/40 via-indigo-900/40 to-slate-900 border border-sky-500/30 p-6 sm:p-8 shadow-2xl">
              <div className="max-w-3xl space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-300 text-xs font-bold">
                  <Sparkles size={13} className="text-sky-400" />
                  <span>Personalized Exam Portal</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Ready to test yourself, {student.fullName.split(' ')[0]}?
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  You can take unlimited JAMB UTME mock exams, practice custom topic drills, or join scheduled institutional sessions. All your scores, performance metrics, and question corrections are automatically recorded below.
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('new-exam')}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-400 hover:from-sky-400 hover:to-emerald-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-sky-500/30 transition hover:scale-[1.02]"
                  >
                    <Play size={16} className="fill-slate-950" />
                    <span>Choose an Exam to Start</span>
                    <ArrowRight size={16} />
                  </button>

                  {latestAttempt && (
                    <button
                      type="button"
                      onClick={() => setSelectedReviewAttempt(latestAttempt)}
                      className="px-4 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition"
                    >
                      <Eye size={15} />
                      <span>Review Latest Test Corrections ({latestAttempt.totalScore}/{latestAttempt.maxScore})</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Performance KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                  <span>Exams Completed</span>
                  <BookOpen size={16} className="text-sky-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                  {totalAttempts}
                </div>
                <p className="text-[11px] text-slate-400">Total mock sessions taken</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                  <span>Average Score</span>
                  <TrendingUp size={16} className="text-emerald-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                  {averagePercentage}%
                </div>
                <p className="text-[11px] text-slate-400">Mean accuracy across all tests</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                  <span>Personal Best</span>
                  <Award size={16} className="text-amber-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                  {highestScore}
                  <span className="text-xs font-normal text-slate-400"> / 400</span>
                </div>
                <p className="text-[11px] text-slate-400">Highest aggregate mark achieved</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                  <span>Practice Time</span>
                  <Clock size={16} className="text-indigo-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-indigo-300 font-mono">
                  {totalHoursPracticed}
                  <span className="text-xs font-normal text-slate-400"> hrs</span>
                </div>
                <p className="text-[11px] text-slate-400">Total CBT test seat time</p>
              </div>

            </div>

            {/* Subject Mastery Matrix & Score Trend Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left 2 Cols: Subject Mastery Breakdown */}
              <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <BarChart3 size={18} className="text-sky-400" />
                    <h3 className="font-bold text-white text-sm sm:text-base">Subject Mastery & Accuracy Breakdown</h3>
                  </div>
                  <span className="text-xs text-slate-400">Aggregated from all attempts</span>
                </div>

                {subjectMastery.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    No subject history yet. Take your first mock exam above to see your mastery metrics!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {subjectMastery.map(sub => (
                      <div key={sub.subId} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-200">{sub.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 text-[11px] font-mono">
                              {sub.correctCount} / {sub.totalAnswered} Correct ({sub.attemptsCount} tests)
                            </span>
                            <span className={`font-mono font-bold text-xs ${
                              sub.accuracy >= 70 ? 'text-emerald-400' :
                              sub.accuracy >= 50 ? 'text-amber-400' : 'text-rose-400'
                            }`}>
                              {sub.accuracy}%
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              sub.accuracy >= 70 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
                              sub.accuracy >= 50 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
                              'bg-gradient-to-r from-rose-500 to-red-400'
                            }`}
                            style={{ width: `${Math.max(5, sub.accuracy)}%` }}
                          />
                        </div>
                      </div>
                    ))}

                    {/* Insights Summary */}
                    <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {bestSubject && (
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-start gap-2">
                          <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <strong>Strongest Subject: {bestSubject.name}</strong>
                            <p className="text-[11px] text-emerald-400/80 mt-0.5">High consistency with {bestSubject.accuracy}% accuracy.</p>
                          </div>
                        </div>
                      )}
                      {weakestSubject && weakestSubject.subId !== bestSubject?.subId && (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-start gap-2">
                          <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <strong>Focus Area: {weakestSubject.name}</strong>
                            <p className="text-[11px] text-amber-400/80 mt-0.5">Focus topic drills on this subject to lift your aggregate score.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Col: Score Progression & Quick Start Card */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-white font-bold text-sm">
                    <TrendingUp size={16} className="text-emerald-400" />
                    <span>Score Progression Log</span>
                  </div>

                  {examHistory.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 text-xs">
                      Your score progression will appear here after taking your exams.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800/80 mt-2 space-y-2">
                      {examHistory.slice(0, 5).map((att, idx) => (
                        <div key={att.id || idx} className="pt-2 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-white block">Attempt #{examHistory.length - idx}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {att.submittedAt ? new Date(att.submittedAt).toLocaleDateString() : 'Recent'} • {att.examType || 'JAMB UTME'}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-sky-400 text-sm">
                              {att.totalScore} <span className="text-[10px] text-slate-400">/ {att.maxScore || 400}</span>
                            </span>
                            <span className="block text-[10px] text-emerald-400 font-semibold">{att.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveTab('new-exam')}
                    className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-sky-600 hover:bg-sky-500 text-white flex items-center justify-center gap-2 transition shadow-md"
                  >
                    <Plus size={14} />
                    <span>Take Another Exam Attempt</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Recent Exam Attempts Table */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 font-bold text-white text-sm sm:text-base">
                  <Clock size={16} className="text-sky-400" />
                  <span>Recent Examination Sessions & Question Reviews</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 transition"
                >
                  <span>View All ({totalAttempts})</span>
                  <ChevronRight size={13} />
                </button>
              </div>

              {examHistory.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No exams completed yet. Click <strong>Take New Exam</strong> above to get started!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                        <th className="py-2.5 px-3">Date & Time</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Aggregate Score</th>
                        <th className="py-2.5 px-3">Accuracy</th>
                        <th className="py-2.5 px-3">Time Spent</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {examHistory.slice(0, 5).map((attempt, index) => {
                        const dateStr = attempt.submittedAt 
                          ? new Date(attempt.submittedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                          : 'Recent';
                        const timeStr = attempt.submittedAt
                          ? new Date(attempt.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '';
                        const minutes = Math.round((attempt.timeSpentSeconds || 0) / 60);

                        return (
                          <tr key={attempt.id || index} className="hover:bg-slate-800/40 transition">
                            <td className="py-3 px-3 text-slate-300 font-sans">
                              <span className="font-semibold block">{dateStr}</span>
                              <span className="text-[10px] text-slate-500 font-mono">{timeStr}</span>
                            </td>
                            <td className="py-3 px-3 font-sans">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                {attempt.examType || 'JAMB UTME'}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <strong className="text-white text-sm font-bold">{attempt.totalScore}</strong>
                              <span className="text-slate-400 text-[10px]"> / {attempt.maxScore || 400}</span>
                            </td>
                            <td className="py-3 px-3 font-sans">
                              <span className={`font-bold ${
                                attempt.percentage >= 70 ? 'text-emerald-400' :
                                attempt.percentage >= 50 ? 'text-amber-400' : 'text-rose-400'
                              }`}>
                                {attempt.percentage}%
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-400 font-sans">
                              {minutes} Mins
                            </td>
                            <td className="py-3 px-3 text-right font-sans">
                              <button
                                type="button"
                                onClick={() => setSelectedReviewAttempt(attempt)}
                                className="px-3 py-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white border border-sky-500/30 text-xs font-bold transition inline-flex items-center gap-1.5"
                              >
                                <Eye size={12} />
                                <span>Review Questions</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: TAKE AN EXAMINATION (Choose any mock, topic drill, or scheduled)    */}
        {/* ========================================================================= */}
        {activeTab === 'new-exam' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Choose Examination Category</h2>
              <p className="text-xs text-slate-400 mt-1">
                Select your preferred examination format, customize your subjects, or practice focused topics.
              </p>
            </div>

            {/* 3 Main Choice Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Card 1: JAMB UTME Full Mock */}
              <div 
                onClick={() => {
                  setSelectedExamType('JAMB UTME');
                  setExamDuration(120);
                }}
                className={`p-6 rounded-3xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                  selectedExamType === 'JAMB UTME'
                    ? 'bg-gradient-to-b from-sky-950/60 to-slate-900 border-sky-500 ring-2 ring-sky-500/30 shadow-xl'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center">
                    <GraduationCap size={24} />
                  </div>
                  <h3 className="text-lg font-extrabold text-white">JAMB UTME Mock</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Standard unified tertiary examination simulation. English (60 questions) + 3 electives (40 questions each) totaling 180 questions in 120 minutes.
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-sky-300 font-mono">
                    <span>180 Questions</span>
                    <span>•</span>
                    <span>120 Minutes</span>
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-slate-800/80">
                  <span className={`text-xs font-bold flex items-center gap-1 ${
                    selectedExamType === 'JAMB UTME' ? 'text-sky-400' : 'text-slate-400'
                  }`}>
                    {selectedExamType === 'JAMB UTME' ? 'Selected Track' : 'Click to Select'}
                    <ChevronRight size={14} />
                  </span>
                </div>
              </div>

              {/* Card 2: WASSCE / WAEC Standard Mock */}
              <div 
                onClick={() => {
                  setSelectedExamType('WASSCE');
                  setExamDuration(150);
                }}
                className={`p-6 rounded-3xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                  selectedExamType === 'WASSCE'
                    ? 'bg-gradient-to-b from-emerald-950/60 to-slate-900 border-emerald-500 ring-2 ring-emerald-500/30 shadow-xl'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                    <Award size={24} />
                  </div>
                  <h3 className="text-lg font-extrabold text-white">WASSCE / WAEC Mock</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Senior School Certificate Examination simulation. Comprehensive multi-subject evaluation with A1 to F9 performance grading scale.
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-emerald-300 font-mono">
                    <span>Multi-Subject Drill</span>
                    <span>•</span>
                    <span>150 Minutes</span>
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-slate-800/80">
                  <span className={`text-xs font-bold flex items-center gap-1 ${
                    selectedExamType === 'WASSCE' ? 'text-emerald-400' : 'text-slate-400'
                  }`}>
                    {selectedExamType === 'WASSCE' ? 'Selected Track' : 'Click to Select'}
                    <ChevronRight size={14} />
                  </span>
                </div>
              </div>

              {/* Card 3: Targeted Topic Practice Drill */}
              <div 
                onClick={() => {
                  setSelectedExamType('Topic Practice');
                  setExamDuration(45);
                }}
                className={`p-6 rounded-3xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                  selectedExamType === 'Topic Practice'
                    ? 'bg-gradient-to-b from-indigo-950/60 to-slate-900 border-indigo-500 ring-2 ring-indigo-500/30 shadow-xl'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                    <Layers size={24} />
                  </div>
                  <h3 className="text-lg font-extrabold text-white">Targeted Topic Drill</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Filter questions by specific syllabus topics (e.g., Algebra, Kinematics, Chemical Bonding) to strengthen your weak areas before the main mock.
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-indigo-300 font-mono">
                    <span>Focused Syllabus Topics</span>
                    <span>•</span>
                    <span>45 Minutes</span>
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-slate-800/80">
                  <span className={`text-xs font-bold flex items-center gap-1 ${
                    selectedExamType === 'Topic Practice' ? 'text-indigo-400' : 'text-slate-400'
                  }`}>
                    {selectedExamType === 'Topic Practice' ? 'Selected Track' : 'Click to Select'}
                    <ChevronRight size={14} />
                  </span>
                </div>
              </div>

            </div>

            {/* Subject Configuration Card */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-extrabold text-white">Select Examination Subjects</h3>
                  <p className="text-xs text-slate-400">
                    {selectedExamType === 'JAMB UTME' 
                      ? 'JAMB UTME requires English (compulsory) + 3 elective subjects.'
                      : 'Choose your subject combination.'}
                  </p>
                </div>

                {/* Preset Combinations Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Presets:</span>
                  <select
                    onChange={(e) => {
                      const idx = Number(e.target.value);
                      if (idx >= 0 && SUBJECT_PRESETS[idx]) {
                        setSelectedSubjects(SUBJECT_PRESETS[idx].subjects);
                      }
                    }}
                    className="py-1.5 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500"
                  >
                    <option value="-1">Custom Selection</option>
                    {SUBJECT_PRESETS.map((p, i) => (
                      <option key={i} value={i}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subject Pills Selection */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {allSubjects.map(sub => {
                  const isSelected = selectedSubjects.includes(sub.id);
                  const isEnglishInJamb = selectedExamType === 'JAMB UTME' && sub.id === 'english';

                  return (
                    <button
                      key={sub.id}
                      type="button"
                      disabled={isEnglishInJamb}
                      onClick={() => {
                        if (isSelected) {
                          if (selectedSubjects.length <= 1) return;
                          setSelectedSubjects(selectedSubjects.filter(id => id !== sub.id));
                        } else {
                          if (selectedExamType === 'JAMB UTME' && selectedSubjects.length >= 4) {
                            setSelectedSubjects([...selectedSubjects.slice(0, 3), sub.id]);
                            return;
                          }
                          setSelectedSubjects([...selectedSubjects, sub.id]);
                        }
                      }}
                      className={`p-3 rounded-2xl border text-left transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-sky-500/20 border-sky-500 text-white shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs">{sub.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {sub.id === 'english' ? '60 Questions' : '40 Questions'}
                        </div>
                      </div>
                      {isSelected && (
                        <Check size={16} className="text-sky-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Topic Filter for Topic Practice */}
              {selectedExamType === 'Topic Practice' && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                    <Filter size={14} className="text-indigo-400" />
                    <span>Select Specific Topics to Practice</span>
                  </div>
                  <div className="space-y-3">
                    {selectedSubjects.map(subId => {
                      const sub = allSubjects.find(s => s.id === subId);
                      const topics = getAvailableTopicsForSubject(subId);
                      const currentSelected = selectedTopics[subId] || [];

                      return (
                        <div key={subId} className="space-y-1.5 p-3 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-xs font-bold text-slate-200 block">{sub?.name || subId} Topics:</span>
                          {topics.length === 0 ? (
                            <span className="text-[11px] text-slate-500 italic">No specific topic tags set; all questions will be included.</span>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {topics.map(t => {
                                const isChecked = currentSelected.includes(t.name);
                                return (
                                  <button
                                    key={t.name}
                                    type="button"
                                    onClick={() => {
                                      const updated = isChecked 
                                        ? currentSelected.filter(x => x !== t.name)
                                        : [...currentSelected, t.name];
                                      setSelectedTopics(prev => ({ ...prev, [subId]: updated }));
                                    }}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition ${
                                      isChecked
                                        ? 'bg-indigo-600 text-white border-indigo-500'
                                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                                    }`}
                                  >
                                    {t.name} ({t.count})
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Start Button */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800">
                <div className="text-xs text-slate-400">
                  Selected: <strong className="text-white">{selectedExamType}</strong> with{' '}
                  <strong className="text-sky-300">{selectedSubjects.length} Subjects</strong> ({examDuration} Mins)
                </div>

                <button
                  type="button"
                  onClick={() => handleLaunchConfiguredExam()}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 transition hover:scale-[1.02]"
                >
                  <Play size={16} className="fill-slate-950" />
                  <span>Launch Examination Hall Now</span>
                  <ArrowRight size={16} />
                </button>
              </div>

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: MY EXAM HISTORY & COMPREHENSIVE RECORDS LOG                       */}
        {/* ========================================================================= */}
        {activeTab === 'history' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Examination History & Score Log</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Full record of all your mock tests. Review your answers, see correct solutions, and read detailed explanations.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('new-exam')}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 transition self-start sm:self-auto"
              >
                <Plus size={14} />
                <span>Take Another Exam</span>
              </button>
            </div>

            {examHistory.length === 0 ? (
              <div className="py-16 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                <Clock size={36} className="text-slate-500 mx-auto" />
                <h3 className="text-base font-bold text-white">No Exam Records Found</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  You haven't completed any mock examinations on this account yet. Click the button below to take your first test!
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('new-exam')}
                  className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition"
                >
                  Start Your First Mock
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {examHistory.map((att, index) => {
                  const dateStr = att.submittedAt 
                    ? new Date(att.submittedAt).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                    : 'Recent';
                  const timeStr = att.submittedAt
                    ? new Date(att.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '';
                  const minutes = Math.round((att.timeSpentSeconds || 0) / 60);

                  return (
                    <div 
                      key={att.id || index}
                      className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition shadow-lg space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm ${
                            att.percentage >= 70 ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400' :
                            att.percentage >= 50 ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400' :
                            'bg-rose-500/15 border border-rose-500/30 text-rose-400'
                          }`}>
                            {att.percentage}%
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-white text-sm">
                                {att.examType || 'JAMB UTME Mock'} Attempt #{examHistory.length - index}
                              </h4>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                                Completed
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5 font-mono">
                              {dateStr} at {timeStr} • Spent: {minutes} mins
                            </p>
                          </div>
                        </div>

                        {/* Total Score Badge */}
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Aggregate Score</span>
                          <strong className="text-lg font-black text-sky-400 font-mono">
                            {att.totalScore} <span className="text-xs font-normal text-slate-400">/ {att.maxScore || 400}</span>
                          </strong>
                        </div>
                      </div>

                      {/* Subject Scores Breakdown Pills */}
                      {att.subjectScores && Object.keys(att.subjectScores).length > 0 && (
                        <div className="flex flex-wrap gap-2 text-xs">
                          {Object.entries(att.subjectScores).map(([subId, sc]) => (
                            <span 
                              key={subId}
                              className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1.5"
                            >
                              <span className="font-medium capitalize">{allSubjects.find(s => s.id === subId)?.name || subId}:</span>
                              <strong className="font-mono text-sky-300">{sc.correct}/{sc.total}</strong>
                              <span className="text-[10px] text-slate-400 font-mono">({sc.score || 0} pts)</span>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => setSelectedReviewAttempt(att)}
                          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                        >
                          <Eye size={14} />
                          <span>Review Full Questions & Explanations</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: SCHEDULED INSTITUTIONAL MOCKS                                      */}
        {/* ========================================================================= */}
        {activeTab === 'scheduled' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Active & Upcoming Scheduled Mocks</h2>
              <p className="text-xs text-slate-400 mt-1">
                Official institution batch exams scheduled by the administrator. If the session window is open, you can enter directly.
              </p>
            </div>

            {allScheduledExams.length === 0 ? (
              <div className="py-16 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
                <Calendar size={36} className="text-slate-500 mx-auto" />
                <h3 className="text-base font-bold text-white">No Scheduled Exam Batches Currently Active</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  The admin has not published any live batch mocks right now. You can take any on-demand JAMB or WASSCE mock in the <strong>Take An Examination</strong> tab!
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('new-exam')}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition"
                >
                  Go to On-Demand Mocks
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {allScheduledExams.map(exam => {
                  const now = new Date();
                  const start = new Date(exam.startsAt);
                  const end = new Date(exam.endsAt);
                  const isOpen = now >= start && now <= end;
                  const isUpcoming = now < start;
                  const isExpired = now > end;

                  return (
                    <div 
                      key={exam.id}
                      className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 flex flex-col justify-between shadow-lg"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                            Batch {exam.batch || 'General'}
                          </span>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isOpen 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse' :
                            isUpcoming 
                              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' :
                              'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            {isOpen ? '● Live Session Open' : isUpcoming ? 'Scheduled Upcoming' : 'Session Closed'}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-white">{exam.title}</h3>
                          <p className="text-xs text-slate-400 font-mono mt-1">
                            Type: {exam.examType || 'JAMB UTME'} • Duration: {exam.durationMinutes || 120} Mins
                          </p>
                        </div>

                        {/* Time Windows */}
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                          <div className="flex justify-between text-slate-400">
                            <span>Window Opens:</span>
                            <strong className="text-slate-200 font-mono">{start.toLocaleDateString()} {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Window Closes:</span>
                            <strong className="text-slate-200 font-mono">{end.toLocaleDateString()} {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                          </div>
                        </div>

                        {/* Subjects */}
                        <div className="flex flex-wrap gap-1.5">
                          {(exam.subjectIds || []).map(sId => (
                            <span key={sId} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] capitalize">
                              {allSubjects.find(s => s.id === sId)?.name || sId}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-800">
                        {isOpen ? (
                          <button
                            type="button"
                            onClick={() => handleLaunchScheduledExam(exam)}
                            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition hover:scale-[1.01]"
                          >
                            <Play size={14} className="fill-white" />
                            <span>Enter Scheduled Mock Exam Now</span>
                          </button>
                        ) : isUpcoming ? (
                          <div className="text-center py-2 text-xs text-sky-400 font-medium">
                            Examination window has not opened yet.
                          </div>
                        ) : (
                          <div className="text-center py-2 text-xs text-slate-500">
                            This session has expired.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Review Past Attempt Modal */}
      {selectedReviewAttempt && (
        <StudentResultReviewModal
          candidate={{
            ...student,
            examResult: selectedReviewAttempt
          }}
          onClose={() => setSelectedReviewAttempt(null)}
        />
      )}

      {/* Official Candidate Docket Slip Modal */}
      {showSlipModal && (
        <CandidateExamSlipModal
          candidate={student}
          onClose={() => setShowSlipModal(false)}
        />
      )}

    </div>
  );
}
