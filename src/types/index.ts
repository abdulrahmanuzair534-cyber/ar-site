export type TargetAudience = 'academic' | 'executive' | 'technical' | 'medical';
export type SummaryDepth = 'overview' | 'standard' | 'deep';

export interface SourceReference {
  id: string;
  title: string;
  url?: string;
  author?: string;
  citation?: string; // e.g. "Page 142-145, Chapter 4"
  type?: 'book' | 'article' | 'paper' | 'website' | 'lecture' | 'scan';
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  mnemonic: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  contextQuote?: string;
  imageUrl?: string;
  imageCaption?: string;
  sourceReference?: string;
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
  sources?: SourceReference[];
  coverImageUrl?: string;
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

export interface NotebookNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface GroundedChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  citations?: { sourceId?: string; title: string; quote?: string }[];
  timestamp: string;
}
