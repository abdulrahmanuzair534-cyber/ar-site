import React, { useState } from 'react';
import { SummaryDocument, TargetAudience } from '../types/index';
import { calculateDeckMastery } from '../utils/retentionLogic';
import {
  BookOpen,
  Layers,
  HelpCircle,
  Trash2,
  Search,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle,
} from 'lucide-react';

interface DeckListProps {
  decks: SummaryDocument[];
  onSelectDeck: (deck: SummaryDocument, view: 'summary' | 'study' | 'quiz') => void;
  onDeleteDeck: (deckId: string) => void;
  onCreateNew: () => void;
}

export const DeckList: React.FC<DeckListProps> = ({
  decks,
  onSelectDeck,
  onDeleteDeck,
  onCreateNew,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<string>('all');

  const filteredDecks = decks.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.executiveBrief.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.tags && d.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesTrack =
      selectedTrack === 'all' || d.targetAudience === selectedTrack;

    return matchesSearch && matchesTrack;
  });

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display">
            Study Decks & Summaries
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Access your active recall flashcards, Leitner spaced-repetition progress, and executive digests.
          </p>
        </div>

        <button
          onClick={onCreateNew}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5 transition-colors self-start sm:self-auto shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Generate New Set</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search decks, topics, or terms..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
          />
        </div>

        {/* Audience tabs (Interactive segmented buttons allowed by zero-pill rule §1.A) */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl overflow-x-auto text-xs">
          {[
            { id: 'all', label: 'All Tracks' },
            { id: 'academic', label: 'Academic' },
            { id: 'executive', label: 'Executive' },
            { id: 'technical', label: 'Technical' },
            { id: 'medical', label: 'Medical' },
          ].map((tab) => (
            <button
              key={`track-tab-${tab.id}`}
              onClick={() => setSelectedTrack(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap shrink-0 ${
                selectedTrack === tab.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Decks Grid */}
      {filteredDecks.length === 0 ? (
        <div className="text-center py-16 p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
          <Layers className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No study decks found
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No documents match "${searchQuery}". Try a different keyword.`
              : 'Create your first study deck from lecture notes, whitepapers, or articles.'}
          </p>
          <button
            onClick={onCreateNew}
            className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold"
          >
            Create New Study Set
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDecks.map((deck, idx) => {
            const mastery = calculateDeckMastery(deck.flashcards || []);
            const deckKey = deck?.id ? `deck-${deck.id}-${idx}` : `deck-item-${idx}`;
            return (
              <div
                key={deckKey}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs"
              >
                <div>
                  {/* Clean unboxed metadata (strictly adhering to Zero-Pill rule §1.A) */}
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">
                    <span className="capitalize">{deck.targetAudience}</span>
                    <span aria-hidden="true">·</span>
                    <span>{deck.flashcards.length} cards</span>
                    <span aria-hidden="true">·</span>
                    <span>~{deck.readingTimeMinutes} min</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug font-display mb-2 line-clamp-2">
                    {deck.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed mb-4">
                    {deck.executiveBrief}
                  </p>
                </div>

                <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  {/* Mastery Progress */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-500 font-medium">Retention Mastery</span>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{mastery}%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 transition-all duration-300"
                        style={{ width: `${mastery}%` }}
                      />
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      onClick={() => onSelectDeck(deck, 'summary')}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
                    >
                      Summary
                    </button>

                    <button
                      onClick={() => onSelectDeck(deck, 'quiz')}
                      className="px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Quiz</span>
                    </button>

                    <button
                      onClick={() => onSelectDeck(deck, 'study')}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Study</span>
                    </button>

                    <button
                      onClick={() => onDeleteDeck(deck.id)}
                      title="Delete deck"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
