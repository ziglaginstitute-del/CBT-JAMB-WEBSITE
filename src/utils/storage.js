import { QUESTION_BANK as SEED_QUESTIONS, SUBJECTS } from '../data/questions';
import {
  fetchCandidates,
  createCandidate,
  updateCandidateRecord,
  deleteCandidateRecord,
  fetchQuestions,
  createQuestion,
  updateQuestionRecord,
  deleteQuestionRecord,
  fetchScheduledExams,
  createScheduledExam,
  updateScheduledExamRecord,
  deleteScheduledExamRecord,
  fetchExamHistory,
  createExamHistoryRecord
} from '../services/supabaseService';

const QUESTION_BANK_KEY = 'prepcbt_question_bank';
const SCHEDULED_EXAMS_KEY = 'prepcbt_scheduled_exams';
const CANDIDATES_KEY = 'prepcbt_registered_candidates';
const RESULTS_RELEASED_KEY = 'prepcbt_results_released';
const CUSTOM_SUBJECTS_KEY = 'prepcbt_custom_subjects';
const EMAIL_SETTINGS_KEY = 'prepcbt_email_settings';

export const DEFAULT_EMAIL_SETTINGS = {
  provider: 'resend', // 'resend' | 'emailjs' | 'webhook'
  resendApiKey: '',
  resendFrom: 'PrepCBT <onboarding@resend.dev>',
  emailjsServiceId: '',
  emailjsTemplateId: '',
  emailjsPublicKey: '',
  webhookUrl: '',
  adminCopyEmail: ''
};

export const getEmailSettings = () => {
  try {
    const raw = localStorage.getItem(EMAIL_SETTINGS_KEY);
    return raw ? { ...DEFAULT_EMAIL_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_EMAIL_SETTINGS };
  } catch (e) {
    return { ...DEFAULT_EMAIL_SETTINGS };
  }
};

export const saveEmailSettings = (settings) => {
  try {
    const merged = { ...DEFAULT_EMAIL_SETTINGS, ...settings };
    localStorage.setItem(EMAIL_SETTINGS_KEY, JSON.stringify(merged));
    syncToElectronDisk();
    return merged;
  } catch (e) {
    console.error('Failed to save email settings', e);
    return DEFAULT_EMAIL_SETTINGS;
  }
};

// ============================================================================
// DYNAMIC SUBJECTS ENGINE (PRE-POPULATED + ADMIN CUSTOM SUBJECTS)
// ============================================================================

