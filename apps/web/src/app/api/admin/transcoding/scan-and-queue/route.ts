import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import {
  isTranscodingEnabled,
  triggerTranscodingBackground,
} from '@/lib/media/server/transcoding-dispatcher.server';

import {
  adminTranscodingScanAndQueueSchema,
  type AdminTranscodingScanAndQueueBody,
} from './schema';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface StorageObject {
  name: string;
  metadata: { size?: number; mimetype?: string } | null;
}

const MP4_EXTENSIONS = ['.mp4', '.webm', '.mov', '.m4v'];

function isVideoFile(name: string): boolean {
  const lower = name.toLowerCase();
  return MP4_EXTENSIONS.some((extension) => lower.endsWith(extension));
}

function guessContentType(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith('.webm')) return 'video/webm';
  if (lower.endsWith('.mov') || lower.endsWith('.m4v')) return 'video/quicktime';
  return 'video/mp4';
}

async function handlePost(_request: NextRequest, body: AdminTranscodingScanAndQueueBody) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  if (!isTranscodingEnabled()) {
    return apiError(
      'TRANSCODING_DISABLED',
      'Transcoding esta desactivado en produccion.',
      409,
    );
  }

  const { bucket, folder, concurrency } = body;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    return apiError(
      'SERVER_CONFIGURATION_INCOMPLETE',
      'Configuracion del servidor incompleta.',
      500,
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const all: StorageObject[] = [];
  let offset = 0;
  const pageSize = 100;

  while (true) {
    const { data: page, error: listError } = await supabase.storage
      .from(bucket)
      .list(folder, { limit: pageSize, offset });

    if (listError) {
      return apiError(
        'TRANSCODING_BUCKET_LIST_FAILED',
        'No se pudo listar el bucket.',
        500,
      );
    }

    if (!page || page.length === 0) break;
    for (const entry of page) {
      if (isVideoFile(entry.name)) {
        all.push({ name: entry.name, metadata: (entry.metadata ?? null) as StorageObject['metadata'] });
      }
    }
    if (page.length < pageSize) break;
    offset += pageSize;
  }

  if (all.length === 0) {
    return NextResponse.json({
      alreadyDone: 0,
      invoked: 0,
      jobIds: [],
      queued: 0,
      success: true,
      totalFound: 0,
    });
  }

  const sourcePaths = all.map((entry) => `${folder}/${entry.name}`);
  const { data: existing, error: existingError } = await supabase
    .from('video_transcoding_jobs')
    .select('source_path, status')
    .eq('bucket', bucket)
    .in('source_path', sourcePaths);

  if (existingError) {
    return apiError(
      'TRANSCODING_EXISTING_JOBS_QUERY_FAILED',
      'No se pudieron consultar jobs existentes.',
      500,
    );
  }

  const skipSet = new Set(
    (existing ?? [])
      .filter((row) =>
        row.status === 'completed' ||
        row.status === 'processing' ||
        row.status === 'queued',
      )
      .map((row) => row.source_path),
  );

  const pending = all.filter((entry) => !skipSet.has(`${folder}/${entry.name}`));

  if (pending.length === 0) {
    return NextResponse.json({
      alreadyDone: skipSet.size,
      invoked: 0,
      jobIds: [],
      queued: 0,
      success: true,
      totalFound: all.length,
    });
  }

  const rowsToInsert = pending.map((entry) => {
    const sourcePath = `${folder}/${entry.name}`;
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(sourcePath);
    return {
      bucket,
      content_type:
        (entry.metadata?.mimetype as string | undefined) ??
        guessContentType(entry.name),
      size_bytes: entry.metadata?.size ?? null,
      source_path: sourcePath,
      source_url: urlData?.publicUrl ?? '',
      status: 'queued' as const,
    };
  });

  const { data: insertedRows, error: insertError } = await supabase
    .from('video_transcoding_jobs')
    .insert(rowsToInsert)
    .select('id, source_path, source_url, bucket, content_type, size_bytes');

  if (insertError || !insertedRows) {
    return apiError(
      'TRANSCODING_JOBS_QUEUE_FAILED',
      'No se pudieron encolar los jobs.',
      500,
    );
  }

  const toInvoke = insertedRows.slice(0, concurrency);
  const dispatchResults = await Promise.all(
    toInvoke.map((row) =>
      triggerTranscodingBackground({
        bucket: row.bucket,
        contentType: row.content_type,
        jobId: row.id,
        sizeBytes: row.size_bytes,
        sourcePath: row.source_path,
        sourceUrl: row.source_url,
      }),
    ),
  );
  const invokedCount = dispatchResults.filter((result) => result.ok).length;
  const failures = dispatchResults.filter((result) => !result.ok);

  return NextResponse.json({
    alreadyDone: skipSet.size,
    failures,
    invoked: invokedCount,
    jobIds: insertedRows.map((row) => row.id),
    queued: insertedRows.length,
    success: true,
    totalFound: all.length,
  });
}

export const POST = withZodBody(adminTranscodingScanAndQueueSchema, handlePost, {
  emptyBodyFallback: {},
});
