import React, { useState, useRef } from 'react';
import { extractTextFromFile, cleanExtractedText, ExtractedFileResult } from '../utils/fileExtractorService';
import {
  Upload,
  FileText,
  Copy,
  Check,
  Download,
  Sparkles,
  RotateCw,
  ArrowRight,
  BookOpen,
  FileCode,
  Trash2,
  Filter,
} from 'lucide-react';

interface DocumentTextExtractorProps {
  onSendToGenerator: (
    extractedText: string,
    sourceInfo?: { title?: string; author?: string; citation?: string }
  ) => void;
}

const SAMPLE_FILES = [
  {
    label: 'Distributed Systems (.txt)',
    name: 'Designing_Data_Intensive_Systems.txt',
    author: 'Martin Kleppmann',
    citation: 'Chapters 7–9 (Consensus & CAP)',
    text: `Distributed systems require balancing consistency, availability, and partition tolerance as formulated by Eric Brewer's CAP theorem. In any asynchronous network subject to packet loss and latency spikes, network partitions are an inevitability. Consequently, system architects must deliberately choose whether a partition event forces the system to prioritize Consistency (CP)—rejecting writes or stalling reads until consensus is verified—or Availability (AP)—serving potentially stale reads and accepting concurrent writes that must later be merged via Conflict-Free Replicated Data Types (CRDTs) or Last-Write-Wins. Daniel Abadi's PACELC theorem extends this: even when the network is operating normally (Else), a system must continually trade off latency (L) against consistency (C). Furthermore, consensus algorithms such as Raft and Multi-Paxos establish authoritative leader terms through majority quorums (Q = floor(N/2) + 1). In production distributed transactions, Two-Phase Commit (2PC) guarantees serializability across heterogeneous databases but introduces a catastrophic blocking vulnerability if the transaction coordinator fails mid-prepare. For this reason, modern architectures prefer asynchronous event choreography backed by idempotent message consumers and dead-letter queues.`,
  },
  {
    label: 'Corporate Valuation (.md)',
    name: 'Corporate_Valuation_DCF.md',
    author: 'Prof. Aswath Damodaran',
    citation: 'NYU Stern Corporate Finance',
    text: `# Enterprise Valuation & DCF Framework

Enterprise Value (EV) measures the entire economic operating value of an enterprise regardless of its financing structure, defined mathematically as:
- Market Capitalization
- plus Total Debt
- plus Preferred Equity and Minority Interest
- minus unrestricted Cash & Cash Equivalents

Discounted Cash Flow (DCF) models project Unlevered Free Cash Flows (UFCF)—cash generated purely from operations after capital expenditures and changes in net working capital, independent of interest expense—and discount them back to present value using the Weighted Average Cost of Capital (WACC). Because terminal value frequently accounts for 65% to 80% of a company's calculated DCF value, practitioners cross-validate perpetual growth assumptions (the Gordon Growth Model, capped at long-term GDP rates of 2-3%) against exit EBITDA multiple benchmarks. In buy-side due diligence, a Quality of Earnings (QoE) audit is paramount to normalize reported EBITDA by stripping out non-recurring windfalls, related-party transactions, and deferred maintenance costs.`,
  },
  {
    label: 'Autonomic Pharmacology (.txt)',
    name: 'Autonomic_Pharmacology_Signaling.txt',
    author: 'Laurence Brunton et al.',
    citation: 'Section II: Autonomic Signaling',
    text: `The Autonomic Nervous System maintains homeostatic equilibrium via sympathetic (thoracolumbar) and parasympathetic (craniosacral) divisions. Sympathetic preganglionic neurons release acetylcholine onto nicotinic receptors, whereas postganglionic fibers release norepinephrine onto alpha and beta adrenoreceptors. Alpha-1 adrenergic receptors couple to Gq proteins, activating phospholipase C to generate IP3 and DAG, which mobilizes intracellular calcium causing vascular smooth muscle constriction, pupillary dilation (mydriasis), and urinary sphincter contraction. Beta-1 receptors couple to Gs proteins, stimulating adenylyl cyclase and increasing cyclic AMP in cardiomyocytes, directly increasing heart rate (positive chronotropy) and contractility (positive inotropy). Beta-2 receptors also signal via Gs in bronchial and vascular smooth muscle, producing bronchodilation and skeletal muscle vasodilation. In toxicological emergencies, organophosphate chemical warfare agents and insecticides irreversibly phosphorylate acetylcholinesterase, producing massive cholinergic hyperstimulation manifested by SLUDGE (Salivation, Lacrimation, Urination, Defecation, GI cramping, Emesis) and DUMBELS. Immediate treatment entails intravenous atropine to block muscarinic receptors and pralidoxime (2-PAM) to reactivate the enzyme before chemical aging occurs.`,
  },
];

