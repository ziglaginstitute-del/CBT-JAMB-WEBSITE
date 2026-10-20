import React, { useState } from 'react';
import { X, Check, Clock, User, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react';
import { SUBJECTS } from '../data/questions';

const PRESETS = [
  { name: 'Physical Sciences / Engineering', subjects: ['english', 'mathematics', 'physics', 'chemistry'] },
  { name: 'Medical / Biological Sciences', subjects: ['english', 'biology', 'chemistry', 'physics'] },
  { name: 'Social / Management Sciences', subjects: ['english', 'mathematics', 'economics', 'government'] },
  { name: 'Arts & Humanities', subjects: ['english', 'literature', 'government', 'economics'] },
  { name: 'Commercial / Business', subjects: ['english', 'mathematics', 'accounting', 'commerce'] },
];

export default function ExamSetupModal({ isOpen, onClose, onStartExam }) {
  if (!isOpen) return null;

  const [examType, setExamType] = useState('JAMB'); // 'JAMB' | 'WASSCE'
  const [candidateName, setCandidateName] = useState('Abdulrazaq Emmanuel');
  const [candidateReg, setCandidateReg] = useState(`2026/UTME/${Math.floor(100000 + Math.random() * 900000)}`);
  const [selectedSubjects, setSelectedSubjects] = useState(['english', 'mathematics', 'physics', 'chemistry']);
  const [durationMinutes, setDurationMinutes] = useState(30); // default 30 min quick mock or 120 standard
  const [errorMsg, setErrorMsg] = useState('');

  const toggleSubject = (subId) => {
    if (subId === 'english' && examType === 'JAMB') return; // English is mandatory in JAMB

    if (selectedSubjects.includes(subId)) {
      if (selectedSubjects.length <= 1) {
        setErrorMsg('At least one subject must remain selected.');
        return;
      }
      setSelectedSubjects(selectedSubjects.filter(id => id !== subId));
      setErrorMsg('');
    } else {
      if (examType === 'JAMB' && selectedSubjects.length >= 4) {
        setErrorMsg('Official JAMB UTME requires exactly 4 subjects.');
        return;
      }
      setSelectedSubjects([...selectedSubjects, subId]);
      setErrorMsg('');
    }
  };

  const applyPreset = (preset) => {
    setSelectedSubjects(preset.subjects);
    setErrorMsg('');
  };

  const handleStart = () => {
    if (examType === 'JAMB' && selectedSubjects.length !== 4) {
      setErrorMsg('Please select exactly 4 subjects for JAMB UTME mock (English + 3 electives).');
      return;
    }
    if (selectedSubjects.length === 0) {
      setErrorMsg('Please select at least one subject.');
      return;
    }

    onStartExam({
      examType,
      candidateName: candidateName.trim() || 'Candidate',
      candidateReg: candidateReg.trim() || '2026/UTME/000000',
      subjects: selectedSubjects,
      durationMinutes: Number(durationMinutes)
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 to-sky-700 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <Clock size={20} />
            <div>
              <h2 className="font-extrabold text-lg">Configure Standard Mock Exam</h2>
              <p className="text-xs text-sky-100">Official Computer-Based Testing Simulation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg transition text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Exam Standard Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Examination Standard
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setExamType('JAMB');
                  if (!selectedSubjects.includes('english')) {
                    setSelectedSubjects(['english', ...selectedSubjects.slice(0, 3)]);
                  }
                }}
                className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                  examType === 'JAMB'
                    ? 'bg-sky-500/15 border-sky-500 text-white ring-1 ring-sky-500'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div>
                  <div className="font-bold text-sm text-white">JAMB UTME Standard</div>
                  <div className="text-xs text-slate-400">4 Subjects • Scaled to 400 Marks</div>
                </div>
                {examType === 'JAMB' && <Check size={18} className="text-sky-400" />}
              </button>

              <button
                type="button"
                onClick={() => setExamType('WASSCE')}
                className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                  examType === 'WASSCE'
                    ? 'bg-sky-500/15 border-sky-500 text-white ring-1 ring-sky-500'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div>
                  <div className="font-bold text-sm text-white">WASSCE (WAEC) Standard</div>
                  <div className="text-xs text-slate-400">Official Grades A1 through F9</div>
                </div>
                {examType === 'WASSCE' && <Check size={18} className="text-sky-400" />}
              </button>
            </div>
          </div>

          {/* Candidate Profile Simulation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Candidate Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 font-medium"
                  placeholder="e.g. Chukwuma Ngozi"
                />
                <User size={16} className="absolute right-3.5 top-3 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Registration / Center No.
              </label>
              <input
                type="text"
                value={candidateReg}
                onChange={(e) => setCandidateReg(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 font-mono"
                placeholder="2026/UTME/123456"
              />
            </div>
          </div>

          {/* Preset Combos */}
          {examType === 'JAMB' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Quick Subject Combinations
                </span>
                <span className="text-xs text-sky-400">Click to apply preset</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map(preset => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 transition"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Subject Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Choose Subjects ({selectedSubjects.length} {examType === 'JAMB' ? '/ 4 Selected' : 'Selected'})
              </label>
              {examType === 'JAMB' && (
                <span className={`text-xs font-bold ${selectedSubjects.length === 4 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {selectedSubjects.length === 4 ? 'Ready (4 of 4)' : `Pick ${4 - selectedSubjects.length} more`}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SUBJECTS.map(sub => {
                const isSelected = selectedSubjects.includes(sub.id);
                const isMandatory = sub.id === 'english' && examType === 'JAMB';

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
                      <span className="text-[10px] bg-sky-900 text-sky-300 px-1 rounded uppercase font-mono">REQ</span>
                    ) : isSelected ? (
                      <Check size={14} className="text-sky-400 shrink-0" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duration Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Mock Exam Time Limit
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: '10 Mins (Sprint)', value: 10 },
                { label: '30 Mins (Standard Practice)', value: 30 },
                { label: '120 Mins (Official Full Exam)', value: 120 },
              ].map(item => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setDurationMinutes(item.value)}
                  className={`p-3 rounded-xl border text-center transition ${
                    durationMinutes === item.value
                      ? 'bg-sky-500/20 border-sky-500 text-white font-bold ring-1 ring-sky-500'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800 text-xs font-medium'
                  }`}
                >
                  <div className="text-sm text-white font-mono">{item.value} mins</div>
                  <div className="text-[10px] text-slate-400 truncate">{item.label}</div>
                </button>
              ))}
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950/70 px-6 py-4 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Keyboard shortcuts active in mock: <span className="font-mono text-sky-400 font-bold">A, B, C, D, N, P, R, S</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleStart}
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/30 transition flex items-center gap-2"
            >
              <span>Begin Examination</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
