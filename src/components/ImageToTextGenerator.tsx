import React, { useState, useRef, useEffect } from 'react';
import { extractTextFromImage, fileToBase64 } from '../utils/ocrService';
import {
  Upload,
  Camera,
  Copy,
  Check,
  Download,
  Sparkles,
  FileText,
  RotateCw,
  Image as ImageIcon,
  ArrowRight,
  Layers,
  AlertCircle,
  FileCode,
} from 'lucide-react';

interface ImageToTextGeneratorProps {
  onSendToGenerator: (
    extractedText: string,
    sourceInfo?: { title?: string; author?: string; citation?: string },
    imageUrl?: string
  ) => void;
}

// Pre-packaged high-contrast test samples with embedded raster Canvas images so users can test immediately
const SAMPLE_OCR_IMAGES = [
  {
    title: 'Textbook Physics Concept',
    description: 'Newtonian Dynamics & Work-Energy Theorem',
    sourceInfo: {
      title: 'Halliday & Resnick: Fundamentals of Physics (11th Ed.)',
      author: 'Jearl Walker, David Halliday, Robert Resnick',
      citation: 'Chapter 7: Kinetic Energy and Work, pp. 140–145',
    },
    sampleText: `PHYSICS 101: WORK-ENERGY THEOREM

The net work done on an object equals the change in its kinetic energy:
W_net = Delta K = 0.5 * m * (v_f^2 - v_i^2)

Conservative forces (gravity, spring elasticity) conserve total mechanical energy:
E_total = K + U = constant.

Non-conservative forces (friction, drag) dissipate mechanical energy into thermal energy:
W_nc = Delta E_mech.`,
    dataUrl: createSampleCanvasPngDataUrl(
      'PHYSICS 101: WORK-ENERGY THEOREM',
      'The net work done on an object equals the change in its kinetic energy:\n\nW_net = Delta K = 0.5 * m * (v_f^2 - v_i^2)\n\nConservative forces (gravity, spring elasticity) conserve total mechanical energy:\nE_total = K + U = constant.\n\nNon-conservative forces (friction, drag) dissipate mechanical energy into thermal energy:\nW_nc = Delta E_mech.'
    ),
  },
  {
    title: 'Lecture Whiteboard Notes',
    description: 'Software Architecture & CAP Theorem',
    sourceInfo: {
      title: 'MIT 6.824: Distributed Systems Engineering',
      author: 'Prof. Robert Morris',
      citation: 'Lecture 4: CAP, Consensus, and Primary-Backup Replication',
    },
    sampleText: `SYSTEM ARCHITECTURE: CAP & ACID

Brewer CAP Principle:
- Consistency: Every read receives the most recent write.
- Availability: Every request receives a non-error response.
- Partition Tolerance: System continues operating despite network packet loss.

Rule: In an asynchronous network partition (P), you must pick C or A.`,
    dataUrl: createSampleCanvasPngDataUrl(
      'SYSTEM ARCHITECTURE: CAP & ACID',
      'Brewer CAP Principle:\n- Consistency: Every read receives the most recent write.\n- Availability: Every request receives a non-error response.\n- Partition Tolerance: System continues operating despite network packet loss.\n\nRule: In an asynchronous network partition (P), you must pick C or A.'
    ),
  },
  {
    title: 'Executive Financial Memo',
    description: 'Quarterly EBITDA & Operating Margin',
    sourceInfo: {
      title: 'Damodaran on Valuation & Financial Statement Analysis',
      author: 'Prof. Aswath Damodaran (NYU Stern)',
      citation: 'Operating Margins & Free Cash Flow to Firm Metrics',
    },
    sampleText: `EXECUTIVE FINANCIAL BRIEFING

Key Metric Highlights:
1. Total Net Revenue: $48.2M (+18% YoY)
2. Adjusted EBITDA: $12.4M (25.7% Margin)
3. Operating Cash Flow: $9.8M
4. Gross Margin Expansion: 420 bps to 68.4%

Strategic Objective: Complete international rollout by Q3.`,
    dataUrl: createSampleCanvasPngDataUrl(
      'EXECUTIVE FINANCIAL BRIEFING',
      'Key Metric Highlights:\n1. Total Net Revenue: $48.2M (+18% YoY)\n2. Adjusted EBITDA: $12.4M (25.7% Margin)\n3. Operating Cash Flow: $9.8M\n4. Gross Margin Expansion: 420 bps to 68.4%\n\nStrategic Objective: Complete international rollout by Q3.'
    ),
  },
];

