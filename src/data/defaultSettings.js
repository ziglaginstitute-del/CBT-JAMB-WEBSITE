// Default application settings and Master Administrator configuration

export const DEFAULT_ADMIN_PASSWORD = 'admin2026';
export const ADMIN_SESSION_STORAGE_KEY = 'prepcbt_admin_auth';
export const ADMIN_PASSWORD_STORAGE_KEY = 'prepcbt_master_admin_password';

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
