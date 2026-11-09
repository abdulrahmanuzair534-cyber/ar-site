export interface QuizAttempt {
  id: string;
  deckId: string;
  timestamp: string; // ISO string
  score: number;
  totalQuestions: number;
  percentage: number;
}

export type MasteryLevel = 'Unassessed' | 'Novice' | 'Competent' | 'Proficient' | 'Mastered';

export interface DeckMasteryStats {
  deckId: string;
  attempts: QuizAttempt[];
  latestScore: number | null;
  bestScore: number | null;
  averageScore: number | null;
  masteryPercentage: number;
  masteryLevel: MasteryLevel;
  totalQuizzesTaken: number;
}

const STORAGE_KEY = 'ar_quiz_history_v1';
export const QUIZ_PROGRESS_UPDATED_EVENT = 'ar_quiz_progress_updated';

// Seed starter past quiz attempts for default sample decks so users immediately see visual progress trends
const SEED_ATTEMPTS: Record<string, QuizAttempt[]> = {
  'sample-distributed-systems': [
    {
      id: 'attempt-sds-1',
      deckId: 'sample-distributed-systems',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      score: 4,
      totalQuestions: 7,
      percentage: 57,
    },
    {
      id: 'attempt-sds-2',
      deckId: 'sample-distributed-systems',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      score: 5,
      totalQuestions: 7,
      percentage: 71,
    },
    {
      id: 'attempt-sds-3',
      deckId: 'sample-distributed-systems',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      score: 6,
      totalQuestions: 7,
      percentage: 86,
    },
  ],
  'sample-corporate-valuation': [
    {
      id: 'attempt-scv-1',
      deckId: 'sample-corporate-valuation',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      score: 3,
      totalQuestions: 6,
      percentage: 50,
    },
    {
      id: 'attempt-scv-2',
      deckId: 'sample-corporate-valuation',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      score: 5,
      totalQuestions: 6,
      percentage: 83,
    },
  ],
  'sample-autonomic-pharmacology': [
    {
      id: 'attempt-sap-1',
      deckId: 'sample-autonomic-pharmacology',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      score: 4,
      totalQuestions: 6,
      percentage: 67,
    },
    {
      id: 'attempt-sap-2',
      deckId: 'sample-autonomic-pharmacology',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      score: 6,
      totalQuestions: 6,
      percentage: 100,
    },
  ],
};

/**
 * Retrieve all quiz attempts map from localStorage
 */
function getAllHistoryFromStorage(): Record<string, QuizAttempt[]> {
  if (typeof window === 'undefined' || !window.localStorage) {
    return SEED_ATTEMPTS;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ATTEMPTS));
      return SEED_ATTEMPTS;
    }
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : SEED_ATTEMPTS;
  } catch (err) {
    console.warn('Failed to parse quiz history from localStorage:', err);
    return SEED_ATTEMPTS;
  }
}

/**
 * Save all quiz attempts map to localStorage
 */
function saveAllHistoryToStorage(data: Record<string, QuizAttempt[]>): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to save quiz history to localStorage:', err);
  }
}

/**
 * Retrieve quiz attempts for a specific deck.
 */
export function getDeckQuizHistory(deckId: string): QuizAttempt[] {
  const all = getAllHistoryFromStorage();
  return all[deckId] || [];
}

/**
 * Record a new quiz attempt for a deck.
 */
export function recordQuizAttempt(deckId: string, score: number, totalQuestions: number): QuizAttempt {
  const all = getAllHistoryFromStorage();
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  const newAttempt: QuizAttempt = {
    id: `qa-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    deckId,
    timestamp: new Date().toISOString(),
    score,
    totalQuestions,
    percentage,
  };

  const deckAttempts = all[deckId] ? [...all[deckId], newAttempt] : [newAttempt];
  // Keep last 20 attempts for this deck to maintain clean telemetry
  all[deckId] = deckAttempts.slice(-20);

  saveAllHistoryToStorage(all);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(QUIZ_PROGRESS_UPDATED_EVENT, {
        detail: { deckId, attempt: newAttempt },
      })
    );
  }

  return newAttempt;
}

/**
 * Calculate comprehensive mastery level and statistics for a deck based on quiz history.
 */
export function calculateDeckMasteryStats(deckId: string, attemptsList?: QuizAttempt[]): DeckMasteryStats {
  const attempts = attemptsList || getDeckQuizHistory(deckId);

  if (!attempts || attempts.length === 0) {
    return {
      deckId,
      attempts: [],
      latestScore: null,
      bestScore: null,
      averageScore: null,
      masteryPercentage: 0,
      masteryLevel: 'Unassessed',
      totalQuizzesTaken: 0,
    };
  }

  const scores = attempts.map((a) => a.percentage);
  const latestScore = scores[scores.length - 1];
  const bestScore = Math.max(...scores);
  const sum = scores.reduce((acc, curr) => acc + curr, 0);
  const averageScore = Math.round(sum / scores.length);

  // Weighted mastery formula:
  // 60% weight on latest score + 40% weight on best score
  const masteryPercentage = Math.round(latestScore * 0.6 + bestScore * 0.4);

  let masteryLevel: MasteryLevel = 'Novice';
  if (masteryPercentage >= 90) {
    masteryLevel = 'Mastered';
  } else if (masteryPercentage >= 75) {
    masteryLevel = 'Proficient';
  } else if (masteryPercentage >= 60) {
    masteryLevel = 'Competent';
  } else {
    masteryLevel = 'Novice';
  }

  return {
    deckId,
    attempts,
    latestScore,
    bestScore,
    averageScore,
    masteryPercentage,
    masteryLevel,
    totalQuizzesTaken: attempts.length,
  };
}

/**
 * Clear quiz history for a specific deck (e.g. for testing or reset)
 */
export function clearDeckQuizHistory(deckId: string): void {
  const all = getAllHistoryFromStorage();
  delete all[deckId];
  saveAllHistoryToStorage(all);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(QUIZ_PROGRESS_UPDATED_EVENT, { detail: { deckId } }));
  }
}
