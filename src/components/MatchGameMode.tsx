import React, { useState, useEffect, useMemo } from 'react';
import { SummaryDocument, MatchPair } from '../types/index';
import { buildMatchPairs } from '../utils/studyEnhancements';
import { shuffleArray } from '../utils/retentionLogic';
import { recordStudySession } from '../utils/streakService';
import {
  ChevronLeft,
  RotateCcw,
  Award,
  Timer,
  Flame,
  CheckCircle2,
  Layers,
} from 'lucide-react';

interface MatchGameModeProps {
  document: SummaryDocument;
  onBackToSummary: () => void;
  onStartStudy: () => void;
}

const MATCH_BEST_STORAGE_KEY = 'arsite_match_best_times_v1';

function getBestTimeForDeck(deckId: string): number | null {
  try {
    const raw = localStorage.getItem(MATCH_BEST_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed?.[deckId] === 'number' ? parsed[deckId] : null;
  } catch {
    return null;
  }
}

function saveBestTimeForDeck(deckId: string, seconds: number): number {
  try {
    const raw = localStorage.getItem(MATCH_BEST_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const prev = typeof parsed[deckId] === 'number' ? parsed[deckId] : null;
    const best = prev === null ? seconds : Math.min(prev, seconds);
    parsed[deckId] = best;
    localStorage.setItem(MATCH_BEST_STORAGE_KEY, JSON.stringify(parsed));
    return best;
  } catch {
    return seconds;
  }
}

export const MatchGameMode: React.FC<MatchGameModeProps> = ({
  document,
  onBackToSummary,
  onStartStudy,
}) => {
  const [roundSeed, setRoundSeed] = useState(1);
  const pairs: MatchPair[] = useMemo(() => buildMatchPairs(document, 6), [document, roundSeed]);

  const shuffledTerms = useMemo(
    () => shuffleArray(pairs.map((p) => ({ id: p.id, text: p.term }))),
    [pairs]
  );
  const shuffledDefs = useMemo(
    () => shuffleArray(pairs.map((p) => ({ id: p.id, text: p.definition }))),
    [pairs]
  );

  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const [selectedDefId, setSelectedDefId] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [mismatchPair, setMismatchPair] = useState<{ termId: string; defId: string } | null>(null);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [elapsedTenths, setElapsedTenths] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [bestTimeSec, setBestTimeSec] = useState<number | null>(() => getBestTimeForDeck(document.id));

  useEffect(() => {
    setSelectedTermId(null);
    setSelectedDefId(null);
    setMatchedIds(new Set());
    setMismatchPair(null);
    setCombo(0);
    setBestCombo(0);
    setAttempts(0);
    setElapsedTenths(0);
    setIsCompleted(false);
    setBestTimeSec(getBestTimeForDeck(document.id));
  }, [document.id, roundSeed]);

  useEffect(() => {
    if (isCompleted || pairs.length === 0) return;
    const interval = setInterval(() => {
      setElapsedTenths((t) => t + 1);
    }, 100);
    return () => clearInterval(interval);
  }, [isCompleted, pairs.length]);

  const evaluateMatch = (termId: string, defId: string) => {
    setAttempts((a) => a + 1);
    if (termId === defId) {
      const nextMatched = new Set(matchedIds);
      nextMatched.add(termId);
      setMatchedIds(nextMatched);
      setSelectedTermId(null);
      setSelectedDefId(null);
      setCombo((c) => {
        const nextC = c + 1;
        setBestCombo((b) => Math.max(b, nextC));
        return nextC;
      });

      if (nextMatched.size === pairs.length) {
        const finalSec = Number((elapsedTenths / 10).toFixed(1));
        const savedBest = saveBestTimeForDeck(document.id, finalSec);
        setBestTimeSec(savedBest);
        recordStudySession();
        setIsCompleted(true);
      }
    } else {
      setCombo(0);
      setMismatchPair({ termId, defId });
      setTimeout(() => {
        setMismatchPair(null);
        setSelectedTermId(null);
        setSelectedDefId(null);
      }, 450);
    }
  };

  const handleSelectTerm = (id: string) => {
    if (matchedIds.has(id) || mismatchPair) return;
    if (selectedDefId) {
      evaluateMatch(id, selectedDefId);
    } else {
      setSelectedTermId((prev) => (prev === id ? null : id));
    }
  };

  const handleSelectDef = (id: string) => {
    if (matchedIds.has(id) || mismatchPair) return;
    if (selectedTermId) {
      evaluateMatch(selectedTermId, id);
    } else {
      setSelectedDefId((prev) => (prev === id ? null : id));
    }
  };

  if (pairs.length < 2) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          At least 2 flashcards or core concepts are needed to start Memory Match.
        </p>
        <button
          type="button"
          onClick={onBackToSummary}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold cursor-pointer"
        >
          Back to Summary
        </button>
      </div>
    );
  }

  const elapsedSeconds = (elapsedTenths / 10).toFixed(1);
  const accuracy = attempts > 0 ? Math.round((pairs.length / attempts) * 100) : 100;

  if (isCompleted) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center shadow-sm space-y-6">
          <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
            <Award className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-display">
              Memory Match Cleared!
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{document.title}</p>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Clear Time</span>
              <span className="text-xl font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
                {elapsedSeconds}s
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Accuracy</span>
              <span className="text-xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                {accuracy}%
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Best Combo</span>
              <span className="text-xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
                {bestCombo}x
              </span>
            </div>
          </div>

          {bestTimeSec !== null && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Personal Deck Record: <span className="font-bold text-slate-900 dark:text-white">{bestTimeSec}s</span>
            </p>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setRoundSeed((s) => s + 1)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Play Again</span>
            </button>
            <button
              type="button"
              onClick={onStartStudy}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>3D Flashcards</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          type="button"
          onClick={onBackToSummary}
          className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Exit to Summary</span>
        </button>

        <div className="flex flex-wrap items-center gap-4 text-xs font-mono tabular-nums">
          <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-semibold">
            <Timer className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>{elapsedSeconds}s</span>
          </span>
          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
            <Flame className="w-3.5 h-3.5" />
            <span>{combo}x Combo</span>
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            {matchedIds.size} / {pairs.length} Matched
          </span>
          <button
            type="button"
            onClick={() => setRoundSeed((s) => s + 1)}
            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 font-sans font-semibold cursor-pointer"
          >
            Shuffle Board
          </button>
        </div>
      </div>

      <div className="text-center space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-display">
          Concept &amp; Definition Memory Match
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Select a concept or prompt on the left, then pair it with its matching answer on the right.
        </p>
      </div>

      {/* Match Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left Column: Terms / Prompts */}
        <div className="space-y-2.5">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
            Concepts &amp; Prompts
          </div>
          {shuffledTerms.map((item) => {
            const isMatched = matchedIds.has(item.id);
            const isSelected = selectedTermId === item.id;
            const isWrong = mismatchPair?.termId === item.id;

            return (
              <button
                key={`term-${item.id}`}
                type="button"
                disabled={isMatched}
                onClick={() => handleSelectTerm(item.id)}
                className={`w-full text-left p-4 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-center justify-between gap-3 cursor-pointer ${
                  isMatched
                    ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 opacity-60 cursor-default'
                    : isWrong
                    ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'
                    : isSelected
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-100 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-indigo-400'
                }`}
              >
                <span>{item.text}</span>
                {isMatched && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Right Column: Definitions / Answers */}
        <div className="space-y-2.5">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
            Definitions &amp; Answers
          </div>
          {shuffledDefs.map((item) => {
            const isMatched = matchedIds.has(item.id);
            const isSelected = selectedDefId === item.id;
            const isWrong = mismatchPair?.defId === item.id;

            return (
              <button
                key={`def-${item.id}`}
                type="button"
                disabled={isMatched}
                onClick={() => handleSelectDef(item.id)}
                className={`w-full text-left p-4 rounded-xl border text-xs leading-relaxed transition-all flex items-center justify-between gap-3 cursor-pointer ${
                  isMatched
                    ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 opacity-60 cursor-default'
                    : isWrong
                    ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'
                    : isSelected
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-100 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
                }`}
              >
                <span>{item.text}</span>
                {isMatched && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
