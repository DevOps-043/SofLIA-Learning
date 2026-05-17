import { writeFile } from 'node:fs/promises';

import type { StoredVideoInput } from './types';

export async function downloadSourceVideo(input: StoredVideoInput, inputPath: string) {
  const { data: sourceBlob, error } = await input.supabase.storage
    .from(input.bucket)
    .download(input.sourcePath);

  if (error || !sourceBlob) {
    throw new Error(error?.message || 'Unable to download source video');
  }

  const sourceBuffer = Buffer.from(await sourceBlob.arrayBuffer());
  await writeFile(inputPath, sourceBuffer);
}
