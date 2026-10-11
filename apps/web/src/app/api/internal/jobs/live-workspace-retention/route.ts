import { timingSafeEqual } from 'node:crypto';
import { NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import type { LiveDatabase } from '@/features/live/database.types';
import { handleLive, json, checked, LiveError } from '@/features/live/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
  return handleLive(async () => {
    const secret = process.env.QUEUE_INTERNAL_SECRET;
    if (!secret) throw new LiveError(503, 'La tarea de retención no está configurada');
    const expected = Buffer.from(`Bearer ${secret}`);
    const supplied = Buffer.from(request.headers.get('authorization') || '');
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) throw new LiveError(401, 'Tarea no autorizada');
    const db = createAdminClient() as unknown as SupabaseClient<LiveDatabase>;
    checked(await db.rpc('live_workspace_purge', {}));
    return json({ success: true });
  });
}
