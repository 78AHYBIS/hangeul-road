/**
 * Korean pronunciation through the browser's built-in speech (Web Speech API).
 * A tiny store: components subscribe with the useKoreanVoice hook and re-render
 * when the status changes.
 */

export type VoiceStatus = 'checking' | 'available' | 'unavailable';

let status: VoiceStatus = 'checking';
let voice: SpeechSynthesisVoice | null = null;
let started = false;
const listeners = new Set<() => void>();

function setStatus(next: VoiceStatus) {
  if (status === next) return;
  status = next;
  listeners.forEach((listener) => listener());
}

function lookForVoice(giveUpIfMissing: boolean) {
  const found = window.speechSynthesis
    .getVoices()
    // Some Android browsers report "ko_KR" instead of "ko-KR".
    .find((v) => v.lang.replace('_', '-').toLowerCase().startsWith('ko'));
  if (found) {
    voice = found;
    setStatus('available');
  } else if (giveUpIfMissing) {
    setStatus('unavailable');
  }
}

function start() {
  if (started) return;
  started = true;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    setStatus('unavailable');
    return;
  }
  lookForVoice(false);
  // Browsers load the voice list late, so listen for it and give up after a short wait.
  window.speechSynthesis.addEventListener('voiceschanged', () => lookForVoice(false));
  setTimeout(() => lookForVoice(true), 1500);
}

export function subscribeVoice(listener: () => void): () => void {
  start();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getVoiceStatus(): VoiceStatus {
  return status;
}

/** Speaks Korean text. Returns false when no Korean voice is available. */
export function speak(text: string, rate: number): boolean {
  if (!voice) return false;
  const synth = window.speechSynthesis;
  synth.cancel(); // stop anything still playing
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voice;
  utterance.lang = voice.lang;
  utterance.rate = rate;
  synth.speak(utterance);
  return true;
}
