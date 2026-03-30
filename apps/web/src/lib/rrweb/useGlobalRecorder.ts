/**
 * Hook global para grabar sesiones en background
 * Se inicia automáticamente al montar la app y mantiene los últimos 3 minutos
 * 
 * VERSIÓN SIMPLIFICADA:
 * - Evita race conditions verificando existencia de métodos
 * - No usa detector de inactividad por ahora (causaba errores)
 */

'use client';

import { useEffect, useRef } from 'react';

// Flag global para evitar inicializaciones duplicadas
let isInitialized = false;
let errorInterceptorStarted = false;

export function useGlobalRecorder() {
  const mountedRef = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Solo en el cliente
    if (typeof window === 'undefined') return;
    
    mountedRef.current = true;

    // Si ya está inicializado, no hacer nada
    if (isInitialized) {
      return;
    }

    const initRecorder = async () => {
      try {
        // Cargar el módulo
        const { sessionRecorder } = await import('./session-recorder');
        
        // Verificar que el componente siga montado
        if (!mountedRef.current) {
          return;
        }

        // Verificar que sessionRecorder tenga los métodos necesarios
        if (!sessionRecorder || typeof sessionRecorder.startRecording !== 'function') {
          console.warn('[Global] ⚠️ sessionRecorder no está disponible o no tiene los métodos requeridos');
          return;
        }

        // Iniciar error interceptor (si no está iniciado)
        if (!errorInterceptorStarted) {
          try {
            const { startErrorInterceptor } = await import('./error-interceptor');
            startErrorInterceptor();
            errorInterceptorStarted = true;
          } catch (e) {
            // Silenciar
          }
        }

        // Solo iniciar grabación si no hay una activa
        const isActive = typeof sessionRecorder.isActive === 'function' && sessionRecorder.isActive();
        
        if (!isActive) {
          try {
            await sessionRecorder.startRecording(180000); // 3 minutos
          } catch (error) {
            // Silenciar errores de grabación ya activa
          }
        } else {
        }
        
        isInitialized = true;

        // Reiniciar grabación cada 3 minutos
        if (!intervalRef.current) {
          intervalRef.current = setInterval(async () => {
            if (!mountedRef.current) return;
            
            try {
              const mod = await import('./session-recorder');
              const recorder = mod.sessionRecorder;
              
              if (!recorder || typeof recorder.isActive !== 'function') return;
              
              // Verificar si hay grabación activa antes de detener
              if (!recorder.isActive()) {
                await recorder.startRecording(180000);
                return;
              }
              
              // Detener y reiniciar
              if (typeof recorder.stop === 'function') {
                recorder.stop();
              }
              
              await new Promise(resolve => setTimeout(resolve, 300));
              
              if (mountedRef.current) {
                await recorder.startRecording(180000);
              }
            } catch (error) {
              // Silenciar errores
            }
          }, 180000); // 3 minutos
        }
      } catch (error) {
        console.error('[Global] Error inicializando recorder:', error);
      }
    };

    initRecorder();

    // Cleanup
    return () => {
      mountedRef.current = false;
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);
}
