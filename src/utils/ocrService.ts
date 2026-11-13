/**
 * High-Accuracy Optical Character Recognition (OCR) & Image Pre-Processing Service
 * Primary Engine: Server-side Gemini 4 Vision Multimodal OCR (/api/ocr)
 * Offline/Static Fallback: Client-side Tesseract.js WASM OCR with adaptive contrast & sharpening
 */

export type OcrFileCategory = 'image' | 'pdf' | 'text';

export interface OcrPreprocessOptions {
  enhanceContrast: boolean;
  sharpen: boolean;
  grayscale: boolean;
  rotationDeg: number;
  upscale: boolean;
}

export interface OcrExtractionResult {
  text: string;
  documentType: string;
  detectedLanguage: string;
  confidence: number;
  blocksDetected: number;
  engine: 'gemini-4-hydrogen-vision' | 'tesseract-local-wasm';
  wordCount: number;
  charCount: number;
  processedImageUrl: string;
}

export const DEFAULT_OCR_PREPROCESS: OcrPreprocessOptions = {
  enhanceContrast: true,
  sharpen: true,
  grayscale: true,
  rotationDeg: 0,
  upscale: true,
};

export interface SampleOcrScan {
  id: 'distributed' | 'pharmacology' | 'valuation';
  label: string;
  fileName: string;
  author: string;
  citation: string;
  heading: string;
  subheading: string;
  lines: string[];
}

export const SAMPLE_OCR_SCANS: SampleOcrScan[] = [
  {
    id: 'distributed',
    label: 'Scanned Textbook Page (Systems)',
    fileName: 'Distributed_Consensus_Scan_p184.png',
    author: 'Martin Kleppmann',
    citation: 'Chapter 9 · Consistency & Consensus',
    heading: '9.3 Distributed Consensus & Raft Quorum Mechanics',
    subheading: 'University Systems Architecture Press · Reference Sheet',
    lines: [
      'Brewer’s CAP Theorem establishes that during an asynchronous network partition,',
      'distributed data stores must choose between linearizable Consistency (CP) or total',
      'Availability (AP). Raft consensus preserves safety by electing a single authoritative',
      'leader per term using majority quorums: Q = floor(N / 2) + 1.',
      'Key Invariant: No follower may commit an entry unless a majority of nodes persist it.',
    ],
  },
  {
    id: 'pharmacology',
    label: 'Clinical Notes Scan (Pharmacology)',
    fileName: 'Autonomic_Receptors_Lecture_Scan.png',
    author: 'Dr. Elena Rostova, MD',
    citation: 'Clinical Pharmacology · Section II',
    heading: 'Autonomic Receptor Signal Transduction Pathways',
    subheading: 'Medical Board Review Handout · High-Yield Summary',
    lines: [
      '1. Alpha-1 Receptors (Gq coupled): Activate phospholipase C to generate IP3 and DAG,',
      'raising intracellular Ca2+ to drive arteriolar vasoconstriction and mydriasis.',
      '2. Beta-1 Receptors (Gs coupled): Stimulate adenylyl cyclase in cardiomyocytes,',
      'elevating cAMP to increase heart rate (chronotropy) and contractility (inotropy).',
      '3. Emergency Organophosphate Protocol: Administer IV atropine plus pralidoxime (2-PAM).',
    ],
  },
  {
    id: 'valuation',
    label: 'Financial Memo Scan (DCF Valuation)',
    fileName: 'Enterprise_DCF_Memo_Scan.png',
    author: 'Prof. Aswath Damodaran',
    citation: 'Corporate Finance · Valuation Memo',
    heading: 'Enterprise Value (EV) & Unlevered Cash Flow Bridge',
    subheading: 'Institutional Equity Research · Analytical Note',
    lines: [
      'Enterprise Value = Market Cap + Total Debt + Preferred Stock - Unrestricted Cash.',
      'Discounted Cash Flow (DCF) models project Unlevered Free Cash Flow (UFCF) and',
      'discount projected periods using the Weighted Average Cost of Capital (WACC).',
      'Terminal Value represents 65% to 80% of intrinsic valuation and is cross-checked',
      'using both perpetual GDP growth (2.5%) and comparable EV / EBITDA multiples.',
    ],
  },
];

/**
 * Classifies an uploaded file into image, pdf, or text document.
 */
export function classifyOcrFile(fileName: string, mimeType = ''): OcrFileCategory {
  const lowerMime = mimeType.toLowerCase();
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  if (
    lowerMime.startsWith('image/') ||
    ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif', 'tiff', 'tif', 'svg'].includes(ext)
  ) {
    return 'image';
  }
  if (lowerMime === 'application/pdf' || ext === 'pdf') {
    return 'pdf';
  }
  return 'text';
}

/**
 * Normalizes raw OCR text by fixing split hyphenated words, smart quotes,
 * control characters, and excessive whitespace while keeping paragraph breaks.
 */
