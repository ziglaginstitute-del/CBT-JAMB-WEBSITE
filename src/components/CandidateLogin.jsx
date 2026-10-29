import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, Key, Lock, User, ShieldCheck, 
  AlertTriangle, CheckCircle2, ArrowRight, Eye, EyeOff, 
  Sparkles, BookOpen, Clock, AlertCircle, HelpCircle, Check, MapPin,
  Mail, FileText, Printer, ExternalLink
} from 'lucide-react';
import { 
  getCandidates, findCandidateByCredentials, 
  getScheduledExams, getGlobalResultsReleased, getAllSubjects 
} from '../utils/storage';
import StudentResultReviewModal from './StudentResultReviewModal';

export default function CandidateLogin({ onLoginSuccess, onOpenAdminRoster }) {
  const [candidates, setCandidates] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForgotHelp, setShowForgotHelp] = useState(false);
  
  // Verification Modal state
  const [verifiedCandidate, setVerifiedCandidate] = useState(null);
  const [assignedExam, setAssignedExam] = useState(null);
  const [timeWindowStatus, setTimeWindowStatus] = useState({ valid: true, message: '' });
  const [showStudentReviewModal, setShowStudentReviewModal] = useState(false);

  useEffect(() => {
    setCandidates(getCandidates());
  }, []);

  const handleQuickSelectCandidate = (cand) => {
    setUsername(cand.username);
    setPassword(cand.password);
    setErrorMessage('');
    // Auto verify candidate
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
      setErrorMessage('Invalid Registration Number or Passcode. Please check your credentials or contact the center invigilator.');
      setVerifiedCandidate(null);
      return;
    }

    // Check if assigned to a scheduled exam
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
      setErrorMessage('Exam already completed. Retake is prohibited unless authorized by administrator.');
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
    const allSubs = getAllSubjects();
    return allSubs.find(s => s.id === id)?.name || id;
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-8 max-w-4xl mx-auto">
      
      {/* Official CBT Top Seal */}
      <div className="w-full text-center space-y-2 mb-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700/80 text-sky-400 text-xs font-semibold shadow-md">
          <ShieldCheck size={15} />
          <span>PrepCBT Accredited Examination Portal • Federal Standard</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
          Candidate CBT Login Terminal
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
          Enter your official institutional registration number and secure examination passcode to access your personalized questions.
        </p>
      </div>

      <div className="w-full max-w-lg mx-auto">
        {/* Official Login Box */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-sky-600/30">
                <Lock size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">Candidate Accreditation</h3>
                <p className="text-xs text-slate-400">Standard Computerized Testing Room 01</p>
              </div>
            </div>
            <span className="px-2 py-1 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] uppercase font-bold font-mono">
              SECURE TLS
            </span>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs sm:text-sm">
            {/* Registration Number / Username */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Registration Number / Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. JAMB/2026/014"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 font-mono text-base font-bold text-white focus:outline-none focus:border-sky-500 tracking-wide"
                />
                <User size={18} className="absolute right-4 top-3.5 text-slate-500 pointer-events-none" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Found on your official CBT Registration Docket / Slip
              </p>
            </div>

            {/* Password / Passcode */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Examination Passcode / Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="e.g. PASS-7921"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 font-mono text-base font-bold text-sky-300 focus:outline-none focus:border-sky-500 tracking-wide"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                <span>Case-sensitive candidate access code</span>
                <button
                  type="button"
                  onClick={() => setShowForgotHelp(true)}
                  className="text-sky-400 hover:text-sky-300 font-semibold transition hover:underline"
                >
                  Forgot Passcode?
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2.5">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2"
            >
              <Lock size={16} />
              <span>Verify Candidate Credentials</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Quick Notice */}
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <CheckCircle2 size={13} className="text-sky-400" />
              <span>Personalized Subject Guarantee</span>
            </div>
            <p>
              Once authenticated, your terminal loads exclusively your registered subjects. Results are tied directly to your candidate record.
            </p>
          </div>
        </div>

      </div>

      {/* ================= PRE-EXAM BIO & SUBJECT CONFIRMATION MODAL ================= */}
      {verifiedCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-sky-600 to-sky-700 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={22} />
                <div>
                  <h3 className="font-extrabold text-lg">Candidate Identity Verification</h3>
                  <p className="text-xs text-sky-100">Confirm your personal profile and registered subjects</p>
                </div>
              </div>
              <button
                onClick={() => setVerifiedCandidate(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 text-xs sm:text-sm">
              
              {/* Security Constraint 1: Already Completed */}
              {verifiedCandidate.status === 'Completed' ? (() => {
                const isReleased = Boolean(verifiedCandidate.resultsReleased ?? getGlobalResultsReleased());
                return (
                  <div className="space-y-4">
                    {isReleased ? (
                      /* Status: Approved & Released */
                      <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
                          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                            <CheckCircle2 size={20} />
                            <span>Official CBT Result Approved & Released</span>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-mono font-bold">
                            AUDITED
                          </span>
                        </div>

                        <p className="text-slate-300 text-xs">
                          Candidate <strong>{verifiedCandidate.fullName}</strong>, your official mock examination results have been verified and authorized by the center administration.
                        </p>

                        {verifiedCandidate.examResult && (
                          <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Aggregate Score</span>
                                <div className="font-mono font-black text-2xl text-emerald-400 mt-0.5">
                                  {verifiedCandidate.examResult.totalScore} <span className="text-sm text-slate-400 font-normal">/ {verifiedCandidate.examResult.maxScore || 400}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Overall Percentage</span>
                                <div className="font-mono font-black text-2xl text-sky-400 mt-0.5">
                                  {verifiedCandidate.examResult.percentage}%
                                </div>
                              </div>
                            </div>

                            {/* Registered Email Connection Notice */}
                            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                              <span className="flex items-center gap-1.5 text-slate-300">
                                <Mail size={13} className="text-sky-400" />
                                <span>Connected Result Email:</span>
                              </span>
                              <span className="font-mono text-sky-300 font-bold">
                                {verifiedCandidate.email || 'None registered'}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="pt-1 flex flex-col sm:flex-row gap-2.5">
                          <button
                            type="button"
                            onClick={() => setShowStudentReviewModal(true)}
                            className="flex-1 py-3 px-4 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2"
                          >
                            <FileText size={15} />
                            <span>View Full Transcript & Review Answers</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Status: Under Review / Withheld */
                      <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-3">
                        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                          <Lock size={18} />
                          <span>Examination Completed — Result Withheld</span>
                        </div>
                        <p className="text-slate-300 text-xs leading-relaxed">
                          Candidate <strong>{verifiedCandidate.fullName}</strong> has successfully submitted this examination. 
                          Under institutional anti-malpractice rules, scores and explanations are locked until central verification.
                        </p>
                        <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1.5 text-[11px]">
                          <div className="flex items-center gap-1.5 text-slate-300 font-bold">
                            <Clock size={13} className="text-amber-400" />
                            <span>Awaiting Board Release</span>
                          </div>
                          <p className="text-slate-400">
                            Once released by the center administrator, your score will automatically appear on this portal, and a notification will be dispatched to <strong className="text-white font-mono">{verifiedCandidate.email || 'your registered email'}</strong>.
                          </p>
                        </div>
                        <p className="text-[11px] text-slate-500 italic">
                          Multiple exam attempts are strictly disabled. To authorize a re-sit, please contact the center invigilator.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })() : !timeWindowStatus.valid ? (
                /* Security Constraint 2: Outside Scheduled Window */
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-2 text-rose-300">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <AlertTriangle size={18} />
                    <span>Access Window Restricted</span>
                  </div>
                  <p>{timeWindowStatus.message}</p>
                </div>
              ) : (
                /* Ready to Proceed */
                <div className="space-y-4">
                  {/* Candidate Bio Card */}
                  <div className="flex items-center gap-4 p-4 bg-slate-800/80 rounded-xl border border-slate-700">
                    <div className="w-14 h-14 rounded-full bg-slate-700 text-sky-400 flex items-center justify-center font-bold text-xl uppercase border-2 border-sky-500/40">
                      {verifiedCandidate.fullName?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-white">{verifiedCandidate.fullName}</h4>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="font-mono text-sky-300 font-bold">{verifiedCandidate.username}</span>
                        <span>•</span>
                        <span>{verifiedCandidate.examType}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-semibold">{verifiedCandidate.category || 'General'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                        <MapPin size={12} className="text-slate-500" />
                        <span>{verifiedCandidate.center || 'PrepCBT Center 01'} ({verifiedCandidate.seatNumber || 'Seat 01'})</span>
                      </div>
                    </div>
                  </div>

                  {/* Registered Subjects Confirmation */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold uppercase tracking-wider text-slate-300">
                        Registered Examination Subjects ({verifiedCandidate.registeredSubjects?.length || 0}):
                      </span>
                      <span className="text-sky-400 font-medium">Personalized to you</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {verifiedCandidate.registeredSubjects?.map((subId, idx) => (
                        <div
                          key={subId}
                          className="px-3 py-2 bg-slate-800/90 rounded-lg border border-slate-700 text-xs flex items-center gap-2 text-slate-200"
                        >
                          <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-400 font-mono font-bold text-[10px] flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="font-semibold">{getSubjectName(subId)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Exam Parameters */}
                  <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                    <div className="p-2.5 bg-slate-800/50 rounded-xl border border-slate-700">
                      <span className="text-[10px] uppercase text-slate-400 font-bold">Standard</span>
                      <p className="font-extrabold text-white mt-0.5">{verifiedCandidate.examType}</p>
                    </div>
                    <div className="p-2.5 bg-slate-800/50 rounded-xl border border-slate-700">
                      <span className="text-[10px] uppercase text-slate-400 font-bold">Duration</span>
                      <p className="font-extrabold text-sky-300 mt-0.5">
                        {assignedExam ? assignedExam.durationMinutes : 120} Mins
                      </p>
                    </div>
                    <div className="p-2.5 bg-slate-800/50 rounded-xl border border-slate-700">
                      <span className="text-[10px] uppercase text-slate-400 font-bold">Calculator</span>
                      <p className="font-extrabold text-emerald-400 mt-0.5">Enabled (C)</p>
                    </div>
                  </div>

                  {/* Exam Instructions Notice */}
                  <div className="p-3 bg-sky-950/30 rounded-xl border border-sky-500/30 text-[11px] text-slate-300 space-y-1">
                    <div className="font-bold text-sky-300 flex items-center gap-1.5">
                      <Clock size={13} />
                      <span>Exam Instructions Before Proceeding:</span>
                    </div>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-400">
                      <li>The exam timer starts immediately upon clicking Confirm.</li>
                      <li>Use keyboard keys <strong>A, B, C, D</strong> for choices, <strong>N</strong> for next, <strong>P</strong> for previous.</li>
                      <li>Clicking <strong>Submit</strong> or allowing time to expire will finalize your score.</li>
                    </ul>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setVerifiedCandidate(null)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
              >
                Back to Login
              </button>

              {verifiedCandidate.status !== 'Completed' && timeWindowStatus.valid && (
                <button
                  type="button"
                  onClick={handleConfirmStartExam}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/30 flex items-center gap-2"
                >
                  <span>Confirm & Begin Examination</span>
                  <ArrowRight size={15} />
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ================= FORGOT PASSCODE / CREDENTIAL RECOVERY MODAL ================= */}
      {showForgotHelp && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
            <div className="bg-gradient-to-r from-sky-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <HelpCircle size={22} />
                <div>
                  <h3 className="font-extrabold text-base">Candidate Credential Recovery</h3>
                  <p className="text-xs text-sky-100">Official procedure for misplaced passcodes</p>
                </div>
              </div>
              <button
                onClick={() => setShowForgotHelp(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs sm:text-sm text-slate-300">
              <div className="p-3.5 bg-sky-500/10 border border-sky-500/20 rounded-xl flex items-start gap-3">
                <ShieldCheck size={20} className="text-sky-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-white text-xs sm:text-sm">
                    In-Person Verification Required
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    To maintain strict examination integrity and prevent impersonation, candidates cannot self-reset passcodes over public internet without center authorization.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                  How to regain your credentials:
                </h4>
                <ol className="list-decimal pl-5 space-y-2 text-xs text-slate-300 leading-relaxed">
                  <li>
                    <strong>Approach Center Invigilator / Staff:</strong> Present your photo ID or Registration Docket at the accreditation desk.
                  </li>
                  <li>
                    <strong>Admin Override:</strong> The administrator will open the <em>Candidate Manager & Gradebook</em>, search your registration number, and click the <strong>Reset Passcode</strong> key icon.
                  </li>
                  <li>
                    <strong>Immediate Access:</strong> A new randomized or custom passcode will be issued on the spot and your docket will be reprinted if required.
                  </li>
                </ol>
              </div>
            </div>

            <div className="bg-slate-950 px-6 py-3.5 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotHelp(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
              >
                Close Guidance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= APPROVED STUDENT RESULT & REVIEW TRANSCRIPT MODAL ================= */}
      {showStudentReviewModal && verifiedCandidate && (
        <StudentResultReviewModal
          candidate={verifiedCandidate}
          onClose={() => setShowStudentReviewModal(false)}
        />
      )}

    </div>
  );
}
