import type { AdaptiveVideoProcessingResult, StoredVideoInput } from './types';

export function createPassthroughResult(
  input: StoredVideoInput,
  status: AdaptiveVideoProcessingResult['status'],
  reason?: string,
): AdaptiveVideoProcessingResult {
  return {
    playbackPath: input.sourcePath,
    playbackUrl: input.publicUrl,
    reason,
    sourcePath: input.sourcePath,
    sourceUrl: input.publicUrl,
    status,
    variants: [],
  };
}
