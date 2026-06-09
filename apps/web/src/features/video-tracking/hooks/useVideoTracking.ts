import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useCallback, useRef, useEffect } from 'react';
import { useDebouncedCallback } from 'use-debounce';

/**
 * Opciones de configuración para el hook de tracking de video
 */
interface VideoTrackingOptions {
    /** ID de la lección que se está viendo */
    lessonId: string;
    /** ID del tracking activo (opcional) */
    trackingId?: string;
    /** Callback para manejar errores */
    onError?: (error: Error) => void;
}

/**
 * Tras este número de fallos consecutivos de red el tracking se desactiva.
 *
 * El tracking de video es telemetría "fire-and-forget": si la red no responde,
 * insistir solo satura el navegador. Antes, cada evento de video (`seeked`,
 * `ratechange`, `play`...) disparaba un `fetch` inmediato sin deduplicación ni
 * límite de fallos; al navegar fuera de la página el reproductor emitía eventos
 * en ráfaga y se generaban miles de peticiones por segundo
 * (`ERR_INSUFFICIENT_RESOURCES`), lo que tumbaba el resto de la app.
 */
const MAX_CONSECUTIVE_FAILURES = 3;

const UPDATE_PROGRESS_ENDPOINT = '/api/lesson-tracking/update-progress';

/**
 * Intervalo de debounce para `timeupdate` (ms).
 *
 * `timeupdate` se dispara varias veces por segundo; agrupamos sus reportes para
 * no saturar el backend.
 */
const PROGRESS_DEBOUNCE_MS = 5000;

/**
 * Flush forzado del debounce (ms).
 *
 * Sin `maxWait`, como `timeupdate` llega de forma continua durante la
 * reproducción, cada llamada reiniciaba el temporizador y el envío diferido
 * **nunca** se ejecutaba: el progreso intermedio jamás llegaba a la base de
 * datos y solo se guardaba en eventos discretos (play/pause/ended). Esto, junto
 * con el límite anti-salto del backend, hacía que un video visto completo se
 * persistiera con un máximo muy por debajo del real. `maxWait` garantiza un
 * envío al menos cada {@link PROGRESS_MAX_WAIT_MS}, manteniendo el máximo
 * alcanzado al día durante la reproducción continua.
 */
const PROGRESS_MAX_WAIT_MS = 5000;

/** Opciones internas para los eventos terminales del reproductor. */
interface UpdateProgressOptions {
    /**
     * Ignora la deduplicación in-flight. Reservado para el evento `ended`, que
     * es terminal y transporta la posición final del video: no debe perderse si
     * coincide con otro envío en curso.
     */
    bypassInFlight?: boolean;
    /**
     * Marca que el navegador emitió `ended`: prueba autoritativa de que la
     * reproducción llegó al final (el guard de avance impide alcanzarlo
     * saltando). El backend usa esta señal para registrar la completitud sin
     * depender del límite anti-salto basado en velocidad, garantizando que un
     * video visto completo nunca quede por debajo del umbral de completitud.
     */
    reachedEnd?: boolean;
}

/**
 * Hook personalizado para tracking de progreso de video.
 *
 * Registra eventos de video (play, pause, ended, etc.) y actualiza el progreso
 * en la base de datos con debouncing. Es resiliente por diseño:
 *
 * - **Deduplicación**: nunca hay más de una petición en vuelo a la vez.
 * - **Corte por fallos**: tras {@link MAX_CONSECUTIVE_FAILURES} fallos seguidos
 *   el tracking se desactiva para no saturar la red.
 * - **Seguro al desmontar**: no se emiten peticiones tras desmontar el hook.
 *
 * @example
 * ```tsx
 * const tracking = useVideoTracking({ lessonId, trackingId });
 * video.addEventListener('play', () =>
 *   tracking.handlePlay(video.currentTime, video.duration, video.playbackRate)
 * );
 * ```
 */
