import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Lock, Key, BookOpen, Layers, Clock, 
  CheckCircle2, Sparkles, AlertCircle, ArrowRight, Check, Plus, 
  Filter, HelpCircle, Eye, EyeOff, ShieldCheck, GraduationCap, ChevronDown, ChevronUp
} from 'lucide-react';
import { 
  getAllSubjects, 
  getQuestionBank, 
  addCandidate, 
  generateCandidateRegNo, 
  generateCandidatePasscode,
  getAvailableTopicsForSubject
} from '../utils/storage';

const SUBJECT_PRESETS = [
  { name: 'Physical Sciences / Engineering', subjects: ['english', 'mathematics', 'physics', 'chemistry'] },
  { name: 'Biological / Medical Sciences', subjects: ['english', 'biology', 'chemistry', 'physics'] },
  { name: 'Social / Management Sciences', subjects: ['english', 'mathematics', 'economics', 'government'] },
  { name: 'Arts & Humanities', subjects: ['english', 'literature', 'government', 'economics'] },
  { name: 'Commercial & Business', subjects: ['english', 'mathematics', 'economics', 'commerce'] }
];

export default function StudentSelfRegistration({ onRegistrationSuccess, onSwitchToLogin }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [examType, setExamType] = useState('JAMB UTME'); // 'JAMB UTME' | 'WASSCE' | 'Topic Practice'
  const [selectedSubjects, setSelectedSubjects] = useState(['english', 'mathematics', 'physics', 'chemistry']);
  const [selectedTopics, setSelectedTopics] = useState({}); // { [subjectId]: string[] }
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allSubjects, setAllSubjects] = useState([]);
  const [expandedTopicSubject, setExpandedTopicSubject] = useState(null);

  useEffect(() => {
    setAllSubjects(getAllSubjects());
    // Auto generate an initial memorable passcode
    setPasscode(generateCandidatePasscode());
  }, []);

  const handleGeneratePasscode = () => {
    setPasscode(generateCandidatePasscode());
  };

  const handleExamTypeChange = (type) => {
    setExamType(type);
    setErrorMessage('');
    if (type === 'JAMB UTME') {
      setDurationMinutes(120);
      if (!selectedSubjects.includes('english')) {
        setSelectedSubjects(['english', ...selectedSubjects.filter(s => s !== 'english').slice(0, 3)]);
      } else if (selectedSubjects.length > 4) {
        setSelectedSubjects(selectedSubjects.slice(0, 4));
      }
    } else if (type === 'WASSCE') {
      setDurationMinutes(150);
    } else if (type === 'Topic Practice') {
      setDurationMinutes(45);
    }
  };

  const applyPreset = (preset) => {
    setSelectedSubjects(preset.subjects);
    setErrorMessage('');
  };

  const toggleSubject = (subId) => {
    if (examType === 'JAMB UTME' && subId === 'english') {
      return; // English is compulsory in JAMB
    }

    if (selectedSubjects.includes(subId)) {
      if (selectedSubjects.length <= 1) return;
      setSelectedSubjects(selectedSubjects.filter(id => id !== subId));
    } else {
      if (examType === 'JAMB UTME' && selectedSubjects.length >= 4) {
        setErrorMessage('JAMB UTME requires exactly 4 subjects (English + 3 electives).');
        return;
      }
      setSelectedSubjects([...selectedSubjects, subId]);
      setErrorMessage('');
    }
  };

  const toggleTopic = (subId, topicName) => {
    setSelectedTopics(prev => {
      const current = prev[subId] || [];
      const updated = current.includes(topicName)
        ? current.filter(t => t !== topicName)
        : [...current, topicName];
      return { ...prev, [subId]: updated };
    });
  };

  const selectAllTopicsForSubject = (subId, topics) => {
    setSelectedTopics(prev => ({
      ...prev,
      [subId]: topics.map(t => t.name)
    }));
  };

  const clearTopicsForSubject = (subId) => {
    setSelectedTopics(prev => ({
      ...prev,
      [subId]: []
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address so we can deliver your result statement.');
      return;
    }
    if (!passcode.trim()) {
      setErrorMessage('Please enter or generate a passcode.');
      return;
    }
    if (examType === 'JAMB UTME' && selectedSubjects.length !== 4) {
      setErrorMessage('JAMB UTME requires exactly 4 subjects. Please select English plus 3 other subjects.');
      return;
    }
    if (selectedSubjects.length === 0) {
      setErrorMessage('Please select at least one subject to examine.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Build customized questionsBySubject if topics were filtered
      const bank = getQuestionBank();
      const customQuestionsBySubject = {};
      let hasCustomTopicFilter = false;

      selectedSubjects.forEach(subId => {
        const available = bank[subId] || [];
        const chosenTopics = selectedTopics[subId] || [];

        if (chosenTopics.length > 0) {
          hasCustomTopicFilter = true;
          const filtered = available.filter(q => q.topic && chosenTopics.includes(q.topic.trim()));
          customQuestionsBySubject[subId] = filtered.length > 0 ? filtered : available;
        } else {
          customQuestionsBySubject[subId] = available;
        }
      });

      // 2. Generate official candidate registration
      const cleanReg = generateCandidateRegNo(examType);
      const newCandidate = addCandidate({
        fullName: fullName.trim(),
        username: cleanReg,
        password: passcode.trim(),
        email: email.trim().toLowerCase(),
        examType: examType === 'Topic Practice' ? 'Custom Topic Drill' : examType,
        category: examType === 'Topic Practice' ? 'Targeted Topic Practice' : 'Standard Candidate',
        registeredSubjects: selectedSubjects,
        durationMinutes: Number(durationMinutes),
        center: 'PrepCBT Online Portal (Self-Service)',
        status: 'Pending',
        questionsBySubject: hasCustomTopicFilter ? customQuestionsBySubject : null
      });

      // 3. Trigger immediate entry into verification docket & exam hall
      onRegistrationSuccess(newCandidate);

    } catch (err) {
      setErrorMessage('Registration error: ' + (err.message || 'Please try again.'));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-3 pb-5 border-b border-slate-700/80">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 shrink-0">
          <GraduationCap size={24} className="stroke-[2.2]" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
            New Student Online Registration
          </h2>
          <p className="text-xs text-slate-400">
            Create your candidate profile, pick your subjects, and take your test immediately.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
          <span className="leading-relaxed">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 text-xs sm:text-sm">
        
        {/* Step 1: Candidate Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sky-400 font-bold uppercase tracking-wider text-xs">
            <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center font-mono text-[11px]">1</span>
            <span>Personal Information & Result Destination</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Chioma Emmanuel"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-sky-500 font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
                Email Address <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. student@gmail.com"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-sky-500 font-medium"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Your score statement and question breakdown will be delivered here.
              </p>
            </div>
          </div>

          {/* Passcode */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide">
                Create Examination Passcode <span className="text-rose-400">*</span>
              </label>
              <button
                type="button"
                onClick={handleGeneratePasscode}
                className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold"
              >
                <Sparkles size={12} />
                <span>Auto-Generate</span>
              </button>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type={showPasscode ? 'text' : 'password'}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="e.g. PASS-8924"
                className="w-full pl-9 pr-12 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sky-300 font-mono text-sm focus:outline-none focus:border-sky-500 font-bold"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasscode(!showPasscode)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPasscode ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Save this passcode! You will use it together with your registration number or email to log back in.
            </p>
          </div>
        </div>

        {/* Step 2: Select Examination Category / Mode */}
        <div className="space-y-3 pt-3 border-t border-slate-700/60">
          <div className="flex items-center gap-2 text-sky-400 font-bold uppercase tracking-wider text-xs">
            <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center font-mono text-[11px]">2</span>
            <span>Choose Examination Category & Mode</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => handleExamTypeChange('JAMB UTME')}
              className={`p-3 rounded-2xl border text-left transition ${
                examType === 'JAMB UTME'
                  ? 'bg-sky-500/15 border-sky-500 text-white ring-1 ring-sky-500'
                  : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-white text-xs">JAMB UTME Mock</span>
                <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded font-bold">180 Qs</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                4 Subjects (60 English + 40 each). 120 mins. 400 marks standard.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleExamTypeChange('WASSCE')}
              className={`p-3 rounded-2xl border text-left transition ${
                examType === 'WASSCE'
                  ? 'bg-sky-500/15 border-sky-500 text-white ring-1 ring-sky-500'
                  : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-white text-xs">WASSCE / WAEC</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">150 Mins</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Flexible subjects with WAEC letter grading (A1–F9).
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleExamTypeChange('Topic Practice')}
              className={`p-3 rounded-2xl border text-left transition ${
                examType === 'Topic Practice'
                  ? 'bg-emerald-500/15 border-emerald-500 text-white ring-1 ring-emerald-500'
                  : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-white text-xs">Topic-Based Drill</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">Custom</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Filter by specific topics taught in class. Choose your own duration.
              </p>
            </button>
          </div>
        </div>

        {/* Step 3: Subject Selection */}
        <div className="space-y-3 pt-3 border-t border-slate-700/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sky-400 font-bold uppercase tracking-wider text-xs">
              <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center font-mono text-[11px]">3</span>
              <span>
                Select Subjects ({selectedSubjects.length} {examType === 'JAMB UTME' ? '/ 4 Selected' : 'Selected'})
              </span>
            </div>
            {examType === 'JAMB UTME' && (
              <span className="text-[11px] text-amber-400 font-medium">
                English is compulsory + 3 electives
              </span>
            )}
          </div>

          {/* Quick Presets (For JAMB) */}
          {examType === 'JAMB UTME' && (
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Quick Subject Combinations:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SUBJECT_PRESETS.map(p => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-sky-500 text-slate-300 text-xs font-semibold transition"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Subject Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {allSubjects.map(sub => {
              const isSelected = selectedSubjects.includes(sub.id);
              const isCompulsory = examType === 'JAMB UTME' && sub.id === 'english';

              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => toggleSubject(sub.id)}
                  disabled={isCompulsory}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-between gap-1.5 ${
                    isSelected
                      ? 'bg-sky-600 text-white border-sky-500 shadow-sm'
                      : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-slate-600'
                  } ${isCompulsory ? 'opacity-90' : ''}`}
                >
                  <span className="truncate">{sub.name}</span>
                  {isSelected ? <Check size={13} className="shrink-0" /> : <Plus size={13} className="shrink-0 text-slate-500" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 4: Topic Selection (For All Selected Subjects) */}
        <div className="space-y-3 pt-3 border-t border-slate-700/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-xs">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-mono text-[11px]">4</span>
              <span>Filter Specific Topics (Optional)</span>
            </div>
            <span className="text-[11px] text-slate-400">
              Only test on topics you choose
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Click on any subject below to pick which specific topics to include. If no specific topics are chosen, questions are pulled from all topics.
          </p>

          <div className="space-y-2">
            {selectedSubjects.map(subId => {
              const subObj = allSubjects.find(s => s.id === subId) || { name: subId };
              const availableTopics = getAvailableTopicsForSubject(subId);
              const currentTopics = selectedTopics[subId] || [];
              const isExpanded = expandedTopicSubject === subId;

              return (
                <div key={subId} className="bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden">
                  <div 
                    onClick={() => setExpandedTopicSubject(isExpanded ? null : subId)}
                    className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <BookOpen size={16} className="text-sky-400" />
                      <span className="font-bold text-white text-xs sm:text-sm">{subObj.name} Topics</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        ({availableTopics.length} available)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        currentTopics.length > 0
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {currentTopics.length > 0 ? `${currentTopics.length} topics filtered` : 'All topics included'}
                      </span>
                      {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 bg-slate-950/60 border-t border-slate-800 space-y-3">
                      {availableTopics.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">
                          No tagged topics are defined for this subject yet. All questions in this subject bank will be included.
                        </p>
                      ) : (
                        <>
                          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800/80">
                            <span className="text-slate-400">Click topics to include:</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => selectAllTopicsForSubject(subId, availableTopics)}
                                className="text-[11px] text-sky-400 hover:underline"
                              >
                                Select All
                              </button>
                              <span>•</span>
                              <button
                                type="button"
                                onClick={() => clearTopicsForSubject(subId)}
                                className="text-[11px] text-slate-400 hover:underline"
                              >
                                Reset to All
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {availableTopics.map(t => {
                              const isChecked = currentTopics.includes(t.name);
                              return (
                                <button
                                  key={t.name}
                                  type="button"
                                  onClick={() => toggleTopic(subId, t.name)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                                    isChecked
                                      ? 'bg-emerald-600 text-white shadow-sm'
                                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
                                  }`}
                                >
                                  {isChecked ? <Check size={12} /> : <Plus size={12} className="text-slate-400" />}
                                  <span>{t.name}</span>
                                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                                    isChecked ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-900 text-slate-400'
                                  }`}>
                                    {t.count}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Duration (If Topic Practice) */}
        {examType === 'Topic Practice' && (
          <div className="space-y-2 pt-3 border-t border-slate-700/60">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide">
              Test Duration (Minutes)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[30, 45, 60, 90].map(mins => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDurationMinutes(mins)}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    durationMinutes === mins
                      ? 'bg-sky-600 text-white border-sky-500'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {mins} Mins
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-700/80 space-y-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-2xl font-extrabold text-sm sm:text-base bg-gradient-to-r from-sky-500 via-sky-600 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-white shadow-xl shadow-sky-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2.5 disabled:opacity-50"
          >
            <span>Complete Registration & Enter Exam Hall</span>
            <ArrowRight size={18} />
          </button>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-xs text-slate-400 hover:text-white transition"
            >
              Already registered with an official slip? <strong className="text-sky-400 underline font-semibold">Sign in here</strong>
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
