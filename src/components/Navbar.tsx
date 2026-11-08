import React from 'react';
import { Sun, Moon, Sparkles, BookOpen, Layers, HelpCircle, Camera, Library, Building2 } from 'lucide-react';

interface NavbarProps {
  currentView: 'overview' | 'generator' | 'ocr' | 'summary' | 'study' | 'quiz' | 'decks';
  onNavigate: (view: 'overview' | 'generator' | 'ocr' | 'summary' | 'study' | 'quiz' | 'decks') => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  isDark,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6 px-6 py-3.5">
        {/* Zone 1: Brand wordmark (single text element wordmark as per Top Bar Contract) */}
        <button
          onClick={() => onNavigate('overview')}
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5 whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity text-left cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-700 via-indigo-600 to-blue-500 text-white flex items-center justify-center font-display font-extrabold text-sm shadow-md shadow-indigo-600/20">
            AR
          </div>
          <span className="font-display font-extrabold text-xl tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 dark:from-white dark:via-slate-100 dark:to-indigo-200 bg-clip-text text-transparent">
            AR Site
          </span>
        </button>

        {/* Zone 2: Navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <button
            onClick={() => onNavigate('summary')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
              currentView === 'summary'
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Summary & Notes
          </button>
          <button
            onClick={() => onNavigate('study')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
              currentView === 'study'
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Flashcards
          </button>
          <button
            onClick={() => onNavigate('quiz')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
              currentView === 'quiz'
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Quiz Recall
          </button>
          <button
            onClick={() => onNavigate('ocr')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
              currentView === 'ocr'
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Image to Text
          </button>
          <button
            onClick={() => onNavigate('generator')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
              currentView === 'generator'
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            AI Generator
          </button>
          <button
            onClick={() => onNavigate('decks')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
              currentView === 'decks'
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Study Decks
          </button>
          <button
            onClick={() => onNavigate('overview')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
              currentView === 'overview'
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Enterprise
          </button>
        </nav>

        {/* Zone 3: 1 primary action + theme toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
          <button
            onClick={() => onNavigate('generator')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm shadow-indigo-600/20 transition-all whitespace-nowrap shrink-0 hover:scale-[1.02] cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Launch Engine</span>
          </button>
        </div>
      </div>
    </header>
  );
};
