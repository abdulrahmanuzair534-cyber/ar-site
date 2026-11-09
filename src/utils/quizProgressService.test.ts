import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDeckMasteryStats, QuizAttempt } from './quizProgressService';

test('calculateDeckMasteryStats returns unassessed for empty attempts', () => {
  const stats = calculateDeckMasteryStats('deck-empty', []);
  assert.equal(stats.masteryLevel, 'Unassessed');
  assert.equal(stats.masteryPercentage, 0);
  assert.equal(stats.totalQuizzesTaken, 0);
  assert.equal(stats.latestScore, null);
  assert.equal(stats.bestScore, null);
});

test('calculateDeckMasteryStats computes accurate mastery levels', () => {
  const mockAttempts: QuizAttempt[] = [
    {
      id: 'a1',
      deckId: 'deck-1',
      timestamp: '2026-11-06T10:00:00Z',
      score: 5,
      totalQuestions: 10,
      percentage: 50,
    },
    {
      id: 'a2',
      deckId: 'deck-1',
      timestamp: '2026-11-07T10:00:00Z',
      score: 7,
      totalQuestions: 10,
      percentage: 70,
    },
    {
      id: 'a3',
      deckId: 'deck-1',
      timestamp: '2026-11-08T10:00:00Z',
      score: 9,
      totalQuestions: 10,
      percentage: 90,
    },
  ];

  const stats = calculateDeckMasteryStats('deck-1', mockAttempts);
  assert.equal(stats.totalQuizzesTaken, 3);
  assert.equal(stats.latestScore, 90);
  assert.equal(stats.bestScore, 90);
  assert.equal(stats.averageScore, 70); // (50 + 70 + 90)/3 = 70
  // 60% of latest (90*0.6=54) + 40% of best (90*0.4=36) = 90
  assert.equal(stats.masteryPercentage, 90);
  assert.equal(stats.masteryLevel, 'Mastered');
});

test('calculateDeckMasteryStats classifies intermediate mastery correctly', () => {
  const mockAttempts: QuizAttempt[] = [
    {
      id: 'a1',
      deckId: 'deck-2',
      timestamp: '2026-11-08T10:00:00Z',
      score: 6,
      totalQuestions: 10,
      percentage: 60,
    },
    {
      id: 'a2',
      deckId: 'deck-2',
      timestamp: '2026-11-08T12:00:00Z',
      score: 7,
      totalQuestions: 10,
      percentage: 70,
    },
  ];

  const stats = calculateDeckMasteryStats('deck-2', mockAttempts);
  // 70 * 0.6 + 70 * 0.4 = 70
  assert.equal(stats.masteryPercentage, 70);
  assert.equal(stats.masteryLevel, 'Competent');
});
