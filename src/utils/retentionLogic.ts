import { Flashcard, ReviewRating, QuizQuestion, SummaryDocument } from '../types/index';

/**
 * Calculates updated box level and next review timestamp using an adapted Leitner/SM-2 system.
 */
export function calculateLeitnerUpdate(
  card: Flashcard,
  rating: ReviewRating,
  baseTimeMs: number = Date.now()
): {
  box: number;
  nextReviewDate: string;
  reviewCount: number;
  correctCount: number;
  lastReviewed: string;
} {
  const ONE_HOUR = 60 * 60 * 1000;
  const ONE_DAY = 24 * ONE_HOUR;

  let newBox = card.box;
  let intervalMs: number;
  let isCorrect = false;

  switch (rating) {
    case 'again':
      newBox = 1;
      intervalMs = 4 * ONE_HOUR; // review again today
      break;
    case 'hard':
      newBox = Math.max(1, card.box);
      intervalMs = 1 * ONE_DAY;
      isCorrect = true;
      break;
    case 'good':
      newBox = Math.min(5, card.box + 1);
      // Box intervals: 1 -> 1d, 2 -> 3d, 3 -> 7d, 4 -> 14d, 5 -> 30d
      const intervalsGood = [1 * ONE_DAY, 3 * ONE_DAY, 7 * ONE_DAY, 14 * ONE_DAY, 30 * ONE_DAY];
      intervalMs = intervalsGood[newBox - 1] || 30 * ONE_DAY;
      isCorrect = true;
      break;
    case 'easy':
      newBox = Math.min(5, card.box + 2);
      const intervalsEasy = [2 * ONE_DAY, 5 * ONE_DAY, 10 * ONE_DAY, 21 * ONE_DAY, 45 * ONE_DAY];
      intervalMs = intervalsEasy[newBox - 1] || 45 * ONE_DAY;
      isCorrect = true;
      break;
  }

  const nextReviewDate = new Date(baseTimeMs + intervalMs).toISOString();

  return {
    box: newBox,
    nextReviewDate,
    reviewCount: (card.reviewCount || 0) + 1,
    correctCount: (card.correctCount || 0) + (isCorrect ? 1 : 0),
    lastReviewed: new Date(baseTimeMs).toISOString(),
  };
}

/**
 * Calculates overall mastery percentage of a flashcard deck (0-100%).
 */
export function calculateDeckMastery(flashcards: Flashcard[]): number {
  if (!flashcards || flashcards.length === 0) return 0;

  // Box weights: Box 1 = 10%, Box 2 = 35%, Box 3 = 65%, Box 4 = 85%, Box 5 = 100%
  const boxWeights: Record<number, number> = {
    1: 10,
    2: 35,
    3: 65,
    4: 85,
    5: 100,
  };

  const totalPoints = flashcards.reduce((sum, card) => {
    const weight = boxWeights[card.box] || 10;
    return sum + weight;
  }, 0);

  const maxPoints = flashcards.length * 100;
  return Math.round((totalPoints / maxPoints) * 100);
}

/**
 * Deterministically or randomly shuffles an array.
 */
export function shuffleArray<T>(array: T[], seed?: number): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = seed !== undefined 
      ? Math.floor(((Math.sin(seed + i) + 1) / 2) * (i + 1))
      : Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generates an active recall multiple-choice quiz from flashcards.
 */
export function generateQuizFromFlashcards(
  flashcards: Flashcard[],
  questionCount?: number
): QuizQuestion[] {
  if (!flashcards || flashcards.length < 2) return [];

  const count = Math.min(questionCount || flashcards.length, flashcards.length);
  const selectedCards = shuffleArray(flashcards).slice(0, count);

  return selectedCards.map((card, idx) => {
    // Generate 3 plausible distractors from other flashcards
    const otherAnswers = flashcards
      .filter((c) => c.id !== card.id)
      .map((c) => c.answer);
    
    const shuffledOthers = shuffleArray(otherAnswers).slice(0, 3);
    const options = shuffleArray([card.answer, ...shuffledOthers]);

    return {
      id: `quiz-q-${idx + 1}-${card.id}`,
      flashcardId: card.id,
      type: 'multiple-choice',
      question: card.question,
      options,
      correctAnswer: card.answer,
      explanation: card.mnemonic 
        ? `Memory anchor: ${card.mnemonic}` 
        : `Key concept: ${card.answer}`,
    };
  });
}

