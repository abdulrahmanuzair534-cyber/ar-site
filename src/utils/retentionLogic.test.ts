import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateLeitnerUpdate,
  calculateDeckMastery,
  generateQuizFromFlashcards,
  exportToAnkiTSV,
  exportToCSV,
  exportToMarkdown,
} from './retentionLogic';
import { Flashcard, SummaryDocument } from '../types/index';

const mockCard: Flashcard = {
  id: 'card-1',
  question: 'What is the CAP Theorem?',
  answer: 'Distributed systems can only guarantee two of Consistency, Availability, and Partition Tolerance.',
  mnemonic: 'Pick two of C-A-P, never all three in network partitions.',
  category: 'System Design',
  difficulty: 'medium',
  box: 2,
  nextReviewDate: new Date('2026-11-05T00:00:00Z').toISOString(),
  reviewCount: 2,
  correctCount: 2,
};

test('calculateLeitnerUpdate resets box on "again" rating', () => {
  const baseTime = 1700000000000;
  const updated = calculateLeitnerUpdate(mockCard, 'again', baseTime);
  assert.equal(updated.box, 1);
  assert.equal(updated.reviewCount, 3);
  assert.equal(updated.correctCount, 2);
  // Interval should be 4 hours
  const expectedDate = new Date(baseTime + 4 * 3600 * 1000).toISOString();
  assert.equal(updated.nextReviewDate, expectedDate);
});

test('calculateLeitnerUpdate advances box on "good" and "easy" rating', () => {
  const baseTime = 1700000000000;
  const goodUpdate = calculateLeitnerUpdate(mockCard, 'good', baseTime);
  assert.equal(goodUpdate.box, 3);
  assert.equal(goodUpdate.correctCount, 3);

  const easyUpdate = calculateLeitnerUpdate(mockCard, 'easy', baseTime);
  assert.equal(easyUpdate.box, 4); // card.box (2) + 2 = 4
  assert.equal(easyUpdate.correctCount, 3);
});

test('calculateLeitnerUpdate caps box at 5', () => {
  const highCard: Flashcard = { ...mockCard, box: 5 };
  const baseTime = 1700000000000;
  const easyUpdate = calculateLeitnerUpdate(highCard, 'easy', baseTime);
  assert.equal(easyUpdate.box, 5);
});

test('calculateDeckMastery computes accurate weighted mastery', () => {
  const cards: Flashcard[] = [
    { ...mockCard, id: '1', box: 1 }, // 10 pts
    { ...mockCard, id: '2', box: 3 }, // 65 pts
    { ...mockCard, id: '3', box: 5 }, // 100 pts
  ];
  // Total = 175 / 300 = 58.33% -> 58%
  const mastery = calculateDeckMastery(cards);
  assert.equal(mastery, 58);
});

test('generateQuizFromFlashcards creates questions with distractors', () => {
  const cards: Flashcard[] = [
    { ...mockCard, id: 'c1', question: 'Q1', answer: 'Ans1' },
    { ...mockCard, id: 'c2', question: 'Q2', answer: 'Ans2' },
    { ...mockCard, id: 'c3', question: 'Q3', answer: 'Ans3' },
    { ...mockCard, id: 'c4', question: 'Q4', answer: 'Ans4' },
  ];
  const quiz = generateQuizFromFlashcards(cards, 3);
  assert.equal(quiz.length, 3);
  for (const q of quiz) {
    assert.ok(q.options.includes(q.correctAnswer));
    assert.ok(q.options.length >= 2);
  }
});

test('exportToAnkiTSV formats valid TSV output', () => {
  const tsv = exportToAnkiTSV([mockCard]);
  assert.ok(tsv.includes('\t'));
  const parts = tsv.split('\t');
  assert.equal(parts[0], mockCard.question);
  assert.ok(parts[1].includes(mockCard.answer));
  assert.ok(parts[1].includes('Memory Anchor'));
  assert.equal(parts[2], 'System_Design');
});

test('exportToMarkdown formats structured summary document', () => {
  const doc: SummaryDocument = {
    id: 'doc-1',
    title: 'Distributed Systems 101',
    executiveBrief: 'Core overview of distributed consensus.',
    keyTakeaways: ['Network partitions are inevitable', 'Latency matters'],
    coreConcepts: [
      {
        term: 'Split Brain',
        definition: 'State where sub-clusters think they are the leader.',
        practicalApplication: 'Use quorum consensus like Raft.',
      },
    ],
    cheatSheet: [{ item: 'RPO', detail: 'Recovery Point Objective' }],
    actionItems: ['Review Raft leader election'],
    flashcards: [mockCard],
    targetAudience: 'technical',
    createdAt: new Date().toISOString(),
    sourceWordCount: 500,
    readingTimeMinutes: 2,
    tags: ['DistributedSystems', 'Architecture'],
  };

  const md = exportToMarkdown(doc);
  assert.ok(md.includes('# Distributed Systems 101'));
  assert.ok(md.includes('## Executive Brief'));
  assert.ok(md.includes('Split Brain'));
  assert.ok(md.includes('What is the CAP Theorem?'));
});