export function normalizeOcrOutput(rawText: string): string {
  if (!rawText) return '';
  return rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Join hyphenated words broken across OCR line wraps (e.g. "consis-\ntency")
    .replace(/([a-zA-Z]{2,})-\n([a-zA-Z]{2,})/g, '$1$2')
    // Normalize multiple spaces inside a line while keeping indentation clean
    .replace(/[^\S\n]{2,}/g, ' ')
    // Collapse 3+ newlines into double newline
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Estimates realistic text cleanliness and OCR confidence score (0-100).
 */
export function estimateOcrQualityScore(text: string, reportedConfidence?: number): number {
  const clean = text.trim();
  if (!clean) return 0;

  const totalChars = clean.length;
  const readableChars = (clean.match(/[a-zA-Z0-9.,;:!?'"()\-/%+\s]/g) || []).length;
  const readabilityRatio = readableChars / Math.max(1, totalChars);

  if (typeof reportedConfidence === 'number' && Number.isFinite(reportedConfidence)) {
    const bounded = Math.max(0, Math.min(100, reportedConfidence));
    return Math.round(bounded * 0.8 + readabilityRatio * 100 * 0.2);
  }

  return Math.round(Math.min(99, Math.max(40, readabilityRatio * 98)));
}

/**
 * Renders a crisp high-resolution scanned document PNG data URL on an HTML5 Canvas
 * so sample OCR scans work identically across Vision and local Tesseract WASM engines.
 */
export function renderSampleScanToDataUrl(scan: SampleOcrScan): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 680;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Clean paper background
  ctx.fillStyle = '#fdfcf9';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle printed frame border
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.strokeRect(32, 32, canvas.width - 64, canvas.height - 64);

  // Header kicker
  ctx.fillStyle = '#4338ca';
  ctx.font = '600 18px "Plus Jakarta Sans", Arial, sans-serif';
  ctx.fillText(scan.subheading.toUpperCase(), 68, 92);

  // Main heading
  ctx.fillStyle = '#0f172a';
  ctx.font = '700 32px "Plus Jakarta Sans", Arial, sans-serif';
  ctx.fillText(scan.heading, 68, 146);

  // Rule divider
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(68, 174);
  ctx.lineTo(canvas.width - 68, 174);
  ctx.stroke();

  // Body lines in crisp dark print
  ctx.fillStyle = '#1e293b';
  ctx.font = '400 24px Georgia, "Times New Roman", serif';
  let y = 235;
  for (const line of scan.lines) {
    ctx.fillText(line, 68, y);
    y += 54;
  }

  // Footer citation
  ctx.fillStyle = '#64748b';
  ctx.font = '500 17px "JetBrains Mono", monospace';
  ctx.fillText(`Source: ${scan.author} — ${scan.citation}`, 68, canvas.height - 68);

  return canvas.toDataURL('image/png');
}

/**
 * Applies resolution upscaling, rotation, grayscale conversion, contrast stretching,
 * and 3x3 unsharp convolution to maximize OCR character accuracy on noisy photos/scans.
 */
export async function preprocessImageForOcr(
  imageDataUrl: string,
  options: OcrPreprocessOptions = DEFAULT_OCR_PREPROCESS
): Promise<string> {
  if (typeof document === 'undefined' || !imageDataUrl) {
    return imageDataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const naturalW = img.naturalWidth || 1200;
        const naturalH = img.naturalHeight || 800;

        // Upscale small captures to at least 1400px on longest side (capped at 2200px)
        const maxDim = Math.max(naturalW, naturalH);
        const scale = options.upscale && maxDim < 1400 ? Math.min(2.2, 1400 / Math.max(1, maxDim)) : 1;
        const targetW = Math.round(naturalW * scale);
        const targetH = Math.round(naturalH * scale);

        const normalizedRot = ((options.rotationDeg % 360) + 360) % 360;
        const swapAxes = normalizedRot === 90 || normalizedRot === 270;

        const canvas = document.createElement('canvas');
        canvas.width = swapAxes ? targetH : targetW;
        canvas.height = swapAxes ? targetW : targetH;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(imageDataUrl);
          return;
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((normalizedRot * Math.PI) / 180);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, -targetW / 2, -targetH / 2, targetW, targetH);
        ctx.restore();

        if (options.grayscale || options.enhanceContrast) {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;

          // Compute luminance histogram bounds for adaptive contrast stretch
          let minL = 255;
          let maxL = 0;
          if (options.enhanceContrast) {
            for (let i = 0; i < data.length; i += 4) {
              const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
              if (lum < minL) minL = lum;
              if (lum > maxL) maxL = lum;
            }
          }
          const range = Math.max(16, maxL - minL);

          for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];

            if (options.grayscale) {
              const lum = 0.299 * r + 0.587 * g + 0.114 * b;
              r = g = b = lum;
            }

            if (options.enhanceContrast) {
              const stretch = (v: number) => {
                const stretched = ((v - minL) / range) * 255;
                // Mild S-curve push on ink vs paper
                const centered = stretched - 128;
                return Math.max(0, Math.min(255, Math.round(128 + centered * 1.18)));
              };
              r = stretch(r);
              g = stretch(g);
              b = stretch(b);
            }

            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
          }

          ctx.putImageData(imgData, 0, 0);
        }

        if (options.sharpen && canvas.width * canvas.height <= 3_500_000) {
          applyUnsharpKernel(ctx, canvas.width, canvas.height);
        }

        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(imageDataUrl);
      }
    };

    img.onerror = () => resolve(imageDataUrl);
    img.src = imageDataUrl;
  });
}

