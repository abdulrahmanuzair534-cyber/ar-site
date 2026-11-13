import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyOcrFile,
  normalizeOcrOutput,
  estimateOcrQualityScore,
  SAMPLE_OCR_SCANS,
} from './ocrService';

test('classifyOcrFile identifies images, PDFs, and text files accurately', () => {
  assert.equal(classifyOcrFile('lecture_notes.png', 'image/png'), 'image');
  assert.equal(classifyOcrFile('whiteboard.JPEG'), 'image');
  assert.equal(classifyOcrFile('chapter7.webp', 'image/webp'), 'image');
  assert.equal(classifyOcrFile('research_paper.pdf', 'application/pdf'), 'pdf');
  assert.equal(classifyOcrFile('study_notes.md', 'text/markdown'), 'text');
  assert.equal(classifyOcrFile('outline.txt'), 'text');
});

test('normalizeOcrOutput de-hyphenates line breaks and cleans whitespace while preserving paragraphs', () => {
  const raw = 'Distributed consis-\ntency requires\r\nquorum   voting.\n\n\n\nSecond   paragraph\x00 stays intact.';
  const normalized = normalizeOcrOutput(raw);
  assert.equal(
    normalized,
    'Distributed consistency requires\nquorum voting.\n\nSecond paragraph stays intact.'
  );
});

test('estimateOcrQualityScore scores clean prose high and empty input as 0', () => {
  assert.equal(estimateOcrQualityScore(''), 0);
  const score = estimateOcrQualityScore('Brewer CAP theorem balances consistency and availability.', 96);
  assert.ok(score >= 94 && score <= 100, `Expected score >= 94, got ${score}`);
});

test('SAMPLE_OCR_SCANS provides realistic multi-domain sample scans', () => {
  assert.equal(SAMPLE_OCR_SCANS.length, 3);
  for (const scan of SAMPLE_OCR_SCANS) {
    assert.ok(scan.heading.length > 5);
    assert.ok(scan.lines.length >= 4);
  }
});
