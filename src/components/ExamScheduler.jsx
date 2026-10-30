import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Key, Plus, Users, Award, 
  Trash2, Eye, Copy, CheckCircle2, AlertTriangle, 
  Sparkles, Check, X, FileText, ChevronRight, Play, BookOpen, Layers, Filter
} from 'lucide-react';
import { 
  getScheduledExams, addScheduledExam, 
  deleteScheduledExam, getQuestionBank,
  syncFromSupabase, getAllSubjects 
} from '../utils/storage';
import { SUBJECTS } from '../data/questions';
import { getTargetQuestionCountForSubject, DEFAULT_MOCK_QUESTION_COUNTS } from '../data/defaultSettings';

export default function ExamScheduler({ onDirectLaunchExam }) {
  const [exams, setExams] = useState(() => getScheduledExams());
  const [allSubjects, setAllSubjects] = useState(() => getAllSubjects());
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [viewingSubmissionsExam, setViewingSubmissionsExam] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [examType, setExamType] = useState('jamb');
  const [accessCode, setAccessCode] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState(['english', 'mathematics', 'physics', 'chemistry']);
  const [questionSelectionMode, setQuestionSelectionMode] = useState('jamb_standard'); // 'jamb_standard' | 'topic_filter' | 'all'
  const [subjectQuestionCounts, setSubjectQuestionCounts] = useState({
    english: 60,
    defaultOther: 40
  });
  const [selectedTopics, setSelectedTopics] = useState({}); // { [subId]: string[] }
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadExams();
    initDefaultDates();
    setAllSubjects(getAllSubjects());
  }, []);

  const loadExams = () => {
    setExams(getScheduledExams());
    setAllSubjects(getAllSubjects());
    syncFromSupabase().then(() => {
      setExams(getScheduledExams());
      setAllSubjects(getAllSubjects());
    }).catch(() => {});
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const generateRandomPin = () => {
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    setAccessCode(pin);
  };

  const initDefaultDates = () => {
    const now = new Date();
    const startStr = now.toISOString().slice(0, 16);
    const end = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const endStr = end.toISOString().slice(0, 16);

    setStartsAt(startStr);
    setEndsAt(endStr);
    generateRandomPin();
  };

  const handleOpenCreate = () => {
    setTitle('Statewide UTME Mock - Batch ' + String.fromCharCode(65 + Math.floor(Math.random() * 6)));
    generateRandomPin();
    initDefaultDates();
    setSelectedSubjects(['english', 'mathematics', 'physics', 'chemistry']);
    setSubjectQuestionCounts({
      english: 60,
      defaultOther: 40
    });
    setQuestionSelectionMode('jamb_standard');
    setSelectedTopics({});
    setFormError('');
    setIsCreatorOpen(true);
  };

  const toggleSubject = (subId) => {
    if (examType === 'jamb' && subId === 'english') return;
    if (selectedSubjects.includes(subId)) {
      if (selectedSubjects.length <= 1) return;
      setSelectedSubjects(selectedSubjects.filter(id => id !== subId));
    } else {
      if (examType === 'jamb' && selectedSubjects.length >= 4) {
        setFormError('JAMB exams require exactly 4 subjects.');
        return;
      }
      setSelectedSubjects([...selectedSubjects, subId]);
      setFormError('');
    }
  };

  const handleQuestionCountChange = (subId, count) => {
    const num = Math.max(1, Math.min(200, parseInt(count, 10) || 1));
    setSubjectQuestionCounts(prev => ({
      ...prev,
      [subId]: num
    }));
  };

  const getAvailableTopicsForSubject = (subId) => {
    const bank = getQuestionBank();
    const list = bank[subId] || [];
    const topics = new Set();
    list.forEach(q => {
      if (q.topic && q.topic.trim()) topics.add(q.topic.trim());
    });
    return Array.from(topics);
  };

  const toggleTopicSelection = (subId, topic) => {
    setSelectedTopics(prev => {
      const current = prev[subId] || [];
      const updated = current.includes(topic)
        ? current.filter(t => t !== topic)
        : [...current, topic];
      return { ...prev, [subId]: updated };
    });
  };

  const handleCreateExam = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Exam title is required.');
      return;
    }
    if (examType === 'jamb' && selectedSubjects.length !== 4) {
      setFormError('JAMB exams must have exactly 4 subjects selected.');
      return;
    }
    if (new Date(endsAt) <= new Date(startsAt)) {
      setFormError('End time must be after Start time.');
      return;
    }

    // Pull questions from dynamic question bank
    const bank = getQuestionBank();
    const questionsBySubject = {};

    selectedSubjects.forEach(subId => {
      const available = bank[subId] || [];
      let pool = [...available];

      // If topic filter mode is selected and topics were checked
      const topicsForSub = selectedTopics[subId];
      if (questionSelectionMode === 'topic_filter' && topicsForSub && topicsForSub.length > 0) {
        pool = pool.filter(q => q.topic && topicsForSub.includes(q.topic));
      }

      // Determine target question count for this subject (default 60 for English, 40 for others)
      const targetCount = Number(subjectQuestionCounts[subId]) || (subId === 'english' ? 60 : (subjectQuestionCounts.defaultOther || 40));

      let selectedList = pool.slice(0, targetCount);
      // Fallback if topic filtering resulted in 0 questions
      if (selectedList.length === 0 && available.length > 0) {
        selectedList = available.slice(0, targetCount);
      }

      questionsBySubject[subId] = selectedList;
    });

    const finalPin = accessCode.trim().replace(/[^0-9]/g, '') || Math.floor(100000 + Math.random() * 900000).toString();

    const newExamPayload = {
      title: title.trim(),
      accessCode: finalPin,
      examType,
      subjectIds: selectedSubjects,
      durationMinutes: Number(durationMinutes),
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
      questionCounts: subjectQuestionCounts,
      selectionStrategy: questionSelectionMode,
      questionsBySubject,
      submissions: []
    };

    addScheduledExam(newExamPayload);
    loadExams();
    setIsCreatorOpen(false);
    showToast(`Batch Exam "${title}" scheduled successfully!`);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this scheduled exam and all its candidate grade records?')) {
      deleteScheduledExam(id);
      loadExams();
      showToast('Scheduled exam deleted.');
    }
  };

  const copyPin = (pin) => {
    navigator.clipboard?.writeText(pin);
    showToast(`Access PIN ${pin} copied to clipboard!`);
  };

  // Exam Status Helper
  const getExamStatus = (exam) => {
    try {
      const now = new Date();
      const start = new Date(exam.startsAt || Date.now());
      const end = new Date(exam.endsAt || Date.now() + 86400000);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return { 
          label: 'Active Now', 
          color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/40',
          detail: 'Active Session'
        };
      }

      if (now < start) {
        return { 
          label: 'Upcoming', 
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
          detail: `Starts ${start.toLocaleDateString()} ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        };
      }
      if (now > end) {
        return { 
          label: 'Expired', 
          color: 'text-slate-400 bg-slate-800 border-slate-700',
          detail: `Ended ${end.toLocaleDateString()}`
        };
      }
      return { 
        label: 'Active Now', 
        color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/40 animate-pulse',
        detail: `Closes ${end.toLocaleDateString()} ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      };
    } catch {
      return { 
        label: 'Active Now', 
        color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/40',
        detail: 'Active Session'
      };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-sky-600 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in duration-150">
          <CheckCircle2 size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-sky-500/15 text-sky-400 border border-sky-500/30">
              Exam Scheduler & Administration
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Scheduled Mock Examinations
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Create time-restricted institutional mock exams with secure 6-digit access PINs. Monitor real-time candidate attendance, submissions, and aggregate scores.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-sky-600/30 transition hover:scale-[1.02]"
        >
          <Plus size={16} />
          <span>Schedule New Exam</span>
        </button>
      </div>

      {/* Exams Grid / Table */}
      <div className="space-y-4">
        {exams.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
            <Calendar size={40} className="mx-auto text-slate-600" />
            <h3 className="text-lg font-bold text-white">No scheduled mock exams</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              Schedule your first mock examination to issue access PINs to students and track institutional results.
            </p>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5"
            >
              <Plus size={15} />
              <span>Schedule First Exam</span>
            </button>
          </div>
        ) : (
          exams.map((exam) => {
            const status = getExamStatus(exam);
            const totalSubmissions = exam.submissions?.length || 0;
            const avgScore = totalSubmissions > 0
              ? Math.round(exam.submissions.reduce((a, b) => a + (b.totalScore || 0), 0) / totalSubmissions)
              : 0;

            const subjectList = allSubjects && allSubjects.length > 0 ? allSubjects : (SUBJECTS || []);
            const subjectNames = (exam.subjectIds || [])
              .map(id => subjectList.find(s => s.id === id)?.name || id)
              .join(' • ');

            return (
              <div
                key={exam.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 hover:border-slate-700 transition"
              >
                {/* Row 1: Status & Title & PIN */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${status.color}`}>
                        {status.label}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-sky-400 border border-slate-700">
                        {exam.examType?.toUpperCase()}
                      </span>
                      <span className="text-xs text-slate-400">
                        {status.detail}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white">
                      {exam.title}
                    </h3>
                  </div>

                  {/* Access PIN Badge */}
                  <div className="flex items-center gap-2">
                    <div className="bg-slate-950 border border-sky-500/30 px-3.5 py-1.5 rounded-xl flex items-center gap-2">
                      <Key size={14} className="text-sky-400" />
                      <span className="text-xs text-slate-400">PIN:</span>
                      <span className="text-base font-black text-sky-300 font-mono tracking-widest">
                        {exam.accessCode}
                      </span>
                      <button
                        onClick={() => copyPin(exam.accessCode)}
                        className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
                        title="Copy Access Code"
                      >
                        <Copy size={13} />
                      </button>
                    </div>

                    <button
                      onClick={() => handleDelete(exam.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
                      title="Delete Exam"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Row 2: Details & Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                    <span className="text-slate-400">Duration</span>
                    <div className="text-sm font-bold text-white font-mono mt-0.5">{exam.durationMinutes} mins</div>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                    <span className="text-slate-400">Subjects</span>
                    <div className="text-sm font-bold text-white font-mono mt-0.5">{exam.subjectIds?.length || 0} Subjects</div>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                    <span className="text-slate-400">Candidates Sat</span>
                    <div className="text-sm font-bold text-sky-400 font-mono mt-0.5">{totalSubmissions} Submitted</div>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                    <span className="text-slate-400">Avg Score</span>
                    <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                      {totalSubmissions > 0 ? `${avgScore} / 400` : 'No data yet'}
                    </div>
                  </div>
                </div>

                {/* Row 3: Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <span className="text-slate-400 truncate max-w-md">
                    Subjects: <strong className="text-slate-300">{subjectNames}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewingSubmissionsExam(exam)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold border border-slate-700 transition"
                    >
                      <Users size={14} className="text-sky-400" />
                      <span>Candidate Gradebook ({totalSubmissions})</span>
                    </button>

                    <button
                      onClick={() => onDirectLaunchExam(exam)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold shadow-md shadow-sky-600/30 transition"
                    >
                      <Play size={14} />
                      <span>Test Launch Exam</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Gradebook & Candidate Submissions Modal */}
      {viewingSubmissionsExam && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 my-8">
            <div className="bg-gradient-to-r from-sky-600 to-sky-700 px-6 py-4 flex items-center justify-between text-white">
              <div>
                <h3 className="font-extrabold text-lg">Candidate Submissions & Gradebook</h3>
                <p className="text-xs text-sky-100">{viewingSubmissionsExam.title} • PIN: {viewingSubmissionsExam.accessCode}</p>
              </div>
              <button
                onClick={() => setViewingSubmissionsExam(null)}
                className="p-1.5 hover:bg-white/20 rounded-lg text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {(!viewingSubmissionsExam.submissions || viewingSubmissionsExam.submissions.length === 0) ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Users size={40} className="mx-auto text-slate-600" />
                  <p className="font-semibold text-white">No submissions recorded yet for this exam</p>
                  <p className="text-xs">Students can join using PIN: <strong className="text-sky-400 font-mono">{viewingSubmissionsExam.accessCode}</strong></p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="pb-3 pl-2">Candidate</th>
                        <th className="pb-3">Reg. No</th>
                        <th className="pb-3">Submitted At</th>
                        <th className="pb-3">Score</th>
                        <th className="pb-3">Percentage</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {viewingSubmissionsExam.submissions.map((sub, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="py-3 pl-2 font-bold text-white">{sub.candidateName}</td>
                          <td className="py-3 font-mono text-slate-400">{sub.candidateId}</td>
                          <td className="py-3 text-slate-400">
                            {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-3 font-mono font-bold text-sky-400 text-sm">
                            {sub.totalScore} / 400
                          </td>
                          <td className="py-3 font-mono text-white">
                            {sub.percentage}%
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              sub.percentage >= 60 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                            }`}>
                              {sub.percentage >= 60 ? 'Passed' : 'Needs Review'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-slate-950/80 px-6 py-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setViewingSubmissionsExam(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
              >
                Close Gradebook
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Exam Creation Modal */}
      {isCreatorOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 my-8">
            <div className="bg-gradient-to-r from-sky-600 to-sky-700 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Calendar size={20} />
                <h3 className="font-extrabold text-lg">Schedule New Mock Examination</h3>
              </div>
              <button
                onClick={() => setIsCreatorOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
              {/* Exam Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Exam Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. National JAMB Mega Mock 2026 - Batch A"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-medium"
                  required
                />
              </div>

              {/* Exam Type & Access PIN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Standard
                  </label>
                  <select
                    value={examType}
                    onChange={(e) => setExamType(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                  >
                    <option value="jamb">JAMB UTME (4 Subjects, 400 Marks)</option>
                    <option value="wassce">WASSCE (WAEC Letter Grades A1-F9)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      Walk-in Access PIN
                    </label>
                    <button
                      type="button"
                      onClick={generateRandomPin}
                      className="text-[11px] text-sky-400 hover:underline"
                    >
                      Regenerate
                    </button>
                  </div>
                  <input
                    type="text"
                    value={accessCode}
                    maxLength={6}
                    onChange={(e) => setAccessCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="e.g. 784219"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sky-400 font-mono font-bold tracking-widest text-base"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Optional: Candidates assigned to this batch in the candidate roster will launch automatically without needing to enter a PIN.
                  </p>
                </div>
              </div>

              {/* Start & End Window */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Start Window
                  </label>
                  <input
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Close Window
                  </label>
                  <input
                    type="datetime-local"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="300"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    required
                  />
                </div>
              </div>

              {/* Subject Selection & Configurable Question Counts */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Subjects ({selectedSubjects.length} {examType === 'jamb' ? '/ 4 Selected' : 'Selected'})
                  </label>
                  <span className="text-[11px] text-sky-400 font-medium">
                    Standard: English (60 Qs) + 3 Subjects (40 Qs each) = 180 Qs
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {allSubjects.map(sub => {
                    const isSelected = selectedSubjects.includes(sub.id);
                    const isMandatory = examType === 'jamb' && sub.id === 'english';
                    const qCount = subjectQuestionCounts[sub.id] !== undefined
                      ? subjectQuestionCounts[sub.id]
                      : (sub.id === 'english' ? 60 : 40);

                    return (
                      <div
                        key={sub.id}
                        className={`p-3 rounded-xl border text-xs transition space-y-2 ${
                          isSelected
                            ? 'bg-slate-900 border-sky-500/80 ring-1 ring-sky-500/30'
                            : 'bg-slate-800/40 border-slate-700/60 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => toggleSubject(sub.id)}
                            className="flex items-center gap-2 font-bold text-left truncate flex-1"
                          >
                            <span className={isSelected ? 'text-white' : 'text-slate-400'}>{sub.name}</span>
                            {isMandatory && (
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono uppercase">
                                Mandatory
                              </span>
                            )}
                          </button>

                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isMandatory}
                            onChange={() => toggleSubject(sub.id)}
                            className="rounded border-slate-700 text-sky-600 focus:ring-sky-500 w-4 h-4"
                          />
                        </div>

                        {isSelected && (
                          <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
                            <span className="text-slate-400">Questions in this Mock:</span>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="1"
                                max="150"
                                value={qCount}
                                onChange={(e) => handleQuestionCountChange(sub.id, e.target.value)}
                                className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-right font-mono font-bold text-sky-300 text-xs focus:outline-none focus:border-sky-500"
                              />
                              <span className="text-slate-500 font-semibold">Qs</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Question Selection Strategy */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Question Selection & Curriculum Strategy
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setQuestionSelectionMode('jamb_standard')}
                    className={`p-3 rounded-xl border text-left transition ${
                      questionSelectionMode === 'jamb_standard'
                        ? 'bg-sky-500/15 border-sky-500 text-white ring-1 ring-sky-500'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="font-bold text-xs text-white">JAMB UTME Standard</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">60 English, 40 per other subject (Total 180 Qs)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuestionSelectionMode('topic_filter')}
                    className={`p-3 rounded-xl border text-left transition ${
                      questionSelectionMode === 'topic_filter'
                        ? 'bg-sky-500/15 border-sky-500 text-white ring-1 ring-sky-500'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="font-bold text-xs text-white">Covered Topics Filter</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Only include topics taught in class so far</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuestionSelectionMode('all')}
                    className={`p-3 rounded-xl border text-left transition ${
                      questionSelectionMode === 'all'
                        ? 'bg-sky-500/15 border-sky-500 text-white ring-1 ring-sky-500'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="font-bold text-xs text-white">All Question Bank Items</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Load full repository without limit</div>
                  </button>
                </div>
              </div>

              {/* Specific Topics Selector (When Topic Filter is Active) */}
              {questionSelectionMode === 'topic_filter' && (
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
                    <Filter size={14} />
                    <span>Select Covered Topics for Each Examination Subject:</span>
                  </div>

                  <div className="space-y-3">
                    {selectedSubjects.map(subId => {
                      const subName = allSubjects.find(s => s.id === subId)?.name || subId;
                      const topics = getAvailableTopicsForSubject(subId);
                      const currentSelected = selectedTopics[subId] || [];

                      return (
                        <div key={subId} className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-white">{subName} Topics</span>
                            <span className="text-[11px] text-slate-400">
                              {currentSelected.length > 0 ? `${currentSelected.length} topics selected` : 'All topics included'}
                            </span>
                          </div>

                          {topics.length === 0 ? (
                            <p className="text-[11px] text-slate-500 italic">
                              No tagged topics found for this subject yet. All available questions will be included. (You can tag topics when uploading questions).
                            </p>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {topics.map(t => {
                                const isChecked = currentSelected.includes(t);
                                return (
                                  <button
                                    key={t}
                                    type="button"
                                    onClick={() => toggleTopicSelection(subId, t)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                                      isChecked
                                        ? 'bg-sky-600 text-white'
                                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                    }`}
                                  >
                                    {isChecked ? <Check size={12} /> : <Plus size={12} />}
                                    <span>{t}</span>
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

              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreatorOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-sky-600/30 flex items-center gap-2"
                >
                  <Check size={16} />
                  <span>Schedule & Publish Exam</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