export const getCustomSubjects = () => {
  try {
    const raw = localStorage.getItem(CUSTOM_SUBJECTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const saveCustomSubjects = (subjects) => {
  try {
    localStorage.setItem(CUSTOM_SUBJECTS_KEY, JSON.stringify(subjects));
    syncToElectronDisk();
  } catch (e) {
    console.error('Failed to save custom subjects', e);
  }
};

export const getAllSubjects = () => {
  const custom = getCustomSubjects();
  const map = new Map();
  // Add base default subjects
  SUBJECTS.forEach(s => map.set(s.id, s));
  // Add custom subjects
  custom.forEach(s => map.set(s.id, s));
  return Array.from(map.values());
};

export const addCustomSubject = (subject) => {
  if (!subject || !subject.name) return null;
  const id = subject.id || subject.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
  const custom = getCustomSubjects();
  const existingIdx = custom.findIndex(s => s.id === id);
  const newSub = {
    id,
    name: subject.name.trim(),
    icon: subject.icon || 'BookOpen',
    isCustom: true,
    createdAt: new Date().toISOString()
  };
  if (existingIdx !== -1) {
    custom[existingIdx] = newSub;
  } else {
    custom.push(newSub);
  }
  saveCustomSubjects(custom);
  return newSub;
};

export const deleteCustomSubject = (id) => {
  const custom = getCustomSubjects();
  const filtered = custom.filter(s => s.id !== id);
  saveCustomSubjects(filtered);
  return filtered;
};

// ============================================================================
// ELECTRON OFFLINE DATABASE PERSISTENCE & HARDWARE BRIDGE
// ============================================================================

export const isElectronApp = () => {
  return typeof window !== 'undefined' && Boolean(window.electronAPI?.isElectron);
};

let electronSyncDebounce = null;
export const syncToElectronDisk = () => {
  if (!isElectronApp()) return;
  if (electronSyncDebounce) clearTimeout(electronSyncDebounce);

  electronSyncDebounce = setTimeout(async () => {
    try {
      const dump = {
        questionBank: getQuestionBank(),
        candidates: getCandidates(),
        scheduledExams: getScheduledExams(),
        resultsReleased: getGlobalResultsReleased(),
        customSubjects: getCustomSubjects(),
        emailSettings: getEmailSettings(),
        lastSaved: new Date().toISOString()
      };
      await window.electronAPI.saveData(dump);
    } catch (err) {
      console.warn('[PrepCBT Storage] Electron disk persistence notice:', err);
    }
  }, 350);
};

export const initElectronStorage = async () => {
  if (!isElectronApp()) return false;
  try {
    const offlineDb = await window.electronAPI.loadData();
    if (offlineDb) {
      if (offlineDb.questionBank && Object.keys(offlineDb.questionBank).length > 0) {
        localStorage.setItem(QUESTION_BANK_KEY, JSON.stringify(offlineDb.questionBank));
      }
      if (Array.isArray(offlineDb.candidates) && offlineDb.candidates.length > 0) {
        localStorage.setItem(CANDIDATES_KEY, JSON.stringify(offlineDb.candidates));
      }
      if (Array.isArray(offlineDb.scheduledExams) && offlineDb.scheduledExams.length > 0) {
        localStorage.setItem(SCHEDULED_EXAMS_KEY, JSON.stringify(offlineDb.scheduledExams));
      }
      if (typeof offlineDb.resultsReleased === 'boolean') {
        localStorage.setItem(RESULTS_RELEASED_KEY, offlineDb.resultsReleased ? 'true' : 'false');
      }
      if (Array.isArray(offlineDb.customSubjects) && offlineDb.customSubjects.length > 0) {
        localStorage.setItem(CUSTOM_SUBJECTS_KEY, JSON.stringify(offlineDb.customSubjects));
      }
      if (offlineDb.emailSettings && typeof offlineDb.emailSettings === 'object') {
        localStorage.setItem(EMAIL_SETTINGS_KEY, JSON.stringify(offlineDb.emailSettings));
      }
      return true;
    } else {
      // First boot on Windows offline machine: write initial seed state to local JSON
      syncToElectronDisk();
      return true;
    }
  } catch (err) {
    console.warn('[PrepCBT Storage] Failed to initialize Electron offline storage:', err);
    return false;
  }
};

/**
 * Export Question Bank to USB Flash Drive or Local Disk (.json)
 */
export const exportQuestionBankUSB = async () => {
  const bank = getQuestionBank();
  const count = Object.values(bank).reduce((acc, list) => acc + (list?.length || 0), 0);

  const packageData = {
    app: 'PrepCBT Examination System',
    format: 'PREPCBT_QUESTION_BANK_PACKAGE',
    version: '2026.1',
    exportedAt: new Date().toISOString(),
    totalQuestions: count,
    questionBank: bank
  };

  if (isElectronApp()) {
    return await window.electronAPI.exportDataToUSB(packageData);
  } else {
    // Browser fallback: download file through browser blob URL
    try {
      const jsonStr = JSON.stringify(packageData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const filename = `PrepCBT_Question_Bank_${new Date().toISOString().slice(0, 10)}.json`;
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { success: true, filePath: filename };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
};

/**
 * Import Questions from USB Flash Drive (.json) and merge into local Question Bank
 */
export const importQuestionBankUSB = async (onFileSelect) => {
  if (isElectronApp()) {
    const res = await window.electronAPI.importDataFromUSB();
    if (!res.success) return res;

    const data = res.data;
    const incomingBank = data.questionBank || (typeof data === 'object' && !data.format ? data : null);
    if (!incomingBank) {
      return { success: false, error: 'Unrecognized question bank file format.' };
    }

    const currentBank = getQuestionBank();
    let mergedCount = 0;

    Object.keys(incomingBank).forEach(subjectKey => {
      if (!currentBank[subjectKey]) currentBank[subjectKey] = [];
      const existingIds = new Set(currentBank[subjectKey].map(q => q.id));

      (incomingBank[subjectKey] || []).forEach(q => {
        if (!existingIds.has(q.id)) {
          currentBank[subjectKey].push(q);
          mergedCount++;
        }
      });
    });

    saveQuestionBank(currentBank);
    return { success: true, count: mergedCount, filePath: res.filePath };
  } else {
    // Web browser fallback via HTML file input picker
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.onchange = (e) => {
        const file = e.target.files?.[0];
        if (!file) {
          resolve({ success: false, canceled: true });
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target.result);
            const incomingBank = data.questionBank || (typeof data === 'object' && !data.format ? data : null);
            if (!incomingBank) {
              resolve({ success: false, error: 'Unrecognized question bank file format.' });
              return;
            }

            const currentBank = getQuestionBank();
            let mergedCount = 0;

            Object.keys(incomingBank).forEach(subjectKey => {
              if (!currentBank[subjectKey]) currentBank[subjectKey] = [];
              const existingIds = new Set(currentBank[subjectKey].map(q => q.id));

              (incomingBank[subjectKey] || []).forEach(q => {
                if (!existingIds.has(q.id)) {
                  currentBank[subjectKey].push(q);
                  mergedCount++;
                }
              });
            });

            saveQuestionBank(currentBank);
            resolve({ success: true, count: mergedCount, filePath: file.name });
          } catch (err) {
            resolve({ success: false, error: 'Failed to parse JSON file: ' + err.message });
          }
        };
        reader.readAsText(file);
      };
      input.click();
    });
  }
};

/**
 * Toggle Fullscreen / Kiosk Examination Lockdown Mode
 */
export const toggleExamKioskMode = async (enabled) => {
  if (isElectronApp()) {
    return await window.electronAPI.toggleKioskMode(enabled);
  } else {
    // Browser Fullscreen API fallback
    try {
      if (enabled) {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } else {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
      }
      return { success: true, isKiosk: Boolean(document.fullscreenElement) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};

// Global Result Release Approval State (controlled by admin)
export const getGlobalResultsReleased = () => {
  try {
    const val = localStorage.getItem(RESULTS_RELEASED_KEY);
    return val === 'true';
  } catch {
    return false;
  }
};

export const setGlobalResultsReleased = (isReleased) => {
  try {
    localStorage.setItem(RESULTS_RELEASED_KEY, isReleased ? 'true' : 'false');
    // Also update all candidates
    const candidates = getCandidates();
    const updated = candidates.map(c => ({
      ...c,
      resultsReleased: isReleased,
      examResult: c.examResult ? { ...c.examResult, resultsReleased: isReleased } : null
    }));
    saveCandidates(updated);
    syncToElectronDisk();
    return true;
  } catch (err) {
    console.error('Failed to set results release status', err);
    return false;
  }
};

export const toggleCandidateResultsReleased = (candidateId) => {
  const candidates = getCandidates();
  const cand = candidates.find(c => c.id === candidateId);
  if (cand) {
    const newStatus = !cand.resultsReleased;
    cand.resultsReleased = newStatus;
    if (cand.examResult) {
      cand.examResult.resultsReleased = newStatus;
    }
    saveCandidates(candidates);
    updateCandidate(candidateId, { resultsReleased: newStatus, examResult: cand.examResult });
    syncToElectronDisk();
    return newStatus;
  }
  return false;
};

// ============================================================================
// SUPABASE REAL-TIME BACKGROUND SYNC
// Pulls live data from Supabase into memory / storage on app initialization
// ============================================================================
export const syncFromSupabase = async () => {
  try {
    // 1. Sync Candidates safely by merging
    const remoteCandidates = await fetchCandidates();
    if (remoteCandidates && remoteCandidates.length > 0) {
      const localCandidates = getCandidates();
      const candidateMap = new Map();
      // Add remote candidates
      remoteCandidates.forEach(c => candidateMap.set(c.id, c));
      // Keep any local candidate that isn't on remote yet (e.g. pending sync)
      localCandidates.forEach(c => {
        if (!candidateMap.has(c.id)) {
          candidateMap.set(c.id, c);
        }
      });
      saveCandidates(Array.from(candidateMap.values()));
    }

    // 2. Sync Questions
    const remoteQuestions = await fetchQuestions();
    if (remoteQuestions && Object.keys(remoteQuestions).length > 0) {
      saveQuestionBank(remoteQuestions);
    }

    // 3. Sync Scheduled Exams safely by merging
    const remoteExams = await fetchScheduledExams();
    if (remoteExams && remoteExams.length > 0) {
      const localExams = getScheduledExams();
      const examMap = new Map();
      remoteExams.forEach(e => examMap.set(e.id, e));
      localExams.forEach(e => {
        if (!examMap.has(e.id)) {
          examMap.set(e.id, e);
        }
      });
      saveScheduledExams(Array.from(examMap.values()));
    }
  } catch (err) {
    console.warn('Background Supabase sync notice:', err);
  }
};

// ============================================================================
// MULTI-ADMIN CONCURRENT SYNCHRONIZATION ENGINE
// Allows multiple examination officers/admins to work simultaneously across
// different computers or browser windows with real-time state synchronization.
// ============================================================================
export const initMultiAdminSync = (onDataUpdate) => {
  if (typeof window === 'undefined') return () => {};

  // 1. Cross-tab local storage event listener (instant local sync)
  const handleStorageChange = (e) => {
    if (
      e.key === CANDIDATES_KEY ||
      e.key === QUESTION_BANK_KEY ||
      e.key === SCHEDULED_EXAMS_KEY ||
      e.key === RESULTS_RELEASED_KEY ||
      e.key === CUSTOM_SUBJECTS_KEY
    ) {
      if (onDataUpdate) {
        onDataUpdate({ source: 'local_storage', key: e.key, timestamp: new Date().toISOString() });
      }
    }
  };
  window.addEventListener('storage', handleStorageChange);

  // 2. Periodic background Supabase sync for concurrent cloud admins (every 8 seconds)
  const syncInterval = setInterval(async () => {
    try {
      await syncFromSupabase();
      if (onDataUpdate) {
        onDataUpdate({ source: 'supabase_poll', timestamp: new Date().toISOString() });
      }
    } catch {
      // Quiet background network retry
    }
  }, 8000);

  return () => {
    window.removeEventListener('storage', handleStorageChange);
    clearInterval(syncInterval);
  };
};

// ============================================================================
// 1. QUESTION BANK STORAGE & SUPABASE SYNC
// ============================================================================

export const getQuestionBank = () => {
  try {
    const stored = localStorage.getItem(QUESTION_BANK_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (err) {
    console.error('Failed to parse question bank from localStorage', err);
  }
  // Fallback / seed initial questions
  try {
    localStorage.setItem(QUESTION_BANK_KEY, JSON.stringify(SEED_QUESTIONS));
  } catch (e) {
    console.warn('Unable to seed questions to localStorage', e);
  }
  return SEED_QUESTIONS;
};

export const saveQuestionBank = (bank) => {
  try {
    localStorage.setItem(QUESTION_BANK_KEY, JSON.stringify(bank));
    syncToElectronDisk();
  } catch (err) {
    console.error('Failed to save question bank to localStorage', err);
  }
};

export const addQuestion = (question) => {
  const bank = getQuestionBank();
  const sub = question.subject || 'english';
  if (!bank[sub]) {
    bank[sub] = [];
  }
  const newQ = {
    ...question,
    id: question.id || `q-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
  };
  bank[sub].unshift(newQ);
  saveQuestionBank(bank);

  // Sync to Supabase in real-time
  createQuestion(newQ).catch(e => console.warn('Supabase question write error', e));

  return newQ;
};

export const updateQuestion = (id, updatedFields) => {
  const bank = getQuestionBank();
  let found = false;
  let targetQ = null;

  for (const sub of Object.keys(bank)) {
    const idx = bank[sub].findIndex(q => q.id === id);
    if (idx !== -1) {
      bank[sub][idx] = { ...bank[sub][idx], ...updatedFields };
      targetQ = bank[sub][idx];
      found = true;
      break;
    }
  }
  if (found) {
    saveQuestionBank(bank);
    // Sync to Supabase in real-time
    if (targetQ) {
      updateQuestionRecord(id, updatedFields).catch(e => console.warn('Supabase question update error', e));
    }
  }
  return found;
};

export const deleteQuestion = (id) => {
  const bank = getQuestionBank();
  for (const sub of Object.keys(bank)) {
    const beforeCount = bank[sub].length;
    bank[sub] = bank[sub].filter(q => q.id !== id);
    if (bank[sub].length !== beforeCount) {
      saveQuestionBank(bank);
      // Sync to Supabase in real-time
      deleteQuestionRecord(id).catch(e => console.warn('Supabase question delete error', e));
      return true;
    }
  }
  return false;
};

export const bulkAddQuestions = (newQuestions) => {
  const bank = getQuestionBank();
  let count = 0;
  newQuestions.forEach(q => {
    const sub = q.subject || 'english';
    if (!bank[sub]) bank[sub] = [];
    const formatted = {
      ...q,
      id: `q-imp-${Date.now()}-${count++}-${Math.random().toString(36).substr(2, 6)}`
    };
    bank[sub].unshift(formatted);
    // Sync to Supabase
    createQuestion(formatted).catch(e => console.warn('Supabase bulk question write error', e));
  });
  saveQuestionBank(bank);
  return newQuestions.length;
};

// ============================================================================
// 2. SCHEDULED EXAMS STORAGE & SUPABASE SYNC
// ============================================================================

const getSeedExams = () => {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const bank = getQuestionBank();

  return [
    {
      id: 'exam-seed-national-mock-1',
      title: 'National JAMB Mega Mock 2026 - Batch A',
      accessCode: '784219',
      examType: 'jamb',
      subjectIds: ['english', 'mathematics', 'physics', 'chemistry'],
      durationMinutes: 60,
      startsAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      endsAt: tomorrow.toISOString(),
      questionsBySubject: {
        english: bank.english || [],
        mathematics: bank.mathematics || [],
        physics: bank.physics || [],
        chemistry: bank.chemistry || []
      },
      submissions: [
        {
          candidateName: 'Olusola Isaac',
          candidateId: '2026/UTME/918231',
          submittedAt: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
          totalScore: 286,
          percentage: 71.5,
          timeSpentSeconds: 2420,
          subjectScores: {
            english: { correct: 5, total: 6, score: 83 },
            mathematics: { correct: 4, total: 5, score: 80 },
            physics: { correct: 3, total: 4, score: 75 },
            chemistry: { correct: 3, total: 4, score: 75 }
          }
        },
        {
          candidateName: 'Amina Bello Danjuma',
          candidateId: '2026/UTME/440912',
          submittedAt: new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
          totalScore: 312,
          percentage: 78.0,
          timeSpentSeconds: 2980,
          subjectScores: {
            english: { correct: 6, total: 6, score: 100 },
            mathematics: { correct: 4, total: 5, score: 80 },
            physics: { correct: 3, total: 4, score: 75 },
            chemistry: { correct: 3, total: 4, score: 75 }
          }
        }
      ],
      createdAt: new Date().toISOString()
    }
  ];
};

export const getScheduledExams = () => {
  try {
    const stored = localStorage.getItem(SCHEDULED_EXAMS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (err) {
    console.error('Failed to parse scheduled exams', err);
  }
  const defaultExams = getSeedExams();
  try {
    localStorage.setItem(SCHEDULED_EXAMS_KEY, JSON.stringify(defaultExams));
  } catch (e) {
    console.warn('Unable to seed scheduled exams to localStorage', e);
  }
  return defaultExams;
};

export const saveScheduledExams = (exams) => {
  try {
    localStorage.setItem(SCHEDULED_EXAMS_KEY, JSON.stringify(exams));
    syncToElectronDisk();
  } catch (err) {
    console.error('Failed to save scheduled exams', err);
  }
};

export const addScheduledExam = (exam) => {
  const exams = getScheduledExams();
  const newExam = {
    ...exam,
    id: exam.id || `exam-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    submissions: exam.submissions || [],
    createdAt: exam.createdAt || new Date().toISOString()
  };
  exams.unshift(newExam);
  saveScheduledExams(exams);

  // Sync to Supabase in real-time
  createScheduledExam(newExam).catch(e => console.warn('Supabase scheduled exam write error', e));

  return newExam;
};

export const deleteScheduledExam = (id) => {
  const exams = getScheduledExams();
  const filtered = exams.filter(e => e.id !== id);
  saveScheduledExams(filtered);

  // Sync to Supabase in real-time
  deleteScheduledExamRecord(id).catch(e => console.warn('Supabase scheduled exam delete error', e));

  return filtered;
};

export const findExamByPin = (pin) => {
  const exams = getScheduledExams();
  const cleanPin = String(pin).replace(/[^0-9]/g, '');
  return exams.find(e => String(e.accessCode).replace(/[^0-9]/g, '') === cleanPin);
};

export const recordExamSubmission = (examId, submission) => {
  const exams = getScheduledExams();
  const exam = exams.find(e => e.id === examId);
  if (exam) {
    if (!exam.submissions) exam.submissions = [];
    const newSubmission = {
      ...submission,
      submittedAt: submission.submittedAt || new Date().toISOString()
    };
    exam.submissions.unshift(newSubmission);
    saveScheduledExams(exams);

    // Sync to Supabase in real-time
    updateScheduledExamRecord(examId, { submissions: exam.submissions }).catch(e =>
      console.warn('Supabase exam submission write error', e)
    );

    return true;
  }
  return false;
};

// ============================================================================
// 3. CANDIDATE MANAGEMENT & AUTHENTICATION
// ============================================================================

export const generateCandidateRegNo = (examType = 'JAMB UTME') => {
  const prefix = examType.includes('WASSCE') ? 'WA/2026' : 'JAMB/2026';
  const serial = Math.floor(100 + Math.random() * 900);
  return `${prefix}/${serial}`;
};

export const generateCandidatePasscode = () => {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `PASS-${num}`;
};

const getSeedCandidates = () => {
  return [
    {
      id: 'cand-seed-1',
      fullName: 'Amina Bello Danjuma',
      examType: 'JAMB UTME',
      username: 'JAMB/2026/014',
      password: 'PASS-7921',
      registeredSubjects: ['english', 'mathematics', 'physics', 'chemistry'],
      category: 'Science',
      center: 'PrepCBT Center 01 (Main Auditorium)',
      seatNumber: 'Seat 14',
      scheduledExamId: 'exam-seed-national-mock-1',
      status: 'Pending',
      examResult: null,
      registeredAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'cand-seed-2',
      fullName: 'Chinedu Obinna Eze',
      examType: 'JAMB UTME',
      username: 'JAMB/2026/028',
      password: 'PASS-3319',
      registeredSubjects: ['english', 'literature', 'government', 'economics'],
      category: 'Arts / Humanities',
      center: 'PrepCBT Center 01 (Hall B)',
      seatNumber: 'Seat 28',
      scheduledExamId: 'exam-seed-national-mock-1',
      status: 'Pending',
      examResult: null,
      registeredAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'cand-seed-3',
      fullName: 'Fatima Bukar Yusuf',
      examType: 'JAMB UTME',
      username: 'JAMB/2026/045',
      password: 'PASS-6582',
      registeredSubjects: ['english', 'mathematics', 'economics', 'commerce'],
      category: 'Commercial',
      center: 'PrepCBT Center 02 (Computer Lab 3)',
      seatNumber: 'Seat 45',
      scheduledExamId: 'exam-seed-national-mock-1',
      status: 'Pending',
      examResult: null,
      registeredAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'cand-seed-4',
      fullName: 'Olumide Babatunde Adeyemi',
      examType: 'JAMB UTME',
      username: 'JAMB/2026/067',
      password: 'PASS-1204',
      registeredSubjects: ['english', 'biology', 'chemistry', 'physics'],
      category: 'Biological & Medical',
      center: 'PrepCBT Center 01 (Main Auditorium)',
      seatNumber: 'Seat 67',
      scheduledExamId: 'exam-seed-national-mock-1',
      status: 'Pending',
      examResult: null,
      registeredAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'cand-seed-5',
      fullName: 'Kelechi Anthony Okoro',
      examType: 'JAMB UTME',
      username: 'JAMB/2026/009',
      password: 'PASS-8840',
      registeredSubjects: ['english', 'mathematics', 'physics', 'chemistry'],
      category: 'Science',
      center: 'PrepCBT Center 01 (Main Auditorium)',
      seatNumber: 'Seat 09',
      scheduledExamId: 'exam-seed-national-mock-1',
      status: 'Completed',
      examResult: {
        totalScore: 312,
        maxScore: 400,
        percentage: 78,
        timeSpentSeconds: 3120,
        submittedAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
        subjectScores: {
          english: { correct: 6, total: 6, score: 100 },
          mathematics: { correct: 4, total: 5, score: 80 },
          physics: { correct: 3, total: 4, score: 75 },
          chemistry: { correct: 3, total: 4, score: 75 }
        }
      },
      registeredAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'cand-seed-6',
      fullName: 'Blessing Ngozi Chukwu',
      examType: 'WASSCE',
      username: 'WA/2026/104',
      password: 'PASS-4491',
      registeredSubjects: ['english', 'mathematics', 'physics', 'chemistry', 'biology'],
      category: 'Science',
      center: 'PrepCBT Center 03 (Annex Hall)',
      seatNumber: 'Seat 104',
      scheduledExamId: null,
      status: 'Pending',
      examResult: null,
      registeredAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
    }
  ];
};

export const getCandidates = () => {
  try {
    const stored = localStorage.getItem(CANDIDATES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Automatically purge any dummy ping test artifacts
      const cleaned = parsed.filter(c => 
        !c.fullName?.toLowerCase().includes('ping') && 
        !c.username?.toLowerCase().includes('ping') && 
        !c.id?.startsWith('test-ping')
      );
      if (cleaned.length !== parsed.length) {
        try {
          localStorage.setItem(CANDIDATES_KEY, JSON.stringify(cleaned));
        } catch {}
      }
      return cleaned;
    }
  } catch (err) {
    console.error('Failed to parse candidates from localStorage', err);
  }
  const defaultCandidates = getSeedCandidates();
  try {
    localStorage.setItem(CANDIDATES_KEY, JSON.stringify(defaultCandidates));
  } catch (e) {
    console.warn('Unable to seed candidates to localStorage', e);
  }
  return defaultCandidates;
};

export const saveCandidates = (candidates) => {
  try {
    localStorage.setItem(CANDIDATES_KEY, JSON.stringify(candidates));
    syncToElectronDisk();
  } catch (err) {
    console.error('Failed to save candidates to localStorage', err);
  }
};

export const addCandidate = (candidateData) => {
  const candidates = getCandidates();
  const examType = candidateData.examType || 'JAMB UTME';
  const newCandidate = {
    ...candidateData,
    id: candidateData.id || `cand-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    username: candidateData.username?.trim() || generateCandidateRegNo(examType),
    password: candidateData.password?.trim() || generateCandidatePasscode(),
    email: candidateData.email?.trim() || '',
    resultsReleased: candidateData.resultsReleased ?? getGlobalResultsReleased(),
    registeredSubjects: candidateData.registeredSubjects && candidateData.registeredSubjects.length > 0
      ? candidateData.registeredSubjects
      : ['english', 'mathematics', 'physics', 'chemistry'],
    status: candidateData.status || 'Pending',
    examResult: candidateData.examResult || null,
    registeredAt: candidateData.registeredAt || new Date().toISOString()
  };
  candidates.unshift(newCandidate);
  saveCandidates(candidates);

  // Sync to Supabase in real-time
  createCandidate(newCandidate).catch(e => console.warn('Supabase candidate create error', e));

  return newCandidate;
};

export const updateCandidate = (id, fields) => {
  const candidates = getCandidates();
  const idx = candidates.findIndex(c => c.id === id);
  if (idx !== -1) {
    candidates[idx] = { ...candidates[idx], ...fields };
    saveCandidates(candidates);

    // Sync to Supabase in real-time
    updateCandidateRecord(id, fields).catch(e => console.warn('Supabase candidate update error', e));

    return candidates[idx];
  }
  return null;
};

export const deleteCandidate = (id) => {
  const candidates = getCandidates();
  const filtered = candidates.filter(c => c.id !== id);
  saveCandidates(filtered);

  // Sync to Supabase in real-time
  deleteCandidateRecord(id).catch(e => console.warn('Supabase candidate delete error', e));

  return filtered;
};

export const resetCandidateExam = (candidateId) => {
  const candidates = getCandidates();
  const candidate = candidates.find(c => c.id === candidateId);
  if (candidate) {
    candidate.status = 'Pending';
    candidate.examResult = null;
    saveCandidates(candidates);

    // Sync to Supabase in real-time
    updateCandidateRecord(candidateId, { status: 'Pending', examResult: null }).catch(e =>
      console.warn('Supabase reset exam error', e)
    );

    return true;
  }
  return false;
};

export const findCandidateByCredentials = (usernameOrReg, password) => {
  if (!usernameOrReg || !password) return null;
  const candidates = getCandidates();
  
  const cleanInput = usernameOrReg.trim().toLowerCase();
  const strippedInput = cleanInput.replace(/[^a-z0-9]/g, '');

  const cleanPass = password.trim().toLowerCase();
  const strippedPass = cleanPass.replace(/[^a-z0-9]/g, '');

  return candidates.find(c => {
    const candUser = (c.username || '').trim().toLowerCase();
    const candUserStripped = candUser.replace(/[^a-z0-9]/g, '');
    const matchUsername = candUser === cleanInput || (strippedInput.length > 0 && candUserStripped === strippedInput);

    const candPass = (c.password || '').trim().toLowerCase();
    const candPassStripped = candPass.replace(/[^a-z0-9]/g, '');
    const matchPassword = candPass === cleanPass || (strippedPass.length > 0 && candPassStripped === strippedPass);

    return matchUsername && matchPassword;
  }) || null;
};

export const bulkAddCandidates = (newCandidates) => {
  const candidates = getCandidates();
  let added = 0;
  newCandidates.forEach(c => {
    const examType = c.examType || 'JAMB UTME';
    const candObj = {
      ...c,
      id: c.id || `cand-${Date.now()}-${added++}-${Math.random().toString(36).substr(2, 5)}`,
      username: c.username?.trim() || generateCandidateRegNo(examType),
      password: c.password?.trim() || generateCandidatePasscode(),
      email: c.email?.trim() || '',
      resultsReleased: c.resultsReleased ?? getGlobalResultsReleased(),
      registeredSubjects: c.registeredSubjects || ['english', 'mathematics', 'physics', 'chemistry'],
      status: c.status || 'Pending',
      examResult: null,
      registeredAt: new Date().toISOString()
    };
    candidates.unshift(candObj);
    // Sync to Supabase
    createCandidate(candObj).catch(e => console.warn('Supabase bulk candidate write error', e));
  });
  saveCandidates(candidates);
  return newCandidates.length;
};

export const recordCandidateSubmission = (candidateId, resultData) => {
  const candidates = getCandidates();
  const candidate = candidates.find(c => c.id === candidateId || c.username === candidateId);
  if (candidate) {
    const isReleased = candidate.resultsReleased ?? getGlobalResultsReleased();
    const finalResultData = {
      ...resultData,
      email: candidate.email || '',
      resultsReleased: isReleased
    };

    candidate.status = 'Completed';
    candidate.examResult = finalResultData;
    candidate.resultsReleased = isReleased;
    saveCandidates(candidates);

    // Sync to Supabase in real-time
    updateCandidateRecord(candidate.id, { 
      status: 'Completed', 
      examResult: finalResultData 
    }).catch(e => console.warn('Supabase candidate submission update error', e));

    return candidate;
  }
  return null;
};
