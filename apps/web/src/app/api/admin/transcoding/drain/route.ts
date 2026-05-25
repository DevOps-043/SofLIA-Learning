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
  adminTranscodingDrainSchema,
  type AdminTranscodingDrainBody,
} from './schema';

export const runtime = 'nodejs';

async function handlePost(_request: NextRequest, body: AdminTranscodingDrainBody) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  if (!isTranscodingEnabled()) {
    return apiError('TRANSCODING_DISABLED', 'Transcoding esta desactivado.', 409);
  }

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

  const { count: processingCount } = await supabase
    .from('video_transcoding_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'processing');

  const slotsFree = Math.max(0, body.concurrency - (processingCount ?? 0));
  if (slotsFree === 0) {
    return NextResponse.json({
      invoked: 0,
      message: 'No hay slots libres; los jobs en processing ya ocupan la cuota.',
      success: true,
    });
  }

  const { data: queuedRows, error: queryError } = await supabase
    .from('video_transcoding_jobs')
    .select('id, source_path, source_url, bucket, content_type, size_bytes')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(slotsFree);

  if (queryError) {
    return apiError(
      'TRANSCODING_JOBS_QUERY_FAILED',
      'No se pudieron consultar jobs en cola.',
      500,
    );
  }

  if (!queuedRows || queuedRows.length === 0) {
    return NextResponse.json({
      invoked: 0,
      message: 'No hay jobs en cola.',
      success: true,
    });
  }

  const dispatchResults = await Promise.all(
    queuedRows.map((row) =>
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

  const successes = dispatchResults.filter((result) => result.ok);
  const failures = dispatchResults.filter((result) => !result.ok);

  return NextResponse.json({
    failures,
    invoked: successes.length,
    jobIds: successes.map((result) => result.jobId),
    success: true,
  });
}

export const POST = withZodBody(adminTranscodingDrainSchema, handlePost, {
  emptyBodyFallback: {},
});
