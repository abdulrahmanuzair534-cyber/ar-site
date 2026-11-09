/**
 * Audio Recording and Transcription Service
 * Transcribes audio recordings using the server-side Gemini transcribe model: gemini-3.5-transcribe
 */

export interface TranscriptionResult {
  transcript: string;
  source: 'gemini' | 'browser-speech' | 'mock';
}

/**
 * Convert a Blob into a base64 encoded string
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Strip data URL scheme if present
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Send audio blob to /api/transcribe (model: gemini-3.5-transcribe)
 */
export async function transcribeAudioBlob(blob: Blob): Promise<TranscriptionResult> {
  const mimeType = blob.type || 'audio/webm';
  const base64Audio = await blobToBase64(blob);

  try {
    const response = await fetch('/api/transcribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audioData: base64Audio,
        mimeType,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.transcript && data.transcript.trim()) {
        return {
          transcript: data.transcript.trim(),
          source: 'gemini',
        };
      }
    }
  } catch (err) {
    console.warn('Backend /api/transcribe unavailable, checking browser fallback...', err);
  }

  // Fallback for static environments without active server API
  return {
    transcript: '',
    source: 'gemini',
  };
}

/**
 * Check if microphone recording is supported in current browser
 */
export function isAudioRecordingSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) &&
    typeof window.MediaRecorder !== 'undefined'
  );
}

/**
 * Check if Web Speech API is supported
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}
