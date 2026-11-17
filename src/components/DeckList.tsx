import React, { useState, useRef } from 'react';
import { SummaryDocument } from '../types/index';
import { calculateDeckMastery } from '../utils/retentionLogic';
import {
  countDueCards,
  DeckSortOption,
  sortDecks,
  validateAndNormalizeImportedDecks,
} from '../utils/studyEnhancements';
import {
  Layers,
  HelpCircle,
  Trash2,
  Search,
  Sparkles,
  Download,
  Upload,
  Gamepad2,
} from 'lucide-react';

interface DeckListProps {
  decks: SummaryDocument[];
  onSelectDeck: (deck: SummaryDocument, view: 'summary' | 'study' | 'quiz' | 'match') => void;
  onDeleteDeck: (deckId: string) => void;
  onImportDecks?: (imported: SummaryDocument[]) => void;
  onCreateNew: () => void;
}

export const DeckList: React.FC<DeckListProps> = ({
  decks,
  onSelectDeck,
  onDeleteDeck,
  onImportDecks,
  onCreateNew,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<string>('all');
  const [sortBy, setSortBy] = useState<DeckSortOption>('newest');
  const [importNotice, setImportNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const filteredDecks = sortDecks(
    decks.filter((d) => {
      const matchesSearch =
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.executiveBrief.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.tags && d.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

      const matchesTrack =
        selectedTrack === 'all' || d.targetAudience === selectedTrack;

      return matchesSearch && matchesTrack;
    }),
    sortBy
  );

  const totalDue = decks.reduce((sum, d) => sum + countDueCards(d.flashcards || []), 0);

  const handleExportAllJson = () => {
    const blob = new Blob([JSON.stringify(decks, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ar_site_decks_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || ''));
        const validated = validateAndNormalizeImportedDecks(parsed);
        onImportDecks?.(validated);
        setImportNotice({
          type: 'ok',
          text: `Imported ${validated.length} study deck${validated.length === 1 ? '' : 's'} successfully.`,
        });
      } catch (err: any) {
        setImportNotice({
          type: 'err',
          text: err?.message || 'Could not import JSON file. Verify it matches AR Site deck schema.',
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display">
            Study Decks &amp; Summaries
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
            {decks.length} deck{decks.length === 1 ? '' : 's'} · {totalDue} card{totalDue === 1 ? '' : 's'} due for spaced review
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {onImportDecks && (
            <>
              <button
                type="button"
                onClick={() => importInputRef.current?.click()}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-indigo-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import JSON</span>
              </button>
              <input
                ref={importInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImportJsonFile}
                className="hidden"
              />
            </>
          )}

          <button
            type="button"
            onClick={handleExportAllJson}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-indigo-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Backup JSON</span>
          </button>

          <button
            type="button"
            onClick={onCreateNew}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5 transition-colors shrink-0 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate New Set</span>
          </button>
        </div>
      </div>

      {importNotice && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
            importNotice.type === 'ok'
              ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300'
              : 'border-red-200 dark:border-red-900 bg-red-50/70 dark:bg-red-950/30 text-red-700 dark:text-red-300'
          }`}
        >
          <span>{importNotice.text}</span>
          <button
            type="button"
            onClick={() => setImportNotice(null)}
            className="font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter, Sort and Search Bar */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2.5 flex-1">
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

          <select
            aria-label="Sort study decks"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as DeckSortOption)}
            className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="due-desc">Sort: Most Due Cards</option>
            <option value="mastery-asc">Sort: Needs Practice First</option>
            <option value="cards-desc">Sort: Largest Decks</option>
          </select>
        </div>

        {/* Audience tabs */}
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
              type="button"
              onClick={() => setSelectedTrack(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer ${
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
            type="button"
            onClick={onCreateNew}
            className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold cursor-pointer"
          >
            Create New Study Set
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDecks.map((deck, idx) => {
            const mastery = calculateDeckMastery(deck.flashcards || []);
            const dueCount = countDueCards(deck.flashcards || []);
            const deckKey = deck?.id ? `deck-${deck.id}-${idx}` : `deck-item-${idx}`;
            return (
              <div
                key={deckKey}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs"
              >
                <div>
                  <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium tabular-nums">
                    <span className="capitalize">{deck.targetAudience}</span>
                    <span aria-hidden="true">·</span>
                    <span>{deck.flashcards.length} cards</span>
                    {dueCount > 0 && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">
                          {dueCount} due
                        </span>
                      </>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug font-display mb-2 line-clamp-2">
                    {deck.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed mb-4">
                    {deck.executiveBrief}
                  </p>
                </div>

                <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-500 font-medium">Retention Mastery</span>
                      <span className="font-mono font-bold tabular-nums text-indigo-600 dark:text-indigo-400">{mastery}%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 transition-all duration-300"
                        style={{ width: `${mastery}%` }}
                      />
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => onSelectDeck(deck, 'summary')}
                        className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition-colors text-center cursor-pointer"
                      >
                        Summary
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectDeck(deck, 'match')}
                        className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Gamepad2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Match</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectDeck(deck, 'quiz')}
                        className="px-2 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Quiz</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectDeck(deck, 'study')}
                        className="flex-1 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Study Flashcards</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteDeck(deck.id)}
                        title="Delete deck"
                        aria-label={`Delete ${deck.title}`}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
