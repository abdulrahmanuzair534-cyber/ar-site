# MASTER PROMPT: BUILDING THE "AR SITE" COGNITIVE SYNTHESIS & ACTIVE RECALL PLATFORM

You can copy and paste the prompt below into an AI coding assistant (such as Google AI Studio Build, Claude, or ChatGPT) to regenerate this complete application from scratch.

---

```markdown
Build a production-grade, full-stack accelerated learning and cognitive synthesis web platform called **"AR Site"** (powered by the **RetainIQ** synthesis engine), founded by **Abdul Rahman, Founder & Chief Architect**.

The application bridges the chasm between raw information overload and durable, permanent memory by distilling dense textbooks, legal briefs, medical papers, and executive memos into high-yield Executive Summaries, Leitner SM-2 Spaced-Repetition Flashcards, Active Recall Quizzes, and Visual Retention Mastery Curves.

---

### TECH STACK & ARCHITECTURAL REQUIREMENTS
1. **Frontend**: React 19 SPA with TypeScript and Vite.
2. **Styling**: Tailwind CSS (v4) with responsive design, elegant typography, dark/light theme toggle, and strict Zero-Pill design discipline (clean border-radii, structured metric cards, no floating pills).
3. **Icons**: Lucide React (`lucide-react`).
4. **Backend**: Node.js Express server (`server.ts`) running on port 3000, mounting Vite middlewares in development.
5. **AI SDK**: `@google/genai` TypeScript SDK using official model aliases:
   - Synthesis & Q&A: `gemini-3.8-flash` (or fast fallback `gemini-3.1-flash-lite`)
   - Audio Transcription: `gemini-3.5-transcribe`
6. **Zero-Failure Client Resilience**: Implement a pure TypeScript client-side fallback synthesis engine (`clientSynthesis.ts`) so that if the backend or API key is absent (e.g. static hosting on GitHub Pages), document generation, summarization, and flashcard extraction continue to function with 100% zero downtime.
7. **Local Persistence**: Use `localStorage` for:
   - Study decks (`arsite_study_decks_v1`) with guaranteed unique ID normalization.
   - Study streak tracking (`ar_study_streak_v1`).
   - Quiz history & attempts (`ar_quiz_history_v1`).
   - Color theme preferences (`arsite_theme_mode`).

---

### CORE SECTIONS & FUNCTIONAL SPECIFICATIONS

#### 1. NAVIGATION & GLOBAL APP SHELL (`Navbar.tsx` & `App.tsx`)
- **Brand Identity**: "AR Site" logo with gradient icon.
- **Navigation Tabs**:
  - `Summary & Notes` (Executive brief, verified citations, visual architecture diagrams, mastery chart)
  - `Flashcards` (3D Leitner study mode with flip animations & shuffle)
  - `Quiz Recall` (Active recall multiple-choice assessment)
  - `Text Extractor` (Multi-format document parsing)
  - `AI Generator` (Text distillation & audio transcription input)
  - `Study Decks` (Deck library with track filtering and search)
  - `Enterprise` (Company overview, founder leadership, supercomputing infrastructure)
- **Study Streak Counter**: Flame icon (`🔥 X Days`) in the navbar that tracks consecutive daily study sessions via `localStorage`.
- **Theme Toggle**: Dark/Light mode switcher with document class sync and icon toggle.

#### 2. AI & CLIENT COGNITIVE SYNTHESIS ENGINE (`GeneratorForm.tsx` & `server.ts`)
- **Input**:
  - Multi-line textarea for study text with live word/character/read-time counters.
  - Quick-load sample document presets (Distributed Systems, Corporate Valuation, Autonomic Pharmacology, Machine Learning Transformers).
  - Source attribution inputs (Title, Author, Citation/Chapter, URL).
  - Optional visual diagram attachment (Browse image or image URL).
  - Target audience selector: `Academic & Students`, `Corporate Executive`, `Technical & Engineering`, `Medical & Healthcare`.
  - Flashcard yield slider (4 to 20 cards).
  - Summary depth selector: `Executive Overview`, `Standard Synthesis`, `In-Depth Mastery`.
- **Dual Synthesis Routing**:
  - Server `/api/generate` route calling `gemini-3.8-flash` with structured JSON schema.
  - Client-side heuristic parser (`clientSynthesis.ts`) that guarantees flawless instant fallback.
- **Output Schema**:
  - `title`, `executiveBrief` (BLUF - Bottom Line Up Front), `keyTakeaways` (5 bullet points), `coreConcepts` (terms + definitions + real-world applications), `cheatSheet` (fact/formula table), `actionItems` (actionable checkpoints with completion checkboxes), and `flashcards`.

#### 3. 3D LEITNER SPACED-REPETITION FLASHCARDS (`FlashcardStudyMode.tsx`)
- **Interactive 3D Flip Card**:
  - Front: Category, difficulty badge, optional visual diagram, core prompt question, "Show Hint" (mnemonic anchor), source attribution citation.
  - Back: Answer verification, mnemonic anchor ("Memory Anchor"), verbatim source quotation.
  - Flip animation using CSS 3D transforms (`perspective-1000`, `rotate-y-180`, `backface-hidden`).
- **Toolbar & Card Controls**:
  - **Prominent Shuffle Button**: Randomizes card sequence for the session using Fisher-Yates shuffle with responsive label (`Shuffle Cards` / `Reshuffle`), active styling, and a `Reset` order button to return to progressive sequence.
  - **Text-to-Speech (TTS)**: Web Speech API integration with speaker icon and pulsing indicator.
  - **Star / Flag**: Star difficult cards for targeted review.
- **SM-2 Interval Rating Buttons** (Revealed on card flip):
  - `[1] Again` (< 4h, resets to Box 1)
  - `[2] Hard` (1 day, keeps in Box 1/2)
  - `[3] Good` (3 days, advances +1 Box)
  - `[4] Easy` (7 days, advances +2 Boxes)
- **Keyboard Shortcuts**:
  - `Space` / `Enter` = Flip card
  - `Left` / `Right` Arrow = Previous / Skip card
  - `S` = Shuffle cards
  - `1`, `2`, `3`, `4` = Rate recall when flipped
- **Completion Screen**:
  - Overall Mastery Score percentage.
  - Retained cards vs. Needs Practice breakdown.
  - Actions: `Practice Difficult Cards`, `Review All Cards`, `Shuffle & Practice`, and `Take Quiz Challenge`.

#### 4. VISUAL PROGRESS TRACKING & MASTERY CURVE (`DeckMasteryChart.tsx`)
- Mounted prominently inside `SummaryViewer.tsx` directly above the Executive Brief.
- **Radial Donut Mastery Gauge**: SVG circular gauge displaying overall weighted mastery score (60% weight on latest quiz + 40% on personal best).
- **Chronological Retention Graph**:
  - High-resolution SVG area trend line showing score trajectory over successive sessions.
  - Dashed green 80% Benchmark Recall Threshold line.
  - Interactive attempt dots (`#1`, `#2`, `#3`, ...) with hover tooltips showing score and date.
