import {
  HLS_MANIFEST_MIME_TYPE,
  HLS_SEGMENT_MIME_TYPE
} from './constants';

export function even(n: number): number {
  return Math.max(2, Math.round(n / 2) * 2);
}

export function joinStoragePath(...parts: string[]): string {
  return parts
    .map((part) => part.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/');
}

export function getStorageDirectory(filePath: string): string {
  const normalizedPath = filePath.replace(/\\/g, '/');
  const index = normalizedPath.lastIndexOf('/');
  return index >= 0 ? normalizedPath.slice(0, index) : '';
}

export function getStorageBasename(filePath: string): string {
  const normalizedPath = filePath.replace(/\\/g, '/');
  const index = normalizedPath.lastIndexOf('/');
  return index >= 0 ? normalizedPath.slice(index + 1) : normalizedPath;
}

export function stripExtension(name: string): string {
  const index = name.lastIndexOf('.');
  return index >= 0 ? name.slice(0, index) : name;
}

export function getContentType(filePath: string): string {
  if (filePath.endsWith('.m3u8')) return HLS_MANIFEST_MIME_TYPE;
  if (filePath.endsWith('.ts')) return HLS_SEGMENT_MIME_TYPE;
  return 'application/octet-stream';
}
