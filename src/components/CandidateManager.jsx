import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, FileSpreadsheet, Download, RefreshCw, 
  Search, Trash2, Printer, Eye, CheckCircle2, Clock, 
  AlertTriangle, Key, Sparkles, BookOpen, ChevronRight, X, ArrowUpDown, Play
} from 'lucide-react';
import { SUBJECTS } from '../data/questions';
import { 
  getCandidates, addCandidate, updateCandidate, 
  deleteCandidate, resetCandidateExam, bulkAddCandidates, 
  generateCandidateRegNo, generateCandidatePasscode, getScheduledExams 
} from '../utils/storage';
import CandidateExamSlipModal from './CandidateExamSlipModal';

const PRESET_COMBINATIONS = [
  {
    name: 'Science / Engineering',
    category: 'Science',
    examType: 'JAMB UTME',
    subjects: ['english', 'mathematics', 'physics', 'chemistry']
  },
  {
    name: 'Biological / Medical Sciences',
    category: 'Biological & Medical',
    examType: 'JAMB UTME',
    subjects: ['english', 'biology', 'chemistry', 'physics']
  },
  {
    name: 'Arts / Humanities / Law',
    category: 'Arts / Humanities',
    examType: 'JAMB UTME',
    subjects: ['english', 'literature', 'government', 'economics']
  },
  {
    name: 'Commercial / Social Sciences',
    category: 'Commercial',
    examType: 'JAMB UTME',
    subjects: ['english', 'mathematics', 'economics', 'commerce']
  },
  {
    name: 'WASSCE General Science (5 Subs)',
    category: 'Science',
    examType: 'WASSCE',
    subjects: ['english', 'mathematics', 'physics', 'chemistry', 'biology']
  }
];

const NIGERIAN_FIRST_NAMES = [
  'Amina', 'Chinedu', 'Fatima', 'Olumide', 'Blessing', 'Kelechi', 'Zainab', 
  'Emeka', 'Folake', 'Tariq', 'Ibrahim', 'Ngozi', 'Babajide', 'Chioma', 
  'Oluwaseun', 'Maryam', 'Damilola', 'Chidiebere', 'Abubakar', 'Simisola'
];

const NIGERIAN_LAST_NAMES = [
  'Bello', 'Eze', 'Yusuf', 'Adeyemi', 'Chukwu', 'Okoro', 'Danjuma', 
  'Okafor', 'Balogun', 'Mohammed', 'Ibe', 'Ogunleye', 'Shehu', 'Nwosu', 
  'Olowu', 'Aliyu', 'Adeleke', 'Onuoha', 'Sanusi', 'Fashola'
];

