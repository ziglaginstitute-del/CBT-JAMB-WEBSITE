import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, Key, Lock, User, ShieldCheck, 
  AlertTriangle, CheckCircle2, ArrowRight, Eye, EyeOff, 
  Sparkles, BookOpen, Clock, AlertCircle, HelpCircle, Check, MapPin,
  Calendar, Layers, FileText
} from 'lucide-react';
import { SUBJECTS } from '../data/questions';
import { 
  getCandidates, findCandidateByCredentials, 
  getScheduledExams 
} from '../utils/storage';
import CandidateExamSlipModal from '../components/CandidateExamSlipModal';

export default function HomeDashboard({ onLoginSuccess }) {
  const [candidates, setCandidates] = useState([]);
  const [username, setUsername] = useState('JAMB/2026/014');
  const [password, setPassword] = useState('PASS-7921');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForgotHelp, setShowForgotHelp] = useState(false);
  
  // Verification Modal state
  const [verifiedCandidate, setVerifiedCandidate] = useState(null);
  const [assignedExam, setAssignedExam] = useState(null);
  const [timeWindowStatus, setTimeWindowStatus] = useState({ valid: true, message: '' });

  useEffect(() => {
    setCandidates(getCandidates());
  }, []);

  const handleQuickSelectCandidate = (cand) => {
    setUsername(cand.username);
    setPassword(cand.password);
    setErrorMessage('');
    verifyCandidateCredentials(cand.username, cand.password);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Please enter both your Registration Number and Passcode.');
      return;
    }
    verifyCandidateCredentials(username, password);
  };

  const verifyCandidateCredentials = (userVal, passVal) => {
    setErrorMessage('');
    const candidate = findCandidateByCredentials(userVal, passVal);

    if (!candidate) {
      setErrorMessage('Invalid Registration Number or Passcode. Please check your docket credentials or report to the center invigilator.');
      setVerifiedCandidate(null);
      return;
    }

    // Check if assigned to a scheduled exam time window
    let scheduledExam = null;
    let windowCheck = { valid: true, message: '' };

    if (candidate.scheduledExamId) {
      const allExams = getScheduledExams();
      scheduledExam = allExams.find(e => e.id === candidate.scheduledExamId);

      if (scheduledExam) {
        const now = new Date();
        const start = new Date(scheduledExam.startsAt);
        const end = new Date(scheduledExam.endsAt);

        if (now < start) {
          windowCheck = {
            valid: false,
            message: `Examination session has not opened yet. Window opens on ${start.toLocaleDateString()} at ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
          };
        } else if (now > end) {
          windowCheck = {
            valid: false,
            message: `Examination access window has expired. The session closed on ${end.toLocaleDateString()} at ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
          };
        }
      }
    }

    setAssignedExam(scheduledExam);
    setTimeWindowStatus(windowCheck);
    setVerifiedCandidate(candidate);
  };

  const handleConfirmStartExam = () => {
    if (!verifiedCandidate) return;

    if (verifiedCandidate.status === 'Completed') {
      setErrorMessage('Exam already completed. Re-sits must be authorized by the center examination officer.');
      return;
    }

    if (!timeWindowStatus.valid) {
      setErrorMessage(timeWindowStatus.message);
      return;
    }

    // Launch official personalized CBT engine
    onLoginSuccess(verifiedCandidate, assignedExam);
  };

  const getSubjectName = (id) => {
    return SUBJECTS.find(s => s.id === id)?.name || id;
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-8 max-w-5xl mx-auto">
      
      {/* Official CBT Top Seal */}
      <div className="w-full text-center space-y-2 mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700/80 text-sky-400 text-xs font-semibold shadow-md">
          <ShieldCheck size={15} />
          <span>PrepCBT Accredited Examination Portal • Federal Standard</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
          Candidate CBT Login Terminal
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Enter your official institutional registration number and examination passcode to verify your biometric docket and begin your session.
        </p>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Instant Demo Candidate Selector (Purely for candidate testing) */}
        <div className="md:col-span-5 bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 shadow-xl backdrop-blur-sm space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400 uppercase tracking-wider">
              <Sparkles size={14} />
              <span>Instant Test Candidates</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {candidates.length} Registered
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Select an enrolled candidate below to prefill credentials and inspect their assigned examination slip:
          </p>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {candidates.slice(0, 5).map(cand => {
              const isSelected = verifiedCandidate?.id === cand.id;
              const isCompleted = cand.status === 'Completed';

              return (
                <button
                  key={cand.id}
                  type="button"
                  onClick={() => handleQuickSelectCandidate(cand)}
                  className={`w-full text-left p-3 rounded-xl border transition flex items-start justify-between gap-2 ${
                    isSelected
                      ? 'bg-sky-500/20 border-sky-400 shadow-md ring-1 ring-sky-400'
                      : 'bg-slate-900/80 border-slate-700 hover:border-slate-500 hover:bg-slate-900'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{cand.fullName}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold bg-slate-800 text-sky-300 border border-slate-700">
                        {cand.category || 'General'}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      {cand.username} • {cand.password}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 flex flex-wrap gap-1">
                      {cand.registeredSubjects?.map(s => (
                        <span key={s} className="px-1 py-0.2 rounded bg-slate-800 text-slate-300 text-[9px]">
                          {getSubjectName(s)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isCompleted 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : cand.status === 'In Progress'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {cand.status || 'Pending'}
                    </span>
                    {isCompleted && cand.examResult && (
                      <span className="text-[10px] font-mono font-bold text-emerald-400 mt-1">
                        {cand.examResult.totalScore}/400
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-700/60 text-[11px] text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
            <span>Strict subject locking prevents question mix-ups.</span>
          </div>
        </div>

        {/* Right Column: Candidate CBT Login Form */}
        <div className="md:col-span-7 bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-3 pb-5 border-b border-slate-700/80 mb-6">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-inner">
              <Key size={24} className="stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Student Candidate Authentication</h2>
              <p className="text-xs text-slate-400">Accredited Terminal • Computer-Based Testing Session</p>
            </div>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Registration Number Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 tracking-wide uppercase">
                Candidate Registration Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. JAMB/2026/014 or WAEC/2026/042"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition font-mono uppercase"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Enter your official examination registration slip code
              </p>
            </div>

            {/* Password / Passcode Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 tracking-wide uppercase">
                Candidate Passcode
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="e.g. PASS-7921"
                  className="w-full pl-10 pr-12 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                <span>Case-sensitive candidate access code</span>
                <button
                  type="button"
                  onClick={() => setShowForgotHelp(true)}
                  className="text-sky-400 hover:text-sky-300 underline font-medium"
                >
                  Forgot Passcode?
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white shadow-lg shadow-sky-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <span>Login & Verify Examination Slip</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </form>

          {/* Biometric & System Security Notice */}
          <div className="mt-6 pt-5 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-400" />
              Accredited Anti-Malpractice Sandbox
            </span>
            <span>Version 2026.4</span>
          </div>
        </div>

      </div>

      {/* Verification Slip Modal */}
      {verifiedCandidate && (
        <CandidateExamSlipModal
          candidate={verifiedCandidate}
          assignedExam={assignedExam}
          timeWindowStatus={timeWindowStatus}
          onClose={() => setVerifiedCandidate(null)}
          onConfirmStart={handleConfirmStartExam}
        />
      )}

      {/* Candidate Credential Recovery Guidance Modal */}
      {showForgotHelp && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/90 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <Key size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Passcode Recovery Guide</h3>
                  <p className="text-[11px] text-slate-400">Candidate Credential Support</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotHelp(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
              <p>
                Under official CBT regulations, candidate passcodes are strictly issued on physical examination dockets.
              </p>

              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 space-y-2 text-slate-300">
                <div className="font-semibold text-white flex items-center gap-1.5 text-xs">
                  <ShieldCheck size={14} className="text-sky-400" />
                  <span>How to obtain or reset your passcode:</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-400">
                  <li>Refer to your printed official <strong>Examination Slip / Photocard</strong>.</li>
                  <li>If lost, report immediately to the <strong>Center Invigilator</strong> or School Exam Officer.</li>
                  <li>The center administrator can instantly issue a new passcode from their secure terminal.</li>
                </ul>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotHelp(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
              >
                Understood, Return to Login
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
