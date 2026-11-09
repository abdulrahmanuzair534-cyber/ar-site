import test from 'node:test';
import assert from 'node:assert';
import { isAudioRecordingSupported, isSpeechRecognitionSupported } from './audioTranscribeService';

test('isAudioRecordingSupported handles non-browser environment safely', () => {
  // In Node environment, window / navigator are undefined or mock
  const supported = isAudioRecordingSupported();
  assert.strictEqual(typeof supported, 'boolean');
});

test('isSpeechRecognitionSupported handles node environment safely', () => {
  const supported = isSpeechRecognitionSupported();
  assert.strictEqual(typeof supported, 'boolean');
});
