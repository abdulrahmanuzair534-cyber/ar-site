import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Upload,
  X,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileAudio,
} from 'lucide-react';
import { transcribeAudioBlob, isAudioRecordingSupported } from '../utils/audioTranscribeService';

interface AudioTranscriberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscriptComplete: (text: string) => void;
  title?: string;
}

export const AudioTranscriberModal: React.FC<AudioTranscriberModalProps> = ({
  isOpen,
  onClose,
  onTranscriptComplete,
  title = 'Transcribe Audio with Gemini',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      handleCancelRecording();
      setResultText('');
      setError(null);
      setStatusMessage('');
    }
  }, [isOpen]);

  const startTimer = () => {
    setRecordingSeconds(0);
    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleStartRecording = async () => {
    setError(null);
    setResultText('');
    setStatusMessage('Accessing microphone...');

    if (!isAudioRecordingSupported()) {
      setError('Microphone recording is not supported in this browser. Please upload an audio file instead.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/wav';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await processAudio(audioBlob);
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      startTimer();
      setStatusMessage('Recording voice note... speak clearly into your mic.');
    } catch (err: any) {
      const isPermissionDenied =
        err?.name === 'NotAllowedError' ||
        err?.name === 'PermissionDeniedError' ||
        err?.message?.toLowerCase().includes('permission denied') ||
        err?.name === 'SecurityError';

      if (isPermissionDenied) {
        console.warn('Microphone permission not granted by browser or user policy:', err?.message || err);
        setError(
          'Microphone permission was not granted by your browser. You can click the lock/settings icon in your browser address bar to allow microphone access, or upload an audio file (.mp3, .wav, .m4a, .webm) below.'
        );
      } else {
        console.warn('Audio capture notice:', err?.message || err);
        setError('Microphone is unavailable or in use by another application. Please upload an audio file or try a sample note.');
      }
      setStatusMessage('');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      stopTimer();
      setIsRecording(false);
      setStatusMessage('Finalizing audio stream...');
      mediaRecorderRef.current.stop();
    }
  };

  const handleCancelRecording = () => {
    stopTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
        mediaRecorderRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|m4a|webm|ogg|aac)$/i)) {
      setError('Please select a valid audio file (.mp3, .wav, .m4a, .webm, .ogg).');
      return;
    }

    processAudio(file);
    e.target.value = '';
  };

  const processAudio = async (blob: Blob) => {
    setIsProcessing(true);
    setError(null);
    setStatusMessage('Transcribing audio with Gemini (gemini-3.5-transcribe)...');

    try {
      const res = await transcribeAudioBlob(blob);
      if (res.transcript) {
        setResultText(res.transcript);
        setStatusMessage('Transcription complete!');
      } else {
        setError('No speech was detected in the audio recording. Please try speaking closer to the microphone.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to transcribe audio. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSampleAudio = () => {
    setError(null);
    setResultText(
      'In today’s lecture on distributed systems, we examined consensus protocols and the PACELC theorem. Specifically, when network partitions occur, architects must sacrifice availability to guarantee strict serializability or sacrifice consistency to preserve uptime. Furthermore, Raft uses majority quorum voting with terms to elect leaders and ensure committed log entries are never overwritten.'
    );
    setStatusMessage('Sample lecture audio loaded successfully!');
  };

  const handleApply = () => {
    if (resultText) {
      onTranscriptComplete(resultText);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display">
                {title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Powered by model: <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">gemini-3.5-transcribe</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Recording / Processing Area */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-center space-y-4">
          {isRecording ? (
            <div className="space-y-4">
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
                <div className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
                  <Mic className="w-8 h-8 animate-pulse" />
                </div>
              </div>

              <div>
                <div className="font-mono text-2xl font-extrabold text-red-600 dark:text-red-400">
                  {formatSeconds(recordingSeconds)}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Listening... Speak your lecture notes, summary, or thoughts.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancelRecording}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStopRecording}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <MicOff className="w-3.5 h-3.5" />
                  <span>Stop &amp; Transcribe</span>
                </button>
              </div>
            </div>
          ) : isProcessing ? (
            <div className="py-6 space-y-3">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {statusMessage}
              </p>
              <p className="text-[11px] text-slate-400">
                Converting audio tokens into verbatim study text...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
                <Mic className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Record Voice Note or Upload Audio File
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Dictate study materials, lecture excerpts, or meeting notes directly from your microphone.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleStartRecording}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Mic className="w-4 h-4" />
                  <span>Start Microphone Recording</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Audio File</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            </div>
          )}
        </div>

        {/* Error message & Recovery Fallback */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 space-y-2.5">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Upload className="w-3 h-3" />
                <span>Upload Audio File</span>
              </button>
              <button
                type="button"
                onClick={handleLoadSampleAudio}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Load Sample Audio Transcript</span>
              </button>
            </div>
          </div>
        )}

        {/* Transcribed Text Preview */}
        {resultText && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Verbatim Transcription ({resultText.split(/\s+/).length} words)</span>
              </span>
              <button
                type="button"
                onClick={() => setResultText('')}
                className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                Clear
              </button>
            </div>
            <textarea
              value={resultText}
              onChange={(e) => setResultText(e.target.value)}
              rows={4}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}

        {/* Action footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          {resultText && (
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Insert Transcribed Text</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
