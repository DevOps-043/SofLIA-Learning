'use client';

/**
 * Componente para cargar y reproducir grabaciones de sesión desde URLs
 * Soporta archivos .json y .json.gz (comprimidos)
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { RecordingSession } from '../../../lib/rrweb/session-recorder';

// Importar dinámicamente el player para evitar SSR issues
const SessionPlayer = React.lazy(() => 
  import('./SessionPlayer').then(mod => ({ default: mod.SessionPlayer }))
);

interface SessionRecordingLoaderProps {
  /** URL del archivo de grabación (puede ser .json o .json.gz) */
  recordingUrl: string;
  /** Ancho del reproductor */
  width?: string | number;
  /** Alto del reproductor */
  height?: string | number;
  /** Iniciar automáticamente */
  autoPlay?: boolean;
  /** Mostrar controles */
  showController?: boolean;
  /** Saltar periodos de inactividad */
  skipInactive?: boolean;
  /** Velocidad de reproducción */
  speed?: number;
}

type LoadingState = 'idle' | 'downloading' | 'decompressing' | 'parsing' | 'ready' | 'error';

export function SessionRecordingLoader({
  recordingUrl,
  width = '100%',
  height = '600px',
  autoPlay = false,
  showController = true,
  skipInactive = true,
  speed = 1,
}: SessionRecordingLoaderProps) {
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [session, setSession] = useState<RecordingSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  /**
   * Descomprime datos gzip
   */
  const decompressGzip = async (compressedData: ArrayBuffer): Promise<string> => {
    // Usar DecompressionStream si está disponible (navegadores modernos)
    if ('DecompressionStream' in window) {
      try {
        const ds = new DecompressionStream('gzip');
        const decompressedStream = new Blob([compressedData]).stream().pipeThrough(ds);
        const decompressedBlob = await new Response(decompressedStream).blob();
        return await decompressedBlob.text();
      } catch (e) {
        console.warn('DecompressionStream falló, intentando con pako...');
      }
    }

    // Fallback: Usar pako
    try {
      const pako = await import('pako');
      const uint8Array = new Uint8Array(compressedData);
      const decompressed = pako.inflate(uint8Array);
      const decoder = new TextDecoder('utf-8');
      return decoder.decode(decompressed);
    } catch (e) {
      throw new Error('No se pudo descomprimir el archivo');
    }
  };

  /**
   * Carga la grabación desde la URL
   */
  const loadRecording = useCallback(async () => {
    if (!recordingUrl) {
      setError('No se proporcionó URL de grabación');
      return;
    }

    try {
      setLoadingState('downloading');
      setProgress(10);
      setError(null);

      // Descargar el archivo
      const response = await fetch(recordingUrl);
      
      if (!response.ok) {
        throw new Error(`Error al descargar: ${response.status} ${response.statusText}`);
      }

      const contentLength = response.headers.get('Content-Length');
      const totalSize = contentLength ? parseInt(contentLength, 10) : 0;
      
      // Leer el contenido como ArrayBuffer para manejar gzip
      const arrayBuffer = await response.arrayBuffer();
      setProgress(50);

      const isGzipped = recordingUrl.endsWith('.gz') || 
                        recordingUrl.includes('.json.gz') ||
                        response.headers.get('Content-Type')?.includes('gzip');

      let jsonString: string;

      if (isGzipped) {
        setLoadingState('decompressing');
        setProgress(60);
        jsonString = await decompressGzip(arrayBuffer);
      } else {
        const decoder = new TextDecoder('utf-8');
        jsonString = decoder.decode(arrayBuffer);
      }

      setLoadingState('parsing');
      setProgress(80);

      // Parsear el JSON
      let parsedData: { events: Array<{ type: number }> };
      
      // Si el string empieza con "gzip:", es nuestro formato personalizado
      if (jsonString.startsWith('gzip:')) {
        // Decodificar base64 y descomprimir
        const base64Data = jsonString.slice(5); // Quitar "gzip:"
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const decompressed = await decompressGzip(bytes.buffer);
        parsedData = JSON.parse(decompressed);
      } else {
        parsedData = JSON.parse(jsonString);
      }

      // Validar estructura de la sesión
      if (!parsedData || !Array.isArray(parsedData.events)) {
        throw new Error('Formato de grabación inválido: no contiene eventos');
      }

      if (parsedData.events.length === 0) {
        throw new Error('La grabación no contiene eventos');
      }

      // Verificar que haya snapshot inicial
      const hasSnapshot = parsedData.events.some((e: { type: number }) => e.type === 2);
      if (!hasSnapshot) {
        console.warn('⚠️ La grabación no contiene snapshot inicial');
      }


      setSession(parsedData as RecordingSession);
      setLoadingState('ready');
      setProgress(100);

    } catch (err) {
      console.error('❌ Error cargando grabación:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar la grabación');
      setLoadingState('error');
    }
  }, [recordingUrl]);

  useEffect(() => {
    loadRecording();
  }, [loadRecording]);

  // Estados de carga
  if (loadingState === 'idle' || loadingState === 'downloading') {
    return (
      <LoadingOverlay 
        message="Descargando grabación..." 
        progress={progress}
        icon="download"
      />
    );
  }

  if (loadingState === 'decompressing') {
    return (
      <LoadingOverlay 
        message="Descomprimiendo archivo..." 
        progress={progress}
        icon="decompress"
      />
    );
  }

  if (loadingState === 'parsing') {
    return (
      <LoadingOverlay 
        message="Procesando eventos..." 
        progress={progress}
        icon="process"
      />
    );
  }

  if (loadingState === 'error' || error) {
    return (
      <ErrorOverlay 
        message={error || 'Error desconocido'}
        onRetry={loadRecording}
      />
    );
  }

  if (!session) {
    return (
      <ErrorOverlay 
        message="No se pudo cargar la sesión"
        onRetry={loadRecording}
      />
    );
  }

  // Mostrar el reproductor
  return (
    <React.Suspense fallback={<LoadingOverlay message="Cargando reproductor..." progress={95} icon="process" />}>
      <SessionPlayer
        session={session}
        width={width}
        height={height}
        autoPlay={autoPlay}
        showController={showController}
        skipInactive={skipInactive}
        speed={speed}
      />
    </React.Suspense>
  );
}

