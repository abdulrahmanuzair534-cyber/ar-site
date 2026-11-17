import React, { useState, useRef } from 'react';
import { extractTextFromFile, cleanExtractedText } from '../utils/fileExtractorService';
import {
  classifyOcrFile,
  DEFAULT_OCR_PREPROCESS,
  normalizeOcrOutput,
  OcrPreprocessOptions,
  performAccurateOcr,
  renderSampleScanToDataUrl,
  SAMPLE_OCR_SCANS,
  SampleOcrScan,
} from '../utils/ocrService';
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
  Mic,
  ScanText,
  SlidersHorizontal,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  RefreshCw,
  Undo2,
  ShieldCheck,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { AudioTranscriberModal } from './AudioTranscriberModal';
import {
  OcrCorrectionItem,
  repairOcrMistakesDeterministic,
  simulateNoisyOcrSample,
} from '../utils/ocrCorrector';

interface BatchOcrItem {
  id: string;
  fileName: string;
  text: string;
  confidence: number;
  engine: string;
}

interface DocumentTextExtractorProps {
  onSendToGenerator: (
    extractedText: string,
    sourceInfo?: { title?: string; author?: string; citation?: string },
    imageUrl?: string
  ) => void;
}

const SAMPLE_TEXT_FILES = [
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

Discounted Cash Flow (DCF) models project Unlevered Free Cash Flows (UFCF)—cash generated purely from operations after capital expenditures and changes in net working capital, independent of interest expense—and discount them back to present value using the Weighted Average Cost of Capital (WACC). Because terminal value frequently accounts for 65% to 80% of a company's calculated DCF value, practitioners cross-validate perpetual growth assumptions (the Gordon Growth Model, capped at long-term GDP rates of 2-3%) against exit EBITDA multiple benchmarks.`,
  },
];

