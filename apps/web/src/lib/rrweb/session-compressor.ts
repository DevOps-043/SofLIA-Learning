/**
 * Session Compressor
 * Comprime y descomprime grabaciones de sesión para reducir tamaño
 */

'use client';

import type { eventWithTime } from '@rrweb/types'
import type { RecordingSession } from './session-recorder.types';

// Límite máximo de tamaño (2MB)
export const MAX_SESSION_SIZE = 2 * 1024 * 1024;

// Tamaño objetivo después de recortar (1.5MB)
const TARGET_SIZE_AFTER_TRIM = 1.5 * 1024 * 1024;

/**
 * Comprime una cadena usando el algoritmo de compresión nativo del navegador
 * Fallback a base64 simple si CompressionStream no está disponible
 */
export async function compressString(input: string): Promise<string> {
  // Verificar si CompressionStream está disponible
  if (typeof CompressionStream !== 'undefined') {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(input);
      
      const cs = new CompressionStream('gzip');
      const writer = cs.writable.getWriter();
      writer.write(data);
      writer.close();
      
      const compressedData = await new Response(cs.readable).arrayBuffer();
      const compressedArray = new Uint8Array(compressedData);
      
      // Convertir a base64
      const binaryString = Array.from(compressedArray, byte => String.fromCharCode(byte)).join('');
      return 'gzip:' + btoa(binaryString);
    } catch (error) {
      console.warn('[SessionCompressor] Error en compresión nativa, usando fallback:', error);
    }
  }
  
  // Fallback: solo base64 sin compresión
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const binaryString = Array.from(data, byte => String.fromCharCode(byte)).join('');
  return 'raw:' + btoa(binaryString);
}

/**
 * Descomprime una cadena previamente comprimida
 */
export async function decompressString(compressed: string): Promise<string> {
  if (compressed.startsWith('gzip:')) {
    const base64Data = compressed.slice(5);
    
    if (typeof DecompressionStream !== 'undefined') {
      try {
        const binaryString = atob(base64Data);
        const data = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          data[i] = binaryString.charCodeAt(i);
        }
        
        const ds = new DecompressionStream('gzip');
        const writer = ds.writable.getWriter();
        writer.write(data);
        writer.close();
        
        const decompressedData = await new Response(ds.readable).arrayBuffer();
        const decoder = new TextDecoder();
        return decoder.decode(decompressedData);
      } catch (error) {
        console.error('[SessionCompressor] Error descomprimiendo:', error);
        throw error;
      }
    }
  }
  
  if (compressed.startsWith('raw:')) {
    const base64Data = compressed.slice(4);
    const binaryString = atob(base64Data);
    const data = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      data[i] = binaryString.charCodeAt(i);
    }
    const decoder = new TextDecoder();
    return decoder.decode(data);
  }
  
  // Compatibilidad con datos antiguos sin prefijo
  try {
    const binaryString = atob(compressed);
    const data = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      data[i] = binaryString.charCodeAt(i);
    }
    const decoder = new TextDecoder();
    return decoder.decode(data);
  } catch {
    return compressed;
  }
}

/**
 * Calcula el tamaño aproximado de una sesión en bytes
 */
export function getSessionSize(session: RecordingSession): number {
  const json = JSON.stringify(session);
  return new Blob([json]).size;
}

/**
 * Recorta una sesión para que quepa en el límite de tamaño
 * Mantiene el snapshot inicial y los eventos más recientes
 */
export function trimSessionToSize(session: RecordingSession, maxSize: number = TARGET_SIZE_AFTER_TRIM): RecordingSession {
  let currentSize = getSessionSize(session);
  
  if (currentSize <= maxSize) {
    return session;
  }
  
  
  const events = [...session.events];
  
  // Encontrar el snapshot inicial (tipo 2)
  const snapshotIndex = events.findIndex(e => e.type === 2);
  const snapshot = snapshotIndex !== -1 ? events[snapshotIndex] : null;
  
  // Remover eventos antiguos (excepto snapshot) hasta alcanzar el tamaño objetivo
  let trimmedEvents: eventWithTime[] = snapshot ? [snapshot] : [];
  const otherEvents = events.filter((_, i) => i !== snapshotIndex);
  
  // Agregar eventos desde el más reciente hacia atrás
  for (let i = otherEvents.length - 1; i >= 0; i--) {
    const testEvents = [snapshot, ...trimmedEvents.slice(1), otherEvents[i]].filter(
      (event): event is eventWithTime => Boolean(event)
    );
    const testSession = { ...session, events: testEvents };
    
    if (getSessionSize(testSession) <= maxSize) {
      trimmedEvents = testEvents;
    } else {
      break;
    }
  }
  
  // Ordenar eventos por timestamp
  trimmedEvents.sort((a, b) => a.timestamp - b.timestamp);
  
  const trimmedSession: RecordingSession = {
    ...session,
    events: trimmedEvents,
    startTime: trimmedEvents[0]?.timestamp || session.startTime,
    endTime: trimmedEvents[trimmedEvents.length - 1]?.timestamp || session.endTime
  };
  
  
  return trimmedSession;
}

/**
 * Comprime una sesión completa
 */
export async function compressSession(session: RecordingSession): Promise<{
  compressed: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}> {
  // Primero recortar si es necesario
  let sessionToCompress = session;
  const originalSize = getSessionSize(session);
  
  if (originalSize > MAX_SESSION_SIZE) {
    sessionToCompress = trimSessionToSize(session, TARGET_SIZE_AFTER_TRIM);
  }
  
  const json = JSON.stringify(sessionToCompress);
  const compressed = await compressString(json);
  const compressedSize = new Blob([compressed]).size;
  
  return {
    compressed,
    originalSize,
    compressedSize,
    compressionRatio: Math.round((1 - compressedSize / originalSize) * 100)
  };
}

/**
 * Descomprime una sesión
 */
export async function decompressSession(compressed: string): Promise<RecordingSession> {
  const json = await decompressString(compressed);
  return JSON.parse(json);
}

/**
 * Formatea bytes a string legible
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Verifica si una sesión excede el límite de tamaño
 */
export function isSessionTooLarge(session: RecordingSession): boolean {
  return getSessionSize(session) > MAX_SESSION_SIZE;
}
