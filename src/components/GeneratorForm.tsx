import React, { useState } from 'react';
import { TargetAudience, SummaryDepth, SummaryDocument } from '../types/index';
import { Sparkles, FileText, Upload, RefreshCw, BookOpen, Layers, CheckCircle2 } from 'lucide-react';

interface GeneratorFormProps {
  onGenerated: (doc: SummaryDocument) => void;
  onSelectSampleDeck: (deckId: string) => void;
}

const PRESET_SNIPPETS = [
  {
    label: 'Distributed Systems',
    audience: 'technical' as TargetAudience,
    text: `Distributed systems require balancing consistency, availability, and partition tolerance as formulated by Eric Brewer's CAP theorem. In any asynchronous network subject to packet loss and latency spikes, network partitions are an inevitability. Consequently, system architects must deliberately choose whether a partition event forces the system to prioritize Consistency (CP)—rejecting writes or stalling reads until consensus is verified—or Availability (AP)—serving potentially stale reads and accepting concurrent writes that must later be merged via Conflict-Free Replicated Data Types (CRDTs) or Last-Write-Wins. Daniel Abadi's PACELC theorem extends this: even when the network is operating normally (Else), a system must continually trade off latency (L) against consistency (C). Furthermore, consensus algorithms such as Raft and Multi-Paxos establish authoritative leader terms through majority quorums (Q = floor(N/2) + 1). In production distributed transactions, Two-Phase Commit (2PC) guarantees serializability across heterogeneous databases but introduces a catastrophic blocking vulnerability if the transaction coordinator fails mid-prepare. For this reason, modern architectures prefer asynchronous event choreography backed by idempotent message consumers and dead-letter queues.`,
  },
  {
    label: 'Corporate Valuation',
    audience: 'executive' as TargetAudience,
    text: `Enterprise Valuation forms the bedrock of strategic M&A and capital allocation. Enterprise Value (EV) measures the entire economic operating value of an enterprise regardless of its financing structure, defined mathematically as Market Capitalization plus Total Debt, Preferred Equity, and Minority Interest, minus unrestricted Cash & Cash Equivalents. Discounted Cash Flow (DCF) models project Unlevered Free Cash Flows (UFCF)—cash generated purely from operations after capital expenditures and changes in net working capital, independent of interest expense—and discount them back to present value using the Weighted Average Cost of Capital (WACC). Because terminal value frequently accounts for 65% to 80% of a company's calculated DCF value, practitioners cross-validate perpetual growth assumptions (the Gordon Growth Model, capped at long-term GDP rates of 2-3%) against exit EBITDA multiple benchmarks. In buy-side due diligence, a Quality of Earnings (QoE) audit is paramount to normalize reported EBITDA by stripping out non-recurring windfalls, related-party transactions, and deferred maintenance costs.`,
  },
  {
    label: 'Autonomic Pharmacology',
    audience: 'medical' as TargetAudience,
    text: `The Autonomic Nervous System maintains homeostatic equilibrium via sympathetic (thoracolumbar) and parasympathetic (craniosacral) divisions. Sympathetic preganglionic neurons release acetylcholine onto nicotinic receptors, whereas postganglionic fibers release norepinephrine onto alpha and beta adrenoreceptors. Alpha-1 adrenergic receptors couple to Gq proteins, activating phospholipase C to generate IP3 and DAG, which mobilizes intracellular calcium causing vascular smooth muscle constriction, pupillary dilation (mydriasis), and urinary sphincter contraction. Beta-1 receptors couple to Gs proteins, stimulating adenylyl cyclase and increasing cyclic AMP in cardiomyocytes, directly increasing heart rate (positive chronotropy) and contractility (positive inotropy). Beta-2 receptors also signal via Gs in bronchial and vascular smooth muscle, producing bronchodilation and skeletal muscle vasodilation. In toxicological emergencies, organophosphate chemical warfare agents and insecticides irreversibly phosphorylate acetylcholinesterase, producing massive cholinergic hyperstimulation manifested by SLUDGE (Salivation, Lacrimation, Urination, Defecation, GI cramping, Emesis) and DUMBELS. Immediate treatment entails intravenous atropine to block muscarinic receptors and pralidoxime (2-PAM) to reactivate the enzyme before chemical aging occurs.`,
  },
  {
    label: 'Machine Learning Transformers',
    audience: 'technical' as TargetAudience,
    text: `The Transformer architecture, introduced by Vaswani et al. in "Attention Is All You Need", replaced recurrent and convolutional sequence processing with multi-head self-attention mechanisms. Unlike RNNs whose sequential computation creates an O(N) training bottleneck that impairs GPU parallelization, Transformers process entire sequences simultaneously. The core Scaled Dot-Product Attention computes softmax((Q * K^T) / sqrt(d_k)) * V, where queries, keys, and values are linear projections of input embeddings. Scaling by the square root of key dimension d_k prevents dot products from growing excessively large in high dimensions, which would push softmax gradients into vanishingly small regions. Positional encodings (sinusoidal functions or learnable rotary embeddings) are injected into input embeddings because self-attention operations are inherently permutation invariant. Pre-Layer Normalization (Pre-LN) and residual connections stabilize gradient backpropagation across dozens of decoder layers, enabling scaling laws where cross-entropy loss predictably drops as parameters, dataset tokens, and compute FLOPs expand.`,
  },
];

