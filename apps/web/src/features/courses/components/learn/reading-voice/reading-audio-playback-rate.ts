/**
 * Playback speed options and localStorage-backed preference for reading audio.
 *
 * Mirrors the video player behavior (`CustomVideoPlayer/player/video-playback-rate-preference.ts`):
 * once the user picks a speed it applies to every subsequent reading until they
 * change it again, instead of resetting to 1x on each new lesson. The preference
 * is intentionally separate from the video one so each media type keeps its own.
 */
export const READING_AUDIO_PLAYBACK_RATES: readonly number[] = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

const PLAYBACK_RATE_STORAGE_KEY = 'soflia:reading-audio-playback-rate';
const DEFAULT_PLAYBACK_RATE = 1;

export function isValidReadingAudioPlaybackRate(value: number): boolean {
  return READING_AUDIO_PLAYBACK_RATES.includes(value);
}

export function getPreferredReadingAudioPlaybackRate(): number {
  if (typeof window === 'undefined') return DEFAULT_PLAYBACK_RATE;

  try {
    const stored = window.localStorage.getItem(PLAYBACK_RATE_STORAGE_KEY);
    if (stored === null) return DEFAULT_PLAYBACK_RATE;

    const parsed = Number(stored);
    return isValidReadingAudioPlaybackRate(parsed) ? parsed : DEFAULT_PLAYBACK_RATE;
  } catch {
    // localStorage puede lanzar en modo privado/incognito o con cuota
    // excedida; degradamos a la velocidad por defecto sin romper el player.
    return DEFAULT_PLAYBACK_RATE;
  }
}

export function setPreferredReadingAudioPlaybackRate(rate: number): void {
  if (typeof window === 'undefined' || !isValidReadingAudioPlaybackRate(rate)) return;

  try {
    window.localStorage.setItem(PLAYBACK_RATE_STORAGE_KEY, String(rate));
  } catch {
    // Fallo de escritura silencioso: la preferencia simplemente no persiste.
  }
}
