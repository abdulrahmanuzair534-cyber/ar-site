import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeSpeechText,
  buildFrontSpeechText,
  buildBackSpeechText,
  buildFullCardSpeechText,
} from './speech';

test('sanitizeSpeechText strips markdown formatting and normalizes whitespace', () => {
  assert.equal(
    sanitizeSpeechText('**CAP** _Theorem_ #1: `consistency` vs   availability'),
    'CAP Theorem 1: consistency vs availability'
  );
});

test('buildFrontSpeechText extracts clean question text', () => {
  assert.equal(
    buildFrontSpeechText({ question: 'What is **PACELC**?' }),
    'What is PACELC?'
  );
});

test('buildBackSpeechText appends memory anchor when present', () => {
  assert.equal(
    buildBackSpeechText({ answer: 'Partition vs Latency trade-off.' }),
    'Partition vs Latency trade-off.'
  );
  assert.equal(
    buildBackSpeechText({
      answer: 'Partition vs Latency trade-off.',
      mnemonic: 'If Partition, pick C or A; Else, pick L or C.',
    }),
    'Partition vs Latency trade-off.. Memory anchor: If Partition, pick C or A; Else, pick L or C.'
  );
});

test('buildFullCardSpeechText combines front and back cleanly', () => {
  const text = buildFullCardSpeechText({
    question: 'What is Raft?',
    answer: 'A consensus algorithm.',
    mnemonic: 'Leader election via quorum.',
  });
  assert.ok(text.includes('Question: What is Raft?'));
  assert.ok(text.includes('Answer: A consensus algorithm.'));
  assert.ok(text.includes('Memory anchor: Leader election via quorum.'));
});
