import { VIDEO_PLAYBACK_RATES } from './video-player.utils';

/**
 * Global, cross-lesson playback speed preference (localStorage-backed).
 *
 * Mirrors YouTube/Spotify behavior: once the user picks a speed it
 * applies to every subsequent video until they change it again, instead
 * of resetting to 1x on each new lesson.
 */
const PLAYBACK_RATE_STORAGE_KEY = 'soflia:video-playback-rate';
const DEFAULT_PLAYBACK_RATE = 1;

function isValidPlaybackRate(value: number): boolean {
  return VIDEO_PLAYBACK_RATES.includes(value);
}

export function getPreferredPlaybackRate(): number {
  if (typeof window === 'undefined') return DEFAULT_PLAYBACK_RATE;

  try {
    const stored = window.localStorage.getItem(PLAYBACK_RATE_STORAGE_KEY);
    if (stored === null) return DEFAULT_PLAYBACK_RATE;

    const parsed = Number(stored);
    return isValidPlaybackRate(parsed) ? parsed : DEFAULT_PLAYBACK_RATE;
  } catch {
    // localStorage puede lanzar en modo privado/incognito o con cuota
    // excedida; degradamos a la velocidad por defecto sin romper el player.
    return DEFAULT_PLAYBACK_RATE;
  }
}

export function setPreferredPlaybackRate(rate: number): void {
  if (typeof window === 'undefined' || !isValidPlaybackRate(rate)) return;

  try {
    window.localStorage.setItem(PLAYBACK_RATE_STORAGE_KEY, String(rate));
  } catch {
    // Fallo de escritura silencioso: la preferencia simplemente no persiste.
  }
}
