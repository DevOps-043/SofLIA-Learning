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
        async (currentTime: number, duration: number, playbackRate: number) => {
            if (!lessonId) return;
            if (!isMountedRef.current) return;
            if (trackingDisabledRef.current) return;
            if (inFlightRef.current) return;

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
                        playbackRate
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
     * Se ejecuta máximo cada 5 segundos.
     */
    const debouncedUpdate = useDebouncedCallback(updateProgress, 5000);

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

    /** Handler para 'ended': actualiza con la duración completa. */
    const handleEnded = useCallback(
        (_currentTime: number, duration: number, playbackRate: number) => {
            void updateProgress(duration, duration, playbackRate);
            debouncedUpdate.cancel();
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
