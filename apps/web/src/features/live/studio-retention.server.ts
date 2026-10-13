import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { LiveDatabase } from './database.types';
import { checked } from './errors';
import { STUDIO_ASSET_BUCKET } from './studio-assets.server';

/** Un lote por ejecución; un fallo de Storage deja reclamaciones para reintento. */
export async function purgeStudioAssets(db: SupabaseClient<LiveDatabase>) {
  const paths = checked(await db.rpc('live_studio_claim_asset_gc', { p_limit: 100 })) ?? [];
  if (!paths.length) return 0;
  checked(await db.storage.from(STUDIO_ASSET_BUCKET).remove(paths));
  checked(await db.from('live_studio_assets').delete().in('path', paths).eq('status', 'purging'));
  return paths.length;
}
