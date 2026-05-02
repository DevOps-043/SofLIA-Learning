/**
 * Hook global para grabar sesiones en background.
 *
 * CORTOCIRCUITOS DE EFICIENCIA (performance mobile):
 * - Antes de inicializar, consulta `evaluateRecordingGate()` y sale si
 *   el entorno no es apto (mobile viewport, save-data, reduced-motion,
 *   flag de opt-out, etc.).
 * - Salta el ciclo de restart cuando la pestaña está oculta para evitar
 *   snapshots costosos en background.
 */

'use client';

import { useEffect, useRef } from 'react';
import { evaluateRecordingGate } from './recording-gate';

const RECOVERY_CHECK_INTERVAL_MS = 300000;

// Flags globales para evitar inicializaciones duplicadas entre remounts.
let isInitialized = false;
let errorInterceptorStarted = false;

export function useGlobalRecorder() {
  const mountedRef = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const decision = evaluateRecordingGate();
    if (!decision.allowed) {
      if (process.env.NODE_ENV === 'development') {
        console.info('[GlobalRecorder] Grabación omitida:', decision.reason);
      }
      return;
    }

    mountedRef.current = true;

    if (isInitialized) {
      return;
    }

    const initRecorder = async () => {
      try {
        const { sessionRecorder } = await import('./session-recorder');

        if (!mountedRef.current) return;

        if (!sessionRecorder || typeof sessionRecorder.startRecording !== 'function') {
          console.warn('[GlobalRecorder] sessionRecorder no disponible');
          return;
        }

        if (!errorInterceptorStarted) {
          try {
            const { startErrorInterceptor } = await import('./error-interceptor');
            startErrorInterceptor();
            errorInterceptorStarted = true;
          } catch {
            // Silenciar: no bloquear la grabación por fallo del interceptor
          }
        }

        const isActive = typeof sessionRecorder.isActive === 'function' && sessionRecorder.isActive();
        if (!isActive) {
          try {
            await sessionRecorder.startRecording();
          } catch {
            // Silenciar errores de grabación ya activa
          }
        }

        isInitialized = true;

        if (!intervalRef.current) {
          intervalRef.current = setInterval(async () => {
            if (!mountedRef.current) return;

            // Evitar snapshots costosos cuando la pestaña está oculta:
            // rrweb.record re-toma el snapshot del DOM al reiniciar, lo cual
            // es inútil en background y genera picos de CPU.
            if (typeof document !== 'undefined' && document.hidden) {
              return;
            }

            try {
              const mod = await import('./session-recorder');
              const recorder = mod.sessionRecorder;

              if (!recorder || typeof recorder.isActive !== 'function') return;

              if (!recorder.isActive()) {
                await recorder.startRecording();
              }
            } catch {
              // Silenciar errores de grabación
            }
          }, RECOVERY_CHECK_INTERVAL_MS);
        }
      } catch (error) {
        console.error('[GlobalRecorder] Error inicializando recorder:', error);
      }
    };

    initRecorder();

    // Pausa/reanudación según visibilidad de la pestaña.
    // Usa la API pause/resume existente del recorder.
    const onVisibilityChange = () => {
      if (!mountedRef.current) return;
      import('./session-recorder').then((mod) => {
        const recorder = mod.sessionRecorder;
        if (!recorder) return;
        if (document.hidden) {
          if (typeof recorder.pause === 'function' && recorder.isActive?.()) {
            recorder.pause();
          }
        } else {
          if (typeof recorder.resume === 'function' && recorder.isPaused?.()) {
            recorder.resume();
          }
        }
      }).catch(() => {
        // Silenciar: la pausa/reanudación es best-effort
      });
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      mountedRef.current = false;

      document.removeEventListener('visibilitychange', onVisibilityChange);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);
}
