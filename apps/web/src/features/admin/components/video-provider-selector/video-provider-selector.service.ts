import {
  COURSE_VIDEO_MAX_SIZE_BYTES,
  STREAMABLE_VIDEO_MIME_TYPES,
  isStreamableVideoMimeType,
} from '@/lib/media/video-upload-policy';
import type { VideoProvider } from './types';

export const ALLOWED_VIDEO_MIME_TYPES = STREAMABLE_VIDEO_MIME_TYPES;

export const MAX_VIDEO_SIZE_BYTES = COURSE_VIDEO_MAX_SIZE_BYTES;

export function formatVideoDuration(durationSeconds: number): string {
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = Math.floor(durationSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function validateVideoFile(file: Pick<File, 'type' | 'size'>): string | null {
  if (!isStreamableVideoMimeType(file.type)) {
    return 'Tipo de video no válido. Solo se permiten MP4 o WebM';
  }

  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    return 'El video excede el tamaño máximo de 1GB';
  }

  return null;
}

export function shouldDetectVideoDuration(provider: VideoProvider, value: string): boolean {
  const trimmedValue = value.trim();
  if (!trimmedValue || provider === 'direct') {
    return false;
  }

  if (provider === 'custom') {
    return trimmedValue.startsWith('http://') || trimmedValue.startsWith('https://');
  }

  return true;
}

async function requestHostedVideoDuration(provider: 'youtube' | 'vimeo', videoIdOrUrl: string): Promise<number | null> {
  const response = await fetch('/api/admin/video-duration', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, videoIdOrUrl }),
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.duration || null;
}

export async function detectCustomUrlDuration(url: string): Promise<number | null> {
  try {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.crossOrigin = 'anonymous';

    return await new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(null), 10000);

      video.onloadedmetadata = () => {
        clearTimeout(timeout);
        const duration = video.duration;
        if (!isNaN(duration) && isFinite(duration)) {
          resolve(Math.floor(duration));
          return;
        }
        resolve(null);
      };

      video.onerror = () => {
        clearTimeout(timeout);
        resolve(null);
      };

      video.src = url;
    });
  } catch {
    return null;
  }
}

export async function requestVideoDuration(provider: VideoProvider, value: string): Promise<number | null> {
  if (!shouldDetectVideoDuration(provider, value)) {
    return null;
  }

  if (provider === 'youtube' || provider === 'vimeo') {
    return requestHostedVideoDuration(provider, value);
  }

  if (provider === 'custom') {
    return detectCustomUrlDuration(value);
  }

  return null;
}

export function attachVideoMetadataListener(
  url: string,
  onDuration: (durationSeconds: number) => void
): () => void {
  const video = document.createElement('video');
  video.preload = 'metadata';
  video.muted = true;
  video.crossOrigin = 'anonymous';

  const handleLoadedMetadata = () => {
    const duration = video.duration;
    if (!isNaN(duration) && isFinite(duration) && duration > 0) {
      onDuration(Math.floor(duration));
    }
  };

  const handleError = () => {
    // noop
  };

  video.addEventListener('loadedmetadata', handleLoadedMetadata);
  video.addEventListener('error', handleError);

  const timeoutId = setTimeout(() => {
    video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    video.removeEventListener('error', handleError);
    video.src = '';
  }, 10000);

  video.src = url;

  return () => {
    clearTimeout(timeoutId);
    video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    video.removeEventListener('error', handleError);
    video.src = '';
  };
}

async function uploadCourseVideoWithApiRoute(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/admin/upload/course-videos', {
    method: 'POST',
    body: formData,
  });

  const contentType = response.headers.get('content-type');
  const isJsonResponse = contentType?.includes('application/json');

  if (!isJsonResponse) {
    throw new Error(
      `El servidor devolvió una respuesta inválida (${response.status}). El archivo puede ser demasiado grande para la API route.`
    );
  }

  const result = await response.json();

  if (!response.ok) {
    const errorMessage = result.details || result.error || result.message || 'Error al subir el video';
    throw new Error(errorMessage);
  }

  if (!result.success || !result.url) {
    throw new Error('No se recibió la URL del video subido');
  }

  return result.url;
}

export async function uploadCourseVideo(
  file: File,
  onProgress: (progress: number) => void
): Promise<string> {
  onProgress(30);
  const playbackUrl = await uploadCourseVideoWithApiRoute(file);
  onProgress(100);
  return playbackUrl;
}
