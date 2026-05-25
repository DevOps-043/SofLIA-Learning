import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { createClient } from '@supabase/supabase-js';
import {
  UPLOAD_MAX_RETRIES,
  VIDEO_ASSET_CACHE_CONTROL
} from './constants';
import { getContentType, joinStoragePath } from './path-utils';

type SupabaseClient = ReturnType<typeof createClient>;

export async function listFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const fullPath = path.join(dir, entry.name);
      return entry.isDirectory() ? listFiles(fullPath) : Promise.resolve([fullPath]);
    })
  );

  return nested.flat();
}

export async function uploadHlsDirectory(
  supabase: SupabaseClient,
  bucket: string,
  outputRoot: string,
  storageRoot: string
) {
  const files = await listFiles(outputRoot);

  for (const filePath of files) {
    const relativePath = path.relative(outputRoot, filePath).split(path.sep).join('/');
    const destination = joinStoragePath(storageRoot, relativePath);
    const body = await readFile(filePath);
    const contentType = getContentType(filePath);
    await uploadWithRetry(supabase, bucket, destination, body, contentType);
  }
}

async function uploadWithRetry(
  supabase: SupabaseClient,
  bucket: string,
  destination: string,
  body: Buffer,
  contentType: string
) {
  let lastError: string | null = null;

  for (let attempt = 0; attempt <= UPLOAD_MAX_RETRIES; attempt += 1) {
    try {
      const { error } = await supabase.storage.from(bucket).upload(destination, body, {
        cacheControl: VIDEO_ASSET_CACHE_CONTROL,
        contentType,
        upsert: true
      });
      if (!error) return;
      lastError = error.message;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    if (attempt < UPLOAD_MAX_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1) * (attempt + 1)));
    }
  }

  const sizeKb = Math.round(body.length / 1024);
  throw new Error(`Upload failed for ${destination} (${sizeKb} KB, ${contentType}) after ${UPLOAD_MAX_RETRIES + 1} attempts: ${lastError ?? 'unknown'}`);
}
