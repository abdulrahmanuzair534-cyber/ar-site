export type TargetAudience = 'academic' | 'executive' | 'technical' | 'medical';
export type SummaryDepth = 'overview' | 'standard' | 'deep';

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  mnemonic: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  contextQuote?: string;
  // Leitner spaced repetition box (1 to 5)
  box: number;
  nextReviewDate: string; // ISO string
  reviewCount: number;
  correctCount: number;
  lastReviewed?: string;
}

export interface CoreConcept {
  term: string;
  definition: string;
  practicalApplication: string;
}

export interface CheatSheetItem {
  item: string;
  detail: string;
}

export interface SummaryDocument {
  id: string;
  title: string;
  executiveBrief: string;
  keyTakeaways: string[];
  coreConcepts: CoreConcept[];
  cheatSheet: CheatSheetItem[];
  actionItems: string[];
  flashcards: Flashcard[];
  targetAudience: TargetAudience;
  createdAt: string;
  sourceWordCount: number;
  readingTimeMinutes: number;
  tags: string[];
}

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

export interface QuizQuestion {
  id: string;
  flashcardId: string;
  type: 'multiple-choice' | 'term-definition' | 'fill-blank';
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  userAnswer?: string;
  isCorrect?: boolean;
}

export interface MatchPair {
  id: string;
  term: string;
  definition: string;
}
