/**
 * Accessible Text-to-Speech utility using the browser's native SpeechSynthesis API.
 * Supports reading flashcard fronts, backs, or full sequences with playback rate control.
 */

export type SpeechTarget = 'front' | 'back' | 'both' | 'summary' | null;

export interface SpeechCardInput {
  question: string;
  answer: string;
  mnemonic?: string;
  category?: string;
}

export function sanitizeSpeechText(text: string): string {
  return text
    .replace(/[*_#`~>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildFrontSpeechText(card: Pick<SpeechCardInput, 'question'>): string {
  return sanitizeSpeechText(card.question || '');
}

export function buildBackSpeechText(card: Pick<SpeechCardInput, 'answer' | 'mnemonic'>): string {
  const answer = sanitizeSpeechText(card.answer || '');
  const mnemonic = card.mnemonic ? sanitizeSpeechText(card.mnemonic) : '';
  if (!answer && !mnemonic) return '';
  if (!mnemonic) return answer;
  return `${answer}. Memory anchor: ${mnemonic}`;
}

export function buildFullCardSpeechText(card: Pick<SpeechCardInput, 'question' | 'answer' | 'mnemonic'>): string {
  const front = buildFrontSpeechText(card);
  const back = buildBackSpeechText(card);
  if (front && back) return `Question: ${front}. Answer: ${back}`;
  return front || back;
}

class SpeechManager {
  private synth: SpeechSynthesis | null = null;
  private isSpeaking: boolean = false;
  private activeTarget: SpeechTarget = null;
  private rate: number = 1.0;
  private onStateChange: ((speaking: boolean) => void) | null = null;
  private onTargetChange: ((target: SpeechTarget) => void) | null = null;
  private sequenceTimer: ReturnType<typeof setTimeout> | null = null;
  private fallbackTimer: ReturnType<typeof setTimeout> | null = null;
  private sessionId: number = 0;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public setListener(cb: (speaking: boolean) => void) {
    this.onStateChange = cb;
  }

  public setTargetListener(cb: (target: SpeechTarget) => void) {
    this.onTargetChange = cb;
  }

  public setRate(rate: number) {
    this.rate = Math.min(2.0, Math.max(0.6, rate));
  }

  public getRate(): number {
    return this.rate;
  }

  public getActiveTarget(): SpeechTarget {
    return this.activeTarget;
  }

  private emitState(speaking: boolean, target: SpeechTarget) {
    this.isSpeaking = speaking;
    this.activeTarget = speaking ? target : null;
    if (this.onStateChange) this.onStateChange(speaking);
    if (this.onTargetChange) this.onTargetChange(this.activeTarget);
  }

  private clearTimers() {
    if (this.sequenceTimer) {
      clearTimeout(this.sequenceTimer);
      this.sequenceTimer = null;
    }
    if (this.fallbackTimer) {
      clearTimeout(this.fallbackTimer);
      this.fallbackTimer = null;
    }
  }

  public speak(text: string, target: SpeechTarget = 'summary', onComplete?: () => void) {
    this.stop();

    const cleanText = sanitizeSpeechText(text);
    if (!cleanText) return;

    const currentSession = ++this.sessionId;
    this.emitState(true, target);

    if (!this.synth) {
      // Graceful non-TTS fallback duration so UI state still reflects reading feedback
      const wordCount = cleanText.split(/\s+/).length;
      const estimatedMs = Math.min(8000, Math.max(1200, Math.round((wordCount * 360) / this.rate)));
      this.fallbackTimer = setTimeout(() => {
        if (this.sessionId !== currentSession) return;
        this.emitState(false, null);
        onComplete?.();
      }, estimatedMs);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = this.rate;
    utterance.pitch = 1.0;

    let started = false;
    const wordCount = cleanText.split(/\s+/).length;
    const estimatedMs = Math.min(12000, Math.max(1500, Math.round((wordCount * 400) / this.rate)));

    // Safety timer in case headless/muted browser lacks OS speech voices and never fires onstart/onend
    this.fallbackTimer = setTimeout(() => {
      if (this.sessionId !== currentSession) return;
      if (!started && !this.synth?.speaking) {
        this.emitState(false, null);
        onComplete?.();
      }
    }, estimatedMs);

    utterance.onstart = () => {
      if (this.sessionId !== currentSession) return;
      started = true;
      if (this.fallbackTimer) {
        clearTimeout(this.fallbackTimer);
        this.fallbackTimer = null;
      }
      this.emitState(true, target);
    };

    utterance.onend = () => {
      if (this.sessionId !== currentSession) return;
      this.clearTimers();
      this.emitState(false, null);
      onComplete?.();
    };

    utterance.onerror = () => {
      if (this.sessionId !== currentSession) return;
      if (started) {
        this.clearTimers();
        this.emitState(false, null);
      }
      // If browser has no OS voices (e.g. headless Linux), allow fallbackTimer to maintain reading state
    };

    try {
      this.synth.speak(utterance);
    } catch {
      // Allow fallbackTimer to handle completion gracefully
    }
  }

  public speakCardFrontAndBack(
    card: Pick<SpeechCardInput, 'question' | 'answer' | 'mnemonic'>,
    onSideChange?: (side: 'front' | 'back') => void
  ) {
    const frontText = buildFrontSpeechText(card);
    const backText = buildBackSpeechText(card);

    if (!frontText && !backText) return;
    if (!frontText) {
      onSideChange?.('back');
      this.speak(backText, 'back');
      return;
    }
    if (!backText) {
      onSideChange?.('front');
      this.speak(frontText, 'front');
      return;
    }

    onSideChange?.('front');
    const activeSession = this.sessionId + 1;

    this.speak(frontText, 'both', () => {
      // Ensure stop() wasn't called in between
      if (this.sessionId !== activeSession) return;
      this.emitState(true, 'both');
      this.sequenceTimer = setTimeout(() => {
        if (this.sessionId !== activeSession) return;
        onSideChange?.('back');
        this.speak(backText, 'both');
      }, 380);
    });
  }

  public stop() {
    this.sessionId++;
    this.clearTimers();
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {
        // Ignore browser speech cancel errors
      }
    }
    this.emitState(false, null);
  }

  public getSpeaking(): boolean {
    return this.isSpeaking;
  }
}

export const speech = new SpeechManager();

