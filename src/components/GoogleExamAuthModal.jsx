import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Play, CheckCircle2, Clock, BookOpen, 
  User, Mail, Key, ArrowRight, Printer, Pause, 
  Sparkles, X, Award, AlertCircle, GraduationCap, ChevronRight
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { 
  findCandidateByEmail, 
  addCandidate, 
  generateCandidateRegNo, 
  generateCandidatePasscode, 
  getAllSubjects,
  getQuestionBank,
  getAvailableTopicsForSubject
} from '../utils/storage';

const SUBJECT_PRESETS = [
  { name: 'Physical Sciences / Engineering', subjects: ['english', 'mathematics', 'physics', 'chemistry'] },
  { name: 'Biological / Medical Sciences', subjects: ['english', 'biology', 'chemistry', 'physics'] },
  { name: 'Social / Management Sciences', subjects: ['english', 'mathematics', 'economics', 'government'] },
  { name: 'Arts & Humanities', subjects: ['english', 'literature', 'government', 'economics'] },
  { name: 'Commercial & Business', subjects: ['english', 'mathematics', 'economics', 'commerce'] }
];

export default function GoogleExamAuthModal({ 
  isOpen, 
  onClose, 
  onStartExam, 
  onViewResults,
  onViewSlip,
  onStudentLogin
}) {
  const [googleEmail, setGoogleEmail] = useState('');
  const [studentName, setStudentName] = useState('');
  const [examType, setExamType] = useState('JAMB UTME');
  const [selectedSubjects, setSelectedSubjects] = useState(['english', 'mathematics', 'physics', 'chemistry']);
  const [durationMinutes, setDurationMinutes] = useState(120);
  
  // Stages: 'input' -> 'briefing'
  const [step, setStep] = useState('input');
  const [activeCandidate, setActiveCandidate] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);

  // Auto-launch countdown timer state
  const [countdown, setCountdown] = useState(6);
  const [isCountdownPaused, setIsCountdownPaused] = useState(false);
  const [autoLaunchEnabled, setAutoLaunchEnabled] = useState(true);

  // Check on mount and listen to Supabase OAuth events
  useEffect(() => {
    if (!isOpen) return;

    // Pre-fill last used Google Email if available
    const savedEmail = localStorage.getItem('prepcbt_last_google_email');
    if (savedEmail && !googleEmail) {
      setGoogleEmail(savedEmail);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        const email = session.user.email;
        const name = session.user.user_metadata?.full_name || 
                     session.user.user_metadata?.name || 
                     email.split('@')[0];
        setGoogleEmail(email);
        setStudentName(name);
        handleProcessGoogleUser(email, name);
      }
    }).catch(err => {
      console.warn('Supabase auth session check notice:', err);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user?.email) {
        const email = session.user.email;
        const name = session.user.user_metadata?.full_name || 
                     session.user.user_metadata?.name || 
                     email.split('@')[0];
        setGoogleEmail(email);
        setStudentName(name);
        handleProcessGoogleUser(email, name);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [isOpen]);

  // Countdown timer for automatic sign-in & exam launch
  useEffect(() => {
    let timer = null;
    if (step === 'briefing' && autoLaunchEnabled && !isCountdownPaused && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (step === 'briefing' && autoLaunchEnabled && !isCountdownPaused && countdown === 0) {
      handleConfirmLaunch();
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [step, autoLaunchEnabled, isCountdownPaused, countdown]);

  if (!isOpen) return null;

  // Safe Supabase Google OAuth Trigger - checks provider before full browser redirect
  const handleGoogleOAuthLogin = async () => {
    setIsOAuthLoading(true);
    setErrorMessage('');
    try {
      // 1. Get the OAuth target URL with skipBrowserRedirect: true so the user is never stranded on a raw JSON error page
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          skipBrowserRedirect: true
        }
      });

      if (error) {
        setErrorMessage('Google OAuth redirect notice: ' + error.message);
        setIsOAuthLoading(false);
        return;
      }

      if (data?.url) {
        // Probe whether provider is enabled on Supabase backend
        try {
          const probe = await fetch(data.url);
          if (!probe.ok && probe.status === 400) {
            const body = await probe.json().catch(() => ({}));
            if (body?.msg?.includes('provider is not enabled') || body?.error_code === 'validation_failed') {
              setErrorMessage(
                'Google sign-in is temporarily unavailable. Please type your Google Email address below to start immediately!'
              );
              setIsOAuthLoading(false);
              return;
            }
          }
        } catch (probeErr) {
          // A fetch error or CORS error when redirecting to accounts.google.com means Google OAuth IS enabled!
        }

        // Provider is active and configured -> proceed to Google OAuth consent screen
        window.location.href = data.url;
      }
    } catch (err) {
      setErrorMessage('Could not connect to Google OAuth: ' + (err.message || 'Please use direct email entry below.'));
    } finally {
      setIsOAuthLoading(false);
    }
  };

  const handleManualGoogleSubmit = (e) => {
    e.preventDefault();
    if (!googleEmail.trim()) {
      setErrorMessage('Please enter your Google Email address.');
      return;
    }
    if (!googleEmail.includes('@')) {
      setErrorMessage('Please enter a valid Google email address (e.g. name@gmail.com).');
      return;
    }

    const email = googleEmail.trim().toLowerCase();
    const name = studentName.trim() || email.split('@')[0].replace(/[._]/g, ' ').toUpperCase();
    
    localStorage.setItem('prepcbt_last_google_email', email);
    handleProcessGoogleUser(email, name);
  };

  const handleProcessGoogleUser = (email, name) => {
    setErrorMessage('');
    let existingCand = findCandidateByEmail(email);

    if (existingCand) {
      // Existing student signed in via Google: immediately grant access to their personal Student Dashboard!
      if (onStudentLogin) {
        onStudentLogin(existingCand);
        onClose();
        return;
      }

      // Fallback if onStudentLogin is not provided
      setActiveCandidate(existingCand);
      setStep('completed-notice');
      return;
    } else {
      // Create new self-registered Google candidate
      const cleanReg = generateCandidateRegNo(examType);
      const generatedPass = generateCandidatePasscode();
      const newCand = addCandidate({
        fullName: name,
        username: cleanReg,
        password: generatedPass,
        email: email,
        examType: examType === 'Topic Practice' ? 'Custom Topic Drill' : examType,
        category: examType === 'Topic Practice' ? 'Targeted Topic Practice' : 'Online Self-Service',
        registeredSubjects: selectedSubjects,
        durationMinutes: Number(durationMinutes),
        center: 'PrepCBT Online Portal (Google Verified)',
        status: 'Active',
        isSelfRegistered: true,
        resultsReleased: true // Results will be shown immediately!
      });

      setActiveCandidate(newCand);
      setStep('briefing');
      setCountdown(6);
    }
  };

  const handleConfirmLaunch = () => {
    if (!activeCandidate) return;
    onStartExam(activeCandidate);
    onClose();
  };

  const allSubjects = getAllSubjects();

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/90 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center p-2 shadow-inner">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Google Candidate Fast-Track Portal</h3>
              <p className="text-xs text-slate-400">Instant Student Examination Registration & Auto-Login</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* STEP 1: Google Account Input / One-Click */}
        {step === 'input' && (
          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Value Proposition Banner */}
            <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/25 flex items-start gap-3 text-xs text-sky-200 leading-relaxed">
              <Sparkles size={18} className="text-sky-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white font-bold block mb-0.5">Skip manual form filling & passcodes</strong>
                Sign in with your Google email address to automatically configure your exam track, receive your official candidate registration number, and jump directly into the CBT examination hall with immediate results!
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
                <div className="space-y-1">
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            {/* One-Click Google OAuth Button */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleGoogleOAuthLogin}
                disabled={isOAuthLoading}
                className="w-full py-3.5 px-4 rounded-xl border border-slate-600 bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm flex items-center justify-center gap-3 transition shadow-md hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{isOAuthLoading ? 'Verifying Google Connection...' : '1-Click Sign in with Google Account'}</span>
              </button>

              <div className="text-center text-[11px] text-slate-400">
                Direct OAuth authentication
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-700/80 w-full"></div>
              <span className="bg-slate-900 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                Or Instant Google Email Registration
              </span>
            </div>

            {/* Direct Google Email Form */}
            <form onSubmit={handleManualGoogleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase">
                    Your Full Name
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="e.g. Ibrahim Adebayo"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase">
                    Google Email Address *
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="email"
                      value={googleEmail}
                      onChange={(e) => setGoogleEmail(e.target.value)}
                      placeholder="e.g. student@gmail.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-sky-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Exam Category Quick Selector */}
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-semibold text-slate-300 uppercase">
                  Select Examination Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'JAMB UTME', name: 'JAMB UTME Mock', time: '120 Mins', qs: '180 Qs' },
                    { id: 'WASSCE', name: 'WASSCE / WAEC', time: '150 Mins', qs: '40 Qs/Sub' },
                    { id: 'Topic Practice', name: 'Topic Drill', time: '45 Mins', qs: 'Focused' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setExamType(cat.id);
                        if (cat.id === 'JAMB UTME') setDurationMinutes(120);
                        if (cat.id === 'WASSCE') setDurationMinutes(150);
                        if (cat.id === 'Topic Practice') setDurationMinutes(45);
                      }}
                      className={`p-3 rounded-xl border text-left transition ${
                        examType === cat.id
                          ? 'bg-sky-500/20 border-sky-500 text-white shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-bold text-xs">{cat.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{cat.time} • {cat.qs}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject Presets */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-semibold text-slate-300 uppercase">
                  Subject Combination Preset
                </label>
                <select
                  value={SUBJECT_PRESETS.findIndex(p => JSON.stringify(p.subjects) === JSON.stringify(selectedSubjects))}
                  onChange={(e) => {
                    const idx = Number(e.target.value);
                    if (idx >= 0 && SUBJECT_PRESETS[idx]) {
                      setSelectedSubjects(SUBJECT_PRESETS[idx].subjects);
                    }
                  }}
                  className="w-full py-2.5 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500"
                >
                  {SUBJECT_PRESETS.map((p, i) => (
                    <option key={i} value={i}>
                      {p.name} ({p.subjects.map(s => allSubjects.find(sub => sub.id === s)?.name || s).join(', ')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <span>Continue with Google & View Exam Briefing</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>

          </div>
        )}

        {/* STEP 2: PRE-EXAM INFORMATION BRIEFING & AUTO-SIGN-IN */}
        {step === 'briefing' && activeCandidate && (
          <div className="p-6 sm:p-8 space-y-5 animate-in fade-in duration-200">
            
            {/* Top Auto-Launch Countdown Banner */}
            {autoLaunchEnabled && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-emerald-500/15 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 text-emerald-300 font-semibold">
                  <Clock size={16} className="text-emerald-400 animate-spin" />
                  <span>
                    Auto-launching exam in <strong className="text-white text-sm font-mono">{countdown}s</strong>...
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCountdownPaused(!isCountdownPaused)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold transition flex items-center gap-1 border border-slate-700"
                  >
                    {isCountdownPaused ? <Play size={11} className="fill-white" /> : <Pause size={11} />}
                    <span>{isCountdownPaused ? 'Resume Countdown' : 'Pause'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmLaunch}
                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition shadow-sm"
                  >
                    Start Now
                  </button>
                </div>
              </div>
            )}

            {/* Official Candidate CBT Photocard Information */}
            <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-black text-lg">
                    {activeCandidate.fullName?.charAt(0)?.toUpperCase() || 'C'}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{activeCandidate.fullName}</h4>
                    <p className="text-xs text-sky-400 font-mono">{activeCandidate.email}</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  Google Verified
                </span>
              </div>

              {/* Grid of Exam Credentials & Parameters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Reg Number</span>
                  <strong className="text-white font-mono text-xs font-bold">{activeCandidate.username}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Passcode</span>
                  <strong className="text-amber-400 font-mono text-xs font-bold">{activeCandidate.password}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Category</span>
                  <strong className="text-sky-300 text-xs font-bold">{activeCandidate.examType || 'JAMB UTME'}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Duration</span>
                  <strong className="text-white text-xs font-bold">{activeCandidate.durationMinutes || 120} Minutes</strong>
                </div>
              </div>

              {/* Registered Subjects */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  Registered Examination Subjects (4)
                </span>
                <div className="flex flex-wrap gap-2">
                  {(activeCandidate.registeredSubjects || []).map((subId, idx) => (
                    <span 
                      key={subId} 
                      className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                      <span>{allSubjects.find(s => s.id === subId)?.name || subId}</span>
                      <span className="text-[10px] text-slate-400">({subId === 'english' ? '60 Qs' : '40 Qs'})</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Essential Examination Rules & Hotkeys */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 space-y-2.5">
              <div className="font-bold text-white flex items-center gap-2">
                <ShieldCheck size={16} className="text-sky-400" />
                <span>Information Needed to Take the Examination</span>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>Use keys <kbd className="px-1 bg-slate-800 text-slate-200 rounded font-mono text-[10px]">A, B, C, D</kbd> to select answer choices.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>Use keys <kbd className="px-1 bg-slate-800 text-slate-200 rounded font-mono text-[10px]">N</kbd> (Next), <kbd className="px-1 bg-slate-800 text-slate-200 rounded font-mono text-[10px]">P</kbd> (Previous), <kbd className="px-1 bg-slate-800 text-slate-200 rounded font-mono text-[10px]">S</kbd> (Submit).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>An on-screen scientific calculator is available at the top right header.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-emerald-300 font-semibold">Immediate Results: Your score & full corrections with explanations display right here immediately after submitting!</span>
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    onViewSlip(activeCandidate);
                    onClose();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition"
                >
                  <Printer size={15} />
                  <span>Exam Docket</span>
                </button>

                {onStudentLogin && (
                  <button
                    type="button"
                    onClick={() => {
                      onStudentLogin(activeCandidate);
                      onClose();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <GraduationCap size={15} />
                    <span>Open My Student Dashboard</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleConfirmLaunch}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition hover:scale-[1.02]"
              >
                <Play size={15} className="fill-white" />
                <span>Start CBT Examination Now</span>
              </button>
            </div>

          </div>
        )}

        {/* COMPLETED EXAM NOTICE: Direct Dashboard & Results Access */}
        {step === 'completed-notice' && activeCandidate && (
          <div className="p-6 sm:p-8 space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <Award size={28} />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">Welcome Back, {activeCandidate.fullName}!</h4>
              <p className="text-xs text-slate-400 mt-1">
                Candidate <strong>{activeCandidate.fullName}</strong> ({activeCandidate.username}). You can view past test records or launch a new exam below.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 max-w-md mx-auto text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Latest Aggregate Score:</span>
                <strong className="text-emerald-400 font-bold text-sm">
                  {activeCandidate.examResult?.totalScore ?? 'N/A'} / {activeCandidate.examResult?.maxScore ?? '400'}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Accuracy:</span>
                <strong className="text-sky-300 font-bold">{activeCandidate.examResult?.percentage ?? '0'}%</strong>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap justify-center gap-3">
              {onStudentLogin && (
                <button
                  type="button"
                  onClick={() => {
                    onStudentLogin(activeCandidate);
                    onClose();
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 rounded-xl text-xs font-black transition shadow-lg shadow-emerald-500/25 flex items-center gap-2 hover:scale-[1.02]"
                >
                  <GraduationCap size={15} />
                  <span>Go to My Student Dashboard (Take More Exams)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onViewResults(activeCandidate);
                  onClose();
                }}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition"
              >
                Review Latest Questions
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