- **Metric Tiles**: Latest Score, Personal Best, Average Score, and Total Sessions.
- **Leitner Spaced-Repetition Distribution Bar**: Segmented color-coded stacked bar displaying flashcard distribution across Boxes 1 through 5 (Box 1 Daily to Box 5 30-day Mastered).
- **Direct Quiz CTA**: "Retake Quiz Challenge" button with instant reactive event updates (`ar_quiz_progress_updated`).

#### 5. ACTIVE RECALL QUIZ MODE (`QuizMode.tsx`)
- Auto-generates 4-option multiple-choice questions with intelligent distractor options drawn from the deck's other flashcard answers.
- Shows real-time progress, option selection, immediate correct/incorrect color styling with explanatory answer context.
- Results screen with accuracy percentage, passed/retry status, and automated record sync into `quizProgressService.ts`.

#### 6. AUDIO TRANSCRIPTION WITH GEMINI (`AudioTranscriberModal.tsx`)
- Uses official `@google/genai` model: `gemini-3.5-transcribe` via backend endpoint `POST /api/transcribe`.
- **Live Microphone Recording**:
  - Pulsing record badge, live timer (`0:00`), cancel button, and stop-and-transcribe.
  - Graceful permission handling: catches `NotAllowedError` without throwing console errors, displays friendly guidance, and provides "Upload Audio File" or "Load Sample Audio Note" fallbacks.
- **Audio File Upload**: Supports `.mp3`, `.wav`, `.m4a`, `.webm`, `.ogg`.
- **Insert Action**: Pastes verbatim transcription directly into the AI Generator or Document Extractor with one click.

#### 7. MULTI-FORMAT DOCUMENT TEXT EXTRACTOR (`DocumentTextExtractor.tsx`)
- File drag-and-drop parsing for `.txt`, `.md`, `.json`, `.csv`, `.pdf`, `.html`, `.rtf`.
- Text normalizer and control character cleaner (`fileExtractorService.ts`).
- File analysis metrics: word count, character count, line count, and ready-for-synthesis validation.
- "Dictate or Transcribe Audio (Gemini 3.5)" quick launcher inside the dropzone.
- Pre-loaded sample files and one-click "Send to AI Generator & Create Flashcards".

#### 8. STUDY DECKS MANAGEMENT (`DeckList.tsx`)
- Grid of saved and sample decks with search bar filtering by title, brief, and tags.
- Track filtering tabs: `All Tracks`, `Academic`, `Executive`, `Technical`, `Medical`.
- Retention mastery mini-progress bar for each card.
- Actions: Open Summary, Launch Quiz, Launch 3D Flashcards, Delete Deck.
- Robust unique composite keying (`deck-${deck.id}-${index}`) preventing React duplicate key warnings.

#### 9. EXPORT CAPABILITIES (`ExportModal.tsx`)
- Export formatted study decks to:
  - **Markdown Document** (BLUF, Key Points, Concepts, Flashcard Tables)
  - **Anki TSV Format** (Question, Answer, Tags tab-separated for direct Anki import)
  - **JSON Data** (Full structured document payload)

#### 10. ENTERPRISE & FOUNDER OVERVIEW (`EnterpriseView.tsx`)
- Executive Leadership section dedicated to **Abdul Rahman**, Founder & Chief Architect.
- Infrastructure showcase featuring high-fidelity architectural campus imagery, neural supercomputing datacenter, cognitive learning science laboratory, and executive summit boardroom.
- Key enterprise metrics: 2.4M+ Scholars & Executives, 4.8x Retention Multiplier, 99.98% Enterprise Uptime SLA, 140+ Sovereign Jurisdictions.

#### 11. EMBEDDED AI STUDY CHATBOT (`GeminiChatbot.tsx`)
- Floating drawer assistant ("AR AI Assistant") powered by `gemini-3.8-flash` (with heuristic fallback).
- Context-aware Q&A based on the currently selected study deck.
```
