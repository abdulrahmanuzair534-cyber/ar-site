import React, { useState, useEffect } from 'react';
import { Sun, Moon, Sparkles, Flame, Menu, X } from 'lucide-react';
import { getStudyStreak, STREAK_UPDATED_EVENT } from '../utils/streakService';

interface NavbarProps {
  currentView: 'overview' | 'generator' | 'extractor' | 'summary' | 'study' | 'quiz' | 'decks' | 'ocr';
  onNavigate: (view: 'overview' | 'generator' | 'extractor' | 'summary' | 'study' | 'quiz' | 'decks') => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

const DESKTOP_NAV_ITEMS: {
  id: 'overview' | 'extractor' | 'generator' | 'study' | 'decks';
  label: string;
}[] = [
  { id: 'overview', label: 'Company' },
  { id: 'extractor', label: 'OCR & Files' },
  { id: 'generator', label: 'AI Studio' },
  { id: 'study', label: 'Flashcards' },
  { id: 'decks', label: 'Study Decks' },
];

const MOBILE_NAV_ITEMS: {
  id: 'overview' | 'extractor' | 'generator' | 'summary' | 'study' | 'quiz' | 'decks';
  label: string;
}[] = [
  { id: 'overview', label: 'Company Overview' },
  { id: 'extractor', label: 'Vision OCR & Files' },
  { id: 'generator', label: 'AI Synthesis Studio' },
  { id: 'summary', label: 'Summary & Mastery' },
  { id: 'study', label: '3D Flashcards' },
  { id: 'quiz', label: 'Quiz Recall' },
  { id: 'decks', label: 'Study Decks' },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  isDark,
  onToggleTheme,
}) => {
  const [streak, setStreak] = useState<number>(() => getStudyStreak().currentStreak);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const updateStreak = () => {
      const data = getStudyStreak();
      setStreak(data.currentStreak);
    };

    window.addEventListener(STREAK_UPDATED_EVENT, updateStreak);
    window.addEventListener('storage', updateStreak);
    return () => {
      window.removeEventListener(STREAK_UPDATED_EVENT, updateStreak);
      window.removeEventListener('storage', updateStreak);
    };
  }, []);

  const handleNavClick = (view: 'overview' | 'generator' | 'extractor' | 'summary' | 'study' | 'quiz' | 'decks') => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 py-3.5">
        {/* Zone 1: Single clean Brand wordmark */}
        <button
          type="button"
          onClick={() => handleNavClick('overview')}
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5 whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity cursor-pointer"
        >
          <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-700 via-indigo-600 to-blue-500 text-white flex items-center justify-center font-display font-extrabold text-sm shadow-sm">
            AR
          </span>
          <span className="font-display font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
            AR Site
          </span>
        </button>

        {/* Zone 2: 5 concise single-line text nav links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300" aria-label="Primary Navigation">
          {DESKTOP_NAV_ITEMS.map((item) => {
            const isActive =
              currentView === item.id ||
              (item.id === 'extractor' && currentView === 'ocr') ||
              (item.id === 'decks' && (currentView === 'summary' || currentView === 'quiz'));
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 cursor-pointer ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 font-semibold border-indigo-600 dark:border-indigo-400'
                    : 'border-transparent hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Streak indicator + Theme switch + Primary CTA + Mobile drawer toggle */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 select-none"
            title={`Active Study Streak: ${streak} consecutive day${streak === 1 ? '' : 's'} of learning`}
            aria-label={`Study Streak: ${streak} ${streak === 1 ? 'day' : 'days'}`}
          >
            <Flame className="w-4 h-4 text-orange-500 fill-amber-500" />
            <span className="font-mono text-xs font-bold tabular-nums text-amber-800 dark:text-amber-300">
              {streak}
            </span>
            <span className="text-[11px] font-semibold text-amber-700/90 dark:text-amber-400/90 hidden sm:inline">
              {streak === 1 ? 'day' : 'days'}
            </span>
          </div>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('generator')}
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Launch Engine</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobile Navigation"
          className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 space-y-1"
        >
          {MOBILE_NAV_ITEMS.map((item) => {
            const isActive = currentView === item.id || (item.id === 'extractor' && currentView === 'ocr');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => handleNavClick('generator')}
            className="w-full mt-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Launch Engine</span>
          </button>
        </nav>
      )}
    </header>
  );
};
