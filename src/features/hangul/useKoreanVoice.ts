import { useSyncExternalStore } from 'react';
import { getVoiceStatus, subscribeVoice, type VoiceStatus } from '../../lib/speech';

/** 'checking' | 'available' | 'unavailable'. Re-renders the component when it changes. */
export function useKoreanVoice(): VoiceStatus {
  return useSyncExternalStore(subscribeVoice, getVoiceStatus, () => 'checking');
}
