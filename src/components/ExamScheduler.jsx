import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Key, Plus, Users, Award, 
  Trash2, Eye, Copy, CheckCircle2, AlertTriangle, 
  Sparkles, Check, X, FileText, ChevronRight, Play 
} from 'lucide-react';
import { SUBJECTS } from '../data/questions';
import { 
  getScheduledExams, addScheduledExam, 
  deleteScheduledExam, getQuestionBank 
} from '../utils/storage';

export default function ExamScheduler({ onDirectLaunchExam }) {
  const [exams, setExams] = useState([]);
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
  const [questionSelectionMode, setQuestionSelectionMode] = useState('auto_balanced'); // 'auto_balanced' | 'all'
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadExams();
    initDefaultDates();
  }, []);

  const loadExams = () => {
    setExams(getScheduledExams());
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
    // Start now
    const startStr = now.toISOString().slice(0, 16);
    // End in 3 days
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

  const handleCreateExam = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Exam title is required.');
      return;
    }
    if (!accessCode.trim() || accessCode.trim().length < 4) {
      setFormError('Please provide a valid Access PIN (at least 4-6 digits).');
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
      if (questionSelectionMode === 'auto_balanced' && available.length > 0) {
        // Balance by difficulty: mix of beginner, intermediate, advanced
        const beg = available.filter(q => q.difficulty === 'Beginner');
        const inter = available.filter(q => q.difficulty === 'Intermediate');
        const adv = available.filter(q => q.difficulty === 'Advanced');

        const combined = [...beg, ...inter, ...adv];
        questionsBySubject[subId] = combined.length > 0 ? combined : available;
      } else {
        questionsBySubject[subId] = available;
      }
    });

    const newExamPayload = {
      title: title.trim(),
      accessCode: accessCode.trim().replace(/[^0-9]/g, ''),
      examType,
      subjectIds: selectedSubjects,
      durationMinutes: Number(durationMinutes),
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
      questionsBySubject,
      submissions: []
    };

    addScheduledExam(newExamPayload);
    loadExams();
    setIsCreatorOpen(false);
    showToast(`Exam "${title}" scheduled with PIN: ${newExamPayload.accessCode}`);
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
    const now = new Date();
    const start = new Date(exam.startsAt);
    const end = new Date(exam.endsAt);

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

            const subjectNames = (exam.subjectIds || [])
              .map(id => SUBJECTS.find(s => s.id === id)?.name || id)
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
                      6-Digit Access PIN
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
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sky-400 font-mono font-bold tracking-widest text-base"
                    required
                  />
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

              {/* Subject Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Subjects ({selectedSubjects.length} {examType === 'jamb' ? '/ 4 Selected' : 'Selected'})
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SUBJECTS.map(sub => {
                    const isSelected = selectedSubjects.includes(sub.id);
                    const isMandatory = examType === 'jamb' && sub.id === 'english';
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => toggleSubject(sub.id)}
                        className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition flex items-center justify-between ${
                          isSelected
                            ? 'bg-sky-600/20 border-sky-500 text-sky-200'
                            : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <span className="truncate">{sub.name}</span>
                        {isMandatory ? (
                          <span className="text-[10px] bg-sky-950 text-sky-300 px-1 rounded uppercase font-mono">REQ</span>
                        ) : isSelected ? (
                          <Check size={14} className="text-sky-400 shrink-0" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question Balance Option */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Question Selection Strategy
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setQuestionSelectionMode('auto_balanced')}
                    className={`p-3 rounded-xl border text-left transition ${
                      questionSelectionMode === 'auto_balanced'
                        ? 'bg-sky-500/15 border-sky-500 text-white ring-1 ring-sky-500'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="font-bold text-xs text-white">Auto-Balanced Difficulty</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">30% Beginner, 50% Intermediate, 20% Advanced</div>
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
                    <div className="font-bold text-xs text-white">All Subject Questions</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Include every author question in bank</div>
                  </button>
                </div>
              </div>

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
