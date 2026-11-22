/**
 * Korean pronunciation through the browser's built-in speech (Web Speech API).
 * A tiny store: components subscribe with the useKoreanVoice / useKoreanVoices hooks
 * and re-render when the status or the voice list changes.
 *
 * The voice used is the one chosen in Me (`settings.voiceURI`, passed in through
 * `setPreferredVoice`), or the first Korean voice when none is chosen or the chosen one
 * is gone (for example after a backup is restored on another phone).
 */

export type VoiceStatus = 'checking' | 'available' | 'unavailable';

/** What the voice picker needs to show about one voice. */
export interface KoreanVoice {
  uri: string;
  name: string;
  /** False for voices that the browser fetches from the internet (no audio offline). */
  local: boolean;
}

let status: VoiceStatus = 'checking';
let voices: SpeechSynthesisVoice[] = [];
let voiceList: KoreanVoice[] = [];
let preferredURI = '';
let started = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

/** True for Korean voices. Some Android browsers report "ko_KR" instead of "ko-KR". */
export function isKoreanLang(lang: string): boolean {
  return lang.replace('_', '-').toLowerCase().startsWith('ko');
}

/**
 * The voice to speak with: the preferred one if the device still has it, otherwise the
 * first. Pure, so it is unit-tested without a browser.
 */
export function pickVoice<T extends { voiceURI: string }>(list: T[], preferred: string): T | null {
  return list.find((v) => v.voiceURI === preferred) ?? list[0] ?? null;
}

function lookForVoices(giveUpIfMissing: boolean) {
  const found = window.speechSynthesis.getVoices().filter((v) => isKoreanLang(v.lang));
  const changed =
    found.length !== voices.length || found.some((v, i) => v.voiceURI !== voices[i]?.voiceURI);
  if (changed) {
    voices = found;
    voiceList = found.map((v) => ({ uri: v.voiceURI, name: v.name, local: v.localService }));
  }
  const next: VoiceStatus = found.length ? 'available' : giveUpIfMissing ? 'unavailable' : status;
  if (changed || next !== status) {
    status = next;
    notify();
  }
}

function start() {
  if (started) return;
  started = true;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    status = 'unavailable';
    notify();
    return;
  }
  lookForVoices(false);
  // Browsers load the voice list late, so listen for it and give up after a short wait.
  window.speechSynthesis.addEventListener('voiceschanged', () => lookForVoices(false));
  setTimeout(() => lookForVoices(true), 1500);
}

export function subscribeVoice(listener: () => void): () => void {
  start();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getVoiceStatus(): VoiceStatus {
  return status;
}

/** Every Korean voice on this device, in the order the browser lists them. */
export function getKoreanVoices(): KoreanVoice[] {
  return voiceList;
}

/** Called by the app whenever the voice setting changes ('' = first Korean voice). */
export function setPreferredVoice(uri: string): void {
  preferredURI = uri;
}

/** The voice that `speak` will use right now (for showing "in use" in the picker). */
export function currentVoiceURI(): string {
  return pickVoice(voices, preferredURI)?.voiceURI ?? '';
}

/**
 * Speaks Korean text. Returns false when no Korean voice is available.
 * `voiceURI` overrides the chosen voice once (the Test button in the picker).
 */
export function speak(text: string, rate: number, voiceURI?: string): boolean {
  const voice = pickVoice(voices, voiceURI ?? preferredURI);
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
