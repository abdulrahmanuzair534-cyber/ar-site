import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMatchPairs,
  countDueCards,
  sortDecks,
  validateAndNormalizeImportedDecks,
} from './studyEnhancements.ts';
import type { SummaryDocument } from '../types/index.ts';

const NOW = Date.parse('2026-11-15T12:00:00.000Z');

const sampleDeckA: SummaryDocument = {
  id: 'a',
  title: 'Alpha Deck',
  executiveBrief: 'Brief A',
  keyTakeaways: ['Takeaway 1'],
  coreConcepts: [{ term: 'CAP Theorem', definition: 'Consistency, Availability, Partition Tolerance', practicalApplication: 'DB design' }],
  cheatSheet: [],
  actionItems: [],
  flashcards: [
    {
      id: 'fc-1',
      question: 'What is Raft?',
      answer: 'A consensus algorithm using leader election.',
      mnemonic: 'Raft floats together',
      category: 'Consensus',
      difficulty: 'medium',
      box: 5,
      nextReviewDate: '2026-11-20T12:00:00.000Z',
      reviewCount: 3,
      correctCount: 3,
    },
  ],
  targetAudience: 'technical',
  createdAt: '2026-11-10T10:00:00.000Z',
  sourceWordCount: 300,
  readingTimeMinutes: 2,
  tags: ['tech'],
};

const sampleDeckB: SummaryDocument = {
  ...sampleDeckA,
  id: 'b',
  title: 'Beta Deck',
  createdAt: '2026-11-14T10:00:00.000Z',
  flashcards: [
    { ...sampleDeckA.flashcards[0], id: 'fc-2', box: 1, nextReviewDate: '2026-11-14T10:00:00.000Z' },
    { ...sampleDeckA.flashcards[0], id: 'fc-3', box: 1, question: 'What is Paxos?', nextReviewDate: '2026-11-13T10:00:00.000Z' },
  ],
};

describe('studyEnhancements helpers', () => {
  it('builds unique match pairs from concepts and flashcards', () => {
    const pairs = buildMatchPairs(sampleDeckA, 6);
    assert.equal(pairs.length, 2);
    assert.equal(pairs[0].term, 'CAP Theorem');
    assert.equal(pairs[1].term, 'What is Raft?');
  });

  it('counts due cards and sorts decks accurately', () => {
    assert.equal(countDueCards(sampleDeckA.flashcards, NOW), 0);
    assert.equal(countDueCards(sampleDeckB.flashcards, NOW), 2);

    const byMastery = sortDecks([sampleDeckA, sampleDeckB], 'mastery-asc', NOW);
    assert.equal(byMastery[0].id, 'b');

    const byDue = sortDecks([sampleDeckA, sampleDeckB], 'due-desc', NOW);
    assert.equal(byDue[0].id, 'b');
  });

  it('validates imported JSON decks and regenerates unique IDs', () => {
    const imported = validateAndNormalizeImportedDecks([
      {
        title: 'Custom Notes',
        flashcards: [{ question: 'Q1', answer: 'A1' }],
      },
    ]);
    assert.equal(imported.length, 1);
    assert.equal(imported[0].title, 'Custom Notes');
    assert.ok(imported[0].id.startsWith('deck-imp-'));
    assert.throws(() => validateAndNormalizeImportedDecks([{ title: 'Empty' }]));
  });
});
