import { Topic, AppSettings, Quiz, QuizProgress } from '../types';

export interface UserData {
  user: string;
  topics: Topic[];
  settings: AppSettings;
  activeQuiz: Quiz | null;
  quizProgress: QuizProgress | null;
  lastUpdated: string;
}

export interface UserProfileSummary {
  email: string;
  lastUpdated: string;
  topicCount: number;
  quizCount: number;
}

const STORAGE_PREFIX = 'qm_vault_';
const LAST_USER_KEY = 'qm_last_active_user';
const PROFILES_INDEX_KEY = 'qm_known_profiles';

const normalizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

export const getStoredProfiles = (): UserProfileSummary[] => {
  try {
    const raw = localStorage.getItem(PROFILES_INDEX_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read profiles index', e);
    return [];
  }
};

const updateProfilesIndex = (email: string, data: Partial<UserData>) => {
  try {
    const normalized = normalizeEmail(email);
    const existing = getStoredProfiles();
    const topicCount = data.topics?.length ?? 0;
    const quizCount = data.topics?.reduce((sum, t) => sum + (t.quizzes?.length || 0), 0) ?? 0;

    const filtered = existing.filter(p => p.email !== normalized);
    const updated: UserProfileSummary[] = [
      {
        email: normalized,
        lastUpdated: new Date().toISOString(),
        topicCount,
        quizCount
      },
      ...filtered
    ];
    localStorage.setItem(PROFILES_INDEX_KEY, JSON.stringify(updated.slice(0, 10)));
  } catch (e) {
    console.error('Failed to update profiles index', e);
  }
};

export const getLastActiveUser = (): string | null => {
  try {
    return localStorage.getItem(LAST_USER_KEY);
  } catch {
    return null;
  }
};

export const setLastActiveUser = (email: string | null) => {
  try {
    if (email) {
      localStorage.setItem(LAST_USER_KEY, normalizeEmail(email));
    } else {
      localStorage.removeItem(LAST_USER_KEY);
    }
  } catch (e) {
    console.error('Failed to set last active user', e);
  }
};

export const loadUserData = (email: string): UserData | null => {
  try {
    const normalized = normalizeEmail(email);
    const key = STORAGE_PREFIX + normalized;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load user data from storage', e);
    return null;
  }
};

export const saveUserData = (email: string, data: Partial<UserData>): void => {
  try {
    const normalized = normalizeEmail(email);
    const key = STORAGE_PREFIX + normalized;
    const existing = loadUserData(normalized) || {};
    
    const payload: UserData = {
      user: normalized,
      topics: data.topics !== undefined ? data.topics : (existing.topics || []),
      settings: data.settings !== undefined ? data.settings : (existing.settings || {
        theme: 'light',
        textSize: 'medium',
        dailyReminder: false,
        reminderTime: '09:00'
      }),
      activeQuiz: data.activeQuiz !== undefined ? data.activeQuiz : (existing.activeQuiz || null),
      quizProgress: data.quizProgress !== undefined ? data.quizProgress : (existing.quizProgress || null),
      lastUpdated: new Date().toISOString()
    };

    localStorage.setItem(key, JSON.stringify(payload));
    setLastActiveUser(normalized);
    updateProfilesIndex(normalized, payload);
  } catch (e) {
    console.error('Failed to save user data to storage', e);
  }
};

export const deleteUserData = (email: string): void => {
  try {
    const normalized = normalizeEmail(email);
    localStorage.removeItem(STORAGE_PREFIX + normalized);
    const existing = getStoredProfiles().filter(p => p.email !== normalized);
    localStorage.setItem(PROFILES_INDEX_KEY, JSON.stringify(existing));
    if (getLastActiveUser() === normalized) {
      setLastActiveUser(null);
    }
  } catch (e) {
    console.error('Failed to delete user profile', e);
  }
};

export const exportUserDataBackup = (email: string, data: any): void => {
  try {
    const normalized = normalizeEmail(email);
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quizmaster_backup_${normalized.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('Export failed', e);
  }
};