/**
 * Generates Anki-compatible TSV export string.
 */
export function exportToAnkiTSV(flashcards: Flashcard[]): string {
  // Anki TSV format: Front \t Back \t Tags
  return flashcards
    .map((card) => {
      const cleanFront = card.question.replace(/\t/g, ' ').replace(/\n/g, '<br>');
      const cleanBack = (card.answer + (card.mnemonic ? `<br><small><i>Memory Anchor: ${card.mnemonic}</i></small>` : ''))
        .replace(/\t/g, ' ')
        .replace(/\n/g, '<br>');
      const tags = (card.category || 'RetainIQ').replace(/\s+/g, '_');
      return `${cleanFront}\t${cleanBack}\t${tags}`;
    })
    .join('\n');
}

/**
 * Generates standard CSV export.
 */
export function exportToCSV(flashcards: Flashcard[]): string {
  const escapeCSV = (str: string) => `"${str.replace(/"/g, '""')}"`;
  const header = ['Question', 'Answer', 'Memory Anchor', 'Category', 'Difficulty', 'Leitner Box'].join(',');
  const rows = flashcards.map((c) =>
    [
      escapeCSV(c.question),
      escapeCSV(c.answer),
      escapeCSV(c.mnemonic || ''),
      escapeCSV(c.category || ''),
      escapeCSV(c.difficulty || 'medium'),
      c.box || 1,
    ].join(',')
  );
  return [header, ...rows].join('\n');
}

/**
 * Formats a summary document into structured Markdown for export/copying.
 */
export function exportToMarkdown(doc: SummaryDocument): string {
  const parts: string[] = [];

  parts.push(`# ${doc.title}`);
  parts.push(`*Created: ${new Date(doc.createdAt).toLocaleDateString()} · Target: ${doc.targetAudience} · Reading time: ~${doc.readingTimeMinutes} min*\n`);

  parts.push(`## Executive Brief`);
  parts.push(doc.executiveBrief + '\n');

  if (doc.keyTakeaways && doc.keyTakeaways.length > 0) {
    parts.push(`## Key Takeaways`);
    doc.keyTakeaways.forEach((k) => parts.push(`- ${k}`));
    parts.push('');
  }

  if (doc.coreConcepts && doc.coreConcepts.length > 0) {
    parts.push(`## Core Concepts & Terminology`);
    doc.coreConcepts.forEach((c) => {
      parts.push(`### ${c.term}`);
      parts.push(`**Definition:** ${c.definition}`);
      if (c.practicalApplication) {
        parts.push(`**Application:** ${c.practicalApplication}`);
      }
      parts.push('');
    });
  }

  if (doc.cheatSheet && doc.cheatSheet.length > 0) {
    parts.push(`## Cheat Sheet & Key Facts`);
    doc.cheatSheet.forEach((item) => parts.push(`- **${item.item}:** ${item.detail}`));
    parts.push('');
  }

  if (doc.actionItems && doc.actionItems.length > 0) {
    parts.push(`## Recommended Checkpoints & Actions`);
    doc.actionItems.forEach((act) => parts.push(`- [ ] ${act}`));
    parts.push('');
  }

  if (doc.flashcards && doc.flashcards.length > 0) {
    parts.push(`## Flashcards (${doc.flashcards.length} cards)`);
    doc.flashcards.forEach((f, idx) => {
      parts.push(`**${idx + 1}. Q: ${f.question}**`);
      parts.push(`*A:* ${f.answer}`);
      if (f.mnemonic) {
        parts.push(`*Memory Anchor:* ${f.mnemonic}`);
      }
      parts.push('');
    });
  }

  return parts.join('\n');
}