/**
 * Overlay de carga con progreso
 */
interface LoadingOverlayProps {
  message: string;
  progress?: number;
  icon?: 'download' | 'decompress' | 'process';
}

function LoadingOverlay({ message, progress = 0, icon = 'process' }: LoadingOverlayProps) {
  const icons = {
    download: (
      <svg className="w-12 h-12 text-blue-500 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    ),
    decompress: (
      <svg className="w-12 h-12 text-purple-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
      </svg>
    ),
    process: (
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    )
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg min-h-[300px]">
      {icons[icon]}
      <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">{message}</p>
      {progress > 0 && (
        <div className="mt-4 w-full max-w-xs">
          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 text-center">{progress}%</p>
        </div>
      )}
    </div>
  );
}

/**
 * Overlay de error
 */
interface ErrorOverlayProps {
  message: string;
  onRetry?: () => void;
}

function ErrorOverlay({ message, onRetry }: ErrorOverlayProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg min-h-[300px] border-2 border-red-200 dark:border-red-800">
      <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="mt-4 text-red-600 dark:text-red-400 font-medium text-center">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}

/**
 * Info compacta de la grabación antes de reproducir
 */
interface RecordingInfoProps {
  recordingSize?: string | null;
  recordingDuration?: number | null;
}

export function RecordingInfo({ recordingSize, recordingDuration }: RecordingInfoProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  return (
    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
      {recordingSize && (
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
          </svg>
          {recordingSize}
        </span>
      )}
      {recordingDuration && (
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {formatDuration(recordingDuration)}
        </span>
      )}
    </div>
  );
}