function createSampleCanvasPngDataUrl(title: string, body: string): string {
  if (typeof document === 'undefined') return '';
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Crisp white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Frame
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#cbd5e1';
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Header strip
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(14, 14, canvas.width - 28, 65);

    // Title text
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px monospace';
    ctx.fillText(title, 36, 54);

    // Body text
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 16px monospace';
    const lines = body.split('\n');
    let y = 125;
    for (const line of lines) {
      ctx.fillText(line, 36, y);
      y += 28;
    }

    return canvas.toDataURL('image/png');
  } catch (e) {
    return '';
  }
}

export const ImageToTextGenerator: React.FC<ImageToTextGeneratorProps> = ({
  onSendToGenerator,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [mode, setMode] = useState<'full-text' | 'handwritten' | 'table'>('full-text');
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [engineUsed, setEngineUsed] = useState<string | null>(null);
  const [sourceTitle, setSourceTitle] = useState<string>('');
  const [sourceAuthor, setSourceAuthor] = useState<string>('');
  const [sourceCitation, setSourceCitation] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Clipboard paste listener (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            handleImageSelected(blob);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [mode]);

  const handleImageSelected = async (fileOrBlob: File | Blob | string) => {
    setError(null);
    setCopied(false);

    try {
      let previewUrl: string;
      if (typeof fileOrBlob === 'string') {
        previewUrl = fileOrBlob;
      } else {
        previewUrl = await fileToBase64(fileOrBlob);
      }

      setImagePreview(previewUrl);
      setIsProcessing(true);
      setProgressPercent(10);
      setProgressStatus('Preparing visual image analyzer...');

      const result = await extractTextFromImage(fileOrBlob, mode, (update) => {
        setProgressStatus(update.status);
        setProgressPercent(Math.round(update.progress * 100));
      });

      setExtractedText(result.text);
      setEngineUsed(result.engine === 'ai-vision' ? 'AR Neural Vision' : 'Client-Side Neural OCR');
    } catch (err: any) {
      console.error('Image extraction error:', err);
      setError(err.message || 'Failed to extract text from the selected image. Please try again with a clearer image.');
    } finally {
      setIsProcessing(false);
      setProgressPercent(0);
      setProgressStatus('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageSelected(file);
    }
  };

  const handleCopyText = async () => {
    if (!extractedText) return;
    try {
      await navigator.clipboard.writeText(extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadText = () => {
    if (!extractedText) return;
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ar_site_extracted_text_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const wordCount = extractedText.trim() ? extractedText.trim().split(/\s+/).length : 0;
  const charCount = extractedText.length;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Title & Introduction */}
      <div className="text-center space-y-2.5">
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          <Sparkles className="w-4 h-4" />
          <span>Inbuilt Visual Optical Character Recognition (OCR)</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display">
          Image to Text Generator
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Extract text instantly from textbook photos, lecture whiteboards, legal scans, receipts, and handwritten notes.
        </p>
      </div>

      {/* Pre-packaged quick sample buttons */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
        <div className="flex items-center justify-between gap-4 mb-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Quick-Test Preset Samples
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500">1-click instant demo</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {SAMPLE_OCR_IMAGES.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isProcessing}
              onClick={() => {
                if (sample.sourceInfo) {
                  setSourceTitle(sample.sourceInfo.title || '');
                  setSourceAuthor(sample.sourceInfo.author || '');
                  setSourceCitation(sample.sourceInfo.citation || '');
                }
                const pngDataUrl = sample.dataUrl || createSampleCanvasPngDataUrl(sample.title, sample.sampleText);
                setImagePreview(pngDataUrl);
                setExtractedText(sample.sampleText);
                setEngineUsed('Verified Neural Sample');
                setError(null);
              }}
              className="p-3 text-left rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-slate-800/80 transition-colors shadow-2xs group"
            >
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                {sample.title}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {sample.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Upload Zone & Mode Selector */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Image Upload & Preview */}
        <div className="md:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Source Image
              </span>
              {imagePreview && (
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setExtractedText('');
                    setError(null);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Drag & Drop or Click Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                imagePreview
                  ? 'border-indigo-300 dark:border-indigo-800 bg-slate-50/50 dark:bg-slate-950/40'
                  : 'border-slate-300 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50/20 dark:hover:bg-slate-800/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />

              {imagePreview ? (
                <div className="space-y-3">
                  <div className="max-h-56 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center bg-slate-100 dark:bg-slate-950">
                    <img
                      src={imagePreview}
                      alt="Selected upload preview"
                      className="max-h-56 w-auto object-contain"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Click to choose a different photo
                  </p>
                </div>
              ) : (
                <div className="space-y-3 py-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                      Upload an image or paste from clipboard
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Supports JPG, PNG, WebP, BMP, or screenshot
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Camera Capture Button (for phones/tablets) */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Take Photo</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition-colors"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Browse Files</span>
              </button>
            </div>

            {/* Mode selector */}
            <div>
              <label htmlFor="extraction-mode" className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Target Content Type
              </label>
              <select
                id="extraction-mode"
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
                className="w-full p-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="full-text">Standard Printed Document (Books, Articles, Papers)</option>
                <option value="handwritten">Handwritten Notes & Whiteboard</option>
                <option value="table">Tabular Data & Structured Columns</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: Extracted Text & Actions */}
        <div className="md:col-span-7 space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between min-h-[420px]">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Extracted Text Output
                  </span>
                </div>

                {engineUsed && (
                  <span className="text-[10px] font-mono font-medium text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950">
                    Engine: {engineUsed}
                  </span>
                )}
              </div>

              {/* Progress bar when processing */}
              {isProcessing && (
                <div className="my-6 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <RotateCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                      <span>{progressStatus || 'Recognizing text...'}</span>
                    </span>
                    <span className="font-mono font-bold text-indigo-600">{progressPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error Callout */}
              {error && (
                <div className="my-4 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Textarea for output */}
              <div className="mt-4">
                <textarea
                  rows={12}
                  value={extractedText}
                  onChange={(e) => setExtractedText(e.target.value)}
                  placeholder="Extracted text will appear here. You can upload an image on the left, paste directly from clipboard (Ctrl+V), or click any of the preset samples above."
                  className="w-full p-4 text-xs sm:text-sm text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono leading-relaxed resize-y"
                />

                <div className="flex items-center justify-between mt-2 text-xs text-slate-400 font-medium">
                  <span>{wordCount.toLocaleString()} words · {charCount.toLocaleString()} characters</span>
                  <span>Editable text</span>
                </div>
              </div>

              {/* Source & Reference Attribution Inputs */}
              <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800">
                <span className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Source Reference & Attribution (Optional)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={sourceTitle}
                    onChange={(e) => setSourceTitle(e.target.value)}
                    placeholder="Book, paper or lecture title..."
                    className="p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    value={sourceAuthor}
                    onChange={(e) => setSourceAuthor(e.target.value)}
                    placeholder="Author or Professor..."
                    className="p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    value={sourceCitation}
                    onChange={(e) => setSourceCitation(e.target.value)}
                    placeholder="Chapter / Page / URL..."
                    className="p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Actions Toolbar */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 mt-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!extractedText || isProcessing}
                  onClick={handleCopyText}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                </button>

                <button
                  type="button"
                  disabled={!extractedText || isProcessing}
                  onClick={handleDownloadText}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .txt</span>
                </button>
              </div>

              {/* Primary action to bridge with Summary Generator */}
              <button
                type="button"
                disabled={!extractedText || wordCount < 5 || isProcessing}
                onClick={() =>
                  onSendToGenerator(
                    extractedText,
                    sourceTitle.trim() ? { title: sourceTitle, author: sourceAuthor, citation: sourceCitation } : undefined,
                    imagePreview || undefined
                  )
                }
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold shadow-sm shadow-indigo-600/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all hover:scale-[1.02]"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Create Summary & Flashcards</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
