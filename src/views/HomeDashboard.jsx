import React, { useState, useEffect } from 'react';
import { 
  Key, Lock, User, ShieldCheck, 
  CheckCircle2, ArrowRight, Eye, EyeOff, 
  AlertCircle, Mail, Clock, Award, UserPlus, Sparkles 
} from 'lucide-react';
import { 
  findCandidateByCredentials, 
  getScheduledExams,
  syncFromSupabase,
  getGlobalResultsReleased
} from '../utils/storage';
import CandidateExamSlipModal from '../components/CandidateExamSlipModal';
import StudentResultReviewModal from '../components/StudentResultReviewModal';
import StudentSelfRegistration from '../components/StudentSelfRegistration';
import GoogleExamAuthModal from '../components/GoogleExamAuthModal';

export default function HomeDashboard({ onLoginSuccess, onStudentLogin }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForgotHelp, setShowForgotHelp] = useState(false);
  
  // Verification Modal state
  const [verifiedCandidate, setVerifiedCandidate] = useState(null);
  const [assignedExam, setAssignedExam] = useState(null);
  const [timeWindowStatus, setTimeWindowStatus] = useState({ valid: true, message: '' });

  // Post-Exam Result access states
  const [reviewCandidate, setReviewCandidate] = useState(null);
  const [withheldNoticeCandidate, setWithheldNoticeCandidate] = useState(null);

  // Automatically pop Google Modal if user returned from OAuth redirect
  useEffect(() => {
    if (window.location.hash.includes('access_token') || window.location.search.includes('code=')) {
      setShowGoogleModal(true);
    }
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Please enter both your Registration Number and Passcode.');
      return;
    }
    await verifyCandidateCredentials(username, password);
  };

  const verifyCandidateCredentials = async (userVal, passVal) => {
    setErrorMessage('');
    let candidate = findCandidateByCredentials(userVal, passVal);

    if (!candidate) {
      // Sync from Supabase in case candidate was created remotely
      try {
        await syncFromSupabase();
        candidate = findCandidateByCredentials(userVal, passVal);
      } catch (err) {
        console.warn('Supabase sync check failed:', err);
      }
    }

    if (!candidate) {
      setErrorMessage('Invalid Registration Number or Passcode. Please check your docket credentials or report to the center invigilator.');
      setVerifiedCandidate(null);
      return;
    }

    // If onStudentLogin is available and candidate already completed an exam or has no batch lock,
    // immediately log them into their personal Student Dashboard to take more exams and track progress!
    if (onStudentLogin) {
      if (candidate.status === 'Completed' || (!candidate.scheduledExamId && candidate.isSelfRegistered)) {
        onStudentLogin(candidate);
        return;
      }
    }

    // Check if candidate already completed their CBT examination
    if (candidate.status === 'Completed') {
      const isSelfReg = candidate.isSelfRegistered || 
                        candidate.category === 'Online Self-Service' || 
                        candidate.category === 'Targeted Topic Practice';
      const isReleased = isSelfReg || candidate.resultsReleased || getGlobalResultsReleased();
      if (isReleased) {
        setReviewCandidate(candidate);
      } else {
        setWithheldNoticeCandidate(candidate);
      }
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

    if (!timeWindowStatus.valid) {
      setErrorMessage(timeWindowStatus.message);
      return;
    }

    // Launch official personalized CBT engine
    onLoginSuccess(verifiedCandidate, assignedExam);
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-8 max-w-5xl mx-auto">
      
      {/* Official CBT Top Seal */}
      <div className="w-full text-center space-y-2 mb-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700/80 text-sky-400 text-xs font-semibold shadow-md">
          <ShieldCheck size={15} />
          <span>PrepCBT Accredited Examination Portal • Federal Standard</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
          {authMode === 'login' ? 'Candidate CBT Login Terminal' : 'Student Self-Service Registration'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          {authMode === 'login'
            ? 'Enter your official registration number or email address and passcode to verify your docket and begin.'
            : 'Register your examination profile, select your preferred exam category (JAMB, WASSCE, or Topic Drills), filter topics, and commence testing immediately.'}
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center justify-center gap-2 p-1.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl w-full max-w-md mx-auto mb-8 shadow-xl backdrop-blur-md">
        <button
          type="button"
          onClick={() => { setAuthMode('login'); setErrorMessage(''); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            authMode === 'login'
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 scale-[1.02]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Key size={15} />
          <span>Candidate Login</span>
        </button>
        <button
          type="button"
          onClick={() => { setAuthMode('register'); setErrorMessage(''); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            authMode === 'register'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/25 scale-[1.02]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <UserPlus size={15} />
          <span>Register & Take Exam</span>
        </button>
      </div>

      {/* Main Content Area based on authMode */}
      {authMode === 'register' ? (
        <div className="w-full max-w-3xl mx-auto">
          <StudentSelfRegistration
            onRegistrationSuccess={(cand) => {
              if (onStudentLogin) {
                onStudentLogin(cand);
              } else {
                setTimeWindowStatus({ valid: true, message: '' });
                setAssignedExam(null);
                setVerifiedCandidate(cand);
              }
            }}
            onSwitchToLogin={() => setAuthMode('login')}
            onOpenGoogleAuth={() => setShowGoogleModal(true)}
          />
        </div>
      ) : (
        <div className="w-full max-w-lg mx-auto">
          
          {/* Candidate CBT Login Form */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-3 pb-5 border-b border-slate-700/80 mb-6">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-inner">
                <Key size={24} className="stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Student Candidate Authentication</h2>
                <p className="text-xs text-slate-400">Accredited Terminal • Computer-Based Testing Session</p>
              </div>
            </div>

            {/* Google Fast-Track Sign In Button */}
            <div className="mb-6">
              <button
                type="button"
                onClick={() => setShowGoogleModal(true)}
                className="w-full py-3.5 px-4 rounded-xl border border-slate-700 bg-slate-900/90 hover:bg-slate-700/60 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all shadow-md hover:border-slate-500 hover:scale-[1.01] active:scale-[0.99]"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google Account</span>
              </button>

              <div className="relative flex items-center justify-center mt-5">
                <div className="border-t border-slate-700/80 w-full"></div>
                <span className="bg-slate-800 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                  Or manual registration sign-in
                </span>
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

              {/* Registration Number or Email Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 tracking-wide uppercase">
                  Registration Number or Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. 2026/UTME/014 or student@gmail.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Enter your official examination slip code or your registered email address
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
                    placeholder="e.g. PASS-XXXX"
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

              {/* Switch to self-registration */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setErrorMessage(''); }}
                  className="text-xs text-sky-400 hover:text-sky-300 font-medium inline-flex items-center gap-1.5 transition"
                >
                  <span>New student or want to select specific topics? Register here</span>
                  <ArrowRight size={13} />
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
      )}

      {/* Verification Slip Modal */}
      {verifiedCandidate && (
        <CandidateExamSlipModal
          candidate={verifiedCandidate}
          isOpen={true}
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

      {/* Student Post-Exam Approved Result & Detailed Breakdown Review Modal */}
      {reviewCandidate && (
        <StudentResultReviewModal
          candidate={reviewCandidate}
          onClose={() => setReviewCandidate(null)}
        />
      )}

      {/* Official Score Withheld / Results Under Audit Notice Modal */}
      {withheldNoticeCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                <Lock size={24} className="stroke-[2.2]" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  Examination Recorded • Scores Withheld
                </span>
                <h3 className="text-lg font-black text-white mt-1">Official Result Under Administrative Audit</h3>
              </div>
            </div>

            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Candidate Name:</span>
                <strong className="text-white font-bold">{withheldNoticeCandidate.fullName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Registration Number:</span>
                <strong className="text-sky-400 font-mono font-bold">{withheldNoticeCandidate.username}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Examination Track:</span>
                <span className="text-slate-300 uppercase font-semibold">{withheldNoticeCandidate.examType || 'JAMB UTME'}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800/80">
                <span className="text-slate-400">Target Delivery Email:</span>
                <span className="text-sky-300 font-mono text-[11px] font-medium">
                  {withheldNoticeCandidate.email || 'No email registered on docket'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 text-xs text-slate-300 space-y-2 leading-relaxed">
              <p>
                Your CBT examination answers have been securely submitted and logged. Under center anti-malpractice regulations, immediate scores are locked at the candidate terminal.
              </p>
              <p className="text-slate-400">
                The center administration is compiling the official results sheet. As soon as the scores are approved by the examination board:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-300 text-[11px]">
                <li>Your full scores and detailed question breakdown will be sent directly to your registered email.</li>
                <li>You will be able to log back into this terminal to review your score, subject performance, and missed questions with explanations.</li>
              </ul>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setWithheldNoticeCandidate(null)}
                className="w-full sm:w-auto px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-sky-600/30"
              >
                Understood, Return to Portal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Fast-Track Examination Modal */}
      {showGoogleModal && (
        <GoogleExamAuthModal
          isOpen={true}
          onClose={() => setShowGoogleModal(false)}
          onStudentLogin={(cand) => {
            if (onStudentLogin) {
              onStudentLogin(cand);
            }
          }}
          onStartExam={(cand) => {
            onLoginSuccess(cand, null);
          }}
          onViewResults={(cand) => {
            setReviewCandidate(cand);
          }}
          onViewSlip={(cand) => {
            setTimeWindowStatus({ valid: true, message: '' });
            setAssignedExam(null);
            setVerifiedCandidate(cand);
          }}
        />
      )}

    </div>
  );
}