export function useVideoTracking({
    lessonId,
    trackingId,
    onError
}: VideoTrackingOptions) {
    // Última posición reportada (segundos).
    const lastProgressUpdate = useRef(0);
    // Punto máximo alcanzado en el video (segundos).
    const maxSecondsReached = useRef(0);
    // El hook sigue montado: bloquea peticiones tras desmontar.
    const isMountedRef = useRef(true);
    // Hay una petición en vuelo: evita ráfagas concurrentes.
    const inFlightRef = useRef(false);
    // Fallos de red consecutivos.
    const consecutiveFailuresRef = useRef(0);
    // El tracking se desactivó tras demasiados fallos.
    const trackingDisabledRef = useRef(false);

    useEffect(() => {
        isMountedRef.current = true;
        if (!lessonId) {
            techDebtLogger.warn(
                '[useVideoTracking] No se proporcionó lessonId — el tracking no funcionará'
            );
        }
        return () => {
            isMountedRef.current = false;
        };
    }, [lessonId]);

    /**
     * Envía el progreso del video al backend.
     *
     * No-op si: falta `lessonId`, el hook está desmontado, el tracking quedó
     * desactivado por fallos, o ya hay una petición en vuelo.
     */
    const updateProgress = useCallback(
        async (
            currentTime: number,
            duration: number,
            playbackRate: number,
            options?: UpdateProgressOptions
        ) => {
            if (!lessonId) return;
            if (!isMountedRef.current) return;
            if (trackingDisabledRef.current) return;
            if (inFlightRef.current && !options?.bypassInFlight) return;

            inFlightRef.current = true;
            maxSecondsReached.current = Math.max(
                maxSecondsReached.current,
                currentTime
            );

            try {
                const response = await fetch(UPDATE_PROGRESS_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        lessonId,
                        trackingId,
                        checkpoint: Math.floor(currentTime),
                        maxReached: Math.floor(maxSecondsReached.current),
                        totalDuration: Math.floor(duration),
                        playbackRate,
                        reachedEnd: options?.reachedEnd ?? false
                    }),
                    // Permite que un último envío sobreviva a la navegación
                    // sin necesidad de mantener viva la página.
                    keepalive: true
                });

                if (!response.ok) {
                    throw new Error(`Failed to update progress: ${response.status}`);
                }

                await response.json();
                consecutiveFailuresRef.current = 0;
                lastProgressUpdate.current = currentTime;
            } catch (error) {
                consecutiveFailuresRef.current += 1;

                if (consecutiveFailuresRef.current >= MAX_CONSECUTIVE_FAILURES) {
                    trackingDisabledRef.current = true;
                    techDebtLogger.warn(
                        '[VideoTracking] Tracking desactivado tras 3 fallos consecutivos para evitar saturar la red.'
                    );
                } else {
                    techDebtLogger.error(
                        '[VideoTracking] Error updating progress:',
                        error
                    );
                }

                onError?.(error as Error);
            } finally {
                inFlightRef.current = false;
            }
        },
        [lessonId, trackingId, onError]
    );

    /**
     * Versión con debouncing para actualizaciones frecuentes (timeupdate).
     * Agrupa los reportes cada {@link PROGRESS_DEBOUNCE_MS} y, gracias a
     * `maxWait`, garantiza un envío al menos cada {@link PROGRESS_MAX_WAIT_MS}
     * aunque `timeupdate` llegue de forma ininterrumpida.
     */
    const debouncedUpdate = useDebouncedCallback(updateProgress, PROGRESS_DEBOUNCE_MS, {
        maxWait: PROGRESS_MAX_WAIT_MS,
    });

    /** Cancela debounces pendientes al desmontar (además de {@link cleanup}). */
    useEffect(() => {
        return () => {
            debouncedUpdate.cancel();
        };
    }, [debouncedUpdate]);

    /** Handler para 'play': actualiza inmediatamente. */
    const handlePlay = useCallback(
        (currentTime: number, duration: number, playbackRate: number) => {
            void updateProgress(currentTime, duration, playbackRate);
        },
        [updateProgress]
    );

    /** Handler para 'pause': actualiza inmediatamente y cancela el debounce. */
    const handlePause = useCallback(
        (currentTime: number, duration: number, playbackRate: number) => {
            void updateProgress(currentTime, duration, playbackRate);
            debouncedUpdate.cancel();
        },
        [updateProgress, debouncedUpdate]
    );

    /**
     * Handler para 'ended': actualiza con la duración completa.
     *
     * Es el evento terminal y el más importante para registrar la completitud,
     * por lo que ignora la deduplicación in-flight: si justo coincide con un
     * envío diferido en curso, igual debe persistir la posición final.
     */
    const handleEnded = useCallback(
        (_currentTime: number, duration: number, playbackRate: number) => {
            debouncedUpdate.cancel();
            void updateProgress(duration, duration, playbackRate, {
                bypassInFlight: true,
                reachedEnd: true,
            });
        },
        [updateProgress, debouncedUpdate]
    );

    /** Handler para 'seeked': actualiza inmediatamente. */
    const handleSeeked = useCallback(
        (currentTime: number, duration: number, playbackRate: number) => {
            void updateProgress(currentTime, duration, playbackRate);
        },
        [updateProgress]
    );

    /**
     * Handler para 'timeupdate': debounced, y solo si avanzó ≥3 s desde la
     * última actualización reportada.
     */
    const handleTimeUpdate = useCallback(
        (currentTime: number, duration: number, playbackRate: number) => {
            if (Math.abs(currentTime - lastProgressUpdate.current) >= 3) {
                debouncedUpdate(currentTime, duration, playbackRate);
            }
        },
        [debouncedUpdate]
    );

    /** Handler para 'ratechange': actualiza inmediatamente. */
    const handleRateChange = useCallback(
        (currentTime: number, duration: number, playbackRate: number) => {
            void updateProgress(currentTime, duration, playbackRate);
        },
        [updateProgress]
    );

    /**
     * Cancela debounces pendientes. Debe llamarse al desmontar el componente
     * (el hook también lo hace automáticamente).
     */
    const cleanup = useCallback(() => {
        debouncedUpdate.cancel();
    }, [debouncedUpdate]);

    return {
        handlePlay,
        handlePause,
        handleEnded,
        handleSeeked,
        handleTimeUpdate,
        handleRateChange,
        cleanup
    };
}
