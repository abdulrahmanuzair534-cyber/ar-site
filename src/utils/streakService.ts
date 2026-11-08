export interface StudyStreakData {
  currentStreak: number;
  lastStudyDate: string; // YYYY-MM-DD
  bestStreak: number;
  totalSessions: number;
}

const STORAGE_KEY = 'ar_study_streak';
export const STREAK_UPDATED_EVENT = 'ar_study_streak_updated';

/**
 * Helper to get local date string YYYY-MM-DD
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Compute the difference in calendar days between two YYYY-MM-DD date strings.
 */
export function getDayDifference(dateStrA: string, dateStrB: string): number {
  const [yA, mA, dA] = dateStrA.split('-').map(Number);
  const [yB, mB, dB] = dateStrB.split('-').map(Number);
  const dateA = new Date(yA, mA - 1, dA);
  const dateB = new Date(yB, mB - 1, dB);
  const diffTime = dateB.getTime() - dateA.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Retrieve current study streak state from localStorage with safe fallback.
 */
export function getStudyStreak(): StudyStreakData {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {
      currentStreak: 1,
      lastStudyDate: getLocalDateString(),
      bestStreak: 1,
      totalSessions: 1,
    };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Initialize with encouraging initial day-1 streak
      const initial: StudyStreakData = {
        currentStreak: 1,
        lastStudyDate: getLocalDateString(),
        bestStreak: 1,
        totalSessions: 1,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }

    const parsed: StudyStreakData = JSON.parse(raw);
    const today = getLocalDateString();
    const dayDiff = getDayDifference(parsed.lastStudyDate, today);

    // If more than 1 day has elapsed without a study session, the streak resets
    if (dayDiff > 1) {
      return {
        currentStreak: 0,
        lastStudyDate: parsed.lastStudyDate,
        bestStreak: parsed.bestStreak || parsed.currentStreak || 1,
        totalSessions: parsed.totalSessions || 1,
      };
    }

    return parsed;
  } catch (err) {
    console.warn('Failed to parse study streak from localStorage:', err);
    return {
      currentStreak: 1,
      lastStudyDate: getLocalDateString(),
      bestStreak: 1,
      totalSessions: 1,
    };
  }
}

/**
 * Record a new active study session (e.g. reviewed flashcard, generated summary, or completed quiz).
 * Increments streak if consecutive day, preserves streak if already studied today, or resets if lapsed.
 */
export function recordStudySession(): StudyStreakData {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {
      currentStreak: 1,
      lastStudyDate: getLocalDateString(),
      bestStreak: 1,
      totalSessions: 1,
    };
  }

  try {
    const today = getLocalDateString();
    const raw = window.localStorage.getItem(STORAGE_KEY);
    let currentData: StudyStreakData;

    if (!raw) {
      currentData = {
        currentStreak: 1,
        lastStudyDate: today,
        bestStreak: 1,
        totalSessions: 1,
      };
    } else {
      const parsed: StudyStreakData = JSON.parse(raw);
      const dayDiff = getDayDifference(parsed.lastStudyDate, today);

      if (dayDiff === 0) {
        // Already studied today: increment session count, preserve streak
        currentData = {
          ...parsed,
          totalSessions: (parsed.totalSessions || 1) + 1,
        };
      } else if (dayDiff === 1) {
        // Consecutive day: advance streak!
        const nextStreak = (parsed.currentStreak || 0) + 1;
        currentData = {
          currentStreak: nextStreak,
          lastStudyDate: today,
          bestStreak: Math.max(parsed.bestStreak || 0, nextStreak),
          totalSessions: (parsed.totalSessions || 0) + 1,
        };
      } else {
        // Lapsed (dayDiff > 1): restart streak at 1
        currentData = {
          currentStreak: 1,
          lastStudyDate: today,
          bestStreak: Math.max(parsed.bestStreak || 1, 1),
          totalSessions: (parsed.totalSessions || 0) + 1,
        };
      }
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(currentData));
    
    // Dispatch event so Navbar and all views sync in real-time
    window.dispatchEvent(new CustomEvent(STREAK_UPDATED_EVENT, { detail: currentData }));
    return currentData;
  } catch (err) {
    console.warn('Failed to record study session:', err);
    return {
      currentStreak: 1,
      lastStudyDate: getLocalDateString(),
      bestStreak: 1,
      totalSessions: 1,
    };
  }
}
