import React, { useState, useEffect } from 'react';
import { SummaryDocument, Flashcard } from './types/index';
import { SAMPLE_DECKS } from './data/sampleDecks';
import { Navbar } from './components/Navbar';
import { EnterpriseOverview } from './components/EnterpriseOverview';
import { GeneratorForm } from './components/GeneratorForm';
import { SummaryViewer } from './components/SummaryViewer';
import { FlashcardStudyMode } from './components/FlashcardStudyMode';
import { QuizMode } from './components/QuizMode';
import { DeckList } from './components/DeckList';
import { ExportModal } from './components/ExportModal';
import { ImageToTextGenerator } from './components/ImageToTextGenerator';
import { GeminiChatbot } from './components/GeminiChatbot';

const LOCAL_STORAGE_KEY = 'arsite_study_decks_v1';
const THEME_STORAGE_KEY = 'arsite_theme_mode';

export default function App() {
  const [decks, setDecks] = useState<SummaryDocument[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load decks from localStorage', e);
    }
    return SAMPLE_DECKS;
  });

  const [currentDeckId, setCurrentDeckId] = useState<string>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paramDeck = urlParams.get('deck');
    if (paramDeck) return paramDeck;
    return SAMPLE_DECKS[0]?.id || '';
  });

  const [currentView, setCurrentView] = useState<'overview' | 'generator' | 'ocr' | 'summary' | 'study' | 'quiz' | 'decks'>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const autostart = urlParams.get('autostart');
    const view = urlParams.get('view');
    if (view && ['overview', 'generator', 'ocr', 'summary', 'study', 'quiz', 'decks'].includes(view)) {
      return view as any;
    }
    if (autostart === '1') {
      return 'summary';
    }
    return 'overview';
  });

  const [initialOcrText, setInitialOcrText] = useState<string>('');
  const [initialOcrSource, setInitialOcrSource] = useState<{ title?: string; author?: string; citation?: string } | undefined>(undefined);
  const [initialOcrImageUrl, setInitialOcrImageUrl] = useState<string>('');

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme) return savedTheme === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [isExportOpen, setIsExportOpen] = useState(false);

  // Sync theme with document element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(THEME_STORAGE_KEY, 'light');
    }
  }, [isDark]);

  // Persist decks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(decks));
    } catch (e) {
      console.error('Failed to save decks to localStorage', e);
    }
  }, [decks]);

  const activeDeck = decks.find((d) => d.id === currentDeckId) || decks[0] || SAMPLE_DECKS[0];

  const handleToggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const handleGenerated = (newDeck: SummaryDocument) => {
    setDecks((prev) => [newDeck, ...prev]);
    setCurrentDeckId(newDeck.id);
    setCurrentView('summary');
  };

  const handleUpdateCards = (updatedCards: Flashcard[]) => {
    if (!activeDeck) return;
    const updatedDeck: SummaryDocument = {
      ...activeDeck,
      flashcards: updatedCards,
    };

    setDecks((prev) =>
      prev.map((d) => (d.id === updatedDeck.id ? updatedDeck : d))
    );
  };

  const handleDeleteDeck = (deckId: string) => {
    if (confirm('Are you sure you want to delete this study deck?')) {
      const remaining = decks.filter((d) => d.id !== deckId);
      setDecks(remaining.length > 0 ? remaining : SAMPLE_DECKS);
      if (currentDeckId === deckId) {
        setCurrentDeckId(remaining[0]?.id || SAMPLE_DECKS[0].id);
      }
    }
  };

  const handleSelectDeck = (deck: SummaryDocument, view: 'summary' | 'study' | 'quiz') => {
    setCurrentDeckId(deck.id);
    setCurrentView(view);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <Navbar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
      />

      <main className="flex-1">
        {currentView === 'overview' && (
          <EnterpriseOverview
            onLaunchGenerator={() => setCurrentView('generator')}
            onExploreDecks={() => setCurrentView('decks')}
            onOpenStudy={() => {
              setCurrentDeckId(SAMPLE_DECKS[0].id);
              setCurrentView('summary');
            }}
          />
        )}

        {currentView === 'generator' && (
          <GeneratorForm
            onGenerated={handleGenerated}
            onSelectSampleDeck={(deckId) => {
              setCurrentDeckId(deckId);
              setCurrentView('summary');
            }}
            initialContent={initialOcrText}
            initialSource={initialOcrSource}
            initialImageUrl={initialOcrImageUrl}
            onOpenOcr={() => setCurrentView('ocr')}
          />
        )}

        {currentView === 'ocr' && (
          <ImageToTextGenerator
            onSendToGenerator={(text, sourceInfo, imageUrl) => {
              setInitialOcrText(text);
              setInitialOcrSource(sourceInfo);
              setInitialOcrImageUrl(imageUrl || '');
              setCurrentView('generator');
            }}
          />
        )}

        {currentView === 'summary' && activeDeck && (
          <SummaryViewer
            document={activeDeck}
            onStartStudy={() => setCurrentView('study')}
            onStartQuiz={() => setCurrentView('quiz')}
            onOpenExport={() => setIsExportOpen(true)}
            onUpdateDocument={(updated) => {
              setDecks((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
            }}
          />
        )}

        {currentView === 'study' && activeDeck && (
          <FlashcardStudyMode
            cards={activeDeck.flashcards}
            deckTitle={activeDeck.title}
            onUpdateCards={handleUpdateCards}
            onBackToSummary={() => setCurrentView('summary')}
            onStartQuiz={() => setCurrentView('quiz')}
          />
        )}

        {currentView === 'quiz' && activeDeck && (
          <QuizMode
            cards={activeDeck.flashcards}
            deckTitle={activeDeck.title}
            onBackToSummary={() => setCurrentView('summary')}
            onBackToStudy={() => setCurrentView('study')}
          />
        )}

        {currentView === 'decks' && (
          <DeckList
            decks={decks}
            onSelectDeck={handleSelectDeck}
            onDeleteDeck={handleDeleteDeck}
            onCreateNew={() => setCurrentView('generator')}
          />
        )}
      </main>

      {/* Export Modal */}
      {activeDeck && (
        <ExportModal
          studyDoc={activeDeck}
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
        />
      )}

      {/* Floating Gemini AI Study Assistant */}
      <GeminiChatbot activeDeck={activeDeck} />

      {/* Corporate Enterprise Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-10 px-6 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-display font-bold text-xs">
              AR
            </div>
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">AR Site</span>
              <span className="text-slate-400 ml-2">© {new Date().getFullYear()} AR Site Global Enterprises. All rights reserved.</span>
            </div>
          </div>
          <div className="flex items-center gap-5 text-xs font-medium">
            <button
              onClick={() => setCurrentView('overview')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Enterprise Overview
            </button>
            <button
              onClick={() => setCurrentView('summary')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Summary Hub
            </button>
            <button
              onClick={() => setCurrentView('generator')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              AI Generator
            </button>
            <button
              onClick={() => setCurrentView('ocr')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Image to Text (OCR)
            </button>
            <button
              onClick={() => setCurrentView('decks')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Study Decks
            </button>
            <button
              onClick={() => {
                setDecks(SAMPLE_DECKS);
                setCurrentDeckId(SAMPLE_DECKS[0].id);
              }}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Reset Sample Decks
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
