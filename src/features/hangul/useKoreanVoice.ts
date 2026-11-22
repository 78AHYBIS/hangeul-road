import { useSyncExternalStore } from 'react';
import {
  getKoreanVoices,
  getVoiceStatus,
  subscribeVoice,
  type KoreanVoice,
  type VoiceStatus,
} from '../../lib/speech';

/** 'checking' | 'available' | 'unavailable'. Re-renders the component when it changes. */
export function useKoreanVoice(): VoiceStatus {
  return useSyncExternalStore(subscribeVoice, getVoiceStatus, () => 'checking');
}

const NO_VOICES: KoreanVoice[] = [];

/** Every Korean voice on this device (for the voice picker in Me). */
export function useKoreanVoices(): KoreanVoice[] {
  return useSyncExternalStore(subscribeVoice, getKoreanVoices, () => NO_VOICES);
}
