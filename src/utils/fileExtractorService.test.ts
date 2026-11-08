import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanExtractedText } from './fileExtractorService';

test('cleanExtractedText normalizes linebreaks and collapses empty lines', () => {
  const dirty = 'Line 1\r\n\r\n\r\n\r\nLine 2\rLine 3';
  const cleaned = cleanExtractedText(dirty);
  assert.equal(cleaned, 'Line 1\n\nLine 2\nLine 3');
});

test('cleanExtractedText strips control characters safely', () => {
  const withControl = 'Hello\x00\x07World!';
  const cleaned = cleanExtractedText(withControl);
  assert.equal(cleaned, 'HelloWorld!');
});