function applyUnsharpKernel(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const src = ctx.getImageData(0, 0, width, height);
  const dst = ctx.createImageData(width, height);
  const s = src.data;
  const d = dst.data;
  d.set(s);

  // 3x3 sharpening kernel: [0, -0.4, 0, -0.4, 2.6, -0.4, 0, -0.4, 0]
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        const val =
          s[idx + c] * 2.2 -
          (s[idx - 4 + c] + s[idx + 4 + c] + s[idx - width * 4 + c] + s[idx + width * 4 + c]) * 0.3;
        d[idx + c] = Math.max(0, Math.min(255, Math.round(val)));
      }
      d[idx + 3] = s[idx + 3];
    }
  }
  ctx.putImageData(dst, 0, 0);
}

/**
 * Runs ultra-accurate OCR:
 * 1) Preprocesses the image for optimal character legibility
 * 2) Calls /api/ocr (Gemini 4 Vision Multimodal OCR)
 * 3) Falls back seamlessly to client-side Tesseract.js WASM OCR if server vision is unconfigured
 */
export async function performAccurateOcr(
  fileDataUrl: string,
  mimeType: string,
  preprocessOptions: OcrPreprocessOptions = DEFAULT_OCR_PREPROCESS,
  onProgress?: (status: string, percent: number) => void
): Promise<OcrExtractionResult> {
  const isImage = mimeType.startsWith('image/');
  let processedDataUrl = fileDataUrl;

  if (isImage) {
    onProgress?.('Enhancing contrast & sharpening character edges...', 18);
    processedDataUrl = await preprocessImageForOcr(fileDataUrl, preprocessOptions);
  }

  // Attempt Gemini 4 Multimodal Vision OCR first
  onProgress?.('Running Gemini 4 Multimodal Vision OCR...', 42);
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 16000);

    const res = await fetch('/api/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        fileData: processedDataUrl,
        mimeType: isImage ? 'image/png' : mimeType,
        documentHint: isImage ? 'high-resolution-scan' : 'pdf-document',
      }),
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (!data.fallbackRequired && data.text && data.text.trim().length > 0) {
        const normalized = normalizeOcrOutput(data.text);
        const words = normalized ? normalized.split(/\s+/).filter(Boolean).length : 0;
        onProgress?.('Vision OCR extraction complete', 100);
        return {
          text: normalized,
          documentType: data.documentType || 'Scanned Document',
          detectedLanguage: data.detectedLanguage || 'English',
          confidence: estimateOcrQualityScore(normalized, data.confidence),
          blocksDetected: data.blocksDetected || Math.max(1, normalized.split('\n\n').length),
          engine: 'gemini-4-hydrogen-vision',
          wordCount: words,
          charCount: normalized.length,
          processedImageUrl: processedDataUrl,
        };
      }
    }
  } catch {
    // Fall through cleanly to local Tesseract WASM engine
  }

  // Local client-side Tesseract.js WASM fallback for images
  if (isImage) {
    onProgress?.('Initializing local Tesseract neural OCR engine...', 55);
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('eng', 1, {
      logger: (m: { status?: string; progress?: number }) => {
        if (m.status === 'recognizing text' && typeof m.progress === 'number') {
          onProgress?.('Recognizing characters & layout blocks...', Math.round(58 + m.progress * 38));
        }
      },
    });

    try {
      const result = await worker.recognize(processedDataUrl);
      const normalized = normalizeOcrOutput(result?.data?.text || '');
      const words = normalized ? normalized.split(/\s+/).filter(Boolean).length : 0;
      const tesseractConf = typeof result?.data?.confidence === 'number' ? result.data.confidence : 92;

      onProgress?.('OCR extraction verified', 100);
      return {
        text: normalized,
        documentType: 'Scanned Image Document',
        detectedLanguage: 'English',
        confidence: estimateOcrQualityScore(normalized, tesseractConf),
        blocksDetected: Math.max(1, normalized.split('\n\n').length),
        engine: 'tesseract-local-wasm',
        wordCount: words,
        charCount: normalized.length,
        processedImageUrl: processedDataUrl,
      };
    } finally {
      await worker.terminate();
    }
  }

  throw new Error('Could not run optical OCR on this non-image file without a PDF text layer.');
}
