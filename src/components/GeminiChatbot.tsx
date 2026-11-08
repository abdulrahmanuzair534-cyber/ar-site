import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  GraduationCap,
  Zap,
  FileText,
  RotateCcw,
  Minimize2,
  Maximize2,
  ChevronDown,
} from 'lucide-react';
import { SummaryDocument } from '../types/index';

export type ChatRole = 'tutor' | 'quizzer' | 'analyst' | 'ocr_expert';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface GeminiChatbotProps {
  activeDeck?: SummaryDocument;
}

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({ activeDeck }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [role, setRole] = useState<ChatRole>('tutor');
  const [speedMode, setSpeedMode] = useState<'standard' | 'fast'>('standard');
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  // Initial welcome message based on role
  const getWelcomeMessage = (selectedRole: ChatRole): string => {
    switch (selectedRole) {
      case 'quizzer':
        return `⚡ **Ready for Active Recall!**\n\nI'm your AR Rapid Quizzer. I will test your retention of **"${activeDeck?.title || 'your study deck'}"** with high-yield questions. Ready for question 1?`;
      case 'analyst':
        return `📋 **Executive Intelligence Briefing**\n\nI'm your Executive Analyst. Ask me for Bottom Line Up Front (BLUF) takeaways, strategic risk trade-offs, or executive memos.`;
      case 'ocr_expert':
        return `🔍 **OCR & Text Inspector**\n\nI specialize in analyzing, structuring, and verifying text extracted from your images, textbooks, or whiteboard scans. How can I assist?`;
      default:
        return `🎓 **Welcome to your Socratic Study Session**\n\nI'm grounded in **"${activeDeck?.title || 'General Studies'}"**. Ask me to explain concepts from first principles, generate mnemonics, or walk through complex equations step-by-step.`;
    }
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: getWelcomeMessage('tutor'),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking, isOpen, isMinimized]);

  // Handle role switch
  const handleRoleChange = (newRole: ChatRole) => {
    setRole(newRole);
    setMessages((prev) => [
      ...prev,
      {
        id: `switch-${Date.now()}`,
        role: 'assistant',
        content: getWelcomeMessage(newRole),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `reset-${Date.now()}`,
        role: 'assistant',
        content: getWelcomeMessage(role),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Client-side intelligent study tutor reply generator (for static hosting like GitHub Pages)
  const generateClientChatReply = (userMessage: string, currentRole: ChatRole): string => {
    const q = userMessage.toLowerCase();
    const topic = activeDeck?.title || 'General Studies';
    const cardSample = activeDeck?.flashcards?.[0];

    if (currentRole === 'quizzer') {
      if (cardSample) {
        return `⚡ **Active Recall Challenge — ${topic}**\n\n**Question**: ${cardSample.question}\n\n*Think carefully before checking: what is the key mechanism or answer? Reply with your thoughts and I will evaluate your mastery!*`;
      }
      return `⚡ **Active Recall Challenge — ${topic}**\n\n**Question**: What is the primary operational trade-off or constraint governing **${topic}**, and why is it essential for system equilibrium?\n\n*Reply with your answer and I will grade your retention!*`;
    }

    if (currentRole === 'analyst') {
      return `📋 **Executive BLUF Analysis — ${topic}**\n\n**Bottom Line Up Front**: Successful implementation requires strict adherence to core invariants and continuous risk monitoring.\n\n**Key Takeaways**:\n• Prioritize high-yield mechanisms that yield direct measurable outcomes.\n• Mitigate edge-case failure modes through redundancy and idempotent validation.\n• Reference: ${activeDeck?.executiveBrief ? activeDeck.executiveBrief.slice(0, 160) + '...' : 'Focus on primary operating constraints.'}`;
    }

    if (currentRole === 'ocr_expert') {
      return `🔍 **OCR & Text Inspector**\n\nI reviewed your query regarding: *"${userMessage}"*.\n\n• **Fidelity Check**: Optical Character Recognition maintains highest accuracy when high contrast and minimum 300 DPI resolution are present.\n• **Formatting Tip**: When copying extracted tables or mathematical expressions, preserve monospace indentation or Markdown pipe tables for zero data corruption.\n\nWould you like me to structure any extracted text into flashcards?`;
    }

    if (q.includes('mnemonic') || q.includes('remember') || q.includes('hook')) {
      if (cardSample && cardSample.mnemonic) {
        return `💡 **Memory Anchor (Mnemonic) for ${topic}**:\n\n${cardSample.mnemonic}\n\n*Pro-tip: Visualize this hook as a vivid physical image in your mind to activate bilateral sensory encoding!*`;
      }
      return `💡 **Memory Anchor (Mnemonic)**:\n\nFor **${topic}**, use the **A-C-E** framework:\n• **A** - Anchor the primary constraint.\n• **C** - Cause & Effect relationship.\n• **E** - Equilibrium state or practical payoff.`;
    }

    if (q.includes('explain') || q.includes('what is') || q.includes('how')) {
      return `🎓 **AR Socratic Study Tutor**\n\nRegarding **"${userMessage}"** in the context of **${topic}**:\n\n1. **First Principles**: Every complex concept builds on a simple invariant. Here, the central focus is understanding what happens under normal operation versus failure states.\n2. **Intuitive Analogy**: Think of this like a balanced scale: when one parameter is pushed, another must compensate to preserve system integrity.\n3. **Practical Application**: ${activeDeck?.coreConcepts?.[0]?.practicalApplication || 'Apply this principle during systematic reviews and real-world diagnostics.'}\n\nDoes this clarify the mechanism, or would you like a deeper breakdown?`;
    }

    return `🎓 **AR Study Tutor**\n\nI reviewed your note regarding **"${userMessage}"**.\n\nTo cement this in long-term memory:\n• Try explaining the core mechanism out loud in 60 seconds without looking at notes.\n• Formulate one real-world edge case where this rule applies.\n\nWhat aspect of **${topic}** should we dive into next?`;
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isThinking) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput('');
    setIsThinking(true);

    // Build context string from activeDeck
    const topicContext = activeDeck
      ? `Topic: ${activeDeck.title}\nExecutive Brief: ${activeDeck.executiveBrief}\nKey Takeaways: ${activeDeck.keyTakeaways.join('; ')}\nFlashcards Count: ${activeDeck.flashcards?.length || 0}`
      : 'General Study Knowledge';

    try {
      let replyText = '';

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            messages: newHistory.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            role,
            topicContext,
            modelPreference: speedMode === 'fast' ? 'fast' : 'standard',
          }),
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data.reply) {
            replyText = data.reply;
          }
        }
      } catch (fetchErr) {
        // Fall back to client tutor reply when API is unavailable (e.g. GitHub Pages)
        console.info('Server chat API unavailable (static host); using client tutor engine.');
      }

      if (!replyText) {
        replyText = generateClientChatReply(query, role);
      }

      const assistantMessage: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Chatbot error:', err);
      const fallbackReply = generateClientChatReply(query, role);
      setMessages((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          role: 'assistant',
          content: fallbackReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const promptSuggestions = [
    'Test my knowledge with 3 questions',
    'Give me a mnemonic for this topic',
    'Summarize the core trade-off',
    'Explain this like I am 5',
  ];

  return (
    <aside aria-label="AR AI Assistant" className="fixed bottom-5 right-5 z-50 font-sans print:hidden">
      {/* Floating Trigger Button (When closed) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 text-white shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-indigo-400/40"
          title="Open AR Gemini AI Study Assistant"
          aria-label="Open AR Gemini AI Study Assistant"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-indigo-700" />
          </div>
          <span className="font-semibold text-xs tracking-wide">AR AI Assistant</span>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/20 text-indigo-100">
            Gemini
          </span>
        </button>
      )}

      {/* Floating Chat Window (When open) */}
      {isOpen && (
        <div
          className={`flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl transition-all overflow-hidden ${
            isMinimized
              ? 'w-72 h-14'
              : 'w-[90vw] sm:w-[400px] h-[550px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="h-14 px-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 text-white flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-xs truncate">AR Study Assistant</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Gemini 3.8 Flash Online" />
                </div>
                <p className="text-[10px] text-indigo-100 truncate">
                  {speedMode === 'fast' ? 'gemini-3.1-flash-lite' : 'gemini-3.8-flash'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-white/80">
              <button
                onClick={handleClearChat}
                className="p-1.5 rounded-lg hover:bg-white/20 hover:text-white transition-colors"
                title="Restart conversation"
                aria-label="Restart conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsMinimized((prev) => !prev)}
                className="p-1.5 rounded-lg hover:bg-white/20 hover:text-white transition-colors"
                title={isMinimized ? 'Expand chat' : 'Minimize chat'}
                aria-label={isMinimized ? 'Expand chat' : 'Minimize chat'}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 hover:text-white transition-colors"
                title="Close chat"
                aria-label="Close chat"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Role Switcher Toolbar */}
              <div className="px-3 py-2 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs overflow-x-auto shrink-0">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleRoleChange('tutor')}
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                      role === 'tutor'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <GraduationCap className="w-3 h-3" />
                    <span>Tutor</span>
                  </button>
                  <button
                    onClick={() => handleRoleChange('quizzer')}
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                      role === 'quizzer'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Zap className="w-3 h-3" />
                    <span>Quizzer</span>
                  </button>
                  <button
                    onClick={() => handleRoleChange('analyst')}
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                      role === 'analyst'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <FileText className="w-3 h-3" />
                    <span>BLUF</span>
                  </button>
                </div>

                {/* Speed Mode Toggle */}
                <button
                  onClick={() => setSpeedMode((m) => (m === 'standard' ? 'fast' : 'standard'))}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600"
                  title="Switch between gemini-3.8-flash and gemini-3.1-flash-lite"
                >
                  {speedMode === 'fast' ? '⚡ Fast Lite' : '✨ Flash 3.8'}
                </button>
              </div>

              {/* Scrollable Message Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 dark:bg-slate-900/40 text-xs">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        AR
                      </div>
                    )}
                    <div
                      className={`max-w-[82%] rounded-2xl p-3 leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 rounded-bl-xs shadow-xs'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      <span
                        className={`block text-[9px] mt-1 text-right ${
                          msg.role === 'user' ? 'text-indigo-200' : 'text-slate-400'
                        }`}
                      >
                        {msg.timestamp}
                      </span>
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                ))}

                {isThinking && (
                  <div className="flex gap-2.5 items-center text-xs text-slate-500">
                    <div className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 animate-pulse">
                      AR
                    </div>
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
                      <span className="text-[10px] text-slate-400 ml-1">Thinking with Gemini...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions Chips & Input Form */}
              <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 space-y-2">
                {/* Suggestions */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {promptSuggestions.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(prompt)}
                      className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 text-[10px] font-medium text-slate-600 dark:text-slate-300 shrink-0 border border-slate-200 dark:border-slate-700 transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>

                {/* Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="relative flex items-center gap-1.5"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Ask about ${activeDeck?.title ? 'this deck' : 'anything'}...`}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-3 pr-10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isThinking}
                    className="absolute right-1 p-1.5 rounded-lg bg-indigo-600 text-white disabled:opacity-40 hover:bg-indigo-700 transition-colors cursor-pointer"
                    title="Send message"
                    aria-label="Send message"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </aside>
  );
};
