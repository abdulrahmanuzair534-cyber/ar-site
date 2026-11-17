import { Flashcard, MatchPair, SummaryDocument } from '../types/index';
import { calculateDeckMastery, shuffleArray } from './retentionLogic';

export type DeckSortOption = 'newest' | 'mastery-asc' | 'cards-desc' | 'due-desc';

/**
 * Returns true if a card is due for Leitner review as of nowMs.
 */
export function isCardDueForReview(card: Flashcard, nowMs: number = Date.now()): boolean {
  if (!card.nextReviewDate) return true;
  const parsed = Date.parse(card.nextReviewDate);
  if (Number.isNaN(parsed)) return true;
  return parsed <= nowMs;
}

/**
 * Counts how many flashcards in a deck are currently due for review.
 */
export function countDueCards(cards: Flashcard[], nowMs: number = Date.now()): number {
  if (!cards || cards.length === 0) return 0;
  return cards.filter((c) => isCardDueForReview(c, nowMs)).length;
}

/**
 * Builds interactive Term <-> Definition match pairs from a deck's core concepts and flashcards.
 */
export function buildMatchPairs(doc: SummaryDocument, maxPairs: number = 6): MatchPair[] {
  const pairs: MatchPair[] = [];
  const seenTerms = new Set<string>();

  const truncate = (s: string, limit: number) => {
    const clean = (s || '').replace(/\s+/g, ' ').trim();
    return clean.length <= limit ? clean : `${clean.slice(0, limit - 1).trimEnd()}…`;
  };

  for (const concept of doc.coreConcepts || []) {
    if (pairs.length >= maxPairs) break;
    const term = truncate(concept.term, 55);
    const def = truncate(concept.definition, 110);
    if (term && def && !seenTerms.has(term.toLowerCase())) {
      seenTerms.add(term.toLowerCase());
      pairs.push({ id: `pair-c-${pairs.length + 1}`, term, definition: def });
    }
  }

  for (const card of shuffleArray(doc.flashcards || [])) {
    if (pairs.length >= maxPairs) break;
    const term = truncate(card.question, 72);
    const def = truncate(card.answer, 110);
    if (term && def && !seenTerms.has(term.toLowerCase())) {
      seenTerms.add(term.toLowerCase());
      pairs.push({ id: `pair-f-${card.id}`, term, definition: def });
    }
  }

  return pairs;
}

/**
 * Sorts study decks by recency, lowest mastery, card volume, or due-card urgency.
 */
export function sortDecks(
  decks: SummaryDocument[],
  sortBy: DeckSortOption,
  nowMs: number = Date.now()
): SummaryDocument[] {
  const copy = [...decks];
  switch (sortBy) {
    case 'mastery-asc':
      return copy.sort((a, b) => calculateDeckMastery(a.flashcards) - calculateDeckMastery(b.flashcards));
    case 'cards-desc':
      return copy.sort((a, b) => (b.flashcards?.length || 0) - (a.flashcards?.length || 0));
    case 'due-desc':
      return copy.sort((a, b) => countDueCards(b.flashcards, nowMs) - countDueCards(a.flashcards, nowMs));
    case 'newest':
    default:
      return copy.sort((a, b) => {
        const tA = Date.parse(a.createdAt || '') || 0;
        const tB = Date.parse(b.createdAt || '') || 0;
        return tB - tA;
      });
  }
}

/**
 * Validates and normalizes JSON backup data before importing study decks.
 */
export function validateAndNormalizeImportedDecks(rawJson: unknown): SummaryDocument[] {
  const arr = Array.isArray(rawJson) ? rawJson : rawJson && typeof rawJson === 'object' ? [rawJson] : null;
  if (!arr || arr.length === 0) {
    throw new Error('JSON must contain a study deck object or a non-empty array of study decks.');
  }

  const nowIso = new Date().toISOString();
  const validAudiences = ['academic', 'executive', 'technical', 'medical'];

  return arr.map((item: any, idx: number) => {
    if (!item || typeof item !== 'object' || typeof item.title !== 'string' || !item.title.trim()) {
      throw new Error(`Invalid deck at index ${idx}: missing deck title.`);
    }
    if (!Array.isArray(item.flashcards) || item.flashcards.length === 0) {
      throw new Error(`Invalid deck "${item.title}": must contain at least 1 flashcard.`);
    }

    const deckId = `deck-imp-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`;
    const flashcards: Flashcard[] = item.flashcards.map((fc: any, cIdx: number) => ({
      id: `fc-${deckId}-${cIdx + 1}`,
      question: String(fc?.question || `Question ${cIdx + 1}`),
      answer: String(fc?.answer || 'Answer'),
      mnemonic: String(fc?.mnemonic || ''),
      category: String(fc?.category || 'Imported'),
      difficulty: ['easy', 'medium', 'hard'].includes(fc?.difficulty) ? fc.difficulty : 'medium',
      contextQuote: fc?.contextQuote ? String(fc.contextQuote) : undefined,
      imageUrl: fc?.imageUrl ? String(fc.imageUrl) : undefined,
      imageCaption: fc?.imageCaption ? String(fc.imageCaption) : undefined,
      sourceReference: fc?.sourceReference ? String(fc.sourceReference) : undefined,
      box: typeof fc?.box === 'number' && fc.box >= 1 && fc.box <= 5 ? fc.box : 1,
      nextReviewDate: typeof fc?.nextReviewDate === 'string' ? fc.nextReviewDate : nowIso,
      reviewCount: typeof fc?.reviewCount === 'number' ? fc.reviewCount : 0,
      correctCount: typeof fc?.correctCount === 'number' ? fc.correctCount : 0,
    }));

    return {
      id: deckId,
      title: item.title.trim(),
      executiveBrief: String(item.executiveBrief || 'Imported executive study digest.'),
      keyTakeaways: Array.isArray(item.keyTakeaways) ? item.keyTakeaways.map(String) : [],
      coreConcepts: Array.isArray(item.coreConcepts) ? item.coreConcepts : [],
      cheatSheet: Array.isArray(item.cheatSheet) ? item.cheatSheet : [],
      actionItems: Array.isArray(item.actionItems) ? item.actionItems.map(String) : [],
      flashcards,
      targetAudience: validAudiences.includes(item.targetAudience) ? item.targetAudience : 'academic',
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : nowIso,
      sourceWordCount: typeof item.sourceWordCount === 'number' ? item.sourceWordCount : 250,
      readingTimeMinutes: typeof item.readingTimeMinutes === 'number' ? item.readingTimeMinutes : 2,
      tags: Array.isArray(item.tags) ? item.tags.map(String) : ['Imported'],
      sources: Array.isArray(item.sources) ? item.sources : [],
      coverImageUrl: typeof item.coverImageUrl === 'string' ? item.coverImageUrl : undefined,
    };
  });
}
