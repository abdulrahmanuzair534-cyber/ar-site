/**
 * Service to extract clean plain text from uploaded files (txt, md, json, csv, rtf, html, pdf).
 * Runs completely client-side in the browser with zero external heavy OCR dependencies.
 */

export interface ExtractedFileResult {
  fileName: string;
  fileSize: number;
  text: string;
  wordCount: number;
  lineCount: number;
  charCount: number;
  detectedType: string;
}

/**
 * Clean and format raw extracted text:
 * Normalizes line endings, collapses excessive blank lines, and removes control characters.
 */
export function cleanExtractedText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // remove invisible ASCII control characters
    .replace(/\n{3,}/g, '\n\n') // collapse multiple blank lines into max 2
    .trim();
}

/**
 * Extracts plain text from an uploaded file (File object).
 */
export async function extractTextFromFile(file: File): Promise<ExtractedFileResult> {
  const fileName = file.name;
  const fileSize = file.size;
  const extension = fileName.split('.').pop()?.toLowerCase() || '';

  let rawText = '';

  if (extension === 'json') {
    const textContent = await file.text();
    try {
      const parsed = JSON.parse(textContent);
      rawText = typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2);
    } catch {
      rawText = textContent;
    }
  } else if (extension === 'pdf') {
    // Basic text stream reader for PDF files without binary garbage
    const buffer = await file.arrayBuffer();
    rawText = extractTextFromPdfBuffer(buffer);
    if (!rawText.trim()) {
      rawText = `[PDF Document: ${fileName}]\n(Note: If this PDF contains scanned raster images without text layers, please copy and paste the plain text directly into the extractor).`;
    }
  } else {
    // txt, md, markdown, csv, tsv, html, rtf, etc.
    rawText = await file.text();

    // If HTML, strip HTML tags for clean study text
    if (extension === 'html' || extension === 'htm') {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = rawText;
      rawText = tempDiv.textContent || tempDiv.innerText || rawText;
    }
  }

  const cleaned = cleanExtractedText(rawText);
  const words = cleaned ? cleaned.split(/\s+/).filter(Boolean).length : 0;
  const lines = cleaned ? cleaned.split('\n').length : 0;

  return {
    fileName,
    fileSize,
    text: cleaned,
    wordCount: words,
    lineCount: lines,
    charCount: cleaned.length,
    detectedType: extension.toUpperCase() || 'DOCUMENT',
  };
}

/**
 * Lightweight native parser to extract plain-text strings from PDF array buffers.
 */
function extractTextFromPdfBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = '';
  // Convert byte stream to string in chunks to avoid stack overflow
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    str += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
  }

  // Find standard PDF text objects (BT ... ET)
  const textMatches: string[] = [];
  const btRegex = /BT[\s\S]*?ET/g;
  let match: RegExpExecArray | null;

  while ((match = btRegex.exec(str)) !== null) {
    const block = match[0];
    // Match strings inside parentheses (Tj / ' / " operator)
    const tjRegex = /\(([\s\S]*?)\)\s*(?:Tj|'|")/g;
    let tjMatch: RegExpExecArray | null;
    while ((tjMatch = tjRegex.exec(block)) !== null) {
      const decoded = tjMatch[1]
        .replace(/\\([()\\])/g, '$1')
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t');
      textMatches.push(decoded);
    }
  }

  return textMatches.join(' ').replace(/\s{2,}/g, ' ').trim();
}
