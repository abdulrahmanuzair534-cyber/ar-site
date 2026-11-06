/**
 * Simple, accessible Text-to-Speech utility using the browser's native SpeechSynthesis API.
 */
class SpeechManager {
  private synth: SpeechSynthesis | null = null;
  private isSpeaking: boolean = false;
  private onStateChange: ((speaking: boolean) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public setListener(cb: (speaking: boolean) => void) {
    this.onStateChange = cb;
  }

  public speak(text: string) {
    if (!this.synth) return;

    this.stop();

    if (!text.trim()) return;

    const cleanText = text.replace(/[*_#`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      this.isSpeaking = true;
      if (this.onStateChange) this.onStateChange(true);
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      if (this.onStateChange) this.onStateChange(false);
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      if (this.onStateChange) this.onStateChange(false);
    };

    this.synth.speak(utterance);
  }

  public stop() {
    if (!this.synth) return;
    this.synth.cancel();
    this.isSpeaking = false;
    if (this.onStateChange) this.onStateChange(false);
  }

  public getSpeaking(): boolean {
    return this.isSpeaking;
  }
}

export const speech = new SpeechManager();
