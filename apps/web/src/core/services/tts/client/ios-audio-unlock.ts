'use client';

/**
 * Desbloqueo de audio para iOS / WebKit.
 *
 * En iOS TODOS los navegadores (Safari, Chrome, Edge…) usan WebKit por política de
 * Apple, y WebKit solo permite `HTMLMediaElement.play()` sobre un elemento que YA
 * fue reproducido dentro de un gesto de usuario. La voz de SofLIA reproduce cada
 * fragmento desde un `useEffect` (tras el `fetch` de síntesis TTS), es decir FUERA
 * de la pila del gesto, por lo que iOS rechaza el `play()` con `NotAllowedError` de
 * forma silenciosa. El resto de plataformas (Android, Windows, desktop) usan una
 * política de autoplay más permisiva y no se ven afectadas.
 *
 * Patrón estándar (el mismo de Howler.js): mantener UN único `HTMLAudioElement`
 * reutilizable y "bendecirlo" en el primer gesto real del usuario reproduciendo un
 * clip silencioso. A partir de ahí iOS permite cambiar su `src` y reproducir sin
 * gesto, así que TODA la voz debe pasar por ESTE mismo elemento. El desbloqueo es
 * inocuo donde no hace falta.
 */

// Eventos de gesto que cuentan como "user activation" en WebKit. Se escuchan en
// captura para bendecir el elemento lo antes posible dentro del primer toque/clic.
const GESTURE_EVENTS = ['pointerdown', 'touchend', 'mousedown', 'keydown'] as const;

let sharedAudio: HTMLAudioElement | null = null;
let blessed = false;
let listening = false;

/**
 * Genera un WAV de silencio mínimo y válido como data URI. Se construye en código
 * (no se memoriza un base64 frágil) y iOS reproduce WAV/PCM de forma nativa, así
 * que sirve para bendecir el elemento sin emitir sonido audible.
 */
function createSilentWavDataUri(): string {
  const sampleRate = 8000;
  const numSamples = 8; // ~1 ms: suficiente para que `play()` arranque.
  const bytesPerSample = 2; // 16-bit PCM mono
  const dataSize = numSamples * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // tamaño del sub-chunk fmt (PCM)
  view.setUint16(20, 1, true); // formato PCM
  view.setUint16(22, 1, true); // canales: mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true); // byte rate
  view.setUint16(32, bytesPerSample, true); // block align
  view.setUint16(34, 16, true); // bits por muestra
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);
  // Las muestras quedan en cero = silencio.

  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}

/**
 * Devuelve el `HTMLAudioElement` compartido (creándolo de forma perezosa) por el
 * que DEBE pasar toda la reproducción de voz. Al crearlo registra el desbloqueo,
 * de modo que cualquier código que toque audio deja listos los listeners de gesto.
 * Devuelve `null` en SSR.
 */
export function getSharedAudioElement(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;

  if (!sharedAudio) {
    sharedAudio = new Audio();
    sharedAudio.preload = 'auto';
    // `playsinline` evita que iOS intente abrir un reproductor a pantalla completa.
    sharedAudio.setAttribute('playsinline', 'true');
    registerAudioUnlock();
  }

  return sharedAudio;
}

function detachGestureListeners(): void {
  if (typeof window === 'undefined' || !listening) return;
  listening = false;
  GESTURE_EVENTS.forEach((event) =>
    window.removeEventListener(event, handleUnlockGesture, true),
  );
}

function handleUnlockGesture(): void {
  const audio = getSharedAudioElement();
  if (!audio || blessed) return;

  try {
    // Reproducir un clip silencioso DENTRO del gesto "bendice" el elemento: iOS
    // permitirá reproducciones programáticas posteriores sobre este mismo nodo.
    audio.src = createSilentWavDataUri();
    const playback = audio.play();
    Promise.resolve(playback)
      .then(() => {
        audio.pause();
        try {
          audio.currentTime = 0;
        } catch {
          /* algunos WebKit lanzan si no hay duración; irrelevante para el bless */
        }
        blessed = true;
        detachGestureListeners();
      })
      .catch(() => {
        // Gesto no concluyente (p. ej. scroll): se reintenta en el próximo gesto.
      });
  } catch {
    /* entorno sin soporte de audio: se reintenta en el próximo gesto */
  }
}

/**
 * Registra (una sola vez) los listeners de gesto que bendicen el elemento de audio
 * compartido. Idempotente y seguro en SSR: llamarlo desde varias superficies de voz
 * no tiene coste. Conviene invocarlo al montar la UI de voz para que los listeners
 * estén activos ANTES del primer envío del usuario.
 */
export function registerAudioUnlock(): void {
  if (typeof window === 'undefined' || listening || blessed) return;
  listening = true;
  GESTURE_EVENTS.forEach((event) =>
    window.addEventListener(event, handleUnlockGesture, { capture: true, passive: true }),
  );
}

/** `true` si el elemento de audio compartido ya fue bendecido por un gesto. */
export function isAudioUnlocked(): boolean {
  return blessed;
}
