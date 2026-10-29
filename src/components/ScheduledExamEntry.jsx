import React, { useState, useEffect } from 'react';
import { 
  Key, Clock, User, ShieldAlert, CheckCircle2, 
  AlertTriangle, ArrowRight, X, Sparkles, BookOpen, Calendar 
} from 'lucide-react';
import { findExamByPin, getScheduledExams, getAllSubjects } from '../utils/storage';

export default function ScheduledExamEntry({ isOpen, onClose, onLaunchExam }) {
  const [pin, setPin] = useState('');
  const [candidateName, setCandidateName] = useState('Chukwuma Emmanuel');
  const [candidateReg, setCandidateReg] = useState(`2026/UTME/${Math.floor(100000 + Math.random() * 900000)}`);
  const [matchedExam, setMatchedExam] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [availableScheduledExams, setAvailableScheduledExams] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setAvailableScheduledExams(getScheduledExams());
      setValidationError('');
      setMatchedExam(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePinChange = (val) => {
    const raw = val.replace(/[^0-9]/g, '').slice(0, 6);
    setPin(raw);
    setValidationError('');

    if (raw.length === 6) {
      verifyPin(raw);
    } else {
      setMatchedExam(null);
    }
  };

  const verifyPin = (cleanPin) => {
    const exam = findExamByPin(cleanPin);
    if (!exam) {
      setValidationError('No scheduled examination found for this 6-digit Access PIN. Please verify with your institution/teacher.');
      setMatchedExam(null);
      return;
    }

    const now = new Date();
    const start = new Date(exam.startsAt);
    const end = new Date(exam.endsAt);

    if (now < start) {
      setValidationError(`Examination has not opened yet. It is scheduled to start on ${start.toLocaleDateString()} at ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`);
      setMatchedExam(null);
      return;
    }

    if (now > end) {
      setValidationError(`Access to this examination has expired. The test window closed on ${end.toLocaleDateString()} at ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`);
      setMatchedExam(null);
      return;
    }

    setMatchedExam(exam);
    setValidationError('');
  };

  const handleStart = () => {
    if (!matchedExam) {
      setValidationError('Please enter and verify a valid 6-digit Access PIN.');
      return;
    }
    if (!candidateName.trim()) {
      setValidationError('Please enter your full name.');
      return;
    }

    // Launch official CBT exam loaded with scheduled exam questions
    onLaunchExam({
      examType: matchedExam.examType.toUpperCase(),
      candidateName: candidateName.trim(),
      candidateReg: candidateReg.trim() || '2026/CAND/0000',
      subjects: matchedExam.subjectIds,
      durationMinutes: matchedExam.durationMinutes,
      isScheduled: true,
      scheduledExamId: matchedExam.id,
      questionsBySubject: matchedExam.questionsBySubject
    });
  };

  const quickFillSamplePin = (samplePin) => {
    setPin(samplePin);
    verifyPin(samplePin);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 to-sky-700 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <Key size={20} />
            <div>
              <h2 className="font-extrabold text-lg">Join Scheduled Examination</h2>
              <p className="text-xs text-sky-100">Enter your official 6-digit institutional access PIN</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
          {/* Quick Active PIN Suggestions */}
          {availableScheduledExams.length > 0 && (
            <div className="p-3 bg-sky-950/40 border border-sky-500/30 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-sky-400 font-bold text-xs">
                <Sparkles size={14} />
                <span>Currently Active Institutional Mocks:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableScheduledExams.slice(0, 3).map(ex => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => quickFillSamplePin(ex.accessCode)}
                    className="px-2.5 py-1.5 bg-slate-800/80 hover:bg-sky-600 hover:text-white rounded-lg border border-slate-700 text-slate-300 text-xs font-mono transition flex items-center gap-1.5"
                  >
                    <span>{ex.title}</span>
                    <strong className="text-sky-300 font-bold">[{ex.accessCode}]</strong>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PIN Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Enter 6-Digit Access PIN
            </label>
            <div className="relative">
              <input
                type="text"
                value={pin}
                maxLength={6}
                onChange={(e) => handlePinChange(e.target.value)}
                placeholder="e.g. 784219"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-2xl font-mono font-black text-center tracking-[0.3em] text-sky-400 focus:outline-none focus:border-sky-500 placeholder:text-slate-600"
              />
              <Key size={18} className="absolute left-4 top-4 text-slate-500" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1 text-center">
              Issued by your exam center, tutor, or secondary school administrator
            </p>
          </div>

          {/* Candidate Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Candidate Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-sky-500"
                  placeholder="e.g. Chukwuma Emmanuel"
                />
                <User size={15} className="absolute right-3.5 top-3 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Reg. Number or Phone
              </label>
              <input
                type="text"
                value={candidateReg}
                onChange={(e) => setCandidateReg(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-sky-500"
                placeholder="2026/UTME/948201"
              />
            </div>
          </div>

          {/* Matched Exam Details Card */}
          {matchedExam && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 size={16} />
                <span>Verified Scheduled Exam: Active & Open</span>
              </div>

              <div>
                <h4 className="text-base font-extrabold text-white">{matchedExam.title}</h4>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-1">
                  <span>Standard: <strong className="text-white uppercase font-mono">{matchedExam.examType}</strong></span>
                  <span>•</span>
                  <span>Duration: <strong className="text-sky-300 font-mono">{matchedExam.durationMinutes} mins</strong></span>
                  <span>•</span>
                  <span>Subjects: <strong className="text-white">{matchedExam.subjectIds?.length}</strong></span>
                </div>
              </div>

              {/* Subject Badges */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {matchedExam.subjectIds?.map(subId => (
                  <span key={subId} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-300">
                    {getAllSubjects().find(s => s.id === subId)?.name || subId}
                  </span>
                ))}
              </div>
            </div>
          )}

          {validationError && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2.5">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950/80 px-6 py-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </button>

          <button
            onClick={handleStart}
            disabled={!matchedExam}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span>Proceed to Examination Hall</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
