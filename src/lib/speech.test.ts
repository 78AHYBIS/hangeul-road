import { describe, expect, it } from 'vitest';
import { isKoreanLang, pickVoice } from './speech';

const voices = [{ voiceURI: 'yuna' }, { voiceURI: 'google-ko' }, { voiceURI: 'sora-premium' }];

describe('pickVoice', () => {
  it('uses the chosen voice when the device has it', () => {
    expect(pickVoice(voices, 'sora-premium')?.voiceURI).toBe('sora-premium');
  });

  it('falls back to the first Korean voice when none is chosen', () => {
    expect(pickVoice(voices, '')?.voiceURI).toBe('yuna');
  });

  it('falls back to the first Korean voice when the chosen one is gone', () => {
    // e.g. a backup restored on a phone that does not have that voice
    expect(pickVoice(voices, 'removed-voice')?.voiceURI).toBe('yuna');
  });

  it('returns null when the device has no Korean voice', () => {
    expect(pickVoice([], 'yuna')).toBeNull();
  });
});

describe('isKoreanLang', () => {
  it('accepts the different ways browsers write Korean', () => {
    expect(isKoreanLang('ko-KR')).toBe(true);
    expect(isKoreanLang('ko_KR')).toBe(true);
    expect(isKoreanLang('KO')).toBe(true);
    expect(isKoreanLang('en-US')).toBe(false);
  });
});
