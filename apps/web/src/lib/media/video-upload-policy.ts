export const VIDEO_ASSET_CACHE_CONTROL_SECONDS = 31_536_000;
export const VIDEO_ASSET_CACHE_CONTROL = `${VIDEO_ASSET_CACHE_CONTROL_SECONDS}`;

export const COURSE_VIDEO_MAX_SIZE_BYTES = 2 * 1024 * 1024 * 1024;
export const INTRO_VIDEO_MAX_SIZE_BYTES = 500 * 1024 * 1024;

export const STREAMABLE_VIDEO_MIME_TYPES = ['video/mp4', 'video/webm'] as const;
export const STREAMABLE_VIDEO_EXTENSIONS = ['mp4', 'webm'] as const;
export const STREAMABLE_VIDEO_ACCEPT = STREAMABLE_VIDEO_MIME_TYPES.join(',');

export type StreamableVideoMimeType = (typeof STREAMABLE_VIDEO_MIME_TYPES)[number];

export function isStreamableVideoMimeType(
  mimeType: string
): mimeType is StreamableVideoMimeType {
  return STREAMABLE_VIDEO_MIME_TYPES.includes(
    mimeType as StreamableVideoMimeType
  );
}

export function isStreamableVideoExtension(extension: string): boolean {
  return STREAMABLE_VIDEO_EXTENSIONS.includes(
    extension.toLowerCase() as (typeof STREAMABLE_VIDEO_EXTENSIONS)[number]
  );
}
