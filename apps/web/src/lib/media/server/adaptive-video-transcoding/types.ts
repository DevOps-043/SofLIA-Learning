import type { SupabaseClient } from '@supabase/supabase-js';

export interface StoredVideoInput {
  bucket: string;
  contentType: string;
  publicUrl: string;
  sizeBytes?: number;
  sourcePath: string;
  supabase: SupabaseClient;
}

export interface VideoStreamInfo {
  height: number;
  width: number;
}

export interface HlsRendition {
  bandwidth: number;
  bufsize: string;
  height: number;
  maxrate: string;
  name: string;
  videoBitrate: string;
}

export interface AdaptiveVideoVariant {
  bandwidth: number;
  height: number;
  path: string;
  width: number;
}

export interface AdaptiveVideoProcessingResult {
  playbackPath: string;
  playbackUrl: string;
  reason?: string;
  sourcePath: string;
  sourceUrl: string;
  status: 'disabled' | 'failed' | 'ready' | 'skipped';
  variants: AdaptiveVideoVariant[];
}