export const GeneratorForm: React.FC<GeneratorFormProps> = ({
  onGenerated,
  onSelectSampleDeck,
}) => {
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState<TargetAudience>('academic');
  const [cardCount, setCardCount] = useState<number>(8);
  const [depth, setDepth] = useState<SummaryDepth>('standard');
  const [customFocus, setCustomFocus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setContent(text);
        setError(null);
      }
    };
    reader.readAsText(file);
  };

  const handleApplyPreset = (preset: typeof PRESET_SNIPPETS[0]) => {
    setContent(preset.text);
    setTargetAudience(preset.audience);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || wordCount < 10) {
      setError('Please provide at least 15 words of text or select a sample topic below.');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Step progress indicators for high-confidence UI feel
    setLoadingStep('Ingesting source material & synthesizing core themes...');
    const stepTimer1 = setTimeout(() => {
      setLoadingStep('Distilling executive brief & structuring key takeaways...');
    }, 1500);
    const stepTimer2 = setTimeout(() => {
      setLoadingStep('Crafting active recall flashcards & memory anchors...');
    }, 3200);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          targetAudience,
          cardCount,
          depth,
          customFocus: customFocus.trim() || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error(`Generation error (${res.status})`);
      }

      const data = await res.json();
      onGenerated(data);
    } catch (err: any) {
      console.error('Generation error:', err);
      setError('Failed to generate summary and flashcards. Please check your text or try again.');
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Title & Introduction */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display">
          Retain Critical Information in Minutes
        </h1>
        <p className="mt-2.5 text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Transform notes, textbook chapters, legal briefs, and technical whitepapers into executive summaries and active-recall flashcard decks.
        </p>
      </div>

      {/* Preset topic quick picks */}
      <div className="mb-6 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
        <div className="flex items-center justify-between gap-4 mb-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Quick-Load Sample Documents
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500">Click to autofill text</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_SNIPPETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-2xs whitespace-nowrap"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main input form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <label htmlFor="source-text" className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Source Material (Lecture notes, whitepapers, memos, articles)</span>
            </label>

            <div className="flex items-center gap-3">
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload .txt/.md</span>
                <input
                  id="file-upload"
                  type="file"
                  accept=".txt,.md,.json"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
              </label>

              {content && (
                <button
                  type="button"
                  onClick={() => setContent('')}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <textarea
            id="source-text"
            rows={10}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste your study materials, research paper excerpt, compliance regulation, or executive briefing here..."
            className="w-full p-4 text-sm text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400 font-sans resize-y"
          />

          <div className="flex items-center justify-between mt-2.5 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-3">
              <span>{wordCount.toLocaleString()} words</span>
              <span aria-hidden="true">·</span>
              <span>{charCount.toLocaleString()} characters</span>
              {wordCount > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>~{Math.max(1, Math.round(wordCount / 200))} min read</span>
                </>
              )}
            </div>
            {wordCount > 0 && wordCount < 15 && (
              <span className="text-amber-600 dark:text-amber-400">Aim for at least 15 words for optimal synthesis</span>
            )}
          </div>
        </div>

        {/* Configuration settings grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Target Audience */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <label htmlFor="target-audience" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Target Audience
            </label>
            <select
              id="target-audience"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value as TargetAudience)}
              className="w-full p-2.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="academic">Academic & Students (Concept clarity)</option>
              <option value="executive">Corporate Executive (BLUF & ROI)</option>
              <option value="technical">Technical & Engineering (Architecture)</option>
              <option value="medical">Medical & Healthcare (Clinical yield)</option>
            </select>
          </div>

          {/* Flashcard Count */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="card-count" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Flashcard Yield
              </label>
              <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {cardCount} cards
              </span>
            </div>
            <input
              id="card-count"
              type="range"
              min={4}
              max={20}
              step={2}
              value={cardCount}
              onChange={(e) => setCardCount(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>Quick (4)</span>
              <span>Balanced (10)</span>
              <span>Comprehensive (20)</span>
            </div>
          </div>

          {/* Depth Mode */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <label htmlFor="summary-depth" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Summary Depth
            </label>
            <select
              id="summary-depth"
              value={depth}
              onChange={(e) => setDepth(e.target.value as SummaryDepth)}
              className="w-full p-2.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="overview">Executive Overview (High-level)</option>
              <option value="standard">Standard Synthesis (Balanced)</option>
              <option value="deep">In-Depth Mastery (Exhaustive)</option>
            </select>
          </div>
        </div>

        {/* Optional Custom Focus */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <label htmlFor="custom-focus" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Custom Study Focus or Exam Objectives <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <input
            id="custom-focus"
            type="text"
            value={customFocus}
            onChange={(e) => setCustomFocus(e.target.value)}
            placeholder="e.g. Focus on high-frequency board exam questions, or emphasize risk factors and edge cases..."
            className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || wordCount < 5}
          className="w-full py-3.5 px-6 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>{loadingStep || 'Generating Synthesis & Flashcards...'}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate Professional Summary & Flashcards</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
