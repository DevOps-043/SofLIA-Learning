export const HLS_MANIFEST_MIME_TYPE = 'application/x-mpegURL';

export function isHlsManifestUrl(value: string): boolean {
  const path = value.split(/[?#]/, 1)[0]?.toLowerCase() ?? '';
  return path.endsWith('.m3u8');
}
