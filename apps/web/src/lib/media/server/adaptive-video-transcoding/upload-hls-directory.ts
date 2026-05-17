import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import type { SupabaseClient } from '@supabase/supabase-js';

import { VIDEO_ASSET_CACHE_CONTROL } from '@/lib/media';
import { getContentType } from './constants';
import { joinStoragePath } from './storage-paths';

async function listFilesRecursive(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? listFilesRecursive(entryPath) : [entryPath];
    }),
  );

  return nestedFiles.flat();
}

export async function uploadHlsDirectory({
  bucket,
  outputRoot,
  storageRoot,
  supabase,
}: {
  bucket: string;
  outputRoot: string;
  storageRoot: string;
  supabase: SupabaseClient;
}) {
  const files = await listFilesRecursive(outputRoot);

  for (const filePath of files) {
    const relativePath = path.relative(outputRoot, filePath).split(path.sep).join('/');
    const storagePath = joinStoragePath(storageRoot, relativePath);
    const body = await readFile(filePath);
    const { error } = await supabase.storage.from(bucket).upload(storagePath, body, {
      cacheControl: VIDEO_ASSET_CACHE_CONTROL,
      contentType: getContentType(filePath),
      upsert: true,
    });

    if (error) {
      throw new Error(`Unable to upload HLS asset ${storagePath}: ${error.message}`);
    }
  }
}
