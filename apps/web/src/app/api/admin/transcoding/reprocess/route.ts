import { NextRequest, NextResponse } from 'next/server';

import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import {
  dispatchTranscodingJob,
  isTranscodingEnabled,
} from '@/lib/media/server/transcoding-dispatcher.server';

import {
  createTranscodingSupabaseClient,
  getPublicSourceUrl,
  readSourceSizeBytes,
} from './reprocess-transcoding.helpers';
import {
  adminTranscodingReprocessSchema,
  type AdminTranscodingReprocessBody,
} from './schema';

export const runtime = 'nodejs';
export const maxDuration = 30;

async function handlePost(_request: NextRequest, body: AdminTranscodingReprocessBody) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  if (!isTranscodingEnabled()) {
    return apiError(
      'TRANSCODING_DISABLED',
      'Transcoding esta desactivado en produccion.',
      409,
    );
  }

  const { sourcePath, bucket, contentType } = body;
  const supabase = createTranscodingSupabaseClient();

  if (!supabase) {
    return apiError(
      'SERVER_CONFIGURATION_INCOMPLETE',
      'Configuracion del servidor incompleta.',
      500,
    );
  }

  const publicSourceUrl = getPublicSourceUrl(supabase, bucket, sourcePath);

  if (!publicSourceUrl) {
    return apiError(
      'TRANSCODING_SOURCE_URL_UNRESOLVED',
      'No se pudo resolver la URL publica del video.',
      400,
    );
  }

  const sizeBytes = await readSourceSizeBytes(supabase, bucket, sourcePath);
  const result = await dispatchTranscodingJob({
    bucket,
    contentType,
    sizeBytes,
    sourcePath,
    sourceUrl: publicSourceUrl,
    supabase,
  });

  return NextResponse.json({
    jobId: result.jobId ?? null,
    sourcePath,
    sourceUrl: publicSourceUrl,
    status: result.status,
    success: true,
  });
}

export const POST = withZodBody(adminTranscodingReprocessSchema, handlePost);
