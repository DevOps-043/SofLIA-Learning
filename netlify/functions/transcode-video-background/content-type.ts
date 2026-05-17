import { HLS_MANIFEST_MIME_TYPE, HLS_SEGMENT_MIME_TYPE } from './constants'

export function getContentType(filePath: string): string {
  if (filePath.endsWith('.m3u8')) return HLS_MANIFEST_MIME_TYPE
  if (filePath.endsWith('.ts')) return HLS_SEGMENT_MIME_TYPE
  return 'application/octet-stream'
}