export default function CandidateManager({ onDirectLoginCandidate }) {
  const [candidates, setCandidates] = useState([]);
  const [scheduledExams, setScheduledExams] = useState([]);
  const [activeTab, setActiveTab] = useState('roster'); // 'roster' | 'register' | 'bulk'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedCandidateSlip, setSelectedCandidateSlip] = useState(null);
  const [viewingResultCandidate, setViewingResultCandidate] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  // Single Registration Form State
  const [regFullName, setRegFullName] = useState('');
  const [regExamType, setRegExamType] = useState('JAMB UTME');
  const [regCategory, setRegCategory] = useState('Science');
  const [regUsername, setRegUsername] = useState(generateCandidateRegNo('JAMB UTME'));
  const [regPassword, setRegPassword] = useState(generateCandidatePasscode());
  const [regSubjects, setRegSubjects] = useState(['english', 'mathematics', 'physics', 'chemistry']);
  const [regScheduledExamId, setRegScheduledExamId] = useState('');
  const [regCenter, setRegCenter] = useState('PrepCBT Center 01 (Main Auditorium)');
  const [regSeatNumber, setRegSeatNumber] = useState('');
  const [formError, setFormError] = useState('');

  // Bulk Generator State
  const [bulkCount, setBulkCount] = useState(10);
  const [bulkCategory, setBulkCategory] = useState('Science');
  const [bulkExamType, setBulkExamType] = useState('JAMB UTME');
  const [bulkAssignExamId, setBulkAssignExamId] = useState('');

  // CSV Import State
  const [csvText, setCsvText] = useState('');
  const [csvError, setCsvError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setCandidates(getCandidates());
    setScheduledExams(getScheduledExams());
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleApplyPreset = (preset) => {
    setRegExamType(preset.examType);
    setRegCategory(preset.category);
    setRegSubjects(preset.subjects);
    setRegUsername(generateCandidateRegNo(preset.examType));
  };

  const toggleSubject = (subId) => {
    if (regExamType === 'JAMB UTME' && subId === 'english') {
      return; // English is mandatory in JAMB
    }
    if (regSubjects.includes(subId)) {
      if (regSubjects.length <= 1) return;
      setRegSubjects(regSubjects.filter(s => s !== subId));
    } else {
      if (regExamType === 'JAMB UTME' && regSubjects.length >= 4) {
        setFormError('JAMB candidates must take exactly 4 subjects.');
        return;
      }
      setRegSubjects([...regSubjects, subId]);
      setFormError('');
    }
  };

  const handleRegisterSingle = (e) => {
    e.preventDefault();
    if (!regFullName.trim()) {
      setFormError('Please enter candidate full name.');
      return;
    }
    if (regExamType === 'JAMB UTME' && regSubjects.length !== 4) {
      setFormError('JAMB candidates must have exactly 4 subjects.');
      return;
    }
    if (!regUsername.trim()) {
      setFormError('Please provide a valid registration number / username.');
      return;
    }
    if (!regPassword.trim()) {
      setFormError('Please provide an exam passcode / password.');
      return;
    }

    const newCandidate = addCandidate({
      fullName: regFullName.trim(),
      examType: regExamType,
      category: regCategory,
      username: regUsername.trim(),
      password: regPassword.trim(),
      registeredSubjects: regSubjects,
      scheduledExamId: regScheduledExamId || null,
      center: regCenter || 'PrepCBT Center 01',
      seatNumber: regSeatNumber.trim() || `Seat ${Math.floor(1 + Math.random() * 80)}`,
      status: 'Pending'
    });

    loadData();
    showToast(`Registered ${newCandidate.fullName} (${newCandidate.username}) successfully!`);
    
    // Automatically display their official exam slip
    setSelectedCandidateSlip(newCandidate);

    // Reset Form for next candidate
    setRegFullName('');
    setRegUsername(generateCandidateRegNo(regExamType));
    setRegPassword(generateCandidatePasscode());
    setRegSeatNumber('');
    setFormError('');
    setActiveTab('roster');
  };

  // Bulk Generator Handler
  const handleGenerateBulk = () => {
    const preset = PRESET_COMBINATIONS.find(p => p.category === bulkCategory && p.examType === bulkExamType) 
      || PRESET_COMBINATIONS[0];

    const generated = [];
    for (let i = 0; i < bulkCount; i++) {
      const fName = NIGERIAN_FIRST_NAMES[Math.floor(Math.random() * NIGERIAN_FIRST_NAMES.length)];
      const lName = NIGERIAN_LAST_NAMES[Math.floor(Math.random() * NIGERIAN_LAST_NAMES.length)];
      const regNo = generateCandidateRegNo(bulkExamType);
      const pass = generateCandidatePasscode();

      generated.push({
        fullName: `${fName} ${lName}`,
        examType: bulkExamType,
        category: bulkCategory,
        username: regNo,
        password: pass,
        registeredSubjects: preset.subjects,
        scheduledExamId: bulkAssignExamId || null,
        center: 'PrepCBT Center 01 (Main Auditorium)',
        seatNumber: `Seat ${i + 1}`,
        status: 'Pending'
      });
    }

    bulkAddCandidates(generated);
    loadData();
    showToast(`Successfully created batch of ${bulkCount} ${bulkCategory} candidates!`);
    setActiveTab('roster');
  };

  // CSV Import Handler
  const handleImportCsv = () => {
    if (!csvText.trim()) {
      setCsvError('Please paste CSV data or upload a file.');
      return;
    }

    try {
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        setCsvError('CSV must have a header row and at least 1 candidate row.');
        return;
      }

      // Expected columns: fullName, examType, subjects, username, password
      const header = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/['"]/g, ''));
      const parsedCandidates = [];

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map(r => r.trim().replace(/['"]/g, ''));
        if (row.length >= 2 && row[0]) {
          const name = row[0];
          const type = row[1] || 'JAMB UTME';
          const subsRaw = row[2] || 'english,mathematics,physics,chemistry';
          const subs = subsRaw.split(';').map(s => s.trim().toLowerCase());
          const user = row[3] || generateCandidateRegNo(type);
          const pass = row[4] || generateCandidatePasscode();

          parsedCandidates.push({
            fullName: name,
            examType: type,
            category: 'General',
            registeredSubjects: subs,
            username: user,
            password: pass,
            center: 'PrepCBT Center 01',
            seatNumber: `Seat ${i}`,
            status: 'Pending'
          });
        }
      }

      if (parsedCandidates.length === 0) {
        setCsvError('No valid candidate rows could be parsed. Check column formats.');
        return;
      }

      bulkAddCandidates(parsedCandidates);
      loadData();
      showToast(`Imported ${parsedCandidates.length} candidates from CSV!`);
      setCsvText('');
      setCsvError('');
      setActiveTab('roster');
    } catch (err) {
      setCsvError('Error parsing CSV: ' + err.message);
    }
  };

  const handleExportCsv = () => {
    if (candidates.length === 0) {
      showToast('No candidates to export.');
      return;
    }

    const headers = ['Full Name', 'Exam Type', 'Category', 'Registration Number / Username', 'Passcode', 'Registered Subjects', 'Status', 'Total Score', 'Percentage', 'Time Submitted'];
    const rows = candidates.map(c => [
      `"${c.fullName || ''}"`,
      `"${c.examType || 'JAMB UTME'}"`,
      `"${c.category || 'General'}"`,
      `"${c.username || ''}"`,
      `"${c.password || ''}"`,
      `"${(c.registeredSubjects || []).join(';')}"`,
      `"${c.status || 'Pending'}"`,
      c.examResult ? c.examResult.totalScore : '',
      c.examResult ? `${c.examResult.percentage}%` : '',
      c.examResult?.submittedAt ? `"${new Date(c.examResult.submittedAt).toLocaleString()}"` : ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `prepcbt_candidates_results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Candidates & Gradebook exported to CSV!');
  };

  const handleReset = (id) => {
    if (window.confirm('Are you sure you want to authorize a re-sit for this candidate? Their previous score will be cleared.')) {
      resetCandidateExam(id);
      loadData();
      showToast('Candidate exam reset! Candidate can now log in and take the exam again.');
    }
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Delete candidate ${name}? This action cannot be undone.`)) {
      deleteCandidate(id);
      loadData();
      showToast(`Removed candidate ${name}.`);
    }
  };

  // Filter and search
  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = 
      c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.username.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' ? true : c.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' ? true : c.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Analytics Metrics
  const totalCount = candidates.length;
  const completedCount = candidates.filter(c => c.status === 'Completed').length;
  const inProgressCount = candidates.filter(c => c.status === 'In Progress').length;
  const pendingCount = candidates.filter(c => c.status === 'Pending').length;
  const completedWithScore = candidates.filter(c => c.status === 'Completed' && c.examResult);
  const avgScore = completedWithScore.length > 0
    ? Math.round(completedWithScore.reduce((sum, c) => sum + (c.examResult.totalScore || 0), 0) / completedWithScore.length)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-sky-600 text-white px-5 py-3 rounded-xl shadow-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Sparkles size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Users size={12} />
                <span>Candidate & Credentials Administration</span>
              </span>
              <span className="text-xs text-slate-400">Subject-Personalized CBT Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Registered Candidates & Gradebook
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Manage student registrations, issue unique passcodes, generate printable exam slips, and monitor live test completion with subject-level scoring.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveTab('register')}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm ${
                activeTab === 'register'
                  ? 'bg-sky-600 text-white shadow-sky-600/30 ring-2 ring-sky-400'
                  : 'bg-slate-700/80 hover:bg-slate-700 text-white border border-slate-600'
              }`}
            >
              <UserPlus size={15} />
              <span>Register Candidate</span>
            </button>

            <button
              onClick={() => setActiveTab('bulk')}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm ${
                activeTab === 'bulk'
                  ? 'bg-sky-600 text-white shadow-sky-600/30 ring-2 ring-sky-400'
                  : 'bg-slate-700/80 hover:bg-slate-700 text-white border border-slate-600'
              }`}
            >
              <FileSpreadsheet size={15} />
              <span>Bulk Generator / CSV</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/20"
              title="Export all candidates and test results to CSV"
            >
              <Download size={15} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Top Analytics Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-700/60">
          <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-700/50">
            <span className="text-[11px] uppercase font-bold text-slate-400">Total Enrolled</span>
            <p className="text-xl sm:text-2xl font-black text-white font-mono">{totalCount}</p>
          </div>

          <div className="p-3.5 bg-emerald-950/30 rounded-xl border border-emerald-500/20">
            <span className="text-[11px] uppercase font-bold text-emerald-400">Tests Completed</span>
            <p className="text-xl sm:text-2xl font-black text-emerald-300 font-mono">{completedCount}</p>
          </div>

          <div className="p-3.5 bg-amber-950/30 rounded-xl border border-amber-500/20">
            <span className="text-[11px] uppercase font-bold text-amber-400">Pending / Ready</span>
            <p className="text-xl sm:text-2xl font-black text-amber-300 font-mono">{pendingCount}</p>
          </div>

          <div className="p-3.5 bg-sky-950/30 rounded-xl border border-sky-500/20">
            <span className="text-[11px] uppercase font-bold text-sky-400">Average Score</span>
            <p className="text-xl sm:text-2xl font-black text-sky-300 font-mono">
              {avgScore} <span className="text-xs text-slate-400 font-normal">/ 400</span>
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('roster')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'roster'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Users size={16} />
          <span>Candidate Roster & Gradebook ({filteredCandidates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('register')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'register'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <UserPlus size={16} />
          <span>Single Registration</span>
        </button>

        <button
          onClick={() => setActiveTab('bulk')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'bulk'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <FileSpreadsheet size={16} />
          <span>Bulk Generator & CSV Import</span>
        </button>
      </div>

      {/* TAB 1: CANDIDATE ROSTER & GRADEBOOK */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidate by name, Reg No (e.g. JAMB/2026/014)..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Filter by Category */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">Track:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="All">All Combinations</option>
                <option value="Science">Science</option>
                <option value="Biological & Medical">Medical / Biological</option>
                <option value="Arts / Humanities">Arts / Humanities</option>
                <option value="Commercial">Commercial</option>
              </select>
            </div>

            {/* Filter by Status */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="All">All Statuses</option>
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-900/90 text-slate-400 uppercase text-[11px] font-bold tracking-wider border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Candidate Details</th>
                    <th className="py-3 px-3">Login Credentials</th>
                    <th className="py-3 px-3">Personalized Subjects</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-center">Score / Grade</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 text-slate-200">
                  {filteredCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Users size={32} className="mx-auto mb-2 opacity-40" />
                        <p className="font-semibold">No candidates match your current search or filters.</p>
                        <button
                          onClick={() => { setSearchQuery(''); setStatusFilter('All'); setCategoryFilter('All'); }}
                          className="mt-2 text-sky-400 hover:underline text-xs"
                        >
                          Reset Filters
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredCandidates.map(cand => {
                      const isCompleted = cand.status === 'Completed';
                      const isInProgress = cand.status === 'In Progress';

                      return (
                        <tr key={cand.id} className="hover:bg-slate-700/30 transition">
                          {/* Candidate Bio */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-700 text-sky-400 flex items-center justify-center font-bold text-xs uppercase shrink-0 border border-slate-600">
                                {cand.fullName?.charAt(0) || 'C'}
                              </div>
                              <div>
                                <div className="font-extrabold text-white text-xs sm:text-sm">
                                  {cand.fullName}
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                                  <span className="font-mono text-sky-400 font-semibold">{cand.examType}</span>
                                  <span>•</span>
                                  <span>{cand.category || 'General'}</span>
                                  <span>•</span>
                                  <span>{cand.seatNumber}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Credentials */}
                          <td className="py-3.5 px-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 font-mono text-xs text-sky-300 font-bold">
                                <span>{cand.username}</span>
                              </div>
                              <div className="flex items-center gap-1 font-mono text-[11px] text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-700/60 w-fit">
                                <Key size={10} className="text-amber-400" />
                                <span>{cand.password}</span>
                              </div>
                            </div>
                          </td>

                          {/* Registered Personalized Subjects */}
                          <td className="py-3.5 px-3 max-w-xs">
                            <div className="flex flex-wrap gap-1">
                              {cand.registeredSubjects?.map(subId => {
                                const subName = SUBJECTS.find(s => s.id === subId)?.name || subId;
                                return (
                                  <span 
                                    key={subId} 
                                    className="px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700 text-[10px] font-semibold text-slate-300"
                                    title={subName}
                                  >
                                    {subName}
                                  </span>
                                );
                              })}
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="py-3.5 px-3 text-center">
                            {isCompleted ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 size={12} />
                                <span>Completed</span>
                              </span>
                            ) : isInProgress ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30 animate-pulse">
                                <Clock size={12} />
                                <span>In Progress</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                <span>Pending</span>
                              </span>
                            )}
                          </td>

                          {/* Score / Grade */}
                          <td className="py-3.5 px-3 text-center">
                            {isCompleted && cand.examResult ? (
                              <div>
                                <span className="font-mono font-black text-sm text-emerald-300">
                                  {cand.examResult.totalScore}
                                </span>
                                <span className="text-[10px] text-slate-400"> / 400</span>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  ({cand.examResult.percentage}%)
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-500 text-xs italic">—</span>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Docket / Slip */}
                              <button
                                onClick={() => setSelectedCandidateSlip(cand)}
                                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition"
                                title="Print Official Exam Slip / Docket"
                              >
                                <Printer size={15} />
                              </button>

                              {/* Login As This Candidate Shortcut */}
                              {onDirectLoginCandidate && (
                                <button
                                  onClick={() => onDirectLoginCandidate(cand)}
                                  className="p-1.5 text-sky-400 hover:text-sky-200 hover:bg-sky-500/20 rounded-lg transition"
                                  title="Launch CBT session as this candidate"
                                >
                                  <Play size={15} />
                                </button>
                              )}

                              {/* Reset Exam if completed */}
                              {isCompleted && (
                                <button
                                  onClick={() => handleReset(cand.id)}
                                  className="p-1.5 text-amber-400 hover:text-amber-200 hover:bg-amber-500/20 rounded-lg transition"
                                  title="Authorize Exam Re-sit (Reset score)"
                                >
                                  <RefreshCw size={15} />
                                </button>
                              )}

                              {/* Delete Candidate */}
                              <button
                                onClick={() => handleDelete(cand.id, cand.fullName)}
                                className="p-1.5 text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 rounded-lg transition"
                                title="Delete Candidate"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SINGLE CANDIDATE REGISTRATION */}
      {activeTab === 'register' && (
        <div className="max-w-3xl mx-auto bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="pb-5 border-b border-slate-700 mb-6">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <UserPlus size={20} className="text-sky-400" />
              <span>Register New Candidate</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Create student credentials with auto-generated Registration Number and secure CBT Passcode.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="mb-6 space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Quick Subject Combination Presets:
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COMBINATIONS.map(preset => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-sky-600 hover:text-white border border-slate-700 rounded-lg text-xs font-semibold text-slate-300 transition"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleRegisterSingle} className="space-y-5 text-xs sm:text-sm">
            {/* Candidate Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Candidate Full Name *
              </label>
              <input
                type="text"
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                placeholder="e.g. Chukwuma Emmanuel Obi"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Exam Type & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Examination Type
                </label>
                <select
                  value={regExamType}
                  onChange={(e) => {
                    setRegExamType(e.target.value);
                    setRegUsername(generateCandidateRegNo(e.target.value));
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="JAMB UTME">JAMB UTME (4 Subjects)</option>
                  <option value="WASSCE">WASSCE (Custom Subjects)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Discipline / Track
                </label>
                <select
                  value={regCategory}
                  onChange={(e) => setRegCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="Science">Physical Sciences / Engineering</option>
                  <option value="Biological & Medical">Medical / Biological Sciences</option>
                  <option value="Arts / Humanities">Arts / Humanities / Law</option>
                  <option value="Commercial">Commercial / Management</option>
                </select>
              </div>
            </div>

            {/* Auto Credentials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-700/60">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-sky-400">
                    Registration No / Username
                  </label>
                  <button
                    type="button"
                    onClick={() => setRegUsername(generateCandidateRegNo(regExamType))}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <RefreshCw size={11} />
                    <span>Regen</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono font-bold text-sky-300 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Passcode / Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setRegPassword(generateCandidatePasscode())}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <RefreshCw size={11} />
                    <span>Regen</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono font-bold text-amber-300 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Subject Selection (Personalized) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Select Candidate's Registered Subjects ({regSubjects.length}{regExamType === 'JAMB UTME' ? '/4' : ''})
                </label>
                <span className="text-[11px] text-slate-400 italic">
                  {regExamType === 'JAMB UTME' ? 'Exact 4 subjects required (English compulsory)' : 'Select subjects for this student'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SUBJECTS.map(sub => {
                  const isSelected = regSubjects.includes(sub.id);
                  const isMandatory = regExamType === 'JAMB UTME' && sub.mandatory;

                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => toggleSubject(sub.id)}
                      disabled={isMandatory}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                        isSelected
                          ? 'bg-sky-500/20 border-sky-500 text-sky-200'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
                      } ${isMandatory ? 'opacity-80 cursor-not-allowed' : ''}`}
                    >
                      <span className="font-semibold text-xs">{sub.name}</span>
                      {isSelected && <CheckCircle2 size={14} className="text-sky-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Center, Hall & Seat */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Assigned Exam Center
                </label>
                <input
                  type="text"
                  value={regCenter}
                  onChange={(e) => setRegCenter(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Seat Number (Optional)
                </label>
                <input
                  type="text"
                  value={regSeatNumber}
                  onChange={(e) => setRegSeatNumber(e.target.value)}
                  placeholder="e.g. Seat 24 (Auto if blank)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle size={15} />
                <span>{formError}</span>
              </div>
            )}

            <div className="pt-4 border-t border-slate-700 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('roster')}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-sky-600/30 flex items-center gap-2"
              >
                <UserPlus size={15} />
                <span>Save & Issue Examination Docket</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: BULK GENERATOR & CSV IMPORT */}
      {activeTab === 'bulk' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Box 1: Quick Batch Generator */}
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="pb-3 border-b border-slate-700">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles size={18} className="text-amber-400" />
                <span>Quick Batch Candidate Generator</span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Instantly populate realistic candidate accounts with auto-assigned subjects, reg numbers, and passcodes.
              </p>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Number of Candidates to Generate
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={bulkCount}
                    onChange={(e) => setBulkCount(Number(e.target.value))}
                    className="flex-1 accent-sky-500"
                  />
                  <span className="font-mono font-bold text-base text-sky-400 w-12 text-center bg-slate-900 py-1 rounded border border-slate-700">
                    {bulkCount}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Candidate Stream / Subject Combination
                </label>
                <select
                  value={bulkCategory}
                  onChange={(e) => setBulkCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="Science">Science (English, Mathematics, Physics, Chemistry)</option>
                  <option value="Biological & Medical">Medical (English, Biology, Chemistry, Physics)</option>
                  <option value="Arts / Humanities">Arts (English, Literature, Government, Economics)</option>
                  <option value="Commercial">Commercial (English, Mathematics, Economics, Commerce)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Target Exam
                </label>
                <select
                  value={bulkExamType}
                  onChange={(e) => setBulkExamType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="JAMB UTME">JAMB UTME (4 Subjects)</option>
                  <option value="WASSCE">WASSCE</option>
                </select>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleGenerateBulk}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2"
                >
                  <Sparkles size={16} />
                  <span>Generate Batch of {bulkCount} {bulkCategory} Candidates</span>
                </button>
              </div>
            </div>
          </div>

          {/* Box 2: CSV Import */}
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="pb-3 border-b border-slate-700">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-emerald-400" />
                <span>Upload / Paste Candidate CSV</span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Bulk import candidate lists from Excel or school management systems.
              </p>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    CSV Content:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setCsvText(
`fullName,examType,subjects,username,password
Oluwatobi Bakare,JAMB UTME,english;mathematics;physics;chemistry,JAMB/2026/801,PASS-1029
Maryam Sadiq,JAMB UTME,english;literature;government;economics,JAMB/2026/802,PASS-4910
Emmanuel Okafor,JAMB UTME,english;mathematics;economics;commerce,JAMB/2026/803,PASS-3381`
                      );
                    }}
                    className="text-[11px] text-sky-400 hover:underline"
                  >
                    Paste Sample Template
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="fullName,examType,subjects,username,password&#10;Amina Bello,JAMB UTME,english;mathematics;physics;chemistry,JAMB/2026/001,PASS-8821"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              {csvError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                  {csvError}
                </div>
              )}

              <button
                type="button"
                onClick={handleImportCsv}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
              >
                <FileSpreadsheet size={16} />
                <span>Import Candidates From CSV</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Exam Slip / Docket Modal */}
      <CandidateExamSlipModal
        candidate={selectedCandidateSlip}
        isOpen={!!selectedCandidateSlip}
        onClose={() => setSelectedCandidateSlip(null)}
      />

    </div>
  );
}
