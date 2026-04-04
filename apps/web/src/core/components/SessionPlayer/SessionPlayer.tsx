/**
 * Componente para reproducir sesiones grabadas con rrweb
 */
'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { RecordingSession } from '../../../lib/rrweb/session-recorder';
import { loadRrwebPlayer } from '../../../lib/rrweb/rrweb-loader';
import type { RrwebPlayerInstance } from '../../../lib/rrweb/rrweb-loader';
// Estilos de rrweb-player
import 'rrweb-player/dist/style.css';
// Estilos personalizados para el reproductor
import './SessionPlayer.css';

interface SessionPlayerProps {
  session: RecordingSession;
  width?: string | number;
  height?: string | number;
  autoPlay?: boolean;
  showController?: boolean;
  skipInactive?: boolean;
  speed?: number;
}

export function SessionPlayer({
  session,
  width = '100%',
  height = '600px',
  autoPlay = false,
  showController = true,
  skipInactive = true,
  speed = 1,
}: SessionPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<RrwebPlayerInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {

    if (!session.events.length) {
      console.warn('⚠️ SessionPlayer: No hay eventos para reproducir')
      setError('No hay eventos para reproducir');
      setIsLoading(false);
      return;
    }

    let attemptCount = 0;
    const maxAttempts = 50; // Máximo 50 intentos (unos 3 segundos)

    // Función asíncrona para inicializar el player
    const initializePlayer = async () => {
      attemptCount++;
      
      if (!containerRef.current) {
        if (attemptCount >= maxAttempts) {
          console.error('❌ Timeout: Contenedor no disponible después de', maxAttempts, 'intentos');
          setError('Error: No se pudo cargar el reproductor (timeout)');
          setIsLoading(false);
          return;
        }

        requestAnimationFrame(() => initializePlayer());
        return;
      }

      const container = containerRef.current;

      try {

        // Cargar rrweb-player dinámicamente
        const RrwebPlayer = await loadRrwebPlayer();
        
        if (!RrwebPlayer) {
          throw new Error('No se pudo cargar rrweb-player');
        }

        // Validar que tenemos eventos válidos
        if (!session.events || session.events.length === 0) {
          throw new Error('No hay eventos válidos para reproducir');
        }

        // Verificar que tenemos snapshot inicial (tipo 2)
        const hasSnapshot = session.events.some((e: { type: number }) => e.type === 2);
        if (!hasSnapshot) {
          console.warn('⚠️ No se encontró snapshot inicial en los eventos');
        }

        // Limpiar player anterior si existe
        if (playerRef.current) {
          try {
            playerRef.current.pause();
            if (typeof playerRef.current.destroy === 'function') {
              playerRef.current.destroy();
            }
          } catch (cleanupError) {
            console.warn('⚠️ Error al limpiar player anterior:', cleanupError);
          }
          container.innerHTML = '';
        }

        // Crear nuevo player usando el módulo cargado dinámicamente
        const PlayerClass = RrwebPlayer;
        
        // Usar dimensiones fijas para asegurar escalado correcto
        playerRef.current = new PlayerClass({
          target: container,
          props: {
            events: session.events,
            width: 800,  // Ancho fijo
            height: 520, // Alto fijo (deja espacio para controles)
            autoPlay: autoPlay,
            showController: showController,
            skipInactive: skipInactive,
            speed: speed,
            mouseTail: true,
            UNSAFE_replayCanvas: false,
          },
        });

        setIsLoading(false);
        setError(null);
      } catch (err) {
        console.error('❌ Error inicializando player:', err);
        console.error('   Stack:', (err as Error).stack);
        setError('Error al cargar la reproducción: ' + ((err as Error).message || 'Error desconocido'));
        setIsLoading(false);
      }
    };

    // Iniciar el proceso
    initializePlayer();

    // Cleanup
    return () => {
      if (playerRef.current) {
        try {
          if (typeof playerRef.current.pause === 'function') {
            playerRef.current.pause();
          }
          if (typeof playerRef.current.destroy === 'function') {
            playerRef.current.destroy();
          }
          if (containerRef.current) {
            containerRef.current.innerHTML = '';
          }
        } catch (err) {
          console.error('Error al limpiar player:', err);
        }
        playerRef.current = null;
      }
    };
  }, [session, width, height, autoPlay, showController, skipInactive, speed]);

  return (
    <div 
      className="session-player-wrapper" 
      style={{ 
        width: '100%', 
        minHeight: '600px',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f0f23',
        borderRadius: '12px',
        overflow: 'hidden'
      }}
    >
      {/* Div del player - SIEMPRE presente */}
      <div 
        ref={containerRef} 
        style={{ 
          display: isLoading || error ? 'none' : 'block'
        }} 
      />
      
      {/* Overlay de loading */}
      {isLoading && (
        <div
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f3f4f6',
            borderRadius: '0.5rem'
          }}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando reproducción...</p>
          </div>
        </div>
      )}
      
      {/* Overlay de error */}
      {error && (
        <div
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fef2f2',
            border: '2px solid #fecaca',
            borderRadius: '0.5rem'
          }}
        >
          <div className="text-center px-4">
            <svg
              className="w-12 h-12 text-red-500 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Componente compacto para mostrar info de la sesión
 */
interface SessionInfoProps {
  session: RecordingSession;
  showSize?: boolean;
}

export function SessionInfo({ session, showSize = true }: SessionInfoProps) {
  const duration = session.endTime
    ? session.endTime - session.startTime
    : 0;

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getSize = () => {
    const json = JSON.stringify(session);
    const bytes = new Blob([json]).size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-gray-600">Eventos grabados:</span>
        <span className="font-medium">{session.events.length}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-gray-600">Duración:</span>
        <span className="font-medium">{formatDuration(duration)}</span>
      </div>
      {showSize && (
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Tamaño:</span>
          <span className="font-medium">{getSize()}</span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="text-gray-600">Inicio:</span>
        <span className="font-medium text-xs">
          {new Date(session.startTime).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
