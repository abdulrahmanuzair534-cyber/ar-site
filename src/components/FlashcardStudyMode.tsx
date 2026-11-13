import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flashcard, ReviewRating } from '../types/index';
import { calculateLeitnerUpdate, calculateDeckMastery, shuffleArray } from '../utils/retentionLogic';
import { recordStudySession } from '../utils/streakService';
import {
  speech,
  SpeechTarget,
  buildFrontSpeechText,
  buildBackSpeechText,
} from '../utils/speech';
import {
  calculateCardTilt,
  DEFAULT_CARD_TILT,
  getCard3DTransition,
  CardSwapDirection,
  CardTiltState,
} from '../utils/flashcardMotion';
import {
  Volume2,
  VolumeX,
  RotateCw,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  Star,
  Award,
  CheckCircle,
  HelpCircle,
  Lightbulb,
  BookOpen,
  X,
  Headphones,
  Layers,
} from 'lucide-react';

interface FlashcardStudyModeProps {
  cards: Flashcard[];
  deckTitle: string;
  onUpdateCards: (updatedCards: Flashcard[]) => void;
  onBackToSummary: () => void;
  onStartQuiz: () => void;
}

export const FlashcardStudyMode: React.FC<FlashcardStudyModeProps> = ({
  cards: initialCards,
  deckTitle,
  onUpdateCards,
  onBackToSummary,
  onStartQuiz,
}) => {
  const originalCardsRef = useRef<Flashcard[]>(initialCards);
  const [cards, setCards] = useState<Flashcard[]>(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
  const [showHint, setShowHint] = useState(false);
  const [sessionRatings, setSessionRatings] = useState<Record<string, ReviewRating>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingTarget, setSpeakingTarget] = useState<SpeechTarget>(null);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [autoRead, setAutoRead] = useState<boolean>(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [swapDirection, setSwapDirection] = useState<CardSwapDirection>('next');
  const [transitionKey, setTransitionKey] = useState<number>(0);
  const [tilt, setTilt] = useState<CardTiltState>(DEFAULT_CARD_TILT);
  const [notification, setNotification] = useState<string | null>(null);
  const notificationTimerRef = useRef<any>(null);
  const cardStageRef = useRef<HTMLDivElement | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
    notificationTimerRef.current = setTimeout(() => {
      setNotification(null);
    }, 2800);
  };

  const currentCard = cards[currentIndex] || cards[0];

  useEffect(() => {
    originalCardsRef.current = initialCards;
    setCards(initialCards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsShuffled(false);
    setSwapDirection('next');
    setTransitionKey((k) => k + 1);
  }, [initialCards]);

  useEffect(() => {
    speech.setListener((speaking) => setIsSpeaking(speaking));
    speech.setTargetListener((target) => setSpeakingTarget(target));
    return () => {
      speech.stop();
      speech.setTargetListener(() => {});
      if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
    };
  }, []);

  const handleCycleRate = () => {
    const rates = [0.85, 1.0, 1.25, 1.5];
    const nextIdx = (rates.indexOf(speechRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setSpeechRate(nextRate);
    speech.setRate(nextRate);
    showNotification(`Voice speed set to ${nextRate}x`);
  };

  const speakSide = useCallback(
    (side: 'front' | 'back') => {
      if (!currentCard) return;
      if (isSpeaking && speakingTarget === side) {
        speech.stop();
        return;
      }
      speech.setRate(speechRate);
      if (side === 'front') {
        speech.speak(buildFrontSpeechText(currentCard), 'front');
      } else {
        speech.speak(buildBackSpeechText(currentCard), 'back');
      }
    },
    [currentCard, isSpeaking, speakingTarget, speechRate]
  );

  const handleSpeakBoth = useCallback(() => {
    if (!currentCard) return;
    if (isSpeaking && speakingTarget === 'both') {
      speech.stop();
      return;
    }
    speech.setRate(speechRate);
    setIsFlipped(false);
    speech.speakCardFrontAndBack(currentCard, (activeSide) => {
      if (activeSide === 'back') {
        setIsFlipped(true);
      } else {
        setIsFlipped(false);
      }
    });
  }, [currentCard, isSpeaking, speakingTarget, speechRate]);

  const handleFlip = useCallback(() => {
    setTilt(DEFAULT_CARD_TILT);
    setIsFlipped((prev) => {
      const next = !prev;
      if (autoRead && currentCard) {
        speech.setRate(speechRate);
        if (next) {
          speech.speak(buildBackSpeechText(currentCard), 'back');
        } else {
          speech.speak(buildFrontSpeechText(currentCard), 'front');
        }
      }
      return next;
    });
    setShowHint(false);
  }, [autoRead, currentCard, speechRate]);

  const handleNext = useCallback(() => {
    speech.stop();
    setTilt(DEFAULT_CARD_TILT);
    setIsFlipped(false);
    setShowHint(false);
    if (currentIndex < cards.length - 1) {
      const nextIndex = currentIndex + 1;
      setSwapDirection('next');
      setTransitionKey((k) => k + 1);
      setCurrentIndex(nextIndex);
      if (autoRead && cards[nextIndex]) {
        speech.setRate(speechRate);
        speech.speak(buildFrontSpeechText(cards[nextIndex]), 'front');
      }
    } else {
      setIsCompleted(true);
    }
  }, [currentIndex, cards, autoRead, speechRate]);

  const handlePrev = useCallback(() => {
    speech.stop();
    setTilt(DEFAULT_CARD_TILT);
    setIsFlipped(false);
    setShowHint(false);
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setSwapDirection('prev');
      setTransitionKey((k) => k + 1);
      setCurrentIndex(prevIndex);
      if (autoRead && cards[prevIndex]) {
        speech.setRate(speechRate);
        speech.speak(buildFrontSpeechText(cards[prevIndex]), 'front');
      }
    }
  }, [currentIndex, cards, autoRead, speechRate]);

  const handleRateCard = useCallback(
    (rating: ReviewRating) => {
      if (!currentCard) return;

      const updatedCardData = calculateLeitnerUpdate(currentCard, rating);
      const updatedCard: Flashcard = {
        ...currentCard,
        ...updatedCardData,
      };

      const newCards = [...cards];
      newCards[currentIndex] = updatedCard;
      setCards(newCards);
      onUpdateCards(newCards);

      setSessionRatings((prev) => ({
        ...prev,
        [currentCard.id]: rating,
      }));

      recordStudySession();
      handleNext();
    },
    [currentCard, cards, currentIndex, onUpdateCards, handleNext]
  );

  const handleShuffle = useCallback(() => {
    speech.stop();
    setTilt(DEFAULT_CARD_TILT);
    const randomized = shuffleArray(cards);
    setSwapDirection('shuffle');
    setTransitionKey((k) => k + 1);
    setCards(randomized);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setIsShuffled(true);
    showNotification('Cards shuffled with 3D deck reorder!');
  }, [cards]);

  const handleResetOrder = () => {
    speech.stop();
    setTilt(DEFAULT_CARD_TILT);
    setSwapDirection('prev');
    setTransitionKey((k) => k + 1);
    setCards([...originalCardsRef.current]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setIsShuffled(false);
    showNotification('Reset to original card order.');
  };

  const toggleStar = (id: string) => {
    setStarredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSpeakCurrent = useCallback(() => {
    if (isSpeaking) {
      speech.stop();
      return;
    }
    speakSide(isFlipped ? 'back' : 'front');
  }, [isSpeaking, isFlipped, speakSide]);

  const handlePointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardStageRef.current) return;
    const rect = cardStageRef.current.getBoundingClientRect();
    setTilt(calculateCardTilt(e.clientX, e.clientY, rect, 8));
  };

  const handlePointerLeave = () => {
    setTilt(DEFAULT_CARD_TILT);
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid firing when user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleFlip();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleShuffle();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleSpeakCurrent();
      } else if (isFlipped) {
        if (e.key === '1') handleRateCard('again');
        if (e.key === '2') handleRateCard('hard');
        if (e.key === '3') handleRateCard('good');
        if (e.key === '4') handleRateCard('easy');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, handleNext, handlePrev, handleRateCard, isFlipped, handleShuffle, handleSpeakCurrent]);

  // Restart session or review only flagged/again cards
  const handleReviewAgain = (onlyMissed = false) => {
    if (onlyMissed) {
      const missedCards = cards.filter(
        (c) => sessionRatings[c.id] === 'again' || sessionRatings[c.id] === 'hard' || starredIds.has(c.id)
      );
      if (missedCards.length > 0) {
        setCards(missedCards);
      }
    }
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setIsCompleted(false);
    setSessionRatings({});
  };

  if (!cards || cards.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <p className="text-slate-600 dark:text-slate-400 mb-4">No flashcards found in this study set.</p>
        <button
          onClick={onBackToSummary}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
        >
          Back to Summary
        </button>
      </div>
    );
  }

  // Completion Screen
  if (isCompleted) {
    const total = cards.length;
    const againCount = Object.values(sessionRatings).filter((r) => r === 'again').length;
    const goodOrEasyCount = Object.values(sessionRatings).filter((r) => r === 'good' || r === 'easy').length;
    const deckMastery = calculateDeckMastery(cards);

    return (
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-4">
            <Award className="w-7 h-7" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-display">
            Study Session Completed!
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-md mx-auto">
            You reviewed {total} flashcards in <span className="font-semibold text-slate-800 dark:text-slate-200">{deckTitle}</span>.
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 my-6 max-w-md mx-auto">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Mastery Score</span>
              <span className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">{deckMastery}%</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Retained</span>
              <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{goodOrEasyCount}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Needs Practice</span>
              <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">{againCount}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            {againCount > 0 && (
              <button
                onClick={() => handleReviewAgain(true)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-semibold transition-colors"
              >
                Practice Difficult Cards ({againCount})
              </button>
            )}

            <button
              onClick={() => handleReviewAgain(false)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Review All Cards</span>
            </button>

            <button
              onClick={() => {
                handleReviewAgain(false);
                handleShuffle();
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Shuffle &amp; Practice</span>
            </button>

            <button
              onClick={onStartQuiz}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Take Quiz Challenge</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isStarred = starredIds.has(currentCard.id);
  const progressPercent = Math.round(((currentIndex + 1) / cards.length) * 100);
  const isFrontSpeaking = isSpeaking && (speakingTarget === 'front' || (speakingTarget === 'both' && !isFlipped));
  const isBackSpeaking = isSpeaking && (speakingTarget === 'back' || (speakingTarget === 'both' && isFlipped));
  const swapVariants = getCard3DTransition(swapDirection);

  const AudioBars = () => (
    <span className="inline-flex items-end gap-0.5 h-3 w-3 justify-center" aria-hidden="true">
      <span className="w-0.5 h-full bg-current rounded-full origin-bottom animate-tts-bar-1" />
      <span className="w-0.5 h-full bg-current rounded-full origin-bottom animate-tts-bar-2" />
      <span className="w-0.5 h-full bg-current rounded-full origin-bottom animate-tts-bar-3" />
    </span>
  );

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Top bar with back, 3D deck controls, shuffle & TTS voice suite */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToSummary}
          className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Exit to Summary</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Prominent Shuffle Button */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleShuffle}
              title="Randomize card order for current study session (Shortcut: S)"
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                isShuffled
                  ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Shuffle className={`w-3.5 h-3.5 ${isShuffled ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`} />
              <span>{isShuffled ? 'Reshuffle' : 'Shuffle Cards'}</span>
            </button>

            {isShuffled && (
              <button
                type="button"
                onClick={handleResetOrder}
                title="Restore original progressive order"
                className="px-2 py-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          {/* Read Front & Back Sequence Button */}
          <button
            type="button"
            onClick={handleSpeakBoth}
            aria-pressed={isSpeaking && speakingTarget === 'both'}
            title="Read card front, flip, and read back aloud"
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
              isSpeaking && speakingTarget === 'both'
                ? 'border-indigo-500 bg-indigo-600 text-white shadow-indigo-500/25'
                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {isSpeaking && speakingTarget === 'both' ? (
              <>
                <AudioBars />
                <span>Stop Audio</span>
              </>
            ) : (
              <>
                <Headphones className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Read Front &amp; Back</span>
              </>
            )}
          </button>

          {/* Voice Speed Cycle Button */}
          <button
            type="button"
            onClick={handleCycleRate}
            aria-label={`Speech speed ${speechRate}x`}
            title="Cycle speech playback speed"
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {speechRate}x
          </button>

          {/* Auto-Read Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !autoRead;
              setAutoRead(next);
              showNotification(next ? 'Auto-Read enabled for card flips & navigation' : 'Auto-Read turned off');
            }}
            aria-pressed={autoRead}
            title="Automatically read card aloud on flip or card change"
            className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
              autoRead
                ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Volume2 className="w-3 h-3" />
            <span>Auto</span>
          </button>

          <button
            type="button"
            onClick={() => toggleStar(currentCard.id)}
            aria-label={isStarred ? 'Unstar card' : 'Star for review'}
            title={isStarred ? 'Unstar card' : 'Star for review'}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isStarred ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'
            }`}
          >
            <Star className="w-4 h-4 fill-current" />
          </button>
        </div>
      </div>

      {/* Notification toast banner */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold flex items-center justify-between shadow-md"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" />
              <span>{notification}</span>
            </div>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => setNotification(null)}
              className="text-white/80 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress meter */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span>Card {currentIndex + 1} of {cards.length}</span>
          <div className="flex items-center gap-2">
            <span className="font-mono">Box {currentCard.box || 1}/5</span>
            <span aria-hidden="true">·</span>
            <span>{progressPercent}% completed</span>
          </div>
        </div>
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 3D Interactive Flashcard Stage with Deck Depth Stack */}
      <div
        className="perspective-1400 relative h-[410px] sm:h-[430px] w-full pb-4"
        data-testid="flashcard-3d-stage"
        data-flipped={isFlipped ? 'true' : 'false'}
        data-speaking={speakingTarget || 'none'}
      >
        {/* Physical 3D Depth Stack Layers behind active card */}
        {cards.length > 2 && (
          <motion.div
            aria-hidden="true"
            animate={{
              y: isFlipped ? 22 : 18,
              scale: isFlipped ? 0.91 : 0.93,
              rotateX: isFlipped ? 2 : 0,
            }}
            transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            className="absolute inset-x-0 top-0 bottom-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-100/70 dark:bg-slate-900/50 shadow-sm pointer-events-none"
          />
        )}
        {cards.length > 1 && (
          <motion.div
            aria-hidden="true"
            animate={{
              y: isFlipped ? 12 : 9,
              scale: isFlipped ? 0.955 : 0.965,
              rotateX: isFlipped ? 1 : 0,
            }}
            transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            className="absolute inset-x-0 top-0 bottom-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/80 shadow-sm pointer-events-none"
          />
        )}

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${currentCard.id}-${transitionKey}`}
            initial={swapVariants.initial}
            animate={swapVariants.animate}
            exit={swapVariants.exit}
            transition={{ type: 'spring', stiffness: 260, damping: 25, mass: 0.85 }}
            style={{ transformStyle: 'preserve-3d' }}
            className="relative w-full h-[394px] sm:h-[414px]"
          >
            {/* Interactive 3D Pointer Tilt Container */}
            <motion.div
              ref={cardStageRef}
              onMouseMove={handlePointerMove}
              onMouseLeave={handlePointerLeave}
              animate={{
                rotateX: tilt.rotateX,
                rotateY: tilt.rotateY,
              }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              style={{ transformStyle: 'preserve-3d' }}
              className="relative w-full h-full"
            >
              {/* 3D Flip Container */}
              <motion.div
                onClick={handleFlip}
                animate={{
                  rotateY: isFlipped ? 180 : 0,
                  scale: isFlipped ? 1.01 : 1,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 230,
                  damping: 22,
                  mass: 0.85,
                }}
                style={{ transformStyle: 'preserve-3d' }}
                className={`relative w-full h-full rounded-2xl border cursor-pointer select-none shadow-lg hover:shadow-xl transition-shadow ${
                  isSpeaking
                    ? 'border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-500/20 bg-white dark:bg-slate-900'
                    : isFlipped
                    ? 'border-indigo-200 dark:border-indigo-900 bg-white dark:bg-slate-900'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                {/* FRONT SIDE */}
                <div
                  aria-hidden={isFlipped}
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'rotateY(0deg)',
                  }}
                  className={`absolute inset-0 rounded-2xl bg-white dark:bg-slate-900 ${
                    isFlipped ? 'pointer-events-none' : ''
                  }`}
                >
                  {/* Specular 3D Light Glare Overlay */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-200"
                    style={{
                      opacity: tilt.glareOpacity,
                      background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(99, 102, 241, 0.25), transparent 60%)`,
                    }}
                  />

                  <div className="relative z-10 h-full overflow-y-auto p-6 sm:p-8 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-4">
                        <span className="font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          {currentCard.category || 'Concept Prompt'}
                        </span>

                        <div className="flex items-center gap-2.5">
                          <span className="capitalize text-[11px]">{currentCard.difficulty || 'medium'} difficulty</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              speakSide('front');
                            }}
                            aria-pressed={isFrontSpeaking}
                            aria-label={isFrontSpeaking ? 'Stop reading front aloud' : 'Read front aloud'}
                            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                              isFrontSpeaking
                                ? 'border-indigo-500 bg-indigo-600 text-white shadow-xs'
                                : 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60'
                            }`}
                          >
                            {isFrontSpeaking ? (
                              <>
                                <AudioBars />
                                <span>Stop</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3.5 h-3.5" />
                                <span>Read Front</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {currentCard.imageUrl && (
                        <div className="mb-4 max-h-48 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 flex flex-col items-center justify-center p-2">
                          <img
                            src={currentCard.imageUrl}
                            alt={currentCard.imageCaption || 'Card visual diagram'}
                            className="max-h-40 w-auto object-contain rounded"
                          />
                          {currentCard.imageCaption && (
                            <span className="text-[10px] text-slate-400 mt-1 truncate">
                              {currentCard.imageCaption}
                            </span>
                          )}
                        </div>
                      )}

                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug font-display">
                        {currentCard.question}
                      </h3>

                      {showHint && currentCard.mnemonic && (
                        <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                          <span>Hint: {currentCard.mnemonic.slice(0, 45)}...</span>
                        </div>
                      )}

                      {currentCard.sourceReference && (
                        <div className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="truncate">Source: {currentCard.sourceReference}</span>
                        </div>
                      )}
                    </div>

                    <div className="relative z-10 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-400 mt-4">
                      {!showHint && currentCard.mnemonic ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowHint(true);
                          }}
                          className="hover:text-indigo-600 dark:hover:text-indigo-400 font-medium cursor-pointer"
                        >
                          Show Hint
                        </button>
                      ) : (
                        <span />
                      )}
                      <span className="flex items-center gap-1 font-medium">
                        <span>Click or Space to flip</span>
                        <RotateCw className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>

                {/* BACK SIDE */}
                <div
                  aria-hidden={!isFlipped}
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                  className={`absolute inset-0 rounded-2xl bg-white dark:bg-slate-900 ${
                    !isFlipped ? 'pointer-events-none' : ''
                  }`}
                >
                  {/* Specular 3D Light Glare Overlay */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-200"
                    style={{
                      opacity: tilt.glareOpacity,
                      background: `radial-gradient(circle at ${100 - tilt.glareX}% ${tilt.glareY}%, rgba(16, 185, 129, 0.22), transparent 60%)`,
                    }}
                  />

                  <div className="relative z-10 h-full overflow-y-auto p-6 sm:p-8 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-4">
                        <span className="font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Answer</span>
                        </span>

                      <div className="flex items-center gap-2.5">
                        <span className="capitalize text-[11px]">{currentCard.category}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            speakSide('back');
                          }}
                          aria-pressed={isBackSpeaking}
                          aria-label={isBackSpeaking ? 'Stop reading back aloud' : 'Read back aloud'}
                          className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                            isBackSpeaking
                              ? 'border-emerald-500 bg-emerald-600 text-white shadow-xs'
                              : 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                          }`}
                        >
                          {isBackSpeaking ? (
                            <>
                              <AudioBars />
                              <span>Stop</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>Read Back</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {currentCard.imageUrl && (
                      <div className="mb-3 max-h-36 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-950 flex items-center justify-center p-2">
                        <img
                          src={currentCard.imageUrl}
                          alt={currentCard.imageCaption || 'Card visual diagram'}
                          className="max-h-32 w-auto object-contain rounded"
                        />
                      </div>
                    )}

                    <p className="text-base sm:text-lg font-medium text-slate-900 dark:text-white leading-relaxed mb-4">
                      {currentCard.answer}
                    </p>

                    {currentCard.mnemonic && (
                      <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 mb-3">
                        <span className="font-bold text-[10px] uppercase tracking-wider text-amber-800 dark:text-amber-300 block mb-0.5">
                          Memory Anchor (Mnemonic)
                        </span>
                        <span>{currentCard.mnemonic}</span>
                      </div>
                    )}

                    {currentCard.sourceReference && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-2">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate">Source: {currentCard.sourceReference}</span>
                      </div>
                    )}

                    {currentCard.contextQuote && (
                      <div className="mt-2 text-xs italic text-slate-500 dark:text-slate-400 border-l-2 border-slate-300 dark:border-slate-700 pl-3">
                        "{currentCard.contextQuote}"
                      </div>
                    )}
                  </div>

                    <div className="relative z-10 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-400 flex items-center justify-between mt-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFlip();
                        }}
                        className="hover:text-indigo-600 dark:hover:text-indigo-400 font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>Flip to Front</span>
                      </button>
                      <span>Rate your recall below to advance card</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Rating & Navigation Controls */}
      {isFlipped ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="space-y-2"
        >
          <div className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            How well did you retain this? (SM-2 Interval)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => handleRateCard('again')}
              className="p-3 rounded-xl border border-red-200 dark:border-red-900 bg-red-50/70 hover:bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-semibold transition-all text-center cursor-pointer"
            >
              <div className="font-bold">[1] Again</div>
              <div className="text-[10px] opacity-80 mt-0.5">&lt; 4 hours (Box 1)</div>
            </button>

            <button
              type="button"
              onClick={() => handleRateCard('hard')}
              className="p-3 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/70 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-semibold transition-all text-center cursor-pointer"
            >
              <div className="font-bold">[2] Hard</div>
              <div className="text-[10px] opacity-80 mt-0.5">1 day</div>
            </button>

            <button
              type="button"
              onClick={() => handleRateCard('good')}
              className="p-3 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/70 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-semibold transition-all text-center cursor-pointer"
            >
              <div className="font-bold">[3] Good</div>
              <div className="text-[10px] opacity-80 mt-0.5">3 days (+1 Box)</div>
            </button>

            <button
              type="button"
              onClick={() => handleRateCard('easy')}
              className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold transition-all text-center cursor-pointer"
            >
              <div className="font-bold">[4] Easy</div>
              <div className="text-[10px] opacity-80 mt-0.5">7 days (+2 Boxes)</div>
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <button
            type="button"
            onClick={handleFlip}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Flip to Answer</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Skip</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
