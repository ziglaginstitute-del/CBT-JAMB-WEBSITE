import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, Filter, BookOpen, Trash2, Edit3, 
  FileUp, CheckCircle2, AlertCircle, X, Check, 
  Sparkles, Layers, Award, ChevronDown, ChevronUp, Copy,
  Usb, HardDrive, Lock, Unlock, Monitor, Download, Upload, ShieldAlert
} from 'lucide-react';
import { DIFFICULTIES } from '../data/questions';
import { 
  getQuestionBank, addQuestion, updateQuestion, 
  deleteQuestion, saveQuestionBank, syncFromSupabase,
  exportQuestionBankUSB, importQuestionBankUSB, toggleExamKioskMode, isElectronApp,
  getAllSubjects 
} from '../utils/storage';
import { autoFormatLatexString } from '../utils/latexHelper';
import LatexEditorToolbar from './LatexEditorToolbar';
import PDFQuestionUploader from './PDFQuestionUploader';
import MathText from './MathText';
import Question from './Question';

export default function QuestionBankManager() {
  const [questionBank, setQuestionBank] = useState({});
  const [allSubjects, setAllSubjects] = useState(() => getAllSubjects());
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all');
  const [selectedDiffFilter, setSelectedDiffFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  // Desktop Offline / USB / Lockdown Examination Mode States
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const isElectron = isElectronApp();

  const handleExportFlashDrive = async () => {
    setIsExporting(true);
    try {
      const res = await exportQuestionBankUSB();
      if (res.success) {
        showToast(`✅ Exported Question Bank to flash drive (${res.filePath || 'saved'})!`);
      } else if (!res.canceled) {
        showToast(`❌ Export failed: ${res.error || 'Unknown error'}`);
      }
    } catch (err) {
      showToast(`Export error: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFlashDrive = async () => {
    setIsImporting(true);
    try {
      const res = await importQuestionBankUSB();
      if (res.success) {
        reloadBank();
        showToast(`✅ Successfully imported & merged ${res.count} questions from flash drive!`);
      } else if (!res.canceled) {
        showToast(`❌ Import failed: ${res.error || 'Unknown error'}`);
      }
    } catch (err) {
      showToast(`Import error: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleToggleKiosk = async () => {
    const nextState = !isKioskMode;
    const res = await toggleExamKioskMode(nextState);
    if (res.success) {
      setIsKioskMode(nextState);
      showToast(nextState 
        ? '🔒 Exam Center Kiosk Mode ACTIVATED! Full-screen examination locked.' 
        : '🔓 Exam Center Kiosk Mode DEACTIVATED. Standard desktop window restored.'
      );
    } else {
      showToast(`Kiosk toggle failed: ${res.error || 'Failed'}`);
    }
  };

  // Form State for Question Creator / Editor
  const [formSubject, setFormSubject] = useState('english');
  const [formDifficulty, setFormDifficulty] = useState('Intermediate');
  const [formTopic, setFormTopic] = useState('');
  const [formPassage, setFormPassage] = useState('');
  const [formQuestion, setFormQuestion] = useState('');
  const [formOptA, setFormOptA] = useState('');
  const [formOptB, setFormOptB] = useState('');
  const [formOptC, setFormOptC] = useState('');
  const [formOptD, setFormOptD] = useState('');
  const [formCorrectKey, setFormCorrectKey] = useState('A');
  const [formHint, setFormHint] = useState('');
  const [formExplanation, setFormExplanation] = useState('');
  const [formError, setFormError] = useState('');

  // Load question bank on mount
  useEffect(() => {
    reloadBank();
  }, []);

  const reloadBank = () => {
    setQuestionBank(getQuestionBank());
    setAllSubjects(getAllSubjects());
    syncFromSupabase().then(() => {
      setQuestionBank(getQuestionBank());
      setAllSubjects(getAllSubjects());
    }).catch(() => {});
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Open Creator for a new question
  const handleOpenCreate = () => {
    setEditingQuestion(null);
    setFormSubject(selectedSubjectFilter === 'all' ? 'english' : selectedSubjectFilter);
    setFormDifficulty('Intermediate');
    setFormTopic('');
    setFormPassage('');
    setFormQuestion('');
    setFormOptA('');
    setFormOptB('');
    setFormOptC('');
    setFormOptD('');
    setFormCorrectKey('A');
    setFormHint('');
    setFormExplanation('');
    setFormError('');
    setIsCreatorOpen(true);
  };

  // Open Editor for an existing question
  const handleOpenEdit = (q) => {
    setEditingQuestion(q);
    setFormSubject(q.subject || 'english');
    setFormDifficulty(q.difficulty || 'Intermediate');
    setFormTopic(q.topic || '');
    setFormPassage(q.passage || '');
    setFormQuestion(q.question || '');
    setFormOptA(q.options?.find(o => o.label === 'A')?.text || '');
    setFormOptB(q.options?.find(o => o.label === 'B')?.text || '');
    setFormOptC(q.options?.find(o => o.label === 'C')?.text || '');
    setFormOptD(q.options?.find(o => o.label === 'D')?.text || '');
    setFormCorrectKey(q.correctOption || 'A');
    setFormHint(q.hint || '');
    setFormExplanation(q.explanation || '');
    setFormError('');
    setIsCreatorOpen(true);
  };

  const handleSaveQuestion = (e) => {
    e.preventDefault();
    if (!formQuestion.trim()) {
      setFormError('Please enter the question text.');
      return;
    }
    if (!formOptA.trim() || !formOptB.trim()) {
      setFormError('Options A and B are mandatory.');
      return;
    }

    const payload = {
      subject: formSubject,
      difficulty: formDifficulty,
      topic: formTopic.trim(),
      passage: formPassage.trim(),
      question: formQuestion.trim(),
      options: [
        { label: 'A', text: formOptA.trim() },
        { label: 'B', text: formOptB.trim() },
        { label: 'C', text: formOptC.trim() || 'Option C' },
        { label: 'D', text: formOptD.trim() || 'Option D' },
      ],
      correctOption: formCorrectKey,
      hint: formHint.trim(),
      explanation: formExplanation.trim() || 'Official PrepCBT explanation.'
    };

    if (editingQuestion) {
      updateQuestion(editingQuestion.id, payload);
      showToast('Question updated successfully!');
    } else {
      addQuestion(payload);
      showToast('New question added to Question Bank!');
    }

    reloadBank();
    setIsCreatorOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this question from the Question Bank?')) {
      deleteQuestion(id);
      reloadBank();
      showToast('Question deleted.');
    }
  };

  // Flatten and filter questions
  const allQuestions = useMemo(() => {
    const list = [];
    Object.keys(questionBank).forEach(subKey => {
      const questions = questionBank[subKey] || [];
      questions.forEach(q => {
        list.push({ ...q, subject: q.subject || subKey });
      });
    });
    return list;
  }, [questionBank]);

  const filteredQuestions = useMemo(() => {
    return allQuestions.filter(q => {
      const matchSubject = selectedSubjectFilter === 'all' || q.subject === selectedSubjectFilter;
      const matchDiff = selectedDiffFilter === 'All' || q.difficulty === selectedDiffFilter;
      const matchQuery = !searchQuery.trim() || 
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.explanation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.topic?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchSubject && matchDiff && matchQuery;
    });
  }, [allQuestions, selectedSubjectFilter, selectedDiffFilter, searchQuery]);

  // Statistics
  const totalQuestions = allQuestions.length;
  const beginnerCount = allQuestions.filter(q => q.difficulty === 'Beginner').length;
  const intermediateCount = allQuestions.filter(q => q.difficulty === 'Intermediate').length;
  const advancedCount = allQuestions.filter(q => q.difficulty === 'Advanced').length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-sky-500/15 text-sky-400 border border-sky-500/30">
              Admin & Teacher Portal
            </span>
            <span className="text-xs text-slate-400">Dynamic Storage</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Question Bank Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Author past questions, upload official JAMB/WASSCE past question PDFs, manage topics, and configure question repositories for scheduled mock exams.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsImporterOpen(!isImporterOpen)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-xl text-xs sm:text-sm font-bold border border-slate-700 transition"
          >
            <FileUp size={16} />
            <span>{isImporterOpen ? 'Close PDF Importer' : 'Import PDF / Bulk Text'}</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-sky-600/30 transition hover:scale-[1.02]"
          >
            <Plus size={16} />
            <span>Create Question</span>
          </button>
        </div>
      </div>

      {/* Offline Desktop Station & Kiosk Lockdown Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
            isKioskMode 
              ? 'bg-rose-500/15 border-rose-500/30 text-rose-400 shadow-lg shadow-rose-500/20' 
              : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
          }`}>
            {isKioskMode ? <Lock size={22} className="stroke-[2.5]" /> : <Monitor size={22} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-sm">Exam Center Kiosk Mode</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isKioskMode 
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' 
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {isKioskMode ? 'LOCKED IN EXAM MODE' : 'WINDOWED DESKTOP'}
              </span>
              {isElectron && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                  Offline Engine Active
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isKioskMode 
                ? 'Full-screen lockdown active. Students cannot minimize, access browser tabs, or use unauthorized app shortcuts.' 
                : 'Turn ON to lock student terminals into accredited full-screen anti-cheating mode.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* USB Export Button */}
          <button
            type="button"
            onClick={handleExportFlashDrive}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition disabled:opacity-50"
            title="Save entire question repository to USB drive (.json)"
          >
            <Usb size={15} className="text-sky-400" />
            <span>{isExporting ? 'Exporting...' : 'Export Question Bank to Flash Drive'}</span>
          </button>

          {/* USB Import Button */}
          <button
            type="button"
            onClick={handleImportFlashDrive}
            disabled={isImporting}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition disabled:opacity-50"
            title="Merge external questions from USB flash drive (.json)"
          >
            <HardDrive size={15} className="text-amber-400" />
            <span>{isImporting ? 'Importing...' : 'Import Questions from Flash Drive'}</span>
          </button>

          {/* Kiosk Mode Toggle Switch */}
          <button
            type="button"
            onClick={handleToggleKiosk}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition shadow-md shrink-0 ${
              isKioskMode
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
            }`}
          >
            {isKioskMode ? <Unlock size={14} /> : <Lock size={14} />}
            <span>{isKioskMode ? 'Exit Kiosk Lockdown' : 'Enable Kiosk Mode'}</span>
          </button>
        </div>
      </div>

      {/* PDF Uploader Section */}
      {isImporterOpen && (
        <div className="animate-in fade-in duration-200">
          <PDFQuestionUploader
            onImportComplete={(count) => {
              reloadBank();
              setIsImporterOpen(false);
              showToast(`Imported ${count} questions successfully!`);
            }}
            onCancel={() => setIsImporterOpen(false)}
          />
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-xs font-medium text-slate-400">Total Questions</span>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">{totalQuestions}</div>
          <div className="text-[11px] text-sky-400 mt-0.5">Across 10 subjects</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-xs font-medium text-slate-400">Beginner Tier</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono mt-1">{beginnerCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{totalQuestions > 0 ? Math.round((beginnerCount/totalQuestions)*100) : 0}% of bank</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-xs font-medium text-slate-400">Intermediate Tier</span>
          <div className="text-2xl sm:text-3xl font-black text-sky-400 font-mono mt-1">{intermediateCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{totalQuestions > 0 ? Math.round((intermediateCount/totalQuestions)*100) : 0}% of bank</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-xs font-medium text-slate-400">Advanced Tier</span>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono mt-1">{advancedCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{totalQuestions > 0 ? Math.round((advancedCount/totalQuestions)*100) : 0}% of bank</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions by topic, keyword, or solution..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-medium"
            />
            <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-white"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Difficulty Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium shrink-0">Difficulty:</span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {DIFFICULTIES.map(diff => (
                <button
                  key={diff}
                  onClick={() => setSelectedDiffFilter(diff)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    selectedDiffFilter === diff
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Subject Pills */}
        <div className="pt-2 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-t border-slate-800/80">
          <button
            onClick={() => setSelectedSubjectFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              selectedSubjectFilter === 'all'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            All Subjects ({totalQuestions})
          </button>
          {allSubjects.map(sub => {
            const count = (questionBank[sub.id] || []).length;
            const isSelected = selectedSubjectFilter === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => setSelectedSubjectFilter(sub.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <span>{sub.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  isSelected ? 'bg-sky-800 text-white' : 'bg-slate-900 text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Questions Listing */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>Showing <strong className="text-white">{filteredQuestions.length}</strong> matching questions</span>
          <span>Click "Edit" on any question to modify its options or answer key</span>
        </div>

        {filteredQuestions.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
            <BookOpen size={40} className="mx-auto text-slate-600" />
            <h3 className="text-lg font-bold text-white">No questions found</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              There are no questions matching your current filters. Try resetting filters or adding a new question.
            </p>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5"
            >
              <Plus size={15} />
              <span>Create New Question</span>
            </button>
          </div>
        ) : (
          filteredQuestions.map((q, idx) => {
            const subObj = allSubjects.find(s => s.id === q.subject) || { name: q.subject };

            return (
              <div
                key={q.id || idx}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono">
                      {subObj.name}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      q.difficulty === 'Beginner'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : q.difficulty === 'Advanced'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                    }`}>
                      {q.difficulty}
                    </span>
                    {q.topic && (
                      <span className="text-xs text-slate-400 italic">
                        Topic: <strong className="text-slate-300 not-italic">{q.topic}</strong>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(q)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                      title="Edit Question"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                      title="Delete Question"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <Question
                  question={q}
                  questionNumber={idx + 1}
                  totalQuestions={filteredQuestions.length}
                  mode="preview"
                  showHintByDefault={true}
                  showExplanationByDefault={true}
                  subjectName={subObj.name}
                />
              </div>
            );
          })
        )}
      </div>

      {/* Interactive Question Creator / Editor Modal */}
      {isCreatorOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="bg-gradient-to-r from-sky-600 to-sky-700 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <BookOpen size={20} />
                <h2 className="font-extrabold text-lg">
                  {editingQuestion ? 'Edit Question' : 'Create New CBT Question'}
                </h2>
              </div>
              <button
                onClick={() => setIsCreatorOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
              {/* Row 1: Subject, Difficulty, Topic */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Subject
                  </label>
                  <select
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                  >
                    {allSubjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Topic / Category (Optional)
                  </label>
                  <input
                    type="text"
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value)}
                    placeholder="e.g. Calculus, Kinematics, Poetry"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
                  />
                </div>
              </div>

              {/* Optional Passage */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Comprehension Passage / Reading Context (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formPassage}
                  onChange={(e) => setFormPassage(e.target.value)}
                  placeholder="Include reading passage for English or Literature questions..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white"
                />
              </div>

              {/* Question Text with LaTeX Math Toolbar & Live Preview */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Question Text <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[11px] text-sky-400 font-medium">
                    LaTeX Math supported (use <code className="bg-slate-950 px-1 py-0.5 rounded text-sky-300 font-mono text-[10px]">$...$</code> or <code className="bg-slate-950 px-1 py-0.5 rounded text-sky-300 font-mono text-[10px]">$$...$$</code>)
                  </span>
                </div>

                {/* Math & Science Quick LaTeX Toolbar */}
                <LatexEditorToolbar
                  previewText={formQuestion}
                  onAutoFormat={() => {
                    setFormQuestion(autoFormatLatexString(formQuestion));
                    setFormOptA(autoFormatLatexString(formOptA));
                    setFormOptB(autoFormatLatexString(formOptB));
                    setFormOptC(autoFormatLatexString(formOptC));
                    setFormOptD(autoFormatLatexString(formOptD));
                    setFormExplanation(autoFormatLatexString(formExplanation));
                  }}
                  onInsertLatex={(latex) => setFormQuestion(prev => prev ? `${prev} $${latex}$` : `$${latex}$`)}
                  showPreview={true}
                />

                <textarea
                  rows={3}
                  value={formQuestion}
                  onChange={(e) => setFormQuestion(e.target.value)}
                  placeholder="e.g. Solve for $x$: $3x^2 - 5x + 2 = 0$, or calculate the velocity in $\text{m/s}$..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-sky-500 font-medium font-mono text-xs sm:text-sm"
                  required
                />
              </div>

              {/* Options A, B, C, D */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Multiple Choice Options
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 font-mono font-bold flex items-center justify-center shrink-0">A</span>
                    <input
                      type="text"
                      value={formOptA}
                      onChange={(e) => setFormOptA(e.target.value)}
                      placeholder="Option A text"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      required
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 font-mono font-bold flex items-center justify-center shrink-0">B</span>
                    <input
                      type="text"
                      value={formOptB}
                      onChange={(e) => setFormOptB(e.target.value)}
                      placeholder="Option B text"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      required
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 font-mono font-bold flex items-center justify-center shrink-0">C</span>
                    <input
                      type="text"
                      value={formOptC}
                      onChange={(e) => setFormOptC(e.target.value)}
                      placeholder="Option C text"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 font-mono font-bold flex items-center justify-center shrink-0">D</span>
                    <input
                      type="text"
                      value={formOptD}
                      onChange={(e) => setFormOptD(e.target.value)}
                      placeholder="Option D text"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Correct Key and Hint */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Correct Option Key
                  </label>
                  <select
                    value={formCorrectKey}
                    onChange={(e) => setFormCorrectKey(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-bold"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Exam Hint (Optional)
                  </label>
                  <input
                    type="text"
                    value={formHint}
                    onChange={(e) => setFormHint(e.target.value)}
                    placeholder="e.g. Formula: P = V × I"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* Explanation */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Teacher Explanation & Step-by-Step Solution
                </label>
                <textarea
                  rows={2}
                  value={formExplanation}
                  onChange={(e) => setFormExplanation(e.target.value)}
                  placeholder="Explain why the answer is correct and why other options are distractors..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white"
                />
              </div>

              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              {/* Footer */}
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
                  <span>{editingQuestion ? 'Update Question' : 'Save to Bank'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
