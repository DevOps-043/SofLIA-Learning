import type {
  ReadableAudioLanguage,
  ReadableAudioSourceKind,
} from '../readable-audio';

export type ReadableAudioClientStatus = 'empty' | 'queued' | 'partial' | 'ready' | 'failed';
export type ReadableAudioSegmentStatus = 'queued' | 'processing' | 'ready' | 'failed';

export interface ReadableAudioManifestSegment {
  cacheKey: string;
  status: ReadableAudioSegmentStatus;
  segmentIndex: number;
  segmentCount: number;
  textLength: number;
  charStart: number;
  charEnd: number;
  audioUrl: string;
}

export interface ReadableAudioManifest {
  sourceKind: ReadableAudioSourceKind;
  sourceId: string;
  language: ReadableAudioLanguage;
  contentHash: string;
  textLength: number;
  status: ReadableAudioClientStatus;
  segments: ReadableAudioManifestSegment[];
}

interface ReadableAudioManifestResponse {
  success?: boolean;
  manifest?: ReadableAudioManifest;
  error?: string;
}

export interface ReadableAudioManifestRequest {
  sourceKind: ReadableAudioSourceKind;
  sourceId: string;
  language: ReadableAudioLanguage;
  text: string;
}

export async function requestReadableAudioManifest(
  payload: ReadableAudioManifestRequest,
  signal?: AbortSignal,
): Promise<ReadableAudioManifest> {
  const response = await fetch('/api/tts/readable-audio/manifest', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal,
  });

  const data = (await response.json()) as ReadableAudioManifestResponse;

  if (!response.ok || data.success !== true || !data.manifest) {
    throw new Error(data.error || `Readable audio manifest error: ${response.status}`);
  }

  return data.manifest;
}
