import { createWorker } from 'tesseract.js';

export interface OcrProgressUpdate {
  status: string;
  progress: number; // 0 to 1
}

/**
 * Robust image-to-text extractor that uses Gemini multimodal vision when available,
 * and falls back seamlessly to client-side Tesseract.js OCR (for offline or GitHub Pages).
 */
export async function extractTextFromImage(
  imageSource: File | Blob | string,
  mode: 'full-text' | 'handwritten' | 'table' = 'full-text',
  onProgress?: (update: OcrProgressUpdate) => void
): Promise<{ text: string; engine: 'ai-vision' | 'client-ocr' }> {
  // 1. Convert File/Blob to base64 if needed
  let base64Data: string;
  let mimeType = 'image/jpeg';

  if (typeof imageSource === 'string') {
    base64Data = imageSource;
    if (imageSource.startsWith('data:')) {
      const match = imageSource.match(/^data:([^;]+);base64,/);
      if (match) mimeType = match[1];
    }
  } else {
    mimeType = imageSource.type || 'image/jpeg';
    base64Data = await fileToBase64(imageSource);
  }

  onProgress?.({ status: 'Initiating document visual analysis...', progress: 0.1 });

  // 2. Try the server-side AI Vision endpoint first (if available)
  try {
    const res = await fetch('/api/extract-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: base64Data,
        mimeType,
        mode,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.text && !data.useClientOcr) {
        onProgress?.({ status: 'Neural vision extraction complete!', progress: 1.0 });
        return { text: data.text.trim(), engine: 'ai-vision' };
      }
    }
  } catch (err) {
    // Server is unreachable (e.g. running as static build on GitHub Pages)
    console.info('Server vision endpoint unavailable; switching to client-side OCR engine.');
  }

  // 3. Client-side OCR via Tesseract.js (works 100% in browser on GitHub Pages)
  onProgress?.({ status: 'Preparing high-resolution raster canvas...', progress: 0.2 });

  // Ensure image is converted to raster PNG so Leptonica/Tesseract never encounters format issues (e.g. SVG or raw streams)
  const rasterData = await ensureRasterImage(base64Data);

  onProgress?.({ status: 'Loading client OCR neural model...', progress: 0.35 });

  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        const p = 0.4 + (m.progress || 0) * 0.55;
        onProgress?.({
          status: `Extracting text (${Math.round((m.progress || 0) * 100)}%)...`,
          progress: Math.min(0.95, p),
        });
      }
    },
  });

  try {
    const ret = await worker.recognize(rasterData);
    await worker.terminate();

    onProgress?.({ status: 'Visual extraction finalized!', progress: 1.0 });
    const cleanText = (ret.data.text || '').trim();

    return {
      text: cleanText || 'No legible text could be extracted from this image. Please ensure good lighting and contrast.',
      engine: 'client-ocr',
    };
  } catch (ocrErr: any) {
    try {
      await worker.terminate();
    } catch {}
    throw new Error(`Failed to extract text from image: ${ocrErr.message || 'Unknown error'}`);
  }
}

/**
 * Helper to convert File or Blob to Base64 data URL.
 */
export function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Converts any image format (SVG, WebP, etc.) into a clean 2D raster PNG for Tesseract.
 */
async function ensureRasterImage(imageUri: string): Promise<string> {
  if (typeof document === 'undefined') return imageUri;

  // If it's already a clean JPEG or PNG data URL, return as-is
  if (imageUri.startsWith('data:image/png') || imageUri.startsWith('data:image/jpeg')) {
    return imageUri;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(800, img.naturalWidth || img.width || 800);
        canvas.height = Math.max(400, img.naturalHeight || img.height || 400);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/png'));
          return;
        }
      } catch (e) {
        console.warn('Canvas conversion failed, passing raw URI:', e);
      }
      resolve(imageUri);
    };
    img.onerror = () => {
      resolve(imageUri);
    };
    img.src = imageUri;
  });
}
