import { createClient } from '@/lib/supabase/client';

let supabaseClient: ReturnType<typeof createClient> | null = null;
const videoUrlCache = new Map<string, string>();

export function generateVideoUrl(
  videoProvider: string,
  videoProviderId: string
): string {
  const cacheKey = `${videoProvider}:${videoProviderId}`;
  const cachedUrl = videoUrlCache.get(cacheKey);
  if (cachedUrl) {
    return cachedUrl;
  }

  const url = resolveVideoUrl(videoProvider, videoProviderId);
  if (url) {
    videoUrlCache.set(cacheKey, url);
  }

  return url;
}

function resolveVideoUrl(videoProvider: string, videoProviderId: string): string {
  if (videoProvider === 'youtube') {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `https://www.youtube.com/embed/${videoProviderId}?enablejsapi=1${origin ? `&origin=${origin}` : ''}`;
  }

  if (videoProvider === 'vimeo') {
    return `https://player.vimeo.com/video/${videoProviderId}`;
  }

  if (videoProvider === 'direct' || videoProvider === 'custom') {
    return resolveDirectVideoUrl(videoProviderId);
  }

  return '';
}

function resolveDirectVideoUrl(videoProviderId: string): string {
  if (!videoProviderId || videoProviderId.startsWith('http')) {
    return videoProviderId;
  }

  const filePath = normalizeStorageVideoPath(videoProviderId);

  try {
    const supabase = getSupabaseClient();
    const storagePath = filePath.startsWith('course-videos/')
      ? filePath.slice('course-videos/'.length)
      : filePath;
    const { data } = supabase.storage.from('course-videos').getPublicUrl(storagePath);

    return data?.publicUrl || buildSupabasePublicUrl(filePath);
  } catch {
    return buildSupabasePublicUrl(filePath);
  }
}

function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient();
  }

  return supabaseClient;
}

function normalizeStorageVideoPath(value: string): string {
  if (!value.includes('/')) {
    return `videos/${value}`;
  }

  if (!value.startsWith('course-videos/') && !value.startsWith('videos/')) {
    return `videos/${value}`;
  }

  return value;
}

function buildSupabasePublicUrl(filePath: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  if (!supabaseUrl) {
    return filePath;
  }

  const publicPath = filePath.startsWith('course-videos/')
    ? filePath
    : `course-videos/${filePath}`;

  return `${supabaseUrl}/storage/v1/object/public/${publicPath}`;
}
