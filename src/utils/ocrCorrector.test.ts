import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { repairOcrMistakesDeterministic, simulateNoisyOcrSample } from './ocrCorrector.ts';

describe('ocrCorrector deterministic repair', () => {
  it('repairs rn/m substitutions, digit O/0 and l/1 confusions, ligatures, and split hyphens', () => {
    const noisy =
      'Distributed systerns ensure c0nsistency with lOO% uptime and 0f course high perf0rmance via Raft algorithrn.\n' +
      'Partition toler-\nance uses ﬁnal ﬂow,value cleanly.';

    const result = repairOcrMistakesDeterministic(noisy);

    assert.match(result.correctedText, /Distributed systems/);
    assert.match(result.correctedText, /consistency/);
    assert.match(result.correctedText, /100% uptime/);
    assert.match(result.correctedText, /of course/);
    assert.match(result.correctedText, /performance/);
    assert.match(result.correctedText, /Raft algorithm/);
    assert.match(result.correctedText, /tolerance/);
    assert.match(result.correctedText, /final flow, value/);
    assert.ok(result.corrections.length >= 6);
    assert.equal(result.engine, 'deterministic-ocr-repair');
  });

  it('handles empty text gracefully', () => {
    const empty = repairOcrMistakesDeterministic('   ');
    assert.equal(empty.correctedText, '');
    assert.deepEqual(empty.corrections, []);
  });

  it('round-trips simulated noisy OCR back into readable clean text', () => {
    const noisy = simulateNoisyOcrSample();
    assert.match(noisy, /systerns|c0nsistency|lOO%/);
    const repaired = repairOcrMistakesDeterministic(noisy);
    assert.match(repaired.correctedText, /systems/i);
    assert.match(repaired.correctedText, /consistency/i);
    assert.match(repaired.correctedText, /100%/);
  });
});
