import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Plus, Trash2, CheckCircle2, AlertTriangle, 
  Sparkles, Layers, ShieldCheck, Tag, Info, Check, X
} from 'lucide-react';
import { 
  getAllSubjects, getCustomSubjects, addCustomSubject, 
  deleteCustomSubject, getQuestionBank 
} from '../utils/storage';

const POPULAR_SUGGESTED_SUBJECTS = [
  { name: 'Further Mathematics', icon: 'Calculator' },
  { name: 'Civic Education', icon: 'Landmark' },
  { name: 'Agricultural Science', icon: 'Leaf' },
  { name: 'Christian Religious Studies (CRS)', icon: 'Book' },
  { name: 'Islamic Religious Studies (IRS)', icon: 'BookOpen' },
  { name: 'Geography', icon: 'Globe' },
  { name: 'Hausa', icon: 'Languages' },
  { name: 'Yoruba', icon: 'Languages' },
  { name: 'Igbo', icon: 'Languages' },
  { name: 'French', icon: 'Languages' },
  { name: 'Music', icon: 'Music' },
  { name: 'Physical & Health Education', icon: 'Activity' }
];

export default function SubjectManager({ onSubjectsUpdated }) {
  const [allSubjects, setAllSubjects] = useState([]);
  const [customSubjects, setCustomSubjects] = useState([]);
  const [questionBank, setQuestionBank] = useState({});
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectId, setNewSubjectId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState(null);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = () => {
    const all = getAllSubjects();
    const custom = getCustomSubjects();
    const bank = getQuestionBank();
    setAllSubjects(all);
    setCustomSubjects(custom);
    setQuestionBank(bank);
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleNameChange = (val) => {
    setNewSubjectName(val);
    const slug = val.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
    setNewSubjectId(slug);
    setErrorMsg('');
  };

  const handleAddSubject = (e) => {
    e.preventDefault();
    if (!newSubjectName.trim()) {
      setErrorMsg('Subject name is required.');
      return;
    }
    const cleanId = newSubjectId.trim() || newSubjectName.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
    
    // Check duplicate
    if (allSubjects.some(s => s.id === cleanId)) {
      setErrorMsg(`A subject with ID "${cleanId}" already exists.`);
      return;
    }

    const created = addCustomSubject({
      id: cleanId,
      name: newSubjectName.trim(),
      icon: 'BookOpen'
    });

    if (created) {
      loadSubjects();
      setIsCreatorOpen(false);
      setNewSubjectName('');
      setNewSubjectId('');
      showToast(`✅ Subject "${created.name}" added successfully!`);
      if (onSubjectsUpdated) onSubjectsUpdated();
    }
  };

  const handleAddSuggested = (suggested) => {
    const slug = suggested.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
    if (allSubjects.some(s => s.id === slug)) {
      showToast(`Subject "${suggested.name}" is already active.`);
      return;
    }
    const created = addCustomSubject({
      id: slug,
      name: suggested.name,
      icon: suggested.icon || 'BookOpen'
    });
    if (created) {
      loadSubjects();
      showToast(`✅ Added "${created.name}" to curriculum subjects!`);
      if (onSubjectsUpdated) onSubjectsUpdated();
    }
  };

  const handleDeleteSubject = (id, name) => {
    if (window.confirm(`Are you sure you want to remove custom subject "${name}"? Existing questions in this subject will remain in the database.`)) {
      deleteCustomSubject(id);
      loadSubjects();
      showToast(`Subject "${name}" removed from active subjects.`);
      if (onSubjectsUpdated) onSubjectsUpdated();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-sky-600 text-white px-5 py-3 rounded-xl shadow-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center gap-1.5">
              <Layers size={13} />
              <span>Curriculum Management</span>
            </span>
            <span className="text-xs text-slate-400">{allSubjects.length} Active Subjects</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Institutional Subject & Course Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Configure subjects offered in your mock exams. Custom subjects automatically appear in candidate registration, question bank authoring, and mock batch scheduler.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsCreatorOpen(true);
            setNewSubjectName('');
            setNewSubjectId('');
            setErrorMsg('');
          }}
          className="flex items-center gap-2 px-5 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-lg shadow-sky-600/30 shrink-0"
        >
          <Plus size={16} />
          <span>Add New Subject</span>
        </button>
      </div>

      {/* Popular Suggestions Bar */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
            <Sparkles size={14} className="text-amber-400" />
            <span>Quick-Add Popular Nigerian Curriculum Subjects:</span>
          </span>
          <span className="text-slate-500 text-[11px]">Click to add instantly</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {POPULAR_SUGGESTED_SUBJECTS.map(s => {
            const slug = s.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
            const isAlreadyAdded = allSubjects.some(sub => sub.id === slug);
            return (
              <button
                key={s.name}
                type="button"
                onClick={() => !isAlreadyAdded && handleAddSuggested(s)}
                disabled={isAlreadyAdded}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  isAlreadyAdded 
                    ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed border border-slate-800' 
                    : 'bg-slate-800 text-slate-200 hover:bg-sky-600 hover:text-white border border-slate-700'
                }`}
              >
                {isAlreadyAdded ? <Check size={12} className="text-emerald-400" /> : <Plus size={12} />}
                <span>{s.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Subjects Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <BookOpen size={15} className="text-sky-400" />
          <span>All Registered Subjects ({allSubjects.length})</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {allSubjects.map(sub => {
            const count = questionBank[sub.id]?.length || 0;
            const isDefault = !sub.isCustom;

            return (
              <div 
                key={sub.id}
                className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 shadow-sm hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                    sub.mandatory 
                      ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                      : sub.isCustom
                        ? 'bg-purple-500/10 border border-purple-500/30 text-purple-400'
                        : 'bg-sky-500/10 border border-sky-500/30 text-sky-400'
                  }`}>
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-white text-sm">{sub.name}</h4>
                      {sub.mandatory && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Mandatory
                        </span>
                      )}
                      {sub.isCustom && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Custom
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 font-mono">
                      <span>ID: {sub.id}</span>
                      <span>•</span>
                      <span className="text-slate-300 font-bold">{count} Questions in Bank</span>
                    </div>
                  </div>
                </div>

                {sub.isCustom ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteSubject(sub.id, sub.name)}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
                    title="Delete custom subject"
                  >
                    <Trash2 size={16} />
                  </button>
                ) : (
                  <span className="text-[10px] uppercase font-bold text-slate-500 px-2 py-1 bg-slate-950 rounded-lg border border-slate-800">
                    Standard
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Custom Subject Modal */}
      {isCreatorOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">Add New Subject</h3>
                  <p className="text-xs text-slate-400">Expand your institution's examination curriculum</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatorOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubject} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Subject Name:
                </label>
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Further Mathematics or Civic Education"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-sky-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Subject Identifier / Code (Slug):
                </label>
                <input
                  type="text"
                  value={newSubjectId}
                  onChange={(e) => setNewSubjectId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="e.g. further_mathematics"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sky-300 font-mono text-xs focus:outline-none focus:border-sky-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Unique internal code used for question storage and question bank indexing.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle size={15} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatorOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-sky-600/30"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
