import React, { useState, useEffect } from 'react';
import { SummaryDocument, SourceReference, NotebookNote, Flashcard } from '../types/index';
import { speech } from '../utils/speech';
import { DeckMasteryChart } from './DeckMasteryChart';
import {
  Volume2,
  VolumeX,
  Layers,
  HelpCircle,
  Download,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Brain,
  Lightbulb,
  ArrowRight,
  BookOpen,
  ExternalLink,
  Image as ImageIcon,
  Plus,
  X,
  Gamepad2,
  StickyNote,
  Trash2,
} from 'lucide-react';

interface SummaryViewerProps {
  document: SummaryDocument;
  onStartStudy: () => void;
  onStartQuiz: () => void;
  onStartMatch?: () => void;
  onOpenExport: () => void;
  onUpdateDocument?: (updatedDoc: SummaryDocument) => void;
}

const NOTES_STORAGE_KEY = 'arsite_deck_notes_v1';

export const SummaryViewer: React.FC<SummaryViewerProps> = ({
  document,
  onStartStudy,
  onStartQuiz,
  onStartMatch,
  onOpenExport,
  onUpdateDocument,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [completedActions, setCompletedActions] = useState<Record<number, boolean>>({});
  const [expandedCardIdx, setExpandedCardIdx] = useState<number | null>(null);

  // Adding source modal state
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [newSourceTitle, setNewSourceTitle] = useState('');
  const [newSourceAuthor, setNewSourceAuthor] = useState('');
  const [newSourceCitation, setNewSourceCitation] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');

  // Inline + Add Flashcard state
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardQuestion, setNewCardQuestion] = useState('');
  const [newCardAnswer, setNewCardAnswer] = useState('');
  const [newCardMnemonic, setNewCardMnemonic] = useState('');

  // Personal Study Scratchpad state persisted per deck
  const [notes, setNotes] = useState<NotebookNote[]>(() => {
    try {
      const raw = localStorage.getItem(NOTES_STORAGE_KEY);
      const map = raw ? JSON.parse(raw) : {};
      return Array.isArray(map?.[document.id]) ? map[document.id] : [];
    } catch {
      return [];
    }
  });
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(NOTES_STORAGE_KEY);
      const map = raw ? JSON.parse(raw) : {};
      setNotes(Array.isArray(map?.[document.id]) ? map[document.id] : []);
    } catch {
      setNotes([]);
    }
  }, [document.id]);

  const persistNotes = (updatedNotes: NotebookNote[]) => {
    setNotes(updatedNotes);
    try {
      const raw = localStorage.getItem(NOTES_STORAGE_KEY);
      const map = raw ? JSON.parse(raw) : {};
      map[document.id] = updatedNotes;
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(map));
    } catch {
      // ignore quota failures
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    const item: NotebookNote = {
      id: `note-${Date.now()}`,
      title: noteTitle.trim() || 'Study Note',
      content: noteContent.trim(),
      createdAt: new Date().toISOString(),
    };
    persistNotes([item, ...notes]);
    setNoteTitle('');
    setNoteContent('');
  };

  const handleAddFlashcard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardQuestion.trim() || !newCardAnswer.trim()) return;
    const newCard: Flashcard = {
      id: `fc-custom-${Date.now()}`,
      question: newCardQuestion.trim(),
      answer: newCardAnswer.trim(),
      mnemonic: newCardMnemonic.trim(),
      category: 'Custom Note',
      difficulty: 'medium',
      box: 1,
      nextReviewDate: new Date().toISOString(),
      reviewCount: 0,
      correctCount: 0,
    };
    onUpdateDocument?.({
      ...document,
      flashcards: [...document.flashcards, newCard],
    });
    setNewCardQuestion('');
    setNewCardAnswer('');
    setNewCardMnemonic('');
    setIsAddingCard(false);
  };

  useEffect(() => {
    speech.setListener((speaking) => setIsSpeaking(speaking));
    return () => {
      speech.stop();
    };
  }, []);

  const toggleSpeech = () => {
    if (isSpeaking) {
      speech.stop();
    } else {
      const fullText = `${document.title}. Executive brief: ${document.executiveBrief}. Key takeaways: ${document.keyTakeaways.join('. ')}`;
      speech.speak(fullText);
    }
  };

  const toggleAction = (idx: number) => {
    setCompletedActions((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleAddSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceTitle.trim()) return;

    const newSource: SourceReference = {
      id: `src-${Date.now()}`,
      title: newSourceTitle.trim(),
      author: newSourceAuthor.trim() || undefined,
      citation: newSourceCitation.trim() || undefined,
      url: newSourceUrl.trim() || undefined,
      type: 'book',
    };

    const updatedDoc: SummaryDocument = {
      ...document,
      sources: [...(document.sources || []), newSource],
    };

    onUpdateDocument?.(updatedDoc);
    setNewSourceTitle('');
    setNewSourceAuthor('');
    setNewSourceCitation('');
    setNewSourceUrl('');
    setIsAddingSource(false);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Header & Meta */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display">
              {document.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
              <span className="capitalize">{document.targetAudience} Track</span>
              <span aria-hidden="true">·</span>
              <span>~{document.readingTimeMinutes} min read</span>
              <span aria-hidden="true">·</span>
              <span>{document.sourceWordCount} words distilled</span>
              <span aria-hidden="true">·</span>
              <span>{document.flashcards.length} active recall cards</span>
              {document.sources && document.sources.length > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                    {document.sources.length} {document.sources.length === 1 ? 'Source' : 'Sources'} Cited
                  </span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span>{new Date(document.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={toggleSpeech}
              className={`p-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                isSpeaking
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                  : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
              title={isSpeaking ? 'Stop listening' : 'Listen to summary'}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4 text-indigo-600 animate-pulse" /> : <Volume2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{isSpeaking ? 'Stop Audio' : 'Listen'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenExport}
              className="p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>

            {onStartMatch && (
              <button
                type="button"
                onClick={onStartMatch}
                className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-400 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Gamepad2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Match Game</span>
              </button>
            )}

            <button
              type="button"
              onClick={onStartQuiz}
              className="px-3.5 py-2 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Take Quiz</span>
            </button>

            <button
              type="button"
              onClick={onStartStudy}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>Study Flashcards</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Sources & References Section */}
      <section className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-display">
              Verified Sources &amp; Citations
            </h2>
          </div>
          <button
            onClick={() => setIsAddingSource((prev) => !prev)}
            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Source</span>
          </button>
        </div>

        {document.sources && document.sources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {document.sources.map((src, idx) => (
              <div
                key={src.id || idx}
                className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {src.title}
                  </div>
                  {src.author && (
                    <div className="text-slate-600 dark:text-slate-400">
                      Author: <span className="font-medium text-slate-700 dark:text-slate-300">{src.author}</span>
                    </div>
                  )}
                  {src.citation && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                      Citation: {src.citation}
                    </div>
                  )}
                </div>

                {src.url && (
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors shrink-0"
                    title="Open external source reference"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic">
            No specific source citation attached yet. Click "+ Add Source" to add book title, author, or research paper link.
          </p>
        )}

        {/* Add Source Form Modal / Expandable */}
        {isAddingSource && (
          <form onSubmit={handleAddSource} className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-3 mt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Add Source Provenance
              </span>
              <button
                type="button"
                onClick={() => setIsAddingSource(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                required
                placeholder="Source Title / Book Name *"
                value={newSourceTitle}
                onChange={(e) => setNewSourceTitle(e.target.value)}
                className="p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <input
                type="text"
                placeholder="Author / Institution"
                value={newSourceAuthor}
                onChange={(e) => setNewSourceAuthor(e.target.value)}
                className="p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <input
                type="text"
                placeholder="Chapter / Section / Pages"
                value={newSourceCitation}
                onChange={(e) => setNewSourceCitation(e.target.value)}
                className="p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <input
                type="url"
                placeholder="Reference URL (https://...)"
                value={newSourceUrl}
                onChange={(e) => setNewSourceUrl(e.target.value)}
                className="p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingSource(false)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs"
              >
                Save Source
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Visual Diagram / Cover Image Display (if present) */}
      {document.coverImageUrl && (
        <section className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-display">
                Visual Concept Architecture &amp; Diagram
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">Attached Visual Reference</span>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 flex items-center justify-center p-2">
            <img
              src={document.coverImageUrl}
              alt={document.title}
              className="max-h-72 w-auto object-contain rounded-lg shadow-sm"
            />
          </div>
        </section>
      )}

      {/* Visual Progress Tracking & Mastery Curve */}
      <DeckMasteryChart
        document={document}
        onTakeQuiz={onStartQuiz}
      />

      {/* Executive Brief (BLUF) */}
      <section className="p-6 rounded-2xl border border-indigo-100 dark:border-indigo-950/60 bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/30">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
            Executive Brief (Bottom Line Up Front)
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200 font-sans">
          {document.executiveBrief}
        </p>
      </section>

      {/* Key Takeaways */}
      {document.keyTakeaways && document.keyTakeaways.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
            <span>Essential Key Takeaways</span>
            <span className="text-xs font-normal text-slate-400">({document.keyTakeaways.length} points)</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {document.keyTakeaways.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div className="w-6 h-6 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Core Concepts & Terminology */}
      {document.coreConcepts && document.coreConcepts.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">
            Core Concepts &amp; Domain Terminology
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {document.coreConcepts.map((concept, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5 font-display">
                    {concept.term}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                    {concept.definition}
                  </p>
                </div>
                {concept.practicalApplication && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-0.5">
                      Application
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {concept.practicalApplication}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Cheat Sheet & Key Facts */}
      {document.cheatSheet && document.cheatSheet.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">
            Cheat Sheet &amp; Quick Reference Facts
          </h2>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {document.cheatSheet.map((item, idx) => (
                <div key={idx} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-900 dark:text-slate-100 sm:w-1/3">
                    {item.item}
                  </span>
                  <span className="text-slate-600 dark:text-slate-300 sm:w-2/3">
                    {item.detail}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Action Items / Retention Checkpoints */}
      {document.actionItems && document.actionItems.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Mastery Checkpoints &amp; Recommended Action Items</span>
          </h2>
          <div className="space-y-2">
            {document.actionItems.map((act, idx) => {
              const isChecked = !!completedActions[idx];
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleAction(idx)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                    isChecked
                      ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    readOnly
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span
                    className={`text-xs leading-relaxed ${
                      isChecked
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-700 dark:text-slate-200 font-medium'
                    }`}
                  >
                    {act}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Personal Study Scratchpad / Cornell Notes */}
      <section className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StickyNote className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white font-display">
              Personal Study Scratchpad ({notes.length})
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">Saved automatically per deck</span>
        </div>

        <form onSubmit={handleAddNote} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <input
            type="text"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            placeholder="Heading / Concept"
            className="sm:col-span-4 p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
          />
          <input
            type="text"
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Write a reflection, mnemonic, or exam reminder..."
            className="sm:col-span-6 p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
          />
          <button
            type="submit"
            disabled={!noteContent.trim()}
            className="sm:col-span-2 px-3 py-2 rounded-lg bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold cursor-pointer"
          >
            Add Note
          </button>
        </form>

        {notes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {notes.map((n) => (
              <div
                key={n.id}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex items-start justify-between gap-2 text-xs"
              >
                <div className="space-y-1">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{n.title}</div>
                  <div className="text-slate-600 dark:text-slate-300 leading-relaxed">{n.content}</div>
                </div>
                <button
                  type="button"
                  aria-label="Delete study note"
                  onClick={() => persistNotes(notes.filter((x) => x.id !== n.id))}
                  className="text-slate-400 hover:text-red-500 p-1 cursor-pointer shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Flashcard Quick Preview Accordion */}
      {document.flashcards && document.flashcards.length > 0 && (
        <section className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">
              Flashcard Deck Preview ({document.flashcards.length} cards)
            </h2>
            <div className="flex items-center gap-3">
              {onUpdateDocument && (
                <button
                  type="button"
                  onClick={() => setIsAddingCard((p) => !p)}
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Card</span>
                </button>
              )}
              <button
                type="button"
                onClick={onStartStudy}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Launch 3D Study Mode</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {isAddingCard && (
            <form
              onSubmit={handleAddFlashcard}
              className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-2.5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  required
                  placeholder="Card Question *"
                  value={newCardQuestion}
                  onChange={(e) => setNewCardQuestion(e.target.value)}
                  className="p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  required
                  placeholder="Card Answer *"
                  value={newCardAnswer}
                  onChange={(e) => setNewCardAnswer(e.target.value)}
                  className="p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  placeholder="Optional Memory Anchor (Mnemonic)"
                  value={newCardMnemonic}
                  onChange={(e) => setNewCardMnemonic(e.target.value)}
                  className="flex-1 p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingCard(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    Save Card
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {document.flashcards.map((card, idx) => {
              const isExpanded = expandedCardIdx === idx;
              return (
                <div
                  key={card.id || idx}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedCardIdx(isExpanded ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-slate-400 w-5">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        {card.question}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {card.imageUrl && (
                        <span className="p-1 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400" title="Includes diagram">
                          <ImageIcon className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 capitalize hidden sm:inline">
                        {card.category}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
                      {card.imageUrl && (
                        <div className="mt-3 max-h-48 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-950 flex items-center justify-center p-2">
                          <img
                            src={card.imageUrl}
                            alt="Card visual diagram"
                            className="max-h-44 object-contain rounded"
                          />
                        </div>
                      )}

                      <div className="mt-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1">
                          Direct Answer
                        </span>
                        <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                          {card.answer}
                        </p>
                      </div>

                      {card.mnemonic && (
                        <div className="p-2.5 rounded-lg bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
                              Memory Anchor
                            </span>
                            <span className="text-xs text-amber-900 dark:text-amber-200">
                              {card.mnemonic}
                            </span>
                          </div>
                        </div>
                      )}

                      {card.sourceReference && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                          Source: {card.sourceReference}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
