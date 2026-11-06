import React, { useState, useEffect } from 'react';
import { SummaryDocument } from '../types/index';
import { speech } from '../utils/speech';
import {
  Volume2,
  VolumeX,
  Layers,
  HelpCircle,
  Download,
  Share2,
  CheckSquare,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Brain,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';

interface SummaryViewerProps {
  document: SummaryDocument;
  onStartStudy: () => void;
  onStartQuiz: () => void;
  onOpenExport: () => void;
}

export const SummaryViewer: React.FC<SummaryViewerProps> = ({
  document,
  onStartStudy,
  onStartQuiz,
  onOpenExport,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [completedActions, setCompletedActions] = useState<Record<number, boolean>>({});
  const [expandedCardIdx, setExpandedCardIdx] = useState<number | null>(null);

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
              onClick={onOpenExport}
              className="p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>

            <button
              onClick={onStartQuiz}
              className="px-3.5 py-2 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Take Quiz</span>
            </button>

            <button
              onClick={onStartStudy}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Layers className="w-4 h-4" />
              <span>Study Flashcards</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        </div>
      </div>

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
            Core Concepts & Domain Terminology
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
            Cheat Sheet & Quick Reference Facts
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
            <span>Mastery Checkpoints & Recommended Action Items</span>
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

      {/* Flashcard Quick Preview Accordion */}
      {document.flashcards && document.flashcards.length > 0 && (
        <section className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">
              Flashcard Deck Preview ({document.flashcards.length} cards)
            </h2>
            <button
              onClick={onStartStudy}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>Launch 3D Study Mode</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

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
                    <div className="flex items-center gap-3 shrink-0">
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
                    <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 space-y-2">
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