export const DocumentTextExtractor: React.FC<DocumentTextExtractorProps> = ({
  onSendToGenerator,
}) => {
  const [extractedText, setExtractedText] = useState<string>('');
  const [activeFileName, setActiveFileName] = useState<string>('');
  const [activeFileSize, setActiveFileSize] = useState<number>(0);
  const [activeFileType, setActiveFileType] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);

  // Source attribution fields
  const [sourceTitle, setSourceTitle] = useState<string>('');
  const [sourceAuthor, setSourceAuthor] = useState<string>('');
  const [sourceCitation, setSourceCitation] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const wordCount = extractedText.trim() ? extractedText.trim().split(/\s+/).length : 0;
  const charCount = extractedText.length;
  const lineCount = extractedText ? extractedText.split('\n').length : 0;

  const handleProcessFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const result: ExtractedFileResult = await extractTextFromFile(file);
      setExtractedText(result.text);
      setActiveFileName(result.fileName);
      setActiveFileSize(result.fileSize);
      setActiveFileType(result.detectedType);
      
      // Auto-populate source title from file name
      const cleanTitle = result.fileName
        .replace(/\.[^/.]+$/, '')
        .replace(/[_-]+/g, ' ')
        .trim();
      setSourceTitle(cleanTitle);
    } catch (err: any) {
      console.error('File extraction error:', err);
      alert('Could not extract text from this file. Please ensure it is a valid text, markdown, or PDF document.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleApplySample = (sample: typeof SAMPLE_FILES[0]) => {
    setExtractedText(sample.text);
    setActiveFileName(sample.name);
    setActiveFileSize(new Blob([sample.text]).size);
    setActiveFileType('TXT');
    setSourceTitle(sample.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' '));
    setSourceAuthor(sample.author);
    setSourceCitation(sample.citation);
  };

  const handleCleanWhitespace = () => {
    setExtractedText((prev) => cleanExtractedText(prev));
  };

  const handleCopyToClipboard = async () => {
    if (!extractedText) return;
    try {
      await navigator.clipboard.writeText(extractedText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleDownloadText = () => {
    if (!extractedText) return;
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeFileName ? `extracted_${activeFileName.replace(/\.[^/.]+$/, '')}.txt` : 'extracted_text.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClearAll = () => {
    setExtractedText('');
    setActiveFileName('');
    setActiveFileSize(0);
    setActiveFileType('');
    setSourceTitle('');
    setSourceAuthor('');
    setSourceCitation('');
  };

  const handleSendToAi = () => {
    if (!extractedText.trim()) return;
    onSendToGenerator(
      extractedText,
      sourceTitle.trim()
        ? {
            title: sourceTitle.trim(),
            author: sourceAuthor.trim() || undefined,
            citation: sourceCitation.trim() || undefined,
          }
        : undefined
    );
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-3">
          <FileText className="w-3.5 h-3.5" />
          <span>Universal Document &amp; File Text Extractor</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display">
          Extract Clean Text from Documents
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Upload notes, articles, research papers, and textbook exports (.txt, .md, .pdf, .json, .csv) to extract clean plain text ready for cognitive synthesis.
        </p>
      </div>

      {/* Preset Sample Documents */}
      <div className="mb-6 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
        <div className="flex items-center justify-between gap-4 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Quick-Load Sample Files
          </span>
          <span className="text-xs text-slate-400">Click to preview file extraction</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_FILES.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplySample(sample)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-500 hover:text-indigo-600 transition-colors shadow-2xs whitespace-nowrap"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Two-Column or Stacked Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload Zone & Document Specs */}
        <div className="lg:col-span-5 space-y-4">
          {/* Drag & Drop Upload Card */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
              dragOver
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 scale-[1.01]'
                : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-white dark:bg-slate-900 shadow-xs'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.markdown,.json,.csv,.tsv,.pdf,.html,.rtf"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Upload Study Document or File
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
              Drag &amp; drop your file here, or browse files from your computer
            </p>
            <div className="mt-3 flex items-center justify-center gap-1.5 flex-wrap">
              {['.TXT', '.MD', '.PDF', '.JSON', '.CSV'].map((ext) => (
                <span
                  key={ext}
                  className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                >
                  {ext}
                </span>
              ))}
            </div>
          </div>

          {/* Source Attribution Inputs */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>Source Attribution (Optional)</span>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Document / Book Title
              </label>
              <input
                type="text"
                value={sourceTitle}
                onChange={(e) => setSourceTitle(e.target.value)}
                placeholder="e.g. Distributed Systems Architecture"
                className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Author / Organization
                </label>
                <input
                  type="text"
                  value={sourceAuthor}
                  onChange={(e) => setSourceAuthor(e.target.value)}
                  placeholder="e.g. Martin Kleppmann"
                  className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Chapter / Page
                </label>
                <input
                  type="text"
                  value={sourceCitation}
                  onChange={(e) => setSourceCitation(e.target.value)}
                  placeholder="e.g. Chapter 7, pp. 120-135"
                  className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* File Meta Pill */}
          {activeFileName && (
            <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20 text-xs space-y-1">
              <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                <span className="truncate">{activeFileName}</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 shrink-0">
                  {activeFileType}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span>{(activeFileSize / 1024).toFixed(1)} KB</span>
                <span aria-hidden="true">·</span>
                <span>{wordCount.toLocaleString()} words</span>
                <span aria-hidden="true">·</span>
                <span>{lineCount} lines</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Extracted Text Editor & Actions */}
        <div className="lg:col-span-7 flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Extracted Text Workspace
              </span>
            </div>

            <div className="flex items-center gap-2">
              {extractedText && (
                <>
                  <button
                    type="button"
                    onClick={handleCleanWhitespace}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-colors flex items-center gap-1"
                    title="Clean excessive whitespace and empty lines"
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span>Clean Text</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyToClipboard}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-colors flex items-center gap-1"
                    title="Copy extracted text to clipboard"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadText}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-colors flex items-center gap-1"
                    title="Download extracted text as .txt"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                    title="Clear extracted text"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Textarea */}
          <div className="relative flex-1 min-h-[320px]">
            <textarea
              value={extractedText}
              onChange={(e) => setExtractedText(e.target.value)}
              placeholder="Your extracted file text will appear here. You can also paste notes or lecture text directly..."
              className="w-full h-full min-h-[320px] p-4 text-xs sm:text-sm font-sans text-slate-800 dark:text-slate-200 bg-slate-50/70 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-normal leading-relaxed resize-y"
            />
          </div>

          {/* Stats Bar */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-3">
              <span>{wordCount.toLocaleString()} words</span>
              <span aria-hidden="true">·</span>
              <span>{charCount.toLocaleString()} characters</span>
              <span aria-hidden="true">·</span>
              <span>{lineCount} lines</span>
            </div>

            {wordCount >= 10 && (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                ✓ Ready for synthesis
              </span>
            )}
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            disabled={wordCount < 10 || isProcessing}
            onClick={handleSendToAi}
            className="w-full py-3.5 px-6 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Send to AI Generator &amp; Create Flashcards</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
