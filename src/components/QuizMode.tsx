import React, { useState, useEffect } from 'react';
import { Flashcard, QuizQuestion } from '../types/index';
import { generateQuizFromFlashcards } from '../utils/retentionLogic';
import { recordStudySession } from '../utils/streakService';
import { recordQuizAttempt } from '../utils/quizProgressService';
import { CheckCircle2, XCircle, HelpCircle, RotateCcw, ArrowRight, Award, ChevronLeft } from 'lucide-react';

interface QuizModeProps {
  deckId?: string;
  cards: Flashcard[];
  deckTitle: string;
  onBackToSummary: () => void;
  onBackToStudy: () => void;
}

export const QuizMode: React.FC<QuizModeProps> = ({
  deckId,
  cards,
  deckTitle,
  onBackToSummary,
  onBackToStudy,
}) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, { selected: string; correct: boolean }>>({});
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (cards && cards.length >= 2) {
      const generated = generateQuizFromFlashcards(cards);
      setQuestions(generated);
      setCurrentIndex(0);
      setSelectedOption(null);
      setIsAnswered(false);
      setScore(0);
      setUserAnswers({});
      setIsCompleted(false);
    }
  }, [cards]);

  if (!cards || cards.length < 2) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          At least 2 flashcards are needed to generate an active recall quiz.
        </p>
        <button
          onClick={onBackToSummary}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
        >
          Back to Summary
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  const handleSelectOption = (opt: string) => {
    if (isAnswered) return;
    setSelectedOption(opt);
    setIsAnswered(true);

    const isCorrect = opt === currentQ.correctAnswer;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    setUserAnswers((prev) => ({
      ...prev,
      [currentIndex]: { selected: opt, correct: isCorrect },
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      recordStudySession();
      if (deckId) {
        recordQuizAttempt(deckId, score, questions.length);
      }
      setIsCompleted(true);
    }
  };

  const handleRestart = () => {
    const generated = generateQuizFromFlashcards(cards);
    setQuestions(generated);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setUserAnswers({});
    setIsCompleted(false);
  };

  // Completion Screen
  if (isCompleted) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-4">
            <Award className="w-7 h-7" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-display">
            Active Recall Quiz Results
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {deckTitle}
          </p>

          <div className="my-6">
            <div className="text-5xl font-extrabold font-display text-indigo-600 dark:text-indigo-400">
              {percentage}%
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
              You scored {score} out of {questions.length} questions correctly.
            </div>
          </div>

          {/* Missed questions review */}
          {score < questions.length && (
            <div className="text-left mt-6 mb-6 pt-6 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Review Questions to Cement Recall
              </h3>
              <div className="space-y-3">
                {questions.map((q, idx) => {
                  const ans = userAnswers[idx];
                  if (ans && ans.correct) return null;
                  return (
                    <div
                      key={q.id}
                      className="p-3.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20 text-xs space-y-1"
                    >
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {idx + 1}. {q.question}
                      </div>
                      <div className="text-red-700 dark:text-red-400">
                        Your answer: <span className="line-through">{ans?.selected || 'Skipped'}</span>
                      </div>
                      <div className="text-emerald-700 dark:text-emerald-400 font-medium">
                        Correct: {q.correctAnswer}
                      </div>
                      <div className="text-slate-500 text-[11px] italic">
                        {q.explanation}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleRestart}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Quiz</span>
            </button>
            <button
              onClick={onBackToStudy}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm"
            >
              Study Cards in 3D Mode
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQ) return null;

  const matchingCard = cards.find((c) => c.id === currentQ.flashcardId);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToSummary}
          className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-300 flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Exit to Summary</span>
        </button>

        <div className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300">
          Score: {score} / {currentIndex + (isAnswered ? 1 : 0)}
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>{Math.round(((currentIndex + 1) / questions.length) * 100)}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-2">
          Recall Challenge
        </span>

        {matchingCard?.imageUrl && (
          <div className="mb-4 max-h-44 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 flex items-center justify-center p-2">
            <img
              src={matchingCard.imageUrl}
              alt="Quiz visual reference"
              className="max-h-40 w-auto object-contain rounded"
            />
          </div>
        )}

        <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug font-display mb-6">
          {currentQ.question}
        </h3>

        {/* Options */}
        <div className="space-y-2.5">
          {currentQ.options.map((opt, idx) => {
            const isSelected = selectedOption === opt;
            const isCorrect = opt === currentQ.correctAnswer;

            let btnClass = 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:border-indigo-400';

            if (isAnswered) {
              if (isCorrect) {
                btnClass = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-semibold';
              } else if (isSelected) {
                btnClass = 'border-red-500 bg-red-50 dark:bg-red-950/50 text-red-900 dark:text-red-200';
              } else {
                btnClass = 'border-slate-200 dark:border-slate-800 opacity-50 bg-slate-50 dark:bg-slate-900 text-slate-400';
              }
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={isAnswered}
                onClick={() => handleSelectOption(opt)}
                className={`w-full text-left p-4 rounded-xl border text-xs sm:text-sm leading-relaxed transition-all flex items-center justify-between gap-3 ${btnClass}`}
              >
                <span>{opt}</span>
                {isAnswered && (
                  <div>
                    {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                    {isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-600 shrink-0" />}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation callout after answer */}
        {isAnswered && (
          <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Explanation &amp; Memory Anchor
            </span>
            <p className="text-xs text-slate-700 dark:text-slate-300">
              {currentQ.explanation}
            </p>
            {matchingCard?.sourceReference && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                Source: {matchingCard.sourceReference}
              </p>
            )}
          </div>
        )}

        {/* Next button */}
        {isAnswered && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <span>{currentIndex < questions.length - 1 ? 'Next Question' : 'View Results'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