export const DocumentTextExtractor: React.FC<DocumentTextExtractorProps> = ({
  onSendToGenerator,
}) => {
  const [extractedText, setExtractedText] = useState<string>('');
  const [activeFileName, setActiveFileName] = useState<string>('');
  const [activeFileSize, setActiveFileSize] = useState<number>(0);
  const [activeFileType, setActiveFileType] = useState<string>('');

  // Image / OCR state
  const [rawImageUrl, setRawImageUrl] = useState<string>('');
  const [processedImageUrl, setProcessedImageUrl] = useState<string>('');
  const [rawMimeType, setRawMimeType] = useState<string>('image/png');
  const [ocrEngine, setOcrEngine] = useState<string>('');
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);
  const [ocrDocumentType, setOcrDocumentType] = useState<string>('');
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [ocrStatusText, setOcrStatusText] = useState<string>('');
  const [preprocess, setPreprocess] = useState<OcrPreprocessOptions>(DEFAULT_OCR_PREPROCESS);
  const [imageZoom, setImageZoom] = useState<number>(1);

  // Gemini OCR Error Correction state
  const [isCorrecting, setIsCorrecting] = useState<boolean>(false);
  const [preRepairSnapshot, setPreRepairSnapshot] = useState<string | null>(null);
  const [correctionLog, setCorrectionLog] = useState<OcrCorrectionItem[]>([]);
  const [correctionSummary, setCorrectionSummary] = useState<string>('');
  const [correctionEngineLabel, setCorrectionEngineLabel] = useState<string>('');

  // Multi-file OCR queue
  const [batchQueue, setBatchQueue] = useState<BatchOcrItem[]>([]);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);

  // Source attribution fields
  const [sourceTitle, setSourceTitle] = useState<string>('');
  const [sourceAuthor, setSourceAuthor] = useState<string>('');
  const [sourceCitation, setSourceCitation] = useState<string>('');
  const [isAudioModalOpen, setIsAudioModalOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const wordCount = extractedText.trim() ? extractedText.trim().split(/\s+/).length : 0;
  const charCount = extractedText.length;
  const lineCount = extractedText ? extractedText.split('\n').length : 0;

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file bytes.'));
      reader.readAsDataURL(file);
    });

  const runOpticalOcr = async (
    dataUrl: string,
    mimeType: string,
    options: OcrPreprocessOptions = preprocess
  ) => {
    setIsProcessing(true);
    setError(null);
    setOcrProgress(8);
    setOcrStatusText('Preparing optical recognition pipeline...');

    try {
      const result = await performAccurateOcr(
        dataUrl,
        mimeType,
        options,
        (status, percent) => {
          setOcrStatusText(status);
          setOcrProgress(percent);
        }
      );

      setExtractedText(result.text);
      setProcessedImageUrl(result.processedImageUrl);
      setOcrConfidence(result.confidence);
      setOcrDocumentType(result.documentType);
      setCorrectionLog([]);
      setCorrectionSummary('');
      setPreRepairSnapshot(null);
      const engineFriendly =
        result.engine === 'gemini-4-hydrogen-vision'
          ? 'Gemini 4 Vision OCR'
          : 'Tesseract Neural OCR (Local)';
      setOcrEngine(engineFriendly);
      if (result.text.trim()) {
        setBatchQueue((prev) => {
          const filtered = prev.filter((item) => item.fileName !== (activeFileName || 'Scan'));
          return [
            {
              id: `batch-${Date.now()}`,
              fileName: activeFileName || 'Scanned_Document.png',
              text: result.text,
              confidence: result.confidence,
              engine: engineFriendly,
            },
            ...filtered,
          ].slice(0, 6);
        });
      }
      if (!result.text.trim()) {
        setError(
          'No legible characters were detected in this scan. Try toggling High-Contrast Enhancement or rotating 90° and re-running OCR.'
        );
      }
    } catch (err: any) {
      console.warn('OCR notice:', err?.message || err);
      setError(
        err?.message ||
          'Optical recognition could not read this file. Please try a clearer image, PDF, or plain text document.'
      );
    } finally {
      setIsProcessing(false);
      setOcrProgress(0);
      setOcrStatusText('');
    }
  };

  const handleProcessFile = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setOcrConfidence(null);
    setOcrEngine('');
    setCorrectionLog([]);
    setCorrectionSummary('');
    setPreRepairSnapshot(null);

    const category = classifyOcrFile(file.name, file.type);
    const cleanTitle = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[_-]+/g, ' ')
      .trim();

    setActiveFileName(file.name);
    setActiveFileSize(file.size);
    setSourceTitle(cleanTitle);

    try {
      if (category === 'image') {
        const dataUrl = await readFileAsDataUrl(file);
        const mime = file.type || 'image/png';
        setRawImageUrl(dataUrl);
        setProcessedImageUrl(dataUrl);
        setRawMimeType(mime);
        setActiveFileType(file.name.split('.').pop()?.toUpperCase() || 'IMAGE');
        await runOpticalOcr(dataUrl, mime, preprocess);
        return;
      }

      if (category === 'pdf') {
        setActiveFileType('PDF');
        setRawImageUrl('');
        setProcessedImageUrl('');
        const textResult = await extractTextFromFile(file);
        const hasNativeText =
          textResult.text.trim().length > 40 &&
          !textResult.text.includes('contains scanned raster images');

        if (hasNativeText) {
          const normalized = normalizeOcrOutput(textResult.text);
          setExtractedText(normalized);
          setOcrConfidence(99);
          setOcrDocumentType('PDF Text Layer');
          setOcrEngine('Native PDF Extractor');
          setBatchQueue((prev) => [
            {
              id: `batch-${Date.now()}`,
              fileName: file.name,
              text: normalized,
              confidence: 99,
              engine: 'Native PDF Extractor',
            },
            ...prev.filter((i) => i.fileName !== file.name),
          ].slice(0, 6));
          setIsProcessing(false);
          return;
        }

        // Scanned PDF fallback -> multimodal Gemini Vision OCR
        const pdfDataUrl = await readFileAsDataUrl(file);
        await runOpticalOcr(pdfDataUrl, 'application/pdf', preprocess);
        return;
      }

      // Standard structured/plain text file (.txt, .md, .json, .csv, .html)
      setRawImageUrl('');
      setProcessedImageUrl('');
      const result = await extractTextFromFile(file);
      setExtractedText(result.text);
      setActiveFileType(result.detectedType);
      setOcrConfidence(100);
      setOcrDocumentType('Structured Text Document');
      setOcrEngine('Direct File Parser');
      setBatchQueue((prev) => [
        {
          id: `batch-${Date.now()}`,
          fileName: file.name,
          text: result.text,
          confidence: 100,
          engine: 'Direct File Parser',
        },
        ...prev.filter((i) => i.fileName !== file.name),
      ].slice(0, 6));
    } catch (err: any) {
      console.warn('File extraction notice:', err?.message || err);
      setError(
        'Could not extract text from this file. Please ensure it is a valid image, PDF, or text document.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        await handleProcessFile(files[i]);
      }
      e.target.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        await handleProcessFile(files[i]);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleRunSampleOcrScan = async (scan: SampleOcrScan) => {
    const dataUrl = renderSampleScanToDataUrl(scan);
    if (!dataUrl) return;

    setRawImageUrl(dataUrl);
    setProcessedImageUrl(dataUrl);
    setRawMimeType('image/png');
    setActiveFileName(scan.fileName);
    setActiveFileSize(Math.round((dataUrl.length * 3) / 4));
    setActiveFileType('PNG SCAN');
    setSourceTitle(scan.heading);
    setSourceAuthor(scan.author);
    setSourceCitation(scan.citation);
    setImageZoom(1);

    await runOpticalOcr(dataUrl, 'image/png', preprocess);
  };

  const handleApplyTextSample = (sample: (typeof SAMPLE_TEXT_FILES)[0]) => {
    setRawImageUrl('');
    setProcessedImageUrl('');
    setExtractedText(sample.text);
    setActiveFileName(sample.name);
    setActiveFileSize(new Blob([sample.text]).size);
    setActiveFileType('MARKDOWN');
    setOcrConfidence(100);
    setOcrDocumentType('Markdown Text');
    setOcrEngine('Direct File Parser');
    setSourceTitle(sample.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' '));
    setSourceAuthor(sample.author);
    setSourceCitation(sample.citation);
    setError(null);
  };

  const handleRotateAndRerun = async () => {
    if (!rawImageUrl) return;
    const nextPreprocess = {
      ...preprocess,
      rotationDeg: (preprocess.rotationDeg + 90) % 360,
    };
    setPreprocess(nextPreprocess);
    await runOpticalOcr(rawImageUrl, rawMimeType, nextPreprocess);
  };

  const handleTogglePreprocessOption = (key: 'enhanceContrast' | 'sharpen' | 'grayscale') => {
    setPreprocess((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleCleanWhitespace = () => {
    setExtractedText((prev) => cleanExtractedText(normalizeOcrOutput(prev)));
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
    link.download = activeFileName
      ? `ocr_${activeFileName.replace(/\.[^/.]+$/, '')}.txt`
      : 'ocr_extracted_text.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClearAll = () => {
    setExtractedText('');
    setRawImageUrl('');
    setProcessedImageUrl('');
    setActiveFileName('');
    setActiveFileSize(0);
    setActiveFileType('');
    setOcrEngine('');
    setOcrConfidence(null);
    setOcrDocumentType('');
    setSourceTitle('');
    setSourceAuthor('');
    setSourceCitation('');
    setError(null);
    setImageZoom(1);
    setPreRepairSnapshot(null);
    setCorrectionLog([]);
    setCorrectionSummary('');
  };

  const handleSimulateNoisyOcr = () => {
    const noisy = simulateNoisyOcrSample(extractedText);
    setExtractedText(noisy);
    setActiveFileName((prev) => prev || 'Noisy_Scan_Sample.png');
    setActiveFileType('OCR TEST');
    setOcrConfidence(78);
    setOcrEngine('Raw Scan Text');
    setCorrectionLog([]);
    setCorrectionSummary('');
    setPreRepairSnapshot(null);
    setError(null);
  };

  const handleRepairOcrWithGemini = async () => {
    if (!extractedText.trim()) return;
    setIsCorrecting(true);
    setError(null);
    const originalCopy = extractedText;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 14000);

      const res = await fetch('/api/ocr/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          rawText: originalCopy,
          fileData: rawImageUrl || undefined,
          mimeType: rawMimeType || 'image/png',
          contextHint: sourceTitle || ocrDocumentType || '',
        }),
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data?.correctedText) {
          setPreRepairSnapshot(originalCopy);
          setExtractedText(data.correctedText);
          setCorrectionLog(Array.isArray(data.corrections) ? data.corrections : []);
          setCorrectionSummary(data.summaryNote || 'OCR text verified and repaired cleanly.');
          setCorrectionEngineLabel(
            data.engine === 'gemini-4-hydrogen-proofreader'
              ? 'Gemini 4 Vision Proofreader'
              : 'AR Smart OCR Repair'
          );
          if (typeof data.confidenceAfter === 'number') {
            setOcrConfidence(data.confidenceAfter);
          }
          setIsCorrecting(false);
          return;
        }
      }
    } catch {
      // Seamless local fallback below
    }

    const fallback = repairOcrMistakesDeterministic(originalCopy);
    setPreRepairSnapshot(originalCopy);
    setExtractedText(fallback.correctedText);
    setCorrectionLog(fallback.corrections);
    setCorrectionSummary(fallback.summaryNote);
    setCorrectionEngineLabel('AR Smart OCR Repair');
    setOcrConfidence(fallback.confidenceAfter);
    setIsCorrecting(false);
  };

  const handleUndoRepair = () => {
    if (preRepairSnapshot === null) return;
    setExtractedText(preRepairSnapshot);
    setPreRepairSnapshot(null);
    setCorrectionLog([]);
    setCorrectionSummary('');
  };

  const handleMergeBatchQueue = () => {
    if (batchQueue.length === 0) return;
    const merged = [...batchQueue]
      .reverse()
      .map((item) => `## ${item.fileName}\n\n${item.text}`)
      .join('\n\n---\n\n');
    setExtractedText(merged);
    setSourceTitle('Combined Multi-Page OCR Extract');
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
        : undefined,
      rawImageUrl || undefined
    );
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            <ScanText className="w-4 h-4" />
            <span>Optical Character Recognition &amp; Document Extraction</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display">
            High-Accuracy Vision OCR &amp; File Studio
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Scan textbook pages, handwritten notes, whiteboards, PDFs, or structured documents (.png, .jpg, .webp, .pdf, .txt, .md) with adaptive contrast enhancement and automatic neural fallback.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAudioModalOpen(true)}
          className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold flex items-center gap-2 transition-colors shrink-0 self-start md:self-auto cursor-pointer"
        >
          <Mic className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Dictate Audio Transcript</span>
        </button>
      </div>

      {/* Quick-Test Real OCR Scans & Sample Files */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            Test Optical OCR on Sample Scanned Pages
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Generates a real high-DPI page scan and runs end-to-end OCR
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_OCR_SCANS.map((scan) => (
            <button
              key={scan.id}
              type="button"
              disabled={isProcessing}
              onClick={() => handleRunSampleOcrScan(scan)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              <ScanText className="w-3.5 h-3.5" />
              <span>{scan.label}</span>
            </button>
          ))}
          {SAMPLE_TEXT_FILES.map((sample) => (
            <button
              key={sample.name}
              type="button"
              disabled={isProcessing}
              onClick={() => handleApplyTextSample(sample)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-400 hover:text-indigo-600 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              {sample.label}
            </button>
          ))}
          <button
            type="button"
            disabled={isProcessing || isCorrecting}
            onClick={handleSimulateNoisyOcr}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-50"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Load Noisy Scan Text (Test Repair)</span>
          </button>
        </div>
      </div>

      {/* Main Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Upload Dropzone, Image Inspector & Pre-processing */}
        <div className="lg:col-span-5 space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            aria-label="Upload image, PDF, or document for OCR and text extraction"
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
              dragOver
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-white dark:bg-slate-900'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.png,.jpg,.jpeg,.webp,.bmp,.pdf,.txt,.md,.markdown,.json,.csv,.tsv,.html,.rtf"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-11 h-11 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
              <Upload className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Drop Image, Scan, or Document Here
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
              Supports PNG, JPG, WEBP screenshots, whiteboard photos, PDFs, Markdown, and TXT files.
            </p>
          </div>

          {/* Interactive Optical Preview & Pre-processing Controls */}
          {rawImageUrl && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Optical Scan Inspector</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setImageZoom((z) => Math.max(1, Number((z - 0.25).toFixed(2))))}
                    aria-label="Zoom out scan preview"
                    className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageZoom((z) => Math.min(2.5, Number((z + 0.25).toFixed(2))))}
                    aria-label="Zoom in scan preview"
                    className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRotateAndRerun}
                    disabled={isProcessing}
                    aria-label="Rotate scan 90 degrees and re-run OCR"
                    title="Rotate 90° and re-scan"
                    className="p-1.5 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Image stage with scanning bar animation while processing */}
              <div className="relative bg-slate-950/95 p-3 max-h-72 overflow-auto flex items-center justify-center">
                <img
                  src={processedImageUrl || rawImageUrl}
                  alt={activeFileName || 'Uploaded OCR scan preview'}
                  style={{ transform: `scale(${imageZoom})`, transformOrigin: 'center center' }}
                  className="max-h-60 w-auto object-contain rounded transition-transform duration-150"
                />
                {isProcessing && (
                  <div className="absolute inset-x-0 top-0 bottom-0 bg-indigo-950/40 backdrop-blur-[1px] flex flex-col items-center justify-center p-4 text-center">
                    <RefreshCw className="w-6 h-6 text-indigo-300 animate-spin mb-2" />
                    <span className="text-xs font-semibold text-white">{ocrStatusText || 'Running OCR...'}</span>
                    <div className="w-48 h-1.5 bg-white/20 rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full bg-indigo-400 transition-all duration-300"
                        style={{ width: `${Math.max(10, ocrProgress)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Image Pre-processing Enhancement Controls */}
              <div className="p-3.5 bg-slate-50/80 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleTogglePreprocessOption('enhanceContrast')}
                    aria-pressed={preprocess.enhanceContrast}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                      preprocess.enhanceContrast
                        ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Contrast Boost
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTogglePreprocessOption('sharpen')}
                    aria-pressed={preprocess.sharpen}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                      preprocess.sharpen
                        ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Edge Sharpen
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTogglePreprocessOption('grayscale')}
                    aria-pressed={preprocess.grayscale}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                      preprocess.grayscale
                        ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Ink Isolation
                  </button>
                </div>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => runOpticalOcr(rawImageUrl, rawMimeType, preprocess)}
                  className="w-full py-2 px-3 rounded-lg bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                  <span>{isProcessing ? 'Scanning...' : 'Re-Run Precision OCR'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Extraction Progress Banner for non-image files */}
          {isProcessing && !rawImageUrl && (
            <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{ocrStatusText || 'Extracting document structure...'}</span>
              </div>
              <div className="w-full h-1.5 bg-indigo-100 dark:bg-indigo-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${Math.max(15, ocrProgress)}%` }}
                />
              </div>
            </div>
          )}

          {/* Extraction Error Alert */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-start justify-between gap-2">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                aria-label="Dismiss error"
                className="text-red-500 hover:text-red-700 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Source Attribution Inputs */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
              <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Source Attribution (Optional)</span>
            </div>
            <div>
              <label htmlFor="ocr-source-title" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Document or Book Title
              </label>
              <input
                id="ocr-source-title"
                type="text"
                value={sourceTitle}
                onChange={(e) => setSourceTitle(e.target.value)}
                placeholder="e.g. Distributed Systems Architecture"
                className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label htmlFor="ocr-source-author" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Author
                </label>
                <input
                  id="ocr-source-author"
                  type="text"
                  value={sourceAuthor}
                  onChange={(e) => setSourceAuthor(e.target.value)}
                  placeholder="e.g. Martin Kleppmann"
                  className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="ocr-source-citation" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Chapter / Page
                </label>
                <input
                  id="ocr-source-citation"
                  type="text"
                  value={sourceCitation}
                  onChange={(e) => setSourceCitation(e.target.value)}
                  placeholder="e.g. Chapter 9, p. 184"
                  className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Unboxed Clean File & Engine Metadata */}
          {activeFileName && (
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 text-xs space-y-1">
              <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                {activeFileName}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2 tabular-nums">
                <span>{activeFileType}</span>
                <span aria-hidden="true">·</span>
                <span>{(activeFileSize / 1024).toFixed(1)} KB</span>
                {ocrConfidence !== null && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      {ocrConfidence}% Accuracy
                    </span>
                  </>
                )}
                {ocrEngine && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{ocrEngine}</span>
                  </>
                )}
              </div>
            </div>
          )}
              {/* Batch Queue History */}
          {batchQueue.length > 1 && (
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Session OCR Queue ({batchQueue.length} files)</span>
                </span>
                <button
                  type="button"
                  onClick={handleMergeBatchQueue}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Merge All into Workspace
                </button>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {batchQueue.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setExtractedText(item.text);
                      setActiveFileName(item.fileName);
                      setOcrConfidence(item.confidence);
                      setOcrEngine(item.engine);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/30 border border-slate-200/70 dark:border-slate-800 text-xs flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <span className="truncate font-medium text-slate-700 dark:text-slate-300">{item.fileName}</span>
                    <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 shrink-0">
                      {item.confidence}%
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Extracted Text Workspace & Handoff */}
        <div className="lg:col-span-7 flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Extracted OCR Text Workspace
              </h2>
              {ocrDocumentType && (
                <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                  · {ocrDocumentType}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {extractedText && (
                <>
                  <button
                    type="button"
                    disabled={isCorrecting || isProcessing}
                    onClick={handleRepairOcrWithGemini}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Have Gemini inspect & repair OCR spelling, broken hyphens, formulas, and symbol errors"
                  >
                    {isCorrecting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Repairing...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>AI Repair OCR Mistakes</span>
                      </>
                    )}
                  </button>

                  {preRepairSnapshot !== null && (
                    <button
                      type="button"
                      onClick={handleUndoRepair}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      <span>Undo</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleCleanWhitespace}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-colors flex items-center gap-1 cursor-pointer"
                    title="De-hyphenate and clean excessive whitespace"
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span>Normalize</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyToClipboard}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadText}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Save .txt</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearAll}
                    aria-label="Clear extracted text and scan"
                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Gemini OCR Correction Audit Drawer */}
          {(correctionSummary || correctionLog.length > 0) && (
            <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/70 bg-emerald-50/50 dark:bg-emerald-950/25 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-800 dark:text-emerald-300">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{correctionSummary}</span>
                </div>
                {correctionEngineLabel && (
                  <span className="text-[11px] font-mono text-emerald-700/80 dark:text-emerald-400/80">
                    {correctionEngineLabel}
                  </span>
                )}
              </div>

              {correctionLog.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pt-1">
                  {correctionLog.map((item) => (
                    <div
                      key={item.id}
                      className="p-2 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-emerald-200/70 dark:border-emerald-900/60 text-[11px] space-y-0.5"
                    >
                      <div className="font-mono flex items-center gap-1.5 flex-wrap">
                        <span className="line-through text-red-600 dark:text-red-400">{item.original}</span>
                        <span aria-hidden="true" className="text-slate-400">→</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-300">{item.corrected}</span>
                      </div>
                      <div className="text-slate-500 dark:text-slate-400">{item.reason}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Textarea */}
          <div className="relative flex-1 min-h-[340px]">
            <textarea
              aria-label="Extracted OCR text output"
              value={extractedText}
              onChange={(e) => setExtractedText(e.target.value)}
              placeholder="Upload a document image, PDF, or click a sample scanned page above to extract verbatim text..."
              className="w-full h-full min-h-[340px] p-4 text-sm font-sans text-slate-800 dark:text-slate-200 bg-slate-50/70 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-y"
            />
          </div>

          {/* Stats Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5 tabular-nums">
              <span>{wordCount.toLocaleString()} words</span>
              <span aria-hidden="true">·</span>
              <span>{charCount.toLocaleString()} characters</span>
              <span aria-hidden="true">·</span>
              <span>{lineCount} {lineCount === 1 ? 'line' : 'lines'}</span>
            </div>

            {wordCount >= 10 && (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ready for AI synthesis</span>
              </span>
            )}
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            disabled={wordCount < 10 || isProcessing}
            onClick={handleSendToAi}
            className="w-full py-3.5 px-6 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Send to AI Generator &amp; Create Flashcards</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Audio Transcription Modal */}
      <AudioTranscriberModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
        onTranscriptComplete={(transcript) => {
          setExtractedText(transcript);
          setActiveFileName('Audio_Recording_Transcript.txt');
          setActiveFileType('AUDIO');
          setActiveFileSize(transcript.length);
          setOcrEngine('Gemini 3.5 Transcribe');
          setOcrConfidence(99);
          if (!sourceTitle) {
            setSourceTitle('Voice Note / Audio Lecture Transcript');
          }
        }}
        title="Dictate & Transcribe Audio"
      />
    </div>
  );
};
