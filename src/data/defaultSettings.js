// Default application settings and Master Administrator configuration

export const DEFAULT_ADMIN_PASSWORD = 'admin2026';
export const ADMIN_SESSION_STORAGE_KEY = 'prepcbt_admin_auth';
export const ADMIN_PASSWORD_STORAGE_KEY = 'prepcbt_master_admin_password';

// ============================================================================
// OFFICIAL JAMB UTME MOCK QUESTION COUNTS CONFIGURATION
// Default standard: 60 questions for Use of English, 40 questions each for
// the remaining 3 subjects (Total = 180 questions).
// To modify question counts globally in code or via storage, edit below.
// ============================================================================
export const MOCK_QUESTION_COUNTS_STORAGE_KEY = 'prepcbt_mock_question_counts';

export const DEFAULT_MOCK_QUESTION_COUNTS = {
  english: 60,
  defaultOther: 40
};

export const getMockQuestionCounts = () => {
  try {
    const saved = localStorage.getItem(MOCK_QUESTION_COUNTS_STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_MOCK_QUESTION_COUNTS, ...JSON.parse(saved) };
    }
  } catch (err) {
    console.warn('Failed to parse saved mock question counts:', err);
  }
  return { ...DEFAULT_MOCK_QUESTION_COUNTS };
};

export const setMockQuestionCounts = (newCounts) => {
  try {
    const merged = { ...DEFAULT_MOCK_QUESTION_COUNTS, ...newCounts };
    localStorage.setItem(MOCK_QUESTION_COUNTS_STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch (err) {
    console.error('Failed to save mock question counts:', err);
    return DEFAULT_MOCK_QUESTION_COUNTS;
  }
};

export const getTargetQuestionCountForSubject = (subjectId) => {
  const counts = getMockQuestionCounts();
  if (subjectId === 'english') {
    return Number(counts.english) || 60;
  }
  if (counts[subjectId] !== undefined) {
    return Number(counts[subjectId]) || 40;
  }
  return Number(counts.defaultOther) || 40;
};

export const getMasterAdminPassword = () => {
  try {
    const saved = localStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY);
    return saved && saved.trim().length > 0 ? saved.trim() : DEFAULT_ADMIN_PASSWORD;
  } catch {
    return DEFAULT_ADMIN_PASSWORD;
  }
};

export const setMasterAdminPassword = (newPassword) => {
  try {
    if (newPassword && newPassword.trim().length > 0) {
      localStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, newPassword.trim());
      return true;
    }
  } catch (e) {
    console.error('Failed to save master admin password', e);
  }
  return false;
};

export const verifyAdminPassword = (candidatePassword) => {
  if (!candidatePassword) return false;
  const master = getMasterAdminPassword();
  return candidatePassword.trim() === master;
};
