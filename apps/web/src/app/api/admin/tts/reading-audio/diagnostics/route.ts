import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth/requireAdmin';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  getConfiguredTTSProvider,
  isConfiguredTTSProviderAvailable,
  resolveProviderForContext,
} from '@/core/services/tts/server.service';
import { listReadingAudioJobs } from '@/core/services/tts/server/tts-reading-admin.service';

export const runtime = 'nodejs';

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const supabase = createAdminClient();
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  const bucketReady = Boolean(buckets?.some((bucket) => bucket.name === 'tts-audio'));
  let summary = null;
  let jobsError: string | null = null;

  try {
    summary = (await listReadingAudioJobs({ limit: 1 })).summary;
  } catch (error) {
    jobsError = error instanceof Error ? error.message : 'Error desconocido';
  }

  // Global provider drives SofLIA chat; reading pregeneration is routed separately
  // (ElevenLabs when configured) via resolveProviderForContext('reading').
  const provider = getConfiguredTTSProvider();
  const providerReady = isConfiguredTTSProviderAvailable();
  const readingProvider = resolveProviderForContext('reading');
  const readingProviderReady = isConfiguredTTSProviderAvailable('reading');
  const problems: string[] = [];
  if (!readingProviderReady) problems.push(`El proveedor de lecturas (${readingProvider}) no esta configurado.`);
  if (!bucketReady) problems.push('El bucket privado tts-audio no existe o no es accesible.');
  if (bucketError) problems.push(`No se pudieron listar buckets: ${bucketError.message}`);
  if (jobsError) problems.push(`No se pudo leer la cola: ${jobsError}`);
  if (!process.env.CRON_SECRET) problems.push('CRON_SECRET no esta configurado.');

  return NextResponse.json({
    bucketReady,
    cronSecretReady: Boolean(process.env.CRON_SECRET),
    provider,
    providerReady,
    readingProvider,
    readingProviderReady,
    summary: {
      healthy: problems.length === 0,
      problems,
    },
    totals: summary ?? { failed: 0, generating: 0, pending: 0, ready: 0 },
  });
}
